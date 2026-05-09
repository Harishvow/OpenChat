const express = require('express');
const router = express.Router();

const { createChat, loadChatPage } = require('../controllers/createChat');
const checkChat = require('../middleware/checkChatid');
const { getMessages } = require('../controllers/MessagePage');

router.get('/create-chatLink', createChat);
router.get('/chat/:chatId', checkChat, loadChatPage);
router.get('/api/messages/:chatId', getMessages);

module.exports = router;