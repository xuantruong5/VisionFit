<?php

namespace App\Http\Controllers;

use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AssistantController extends Controller
{
    public function me(Request $request)
    {
        return response()->json(['data' => $request->attributes->get('assistant_identity')]);
    }

    public function context(Request $request)
    {
        $identity = $request->attributes->get('assistant_identity');
        $user = $request->attributes->get('assistant_user');
        $role = $identity['role'];
        $gym = $identity['gym_id'];
        $now = CarbonImmutable::now(config('app.timezone'));
        $data = [
            'subject' => $identity,
            'profile' => ['goal' => null, 'level' => null],
            'packages' => [], 'schedule' => [],
            'progress' => ['sessions_this_week' => null, 'completion_percent' => null],
            'summary' => null,
        ];

        if ($role !== 'member') {
            // Only aggregate assigned members; never return personal member records.
            $members = DB::table('clients')->where('id_phong_tap', $gym);
            if ($role === 'trainer') {
                $members->whereIn('id', DB::table('lich_tap')->select('id_hoi_vien')
                    ->where('id_trainner', $user->getKey())->where('tinh_trang', '!=', '3'));
            }
            $data['summary'] = [
                'assigned_members' => (clone $members)->count(),
                'expiring_members' => null,
            ];
            if ($role === 'admin') {
                $data['summary']['expiring_members'] = DB::table('clients as c')
                    ->join('dang_ky_goi as d', 'd.id_hoi_vien', '=', 'c.id')
                    ->join('chi_tiet_dang_ky_goi as ct', 'ct.id_dang_ky_goi', '=', 'd.id')
                    ->join('goi_tap as g', 'g.id_goi_tap', '=', 'ct.id_goi_tap')
                    ->where('c.id_phong_tap', $gym)->where('g.id_phong_tap', $gym)
                    ->where('d.tinh_trang', 1)->whereIn('ct.tinh_trang', [0, 1])
                    ->whereBetween('ct.ngay_ket_thuc', [$now->toDateString(), $now->addDays(7)->toDateString()])
                    ->distinct()->count('c.id');
            }
            return response()->json(['data' => $data]);
        }

        $data['profile'] = ['goal' => $user->muc_tieu_hien_tai, 'level' => $user->cap_do_hien_tai];
        $data['packages'] = DB::table('dang_ky_goi as d')
            ->join('chi_tiet_dang_ky_goi as ct', 'ct.id_dang_ky_goi', '=', 'd.id')
            ->join('goi_tap as g', 'g.id_goi_tap', '=', 'ct.id_goi_tap')
            ->where('d.id_hoi_vien', $user->getKey())->where('g.id_phong_tap', $gym)
            ->where('d.tinh_trang', 1)->whereIn('ct.tinh_trang', [0, 1])
            ->orderByDesc('ct.id')->limit(20)
            ->get(['g.ten_goi_tap', 'ct.ngay_ket_thuc', 'ct.so_buoi'])
            ->map(fn ($p) => [
                'name' => $p->ten_goi_tap, 'expires_at' => $p->ngay_ket_thuc,
                'total_sessions' => (int) $p->so_buoi,
                // Schema has purchased sessions, not an authoritative consumption ledger.
                'remaining_sessions' => null,
            ])->values();

        $data['schedule'] = DB::table('lich_tap as l')
            ->join('dang_ky_chuong_trinh as dk', function ($join) {
                $join->on('dk.id', '=', 'l.id_dang_ky_chuong_trinh')
                    ->on('dk.id_hoi_vien', '=', 'l.id_hoi_vien')
                    ->on('dk.id_chuong_trinh', '=', 'l.id_chuong_trinh');
            })
            ->join('chuong_trinh_tap as c', 'c.id', '=', 'l.id_chuong_trinh')
            ->leftJoin('trainers as t', function ($join) use ($gym) {
                $join->on('t.id', '=', 'l.id_trainner')->where('t.id_phong_tap', '=', $gym);
            })
            ->where('l.id_hoi_vien', $user->getKey())->where('dk.tinh_trang', 1)
            ->whereIn('l.tinh_trang', ['0', '1'])->whereDate('l.ngay_tap', '>=', $now->toDateString())
            ->where(function ($query) use ($now) {
                $query->whereDate('l.ngay_tap', '>', $now->toDateString())
                    ->orWhereNull('l.gio_bat_dau')->orWhere('l.gio_bat_dau', '>=', $now->format('H:i:s'));
            })
            ->orderBy('l.ngay_tap')->orderBy('l.gio_bat_dau')->limit(20)
            ->get(['c.ten_chuong_trinh', 'l.ngay_tap', 'l.gio_bat_dau', 't.ho_ten'])
            ->map(fn ($s) => [
                'name' => $s->ten_chuong_trinh,
                'scheduled_date' => $s->ngay_tap,
                'starts_at' => $s->gio_bat_dau
                    ? CarbonImmutable::parse($s->ngay_tap.' '.$s->gio_bat_dau, config('app.timezone'))->toIso8601String()
                    : null,
                'trainer' => $s->ho_ten,
            ])->values();

        $week = DB::table('buoi_tap')->where('id_hoi_vien', $user->getKey())
            ->whereIn('tinh_trang', ['2', '3'])
            ->whereBetween('thoi_gian_bat_dau', [$now->startOfWeek()->toDateTimeString(), $now->toDateTimeString()]);
        $average = (clone $week)->avg('phan_tram_hoan_thanh');
        $data['progress'] = [
            'sessions_this_week' => (clone $week)->count(),
            'completion_percent' => $average === null ? null : round((float) $average, 2),
        ];

        return response()->json(['data' => $data]);
    }
}
