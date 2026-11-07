<?php

namespace App\Http\Controllers;

use App\Models\BaiDang;
use App\Models\Media;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use App\Models\LuotThichBaiDang;
use App\Models\BinhLuanBaiDang;
use App\Models\LuuBaiDang;
use App\Models\LuotThichBinhLuan;
use Illuminate\Support\Facades\Auth;

class BaiDangController extends Controller
{

    public function getUser(Request $request)
    {
        // Lấy thông tin người dùng đang đăng nhập
        $user = Auth::guard('sanctum')->user();

        // Kiểm tra người dùng
        if (!$user) {
            return response()->json([
                'status' => false,
                'message' => 'Chưa đăng nhập'
            ], 401);
        }

        $loaiNguoiDung = $user instanceof \App\Models\Trainer
            ? 'trainer'
            : 'client';

        $anhDaiDien = $loaiNguoiDung == 'trainer'
            ? $user->hinh_anh
            : $user->anh_dai_dien;

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $user->id,
                'loai_nguoi_dung' => $loaiNguoiDung,
                'ho_ten' => $user->ho_ten,
                'email' => $user->email,
                'anh_dai_dien' => $anhDaiDien
            ]
        ]);
    }

    

    public function index()
    {
        $user = Auth::guard('sanctum')->user();

        if (!$user) {
            return response()->json([
                'status' => false,
                'message' => 'Chưa đăng nhập'
            ], 401);
        }

        $idNguoiDung = $user->id;

        $loaiNguoiDung = $user instanceof \App\Models\Trainer
            ? 'trainer'
            : 'client';

        $data = BaiDang::with([
            'media',
            'client:id,ho_ten,anh_dai_dien',
            'trainer:id,ho_ten,hinh_anh'
        ])
            ->withCount([
                'luotThich as so_luot_thich',
                'binhLuan as so_binh_luan',
            ])
            ->where('tinh_trang', '1')
            ->orderByDesc('created_at')
            ->get()
            ->map(function ($item) use ($idNguoiDung, $loaiNguoiDung) {

                if ($item->loai_nguoi_dung == 'trainer') {
                    $nguoiDang = $item->trainer;
                } else {
                    $nguoiDang = $item->client;
                }

                $hoTen = $nguoiDang?->ho_ten ?? 'Thành viên VisionFit';

                $parts = preg_split('/\s+/', trim($hoTen));

                $avatar = '';

                foreach (array_slice($parts, -2) as $part) {
                    $avatar .= mb_strtoupper(mb_substr($part, 0, 1));
                }

                $item->ten_nguoi_dung = $hoTen;
                $item->avatar = $avatar ?: 'VF';
                $item->anh_dai_dien = $item->loai_nguoi_dung == 'trainer'
                    ? $nguoiDang?->hinh_anh
                    : $nguoiDang?->anh_dai_dien;

                $item->da_thich = LuotThichBaiDang::where(
                    'id_bai_dang', $item->id_bai_dang
                )
                    ->where('id_nguoi_dung', $idNguoiDung)
                    ->where('loai_nguoi_dung', $loaiNguoiDung)
                    ->exists();

                $item->da_luu = LuuBaiDang::where(
                    'id_bai_dang', $item->id_bai_dang
                )
                    ->where('id_nguoi_dung', $idNguoiDung)
                    ->where('loai_nguoi_dung', $loaiNguoiDung)
                    ->exists();

                unset($item->client, $item->trainer);

                return $item;
            });

        return response()->json([
            'status' => true,
            'message' => 'Lấy danh sách bài đăng thành công',
            'data' => $data
        ]);
    }



    public function store(Request $request)
    {
        // Lấy tài khoản từ Bearer Token
        $user = Auth::guard('sanctum')->user();

        if (!$user) {
            return response()->json([
                'status' => false,
                'message' => 'Bạn chưa đăng nhập'
            ], 401);
        }

        // Xác định loại người dùng
        $loaiNguoiDung = $user instanceof \App\Models\Trainer
            ? 'trainer'
            : 'client';

        $request->validate([
            'caption' => 'nullable|string|max:2000',
            'pham_vi_hien_thi' => 'required|in:0,1,2',
            'media' => 'nullable|file|mimes:jpg,jpeg,png,webp,mp4,mov,quicktime,avi,mkv|max:102400',
        ]);

        $baiDang = DB::transaction(function () use ($request, $user, $loaiNguoiDung) {

            $post = BaiDang::create([
                'id_nguoi_dung' => $user->id,
                'loai_nguoi_dung' => $loaiNguoiDung,
                'caption' => $request->caption,
                'pham_vi_hien_thi' => $request->pham_vi_hien_thi,
                'tinh_trang' => '1',
            ]);

            if ($request->hasFile('media')) {
                $file = $request->file('media');
                $path = $file->store('sportfeed', 'public');

                $loaiMedia = str_starts_with(
                    $file->getMimeType(),
                    'video/'
                ) ? 'video' : 'image';

                Media::create([
                    'id_bai_dang' => $post->id_bai_dang,
                    'loai_media' => $loaiMedia,
                    'media_url' => $request->getSchemeAndHttpHost() . Storage::url($path),
                    'thu_tu' => 0,
                ]);
            }

            return $post->load('media');
        });

        return response()->json([
            'status' => true,
            'message' => 'Đăng bài thành công',
            'data' => $baiDang
        ], 201);
    }



    



    public function updatePost(Request $request, $id)
    {
        // Lấy người dùng đang đăng nhập
        $user = Auth::guard('sanctum')->user();

        if (!$user) {
            return response()->json([
                'status' => false,
                'message' => 'Bạn chưa đăng nhập'
            ], 401);
        }

        $loaiNguoiDung = $user instanceof \App\Models\Trainer
        ? 'trainer' : 'client';


        // Validate dữ liệu
        $request->validate([
            'caption' => 'sometimes|nullable|string|max:2000',
            'pham_vi_hien_thi' => 'sometimes|required|in:0,1,2',
        ]);

        // Tìm bài đăng của người dùng hiện tại
        $post = BaiDang::where('id_bai_dang', $id)
            ->where('id_nguoi_dung', $user->id)
            ->where('loai_nguoi_dung', $loaiNguoiDung)
            ->where('tinh_trang', '1')
            ->first();

        if (!$post) {
            return response()->json([
                'status' => false,
                'message' => 'Không tìm thấy bài viết hoặc bạn không có quyền sửa'
            ], 404);
        }

        // Chỉ cập nhật những trường được gửi lên
        $data = $request->only([
            'caption',
            'pham_vi_hien_thi'
        ]);

        $post->update($data);

        return response()->json([
            'status' => true,
            'message' => 'Đã cập nhật bài viết',
            'data' => $post
        ]);
    }


    
    public function deletePost($id)
    {
        // Lấy người dùng đang đăng nhập
        $user = Auth::guard('sanctum')->user();
        if (!$user) {
            return response()->json([
                'status' => false,
                'message' => 'Bạn chưa đăng nhập'
            ], 401);
        }

        $loaiNguoiDung = $user instanceof \App\Models\Trainer
            ? 'trainer' : 'client';
        // Tìm bài đăng của người dùng hiện tại
        $post = BaiDang::where('id_bai_dang', $id)
            ->where('id_nguoi_dung', $user->id)
            ->where('loai_nguoi_dung', $loaiNguoiDung)
            ->where('tinh_trang', '1')
            ->first();

        if (!$post) {
            return response()->json([
                'status' => false,
                'message' => 'Không tìm thấy bài viết hoặc bạn không có quyền xóa'
            ], 404);
        }

        // Xóa mềm bài đăng
        $post->update([
            'tinh_trang' => '0'
        ]);

        return response()->json([
            'status' => true,
            'message' => 'Đã xóa bài viết'
        ]);
    }

    public function like($id)
    {
        // Lấy người dùng đang đăng nhập
        $user = Auth::guard('sanctum')->user();
        if (!$user) {
            return response()->json([
                'status' => false,
                'message' => 'Bạn chưa đăng nhập'
            ], 401);
        }

        $loaiNguoiDung = $user instanceof \App\Models\Trainer
            ? 'trainer' : 'client';


        // Kiểm tra bài đăng có tồn tại và đang hoạt động
        $baiDang = BaiDang::where('id_bai_dang', $id)
            ->where('tinh_trang', '1')
            ->first();
        if (!$baiDang) {
            return response()->json([
                'status' => false,
                'message' => 'Bài đăng không tồn tại'
            ], 404);
        }
        // Tạo lượt thích, nếu đã thích thì không tạo trùng
        LuotThichBaiDang::firstOrCreate([
            'id_bai_dang' => $id,
            'id_nguoi_dung' => $user->id,
            'loai_nguoi_dung' => $loaiNguoiDung,

        ]);
        return response()->json([
            'status' => true,
            'message' => 'Đã thích bài viết'
        ]);
    }

    public function unlike($id)
    {
        // Lấy người dùng đang đăng nhập
        $user = Auth::guard('sanctum')->user();
        if (!$user) {
            return response()->json([
                'status' => false,
                'message' => 'Bạn chưa đăng nhập'
            ], 401);
        }

        $loaiNguoiDung = $user instanceof \App\Models\Trainer
            ? 'trainer' : 'client';

        // Xóa lượt thích của chính người đang đăng nhập
        LuotThichBaiDang::where('id_bai_dang', $id)
            ->where('id_nguoi_dung', $user->id)
            ->where('loai_nguoi_dung', $loaiNguoiDung)
            ->delete();
        return response()->json([
            'status' => true,
            'message' => 'Đã bỏ thích'
        ]);
    }


    

    public function savePost($id)
    {
        // Lấy người dùng đang đăng nhập
        $user = Auth::guard('sanctum')->user();

        if (!$user) {
            return response()->json([
                'status' => false,
                'message' => 'Bạn chưa đăng nhập'
            ], 401);
        }
        $loaiNguoiDung = $user instanceof \App\Models\Trainer
            ? 'trainer' : 'client';

        // Kiểm tra bài đăng có tồn tại và đang hoạt động
        $baiDang = BaiDang::where('id_bai_dang', $id)
            ->where('tinh_trang', '1')
            ->first();

        if (!$baiDang) {
            return response()->json([
                'status' => false,
                'message' => 'Bài đăng không tồn tại'
            ], 404);
        }

        // Lưu bài viết, tránh lưu trùng
        LuuBaiDang::firstOrCreate([
            'id_bai_dang' => $id,
            'id_nguoi_dung' => $user->id,
            'loai_nguoi_dung' => $loaiNguoiDung,
        ]);

        return response()->json([
            'status' => true,
            'message' => 'Đã lưu bài viết'
        ]);
    }

    public function unsavePost($id)
    {
        // Lấy người dùng đang đăng nhập
        $user = Auth::guard('sanctum')->user();

        if (!$user) {
            return response()->json([
                'status' => false,
                'message' => 'Bạn chưa đăng nhập'
            ], 401);
        }
        $loaiNguoiDung = $user instanceof \App\Models\Trainer
            ? 'trainer' : 'client';


        // Bỏ lưu bài viết của chính người dùng
        LuuBaiDang::where('id_bai_dang', $id)
            ->where('id_nguoi_dung', $user->id)
            ->where('loai_nguoi_dung', $loaiNguoiDung)
            ->delete();

        return response()->json([
            'status' => true,
            'message' => 'Đã bỏ lưu bài viết'
        ]);
    }


    
    public function getComments($id)
    {
        $user = Auth::guard('sanctum')->user();

        if (!$user) {
            return response()->json([
                'status' => false,
                'message' => 'Bạn chưa đăng nhập'
            ], 401);
        }

        $loaiNguoiDung = $user instanceof \App\Models\Trainer
            ? 'trainer' : 'client';

        $baiDang = BaiDang::where('id_bai_dang', $id)
            ->where('tinh_trang', '1')
            ->first();

        if (!$baiDang) {
            return response()->json([
                'status' => false,
                'message' => 'Bài đăng không tồn tại'
            ], 404);
        }

        $data = BinhLuanBaiDang::with([
            'client:id,ho_ten,anh_dai_dien',
            'trainer:id,ho_ten,hinh_anh'
        ])
            ->where('id_bai_dang', $id)
            ->where('tinh_trang', '1')
            ->withCount(['luotThich as so_luot_thich'])
            ->orderBy('created_at')
            ->get()
            ->map(function ($item) use ($user, $loaiNguoiDung) {

                $nguoiBinhLuan = $item->loai_nguoi_dung == 'trainer'
                    ? $item->trainer
                    : $item->client;

                $item->ten_nguoi_dung = $nguoiBinhLuan?->ho_ten
                    ?? 'Thành viên VisionFit';

                $item->anh_dai_dien = $item->loai_nguoi_dung == 'trainer'
                    ? $nguoiBinhLuan?->hinh_anh
                    : $nguoiBinhLuan?->anh_dai_dien;

                $item->da_thich = LuotThichBinhLuan::where(
                    'id_binh_luan', $item->id_binh_luan
                )
                    ->where('id_nguoi_dung', $user->id)
                    ->where('loai_nguoi_dung', $loaiNguoiDung)
                    ->exists();

                unset($item->client, $item->trainer);

                return $item;
            });

        return response()->json([
            'status' => true,
            'message' => 'Lấy danh sách bình luận thành công',
            'data' => $data
        ]);
    }

    public function deleteComment($id)
    {
        $user = Auth::guard('sanctum')->user();

        if (!$user) {
            return response()->json([
                'status' => false,
                'message' => 'Bạn chưa đăng nhập'
            ], 401);
        }

        $loaiNguoiDung = $user instanceof \App\Models\Trainer
            ? 'trainer' : 'client';

        $binhLuan = BinhLuanBaiDang::where('id_binh_luan', $id)
            ->where('id_nguoi_dung', $user->id)
            ->where('loai_nguoi_dung', $loaiNguoiDung)
            ->where('tinh_trang', '1')
            ->first();

        if (!$binhLuan) {
            return response()->json([
                'status' => false,
                'message' => 'Không tìm thấy bình luận hoặc bạn không có quyền xóa'
            ], 404);
        }

        $binhLuan->update([
            'tinh_trang' => '0'
        ]);

        return response()->json([
            'status' => true,
            'message' => 'Đã xóa bình luận'
        ]);
    }

    
    public function comment(Request $request, $id)
    {
        $user = Auth::guard('sanctum')->user();

        if (!$user) {
            return response()->json([
                'status' => false,
                'message' => 'Bạn chưa đăng nhập'
            ], 401);
        }

        $loaiNguoiDung = $user instanceof \App\Models\Trainer
            ? 'trainer' : 'client';

        $request->validate([
            'noi_dung' => 'required|string|max:1000',
            'id_binh_luan_cha' => 'nullable|integer|min:1',
        ]);

        $baiDang = BaiDang::where('id_bai_dang', $id)
            ->where('tinh_trang', '1')
            ->first();

        if (!$baiDang) {
            return response()->json([
                'status' => false,
                'message' => 'Bài đăng không tồn tại'
            ], 404);
        }

        if ($request->filled('id_binh_luan_cha')) {
            $binhLuanCha = BinhLuanBaiDang::where(
                'id_binh_luan', $request->id_binh_luan_cha
            )
                ->where('id_bai_dang', $id)
                ->where('tinh_trang', '1')
                ->first();

            if (!$binhLuanCha) {
                return response()->json([
                    'status' => false,
                    'message' => 'Bình luận cha không tồn tại'
                ], 404);
            }
        }

        $binhLuan = BinhLuanBaiDang::create([
            'id_bai_dang' => $id,
            'id_nguoi_dung' => $user->id,
            'loai_nguoi_dung' => $loaiNguoiDung,
            'id_binh_luan_cha' => $request->id_binh_luan_cha,
            'noi_dung' => $request->noi_dung,
            'tinh_trang' => '1',
        ]);

        return response()->json([
            'status' => true,
            'message' => 'Bình luận thành công',
            'data' => $binhLuan
        ], 201);
    }

    public function updateComment(Request $request, $id)
    {
        $user = Auth::guard('sanctum')->user();

        if (!$user) {
            return response()->json([
                'status' => false,
                'message' => 'Bạn chưa đăng nhập'
            ], 401);
        }

        $loaiNguoiDung = $user instanceof \App\Models\Trainer
            ? 'trainer' : 'client';

        $request->validate([
            'noi_dung' => 'required|string|max:1000',
        ]);

        $comment = BinhLuanBaiDang::where('id_binh_luan', $id)
            ->where('id_nguoi_dung', $user->id)
            ->where('loai_nguoi_dung', $loaiNguoiDung)
            ->where('tinh_trang', '1')
            ->first();

        if (!$comment) {
            return response()->json([
                'status' => false,
                'message' => 'Không tìm thấy bình luận hoặc bạn không có quyền sửa'
            ], 404);
        }

        $comment->update([
            'noi_dung' => $request->noi_dung
        ]);

        return response()->json([
            'status' => true,
            'message' => 'Đã cập nhật bình luận',
            'data' => $comment
        ]);
    }
    public function likeComment($id)
    {
        $user = Auth::guard('sanctum')->user();

        if (!$user) {
            return response()->json([
                'status' => false,
                'message' => 'Bạn chưa đăng nhập'
            ], 401);
        }

        $loaiNguoiDung = $user instanceof \App\Models\Trainer
            ? 'trainer' : 'client';

        $comment = BinhLuanBaiDang::where('id_binh_luan', $id)
            ->where('tinh_trang', '1')
            ->first();

        if (!$comment) {
            return response()->json([
                'status' => false,
                'message' => 'Bình luận không tồn tại'
            ], 404);
        }

        LuotThichBinhLuan::firstOrCreate([
            'id_binh_luan' => $id,
            'id_nguoi_dung' => $user->id,
            'loai_nguoi_dung' => $loaiNguoiDung,
        ]);

        return response()->json([
            'status' => true,
            'message' => 'Đã thích bình luận'
        ]);
    }

    public function unlikeComment($id)
    {
        $user = Auth::guard('sanctum')->user();

        if (!$user) {
            return response()->json([
                'status' => false,
                'message' => 'Bạn chưa đăng nhập'
            ], 401);
        }

        $loaiNguoiDung = $user instanceof \App\Models\Trainer
            ? 'trainer' : 'client';

        LuotThichBinhLuan::where('id_binh_luan', $id)
            ->where('id_nguoi_dung', $user->id)
            ->where('loai_nguoi_dung', $loaiNguoiDung)
            ->delete();

        return response()->json([
            'status' => true,
            'message' => 'Đã bỏ thích bình luận'
        ]);
    }

    
    public function savedPosts()
    {
        // Lấy người dùng đang đăng nhập
        $user = Auth::guard('sanctum')->user();
        if (!$user) {
            return response()->json([
                'status' => false,
                'message' => 'Bạn chưa đăng nhập'
            ], 401);
        }

        $idNguoiDung = $user->id;
        $loaiNguoiDung = $user instanceof \App\Models\Trainer
            ? 'trainer' : 'client';
        // Lấy danh sách bài đăng đã lưu
        $data = BaiDang::with([
            'media',
            'client:id,ho_ten,anh_dai_dien',
            'trainer:id,ho_ten,hinh_anh'
        ])
            ->withCount([
                'luotThich as so_luot_thich',
                'binhLuan as so_binh_luan',
            ])
            ->where('tinh_trang', '1')
            ->whereHas('luuBaiDang', function ($query) use ($idNguoiDung, $loaiNguoiDung) {
                $query->where('id_nguoi_dung',$idNguoiDung)
                        ->where('loai_nguoi_dung', $loaiNguoiDung);
            })
            ->orderByDesc('created_at')
            ->get()
            ->map(function ($item) use ($idNguoiDung, $loaiNguoiDung) {
                $nguoiDang = $item->loai_nguoi_dung == 'trainer'
                    ? $item->trainer
                    : $item->client;

                $hoTen = $nguoiDang?->ho_ten ?? 'Thành viên VisionFit';
                // Tách họ tên để tạo avatar
                $parts = preg_split('/\s+/', trim($hoTen));


                $avatar = '';

                foreach (array_slice($parts, -2) as $part) {
                    $avatar .= mb_strtoupper(
                        mb_substr($part, 0, 1)
                    );
                }

                $item->ten_nguoi_dung = $hoTen;
                $item->avatar = $avatar ?: 'VF';

                 $item->anh_dai_dien = $item->loai_nguoi_dung == 'trainer'
                    ? $nguoiDang?->hinh_anh
                    : $nguoiDang?->anh_dai_dien;

                // Kiểm tra đã thích bài đăng chưa
                $item->da_thich = LuotThichBaiDang::where(
                    'id_bai_dang',
                    $item->id_bai_dang
                )
                    ->where('id_nguoi_dung', $idNguoiDung)
                    ->where('loai_nguoi_dung', $loaiNguoiDung)
                    ->exists();

                // Những bài trong danh sách này đều đã được lưu
                $item->da_luu = true;

                unset($item->client, $item->trainer);

                return $item;
            });

        return response()->json([
            'status' => true,
            'message' => 'Lấy danh sách bài đăng đã lưu thành công',
            'data' => $data
        ]);
    }


    

    

}
