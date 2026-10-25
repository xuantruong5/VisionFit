<?php

namespace App\Http\Requests\TienDo;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class KetThucBuoiTapRequest extends FormRequest
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
            'tong_thoi_gian_nghi' => 'sometimes|nullable|integer|min:0',
        ];
    }
    public function messages(): array
    {
        return [
            'tong_thoi_gian_nghi.integer' => 'Tổng thời gian nghỉ phải là số nguyên.',
            'tong_thoi_gian_nghi.min' => 'Tổng thời gian nghỉ phải lớn hơn hoặc bằng 0.',
        ];
    }
}
