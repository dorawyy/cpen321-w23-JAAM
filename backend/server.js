const express = require("express");
const https = require('https');
const fs = require('fs');
const { body, validationResult } = require('express-validator');
const SocketServer = require('websocket').server;
const http = require('http');
const mongoose = require('mongoose');
const chatRoute = require('./routes/chatRoute');
const chatController = require('./controllers/chat');
const translinkRoute = require('./routes/translinkRoute');
const admin = require('firebase-admin');
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

//const apiKey = 'OBA0SkAnEMfAP64ZZVH5';

let wsServer; 
const server = http.createServer((req, res) => {});
wsServer = new SocketServer({ httpServer: server });
chatController.initWebSocket(wsServer);

app.use('/api/chat', chatRoute)
app.use('/api/translink', translinkRoute)

// Connection to Mongodb
const {MongoClient} = require("mongodb");
const uri = "mongodb://127.0.0.1:27017";
const client = new MongoClient(uri);

const privateKey = fs.readFileSync('server.key', 'utf8');
const certificate = fs.readFileSync('server.crt', 'utf8');
const credentials = { key: privateKey, cert: certificate };

app.get("/", (req, res) => {
    res.send("Hello World!")
})

//ChatGPT Usage: No
app.post(
  '/createUser',
  [
    body('email').isEmail().normalizeEmail(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      await client.connect();
      const db = client.db('userDB');
      const collection = db.collection('userInfo');

      const existingUser = await collection.findOne({ email: req.body.email });

      if (existingUser) {
        const updateResult = await collection.updateOne(
          { email: req.body.email },
          { $set: req.body }
        );

        if (updateResult.modifiedCount > 0) {
          console.log('User data updated in the database: ', req.body);
          res.status(200).send('User data updated in the database');
        } else {
          console.log('User data not updated. No changes were made.');
          res.status(200).send('User data not updated. No changes were made.');
        }
      } else {
        const result = await collection.insertOne(req.body);
        console.log('New user data inserted into the database: ', result.insertedId);
        res.status(200).send('New user data inserted into the database');
      }
    } catch (error) {
      console.error('Error inserting/updating user data into the database: ', error);
      res.status(500).send('Error inserting/updating user data into the database');
    } finally {
      await client.close();
    }
  }
);

//ChatGPT Usage: Yes
// Broadcast method for WebSocket connections
wsServer.broadcast = (data) => {
  wsServer.connections.forEach((connection) => {
    if (connection.connected) {
      connection.send(data);
    }
  });
};

//ChatGPT Usage: No
app.post(
  '/addFriend',
  [
    body('userEmail').isEmail().normalizeEmail(),
    body('friendEmail').isEmail().normalizeEmail(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      await client.connect();
      const db = client.db('userDB');
      const collection = db.collection('userInfo');

      const userEmail = req.body.userEmail;
      const friendEmail = req.body.friendEmail;

      const userExists = await collection.findOne({ email: userEmail });

      if (userExists) {
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
  }
);

//ChatGPT Usage: Partial
function getFormattedSubtractedTime(dataItem, subtractMinutes) {
  if (dataItem.Start && dataItem.Start.Time) {
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
    return null;
  }
}

const isLatitude = (value) => {
  const latitude = parseFloat(value);
  return !isNaN(latitude) && latitude >= -90 && latitude <= 90;
};

const isLongitude = (value) => {
  const longitude = parseFloat(value);
  return !isNaN(longitude) && longitude >= -180 && longitude <= 180;
};

//ChatGPT Usage: Partial
app.post(
  '/getFormattedSubtractedTime',
  [
    body('email').isEmail().normalizeEmail(),
    body('eventName').isString().notEmpty(),
    body('location.latitude').custom(isLatitude),
    body('location.longitude').custom(isLongitude),
    body('events.*.time').isISO8601(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
  const userEmail = req.body.email;
  const eventData = req.body.location;
  const latitude = eventData.latitude;
  const longitude = eventData.longitude;
  const providedTime = req.body.time;
  //const [hours, minutes, seconds] = providedTime.split(':').map(Number);

  const subtractedMinutes = 10;

  try {
    await client.connect();
    const db = client.db("userDB");
    const collection = db.collection("userInfo");

    const userExists = await collection.findOne({ email: userEmail });

    if (userExists) {
      const defaultLat = userExists.defaultLat;
      const defaultLong = userExists.defaultLon;

      // Subtract 2 hours from the provided time using moment-timezone
    //   let newHours = hours - 2;
    //   if (newHours < 0) {
    //     newHours += 24;
    // }
    const timePart = providedTime.match(/T(\d+:\d+:\d+)/)[1];
    const [hours, minutes, seconds] = timePart.split(':').map(Number);
    let newHours = hours - 2;
    if (newHours < 0) {
      newHours += 24; // Handle wrapping to the previous day
    }
    const startTimeFormatted = `${newHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;  
    //const startTime = moment(providedTime, 'HH:mm:ss').subtract(2, 'hours').format('HH:mm:ss');
      //const timePart = providedTime.split('T')[1].split('-')[0];
      //const startTime = moment(timePart, 'HH:mm:ss').subtract(2, 'hours').format('HH:mm:ss');
      //const startTime = `${newHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      console.log(startTimeFormatted)

      // Data to send in the request body
      const postData = JSON.stringify({
        startLat: defaultLat,
        startLon: defaultLong,
        endLat: latitude,
        endLon: longitude,
        startTime: startTimeFormatted,
      });

      // Options for the POST request
      const options = {
        hostname: '0.0.0.0',
        port: 8081,
        path: '/getRoute',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': postData.length,
        },
        rejectUnauthorized: false,
      };

      const request = https.request(options, (routeResponse) => {
        let data = '';

        routeResponse.on('data', (chunk) => {
          data += chunk;
          console.log(data)
        });

        routeResponse.on('end', () => {
          const dataItem = JSON.parse(data);
          console.log(dataItem)

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

          client.close();
        });
      });

      request.on('error', (error) => {
        console.error('HTTP request error:', error);
        res.status(500).send('An error occurred while making the request to getRoute');
      });

      request.write(postData);
      request.end();
    } else {
      res.status(404).send('User not found in the database');
    }
  } catch (err) {
    res.status(500).send('Error connecting to the database: ' + err.message);
  }
});

//ChatGPT Usage: Partial
app.get('/getLastMessage', async (req, res) => {
  console.log("Function to get the last chat message");
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

//ChatGPT Usage: No
// route endpoint
app.post('/getRoute', [
  body('startLat').custom(isLatitude),
  body('startLon').custom(isLongitude),
  body('endLat').custom(isLatitude),
  body('endLon').custom(isLongitude),
  body('startTime').matches(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    console.log(req.body);
    const { startLat, startLon, endLat, endLon, startTime } = req.body;

    await routeEngine.init();
    const result = routeEngine.getRoute(startLat, startLon, endLat, endLon, startTime);
    console.log(result);

  res.json(result);
  } catch(error) {
    console.log(error);
    res.status(500).json({ error: 'An error occurred while calculating the route.' });
  }
});

//ChatGPT Usage: No
app.post('/getFriendRoute', [
  body('startLat').custom(isLatitude),
  body('startLon').custom(isLongitude),
  body('endLat').custom(isLatitude),
  body('endLon').custom(isLongitude),
  body('endTime').matches(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/),
  body('friendEmail').isEmail().normalizeEmail(),
  ], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
  try {
    await client.connect();
    console.log(req.body);
    const { startLat1, startLon1, endLat, endLon, endTime, friendEmail } = req.body;


    const db = client.db("userDB");
    const collection = db.collection("userInfo");

    const userExists = await collection.findOne({ email: friendEmail });
    console.log(userExists)



    if (userExists) {

      const defaultLat = userExists.defaultLat; 
      const defaultLong = userExists.defaultLon;

      await routeEngine.init();
      const result = routeEngine.getPartnerRoute(startLat1, startLon1, defaultLat, defaultLong, endLat, endLon, endTime);
      console.log(result);

      // Handle the response data as needed
     if (result) {
        res.json({result}); 
      } else {
        res.status(400).send('Invalid or missing data');
      }
    }
    else{
      res.status(500).json({ error: 'User does not exist in the DB' });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'An error occurred while calculating the friend-route.' });
  }
  await client.close();
});

//ChatGPT Usage: No
app.get('/getFCM', async (req, res) => {
  console.log("Function to send FCM notification");
  try {
    await client.connect();

    const db = client.db('userDB');
    const collection = db.collection('userInfo');

    const userEmail = req.query.userEmail;

    const userExists = await collection.findOne({ email: userEmail });
    console.log(userExists)


    if (userExists) {

      const fcmToken =  userExists.deviceToken
      console.log(fcmToken)

       // Send a push notification to the receiver
      const payload = {
        notification: {
          title: 'TransitTrack Alert',
          body: 'Your TransitTrack journey begins in 10 minutes!',
        },
      };

      // Send the notification to the receiver's FCM token
      await admin.messaging().sendToDevice(fcmToken, payload);

      res.status(201).json({ message: 'Alert sent successfully' });

    } else {
      res.status(404).json({ message: 'Could not send journey alert' });
    }

    client.close();
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ message: 'An error occurred while getFCM.' });
  }
});


const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'))
db.once('open', () => {
  console.log('Connected to MongoDB database')
})

//ChatGPT Usage: No
async function run(){
  console.log("Successful connection");
  try{
      await client.connect()
      console.log("Successfully connected to the database")
      var server = https.createServer(credentials, app).listen(8081, "0.0.0.0", (req, res) =>{
      //var server = app.listen(8081, "0.0.0.0", (req, res) =>{
          var host = server.address().address
          var port = server.address().port
          console.log("Example server successfully running at https://%s:%s", host, port)
      })
  }
  catch(err){
      console.log(err)
      await client.close()
  }
}

run()