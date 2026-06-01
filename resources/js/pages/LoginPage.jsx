import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import toast from 'react-hot-toast';

export default function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        const result = await login(form.email, form.password);
        if (result.success) {
            toast.success('Welcome back! 🎯');
            navigate('/dashboard');
        } else if (result.requiresVerification) {
            navigate(`/verify-email?email=${encodeURIComponent(form.email)}`);
        } else {
            setError(result.error);
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            background: 'white',
        }}>
            {/* Left Panel — Gradeup blue */}
            <div style={{
                flex: 1,
                background: 'linear-gradient(160deg, var(--blue-700) 0%, var(--blue-500) 100%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '60px 48px',
                position: 'relative',
                overflow: 'hidden',
            }} className="auth-left-panel">
                {/* Decorative circles */}
                <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
                <div style={{ position: 'absolute', bottom: -80, left: -40, width: 250, height: 250, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />

                <div style={{ position: 'relative', zIndex: 1, maxWidth: 360, textAlign: 'center', color: 'white' }}>
                    <div style={{
                        width: 64, height: 64, borderRadius: 18, margin: '0 auto 24px',
                        background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32,
                        border: '1px solid rgba(255,255,255,0.3)'
                    }}>🎯</div>

                    <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 12 }}>Prepare with AI</h1>
                    <p style={{ fontSize: 15, opacity: 0.85, lineHeight: 1.7, marginBottom: 32 }}>
                        Competitive Exam Preparation with AI-powered MCQs from your documents
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {[
                            '✅ AI-generated MCQs from your PDFs',
                            '✅ Competitive exam focused questions',
                            '✅ Detailed performance analytics',
                            '✅ Multi-language support',
                        ].map(f => (
                            <div key={f} style={{ textAlign: 'left', fontSize: 13.5, opacity: 0.9 }}>{f}</div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Panel — Login Form */}
            <div style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                padding: '40px 48px', background: 'white', maxWidth: 520,
            }}>
                <div className="scale-in" style={{ width: '100%', maxWidth: 380 }}>
                    <div style={{ marginBottom: 28 }}>
                        <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>
                            Sign in to your account
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 13.5 }}>
                            Don't have an account?{' '}
                            <Link to="/register" style={{ color: 'var(--blue-600)', fontWeight: 600 }}>
                                Register for free
                            </Link>
                        </p>
                    </div>

                    {error && (
                        <div className="alert alert-error">
                            <span>⚠️</span> {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">Email Address</label>
                            <input
                                type="email"
                                className="form-control"
                                placeholder="you@example.com"
                                value={form.email}
                                onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))}
                                required
                                autoFocus
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Password</label>
                            <input
                                type="password"
                                className="form-control"
                                placeholder="Enter your password"
                                value={form.password}
                                onChange={(e) => setForm(p => ({ ...p, password: e.target.value }))}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary w-full"
                            disabled={loading}
                            style={{ justifyContent: 'center', padding: '12px', marginTop: 4, fontSize: 15 }}
                        >
                            {loading ? (
                                <><div className="spinner" style={{ width: 17, height: 17, borderWidth: 2 }} /> Signing in...</>
                            ) : (
                                'Sign In →'
                            )}
                        </button>
                    </form>

                    <div style={{ textAlign: 'center', marginTop: 16 }}>
                        <Link to="/forgot-password" style={{ color: 'var(--blue-600)', fontSize: 13, fontWeight: 600 }}>Forgot Password?</Link>
                    </div>

                    <div style={{ textAlign: 'center', marginTop: 16 }}>
                        <Link to="/" style={{ color: 'var(--text-muted)', fontSize: 13 }}>← Back to Home</Link>
                    </div>
                </div>
            </div>

            {/* Hide left panel on mobile */}
            <style>{`
                @media (max-width: 768px) {
                    .auth-left-panel { display: none !important; }
                }
            `}</style>
        </div>
    );
}
