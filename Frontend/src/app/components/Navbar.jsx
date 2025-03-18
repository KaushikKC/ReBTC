"use client";
import Image from "next/image";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import btc from "../assets/btc.svg";
import Button from "./Button";

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = ["HOME", "DASHBOARD", "PROFILE", "ABOUT", "CONNECT WALLET"];

  const handleWalletConnect = () => {
    // Add your wallet connection logic here
    console.log("Connecting wallet...");
  };

  const menuVariants = {
    closed: {
      opacity: 0,
      x: "100%",
      transition: {
        duration: 0.3,
        staggerChildren: 0.1,
        staggerDirection: -1
      }
    },
    open: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.3,
        staggerChildren: 0.1,
        staggerDirection: 1
      }
    }
  };

  const itemVariants = {
    closed: { opacity: 0, x: 20 },
    open: { opacity: 1, x: 0 }
  };

  const renderMenuItem = item => {
    if (item === "CONNECT WALLET") {
      return <Button key={item} text={item} onClick={handleWalletConnect} />;
    }
    return <Button key={item} text={item} />;
  };

  return (
    <nav className="fixed top-0 left-0 w-full z-50 p-5 flex justify-between">
      <div className="flex space-x-1 items-center">
        <p className="text-[30px] font-medium text-white">Re</p>
        <Image
          src={btc}
          alt="btc"
          width={21}
          height={21}
          className="h-[50px] w-[50px]"
        />
      </div>

      <div className="hidden lg:flex gap-8">
        {menuItems.map(item => renderMenuItem(item))}
      </div>

      <button
        className="lg:hidden flex flex-col justify-center items-center w-8 h-8 space-y-1.5"
        onClick={() => setIsOpen(!isOpen)}
      >
        <motion.span
          animate={isOpen ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }}
          className="w-6 h-0.5 bg-white block"
        />
        <motion.span
          animate={isOpen ? { opacity: 0 } : { opacity: 1 }}
          className="w-6 h-0.5 bg-white block"
        />
        <motion.span
          animate={isOpen ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }}
          className="w-6 h-0.5 bg-white block"
        />
      </button>

      <AnimatePresence>
        {isOpen &&
          <motion.div
            initial="closed"
            animate="open"
            exit="closed"
            variants={menuVariants}
            className="fixed top-[80px] right-0 bottom-0 w-full sm:w-[300px] bg-[#0D1117] shadow-xl lg:hidden"
          >
            <div className="flex flex-col items-center pt-8 gap-6">
              {menuItems.map(item =>
                <motion.div
                  key={item}
                  variants={itemVariants}
                  className="w-full px-8"
                >
                  {renderMenuItem(item)}
                </motion.div>
              )}
            </div>

            <motion.div
              className="absolute right-0 bottom-0 w-64 h-64 bg-[#F7931A]/10 blur-3xl -z-10"
              animate={{ opacity: [0.1, 0.2, 0.1] }}
              transition={{ duration: 4, repeat: Infinity }}
            />
          </motion.div>}
      </AnimatePresence>
    </nav>
  );
}

export default Navbar;
// "use client";
// import Image from "next/image";
// import React from "react";
// import btc from "../assets/btc.svg";
// import Button from "./Button";

// function Navbar() {
//   return (
//     <div className="fixed top-0 left-0 w-full  z-50 p-5 flex justify-between shadow-md">
//       <div className="flex space-x-1 items-center">
//         <p className="text-[30px] font-medium">Re</p>
//         <Image
//           src={btc}
//           alt="btc"
//           width={21}
//           height={21}
//           className="h-[50px] w-[50px]"
//         />
//       </div>
//       <div className="flex gap-8">
//         <Button text="HOME" />
//         <Button text="DASHBOARD" />
//         <Button text="PROFILE" />
//         <Button text="ABOUT" />
//         <Button text="CONNECT WALLET" />
//       </div>
//     </div>
//   );
// }

// export default Navbar;
