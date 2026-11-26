<?php

// Loaded once from routes/api.php. Inherits Laravel's API prefix.
\Illuminate\Support\Facades\Route::prefix('assistant')
    ->group(function () {
        \Illuminate\Support\Facades\Route::middleware(\App\Http\Middleware\AssistantToken::class)->group(function () {
            \Illuminate\Support\Facades\Route::get('/me', [\App\Http\Controllers\AssistantController::class, 'me']);
            \Illuminate\Support\Facades\Route::get('/context', [\App\Http\Controllers\AssistantController::class, 'context']);
        });
        \Illuminate\Support\Facades\Route::post('/chat', [\App\Http\Controllers\AssistantController::class, 'chat']);
    });
