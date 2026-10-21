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
// The first animation of an element reads --mv-*; its extra animations (utils/elementAnimation) read
// --mv1-* … --mv3-* through their own keyframes, so two custom motions never share variables.
export const customMotionKeyframes = (layer: number) => (layer === 0 ? CUSTOM_MOTION_KEYFRAMES : `${CUSTOM_MOTION_KEYFRAMES}-${layer}`);

// What an element is, as the owner sees it on the page (Eyad, 21 Oct): a custom motion's first state is these real
// values unless the owner changed it, and its last state is saved when the motion is chosen and stays as set. The
// first animation of an element is read in real values (opacity and turn as the element has them; the shift from where
// it is). Its extra animations lie on top of the first, so they stay relative (shift 0, opacity 1, turn 0).
export const realMotionState = (styles: { opacity?: number }, rotation = 0): Required<MotionState> => ({
  x: 0, y: 0, opacity: typeof styles.opacity === 'number' ? styles.opacity : 1, scale: 1, rotate: rotation || 0,
});
export const RELATIVE_MOTION_STATE: Required<MotionState> = { x: 0, y: 0, opacity: 1, scale: 1, rotate: 0 };

// The two states of a motion: the first follows the element's real values for what the owner did not set, and a last
// state not saved yet is the first.
export const resolveMotion = (layer: { animationFrom?: MotionState; animationTo?: MotionState }, real: Required<MotionState>) => {
  const from = { ...real, ...layer.animationFrom };
  return { from, to: { ...from, ...layer.animationTo } };
};

const num = (v: unknown, fallback: number) => (typeof v === 'number' && Number.isFinite(v) ? v : fallback);

// `shrink` is 0.5 on a phone, so a shift never throws an element off the narrow screen. `realOpacity` is the
// element's own opacity (kept on its content): the animation fades the whole element, so a state's opacity is
// taken as a share of it.
export const customMotionVars = (
  from: Required<MotionState>,
  to: Required<MotionState>,
  shrink = 1,
  layer = 0,
  realOpacity = 1,
  minOpacity = 0,
): Record<string, string> => {
  const p = layer === 0 ? 'mv' : `mv${layer}`;
  const share = layer === 0 && realOpacity > 0 ? realOpacity : 1;
  const state = (key: 'f' | 't', s: Required<MotionState>) => ({
    [`--${p}-${key}x`]: `${Math.round(num(s.x, 0) * shrink)}px`,
    [`--${p}-${key}y`]: `${Math.round(num(s.y, 0) * shrink)}px`,
    [`--${p}-${key}o`]: String(Math.min(1, Math.max(minOpacity, num(s.opacity, 1) / share))),
    [`--${p}-${key}s`]: String(Math.max(0, num(s.scale, 1))),
    [`--${p}-${key}r`]: `${num(s.rotate, 0)}deg`,
  });
  return { ...state('f', from), ...state('t', to) };
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
