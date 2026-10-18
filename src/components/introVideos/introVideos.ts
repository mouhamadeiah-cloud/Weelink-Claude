// The short explainer animations shown over the editor, one per group of settings. Each is a page in
// public/intro-videos that plays itself and talks to IntroVideoPlayer through postMessage.
import type { InspectorGroupId } from '../rightDrawer/inspectorGroups';

export interface IntroVideo {
  id: InspectorGroupId;
  title: string;
  src: string;
}

const VIDEOS: Partial<Record<InspectorGroupId, IntroVideo>> = {
  shape: { id: 'shape', title: 'شرح «الشكل»', src: '/intro-videos/shape.html' },
};

export const introVideoFor = (group: InspectorGroupId): IntroVideo | null => VIDEOS[group] ?? null;
