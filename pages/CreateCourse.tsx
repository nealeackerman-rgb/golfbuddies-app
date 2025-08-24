import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { useAppContext } from '../context/AppContext';
import { Course } from '../types';

const shuffle = (array: number[]) => [...array].sort(() => Math.random() - 0.5);

export const CreateCourse: React.FC = () => {
    const navigate = useNavigate();
    const { addCourse, courses } = useAppContext();
    const [name, setName] = useState('');
    const [location, setLocation] = useState('');
    const [rating, setRating] = useState<number | ''>(72.0);
    const [slope, setSlope] = useState<number | ''>(113);
    const [pars, setPars] = useState<Array<number | ''>>(Array(18).fill(4));

    const handleParChange = (index: number, value: string) => {
        const newPars = [...pars];
        newPars[index] = value === '' ? '' : parseInt(value, 10);
        setPars(newPars);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!name || !location || rating === '' || slope === '' || pars.some(p => p === '' || isNaN(Number(p)))) {
            alert('Please fill out all fields correctly.');
            return;
        }

        const newCourseId = (courses.length > 0 ? Math.max(...courses.map(c => c.id)) : 0) + 1;
        const newCourse: Course = {
            id: newCourseId,
            name,
            location,
            rating: Number(rating),
            slope: Number(slope),
            pars: pars.map(p => Number(p)),
            handicapIndices: shuffle(Array.from({ length: 18 }, (_, i) => i + 1)),
        };
        
        addCourse(newCourse);
        navigate('/competitions/new', { state: { newCourseId } });
    };

    const renderHoleInputs = (start: number, end: number) => {
        return (
            <div className="grid grid-cols-10 text-center gap-1 items-center">
                <div className="font-bold text-gray-600 text-sm">Hole</div>
                {Array.from({ length: 9 }, (_, i) => <div key={i} className="font-bold text-gray-600 text-sm">{start + i}</div>)}
                <div className="font-bold text-gray-700 text-sm">Par</div>
                {pars.slice(start - 1, end).map((par, index) => (
                    <div key={start + index}>
                        <input
                            type="number"
                            min="3"
                            max="5"
                            value={par}
                            onChange={(e) => handleParChange(start - 1 + index, e.target.value)}
                            className="w-full h-10 text-center border border-gray-300 rounded-md"
                        />
                    </div>
                ))}
            </div>
        );
    };


    return (
        <Layout>
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Add New Course</h1>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="p-4 bg-white rounded-lg border">
                    <h2 className="text-lg font-semibold text-gray-700 mb-2">Course Information</h2>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-600">Course Name</label>
                            <input id="name" type="text" value={name} onChange={e => setName(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg mt-1" required />
                        </div>
                        <div>
                            <label htmlFor="location" className="block text-sm font-medium text-gray-600">City, State</label>
                            <input id="location" type="text" value={location} onChange={e => setLocation(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg mt-1" required />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="rating" className="block text-sm font-medium text-gray-600">Course Rating</label>
                                <input id="rating" type="number" step="0.1" value={rating} onChange={e => setRating(e.target.value === '' ? '' : parseFloat(e.target.value))} className="w-full p-3 border border-gray-300 rounded-lg mt-1" required />
                            </div>
                            <div>
                                <label htmlFor="slope" className="block text-sm font-medium text-gray-600">Slope Rating</label>
                                <input id="slope" type="number" value={slope} onChange={e => setSlope(e.target.value === '' ? '' : parseInt(e.target.value))} className="w-full p-3 border border-gray-300 rounded-lg mt-1" required />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-white rounded-lg border">
                    <h2 className="text-lg font-semibold text-gray-700 mb-4">Hole Pars</h2>
                    <div className="space-y-4">
                        {renderHoleInputs(1, 9)}
                        {renderHoleInputs(10, 18)}
                    </div>
                </div>
                
                <button type="submit" className="w-full bg-green-600 text-white font-bold text-lg py-4 px-4 rounded-lg shadow-lg hover:bg-green-700">
                    Save Course
                </button>
            </form>
        </Layout>
    );
};
