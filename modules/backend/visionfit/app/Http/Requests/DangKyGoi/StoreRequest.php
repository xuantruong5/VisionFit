<?php

namespace App\Http\Requests\DangKyGoi;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'id_goi_tap' => 'required|integer|exists:goi_tap,id',

            'id_chuong_trinh_tap' => 'nullable|integer',
            'id_noi_tap' => 'nullable|integer',
            'id_trainer' => 'nullable|integer',

            'ma_khuyen_mai' => 'nullable|string',
            'ma_gioi_thieu' => 'nullable|string',

            'tien_giam_khuyen_mai' => 'nullable|numeric|min:0',
            'tien_giam_gioi_thieu' => 'nullable|numeric|min:0',

            'lan_dang_ky' => 'nullable|integer|min:1',
            'phan_tram_giam' => 'nullable|numeric|min:0|max:100',

            'phuong_thuc_thanh_toan' => 'required|string|max:100',
        ];
    }
    public function messages(): array
    {
        return [
            'id_goi_tap.required' => 'Vui lòng chọn gói tập.',
            'id_goi_tap.exists' => 'Gói tập không tồn tại.',
            'id_goi_tap.integer' => 'ID gói tập không hợp lệ.',

            'id_chuong_trinh_tap.integer' => 'Chương trình tập không hợp lệ.',
            'id_noi_tap.integer' => 'Nơi tập không hợp lệ.',
            'id_trainer.integer' => 'Trainer không hợp lệ.',

            'tien_giam_khuyen_mai.numeric' => 'Tiền giảm khuyến mãi phải là số.',
            'tien_giam_gioi_thieu.numeric' => 'Tiền giảm giới thiệu phải là số.',

            'lan_dang_ky.integer' => 'Lần đăng ký không hợp lệ.',
            'lan_dang_ky.min' => 'Lần đăng ký phải lớn hơn 0.',

            'phan_tram_giam.numeric' => 'Phần trăm giảm phải là số.',
            'phan_tram_giam.min' => 'Phần trăm giảm không được nhỏ hơn 0.',
            'phan_tram_giam.max' => 'Phần trăm giảm không được lớn hơn 100.',

            'phuong_thuc_thanh_toan.required' => 'Vui lòng chọn phương thức thanh toán.',
        ];
    }
}
