<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DangKyGoiSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('chi_tiet_dang_ky_goi')->truncate();
        DB::table('dang_ky_goi')->truncate();

        $now = Carbon::now();

        // 1. Nguyễn Văn An - HLV Nguyễn Văn Hùng (Trainer 1)
        $id1 = DB::table('dang_ky_goi')->insertGetId([
            'id_hoi_vien' => 1,
            'id_gioi_thieu' => null,
            'ngay_dang_ky' => $now->toDateString(),
            'tinh_trang' => 1,
            'phuong_thuc_thanh_toan' => '1',
            'is_thanh_toan' => 1,
            'tong_tien' => 2499000,
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        DB::table('chi_tiet_dang_ky_goi')->insert([
            'id_dang_ky_goi' => $id1,
            'id_noi_tap' => 1,
            'id_goi_tap' => 4, // Gym VIP
            'id_chuong_trinh_tap' => 1,
            'id_trainer' => 1,
            'so_buoi' => 144,
            'so_buoi_pt' => 24,
            'don_gia' => 2499000,
            'thanh_tien' => 2499000,
            'ngay_bat_dau' => $now->toDateString(),
            'ngay_ket_thuc' => $now->copy()->addMonths(6)->toDateString(),
            'tinh_trang' => 1, // Đang tập
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        // 2. Trần Thị Mai - HLV Nguyễn Văn Hùng (Trainer 1)
        $id2 = DB::table('dang_ky_goi')->insertGetId([
            'id_hoi_vien' => 2,
            'id_gioi_thieu' => null,
            'ngay_dang_ky' => $now->copy()->subDays(10)->toDateString(),
            'tinh_trang' => 1,
            'phuong_thuc_thanh_toan' => '1',
            'is_thanh_toan' => 1,
            'tong_tien' => 1499000,
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        DB::table('chi_tiet_dang_ky_goi')->insert([
            'id_dang_ky_goi' => $id2,
            'id_noi_tap' => 1,
            'id_goi_tap' => 3, // Gym Nâng Cao
            'id_chuong_trinh_tap' => 1,
            'id_trainer' => 1,
            'so_buoi' => 72,
            'so_buoi_pt' => 12,
            'don_gia' => 1499000,
            'thanh_tien' => 1499000,
            'ngay_bat_dau' => $now->copy()->subDays(10)->toDateString(),
            'ngay_ket_thuc' => $now->copy()->addMonths(3)->toDateString(),
            'tinh_trang' => 1, // Đang tập
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        // 3. Lê Minh Khoa - HLV Nguyễn Văn Hùng (Trainer 1)
        $id3 = DB::table('dang_ky_goi')->insertGetId([
            'id_hoi_vien' => 3,
            'id_gioi_thieu' => null,
            'ngay_dang_ky' => $now->copy()->subDays(30)->toDateString(),
            'tinh_trang' => 1,
            'phuong_thuc_thanh_toan' => '1',
            'is_thanh_toan' => 1,
            'tong_tien' => 799000,
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        DB::table('chi_tiet_dang_ky_goi')->insert([
            'id_dang_ky_goi' => $id3,
            'id_noi_tap' => 1,
            'id_goi_tap' => 2, // Gym Tiêu Chuẩn
            'id_chuong_trinh_tap' => 1,
            'id_trainer' => 1,
            'so_buoi' => 36,
            'so_buoi_pt' => 4,
            'don_gia' => 799000,
            'thanh_tien' => 799000,
            'ngay_bat_dau' => $now->copy()->subDays(30)->toDateString(),
            'ngay_ket_thuc' => $now->copy()->addMonths(1)->toDateString(),
            'tinh_trang' => 3, // Tạm nghỉ
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        // 4. Phạm Gia Huy - HLV Trần Minh Tuấn (Trainer 2)
        $id4 = DB::table('dang_ky_goi')->insertGetId([
            'id_hoi_vien' => 4,
            'id_gioi_thieu' => null,
            'ngay_dang_ky' => $now->toDateString(),
            'tinh_trang' => 1,
            'phuong_thuc_thanh_toan' => '1',
            'is_thanh_toan' => 1,
            'tong_tien' => 2499000,
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        DB::table('chi_tiet_dang_ky_goi')->insert([
            'id_dang_ky_goi' => $id4,
            'id_noi_tap' => 1,
            'id_goi_tap' => 4,
            'id_chuong_trinh_tap' => 1,
            'id_trainer' => 2,
            'so_buoi' => 144,
            'so_buoi_pt' => 24,
            'don_gia' => 2499000,
            'thanh_tien' => 2499000,
            'ngay_bat_dau' => $now->toDateString(),
            'ngay_ket_thuc' => $now->copy()->addMonths(6)->toDateString(),
            'tinh_trang' => 1,
            'created_at' => $now,
            'updated_at' => $now,
        ]);
    }
}

