import React, { useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';

/** Compact count-up interaction for scores and league statistics. */
export function CountUpValue({ value, className = '', padTo = 0 }: { value: number; className?: string; padTo?: number }) {
  const elementRef = useRef<HTMLSpanElement>(null);
  const previousValue = useRef(0);

  useLayoutEffect(() => {
    const element = elementRef.current;
    if (!element) return;
    const target = Number.isFinite(value) ? value : 0;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      element.textContent = String(target).padStart(padTo, '0');
      previousValue.current = target;
      return;
    }

    const counter = { value: previousValue.current };
    const pop = gsap.fromTo(element, { scale: 0.86 }, { scale: 1, duration: 0.34, ease: 'back.out(2)' });
    const tween = gsap.to(counter, {
      value: target,
      duration: previousValue.current === 0 ? 0.75 : 0.48,
      ease: 'power2.out',
      onUpdate: () => { if (elementRef.current) elementRef.current.textContent = String(Math.round(counter.value)).padStart(padTo, '0'); },
    });
    previousValue.current = target;
    return () => { tween.kill(); pop.kill(); };
  }, [value, padTo]);

  return <span ref={elementRef} className={`count-up-value ${className}`.trim()} aria-label={String(value).padStart(padTo, '0')}>{String(value).padStart(padTo, '0')}</span>;
}
