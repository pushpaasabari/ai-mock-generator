import React, { useState, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import toast from 'react-hot-toast';

export default function LandingPage() {
    const { isAuth } = useAuth();
    const navigate = useNavigate();

    const features = [
        { icon: '🤖', title: 'AI MCQ Generator', desc: 'Our AI processes your uploaded documents to create high-quality exam-standard questions with detailed logic.' },
        { icon: '⏱️', title: 'CBT Exam Simulator', desc: 'Experience a real Computer Based Test (CBT) interface with marking for review and timed sessions.' },
        { icon: '📊', title: 'Deeper Analytics', desc: 'Visualize your progress with subject-wise accuracy charts and standard deviation performance.' },
        { icon: '🎯', title: 'Targeted Syllabus', desc: 'Questions are strictly based on the uploaded documents and syllabus frameworks you provide.' },
        { icon: '📖', title: 'Digital Library', desc: 'Keep all your study material in one place and generate practice tests from them anytime.' },
        { icon: '⚡', title: 'Instant Review', desc: 'Not just scores—get instant explanations for every question to learn while you practice.' },
    ];

    return (
        <div style={{ background: 'white', minHeight: '100vh' }}>
            {/* Top Navigation */}
            <nav style={{ height: 72, borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 5%', background: 'white', position: 'sticky', top: 0, zIndex: 1000 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="sidebar-logo-icon" style={{ width: 34, height: 34 }}>🎯</div>
                    <span style={{ fontSize: 20, fontWeight: 900, color: 'var(--blue-700)' }}>Prepare with AI</span>
                </div>
                <div style={{ display: 'flex', gap: 14 }}>
                    {isAuth ? (
                        <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>Go to Dashboard →</button>
                    ) : (
                        <>
                            <button className="btn btn-ghost" onClick={() => navigate('/login')}>Sign In</button>
                            <button className="btn btn-primary" onClick={() => navigate('/register')}>Get Started for Free</button>
                        </>
                    )}
                </div>
            </nav>

            {/* Hero Section */}
            <header style={{ padding: '80px 5% 100px', textAlign: 'center', background: 'linear-gradient(180deg, #f0f6ff 0%, #ffffff 100%)' }}>
                <div style={{ maxWidth: 800, margin: '0 auto' }}>
                    <div style={{ display: 'inline-block', padding: '6px 16px', background: 'white', border: '1px solid var(--blue-100)', borderRadius: 20, color: 'var(--blue-600)', fontSize: 13, fontWeight: 700, marginBottom: 24, boxShadow: '0 4px 12px rgba(45,127,234,0.06)' }}>
                        ✨ The New Standard for Exam Practice
                    </div>
                    <h1 style={{ fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 900, color: '#1a1a2e', lineHeight: 1.1, marginBottom: 24 }}>
                        Prepare for Competitive Exams with <span style={{ color: 'var(--blue-600)' }}>AI Focus</span>
                    </h1>
                    <p style={{ fontSize: 'clamp(16px, 1.2vw, 20px)', color: '#5a6478', lineHeight: 1.6, marginBottom: 40, maxWidth: 600, margin: '0 auto 40px' }}>
                        Transform your study documents into professional mock tests instantly.
                        The smarter way to ace your exams.
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
                        <button className="btn btn-primary btn-lg" style={{ padding: '16px 40px', fontSize: 18 }} onClick={() => navigate('/register')}>Start Mock Test Now →</button>
                        <button className="btn btn-secondary btn-lg" style={{ padding: '16px 40px', fontSize: 18 }} onClick={() => navigate('/login')}>Explore Features</button>
                    </div>

                    <div style={{ marginTop: 40, display: 'flex', justifyContent: 'center', gap: 20, flexWrap: 'wrap', opacity: 0.6 }}>
                        {['PDF to MCQ', 'Real Timer', 'Expert Explanations', 'Multi-language Support'].map(h => (
                            <span key={h} style={{ fontSize: 12, fontWeight: 700, color: '#1a1a2e' }}>✓ {h}</span>
                        ))}
                    </div>
                </div>
            </header>

            {/* Feature Grid */}
            <section style={{ padding: '80px 5%' }}>
                <div style={{ textAlign: 'center', marginBottom: 60 }}>
                    <h2 style={{ fontSize: 32, fontWeight: 900, marginBottom: 16 }}>Built by Educators, Powered by <span style={{ color: 'var(--blue-600)' }}>AI</span></h2>
                    <p style={{ color: '#5a6478', fontSize: 16 }}>Everything you need to boost your percentile scores</p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 30, maxWidth: 1200, margin: '0 auto' }}>
                    {features.map((f, i) => (
                        <div key={i} className="card" style={{ padding: 40, transition: 'var(--transition)', border: '1px solid #f0f2f5' }}>
                            <div style={{ fontSize: 40, marginBottom: 20 }}>{f.icon}</div>
                            <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 12 }}>{f.title}</h3>
                            <p style={{ color: '#5a6478', lineHeight: 1.6, fontSize: 15 }}>{f.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Exam Banner Style Info */}
            <section style={{ padding: '60px 5%', background: 'var(--blue-700)', color: 'white', textAlign: 'center' }}>
                <div style={{ maxWidth: 900, margin: '0 auto' }}>
                    <h2 style={{ fontSize: 30, fontWeight: 900, marginBottom: 20 }}>Join 1,000+ Aspirants Practicing Daily</h2>
                    <p style={{ fontSize: 18, opacity: 0.9, marginBottom: 32 }}>Stop just reading. Start testing your knowledge with professional-grade MCQs.</p>
                    <button className="btn" style={{ background: 'white', color: 'var(--blue-700)', fontWeight: 800, padding: '14px 32px' }} onClick={() => navigate('/register')}>Create My Free Account</button>
                </div>
            </section>

            {/* Pricing Section */}
            <section style={{ padding: '80px 5%', background: '#f8f9fa' }}>
                <div style={{ textAlign: 'center', marginBottom: 50 }}>
                    <h2 style={{ fontSize: 32, fontWeight: 900, marginBottom: 10 }}>Affordable <span style={{ color: 'var(--blue-600)' }}>Elite</span> Access</h2>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 30, flexWrap: 'wrap', maxWidth: 1000, margin: '0 auto' }}>
                    {/* Free Card */}
                    <div className="card" style={{ flex: '1 1 350px', padding: 40, display: 'flex', flexDirection: 'column', border: '1px solid #ddd' }}>
                        <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 8 }}>BEGINNER</div>
                        <div style={{ fontSize: 40, fontWeight: 900, marginBottom: 2 }}>₹0</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 30 }}>FOREVER FREE</div>
                        <div style={{ flex: 1 }}>
                            {[
                                '3 Mock Tests Daily',
                                'Basic Performance Chart',
                                'Limited PDF Extraction',
                                'Standard Support'
                            ].map(f => (
                                <div key={f} style={{ marginBottom: 14, fontSize: 14, display: 'flex', gap: 10 }}>
                                    <span style={{ color: 'var(--green-500)' }}>✓</span> {f}
                                </div>
                            ))}
                        </div>
                        <button className="btn btn-secondary w-full" style={{ marginTop: 30 }} onClick={() => navigate('/register')}>Get Started</button>
                    </div>

                    {/* Pro Card */}
                    <div className="card" style={{ flex: '1 1 350px', padding: 40, display: 'flex', flexDirection: 'column', border: '2px solid var(--blue-500)', boxShadow: '0 20px 40px rgba(45,127,234,0.1)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--blue-600)', marginBottom: 8 }}>UNLIMITED</div>
                            <span className="badge badge-blue">MOST POPULAR</span>
                        </div>
                        <div style={{ fontSize: 40, fontWeight: 900, marginBottom: 2 }}>₹399</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 30 }}>Billed Monthly</div>
                        <div style={{ flex: 1 }}>
                            {[
                                'Unlimited Mock Tests',
                                'Subject-wise Analytics',
                                'Unlimited PDF Extractions',
                                'Priority Cloud Processing',
                                'Export to PDF Feature',
                                '24/7 Priority Support'
                            ].map(f => (
                                <div key={f} style={{ marginBottom: 14, fontSize: 14, display: 'flex', gap: 10, fontWeight: 600 }}>
                                    <span style={{ color: 'var(--blue-600)' }}>✓</span> {f}
                                </div>
                            ))}
                        </div>
                        <button className="btn btn-primary w-full" style={{ marginTop: 30 }} onClick={() => navigate('/register')}>Go Premium</button>
                    </div>
                </div>
            </section>

            {/* Simple Footer */}
            <footer style={{ padding: '60px 5%', borderTop: '1px solid #eee', textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 20 }}>
                    <div className="sidebar-logo-icon" style={{ width: 30, height: 30, fontSize: 14 }}>🎯</div>
                    <span style={{ fontWeight: 900, color: '#1a1a2e' }}>Prepare with AI</span>
                </div>
                <p style={{ color: '#9ba3b5', fontSize: 13 }}>Built with ❤️ for exam aspirants. All rights reserved © 2026.</p>
            </footer>

            <style>{`
                .card:hover { transform: translateY(-5px); border-color: var(--blue-400); }
                .scrollbar-hide::-webkit-scrollbar { display: none; }
            `}</style>
        </div>
    );
}
