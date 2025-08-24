


import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { Round, Comment, HoleScore, GameFormat, CompetitionFeedItem, Competition, User, Team } from '../types';

// Icons
const HeartIcon: React.FC<{ className?: string; isFilled?: boolean }> = ({ className, isFilled }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={isFilled ? 'currentColor' : 'none'} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 016.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z" />
    </svg>
);

const CommentIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
);

const MoneyIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
      <path d="M8.433 7.418c.158-.103.346-.196.567-.267v1.698a2.5 2.5 0 00-1.162-.328zM11.567 7.151c.221.07.409.164.567.267v-1.698c-.22.063-.408.156-.567.267z" />
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.743.518.75.75 0 00.47 1.372A3.036 3.036 0 0110 6.5V8a1 1 0 002 0V6.5a3.035 3.035 0 011.273.886.75.75 0 101-1.138A4.535 4.535 0 0011 5.092V5zM10 13a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
    </svg>
);


const calculateTotalScore = (scores: HoleScore[] | undefined): number => {
    if (!scores) return 0;
    return scores.reduce((total, hole) => total + (hole.strokes || 0), 0);
};


export const RoundCard: React.FC<{ round: Round }> = ({ round }) => {
    const { users, currentUser, updateRound, competitions, courses } = useAppContext();
    const [isLiked, setIsLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(round.likes);

    const competition = useMemo(() => competitions.find(c => c.id === round.competitionId), [competitions, round.competitionId]);

    const latestFeedMedia = useMemo(() => {
        if (!competition?.feed) return null;
        return [...competition.feed].reverse().find(item => item.type === 'video' || item.type === 'photo');
    }, [competition]);

    const getMatchStatusText = () => {
        if (!round.matchResult || !round.teams || round.teams.length !== 2) return null;
        const [teamA, teamB] = round.teams;
        const winsA = Object.values(round.matchResult).filter(w => w === teamA.id).length;
        const winsB = Object.values(round.matchResult).filter(w => w === teamB.id).length;
        const holesPlayed = Object.keys(round.matchResult).length;
        
        const toPlay = 18 - holesPlayed;
        if (Math.abs(winsA - winsB) > toPlay && holesPlayed > 0) {
            const winner = winsA > winsB ? teamA.name : teamB.name;
            const margin = Math.abs(winsA - winsB);
            return `${winner} won ${margin}&${toPlay}`;
        }
        if (holesPlayed === 0) return null;

        if (winsA > winsB) return `${teamA.name} ${winsA - winsB} UP`;
        if (winsB > winsA) return `${teamB.name} ${winsB - winsA} UP`;
        return 'All Square';
    };
    
    const handleLike = (e: React.MouseEvent) => {
        e.preventDefault(); e.stopPropagation();
        setIsLiked(!isLiked);
        const newLikeCount = isLiked ? likeCount - 1 : likeCount + 1;
        setLikeCount(newLikeCount);
        updateRound({ ...round, likes: newLikeCount });
    };

    const skinsWinnings = useMemo(() => {
        if (!round.skinValue || !round.skinsResult) return null;

        const teamGameFormats = [GameFormat.SCRAMBLE, GameFormat.BEST_BALL, GameFormat.SHAMBLE, GameFormat.MATCH_PLAY];
        const isTeamGame = teamGameFormats.includes(round.gameFormat) && round.teams && round.teams.length > 0;
        
        const participants: (User | Team)[] = isTeamGame ? (round.teams || []) : round.players;
        const winnings: { name: string, value: number }[] = [];

        participants.forEach(p => {
            const totalValue = round.skinsResult!
                .filter(r => r.winnerId === String(p.id))
                .reduce((sum, r) => sum + r.value, 0);
            
            if (totalValue > 0) {
                const name = 'firstName' in p ? p.firstName : p.name;
                winnings.push({ name, value: totalValue });
            }
        });

        return winnings.sort((a, b) => b.value - a.value);
    }, [round]);

    const renderScores = () => {
        if (round.teams && round.teams.length > 0) {
            // Team-based game modes
            return round.teams.map(team => {
                const totalScore = calculateTotalScore(round.scores[team.id]);
                const totalPar = round.scores[team.id]?.reduce((sum, score) => sum + score.par, 0) || 0;
                const scoreToPar = totalScore - totalPar;
                const teamPlayerNames = team.playerIds.map(id => users.find(u => u.id === id)?.firstName).join(', ');

                return (
                    <li key={team.id} className="flex items-center justify-between text-sm bg-gray-50 p-2.5 rounded-lg">
                        <div className="flex items-center gap-3">
                             <div className="w-9 h-9 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">{team.name.charAt(0)}</div>
                            <div>
                                <span className="font-semibold text-gray-800">{team.name}</span>
                                <p className="text-xs text-gray-500">{teamPlayerNames}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="font-bold text-2xl text-gray-800">{totalScore || '-'}</span>
                            <p className="text-xs text-gray-500 -mt-1">{totalScore ? `To Par: ${scoreToPar >= 0 ? `+${scoreToPar}` : scoreToPar}` : ''}</p>
                        </div>
                    </li>
                );
            });
        } else {
            // Individual game modes
            return round.players.map(player => {
                const totalScore = calculateTotalScore(round.scores[String(player.id)]);
                const playerCourse = courses.find(c => c.id === player.courseId) || courses.find(c => c.id === round.courseId);
                const totalPar = playerCourse?.pars.reduce((sum, par) => sum + par, 0) || 0;
                const scoreToPar = totalScore - totalPar;

                return (
                    <li key={player.id} className="flex items-center justify-between text-sm bg-gray-50 p-2.5 rounded-lg">
                        <div className="flex items-center gap-3">
                            <img src={player.profilePictureUrl} alt={`${player.firstName} ${player.lastName}`} className="w-9 h-9 rounded-full object-cover" />
                            <div>
                                <span className="font-semibold text-gray-800">{player.firstName} {player.lastName}</span>
                                <p className="text-xs text-gray-500">{totalScore ? `To Par: ${scoreToPar >= 0 ? `+${scoreToPar}` : scoreToPar}` : 'In Progress'}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="font-bold text-2xl text-gray-800">{totalScore || '-'}</span>
                             {competition?.courses.length > 1 && <p className="text-xs text-gray-500 -mt-1">{playerCourse?.name.split(' ')[0]}</p>}
                        </div>
                    </li>
                );
            });
        }
    };

    return (
        <Link to={`/competitions/${round.competitionId}`} className="block">
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-6 overflow-hidden">
                {/* Post Header */}
                <div className="p-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-xl font-bold text-green-700">{round.courseName}</h3>
                            <p className="text-sm text-gray-500">
                                Part of <span className="font-semibold">{competition?.name || 'a competition'}</span>
                            </p>
                        </div>
                        <div className="text-right">
                            <span className="bg-gray-200 text-gray-700 text-xs font-semibold px-2 py-1 rounded-full">{round.gameFormat}</span>
                            {round.gameFormat === GameFormat.MATCH_PLAY && getMatchStatusText() && (
                                <p className="text-xs text-blue-600 font-bold mt-1 animate-pulse">{getMatchStatusText()}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Players & Scores */}
                <div className="px-4 pb-4">
                    <ul className="space-y-2">
                        {renderScores()}
                    </ul>
                </div>

                {/* Media Display */}
                {latestFeedMedia && (
                    <div className="w-full aspect-video bg-gray-900 flex items-center justify-center border-t border-b border-gray-200 relative">
                         {latestFeedMedia.type === 'video' && latestFeedMedia.videoUrl && (
                            <video src={latestFeedMedia.videoUrl} controls className="w-full h-full object-contain"></video>
                        )}
                        {latestFeedMedia.type === 'photo' && latestFeedMedia.photoUrl && (
                            <img src={latestFeedMedia.photoUrl} alt={`Media from hole ${latestFeedMedia.hole}`} className="w-full h-full object-contain bg-black" />
                        )}
                        <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                            {latestFeedMedia.type === 'video' ? 'Highlight' : 'Photo'} from Hole {latestFeedMedia.hole} by {latestFeedMedia.userName.split(' ')[0]}
                        </div>
                    </div>
                )}
                
                {/* Skins Summary */}
                {skinsWinnings && skinsWinnings.length > 0 && (
                    <div className="px-4 py-2 border-t border-gray-200 bg-yellow-50">
                        <div className="flex items-center gap-2">
                            <MoneyIcon className="h-5 w-5 text-yellow-600" />
                            <p className="text-xs text-gray-700 font-semibold">
                                Skins Winners: {skinsWinnings.map(w => `${w.name} ($${w.value})`).join(', ')}
                            </p>
                        </div>
                    </div>
                )}
                
                {/* AI Summary Section */}
                {round.aiSummary && (
                <div className="p-4 bg-yellow-50 border-t border-gray-200">
                    <p className="text-gray-700 text-sm whitespace-pre-wrap">{round.aiSummary}</p>
                </div>
                )}

                {/* Interaction Bar */}
                <div className="flex items-center gap-4 px-4 py-2 border-t border-gray-200">
                    <button onClick={handleLike} className="flex items-center gap-1.5 text-gray-600 hover:text-red-500">
                        <HeartIcon className={`h-6 w-6 ${isLiked ? 'text-red-500' : ''}`} isFilled={isLiked} />
                        <span className="font-semibold text-sm">{likeCount}</span>
                    </button>
                    <div className="flex items-center gap-1.5 text-gray-600">
                        <CommentIcon className="h-6 w-6" />
                        <span className="font-semibold text-sm">{competition?.feed?.length || 0}</span>
                    </div>
                </div>
            </div>
        </Link>
    );
};