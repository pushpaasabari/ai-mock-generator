import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import toast from 'react-hot-toast';

export default function RegisterPage() {
    const { register } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ name: '', email: '', password: '', password_confirmation: '', phone: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (form.password !== form.password_confirmation) {
            setError('Passwords do not match');
            return;
        }
        setLoading(true);
        setError('');
        const result = await register(form);
        if (result.success) {
            toast.success('Account created! Check your email for the OTP 📧');
            navigate(`/verify-email?email=${encodeURIComponent(result.email || form.email)}`);
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

                    <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 12 }}>Join the Pro Team</h1>
                    <p style={{ fontSize: 15, opacity: 0.85, lineHeight: 1.7, marginBottom: 32 }}>
                        "Consistent practice is the only path to exam success." - Start your journey with 3 free mock tests every day.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {[
                            '🚀 Real-time CBT Exam Experience',
                            '📊 Topic-wise Performance Analytics',
                            '📖 Access to 5000+ AI-generated MCQs',
                            '📱 Mobile-friendly study dashboard',
                        ].map(f => (
                            <div key={f} style={{ textAlign: 'left', fontSize: 13.5, opacity: 0.9 }}>{f}</div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Panel — Register Form */}
            <div style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                padding: '40px 48px', background: 'white', maxWidth: 520,
            }}>
                <div className="scale-in" style={{ width: '100%', maxWidth: 380 }}>
                    <div style={{ marginBottom: 28 }}>
                        <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>
                            Create your free account
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 13.5 }}>
                            Already have an account?{' '}
                            <Link to="/login" style={{ color: 'var(--blue-600)', fontWeight: 600 }}>
                                Sign in here
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
                            <label className="form-label">Full Name</label>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="e.g. Arul Kumar"
                                value={form.name}
                                onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Email Address</label>
                            <input
                                type="email"
                                className="form-control"
                                placeholder="you@example.com"
                                value={form.email}
                                onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))}
                                required
                            />
                        </div>

                        <div className="grid-2">
                            <div className="form-group">
                                <label className="form-label">Password</label>
                                <input
                                    type="password"
                                    className="form-control"
                                    placeholder="Min. 8 chars"
                                    value={form.password}
                                    onChange={(e) => setForm(p => ({ ...p, password: e.target.value }))}
                                    required
                                    minLength={8}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Confirm</label>
                                <input
                                    type="password"
                                    className="form-control"
                                    placeholder="Repeat it"
                                    value={form.password_confirmation}
                                    onChange={(e) => setForm(p => ({ ...p, password_confirmation: e.target.value }))}
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary w-full"
                            disabled={loading}
                            style={{ justifyContent: 'center', padding: '12px', marginTop: 10, fontSize: 15 }}
                        >
                            {loading ? (
                                <><div className="spinner" style={{ width: 17, height: 17, borderWidth: 2 }} /> Creating Account...</>
                            ) : (
                                'Create Free Account →'
                            )}
                        </button>
                    </form>

                    <p style={{ textAlign: 'center', marginTop: 16, fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                        By signing up, you agree to our Terms of Service and Privacy Policy. Free plan includes 3 tests daily.
                    </p>

                    <div style={{ textAlign: 'center', marginTop: 24 }}>
                        <Link to="/" style={{ color: 'var(--text-muted)', fontSize: 13 }}>← Back to Home</Link>
                    </div>
                </div>
            </div>

            {/* Mobile Styles */}
            <style>{`
                @media (max-width: 768px) {
                    .auth-left-panel { display: none !important; }
                }
            `}</style>
        </div>
    );
}
