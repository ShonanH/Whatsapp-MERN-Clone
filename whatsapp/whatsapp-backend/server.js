// OUTLINE //

// Importing
// App Config
// Middleware
// DB Configuration
// Change Stream
// API Routes
// Listener

// OUTLINE //

// Importing
import express from "express";
import mongoose from "mongoose";
import Messages from "./dbMessages.js";
import Pusher from "pusher";

//////////////////
// App Config
const app = express();
const port = process.env.PORT || 9000;

const pusher = new Pusher({
  appId: "1227714",
  key: "0c1721037311828d8542",
  secret: "feb2a371557a46076d5e",
  cluster: "us3",
  useTLS: true,
});

//////////////////
// Middleware

app.use(express.json());

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");
  next();
});

//////////////////
// DB Configuration
// Configure the Mongo Database

const connection_url =
  "mongodb+srv://admin:GGKTQUEyntMhKk0x@cluster0.r0j7a.mongodb.net/whatsappdb?retryWrites=true&w=majority";
mongoose.connect(connection_url, {
  useCreateIndex: true,
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

//////////////////
// Change Stream
// Establishing connection between MongoDB and Pusher

const db = mongoose.connection;
db.once("open", () => {
  console.log("DB connected");

  const messageCollection = db.collection("messagecontents");
  const changeStream = messageCollection.watch();

  changeStream.on("change", (change) => {
    console.log(change);

    if (change.operationType === "insert") {
      const messageDetails = change.fullDocument;
      pusher.trigger("messages", "inserted", {
        name: messageDetails.name,
        message: messageDetails.message,
      });
    } else {
      console.log("Error Occured triggering Pusher");
    }
  });
});

//////////////////
// API Routes
// Establishing Routing for GET and POST request for new messages in Mongo

app.get("/", (req, res) => res.status(200).send("hello world"));

app.get("/messages/sync", (req, res) => {
  Messages.find((err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(200).send(data);
    }
  });
});

app.post("/messages/new", (req, res) => {
  const dbMessage = req.body;
  Messages.create(dbMessage, (err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(201).send(data);
    }
  });
});

//////////////////
// Port Listener
app.listen(port, () => console.log(`Listening on localhost:${port}`));
