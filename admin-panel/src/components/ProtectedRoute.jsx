import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, roles }) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return <div className="p-10 text-center">Carregando...</div>;
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (Array.isArray(roles) && !roles.includes(user.role)) {
        return <Navigate to={user.role === 'superadmin' ? '/superadmin' : '/dashboard'} replace />;
    }

    return children;
};

export default ProtectedRoute;
