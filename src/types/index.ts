export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Player {
  id: string;
  name: string;
  isHost: boolean;
  totalScore: number;
  currentGuess: Coordinates | null;
  hasGuessed: boolean;
  roundScores: number[];
}

export interface Room {
  id: string;
  hostId: string;
  status: "waiting" | "playing" | "roundEnd" | "gameOver";
  currentRound: number;
  totalRounds: number;
  players: { [key: string]: Player };
  currentLocation: Coordinates | null;
  currentPanoId: string | null;
  roundResults: RoundResult[] | null;
}

export interface RoundResult {
  odlayerId: string;
  playerName: string;
  guess: Coordinates;
  distance: number;
  score: number;
}

export const TURKEY_BOUNDS = {
  north: 42.0,
  south: 36.0,
  east: 45.0,
  west: 26.0,
} as const;

export const SCORING = {
  maxScore: 5000,
  maxDistance: 500,
} as const;
