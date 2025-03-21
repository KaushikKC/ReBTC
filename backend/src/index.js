const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const config = require("../src/config/config");
const { connectDB } = require("./config/database"); // Import MongoDB connection
require("dotenv").config(); // Load environment variables

// Import routes
const vaultRoutes = require("./routes/vault");
const agentRoutes = require("./routes/agentRoutes");
const profileRoutes = require("./routes/api/profile");
const loanRoutes = require("./routes/api/loan");
const depositRoutes = require("./routes/api/deposit");
const stakeRoutes = require("./routes/api/stake");
const transactionRoutes = require("./routes/api/transaction");

// Initialize express app
const app = express();

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(morgan("dev")); // Logging
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// API routes
app.use(`${config.api.prefix}/vault`, vaultRoutes);
app.use(`${config.api.prefix}/usdt-agent`, agentRoutes); // Add USDT agent routes

// New API routes
app.use(`${config.api.prefix}/profile`, profileRoutes);
app.use(`${config.api.prefix}/loan`, loanRoutes);
app.use(`${config.api.prefix}/deposit`, depositRoutes);
app.use(`${config.api.prefix}/stake`, stakeRoutes);
app.use(`${config.api.prefix}/transaction`, transactionRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    mongodb:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Internal Server Error",
    error: process.env.NODE_ENV === "production" ? undefined : err.message,
  });
});

// Start server with MongoDB connection
const PORT = config.api.port || 3000;

// Connect to MongoDB then start Express server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Start Express server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

// Start the server
startServer();

module.exports = app;
