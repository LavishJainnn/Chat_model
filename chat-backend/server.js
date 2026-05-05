// server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const ChatMessage = require("./models/ChatMessage");
const Room = require("./models/Room");
require("dotenv").config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { 
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Get all rooms
app.get("/rooms", async (req, res) => {
  try {
    const rooms = await Room.find().sort({ name: 1 });
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch rooms" });
  }
});

// Create a new room
app.post("/rooms", async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "Room name is required" });
    
    const existing = await Room.findOne({ name: name.toLowerCase() });
    if (existing) return res.status(400).json({ error: "Room already exists" });

    const room = new Room({ name: name.toLowerCase() });
    await room.save();
    
    io.emit("roomCreated", room);
    res.json(room);
  } catch (err) {
    res.status(500).json({ error: "Failed to create room" });
  }
});

app.get("/messages/:room", async (req, res) => {
  try {
    const { room } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    const before = req.query.before ? new Date(req.query.before) : new Date();

    const messages = await ChatMessage.find({ 
      room: room || 'general',
      timestamp: { $lt: before }
    })
    .sort({ timestamp: -1 })
    .limit(limit);

    res.json(messages.reverse());
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

const onlineUsers = new Map();

io.on("connection", (socket) => {
  socket.on("joinRoom", ({ user, room }) => {
    if (!user || !room) return;
    socket.join(room);
    onlineUsers.set(socket.id, { user, room });
    console.log(`User ${user} joined room: ${room}`);
    
    const usersInRoom = Array.from(onlineUsers.values())
      .filter(u => u.room === room)
      .map(u => u.user);
    io.to(room).emit("userList", usersInRoom);
  });

  socket.on("sendMessage", async (data) => {
    try {
      const { user, message, room } = data;
      const chatMessage = new ChatMessage({ user, message, room });
      await chatMessage.save();
      io.to(room).emit("message", chatMessage);
    } catch (error) {
      socket.emit("error", "Message failed to send");
    }
  });

  socket.on("typing", ({ user, room }) => {
    socket.to(room).emit("userTyping", { user });
  });

  socket.on("stopTyping", ({ user, room }) => {
    socket.to(room).emit("userStoppedTyping", { user });
  });

  socket.on("disconnect", () => {
    const userData = onlineUsers.get(socket.id);
    if (userData) {
      const { room } = userData;
      onlineUsers.delete(socket.id);
      const usersInRoom = Array.from(onlineUsers.values())
        .filter(u => u.room === room)
        .map(u => u.user);
      io.to(room).emit("userList", usersInRoom);
    }
  });
});

async function start() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");
    
    // Seed default rooms
    const defaultRooms = ["general", "development", "design", "random"];
    for (const name of defaultRooms) {
      const exists = await Room.findOne({ name });
      if (!exists) {
        await new Room({ name }).save();
      }
    }

    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (err) {
    process.exit(1);
  }
}
start();