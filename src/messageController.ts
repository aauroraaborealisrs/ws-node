import { WebSocket } from "ws";

export const players: { [name: string]: { password: string; wins: number } } =
  {};

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
          data: {
            name,
            password,
            error: true,
            errorText: "Player already exists",
          },
          id: 0,
        }),
      );
      return;
    }

    players[name] = { password, wins: 0 };
    console.log(`Игрок ${name} успешно зарегистрирован.`);

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
  } else {
    ws.send(JSON.stringify({ error: true, message: "Invalid data format" }));
  }
}

export const messageController = {
  reg: handleRegistration,
  players,
};
