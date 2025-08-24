
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { LogoIcon } from '../components/icons/LogoIcon';

export const Login: React.FC = () => {
    const navigate = useNavigate();
    const { login, users } = useAppContext();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const success = login(email, password);
        if (success) {
            navigate('/');
        } else {
            setError('Invalid email or password.');
        }
    };
    
    const handleGoogleSignIn = () => {
        // Mock Google Sign-In by logging in the first user
        if (users.length > 0) {
            if (login(users[0].email, users[0].password)) {
                 navigate('/');
            }
        } else {
            setError("No mock users available for Google Sign-In.");
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center p-4">
            <div className="max-w-sm w-full bg-white p-8 rounded-xl shadow-lg">
                <div className="flex flex-col items-center mb-6">
                    <LogoIcon className="h-10 w-auto mb-2" />
                    <h1 className="text-3xl font-bold text-gray-800">Welcome Back</h1>
                    <p className="text-gray-500">Sign in to continue to GolfBuddies</p>
                </div>

                {error && <p className="bg-red-100 text-red-700 p-3 rounded-lg text-center mb-4">{error}</p>}
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-sm font-bold text-gray-600 block mb-1">Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>
                    <div>
                        <label className="text-sm font-bold text-gray-600 block mb-1">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>
                    <button type="submit" className="w-full bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 transition-colors">
                        Sign In
                    </button>
                </form>
                
                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="bg-white px-2 text-gray-500">Or continue with</span>
                    </div>
                </div>

                <button onClick={handleGoogleSignIn} className="w-full flex justify-center items-center gap-2 bg-white border border-gray-300 text-gray-700 font-bold py-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"></path><path fill="#FF3D00" d="m6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"></path><path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.222 0-9.618-3.66-11.283-8.591l-6.522 5.025C9.505 39.556 16.227 44 24 44z"></path><path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.022 35.244 44 30.028 44 24c0-1.341-.138-2.65-.389-3.917z"></path></svg>
                    Google
                </button>
                
                <p className="text-center text-sm text-gray-600 mt-8">
                    Don't have an account?{' '}
                    <Link to="/register" className="font-bold text-blue-600 hover:underline">
                        Sign Up
                    </Link>
                </p>
            </div>
        </div>
    );
};