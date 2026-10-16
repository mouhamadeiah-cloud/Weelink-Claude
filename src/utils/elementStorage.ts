// How a page's elements are stored in Firestore: no undefined values, and a table's rows as
// [{ row: [...] }] because Firestore does not accept arrays inside arrays. Shared by the editor's
// saves, the designers' drafts and the gallery's slides.
import type { CanvasElement } from '../types';
import { withLocalGraphics } from './localGraphics';

export const sanitizeData = (data: any): any => {
  if (data === null || data === undefined) return null;
  if (Array.isArray(data)) {
    return data.map(sanitizeData);
  }
  if (typeof data === 'object') {
    const cleaned: any = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        const val = data[key];
        if (val !== undefined) {
          cleaned[key] = sanitizeData(val);
        }
      }
    }
    return cleaned;
  }
  return data;
};

// Converts string[][] table cells to [{ row: string[] }] to avoid nested arrays (unsupported by Firestore)
export const serializeElements = (elements: CanvasElement[]): any[] => {
  const mapped = elements.map(el => {
    if (el.tableConfig) {
      const { cells, ...rest } = el.tableConfig;
      return {
        ...el,
        tableConfig: {
          ...rest,
          cells: cells ? cells.map(row => ({ row })) : []
        }
      };
    }
    return el;
  });
  return sanitizeData(mapped);
};

export const deserializeElements = (dataElements: any[]): CanvasElement[] => {
  if (!dataElements) return [];
  return dataElements.map(withLocalGraphics).map(el => {
    if (el.tableConfig) {
      const { cells, ...rest } = el.tableConfig;
      let restoredCells: string[][] = [];
      if (Array.isArray(cells)) {
        restoredCells = cells.map((item: any) => {
          if (item && Array.isArray(item.row)) {
            return item.row;
          }
          if (Array.isArray(item)) {
            return item;
          }
          return [];
        });
      }
      return {
        ...el,
        tableConfig: {
          ...rest,
          cells: restoredCells
        }
      } as CanvasElement;
    }
    return el;
  });
};
