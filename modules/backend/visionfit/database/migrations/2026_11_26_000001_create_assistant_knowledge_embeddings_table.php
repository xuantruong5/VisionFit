<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('assistant_knowledge_embeddings')) {
            return;
        }

        Schema::create('assistant_knowledge_embeddings', function (Blueprint $table) {
            $table->id();
            $table->string('source_table', 64);
            $table->unsignedBigInteger('source_id');
            $table->string('category', 32);
            $table->string('title', 255);
            $table->text('content_text');
            $table->text('metadata_json')->nullable();
            $table->string('content_hash', 64);
            $table->string('embedding_model', 100);
            $table->longText('embedding_json');
            $table->timestamps();

            $table->unique(['source_table', 'source_id'], 'assistant_knowledge_source_unique');
            $table->index(['category', 'embedding_model'], 'assistant_knowledge_cat_model_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('assistant_knowledge_embeddings');
    }
};

