import { games } from "./ds";
import sendTurnInfo from "./sendTurnInfo";

export default function startGameSession(gameId: string) {
  const game = games[gameId];
  if (!game) return;

  const playerIds = Object.keys(game.players);
  game.currentPlayerIndex = playerIds[0];

  sendTurnInfo(gameId);

  playerIds.forEach((playerId) => {
    const playerWs = game.players[playerId];
    const playerShips = game.ships[playerId];

    playerWs.send(
      JSON.stringify({
        type: "start_game",
        data: JSON.stringify({
          ships: playerShips,
          currentPlayerIndex: game.currentPlayerIndex,
        }),
        id: 0,
      }),
    );
  });

  console.log(`Игра ${gameId} начата. Ход игрока ${game.currentPlayerIndex}`);
}
