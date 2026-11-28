<?php

namespace App\Console\Commands;

use App\Services\Assistant\KnowledgeEmbeddingService;
use Illuminate\Console\Command;

class IndexAssistantKnowledge extends Command
{
    protected $signature = 'assistant:index-knowledge {--force : Re-embed toàn bộ kho kiến thức kể cả bản ghi không đổi}';

    protected $description = '(Không bắt buộc) Lập trước chỉ mục kho kiến thức VisionFit. Chatbot đã tự lập và tự cập nhật chỉ mục khi cần.';

    public function handle(KnowledgeEmbeddingService $service): int
    {
        $force = (bool) $this->option('force');
        $this->info('Đang đồng bộ chỉ mục embeddings cho kho kiến thức VisionFit...');

        try {
            $stats = $service->syncIndex($force);
        } catch (\Throwable $e) {
            $this->error('Lỗi khi đồng bộ embeddings: ' . $e->getMessage());
            return self::FAILURE;
        }

        $this->info(sprintf(
            'Hoàn tất (model=%s): tổng=%d | mới=%d | cập nhật=%d | giữ nguyên=%d | xóa=%d',
            $stats['model'],
            $stats['total_documents'],
            $stats['indexed'],
            $stats['updated'],
            $stats['skipped'],
            $stats['removed']
        ));
        $this->line('File chỉ mục: ' . $stats['storage']);

        return self::SUCCESS;
    }
}

