import { useEffect, useRef } from 'react';
import Matter from 'matter-js';
import { makeMutable } from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';
import { BODY_WALLS, BODY_DIMENSIONS } from '../../constants/bodyPath';
import { getLogColor } from '../../constants/pillars';
import type { PillarId, SwipeDirection } from '../../constants/pillars';
import type { Log } from '../../database/types';

/** Maximum number of physics balls rendered at once (ADR-026, D-17) */
const MAX_BALLS = 50;

export interface BallState {
  x: SharedValue<number>;
  y: SharedValue<number>;
  r: number;
  color: string;
}

interface BallConfig {
  dropX: number;
  radius: number;
  color: string;
}

/**
 * Aggregate logs into a display-friendly set of at most MAX_BALLS balls.
 * When there are more logs than MAX_BALLS, balls grow in radius (volume-based
 * scaling via Math.cbrt) so each ball represents multiple logs. (ADR-026)
 */
function aggregateLogs(logs: Log[], scaleX: number, scaleY: number): BallConfig[] {
  if (logs.length === 0) return [];

  const scaleFactor = logs.length > MAX_BALLS ? logs.length / MAX_BALLS : 1;
  // Base radius of 6 pts at 200x400 viewBox, then scaled to canvas and grown for aggregation
  const baseRadius = 6 * Math.min(scaleX, scaleY);
  const aggregatedRadius = baseRadius * Math.cbrt(scaleFactor);

  const displayLogs =
    logs.length > MAX_BALLS
      ? logs.filter((_, i) => i % Math.ceil(logs.length / MAX_BALLS) === 0).slice(0, MAX_BALLS)
      : logs;

  return displayLogs.map((log) => ({
    // Drop within the torso width (roughly 40–140 in body coords) scaled to canvas
    dropX: 40 * scaleX + Math.random() * (100 * scaleX),
    radius: aggregatedRadius,
    color: getLogColor(log.pillarId as PillarId, log.direction as SwipeDirection),
  }));
}

/**
 * Physics engine hook for the body-fill visualization.
 *
 * Creates a Matter.js engine with static rectangular walls approximating the
 * body silhouette, then drops balls for each (aggregated) log entry.
 * Ball positions are bridged to Reanimated SharedValues via makeMutable so
 * the Skia canvas reads them without React re-renders.
 *
 * Cleans up the animation loop and physics engine on unmount to prevent
 * memory leaks (Research Pitfall 3 from 04-RESEARCH.md).
 */
export function useBodyFillPhysics(
  logs: Log[],
  canvasWidth: number,
  canvasHeight: number,
): { ballStates: React.MutableRefObject<BallState[]>; isSettled: SharedValue<boolean> } {
  const ballStates = useRef<BallState[]>([]);
  const isSettledRef = useRef<SharedValue<boolean>>(makeMutable(false));

  useEffect(() => {
    if (canvasWidth <= 0 || canvasHeight <= 0) return;

    const scaleX = canvasWidth / BODY_DIMENSIONS.width;
    const scaleY = canvasHeight / BODY_DIMENSIONS.height;

    // Reset settled flag for new simulation
    isSettledRef.current.value = false;

    // --- Engine setup ---
    const engine = Matter.Engine.create({ gravity: { x: 0, y: 1.2 } });
    const { world } = engine;

    // Add static walls scaled to canvas dimensions
    const walls = BODY_WALLS.map((wall) =>
      Matter.Bodies.rectangle(
        wall.x * scaleX,
        wall.y * scaleY,
        wall.width * scaleX,
        wall.height * scaleY,
        { isStatic: true, label: 'wall' },
      ),
    );
    Matter.World.add(world, walls);

    // --- Ball setup ---
    const ballConfigs = aggregateLogs(logs, scaleX, scaleY);
    const bodies: (Matter.Body | null)[] = new Array(ballConfigs.length).fill(null);
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    // Pre-create SharedValues and BallState entries so the canvas has stable indices
    const newBallStates: BallState[] = ballConfigs.map((config) => ({
      x: makeMutable(config.dropX),
      y: makeMutable(-config.radius),
      r: config.radius,
      color: config.color,
    }));

    ballStates.current = newBallStates;

    // Stagger ball drops per D-18 (chronological order)
    ballConfigs.forEach((config, i) => {
      const timeoutId = setTimeout(() => {
        const body = Matter.Bodies.circle(
          config.dropX,
          -config.radius,
          config.radius,
          {
            restitution: 0.3,
            friction: 0.1,
            frictionAir: 0.02,
            label: 'ball',
          },
        );
        Matter.World.add(world, body);
        bodies[i] = body;
      }, i * 120);
      timeouts.push(timeoutId);
    });

    // --- Animation loop ---
    let rafId: number;
    let settledFrames = 0;
    const SETTLED_THRESHOLD = 30;
    const VELOCITY_THRESHOLD = 0.5;

    const tick = () => {
      Matter.Engine.update(engine, 1000 / 60);

      bodies.forEach((body, i) => {
        if (body && newBallStates[i]) {
          newBallStates[i].x.value = body.position.x;
          newBallStates[i].y.value = body.position.y;
        }
      });

      // Track settlement: all spawned balls nearly still for SETTLED_THRESHOLD frames
      if (!isSettledRef.current.value) {
        const spawnedBodies = bodies.filter((b): b is Matter.Body => b !== null);
        if (spawnedBodies.length > 0) {
          const allStill = spawnedBodies.every(
            (body) =>
              Math.abs(body.velocity.x) < VELOCITY_THRESHOLD &&
              Math.abs(body.velocity.y) < VELOCITY_THRESHOLD,
          );
          if (allStill) {
            settledFrames++;
            if (settledFrames >= SETTLED_THRESHOLD) {
              isSettledRef.current.value = true;
            }
          } else {
            settledFrames = 0;
          }
        }
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    // --- Cleanup ---
    return () => {
      cancelAnimationFrame(rafId);
      timeouts.forEach((id) => clearTimeout(id));
      Matter.World.clear(world, false);
      Matter.Engine.clear(engine);
      ballStates.current = [];
    };
  }, [logs, canvasWidth, canvasHeight]);

  return { ballStates, isSettled: isSettledRef.current };
}
