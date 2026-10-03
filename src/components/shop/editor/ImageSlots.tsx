// Five image slots (front, back, side, top, bottom). Drag a slot onto another, or use the arrows,
// to change the order; the first image is the product's main image.
import React, { useRef, useState } from 'react';
import { ImagePlus, Loader2, X, ChevronRight, ChevronLeft, Star } from 'lucide-react';
import { MAX_IMAGES } from '../shopTypes';
import { uploadImageFile, inputClass, GhostButton } from '../adminUi';

const SLOT_LABELS = ['أمامية', 'خلفية', 'جانبية', 'من فوق', 'من تحت'];

interface ImageSlotsProps {
  slots: string[]; // always MAX_IMAGES entries, '' = empty
  onChange: (slots: string[]) => void;
}

export const toSlots = (images: string[]) =>
  Array.from({ length: MAX_IMAGES }, (_, i) => images[i] || '');

export const ImageSlots: React.FC<ImageSlotsProps> = ({ slots, onChange }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const targetRef = useRef(0);
  const [busy, setBusy] = useState<number | null>(null);
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [urlDraft, setUrlDraft] = useState('');

  const set = (i: number, value: string) => onChange(slots.map((s, idx) => (idx === i ? value : s)));
  const swap = (a: number, b: number) => {
    if (b < 0 || b >= slots.length || a === b) return;
    const next = [...slots];
    [next[a], next[b]] = [next[b], next[a]];
    onChange(next);
  };

  const pick = (i: number) => {
    targetRef.current = i;
    inputRef.current?.click();
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    const i = targetRef.current;
    setBusy(i);
    const url = await uploadImageFile(file);
    setBusy(null);
    if (url) set(i, url);
  };

  const addUrl = () => {
    const url = urlDraft.trim();
    const free = slots.findIndex((s) => !s);
    if (!url || free < 0) return;
    set(free, url);
    setUrlDraft('');
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-5 gap-2">
        {slots.map((src, i) => (
          <div
            key={i}
            className={`space-y-1 ${dragFrom !== null && dragFrom !== i ? 'opacity-90' : ''}`}
            onDragOver={(e) => { if (dragFrom !== null) e.preventDefault(); }}
            onDrop={(e) => { e.preventDefault(); if (dragFrom !== null) swap(dragFrom, i); setDragFrom(null); }}
          >
            <div
              draggable={!!src}
              onDragStart={() => setDragFrom(i)}
              onDragEnd={() => setDragFrom(null)}
              className={`relative aspect-square rounded-xl overflow-hidden border ${src ? 'border-neutral-200 bg-neutral-100 cursor-grab' : 'border-dashed border-neutral-300'} ${i === 0 && src ? 'ring-2 ring-[#0071e3]/40' : ''}`}
            >
              {src ? (
                <>
                  <img src={src} alt="" className="w-full h-full object-cover pointer-events-none" />
                  <button type="button" onClick={() => set(i, '')} className="absolute top-1 left-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center cursor-pointer" aria-label="حذف الصورة">
                    <X size={11} />
                  </button>
                  {i === 0 && (
                    <span className="absolute bottom-1 right-1 px-1.5 h-4 rounded-full bg-[#0071e3] text-white text-[8px] font-bold flex items-center gap-0.5"><Star size={8} /> الرئيسية</span>
                  )}
                </>
              ) : (
                <button type="button" onClick={() => pick(i)} disabled={busy !== null} className="w-full h-full flex flex-col items-center justify-center gap-0.5 text-neutral-400 hover:text-[#0071e3] cursor-pointer">
                  {busy === i ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />}
                </button>
              )}
            </div>
            <div className="flex items-center justify-between text-[10px] font-bold text-neutral-500">
              <button type="button" onClick={() => swap(i, i - 1)} disabled={i === 0 || !src} className="w-4 text-neutral-400 disabled:opacity-0 cursor-pointer" aria-label="تقديم"><ChevronRight size={12} /></button>
              <span className="truncate">{SLOT_LABELS[i]}</span>
              <button type="button" onClick={() => swap(i, i + 1)} disabled={i === slots.length - 1 || !src} className="w-4 text-neutral-400 disabled:opacity-0 cursor-pointer" aria-label="تأخير"><ChevronLeft size={12} /></button>
            </div>
          </div>
        ))}
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ''; }} />
      {slots.some((s) => !s) && (
        <div className="flex gap-2">
          <input
            className={inputClass}
            placeholder="أو ألصق رابط صورة"
            value={urlDraft}
            onChange={(e) => setUrlDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addUrl(); } }}
            dir="ltr"
          />
          <GhostButton onClick={addUrl} className="h-10 shrink-0">إضافة</GhostButton>
        </div>
      )}
    </div>
  );
};
