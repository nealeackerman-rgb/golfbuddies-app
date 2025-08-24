


export enum GameFormat {
  STROKE_PLAY = 'Stroke Play',
  MATCH_PLAY = 'Match Play',
  SCRAMBLE = 'Scramble',
  BEST_BALL = 'Best Ball',
  SHAMBLE = 'Shamble',
}

export interface Team {
    id: string;
    name: string;
    playerIds: number[];
}

export interface User {
  id: number;
  firstName: string;
  lastName:string;
  email: string;
  phone: string;
  profilePictureUrl: string;
  friendIds?: number[];
  password?: string; // Added for mock authentication
  handicap: number; // e.g., 10 for a 10-handicap, -2 for a +2 handicap
  courseId?: number; // For multi-course competitions
}

export interface HoleScore {
  hole: number;
  par: number;
  strokes: number | null;
  videoUrl?: string;
  photoUrl?: string;
  netStrokes?: number; // Added for handicap display
}

export interface Comment {
    userId: number;
    text: string;
    timestamp: string;
}

export interface CompetitionFeedItem {
    id: string;
    userId: number;
    userName: string;
    userProfilePictureUrl: string;
    timestamp: string;
    type: 'comment' | 'video' | 'photo';
    text?: string;
    videoUrl?: string;
    photoUrl?: string;
    hole?: number;
    likes?: number;
}

export interface Competition {
  id: string;
  name: string;
  creatorId: number;
  courses: { id: number; name: string }[];
  participantIds: number[];
  gameFormat: GameFormat;
  status: 'Pending' | 'Active' | 'Completed';
  teams?: Team[];
  teamSize?: number;
  feed?: CompetitionFeedItem[];
  skinValue?: number;
  skinsScoringType?: 'gross' | 'net';
}

export interface SkinResult {
    holeIndex: number;
    winnerId: string | null; // userId or teamId
    value: number;
    carriedOver: boolean;
}

export interface Round {
  id: string;
  courseName: string;
  courseId: number;
  date: string;
  players: User[];
  scores: { [key: string]: HoleScore[] }; // Key is userId or teamId
  aiSummary?: string;
  likes: number;
  comments: Comment[];
  gameFormat: GameFormat;
  teams?: Team[];
  // For match play, records winner of each hole 'A', 'B', or 'T' for tie/push
  // Key is holeIndex, value is winner's ID (player or team) or 'TIE'
  matchResult?: { [holeIndex: number]: string }; 
  competitionId?: string;
  skinValue?: number;
  skinsResult?: SkinResult[];
  skinsScoringType?: 'gross' | 'net';
}

export interface Course {
  id: number;
  name: string;
  location: string; // Simplified location
  pars: number[]; // 18-hole par values
  handicapIndices: number[]; // 18-hole handicap values (1=hardest, 18=easiest)
  rating: number;
  slope: number;
}