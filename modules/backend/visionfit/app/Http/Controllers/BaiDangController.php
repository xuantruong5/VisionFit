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

class BaiDangController extends Controller
{
    // Lấy danh sách bài đăng
    public function index()
    {
        $idNguoiDung = 1;

        $data = BaiDang::with([
            'media',
            'client:id,ho_ten,anh_dai_dien'
        ])
            ->withCount([
                'luotThich as so_luot_thich',
                'binhLuan as so_binh_luan',
            ])
            ->where('tinh_trang', '1')
            ->orderByDesc('created_at')
            ->get()
            ->map(function ($item) use ($idNguoiDung) {

                $hoTen = $item->client?->ho_ten
                    ?? 'Thành viên VisionFit';

                $parts = preg_split('/\s+/', trim($hoTen));

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

                $item->da_thich = LuotThichBaiDang::where(
                    'id_bai_dang',
                    $item->id_bai_dang
                )
                    ->where('id_nguoi_dung', $idNguoiDung)
                    ->exists();

                $item->da_luu = LuuBaiDang::where(
                    'id_bai_dang',
                    $item->id_bai_dang
                )
                    ->where('id_nguoi_dung', $idNguoiDung)
                    ->exists();

                unset($item->client);

                return $item;
            });

        return response()->json([
            'status' => true,
            'data' => $data
        ]);
    }
    // Tạo bài đăng
    public function store(Request $request)
    {
        $request->validate([
            'id_nguoi_dung' => 'required|integer',
            'caption' => 'nullable|string|max:2000',
            'pham_vi_hien_thi' => 'required|in:0,1,2',
            'media' => 'nullable|file|mimes:jpg,jpeg,png,webp,mp4,mov|max:20480',
        ]);

        $baiDang = DB::transaction(function () use ($request) {

            $post = BaiDang::create([
                'id_nguoi_dung' => $request->id_nguoi_dung,
                'caption' => $request->caption,
                'pham_vi_hien_thi' => $request->pham_vi_hien_thi,
                'tinh_trang' => '1',
            ]);

            if ($request->hasFile('media')) {

                $file = $request->file('media');

                $path = $file->store(
                    'sportfeed',
                    'public'
                );

                $loaiMedia = str_starts_with(
                    $file->getMimeType(),
                    'video/'
                )
                    ? 'video'
                    : 'image';

                Media::create([
                    'id_bai_dang' => $post->id_bai_dang,
                    'loai_media' => $loaiMedia,
                    'media_url' =>
                    $request->getSchemeAndHttpHost()
                        . Storage::url($path),
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

    public function like($id)
    {
        LuotThichBaiDang::firstOrCreate([
            'id_bai_dang' => $id,
            'id_nguoi_dung' => 1,
        ]);

        return response()->json([
            'status' => true,
            'message' => 'Đã thích bài viết'
        ]);
    }

    public function unlike($id)
    {
        LuotThichBaiDang::where('id_bai_dang', $id)
            ->where('id_nguoi_dung', 1)
            ->delete();

        return response()->json([
            'status' => true,
            'message' => 'Đã bỏ thích'
        ]);
    }

    public function savePost($id)
    {
        LuuBaiDang::firstOrCreate([
            'id_bai_dang' => $id,
            'id_nguoi_dung' => 1,
        ]);

        return response()->json([
            'status' => true,
            'message' => 'Đã lưu bài viết'
        ]);
    }

    public function unsavePost($id)
    {
        LuuBaiDang::where('id_bai_dang', $id)
            ->where('id_nguoi_dung', 1)
            ->delete();

        return response()->json([
            'status' => true,
            'message' => 'Đã bỏ lưu bài viết'
        ]);
    }

    public function getComments($id)
    {
        $data = BinhLuanBaiDang::with(
            'client:id,ho_ten,anh_dai_dien'
        )
            ->where('id_bai_dang', $id)
            ->where('tinh_trang', '1')
            ->orderBy('created_at')
            ->get()
            ->map(function ($item) {

                $hoTen = $item->client?->ho_ten
                    ?? 'Thành viên VisionFit';

                $item->ten_nguoi_dung = $hoTen;
                $item->anh_dai_dien =
                    $item->client?->anh_dai_dien;
                $item->so_luot_thich = LuotThichBinhLuan::where(
                    'id_binh_luan',
                    $item->id_binh_luan
                )->count();

                $item->da_thich = LuotThichBinhLuan::where(
                    'id_binh_luan',
                    $item->id_binh_luan
                )
                    ->where('id_nguoi_dung', 1)
                    ->exists();

                unset($item->client);

                return $item;
            });

        return response()->json([
            'status' => true,
            'data' => $data
        ]);
    }

    public function deleteComment($id)
    {
        $binhLuan = BinhLuanBaiDang::where('id_binh_luan', $id)
            ->where('id_nguoi_dung', 1)
            ->where('tinh_trang', '1')
            ->first();

        if (!$binhLuan) {
            return response()->json([
                'status' => false,
                'message' => 'Không tìm thấy bình luận'
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

    public function savedPosts()
    {
        $idNguoiDung = 1;

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

                $item->da_thich =
                    LuotThichBaiDang::where(
                        'id_bai_dang',
                        $item->id_bai_dang
                    )
                    ->where(
                        'id_nguoi_dung',
                        $idNguoiDung
                    )
                    ->exists();

                $item->da_luu = true;

                unset($item->client);

                return $item;
            });

        return response()->json([
            'status' => true,
            'data' => $data
        ]);
    }

    public function comment(Request $request, $id)
    {
        $request->validate([
            'noi_dung' => 'required|string|max:1000',
            'id_binh_luan_cha' => 'nullable|integer',
        ]);

        $binhLuan = BinhLuanBaiDang::create([
            'id_bai_dang' => $id,
            'id_nguoi_dung' => 1,
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
        $request->validate([
            'noi_dung' => 'required|string|max:1000',
        ]);

        $comment = BinhLuanBaiDang::where('id_binh_luan', $id)
            ->where('id_nguoi_dung', 1)
            ->where('tinh_trang', '1')
            ->first();

        if (!$comment) {
            return response()->json([
                'status' => false,
                'message' => 'Không tìm thấy bình luận'
            ], 404);
        }

        $comment->update([
            'noi_dung' => $request->noi_dung
        ]);

        return response()->json([
            'status' => true,
            'message' => 'Đã cập nhật bình luận'
        ]);
    }

    public function likeComment($id)
    {
        LuotThichBinhLuan::firstOrCreate([
            'id_binh_luan' => $id,
            'id_nguoi_dung' => 1,
        ]);

        return response()->json([
            'status' => true
        ]);
    }

    public function unlikeComment($id)
    {
        LuotThichBinhLuan::where('id_binh_luan', $id)
            ->where('id_nguoi_dung', 1)
            ->delete();

        return response()->json([
            'status' => true
        ]);
    }

    public function updatePost(Request $request, $id)
    {
        $request->validate([
            'caption' => 'nullable|string|max:2000',
            'pham_vi_hien_thi' => 'nullable|in:0,1,2',
        ]);

        $post = BaiDang::where('id_bai_dang', $id)
            ->where('id_nguoi_dung', 1)
            ->where('tinh_trang', '1')
            ->first();

        if (!$post) {
            return response()->json([
                'status' => false,
                'message' => 'Không tìm thấy bài viết'
            ], 404);
        }

        $post->update([
            'caption' => $request->caption ?? $post->caption,
            'pham_vi_hien_thi' =>
            $request->pham_vi_hien_thi ?? $post->pham_vi_hien_thi,
        ]);

        return response()->json([
            'status' => true,
            'message' => 'Đã cập nhật bài viết',
            'data' => $post
        ]);
    }

    public function deletePost($id)
    {
        $post = BaiDang::where('id_bai_dang', $id)
            ->where('id_nguoi_dung', 1)
            ->where('tinh_trang', '1')
            ->first();

        if (!$post) {
            return response()->json([
                'status' => false,
                'message' => 'Không tìm thấy bài viết'
            ], 404);
        }

        $post->update([
            'tinh_trang' => '0'
        ]);

        return response()->json([
            'status' => true,
            'message' => 'Đã xóa bài viết'
        ]);
    }
}
