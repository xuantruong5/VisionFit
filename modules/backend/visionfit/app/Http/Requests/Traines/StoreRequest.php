<?php

namespace App\Http\Requests\Traines;

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
            'ho_ten' => ['required', 'string', 'max:255'],
            'email' => [ 'required', 'email', 'max:255','unique:trainers,email',],
            'password' => [ 'required', 'string','min:5','confirmed',],
            'so_dien_thoai' => [ 'nullable', 'string', 'max:20',],
            'ngay_sinh' => [ 'nullable', 'date',],
            'gioi_tinh' => [ 'nullable', 'integer', 'in:0,1,2',],
            'ma_gioi_thieu' => ['nullable','string',],
            'cv' => ['required', 'file', 'mimes:pdf,doc,docx', 'max:10240'],
        ];
    }
    public function messages(): array
    {
        return [
            'ho_ten.required' => 'Vui lòng nhập họ tên.',
            'email.required' => 'Vui lòng nhập email.',
            'email.email' => 'Email không đúng định dạng.',
            'email.unique' => 'Email đã được sử dụng.',

            'password.required' => 'Vui lòng nhập mật khẩu.',
            'password.min' => 'Mật khẩu phải có ít nhất 5 ký tự.',
            'password.confirmed' => 'Xác nhận mật khẩu không khớp.',
            'gioi_tinh.in' => 'Giới tính không hợp lệ.',
            'cv.required' => 'Vui lòng chọn CV xin việc.',
            'cv.file' => 'File CV không hợp lệ.',
            'cv.mimes' => 'CV chỉ được phép là PDF, DOC hoặc DOCX.',
            'cv.max' => 'CV không được vượt quá 10MB.',
        ];
    }
}
