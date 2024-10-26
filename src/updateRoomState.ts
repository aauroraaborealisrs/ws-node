import { rooms } from "./messageController";

export default function updateRoomState(targetWs?: WebSocket) {
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
