// Shown after login: the user picks which project to open (or create).
import React from 'react';
import { FileText, ShoppingBag, CarFront, UtensilsCrossed, ArrowLeft, Loader2 } from 'lucide-react';
import { ProjectType } from './shop/shopTypes';

interface ProjectChooserProps {
  onChoose: (type: ProjectType) => void;
  hasShop: boolean;
  hasCars: boolean;
  hasRestaurant: boolean;
  loadingType: ProjectType | null;
}

export const ProjectChooser: React.FC<ProjectChooserProps> = ({ onChoose, hasShop, hasCars, hasRestaurant, loadingType }) => {
  const cards: { type: ProjectType; title: string; subtitle: string; desc: string; icon: React.ElementType; accent: string; cta: string }[] = [
    {
      type: 'page',
      title: 'صفحة مجانية',
      subtitle: 'Weelink',
      desc: 'صفحة تعريفية لنشاطك تصممها بحرية، مع مساعد wee ai.',
      icon: FileText,
      accent: '#0071e3',
      cta: 'فتح الصفحة',
    },
    {
      type: 'shop',
      title: 'متجر إلكتروني',
      subtitle: 'Weelink / Shops',
      desc: 'متجر بصفحات جاهزة، مع لوحة إدارة للتصنيفات والمستودع والطلبات والزبائن والحسابات.',
      icon: ShoppingBag,
      accent: '#1d1d1f',
      cta: hasShop ? 'فتح المتجر' : 'إنشاء متجر',
    },
    {
      type: 'cars',
      title: 'معرض سيارات',
      subtitle: 'Weelink / Cars',
      desc: 'موقع لمعرضك بصفحات جاهزة، مع لوحة إدارة لإدخال السيارات والمخزون.',
      icon: CarFront,
      accent: '#C8102E',
      cta: hasCars ? 'فتح المعرض' : 'إنشاء معرض',
    },
    {
      type: 'restaurant',
      title: 'مطعم',
      subtitle: 'Weelink / Restaurant',
      desc: 'موقع لمطعمك مع منيو وطلب أونلاين، ولوحة إدارة للأقسام والأطباق والطلبات.',
      icon: UtensilsCrossed,
      accent: '#B5562B',
      cta: hasRestaurant ? 'فتح المطعم' : 'إنشاء مطعم',
    },
  ];

  return (
    <div className="min-h-screen bg-[#f5f5f7] flex flex-col items-center justify-center px-5 py-12 font-sans" dir="rtl">
      <div className="w-full max-w-6xl space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2">
            <span className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#0071e3] to-[#40a9ff] text-white flex items-center justify-center font-bold">W</span>
            <span className="text-2xl font-bold tracking-tight text-[#1d1d1f]">weelink</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#1d1d1f]">ماذا تريد أن تبني؟</h1>
          <p className="text-sm text-neutral-500">اختر مشروعاً للدخول إليه. يمكنك التبديل لاحقاً بالضغط على شعار weelink.</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((c) => (
            <button
              key={c.type}
              type="button"
              disabled={loadingType !== null}
              onClick={() => onChoose(c.type)}
              className="group text-right bg-white rounded-3xl border border-neutral-200 p-6 space-y-4 hover:border-transparent hover:shadow-[0_20px_50px_rgba(0,0,0,0.12)] transition cursor-pointer disabled:cursor-wait"
            >
              <span className="w-12 h-12 rounded-2xl text-white flex items-center justify-center" style={{ backgroundColor: c.accent }}>
                <c.icon size={22} />
              </span>
              <div>
                <div className="text-[11px] font-bold text-neutral-400">{c.subtitle}</div>
                <div className="text-lg font-black text-[#1d1d1f]">{c.title}</div>
              </div>
              <p className="text-xs text-neutral-500 leading-relaxed min-h-[36px]">{c.desc}</p>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold" style={{ color: c.accent }}>
                {loadingType === c.type ? <Loader2 size={14} className="animate-spin" /> : null}
                {c.cta}
                <ArrowLeft size={14} className="transition group-hover:-translate-x-1" />
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
