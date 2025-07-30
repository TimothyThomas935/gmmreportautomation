// components/MovementPathsOverlay.tsx
"use client";
import { areaPositions } from "../public/HardCodedValues/areaPositions";

type Props = {
  paths: { from: string; to: string; count: number }[];
};

const MovementPathsOverlay = ({ paths }: Props) => {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none">
      <defs>
        <marker
          id="arrow"
          markerWidth="6"
          markerHeight="6"
          refX="5"
          refY="3"
          orient="auto"
        >
          <path d="M0,0 L0,6 L6,3 z" fill="blue" />
        </marker>
      </defs>

      {paths.map(({ from, to, count }, idx) => {
        const fromPos = areaPositions[from];
        const toPos = areaPositions[to];
        if (!fromPos || !toPos) return null;

        const lines = Math.min(count, 10);
        const offsetStep = 2; // pixels between lines

        const fromX = parseFloat(fromPos.left);
        const fromY = parseFloat(fromPos.top);
        const toX = parseFloat(toPos.left);
        const toY = parseFloat(toPos.top);

        return Array.from({ length: lines }).map((_, i) => {
          const dx = (i - (lines - 1) / 2) * offsetStep;
          return (
            <line
              key={`${from}-${to}-${i}`}
              x1={`${fromX + dx}%`}
              y1={`${fromY + dx}%`}
              x2={`${toX + dx}%`}
              y2={`${toY + dx}%`}
              stroke="blue"
              strokeWidth="2"
              markerEnd="url(#arrow)"
            />
          );
        });
      })}
    </svg>
  );
};

export default MovementPathsOverlay;
