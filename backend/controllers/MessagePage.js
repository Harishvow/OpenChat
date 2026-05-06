const pool = require('../config/db');

exports.getMessages = async (req, res) => {
    const chatId = req.params.chatId;

    try {
        const result = await pool.query(
            'SELECT * FROM messages WHERE chat_id = $1 ORDER BY created_at',
            [chatId]
        );

        res.json(result.rows);

    } catch (err) {
        console.error(err);
        res.status(500).send("Error fetching messages");
    }
};