import React, { HTMLAttributes, PointerEvent } from 'react';

type SpotlightCardProps = HTMLAttributes<HTMLDivElement>;

/** Cursor-following card light inspired by React Bits' Spotlight Card. */
export function SpotlightCard({ className = '', onPointerMove, onPointerLeave, ...props }: SpotlightCardProps) {
  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    onPointerMove?.(event);
    if (event.pointerType === 'touch') return;
    const bounds = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty('--spotlight-x', `${event.clientX - bounds.left}px`);
    event.currentTarget.style.setProperty('--spotlight-y', `${event.clientY - bounds.top}px`);
  };

  return (
    <div
      {...props}
      className={`rb-spotlight ${className}`.trim()}
      onPointerMove={handlePointerMove}
      onPointerLeave={onPointerLeave}
    />
  );
}
