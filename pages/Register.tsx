

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { LogoIcon } from '../components/icons/LogoIcon';

export const Register: React.FC = () => {
    const navigate = useNavigate();
    const { register } = useAppContext();
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '', // Phone is optional for registration
        password: '',
    });
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const {firstName, lastName, email, phone, password} = formData;
        if (!firstName || !lastName || !email || !password) {
            setError("Please fill out all required fields.");
            return;
        }

        // Default handicap for new users. In a real app, this might be part of the onboarding process.
        const success = register({ firstName, lastName, email, phone, password, handicap: 36 });
        if (success) {
            navigate('/');
        } else {
            setError('An account with this email may already exist.');
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center p-4">
            <div className="max-w-sm w-full bg-white p-8 rounded-xl shadow-lg">
                <div className="flex flex-col items-center mb-6">
                    <LogoIcon className="h-10 w-auto mb-2" />
                    <h1 className="text-3xl font-bold text-gray-800">Create Account</h1>
                    <p className="text-gray-500">Join the GolfBuddies community</p>
                </div>

                {error && <p className="bg-red-100 text-red-700 p-3 rounded-lg text-center mb-4">{error}</p>}
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex gap-4">
                        <input name="firstName" onChange={handleChange} placeholder="First Name" className="w-full p-3 border rounded-lg" required />
                        <input name="lastName" onChange={handleChange} placeholder="Last Name" className="w-full p-3 border rounded-lg" required />
                    </div>
                    <input name="email" type="email" onChange={handleChange} placeholder="Email Address" className="w-full p-3 border rounded-lg" required />
                    <input name="password" type="password" onChange={handleChange} placeholder="Password" className="w-full p-3 border rounded-lg" required />
                    
                    <button type="submit" className="w-full bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 transition-colors">
                        Create Account
                    </button>
                </form>
                
                <p className="text-center text-sm text-gray-600 mt-8">
                    Already have an account?{' '}
                    <Link to="/login" className="font-bold text-blue-600 hover:underline">
                        Sign In
                    </Link>
                </p>
            </div>
        </div>
    );
};
