

import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { useAppContext } from '../context/AppContext';
import { GameFormat, User, Competition, Course } from '../types';

export const CreateCompetition: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { currentUser, users, courses, addCompetition } = useAppContext();
    const [name, setName] = useState('');
    const [isNameManuallyEdited, setIsNameManuallyEdited] = useState(false);
    const [gameFormat, setGameFormat] = useState<GameFormat>(GameFormat.STROKE_PLAY);
    const [participants, setParticipants] = useState<User[]>([]);
    const [playerSearch, setPlayerSearch] = useState('');
    const [teamSize, setTeamSize] = useState<number>(2);
    const [addSkins, setAddSkins] = useState(false);
    const [skinValue, setSkinValue] = useState<number>(5);
    const [skinsScoringType, setSkinsScoringType] = useState<'gross' | 'net'>('gross');

    const [selectedCourses, setSelectedCourses] = useState<Course[]>([]);
    const [courseSearch, setCourseSearch] = useState('');
    const [courseResults, setCourseResults] = useState<Course[]>([]);
    const [isSearchingCourses, setIsSearchingCourses] = useState(false);

    useEffect(() => {
        if(currentUser && participants.length === 0) {
            setParticipants([currentUser]);
        }
    }, [currentUser, participants]);
    
    useEffect(() => {
        if (isNameManuallyEdited || participants.length === 0) {
            return;
        }

        const participantNames = participants.map(p => p.firstName).join(', ');
        const currentDate = new Date().toLocaleDateString('en-US');
        const autoName = `${participantNames} ${currentDate}`;
        setName(autoName);
    }, [participants, isNameManuallyEdited]);
    
    useEffect(() => {
        const newCourseId = location.state?.newCourseId;
        if (newCourseId) {
            const newCourse = courses.find(c => c.id === newCourseId);
            if (newCourse && !selectedCourses.some(c => c.id === newCourse.id)) {
                setSelectedCourses(prev => [...prev, newCourse]);
            }
            // Clear location state to prevent re-adding on re-render
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location.state, courses, selectedCourses, navigate]);

    useEffect(() => {
        if (courseSearch.trim().length < 2) {
            setCourseResults([]);
            return;
        }
        setIsSearchingCourses(true);
        const debounceTimer = setTimeout(() => {
            const lowercasedQuery = courseSearch.toLowerCase();
            const results = courses.filter(course =>
              course.name.toLowerCase().includes(lowercasedQuery) ||
              course.location.toLowerCase().includes(lowercasedQuery)
            );
            setCourseResults(results);
            setIsSearchingCourses(false);
        }, 300);
        return () => clearTimeout(debounceTimer);
    }, [courseSearch, courses]);

    const searchResults = useMemo(() => {
        if (!playerSearch) return [];
        return users.filter(user => 
            !participants.some(p => p.id === user.id) &&
            `${user.firstName} ${user.lastName}`.toLowerCase().includes(playerSearch.toLowerCase())
        ).slice(0, 5);
    }, [playerSearch, users, participants]);
    
    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setName(e.target.value);
        setIsNameManuallyEdited(true);
    };
    
    const handleAddCourse = (course: Course) => {
        if (!selectedCourses.some(c => c.id === course.id)) {
            setSelectedCourses(prev => [...prev, course]);
        }
        setCourseSearch('');
        setCourseResults([]);
    };

    const handleRemoveCourse = (courseId: number) => {
        setSelectedCourses(prev => prev.filter(c => c.id !== courseId));
    };

    const handleAddParticipant = (user: User) => {
        if (participants.length < 40) {
            setParticipants(prev => [...prev, user]);
            setPlayerSearch('');
        }
    };

    const handleRemoveParticipant = (userId: number) => {
        if (userId === currentUser?.id) return;
        setParticipants(prev => prev.filter(p => p.id !== userId));
    };

    const isTeamMode = useMemo(() => {
        return [GameFormat.SCRAMBLE, GameFormat.BEST_BALL, GameFormat.SHAMBLE].includes(gameFormat);
    }, [gameFormat]);

    const handleSubmit = () => {
        if (!name.trim() || !currentUser || participants.length === 0 || selectedCourses.length === 0) {
            alert('Please provide a competition name, select at least one course, and invite at least one player.');
            return;
        }

        const newCompetition: Competition = {
            id: `comp-${Date.now()}`,
            name: name.trim(),
            creatorId: currentUser.id,
            courses: selectedCourses.map(c => ({ id: c.id, name: c.name })),
            participantIds: participants.map(p => p.id),
            gameFormat,
            status: 'Active',
            teamSize: isTeamMode ? teamSize : undefined,
            feed: [],
            skinValue: addSkins ? skinValue : undefined,
            skinsScoringType: addSkins ? skinsScoringType : undefined,
        };
        
        addCompetition(newCompetition);
        navigate('/competitions');
    };

    return (
        <Layout>
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Create New Competition</h1>

            <div className="space-y-6">
                <div>
                    <label className="block text-lg font-semibold text-gray-700 mb-2">1. Invite Players ({participants.length}/40)</label>
                    <div className="relative">
                         <input
                            type="text"
                            value={playerSearch}
                            onChange={e => setPlayerSearch(e.target.value)}
                            placeholder="Search for registered players..."
                            className="w-full p-3 border border-gray-300 rounded-lg"
                        />
                        {searchResults.length > 0 && (
                            <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-48 overflow-y-auto shadow-lg">
                                {searchResults.map(user => (
                                    <li key={user.id} onClick={() => handleAddParticipant(user)} className="p-3 hover:bg-gray-100 cursor-pointer flex items-center gap-3">
                                        <img src={user.profilePictureUrl} alt={user.firstName} className="w-8 h-8 rounded-full object-cover"/>
                                        <span>{user.firstName} {user.lastName}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                    <div className="mt-4 space-y-2">
                        {participants.map(p => (
                            <div key={p.id} className="p-2 rounded-lg flex items-center justify-between bg-gray-100 border border-gray-200">
                                <span className="font-semibold">{p.firstName} {p.lastName} {p.id === currentUser?.id ? '(Creator)' : ''}</span>
                                {p.id !== currentUser?.id && (
                                    <button onClick={() => handleRemoveParticipant(p.id)} className="text-xs text-red-500 font-bold">Remove</button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-lg font-semibold text-gray-700 mb-2">2. Competition Name</label>
                    <input
                        type="text"
                        value={name}
                        onChange={handleNameChange}
                        placeholder="Competition name is auto-generated"
                        className="w-full p-3 border border-gray-300 rounded-lg"
                    />
                </div>
                
                <div>
                    <label className="block text-lg font-semibold text-gray-700 mb-2">3. Select Courses</label>
                    <div className="space-y-2 mb-2">
                        {selectedCourses.map(course => (
                             <div key={course.id} className="bg-blue-100 border border-blue-300 text-blue-800 p-3 rounded-lg flex justify-between items-center">
                                <span>{course.name}</span>
                                <button onClick={() => handleRemoveCourse(course.id)} className="font-bold text-lg">&times;</button>
                            </div>
                        ))}
                    </div>
                    <div className="relative">
                        <input
                            type="text"
                            value={courseSearch}
                            onChange={(e) => setCourseSearch(e.target.value)}
                            placeholder="Search for courses to add..."
                            className="w-full p-3 border border-gray-300 rounded-lg"
                        />
                        {isSearchingCourses && <div className="p-3 text-gray-500">Searching...</div>}
                        {courseResults.length > 0 && !isSearchingCourses && (
                            <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-48 overflow-y-auto shadow-lg">
                                {courseResults.map(course => (
                                    <li key={course.id} onClick={() => handleAddCourse(course)} className="p-3 hover:bg-gray-100 cursor-pointer">
                                        {course.name}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                     <div className="mt-3">
                        <Link to="/courses/new" className="block w-full text-center bg-gray-100 border border-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors">
                            + Add New Course
                        </Link>
                    </div>
                </div>

                <div>
                    <label className="block text-lg font-semibold text-gray-700 mb-2">4. Game Format</label>
                    <select
                        value={gameFormat}
                        onChange={e => setGameFormat(e.target.value as GameFormat)}
                        className="w-full p-3 border border-gray-300 rounded-lg bg-white appearance-none"
                    >
                        <option value={GameFormat.STROKE_PLAY}>Stroke Play</option>
                        <option value={GameFormat.SCRAMBLE}>Scramble</option>
                        <option value={GameFormat.SHAMBLE}>Shamble</option>
                        <option value={GameFormat.BEST_BALL}>Best Ball</option>
                    </select>
                </div>

                {isTeamMode && (
                     <div>
                        <label className="block text-lg font-semibold text-gray-700 mb-2">Players Per Team</label>
                        <input
                            type="number"
                            min="2"
                            max="4"
                            value={teamSize}
                            onChange={e => setTeamSize(parseInt(e.target.value))}
                            className="w-full p-3 border border-gray-300 rounded-lg"
                        />
                    </div>
                )}
                
                <div>
                    <label className="block text-lg font-semibold text-gray-700 mb-2">5. Add Skins Game? (Optional)</label>
                    <div className="bg-gray-50 p-3 border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between">
                            <label htmlFor="addSkins" className="font-semibold text-gray-700 cursor-pointer">
                                Enable Skins Game
                            </label>
                             <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                                <input
                                    type="checkbox"
                                    id="addSkins"
                                    checked={addSkins}
                                    onChange={e => setAddSkins(e.target.checked)}
                                    className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                                />
                                <label htmlFor="addSkins" className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"></label>
                            </div>
                        </div>
                        {addSkins && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                                <label htmlFor="skinValue" className="block text-sm font-medium text-gray-600 mb-1">Value Per Hole ($)</label>
                                <input
                                    id="skinValue"
                                    type="number"
                                    min="1"
                                    value={skinValue}
                                    onChange={e => setSkinValue(parseInt(e.target.value) || 1)}
                                    className="w-full p-3 border border-gray-300 rounded-lg"
                                />
                                <div className="mt-4">
                                    <label className="block text-sm font-medium text-gray-600 mb-2">Skins Scoring</label>
                                    <div className="flex gap-1 rounded-lg bg-gray-200 p-1">
                                        <button onClick={() => setSkinsScoringType('gross')} className={`w-full p-2 rounded-md text-sm font-semibold transition-all duration-200 ${skinsScoringType === 'gross' ? 'bg-white shadow' : 'bg-transparent text-gray-600'}`}>
                                            Gross Score
                                        </button>
                                        <button onClick={() => setSkinsScoringType('net')} className={`w-full p-2 rounded-md text-sm font-semibold transition-all duration-200 ${skinsScoringType === 'net' ? 'bg-white shadow' : 'bg-transparent text-gray-600'}`}>
                                            Net Score
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">
                                        {skinsScoringType === 'gross' 
                                            ? "Lowest raw score wins the hole." 
                                            : "Lowest score after applying handicaps wins. For Scramble, a simplified team handicap is used."}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <style>{`
                    .toggle-checkbox:checked { right: 0; border-color: #2563EB; }
                    .toggle-checkbox:checked + .toggle-label { background-color: #2563EB; }
                `}</style>


                <button
                    onClick={handleSubmit}
                    disabled={!name.trim() || selectedCourses.length === 0 || participants.length === 0}
                    className="w-full bg-green-600 text-white font-bold text-lg py-4 px-4 rounded-lg shadow-lg hover:bg-green-700 disabled:bg-gray-400"
                >
                    Create Competition
                </button>
            </div>
        </Layout>
    );
};