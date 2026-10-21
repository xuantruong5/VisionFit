<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use RuntimeException;
use Throwable;

class AssignGymWards extends Command
{
    protected $signature = 'app:assign-gym-wards
                            {--apply : Cap nhat id_ward vao database}';

    protected $description =
        'Xac dinh xa/phuong cua phong gym tu toa do va ranh gioi JSON';

    private int $checked = 0;
    private int $matched = 0;
    private int $unmatched = 0;
    private int $ambiguous = 0;
    private int $updated = 0;

    public function handle(): int
    {
        $directory = app_path('geo/wards');
        $apply = (bool) $this->option('apply');

        if (!File::isDirectory($directory)) {
            $this->error("Khong tim thay thu muc: {$directory}");
            return self::FAILURE;
        }

        $this->info('Dang doc du lieu ranh gioi xa/phuong...');

        try {
            $boundaries = $this->loadBoundaries($directory);

            if (empty($boundaries)) {
                $this->error('Khong doc duoc du lieu ranh gioi.');
                return self::FAILURE;
            }

            $this->info('So xa/phuong doc duoc: ' . count($boundaries));

            // Chỉ ghép theo mã xã/phường và mã tỉnh.
            // Không ghép chỉ bằng tên vì có thể trùng tên.
            $wardLookup = $this->buildWardLookup();

            $gyms = DB::table('phong_gyms')
                ->select('id', 'id_ward', 'vi_do', 'kinh_do')
                ->whereNotNull('vi_do')
                ->whereNotNull('kinh_do')
                ->get();

            $this->info('So phong gym co toa do: ' . $gyms->count());

            foreach ($gyms as $gym) {
                $this->checked++;

                $lat = (float) $gym->vi_do;
                $lon = (float) $gym->kinh_do;

                if (
                    $lat < -90 || $lat > 90 ||
                    $lon < -180 || $lon > 180
                ) {
                    $this->unmatched++;
                    $this->warn("Gym #{$gym->id}: toa do khong hop le.");
                    continue;
                }

                $candidates = [];

                foreach ($boundaries as $boundary) {
                    if (
                        $lat < $boundary['min_lat'] ||
                        $lat > $boundary['max_lat'] ||
                        $lon < $boundary['min_lon'] ||
                        $lon > $boundary['max_lon']
                    ) {
                        continue;
                    }

                    if ($this->pointInBoundary($lon, $lat, $boundary['polygons'])) {
                        $candidates[] = $boundary;
                    }
                }

                
                
                if (count($candidates) !== 1) {
                    if (count($candidates) > 1) {
                        $this->ambiguous++;

                        $this->warn(
                            "Gym #{$gym->id}: nam trong nhieu ranh gioi."
                            . " | Kinh do: {$gym->kinh_do}"
                            . " | Vi do: {$gym->vi_do}"
                        );
                    } else {
                        $this->unmatched++;

                        $this->warn(
                            "Gym #{$gym->id}: khong tim thay xa/phuong."
                            . " | Kinh do: {$gym->kinh_do}"
                            . " | Vi do: {$gym->vi_do}"
                        );
                    }

                    continue;
                }



                $boundary = $candidates[0];
                $provinceCode = $this->normalizeCode($boundary['province_id']);
                $wardCode = $this->normalizeCode($boundary['ward_id']);

                $lookupKey = $provinceCode . ':' . $wardCode;
                $ward = $wardLookup[$lookupKey] ?? null;

                
                if (!$ward) {
                    $this->unmatched++;

                    $this->warn(
                        "Gym #{$gym->id}: khong doi chieu duoc ma tinh/xa "
                        . "({$provinceCode}/{$wardCode}) voi database."
                        . " | Kinh do: {$gym->kinh_do}"
                        . " | Vi do: {$gym->vi_do}"
                    );

                    continue;
                }


                $this->matched++;

                $this->line(
                    "Gym #{$gym->id} -> {$ward->name} "
                    . "(ward ID: {$ward->id})"
                );

                if ($apply && (int) $gym->id_ward !== (int) $ward->id) {
                    DB::table('phong_gyms')
                        ->where('id', $gym->id)
                        ->update([
                            'id_ward' => $ward->id,
                            'updated_at' => now(),
                        ]);

                    $this->updated++;
                }
            }

            $this->newLine();
            $this->line('--- KIEM TRA SO LIEU ---');
            $this->line("Tong da kiem tra: {$this->checked}");
            $this->line("Da doi chieu: {$this->matched}");
            $this->line("Chua doi chieu: {$this->unmatched}");
            $this->line("Nam trong nhieu ranh gioi: {$this->ambiguous}");
            $this->info('========== KET QUA ==========');
            $this->line("Da kiem tra: {$this->checked}");
            $this->line("Tim thay va doi chieu duoc: {$this->matched}");
            $this->line("Khong xac dinh/khong doi chieu: {$this->unmatched}");
            $this->line("Nam trong nhieu ranh gioi: {$this->ambiguous}");

            if ($apply) {
                $this->info("So ban ghi da cap nhat: {$this->updated}");
            } else {
                $this->warn('Day la che do kiem tra, database chua bi thay doi.');
                $this->line(
                    'Neu ket qua dung, chay lai voi tuy chon --apply de cap nhat.'
                );
            }

            return self::SUCCESS;
        } catch (Throwable $e) {
            $this->error($e->getMessage());
            report($e);

            return self::FAILURE;
        }
    }

    /**
     * Doc cac file ma-tinh.json va lay cac da giac xa/phuong.
     */
    private function loadBoundaries(string $directory): array
    {
        $boundaries = [];

        foreach (File::files($directory) as $file) {
            if (!preg_match('/^\d+\.json$/', $file->getFilename())) {
                continue;
            }

            $data = json_decode(
                File::get($file->getPathname()),
                true,
                512,
                JSON_THROW_ON_ERROR
            );

            if (!is_array($data) || empty($data['wards'])) {
                $this->warn('File khong dung cau truc: ' . $file->getFilename());
                continue;
            }

            $provinceId = $data['provinceId'] ?? null;

            if ($provinceId === null) {
                $this->warn('Thieu provinceId trong ' . $file->getFilename());
                continue;
            }

            foreach ($data['wards'] as $ward) {
                if (
                    !isset($ward['id']) ||
                    !isset($ward['polygons']) ||
                    !is_array($ward['polygons'])
                ) {
                    continue;
                }

                $rings = $this->extractRings($ward['polygons']);

                if (empty($rings)) {
                    continue;
                }

                $allLons = [];
                $allLats = [];

                foreach ($rings as $ring) {
                    foreach ($ring as $point) {
                        $allLons[] = $point[0];
                        $allLats[] = $point[1];
                    }
                }

                if (empty($allLons)) {
                    continue;
                }

                $boundaries[] = [
                    'province_id' => (string) $provinceId,
                    'ward_id' => (string) $ward['id'],
                    'name' => $ward['name'] ?? '',
                    'polygons' => $rings,
                    'min_lon' => min($allLons),
                    'max_lon' => max($allLons),
                    'min_lat' => min($allLats),
                    'max_lat' => max($allLats),
                ];
            }
        }

        return $boundaries;
    }

    /**
     * Chuyen cau truc da giac thanh danh sach cac vong toa do.
     * Moi vong co dang [[longitude, latitude], ...].
     */
    
    private function extractRings(array $data): array
    {
        $rings = [];

        $walk = function (array $node) use (&$walk, &$rings): void {
            // Một vòng tọa độ có dạng:
            // [[longitude, latitude], [longitude, latitude], ...]
            if (
                count($node) >= 4 &&
                isset($node[0], $node[1]) &&
                is_array($node[0]) &&
                isset($node[0][0], $node[0][1]) &&
                is_numeric($node[0][0]) &&
                is_numeric($node[0][1])
            ) {
                $ring = [];

                foreach ($node as $point) {
                    if (
                        is_array($point) &&
                        isset($point[0], $point[1]) &&
                        is_numeric($point[0]) &&
                        is_numeric($point[1])
                    ) {
                        $ring[] = [
                            (float) $point[0],
                            (float) $point[1],
                        ];
                    }
                }

                if (count($ring) >= 4) {
                    $rings[] = $ring;
                }

                return;
            }

            foreach ($node as $child) {
                if (is_array($child)) {
                    $walk($child);
                }
            }
        };

        $walk($data);

        return $rings;
    }


    /**
     * Lay danh sach ward va ghep theo ma tinh + ma xa/phuong.
     */
    private function buildWardLookup(): array
    {
        $provinces = DB::table('provinces')
            ->select('id', 'code')
            ->get()
            ->keyBy(fn ($p) => (int) $p->id);

        $lookup = [];

        $wards = DB::table('wards')
            ->select('id', 'code', 'name', 'id_province')
            ->get();

        foreach ($wards as $ward) {
            $province = $provinces->get((int) $ward->id_province);

            if (!$province) {
                continue;
            }

            $key = $this->normalizeCode($province->code)
                . ':'
                . $this->normalizeCode($ward->code);

            // Neu trung khoa thi khong tu y chon mot xa/phuong.
            if (isset($lookup[$key])) {
                $lookup[$key] = null;
                continue;
            }

            $lookup[$key] = $ward;
        }

        return $lookup;
    }

    private function normalizeCode(string|int $code): string
    {
        return ltrim(trim((string) $code), '0') ?: '0';
    }

    /**
     * Kiem tra diem co nam trong it nhat mot vong da giac khong.
     */
    private function pointInBoundary(
        float $lon,
        float $lat,
        array $rings
    ): bool {
        foreach ($rings as $ring) {
            if ($this->pointInRing($lon, $lat, $ring)) {
                return true;
            }
        }

        return false;
    }

    private function pointInRing(
        float $x,
        float $y,
        array $ring
    ): bool {
        $inside = false;
        $count = count($ring);

        for ($i = 0, $j = $count - 1; $i < $count; $j = $i++) {
            [$xi, $yi] = $ring[$i];
            [$xj, $yj] = $ring[$j];

            // Diem nam tren canh da giac.
            if ($this->pointOnSegment($x, $y, $xi, $yi, $xj, $yj)) {
                return true;
            }

            $crosses = (($yi > $y) !== ($yj > $y))
                && ($x < ($xj - $xi) * ($y - $yi) / ($yj - $yi) + $xi);

            if ($crosses) {
                $inside = !$inside;
            }
        }

        return $inside;
    }

    private function pointOnSegment(
        float $x,
        float $y,
        float $x1,
        float $y1,
        float $x2,
        float $y2
    ): bool {
        $cross = ($x - $x1) * ($y2 - $y1)
            - ($y - $y1) * ($x2 - $x1);

        if (abs($cross) > 1e-9) {
            return false;
        }

        return $x >= min($x1, $x2) - 1e-9
            && $x <= max($x1, $x2) + 1e-9
            && $y >= min($y1, $y2) - 1e-9
            && $y <= max($y1, $y2) + 1e-9;
    }
}

