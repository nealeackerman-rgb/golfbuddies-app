
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';

export const ProtectedRoute: React.FC = () => {
    const { currentUser } = useAppContext();

    if (!currentUser) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
};
