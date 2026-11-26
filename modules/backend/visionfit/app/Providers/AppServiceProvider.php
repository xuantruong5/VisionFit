<?php

namespace App\Providers;

use App\Services\Assistant\AssistantOrchestrator;
use App\Services\Assistant\AssistantToolRegistry;
use App\Services\Assistant\EmbeddingClientInterface;
use App\Services\Assistant\FitnessDataService;
use App\Services\Assistant\GeminiEmbeddingClient;
use App\Services\Assistant\GeminiFunctionCallingClient;
use App\Services\Assistant\InternalApiClientInterface;
use App\Services\Assistant\LaravelInternalApiClient;
use App\Services\Assistant\LlmClientInterface;
use App\Services\Assistant\OpenAiCompatibleToolClient;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(LlmClientInterface::class, fn () => new GeminiFunctionCallingClient());
        $this->app->bind(EmbeddingClientInterface::class, fn () => new GeminiEmbeddingClient());
        $this->app->bind(InternalApiClientInterface::class, fn ($app) => new LaravelInternalApiClient($app));

        $this->app->bind(AssistantOrchestrator::class, function ($app) {
            $backupClient = null;
            $backupUrl = trim((string) config('assistant.backup_api_url', ''));
            $backupKey = trim((string) config('assistant.backup_api_key', ''));
            $backupModel = trim((string) config('assistant.backup_model', ''));
            if ($backupUrl !== '' && $backupKey !== '' && $backupModel !== '') {
                $backupClient = new OpenAiCompatibleToolClient($backupUrl, $backupKey);
            }

            return new AssistantOrchestrator(
                $app->make(LlmClientInterface::class),
                $app->make(AssistantToolRegistry::class),
                $app->make(FitnessDataService::class),
                $backupClient
            );
        });
    }

    public function boot(): void
    {
        //
    }
}
