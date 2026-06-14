import { useRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

interface MagneticButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  magnetic?: boolean;
}

export function MagneticButton({
  children,
  className = '',
  magnetic = true,
  onPointerMove,
  onPointerLeave,
  ...props
}: MagneticButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);

  const handlePointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    onPointerMove?.(event);
    if (!magnetic || !ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = event.clientX - cx;
    const dy = event.clientY - cy;
    const distance = Math.hypot(dx, dy);
    const radius = 48;

    if (distance < radius) {
      const pull = (radius - distance) / radius;
      ref.current.style.setProperty('--magnetic-x', `${dx * pull * 0.18}px`);
      ref.current.style.setProperty('--magnetic-y', `${dy * pull * 0.18}px`);
    } else {
      ref.current.style.setProperty('--magnetic-x', '0px');
      ref.current.style.setProperty('--magnetic-y', '0px');
    }
  };

  const handlePointerLeave = (event: React.PointerEvent<HTMLButtonElement>) => {
    onPointerLeave?.(event);
    if (ref.current) {
      ref.current.style.setProperty('--magnetic-x', '0px');
      ref.current.style.setProperty('--magnetic-y', '0px');
    }
  };

  return (
    <button
      ref={ref}
      type="button"
      className={`magnetic-btn ${className}`.trim()}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      {...props}
    >
      {children}
    </button>
  );
}
