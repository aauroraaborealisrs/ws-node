import { WebSocket } from "ws";
import handleRegistration from "./handleRegistration";
import handleCreateRoom from "./handleCreateRoom";
import handleAddUserToRoom from "./handleAddUserToRoom";
import handleAddShips from "./handleAddShips";
import handleAttack from "./handleAttack";

export const players: {
  [name: string]: { password: string; wins: number; ws: WebSocket };
} = {};
export const rooms: {
  [roomId: string]: {
    players: WebSocket[];
    roomId: string;
    creatorName: string;
  };
} = {};

export const messageController = {
  reg: handleRegistration,
  create_room: handleCreateRoom,
  add_user_to_room: handleAddUserToRoom,
  add_ships: handleAddShips,
  attack: handleAttack,
  players,
  rooms,
};
