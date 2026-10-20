// The CSS an element's animations come to: its own animation plus up to three more
// (styles.animationLayers, each with its own trigger, speed and, for a custom motion, its two states).
// Triggers: «once» and «scroll» play when the element is seen, «loop» runs for ever, «hover» joins the
// others while the mouse is over the element. Layers after the first are composed on top of it
// (animation-composition: add), so a shift and a pulse can run together.
import { CanvasElement } from '../types';
import { customMotionDirection, customMotionKeyframes, customMotionVars, CUSTOM_MOTION } from './customMotion';

type Styles = CanvasElement['styles'];
export type AnimationLayer = Pick<Styles, 'animation' | 'animationTrigger' | 'animationDuration' | 'animationFrom' | 'animationTo' | 'animationAlternate'>;

export const MAX_EXTRA_ANIMATIONS = 3;

const MARQUEES = ['marquee-rtl', 'marquee-ltr'];

export const defaultDuration = (anim: string) =>
  anim === 'spin-slow' ? 10 :
  MARQUEES.includes(anim) ? 12 :
  ['fade', 'slide-up', 'slide-down', 'slide-left', 'slide-right', 'scale-up', 'scale-down', CUSTOM_MOTION].includes(anim) ? 1.2 :
  ['pulse', 'brightness', 'shake', 'bounce', 'flash', 'float', 'heartbeat', 'rubberband', 'swing', 'jello'].includes(anim) ? 2 : 1.5;

export interface AnimationContext {
  rotation?: number;
  x: number;
  width: number;
  pageWidth: number;
  bleed: number;
  phone: boolean;
  // The preview and the published page hold an entrance until it is seen.
  waits: boolean;
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

  all.forEach((layer, index) => {
    const anim = layer.animation || 'none';
    if (anim === 'none') return;
    const trigger = layer.animationTrigger || 'once';
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
    };
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
  });
  const style: Record<string, string> = { ...vars };
  if (idle.length) {
    const l = lists(idle, '');
    Object.assign(style, {
      animationName: l.name, animationDuration: l.duration, animationIterationCount: l.count, animationTimingFunction: l.timing,
      animationFillMode: l.fill, animationDirection: l.dir, animationComposition: l.comp,
    });
  }
  // While the mouse is over the element: the idle animations and the hover ones together (index.css reads these).
  if (hasHover) Object.assign(style, Object.fromEntries(Object.entries(lists(hovered, '--h-'))));
  return { style, hasHover, waitsForView, repeatsOnScroll, any: hovered.length > 0 };
};
