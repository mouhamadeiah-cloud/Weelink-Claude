// «حركة مخصصة»: the element moves from one state to another that the owner sets (shift, opacity,
// size, turn). The canvas hands the two states to one shared keyframe (`custom-move`, index.css)
// as CSS variables, so the triggers, the speed and the wait-until-seen logic work as for any animation.

export interface MotionState {
  x?: number; // shift to the right, px
  y?: number; // shift down, px
  opacity?: number; // 0..1
  scale?: number; // 1 = as it is
  rotate?: number; // degrees
}

export const CUSTOM_MOTION = 'custom';
export const CUSTOM_MOTION_KEYFRAMES = 'custom-move';

export const DEFAULT_MOTION_FROM: Required<MotionState> = { x: -80, y: 0, opacity: 0, scale: 1, rotate: 0 };
export const DEFAULT_MOTION_TO: Required<MotionState> = { x: 0, y: 0, opacity: 1, scale: 1, rotate: 0 };

const num = (v: unknown, fallback: number) => (typeof v === 'number' && Number.isFinite(v) ? v : fallback);

// `shrink` is 0.5 on a phone, so a shift never throws an element off the narrow screen.
export const customMotionVars = (
  from: MotionState | undefined,
  to: MotionState | undefined,
  baseRotation = 0,
  shrink = 1,
): Record<string, string> => {
  const f = { ...DEFAULT_MOTION_FROM, ...from };
  const t = { ...DEFAULT_MOTION_TO, ...to };
  const state = (key: 'f' | 't', s: Required<MotionState>) => ({
    [`--mv-${key}x`]: `${Math.round(num(s.x, 0) * shrink)}px`,
    [`--mv-${key}y`]: `${Math.round(num(s.y, 0) * shrink)}px`,
    [`--mv-${key}o`]: String(Math.min(1, Math.max(0, num(s.opacity, 1)))),
    [`--mv-${key}s`]: String(Math.max(0, num(s.scale, 1))),
    [`--mv-${key}r`]: `${num(baseRotation, 0) + num(s.rotate, 0)}deg`,
  });
  return { ...state('f', f), ...state('t', t) };
};

// The animation a custom motion plays: a loop or a hover goes there and back, a single play goes there once.
export const customMotionDirection = (trigger: string | undefined, alternate?: boolean) =>
  alternate || trigger === 'loop' || trigger === 'hover' ? 'alternate' : 'normal';

// «Set by dragging»: the owner drags the element to where a state should be; the state is the shift
// from where the element rests (its saved place) to where it was dropped.
export const shiftBetween = (rest: { x: number; y: number }, dropped: { x: number; y: number }, factor = 1) => ({
  x: Math.round((dropped.x - rest.x) * factor),
  y: Math.round((dropped.y - rest.y) * factor),
});
