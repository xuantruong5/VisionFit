<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ChuongTrinhTapSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('chuong_trinh_tap')->truncate();

        $capDos = [
            [
                'ma' => 'CHUA_CO_KINH_NGHIEM',
                'ten' => 'Chưa có kinh nghiệm',
                'so_sao' => 0,
                'so_ngay' => 24,
                'so_buoi' => 3,
                'mo_ta' => 'Cường độ nhẹ, ưu tiên làm quen kỹ thuật, kiểm soát tư thế và xây dựng thói quen tập luyện an toàn.',
            ],
            [
                'ma' => 'NGUOI_BAT_DAU',
                'ten' => 'Người bắt đầu',
                'so_sao' => 1,
                'so_ngay' => 32,
                'so_buoi' => 4,
                'mo_ta' => 'Khối lượng tập vừa phải, giúp củng cố kỹ thuật, sức bền và nền tảng sức mạnh.',
            ],
            [
                'ma' => 'NANG_CAO',
                'ten' => 'Nâng cao',
                'so_sao' => 2,
                'so_ngay' => 48,
                'so_buoi' => 4,
                'mo_ta' => 'Khối lượng và cường độ cao hơn, phù hợp với người đã duy trì tập luyện ổn định và muốn tạo tiến bộ rõ rệt.',
            ],
            [
                'ma' => 'CHUYEN_GIA',
                'ten' => 'Chuyên gia',
                'so_sao' => 3,
                'so_ngay' => 32,
                'so_buoi' => 4,
                'mo_ta' => 'Mật độ tập cao, chú trọng hiệu suất, khả năng kiểm soát kỹ thuật và phục hồi giữa các buổi.',
            ],
            [
                'ma' => 'PRO',
                'ten' => 'Pro',
                'so_sao' => 4,
                'so_ngay' => 24,
                'so_buoi' => 3,
                'mo_ta' => 'Tập trung vào chất lượng, cường độ và hiệu suất, phù hợp với người có kinh nghiệm cao và kỹ thuật vững.',
            ],
        ];

        $noiTaps = [
            [
                'ten' => 'Tại nhà',
                'mo_ta' => 'Bài tập được tối ưu cho không gian tại nhà, ưu tiên trọng lượng cơ thể, dây kháng lực hoặc dụng cụ đơn giản.',
            ],
            [
                'ten' => 'Phòng gym',
                'mo_ta' => 'Bài tập tận dụng tạ, máy và thiết bị tại phòng gym để tăng khả năng điều chỉnh tải và đa dạng bài tập.',
            ],
        ];

        $chuongTrinhCoMucTieu = [
            // Nam
            [
                'ten' => 'Tăng cơ bắp',
                'muc_tieu' => 'Tăng cơ bắp',
                'gioi_tinh' => 0,
                'mo_ta' => 'Phát triển khối lượng cơ toàn thân, cải thiện sức mạnh và xây dựng vóc dáng cân đối.',
                'anh' => 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=1470&auto=format&fit=crop',
            ],
            [
                'ten' => 'Tay to khỏe',
                'muc_tieu' => 'Phát triển cơ tay',
                'gioi_tinh' => 0,
                'mo_ta' => 'Tập trung phát triển cơ tay trước, tay sau và lực cầm nắm để tăng kích thước và sức mạnh cánh tay.',
                'anh' => 'https://yamaguchi.com.vn/media/news/2311_co-cang-tay-mot-trong-nhung-nhom-co-cung-dau-kho-tap-nhat-cua-canh-tay.jpg',
            ],
            [
                'ten' => 'Ngực vạm vỡ',
                'muc_tieu' => 'Phát triển cơ ngực',
                'gioi_tinh' => 0,
                'mo_ta' => 'Xây dựng cơ ngực dày, cân đối và cải thiện sức mạnh thân trên.',
                'anh' => 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=1470&auto=format&fit=crop',
            ],
            [
                'ten' => 'Lưng rộng',
                'muc_tieu' => 'Phát triển cơ lưng',
                'gioi_tinh' => 0,
                'mo_ta' => 'Phát triển cơ xô và lưng giữa để tạo vóc dáng chữ V khỏe khoắn.',
                'anh' => 'https://images.unsplash.com/photo-1507398941214-572c25f4b1dc?q=80&w=1373&auto=format&fit=crop',
            ],
            [
                'ten' => 'Vai rộng',
                'muc_tieu' => 'Phát triển cơ vai',
                'gioi_tinh' => 0,
                'mo_ta' => 'Phát triển toàn diện vai trước, vai giữa và vai sau.',
                'anh' => 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQUwnzt21TsbRz7k9Fg1fmJpHz8ixyUpXlvaaFdg8q2H5BoIPPjbqkMUIhg&s=10',
            ],
            [
                'ten' => 'Chân chắc khỏe',
                'muc_tieu' => 'Phát triển thân dưới',
                'gioi_tinh' => 0,
                'mo_ta' => 'Tăng sức mạnh đùi, mông, bắp chân và cải thiện khả năng vận động.',
                'anh' => 'https://images.unsplash.com/photo-1683509231125-5c487afaa453?fm=jpg&q=60&w=3000&auto=format&fit=crop',
            ],
            [
                'ten' => 'Giảm cân',
                'muc_tieu' => 'Giảm cân',
                'gioi_tinh' => 0,
                'mo_ta' => 'Kết hợp cardio và kháng lực để tăng tiêu hao năng lượng bền vững.',
                'anh' => 'https://images.unsplash.com/photo-1486218119243-13883505764c?q=80&w=1472&auto=format&fit=crop',
            ],
            [
                'ten' => 'Cơ thể sắc nét',
                'muc_tieu' => 'Siết cơ giảm mỡ',
                'gioi_tinh' => 0,
                'mo_ta' => 'Giảm mỡ và duy trì cơ bắp để vóc dáng săn chắc, rõ nét hơn.',
                'anh' => 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=1470&auto=format&fit=crop',
            ],
            [
                'ten' => 'Cơ bụng 6 múi',
                'muc_tieu' => 'Phát triển cơ bụng',
                'gioi_tinh' => 0,
                'mo_ta' => 'Tăng sức mạnh vùng core kết hợp vận động hỗ trợ giảm mỡ toàn thân.',
                'anh' => 'https://png.pngtree.com/thumb_back/fw800/background/20250913/pngtree-ripped-male-sixpack-torso-image_19298269.webp',
            ],
            [
                'ten' => 'Powerlifting',
                'muc_tieu' => 'Tăng sức mạnh',
                'gioi_tinh' => 0,
                'mo_ta' => 'Phát triển sức mạnh với ba động tác squat, bench press và deadlift.',
                'anh' => 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1470&auto=format&fit=crop',
            ],
            [
                'ten' => 'CrossFit',
                'muc_tieu' => 'Tăng thể lực',
                'gioi_tinh' => 0,
                'mo_ta' => 'Kết hợp sức mạnh, sức bền và vận động chức năng ở cường độ cao.',
                'anh' => 'https://images.unsplash.com/photo-1601422407692-ec4eeec1d9b3?fm=jpg&q=60&w=3000&auto=format&fit=crop',
            ],
            [
                'ten' => 'Tập toàn thân 45 phút',
                'muc_tieu' => 'Tập toàn thân',
                'gioi_tinh' => 0,
                'mo_ta' => 'Buổi tập toàn thân cân bằng, phù hợp người có ít thời gian.',
                'anh' => 'https://images.unsplash.com/photo-1669322779651-5ca89652492e?fm=jpg&q=60&w=3000&auto=format&fit=crop',
            ],

            // Nữ
            [
                'ten' => 'Giảm cân',
                'muc_tieu' => 'Giảm cân',
                'gioi_tinh' => 1,
                'mo_ta' => 'Kết hợp cardio và kháng lực giúp kiểm soát cân nặng an toàn.',
                'anh' => 'https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=1470&auto=format&fit=crop',
            ],
            [
                'ten' => 'Cơ thể sắc nét',
                'muc_tieu' => 'Siết cơ giảm mỡ',
                'gioi_tinh' => 1,
                'mo_ta' => 'Cải thiện độ săn chắc và đường nét cơ thể bằng bài tập toàn diện.',
                'anh' => 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=1469&auto=format&fit=crop',
            ],
            [
                'ten' => 'Vòng ba hoàn hảo',
                'muc_tieu' => 'Phát triển cơ mông',
                'gioi_tinh' => 1,
                'mo_ta' => 'Tập trung phát triển cơ mông và cải thiện sức mạnh thân dưới.',
                'anh' => 'https://sunfitness.vn/wp-content/uploads/2023/08/tap-gym-tang-vong-3-1.jpg.webp',
            ],
            [
                'ten' => 'Cơ bụng 6 múi',
                'muc_tieu' => 'Phát triển cơ bụng',
                'gioi_tinh' => 1,
                'mo_ta' => 'Củng cố vùng core và hỗ trợ xây dựng vòng eo săn chắc.',
                'anh' => 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=1470&auto=format&fit=crop',
            ],
            [
                'ten' => 'Tăng cơ bắp',
                'muc_tieu' => 'Tăng cơ bắp',
                'gioi_tinh' => 1,
                'mo_ta' => 'Phát triển cơ bắp cân đối, tăng sức mạnh và cải thiện vóc dáng.',
                'anh' => 'https://images.unsplash.com/photo-1534258936925-c58bed479fcb?q=80&w=1631&auto=format&fit=crop',
            ],
            [
                'ten' => 'Powerlifting',
                'muc_tieu' => 'Tăng sức mạnh',
                'gioi_tinh' => 1,
                'mo_ta' => 'Rèn luyện sức mạnh với squat, bench press và deadlift đúng kỹ thuật.',
                'anh' => 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1470&auto=format&fit=crop',
            ],
            [
                'ten' => 'CrossFit',
                'muc_tieu' => 'Tăng thể lực',
                'gioi_tinh' => 1,
                'mo_ta' => 'Nâng cao sức mạnh, sức bền và khả năng vận động toàn thân.',
                'anh' => 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1470&auto=format&fit=crop',
            ],
            [
                'ten' => 'Tập toàn thân 45 phút',
                'muc_tieu' => 'Tập toàn thân',
                'gioi_tinh' => 1,
                'mo_ta' => 'Chương trình toàn thân ngắn gọn giúp duy trì sức khỏe và vóc dáng.',
                'anh' => 'https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=1470&auto=format&fit=crop',
            ],
            [
                'ten' => 'Phục hồi sau sinh',
                'muc_tieu' => 'Phục hồi sau sinh',
                'gioi_tinh' => 1,
                'mo_ta' => 'Vận động nhẹ giúp phục hồi core và thể lực sau sinh theo lộ trình.',
                'anh' => 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=1520&auto=format&fit=crop',
            ],
        ];

        $chuongTrinhKhongMucTieu = [
            [
                'ten' => 'Khởi động toàn thân',
                'mo_ta' => 'Đánh thức các nhóm cơ và chuẩn bị khớp trước buổi tập chính.',
                'anh' => 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=1520&auto=format&fit=crop',
            ],
            [
                'ten' => 'Toàn thân cho người mới',
                'mo_ta' => 'Làm quen các chuyển động nền tảng và phát triển thể lực toàn thân một cách cân bằng.',
                'anh' => 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=1470&auto=format&fit=crop',
            ],
            [
                'ten' => 'Cardio đốt năng lượng',
                'mo_ta' => 'Tăng nhịp tim, cải thiện sức bền và hỗ trợ tiêu hao năng lượng bằng các bài cardio liên tục.',
                'anh' => 'https://plus.unsplash.com/premium_photo-1679938885972-180ed418f466?fm=jpg&q=60&w=3000&auto=format&fit=crop',
            ],
            [
                'ten' => 'Thân trên toàn diện',
                'mo_ta' => 'Phối hợp các bài tập ngực, lưng, vai và tay để phát triển thân trên cân đối.',
                'anh' => 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=1470&auto=format&fit=crop',
            ],
            [
                'ten' => 'Thân dưới toàn diện',
                'mo_ta' => 'Phát triển đồng đều cơ mông, đùi trước, đùi sau và bắp chân.',
                'anh' => 'https://images.unsplash.com/photo-1434596922112-19c563067271?q=80&w=1470&auto=format&fit=crop',
            ],
            [
                'ten' => 'Core vững chắc',
                'mo_ta' => 'Củng cố cơ bụng, lưng dưới và khả năng giữ ổn định cơ thể trong vận động.',
                'anh' => 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=1470&auto=format&fit=crop',
            ],
            [
                'ten' => 'HIIT toàn thân',
                'mo_ta' => 'Kết hợp các chuỗi vận động cường độ cao giúp nâng cao sức bền và thể lực toàn thân.',
                'anh' => 'https://images.unsplash.com/photo-1599058917212-d750089bc07e?fm=jpg&q=60&w=3000&auto=format&fit=crop',
            ],
            [
                'ten' => 'Sức mạnh nền tảng',
                'mo_ta' => 'Rèn luyện các chuyển động compound và kỹ thuật tăng tải để xây dựng sức mạnh tổng thể.',
                'anh' => 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1470&auto=format&fit=crop',
            ],
            [
                'ten' => 'Mobility và giãn cơ',
                'mo_ta' => 'Cải thiện biên độ vận động, độ linh hoạt và khả năng phục hồi của cơ thể.',
                'anh' => 'https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=1470&auto=format&fit=crop',
            ],
            [
                'ten' => 'Tập nhanh 20 phút',
                'mo_ta' => 'Buổi tập ngắn gọn giúp duy trì thói quen vận động ngay cả khi thời gian hạn chế.',
                'anh' => 'https://images.unsplash.com/photo-1486218119243-13883505764c?q=80&w=1472&auto=format&fit=crop',
            ],
        ];

        $data = [];
        $id = 1;

        // Nhóm có mục tiêu: Nam/Nữ -> chương trình -> nơi tập -> cấp độ
        foreach ($chuongTrinhCoMucTieu as $chuongTrinh) {
            foreach ($noiTaps as $noiTap) {
                foreach ($capDos as $capDo) {
                    $gioiTinh = $chuongTrinh['gioi_tinh'] === 1 ? 'nữ' : 'nam';

                    $data[] = [
                        'id_chuong_trinh' => $id++,
                        'ten_chuong_trinh' => $chuongTrinh['ten'],
                        'mo_ta' => $chuongTrinh['mo_ta']
                            . ' Đây là kế hoạch dành cho ' . $gioiTinh
                            . ', tập ' . mb_strtolower($noiTap['ten'])
                            . ' ở cấp độ ' . mb_strtolower($capDo['ten']) . '. '
                            . $capDo['mo_ta'] . ' '
                            . $noiTap['mo_ta']
                            . ' Lộ trình gồm ' . $capDo['so_ngay']
                            . ' ngày với ' . $capDo['so_buoi']
                            . ' buổi mỗi tuần.',
                        'muc_tieu' => $chuongTrinh['muc_tieu'],
                        'nhom_muc_tieu' => 1,
                        'cap_do' => $capDo['ma'],
                        'so_sao' => $capDo['so_sao'],
                        'gioi_tinh_ap_dung' => $chuongTrinh['gioi_tinh'],
                        'noi_tap' => $noiTap['ten'],
                        'so_ngay' => $capDo['so_ngay'],
                        'so_buoi_moi_tuan' => $capDo['so_buoi'],
                        'anh_dai_dien' => $chuongTrinh['anh'],
                        'tinh_trang' => '1',
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];
                }
            }
        }

        // Nhóm không theo mục tiêu: chương trình chung -> nơi tập -> cấp độ
        foreach ($chuongTrinhKhongMucTieu as $chuongTrinh) {
            foreach ($noiTaps as $noiTap) {
                foreach ($capDos as $capDo) {
                    $data[] = [
                        'id_chuong_trinh' => $id++,
                        'ten_chuong_trinh' => $chuongTrinh['ten'],
                        'mo_ta' => $chuongTrinh['mo_ta']
                            . ' Đây là chương trình không theo mục tiêu cụ thể, tập '
                            . mb_strtolower($noiTap['ten'])
                            . ' ở cấp độ ' . mb_strtolower($capDo['ten']) . '. '
                            . $capDo['mo_ta'] . ' '
                            . $noiTap['mo_ta']
                            . ' Lộ trình gồm ' . $capDo['so_ngay']
                            . ' ngày với ' . $capDo['so_buoi']
                            . ' buổi mỗi tuần.',
                        'muc_tieu' => null,
                        'nhom_muc_tieu' => 0,
                        'cap_do' => $capDo['ma'],
                        'so_sao' => $capDo['so_sao'],
                        'gioi_tinh_ap_dung' => 2,
                        'noi_tap' => $noiTap['ten'],
                        'so_ngay' => $capDo['so_ngay'],
                        'so_buoi_moi_tuan' => $capDo['so_buoi'],
                        'anh_dai_dien' => $chuongTrinh['anh'],
                        'tinh_trang' => '1',
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];
                }
            }
        }

        DB::table('chuong_trinh_tap')->insert($data);
    }
}
