import React, { createContext, useState, useContext, useEffect } from 'react';
import { toast } from 'react-toastify';
import apiClient from '../services/api';
import { registerRestaurant as registerRestaurantRequest } from '../services/api';

const AuthContext = createContext(null);

export const getDefaultRouteForUser = (user) => {
    if (!user) return '/login';
    if (user.role === 'superadmin') return '/superadmin';
    return '/dashboard';
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const persistSession = (authToken, authUser) => {
        localStorage.setItem('token', authToken);
        localStorage.setItem('user', JSON.stringify(authUser));
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
        setUser(authUser);
    };

    useEffect(() => {
        // Check if token exists in localStorage
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (token && storedUser) {
            setUser(JSON.parse(storedUser));
            // Set default header
            apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
        setLoading(false);
    }, []);

    const login = async (username, password) => {
        try {
            const response = await apiClient.post('/auth/login', { username, password });
            const { token, user } = response;

            persistSession(token, user);
            toast.success(`Bem-vindo, ${user.username}!`);
            return user;
        } catch (err) {
            console.error(err);
            toast.error('Login falhou. Verifique suas credenciais.');
            return null;
        }
    };

    const registerRestaurant = async (payload) => {
        try {
            const response = await registerRestaurantRequest(payload);
            const { token, user, restaurant } = response;

            persistSession(token, user);
            toast.success(`Restaurante ${restaurant?.name || 'criado'} registrado com sucesso!`);
            return { user, restaurant };
        } catch (err) {
            console.error(err);
            toast.error(err?.response?.data?.error || 'Não foi possível registrar o restaurante.');
            return null;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        delete apiClient.defaults.headers.common['Authorization'];
        setUser(null);
        toast.info('Logout realizado.');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, registerRestaurant, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
