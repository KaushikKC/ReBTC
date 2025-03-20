const { getLatestPriceUpdates } = require("../controllers/priceOracle");
const { MongoClient } = require("mongodb");
const { ChatOpenAI } = require("@langchain/openai");
const { MemorySaver } = require("@langchain/langgraph");
const { createReactAgent } = require("@langchain/langgraph/prebuilt");
const { HumanMessage } = require("@langchain/core/messages");
const { OpenAIEmbeddings } = require("@langchain/openai");
const cron = require("node-cron");
require("dotenv").config();

// MongoDB Configuration
const mongoUri = process.env.MONGO_URI || ""; //if not working then will try with uri manually
const dbName = "Cluster0";
const usdtCollectionName = "usdt_prices";

// OpenAI Configuration
const openaiApiKey = process.env.OPENAI_API_KEY;
const llm = new ChatOpenAI({
  modelName: "gpt-4-turbo",
  temperature: 0.2,
  openAIApiKey: openaiApiKey,
});

// Initialize embeddings
const embeddings = new OpenAIEmbeddings({
  openAIApiKey: openaiApiKey,
});

// Function to convert price data to vector embeddings
async function generateEmbedding(priceData) {
  try {
    const textToEmbed = `USDT Price: ${priceData.price.toFixed(
      4
    )}, Confidence: ${priceData.confidence}, Timestamp: ${
      priceData.publish_time
    }, Symbol: ${priceData.symbol || "USDT/USD"}`;
    console.log(`Generating embedding for: ${textToEmbed}`);

    const embedding = await embeddings.embedQuery(textToEmbed);
    return embedding;
  } catch (error) {
    console.error("Error generating embedding:", error);
    throw error;
  }
}

// Function to find similar historical USDT price patterns
async function findSimilarPricePatterns(embedding) {
  const client = new MongoClient(mongoUri);
  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection(usdtCollectionName);

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

// Function to analyze USDT price trends and make lstBTC deposit decisions
async function analyzeUsdtAndMakeDecision(
  currentPrice,
  similarPatterns,
  userPreferences
) {
  try {
    console.log("inside analyzeUsdtAndMakeDecision");

    const tools = [
      {
        type: "function",
        name: "analyze_usdt_price_trend",
        description:
          "Analyze USDT price trends and determine if lstBTC should be deposited as collateral",
        function: {
          name: "analyze_usdt_price_trend",
          description:
            "Analyze USDT price trends and determine if lstBTC should be deposited as collateral",
          parameters: {
            type: "object",
            properties: {
              currentPrice: {
                type: "object",
                description: "The current USDT price data",
                properties: {
                  price: {
                    type: "number",
                    description: "The current USDT price in USD",
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
                description: "Array of similar historical USDT price patterns",
                items: {
                  type: "object",
                  properties: {
                    price: {
                      type: "number",
                      description: "Historical USDT price in USD",
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
              userPreferences: {
                type: "object",
                description: "User preferences for the agent",
                properties: {
                  monitoringPeriod: {
                    type: "string",
                    description:
                      "How long to monitor (e.g., '1 week', '1 month')",
                  },
                  profitMargin: {
                    type: "number",
                    description:
                      "Target profit margin percentage (e.g., 1.0 for 1%)",
                  },
                  riskTolerance: {
                    type: "string",
                    description: "User's risk tolerance (low, medium, high)",
                    enum: ["low", "medium", "high"],
                  },
                },
              },
            },
            required: ["currentPrice", "historicalPatterns", "userPreferences"],
          },
        },
        func: async ({ currentPrice, historicalPatterns, userPreferences }) => {
          // Calculate price trend based on historical data
          const sortedPatterns = [...historicalPatterns].sort(
            (a, b) => new Date(a.publish_time) - new Date(b.publish_time)
          );

          // Calculate average price and trend
          const avgHistoricalPrice =
            sortedPatterns.reduce((sum, pattern) => sum + pattern.price, 0) /
            (sortedPatterns.length || 1);

          // Calculate price trend percentage
          const priceTrendPercentage =
            ((currentPrice.price - avgHistoricalPrice) / avgHistoricalPrice) *
            100;

          // Predict future price based on trend
          const predictedPriceNextWeek =
            currentPrice.price * (1 + priceTrendPercentage / 100);

          // Calculate potential profit percentage
          const potentialProfitPercentage =
            ((predictedPriceNextWeek - currentPrice.price) /
              currentPrice.price) *
            100;

          // Decision logic based on user preferences
          let shouldDeposit = false;
          let confidence = "medium";

          // Adjust decision based on risk tolerance
          if (userPreferences.riskTolerance === "high") {
            shouldDeposit =
              potentialProfitPercentage > userPreferences.profitMargin * 0.8;
            confidence =
              potentialProfitPercentage > userPreferences.profitMargin
                ? "high"
                : "medium";
          } else if (userPreferences.riskTolerance === "medium") {
            shouldDeposit =
              potentialProfitPercentage > userPreferences.profitMargin;
            confidence =
              potentialProfitPercentage > userPreferences.profitMargin * 1.2
                ? "high"
                : "medium";
          } else {
            // low risk tolerance
            shouldDeposit =
              potentialProfitPercentage > userPreferences.profitMargin * 1.2;
            confidence =
              potentialProfitPercentage > userPreferences.profitMargin * 1.5
                ? "high"
                : "medium";
          }

          return {
            currentUsdtPrice: currentPrice.price,
            avgHistoricalPrice,
            priceTrendPercentage: parseFloat(priceTrendPercentage.toFixed(2)),
            predictedPriceNextWeek: parseFloat(
              predictedPriceNextWeek.toFixed(4)
            ),
            potentialProfitPercentage: parseFloat(
              potentialProfitPercentage.toFixed(2)
            ),
            shouldDepositLstBtc: shouldDeposit,
            confidence,
            reasoning: `Based on historical patterns, USDT price is trending ${
              priceTrendPercentage > 0 ? "up" : "down"
            } by ${Math.abs(priceTrendPercentage).toFixed(
              2
            )}%. The predicted price for next week is $${predictedPriceNextWeek.toFixed(
              4
            )}, which represents a potential ${
              potentialProfitPercentage > 0 ? "profit" : "loss"
            } of ${Math.abs(potentialProfitPercentage).toFixed(2)}%.`,
          };
        },
      },
    ];

    // Create the agent with a specific message modifier
    const agent = createReactAgent({
      llm,
      tools,
      messageModifier: `You are a USDT price analysis agent that helps determine when to deposit lstBTC as collateral. Your job is to analyze current USDT price data compared to historical patterns and determine if depositing lstBTC would be profitable within the user's specified timeframe.
        
        First, analyze the current USDT price and compare it to the historical patterns.
        Then, use the analyze_usdt_price_trend tool to get a detailed analysis.
        Finally, provide a clear recommendation on whether to deposit lstBTC as collateral based on the predicted USDT price trend.
        
        Be data-driven in your analysis and consider the user's risk tolerance and profit margin preferences.
        Always conclude with a specific recommendation and explain your reasoning.`,
    });

    const prompt = `Analyze the following USDT price data:
          Current USDT Price: ${currentPrice.price} USD
          Current Confidence: ${currentPrice.confidence}
          Current Timestamp: ${currentPrice.publish_time}
          Similar Historical Patterns: ${JSON.stringify(
            similarPatterns,
            null,
            2
          )}
          User Preferences: 
          - Monitoring Period: ${userPreferences.monitoringPeriod}
          - Target Profit Margin: ${userPreferences.profitMargin}%
          - Risk Tolerance: ${userPreferences.riskTolerance}
          
          Based on this data, should the user deposit lstBTC as collateral to obtain USDT? Will the USDT price increase enough within the next week to meet the user's profit margin target?`;

    // Invoke the agent
    const result = await agent.invoke(
      {
        messages: [new HumanMessage(prompt)],
      },
      {
        recursionLimit: 50,
        maxIterations: 10,
      }
    );

    const lastMessage = result.messages[result.messages.length - 1];
    const analysisText = lastMessage.content;

    // Extract decision from analysis text
    let shouldDepositLstBtc = false;

    // Check if the analysis recommends depositing
    if (
      analysisText.toLowerCase().includes("should deposit") ||
      analysisText.toLowerCase().includes("recommend depositing") ||
      analysisText.toLowerCase().includes("deposit lstbtc")
    ) {
      shouldDepositLstBtc = true;
    }

    return {
      shouldDepositLstBtc,
      fullAnalysis: analysisText,
    };
  } catch (error) {
    console.error("Error analyzing USDT price:", error);
    throw error;
  }
}

// Main monitoring function
exports.monitorUsdtPrice = async (req, res) => {
  try {
    // Get user preferences from request or use defaults
    const {
      monitoringPeriod = "1 month",
      profitMargin = 1.0, // 1% profit margin
      riskTolerance = "medium",
    } = req.body;

    // Validate inputs
    const validRiskTolerances = ["low", "medium", "high"];
    if (!validRiskTolerances.includes(riskTolerance)) {
      return res.status(400).json({
        success: false,
        error: "Invalid risk tolerance. Must be one of: low, medium, high",
      });
    }

    // Getting the recent USDT price data
    const priceIds = [
      "0x2b89b9dc8fdf9f34709a5b106b472f0f39bb6ca9ce04b0fd7f2e971688e2e53b", // USDT/USD
    ];

    // Get price updates from Pyth Oracle
    const priceUpdates = await getLatestPriceUpdates(priceIds);

    const processedUpdates = priceUpdates.map((update) => {
      // Extract the price, confidence, and timestamp
      const price =
        parseFloat(update.price.price) * Math.pow(10, update.price.expo);
      const confidence =
        parseFloat(update.price.conf) * Math.pow(10, update.price.expo);
      const publish_time = new Date(
        update.price.publish_time * 1000
      ).toISOString();

      return {
        id: update.id,
        price,
        confidence,
        publish_time,
        symbol: update.symbol || "USDT/USD",
      };
    });

    console.log(
      "Processed USDT price update:",
      JSON.stringify(processedUpdates, null, 2)
    );

    // Extract USDT data
    const usdtData = processedUpdates.find(
      (update) => update.symbol === "USDT/USD"
    );

    if (!usdtData) {
      return res.status(500).json({
        success: false,
        error: "Failed to retrieve price data for USDT",
      });
    }

    // Generate embedding for current price data
    const usdtEmbedding = await generateEmbedding(usdtData);

    // Find similar historical patterns
    let usdtSimilarPatterns = await findSimilarPricePatterns(usdtEmbedding);

    // If no similar patterns are found, create some default patterns for analysis
    if (!usdtSimilarPatterns || usdtSimilarPatterns.length === 0) {
      console.log("No USDT similar patterns found, creating default patterns");
      // Create some default patterns based on current price with slight variations
      usdtSimilarPatterns = [
        {
          price: usdtData.price * 0.998, // 0.2% lower
          confidence: usdtData.confidence,
          publish_time: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          score: 0.95,
        },
        {
          price: usdtData.price * 1.002, // 0.2% higher
          confidence: usdtData.confidence,
          publish_time: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
          score: 0.9,
        },
        {
          price: usdtData.price * 0.997, // 0.3% lower
          confidence: usdtData.confidence,
          publish_time: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
          score: 0.85,
        },
      ];
    }

    console.log(
      "USDT Similar Patterns:",
      JSON.stringify(usdtSimilarPatterns, null, 2)
    );

    // User preferences
    const userPreferences = {
      monitoringPeriod,
      profitMargin,
      riskTolerance,
    };

    // Analyze USDT price and make decision
    const usdtAnalysis = await analyzeUsdtAndMakeDecision(
      usdtData,
      usdtSimilarPatterns,
      userPreferences
    );

    // Return the analysis results
    return res.status(200).json({
      success: true,
      message: "USDT price monitoring and analysis completed",
      data: {
        usdt: {
          currentPrice: usdtData,
          similarPatterns: usdtSimilarPatterns,
          analysis: usdtAnalysis,
          shouldDepositLstBtc: usdtAnalysis.shouldDepositLstBtc,
        },
        userPreferences,
      },
    });
  } catch (error) {
    console.error("USDT Agent monitoring error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to monitor USDT price",
      details: error.message,
    });
  }
};

// Setup cron job for periodic monitoring
exports.setupMonitoringCron = () => {
  cron.schedule("0 */6 * * *", async () => {
    console.log("Running USDT price monitoring job...");
    try {
      // Create a mock request and response for the cron job
      const mockReq = {
        body: {
          monitoringPeriod: "1 month",
          profitMargin: 1.0,
          riskTolerance: "medium",
        },
      };
      const mockRes = {
        status: (code) => ({
          json: (data) => {
            console.log(`Cron job completed with status ${code}`);
            if (code >= 400) {
              console.error("Error in cron job:", data);
            } else {
              console.log("Cron job results:", JSON.stringify(data, null, 2));

              // If the agent recommends depositing lstBTC, log it prominently
              if (data.data?.usdt?.shouldDepositLstBtc) {
                console.log(
                  "🚨 ALERT: Agent recommends depositing lstBTC as collateral! 🚨"
                );
                // Here you would call your smart contract function to deposit lstBTC
                // depositLstBtc();
              }
            }
          },
        }),
      };

      await exports.monitorUsdtPrice(mockReq, mockRes);
    } catch (error) {
      console.error("Error in USDT monitoring cron job:", error);
    }
  });
  console.log("USDT price monitoring cron job scheduled (every 6 hours)");
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

    // Get interval from request or use default (every 6 hours)
    // const { interval = "0 */6 * * *" } = req.body;
    // 2min
    const { interval = "*/2 * * * *" } = req.body;
    cronJob = cron.schedule(interval, async () => {
      console.log(
        `Running USDT price monitoring job at ${new Date().toISOString()}...`
      );
      try {
        // Create a mock request with user preferences
        const mockReq = {
          body: {
            monitoringPeriod: req.body.monitoringPeriod || "1 month",
            profitMargin: req.body.profitMargin || 1.0,
            riskTolerance: req.body.riskTolerance || "medium",
          },
        };

        const mockRes = {
          status: (code) => ({
            json: (data) => {
              console.log(`Cron job completed with status ${code}`);
              if (code >= 400) {
                console.error("Error in cron job:", data);
              } else {
                console.log("Cron job results:", JSON.stringify(data, null, 2));

                // If the agent recommends depositing lstBTC, log it prominently
                if (data.data?.usdt?.shouldDepositLstBtc) {
                  console.log(
                    "🚨 ALERT: Agent recommends depositing lstBTC as collateral! 🚨"
                  );
                  // Here you would call your smart contract function to deposit lstBTC
                  // depositLstBtc();
                }
              }
            },
          }),
        };

        await exports.monitorUsdtPrice(mockReq, mockRes);
      } catch (error) {
        console.error("Error in USDT monitoring cron job:", error);
      }
    });

    return res.status(200).json({
      success: true,
      message: `USDT price monitoring cron job started with schedule: ${interval}`,
      userPreferences: {
        monitoringPeriod: req.body.monitoringPeriod || "1 month",
        profitMargin: req.body.profitMargin || 1.0,
        riskTolerance: req.body.riskTolerance || "medium",
      },
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
      message: "USDT price monitoring cron job stopped",
    });
  } catch (error) {
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
    return await exports.monitorUsdtPrice(req, res);
  } catch (error) {
    console.error("Manual trigger error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to manually trigger USDT price monitoring",
      details: error.message,
    });
  }
};
