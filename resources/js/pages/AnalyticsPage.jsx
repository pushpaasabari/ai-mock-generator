import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../contexts/AuthContext.jsx';
import {
    Chart as ChartJS,
    CategoryScale, LinearScale, PointElement, LineElement,
    BarElement, ArcElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import toast from 'react-hot-toast';

ChartJS.register(
    CategoryScale, LinearScale, PointElement, LineElement,
    BarElement, ArcElement, Title, Tooltip, Legend, Filler
);

const chartDefaults = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: { labels: { color: '#5a6478', font: { family: 'Inter', size: 12, weight: '600' } } },
        tooltip: {
            backgroundColor: '#ffffff',
            titleColor: '#1a1a2e',
            bodyColor: '#5a6478',
            borderColor: '#e4e8f0',
            borderWidth: 1,
            borderRadius: 8,
            padding: 12,
            boxPadding: 6,
            displayColors: true,
        },
    },
    scales: {
        x: { ticks: { color: '#9ba3b5' }, grid: { display: false } },
        y: { ticks: { color: '#9ba3b5' }, grid: { color: '#f0f2f5' }, beginAtZero: true },
    },
};

export default function AnalyticsPage() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        api.get('/analytics/dashboard')
            .then(res => setData(res.data))
            .catch(() => toast.error('Failed to load analytics'))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="loading-overlay"><div className="spinner" /></div>;
    if (!data || !data.summary || data.summary.total_attempts === 0) {
        return (
            <div className="fade-in">
                <div className="page-header">
                    <div>
                        <h1 className="page-title">Performance Analytics</h1>
                        <p className="page-subtitle">Track your preparation journey and progress</p>
                    </div>
                </div>
                <div className="section">
                    <div className="card" style={{ textAlign: 'center', padding: '100px 40px' }}>
                        <div style={{ fontSize: 64, marginBottom: 20 }}>📊</div>
                        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 12 }}>Unlock your analytics</h2>
                        <p style={{ color: 'var(--text-secondary)', maxWidth: 400, margin: '0 auto 24px', fontSize: 14 }}>
                            Take your first mock test tonight to see comprehensive statistics about your strengths and areas for improvement.
                        </p>
                        <button className="btn btn-primary btn-lg" onClick={() => navigate('/mock-tests')}>
                            Start Your First Test
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const s = data.summary;
    const trend = data.trend || [];
    const dist = data.distribution || {};

    const lineData = {
        labels: trend.map(t => t.date),
        datasets: [{
            label: 'Your Accuracy (%)',
            data: trend.map(t => t.score),
            borderColor: '#2d7fea',
            backgroundColor: 'rgba(45,127,234,0.08)',
            borderWidth: 3,
            pointBackgroundColor: '#ffffff',
            pointBorderColor: '#2d7fea',
            pointBorderWidth: 2,
            pointRadius: 5,
            fill: true,
            tension: 0.4,
        }],
    };

    const distLabels = Object.keys(dist);
    const distValues = Object.values(dist);
    const COLORS = ['#22a96a', '#2d7fea', '#ff6b35', '#f5a623', '#9ba3b5', '#e53935'];

    const doughnutData = {
        labels: distLabels,
        datasets: [{
            data: distValues,
            backgroundColor: COLORS.slice(0, distLabels.length),
            borderColor: '#ffffff',
            borderWidth: 4,
            hoverOffset: 10
        }],
    };

    const barData = {
        labels: distLabels,
        datasets: [{
            label: 'Number of Tests',
            data: distValues,
            backgroundColor: COLORS.slice(0, distLabels.length),
            borderRadius: 6,
            barThickness: 30,
        }],
    };

    return (
        <div className="fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Performance Analytics</h1>
                    <p className="page-subtitle">Strategic overview of your TNPSC preparation status</p>
                </div>
            </div>

            {/* Summary Stats Grid */}
            <div className="section">
                <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
                    <div className="stat-card card-accent-blue">
                        <div className="stat-icon blue">📝</div>
                        <div><div className="stat-value">{s.total_attempts}</div><div className="stat-label">Attempts</div></div>
                    </div>
                    <div className="stat-card card-accent-orange">
                        <div className="stat-icon orange">📈</div>
                        <div><div className="stat-value" style={{ color: 'var(--orange-500)' }}>{s.avg_score}%</div><div className="stat-label">Avg Accuracy</div></div>
                    </div>
                    <div className="stat-card card-accent-green">
                        <div className="stat-icon green">🏆</div>
                        <div><div className="stat-value" style={{ color: 'var(--green-600)' }}>{s.best_score}%</div><div className="stat-label">Best Score</div></div>
                    </div>
                    <div className="stat-card card-accent-yellow">
                        <div className="stat-icon yellow">⏱️</div>
                        <div><div className="stat-value" style={{ color: 'var(--yellow-500)' }}>{s.total_time_minutes}m</div><div className="stat-label">Time Spent</div></div>
                    </div>
                    <div className="stat-card" style={{ background: 'var(--blue-700)', color: 'white', border: 'none' }}>
                        <div className="stat-icon" style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>🎓</div>
                        <div><div className="stat-value" style={{ color: 'white' }}>{s.rank_grade}</div><div className="stat-label" style={{ color: 'rgba(255,255,255,0.7)' }}>Grade</div></div>
                    </div>
                </div>
            </div>

            {/* Charts Row */}
            <div className="section">
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 5fr) minmax(0, 3fr)', gap: 16 }}>
                    <div className="card">
                        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ color: 'var(--blue-600)' }}>📈</span> Mastery Progression
                        </h2>
                        <div className="chart-container" style={{ height: 300 }}>
                            <Line data={lineData} options={{ ...chartDefaults }} />
                        </div>
                    </div>
                    <div className="card">
                        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ color: 'var(--orange-500)' }}>🎯</span> Grade Distribution
                        </h2>
                        <div className="chart-container" style={{ height: 300 }}>
                            <Doughnut data={doughnutData} options={{ ...chartDefaults, scales: undefined, plugins: { ...chartDefaults.plugins, legend: { position: 'bottom', labels: { boxWidth: 12, padding: 15 } } } }} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Histogram Row */}
            <div className="section">
                <div className="card">
                    <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ color: 'var(--green-600)' }}>📊</span> Accuracy Distribution by Grade
                    </h2>
                    <div className="chart-container" style={{ height: 260 }}>
                        <Bar data={barData} options={{ ...chartDefaults }} />
                    </div>
                </div>
            </div>

            {/* Recent History */}
            <div className="section" style={{ paddingBottom: 60 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h2 style={{ fontSize: 16, fontWeight: 800 }}>Attempt History</h2>
                </div>
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th style={{ width: '40%' }}>Test Series Name</th>
                                <th>Result</th>
                                <th>Correct</th>
                                <th>Time Taken</th>
                                <th style={{ textAlign: 'right' }}>Analysis</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.recent_attempts?.map(a => (
                                <tr key={a.id}>
                                    <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{a.mock_test?.title}</td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <span style={{ fontWeight: 900, fontSize: 15, color: a.percentage >= 60 ? 'var(--green-600)' : a.percentage >= 40 ? 'var(--orange-500)' : 'var(--red-500)' }}>
                                                {a.percentage}%
                                            </span>
                                            <span className={`badge ${a.percentage >= 60 ? 'badge-green' : a.percentage >= 40 ? 'badge-orange' : 'badge-red'}`} style={{ fontSize: 9 }}>
                                                {a.grade}
                                            </span>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ fontSize: 13 }}>
                                            <span style={{ color: 'var(--green-600)', fontWeight: 700 }}>{a.correct_count}</span>
                                            <span style={{ color: '#ccc', margin: '0 4px' }}>/</span>
                                            <span style={{ color: 'var(--text-muted)' }}>{a.total_questions || 0}</span>
                                        </div>
                                    </td>
                                    <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                                        {formatTimeTaken(a.time_taken_seconds)}
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/result/${a.id}`)}>
                                            View Solution →
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function formatTimeTaken(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
}
