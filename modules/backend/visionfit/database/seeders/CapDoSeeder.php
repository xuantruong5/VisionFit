<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CapDoSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('cap_do')->truncate();

        DB::table('cap_do')->insert([
            [
                'ten_cap_do' => 'Chưa có kinh nghiệm',
                'mo_ta' => 'Cường độ nhẹ, ưu tiên làm quen kỹ thuật, kiểm soát tư thế và xây dựng thói quen tập luyện an toàn.',
            ],
            [
                'ten_cap_do' => 'Người bắt đầu',
                'mo_ta' => 'Khối lượng tập vừa phải, giúp củng cố kỹ thuật, sức bền và nền tảng sức mạnh.',
            ],
            [
                'ten_cap_do' => 'Nâng cao',
                'mo_ta' => 'Khối lượng và cường độ cao hơn, phù hợp với người đã duy trì tập luyện ổn định và muốn tạo tiến bộ rõ rệt.',
            ],
            [
                'ten_cap_do' => 'Chuyên gia',
                'mo_ta' => 'Mật độ tập cao, chú trọng hiệu suất, khả năng kiểm soát kỹ thuật và phục hồi giữa các buổi.',
            ],
            [
                'ten_cap_do' => 'Pro',
                'mo_ta' => 'Tập trung vào chất lượng, cường độ và hiệu suất, phù hợp với người có kinh nghiệm cao và kỹ thuật vững.',
            ],
        ]);
    }
}
