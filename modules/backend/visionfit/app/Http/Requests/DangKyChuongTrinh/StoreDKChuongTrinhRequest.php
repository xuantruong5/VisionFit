<?php

namespace App\Http\Requests\DangKyChuongTrinh;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreDKChuongTrinhRequest extends FormRequest
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
            
            'id_chuong_trinh'   => 'required|integer|min:1|exists:chuong_trinh_tap,id',
            'id_cap_do'         => 'required|integer|min:1',
            'id_noi_tap'         => 'required|integer|min:1',
            
        ];
    }
    public function messages(): array
    {
        return [
            'id_chuong_trinh.required' => 'Vui lòng chọn chương trình.',
            'id_chuong_trinh.exists' => 'Chương trình không tồn tại.',
        ];
    }
}
