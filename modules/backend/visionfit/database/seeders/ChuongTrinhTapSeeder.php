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
            // TĂNG CƠ - KHÔNG MỤC TIÊU
            // =====================================================

            [
                'id_cap_do' => 1,
                'ten_chuong_trinh' => 'Tập luyện cơ bản - Nam - Chưa có kinh nghiệm',
                'mo_ta' => 'Chương trình tập luyện cơ bản dành cho nam chưa có kinh nghiệm.',
                'muc_tieu' => null,
                'nhom_muc_tieu' => 0,
                'cap_do' => 'Chưa có kinh nghiệm',
                'so_sao' => 0,
                'gioi_tinh_ap_dung' => 0,
                'noi_tap' => 'Phòng tập',
                'so_ngay' => 30,
                'so_buoi_moi_tuan' => 3,
                'anh_dai_dien' => null,
                'tinh_trang' => 'hoat_dong',
                'created_at' => now(),
                'updated_at' => now(),
            ],

            [
                'id_cap_do' => 2,
                'ten_chuong_trinh' => 'Tập luyện cơ bản - Nam - Người bắt đầu',
                'mo_ta' => 'Chương trình tập luyện cơ bản dành cho nam mới bắt đầu tập luyện.',
                'muc_tieu' => null,
                'nhom_muc_tieu' => 0,
                'cap_do' => 'Người bắt đầu',
                'so_sao' => 0,
                'gioi_tinh_ap_dung' => 0,
                'noi_tap' => 'Phòng tập',
                'so_ngay' => 30,
                'so_buoi_moi_tuan' => 3,
                'anh_dai_dien' => null,
                'tinh_trang' => 'hoat_dong',
                'created_at' => now(),
                'updated_at' => now(),
            ],

            [
                'id_cap_do' => 3,
                'ten_chuong_trinh' => 'Tập luyện cơ bản - Nam - Nâng cao',
                'mo_ta' => 'Chương trình tập luyện dành cho nam có kinh nghiệm và muốn nâng cao thể lực.',
                'muc_tieu' => null,
                'nhom_muc_tieu' => 0,
                'cap_do' => 'Nâng cao',
                'so_sao' => 0,
                'gioi_tinh_ap_dung' => 0,
                'noi_tap' => 'Phòng tập',
                'so_ngay' => 30,
                'so_buoi_moi_tuan' => 4,
                'anh_dai_dien' => null,
                'tinh_trang' => 'hoat_dong',
                'created_at' => now(),
                'updated_at' => now(),
            ],

            [
                'id_cap_do' => 4,
                'ten_chuong_trinh' => 'Tập luyện cơ bản - Nam - Chuyên gia',
                'mo_ta' => 'Chương trình tập luyện cường độ cao dành cho nam có kỹ thuật tốt.',
                'muc_tieu' => null,
                'nhom_muc_tieu' => 0,
                'cap_do' => 'Chuyên gia',
                'so_sao' => 0,
                'gioi_tinh_ap_dung' => 0,
                'noi_tap' => 'Phòng tập',
                'so_ngay' => 30,
                'so_buoi_moi_tuan' => 5,
                'anh_dai_dien' => null,
                'tinh_trang' => 'hoat_dong',
                'created_at' => now(),
                'updated_at' => now(),
            ],

            [
                'id_cap_do' => 5,
                'ten_chuong_trinh' => 'Tập luyện cơ bản - Nam - Pro',
                'mo_ta' => 'Chương trình tập luyện nâng cao dành cho nam có nhiều kinh nghiệm.',
                'muc_tieu' => null,
                'nhom_muc_tieu' => 0,
                'cap_do' => 'Pro',
                'so_sao' => 0,
                'gioi_tinh_ap_dung' => 0,
                'noi_tap' => 'Phòng tập',
                'so_ngay' => 30,
                'so_buoi_moi_tuan' => 5,
                'anh_dai_dien' => null,
                'tinh_trang' => 'hoat_dong',
                'created_at' => now(),
                'updated_at' => now(),
            ],

            // =====================================================
            // TĂNG CƠ - CÓ MỤC TIÊU - NAM
            // =====================================================

            [
                'id_cap_do' => 1,
                'ten_chuong_trinh' => 'Tăng cơ - Nam - Chưa có kinh nghiệm',
                'mo_ta' => 'Chương trình tăng cơ dành cho nam chưa có kinh nghiệm tập luyện.',
                'muc_tieu' => 'Tăng cơ',
                'nhom_muc_tieu' => 1,
                'cap_do' => 'Chưa có kinh nghiệm',
                'so_sao' => 0,
                'gioi_tinh_ap_dung' => 0,
                'noi_tap' => 'Phòng tập',
                'so_ngay' => 30,
                'so_buoi_moi_tuan' => 3,
                'anh_dai_dien' => null,
                'tinh_trang' => 'hoat_dong',
                'created_at' => now(),
                'updated_at' => now(),
            ],

            [
                'id_cap_do' => 2,
                'ten_chuong_trinh' => 'Tăng cơ - Nam - Người bắt đầu',
                'mo_ta' => 'Chương trình tăng cơ dành cho nam mới bắt đầu tập luyện.',
                'muc_tieu' => 'Tăng cơ',
                'nhom_muc_tieu' => 1,
                'cap_do' => 'Người bắt đầu',
                'so_sao' => 0,
                'gioi_tinh_ap_dung' => 0,
                'noi_tap' => 'Phòng tập',
                'so_ngay' => 30,
                'so_buoi_moi_tuan' => 4,
                'anh_dai_dien' => null,
                'tinh_trang' => 'hoat_dong',
                'created_at' => now(),
                'updated_at' => now(),
            ],

            [
                'id_cap_do' => 3,
                'ten_chuong_trinh' => 'Tăng cơ - Nam - Nâng cao',
                'mo_ta' => 'Chương trình tăng cơ dành cho nam có kinh nghiệm tập luyện.',
                'muc_tieu' => 'Tăng cơ',
                'nhom_muc_tieu' => 1,
                'cap_do' => 'Nâng cao',
                'so_sao' => 0,
                'gioi_tinh_ap_dung' => 0,
                'noi_tap' => 'Phòng tập',
                'so_ngay' => 30,
                'so_buoi_moi_tuan' => 4,
                'anh_dai_dien' => null,
                'tinh_trang' => 'hoat_dong',
                'created_at' => now(),
                'updated_at' => now(),
            ],

            [
                'id_cap_do' => 4,
                'ten_chuong_trinh' => 'Tăng cơ - Nam - Chuyên gia',
                'mo_ta' => 'Chương trình tăng cơ cường độ cao dành cho nam.',
                'muc_tieu' => 'Tăng cơ',
                'nhom_muc_tieu' => 1,
                'cap_do' => 'Chuyên gia',
                'so_sao' => 0,
                'gioi_tinh_ap_dung' => 0,
                'noi_tap' => 'Phòng tập',
                'so_ngay' => 30,
                'so_buoi_moi_tuan' => 5,
                'anh_dai_dien' => null,
                'tinh_trang' => 'hoat_dong',
                'created_at' => now(),
                'updated_at' => now(),
            ],

            [
                'id_cap_do' => 5,
                'ten_chuong_trinh' => 'Tăng cơ - Nam - Pro',
                'mo_ta' => 'Chương trình tăng cơ chuyên sâu dành cho nam có nhiều kinh nghiệm.',
                'muc_tieu' => 'Tăng cơ',
                'nhom_muc_tieu' => 1,
                'cap_do' => 'Pro',
                'so_sao' => 0,
                'gioi_tinh_ap_dung' => 0,
                'noi_tap' => 'Phòng tập',
                'so_ngay' => 30,
                'so_buoi_moi_tuan' => 5,
                'anh_dai_dien' => null,
                'tinh_trang' => 'hoat_dong',
                'created_at' => now(),
                'updated_at' => now(),
            ],

            // =====================================================
            // TĂNG CƠ - CÓ MỤC TIÊU - NỮ
            // =====================================================

            [
                'id_cap_do' => 1,
                'ten_chuong_trinh' => 'Tăng cơ - Nữ - Chưa có kinh nghiệm',
                'mo_ta' => 'Chương trình tăng cơ dành cho nữ chưa có kinh nghiệm.',
                'muc_tieu' => 'Tăng cơ',
                'nhom_muc_tieu' => 1,
                'cap_do' => 'Chưa có kinh nghiệm',
                'so_sao' => 0,
                'gioi_tinh_ap_dung' => 1,
                'noi_tap' => 'Phòng tập',
                'so_ngay' => 30,
                'so_buoi_moi_tuan' => 3,
                'anh_dai_dien' => null,
                'tinh_trang' => 'hoat_dong',
                'created_at' => now(),
                'updated_at' => now(),
            ],

            [
                'id_cap_do' => 2,
                'ten_chuong_trinh' => 'Tăng cơ - Nữ - Người bắt đầu',
                'mo_ta' => 'Chương trình tăng cơ dành cho nữ mới bắt đầu.',
                'muc_tieu' => 'Tăng cơ',
                'nhom_muc_tieu' => 1,
                'cap_do' => 'Người bắt đầu',
                'so_sao' => 0,
                'gioi_tinh_ap_dung' => 1,
                'noi_tap' => 'Phòng tập',
                'so_ngay' => 30,
                'so_buoi_moi_tuan' => 4,
                'anh_dai_dien' => null,
                'tinh_trang' => 'hoat_dong',
                'created_at' => now(),
                'updated_at' => now(),
            ],

            [
                'id_cap_do' => 3,
                'ten_chuong_trinh' => 'Tăng cơ - Nữ - Nâng cao',
                'mo_ta' => 'Chương trình tăng cơ dành cho nữ có kinh nghiệm.',
                'muc_tieu' => 'Tăng cơ',
                'nhom_muc_tieu' => 1,
                'cap_do' => 'Nâng cao',
                'so_sao' => 0,
                'gioi_tinh_ap_dung' => 1,
                'noi_tap' => 'Phòng tập',
                'so_ngay' => 30,
                'so_buoi_moi_tuan' => 4,
                'anh_dai_dien' => null,
                'tinh_trang' => 'hoat_dong',
                'created_at' => now(),
                'updated_at' => now(),
            ],

            [
                'id_cap_do' => 4,
                'ten_chuong_trinh' => 'Tăng cơ - Nữ - Chuyên gia',
                'mo_ta' => 'Chương trình tăng cơ cường độ cao dành cho nữ.',
                'muc_tieu' => 'Tăng cơ',
                'nhom_muc_tieu' => 1,
                'cap_do' => 'Chuyên gia',
                'so_sao' => 0,
                'gioi_tinh_ap_dung' => 1,
                'noi_tap' => 'Phòng tập',
                'so_ngay' => 30,
                'so_buoi_moi_tuan' => 5,
                'anh_dai_dien' => null,
                'tinh_trang' => 'hoat_dong',
                'created_at' => now(),
                'updated_at' => now(),
            ],

            [
                'id_cap_do' => 5,
                'ten_chuong_trinh' => 'Tăng cơ - Nữ - Pro',
                'mo_ta' => 'Chương trình tăng cơ chuyên sâu dành cho nữ.',
                'muc_tieu' => 'Tăng cơ',
                'nhom_muc_tieu' => 1,
                'cap_do' => 'Pro',
                'so_sao' => 0,
                'gioi_tinh_ap_dung' => 1,
                'noi_tap' => 'Phòng tập',
                'so_ngay' => 30,
                'so_buoi_moi_tuan' => 5,
                'anh_dai_dien' => null,
                'tinh_trang' => 'hoat_dong',
                'created_at' => now(),
                'updated_at' => now(),
            ],

        ]);
    }
}
