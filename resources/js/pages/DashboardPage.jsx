import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { api } from '../contexts/AuthContext.jsx';

export default function DashboardPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [recentAttempts, setRecentAttempts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [analyticsRes] = await Promise.all([
                    api.get('/analytics/dashboard'),
                ]);
                setStats(analyticsRes.data.summary);
                setRecentAttempts(analyticsRes.data.recent_attempts || []);
            } catch (err) {
                setStats({ total_attempts: 0, avg_score: 0, best_score: 0, total_time_minutes: 0 });
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const statCards = [
        { icon: '📝', label: 'Tests Taken', value: stats?.total_attempts ?? '-', color: 'blue' },
        { icon: '📈', label: 'Average Score', value: stats?.avg_score ? `${stats.avg_score}%` : '-', color: 'orange' },
        { icon: '🏆', label: 'Best Score', value: stats?.best_score ? `${stats.best_score}%` : '-', color: 'green' },
        { icon: '⏱️', label: 'Study Time', value: stats?.total_time_minutes ? `${stats.total_time_minutes}m` : '-', color: 'yellow' },
    ];

    const grade = stats?.avg_score >= 80 ? 'A' : stats?.avg_score >= 60 ? 'B' : stats?.avg_score >= 40 ? 'C' : 'D';

    return (
        <div className="fade-in">
            {/* Welcome Banner — Gradeup blue */}
            <div style={{ padding: '20px 24px 0' }}>
                <div className="exam-banner" style={{ marginBottom: 20 }}>
                    <div>
                        <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.8, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
                            🎓 TNPSC Preparation Platform
                        </div>
                        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'white', marginBottom: 6 }}>
                            வணக்கம், {user?.name?.split(' ')[0]}! 👋
                        </h1>
                        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13.5 }}>
                            {user?.is_pro
                                ? '✅ Unlimited access — Keep practicing!'
                                : `Free Plan · ${3 - (user?.daily_mock_count || 0)} mock tests remaining today`}
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
                        <button className="btn" onClick={() => navigate('/documents')} style={{
                            background: 'rgba(255,255,255,0.15)', color: 'white',
                            border: '1.5px solid rgba(255,255,255,0.3)', backdropFilter: 'blur(4px)'
                        }}>
                            📚 Study Material
                        </button>
                        <button className="btn btn-orange" onClick={() => navigate('/mock-tests')}>
                            🚀 Start Test
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="section">
                <div className="stats-grid">
                    {statCards.map((s) => (
                        <div className="stat-card" key={s.label}>
                            <div className={`stat-icon ${s.color}`}>{s.icon}</div>
                            <div>
                                <div className="stat-value">
                                    {loading ? <div className="skeleton" style={{ width: 55, height: 26 }} /> : s.value}
                                </div>
                                <div className="stat-label">{s.label}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Grade + Recent */}
            <div className="section" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16, alignItems: 'start' }}>
                {/* Grade Card */}
                <div className="card card-accent-blue" style={{ textAlign: 'center', padding: '24px 16px' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                        Overall Grade
                    </div>
                    <div style={{
                        width: 72, height: 72, borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--blue-600), var(--blue-400))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 12px',
                        fontSize: 32, fontWeight: 900, color: 'white',
                        boxShadow: 'var(--shadow-blue)'
                    }}>
                        {loading ? '—' : grade}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                        Based on {stats?.total_attempts ?? 0} tests
                    </div>
                    <div style={{ marginTop: 16 }}>
                        <button className="btn btn-primary btn-sm w-full" onClick={() => navigate('/analytics')}>
                            View Details
                        </button>
                    </div>
                </div>

                {/* Recent Attempts */}
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <h2 style={{ fontSize: 15, fontWeight: 700 }}>Recent Test Attempts</h2>
                        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/analytics')}>View All →</button>
                    </div>

                    {loading ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 56, borderRadius: 10 }} />)}
                        </div>
                    ) : recentAttempts.length === 0 ? (
                        <div className="card" style={{ textAlign: 'center', padding: '32px 20px' }}>
                            <div style={{ fontSize: 40, marginBottom: 10 }}>📋</div>
                            <div style={{ fontWeight: 700, marginBottom: 6 }}>No attempts yet</div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 14 }}>
                                Upload a PDF and take your first mock test
                            </div>
                            <button className="btn btn-primary btn-sm" onClick={() => navigate('/mock-tests')}>
                                Start Practice Test
                            </button>
                        </div>
                    ) : (
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Test Name</th>
                                        <th>Score</th>
                                        <th>Correct</th>
                                        <th>Wrong</th>
                                        <th>Time</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentAttempts.map(attempt => (
                                        <tr key={attempt.id} style={{ cursor: 'pointer' }}
                                            onClick={() => navigate(`/result/${attempt.id}`)}>
                                            <td style={{ fontWeight: 600 }}>{attempt.mock_test?.title || 'Test'}</td>
                                            <td>
                                                <span style={{
                                                    fontWeight: 800,
                                                    color: attempt.percentage >= 60 ? 'var(--green-500)'
                                                        : attempt.percentage >= 40 ? 'var(--yellow-500)'
                                                            : 'var(--red-500)'
                                                }}>
                                                    {attempt.percentage}%
                                                </span>
                                            </td>
                                            <td style={{ color: 'var(--green-600)', fontWeight: 600 }}>✓ {attempt.correct_count}</td>
                                            <td style={{ color: 'var(--red-500)', fontWeight: 600 }}>✗ {attempt.wrong_count}</td>
                                            <td style={{ color: 'var(--text-secondary)' }}>{Math.floor(attempt.time_taken_seconds / 60)}m</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="section">
                <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Quick Access</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                    {[
                        { icon: '📖', title: 'Study Material', desc: 'Browse Tamil PDFs', path: '/documents', color: 'blue' },
                        { icon: '🎯', title: 'Mock Tests', desc: 'Practice with MCQs', path: '/mock-tests', color: 'orange' },
                        { icon: '📊', title: 'Analytics', desc: 'Track your progress', path: '/analytics', color: 'green' },
                    ].map(action => (
                        <div
                            key={action.path}
                            className="card"
                            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}
                            onClick={() => navigate(action.path)}
                        >
                            <div className={`stat-icon ${action.color}`} style={{ fontSize: 22 }}>{action.icon}</div>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: 14 }}>{action.title}</div>
                                <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{action.desc}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Info Strip */}
            <div className="section">
                <div className="info-strip">
                    💡 <strong>Tip:</strong> Regular practice of 10–15 questions daily can significantly improve your TNPSC exam score!
                </div>
            </div>
        </div>
    );
}
