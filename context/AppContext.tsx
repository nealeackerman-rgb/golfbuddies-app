import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { User, Round, Course, Competition, CompetitionFeedItem } from '../types';

// Use a relative path for the API URL. Vite will proxy this to your backend in development.
// In production, you'll replace this with your deployed backend URL.
const API_URL = '/api';

interface AppContextType {
  users: User[];
  rounds: Round[];
  courses: Course[];
  competitions: Competition[];
  currentUser: User | null;
  activeRoundId: string | null;
  isDataLoaded: boolean;
  setActiveRoundId: (roundId: string | null) => void;
  addRound: (newRound: Round) => Promise<void>;
  updateRound: (updatedRound: Round) => Promise<void>;
  updateUser: (updatedUser: User) => Promise<void>;
  addCompetition: (newCompetition: Competition) => Promise<void>;
  updateCompetition: (updatedCompetition: Competition) => Promise<void>;
  addCompetitionFeedItem: (competitionId: string, item: Omit<CompetitionFeedItem, 'id' | 'likes' | 'timestamp'>) => Promise<void>;
  updateCompetitionFeedItem: (competitionId: string, itemId: string, updates: Partial<CompetitionFeedItem>) => Promise<void>;
  login: (email: string, password_or_token: string) => Promise<boolean>;
  logout: () => void;
  register: (newUser: Omit<User, 'id' | 'friendIds' | 'profilePictureUrl'>) => Promise<boolean>;
  addFriend: (friendId: number) => Promise<void>;
  removeFriend: (friendId: number) => Promise<void>;
  addCourse: (newCourse: Course) => Promise<Course | null>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [activeRoundId, setActiveRoundId] = useState<string | null>(() => localStorage.getItem('activeRoundId'));
  const [isDataLoaded, setIsDataLoaded] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
        const savedUser = localStorage.getItem('currentUser');
        return savedUser ? JSON.parse(savedUser) : null;
    } catch {
        return null;
    }
  });

  const getAuthHeaders = () => {
      const token = localStorage.getItem('authToken');
      return {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
      };
  };

  const fetchData = async () => {
    try {
        const [usersRes, coursesRes, competitionsRes, roundsRes] = await Promise.all([
            fetch(`${API_URL}/users`),
            fetch(`${API_URL}/courses`),
            fetch(`${API_URL}/competitions`),
            fetch(`${API_URL}/rounds`),
        ]);
        setUsers(await usersRes.json());
        setCourses(await coursesRes.json());
        setCompetitions(await competitionsRes.json());
        setRounds(await roundsRes.json());
        setIsDataLoaded(true);
    } catch (error) {
        console.error("Failed to fetch initial data:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('currentUser');
      localStorage.removeItem('authToken');
    }
  }, [currentUser]);
  
  useEffect(() => {
    if (activeRoundId) {
        localStorage.setItem('activeRoundId', activeRoundId);
    } else {
        localStorage.removeItem('activeRoundId');
    }
  }, [activeRoundId]);

  const login = async (email: string, password?: string): Promise<boolean> => {
    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
        if (response.ok) {
            const { user, token } = await response.json();
            setCurrentUser(user);
            localStorage.setItem('authToken', token);
            await fetchData(); // Refresh data after login
            return true;
        }
        return false;
    } catch (error) {
        console.error("Login failed:", error);
        return false;
    }
  };

  const logout = () => {
    setCurrentUser(null);
  };
  
  const register = async (newUser: Omit<User, 'id' | 'friendIds' | 'profilePictureUrl'>): Promise<boolean> => {
      try {
          const response = await fetch(`${API_URL}/register`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(newUser),
          });
          if (response.ok) {
              const { user, token } = await response.json();
              setCurrentUser(user);
              localStorage.setItem('authToken', token);
              await fetchData(); // Refresh data
              return true;
          }
          return false;
      } catch (error) {
          console.error("Registration failed:", error);
          return false;
      }
  };

  const addRound = async (newRound: Round) => {
    const response = await fetch(`${API_URL}/rounds`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(newRound),
    });
    const savedRound = await response.json();
    setRounds(prevRounds => [savedRound, ...prevRounds]);
  };
  
  const updateRound = async (updatedRound: Round) => {
    await fetch(`${API_URL}/rounds/${updatedRound.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updatedRound),
    });
    setRounds(prevRounds => prevRounds.map(r => r.id === updatedRound.id ? updatedRound : r));
  };

  const updateUser = async (updatedUser: User) => {
    const response = await fetch(`${API_URL}/users/${updatedUser.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updatedUser)
    });
    const savedUser = await response.json();
    setUsers(users.map(u => u.id === savedUser.id ? savedUser : u));
    if (currentUser && currentUser.id === savedUser.id) {
        setCurrentUser(savedUser);
    }
  };
  
    const addCompetition = async (newCompetition: Competition) => {
        const response = await fetch(`${API_URL}/competitions`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(newCompetition)
        });
        const savedCompetition = await response.json();
        setCompetitions(prev => [savedCompetition, ...prev]);
    };

    const updateCompetition = async (updatedCompetition: Competition) => {
        await fetch(`${API_URL}/competitions/${updatedCompetition.id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(updatedCompetition)
        });
        setCompetitions(prev => prev.map(t => t.id === updatedCompetition.id ? updatedCompetition : t));
    };

    const addCompetitionFeedItem = async (competitionId: string, item: Omit<CompetitionFeedItem, 'id' | 'likes' | 'timestamp'>) => {
        // ID and timestamp are now generated by the backend
        const response = await fetch(`${API_URL}/competitions/${competitionId}/feed`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(item)
        });
        const updatedCompetition = await response.json();
        setCompetitions(prev => prev.map(t => t.id === competitionId ? updatedCompetition : t));
    };

    const updateCompetitionFeedItem = async (competitionId: string, itemId: string, updates: Partial<CompetitionFeedItem>) => {
        const response = await fetch(`${API_URL}/competitions/${competitionId}/feed/${itemId}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(updates)
        });
        const updatedCompetition = await response.json();
        setCompetitions(prev => prev.map(t => t.id === competitionId ? updatedCompetition : t));
    };

  const addFriend = async (friendId: number) => {
      if(!currentUser) return;
      const response = await fetch(`${API_URL}/users/${currentUser.id}/friends`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ friendId })
      });
      const updatedUser = await response.json();
      updateUser(updatedUser);
  };
  
  const removeFriend = async (friendId: number) => {
       if(!currentUser) return;
      const response = await fetch(`${API_URL}/users/${currentUser.id}/friends/${friendId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      const updatedUser = await response.json();
      updateUser(updatedUser);
  };
  
  const addCourse = async (newCourse: Course) => {
    try {
        const response = await fetch(`${API_URL}/courses`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(newCourse)
        });
        const savedCourse = await response.json();
        setCourses(prevCourses => [...prevCourses, savedCourse]);
        return savedCourse;
    } catch (error) {
        console.error("Failed to add course", error);
        return null;
    }
  };

  return (
    <AppContext.Provider value={{ isDataLoaded, users, rounds, courses, competitions, currentUser, activeRoundId, setActiveRoundId, addRound, updateRound, updateUser, addCompetition, updateCompetition, addCompetitionFeedItem, updateCompetitionFeedItem, login, logout, register, addFriend, removeFriend, addCourse }}>
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