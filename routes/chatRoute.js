const express = require("express");
const chatController = require('../controllers/chat');

const router = express.Router();

router.post('/send', chatController.sendMessage);
router.get('/history', chatController.getChatHistory);
//router.get('/lastMessage', chatController.getLastMessage);

module.exports = router;