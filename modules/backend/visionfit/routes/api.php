<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\BaiDangController;
use App\Http\Controllers\MembersController;


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


// member
Route::get('/chuong-trinh-tap', [MembersController::class, 'getChuongTrinhTap']);
Route::get('/chuong-trinh-tap/khong-muc-tieu', [MembersController::class, 'getChuongTrinhTapKhongMucTieu']);



