

import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useParams, Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Scorecard } from '../components/Scorecard';
import { Course, HoleScore, User, Round, GameFormat, Team, SkinResult } from '../types';
import { useAppContext } from '../context/AppContext';
import { CameraIcon } from '../components/icons/CameraIcon';
import { PhotoIcon } from '../components/icons/PhotoIcon';
import { calculateCourseHandicap, getStrokesForHole } from '../services/handicap';

// Icons
const ChevronLeftIcon: React.FC<{className?: string}> = ({className}) => ( <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>);
const ChevronRightIcon: React.FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>);

const getInitialActiveId = (round: Round, currentUser?: User | null): string | number => {
    const teamModes = [GameFormat.SCRAMBLE, GameFormat.MATCH_PLAY, GameFormat.BEST_BALL, GameFormat.SHAMBLE];
    const isTeamMode = teamModes.includes(round.gameFormat);

    if (isTeamMode && round.teams && round.teams.length > 0) {
        // Find the current user's team first
        const userTeam = round.teams.find(t => t.playerIds.includes(currentUser?.id || -1));
        if (userTeam) return userTeam.id;
        return round.teams[0].id;
    }

    if (currentUser) {
        return currentUser.id;
    }
    
    if (round.players && round.players.length > 0) {
        return round.players[0].id;
    }
    return 0;
};

const recalculateSkins = (round: Round, courses: Course[]): SkinResult[] => {
    if (!round.skinValue) {
        return round.skinsResult || [];
    }

    const isNetScoring = round.skinsScoringType === 'net';
    const primaryCourse = courses.find(c => c.id === round.courseId);
    if (!primaryCourse) {
        return round.skinsResult || [];
    }

    const getIndividualNetScore = (playerId: number, grossScore: number, holeIndex: number): number => {
        const player = round.players.find(u => u.id === playerId);
        const playerCourse = courses.find(c => c.id === (player?.courseId || round.courseId));
        if (!player || !playerCourse) return grossScore;
        const courseHandicap = calculateCourseHandicap(player, playerCourse);
        const strokes = getStrokesForHole(courseHandicap, playerCourse.handicapIndices[holeIndex]);
        return grossScore - strokes;
    };

    const teamGameFormats = [GameFormat.SCRAMBLE, GameFormat.BEST_BALL, GameFormat.SHAMBLE];
    const isTeamGame = teamGameFormats.includes(round.gameFormat) && round.teams && round.teams.length > 0;
    
    const participantIds = isTeamGame 
        ? round.teams!.map(t => t.id)
        : round.players.map(p => String(p.id));

    const newSkinsResult: SkinResult[] = [];
    let carryOverValue = 0;
    const currentHoleBaseValue = round.skinValue || 0;

    for (let i = 0; i < 18; i++) { // For each hole
        const scoresByCourse: { [courseId: string]: { id: string, score: number }[] } = {};
        const participantsByCourse: { [courseId: string]: string[] } = {};
        let totalScoresPosted = 0;

        for (const id of participantIds) {
            let score: number | null = null;
            if (isTeamGame) {
                const team = round.teams!.find(t => t.id === id)!;
                if (round.gameFormat === GameFormat.SCRAMBLE) {
                    const grossScore = round.scores[id]?.[i]?.strokes;
                    if (grossScore !== null && grossScore !== undefined) {
                        if (isNetScoring) {
                             const teamPlayers = team.playerIds.map(pId => round.players.find(u => u.id === pId)).filter(p => p) as User[];
                             const playerCourseHandicaps = teamPlayers.map(p => {
                                 const pCourse = courses.find(c => c.id === (p.courseId || round.courseId)) || primaryCourse;
                                 return calculateCourseHandicap(p, pCourse);
                             });
                             const teamHcp = Math.round(playerCourseHandicaps.reduce((sum, hcp) => sum + hcp, 0) / playerCourseHandicaps.length);
                            const strokes = getStrokesForHole(teamHcp, primaryCourse.handicapIndices[i]);
                            score = grossScore - strokes;
                        } else {
                            score = grossScore;
                        }
                    }
                } else if ([GameFormat.BEST_BALL, GameFormat.SHAMBLE].includes(round.gameFormat)) {
                    const playerScores = team.playerIds.map(pId => {
                        const gross = round.scores[String(pId)]?.[i]?.strokes;
                        if (gross === null || gross === undefined) return null;
                        return isNetScoring ? getIndividualNetScore(pId, gross, i) : gross;
                    }).filter((s): s is number => s !== null);

                    if (playerScores.length > 0) {
                        score = Math.min(...playerScores);
                    }
                }
            } else { // Individual game
                const grossScore = round.scores[id]?.[i]?.strokes;
                if (grossScore !== null && grossScore !== undefined) {
                    score = isNetScoring ? getIndividualNetScore(Number(id), grossScore, i) : grossScore;
                }
            }
            
            const playerOrTeam = isTeamGame ? round.teams!.find(t => t.id === id) : round.players.find(p => String(p.id) === id);
            if (!playerOrTeam) continue;

            let courseId;
            if (isTeamGame) {
                const team = playerOrTeam as Team;
                const firstPlayer = round.players.find(p => p.id === team.playerIds[0]);
                courseId = firstPlayer?.courseId || round.courseId;
            } else {
                const player = playerOrTeam as (User & {courseId?: number});
                courseId = player.courseId || round.courseId;
            }
            
            const courseIdStr = String(courseId);
            if (!participantsByCourse[courseIdStr]) participantsByCourse[courseIdStr] = [];
            participantsByCourse[courseIdStr].push(id);
            
            if (score !== null) {
                if (!scoresByCourse[courseIdStr]) scoresByCourse[courseIdStr] = [];
                scoresByCourse[courseIdStr].push({ id, score });
                totalScoresPosted++;
            }
        }
        
        const currentPot = currentHoleBaseValue + carryOverValue;

        if (totalScoresPosted < participantIds.length) {
            newSkinsResult.push({ holeIndex: i, winnerId: null, value: currentPot, carriedOver: false });
            for (let j = i + 1; j < 18; j++) {
                newSkinsResult.push({ holeIndex: j, winnerId: null, value: currentHoleBaseValue, carriedOver: false });
            }
            return newSkinsResult;
        }

        const holeWinners: string[] = [];
        let anyGroupTied = false;

        for (const courseIdStr in participantsByCourse) {
            const groupScores = scoresByCourse[courseIdStr] || [];
            const groupParticipants = participantsByCourse[courseIdStr];

            if (groupScores.length < groupParticipants.length) {
                anyGroupTied = true;
                break;
            }
            
            const minScore = Math.min(...groupScores.map(s => s.score));
            const winnersInGroup = groupScores.filter(s => s.score === minScore);

            if (winnersInGroup.length === 1) {
                holeWinners.push(winnersInGroup[0].id);
            } else {
                anyGroupTied = true;
            }
        }

        if (holeWinners.length === 1 && !anyGroupTied) {
            newSkinsResult.push({ holeIndex: i, winnerId: holeWinners[0], value: currentPot, carriedOver: false });
            carryOverValue = 0;
        } else {
            newSkinsResult.push({ holeIndex: i, winnerId: null, value: currentPot, carriedOver: true });
            carryOverValue = currentPot;
        }
    }
    return newSkinsResult;
};


export const InRound: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { roundId } = useParams<{ roundId: string }>();
    const { rounds, updateRound, courses, currentUser, addCompetitionFeedItem, setActiveRoundId } = useAppContext();
    
    const [round, setRound] = useState<Round | null>(() => {
        const fromState = location.state?.round as Round;
        if(fromState) return JSON.parse(JSON.stringify(fromState));
        const fromContext = rounds.find(r => r.id === roundId);
        return fromContext ? JSON.parse(JSON.stringify(fromContext)) : null;
    });
    
    const [activePlayerId, setActivePlayerId] = useState<string | number>(0);
    const [currentHoleIndex, setCurrentHoleIndex] = useState(0);
    
    const videoInputRef = useRef<HTMLInputElement>(null);
    const photoInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!round) {
            alert("Round data not found. Returning to home.");
            navigate('/');
            return;
        }
        setActivePlayerId(getInitialActiveId(round, currentUser));
    }, [round, navigate, currentUser]);
    
    const handleRecordVideoClick = () => {
        if (!currentUser) {
            console.error("Current user not found. Cannot record video.");
            return;
        }
        videoInputRef.current?.click();
    };

    const handlePostPhotoClick = () => {
        if (!currentUser) {
            console.error("Current user not found. Cannot post photo.");
            return;
        }
        photoInputRef.current?.click();
    };

    const handlePhotoPosted = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !currentUser) return;

        const photoUrl = URL.createObjectURL(file);
        const postingPlayerId = String(currentUser.id);

        setRound(prevRound => {
            if (!prevRound) return null;
            
            const newRound = JSON.parse(JSON.stringify(prevRound));
            
            let targetIdForScore = postingPlayerId;
            // For team games like Scramble, media is associated with the team scorecard
            if (newRound.gameFormat === GameFormat.SCRAMBLE) {
                const team = newRound.teams?.find(t => t.playerIds.includes(currentUser.id));
                if (team) targetIdForScore = team.id;
            }

            const scoreArray = newRound.scores[targetIdForScore];
            if (!scoreArray) {
                console.error(`Score sheet for ID ${targetIdForScore} not found. Cannot save photo.`);
                return prevRound;
            }

            const oldHoleScore = scoreArray[currentHoleIndex];
            const playerCourse = courses.find(c => c.id === prevRound.players.find(p => p.id === currentUser.id)?.courseId || prevRound.courseId);
            const newHoleScore: HoleScore = { 
                ...(oldHoleScore || { hole: currentHoleIndex + 1, par: playerCourse!.pars[currentHoleIndex], strokes: null }),
                photoUrl: photoUrl 
            };
            scoreArray[currentHoleIndex] = newHoleScore;
            
            updateRound(newRound); 

            if (newRound.competitionId) {
                addCompetitionFeedItem(newRound.competitionId, {
                    userId: currentUser.id,
                    userName: `${currentUser.firstName} ${currentUser.lastName}`,
                    userProfilePictureUrl: currentUser.profilePictureUrl,
                    type: 'photo',
                    photoUrl: photoUrl,
                    hole: currentHoleIndex + 1,
                });
            }
            
            return newRound;
        });
        e.target.value = '';
    };

    const handleVideoRecorded = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !currentUser) return;

        const videoUrl = URL.createObjectURL(file);
        const recordingPlayerId = String(currentUser.id);

        setRound(prevRound => {
            if (!prevRound) return null;
            
            const newRound = JSON.parse(JSON.stringify(prevRound));
            
            let targetIdForScore = recordingPlayerId;
            if (newRound.gameFormat === GameFormat.SCRAMBLE) {
                const team = newRound.teams?.find(t => t.playerIds.includes(currentUser.id));
                if (team) targetIdForScore = team.id;
            }

            const scoreArray = newRound.scores[targetIdForScore];
            if (!scoreArray) {
                 console.error(`Score sheet for ID ${targetIdForScore} not found. Cannot save video.`);
                return prevRound;
            }

            const oldHoleScore = scoreArray[currentHoleIndex];
            const playerCourse = courses.find(c => c.id === prevRound.players.find(p => p.id === currentUser.id)?.courseId || prevRound.courseId);
            const newHoleScore: HoleScore = { 
                ...(oldHoleScore || { hole: currentHoleIndex + 1, par: playerCourse!.pars[currentHoleIndex], strokes: null }),
                videoUrl: videoUrl 
            };
            scoreArray[currentHoleIndex] = newHoleScore;
            
            updateRound(newRound); 

            if (newRound.competitionId) {
                addCompetitionFeedItem(newRound.competitionId, {
                    userId: currentUser.id,
                    userName: `${currentUser.firstName} ${currentUser.lastName}`,
                    userProfilePictureUrl: currentUser.profilePictureUrl,
                    type: 'video',
                    videoUrl: videoUrl,
                    hole: currentHoleIndex + 1,
                });
            }
            
            return newRound;
        });
        e.target.value = '';
    };

    const handleScoreChange = (id: string, holeIndex: number, newStrokes: number | null) => {
        setRound(prevRound => {
            if (!prevRound) return prevRound;
    
            const newRound = { ...prevRound, scores: { ...prevRound.scores } };
            const newScores = newRound.scores;
    
            const scoreArray = [...newScores[id]];
            const oldHoleScore = scoreArray[holeIndex];
            const newHoleScore: HoleScore = { ...oldHoleScore, strokes: newStrokes };

            const player = prevRound.players.find(p => String(p.id) === id);
            
            if (player) {
                 const playerCourseId = player.courseId || prevRound.courseId;
                 const playerCourse = courses.find(c => c.id === playerCourseId);

                if (playerCourse && prevRound.gameFormat === GameFormat.STROKE_PLAY) {
                    if (newStrokes !== null) {
                        const courseHandicap = calculateCourseHandicap(player, playerCourse);
                        const strokesForHole = getStrokesForHole(courseHandicap, playerCourse.handicapIndices[holeIndex]);
                        newHoleScore.netStrokes = newStrokes - strokesForHole;
                    } else {
                        newHoleScore.netStrokes = undefined;
                    }
                }
            }
    
            scoreArray[holeIndex] = newHoleScore;
            newScores[id] = scoreArray;
    
            if (prevRound.gameFormat === GameFormat.BEST_BALL || prevRound.gameFormat === GameFormat.SHAMBLE) {
                prevRound.teams?.forEach(team => {
                    if (team.playerIds.map(String).includes(id)) {
                        const playerNetScores = team.playerIds.map(pId => {
                            const teamPlayer = prevRound.players.find(p => p.id === pId);
                            const grossScore = newScores[String(pId)][holeIndex].strokes;
                             if (!teamPlayer || grossScore === null || grossScore === undefined) return { pId, grossScore, netScore: null };

                             const playerCourse = courses.find(c => c.id === (teamPlayer.courseId || prevRound.courseId))!;
                             const courseHandicap = calculateCourseHandicap(teamPlayer, playerCourse);
                             const strokes = getStrokesForHole(courseHandicap, playerCourse.handicapIndices[holeIndex]);
                             const netScore = grossScore - strokes;
                             return { pId, grossScore, netScore };
                        }).filter(s => s.netScore !== null);
                        
                        let bestScoreForTeam: number | null = null;
                        if (playerNetScores.length > 0) {
                            const bestNetScore = Math.min(...playerNetScores.map(s => s.netScore!));
                            bestScoreForTeam = playerNetScores.find(s => s.netScore === bestNetScore)!.grossScore;
                        }

                        const newTeamScores = [...newScores[team.id]];
                        newTeamScores[holeIndex] = { ...newTeamScores[holeIndex], strokes: bestScoreForTeam };
                        newScores[team.id] = newTeamScores;
                    }
                });
            }
    
            if (prevRound.gameFormat === GameFormat.MATCH_PLAY && prevRound.teams?.length === 2) {
                const [teamA, teamB] = prevRound.teams;
                const playerA = prevRound.players.find(p => p.id === teamA.playerIds[0]);
                const playerB = prevRound.players.find(p => p.id === teamB.playerIds[0]);
                
                if (playerA && playerB) {
                    const scoreA = newScores[String(playerA.id)][holeIndex].strokes;
                    const scoreB = newScores[String(playerB.id)][holeIndex].strokes;
                    
                    const courseA = courses.find(c => c.id === (playerA.courseId || prevRound.courseId));
                    const courseB = courses.find(c => c.id === (playerB.courseId || prevRound.courseId));

                    if (scoreA !== null && scoreB !== null && courseA && courseB) {
                        const courseHandicapA = calculateCourseHandicap(playerA, courseA);
                        const courseHandicapB = calculateCourseHandicap(playerB, courseB);
                        const holeHcpA = courseA.handicapIndices[holeIndex];
                        const holeHcpB = courseB.handicapIndices[holeIndex];
                        const netA = scoreA - getStrokesForHole(courseHandicapA, holeHcpA);
                        const netB = scoreB - getStrokesForHole(courseHandicapB, holeHcpB);
    
                        let winner = 'TIE';
                        if (netA < netB) winner = teamA.id;
                        if (netB < netA) winner = teamB.id;
    
                        newRound.matchResult = { ...prevRound.matchResult, [holeIndex]: winner };
                    }
                }
            }
            
            if (newRound.skinValue) {
                const newSkinsResult = recalculateSkins(newRound, courses);
                newRound.skinsResult = newSkinsResult;
            }

            updateRound(newRound);
            return newRound;
        });
    };
    
    const finishRound = () => {
        if (round) {
            updateRound(round); // Final update before leaving page
            setActiveRoundId(null);
            navigate(`/summary/${round.id}`, { state: { round } });
        }
    };
    
    const primaryCourse = courses.find(c => c.id === round?.courseId);

    if (!round || !primaryCourse) {
        return <Layout><p className="text-center">Loading round...</p></Layout>;
    }
    
    const getMatchStatus = () => {
        if (!round.matchResult || !round.teams || round.teams.length !== 2) return { text: "Match Play", score: ""};
        const [teamA, teamB] = round.teams;
        const winsA = Object.values(round.matchResult).filter(w => w === teamA.id).length;
        const winsB = Object.values(round.matchResult).filter(w => w === teamB.id).length;
        const holesPlayed = Object.keys(round.matchResult).length;
        const toPlay = 18 - holesPlayed;

        if (Math.abs(winsA - winsB) > toPlay && holesPlayed > 0) {
            const winner = winsA > winsB ? teamA.name : teamB.name;
            const margin = Math.abs(winsA - winsB);
            const remaining = toPlay;
            return { text: "Final", score: `${winner} ${margin}&${remaining}` };
        }

        if (winsA > winsB) return { text: `${teamA.name} leads`, score: `${winsA - winsB} UP`};
        if (winsB > winsA) return { text: `${teamB.name} leads`, score: `${winsB - winsA} UP`};
        if (holesPlayed === 18 && winsA === winsB) return { text: "Match Tied", score: "18"};
        return { text: "All Square", score: "AS"};
    }
    
    const getRelativeMatchStatus = (myTeamId: string, opponentId: string, matchResult: { [holeIndex: number]: string } = {}) => {
        const myWins = Object.values(matchResult).filter(w => w === myTeamId).length;
        const opponentWins = Object.values(matchResult).filter(w => w === opponentId).length;
        const diff = myWins - opponentWins;
        if (diff > 0) return `${diff} UP`;
        if (diff < 0) return `${-diff} DOWN`;
        return 'AS';
    };
    
    const renderScoringInterface = () => {
        switch (round.gameFormat) {
            case GameFormat.SCRAMBLE:
                const isMyTeamScoring = round.teams?.some(team => team.playerIds.includes(currentUser?.id || -1));
                return (
                    <div className="space-y-3">
                        {round.teams?.map(team => (
                             <div key={team.id} className="flex items-center justify-between bg-gray-100 p-2 rounded-lg">
                                <label htmlFor={`score-${team.id}`} className="font-semibold text-gray-700">{team.name}</label>
                                <div className="flex items-center gap-2">
                                    <input id={`score-${team.id}`} type="number" min="1" value={round.scores[team.id]?.[currentHoleIndex]?.strokes || ''}
                                        onChange={(e) => handleScoreChange(team.id, currentHoleIndex, e.target.value ? parseInt(e.target.value) : null)}
                                        readOnly={!isMyTeamScoring}
                                        className={`w-20 h-10 text-center text-xl font-bold border border-gray-300 rounded-lg ${!isMyTeamScoring ? 'bg-gray-200 cursor-not-allowed' : ''}`} />
                                </div>
                            </div>
                        ))}
                    </div>
                )
            case GameFormat.BEST_BALL:
            case GameFormat.SHAMBLE:
            case GameFormat.MATCH_PLAY:
                 return (
                    <div className="space-y-4">
                        {round.teams?.map(team => {
                            const opponentTeam = round.teams!.find(t => t.id !== team.id);
                            const status = opponentTeam && round.gameFormat === GameFormat.MATCH_PLAY ? getRelativeMatchStatus(team.id, opponentTeam.id, round.matchResult) : '';
                            return (
                             <div key={team.id} className="bg-gray-100 p-3 rounded-lg">
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="font-bold">{team.name}</h3>
                                    {status && <span className={`text-xs font-bold px-2 py-1 rounded-full ${status === 'AS' ? 'bg-gray-300' : status.includes('UP') ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>{status}</span>}
                                </div>
                                <div className="space-y-2">
                                {team.playerIds.map(pId => {
                                    const player = round.players.find(p => p.id === pId);
                                    if (!player) return null;
                                    const isEditable = player.id === currentUser?.id;
                                    return (
                                        <div key={pId} className="flex items-center justify-between">
                                            <label htmlFor={`score-${pId}`} className="font-semibold text-gray-700">{player.firstName}</label>
                                            <div className="flex items-center gap-2">
                                                <input id={`score-${pId}`} type="number" min="1" value={round.scores[String(pId)]?.[currentHoleIndex]?.strokes || ''}
                                                    onChange={(e) => handleScoreChange(String(pId), currentHoleIndex, e.target.value ? parseInt(e.target.value) : null)}
                                                    readOnly={!isEditable}
                                                    className={`w-20 h-10 text-center text-xl font-bold border border-gray-300 rounded-lg ${!isEditable ? 'bg-gray-200 cursor-not-allowed' : ''}`}
                                                />
                                            </div>
                                        </div>
                                    )
                                })}
                                </div>
                            </div>
                        )})}
                    </div>
                )
            default: // Stroke Play or other individual formats
                 return (
                    <div className="space-y-3">
                        {round.players.map(player => {
                             const playerCourse = courses.find(c => c.id === player.courseId || round.courseId);
                             if (!playerCourse) return null;
                             const courseHandicap = calculateCourseHandicap(player, playerCourse);
                             const strokesForHole = getStrokesForHole(courseHandicap, playerCourse.handicapIndices[currentHoleIndex]);
                             const grossScore = round.scores[String(player.id)]?.[currentHoleIndex]?.strokes;
                             const netScore = grossScore !== null && grossScore !== undefined ? grossScore - strokesForHole : null;
                             const isEditable = player.id === currentUser?.id;
                            return (
                                <div key={player.id} className="flex items-center justify-between bg-gray-100 p-2 rounded-lg">
                                    <label htmlFor={`score-${player.id}`} className="font-semibold text-gray-700">{player.firstName}</label>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-gray-500 w-12 text-center">Net: {netScore ?? '-'}</span>
                                        <input
                                            id={`score-${player.id}`}
                                            type="number"
                                            min="1"
                                            value={grossScore || ''}
                                            onChange={(e) => handleScoreChange(String(player.id), currentHoleIndex, e.target.value ? parseInt(e.target.value) : null)}
                                            readOnly={!isEditable}
                                            className={`w-20 h-10 text-center text-xl font-bold border border-gray-300 rounded-lg ${!isEditable ? 'bg-gray-200 cursor-not-allowed' : ''}`}
                                        />
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )
        }
    }
    
    const teamModesForTabs = [GameFormat.SCRAMBLE, GameFormat.MATCH_PLAY, GameFormat.BEST_BALL, GameFormat.SHAMBLE];
    const isTeamModeForTabs = teamModesForTabs.includes(round.gameFormat) && round.teams && round.teams.length > 0;
    const tabItems = isTeamModeForTabs ? round.teams! : round.players;

    const currentHoleDataCourse = courses.find(c => c.id === round.courseId) || primaryCourse;
        
    const currentHolePar = currentHoleDataCourse.pars[currentHoleIndex];
    
    const getSkinsStatus = () => {
        const currentSkinInfo = round.skinsResult?.[currentHoleIndex];
        const potValue = currentSkinInfo?.value || round.skinValue || 0;
        
        let statusText = '';
        if (currentHoleIndex > 0) {
            const prevHoleIndex = currentHoleIndex - 1;
            const prevSkinInfo = round.skinsResult?.[prevHoleIndex];
            if (prevSkinInfo) {
                if (prevSkinInfo.carriedOver) {
                    statusText = `Hole ${prevHoleIndex + 1} was a tie. Pot carried over.`;
                } else if (prevSkinInfo.winnerId) {
                    const teamGameFormats = [GameFormat.SCRAMBLE, GameFormat.BEST_BALL, GameFormat.SHAMBLE, GameFormat.MATCH_PLAY];
                    const isTeamGame = teamGameFormats.includes(round.gameFormat) && round.teams && round.teams.length > 0;
                    const winnerEntity = isTeamGame
                        ? round.teams?.find(t => t.id === prevSkinInfo.winnerId)
                        : round.players.find(p => String(p.id) === prevSkinInfo.winnerId);

                    if (winnerEntity) {
                        const winnerName = 'name' in winnerEntity ? winnerEntity.name : winnerEntity.firstName;
                        statusText = `Hole ${prevHoleIndex + 1} won by ${winnerName} for $${prevSkinInfo.value}.`;
                    }
                }
            }
        }
        return { potValue, statusText };
    };

    const skinsStatus = round.skinValue ? getSkinsStatus() : null;

    return (
        <div className="bg-gray-50 min-h-screen">
            <input type="file" accept="video/*" capture="user" ref={videoInputRef} onChange={handleVideoRecorded} className="hidden" />
            <input type="file" accept="image/*" capture="environment" ref={photoInputRef} onChange={handlePhotoPosted} className="hidden" />
            
            <div className="fixed top-0 left-0 right-0 max-w-md mx-auto bg-white/80 backdrop-blur-sm shadow-sm z-40 p-2">
                <div className="flex justify-between items-center px-2">
                    <Link to="/" className="bg-gray-200 text-gray-700 font-semibold text-sm py-1 px-3 rounded-md hover:bg-gray-300">
                        &larr; Feed
                    </Link>
                    <p className="text-gray-800 font-bold truncate">{primaryCourse.name}</p>
                    {round.competitionId ? (
                        <Link to={`/competitions/${round.competitionId}/leaderboard`} className="text-sm bg-blue-100 text-blue-700 font-semibold py-1 px-3 rounded-md hover:bg-blue-200">
                            Board
                        </Link>
                    ) : <div className="w-12"></div>}
                </div>
            </div>

            <div className="max-w-md mx-auto pb-28 pt-14">
                <div className="p-4">
                    <div className="flex justify-between items-center">
                        <p className="text-md text-gray-500 font-semibold">{round.gameFormat}</p>
                    </div>
                    {round.gameFormat === GameFormat.MATCH_PLAY && (
                        <div className="my-2 bg-blue-600 text-white text-center p-2 rounded-lg shadow">
                            <p className="font-bold text-lg">{getMatchStatus().text} <span className="font-black">{getMatchStatus().score}</span></p>
                        </div>
                    )}
                    {skinsStatus && (
                        <div className="my-2 bg-yellow-500 text-white text-center p-2 rounded-lg shadow">
                            <p className="font-bold text-lg">Hole {currentHoleIndex + 1} Pot: ${skinsStatus.potValue}</p>
                            {skinsStatus.statusText && <p className="text-xs">{skinsStatus.statusText}</p>}
                        </div>
                    )}
                     <div className="flex border-b border-gray-300 mt-2 mb-2 overflow-x-auto">
                        {tabItems.map(item => (
                            <button key={item.id} onClick={() => setActivePlayerId(item.id)}
                                className={`flex-shrink-0 py-2 px-4 text-sm font-semibold ${activePlayerId === item.id ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>
                                {'name' in item ? item.name : `${item.firstName}`}
                            </button>
                        ))}
                    </div>
                    {activePlayerId && round.scores[activePlayerId] ? (
                        <Scorecard scores={round.scores[activePlayerId]} isEditable={false} />
                    ) : (
                         <div className="p-4 text-center text-gray-500 bg-gray-100 rounded-lg">
                             Select a player or team above to view their scorecard.
                         </div>
                    )}
                </div>

                <div className="p-4 bg-white shadow-t-xl">
                     <h2 className="text-xl font-bold text-center text-gray-800 mb-4">
                        Hole {currentHoleIndex + 1}
                        <span className="text-lg font-normal text-gray-500 ml-2">(Par {currentHolePar})</span>
                    </h2>
                    
                    {renderScoringInterface()}

                    <div className="mt-6 flex justify-center gap-4">
                        <button 
                            onClick={handleRecordVideoClick} 
                            className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white font-bold py-2 px-6 rounded-lg shadow-md hover:bg-blue-700 transition-colors"
                        >
                            <CameraIcon className="w-5 h-5"/>
                            <span>Record Video</span>
                        </button>
                         <button 
                            onClick={handlePostPhotoClick} 
                            className="inline-flex items-center justify-center gap-2 bg-purple-600 text-white font-bold py-2 px-6 rounded-lg shadow-md hover:bg-purple-700 transition-colors"
                        >
                            <PhotoIcon className="w-5 h-5"/>
                            <span>Post Photo</span>
                        </button>
                    </div>

                </div>
            </div>

            <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t p-4 flex items-center justify-between">
                <button onClick={() => setCurrentHoleIndex(i => i - 1)} disabled={currentHoleIndex === 0} className="flex items-center gap-1 font-semibold text-gray-600 disabled:opacity-40"><ChevronLeftIcon className="h-6 w-6" /><span>Prev</span></button>
                <button onClick={finishRound} className="bg-red-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:bg-red-700">Finish Round</button>
                <button onClick={() => setCurrentHoleIndex(i => i + 1)} disabled={currentHoleIndex === 17} className="flex items-center gap-1 font-semibold text-gray-600 disabled:opacity-40"><span>Next</span><ChevronRightIcon className="h-6 w-6" /></button>
            </div>
        </div>
    );
};