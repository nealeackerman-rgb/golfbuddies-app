

import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { Layout } from '../components/Layout';
import { User } from '../types';

export const Profile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { users, rounds, updateUser, currentUser } = useAppContext();
  const [isEditing, setIsEditing] = useState(false);
  
  const user = users.find(u => u.id === Number(userId));
  const [formData, setFormData] = useState<User | null>(user || null);

  const userRounds = rounds.filter(r => r.players.some(p => p.id === Number(userId)));
  
  const handicapValue = user?.handicap;
  let handicapDisplay: string;

  if (handicapValue === undefined) {
    handicapDisplay = 'N/A';
  } else if (handicapValue === 0) {
    handicapDisplay = 'SCR';
  } else if (handicapValue < 0) {
    handicapDisplay = `+${-handicapValue}`;
  } else {
    handicapDisplay = String(handicapValue);
  }

  const avgScore = userRounds.length > 0
    ? (userRounds.reduce((acc, round) => {
        const userScores = round.scores[String(user?.id)];
        return acc + (userScores?.reduce((sum, s) => sum + (s.strokes || 0), 0) || 0)
      }, 0) / userRounds.length).toFixed(1)
    : 'N/A';

  useEffect(() => {
    if (user) {
      setFormData(user);
    } else {
        // Redirect if user not found, but not during initial load
        setTimeout(() => navigate('/'), 1000);
    }
  }, [user, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (formData) {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    }
  };
  
  const handleHcpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if(formData) {
          const val = e.target.value;
          let numVal: number;
          if(val.startsWith('+')) {
              numVal = -parseInt(val.substring(1));
          } else {
              numVal = parseInt(val);
          }
          if(!isNaN(numVal)) {
            setFormData({...formData, handicap: numVal})
          }
      }
  }

  const handleSave = () => {
    if (formData) {
      updateUser(formData);
      setIsEditing(false);
    }
  };
  
  const isCurrentUserProfile = currentUser?.id === Number(userId);

  if (!user || !formData) {
    return <Layout><p>Loading profile...</p></Layout>;
  }

  return (
    <Layout>
      <div className="flex flex-col items-center">
        <div className="relative">
          <img src={formData.profilePictureUrl} alt="Profile" className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg" />
          {isEditing && (
             <button className="absolute bottom-0 right-0 bg-blue-500 text-white p-2 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                  <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
                </svg>
             </button>
          )}
        </div>

        <div className="w-full mt-6">
          <div className="text-center mb-6">
             <h1 className="text-2xl font-bold text-gray-800">{user.firstName} {user.lastName}</h1>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center mb-6 p-4 bg-gray-100 rounded-lg">
              <div>
                  <p className="text-sm text-gray-500">Avg Score</p>
                  <p className="text-xl font-bold text-gray-800">{avgScore}</p>
              </div>
              <div>
                  <p className="text-sm text-gray-500">Handicap</p>
                  <p className="text-xl font-bold text-gray-800">{handicapDisplay}</p>
              </div>
              <div>
                  <p className="text-sm text-gray-500">Rounds</p>
                  <p className="text-xl font-bold text-gray-800">{userRounds.length}</p>
              </div>
          </div>
          
          <div className="w-full mb-2 grid grid-cols-2 gap-2">
            <Link to={`/history/${userId}`} className="block w-full text-center bg-white border border-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-lg hover:bg-gray-50">
                Round History
            </Link>
             <Link to={`/friends/${userId}`} className="block w-full text-center bg-white border border-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-lg hover:bg-gray-50">
                View Friends
            </Link>
          </div>

          <div className="space-y-4 mt-4">
            {isEditing ? (
              <>
                <input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} className="w-full p-2 border rounded-lg" placeholder="First Name" />
                <input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} className="w-full p-2 border rounded-lg" placeholder="Last Name" />
                <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full p-2 border rounded-lg" placeholder="Email" />
                <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className="w-full p-2 border rounded-lg" placeholder="Phone" />
                 <div>
                    <label className="text-sm font-bold text-gray-600 block mb-1">Handicap (e.g., 10 or +2)</label>
                    <input type="text" name="handicap" value={formData.handicap < 0 ? `+${-formData.handicap}` : formData.handicap} onChange={handleHcpChange} className="w-full p-2 border rounded-lg" placeholder="e.g. 10 or +2" />
                </div>
              </>
            ) : (
              <div className="text-gray-700 bg-gray-100 p-4 rounded-lg space-y-2">
                  <p><strong>Email:</strong> {user.email}</p>
                  <p><strong>Phone:</strong> {user.phone}</p>
              </div>
            )}
          </div>
          
          {isCurrentUserProfile && (
            <div className="mt-6 flex gap-4">
              {isEditing ? (
                <>
                  <button onClick={handleSave} className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-lg">Save</button>
                  <button onClick={() => setIsEditing(false)} className="w-full bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg">Cancel</button>
                </>
              ) : (
                <button onClick={() => setIsEditing(true)} className="w-full bg-gray-700 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-800">Edit Profile</button>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};