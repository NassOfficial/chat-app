const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

const messageHistory = [];

io.on('connection', (socket) => {
  // Kirim riwayat pesan ke user yang baru mampir
  socket.emit('load history', messageHistory);

  socket.on('chat message', (data) => {
    // FORMAT PESAN: Memastikan senderName & replyTo TIDAK HILANG
    const msgData = {
      id: Date.now(),
      senderId: data.senderId,
      senderName: data.senderName || 'Pengguna',
      user: data.senderName || 'Pengguna',
      text: data.text || '',
      image: data.image || null,
      audio: data.audio || null,
      file: data.file || null,
      fileName: data.fileName || '',
      replyTo: data.replyTo ? {
        user: data.replyTo.user || 'Pengguna',
        text: data.replyTo.text || '[Media]'
      } : null,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    messageHistory.push(msgData);
    if (messageHistory.length > 100) messageHistory.shift(); // Simpan max 100 pesan

    io.emit('chat message', msgData);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server berjalan di port ${PORT}`));
