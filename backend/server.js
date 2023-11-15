const database = require('./database.js');
const makeApp = require('./app.js');
const fs = require('fs');
const https = require('https');
const admin = require('firebase-admin');
const mongoose = require('mongoose');
const {MongoClient} = require("mongodb");

const app = makeApp(database);

const uri = "mongodb://127.0.0.1:27017";
const client = new MongoClient(uri);

const privateKey = fs.readFileSync('server.key', 'utf8');
const certificate = fs.readFileSync('server.crt', 'utf8');
const credentials = { key: privateKey, cert: certificate };


const serviceAccount = require('./chatcomponent321-firebase-adminsdk-d4mco-7f2d456053.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

mongoose.connect('mongodb://127.0.0.1:27017/chatDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})

async function run(){
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