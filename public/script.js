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
    document.getElementById("room-info").innerText = "🔵 Підключено до " + url;

    socket.onmessage = (event) => {
        const chatBox = document.getElementById("chat-box");
        chatBox.innerHTML += `<p>${event.data}</p>`;
        chatBox.scrollTop = chatBox.scrollHeight;
    };

    socket.onclose = () => {
        document.getElementById("room-info").innerText = "🔴 З'єднання закрите";
    };
}

function sendMessage() {
    const message = document.getElementById("message").value;
    if (socket && message) {
        socket.send(message);
        document.getElementById("message").value = "";
    }
}
