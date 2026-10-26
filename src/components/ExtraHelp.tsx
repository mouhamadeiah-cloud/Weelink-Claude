// The «؟» beside an extra service: tap it to read what the service includes (the owner's note).
import React, { useState } from 'react';

export const ExtraHelp: React.FC<{ note?: string }> = ({ note }) => {
  const [open, setOpen] = useState(false);
  if (!note) return null;
  return (
    <span className="relative inline-block align-middle">
      <button
        type="button"
        aria-label="ما تشمله الخدمة"
        aria-expanded={open}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen((o) => !o); }}
        onBlur={() => setOpen(false)}
        className="w-4 h-4 rounded-full border border-current text-[10px] leading-none font-black opacity-70 hover:opacity-100 cursor-pointer inline-flex items-center justify-center"
      >
        ؟
      </button>
      {open && (
        <span role="tooltip" className="absolute z-30 bottom-full mb-1.5 right-0 w-52 max-w-[70vw] rounded-lg bg-neutral-900 text-white text-xs font-bold leading-relaxed p-2 shadow-lg text-right whitespace-normal">
          {note}
        </span>
      )}
    </span>
  );
};
