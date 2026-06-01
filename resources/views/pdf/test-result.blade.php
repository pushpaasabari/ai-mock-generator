<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <style>
        * {
            font-family: 'DejaVu Sans', Arial, sans-serif !important;
        }

        @page {
            margin: 50px;
        }

        body {
            font-size: 12px;
            color: #333;
            line-height: 1.5;
        }

        .header {
            text-align: center;
            border-bottom: 2px solid #2d7fea;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }

        .app-name {
            font-size: 24px;
            font-weight: bold;
            color: #2d7fea;
            margin-bottom: 5px;
        }

        .test-title {
            font-size: 18px;
            font-weight: bold;
            color: #1a1a2e;
        }

        .summary-box {
            background: #f0f6ff;
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 30px;
            overflow: hidden;
        }

        .summary-item {
            float: left;
            width: 25%;
            text-align: center;
        }

        .summary-label {
            font-size: 10px;
            color: #666;
            font-weight: bold;
            margin-bottom: 5px;
        }

        .summary-value {
            font-size: 18px;
            font-weight: bold;
            color: #2d7fea;
        }

        .clear {
            clear: both;
        }

        .question-card {
            margin-bottom: 30px;
            border-bottom: 1px solid #eee;
            padding-bottom: 20px;
            page-break-inside: avoid;
        }

        .q-header {
            display: block;
            margin-bottom: 10px;
        }

        .q-number {
            font-weight: bold;
            color: #2d7fea;
            font-size: 14px;
            margin-right: 10px;
        }

        .q-topic {
            float: right;
            background: #eee;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 10px;
        }

        .q-text {
            font-size: 14px;
            color: #1a1a2e;
            margin-bottom: 15px;
            font-weight: bold;
        }

        .options {
            margin-left: 20px;
            margin-bottom: 15px;
        }

        .option {
            margin-bottom: 5px;
            padding: 5px 10px;
            border-radius: 4px;
        }

        .option-label {
            font-weight: bold;
            margin-right: 8px;
        }

        .option.correct {
            background: #e8f5e9;
            border: 1px solid #81c784;
        }

        .option.selected-wrong {
            background: #ffebee;
            border: 1px solid #e57373;
        }

        .explanation {
            background: #fff8e1;
            border-left: 4px solid #ffb300;
            padding: 10px 15px;
            margin-top: 10px;
            font-size: 11px;
        }

        .exp-title {
            font-weight: bold;
            color: #8a6500;
            margin-bottom: 5px;
        }

        .section-title {
            font-size: 16px;
            font-weight: bold;
            color: #1a1a2e;
            margin: 30px 0 15px;
            border-bottom: 2px solid #2d7fea;
            padding-bottom: 5px;
        }

        .topic-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
        }

        .topic-table th,
        .topic-table td {
            border: 1px solid #e2e8f0;
            padding: 10px;
            text-align: left;
        }

        .topic-table th {
            background-color: #f8fafc;
            font-size: 11px;
            text-transform: uppercase;
            color: #64748b;
        }

        .topic-table td {
            font-size: 12px;
        }

        .topic-table tr:nth-child(even) {
            background-color: #f8fafc;
        }

        .footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            text-align: center;
            font-size: 10px;
            color: #999;
            border-top: 1px solid #eee;
            padding-top: 10px;
        }
    </style>
</head>

<body>
    <div class="header">
        <div class="app-name">Prepare with AI</div>
        <div class="test-title">{{ $mockTest->title }}</div>
        <div style="font-size: 11px; color: #666; margin-top: 5px;">Performance Report for Attempt #{{ $attempt->id }}
        </div>
        <div
            style="font-size: 10px; color: #888; margin-top: 6px; background: #f5f5f5; display: inline-block; padding: 3px 10px; border-radius: 4px;">
            &#127758; PDF available in <strong>English</strong> only &mdash; other languages <em>coming soon</em>
        </div>
    </div>

    <div class="summary-box">
        <div class="summary-item" style="width: 20%;">
            <div class="summary-label">PERCENTAGE</div>
            <div class="summary-value">{{ $attempt->percentage }}%</div>
        </div>
        <div class="summary-item" style="width: 20%;">
            <div class="summary-label">GRADE</div>
            <div class="summary-value" style="color: #ed8936;">{{ $grade }}</div>
        </div>
        <div class="summary-item" style="width: 20%;">
            <div class="summary-label">CORRECT</div>
            <div class="summary-value" style="color: #27ae60;">{{ $attempt->correct_count }}</div>
        </div>
        <div class="summary-item" style="width: 20%;">
            <div class="summary-label">INCORRECT</div>
            <div class="summary-value" style="color: #e74c3c;">{{ $attempt->wrong_count }}</div>
        </div>
        <div class="summary-item" style="width: 20%;">
            <div class="summary-label">TIME TAKEN</div>
            <div class="summary-value" style="color: #666;">{{ gmdate("H:i:s", $attempt->time_taken_seconds) }}</div>
        </div>
        <div class="clear"></div>
    </div>

    <h2 class="section-title">Topic-wise Performance Analysis</h2>
    <table class="topic-table">
        <thead>
            <tr>
                <th>Subject / Topic</th>
                <th>Total</th>
                <th>Correct</th>
                <th>Wrong</th>
                <th>Skipped</th>
                <th>Accuracy</th>
            </tr>
        </thead>
        <tbody>
            @foreach($topicAnalysis as $ta)
                <tr>
                    <td>{{ $ta['topic'] }}</td>
                    <td>{{ $ta['total'] }}</td>
                    <td style="color: #2e7d32;">{{ $ta['correct'] }}</td>
                    <td style="color: #c62828;">{{ $ta['wrong'] }}</td>
                    <td>{{ $ta['skipped'] }}</td>
                    <td style="font-weight: bold;">{{ $ta['accuracy'] }}%</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <h2 class="section-title">Question Review & Explanations</h2>

    @foreach($questions as $index => $q)
        <div class="question-card">
            <div class="q-header">
                <span class="q-number">Question {{ $index + 1 }}</span>
                <span class="q-topic">{{ $q['topic'] ?? 'General' }}</span>
            </div>
            <div class="q-text">{{ $q['question'] }}</div>

            <div class="options">
                @foreach(['A', 'B', 'C', 'D'] as $optIndex => $letter)
                    @php
                        $isCorrect = $letter === $q['correct_answer'];
                        $isSelected = $letter === $q['selected_answer'];
                        $class = '';
                        if ($isCorrect)
                            $class = 'correct';
                        elseif ($isSelected && !$isCorrect)
                            $class = 'selected-wrong';
                    @endphp
                    <div class="option {{ $class }}">
                        <span class="option-label">{{ $letter }}.</span>
                        {{ str_replace(['A. ', 'B. ', 'C. ', 'D. '], '', $q['options'][$optIndex] ?? '') }}

                        @if($isCorrect)
                            <span style="float: right; color: #2e7d32; font-weight: bold; font-size: 10px;">[CORRECT]</span>
                        @endif
                        @if($isSelected && !$isCorrect)
                            <span style="float: right; color: #c62828; font-weight: bold; font-size: 10px;">[YOUR ANSWER]</span>
                        @endif
                        <div style="clear: both;"></div>
                    </div>
                @endforeach
            </div>

            @if($q['explanation'])
                <div class="explanation">
                    <div class="exp-title">💡 Explanation & Solution:</div>
                    {{ $q['explanation'] }}
                </div>
            @endif
        </div>
    @endforeach

    <div class="footer">
        Generated by Prepare with AI Platform &bull; {{ date('d M Y, h:i A') }} &bull; PDF (English only &mdash; other
        languages coming soon)
    </div>
</body>

</html>