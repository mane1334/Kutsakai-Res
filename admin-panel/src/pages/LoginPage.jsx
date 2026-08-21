import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FiUser, FiLock, FiCoffee } from 'react-icons/fi';

const LoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from?.pathname;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!username || !password) return;

        const loggedUser = await login(username, password);
        if (loggedUser) {
            navigate(from || "/", { replace: true });
        }
    };

    return (
        <div className="admin-login-container">
            <div className="admin-login-card">
                <div className="text-center mb-8 flex flex-col items-center">
                    <div className="h-12 w-12 rounded-full bg-[#fff1f2] flex items-center justify-center text-[#6d2430] mb-3 border border-[#e7c8c2] shadow-sm">
                        <FiCoffee className="h-6 w-6 stroke-[1.8]" />
                    </div>
                    <h1 className="text-2xl font-black text-[#571923] tracking-tight">Gestão Pro</h1>
                    <p className="text-xs uppercase tracking-widest text-[#7a4a54] font-bold mt-1">Admin Panel</p>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="admin-field-label">Usuário</label>
                        <div className="admin-input-wrapper">
                            <FiUser className="admin-input-icon h-4 w-4" />
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="admin-input-with-icon"
                                required
                            />
                        </div>
                    </div>
                    <div>
                        <label className="admin-field-label">Senha</label>
                        <div className="admin-input-wrapper">
                            <FiLock className="admin-input-icon h-4 w-4" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="admin-input-with-icon"
                                required
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        className="admin-login-btn"
                    >
                        Entrar
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-[#fff1f2] space-y-3">
                    <p className="text-center text-xs text-[#7a4a54]">
                        Novo restaurante?{' '}
                        <Link to="/register" className="font-bold text-[#6d2430] hover:text-[#571923] hover:underline transition-colors">
                            Criar cadastro
                        </Link>
                    </p>
                    <p className="text-center text-xs text-[#7a4a54]">
                        Primeiro acesso da plataforma?{' '}
                        <Link to="/setup-superadmin" className="font-bold text-[#6d2430] hover:text-[#571923] hover:underline transition-colors">
                            Criar superadmin inicial
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
