const express = require("express");
const { WebSocketServer } = require("ws");
const cors = require("cors");
const http = require("http");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.static(path.join(__dirname, "public")));

const rooms = {}; // Збереження кімнат

// Створення нової кімнати
app.get("/create-room", (req, res) => {
    const port = Math.floor(3000 + Math.random() * 5000); // Випадковий порт
    const server = http.createServer();
    const wss = new WebSocketServer({ server });

    rooms[port] = { server, wss, clients: new Set() };

    wss.on("connection", (ws) => {
        rooms[port].clients.add(ws);
        console.log(`Новий клієнт приєднався до кімнати ${port}`);

        ws.on("message", (message) => {
            rooms[port].clients.forEach((client) => {
                if (client !== ws && client.readyState === 1) {
                    client.send(message);
                }
            });
        });

        ws.on("close", () => {
            rooms[port].clients.delete(ws);
            if (rooms[port].clients.size === 0) {
                rooms[port].server.close();
                delete rooms[port];
                console.log(`Кімната ${port} закрита`);
            }
        });
    });

    server.listen(port, () => {
        console.log(`Кімната створена на порті ${port}`);
        res.json({ roomUrl: `wss://${req.headers.host.replace(/\:\d+$/, '')}:${port}` });
    });
});

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Сервер запущено на http://localhost:${PORT}`));
