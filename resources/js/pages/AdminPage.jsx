import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../contexts/AuthContext.jsx';
import toast from 'react-hot-toast';

export default function AdminPage() {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [recentUsers, setRecentUsers] = useState([]);
    const [recentDocs, setRecentDocs] = useState([]);
    const [users, setUsers] = useState([]);
    const [documents, setDocuments] = useState([]);
    const [tab, setTab] = useState('overview');
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [planFilter, setPlanFilter] = useState('');
    const [editUser, setEditUser] = useState(null);
    const [editForm, setEditForm] = useState({});

    const fetchStats = async () => {
        try {
            const res = await api.get('/admin/stats');
            setStats(res.data.stats);
            setRecentUsers(res.data.recent_users || []);
            setRecentDocs(res.data.recent_documents || []);
        } catch (e) {
            if (e.response?.status === 403) {
                toast.error('Admin access required');
                navigate('/dashboard');
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (planFilter) params.set('plan', planFilter);
        const res = await api.get(`/admin/users?${params}`);
        setUsers(res.data.data || []);
    };

    const fetchDocuments = async () => {
        const res = await api.get('/admin/documents');
        setDocuments(res.data.data || []);
    };

    useEffect(() => { fetchStats(); }, []);

    useEffect(() => {
        if (tab === 'users') fetchUsers();
        if (tab === 'documents') fetchDocuments();
    }, [tab, search, planFilter]);

    const handleUpgrade = async (user) => {
        try {
            await api.post(`/admin/users/${user.id}/upgrade`);
            toast.success(`✨ ${user.name} upgraded to Pro!`);
            fetchUsers();
        } catch { toast.error('Failed'); }
    };

    const handleDowngrade = async (user) => {
        if (!confirm(`Downgrade ${user.name} to Free?`)) return;
        try {
            await api.post(`/admin/users/${user.id}/downgrade`);
            toast.success(`${user.name} downgraded to Free`);
            fetchUsers();
        } catch { toast.error('Failed'); }
    };

    const handleDeleteUser = async (user) => {
        if (!confirm(`Permanently delete user "${user.name}"? This cannot be undone.`)) return;
        try {
            await api.delete(`/admin/users/${user.id}`);
            toast.success('User deleted');
            fetchUsers();
        } catch (e) { toast.error(e.response?.data?.error || 'Failed'); }
    };

    const handleDeleteDoc = async (doc) => {
        if (!confirm(`Delete document "${doc.title}" and all its questions?`)) return;
        try {
            await api.delete(`/admin/documents/${doc.id}`);
            toast.success('Document deleted');
            fetchDocuments();
        } catch { toast.error('Failed'); }
    };

    const handleSaveUser = async () => {
        try {
            await api.put(`/admin/users/${editUser.id}`, editForm);
            toast.success('User updated');
            setEditUser(null);
            fetchUsers();
        } catch { toast.error('Failed'); }
    };

    const StatCard = ({ icon, label, value, color, sub }) => (
        <div className="stat-card" style={{ position: 'relative', overflow: 'hidden' }}>
            <div className={`stat-icon ${color}`} style={{ fontSize: 28 }}>{icon}</div>
            <div>
                <div className="stat-value" style={{ color: `var(--${color}-500)`, fontSize: 30 }}>{value ?? '–'}</div>
                <div className="stat-label">{label}</div>
                {sub && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>}
            </div>
        </div>
    );

    if (loading) return (
        <div className="loading-overlay" style={{ minHeight: '60vh' }}>
            <div className="spinner" /><span style={{ color: 'var(--text-secondary)' }}>Loading admin panel...</span>
        </div>
    );

    return (
        <div className="fade-in">
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">🛡️ Admin Panel</h1>
                    <p className="page-subtitle">Manage users, documents, and platform statistics</p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    {['overview', 'users', 'documents'].map(t => (
                        <button key={t} className={`btn ${tab === t ? 'btn-primary' : 'btn-ghost'} btn-sm`}
                            onClick={() => setTab(t)}>
                            {t === 'overview' ? '📊 Overview' : t === 'users' ? '👥 Users' : '📚 Documents'}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── OVERVIEW TAB ── */}
            {tab === 'overview' && (
                <>
                    <div className="section">
                        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))' }}>
                            <StatCard icon="👥" label="Total Users" value={stats?.total_users} color="purple" sub={`${stats?.pro_users} Pro · ${stats?.free_users} Free`} />
                            <StatCard icon="⭐" label="Pro Users" value={stats?.pro_users} color="orange" />
                            <StatCard icon="📚" label="Documents" value={stats?.total_documents} color="cyan" />
                            <StatCard icon="❓" label="Questions" value={stats?.total_questions} color="green" />
                            <StatCard icon="📝" label="Mock Tests" value={stats?.total_tests} color="pink" />
                            <StatCard icon="🎯" label="Attempts" value={stats?.total_attempts} color="purple" sub={`${stats?.completed_attempts} completed`} />
                        </div>
                    </div>

                    {/* Recent Users */}
                    <div className="section">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <h2 style={{ fontSize: 16, fontWeight: 700 }}>Recent Users</h2>
                            <button className="btn btn-ghost btn-sm" onClick={() => setTab('users')}>View All →</button>
                        </div>
                        <div className="table-container">
                            <table>
                                <thead><tr><th>Name</th><th>Email</th><th>Plan</th><th>Role</th><th>Joined</th></tr></thead>
                                <tbody>
                                    {recentUsers.map(u => (
                                        <tr key={u.id}>
                                            <td style={{ fontWeight: 600 }}>{u.name}</td>
                                            <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                                            <td><span className={`badge badge-${u.plan === 'pro' ? 'orange' : 'gray'}`}>{u.plan === 'pro' ? '⭐ Pro' : '🆓 Free'}</span></td>
                                            <td>{u.is_admin ? <span className="badge badge-red">🛡️ Admin</span> : <span className="badge badge-blue">User</span>}</td>
                                            <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{new Date(u.created_at).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Recent Documents */}
                    <div className="section">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <h2 style={{ fontSize: 16, fontWeight: 700 }}>Recent Documents</h2>
                            <button className="btn btn-ghost btn-sm" onClick={() => setTab('documents')}>View All →</button>
                        </div>
                        <div className="table-container">
                            <table>
                                <thead><tr><th>Title</th><th>Uploaded By</th><th>Questions</th><th>Status</th><th>Date</th></tr></thead>
                                <tbody>
                                    {recentDocs.map(d => (
                                        <tr key={d.id}>
                                            <td style={{ fontWeight: 600 }}>{d.title}</td>
                                            <td style={{ color: 'var(--text-secondary)' }}>{d.user?.name}</td>
                                            <td>{d.total_questions || 0}</td>
                                            <td>
                                                <span className={`badge badge-${d.status === 'processed' ? 'green' : d.status === 'processing' ? 'orange' : d.status === 'failed' ? 'red' : 'gray'}`}>
                                                    {d.status}
                                                </span>
                                            </td>
                                            <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{new Date(d.created_at).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {/* ── USERS TAB ── */}
            {tab === 'users' && (
                <div className="section">
                    {/* Filters */}
                    <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
                        <input className="form-control" style={{ maxWidth: 280 }} placeholder="🔍 Search by name or email..."
                            value={search} onChange={e => setSearch(e.target.value)} />
                        <select className="form-control" style={{ maxWidth: 160 }} value={planFilter} onChange={e => setPlanFilter(e.target.value)}>
                            <option value="">All Plans</option>
                            <option value="free">Free</option>
                            <option value="pro">Pro</option>
                        </select>
                        <button className="btn btn-ghost btn-sm" onClick={() => { setSearch(''); setPlanFilter(''); }}>Clear</button>
                    </div>

                    <div className="table-container">
                        <table>
                            <thead>
                                <tr><th>Name</th><th>Email</th><th>Plan</th><th>Tests</th><th>Docs</th><th>Joined</th><th>Actions</th></tr>
                            </thead>
                            <tbody>
                                {users.length === 0 ? (
                                    <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>No users found</td></tr>
                                ) : users.map(u => (
                                    <tr key={u.id}>
                                        <td>
                                            <div style={{ fontWeight: 600 }}>{u.name}</div>
                                            {u.is_admin && <span className="badge badge-red" style={{ fontSize: 10 }}>🛡️ Admin</span>}
                                        </td>
                                        <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{u.email}</td>
                                        <td>
                                            <span className={`badge badge-${u.plan === 'pro' ? 'orange' : 'gray'}`}>
                                                {u.plan === 'pro' ? '⭐ Pro' : '🆓 Free'}
                                            </span>
                                        </td>
                                        <td style={{ color: 'var(--text-muted)' }}>{u.attempts_count || 0}</td>
                                        <td style={{ color: 'var(--text-muted)' }}>{u.documents_count || 0}</td>
                                        <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{new Date(u.created_at).toLocaleDateString()}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                {u.plan === 'free'
                                                    ? <button className="btn btn-sm" style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)', fontSize: 12 }}
                                                        onClick={() => handleUpgrade(u)}>⬆ Pro</button>
                                                    : <button className="btn btn-ghost btn-sm" style={{ fontSize: 12 }}
                                                        onClick={() => handleDowngrade(u)}>⬇ Free</button>
                                                }
                                                <button className="btn btn-secondary btn-sm" style={{ fontSize: 12 }}
                                                    onClick={() => { setEditUser(u); setEditForm({ name: u.name, plan: u.plan, is_admin: u.is_admin }); }}>
                                                    ✏️
                                                </button>
                                                <button className="btn btn-danger btn-sm btn-icon" style={{ fontSize: 12 }}
                                                    onClick={() => handleDeleteUser(u)}>🗑️</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ── DOCUMENTS TAB ── */}
            {tab === 'documents' && (
                <div className="section">
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr><th>Title</th><th>Subject</th><th>Owner</th><th>Questions</th><th>Status</th><th>Date</th><th>Actions</th></tr>
                            </thead>
                            <tbody>
                                {documents.length === 0 ? (
                                    <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>No documents</td></tr>
                                ) : documents.map(d => (
                                    <tr key={d.id}>
                                        <td style={{ fontWeight: 600, maxWidth: 200 }} className="truncate">{d.title}</td>
                                        <td style={{ color: 'var(--text-secondary)' }}>{d.subject || '–'}</td>
                                        <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{d.user?.name}<br /><span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{d.user?.email}</span></td>
                                        <td>{d.questions_count || d.total_questions || 0}</td>
                                        <td>
                                            <span className={`badge badge-${d.status === 'processed' ? 'green' : d.status === 'processing' ? 'orange' : d.status === 'failed' ? 'red' : 'gray'}`}>
                                                {d.status}
                                            </span>
                                        </td>
                                        <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{new Date(d.created_at).toLocaleDateString()}</td>
                                        <td>
                                            <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDeleteDoc(d)}>🗑️</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ── EDIT USER MODAL ── */}
            {editUser && (
                <div className="modal-overlay" onClick={() => setEditUser(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">✏️ Edit User — {editUser.name}</h2>
                            <button className="modal-close" onClick={() => setEditUser(null)}>✕</button>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Full Name</label>
                            <input className="form-control" value={editForm.name || ''} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Plan</label>
                            <select className="form-control" value={editForm.plan || 'free'} onChange={e => setEditForm(p => ({ ...p, plan: e.target.value }))}>
                                <option value="free">Free</option>
                                <option value="pro">Pro</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">New Password <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(leave blank to keep)</span></label>
                            <input type="password" className="form-control" placeholder="New password..." onChange={e => setEditForm(p => ({ ...p, password: e.target.value }))} />
                        </div>
                        <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <input type="checkbox" id="is_admin" checked={!!editForm.is_admin} onChange={e => setEditForm(p => ({ ...p, is_admin: e.target.checked }))}
                                style={{ width: 18, height: 18, accentColor: 'var(--purple-500)' }} />
                            <label htmlFor="is_admin" className="form-label" style={{ margin: 0 }}>🛡️ Admin privileges</label>
                        </div>
                        <div style={{ display: 'flex', gap: 10 }}>
                            <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setEditUser(null)}>Cancel</button>
                            <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleSaveUser}>Save Changes</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
