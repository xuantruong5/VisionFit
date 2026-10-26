<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\BaiDangController;
use App\Http\Controllers\MembersController;
use App\Http\Controllers\KeHoachAnController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\BachKhoaToanThuController;
use App\Http\Controllers\DinhDuongTheThaoController;
use App\Http\Controllers\ThucPhamSoTayController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\TrainerController;
use App\Http\Controllers\DangKyChuongTrinhController;
use App\Http\Controllers\ChuongTrinhBaiTapController;
use App\Http\Controllers\PhongGymController;
use App\Http\Controllers\BuoiTapController;
















// Sổ tay - Bách khoa toàn thư
Route::get('/bach-khoa-toan-thu', [BachKhoaToanThuController::class, 'index']);
Route::get('/bach-khoa-toan-thu/{id}', [BachKhoaToanThuController::class, 'show'])->whereNumber('id');

// Sổ tay - Dinh dưỡng thể thao
Route::get('/dinh-duong-the-thao/categories', [DinhDuongTheThaoController::class, 'getCategories']);
Route::get('/dinh-duong-the-thao', [DinhDuongTheThaoController::class, 'index']);
Route::get('/dinh-duong-the-thao/{id}', [DinhDuongTheThaoController::class, 'show'])->whereNumber('id');

// Sổ tay - Thực phẩm & Lượng calo
Route::get('/so-tay/thuc-pham/categories', [ThucPhamSoTayController::class, 'getCategories']);
Route::get('/so-tay/thuc-pham', [ThucPhamSoTayController::class, 'index']);
Route::get('/so-tay/thuc-pham/{id}', [ThucPhamSoTayController::class, 'show'])->whereNumber('id');

// member
Route::get('/bai-dang', [BaiDangController::class, 'index']);
Route::post('/bai-dang', [BaiDangController::class, 'store']);
Route::post('/bai-dang/{id}/like', [BaiDangController::class, 'like']);
Route::delete('/bai-dang/{id}/like', [BaiDangController::class, 'unlike']);
Route::post('/bai-dang/{id}/save', [BaiDangController::class, 'savePost']);
Route::delete('/bai-dang/{id}/save', [BaiDangController::class, 'unsavePost']);
Route::get('/bai-dang/{id}/binh-luan', [BaiDangController::class, 'getComments']);
Route::post('/bai-dang/{id}/binh-luan', [BaiDangController::class, 'comment']);
Route::get('/bai-dang-da-luu', [BaiDangController::class, 'savedPosts']);
Route::put('/bai-dang/{id}',[BaiDangController::class, 'updatePost']);
Route::delete('/bai-dang/{id}',[BaiDangController::class, 'deletePost']);

Route::delete('/binh-luan/{id}', [BaiDangController::class, 'deleteComment']);
Route::put('/binh-luan/{id}', [BaiDangController::class, 'updateComment']);
Route::post('/binh-luan/{id}/like', [BaiDangController::class, 'likeComment']);
Route::delete('/binh-luan/{id}/like',[BaiDangController::class, 'unlikeComment']);

// dashboard
Route::get('/tong-quan', [MembersController::class, 'tongQuan']);
Route::get('/ke-hoach-an', [KeHoachAnController::class, 'keHoachAn']);

// member
Route::get('/ho-so', [MembersController::class, 'getProfile']);
Route::post('/ho-so/cap-nhat', [MembersController::class, 'updateProfile']);
Route::post('/ho-so/avatar', [MembersController::class, 'uploadAvatar']);

// Route::get('/chuong-trinh-tap', [MembersController::class, 'getChuongTrinhTap']);
// Route::get('/chuong-trinh-tap/khong-muc-tieu', [MembersController::class, 'getChuongTrinhTapKhongMucTieu']);
// Route::get('/chuong-trinh-tap/cap-do', [MembersController::class,'getCapDoChuongTrinh']);
// Route::get('/chuong-trinh-tap/{id}', [MembersController::class, 'getChiTietChuongTrinhTap']);
Route::get('/bai-tap', [MembersController::class, 'getDanhSachBaiTap']);

// Chat routes
Route::prefix('chat')->group(function () {
    Route::get('/rooms', [ChatController::class, 'getListRooms']);
    Route::get('/contacts', [ChatController::class, 'getContacts']);
    Route::get('/room/{id}', [ChatController::class, 'getRoom']);
    Route::get('/get-room/{id}', [ChatController::class, 'getRoom']);
    Route::post('/room/group', [ChatController::class, 'createGroupRoom']);
    Route::post('/room/{id}/pin', [ChatController::class, 'togglePinRoom']);
    Route::post('/room/{id}/mute', [ChatController::class, 'toggleMuteRoom']);
    Route::post('/room/{id}/read', [ChatController::class, 'markAsRead']);

    Route::post('/send-message', [ChatController::class, 'sentMessage']);
    Route::match(['get', 'post'], '/history-message', [ChatController::class, 'historyMessage']);
    Route::post('/message/{id}/recall', [ChatController::class, 'recallMessage']);
    Route::post('/message/{id}/reaction', [ChatController::class, 'reactMessage']);
    Route::post('/upload', [ChatController::class, 'uploadMedia']);
});


// member

Route::get('/phong-gym', [PhongGymController::class,'danhSach']);


Route::post('client/login', [MembersController::class, 'login']);
Route::group(['prefix' => 'client','middleware' => 'ClientMiddleware'], function () {
    Route::get('/chuong-trinh-tap', [MembersController::class, 'getChuongTrinhTap']);
    Route::get('/chuong-trinh-tap/khong-muc-tieu', [MembersController::class, 'getChuongTrinhTapKhongMucTieu']);
    Route::get('/chuong-trinh-tap/{id}/noi-tap', [MembersController::class, 'getNoiTap']);
    Route::get('/chuong-trinh-tap/cap-do', [MembersController::class,'getCapDoChuongTrinh']);
    Route::get('/chuong-trinh-tap/{id}', [MembersController::class, 'getChiTietChuongTrinhTap']);
    Route::post('logout', [MembersController::class, 'logoutClient']);
    Route::post('logout-all', [MembersController::class, 'logoutAllClient']);
    Route::post('dang-ky-chuong-trinh', [DangKyChuongTrinhController::class, 'store']);
    // chương trình đã đăng ký để bỏ onloading
    Route::get('/my-programs', [DangKyChuongTrinhController::class, 'getMyPrograms']);
    Route::get('/all-list-programs', [DangKyChuongTrinhController::class, 'getAllListPrograms']);
    Route::get('/list-programs', [DangKyChuongTrinhController::class, 'getListPrograms']);
    Route::get('/list-program-exercises', [DangKyChuongTrinhController::class, 'getListProgramExercises']);
    Route::get('//list-program-exercises/{id}', [DangKyChuongTrinhController::class, 'getExercises']);
    Route::get('/list-meal-plans', [DangKyChuongTrinhController::class,'getListMealPlans']);
    Route::delete('/delete-program/{id}', [DangKyChuongTrinhController::class, 'destroy']);
    Route::post('/activate-program/{id}',[DangKyChuongTrinhController::class, 'activateProgram']);

    Route::post('/chuong-trinh-bai-tap/{id}/bo-qua', [ChuongTrinhBaiTapController::class, 'changeSkip']);
    // Route::get('/my-program-detail',[DangKyChuongTrinhController::class, 'getMyProgramDetail']); // api tổng hợp  

    Route::get('/provinces', [MembersController::class, 'getProvinces']);
    Route::get('/provinces/{code}/wards', [MembersController::class, 'getWards']);
    Route::get('/provinces/{code}/gyms', [MembersController::class, 'getGymsByProvince']);
    Route::get('/wards/{id}/gyms', [MembersController::class,'getGymsByWard']);



    // đếm thời gian bài tập và mức độ hoàn thành 
    Route::post('/buoi-tap/bat-dau', [BuoiTapController::class, 'batDau']);
    Route::post('/buoi-tap/{id}/khoi-tao-tien-do', [BuoiTapController::class, 'khoiTaoTienDo']);
    Route::post('/buoi-tap/{id}/tien-do/{idTienDo}',[BuoiTapController::class, 'capNhatTienDo']);
    Route::post('/buoi-tap/{id}/tien-do/{idTienDo}/hoan-thanh',[BuoiTapController::class, 'hoanThanhBaiTap']);
    Route::post('/buoi-tap/{id}/ket-thuc',[BuoiTapController::class, 'ketThuc']);


    // lấy dữ liệu 
    Route::get('/buoi-tap/phan-tram-hoan-thanh',[BuoiTapController::class, 'getLatestProgress']);
    Route::get( '/buoi-tap/phan-tram-hoan-thanh-tat-ca', [BuoiTapController::class, 'getProgressPercent']);
    Route::get('/huan-luyen-tiep-theo',[BuoiTapController::class, 'getHuanLuyenTiepTheo']);









});


// trainner
Route::post('trainer/login', [TrainerController::class, 'loginTrainer']);
Route::group(['prefix' => '/trainer','middleware' => 'TrainerMiddleware'], function () {
    Route::post('logout', [TrainerController::class, 'logoutTrainer']);
});


// admin
Route::post('admin/login', [AdminController::class, 'loginAdmin']);
Route::group(['prefix' => 'admin','middleware' => 'AdminMiddleware'], function () {
    Route::post('logout', [AdminController::class, 'logoutAdmin']);
});



