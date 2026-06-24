"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface LoadingContextType {
  progress: number;
  isComplete: boolean;
  fontsReady: boolean;
  threeProgress: number;
  threeReady: boolean;
  sequenceReady: boolean;
  setThreeProgress: (progress: number) => void;
  setThreeReady: (ready: boolean) => void;
  setIsComplete: (complete: boolean) => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [fontsReady, setFontsReady] = useState(false);
  const [threeProgress, setThreeProgressState] = useState(100);
  const [threeReady, setThreeReady] = useState(true);
  const [sequenceProgress, setSequenceProgress] = useState(0);
  const [sequenceReady, setSequenceReady] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  // 1. Monitor web fonts loading
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (document.fonts) {
        document.fonts.ready
          .then(() => {
            setFontsReady(true);
          })
          .catch((err) => {
            console.error("Font loading error, continuing with fallback:", err);
            setFontsReady(true); // Fallback to not block the preloader
          });
      } else {
        setFontsReady(true);
      }
    }
  }, []);

  // 2. Preload first sequence chunk (frames 1 to 30)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const frameCount = 30;
    let loadedCount = 0;
    const images: HTMLImageElement[] = [];

    const handleImageLoad = () => {
      loadedCount++;
      const currentProgress = Math.round((loadedCount / frameCount) * 100);
      setSequenceProgress(currentProgress);

      if (loadedCount === frameCount) {
        setSequenceReady(true);
      }
    };

    const handleImageError = () => {
      // In case some frames fail or are missing, count them as loaded to proceed
      loadedCount++;
      const currentProgress = Math.round((loadedCount / frameCount) * 100);
      setSequenceProgress(currentProgress);
      if (loadedCount === frameCount) {
        setSequenceReady(true);
      }
    };

    for (let i = 1; i <= frameCount; i++) {
      const img = new Image();
      const frameIndex = String(i).padStart(3, "0");
      img.src = `sequences/ezgif-frame-${frameIndex}.jpg`;
      img.onload = handleImageLoad;
      img.onerror = handleImageError;
      images.push(img);
    }
  }, []);

  // 3. Set Three.js loading progress
  const setThreeProgress = (prog: number) => {
    setThreeProgressState(prog);
    if (prog >= 100) {
      setThreeReady(true);
    }
  };

  // 4. Calculate total unified progress percentage (Average of Fonts, Three.js, and Sequence Chunk)
  const fontProgress = fontsReady ? 100 : 0;
  const totalProgress = Math.round((fontProgress + threeProgress + sequenceProgress) / 3);

  return (
    <LoadingContext.Provider
      value={{
        progress: totalProgress,
        isComplete,
        fontsReady,
        threeProgress,
        threeReady,
        sequenceReady,
        setThreeProgress,
        setThreeReady,
        setIsComplete,
      }}
    >
      {children}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error("useLoading must be used within a LoadingProvider");
  }
  return context;
}
