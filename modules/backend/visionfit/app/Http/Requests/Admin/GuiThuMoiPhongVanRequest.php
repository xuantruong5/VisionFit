<?php

namespace App\Http\Requests\Admin;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class GuiThuMoiPhongVanRequest extends FormRequest
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
            'email' => 'required|email',
            'ho_ten' => 'required|string|max:255',
            'thoi_gian' => 'required|string',
            'dia_chi' => 'required|string|max:500',
            'ghi_chu' => 'nullable|string|max:2000',
        ];
    }
     public function messages(): array
    {
        return [
            'email.required' => 'Vui lòng nhập email.',
            'email.email' => 'Email không đúng định dạng.',

            'ho_ten.required' => 'Vui lòng nhập họ tên.',
            'ho_ten.max' => 'Họ tên không được vượt quá 255 ký tự.',

            'thoi_gian.required' => 'Vui lòng nhập thời gian phỏng vấn.',

            'dia_chi.required' => 'Vui lòng nhập địa chỉ phỏng vấn.',
            'dia_chi.max' => 'Địa chỉ không được vượt quá 500 ký tự.',

            'ghi_chu.max' => 'Ghi chú không được vượt quá 2000 ký tự.',
        ];
    }
}
