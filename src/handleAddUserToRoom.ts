import { rooms } from "./messageController";
import startGame from "./startGame";
import updateRoomState from "./updateRoomState";

export default function handleAddUserToRoom(ws: WebSocket, data: string) {
  console.log(
    "Получен запрос на добавление в комнату с данными (в виде строки):",
    data,
  );

  const match = data.match(/"indexRoom"\s*:\s*"([^"]+)"/);
  const indexRoom = match ? match[1] : undefined;

  if (!indexRoom) {
    console.log("Ошибка: indexRoom не определен или отсутствует.");
    ws.send(
      JSON.stringify({
        type: "add_user_to_room",
        data: JSON.stringify({
          error: true,
          errorText: "Room ID is not provided",
        }),
        id: 0,
      }),
    );
    return;
  }

  console.log(`Запрос на добавление в комнату с ID: ${indexRoom}`);
  console.log("Текущие комнаты:", rooms);

  if (!rooms[indexRoom]) {
    console.log(`Ошибка: комната ${indexRoom} не существует.`);
    ws.send(
      JSON.stringify({
        type: "add_user_to_room",
        data: JSON.stringify({ error: true, errorText: "Room does not exist" }),
        id: 0,
      }),
    );
    return;
  }

  const room = rooms[indexRoom];

  if (room.players.includes(ws)) {
    console.log(`Ошибка: игрок уже находится в комнате ${indexRoom}.`);
    ws.send(
      JSON.stringify({
        type: "add_user_to_room",
        data: JSON.stringify({
          error: true,
          errorText: "You are already in this room",
        }),
        id: 0,
      }),
    );
    return;
  }

  if (room.players.length >= 2) {
    console.log(`Ошибка: комната ${indexRoom} уже полная.`);
    ws.send(
      JSON.stringify({
        type: "add_user_to_room",
        data: JSON.stringify({
          error: true,
          errorText: "Room is already full",
        }),
        id: 0,
      }),
    );
    return;
  }

  room.players.push(ws);
  console.log(`Игрок успешно добавлен в комнату ${indexRoom}`);
  console.log("Текущие комнаты после добавления:", rooms);

  ws.send(
    JSON.stringify({
      type: "add_user_to_room",
      data: JSON.stringify({
        roomId: indexRoom,
        message: "You have joined the room",
      }),
      id: 0,
    }),
  );

  if (room.players.length === 2) {
    startGame(room);
    delete rooms[indexRoom];
  } else {
    updateRoomState();
  }
}
