import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../contexts/AuthContext.jsx';
import toast from 'react-hot-toast';

export default function QuizPage() {
    const { mockTestId } = useParams();
    const [searchParams] = useSearchParams();
    const attemptId = searchParams.get('attemptId');
    const navigate = useNavigate();

    const [test, setTest] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [answers, setAnswers] = useState({});
    const [status, setStatus] = useState({}); // { questionId: 'answered' | 'not_answered' | 'review' }
    const [visited, setVisited] = useState(new Set([0]));
    const [currentQ, setCurrentQ] = useState(0);
    const [timeLeft, setTimeLeft] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [startTime] = useState(Date.now());
    const timerRef = useRef(null);

    // Helper to shuffle array
    const shuffleArray = (array) => {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    };

    useEffect(() => {
        const fetchTest = async () => {
            try {
                const res = await api.get(`/mock-tests/${mockTestId}`);
                setTest(res.data.mock_test);

                // Shuffle options for each question
                const processedQuestions = (res.data.questions || []).map(q => {
                    const originalOptions = q.options || [];
                    const mappedOptions = originalOptions.map((opt, index) => ({
                        text: opt.replace(/^[A-D]\.\s*/, ''),
                        originalLetter: ['A', 'B', 'C', 'D'][index]
                    }));
                    return {
                        ...q,
                        shuffledOptions: shuffleArray(mappedOptions)
                    };
                });

                setQuestions(processedQuestions);
                setTimeLeft(res.data.mock_test.duration_minutes * 60);
                if (processedQuestions.length > 0) {
                    setVisited(new Set([0]));
                }
            } catch (err) {
                toast.error('Failed to load test');
                navigate('/mock-tests');
            } finally {
                setLoading(false);
            }
        };
        fetchTest();
    }, [mockTestId, navigate]);

    useEffect(() => {
        if (timeLeft === null) return;
        if (timeLeft <= 0) {
            handleSubmit(true);
            return;
        }
        timerRef.current = setTimeout(() => setTimeLeft(t => t - 1), 1000);
        return () => clearTimeout(timerRef.current);
    }, [timeLeft]);

    const handleSelect = useCallback((questionId, option) => {
        setAnswers(prev => ({ ...prev, [questionId]: option }));
        setStatus(prev => ({ ...prev, [questionId]: 'answered' }));

        // Auto move to next on mobile (<= 768px width)
        if (window.innerWidth <= 768 && currentQ < questions.length - 1) {
            setTimeout(() => {
                setCurrentQ(c => c + 1);
                setVisited(v => new Set([...v, currentQ + 1]));
            }, 300); // 300ms delay for visual feedback
        }
    }, [currentQ, questions.length]);

    const markForReview = () => {
        const qId = questions[currentQ].id;
        setStatus(prev => ({ ...prev, [qId]: 'review' }));
        if (currentQ < questions.length - 1) {
            setCurrentQ(c => c + 1);
            setVisited(v => new Set([...v, currentQ + 1]));
        }
    };

    const clearSelection = () => {
        const qId = questions[currentQ].id;
        setAnswers(prev => {
            const next = { ...prev };
            delete next[qId];
            return next;
        });
        setStatus(prev => ({ ...prev, [qId]: 'not_answered' }));
    };

    const nextQuestion = () => {
        if (currentQ < questions.length - 1) {
            setCurrentQ(c => c + 1);
            setVisited(v => new Set([...v, currentQ + 1]));
        }
    };

    const prevQuestion = () => {
        if (currentQ > 0) {
            setCurrentQ(c => c - 1);
            setVisited(v => new Set([...v, currentQ - 1]));
        }
    };

    const handleSubmit = useCallback(async (timedOut = false) => {
        if (submitting) return;
        if (!timedOut && !confirm('Are you sure you want to submit the test?')) return;

        setSubmitting(true);
        clearTimeout(timerRef.current);
        const timeTaken = Math.floor((Date.now() - startTime) / 1000);

        try {
            await api.post(`/attempts/${attemptId}/submit`, {
                answers,
                time_taken_seconds: timeTaken,
                timed_out: timedOut,
            });
            toast.success(timedOut ? 'Time\'s up! Submitted.' : 'Test submitted successfully!');
            navigate(`/result/${attemptId}`);
        } catch (err) {
            toast.error('Submission failed. Check your connection.');
            setSubmitting(false);
        }
    }, [answers, attemptId, startTime, submitting, navigate]);

    const formatTime = (secs) => {
        const h = Math.floor(secs / 3600);
        const m = Math.floor((secs % 3600) / 60);
        const s = secs % 60;
        return h > 0 ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}` : `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    if (loading) return <div className="loading-overlay"><div className="spinner" /></div>;

    const q = questions[currentQ];
    const answeredCount = Object.keys(answers).length;
    const reviewCount = Object.values(status).filter(s => s === 'review').length;
    const timerClass = timeLeft < 60 ? 'danger' : timeLeft < 300 ? 'warning' : '';

    return (
        <div className="quiz-page-container" style={{ background: '#f8f9fa' }}>
            {/* CBT Header */}
            <header className="quiz-header" style={{ height: 60, background: 'var(--blue-700)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div className="sidebar-logo-icon" style={{ background: 'white', color: 'var(--blue-700)', width: 34, height: 34 }}>🎯</div>
                    <div>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>{test?.title}</div>
                        <div className="quiz-header-logo-text" style={{ fontSize: 11, opacity: 0.8 }}>TNPSC Recruitment Exam Platform</div>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div className={`quiz-timer ${timerClass}`}>
                        {formatTime(timeLeft)}
                    </div>
                    <button className="btn btn-orange btn-sm" onClick={() => handleSubmit(false)}>Submit Test</button>
                </div>
            </header>

            {/* Main Area */}
            <div className="quiz-main" style={{ display: 'flex', flex: 1 }}>

                {/* Left: Question Area */}
                <div className="quiz-question-area" style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'white', borderRight: '1px solid #ddd' }}>
                    <div style={{ padding: '20px 30px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--blue-700)' }}>Question No. {currentQ + 1}</div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <span className="badge badge-gray">{q?.topic || 'General'}</span>
                            <span className="badge badge-blue">Difficulty: {q?.difficulty || 'Medium'}</span>
                        </div>
                    </div>

                    <div className="quiz-content-inner fade-in" style={{ flex: 1, overflowY: 'auto' }} key={currentQ}>
                        <div className="question-text" style={{ fontSize: 18, marginBottom: 30, color: '#2c3e50', lineHeight: 1.6 }}>
                            {q?.question}
                        </div>
                        <div className="options-grid" style={{ maxWidth: 600 }}>
                            {(q?.shuffledOptions || []).map((optionObj, i) => {
                                const displayLetter = ['A', 'B', 'C', 'D'][i];
                                const isSelected = answers[q.id] === optionObj.originalLetter;
                                return (
                                    <button
                                        key={i}
                                        className={`option-btn ${isSelected ? 'selected' : ''}`}
                                        onClick={() => handleSelect(q.id, optionObj.originalLetter)}
                                        style={{ marginBottom: 4 }}
                                    >
                                        <span className="option-label" style={{ borderRadius: 6 }}>{displayLetter}</span>
                                        {optionObj.text}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Footer Nav Buttons */}
                    <div className="quiz-nav-footer" style={{ padding: '16px 30px', borderTop: '1px solid #eee', background: '#f8f9fa', display: 'flex', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <button className="btn btn-secondary" onClick={markForReview}>Mark for Review</button>
                            <button className="btn btn-ghost" onClick={clearSelection}>Clear Selection</button>
                        </div>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <button className="btn btn-ghost" onClick={prevQuestion} disabled={currentQ === 0}>← Previous</button>
                            <button className="btn btn-primary" style={{ padding: '10px 30px' }} onClick={nextQuestion} disabled={currentQ === questions.length - 1}>Save & Next</button>
                        </div>
                    </div>
                </div>

                {/* Right: Palette Sidebar */}
                <div className="quiz-palette" style={{ width: 280, display: 'flex', flexDirection: 'column', background: '#f8f9fa' }}>
                    {/* User Info */}
                    <div style={{ padding: 20, borderBottom: '1px solid #ddd', display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div className="user-avatar" style={{ boxShadow: 'none' }}>{(test?.document?.title || 'T')[0]}</div>
                        <div style={{ overflow: 'hidden' }}>
                            <div style={{ fontSize: 13, fontWeight: 700 }}>Question Palette</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Attempt details below</div>
                        </div>
                    </div>

                    {/* Status Summary */}
                    <div style={{ padding: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 11, fontWeight: 700 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 14, height: 14, background: 'var(--green-500)', borderRadius: 2 }} /> {answeredCount} Answered
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 14, height: 14, background: '#eee', border: '1px solid #ccc', borderRadius: 2 }} /> {questions.length - visited.size} Not Visited
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 14, height: 14, background: 'var(--orange-500)', borderRadius: 2 }} /> {visited.size - answeredCount} Not Answered
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 14, height: 14, background: 'var(--blue-500)', borderRadius: 2 }} /> {reviewCount} Review
                        </div>
                    </div>

                    {/* Palette Grid */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: 15 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
                            {questions.map((qt, i) => {
                                let bgColor = visited.has(i) ? 'var(--orange-500)' : '#eee';
                                let color = visited.has(i) ? 'white' : '#777';
                                let border = '1px solid transparent';

                                if (status[qt.id] === 'answered') bgColor = 'var(--green-500)';
                                if (status[qt.id] === 'review') bgColor = 'var(--blue-500)';
                                if (!visited.has(i)) border = '1px solid #ccc';
                                if (i === currentQ) border = '2px solid #000';

                                return (
                                    <button
                                        key={qt.id}
                                        onClick={() => { setCurrentQ(i); setVisited(v => new Set([...v, i])); }}
                                        style={{
                                            width: '100%', aspectRatio: '1', borderRadius: '4px',
                                            border, background: bgColor, color,
                                            fontSize: 12, fontWeight: 700, cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            transition: 'var(--transition)'
                                        }}
                                    >
                                        {i + 1}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Palette Footer */}
                    <div style={{ padding: 16, borderTop: '1px solid #ddd' }}>
                        <button className="btn btn-secondary btn-sm w-full" onClick={() => handleSubmit(false)}>Submit Exam</button>
                    </div>
                </div>
            </div>

            {/* Instruction Footer */}
            <footer className="quiz-footer" style={{ height: 40, borderTop: '1px solid #ddd', background: '#eee', display: 'flex', alignItems: 'center', px: 24, fontSize: 11, color: '#666', padding: '0 24px' }}>
                <span className="quiz-header-logo-text">Standard Instruction: Negative marks applied as per TNPSC guidelines.</span>
                <span style={{ marginLeft: 'auto' }}>Prepare with AI Exam Engine v2.0</span>
            </footer>
        </div>
    );
}
