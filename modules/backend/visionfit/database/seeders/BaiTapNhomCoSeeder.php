<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
class BaiTapNhomCoSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('bai_tap_nhom_co')->truncate();

        DB::table('bai_tap_nhom_co')->insert([

            // =====================================================
            // CHƯƠNG TRÌNH 1: NGỰC VÀ TAY SAU
            // =====================================================

            // BT0101 - Đẩy ngực nằm ngang
            ['id_bai_tap' => 1, 'ten_nhom_co' => 'Ngực', 'ty_le_tac_dong' => 70, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 1, 'ten_nhom_co' => 'Tay sau', 'ty_le_tac_dong' => 20, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 1, 'ten_nhom_co' => 'Vai trước', 'ty_le_tac_dong' => 10, 'created_at' => now(), 'updated_at' => now()],

            // BT0102 - Đẩy ngực với tạ đơn trên sàn
            ['id_bai_tap' => 2, 'ten_nhom_co' => 'Ngực', 'ty_le_tac_dong' => 70, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 2, 'ten_nhom_co' => 'Tay sau', 'ty_le_tac_dong' => 20, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 2, 'ten_nhom_co' => 'Vai trước', 'ty_le_tac_dong' => 10, 'created_at' => now(), 'updated_at' => now()],

            // BT0103 - Ép ngực với dây kháng lực từ dưới
            ['id_bai_tap' => 3, 'ten_nhom_co' => 'Ngực', 'ty_le_tac_dong' => 80, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 3, 'ten_nhom_co' => 'Vai trước', 'ty_le_tac_dong' => 20, 'created_at' => now(), 'updated_at' => now()],

            // BT0104 - Chống đẩy
            ['id_bai_tap' => 4, 'ten_nhom_co' => 'Ngực', 'ty_le_tac_dong' => 60, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 4, 'ten_nhom_co' => 'Tay sau', 'ty_le_tac_dong' => 25, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 4, 'ten_nhom_co' => 'Vai trước', 'ty_le_tac_dong' => 15, 'created_at' => now(), 'updated_at' => now()],

            // BT0105 - Đẩy ngực với tạ đơn khi nằm sàn
            ['id_bai_tap' => 5, 'ten_nhom_co' => 'Ngực', 'ty_le_tac_dong' => 70, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 5, 'ten_nhom_co' => 'Tay sau', 'ty_le_tac_dong' => 20, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 5, 'ten_nhom_co' => 'Vai trước', 'ty_le_tac_dong' => 10, 'created_at' => now(), 'updated_at' => now()],

            // BT0106 - Đẩy ngực trong với máy
            ['id_bai_tap' => 6, 'ten_nhom_co' => 'Ngực', 'ty_le_tac_dong' => 75, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 6, 'ten_nhom_co' => 'Tay sau', 'ty_le_tac_dong' => 15, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 6, 'ten_nhom_co' => 'Vai trước', 'ty_le_tac_dong' => 10, 'created_at' => now(), 'updated_at' => now()],

            // BT0107 - Ép ngực với máy Pec Deck
            ['id_bai_tap' => 7, 'ten_nhom_co' => 'Ngực', 'ty_le_tac_dong' => 85, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 7, 'ten_nhom_co' => 'Vai trước', 'ty_le_tac_dong' => 15, 'created_at' => now(), 'updated_at' => now()],

            // BT0108 - Đẩy ngực dưới với máy
            ['id_bai_tap' => 8, 'ten_nhom_co' => 'Ngực', 'ty_le_tac_dong' => 70, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 8, 'ten_nhom_co' => 'Tay sau', 'ty_le_tac_dong' => 20, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 8, 'ten_nhom_co' => 'Vai trước', 'ty_le_tac_dong' => 10, 'created_at' => now(), 'updated_at' => now()],

            // BT0109 - Kéo cáp xuống tập tay sau
            ['id_bai_tap' => 9, 'ten_nhom_co' => 'Tay sau', 'ty_le_tac_dong' => 90, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 9, 'ten_nhom_co' => 'Cẳng tay', 'ty_le_tac_dong' => 10, 'created_at' => now(), 'updated_at' => now()],

            // BT0110 - Duỗi tay sau với tạ đơn
            ['id_bai_tap' => 10, 'ten_nhom_co' => 'Tay sau', 'ty_le_tac_dong' => 90, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 10, 'ten_nhom_co' => 'Vai sau', 'ty_le_tac_dong' => 10, 'created_at' => now(), 'updated_at' => now()],

            // =====================================================
            // CHƯƠNG TRÌNH 2: CHÂN VÀ MÔNG
            // =====================================================

            // BT0201 - Squat với máy Hack Squat
            ['id_bai_tap' => 11, 'ten_nhom_co' => 'Đùi trước', 'ty_le_tac_dong' => 60, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 11, 'ten_nhom_co' => 'Mông', 'ty_le_tac_dong' => 30, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 11, 'ten_nhom_co' => 'Đùi sau', 'ty_le_tac_dong' => 10, 'created_at' => now(), 'updated_at' => now()],

            // BT0202 - Squat với tạ đơn
            ['id_bai_tap' => 12, 'ten_nhom_co' => 'Đùi trước', 'ty_le_tac_dong' => 50, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 12, 'ten_nhom_co' => 'Mông', 'ty_le_tac_dong' => 30, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 12, 'ten_nhom_co' => 'Đùi sau', 'ty_le_tac_dong' => 10, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 12, 'ten_nhom_co' => 'Cơ trung tâm', 'ty_le_tac_dong' => 10, 'created_at' => now(), 'updated_at' => now()],

            // BT0203 - Lunge bước tới
            ['id_bai_tap' => 13, 'ten_nhom_co' => 'Đùi trước', 'ty_le_tac_dong' => 45, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 13, 'ten_nhom_co' => 'Mông', 'ty_le_tac_dong' => 35, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 13, 'ten_nhom_co' => 'Đùi sau', 'ty_le_tac_dong' => 10, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 13, 'ten_nhom_co' => 'Bắp chân', 'ty_le_tac_dong' => 10, 'created_at' => now(), 'updated_at' => now()],

            // BT0204 - Đạp chân với máy Leg Press
            ['id_bai_tap' => 14, 'ten_nhom_co' => 'Đùi trước', 'ty_le_tac_dong' => 55, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 14, 'ten_nhom_co' => 'Mông', 'ty_le_tac_dong' => 30, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 14, 'ten_nhom_co' => 'Đùi sau', 'ty_le_tac_dong' => 15, 'created_at' => now(), 'updated_at' => now()],

            // BT0205 - Duỗi chân với máy
            ['id_bai_tap' => 15, 'ten_nhom_co' => 'Đùi trước', 'ty_le_tac_dong' => 90, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 15, 'ten_nhom_co' => 'Cơ trung tâm', 'ty_le_tac_dong' => 10, 'created_at' => now(), 'updated_at' => now()],

            // BT0206 - Gập chân với máy
            ['id_bai_tap' => 16, 'ten_nhom_co' => 'Đùi sau', 'ty_le_tac_dong' => 85, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 16, 'ten_nhom_co' => 'Bắp chân', 'ty_le_tac_dong' => 15, 'created_at' => now(), 'updated_at' => now()],

            // BT0207 - Dang hông với máy
            ['id_bai_tap' => 17, 'ten_nhom_co' => 'Mông', 'ty_le_tac_dong' => 85, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 17, 'ten_nhom_co' => 'Đùi sau', 'ty_le_tac_dong' => 15, 'created_at' => now(), 'updated_at' => now()],

            // BT0208 - Nâng hông Glute Bridge
            ['id_bai_tap' => 18, 'ten_nhom_co' => 'Mông', 'ty_le_tac_dong' => 70, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 18, 'ten_nhom_co' => 'Đùi sau', 'ty_le_tac_dong' => 20, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 18, 'ten_nhom_co' => 'Cơ trung tâm', 'ty_le_tac_dong' => 10, 'created_at' => now(), 'updated_at' => now()],

            // BT0209 - Nhón bắp chân khi đứng với máy
            ['id_bai_tap' => 19, 'ten_nhom_co' => 'Bắp chân', 'ty_le_tac_dong' => 90, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 19, 'ten_nhom_co' => 'Cơ trung tâm', 'ty_le_tac_dong' => 10, 'created_at' => now(), 'updated_at' => now()],

            // BT0210 - Nhón bắp chân khi ngồi
            ['id_bai_tap' => 20, 'ten_nhom_co' => 'Bắp chân', 'ty_le_tac_dong' => 90, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 20, 'ten_nhom_co' => 'Cơ trung tâm', 'ty_le_tac_dong' => 10, 'created_at' => now(), 'updated_at' => now()],

            // =====================================================
            // CHƯƠNG TRÌNH 3: TOÀN THÂN VÀ VẬN ĐỘNG
            // =====================================================

            // BT0301 - Jumping Jack
            ['id_bai_tap' => 21, 'ten_nhom_co' => 'Toàn thân', 'ty_le_tac_dong' => 40, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 21, 'ten_nhom_co' => 'Đùi trước', 'ty_le_tac_dong' => 25, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 21, 'ten_nhom_co' => 'Vai', 'ty_le_tac_dong' => 20, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 21, 'ten_nhom_co' => 'Bắp chân', 'ty_le_tac_dong' => 15, 'created_at' => now(), 'updated_at' => now()],

            // BT0302 - Squat với trọng lượng cơ thể
            ['id_bai_tap' => 22, 'ten_nhom_co' => 'Đùi trước', 'ty_le_tac_dong' => 50, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 22, 'ten_nhom_co' => 'Mông', 'ty_le_tac_dong' => 30, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 22, 'ten_nhom_co' => 'Đùi sau', 'ty_le_tac_dong' => 10, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 22, 'ten_nhom_co' => 'Cơ trung tâm', 'ty_le_tac_dong' => 10, 'created_at' => now(), 'updated_at' => now()],

            // BT0303 - Chống đẩy dốc xuống
            ['id_bai_tap' => 23, 'ten_nhom_co' => 'Ngực', 'ty_le_tac_dong' => 60, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 23, 'ten_nhom_co' => 'Tay sau', 'ty_le_tac_dong' => 25, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 23, 'ten_nhom_co' => 'Vai trước', 'ty_le_tac_dong' => 15, 'created_at' => now(), 'updated_at' => now()],

            // BT0304 - Chống đẩy xà kép có hỗ trợ
            ['id_bai_tap' => 24, 'ten_nhom_co' => 'Tay sau', 'ty_le_tac_dong' => 60, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 24, 'ten_nhom_co' => 'Ngực', 'ty_le_tac_dong' => 25, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 24, 'ten_nhom_co' => 'Vai trước', 'ty_le_tac_dong' => 15, 'created_at' => now(), 'updated_at' => now()],

            // BT0305 - Mountain Climber Jump
            ['id_bai_tap' => 25, 'ten_nhom_co' => 'Cơ trung tâm', 'ty_le_tac_dong' => 40, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 25, 'ten_nhom_co' => 'Đùi trước', 'ty_le_tac_dong' => 25, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 25, 'ten_nhom_co' => 'Vai', 'ty_le_tac_dong' => 20, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 25, 'ten_nhom_co' => 'Mông', 'ty_le_tac_dong' => 15, 'created_at' => now(), 'updated_at' => now()],

            // BT0306 - Gập thân sang bên với cáp
            ['id_bai_tap' => 26, 'ten_nhom_co' => 'Cơ liên sườn', 'ty_le_tac_dong' => 70, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 26, 'ten_nhom_co' => 'Bụng', 'ty_le_tac_dong' => 20, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 26, 'ten_nhom_co' => 'Cơ trung tâm', 'ty_le_tac_dong' => 10, 'created_at' => now(), 'updated_at' => now()],

            // BT0307 - Nâng cao gối tại chỗ
            ['id_bai_tap' => 27, 'ten_nhom_co' => 'Đùi trước', 'ty_le_tac_dong' => 35, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 27, 'ten_nhom_co' => 'Bụng', 'ty_le_tac_dong' => 25, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 27, 'ten_nhom_co' => 'Mông', 'ty_le_tac_dong' => 20, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 27, 'ten_nhom_co' => 'Bắp chân', 'ty_le_tac_dong' => 10, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 27, 'ten_nhom_co' => 'Vai', 'ty_le_tac_dong' => 10, 'created_at' => now(), 'updated_at' => now()],

            // BT0308 - Lunge luân phiên
            ['id_bai_tap' => 28, 'ten_nhom_co' => 'Đùi trước', 'ty_le_tac_dong' => 45, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 28, 'ten_nhom_co' => 'Mông', 'ty_le_tac_dong' => 35, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 28, 'ten_nhom_co' => 'Đùi sau', 'ty_le_tac_dong' => 10, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 28, 'ten_nhom_co' => 'Cơ trung tâm', 'ty_le_tac_dong' => 10, 'created_at' => now(), 'updated_at' => now()],

            // BT0309 - Gập bụng với máy
            ['id_bai_tap' => 29, 'ten_nhom_co' => 'Bụng', 'ty_le_tac_dong' => 85, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 29, 'ten_nhom_co' => 'Cơ liên sườn', 'ty_le_tac_dong' => 15, 'created_at' => now(), 'updated_at' => now()],

            // BT0310 - Chạy nâng cao gối
            ['id_bai_tap' => 30, 'ten_nhom_co' => 'Đùi trước', 'ty_le_tac_dong' => 35, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 30, 'ten_nhom_co' => 'Bụng', 'ty_le_tac_dong' => 25, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 30, 'ten_nhom_co' => 'Mông', 'ty_le_tac_dong' => 20, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 30, 'ten_nhom_co' => 'Bắp chân', 'ty_le_tac_dong' => 10, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 30, 'ten_nhom_co' => 'Vai', 'ty_le_tac_dong' => 10, 'created_at' => now(), 'updated_at' => now()],

            // =====================================================
            // CHƯƠNG TRÌNH 22: LƯNG VÀ TAY TRƯỚC
            // =====================================================

            // BT2201 - Kéo xô với thanh cáp
            ['id_bai_tap' => 31, 'ten_nhom_co' => 'Lưng xô', 'ty_le_tac_dong' => 70, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 31, 'ten_nhom_co' => 'Tay trước', 'ty_le_tac_dong' => 20, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 31, 'ten_nhom_co' => 'Vai sau', 'ty_le_tac_dong' => 10, 'created_at' => now(), 'updated_at' => now()],

            // BT2202 - Kéo cáp thấp với tay cầm chữ V
            ['id_bai_tap' => 32, 'ten_nhom_co' => 'Lưng xô', 'ty_le_tac_dong' => 65, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 32, 'ten_nhom_co' => 'Tay trước', 'ty_le_tac_dong' => 20, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 32, 'ten_nhom_co' => 'Vai sau', 'ty_le_tac_dong' => 15, 'created_at' => now(), 'updated_at' => now()],

            // BT2203 - Kéo tạ đơn một tay
            ['id_bai_tap' => 33, 'ten_nhom_co' => 'Lưng xô', 'ty_le_tac_dong' => 65, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 33, 'ten_nhom_co' => 'Tay trước', 'ty_le_tac_dong' => 20, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 33, 'ten_nhom_co' => 'Vai sau', 'ty_le_tac_dong' => 10, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 33, 'ten_nhom_co' => 'Cơ trung tâm', 'ty_le_tac_dong' => 5, 'created_at' => now(), 'updated_at' => now()],

            // BT2204 - Deadlift với tạ đòn
            ['id_bai_tap' => 34, 'ten_nhom_co' => 'Lưng', 'ty_le_tac_dong' => 30, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 34, 'ten_nhom_co' => 'Mông', 'ty_le_tac_dong' => 25, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 34, 'ten_nhom_co' => 'Đùi sau', 'ty_le_tac_dong' => 25, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 34, 'ten_nhom_co' => 'Đùi trước', 'ty_le_tac_dong' => 10, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 34, 'ten_nhom_co' => 'Cơ trung tâm', 'ty_le_tac_dong' => 10, 'created_at' => now(), 'updated_at' => now()],

            // BT2205 - Kéo tạ đòn cúi người
            ['id_bai_tap' => 35, 'ten_nhom_co' => 'Lưng xô', 'ty_le_tac_dong' => 65, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 35, 'ten_nhom_co' => 'Tay trước', 'ty_le_tac_dong' => 15, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 35, 'ten_nhom_co' => 'Vai sau', 'ty_le_tac_dong' => 10, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 35, 'ten_nhom_co' => 'Cơ trung tâm', 'ty_le_tac_dong' => 10, 'created_at' => now(), 'updated_at' => now()],

            // BT2206 - Kéo cáp Face Pull
            ['id_bai_tap' => 36, 'ten_nhom_co' => 'Vai sau', 'ty_le_tac_dong' => 45, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 36, 'ten_nhom_co' => 'Lưng trên', 'ty_le_tac_dong' => 35, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 36, 'ten_nhom_co' => 'Tay trước', 'ty_le_tac_dong' => 10, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 36, 'ten_nhom_co' => 'Cơ trung tâm', 'ty_le_tac_dong' => 10, 'created_at' => now(), 'updated_at' => now()],

            // BT2207 - Cuốn tạ đơn tập tay trước
            ['id_bai_tap' => 37, 'ten_nhom_co' => 'Tay trước', 'ty_le_tac_dong' => 85, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 37, 'ten_nhom_co' => 'Cẳng tay', 'ty_le_tac_dong' => 15, 'created_at' => now(), 'updated_at' => now()],

            // BT2208 - Cuốn tạ đòn luân phiên
            ['id_bai_tap' => 38, 'ten_nhom_co' => 'Tay trước', 'ty_le_tac_dong' => 80, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 38, 'ten_nhom_co' => 'Cẳng tay', 'ty_le_tac_dong' => 20, 'created_at' => now(), 'updated_at' => now()],

            // BT2209 - Cuốn tạ kiểu Hammer Curl
            ['id_bai_tap' => 39, 'ten_nhom_co' => 'Tay trước', 'ty_le_tac_dong' => 65, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 39, 'ten_nhom_co' => 'Cẳng tay', 'ty_le_tac_dong' => 35, 'created_at' => now(), 'updated_at' => now()],

            // BT2210 - Cuốn tay trước với cáp tay cầm hẹp
            ['id_bai_tap' => 40, 'ten_nhom_co' => 'Tay trước', 'ty_le_tac_dong' => 80, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 40, 'ten_nhom_co' => 'Cẳng tay', 'ty_le_tac_dong' => 20, 'created_at' => now(), 'updated_at' => now()],

            // =====================================================
            // CHƯƠNG TRÌNH 23: VAI VÀ THÂN TRÊN
            // =====================================================

            // BT2301 - Đẩy vai với tạ đơn
            ['id_bai_tap' => 41, 'ten_nhom_co' => 'Vai trước', 'ty_le_tac_dong' => 50, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 41, 'ten_nhom_co' => 'Vai giữa', 'ty_le_tac_dong' => 30, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 41, 'ten_nhom_co' => 'Tay sau', 'ty_le_tac_dong' => 20, 'created_at' => now(), 'updated_at' => now()],

            // BT2302 - Giữ tạ đòn trên đầu và di chuyển
            ['id_bai_tap' => 42, 'ten_nhom_co' => 'Vai trước', 'ty_le_tac_dong' => 40, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 42, 'ten_nhom_co' => 'Vai giữa', 'ty_le_tac_dong' => 25, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 42, 'ten_nhom_co' => 'Tay sau', 'ty_le_tac_dong' => 15, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 42, 'ten_nhom_co' => 'Cơ trung tâm', 'ty_le_tac_dong' => 20, 'created_at' => now(), 'updated_at' => now()],

            // BT2303 - Nâng tạ đơn sang ngang
            ['id_bai_tap' => 43, 'ten_nhom_co' => 'Vai giữa', 'ty_le_tac_dong' => 85, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 43, 'ten_nhom_co' => 'Vai trước', 'ty_le_tac_dong' => 10, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 43, 'ten_nhom_co' => 'Vai sau', 'ty_le_tac_dong' => 5, 'created_at' => now(), 'updated_at' => now()],

            // BT2304 - Nâng tạ đơn ra trước
            ['id_bai_tap' => 44, 'ten_nhom_co' => 'Vai trước', 'ty_le_tac_dong' => 85, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 44, 'ten_nhom_co' => 'Vai giữa', 'ty_le_tac_dong' => 10, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 44, 'ten_nhom_co' => 'Cơ trung tâm', 'ty_le_tac_dong' => 5, 'created_at' => now(), 'updated_at' => now()],

            // BT2305 - Dang tay ngược với dây kháng lực
            ['id_bai_tap' => 45, 'ten_nhom_co' => 'Vai sau', 'ty_le_tac_dong' => 70, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 45, 'ten_nhom_co' => 'Lưng trên', 'ty_le_tac_dong' => 25, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 45, 'ten_nhom_co' => 'Cơ trung tâm', 'ty_le_tac_dong' => 5, 'created_at' => now(), 'updated_at' => now()],

            // BT2306 - Dang tay ngược một bên với cáp
            ['id_bai_tap' => 46, 'ten_nhom_co' => 'Vai sau', 'ty_le_tac_dong' => 75, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 46, 'ten_nhom_co' => 'Lưng trên', 'ty_le_tac_dong' => 20, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 46, 'ten_nhom_co' => 'Cơ trung tâm', 'ty_le_tac_dong' => 5, 'created_at' => now(), 'updated_at' => now()],

            // BT2307 - Nhún vai với tạ đơn
            ['id_bai_tap' => 47, 'ten_nhom_co' => 'Cầu vai', 'ty_le_tac_dong' => 85, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 47, 'ten_nhom_co' => 'Cẳng tay', 'ty_le_tac_dong' => 10, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 47, 'ten_nhom_co' => 'Cơ trung tâm', 'ty_le_tac_dong' => 5, 'created_at' => now(), 'updated_at' => now()],

            // BT2308 - Kéo tạ đòn đứng tay rộng
            ['id_bai_tap' => 48, 'ten_nhom_co' => 'Vai giữa', 'ty_le_tac_dong' => 45, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 48, 'ten_nhom_co' => 'Cầu vai', 'ty_le_tac_dong' => 35, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 48, 'ten_nhom_co' => 'Tay trước', 'ty_le_tac_dong' => 10, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 48, 'ten_nhom_co' => 'Cẳng tay', 'ty_le_tac_dong' => 10, 'created_at' => now(), 'updated_at' => now()],

            // BT2309 - Đẩy vai Arnold với tạ đơn
            ['id_bai_tap' => 49, 'ten_nhom_co' => 'Vai trước', 'ty_le_tac_dong' => 40, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 49, 'ten_nhom_co' => 'Vai giữa', 'ty_le_tac_dong' => 30, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 49, 'ten_nhom_co' => 'Tay sau', 'ty_le_tac_dong' => 20, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 49, 'ten_nhom_co' => 'Cơ trung tâm', 'ty_le_tac_dong' => 10, 'created_at' => now(), 'updated_at' => now()],

            // BT2310 - Chạy trên máy chạy bộ
            ['id_bai_tap' => 50, 'ten_nhom_co' => 'Đùi trước', 'ty_le_tac_dong' => 30, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 50, 'ten_nhom_co' => 'Đùi sau', 'ty_le_tac_dong' => 20, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 50, 'ten_nhom_co' => 'Mông', 'ty_le_tac_dong' => 20, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 50, 'ten_nhom_co' => 'Bắp chân', 'ty_le_tac_dong' => 20, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 50, 'ten_nhom_co' => 'Cơ trung tâm', 'ty_le_tac_dong' => 10, 'created_at' => now(), 'updated_at' => now()],

            // =====================================================
            // CHƯƠNG TRÌNH 24: BỤNG VÀ CƠ TRUNG TÂM
            // =====================================================

            // BT2401 - Russian Twist
            ['id_bai_tap' => 51, 'ten_nhom_co' => 'Cơ liên sườn', 'ty_le_tac_dong' => 60, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 51, 'ten_nhom_co' => 'Bụng', 'ty_le_tac_dong' => 30, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 51, 'ten_nhom_co' => 'Cơ trung tâm', 'ty_le_tac_dong' => 10, 'created_at' => now(), 'updated_at' => now()],

            // BT2402 - Bicycle Crunch
            ['id_bai_tap' => 52, 'ten_nhom_co' => 'Bụng', 'ty_le_tac_dong' => 45, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 52, 'ten_nhom_co' => 'Cơ liên sườn', 'ty_le_tac_dong' => 45, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 52, 'ten_nhom_co' => 'Đùi trước', 'ty_le_tac_dong' => 10, 'created_at' => now(), 'updated_at' => now()],

            // BT2403 - Gập bụng ngược
            ['id_bai_tap' => 53, 'ten_nhom_co' => 'Bụng', 'ty_le_tac_dong' => 75, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 53, 'ten_nhom_co' => 'Cơ gấp hông', 'ty_le_tac_dong' => 15, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 53, 'ten_nhom_co' => 'Cơ trung tâm', 'ty_le_tac_dong' => 10, 'created_at' => now(), 'updated_at' => now()],

            // BT2404 - Nâng chân khi nằm
            ['id_bai_tap' => 54, 'ten_nhom_co' => 'Cơ gấp hông', 'ty_le_tac_dong' => 45, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 54, 'ten_nhom_co' => 'Bụng', 'ty_le_tac_dong' => 45, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 54, 'ten_nhom_co' => 'Cơ trung tâm', 'ty_le_tac_dong' => 10, 'created_at' => now(), 'updated_at' => now()],

            // BT2405 - Gập bụng với máy
            ['id_bai_tap' => 55, 'ten_nhom_co' => 'Bụng', 'ty_le_tac_dong' => 85, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 55, 'ten_nhom_co' => 'Cơ liên sườn', 'ty_le_tac_dong' => 15, 'created_at' => now(), 'updated_at' => now()],

            // BT2406 - Kéo cáp xoay thân trên
            ['id_bai_tap' => 56, 'ten_nhom_co' => 'Lưng trên', 'ty_le_tac_dong' => 35, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 56, 'ten_nhom_co' => 'Vai sau', 'ty_le_tac_dong' => 25, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 56, 'ten_nhom_co' => 'Cơ liên sườn', 'ty_le_tac_dong' => 25, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 56, 'ten_nhom_co' => 'Tay trước', 'ty_le_tac_dong' => 15, 'created_at' => now(), 'updated_at' => now()],

            // BT2407 - Plank nghiêng
            ['id_bai_tap' => 57, 'ten_nhom_co' => 'Cơ liên sườn', 'ty_le_tac_dong' => 50, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 57, 'ten_nhom_co' => 'Bụng', 'ty_le_tac_dong' => 25, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 57, 'ten_nhom_co' => 'Mông', 'ty_le_tac_dong' => 15, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 57, 'ten_nhom_co' => 'Vai', 'ty_le_tac_dong' => 10, 'created_at' => now(), 'updated_at' => now()],

            // BT2408 - Dead Bug
            ['id_bai_tap' => 58, 'ten_nhom_co' => 'Bụng', 'ty_le_tac_dong' => 50, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 58, 'ten_nhom_co' => 'Cơ trung tâm', 'ty_le_tac_dong' => 40, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 58, 'ten_nhom_co' => 'Cơ gấp hông', 'ty_le_tac_dong' => 10, 'created_at' => now(), 'updated_at' => now()],

            // BT2409 - Xoay thân với máy
            ['id_bai_tap' => 59, 'ten_nhom_co' => 'Cơ liên sườn', 'ty_le_tac_dong' => 65, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 59, 'ten_nhom_co' => 'Bụng', 'ty_le_tac_dong' => 25, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 59, 'ten_nhom_co' => 'Lưng dưới', 'ty_le_tac_dong' => 10, 'created_at' => now(), 'updated_at' => now()],

            // BT2410 - Nâng chân với ghế Captain's Chair
            ['id_bai_tap' => 60, 'ten_nhom_co' => 'Bụng', 'ty_le_tac_dong' => 55, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 60, 'ten_nhom_co' => 'Cơ gấp hông', 'ty_le_tac_dong' => 35, 'created_at' => now(), 'updated_at' => now()],
            ['id_bai_tap' => 60, 'ten_nhom_co' => 'Cơ trung tâm', 'ty_le_tac_dong' => 10, 'created_at' => now(), 'updated_at' => now()],

        ]);
    }
}
