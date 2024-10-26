import { WebSocket } from "ws";

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

function handleRegistration(
  ws: WebSocket,
  data: { name: string; password: string } | string,
  updateWinners: () => void,
) {
  console.log("Получены данные для регистрации:", data);

  if (typeof data === "string") {
    data = JSON.parse(data) as { name: string; password: string };
  }

  if (typeof data === "object" && "name" in data && "password" in data) {
    const { name, password } = data;

    if (!name || !password) {
      ws.send(JSON.stringify({ error: true, message: "Invalid input data" }));
      return;
    }

    if (players[name]) {
      ws.send(
        JSON.stringify({
          type: "reg",
          data: JSON.stringify({
            name,
            password,
            error: true,
            errorText: "Player already exists",
          }),
          id: 0,
        }),
      );
      return;
    }

    players[name] = { password, wins: 0, ws };
    console.log(`Игрок ${name} успешно зарегистрирован.`);
    console.log("Текущие игроки:", players);

    ws.send(
      JSON.stringify({
        type: "reg",
        data: JSON.stringify({
          name: name,
          password: password,
          error: false,
          errorText: "",
        }),
        id: 0,
      }),
    );

    updateWinners();
    updateRoomState(ws);
  } else {
    ws.send(JSON.stringify({ error: true, message: "Invalid data format" }));
  }
}

function handleCreateRoom(ws: WebSocket) {
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

function handleAddUserToRoom(ws: WebSocket, data: string) {
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

function generateRoomId() {
  return `room_${Math.random().toString(36).substr(2, 9)}`;
}

function updateRoomState(targetWs?: WebSocket) {
  const availableRooms = Object.values(rooms)
    .filter((room) => room.players.length === 1)
    .map((room) => ({
      roomId: room.roomId,
      roomUsers: [
        { name: room.creatorName || "Неизвестный игрок", index: room.roomId },
      ],
    }));

  console.log("Доступные комнаты для обновления:", availableRooms);

  const message = JSON.stringify({
    type: "update_room",
    data: JSON.stringify(availableRooms),
    id: 0,
  });

  if (targetWs) {
    if (targetWs.readyState === WebSocket.OPEN) {
      targetWs.send(message);
    }
  } else {
    Object.values(rooms).forEach((room) =>
      room.players.forEach((player) => {
        if (player.readyState === WebSocket.OPEN) {
          player.send(message);
        }
      }),
    );
  }
}

function startGame(room: { players: WebSocket[]; roomId: string }) {
  const gameId = generateRoomId();
  room.players.forEach((player, index) => {
    player.send(
      JSON.stringify({
        type: "create_game",
        data: JSON.stringify({
          idGame: gameId,
          idPlayer: `${gameId}_player${index + 1}`,
        }),
        id: 0,
      }),
    );
  });
  console.log(`Игра началась в комнате ${room.roomId}`);
}

export const messageController = {
  reg: handleRegistration,
  create_room: handleCreateRoom,
  add_user_to_room: handleAddUserToRoom,
  players,
  rooms,
};
