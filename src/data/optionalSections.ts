// The sections the owner may tick in the last of Wee AI's questions (docs/READY_SLIDES_PLAN.md): the «يختاره الزبون» sections of the page
// models that the builder can make today. A tick sends the section's id to /api/build-page (`ticked`); «ratings» is built by the browser.
// Answers given before these questions (nothing saved) take the defaults.
export interface OptionalSection { id: string; label: string; hint: string; defaultOn: boolean }

export const OPTIONAL_SECTIONS: OptionalSection[] = [
  { id: 'features', label: 'لماذا نحن', hint: 'مميزاتك بنقاط واضحة', defaultOn: false },
  { id: 'ratings', label: 'التقييمات', hint: 'زوار صفحتك يقيّمونك وتظهر آراؤهم، وتدير التقييمات من لوحتك', defaultOn: false },
  { id: 'privacy', label: 'الشروط والخصوصية', hint: 'شروط وسياسة خصوصية جاهزة، وتقدر تحذفها لاحقاً', defaultOn: true },
];

/** The sections ticked: what the owner chose, else the defaults. */
export const tickedSections = (saved: string[] | undefined): string[] =>
  Array.isArray(saved) ? saved.filter((id) => OPTIONAL_SECTIONS.some((o) => o.id === id)) : OPTIONAL_SECTIONS.filter((o) => o.defaultOn).map((o) => o.id);
