/**
 * AgriVision Farmer Chatbot
 * Floating chat widget powered by Groq LLM via /chat API
 */

(function () {
    const SUGGESTIONS = [
        "Why are my tomato leaves turning yellow?",
        "How do I apply for PMFBY insurance?",
        "What causes white spots on pepper leaves?",
        "How much payout will I get for 60% damage?",
        "Best fertilizer for wheat crops?",
        "How to prevent fungal disease in crops?",
    ];

    let chatHistory = [];
    let isOpen = false;
    let isTyping = false;

    // ── Build widget HTML ──────────────────────────────────────────────
    function buildWidget() {
        const widget = document.createElement("div");
        widget.id = "agribot-widget";
        widget.innerHTML = `
            <!-- Toggle Button -->
            <button class="agribot-toggle" id="agribot-toggle" onclick="AgriBot.toggle()" aria-label="Open AgriBot">
                <span class="agribot-toggle-icon" id="agribot-toggle-icon">🌾</span>
                <span class="agribot-badge" id="agribot-badge">1</span>
            </button>

            <!-- Chat Panel -->
            <div class="agribot-panel" id="agribot-panel">
                <!-- Header -->
                <div class="agribot-header">
                    <div class="agribot-header-info">
                        <div class="agribot-avatar">🤖</div>
                        <div>
                            <div class="agribot-name">AgriBot</div>
                            <div class="agribot-status"><span class="agribot-dot"></span> Online</div>
                        </div>
                    </div>
                    <button class="agribot-close" onclick="AgriBot.toggle()">✕</button>
                </div>

                <!-- Messages -->
                <div class="agribot-messages" id="agribot-messages">
                    <div class="agribot-msg bot">
                        <div class="agribot-bubble">
                            👋 Hi! I'm <strong>AgriBot</strong>, your farming assistant.<br><br>
                            Ask me about crop diseases, PMFBY insurance, treatments, or farming tips!
                        </div>
                    </div>
                    <div class="agribot-suggestions" id="agribot-suggestions">
                        ${SUGGESTIONS.map(s => `<button class="agribot-chip" onclick="AgriBot.sendSuggestion('${s}')">${s}</button>`).join("")}
                    </div>
                </div>

                <!-- Input -->
                <div class="agribot-input-row">
                    <input
                        type="text"
                        id="agribot-input"
                        class="agribot-input"
                        placeholder="Ask about your crops..."
                        onkeydown="if(event.key==='Enter') AgriBot.send()"
                        autocomplete="off"
                    >
                    <button class="agribot-send" onclick="AgriBot.send()" id="agribot-send-btn">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="22" y1="2" x2="11" y2="13"></line>
                            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                        </svg>
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(widget);
    }

    // ── Toggle open/close ──────────────────────────────────────────────
    function toggle() {
        isOpen = !isOpen;
        const panel = document.getElementById("agribot-panel");
        const icon  = document.getElementById("agribot-toggle-icon");
        const badge = document.getElementById("agribot-badge");

        panel.classList.toggle("open", isOpen);
        icon.textContent = isOpen ? "✕" : "🌾";
        badge.style.display = "none";

        if (isOpen) {
            setTimeout(() => document.getElementById("agribot-input").focus(), 300);
        }
    }

    // ── Send message ───────────────────────────────────────────────────
    async function send() {
        if (isTyping) return;
        const input = document.getElementById("agribot-input");
        const text  = input.value.trim();
        if (!text) return;

        input.value = "";
        appendMessage("user", text);
        chatHistory.push({ role: "user", content: text });

        // Hide suggestions after first message
        const sugg = document.getElementById("agribot-suggestions");
        if (sugg) sugg.style.display = "none";

        showTyping();

        try {
            const res = await fetch("/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: text, history: chatHistory })
            });
            const data = await res.json();
            hideTyping();

            const reply = data.reply || data.error || "Sorry, I couldn't get a response.";
            appendMessage("bot", reply);
            chatHistory.push({ role: "assistant", content: reply });

        } catch (err) {
            hideTyping();
            appendMessage("bot", "⚠️ Connection error. Please check your internet and try again.");
        }
    }

    function sendSuggestion(text) {
        document.getElementById("agribot-input").value = text;
        send();
    }

    // ── Render helpers ─────────────────────────────────────────────────
    function appendMessage(role, text) {
        const container = document.getElementById("agribot-messages");
        const div = document.createElement("div");
        div.className = `agribot-msg ${role}`;

        // Convert markdown-style **bold** and bullet points
        const formatted = text
            .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
            .replace(/\n- /g, "<br>• ")
            .replace(/\n\n/g, "<br><br>")
            .replace(/\n/g, "<br>");

        div.innerHTML = `<div class="agribot-bubble">${formatted}</div>`;
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
    }

    function showTyping() {
        isTyping = true;
        document.getElementById("agribot-send-btn").disabled = true;
        const container = document.getElementById("agribot-messages");
        const div = document.createElement("div");
        div.className = "agribot-msg bot";
        div.id = "agribot-typing";
        div.innerHTML = `<div class="agribot-bubble agribot-typing-bubble">
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
        </div>`;
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
    }

    function hideTyping() {
        isTyping = false;
        document.getElementById("agribot-send-btn").disabled = false;
        const el = document.getElementById("agribot-typing");
        if (el) el.remove();
    }

    // ── Init ───────────────────────────────────────────────────────────
    window.AgriBot = { toggle, send, sendSuggestion };

    document.addEventListener("DOMContentLoaded", () => {
        // Only show on farmer portal
        const role = new URLSearchParams(window.location.search).get("role");
        if (role === "farmer") buildWidget();
    });
})();
