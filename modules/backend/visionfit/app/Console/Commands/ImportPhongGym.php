<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ImportPhongGym extends Command
{
    protected $signature = 'gym:import';

    protected $description = 'Import phòng gym Việt Nam từ OpenStreetMap';

    public function handle(): int
    {
        $file = 'E:/gym-data/phong-gym.geojson';

        if (!file_exists($file)) {
            $this->error('Không tìm thấy file: ' . $file);
            return self::FAILURE;
        }

        $data = json_decode(
            file_get_contents($file),
            true
        );

        if (
            json_last_error() !== JSON_ERROR_NONE ||
            !isset($data['features'])
        ) {
            $this->error(
                'GeoJSON không hợp lệ: ' . json_last_error_msg()
            );

            return self::FAILURE;
        }

        $features = $data['features'];

        $this->info(
            'Tìm thấy ' . count($features) . ' đối tượng OSM.'
        );

        $imported = 0;
        $skipped = 0;

        foreach ($features as $feature) {

            $properties = $feature['properties'] ?? [];
            $geometry = $feature['geometry'] ?? [];

            /*
             * Chỉ lấy phòng gym thực sự.
             * Bỏ fitness_station.
             */
            if (
                ($properties['leisure'] ?? null)
                !== 'fitness_centre'
            ) {
                $skipped++;
                continue;
            }

            /*
             * Chỉ lấy địa điểm có tên.
             */
            $name = trim(
                (string) ($properties['name'] ?? '')
            );

            if ($name === '') {
                $skipped++;
                continue;
            }

            /*
             * Lấy tọa độ.
             */
            [$longitude, $latitude] =
                $this->getCoordinates($geometry);

            if (
                $latitude === null ||
                $longitude === null
            ) {
                $skipped++;
                continue;
            }

            /*
             * GeoJSON hiện tại không chứa OSM ID.
             *
             * Tạo ID ổn định từ:
             * tên + latitude + longitude.
             */
            $osmId = hash(
                'sha256',
                mb_strtolower($name, 'UTF-8')
                . '|'
                . number_format($latitude, 7, '.', '')
                . '|'
                . number_format($longitude, 7, '.', '')
            );

            /*
             * Tạo địa chỉ.
             */
            $address = implode(', ', array_filter([
                $properties['addr:housenumber'] ?? null,
                $properties['addr:street'] ?? null,
                $properties['addr:subdistrict'] ?? null,
                $properties['addr:district'] ?? null,
                $properties['addr:city'] ?? null,
                $properties['addr:province'] ?? null,
            ]));

            DB::table('phong_gyms')->updateOrInsert(
                [
                    'osm_type' => 'generated',
                    'osm_id' => $osmId,
                ],
                [
                    'ten_phong_gym' => $name,

                    'dia_chi' =>
                        $address !== ''
                            ? $address
                            : null,

                    'vi_do' => $latitude,

                    'kinh_do' => $longitude,

                    'so_dien_thoai' =>
                        $properties['phone']
                        ?? $properties['contact:phone']
                        ?? null,

                    'website' =>
                        $properties['website']
                        ?? $properties['contact:website']
                        ?? null,

                    'nguon_du_lieu' => 'OpenStreetMap',

                    'updated_at' => now(),

                    /*
                     * updateOrInsert không tự quản lý timestamps.
                     */
                    'created_at' => now(),
                ]
            );

            $imported++;

            $this->line(
                "[{$imported}] {$name}"
                . " ({$latitude}, {$longitude})"
            );
        }

        $this->newLine();

        $this->info('========== KẾT QUẢ ==========');
        $this->info('Đã import: ' . $imported);
        $this->info('Đã bỏ qua: ' . $skipped);
        $this->info('Tổng OSM: ' . count($features));

        return self::SUCCESS;
    }

    /**
     * Lấy vị trí đại diện của geometry.
     *
     * GeoJSON:
     * [longitude, latitude]
     */
    private function getCoordinates(array $geometry): array
    {
        $type = $geometry['type'] ?? null;
        $coordinates = $geometry['coordinates'] ?? null;

        if (!is_array($coordinates)) {
            return [null, null];
        }

        /*
         * Point
         */
        if ($type === 'Point') {

            if (
                isset($coordinates[0], $coordinates[1]) &&
                is_numeric($coordinates[0]) &&
                is_numeric($coordinates[1])
            ) {
                return [
                    (float) $coordinates[0],
                    (float) $coordinates[1],
                ];
            }

            return [null, null];
        }

        /*
         * Polygon / MultiPolygon...
         *
         * Thu thập các điểm rồi lấy vị trí trung bình.
         */
        $points = [];

        $this->collectPoints(
            $coordinates,
            $points
        );

        if (empty($points)) {
            return [null, null];
        }

        $longitude = 0;
        $latitude = 0;

        foreach ($points as $point) {
            $longitude += $point[0];
            $latitude += $point[1];
        }

        $count = count($points);

        return [
            $longitude / $count,
            $latitude / $count,
        ];
    }

    private function collectPoints(
        array $coordinates,
        array &$points
    ): void {

        if (
            count($coordinates) >= 2 &&
            is_numeric($coordinates[0] ?? null) &&
            is_numeric($coordinates[1] ?? null)
        ) {
            $points[] = [
                (float) $coordinates[0],
                (float) $coordinates[1],
            ];

            return;
        }

        foreach ($coordinates as $item) {

            if (is_array($item)) {
                $this->collectPoints(
                    $item,
                    $points
                );
            }
        }
    }
}