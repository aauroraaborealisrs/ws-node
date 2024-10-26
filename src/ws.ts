import { WebSocketServer, WebSocket } from "ws";
import { messageController, players } from "./messageController";
import { httpServer } from "./http_server/index";

const clients: Set<WebSocket> = new Set();

const wss = new WebSocketServer({ server: httpServer });

wss.on("connection", (ws) => {
  console.log("Новый клиент подключен");
  clients.add(ws);

  ws.send(JSON.stringify({ message: "Welcome to Battleship!" }));

  ws.on("message", (message: Buffer) => {
    const messageStr = message.toString();
    const request = JSON.parse(messageStr);
    const { type, data } = request;

    if (messageController[type]) {
      messageController[type](ws, data, updateWinners);
    }
  });

  ws.on("close", () => {
    clients.delete(ws);
    console.log("Клиент отключен");
  });
});

function updateWinners() {
  const winners = Object.entries(players).map(([name, { wins }]) => ({
    name,
    wins,
  }));

  const message = JSON.stringify({
    type: "update_winners",
    data: JSON.stringify(winners),
    id: 0,
  });

  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

console.log("WebSocket сервер запущен через HTTP сервер.");
