
import React from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { useAppContext } from '../context/AppContext';
import { Competition } from '../types';

const CompetitionCard: React.FC<{ competition: Competition }> = ({ competition }) => {
    return (
        <Link to={`/start-round/${competition.id}`} className="block bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
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
        </Link>
    )
}

export const SelectCompetition: React.FC = () => {
    const { competitions, currentUser } = useAppContext();
    
    if (!currentUser) {
        return <Layout><p>Loading...</p></Layout>
    }

    const myCompetitions = competitions.filter(c => c.participantIds.includes(currentUser.id) && c.status === 'Active');

    return (
        <Layout>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Select Competition</h1>
                    <p className="text-gray-500">Choose one to start your round.</p>
                </div>
                <Link to="/competitions/new" className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow-sm hover:bg-blue-700 flex-shrink-0">
                    Create New
                </Link>
            </div>
            <div className="space-y-4">
                {myCompetitions.length > 0 ? (
                    myCompetitions.map(c => <CompetitionCard key={c.id} competition={c} />)
                ) : (
                    <div className="text-center bg-gray-100 p-6 rounded-lg">
                        <p className="text-gray-600 mb-4">You haven't joined any active competitions yet.</p>
                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                             <Link to="/competitions" className="inline-block bg-white border border-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-lg hover:bg-gray-50">
                                Browse All
                            </Link>
                            <Link to="/competitions/new" className="inline-block bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700">
                                Create Competition
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};