const Message = require('../models/message');
const express = require("express");
var admin = require("firebase-admin");
const { getUserDetails } = require('../mockUserDB');
const mockUserDB = require('../mockUserDB');


// Send a message
exports.sendMessage = async (req, res) => {
  try {
    const { text, senderEmail, receiverEmail } = req.body;

    console.log("receiverEmail " + receiverEmail)

    // Hardcoded receiver email address
    //const receiverEmail = 'r@example.com';

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

    // You can handle FCM tokens here based on senderEmail and receiverDetails.fcmToken
    if (!receiverDetails.fcmToken) {
      return res.status(400).json({ error: 'FCM token is empty' });
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

// async function getUserDetails(userIdentifier) {
//   const uri = 'mongodb://127.0.0.1:27017'; // MongoDB connection URI
//   const client = new MongoClient(uri);

//   try {
//     await client.connect();

//     const db = client.db('userDB'); // Replace with your database name
//     const collection = db.collection('userInfo'); // Replace with your collection name

//     // Query the database to find user details based on userIdentifier
//     const user = await collection.findOne({ email: userIdentifier });

//     if (user) {
//       return {
//         email: user.email,
//         fcmToken: user.deviceToken,
//       };
//     } else {
//       console.log("User not found")
//       return null; // User not found
//     }
//   } catch (error) {
//     console.error('Error retrieving user details:', error);
//     return null; // Handle the error appropriately in your application
//   } finally {
//     await client.close();
//   }
// }
  

// Get chat history
// Get chat history for all entries in the database
exports.getChatHistory = async (req, res) => {
  try {
    const senderEmail = req.query.senderEmail;
    const receiverEmail = req.query.receiverEmail;

    console.log(senderEmail)
    console.log(receiverEmail)

    // Use senderEmail and receiverEmail to filter the chat history
    //const chatHistory = await Message.find({ senderEmail, receiverEmail }).sort({ timestamp: -1 }).limit(10);
    const chatHistory = await mockUserDB.getChatHistory({ senderEmail, receiverEmail });

    //chatHistory.reverse();

    res.status(200).json(chatHistory);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Chat history could not be retrieved' });
  }
};
