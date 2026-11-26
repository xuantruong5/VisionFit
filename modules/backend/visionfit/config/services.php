<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Nutrition & Fitness Calculation Configuration
    |--------------------------------------------------------------------------
    |
    | Các hệ số và tỷ lệ chuẩn tính toán BMR, TDEE, Calo mục tiêu và Macros.
    |
    */
    'nutrition' => [
        'activity_factors' => [
            '1.2' => 'Ít vận động (sedentary - văn phòng)',
            '1.375' => 'Vận động nhẹ (light - 1-3 ngày/tuần)',
            '1.55' => 'Vận động vừa (moderate - 3-5 ngày/tuần)',
            '1.725' => 'Vận động nhiều (very active - 6-7 ngày/tuần)',
            '1.9' => 'Vận động cực nhiều (extra active - VĐV)',
        ],
        'goal_adjustments' => [
            'maintain' => 0,          // Duy trì cân nặng
            'lose_weight' => -500,     // Giảm mỡ/cân (thâm hụt 500 kcal)
            'gain_weight' => 300,      // Tăng cơ/cân (thặng dư 300 kcal)
        ],
        'macro_ratios' => [
            'maintain' => [
                'protein' => 0.25,    // 25% calo
                'fat' => 0.25,        // 25% calo
                'carb' => 0.50,       // 50% calo
            ],
            'lose_weight' => [
                'protein' => 0.35,    // 35% calo (giữ cơ)
                'fat' => 0.25,        // 25% calo
                'carb' => 0.40,       // 40% calo
            ],
            'gain_weight' => [
                'protein' => 0.30,    // 30% calo
                'fat' => 0.25,        // 25% calo
                'carb' => 0.45,       // 45% calo
            ],
        ],
    ],

  
];
