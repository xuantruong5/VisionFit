<?php

namespace App\Http\Requests\TienDo;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class CapNhatTienDoRequest extends FormRequest
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
            'so_set_thuc_te' => 'sometimes|nullable|integer|min:0',
            'so_rep_thuc_te' => 'sometimes|nullable|integer|min:0',
            'so_phut_thuc_te' => 'sometimes|nullable|integer|min:0',
            'thoi_gian_thuc_te_giay' => 'sometimes|nullable|integer|min:0',
            'trong_luong_ta_thuc_te' => 'sometimes|nullable|numeric|min:0',
        ];
    }
    public function messages(): array
    {
        return [
            'so_set_thuc_te.integer' => 'Số set thực tế phải là số nguyên.',
            'so_set_thuc_te.min' => 'Số set thực tế phải lớn hơn hoặc bằng 0.',

            'so_rep_thuc_te.integer' => 'Số rep thực tế phải là số nguyên.',
            'so_rep_thuc_te.min' => 'Số rep thực tế phải lớn hơn hoặc bằng 0.',

            'so_phut_thuc_te.integer' => 'Số phút thực tế phải là số nguyên.',
            'so_phut_thuc_te.min' => 'Số phút thực tế phải lớn hơn hoặc bằng 0.',

            'thoi_gian_thuc_te_giay.integer' => 'Thời gian thực tế phải là số nguyên.',
            'thoi_gian_thuc_te_giay.min' => 'Thời gian thực tế phải lớn hơn hoặc bằng 0.',

            'trong_luong_ta_thuc_te.numeric' => 'Trọng lượng tạ thực tế phải là số.',
            'trong_luong_ta_thuc_te.min' => 'Trọng lượng tạ thực tế phải lớn hơn hoặc bằng 0.',
        ];
    }
}
