<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
class MucTieuDinhDuongSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('muc_tieu_dinh_duong')->truncate();
        DB::table('muc_tieu_dinh_duong')->insert([
            [
                'id_chuong_trinh' => 1,
                'muc_tieu_calo' => 2000,
                'protein_muc_tieu' => 100,
                'carb_muc_tieu' => 250,
                'fat_muc_tieu' => 65,               
                'tinh_trang' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id_chuong_trinh' => 41,
                'muc_tieu_calo' => 2500,
                'protein_muc_tieu' => 150,
                'carb_muc_tieu' => 300,
                'fat_muc_tieu' => 75,
                'tinh_trang' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [ // nữ 
                'id_chuong_trinh' => 21,
                'muc_tieu_calo' => 1800,
                'protein_muc_tieu' => 90,
                'carb_muc_tieu' => 220,
                'fat_muc_tieu' => 60,
                'tinh_trang' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id_chuong_trinh' => 46,
                'muc_tieu_calo' => 2000,
                'protein_muc_tieu' => 110,
                'carb_muc_tieu' => 240,
                'fat_muc_tieu' => 65,
                'tinh_trang' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
