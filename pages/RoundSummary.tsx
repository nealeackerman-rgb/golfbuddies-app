


import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Round, GameFormat, User, Competition, Team } from '../types';
import { useAppContext } from '../context/AppContext';
import { getAIRoundSummary } from '../services/geminiService';
import { Scorecard } from '../components/Scorecard';
import { calculateCourseHandicap, getStrokesForHole } from '../services/handicap';

const getFinalMatchScoreText = (round: Round): string => {
    if (!round.matchResult || !round.teams || round.teams.length !== 2) return "Match Incomplete";
    
    const [teamA, teamB] = round.teams;
    const winsA = Object.values(round.matchResult).filter(winner => winner === teamA.id).length;
    const winsB = Object.values(round.matchResult).filter(winner => winner === teamB.id).length;
    const ties = Object.values(round.matchResult).filter(winner => winner === 'TIE').length;
    
    const holesPlayed = winsA + winsB + ties;
    const toPlay = 18 - holesPlayed;

    if (Math.abs(winsA - winsB) > toPlay) {
         const winner = winsA > winsB ? teamA : teamB;
         const loser = winsA > winsB ? teamB : teamA;
         const winnerWins = Math.max(winsA, winsB);
         const loserWins = Math.min(winsA, winsB);
         const margin = winnerWins - loserWins;
         const holesLeft = 18 - (holesPlayed - ties - loserWins); // Dormie calculation
         return `${winner.name} won ${margin} & ${holesLeft}`;
    }
    
    if (holesPlayed === 18) {
        if (winsA === winsB) return "Match Tied";
        const winner = winsA > winsB ? teamA : teamB;
        const margin = Math.abs(winsA - winsB);
        return `${winner.name} won ${margin} UP`;
    }

    return "Match Incomplete";
};

// A modal component to congratulate the winner(s)
const WinnerModal = ({ winners, onClose }: { winners: User[], onClose: () => void }) => {
    if (winners.length === 0) return null;
    
    const winnerNames = winners.map(w => `${w.firstName} ${w.lastName}`).join(' & ');
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-white p-8 rounded-2xl shadow-xl text-center relative transform transition-all" onClick={e => e.stopPropagation()}>
                <div className="text-yellow-400 mx-auto mb-4">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 mx-auto" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 2a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 2zM5.22 5.22a.75.75 0 011.06 0l1.06 1.06a.75.75 0 01-1.06 1.06l-1.06-1.06a.75.75 0 010-1.06zM2 10a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5A.75.75 0 012 10zm3.22 4.78a.75.75 0 010 1.06l-1.06 1.06a.75.75 0 01-1.06-1.06l1.06-1.06a.75.75 0 011.06 0zm7.56-1.06a.75.75 0 011.06 0l1.06-1.06a.75.75 0 011.06 1.06l-1.06 1.06a.75.75 0 01-1.06 0zM18 10a.75.75 0 01.75.75h1.5a.75.75 0 010-1.5h-1.5a.75.75 0 01-.75.75zM14.78 5.22a.75.75 0 010-1.06l1.06-1.06a.75.75 0 011.06 1.06l-1.06 1.06a.75.75 0 01-1.06 0zM10 18a.75.75 0 01-.75.75v1.5a.75.75 0 011.5 0v-1.5a.75.75 0 01-.75-.75z" />
                        <path fillRule="evenodd" d="M9.5 13.25a.75.75 0 01.75-.75h4a.75.75 0 010 1.5h-4a.75.75 0 01-.75-.75zM9.5 6.75a.75.75 0 01.75-.75h.01a.75.75 0 010 1.5H10.25a.75.75 0 01-.75-.75zM6 10a.75.75 0 01.75-.75h.01a.75.75 0 010 1.5H6.75A.75.75 0 016 10zM10 16a.75.75 0 01.75-.75h.01a.75.75 0 010 1.5H10.75a.75.75 0 01-.75-.75z" clipRule="evenodd" />
                         <path fillRule="evenodd" d="M10 1.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2.694 12.954a.75.75 0 010-1.06l.884-.884a.75.75 0 011.06 0l.53.53a6.973 6.973 0 019.624 0l.53-.53a.75.75 0 011.06 0l.884.884a.75.75 0 010 1.06l-1.628 1.628a.75.75 0 01-1.06 0l-.53-.53a5.474 5.474 0 00-7.742 0l-.53.53a.75.75 0 01-1.06 0L2.694 12.954z" clipRule="evenodd" />
                    </svg>
                </div>
                <h2 className="text-4xl font-bold text-gray-800 mb-2">Congratulations!</h2>
                <p className="text-2xl font-semibold text-gray-800 mb-6">{winnerNames}</p>
                <button onClick={onClose} className="w-full bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors">
                    Awesome!
                </button>
            </div>
        </div>
    )
}

const SkinsResults: React.FC<{ round: Round }> = ({ round }) => {
    const teamGameFormats = [GameFormat.SCRAMBLE, GameFormat.BEST_BALL, GameFormat.SHAMBLE, GameFormat.MATCH_PLAY];
    const isTeamGame = teamGameFormats.includes(round.gameFormat) && round.teams && round.teams.length > 0;
    
    const participants: (User | Team)[] = isTeamGame ? round.teams! : round.players;
    
    const skinsWinners: { [id: string]: { entity: User | Team, totalValue: number, skinsCount: number } } = {};
    
    participants.forEach(p => {
        skinsWinners[String(p.id)] = { entity: p, totalValue: 0, skinsCount: 0 };
    });

    round.skinsResult?.forEach(result => {
        if (result.winnerId && skinsWinners[result.winnerId]) {
            skinsWinners[result.winnerId].totalValue += result.value;
            skinsWinners[result.winnerId].skinsCount += 1;
        }
    });

    const sortedWinners = Object.values(skinsWinners).sort((a, b) => b.totalValue - a.totalValue);
    const finalCarryover = round.skinsResult?.[17]?.carriedOver ? round.skinsResult[17].value : 0;

    return (
        <div className="bg-white p-4 rounded-lg shadow-md mb-6">
            <h3 className="text-xl font-bold text-center mb-3">Skins Results</h3>
            <ul className="space-y-2">
                {sortedWinners.map(({ entity, totalValue, skinsCount }, index) => {
                    const name = 'firstName' in entity ? `${entity.firstName} ${entity.lastName}` : entity.name;
                    const profilePictureUrl = 'profilePictureUrl' in entity ? entity.profilePictureUrl : null;
                    const subText = 'firstName' in entity ? `${skinsCount} Skins Won` : `${skinsCount} Skins Won`;

                    return (
                        <li key={entity.id} className={`p-3 rounded-lg flex justify-between items-center ${index === 0 && totalValue > 0 ? 'bg-yellow-100 border border-yellow-300' : 'bg-gray-50'}`}>
                            <div className="flex items-center gap-3">
                                <span className="font-bold w-6 text-center text-lg">{index + 1}</span>
                                {profilePictureUrl ? (
                                    <img src={profilePictureUrl} alt={name} className="w-10 h-10 rounded-full object-cover"/>
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-lg">{name.charAt(0)}</div>
                                )}
                                <div>
                                    <p className="font-bold text-gray-800">{name}</p>
                                    <p className="text-xs text-gray-500">{subText}</p>
                                </div>
                            </div>
                            <p className="text-2xl font-bold text-green-600">${totalValue}</p>
                        </li>
                    )
                })}
            </ul>
            {finalCarryover > 0 && (
                <div className="mt-4 text-center text-sm text-gray-600 bg-gray-100 p-2 rounded-lg">
                    <p><strong>Note:</strong> ${finalCarryover} from the final holes was not won.</p>
                </div>
            )}
        </div>
    );
};


export const RoundSummary: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { state } = location;
    const initialRound = state?.round as Round;
    
    const { updateRound, currentUser, courses, competitions, users } = useAppContext();
    const [round, setRound] = useState<Round | null>(initialRound);
    const [summary, setSummary] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const [winners, setWinners] = useState<User[]>([]);
    const [showWinnerModal, setShowWinnerModal] = useState(false);
    const [expandedScorecardId, setExpandedScorecardId] = useState<string | null>(null);

    const competition = useMemo(() => competitions.find(c => c.id === round?.competitionId), [competitions, round]);

    useEffect(() => {
        if (!initialRound || !currentUser) {
            navigate('/');
        } else {
             setRound(initialRound);
        }
    }, [initialRound, currentUser, navigate]);
    
    const strokePlayResults = useMemo(() => {
        if (!round || round.gameFormat !== GameFormat.STROKE_PLAY) return [];

        const playerScores = round.players.map(player => {
            const playerCourseId = player.courseId || round.courseId;
            const course = courses.find(c => c.id === playerCourseId);
            if (!course) return null;

            const scores = round.scores[String(player.id)];
            if (!scores || scores.some(s => s.strokes === null) || scores.length !== 18) return null;

            const totalGross = scores.reduce((sum, s) => sum + (s.strokes!), 0);
            
            const courseHandicap = calculateCourseHandicap(player, course);
            let totalHandicapStrokes = 0;
            scores.forEach((_score, index) => {
                const holeHcpIndex = course.handicapIndices[index];
                totalHandicapStrokes += getStrokesForHole(courseHandicap, holeHcpIndex);
            });
            
            const totalNet = totalGross - totalHandicapStrokes;
            const totalPar = scores.reduce((sum, score) => sum + score.par, 0);
            const netToPar = totalNet - totalPar;

            return { player, totalNet, totalGross, netToPar, courseName: course.name };
        }).filter((p): p is { player: User; totalNet: number; totalGross: number; netToPar: number, courseName: string } => p !== null);

        return playerScores.sort((a, b) => a.netToPar - b.netToPar);
    }, [round, courses]);

    useEffect(() => {
        if (strokePlayResults.length > 0) {
            const minNetScore = strokePlayResults[0].netToPar;
            const roundWinners = strokePlayResults
                .filter(ps => ps.netToPar === minNetScore)
                .map(ps => ps.player);
            
            setWinners(roundWinners);
            setShowWinnerModal(true);
        }
    }, [strokePlayResults]);
    
    const handleGenerateSummary = async () => {
        if (!round || !currentUser) return;
        setIsLoading(true);
        const generatedSummary = await getAIRoundSummary(round, currentUser);
        setSummary(generatedSummary);
        setIsLoading(false);
    };

    const postToFeed = () => {
        if (round) {
            const finalRound = { ...round, aiSummary: summary };
            updateRound(finalRound);
            navigate('/');
        }
    };
    
    if (!round || !currentUser || !competition) return null;
    
    const renderSummaryDetails = () => {
        switch (round.gameFormat) {
            case GameFormat.STROKE_PLAY:
                if (strokePlayResults.length === 0) {
                    return (
                        <div className="bg-white p-4 rounded-lg shadow-md mb-6 text-center">
                            <p className="text-gray-600">No complete scores were recorded to determine a winner.</p>
                        </div>
                    );
                }
                return (
                     <div className="bg-white p-4 rounded-lg shadow-md mb-6">
                         <h3 className="text-xl font-bold text-center mb-3">Final Leaderboard</h3>
                         <ul className="space-y-2">
                            {strokePlayResults.map(({ player, totalGross, totalNet, netToPar, courseName }, index) => {
                                const scoreDisplay = netToPar > 0 ? `+${netToPar}` : netToPar === 0 ? 'E' : netToPar;
                                return (
                                    <li key={player.id} className={`p-3 rounded-lg ${index === 0 ? 'bg-yellow-100 border border-yellow-300' : 'bg-gray-50'}`}>
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-3">
                                                <span className={`font-bold w-6 text-center text-lg ${index === 0 ? 'text-yellow-600' : 'text-gray-500'}`}>{index + 1}</span>
                                                <img src={player.profilePictureUrl} alt={player.firstName} className="w-10 h-10 rounded-full object-cover"/>
                                                <div>
                                                    <p className="font-bold text-gray-800">{player.firstName} {player.lastName}</p>
                                                    <p className="text-xs text-gray-500">Gross: {totalGross} | Net: {totalNet}</p>
                                                     {competition.courses.length > 1 && <p className="text-xs text-gray-500">{courseName}</p>}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-2xl font-bold text-gray-800">{scoreDisplay}</p>
                                                <p className="text-sm text-gray-500 -mt-1">vs Par</p>
                                            </div>
                                        </div>
                                         <div className="mt-2 text-center">
                                            <button 
                                                onClick={() => setExpandedScorecardId(expandedScorecardId === String(player.id) ? null : String(player.id))}
                                                className="text-xs text-blue-600 font-semibold hover:underline"
                                            >
                                                {expandedScorecardId === String(player.id) ? 'Hide Scorecard' : 'View Scorecard'}
                                            </button>
                                        </div>
                                        {expandedScorecardId === String(player.id) && (
                                            <div className="mt-2">
                                                <Scorecard scores={round.scores[String(player.id)]} isEditable={false} />
                                            </div>
                                        )}
                                    </li>
                                )
                            })}
                         </ul>
                     </div>
                );
            case GameFormat.MATCH_PLAY:
                return (
                     <div className="bg-white p-4 rounded-lg shadow-md mb-6 text-center">
                        <p className="text-sm text-gray-500">Match Result</p>
                        <p className="text-4xl font-bold text-gray-800 my-2">{getFinalMatchScoreText(round)}</p>
                    </div>
                );
            case GameFormat.SCRAMBLE:
            case GameFormat.BEST_BALL:
            case GameFormat.SHAMBLE:
                 return (
                     <div className="bg-white p-4 rounded-lg shadow-md mb-6">
                         <h3 className="text-xl font-bold text-center mb-3">Team Leaderboard</h3>
                         <ul className="space-y-2">
                            {round.teams?.sort((a, b) => {
                                const scoreA = round.scores[a.id]?.reduce((sum, s) => sum + (s.strokes || 99), 0) || 999;
                                const scoreB = round.scores[b.id]?.reduce((sum, s) => sum + (s.strokes || 99), 0) || 999;
                                return scoreA - scoreB;
                            }).map(team => {
                                const teamScores = round.scores[team.id];
                                if (!teamScores) return null;
                                const totalScore = teamScores.reduce((sum, score) => sum + (score.strokes || 0), 0);
                                const totalPar = teamScores.reduce((sum, score) => sum + score.par, 0);
                                const scoreToPar = totalScore - totalPar;
                                
                                const course = courses.find(c => c.id === round.courseId)!;
                                const teamPlayers = team.playerIds.map(pId => users.find(u => u.id === pId)).filter(u => u) as User[];
                                
                                let netScoreDisplay;
                                if(round.gameFormat === GameFormat.SCRAMBLE && teamPlayers.length > 0) {
                                     const playerCourseHandicaps = teamPlayers.map(p => calculateCourseHandicap(p, course));
                                     const teamCourseHandicap = Math.round(playerCourseHandicaps.reduce((a, b) => a + b, 0) / playerCourseHandicaps.length);
                                     let totalTeamStrokes = 0;
                                     course.handicapIndices.forEach(hcpIndex => {
                                         totalTeamStrokes += getStrokesForHole(teamCourseHandicap, hcpIndex);
                                     });
                                     const netScore = totalScore - totalTeamStrokes;
                                     netScoreDisplay = <p className="text-xs">Net: {netScore}</p>;
                                }

                                return (
                                    <li key={team.id} className="bg-gray-50 p-3 rounded-lg border">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="font-bold text-gray-800">{team.name}</p>
                                                <p className="text-xs text-gray-500">{team.playerIds.map(pId => users.find(p=>p.id===pId)?.firstName).join(', ')}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-2xl font-bold">{totalScore}</p>
                                                <p className="text-sm">{scoreToPar >= 0 ? `+${scoreToPar}` : scoreToPar} to Par</p>
                                                {netScoreDisplay}
                                            </div>
                                        </div>
                                        <div className="mt-2 text-center">
                                            <button 
                                                onClick={() => setExpandedScorecardId(expandedScorecardId === team.id ? null : team.id)}
                                                className="text-xs text-blue-600 font-semibold hover:underline"
                                            >
                                                {expandedScorecardId === team.id ? 'Hide Scorecard' : 'View Scorecard'}
                                            </button>
                                        </div>
                                        {expandedScorecardId === team.id && (
                                            <div className="mt-2">
                                                <Scorecard scores={teamScores} isEditable={false} />
                                            </div>
                                        )}
                                    </li>
                                )
                            })}
                         </ul>
                     </div>
                 );
            default:
                const userScores = round.scores[String(currentUser.id)];
                if (!userScores) return null;
                const totalScore = userScores.reduce((sum, score) => sum + (score.strokes || 0), 0);
                const totalPar = userScores.reduce((sum, score) => sum + score.par, 0);
                const scoreToPar = totalScore - totalPar;
                return (
                    <div className="bg-white p-4 rounded-lg shadow-md mb-6 text-center">
                        <p className="text-sm text-gray-500">Your Score</p>
                        <p className="text-6xl font-bold text-gray-800 my-2">{totalScore}</p>
                        <p className="text-xl font-semibold text-gray-600">{scoreToPar >= 0 ? `+${scoreToPar}` : scoreToPar} to Par</p>
                    </div>
                );
        }
    }
    
    return (
        <Layout>
            {showWinnerModal && <WinnerModal winners={winners} onClose={() => setShowWinnerModal(false)} />}
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Round Complete!</h1>
            <p className="text-lg text-gray-600 mb-4">Well played at {round.courseName}.</p>
            
            {renderSummaryDetails()}
            
            {round.skinValue && <SkinsResults round={round} />}

            <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-700 mb-2">Create Feed Post</h2>
                <div className="w-full bg-gray-100 rounded-lg p-4">
                    <button onClick={handleGenerateSummary} disabled={isLoading} className="w-full bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg mb-4 disabled:bg-indigo-300">
                        {isLoading ? 'Generating...' : '✨ Generate AI Round Summary'}
                    </button>
                    <textarea 
                        value={summary}
                        onChange={(e) => setSummary(e.target.value)}
                        placeholder="Your round summary will appear here. Feel free to edit it!"
                        className="w-full h-40 p-2 border border-gray-300 rounded-lg text-sm"
                    />
                </div>
            </div>
            
            <button onClick={postToFeed} className="w-full bg-blue-600 text-white font-bold text-lg py-4 rounded-lg shadow-lg hover:bg-blue-700">
                Post to Feed
            </button>
        </Layout>
    );
};
