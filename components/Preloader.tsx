"use client";

import { useEffect, useRef, useState } from "react";
import { useLoading } from "@/components/LoadingContext";
import gsap from "gsap";
import SplitType from "split-type";

export default function Preloader() {
  const { progress, setIsComplete } = useLoading();
  const preloaderRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLHeadingElement>(null);
  const [animatedProgress, setAnimatedProgress] = useState(0);

  // Smoothly interpolate the progress number for visual appeal
  useEffect(() => {
    const obj = { val: animatedProgress };
    const tween = gsap.to(obj, {
      val: progress,
      duration: 0.6,
      ease: "power2.out",
      onUpdate: () => {
        setAnimatedProgress(Math.round(obj.val));
      },
    });

    return () => {
      tween.kill();
    };
  }, [progress, animatedProgress]);

  // Initial logo animation on mount
  useEffect(() => {
    if (logoRef.current) {
      const split = new SplitType(logoRef.current, { types: "chars" });
      gsap.from(split.chars, {
        opacity: 0,
        y: 50,
        rotateX: -45,
        stagger: 0.08,
        duration: 1.2,
        ease: "power4.out",
      });
    }
  }, []);

  // Exit animation triggered when unified progress reaches 100%
  useEffect(() => {
    if (progress >= 100) {
      const tl = gsap.timeline({
        onComplete: () => {
          setIsComplete(true);
        },
      });

      // 1. Fade out the progress bar components
      tl.to([".preloader-bar-wrap", ".preloader-percentage"], {
        opacity: 0,
        y: 10,
        duration: 0.5,
        ease: "power3.in",
      });

      // 2. Expand letter spacing and fade out the logo
      tl.to(logoRef.current, {
        letterSpacing: "0.25em",
        opacity: 0,
        scale: 0.96,
        duration: 0.8,
        ease: "power4.inOut",
      }, "-=0.3");

      // 3. GPU-Accelerated slide-up transition of the full preloader sheet
      tl.to(preloaderRef.current, {
        yPercent: -100,
        duration: 1.2,
        ease: "power4.inOut",
      }, "-=0.5");
    }
  }, [progress, setIsComplete]);

  return (
    <div
      ref={preloaderRef}
      className="fixed inset-0 w-full h-full bg-[#030303] z-[9999] flex flex-col items-center justify-center select-none overflow-hidden"
      style={{ willChange: "transform" }}
    >
      <div className="flex flex-col items-center gap-8">
        {/* Animated Display Logo */}
        <h1
          ref={logoRef}
          className="text-white text-6xl md:text-8xl font-extrabold uppercase tracking-widest font-display select-none"
        >
          AURA
        </h1>

        {/* Progress Meter Container */}
        <div className="flex flex-col items-center gap-3 w-64 md:w-80">
          <div className="preloader-bar-wrap w-full h-[2px] bg-white/10 rounded-full overflow-hidden relative">
            <div
              className="h-full bg-[#ff4500] rounded-full transition-all duration-100 ease-out shadow-[0_0_15px_rgba(255,69,0,0.8)]"
              style={{ width: `${animatedProgress}%` }}
            />
          </div>
          <div className="preloader-percentage font-mono text-xs text-[#8e8e93] tracking-widest flex items-center justify-between w-full">
            <span>LOADING ENGINE</span>
            <span>{String(animatedProgress).padStart(3, "0")}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
