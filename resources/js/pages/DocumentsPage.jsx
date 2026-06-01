import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, useAuth } from '../contexts/AuthContext.jsx';
import toast from 'react-hot-toast';

const ACCEPTED_TYPES = 'application/pdf,image/jpeg,image/jpg,image/png,image/gif,image/webp,image/bmp';
const ACCEPTED_EXTS = '.pdf,.jpg,.jpeg,.png,.gif,.webp,.bmp';
const SUBJECTS = ['History', 'Geography', 'Polity', 'Economy', 'Science', 'Current Affairs', 'Aptitude', 'Other'];

export default function DocumentsPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const isAdmin = !!user?.is_admin;

    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [showUpload, setShowUpload] = useState(false);
    const [dragover, setDragover] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [selectedSubject, setSelectedSubject] = useState('All');
    const [form, setForm] = useState({ title: '', subject: '' });
    const [selectedFile, setSelectedFile] = useState(null);
    const fileInputRef = React.useRef(null);

    const fetchDocuments = useCallback(async () => {
        try {
            const res = await api.get('/documents');
            setDocuments(res.data.data || []);
        } catch {
            toast.error('Failed to load documents');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDocuments();
        const interval = setInterval(fetchDocuments, 10000);
        return () => clearInterval(interval);
    }, [fetchDocuments]);

    const handleFileSelect = (file) => {
        if (!file) return;
        const isImage = file.type.startsWith('image/');
        const isPdf = file.type === 'application/pdf';
        if (!isImage && !isPdf) {
            toast.error('Please select a PDF or image file (JPG, PNG, GIF, WEBP)');
            return;
        }
        setSelectedFile(file);
        if (!form.title) {
            const name = file.name.replace(/\.[^.]+$/, '').replace(/_/g, ' ');
            setForm(p => ({ ...p, title: name }));
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragover(false);
        const file = e.dataTransfer.files[0];
        handleFileSelect(file);
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!selectedFile) { toast.error('Please select a file first'); return; }
        if (!form.title) { toast.error('Please enter a title'); return; }

        setUploading(true);
        const formData = new FormData();
        formData.append('file', selectedFile);  // field renamed from 'pdf' to 'file'
        formData.append('title', form.title);
        formData.append('subject', form.subject);

        try {
            const res = await api.post('/documents', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (p) => setUploadProgress(Math.round((p.loaded * 100) / p.total)),
            });

            setDocuments(prev => [res.data.document, ...prev]);
            setShowUpload(false);
            setSelectedFile(null);
            setForm({ title: '', subject: '' });
            setUploadProgress(0);
            toast.success(selectedFile?.type?.startsWith('image/') ? '🖼️ Image uploaded! AI is reading and generating questions...' : '📄 Document uploaded! AI is processing questions...');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (doc) => {
        if (!confirm(`Delete "${doc.title}"?`)) return;
        try {
            await api.delete(`/documents/${doc.id}`);
            setDocuments(prev => prev.filter(d => d.id !== doc.id));
            toast.success('Deleted');
        } catch { toast.error('Failed'); }
    };

    const getStatusBadge = (status, errorMsg) => {
        const map = {
            uploaded: { cls: 'badge-gray', icon: '⏳', label: 'Queued' },
            processing: { cls: 'badge-orange', icon: '⚙️', label: 'Processing' },
            processed: { cls: 'badge-green', icon: '✅', label: 'Ready' },
            failed: { cls: 'badge-red', icon: '❌', label: 'Error' },
        };
        const s = map[status] || map.uploaded;
        return <span className={`badge ${s.cls}`} title={errorMsg}>{s.icon} {s.label}</span>;
    };

    const filteredDocs = documents.filter(doc =>
        selectedSubject === 'All' || doc.subject === selectedSubject
    );

    return (
        <div className="fade-in">
            <div className="page-header" style={{ marginBottom: 20 }}>
                <div>
                    <h1 className="page-title">Study Library</h1>
                    <p className="page-subtitle">Upload PDFs or images — AI extracts text and generates practice questions</p>
                </div>
                {isAdmin && (
                    <button className="btn btn-primary" onClick={() => setShowUpload(true)}>
                        + Upload Library Item
                    </button>
                )}
            </div>

            <div className="section">
                {/* Subject Filter Bar */}
                <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 16, marginBottom: 8 }} className="scrollbar-hide">
                    {['All', ...SUBJECTS].map(cat => (
                        <button
                            key={cat}
                            className={`topic-chip ${selectedSubject === cat ? 'active' : ''}`}
                            onClick={() => setSelectedSubject(cat)}
                            style={{ whiteSpace: 'nowrap' }}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16, marginTop: 10 }}>
                        {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 140, borderRadius: 12 }} />)}
                    </div>
                ) : filteredDocs.length === 0 ? (
                    <div className="card" style={{ textAlign: 'center', padding: '60px 40px', marginTop: 10 }}>
                        <div style={{ fontSize: 48, marginBottom: 16 }}>📚</div>
                        <h2 style={{ fontSize: 18, fontWeight: 700 }}>No material found here</h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 8 }}>
                            {selectedSubject !== 'All'
                                ? `No study material uploaded under ${selectedSubject} yet.`
                                : 'The library is currently being updated with new materials.'}
                        </p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16, marginTop: 10 }}>
                        {filteredDocs.map(doc => (
                            <div key={doc.id} className="card" style={{ borderTop: `4px solid ${doc.subject === 'Science' ? '#10b981' : doc.subject === 'History' ? '#f59e0b' : 'var(--blue-500)'}` }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                                    <span className="badge badge-blue" style={{ fontSize: 10 }}>{doc.subject || 'Material'}</span>
                                    {isAdmin && getStatusBadge(doc.status, doc.error_message)}
                                </div>
                                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6, lineHeight: 1.4 }} className="truncate" title={doc.title}>
                                    {doc.title}
                                </h3>
                                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 14 }}>
                                    📈 {doc.total_questions || 0} Questions Generated
                                </p>

                                {doc.status === 'failed' && (
                                    <div style={{ fontSize: 11, color: '#e53e3e', background: '#fff5f5', padding: '8px 12px', borderRadius: 8, marginBottom: 14, border: '1px solid #fed7d7' }}>
                                        <strong>Extraction Failed:</strong><br />
                                        {doc.error_message || 'Unknown processing error'}
                                    </div>
                                )}

                                <div style={{ display: 'flex', gap: 8, marginTop: 'auto', paddingTop: 10, borderTop: '1px solid #f0f2f5' }}>
                                    <button
                                        className="btn btn-secondary btn-sm"
                                        style={{ flex: 1 }}
                                        onClick={() => navigate('/mock-tests')}
                                    >
                                        Practice Now
                                    </button>
                                    {isAdmin && (
                                        <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDelete(doc)}>
                                            🗑️
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Upload Modal */}
            {isAdmin && showUpload && (
                <div className="modal-overlay" onClick={() => setShowUpload(false)}>
                    <div className="modal scale-in" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Upload Study Material</h2>
                            <button className="modal-close" onClick={() => setShowUpload(false)}>✕</button>
                        </div>

                        <form onSubmit={handleUpload}>
                            <div className={`upload-zone ${dragover ? 'dragover' : ''}`}
                                onDragOver={e => { e.preventDefault(); setDragover(true); }}
                                onDragLeave={() => setDragover(false)}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}>
                                <input ref={fileInputRef} type="file" accept={ACCEPTED_EXTS} style={{ display: 'none' }}
                                    onChange={e => handleFileSelect(e.target.files[0])} />
                                <div style={{ fontSize: 40, marginBottom: 10 }}>
                                    {selectedFile
                                        ? selectedFile.type.startsWith('image/') ? '🖼️' : '📄'
                                        : '📤'}
                                </div>
                                <div style={{ fontWeight: 700 }}>
                                    {selectedFile ? selectedFile.name : 'Select or drop a PDF / Image'}
                                </div>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                                    Supported: PDF, JPG, PNG, GIF, WEBP &mdash; Max 30MB
                                </div>
                            </div>

                            <div className="form-group" style={{ marginTop: 20 }}>
                                <label className="form-label">Material Label</label>
                                <input type="text" className="form-control" value={form.title} placeholder="e.g., 6th Std Science Term 1"
                                    onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Exam Subject</label>
                                <select className="form-control" value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} required>
                                    <option value="">Choose subject...</option>
                                    {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>

                            {uploading && (
                                <div style={{ margin: '15px 0' }}>
                                    <div className="progress-bar"><div className="progress-fill" style={{ width: `${uploadProgress}%` }} /></div>
                                    <div style={{ textAlign: 'center', fontSize: 10, marginTop: 4, color: 'var(--text-muted)' }}>Uploading {uploadProgress}%...</div>
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                                <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowUpload(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={uploading}>
                                    {uploading ? 'Uploading...' : '🚀 Start Extraction'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
