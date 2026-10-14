<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
class BaiTapSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('bai_tap')->truncate();

        $imageUrl = 'https://gymvisual.com/43846-large_default/seated-outer-to-inner-thigh-tap-on-a-chair-female.jpg';
        $videoUrl = 'https://gymvisual.com/img/vid/12000/120421201-seated-outer-to-inner-thigh-tap-on-a-chair-femal-view.mp4';

        DB::table('bai_tap')->insert([
            [
                'id_bai_tap' => 1,
                'ma_bai_tap' => 'BT001',
                'ten_bai_tap' => 'Ngồi nhịp đùi ngoài vào trong trên ghế',
                'nhom_co' => 'Đùi & Hông',
                'gioi_tinh_ap_dung' => 2, // Cả hai
                'cap_do' => 'Người mới',
                'mo_ta' => 'Bài tập giúp săn chắc cơ đùi trong, đùi ngoài và cải thiện linh hoạt khớp háng.',
                'huong_dan' => 'Ngồi thẳng lưng trên ghế, hai chân chạm mũi giày xuống sàn, mở và khép đùi nhịp nhàng.',
                'loi_thuong_gap' => 'Gù lưng khi tập.',
                'thiet_bi' => 'Ghế ngồi',
                'anh_dai_dien' => $imageUrl,
                'video_huong_dan' => $videoUrl,
                'ho_tro_ai' => true,
                'goc_camera_khuyen_nghi' => 'Góc nghiêng 45 độ hoặc chính diện',
                'tinh_trang' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id_bai_tap' => 2,
                'ma_bai_tap' => 'BT002',
                'ten_bai_tap' => 'Hít đất trên gối',
                'nhom_co' => 'Ngực & Tay sau',
                'gioi_tinh_ap_dung' => 1, // Dành cho Nữ (hoặc người mới)
                'cap_do' => 'Người mới',
                'mo_ta' => 'Biến thể hít đất cơ bản giúp người mới xây dựng sức mạnh cơ ngực và tay sau.',
                'huong_dan' => 'Chống hai tay xuống sàn rộng hơn vai một chút, đầu gối chạm sàn, giữ thân người thẳng từ đầu đến gối rồi hạ ngực xuống.',
                'loi_thuong_gap' => 'Võng lưng, xòe cùi chỏ quá rộng.',
                'thiet_bi' => 'Thảm tập',
                'anh_dai_dien' => $imageUrl,
                'video_huong_dan' => $videoUrl,
                'ho_tro_ai' => true,
                'goc_camera_khuyen_nghi' => 'Góc nghiêng 45 độ',
                'tinh_trang' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id_bai_tap' => 3,
                'ma_bai_tap' => 'BT003',
                'ten_bai_tap' => 'Kéo giãn cơ Superman',
                'nhom_co' => 'Lưng & Mông',
                'gioi_tinh_ap_dung' => 2, // Cả hai
                'cap_do' => 'Người mới',
                'mo_ta' => 'Tăng cường sức mạnh chuỗi cơ sau, cơ dựng sống và mông.',
                'huong_dan' => 'Nằm sấp trên thảm, duỗi thẳng tay chân. Hít vào, nâng đồng thời hai tay và hai chân lên khỏi sàn, giữ 1-2 giây rồi hạ xuống.',
                'loi_thuong_gap' => 'Ngửa cổ quá mức gây áp lực cột sống cổ.',
                'thiet_bi' => 'Thảm tập',
                'anh_dai_dien' => $imageUrl,
                'video_huong_dan' => $videoUrl,
                'ho_tro_ai' => true,
                'goc_camera_khuyen_nghi' => 'Góc ngang',
                'tinh_trang' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id_bai_tap' => 4,
                'ma_bai_tap' => 'BT004',
                'ten_bai_tap' => 'Squat không tạ',
                'nhom_co' => 'Đùi trước & Mông',
                'gioi_tinh_ap_dung' => 2, // Cả hai
                'cap_do' => 'Người mới',
                'mo_ta' => 'Bài tập tổng hợp tăng cường sức mạnh thân dưới, cải thiện độ linh hoạt hông gối.',
                'huong_dan' => 'Đứng thẳng, chân rộng bằng vai, mũi chân mở nhẹ. Đẩy hông ra sau và hạ đùi song song với mặt sàn rồi đứng thẳng lên.',
                'loi_thuong_gap' => 'Đầu gối chụm vào trong, nhón gót chân.',
                'thiet_bi' => 'Không cần thiết bị',
                'anh_dai_dien' => $imageUrl,
                'video_huong_dan' => $videoUrl,
                'ho_tro_ai' => true,
                'goc_camera_khuyen_nghi' => 'Góc 45 độ hoặc chính diện',
                'tinh_trang' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id_bai_tap' => 5,
                'ma_bai_tap' => 'BT005',
                'ten_bai_tap' => 'Nâng hông nằm ngửa (Glute Bridge)',
                'nhom_co' => 'Mông & Đùi sau',
                'gioi_tinh_ap_dung' => 1, // Dành cho Nữ (tập mông đùi)
                'cap_do' => 'Người mới',
                'mo_ta' => 'Kích hoạt cơ mông và làm săn chắc cơ đùi sau.',
                'huong_dan' => 'Nằm ngửa, co gối, bàn chân đặt phẳng trên sàn. Dùng lực gót chân nâng hông lên cao cho đến khi người tạo thành đường thẳng từ vai đến gối.',
                'loi_thuong_gap' => 'Đẩy hông quá cao gây ưỡn lưng dưới.',
                'thiet_bi' => 'Thảm tập',
                'anh_dai_dien' => $imageUrl,
                'video_huong_dan' => $videoUrl,
                'ho_tro_ai' => true,
                'goc_camera_khuyen_nghi' => 'Góc ngang',
                'tinh_trang' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id_bai_tap' => 6,
                'ma_bai_tap' => 'BT006',
                'ten_bai_tap' => 'Nhảy Jack chéo (Jumping Jack)',
                'nhom_co' => 'Toàn thân (Cardio)',
                'gioi_tinh_ap_dung' => 2, // Cả hai
                'cap_do' => 'Người mới',
                'mo_ta' => 'Bài tập cardio giúp khởi động tim mạch, đốt cháy calo và làm nóng toàn thân.',
                'huong_dan' => 'Đứng thẳng, chân khép, tay thả lỏng. Nhảy bật mở rộng hai chân đồng thời đưa hai tay lên cao vỗ qua đầu, rồi nhảy về vị trí cũ.',
                'loi_thuong_gap' => 'Tiếp đất bằng gót chân gây chấn động khớp.',
                'thiet_bi' => 'Không cần thiết bị',
                'anh_dai_dien' => $imageUrl,
                'video_huong_dan' => $videoUrl,
                'ho_tro_ai' => true,
                'goc_camera_khuyen_nghi' => 'Góc chính diện',
                'tinh_trang' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id_bai_tap' => 7,
                'ma_bai_tap' => 'BT007',
                'ten_bai_tap' => 'Plank giữ thẳng người',
                'nhom_co' => 'Cơ bụng & Core',
                'gioi_tinh_ap_dung' => 0, // Dành cho Nam
                'cap_do' => 'Người mới',
                'mo_ta' => 'Xây dựng độ ổn định cột sống và làm săn chắc cơ bụng trung tâm.',
                'huong_dan' => 'Chống khuỷu tay vuông góc dưới vai, chống mũi chân, giữ toàn bộ thân người thành một đường thẳng thon dài và gồng chặt cơ bụng.',
                'loi_thuong_gap' => 'Võng lưng dưới hoặc nâng mông quá cao.',
                'thiet_bi' => 'Thảm tập',
                'anh_dai_dien' => $imageUrl,
                'video_huong_dan' => $videoUrl,
                'ho_tro_ai' => true,
                'goc_camera_khuyen_nghi' => 'Góc ngang',
                'tinh_trang' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
