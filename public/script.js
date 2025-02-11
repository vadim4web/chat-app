let socket;
let username = "";

// Функція для встановлення імені користувача
function setUsername() {
    username = document.getElementById("username").value.trim();
    if (!username) {
        alert("Будь ласка, введіть ім'я!");
        return;
    }

    // Сховуємо форму для введення імені і показуємо чат-інтерфейс
    document.getElementById("username-section").style.display = "none";
    document.getElementById("chat-section").style.display = "block";
}

// Створення кімнати
async function createRoom() {
    const response = await fetch("/create-room");
    const data = await response.json();
    document.getElementById("roomUrl").value = data.roomUrl;
    joinRoom();
}

// Приєднання до кімнати
function joinRoom() {
    const url = document.getElementById("roomUrl").value;
    if (!url) return alert("Введіть посилання на кімнату!");

    socket = new WebSocket(url);

    socket.onopen = () => {
        document.getElementById("room-info").innerText = "🔵 Підключено до " + url;
    };

    socket.onmessage = async (event) => {
        const chatBox = document.getElementById("chat-box");
        const data = await event.data.text(); // Читаємо повідомлення як текст

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
        reconnect(); // Автоперепідключення
    };

    socket.onerror = (error) => {
        console.error("WebSocket Error:", error);
        alert("❌ Помилка підключення до чату");
    };
}

// Функція для відправлення повідомлення
function sendMessage() {
    const message = document.getElementById("message").value;
    if (socket && socket.readyState === WebSocket.OPEN) {
        const messageObj = { sender: username, text: message };
        socket.send(JSON.stringify(messageObj)); // Відправляємо JSON
        document.getElementById("message").value = "";
    } else {
        alert("❌ WebSocket ще не підключений!");
    }
}

// Автоперепідключення у разі втрати зв'язку
function reconnect() {
    setTimeout(() => {
        console.log("🔄 Перепідключення...");
        joinRoom();
    }, 3000);
}

// Обробка отриманих даних (список кімнат)
socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === "update-rooms") {
        updateRoomList(data.rooms);
    }
};

// Оновлення списку кімнат на клієнті
function updateRoomList(rooms) {
    const roomList = document.getElementById("room-list");
    roomList.innerHTML = "";
    rooms.forEach(room => {
        const listItem = document.createElement("li");
        listItem.textContent = `${room.name} (${room.participants} учасників)`;
        listItem.onclick = () => {
            document.getElementById("roomUrl").value = `wss://${location.host}/ws?room=${room.name}`;
            joinRoom();
        };
        roomList.appendChild(listItem);
    })
}

// Оновлення списку доступних кімнат
function fetchAvailableRooms() {
    fetch("/active-rooms")
        .then(response => response.json())
        .then(data => {
            activeRooms = data.rooms;
            const roomList = document.getElementById("room-list");
            roomList.innerHTML = "";
            activeRooms.forEach(room => {
                const listItem = document.createElement("li");
                listItem.textContent = `${room.name} (${room.participants} учасників)`;
                listItem.onclick = () => {
                    document.getElementById("roomUrl").value = `wss://${location.host}/ws?room=${room.roomId}`;
                    joinRoom();
                };
                roomList.appendChild(listItem);
            });
        });
}

