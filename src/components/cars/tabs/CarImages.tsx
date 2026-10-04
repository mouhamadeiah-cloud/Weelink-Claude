// The car's photos (up to MAX_CAR_IMAGES): add several at once, drag one onto another or use the
// arrows to reorder, remove. The first photo is the car's main photo in the showroom.
import React, { useRef, useState } from 'react';
import { ImagePlus, Loader2, X, ChevronRight, ChevronLeft, Star } from 'lucide-react';
import { MAX_CAR_IMAGES } from '../carTypes';
import { uploadImageFile, inputClass, GhostButton } from '../../shop/adminUi';

export const CarImages: React.FC<{ images: string[]; onChange: (images: string[]) => void }> = ({ images, onChange }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(0);
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [urlDraft, setUrlDraft] = useState('');
  const latest = useRef(images);
  latest.current = images;
  const room = MAX_CAR_IMAGES - images.length;

  const move = (a: number, b: number) => {
    if (b < 0 || b >= images.length || a === b) return;
    const next = [...images];
    const [item] = next.splice(a, 1);
    next.splice(b, 0, item);
    onChange(next);
  };

  const addFiles = async (files: FileList | null) => {
    const list = Array.from(files || []).slice(0, room);
    if (!list.length) return;
    setBusy(list.length);
    for (const file of list) {
      const url = await uploadImageFile(file);
      if (url && latest.current.length < MAX_CAR_IMAGES) {
        // Kept here too, so the next upload adds to this one even before the parent re-renders.
        latest.current = [...latest.current, url];
        onChange(latest.current);
      }
      setBusy((n) => n - 1);
    }
  };

  const addUrl = () => {
    const url = urlDraft.trim();
    if (!url || room <= 0) return;
    onChange([...images, url]);
    setUrlDraft('');
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
        {images.map((src, i) => (
          <div
            key={src + i}
            className="space-y-1"
            onDragOver={(e) => { if (dragFrom !== null) e.preventDefault(); }}
            onDrop={(e) => { e.preventDefault(); if (dragFrom !== null) move(dragFrom, i); setDragFrom(null); }}
          >
            <div
              draggable
              onDragStart={() => setDragFrom(i)}
              onDragEnd={() => setDragFrom(null)}
              className={`relative aspect-[4/3] rounded-xl overflow-hidden border bg-neutral-100 cursor-grab ${i === 0 ? 'border-[#0071e3] ring-2 ring-[#0071e3]/30' : 'border-neutral-200'}`}
            >
              <img src={src} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover pointer-events-none" />
              <button type="button" onClick={() => onChange(images.filter((_, k) => k !== i))} className="absolute top-1 left-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center cursor-pointer" aria-label="حذف الصورة">
                <X size={11} />
              </button>
              {i === 0 && <span className="absolute bottom-1 right-1 px-1.5 h-4 rounded-full bg-[#0071e3] text-white text-[8px] font-bold flex items-center gap-0.5"><Star size={8} /> الرئيسية</span>}
            </div>
            <div className="flex items-center justify-between">
              <button type="button" onClick={() => move(i, i - 1)} disabled={i === 0} className="w-5 h-5 rounded-md bg-neutral-100 hover:bg-neutral-200 text-neutral-600 flex items-center justify-center disabled:opacity-0 cursor-pointer" aria-label="تقديم الصورة"><ChevronRight size={12} /></button>
              <span className="text-[10px] font-bold text-neutral-400">{i + 1}</span>
              <button type="button" onClick={() => move(i, i + 1)} disabled={i === images.length - 1} className="w-5 h-5 rounded-md bg-neutral-100 hover:bg-neutral-200 text-neutral-600 flex items-center justify-center disabled:opacity-0 cursor-pointer" aria-label="تأخير الصورة"><ChevronLeft size={12} /></button>
            </div>
          </div>
        ))}
        {room > 0 && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy > 0}
            className="aspect-[4/3] rounded-xl border border-dashed border-neutral-300 flex flex-col items-center justify-center gap-1 text-neutral-400 hover:text-[#0071e3] hover:border-[#0071e3] cursor-pointer text-[11px] font-bold"
          >
            {busy > 0 ? <Loader2 size={18} className="animate-spin" /> : <ImagePlus size={18} />}
            {busy > 0 ? `جارٍ الرفع (${busy})` : 'إضافة صور'}
          </button>
        )}
      </div>
      <p className="text-[11px] text-neutral-500">
        {images.length} من {MAX_CAR_IMAGES} صورة. اسحب الصورة لتغيير ترتيبها، والصورة الأولى هي الرئيسية في المعرض.
      </p>
      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />
      {room > 0 && (
        <div className="flex gap-2">
          <input className={inputClass} placeholder="أو ألصق رابط صورة" value={urlDraft} onChange={(e) => setUrlDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addUrl(); } }} dir="ltr" />
          <GhostButton onClick={addUrl} className="h-10 shrink-0">إضافة</GhostButton>
        </div>
      )}
    </div>
  );
};
