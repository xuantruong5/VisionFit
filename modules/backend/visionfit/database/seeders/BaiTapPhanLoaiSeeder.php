<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class BaiTapPhanLoaiSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        /*
         * Phân loại thủ công từng bài tập.
         *
         * Cấp độ:
         * 1 = Chưa có kinh nghiệm
         * 2 = Người bắt đầu
         * 3 = Nâng cao
         * 4 = Chuyên gia
         * 5 = Pro
         *
         * Nơi tập:
         * 1 = Ở nhà
         * 2 = Phòng gym
         *
         * Cấu trúc:
         * 'MÃ_BÀI_TẬP' => [
         *     'levels' => [các cấp độ phù hợp],
         *     'locations' => [các nơi tập phù hợp],
         * ],
         */

        $classifications = [

            // ==========================================
            // BT01 - NGỰC, TAY SAU
            // ==========================================

            'BT0101' => ['levels' => [3, 4, 5], 'locations' => [1, 2]], // Barbell Bench Press
            'BT0102' => ['levels' => [1, 2, 3], 'locations' => [1, 2]], // Dumbbell Floor Press
            'BT0103' => ['levels' => [1, 2, 3], 'locations' => [1, 2]], // Band Low Chest Fly
            'BT0104' => ['levels' => [1, 2, 3, 4], 'locations' => [1, 2]], // Push-Up
            'BT0105' => ['levels' => [1, 2, 3], 'locations' => [1, 2]], // Dumbbell Lying Floor Chest Press
            'BT0106' => ['levels' => [2, 3, 4, 5], 'locations' => [2]], // Machine Inner Chest Press
            'BT0107' => ['levels' => [2, 3, 4, 5], 'locations' => [2]], // Pec Deck Fly
            'BT0108' => ['levels' => [3, 4, 5], 'locations' => [2]], // Machine Decline Chest Press
            'BT0109' => ['levels' => [2, 3, 4, 5], 'locations' => [2]], // Cable Pushdown
            'BT0110' => ['levels' => [1, 2, 3], 'locations' => [1, 2]], // Dumbbell Standing Kickback

            // ==========================================
            // BT02 - CHÂN, MÔNG
            // ==========================================

            'BT0201' => ['levels' => [2, 3, 4, 5], 'locations' => [2]], // Sled Hack Squat
            'BT0202' => ['levels' => [1, 2, 3, 4], 'locations' => [1, 2]], // Dumbbell Squat
            'BT0203' => ['levels' => [1, 2, 3], 'locations' => [1, 2]], // Lunge
            'BT0204' => ['levels' => [1, 2, 3, 4], 'locations' => [2]], // Seated Leg Press
            'BT0205' => ['levels' => [2, 3, 4, 5], 'locations' => [2]], // Cable Seated Leg Extension
            'BT0206' => ['levels' => [2, 3, 4, 5], 'locations' => [2]], // Seated Leg Curl
            'BT0207' => ['levels' => [1, 2, 3, 4], 'locations' => [2]], // Seated Hip Abduction
            'BT0208' => ['levels' => [1, 2, 3], 'locations' => [1, 2]], // Glute Bridge
            'BT0209' => ['levels' => [2, 3, 4, 5], 'locations' => [2]], // Machine Standing Calf Raise
            'BT0210' => ['levels' => [1, 2, 3, 4], 'locations' => [2]], // Seated Calf Raise

            // ==========================================
            // BT03 - KHỞI ĐỘNG, TOÀN THÂN
            // ==========================================

            'BT0301' => ['levels' => [1, 2, 3, 4, 5], 'locations' => [1, 2]], // Jumping Jack
            'BT0302' => ['levels' => [1, 2, 3], 'locations' => [1, 2]], // Bodyweight Squat
            'BT0303' => ['levels' => [3, 4, 5], 'locations' => [1, 2]], // Decline Push-Up
            'BT0304' => ['levels' => [2, 3, 4, 5], 'locations' => [2]], // Assisted Triceps Dip
            'BT0305' => ['levels' => [2, 3, 4], 'locations' => [1, 2]], // Mountain Climber Jump
            'BT0306' => ['levels' => [2, 3, 4, 5], 'locations' => [2]], // Cable Side Bend
            'BT0307' => ['levels' => [1, 2, 3, 4, 5], 'locations' => [1, 2]], // High Knees
            'BT0308' => ['levels' => [1, 2, 3], 'locations' => [1, 2]], // Alternating Lunges
            'BT0309' => ['levels' => [1, 2, 3, 4], 'locations' => [2]], // Machine Seated Full Crunch
            'BT0310' => ['levels' => [1, 2, 3, 4, 5], 'locations' => [1, 2]], // High Knees Running

            // ==========================================
            // BT22 - LƯNG, TAY TRƯỚC
            // ==========================================

            'BT2201' => ['levels' => [1, 2, 3, 4, 5], 'locations' => [2]], // Cable Bar Lateral Pulldown
            'BT2202' => ['levels' => [1, 2, 3, 4, 5], 'locations' => [2]], // Cable Low Seated Row
            'BT2203' => ['levels' => [1, 2, 3, 4], 'locations' => [1, 2]], // Dumbbell Single Arm Bent Over Row
            'BT2204' => ['levels' => [3, 4, 5], 'locations' => [1, 2]], // Strongman Deadlift
            'BT2205' => ['levels' => [3, 4, 5], 'locations' => [1, 2]], // Barbell Bent Over Row
            'BT2206' => ['levels' => [2, 3, 4, 5], 'locations' => [2]], // Cable Standing Face Pull
            'BT2207' => ['levels' => [1, 2, 3], 'locations' => [1, 2]], // Dumbbell Biceps Curl
            'BT2208' => ['levels' => [2, 3, 4, 5], 'locations' => [1, 2]], // Barbell Alternate Biceps Curl
            'BT2209' => ['levels' => [1, 2, 3, 4], 'locations' => [1, 2]], // Dumbbell Hammer Curl
            'BT2210' => ['levels' => [2, 3, 4, 5], 'locations' => [2]], // Cable Close Grip Curl

            // ==========================================
            // BT23 - VAI
            // ==========================================

            'BT2301' => ['levels' => [1, 2, 3, 4], 'locations' => [1, 2]], // Dumbbell Overhead Press
            'BT2302' => ['levels' => [3, 4, 5], 'locations' => [1, 2]], // Barbell Overhead Carry/Press
            'BT2303' => ['levels' => [1, 2, 3, 4], 'locations' => [1, 2]], // Dumbbell Lateral Raise
            'BT2304' => ['levels' => [1, 2, 3], 'locations' => [1, 2]], // Dumbbell Front Raise
            'BT2305' => ['levels' => [1, 2, 3], 'locations' => [1, 2]], // Band Reverse Fly
            'BT2306' => ['levels' => [2, 3, 4, 5], 'locations' => [2]], // Cable One Arm Reverse Fly
            'BT2307' => ['levels' => [1, 2, 3, 4], 'locations' => [1, 2]], // Dumbbell Shrug
            'BT2308' => ['levels' => [2, 3, 4, 5], 'locations' => [1, 2]], // Barbell Wide Grip Upright Row
            'BT2309' => ['levels' => [3, 4, 5], 'locations' => [1, 2]], // Dumbbell Arnold Press
            'BT2310' => ['levels' => [1, 2, 3, 4, 5], 'locations' => [2]], // Elliptical Cross Trainer

            // ==========================================
            // BT24 - BỤNG
            // ==========================================

            'BT2401' => ['levels' => [1, 2, 3], 'locations' => [1, 2]], // Russian Twist
            'BT2402' => ['levels' => [1, 2, 3], 'locations' => [1, 2]], // Bicycle Crunch
            'BT2403' => ['levels' => [1, 2, 3], 'locations' => [1, 2]], // Reverse Crunch
            'BT2404' => ['levels' => [2, 3, 4], 'locations' => [1, 2]], // Lying Leg Raise
            'BT2405' => ['levels' => [1, 2, 3, 4], 'locations' => [2]], // Machine Seated Crunch
            'BT2406' => ['levels' => [2, 3, 4, 5], 'locations' => [2]], // Cable Twisting Standing High Row
            'BT2407' => ['levels' => [1, 2, 3, 4], 'locations' => [1, 2]], // Side Plank
            'BT2408' => ['levels' => [1, 2, 3], 'locations' => [1, 2]], // Dead Bug
            'BT2409' => ['levels' => [2, 3, 4, 5], 'locations' => [2]], // Machine Trunk Rotation
            'BT2410' => ['levels' => [2, 3, 4, 5], 'locations' => [2]], // Captains Chair Leg Raise
        ];

        // Lấy ID thực tế của từng bài tập bằng mã bài tập.
        $exercises = DB::table('bai_tap')
            ->select('id', 'ma_bai_tap')
            ->get()
            ->keyBy('ma_bai_tap');

        $rows = [];
        $missingCodes = [];

        foreach ($classifications as $code => $classification) {
            $exercise = $exercises->get($code);

            if (!$exercise) {
                $missingCodes[] = $code;
                continue;
            }

            foreach ($classification['levels'] as $levelId) {
                foreach ($classification['locations'] as $locationId) {
                    $rows[] = [
                        'id_bai_tap' => $exercise->id,
                        'id_cap_do' => $levelId,
                        'id_noi_tap' => $locationId,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ];
                }
            }
        }

        // Xóa phân loại cũ rồi thêm dữ liệu phân loại mới.
        DB::table('bai_tap_phan_loai')->delete();

        foreach (array_chunk($rows, 500) as $chunk) {
            DB::table('bai_tap_phan_loai')->insert($chunk);
        }

        $this->command->info(
            'Đã tạo ' . count($rows) . ' bản ghi phân loại cho '
            . count($classifications) . ' mã bài tập.'
        );

        if (!empty($missingCodes)) {
            $this->command->warn(
                'Không tìm thấy các mã bài tập: ' . implode(', ', $missingCodes)
            );
        }
    }
}
