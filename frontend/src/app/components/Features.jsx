"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { FiPlus, FiMinus } from "react-icons/fi";

const featureData = [
  {
    id: 1,
    title: "Yield Optimization",
    shortDesc: "Maximize your BTC returns through smart DeFi strategies",
    longDesc:
      "Our advanced algorithms continuously monitor and adjust positions across multiple DeFi protocols to ensure the highest possible yields for your BTC. We implement risk-managed strategies that balance returns with security.",
    icon: "📈"
  },
  {
    id: 2,
    title: "Smart Aggregation",
    shortDesc: "Access multiple DeFi protocols through a single interface",
    longDesc:
      "Connect with various DeFi protocols seamlessly through our smart aggregation layer. We automatically distribute assets across platforms to maximize efficiency and minimize risks.",
    icon: "🔄"
  },
  {
    id: 3,
    title: "Security First",
    shortDesc: "Enterprise-grade security for your assets",
    longDesc:
      "Multiple security layers protect your assets, including multi-sig wallets, automated monitoring, and regular security audits. We prioritize the safety of your investments above all else.",
    icon: "🛡️"
  }
];

function Features() {
  const [expandedId, setExpandedId] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);

  return (
    <div className="pt-10 bg-[#0D1117] w-full relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[#0D1117] bg-[linear-gradient(to_right,#2F80ED20_1px,transparent_1px),linear-gradient(to_bottom,#2F80ED20_1px,transparent_1px)] bg-[size:32px_32px]" />

        <div className="absolute inset-0 bg-[#0D1117]/40" />
      </div>
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.05 }}
        transition={{ duration: 0.6 }}
        className="text-center text-[44px] font-bold text-white pb-10 tracking-wide relative"
      >
        <span className="relative inline-block">
          Key Features
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-[#2F80ED]/20 via-[#F7931A]/20 to-[#2F80ED]/20 blur-xl -z-10"
            animate={{
              opacity: [0.5, 1, 0.5],
              scale: [1, 1.05, 1]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        </span>
      </motion.h2>

      <div className="max-w-[1400px] mx-auto">
        <div className="w-full space-y-8 px-4 sm:px-6 lg:px-8">
          {featureData.map((feature, index) =>
            <motion.div
              key={feature.id}
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              onHoverStart={() => setHoveredId(feature.id)}
              onHoverEnd={() => setHoveredId(null)}
              className="relative w-full"
            >
              <motion.div
                layoutId={`card-container-${feature.id}`}
                className={`bg-[#1A1F26] rounded-2xl p-8 cursor-pointer border-2 transition-all duration-300 w-full mx-auto h-fit
                    ${expandedId === feature.id
                      ? "border-[#F7931A]"
                      : "border-[#2F80ED]/30"}
                    ${hoveredId === feature.id
                      ? "shadow-lg shadow-[#2F80ED]/20"
                      : ""}
                  `}
                onClick={() =>
                  setExpandedId(expandedId === feature.id ? null : feature.id)}
                whileHover={{
                  scale: 1.01,
                  translateX: 5
                }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 20
                }}
              >
                <div className="flex items-start gap-6 w-full">
                  <motion.div
                    className="text-5xl flex-shrink-0"
                    animate={{
                      rotate: hoveredId === feature.id ? [0, -10, 10, 0] : 0
                    }}
                    transition={{ duration: 0.5 }}
                  >
                    {feature.icon}
                  </motion.div>

                  <div className="flex-grow min-w-0">
                    <div className="flex justify-between items-center mb-2">
                      <motion.h3
                        className="text-2xl font-bold text-white relative inline-block"
                        whileHover={{ scale: 1.02 }}
                      >
                        <span className="relative inline-block">
                          {feature.title}
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-[#2F80ED]/20 via-[#F7931A]/20 to-[#2F80ED]/20 blur-xl -z-10"
                            initial={{ opacity: 0 }}
                            animate={{
                              opacity:
                                hoveredId === feature.id ? [0.5, 1, 0.5] : 0,
                              scale: hoveredId === feature.id ? [1, 1.05, 1] : 1
                            }}
                            transition={{
                              duration: 3,
                              repeat: hoveredId === feature.id ? Infinity : 0,
                              ease: "linear"
                            }}
                          />

                          {/* Additional layer for more visibility */}
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-[#2F80ED]/10 via-[#F7931A]/10 to-[#2F80ED]/10 blur-2xl -z-20"
                            initial={{ opacity: 0 }}
                            animate={{
                              opacity: hoveredId === feature.id ? 1 : 0
                            }}
                            transition={{ duration: 0.3 }}
                          />
                        </span>
                      </motion.h3>
                      <motion.div
                        whileHover={{ scale: 1.1, rotate: 180 }}
                        whileTap={{ scale: 0.95 }}
                        className={`p-3 rounded-full transition-colors duration-300 flex-shrink-0
                            ${expandedId === feature.id
                              ? "bg-[#F7931A]"
                              : "bg-[#2F80ED]"}
                            ${hoveredId === feature.id
                              ? "shadow-md shadow-[#2F80ED]/50"
                              : ""}
                          `}
                      >
                        {expandedId === feature.id
                          ? <FiMinus className="text-white w-6 h-6" />
                          : <FiPlus className="text-white w-6 h-6" />}
                      </motion.div>
                    </div>
                    <AnimatePresence mode="wait">
                      {expandedId === feature.id
                        ? <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                          >
                            <p className="text-[#E5E7EB] leading-relaxed text-lg font-spaceGrotesk">
                              {feature.longDesc}
                            </p>
                          </motion.div>
                        : <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-[#E5E7EB] text-lg font-spaceGrotesk"
                          >
                            {feature.shortDesc}
                          </motion.p>}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-[#2F80ED]/10 via-transparent to-[#F7931A]/10 rounded-2xl -z-10"
                initial={{ opacity: 0 }}
                animate={{
                  opacity: hoveredId === feature.id ? 1 : 0,
                  scale: hoveredId === feature.id ? 1.05 : 1
                }}
                transition={{ duration: 0.3 }}
              />
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Features;
