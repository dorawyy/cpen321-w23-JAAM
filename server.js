const express = require("express");
const axios = require('axios');
const SocketServer = require('websocket').server;
const http = require('http');
const mongoose = require('mongoose');
const chatRoute = require('./routes/chatRoute');
const chatController = require('./controllers/chat');
const translinkRoute = require('./routes/translinkRoute');
const admin = require('firebase-admin');
const schedule = require('node-schedule');

const serviceAccount = require('./chatcomponent321-firebase-adminsdk-d4mco-7f2d456053.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const app = express();
app.use(express.json())

mongoose.connect('mongodb://127.0.0.1:27017/chatDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})

const apiKey = 'OBA0SkAnEMfAP64ZZVH5';

const server = http.createServer((req, res) => {});
wsServer = new SocketServer({ httpServer: server });
chatController.initWebSocket(wsServer);

app.use('/api/chat', chatRoute)
app.use('/api/translink', translinkRoute)

// Connection to Mongodb
const {MongoClient} = require("mongodb");
const uri = "mongodb://127.0.0.1:27017";
const client = new MongoClient(uri);

// var admin = require("firebase-admin");
// var serviceAccount = require('./chatcomponent321-firebase-adminsdk-d4mco-7f2d456053.json');
// admin.initializeApp({
// credential: admin.credential.cert(serviceAccount),
// databaseURL: ""
// });

app.get("/", (req, res) => {
    res.send("Hello World!")
})


app.post("/createUser", async (req, res) => {
  try {
      await client.connect()
      const db = client.db("userDB")
      const collection = db.collection("userInfo")

      const result = await collection.insertOne(req.body)
      console.log("User data inserted into database: ", result.insertedId)
      res.status(200).send("User data inserted into database")
  }
  catch (error) {
      console.error("Error inserting user data into database: ", error)
      res.status(500).send("error inserting user data into database")
  }
  finally {
      await client.close()
  }
})

// Broadcast method for WebSocket connections
wsServer.broadcast = (data) => {
  wsServer.connections.forEach((connection) => {
    if (connection.connected) {
      connection.send(data);
    }
  });
};


app.post("/addFriend", async (req, res) => {
  try {
    await client.connect();
    const db = client.db("userDB");
    const collection = db.collection("userInfo");

    const userEmail = req.body.userEmail; // Assuming you have userEmail in the request
    const friendEmail = req.body.friendEmail; // Assuming you have friendEmail in the request

    const userExists = await collection.findOne({ email: userEmail });

    if (userExists) {
      // Add friend to the user's FriendList
      const userFilter = { email: userEmail };
      const userUpdate = {
        $addToSet: { FriendsList: friendEmail },
      };

      const userResult = await collection.updateOne(userFilter, userUpdate);

      if (userResult.modifiedCount === 1) {
        console.log("Friend added to the user's FriendsList.");
      } else {
        console.log("Friend already added to the user's FriendsList.");
      }

      // Now add the user to the friend's FriendList
      const friendExists = await collection.findOne({ email: friendEmail });

      if (friendExists) {
        const friendFilter = { email: friendEmail };
        const friendUpdate = {
          $addToSet: { FriendsList: userEmail },
        };

        const friendResult = await collection.updateOne(friendFilter, friendUpdate);

        if (friendResult.modifiedCount === 1) {
          console.log("User added to the friend's FriendsList.");
        } else {
          console.log("User already added to the friend's FriendsList.");
        }
      } else {
        console.log("Friend not found in the database.");
      }

      res.status(200).send("Friend added to both FriendLists.");
    } else {
      console.log("User not found in the database.");
      res.status(404).send("User not found in the database.");
    }
  } catch (error) {
    console.error("Error adding friend: ", error);
    res.status(500).send("Error adding friend.");
  } finally {
    await client.close();
  }
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'))
db.once('open', () => {
  console.log('Connected to MongoDB database')
})

async function run(){
  try{
      await client.connect()
      console.log("Successfully connected to the database")
      var server = app.listen(8081, "0.0.0.0", (req, res) =>{
          var host = server.address().address
          var port = server.address().port
          console.log("Example server successfully running at http://%s:%s", host, port)
      })
  }
  catch(err){
      console.log(err)
      await client.close()
  }
}

run()