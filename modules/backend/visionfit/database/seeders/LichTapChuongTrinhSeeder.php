<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class LichTapChuongTrinhSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('lich_tap_chuong_trinh')->truncate();
        DB::table('lich_tap_chuong_trinh')->insert([
            // Chương trình 1: tập Thứ 2, 4, 6
            [
                'id_chuong_trinh' => 1,
                'thu_trong_tuan' => 'Thứ 2',
                'gio_bat_dau' => '06:00:00',
                'gio_ket_thuc' => '07:00:00',
                'ghi_chu' => null,
                'tinh_trang' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id_chuong_trinh' => 1,
                'thu_trong_tuan' => 'Thứ 4',
                'gio_bat_dau' => '06:00:00',
                'gio_ket_thuc' => '07:00:00',
                'ghi_chu' => null,
                'tinh_trang' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id_chuong_trinh' => 1,
                'thu_trong_tuan' => 'Thứ 6',
                'gio_bat_dau' => '06:00:00',
                'gio_ket_thuc' => '07:00:00',
                'ghi_chu' => null,
                'tinh_trang' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],

            // Chương trình 41: tập Thứ 2, 4, 6
            [
                'id_chuong_trinh' => 41,
                'thu_trong_tuan' => 'Thứ 2',
                'gio_bat_dau' => '06:00:00',
                'gio_ket_thuc' => '07:00:00',
                'ghi_chu' => null,
                'tinh_trang' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id_chuong_trinh' => 41,
                'thu_trong_tuan' => 'Thứ 4',
                'gio_bat_dau' => '06:00:00',
                'gio_ket_thuc' => '07:00:00',
                'ghi_chu' => null,
                'tinh_trang' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id_chuong_trinh' => 41,
                'thu_trong_tuan' => 'Thứ 6',
                'gio_bat_dau' => '06:00:00',
                'gio_ket_thuc' => '07:00:00',
                'ghi_chu' => null,
                'tinh_trang' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],

            // Chương trình 21: tập Thứ 3, 5, 7
            [
                'id_chuong_trinh' => 21,
                'thu_trong_tuan' => 'Thứ 3',
                'gio_bat_dau' => '06:00:00',
                'gio_ket_thuc' => '07:00:00',
                'ghi_chu' => null,
                'tinh_trang' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id_chuong_trinh' => 21,
                'thu_trong_tuan' => 'Thứ 5',
                'gio_bat_dau' => '06:00:00',
                'gio_ket_thuc' => '07:00:00',
                'ghi_chu' => null,
                'tinh_trang' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id_chuong_trinh' => 21,
                'thu_trong_tuan' => 'Thứ 7',
                'gio_bat_dau' => '06:00:00',
                'gio_ket_thuc' => '07:00:00',
                'ghi_chu' => null,
                'tinh_trang' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],

            // Chương trình 46: tập Thứ 3, 5, 7
            [
                'id_chuong_trinh' => 46,
                'thu_trong_tuan' => 'Thứ 3',
                'gio_bat_dau' => '06:00:00',
                'gio_ket_thuc' => '07:00:00',
                'ghi_chu' => null,
                'tinh_trang' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id_chuong_trinh' => 46,
                'thu_trong_tuan' => 'Thứ 5',
                'gio_bat_dau' => '06:00:00',
                'gio_ket_thuc' => '07:00:00',
                'ghi_chu' => null,
                'tinh_trang' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id_chuong_trinh' => 46,
                'thu_trong_tuan' => 'Thứ 7',
                'gio_bat_dau' => '06:00:00',
                'gio_ket_thuc' => '07:00:00',
                'ghi_chu' => null,
                'tinh_trang' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
