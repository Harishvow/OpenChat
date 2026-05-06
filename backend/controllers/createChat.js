const generateChatId = require('../utils/generateChatId');
const pool = require('../config/db');
const path = require('path');
const { fetchMessages } = require('../sockets/FetchMessage');
const Socketchat = require('../sockets/Socketchat');

exports.createChat = async (req, res) => {
    try {
        const chatId = generateChatId();

        await pool.query(
            'INSERT INTO chats (id) VALUES ($1)',
            [chatId]
        );

        const baseUrl = `http://${req.get('host')}`;

        res.json({
            chatId,
            link: `${baseUrl}/chat/${chatId}`
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("Error");
    }
    
};
exports.loadChatPage = (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/index.html'));
};