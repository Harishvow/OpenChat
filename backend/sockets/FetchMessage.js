const pool = require("../config/db")

exports.fetchMessages = async (req, res) => {
    try {
        const chatId = req.params.chatId;
        console.log('Fetching messages for chat:', chatId);

        const result = await pool.query(
            'SELECT * FROM messages WHERE chat_id = $1 ORDER BY created_at',
            [chatId]
        );

        console.log(`Found ${result.rows.length} messages`);
        res.json(result.rows);

    } catch (err) {
        console.error('fetchMessages error:', err.message);
        res.status(500).json({ message: err.message });
    }
};