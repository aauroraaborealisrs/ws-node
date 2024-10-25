import { WebSocket } from "ws";

const players: { [name: string]: { password: string; wins: number } } = {};

function handleRegistration(
  ws: WebSocket,
  data: { name: string; password: string } | string,
) {
  console.log("Получены данные для регистрации:", data);

  if (typeof data === "string") {
    data = JSON.parse(data) as { name: string; password: string };
  }

  if (typeof data === "object" && "name" in data && "password" in data) {
    const { name, password } = data;
    console.log(name);
    console.log(password);

    if (!name || !password) {
      console.log("Ошибка: не предоставлено имя или пароль.");
      ws.send(JSON.stringify({ error: true, message: "Invalid input data" }));
      return;
    }

    if (players[name]) {
      console.log(`Ошибка: игрок с именем ${name} уже существует.`);
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
          name: "12345",
          password: "12345",
        }),
        id: 0,
      }),
    );

    console.log(
      "Response sent:",
      JSON.stringify({
        type: "reg",
        data: JSON.stringify({
          name: "12345",
          password: "12345",
        }),
        id: 0,
      }),
    );
  } else {
    console.log("Ошибка: некорректный формат данных.");
    ws.send(JSON.stringify({ error: true, message: "Invalid data format" }));
  }
}

export const messageController = {
  reg: handleRegistration,
};
