import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../contexts/AuthContext.jsx';
import toast from 'react-hot-toast';

export default function MockTestsPage() {
    const navigate = useNavigate();
    const [mockTests, setMockTests] = useState([]);
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [creating, setCreating] = useState(false);
    const [form, setForm] = useState({
        document_id: '', title: '', total_questions: 10,
        duration_minutes: 15, negative_marking: 0.33, difficulty: 'mixed',
    });

    const fetchData = useCallback(async () => {
        try {
            const [testsRes, docsRes] = await Promise.all([
                api.get('/mock-tests'),
                api.get('/documents'),
            ]);
            setMockTests(testsRes.data.data || []);
            setDocuments((docsRes.data.data || []).filter(d => d.status === 'processed' && d.total_questions >= 5));
        } catch {
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleCreate = async (e) => {
        e.preventDefault();
        setCreating(true);
        try {
            const res = await api.post('/mock-tests', form);
            setMockTests(prev => [res.data.mock_test, ...prev]);
            setShowCreate(false);
            setForm({ document_id: '', title: '', total_questions: 10, duration_minutes: 15, negative_marking: 0.33, difficulty: 'mixed' });
            toast.success('Mock test created! 🎯');
        } catch (err) {
            let errorMsg = 'Failed to create test';
            if (err.response?.data?.errors) {
                // Laravel validation errors format
                const firstError = Object.values(err.response.data.errors)[0];
                errorMsg = Array.isArray(firstError) ? firstError[0] : firstError;
            } else if (err.response?.data?.error) {
                errorMsg = err.response.data.error;
            } else if (err.response?.data?.message) {
                errorMsg = err.response.data.message;
            }
            toast.error(errorMsg);
        } finally {
            setCreating(false);
        }
    };

    const handleStart = async (test) => {
        const loadingToast = toast.loading('Preparing your test environment...');
        try {
            const res = await api.post(`/mock-tests/${test.id}/start`);
            toast.dismiss(loadingToast);

            if (res.data.limit_reached) {
                toast.error('Daily limit reached. Upgrade to Pro for unlimited tests!');
                return;
            }
            navigate(`/quiz/${test.id}?attemptId=${res.data.attempt.id}`);
        } catch (err) {
            toast.dismiss(loadingToast);
            if (err.response?.data?.limit_reached) {
                toast.error('Daily mock test limit reached. Upgrade to Pro!');
            } else {
                toast.error('Failed to start test');
            }
        }
    };

    const handleDelete = async (test) => {
        if (!confirm(`Delete "${test.title}"?`)) return;
        try {
            await api.delete(`/mock-tests/${test.id}`);
            setMockTests(prev => prev.filter(t => t.id !== test.id));
            toast.success('Test deleted');
        } catch { toast.error('Failed to delete'); }
    };

    return (
        <div className="fade-in">
            {/* Header with Background */}
            <div className="page-header" style={{ marginBottom: 24 }}>
                <div>
                    <h1 className="page-title">Test Series</h1>
                    <p className="page-subtitle">Curated TNPSC mock examinations for consistent practice</p>
                </div>
                <button className="btn btn-orange" onClick={() => setShowCreate(true)}>
                    + Create New Mock Test
                </button>
            </div>

            <div className="section">
                {/* Info Box */}
                <div className="info-strip" style={{ marginBottom: 24 }}>
                    📚 <strong>Tip:</strong> You can create custom tests from any of your processed study materials.
                </div>

                {loading ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
                        {[1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ height: 180, borderRadius: 12 }} />)}
                    </div>
                ) : mockTests.length === 0 ? (
                    <div className="card" style={{ textAlign: 'center', padding: '80px 40px' }}>
                        <div style={{ fontSize: 64, marginBottom: 20 }}>📝</div>
                        <h2 className="empty-title">Ready for your first test?</h2>
                        <p className="empty-desc" style={{ margin: '14px auto 24px' }}>
                            {documents.length === 0
                                ? 'Upload a PDF textbook first to generate practice questions automatically.'
                                : 'Choose a textbook and create a mock test to start your preparation.'}
                        </p>
                        {documents.length === 0 ? (
                            <button className="btn btn-primary btn-lg" onClick={() => navigate('/documents')}>Upload Study Material</button>
                        ) : (
                            <button className="btn btn-primary btn-lg" onClick={() => setShowCreate(true)}>Create First Test</button>
                        )}
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
                        {mockTests.map(test => (
                            <div key={test.id} className="card card-accent-blue" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                                    <div className="badge badge-blue">Mock Test</div>
                                    <div style={{ display: 'flex', gap: 4 }}>
                                        <button className="btn btn-ghost btn-sm btn-icon" style={{ padding: 4, height: 28, width: 28 }} onClick={() => handleDelete(test)} title="Delete">🗑️</button>
                                    </div>
                                </div>

                                <h3 style={{ fontSize: 16, marginBottom: 8, color: 'var(--text-primary)' }} className="truncate" title={test.title}>
                                    {test.title}
                                </h3>

                                <div style={{ marginBottom: 16, flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>
                                        <span style={{ transform: 'scale(0.85)' }}>📚</span>
                                        <span className="truncate" style={{ flex: 1 }}>{test.document?.title || 'Material'}</span>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginTop: 12 }}>
                                        <div className="stat-card" style={{ padding: '8px 12px', background: 'var(--bg-body)', boxShadow: 'none' }}>
                                            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>QUESTIONS</div>
                                            <div style={{ fontWeight: 800, color: 'var(--blue-600)' }}>{test.total_questions}</div>
                                        </div>
                                        <div className="stat-card" style={{ padding: '8px 12px', background: 'var(--bg-body)', boxShadow: 'none' }}>
                                            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>DURATION</div>
                                            <div style={{ fontWeight: 800, color: 'var(--blue-600)' }}>{test.duration_minutes}m</div>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 14, borderTop: '1px solid var(--border)' }}>
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                        {test.attempts_count || 0} Attempts
                                    </div>
                                    <button className="btn btn-primary" onClick={() => handleStart(test)} style={{ padding: '8px 24px' }}>
                                        Attempt Now
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Create Modal */}
            {showCreate && (
                <div className="modal-overlay" onClick={() => setShowCreate(false)}>
                    <div className="modal scale-in" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Create Custom Mock Test</h2>
                            <button className="modal-close" onClick={() => setShowCreate(false)}>✕</button>
                        </div>

                        {documents.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '20px 0' }}>
                                <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
                                <h3 style={{ marginBottom: 8 }}>No Material Found</h3>
                                <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 20 }}>
                                    You need at least one processed document to create a mock test.
                                </p>
                                <button className="btn btn-primary" onClick={() => { setShowCreate(false); navigate('/documents'); }}>
                                    Go to Study Material
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleCreate}>
                                <div className="form-group">
                                    <label className="form-label">Study Material</label>
                                    <select className="form-control" value={form.document_id}
                                        onChange={e => {
                                            const docId = e.target.value;
                                            const doc = documents.find(d => d.id == docId);
                                            if (doc) {
                                                const defaultQs = Math.min(20, doc.total_questions);
                                                setForm(p => ({
                                                    ...p,
                                                    document_id: docId,
                                                    title: doc.title,
                                                    total_questions: defaultQs,
                                                    duration_minutes: defaultQs
                                                }));
                                            } else {
                                                setForm(p => ({ ...p, document_id: '' }));
                                            }
                                        }} required>
                                        <option value="">Select a textbook...</option>
                                        {documents.map(d => (
                                            <option key={d.id} value={d.id}>{d.title} ({d.total_questions} Qs available)</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Test Title</label>
                                    <input type="text" className="form-control" placeholder="e.g., General Studies Mock 1"
                                        value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required />
                                </div>

                                <div className="grid-2">
                                    <div className="form-group">
                                        <label className="form-label">Total Questions</label>
                                        <input type="number" className="form-control" min={1} max={100}
                                            value={form.total_questions} onChange={e => setForm(p => ({ ...p, total_questions: +e.target.value }))} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Duration (m)</label>
                                        <input type="number" className="form-control" min={1} max={180}
                                            value={form.duration_minutes} onChange={e => setForm(p => ({ ...p, duration_minutes: +e.target.value }))} />
                                    </div>
                                </div>

                                <div className="grid-2">
                                    <div className="form-group">
                                        <label className="form-label">Negative Marking</label>
                                        <select className="form-control" value={form.negative_marking}
                                            onChange={e => setForm(p => ({ ...p, negative_marking: +e.target.value }))}>
                                            <option value={0}>Disabled</option>
                                            <option value={0.33}>0.33 (Gradeup/TNPSC Style)</option>
                                            <option value={0.5}>0.5 per wrong</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Difficulty</label>
                                        <select className="form-control" value={form.difficulty}
                                            onChange={e => setForm(p => ({ ...p, difficulty: e.target.value }))}>
                                            <option value="mixed">Mixed Difficulty</option>
                                            <option value="easy">Beginner (Easy)</option>
                                            <option value="medium">Intermediate (Medium)</option>
                                            <option value="hard">Expert (Hard)</option>
                                        </select>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                                    <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowCreate(false)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={creating}>
                                        {creating ? 'Creating...' : '🎯 Create Test Series'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
