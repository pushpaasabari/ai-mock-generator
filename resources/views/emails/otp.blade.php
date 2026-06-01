<!DOCTYPE html>
<html>

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $purpose === 'password_reset' ? 'Reset Your Password' : 'Verify Your Email' }} — Prepare with AI</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            background: #f0f4ff;
            font-family: 'Segoe UI', Arial, sans-serif;
        }

        .wrapper {
            max-width: 480px;
            margin: 40px auto;
            background: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 24px rgba(45, 127, 234, 0.10);
        }

        .header {
            background: linear-gradient(135deg, #2d7fea 0%, #6c47ff 100%);
            padding: 36px 32px 28px;
            text-align: center;
        }

        .logo {
            font-size: 22px;
            font-weight: 800;
            color: #fff;
            letter-spacing: -0.5px;
            margin-bottom: 4px;
        }

        .header-sub {
            font-size: 13px;
            color: rgba(255, 255, 255, 0.8);
        }

        .body {
            padding: 36px 32px;
        }

        .greeting {
            font-size: 15px;
            color: #1a1a2e;
            margin-bottom: 12px;
        }

        .desc {
            font-size: 14px;
            color: #555;
            line-height: 1.6;
            margin-bottom: 28px;
        }

        .otp-box {
            background: #f0f4ff;
            border: 2px dashed #2d7fea;
            border-radius: 12px;
            text-align: center;
            padding: 24px 16px;
            margin-bottom: 28px;
        }

        .otp-label {
            font-size: 11px;
            color: #888;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 10px;
        }

        .otp-code {
            font-size: 42px;
            font-weight: 900;
            letter-spacing: 12px;
            color: #2d7fea;
            font-family: 'Courier New', monospace;
        }

        .otp-validity {
            font-size: 12px;
            color: #e74c3c;
            margin-top: 10px;
            font-weight: 600;
        }

        .note {
            font-size: 12px;
            color: #999;
            line-height: 1.6;
            margin-top: 8px;
        }

        .footer {
            background: #f8fafc;
            padding: 20px 32px;
            text-align: center;
            font-size: 11px;
            color: #aaa;
            border-top: 1px solid #eee;
        }

        .footer strong {
            color: #2d7fea;
        }
    </style>
</head>

<body>
    <div class="wrapper">
        <div class="header">
            <div class="logo">🎯 Prepare with AI</div>
            <div class="header-sub">AI-Powered Exam Preparation Platform</div>
        </div>
        <div class="body">
            <div class="greeting">Hello{{ $userName ? ', ' . $userName : '' }}! 👋</div>
            <div class="desc">
                @if($purpose === 'password_reset')
                    We received a request to <strong>reset your password</strong>. Use the OTP below to set a new password.
                    If you did not request this, please ignore this email.
                @else
                    Thank you for signing up! Please use the OTP below to <strong>verify your email address</strong> and
                    activate your account.
                @endif
            </div>

            <div class="otp-box">
                <div class="otp-label">Your One-Time Password</div>
                <div class="otp-code">{{ $otp }}</div>
                <div class="otp-validity">⏱ Valid for 10 minutes only</div>
            </div>

            <div class="note">
                Do not share this OTP with anyone. Our team will never ask for your OTP.<br>
                If you did not request this, you can safely ignore this email.
            </div>
        </div>
        <div class="footer">
            Sent by <strong>Prepare with AI</strong> &mdash; AI Exam Prep &bull; {{ date('d M Y') }}
        </div>
    </div>
</body>

</html>