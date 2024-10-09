const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
const verifyToken = async (req, res, next) => {
  const tokai = req?.headers?.authorization;
  if (!tokai) {
    return res.send({ message: "Forbidden Access" });
  }
  const token = tokai.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
    if (err) {
      return res.send({ message: "Forbidden Access" });
    }
    req.user = decoded;
    next();
  });
};

const uri = `mongodb+srv://${process.env.DATABASE_USER}:${process.env.DATABASE_PASSWORD}@cluster0.ojv3wo1.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
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
    const AppliedTrainer = client.db("GymExpress").collection("AppliedTrainer");
    const TrainerCollection = client.db("GymExpress").collection("Trainers");
    const ClassCollection = client.db("GymExpress").collection("Classes");
    const BookingCollection = client.db("GymExpress").collection("Booking");
    const BlogCollection = client.db("GymExpress").collection("Blog");
    const ReviewCollection = client.db("GymExpress").collection("Review");

    const verifyAdmin = async (req, res, next) => {
      const email = req?.user?.email;
      const filter = { email: email };
      const user = await UserCollection.findOne(filter);
      console.log(user);
      let isAdmin = user?.role === "admin";
      if (!isAdmin) {
        return res.status(401).send({ message: "Unauthorized Access" });
      }
      next();
    };

    const verifyTrainer = async (req, res, next) => {
      const email = req?.user?.email;
      const filter = { email: email };
      const user = await UserCollection.findOne(filter);
      console.log(user);
      let isTrainer = user?.role === "trainer";
      if (!isTrainer) {
        return res.status(401).send({ message: "Unauthorized Access" });
      }
      next();
    };

    app.get("/isAdmin", async (req, res) => {
      const email = req.query?.email;
      const filter = { email: email };
      const user = await UserCollection.findOne(filter);
      let isAdmin = user?.role === "admin";
      console.log("Admin Verification ", isAdmin);
      res.send({ isAdmin });
    });

    app.get("/isTrainers", async (req, res) => {
      const email = req.query?.email;
      const filter = { email: email };
      const user = await UserCollection.findOne(filter);
      let isTrainer = user?.role === "trainer";
      console.log("Trainer Verification ", isTrainer);
      res.send({ isTrainer });
    });

    app.post("/check", verifyToken, verifyAdmin, async (req, res) => {
      res.send({ message: "Shera hoise mama" });
    });

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
      res.send({ token });
    });

    //Admin-Trainer Related APIs
    app.post("/appliedTrainer", verifyToken, async (req, res) => {
      const trainer = req.body;
      const result = await AppliedTrainer.insertOne(trainer);
      res.send(result);
    });
    app.get("/appliedTrainer", verifyToken, verifyAdmin, async (req, res) => {
      const result = await AppliedTrainer.find().toArray();
      res.send(result);
    });
    app.post("/addTrainer", verifyToken, verifyAdmin, async (req, res) => {
      const sTrainee = req.body;
      const filter = { email: sTrainee?.email };
      const updateDoc = {
        $set: {
          role: "trainer",
        },
      };
      const trainer = {
        name: sTrainee?.name,
        email: sTrainee?.email,
        age: sTrainee?.age,
        photo: sTrainee?.photo,
        days: sTrainee?.days,
        time: sTrainee?.time,
        selectedSkill: sTrainee?.selectedSkill,
        experience: sTrainee?.experience,
        description: sTrainee?.description,
      };
      const insertedInfo = await TrainerCollection.insertOne(trainer);
      const updatedInfo = await UserCollection.updateOne(filter, updateDoc);
      const deletedInfo = await AppliedTrainer.deleteOne(filter);
      res.send({ insertedInfo, updatedInfo, deletedInfo });
    });
    app.get("/getTrainer", async (req, res) => {
      const result = await TrainerCollection.find().toArray();
      res.send(result);
    });
    app.get("/getTrainer/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await TrainerCollection.findOne(filter);
      res.send(result);
    });
    app.delete(
      "/deleteTrainer/:email",
      verifyToken,
      verifyAdmin,
      async (req, res) => {
        const email = req.params.email;
        const filter = { email: email };
        const updateDoc = {
          $set: {
            role: "user",
          },
        };
        const deletedTrainer = await TrainerCollection.deleteOne(filter);
        const updatedTrainer = await UserCollection.updateOne(
          filter,
          updateDoc
        );
        res.send({ deletedTrainer, updatedTrainer });
      }
    );
    app.get("/newsletter", verifyToken, verifyAdmin, async (req, res) => {
      const result = await NewsletterCollection.find().toArray();
      res.send(result);
    });

    app.post("/addClass", verifyToken, verifyAdmin, async (req, res) => {
      const addClass = req.body;
      const result = await ClassCollection.insertOne(addClass);
      res.send(result);
    });

    //Class Related APIs

    app.get("/getClasses", async (req, res) => {
      const result = await ClassCollection.find().toArray();
      res.send(result);
    });

    app.get("/getClass/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await ClassCollection.findOne(filter);
      res.send(result);
    });
    app.post("/bookingClass", verifyToken, async (req, res) => {
      const bookingClass = req.body;
      const result = await BookingCollection.insertOne(bookingClass);
      res.send(result);
    });

    //User Dashboard Related APIs

    app.get("/getBookedClass/:email", async (req, res) => {
      const email = req.params.email;
      const filter = { userEmail: email };
      const result = await BookingCollection.find(filter).toArray();
      res.send(result);
    });

    app.get("/getTrainerBookedClass/:email", async (req, res) => {
      const email = req.params.email;
      const filter = { trainerEmail: email };
      const result = await BookingCollection.find(filter).toArray();
      res.send(result);
    });


    //Blog Related APIs
    app.post('/blog', async(req,res)=>{
      const blog = req.body;
      const result = await BlogCollection.insertOne(blog)
      res.send(result)
    })

    app.get('/blog', async(req,res)=>{
      const result = await BlogCollection.find().toArray();
      res.send(result)
    })

    app.post('/review', async(req,res)=>{
      const review = req.body;
      const result = await ReviewCollection.insertOne(review)
      res.send(result)
    })

    app.get('/review', async(req,res)=>{
      const result = await ReviewCollection.find().toArray()
      res.send(result)
    })
    


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
