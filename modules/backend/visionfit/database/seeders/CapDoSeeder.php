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
                'hinh_anh' => 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=1470&auto=format&fit=crop',
            ],
            [
                'ten_cap_do' => 'Người bắt đầu',
                'mo_ta' => 'Khối lượng tập vừa phải, giúp củng cố kỹ thuật, sức bền và nền tảng sức mạnh.',
                'hinh_anh' => 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=1470&auto=format&fit=crop',
            ],
            [
                'ten_cap_do' => 'Nâng cao',
                'mo_ta' => 'Khối lượng và cường độ cao hơn, phù hợp với người đã duy trì tập luyện ổn định và muốn tạo tiến bộ rõ rệt.',
                'hinh_anh' => 'https://images.unsplash.com/photo-1507398941214-572c25f4b1dc?q=80&w=1373&auto=format&fit=crop',
            ],
            [
                'ten_cap_do' => 'Chuyên gia',
                'mo_ta' => 'Mật độ tập cao, chú trọng hiệu suất, khả năng kiểm soát kỹ thuật và phục hồi giữa các buổi.',
                'hinh_anh' => 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1470&auto=format&fit=crop',
            ],
            [
                'ten_cap_do' => 'Pro',
                'mo_ta' => 'Tập trung vào chất lượng, cường độ và hiệu suất, phù hợp với người có kinh nghiệm cao và kỹ thuật vững.',
                'hinh_anh' => 'https://images.unsplash.com/photo-1601422407692-ec4eeec1d9b3?fm=jpg&q=80&w=1470&auto=format&fit=crop',
            ],
        ]);
    }
}
