import { gsap } from 'gsap';

/** Small, reduced-motion-aware entrance animation scoped to a component. */
export function revealWithGsap(
  root: HTMLElement | null,
  selector: string,
  options: { y?: number; duration?: number; stagger?: number; delay?: number } = {},
) {
  if (!root || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {};

  const elements = root.querySelectorAll<HTMLElement>(selector);
  if (!elements.length) return () => {};

  const tween = gsap.from(elements, {
    autoAlpha: 0,
    y: options.y ?? 22,
    duration: options.duration ?? 0.72,
    stagger: options.stagger ?? 0.1,
    delay: options.delay ?? 0.04,
    ease: 'power3.out',
    clearProps: 'opacity,visibility,transform',
  });

  return () => tween.kill();
}
