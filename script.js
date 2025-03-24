const API_BASE = "http://localhost:5000"; // Update to your deployed URL
let token = localStorage.getItem("token");

if (!token) {
    window.location.href = "login.html"; // Redirect to login if not authenticated
}

// Set username
fetch(`${API_BASE}/user`, {
    headers: { "Authorization": `Bearer ${token}` }
}).then(res => res.json()).then(data => {
    document.getElementById("username").textContent = data.username;
});

// Sidebar navigation
document.querySelectorAll(".sidebar a").forEach(link => {
    link.addEventListener("click", (e) => {
        e.preventDefault();
        document.querySelectorAll(".sidebar a").forEach(a => a.classList.remove("active"));
        link.classList.add("active");
        document.querySelectorAll(".section").forEach(s => s.style.display = "none");
        document.getElementById(link.dataset.section).style.display = "block";
        if (link.dataset.section === "notes") loadNotes();
    });
});

// Recording controls
document.getElementById("start-recording").addEventListener("click", () => {
    fetch(`${API_BASE}/start`, { headers: { "Authorization": `Bearer ${token}` } })
        .then(res => res.text())
        .then(alert);
});

document.getElementById("stop-recording").addEventListener("click", () => {
    fetch(`${API_BASE}/stop`, { headers: { "Authorization": `Bearer ${token}` } })
        .then(res => res.blob())
        .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "notes.pdf";
            a.click();
        });
});

// Upload form
document.getElementById("upload-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("file", document.getElementById("audio-file").files[0]);
    fetch(`${API_BASE}/upload`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData
    }).then(res => res.blob()).then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "notes.pdf";
        a.click();
    });
});

// Load notes
function loadNotes() {
    fetch(`${API_BASE}/notes`, { headers: { "Authorization": `Bearer ${token}` } })
        .then(res => res.json())
        .then(notes => {
            document.getElementById("note-count").textContent = notes.length;
            const list = document.getElementById("notes-list");
            list.innerHTML = "";
            notes.forEach(note => {
                list.innerHTML += `
                    <div class="card">
                        <p><strong>${note.date}</strong>: ${note.transcript.slice(0, 50)}...</p>
                        <p>Summary: ${note.summary.slice(0, 50)}...</p>
                        <a href="${API_BASE}/download/${note.filename}">Download PDF</a>
                    </div>
                `;
            });
        });
}

// Logout
document.getElementById("logout").addEventListener("click", () => {
    localStorage.removeItem("token");
    window.location.href = "login.html";
});
