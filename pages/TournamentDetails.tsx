

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { useAppContext } from '../context/AppContext';
import { Competition, User, Team, GameFormat, CompetitionFeedItem } from '../types';

const CompetitionFeedForm: React.FC<{ competitionId: string, isParticipant: boolean }> = ({ competitionId, isParticipant }) => {
    const { currentUser, addCompetitionFeedItem } = useAppContext();
    const [comment, setComment] = useState('');

    if (!isParticipant) {
        return null;
    }

    const handlePostComment = () => {
        if (!comment.trim() || !currentUser) return;
        addCompetitionFeedItem(competitionId, {
            userId: currentUser.id,
            userName: `${currentUser.firstName} ${currentUser.lastName}`,
            userProfilePictureUrl: currentUser.profilePictureUrl,
            timestamp: new Date().toISOString(),
            type: 'comment',
            text: comment.trim(),
        });
        setComment('');
    };

    return (
        <div className="flex gap-2 pt-4 mt-4 border-t border-gray-100">
            <input 
                type="text"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Talk some trash..."
                className="flex-grow bg-gray-100 border border-gray-200 rounded-full px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button onClick={handlePostComment} className="text-blue-600 font-semibold text-sm hover:text-blue-800 disabled:text-gray-400" disabled={!comment.trim() || !currentUser}>Post</button>
        </div>
    );
};

export const CompetitionDetails: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { competitionId } = useParams<{ competitionId: string }>();
    const { competitions, users, currentUser, updateCompetition } = useAppContext();
    
    const [competition, setCompetition] = useState<Competition | null>(null);
    const [activeTab, setActiveTab] = useState<'feed' | 'details'>(location.state?.defaultTab || 'feed');

    useEffect(() => {
        const foundCompetition = competitions.find(t => t.id === competitionId);
        if (foundCompetition) {
            setCompetition(JSON.parse(JSON.stringify(foundCompetition)));
        } else {
            navigate('/competitions');
        }
    }, [competitionId, competitions, navigate]);

    const isCreator = useMemo(() => currentUser?.id === competition?.creatorId, [currentUser, competition]);
    const isParticipant = useMemo(() => !!currentUser && !!competition?.participantIds.includes(currentUser.id), [currentUser, competition]);

    const isTeamMode = useMemo(() => {
        if (!competition) return false;
        const teamModes = [GameFormat.SCRAMBLE, GameFormat.BEST_BALL, GameFormat.SHAMBLE];
        return teamModes.includes(competition.gameFormat);
    }, [competition]);

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!competition) return;
        setCompetition({ ...competition, name: e.target.value });
    };
    
    const handleTeamNameChange = (teamId: string, newName: string) => {
        if (!competition?.teams) return;
        const newTeams = competition.teams.map(t => t.id === teamId ? { ...t, name: newName } : t);
        setCompetition({ ...competition, teams: newTeams });
    };

    const handleAddTeam = () => {
        if (!competition) return;
        const newTeam: Team = {
            id: `team-${Date.now()}`,
            name: `Team ${ (competition.teams?.length || 0) + 1 }`,
            playerIds: []
        };
        const updatedTeams = [...(competition.teams || []), newTeam];
        setCompetition({...competition, teams: updatedTeams });
    };
    
    const assignPlayerToTeam = (player: User, teamId: string) => {
        if (!competition) return;
        let newTeams = (competition.teams || []).map(team => ({
            ...team,
            playerIds: team.playerIds.filter(id => id !== player.id)
        }));
        
        const targetTeamIndex = newTeams.findIndex(t => t.id === teamId);
        if(targetTeamIndex > -1) {
            newTeams[targetTeamIndex].playerIds.push(player.id);
        }
        
        setCompetition({ ...competition, teams: newTeams });
    };
    
    const unassignPlayer = (player: User) => {
         if (!competition?.teams) return;
         const newTeams = competition.teams.map(team => ({
            ...team,
            playerIds: team.playerIds.filter(id => id !== player.id)
        }));
        setCompetition({ ...competition, teams: newTeams });
    };

    const handleSaveChanges = () => {
        if (competition) {
            updateCompetition(competition);
            alert('Competition updated!');
        }
    };

    if (!competition || !currentUser) {
        return <Layout><p>Loading competition...</p></Layout>;
    }
    
    const participants = users.filter(u => competition.participantIds.includes(u.id));
    const assignedPlayerIds = new Set(competition.teams?.flatMap(t => t.playerIds) || []);
    const unassignedPlayers = participants.filter(p => !assignedPlayerIds.has(p.id));

    return (
        <Layout>
             <div className="flex justify-between items-start mb-4">
                <input 
                    type="text" 
                    value={competition.name} 
                    onChange={handleNameChange}
                    readOnly={!isCreator}
                    className="text-2xl font-bold text-gray-800 bg-transparent w-full focus:outline-none read-only:border-transparent focus:border-b-2 focus:border-blue-500"
                />
            </div>
            
            {/* Tab Navigation */}
            <div className="flex border-b border-gray-200 mb-6">
                <button
                    onClick={() => setActiveTab('feed')}
                    className={`py-2 px-4 text-sm font-semibold -mb-px ${activeTab === 'feed' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Feed
                </button>
                <button
                    onClick={() => setActiveTab('details')}
                    className={`py-2 px-4 text-sm font-semibold -mb-px ${activeTab === 'details' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Details
                </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'feed' && (
                <div className="bg-white p-4 rounded-lg shadow-sm border">
                    <h3 className="text-xl font-bold mb-3">Competition Feed</h3>
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                        {(competition.feed || []).length === 0 && <p className="text-sm text-gray-500 text-center py-4">No activity yet. Be the first to post!</p>}
                        {[...(competition.feed || [])].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map(item => (
                            <div key={item.id} className="flex gap-3">
                                <img src={item.userProfilePictureUrl} alt={item.userName} className="w-10 h-10 rounded-full object-cover mt-1"/>
                                <div className="flex-1">
                                    <div className="bg-gray-100 p-3 rounded-lg">
                                        <p className="font-bold text-gray-800 text-sm">{item.userName}</p>
                                        {item.type === 'comment' && <p className="text-gray-700 text-sm whitespace-pre-wrap">{item.text}</p>}
                                        {item.type === 'video' && item.videoUrl && (
                                            <div className="mt-2">
                                                <video src={item.videoUrl} controls className="w-full rounded-md aspect-video bg-black"></video>
                                                <p className="text-xs text-gray-500 mt-1">Highlight from Hole {item.hole}</p>
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1">{new Date(item.timestamp).toLocaleDateString()}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <CompetitionFeedForm competitionId={competition.id} isParticipant={isParticipant}/>
                </div>
            )}

            {activeTab === 'details' && (
                <div className="space-y-6">
                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                        <div className="space-y-2">
                            <div>
                                <strong>Courses:</strong>
                                <ul className="list-disc list-inside ml-4">
                                {competition.courses.map(c => <li key={c.id}>{c.name}</li>)}
                                </ul>
                            </div>
                            <p><strong>Game Format:</strong> {competition.gameFormat}</p>
                            <p><strong>Status:</strong> {competition.status}</p>
                            {isTeamMode && <p><strong>Team Size:</strong> {competition.teamSize || 'N/A'}</p>}
                        </div>
                        <Link to={`/competitions/${competition.id}/leaderboard`} className="block w-full text-center mt-4 bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 transition-colors">
                            View Leaderboard
                        </Link>
                    </div>

                    {isCreator && isTeamMode && (
                        <div className="bg-white p-4 rounded-lg shadow-sm border">
                            <h3 className="text-xl font-bold mb-4">Manage Teams</h3>
                            <div className="mb-4">
                                <h4 className="font-semibold text-gray-700">Unassigned Players</h4>
                                <div className="p-2 bg-gray-50 rounded mt-2 space-y-2">
                                    {unassignedPlayers.length > 0 ? unassignedPlayers.map(p => (
                                        <div key={p.id} className="flex items-center justify-between text-sm p-1">
                                            <span>{p.firstName} {p.lastName}</span>
                                            <div className="flex gap-1 flex-wrap justify-end">
                                                {(competition.teams || []).map(team => (
                                                    <button key={team.id} onClick={() => assignPlayerToTeam(p, team.id)} className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-0.5 rounded">
                                                        To {team.name}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )) : <p className="text-xs text-gray-500 p-1">All players assigned.</p>}
                                </div>
                            </div>
                            
                            <div className="space-y-4">
                                {(competition.teams || []).map(team => (
                                    <div key={team.id} className="bg-gray-50 p-3 rounded-lg border">
                                        <input type="text" value={team.name} onChange={e => handleTeamNameChange(team.id, e.target.value)} className="font-bold text-lg w-full bg-transparent border-b focus:outline-none mb-2" />
                                        <div className="space-y-1 mt-2">
                                            {team.playerIds.map(pId => {
                                                const player = users.find(u => u.id === pId);
                                                return player ? (
                                                    <div key={pId} className="flex justify-between items-center text-sm bg-white p-1 rounded">
                                                        <span>{player.firstName} {player.lastName}</span>
                                                        <button onClick={() => unassignPlayer(player)} className="text-xs text-red-600 font-semibold px-1">&times; Unassign</button>
                                                    </div>
                                                ) : null;
                                            })}
                                            {team.playerIds.length === 0 && <p className="text-xs text-gray-500">No players assigned.</p>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button onClick={handleAddTeam} className="mt-4 bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded-lg text-sm w-full hover:bg-gray-300">
                                + Add New Team
                            </button>
                        </div>
                    )}

                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                        <h3 className="text-xl font-bold mb-2">Participants ({participants.length})</h3>
                        <div className="space-y-2">
                            {participants.map(p => (
                                <div key={p.id} className="bg-gray-50 p-3 rounded-lg flex items-center gap-3 border">
                                    <img src={p.profilePictureUrl} alt={p.firstName} className="w-8 h-8 rounded-full object-cover" />
                                    <span>{p.firstName} {p.lastName}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
            
            <div className="mt-6">
                {isCreator && (
                    <button onClick={handleSaveChanges} className="w-full mb-4 bg-blue-600 text-white font-bold py-3 px-4 rounded-lg shadow-lg hover:bg-blue-700">
                        Save Changes
                    </button>
                )}
                 <Link to="/competitions" className="text-blue-600 hover:underline">&larr; Back to Competitions</Link>
            </div>
        </Layout>
    );
};