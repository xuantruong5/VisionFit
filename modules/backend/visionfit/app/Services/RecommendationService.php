<?php

namespace App\Services;

class RecommendationService
{
    public static function generate($hoiVien, $chiSo): array
    {
        // 1. Đánh giá thể trạng
        $bmi = (float) $chiSo->bmi;

        if ($bmi < 18.5) {
            $danhGia = 'BMI thuộc nhóm thiếu cân. '
                . 'Bạn nên chú ý bổ sung dinh dưỡng và theo dõi cân nặng.';
        } elseif ($bmi < 25) {
            $danhGia = 'BMI nằm trong khoảng bình thường. '
                . 'Bạn nên duy trì chế độ ăn uống và tập luyện phù hợp.';
        } elseif ($bmi < 30) {
            $danhGia = 'BMI thuộc nhóm thừa cân. '
                . 'Bạn nên theo dõi vòng eo và tỷ lệ mỡ cơ thể '
                . 'để đánh giá thể trạng chính xác hơn.';
        } else {
            $danhGia = 'BMI thuộc nhóm béo phì. '
                . 'Bạn nên được đánh giá thêm về thành phần cơ thể '
                . 'và cân nhắc tư vấn chuyên môn.';
        }

        // 2. Xác định mục tiêu
        $goal = mb_strtolower(trim($hoiVien->muc_tieu_hien_tai));

        $dinhHuongDinhDuong = '';
        $dinhHuongTapLuyen = '';

        if (in_array($goal, [
            '2', 'giảm cân', 'giảm mỡ', 'giam_can', 'giam_mo'
        ])) {
            $dinhHuongDinhDuong =
                'Duy trì mức năng lượng phù hợp để tạo thâm hụt calo '
                . 'hợp lý. Ưu tiên protein, rau xanh và thực phẩm giàu chất xơ.';

            $dinhHuongTapLuyen =
                'Kết hợp tập kháng lực để duy trì cơ bắp '
                . 'và vận động tim mạch phù hợp với thể trạng.';
        } elseif (in_array($goal, [
            '1', 'tăng cơ', 'tăng cân', 'tang_co', 'tang_can'
        ])) {
            $dinhHuongDinhDuong =
                'Đảm bảo cung cấp đủ protein và năng lượng '
                . 'để hỗ trợ phát triển cơ bắp.';

            $dinhHuongTapLuyen =
                'Ưu tiên tập kháng lực, tăng tải trọng từ từ '
                . 'và đảm bảo thời gian phục hồi.';
        } else {
            $dinhHuongDinhDuong =
                'Duy trì chế độ ăn cân bằng, cung cấp đủ năng lượng '
                . 'và các chất dinh dưỡng cần thiết.';

            $dinhHuongTapLuyen =
                'Duy trì lịch tập luyện đều đặn, '
                . 'kết hợp các bài tập sức mạnh và vận động tim mạch.';
        }

        // 3. Gợi ý thực phẩm cơ bản
        $goiYThucPham = [
            'Protein' => [
                'Thịt nạc',
                'Cá',
                'Trứng',
                'Đậu phụ'
            ],
            'Rau củ' => [
                'Rau xanh',
                'Bông cải xanh',
                'Cà rốt'
            ],
            'Carb' => [
                'Gạo',
                'Khoai lang',
                'Yến mạch'
            ],
            'Chất béo' => [
                'Các loại hạt',
                'Dầu thực vật phù hợp'
            ]
        ];

        // 4. Những việc cần thực hiện
        $viecCanThucHien = [
            'Theo dõi cân nặng định kỳ.',
            'Ghi nhận chế độ ăn hàng ngày.',
            'Duy trì lịch tập luyện phù hợp.',
            'Đảm bảo thời gian nghỉ ngơi và phục hồi.',
            'Đánh giá lại chỉ số cơ thể sau 2-4 tuần.'
        ];

        // 5. Chỉ số cần theo dõi
        $chiSoTheoDoi = [
            'Cân nặng',
            'BMI',
            'Vòng eo',
            'Hiệu suất tập luyện',
            'Lượng calo và protein tiêu thụ'
        ];

        // 6. Trả kết quả khuyến cáo
        return [
            'danh_gia_the_trang' => $danhGia,
            'dinh_huong_dinh_duong' => $dinhHuongDinhDuong,
            'goi_y_thuc_pham' => $goiYThucPham,
            'dinh_huong_tap_luyen' => $dinhHuongTapLuyen,
            'viec_can_thuc_hien' => $viecCanThucHien,
            'chi_so_can_theo_doi' => $chiSoTheoDoi,
        ];
    }
}
