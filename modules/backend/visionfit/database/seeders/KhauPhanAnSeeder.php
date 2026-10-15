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

            // ==========================================
            // KẾ HOẠCH 1 - TĂNG CƠ
            // ==========================================

            // Ngày 01
            [
                'id_ke_hoach_an' => 1,
                'id_mon_an' => 5,
                'ngay_an' => '2026-09-01',
                'gio_an' => '07:00:00',
                'bua_an' => 'SANG',
                'so_luong' => 1,
                'ghi_chu' => 'Bữa sáng giàu năng lượng',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id_ke_hoach_an' => 1,
                'id_mon_an' => 4,
                'ngay_an' => '2026-09-01',
                'gio_an' => '09:30:00',
                'bua_an' => 'PHU_SANG',
                'so_luong' => 1,
                'ghi_chu' => 'Bữa phụ',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id_ke_hoach_an' => 1,
                'id_mon_an' => 2,
                'ngay_an' => '2026-09-01',
                'gio_an' => '12:00:00',
                'bua_an' => 'TRUA',
                'so_luong' => 1,
                'ghi_chu' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id_ke_hoach_an' => 1,
                'id_mon_an' => 8,
                'ngay_an' => '2026-09-01',
                'gio_an' => '15:30:00',
                'bua_an' => 'PHU_TRUA',
                'so_luong' => 1,
                'ghi_chu' => 'Ăn trước buổi tập',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id_ke_hoach_an' => 1,
                'id_mon_an' => 1,
                'ngay_an' => '2026-09-01',
                'gio_an' => '18:30:00',
                'bua_an' => 'TOI',
                'so_luong' => 1,
                'ghi_chu' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ],

            // Ngày 02
            [
                'id_ke_hoach_an' => 1,
                'id_mon_an' => 4,
                'ngay_an' => '2026-09-02',
                'gio_an' => '07:00:00',
                'bua_an' => 'SANG',
                'so_luong' => 1,
                'ghi_chu' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id_ke_hoach_an' => 1,
                'id_mon_an' => 8,
                'ngay_an' => '2026-09-02',
                'gio_an' => '09:30:00',
                'bua_an' => 'PHU_SANG',
                'so_luong' => 1,
                'ghi_chu' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id_ke_hoach_an' => 1,
                'id_mon_an' => 6,
                'ngay_an' => '2026-09-02',
                'gio_an' => '12:00:00',
                'bua_an' => 'TRUA',
                'so_luong' => 1,
                'ghi_chu' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id_ke_hoach_an' => 1,
                'id_mon_an' => 3,
                'ngay_an' => '2026-09-02',
                'gio_an' => '15:30:00',
                'bua_an' => 'PHU_TRUA',
                'so_luong' => 1,
                'ghi_chu' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id_ke_hoach_an' => 1,
                'id_mon_an' => 7,
                'ngay_an' => '2026-09-02',
                'gio_an' => '18:30:00',
                'bua_an' => 'TOI',
                'so_luong' => 1,
                'ghi_chu' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ],

            // ==========================================
            // KẾ HOẠCH 2 - GIẢM CÂN
            // ==========================================

            // Ngày 01
            [
                'id_ke_hoach_an' => 2,
                'id_mon_an' => 5,
                'ngay_an' => '2026-09-01',
                'gio_an' => '07:00:00',
                'bua_an' => 'SANG',
                'so_luong' => 1,
                'ghi_chu' => 'Hạn chế mật ong',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id_ke_hoach_an' => 2,
                'id_mon_an' => 3,
                'ngay_an' => '2026-09-01',
                'gio_an' => '09:30:00',
                'bua_an' => 'PHU_SANG',
                'so_luong' => 1,
                'ghi_chu' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id_ke_hoach_an' => 2,
                'id_mon_an' => 2,
                'ngay_an' => '2026-09-01',
                'gio_an' => '12:00:00',
                'bua_an' => 'TRUA',
                'so_luong' => 0.8,
                'ghi_chu' => 'Giảm lượng cơm',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id_ke_hoach_an' => 2,
                'id_mon_an' => 8,
                'ngay_an' => '2026-09-01',
                'gio_an' => '15:30:00',
                'bua_an' => 'PHU_TRUA',
                'so_luong' => 1,
                'ghi_chu' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id_ke_hoach_an' => 2,
                'id_mon_an' => 1,
                'ngay_an' => '2026-09-01',
                'gio_an' => '18:30:00',
                'bua_an' => 'TOI',
                'so_luong' => 0.8,
                'ghi_chu' => 'Giảm khẩu phần',
                'created_at' => now(),
                'updated_at' => now(),
            ],

            // ==========================================
            // KẾ HOẠCH 3 - DUY TRÌ
            // ==========================================

            // Ngày 01
            [
                'id_ke_hoach_an' => 3,
                'id_mon_an' => 4,
                'ngay_an' => '2026-09-01',
                'gio_an' => '07:00:00',
                'bua_an' => 'SANG',
                'so_luong' => 1,
                'ghi_chu' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id_ke_hoach_an' => 3,
                'id_mon_an' => 8,
                'ngay_an' => '2026-09-01',
                'gio_an' => '09:30:00',
                'bua_an' => 'PHU_SANG',
                'so_luong' => 1,
                'ghi_chu' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id_ke_hoach_an' => 3,
                'id_mon_an' => 6,
                'ngay_an' => '2026-09-01',
                'gio_an' => '12:00:00',
                'bua_an' => 'TRUA',
                'so_luong' => 1,
                'ghi_chu' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id_ke_hoach_an' => 3,
                'id_mon_an' => 8,
                'ngay_an' => '2026-09-01',
                'gio_an' => '15:30:00',
                'bua_an' => 'PHU_TRUA',
                'so_luong' => 1,
                'ghi_chu' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id_ke_hoach_an' => 3,
                'id_mon_an' => 7,
                'ngay_an' => '2026-09-01',
                'gio_an' => '18:30:00',
                'bua_an' => 'TOI',
                'so_luong' => 1,
                'ghi_chu' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
