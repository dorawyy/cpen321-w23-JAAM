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
const routeEngine = require('./engine/routeEngine');

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

app.get("/", (req, res) => {
    res.send("Hello World!")
})


app.post("/createUser", async (req, res) => {
  try {
    await client.connect()
    const db = client.db("userDB")
    const collection = db.collection("userInfo")

    // Check if the user already exists based on a unique identifier, such as an email
    const existingUser = await collection.findOne({ email: req.body.email });

    if (existingUser) {
      // If the user already exists, update their information
      const updateResult = await collection.updateOne(
        { email: req.body.email },
        { $set: req.body }
      );

      if (updateResult.modifiedCount > 0) {
        console.log("User data updated in the database: ", req.body);
        res.status(200).send("User data updated in the database");
      } else {
        console.log("User data not updated. No changes were made.");
        res.status(200).send("User data not updated. No changes were made.");
      }
    } else {
      // If the user doesn't exist, insert a new user record
      const result = await collection.insertOne(req.body);
      console.log("New user data inserted into the database: ", result.insertedId);
      res.status(200).send("New user data inserted into the database");
    }
  } catch (error) {
    console.error("Error inserting/updating user data into the database: ", error);
    res.status(500).send("Error inserting/updating user data into the database");
  } finally {
    await client.close();
  }
});


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

    const userEmail = req.body.userEmail;
    const friendEmail = req.body.friendEmail;

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


const data = [
  [
    {
      'Start': {
        'Stop': 'Northbound King George Blvd @ 60 Ave',
        'Lat': 49.112374,
        'Long': -122.840708,
        'Time': '22:30', // Example time in "HH:mm" format
        'Bus': '394'
      }
    },
    {
      'Start': {
        'Stop': 'Northbound King George Blvd @ 60 Ave',
        'Lat': 49.112374,
        'Long': -122.840708,
        'Time': '08:30', // Example time in "HH:mm" format
        'Bus': '394'
      }
    },
    // Other entries...
  ]
];

function getFormattedSubtractedTime(dataItem, subtractMinutes) {
  if (dataItem.Start && dataItem.Start.Time) {
    // Parse the input time into hours and minutes
    const [hours, minutes] = dataItem.Start.Time.split(':');
  
    // Convert hours and minutes to minutes and subtract the specified duration
    let totalMinutes = parseInt(hours, 10) * 60 + parseInt(minutes, 10);
    totalMinutes -= subtractMinutes;
  
    // Handle cases where the totalMinutes becomes negative
    if (totalMinutes < 0) {
      totalMinutes += 24 * 60; // Add a day's worth of minutes (1440 minutes) to handle crossing midnight
    }
  
    // Calculate the hours and minutes for the new time
    const newHours = Math.floor(totalMinutes / 60);
    const newMinutes = totalMinutes % 60;
  
    // Format the new time as HH:mm
    const hoursPart = newHours.toString().padStart(2, '0');
    const minutesPart = newMinutes.toString().padStart(2, '0');
    const formattedTime = `${hoursPart}:${minutesPart}`;
  
    return formattedTime;
  } else {
    console.error('Invalid data structure:', dataItem);
    return null; // Return null if the data structure is invalid
  }
}

const subtractedMinutes = 10;

app.post('/getFormattedSubtractedTime', (req, res) => {
  const eventData = req.body;
  const dataItem = data[0]; // Access the inner array directly

  if (dataItem && dataItem.length > 0) {
    const formattedSubtractedTimes = dataItem.map((item) => {
      if (item.Start && item.Start.Time) {
        const formattedSubtractedTime = getFormattedSubtractedTime(item, subtractedMinutes);
        return formattedSubtractedTime;
      }
      return null;
    });

    if (formattedSubtractedTimes.length > 0) {
      res.json({ times: formattedSubtractedTimes });
    } else {
      res.status(400).send('Invalid or missing data');
    }
  } else {
    res.status(400).send('Invalid data structure or missing data');
  }
});

app.get('/getLastMessage', async (req, res) => {
  try {
    await client.connect();

    const db = client.db('chatDB');
    const collection = db.collection('messages');

    // Sort the documents by timestamp in descending order and get the first one (the latest entry)
    const latestEntry = await collection.find().sort({ timestamp: -1 }).limit(1).toArray();

    if (latestEntry.length > 0) {
      res.json([
        {
          text: latestEntry[0].text,
          senderEmail: latestEntry[0].senderEmail,
          receiverEmail: latestEntry[0].receiverEmail
        }
      ]);
    } else {
      res.status(404).json({ message: 'No entries found in the collection.' });
    }

    client.close();
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ message: 'An error occurred while fetching the last entry.' });
  }
});


// route endpoint
app.post('/getRoute', (req, res) => {
  try {
    const { startLat, startLon, endLat, endLon, startTime } = req.body;

    if (!routeEngine.init()) {
      res.status(500).json({ error: 'Failed to initialize data' });
      return;
    }

    const result = routeEngine.getRoute(startLat, startLon, endLat, endLon, startTime);
    //const result = routeEngine.getHardcodedRoute();

  // Send the result as a response
  res.json(result);
  } catch(error) {
    res.status(500).json({ error: 'An error occurred while calculating the route.' });
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