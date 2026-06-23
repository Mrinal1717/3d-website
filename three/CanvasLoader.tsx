"use client";

import { useEffect } from "react";
import { useProgress } from "@react-three/drei";
import { useLoading } from "@/components/LoadingContext";

export default function CanvasLoader() {
  const { active, progress, total } = useProgress();
  const { setThreeProgress } = useLoading();

  useEffect(() => {
    // If active is false or total is 0, nothing is currently loading in Drei.
    // Set progress to 100 to avoid blocking the preloader.
    if (!active || total === 0) {
      setThreeProgress(100);
    } else {
      setThreeProgress(progress);
    }
  }, [active, progress, total, setThreeProgress]);

  return null;
}
