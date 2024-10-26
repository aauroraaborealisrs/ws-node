import generateRoomId from "./generateRoomId";
import { players, rooms } from "./messageController";
import updateRoomState from "./updateRoomState";

export default function handleCreateRoom(ws: WebSocket) {
  const playerEntry = Object.entries(players).find(
    ([, value]) => value.ws === ws,
  );

  if (!playerEntry) {
    console.log(
      "Ошибка: Не удалось найти зарегистрированного игрока для создания комнаты.",
    );
    ws.send(
      JSON.stringify({
        type: "error",
        data: JSON.stringify({
          message: "Игрок не найден. Пожалуйста, зарегистрируйтесь.",
        }),
        id: 0,
      }),
    );
    return;
  }

  const [playerName] = playerEntry;

  const roomId = generateRoomId();
  rooms[roomId] = { players: [ws], roomId, creatorName: playerName };
  console.log(`Комната ${roomId} создана игроком ${playerName}`);
  console.log("Текущие комнаты после создания:", rooms);

  ws.send(
    JSON.stringify({
      type: "create_room",
      data: JSON.stringify({
        roomId,
        message: "Комната создана, и вы в ней находитесь.",
      }),
      id: 0,
    }),
  );

  updateRoomState();
}
