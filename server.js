const express = require("express");
const axios = require('axios');
const app = express();

app.use(express.json())

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