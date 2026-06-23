export type GPUTier = "low" | "mid" | "high";

/**
 * Detects the client's GPU tier based on WebGL renderer strings.
 * Helps budget performance resources like particle counts dynamically.
 */
export function detectGPUTier(): GPUTier {
  if (typeof window === "undefined") return "mid";

  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    
    if (!gl) {
      return "low"; // No WebGL support, default to low resource allocation
    }

    const debugInfo = (gl as WebGLRenderingContext).getExtension("WEBGL_debug_renderer_info");
    if (!debugInfo) {
      return "mid"; // WebGL works, but renderer details are obscured
    }

    const renderer = (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL).toLowerCase();
    const userAgent = navigator.userAgent.toLowerCase();

    // 1. Mobile devices are budgeted as low-resource to prioritize battery life and thermal stability
    const isMobile = /iphone|ipad|ipod|android/i.test(userAgent);
    if (isMobile) {
      return "low";
    }

    // 2. Match standard integrated or low-end rendering architectures
    if (
      renderer.includes("intel") ||
      renderer.includes("uhd") ||
      renderer.includes("iris") ||
      renderer.includes("mali") ||
      renderer.includes("adreno") ||
      renderer.includes("swiftshader") ||
      renderer.includes("software")
    ) {
      return "low";
    }

    // 3. Match high-end gaming or workstation GPU architectures
    if (
      renderer.includes("nvidia") ||
      renderer.includes("geforce") ||
      renderer.includes("rtx") ||
      renderer.includes("gtx") ||
      renderer.includes("radeon") ||
      renderer.includes("apple m")
    ) {
      return "high";
    }

    // 4. Default to mid-range tier for everything else
    return "mid";
  } catch (err) {
    console.warn("GPU-tier detection failed, fallback to mid-tier:", err);
    return "mid";
  }
}
export { detectGPUTier as getGPUTier };
