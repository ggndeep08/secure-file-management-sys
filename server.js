// server.js
const fs = require("fs");
const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const PORT = 3000;

// Middlewares
app.use(cors());
app.use(bodyParser.json());

// Simple JSON "database"
const USERS_FILE = path.join(__dirname, "users.json");
const FILES_FILE = path.join(__dirname, "files.json");
const LOGS_FILE = path.join(__dirname, "logs.json");


// Helper to read/write JSON
function readJson(file) {
    if (!fs.existsSync(file)) return [];
    return JSON.parse(fs.readFileSync(file, "utf8") || "[]");
}

function writeJson(file, data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function logEvent(action, username, details = "") {
    const logs = readJson(LOGS_FILE);

    logs.push({
        time: new Date().toISOString(),
        action,          // e.g., "LOGIN_SUCCESS", "FILE_UPLOAD"
        username,        // the user performing the action (or "system")
        details          // any extra info like file name, reason, etc.
    });

    writeJson(LOGS_FILE, logs);
}


// --- AUTH ROUTES ---
app.post("/api/signup", (req, res) => {
    const { username, passwordHash } = req.body;

    if (!username || !passwordHash) {
        logEvent("SIGNUP_FAILED", username || "unknown", "Missing fields");
        return res.status(400).json({ message: "Missing fields" });
    }

    const users = readJson(USERS_FILE);
    if (users.find(u => u.username === username)) {
        logEvent("SIGNUP_FAILED", username, "User already exists");
        return res.status(400).json({ message: "User already exists" });
    }

    users.push({
        username,
        passwordHash,
        failedAttempts: 0,
        lockUntil: 0
    });

    writeJson(USERS_FILE, users);
    logEvent("SIGNUP_SUCCESS", username, "New account created");
    res.json({ message: "Signup successful" });
});

app.post("/api/login", (req, res) => {
    const { username, passwordHash } = req.body;
    const now = Date.now();

    let users = readJson(USERS_FILE);
    const user = users.find(u => u.username === username);

    if (!user) {
        logEvent("LOGIN_FAILED", username || "unknown", "User not found or wrong password");
        return res.status(400).json({ message: "Invalid username or password" });
    }

    if (user.lockUntil > now) {
        logEvent("LOGIN_BLOCKED", username, "Account temporarily blocked");
        return res.status(403).json({ message: "Account temporarily blocked" });
    }

    if (user.passwordHash !== passwordHash) {
        user.failedAttempts += 1;

        if (user.failedAttempts >= 3) {
            user.lockUntil = now + 60000; // 1 min
            user.failedAttempts = 0;
            writeJson(USERS_FILE, users);
            logEvent("LOGIN_BLOCKED", username, "Too many failed attempts");
            return res.status(403).json({ message: "Blocked for 1 minute" });
        }

        writeJson(USERS_FILE, users);
        logEvent("LOGIN_FAILED", username, "Wrong password");
        return res.status(400).json({ message: "Wrong password" });
    }

    // correct password
    user.failedAttempts = 0;
    user.lockUntil = 0;
    writeJson(USERS_FILE, users);

    logEvent("LOGIN_SUCCESS", username, "Password correct");
    res.json({ message: "Login OK" });
});


// --- FILE ROUTES ---

app.get("/api/files/:username", (req, res) => {
    const username = req.params.username;
    const files = readJson(FILES_FILE).filter(f => {
        // owner OR sharedWith contains this user
        return f.owner === username || (Array.isArray(f.sharedWith) && f.sharedWith.includes(username));
    });
    res.json(files);
});

app.post("/api/files", (req, res) => {
    const { id, owner, name, type, size, uploadTime, data } = req.body;

    if (!owner || !name || !data) {
        logEvent("FILE_UPLOAD_FAILED", owner || "unknown", "Missing file data");
        return res.status(400).json({ message: "Missing file data" });
    }

    const files = readJson(FILES_FILE);
    files.push({
        id,
        owner,
        name,
        type,
        size,
        uploadTime,
        data,
        sharedWith: []
    });

    writeJson(FILES_FILE, files);
    logEvent("FILE_UPLOAD", owner, `Uploaded file: ${name} (${size} bytes)`);
    res.json({ message: "File saved" });
});

app.delete("/api/files/:id", (req, res) => {
    const fileId = Number(req.params.id);
    let files = readJson(FILES_FILE);

    const file = files.find(f => f.id === fileId);
    if (!file) {
        logEvent("FILE_DELETE_FAILED", "unknown", `File id ${fileId} not found`);
        return res.status(404).json({ message: "File not found" });
    }

    // Optionally: we *could* check owner on backend if we pass username,
    // but you're already checking owner on frontend.

    files = files.filter(f => f.id !== fileId);
    writeJson(FILES_FILE, files);

    logEvent("FILE_DELETE", file.owner, `Deleted file: ${file.name}`);
    res.json({ message: "File deleted" });
});

// --- LOGS ROUTE (Admin) ---
app.get("/api/logs", (req, res) => {
    const logs = readJson(LOGS_FILE);
    // You could limit or sort here if you want
    res.json(logs);
});

app.post("/api/files/share", (req, res) => {
    const { fileId, owner, targetUser } = req.body;

    if (!fileId || !owner || !targetUser) {
        logEvent("FILE_SHARE_FAILED", owner || "unknown", "Missing fileId/owner/targetUser");
        return res.status(400).json({ message: "Missing data" });
    }

    // Check that targetUser exists
    const users = readJson(USERS_FILE);
    const userExists = users.find(u => u.username === targetUser);
    if (!userExists) {
        logEvent("FILE_SHARE_FAILED", owner, `Target user does not exist: ${targetUser}`);
        return res.status(404).json({ message: "Target user does not exist" });
    }

    let files = readJson(FILES_FILE);
    const file = files.find(f => f.id === fileId);

    if (!file) {
        logEvent("FILE_SHARE_FAILED", owner, `File id ${fileId} not found`);
        return res.status(404).json({ message: "File not found" });
    }

    if (file.owner !== owner) {
        logEvent("FILE_SHARE_FAILED", owner, `Not owner of file: ${file.name}`);
        return res.status(403).json({ message: "Only owner can share this file" });
    }

    if (!Array.isArray(file.sharedWith)) {
        file.sharedWith = [];
    }

    if (!file.sharedWith.includes(targetUser)) {
        file.sharedWith.push(targetUser);
        writeJson(FILES_FILE, files);
        logEvent("FILE_SHARE", owner, `Shared file "${file.name}" with ${targetUser}`);
    }

    res.json({ message: "File shared successfully" });
});



app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
