// «دخول الصفحة»: the admin walks around a gallery design as a visitor would (Eyad, 15 Oct): the navbar and the buttons work,
// the videos play, and a switch shows the phone layout. It is the real renderer with the clicks left on.
import React, { useEffect, useMemo, useState } from 'react';
import { Monitor, Pencil, Smartphone, X } from 'lucide-react';
import { LiveDesign } from '../gallery/LiveSlide';
import { deserializeElements } from '../../utils/elementStorage';
import type { NavbarConfig, Slide } from '../../types';

interface Props {
  title: string;
  kind: 'slide' | 'page';
  slide: any;
  page: { navbar?: NavbarConfig; slides?: Slide[] } | null;
  elements: any[];
  onClose: () => void;
  onEdit?: () => void;
}

export const PagePreviewModal: React.FC<Props> = ({ title, kind, slide, page, elements, onClose, onEdit }) => {
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
  const els = useMemo(() => deserializeElements(elements), [elements]);
  const slides = useMemo<Slide[]>(() => (kind === 'page' && page?.slides?.length ? page.slides : [slide]), [kind, page, slide]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [onClose]);

  const tab = (id: 'desktop' | 'mobile', label: string, Icon: typeof Monitor) => (
    <button type="button" onClick={() => setDevice(id)} aria-pressed={device === id} className={`inline-flex items-center gap-1.5 rounded-ctl px-3 py-1.5 text-small ${device === id ? 'bg-brand text-white' : 'text-muted hover:bg-bg'}`}><Icon className="h-4 w-4" /> {label}</button>
  );

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-black/60" dir="rtl" role="dialog" aria-modal="true" aria-label={`دخول الصفحة: ${title}`}>
      <div className="flex flex-wrap items-center gap-3 border-b border-line bg-surface px-4 py-2.5">
        <h2 className="text-small font-semibold">{title}</h2>
        <span className="text-tiny text-muted">تنقّل فيها كزائر: الشريط والأزرار تعمل.</span>
        <div className="mr-auto flex items-center gap-1 rounded-ctl border border-line p-0.5">
          {tab('desktop', 'حاسوب', Monitor)}
          {tab('mobile', 'جوال', Smartphone)}
        </div>
        {onEdit && <button type="button" onClick={onEdit} className="inline-flex items-center gap-1.5 rounded-ctl border border-line px-3 py-1.5 text-small hover:bg-bg"><Pencil className="h-4 w-4" /> تعديل في لوحة المصمم</button>}
        <button type="button" onClick={onClose} aria-label="إغلاق" className="rounded-ctl p-2 text-muted hover:bg-bg"><X className="h-5 w-5" /></button>
      </div>
      <div className="flex-1 overflow-auto bg-neutral-200 p-0 sm:p-4">
        <div className={`mx-auto bg-white shadow-xl ${device === 'mobile' ? 'max-w-[390px] rounded-[28px] border-[10px] border-neutral-800 overflow-hidden' : 'max-w-[1280px]'}`}>
          <LiveDesign key={device} slides={slides} elements={els} navbar={kind === 'page' ? page?.navbar : undefined} interactive device={device} />
        </div>
      </div>
    </div>
  );
};
