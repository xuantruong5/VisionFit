<?php


namespace App\Console\Commands;
use App\Models\DangKyGoi;
use App\Models\ChiTietDangKyGoi;
use App\Models\GoiTap;
use App\Models\Client;
use App\Models\GioiThieu;
use GuzzleHttp\Client as HttpClient;
use App\Jobs\SendMailJob;
use Carbon\Carbon;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
class ThanhToanTuDongCommand extends Command
{
    protected $signature = 'start:mb';
    protected $description = 'Tự động đồng bộ giao dịch MB Bank';
    public function handle()
    {
        while (true) {
            try {
                $this->info('Kiểm tra giao dịch MB Bank: ' . now());
                // 1. Lấy tất cả đơn chưa thanh toán
                $listDangKy = DangKyGoi::where('is_thanh_toan', 0)->get();

                // Không có đơn chờ thanh toán thì không cần gọi MB
                if ($listDangKy->isEmpty()) {
                    sleep(5);
                    continue;
                }

                // 2. Lấy ngày tạo đơn cũ nhất để không bỏ sót giao dịch
                $ngayBatDau = Carbon::parse( $listDangKy->min('created_at'))->format('d/m/Y');

                // 3. Gọi MB Bank một lần cho tất cả đơn
                $client = new HttpClient();
                $res = $client->request( 'POST', 'https://api-mb.onrender.com/api/transactions',
                    [
                        'json' => [
                            'USERNAME' => env('MB_USERNAME'),
                            'PASSWORD' => env('MB_PASSWORD'),
                            'DAY_BEGIN' => $ngayBatDau,
                            'DAY_END' => Carbon::now()->format('d/m/Y'),
                            'NUMBER_MB' => env('MB_NUMBER'),
                        ],
                        'timeout' => 30,
                    ]
                );

                $data = json_decode( $res->getBody()->getContents(),  true );
                $listHistory = $data['data']['transactionHistoryList'] ?? [];
                // 4. Đối chiếu từng đơn đăng ký
                foreach ($listDangKy as $dangKy) {
                    $maDon = 'VF' . $dangKy->id;
                    $tongTien = round((float) $dangKy->tong_tien, 2);
                    foreach ($listHistory as $transaction) {
                        $description = strtoupper( trim($transaction['description'] ?? ''));

                        // Phải khớp chính xác mã đơn
                        if (!preg_match( '/(?<![A-Z0-9])' . preg_quote($maDon, '/') . '(?![A-Z0-9])/', $description)) 
                        {
                            continue;
                        }

                        // Kiểm tra số tiền nhận được
                        $creditAmount = round( (float) ($transaction['creditAmount'] ?? 0), 2);

                        if ( $creditAmount <= 0 || $creditAmount != $tongTien ) 
                        {
                            continue;
                        }

                        // 5. Lấy chi tiết đăng ký
                        $chiTiet = ChiTietDangKyGoi::where('id_dang_ky_goi', $dangKy->id )->first();

                        if (!$chiTiet) {
                            continue;
                        }
                        $goiTap = GoiTap::find($chiTiet->id_goi_tap);

                        if (!$goiTap) {
                            continue;
                        }

                        // 6. Chỉ cập nhật nếu đơn vẫn chưa thanh toán
                        $updated = DangKyGoi::where('id', $dangKy->id)
                            ->where('is_thanh_toan', 0)
                            ->update([ 'phuong_thuc_thanh_toan' => 'MB Bank', 'is_thanh_toan' => 1, 'tinh_trang' => 1, ]);

                        if (!$updated) {
                            break;
                        }

                        // 7. Cập nhật thời hạn gói
                        $ngayBatDauGoi = Carbon::now();
                        $ngayKetThuc = $ngayBatDauGoi->copy() ->addDays($goiTap->thoi_han_ngay);

                        $chiTiet->update([
                            'ngay_bat_dau' => $ngayBatDauGoi->toDateString(),
                            'ngay_ket_thuc' => $ngayKetThuc->toDateString(),
                            'tinh_trang' => 1,
                        ]);
                        // Đánh dấu khoản thưởng giới thiệu đã sử dụng
                        if ($dangKy->id_gioi_thieu) {
                            GioiThieu::where('id', $dangKy->id_gioi_thieu)
                                ->where('da_su_dung', 0)
                                ->update(['da_su_dung' => 1,]);
                        }

                        // 8. Gửi email xác nhận
                        $hoiVien = Client::find($dangKy->id_hoi_vien);
                        if ($hoiVien && $hoiVien->email) {
                            $xxx = [
                                'ho_ten' => $hoiVien->ho_ten,
                                'so_tien' => $dangKy->tong_tien,
                                'ten_goi_tap' => $goiTap->ten_goi_tap,
                                'ngay_bat_dau' => $ngayBatDauGoi->format('d/m/Y'),
                                'ngay_ket_thuc' => $ngayKetThuc->format('d/m/Y'),
                            ];
                            SendMailJob::dispatch( $xxx, 'thanh_toan_goi_tap', 'Thông báo thanh toán thành công', $hoiVien->email );
                        }

                        $this->info( "Đã thanh toán thành công đơn VF{$dangKy->id}" );

                        Log::info("Thanh toán thành công đơn VF{$dangKy->id}");
                        break;
                    }
                }
            } catch (\Throwable $e) {
                Log::error('Lỗi đồng bộ MB Bank: ' . $e->getMessage());
                $this->error($e->getMessage());
            }

            // Chờ 5 giây rồi kiểm tra lại
            sleep(5);
        }
        return Command::SUCCESS;
    }
}
