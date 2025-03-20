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
  console.log("Running price oracle directly...");
  // Create a mock version that runs without Express
  const runDirectly = async () => {
    try {
      await getPythOracleData(null, null);
    } catch (error) {
      console.error("Failed to get price data:", error);
    }
  };

  runDirectly();
}

module.exports = { getPythOracleData, getLatestPriceUpdates };
