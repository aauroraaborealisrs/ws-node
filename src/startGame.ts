import { WebSocket } from "ws";
import { games } from "./ds";

export default function startGame(room: {
  players: WebSocket[];
  roomId: string;
}) {
  const gameId = room.roomId;

  games[gameId] = {
    id: gameId,
    players: {},
    ships: {},
    currentPlayerIndex: null,
  };

  room.players.forEach((player, index) => {
    const playerId = `${gameId}_player${index + 1}`;
    games[gameId].players[playerId] = player;

    player.send(
      JSON.stringify({
        type: "create_game",
        data: JSON.stringify({
          idGame: gameId,
          idPlayer: playerId,
        }),
        id: 0,
      }),
    );
  });

  console.log(`Игра началась в комнате ${gameId}`);
}
