"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial } from "@react-three/drei";
import { useRef, useState, useEffect, Suspense } from "react";
import * as THREE from "three";
import CanvasLoader from "./CanvasLoader";
import { useLoading } from "@/components/LoadingContext";
import { scrollState } from "@/lib/scrollState";

// Camera controller tracking scrollState camera positioning and mouse parallax
function CameraController() {
  const { isComplete } = useLoading();
  const mouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useFrame((state) => {
    // If preloader is complete, follow scrollState.cameraZ; otherwise stay far
    const targetZ = isComplete ? scrollState.cameraZ : 2.8;

    const targetX = mouse.current.x * 0.4;
    const targetY = mouse.current.y * 0.4;

    const time = state.clock.getElapsedTime();
    const floatOffset = Math.sin(time * 0.6) * 0.05;

    // Smooth lerps
    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, targetX, 0.05);
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, targetY + floatOffset, 0.05);
    state.camera.position.z = THREE.MathUtils.lerp(state.camera.position.z, targetZ, 0.05);

    state.camera.lookAt(0, 0, 0);
  });

  return null;
}

// 3D Geometry consuming scrollScale, scrollSpeed, and material transmission
function HeroGeometry() {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshPhysicalMaterial>(null);

  useFrame((state, delta) => {
    if (meshRef.current) {
      // Rotation driven by speed modifier
      meshRef.current.rotation.x += delta * 0.06 * scrollState.meshRotationSpeed;
      meshRef.current.rotation.y += delta * 0.09 * scrollState.meshRotationSpeed;

      // Scale lerp
      const targetScale = scrollState.meshScale;
      meshRef.current.scale.x = THREE.MathUtils.lerp(meshRef.current.scale.x, targetScale, 0.05);
      meshRef.current.scale.y = THREE.MathUtils.lerp(meshRef.current.scale.y, targetScale, 0.05);
      meshRef.current.scale.z = THREE.MathUtils.lerp(meshRef.current.scale.z, targetScale, 0.05);
    }

    if (materialRef.current) {
      // Transmission morphing
      materialRef.current.transmission = THREE.MathUtils.lerp(
        materialRef.current.transmission,
        scrollState.materialTransmission,
        0.05
      );
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0, 0]}>
      <torusKnotGeometry args={[0.3, 0.08, 180, 16]} />
      <meshPhysicalMaterial
        ref={materialRef}
        color="#151515"
        roughness={0.2}
        metalness={0.9}
        clearcoat={1.0}
        clearcoatRoughness={0.15}
        transmission={0.25}
        thickness={0.5}
        ior={1.6}
      />
    </mesh>
  );
}

// Dynamically managed cinematic double light source (key + rim)
function DynamicLighting() {
  const rimLightRef = useRef<THREE.DirectionalLight>(null);
  const colorTarget = useRef(new THREE.Color("#ff4500"));

  useFrame(() => {
    if (rimLightRef.current) {
      // Smooth color morphing on scroll
      colorTarget.current.set(scrollState.rimColor);
      rimLightRef.current.color.lerp(colorTarget.current, 0.05);
    }
  });

  return (
    <>
      <ambientLight intensity={0.2} />
      {/* Key Light */}
      <directionalLight
        position={[-6, 6, 4]}
        intensity={3.5}
        color="#ffffff"
      />
      {/* Rim Light with dynamic scroll-controlled color */}
      <directionalLight
        ref={rimLightRef}
        position={[6, -6, -4]}
        intensity={6}
        color="#ff4500"
      />
    </>
  );
}

// Additive particles
function FloatingParticles() {
  const pointsRef = useRef<THREE.Points>(null);

  const [positions] = useState(() => {
    const count = 1800;
    const coords = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i += 3) {
      const u = Math.random();
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 1.8 * Math.cbrt(u);

      coords[i] = r * Math.sin(phi) * Math.cos(theta);
      coords[i + 1] = r * Math.sin(phi) * Math.sin(theta);
      coords[i + 2] = r * Math.cos(phi);
    }
    return coords;
  });

  useFrame((state, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.x += delta * 0.015;
      pointsRef.current.rotation.y += delta * 0.025;
    }
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={pointsRef} positions={positions} stride={3} frustumCulled={false}>
        <PointMaterial
          transparent
          color="#ff4500"
          size={0.005}
          sizeAttenuation={true}
          depthWrite={false}
          opacity={0.7}
          blending={THREE.AdditiveBlending}
        />
      </Points>
    </group>
  );
}

export default function ThreeScene() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="absolute inset-0 -z-10 bg-[#030303]" />;
  }

  return (
    <div className="absolute inset-0 -z-10 bg-[#030303] pointer-events-none overflow-hidden">
      <Canvas camera={{ position: [0, 0, 2.8], fov: 60 }} dpr={[1, 2]}>
        <Suspense fallback={null}>
          <CanvasLoader />
          <CameraController />
          <DynamicLighting />
          <HeroGeometry />
          <FloatingParticles />
        </Suspense>
      </Canvas>
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(0,0,0,0)_20%,rgba(3,3,3,0.96)_100%)]" />
    </div>
  );
}
