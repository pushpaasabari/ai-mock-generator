import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { api } from '../contexts/AuthContext.jsx';
import toast from 'react-hot-toast';

export default function ResetPasswordPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [email, setEmail] = useState(searchParams.get('email') || '');
    const [otp, setOtp] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPass, setShowPass] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== passwordConfirmation) {
            toast.error('Passwords do not match');
            return;
        }
        if (otp.length !== 6) {
            toast.error('Please enter the 6-digit OTP');
            return;
        }
        setLoading(true);
        try {
            const res = await api.post('/reset-password', {
                email, otp, password, password_confirmation: passwordConfirmation
            });
            toast.success(res.data.message || 'Password reset successfully!');
            navigate('/login');
        } catch (err) {
            toast.error(err.response?.data?.error || err.response?.data?.message || 'Reset failed');
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
                background: 'white', borderRadius: 20, padding: '44px 40px', width: '100%', maxWidth: 440,
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
            }}>
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>🔒</div>
                    <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1a1a2e', margin: 0 }}>Reset Password</h1>
                    <p style={{ fontSize: 14, color: '#666', marginTop: 8 }}>
                        Enter the OTP sent to <strong style={{ color: '#2d7fea' }}>{email}</strong> and your new password.
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Email (editable in case it wasn't pre-filled) */}
                    {!searchParams.get('email') && (
                        <div style={{ marginBottom: 16 }}>
                            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Email</label>
                            <input
                                type="email" value={email} onChange={e => setEmail(e.target.value)}
                                placeholder="you@example.com" required
                                style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '2px solid #e2e8f0', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                                onFocus={e => e.target.style.borderColor = '#2d7fea'}
                                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                            />
                        </div>
                    )}

                    {/* OTP */}
                    <div style={{ marginBottom: 16 }}>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>OTP (6 digits)</label>
                        <input
                            type="text" inputMode="numeric" maxLength={6}
                            value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                            placeholder="● ● ● ● ● ●"
                            style={{
                                width: '100%', padding: '12px 16px', borderRadius: 10, border: '2px solid #e2e8f0',
                                fontSize: 24, fontWeight: 800, textAlign: 'center', letterSpacing: 10,
                                outline: 'none', boxSizing: 'border-box', fontFamily: 'monospace', color: '#2d7fea'
                            }}
                            onFocus={e => e.target.style.borderColor = '#2d7fea'}
                            onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                            autoFocus
                        />
                    </div>

                    {/* New Password */}
                    <div style={{ marginBottom: 16 }}>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>New Password</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showPass ? 'text' : 'password'} value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="Min. 8 characters" required minLength={8}
                                style={{ width: '100%', padding: '12px 44px 12px 14px', borderRadius: 10, border: '2px solid #e2e8f0', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                                onFocus={e => e.target.style.borderColor = '#2d7fea'}
                                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                            />
                            <button type="button" onClick={() => setShowPass(s => !s)}
                                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#888' }}>
                                {showPass ? '🙈' : '👁️'}
                            </button>
                        </div>
                    </div>

                    {/* Confirm Password */}
                    <div style={{ marginBottom: 24 }}>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Confirm New Password</label>
                        <input
                            type={showPass ? 'text' : 'password'} value={passwordConfirmation}
                            onChange={e => setPasswordConfirmation(e.target.value)}
                            placeholder="Re-enter new password" required
                            style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: `2px solid ${passwordConfirmation && password !== passwordConfirmation ? '#ef4444' : '#e2e8f0'}`, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                            onFocus={e => e.target.style.borderColor = password !== passwordConfirmation ? '#ef4444' : '#2d7fea'}
                            onBlur={e => e.target.style.borderColor = password !== passwordConfirmation && passwordConfirmation ? '#ef4444' : '#e2e8f0'}
                        />
                        {passwordConfirmation && password !== passwordConfirmation && (
                            <p style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>Passwords do not match</p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={loading || otp.length !== 6 || !password || password !== passwordConfirmation}
                        style={{
                            width: '100%', padding: '13px', borderRadius: 10, border: 'none',
                            background: (otp.length === 6 && password && password === passwordConfirmation)
                                ? 'linear-gradient(135deg, #2d7fea, #6c47ff)' : '#d1d5db',
                            color: 'white', fontSize: 15, fontWeight: 700,
                            cursor: (otp.length === 6 && password && password === passwordConfirmation) ? 'pointer' : 'not-allowed',
                            marginBottom: 16
                        }}
                    >
                        {loading ? 'Resetting...' : '🔒 Reset Password'}
                    </button>
                </form>

                <div style={{ textAlign: 'center', paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
                    <Link to="/forgot-password" style={{ fontSize: 13, color: '#888', textDecoration: 'none', marginRight: 12 }}>
                        ← Resend OTP
                    </Link>
                    <Link to="/login" style={{ fontSize: 13, color: '#2d7fea', textDecoration: 'none', fontWeight: 600 }}>
                        Back to Login
                    </Link>
                </div>
            </div>
        </div>
    );
}
