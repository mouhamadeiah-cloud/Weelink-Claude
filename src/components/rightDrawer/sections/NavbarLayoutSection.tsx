// Navbar layout (horizontal / vertical / hamburger / none) and the navbar's contents as parts the
// user can place on a slide as their own elements, or whose link they can copy onto an element.
import React from 'react';
import { Columns2, Copy, EyeOff, GripVertical, Menu, PanelTop, Plus } from 'lucide-react';
import { SectionHeader, Slider } from '../../ui/SharedControls';
import { RightDrawerProps } from '../types';
import { getNavbarParts, navbarPartElement, NavbarPart } from '../../../utils/navbarParts';

interface NavbarLayoutSectionProps {
  navbar: RightDrawerProps['navbar'];
  onUpdateNavbar: RightDrawerProps['onUpdateNavbar'];
  pages: RightDrawerProps['pages'];
  onAddElement: RightDrawerProps['onAddElement'];
  linkCopySourceId?: string;
  onStartLinkCopy?: (part: NavbarPart | null) => void;
}

const LAYOUTS = [
  { value: 'horizontal', label: 'عرضي', icon: PanelTop },
  { value: 'vertical', label: 'طولي', icon: Columns2 },
  { value: 'hamburger', label: 'هامبرغر', icon: Menu },
  { value: 'none', label: 'بدون', icon: EyeOff },
] as const;

const KIND_LABEL: Record<NavbarPart['kind'], string> = {
  logo: 'شعار',
  brand: 'اسم الموقع',
  link: 'رابط',
  cta: 'زر',
};

export const NavbarLayoutSection = ({
  navbar,
  onUpdateNavbar,
  pages,
  onAddElement,
  linkCopySourceId,
  onStartLinkCopy,
}: NavbarLayoutSectionProps) => {
  const layout = navbar.layout || 'horizontal';
  const parts = getNavbarParts(navbar, pages);

  const addPart = (part: NavbarPart) => {
    const el = navbarPartElement(part, navbar);
    onAddElement(el.type, el.content, el.styles, el.extra);
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      <div className="space-y-2">
        <SectionHeader title="شكل النافبار" />
        <div className="grid grid-cols-4 gap-1.5">
          {LAYOUTS.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => onUpdateNavbar({ layout: value })}
              aria-pressed={layout === value}
              className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border text-[11px] font-bold transition-all ${
                layout === value
                  ? 'border-[#0071e3] bg-[#0071e3]/10 text-[#0071e3]'
                  : 'border-neutral-200 text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50'
              }`}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </div>
        <p className="text-[10px] text-neutral-400 leading-tight">
          {layout === 'vertical' && 'عمود على جانب الصفحة فوق الشرائح. على الهاتف يظهر شريطاً بقائمة هامبرغر.'}
          {layout === 'hamburger' && 'أسماء الصفحات داخل قائمة تفتح من أيقونة الهامبرغر على كل الأجهزة.'}
          {layout === 'none' && 'لا يظهر نافبار في الموقع. ضع محتوياته بنفسك على الشرائح من القائمة أدناه.'}
          {layout === 'horizontal' && 'شريط عرضي في أعلى الصفحة.'}
        </p>
        {layout === 'vertical' && (
          <Slider
            label="عرض العمود"
            value={navbar.sideWidth ?? 200}
            min={120}
            max={360}
            onChange={(v) => onUpdateNavbar({ sideWidth: v })}
            formatValue={(v) => `${v}px`}
          />
        )}
      </div>

      <div className="space-y-2 pt-2 border-t border-black/[0.06]">
        <SectionHeader title="محتويات النافبار" />
        <p className="text-[11px] text-neutral-500 -mt-1 leading-relaxed">
          أضف أي محتوى كعنصر حر في الشريحة (بالزر أو بالسحب إلى المكان الذي تريده)، أو انسخ وظيفته على
          نص أو أيقونة موجودة لتصبح رابطاً يعمل مثله.
        </p>
        {parts.length === 0 && <p className="text-[11px] text-neutral-400">لا توجد محتويات في النافبار بعد.</p>}
        <div className="space-y-1.5">
          {parts.map((part) => {
            const isCopying = linkCopySourceId === part.id;
            return (
              <div
                key={part.id}
                draggable
                onDragStart={(e) => {
                  const el = navbarPartElement(part, navbar);
                  e.dataTransfer.setData('application/json', JSON.stringify({ type: 'navbar-part', element: el }));
                  e.dataTransfer.effectAllowed = 'copy';
                }}
                className={`flex items-center gap-2 p-2 rounded-xl border bg-white cursor-grab active:cursor-grabbing ${
                  isCopying ? 'border-[#0071e3] ring-2 ring-[#0071e3]/20' : 'border-neutral-200'
                }`}
              >
                <GripVertical size={14} className="text-neutral-300 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-neutral-800 truncate">{part.label}</div>
                  <div className="text-[10px] text-neutral-400">{KIND_LABEL[part.kind]}</div>
                </div>
                <button
                  type="button"
                  onClick={() => addPart(part)}
                  title="إضافة إلى الشريحة الحالية"
                  className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-bold bg-[#0071e3]/10 text-[#0071e3] hover:bg-[#0071e3]/20 transition-all"
                >
                  <Plus size={12} />
                  إضافة
                </button>
                {part.link && onStartLinkCopy && (
                  <button
                    type="button"
                    onClick={() => onStartLinkCopy(isCopying ? null : part)}
                    title="انسخ الوظيفة ثم انقر على نص أو أيقونة في الشريحة"
                    aria-pressed={isCopying}
                    className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                      isCopying ? 'bg-[#0071e3] text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                    }`}
                  >
                    <Copy size={12} />
                    {isCopying ? 'إلغاء' : 'نسخ'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
