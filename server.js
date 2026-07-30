const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

app.use(express.static('public'));

// Menyimpan riwayat pesan di server
const chatHistory = [];

io.on('connection', (socket) => {
  const username = 'User-' + Math.floor(Math.random() * 1000);

  // 1. Kirim semua riwayat pesan yang ada khusus ke pengguna yang baru terhubung/refresh
  socket.emit('load history', chatHistory);

  // Notifikasi sistem
  io.emit('chat message', {
    user: 'System',
    text: `${username} bergabung`
  });

  // 2. Menerima pesan baru dari pengguna
  socket.on('chat message', (data) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const messageData = {
      user: username,
      text: data.text,
      senderId: data.senderId, // ID unik pengguna dari browser
      time: time
    };

    // Simpan ke riwayat (maksimal 50 pesan terakhir)
    chatHistory.push(messageData);
    if (chatHistory.length > 100) {
      chatHistory.shift(); // Hapus pesan paling lama jika sudah lebih dari 50
    }

    // Kirim pesan ke semua orang
    io.emit('chat message', messageData);
  });

  socket.on('disconnect', () => {
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
