let socket;
let username = "User" + Math.floor(Math.random() * 1000); // Генеруємо випадкове ім'я

async function createRoom() {
    const response = await fetch("/create-room");
    const data = await response.json();
    document.getElementById("roomUrl").value = data.roomUrl;
    joinRoom();
}

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
        socket.send(JSON.stringify(messageObj)); // Відправляємо JSON

        // Додаємо повідомлення відправника в його вікно
        const chatBox = document.getElementById("chat-box");
        chatBox.innerHTML += `<p><strong>Ви:</strong> ${message}</p>`;
        chatBox.scrollTop = chatBox.scrollHeight;

        document.getElementById("message").value = "";
    } else {
        alert("❌ WebSocket ще не підключений!");
    }
}
