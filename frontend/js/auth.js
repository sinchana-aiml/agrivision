const CREDENTIALS = {
    farmer:  { username: "farmer1",  password: "farm@123" },
    officer: { username: "officer1", password: "officer@123" }
};

const ROLE_HINTS = {
    farmer:  "Login as a registered farmer to submit crop damage claims.",
    officer: "Login as an administrative officer to audit and approve claims."
};

let currentRole = "farmer";

function switchRole(role) {
    currentRole = role;
    document.getElementById("btn-farmer").classList.toggle("active", role === "farmer");
    document.getElementById("btn-officer").classList.toggle("active", role === "officer");
    document.getElementById("role-hint").textContent = ROLE_HINTS[role];
    document.getElementById("login-error").style.display = "none";
    document.getElementById("login-form").reset();
}

function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;
    const creds    = CREDENTIALS[currentRole];
    const errorEl  = document.getElementById("login-error");

    if (username === creds.username && password === creds.password) {
        errorEl.style.display = "none";
        window.location.href = "/index.html?role=" + currentRole;
    } else {
        errorEl.style.display = "block";
    }
}
