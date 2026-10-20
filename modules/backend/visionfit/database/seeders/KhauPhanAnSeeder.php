<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class KhauPhanAnSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('khau_phan_an')->truncate();
        DB::table('khau_phan_an')->insert([

            // ==================== KẾ HOẠCH 1 ====================
            // Chương trình 1: Tập luyện toàn thân nền tảng (nam)

            // Bữa sáng
            [
                'id_muc_tieu_dinh_duong' => 1,
                'id_mon_an' => 1,
                'ngay_an' => '2026-10-16',
                'gio_an' => '07:00:00',
                'bua_an' => 'SANG',
                'so_luong' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id_muc_tieu_dinh_duong' => 1,
                'id_mon_an' => 2,
                'ngay_an' => '2026-10-16',
                'gio_an' => '07:00:00',
                'bua_an' => 'SANG',
                'so_luong' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],

            // Phụ sáng
            [
                'id_muc_tieu_dinh_duong' => 1,
                'id_mon_an' => 6,
                'ngay_an' => '2026-10-16',
                'gio_an' => '09:30:00',
                'bua_an' => 'PHU_SANG',
                'so_luong' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id_muc_tieu_dinh_duong' => 1,
                'id_mon_an' => 10,
                'ngay_an' => '2026-10-16',
                'gio_an' => '09:30:00',
                'bua_an' => 'PHU_SANG',
                'so_luong' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],

            // Bữa trưa
            [
                'id_muc_tieu_dinh_duong' => 1,
                'id_mon_an' => 11,
                'ngay_an' => '2026-10-16',
                'gio_an' => '12:00:00',
                'bua_an' => 'TRUA',
                'so_luong' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id_muc_tieu_dinh_duong' => 1,
                'id_mon_an' => 14,
                'ngay_an' => '2026-10-16',
                'gio_an' => '12:00:00',
                'bua_an' => 'TRUA',
                'so_luong' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],

            // Phụ trưa
            [
                'id_muc_tieu_dinh_duong' => 1,
                'id_mon_an' => 16,
                'ngay_an' => '2026-10-16',
                'gio_an' => '15:00:00',
                'bua_an' => 'PHU_TRUA',
                'so_luong' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id_muc_tieu_dinh_duong' => 1,
                'id_mon_an' => 19,
                'ngay_an' => '2026-10-16',
                'gio_an' => '15:00:00',
                'bua_an' => 'PHU_TRUA',
                'so_luong' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],

            // Bữa tối
            [
                'id_muc_tieu_dinh_duong' => 1,
                'id_mon_an' => 21,
                'ngay_an' => '2026-10-16',
                'gio_an' => '18:00:00',
                'bua_an' => 'TOI',
                'so_luong' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id_muc_tieu_dinh_duong' => 1,
                'id_mon_an' => 23,
                'ngay_an' => '2026-10-16',
                'gio_an' => '18:00:00',
                'bua_an' => 'TOI',
                'so_luong' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],

            // Phụ tối
            [
                'id_muc_tieu_dinh_duong' => 1,
                'id_mon_an' => 26,
                'ngay_an' => '2026-10-16',
                'gio_an' => '20:30:00',
                'bua_an' => 'PHU_TOI',
                'so_luong' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id_muc_tieu_dinh_duong' => 1,
                'id_mon_an' => 29,
                'ngay_an' => '2026-10-16',
                'gio_an' => '20:30:00',
                'bua_an' => 'PHU_TOI',
                'so_luong' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],


            // ==================== KẾ HOẠCH 2 ====================
            // Chương trình 41: Phát triển cơ bắp toàn thân (nam)

            // Bữa sáng
            [
                'id_muc_tieu_dinh_duong' => 2,
                'id_mon_an' => 4,
                'ngay_an' => '2026-10-16',
                'gio_an' => '07:00:00',
                'bua_an' => 'SANG',
                'so_luong' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id_muc_tieu_dinh_duong' => 2,
                'id_mon_an' => 5,
                'ngay_an' => '2026-10-16',
                'gio_an' => '07:00:00',
                'bua_an' => 'SANG',
                'so_luong' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],

            // Phụ sáng
            [
                'id_muc_tieu_dinh_duong' => 2,
                'id_mon_an' => 6,
                'ngay_an' => '2026-10-16',
                'gio_an' => '09:30:00',
                'bua_an' => 'PHU_SANG',
                'so_luong' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id_muc_tieu_dinh_duong' => 2,
                'id_mon_an' => 8,
                'ngay_an' => '2026-10-16',
                'gio_an' => '09:30:00',
                'bua_an' => 'PHU_SANG',
                'so_luong' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],

            // Bữa trưa
            [
                'id_muc_tieu_dinh_duong' => 2,
                'id_mon_an' => 11,
                'ngay_an' => '2026-10-16',
                'gio_an' => '12:00:00',
                'bua_an' => 'TRUA',
                'so_luong' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id_muc_tieu_dinh_duong' => 2,
                'id_mon_an' => 12,
                'ngay_an' => '2026-10-16',
                'gio_an' => '12:00:00',
                'bua_an' => 'TRUA',
                'so_luong' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],

            // Phụ trưa
            [
                'id_muc_tieu_dinh_duong' => 2,
                'id_mon_an' => 17,
                'ngay_an' => '2026-10-16',
                'gio_an' => '15:00:00',
                'bua_an' => 'PHU_TRUA',
                'so_luong' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id_muc_tieu_dinh_duong' => 2,
                'id_mon_an' => 18,
                'ngay_an' => '2026-10-16',
                'gio_an' => '15:00:00',
                'bua_an' => 'PHU_TRUA',
                'so_luong' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],

            // Bữa tối
            [
                'id_muc_tieu_dinh_duong' => 2,
                'id_mon_an' => 21,
                'ngay_an' => '2026-10-16',
                'gio_an' => '18:00:00',
                'bua_an' => 'TOI',
                'so_luong' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id_muc_tieu_dinh_duong' => 2,
                'id_mon_an' => 24,
                'ngay_an' => '2026-10-16',
                'gio_an' => '18:00:00',
                'bua_an' => 'TOI',
                'so_luong' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],

            // Phụ tối
            [
                'id_muc_tieu_dinh_duong' => 2,
                'id_mon_an' => 27,
                'ngay_an' => '2026-10-16',
                'gio_an' => '20:30:00',
                'bua_an' => 'PHU_TOI',
                'so_luong' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id_muc_tieu_dinh_duong' => 2,
                'id_mon_an' => 30,
                'ngay_an' => '2026-10-16',
                'gio_an' => '20:30:00',
                'bua_an' => 'PHU_TOI',
                'so_luong' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],


            // ==================== KẾ HOẠCH 3 ====================
            // Chương trình 21: Tập luyện toàn thân nền tảng (nữ)

            // Bữa sáng
            [
                'id_muc_tieu_dinh_duong' => 3,
                'id_mon_an' => 2,
                'ngay_an' => '2026-10-16',
                'gio_an' => '07:00:00',
                'bua_an' => 'SANG',
                'so_luong' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id_muc_tieu_dinh_duong' => 3,
                'id_mon_an' => 3,
                'ngay_an' => '2026-10-16',
                'gio_an' => '07:00:00',
                'bua_an' => 'SANG',
                'so_luong' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],

            // Phụ sáng
            [
                'id_muc_tieu_dinh_duong' => 3,
                'id_mon_an' => 7,
                'ngay_an' => '2026-10-16',
                'gio_an' => '09:30:00',
                'bua_an' => 'PHU_SANG',
                'so_luong' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id_muc_tieu_dinh_duong' => 3,
                'id_mon_an' => 9,
                'ngay_an' => '2026-10-16',
                'gio_an' => '09:30:00',
                'bua_an' => 'PHU_SANG',
                'so_luong' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],

            // Bữa trưa
            [
                'id_muc_tieu_dinh_duong' => 3,
                'id_mon_an' => 11,
                'ngay_an' => '2026-10-16',
                'gio_an' => '12:00:00',
                'bua_an' => 'TRUA',
                'so_luong' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id_muc_tieu_dinh_duong' => 3,
                'id_mon_an' => 15,
                'ngay_an' => '2026-10-16',
                'gio_an' => '12:00:00',
                'bua_an' => 'TRUA',
                'so_luong' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],

            // Phụ trưa
            [
                'id_muc_tieu_dinh_duong' => 3,
                'id_mon_an' => 16,
                'ngay_an' => '2026-10-16',
                'gio_an' => '15:00:00',
                'bua_an' => 'PHU_TRUA',
                'so_luong' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id_muc_tieu_dinh_duong' => 3,
                'id_mon_an' => 20,
                'ngay_an' => '2026-10-16',
                'gio_an' => '15:00:00',
                'bua_an' => 'PHU_TRUA',
                'so_luong' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],

            // Bữa tối
            [
                'id_muc_tieu_dinh_duong' => 3,
                'id_mon_an' => 22,
                'ngay_an' => '2026-10-16',
                'gio_an' => '18:00:00',
                'bua_an' => 'TOI',
                'so_luong' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id_muc_tieu_dinh_duong' => 3,
                'id_mon_an' => 23,
                'ngay_an' => '2026-10-16',
                'gio_an' => '18:00:00',
                'bua_an' => 'TOI',
                'so_luong' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],

            // Phụ tối
            [
                'id_muc_tieu_dinh_duong' => 3,
                'id_mon_an' => 26,
                'ngay_an' => '2026-10-16',
                'gio_an' => '20:30:00',
                'bua_an' => 'PHU_TOI',
                'so_luong' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id_muc_tieu_dinh_duong' => 3,
                'id_mon_an' => 30,
                'ngay_an' => '2026-10-16',
                'gio_an' => '20:30:00',
                'bua_an' => 'PHU_TOI',
                'so_luong' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],


            // ==================== KẾ HOẠCH 4 ====================
            // Chương trình 46: Tăng cơ và định hình vóc dáng (nữ)

            // Bữa sáng
            [
                'id_muc_tieu_dinh_duong' => 4,
                'id_mon_an' => 1,
                'ngay_an' => '2026-10-16',
                'gio_an' => '07:00:00',
                'bua_an' => 'SANG',
                'so_luong' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id_muc_tieu_dinh_duong' => 4,
                'id_mon_an' => 5,
                'ngay_an' => '2026-10-16',
                'gio_an' => '07:00:00',
                'bua_an' => 'SANG',
                'so_luong' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],

            // Phụ sáng
            [
                'id_muc_tieu_dinh_duong' => 4,
                'id_mon_an' => 6,
                'ngay_an' => '2026-10-16',
                'gio_an' => '09:30:00',
                'bua_an' => 'PHU_SANG',
                'so_luong' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id_muc_tieu_dinh_duong' => 4,
                'id_mon_an' => 10,
                'ngay_an' => '2026-10-16',
                'gio_an' => '09:30:00',
                'bua_an' => 'PHU_SANG',
                'so_luong' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],

            // Bữa trưa
            [
                'id_muc_tieu_dinh_duong' => 4,
                'id_mon_an' => 12,
                'ngay_an' => '2026-10-16',
                'gio_an' => '12:00:00',
                'bua_an' => 'TRUA',
                'so_luong' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id_muc_tieu_dinh_duong' => 4,
                'id_mon_an' => 14,
                'ngay_an' => '2026-10-16',
                'gio_an' => '12:00:00',
                'bua_an' => 'TRUA',
                'so_luong' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],

            // Phụ trưa
            [
                'id_muc_tieu_dinh_duong' => 4,
                'id_mon_an' => 17,
                'ngay_an' => '2026-10-16',
                'gio_an' => '15:00:00',
                'bua_an' => 'PHU_TRUA',
                'so_luong' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id_muc_tieu_dinh_duong' => 4,
                'id_mon_an' => 19,
                'ngay_an' => '2026-10-16',
                'gio_an' => '15:00:00',
                'bua_an' => 'PHU_TRUA',
                'so_luong' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],

            // Bữa tối
            [
                'id_muc_tieu_dinh_duong' => 4,
                'id_mon_an' => 21,
                'ngay_an' => '2026-10-16',
                'gio_an' => '18:00:00',
                'bua_an' => 'TOI',
                'so_luong' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id_muc_tieu_dinh_duong' => 4,
                'id_mon_an' => 25,
                'ngay_an' => '2026-10-16',
                'gio_an' => '18:00:00',
                'bua_an' => 'TOI',
                'so_luong' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],

            // Phụ tối
            [
                'id_muc_tieu_dinh_duong' => 4,
                'id_mon_an' => 28,
                'ngay_an' => '2026-10-16',
                'gio_an' => '20:30:00',
                'bua_an' => 'PHU_TOI',
                'so_luong' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id_muc_tieu_dinh_duong' => 4,
                'id_mon_an' => 29,
                'ngay_an' => '2026-10-16',
                'gio_an' => '20:30:00',
                'bua_an' => 'PHU_TOI',
                'so_luong' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],

        ]);
    }
}
