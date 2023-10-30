const Message = require('../models/message');
const express = require("express");
var admin = require("firebase-admin");
// var serviceAccount = require('../chatcomponent321-firebase-adminsdk-d4mco-7f2d456053.json');
// admin.initializeApp({
// credential: admin.credential.cert(serviceAccount),
// databaseURL: ""
// });

const app = express();

let wsServer; 

exports.initWebSocket = (webSocketServer) => {
  wsServer = webSocketServer;
};

const userAFcmToken = 'fNgnfEh4RumbR4af-LLGkR:APA91bFb4pNSVMx80FugZSt8u4aLj4Z-LnlTSUC-xpFsqUO1gfLOVBhMElmbYiE76mC_ceyK7j8Db-HsxWrfS6BhW0YLRx3s4b7rwfCYjT537oDkQ69_T1Vm-zVhfWq99XZODm_sWeXO'; // Replace with the actual FCM token for user A
const userBFcmToken = 'cp899_0RTCGr6uodMLFCAQ:APA91bHTa7o3gnWzGQNFXU5Mq-LjH_q3GiiQBwCY71A3qRXaEPBswaCAx7HHKhEo9GnfKRSDQgSFgjhK-ng-fHnv0MMzD7idYxgW32-5NoH74w5sovYMhxpEkMN2O5vh3xCq4T36mBig';

// let currentSender = 'd.trump@example.com'; // Initially, set user A as the sender
// let currentReceiver = 'k.west@gmail.com'; // Initially, set user B as the receiver

// // Function to switch sender and receiver
// function switchRoles() {
//     if (currentSender === 'd.trump@example.com') {
//         currentSender = 'k.west@gmail.com';
//         currentReceiver = 'd.trump@example.com';
//     } else {
//         currentSender = 'd.trump@example.com';
//         currentReceiver = 'k.west@gmail.com';
//     }
// }

// Send a message
exports.sendMessage = async (req, res) => {
    try {
      const { text } = req.body;

      //const authHeader = req.headers['authorization'];
      
      const authHeader = req.headers.authorization;
      console.log(authHeader)
      //const userIdentifierBase64 = authHeader.split(' ')[1];
      //const userIdentifier = Buffer.from(authHeader, 'base64').toString('utf-8');
      const auth = new Buffer.from(authHeader.split(' ')[1],
        'base64').toString().split(':');
        const user = auth[0];


      const userAIdentifier = '789';
      const userBIdentifier = '963';

      const userAEmail = 'd.trump@example.com';
      const userBEmail = 'k.west@gmail.com';

      let senderEmail, receiverEmail;

        if (user === userAIdentifier) {
            senderEmail = userAEmail;
            receiverEmail = userBEmail;
        } else if (user === userBIdentifier) {
            senderEmail = userBEmail;
            receiverEmail = userAEmail;
        }

    //   const senderEmail = userIdentifier === userAIdentifier ? userAEmail : userBEmail;
    //   console.log(userIdentifier)
    //   const receiverEmail = userIdentifier === userAIdentifier ? userBEmail : userAEmail;

      console.log('User Identifier:', user);
        console.log('Sender Email:', senderEmail);
        console.log('Receiver Email:', receiverEmail);

      //const receiverEmail = senderEmail === userAEmail ? userBEmail : userAEmail;

      //currentSender = currentSender === 'd.trump@example.com' ? 'k.west@gmail.com' : 'd.trump@example.com';

      //const senderEmail = currentSender;

      //const receiverEmail = currentSender === 'd.trump@example.com' ? 'k.west@gmail.com' : 'd.trump@example.com';
      //const receiverEmail = senderEmail === 'd.trump@example.com' ? 'k.west@gmail.com' : 'd.trump@example.com';
  
      const newMessage = new Message({
        text,
        senderEmail, // Change this to senderID
        receiverEmail, // Change this to receiverID
        timestamp: new Date(),
      });
  
      await newMessage.save();
  
      if (wsServer) {
        const messageToSend = {
          type: 'message',
          text,
          senderEmail, // Change this to senderID
          receiverEmail, // Change this to receiverID
          timestamp: newMessage.timestamp,
        };
  
        wsServer.broadcast(JSON.stringify(messageToSend));
      }

      //switchRoles();

      let senderFcmToken, receiverFcmToken;

        if (user === '789') {
            senderFcmToken = userAFcmToken;
            receiverFcmToken = userBFcmToken;
            console.log("sender" + senderFcmToken)
        } else if (user === '963') {
            senderFcmToken = userBFcmToken;
            receiverFcmToken = userAFcmToken;
            console.log("sender" + senderFcmToken)
        }

      // Send a push notification to the receiver
      //const receiver = 'fNgnfEh4RumbR4af-LLGkR:APA91bFb4pNSVMx80FugZSt8u4aLj4Z-LnlTSUC-xpFsqUO1gfLOVBhMElmbYiE76mC_ceyK7j8Db-HsxWrfS6BhW0YLRx3s4b7rwfCYjT537oDkQ69_T1Vm-zVhfWq99XZODm_sWeXO'; // Replace with the actual FCM token of the receiver
      const payload = {
          notification: {
              title: 'New Chat Message',
              body: `${user}: ${text}`,
          },
      };

      await admin.messaging().sendToDevice(receiverFcmToken, payload);
      //const receiverToken = currentReceiver === 'd.trump@example.com' ? userAFcmToken : userBFcmToken;
      //await admin.messaging().sendToDevice(receiverToken, payload);
  
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
  