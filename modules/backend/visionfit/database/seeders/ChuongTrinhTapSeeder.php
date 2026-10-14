<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ChuongTrinhTapSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('chuong_trinh_tap')->truncate();
        DB::table('chuong_trinh_tap')->insert([

            // =====================================================
            // TẬP LUYỆN CƠ BẢN - KHÔNG MỤC TIÊU
            // =====================================================

            [
                'id_cap_do' => 1,
                'ten_chuong_trinh' => 'Tập luyện toàn thân',
                'mo_ta' => 'Chương trình tập luyện toàn thân dành cho người chưa có kinh nghiệm.',
                'muc_tieu' => null,
                'nhom_muc_tieu' => 0,
                'so_sao' => 0,
                'gioi_tinh_ap_dung' => 0,
                'noi_tap' => 'Phòng tập',
                'so_ngay' => 30,
                'so_buoi_moi_tuan' => 3,
                'anh_dai_dien' => null,
                'tinh_trang' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],

            [
                'id_cap_do' => 2,
                'ten_chuong_trinh' => 'Rèn luyện thể lực',
                'mo_ta' => 'Chương trình rèn luyện thể lực dành cho người mới bắt đầu.',
                'muc_tieu' => null,
                'nhom_muc_tieu' => 0,
                'so_sao' => 0,
                'gioi_tinh_ap_dung' => 0,
                'noi_tap' => 'Ở nhà',
                'so_ngay' => 30,
                'so_buoi_moi_tuan' => 3,
                'anh_dai_dien' => null,
                'tinh_trang' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],

            [
                'id_cap_do' => 3,
                'ten_chuong_trinh' => 'Phát triển sức mạnh',
                'mo_ta' => 'Chương trình phát triển sức mạnh và cải thiện thể lực.',
                'muc_tieu' => null,
                'nhom_muc_tieu' => 0,
                'so_sao' => 0,
                'gioi_tinh_ap_dung' => 0,
                'noi_tap' => 'Phòng tập',
                'so_ngay' => 30,
                'so_buoi_moi_tuan' => 4,
                'anh_dai_dien' => null,
                'tinh_trang' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],

            [
                'id_cap_do' => 4,
                'ten_chuong_trinh' => 'Nâng cao thể chất',
                'mo_ta' => 'Chương trình nâng cao thể chất dành cho người có kỹ thuật tập luyện tốt.',
                'muc_tieu' => null,
                'nhom_muc_tieu' => 0,
                'so_sao' => 0,
                'gioi_tinh_ap_dung' => 0,
                'noi_tap' => 'Ở nhà',
                'so_ngay' => 30,
                'so_buoi_moi_tuan' => 5,
                'anh_dai_dien' => null,
                'tinh_trang' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],

            [
                'id_cap_do' => 5,
                'ten_chuong_trinh' => 'Phát triển thể chất toàn diện',
                'mo_ta' => 'Chương trình tập luyện chuyên sâu giúp cải thiện sức mạnh và thể lực.',
                'muc_tieu' => null,
                'nhom_muc_tieu' => 0,
                'so_sao' => 0,
                'gioi_tinh_ap_dung' => 0,
                'noi_tap' => 'Phòng tập',
                'so_ngay' => 30,
                'so_buoi_moi_tuan' => 5,
                'anh_dai_dien' => null,
                'tinh_trang' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],

            // =====================================================
            // TĂNG CƠ BẮP
            // =====================================================

            [
                'id_cap_do' => 1,
                'ten_chuong_trinh' => 'Tăng cơ bắp cơ bản',
                'mo_ta' => 'Chương trình tăng cơ dành cho người mới bắt đầu.',
                'muc_tieu' => 'Tăng cơ',
                'nhom_muc_tieu' => 1,
                'so_sao' => 0,
                'gioi_tinh_ap_dung' => 0,
                'noi_tap' => 'Phòng tập',
                'so_ngay' => 30,
                'so_buoi_moi_tuan' => 3,
                'anh_dai_dien' => null,
                'tinh_trang' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],

            [
                'id_cap_do' => 2,
                'ten_chuong_trinh' => 'Phát triển cơ bắp',
                'mo_ta' => 'Chương trình hỗ trợ phát triển cơ bắp cho người mới tập.',
                'muc_tieu' => 'Tăng cơ',
                'nhom_muc_tieu' => 1,
                'so_sao' => 0,
                'gioi_tinh_ap_dung' => 0,
                'noi_tap' => 'Ở nhà',
                'so_ngay' => 30,
                'so_buoi_moi_tuan' => 4,
                'anh_dai_dien' => null,
                'tinh_trang' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],

            [
                'id_cap_do' => 3,
                'ten_chuong_trinh' => 'Tăng sức mạnh cơ bắp',
                'mo_ta' => 'Chương trình phát triển sức mạnh cơ bắp dành cho người có kinh nghiệm.',
                'muc_tieu' => 'Tăng cơ',
                'nhom_muc_tieu' => 1,
                'so_sao' => 0,
                'gioi_tinh_ap_dung' => 0,
                'noi_tap' => 'Phòng tập',
                'so_ngay' => 30,
                'so_buoi_moi_tuan' => 4,
                'anh_dai_dien' => null,
                'tinh_trang' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],

            [
                'id_cap_do' => 4,
                'ten_chuong_trinh' => 'Xây dựng cơ bắp',
                'mo_ta' => 'Chương trình tập luyện chuyên sâu nhằm phát triển cơ bắp.',
                'muc_tieu' => 'Tăng cơ',
                'nhom_muc_tieu' => 1,
                'so_sao' => 0,
                'gioi_tinh_ap_dung' => 0,
                'noi_tap' => 'Ở nhà',
                'so_ngay' => 30,
                'so_buoi_moi_tuan' => 5,
                'anh_dai_dien' => null,
                'tinh_trang' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],

            [
                'id_cap_do' => 5,
                'ten_chuong_trinh' => 'Tăng cơ toàn thân',
                'mo_ta' => 'Chương trình tăng cơ toàn thân dành cho người có nhiều kinh nghiệm.',
                'muc_tieu' => 'Tăng cơ',
                'nhom_muc_tieu' => 1,
                'so_sao' => 0,
                'gioi_tinh_ap_dung' => 0,
                'noi_tap' => 'Phòng tập',
                'so_ngay' => 30,
                'so_buoi_moi_tuan' => 5,
                'anh_dai_dien' => null,
                'tinh_trang' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],

            // =====================================================
            // TĂNG CƠ - CÁC CHƯƠNG TRÌNH BỔ SUNG
            // =====================================================

            [
                'id_cap_do' => 1,
                'ten_chuong_trinh' => 'Tăng cơ tự nhiên',
                'mo_ta' => 'Chương trình tập luyện hỗ trợ phát triển cơ bắp theo khả năng cá nhân.',
                'muc_tieu' => 'Tăng cơ',
                'nhom_muc_tieu' => 1,
                'so_sao' => 0,
                'gioi_tinh_ap_dung' => 1,
                'noi_tap' => 'Ở nhà',
                'so_ngay' => 30,
                'so_buoi_moi_tuan' => 3,
                'anh_dai_dien' => null,
                'tinh_trang' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],

            [
                'id_cap_do' => 2,
                'ten_chuong_trinh' => 'Phát triển cơ toàn thân',
                'mo_ta' => 'Chương trình tập luyện toàn thân nhằm phát triển cơ bắp.',
                'muc_tieu' => 'Tăng cơ',
                'nhom_muc_tieu' => 1,
                'so_sao' => 0,
                'gioi_tinh_ap_dung' => 1,
                'noi_tap' => 'Phòng tập',
                'so_ngay' => 30,
                'so_buoi_moi_tuan' => 4,
                'anh_dai_dien' => null,
                'tinh_trang' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],

            [
                'id_cap_do' => 3,
                'ten_chuong_trinh' => 'Tăng cường sức mạnh',
                'mo_ta' => 'Chương trình tập luyện tăng cường sức mạnh và phát triển cơ bắp.',
                'muc_tieu' => 'Tăng cơ',
                'nhom_muc_tieu' => 1,
                'so_sao' => 0,
                'gioi_tinh_ap_dung' => 1,
                'noi_tap' => 'Ở nhà',
                'so_ngay' => 30,
                'so_buoi_moi_tuan' => 4,
                'anh_dai_dien' => null,
                'tinh_trang' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],

            [
                'id_cap_do' => 4,
                'ten_chuong_trinh' => 'Cải thiện sức mạnh cơ thể',
                'mo_ta' => 'Chương trình tập luyện nâng cao giúp cải thiện sức mạnh cơ thể.',
                'muc_tieu' => 'Tăng cơ',
                'nhom_muc_tieu' => 1,
                'so_sao' => 0,
                'gioi_tinh_ap_dung' => 1,
                'noi_tap' => 'Phòng tập',
                'so_ngay' => 30,
                'so_buoi_moi_tuan' => 5,
                'anh_dai_dien' => null,
                'tinh_trang' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],

            [
                'id_cap_do' => 5,
                'ten_chuong_trinh' => 'Phát triển cơ bắp chuyên sâu',
                'mo_ta' => 'Chương trình tập luyện chuyên sâu nhằm phát triển cơ bắp toàn diện.',
                'muc_tieu' => 'Tăng cơ',
                'nhom_muc_tieu' => 1,
                'so_sao' => 0,
                'gioi_tinh_ap_dung' => 1,
                'noi_tap' => 'Ở nhà',
                'so_ngay' => 30,
                'so_buoi_moi_tuan' => 5,
                'anh_dai_dien' => null,
                'tinh_trang' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
