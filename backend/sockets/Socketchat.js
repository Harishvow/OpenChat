const pool = require('../config/db');

module.exports = (io) => {
    io.on('connection', (socket) => {

        socket.on('joinRoom', (chatId) => {
            socket.join(chatId);
        });

        socket.on('sendMessage', async ({ chatId, message, sender }) => {
            await pool.query(
                'INSERT INTO messages (chat_id, sender, message) VALUES ($1, $2, $3)',
                [chatId, sender, message]
            );

            io.to(chatId).emit('receiveMessage', { message, sender });
        });

        socket.on('disconnect', () => {
        });

    });
};