const pool = require("../config/db")

exports.fetchMessages = async (req, res) => {
    try {
        const chatId = req.params.chatId;

        const result = await pool.query(
            'SELECT * FROM messages WHERE chat_id = $1 ORDER BY created_at',
            [chatId]
        );

        res.json(result.rows);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error fetching messages" });
    }
};