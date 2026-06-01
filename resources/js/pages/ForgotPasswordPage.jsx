import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../contexts/AuthContext.jsx';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/forgot-password', { email });
            toast.success('OTP sent to your email!');
            navigate(`/reset-password?email=${encodeURIComponent(email)}`);
        } catch (err) {
            const retryAfter = err.response?.data?.retry_after;
            if (retryAfter) {
                toast.error(`Please wait ${Math.ceil(retryAfter)}s before requesting another OTP.`);
            } else {
                toast.error(err.response?.data?.message || err.response?.data?.error || 'Email not found');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 60%, #0f3460 100%)', padding: 20
        }}>
            <div style={{
                background: 'white', borderRadius: 20, padding: '44px 40px', width: '100%', maxWidth: 420,
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
            }}>
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>🔑</div>
                    <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1a1a2e', margin: 0 }}>Forgot Password?</h1>
                    <p style={{ fontSize: 14, color: '#666', marginTop: 8, lineHeight: 1.5 }}>
                        No worries! Enter your registered email and we'll send you an OTP to reset your password.
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: 20 }}>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
                            Email Address
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            required
                            autoFocus
                            style={{
                                width: '100%', padding: '12px 14px', borderRadius: 10, border: '2px solid #e2e8f0',
                                fontSize: 14, outline: 'none', boxSizing: 'border-box', transition: 'border 0.2s'
                            }}
                            onFocus={e => e.target.style.borderColor = '#2d7fea'}
                            onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !email}
                        style={{
                            width: '100%', padding: '13px', borderRadius: 10, border: 'none',
                            background: email ? 'linear-gradient(135deg, #2d7fea, #6c47ff)' : '#d1d5db',
                            color: 'white', fontSize: 15, fontWeight: 700,
                            cursor: email ? 'pointer' : 'not-allowed', marginBottom: 16
                        }}
                    >
                        {loading ? 'Sending OTP...' : '📨 Send Reset OTP'}
                    </button>
                </form>

                <div style={{ textAlign: 'center', paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
                    <Link to="/login" style={{ fontSize: 13, color: '#888', textDecoration: 'none' }}>
                        ← Back to Login
                    </Link>
                </div>
            </div>
        </div>
    );
}
