
import React, { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { Layout } from '../components/Layout';
import { User } from '../types';

const UserCard: React.FC<{user: User, isFriend: boolean, onAdd: () => void, onRemove: () => void}> = ({ user, isFriend, onAdd, onRemove }) => {
    return (
        <div className="bg-white p-3 rounded-lg border border-gray-200 flex items-center justify-between">
            <Link to={`/profile/${user.id}`} className="flex items-center gap-3">
                <img src={user.profilePictureUrl} alt={user.firstName} className="w-10 h-10 rounded-full object-cover" />
                <div>
                    <p className="font-semibold text-gray-800">{user.firstName} {user.lastName}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                </div>
            </Link>
            {isFriend ? (
                 <button onClick={onRemove} className="bg-red-100 text-red-700 font-semibold text-sm py-1 px-3 rounded-md hover:bg-red-200">Remove</button>
            ) : (
                 <button onClick={onAdd} className="bg-blue-100 text-blue-700 font-semibold text-sm py-1 px-3 rounded-md hover:bg-blue-200">Add</button>
            )}
        </div>
    )
}

export const Friends: React.FC = () => {
    const { userId } = useParams<{ userId: string }>();
    const { users, currentUser, addFriend, removeFriend } = useAppContext();
    const [searchQuery, setSearchQuery] = useState('');

    const viewingUser = users.find(u => u.id === Number(userId));

    const friends = useMemo(() => {
        if (!viewingUser?.friendIds) return [];
        return users.filter(u => viewingUser.friendIds!.includes(u.id));
    }, [viewingUser, users]);

    const searchResults = useMemo(() => {
        if (!searchQuery) return [];
        return users.filter(u => 
            u.id !== currentUser?.id &&
            `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [searchQuery, users, currentUser]);
    
    if (!viewingUser || !currentUser) {
        return <Layout><p>Loading...</p></Layout>
    }

    const isMyFriendsPage = currentUser.id === viewingUser.id;

    return (
        <Layout>
            <h1 className="text-2xl font-bold text-gray-800 mb-4">
                {isMyFriendsPage ? "My Friends" : `${viewingUser.firstName}'s Friends`}
            </h1>
            
            {isMyFriendsPage && (
                 <div className="mb-6">
                    <input 
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search for new friends..."
                        className="w-full p-3 border border-gray-300 rounded-lg"
                    />
                 </div>
            )}

            <div className="space-y-3">
                {searchQuery ? (
                    <>
                        <h2 className="text-lg font-semibold text-gray-700">Search Results</h2>
                        {searchResults.length > 0 ? searchResults.map(user => (
                            <UserCard 
                                key={user.id} 
                                user={user}
                                isFriend={(currentUser.friendIds || []).includes(user.id)}
                                onAdd={() => addFriend(user.id)}
                                onRemove={() => removeFriend(user.id)}
                            />
                        )) : <p className="text-gray-500">No users found.</p>}
                    </>
                ) : (
                    <>
                        {friends.length > 0 ? friends.map(user => (
                            <UserCard 
                                key={user.id} 
                                user={user}
                                isFriend={isMyFriendsPage}
                                onAdd={() => {}} // Not applicable here
                                onRemove={() => removeFriend(user.id)}
                            />
                        )) : (
                            <p className="text-gray-500 bg-gray-100 p-4 rounded-lg text-center">
                                {isMyFriendsPage ? "You haven't added any friends yet. Use the search bar to find people!" : `${viewingUser.firstName} hasn't added any friends yet.`}
                            </p>
                        )}
                    </>
                )}
            </div>
            
             <div className="mt-6">
                <Link to={`/profile/${userId}`} className="text-blue-600 hover:underline">&larr; Back to Profile</Link>
            </div>
        </Layout>
    );
};