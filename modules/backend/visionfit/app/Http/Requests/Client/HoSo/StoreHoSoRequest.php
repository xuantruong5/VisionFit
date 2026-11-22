<?php

namespace App\Http\Requests\Client\HoSo;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreHoSoRequest extends FormRequest
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
            'ngay_sinh' => 'sometimes|required|date|before:today',
            'gioi_tinh' => 'sometimes|required|in:0,1,2',
            'chieu_cao_cm' => 'required|numeric|min:50|max:250',
            'can_nang_kg' => 'required|numeric|min:10|max:300',

            'muc_tieu_hoat_dong' => 'required|in:1,2,3,4',
            'muc_tieu_hien_tai' => 'sometimes|required|string|max:50',
            'noi_tap_uu_tien' => 'sometimes|required|string|max:30',

            // Cho phép chọn nhiều chế độ ăn
            'che_do_an_ua_thich' => 'nullable|array',
            'che_do_an_ua_thich.*' => 'string|max:255',

            'muc_ngan_sach_an_uong' => 'sometimes|required|in:1,2,3',

            'note' => 'nullable|string',

            // Cho phép chọn nhiều loại dị ứng
            'di_ung' => 'nullable|array',
            'di_ung.*' => 'string|max:255',
        ];
    }
    public function messages(): array
    {
        return [
            'ngay_sinh.required' => 'Vui lòng nhập ngày sinh.',
            'ngay_sinh.date' => 'Ngày sinh không hợp lệ.',
            'ngay_sinh.before' => 'Ngày sinh phải nhỏ hơn ngày hiện tại.',
            'gioi_tinh.required' => 'Vui lòng chọn giới tính.',
            'gioi_tinh.in' => 'Giới tính không hợp lệ.',

            'chieu_cao_cm.required' => 'Vui lòng nhập chiều cao.',
            'chieu_cao_cm.numeric' => 'Chiều cao phải là số.',
            'chieu_cao_cm.min' => 'Chiều cao tối thiểu là 50 cm.',
            'chieu_cao_cm.max' => 'Chiều cao tối đa là 250 cm.',

            'can_nang_kg.required' => 'Vui lòng nhập cân nặng.',
            'can_nang_kg.numeric' => 'Cân nặng phải là số.',
            'can_nang_kg.min' => 'Cân nặng tối thiểu là 10 kg.',
            'can_nang_kg.max' => 'Cân nặng tối đa là 300 kg.',

            'muc_tieu_hoat_dong.required' => 'Vui lòng chọn mức độ hoạt động.',
            'muc_tieu_hoat_dong.in' => 'Mức độ hoạt động không hợp lệ.',

            'muc_tieu_hien_tai.required' => 'Vui lòng chọn mục tiêu hiện tại.',
            'muc_tieu_hien_tai.string' => 'Mục tiêu hiện tại phải là chuỗi ký tự.',
            'muc_tieu_hien_tai.max' => 'Mục tiêu không được vượt quá 50 ký tự.',

            'noi_tap_uu_tien.required' => 'Vui lòng chọn nơi tập ưu tiên.',
            'noi_tap_uu_tien.string' => 'Nơi tập ưu tiên phải là chuỗi ký tự.',
            'noi_tap_uu_tien.max' => 'Nơi tập ưu tiên không được vượt quá 30 ký tự.',

            'che_do_an_ua_thich.array' => 'Chế độ ăn ưa thích phải là danh sách.',
            'che_do_an_ua_thich.*.string' => 'Tên chế độ ăn không hợp lệ.',

            'muc_ngan_sach_an_uong.required' => 'Vui lòng chọn ngân sách ăn uống.',
            'muc_ngan_sach_an_uong.in' => 'Ngân sách ăn uống không hợp lệ.',

            'note.string' => 'Ghi chú phải là chuỗi ký tự.',
            'di_ung.array' => 'Thông tin dị ứng phải là danh sách.',
            'di_ung.*.string' => 'Thông tin dị ứng không hợp lệ.',
        ];
    }
}
