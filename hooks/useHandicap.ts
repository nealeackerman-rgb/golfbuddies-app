
import { useState, useEffect } from 'react';
import { Round } from '../types';

// NOTE: This is a simplified handicap calculation for demonstration purposes.
// A real USGA handicap involves course rating, slope rating, and more complex adjustments.
export const useHandicap = (rounds: Round[], userId: number) => {
    const [handicap, setHandicap] = useState<string>('N/A');

    useEffect(() => {
        const userRounds = rounds
            .filter(round => round.scores[userId])
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        if (userRounds.length < 5) { // Need at least a few rounds to calculate
            setHandicap('N/A');
            return;
        }

        const recent20Rounds = userRounds.slice(0, 20);

        const differentials = recent20Rounds.map(round => {
            const userScores = round.scores[userId];
            const totalScore = userScores.reduce((sum, score) => sum + (score.strokes || 0), 0);
            const totalPar = userScores.reduce((sum, score) => sum + score.par, 0);
            // Simplified differential: Score - Par
            return totalScore - totalPar;
        }).sort((a, b) => a - b);

        const bestRoundsCount = Math.min(8, Math.floor(differentials.length / 2.5)); // Use best 8 for 20 rounds, scales down
        if(bestRoundsCount < 1) {
             setHandicap('N/A');
             return;
        }
        
        const bestDifferentials = differentials.slice(0, bestRoundsCount);
        const averageOfBest = bestDifferentials.reduce((sum, diff) => sum + diff, 0) / bestDifferentials.length;
        
        const calculatedHandicap = Math.floor(averageOfBest * 0.96 * 10) / 10; // Apply factor and round to one decimal

        setHandicap(calculatedHandicap > 0 ? `+${calculatedHandicap.toFixed(1)}` : calculatedHandicap.toFixed(1));

    }, [rounds, userId]);

    return handicap;
};
