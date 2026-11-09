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





}
