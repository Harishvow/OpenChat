const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const cors = require('cors');
const chatLink = require('./routes/chatLink');
const Socketchat = require('./sockets/Socketchat');

const app=express();
const server=http.createServer(app);
const io=new Server(server,{
  cors: {
        origin: "*"
    }}
);
app.use(cors());
app.use(express.static(path.join(__dirname, '../frontend')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/Openchat.html'));
});

app.use('/', chatLink);
Socketchat(io);

server.listen(5008,()=>{
    console.log('server is connected on port 5008')
})