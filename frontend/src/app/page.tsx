"use client";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Space_Grotesk } from "next/font/google";
import bg from "./assets/bg1.jpg";
import Navbar from "./components/Navbar";
import HeroSection from "./components/HeroSection";
import Features from "./components/Features";
import Footer from "./components/Footer";
import btcflow from "./assets/btc-flow.svg";
import { useEffect, useState } from "react";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

// Animation variants
const pageVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.3,
      duration: 0.6,
    },
  },
};

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: "easeOut",
    },
  },
};

const backgroundVariants = {
  hidden: { scale: 1.1, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 0.05,
    transition: {
      duration: 1.2,
      ease: "easeOut",
    },
  },
};

export default function Home() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <AnimatePresence>
      <motion.main
        className={`relative w-full ${spaceGrotesk.className} overflow-hidden`}
        variants={pageVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="font-['Quantify']">
          {/* Hero Section with Background */}
          <motion.div
            className="relative min-h-screen"
            variants={sectionVariants}
          >
            {/* Animated Background */}
            <motion.div
              className="absolute inset-0 w-full h-full -z-10"
              variants={backgroundVariants}
            >
              <Image
                src={bg}
                alt="Background globe icon"
                fill
                className="object-cover transition-transform duration-700 ease-out"
                priority
                sizes="(max-width: 768px) 100vw,
                       (max-width: 1200px) 100vw,
                       100vw"
                quality={90}
              />
              {/* Gradient Overlay */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0D1117]/10 to-[#0D1117]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1 }}
              />
            </motion.div>

            {/* Content */}
            <motion.div
              className="relative z-10 font-['Quantify'] tracking-[1px]"
              variants={sectionVariants}
            >
              <Navbar />
              <HeroSection />
            </motion.div>
          </motion.div>

          {/* Main Content Section */}
          <motion.div
            className="flex flex-col items-center bg-[#0D1117] rounded-t-[2.5rem] sm:rounded-t-[3rem] lg:rounded-t-[4rem] relative"
            variants={sectionVariants}
          >
            {/* Architecture Flow Section - Keeping as is */}
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.6 }}
              className="text-center text-[44px] font-bold text-white tracking-wide relative pt-10"
            >
              <span className="relative inline-block">
                Architecture Flow{" "}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-[#2F80ED]/20 via-[#F7931A]/20 to-[#2F80ED]/20 blur-xl -z-10"
                  animate={{
                    opacity: [0.5, 1, 0.5],
                    scale: [1, 1.05, 1],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                />
              </span>
            </motion.h2>

            <Image
              src={btcflow}
              alt="flow"
              className="w-full max-w-[1200px] px-4"
              priority
            />

            {/* Features Section with Enhanced Container */}
            <motion.div className="w-full" variants={sectionVariants}>
              <Features />
            </motion.div>
          </motion.div>

          {/* Footer with Animation */}
          <motion.footer variants={sectionVariants} className="relative z-10">
            <Footer />
          </motion.footer>

          {/* Page-wide Gradient Effects */}
          <motion.div
            className="fixed inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5 }}
          >
            <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-[#2F80ED]/10 rounded-full filter blur-[100px] transform -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#F7931A]/10 rounded-full filter blur-[100px] transform translate-x-1/2 translate-y-1/2" />
          </motion.div>
        </div>
      </motion.main>
    </AnimatePresence>
  );
}
