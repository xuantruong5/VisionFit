<?php

return [
    // Admin has no id_phong_tap in the current schema. A trusted operator must
    // explicitly bind each admin ID to one gym ID. Unmapped admins get HTTP 403.
    // Example after verifying ownership: 12 => 3,
    'admin_gyms' => [],

    // Primary Gemini AI configuration + multi-model failover list
    'gemini_api_url' => env('GEMINI_API_URL', 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions'),
    'gemini_api_key' => env('GEMINI_API_KEY'),
    'gemini_model' => env('GEMINI_MODEL', 'gemini-flash-lite-latest'),
    'gemini_fallback_models' => array_values(array_filter(array_map(
        'trim',
        explode(',', (string) env('GEMINI_FALLBACK_MODELS', 'gemini-flash-lite-latest,gemini-3.5-flash-lite,gemini-2.5-flash,gemini-flash-latest'))
    ))),

    // Tier 2 Backup LLM API (OpenAI-compatible: Groq, OpenRouter, Gemini Key #2, OpenAI, Ollama...)
    'backup_api_url' => env('AI_BACKUP_API_URL'),
    'backup_api_key' => env('AI_BACKUP_API_KEY'),
    'backup_model' => env('AI_BACKUP_MODEL'),
];
