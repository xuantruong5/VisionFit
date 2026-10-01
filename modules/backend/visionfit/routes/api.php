<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\BaiDangController;
use App\Http\Controllers\MembersController;
use App\Http\Controllers\KeHoachAnController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\BachKhoaToanThuController;
use App\Http\Controllers\DinhDuongTheThaoController;

// Sổ tay - Bách khoa toàn thư
Route::get('/bach-khoa-toan-thu', [BachKhoaToanThuController::class, 'index']);
Route::get('/bach-khoa-toan-thu/{id}', [BachKhoaToanThuController::class, 'show'])->whereNumber('id');

// Sổ tay - Dinh dưỡng thể thao
Route::get('/dinh-duong-the-thao/categories', [DinhDuongTheThaoController::class, 'getCategories']);
Route::get('/dinh-duong-the-thao', [DinhDuongTheThaoController::class, 'index']);
Route::get('/dinh-duong-the-thao/{id}', [DinhDuongTheThaoController::class, 'show'])->whereNumber('id');

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

Route::get('/chuong-trinh-tap', [MembersController::class, 'getChuongTrinhTap']);
Route::get('/chuong-trinh-tap/khong-muc-tieu', [MembersController::class, 'getChuongTrinhTapKhongMucTieu']);
Route::get('/chuong-trinh-tap/cap-do', [MembersController::class,'getCapDoChuongTrinh']);
Route::get('/chuong-trinh-tap/{id}', [MembersController::class, 'getChiTietChuongTrinhTap'])->whereNumber('id');

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
