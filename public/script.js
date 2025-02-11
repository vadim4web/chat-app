let socket;

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
        const message = await event.data.text(); // Читаємо Blob як текст
        chatBox.innerHTML += `<p>${message}</p>`;
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
        socket.send(message);
        document.getElementById("chat-box").innerHTML += `<p><strong>Ви:</strong> ${message}</p>`; // Оновлення чату у відправника
        document.getElementById("message").value = "";
    } else {
        alert("❌ WebSocket ще не підключений!");
    }
}
