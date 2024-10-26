import { players } from "./messageController";
import updateRoomState from "./updateRoomState";

export default function handleRegistration(
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
