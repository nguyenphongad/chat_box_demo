// Avatar URL - có thể thay đổi thành bất kỳ ảnh nào
const AI_AVATAR = "https://cdn-icons-png.flaticon.com/512/4616/4616734.png";
const USER_AVATAR = "https://cdn-icons-png.flaticon.com/512/1077/1077114.png";

document.getElementById("sendBtn").addEventListener("click", sendMessage);
document.getElementById("userMessage").addEventListener("keypress", function(e) {
    if (e.key === "Enter") {
        sendMessage();
    }
});

async function sendMessage() {
    const messageInput = document.getElementById("userMessage");
    const sendBtn = document.getElementById("sendBtn");
    const message = messageInput.value.trim();
    
    if (message) {
        messageInput.disabled = true;
        sendBtn.disabled = true;
        sendBtn.classList.add('loading-btn');
        sendBtn.innerHTML = '<div class="loading"></div>';
        
        // Hiển thị tin nhắn người dùng
        appendUserMessage(message);
        messageInput.value = "";
        
        try {
            const response = await fetch("http://localhost:3000/api/chat/ask", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ message }),
            });

            const data = await response.json();
            // Đợi cho typing effect hoàn thành
            await appendAIMessage(data.response);
        } catch (error) {
            console.error("Lỗi:", error);
            appendErrorMessage("Có lỗi xảy ra khi gửi tin nhắn");
        } finally {
            // Restore button state sau khi typing effect hoàn thành
            sendBtn.disabled = false;
            sendBtn.classList.remove('loading-btn');
            sendBtn.innerHTML = 'Gửi';
            messageInput.disabled = false;
            messageInput.focus();
        }
    }
}

function appendUserMessage(text) {
    const container = document.createElement("div");
    container.className = "message-container user-container message-animation";
    
    const messageBubble = document.createElement("div");
    messageBubble.className = "message-bubble user-message";
    messageBubble.textContent = text;
    
    const avatar = document.createElement("img");
    avatar.className = "avatar";
    avatar.src = USER_AVATAR;
    avatar.alt = "User";
    
    container.appendChild(messageBubble);
    container.appendChild(avatar);
    
    document.getElementById("messages").appendChild(container);
    scrollToBottom();
}

async function appendAIMessage(text) {
    return new Promise((resolve) => {
        const container = document.createElement("div");
        container.className = "message-container ai-container message-animation";
        
        const avatar = document.createElement("img");
        avatar.className = "avatar";
        avatar.src = AI_AVATAR;
        avatar.alt = "AI";
        
        const messageBubble = document.createElement("div");
        messageBubble.className = "message-bubble ai-message";
        
        container.appendChild(avatar);
        container.appendChild(messageBubble);
        
        document.getElementById("messages").appendChild(container);
        
        let currentText = "";
        let i = 0;
        
        const typeNextChar = () => {
            if (i < text.length) {
                currentText += text[i];
                messageBubble.textContent = currentText;
                scrollToBottom();
                i++;
                setTimeout(typeNextChar, 30);
            } else {
                resolve(); // Hoàn thành typing effect
            }
        };
        
        typeNextChar();
    });
}

function appendErrorMessage(text) {
    const errorMessage = document.createElement("div");
    errorMessage.className = "error-message message-animation";
    errorMessage.textContent = text;
    document.getElementById("messages").appendChild(errorMessage);
    scrollToBottom();
}

function scrollToBottom() {
    const messagesDiv = document.getElementById("messages");
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}
