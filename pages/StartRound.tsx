

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { useAppContext } from '../context/AppContext';
import { Course, User, GameFormat, Team, Round, HoleScore, Competition, SkinResult } from '../types';

const createInitialScores = (
  players: User[],
  teams: Team[],
  course: Course,
  gameFormat: GameFormat
): { [key: string]: HoleScore[] } => {
    const scores: { [key: string]: HoleScore[] } = {};

    const createEmptyScoresheet = (c: Course): HoleScore[] => {
        return c.pars.map((par, index) => ({
            hole: index + 1,
            par: par,
            strokes: null,
        }));
    };

    if ([GameFormat.STROKE_PLAY, GameFormat.MATCH_PLAY, GameFormat.BEST_BALL, GameFormat.SHAMBLE].includes(gameFormat) || teams.length === 0) {
        players.forEach(player => {
            scores[String(player.id)] = createEmptyScoresheet(course);
        });
    }

    if ([GameFormat.SCRAMBLE, GameFormat.BEST_BALL, GameFormat.SHAMBLE].includes(gameFormat)) {
        teams.forEach(team => {
            scores[team.id] = createEmptyScoresheet(course);
        });
    }

    return scores;
};

export const StartRound: React.FC = () => {
    const navigate = useNavigate();
    const { competitionId } = useParams<{ competitionId: string }>();
    const { currentUser, competitions, courses, users, addRound, setActiveRoundId } = useAppContext();

    const [competition, setCompetition] = useState<Competition | null>(null);
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    
    useEffect(() => {
        const foundComp = competitions.find(c => c.id === competitionId);
        if (foundComp) {
            setCompetition(foundComp);
            if (foundComp.courses.length === 1) {
                const course = courses.find(c => c.id === foundComp.courses[0].id);
                setSelectedCourse(course || null);
            }
        } else {
            alert('Competition not found.');
            navigate('/select-competition');
        }
    }, [competitionId, competitions, courses, navigate]);
    
    const { myTeam, teamPlayers } = useMemo(() => {
        if (!competition || !currentUser || !users) return { myTeam: null, teamPlayers: [] };
        
        const myTeam = competition.teams?.find(t => t.playerIds.includes(currentUser.id));
        if (!myTeam) return { myTeam: null, teamPlayers: [] };
        
        const players = users.filter(u => myTeam.playerIds.includes(u.id));

        return { myTeam, teamPlayers: players };
    }, [competition, currentUser, users]);

    const startRound = () => {
        if (!selectedCourse || !currentUser || !competition) {
            alert("Missing required information to start the round.");
            return;
        }

        const roundId = `round-${new Date().getTime()}`;

        let playersForRound: User[] = [currentUser];
        let teamsForRound: Team[] | undefined = undefined;

        if (competition.gameFormat === GameFormat.STROKE_PLAY) {
             playersForRound = competition.participantIds.map(pId => users.find(u => u.id === pId)).filter((p): p is User => !!p)
        } else {
            if (!myTeam) {
                alert("You are not assigned to a team for this competition.");
                return;
            }
            playersForRound = teamPlayers;
            teamsForRound = [myTeam];
        }
        
        const initialScores = createInitialScores(playersForRound, teamsForRound || [], selectedCourse, competition.gameFormat);
        
        const initialSkins: SkinResult[] | undefined = competition.skinValue && competition.skinValue > 0
            ? Array.from({ length: 18 }, (_, i) => ({
                holeIndex: i,
                winnerId: null,
                value: competition.skinValue || 0,
                carriedOver: false,
            }))
            : undefined;

        const newRound: Round = {
            id: roundId,
            courseId: selectedCourse.id,
            courseName: selectedCourse.name,
            date: new Date().toISOString(),
            players: playersForRound,
            scores: initialScores,
            gameFormat: competition.gameFormat,
            teams: teamsForRound,
            likes: 0,
            comments: [],
            matchResult: {},
            competitionId: competition.id,
            skinValue: competition.skinValue,
            skinsResult: initialSkins,
            skinsScoringType: competition.skinsScoringType,
        };

        addRound(newRound);
        setActiveRoundId(newRound.id);
        navigate(`/round/${roundId}`, { state: { round: newRound } });
    };
    
    if (!competition || !currentUser) return <Layout><p>Loading...</p></Layout>;

    const canStart = !!selectedCourse;
    
    return (
        <Layout>
            <div className="space-y-6">
                <h1 className="text-3xl font-bold text-gray-800">Start Round</h1>

                <div className="p-4 bg-white rounded-lg border">
                    <h2 className="text-lg font-semibold text-gray-700 mb-2">Competition Details</h2>
                    <p><strong>Name:</strong> {competition.name}</p>
                    <p><strong>Game Format:</strong> {competition.gameFormat}</p>
                    {competition.skinValue && <p><strong>Skins:</strong> ${competition.skinValue} per hole ({competition.skinsScoringType || 'gross'})</p>}
                </div>

                <div className="p-4 bg-white rounded-lg border">
                    <h2 className="text-lg font-semibold text-gray-700 mb-2">Course Selection</h2>
                    {competition.courses.length === 1 ? (
                        <div className="bg-blue-100 border border-blue-300 text-blue-800 p-3 rounded-lg">
                            {selectedCourse?.name || 'Loading course...'}
                        </div>
                    ) : (
                        <select
                            onChange={(e) => setSelectedCourse(courses.find(c => c.id === Number(e.target.value)) || null)}
                            value={selectedCourse?.id || ''}
                            className="w-full p-3 border border-gray-300 rounded-lg bg-white"
                        >
                            <option value="" disabled>Select a course for this round</option>
                            {competition.courses.map(courseInfo => (
                                <option key={courseInfo.id} value={courseInfo.id}>{courseInfo.name}</option>
                            ))}
                        </select>
                    )}
                </div>

                {myTeam && (
                    <div className="p-4 bg-white rounded-lg border">
                        <h2 className="text-lg font-semibold text-gray-700 mb-2">Your Team: {myTeam.name}</h2>
                        <ul className="space-y-2">
                           {teamPlayers.map(p => (
                               <li key={p.id} className="p-2 bg-gray-100 rounded-lg flex items-center gap-2">
                                   <img src={p.profilePictureUrl} alt={p.firstName} className="w-8 h-8 rounded-full"/>
                                   <span>{p.firstName} {p.lastName}</span>
                               </li>
                           ))}
                        </ul>
                    </div>
                )}

                <button
                    onClick={startRound}
                    disabled={!canStart}
                    className="w-full bg-green-600 text-white font-bold text-lg py-4 px-4 rounded-lg shadow-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed mt-6"
                >
                    Start Round
                </button>
            </div>
        </Layout>
    );
};