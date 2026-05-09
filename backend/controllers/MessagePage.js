const pool = require('../config/db');

exports.getMessages = async (req, res) => {
    const chatId = req.params.chatId;
    console.log('🔥 getMessages called for chatId:', chatId);

    try {
        const result = await pool.query(
            'SELECT * FROM messages WHERE chat_id = $1 ORDER BY created_at',
            [chatId]
        );

        console.log(`✓ Found ${result.rows.length} messages for chat ${chatId}`);
        res.json(result.rows);

    } catch (err) {
        console.error('❌ getMessages error:', err.message);
        res.status(500).json({ error: err.message });
    }
};