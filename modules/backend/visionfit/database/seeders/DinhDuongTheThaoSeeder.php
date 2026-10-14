<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DinhDuongTheThaoSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('dinh_duong_the_thao')->truncate();

        $categories = [
            'protein' => [
                'name' => 'Protein',
                'image' => '/nutrition/protein.jpg',
            ],
            'gainer' => [
                'name' => 'Gainer',
                'image' => '/nutrition/gainer.jpg',
            ],
            'creatine' => [
                'name' => 'Creatine',
                'image' => '/nutrition/creatine.jpg',
            ],
            'amino_acids' => [
                'name' => 'Axit amin',
                'image' => '/nutrition/amino_acids.jpg',
            ],
            'fat_burner' => [
                'name' => 'Sản phẩm giảm cân',
                'image' => '/nutrition/fat_burner.jpg',
            ],
            'lcarnitine' => [
                'name' => 'L-Carnitine',
                'image' => '/nutrition/lcarnitine.jpg',
            ],
            'vitamins' => [
                'name' => 'Vitamin và khoáng chất',
                'image' => '/nutrition/vitamins.jpg',
            ],
            'specialized' => [
                'name' => 'Sản phẩm chuyên dụng',
                'image' => '/nutrition/specialized.jpg',
            ],
            'joints' => [
                'name' => 'Sản phẩm cho khớp và dây chằng',
                'image' => '/nutrition/joints.jpg',
            ],
        ];

        $products = [
            // 1. Protein
            [
                'danh_muc_slug' => 'protein',
                'ten_san_pham' => 'Complex protein',
                'anh_san_pham' => '/nutrition/protein.jpg',
                'mo_ta_ngan' => 'Hỗn hợp đạm đa tầng giải phóng axit amin trải dài từ 2 đến 7 giờ.',
                'noi_dung_chi_tiet' => "Complex protein là hỗn hợp các protein từ các nguồn gốc khác nhau, dựa trên whey protein và nhằm mục đích tăng cơ và siết cơ.\n\nComplex protein bao gồm các protein có tốc độ đồng hóa trong 2-4 giờ, ví dụ, egg albumin hoặc protein đậu nành và casein với tốc độ đồng hóa lên tới 7 giờ.\n\nDo đó, whey protein kích hoạt quá trình đồng hóa và các loại protein khác kéo dài quá trình này trong một thời gian dài nhưng vẫn duy trì mức độ nitơ trong máu.\n\nComplex protein mang lại cảm giác no lâu và là lựa chọn tuyệt vời khi thực hiện chế độ low-carb, nhằm mục đích đốt cháy mỡ dự trữ và duy trì cơ bắp nạc tối đa.",
                'luot_xem' => 1450,
            ],
            [
                'danh_muc_slug' => 'protein',
                'ten_san_pham' => 'Matrix Protein',
                'anh_san_pham' => '/nutrition/protein.jpg',
                'mo_ta_ngan' => 'Công thức đa tầng protein tinh khiết nuôi dưỡng tế bào cơ suốt ngày đêm.',
                'noi_dung_chi_tiet' => "Matrix Protein là công thức kết hợp đa tầng protein siêu tinh khiết, cung cấp axit amin trải dài suốt cả ngày lẫn đêm để nuôi dưỡng tế bào cơ tối đa.\n\nSản phẩm kết hợp giữa Whey Isolate, Micellar Casein và Albumin trứng gà tự nhiên giúp tối ưu hóa tổng hợp protein không ngừng nghỉ.",
                'luot_xem' => 980,
            ],
            [
                'danh_muc_slug' => 'protein',
                'ten_san_pham' => 'Protein bò',
                'anh_san_pham' => '/nutrition/protein.jpg',
                'mo_ta_ngan' => 'Đạm thịt bò thủy phân 100% không chứa đường sữa lactose.',
                'noi_dung_chi_tiet' => "Chiết xuất từ 100% thịt bò thủy phân không chứa lactose, giàu creatine tự nhiên và các chuỗi amino acid nồng độ cao giúp gia tăng sức mạnh vượt trội.\n\nThích hợp cho người dị ứng sữa bò, người khó tiêu hóa hoặc gymer muốn đổi nguồn đạm đồng hóa cao.",
                'luot_xem' => 870,
            ],
            [
                'danh_muc_slug' => 'protein',
                'ten_san_pham' => 'Protein casein',
                'anh_san_pham' => '/nutrition/protein.jpg',
                'mo_ta_ngan' => 'Dòng protein hấp thu chậm nuôi cơ suốt 8 tiếng ban đêm.',
                'noi_dung_chi_tiet' => "Dòng protein hấp thu chậm lý tưởng dùng trước khi ngủ, tạo thành dạng gel đặc trong dạ dày và giải phóng axit amin liên tục trong 6-8 giờ để chống dị hóa cơ bắp ban đêm.\n\nChứa hàm lượng Canxi tự nhiên cao hỗ trợ mật độ xương vững chắc.",
                'luot_xem' => 1120,
            ],
            [
                'danh_muc_slug' => 'protein',
                'ten_san_pham' => 'Protein trứng',
                'anh_san_pham' => '/nutrition/protein.jpg',
                'mo_ta_ngan' => 'Lòng trắng trứng tự nhiên với chỉ số giá trị sinh học hoàn hảo.',
                'noi_dung_chi_tiet' => "Egg Albumin chiết xuất từ lòng trắng trứng gà nguyên chất, có điểm số giá trị sinh học (Biological Value) gần như tuyệt đối.\n\nKhông chứa chất béo bão hòa và cholesterol, cực kỳ thân thiện với hệ tiêu hóa người tập luyện.",
                'luot_xem' => 760,
            ],
            [
                'danh_muc_slug' => 'protein',
                'ten_san_pham' => 'Protein đậu nành',
                'anh_san_pham' => '/nutrition/protein.jpg',
                'mo_ta_ngan' => 'Nguồn đạm thực vật thuần chay giàu isoflavone hỗ trợ tim mạch.',
                'noi_dung_chi_tiet' => "Soy Protein Isolate là lựa chọn hàng đầu cho người ăn chay (Vegan), cung cấp đầy đủ chuỗi amino acid thiết yếu từ thực vật.\n\nHỗ trợ duy trì khối lượng cơ bắp, hỗ trợ sức khỏe tim mạch và kiểm soát mức mỡ trong máu.",
                'luot_xem' => 690,
            ],
            [
                'danh_muc_slug' => 'protein',
                'ten_san_pham' => 'Whey protein',
                'anh_san_pham' => '/nutrition/protein.jpg',
                'mo_ta_ngan' => 'Đạm whey cô đặc tiêu chuẩn vàng cho người mới bắt đầu tập gym.',
                'noi_dung_chi_tiet' => "Whey Protein Concentrate giữ lại các phân đoạn vi sinh tự nhiên (lactoferrin, immunoglobulin) giúp tăng cường sức đề kháng và phát triển cơ bắp.\n\nHương vị thơm ngon béo ngậy, giá thành kinh tế phù hợp cho chế độ ăn hàng ngày.",
                'luot_xem' => 3100,
            ],
            [
                'danh_muc_slug' => 'protein',
                'ten_san_pham' => 'Whey protein isolate',
                'anh_san_pham' => '/nutrition/protein.jpg',
                'mo_ta_ngan' => 'Đạm siêu tinh khiết lọc bỏ hoàn toàn lactose, chất béo và carb.',
                'noi_dung_chi_tiet' => "Dòng đạm tinh khiết bậc nhất đã loại bỏ hầu như hoàn toàn đường lactose, chất béo và tạp chất, tốc độ hấp thu cực nhanh và siêu tinh gọn.\n\nThời điểm vàng sử dụng: Buổi sáng sau khi ngủ dậy và ngay sau khi hoàn thành buổi tập 30 phút.",
                'luot_xem' => 2450,
            ],

            // 2. Gainer
            [
                'danh_muc_slug' => 'gainer',
                'ten_san_pham' => 'Mass Gainer cao năng lượng (High Calorie)',
                'anh_san_pham' => '/nutrition/gainer.jpg',
                'mo_ta_ngan' => 'Cung cấp trên 1000 calo và 50g protein giúp người gầy tăng cân cấp tốc.',
                'noi_dung_chi_tiet' => "Sản phẩm hỗ trợ tăng cân nhanh chóng cho người gầy kinh niên (Ectomorph), cung cấp trên 1000 calo và 50g protein mỗi khẩu phần.\n\nBổ sung enzyme tiêu hóa protease và lactase giúp đường ruột hấp thu tối đa dưỡng chất mà không lo đầy bụng.",
                'luot_xem' => 1890,
            ],
            [
                'danh_muc_slug' => 'gainer',
                'ten_san_pham' => 'Lean Gainer tăng cơ nạc hạn chế tăng mỡ',
                'anh_san_pham' => '/nutrition/gainer.jpg',
                'mo_ta_ngan' => 'Tỷ lệ Carb : Protein chuẩn 2:1 từ tinh bột hấp thu chậm yến mạch.',
                'noi_dung_chi_tiet' => "Tỷ lệ Carb : Protein lý tưởng 2:1 từ yến mạch và khoai lang, giúp tăng cơ bắp nạc sạch sẽ (Clean Bulk) mà không tích trữ mỡ thừa.\n\nChỉ số đường huyết GI thấp giúp năng lượng giải phóng ổn định và không làm tăng vọt insulin.",
                'luot_xem' => 1340,
            ],

            // 3. Creatine
            [
                'danh_muc_slug' => 'creatine',
                'ten_san_pham' => 'Creatine Monohydrate vi hạt (Micronized)',
                'anh_san_pham' => '/nutrition/creatine.jpg',
                'mo_ta_ngan' => 'Dạng creatine tinh khiết nhất giúp tái tạo ATP và tăng sức mạnh tức thì.',
                'noi_dung_chi_tiet' => "Dạng creatine tinh khiết nhất được nghiền mịn thành kích thước siêu nhỏ, tan ngay trong nước và hấp thu nhanh vào tế bào cơ.\n\nTác dụng tái tạo năng lượng ATP bùng nổ sức mạnh trong các hiệp tập nặng như Squat, Bench Press, Deadlift.",
                'luot_xem' => 2780,
            ],
            [
                'danh_muc_slug' => 'creatine',
                'ten_san_pham' => 'Creatine HCL (Creatine Hydrochloride)',
                'anh_san_pham' => '/nutrition/creatine.jpg',
                'mo_ta_ngan' => 'Độ hòa tan gấp 38 lần không gây tích nước dưới da.',
                'noi_dung_chi_tiet' => "Creatine liên kết với muối hydrochloride giúp tăng độ hòa tan gấp 38 lần, không gây cảm giác đầy bụng hay tích nước dưới da.\n\nLiều dùng cực nhỏ chỉ 1.5 - 2g mỗi ngày mà vẫn mang lại hiệu quả tương đương 5g Creatine Monohydrate.",
                'luot_xem' => 1620,
            ],

            // 4. Axit amin
            [
                'danh_muc_slug' => 'amino_acids',
                'ten_san_pham' => 'Arginine',
                'anh_san_pham' => '/nutrition/amino_acids.jpg',
                'mo_ta_ngan' => 'Kích thích sản sinh Oxit Nitric (NO) làm giãn nở mạch máu và pump cơ.',
                'noi_dung_chi_tiet' => "L-Arginine là tiền chất trực tiếp của Nitric Oxide (NO), có vai trò làm giãn nở mạch máu, gia tăng lượng oxy và dưỡng chất vận chuyển vào từng thớ cơ.\n\nGiúp người tập có cảm giác cơ bắp căng phồng (pump) và tăng cường lưu thông máu toàn thân.",
                'luot_xem' => 1180,
            ],
            [
                'danh_muc_slug' => 'amino_acids',
                'ten_san_pham' => 'BCAA axit amin',
                'anh_san_pham' => '/nutrition/amino_acids.jpg',
                'mo_ta_ngan' => 'Chuỗi 3 axit amin nhánh (Leucine, Isoleucine, Valine) chống dị hóa cơ.',
                'noi_dung_chi_tiet' => "Cung cấp tỷ lệ vàng Leucine : Isoleucine : Valine (2:1:1) giúp chống dị hóa teo cơ trong suốt buổi tập cường độ cao.\n\nLeucine kích hoạt trực tiếp thụ thể mTOR kích thích tổng hợp sợi cơ mới ngay khi bạn còn đang tập luyện.",
                'luot_xem' => 2260,
            ],
            [
                'danh_muc_slug' => 'amino_acids',
                'ten_san_pham' => 'Citrulline',
                'anh_san_pham' => '/nutrition/amino_acids.jpg',
                'mo_ta_ngan' => 'Tăng nồng độ Arginine trong huyết tương, đẩy lùi cảm giác mỏi cơ.',
                'noi_dung_chi_tiet' => "L-Citrulline Malate giúp đào thải amoniac và axit lactic sinh ra trong quá trình cơ bắp co rút liên tục, giảm hiện tượng đau mỏi cơ.\n\nCitrulline hấp thu qua đường tiêu hóa hiệu quả hơn cả Arginine tinh khiết.",
                'luot_xem' => 1430,
            ],
            [
                'danh_muc_slug' => 'amino_acids',
                'ten_san_pham' => 'Glutamine',
                'anh_san_pham' => '/nutrition/amino_acids.jpg',
                'mo_ta_ngan' => 'Axit amin chiếm 60% mô cơ, hỗ trợ phục hồi và tăng cường miễn dịch.',
                'noi_dung_chi_tiet' => "L-Glutamine là axit amin phong phú nhất trong mô cơ thể. Khi tập nặng, hàm lượng glutamine bị sụt giảm nghiêm trọng.\n\nBổ sung glutamine sau tập giúp đẩy nhanh tốc độ phục hồi sợi cơ, bảo vệ niêm mạc ruột và hệ miễn dịch khỏe mạnh.",
                'luot_xem' => 1520,
            ],
            [
                'danh_muc_slug' => 'amino_acids',
                'ten_san_pham' => 'Arginine Alpha-ketoglutarate',
                'anh_san_pham' => '/nutrition/amino_acids.jpg',
                'mo_ta_ngan' => 'Dạng muối AAKG nâng cao hiệu suất bơm máu và hấp thu dinh dưỡng.',
                'noi_dung_chi_tiet' => "AAKG là sự kết hợp giữa Arginine và phân tử Alpha-Ketoglutarate giúp cơ thể hấp thu nhanh hơn và kéo dài thời gian duy trì nồng độ Nitric Oxide.\n\nThường được các vận động viên thể hình chuyên nghiệp tin dùng trước khi lên sàn hoặc trong các buổi tập ngực, tay.",
                'luot_xem' => 970,
            ],

            // 5. Sản phẩm giảm cân
            [
                'danh_muc_slug' => 'fat_burner',
                'ten_san_pham' => 'Viên đốt mỡ sinh nhiệt (Thermogenic Fat Burner)',
                'anh_san_pham' => '/nutrition/fat_burner.jpg',
                'mo_ta_ngan' => 'Tăng tốc trao đổi chất và chuyển hóa mỡ thừa thành năng lượng vận động.',
                'noi_dung_chi_tiet' => "Kích thích sinh nhiệt tự nhiên, tăng tốc độ trao đổi chất cơ bản và giải phóng axit béo dự trữ thành năng lượng.\n\nKết hợp chiết xuất trà xanh EGCG, hạt tiêu đen Bioperine và caffeine giúp kiềm chế cơn thèm ăn hiệu quả.",
                'luot_xem' => 1940,
            ],
            [
                'danh_muc_slug' => 'fat_burner',
                'ten_san_pham' => 'CLA (Conjugated Linoleic Acid)',
                'anh_san_pham' => '/nutrition/fat_burner.jpg',
                'mo_ta_ngan' => 'Axit béo tự nhiên giúp ngăn chặn sự tích tụ mỡ trong tế bào.',
                'noi_dung_chi_tiet' => "CLA là dạng axit béo omega-6 tự nhiên giúp ức chế enzyme lipoprotein lipase, ngăn tế bào mỡ phình to.\n\nAn toàn, không chứa chất kích thích, có thể dùng lâu dài trong giai đoạn siết cơ (Cutting).",
                'luot_xem' => 1100,
            ],

            // 6. L-Carnitine
            [
                'danh_muc_slug' => 'lcarnitine',
                'ten_san_pham' => 'L-Carnitine 3000mg Liquid',
                'anh_san_pham' => '/nutrition/lcarnitine.jpg',
                'mo_ta_ngan' => 'Chiếc xe vận chuyển axit béo vào ty thể tế bào để đốt mỡ.',
                'noi_dung_chi_tiet' => "Chiếc xe vận chuyển axit béo vào ty thể tế bào để đốt cháy thành năng lượng ATP, tối ưu hóa khi tập cardio.\n\nDạng lỏng hấp thu nhanh chóng, không chứa đường và không chứa chất kích thích, có thể uống vào buổi tối mà không lo mất ngủ.",
                'luot_xem' => 1280,
            ],
            [
                'danh_muc_slug' => 'lcarnitine',
                'ten_san_pham' => 'Acetyl L-Carnitine (ALCAR)',
                'anh_san_pham' => '/nutrition/lcarnitine.jpg',
                'mo_ta_ngan' => 'Dạng L-Carnitine vượt qua hàng rào máu não hỗ trợ tập trung và đốt mỡ.',
                'noi_dung_chi_tiet' => "Dạng Acetyl L-Carnitine cao cấp có khả năng vượt qua hàng rào máu não, hỗ trợ tăng cường độ tập trung trí não đồng thời tăng tốc độ oxy hóa chất béo trong cơ thể.",
                'luot_xem' => 890,
            ],

            // 7. Vitamin và khoáng chất
            [
                'danh_muc_slug' => 'vitamins',
                'ten_san_pham' => 'Multivitamin & Khoáng chất cho Vận động viên',
                'anh_san_pham' => '/nutrition/vitamins.jpg',
                'mo_ta_ngan' => 'Hơn 30 loại vitamin, khoáng chất và chất chống oxy hóa chuyên sâu.',
                'noi_dung_chi_tiet' => "Cung cấp đầy đủ Vitamin A, C, D3, E, K2 cùng Kẽm, Magie và Selen giúp tăng cường miễn dịch và tối ưu hóa chuyển hóa năng lượng.\n\nGiúp bù đắp vi chất bị thất thoát qua đường mồ hôi sau các buổi tập nặng.",
                'luot_xem' => 1430,
            ],
            [
                'danh_muc_slug' => 'vitamins',
                'ten_san_pham' => 'ZMA (Kẽm, Magie & Vitamin B6)',
                'anh_san_pham' => '/nutrition/vitamins.jpg',
                'mo_ta_ngan' => 'Công thức hỗ trợ giấc ngủ sâu và tối ưu hóa sản sinh Testosterone tự nhiên.',
                'noi_dung_chi_tiet' => "ZMA là sự kết hợp chuẩn liều lượng giữa Kẽm Monomethionine, Magie Aspartate và Vitamin B6.\n\nUống trước khi đi ngủ 30 phút giúp cải thiện chất lượng giấc ngủ sâu (REM), phục hồi hệ thần kinh và cân bằng nội tiết tố nam.",
                'luot_xem' => 1210,
            ],

            // 8. Sản phẩm chuyên dụng
            [
                'danh_muc_slug' => 'specialized',
                'ten_san_pham' => 'Pre-Workout tăng sức mạnh & Pump cơ',
                'anh_san_pham' => '/nutrition/specialized.jpg',
                'mo_ta_ngan' => 'Bùng nổ sức mạnh, tăng lưu lượng máu và tỉnh táo tuyệt đối.',
                'noi_dung_chi_tiet' => "Chứa Citrulline Malate, Beta-Alanine và Caffeine giúp bùng nổ sức mạnh, tăng lưu lượng máu và tập trung cao độ.\n\nSử dụng 20-30 phút trước buổi tập để có cảm giác sung sức và pump cơ cực đại.",
                'luot_xem' => 2200,
            ],
            [
                'danh_muc_slug' => 'specialized',
                'ten_san_pham' => 'HMB (Beta-Hydroxy Beta-Methylbutyrate)',
                'anh_san_pham' => '/nutrition/specialized.jpg',
                'mo_ta_ngan' => 'Chất chuyển hóa của Leucine bảo vệ cơ bắp tối đa khi siết cân.',
                'noi_dung_chi_tiet' => "HMB đóng vai trò như một tấm khiên bảo vệ các sợi cơ không bị phá hủy trong giai đoạn thâm hụt calo sâu hoặc cardio cường độ cao.\n\nĐặc biệt hữu ích cho người siết cân thi đấu hoặc người mới bắt đầu tập luyện cường độ nặng.",
                'luot_xem' => 780,
            ],

            // 9. Sản phẩm cho khớp và dây chằng
            [
                'danh_muc_slug' => 'joints',
                'ten_san_pham' => 'Glucosamine, Chondroitin & MSM bảo vệ sụn khớp',
                'anh_san_pham' => '/nutrition/joints.jpg',
                'mo_ta_ngan' => 'Tái tạo chất nhờn sụn khớp và giảm đau mỏi dây chằng khi gánh nặng.',
                'noi_dung_chi_tiet' => "Tái tạo chất nhờn sụn khớp, giảm viêm đau khớp gối và vai khi gánh nâng tạ nặng thường xuyên.\n\nBộ ba hoàn hảo Glucosamine + Chondroitin + MSM giúp duy trì tính đàn hồi của mô liên kết và ngăn ngừa chấn thương khớp mạn tính.",
                'luot_xem' => 1750,
            ],
            [
                'danh_muc_slug' => 'joints',
                'ten_san_pham' => 'Collagen Type II không biến tính cho sụn',
                'anh_san_pham' => '/nutrition/joints.jpg',
                'mo_ta_ngan' => 'Tác động trực tiếp vào hệ thống miễn dịch giúp giảm viêm sụn khớp.',
                'noi_dung_chi_tiet' => "UC-II (Collagen type 2 không biến tính) giúp ức chế quá trình tự miễn phá hủy sụn khớp, tăng độ linh hoạt của đầu gối và cột sống.\n\nChỉ cần 1 viên 40mg mỗi ngày mang lại hiệu quả vượt trội so với các loại collagen thông thường.",
                'luot_xem' => 990,
            ],
        ];

        $insertData = [];
        foreach ($products as $p) {
            $cat = $categories[$p['danh_muc_slug']] ?? [
                'name' => ucfirst($p['danh_muc_slug']),
                'image' => null,
            ];

            $insertData[] = [
                'danh_muc_slug' => $p['danh_muc_slug'],
                'danh_muc_ten' => $cat['name'],
                'danh_muc_anh' => $cat['image'],
                'ten_san_pham' => $p['ten_san_pham'],
                'anh_san_pham' => $p['anh_san_pham'],
                'mo_ta_ngan' => $p['mo_ta_ngan'],
                'noi_dung_chi_tiet' => $p['noi_dung_chi_tiet'],
                'luot_xem' => $p['luot_xem'],
                'tinh_trang' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        DB::table('dinh_duong_the_thao')->insert($insertData);
    }
}
