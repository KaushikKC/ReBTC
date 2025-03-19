import { motion } from "framer-motion";
import Link from "next/link";

const Button = ({ text, href }) => {
  const getHref = () => {
    // if (text === "HOME") return "/";
    if (text === "CONNECT WALLET") return "#"; // Handle wallet connection separately
    return `/${text.toLowerCase()}`;
  };

  return (
    <Link href={href || getHref()} className="no-underline">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="group relative flex items-center gap-2 border-none bg-transparent p-0 m-0 cursor-pointer font-medium text-[20px] space-x-5 font-['Quantify']"
      >
        <motion.p className="m-0 relative text-[#111] group-hover:text-[#F7931A] transition-colors duration-300 text-white">
          {text}
        </motion.p>

        <div className="absolute bottom-[-7px] left-0 h-[2px] w-0 bg-[#F7931A] group-hover:w-full transition-all duration-300 ease-out" />
      </motion.button>
    </Link>
  );
};

export default Button;
