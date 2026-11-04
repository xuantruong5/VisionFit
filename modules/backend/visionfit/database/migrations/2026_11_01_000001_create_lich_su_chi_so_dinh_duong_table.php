<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Bảng 2: lich_su_chi_so_dinh_duong
     * Lưu kết quả tính toán tại mỗi lần đánh giá hoặc cập nhật hồ sơ.
     */
    public function up(): void
    {
        Schema::create('lich_su_chi_so_dinh_duong', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('id_user')->index()->comment('ID người dùng / hội viên');
            $table->decimal('can_nang', 5, 2)->comment('Cân nặng tại thời điểm tính (kg)');
            $table->decimal('bmi', 5, 2)->comment('Chỉ số BMI');
            $table->decimal('bmr', 7, 2)->comment('Năng lượng nghỉ ước tính (kcal)');
            $table->decimal('tdee', 7, 2)->comment('Năng lượng tiêu hao hằng ngày ước tính (kcal)');
            $table->decimal('kcal_muc_tieu', 7, 2)->comment('Mức năng lượng mục tiêu (kcal)');
            $table->decimal('protein', 6, 2)->comment('Lượng Protein (Gram/ngày)');
            $table->decimal('carb', 6, 2)->comment('Lượng Carb (Gram/ngày)');
            $table->decimal('fat', 6, 2)->comment('Lượng Fat (Gram/ngày)');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('lich_su_chi_so_dinh_duong');
    }
};

