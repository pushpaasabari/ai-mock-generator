<?php
/**
 * REPAIRING PdfProcessingService.php after bad edit
 */
namespace App\Services;

use App\Models\Chapter;
use App\Models\Document;
use Illuminate\Support\Facades\Log;
use OpenAI\Laravel\Facades\OpenAI;
use Smalot\PdfParser\Parser;

class PdfProcessingService
{
    private Parser $parser;

    public function __construct()
    {
        $this->parser = new Parser();
    }

    /**
     * Extract text from a PDF/Image and split into chapters
     */
    public function processDocument(Document $document): array
    {
        $document->update(['status' => 'processing']);

        try {
            set_time_limit(300);
            ini_set('memory_limit', '1024M');
            $filePath = storage_path('app/private/' . $document->file_path);

            if (!file_exists($filePath)) {
                throw new \Exception("File not found: {$filePath}");
            }

            // Route to correct extraction method
            $isImage = ($document->file_type === 'image') ||
                str_starts_with(mime_content_type($filePath) ?? '', 'image/');

            if ($isImage) {
                Log::info("Starting image text extraction for Document ID: {$document->id}");
                $fullText = $this->extractTextFromImage($filePath);
            } else {
                Log::info("Starting PDF parsing for Document ID: {$document->id}");
                $pdf = $this->parser->parseFile($filePath);
                $rawText = $pdf->getText();
                $rawLength = strlen($rawText);
                Log::info("PDF Raw Extraction - Document ID: {$document->id}, Raw Length: {$rawLength} bytes");

                if ($rawLength > 0) {
                    $sample = bin2hex(substr($rawText, 0, 20));
                    Log::debug("Raw text sample (hex): {$sample}");
                } else {
                    $pages = count($pdf->getPages());
                    Log::warning("Raw text returned 0 bytes. PDF has {$pages} pages.");
                }

                $fullText = $this->sanitizeText($rawText);
                $textLength = mb_strlen($fullText, 'UTF-8');
                Log::info("PDF Sanitized - Document ID: {$document->id}, Clean Length: {$textLength} chars");

                if (empty(trim($fullText)) || $textLength < 50) {
                    $pages = count($pdf->getPages());
                    throw new \Exception("Could not extract enough text from PDF. The file might be scanned, image-based, or password protected. Found {$pages} pages but only {$textLength} text characters.");
                }
            }

            // Split into chapters
            $chapters = $this->splitIntoChapters($fullText);

            if (empty($chapters)) {
                $chapters = [['title' => 'Full Document Content', 'content' => $fullText]];
            }

            foreach ($chapters as $index => $chapterData) {
                $title = $this->sanitizeText($chapterData['title']);
                $content = $this->sanitizeText($chapterData['content']);

                Chapter::create([
                    'document_id' => $document->id,
                    'chapter_number' => $index + 1,
                    'title' => $title ?: ('Chapter ' . ($index + 1)),
                    'content' => $content,
                    'word_count' => count(preg_split('/\s+/u', $content, -1, PREG_SPLIT_NO_EMPTY)),
                    'status' => 'pending',
                ]);
            }

            $document->update([
                'status' => 'processed',
                'total_chapters' => count($chapters),
                'error_message' => null
            ]);

            return ['success' => true, 'chapters' => count($chapters)];

        } catch (\Exception $e) {
            Log::error("Processing failed for document {$document->id}: " . $e->getMessage());
            $document->update([
                'status' => 'failed',
                'error_message' => $e->getMessage()
            ]);

            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Use OpenAI Vision to extract text from an image file.
     */
    private function extractTextFromImage(string $filePath): string
    {
        $imageData = base64_encode(file_get_contents($filePath));
        $mimeType = mime_content_type($filePath) ?: 'image/jpeg';
        $dataUrl = "data:{$mimeType};base64,{$imageData}";

        $response = OpenAI::chat()->create([
            'model' => 'gpt-4o',
            'messages' => [
                [
                    'role' => 'user',
                    'content' => [
                        [
                            'type' => 'text',
                            'text' => 'Please extract ALL the text content from this image exactly as it appears. Preserve the structure, headings, and paragraphs. Output only the extracted text, nothing else.',
                        ],
                        [
                            'type' => 'image_url',
                            'image_url' => ['url' => $dataUrl, 'detail' => 'high'],
                        ],
                    ],
                ],
            ],
            'max_tokens' => 4096,
        ]);

        $text = $response->choices[0]->message->content ?? '';
        Log::info('Image OCR extraction completed, length: ' . strlen($text));

        if (empty(trim($text)) || strlen($text) < 30) {
            throw new \Exception('Could not extract readable text from the image. Please ensure the image is clear and contains visible text.');
        }

        return $this->sanitizeText($text);
    }

    /**
     * Split text into chapters using regex patterns
     * Supports both English and Tamil chapter headings
     */
    private function splitIntoChapters(string $text): array
    {
        $chapters = [];

        // Pattern for chapter detection (English + Tamil)
        $pattern = '/(?:Chapter|CHAPTER|Unit|UNIT|பாடம்|அத்தியாயம்|பகுதி|தொகுதி)\s*[:\-]?\s*(\d+|[IVX]+)\s*[:\-]?\s*([^\n]{0,100})/u';

        preg_match_all($pattern, $text, $matches, PREG_OFFSET_CAPTURE);

        if (count($matches[0]) >= 2) {
            for ($i = 0; $i < count($matches[0]); $i++) {
                $start = $matches[0][$i][1];
                $end = isset($matches[0][$i + 1]) ? $matches[0][$i + 1][1] : strlen($text);

                $chapterTitle = trim($matches[0][$i][0]);
                $chapterContent = trim(substr($text, $start, $end - $start));

                if (strlen($chapterContent) > 200) { // Skip very short chapters
                    $chapters[] = [
                        'title' => $chapterTitle,
                        'content' => $chapterContent,
                    ];
                }
            }
        }

        if (empty($chapters)) {
            $chunks = preg_split('/\n{4,}/', $text, -1, PREG_SPLIT_NO_EMPTY);
            foreach ($chunks as $i => $chunk) {
                if (strlen(trim($chunk)) > 300) {
                    $firstLine = trim(explode("\n", $chunk)[0]);
                    $chapters[] = [
                        'title' => strlen($firstLine) < 100 ? $firstLine : "Section " . ($i + 1),
                        'content' => trim($chunk),
                    ];
                }
            }
        }

        return $chapters;
    }

    /**
     * Sanitize text to be valid UTF-8 AND safe for MySQL/json_encode.
     */
    private function sanitizeText(string $text): string
    {
        if (empty($text)) {
            return '';
        }
        $text = str_replace("\0", '', $text);
        $text = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', '', $text);
        $clean = '';
        preg_match_all(
            '/[\x09\x0A\x0D\x20-\x7E]'           // ASCII printable + tab/LF/CR
            . '|[\xC2-\xDF][\x80-\xBF]'           // 2-byte sequences
            . '|[\xE0][\xA0-\xBF][\x80-\xBF]'     // 3-byte: E0
            . '|[\xE1-\xEC\xEE\xEF][\x80-\xBF]{2}' // 3-byte: general
            . '|[\xED][\x80-\x9F][\x80-\xBF]'     // 3-byte: ED (excludes surrogates)
            . '|[\xF0][\x90-\xBF][\x80-\xBF]{2}' // 4-byte: F0
            . '|[\xF1-\xF3][\x80-\xBF]{3}'        // 4-byte: F1-F3
            . '|[\xF4][\x80-\x8F][\x80-\xBF]{2}/' // 4-byte: F4
            . 'S',
            $text,
            $matches
        );
        $text = implode('', $matches[0]);
        return trim($text);
    }
}
