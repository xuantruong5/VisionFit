<?php

return [
    // Admin has no id_phong_tap in the current schema. A trusted operator must
    // explicitly bind each admin ID to one gym ID. Unmapped admins get HTTP 403.
    // Example after verifying ownership: 12 => 3,
    'admin_gyms' => [],

    // Official Gemini REST API (Native Function Calling :generateContent + Embeddings :embedContent)
    'gemini_base_url' => env('GEMINI_BASE_URL', 'https://generativelanguage.googleapis.com/v1beta'),
    'gemini_api_key' => env('GEMINI_API_KEY'),

    // Verified active models on /v1beta/models supporting generateContent + Native Function Calling
    'gemini_model' => env('GEMINI_MODEL', 'gemini-flash-lite-latest'),
    'gemini_fallback_models' => array_values(array_filter(array_map(
        'trim',
        explode(',', (string) env('GEMINI_FALLBACK_MODELS', 'gemini-flash-lite-latest,gemini-3.5-flash-lite,gemini-3.8-flash,gemini-flash-latest'))
    ))),

    // Verified Gemini Embedding model for semantic search in search_fitness_knowledge
    'gemini_embedding_model' => env('GEMINI_EMBEDDING_MODEL', 'gemini-embedding-001'),
    // Calibrated on isolated 230-doc MySQL validation set (margin [0.68..0.74], midpoint 0.70 -> Val P=1.00, R=1.00, FP=0)
    'knowledge_min_similarity' => (float) env('ASSISTANT_KNOWLEDGE_MIN_SIMILARITY', 0.70),

    // Function Calling orchestration safety budgets
    'max_tool_rounds' => (int) env('ASSISTANT_MAX_TOOL_ROUNDS', 5),
    'max_retries_per_call' => (int) env('ASSISTANT_MAX_RETRIES', 1),
    'total_timeout_seconds' => (int) env('ASSISTANT_TOTAL_TIMEOUT', 25),
    'embedding_timeout_seconds' => (int) env('ASSISTANT_EMBEDDING_TIMEOUT', 10),
    'embedding_max_retries' => (int) env('ASSISTANT_EMBEDDING_MAX_RETRIES', 1),
    // Cache ONLY query embedding vectors (keyed by model + normalized query) to save quota without caching per-user results
    'embedding_query_cache_ttl' => (int) env('ASSISTANT_EMBEDDING_QUERY_CACHE_TTL', 86400),
    // Cache vector câu hỏi bằng FILE để không ghi thêm dữ liệu vào bảng `cache` của database
    'embedding_query_cache_store' => env('ASSISTANT_EMBEDDING_QUERY_CACHE_STORE', 'file'),
    // Số chiều vector (Gemini hỗ trợ 768 / 1536 / 3072). 768 = file chỉ mục nhỏ hơn 4 lần, chất lượng gần như giữ nguyên
    'embedding_dimensions' => (int) env('ASSISTANT_EMBEDDING_DIMENSIONS', 768),
    // Chỉ mục kho kiến thức lưu thành FILE (không phải bảng DB); tự tạo ở lần hỏi kiến thức đầu tiên
    'knowledge_index_path' => env('ASSISTANT_KNOWLEDGE_INDEX_PATH', storage_path('app/assistant/knowledge_index.bin')),
    // Chu kỳ tự kiểm tra món ăn / bài tập mới hoặc đã sửa để cập nhật chỉ mục (giây)
    'knowledge_auto_refresh_seconds' => (int) env('ASSISTANT_KNOWLEDGE_AUTO_REFRESH', 600),
    // Cache câu trả lời KIẾN THỨC CHUNG (dùng chung giữa nhiều người, tách theo hồ sơ dị ứng). 0 = tắt
    'answer_cache_ttl' => (int) env('ASSISTANT_ANSWER_CACHE_TTL', 21600),
    'answer_cache_store' => env('ASSISTANT_ANSWER_CACHE_STORE', 'file'),
    // Số tài liệu tối đa embed trong MỘT câu hỏi (dưới hạn mức/phút của Gemini miễn phí); phần còn lại làm tiếp sau ~1 phút
    'knowledge_max_embeds_per_request' => (int) env('ASSISTANT_KNOWLEDGE_MAX_EMBEDS_PER_REQUEST', 80),
    'ssl_verify' => filter_var(env('ASSISTANT_SSL_VERIFY', false), FILTER_VALIDATE_BOOLEAN),

    // Optional Tier-2 Backup Provider (must support structured OpenAI-compatible Tool/Function Calling)
    'backup_api_url' => env('AI_BACKUP_API_URL'),
    'backup_api_key' => env('AI_BACKUP_API_KEY'),
    'backup_model' => env('AI_BACKUP_MODEL'),
];
