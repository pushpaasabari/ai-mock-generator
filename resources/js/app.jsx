import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';
import { Toaster } from 'react-hot-toast';
import '../css/app.css';

// Pages
import LandingPage from './pages/LandingPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import VerifyEmailPage from './pages/VerifyEmailPage.jsx';
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx';
import ResetPasswordPage from './pages/ResetPasswordPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import DocumentsPage from './pages/DocumentsPage.jsx';
import MockTestsPage from './pages/MockTestsPage.jsx';
import QuizPage from './pages/QuizPage.jsx';
import ResultPage from './pages/ResultPage.jsx';
import AnalyticsPage from './pages/AnalyticsPage.jsx';
import AppLayout from './components/layouts/AppLayout.jsx';
import AdminPage from './pages/AdminPage.jsx';

function AdminRoute({ children }) {
    const { isAuth, user } = useAuth();
    if (!isAuth) return <Navigate to="/login" replace />;
    if (!user?.is_admin) return <Navigate to="/dashboard" replace />;
    return children;
}

function PrivateRoute({ children }) {
    const { isAuth } = useAuth();
    return isAuth ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
    const { isAuth } = useAuth();
    return !isAuth ? children : <Navigate to="/dashboard" replace />;
}

function AppRouter() {
    return (
        <AuthProvider>
            <Toaster
                position="top-right"
                toastOptions={{
                    style: {
                        background: '#13132b',
                        color: '#f8fafc',
                        border: '1px solid rgba(139, 92, 246, 0.3)',
                        borderRadius: '12px',
                        fontSize: '14px',
                    },
                    success: { iconTheme: { primary: '#10b981', secondary: '#13132b' } },
                    error: { iconTheme: { primary: '#ef4444', secondary: '#13132b' } },
                }}
            />
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
                <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
                <Route path="/verify-email" element={<VerifyEmailPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />

                <Route path="/dashboard" element={<PrivateRoute><AppLayout><DashboardPage /></AppLayout></PrivateRoute>} />
                <Route path="/documents" element={<PrivateRoute><AppLayout><DocumentsPage /></AppLayout></PrivateRoute>} />
                <Route path="/mock-tests" element={<PrivateRoute><AppLayout><MockTestsPage /></AppLayout></PrivateRoute>} />
                <Route path="/analytics" element={<PrivateRoute><AppLayout><AnalyticsPage /></AppLayout></PrivateRoute>} />
                <Route path="/admin" element={<AdminRoute><AppLayout><AdminPage /></AppLayout></AdminRoute>} />

                <Route path="/quiz/:mockTestId" element={<PrivateRoute><QuizPage /></PrivateRoute>} />
                <Route path="/result/:attemptId" element={<PrivateRoute><AppLayout><ResultPage /></AppLayout></PrivateRoute>} />

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </AuthProvider>
    );
}

// Mount React into the DOM
createRoot(document.getElementById('root')).render(
    <BrowserRouter>
        <AppRouter />
    </BrowserRouter>
);
