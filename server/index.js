const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const authRoutes = require("./routes/auth");
const messageRoutes = require("./routes/messages");
const socket = require("socket.io");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
const mongoURI = "mongodb+srv://quasarastro:DQp5KykNLfQiqn2U@cluster0.msah3.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

mongoose
  .connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("MongoDB connection successful");
  })
  .catch((err) => {
    console.log("MongoDB connection error:", err.message);
    process.exit(1); // Stop the server if the connection fails
  });

// API Routes
app.get("/ping", (_req, res) => {
  return res.json({ msg: "Ping Successful" });
});

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

// Set up the server
const PORT = process.env.PORT || 5000; // Use an environment variable for the port if available
const server = app.listen(PORT, () =>
  console.log(`Server started on port ${PORT}`)
);

// Set up socket.io for real-time communication
const io = socket(server, {
  cors: {
    origin: "http://localhost:3000", // Change this to your client URL if different
    credentials: true,
  },
});

// Global map for online users
global.onlineUsers = new Map();

io.on("connection", (socket) => {
  global.chatSocket = socket;

  // Add user to online users map
  socket.on("add-user", (userId) => {
    onlineUsers.set(userId, socket.id);
  });

  // Send message to recipient if they're online
  socket.on("send-msg", (data) => {
    const sendUserSocket = onlineUsers.get(data.to);
    if (sendUserSocket) {
      socket.to(sendUserSocket).emit("msg-recieve", data.msg);
    }
  });
});
