
import React from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { useAppContext } from '../context/AppContext';
import { Competition } from '../types';

const CompetitionCard: React.FC<{ competition: Competition }> = ({ competition }) => {
    const { users } = useAppContext();
    const creator = users.find(u => u.id === competition.creatorId);

    return (
        <Link to={`/competitions/${competition.id}`} className="block bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="font-bold text-lg text-gray-800">{competition.name}</h2>
                    <p className="text-sm text-gray-500">Format: {competition.gameFormat}</p>
                    <p className="text-sm text-gray-500">Players: {competition.participantIds.length}</p>
                </div>
                <div className={`text-xs font-semibold px-2 py-1 rounded-full ${competition.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {competition.status}
                </div>
            </div>
            {creator && <p className="text-xs text-gray-400 mt-2">Created by {creator.firstName} {creator.lastName}</p>}
        </Link>
    )
}


export const CompetitionList: React.FC = () => {
    const { competitions } = useAppContext();
    return (
        <Layout>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Competitions</h1>
                <Link to="/competitions/new" className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow-sm hover:bg-blue-700">
                    Create
                </Link>
            </div>
            <div className="space-y-4">
                {competitions.length > 0 ? (
                    competitions.map(t => <CompetitionCard key={t.id} competition={t} />)
                ) : (
                    <p className="text-gray-500 text-center mt-8">No competitions yet. Why not create one?</p>
                )}
            </div>
        </Layout>
    );
};