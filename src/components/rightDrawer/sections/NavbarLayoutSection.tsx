// Navbar layout (strip / column / hamburger icon) and the navbar's contents: each entry's link can
// be copied onto an element on a slide, or the entry can be shown as an icon (or an icon and its name).
import React, { useEffect, useState } from 'react';
import { ChevronRight, Columns2, Copy, Menu, PanelTop, Replace, Search } from 'lucide-react';
import { Icon } from '@iconify/react';
import { PillTabs, SectionHeader } from '../../ui/SharedControls';
import { RightDrawerProps } from '../types';
import { getNavbarParts, NavbarPart } from '../../../utils/navbarParts';

interface NavbarLayoutSectionProps {
  navbar: RightDrawerProps['navbar'];
  onUpdateNavbar: RightDrawerProps['onUpdateNavbar'];
  pages: RightDrawerProps['pages'];
  linkCopySourceId?: string;
  onStartLinkCopy?: (part: NavbarPart | null) => void;
}

const LAYOUTS = [
  { value: 'horizontal', label: 'عرضي', icon: PanelTop },
  { value: 'vertical', label: 'طولي', icon: Columns2 },
  { value: 'hamburger', label: 'هامبرغر', icon: Menu },
] as const;

const POPULAR_ICONS = [
  'lucide:home', 'lucide:shopping-bag', 'lucide:shopping-cart', 'lucide:store', 'lucide:user', 'lucide:users',
  'lucide:info', 'lucide:phone', 'lucide:mail', 'lucide:map-pin', 'lucide:calendar', 'lucide:image',
  'lucide:utensils', 'lucide:car', 'lucide:briefcase', 'lucide:star', 'lucide:heart', 'lucide:tag',
  'lucide:message-circle', 'lucide:help-circle', 'lucide:settings', 'lucide:search', 'lucide:gift', 'lucide:book-open',
  'tabler:brand-whatsapp', 'tabler:brand-instagram', 'tabler:brand-facebook', 'tabler:brand-tiktok', 'tabler:brand-youtube', 'tabler:brand-x',
];

export const NavbarLayoutSection = ({
  navbar,
  onUpdateNavbar,
  pages,
  linkCopySourceId,
  onStartLinkCopy,
}: NavbarLayoutSectionProps) => {
  const layout = navbar.layout === 'vertical' || navbar.layout === 'hamburger' ? navbar.layout : 'horizontal';
  const parts = getNavbarParts(navbar, pages);
  // The entry whose icon is being chosen (the panel then shows the icon library).
  const [replacing, setReplacing] = useState<NavbarPart | null>(null);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!search.trim()) {
      setResults([]);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`https://api.iconify.design/search?query=${encodeURIComponent(search)}&limit=60`, { signal: controller.signal });
        const data = res.ok ? await res.json() : null;
        setResults(Array.isArray(data?.icons) ? data.icons : []);
      } catch (err: any) {
        if (err.name !== 'AbortError') setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 450);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [search]);

  const setPartIcon = (partId: string, value: { icon: string; mode: 'icon' | 'icon-text' } | null) => {
    const next = { ...(navbar.partIcons || {}) };
    if (value) next[partId] = value;
    else delete next[partId];
    onUpdateNavbar({ partIcons: next });
  };

  if (replacing) {
    const current = navbar.partIcons?.[replacing.id];
    const mode = current?.mode || 'icon-text';
    const shown = search.trim() ? results : POPULAR_ICONS;
    return (
      <div className="space-y-3.5 text-right" dir="rtl">
        <div className="flex items-center justify-between pb-2 border-b border-neutral-200">
          <button
            type="button"
            onClick={() => {
              setReplacing(null);
              setSearch('');
            }}
            className="flex items-center gap-1 text-xs font-bold text-[#0071e3] bg-[#0071e3]/10 hover:bg-[#0071e3]/15 px-2.5 py-1.5 rounded-lg transition-colors"
          >
            <ChevronRight size={15} strokeWidth={2.4} />
            رجوع
          </button>
          <span className="text-sm font-bold text-neutral-900 truncate">استبدال «{replacing.label}»</span>
        </div>

        <PillTabs
          options={[
            { value: 'text', label: 'نص فقط' },
            { value: 'icon', label: 'أيقونة' },
            { value: 'icon-text', label: 'أيقونة ونص' },
          ]}
          value={current ? mode : 'text'}
          onChange={(v) => {
            if (v === 'text') setPartIcon(replacing.id, null);
            else setPartIcon(replacing.id, { icon: current?.icon || 'lucide:star', mode: v as 'icon' | 'icon-text' });
          }}
          className="w-full"
        />

        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث بالإنجليزية (home, cart, phone...)"
            className="w-full text-xs font-semibold px-3 py-2.5 pr-8 bg-white rounded-xl border border-neutral-300 focus:border-[#0071e3] focus:outline-none transition-all text-right"
          />
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
            {isSearching ? <div className="w-4 h-4 border-2 border-neutral-300 border-t-[#0071e3] rounded-full animate-spin" /> : <Search size={14} />}
          </div>
        </div>

        {shown.length === 0 && !isSearching ? (
          <p className="py-8 text-center text-xs text-neutral-400">لا توجد أيقونات بهذا الاسم. جرّب كلمة أخرى.</p>
        ) : (
          <div className="grid grid-cols-5 gap-1.5">
            {shown.map((name) => (
              <button
                key={name}
                type="button"
                title={name.split(':').pop()}
                onClick={() => setPartIcon(replacing.id, { icon: name, mode })}
                className={`aspect-square rounded-xl border flex items-center justify-center text-2xl transition-all active:scale-95 ${
                  current?.icon === name ? 'border-[#0071e3] bg-[#0071e3]/10 text-[#0071e3]' : 'border-neutral-200 text-neutral-700 hover:border-[#0071e3] hover:text-[#0071e3]'
                }`}
              >
                <Icon icon={name} />
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 text-right" dir="rtl">
      <div className="space-y-2">
        <SectionHeader title="شكل النافبار" />
        <div className="grid grid-cols-3 gap-1.5">
          {LAYOUTS.map(({ value, label, icon: LayoutIcon }) => (
            <button
              key={value}
              type="button"
              onClick={() => onUpdateNavbar(value === 'horizontal' ? { layout: value, posY: 0 } : { layout: value })}
              aria-pressed={layout === value}
              className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border text-[11px] font-bold transition-all ${
                layout === value
                  ? 'border-[#0071e3] bg-[#0071e3]/10 text-[#0071e3]'
                  : 'border-neutral-200 text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50'
              }`}
            >
              <LayoutIcon size={18} />
              {label}
            </button>
          ))}
        </div>
        <p className="text-[10px] text-neutral-400 leading-relaxed">
          أو اسحب النافبار في الساحة: إلى أحد الجانبين ليصبح طولياً، أو إلى الأعلى والأسفل ليبقى عرضياً. اسحب
          مقابضه لتكبيره وتصغيره.
        </p>
      </div>

      <div className="space-y-2 pt-2 border-t border-black/[0.06]">
        <SectionHeader title="محتويات النافبار" />
        {parts.length === 0 && <p className="text-[11px] text-neutral-400">لا توجد محتويات في النافبار بعد.</p>}
        <div className="space-y-1.5">
          {parts.map((part) => {
            const isCopying = linkCopySourceId === part.id;
            const partIcon = navbar.partIcons?.[part.id];
            return (
              <div
                key={part.id}
                className={`flex items-center gap-2 p-2 rounded-xl border bg-white ${
                  isCopying ? 'border-[#0071e3] ring-2 ring-[#0071e3]/20' : 'border-neutral-200'
                }`}
              >
                {partIcon && <Icon icon={partIcon.icon} className="text-lg text-neutral-600 shrink-0" />}
                <span className="flex-1 min-w-0 text-xs font-bold text-neutral-800 truncate">{part.label}</span>
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
                {part.kind !== 'logo' && (
                  <button
                    type="button"
                    onClick={() => setReplacing(part)}
                    title="عرضه كأيقونة أو أيقونة ونص"
                    className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-bold bg-[#0071e3]/10 text-[#0071e3] hover:bg-[#0071e3]/20 transition-all"
                  >
                    <Replace size={12} />
                    استبدال
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
