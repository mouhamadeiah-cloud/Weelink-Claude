import type { CanvasElement, ElementStyles, ElementType, LinkType, NavbarConfig, Page } from '../types';

// The navbar's contents (logo, site name, page names, extra links, the action button) as separate
// "parts", so the user can place each one on a slide as an ordinary element, or copy a part's link
// onto an element that is already there. Used by the navbar settings panel and the canvas drop.

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

const pageLink = (pageId: string): NavbarPartLink => ({ linkType: 'page', linkTargetId: pageId, linkUrl: `#page-${pageId}` });

export const getNavbarParts = (navbar: NavbarConfig, pages: Page[]): NavbarPart[] => {
  const home = pages[0] ? pageLink(pages[0].id) : undefined;
  const parts: NavbarPart[] = [];
  if (navbar.logoUrl) parts.push({ id: 'logo', kind: 'logo', label: 'الشعار', link: home });
  if (navbar.brandName?.trim()) parts.push({ id: 'brand', kind: 'brand', label: navbar.brandName.trim(), link: home });
  // Page names come from the site's actual pages, like the navbar itself shows them.
  pages.forEach((p) => parts.push({ id: `page-${p.id}`, kind: 'link', label: p.name, link: pageLink(p.id) }));
  (navbar.items || [])
    .filter((it) => it.linkType !== 'page')
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

// A very light navbar text colour (white on a dark navbar) would vanish on a white slide.
const readableText = (color: string | undefined) => {
  const m = color?.trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!m) return '#1d1d1f';
  const hex = m[1].length === 3 ? m[1].split('').map((c) => c + c).join('') : m[1];
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return 0.299 * r + 0.587 * g + 0.114 * b > 200 ? '#1d1d1f' : color!;
};

// What onAddElement needs to put a part on a slide: type, content, styles and the extra fields
// (size and link). Position and slide are added by the caller.
export const navbarPartElement = (
  part: NavbarPart,
  navbar: NavbarConfig
): { type: ElementType; content: string; styles: ElementStyles; extra: Partial<CanvasElement> } => {
  const link = part.link ? { linkType: part.link.linkType, linkTargetId: part.link.linkTargetId, linkUrl: part.link.linkUrl } : {};
  const color = readableText(navbar.textColor);
  if (part.kind === 'logo') {
    const styles: ElementStyles = { borderRadius: 12, objectFit: 'contain', backgroundColor: 'transparent', shadow: 'none' };
    return { type: 'image', content: 'الشعار', styles, extra: { name: 'الشعار', width: 56, height: 56, imageUrl: navbar.logoUrl, styles, ...link } };
  }
  if (part.kind === 'brand') {
    const styles: ElementStyles = { fontSize: 22, fontWeight: 'bold', color, textAlign: 'right' };
    return { type: 'heading', content: part.label, styles, extra: { name: 'اسم الموقع', width: 220, height: 44, content: part.label, styles, ...link } };
  }
  if (part.kind === 'cta') {
    const styles: ElementStyles = { backgroundColor: '#0071e3', color: '#ffffff', borderRadius: 9999, fontWeight: 'bold', fontSize: 14, textAlign: 'center' };
    return { type: 'button', content: part.label, styles, extra: { name: `زر ${part.label}`, width: 150, height: 42, content: part.label, styles, ...link } };
  }
  const styles: ElementStyles = {
    fontSize: 15,
    fontWeight: '600',
    color,
    textAlign: 'center',
    ...(navbar.itemsFontFamily ? { fontFamily: navbar.itemsFontFamily } : {}),
  };
  return { type: 'paragraph', content: part.label, styles, extra: { name: `رابط ${part.label}`, width: 130, height: 36, content: part.label, styles, ...link } };
};
