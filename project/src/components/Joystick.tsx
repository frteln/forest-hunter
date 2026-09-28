import { useRef, useCallback } from 'react';

interface Props {
  onMove: (x: number, y: number) => void;
}

export function Joystick({ onMove }: Props) {
  const baseRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const active = useRef(false);
  const touchId = useRef<number | null>(null);
  const center = useRef({ x: 0, y: 0 });

  const update = useCallback((dx: number, dy: number) => {
    const max = 50;
    const len = Math.hypot(dx, dy);
    const cl = Math.min(len, max);
    const angle = Math.atan2(dy, dx);
    const kx = Math.cos(angle) * cl;
    const ky = Math.sin(angle) * cl;
    if (knobRef.current) {
      knobRef.current.style.transform = `translate(${kx}px, ${ky}px)`;
    }
    onMove(kx / max, ky / max);
  }, [onMove]);

  const reset = useCallback(() => {
    active.current = false;
    touchId.current = null;
    if (knobRef.current) knobRef.current.style.transform = 'translate(0,0)';
    onMove(0, 0);
  }, [onMove]);

  const onStart = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    const base = baseRef.current;
    if (!base) return;
    const rect = base.getBoundingClientRect();
    center.current = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };

    if ('touches' in e) {
      const t = e.changedTouches[0];
      touchId.current = t.identifier;
      update(t.clientX - center.current.x, t.clientY - center.current.y);
    } else {
      active.current = true;
      update((e as React.MouseEvent).clientX - center.current.x, (e as React.MouseEvent).clientY - center.current.y);
    }
    active.current = true;
  }, [update]);

  const onMoveHandler = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!active.current) return;
    e.preventDefault();
    if ('touches' in e) {
      for (const t of Array.from(e.changedTouches)) {
        if (t.identifier === touchId.current) {
          update(t.clientX - center.current.x, t.clientY - center.current.y);
        }
      }
    } else {
      update((e as React.MouseEvent).clientX - center.current.x, (e as React.MouseEvent).clientY - center.current.y);
    }
  }, [update]);

  return (
    <div
      ref={baseRef}
      onTouchStart={onStart}
      onTouchMove={onMoveHandler}
      onTouchEnd={reset}
      onTouchCancel={reset}
      onMouseDown={onStart}
      onMouseMove={onMoveHandler}
      onMouseUp={reset}
      onMouseLeave={reset}
      className="absolute bottom-6 left-1/2 -translate-x-1/2 w-32 h-32 rounded-full bg-black/30 backdrop-blur-sm border-2 border-white/20 flex items-center justify-center touch-none z-20"
      style={{ touchAction: 'none' }}
    >
      <div className="absolute inset-2 rounded-full border border-white/10" />
      <div
        ref={knobRef}
        className="w-14 h-14 rounded-full bg-gradient-to-b from-emerald-400 to-emerald-700 border-2 border-white/40 shadow-lg pointer-events-none"
      />
    </div>
  );
}
