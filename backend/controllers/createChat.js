const generateChatId = require('../utils/generateChatId');
const pool = require('../config/db');
const path = require('path');

exports.createChat = async (req, res) => {
    try {
        const chatId = generateChatId();

        await pool.query(
            'INSERT INTO chats (id) VALUES ($1)',
            [chatId]
        );

        const baseUrl = `${req.protocol}://${req.get('host')}`;

        res.json({
            chatId,
            link: `${baseUrl}/chat/${chatId}`
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error creating chat" });
    }
};

exports.loadChatPage = (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/index.html'));
};