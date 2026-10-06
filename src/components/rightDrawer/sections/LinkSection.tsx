// Moved verbatim from RightDrawer.tsx (was an inline IIFE in the drawer body).
import React from 'react';
import { Check, ExternalLink, FileText, Folder, Trash2 } from 'lucide-react';
import { ContactType } from '../../../types';
import { ShopElementSettings } from '../../ShopElementSettings';
import { RightDrawerProps } from '../types';

interface LinkSectionProps {
  pages: RightDrawerProps['pages'];
  slides: RightDrawerProps['slides'];
  selectedElement: RightDrawerProps['selectedElement'];
  onUpdateElement: RightDrawerProps['onUpdateElement'];
  linkSubSection: 'page' | 'slide' | 'url' | 'contact';
  setLinkSubSection: React.Dispatch<React.SetStateAction<'page' | 'slide' | 'url' | 'contact'>>;
  contactMethod: ContactType;
  setContactMethod: React.Dispatch<React.SetStateAction<ContactType>>;
  contactInputValue: string;
  setContactInputValue: React.Dispatch<React.SetStateAction<string>>;
  urlInputValue: string;
  setUrlInputValue: React.Dispatch<React.SetStateAction<string>>;
  // The shop's own settings of a cart, checkout, product list or search bar. The docked panel shows
  // them in the element's content card, so it leaves them out here (a product button's keeps).
  withShopSettings?: boolean;
}

const SHOP_PANEL_TYPES = ['cart', 'checkout', 'shopProducts', 'shopSearch'];

export const LinkSection = ({
  pages,
  slides,
  selectedElement,
  onUpdateElement,
  linkSubSection,
  setLinkSubSection,
  contactMethod,
  setContactMethod,
  contactInputValue,
  setContactInputValue,
  urlInputValue,
  setUrlInputValue,
  withShopSettings = true,
}: LinkSectionProps) => {
  const contactPlatforms = [
    {
      type: 'whatsapp' as ContactType,
      name: 'واتساب',
      subname: 'WhatsApp',
      color: '#25D366',
      bgColor: '#25D36618',
      placeholder: '0049000000 أو +966500000000',
      helpText: 'رقم الواتساب مع رمز الدولة (مثال: 0049... أو +966...)',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12.031 2C6.495 2 2 6.495 2 12.031c0 1.77.464 3.498 1.346 5.027L2 22l5.086-1.334A9.97 9.97 0 0 0 12.031 22c5.536 0 10.031-4.495 10.031-10.031C22.062 6.495 17.567 2 12.031 2zm5.836 14.238c-.244.685-1.42 1.258-1.956 1.338-.508.077-1.168.109-3.73-1.025-3.08-1.36-5.074-4.495-5.23-4.7-.152-.206-1.246-1.657-1.246-3.16 0-1.503.788-2.243 1.068-2.533.279-.29.61-.363.814-.363.203 0 .407.002.585.011.19.009.444-.072.695.53.259.62.883 2.152.96 2.308.077.156.128.339.025.545-.102.206-.153.334-.305.513-.153.18-.323.402-.461.54-.153.153-.312.32-.134.626.178.305.79 1.302 1.696 2.109 1.168 1.04 2.152 1.362 2.457 1.515.305.153.484.128.662-.077.178-.206.764-.89 9.68-1.127.204-.238.408-.18.662-.077.255.103 1.616.764 1.895.903.28.14.467.209.535.326.068.118.068.685-.176 1.37z" />
        </svg>
      )
    },
    {
      type: 'phone' as ContactType,
      name: 'هاتف',
      subname: 'اتصال هاتفي',
      color: '#34C759',
      bgColor: '#34C75918',
      placeholder: '0049000000 أو 0500000000',
      helpText: 'رقم الهاتف للاتصال المباشر عند النقر',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
        </svg>
      )
    },
    {
      type: 'email' as ContactType,
      name: 'إيميل',
      subname: 'البريد الإلكتروني',
      color: '#EA4335',
      bgColor: '#EA433518',
      placeholder: 'name@example.com',
      helpText: 'البريد الإلكتروني لفتح تطبيق البريد مباشرة',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="20" height="16" x="2" y="4" rx="2" />
          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
        </svg>
      )
    },
    {
      type: 'facebook' as ContactType,
      name: 'Facebook',
      subname: 'فيسبوك',
      color: '#1877F2',
      bgColor: '#1877F218',
      placeholder: 'اسم المستخدم أو رابط فيسبوك',
      helpText: 'اسم الحساب أو الرابط الكامل لحساب فيسبوك',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      )
    },
    {
      type: 'instagram' as ContactType,
      name: 'انستغرام',
      subname: 'Instagram',
      color: '#E4405F',
      bgColor: '#E4405F18',
      placeholder: 'اسم الحساب بدون @ أو الرابط',
      helpText: 'اسم الحساب أو الرابط على إنستغرام',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
        </svg>
      )
    },
    {
      type: 'x' as ContactType,
      name: 'منصة X',
      subname: 'Twitter',
      color: '#000000',
      bgColor: '#00000015',
      placeholder: 'اسم الحساب بدون @ أو الرابط',
      helpText: 'اسم الحساب أو الرابط على منصة X',
      icon: (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      )
    },
    {
      type: 'tiktok' as ContactType,
      name: 'Tiktok',
      subname: 'تيك توك',
      color: '#000000',
      bgColor: '#00000015',
      placeholder: 'اسم الحساب بدون @ أو الرابط',
      helpText: 'اسم الحساب أو الرابط على تيك توك',
      icon: (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.99v7.94c.01 1.87-.6 3.73-1.74 5.21-1.42 1.83-3.67 2.9-5.98 2.8-2.61-.05-5.01-1.47-6.28-3.75-1.32-2.31-1.28-5.24.12-7.52 1.34-2.22 3.78-3.62 6.36-3.56.32.01.64.04.96.09v4.11c-.4-.14-.83-.22-1.26-.22-1.24-.04-2.47.53-3.15 1.57-.71 1.07-.67 2.49.09 3.52.74 1.01 2.01 1.57 3.26 1.42 1.34-.14 2.47-1.14 2.74-2.47.08-.41.11-.84.11-1.26V.02z" />
        </svg>
      )
    }
  ];

  const buildContactUrl = (type: ContactType, val: string) => {
    const clean = val.trim();
    if (!clean) return '';
    switch (type) {
      case 'whatsapp': {
        const cleanPhone = clean.replace(/[^0-9]/g, '');
        return `https://wa.me/${cleanPhone}`;
      }
      case 'phone': {
        const cleanPhone = clean.replace(/[^0-9+]/g, '');
        return `tel:${cleanPhone}`;
      }
      case 'email': {
        return `mailto:${clean}`;
      }
      case 'facebook': {
        if (clean.startsWith('http')) return clean;
        return `https://facebook.com/${clean.replace(/^@/, '')}`;
      }
      case 'instagram': {
        if (clean.startsWith('http')) return clean;
        return `https://instagram.com/${clean.replace(/^@/, '')}`;
      }
      case 'x': {
        if (clean.startsWith('http')) return clean;
        return `https://x.com/${clean.replace(/^@/, '')}`;
      }
      case 'tiktok': {
        if (clean.startsWith('http')) return clean;
        return `https://tiktok.com/@${clean.replace(/^@/, '')}`;
      }
    }
  };

  const handleSelectContactMethod = (type: ContactType) => {
    setContactMethod(type);
    const generated = buildContactUrl(type, contactInputValue);
    onUpdateElement({
      linkType: 'contact',
      contactType: type,
      contactValue: contactInputValue,
      linkUrl: generated,
      linkTargetId: undefined,
    });
  };

  const handleContactInputChange = (val: string) => {
    setContactInputValue(val);
    const generated = buildContactUrl(contactMethod, val);
    onUpdateElement({
      linkType: 'contact',
      contactType: contactMethod,
      contactValue: val,
      linkUrl: generated,
      linkTargetId: undefined,
    });
  };

  const activePlatform = contactPlatforms.find(p => p.type === contactMethod) || contactPlatforms[0];

  return (
    <div className="space-y-4">
      {selectedElement && (withShopSettings || !SHOP_PANEL_TYPES.includes(selectedElement.type)) && (
        <ShopElementSettings element={selectedElement} onUpdateElement={onUpdateElement} />
      )}

      {/* Top Capsule / Oval Bar: ( صفحة | شريحة | URL | تواصل ) - كما في الرسم اليدوي */}
      <div className="w-full p-1 bg-neutral-100 rounded-full border border-neutral-300 shadow-2xs flex items-center justify-between px-1 gap-1 select-none">
        {[
          { id: 'page' as const, label: 'صفحة' },
          { id: 'slide' as const, label: 'شريحة' },
          { id: 'url' as const, label: 'URL' },
          { id: 'contact' as const, label: 'تواصل' },
        ].map((tab) => {
          const isActive = linkSubSection === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setLinkSubSection(tab.id);
                if (tab.id === 'page' && pages.length > 0 && selectedElement?.linkType !== 'page') {
                  onUpdateElement({ linkType: 'page', linkTargetId: pages[0].id, linkUrl: `#page-${pages[0].id}`, contactType: undefined, contactValue: undefined });
                } else if (tab.id === 'slide' && slides.length > 0 && selectedElement?.linkType !== 'slide') {
                  onUpdateElement({ linkType: 'slide', linkTargetId: slides[0].id, linkUrl: `#slide-${slides[0].id}`, contactType: undefined, contactValue: undefined });
                } else if (tab.id === 'contact' && selectedElement?.linkType !== 'contact') {
                  handleSelectContactMethod(contactMethod);
                }
              }}
              className={`flex-1 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                isActive 
                  ? 'bg-white text-[#0071e3] shadow-xs ring-1 ring-[#0071e3]/30' 
                  : 'text-neutral-600 hover:text-black hover:bg-neutral-200/50'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 1. فرع تواصل (Contact) - كما في المخطط اليدوي تماماً */}
      {linkSubSection === 'contact' && (
        <div className="space-y-3.5">
          {/* الشريط البيضاوي لأيقونات وسائل التواصل مع إحاطة الأيقونة المفعلة بدائرة */}
          <div className="w-full p-1.5 bg-neutral-100 rounded-full border border-neutral-300 shadow-2xs flex items-center justify-between px-2 gap-1 select-none">
            {contactPlatforms.map((cp) => {
              const isSelected = contactMethod === cp.type;
              return (
                <button
                  key={cp.type}
                  type="button"
                  onClick={() => handleSelectContactMethod(cp.type)}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                    isSelected 
                      ? 'bg-white shadow-xs scale-110 ring-2' 
                      : 'hover:bg-white/80 opacity-70 hover:opacity-100'
                  }`}
                  style={{
                    color: cp.color,
                    boxShadow: isSelected ? `0 0 0 2px ${cp.color}` : undefined
                  }}
                  title={`${cp.name} (${cp.subname})`}
                >
                  {cp.icon}
                </button>
              );
            })}
          </div>

          {/* حقل الإدخال كما في المخطط اليدوي [ 0049000000 ] */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-800 font-bold flex items-center gap-1.5">
                <span style={{ color: activePlatform.color }}>{activePlatform.icon}</span>
                <span>رقم / حساب {activePlatform.name}:</span>
              </span>
              <span className="text-[10px] text-neutral-400 font-mono">
                {activePlatform.subname}
              </span>
            </div>
            <input
              type="text"
              value={contactInputValue}
              onChange={(e) => handleContactInputChange(e.target.value)}
              placeholder={activePlatform.placeholder}
              dir="ltr"
              className="w-full px-3 py-2.5 bg-white rounded-xl border border-neutral-300 text-xs font-mono text-left focus:outline-none focus:border-[#0071e3] focus:ring-1 focus:ring-[#0071e3] transition-all shadow-2xs"
            />
            <p className="text-[10px] text-neutral-500 pt-0.5">
              {activePlatform.helpText}
            </p>
          </div>


        </div>
      )}

      {/* 2. فرع صفحة (رابط صفحة تفتح صفحات المشروع) */}
      {linkSubSection === 'page' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-neutral-800 font-bold text-sm">صفحات المشروع:</span>
            <span className="text-[11px] text-neutral-500">اختر صفحة للانتقال إليها</span>
          </div>
          <div className="space-y-1.5">
            {pages.map((p) => {
              const isSelectedPage = selectedElement?.linkType === 'page' && selectedElement?.linkTargetId === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    onUpdateElement({
                      linkType: 'page',
                      linkTargetId: p.id,
                      linkUrl: `#page-${p.id}`,
                      contactType: undefined,
                      contactValue: undefined,
                    });
                  }}
                  className={`w-full p-3 rounded-xl border text-right transition-all flex items-center justify-between cursor-pointer ${
                    isSelectedPage
                      ? 'border-[#0071e3] bg-[#0071e3]/10 shadow-xs ring-1 ring-[#0071e3]/40'
                      : 'border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      isSelectedPage ? 'bg-[#0071e3] text-white' : 'bg-neutral-100 text-neutral-600'
                    }`}>
                      <FileText size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-neutral-800">
                        {p.name}
                      </div>
                      <div className="text-[10px] text-neutral-500 flex items-center gap-2 mt-0.5">
                        <span className="font-mono">{p.slug}</span>
                        <span>•</span>
                        <span>{p.slides.length} شرائح</span>
                      </div>
                    </div>
                  </div>
                  {isSelectedPage && (
                    <div className="w-5 h-5 rounded-full bg-[#0071e3] text-white flex items-center justify-center shrink-0">
                      <Check size={12} strokeWidth={3} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. فرع شريحة (الصفحات غير مفعلة وتحتها الشرائح الموجودة كما في الهيكل) */}
      {linkSubSection === 'slide' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-neutral-800 font-bold text-sm">شرائح المشروع:</span>
            <span className="text-[11px] text-neutral-500">اختر شريحة مستهدفة</span>
          </div>
          <div className="space-y-3">
            {pages.map((p) => {
              return (
                <div key={p.id} className="space-y-1.5">
                  {/* الصفحات غير مفعلة وتحتها الشرائح كما في الهيكل */}
                  <div className="p-2 bg-neutral-100/90 rounded-lg text-neutral-500 font-bold text-xs flex items-center justify-between select-none cursor-not-allowed border border-neutral-200/60">
                    <div className="flex items-center gap-1.5">
                      <Folder size={14} className="text-neutral-400" />
                      <span>صفحة: {p.name}</span>
                    </div>
                    <span className="text-[10px] font-normal text-neutral-400">({p.slides.length} شرائح)</span>
                  </div>

                  {/* الشرائح تحت الصفحة مباشرة */}
                  <div className="pr-3 pl-1 space-y-1 border-r-2 border-neutral-200 mr-2">
                    {p.slides.map((s, idx) => {
                      const isSelectedSlide = selectedElement?.linkType === 'slide' && selectedElement?.linkTargetId === s.id;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => {
                            onUpdateElement({
                              linkType: 'slide',
                              linkTargetId: s.id,
                              linkUrl: `#slide-${s.id}`,
                              contactType: undefined,
                              contactValue: undefined,
                            });
                          }}
                          className={`w-full p-2.5 rounded-xl border text-right transition-all flex items-center justify-between cursor-pointer ${
                            isSelectedSlide
                              ? 'border-[#0071e3] bg-[#0071e3]/10 shadow-xs ring-1 ring-[#0071e3]/40'
                              : 'border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3.5 h-3.5 rounded-full border border-neutral-300 shrink-0 shadow-2xs"
                              style={{ backgroundColor: s.backgroundColor || '#ffffff' }}
                            />
                            <div className="text-xs font-semibold text-neutral-800">
                              {s.name || `شريحة ${idx + 1}`}
                            </div>
                          </div>
                          {isSelectedSlide && (
                            <div className="w-5 h-5 rounded-full bg-[#0071e3] text-white flex items-center justify-center shrink-0">
                              <Check size={12} strokeWidth={3} />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. فرع رابط خارجي (URL) */}
      {linkSubSection === 'url' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-neutral-800 font-bold text-sm">رابط خارجي:</span>
            <span className="text-[11px] text-neutral-500">موقع ويب خارجي</span>
          </div>
          <div className="space-y-2">
            <input
              type="url"
              value={urlInputValue}
              onChange={(e) => {
                const val = e.target.value;
                setUrlInputValue(val);
                onUpdateElement({
                  linkType: 'url',
                  linkUrl: val,
                  contactType: undefined,
                  contactValue: undefined,
                  linkTargetId: undefined,
                });
              }}
              placeholder="https://example.com"
              dir="ltr"
              className="w-full px-3 py-2.5 bg-white rounded-xl border border-neutral-300 text-xs font-mono text-left focus:outline-none focus:border-[#0071e3] focus:ring-1 focus:ring-[#0071e3] transition-all shadow-2xs"
            />

            {/* بادئات واختصارات سريعة */}
            <div className="flex gap-1.5 pt-1">
              {['https://', 'https://google.com', 'https://wa.me/'].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setUrlInputValue(preset);
                    onUpdateElement({
                      linkType: 'url',
                      linkUrl: preset,
                      contactType: undefined,
                      contactValue: undefined,
                      linkTargetId: undefined,
                    });
                  }}
                  className="px-2 py-1 rounded-lg border border-neutral-200 text-[10px] font-mono text-neutral-600 hover:bg-neutral-50 cursor-pointer"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* معاينة الرابط وإزالته عند توفره */}
      {selectedElement?.linkUrl && (
        <div className="pt-2 border-t border-neutral-200 space-y-2">
          <div className="p-2.5 bg-neutral-50 rounded-xl border border-neutral-200 text-[11px] flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 overflow-hidden">
              <ExternalLink size={13} className="text-[#0071e3] shrink-0" />
              <span className="font-mono text-neutral-700 truncate" dir="ltr">
                {selectedElement.linkUrl}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setContactInputValue('');
              setUrlInputValue('');
              onUpdateElement({
                linkUrl: undefined,
                linkType: undefined,
                linkTargetId: undefined,
                contactType: undefined,
                contactValue: undefined,
              });
            }}
            className="w-full py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <Trash2 size={13} />
            <span>إزالة الرابط من هذا العنصر</span>
          </button>
        </div>
      )}
    </div>
  );
};
