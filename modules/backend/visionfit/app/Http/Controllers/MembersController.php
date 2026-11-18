<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\ChuongTrinhTap;
use App\Models\NoiTap;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;


class MembersController extends Controller
{
    // Đăng ký tài khoản hội viên
    public function register(Request $request)
    {
        $request->validate([
            'email' => 'required|email|unique:clients,email',
            'password' => 'required|string|min:6',
            'ho_ten' => 'required|string|max:255',
            'so_dien_thoai' => 'nullable|string|max:20',
        ], [
            'email.required' => 'Vui lòng nhập địa chỉ email.',
            'email.email' => 'Địa chỉ email không đúng định dạng.',
            'email.unique' => 'Địa chỉ email này đã được sử dụng. Vui lòng đăng nhập hoặc dùng email khác.',
            'password.required' => 'Vui lòng nhập mật khẩu.',
            'password.min' => 'Mật khẩu phải có ít nhất 6 ký tự.',
            'ho_ten.required' => 'Vui lòng nhập họ và tên của bạn.',
        ]);

        $maGioiThieu = 'VF' . strtoupper(substr(md5(uniqid()), 0, 6));

        $client = \App\Models\Client::create([
            'id_phong_tap' => $request->id_phong_tap ?? 1,
            'email' => trim($request->email),
            'password' => Hash::make($request->password),
            'ho_ten' => trim($request->ho_ten),
            'so_dien_thoai' => $request->so_dien_thoai ?? null,
            'ma_gioi_thieu' => $maGioiThieu,
            'anh_dai_dien' => $request->anh_dai_dien ?? null,
            'tinh_trang' => 1,
            'is_active' => 1,
            'is_block' => 0,
        ]);

        // Tạo token đăng nhập ngay
        $token = $client->createToken('Token_client')->plainTextToken;

        // Gửi email chào mừng từ Gmail hệ thống VisionFit
        try {
            $dataMail = [
                'ho_ten' => $client->ho_ten,
                'email' => $client->email,
                'ma_gioi_thieu' => $client->ma_gioi_thieu,
            ];
            \Illuminate\Support\Facades\Mail::send('dang_ky_thanh_cong', ['data' => $dataMail], function ($message) use ($client) {
                $message->to($client->email)
                        ->subject('[VisionFit] Chào mừng bạn gia nhập Hệ Thống Thể Hình VisionFit!');
            });
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Lỗi gửi mail chào mừng đăng ký: ' . $e->getMessage());
        }

        return response()->json([
            'status' => true,
            'success' => true,
            'message' => 'Đăng ký tài khoản thành công! Chào mừng bạn đến với VisionFit.',
            'token' => $token,
            'client' => $client,
        ]);
    }

    public function login(Request $request)
    {
        $check = Auth::guard('client')->attempt([
            'email'     => $request->email,
            'password'  => $request->password
        ]);

        if($check) {
            $client = Auth::guard('client')->user();
            $token     = $client->createToken('Token_client')->plainTextToken;
            return response()->json([
                'status'    => true,
                'message'   => 'Đăng nhập thành công',
                'token'     =>$token,
                'client' =>$client
            ]);
        }else{
            return response()->json([
                'status' => false,
                'message' => 'Đăng Nhập Thất Bại.Tài khoản hoặc mật khẩu không đúng'
            ]);
        }
    }
    public function logoutClient(){
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
    public function logoutAllClient(Request $request)
    {
        $user = Auth::guard('sanctum')->user();
        if ($user) {
            $ds_token = $user->tokens;
            foreach ($ds_token as $token) {
                $token->delete();
            }
            return response()->json([
                'status'  => 1,
                'message' => "Đăng xuất thành công",
            ]);
        } else {
            return response()->json([
                'status'  => 0,
                'message' => "Có lỗi xảy ra",
            ]);
        }
    }
    public function getChuongTrinhTap()
    {
        $data = ChuongTrinhTap::where('nhom_muc_tieu', 1)
            ->where('tinh_trang', '1')
            ->orderBy('id')
            ->get()
            ->unique(function ($item) {
                return $item->ten_chuong_trinh . '-' . $item->gioi_tinh_ap_dung;
            })
            ->values();

        return response()->json([
            'status' => true,
            'data' => $data
        ]);
    }
    public function getChuongTrinhTapKhongMucTieu(Request $request)
    {
        $gioiTinh = $request->gioi_tinh_ap_dung;

        $data = ChuongTrinhTap::where('nhom_muc_tieu', 0)
            ->where('tinh_trang', 1)
            ->where('gioi_tinh_ap_dung', $gioiTinh)
            ->get();

        return response()->json([
            'status' => true,
            'message' => 'Lấy chương trình tập không mục tiêu thành công',
            'data' => $data,
        ]);
    }

    public function getNoiTap($id)
    {
        $chuongTrinh = ChuongTrinhTap::find($id);
        if (!$chuongTrinh) {
            return response()->json([
                'status' => false,
                'message' => 'Chương trình không tồn tại',
            ], 404);
        }
        $idNoiTap = $chuongTrinh->id_noi_tap;
        // Giải mã JSON
        if (is_string($idNoiTap)) {
            $idNoiTap = json_decode($idNoiTap, true);
        }
        // Nếu chỉ có một ID, ví dụ 2
        if (is_numeric($idNoiTap)) {
            $idNoiTap = [$idNoiTap];
        }
        // Nếu JSON chứa object có id, lấy danh sách id
        if (is_array($idNoiTap) && isset($idNoiTap[0]['id'])) {
            $idNoiTap = array_column($idNoiTap, 'id');
        }
        $noiTap = NoiTap::whereIn('id', $idNoiTap ?? [])
            ->select('id', 'ten_noi_tap', 'mo_ta')
            ->get();
        return response()->json([
            'status' => true,
            'message' => 'Lấy danh sách nơi tập thành công',
            'data' => $noiTap,
        ], 200);
    }
    public function getCapDoChuongTrinh(Request $request)
    {
        $tenChuongTrinh = $request->input('ten_chuong_trinh');
        $gioiTinh = $request->input('gioi_tinh_ap_dung');

        $data = ChuongTrinhTap::join(
            'cap_do',
            'chuong_trinh_tap.id_cap_do',
            '=',
            'cap_do.id'
        )
            ->where('chuong_trinh_tap.ten_chuong_trinh', $tenChuongTrinh)
            ->where('chuong_trinh_tap.gioi_tinh_ap_dung', $gioiTinh)
            ->where('chuong_trinh_tap.tinh_trang', 1)
            ->select(
                'chuong_trinh_tap.id as id_chuong_trinh',
                'chuong_trinh_tap.id_cap_do',
                'cap_do.ten_cap_do',
                'cap_do.mo_ta as mo_ta_cap_do',
                'cap_do.hinh_anh',
                'chuong_trinh_tap.so_sao',
                'chuong_trinh_tap.ten_chuong_trinh',
                'chuong_trinh_tap.mo_ta as mo_ta_chuong_trinh',
                'chuong_trinh_tap.so_ngay',
                'chuong_trinh_tap.so_buoi_moi_tuan',
                'chuong_trinh_tap.id_noi_tap'
            )
            ->orderBy('chuong_trinh_tap.id_cap_do')
            ->get();

        return response()->json([
            'status' => true,
            'message' => 'Lấy cấp độ chương trình tập thành công',
            'data' => $data
        ]);
    }

    public function getChiTietChuongTrinhTap($id)
    {
        $data = ChuongTrinhTap::join('cap_do','chuong_trinh_tap.id_cap_do', '=','cap_do.id')
            ->where('chuong_trinh_tap.id', $id)
            ->where('chuong_trinh_tap.tinh_trang', 1)
            ->select( 'chuong_trinh_tap.*','cap_do.ten_cap_do')
            ->first();
        if (!$data) {
            return response()->json([
                'status' => false,
                'message' => 'Không tìm thấy chương trình tập'
            ], 404);
        }

        return response()->json([
            'status' => true,
            'data' => $data
        ]);
    }

        // Lấy danh sách bài tập kèm chi tiết (video đúng, video sai)
    public function getDanhSachBaiTap(Request $request)
    {
        $idChuongTrinh = $request->id_chuong_trinh ?? 1;
        $ngayThu = $request->ngay_thu ?? 1;

        // Truy vấn danh sách bài tập kèm chi tiết bài tập
        $exercises = \Illuminate\Support\Facades\DB::table('bai_tap')
            ->leftJoin('chi_tiet_bai_tap', 'bai_tap.id', '=', 'chi_tiet_bai_tap.id_bai_tap')
            ->where('bai_tap.tinh_trang', 1)
            ->select(
                'bai_tap.id',
                'bai_tap.ten_bai_tap as name',
                'bai_tap.anh_dai_dien as image',
                'bai_tap.set_yeu_cau',
                'bai_tap.rep_yeu_cau',
                'bai_tap.giay_yeu_cau',
                'bai_tap.thoi_gian_phut',
                'chi_tiet_bai_tap.video_huong_dan as video',
                'chi_tiet_bai_tap.video_sai as video_sai',
                'chi_tiet_bai_tap.mo_ta as description',
                'chi_tiet_bai_tap.huong_dan as instructions',
                'chi_tiet_bai_tap.canh_bao as warnings',
                'chi_tiet_bai_tap.noi_tap as location',
                'chi_tiet_bai_tap.ghi_chu as equipment'
            )
            ->get();

        // Lấy thông tin nhóm cơ và tỷ lệ tác động từ bai_tap_nhom_co
        $allMuscles = \Illuminate\Support\Facades\DB::table('bai_tap_nhom_co')
            ->orderBy('ty_le_tac_dong', 'desc')
            ->get()
            ->groupBy('id_bai_tap');

        $colorPalette = ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'];

        $mapped = $exercises->map(function ($item) use ($allMuscles, $colorPalette) {
            $muscles = $allMuscles->get($item->id, collect());
            $primaryMuscle = $muscles->first()?->ten_nhom_co ?? 'Toàn thân';

            $distribution = $muscles->values()->map(function ($m, $idx) use ($colorPalette) {
                return [
                    'name' => $m->ten_nhom_co,
                    'percent' => (int)round((float)$m->ty_le_tac_dong),
                    'color' => $colorPalette[$idx % count($colorPalette)],
                ];
            })->toArray();

            $sets = ($item->set_yeu_cau ?? 3) . ' hiệp x ' . ($item->rep_yeu_cau ?? 15) . ' lần';
            $duration = ($item->thoi_gian_phut ?? 5) . ' ph';

            $videoUrl = $item->video;
            $videoSai = $item->video_sai;
            $imageUrl = $item->image ?: $videoUrl;

            return [
                'id' => $item->id,
                'name' => $item->name,
                'muscle' => $primaryMuscle,
                'sets' => $sets,
                'duration' => $duration,
                'image' => $imageUrl,
                'video' => $videoUrl,
                'video_sai' => $videoSai,
                'description' => $item->description,
                'instructions' => $item->instructions,
                'warnings' => $item->warnings,
                'equipment' => $item->equipment,
                'location' => $item->location,
                'musclesDistribution' => $distribution,
                'completed' => false,
            ];
        });

        return response()->json([
            'status' => true,
            'data' => $mapped
        ]);
    }

    private function formatAvatar($avatar)
    {
        if (empty($avatar)) {
            return 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80';
        }
        if (str_starts_with($avatar, 'http://') || str_starts_with($avatar, 'https://')) {
            return $avatar;
        }
        return url(\Illuminate\Support\Facades\Storage::url($avatar));
    }

    public function getProfile(Request $request)
    {
        $hoiVien = Auth::guard('sanctum')->user() ?: Auth::guard('client')->user();
        if (!$hoiVien && $request->filled('id_nguoi_dung')) {
            $hoiVien = \App\Models\Client::find($request->id_nguoi_dung);
        }

        if (!$hoiVien) {
            return response()->json([
                'success' => false,
                'message' => 'Vui lòng đăng nhập.',
            ], 401);
        }

        // Lấy thông tin gói tập
        $chiTietGoi = DB::table('dang_ky_goi')
            ->join('chi_tiet_dang_ky_goi', 'dang_ky_goi.id', '=', 'chi_tiet_dang_ky_goi.id_dang_ky_goi')
            ->leftJoin('goi_tap', 'chi_tiet_dang_ky_goi.id_goi_tap', '=', 'goi_tap.id')
            ->leftJoin('trainers', 'chi_tiet_dang_ky_goi.id_trainer', '=', 'trainers.id')
            ->where('dang_ky_goi.id_hoi_vien', $hoiVien->id)
            ->where('dang_ky_goi.is_thanh_toan', 1)
            ->where('dang_ky_goi.tinh_trang', 1)
            ->where('chi_tiet_dang_ky_goi.tinh_trang', 1)
            ->whereDate('chi_tiet_dang_ky_goi.ngay_ket_thuc', '>=', Carbon::today())
            ->orderByDesc('chi_tiet_dang_ky_goi.ngay_ket_thuc')
            ->select(
                'dang_ky_goi.id as id_dang_ky_goi',
                'goi_tap.ten_goi_tap',
                'chi_tiet_dang_ky_goi.ngay_bat_dau',
                'chi_tiet_dang_ky_goi.ngay_ket_thuc',
                'trainers.ho_ten',
                'trainers.chuc_danh'
            )
            ->first();

        // Tính số ngày còn lại
        $ngayConLai = null;

        if ($chiTietGoi && $chiTietGoi->ngay_ket_thuc) {
            $ngayConLai = max(0, Carbon::today()->diffInDays(
                Carbon::parse($chiTietGoi->ngay_ket_thuc)->startOfDay(),
                false
            ));
        }

        return response()->json([
            'success' => true,
            'message' => 'Lấy thông tin hồ sơ thành công.',
            'data' => [
                'ho_ten' => $hoiVien->ho_ten,
                'email' => $hoiVien->email,
                'so_dien_thoai' => $hoiVien->so_dien_thoai,
                'anh_dai_dien' => $this->formatAvatar($hoiVien->anh_dai_dien),
                'ngay_sinh' => $hoiVien->ngay_sinh,
                'gioi_tinh' => $hoiVien->gioi_tinh,
                'chieu_cao_cm' => $hoiVien->chieu_cao_cm,
                'can_nang_kg' => $hoiVien->can_nang_kg,
                'dang_nguoi' => $hoiVien->dang_nguoi,

                'id' => $hoiVien->id,
                'ma_thanh_vien' => $chiTietGoi ? 'VF-' . str_pad($chiTietGoi->id_dang_ky_goi, 6, '0', STR_PAD_LEFT): ($hoiVien->ma_gioi_thieu ? 'VF-' . $hoiVien->ma_gioi_thieu : 'VF-000001'),
                'ma_gioi_thieu' => $hoiVien->ma_gioi_thieu,

                'muc_tieu_hien_tai' => $hoiVien->muc_tieu_hien_tai,
                'cap_do_hien_tai' => $hoiVien->cap_do_hien_tai,
                'noi_tap_uu_tien' => $hoiVien->noi_tap_uu_tien,

                'ten_goi_tap' => $chiTietGoi ? $chiTietGoi->ten_goi_tap : 'Chưa đăng ký gói',
                'ngay_bat_dau' => $chiTietGoi ? $chiTietGoi->ngay_bat_dau : null,
                'ngay_ket_thuc' => $chiTietGoi ? $chiTietGoi->ngay_ket_thuc : null,
                'so_ngay_con_lai' => $ngayConLai ?? 0,
                'ho_ten_hlv' => $chiTietGoi ? $chiTietGoi->ho_ten : null,
                'chuc_danh' => $chiTietGoi ? $chiTietGoi->chuc_danh : null,
            ],
        ]);
    }

    // Cập nhật thông tin hồ sơ hội viên
    public function updateProfile(Request $request)
    {
        $client = Auth::guard('sanctum')->user() ?: Auth::guard('client')->user();
        if (!$client && $request->filled('id_nguoi_dung')) {
            $client = \App\Models\Client::find($request->id_nguoi_dung);
        }

        if (!$client) {
            return response()->json([
                'status' => false,
                'success' => false,
                'message' => 'Không tìm thấy thông tin hội viên'
            ], 404);
        }

        $request->validate([
            'ho_ten' => 'nullable|string|max:255',
            'so_dien_thoai' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'chieu_cao_cm' => 'nullable|numeric|min:30|max:250',
            'can_nang_kg' => 'nullable|numeric|min:20|max:300',
            'muc_tieu_hien_tai' => 'nullable|string|max:255',
            'cap_do_hien_tai' => 'nullable|string|max:255',
            'noi_tap_uu_tien' => 'nullable|string|max:255',
            'dang_nguoi' => 'nullable|string|max:255',
            'ngay_sinh' => 'nullable|string|max:50',
            'gioi_tinh' => 'nullable',
            'anh_dai_dien' => 'nullable|string',
        ]);

        $dataUpdate = [];

        if ($request->has('ho_ten') && $request->ho_ten !== null) {
            $dataUpdate['ho_ten'] = $request->ho_ten;
        }
        if ($request->has('so_dien_thoai') && $request->so_dien_thoai !== null) {
            $dataUpdate['so_dien_thoai'] = $request->so_dien_thoai;
        }
        if ($request->has('email') && !empty($request->email)) {
            $exists = \App\Models\Client::where('email', $request->email)->where('id', '!=', $client->id)->exists();
            if (!$exists) {
                $dataUpdate['email'] = $request->email;
            }
        }
        if ($request->has('chieu_cao_cm') && $request->chieu_cao_cm !== null) {
            $dataUpdate['chieu_cao_cm'] = $request->chieu_cao_cm;
        }
        if ($request->has('can_nang_kg') && $request->can_nang_kg !== null) {
            $dataUpdate['can_nang_kg'] = $request->can_nang_kg;
        }
        if ($request->has('muc_tieu_hien_tai') && $request->muc_tieu_hien_tai !== null) {
            $dataUpdate['muc_tieu_hien_tai'] = $request->muc_tieu_hien_tai;
        }
        if ($request->has('cap_do_hien_tai') && $request->cap_do_hien_tai !== null) {
            $dataUpdate['cap_do_hien_tai'] = $request->cap_do_hien_tai;
        }
        if ($request->has('noi_tap_uu_tien') && $request->noi_tap_uu_tien !== null) {
            $dataUpdate['noi_tap_uu_tien'] = $request->noi_tap_uu_tien;
        }
        if ($request->has('dang_nguoi') && $request->dang_nguoi !== null) {
            $dataUpdate['dang_nguoi'] = $request->dang_nguoi;
        }
        if ($request->has('anh_dai_dien') && !empty($request->anh_dai_dien)) {
            $dataUpdate['anh_dai_dien'] = $request->anh_dai_dien;
        }

        // Xử lý ngày sinh (hỗ trợ DD/MM/YYYY hoặc YYYY-MM-DD)
        if ($request->filled('ngay_sinh')) {
            $rawDate = trim($request->ngay_sinh);
            if (preg_match('/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/', $rawDate, $m)) {
                $dataUpdate['ngay_sinh'] = sprintf('%04d-%02d-%02d', $m[3], $m[2], $m[1]);
            } else {
                try {
                    $dataUpdate['ngay_sinh'] = Carbon::parse($rawDate)->format('Y-m-d');
                } catch (\Exception $e) {
                    // giữ nguyên
                }
            }
        }

        // Xử lý giới tính: 'Nam' -> 0, 'Nữ' -> 1, hoặc số
        if ($request->has('gioi_tinh')) {
            $rawGender = trim((string)$request->gioi_tinh);
            if (mb_strtolower($rawGender) === 'nam' || $rawGender === '0') {
                $dataUpdate['gioi_tinh'] = 0;
            } elseif (mb_strtolower($rawGender) === 'nữ' || mb_strtolower($rawGender) === 'nu' || $rawGender === '1') {
                $dataUpdate['gioi_tinh'] = 1;
            } else {
                $dataUpdate['gioi_tinh'] = $rawGender;
            }
        }

        // Xử lý upload avatar nếu gửi dạng file
        if ($request->hasFile('avatar') || $request->hasFile('file')) {
            $file = $request->file('avatar') ?? $request->file('file');
            $path = $file->store('avatars', 'public');
            $dataUpdate['anh_dai_dien'] = url(\Illuminate\Support\Facades\Storage::url($path));
        }

        if (!empty($dataUpdate)) {
            $client->update($dataUpdate);
        }

        return response()->json([
            'status' => true,
            'success' => true,
            'message' => 'Cập nhật hồ sơ thành công',
            'data' => $client
        ]);
    }

    // Tải lên ảnh đại diện mới
    public function uploadAvatar(Request $request)
    {
        $client = Auth::guard('sanctum')->user() ?: Auth::guard('client')->user();
        if (!$client && $request->filled('id_nguoi_dung')) {
            $client = \App\Models\Client::find($request->id_nguoi_dung);
        }

        if (!$client) {
            return response()->json([
                'status' => false,
                'message' => 'Không tìm thấy thông tin hội viên'
            ], 404);
        }

        $request->validate([
            'avatar' => 'nullable|file|mimes:jpg,jpeg,png,webp|max:10240',
            'file' => 'nullable|file|mimes:jpg,jpeg,png,webp|max:10240',
            'url' => 'nullable|string',
        ]);

        if ($request->filled('url')) {
            $client->update(['anh_dai_dien' => $request->url]);
            return response()->json([
                'status' => true,
                'success' => true,
                'message' => 'Cập nhật ảnh đại diện thành công',
                'url' => $request->url,
                'data' => $client
            ]);
        }

        $file = $request->file('avatar') ?? $request->file('file');

        if ($file) {
            $path = $file->store('avatars', 'public');
            $url = url(\Illuminate\Support\Facades\Storage::url($path));

            $client->update(['anh_dai_dien' => $url]);

            return response()->json([
                'status' => true,
                'success' => true,
                'message' => 'Cập nhật ảnh đại diện thành công',
                'url' => $url,
                'data' => $client
            ]);
        }

        return response()->json([
            'status' => false,
            'message' => 'Không tìm thấy file ảnh'
        ], 400);
    }

    // Đổi mật khẩu tài khoản hội viên
    public function changePassword(Request $request)
    {
        $client = Auth::guard('sanctum')->user() ?: Auth::guard('client')->user();

        if (!$client) {
            return response()->json([
                'status' => false,
                'success' => false,
                'message' => 'Vui lòng đăng nhập để đổi mật khẩu.'
            ], 401);
        }

        $request->validate([
            'mat_khau_cu' => 'required|string',
            'mat_khau_moi' => 'required|string|min:6',
            'xac_nhan_mat_khau' => 'required|string|same:mat_khau_moi',
        ], [
            'mat_khau_cu.required' => 'Vui lòng nhập mật khẩu hiện tại.',
            'mat_khau_moi.required' => 'Vui lòng nhập mật khẩu mới.',
            'mat_khau_moi.min' => 'Mật khẩu mới phải có ít nhất 6 ký tự.',
            'xac_nhan_mat_khau.required' => 'Vui lòng xác nhận mật khẩu mới.',
            'xac_nhan_mat_khau.same' => 'Mật khẩu xác nhận không trùng khớp.',
        ]);

        // Kiểm tra mật khẩu cũ
        if (!Hash::check($request->mat_khau_cu, $client->password)) {
            return response()->json([
                'status' => false,
                'success' => false,
                'message' => 'Mật khẩu hiện tại không chính xác.'
            ], 400);
        }

        // Không cho phép mật khẩu mới trùng mật khẩu cũ
        if (Hash::check($request->mat_khau_moi, $client->password)) {
            return response()->json([
                'status' => false,
                'success' => false,
                'message' => 'Mật khẩu mới không được trùng với mật khẩu hiện tại.'
            ], 400);
        }

        // Cập nhật mật khẩu mới
        $client->update([
            'password' => Hash::make($request->mat_khau_moi),
        ]);

        return response()->json([
            'status' => true,
            'success' => true,
            'message' => 'Đổi mật khẩu thành công!'
        ]);
    }

    // Quên mật khẩu - gửi mã xác nhận OTP
    public function forgotPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
        ], [
            'email.required' => 'Vui lòng nhập địa chỉ email.',
            'email.email' => 'Địa chỉ email không đúng định dạng.',
        ]);

        $email = trim($request->email);

        // Tìm trong Client trước, nếu không có thì tìm trong Trainer
        $user = \App\Models\Client::where('email', $email)->first();
        if (!$user) {
            $user = \App\Models\Trainer::where('email', $email)->first();
        }

        if (!$user) {
            return response()->json([
                'status' => false,
                'success' => false,
                'message' => 'Email này chưa được đăng ký trong hệ thống VisionFit.'
            ], 404);
        }

        // Tạo mã OTP 6 chữ số ngẫu nhiên
        $otp = (string)random_int(100000, 999999);
        $expireAt = time() + 600; // Có hiệu lực trong 10 phút

        $user->update([
            'hash_reset' => $otp . '|' . $expireAt,
        ]);

        // Gửi Email qua SMTP Gmail (dùng giao diện VisionFit)
        $mailSent = false;
        try {
            $dataMail = [
                'ho_ten' => $user->ho_ten,
                'otp' => $otp,
            ];
            \Illuminate\Support\Facades\Mail::send('quen_mat_khau', ['data' => $dataMail], function ($message) use ($user) {
                $message->to($user->email)
                        ->subject('[VisionFit] Mã xác nhận đặt lại mật khẩu');
            });
            $mailSent = true;
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Lỗi gửi mail reset mật khẩu: ' . $e->getMessage());
            try {
                \Illuminate\Support\Facades\Mail::raw(
                    "Xin chào {$user->ho_ten},\n\nMã xác thực đặt lại mật khẩu VisionFit của bạn là: {$otp}\n\nMã này có hiệu lực trong vòng 10 phút.\n\nTrân trọng,\nVISIONFIT TEAM",
                    function ($message) use ($user) {
                        $message->to($user->email)->subject('[VisionFit] Mã xác nhận đặt lại mật khẩu');
                    }
                );
                $mailSent = true;
            } catch (\Exception $ex) {}
        }

        return response()->json([
            'status' => true,
            'success' => true,
            'message' => $mailSent 
                ? 'Mã xác thực đã được gửi về email của bạn. Vui lòng kiểm tra hộp thư!' 
                : 'Mã xác thực đã được gửi đến email của bạn.',
        ]);
    }

    // Đặt lại mật khẩu mới với mã OTP
    public function resetPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'otp' => 'required|string',
            'mat_khau_moi' => 'required|string|min:6',
            'xac_nhan_mat_khau' => 'required|string|same:mat_khau_moi',
        ], [
            'email.required' => 'Vui lòng nhập email.',
            'email.email' => 'Email không đúng định dạng.',
            'otp.required' => 'Vui lòng nhập mã xác thực OTP.',
            'mat_khau_moi.required' => 'Vui lòng nhập mật khẩu mới.',
            'mat_khau_moi.min' => 'Mật khẩu mới phải có ít nhất 6 ký tự.',
            'xac_nhan_mat_khau.required' => 'Vui lòng xác nhận mật khẩu mới.',
            'xac_nhan_mat_khau.same' => 'Mật khẩu xác nhận không trùng khớp.',
        ]);

        $email = trim($request->email);
        $user = \App\Models\Client::where('email', $email)->first();
        if (!$user) {
            $user = \App\Models\Trainer::where('email', $email)->first();
        }

        if (!$user) {
            return response()->json([
                'status' => false,
                'success' => false,
                'message' => 'Không tìm thấy tài khoản với email này.'
            ], 404);
        }

        if (empty($user->hash_reset)) {
            return response()->json([
                'status' => false,
                'success' => false,
                'message' => 'Bạn chưa yêu cầu mã xác thực hoặc mã đã được sử dụng.'
            ], 400);
        }

        $parts = explode('|', $user->hash_reset);
        $storedOtp = $parts[0] ?? '';
        $expireAt = isset($parts[1]) ? (int)$parts[1] : 0;

        $inputOtp = trim($request->otp);

        // Kiểm tra mã OTP khớp với mã đã gửi
        if ($inputOtp !== $storedOtp) {
            return response()->json([
                'status' => false,
                'success' => false,
                'message' => 'Mã xác thực OTP không chính xác.'
            ], 400);
        }

        // Kiểm tra thời gian hết hạn (10 phút)
        if (time() > $expireAt) {
            return response()->json([
                'status' => false,
                'success' => false,
                'message' => 'Mã xác thực OTP đã hết hạn (chỉ có hiệu lực 10 phút). Vui lòng yêu cầu mã mới.'
            ], 400);
        }

        // Cập nhật mật khẩu mới và hủy hash_reset
        $user->update([
            'password' => Hash::make($request->mat_khau_moi),
            'hash_reset' => null,
        ]);

        return response()->json([
            'status' => true,
            'success' => true,
            'message' => 'Đặt lại mật khẩu thành công! Bạn có thể đăng nhập ngay bằng mật khẩu mới.'
        ]);
    }


    // lấy dữ liệu phòng tập theo xã phường 
    public function getProvinces()
    {
        $data = DB::table('provinces')
            ->select(
                'code',
                'name',
                'codename',
                'division_type'
            )
            ->orderBy('name')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $data
        ]);
    }
    public function getWards($code)
    {
        $data = DB::table('provinces as p')
            ->join('wards as w', 'p.id', '=', 'w.id_province')
            ->where('p.code', $code)
            ->select(
                'p.code as ma_tinh',
                'p.name as ten_tinh',
                'w.id as id_ward',
                'w.code as ma_phuong_xa',
                'w.name as ten_phuong_xa',
                'w.codename',
                'w.division_type'
            )
            ->orderBy('w.name')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $data
        ]);
    }
    public function getGymsByProvince($code)
    {
        $data = DB::table('provinces as p')
            ->join('wards as w', 'p.id', '=', 'w.id_province')
            ->join('phong_gyms as pg', 'w.id', '=', 'pg.id_ward')
            ->where('p.code', $code)
            ->select(
                'p.name as ten_tinh',
                'w.name as ten_phuong_xa',
                'pg.id',
                'pg.ten_phong_gym',
                'pg.dia_chi',
                'pg.vi_do',
                'pg.kinh_do',
                'pg.id_ward',
                'pg.so_dien_thoai',
                'pg.website'
            )
            ->orderBy('w.name')
            ->orderBy('pg.ten_phong_gym')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $data
        ]);
    }
    public function getGymsByWard($code)
    {
        $data = DB::table('wards as w')
            ->join('phong_gyms as pg', 'w.id', '=', 'pg.id_ward')
            ->where('w.code', $code)
            ->select(
                'w.id as id_ward',
                'w.code as ma_phuong_xa',
                'w.name as ten_phuong_xa',
                'pg.id as id_phong_gym',
                'pg.ten_phong_gym',
                'pg.dia_chi',
                'pg.vi_do',
                'pg.kinh_do',
                'pg.so_dien_thoai',
                'pg.website'
            )
            ->orderBy('pg.ten_phong_gym')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $data
        ]);
    }











}
