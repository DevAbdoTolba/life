/**
 * generate-icons.js
 *
 * Generates all Hayat app icon and splash screen assets at 1024x1024.
 * Design: 3 overlapping circles representing the 3 life pillars
 *   - Afterlife: Golden (#F5A623) — top center
 *   - Self: Emerald Green (#10B981) — bottom left
 *   - Others: Sky Blue (#3B82F6) — bottom right
 *
 * Usage: node scripts/generate-icons.js
 * Requires: sharp (npm install --save-dev sharp)
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const ASSETS_DIR = path.join(__dirname, '..', 'assets');
const SIZE = 1024;
const BG_COLOR = '#0A0A0F';

// Base circle definitions for 1024x1024 canvas
const BASE_CIRCLES = {
  afterlife: { cx: 512, cy: 380, r: 180, fill: '#F5A623' },
  self:      { cx: 380, cy: 600, r: 180, fill: '#10B981' },
  others:    { cx: 644, cy: 600, r: 180, fill: '#3B82F6' },
};

const OPACITY = 0.85;

/**
 * Renders 3 circles as SVG circle elements
 */
function circlesSVG(circles, opacity = OPACITY) {
  return circles.map(c =>
    `<circle cx="${c.cx}" cy="${c.cy}" r="${c.r}" fill="${c.fill}" opacity="${opacity}"/>`
  ).join('\n  ');
}

/**
 * Scale circles for Android adaptive icon safe zone (center 66%)
 * Scale factor 0.66, then offset to recenter
 */
function scaledCirclesForAdaptive(baseCircles) {
  const scale = 0.66;
  const offset = (SIZE - SIZE * scale) / 2; // 170.24px
  return baseCircles.map(c => ({
    cx: Math.round(c.cx * scale + offset),
    cy: Math.round(c.cy * scale + offset),
    r:  Math.round(c.r * scale),
    fill: c.fill,
  }));
}

const baseCircleList = Object.values(BASE_CIRCLES);
const adaptiveCircleList = scaledCirclesForAdaptive(baseCircleList);
const monochromeCircleList = baseCircleList.map(c => ({ ...c, fill: '#FFFFFF' }));

/**
 * icon.png — 1024x1024, solid dark background, 3 circles on top
 * No transparency, no rounded corners (OS applies rounding)
 */
async function generateIcon() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <rect width="${SIZE}" height="${SIZE}" fill="${BG_COLOR}"/>
  ${circlesSVG(baseCircleList)}
</svg>`;

  await sharp(Buffer.from(svg))
    .png({ compressionLevel: 9 })
    .toFile(path.join(ASSETS_DIR, 'icon.png'));
  console.log('Generated: assets/icon.png (1024x1024, solid bg)');
}

/**
 * splash-icon.png — 1024x1024, TRANSPARENT background, just the 3 circles
 * Expo splash config centers on the dark background
 */
async function generateSplashIcon() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  ${circlesSVG(baseCircleList)}
</svg>`;

  await sharp(Buffer.from(svg))
    .png({ compressionLevel: 9 })
    .toFile(path.join(ASSETS_DIR, 'splash-icon.png'));
  console.log('Generated: assets/splash-icon.png (1024x1024, transparent bg)');
}

/**
 * android-icon-foreground.png — 1024x1024, TRANSPARENT background
 * Circles scaled to fit CENTER 66% safe zone for adaptive icon masks
 */
async function generateAndroidForeground() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  ${circlesSVG(adaptiveCircleList)}
</svg>`;

  await sharp(Buffer.from(svg))
    .png({ compressionLevel: 9 })
    .toFile(path.join(ASSETS_DIR, 'android-icon-foreground.png'));
  console.log('Generated: assets/android-icon-foreground.png (1024x1024, safe zone scaled)');
}

/**
 * android-icon-background.png — 1024x1024, solid dark background, no design
 */
async function generateAndroidBackground() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <rect width="${SIZE}" height="${SIZE}" fill="${BG_COLOR}"/>
</svg>`;

  await sharp(Buffer.from(svg))
    .png({ compressionLevel: 9 })
    .toFile(path.join(ASSETS_DIR, 'android-icon-background.png'));
  console.log('Generated: assets/android-icon-background.png (1024x1024, solid bg only)');
}

/**
 * android-icon-monochrome.png — 1024x1024, TRANSPARENT background
 * Same layout as splash but all fills = white for Android 13+ themed icons
 */
async function generateAndroidMonochrome() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  ${circlesSVG(monochromeCircleList)}
</svg>`;

  await sharp(Buffer.from(svg))
    .png({ compressionLevel: 9 })
    .toFile(path.join(ASSETS_DIR, 'android-icon-monochrome.png'));
  console.log('Generated: assets/android-icon-monochrome.png (1024x1024, white circles)');
}

async function main() {
  console.log('Generating Hayat app icon assets...\n');

  // Ensure assets directory exists
  if (!fs.existsSync(ASSETS_DIR)) {
    fs.mkdirSync(ASSETS_DIR, { recursive: true });
  }

  await generateIcon();
  await generateSplashIcon();
  await generateAndroidForeground();
  await generateAndroidBackground();
  await generateAndroidMonochrome();

  console.log('\nDone! All 5 icon assets generated at 1024x1024.');
  console.log('app.json already references the correct paths — no changes needed.');
}

main().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
