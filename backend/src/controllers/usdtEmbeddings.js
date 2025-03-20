require("dotenv").config();
const mongoose = require("mongoose");
const axios = require("axios");

// MongoDB Models
const PriceSchema = new mongoose.Schema({
  id: String,
  price: Number,
  confidence: Number,
  publish_time: Number,
  vectorEmbedding: [Number], // Array to store vector embeddings
});

const USDTPrice = mongoose.model("USDTPrice", PriceSchema, "usdt_prices");

// Function to get embeddings directly from OpenAI API
async function getEmbeddings(text) {
  try {
    const response = await axios.post(
      "https://api.openai.com/v1/embeddings",
      {
        model: "text-embedding-ada-002",
        input: text,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY || ""}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data.data[0].embedding;
  } catch (error) {
    console.error(
      "Error getting embeddings:",
      error.response ? error.response.data : error.message
    );
    throw error;
  }
}

// Format price data for embedding
const formatPriceDataForEmbedding = (priceData, cryptoType) => {
  // Create timestamp in human-readable format
  const date = new Date(priceData.publish_time * 1000);
  const formattedDate = date.toISOString().split("T")[0]; // YYYY-MM-DD format

  // Format the text that will be converted to embedding
  // Including both price and date information
  return `${cryptoType} price on ${formattedDate} was ${priceData.price.toFixed(
    4
  )} USD with a confidence of ${priceData.confidence}`;
};

// Generate and store embeddings for USDT collection
const generateUSDTEmbeddings = async () => {
  console.log("Starting to generate embeddings for USDT...");

  // Get all records without embeddings
  const records = await USDTPrice.find({ vectorEmbedding: { $exists: false } });
  console.log(`Found ${records.length} USDT records that need embeddings`);

  // Process in batches to avoid rate limiting
  const batchSize = 5;
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    console.log(
      `Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(
        records.length / batchSize
      )} for USDT`
    );

    // Process each record in the batch sequentially to avoid parallel API calls
    for (const record of batch) {
      try {
        // Format data for embedding
        const textToEmbed = formatPriceDataForEmbedding(record, "USDT");
        console.log(`Getting embedding for: ${textToEmbed}`);

        // Generate embedding
        const embeddingVector = await getEmbeddings(textToEmbed);

        // Update record with embedding
        await USDTPrice.findByIdAndUpdate(
          record._id,
          { $set: { vectorEmbedding: embeddingVector } },
          { new: true }
        );

        console.log(
          `Successfully updated USDT record ${record._id} with embedding`
        );

        // Add a small delay between individual API calls
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        console.error(
          `Error processing USDT record ${record._id}:`,
          error.message
        );
      }
    }

    // Add a larger delay between batches
    if (i + batchSize < records.length) {
      console.log("Pausing for rate limiting...");
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  console.log("Finished generating embeddings for USDT");
};

// Main function
const main = async () => {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(
      process.env.MONGO_URI || "mongodb://localhost:27017/rebtc"
    );
    console.log("Connected to MongoDB");

    // Generate embeddings for USDT records
    await generateUSDTEmbeddings();

    console.log("All USDT embeddings generated successfully");
  } catch (error) {
    console.error("An error occurred:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
};

// This code will run when the file is executed directly with Node
if (require.main === module) {
  // Check if OpenAI API key is set
  if (!process.env.OPENAI_API_KEY) {
    console.log(
      "Please set your OpenAI API key in the .env file or provide it below:"
    );

    const readline = require("readline").createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    readline.question("OpenAI API Key: ", (apiKey) => {
      readline.close();
      process.env.OPENAI_API_KEY = apiKey;
      main();
    });
  } else {
    main();
  }
}

module.exports = { generateUSDTEmbeddings };
