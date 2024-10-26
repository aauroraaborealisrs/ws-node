import { games } from "./ds";

export default function handleAttack(ws: WebSocket, data: any) {
  console.log("Получены данные для атаки (до парсинга):", data);

  let parsedData;
  try {
    parsedData = JSON.parse(data);
  } catch (error) {
    console.log("Ошибка: данные не являются валидным JSON");
    ws.send(
      JSON.stringify({
        type: "attack",
        data: JSON.stringify({ error: true, errorText: "Invalid JSON format" }),
        id: 0,
      }),
    );
    return;
  }

  console.log("Получены данные для атаки (после парсинга):", parsedData);

  const { gameId, x, y, indexPlayer } = parsedData;

  if (!gameId || x === undefined || y === undefined || !indexPlayer) {
    console.log("Ошибка: отсутствуют gameId, x, y или indexPlayer");
    ws.send(
      JSON.stringify({
        type: "attack",
        data: JSON.stringify({ error: true, errorText: "Invalid data format" }),
        id: 0,
      }),
    );
    return;
  }

  const game = games[gameId];
  if (!game) {
    console.log(`Ошибка: игра с ID ${gameId} не найдена`);
    ws.send(
      JSON.stringify({
        type: "attack",
        data: JSON.stringify({ error: true, errorText: "Game not found" }),
        id: 0,
      }),
    );
    return;
  }

  const opponentId = Object.keys(game.players).find((id) => id !== indexPlayer);
  if (!opponentId) {
    console.log(`Ошибка: противник для игрока ${indexPlayer} не найден`);
    ws.send(
      JSON.stringify({
        type: "attack",
        data: JSON.stringify({ error: true, errorText: "Opponent not found" }),
        id: 0,
      }),
    );
    return;
  }

  const opponentShips = game.ships[opponentId];
  let status: "miss" | "killed" | "shot" = "miss";
  let killedShip = null;

  for (let ship of opponentShips) {
    for (let i = 0; i < ship.length; i++) {
      const shipX = ship.position.x + (ship.direction ? i : 0);
      const shipY = ship.position.y + (!ship.direction ? i : 0);

      if (shipX === x && shipY === y) {
        status = "shot";
        ship.hits = (ship.hits || 0) + 1;

        if (ship.hits === ship.length) {
          status = "killed";
          killedShip = ship;
        }
        break;
      }
    }
    if (status === "shot" || status === "killed") break;
  }

  Object.values(game.players).forEach((playerWs) => {
    playerWs.send(
      JSON.stringify({
        type: "attack",
        data: JSON.stringify({
          position: { x, y },
          currentPlayer: indexPlayer,
          status,
        }),
        id: 0,
      }),
    );
  });

  console.log(`Атака игрока ${indexPlayer} на позиции (${x}, ${y}): ${status}`);

  if (status === "killed") {
    markSurroundingCellsAsMiss(game, killedShip, indexPlayer);
  }
}

function markSurroundingCellsAsMiss(
  game: any,
  killedShip: any,
  indexPlayer: string,
) {
  const surroundingCells = [];
  const { x, y } = killedShip.position;

  for (let i = -1; i <= killedShip.length; i++) {
    for (let j = -1; j <= 1; j++) {
      const cellX = killedShip.direction ? x + i : x + j;
      const cellY = killedShip.direction ? y + j : y + i;

      surroundingCells.push({ x: cellX, y: cellY });
    }
  }

  Object.values(game.players).forEach((playerWs: WebSocket) => {
    surroundingCells.forEach(({ x, y }) => {
      playerWs.send(
        JSON.stringify({
          type: "attack",
          data: JSON.stringify({
            position: { x, y },
            currentPlayer: indexPlayer,
            status: "miss",
          }),
          id: 0,
        }),
      );
    });
  });

  console.log(
    `Клетки вокруг уничтоженного корабля (${killedShip.position.x}, ${killedShip.position.y}) отмечены как промахи`,
  );
}
