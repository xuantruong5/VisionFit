    // chương trình đã đăng ký để bỏ onloading
    Route::get('/my-programs', [DangKyChuongTrinhController::class, 'getMyPrograms']);
    Route::get('/all-list-programs', [DangKyChuongTrinhController::class, 'getAllListPrograms']);
    Route::get('/list-programs', [DangKyChuongTrinhController::class, 'getListPrograms']);
    Route::get('/list-program-exercises', [DangKyChuongTrinhController::class, 'getListProgramExercises']);
    Route::get('/list-program-exercises/{id}', [DangKyChuongTrinhController::class, 'getExercises']);
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

    Route::post('/buoi-tap/{id}/tien-do/{idTienDo}/lich-su-hiep',[BuoiTapController::class, 'luuLichSuHiep']);
    Route::get('/tien-do/{idTienDo}/lich-su-hiep',[BuoiTapController::class, 'getLichSuHiep']);

    // báo cáo
    Route::get('/bao-cao/{id}', [BuoiTapController::class, 'baoCaoBuoiTap']);


    // lấy dữ liệu
    Route::get('/buoi-tap/phan-tram-hoan-thanh',[BuoiTapController::class, 'getLatestProgress']);
    Route::get( '/buoi-tap/phan-tram-hoan-thanh-tat-ca', [BuoiTapController::class, 'getProgressPercent']);
    Route::get('/huan-luyen-tiep-theo',[BuoiTapController::class, 'getHuanLuyenTiepTheo']);


    // check đã đăng ký gói tập chưa để đăng ký
    Route::post('/check-quyen-tap', [ BuoiTapController::class, 'checkQuyenTap']);
    // lấy gói tập
    Route::get('/goi-tap', [GoiTapController::class, 'getAll']);
    // lấy trainer
    Route::get('/trainers', [GoiTapController::class, 'getTrainer']);
    Route::post('/search-trainer', [GoiTapController::class, 'searchTrainer']);
    // thông tin gói tập
    Route::post('/registration-preview', [GoiTapController::class, 'getRegistrationPreview']);
    // tính khuyến mãi
    Route::post('/tinh-khuyen-mai', [GoiTapController::class, 'tinhKhuyenMai']);
    Route::post('/luu-ma-gioi-thieu', [GoiTapController::class, 'luuMaGioiThieu']);
    Route::get('/thong-tin-gioi-thieu', [GoiTapController::class, 'thongTinGioiThieu']);

    Route::post('/dang-ky-goi', [ThanhToanController::class, 'store']);

    Route::get('/auto-thanh-toan-goi/{id}', [ThanhToanController::class, 'autoThanhToanGoi']);

    Route::post('/test-mail', [ThanhToanController::class, 'testGuiMail']);

    // lấy danh sách đã đăng ký gói
    Route::get('/goi-tap-cua-toi', [ ThanhToanController::class, 'danhSachGoiTapCuaToi']);
    Route::get('/goi-tap-cua-toi/{id}', [ ThanhToanController::class, 'chiTietGoiTapCuaToi']);


    Route::get('/profile', [MembersController::class, 'getProfile']);

    // tần suất tập và thưởng 
    Route::get('/thong-ke-chuoi-ngay-tap', [TanSuatThuongController::class, 'thongKeChuoiNgayTap']);
    Route::post('/nhan-phan-thuong', [TanSuatThuongController::class, 'nhanPhanThuong']);


    // thong bao 
    Route::get('/thong-bao', [ThongBaoController::class, 'danhSach']);
    Route::post('/thong-bao/{id}/da-doc', [ThongBaoController::class, 'danhDauDaDoc']);
    Route::post('/thong-bao/da-doc-tat-ca', [ThongBaoController::class, 'danhDauTatCaDaDoc']);
    Route::delete('/thong-bao/{id}', [ThongBaoController::class, 'xoa']);
    Route::delete('/thong-bao', [ThongBaoController::class, 'xoaTatCa']);




















});


// trainner
Route::post('/trainer/check-ma-pt', [TrainerController::class, 'checkMaPT']);
Route::post('trainer/login', [TrainerController::class, 'loginTrainer']);
Route::post('/trainer/dang-ky', [TrainerController::class, 'dangKy']);
Route::group(['prefix' => '/trainer','middleware' => 'TrainerMiddleware'], function () {

    Route::get('/chat/contacts', [ChatController::class, 'getTrainerContacts']);

    Route::get('/chat/rooms', [ChatController::class, 'getTrainerRooms']);

    Route::get('/chat/room/{id}', [ChatController::class, 'getTrainerRoom']);

    Route::match(['get', 'post'], '/chat/history-message', [ChatController::class, 'getTrainerHistory']);

    Route::post('/chat/send-message', [ChatController::class, 'sendTrainerMessage']);

    Route::post('/chat/room/{id}/read', [ChatController::class, 'markAsRead']);

    Route::post('/chat/room/{id}/pin', [ChatController::class, 'togglePinRoom']);

    Route::post('/chat/room/{id}/mute', [ChatController::class, 'toggleMuteRoom']);

    Route::post('/chat/message/{id}/recall', [ChatController::class, 'recallMessage']);

    Route::post('/chat/message/{id}/reaction', [ChatController::class, 'reactMessage']);

    Route::post('/chat/upload', [ChatController::class, 'uploadMedia']);




    Route::get('/user', [BaiDangController::class, 'getUser']);
    Route::get('/check-token', [TrainerController::class, 'checkTokenTrainer']);
    Route::post('logout', [TrainerController::class, 'logoutTrainer']);



    Route::get('/bai-dang', [BaiDangController::class, 'index']);
    Route::post('/bai-dang/store', [BaiDangController::class, 'store']);
    Route::post('/bai-dang/{id}/like', [BaiDangController::class, 'like']);
    Route::delete('/bai-dang/{id}/unlike', [BaiDangController::class, 'unlike']);
    Route::post('/bai-dang/{id}/save', [BaiDangController::class, 'savePost']);
    Route::delete('/bai-dang/{id}/save', [BaiDangController::class, 'unsavePost']);

    Route::get('/bai-dang/{id}/binh-luan', [BaiDangController::class, 'getComments']);
    Route::post('/bai-dang/{id}/binh-luan', [BaiDangController::class, 'comment']);
    Route::delete('/binh-luan/{id}', [BaiDangController::class, 'deleteComment']);
    Route::post('/binh-luan/{id}', [BaiDangController::class, 'updateComment']);
    Route::post('/binh-luan/{id}/like', [BaiDangController::class, 'likeComment']);
    Route::delete('/binh-luan/{id}/like',[BaiDangController::class, 'unlikeComment']);


    Route::get('/bai-dang-da-luu', [BaiDangController::class, 'savedPosts']);
    Route::post('/bai-dang/{id}',[BaiDangController::class, 'updatePost']);
    Route::delete('/bai-dang/{id}',[BaiDangController::class, 'deletePost']);
});


// admin
Route::post('admin/login', [AdminController::class, 'loginAdmin']);
Route::group(['prefix' => 'admin', 'middleware' => 'AdminMiddleware'], function () {
    Route::post('logout', [AdminController::class, 'logoutAdmin']);
    Route::get('/check-token', [AdminController::class, 'checkTokenAdmin']);
    Route::get('/trainers/ung-vien',[AdminController::class, 'danhSachUngVien']);
    Route::post( '/gui-thu-moi-phong-van', [AdminController::class, 'guiThuMoiPhongVan']);
    Route::post('/trainers/{id}/ket-qua-phong-van',[AdminController::class, 'capNhatKetQuaPhongVan']);
    Route::post('/trainers/{id}/kich-hoat', [AdminController::class, 'kichHoatTrainer']);
});





// VisionFit Assistant integration
require __DIR__ . '/assistant.php';
