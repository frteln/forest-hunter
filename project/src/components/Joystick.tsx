import { useRef, useState, useCallback, useEffect } from 'react';

interface Props {
  onMove: (x: number, y: number) => void;
}

export function Joystick({ onMove }: Props) {
  const [visible, setVisible] = useState(false);
  const [basePos, setBasePos] = useState({ x: 0, y: 0 });
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });

  const activeRef = useRef(false);
  const touchIdRef = useRef<number | null>(null);
  const centerRef = useRef({ x: 0, y: 0 });

  const handleMove = useCallback((clientX: number, clientY: number) => {
    const dx = clientX - centerRef.current.x;
    const dy = clientY - centerRef.current.y;
    const maxRadius = 45;
    const dist = Math.hypot(dx, dy);
    const clamped = Math.min(dist, maxRadius);
    const angle = Math.atan2(dy, dx);

    const kx = Math.cos(angle) * clamped;
    const ky = Math.sin(angle) * clamped;

    setKnobPos({ x: kx, y: ky });
    onMove(kx / maxRadius, ky / maxRadius);
  }, [onMove]);

  const handleReset = useCallback(() => {
    activeRef.current = false;
    touchIdRef.current = null;
    setVisible(false);
    setKnobPos({ x: 0, y: 0 });
    onMove(0, 0);
  }, [onMove]);

  const handleStart = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if ('button' in e && e.button !== 0) return;

    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      const t = e.changedTouches[0];
      touchIdRef.current = t.identifier;
      clientX = t.clientX;
      clientY = t.clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    activeRef.current = true;
    centerRef.current = { x: clientX, y: clientY };
    setBasePos({ x: clientX, y: clientY });
    setKnobPos({ x: 0, y: 0 });
    setVisible(true);
    onMove(0, 0);
  }, [onMove]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!activeRef.current || touchIdRef.current === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (t.identifier === touchIdRef.current) {
        handleMove(t.clientX, t.clientY);
        break;
      }
    }
  }, [handleMove]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!activeRef.current) return;
    handleMove(e.clientX, e.clientY);
  }, [handleMove]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!activeRef.current || touchIdRef.current === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === touchIdRef.current) {
        handleReset();
        break;
      }
    }
  }, [handleReset]);

  const handleMouseUp = useCallback(() => {
    if (activeRef.current) {
      handleReset();
    }
  }, [handleReset]);

  useEffect(() => {
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('touchcancel', handleTouchEnd);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleTouchMove, handleTouchEnd, handleMouseMove, handleMouseUp]);

  return (
    <div
      onTouchStart={handleStart}
      onMouseDown={handleStart}
      className="absolute inset-0 z-10 touch-none select-none"
    >
      {visible && (
        <div
          className="absolute w-28 h-28 -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-900/60 backdrop-blur-md border-2 border-emerald-400/50 flex items-center justify-center pointer-events-none shadow-2xl shadow-emerald-950/40"
          style={{
            left: `${basePos.x}px`,
            top: `${basePos.y}px`,
          }}
        >
          {/* Inner Ring */}
          <div className="absolute inset-1.5 rounded-full border border-emerald-400/20" />
          {/* Joystick Knob */}
          <div
            className="w-12 h-12 rounded-full bg-gradient-to-b from-emerald-400 to-emerald-700 border-2 border-white/70 shadow-lg"
            style={{
              transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
            }}
          />
        </div>
      )}
    </div>
  );
}