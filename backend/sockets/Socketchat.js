const pool = require('../config/db');

module.exports = (io) => {
    io.on('connection', (socket) => {
        console.log('Socket connected:', socket.id);

        socket.on('joinRoom', (chatId) => {
            socket.join(chatId);
            console.log(`Socket ${socket.id} joined room: ${chatId}`);
        });

        socket.on('sendMessage', async ({ chatId, message, sender }) => {
            console.log('sendMessage received:', { chatId, message, sender });

            try {
                await pool.query(
                    'INSERT INTO messages (chat_id, sender, message) VALUES ($1, $2, $3)',
                    [chatId, sender, message]
                );
                console.log('Message saved to DB');
            } catch (err) {
                console.error('DB insert failed:', err.message);
            }

            // Always emit the message to the room, even if DB save failed
            io.to(chatId).emit('receiveMessage', { message, sender });
            console.log('receiveMessage emitted to room:', chatId);
        });

        socket.on('disconnect', () => {
        });

    });
};