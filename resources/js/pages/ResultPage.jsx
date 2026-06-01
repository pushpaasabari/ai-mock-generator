import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../contexts/AuthContext.jsx';
import toast from 'react-hot-toast';

export default function ResultPage() {
    const { attemptId } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);
    const [reviewMode, setReviewMode] = useState(true); // Default review to true for Gradeup feel
    const [filterCorrect, setFilterCorrect] = useState('all');

    useEffect(() => {
        const fetchResult = async () => {
            try {
                const res = await api.get(`/attempts/${attemptId}/result`);
                setData(res.data);
            } catch (err) {
                toast.error('Failed to load results');
                navigate('/mock-tests');
            } finally {
                setLoading(false);
            }
        };
        fetchResult();
    }, [attemptId, navigate]);

    const downloadPdf = async () => {
        if (downloading) return;
        setDownloading(true);
        try {
            const response = await api.get(`/attempts/${attemptId}/pdf`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Test_Result_${attemptId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success('PDF Downloaded!');
        } catch (err) {
            toast.error('Failed to generate PDF');
        } finally {
            setDownloading(false);
        }
    };

    if (loading) return <div className="loading-overlay"><div className="spinner" /></div>;
    if (!data || !data.result_summary) return <div className="section"><div className="card">Result not found or experiment in progress.</div></div>;

    const r = data.result_summary;
    const questions = data.questions || [];
    const scoreVal = Number(r.percentage || 0);
    const scorePct = Math.min(100, scoreVal);
    const statusBadge = scoreVal >= 60 ? 'badge-green' : scoreVal >= 40 ? 'badge-orange' : 'badge-red';
    const scoreClass = scoreVal >= 60 ? 'pass' : scoreVal >= 40 ? 'average' : 'fail';

    const filteredQ = questions.filter(q => {
        if (filterCorrect === 'correct') return q.is_correct;
        if (filterCorrect === 'wrong') return !q.is_correct && !q.is_skipped;
        if (filterCorrect === 'skipped') return q.is_skipped;
        return true;
    });

    return (
        <div className="fade-in" style={{ paddingBottom: 60 }}>
            {/* Page Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Performance Report</h1>
                    <p className="page-subtitle">Detailed analysis of your test attempt</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <button className="btn btn-secondary" onClick={() => navigate('/mock-tests')}>Back to Tests</button>
                        <button
                            className="btn btn-orange"
                            onClick={downloadPdf}
                            disabled={downloading}
                            title="PDF is currently available in English only. Other languages coming soon."
                        >
                            {downloading ? 'Generating...' : '📥 Download PDF'}
                        </button>
                        <button className="btn btn-primary" onClick={() => navigate('/analytics')}>Full Analytics</button>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span>🌐</span>
                        <span>PDF available in <strong>English</strong> only &mdash; other languages <em>coming soon</em></span>
                    </div>
                </div>
            </div>

            <div className="section">
                {/* Result Summary Card */}
                <div className="card-gradient" style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 2fr) 3fr', gap: 32, alignItems: 'center', marginBottom: 24, padding: 32 }}>

                    {/* Circle Score */}
                    <div style={{ textAlign: 'center' }}>
                        <div className={`result-score-circle ${scoreClass}`} style={{ '--score-pct': `${scorePct}%`, width: 140, height: 140 }}>
                            <div className="result-score-inner" style={{ width: 115, height: 115 }}>
                                <div className="result-score-value" style={{ fontSize: 28, color: `var(--${scoreClass === 'pass' ? 'green' : scoreClass === 'average' ? 'orange' : 'red'}-600)` }}>
                                    {Number.isInteger(scoreVal) ? scoreVal : scoreVal.toFixed(1)}%
                                </div>
                                <div className="result-score-label" style={{ fontSize: 13, color: 'var(--text-muted)' }}>SCORE</div>
                            </div>
                        </div>
                        <div className={`badge ${statusBadge}`} style={{ fontSize: 13, padding: '4px 16px' }}>
                            Grade: {r?.grade || 'N/A'}
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div>
                        <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 16 }}>Test: {data?.mock_test?.title}</h2>

                        <div className="stats-grid" style={{ gap: 12 }}>
                            <div className="stat-card" style={{ flexDirection: 'column', padding: '12px', alignItems: 'flex-start', background: 'white' }}>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>T. QUESTIONS</div>
                                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>{questions.length}</div>
                            </div>
                            <div className="stat-card" style={{ flexDirection: 'column', padding: '12px', alignItems: 'flex-start', background: 'white' }}>
                                <div style={{ fontSize: 11, color: 'var(--green-600)', fontWeight: 600 }}>CORRECT</div>
                                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--green-500)' }}>{r?.correct}</div>
                            </div>
                            <div className="stat-card" style={{ flexDirection: 'column', padding: '12px', alignItems: 'flex-start', background: 'white' }}>
                                <div style={{ fontSize: 11, color: 'var(--red-500)', fontWeight: 600 }}>WRONG</div>
                                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--red-500)' }}>{r?.wrong}</div>
                            </div>
                            <div className="stat-card" style={{ flexDirection: 'column', padding: '12px', alignItems: 'flex-start', background: 'white' }}>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>TIME</div>
                                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--blue-500)' }}>{r?.time_taken}</div>
                            </div>
                        </div>

                        <div className="info-strip" style={{ marginTop: 20, marginBottom: 0, padding: 10 }}>
                            🎯 <strong>Observation:</strong> Your accuracy for this test is <strong>{Math.round((Number(r?.correct || 0) / (Number(r?.correct || 0) + Number(r?.wrong || 0) || 1)) * 100)}%</strong>.
                        </div>
                    </div>
                </div>

                {/* Topic-wise Analysis Table */}
                {data.topic_analysis && data.topic_analysis.length > 0 && (
                    <div className="card" style={{ marginTop: 24, padding: 24 }}>
                        <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16, color: 'var(--blue-700)' }}>Topic-wise Analysis</h2>
                        <div className="table-container">
                            <table style={{ width: '100%' }}>
                                <thead>
                                    <tr>
                                        <th style={{ textAlign: 'left' }}>Subject / Topic</th>
                                        <th style={{ textAlign: 'center' }}>Total</th>
                                        <th style={{ textAlign: 'center' }}>Correct</th>
                                        <th style={{ textAlign: 'center' }}>Accuracy</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.topic_analysis.map((t, idx) => (
                                        <tr key={idx}>
                                            <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{t.topic}</td>
                                            <td style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>{t.total}</td>
                                            <td style={{ textAlign: 'center', color: 'var(--green-600)', fontWeight: 700 }}>{t.correct}</td>
                                            <td style={{ textAlign: 'center' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center' }}>
                                                    <div style={{ flex: 1, height: 6, background: '#eee', borderRadius: 10, minWidth: 60 }}>
                                                        <div style={{ height: '100%', width: `${t.accuracy}%`, background: t.accuracy >= 60 ? 'var(--green-500)' : t.accuracy >= 40 ? 'var(--orange-500)' : 'var(--red-500)', borderRadius: 10 }} />
                                                    </div>
                                                    <span style={{ fontWeight: 800, fontSize: 13, minWidth: 40 }}>{t.accuracy}%</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Review Header */}
                <div className="page-header" style={{ marginTop: 40, borderBottom: 'none', padding: '18px 0 14px' }}>
                    <h2 style={{ fontSize: 18, fontWeight: 800 }}>Question-wise Analysis</h2>
                    <div style={{ display: 'flex', gap: 6, background: 'white', padding: 4, borderRadius: 8, border: '1px solid var(--border)', flexWrap: 'wrap' }}>
                        {[
                            { id: 'all', label: 'All' },
                            { id: 'correct', label: 'Correct' },
                            { id: 'wrong', label: 'Incorrect' },
                            { id: 'skipped', label: 'Skipped' }
                        ].map(f => (
                            <button
                                key={f.id}
                                className={`btn btn-sm ${filterCorrect === f.id ? 'btn-primary' : 'btn-ghost'}`}
                                style={{ border: 'none', padding: '5px 12px' }}
                                onClick={() => setFilterCorrect(f.id)}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Question List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {filteredQ.map((q, i) => (
                        <div key={q.id} className="card" style={{
                            borderLeft: `5px solid ${q.is_correct ? 'var(--green-500)' : q.is_skipped ? '#ccc' : 'var(--red-500)'}`,
                            padding: 24
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <span style={{ fontWeight: 800, color: q.is_correct ? 'var(--green-600)' : q.is_skipped ? 'var(--text-muted)' : 'var(--red-500)' }}>
                                        #{questions.indexOf(q) + 1} {q.is_correct ? 'CORRECT' : q.is_skipped ? 'SKIPPED' : 'INCORRECT'}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', gap: 6 }}>
                                    {q.topic && <span className="topic-chip active" style={{ fontSize: 10 }}>{q.topic}</span>}
                                    <span className="badge badge-gray">{q.difficulty}</span>
                                </div>
                            </div>

                            <div className="question-text" style={{ fontSize: 16, marginBottom: 20, lineHeight: 1.6 }}>
                                {q.question}
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 10 }}>
                                {(q.options || []).map((opt, oi) => {
                                    const letter = ['A', 'B', 'C', 'D'][oi];
                                    const isCorrect = letter === q.correct_answer;
                                    const isSelected = letter === q.selected_answer;

                                    let cls = '';
                                    if (isCorrect) cls = 'correct';
                                    else if (isSelected) cls = 'wrong';

                                    return (
                                        <div key={oi} className={`option-btn ${cls}`} style={{ cursor: 'default', padding: '10px 14px' }}>
                                            <span className="option-label">{letter}</span>
                                            <div style={{ flex: 1 }}>{opt?.replace(/^[A-D]\.\s*/, '') || ''}</div>
                                            {isCorrect && (
                                                <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: 'var(--green-600)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    <span className="hide-mobile">Correct Option</span>
                                                    <span>✅</span>
                                                </span>
                                            )}
                                            {isSelected && !isCorrect && (
                                                <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: 'var(--red-500)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    <span className="hide-mobile">Your Answer</span>
                                                    <span>❌</span>
                                                </span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {q.explanation && (
                                <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                                    <div style={{ display: 'flex', gap: 8, color: 'var(--blue-700)', fontWeight: 700, fontSize: 13, marginBottom: 6 }}>
                                        <span>💡</span> Solution & Explanation
                                    </div>
                                    <div style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                                        {q.explanation}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {filteredQ.length === 0 && (
                    <div className="empty-state">
                        <div className="empty-title">No questions found in this category</div>
                    </div>
                )}
            </div>
        </div>
    );
}
