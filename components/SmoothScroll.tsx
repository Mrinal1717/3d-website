"use client";

import React, { useEffect, useRef } from "react";
import Lenis from "lenis";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import gsap from "gsap";
import { useLoading } from "@/components/LoadingContext";

interface SmoothScrollProps {
  children: React.ReactNode;
}

export default function SmoothScroll({ children }: SmoothScrollProps) {
  const lenisRef = useRef<Lenis | null>(null);
  const { isComplete } = useLoading();

  useEffect(() => {
    // Initialize Lenis smooth scroll
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 1.0,
      touchMultiplier: 1.5,
    });

    lenisRef.current = lenis;

    // Initially stop scroll if loading is not yet complete
    if (!isComplete) {
      lenis.stop();
    }

    // Connect Lenis to GSAP ScrollTrigger
    lenis.on("scroll", () => {
      ScrollTrigger.update();
    });

    // Feed Lenis RAF time into GSAP Ticker
    const updateTicker = (time: number) => {
      lenis.raf(time * 1000);
    };
    
    gsap.ticker.add(updateTicker);
    gsap.ticker.lagSmoothing(0);

    return () => {
      lenis.destroy();
      gsap.ticker.remove(updateTicker);
    };
  }, []);

  // Freeze/unfreeze scrolling dynamically based on loading completion
  useEffect(() => {
    if (lenisRef.current) {
      if (isComplete) {
        lenisRef.current.start();
        ScrollTrigger.refresh();
      } else {
        lenisRef.current.stop();
      }
    }
  }, [isComplete]);

  return <>{children}</>;
}
export { Lenis };
