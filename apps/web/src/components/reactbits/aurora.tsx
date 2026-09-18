import type { CSSProperties } from "react";

interface AuroraProps {
  colorStops?: string[];
  speed?: number;
}

const DEFAULT_STOPS = ["#D9482E", "#E5A93B", "#9DBB93"];

/**
 * Ambient drifting gradient wash (M13: CSS replacement for the WebGL/ogl
 * aurora shader — same placement and palette, no dependency).
 */
export default function Aurora({ colorStops = DEFAULT_STOPS, speed = 1 }: AuroraProps) {
  const [first = DEFAULT_STOPS[0], second = DEFAULT_STOPS[1], third = DEFAULT_STOPS[2]] =
    colorStops;
  const duration = `${18 / Math.max(speed, 0.1)}s`;

  return (
    <div className="aurora" aria-hidden="true">
      <div
        className="aurora-blob"
        style={
          {
            "--aurora-a": first,
            "--aurora-b": second,
            "--aurora-c": third,
            "--aurora-duration": duration,
          } as CSSProperties
        }
      />
    </div>
  );
}
