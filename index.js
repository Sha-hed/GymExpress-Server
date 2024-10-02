const { MongoClient, ServerApiVersion } = require("mongodb");
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DATABASE_USER}:${process.env.DATABASE_PASSWORD}@cluster0.ojv3wo1.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const NewsletterCollection = client
      .db("GymExpress")
      .collection("Newsletter");
    const UserCollection = client.db("GymExpress").collection("Users");

    app.post("/newsletter", async (req, res) => {
      const result = await NewsletterCollection.insertOne(req.body);
      res.send({ result });
    });

    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = { email: user?.email };
      const ache = await UserCollection.findOne(query);
      if (ache) {
        return res.send({ message: "user already exists" });
      }
      const result = await UserCollection.insertOne(user);
      res.send(result);
    });

    app.post("/jwt", async (req, res) => {
      console.log("Hits Here :", req.body.email);
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN, {
        expiresIn: "365d",
      });
      res.send({token})
    });

    console.log("Successfully connected to MongoDB!");
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("GymExpress Server is Running");
});

app.listen(port, () => {
  console.log(`GymExpress is listening on port ${port}`);
});
