import React, { useMemo } from 'react';
import { Canvas, Group, Circle, Path, Skia } from '@shopify/react-native-skia';
import { BODY_SVG_PATH } from '../../constants/bodyPath';
import { colors } from '../../constants/colors';
import type { BallState } from './useBodyFillPhysics';

interface BodyFillCanvasProps {
  ballStates: React.MutableRefObject<BallState[]>;
  width: number;
  height: number;
}

/**
 * Build a scaled Skia path from the body SVG string.
 * The base path is defined in a 200×400 viewBox; we scale it to match
 * the actual canvas dimensions at render time.
 */
function getScaledBodyPath(width: number, height: number) {
  const path = Skia.Path.MakeFromSVGString(BODY_SVG_PATH);
  if (!path) return null;
  const scaleX = width / 200;
  const scaleY = height / 400;
  path.transform(Skia.Matrix().scale(scaleX, scaleY));
  return path;
}

/**
 * Skia canvas that renders the body silhouette outline and the physics balls
 * clipped to the body shape. Ball positions come from Reanimated SharedValues
 * (written by the physics game loop) so the canvas re-draws at 60fps without
 * triggering React re-renders.
 */
export function BodyFillCanvas({ ballStates, width, height }: BodyFillCanvasProps) {
  // Cache the scaled path so it's only recomputed when dimensions change
  const scaledPath = useMemo(() => getScaledBodyPath(width, height), [width, height]);

  return (
    <Canvas style={{ width, height }}>
      {/* Body outline stroke */}
      {scaledPath && (
        <Path
          path={scaledPath}
          style="stroke"
          strokeWidth={1.5}
          color={colors.border}
        />
      )}

      {/* Physics balls clipped to body silhouette */}
      {scaledPath && (
        <Group clip={scaledPath}>
          {ballStates.current.map((ball, i) => (
            <Circle
              key={i}
              cx={ball.x}
              cy={ball.y}
              r={ball.r}
              color={ball.color}
            />
          ))}
        </Group>
      )}
    </Canvas>
  );
}
