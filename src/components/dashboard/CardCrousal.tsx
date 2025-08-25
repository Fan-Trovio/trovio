'use client';
import React, { useState, useEffect } from 'react';
import Card from './Card';
const CardCrousal = ({vaults,onHandleChat}:{vaults:[], onHandleChat:Function}) => {
  const cards = [
    {
      bg:"./bg1.avif",
      hero:"./hero1.avif",
    },
    {
      bg:"./bg2.avif",
      hero:"./hero2.avif",
    },
    {
      bg:"./bg3.png",
      hero:"./hero3.avif",
    },
    {
      bg:"./bg4.avif",
      hero:"./hero4.avif",
    },
    {
      bg:"./bg5.avif",
      hero:"./hero5.avif",
    }
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [cardOpacity, setCardOpacity] = useState(1);
  const [touchStart, setTouchStart] = useState(0);

  const updateCarousel = (newIndex:number) => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    setCardOpacity(0);
    
    setTimeout(() => {
      setCurrentIndex((newIndex + vaults.length) % vaults.length);
      setCardOpacity(1);
    }, 300);

    setTimeout(() => {
      setIsAnimating(false);
    }, 800);
  };

  const getCardPosition = (index:number) => {
    const offset = (index - currentIndex + vaults.length) % vaults.length;
    
    if (offset === 0) return 'center';
    if (offset === 1) return 'right-1';
    if (offset === 2) return 'right-2';
    if (offset === vaults.length - 1) return 'left-1';
    if (offset === vaults.length - 2) return 'left-2';
    return 'hidden';
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowLeft') {
      updateCarousel(currentIndex - 1);
    } else if (e.key === 'ArrowRight') {
      updateCarousel(currentIndex + 1);
    }
  };

  const handleTouchStart = (e) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e) => {
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;
    const swipeThreshold = 50;

    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0) {
        updateCarousel(currentIndex + 1);
      } else {
        updateCarousel(currentIndex - 1);
      }
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex]);

  const cardPositionStyles = {
    center: 'z-10 scale-110 translate-z-0',
    'left-2': 'z-0 -translate-x-96 md:-translate-x-[400px] scale-75 opacity-70 blur-sm',
    'left-1': 'z-[5] -translate-x-48 md:-translate-x-[200px] scale-90 opacity-90 blur-[1px]',
    'right-1': 'z-[5] translate-x-48 md:translate-x-[200px] scale-90 opacity-90 blur-[1px]',
    'right-2': 'z-0 translate-x-96 md:translate-x-[400px] scale-75 opacity-70 blur-sm',
    'hidden': 'opacity-0 pointer-events-none'
  };

  return (
    <div 
      className="flex flex-col items-center justify-center overflow-hidden relative"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
     
      {/* Title */}
      <h1 className="  mt-4 text-3xl md:text-6xl font-black uppercase tracking-tight pointer-events-none whitespace-nowrap text-transparent bg-gradient-to-b from-violet-400/35 to-transparent bg-clip-text">
        Tokens
      </h1>

      {/* Carousel Container */}
      <div className="w-full max-w-6xl h-[380px] relative " style={{ perspective: '1000px' }}>
        {/* Left Arrow */}
        <button
          onClick={() => updateCarousel(currentIndex - 1)}
          className="absolute left-5 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-gradient-to-r from-violet-600/60 to-purple-600/60 hover:from-violet-500/80 hover:to-purple-500/80 text-white rounded-full flex items-center justify-center cursor-pointer z-20 transition-all duration-300 hover:scale-110 text-2xl border border-violet-400/30 outline-none pb-1 backdrop-blur-sm shadow-xl shadow-violet-500/25"
        >
          ‹
        </button>

        {/* Carousel Track */}
        <div 
          className="w-full h-full flex justify-center items-center relative transition-transform duration-700 ease-out"
          style={{ transformStyle: 'preserve-3d' }}
        >
          {vaults.map((vault, index) => {
            const position = getCardPosition(index);
            return (
              <div
                key={index}
                onClick={() => updateCarousel(index)}
                className={`absolute w-80 md:w-[320px] h-64  cursor-pointer transition-all duration-700 ease-out ${cardPositionStyles[position]}`}
                style={{ 
                  transformStyle: 'preserve-3d',
                  transform: position === 'left-2' ? 'translateX(-400px) scale(0.8) translateZ(-300px)' :
                            position === 'left-1' ? 'translateX(-200px) scale(0.9) translateZ(-100px)' :
                            position === 'center' ? 'scale(1.1) translateZ(0)' :
                            position === 'right-1' ? 'translateX(200px) scale(0.9) translateZ(-100px)' :
                            position === 'right-2' ? 'translateX(400px) scale(0.8) translateZ(-300px)' : ''
                }}
              >
               <Card vault={vault} bg={cards[index%cards.length].bg} hero={cards[index%cards.length].hero} onHandleChat={onHandleChat} />
              </div>
            );
          })}
        </div>

        {/* Right Arrow */}
        <button
          onClick={() => updateCarousel(currentIndex + 1)}
          className="absolute right-5 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-gradient-to-r from-violet-600/60 to-purple-600/60 hover:from-violet-500/80 hover:to-purple-500/80 text-white rounded-full flex items-center justify-center cursor-pointer z-20 transition-all duration-300 hover:scale-110 text-2xl border border-violet-400/30 outline-none pb-1 pl-0.5 backdrop-blur-sm shadow-xl shadow-violet-500/25"
        >
          ›
        </button>
      </div>

     
    </div>
  );
};

export default CardCrousal;