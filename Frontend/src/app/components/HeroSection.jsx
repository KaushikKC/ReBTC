import React from "react";
import Card from "./Card";
import Loader from "./Loader";
function HeroSection() {
  return (
    <div className=" flex items-center justify-between pt-15 px-10 ">
      <div className="flex flex-col items-center pt-10">
        <p className="text-[35px] py-5 tracking-[2px]">
          Earn sustainable yield on BTC using lstBTC & DeFi aggregation
          strategies.
        </p>
        <div className="flex gap-6 justify-center items-center">
          <div className="relative group">
            <div className="relative w-41 h-14 opacity-90 overflow-hidden rounded-xl bg-black z-10">
              <div className="absolute z-10 -translate-x-40 group-hover:translate-x-[30rem] ease-in transition-all duration-700 h-full w-44 bg-gradient-to-r from-gray-500 to-white/10 opacity-30 -skew-x-12" />
              <div className="absolute flex items-center justify-center text-white z-[1] opacity-90 rounded-2xl inset-0.5 bg-black">
                <button
                  name="text"
                  className="input font-semibold text-lg h-full opacity-90 w-full p-3 rounded-xl bg-black"
                >
                  Deposit
                </button>
              </div>
              <div className="absolute duration-1000 group-hover:animate-spin w-full h-[100px] bg-gradient-to-r from-[#2F80ED] to-[#F7931A] blur-[30px]" />
            </div>
          </div>
          <div className="relative group">
            <div className="relative w-41 h-14 opacity-90 overflow-hidden rounded-xl bg-black z-10">
              <div className="absolute z-10 -translate-x-44 group-hover:translate-x-[30rem] ease-in transition-all duration-700 h-full w-44 bg-gradient-to-r from-gray-500 to-white/10 opacity-30 -skew-x-12" />

              <div className="absolute flex items-center justify-center text-white z-[1] opacity-90 rounded-2xl inset-0.5 bg-black">
                <button
                  name="text"
                  className="input font-semibold text-lg h-full opacity-90 w-full p-3 rounded-xl bg-black"
                >
                  Withdraw
                </button>
              </div>
              <div className="absolute duration-1000 group-hover:animate-spin w-full h-[100px] bg-gradient-to-r from-[#2F80ED] to-[#F7931A] blur-[30px]" />
            </div>
          </div>
        </div>
        <Loader />
      </div>
      <Card />
    </div>
  );
}

export default HeroSection;
