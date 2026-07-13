'use client';
import { useEffect, useRef } from 'react';
import { useInView, animate } from 'framer-motion';

// Animates a number counting up from 0 once it scrolls into view.
// `value` should be a number; `suffix` is any trailing text like "+" or "%".
export default function AnimatedCounter({ value, suffix = '' }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-40px' });

  useEffect(() => {
    if (!isInView || !ref.current) return;
    const node = ref.current;
    const controls = animate(0, value, {
      duration: 1.4,
      ease: [0.2, 0.7, 0.3, 1],
      onUpdate(latest) {
        node.textContent = Math.round(latest) + suffix;
      },
    });
    return () => controls.stop();
  }, [isInView, value, suffix]);

  return <span ref={ref}>0{suffix}</span>;
}
