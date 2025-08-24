import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { User, Round, Course, Competition, CompetitionFeedItem } from '../types';
import { MOCK_USERS, MOCK_ROUNDS, MOCK_COURSES, MOCK_COMPETITIONS } from '../constants';

interface AppContextType {
  users: User[];
  rounds: Round[];
  courses: Course[];
  competitions: Competition[];
  currentUser: User | null;
  activeRoundId: string | null;
  setActiveRoundId: (roundId: string | null) => void;
  addRound: (newRound: Round) => void;
  updateRound: (updatedRound: Round) => void;
  updateUser: (updatedUser: User) => void;
  addCompetition: (newCompetition: Competition) => void;
  updateCompetition: (updatedCompetition: Competition) => void;
  addCompetitionFeedItem: (competitionId: string, item: Omit<CompetitionFeedItem, 'id' | 'likes'>) => void;
  updateCompetitionFeedItem: (competitionId: string, itemId: string, updates: Partial<CompetitionFeedItem>) => void;
  login: (email: string, password_or_token: string) => boolean;
  logout: () => void;
  register: (newUser: Omit<User, 'id' | 'friendIds' | 'profilePictureUrl'>) => boolean;
  addFriend: (friendId: number) => void;
  removeFriend: (friendId: number) => void;
  addCourse: (newCourse: Course) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [rounds, setRounds] = useState<Round[]>(MOCK_ROUNDS);
  const [courses, setCourses] = useState<Course[]>(MOCK_COURSES);
  const [competitions, setCompetitions] = useState<Competition[]>(MOCK_COMPETITIONS);
  const [activeRoundId, setActiveRoundId] = useState<string | null>(() => localStorage.getItem('activeRoundId'));
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('currentUser');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('currentUser');
    }
  }, [currentUser]);
  
  useEffect(() => {
    if (activeRoundId) {
        localStorage.setItem('activeRoundId', activeRoundId);
    } else {
        localStorage.removeItem('activeRoundId');
    }
  }, [activeRoundId]);

  const login = (email: string, password?: string): boolean => {
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    if (user) {
      setCurrentUser(user);
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
  };
  
  const register = (newUser: Omit<User, 'id' | 'friendIds' | 'profilePictureUrl'>): boolean => {
      const userExists = users.some(u => u.email.toLowerCase() === newUser.email.toLowerCase());
      if(userExists) {
          alert("User with this email already exists.");
          return false;
      }
      
      const createdUser: User = {
          ...newUser,
          id: Date.now(), // simple unique id
          friendIds: [],
          profilePictureUrl: `https://picsum.photos/seed/${Date.now()}/200/200` // random profile pic
      };
      
      setUsers(prev => [...prev, createdUser]);
      setCurrentUser(createdUser);
      return true;
  };

  const addRound = (newRound: Round) => {
    setRounds(prevRounds => [newRound, ...prevRounds]);
  };
  
  const updateRound = (updatedRound: Round) => {
    setRounds(prevRounds => prevRounds.map(r => r.id === updatedRound.id ? updatedRound : r));
  };

  const updateUser = (updatedUser: User) => {
    const updatedUsers = users.map(u => u.id === updatedUser.id ? updatedUser : u);
    setUsers(updatedUsers);
    if (currentUser && currentUser.id === updatedUser.id) {
        setCurrentUser(updatedUser);
    }
  };
  
    const addCompetition = (newCompetition: Competition) => {
        setCompetitions(prev => [newCompetition, ...prev]);
    };

    const updateCompetition = (updatedCompetition: Competition) => {
        setCompetitions(prev => prev.map(t => t.id === updatedCompetition.id ? updatedCompetition : t));
    };

    const addCompetitionFeedItem = (competitionId: string, item: Omit<CompetitionFeedItem, 'id' | 'likes'>) => {
        setCompetitions(prev => prev.map(t => {
            if (t.id === competitionId) {
                const newItem: CompetitionFeedItem = {
                    ...item,
                    id: `feed-${Date.now()}`,
                    likes: 0
                };
                const newFeed = [newItem, ...(t.feed || [])];
                return { ...t, feed: newFeed };
            }
            return t;
        }));
    };

    const updateCompetitionFeedItem = (competitionId: string, itemId: string, updates: Partial<CompetitionFeedItem>) => {
        setCompetitions(prev => prev.map(t => {
            if (t.id === competitionId) {
                const newFeed = (t.feed || []).map(item => {
                    if (item.id === itemId) {
                        return { ...item, ...updates };
                    }
                    return item;
                });
                return { ...t, feed: newFeed };
            }
            return t;
        }));
    };

  const addFriend = (friendId: number) => {
      if(!currentUser) return;
      const updatedUser: User = {
          ...currentUser,
          friendIds: [...(currentUser.friendIds || []), friendId]
      };
      updateUser(updatedUser);
  };
  
  const removeFriend = (friendId: number) => {
       if(!currentUser) return;
      const updatedUser: User = {
          ...currentUser,
          friendIds: (currentUser.friendIds || []).filter(id => id !== friendId)
      };
      updateUser(updatedUser);
  };
  
  const addCourse = (newCourse: Course) => {
    setCourses(prevCourses => [...prevCourses, newCourse]);
  };

  return (
    <AppContext.Provider value={{ users, rounds, courses, competitions, currentUser, activeRoundId, setActiveRoundId, addRound, updateRound, updateUser, addCompetition, updateCompetition, addCompetitionFeedItem, updateCompetitionFeedItem, login, logout, register, addFriend, removeFriend, addCourse }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};