require('dotenv').config();
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
app.use(express.json());

const reactDist = path.join(__dirname, '../frontend/OpenChat/dist');
const chatHtml = path.join(__dirname, '../frontend/index.html');
app.use('/api', chatLink);

app.get('/chat/:chatId',(req,res)=>{
    res.sendFile(chatHtml);
})
app.use(express.static(reactDist));
app.get('/', (req, res) => {
  res.sendFile(path.join(reactDist, 'index.html'));
});
Socketchat(io);

const PORT = process.env.PORT || 5008;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});