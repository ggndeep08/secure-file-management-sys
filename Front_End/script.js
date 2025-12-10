
let users = {};
let storedFiles = [];
let loggedInUser = "", pendingUser = "", pendingOtp = "";

const ENCRYPTION_KEY = "SecureKey2025";
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_FILENAME_LENGTH = 255;
const MALICIOUS_EXTENSIONS = ["exe","bat","cmd","sh","js","vbs","msi"];

function showSignup() {
    document.getElementById("signup").classList.remove("hidden");
    document.getElementById("login").classList.add("hidden");
    document.getElementById("otpSection").classList.add("hidden");
}

function showLogin() {
    document.getElementById("login").classList.remove("hidden");
    document.getElementById("signup").classList.add("hidden");
    document.getElementById("otpSection").classList.add("hidden");
}
function signup() {
    const u = document.getElementById("newUsername").value.trim();
    const p = document.getElementById("newPassword").value;

    if (!u || !p) return alert("Fill all fields");

    const passwordHash = CryptoJS.SHA256(p).toString();

    fetch("http://localhost:3000/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: u, passwordHash })
    })
    .then(res => res.json())
    .then(data => {
        if (data.message === "Signup successful") {
            alert("Signup successful. Now login.");
            document.getElementById("newUsername").value = "";
            document.getElementById("newPassword").value = "";
            showLogin();
        } else {
            alert(data.message || "Signup failed");
        }
    })
    .catch(err => {
        console.error(err);
        alert("Error contacting server");
    });
}

function authenticate() {
    const u = document.getElementById("username").value.trim();
    const p = document.getElementById("password").value;

    if (!u || !p) {
        alert("Fill all fields");
        return;
    }

    // Hash on frontend (same as in signup)
    const passwordHash = CryptoJS.SHA256(p).toString();

    fetch("http://localhost:3000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: u, passwordHash })
    })
    .then(async res => {
        const data = await res.json();
        if (res.status !== 200) {
            // backend already sends messages like "Wrong password", "Blocked for 1 minute", etc.
            alert(data.message || "Login failed");
            return;
        }

        // ✅ Login OK – now do your OTP step like before
        pendingUser = u;
        pendingOtp = (Math.random() * 900000 + 100000 | 0).toString();

        document.getElementById("demoOtp").innerText = pendingOtp;
        document.getElementById("login").classList.add("hidden");
        document.getElementById("otpSection").classList.remove("hidden");
    })
    .catch(err => {
        console.error(err);
        alert("Error contacting server");
    });
}

function verifyOtp() {
    if (document.getElementById("otpInput").value === pendingOtp) {
        loggedInUser = pendingUser;
        document.getElementById("auth").classList.remove("hidden");
        document.getElementById("otpSection").classList.add("hidden");
        document.getElementById("userDisplay").innerText = loggedInUser;

        // Show admin section only if user is "admin"
        if (loggedInUser === "admin") {
            document.getElementById("adminSection").classList.remove("hidden");
        } else {
            document.getElementById("adminSection").classList.add("hidden");
        }

        loadStoredFiles();
    } else {
        alert("Invalid OTP");
    }
}


function logout() {
    loggedInUser = "";
    document.getElementById("auth").classList.add("hidden");
    showLogin();
}
function encryptFiles() {
    const files = document.getElementById("fileInput").files;
    if (!loggedInUser) {
        alert("Please login first.");
        return;
    }

    for (let file of files) {
        if (file.size > MAX_FILE_SIZE) {
            alert("Large file blocked: " + file.name);
            continue;
        }

        if (file.name.length > MAX_FILENAME_LENGTH) {
            alert("File name too long: " + file.name);
            continue;
        }

        const ext = file.name.includes(".") ? file.name.split(".").pop().toLowerCase() : "";
        if (MALICIOUS_EXTENSIONS.includes(ext)) {
            alert("Potential malware blocked based on extension: " + file.name);
            continue;
        }

        const reader = new FileReader();
        reader.onload = e => {
            const encrypted = CryptoJS.AES.encrypt(e.target.result, ENCRYPTION_KEY).toString();

            const fileObj = {
                id: Date.now() + Math.floor(Math.random() * 100000),
                owner: loggedInUser,
                name: file.name,
                type: file.type || "application/octet-stream",
                size: file.size,
                uploadTime: new Date().toISOString(),
                data: encrypted
            };

            // 🔁 Send to backend instead of localStorage
            fetch("http://localhost:3000/api/files", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(fileObj)
            })
            .then(res => res.json())
            .then(data => {
                // After saving on backend, reload list
                loadStoredFiles();
            })
            .catch(err => {
                console.error(err);
                alert("Error saving file");
            });
        };
        reader.readAsDataURL(file);
    }
}
function loadStoredFiles() {
    if (!loggedInUser) return;

    // Clear current list
    document.getElementById("imageList").innerHTML = "";
    document.getElementById("documentList").innerHTML = "";
    document.getElementById("otherList").innerHTML = "";

    fetch(`http://localhost:3000/api/files/${loggedInUser}`)
        .then(res => res.json())
        .then(files => {
            storedFiles = files; // keep in memory for download/delete

            files.forEach(file => {
                let li = document.createElement("li");
                const isOwner = file.owner === loggedInUser;
                const sharedLabel = !isOwner ? ` <em>(shared by ${file.owner})</em>` : "";

                li.innerHTML = `
                ${file.name}${sharedLabel}
                <button class="small-btn" onclick="downloadFile(${file.id})">Download</button>
                <button class="small-btn" onclick="showMetadata(${file.id})">Metadata</button>
                ${isOwner ? `<button class="small-btn" onclick="shareFile(${file.id})">Share</button>` : ""}
                ${isOwner ? `<button class="small-btn" onclick="deleteFile(${file.id})">Delete</button>` : ""}
                `;

                if (file.type.startsWith("image")) {
                    document.getElementById("imageList").appendChild(li);
                } else if (file.type.includes("pdf") || file.type.includes("document") || file.type.includes("msword")) {
                    document.getElementById("documentList").appendChild(li);
                } else {
                    document.getElementById("otherList").appendChild(li);
                }
            });
        })
        .catch(err => {
            console.error(err);
            alert("Error loading files");
        });
}


function downloadFile(id) {
    const file = storedFiles.find(f => f.id === id);
    if (!file) return;

    if (!(file.owner === loggedInUser || file.sharedWith?.includes(loggedInUser))) {
        alert("Access denied");
        return;
    }

    const decrypted = CryptoJS.AES.decrypt(file.data, ENCRYPTION_KEY).toString(CryptoJS.enc.Utf8);
    const a = document.createElement("a");
    a.href = decrypted;
    a.download = file.name;
    a.click();
}


function deleteFile(id) {
    const file = storedFiles.find(f => f.id === id);
    if (!file) {
        alert("File not found");
        return;
    }

    if (file.owner !== loggedInUser) {
        alert("You are not allowed to delete this file.");
        return;
    }

    if (!confirm("Delete file: " + file.name + " ?")) return;

    fetch(`http://localhost:3000/api/files/${id}`, {
        method: "DELETE"
    })
    .then(res => res.json())
    .then(data => {
        // Reload list after deletion
        loadStoredFiles();
    })
    .catch(err => {
        console.error(err);
        alert("Error deleting file");
    });
}


function showMetadata(fileId) {
    const file = storedFiles.find(f => f.id === fileId);
    if (!file) return;

    if (!(file.owner === loggedInUser || file.sharedWith.includes(loggedInUser))) {
        alert("Access denied");
        return;
    }

    const metadataText =
        "File Name: " + file.name + "\n" +
        "Type: " + file.type + "\n" +
        "Size: " + file.size + " bytes\n" +
        "Owner: " + file.owner + "\n" +
        "Uploaded At: " + file.uploadTime;

    alert(metadataText);
}

function viewLogs() {
    if (loggedInUser !== "admin") {
        alert("Access denied. Admins only.");
        return;
    }

    fetch("http://localhost:3000/api/logs")
        .then(res => res.json())
        .then(logs => {
            if (!Array.isArray(logs)) {
                document.getElementById("logsOutput").innerText = "No logs available.";
                return;
            }

            // Format logs nicely
            const text = logs
                .map(log => `[${log.time}] (${log.username}) ${log.action} - ${log.details}`)
                .join("\n");

            document.getElementById("logsOutput").innerText = text || "No logs yet.";
        })
        .catch(err => {
            console.error(err);
            document.getElementById("logsOutput").innerText = "Error loading logs.";
        });
}

function shareFile(id) {
    const file = storedFiles.find(f => f.id === id);
    if (!file) {
        alert("File not found");
        return;
    }

    if (file.owner !== loggedInUser) {
        alert("Only the owner can share this file.");
        return;
    }

    const targetUser = prompt("Enter the username to share with:");
    if (!targetUser) {
        return; // user cancelled or empty
    }

    fetch("http://localhost:3000/api/files/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            fileId: file.id,
            owner: loggedInUser,
            targetUser: targetUser.trim()
        })
    })
    .then(res => res.json())
    .then(data => {
        alert(data.message || "Share request completed");
        // Optionally reload files if you want updated sharedWith info
        loadStoredFiles();
    })
    .catch(err => {
        console.error(err);
        alert("Error sharing file");
    });
}


showLogin();

