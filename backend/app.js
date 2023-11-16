const express = require("express");
const https = require('https');
const fs = require('fs');
const { body, validationResult } = require('express-validator');
const axios = require('axios');
const SocketServer = require('websocket').server;
const http = require('http');
const moment = require('moment-timezone');
const mongoose = require('mongoose');
const chatRoute = require('./routes/chatRoute');
const chatController = require('./controllers/chat');
const translinkRoute = require('./routes/translinkRoute');
const admin = require('firebase-admin');
const schedule = require('node-schedule');
const routeEngine = require('./engine/routeEngine');
const database = require('./database.js');
const mockUserDB = require('./mockUserDB.js');

// const serviceAccount = require('./chatcomponent321-firebase-adminsdk-d4mco-7f2d456053.json');

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
// });

function getFormattedSubtractedTime(dataItems, subtractMinutes) {
    // Check if dataItems is an array
    if (Array.isArray(dataItems)) {
      // Process each data item in the array
      return dataItems.map(dataItem => formatSingleItem(dataItem, subtractMinutes));
    } else {
      // Handle a single data item
      return formatSingleItem(dataItems, subtractMinutes);
    }
  }
  
  function formatSingleItem(dataItem, subtractMinutes) {
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

  function adjustNewHours(hours, subtractHours) {
    let newHours = hours - subtractHours;
    if (newHours < 0) {
      newHours += 24; // Handle wrapping to the previous day
    }
    return newHours;
  }

// function getFormattedSubtractedTime(dataItem, subtractMinutes) {
//     if (dataItem.Start && dataItem.Start.Time) {
//       // Parse the input time into hours and minutes
//       const [hours, minutes] = dataItem.Start.Time.split(':');
    
//       // Convert hours and minutes to minutes and subtract the specified duration
//       let totalMinutes = parseInt(hours, 10) * 60 + parseInt(minutes, 10);
//       totalMinutes -= subtractMinutes;
    
//       // Handle cases where the totalMinutes becomes negative
//       if (totalMinutes < 0) {
//         totalMinutes += 24 * 60; // Add a day's worth of minutes (1440 minutes) to handle crossing midnight
//       }
    
//       // Calculate the hours and minutes for the new time
//       const newHours = Math.floor(totalMinutes / 60);
//       const newMinutes = totalMinutes % 60;
    
//       // Format the new time as HH:mm
//       const hoursPart = newHours.toString().padStart(2, '0');
//       const minutesPart = newMinutes.toString().padStart(2, '0');
//       const formattedTime = `${hoursPart}:${minutesPart}`;
    
//       return formattedTime;
//     } else {
//       console.error('Invalid data structure:', dataItem);
//       return null; // Return null if the data structure is invalid
//     }
//   }

module.exports = function(database) {
const app = express();
app.use(express.json())

app.getFormattedSubtractedTime = getFormattedSubtractedTime;
app.adjustNewHours = adjustNewHours;

// mongoose.connect('mongodb://127.0.0.1:27017/chatDB', {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// })

//const apiKey = 'OBA0SkAnEMfAP64ZZVH5';

// const server = http.createServer((req, res) => {});
// wsServer = new SocketServer({ httpServer: server });
// chatController.initWebSocket(wsServer);

app.use('/api/chat', chatRoute)
app.use('/api/translink', translinkRoute)

// Connection to Mongodb
// const {MongoClient} = require("mongodb");
// const uri = "mongodb://127.0.0.1:27017";
// const client = new MongoClient(uri);

// var admin = require("firebase-admin");
// var serviceAccount = require('./chatcomponent321-firebase-adminsdk-d4mco-7f2d456053.json');
// admin.initializeApp({
// credential: admin.credential.cert(serviceAccount),
// databaseURL: ""
// });

// const privateKey = fs.readFileSync('server.key', 'utf8');s
// const certificate = fs.readFileSync('server.crt', 'utf8');
// const credentials = { key: privateKey, cert: certificate };

app.get("/", (req, res) => {
    res.send("Hello World!")
})

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
        await database.connectToDatabase();
        const existingUser = await database.getUserInfoByEmail(req.body.email);
  
        if (existingUser) {
          const updateResult = await database.updateUserByEmail(
            req.body.email,
            req.body
          );
  
          if (updateResult.modifiedCount > 0) {
            console.log('User data updated in the database: ', req.body);
            res.status(200).send('User data updated in the database');
          } else {
            console.log('User data not updated. No changes were made.');
            res.status(200).send('User data not updated. No changes were made.');
          }
        } else {
          const result = await database.insertUser(req.body);
          console.log('New user data inserted into the database: ', result);
          res.status(200).send('New user data inserted into the database');
        }
      } catch (error) {
        console.error('Error inserting/updating user data into the database: ', error);
        res.status(500).send('Error inserting/updating user data into the database');
      } finally {
        await database.closeDatabaseConnection();
      }
    }
  );

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
        await database.connectToDatabase();
        const userEmail = req.body.userEmail;
        const friendEmail = req.body.friendEmail;
  
        const userExists = await database.getUserInfoByEmail(userEmail);
  
        if (userExists) {
          const userFilter = { email: userEmail };
          const userUpdate = {
            //$addToSet: { FriendsList: friendEmail },
            FriendsList: friendEmail,
          };
  
          let userLogMessage;
          const userResult = await database.updateUserByEmail(userEmail, userUpdate);
  
          if (userResult.modifiedCount === 1) {
            console.log("Friend added to the user's FriendsList.");
            userLogMessage = "Friend added to the user's FriendsList.";
          } else {
            console.log("Friend already added to the user's FriendsList.");
            userLogMessage = "Friend already added to the user's FriendsList.";
          }
  
          const friendExists = await database.getUserInfoByEmail(friendEmail);
  
          if (friendExists) {
            const friendFilter = { email: friendEmail };
            const friendUpdate = {
              //$addToSet: { FriendsList: userEmail },
              FriendsList: userEmail,
            };
  
            const friendResult = await database.updateUserByEmail(friendEmail, friendUpdate);
  
            if (friendResult.modifiedCount === 1) {
              console.log("User added to the friend's FriendsList.");
            } else {
              console.log("User already added to the friend's FriendsList.");
            }
          } else {
            console.log("Friend not found in the database.");
            res.status(404).send("Friend not found in the database.");
            return;
          }
  
          res.status(200).send("Friend added to both FriendLists.");
        } else {
          console.log("User not found in the database.");
          res.status(404).send("User not found in the database.")
        }
      } catch (error) {
        console.error("Error adding friend: ", error);
        res.status(500).send("Error adding friend.");
      } finally {
        await database.closeDatabaseConnection();
      }
    }
);

app.get("/getFriendList", async (req, res) => {
    try {
        await database.connectToDatabase();
        const userEmail = req.query.userEmail;
    
        const userExists = await database.getUserInfoByEmail(userEmail);
    
        if (userExists) {
          if (userExists.FriendsList && userExists.FriendsList.length > 0) {
            const friendsList = userExists.FriendsList;
            res.status(200).json({ FriendsList: friendsList });
          } else {
            res.status(200).send("No friends");
          }
        } else {
          console.log("User not found in the database.");
          res.status(404).send("User not found in the database.");
        }
      } catch (error) {
        console.error("Error getting friend list: ", error);
        res.status(500).send("Error getting friend list.");
      } finally {
        await database.closeDatabaseConnection();
      }
});



const registrationToken = 'fNgnfEh4RumbR4af-LLGkR:APA91bFb4pNSVMx80FugZSt8u4aLj4Z-LnlTSUC-xpFsqUO1gfLOVBhMElmbYiE76mC_ceyK7j8Db-HsxWrfS6BhW0YLRx3s4b7rwfCYjT537oDkQ69_T1Vm-zVhfWq99XZODm_sWeXO'

// const data = [
//   [{'Start': {'Stop': 'Northbound King George Blvd @ 60 Ave','Lat': 49.112374, 'Long': -122.840708, 'Time': '06:30', 'Bus': '394'}, 
//   'End': {'Stop': 'King George Station @ Bay 2','Lat': 49.183124, 'Long': -122.845136, 'Time': '07:25', 'Bus': '394'}}, 
//   {'Start': {'Stop': 'King George Station @ Platform 1','Lat': 49.182812, 'Long': -122.844691, 'Time': '07:32', 'Bus': 'Expo Line'}, 
//   'End': {'Stop': 'Joyce-Collingwood Station @ Platform 1','Lat': 49.23843, 'Long': -123.031759, 'Time': '07:58', 'Bus': 'Expo Line'}},
//   {'Start': {'Stop': 'Joyce Station @ Bay 4','Lat': 49.237907, 'Long': -123.031047, 'Time': '08:06', 'Bus': 'R4'}, 
//   'End': {'Stop': 'UBC Exchange @ Bay 1','Lat': 49.267415, 'Long': -123.247954, 'Time': '08:54', 'Bus': 'R4'}}]
//   ]

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



const subtractedMinutes = 10;


const isLatitude = (value) => {
  const latitude = parseFloat(value);
  return !isNaN(latitude) && latitude >= -90 && latitude <= 90;
};

const isLongitude = (value) => {
  const longitude = parseFloat(value);
  return !isNaN(longitude) && longitude >= -180 && longitude <= 180;
};

//app.post('/getFormattedSubtractedTime', async (req, res) => {
// app.post(
//     '/getFormattedSubtractedTime',
//     [
//       body('email').isEmail().normalizeEmail(),
//       body('eventName').isString().notEmpty(),
//       body('location.latitude').custom(isLatitude),
//       body('location.longitude').custom(isLongitude),
//       body('events.*.time').isISO8601(),
//     ],
//     async (req, res) => {
//       const errors = validationResult(req);
//       if (!errors.isEmpty()) {
//         return res.status(400).send("Invalid or missing data");
//       }
//   const userEmail = req.body.email;
//   const eventData = req.body.location;
//   const latitude = eventData.latitude;
//   const longitude = eventData.longitude;
//   const providedTime = req.body.time;
//   //const [hours, minutes, seconds] = providedTime.split(':').map(Number);

//   try {
//     await database.connectToDatabase();
//     const userExists = await database.getUserInfoByEmail(userEmail);

//     if (userExists) {
//       const defaultLat = userExists.defaultLat;
//       const defaultLong = userExists.defaultLon;

//       const timePart = providedTime.match(/T(\d+:\d+:\d+)/)[1];
//       const [hours, minutes, seconds] = timePart.split(':').map(Number);
//     // let newHours = hours - 2;
//     // if (newHours < 0) {
//     //   newHours += 24; // Handle wrapping to the previous day
//     // }

//       const newHours = adjustNewHours(hours, 2);  

//       const startTime = `${newHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;  

//     try {
//       await routeEngine.init();
  
//       const result = routeEngine.getRoute(defaultLat, defaultLong, latitude, longitude, startTime);
//       console.log(result);
  
//       res.json(result);
//     } catch(error) {
//       console.log(error);
//       res.status(500).json({ error: 'An error occurred while calculating the route.' });

//     //   const postData = JSON.stringify({
//     //     startLat: defaultLat,
//     //     startLon: defaultLong,
//     //     endLat: latitude,
//     //     endLon: longitude,
//     //     startTime: startTime,
//     //   });

//     //   const options = {
//     //     hostname: '0.0.0.0', // Replace with your API's hostname
//     //     port: 8081, // Adjust the port if needed (e.g., 443 for HTTPS)
//     //     path: '/getRoute', // Replace with the correct path
//     //     method: 'POST',
//     //     headers: {
//     //       'Content-Type': 'application/json',
//     //       'Content-Length': postData.length,
//     //     },
//     //     rejectUnauthorized: false,
//     //   };

//     //   const request = https.request(options, (routeResponse) => {
//     //     let data = '';

//     //     routeResponse.on('data', (chunk) => {
//     //       data += chunk;
//     //       console.log(data)
//     //     });

//     //     routeResponse.on('end', () => {
//     //       const dataItem = JSON.parse(data);
//     //       console.log(dataItem);

//     //       const formattedSubtractedTimes = dataItem.map((item) => {
//     //         if (item.Start && item.Start.Time) {
//     //           const formattedSubtractedTime = getFormattedSubtractedTime(item, subtractedMinutes);
//     //           return formattedSubtractedTime;
//     //         }
//     //         return null;
//     //       });

//     //       if (formattedSubtractedTimes.length > 0) {
//     //         res.json({ times: formattedSubtractedTimes });
//     //       } else {
//     //         res.json(400).send('Invalid or missing data');
//     //       }

//     //       database.closeDatabaseConnection();
//     //     });
//     //   });

//     //   request.on('error', (error) => {
//     //     res.status(500).send('An error occurred while making the request to getRoute');
//     //   });

//     //   request.write(postData);
//     //   request.end();
//     } else {
//       res.status(404).send('User not found in the database');
//     }
//   } catch (err) {
//     res.status(500).send('Error connecting to the database: ' + err.message);
//   }
// });
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
      return res.status(400).send("Invalid or missing data");
    }

    const userEmail = req.body.email;
    const eventData = req.body.location;
    const latitude = eventData.latitude;
    const longitude = eventData.longitude;
    const providedTime = req.body.time;

    try {
      await database.connectToDatabase();
      const userExists = await database.getUserInfoByEmail(userEmail);

      if (userExists) {
        const defaultLat = userExists.defaultLat;
        const defaultLong = userExists.defaultLon;

        const timePart = providedTime.match(/T(\d+:\d+:\d+)/)[1];
        const [hours, minutes, seconds] = timePart.split(':').map(Number);

        const newHours = adjustNewHours(hours, 2);

        const startTime = `${newHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        try {
          await routeEngine.init();

          const result = routeEngine.getRoute(defaultLat, defaultLong, latitude, longitude, startTime);
          
          const formattedSubtractedTimes = result.map((item) => {
            if (item.Start && item.Start.Time) {
              const formattedSubtractedTime = getFormattedSubtractedTime(item, subtractedMinutes);
              return formattedSubtractedTime;
            }
            return null;
          });

          const filteredTimes = formattedSubtractedTimes.filter(time => time !== null);

          if (filteredTimes.length > 0) {
            res.json({ times: filteredTimes });
          } else {
            res.status(400).send('Invalid or missing data');
          }

        } catch (error) {
          console.log(error);
          res.status(500).json({ error: 'An error occurred while calculating the route.' });
        }
      } else {
        res.status(404).send('User not found in the database');
      }
    } catch (err) {
      res.status(500).send('Error connecting to the database: ' + err.message);
    }
  }
);




// app.get('/getLastMessage', async (req, res) => {
//   try {
//     await client.connect();

//     const db = client.db('chatDB');
//     const collection = db.collection('messages');

//     // Sort the documents by timestamp in descending order and get the first one (the latest entry)
//     const latestEntry = await collection.find().sort({ timestamp: -1 }).limit(1).toArray();

//     if (latestEntry.length > 0) {
//       res.json([
//         {
//           text: latestEntry[0].text,
//           senderEmail: latestEntry[0].senderEmail,
//           receiverEmail: latestEntry[0].receiverEmail
//         }
//       ]);
//     } else {
//       res.status(404).json({ message: 'No entries found in the collection.' });
//     }

//     client.close();
//   } catch (err) {
//     console.error('Error:', err);
//     res.status(500).json({ message: 'An error occurred while fetching the last entry.' });
//   }
// });


// route endpoint
//app.post('/getRoute', async (req, res) => {
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

    await database.connectToDatabase();
    await routeEngine.init();

    const result = routeEngine.getRoute(startLat, startLon, endLat, endLon, startTime);
    console.log(result);

    res.json(result);
  } catch(error) {
    console.log(error);
    res.status(500).json({ error: 'An error occurred while calculating the route.' });
  } finally {
    await database.closeDatabaseConnection();
  }
});

//app.post('/getFriendRoute', async (req, res) => {
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
        const { startLat1, startLon1, endLat, endLon, endTime, friendEmail } = req.body;
    
        await database.connectToDatabase();
        const userExists = await database.getUserInfoByEmail(friendEmail);
    
        if (userExists) {
          const defaultLat = userExists.defaultLat; 
          const defaultLong = userExists.defaultLon;
    
          await routeEngine.init();
          result = routeEngine.getPartnerRoute(startLat1, startLon1, defaultLat, defaultLong, endLat, endLon, endTime);
          console.log(result);
    
          if (result) {
            res.json({result});
          } else {
            res.status(400).send('Invalid or missing data');
          }
        } else {
          console.log(error);
          res.status(500).json({ error: 'User does not exist in the DB' });
        }
      } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'An error occurred while calculating the friend-route.' });
      } finally {
        await database.closeDatabaseConnection();
      }
});

app.get('/getFCM', async (req, res) => {
    try {
        await database.connectToDatabase();
    
        const userEmail = req.query.userEmail;
        const userExists = await database.getUserInfoByEmail(userEmail);
    
        if (userExists) {
          const fcmToken = userExists.deviceToken;
    
          const payload = {
            notification: {
              title: 'TransitTrack Alert',
              body: 'Your TransitTrack journey begins in 10 minutes!',
            },
          };
    
          await admin.messaging().sendToDevice(fcmToken, payload);
    
          res.status(201).json({ message: 'Alert sent successfully' });
        } else {
          res.status(404).json({ message: 'Could not send journey alert' });
        }
    
        database.closeDatabaseConnection();
      } catch (err) {
        console.error('Error:', err);
        database.closeDatabaseConnection();
        res.status(500).json({ message: 'An error occurred while getFCM.' });
      }
});


// const db = mongoose.connection;
// db.on('error', console.error.bind(console, 'MongoDB connection error:'))
// db.once('open', () => {
//   console.log('Connected to MongoDB database')
// })


return app
}

//module.exports = app

// async function run(){
//   try{
//       await client.connect()
//       console.log("Successfully connected to the database")
//       var server = https.createServer(credentials, app).listen(8081, "0.0.0.0", (req, res) =>{
//       //var server = app.listen(8081, "0.0.0.0", (req, res) =>{
//           var host = server.address().address
//           var port = server.address().port
//           console.log("Example server successfully running at https://%s:%s", host, port)
//       })
//   }
//   catch(err){
//       console.log(err)
//       await client.close()
//   }
// }

// run()