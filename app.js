// app.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs').promises;

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const DATA_DIR = path.join(__dirname, 'data');
const TEXT_FILE = path.join(DATA_DIR, 'text.txt');
const DEFAULT_TEXT = 'abc123';
const PORT = process.env.PORT || 3000;

// Serve static files from /client
app.use(express.static(path.join(__dirname, 'client')));

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (err) {
    console.error('Failed to create data directory', err);
  }
}

// Read text file, fallback to default
async function readStoredText() {
  try {
    const data = await fs.readFile(TEXT_FILE, 'utf8');
    const trimmed = data.trim();
    return trimmed.length > 0 ? trimmed : DEFAULT_TEXT;
  } catch {
    return DEFAULT_TEXT;
  }
}

// Save new text
async function writeStoredText(text) {
  try {
    await ensureDataDir();
    await fs.writeFile(TEXT_FILE, text, 'utf8');
  } catch (err) {
    console.error('Error writing text file:', err);
  }
}

// Socket.IO setup
io.on('connection', async (socket) => {
  console.log('Client connected:', socket.id);

  const currentText = await readStoredText();
  socket.emit('currentText', currentText);

  socket.on('updateText', async (newText) => {
    const safeText = (newText ?? '').toString();
    await writeStoredText(safeText);
    io.emit('currentText', safeText.length > 0 ? safeText : DEFAULT_TEXT);
    console.log(`Text updated: ${safeText}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
