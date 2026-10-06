// A project's full page that floats over the site when a visitor opens a project: photos, status,
// the funding bar, the main numbers, the details and why invest, WhatsApp and call buttons that
// name the project, and the «أرغب بالاستثمار» form whose requests land in «طلبات الاستثمار».
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight, ImageOff, MapPin, Coins, TrendingUp, Clock, CalendarDays, Phone, MessageCircle, Check, HandCoins, CheckCircle2, Info } from 'lucide-react';
import { InvestProject, InvestSettings, investStatusMeta, whatsappHref } from '../investTypes';
import { useInvestRequest } from './InvestDataContext';
import { FundingBar } from './ProjectCard';
import { formatMoney, formatDate } from '../../shop/adminUi';

interface ProjectDetailModalProps {
  project: InvestProject;
  raised: number;
  settings: InvestSettings;
  accent: string;
  font: string;
  onClose: () => void;
}

const Gallery: React.FC<{ images: string[]; title: string; accent: string }> = ({ images, title, accent }) => {
  const [i, setI] = useState(0);
  if (!images.length) {
    return <div className="aspect-[16/10] rounded-2xl bg-neutral-100 flex items-center justify-center text-neutral-300"><ImageOff size={44} /></div>;
  }
  const go = (d: number) => setI((n) => (n + d + images.length) % images.length);
  return (
    <div className="space-y-2">
      <div className="relative aspect-[16/10] rounded-2xl overflow-hidden bg-neutral-100">
        <img src={images[i]} alt={title} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
        {images.length > 1 && (
          <>
            <button type="button" onClick={() => go(1)} aria-label="الصورة التالية" className="absolute top-1/2 -translate-y-1/2 left-3 w-10 h-10 rounded-full bg-white/90 shadow flex items-center justify-center cursor-pointer"><ChevronLeft size={20} /></button>
            <button type="button" onClick={() => go(-1)} aria-label="الصورة السابقة" className="absolute top-1/2 -translate-y-1/2 right-3 w-10 h-10 rounded-full bg-white/90 shadow flex items-center justify-center cursor-pointer"><ChevronRight size={20} /></button>
            <span className="absolute bottom-3 left-3 px-2.5 h-6 rounded-full bg-black/60 text-white text-xs font-bold flex items-center" dir="ltr">{i + 1} / {images.length}</span>
          </>
        )}
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((src, k) => (
            <button key={src + k} type="button" onClick={() => setI(k)} className={`w-20 h-14 shrink-0 rounded-lg overflow-hidden border-2 cursor-pointer ${k === i ? '' : 'border-transparent opacity-70 hover:opacity-100'}`} style={k === i ? { borderColor: accent } : undefined}>
              <img src={src} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const RequestForm: React.FC<{ project: InvestProject; settings: InvestSettings; accent: string; onDone: () => void }> = ({ project, settings, accent, onDone }) => {
  const submit = useInvestRequest();
  const [f, setF] = useState({ name: '', phone: '', amount: '', message: '' });
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const field = 'w-full h-11 px-3 rounded-xl border border-neutral-200 bg-white text-sm outline-none focus:border-neutral-400';

  const send = () => {
    const amount = parseFloat(f.amount.replace(/,/g, '')) || 0;
    if (!f.name.trim()) return setError('اكتب اسمك.');
    if (f.phone.replace(/\D/g, '').length < 7) return setError('اكتب رقم هاتف صحيحًا.');
    if (project.minInvestment > 0 && amount > 0 && amount < project.minInvestment) return setError(`أقل مشاركة في هذا المشروع ${formatMoney(project.minInvestment, project.currency)}.`);
    setError('');
    const r = { projectId: project.id, projectTitle: project.title, name: f.name.trim(), phone: f.phone.trim(), amount, message: f.message.trim() };
    submit?.(r);
    if (settings.whatsappNumber) {
      const text = [
        `مرحبًا، أرغب بالاستثمار في مشروع «${project.title}»`,
        `الاسم: ${r.name}`,
        `الهاتف: ${r.phone}`,
        amount > 0 ? `المبلغ: ${formatMoney(amount, project.currency)}` : '',
        r.message,
      ].filter(Boolean).join('\n');
      window.open(whatsappHref(settings.whatsappNumber, text), '_blank', 'noopener,noreferrer');
    }
    setSent(true);
  };

  if (sent) {
    return (
      <div className="rounded-2xl border border-neutral-100 bg-neutral-50 p-4 text-center space-y-2">
        <CheckCircle2 size={30} style={{ color: accent }} className="mx-auto" />
        <div className="text-sm font-black">وصل طلبك، شكرًا لك</div>
        <p className="text-xs text-neutral-500">سنتواصل معك على الرقم الذي كتبته لنشرح لك تفاصيل المشاركة.</p>
        <button type="button" onClick={onDone} className="text-xs font-bold underline cursor-pointer">إغلاق</button>
      </div>
    );
  }
  return (
    <div className="rounded-2xl border border-neutral-100 bg-neutral-50 p-4 space-y-2.5" role="form" aria-label="أرغب بالاستثمار">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-black">أرغب بالاستثمار</h3>
        <button type="button" onClick={onDone} aria-label="إغلاق النموذج" className="w-7 h-7 rounded-full hover:bg-white flex items-center justify-center text-neutral-500 cursor-pointer"><X size={15} /></button>
      </div>
      <div className="grid sm:grid-cols-2 gap-2">
        <input className={field} placeholder="الاسم" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        <input className={field} placeholder="رقم الهاتف" dir="ltr" inputMode="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
        <label className="sm:col-span-2 text-[11px] font-bold text-neutral-500 space-y-1 block">
          <span>المبلغ الذي تفكر به ({project.currency}){project.minInvestment > 0 ? ` · أقل مشاركة ${formatMoney(project.minInvestment, project.currency)}` : ''}</span>
          <input className={field} dir="ltr" inputMode="decimal" placeholder="اختياري" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} />
        </label>
        <textarea className={`${field} sm:col-span-2 h-20 py-2 resize-none`} placeholder="سؤال أو ملاحظة (اختياري)" value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} />
      </div>
      {error && <div className="text-xs font-bold text-red-600">{error}</div>}
      <button type="button" onClick={send} className="w-full h-11 rounded-full text-white text-sm font-bold cursor-pointer" style={{ backgroundColor: accent }}>أرسل الطلب</button>
    </div>
  );
};

export const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({ project: p, raised, settings, accent, font, onClose }) => {
  const [asking, setAsking] = useState(false);
  const canAsk = settings.acceptRequests && p.status === 'open';
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const status = investStatusMeta(p.status);
  const ask = `مرحبًا، أستفسر عن مشروع «${p.title}»`;
  const facts: { icon: React.ElementType; label: string; value: string }[] = [
    { icon: Coins, label: 'أقل مشاركة', value: p.minInvestment > 0 ? formatMoney(p.minInvestment, p.currency) : '' },
    { icon: TrendingUp, label: 'العائد المتوقع', value: p.expectedReturn },
    { icon: Clock, label: 'مدة المشروع', value: p.duration },
    { icon: CalendarDays, label: 'تاريخ البدء', value: p.startDate ? formatDate(p.startDate) : '' },
  ].filter((f) => f.value);

  return createPortal(
    <div className="fixed inset-0 z-[2000000] bg-black/55 flex items-center justify-center p-3 sm:p-6" onMouseDown={onClose}>
      <div
        dir="rtl"
        className="relative w-full max-w-5xl max-h-full overflow-y-auto bg-white rounded-3xl shadow-[0_30px_80px_rgba(0,0,0,0.35)] text-right text-[#1d1d1f]"
        style={{ fontFamily: font }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button type="button" onClick={onClose} className="absolute top-3 left-3 z-10 w-9 h-9 rounded-full bg-white/90 shadow text-neutral-600 hover:text-black flex items-center justify-center cursor-pointer" aria-label="إغلاق">
          <X size={18} />
        </button>

        <div className="grid lg:grid-cols-[1.35fr_1fr] gap-6 p-4 sm:p-6">
          <Gallery images={p.images} title={p.title} accent={accent} />

          <div className="flex flex-col gap-4 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 h-6 rounded-full text-[11px] font-bold text-white flex items-center" style={{ backgroundColor: status.color }}>{status.label}</span>
              {p.sector && <span className="px-2.5 h-6 rounded-full text-[11px] font-bold bg-neutral-100 flex items-center">{p.sector}</span>}
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black leading-tight">{p.title}</h2>
              {p.location && <p className="text-sm text-neutral-500 mt-1 flex items-center gap-1"><MapPin size={14} />{p.location}</p>}
            </div>

            {p.target > 0 && (
              <div className="rounded-2xl bg-neutral-50 border border-neutral-100 p-3">
                <FundingBar raised={raised} target={p.target} currency={p.currency} accent={accent} />
              </div>
            )}

            {facts.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {facts.map((f) => (
                  <div key={f.label} className="rounded-2xl bg-neutral-50 border border-neutral-100 p-3 flex items-center gap-2.5">
                    <f.icon size={18} style={{ color: accent }} className="shrink-0" />
                    <div className="min-w-0">
                      <div className="text-[10px] text-neutral-400 font-bold">{f.label}</div>
                      <div className="text-sm font-bold truncate">{f.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-2 mt-auto">
              {settings.whatsappNumber && (
                <a href={whatsappHref(settings.whatsappNumber, ask)} target="_blank" rel="noopener noreferrer" className="h-12 rounded-full bg-[#25d366] text-white text-sm font-bold flex items-center justify-center gap-2">
                  <MessageCircle size={18} /> استفسر عبر واتساب
                </a>
              )}
              {settings.phone && (
                <a href={`tel:${settings.phone.replace(/[^\d+]/g, '')}`} className="h-12 rounded-full border-2 text-sm font-bold flex items-center justify-center gap-2" style={{ borderColor: accent, color: accent }}>
                  <Phone size={18} /> اتصل بنا
                </a>
              )}
              {canAsk && !asking && (
                <button type="button" onClick={() => setAsking(true)} className="sm:col-span-2 h-12 rounded-full text-white text-sm font-bold flex items-center justify-center gap-2 cursor-pointer" style={{ backgroundColor: accent }}>
                  <HandCoins size={18} /> أرغب بالاستثمار
                </button>
              )}
              {!settings.whatsappNumber && !settings.phone && !canAsk && (
                <p className="sm:col-span-2 text-xs text-neutral-400">أضف رقم واتساب أو هاتف الشركة من إعدادات الشركة لتظهر أزرار التواصل هنا.</p>
              )}
            </div>
            {canAsk && asking && <RequestForm project={p} settings={settings} accent={accent} onDone={() => setAsking(false)} />}
          </div>
        </div>

        <div className="grid lg:grid-cols-[1.35fr_1fr] gap-6 px-4 sm:px-6 pb-6">
          <div className="space-y-5">
            {(p.description || p.summary) && (
              <section className="space-y-2">
                <h3 className="text-lg font-black">عن المشروع</h3>
                <p className="text-sm leading-loose text-neutral-600 whitespace-pre-line">{p.description || p.summary}</p>
              </section>
            )}
            {settings.disclaimer && (
              <p className="flex gap-2 text-[11px] leading-relaxed text-neutral-400 border-t border-neutral-100 pt-3"><Info size={14} className="shrink-0 mt-0.5" />{settings.disclaimer}</p>
            )}
          </div>
          {p.highlights.length > 0 && (
            <section className="space-y-2">
              <h3 className="text-lg font-black">لماذا هذا المشروع؟</h3>
              <div className="space-y-2">
                {p.highlights.map((h) => (
                  <div key={h} className="flex items-start gap-2 text-sm text-neutral-700"><Check size={16} style={{ color: accent }} className="shrink-0 mt-0.5" />{h}</div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
