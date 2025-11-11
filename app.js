const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const fs = require("fs/promises");
const fetch = require("node-fetch");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = 3000;

// Local text file path (for fallback)
const LOCAL_TEXT_FILE = path.join(__dirname, "data", "text.txt");

// Online text file URL
const REMOTE_TEXT_URL =
  "https://raw.githubusercontent.com/grp-chat/nodejs-chatgpt/refs/heads/main/data/text.txt";

// Keep latest text in memory
let latestText = "abc123";

// Serve static client files
app.use(express.static(path.join(__dirname, "client")));

// Function to read text from online source, fallback to local
async function getText() {
  try {
    const response = await fetch(REMOTE_TEXT_URL);
    if (!response.ok) throw new Error("Remote fetch failed");
    const text = await response.text();
    return text.trim() || "abc123";
  } catch (err) {
    try {
      const localData = await fs.readFile(LOCAL_TEXT_FILE, "utf8");
      return localData.trim() || "abc123";
    } catch {
      return "abc123";
    }
  }
}

// Function to save new text locally
async function saveText(text) {
  await fs.writeFile(LOCAL_TEXT_FILE, text, "utf8");
}

// Download endpoint — always serves the latest text in memory
app.get("/download", (req, res) => {
  res.setHeader("Content-Disposition", "attachment; filename=text.txt");
  res.setHeader("Content-Type", "text/plain");
  res.send(latestText);
});

io.on("connection", async (socket) => {
  console.log("Client connected:", socket.id);

  // Load initial text (if not loaded yet)
  if (!latestText || latestText === "abc123") {
    latestText = await getText();
  }

  // Send current text to new client
  socket.emit("updateText", latestText);

  // Handle text updates
  socket.on("newText", async (text) => {
    latestText = text;
    await saveText(text);
    io.emit("updateText", text); // broadcast to everyone
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
