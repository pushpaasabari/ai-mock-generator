<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('chapters', function (Blueprint $table) {
            $table->id();
            $table->foreignId('document_id')->constrained()->cascadeOnDelete();
            $table->integer('chapter_number');
            $table->string('title');
            $table->longText('content');
            $table->integer('word_count')->default(0);
            $table->enum('status', ['pending', 'generating', 'done', 'failed'])->default('pending');
            $table->integer('questions_generated')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('chapters');
    }
};
