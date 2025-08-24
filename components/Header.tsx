
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogoIcon } from './icons/LogoIcon';
import { useAppContext } from '../context/AppContext';

export const Header: React.FC = () => {
  const { currentUser, logout } = useAppContext();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-40">
      <div className="max-w-md mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <Link to="/" className="flex items-center">
            <LogoIcon className="h-6 w-auto" />
          </Link>
          {currentUser && (
            <button
              onClick={handleLogout}
              className="text-sm font-semibold text-gray-600 hover:text-red-600 bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded-md"
            >
              Logout
            </button>
          )}
        </div>
      </div>
    </header>
  );
};