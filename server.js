const express = require("express");
const { WebSocketServer } = require("ws");
const http = require("http");
const path = require("path");

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(express.static(path.join(__dirname, "public")));

const rooms = {}; // Об'єкт для збереження кімнат

wss.on("connection", (ws, req) => {
    const urlParams = new URL(req.url, `http://${req.headers.host}`);
    const roomId = urlParams.searchParams.get("room");

    if (!roomId) {
        ws.close();
        return;
    }

    if (!rooms[roomId]) {
        rooms[roomId] = new Set();
    }

    rooms[roomId].add(ws);
    console.log(`Користувач приєднався до кімнати: ${roomId}`);

    ws.on("message", (message) => {
        rooms[roomId].forEach(client => {
            if (client.readyState === 1) {
                client.send(message); // Відправляємо всім у кімнаті
            }
        });
    });

    ws.on("close", () => {
        rooms[roomId].delete(ws);
        if (rooms[roomId].size === 0) {
            delete rooms[roomId];
            console.log(`Кімната ${roomId} закрита`);
        }
    });
});

app.get("/create-room", (req, res) => {
    const roomId = Math.random().toString(36).substr(2, 8);
    res.json({ roomUrl: `wss://${req.headers.host}/ws?room=${roomId}` });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => console.log(`Сервер запущено на порту ${PORT}`));
