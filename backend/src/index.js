const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const config = require("../src/config/config");

// Import routes
const vaultRoutes = require("./routes/vault");
const agentRoutes = require("./routes/agentRoutes");
// Initialize express app
const app = express();

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(morgan("dev")); // Logging
app.use(express.json()); // Parse JSON bodies

// API routes
app.use(`${config.api.prefix}/vault`, vaultRoutes);
app.use(`${config.api.prefix}/usdt-agent`, agentRoutes); // Add USDT agent routes
// We'll add more routes here

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
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

// Start server
const PORT = config.api.port;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
