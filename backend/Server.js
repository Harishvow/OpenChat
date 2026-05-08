const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const cors = require('cors');
const chatLink = require('./routes/chatLink');
const Socketchat = require('./sockets/Socketchat');
const pool = require('./config/db');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" }
});

app.use(cors());

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ status: 'ok', time: result.rows[0] });
  } catch (err) {
    res.status(500).json({ status: 'error', error: err.message });
  }
});

const distPath = path.join(__dirname, '../frontend/OpenChat/dist');

app.use(express.static(distPath));

app.get('/', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});
app.get('/chat/:chatId', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/chat.html'));
});
app.use('/', chatLink);

Socketchat(io);

const PORT = process.env.PORT || 5008;

server.listen(PORT, () => {
  console.log(`server running on ${PORT}`);
});