export interface Ship {
  position: { x: number; y: number };
  direction: boolean;
  length: number;
  type: "small" | "medium" | "large" | "huge";
  hits?: number;
}

export interface Game {
  id: string;
  players: { [playerId: string]: WebSocket };
  ships: { [playerId: string]: Ship[] };
  currentPlayerIndex: string | null;
}

export const games: { [gameId: string]: Game } = {};
