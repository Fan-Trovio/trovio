// components/ProgressionHubBanner.js
import Image from 'next/image';




const ProgressionHubBanner = () => {
  return (
    
      <div className="relative rounded-3xl min-h-[26rem]  md:overflow-hidden pt-[144px] pb-9 md:py-12 px-4 md:px-[3.25rem] border border-white/10 shadow-2xl shadow-violet-500/20 mb-8">
        
        {/* === Text Content === */}
        <div className="relative flex flex-col md-max:items-center md-max:text-center max-w-[520px] md:max-w-[31rem] md-max:mx-auto z-20">
          <h1 className="text-2xl md:text-[2.875rem] font-black uppercase md:leading-none">
            Unlock Rewards with <b className="text-brand-gold">Belabet</b>{" "}
            Progression Hub
          </h1>
          <span className="md:max-w-[28.75rem] text-sm text-tertiary font-medium mt-4 md:mt-5">
            Earn points, level up, and receive exclusive bonuses for reaching new
            milestones together with enhanced cashbacks. The higher your rank, the
            more you get – including increased cashback and premium rank rewards.
          </span>
          <button
            type="button"
            className="btn justify-center relative group w-full max-w-[11rem] mt-8 btn--text btn--quaternary btn--large"
          >
            <span className="btn-name">Learn More</span>
          </button>
        </div>

        {/* === Images === */}
        {/* Main Hero Character Image */}
        <Image
          alt="Progression Hub hero character"
          src={"/progressh.avif"}
          width={532}
          height={412}
          priority // Preload this image as it's likely "Largest Contentful Paint" (LCP)
          className="absolute md-max:-top-[52px] md:-bottom-0.5 left-1/2 md-lg:left-[calc(30.25rem+3%)] md:left-[calc(34.25rem+3%)] md-max:-translate-x-1/2 w-[296px] md:w-[33.25rem] md-max:max-w-none object-cover z-10 pointer-events-none"
        />

        {/* Decorative Level 1 Icon */}
        <Image
          alt="Level 1 icon"
          src={"/leve1.svg"} // Assuming you have a level 1 icon
          width={70}
          height={67}
          className="absolute top-10 md:top-10 left-[4%] md:left-[62.375rem] -rotate-[30deg] md:rotate-[30deg] w-[56px] md:w-[5.125rem] object-contain z-10 pointer-events-none"
        />

        {/* Decorative Level 10 Icon */}
        <Image
          alt="Level 10 icon"
          src={"/level2.svg"} // Assuming you have a level 10 icon
          width={106}
          height={73}
          className="absolute bottom-[56px] md:-bottom-4 left-[77%] md:left-[29.125rem] rotate-[34deg] blur-[1px] w-[64px] md:w-[9.625rem] object-contain z-10 pointer-events-none"
        />

        {/* Background Image */}
        <Image
          alt="Abstract background"
          src={'/banner.avif'} // Assuming you have a background image
          fill
          quality={90}
          className="object-cover md-max:rounded-2.5xl pointer-events-none"
          sizes="100vw"
        />
      </div>
    
  );
};

export default ProgressionHubBanner;