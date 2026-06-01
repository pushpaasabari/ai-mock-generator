# 🧠 AI-Powered Competitive Mock Generator

An intelligent SaaS platform that automatically generates competitive exam mock tests using AI. The system processes study materials and dynamically creates structured quizzes — improving exam preparation efficiency for students.

> Built with Laravel 12, MySQL, and OpenAI API

---

## 🚀 Features

- **AI-Powered Question Generation** — Automatically generates MCQ and descriptive questions from study material using OpenAI
- **Dynamic Mock Tests** — Creates structured, timed mock exams tailored to specific subjects and difficulty levels
- **Performance Tracking** — Students can track scores, accuracy, and improvement over time
- **Adaptive Learning** — System adjusts question difficulty based on student performance
- **Scalable Architecture** — Built to handle multiple concurrent users with queue-based processing
- **Secure API** — Token-based authentication with rate limiting

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Backend Framework | Laravel 12 |
| Database | MySQL |
| AI Integration | OpenAI API (GPT) |
| Authentication | Laravel Sanctum |
| Queue Processing | Laravel Queues |
| Server | AWS EC2 / Linux |
| Version Control | Git |

---

## 📁 Project Structure

```
ai-mock-generator/
├── app/
│   ├── Http/Controllers/
│   │   ├── MockController.php       # Mock test generation logic
│   │   ├── QuestionController.php   # Question management
│   │   └── AuthController.php       # Authentication
│   ├── Services/
│   │   ├── OpenAIService.php        # OpenAI API integration
│   │   └── MockGeneratorService.php # Core generation logic
│   ├── Models/
│   │   ├── MockTest.php
│   │   ├── Question.php
│   │   └── StudentResult.php
│   └── Jobs/
│       └── GenerateMockJob.php      # Queue job for async generation
├── database/
│   └── migrations/
├── routes/
│   └── api.php
└── README.md
```

---

## ⚙️ Installation & Setup

### Prerequisites
- PHP 8.2+
- Composer
- MySQL 8.0+
- OpenAI API Key

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/pushpaasabari/ai-mock-generator.git
cd ai-mock-generator

# 2. Install dependencies
composer install

# 3. Copy environment file
cp .env.example .env

# 4. Configure your .env
DB_DATABASE=your_database
DB_USERNAME=your_username
DB_PASSWORD=your_password
OPENAI_API_KEY=your_openai_api_key

# 5. Generate app key
php artisan key:generate

# 6. Run migrations
php artisan migrate

# 7. Start queue worker
php artisan queue:work

# 8. Serve the application
php artisan serve
```

---

## 📡 API Endpoints

```
POST   /api/auth/register          Register new user
POST   /api/auth/login             Login and get token

POST   /api/mock/generate          Generate a new mock test
GET    /api/mock/{id}              Get mock test details
POST   /api/mock/{id}/submit       Submit answers and get results

GET    /api/results                Get student performance history
GET    /api/results/{id}           Get detailed result breakdown
```

---

## 🔑 Key Implementation Highlights

**AI Question Generation**
```php
// OpenAIService.php
public function generateQuestions(string $topic, int $count, string $difficulty): array
{
    $response = $this->client->chat()->create([
        'model'    => 'gpt-4',
        'messages' => [
            ['role' => 'system', 'content' => 'You are an expert exam question creator.'],
            ['role' => 'user',   'content' => "Generate {$count} {$difficulty} MCQ questions on {$topic} in JSON format."]
        ]
    ]);

    return json_decode($response->choices[0]->message->content, true);
}
```

**Queue-Based Async Processing**
```php
// Large mock tests are processed asynchronously
GenerateMockJob::dispatch($mockTest, $topics)->onQueue('mock-generation');
```

---

## 📊 Database Schema (Key Tables)

```sql
mock_tests       → id, title, subject, difficulty, duration, status, user_id
questions        → id, mock_test_id, question_text, options (JSON), correct_answer, marks
student_results  → id, mock_test_id, user_id, score, accuracy, time_taken, answers (JSON)
```

---

## 🏗️ Architecture Overview

```
Client Request
      ↓
Laravel API (REST)
      ↓
MockGeneratorService
      ↓
Queue Job (Async)
      ↓
OpenAI API → Question Generation
      ↓
MySQL Database → Store Questions & Results
```

---

## 🔒 Security Features

- Token-based API authentication (Laravel Sanctum)
- Rate limiting on AI generation endpoints
- Input validation and sanitization
- Environment-based API key management

---

## 👨‍💻 Author

**Sabarinathan Ramalingam**
Backend Engineer | PHP & Laravel | AWS | AI Integration

- 📧 pushpaasabari@gmail.com
- 💼 [LinkedIn](https://www.linkedin.com/in/pushpaasabari/)
- 🐙 [GitHub](https://github.com/pushpaasabari)

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
