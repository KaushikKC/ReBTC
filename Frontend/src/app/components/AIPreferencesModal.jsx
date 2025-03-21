// import React, { useState } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import { FaTimes } from "react-icons/fa";
// import Link from "next/link";
// import TimeLoader from "./TimeLoader";

// const AIPreferencesModal = ({ isOpen, onClose, preferences, setPreferences }) => {
//   const [isProcessing, setIsProcessing] = useState(false);
//   const [isSuccess, setIsSuccess] = useState(false);
//   const [processingStep, setProcessingStep] = useState("");

//   if (!isOpen) return null;

//   const handleLaunchAgent = () => {
//     setIsProcessing(true);
//     setProcessingStep("Initializing AI Agent...");

//     // Simulate processing
//     setTimeout(() => {
//       setIsSuccess(true);
//       setProcessingStep("AI Agent launched successfully!");
      
//       // Close modal after success
//       setTimeout(() => {
//         onClose();
//       }, 2000);
//     }, 2000);
//   };

//   return (
//     <motion.div
//       initial={{ opacity: 0 }}
//       animate={{ opacity: 1 }}
//       exit={{ opacity: 0 }}
//       className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
//       onClick={onClose}
//     >
//       <motion.div
//         initial={{ scale: 0.95 }}
//         animate={{ scale: 1 }}
//         exit={{ scale: 0.95 }}
//         onClick={(e) => e.stopPropagation()}
//         className="bg-[#1C2128] rounded-xl p-6 w-full max-w-md relative"
//       >
//         {/* Header */}
//         <div className="flex justify-between items-center mb-6">
//           <h2 className="text-xl font-bold text-white">AI Agent Preferences</h2>
//           <button
//             onClick={onClose}
//             className="text-gray-400 hover:text-white transition-colors"
//             disabled={isProcessing}
//           >
//             <FaTimes size={20} />
//           </button>
//         </div>

//         {/* Form Fields */}
//         <div className="space-y-4 mb-6">
//           {/* Risk Tolerance */}
//           <div className="mb-6">
//             <label className="block text-gray-300 text-sm mb-2">
//               Risk Tolerance
//             </label>
//             <div className="relative">
//               <select
//                 value={preferences.riskTolerance}
//                 onChange={(e) =>
//                   setPreferences({
//                     ...preferences,
//                     riskTolerance: e.target.value,
//                   })
//                 }
//                 className="w-full bg-[#2D333B] text-white p-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2F80ED] transition-all"
//                 disabled={isProcessing}
//               >
//                 <option value="low">Low Risk</option>
//                 <option value="medium">Medium Risk</option>
//                 <option value="high">High Risk</option>
//               </select>
//             </div>
//           </div>

//           {/* Profit Margin */}
//           <div className="mb-6">
//             <label className="block text-gray-300 text-sm mb-2">
//               Profit Margin (%)
//             </label>
//             <div className="relative">
//               <input
//                 type="number"
//                 value={preferences.profitMargin}
//                 onChange={(e) =>
//                   setPreferences({
//                     ...preferences,
//                     profitMargin: parseFloat(e.target.value),
//                   })
//                 }
//                 className="w-full bg-[#2D333B] text-white p-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2F80ED] transition-all"
//                 placeholder="Enter target profit margin"
//                 min="0"
//                 max="100"
//                 step="0.1"
//                 disabled={isProcessing}
//               />
//               <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400">
//                 %
//               </span>
//             </div>
//           </div>

//           {/* Monitoring Period */}
//           <div className="mb-6">
//             <label className="block text-gray-300 text-sm mb-2">
//               Monitoring Period
//             </label>
//             <div className="relative">
//               <select
//                 value={preferences.monitoringPeriod}
//                 onChange={(e) =>
//                   setPreferences({
//                     ...preferences,
//                     monitoringPeriod: e.target.value,
//                   })
//                 }
//                 className="w-full bg-[#2D333B] text-white p-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2F80ED] transition-all"
//                 disabled={isProcessing}
//               >
//                 <option value="1 hour">1 Hour</option>
//                 <option value="1 day">1 Day</option>
//                 <option value="1 week">1 Week</option>
//                 <option value="1 month">1 Month</option>
//               </select>
//             </div>
//           </div>

//           {/* Summary Display */}
//           <motion.div
//             animate={{ opacity: 1 }}
//             className="bg-[#2D333B] p-4 rounded-lg mb-6"
//           >
//             <div className="flex justify-between items-center">
//               <span className="text-gray-300">Risk Level</span>
//               <span className="text-[#F7931A] font-bold">
//                 {preferences.riskTolerance.toUpperCase()}
//               </span>
//             </div>
//             <div className="flex justify-between items-center mt-2">
//               <span className="text-gray-300">Target Profit</span>
//               <span className="text-white">{preferences.profitMargin}%</span>
//             </div>
//           </motion.div>
//         </div>

//         {/* Action Buttons */}
//         <div className="flex gap-4">
//           <motion.button
//             whileHover={{ scale: 1.02 }}
//             whileTap={{ scale: 0.98 }}
//             onClick={onClose}
//             className="flex-1 bg-[#2D333B] text-white py-4 rounded-lg font-medium hover:bg-[#2D333B]/80 transition-colors"
//             disabled={isProcessing}
//           >
//             Cancel
//           </motion.button>

//           <motion.button
//             whileHover={{ scale: 1.02 }}
//             whileTap={{ scale: 0.98 }}
//             onClick={handleLaunchAgent}
//             className="flex-1 bg-[#F7931A] hover:bg-[#F7931A]/90 text-white py-4 rounded-lg font-medium transition-colors"
//             disabled={isProcessing}
//           >
//             {isProcessing ? "Processing..." : "Launch Agent"}
//           </motion.button>
//         </div>

//         {/* Processing Overlay */}
//         <AnimatePresence>
//           {isProcessing && (
//             <motion.div
//               initial={{ opacity: 0 }}
//               animate={{ opacity: 1 }}
//               exit={{ opacity: 0 }}
//               className="absolute inset-0 bg-[#1C2128]/90 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center gap-4"
//             >
//               {!isSuccess ? (
//                 <>
//                   <TimeLoader />
//                   <motion.p
//                     initial={{ opacity: 0, y: 10 }}
//                     animate={{ opacity: 1, y: 0 }}
//                     className="text-white font-medium"
//                   >
//                     {processingStep}
//                   </motion.p>
//                 </>
//               ) : (
//                 <motion.div
//                   initial={{ scale: 0.5, opacity: 0 }}
//                   animate={{ scale: 1, opacity: 1 }}
//                   className="flex flex-col items-center gap-4"
//                 >
//                   <div className="text-[#4CAF50] text-5xl">✓</div>
//                   <p className="text-white font-medium">{processingStep}</p>
//                 </motion.div>
//               )}
//             </motion.div>
//           )}
//         </AnimatePresence>
//       </motion.div>
//     </motion.div>
//   );
// };

// export default AIPreferencesModal;

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes } from "react-icons/fa";
import { useRouter } from "next/navigation";
import TimeLoader from "./TimeLoader";

const AIPreferencesModal = ({ isOpen, onClose, preferences, setPreferences }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [processingStep, setProcessingStep] = useState("");
  const router = useRouter();

  if (!isOpen) return null;

  const handleLaunchAgent = () => {
    setIsProcessing(true);
    setProcessingStep("Initializing AI Agent...");

    setTimeout(() => {
      setProcessingStep("Analyzing market data...");
    }, 1000);

    setTimeout(() => {
      setProcessingStep("Generating personalized recommendation...");
    }, 2000);

    setTimeout(() => {
      // Simulate AI analysis response
      const aiResponse = {
        fullAnalysis:
          "Based on recent trends, USDT price remains stable, and your profit target is achievable. AI recommends depositing lstBTC as collateral for USDT borrowing.",
        shouldDepositLstBtc: true,
        userPreferences: { ...preferences },
      };

      // Store the result in localStorage
      localStorage.setItem("aiAnalysisResult", JSON.stringify(aiResponse));

      setIsSuccess(true);
      setProcessingStep("AI Agent launched successfully!");

      setTimeout(() => {
        onClose();
        router.push("/ai-agent-dashboard");
      }, 2000);
    }, 3000);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#1C2128] rounded-xl p-6 w-full max-w-md relative"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">AI Agent Preferences</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <FaTimes size={20} />
          </button>
        </div>

        {/* Preferences Input Fields */}
        <div className="space-y-4 mb-6">
          <label className="block text-gray-300 text-sm mb-2">Risk Tolerance</label>
          <select
            value={preferences.riskTolerance}
            onChange={(e) => setPreferences({ ...preferences, riskTolerance: e.target.value })}
            className="w-full bg-[#2D333B] text-white p-4 rounded-lg"
            disabled={isProcessing}
          >
            <option value="low">Low Risk</option>
            <option value="medium">Medium Risk</option>
            <option value="high">High Risk</option>
          </select>
        </div>

        <div className="flex gap-4">
          <button onClick={onClose} className="bg-gray-500 text-white py-4 rounded-lg w-full" disabled={isProcessing}>
            Cancel
          </button>
          <button onClick={handleLaunchAgent} className="bg-[#F7931A] text-white py-4 rounded-lg w-full" disabled={isProcessing}>
            {isProcessing ? "Processing..." : "Launch AI Agent"}
          </button>
        </div>

        <AnimatePresence>
          {isProcessing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#1C2128]/90 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center gap-4"
            >
              {!isSuccess ? (
                <>
                  <TimeLoader />
                  <motion.p className="text-white font-medium">{processingStep}</motion.p>
                </>
              ) : (
                <motion.div className="flex flex-col items-center gap-4">
                  <div className="text-[#4CAF50] text-5xl">✓</div>
                  <p className="text-white font-medium">{processingStep}</p>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export default AIPreferencesModal;
