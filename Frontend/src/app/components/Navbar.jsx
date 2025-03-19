"use client";
import Image from "next/image";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import btc from "../assets/btc.svg";
import Button from "./Button";
import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useLogin, usePrivy, useLogout } from "@privy-io/react-auth";
import { useAccount, useBalance } from "wagmi";
import { useRouter } from "next/navigation";

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const { ready, authenticated, user: privyUser } = usePrivy();
  const { address } = useAccount();
  const { data } = useBalance({ address });

  const disableLogin = !ready || (ready && authenticated);

  const { login } = useLogin({
    onComplete: () => {
      router.push("/");
    },
    onError: (error) => {
      console.log(error);
    },
  });

  const { logout } = useLogout({
    onSuccess: () => {
      router.push("/");
    },
  });

  const menuItems = ["DASHBOARD", "PROFILE", "ABOUT"];

  const handleWalletConnect = () => {
    if (authenticated) {
      logout();
    } else {
      login();
    }
  };

  const menuVariants = {
    closed: {
      opacity: 0,
      x: "100%",
      transition: {
        duration: 0.3,
        staggerChildren: 0.1,
        staggerDirection: -1,
      },
    },
    open: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.3,
        staggerChildren: 0.1,
        staggerDirection: 1,
      },
    },
  };

  const itemVariants = {
    closed: { opacity: 0, x: 20 },
    open: { opacity: 1, x: 0 },
  };

  const renderMenuItem = (item) => {
    if (item === "CONNECT WALLET") {
      return <Button key={item} text={item} onClick={handleWalletConnect} className="bg-[#F7931A] hover:bg-[#F7931A]/80 text-white px-4 py-2 rounded-md text-sm transition-colors duration-300"
/>;
    }
    return <Button key={item} text={item} className="font-['Quantify']"/>;
  };

  // Get wallet display text
  const getWalletDisplayText = () => {
    if (authenticated && privyUser?.wallet) {
      return `${privyUser.wallet.address.slice(
        0,
        4
      )}...${privyUser.wallet.address.slice(-4)}`;
    }
    return "CONNECT WALLET";
  };

  return (
    <nav className="fixed top-0 left-0 w-full z-50 p-5 flex justify-between">
      <Link href="/" className="flex space-x-1 items-center">
        <p className="text-[30px] font-medium text-white">Re</p>
        <Image
          src={btc}
          alt="btc"
          width={21}
          height={21}
          className="h-[50px] w-[50px]"
        />
      </Link>

      <div className="hidden lg:flex gap-8 items-center">
        {menuItems.map((item) => renderMenuItem(item))}

  

        {/* Privy Login Button */}
        <button
          disabled={disableLogin}
          onClick={login}
          className="bg-[#F7931A] hover:bg-[#F7931A]/80 text-white px-4 py-2 rounded-md text-sm transition-colors duration-300 font-['Quantify']"
        >
          {getWalletDisplayText()}
        </button>

        {authenticated && (
          <button
            onClick={logout}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm transition-colors duration-300"
          >
            Logout
          </button>
        )}
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
        {isOpen && (
          <motion.div
            initial="closed"
            animate="open"
            exit="closed"
            variants={menuVariants}
            className="fixed top-[80px] right-0 bottom-0 w-full sm:w-[300px] bg-[#0D1117] shadow-xl lg:hidden"
          >
            <div className="flex flex-col items-center pt-8 gap-6">
              {menuItems.map((item) => (
                <motion.div
                  key={item}
                  variants={itemVariants}
                  className="w-full px-8"
                >
                  {renderMenuItem(item)}
                </motion.div>
              ))}

              {/* Mobile Connect Button */}
              <motion.div variants={itemVariants} className="w-full px-8">
                <ConnectButton />
              </motion.div>

              {/* Mobile Privy Login Button */}
              <motion.div variants={itemVariants} className="w-full px-8">
                <button
                  disabled={disableLogin}
                  onClick={login}
                  className="w-full bg-[#F7931A] hover:bg-[#F7931A]/80 text-white px-4 py-2 rounded-md text-sm transition-colors duration-300"
                >
                  {getWalletDisplayText()}
                </button>
              </motion.div>

              {/* Mobile Logout Button */}
              {authenticated && (
                <motion.div variants={itemVariants} className="w-full px-8">
                  <button
                    onClick={logout}
                    className="w-full bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm transition-colors duration-300"
                  >
                    Logout
                  </button>
                </motion.div>
              )}
            </div>

            <motion.div
              className="absolute right-0 bottom-0 w-64 h-64 bg-[#F7931A]/10 blur-3xl -z-10"
              animate={{ opacity: [0.1, 0.2, 0.1] }}
              transition={{ duration: 4, repeat: Infinity }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

export default Navbar;
