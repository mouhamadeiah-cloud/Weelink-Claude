import { CanvasElement } from '../types';

// The unDraw drawings in «رسومات unDraw» are served from /graphics/undraw. They used to load from
// raw.githubusercontent.com, whose old paths no longer exist and whose images don't load in Syria;
// drawings added that way are pointed at the local copies when a design loads.
const OLD_UNDRAW = /^https:\/\/raw\.githubusercontent\.com\/balazser\/undraw-svg-collection\/master\/svg\/(undraw_[a-z0-9_]+)\.svg$/;
const UNDRAW_FILES: Record<string, string> = {
  undraw_analytics_re_ywgo: 'analytics',
  undraw_brainstorming_re_135g: 'brainstorming',
  undraw_business_decisions_re_849n: 'business-decisions',
  undraw_chating_re_9980: 'chatting',
  undraw_conference_call_re_u0ba: 'conference-call',
  undraw_developer_activity_re_3e78: 'developer-activity',
  undraw_education_f8ru: 'education',
  undraw_feeling_proud_qne1: 'feeling-proud',
  undraw_goals_re_g1tz: 'goals',
  undraw_innovative_re_asrj: 'innovative',
  undraw_investing_re_b7kn: 'investing',
  undraw_launch_day_re_453a: 'launch-day',
  undraw_marketing_re_7060: 'marketing',
  undraw_programmer_re_g6ob: 'programmer',
  undraw_project_completed_w0sq: 'project-completed',
  undraw_science_re_87m4: 'science',
  undraw_searching_p59q: 'searching',
  undraw_startup_life_re_809q: 'startup-life',
  undraw_team_collaboration_re_ow69: 'team-collaboration',
  undraw_web_development_w29c: 'web-development',
};

const localUrl = <V,>(url: V): V => {
  if (typeof url !== 'string') return url;
  const file = UNDRAW_FILES[url.match(OLD_UNDRAW)?.[1] ?? ''];
  return (file ? `/graphics/undraw/${file}.svg` : url) as V;
};

export const withLocalGraphics = <T extends Pick<CanvasElement, 'imageUrl' | 'content'>>(el: T): T => {
  const imageUrl = localUrl(el.imageUrl);
  const content = localUrl(el.content);
  return imageUrl === el.imageUrl && content === el.content ? el : { ...el, imageUrl, content };
};
