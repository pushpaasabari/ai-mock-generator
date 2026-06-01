<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->enum('plan', ['free', 'pro'])->default('free')->after('email');
            $table->timestamp('plan_expires_at')->nullable()->after('plan');
            $table->integer('daily_mock_count')->default(0)->after('plan_expires_at');
            $table->date('last_mock_date')->nullable()->after('daily_mock_count');
            $table->string('phone')->nullable()->after('last_mock_date');
            $table->boolean('is_admin')->default(false)->after('phone');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['plan', 'plan_expires_at', 'daily_mock_count', 'last_mock_date', 'phone', 'is_admin']);
        });
    }
};
