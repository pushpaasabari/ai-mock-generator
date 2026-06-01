import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import toast from 'react-hot-toast';

const getNavItems = (user) => [
    { icon: '🏠', label: 'Dashboard', path: '/dashboard' },
    { icon: '📚', label: 'Study Material', path: '/documents' },
    { icon: '📝', label: 'Mock Tests', path: '/mock-tests' },
    { icon: '📊', label: 'Analytics', path: '/analytics' },
    ...(user?.is_admin ? [{ icon: '🛡️', label: 'Admin Panel', path: '/admin', badge: 'ADMIN' }] : []),
];

export default function AppLayout({ children }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const navItems = getNavItems(user);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const handleLogout = async () => {
        await logout();
        toast.success('Logged out successfully');
        navigate('/');
    };

    const currentPage = navItems.find(n => n.path === location.pathname);

    return (
        <div className={`layout ${isSidebarOpen ? 'sidebar-open' : ''}`}>
            {/* Sidebar Overlay */}
            {isSidebarOpen && <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />}

            {/* Sidebar */}
            <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
                {/* Mobile Close Button */}
                <button className="sidebar-close-btn" onClick={() => setIsSidebarOpen(false)}>✕</button>

                {/* Logo */}
                <div className="sidebar-logo">
                    <div className="sidebar-logo-icon">🎯</div>
                    <div>
                        <div className="sidebar-logo-text">Prepare with AI</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em' }}>AI EXAM PLATFORM</div>
                    </div>
                </div>

                {/* Nav */}
                <nav className="sidebar-nav">
                    <div className="sidebar-section-label">Main Menu</div>
                    {navItems.map(item => (
                        <button
                            key={item.path}
                            className={`sidebar-item ${location.pathname === item.path ? 'active' : ''}`}
                            onClick={() => {
                                navigate(item.path);
                                setIsSidebarOpen(false);
                            }}
                        >
                            <span className="icon">{item.icon}</span>
                            {item.label}
                            {item.badge && <span className="sidebar-badge">{item.badge}</span>}
                        </button>
                    ))}
                </nav>

                {/* Footer */}
                <div className="sidebar-footer">
                    {/* User info */}
                    <div className="plan-badge" onClick={() => toast('Pro plan coming soon!', { icon: '⭐' })}>
                        {/* ... user avatar ... */}
                        <div style={{
                            width: 30, height: 30, borderRadius: '50%',
                            background: 'linear-gradient(135deg, var(--blue-600), var(--blue-400))',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 12, fontWeight: 700, color: 'white', flexShrink: 0
                        }}>
                            {(user?.name || 'U')[0].toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {user?.name || 'User'}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                {user?.is_admin ? '🛡️ Admin' : user?.is_pro ? '⭐ Pro Plan' : 'Free Plan'}
                            </div>
                        </div>
                        {!user?.is_pro && !user?.is_admin && (
                            <span style={{
                                fontSize: '10px', padding: '2px 8px', flexShrink: 0,
                                background: 'var(--orange-500)', borderRadius: '20px',
                                color: 'white', fontWeight: 700
                            }}>↑ Pro</span>
                        )}
                    </div>

                    <button className="sidebar-item" onClick={handleLogout} style={{ color: 'var(--red-500)', marginTop: 2 }}>
                        <span className="icon">🚪</span>
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="main-content">
                {/* Topbar */}
                <header className="topbar">
                    <div className="topbar-left">
                        {/* Mobile Menu Toggle */}
                        <button className="menu-toggle-btn" onClick={() => setIsSidebarOpen(true)}>☰</button>

                        <div className="breadcrumb-desktop">
                            {/* <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Prepare with AI</span>
                            <span style={{ color: 'var(--border)', fontSize: 16 }}> › </span> */}
                        </div>
                        <span style={{ fontSize: 15, fontWeight: 700 }}>
                            {currentPage?.label || 'Dashboard'}
                        </span>
                    </div>

                    <div className="topbar-right">
                        {/* Notification bell */}
                        <button className="icon-btn-outline" onClick={() => toast('No new notifications', { icon: '🔔' })}>
                            🔔
                        </button>

                        {/* User avatar */}
                        <div
                            className="user-avatar"
                            title={user?.name}
                            onClick={() => toast(`Logged in as ${user?.name || 'User'}`, { icon: '👤' })}
                        >
                            {(user?.name || 'U')[0].toUpperCase()}
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <div className="fade-in">
                    {children}
                </div>
            </main>
        </div>
    );
}
