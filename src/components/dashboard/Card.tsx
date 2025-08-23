"use client";
import React from "react";
import Image from "next/image";
import Link from "next/link";

const Card = ({ vault,bg, hero,onHandleChat }:{vault:object,bg:string,hero:string,onHandleChat:Function}) => {
  return (
    <div
      className=" relative shadow-lg border border-white/10 rounded-3xl  bg-black/50 hover:bg-black/60 transition-all duration-300"
      style={{ width: 361, marginRight: 14 }}
    >
       
      {/* Card container with text and background image */}
      <div className="relative flex flex-col justify-end h-[230px] md:h-[14.75rem] bg-hero-card rounded-3xl px-6 md:px-8 py-7 transition-all overflow-hidden">
        <div className="absolute top-7 left-4 text-xs text-grey-400 font-pixel bg-grey-900/40 px-3 py-1 rounded-full border border-grey-700 shadow-sm">
                                            {vault.blockchain?.toUpperCase() || 'CHILIZ'}
                                        </div>
        {/* Card Text Content */}
        <span className="text-2xl font-bold mb-2 max-w-[16rem] z-10">
          {vault?.name || 'Vault Name'}
        </span>
        <span className="min-h-8 text-xs font-medium text-tertiary mb-3 max-w-[16rem] z-10">
         Total Prize : {vault?.total_prize || '0'} 
        </span>

        {/* Link component for internal navigation */}
        <button
          onClick={() => onHandleChat(vault)}
          className="btn justify-center self-start btn--text btn--primary btn--small z-10"
        >
          <span className="btn-name">Chat now <span className="text-lg pl-1">🌶️</span></span>
        </button>

        {/* Background Image using Next.js Image component */}
        <Image
          alt="Card background"
          src={bg.startsWith("/") ? bg : `/${bg.replace(/^\.?\//, "")}`} // <-- ✅ Corrected Path
          fill
          className="object-cover pointer-events-none"
          sizes="361px"
        />
      </div>

      {/* Floating Hero Image */}
      <Image
        alt="Card hero image"
        src={hero.startsWith("/") ? hero : `/${hero.replace(/^\.?\//, "")}`} // <-- Path correction
        width={314}
        height={231}
        className="absolute -top-4 md:-top-8 right-0 w-[248px] md:w-[19.625rem] object-contain pointer-events-none"
      />
    </div>
  );
};

export default Card;
