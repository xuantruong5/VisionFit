<?php

namespace App\Http\Requests\TienDo;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class BatDauBuoiTapRequest extends FormRequest
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
            'id_lich_tap'               => ['required','integer','min:1',],
            'id_chuong_trinh_bai_tap'   => ['required','integer','min:1',],
        ];
    }
    public function messages(): array
    {
        return [
            'id_lich_tap.required' => 'Vui lòng chọn lịch tập.',
            'id_lich_tap.integer' => 'ID lịch tập phải là số nguyên.',
            'id_lich_tap.min' => 'ID lịch tập phải lớn hơn 0.',

            'id_chuong_trinh_bai_tap.required' => 'Vui lòng chọn chương trình bài tập.',
            'id_chuong_trinh_bai_tap.integer' => 'ID chương trình bài tập phải là số nguyên.',
            'id_chuong_trinh_bai_tap.min' => 'ID chương trình bài tập phải lớn hơn 0.',
        ];
    }

}
