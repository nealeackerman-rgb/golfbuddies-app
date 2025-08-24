
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { useAppContext } from '../context/AppContext';

export const RoundHistory: React.FC = () => {
    const { userId } = useParams<{ userId: string }>();
    const { rounds, users } = useAppContext();
    const user = users.find(u => u.id === Number(userId));
    const userRounds = rounds.filter(r => r.players.some(p => p.id === Number(userId)))
                             .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (!user) {
        return <Layout><p>User not found.</p></Layout>;
    }

    return (
        <Layout>
            <h1 className="text-2xl font-bold text-gray-800 mb-4">{user.firstName}'s Rounds</h1>
            <div className="space-y-3">
                {userRounds.length > 0 ? (
                    userRounds.map(round => {
                        const scoreData = round.scores[user.id];
                        const totalScore = scoreData ? scoreData.reduce((sum, s) => sum + (s.strokes || 0), 0) : 'N/A';
                        return (
                            <div key={round.id} className="bg-white p-4 rounded-lg border border-gray-200 flex justify-between items-center">
                                <div>
                                    <p className="font-semibold text-gray-800">{round.courseName}</p>
                                    <p className="text-sm text-gray-500">{new Date(round.date).toLocaleDateString()}</p>
                                </div>
                                <p className="text-xl font-bold text-gray-800">{totalScore}</p>
                            </div>
                        );
                    })
                ) : (
                    <p className="text-gray-500">No rounds played yet.</p>
                )}
            </div>
             <div className="mt-6">
                <Link to={`/profile/${userId}`} className="text-blue-600 hover:underline">&larr; Back to Profile</Link>
            </div>
        </Layout>
    );
};
