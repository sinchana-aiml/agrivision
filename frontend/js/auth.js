const CREDENTIALS = {
    farmer:  { username: "farmer1",  password: "farm@123" },
    officer: { username: "officer1", password: "officer@123" }
};

const ROLE_HINTS = {
    farmer:  "Login as a registered farmer to submit crop damage claims.",
    officer: "Login as an administrative officer to audit and approve claims."
};

let currentRole = "farmer";

// ── 1 & 2: Cycling speech bubble messages (hero section) ──────────────
const HERO_MESSAGES = [
    { emoji: "👋", text: "Welcome to AgriVision! Click Access Portal to get started." },
    { emoji: "🤖", text: "AI detects crop damage from a single leaf photo in seconds!" },
    { emoji: "📍", text: "GPS geotagging verifies your farm location automatically." },
    { emoji: "💰", text: "Get up to ₹50,000 payout under PMFBY scheme." },
    { emoji: "🌾", text: "Supports Tomato, Pepper & Wheat crop analysis." },
    { emoji: "🛡️", text: "100% PMFBY compliant — trusted by farmers across India." },
];

const ROLE_MESSAGES = {
    farmer:  { emoji: "👨🌾", text: "Welcome Farmer! Upload your crop photo to begin your claim." },
    officer: { emoji: "🧑💼", text: "Welcome Officer! Review and approve pending claims below." },
};

let bubbleIndex = 0;
let cycleTimer  = null;
let typeTimer   = null;

function typeText(el, text, onDone) {
    clearTimeout(typeTimer);
    el.innerHTML = "";
    let i = 0;
    const cursor = document.createElement("span");
    cursor.className = "bubble-cursor";
    el.appendChild(cursor);

    function tick() {
        if (i < text.length) {
            el.insertBefore(document.createTextNode(text[i]), cursor);
            i++;
            typeTimer = setTimeout(tick, 28);
        } else {
            cursor.remove();
            if (onDone) onDone();
        }
    }
    tick();
}

function showBubble(index) {
    const bubble   = document.getElementById("robot-bubble");
    const textEl   = document.getElementById("bubble-text");
    const emojiEl  = document.getElementById("bubble-emoji");
    if (!bubble || !textEl) return;

    const msg = HERO_MESSAGES[index % HERO_MESSAGES.length];
    emojiEl.textContent = msg.emoji;

    // pop-in re-trigger
    bubble.classList.remove("pop-in");
    void bubble.offsetWidth;
    bubble.classList.add("pop-in");

    typeText(textEl, msg.text);
}

function startCycle() {
    showBubble(bubbleIndex);
    cycleTimer = setInterval(() => {
        bubbleIndex = (bubbleIndex + 1) % HERO_MESSAGES.length;
        showBubble(bubbleIndex);
    }, 4000);
}

// ── 3: Scroll-triggered bubble change ─────────────────────────────────
function initScrollTrigger() {
    const loginSection = document.getElementById("login-section");
    if (!loginSection) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const textEl  = document.getElementById("bubble-text");
            const emojiEl = document.getElementById("bubble-emoji");
            const bubble  = document.getElementById("robot-bubble");
            if (!textEl) return;

            if (entry.isIntersecting) {
                // user scrolled to login — pause cycle, show scroll message
                clearInterval(cycleTimer);
                if (emojiEl) emojiEl.textContent = "👇";
                bubble.classList.remove("pop-in");
                void bubble.offsetWidth;
                bubble.classList.add("pop-in");
                typeText(textEl, "Scroll down and sign in to continue!");
            } else {
                // back to hero — resume cycle
                clearInterval(cycleTimer);
                startCycle();
            }
        });
    }, { threshold: 0.3 });

    observer.observe(loginSection);
}

// ── 4: Role-based robot reaction (login section strip) ────────────────
function updateLoginRobot(role) {
    const msgEl   = document.getElementById("login-robot-msg");
    const robotEl = document.getElementById("login-robot-avatar");
    if (!msgEl) return;

    const msg = ROLE_MESSAGES[role];
    msgEl.textContent = "";
    let i = 0;
    function tick() {
        if (i < msg.text.length) {
            msgEl.textContent += msg.text[i++];
            setTimeout(tick, 25);
        }
    }
    tick();

    // also update hero bubble instantly
    const emojiEl = document.getElementById("bubble-emoji");
    const textEl  = document.getElementById("bubble-text");
    if (emojiEl) emojiEl.textContent = msg.emoji;
    if (textEl)  typeText(textEl, msg.text);
}

// ── 5: Login success — robot waves ────────────────────────────────────
function robotWave(callback) {
    const robotEl = document.getElementById("login-robot-avatar");
    const msgEl   = document.getElementById("login-robot-msg");

    if (robotEl) {
        robotEl.classList.add("robot-waving");
        robotEl.textContent = "🤖";
        setTimeout(() => robotEl.classList.remove("robot-waving"), 900);
    }
    if (msgEl) {
        msgEl.textContent = "";
        let i = 0;
        const text = "Great! Logging you in... 🚀";
        function tick() {
            if (i < text.length) { msgEl.textContent += text[i++]; setTimeout(tick, 30); }
            else setTimeout(callback, 600);
        }
        tick();
    } else {
        setTimeout(callback, 800);
    }
}

// ── Core auth functions ────────────────────────────────────────────────
function switchRole(role) {
    currentRole = role;
    document.getElementById("btn-farmer").classList.toggle("active", role === "farmer");
    document.getElementById("btn-officer").classList.toggle("active", role === "officer");
    document.getElementById("role-hint").textContent = ROLE_HINTS[role];
    document.getElementById("login-error").style.display = "none";
    document.getElementById("login-form").reset();
    updateLoginRobot(role);
}

function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;
    const creds    = CREDENTIALS[currentRole];
    const errorEl  = document.getElementById("login-error");

    if (username === creds.username && password === creds.password) {
        errorEl.style.display = "none";
        // 5: wave then redirect
        robotWave(() => {
            window.location.href = "/index.html?role=" + currentRole;
        });
    } else {
        errorEl.style.display = "block";
        // robot reacts to wrong password
        const msgEl = document.getElementById("login-robot-msg");
        if (msgEl) msgEl.textContent = "Hmm, that doesn't look right. Try again! 🤔";
    }
}

// ── Init on page load ──────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
    startCycle();
    initScrollTrigger();
    updateLoginRobot("farmer");
});
