const pool = require('../config/db');

const checkChat = async (req, res, next) => {
    try {
        const chatId = req.params.chatId;

        const result = await pool.query(
            'SELECT * FROM chats WHERE id = $1',
            [chatId]
        );

        if (result.rows.length === 0) {
            return res.status(404).send("Invalid chat link");
        }

        next(); 

    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }
};

module.exports = checkChat;