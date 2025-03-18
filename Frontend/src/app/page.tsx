"use client";
import { motion } from "framer-motion";
import Image from "next/image";
import { Space_Grotesk } from "next/font/google";
import bg from "./assets/bg1.jpg";
import Navbar from "./components/Navbar";
import HeroSection from "./components/HeroSection";
import Features from "./components/Features";
import Footer from "./components/Footer";
import btcflow from "./assets/btc-flow.svg";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"]
});

export default function Home() {
  return (
    <main className={`relative w-full ${spaceGrotesk.className}`}>
      <div className="font-['Quantify']">
        <div className="relative min-h-screen">
          <div className="absolute inset-0 w-full h-full -z-10">
            <Image
              src={bg}
              alt="Background globe icon"
              fill
              className="object-cover opacity-[0.05]"
              priority
              sizes="100vw"
            />
          </div>
          <div className="relative z-10 font-['Quantify'] tracking-[1px]">
            <Navbar />
            <HeroSection />
          </div>
        </div>

        <div className="flex flex-col items-center bg-[#0D1117] rounded-4xl">
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

          <Image
            src={btcflow}
            alt="flow"
            className="w-full max-w-[1200px] px-4"
            priority
          />
          <Features />
        </div>
        <Footer />
      </div>
    </main>
  );
}
