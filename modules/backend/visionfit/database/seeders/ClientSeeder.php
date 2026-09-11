<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ClientSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('clients')->truncate();

        DB::table('clients')->insert([
            [
                'id_phong_tap' => 1,
                'email' => 'client1@gmail.com',
                'password' => bcrypt('123456'),
                'ho_ten' => 'Nguyễn Văn An',
                'so_dien_thoai' => '0901234567',
                'anh_dai_dien' => null,
                'ngay_sinh' => '2000-05-15',
                'gioi_tinh' => 0,
                'chieu_cao_cm' => 175.00,
                'can_nang_kg' => 70.00,
                'dang_nguoi' => 'body_1.png',
                'muc_tieu_hien_tai' => 'Tăng cơ',
                'cap_do_hien_tai' => 'Trung bình',
                'noi_tap_uu_tien' => 'Phòng tập',
                'trang_thai_ho_so' => 'hoan_thanh',
                'tinh_trang' => 'binh_thuong',
                'hash_reset' => null,
                'hash_active' => null,
                'is_active' => 1,
                'is_block' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],

            [
                'id_phong_tap' => 1,
                'email' => 'client2@gmail.com',
                'password' => bcrypt('123456'),
                'ho_ten' => 'Trần Thị Mai',
                'so_dien_thoai' => '0912345678',
                'anh_dai_dien' => null,
                'ngay_sinh' => '2002-08-20',
                'gioi_tinh' => 1,
                'chieu_cao_cm' => 160.00,
                'can_nang_kg' => 52.00,
                'dang_nguoi' => 'body_2.png',
                'muc_tieu_hien_tai' => 'Giảm cân',
                'cap_do_hien_tai' => 'Mới bắt đầu',
                'noi_tap_uu_tien' => 'Phòng tập',
                'trang_thai_ho_so' => 'hoan_thanh',
                'tinh_trang' => 'binh_thuong',
                'hash_reset' => null,
                'hash_active' => null,
                'is_active' => 1,
                'is_block' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],

            [
                'id_phong_tap' => 1,
                'email' => 'client3@gmail.com',
                'password' => bcrypt('123456'),
                'ho_ten' => 'Lê Minh Khoa',
                'so_dien_thoai' => '0987654321',
                'anh_dai_dien' => null,
                'ngay_sinh' => '1998-12-10',
                'gioi_tinh' => 0,
                'chieu_cao_cm' => 180.00,
                'can_nang_kg' => 82.50,
                'dang_nguoi' => 'body_3.png',
                'muc_tieu_hien_tai' => 'Tăng cơ',
                'cap_do_hien_tai' => 'Nâng cao',
                'noi_tap_uu_tien' => 'Phòng tập',
                'trang_thai_ho_so' => 'hoan_thanh',
                'tinh_trang' => 'binh_thuong',
                'hash_reset' => null,
                'hash_active' => null,
                'is_active' => 1,
                'is_block' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],

            [
                'id_phong_tap' => 1,
                'email' => 'client4@gmail.com',
                'password' => bcrypt('123456'),
                'ho_ten' => 'Phạm Gia Huy',
                'so_dien_thoai' => '0977123456',
                'anh_dai_dien' => null,
                'ngay_sinh' => '2001-03-25',
                'gioi_tinh' => 0,
                'chieu_cao_cm' => 170.00,
                'can_nang_kg' => 68.00,
                'dang_nguoi' => 'body_1.png',
                'muc_tieu_hien_tai' => 'Tăng sức bền',
                'cap_do_hien_tai' => 'Trung bình',
                'noi_tap_uu_tien' => 'Tại nhà',
                'trang_thai_ho_so' => 'chua_hoan_thanh',
                'tinh_trang' => 'binh_thuong',
                'hash_reset' => null,
                'hash_active' => null,
                'is_active' => 0,
                'is_block' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],

            [
                'id_phong_tap' => 1,
                'email' => 'client5@gmail.com',
                'password' => bcrypt('123456'),
                'ho_ten' => 'Nguyễn Thảo Vy',
                'so_dien_thoai' => '0933123456',
                'anh_dai_dien' => null,
                'ngay_sinh' => '2003-11-05',
                'gioi_tinh' => 1,
                'chieu_cao_cm' => 158.00,
                'can_nang_kg' => 50.00,
                'dang_nguoi' => 'body_2.png',
                'muc_tieu_hien_tai' => 'Giảm cân',
                'cap_do_hien_tai' => 'Mới bắt đầu',
                'noi_tap_uu_tien' => 'Tại nhà',
                'trang_thai_ho_so' => 'hoan_thanh',
                'tinh_trang' => 'bi_khoa',
                'hash_reset' => null,
                'hash_active' => null,
                'is_active' => 1,
                'is_block' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
