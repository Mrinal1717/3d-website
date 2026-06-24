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

  // Diagnostics / Debug state
  const [isDebug, setIsDebug] = useState(false);
  const [diagnostics, setDiagnostics] = useState({ loaded: 0, failed: 0 });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("debug") === "true") {
        setIsDebug(true);
      }
    }
  }, []);

  // Helper to draw images on 2D context: always preserve original 16:9 aspect ratio (containment)
  const drawImageAdaptive = (ctx: CanvasRenderingContext2D, img: HTMLImageElement) => {
    const canvas = ctx.canvas;
    const wr = canvas.width / img.width;
    const hr = canvas.height / img.height;
    
    // Always contain (show whole 16:9 image) on all viewports, leaving black bars on extra space
    const ratio = Math.min(wr, hr);
    
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

    if (img && img.complete && img.naturalWidth > 0) {
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
        
        if (back >= 1 && images.current[back]?.complete && images.current[back]?.naturalWidth > 0) {
          nearestFrame = back;
          break;
        }
        if (front <= 240 && images.current[front]?.complete && images.current[front]?.naturalWidth > 0) {
          nearestFrame = front;
          break;
        }
      }
      
      const fallbackImg = images.current[nearestFrame];
      if (fallbackImg && fallbackImg.complete && fallbackImg.naturalWidth > 0) {
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
      // Store in ref immediately to prevent mobile browser garbage collection during in-flight load
      images.current[i] = img;

      // Assign event handlers BEFORE setting src to resolve cache race conditions
      img.onload = () => {
        setDiagnostics(prev => ({ ...prev, loaded: prev.loaded + 1 }));
        // Re-draw immediately if the loading frame is the current target
        if (targetFrame.current === i) {
          triggerRedraw();
        }
      };
      img.onerror = () => {
        console.warn("Could not load cinema frame index:", i);
        setDiagnostics(prev => ({ ...prev, failed: prev.failed + 1 }));
        // Replace with empty image structure, but it will have naturalWidth = 0
        const fallback = new Image();
        images.current[i] = fallback;
      };

      const paddedIndex = String(i).padStart(3, "0");
      img.src = `/sequences/ezgif-frame-${paddedIndex}.jpg`;
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
    let lastWidth = 0;
    let lastHeight = 0;

    const handleResize = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const currentWidth = window.innerWidth;
        const currentHeight = window.innerHeight;

        // Only resize canvas if width changes (e.g. orientation change)
        // or if height changes significantly (to ignore mobile address bar toggles)
        const widthChanged = currentWidth !== lastWidth;
        const heightChangedSignificantly = Math.abs(currentHeight - lastHeight) > 110;

        if (widthChanged || heightChangedSignificantly) {
          canvas.width = currentWidth;
          canvas.height = currentHeight;
          lastWidth = currentWidth;
          lastHeight = currentHeight;
          triggerRedraw();
        }
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

      {/* Real-time Diagnostics overlay (active when URL has ?debug=true) */}
      {isDebug && (
        <div className="absolute top-24 left-4 z-50 bg-[#070707]/90 text-xs text-[#00ffcc] font-mono p-4 rounded-xl border border-white/10 select-none pointer-events-none shadow-2xl backdrop-blur-md">
          <div className="font-bold border-b border-white/10 pb-2 mb-2 tracking-wider text-white uppercase">Cinema Diagnostics</div>
          <div className="space-y-1">
            <div>Target Frame: <span className="text-white font-bold">{targetFrame.current}</span></div>
            <div>Current Frame: <span className="text-white font-bold">{currentFrame.current}</span></div>
            <div>Loaded Chunks: <span className="text-white font-bold">{loadedChunks.current.size} / 8</span></div>
            <div>Images Loaded: <span className="text-green-400 font-bold">{diagnostics.loaded}</span></div>
            <div>Images Failed: <span className="text-red-400 font-bold">{diagnostics.failed}</span></div>
            <div>Buffer Status: <span className={isBufferReady ? "text-green-400 font-bold" : "text-amber-400 font-bold animate-pulse"}>{isBufferReady ? "READY" : "BUFFERING"}</span></div>
          </div>
        </div>
      )}
    </div>
  );
}
