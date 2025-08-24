import { Course, User } from '../types';

/**
 * Calculates a player's course handicap for a specific course.
 * This treats the player.handicap as their Handicap Index.
 * Formula: Handicap Index * (Slope Rating / 113)
 */
export const calculateCourseHandicap = (player: User, course: Course): number => {
    if (!player || course === undefined) return 0;
    // The user's handicap is their index.
    return Math.round(player.handicap * (course.slope / 113));
};


/**
 * Determines how many handicap strokes a player gets on a specific hole.
 * @param courseHandicap The player's calculated handicap for the course they are playing.
 * @param holeHcpIndex The handicap index of the hole (1-18, where 1 is hardest).
 * @returns The number of strokes to deduct from the gross score for that hole.
 */
export const getStrokesForHole = (courseHandicap: number, holeHcpIndex: number): number => {
    if (courseHandicap >= 0) {
        const baseStrokes = Math.floor(courseHandicap / 18);
        const extraStrokes = courseHandicap % 18;
        return baseStrokes + (holeHcpIndex <= extraStrokes ? 1 : 0);
    } else { // Plus handicap
        const strokesToAdd = -courseHandicap;
        const baseStrokes = Math.floor(strokesToAdd / 18);
        const extraStrokes = strokesToAdd % 18;
        // For a plus handicap, the player ADDS strokes on the EASIEST holes.
        return -(baseStrokes + (holeHcpIndex > (18 - extraStrokes) ? 1 : 0));
    }
};
