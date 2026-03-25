/**
 * Unit tests for the computeFanPositions pure function exported from useRadialMenu.
 * Tests symmetric 30-degree fan geometry for all directions and target counts.
 */
import { computeFanPositions } from './useRadialMenu';
import type { Target } from '../../database/types';

function makeTarget(id: string): Target {
  return {
    id,
    pillarId: 1,
    realName: 'Test',
    codename: null,
    isMasked: false,
    status: 'active',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };
}

const RADIUS = 80;

describe('computeFanPositions — fan geometry', () => {
  it('returns [] for 0 targets', () => {
    expect(computeFanPositions([], 'up', RADIUS)).toEqual([]);
  });

  // direction='up', baseAngle=90
  it('n=1, direction=up: single position at angle 90', () => {
    const [pos] = computeFanPositions([makeTarget('t1')], 'up', RADIUS);
    expect(pos.angle).toBe(90);
    expect(pos.x).toBeCloseTo(0, 1);
    expect(pos.y).toBeCloseTo(-RADIUS, 1);
  });

  it('n=2, direction=up: positions at angles 75 and 105', () => {
    const positions = computeFanPositions(
      [makeTarget('t1'), makeTarget('t2')],
      'up',
      RADIUS
    );
    expect(positions).toHaveLength(2);
    expect(positions[0].angle).toBe(75);
    expect(positions[1].angle).toBe(105);
  });

  it('n=3, direction=up: positions at angles 60, 90, 120', () => {
    const positions = computeFanPositions(
      [makeTarget('t1'), makeTarget('t2'), makeTarget('t3')],
      'up',
      RADIUS
    );
    expect(positions).toHaveLength(3);
    expect(positions[0].angle).toBe(60);
    expect(positions[1].angle).toBe(90);
    expect(positions[2].angle).toBe(120);
  });

  // direction='right', baseAngle=0
  it('n=1, direction=right: angle=0, x=radius, y near 0', () => {
    const [pos] = computeFanPositions([makeTarget('t1')], 'right', RADIUS);
    expect(pos.angle).toBe(0);
    expect(pos.x).toBeCloseTo(RADIUS, 1);
    expect(pos.y).toBeCloseTo(0, 1);
  });

  it('n=2, direction=right: positions at angles -15 and 15', () => {
    const positions = computeFanPositions(
      [makeTarget('t1'), makeTarget('t2')],
      'right',
      RADIUS
    );
    expect(positions[0].angle).toBe(-15);
    expect(positions[1].angle).toBe(15);
  });

  it('n=3, direction=right: positions at angles -30, 0, 30', () => {
    const positions = computeFanPositions(
      [makeTarget('t1'), makeTarget('t2'), makeTarget('t3')],
      'right',
      RADIUS
    );
    expect(positions[0].angle).toBe(-30);
    expect(positions[1].angle).toBe(0);
    expect(positions[2].angle).toBe(30);
  });

  // direction='down', baseAngle=270
  it('n=3, direction=down: positions at angles 240, 270, 300', () => {
    const positions = computeFanPositions(
      [makeTarget('t1'), makeTarget('t2'), makeTarget('t3')],
      'down',
      RADIUS
    );
    expect(positions[0].angle).toBe(240);
    expect(positions[1].angle).toBe(270);
    expect(positions[2].angle).toBe(300);
  });

  // direction='left', baseAngle=180
  it('n=1, direction=left: angle=180, x near -radius, y near 0', () => {
    const [pos] = computeFanPositions([makeTarget('t1')], 'left', RADIUS);
    expect(pos.angle).toBe(180);
    expect(pos.x).toBeCloseTo(-RADIUS, 1);
    expect(pos.y).toBeCloseTo(0, 1);
  });

  it('each position includes the correct target reference', () => {
    const t1 = makeTarget('specific-id');
    const [pos] = computeFanPositions([t1], 'up', RADIUS);
    expect(pos.target.id).toBe('specific-id');
  });
});
