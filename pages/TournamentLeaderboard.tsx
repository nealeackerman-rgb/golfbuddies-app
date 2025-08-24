


import React, { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { useAppContext } from '../context/AppContext';
import { GameFormat, Team, User } from '../types';
import { calculateCourseHandicap, getStrokesForHole } from '../services/handicap';

export const CompetitionLeaderboard: React.FC = () => {
    const { competitionId } = useParams<{ competitionId: string }>();
    const { competitions, rounds, users, courses } = useAppContext();

    const competition = useMemo(() => competitions.find(t => t.id === competitionId), [competitions, competitionId]);

    const leaderboardData = useMemo(() => {
        if (!competition) return [];

        const competitionRounds = rounds.filter(r => r.competitionId === competition.id);

        if (competition.gameFormat === GameFormat.STROKE_PLAY) {
            const playerStats: { [key: number]: { player: User, totalNetToPar: number, roundsPlayed: number } } = {};

            competition.participantIds.forEach(pId => {
                const player = users.find(u => u.id === pId);
                if(player) {
                   playerStats[pId] = { player, totalNetToPar: 0, roundsPlayed: 0 };
                }
            })

            competitionRounds.forEach(round => {
                round.players.forEach(player => {
                    const course = courses.find(c => c.id === (player.courseId || round.courseId));
                    if (!course || !playerStats[player.id]) return;
                    
                    const scores = round.scores[String(player.id)];
                    if (!scores || scores.some(s => s.strokes === null) || scores.length < 18) return;

                    const totalGross = scores.reduce((sum, s) => sum + (s.strokes || 0), 0);
                    const courseHandicap = calculateCourseHandicap(player, course);
                    let totalHandicapStrokes = 0;
                    scores.forEach((_score, index) => {
                        const holeHcpIndex = course.handicapIndices[index];
                        totalHandicapStrokes += getStrokesForHole(courseHandicap, holeHcpIndex);
                    });
                    const totalPar = course.pars.reduce((sum, p) => sum + p, 0);
                    const roundNetToPar = totalGross - totalHandicapStrokes - totalPar;
                    
                    playerStats[player.id].totalNetToPar += roundNetToPar;
                    playerStats[player.id].roundsPlayed += 1;
                });
            });

            return Object.values(playerStats).sort((a, b) => a.totalNetToPar - b.totalNetToPar);
        } else { // Team modes
            const teamStats: { [key: string]: { team: Team, totalScoreToPar: number, roundsPlayed: number } } = {};
            
            const competitionTeams = competition.teams || [];
            competitionTeams.forEach(team => {
                teamStats[team.id] = { team, totalScoreToPar: 0, roundsPlayed: 0 };
            });

            competitionRounds.forEach(round => {
                 const course = courses.find(c => c.id === round.courseId);
                 if (!course) return;

                (round.teams || []).forEach(roundTeam => {
                    const masterTeam = competitionTeams.find(t => t.id === roundTeam.id);
                    if (!masterTeam || !teamStats[masterTeam.id]) return;

                    const scores = round.scores[masterTeam.id];
                     if (!scores || scores.some(s => s.strokes === null) || scores.length < 18) return;

                    const roundTotalScore = scores.reduce((sum, s) => sum + (s.strokes || 0), 0);
                    const roundTotalPar = scores.reduce((sum, s) => sum + s.par, 0);

                    if (competition.gameFormat === GameFormat.SCRAMBLE) {
                        const teamPlayers = masterTeam.playerIds.map(pId => users.find(u => u.id === pId)).filter(u => u) as User[];
                        if (teamPlayers.length > 0) {
                             const playerCourseHandicaps = teamPlayers.map(p => calculateCourseHandicap(p, course));
                             const teamCourseHandicap = Math.round(playerCourseHandicaps.reduce((a, b) => a + b, 0) / playerCourseHandicaps.length);
                             let totalTeamStrokes = 0;
                             course.handicapIndices.forEach(hcpIndex => totalTeamStrokes += getStrokesForHole(teamCourseHandicap, hcpIndex));
                             const netScore = roundTotalScore - totalTeamStrokes;
                             teamStats[masterTeam.id].totalScoreToPar += (netScore - roundTotalPar);
                        }
                    } else { // Best Ball / Shamble - score is already correct gross, just measure against par
                        teamStats[masterTeam.id].totalScoreToPar += (roundTotalScore - roundTotalPar);
                    }
                    
                    teamStats[masterTeam.id].roundsPlayed += 1;
                });
            });

            return Object.values(teamStats).sort((a, b) => a.totalScoreToPar - b.totalScoreToPar);
        }
    }, [competition, rounds, courses, users]);
    
    if (!competition) {
        return <Layout><p className="text-center">Competition not found.</p></Layout>;
    }
    
    const scoreHeader = competition.gameFormat === GameFormat.STROKE_PLAY || competition.gameFormat === GameFormat.SCRAMBLE ? "Net To Par" : "Score To Par";

    return (
        <Layout>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800">{competition.name}</h1>
                <p className="text-lg text-gray-600 font-semibold">Leaderboard</p>
            </div>

            <div className="bg-white rounded-lg shadow-md border overflow-x-auto">
                <table className="w-full min-w-max text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                        <tr>
                            <th scope="col" className="px-4 py-3 font-bold">Rank</th>
                            <th scope="col" className="px-4 py-3 font-bold">Name</th>
                            <th scope="col" className="px-4 py-3 font-bold text-center">Rounds</th>
                            <th scope="col" className="px-4 py-3 font-bold text-right">{scoreHeader}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {leaderboardData.length > 0 ? leaderboardData.map((entry, index) => {
                            const isPlayerEntry = 'player' in entry;
                            const name = isPlayerEntry ? `${entry.player.firstName} ${entry.player.lastName}` : entry.team.name;
                            const score = 'totalNetToPar' in entry ? entry.totalNetToPar : entry.totalScoreToPar;
                            const scoreDisplay = score > 0 ? `+${score}` : score === 0 ? 'E' : score;
                            
                            return (
                                <tr key={isPlayerEntry ? entry.player.id : entry.team.id} className={`border-b ${index === 0 && entry.roundsPlayed > 0 ? 'bg-yellow-50' : 'bg-white'}`}>
                                    <td className="px-4 py-3 font-bold text-lg text-gray-900">{entry.roundsPlayed > 0 ? index + 1 : '-'}</td>
                                    <td className="px-4 py-3 font-semibold text-gray-900">{name}</td>
                                    <td className="px-4 py-3 text-center">{entry.roundsPlayed}</td>
                                    <td className="px-4 py-3 text-right font-black text-2xl text-gray-900">{entry.roundsPlayed > 0 ? scoreDisplay : 'N/A'}</td>
                                </tr>
                            );
                        }) : (
                            <tr>
                                <td colSpan={4} className="text-center p-6 text-gray-500">
                                    No completed rounds have been posted for this competition yet.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="mt-6">
                 <Link to={`/competitions/${competition.id}`} className="text-blue-600 hover:underline">&larr; Back to Competition Details</Link>
            </div>
        </Layout>
    );
};
