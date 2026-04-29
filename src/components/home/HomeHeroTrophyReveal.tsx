"use client";

import { motion } from "framer-motion";
import Image from "next/image";

const SCENES = [
  "/images/hero-trophy/scene1.png",
  "/images/hero-trophy/scene2.png",
  "/images/hero-trophy/scene3.png",
  "/images/hero-trophy/scene4.png",
] as const;

const easeOut = [0.16, 1, 0.3, 1] as const;
const LAYER_DURATION = 0.55;
const STEP_DELAY = 0.48;

type HomeHeroTrophyRevealProps = {
  reducedMotion: boolean;
};

function TrophyProgressiveStack() {
  return (
    <div className="relative mx-auto aspect-[4/5] w-full min-h-[200px] max-w-[min(280px,85vw)] md:max-w-[240px] lg:max-w-[280px]">
      <div className="absolute inset-0 z-[10]">
        <Image
          src={SCENES[0]}
          alt="World Cup 2026 trophy illustration, progressive reveal step 1 of 4"
          fill
          sizes="(max-width: 768px) 85vw, (max-width: 1024px) 240px, 280px"
          className="object-contain object-center drop-shadow-[0_12px_40px_rgba(0,0,0,0.45)]"
          priority
        />
      </div>

      {SCENES.slice(1).map((src, j) => {
        const i = j + 1;
        const z = 10 + i * 10;
        return (
          <motion.div
            key={src}
            className="absolute inset-0"
            style={{ zIndex: z }}
            initial={{ opacity: 0, scale: 0.98, filter: "blur(8px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            transition={{
              duration: LAYER_DURATION,
              delay: STEP_DELAY * i,
              ease: easeOut,
            }}
          >
            <Image
              src={src}
              alt=""
              fill
              sizes="(max-width: 768px) 85vw, (max-width: 1024px) 240px, 280px"
              className="object-contain object-center drop-shadow-[0_12px_40px_rgba(0,0,0,0.45)]"
              priority={i >= 2}
            />
          </motion.div>
        );
      })}
    </div>
  );
}

function TrophyReducedMotionFinal() {
  return (
    <div className="relative mx-auto aspect-[4/5] w-full min-h-[200px] max-w-[min(280px,85vw)] md:max-w-[240px] lg:max-w-[280px]">
      <Image
        src={SCENES[3]}
        alt="World Cup 2026 trophy with 2026 graphic"
        fill
        sizes="(max-width: 768px) 85vw, (max-width: 1024px) 240px, 280px"
        className="object-contain object-center drop-shadow-[0_12px_40px_rgba(0,0,0,0.45)]"
        priority
      />
    </div>
  );
}

export function HomeHeroTrophyReveal({ reducedMotion }: HomeHeroTrophyRevealProps) {
  return (
    <div className="w-full shrink-0 md:w-auto md:justify-self-end">
      <div className="flex justify-center pb-2 pt-0 md:justify-end md:pb-0 md:pt-1">
        {reducedMotion ? <TrophyReducedMotionFinal /> : <TrophyProgressiveStack />}
      </div>
    </div>
  );
}
