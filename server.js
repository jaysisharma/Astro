require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const multer = require("multer");
const path = require("path");
const cors = require("cors");
const OneSignal = require("onesignal-node");

// Import routes
const newsRoutes = require("./routes/newsRoutes");
const authRoutes = require("./routes/authRoutes");
const authMiddleware = require("./middlewares/authMiddleware"); // Authentication middleware

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads"))); // Serve uploaded images

// Database connection
mongoose
  .connect(
    "mongodb+srv://prasant:Pjha123%40@cluster0.lprdc.mongodb.net/myDatabase?retryWrites=true&w=majority"
  )
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

// Initialize OneSignal client
const oneSignalClient = new OneSignal.Client(
  process.env.ONESIGNAL_APP_ID,
  process.env.ONESIGNAL_REST_API_KEY
);

// Route to send notifications
app.post("/api/send-notification", async (req, res) => {
  const { title, message } = req.body;

  const notification = {
    headings: { en: title },
    contents: { en: message },
    included_segments: ["All"],
  };

  try {
    const response = await oneSignalClient.createNotification(notification);
    console.log("Notification sent successfully:", response.body);
    res
      .status(200)
      .send({ success: true, message: "Notification sent successfully!" });
  } catch (error) {
    console.error("Error sending notification:", error);
    res.status(500).send({ success: false, error: error.message });
  }
});

// Routes
app.use("/api/news", authMiddleware, newsRoutes);
app.use("/api/auth", authRoutes);

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
