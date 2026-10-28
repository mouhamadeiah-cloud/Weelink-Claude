// The panel beside Wee AI's chat (Eyad, 28 Oct): for the question being asked it shows a big picture of what the step does in the page (the
// page name in the navbar, where the contact details go, how a page can begin...), the explanation under it in large type, and the note
// under that. Choosing steps show two examples that only illustrate the step. Sections of the page show a real slide.
import React from 'react';
import { Check, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import { SectionPreview } from './SectionPreview';

export interface Topic {
  id: string; // `step-N` or `section-<id>` or `done`
  title: string; // Wee AI's question, for the screen reader and the small header
  explain: string;
  note?: string;
  pageName?: string; // typed so far: the picture shows it in the navbar
  logo?: string;
  progress?: { n: number; total: number };
}

const Browser: React.FC<{ children: React.ReactNode; label?: string }> = ({ children, label }) => (
  <figure className="w-full rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden" aria-label={label}>
    <div className="flex items-center gap-1 px-2.5 py-1.5 bg-neutral-100 border-b border-neutral-200">
      <i className="w-2 h-2 rounded-full bg-rose-300" /><i className="w-2 h-2 rounded-full bg-amber-300" /><i className="w-2 h-2 rounded-full bg-emerald-300" />
      <span className="mr-2 flex-1 h-3.5 rounded bg-white/80" />
    </div>
    {children}
  </figure>
);

const Bars: React.FC<{ n?: number; tone?: string }> = ({ n = 3, tone = 'bg-neutral-200' }) => (
  <div className="space-y-1.5">{Array.from({ length: n }, (_, i) => <i key={i} className={`block h-1.5 rounded ${tone}`} style={{ width: `${88 - i * 18}%` }} />)}</div>
);

const Tag: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="inline-block rounded-full bg-brand text-white text-[11px] font-bold px-2.5 py-0.5 shadow">{children}</span>
);

const Nav: React.FC<{ name: string; logo?: string; hlName?: boolean; hlLogo?: boolean }> = ({ name, logo, hlName, hlLogo }) => (
  <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-100">
    <div className="flex items-center gap-2">
      <span className={`w-7 h-7 rounded-lg bg-brand/10 text-brand text-xs font-black flex items-center justify-center overflow-hidden ${hlLogo ? 'ring-2 ring-brand' : ''}`}>
        {logo ? <img src={logo} alt="" className="w-full h-full object-cover" /> : 'W'}
      </span>
      <span className={`text-sm font-black text-neutral-900 rounded px-1.5 ${hlName ? 'ring-2 ring-brand bg-brand/5' : ''}`}>{name}</span>
    </div>
    <div className="flex gap-2"><i className="w-8 h-1.5 rounded bg-neutral-200" /><i className="w-8 h-1.5 rounded bg-neutral-200" /><i className="w-8 h-1.5 rounded bg-neutral-200" /></div>
  </div>
);

const Hero: React.FC<{ from: string; to: string; title: string; line: string; button?: string; dark?: boolean }> = ({ from, to, title, line, button, dark = true }) => (
  <div className="px-4 py-5 space-y-1.5" style={{ background: `linear-gradient(135deg, ${from}, ${to})`, color: dark ? '#fff' : '#1f2937' }}>
    <p className="text-base font-black leading-tight">{title}</p>
    <p className="text-[11px] font-semibold opacity-90">{line}</p>
    {button && <span className="inline-block mt-1 rounded-full bg-white/90 text-neutral-900 text-[10px] font-bold px-3 py-1">{button}</span>}
  </div>
);

const Pair: React.FC<{ children: React.ReactNode }> = ({ children }) => <div className="grid grid-cols-2 gap-2.5 w-full">{children}</div>;
const Cap: React.FC<{ children: React.ReactNode }> = ({ children }) => <p className="text-center text-[11px] font-bold text-neutral-500 mt-1.5">{children}</p>;

const Wave: React.FC<{ shape: 'straight' | 'wave' }> = ({ shape }) => (
  <svg viewBox="0 0 100 12" preserveAspectRatio="none" className="block w-full h-3" aria-hidden>
    {shape === 'wave' ? <path d="M0 6 Q12 0 25 6 T50 6 T75 6 T100 6 V12 H0Z" fill="#e0e7ff" /> : <path d="M0 6 H100 V12 H0Z" fill="#e0e7ff" />}
  </svg>
);

const Visual: React.FC<{ topic: Topic }> = ({ topic }) => {
  const name = topic.pageName?.trim() || 'اسم صفحتك';
  switch (topic.id) {
    case 'step-1':
      return (
        <div className="space-y-2">
          <Browser label="اسم الصفحة بالشريط العلوي"><Nav name={name} logo={topic.logo} hlName /><Hero from="#dbeafe" to="#ede9fe" title={`أهلاً بكم في ${name}`} line="هيك بيظهر اسم صفحتك بالنافبار وبالعنوان" dark={false} /></Browser>
          <div className="flex justify-center"><Tag>اسم صفحتك بالنافبار</Tag></div>
        </div>
      );
    case 'step-2':
      return (
        <Browser label="العنوان والخريطة">
          <div className="grid grid-cols-2 min-h-32">
            <div className="p-3 space-y-2 border-l border-neutral-100"><p className="text-xs font-black">تواصل معنا</p><div className="flex items-center gap-1.5 text-[11px] font-bold text-neutral-600"><MapPin size={13} className="text-brand" /> دمشق، المزة، شارع ...</div><Bars n={2} /></div>
            <div className="relative bg-gradient-to-br from-emerald-100 to-sky-100"><MapPin size={26} className="absolute top-1/2 right-1/2 -mt-5 -mr-3 text-rose-500 drop-shadow" /></div>
          </div>
        </Browser>
      );
    case 'step-3':
      return (
        <div className="flex items-stretch gap-2 w-full" aria-label="الرسائل تصل لمعلومات الاتصال">
          <div className="flex-1 rounded-xl border border-neutral-200 bg-white p-2.5 space-y-1.5 shadow-sm"><p className="text-[11px] font-black">زبونك يرسل</p><i className="block h-4 rounded bg-neutral-100" /><i className="block h-4 rounded bg-neutral-100" /><i className="block h-7 rounded bg-neutral-100" /><span className="inline-block rounded bg-brand text-white text-[10px] font-bold px-3 py-1">إرسال</span></div>
          <div className="self-center text-xl font-black text-brand" aria-hidden>←</div>
          <div className="flex-1 rounded-xl border border-brand/30 bg-brand/5 p-2.5 space-y-1.5 shadow-sm"><p className="text-[11px] font-black text-brand">تصلك على</p>
            <p className="flex items-center gap-1.5 text-[11px] font-bold"><MessageCircle size={13} className="text-emerald-600" /> واتساب</p>
            <p className="flex items-center gap-1.5 text-[11px] font-bold"><Phone size={13} className="text-brand" /> الهاتف</p>
            <p className="flex items-center gap-1.5 text-[11px] font-bold"><Mail size={13} className="text-rose-500" /> الإيميل</p></div>
        </div>
      );
    case 'step-4':
      return (
        <div>
          <Pair>
            <div><Browser><Nav name="عيادة الابتسامة" /><Hero from="#0ea5e9" to="#2563eb" title="ابتسامتك بأيدٍ أمينة" line="طب أسنان بدمشق" button="احجز موعدك" /></Browser><Cap>مثال: عيادة</Cap></div>
            <div><Browser><Nav name="مطعم الياسمين" /><Hero from="#f97316" to="#b91c1c" title="نكهة بيت جدّي" line="مشاوي على الفحم" button="شوف المنيو" /></Browser><Cap>مثال: مطعم</Cap></div>
          </Pair>
          <Cap>هيك ممكن تبلّش صفحتك، والأمثلة عامة للتوضيح</Cap>
        </div>
      );
    case 'step-5':
      return (
        <Pair>
          <div className="rounded-xl border border-neutral-200 bg-white p-2.5 space-y-2 shadow-sm"><p className="text-[11px] font-black text-neutral-500">جملة قصيرة</p><p className="text-xs font-bold">«عيادة أسنان»</p><span className="text-brand font-black">↓</span><Bars n={2} /><p className="text-[10px] font-bold text-neutral-400">نص عام</p></div>
          <div className="rounded-xl border border-brand/30 bg-brand/5 p-2.5 space-y-2 shadow-sm"><p className="text-[11px] font-black text-brand">تفاصيل أكتر</p><p className="text-xs font-bold leading-relaxed">«تقويم وتجميل للأطفال والكبار، مواعيد مسائية»</p><span className="text-brand font-black">↓</span><Bars n={3} tone="bg-brand/30" /><p className="text-[10px] font-bold text-brand">نص قريب من مهنتك</p></div>
        </Pair>
      );
    case 'step-6':
      return (
        <div>
          <Pair>
            <div><Browser><Nav name="وردي وذهبي" /><Hero from="#fbcfe8" to="#d4a24c" title="أناقة هادئة" line="ألوان ناعمة" dark={false} /></Browser><Cap>ستايل ناعم</Cap></div>
            <div><Browser><Nav name="أزرق نظيف" /><Hero from="#1d4ed8" to="#0f172a" title="ثقة ووضوح" line="ألوان جادة" /></Browser><Cap>ستايل جاد</Cap></div>
          </Pair>
          <Cap>مثالان فقط، وتختار بنفسك من القائمة</Cap>
        </div>
      );
    case 'step-7':
      return (
        <Pair>
          <div><Browser><div className="bg-indigo-500 text-white text-[11px] font-black px-3 py-4">قسم</div><Wave shape="straight" /><div className="bg-indigo-50 text-[11px] font-black px-3 py-3 text-indigo-900">قسم تاني</div></Browser><Cap>مستقيم</Cap></div>
          <div><Browser><div className="bg-indigo-500 text-white text-[11px] font-black px-3 py-4">قسم</div><Wave shape="wave" /><div className="bg-indigo-50 text-[11px] font-black px-3 py-3 text-indigo-900">قسم تاني</div></Browser><Cap>موجة</Cap></div>
        </Pair>
      );
    case 'step-8':
      return (
        <Browser label="معرض الصور">
          <div className="p-2.5 space-y-2"><p className="text-xs font-black">معرض أعمالنا</p>
            <div className="grid grid-cols-3 gap-1.5">{['#fde68a,#f59e0b', '#bae6fd,#0ea5e9', '#fbcfe8,#ec4899', '#bbf7d0,#10b981', '#ddd6fe,#7c3aed', '#fecaca,#ef4444'].map((g, i) => <i key={i} className="block aspect-[4/3] rounded-lg" style={{ background: `linear-gradient(135deg, ${g})` }} />)}</div>
          </div>
        </Browser>
      );
    case 'step-9':
      return (
        <div className="space-y-2">
          <Browser label="الشعار بالشريط العلوي"><Nav name={name} logo={topic.logo} hlLogo /><Hero from="#e0e7ff" to="#f5f3ff" title={name} line="شعارك جنب اسمك على الشريط" dark={false} /></Browser>
          <div className="flex justify-center"><Tag>شعارك</Tag></div>
        </div>
      );
    case 'step-10':
      return (
        <Browser label="صورة الواجهة">
          <Nav name={name} logo={topic.logo} />
          <div className="relative h-28" style={{ background: 'linear-gradient(135deg,#334155,#0f172a)' }}>
            <i className="absolute inset-0" style={{ background: 'radial-gradient(circle at 70% 30%, #fbbf24 0, transparent 40%), linear-gradient(200deg, #38bdf8, #1e293b)', opacity: 0.8 }} />
            <p className="absolute bottom-3 right-4 text-white text-base font-black drop-shadow">هيك بتصير واجهتك بصورتك</p>
          </div>
        </Browser>
      );
    case 'section-ticks':
      return (
        <Browser label="أقسام اختيارية">
          <div className="p-3 space-y-2">
            {[['فريق العمل', true], ['حجز المواعيد', true], ['فيديو', false], ['أعمالنا', false]].map(([t, on]) => (
              <div key={String(t)} className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs font-bold ${on ? 'border-brand/40 bg-brand/5 text-brand' : 'border-neutral-200 text-neutral-500'}`}>
                <span className={`w-4 h-4 rounded flex items-center justify-center ${on ? 'bg-brand text-white' : 'border border-neutral-300'}`}>{on && <Check size={11} />}</span>{t}
              </div>
            ))}
          </div>
        </Browser>
      );
    case 'done':
      return <div className="flex items-center justify-center py-6"><span className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center"><Check size={32} /></span></div>;
    default:
      return topic.id.startsWith('section-') ? <SectionPreview sectionId={topic.id.slice(8)} /> : null;
  }
};

export const ExplainPanel: React.FC<{ topic: Topic | null; className?: string }> = ({ topic, className = '' }) => {
  if (!topic) return null;
  return (
    <div className={`flex flex-col gap-4 ${className}`} key={topic.id}>
      <div className="max-h-56 lg:max-h-none overflow-hidden lg:min-h-[40%] flex flex-col justify-center"><Visual topic={topic} /></div>
      <p className="text-sm lg:text-xl font-bold text-ink leading-relaxed">{topic.explain}</p>
      {topic.note && (
        <p className="rounded-xl bg-brand/5 border border-brand/20 text-brand font-bold leading-relaxed px-3.5 py-2.5 text-xs lg:text-sm">تنويه: {topic.note}</p>
      )}
    </div>
  );
};
