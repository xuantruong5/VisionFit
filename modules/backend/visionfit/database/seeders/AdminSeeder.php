<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('admins')->truncate();

        DB::table('admins')->insert([
            [
                'ho_ten' => 'Nguyễn Văn Admin',
                'email' => 'admin@gmail.com',
                'password' => Hash::make('123456'),
                'so_dien_thoai' => '0901234567',
                'hinh_anh' => 'admin1.jpg',
                'tinh_trang' => 1,
                'id_chuc_vu' => 1,
                'is_master' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],

            [
                'ho_ten' => 'Trần Minh Quân',
                'email' => 'admin2@gmail.com',
                'password' => Hash::make('123456'),
                'so_dien_thoai' => '0912345678',
                'hinh_anh' => 'admin2.jpg',
                'tinh_trang' => 1,
                'id_chuc_vu' => 2,
                'is_master' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],

            [
                'ho_ten' => 'Lê Hoàng Nam',
                'email' => 'admin3@gmail.com',
                'password' => Hash::make('123456'),
                'so_dien_thoai' => '0987654321',
                'hinh_anh' => null,
                'tinh_trang' => 1,
                'id_chuc_vu' => 2,
                'is_master' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],

            [
                'ho_ten' => 'Phạm Thị Hương',
                'email' => 'admin4@gmail.com',
                'password' => Hash::make('123456'),
                'so_dien_thoai' => '0977123456',
                'hinh_anh' => null,
                'tinh_trang' => 0,
                'id_chuc_vu' => 2,
                'is_master' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
