<?php

// Loaded once from routes/api.php. Inherits Laravel's API prefix (/api/assistant/...).
\Illuminate\Support\Facades\Route::prefix('assistant')
    ->group(function () {
        \Illuminate\Support\Facades\Route::middleware(\App\Http\Middleware\AssistantToken::class)->group(function () {
            \Illuminate\Support\Facades\Route::get('/me', [\App\Http\Controllers\AssistantController::class, 'me']);
            \Illuminate\Support\Facades\Route::get('/context', [\App\Http\Controllers\AssistantController::class, 'context']);
            \Illuminate\Support\Facades\Route::get('/schedule', [\App\Http\Controllers\AssistantController::class, 'toolSchedule']);
            \Illuminate\Support\Facades\Route::get('/packages', [\App\Http\Controllers\AssistantController::class, 'toolPackages']);
            \Illuminate\Support\Facades\Route::get('/progress', [\App\Http\Controllers\AssistantController::class, 'toolProgress']);
            \Illuminate\Support\Facades\Route::get('/body-metrics', [\App\Http\Controllers\AssistantController::class, 'toolBodyMetrics']);
            \Illuminate\Support\Facades\Route::get('/meal-plan', [\App\Http\Controllers\AssistantController::class, 'toolMealPlan']);
            \Illuminate\Support\Facades\Route::get('/summary', [\App\Http\Controllers\AssistantController::class, 'toolSummary']);
        });
        \Illuminate\Support\Facades\Route::get('/knowledge/search', [\App\Http\Controllers\AssistantController::class, 'toolSearchKnowledge']);
        \Illuminate\Support\Facades\Route::post('/chat', [\App\Http\Controllers\AssistantController::class, 'chat']);
    });
