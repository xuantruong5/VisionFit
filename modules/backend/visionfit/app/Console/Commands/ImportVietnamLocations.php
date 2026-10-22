<?php

namespace App\Console\Commands;

use App\Models\Province;
use App\Models\Ward;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;

class ImportVietnamLocations extends Command
{
    protected $signature = 'location:import';

    protected $description = 'Import provinces and wards from Vietnam administrative API';

    public function handle()
    {
        $this->info('Đang lấy dữ liệu Việt Nam...');

        $response = Http::get(
            'https://provinces.open-api.vn/api/v2/',
            [
                'depth' => 2
            ]
        );

        if (!$response->successful()) {
            $this->error('Không thể lấy dữ liệu API.');

            return Command::FAILURE;
        }

        $provinces = $response->json();

        foreach ($provinces as $provinceData) {

            $province = Province::updateOrCreate(
                [
                    'code' => $provinceData['code']
                ],
                [
                    'name' => $provinceData['name'],
                    'codename' => $provinceData['codename'] ?? null,
                    'division_type' => $provinceData['division_type'] ?? null,
                ]
            );

            

            foreach ($provinceData['wards'] ?? [] as $wardData) {

                Ward::updateOrCreate(
                    [
                        'code' => $wardData['code']
                    ],
                    [
                        'id_province' => $province->id,
                        'name' => $wardData['name'],
                        'codename' => $wardData['codename'] ?? null,
                        'division_type' => $wardData['division_type'] ?? null,
                    ]
                );
            }
        }

        $this->info('Import dữ liệu thành công!');

        return Command::SUCCESS;
    }
}