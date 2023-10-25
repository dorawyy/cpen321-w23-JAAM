const Message = require('../models/message');

let wsServer; 

exports.initWebSocket = (webSocketServer) => {
  wsServer = webSocketServer;
};

// Send a message
exports.sendMessage = async (req, res) => {
    try {
      const { text, senderID, receiverID } = req.body;
  
      const newMessage = new Message({
        text,
        senderID,
        receiverID,
        timestamp: new Date(),
      });
  
      await newMessage.save();
  
      if (wsServer) {
        const messageToSend = {
          type: 'message',
          text,
          senderID,
          receiverID,
          timestamp: newMessage.timestamp,
        };
  
        wsServer.broadcast(JSON.stringify(messageToSend));
      }
  
      res.status(201).json({ message: 'Message sent successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Message could not be sent' });
    }
  };
  

// Get chat history
exports.getChatHistory = async (req, res) => {
    try {
      const { senderID, receiverID } = req.query;
  
      const chatHistory = await Message.find({
        $or: [
          { senderID, receiverID },
          { senderID: receiverID, receiverID: senderID },
        ]
      }).sort({ timestamp: 1 });
  
      res.status(200).json(chatHistory);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Chat history could not be retrieved' });
    }
  };
  