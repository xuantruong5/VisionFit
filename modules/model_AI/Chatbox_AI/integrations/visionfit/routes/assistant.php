<?php

// Loaded once from routes/api.php. Inherits Laravel's API prefix and middleware.
\Illuminate\Support\Facades\Route::prefix('assistant')
    ->middleware(\App\Http\Middleware\AssistantToken::class)
    ->group(function () {
        \Illuminate\Support\Facades\Route::get('/me', [\App\Http\Controllers\AssistantController::class, 'me']);
        \Illuminate\Support\Facades\Route::get('/context', [\App\Http\Controllers\AssistantController::class, 'context']);
    });
