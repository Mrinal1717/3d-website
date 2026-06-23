import gsap from "gsap";
import SplitType from "split-type";

/**
 * Splits text into lines and characters and animates them upwards with a stagger.
 * Excellent for premium, cinematic headlines.
 */
export const animatePremiumText = (
  target: string | HTMLElement,
  trigger?: string | HTMLElement,
  delay: number = 0
) => {
  const split = new SplitType(target as any, {
    types: "lines,chars",
    tagName: "span",
  });

  // Wrap chars or lines in overflow hidden via CSS or JS wrapper if needed.
  // For simplicity, animate lines or chars directly:
  const tl = gsap.timeline({
    scrollTrigger: trigger
      ? {
          trigger: trigger,
          start: "top 80%",
          toggleActions: "play none none reverse",
        }
      : undefined,
  });

  tl.from(split.chars, {
    opacity: 0,
    y: 80,
    rotateX: -30,
    stagger: 0.02,
    duration: 1.2,
    ease: "power4.out",
    delay: delay,
  });

  return { split, timeline: tl };
};

/**
 * Fades in an element with a smooth upward translation, matching cinematic animations.
 */
export const animateFadeInUp = (
  target: string | HTMLElement,
  trigger?: string | HTMLElement,
  delay: number = 0,
  duration: number = 1.2
) => {
  return gsap.from(target, {
    scrollTrigger: trigger
      ? {
          trigger: trigger,
          start: "top 85%",
          toggleActions: "play none none reverse",
        }
      : undefined,
    opacity: 0,
    y: 40,
    duration: duration,
    ease: "power3.out",
    delay: delay,
  });
};
