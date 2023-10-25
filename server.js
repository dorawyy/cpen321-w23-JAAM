const express = require("express");
const axios = require('axios');
const SocketServer = require('websocket').server;
const http = require('http');
const mongoose = require('mongoose');
const chatRoute = require('./routes/chatRoute');
const chatController = require('./controllers/chat');

const app = express();
app.use(express.json())

mongoose.connect('mongodb://127.0.0.1:27017/chatDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})


const server = http.createServer((req, res) => {});
wsServer = new SocketServer({ httpServer: server });
chatController.initWebSocket(wsServer);

app.use('/api/chat', chatRoute)

// Connection to Mongodb
const {MongoClient} = require("mongodb");
const uri = "mongodb://127.0.0.1:27017";
const client = new MongoClient(uri);


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