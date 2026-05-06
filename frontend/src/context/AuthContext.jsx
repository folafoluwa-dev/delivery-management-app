import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios.js';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('access');
        if (token) {
            fetchUser();
        } else {
            setLoading(false);
        }
    }, []);

    const fetchUser = async () => {
        try {
            const res = await api.get('/auth/me/');
            setUser(res.data);
        } catch (err) {
            // ✅ Only clear if it's actually an auth error
            if (err.response?.status === 401 || err.response?.status === 403) {
                localStorage.clear();
            }
        } finally {
            setLoading(false);
        }
    };
    const login = async (email, password) => {
        const res = await api.post('/auth/login/', { email, password });

        localStorage.setItem('access', res.data.access);
        localStorage.setItem('refresh', res.data.refresh);

        // ✅ This is the critical line
        api.defaults.headers.common['Authorization'] = `Bearer ${res.data.access}`;

        const userRes = await api.get('/auth/me/');
        setUser(userRes.data);
        return userRes.data;
    };

    const register = async (formData) => {
        const res = await api.post('/auth/register/', formData);
        // ✅ Store tokens first before calling /me/
        localStorage.setItem('access', res.data.access);
        localStorage.setItem('refresh', res.data.refresh);
        setUser(res.data.user);
        return res.data.user;
    };

    const logout = () => {
        localStorage.clear();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, setUser, login, register, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);