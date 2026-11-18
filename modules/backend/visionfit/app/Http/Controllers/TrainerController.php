<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use App\Http\Requests\Traines\StoreRequest;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use App\Models\Trainer;
class TrainerController extends Controller
{
    public function checkMaPT(Request $request)
    {
        $trainer = Trainer::where('ma_gioi_thieu', $request->ma_gioi_thieu)
            ->first();

        if (!$trainer) {
            return response()->json([
                'status' => false,
                'message' => 'Mã PT không tồn tại',
            ]);
        }
        if ($trainer->tinh_trang != Trainer::DANGHOATDONG) {
            return response()->json([
                'status' => false,
                'message' => 'Mã PT hiện không hoạt động',
            ]);
        }
        if ($trainer->is_block == Trainer::DAKHOA) {
            return response()->json([
                'status' => false,
                'message' => 'Mã PT hiện đang bị khóa',
            ]);
        }
        return response()->json([
            'status' => true,
            'message' => 'Mã PT hợp lệ',
        ]);
    }

    public function loginTrainer(Request $request)
    {
        $check = Auth::guard('trainer')->attempt([
            'email' => $request->email,
            'password' => $request->password
        ]);
        if($check){
            $nhanVien = Auth::guard('trainer')->user();
            if($nhanVien->is_active == 0){
                return response()->json([
                    'status' => false,
                    'message' => 'Tài khoản chưa được kích hoạt. Vui lòng kiểm tra email để kích hoạt tài khoạn',
                ]);
            }
           
            return response()->json([
                'status' => true,
                'message' => 'Đăng nhập thành công',
                'token' => $nhanVien->createToken('token_trainer')->plainTextToken,

            ]);
        }else {
            return response()->json([
                'status' => false,
                'message' => 'Tài khoản hoặc mật khẩu không đúng'
            ]);
        }
    }
    public function checkTokenTrainer()
    {
        $trainer = Auth::guard('sanctum')->user();
        if ($trainer && $trainer instanceof \App\Models\Trainer) {
            if ($trainer->tinh_trang == Trainer::DANGHI) {
                return response()->json([
                    'status' => false,
                    'message' => 'Tài khoản của bạn hiện không hoạt động!',
                ]);
            }
            if ($trainer->is_block == Trainer::DAKHOA) {
                return response()->json([
                    'status' => false,
                    'message' => 'Tài khoản của bạn đã bị khóa!',
                ]);
            }
            return response()->json([
                'status' => true,
                'message' => 'Token hợp lệ',
                'ho_ten' => $trainer->ho_ten,
                'email' => $trainer->email,
                'hinh_anh' => self::formatAvatar($trainer->hinh_anh, $trainer->gioi_tinh ?? 0),
                'so_dien_thoai' => $trainer->so_dien_thoai,
                'ma_gioi_thieu' => $trainer->ma_gioi_thieu ?: ('PT' . str_pad($trainer->id, 6, '0', STR_PAD_LEFT)),
            ]);

        } else {
            return response()->json([
                'status' => false,
                'message' => 'Bạn cần đăng nhập hệ thống!',
            ], 401);
        }
    }

    public function logoutTrainer()
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
        }
        else {
            return response()->json([
                'status'  => false,
                'message' => "Có lỗi xảy ra",
            ]);
        }
    }
    public function dangKy(StoreRequest $request)
    {
        // 1. Lấy dữ liệu đã validate
        $data = $request->validated();
        // 2. Kiểm tra mã giới thiệu
        $trainerGioiThieu = null;

        if (!empty($data['ma_gioi_thieu'])) {
            $trainerGioiThieu = Trainer::where( 'ma_gioi_thieu',  $data['ma_gioi_thieu'] )
                ->where('is_active', Trainer::DAKICHHOAT)
                ->where('is_verified', 1)
                ->where('is_block', Trainer::KHONGKHOA)
                ->where('tinh_trang', Trainer::DANGHOATDONG)
                ->first();

            if (!$trainerGioiThieu) {
                return response()->json([
                    'success' => false,
                    'message' => 'Mã giới thiệu không hợp lệ hoặc Trainer giới thiệu không còn hoạt động.',
                ], 422);
            }
        }

        $cv = $request->file('cv')->store('cv-trainers', 'public');

        // 3. Tạo tài khoản ứng tuyển Trainer
        $trainer = Trainer::create([
            'ho_ten' => $data['ho_ten'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'so_dien_thoai' => $data['so_dien_thoai'] ?? null,
            'ngay_sinh' => $data['ngay_sinh'] ?? null,
            'gioi_tinh' => $data['gioi_tinh'] ?? 0,
            // Thông tin người giới thiệu
            'id_trainer_gioi_thieu' => $trainerGioiThieu ? $trainerGioiThieu->id : null,

            'cv' => $cv,

            // Chưa được cấp mã giới thiệu
            'ma_gioi_thieu' => null,
            // Trạng thái tuyển dụng
            'trang_thai_tuyen_dung' => Trainer::CHOLIENHE,
            'ngay_phong_van' => null,
            // Trạng thái xác minh và tài khoản
            'is_verified' => 0,
            'is_active' => Trainer::CHUAKICHHOAT_TK,
            'is_block' => Trainer::KHONGKHOA,
            // Trạng thái làm việc
            'tinh_trang' => Trainer::CHUAKICHHOAT,
        ]);

        // 4. Gửi email xác nhận ứng tuyển kèm tệp CV về Gmail của Trainer
        try {
            $dataMail = [
                'ho_ten' => $trainer->ho_ten,
                'email' => $trainer->email,
                'so_dien_thoai' => $trainer->so_dien_thoai,
                'cv_name' => basename($cv),
            ];
            \Illuminate\Support\Facades\Mail::send('trainer_dang_ky_thanh_cong', ['data' => $dataMail], function ($message) use ($trainer, $cv) {
                $message->to($trainer->email)
                        ->subject('[VisionFit] Xác nhận tiếp nhận hồ sơ ứng tuyển Huấn Luyện Viên');

                // Đính kèm tệp file CV
                $cvFullPath = storage_path('app/public/' . $cv);
                if (file_exists($cvFullPath)) {
                    $ext = pathinfo($cvFullPath, PATHINFO_EXTENSION);
                    $cleanName = 'CV_' . preg_replace('/[^\w\-]+/u', '_', $trainer->ho_ten) . ($ext ? '.' . $ext : '');
                    $message->attach($cvFullPath, [
                        'as' => $cleanName,
                    ]);
                }
            });
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Lỗi gửi mail ứng tuyển Trainer: ' . $e->getMessage());
        }

        // 5. Trả kết quả
        return response()->json([
            'success' => true,
            'message' => 'Đăng ký ứng tuyển Trainer thành công. Vui lòng chờ Admin liên hệ.',
            'data' => [
                'id' => $trainer->id,
                'ho_ten' => $trainer->ho_ten,
                'email' => $trainer->email,
                'so_dien_thoai' => $trainer->so_dien_thoai,
                'cv' => $trainer->cv,
                'id_trainer_gioi_thieu' => $trainer->id_trainer_gioi_thieu,
                'trang_thai_tuyen_dung' => $trainer->trang_thai_tuyen_dung,
                'ngay_phong_van' => $trainer->ngay_phong_van,
                'is_verified' => $trainer->is_verified,
                'is_active' => $trainer->is_active,
                'tinh_trang' => $trainer->tinh_trang,
            ],
        ], 201);
    }

    /**
     * Lấy danh sách học viên của Huấn luyện viên
     */
    public function getMembers(Request $request)
    {
        // 1. Lấy HLV đang đăng nhập
        $trainer = Auth::guard('sanctum')->user() ?? $request->trainer;
        if (!$trainer) {
            return response()->json([
                'success' => false,
                'message' => 'Vui lòng đăng nhập.',
            ], 401);
        }

        // 2. Lấy danh sách học viên (Mỗi học viên chỉ lấy bản ghi mới nhất, không bị trùng)
        $latestDetails = DB::table('chi_tiet_dang_ky_goi as ct')
            ->join('dang_ky_goi as dk', 'ct.id_dang_ky_goi', '=', 'dk.id')
            ->where('ct.id_trainer', $trainer->id)
            ->whereIn('ct.tinh_trang', [1, 3])
            ->select('dk.id_hoi_vien', DB::raw('MAX(ct.id) as max_id_chi_tiet'))
            ->groupBy('dk.id_hoi_vien');

        $danhSach = DB::table('chi_tiet_dang_ky_goi as ct')
            ->joinSub($latestDetails, 'latest', function ($join) {
                $join->on('ct.id', '=', 'latest.max_id_chi_tiet');
            })
            ->join('dang_ky_goi as dk', 'ct.id_dang_ky_goi', '=', 'dk.id')
            ->join('clients as c', 'dk.id_hoi_vien', '=', 'c.id')
            ->leftJoin('goi_tap as gt', 'ct.id_goi_tap', '=', 'gt.id')
            ->select(
                'c.id as id_hoi_vien',
                'c.ho_ten',
                'c.email',
                'c.so_dien_thoai',
                'c.anh_dai_dien',
                'c.muc_tieu_hien_tai',
                'c.chieu_cao_cm',
                'c.can_nang_kg',
                'c.ngay_sinh',
                'ct.id as id_chi_tiet',
                'ct.id_dang_ky_goi',
                'ct.id_goi_tap',
                'gt.ten_goi_tap',
                'ct.so_buoi',
                'ct.so_buoi_pt',
                'ct.tinh_trang',
                'ct.ngay_bat_dau',
                'ct.ngay_ket_thuc'
            )
            ->orderByDesc('ct.id')
            ->get();

        $danhSach = $danhSach->map(function ($item) {
            $item->anh_dai_dien = self::formatAvatar($item->anh_dai_dien, 0);
            return $item;
        });

        return response()->json([
            'success' => true,
            'message' => 'Lấy danh sách học viên thành công.',
            'data' => $danhSach,
        ]);
    }

    /**
     * Lấy chi tiết 1 học viên
     */
    public function getMemberDetail($id, Request $request = null)
    {
        // 1. Lấy HLV đang đăng nhập
        $trainer = Auth::guard('sanctum')->user() ?? ($request ? $request->trainer : null);
        if (!$trainer) {
            return response()->json([
                'success' => false,
                'message' => 'Vui lòng đăng nhập.',
            ], 401);
        }

        // 2. Lấy thông tin học viên và gói tập cùng HLV
        $chiTiet = DB::table('chi_tiet_dang_ky_goi as ct')
            ->join('dang_ky_goi as dk', 'ct.id_dang_ky_goi', '=', 'dk.id')
            ->join('clients as c', 'dk.id_hoi_vien', '=', 'c.id')
            ->leftJoin('goi_tap as gt', 'ct.id_goi_tap', '=', 'gt.id')
            ->where('ct.id_trainer', $trainer->id)
            ->where('c.id', $id)
            ->select(
                'c.id as id_hoi_vien',
                'c.ho_ten',
                'c.email',
                'c.so_dien_thoai',
                'c.anh_dai_dien',
                'c.muc_tieu_hien_tai',
                'c.chieu_cao_cm',
                'c.can_nang_kg',
                'c.ngay_sinh',
                'ct.id as id_chi_tiet',
                'ct.id_dang_ky_goi',
                'ct.id_goi_tap',
                'gt.ten_goi_tap',
                'ct.so_buoi',
                'ct.so_buoi_pt',
                'ct.tinh_trang',
                'ct.ngay_bat_dau',
                'ct.ngay_ket_thuc'
            )
            ->first();

        if (!$chiTiet) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy học viên.',
            ], 404);
        }

        $chiTiet->anh_dai_dien = self::formatAvatar($chiTiet->anh_dai_dien, 0);

        return response()->json([
            'success' => true,
            'message' => 'Lấy chi tiết học viên thành công.',
            'data' => $chiTiet,
        ]);
    }

    /**
     * Lấy danh sách hội viên và gói tập để chọn thêm học viên
     */
    public function getCandidates(Request $request)
    {
        // 1. Lấy thông tin HLV
        $trainer = Auth::guard('sanctum')->user() ?? $request->trainer;
        $trainerCode = $trainer ? ($trainer->ma_gioi_thieu ?? ('PT' . str_pad($trainer->id, 6, '0', STR_PAD_LEFT))) : 'PT000001';

        // Lấy danh sách ID học viên mà HLV này đang quản lý (đang tập hoặc tạm nghỉ)
        $managedClientIds = [];
        if ($trainer) {
            $managedClientIds = DB::table('chi_tiet_dang_ky_goi as ct')
                ->join('dang_ky_goi as dk', 'ct.id_dang_ky_goi', '=', 'dk.id')
                ->where('ct.id_trainer', $trainer->id)
                ->whereIn('ct.tinh_trang', [1, 3])
                ->pluck('dk.id_hoi_vien')
                ->toArray();
        }

        // 2. Lấy danh sách hội viên (loại trừ những người HLV đã quản lý)
        $keyword = $request->input('search');
        $query = DB::table('clients')->where('is_block', 0);
        if (!empty($managedClientIds)) {
            $query->whereNotIn('id', $managedClientIds);
        }

        if ($keyword) {
            $query->where(function ($q) use ($keyword) {
                $q->where('ho_ten', 'like', "%{$keyword}%")
                  ->orWhere('so_dien_thoai', 'like', "%{$keyword}%");
            });
        }
        $clients = $query->select('id', 'ho_ten', 'so_dien_thoai', 'anh_dai_dien', 'muc_tieu_hien_tai')->get();

        $clients = $clients->map(function ($c) {
            $c->anh_dai_dien = self::formatAvatar($c->anh_dai_dien, 0);
            return $c;
        });

        // 3. Lấy danh sách gói tập có PT
        $goiTaps = DB::table('goi_tap')
            ->where('tinh_trang', 1)
            ->where('so_buoi_pt', '>', 0)
            ->select('id', 'ten_goi_tap', 'gia', 'so_buoi_pt')
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Lấy danh sách thành công.',
            'data' => [
                'clients' => $clients,
                'goi_taps' => $goiTaps,
                'trainer_code' => $trainerCode,
            ],
        ]);
    }

    /**
     * Thêm học viên mới cho HLV
     */
    public function addMember(Request $request)
    {
        // 1. Lấy HLV đang đăng nhập
        $trainer = Auth::guard('sanctum')->user() ?? $request->trainer;
        if (!$trainer) {
            return response()->json([
                'success' => false,
                'message' => 'Vui lòng đăng nhập.',
            ], 401);
        }

        $request->validate([
            'id_hoi_vien' => 'required|integer',
            'id_goi_tap' => 'required|integer',
        ]);

        // Kiểm tra xem học viên đã có trong danh sách của HLV này chưa
        $daTonTai = DB::table('chi_tiet_dang_ky_goi as ct')
            ->join('dang_ky_goi as dk', 'ct.id_dang_ky_goi', '=', 'dk.id')
            ->where('ct.id_trainer', $trainer->id)
            ->where('dk.id_hoi_vien', $request->id_hoi_vien)
            ->whereIn('ct.tinh_trang', [1, 3])
            ->exists();

        if ($daTonTai) {
            return response()->json([
                'success' => false,
                'message' => 'Học viên này đã có trong danh sách quản lý của bạn.',
            ], 400);
        }

        $goiTap = DB::table('goi_tap')->where('id', $request->id_goi_tap)->first();
        if (!$goiTap) {
            return response()->json([
                'success' => false,
                'message' => 'Gói tập không tồn tại.',
            ], 404);
        }

        // 2. Tạo đăng ký gói
        $idDangKy = DB::table('dang_ky_goi')->insertGetId([
            'id_hoi_vien' => $request->id_hoi_vien,
            'ngay_dang_ky' => now(),
            'tinh_trang' => 1,
            'phuong_thuc_thanh_toan' => 1,
            'is_thanh_toan' => 1,
            'tong_tien' => $goiTap->gia,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // 3. Tạo chi tiết đăng ký gói cho HLV
        DB::table('chi_tiet_dang_ky_goi')->insert([
            'id_dang_ky_goi' => $idDangKy,
            'id_goi_tap' => $goiTap->id,
            'id_trainer' => $trainer->id,
            'so_buoi' => $goiTap->so_buoi,
            'so_buoi_pt' => $goiTap->so_buoi_pt,
            'don_gia' => $goiTap->gia,
            'thanh_tien' => $goiTap->gia,
            'ngay_bat_dau' => now(),
            'ngay_ket_thuc' => now()->addDays($goiTap->thoi_han_ngay ?? 30),
            'tinh_trang' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Thêm học viên thành công.',
        ]);
    }

    /**
     * Cập nhật trạng thái học viên (Đang tập, Tạm nghỉ, Hoàn thành)
     */
    public function updateMember($id, Request $request)
    {
        // 1. Lấy HLV đang đăng nhập
        $trainer = Auth::guard('sanctum')->user() ?? $request->trainer;
        if (!$trainer) {
            return response()->json([
                'success' => false,
                'message' => 'Vui lòng đăng nhập.',
            ], 401);
        }

        $request->validate([
            'tinh_trang' => 'required|integer',
        ]);

        // 2. Tìm chi tiết đăng ký gói của học viên này với HLV
        $chiTietIds = DB::table('chi_tiet_dang_ky_goi as ct')
            ->join('dang_ky_goi as dk', 'ct.id_dang_ky_goi', '=', 'dk.id')
            ->where('ct.id_trainer', $trainer->id)
            ->where('dk.id_hoi_vien', $id)
            ->pluck('ct.id');

        if ($chiTietIds->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy học viên trong danh sách của bạn.',
            ], 404);
        }

        // 3. Cập nhật trạng thái
        DB::table('chi_tiet_dang_ky_goi')
            ->whereIn('id', $chiTietIds)
            ->update([
                'tinh_trang' => $request->tinh_trang,
                'updated_at' => now(),
            ]);

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật trạng thái học viên thành công.',
        ]);
    }

    /**
     * Gỡ học viên khỏi danh sách của HLV
     */
    public function deleteMember($id, Request $request = null)
    {
        // 1. Lấy HLV đang đăng nhập
        $trainer = Auth::guard('sanctum')->user() ?? ($request ? $request->trainer : null);
        if (!$trainer) {
            return response()->json([
                'success' => false,
                'message' => 'Vui lòng đăng nhập.',
            ], 401);
        }

        // 2. Tìm chi tiết đăng ký gói của học viên này với HLV
        $chiTietIds = DB::table('chi_tiet_dang_ky_goi as ct')
            ->join('dang_ky_goi as dk', 'ct.id_dang_ky_goi', '=', 'dk.id')
            ->where('ct.id_trainer', $trainer->id)
            ->where('dk.id_hoi_vien', $id)
            ->pluck('ct.id');

        if ($chiTietIds->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy học viên trong danh sách của bạn.',
            ], 404);
        }

        // 3. Gỡ HLV khỏi gói này (set id_trainer = null)
        DB::table('chi_tiet_dang_ky_goi')
            ->whereIn('id', $chiTietIds)
            ->update([
                'id_trainer' => null,
                'updated_at' => now(),
            ]);

        return response()->json([
            'success' => true,
            'message' => 'Đã gỡ học viên khỏi danh sách thành công.',
        ]);
    }

    /**
     * Lấy hồ sơ chi tiết của Huấn luyện viên
     */
    public function getProfile(Request $request)
    {
        $trainer = Auth::guard('sanctum')->user() ?? $request->trainer;
        if (!$trainer) {
            return response()->json([
                'status' => false,
                'message' => 'Vui lòng đăng nhập.',
            ], 401);
        }

        $trainerRecord = DB::table('trainers')->where('id', $trainer->id)->first();
        if (!$trainerRecord) {
            return response()->json([
                'status' => false,
                'message' => 'Không tìm thấy thông tin huấn luyện viên.',
            ], 404);
        }

        // Tên phòng tập / cơ sở
        $coSo = 'VisionFit Center - Quận 1';
        if ($trainerRecord->id_phong_tap) {
            $pt = DB::table('phong_taps')->where('id_phong_tap', $trainerRecord->id_phong_tap)->first();
            if ($pt) {
                $coSo = $pt->ten_phong_tap;
            } else {
                $pg = DB::table('phong_gyms')->where('id', $trainerRecord->id_phong_tap)->first();
                if ($pg) {
                    $coSo = $pg->ten_phong_gym;
                }
            }
        }

        // Chuyên môn
        $chuyenMon = [];
        if (!empty($trainerRecord->chuyen_mon)) {
            $decoded = json_decode($trainerRecord->chuyen_mon, true);
            if (is_array($decoded)) {
                $chuyenMon = $decoded;
            } else {
                $chuyenMon = array_map('trim', explode(',', $trainerRecord->chuyen_mon));
            }
        }
        if (empty($chuyenMon)) {
            $chuyenMon = ['Strength Training', 'Cardio', 'Giảm mỡ'];
        }

        // Chứng chỉ
        $chungChi = [];
        if (!empty($trainerRecord->chung_chi)) {
            $decodedCc = json_decode($trainerRecord->chung_chi, true);
            if (is_array($decodedCc)) {
                $chungChi = $decodedCc;
            } else {
                $chungChi = [['title' => $trainerRecord->chung_chi, 'org' => 'VisionFit']];
            }
        }
        if (empty($chungChi)) {
            $chungChi = [
                ['title' => 'NASM Certified Personal Trainer', 'org' => 'NASM • 2021'],
                ['title' => 'First Aid / CPR / AED', 'org' => 'Red Cross • 2023'],
            ];
        }

        return response()->json([
            'status' => true,
            'message' => 'Lấy hồ sơ thành công.',
            'data' => [
                'id' => $trainerRecord->id,
                'ma_gioi_thieu' => $trainerRecord->ma_gioi_thieu ?: ('PT' . str_pad($trainerRecord->id, 6, '0', STR_PAD_LEFT)),
                'ho_ten' => $trainerRecord->ho_ten,
                'email' => $trainerRecord->email,
                'so_dien_thoai' => $trainerRecord->so_dien_thoai,
                'mo_ta' => $trainerRecord->mo_ta ?: '5 năm kinh nghiệm huấn luyện sức mạnh và giảm mỡ. Tập trung vào kỹ thuật chuẩn và lộ trình bền vững.',
                'hinh_anh' => self::formatAvatar($trainerRecord->hinh_anh, $trainerRecord->gioi_tinh ?? 0),
                'chuc_danh' => $trainerRecord->chuc_danh ?: 'Personal Trainer',
                'so_nam_kinh_nghiem' => $trainerRecord->so_nam_kinh_nghiem ?: '5 năm',
                'chuyen_mon' => $chuyenMon,
                'chung_chi' => $chungChi,
                'co_so' => $coSo,
            ],
        ]);
    }

    /**
     * Cập nhật hồ sơ Huấn luyện viên vào Database
     */
    public function updateProfile(Request $request)
    {
        $trainer = Auth::guard('sanctum')->user() ?? $request->trainer;
        if (!$trainer) {
            return response()->json([
                'status' => false,
                'message' => 'Vui lòng đăng nhập.',
            ], 401);
        }

        $request->validate([
            'ho_ten' => 'nullable|string|max:255',
            'so_dien_thoai' => 'nullable|string|max:20',
            'mo_ta' => 'nullable|string|max:1000',
            'chuc_danh' => 'nullable|string|max:100',
            'so_nam_kinh_nghiem' => 'nullable|string|max:50',
            'chuyen_mon' => 'nullable',
            'chung_chi' => 'nullable',
            'hinh_anh' => 'nullable',
        ]);

        $updateData = [];

        if ($request->has('ho_ten')) {
            $updateData['ho_ten'] = $request->ho_ten;
        }
        if ($request->has('so_dien_thoai')) {
            $updateData['so_dien_thoai'] = $request->so_dien_thoai;
        }
        if ($request->has('mo_ta')) {
            $updateData['mo_ta'] = $request->mo_ta;
        }
        if ($request->has('chuc_danh')) {
            $updateData['chuc_danh'] = $request->chuc_danh;
        }
        if ($request->has('so_nam_kinh_nghiem')) {
            $updateData['so_nam_kinh_nghiem'] = $request->so_nam_kinh_nghiem;
        }

        // Upload avatar nếu có gửi file
        if ($request->hasFile('avatar')) {
            $path = $request->file('avatar')->store('avatars', 'public');
            $updateData['hinh_anh'] = $request->getSchemeAndHttpHost() . Storage::url($path);
        } elseif ($request->filled('hinh_anh')) {
            $updateData['hinh_anh'] = $request->hinh_anh;
        }

        if ($request->has('chuyen_mon')) {
            $cm = $request->chuyen_mon;
            $updateData['chuyen_mon'] = is_array($cm) ? json_encode($cm, JSON_UNESCAPED_UNICODE) : $cm;
        }

        if ($request->has('chung_chi')) {
            $cc = $request->chung_chi;
            $updateData['chung_chi'] = is_array($cc) ? json_encode($cc, JSON_UNESCAPED_UNICODE) : $cc;
        }

        if (!empty($updateData)) {
            $updateData['updated_at'] = now();
            DB::table('trainers')->where('id', $trainer->id)->update($updateData);
        }

        $fresh = DB::table('trainers')->where('id', $trainer->id)->first();

        return response()->json([
            'status' => true,
            'message' => 'Cập nhật hồ sơ thành công!',
            'data' => $fresh,
        ]);
    }

    /**
     * Định dạng đường dẫn ảnh đại diện chuẩn và có fallback ảnh đẹp
     */
    public static function formatAvatar($path, $gioiTinh = 0)
    {
        if (empty($path)) {
            return $gioiTinh == 1
                ? 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80'
                : 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80';
        }

        // Nếu đã là link đầy đủ http / https
        if (str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) {
            return $path;
        }

        // Nếu là file upload trong storage (bắt đầu bằng avatars/ hoặc storage/)
        if (str_starts_with($path, 'avatars/') || str_starts_with($path, 'storage/')) {
            $cleanPath = ltrim(preg_replace('/^storage\//', '', $path), '/');
            return url(Storage::url($cleanPath));
        }

        // Bộ ảnh đại diện chất lượng cao tương ứng với các mã trainer1.jpg -> trainer6.jpg từ Seeder
        $dummyAvatars = [
            'trainer1.jpg' => 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
            'trainer2.jpg' => 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
            'trainer3.jpg' => 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
            'trainer4.jpg' => 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&auto=format&fit=crop&q=80',
            'trainer5.jpg' => 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
            'trainer6.jpg' => 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=400&auto=format&fit=crop&q=80',
        ];

        if (isset($dummyAvatars[$path])) {
            return $dummyAvatars[$path];
        }

        // Nếu file thực sự tồn tại trong thư mục public
        if (file_exists(public_path($path))) {
            return url($path);
        }

        return 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80';
    }
}
