// The public number of an item (Eyad, 18 Oct): every car, dish, product (and later service) has one number
// no other item of its kind has, on any page: C-10001, F-10001, S-10001, V-10001. The server hands the
// numbers out (api/item-numbers.ts, called from services/itemNumbers.ts); this is the part without network.

export type ItemKind = 'car' | 'dish' | 'product' | 'service';

const PREFIX: Record<ItemKind, string> = { car: 'C', dish: 'F', product: 'S', service: 'V' };

// "C-10001"; '' while the item has no number yet.
export const itemNoLabel = (kind: ItemKind, no: number | undefined) => (no && no > 0 ? `${PREFIX[kind]}-${no}` : '');

// What an admin types to find an item: "C-10001", "c10001" or "10001" with the kind known.
export const parseItemNo = (text: string): { kind: ItemKind | null; no: number } | null => {
  const m = text.trim().toUpperCase().match(/^([CFSV])?\s*-?\s*(\d{5,9})$/);
  if (!m) return null;
  const kind = (Object.keys(PREFIX) as ItemKind[]).find((k) => PREFIX[k] === m[1]) || null;
  return { kind, no: Number(m[2]) };
};

// The items listed by `ids` (those that had no number when the numbers were asked for) get consecutive
// ones from `from`, in that order. An item that has a number by now, or is gone, is left alone.
export const giveNumbers = <T extends { id: string; publicNo: number }>(items: T[], ids: string[], from: number): T[] => {
  const given = new Map(ids.map((id, i) => [id, from + i]));
  return items.some((i) => !i.publicNo && given.has(i.id)) ? items.map((i) => (!i.publicNo && given.has(i.id) ? { ...i, publicNo: given.get(i.id)! } : i)) : items;
};

export const missingIds = (items: { id: string; publicNo: number }[]) => items.filter((i) => !i.publicNo).map((i) => i.id);
