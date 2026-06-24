"use client";

import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export default function ScrollCinema() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const targetFrame = useRef<number>(1);
  const currentFrame = useRef<number>(1);
  const rafId = useRef<number | null>(null);
  
  // Track loaded images and initialized chunks
  const images = useRef<{ [key: number]: HTMLImageElement }>({});
  const loadedChunks = useRef<Set<number>>(new Set());
  
  // Tracks if the targeted frame is cached and drawn
  const [isBufferReady, setIsBufferReady] = useState(true);

  // Helper to draw images on 2D context: containment for landscape, cover for portrait (mobile screens)
  const drawImageAdaptive = (ctx: CanvasRenderingContext2D, img: HTMLImageElement) => {
    const canvas = ctx.canvas;
    const wr = canvas.width / img.width;
    const hr = canvas.height / img.height;
    
    // Contain (show whole image) on landscape viewports; Cover (fill screen) on portrait viewports
    const isLandscape = canvas.width > canvas.height;
    const ratio = isLandscape ? Math.min(wr, hr) : Math.max(wr, hr);
    
    const x = (canvas.width - img.width * ratio) / 2;
    const y = (canvas.height - img.height * ratio) / 2;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(
      img,
      0,
      0,
      img.width,
      img.height,
      x,
      y,
      img.width * ratio,
      img.height * ratio
    );
  };

  // Throttled draw loop running on requestAnimationFrame ticks
  const drawFrame = () => {
    rafId.current = null;
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const frameToDraw = targetFrame.current;
    const img = images.current[frameToDraw];

    if (img && img.complete) {
      drawImageAdaptive(ctx, img);
      setIsBufferReady(true);
      currentFrame.current = frameToDraw;
    } else {
      // targeted frame not loaded yet. Toggle blur state
      setIsBufferReady(false);
      
      // Fallback: search backwards and forwards for the nearest cached frame to display
      let nearestFrame = currentFrame.current;
      for (let offset = 1; offset < 240; offset++) {
        const back = frameToDraw - offset;
        const front = frameToDraw + offset;
        
        if (back >= 1 && images.current[back]?.complete) {
          nearestFrame = back;
          break;
        }
        if (front <= 240 && images.current[front]?.complete) {
          nearestFrame = front;
          break;
        }
      }
      
      const fallbackImg = images.current[nearestFrame];
      if (fallbackImg && fallbackImg.complete) {
        drawImageAdaptive(ctx, fallbackImg);
      }
    }
  };

  const triggerRedraw = () => {
    if (rafId.current === null) {
      rafId.current = requestAnimationFrame(drawFrame);
    }
  };

  // Loads a batch chunk (30 frames) speculatively
  const preloadChunk = (chunkIndex: number) => {
    if (loadedChunks.current.has(chunkIndex)) return;
    loadedChunks.current.add(chunkIndex);

    const start = (chunkIndex - 1) * 30 + 1;
    const end = Math.min(chunkIndex * 30, 240);

    for (let i = start; i <= end; i++) {
      if (images.current[i]) continue;
      
      const img = new Image();
      const paddedIndex = String(i).padStart(3, "0");
      img.src = `sequences/ezgif-frame-${paddedIndex}.jpg`;
      img.onload = () => {
        images.current[i] = img;
        // Re-draw immediately if the loading frame is the current target
        if (targetFrame.current === i) {
          triggerRedraw();
        }
      };
      img.onerror = () => {
        console.warn("Could not load cinema frame index:", i);
        // Fallback to mark as done to avoid lockups
        images.current[i] = images.current[1] || new Image();
      };
    }
  };

  useEffect(() => {
    // 1. Instantly load initial chunk to have display frames ready
    preloadChunk(1);

    // 2. Setup scroll progression mapping bound to document body scroll
    const bodyTrigger = ScrollTrigger.create({
      trigger: "body",
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      onUpdate: (self) => {
        // Map page scroll progress (0 - 1) to frame (1 - 240)
        const frameIndex = Math.min(240, Math.max(1, Math.floor(self.progress * 239) + 1));
        targetFrame.current = frameIndex;

        // Determine current chunk index
        const currentChunk = Math.ceil(frameIndex / 30);
        
        // Speculatively load current and subsequent chunk
        preloadChunk(currentChunk);
        if (currentChunk < 8) {
          preloadChunk(currentChunk + 1);
        }

        triggerRedraw();
      },
    });

    // 3. Canvas sizing handler
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        triggerRedraw();
      }
    };

    window.addEventListener("resize", handleResize);
    // Initial size trigger
    handleResize();

    return () => {
      bodyTrigger.kill();
      window.removeEventListener("resize", handleResize);
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, []);

  return (
    <div className="relative w-full h-full bg-[#030303] overflow-hidden">
      {/* Target drawing Canvas */}
      <canvas ref={canvasRef} className="block w-full h-full object-cover" />

      {/* Blurred Buffer Placeholder overlay */}
      <div 
        className={`absolute inset-0 bg-black/50 backdrop-blur-xl flex flex-col items-center justify-center transition-all duration-700 pointer-events-none z-10 ${
          isBufferReady ? "opacity-0 scale-95" : "opacity-100 scale-100"
        }`}
      >
        <div className="flex flex-col items-center gap-3">
          <span className="w-8 h-8 rounded-full border-2 border-t-transparent border-[#ff4500] animate-spin" />
          <span className="font-mono text-[10px] tracking-[0.3em] text-[#fafafa]/80 uppercase mt-4 animate-pulse">
            Buffering Cinema Sequence...
          </span>
        </div>
      </div>
    </div>
  );
}
