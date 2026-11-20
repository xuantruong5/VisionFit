<?php

namespace App\Http\Controllers;
use App\Http\Requests\Admin\GuiThuMoiPhongVanRequest;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use App\Jobs\SendMailJob;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use App\Models\Trainer;
use App\Models\Client;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

class AdminController extends Controller
{
    public function loginAdmin(Request $request)
    {
        $check = Auth::guard('admin')->attempt([
            'email'     => $request->email,
            'password'  => $request->password
        ]);

        if ($check) {
            $admin = Auth::guard('admin')->user();
            if ($admin->tinh_trang == 0) {
                return response()->json([
                    'status'    => false,
                    'message'   => "Tài khoản của bạn đã bị khóa hoặc chưa được kích hoạt!",
                ]);
            }

            return response()->json([
                'status'    => true,
                'message'   => "Đã đăng nhập thành công!",
                'token'     => $admin->createToken('token_admin')->plainTextToken,
                'ho_ten'    => $admin->ho_ten,
                'email'     => $admin->email,
                'hinh_anh'  => $admin->hinh_anh,
                'is_master' => $admin->is_master,
            ]);
        } else {
            return response()->json([
                'status'    => false,
                'message'   => "Tài khoản hoặc mật khẩu không đúng!",
            ]);
        }
    }

    public function checkTokenAdmin()
    {
        $user = Auth::guard('sanctum')->user();
        if ($user && $user instanceof \App\Models\Admin) {
            if ($user->tinh_trang == 0) {
                return response()->json([
                    'status'    => false,
                    'message'   => "Tài khoản của bạn đã bị khóa!",
                ]);
            }

            return response()->json([
                'status'    => true,
                'ho_ten'    => $user->ho_ten,
                'email'     => $user->email,
                'hinh_anh'  => $user->hinh_anh,
                'is_master' => $user->is_master,
            ]);
        } else {
            return response()->json([
                'status'  => false,
                'message' => 'Bạn cần đăng nhập hệ thống!',
            ]);
        }
    }

    public function logoutAdmin()
    {
        $user = Auth::guard('sanctum')->user();
        if ($user && $user->currentAccessToken()) {
            DB::table('personal_access_tokens')
                ->where('id', $user->currentAccessToken()->id)
                ->delete();
            return response()->json([
                'status'  => true,
                'message' => "Đăng xuất thành công",
            ]);
        } else {
            return response()->json([
                'status'  => false,
                'message' => "Có lỗi xảy ra",
            ]);
        }
    }



    public function danhSachUngVien()
    {
        $ungViens = Trainer::leftJoin( 'trainers as nguoi_gioi_thieu', 'trainers.id_trainer_gioi_thieu', '=', 'nguoi_gioi_thieu.id' )
            ->select(
                'trainers.id',
                'trainers.ho_ten',
                'trainers.email',
                'trainers.cv',
                'trainers.created_at',
                'trainers.ngay_phong_van',
                'trainers.dia_chi_test',
                'trainers.trang_thai_tuyen_dung',
                'nguoi_gioi_thieu.ho_ten as ten_nguoi_gioi_thieu',
                'nguoi_gioi_thieu.ma_gioi_thieu as ma_nguoi_gioi_thieu'
            )
            ->whereNotNull('trainers.cv')
            ->where('trainers.cv', '!=', '')
            ->where(function ($query) {
                $query->whereNull('trainers.ma_gioi_thieu')
                    ->orWhere('trainers.ma_gioi_thieu', '');
            })
            ->orderByDesc('trainers.created_at')
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Lấy danh sách ứng viên thành công.',
            'data' => $ungViens->map(function ($item) {
                return [
                    'id' => $item->id,
                    'ma_ung_vien' => 'APP-' . str_pad($item->id, 2, '0', STR_PAD_LEFT),
                    'ho_ten' => $item->ho_ten,
                    'email' => $item->email,
                    'nguoi_gioi_thieu' => $item->ten_nguoi_gioi_thieu,
                    'ma_gioi_thieu' => $item->ma_nguoi_gioi_thieu,
                    'ngay_dang_ky' => $item->created_at ? Carbon::parse($item->created_at)->format('j \t\h\á\n\g n \n\ă\m Y') : null,
                    'ngay_phong_van' => $item->ngay_phong_van,
                    'dia_chi_test' => $item->dia_chi_test,
                    'trang_thai_tuyen_dung' => $item->trang_thai_tuyen_dung,
                    'cv_url' => asset('storage/' . $item->cv),
                ];
            })
        ]);
    }



    public function guiThuMoiPhongVan(GuiThuMoiPhongVanRequest $request)
    {
        $validated = $request->validated();

        $trainer = Trainer::where('email', $validated['email'])->first();

        if (!$trainer) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy ứng viên PT.'
            ], 404);
        }
        $ngayPhongVan = Carbon::createFromFormat('Y-m-d\TH:i', $validated['thoi_gian']);


        $data = [
            'ho_ten' => $validated['ho_ten'],
            'thoi_gian' => $ngayPhongVan->format('H:i'). ' ngày '. $ngayPhongVan->format('d/m/Y'),
            'dia_chi' => $validated['dia_chi'],
            'ghi_chu' => $validated['ghi_chu'] ?? '',
        ];
        $tieuDe = '[VisionFit] Thư mời phỏng vấn & Kiểm tra kỹ năng HLV thể hình';

        SendMailJob::dispatch( $data, 'trainer-interview', $tieuDe, $validated['email']);
        $trainer->update([
            'trang_thai_tuyen_dung' => Trainer::DAGUIPHONGVAN,
            'ngay_phong_van' => $validated['thoi_gian'],
            'dia_chi_test' => $validated['dia_chi'],

        ]);

        return response()->json([
            'success' => true,
            'message' => 'Đã đưa thư mời vào hàng đợi gửi email.'
        ]);
    }


    public function capNhatKetQuaPhongVan(Request $request, $id)
    {
        $validated = $request->validate([
            'trang_thai_tuyen_dung' => 'required|integer|in:2,3',
        ]);
        $trainer = Trainer::find($id);
        if (!$trainer) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy ứng viên PT.',
            ], 404);
        }
        // Chỉ cập nhật trạng thái phỏng vấn
        $trainer->update([
            'trang_thai_tuyen_dung' => $validated['trang_thai_tuyen_dung'],
        ]);
        return response()->json([
            'success' => true,
            'message' => 'Cập nhật trạng thái phỏng vấn thành công.',
            'data' => [
                'id' => $trainer->id,
                'trang_thai_tuyen_dung' => $trainer->trang_thai_tuyen_dung,
            ],
        ]);
    }

    public function kichHoatTrainer(Request $request, $id)
    {
        $trainer = Trainer::find($id);
        if (!$trainer) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy ứng viên PT.',
            ], 404);
        }
        // Chỉ kích hoạt ứng viên đã đậu phỏng vấn
        if ($trainer->trang_thai_tuyen_dung != Trainer::DATPHONGVAN) {
            return response()->json([
                'success' => false,
                'message' => 'Ứng viên chưa đạt phỏng vấn, không thể kích hoạt.',
            ], 422);
        }

        // Kiểm tra đã kích hoạt chưa
        if ($trainer->is_active == Trainer::DAKICHHOAT) {
            return response()->json([
                'success' => false,
                'message' => 'Trainer đã được kích hoạt trước đó.',
            ], 422);
        }
        // Tạo mã giới thiệu dựa trên ID
        $maGioiThieu = 'PT' . str_pad( $trainer->id, 6,'0', STR_PAD_LEFT );
        // Cập nhật thông tin kích hoạt
        $trainer->update([
            'ma_gioi_thieu' => $maGioiThieu,
            'is_active' => Trainer::DAKICHHOAT,
            'tinh_trang' => Trainer::DANGHOATDONG,
        ]);
        $data = [
            'ho_ten' => $trainer->ho_ten,
            'email' => $trainer->email,
            'ma_gioi_thieu' => $maGioiThieu,
        ];
        dispatch(new SendMailJob( $data, 'trainer-kich-hoat', 'Chúc mừng! Tài khoản huấn luyện viên VisionFit đã được kích hoạt', $trainer->email));
        return response()->json([
            'success' => true,
            'message' => 'Kích hoạt tài khoản PT thành công.',
            'data' => [
                'id' => $trainer->id,
                'ho_ten' => $trainer->ho_ten,
                'ma_gioi_thieu' => $trainer->ma_gioi_thieu,
                'is_active' => $trainer->is_active,
                'tinh_trang' => $trainer->tinh_trang,
                'trang_thai_tuyen_dung' => $trainer->trang_thai_tuyen_dung,
            ],
        ]);
    }

    /**
     * Lấy danh sách Gymmer (Hội viên) cho trang quản trị
     */
    public function danhSachGymmer(Request $request)
    {
        $keyword = $request->input('keyword');

        $query = Client::orderByDesc('id');

        if ($keyword) {
            $query->where(function ($q) use ($keyword) {
                $q->where('ho_ten', 'like', "%{$keyword}%")
                  ->orWhere('email', 'like', "%{$keyword}%")
                  ->orWhere('so_dien_thoai', 'like', "%{$keyword}%");
            });
        }

        $clients = $query->get();

        $data = $clients->map(function ($client) {
            // Lấy thông tin gói tập và HLV gần nhất nếu có
            $sub = DB::table('dang_ky_goi as dk')
                ->join('chi_tiet_dang_ky_goi as ct', 'dk.id', '=', 'ct.id_dang_ky_goi')
                ->leftJoin('goi_tap as g', 'ct.id_goi_tap', '=', 'g.id')
                ->leftJoin('trainers as t', 'ct.id_trainer', '=', 't.id')
                ->where('dk.id_hoi_vien', $client->id)
                ->select('g.ten_goi_tap', 't.ho_ten as trainer_name', 'ct.ngay_ket_thuc')
                ->orderByDesc('ct.id')
                ->first();

            $sapHetHan = false;
            if ($sub && $sub->ngay_ket_thuc) {
                $days = Carbon::now()->diffInDays(Carbon::parse($sub->ngay_ket_thuc), false);
                $sapHetHan = ($days >= 0 && $days <= 7);
            }

            return [
                'id' => str_pad($client->id, 5, '0', STR_PAD_LEFT),
                'raw_id' => $client->id,
                'ho_ten' => $client->ho_ten,
                'email' => $client->email,
                'so_dien_thoai' => $client->so_dien_thoai,
                'ngay_sinh' => $client->ngay_sinh,
                'gioi_tinh' => $client->gioi_tinh,
                'goi_tap' => $sub ? $sub->ten_goi_tap : null,
                'trainer' => $sub ? $sub->trainer_name : null,
                'phien_ai' => 0,
                'trang_thai' => ($client->is_block == 1 || $client->tinh_trang == 0) ? 'inactive' : 'active',
                'sap_het_han' => $sapHetHan,
                'ngay_tao' => $client->created_at ? Carbon::parse($client->created_at)->format('d/m/Y') : null,
            ];
        });

        return response()->json([
            'status' => true,
            'success' => true,
            'message' => 'Lấy danh sách gymmer thành công.',
            'data' => $data,
        ]);
    }

    /**
     * Thêm mới Gymmer từ trang quản trị
     */
    public function themMoiGymmer(Request $request)
    {
        $request->validate([
            'ho_ten' => 'required|string|max:255',
            'email' => 'required|email|unique:clients,email',
            'so_dien_thoai' => 'nullable|string|max:20',
            'ngay_sinh' => 'nullable|date',
            'gioi_tinh' => 'nullable|string',
        ], [
            'ho_ten.required' => 'Vui lòng nhập họ tên gymmer.',
            'email.required' => 'Vui lòng nhập email.',
            'email.unique' => 'Email này đã tồn tại trong hệ thống.',
        ]);

        $maGioiThieu = 'VF' . strtoupper(substr(md5(uniqid()), 0, 6));

        $client = Client::create([
            'id_phong_tap' => 1,
            'ho_ten' => trim($request->ho_ten),
            'email' => trim($request->email),
            'password' => Hash::make('123456'),
            'so_dien_thoai' => $request->so_dien_thoai,
            'ngay_sinh' => $request->ngay_sinh,
            'gioi_tinh' => $request->gioi_tinh === 'Nữ' ? 1 : 0,
            'ma_gioi_thieu' => $maGioiThieu,
            'tinh_trang' => 1,
            'is_active' => 1,
            'is_block' => 0,
        ]);

        return response()->json([
            'status' => true,
            'success' => true,
            'message' => 'Thêm gymmer mới thành công. Mật khẩu mặc định là: 123456',
            'data' => $client,
        ]);
    }

    /**
     * Khóa / Mở khóa tài khoản Gymmer
     */
    public function doiTrangThaiGymmer($id)
    {
        $client = Client::find($id);
        if (!$client) {
            return response()->json([
                'status' => false,
                'success' => false,
                'message' => 'Không tìm thấy gymmer.',
            ], 404);
        }

        $newBlock = $client->is_block == 1 ? 0 : 1;
        $client->update([
            'is_block' => $newBlock,
            'tinh_trang' => $newBlock == 1 ? 0 : 1,
        ]);

        return response()->json([
            'status' => true,
            'success' => true,
            'message' => $newBlock == 1 ? 'Đã khóa tài khoản gymmer.' : 'Đã mở khóa tài khoản gymmer.',
            'trang_thai' => $newBlock == 1 ? 'inactive' : 'active',
        ]);
    }

    /**
     * Lấy chi tiết hồ sơ Gymmer cho trang quản trị
     */
    public function chiTietGymmer($id)
    {
        $client = Client::find($id);
        if (!$client) {
            return response()->json([
                'status' => false,
                'success' => false,
                'message' => 'Không tìm thấy gymmer.',
            ], 404);
        }

        // Thông tin gói và HLV
        $sub = DB::table('dang_ky_goi as dk')
            ->join('chi_tiet_dang_ky_goi as ct', 'dk.id', '=', 'ct.id_dang_ky_goi')
            ->leftJoin('goi_tap as g', 'ct.id_goi_tap', '=', 'g.id')
            ->leftJoin('trainers as t', 'ct.id_trainer', '=', 't.id')
            ->where('dk.id_hoi_vien', $client->id)
            ->select('g.ten_goi_tap', 'g.gia', 'ct.ngay_bat_dau', 'ct.ngay_ket_thuc', 't.ho_ten as trainer_name')
            ->orderByDesc('ct.id')
            ->first();

        // Lịch sử hóa đơn
        $invoices = DB::table('dang_ky_goi as dk')
            ->join('chi_tiet_dang_ky_goi as ct', 'dk.id', '=', 'ct.id_dang_ky_goi')
            ->leftJoin('goi_tap as g', 'ct.id_goi_tap', '=', 'g.id')
            ->where('dk.id_hoi_vien', $client->id)
            ->select('dk.id', 'g.ten_goi_tap', 'dk.ngay_dang_ky', 'dk.tong_tien', 'dk.is_thanh_toan')
            ->orderByDesc('dk.id')
            ->get();

        return response()->json([
            'status' => true,
            'success' => true,
            'data' => [
                'client' => $client,
                'subscription' => $sub,
                'invoices' => $invoices,
            ],
        ]);
    }

    /**
     * Cập nhật thông tin Gymmer (Hội viên)
     */
    public function capNhatGymmer(Request $request, $id)
    {
        $client = Client::find($id);
        if (!$client) {
            return response()->json([
                'status'  => false,
                'success' => false,
                'message' => 'Không tìm thấy gymmer.',
            ], 404);
        }

        $request->validate([
            'ho_ten'            => 'required|string|max:255',
            'email'             => 'required|email|unique:clients,email,' . $client->id,
            'so_dien_thoai'     => 'nullable|string|max:20',
            'chieu_cao_cm'      => 'nullable|numeric|min:30|max:250',
            'can_nang_kg'       => 'nullable|numeric|min:20|max:300',
            'muc_tieu_hien_tai' => 'nullable|string|max:255',
        ]);

        $data = $request->only([
            'ho_ten', 'email', 'so_dien_thoai', 'chieu_cao_cm', 'can_nang_kg', 'muc_tieu_hien_tai'
        ]);

        if ($request->filled('ngay_sinh')) {
            $data['ngay_sinh'] = Carbon::parse($request->ngay_sinh)->format('Y-m-d');
        }

        if ($request->has('gioi_tinh')) {
            $raw = trim((string)$request->gioi_tinh);
            $data['gioi_tinh'] = ($raw === 'Nam' || $raw === '0') ? 0 : 1;
        }

        $client->update($data);

        return response()->json([
            'status'  => true,
            'success' => true,
            'message' => 'Cập nhật thông tin gymmer thành công!',
            'data'    => $client->fresh(),
        ]);
    }

    /**
     * Lấy danh sách Huấn luyện viên chính thức cho trang Admin
     */
    public function danhSachTrainer(Request $request)
    {
        $keyword = trim($request->search ?? '');
        $specialty = trim($request->specialty ?? '');
        $status = trim($request->status ?? '');

        $query = Trainer::query()
            ->where(function ($q) {
                $q->where('is_active', Trainer::DAKICHHOAT)
                  ->orWhere(function ($sub) {
                      $sub->whereNotNull('ma_gioi_thieu')->where('ma_gioi_thieu', '!=', '');
                  });
            })
            ->orderByDesc('id');

        if ($keyword) {
            $query->where(function ($q) use ($keyword) {
                $q->where('ho_ten', 'like', "%{$keyword}%")
                  ->orWhere('email', 'like', "%{$keyword}%")
                  ->orWhere('so_dien_thoai', 'like', "%{$keyword}%")
                  ->orWhere('ma_gioi_thieu', 'like', "%{$keyword}%");
            });
        }

        if ($specialty) {
            $query->where('chuyen_mon', 'like', "%{$specialty}%");
        }

        $trainers = $query->get();

        // Lấy số lượng gymmer phụ trách theo từng HLV
        $gymmerCounts = DB::table('chi_tiet_dang_ky_goi as ct')
            ->join('dang_ky_goi as dk', 'ct.id_dang_ky_goi', '=', 'dk.id')
            ->whereNotNull('ct.id_trainer')
            ->select('ct.id_trainer', DB::raw('count(distinct dk.id_hoi_vien) as total'))
            ->groupBy('ct.id_trainer')
            ->pluck('total', 'id_trainer');

        $data = $trainers->map(function ($tr) use ($gymmerCounts) {
            $isActive = ($tr->tinh_trang == Trainer::DANGHOATDONG && $tr->is_block != Trainer::DAKHOA);
            return [
                'id' => str_pad($tr->id, 4, '0', STR_PAD_LEFT),
                'raw_id' => $tr->id,
                'ho_ten' => $tr->ho_ten,
                'email' => $tr->email,
                'so_dien_thoai' => $tr->so_dien_thoai ?? 'Chưa cập nhật',
                'chuyen_mon' => $tr->chuyen_mon ?? 'Fitness',
                'kinh_nghiem' => (int)($tr->so_nam_kinh_nghiem ?? 1),
                'so_gymmer' => (int)($gymmerCounts[$tr->id] ?? 0),
                'so_review' => 0,
                'trang_thai' => $isActive ? 'active' : 'inactive',
                'ma_gioi_thieu' => $tr->ma_gioi_thieu,
                'mo_ta' => $tr->mo_ta,
            ];
        });

        if ($status) {
            $data = $data->filter(fn($t) => $t['trang_thai'] === $status)->values();
        }

        return response()->json([
            'status' => true,
            'success' => true,
            'message' => 'Lấy danh sách Huấn luyện viên thành công.',
            'data' => $data,
        ]);
    }

    /**
     * Thêm mới Huấn luyện viên từ trang quản trị
     */
    public function themMoiTrainer(Request $request)
    {
        $request->validate([
            'ho_ten'        => 'required|string|max:255',
            'email'         => 'required|email|unique:trainers,email',
            'so_dien_thoai' => 'nullable|string|max:20',
            'chuyen_mon'    => 'nullable|string|max:255',
            'kinh_nghiem'   => 'nullable|numeric|min:0|max:50',
            'mo_ta'         => 'nullable|string|max:1000',
        ], [
            'ho_ten.required' => 'Vui lòng nhập họ và tên HLV.',
            'email.required'  => 'Vui lòng nhập email.',
            'email.email'     => 'Email không đúng định dạng.',
            'email.unique'    => 'Email này đã được sử dụng.',
        ]);

        $trainer = Trainer::create([
            'ho_ten'              => trim($request->ho_ten),
            'email'               => trim($request->email),
            'password'            => Hash::make('123456'),
            'so_dien_thoai'       => $request->so_dien_thoai,
            'chuyen_mon'          => $request->chuyen_mon ?? 'Fitness',
            'so_nam_kinh_nghiem'  => $request->kinh_nghiem ?? 1,
            'mo_ta'               => $request->mo_ta,
            'is_active'           => Trainer::DAKICHHOAT,
            'tinh_trang'          => Trainer::DANGHOATDONG,
            'is_block'            => Trainer::KHONGKHOA,
            'trang_thai_tuyen_dung' => Trainer::DATPHONGVAN,
        ]);

        $maGioiThieu = 'PT' . str_pad($trainer->id, 6, '0', STR_PAD_LEFT);
        $trainer->update(['ma_gioi_thieu' => $maGioiThieu]);

        return response()->json([
            'status' => true,
            'success' => true,
            'message' => 'Thêm Huấn luyện viên mới thành công! Mật khẩu mặc định là: 123456',
            'data' => $trainer->fresh(),
        ]);
    }

    /**
     * Khóa / Mở khóa tài khoản Huấn luyện viên
     */
    public function doiTrangThaiTrainer($id)
    {
        $trainer = Trainer::find($id);
        if (!$trainer) {
            return response()->json([
                'status' => false,
                'success' => false,
                'message' => 'Không tìm thấy Huấn luyện viên.',
            ], 404);
        }

        $newBlock = ($trainer->is_block == 1 || $trainer->tinh_trang == 0) ? 0 : 1;
        $trainer->update([
            'is_block' => $newBlock,
            'tinh_trang' => $newBlock == 1 ? 0 : 1,
        ]);

        $statusStr = $newBlock == 1 ? 'inactive' : 'active';
        return response()->json([
            'status' => true,
            'success' => true,
            'message' => $newBlock == 1 ? 'Đã khóa tài khoản Huấn luyện viên.' : 'Đã mở khóa tài khoản Huấn luyện viên.',
            'trang_thai' => $statusStr,
        ]);
    }

    /**
     * Lấy chi tiết Huấn luyện viên cho trang Admin
     */
    public function chiTietTrainer($id)
    {
        $trainer = Trainer::find($id);
        if (!$trainer) {
            return response()->json([
                'status' => false,
                'success' => false,
                'message' => 'Không tìm thấy Huấn luyện viên.',
            ], 404);
        }

        // Lấy danh sách học viên đang phụ trách
        $members = DB::table('chi_tiet_dang_ky_goi as ct')
            ->join('dang_ky_goi as dk', 'ct.id_dang_ky_goi', '=', 'dk.id')
            ->join('clients as c', 'dk.id_hoi_vien', '=', 'c.id')
            ->leftJoin('goi_tap as g', 'ct.id_goi_tap', '=', 'g.id')
            ->where('ct.id_trainer', $trainer->id)
            ->select(
                'c.id',
                'c.ho_ten as name',
                'c.email',
                'c.so_dien_thoai',
                'g.ten_goi_tap as package',
                'ct.ngay_bat_dau',
                'ct.ngay_ket_thuc',
                'c.is_block',
                'c.tinh_trang'
            )
            ->distinct()
            ->get()
            ->map(function ($m) {
                return [
                    'id' => $m->id,
                    'code' => '#GM' . str_pad($m->id, 5, '0', STR_PAD_LEFT),
                    'name' => $m->name,
                    'package' => $m->package ?? 'Gói tập',
                    'progress' => 50,
                    'sessions' => 10,
                    'active' => ($m->is_block == 0 && $m->tinh_trang == 1),
                ];
            });

        return response()->json([
            'status' => true,
            'success' => true,
            'data' => [
                'trainer' => $trainer,
                'members' => $members,
            ],
        ]);
    }

    /**
     * Cập nhật thông tin Huấn luyện viên
     */
    public function capNhatTrainer(Request $request, $id)
    {
        $trainer = Trainer::find($id);
        if (!$trainer) {
            return response()->json([
                'status' => false,
                'success' => false,
                'message' => 'Không tìm thấy Huấn luyện viên.',
            ], 404);
        }

        $request->validate([
            'ho_ten'        => 'required|string|max:255',
            'email'         => 'required|email|unique:trainers,email,' . $trainer->id,
            'so_dien_thoai' => 'nullable|string|max:20',
            'chuyen_mon'    => 'nullable|string|max:255',
            'so_nam_kinh_nghiem' => 'nullable|numeric|min:0|max:50',
            'mo_ta'         => 'nullable|string|max:1000',
        ]);

        $trainer->update($request->only([
            'ho_ten', 'email', 'so_dien_thoai', 'chuyen_mon', 'so_nam_kinh_nghiem', 'mo_ta'
        ]));

        return response()->json([
            'status' => true,
            'success' => true,
            'message' => 'Cập nhật thông tin Huấn luyện viên thành công!',
            'data' => $trainer->fresh(),
        ]);
    }

    /**
     * Thống kê tổng quan Bảng điều khiển (Dashboard)
     * Thống kê Gymmer, Huấn luyện viên, Doanh thu / Gói tập và hoạt động gần đây
     */
    public function thongKeDashboard(Request $request)
    {
        try {
            $now = Carbon::now();
            $range = $request->input('range');

            // Xử lý khoảng thời gian lọc
            $startDate = null;
            $endDate = Carbon::now()->endOfDay();

            if ($range === 'Hôm nay' || $range === 'today') {
                $startDate = Carbon::today()->startOfDay();
            } elseif ($range === '7 ngày gần đây' || $range === '7days') {
                $startDate = Carbon::now()->subDays(7)->startOfDay();
            } elseif ($range === '30 ngày gần đây' || $range === '30days') {
                $startDate = Carbon::now()->subDays(30)->startOfDay();
            } elseif ($range === 'Tháng này' || $range === 'month') {
                $startDate = Carbon::now()->startOfMonth();
            } elseif ($request->filled('tu_ngay') && $request->filled('den_ngay')) {
                $startDate = Carbon::parse($request->input('tu_ngay'))->startOfDay();
                $endDate = Carbon::parse($request->input('den_ngay'))->endOfDay();
            }

            // 1. Thống kê Gymmer (Hội viên)
            $totalGymmers = Client::count();
            $activeGymmers = Client::where('tinh_trang', 1)->where('is_block', 0)->count();
            $newGymmersMonth = Client::whereMonth('created_at', $now->month)
                ->whereYear('created_at', $now->year)
                ->count();
            $filteredNewGymmers = $startDate
                ? Client::whereBetween('created_at', [$startDate, $endDate])->count()
                : $newGymmersMonth;

            // 2. Thống kê Huấn luyện viên (Trainer)
            $totalTrainers = Trainer::count();
            $activeTrainers = Trainer::where('tinh_trang', Trainer::DANGHOATDONG)
                ->where('is_block', Trainer::KHONGKHOA)
                ->count();
            $pendingTrainers = Trainer::where('tinh_trang', Trainer::CHUAKICHHOAT)->count();

            // 3. Thống kê Doanh thu & Gói tập
            $totalRevenue = (float) DB::table('dang_ky_goi')->where('is_thanh_toan', 1)->sum('tong_tien');
            $revenueMonth = (float) DB::table('dang_ky_goi')->where('is_thanh_toan', 1)
                ->whereMonth('created_at', $now->month)
                ->whereYear('created_at', $now->year)
                ->sum('tong_tien');
            $filteredRevenue = $startDate
                ? (float) DB::table('dang_ky_goi')->where('is_thanh_toan', 1)->whereBetween('created_at', [$startDate, $endDate])->sum('tong_tien')
                : $revenueMonth;

            $totalSubscriptions = DB::table('dang_ky_goi')->count();
            $filteredSubscriptions = $startDate
                ? DB::table('dang_ky_goi')->whereBetween('created_at', [$startDate, $endDate])->count()
                : $totalSubscriptions;

            $totalPackages = DB::table('goi_tap')->where('tinh_trang', 1)->count();
            $totalExercises = DB::table('bai_tap')->count();

            // 4. Tỷ lệ hệ thống (System Metrics)
            $paidSubscriptions = DB::table('dang_ky_goi')->where('is_thanh_toan', 1)->count();
            $paymentSuccessRatio = $totalSubscriptions > 0
                ? round(($paidSubscriptions / $totalSubscriptions) * 100)
                : 100;
            $activeGymmersRatio = $totalGymmers > 0
                ? round(($activeGymmers / $totalGymmers) * 100)
                : 0;
            $activeTrainersRatio = $totalTrainers > 0
                ? round(($activeTrainers / $totalTrainers) * 100)
                : 0;

            // 5. Đơn đăng ký gói / hoạt động gần đây
            $recentSubscriptions = DB::table('dang_ky_goi as dk')
                ->join('clients as c', 'dk.id_hoi_vien', '=', 'c.id')
                ->leftJoin('chi_tiet_dang_ky_goi as ct', 'dk.id', '=', 'ct.id_dang_ky_goi')
                ->leftJoin('goi_tap as g', 'ct.id_goi_tap', '=', 'g.id')
                ->leftJoin('trainers as t', 'ct.id_trainer', '=', 't.id')
                ->select(
                    'dk.id',
                    'c.ho_ten as gymmer_name',
                    'c.email',
                    'c.so_dien_thoai',
                    'g.ten_goi_tap',
                    't.ho_ten as trainer_name',
                    'dk.tong_tien',
                    'dk.is_thanh_toan',
                    'dk.ngay_dang_ky',
                    'dk.created_at'
                )
                ->orderByDesc('dk.id')
                ->limit(6)
                ->get();

            return response()->json([
                'status'  => true,
                'success' => true,
                'message' => 'Lấy dữ liệu thống kê bảng điều khiển thành công!',
                'data'    => [
                    'stats' => [
                        'total_gymmers'           => $totalGymmers,
                        'active_gymmers'          => $activeGymmers,
                        'new_gymmers_this_month'  => $newGymmersMonth,
                        'filtered_new_gymmers'    => $filteredNewGymmers,
                        'total_trainers'          => $totalTrainers,
                        'active_trainers'         => $activeTrainers,
                        'pending_trainers'        => $pendingTrainers,
                        'total_revenue'           => $totalRevenue,
                        'revenue_this_month'      => $revenueMonth,
                        'filtered_revenue'        => $filteredRevenue,
                        'total_subscriptions'     => $totalSubscriptions,
                        'filtered_subscriptions'  => $filteredSubscriptions,
                        'total_packages'          => $totalPackages,
                        'total_exercises'         => $totalExercises,
                        'active_gymmers_ratio'    => $activeGymmersRatio,
                        'active_trainers_ratio'   => $activeTrainersRatio,
                        'payment_success_ratio'   => $paymentSuccessRatio,
                    ],
                    'recent_subscriptions' => $recentSubscriptions,
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status'  => false,
                'success' => false,
                'message' => 'Có lỗi xảy ra khi lấy thống kê bảng điều khiển: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Lấy danh sách phân công Huấn luyện viên
     */
    public function danhSachPhanCong(Request $request)
    {
        try {
            $search = $request->input('search');
            $status = $request->input('status');

            $query = DB::table('chi_tiet_dang_ky_goi as ct')
                ->join('dang_ky_goi as dk', 'ct.id_dang_ky_goi', '=', 'dk.id')
                ->join('clients as c', 'dk.id_hoi_vien', '=', 'c.id')
                ->leftJoin('goi_tap as g', 'ct.id_goi_tap', '=', 'g.id')
                ->leftJoin('trainers as t', 'ct.id_trainer', '=', 't.id')
                ->select(
                    'ct.id',
                    'c.id as client_id',
                    'c.ho_ten as gymmer_name',
                    'c.email as gymmer_email',
                    'c.so_dien_thoai as gymmer_phone',
                    't.id as id_trainer',
                    't.ho_ten as trainer_name',
                    'g.ten_goi_tap',
                    'ct.ngay_bat_dau',
                    'ct.ngay_ket_thuc',
                    'ct.so_buoi_pt',
                    'ct.so_buoi',
                    'ct.tinh_trang'
                )
                ->orderByDesc('ct.id');

            if ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('c.ho_ten', 'like', "%{$search}%")
                      ->orWhere('t.ho_ten', 'like', "%{$search}%")
                      ->orWhere('c.email', 'like', "%{$search}%");
                });
            }

            if ($status === 'active') {
                $query->where('ct.tinh_trang', 1);
            } elseif ($status === 'ended') {
                $query->where('ct.tinh_trang', 3);
            }

            $rows = $query->get();

            $assignments = $rows->map(function ($ct) {
                $tongBuoi = (int) ($ct->so_buoi_pt ?: ($ct->so_buoi ?: 12));
                $daHoc = 0;
                if ($ct->tinh_trang == 3) {
                    $daHoc = $tongBuoi;
                } elseif ($ct->ngay_bat_dau) {
                    $start = Carbon::parse($ct->ngay_bat_dau);
                    $end = $ct->ngay_ket_thuc ? Carbon::parse($ct->ngay_ket_thuc) : $start->copy()->addMonths(3);
                    $now = Carbon::now();
                    if ($now->greaterThanOrEqualTo($end)) {
                        $daHoc = $tongBuoi;
                    } elseif ($now->greaterThan($start)) {
                        $totalDays = max(1, $start->diffInDays($end));
                        $daysPassed = $start->diffInDays($now);
                        $daHoc = min($tongBuoi, max(1, (int) round(($daysPassed / $totalDays) * $tongBuoi)));
                    }
                }

                return [
                    'id'               => $ct->id,
                    'gymmer_id'        => str_pad($ct->client_id, 4, '0', STR_PAD_LEFT),
                    'client_id'        => $ct->client_id,
                    'gymmer'           => $ct->gymmer_name,
                    'email'            => $ct->gymmer_email,
                    'phone'            => $ct->gymmer_phone,
                    'trainer_id'       => $ct->id_trainer ? str_pad($ct->id_trainer, 4, '0', STR_PAD_LEFT) : null,
                    'raw_trainer_id'   => $ct->id_trainer,
                    'trainer'          => $ct->trainer_name ?: 'Chưa phân công',
                    'ten_goi_tap'      => $ct->ten_goi_tap ?: 'Gói tiêu chuẩn',
                    'ngay_bat_dau'     => $ct->ngay_bat_dau ? Carbon::parse($ct->ngay_bat_dau)->format('d/m/Y') : Carbon::now()->format('d/m/Y'),
                    'raw_ngay_bat_dau' => $ct->ngay_bat_dau ?: Carbon::now()->format('Y-m-d'),
                    'tong_buoi'        => $tongBuoi,
                    'da_hoc'           => $daHoc,
                    'trang_thai'       => $ct->tinh_trang == 1 ? 'active' : 'ended',
                ];
            });

            // Danh sách HLV đang hoạt động để gán
            $trainers = Trainer::where('tinh_trang', Trainer::DANGHOATDONG)
                ->where('is_block', Trainer::KHONGKHOA)
                ->select('id', 'ho_ten', 'chuyen_mon', 'email', 'so_dien_thoai')
                ->get();

            // Danh sách học viên để gán
            $clients = Client::select('id', 'ho_ten', 'email', 'so_dien_thoai')->get();

            // Thống kê số lượng
            $tongPhanCong = DB::table('chi_tiet_dang_ky_goi')->whereNotNull('id_trainer')->count();
            $dangPhuTrach = DB::table('chi_tiet_dang_ky_goi')->whereNotNull('id_trainer')->where('tinh_trang', 1)->count();
            $assignedClientIds = DB::table('chi_tiet_dang_ky_goi as ct')
                ->join('dang_ky_goi as dk', 'ct.id_dang_ky_goi', '=', 'dk.id')
                ->whereNotNull('ct.id_trainer')
                ->where('ct.tinh_trang', 1)
                ->pluck('dk.id_hoi_vien')
                ->toArray();
            $chuaCoTrainer = max(0, Client::whereNotIn('id', $assignedClientIds)->count());
            $trainerHoatDong = $trainers->count();

            return response()->json([
                'status'  => true,
                'success' => true,
                'message' => 'Lấy danh sách phân công thành công!',
                'data'    => [
                    'assignments' => $assignments,
                    'trainers'    => $trainers,
                    'clients'     => $clients,
                    'stats'       => [
                        'tong_phan_cong'   => $tongPhanCong,
                        'dang_phu_trach'   => $dangPhuTrach,
                        'chua_co_trainer'  => $chuaCoTrainer,
                        'trainer_hoat_dong'=> $trainerHoatDong,
                    ]
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status'  => false,
                'success' => false,
                'message' => 'Có lỗi xảy ra: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Thêm mới phân công Huấn luyện viên cho Gymmer
     */
    public function themMoiPhanCong(Request $request)
    {
        $request->validate([
            'client_id'    => 'required|exists:clients,id',
            'trainer_id'   => 'required|exists:trainers,id',
            'ngay_bat_dau' => 'nullable|date',
            'tong_buoi'    => 'nullable|numeric|min:1|max:100',
        ], [
            'client_id.required'  => 'Vui lòng chọn Gymmer cần phân công.',
            'trainer_id.required' => 'Vui lòng chọn Huấn luyện viên phụ trách.',
        ]);

        try {
            $clientId = $request->input('client_id');
            $trainerId = $request->input('trainer_id');
            $tongBuoi = $request->input('tong_buoi', 12);
            $ngayBatDau = $request->input('ngay_bat_dau') ? Carbon::parse($request->input('ngay_bat_dau')) : Carbon::now();
            $ngayKetThuc = $ngayBatDau->copy()->addMonths(3);

            // Tìm gói đăng ký mới nhất của client này
            $latestSubscription = DB::table('dang_ky_goi as dk')
                ->join('chi_tiet_dang_ky_goi as ct', 'dk.id', '=', 'ct.id_dang_ky_goi')
                ->where('dk.id_hoi_vien', $clientId)
                ->select('ct.id as chi_tiet_id')
                ->orderByDesc('ct.id')
                ->first();

            if ($latestSubscription) {
                // Cập nhật HLV vào gói hiện tại
                DB::table('chi_tiet_dang_ky_goi')
                    ->where('id', $latestSubscription->chi_tiet_id)
                    ->update([
                        'id_trainer'   => $trainerId,
                        'so_buoi_pt'   => $tongBuoi,
                        'ngay_bat_dau' => $ngayBatDau->format('Y-m-d'),
                        'ngay_ket_thuc'=> $ngayKetThuc->format('Y-m-d'),
                        'tinh_trang'   => 1,
                        'updated_at'   => Carbon::now(),
                    ]);
            } else {
                // Tạo mới đơn đăng ký gói & chi tiết cho Gymmer này
                $dkId = DB::table('dang_ky_goi')->insertGetId([
                    'id_hoi_vien'            => $clientId,
                    'ngay_dang_ky'           => $ngayBatDau->format('Y-m-d'),
                    'tinh_trang'             => 1,
                    'phuong_thuc_thanh_toan' => 1,
                    'is_thanh_toan'          => 1,
                    'tong_tien'              => 0,
                    'created_at'             => Carbon::now(),
                    'updated_at'             => Carbon::now(),
                ]);

                DB::table('chi_tiet_dang_ky_goi')->insert([
                    'id_dang_ky_goi' => $dkId,
                    'id_goi_tap'     => 2,
                    'id_trainer'     => $trainerId,
                    'so_buoi'        => 36,
                    'so_buoi_pt'     => $tongBuoi,
                    'don_gia'        => 0,
                    'thanh_tien'     => 0,
                    'ngay_bat_dau'   => $ngayBatDau->format('Y-m-d'),
                    'ngay_ket_thuc'  => $ngayKetThuc->format('Y-m-d'),
                    'tinh_trang'     => 1,
                    'created_at'     => Carbon::now(),
                    'updated_at'     => Carbon::now(),
                ]);
            }

            return response()->json([
                'status'  => true,
                'success' => true,
                'message' => 'Phân công Huấn luyện viên thành công!',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status'  => false,
                'success' => false,
                'message' => 'Có lỗi xảy ra: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Cập nhật / thay đổi Huấn luyện viên phụ trách
     */
    public function capNhatPhanCong(Request $request, $id)
    {
        $request->validate([
            'trainer_id'   => 'required|exists:trainers,id',
            'ngay_bat_dau' => 'nullable|date',
            'tong_buoi'    => 'nullable|numeric|min:1|max:100',
        ], [
            'trainer_id.required' => 'Vui lòng chọn Huấn luyện viên phụ trách mới.',
        ]);

        try {
            $ct = DB::table('chi_tiet_dang_ky_goi')->where('id', $id)->first();
            if (!$ct) {
                return response()->json([
                    'status'  => false,
                    'success' => false,
                    'message' => 'Không tìm thấy thông tin phân công.',
                ], 404);
            }

            $updateData = [
                'id_trainer' => $request->input('trainer_id'),
                'updated_at' => Carbon::now(),
            ];

            if ($request->filled('tong_buoi')) {
                $updateData['so_buoi_pt'] = $request->input('tong_buoi');
            }
            if ($request->filled('ngay_bat_dau')) {
                $updateData['ngay_bat_dau'] = Carbon::parse($request->input('ngay_bat_dau'))->format('Y-m-d');
            }
            if ($request->filled('trang_thai')) {
                $updateData['tinh_trang'] = $request->input('trang_thai') === 'ended' ? 3 : 1;
            }

            DB::table('chi_tiet_dang_ky_goi')->where('id', $id)->update($updateData);

            return response()->json([
                'status'  => true,
                'success' => true,
                'message' => 'Thay đổi Huấn luyện viên thành công!',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status'  => false,
                'success' => false,
                'message' => 'Có lỗi xảy ra: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Đổi trạng thái phân công (Đang phụ trách <-> Đã kết thúc)
     */
    public function doiTrangThaiPhanCong(Request $request, $id)
    {
        try {
            $ct = DB::table('chi_tiet_dang_ky_goi')->where('id', $id)->first();
            if (!$ct) {
                return response()->json([
                    'status'  => false,
                    'success' => false,
                    'message' => 'Không tìm thấy thông tin phân công.',
                ], 404);
            }

            $newStatus = $ct->tinh_trang == 1 ? 3 : 1;
            DB::table('chi_tiet_dang_ky_goi')->where('id', $id)->update([
                'tinh_trang' => $newStatus,
                'updated_at' => Carbon::now(),
            ]);

            return response()->json([
                'status'     => true,
                'success'    => true,
                'trang_thai' => $newStatus == 1 ? 'active' : 'ended',
                'message'    => $newStatus == 1 ? 'Đã kích hoạt lại phân công!' : 'Đã kết thúc phân công!',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status'  => false,
                'success' => false,
                'message' => 'Có lỗi xảy ra: ' . $e->getMessage(),
            ], 500);
        }
    }
}
