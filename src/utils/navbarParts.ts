import type { LinkType, NavbarConfig, NavbarItem, Page } from '../types';

// The navbar's contents (logo, site name, page names, extra links, the action button) as separate
// "parts", so the user can copy a part's link onto an element on a slide, or show the part as an
// icon (navbar.partIcons is keyed by the part ids). Used by the navbar settings panel.

export interface NavbarPartLink {
  linkType: LinkType;
  linkTargetId?: string;
  linkUrl: string;
}

export interface NavbarPart {
  id: string;
  kind: 'logo' | 'brand' | 'link' | 'cta';
  label: string;
  link?: NavbarPartLink;
}

// The navbar's own extra links: links the user added (ids starting with "nav-"), plus any non-page
// link. Other stored page links are stale copies of the automatic page names and are skipped.
export const isUserNavItem = (it: NavbarItem) => it.linkType !== 'page' || it.id.startsWith('nav-');

const pageLink = (pageId: string): NavbarPartLink => ({ linkType: 'page', linkTargetId: pageId, linkUrl: `#page-${pageId}` });

export const getNavbarParts = (navbar: NavbarConfig, pages: Page[]): NavbarPart[] => {
  const home = pages[0] ? pageLink(pages[0].id) : undefined;
  const parts: NavbarPart[] = [];
  if (navbar.logoUrl) parts.push({ id: 'logo', kind: 'logo', label: 'الشعار', link: home });
  if (navbar.brandName?.trim()) parts.push({ id: 'brand', kind: 'brand', label: navbar.brandName.trim(), link: home });
  // Page names come from the site's actual pages, like the navbar itself shows them.
  pages.forEach((p) => parts.push({ id: `page-${p.id}`, kind: 'link', label: p.name, link: pageLink(p.id) }));
  (navbar.items || [])
    .filter(isUserNavItem)
    .forEach((it) => {
      const linkType: LinkType = it.linkType || 'url';
      const linkUrl = linkType === 'slide' && it.linkTargetId ? `#slide-${it.linkTargetId}` : it.href;
      parts.push({ id: `item-${it.id}`, kind: 'link', label: it.label, link: linkUrl ? { linkType, linkTargetId: it.linkTargetId, linkUrl } : undefined });
    });
  if (navbar.ctaText?.trim()) {
    const link: NavbarPartLink | undefined =
      navbar.ctaLinkType === 'page' && navbar.ctaLinkTargetId
        ? pageLink(navbar.ctaLinkTargetId)
        : navbar.ctaLinkType === 'slide' && navbar.ctaLinkTargetId
          ? { linkType: 'slide', linkTargetId: navbar.ctaLinkTargetId, linkUrl: `#slide-${navbar.ctaLinkTargetId}` }
          : navbar.ctaHref && navbar.ctaHref !== '#'
            ? { linkType: navbar.ctaLinkType || 'url', linkTargetId: navbar.ctaLinkTargetId, linkUrl: navbar.ctaHref }
            : undefined;
    parts.push({ id: 'cta', kind: 'cta', label: navbar.ctaText.trim(), link });
  }
  return parts;
};
