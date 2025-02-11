const express = require("express");
const { WebSocketServer } = require("ws");
const http = require("http");
const path = require("path");

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json()); // Для обробки JSON запитів

const rooms = {}; // Об'єкт для збереження кімнат

wss.on("connection", (ws, req) => {
    const urlParams = new URL(req.url, `http://${req.headers.host}`);
    const roomId = urlParams.searchParams.get("room");

    if (!roomId) {
        ws.close();
        return;
    }

    if (!rooms[roomId]) {
        rooms[roomId] = { clients: new Set(), name: "Без назви" };
    }

    rooms[roomId].clients.add(ws);
    console.log(`Користувач приєднався до кімнати: ${roomId}`);

    ws.on("message", (message) => {
        console.log(`Отримано повідомлення у кімнаті ${roomId}:`, message);

        // Розсилаємо ВСІМ користувачам у кімнаті (включаючи відправника)
        rooms[roomId].clients.forEach(client => {
            if (client.readyState === 1) {
                client.send(message);
            }
        });
    });

    ws.on("close", () => {
        rooms[roomId].clients.delete(ws);
        if (rooms[roomId].clients.size === 0) {
            delete rooms[roomId];
            console.log(`Кімната ${roomId} закрита`);
        }
    });
});

app.get("/create-room", (req, res) => {
    const roomId = Math.random().toString(36).substr(2, 8);
    const roomName = req.body.roomName || "Без назви"; // Назва кімнати

    rooms[roomId] = { clients: new Set(), name: roomName };
    res.json({ roomUrl: `wss://${req.headers.host}/ws?room=${roomId}`, roomName });
});

app.get("/rooms", (req, res) => {
    // Віддаємо всі публічні кімнати
    const publicRooms = Object.keys(rooms).map(roomId => ({
        roomId,
        roomName: rooms[roomId].name
    }));
    res.json(publicRooms);
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => console.log(`Сервер запущено на порту ${PORT}`));
