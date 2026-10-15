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
                'id_nguoi_tao' => 1,
                'ten_ke_hoach' => 'Kế hoạch ăn tăng cơ',
                'muc_tieu_calo_ngay' => 2400,
                'protein_muc_tieu' => 160,
                'carb_muc_tieu' => 280,
                'fat_muc_tieu' => 70,
                'ngay_bat_dau' => '2026-09-01',
                'ngay_ket_thuc' => '2026-10-01',
                'tinh_trang' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id_chuong_trinh' => 2,
                'id_hoi_vien' => 2,
                'id_nguoi_tao' => 1,
                'ten_ke_hoach' => 'Kế hoạch ăn giảm cân',
                'muc_tieu_calo_ngay' => 1800,
                'protein_muc_tieu' => 140,
                'carb_muc_tieu' => 180,
                'fat_muc_tieu' => 55,
                'ngay_bat_dau' => '2026-09-01',
                'ngay_ket_thuc' => '2026-10-01',
                'tinh_trang' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id_chuong_trinh' => 3,
                'id_hoi_vien' => 3,
                'id_nguoi_tao' => 1,
                'ten_ke_hoach' => 'Kế hoạch ăn duy trì',
                'muc_tieu_calo_ngay' => 2100,
                'protein_muc_tieu' => 130,
                'carb_muc_tieu' => 240,
                'fat_muc_tieu' => 65,
                'ngay_bat_dau' => '2026-09-01',
                'ngay_ket_thuc' => '2026-10-01',
                'tinh_trang' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        
    }
}
