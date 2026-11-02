<?php

namespace App\Services;

use App\Models\LichSuChiSoDinhDuong;
use InvalidArgumentException;

class NutritionService
{
    /**
     * 1. Tính chỉ số khối cơ thể (BMI)
     * Công thức: Cân nặng (kg) / (Chiều cao (m) ^ 2)
     *
     * @param float $weightKg Cân nặng tính bằng kg
     * @param float $heightCm Chiều cao tính bằng cm
     * @return float
     */
    public static function calculateBMI(float $weightKg, float $heightCm): float
    {
        if ($heightCm <= 0 || $weightKg <= 0) {
            return 0.0;
        }

        $heightM = $heightCm / 100.0;
        return round($weightKg / ($heightM * $heightM), 2);
    }

    /**
     * 2. Tính tỷ lệ trao đổi chất cơ bản (BMR) theo công thức chuẩn y khoa Mifflin - St Jeor
     * - Nam: BMR = (10 × cân nặng) + (6.25 × chiều cao) - (5 × tuổi) + 5
     * - Nữ:  BMR = (10 × cân nặng) + (6.25 × chiều cao) - (5 × tuổi) - 161
     *
     * @param float $weightKg Cân nặng (kg)
     * @param float $heightCm Chiều cao (cm)
     * @param int $age Tuổi
     * @param string|int $gender Giới tính (0/'nam'/'male': Nam; 1/'nu'/'female': Nữ)
     * @return float
     */
    public static function calculateBMR(float $weightKg, float $heightCm, int $age, $gender = 0): float
    {
        if ($weightKg <= 0 || $heightCm <= 0 || $age <= 0) {
            return 0.0;
        }

        $base = (10.0 * $weightKg) + (6.25 * $heightCm) - (5.0 * $age);

        // Chuẩn hóa giới tính: 1, 'nu', 'female' là Nữ; còn lại là Nam
        $isFemale = in_array(strtolower((string)$gender), ['1', 'nu', 'female', 'nữ'], true);

        $bmr = $isFemale ? ($base - 161.0) : ($base + 5.0);

        return round(max(0.0, $bmr), 2);
    }

    /**
     * 3. Tính tổng năng lượng tiêu hao hàng ngày (TDEE)
     * Công thức: TDEE = BMR × Hệ số vận động (Activity Multiplier)
     *
     * @param float $bmr Năng lượng BMR
     * @param float $activityMultiplier Hệ số vận động (1.2 đến 1.9)
     * @return float
     */
    public static function calculateTDEE(float $bmr, float $activityMultiplier = 1.375): float
    {
        if ($bmr <= 0) {
            return 0.0;
        }

        return round($bmr * $activityMultiplier, 2);
    }

    /**
     * 4. Tính mức năng lượng mục tiêu (Kcal mục tiêu)
     * - Giảm cân/Giảm mỡ: TDEE - 500 kcal (không được dưới BMR để bảo vệ sức khỏe)
     * - Tăng cân/Tăng cơ: TDEE + 300 kcal
     * - Duy trì vóc dáng: TDEE
     *
     * @param float $tdee Tổng calo tiêu hao
     * @param string $goal Mục tiêu ('maintain'|'duy_tri', 'lose_weight'|'giam_can', 'gain_weight'|'tang_can')
     * @param float|null $bmr Năng lượng BMR để chặn ngưỡng an toàn
     * @return float
     */
    public static function calculateTargetCalories(float $tdee, string $goal = 'maintain', ?float $bmr = null): float
    {
        $normalizedGoal = self::normalizeGoal($goal);
        $adjustments = config('services.nutrition.goal_adjustments', [
            'maintain' => 0,
            'lose_weight' => -500,
            'gain_weight' => 300,
        ]);

        $diff = $adjustments[$normalizedGoal] ?? 0;
        $target = $tdee + $diff;

        // An toàn chuyển hóa: Calo mục tiêu khi giảm cân không nên thấp hơn mức BMR
        if ($normalizedGoal === 'lose_weight' && $bmr && $bmr > 0) {
            $target = max($bmr, $target);
        }

        return round(max(800.0, $target), 2);
    }

    /**
     * 5. Phân bổ các chất dinh dưỡng đa lượng (Protein, Carb, Fat theo Gram/ngày)
     * - 1g Protein = 4 kcal
     * - 1g Fat = 9 kcal
     * - 1g Carb = 4 kcal
     *
     * @param float $targetCalories Calo mục tiêu
     * @param string $goal Mục tiêu ('maintain', 'lose_weight', 'gain_weight')
     * @return array [ 'protein' => float, 'carb' => float, 'fat' => float ]
     */
    public static function calculateMacros(float $targetCalories, string $goal = 'maintain'): array
    {
        $normalizedGoal = self::normalizeGoal($goal);
        $macroRatios = config("services.nutrition.macro_ratios.{$normalizedGoal}", [
            'protein' => 0.25,
            'fat' => 0.25,
            'carb' => 0.50,
        ]);

        $proteinCalories = $targetCalories * $macroRatios['protein'];
        $fatCalories = $targetCalories * $macroRatios['fat'];
        $carbCalories = max(0.0, $targetCalories - ($proteinCalories + $fatCalories));

        $proteinGrams = round($proteinCalories / 4.0, 2);
        $fatGrams = round($fatCalories / 9.0, 2);
        $carbGrams = round($carbCalories / 4.0, 2);

        return [
            'protein' => $proteinGrams,
            'carb' => $carbGrams,
            'fat' => $fatGrams,
        ];
    }

    /**
     * Tính toán tổng thể toàn bộ các chỉ số dinh dưỡng
     *
     * @param float $weightKg Cân nặng (kg)
     * @param float $heightCm Chiều cao (cm)
     * @param int $age Tuổi
     * @param string|int $gender Giới tính
     * @param float $activityMultiplier Hệ số vận động
     * @param string $goal Mục tiêu thể trạng
     * @return array
     */
    public static function calculateAll(
        float $weightKg,
        float $heightCm,
        int $age,
        $gender = 0,
        float $activityMultiplier = 1.375,
        string $goal = 'maintain'
    ): array {
        $bmi = self::calculateBMI($weightKg, $heightCm);
        $bmr = self::calculateBMR($weightKg, $heightCm, $age, $gender);
        $tdee = self::calculateTDEE($bmr, $activityMultiplier);
        $kcalMucTieu = self::calculateTargetCalories($tdee, $goal, $bmr);
        $macros = self::calculateMacros($kcalMucTieu, $goal);

        return [
            'can_nang' => round($weightKg, 2),
            'bmi' => $bmi,
            'bmr' => $bmr,
            'tdee' => $tdee,
            'kcal_muc_tieu' => $kcalMucTieu,
            'protein' => $macros['protein'],
            'carb' => $macros['carb'],
            'fat' => $macros['fat'],
        ];
    }

    /**
     * Tính toán và lưu trực tiếp bản ghi vào bảng lich_su_chi_so_dinh_duong
     *
     * @param int $userId ID người dùng
     * @param float $weightKg Cân nặng (kg)
     * @param float $heightCm Chiều cao (cm)
     * @param int $age Tuổi
     * @param string|int $gender Giới tính
     * @param float $activityMultiplier Hệ số vận động
     * @param string $goal Mục tiêu
     * @return LichSuChiSoDinhDuong
     */
    public static function recordNutritionAssessment(
        int $userId,
        float $weightKg,
        float $heightCm,
        int $age,
        $gender = 0,
        float $activityMultiplier = 1.375,
        string $goal = 'maintain'
    ): LichSuChiSoDinhDuong {
        $metrics = self::calculateAll($weightKg, $heightCm, $age, $gender, $activityMultiplier, $goal);

        return LichSuChiSoDinhDuong::create([
            'id_user' => $userId,
            'can_nang' => $metrics['can_nang'],
            'bmi' => $metrics['bmi'],
            'bmr' => $metrics['bmr'],
            'tdee' => $metrics['tdee'],
            'kcal_muc_tieu' => $metrics['kcal_muc_tieu'],
            'protein' => $metrics['protein'],
            'carb' => $metrics['carb'],
            'fat' => $metrics['fat'],
        ]);
    }

    /**
     * Chuẩn hóa tên mục tiêu
     */
    private static function normalizeGoal(string $goal): string
    {
        $g = strtolower(trim($goal));
        if (in_array($g, ['lose_weight', 'giam_can', 'giam_mo', 'cut', '2'], true)) {
            return 'lose_weight';
        }
        if (in_array($g, ['gain_weight', 'tang_can', 'tang_co', 'bulk', '1'], true)) {
            return 'gain_weight';
        }
        return 'maintain';
    }
}

