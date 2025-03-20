const {
  getLatestPriceUpdates,
} = require("../controllers/oracle_controller/pythOracleDataController");
const { MongoClient } = require("mongodb");
const { ChatOpenAI } = require("@langchain/openai");
const { MemorySaver } = require("@langchain/langgraph");
const { createReactAgent } = require("@langchain/langgraph/prebuilt");
const { HumanMessage } = require("@langchain/core/messages");
const { OpenAIEmbeddings } = require("@langchain/openai");
const cron = require("node-cron");
require("dotenv").config();

// Function to convert price data to vector embeddings
async function generateEmbedding(priceData) {
  try {
    // Format the price to a human-readable number
    const formattedPrice =
      typeof priceData.price === "number" && priceData.price > 1000000
        ? (priceData.price / 1000000000000000000).toFixed(2)
        : priceData.price;

    const textToEmbed = `Price: ${formattedPrice}, Confidence: ${
      priceData.confidence
    }, Timestamp: ${priceData.publish_time}, Symbol: ${
      priceData.symbol || "Unknown"
    }`;
    console.log(`Generating embedding for: ${textToEmbed}`);

    const embedding = await embeddings.embedQuery(textToEmbed);
    return embedding;
  } catch (error) {
    console.error("Error generating embedding:", error);
    throw error;
  }
}

// Function to find similar historical price patterns
async function findSimilarPricePatterns(embedding, assetType) {
  const client = new MongoClient(mongoUri);
  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection(
      assetType === "BTC" ? btcCollectionName : ethCollectionName
    );

    const results = await collection
      .aggregate([
        {
          $vectorSearch: {
            index: "vector_index",
            path: "vectorEmbedding",
            queryVector: embedding,
            numCandidates: 100,
            limit: 5,
          },
        },
        {
          $project: {
            _id: 0,
            price: 1,
            publish_time: 1,
            confidence: 1,
            score: { $meta: "vectorSearchScore" },
          },
        },
      ])
      .toArray();

    return results;
  } finally {
    await client.close();
  }
}

// Function to analyze risk using LangChain and OpenAI
async function analyzeRisk(currentPrice, similarPatterns, strategy) {
  try {
    const tools = [
      {
        type: "function",
        name: "calculate_risk_score",
        description: "Calculate a risk score based on price patterns",
        function: {
          name: "calculate_risk_score",
          description: "Calculate a risk score based on price patterns",
          parameters: {
            type: "object",
            properties: {
              currentPrice: {
                type: "object",
                description: "The current price data",
                properties: {
                  price: {
                    type: "number",
                    description: "The current price in USD",
                  },
                  confidence: {
                    type: "number",
                    description: "Confidence level of the price",
                  },
                  publish_time: {
                    type: "string",
                    description: "Timestamp when the price was published",
                  },
                },
              },
              historicalPatterns: {
                type: "array",
                description: "Array of similar historical price patterns",
                items: {
                  type: "object",
                  properties: {
                    price: {
                      type: "number",
                      description: "Historical price in USD",
                    },
                    confidence: {
                      type: "number",
                      description: "Confidence level of the historical price",
                    },
                    publish_time: {
                      type: "string",
                      description:
                        "Timestamp when the historical price was published",
                    },
                    score: {
                      type: "number",
                      description:
                        "Similarity score to the current price pattern",
                    },
                  },
                },
              },
              strategy: {
                type: "string",
                description:
                  "The risk strategy (low risk, moderate risk, high risk)",
                enum: ["low risk", "moderate risk", "high risk"],
              },
            },
            required: ["currentPrice", "historicalPatterns", "strategy"],
          },
        },
        func: async ({ currentPrice, historicalPatterns, strategy }) => {
          // Implement a more realistic risk calculation based on the data
          // This is a simple example - you would want more sophisticated logic in production
          let riskScore = 50; // Default moderate risk
          let recommendation = "hold";

          // Calculate average historical price
          const avgHistoricalPrice =
            historicalPatterns.reduce(
              (sum, pattern) => sum + pattern.price,
              0
            ) / (historicalPatterns.length || 1);

          // Calculate price trend (positive = rising, negative = falling)
          const priceTrend = currentPrice.price - avgHistoricalPrice;

          // Adjust risk score based on strategy
          if (strategy === "low risk") {
            riskScore = 30 + (priceTrend > 0 ? 10 : -10);
          } else if (strategy === "moderate risk") {
            riskScore = 50 + (priceTrend > 0 ? 15 : -15);
          } else if (strategy === "high risk") {
            riskScore = 70 + (priceTrend > 0 ? 20 : -20);
          }

          // Ensure risk score is within 0-100 range
          riskScore = Math.max(0, Math.min(100, riskScore));

          // Determine recommendation based on price trend and risk score
          if (priceTrend > 0 && riskScore > 60) {
            recommendation = "Price is likely to rise. Consider buying.";
          } else if (priceTrend < 0 && riskScore > 60) {
            recommendation = "Price is likely to fall. Consider selling.";
          } else {
            recommendation =
              "Market conditions are uncertain. Consider holding.";
          }

          return {
            riskScore,
            recommendation,
          };
        },
      },
    ];

    // Create the agent with a more specific message modifier to help it complete the task
    const agent = createReactAgent({
      llm,
      tools,
      messageModifier: `You are a cryptocurrency trading risk analyst. Your job is to analyze current price data compared to historical patterns and determine a risk score from 0-100.
  
  For the user's risk strategy:
  - "low risk" means conservative approach, prioritize capital preservation
  - "moderate risk" means balanced approach, seeking moderate growth with reasonable risk
  - "high risk" means aggressive approach, seeking high growth with higher risk tolerance
  
  First, analyze the current price and compare it to the historical patterns.
  Then, use the calculate_risk_score tool to get a risk assessment.
  Finally, provide a risk score and a clear recommendation on whether to place a bet on the market rising or falling.
  
  Be concise and data-driven in your analysis. Always conclude with a specific recommendation.`,
    });

    const prompt = `Analyze the following cryptocurrency data:
        Current Price: ${currentPrice.price} USD
        Current Confidence: ${currentPrice.confidence}
        Current Timestamp: ${currentPrice.publish_time}
        Similar Historical Patterns: ${JSON.stringify(similarPatterns, null, 2)}
        User Risk Strategy: ${strategy}`;

    // Invoke the agent with recursion limit configuration
    const result = await agent.invoke(
      {
        messages: [new HumanMessage(prompt)],
      },
      {
        recursionLimit: 50, // Increase the recursion limit
        maxIterations: 10, // Add a maximum iterations limit as a safeguard
      }
    );

    const lastMessage = result.messages[result.messages.length - 1];
    const analysisText = lastMessage.content;

    // Extract risk score and recommendation from analysis text
    // This is a simple extraction method - you might want to improve this
    let riskScore = 50; // Default
    let recommendation = "hold"; // Default
    let confidence = "medium"; // Default
    let shouldBet = false; // Default

    // Try to extract risk score
    const riskScoreMatch = analysisText.match(/risk score:?\s*(\d+)/i);
    if (riskScoreMatch && riskScoreMatch[1]) {
      riskScore = parseInt(riskScoreMatch[1]);
    }

    // Try to extract recommendation
    if (
      analysisText.toLowerCase().includes("buy") ||
      analysisText.toLowerCase().includes("rising")
    ) {
      recommendation = "buy";
      shouldBet = true;
    } else if (
      analysisText.toLowerCase().includes("sell") ||
      analysisText.toLowerCase().includes("falling")
    ) {
      recommendation = "sell";
      shouldBet = true;
    }

    // Try to extract confidence
    if (analysisText.toLowerCase().includes("high confidence")) {
      confidence = "high";
    } else if (analysisText.toLowerCase().includes("low confidence")) {
      confidence = "low";
    }

    return {
      riskScore,
      recommendation,
      confidence,
      shouldBet,
      fullAnalysis: analysisText,
    };
  } catch (error) {
    console.error("Error analyzing risk:", error);
    throw error;
  }
}

// Main monitoring function
exports.monitorAgents = async (req, res) => {
  try {
    // Get strategy from request or use default
    const { strategy = "moderate risk" } = req.body;

    // Validate strategy
    const validStrategies = ["low risk", "moderate risk", "high risk"];
    if (!validStrategies.includes(strategy)) {
      return res.status(400).json({
        success: false,
        error:
          "Invalid strategy. Must be one of: low risk, moderate risk, high risk",
      });
    }

    // Getting the recent price data for the current timestamp using Pyth open-API
    const priceIds = [
      "e62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43", // BTC
      "ff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace", // ETH
    ];

    // Get price updates from Pyth Oracle
    const priceUpdates = await getLatestPriceUpdates(priceIds);

    const processedUpdates = priceUpdates.map((update) => {
      // Extract the price, confidence, and timestamp from the nested structure
      // Convert the large numbers to standard decimal values
      const price =
        parseFloat(update.price.price) / Math.pow(10, update.price.expo);
      const confidence =
        parseFloat(update.price.conf) / Math.pow(10, update.price.expo);
      const publish_time = new Date(
        update.price.publish_time * 1000
      ).toISOString();

      return {
        id: update.id,
        price,
        confidence,
        publish_time,
        symbol: update.symbol || "Unknown",
      };
    });

    console.log(
      "Processed price updates:",
      JSON.stringify(processedUpdates, null, 2)
    );

    // Extract BTC and ETH data
    const btcData = processedUpdates.find(
      (update) => update.id === priceIds[0] || update.symbol === "BTC/USD"
    );
    const ethData = processedUpdates.find(
      (update) => update.id === priceIds[1] || update.symbol === "ETH/USD"
    );

    if (!btcData || !ethData) {
      return res.status(500).json({
        success: false,
        error: "Failed to retrieve price data for BTC or ETH",
      });
    }

    // Generate embeddings for current price data
    const btcEmbedding = await generateEmbedding(btcData);
    const ethEmbedding = await generateEmbedding(ethData);

    // Find similar historical patterns
    let btcSimilarPatterns = await findSimilarPricePatterns(
      btcEmbedding,
      "BTC"
    );
    let ethSimilarPatterns = await findSimilarPricePatterns(
      ethEmbedding,
      "ETH"
    );

    // If no similar patterns are found, create some default patterns for analysis
    if (!btcSimilarPatterns || btcSimilarPatterns.length === 0) {
      console.log("No BTC similar patterns found, creating default patterns");
      // Create some default patterns based on current price with slight variations
      btcSimilarPatterns = [
        {
          price: btcData.price * 0.98, // 2% lower
          confidence: btcData.confidence,
          publish_time: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          score: 0.95,
        },
        {
          price: btcData.price * 1.02, // 2% higher
          confidence: btcData.confidence,
          publish_time: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
          score: 0.9,
        },
        {
          price: btcData.price * 0.97, // 3% lower
          confidence: btcData.confidence,
          publish_time: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
          score: 0.85,
        },
      ];
    }

    if (!ethSimilarPatterns || ethSimilarPatterns.length === 0) {
      console.log("No ETH similar patterns found, creating default patterns");
      // Create some default patterns based on current price with slight variations
      ethSimilarPatterns = [
        {
          price: ethData.price * 0.98, // 2% lower
          confidence: ethData.confidence,
          publish_time: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          score: 0.95,
        },
        {
          price: ethData.price * 1.03, // 3% higher
          confidence: ethData.confidence,
          publish_time: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
          score: 0.9,
        },
        {
          price: ethData.price * 0.96, // 4% lower
          confidence: ethData.confidence,
          publish_time: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
          score: 0.85,
        },
      ];
    }

    console.log(
      "BTC Similar Patterns:",
      JSON.stringify(btcSimilarPatterns, null, 2)
    );
    console.log(
      "ETH Similar Patterns:",
      JSON.stringify(ethSimilarPatterns, null, 2)
    );

    // Analyze risk for both BTC and ETH
    const btcRiskAnalysis = await analyzeRisk(
      btcData,
      btcSimilarPatterns,
      strategy
    );
    const ethRiskAnalysis = await analyzeRisk(
      ethData,
      ethSimilarPatterns,
      strategy
    );

    // Return the analysis results
    return res.status(200).json({
      success: true,
      message: "Monitoring and risk analysis completed",
      data: {
        btc: {
          currentPrice: btcData,
          similarPatterns: btcSimilarPatterns,
          riskAnalysis: btcRiskAnalysis,
        },
        eth: {
          currentPrice: ethData,
          similarPatterns: ethSimilarPatterns,
          riskAnalysis: ethRiskAnalysis,
        },
        strategy,
      },
    });
  } catch (error) {
    console.error("AI Agent monitoring error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to monitor AI agents",
      details: error.message,
    });
  }
};

// Setup cron job
exports.setupMonitoringCron = () => {
  cron.schedule("0 */6 * * *", async () => {
    console.log("Running AI agent monitoring job...");
    try {
      // Create a mock request and response for the cron job
      const mockReq = { body: { strategy: "moderate risk" } };
      const mockRes = {
        status: (code) => ({
          json: (data) => {
            console.log(`Cron job completed with status ${code}`);
            if (code >= 400) {
              console.error("Error in cron job:", data);
            } else {
              console.log("Cron job results:", JSON.stringify(data, null, 2));
            }
          },
        }),
      };

      await exports.monitorAgents(mockReq, mockRes);
    } catch (error) {
      console.error("Error in monitoring cron job:", error);
    }
  });
  console.log("AI agent monitoring cron job scheduled");
};

// Store the cron job instance so we can stop it later
let cronJob = null;

// Start the cron job with custom interval
exports.startCronJob = (req, res) => {
  try {
    if (cronJob) {
      return res.status(400).json({
        success: false,
        message: "Cron job is already running",
      });
    }

    // Get interval from request or use default (every 2 minutes)
    const { interval = "*/5 * * * *" } = req.body;

    cronJob = cron.schedule(interval, async () => {
      console.log(
        `Running AI agent monitoring job at ${new Date().toISOString()}...`
      );
      try {
        // Create a mock request and response for the cron job
        const mockReq = { body: { strategy: "moderate risk" } };
        const mockRes = {
          status: (code) => ({
            json: (data) => {
              console.log(`Cron job completed with status ${code}`);
              if (code >= 400) {
                console.error("Error in cron job:", data);
              } else {
                console.log("Cron job results:", JSON.stringify(data, null, 2));
              }
            },
          }),
        };

        await exports.monitorAgents(mockReq, mockRes);
      } catch (error) {
        console.error("Error in monitoring cron job:", error);
      }
    });

    return res.status(200).json({
      success: true,
      message: `AI agent monitoring cron job started with schedule: ${interval}`,
    });
  } catch (error) {
    console.error("Error starting cron job:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to start cron job",
      details: error.message,
    });
  }
};

// Stop the cron job
exports.stopCronJob = (req, res) => {
  try {
    if (!cronJob) {
      return res.status(400).json({
        success: false,
        message: "No cron job is currently running",
      });
    }

    cronJob.stop();
    cronJob = null;

    return res.status(200).json({
      success: true,
      message: "AI agent monitoring cron job stopped",
    });
  } catch (err) {
    console.error("Error stopping cron job:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to stop cron job",
      details: error.message,
    });
  }
};

// Manual trigger function
exports.triggerMonitoring = async (req, res) => {
  try {
    return await exports.monitorAgents(req, res);
  } catch (error) {
    console.error("Manual trigger error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to manually trigger monitoring",
      details: error.message,
    });
  }
};
