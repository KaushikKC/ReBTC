import { motion } from "framer-motion";

const InsuranceStatsCard = ({ title, value, icon: Icon }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-[#1C2128] p-6 rounded-xl"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="p-3 bg-[#2D333B] rounded-lg">
          <Icon className="text-[#F7931A] text-xl" />
        </div>
        <h3 className="text-gray-400">
          {title}
        </h3>
      </div>
      <p className="text-2xl font-bold text-white">
        {value}
      </p>
    </motion.div>
  );
};

export default InsuranceStatsCard;
