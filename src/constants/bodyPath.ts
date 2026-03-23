/**
 * Cartoonish human body silhouette SVG path for Skia clip (VIZ-02, D-14).
 * Designed for a 200x400 viewBox. Simple segmented body per D-14:
 * not anatomically detailed — just recognizably human-shaped.
 *
 * Shape regions (in viewBox coords):
 *   Head:      circle at top center (~x:100, y:30, r:25)
 *   Neck:      narrow column ~x:88-112, y:55-72
 *   Torso:     ~x:55-145, y:72-220
 *   Left arm:  ~x:15-55, y:85-185
 *   Right arm: ~x:145-185, y:85-185
 *   Left leg:  ~x:60-98, y:220-385
 *   Right leg: ~x:102-140, y:220-385
 */
export const BODY_SVG_PATH = `
  M 100 5
  C 125 5 130 25 130 35
  C 130 50 120 55 112 58
  L 112 60
  L 140 68
  L 175 82
  C 185 87 185 97 180 102
  L 180 172
  C 180 182 170 187 160 182
  L 145 172
  L 145 215
  L 140 220
  L 140 372
  C 140 386 130 390 124 390
  L 108 390
  C 103 390 101 384 101 374
  L 101 220
  L 99 220
  L 99 374
  C 99 384 97 390 92 390
  L 76 390
  C 70 390 60 386 60 372
  L 60 220
  L 55 215
  L 55 172
  L 40 182
  C 30 187 20 182 20 172
  L 20 102
  C 15 97 15 87 25 82
  L 60 68
  L 88 60
  L 88 58
  C 80 55 70 50 70 35
  C 70 25 75 5 100 5
  Z
`;

/** Dimensions of the body path viewBox */
export const BODY_DIMENSIONS = { width: 200, height: 400 };

/**
 * Static rectangular Matter.js wall definitions that approximate
 * the body's internal boundaries. These keep balls roughly inside
 * the silhouette. Skia clip handles precise visual containment.
 * Per ADR-025: simplified rectangular walls, not SVG-to-polygon.
 *
 * Each wall: { x, y, width, height } where x/y is the CENTER of the rectangle.
 * All values are in BODY_DIMENSIONS coordinate space (200x400).
 */
export const BODY_WALLS = [
  // Floor — bottom of legs
  { x: 100, y: 400, width: 200, height: 20 },
  // Left outer boundary
  { x: 5, y: 200, width: 10, height: 400 },
  // Right outer boundary
  { x: 195, y: 200, width: 10, height: 400 },
  // Crotch divider — splits the two legs
  { x: 100, y: 305, width: 8, height: 170 },
  // Left arm floor — prevents balls falling out of arm bottom
  { x: 32, y: 185, width: 48, height: 8 },
  // Right arm floor
  { x: 168, y: 185, width: 48, height: 8 },
  // Shoulder shelf left — narrows the neck-to-arm opening
  { x: 52, y: 70, width: 28, height: 6 },
  // Shoulder shelf right
  { x: 148, y: 70, width: 28, height: 6 },
] as const;
