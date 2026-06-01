import React, { createContext, useContext, useState, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

// Setup axios defaults
const api = axios.create({
    baseURL: '/api',
    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }
});

api.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

api.interceptors.response.use(
    res => res,
    err => {
        if (err.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(err);
    }
);

export { api };

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
    });
    const [loading, setLoading] = useState(false);

    const login = useCallback(async (email, password) => {
        setLoading(true);
        try {
            const res = await api.post('/login', { email, password });
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            setUser(res.data.user);
            return { success: true };
        } catch (err) {
            const data = err.response?.data;
            if (err.response?.status === 403 && data?.requires_verification) {
                return { success: false, requiresVerification: true, email: data.email };
            }
            return { success: false, error: data?.message || data?.errors ? Object.values(data.errors).flat().join(' ') : 'Login failed' };
        } finally {
            setLoading(false);
        }
    }, []);

    const register = useCallback(async (data) => {
        setLoading(true);
        try {
            const res = await api.post('/register', data);
            // Registration no longer auto-logs in — must verify email first
            return { success: true, email: res.data.email, requiresVerification: true };
        } catch (err) {
            const errors = err.response?.data?.errors;
            const message = errors ? Object.values(errors).flat().join(' ') : (err.response?.data?.message || 'Registration failed');
            return { success: false, error: message };
        } finally {
            setLoading(false);
        }
    }, []);

    const logout = useCallback(async () => {
        try { await api.post('/logout'); } catch { }
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    }, []);

    const refreshUser = useCallback(async () => {
        try {
            const res = await api.get('/me');
            const updated = res.data.user;
            localStorage.setItem('user', JSON.stringify(updated));
            setUser(updated);
            return updated;
        } catch { }
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser, isAuth: !!user }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
