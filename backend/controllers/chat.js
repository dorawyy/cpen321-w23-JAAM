const Message = require('../models/message');
const express = require("express");
const {MongoClient} = require("mongodb");
var admin = require("firebase-admin");

const app = express();

let wsServer; 

exports.initWebSocket = (webSocketServer) => {
  wsServer = webSocketServer;
};

// Send a message
exports.sendMessage = async (req, res) => {
  try {
    const { text, senderEmail, receiverEmail } = req.body;

    console.log("receiverEmail " + receiverEmail)

    const receiverDetails = await getUserDetails(receiverEmail);

    if (!receiverDetails) {
      return res.status(400).json({ error: 'Receiver not found' });
    }

    const newMessage = new Message({
      text,
      senderEmail,
      receiverEmail,
      timestamp: new Date(),
    });

    await newMessage.save();

    if (wsServer) {
      const messageToSend = {
        type: 'message',
        text,
        senderEmail,
        receiverEmail,
        timestamp: newMessage.timestamp,
      };

      wsServer.broadcast(JSON.stringify(messageToSend));
    }

    // Send a push notification to the receiver
    const payload = {
      notification: {
        title: 'New Chat Message',
        body: `${senderEmail}: ${text}`,
      },
    };

    // Send the notification to the receiver's FCM token
    await admin.messaging().sendToDevice(receiverDetails.fcmToken, payload);

    res.status(201).json({ message: 'Message sent successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Message could not be sent' });
  }
};

async function getUserDetails(userIdentifier) {
  const uri = 'mongodb://127.0.0.1:27017';
  const client = new MongoClient(uri);

  try {
    await client.connect();

    const db = client.db('userDB'); 
    const collection = db.collection('userInfo');

    // Query the database to find user details based on userIdentifier
    const user = await collection.findOne({ email: userIdentifier });

    if (user) {
      return {
        email: user.email,
        fcmToken: user.deviceToken,
      };
    } else {
      console.log("User not found")
      return null;
    }
  } catch (error) {
    console.error('Error retrieving user details:', error);
    return null;
  } finally {
    await client.close();
  }
}  

// Get chat history
exports.getChatHistory = async (req, res) => {
  try {
    const senderEmail = req.query.senderEmail;
    const receiverEmail = req.query.receiverEmail;

    console.log(senderEmail)
    console.log(receiverEmail)

    // Use senderEmail and receiverEmail to filter the chat history
    const chatHistory = await Message.find({ senderEmail, receiverEmail }).sort({ timestamp: 1 });

    res.status(200).json(chatHistory);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Chat history could not be retrieved' });
  }
};

  