import React, { useEffect, useRef } from 'react';

export interface ParticleLineProps {
  /** Direction of the particle flow */
  direction?: 'ltr' | 'rtl' | 'ttb' | 'btt';
  /** Color of the particles and line (CSS color string) */
  color?: string;
  /** Flow speed in pixels per second */
  speed?: number;
  /** Diameter of the particles in pixels */
  particleSize?: number;
  /** Distance between particles in pixels */
  spacing?: number;
  /** Whether the animation is currently playing */
  isPlaying?: boolean;
  /** Optional width override (defaults to 100% of parent) */
  width?: number;
  /** Optional height override (defaults to 100% of parent) */
  height?: number;
  className?: string;
}

const ParticleLine: React.FC<ParticleLineProps> = ({
  direction = 'ltr',
  color = 'rgb(0, 100, 255)',
  speed = 125,
  particleSize = 4,
  spacing = 15,
  isPlaying = true,
  width,
  height,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const reqIdRef = useRef<number>();
  const timeRef = useRef<number>(0);
  const lastFrameTimeRef = useRef<number>(0);

  // Helper to determine dimensions based on direction
  const isHorizontal = direction === 'ltr' || direction === 'rtl';

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle resizing
    const updateSize = () => {
      // If explicit dimensions provided, use them. Otherwise fill container.
      // For lines, we usually want specific thickness.
      // We'll assume the container defines the "length" and "thickness".
      const w = width ?? container.clientWidth;
      const h = height ?? container.clientHeight;
      
      // Handle high DPI displays
      const dpr = window.devicePixelRatio || 1;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.scale(dpr, dpr);
    };

    // Initial size
    updateSize();
    
    // Observer for resize
    const resizeObserver = new ResizeObserver(() => updateSize());
    resizeObserver.observe(container);

    // Animation Loop
    const render = (timestamp: number) => {
      if (!lastFrameTimeRef.current) lastFrameTimeRef.current = timestamp;
      
      // Calculate delta time
      const deltaTime = (timestamp - lastFrameTimeRef.current) / 1000; // in seconds
      lastFrameTimeRef.current = timestamp;

      if (isPlaying) {
        timeRef.current += deltaTime;
      }

      // Clear canvas
      const w = canvas.width / (window.devicePixelRatio || 1);
      const h = canvas.height / (window.devicePixelRatio || 1);
      ctx.clearRect(0, 0, w, h);

      // Draw background line (faint)
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.2;
      ctx.lineWidth = 1;
      
      if (isHorizontal) {
        const y = h / 2;
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
      } else {
        const x = w / 2;
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
      }
      ctx.stroke();

      // Draw particles
      ctx.globalAlpha = 1.0;
      ctx.fillStyle = color;

      const totalDist = isHorizontal ? w : h;
      // Calculate effective offset based on speed and time
      // offset = (time * speed) % spacing
      // We want to draw particles at positions: i * spacing + offset
      
      const currentOffset = (timeRef.current * speed) % spacing;
      
      // Determine start and end based on direction
      // For LTR: draw from left.
      // For RTL: draw from right (or just reverse calculation).
      
      // We calculate "positions along the line" from 0 to totalDist
      // For RTL/BTT, we just invert the visual position.

      // Start a bit before 0 to handle entering particles
      // End a bit after totalDist to handle exiting particles
      
      const particleCount = Math.ceil(totalDist / spacing) + 1;

      for (let i = -1; i < particleCount; i++) {
        let pos = (i * spacing) + currentOffset;
        
        // Adjust for direction if needed (standard is moving forward)
        // If we want RTL, we can just flip the drawing coordinate: totalDist - pos
        // But "pos" moves 0 -> infinity.
        // Let's standardize:
        // LTR/TTB: particles move 0 -> totalDist.
        // RTL/BTT: particles move totalDist -> 0.
        
        let drawX = 0;
        let drawY = 0;

        // Wrap pos to keep it within view + buffer
        // Actually the formula (i * spacing + offset) naturally handles "moving window"
        // because offset increases.
        // However, we want the particles to "flow".
        
        // Correct logic:
        // LTR: x = (pos % (totalDist + spacing)) - particleSize? 
        // Simpler: Just generate a stream.
        // effectivePos = (i * spacing + (time * speed)) % (totalDist + spacing * 2) - spacing;
        
        // Let's stick to the modulo on spacing for infinite stream illusion.
        // pos is 0..spacing..2*spacing + offset.
        // Since offset grows indefinitely, we use modulo logic on the *offset* itself above:
        // `currentOffset = (timeRef.current * speed) % spacing`
        // So `pos` is always `i * spacing + [0..spacing)`.
        // This creates a static set of positions that shift by 0..spacing then jump back.
        // This creates the perfect illusion of infinite flow.

        let visualPos = pos;
        
        // Handling Reverse Flow (RTL / BTT)
        // If RTL, we want visual movement from Right to Left.
        // The calculated `pos` increases (moves right).
        // So we can do `totalDist - pos`.
        if (direction === 'rtl' || direction === 'btt') {
            visualPos = totalDist - pos;
        }

        // Clip/Don't draw if completely out of bounds (optimization)
        if (visualPos < -particleSize || visualPos > totalDist + particleSize) continue;

        if (isHorizontal) {
          drawX = visualPos;
          drawY = h / 2;
        } else {
          drawX = w / 2;
          drawY = visualPos;
        }

        ctx.beginPath();
        ctx.arc(drawX, drawY, particleSize / 2, 0, Math.PI * 2);
        ctx.fill();
      }

      reqIdRef.current = requestAnimationFrame(render);
    };

    reqIdRef.current = requestAnimationFrame(render);

    return () => {
      if (reqIdRef.current) cancelAnimationFrame(reqIdRef.current);
      resizeObserver.disconnect();
    };
  }, [direction, color, speed, particleSize, spacing, isPlaying, width, height]);

  // Handle Reset: user might want to reset time to 0
  // But React "key" or a dedicated method is better. 
  // We'll expose a reset via imperative handle if needed, or just let user re-mount.
  // For now, let's keep it simple.

  return (
    <div 
      ref={containerRef} 
      className={`relative overflow-hidden ${className}`}
      style={{
        width: width ? `${width}px` : (isHorizontal ? '100%' : '20px'),
        height: height ? `${height}px` : (isHorizontal ? '20px' : '100%'),
      }}
    >
      <canvas ref={canvasRef} className="block" />
    </div>
  );
};

export default ParticleLine;
