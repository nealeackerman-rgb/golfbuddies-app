

import { GoogleGenAI } from "@google/genai";
import { Round, User, GameFormat } from '../types';

// Assume process.env.API_KEY is available in the environment
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn("API_KEY is not set. AI features will be disabled.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

// A placeholder for a base64 encoded image for swing analysis
const MOCK_SWING_IMAGE_B64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";


export const getAISwingAnalysis = async (): Promise<string> => {
    if (!API_KEY) return "AI Swing Analyzer is offline. API key not configured.";
    try {
        const imagePart = {
            inlineData: {
                mimeType: 'image/png',
                data: MOCK_SWING_IMAGE_B64, 
            },
        };
        const textPart = {
            text: "Analyze this golf swing from the provided image. The golfer is right-handed. Provide 3 actionable tips to improve their form, focusing on posture, grip, and follow-through."
        };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, textPart] },
        });

        return response.text;
    } catch (error) {
        console.error("Error getting AI Swing Analysis:", error);
        return "Sorry, the AI Swing Analyzer couldn't process the video. Please try again.";
    }
};

const getFinalMatchScore = (round: Round): string => {
    if (!round.matchResult || !round.teams || round.teams.length !== 2) return "";
    
    const teamAWins = Object.values(round.matchResult).filter(winner => winner === round.teams![0].id).length;
    const teamBWins = Object.values(round.matchResult).filter(winner => winner === round.teams![1].id).length;
    
    const holesPlayed = Object.keys(round.matchResult).length;
    const holesRemaining = 18 - holesPlayed;
    
    if (Math.abs(teamAWins - teamBWins) > holesRemaining) {
        const leader = teamAWins > teamBWins ? round.teams[0] : round.teams[1];
        const winningMargin = Math.abs(teamAWins - teamBWins);
        const holesWon = Math.max(teamAWins, teamBWins);
        // e.g. 10 holes played, A won 6, B won 1. A is 5 up with 8 to play. Game over.
        // Winning margin is 5. Holes remaining is 8.
        // Final score is Leader wins by (winning margin) & (18 - holes_won_by_loser)
        const loserHolesWon = Math.min(teamAWins, teamBWins);
        const score = `${winningMargin}&${18 - (holesPlayed - loserHolesWon)}`;
        return `${leader.name} won ${score}`;
    }
    
    if(holesPlayed === 18) {
         if (teamAWins > teamBWins) return `${round.teams[0].name} won ${teamAWins - teamBWins} UP`;
         if (teamBWins > teamAWins) return `${round.teams[1].name} won ${teamBWins - teamAWins} UP`;
         return "Match was a TIE";
    }

    return "Match in progress";
};


export const getAIRoundSummary = async (round: Round, user: User): Promise<string> => {
    if (!API_KEY) return "AI Summary is offline. API key not configured.";
    try {
        let promptContext = `
        Player: ${user.firstName} ${user.lastName}
        Course: ${round.courseName}
        Game Format: ${round.gameFormat}
        Players in group: ${round.players.map(p => `${p.firstName} ${p.lastName}`).join(', ')}
        `;

        if(round.gameFormat === GameFormat.STROKE_PLAY) {
            const userScores = round.scores[user.id];
            if (!userScores) return "Could not find scores for this user.";
            const totalScore = userScores.reduce((acc, score) => acc + (score.strokes || 0), 0);
            const totalPar = userScores.reduce((acc, score) => acc + score.par, 0);
            const scoreToPar = totalScore - totalPar;
            promptContext += `\nFinal Score: ${totalScore} (to par: ${scoreToPar > 0 ? '+' : ''}${scoreToPar})`;
        } else if (round.gameFormat === GameFormat.MATCH_PLAY) {
            const finalScore = getFinalMatchScore(round);
            promptContext += `\nMatch Result: ${finalScore}`;
        } else if (round.teams) { // Team modes
            const userTeam = round.teams.find(t => t.playerIds.includes(user.id));
            if(userTeam) {
                const teamScores = round.scores[userTeam.id];
                const totalScore = teamScores.reduce((acc, score) => acc + (score.strokes || 0), 0);
                const totalPar = teamScores.reduce((acc, score) => acc + score.par, 0);
                const scoreToPar = totalScore - totalPar;
                promptContext += `\nTeam: ${userTeam.name}\nTeam Score: ${totalScore} (to par: ${scoreToPar > 0 ? '+' : ''}${scoreToPar})`;
            }
        }

        const prompt = `Generate a short, engaging social media post caption for a golf app called GolfBuddies.
        
        ${promptContext}

        Instructions:
        - Write from the perspective of the player, ${user.firstName}.
        - Make it sound personal, fun, and authentic.
        - Acknowledge the game format played.
        - For Stroke Play, focus on the individual's performance and key moments.
        - For Match Play, describe the narrative (e.g., "It was a back-and-forth battle...", "Managed to close out the match early!").
        - For team games (Scramble, Best Ball, Shamble), emphasize teamwork and the fun of playing together.
        - Keep the summary concise and perfect for a social feed. Use emojis where appropriate.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        return response.text;
    } catch (error) {
        console.error("Error getting AI Round Summary:", error);
        return "Sorry, the AI couldn't generate a summary for this round.";
    }
};