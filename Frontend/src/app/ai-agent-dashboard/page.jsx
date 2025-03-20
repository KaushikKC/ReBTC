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
  Legend
} from "chart.js";
import Navbar from "../components/Navbar";

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
  transition: { duration: 0.5 }
};

export default function AIAgentDashboard() {
  const [activeAgents, setActiveAgents] = useState([]);
  const [priceData, setPriceData] = useState(null);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [notifications, setNotifications] = useState([]);

  // Mock data for demonstration
  useEffect(() => {
    // Simulate loading active agents
    setActiveAgents([
      {
        id: 1,
        name: "Price Monitor",
        type: "Price Monitoring",
        status: "active",
        profit: "2.3%",
        risk: "low"
      },
      {
        id: 2,
        name: "Yield Optimizer",
        type: "Yield Optimization",
        status: "active",
        profit: "1.8%",
        risk: "medium"
      }
    ]);

    // Simulate price data
    setPriceData({
      labels: ["Jan", "Feb", "Mar", "Apr", "May"],
      datasets: [
        {
          label: "USDT Price",
          data: [1, 1.001, 0.999, 1.002, 1],
          borderColor: "rgb(75, 192, 192)"
        }
      ]
    });

    // Simulate notifications
    setNotifications([
      { id: 1, type: "success", message: "Profit target reached for Agent #1" },
      { id: 2, type: "warning", message: "Market volatility detected" }
    ]);
  }, []);

  const getRiskColor = risk => {
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Agents Panel */}
          <motion.div
            {...fadeInUp}
            className="bg-gray-800 rounded-lg p-6 col-span-1"
          >
            <h2 className="text-xl font-semibold mb-4">Active Agents</h2>
            <div className="space-y-4">
              {activeAgents.map(agent =>
                <div
                  key={agent.id}
                  className="bg-gray-700 rounded-lg p-4 cursor-pointer hover:bg-gray-600 transition-colors"
                  onClick={() => setSelectedAgent(agent)}
                >
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium">
                      {agent.name}
                    </h3>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${getRiskColor(
                        agent.risk
                      )}`}
                    >
                      {agent.risk}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mt-2">
                    {agent.type}
                  </p>
                  <p className="text-green-400 mt-1">
                    Profit: {agent.profit}
                  </p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Price Chart Panel */}
          <motion.div
            {...fadeInUp}
            className="bg-gray-800 rounded-lg p-6 col-span-1 lg:col-span-2"
          >
            <h2 className="text-xl font-semibold mb-4">Price Trends</h2>
            {priceData &&
              <div className="h-[300px]">
                <Line
                  data={priceData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        ticks: { color: "white" }
                      },
                      x: {
                        ticks: { color: "white" }
                      }
                    }
                  }}
                />
              </div>}
          </motion.div>

          {/* Notifications Panel */}
          <motion.div
            {...fadeInUp}
            className="bg-gray-800 rounded-lg p-6 col-span-1"
          >
            <h2 className="text-xl font-semibold mb-4">Notifications</h2>
            <div className="space-y-4">
              {notifications.map(notification =>
                <div
                  key={notification.id}
                  className={`p-4 rounded-lg ${notification.type === "success"
                    ? "bg-green-900/50"
                    : "bg-yellow-900/50"}`}
                >
                  <p className="text-sm">
                    {notification.message}
                  </p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            {...fadeInUp}
            className="bg-gray-800 rounded-lg p-6 col-span-1 lg:col-span-2"
          >
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="flex flex-wrap gap-4">
              <Button text="Create New Agent" />
              <Button text="View Analytics" />
              <Button text="Settings" />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
