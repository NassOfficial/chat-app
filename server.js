const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  maxHttpBufferSize: 1e7,
  cors: { origin: "*", methods: ["GET", "POST"] }
});

app.use(express.static('public'));

const chatHistory = [];

io.on('connection', (socket) => {
  const username = 'User-' + Math.floor(Math.random() * 1000);

  // Kirim riwayat pesan saat terhubung
  socket.emit('load history', chatHistory);

  io.emit('chat message', {
    user: 'System',
    text: `${username} bergabung`
  });

  socket.on('chat message', (data) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const messageData = {
      user: username,
      text: data.text || '',
      image: data.image || null,
      audio: data.audio || null,
      file: data.file || null,
      fileName: data.fileName || null,
      senderId: data.senderId,
      time: time
    };

    chatHistory.push(messageData);
    if (chatHistory.length > 50) chatHistory.shift();

    io.emit('chat message', messageData);
  });

  // --- SIGNALING WEBRTC (TELEPON & VIDEO CALL) ---
  socket.on('call-user', (data) => {
    socket.broadcast.emit('call-made', {
      offer: data.offer,
      from: socket.id,
      user: username,
      callType: data.callType // 'video' atau 'voice'
    });
  });

  socket.on('make-answer', (data) => {
    io.to(data.to).emit('answer-made', {
      answer: data.answer,
      from: socket.id
    });
  });

  socket.on('ice-candidate', (data) => {
    io.to(data.to).emit('ice-candidate', {
      candidate: data.candidate,
      from: socket.id
    });
  });

  socket.on('reject-call', (data) => {
    io.to(data.to).emit('call-rejected');
  });

  socket.on('end-call', (data) => {
    if (data.to) {
      io.to(data.to).emit('call-ended');
    } else {
      socket.broadcast.emit('call-ended');
    }
  });

  socket.on('disconnect', () => {
    socket.broadcast.emit('call-ended');
    io.emit('chat message', {
      user: 'System',
      text: `${username} keluar`
    });
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server Chat berjalan di http://localhost:${PORT}`);
});
