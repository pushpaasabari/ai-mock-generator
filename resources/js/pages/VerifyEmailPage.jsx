import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { api } from '../contexts/AuthContext.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import toast from 'react-hot-toast';

export default function VerifyEmailPage() {
    const [searchParams] = useSearchParams();
    const email = searchParams.get('email') || '';
    const navigate = useNavigate();
    const { isAuth } = useAuth();

    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [cooldown, setCooldown] = useState(0);

    useEffect(() => {
        if (isAuth) navigate('/dashboard', { replace: true });
    }, [isAuth, navigate]);

    useEffect(() => {
        if (cooldown <= 0) return;
        const t = setInterval(() => setCooldown(c => c - 1), 1000);
        return () => clearInterval(t);
    }, [cooldown]);

    const handleVerify = async (e) => {
        e.preventDefault();
        if (otp.length !== 6) { toast.error('Please enter the 6-digit OTP'); return; }
        setLoading(true);
        try {
            const res = await api.post('/verify-email', { email, otp });
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            toast.success(res.data.message || 'Email verified! Welcome 🎉');
            window.location.href = '/dashboard';
        } catch (err) {
            toast.error(err.response?.data?.error || 'Verification failed');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (cooldown > 0) return;
        setResending(true);
        try {
            await api.post('/resend-otp', { email });
            toast.success('New OTP sent to your email!');
            setCooldown(60);
        } catch (err) {
            const retryAfter = err.response?.data?.retry_after;
            if (retryAfter) {
                setCooldown(Math.ceil(retryAfter));
                toast.error(`Please wait ${Math.ceil(retryAfter)}s before resending.`);
            } else {
                toast.error(err.response?.data?.error || 'Failed to resend OTP');
            }
        } finally {
            setResending(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 60%, #0f3460 100%)',
            padding: 20
        }}>
            <div style={{
                background: 'white', borderRadius: 20, padding: '44px 40px', width: '100%', maxWidth: 420,
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
            }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>📧</div>
                    <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1a1a2e', margin: 0 }}>Verify Your Email</h1>
                    <p style={{ fontSize: 14, color: '#666', marginTop: 8, lineHeight: 1.5 }}>
                        We sent a 6-digit OTP to<br />
                        <strong style={{ color: '#2d7fea' }}>{email}</strong>
                    </p>
                </div>

                <form onSubmit={handleVerify}>
                    <div style={{ marginBottom: 20 }}>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
                            Enter OTP
                        </label>
                        <input
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            value={otp}
                            onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                            placeholder="● ● ● ● ● ●"
                            style={{
                                width: '100%', padding: '14px 16px', borderRadius: 10, border: '2px solid #e2e8f0',
                                fontSize: 28, fontWeight: 800, textAlign: 'center', letterSpacing: 12,
                                outline: 'none', boxSizing: 'border-box', fontFamily: 'monospace',
                                color: '#2d7fea', transition: 'border 0.2s'
                            }}
                            onFocus={e => e.target.style.borderColor = '#2d7fea'}
                            onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                            autoFocus
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading || otp.length !== 6}
                        style={{
                            width: '100%', padding: '13px', borderRadius: 10, border: 'none',
                            background: otp.length === 6 ? 'linear-gradient(135deg, #2d7fea, #6c47ff)' : '#d1d5db',
                            color: 'white', fontSize: 15, fontWeight: 700, cursor: otp.length === 6 ? 'pointer' : 'not-allowed',
                            transition: 'all 0.2s', marginBottom: 16
                        }}
                    >
                        {loading ? 'Verifying...' : '✅ Verify Email'}
                    </button>
                </form>

                <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: 13, color: '#888', marginBottom: 8 }}>Didn't receive the OTP?</p>
                    <button
                        onClick={handleResend}
                        disabled={resending || cooldown > 0}
                        style={{
                            background: 'none', border: 'none', color: cooldown > 0 ? '#aaa' : '#2d7fea',
                            fontSize: 13, fontWeight: 600, cursor: cooldown > 0 ? 'not-allowed' : 'pointer', padding: 0
                        }}
                    >
                        {resending ? 'Sending...' : cooldown > 0 ? `Resend OTP (${cooldown}s)` : 'Resend OTP'}
                    </button>
                </div>

                <div style={{ textAlign: 'center', marginTop: 24, paddingTop: 20, borderTop: '1px solid #f0f0f0' }}>
                    <Link to="/login" style={{ fontSize: 13, color: '#888', textDecoration: 'none' }}>
                        ← Back to Login
                    </Link>
                </div>
            </div>
        </div>
    );
}
