import * as fs from "fs";
import * as path from "path";
import * as http from "http";
import { WebSocketServer, WebSocket } from "ws";
import { messageController, players } from "./messageController";

const __dirname = path.resolve(path.dirname(""));
const clients: Set<WebSocket> = new Set();

export const httpServer = http.createServer((req, res) => {
  const filePath = path.join(
    __dirname,
    req.url === "/" ? "/front/index.html" : "/front" + req.url,
  );

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "File not found" }));
      return;
    }

    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(data);
  });
});

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

process.on("SIGTERM", () => {
  console.log("Завершение работы сервера...");
  httpServer.close(() => {
    console.log("Сервер закрыт");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("Завершение работы сервера...");
  httpServer.close(() => {
    console.log("Сервер закрыт");
    process.exit(0);
  });
});
