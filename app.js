const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { loadGame, saveGame } = require('./writeread');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname + '/client'));

io.on('connection', async (socket) => {
  console.log('A user connected');

  // Load game on new connection
  const currText = await loadGame();
  socket.emit('currentText', currText);

  socket.on('changeText', async (newText) => {
    console.log('Received changeText:', newText);

    // Notify all clients: save started → disable buttons
    io.emit('savingInProgress', true);

    const ok = await saveGame(newText);

    if (ok) {
      io.emit('currentText', newText);
    } else {
      socket.emit('errorMessage', 'Failed to save game on GitHub');
    }

    // Notify all clients: save finished → enable buttons
    io.emit('savingInProgress', false);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
