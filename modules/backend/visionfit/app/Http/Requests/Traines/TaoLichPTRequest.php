<?php

namespace App\Http\Requests\Traines;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class TaoLichPTRequest extends FormRequest
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
            'id_lich_tap' => 'required|integer|exists:lich_tap,id',
            'id_chi_tiet_dang_ky_goi' => 'required|integer',
            'id_hoi_vien' => 'required|integer',
            'ngay_tap' => 'required|date',
            'gio_bat_dau' => 'required|date_format:H:i',
            'gio_ket_thuc' => 'required|date_format:H:i|after:gio_bat_dau',
            'ghi_chu' => 'nullable|string',
        ];
    }
    public function messages(): array
    {
        return [
            'id_lich_tap.required' => 'Vui lòng chọn ngày tập.',
            'id_lich_tap.exists' => 'Ngày tập không tồn tại.',
            'id_chi_tiet_dang_ky_goi.required' => 'Vui lòng chọn gói đăng ký.',
            'id_hoi_vien.required' => 'Vui lòng chọn hội viên.',
            'ngay_tap.required' => 'Vui lòng chọn ngày tập.',
            'ngay_tap.date' => 'Ngày tập không hợp lệ.',
            'gio_bat_dau.required' => 'Vui lòng chọn giờ bắt đầu.',
            'gio_bat_dau.date_format' => 'Giờ bắt đầu không hợp lệ.',
            'gio_ket_thuc.required' => 'Vui lòng chọn giờ kết thúc.',
            'gio_ket_thuc.date_format' => 'Giờ kết thúc không hợp lệ.',
            'gio_ket_thuc.after' => 'Giờ kết thúc phải sau giờ bắt đầu.',
            'ghi_chu.string' => 'Ghi chú phải là chuỗi ký tự.',
        ];
    }
}
