import { games } from "./ds";
import { WebSocket } from "ws";

export default function sendTurnInfo(gameId: string) {
  const game = games[gameId];
  if (!game) return;

  Object.values(game.players).forEach((playerWs) => {
    (playerWs as WebSocket).send(
      JSON.stringify({
        type: "turn",
        data: JSON.stringify({
          currentPlayer: game.currentPlayerIndex,
        }),
        id: 0,
      }),
    );
  });
}
