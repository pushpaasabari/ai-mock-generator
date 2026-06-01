<?php

namespace App\Services;

use App\Models\Chapter;
use App\Models\Document;
use App\Models\QuestionBank;
use OpenAI\Laravel\Facades\OpenAI;
use Illuminate\Support\Facades\Log;

class McqGeneratorService
{
    /**
     * Generate MCQs for a chapter using OpenAI
     */
    public function generateForChapter(Chapter $chapter): array
    {
        set_time_limit(0); // Allow unlimited time — retries can take several minutes
        $chapter->update(['status' => 'generating']);

        try {
            $prompt = $this->buildPrompt($chapter);

            // Retry logic for rate limits
            $maxRetries = 5;
            $retryDelay = 30; // Initial delay in seconds (30s → 60s → 120s...)
            $response = null;

            for ($attempt = 1; $attempt <= $maxRetries; $attempt++) {
                try {
                    $response = OpenAI::chat()->create([
                        'model' => config('openai.model', 'gpt-4o-mini'),
                        'messages' => [
                            [
                                'role' => 'system',
                                'content' => 'You are an expert in creating competitive exam MCQs. You must generate questions in the SAME LANGUAGE as the source text. If the text is in a regional language, the questions, options, and explanations MUST be in that language. If the text is in English, they must be in English. Always respond with valid JSON only.'
                            ],
                            [
                                'role' => 'user',
                                'content' => $prompt
                            ]
                        ],
                        'temperature' => 0.7,
                        'max_tokens' => 2000,
                    ]);
                    break; // Success, exit retry loop
                } catch (\Exception $apiErr) {
                    $isRateLimit = str_contains(strtolower($apiErr->getMessage()), 'rate limit') || $apiErr->getCode() === 429;
                    if ($isRateLimit && $attempt < $maxRetries) {
                        Log::warning("Rate limit hit generating MCQs for chapter {$chapter->id}. Retrying in {$retryDelay}s (Attempt {$attempt}/{$maxRetries})...");
                        sleep($retryDelay);
                        $retryDelay *= 2; // Exponential backoff: 20s, 40s
                        continue;
                    }
                    throw $apiErr; // Re-throw if max retries reached or not a rate limit error
                }
            }

            $content = $response->choices[0]->message->content;

            // Sanitize: ensure the AI response is valid UTF-8 before JSON parsing
            $content = mb_convert_encoding($content, 'UTF-8', 'UTF-8');
            $content = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $content);

            $questions = $this->parseResponse($content);

            // Save questions to DB
            $saved = 0;
            foreach ($questions as $q) {
                if ($this->isValidQuestion($q)) {
                    // Sanitize each field individually to prevent DB encoding errors
                    $question = $this->sanitizeField($q['question']);
                    $options = array_map([$this, 'sanitizeField'], $q['options']);
                    $explanation = isset($q['explanation']) ? $this->sanitizeField($q['explanation']) : null;
                    $topic = isset($q['topic']) ? $this->sanitizeField($q['topic']) : $this->sanitizeField($chapter->title);

                    QuestionBank::create([
                        'document_id' => $chapter->document_id,
                        'chapter_id' => $chapter->id,
                        'question' => $question,
                        'options' => $options,
                        'correct_answer' => strtoupper($q['correct_answer']),
                        'explanation' => $explanation,
                        'difficulty' => $q['difficulty'] ?? 'medium',
                        'topic' => $topic,
                    ]);
                    $saved++;
                }
            }

            $chapter->update([
                'status' => 'done',
                'questions_generated' => $saved
            ]);

            // Update document totals
            $chapter->document->increment('total_questions', $saved);

            return ['success' => true, 'count' => $saved];

        } catch (\Exception $e) {
            // Get a safe ASCII-only error message (exception message may contain broken bytes)
            $rawMsg = preg_replace('/[^\x20-\x7E]/', '?', $e->getMessage());
            Log::error("MCQ Generation failed for chapter {$chapter->id} (Document: {$chapter->document_id}): " . $rawMsg);

            // Build user-facing message
            $errorMessage = $rawMsg;
            if (str_contains($rawMsg, 'rate_limit_exceeded')) {
                $errorMessage = "OpenAI Rate Limit Exceeded. Please try again in a few minutes or check your API quota.";
            } elseif (str_contains($rawMsg, 'UTF-8') || str_contains($rawMsg, 'Malformed') || str_contains($rawMsg, 'JSON')) {
                $errorMessage = "Text encoding error while generating MCQs. The PDF may contain unsupported characters.";
            }

            $chapter->update(['status' => 'failed']);

            // Also update the parent document status if it's the first failure
            if ($chapter->document && $chapter->document->status !== 'failed') {
                $chapter->document->update([
                    'status' => 'failed',
                    'error_message' => "MCQ Generation failed: " . $errorMessage
                ]);
            }

            return ['success' => false, 'error' => $errorMessage];
        }
    }

    private function buildPrompt(Chapter $chapter): string
    {
        $rawText = $this->sanitizeField($chapter->content);
        // Keep text short to reduce token usage and avoid rate limits
        $text = mb_substr($rawText, 0, 1000, 'UTF-8');
        $questionCount = min(5, max(3, intval($chapter->word_count / 150)));

        return <<<PROMPT
Chapter Title: {$chapter->title}

Text Content:
{$text}

Generate exactly {$questionCount} competitive exam style Multiple Choice Questions (MCQs) from the above text.

Requirements:
- LANGUAGE: Generate everything in the same language as the provided text
- Questions must be based ONLY on the provided text
- Each question must have exactly 4 options (A, B, C, D)
- Questions should test factual knowledge, comprehension, and analysis
- Mix of easy, medium and hard difficulty
- Suitable for competitive exams

Return ONLY a valid JSON array with this exact structure:
[
  {
    "question": "Question text here?",
    "options": ["A. Option one", "B. Option two", "C. Option three", "D. Option four"],
    "correct_answer": "A",
    "explanation": "Brief explanation of correct answer",
    "difficulty": "easy|medium|hard",
    "topic": "Sub-topic name"
  }
]
PROMPT;
    }

    private function parseResponse(string $content): array
    {
        // Strip markdown code blocks if present
        $content = preg_replace('/```json\n?/', '', $content);
        $content = preg_replace('/```\n?/', '', $content);
        $content = trim($content);

        $data = json_decode($content, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            // Try to extract JSON array from response
            preg_match('/\[.*\]/s', $content, $matches);
            if (!empty($matches[0])) {
                $data = json_decode($matches[0], true);
            }
        }

        return is_array($data) ? $data : [];
    }

    private function isValidQuestion(array $q): bool
    {
        return isset($q['question']) &&
            isset($q['options']) &&
            is_array($q['options']) &&
            count($q['options']) === 4 &&
            isset($q['correct_answer']) &&
            in_array(strtoupper($q['correct_answer']), ['A', 'B', 'C', 'D']);
    }

    /**
     * Sanitize a string to be valid UTF-8 AND safe for PHP json_encode / MySQL.
     * Uses whitelist approach — only keeps valid UTF-8 byte sequences.
     */
    private function sanitizeField(string $text): string
    {
        if (empty($text)) {
            return '';
        }

        // 1. Strip null bytes and ASCII control chars (keep \t \n \r)
        $text = str_replace("\0", '', $text);
        $text = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', '', $text);

        // 2. Extract only valid UTF-8 sequences (whitelist approach)
        preg_match_all(
            '/[\x09\x0A\x0D\x20-\x7E]'            // ASCII printable + tab/LF/CR
            . '|[\xC2-\xDF][\x80-\xBF]'            // 2-byte sequences
            . '|[\xE0][\xA0-\xBF][\x80-\xBF]'      // 3-byte: E0
            . '|[\xE1-\xEC\xEE\xEF][\x80-\xBF]{2}' // 3-byte: general
            . '|[\xED][\x80-\x9F][\x80-\xBF]'      // 3-byte: ED (no surrogates)
            . '|[\xF0][\x90-\xBF][\x80-\xBF]{2}'   // 4-byte: F0
            . '|[\xF1-\xF3][\x80-\xBF]{3}'          // 4-byte: F1-F3
            . '|[\xF4][\x80-\x8F][\x80-\xBF]{2}/'  // 4-byte: F4
            . 'S',
            $text,
            $matches
        );
        $text = implode('', $matches[0]);

        return trim($text);
    }
}
