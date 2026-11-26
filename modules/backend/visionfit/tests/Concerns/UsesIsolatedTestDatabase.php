<?php

namespace Tests\Concerns;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Safety guard ensuring destructive database resets (dropAllTables) ONLY execute
 * against SQLite :memory: or a verified isolated MySQL *_test schema (never FITLIE).
 */
trait UsesIsolatedTestDatabase
{
    protected function resetVerifiedTestDatabase(array $migrations): void
    {
        $this->assertSame('testing', config('app.env'), 'Test DB reset is forbidden outside APP_ENV=testing.');

        $driver = (string) config('database.default');
        if ($driver === 'sqlite') {
            $this->assertSame(':memory:', config('database.connections.sqlite.database'));
        } elseif (in_array($driver, ['mysql', 'mariadb'], true)) {
            $configuredDb = (string) config("database.connections.{$driver}.database");
            $lower = strtolower($configuredDb);
            $forbidden = ['', 'fitlie', 'mysql', 'information_schema', 'performance_schema', 'sys', 'phpmyadmin'];
            if (in_array($lower, $forbidden, true) || !str_ends_with($lower, '_test')) {
                $this->fail("Refusing to reset non-isolated {$driver} database '{$configuredDb}'. Database name must end with '_test'.");
            }
            $activeRow = DB::selectOne('SELECT DATABASE() AS db_name');
            $activeDb = strtolower((string) ($activeRow->db_name ?? ''));
            $this->assertSame($lower, $activeDb, "Active MySQL schema '{$activeDb}' does not match isolated test DB '{$lower}'.");
        } else {
            $this->fail("Unsupported test database driver '{$driver}'.");
        }

        Schema::disableForeignKeyConstraints();
        Schema::dropAllTables();
        Schema::enableForeignKeyConstraints();

        foreach ($migrations as $migration) {
            (require database_path('migrations/' . $migration))->up();
        }
    }
}

