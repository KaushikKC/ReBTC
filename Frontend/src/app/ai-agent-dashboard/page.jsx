"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Button from "../components/Button";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import Navbar from "../components/Navbar";
import axios from "axios";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

export default function AIAgentDashboard() {
  const [activeAgents, setActiveAgents] = useState([]);
  const [priceData, setPriceData] = useState(null);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stoppingAgent, setStoppingAgent] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);

  // Mock data for demonstration
  useEffect(() => {
    // Simulate loading active agents
    setActiveAgents([
      {
        id: 1,
        name: "Price Monitor",
        type: "Price Monitoring",
        status: "active",
        profit: "0.09",
        risk: "High",
      },
    ]);

    // Simulate price data
    setPriceData({
      labels: ["Jan", "Feb", "Mar", "Apr", "May"],
      datasets: [
        {
          label: "USDT Price",
          data: [1, 1.001, 0.999, 1.002, 1],
          borderColor: "rgb(75, 192, 192)",
        },
      ],
    });

    // Simulate notifications
    setNotifications([
      { id: 1, type: "success", message: "Profit target reached for Agent #1" },
      { id: 2, type: "warning", message: "Market volatility detected" },
    ]);
  }, []);

  const getRiskColor = (risk) => {
    switch (risk) {
      case "low":
        return "bg-green-500";
      case "medium":
        return "bg-yellow-500";
      case "high":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };
  const startAgent = async () => {
    setLoading(true);
    try {
      // Fix the port number to match your server (3000 instead of 4000)
      const response = await axios.post(
        "http://localhost:4000/api/v1/usdt-agent/start-monitoring",
        {
          monitoringPeriod: "1 month",
          profitMargin: 0.09,
          riskTolerance: "high",
        }
      );

      console.log("Raw API Response:", JSON.stringify(response.data, null, 2));

      // Check for different response structures
      if (response.data && response.data.data) {
        // This is the structure from the /monitor-usdt-price endpoint
        console.log("Processing data from monitor-usdt-price endpoint");

        // Clean up the analysis text by removing the technical issue message
        let fullAnalysis = response.data.data.usdt.analysis.fullAnalysis;
        console.log("Original analysis text:", fullAnalysis);

        // Check for all possible error messages and remove them
        const errorMessages = [
          "It appears there is a technical issue preventing the analysis tool from functioning correctly. However,",
          "I am currently unable to access the necessary tool to analyze the USDT price trend directly. However,",
          "It seems there is a technical issue preventing the analysis tool from functioning correctly. However,",
          "Based on the data provided and the inability to access the analysis tool due to technical issues, I will provide",
        ];

        for (const errorMsg of errorMessages) {
          if (fullAnalysis.includes(errorMsg)) {
            fullAnalysis = fullAnalysis.replace(errorMsg, "");
          }
        }

        console.log("Cleaned analysis text:", fullAnalysis);

        // Create a processed data object with the structure expected by the UI
        const processedData = {
          usdt: {
            ...response.data.data.usdt,
            analysis: {
              ...response.data.data.usdt.analysis,
              fullAnalysis: fullAnalysis.trim(),
            },
          },
          userPreferences: response.data.data.userPreferences,
        };

        console.log("Setting analysis result:", processedData);
        setAnalysisResult(processedData);
      } else if (response.data && response.data.initialAnalysis) {
        // This is the structure from the /start-monitoring endpoint
        console.log(
          "Processing initialAnalysis from start-monitoring endpoint"
        );

        // Clean up the analysis text by removing the technical issue message
        let fullAnalysis =
          response.data.initialAnalysis.usdt.analysis.fullAnalysis;
        console.log("Original analysis text:", fullAnalysis);

        // Check for all possible error messages and remove them
        const errorMessages = [
          "It appears there is a technical issue preventing the analysis tool from functioning correctly. However,",
          "I am currently unable to access the necessary tool to analyze the USDT price trend directly. However,",
          "It seems there is a technical issue preventing the analysis tool from functioning correctly. However,",
          "Based on the data provided and the inability to access the analysis tool due to technical issues, I will provide",
        ];

        for (const errorMsg of errorMessages) {
          if (fullAnalysis.includes(errorMsg)) {
            fullAnalysis = fullAnalysis.replace(errorMsg, "");
          }
        }

        console.log("Cleaned analysis text:", fullAnalysis);

        // Create a processed data object with the structure expected by the UI
        const processedData = {
          usdt: {
            ...response.data.initialAnalysis.usdt,
            analysis: {
              ...response.data.initialAnalysis.usdt.analysis,
              fullAnalysis: fullAnalysis.trim(),
            },
            shouldDepositLstBtc:
              response.data.shouldDepositLstBtc ||
              response.data.initialAnalysis.usdt.shouldDepositLstBtc,
          },
          userPreferences: response.data.userPreferences,
        };

        console.log("Setting analysis result:", processedData);
        setAnalysisResult(processedData);
      } else if (response.data && response.data.success) {
        // This is a generic success response, try to extract what we can
        console.log("Processing generic success response");

        // Check if we have a cron job result
        if (
          response.data.message &&
          response.data.message.includes("cron job started")
        ) {
          // Add a notification about the successful start
          setNotifications((prev) => [
            {
              id: Date.now(),
              type: "success",
              message:
                "USDT price monitoring cron job started successfully. Results will appear shortly.",
            },
            ...prev,
          ]);

          // We don't have immediate results, so don't update the analysis result yet
          console.log("Cron job started, waiting for results...");
        }
      } else {
        console.error("Unexpected response structure:", response.data);
        throw new Error("Unexpected response structure from server");
      }

      // Add a notification about the successful API call
      setNotifications((prev) => [
        {
          id: Date.now(),
          type: "success",
          message: "USDT price monitoring request sent successfully",
        },
        ...prev,
      ]);
    } catch (error) {
      console.error("Error starting agent:", error);
      setNotifications((prev) => [
        {
          id: Date.now(),
          type: "warning",
          message:
            "Failed to start agent: " + (error.message || "Unknown error"),
        },
        ...prev,
      ]);
    } finally {
      // Ensure loading state is always cleared, regardless of success or error
      setLoading(false);
    }
  };

  // New stopAgent function
  const stopAgent = async () => {
    setStoppingAgent(true);
    try {
      const response = await axios.post(
        "http://localhost:4000/api/v1/usdt-agent/stop-monitoring"
      );

      console.log("Stop agent response:", response.data);

      // Add a notification about the successful stop
      setNotifications((prev) => [
        {
          id: Date.now(),
          type: "success",
          message: "Agent stopped",
        },
        ...prev,
      ]);

      // If we have analysis results, we might want to clear them when the agent is stopped
      // Uncomment the next line if you want to clear the analysis results
      // setAnalysisResult(null);
    } catch (error) {
      console.error("Error stopping agent:", error);
      setNotifications((prev) => [
        {
          id: Date.now(),
          type: "warning",
          message:
            "Failed to stop agent: " + (error.message || "Unknown error"),
        },
        ...prev,
      ]);
    } finally {
      setStoppingAgent(false);
    }
  };

  return (
    <div className="relative z-10 font-['Quantify'] tracking-[1px] bg-[#0D1117] min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-grow flex flex-col items-center px-4 pt-32 justify-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-[35px] font-bold text-[#F7931A] text-center">
            AI Agent Dashboard
          </h1>
          <p className="text-gray-400 text-center">
            Monitor and manage your AI trading agents
          </p>
        </motion.div>
        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full max-w-7xl">
          {/* Active Agents Panel */}
          <motion.div
            {...fadeInUp}
            className="bg-gray-800 rounded-lg p-6 col-span-1"
          >
            <h2 className="text-xl font-semibold mb-4">Active Agents</h2>
            <div className="space-y-4">
              {activeAgents.map((agent) => (
                <div
                  key={agent.id}
                  className="bg-gray-700 rounded-lg p-4 cursor-pointer hover:bg-gray-600 transition-colors"
                  onClick={() => setSelectedAgent(agent)}
                >
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium">{agent.name}</h3>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${getRiskColor(
                        agent.risk
                      )}`}
                    >
                      {agent.risk}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mt-2">{agent.type}</p>
                  <p className="text-green-400 mt-1">Profit: {agent.profit}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Price Chart Panel */}
          <motion.div
            {...fadeInUp}
            className="bg-gray-800 rounded-lg p-6 col-span-1 lg:col-span-2"
          >
            <h2 className="text-xl font-semibold mb-4">Price Trends</h2>
            {priceData && (
              <div className="h-[300px]">
                <Line
                  data={priceData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        ticks: { color: "white" },
                      },
                      x: {
                        ticks: { color: "white" },
                      },
                    },
                  }}
                />
              </div>
            )}
          </motion.div>

          {/* Notifications Panel */}
          <motion.div
            {...fadeInUp}
            className="bg-gray-800 rounded-lg p-6 col-span-1"
          >
            <h2 className="text-xl font-semibold mb-4">Notifications</h2>
            <div className="space-y-4 max-h-[300px] overflow-y-auto">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 rounded-lg ${
                    notification.type === "success"
                      ? "bg-green-900/50"
                      : "bg-yellow-900/50"
                  }`}
                >
                  <p className="text-sm">{notification.message}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Quick Actions Panel */}
          <motion.div
            {...fadeInUp}
            className="bg-gray-800 rounded-lg p-6 col-span-1 lg:col-span-2"
          >
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="flex flex-wrap gap-4">
              <motion.button
                whileHover={{ scale: loading ? 1 : 1.05 }}
                whileTap={{ scale: loading ? 1 : 0.95 }}
                onClick={startAgent}
                disabled={loading}
                className="bg-[#F7931A] hover:bg-[#F7931A]/80 text-white px-6 py-3 rounded-md font-medium transition-colors duration-300 font-['Quantify'] disabled:opacity-70"
              >
                {loading ? "Starting..." : "Start Agent"}
              </motion.button>

              {/* New Stop Agent Button */}
              <motion.button
                whileHover={{ scale: stoppingAgent ? 1 : 1.05 }}
                whileTap={{ scale: stoppingAgent ? 1 : 0.95 }}
                onClick={stopAgent}
                disabled={stoppingAgent}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-md font-medium transition-colors duration-300 font-['Quantify'] disabled:opacity-70"
              >
                {stoppingAgent ? "Stopping..." : "Stop Agent"}
              </motion.button>
            </div>
          </motion.div>

          {/* Analysis Results Panel - Only shown when there are results */}
          {(loading || analysisResult) && (
            <motion.div
              {...fadeInUp}
              className="bg-gray-800 rounded-lg p-6 col-span-1 lg:col-span-3"
            >
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <div className="w-8 h-8 mr-2 rounded-full bg-[#F7931A] flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-5 h-5"
                  >
                    <path d="M11.7 2.805a.75.75 0 01.6 0A60.65 60.65 0 0122.83 8.72a.75.75 0 01-.231 1.337 49.949 49.949 0 00-9.902 3.912l-.003.002-.34.18a.75.75 0 01-.707 0A50.009 50.009 0 007.5 12.174v-.224c0-.131.067-.248.172-.311a54.614 54.614 0 014.653-2.52.75.75 0 00-.65-1.352 56.129 56.129 0 00-4.78 2.589 1.858 1.858 0 00-.859 1.228 49.803 49.803 0 00-4.634-1.527.75.75 0 01-.231-1.337A60.653 60.653 0 0111.7 2.805z" />
                    <path d="M13.06 15.473a48.45 48.45 0 017.666-3.282c.134 1.414.22 2.843.255 4.285a.75.75 0 01-.46.71 47.878 47.878 0 00-8.105 4.342.75.75 0 01-.832 0 47.877 47.877 0 00-8.104-4.342.75.75 0 01-.461-.71c.035-1.442.121-2.87.255-4.286A48.4 48.4 0 016 13.18v1.27a1.5 1.5 0 00-.14 2.508c-.09.38-.222.753-.397 1.11.452.213.901.434 1.346.661a6.729 6.729 0 00.551-1.608 1.5 1.5 0 00.14-2.67v-.645a48.549 48.549 0 013.44 1.668 2.25 2.25 0 002.12 0z" />
                    <path d="M4.462 19.462c.42-.419.753-.89 1-1.394.453.213.902.434 1.347.661a6.743 6.743 0 01-1.286 1.794.75.75 0 11-1.06-1.06z" />
                  </svg>
                </div>
                AI Analysis Results
              </h2>

              {loading ? (
                <div className="flex flex-col items-center justify-center p-10">
                  <div className="w-16 h-16 border-4 border-[#F7931A] border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-gray-400">Processing market data...</p>
                </div>
              ) : analysisResult ? (
                <div className="space-y-6">
                  {/* Current Price Card */}
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h3 className="text-lg font-medium mb-2 text-[#F7931A]">
                      Current USDT Price
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-gray-800 p-3 rounded-lg">
                        <p className="text-gray-400 text-sm">Price</p>
                        <p className="text-xl font-bold">
                          ${analysisResult.usdt.currentPrice.price.toFixed(6)}
                        </p>
                      </div>
                      <div className="bg-gray-800 p-3 rounded-lg">
                        <p className="text-gray-400 text-sm">Confidence</p>
                        <p className="text-xl font-bold">
                          {(
                            analysisResult.usdt.currentPrice.confidence * 100
                          ).toFixed(2)}
                          %
                        </p>
                      </div>
                      <div className="bg-gray-800 p-3 rounded-lg">
                        <p className="text-gray-400 text-sm">Date</p>
                        <p className="text-xl font-bold">
                          {new Date(
                            analysisResult.usdt.currentPrice.publish_time
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Similar Patterns Card */}
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h3 className="text-lg font-medium mb-2 text-[#F7931A]">
                      Historical Patterns
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full bg-gray-800 rounded-lg">
                        <thead>
                          <tr>
                            <th className="py-2 px-4 text-left">Date</th>
                            <th className="py-2 px-4 text-left">Price</th>
                            <th className="py-2 px-4 text-left">
                              Similarity Score
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {analysisResult.usdt.similarPatterns.map(
                            (pattern, index) => (
                              <tr
                                key={index}
                                className="border-t border-gray-700"
                              >
                                <td className="py-2 px-4">
                                  {new Date(
                                    pattern.publish_time
                                  ).toLocaleDateString()}
                                </td>
                                <td className="py-2 px-4">
                                  ${pattern.price.toFixed(6)}
                                </td>
                                <td className="py-2 px-4">
                                  {(pattern.score * 100).toFixed(0)}%
                                </td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Analysis Card */}
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h3 className="text-lg font-medium mb-2 text-[#F7931A]">
                      Analysis
                    </h3>
                    <div className="bg-gray-800 p-4 rounded-lg">
                      <div className="flex items-center mb-4">
                        <div
                          className={`w-4 h-4 rounded-full ${
                            analysisResult.usdt.shouldDepositLstBtc
                              ? "bg-green-500"
                              : "bg-red-500"
                          } mr-2`}
                        ></div>
                        <p className="font-medium">
                          {analysisResult.usdt.shouldDepositLstBtc
                            ? "Recommendation: Deposit lstBTC"
                            : "Recommendation: Do not deposit lstBTC"}
                        </p>
                      </div>

                      <div className="whitespace-pre-line text-gray-300">
                        {analysisResult.usdt.analysis.fullAnalysis
                          .split("\n")
                          .map((paragraph, i) => (
                            <p key={i} className="mb-2">
                              {paragraph}
                            </p>
                          ))}
                      </div>
                    </div>
                  </div>

                  {/* User Preferences Card */}
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h3 className="text-lg font-medium mb-2 text-[#F7931A]">
                      Your Preferences
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-gray-800 p-3 rounded-lg">
                        <p className="text-gray-400 text-sm">
                          Monitoring Period
                        </p>
                        <p className="text-xl font-bold">
                          {analysisResult.userPreferences.monitoringPeriod}
                        </p>
                      </div>
                      <div className="bg-gray-800 p-3 rounded-lg">
                        <p className="text-gray-400 text-sm">Target Profit</p>
                        <p className="text-xl font-bold">
                          {(
                            analysisResult.userPreferences.profitMargin * 100
                          ).toFixed(2)}
                          %
                        </p>
                      </div>
                      <div className="bg-gray-800 p-3 rounded-lg">
                        <p className="text-gray-400 text-sm">Risk Tolerance</p>
                        <p className="text-xl font-bold capitalize">
                          {analysisResult.userPreferences.riskTolerance}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
