<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class KeHoachAnSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('ke_hoach_an')->truncate();
        DB::table('ke_hoach_an')->insert([
            [
                'id_chuong_trinh' => 1,
                'id_hoi_vien' => 1,
                'id_nguoi_tao' => null,
                'ten_ke_hoach' => 'Kế hoạch ăn toàn thân nền tảng 21 ngày',
                'muc_tieu_calo' => 2000,
                'protein_muc_tieu' => 100,
                'carb_muc_tieu' => 250,
                'fat_muc_tieu' => 65,
                'ngay_bat_dau' => '2026-10-16',
                'ngay_ket_thuc' => '2026-11-05',
                'tinh_trang' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id_chuong_trinh' => 41,
                'id_hoi_vien' => 3,
                'id_nguoi_tao' => null,
                'ten_ke_hoach' => 'Kế hoạch ăn tăng cơ 30 ngày',
                'muc_tieu_calo' => 2500,
                'protein_muc_tieu' => 150,
                'carb_muc_tieu' => 300,
                'fat_muc_tieu' => 75,
                'ngay_bat_dau' => '2026-10-16',
                'ngay_ket_thuc' => '2026-11-14',
                'tinh_trang' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id_chuong_trinh' => 21,
                'id_hoi_vien' => 2,
                'id_nguoi_tao' => null,
                'ten_ke_hoach' => 'Kế hoạch ăn toàn thân nền tảng 21 ngày - Nữ',
                'muc_tieu_calo' => 1800,
                'protein_muc_tieu' => 90,
                'carb_muc_tieu' => 220,
                'fat_muc_tieu' => 60,
                'ngay_bat_dau' => '2026-10-16',
                'ngay_ket_thuc' => '2026-11-05',
                'tinh_trang' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id_chuong_trinh' => 46,
                'id_hoi_vien' => 5,
                'id_nguoi_tao' => null,
                'ten_ke_hoach' => 'Kế hoạch ăn tăng cơ 30 ngày - Nữ',
                'muc_tieu_calo' => 2000,
                'protein_muc_tieu' => 110,
                'carb_muc_tieu' => 240,
                'fat_muc_tieu' => 65,
                'ngay_bat_dau' => '2026-10-16',
                'ngay_ket_thuc' => '2026-11-14',
                'tinh_trang' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        
    }
}
