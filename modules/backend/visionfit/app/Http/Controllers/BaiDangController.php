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

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $user->id,
                'ho_ten' => $user->ho_ten,
                'email' => $user->email,
                'anh_dai_dien' => $user->anh_dai_dien
            ]
        ]);
    }

    



    // Lấy danh sách bài đăng
    public function index()
    {
        // Lấy người dùng đang đăng nhập thực tế
        $user = Auth::guard('sanctum')->user();
        // Kiểm tra người dùng
        if (!$user) {
            return response()->json([
                'status' => false,
                'message' => 'Chưa đăng nhập'
            ], 401);
        }
        // Lấy ID người dùng thực tế
        $idNguoiDung = $user->id;
        $data = BaiDang::with([ 'media', 'client:id,ho_ten,anh_dai_dien' ])
            ->withCount([
                'luotThich as so_luot_thich',
                'binhLuan as so_binh_luan',
            ])
            ->where('tinh_trang', '1')
            ->orderByDesc('created_at')
            ->get()
            ->map(function ($item) use ($idNguoiDung) {
                // Lấy tên người đăng
                $hoTen = $item->client?->ho_ten ?? 'Thành viên VisionFit';
                // Tách họ tên
                $parts = preg_split('/\s+/', trim($hoTen));
                // Tạo avatar chữ viết tắt
                $avatar = '';

                foreach (array_slice($parts, -2) as $part) {
                    $avatar .= mb_strtoupper(
                        mb_substr($part, 0, 1)
                    );
                }

                // Thông tin người đăng
                $item->ten_nguoi_dung = $hoTen;
                $item->avatar = $avatar ?: 'VF';
                $item->anh_dai_dien =
                    $item->client?->anh_dai_dien;
                // Kiểm tra người đăng nhập đã thích bài viết chưa
                $item->da_thich = LuotThichBaiDang::where( 'id_bai_dang', $item->id_bai_dang)
                    ->where('id_nguoi_dung', $idNguoiDung)
                    ->exists();
                // Kiểm tra người đăng nhập đã lưu bài viết chưa
                $item->da_luu = LuuBaiDang::where( 'id_bai_dang', $item->id_bai_dang )
                    ->where('id_nguoi_dung', $idNguoiDung)
                    ->exists();
                // Không trả object client gốc
                unset($item->client);
                return $item;
            });
        return response()->json([
            'status' => true,
            'message' => 'Lấy danh sách bài đăng thành công',
            'data' => $data
        ]);
    }
    // Tạo bài đăng
    public function store(Request $request)
    {
        $user = Auth::guard('sanctum')->user();
        if (!$user) {
            return response()->json([
                'status' => false,
                'message' => 'Bạn chưa đăng nhập'
            ], 401);
        }
        $request->validate([
            'caption' => 'nullable|string|max:2000',
            'pham_vi_hien_thi' => 'required|in:0,1,2',
            'media' => 'nullable|file|mimes:jpg,jpeg,png,webp,mp4,mov,quicktime,avi,mkv|max:102400',
        ]);
        $baiDang = DB::transaction(function () use ($request, $user) {
            $post = BaiDang::create([
                'id_nguoi_dung' => $user->id,
                'caption' => $request->caption,
                'pham_vi_hien_thi' => $request->pham_vi_hien_thi,
                'tinh_trang' => '1',
            ]);
            if ($request->hasFile('media')) {
                $file = $request->file('media');
                $path = $file->store('sportfeed', 'public');
                $loaiMedia = str_starts_with( $file->getMimeType(), 'video/') ? 'video' : 'image';

                Media::create([
                    'id_bai_dang' => $post->id_bai_dang,
                    'loai_media' => $loaiMedia,
                    'media_url' => $request->getSchemeAndHttpHost(). Storage::url($path),
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

        // Validate dữ liệu
        $request->validate([
            'caption' => 'sometimes|nullable|string|max:2000',
            'pham_vi_hien_thi' => 'sometimes|required|in:0,1,2',
        ]);

        // Tìm bài đăng của người dùng hiện tại
        $post = BaiDang::where('id_bai_dang', $id)
            ->where('id_nguoi_dung', $user->id)
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
        // Tìm bài đăng của người dùng hiện tại
        $post = BaiDang::where('id_bai_dang', $id)
            ->where('id_nguoi_dung', $user->id)
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
        // Xóa lượt thích của chính người đang đăng nhập
        LuotThichBaiDang::where('id_bai_dang', $id)
            ->where('id_nguoi_dung', $user->id)
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

        // Bỏ lưu bài viết của chính người dùng
        LuuBaiDang::where('id_bai_dang', $id)
            ->where('id_nguoi_dung', $user->id)
            ->delete();

        return response()->json([
            'status' => true,
            'message' => 'Đã bỏ lưu bài viết'
        ]);
    }


    
    public function getComments($id)
    {
        // Lấy người dùng đang đăng nhập
        $user = Auth::guard('sanctum')->user();
        if (!$user) {
            return response()->json([
                'status' => false,
                'message' => 'Bạn chưa đăng nhập'
            ], 401);
        }
        // Kiểm tra bài đăng có tồn tại
        $baiDang = BaiDang::where('id_bai_dang', $id)
            ->where('tinh_trang', '1')
            ->first();
        if (!$baiDang) {
            return response()->json([
                'status' => false,
                'message' => 'Bài đăng không tồn tại'
            ], 404);
        }
        // Lấy danh sách bình luận
        $data = BinhLuanBaiDang::with( 'client:id,ho_ten,anh_dai_dien')
            ->where('id_bai_dang', $id)
            ->where('tinh_trang', '1')
            ->withCount([ 'luotThich as so_luot_thich'])
            ->orderBy('created_at')
            ->get()
            ->map(function ($item) use ($user) {
                $hoTen = $item->client?->ho_ten ?? 'Thành viên VisionFit';
                $item->ten_nguoi_dung = $hoTen;
                $item->anh_dai_dien = $item->client?->anh_dai_dien;

                // Kiểm tra người dùng hiện tại đã thích bình luận chưa
                $item->da_thich = LuotThichBinhLuan::where( 'id_binh_luan', $item->id_binh_luan )
                    ->where('id_nguoi_dung', $user->id)
                    ->exists();
                unset($item->client);
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
        // Lấy người dùng đang đăng nhập
        $user = Auth::guard('sanctum')->user();

        if (!$user) {
            return response()->json([
                'status' => false,
                'message' => 'Bạn chưa đăng nhập'
            ], 401);
        }

        // Tìm bình luận thuộc người dùng hiện tại
        $binhLuan = BinhLuanBaiDang::where(
            'id_binh_luan',
            $id
        )
            ->where('id_nguoi_dung', $user->id)
            ->where('tinh_trang', '1')
            ->first();

        if (!$binhLuan) {
            return response()->json([
                'status' => false,
                'message' => 'Không tìm thấy bình luận hoặc bạn không có quyền xóa'
            ], 404);
        }

        // Xóa mềm bình luận
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
        // Lấy người dùng đang đăng nhập
        $user = Auth::guard('sanctum')->user();
        if (!$user) {
            return response()->json([
                'status' => false,
                'message' => 'Bạn chưa đăng nhập'
            ], 401);
        }
        // Validate dữ liệu gửi lên
        $request->validate([
            'noi_dung' => 'required|string|max:1000',
            'id_binh_luan_cha' => 'nullable|integer|min:1',
        ]);

        // Kiểm tra bài đăng tồn tại
        $baiDang = BaiDang::where('id_bai_dang', $id)
            ->where('tinh_trang', '1')
            ->first();

        if (!$baiDang) {
            return response()->json([
                'status' => false,
                'message' => 'Bài đăng không tồn tại'
            ], 404);
        }

        // Nếu là trả lời bình luận thì kiểm tra bình luận cha
        if ($request->filled('id_binh_luan_cha')) {
            $binhLuanCha = BinhLuanBaiDang::where(
                'id_binh_luan',
                $request->id_binh_luan_cha
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

        // Tạo bình luận
        $binhLuan = BinhLuanBaiDang::create([
            'id_bai_dang' => $id,
            'id_nguoi_dung' => $user->id,
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
        // Lấy người dùng đang đăng nhập
        $user = Auth::guard('sanctum')->user();
        if (!$user) {
            return response()->json([
                'status' => false,
                'message' => 'Bạn chưa đăng nhập'
            ], 401);
        }
        // Validate nội dung
        $request->validate([
            'noi_dung' => 'required|string|max:1000',
        ]);
        // Tìm bình luận của người dùng hiện tại
        $comment = BinhLuanBaiDang::where( 'id_binh_luan', $id)
            ->where('id_nguoi_dung', $user->id)
            ->where('tinh_trang', '1')
            ->first();
        if (!$comment) {
            return response()->json([
                'status' => false,
                'message' => 'Không tìm thấy bình luận hoặc bạn không có quyền sửa'
            ], 404);
        }
        // Cập nhật nội dung
        $comment->update([ 'noi_dung' => $request->noi_dung ]);
        return response()->json([
            'status' => true,
            'message' => 'Đã cập nhật bình luận',
            'data' => $comment
        ]);
    }
    public function likeComment($id)
    {
        // Lấy người dùng đang đăng nhập
        $user = Auth::guard('sanctum')->user();

        if (!$user) {
            return response()->json([
                'status' => false,
                'message' => 'Bạn chưa đăng nhập'
            ], 401);
        }

        // Kiểm tra bình luận tồn tại và đang hoạt động
        $comment = BinhLuanBaiDang::where(
            'id_binh_luan',
            $id
        )
            ->where('tinh_trang', '1')
            ->first();

        if (!$comment) {
            return response()->json([
                'status' => false,
                'message' => 'Bình luận không tồn tại'
            ], 404);
        }

        // Tạo lượt thích, tránh thích trùng
        LuotThichBinhLuan::firstOrCreate([
            'id_binh_luan' => $id,
            'id_nguoi_dung' => $user->id,
        ]);

        return response()->json([
            'status' => true,
            'message' => 'Đã thích bình luận'
        ]);
    }

    public function unlikeComment($id)
    {
        // Lấy người dùng đang đăng nhập
        $user = Auth::guard('sanctum')->user();
        if (!$user) {
            return response()->json([
                'status' => false,
                'message' => 'Bạn chưa đăng nhập'
            ], 401);
        }
        // Xóa lượt thích của người dùng hiện tại
        LuotThichBinhLuan::where( 'id_binh_luan',  $id )
            ->where('id_nguoi_dung', $user->id)
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
        // Lấy danh sách bài đăng đã lưu
        $data = BaiDang::with([
            'media',
            'client:id,ho_ten,anh_dai_dien'
        ])
            ->withCount([
                'luotThich as so_luot_thich',
                'binhLuan as so_binh_luan',
            ])
            ->where('tinh_trang', '1')
            ->whereHas('luuBaiDang', function ($query) use ($idNguoiDung) {
                $query->where(
                    'id_nguoi_dung',
                    $idNguoiDung
                );
            })
            ->orderByDesc('created_at')
            ->get()
            ->map(function ($item) use ($idNguoiDung) {

                $hoTen = $item->client?->ho_ten
                    ?? 'Thành viên VisionFit';

                // Tách họ tên để tạo avatar
                $parts = preg_split(
                    '/\s+/',
                    trim($hoTen)
                );

                $avatar = '';

                foreach (array_slice($parts, -2) as $part) {
                    $avatar .= mb_strtoupper(
                        mb_substr($part, 0, 1)
                    );
                }

                $item->ten_nguoi_dung = $hoTen;
                $item->avatar = $avatar ?: 'VF';

                $item->anh_dai_dien =
                    $item->client?->anh_dai_dien;

                // Kiểm tra đã thích bài đăng chưa
                $item->da_thich = LuotThichBaiDang::where(
                    'id_bai_dang',
                    $item->id_bai_dang
                )
                    ->where('id_nguoi_dung', $idNguoiDung)
                    ->exists();

                // Những bài trong danh sách này đều đã được lưu
                $item->da_luu = true;

                unset($item->client);

                return $item;
            });

        return response()->json([
            'status' => true,
            'message' => 'Lấy danh sách bài đăng đã lưu thành công',
            'data' => $data
        ]);
    }


    

    

}
