// Small shared controls for the shop admin panel.
import React, { useRef, useState } from 'react';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { uploadGalleryImageToStorage } from '../../utils/galleryUpload';
import { compressImageToTargetSize } from '../../utils/imageCompressor';
import { MAX_IMAGES } from './shopTypes';

export const formatMoney = (amount: number, currency: string) => {
  const rounded = Math.round(amount * 100) / 100;
  return `${rounded.toLocaleString('en-US')} ${currency}`;
};

export const formatDate = (iso: string) => {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('ar-SY-u-nu-latn', { year: 'numeric', month: 'short', day: 'numeric' });
};

export const Card: React.FC<{ title?: string; actions?: React.ReactNode; children: React.ReactNode }> = ({ title, actions, children }) => (
  <section className="bg-white border border-neutral-200 rounded-2xl p-4 sm:p-5 space-y-4">
    {(title || actions) && (
      <div className="flex items-center justify-between gap-3">
        {title && <h3 className="text-sm font-black text-[#1d1d1f]">{title}</h3>}
        {actions}
      </div>
    )}
    {children}
  </section>
);

// A div, not a <label>: some fields hold several buttons (catalog chips, image
// picker), and a wrapping label would forward clicks to the first one.
export const Field: React.FC<{ label: string; hint?: string; children: React.ReactNode }> = ({ label, hint, children }) => (
  <div className="block space-y-1.5" role="group" aria-label={label}>
    <span className="block text-[11px] font-bold text-neutral-600">{label}</span>
    {children}
    {hint && <span className="block text-[10px] text-neutral-400 leading-relaxed">{hint}</span>}
  </div>
);

export const inputClass =
  'w-full h-10 px-3 rounded-xl border border-neutral-200 bg-white text-sm text-[#1d1d1f] outline-none focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/15 transition';

// The same field without full width, for fields given their own width (w-28, w-40…).
export const inputFitClass = inputClass.replace('w-full ', '');

export const textareaClass =
  'w-full min-h-[84px] p-3 rounded-xl border border-neutral-200 bg-white text-sm text-[#1d1d1f] outline-none focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/15 transition leading-relaxed';

export const PrimaryButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ className = '', ...props }) => (
  <button
    type="button"
    {...props}
    className={`h-10 px-4 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold transition active:scale-95 cursor-pointer ${className}`}
  />
);

export const GhostButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ className = '', ...props }) => (
  <button
    type="button"
    {...props}
    className={`h-9 px-3 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 text-xs font-bold transition active:scale-95 cursor-pointer ${className}`}
  />
);

export const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void; label: string }> = ({ checked, onChange, label }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className="flex items-center justify-between w-full gap-3 py-1 cursor-pointer"
  >
    <span className="text-sm font-bold text-[#1d1d1f]">{label}</span>
    <span className={`relative w-10 h-6 rounded-full transition ${checked ? 'bg-[#34c759]' : 'bg-neutral-300'}`}>
      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${checked ? 'right-0.5' : 'right-[18px]'}`} />
    </span>
  </button>
);

export const EmptyState: React.FC<{ text: string }> = ({ text }) => (
  <div className="py-10 text-center text-xs text-neutral-400 font-bold border border-dashed border-neutral-200 rounded-2xl">{text}</div>
);

// Uploads an image to storage, or returns it as a compressed data URL when the upload is not
// possible. Returns null when the file could not be read at all.
export const uploadImageFile = async (file: File): Promise<string | null> => {
  try {
    return await uploadGalleryImageToStorage(file);
  } catch {
    try {
      const local = URL.createObjectURL(file);
      const result = await compressImageToTargetSize(local, 120 * 1024);
      URL.revokeObjectURL(local);
      return result.url;
    } catch (err) {
      console.warn('Could not add image:', err);
      return null;
    }
  }
};

// Picks up to MAX_IMAGES images: uploaded to storage, or kept as a compressed
// data URL when the upload is not possible.
export const ImagesPicker: React.FC<{ images: string[]; onChange: (images: string[]) => void }> = ({ images, onChange }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [urlDraft, setUrlDraft] = useState('');
  const remaining = MAX_IMAGES - images.length;

  const addFiles = async (files: FileList | null) => {
    if (!files || remaining <= 0) return;
    setBusy(true);
    const added: string[] = [];
    for (const file of Array.from(files).slice(0, remaining)) {
      const url = await uploadImageFile(file);
      if (url) added.push(url);
    }
    onChange([...images, ...added].slice(0, MAX_IMAGES));
    setBusy(false);
  };

  const addUrl = () => {
    const url = urlDraft.trim();
    if (!url || remaining <= 0) return;
    onChange([...images, url]);
    setUrlDraft('');
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {images.map((src, i) => (
          <div key={src + i} className="relative w-16 h-16 rounded-xl overflow-hidden border border-neutral-200 bg-neutral-100">
            <img src={src} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => onChange(images.filter((_, idx) => idx !== i))}
              className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center cursor-pointer"
              aria-label="حذف الصورة"
            >
              <X size={11} />
            </button>
          </div>
        ))}
        {remaining > 0 && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="w-16 h-16 rounded-xl border border-dashed border-neutral-300 text-neutral-400 hover:text-[#0071e3] hover:border-[#0071e3] flex flex-col items-center justify-center gap-0.5 text-[9px] font-bold cursor-pointer"
          >
            {busy ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />}
            <span>{busy ? 'جاري الرفع' : 'رفع صورة'}</span>
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }}
      />
      {remaining > 0 && (
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
      <p className="text-[10px] text-neutral-400">حتى {MAX_IMAGES} صور ({images.length}/{MAX_IMAGES})</p>
    </div>
  );
};
