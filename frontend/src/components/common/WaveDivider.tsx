interface WaveDividerProps {
  className?: string;
  /** Fill colour of the front wave (CSS colour). Defaults to the page background. */
  fill?: string;
}

const PATH =
  'M0,40 C150,80 350,0 600,40 C850,80 1050,0 1200,40 L1200,80 L0,80 Z';

/** Animated, layered sea waves used as a section divider. */
export default function WaveDivider({ className = '', fill = 'hsl(var(--background))' }: WaveDividerProps) {
  const layer = (color: string, opacity: number, extra: string) => (
    <div className={`wave-track ${extra}`} style={{ opacity }}>
      {[0, 1].map((i) => (
        <svg key={i} viewBox="0 0 1200 80" preserveAspectRatio="none" className="h-16 md:h-24 w-1/2 block">
          <path d={PATH} fill={color} />
        </svg>
      ))}
    </div>
  );

  return (
    <div className={`pointer-events-none overflow-hidden leading-[0] ${className}`} aria-hidden>
      <div className="relative">
        <div className="absolute inset-x-0 bottom-0">{layer('hsl(199 85% 72%)', 0.6, 'slow reverse')}</div>
        <div className="absolute inset-x-0 bottom-0">{layer('hsl(196 85% 82%)', 0.85, '')}</div>
        <div className="relative">{layer(fill, 1, 'slow')}</div>
      </div>
    </div>
  );
}
