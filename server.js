require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const session = require("express-session");
const http = require("http");
const { Server } = require("socket.io");
const cookieParser = require("cookie-parser");

const authRoutes = require("./routes/authRoutes");
const propertyRoutes = require("./routes/propertyRoutes");
const userRoutes = require("./routes/userRoutes");
const authMiddelware = require("./middleware/authMiddleware");

dotenv.config();
const app = express();
const server = http.createServer(app); // 👈 wrap express with HTTP server

// Setup Socket.IO
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:5174"],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Global access to socket instance
global._io = io;

// Middleware
app.use(cookieParser());
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
    credentials: true,
  })
);

app.use(express.json());
app.use(
  session({
    secret: "rentopedia_secret_key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      httpOnly: true,
    },
  })
);

// ✅ Routes
app.use("/api/auth", authRoutes);
app.use("/api/property", propertyRoutes);
app.use("/api/user", userRoutes);

// ✅ Socket events
io.on("connection", (socket) => {
  console.log("🟢 Socket connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("🔴 Socket disconnected:", socket.id);
  });
});

// ✅ MongoDB & Start Server
// mongoose.connect(process.env.MONGO_URI)
//   .then(() => {
//     server.listen(5000, () => {
//       console.log("✅ Server running on http://localhost:5000");
//     });
//   })
// .catch(err => console.error("❌ DB connection error:", err));

let isConnected = false;
async function connectToMongoDB() {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    isConnected = true;
   
      console.log("Connected to MongoDB");
  } catch (error) {
    console.log('Error connecting to MOngoDB : ',error);
  }
}

app.use((req,res,next)=>{
  if(!isConnected){
    connectToMongoDB();
  }
  next();
})

module.exports=app;