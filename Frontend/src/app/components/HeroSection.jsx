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
          <button className="bg-[#F7931A] hover:bg-[#F7931A]/80 text-white font-bold py-3 px-6 rounded-full shadow-lg shadow-neutral-950 transform transition-all duration-500 ease-in-out hover:scale-110 hover:brightness-110 hover:animate-pulse ">
            Deposit
          </button>
          <button className="bg-[#F7931A] hover:bg-[#F7931A]/80 text-white font-bold py-3 px-6 rounded-full shadow-lg shadow-neutral-950 transform transition-all duration-500 ease-in-out hover:scale-110 hover:brightness-110 hover:animate-pulse ">
            Withdraw
          </button>
        </div>
        <Loader />
      </div>
      <Card />
    </div>
  );
}

export default HeroSection;
