// Small shared controls for the shop admin panel.
import React from 'react';
import { uploadGalleryImageToStorage } from '../../utils/galleryUpload';
import { compressImageToTargetSize } from '../../utils/imageCompressor';

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
