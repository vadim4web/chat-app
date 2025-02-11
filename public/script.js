const express = require("express");
const { WebSocketServer } = require("ws");
const http = require("http");
const path = require("path");

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(express.static(path.join(__dirname, "public")));

const rooms = {}; // Об'єкт для збереження кімнат та їх підключень
const activeRooms = {}; // Кеш для доступних кімнат

// Обробник WebSocket з'єднання
wss.on("connection", (ws, req) => {
    const urlParams = new URL(req.url, `http://${req.headers.host}`);
    const roomId = urlParams.searchParams.get("room");

    if (!roomId) {
        ws.close();
        return;
    }

    if (!rooms[roomId]) {
        rooms[roomId] = new Set();
        activeRooms[roomId] = { name: `Кімната ${roomId}`, participants: 0 }; // Додаємо нову кімнату
    }

    rooms[roomId].add(ws);
    activeRooms[roomId].participants += 1; // Збільшуємо кількість учасників
    console.log(`Користувач приєднався до кімнати: ${roomId}`);

    // Розсилаємо всім користувачам оновлений список активних кімнат
    updateActiveRooms();

    ws.on("message", (message) => {
        console.log(`Отримано повідомлення у кімнаті ${roomId}:`, message);

        // Розсилаємо ВСІМ користувачам у кімнаті (включаючи відправника)
        rooms[roomId].forEach(client => {
            if (client.readyState === 1) {
                client.send(message);
            }
        });
    });

    ws.on("close", () => {
        rooms[roomId].delete(ws);
        activeRooms[roomId].participants -= 1; // Зменшуємо кількість учасників
        if (rooms[roomId].size === 0) {
            delete rooms[roomId];
            delete activeRooms[roomId];
            console.log(`Кімната ${roomId} закрита`);
        }

        // Розсилаємо всім користувачам оновлений список активних кімнат
        updateActiveRooms();
    });
});

// Функція для оновлення списку активних кімнат
function updateActiveRooms() {
    const activeRoomList = Object.values(activeRooms).map(room => ({
        name: room.name,
        participants: room.participants,
        roomId: room.name.split(" ")[1] // Отримуємо ID кімнати (наприклад, "Кімната 9kdw5alo" → "9kdw5alo")
    }));

    // Відправляємо оновлений список всім підключеним клієнтам
    wss.clients.forEach(client => {
        if (client.readyState === 1) {
            client.send(JSON.stringify({ type: "update-rooms", rooms: activeRoomList }));
        }
    });
}

// Обробка створення нової кімнати
app.get("/create-room", (req, res) => {
    const roomId = Math.random().toString(36).substr(2, 8);
    const roomName = `Кімната ${roomId}`;
    res.json({ roomUrl: `wss://${req.headers.host}/ws?room=${roomId}`, roomName: roomName });

    // Додаємо кімнату в кеш
    activeRooms[roomId] = { name: roomName, participants: 0 };
    updateActiveRooms(); // Оновлюємо список доступних кімнат
});

// Додати обробник маршруту для /active-rooms
app.get("/active-rooms", (req, res) => {
    const activeRoomList = Object.values(activeRooms).map(room => ({
        name: room.name,
        participants: room.participants,
        roomId: room.name.split(" ")[1] // Отримуємо ID кімнати
    }));

    res.json({ rooms: activeRoomList });
});

// Головна сторінка
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => console.log(`Сервер запущено на порту ${PORT}`));
