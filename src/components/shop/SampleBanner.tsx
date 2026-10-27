// Shown above a warehouse that still holds the examples the page started with: one button removes them all.
import React from 'react';
import { Sparkles } from 'lucide-react';

export const SampleBanner: React.FC<{ count: number; noun: string; onRemove: () => void }> = ({ count, noun, onRemove }) =>
  count > 0 ? (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <Sparkles size={18} className="shrink-0" />
      <span className="flex-1 min-w-[200px] font-semibold">هذه {count} {noun} أمثلة لتشوف كيف يظهر الإدخال. عدّلها أو احذفها بأي وقت.</span>
      <button
        type="button"
        onClick={() => { if (window.confirm(`حذف الأمثلة (${count}) نهائياً؟ لن تتأثر ${noun} التي أضفتها بنفسك.`)) onRemove(); }}
        className="h-9 px-4 rounded-full bg-amber-600 text-white text-xs font-bold cursor-pointer hover:bg-amber-700"
      >
        احذف الأمثلة
      </button>
    </div>
  ) : null;
