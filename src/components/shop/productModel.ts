// Product helpers shared by the admin panel and the store page: variants, stock and prices.
import { ShopProduct, ProductOption, ProductVariant, PRODUCT_BADGES } from './shopTypes';

export const stockOptions = (options: ProductOption[]) =>
  options.filter((o) => o.affectsStock && o.values.length > 0);

export const variantLabel = (values: string[]) => values.join(' / ');

// Every combination of the stock options. Quantities and price differences of combinations that
// already existed are kept, so editing an option never loses stock.
export const buildVariants = (options: ProductOption[], previous: ProductVariant[]): ProductVariant[] => {
  const opts = stockOptions(options);
  if (opts.length === 0) return [];
  let combos: string[][] = [[]];
  for (const o of opts) {
    combos = combos.flatMap((c) => o.values.map((v) => [...c, v.label]));
  }
  const prev = new Map(previous.map((v) => [variantLabel(v.values), v]));
  return combos.map((values) => {
    const old = prev.get(variantLabel(values));
    return { values, stock: old?.stock ?? 0, priceDelta: old?.priceDelta ?? 0 };
  });
};

export const totalStock = (p: Pick<ShopProduct, 'stock' | 'variants'>) =>
  p.variants.length ? p.variants.reduce((s, v) => s + v.stock, 0) : p.stock;

// Unit price for a quantity: the best quantity tier that applies, else the normal price.
export const unitPriceFor = (p: ShopProduct, qty: number, variant?: ProductVariant) => {
  const tier = [...p.tiers]
    .filter((t) => t.minQty > 0 && t.price > 0 && qty >= t.minQty)
    .sort((a, b) => b.minQty - a.minQty)[0];
  return (tier ? tier.price : p.price) + (variant?.priceDelta || 0);
};

export const discountPercent = (p: Pick<ShopProduct, 'price' | 'oldPrice'>) =>
  p.oldPrice > p.price && p.price > 0 ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;

// The badge shown on the image corner. Out of stock always wins.
export const badgeText = (p: ShopProduct): string => {
  if (totalStock(p) <= 0) return 'نفد من المخزون';
  if (p.badge === 'discount') {
    const pct = discountPercent(p);
    return pct ? `خصم ${pct}%` : '';
  }
  return PRODUCT_BADGES.find((b) => b.id === p.badge && b.id)?.label || '';
};

export const findVariant = (p: ShopProduct, values: string[]) =>
  p.variants.find((v) => variantLabel(v.values) === variantLabel(values));

// Applies a stock change to one variant (or to the product when it has none) and keeps the total.
export const changeStock = (p: ShopProduct, delta: number, variant?: string): ShopProduct => {
  if (p.variants.length && variant) {
    const variants = p.variants.map((v) =>
      variantLabel(v.values) === variant ? { ...v, stock: Math.max(0, v.stock + delta) } : v
    );
    return { ...p, variants, stock: variants.reduce((s, v) => s + v.stock, 0) };
  }
  return { ...p, stock: Math.max(0, p.stock + delta) };
};

// Keeps only simple formatting from the rich-text editor: no scripts, links, styles or handlers.
const ALLOWED_TAGS = new Set(['B', 'STRONG', 'I', 'EM', 'U', 'P', 'DIV', 'BR', 'UL', 'OL', 'LI', 'H3', 'H4', 'SPAN']);
const DROP_TAGS = new Set(['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'TEMPLATE', 'svg', 'SVG', 'MATH']);

export const sanitizeHtml = (html: string): string => {
  if (!html) return '';
  if (typeof DOMParser === 'undefined') return '';
  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html');
  const root = doc.body.firstElementChild as HTMLElement | null;
  if (!root) return '';
  const clean = (node: Element) => {
    for (const child of Array.from(node.children)) {
      if (DROP_TAGS.has(child.tagName)) {
        child.remove();
        continue;
      }
      clean(child);
      if (!ALLOWED_TAGS.has(child.tagName)) {
        child.replaceWith(...Array.from(child.childNodes));
        continue;
      }
      const align = (child as HTMLElement).style?.textAlign;
      for (const attr of Array.from(child.attributes)) child.removeAttribute(attr.name);
      if (align && ['left', 'right', 'center', 'justify'].includes(align)) {
        (child as HTMLElement).style.textAlign = align;
      }
    }
  };
  clean(root);
  return root.innerHTML;
};

// Plain-text descriptions saved before the rich editor existed keep their line breaks.
export const descriptionHtml = (description: string) =>
  /<[a-z][\s\S]*>/i.test(description)
    ? sanitizeHtml(description)
    : description
        .split('\n')
        .map((line) => line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'))
        .join('<br>');
