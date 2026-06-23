"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ArrowDown, Cpu, Zap, Wind, ArrowUpRight } from "lucide-react";
import SplitType from "split-type";
import { useLoading } from "@/components/LoadingContext";
import { scrollState } from "@/lib/scrollState";
import { motion } from "framer-motion";
import FeatureCard from "@/components/FeatureCard";
import SandboxScene from "@/three/SandboxScene";
import ScrollCinema from "@/components/ScrollCinema";

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { isComplete } = useLoading();

  useGSAP(() => {
    if (!isComplete) return;

    // 1. Hero text split and reveal
    const heroTitle = new SplitType(".hero-title", { types: "chars" });
    gsap.from(heroTitle.chars, {
      opacity: 0,
      y: 120,
      rotateX: -45,
      stagger: 0.03,
      duration: 1.5,
      ease: "power4.out",
      delay: 0.2,
    });

    // Hero Subtitle & Scroll Button Reveal
    gsap.from(".hero-reveal", {
      opacity: 0,
      y: 40,
      duration: 1.2,
      stagger: 0.15,
      ease: "power3.out",
      delay: 0.8,
    });

    // 2. Narrative Beats Scroll-Pinned Timeline (End at +=400% height)
    const narrativeTl = gsap.timeline({
      scrollTrigger: {
        trigger: ".narrative-section",
        start: "top top",
        end: "+=400%",
        pin: true,
        scrub: 0.5,
      },
    });

    // Beat 1 to 2 transition: Scale torus up, camera zoom out slightly
    narrativeTl
      .to(".slide-1", { opacity: 0, y: -45, duration: 0.8, ease: "power2.inOut" })
      .to(scrollState, { meshScale: 1.8, cameraZ: 1.5, materialTransmission: 0.1, duration: 1.0, ease: "power2.inOut" }, "<")
      .fromTo(".slide-2", { opacity: 0, y: 45 }, { opacity: 1, y: 0, duration: 0.8, ease: "power2.inOut" })
      
    // Beat 2 to 3 transition: Friction (volcanic color shift, speed acceleration)
    narrativeTl
      .to(".slide-2", { opacity: 0, y: -45, duration: 0.8, ease: "power2.inOut" })
      .to(scrollState, { rimColor: "#e60000", meshRotationSpeed: 3.5, meshScale: 1.5, duration: 1.0, ease: "power2.inOut" }, "<")
      .fromTo(".slide-3", { opacity: 0, y: 45 }, { opacity: 1, y: 0, duration: 0.8, ease: "power2.inOut" })
      
    // Beat 3 to 4 transition: Connection (shrink geometry, color shift to electric teal, clear glass morph)
    narrativeTl
      .to(".slide-3", { opacity: 0, y: -45, duration: 0.8, ease: "power2.inOut" })
      .to(scrollState, { meshScale: 0.7, rimColor: "#00ffcc", materialTransmission: 0.8, meshRotationSpeed: 1.2, duration: 1.0, ease: "power2.inOut" }, "<")
      .fromTo(".slide-4", { opacity: 0, y: 45 }, { opacity: 1, y: 0, duration: 0.8, ease: "power2.inOut" })
      
    // Beat 4 to 5 transition: Harmony (wide zoom back, slow alignment, restore default orange theme)
    narrativeTl
      .to(".slide-4", { opacity: 0, y: -45, duration: 0.8, ease: "power2.inOut" })
      .to(scrollState, { cameraZ: 2.1, meshScale: 1.1, rimColor: "#ff4500", meshRotationSpeed: 0.5, materialTransmission: 0.25, duration: 1.0, ease: "power2.inOut" }, "<")
      .fromTo(".slide-5", { opacity: 0, y: 45 }, { opacity: 1, y: 0, duration: 0.8, ease: "power2.inOut" });

    // 3. Footer Reveal (ScrollTrigger based)
    gsap.from(".footer-reveal", {
      scrollTrigger: {
        trigger: ".footer-section",
        start: "top 90%",
      },
      opacity: 0,
      y: 40,
      stagger: 0.15,
      duration: 1.2,
      ease: "power3.out",
    });

  }, { dependencies: [isComplete], scope: containerRef });

  // Framer Motion Viewport Stagger Variants
  const gridVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.18,
        delayChildren: 0.1,
      }
    }
  } as const;

  const cardWrapperVariants = {
    hidden: { opacity: 0, y: 60 },
    show: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        type: "spring", 
        stiffness: 70, 
        damping: 14 
      } 
    }
  } as const;

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 w-full z-50 flex items-center justify-between px-6 py-6 md:px-12 backdrop-blur-md border-b border-white/5 bg-[#030303]/30">
        <span className="font-display font-extrabold text-xl tracking-widest text-[#fafafa] flex items-center gap-2">
          AURA <span className="inline-block w-2 h-2 rounded-full bg-[#ff4500] animate-pulse" />
        </span>
        <div className="hidden md:flex items-center gap-8 text-sm text-[#8e8e93] font-medium">
          <a href="#about" className="hover:text-[#fafafa] transition-colors duration-300">EXPERIENCE</a>
          <a href="#features" className="hover:text-[#fafafa] transition-colors duration-300">ARCHITECTURE</a>
          <a href="#sandbox" className="hover:text-[#fafafa] transition-colors duration-300">GALLERY</a>
        </div>
        <button className="px-5 py-2.5 rounded-full bg-white text-black font-semibold text-xs tracking-wider uppercase hover:bg-[#ff4500] hover:text-white transition-all duration-300 flex items-center gap-1.5 group">
          ENTER CORE <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300" />
        </button>
      </nav>

      {/* Hero Section */}
      <section className="relative h-screen w-full flex flex-col justify-center px-6 md:px-16 overflow-hidden">
        <div className="max-w-7xl w-full mx-auto flex flex-col items-start gap-3">
          <span className="hero-reveal text-[10px] font-bold tracking-[0.25em] text-[#ff4500] uppercase">
            Interactive Digital Architecture
          </span>
          <h1 className="hero-title text-5xl md:text-7xl lg:text-8xl font-extrabold uppercase tracking-tighter leading-[0.9] select-none flex flex-col">
            <span>UNLEASH</span>
            <span className="text-stroke">DIMENSIONS</span>
          </h1>
          <p className="hero-reveal max-w-lg text-sm md:text-base text-[#8e8e93] leading-relaxed mt-4 font-sans">
            A premium next-generation immersive platform combining physics-based WebGL spaces, high-fidelity scroll timelines, and flawless cinematic visuals.
          </p>
          <div className="hero-reveal flex items-center gap-6 mt-8">
            <button className="px-8 py-4 bg-[#ff4500] text-white rounded-full font-bold text-sm tracking-wider uppercase hover:bg-white hover:text-black transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,69,0,0.4)]">
              INITIALIZE SCENE
            </button>
            <a 
              href="#about" 
              className="flex items-center gap-2 text-sm font-bold tracking-widest text-[#fafafa] uppercase group"
            >
              EXPLORE DETAILS 
              <ArrowDown className="w-4 h-4 group-hover:translate-y-1 transition-transform duration-300" />
            </a>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-50 hero-reveal">
          <span className="text-[10px] tracking-[0.3em] font-bold text-white/50 uppercase">SCROLL</span>
          <div className="w-5 h-8 rounded-full border-2 border-white/20 flex justify-center items-start p-1.5">
            <div className="w-1 h-2 rounded-full bg-[#ff4500] animate-bounce" />
          </div>
        </div>
      </section>

      {/* Narrative Section (Scroll Beats) */}
      <section id="about" className="narrative-section relative h-screen w-full flex items-center justify-center bg-[#070707]/30 overflow-hidden border-y border-white/5">
        <div className="max-w-4xl w-full px-6 relative h-64 flex items-center justify-center z-20">
          
          {/* Slide 1 */}
          <div className="narrative-slide slide-1 absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none select-none">
            <span className="text-xs font-bold tracking-[0.3em] text-[#ff4500] uppercase mb-4">BEAT 01 // INCEPTION</span>
            <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight max-w-3xl leading-tight">
              A SINGLE PARTICLE IGNITES THE DIGITAL VOID.
            </h2>
          </div>

          {/* Slide 2 */}
          <div className="narrative-slide slide-2 absolute inset-0 flex flex-col items-center justify-center text-center opacity-0 pointer-events-none select-none">
            <span className="text-xs font-bold tracking-[0.3em] text-[#ff4500] uppercase mb-4">BEAT 02 // SYMMETRY</span>
            <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight max-w-3xl leading-tight">
              PERFECT SYMMETRY EMERGES FROM COSMIC CHAOS.
            </h2>
          </div>

          {/* Slide 3 */}
          <div className="narrative-slide slide-3 absolute inset-0 flex flex-col items-center justify-center text-center opacity-0 pointer-events-none select-none">
            <span className="text-xs font-bold tracking-[0.3em] text-[#ff4500] uppercase mb-4">BEAT 03 // FRICTION</span>
            <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight max-w-3xl leading-tight">
              VOLCANIC FRICTION FUELS COGNITIVE ENERGY.
            </h2>
          </div>

          {/* Slide 4 */}
          <div className="narrative-slide slide-4 absolute inset-0 flex flex-col items-center justify-center text-center opacity-0 pointer-events-none select-none">
            <span className="text-xs font-bold tracking-[0.3em] text-[#ff4500] uppercase mb-4">BEAT 04 // CONNECTIVITY</span>
            <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight max-w-3xl leading-tight">
              BRIDGING SYSTEM CODE AND PHYSICAL SENSES.
            </h2>
          </div>

          {/* Slide 5 */}
          <div className="narrative-slide slide-5 absolute inset-0 flex flex-col items-center justify-center text-center opacity-0 pointer-events-none select-none">
            <span className="text-xs font-bold tracking-[0.3em] text-[#ff4500] uppercase mb-4">BEAT 05 // HARMONY</span>
            <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight max-w-3xl leading-tight">
              UNIFIED HARMONY IN MULTIPLE DIMENSIONS.
            </h2>
          </div>

        </div>

        {/* Decorative corner accents */}
        <div className="absolute top-8 left-8 w-6 h-6 border-t-2 border-l-2 border-white/10" />
        <div className="absolute top-8 right-8 w-6 h-6 border-t-2 border-r-2 border-white/10" />
        <div className="absolute bottom-8 left-8 w-6 h-6 border-b-2 border-l-2 border-white/10" />
        <div className="absolute bottom-8 right-8 w-6 h-6 border-b-2 border-r-2 border-white/10" />
      </section>

      {/* Features Grid Section */}
      <section id="features" className="py-32 px-6 md:px-16 max-w-7xl mx-auto w-full">
        <div className="flex flex-col items-start gap-4 mb-20">
          <span className="text-xs font-bold tracking-[0.2em] text-[#ff4500] uppercase">
            Feature Architecture
          </span>
          <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight">
            ENGINEERING STACK
          </h2>
        </div>

        {/* Staggered viewport entrance animation via Framer Motion */}
        <motion.div
          variants={gridVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full"
        >
          {/* R3F Feature Card */}
          <motion.div variants={cardWrapperVariants}>
            <FeatureCard
              icon={<Cpu className="w-6 h-6" />}
              title="React Three Fiber"
              description="Declarative, physics-integrated 3D scenes running directly on high-performance WebGL context. Custom shader support."
              indexText="01 // GRAPHICSENGINE"
            />
          </motion.div>

          {/* GSAP Feature Card */}
          <motion.div variants={cardWrapperVariants}>
            <FeatureCard
              icon={<Zap className="w-6 h-6" />}
              title="GSAP ScrollTrigger"
              description="Flawless timeline animations bound directly to scroll positioning. Custom text splitting, pinning, and page-scrubs."
              indexText="02 // ANIMATIONCONTROLLER"
            />
          </motion.div>

          {/* Lenis Feature Card */}
          <motion.div variants={cardWrapperVariants}>
            <FeatureCard
              icon={<Wind className="w-6 h-6" />}
              title="Lenis Scroll Physics"
              description="Native-feeling momentum based scroll curves mapping perfectly to visual components without latency or jitter."
              indexText="03 // PHYSICSENGINE"
            />
          </motion.div>
        </motion.div>
      </section>

      {/* Sandbox WebGL Section */}
      <section id="sandbox" className="relative h-screen w-full bg-[#030303] border-t border-white/5 overflow-hidden flex items-center px-6 md:px-16">
        {/* Fullscreen Interactive Shader Canvas */}
        <SandboxScene />

        {/* HTML Info Overlay */}
        <div className="max-w-xl w-full mx-auto md:mx-0 flex flex-col items-start gap-4 z-20 pointer-events-none select-none">
          <span className="text-xs font-bold tracking-[0.25em] text-[#00f0ff] uppercase">
            GLSL Shader Sandbox
          </span>
          <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-none uppercase">
            PARTICLE<br />REACTION
          </h2>
          <p className="max-w-sm text-sm text-[#8e8e93] leading-relaxed mt-4 font-sans">
            Move your cursor or drag on touch screens to interact with the magnetic vector field. Particle counts are budgeted dynamically using client-side GPU rendering benchmarks.
          </p>
          <div className="mt-8 flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00f0ff] animate-ping" />
            <span className="text-xs font-semibold tracking-widest text-[#00f0ff] uppercase">
              GPU ACCELERATED // FEEDBACK ACTIVE
            </span>
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <section className="footer-section bg-[#070707] py-24 px-6 md:px-16 border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col items-center gap-12 w-full">
          <h2 className="footer-reveal text-6xl md:text-9xl font-extrabold uppercase tracking-tighter text-stroke hover:text-[#fafafa] select-none cursor-default transition-all duration-500">
            CREATIVE CORE
          </h2>
          <div className="footer-reveal flex flex-col md:flex-row items-center justify-between w-full border-t border-white/10 pt-12 gap-6 text-sm text-[#8e8e93]">
            <span>© 2026 AURA ENGINE. ALL RIGHTS RESERVED.</span>
            <div className="flex gap-8">
              <a href="#" className="hover:text-white transition-colors">GITHUB</a>
              <a href="#" className="hover:text-white transition-colors">DOCUMENTATION</a>
              <a href="#" className="hover:text-white transition-colors">AWWWARDS</a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
