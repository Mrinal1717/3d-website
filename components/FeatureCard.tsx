"use client";

import React, { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  indexText: string;
}

export default function FeatureCard({ icon, title, description, indexText }: FeatureCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  // 1. Motion values for 3D Tilt
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Responsive spring configuration for snappy cursor tracking
  const springConfig = { damping: 20, stiffness: 150 };
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [12, -12]), springConfig);
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-12, 12]), springConfig);

  // 2. Motion values for Magnetic Icon effect
  const iconX = useSpring(0, springConfig);
  const iconY = useSpring(0, springConfig);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    // Normalized coordinates between -0.5 and 0.5
    const mouseX = (e.clientX - rect.left) / width - 0.5;
    const mouseY = (e.clientY - rect.top) / height - 0.5;

    x.set(mouseX);
    y.set(mouseY);

    // Calculate magnetic pull for the icon
    const iconContainer = cardRef.current.querySelector(".icon-container");
    if (iconContainer) {
      const iconRect = iconContainer.getBoundingClientRect();
      const iconCenterX = iconRect.left + iconRect.width / 2;
      const iconCenterY = iconRect.top + iconRect.height / 2;

      const distanceX = e.clientX - iconCenterX;
      const distanceY = e.clientY - iconCenterY;

      const maxDistance = 140; // Detection radius
      const distance = Math.hypot(distanceX, distanceY);

      if (distance < maxDistance) {
        // Elastic pull (30% of cursor distance)
        iconX.set(distanceX * 0.3);
        iconY.set(distanceY * 0.3);
      } else {
        iconX.set(0);
        iconY.set(0);
      }
    }
  };

  const handleMouseLeave = () => {
    // Reset all motion spring values back to zero on cursor exit
    x.set(0);
    y.set(0);
    iconX.set(0);
    iconY.set(0);
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      className="feature-card group relative p-6 sm:p-10 bg-[#0b0b0b]/50 backdrop-blur-md border border-white/5 rounded-2xl flex flex-col justify-between h-[22rem] sm:h-96 hover:border-[#ff4500]/40 transition-colors duration-500 overflow-hidden cursor-pointer select-none"
    >
      {/* Background glow radial highlight overlay */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-[#ff4500]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

      {/* preserve-3d enables children to translate on the Z-axis in depth */}
      <div style={{ transform: "translateZ(30px)", transformStyle: "preserve-3d" }}>
        {/* Magnetic Icon wrapper */}
        <motion.div
          className="icon-container w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#ff4500] mb-8 group-hover:border-[#ff4500]/30 transition-all duration-300"
          style={{ x: iconX, y: iconY }}
        >
          {icon}
        </motion.div>

        <h3 
          className="text-2xl font-bold text-white mb-4 tracking-tight" 
          style={{ transform: "translateZ(15px)" }}
        >
          {title}
        </h3>
        <p 
          className="text-[#8e8e93] text-sm leading-relaxed" 
          style={{ transform: "translateZ(10px)" }}
        >
          {description}
        </p>
      </div>

      <span 
        className="text-xs font-semibold tracking-wider text-white/30 group-hover:text-[#ff4500] transition-colors duration-300"
        style={{ transform: "translateZ(8px)" }}
      >
        {indexText}
      </span>
    </motion.div>
  );
}
