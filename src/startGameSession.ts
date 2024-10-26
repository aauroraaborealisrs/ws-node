import { games } from "./ds";

export default function startGameSession(gameId: string) {
  const game = games[gameId];
  if (!game) {
    console.log(`Ошибка: игра с ID ${gameId} не найдена.`);
    return;
  }

  const playerIds = Object.keys(game.players);
  const currentPlayerIndex = playerIds[0];
  game.currentPlayerIndex = currentPlayerIndex;

  playerIds.forEach((playerId) => {
    const playerWs = game.players[playerId];
    const playerShips = game.ships[playerId];

    playerWs.send(
      JSON.stringify({
        type: "start_game",
        data: {
          ships: playerShips,
          currentPlayerIndex,
          gameId: gameId,
        },
        id: 0,
      }),
    );
  });

  console.log(`Игра ${gameId} начата. Ход игрока ${currentPlayerIndex}`);
}
