let socket;
let username = "";

async function setup() {
    username = prompt("Введіть ваше ім'я:");
    document.getElementById("user-name").innerText = `Ваше ім'я: ${username}`;

    // Завантажуємо список публічних кімнат
    loadPublicRooms();
}

async function loadPublicRooms() {
    const response = await fetch("/rooms");
    const rooms = await response.json();
    const roomsList = document.getElementById("public-rooms");
    roomsList.innerHTML = "";

    rooms.forEach(room => {
        const roomElement = document.createElement("li");
        roomElement.innerHTML = `<a href="#" onclick="joinRoom('${room.roomId}')">${room.roomName}</a>`;
        roomsList.appendChild(roomElement);
    });
}

async function createRoom() {
    const roomName = document.getElementById("room-name").value || "Без назви";
    const response = await fetch("/create-room", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ roomName })
    });

    const data = await response.json();
    const roomUrl = data.roomUrl;

    // Показуємо створене посилання на кімнату
    document.getElementById("room-url").innerText = `Посилання на кімнату: ${roomUrl}`;
    loadPublicRooms(); // Перезавантажуємо список кімнат
}

function joinRoom(roomId) {
    const url = `wss://${window.location.host}/ws?room=${roomId}`;
    socket = new WebSocket(url);

    socket.onopen = () => {
        document.getElementById("room-info").innerText = `🔵 Підключено до кімнати ${roomId}`;
    };

    socket.onmessage = async (event) => {
        const chatBox = document.getElementById("chat-box");
        const data = await event.data.text();
        try {
            const messageObj = JSON.parse(data);
            chatBox.innerHTML += `<p><strong>${messageObj.sender}:</strong> ${messageObj.text}</p>`;
        } catch (e) {
            console.error("Помилка обробки повідомлення:", e);
        }
        chatBox.scrollTop = chatBox.scrollHeight;
    };

    socket.onclose = () => {
        document.getElementById("room-info").innerText = "🔴 З'єднання закрите";
    };

    socket.onerror = (error) => {
        console.error("WebSocket Error:", error);
        alert("❌ Помилка підключення до чату");
    };
}

function sendMessage() {
    const message = document.getElementById("message").value;
    if (socket && socket.readyState === WebSocket.OPEN) {
        const messageObj = { sender: username, text: message };
        socket.send(JSON.stringify(messageObj));
        document.getElementById("message").value = "";
    } else {
        alert("❌ WebSocket ще не підключений!");
    }
}

setup(); // ініціалізація при відкритті сайту
