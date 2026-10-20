<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class NoiTapSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('noi_tap')->truncate();

        DB::table('noi_tap')->insert([
            [
                'ten_noi_tap' => 'Ở nhà',
                'mo_ta' => 'Tập luyện tại nhà',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'ten_noi_tap' => 'Phòng tập',
                'mo_ta' => 'Tập luyện tại phòng gym',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
