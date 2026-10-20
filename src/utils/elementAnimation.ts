// The CSS an element's animations come to: its own animation plus up to three more
// (styles.animationLayers, each with its own trigger, speed and, for a custom motion, its two states).
// Triggers: «once» and «scroll» play when the element is seen, «loop» runs for ever, «hover» joins the
// others while the mouse is over the element. Layers after the first are composed on top of it
// (animation-composition: add), so a shift and a pulse can run together.
import { CanvasElement } from '../types';
import { customMotionDirection, customMotionKeyframes, customMotionVars, CUSTOM_MOTION } from './customMotion';

type Styles = CanvasElement['styles'];
export type AnimationLayer = Pick<Styles, 'animation' | 'animationTrigger' | 'animationDuration' | 'animationFrom' | 'animationTo' | 'animationAlternate' | 'animationScrub'>;

export const MAX_EXTRA_ANIMATIONS = 3;

const MARQUEES = ['marquee-rtl', 'marquee-ltr'];

export const defaultDuration = (anim: string) =>
  anim === 'spin-slow' ? 10 :
  MARQUEES.includes(anim) ? 12 :
  ['fade', 'slide-up', 'slide-down', 'slide-left', 'slide-right', 'scale-up', 'scale-down', CUSTOM_MOTION].includes(anim) ? 1.2 :
  ['pulse', 'brightness', 'shake', 'bounce', 'flash', 'float', 'heartbeat', 'rubberband', 'swing', 'jello'].includes(anim) ? 2 : 1.5;

// «مع التمرير»: the animation follows the scrolling itself (CSS scroll-driven animations): the element is at the first
// state as it enters from the bottom of the screen and at the last one when it has come up to the middle. Where the
// browser lacks them the trigger plays as «عند التمرير».
export const SCRUB_RANGE = 'entry 0% cover 45%';
// Which part of the element's pass over the screen drives it: «enter» (as it comes up from the bottom to the middle),
// «leave» (as it goes out at the top: for what is on the screen from the start, like a cover), or «through» (the whole pass).
export const SCRUB_RANGES = { enter: SCRUB_RANGE, leave: 'exit 0% exit 100%', through: 'cover 0% cover 100%' } as const;
export type ScrubPart = keyof typeof SCRUB_RANGES;
export const scrubSupported = () => typeof CSS !== 'undefined' && typeof CSS.supports === 'function' && CSS.supports('animation-timeline: view()');

// An element with a «مع التمرير» animation: its slide must clip with `overflow: clip`, since `hidden` would make the slide
// the scroll container the animation follows (the same rule the fixed backgrounds keep).
export const usesScrub = (styles: Styles) =>
  [styles, ...(styles.animationLayers || [])].some((l) => l.animationTrigger === 'scrub' && (l.animation || 'none') !== 'none');

export interface AnimationContext {
  rotation?: number;
  x: number;
  width: number;
  pageWidth: number;
  bleed: number;
  phone: boolean;
  // The preview and the published page hold an entrance until it is seen.
  waits: boolean;
  // Whether the browser can tie an animation to the scrolling (defaults to asking the browser).
  scrub?: boolean;
}

export interface BuiltAnimation {
  style: Record<string, string>;
  hasHover: boolean;
  // Some layer plays when the element is seen / scrolled to (and each scroll layer plays again when it returns).
  waitsForView: boolean;
  repeatsOnScroll: boolean;
  any: boolean;
}

export const buildElementAnimation = (styles: Styles, ctx: AnimationContext): BuiltAnimation => {
  const all: AnimationLayer[] = [styles, ...(styles.animationLayers || []).slice(0, MAX_EXTRA_ANIMATIONS)];
  const vars: Record<string, string> = {};
  const idle: Record<string, string>[] = [];
  const hovered: Record<string, string>[] = [];
  let waitsForView = false;
  let repeatsOnScroll = false;
  let hasHover = false;
  const canScrub = ctx.scrub ?? scrubSupported();

  all.forEach((layer, index) => {
    const anim = layer.animation || 'none';
    if (anim === 'none') return;
    let trigger = layer.animationTrigger || 'once';
    // Tied to the scrolling only on the preview and the published page; the editor keeps the element still, and a
    // browser without scroll-driven animations plays it as «عند التمرير».
    const scrubbed = trigger === 'scrub' && ctx.waits && canScrub;
    if (trigger === 'scrub') {
      if (!ctx.waits) return;
      if (!scrubbed) trigger = 'scroll';
    }
    const isMarquee = MARQUEES.includes(anim);
    const custom = anim === CUSTOM_MOTION;
    const hover = trigger === 'hover';
    const loop = trigger === 'loop' || (isMarquee && !hover);
    const waits = ctx.waits && !isMarquee && !hover && (trigger === 'once' || trigger === 'scroll');
    if (waits) waitsForView = true;
    if (waits && trigger === 'scroll') repeatsOnScroll = true;
    if (hover) hasHover = true;
    if (custom) {
      // Extra layers sit on top of the first one, which already carries the element's own turn.
      Object.assign(vars, customMotionVars(layer.animationFrom, layer.animationTo, index === 0 ? ctx.rotation || 0 : 0, ctx.phone ? 0.5 : 1, index));
    }
    if (isMarquee) {
      // The ticker crosses the whole page: from past the right edge to past the left one.
      vars['--marquee-from'] = `${ctx.pageWidth - ctx.x + ctx.bleed}px`;
      vars['--marquee-to'] = `${-(ctx.x + ctx.width) - ctx.bleed}px`;
    }
    const one = {
      name: custom ? customMotionKeyframes(index) : anim,
      duration: `${layer.animationDuration || defaultDuration(anim)}s`,
      count: loop || hover ? 'infinite' : '1',
      timing: isMarquee ? 'linear' : custom ? 'ease-in-out' : 'ease-out',
      fill: loop || hover ? 'none' : waits ? 'both' : 'forwards',
      direction: custom ? customMotionDirection(trigger, layer.animationAlternate) : 'normal',
      composition: index === 0 ? 'replace' : 'add',
      timeline: 'auto',
      range: 'normal',
    };
    if (scrubbed) Object.assign(one, { duration: 'auto', count: '1', timing: 'linear', fill: 'both', direction: 'normal', timeline: 'view()', range: SCRUB_RANGES[layer.animationScrub || 'enter'] || SCRUB_RANGE });
    if (!hover) idle.push(one);
    hovered.push(one);
  });

  const lists = (list: Record<string, string>[], prefix: string) => ({
    [`${prefix}name`]: list.map((l) => l.name).join(', '),
    [`${prefix}duration`]: list.map((l) => l.duration).join(', '),
    [`${prefix}count`]: list.map((l) => l.count).join(', '),
    [`${prefix}timing`]: list.map((l) => l.timing).join(', '),
    [`${prefix}fill`]: list.map((l) => l.fill).join(', '),
    [`${prefix}dir`]: list.map((l) => l.direction).join(', '),
    [`${prefix}comp`]: list.map((l) => l.composition).join(', '),
    [`${prefix}timeline`]: list.map((l) => l.timeline).join(', '),
    [`${prefix}range`]: list.map((l) => l.range).join(', '),
  });
  const style: Record<string, string> = { ...vars };
  if (idle.length) {
    const l = lists(idle, '');
    Object.assign(style, {
      animationName: l.name, animationDuration: l.duration, animationIterationCount: l.count, animationTimingFunction: l.timing,
      animationFillMode: l.fill, animationDirection: l.dir, animationComposition: l.comp,
      animationTimeline: l.timeline, animationRange: l.range,
    });
  }
  // While the mouse is over the element: the idle animations and the hover ones together (index.css reads these).
  if (hasHover) Object.assign(style, Object.fromEntries(Object.entries(lists(hovered, '--h-'))));
  return { style, hasHover, waitsForView, repeatsOnScroll, any: hovered.length > 0 };
};
