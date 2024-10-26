import { games } from "./ds";
import startGameSession from "./startGameSession";

export default function handleAddShips(ws: WebSocket, data: any) {
  console.log("Получены данные для добавления кораблей:", data);

  if (typeof data === "string") {
    try {
      data = JSON.parse(data);
    } catch (error) {
      console.log("Ошибка: не удалось распарсить данные:", data);
      ws.send(
        JSON.stringify({
          type: "add_ships",
          data: JSON.stringify({
            error: true,
            errorText: "Data parsing error",
          }),
          id: 0,
        }),
      );
      return;
    }
  }

  const gameId = data.gameId;
  const ships = data.ships;
  const indexPlayer = data.indexPlayer;

  console.log(`gameId: ${gameId}`);
  console.log(`ships:`, ships);
  console.log(`indexPlayer: ${indexPlayer}`);

  if (!gameId || !Array.isArray(ships) || !indexPlayer) {
    console.log("Ошибка: отсутствует gameId, ships или indexPlayer.");
    ws.send(
      JSON.stringify({
        type: "add_ships",
        data: JSON.stringify({
          error: true,
          errorText: "Invalid data format",
        }),
        id: 0,
      }),
    );
    return;
  }

  const game = games[gameId];
  if (!game) {
    console.log(`Ошибка: игра с ID ${gameId} не найдена.`);
    ws.send(
      JSON.stringify({
        type: "add_ships",
        data: JSON.stringify({
          error: true,
          errorText: "Game not found",
        }),
        id: 0,
      }),
    );
    return;
  }

  const validShips = ships.every((ship) => {
    const isValidShip =
      ship.position &&
      typeof ship.position.x === "number" &&
      typeof ship.position.y === "number" &&
      typeof ship.direction === "boolean" &&
      typeof ship.length === "number" &&
      ["small", "medium", "large", "huge"].includes(ship.type);

    if (!isValidShip) {
      console.log("Ошибка: неверный формат корабля:", ship);
    }
    return isValidShip;
  });

  if (!validShips) {
    ws.send(
      JSON.stringify({
        type: "add_ships",
        data: JSON.stringify({
          error: true,
          errorText: "Invalid ship format",
        }),
        id: 0,
      }),
    );
    return;
  }

  game.ships[indexPlayer] = ships;
  console.log(`Корабли для игрока ${indexPlayer} добавлены в игру ${gameId}`);

  if (Object.keys(game.ships).length === 2) {
    console.log(
      `Обе стороны добавили корабли в игру ${gameId}. Начинаем сессию.`,
    );
    startGameSession(gameId);
  }
}
