// A small rich-text editor for the product description (bold, headings, lists, alignment).
import React, { useEffect, useRef } from 'react';
import { Bold, Italic, Underline, Heading3, List, ListOrdered, AlignRight, AlignCenter, AlignLeft, Eraser } from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

const TOOLS: { icon: React.ElementType; label: string; run: () => void }[] = [
  { icon: Bold, label: 'عريض', run: () => document.execCommand('bold') },
  { icon: Italic, label: 'مائل', run: () => document.execCommand('italic') },
  { icon: Underline, label: 'تسطير', run: () => document.execCommand('underline') },
  { icon: Heading3, label: 'عنوان', run: () => document.execCommand('formatBlock', false, 'h3') },
  { icon: List, label: 'قائمة نقطية', run: () => document.execCommand('insertUnorderedList') },
  { icon: ListOrdered, label: 'قائمة مرقمة', run: () => document.execCommand('insertOrderedList') },
  { icon: AlignRight, label: 'محاذاة لليمين', run: () => document.execCommand('justifyRight') },
  { icon: AlignCenter, label: 'توسيط', run: () => document.execCommand('justifyCenter') },
  { icon: AlignLeft, label: 'محاذاة لليسار', run: () => document.execCommand('justifyLeft') },
  { icon: Eraser, label: 'إزالة التنسيق', run: () => { document.execCommand('removeFormat'); document.execCommand('formatBlock', false, 'div'); } },
];

export const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, placeholder }) => {
  const ref = useRef<HTMLDivElement>(null);

  // Set the content only from outside changes, so typing never moves the caret.
  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) ref.current.innerHTML = value;
  }, [value]);

  return (
    <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden focus-within:border-[#0071e3] focus-within:ring-2 focus-within:ring-[#0071e3]/15">
      <div className="flex flex-wrap gap-0.5 p-1.5 border-b border-neutral-100 bg-neutral-50">
        {TOOLS.map((t) => (
          <button
            key={t.label}
            type="button"
            title={t.label}
            aria-label={t.label}
            onMouseDown={(e) => { e.preventDefault(); t.run(); if (ref.current) onChange(ref.current.innerHTML); }}
            className="w-8 h-8 rounded-lg text-neutral-600 hover:bg-white hover:text-[#0071e3] flex items-center justify-center cursor-pointer"
          >
            <t.icon size={15} />
          </button>
        ))}
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        dir="rtl"
        data-placeholder={placeholder}
        onInput={(e) => onChange((e.target as HTMLDivElement).innerHTML)}
        className="product-rich-text min-h-[200px] max-h-[420px] overflow-y-auto p-3 text-sm text-[#1d1d1f] leading-relaxed outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-neutral-400"
      />
    </div>
  );
};
