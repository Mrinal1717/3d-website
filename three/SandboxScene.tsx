"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useRef, useState, useEffect, useMemo, Suspense } from "react";
import * as THREE from "three";
import { detectGPUTier } from "@/lib/gpuDetection";

// Custom full-screen fluid-gradient shader background
function ShaderBackground() {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const backgroundMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        varying vec2 vUv;

        // Hash function for animated noise grain
        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
        }

        void main() {
          vec2 uv = vUv;

          // Organic fluid wave patterns
          float n1 = sin(uv.x * 2.6 + uTime * 0.12) * 0.5 + 0.5;
          float n2 = cos(uv.y * 2.0 - uTime * 0.16) * 0.5 + 0.5;

          // Background obsidian, volcanic orange, and deep cyber teal blending
          vec3 col = vec3(0.01, 0.01, 0.012);
          vec3 warmOrange = vec3(0.12, 0.03, 0.0);
          vec3 cyberTeal = vec3(0.0, 0.04, 0.06);

          col = mix(col, warmOrange, n1 * 0.65);
          col = mix(col, cyberTeal, n2 * 0.5);

          // Animated film-grain noise overlay
          float grain = (hash(uv * (uTime + 1.0)) - 0.5) * 0.012;
          col += vec3(grain);

          gl_FragColor = vec4(col, 1.0);
        }
      `
    });
  }, []);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
    }
  });

  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <primitive ref={materialRef} object={backgroundMaterial} attach="material" />
    </mesh>
  );
}

// Shader-based reactive particle system
interface ParticleSystemProps {
  gpuTier: "low" | "mid" | "high";
  mouseTarget: React.MutableRefObject<THREE.Vector2>;
}

function ParticleSystem({ gpuTier, mouseTarget }: ParticleSystemProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  // Dynamic particle count based on hardware capability
  const count = useMemo(() => {
    if (gpuTier === "low") return 8000;
    if (gpuTier === "mid") return 25000;
    return 70000; // high-tier handles 70k with ease in shader code
  }, [gpuTier]);

  // Generate random vertex coordinates
  const positions = useMemo(() => {
    const coords = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i += 3) {
      // Coordinate distribution box
      coords[i] = (Math.random() - 0.5) * 3.4;
      coords[i + 1] = (Math.random() - 0.5) * 2.6;
      coords[i + 2] = (Math.random() - 0.5) * 0.6;
    }
    return coords;
  }, [count]);

  const particleMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uMouse: { value: new THREE.Vector2(0, 0) },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: `
        uniform float uTime;
        uniform vec2 uMouse;
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          vec3 pos = position;

          // 1. GPU-accelerated mouse repulsion dynamics
          vec3 mousePos = vec3(uMouse.x * 2.2, uMouse.y * 1.6, 0.0);
          float dist = distance(pos, mousePos);

          if (dist < 0.65) {
            float force = (0.65 - dist) / 0.65; // Repulsion factor (0 to 1)
            vec3 repelDir = normalize(pos - mousePos);
            // Translate particles away on X/Y axis
            pos.xy += repelDir.xy * force * 0.16;
          }

          // 2. Slow harmonic sine floating waves
          pos.x += sin(pos.y + uTime * 0.4) * 0.035;
          pos.y += cos(pos.x + uTime * 0.35) * 0.035;

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mvPosition;

          // Stagger orange/cyan particle colors across X space coordinate
          float colorMix = smoothstep(-1.2, 1.2, position.x);
          vec3 orange = vec3(1.0, 0.27, 0.0);
          vec3 cyan = vec3(0.0, 0.94, 1.0);
          vColor = mix(orange, cyan, colorMix);

          // Attenuate sizing based on depth positioning
          gl_PointSize = (14.0 / -mvPosition.z);

          // Fade margins to black
          vAlpha = smoothstep(1.7, 0.4, length(position.xy));
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          // Circular particle rendering with feathering edge
          vec2 center = gl_PointCoord - vec2(0.5);
          float dist = length(center);

          if (dist > 0.5) discard;

          float alpha = smoothstep(0.5, 0.25, dist) * vAlpha * 0.75;
          gl_FragColor = vec4(vColor, alpha);
        }
      `
    });
  }, []);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
      // Smoothly lerp uniform cursor coordinates to avoid snapping
      materialRef.current.uniforms.uMouse.value.lerp(mouseTarget.current, 0.08);
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <primitive ref={materialRef} object={particleMaterial} attach="material" />
    </points>
  );
}

export default function SandboxScene() {
  const [gpuTier, setGpuTier] = useState<"low" | "mid" | "high">("mid");
  const [mounted, setMounted] = useState(false);
  const mouseTarget = useRef(new THREE.Vector2(999, 999)); // Initially off-screen

  useEffect(() => {
    setGpuTier(detectGPUTier());
    setMounted(true);
  }, []);

  const handlePointerMove = (e: React.PointerEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    // Normalize coordinates to [-1, 1] relative to the container box
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    mouseTarget.current.set(x, y);
  };

  const handlePointerLeave = () => {
    // Return mouse uniform off-screen
    mouseTarget.current.set(999, 999);
  };

  if (!mounted) {
    return <div className="absolute inset-0 bg-[#030303]" />;
  }

  return (
    <div
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className="absolute inset-0 w-full h-full cursor-none overflow-hidden"
    >
      <Canvas camera={{ position: [0, 0, 1.2], fov: 60 }} dpr={[1, 2]}>
        <Suspense fallback={null}>
          <ShaderBackground />
          <ParticleSystem gpuTier={gpuTier} mouseTarget={mouseTarget} />
        </Suspense>
      </Canvas>
    </div>
  );
}
