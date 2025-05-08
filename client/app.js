// Avatar URL - có thể thay đổi thành bất kỳ ảnh nào
const AI_AVATAR = "https://cdn-icons-png.flaticon.com/512/4616/4616734.png";
const USER_AVATAR = "https://cdn-icons-png.flaticon.com/512/1077/1077114.png";

document.getElementById("sendBtn").addEventListener("click", sendMessage);
document.getElementById("userMessage").addEventListener("keydown", function(e) {
    // Enter để gửi tin nhắn, nhưng Shift+Enter để xuống dòng
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault(); // Ngăn xuống dòng mặc định
        sendMessage();
    }
});

// Tự động điều chỉnh chiều cao của textarea khi gõ
document.getElementById("userMessage").addEventListener("input", function() {
    this.style.height = "auto";
    this.style.height = (this.scrollHeight < 150) ? this.scrollHeight + "px" : "150px";
});

async function sendMessage() {
    const messageInput = document.getElementById("userMessage");
    const sendBtn = document.getElementById("sendBtn");
    const message = messageInput.value.trim();
    
    if (message) {
        messageInput.disabled = true;
        sendBtn.disabled = true;
        sendBtn.classList.add('loading-btn');
        // HTML đơn giản hơn cho hiệu ứng loading
        sendBtn.innerHTML = '<span class="loading-dots"><span>.</span><span>.</span></span>';
        
        // Hiển thị tin nhắn người dùng
        appendUserMessage(message);
        messageInput.value = "";
        messageInput.style.height = "56px";
        
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

// Hàm xử lý định dạng tin nhắn để hiển thị đúng xuống dòng từ người dùng
function formatUserMessage(text) {
    return text.replace(/\n/g, '<br>');
}

function appendUserMessage(text) {
    const container = document.createElement("div");
    container.className = "message-container user-container message-animation";
    
    const messageBubble = document.createElement("div");
    messageBubble.className = "message-bubble user-message";
    messageBubble.innerHTML = formatUserMessage(text); // Dùng innerHTML để hiển thị xuống dòng
    
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
        
        // Xử lý text và chia thành từng phần để hiển thị mượt mà
        const parts = splitContentIntoParts(text);
        let visibleParts = [];
        let currentIndex = 0;
        
        const typeNextPart = () => {
            if (currentIndex < parts.length) {
                visibleParts.push(parts[currentIndex]);
                // Kết hợp lại các phần và định dạng
                messageBubble.innerHTML = formatMessageParts(visibleParts);
                
                // Chỉ tự động scroll nếu người dùng đang ở cuối chat
                const messagesDiv = document.getElementById("messages");
                const isAtBottom = messagesDiv.scrollHeight - messagesDiv.clientHeight <= messagesDiv.scrollTop + 50;
                if (isAtBottom) {
                    scrollToBottom();
                }
                
                currentIndex++;
                
                // Tính toán thời gian chờ dựa trên độ dài của phần tiếp theo
                const delay = (parts[currentIndex-1].type === 'text') ? 
                    Math.min(20 * parts[currentIndex-1].content.length, 100) : 10;
                
                setTimeout(typeNextPart, delay);
            } else {
                resolve(); // Hoàn thành typing effect
            }
        };
        
        typeNextPart();
    });
}

// Hàm chia nội dung thành các phần để hiển thị
function splitContentIntoParts(text) {
    // Tiền xử lý
    const processedText = text.replace(/\*\*/g, '<strong>').replace(/\\n/g, '<br>');
    
    // Tạo cấu trúc HTML từ text đã xử lý
    const formattedText = formatMessage(processedText);
    
    // Phân tích HTML để tách các thẻ và text
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = formattedText;
    
    // Kết quả là mảng các phần: text hoặc thẻ HTML
    const parts = [];
    
    // Hàm đệ quy để xử lý các node
    function processNode(node) {
        if (node.nodeType === 3) { // Text node
            // Chia text thành từng từ để hiển thị mượt mà
            const words = node.textContent.split(/(\s+)/);
            words.forEach(word => {
                if (word.trim() !== '') {
                    parts.push({ type: 'text', content: word });
                } else if (word !== '') {
                    parts.push({ type: 'text', content: word });
                }
            });
        } else if (node.nodeType === 1) { // Element node
            // Lưu thẻ mở
            parts.push({ type: 'tagOpen', tag: node.nodeName.toLowerCase(), attrs: getAttributes(node) });
            
            // Xử lý các node con
            Array.from(node.childNodes).forEach(child => processNode(child));
            
            // Lưu thẻ đóng
            parts.push({ type: 'tagClose', tag: node.nodeName.toLowerCase() });
        }
    }
    
    // Lấy các thuộc tính của node
    function getAttributes(node) {
        const attrs = {};
        Array.from(node.attributes || []).forEach(attr => {
            attrs[attr.name] = attr.value;
        });
        return attrs;
    }
    
    // Bắt đầu xử lý từ các node gốc
    Array.from(tempDiv.childNodes).forEach(node => {
        processNode(node);
    });
    
    return parts;
}

// Hàm kết hợp các phần đã xử lý thành HTML
function formatMessageParts(parts) {
    let html = '';
    
    parts.forEach(part => {
        if (part.type === 'text') {
            html += part.content;
        } else if (part.type === 'tagOpen') {
            html += `<${part.tag}`;
            // Thêm các thuộc tính
            for (const [name, value] of Object.entries(part.attrs || {})) {
                html += ` ${name}="${value}"`;
            }
            html += '>';
        } else if (part.type === 'tagClose') {
            html += `</${part.tag}>`;
        }
    });
    
    return html;
}

// Hàm xử lý định dạng tin nhắn
function formatMessage(text) {
    // Xử lý tiêu đề và đoạn văn
    let formattedText = text;
    
    // Thay thế các ký tự xuống dòng
    formattedText = formattedText.replace(/\\n/g, '<br>');
    formattedText = formattedText.replace(/\n/g, '<br>');
    
    // Xử lý định dạng đậm (text giữa hai dấu **)
    formattedText = formattedText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Xử lý danh sách có dấu •
    formattedText = formattedText.replace(/• (.*?)(?=<br>|$)/g, '<li>$1</li>');
    
    // Xử lý danh sách có dấu *
    formattedText = formattedText.replace(/\* (.*?)(?=<br>|$)/g, '<li>$1</li>');
    
    // Tạo đoạn văn cho các khối text
    formattedText = formattedText.replace(/(.*?)(<br><br>|<li>|$)/g, function(match, p1, p2) {
        if (p1 && !p1.includes('<li>') && !p1.includes('</li>') && p1.trim() !== '') {
            return '<p>' + p1 + '</p>' + p2;
        }
        return match;
    });
    
    // Bọc các thẻ li trong ul
    if (formattedText.includes('<li>')) {
        // Tìm tất cả các nhóm li liên tiếp
        formattedText = formattedText.replace(/(<li>.*?<\/li>)+/g, function(match) {
            return '<ul>' + match + '</ul>';
        });
    }
    
    // Làm sạch các thẻ p rỗng
    formattedText = formattedText.replace(/<p><\/p>/g, '');
    
    // Làm sạch các br dư thừa
    formattedText = formattedText.replace(/<br><br>/g, '<br>');
    
    return formattedText;
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
