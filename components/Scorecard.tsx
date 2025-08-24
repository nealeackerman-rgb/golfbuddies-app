import React from 'react';
import { HoleScore } from '../types';

interface ScorecardProps {
  scores: HoleScore[];
  onScoreChange?: (holeIndex: number, newStrokes: number | null) => void;
  isEditable: boolean;
}

const ScoreDisplay: React.FC<{
    par: number;
    strokes: number | null;
    holeIndex: number;
    isEditable: boolean;
    onScoreChange?: (holeIndex: number, newStrokes: number | null) => void;
}> = ({ par, strokes, holeIndex, isEditable, onScoreChange }) => {
    
    const diff = strokes === null ? null : strokes - par;

    const inputOrText = isEditable ? (
        <input
            type="number"
            value={strokes === null ? '' : strokes}
            onChange={(e) => onScoreChange?.(holeIndex, e.target.value ? parseInt(e.target.value) : null)}
            readOnly={!isEditable}
            className="w-full h-8 text-center bg-transparent z-10 relative font-semibold text-gray-800 focus:outline-none"
        />
    ) : (
        <span className="z-10 relative font-semibold text-gray-800">{strokes}</span>
    );
    
    // Default empty state
    if (strokes === null) {
        return isEditable ? (
            <input
                type="number"
                value=""
                onChange={(e) => onScoreChange?.(holeIndex, e.target.value ? parseInt(e.target.value) : null)}
                className="w-full h-8 text-center bg-gray-100 rounded-sm"
            />
        ) : <div className="w-full h-8 bg-gray-100 rounded-sm" />;
    }

    let borders = <></>;
    let bgColor = 'bg-white';

    if (strokes === 1) { // Ace (Hole in one)
        borders = <>
            <div className="absolute inset-0.5 border-2 border-green-500 rounded-full animate-pulse"></div>
            <div className="absolute inset-0 border-2 border-green-500 rounded-full scale-75"></div>
        </>;
    } else if (diff !== null) {
        if (diff <= -2) { // Eagle or better
            borders = <>
                <div className="absolute inset-0.5 border-2 border-green-500 rounded-full"></div>
                <div className="absolute inset-0 border-2 border-green-500 rounded-full scale-75"></div>
            </>;
        } else if (diff === -1) { // Birdie
            borders = <div className="absolute inset-0.5 border-2 border-green-500 rounded-full"></div>;
        } else if (diff === 0) { // Par
            bgColor = 'bg-gray-200';
        } else if (diff === 1) { // Bogey
            borders = <div className="absolute inset-0.5 border-2 border-red-500 rounded-sm"></div>;
        } else if (diff >= 2) { // Double Bogey or worse
            borders = <>
                <div className="absolute inset-0.5 border-2 border-red-500 rounded-sm"></div>
                <div className="absolute inset-0 border-2 border-red-500 rounded-sm scale-75"></div>
            </>;
        }
    }

    return (
        <div className={`relative w-full h-8 flex items-center justify-center rounded-sm ${bgColor}`}>
            {borders}
            {inputOrText}
        </div>
    );
};

export const Scorecard: React.FC<ScorecardProps> = ({ scores, onScoreChange, isEditable }) => {
    
    const frontNine = scores.slice(0, 9);
    const backNine = scores.slice(9, 18);

    const calculateTotal = (nine: HoleScore[]) => nine.reduce((acc, hole) => acc + (hole.strokes || 0), 0);
    const calculateParTotal = (nine: HoleScore[]) => nine.reduce((acc, hole) => acc + hole.par, 0);

    const frontNineTotal = calculateTotal(frontNine);
    const backNineTotal = calculateTotal(backNine);
    const totalScore = frontNineTotal + backNineTotal;
    
    const frontNinePar = calculateParTotal(frontNine);
    const backNinePar = calculateParTotal(backNine);
    const totalPar = frontNinePar + backNinePar;

  return (
    <div className="bg-white p-2 rounded-lg shadow-md font-mono text-sm border border-gray-200">
        <div className="grid grid-cols-10 text-center font-bold text-gray-600">
            <div className="p-1">Hole</div>
            {[...Array(9)].map((_, i) => <div key={i} className="p-1">{i + 1}</div>)}
        </div>
         <div className="grid grid-cols-10 text-center text-gray-500">
            <div className="p-1 font-bold">Par</div>
            {frontNine.map((h, i) => <div key={i} className="p-1">{h.par}</div>)}
        </div>
        <div className="grid grid-cols-10 text-center">
            <div className="p-1 font-bold text-gray-700 self-center">Score</div>
            {frontNine.map((hole, index) => (
                <div key={index} className="p-0.5">
                   <ScoreDisplay
                        par={hole.par}
                        strokes={hole.strokes}
                        holeIndex={index}
                        isEditable={isEditable}
                        onScoreChange={onScoreChange}
                   />
                </div>
            ))}
        </div>
        <div className="grid grid-cols-10 text-center font-bold mt-4">
            <div className="p-1">Hole</div>
            {[...Array(9)].map((_, i) => <div key={i} className="p-1">{i + 10}</div>)}
        </div>
         <div className="grid grid-cols-10 text-center text-gray-500">
            <div className="p-1 font-bold">Par</div>
            {backNine.map((h, i) => <div key={i} className="p-1">{h.par}</div>)}
        </div>
        <div className="grid grid-cols-10 text-center">
            <div className="p-1 font-bold text-gray-700 self-center">Score</div>
            {backNine.map((hole, index) => (
                 <div key={index} className="p-0.5">
                    <ScoreDisplay
                        par={hole.par}
                        strokes={hole.strokes}
                        holeIndex={index + 9}
                        isEditable={isEditable}
                        onScoreChange={onScoreChange}
                    />
                 </div>
            ))}
        </div>
        <div className="mt-4 pt-4 border-t-2 border-gray-300 flex justify-around font-bold text-lg">
            <div className="text-center">
                <p className="text-sm text-gray-500">Total Score</p>
                <p className="text-gray-800">{totalScore}</p>
            </div>
            <div className="text-center">
                <p className="text-sm text-gray-500">Total Par</p>
                <p className="text-gray-800">{totalPar}</p>
            </div>
             <div className="text-center">
                <p className="text-sm text-gray-500">To Par</p>
                <p className={totalScore - totalPar > 0 ? "text-red-600" : "text-blue-600"}>
                    {totalScore > 0 && totalScore - totalPar !== 0 ? (totalScore - totalPar > 0 ? `+${totalScore - totalPar}` : totalScore - totalPar) : 'E'}
                </p>
            </div>
        </div>
    </div>
  );
};