/**
 * Joystick component constants.
 * All sizing and timing values centralized here.
 */

/** Outer container diameter (px) — ADR-021 */
export const JOYSTICK_SIZE = 100;

/** Draggable knob diameter (px) */
export const KNOB_SIZE = 56;

/** Minimum drag distance (px) before a swipe registers — prevents accidental taps */
export const SWIPE_THRESHOLD = 30;

/** Duration (ms) thumb must be held before radial menu triggers */
export const HOLD_DURATION = 400;

/** Maximum distance (px) the knob can travel from center */
export const MAX_DRAG_DISTANCE = 40;

/** Debounce cooldown (ms) to prevent double-logging on rapid swipes */
export const DEBOUNCE_MS = 300;

/** Degrees per direction wedge for swipe detection (45° = 90° total per direction) */
export const DIRECTION_ANGLE = 45;

/** Spring physics config for knob snap-back animation */
export const SNAP_BACK_CONFIG = {
  damping: 15,
  stiffness: 150,
  mass: 1,
};

/** Size of direction indicator dots (px) */
export const INDICATOR_SIZE = 6;

/** Radial menu: distance of target bubbles from joystick center */
export const RADIAL_MENU_RADIUS = 110;

/** Radial menu: size of each target bubble */
export const RADIAL_BUBBLE_SIZE = 44;

/** Radial menu: hit radius for target selection */
export const RADIAL_HIT_RADIUS = 30;

/** Radial menu: arc span in degrees */
export const RADIAL_ARC_SPAN = 120;

/** Distance from center (px) below which LongPress is treated as center hold (D-01) */
export const CENTER_HOLD_THRESHOLD = 15;

/** Maximum active targets shown in radial fan per direction (D-10) */
export const MAX_ACTIVE_TARGETS = 3;
