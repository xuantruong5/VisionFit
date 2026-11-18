<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class MocPhanThuongChuoiTapSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('moc_phan_thuong_chuoi_tap')->truncate();
        DB::table('moc_phan_thuong_chuoi_tap')->insert([
            [
                'so_ngay' => 1,
                'ten_phan_thuong' => 'Huy hiệu test',
                'mo_ta' => 'Hoàn thành chuỗi tập luyện 1 ngày test.',
                'hinh_anh' => null,
                'trang_thai' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'so_ngay' => 3,
                'ten_phan_thuong' => 'Huy hiệu Khởi động',
                'mo_ta' => 'Hoàn thành chuỗi tập luyện 3 ngày.',
                'hinh_anh' => null,
                'trang_thai' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'so_ngay' => 7,
                'ten_phan_thuong' => 'Huy hiệu Kiên trì',
                'mo_ta' => 'Hoàn thành chuỗi tập luyện 7 ngày.',
                'hinh_anh' => null,
                'trang_thai' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'so_ngay' => 14,
                'ten_phan_thuong' => 'Huy hiệu Chăm chỉ',
                'mo_ta' => 'Hoàn thành chuỗi tập luyện 14 ngày.',
                'hinh_anh' => null,
                'trang_thai' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'so_ngay' => 21,
                'ten_phan_thuong' => 'Huy hiệu Bền bỉ',
                'mo_ta' => 'Hoàn thành chuỗi tập luyện 21 ngày.',
                'hinh_anh' => null,
                'trang_thai' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'so_ngay' => 30,
                'ten_phan_thuong' => 'Huy hiệu Kỷ luật',
                'mo_ta' => 'Hoàn thành chuỗi tập luyện 30 ngày.',
                'hinh_anh' => null,
                'trang_thai' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

    }
}
