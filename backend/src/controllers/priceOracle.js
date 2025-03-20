require("dotenv").config();
const axios = require("axios");
// const mongoose = require("mongoose");

// MongoDB Models - Commented out as requested
/*
const PriceSchema = new mongoose.Schema({
  id: String,
  price: Number,
  confidence: Number,
  publish_time: Number,
});

const USDTPrice = mongoose.model("USDTPrice", PriceSchema, "usdt_prices");
*/

// API Constants
const API_URL = "https://hermes.pyth.network/v2/updates/price";
const USDT_ID =
  "0x2b89b9dc8fdf9f34709a5b106b472f0f39bb6ca9ce04b0fd7f2e971688e2e53b";

// Generate timestamps for the past 2 years (2 per month)
const generateTimestamps = () => {
  const timestamps = [];
  const now = Math.floor(Date.now() / 1000);

  for (let i = 0; i < 24; i++) {
    // First timestamp around beginning of month
    const timestamp1 = now - i * 30 * 24 * 60 * 60;
    timestamps.push(timestamp1);

    // Second timestamp around middle of month (15 days later)
    const timestamp2 = now - (i * 30 * 24 * 60 * 60 + 15 * 24 * 60 * 60);
    timestamps.push(timestamp2);
  }

  return timestamps.reverse();
};

// Normalize ID by removing '0x' prefix if present
const normalizeId = (id) => {
  return id.startsWith("0x") ? id.substring(2) : id;
};

// Fetch price data from Pyth API
const fetchPriceData = async (timestamp) => {
  try {
    const response = await axios.get(`${API_URL}/${timestamp}`, {
      params: { ids: [USDT_ID] },
    });

    if (response.data && response.data.parsed) {
      return response.data.parsed.map((item) => ({
        id: item.id,
        price: parseFloat(item.price.price) * Math.pow(10, item.price.expo), // Adjust for exponent
        confidence: parseFloat(item.price.conf),
        publish_time: item.price.publish_time,
      }));
    }
  } catch (error) {
    console.error(
      `Error fetching data for timestamp ${timestamp}:`,
      error.message
    );
  }
  return [];
};

// Store data in MongoDB with proper validation - Commented out as requested
const storeDataInDB = async (data) => {
  for (const item of data) {
    try {
      const normalizedItemId = normalizeId(item.id);
      const normalizedUsdtId = normalizeId(USDT_ID);

      console.log(`Received ID: ${normalizedItemId}`);
      console.log(`USDT ID to match: ${normalizedUsdtId}`);

      // MongoDB storage is commented out as requested
      /*
      if (normalizedItemId === normalizedUsdtId) {
        await USDTPrice.findOneAndUpdate(
          { publish_time: item.publish_time },
          item,
          { upsert: true }
        );
        console.log(
          `Stored USDT data for time ${new Date(
            item.publish_time * 1000
          ).toISOString()}`
        );
      } else {
        console.log(`Unknown coin ID: ${item.id}`);
      }
      */

      // Instead of storing, just log the data
      if (normalizedItemId === normalizedUsdtId) {
        console.log(
          `USDT data for time ${new Date(
            item.publish_time * 1000
          ).toISOString()}: Price: $${item.price.toFixed(4)}`
        );
      } else {
        console.log(`Unknown coin ID: ${item.id}`);
      }
    } catch (error) {
      console.error(`Error processing data for ID ${item.id}:`, error.message);
    }
  }
};

// Main Function for historical data
const fetchHistoricalData = async () => {
  try {
    // MongoDB connection commented out as requested
    /*
    await mongoose.connect(
      "mongodb+srv://madhuvarsha:madhu1234@cluster0.jqjbs.mongodb.net/"
    );
    console.log("Connected to MongoDB");
    */

    const timestamps = generateTimestamps();
    console.log(`Generated ${timestamps.length} timestamps for fetching data`);

    for (const timestamp of timestamps) {
      const date = new Date(timestamp * 1000).toISOString();
      console.log(`Fetching data for ${date}...`);

      const data = await fetchPriceData(timestamp);
      if (data.length > 0) {
        console.log(`Retrieved ${data.length} price points`);
        await storeDataInDB(data);
      } else {
        console.log(`No data available for ${date}`);
      }

      // Add a small delay to avoid rate limits
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    console.log("Historical data fetching complete.");
  } catch (error) {
    console.error("An error occurred:", error);
  } finally {
    // MongoDB disconnection commented out as requested
    /*
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
    */
  }
};

// Original functions from priceOracle.js
async function getLatestPriceUpdates(priceIds) {
  const baseUrl = "https://hermes.pyth.network/v2/updates/price/latest";
  const queryParams = priceIds
    .map((id) => `ids[]=${encodeURIComponent(id)}`)
    .join("&");
  const url = `${baseUrl}?${queryParams}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Raw API Response:", JSON.stringify(data, null, 2)); // Debugging log

    // Map price IDs to their respective symbols
    const priceIdToSymbol = {
      "2b89b9dc8fdf9f34709a5b106b472f0f39bb6ca9ce04b0fd7f2e971688e2e53b":
        "USDT/USD",
    };

    // Add symbol information to each price update
    const enhancedData = data.parsed.map((priceData) => ({
      ...priceData,
      symbol: priceIdToSymbol[priceData.id] || "Unknown",
    }));

    return enhancedData;
  } catch (error) {
    console.error("Error fetching price updates:", error.message);
    throw error;
  }
}

// Express route handler
async function getPythOracleData(req, res) {
  const priceIds = [
    "0x2b89b9dc8fdf9f34709a5b106b472f0f39bb6ca9ce04b0fd7f2e971688e2e53b", // USDT/USD
  ];

  try {
    const priceUpdates = await getLatestPriceUpdates(priceIds);
    if (res) {
      res.json({ success: true, data: priceUpdates });
    } else {
      console.log("Price Updates:", JSON.stringify(priceUpdates, null, 2));
    }
    return priceUpdates;
  } catch (error) {
    console.error("Error:", error.message);
    if (res) {
      res.status(500).json({ success: false, message: error.message });
    }
    throw error;
  }
}

// This code will run when the file is executed directly with Node
if (require.main === module) {
  console.log("Running USDT price oracle directly...");

  // Ask user which function to run
  const readline = require("readline").createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  readline.question(
    "Choose an option: (1) Get latest USDT price, (2) Fetch historical USDT data: ",
    async (answer) => {
      readline.close();

      if (answer === "1") {
        // Run the latest price function
        const runDirectly = async () => {
          try {
            await getPythOracleData(null, null);
          } catch (error) {
            console.error("Failed to get USDT price data:", error);
          }
        };
        await runDirectly();
      } else if (answer === "2") {
        // Run the historical data function
        await fetchHistoricalData();
      } else {
        console.log("Invalid option selected.");
      }
    }
  );
}

module.exports = {
  getPythOracleData,
  getLatestPriceUpdates,
  fetchHistoricalData,
};
