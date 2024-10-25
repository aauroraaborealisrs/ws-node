import * as fs from "fs";
import * as path from "path";
import * as http from "http";
import { WebSocketServer, WebSocket } from "ws";

const __dirname = path.resolve(path.dirname(""));

export const httpServer = http.createServer(
  (req: http.IncomingMessage, res: http.ServerResponse) => {
    const file_path = path.join(
      __dirname,
      req.url === "/" ? "/front/index.html" : "/front" + req.url,
    );

    fs.readFile(file_path, (err, data) => {
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
  console.log("New WebSocket client connected");

  ws.send(JSON.stringify({ message: "Welcome to Battleship!" }));

  ws.on("message", (message: string) => {
    console.log("Received:", message);
  });

  ws.on("close", () => {
    console.log("WebSocket client disconnected");
  });
});

process.on("SIGTERM", () => {
  console.log("Closing server...");
  httpServer.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("Closing server...");
  httpServer.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});
