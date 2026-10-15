// Small floating tool buttons over a design (gallery and admin): round icons that appear when the pointer is over the
// design (always there on a touch screen), each with its name as a tooltip. The parent must be `relative group`.
import React from 'react';

export interface FloatingTool { id: string; label: string; icon: React.ReactNode; onClick: () => void; danger?: boolean; disabled?: boolean }

export const FloatingTools: React.FC<{ tools: FloatingTool[] }> = ({ tools }) => (
  <div dir="rtl" className="absolute right-2 top-2 z-10 flex gap-1 rounded-full border border-line/70 bg-surface/85 p-1 opacity-0 shadow-md backdrop-blur transition-opacity group-hover:opacity-100 focus-within:opacity-100 [@media(hover:none)]:opacity-100">
    {tools.map((t) => (
      <button key={t.id} type="button" title={t.label} aria-label={t.label} disabled={t.disabled} onClick={t.onClick}
        className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors disabled:opacity-40 ${t.danger ? 'text-danger hover:bg-danger/10' : 'text-ink hover:bg-brand/10 hover:text-brand'}`}>
        {t.icon}
      </button>
    ))}
  </div>
);
