// The large view of a gallery design, the one view for the gallery and the admin: the design alone on the screen with its links
// and buttons working, arrows (and the keyboard) to the previous and next design in the list, a desktop/phone switch,
// and the caller's tools floating along the bottom of the screen.
import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Monitor, Smartphone, X } from 'lucide-react';
import { LiveDesign } from './LiveSlide';
import type { CanvasElement, Slide } from '../../types';

export interface ViewerItem { id: string; name: string; kind: 'slide' | 'page'; slide: any; page: any; elements: CanvasElement[] }

interface Props {
  items: ViewerItem[];
  index: number;
  onIndex: (i: number) => void;
  onClose: () => void;
  // The tools for the design on show (a ToolBar); they are placed along the bottom edge.
  tools?: (item: ViewerItem) => React.ReactNode;
}

const light = 'flex h-9 w-9 items-center justify-center rounded-full text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.75)] transition hover:scale-110 disabled:opacity-30 disabled:hover:scale-100';

export const DesignViewer: React.FC<Props> = ({ items, index, onIndex, onClose, tools }) => {
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
  const item = items[index];
  const last = items.length - 1;
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      // RTL: the next design is to the left.
      else if (e.key === 'ArrowLeft' && index < last) onIndex(index + 1);
      else if (e.key === 'ArrowRight' && index > 0) onIndex(index - 1);
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [index, last, onIndex, onClose]);
  const slides = useMemo<Slide[]>(() => (item ? (item.kind === 'page' && item.page?.slides?.length ? item.page.slides : [item.slide]) : []), [item]);
  if (!item) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/70" dir="rtl" role="dialog" aria-modal="true" aria-label={item.name} onClick={onClose}>
      <div className="absolute inset-0 overflow-y-auto px-2 pb-24 pt-12 sm:px-16" onClick={onClose}>
        <div onClick={(e) => e.stopPropagation()} className={`mx-auto bg-white shadow-2xl ${device === 'mobile' ? 'max-w-[390px] overflow-hidden rounded-[28px] border-[10px] border-neutral-800' : 'max-w-5xl overflow-hidden rounded-card'}`}>
          <LiveDesign key={`${item.id}:${device}`} slides={slides} elements={item.elements} navbar={item.kind === 'page' ? item.page?.navbar : undefined} interactive device={device} />
        </div>
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between px-3 py-2">
        <button type="button" aria-label="إغلاق" onClick={onClose} className={`${light} pointer-events-auto`}><X size={22} /></button>
        <span className="text-tiny font-bold text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.75)]">{(index + 1).toLocaleString('ar-SY')} / {items.length.toLocaleString('ar-SY')}</span>
        <div className="pointer-events-auto flex gap-1">
          <button type="button" aria-label="عرض الحاسوب" aria-pressed={device === 'desktop'} onClick={() => setDevice('desktop')} className={`${light} ${device === 'desktop' ? '' : 'opacity-60'}`}><Monitor size={18} /></button>
          <button type="button" aria-label="عرض الجوال" aria-pressed={device === 'mobile'} onClick={() => setDevice('mobile')} className={`${light} ${device === 'mobile' ? '' : 'opacity-60'}`}><Smartphone size={18} /></button>
        </div>
      </div>
      <button type="button" aria-label="السابق" disabled={index === 0} onClick={() => onIndex(index - 1)} className={`${light} absolute right-2 top-1/2 -translate-y-1/2 sm:right-4 sm:h-11 sm:w-11`}><ChevronRight size={30} /></button>
      <button type="button" aria-label="التالي" disabled={index === last} onClick={() => onIndex(index + 1)} className={`${light} absolute left-2 top-1/2 -translate-y-1/2 sm:left-4 sm:h-11 sm:w-11`}><ChevronLeft size={30} /></button>
      {tools && <div className="pointer-events-none absolute inset-x-0 bottom-0 h-0"><div className="pointer-events-auto relative mx-auto h-0 max-w-5xl [&_.tool-bar]:opacity-100" onClick={(e) => e.stopPropagation()}>{tools(item)}</div></div>}
    </div>
  );
};
