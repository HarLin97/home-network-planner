import React, { useEffect, useRef, useState } from 'react';
import { BaseEdge, EdgeProps, getBezierPath, useReactFlow } from '@xyflow/react';

// We'll inject the keyframes once
const style = document.createElement('style');
style.innerHTML = `
  @keyframes flowAnimation {
    from { stroke-dashoffset: 0; }
    to { stroke-dashoffset: -30; } /* 2 * spacing (15px) */
  }
  @keyframes flowAnimationReverse {
    from { stroke-dashoffset: 0; }
    to { stroke-dashoffset: 30; }
  }
`;
document.head.appendChild(style);

export const FlowEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}: EdgeProps) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const pathRef = useRef<SVGPathElement>(null);
  const [pathLength, setPathLength] = useState(0);

  // Configuration from data or defaults
  const speed = (data?.speed as number) || 100; // px per second
  const color = (data?.color as string) || 'rgb(0, 100, 255)';
  const particleSize = (data?.particleSize as number) || 4;
  const spacing = (data?.spacing as number) || 15;
  const isReverse = data?.direction === 'rtl' || data?.direction === 'btt';

  // Measure path length for constant speed
  useEffect(() => {
    if (pathRef.current) {
      setPathLength(pathRef.current.getTotalLength());
    }
  }, [sourceX, sourceY, targetX, targetY]);

  // Calculate animation duration
  // We want the pattern to move.
  // Actually, for infinite loop, we don't need total length duration.
  // We just need the dash pattern to shift by "spacing" amount.
  // If we shift by `spacing` pixels, the pattern repeats.
  // Speed = distance / time => time = distance / speed.
  // To shift by `spacing * 2` (30px) at `speed` (100px/s):
  // Duration = 30 / 100 = 0.3s.
  // This seems very fast for the cycle, but visual speed will be correct.
  
  // Actually, to make it look like it's moving along the whole line at constant speed:
  // We just animate the offset. The duration for ONE cycle (e.g. 30px) determines the speed.
  // Duration = (spacing * 2) / speed.
  
  const cycleLength = spacing * 2;
  const duration = cycleLength / speed; // seconds

  return (
    <>
      {/* Base invisible path for selection area if needed, or just the visible path */}
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={{ strokeWidth: 0, stroke: 'transparent' }} />
      
      {/* The Particle Path */}
      <path
        id={id}
        ref={pathRef}
        style={{
          ...style,
          strokeWidth: particleSize,
          stroke: color,
          fill: 'none',
          strokeLinecap: 'round',
          strokeDasharray: `0 ${spacing}`, // 0 length dash (dot) with spacing gap
          animation: `flowAnimation${isReverse ? 'Reverse' : ''} ${duration}s linear infinite`,
        }}
        d={edgePath}
        className="react-flow__edge-path"
      />
    </>
  );
};
