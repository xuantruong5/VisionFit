<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ChuongTrinhBaiTapChiTietSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('chuong_trinh_bai_tap_chi_tiet')->truncate();
        $now = now();
        DB::table('chuong_trinh_bai_tap_chi_tiet')->insert([

            // Buổi 1: Thân trên
            ['id_chuong_trinh_bai_tap' => 1, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT2310')->value('id'), 'thu_tu' => 1, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 1, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT0101')->value('id'), 'thu_tu' => 2, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 1, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT0102')->value('id'), 'thu_tu' => 3, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 1, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT0103')->value('id'), 'thu_tu' => 4, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 1, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT0104')->value('id'), 'thu_tu' => 5, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 1, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT0106')->value('id'), 'thu_tu' => 6, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 1, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT0107')->value('id'), 'thu_tu' => 7, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 1, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT2201')->value('id'), 'thu_tu' => 8, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 1, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT2202')->value('id'), 'thu_tu' => 9, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 1, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT2303')->value('id'), 'thu_tu' => 10, 'created_at' => $now, 'updated_at' => $now],

            // Buổi 2: Chân và mông
            ['id_chuong_trinh_bai_tap' => 2, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT2310')->value('id'), 'thu_tu' => 1, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 2, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT0201')->value('id'), 'thu_tu' => 2, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 2, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT0202')->value('id'), 'thu_tu' => 3, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 2, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT0203')->value('id'), 'thu_tu' => 4, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 2, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT0204')->value('id'), 'thu_tu' => 5, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 2, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT0205')->value('id'), 'thu_tu' => 6, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 2, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT0206')->value('id'), 'thu_tu' => 7, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 2, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT0207')->value('id'), 'thu_tu' => 8, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 2, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT0208')->value('id'), 'thu_tu' => 9, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 2, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT0209')->value('id'), 'thu_tu' => 10, 'created_at' => $now, 'updated_at' => $now],

            // Buổi 3: Toàn thân
            ['id_chuong_trinh_bai_tap' => 3, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT2310')->value('id'), 'thu_tu' => 1, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 3, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT0301')->value('id'), 'thu_tu' => 2, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 3, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT0302')->value('id'), 'thu_tu' => 3, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 3, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT0303')->value('id'), 'thu_tu' => 4, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 3, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT0304')->value('id'), 'thu_tu' => 5, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 3, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT0202')->value('id'), 'thu_tu' => 6, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 3, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT0208')->value('id'), 'thu_tu' => 7, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 3, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT0104')->value('id'), 'thu_tu' => 8, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 3, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT2401')->value('id'), 'thu_tu' => 9, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 3, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT0307')->value('id'), 'thu_tu' => 10, 'created_at' => $now, 'updated_at' => $now],

            // Buổi 4: Bụng và cơ lõi
            ['id_chuong_trinh_bai_tap' => 4, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT2310')->value('id'), 'thu_tu' => 1, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 4, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT2401')->value('id'), 'thu_tu' => 2, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 4, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT2402')->value('id'), 'thu_tu' => 3, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 4, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT2403')->value('id'), 'thu_tu' => 4, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 4, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT2404')->value('id'), 'thu_tu' => 5, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 4, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT2405')->value('id'), 'thu_tu' => 6, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 4, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT2407')->value('id'), 'thu_tu' => 7, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 4, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT2408')->value('id'), 'thu_tu' => 8, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 4, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT2409')->value('id'), 'thu_tu' => 9, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 4, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT2410')->value('id'), 'thu_tu' => 10, 'created_at' => $now, 'updated_at' => $now],

            // Buổi 5: Cardio và sức bền
            ['id_chuong_trinh_bai_tap' => 5, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT2310')->value('id'), 'thu_tu' => 1, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 5, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT0301')->value('id'), 'thu_tu' => 2, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 5, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT0305')->value('id'), 'thu_tu' => 3, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 5, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT0307')->value('id'), 'thu_tu' => 4, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 5, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT0310')->value('id'), 'thu_tu' => 5, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 5, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT0203')->value('id'), 'thu_tu' => 6, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 5, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT0208')->value('id'), 'thu_tu' => 7, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 5, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT2407')->value('id'), 'thu_tu' => 8, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 5, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT2408')->value('id'), 'thu_tu' => 9, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 5, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT0302')->value('id'), 'thu_tu' => 10, 'created_at' => $now, 'updated_at' => $now],

            // Buổi 22: Thân trên và ngực
            ['id_chuong_trinh_bai_tap' => 22, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT2310')->value('id'), 'thu_tu' => 1, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 22, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT0101')->value('id'), 'thu_tu' => 2, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 22, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT0102')->value('id'), 'thu_tu' => 3, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 22, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT0103')->value('id'), 'thu_tu' => 4, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 22, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT0104')->value('id'), 'thu_tu' => 5, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 22, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT0105')->value('id'), 'thu_tu' => 6, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 22, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT0106')->value('id'), 'thu_tu' => 7, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 22, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT0107')->value('id'), 'thu_tu' => 8, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 22, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT0108')->value('id'), 'thu_tu' => 9, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 22, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT0109')->value('id'), 'thu_tu' => 10, 'created_at' => $now, 'updated_at' => $now],

            // Buổi 23: Chân và mông
            ['id_chuong_trinh_bai_tap' => 23, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT2310')->value('id'), 'thu_tu' => 1, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 23, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT0201')->value('id'), 'thu_tu' => 2, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 23, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT0202')->value('id'), 'thu_tu' => 3, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 23, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT0203')->value('id'), 'thu_tu' => 4, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 23, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT0204')->value('id'), 'thu_tu' => 5, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 23, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT0205')->value('id'), 'thu_tu' => 6, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 23, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT0206')->value('id'), 'thu_tu' => 7, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 23, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT0207')->value('id'), 'thu_tu' => 8, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 23, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT0208')->value('id'), 'thu_tu' => 9, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 23, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT0209')->value('id'), 'thu_tu' => 10, 'created_at' => $now, 'updated_at' => $now],

            // Buổi 24: Bụng và cơ lõi
            ['id_chuong_trinh_bai_tap' => 24, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT2310')->value('id'), 'thu_tu' => 1, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 24, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT2401')->value('id'), 'thu_tu' => 2, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 24, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT2402')->value('id'), 'thu_tu' => 3, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 24, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT2403')->value('id'), 'thu_tu' => 4, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 24, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT2404')->value('id'), 'thu_tu' => 5, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 24, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT2405')->value('id'), 'thu_tu' => 6, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 24, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT2406')->value('id'), 'thu_tu' => 7, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 24, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT2407')->value('id'), 'thu_tu' => 8, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 24, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT2408')->value('id'), 'thu_tu' => 9, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 24, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT2409')->value('id'), 'thu_tu' => 10, 'created_at' => $now, 'updated_at' => $now],

            // Buổi 25: Lưng và vai
            ['id_chuong_trinh_bai_tap' => 25, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT2310')->value('id'), 'thu_tu' => 1, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 25, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT2201')->value('id'), 'thu_tu' => 2, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 25, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT2202')->value('id'), 'thu_tu' => 3, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 25, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT2203')->value('id'), 'thu_tu' => 4, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 25, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT2204')->value('id'), 'thu_tu' => 5, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 25, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT2205')->value('id'), 'thu_tu' => 6, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 25, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT2206')->value('id'), 'thu_tu' => 7, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 25, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT2303')->value('id'), 'thu_tu' => 8, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 25, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT2305')->value('id'), 'thu_tu' => 9, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 25, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT2306')->value('id'), 'thu_tu' => 10, 'created_at' => $now, 'updated_at' => $now],

            // Buổi 26: Cardio và sức bền
            ['id_chuong_trinh_bai_tap' => 26, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT2310')->value('id'), 'thu_tu' => 1, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 26, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT0301')->value('id'), 'thu_tu' => 2, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 26, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT0305')->value('id'), 'thu_tu' => 3, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 26, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT0307')->value('id'), 'thu_tu' => 4, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 26, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT0310')->value('id'), 'thu_tu' => 5, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 26, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT0203')->value('id'), 'thu_tu' => 6, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 26, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT0208')->value('id'), 'thu_tu' => 7, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 26, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT2407')->value('id'), 'thu_tu' => 8, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 26, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT2408')->value('id'), 'thu_tu' => 9, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 26, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT0302')->value('id'), 'thu_tu' => 10, 'created_at' => $now, 'updated_at' => $now],

            // Buổi 52: Ngực và tay sau
            ['id_chuong_trinh_bai_tap' => 52, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT2310')->value('id'), 'thu_tu' => 1, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 52, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT0101')->value('id'), 'thu_tu' => 2, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 52, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT0102')->value('id'), 'thu_tu' => 3, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 52, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT0103')->value('id'), 'thu_tu' => 4, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 52, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT0104')->value('id'), 'thu_tu' => 5, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 52, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT0105')->value('id'), 'thu_tu' => 6, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 52, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT0106')->value('id'), 'thu_tu' => 7, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 52, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT0107')->value('id'), 'thu_tu' => 8, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 52, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT0108')->value('id'), 'thu_tu' => 9, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 52, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT0109')->value('id'), 'thu_tu' => 10, 'created_at' => $now, 'updated_at' => $now],

            // Buổi 53: Lưng và tay trước
            ['id_chuong_trinh_bai_tap' => 53, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT2310')->value('id'), 'thu_tu' => 1, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 53, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT2201')->value('id'), 'thu_tu' => 2, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 53, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT2202')->value('id'), 'thu_tu' => 3, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 53, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT2203')->value('id'), 'thu_tu' => 4, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 53, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT2204')->value('id'), 'thu_tu' => 5, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 53, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT2205')->value('id'), 'thu_tu' => 6, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 53, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT2206')->value('id'), 'thu_tu' => 7, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 53, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT2207')->value('id'), 'thu_tu' => 8, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 53, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT2208')->value('id'), 'thu_tu' => 9, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 53, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT2209')->value('id'), 'thu_tu' => 10, 'created_at' => $now, 'updated_at' => $now],

            // Buổi 54: Chân và mông
            ['id_chuong_trinh_bai_tap' => 54, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT2310')->value('id'), 'thu_tu' => 1, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 54, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT0201')->value('id'), 'thu_tu' => 2, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 54, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT0202')->value('id'), 'thu_tu' => 3, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 54, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT0203')->value('id'), 'thu_tu' => 4, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 54, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT0204')->value('id'), 'thu_tu' => 5, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 54, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT0205')->value('id'), 'thu_tu' => 6, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 54, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT0206')->value('id'), 'thu_tu' => 7, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 54, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT0207')->value('id'), 'thu_tu' => 8, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 54, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT0208')->value('id'), 'thu_tu' => 9, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 54, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT0209')->value('id'), 'thu_tu' => 10, 'created_at' => $now, 'updated_at' => $now],

            // Buổi 55: Vai và cơ bụng
            ['id_chuong_trinh_bai_tap' => 55, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT2310')->value('id'), 'thu_tu' => 1, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 55, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT2301')->value('id'), 'thu_tu' => 2, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 55, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT2303')->value('id'), 'thu_tu' => 3, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 55, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT2304')->value('id'), 'thu_tu' => 4, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 55, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT2305')->value('id'), 'thu_tu' => 5, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 55, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT2306')->value('id'), 'thu_tu' => 6, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 55, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT2307')->value('id'), 'thu_tu' => 7, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 55, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT2308')->value('id'), 'thu_tu' => 8, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 55, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT2309')->value('id'), 'thu_tu' => 9, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 55, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT2401')->value('id'), 'thu_tu' => 10, 'created_at' => $now, 'updated_at' => $now],

            // Buổi 56: Cardio và phục hồi chủ động
            ['id_chuong_trinh_bai_tap' => 56, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT2310')->value('id'), 'thu_tu' => 1, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 56, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT0301')->value('id'), 'thu_tu' => 2, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 56, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT0302')->value('id'), 'thu_tu' => 3, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 56, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT0305')->value('id'), 'thu_tu' => 4, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 56, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT0307')->value('id'), 'thu_tu' => 5, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 56, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT0308')->value('id'), 'thu_tu' => 6, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 56, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT0310')->value('id'), 'thu_tu' => 7, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 56, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT2407')->value('id'), 'thu_tu' => 8, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 56, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT2408')->value('id'), 'thu_tu' => 9, 'created_at' => $now, 'updated_at' => $now],
            ['id_chuong_trinh_bai_tap' => 56, 'id_bai_tap' => DB::table('bai_tap')->where('ma_bai_tap', 'BT0203')->value('id'), 'thu_tu' => 10, 'created_at' => $now, 'updated_at' => $now],

        ]);
    }
}
