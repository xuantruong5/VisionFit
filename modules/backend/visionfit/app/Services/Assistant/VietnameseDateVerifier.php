<?php

namespace App\Services\Assistant;

use Carbon\CarbonImmutable;

/**
 * Authoritative Vietnamese weekday formatter and final-answer consistency verifier
 * anchored strictly to Asia/Ho_Chi_Minh.
 */
class VietnameseDateVerifier
{
    public const TIMEZONE = 'Asia/Ho_Chi_Minh';

    private const WEEKDAY_NAMES = [
        1 => 'Thứ Hai',
        2 => 'Thứ Ba',
        3 => 'Thứ Tư',
        4 => 'Thứ Năm',
        5 => 'Thứ Sáu',
        6 => 'Thứ Bảy',
        7 => 'Chủ Nhật',
    ];

    private const CLAIM_TO_ISO = [
        'thứ hai' => 1, 'thứ 2' => 1, 'thu hai' => 1, 'thu 2' => 1,
        'thứ ba' => 2, 'thứ 3' => 2, 'thu ba' => 2, 'thu 3' => 2,
        'thứ tư' => 3, 'thứ 4' => 3, 'thu tu' => 3, 'thu 4' => 3,
        'thứ năm' => 4, 'thứ 5' => 4, 'thu nam' => 4, 'thu 5' => 4,
        'thứ sáu' => 5, 'thứ 6' => 5, 'thu sau' => 5, 'thu 6' => 5,
        'thứ bảy' => 6, 'thứ 7' => 6, 'thu bay' => 6, 'thu 7' => 6,
        'chủ nhật' => 7, 'chu nhat' => 7,
    ];

    public static function weekdayVn(CarbonImmutable $dt): string
    {
        $vn = $dt->setTimezone(self::TIMEZONE);
        return self::WEEKDAY_NAMES[$vn->dayOfWeekIso] ?? '';
    }

    public static function formatDateWithWeekday(CarbonImmutable $dt): string
    {
        $vn = $dt->setTimezone(self::TIMEZONE);
        return self::weekdayVn($vn) . ', ' . $vn->format('d/m/Y');
    }

    /**
     * Detect any Vietnamese weekday + dd/mm/yyyy pair in text whose weekday disagrees
     * with the true Asia/Ho_Chi_Minh calendar day (e.g., "Thứ Sáu, 28/11/2026" -> expected "Thứ Bảy").
     *
     * @return array<int, array{matched: string, claimed_weekday: string, expected_weekday: string, date: string}>
     */
    public static function findWeekdayMismatches(string $text): array
    {
        $pattern = '/(?P<wd>(?:Thứ|Thu)\s+(?:Hai|Ba|Tư|Tu|Năm|Nam|Sáu|Sau|Bảy|Bay|[2-7])|Chủ\s+Nhật|Chu\s+Nhat)(?P<sep>(?:\s*[,:\-–—]\s*|\s+ngày\s+|\s*\(\s*|\s+))(?P<date>\d{1,2}\/\d{1,2}\/\d{4})/iu';
        if (!preg_match_all($pattern, $text, $matches, PREG_SET_ORDER)) {
            return [];
        }

        $mismatches = [];
        foreach ($matches as $m) {
            $claimedRaw = $m['wd'];
            $dateStr = $m['date'];
            $parsed = self::parseDdMmYyyy($dateStr);
            if ($parsed === null) {
                continue;
            }
            $normClaim = preg_replace('/\s+/u', ' ', mb_strtolower(trim($claimedRaw), 'UTF-8'));
            $claimedIso = self::CLAIM_TO_ISO[$normClaim] ?? null;
            if ($claimedIso === null) {
                continue;
            }
            if ($claimedIso !== $parsed->dayOfWeekIso) {
                $mismatches[] = [
                    'matched' => $m[0],
                    'claimed_weekday' => $claimedRaw,
                    'expected_weekday' => self::weekdayVn($parsed),
                    'date' => $parsed->format('d/m/Y'),
                ];
            }
        }

        return $mismatches;
    }

    /**
     * Verify final answer text and repair any mismatched Vietnamese weekday labels
     * using the authoritative Asia/Ho_Chi_Minh calendar.
     *
     * @return array{text: string, mismatches: array<int, array{matched: string, claimed_weekday: string, expected_weekday: string, date: string}>}
     */
    public static function repairMismatchedWeekdays(string $text): array
    {
        $pattern = '/(?P<wd>(?:Thứ|Thu)\s+(?:Hai|Ba|Tư|Tu|Năm|Nam|Sáu|Sau|Bảy|Bay|[2-7])|Chủ\s+Nhật|Chu\s+Nhat)(?P<sep>(?:\s*[,:\-–—]\s*|\s+ngày\s+|\s*\(\s*|\s+))(?P<date>\d{1,2}\/\d{1,2}\/\d{4})/iu';
        $mismatches = [];

        $repaired = preg_replace_callback($pattern, function (array $m) use (&$mismatches): string {
            $claimedRaw = $m['wd'];
            $dateStr = $m['date'];
            $parsed = self::parseDdMmYyyy($dateStr);
            if ($parsed === null) {
                return $m[0];
            }
            $normClaim = preg_replace('/\s+/u', ' ', mb_strtolower(trim($claimedRaw), 'UTF-8'));
            $claimedIso = self::CLAIM_TO_ISO[$normClaim] ?? null;
            if ($claimedIso === null || $claimedIso === $parsed->dayOfWeekIso) {
                return $m[0];
            }

            $expected = self::weekdayVn($parsed);
            $mismatches[] = [
                'matched' => $m[0],
                'claimed_weekday' => $claimedRaw,
                'expected_weekday' => $expected,
                'date' => $parsed->format('d/m/Y'),
            ];

            return $expected . $m['sep'] . $dateStr;
        }, $text);

        return [
            'text' => is_string($repaired) ? $repaired : $text,
            'mismatches' => $mismatches,
        ];
    }

    /**
     * Detect verified schedule dates (dd/mm/yyyy) that appear in text without a Vietnamese weekday label.
     * Distinct from `findWeekdayMismatches()` (wrong weekday vs omitted weekday label).
     *
     * @param array<string, string> $knownDateToWeekday Map of 'dd/mm/yyyy' => 'Thứ Hai'..'Chủ Nhật'
     * @return array<int, array{date: string, expected_weekday: string}>
     */
    public static function findDatesMissingWeekday(string $text, array $knownDateToWeekday): array
    {
        if (empty($knownDateToWeekday)) {
            return [];
        }

        $missing = [];
        foreach ($knownDateToWeekday as $dateVn => $expectedWeekday) {
            if (!str_contains($text, $dateVn)) {
                continue;
            }
            $escapedDate = preg_quote($dateVn, '/');
            $withWeekdayPattern = '/(?:(?:Thứ|Thu)\s+(?:Hai|Ba|Tư|Tu|Năm|Nam|Sáu|Sau|Bảy|Bay|[2-7])|Chủ\s+Nhật|Chu\s+Nhat)\s*(?:[,:\-–—]\s*|ngày\s+|\(\s*|\s+)' . $escapedDate . '/iu';
            $countAll = preg_match_all('/(?<!\d)' . $escapedDate . '(?!\d)/u', $text);
            $countWithWd = preg_match_all($withWeekdayPattern, $text);
            if ($countAll > $countWithWd) {
                $missing[] = [
                    'date' => $dateVn,
                    'expected_weekday' => $expectedWeekday,
                ];
            }
        }

        return $missing;
    }

    /**
     * Enrich verified backend schedule dates (dd/mm/yyyy) in prose and Markdown tables
     * with their authoritative backend `weekday_vn` when the LLM omitted the weekday label
     * (e.g., `| 23:55 30/11/2026 |` -> `| 23:55 Thứ Hai, 30/11/2026 |`).
     *
     * @param array<string, string> $knownDateToWeekday Map of 'dd/mm/yyyy' => 'Thứ Hai'..'Chủ Nhật'
     * @return array{text: string, enriched: array<int, array{date: string, weekday: string}>}
     */
    public static function ensureVerifiedWeekdaysPresent(string $text, array $knownDateToWeekday): array
    {
        if (empty($knownDateToWeekday)) {
            return ['text' => $text, 'enriched' => []];
        }

        $enriched = [];
        $updated = $text;

        foreach ($knownDateToWeekday as $dateVn => $weekdayVn) {
            if ($weekdayVn === '' || !str_contains($updated, $dateVn)) {
                continue;
            }
            $escapedDate = preg_quote($dateVn, '/');
            // Khớp mọi vị trí dd/mm/yyyy (có hoặc không có "ngày " ngay trước), bỏ qua nếu ngay trước đã có nhãn Thứ/Chủ Nhật
            $pattern = '/(?<!\d)(?P<prefix>(?:(?:Thứ|Thu)\s+(?:Hai|Ba|Tư|Tu|Năm|Nam|Sáu|Sau|Bảy|Bay|[2-7])|Chủ\s+Nhật|Chu\s+Nhat)(?:\s*[,:\-–—]\s*|\s+ngày\s+|\s*\(\s*|\s+))?' . $escapedDate . '(?!\d)/iu';
            $changed = false;
            $res = preg_replace_callback($pattern, function (array $m) use ($dateVn, $weekdayVn, &$changed): string {
                if (!empty($m['prefix'])) {
                    return $m[0];
                }
                $changed = true;
                return $weekdayVn . ', ' . $dateVn;
            }, $updated);

            if ($changed && is_string($res)) {
                $updated = $res;
                $enriched[] = ['date' => $dateVn, 'weekday' => $weekdayVn];
            }
        }

        return [
            'text' => $updated,
            'enriched' => $enriched,
        ];
    }

    private static function parseDdMmYyyy(string $dateStr): ?CarbonImmutable
    {
        $parts = explode('/', $dateStr);
        if (count($parts) !== 3) {
            return null;
        }
        $d = (int) $parts[0];
        $m = (int) $parts[1];
        $y = (int) $parts[2];
        if (!checkdate($m, $d, $y)) {
            return null;
        }

        return CarbonImmutable::create($y, $m, $d, 12, 0, 0, self::TIMEZONE);
    }
}

