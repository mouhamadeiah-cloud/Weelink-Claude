// The table a guest sits at, from the table's QR code (…?r=uid&t=5). Kept for the visit so moving
// between the site's pages keeps the order a table order.
const KEY = 'weelink_table';

export const readTableFromUrl = () => {
  try {
    const t = new URLSearchParams(window.location.search).get('t');
    if (t && /^[\w؀-ۿ -]{1,20}$/.test(t)) sessionStorage.setItem(KEY, t);
  } catch {
    // storage unavailable: the table still comes from the URL below
  }
};

export const currentTable = (): string => {
  try {
    return sessionStorage.getItem(KEY) || new URLSearchParams(window.location.search).get('t') || '';
  } catch {
    return '';
  }
};
