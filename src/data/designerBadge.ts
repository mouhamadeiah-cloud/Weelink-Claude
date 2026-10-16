// The «معتمد من Weelink» badge (Eyad, 14 Oct): ten successful orders and an average rating of 4.5 or more.
// `minRatings` is an addition: an average of one rating says little, so the badge also needs a few ratings.
// The numbers live in designerBadge.json, which the server (api/design-orders.ts) reads too.
import rules from './designerBadge.json';

export const BADGE = rules;

export interface DesignerStats {
  completed: number;
  ratingCount: number;
  ratingSum: number;
}

export const averageRating = (s: Pick<DesignerStats, 'ratingCount' | 'ratingSum'>) => (s.ratingCount > 0 ? s.ratingSum / s.ratingCount : 0);

export const isApproved = (s: DesignerStats) =>
  s.completed >= BADGE.minCompleted && s.ratingCount >= BADGE.minRatings && averageRating(s) >= BADGE.minAverage;
