import * as fs from "fs";
import * as path from "path";
import * as http from "http";
import { WebSocketServer, WebSocket } from "ws";
import { messageController } from "./messageController";

const __dirname = path.resolve(path.dirname(""));

export const httpServer = http.createServer(
  (req: http.IncomingMessage, res: http.ServerResponse) => {
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
  },
);

const wss = new WebSocketServer({ server: httpServer });

wss.on("connection", (ws: WebSocket) => {
  console.log("Новый клиент подключен");

  ws.send(JSON.stringify({ message: "Welcome to Battleship!" }));

  ws.on("message", (message: Buffer) => {
    console.log("Сообщение получено от клиента в виде буфера:", message);

    try {
      const messageStr = message.toString();
      console.log("Преобразованное сообщение в строку:", messageStr);

      const request = JSON.parse(messageStr);

      const { type, data } = request;

      if (messageController[type]) {
        console.log(`Обработка команды: ${type}`);
        messageController[type](ws, data);
      } else {
        console.log(`Ошибка: неизвестная команда ${type}`);
        ws.send(JSON.stringify({ error: true, message: "Unknown command" }));
      }
    } catch (error) {
      console.log("Ошибка при парсинге JSON:", error.message);
      ws.send(JSON.stringify({ error: true, message: "Invalid JSON format" }));
    }
  });

  ws.on("close", () => {
    console.log("Клиент отключен");
  });
});

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
