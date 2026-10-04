// The car's full page that floats over the showroom when a visitor opens a car: its photos, price,
// main facts, the specification table, features, condition and description, with WhatsApp and
// call buttons that tell the showroom which car the visitor means, and «احجز تجربة قيادة» /
// «اطلب السيارة» forms whose requests land in the showroom's «طلبات الزوار».
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight, ImageOff, Calendar, Gauge, Settings2, Fuel, Phone, MessageCircle, Check, ShieldCheck, KeyRound, ShoppingBag, CheckCircle2 } from 'lucide-react';
import { Car, CarRequestType, CarSettings } from '../carTypes';
import { useCarRequest } from './CarDataContext';
import { carPriceLabel, carSpecRows, carSubtitle, carTitle, formatKm, statusMeta, whatsappHref, accidentsLabel, paintLabel } from '../carModel';
import { formatMoney } from '../../shop/adminUi';

interface CarDetailModalProps {
  car: Car;
  settings: CarSettings;
  accent: string;
  font: string;
  onClose: () => void;
}

const Gallery: React.FC<{ images: string[]; title: string }> = ({ images, title }) => {
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
            <button key={src + k} type="button" onClick={() => setI(k)} className={`w-20 h-14 shrink-0 rounded-lg overflow-hidden border-2 cursor-pointer ${k === i ? '' : 'border-transparent opacity-70 hover:opacity-100'}`} style={k === i ? { borderColor: 'currentColor' } : undefined}>
              <img src={src} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const REQUEST_TEXT: Record<CarRequestType, { title: string; button: string; dateLabel: string }> = {
  testDrive: { title: 'احجز تجربة قيادة', button: 'أرسل طلب التجربة', dateLabel: 'الموعد المناسب لك' },
  buy: { title: 'اطلب السيارة', button: 'أرسل الطلب', dateLabel: 'متى تود زيارة المعرض؟' },
};

const RequestForm: React.FC<{ car: Car; type: CarRequestType; settings: CarSettings; accent: string; onDone: () => void }> = ({ car, type, settings, accent, onDone }) => {
  const submit = useCarRequest();
  const [f, setF] = useState({ name: '', phone: '', preferredDate: '', message: '' });
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const t = REQUEST_TEXT[type];
  const label = `${carTitle(car)}${car.year ? ` ${car.year}` : ''}${car.stockNumber ? ` (رقم ${car.stockNumber})` : ''}`;
  const field = 'w-full h-11 px-3 rounded-xl border border-neutral-200 bg-white text-sm outline-none focus:border-neutral-400';

  const send = () => {
    if (!f.name.trim()) return setError('اكتب اسمك.');
    if (f.phone.replace(/\D/g, '').length < 7) return setError('اكتب رقم هاتف صحيحًا.');
    setError('');
    const r = { type, carId: car.id, carLabel: label, name: f.name.trim(), phone: f.phone.trim(), preferredDate: f.preferredDate, message: f.message.trim() };
    submit?.(r);
    if (settings.whatsappNumber) {
      const text = [
        `مرحبًا، ${type === 'testDrive' ? 'أود حجز تجربة قيادة' : 'أود طلب'} السيارة ${label}`,
        `الاسم: ${r.name}`,
        `الهاتف: ${r.phone}`,
        r.preferredDate ? `الموعد: ${r.preferredDate}` : '',
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
        <p className="text-xs text-neutral-500">سيتواصل معك المعرض على الرقم الذي كتبته.</p>
        <button type="button" onClick={onDone} className="text-xs font-bold underline cursor-pointer">إغلاق</button>
      </div>
    );
  }
  return (
    <div className="rounded-2xl border border-neutral-100 bg-neutral-50 p-4 space-y-2.5" role="form" aria-label={t.title}>
      <div className="flex items-center justify-between">
        <h3 className="text-base font-black">{t.title}</h3>
        <button type="button" onClick={onDone} aria-label="إغلاق النموذج" className="w-7 h-7 rounded-full hover:bg-white flex items-center justify-center text-neutral-500 cursor-pointer"><X size={15} /></button>
      </div>
      <div className="grid sm:grid-cols-2 gap-2">
        <input className={field} placeholder="الاسم" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        <input className={field} placeholder="رقم الهاتف" dir="ltr" inputMode="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
        <label className="sm:col-span-2 text-[11px] font-bold text-neutral-500 space-y-1 block">
          <span>{t.dateLabel}</span>
          <input type={type === 'testDrive' ? 'datetime-local' : 'date'} className={field} value={f.preferredDate} onChange={(e) => setF({ ...f, preferredDate: e.target.value })} />
        </label>
        <textarea className={`${field} sm:col-span-2 h-20 py-2 resize-none`} placeholder="ملاحظة (اختياري)" value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} />
      </div>
      {error && <div className="text-xs font-bold text-red-600">{error}</div>}
      <button type="button" onClick={send} className="w-full h-11 rounded-full text-white text-sm font-bold cursor-pointer" style={{ backgroundColor: accent }}>{t.button}</button>
    </div>
  );
};

export const CarDetailModal: React.FC<CarDetailModalProps> = ({ car, settings, accent, font, onClose }) => {
  const [asking, setAsking] = useState<CarRequestType | null>(null);
  const canAsk = settings.acceptRequests && car.status !== 'sold';
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const title = carTitle(car);
  const ask = `مرحبًا، أستفسر عن السيارة ${title}${car.year ? ` ${car.year}` : ''}${car.stockNumber ? ` (رقم ${car.stockNumber})` : ''}`;
  const status = statusMeta(car.status);
  const facts: { icon: React.ElementType; label: string; value: string }[] = [
    { icon: Calendar, label: 'سنة الصنع', value: car.year ? String(car.year) : '' },
    { icon: Gauge, label: 'الممشى', value: car.condition === 'new' ? 'جديدة' : formatKm(car.mileage) },
    { icon: Settings2, label: 'ناقل الحركة', value: car.transmission },
    { icon: Fuel, label: 'الوقود', value: car.fuel },
  ].filter((f) => f.value);
  const specs = carSpecRows(car);

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
          <div style={{ color: accent }}>
            <Gallery images={car.images} title={title} />
          </div>

          <div className="flex flex-col gap-4 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 h-6 rounded-full text-[11px] font-bold text-white flex items-center" style={{ backgroundColor: status.color }}>{status.label}</span>
              {car.badge && <span className="px-2.5 h-6 rounded-full text-[11px] font-bold text-white flex items-center" style={{ backgroundColor: accent }}>{car.badge}</span>}
              {car.stockNumber && <span className="text-[11px] text-neutral-400 font-bold">رقم {car.stockNumber}</span>}
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black leading-tight">{title}</h2>
              {carSubtitle(car) && <p className="text-sm text-neutral-500 mt-1">{carSubtitle(car)}</p>}
            </div>

            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="text-3xl font-black" style={{ color: accent }}>{carPriceLabel(car)}</span>
              {car.showPrice && car.oldPrice > car.price && car.price > 0 && <span className="text-base text-neutral-400 line-through">{formatMoney(car.oldPrice, car.currency)}</span>}
              {car.negotiable && car.showPrice && car.price > 0 && <span className="text-xs font-bold text-neutral-500">قابل للتفاوض</span>}
            </div>

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

            {car.condition === 'used' && (
              <div className="flex flex-wrap gap-2 text-xs font-bold">
                <span className="flex items-center gap-1 px-2.5 h-7 rounded-full bg-neutral-100"><ShieldCheck size={13} /> {accidentsLabel(car.accidents)}</span>
                <span className="flex items-center gap-1 px-2.5 h-7 rounded-full bg-neutral-100">{paintLabel(car.paint)}</span>
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-2 mt-auto">
              {settings.whatsappNumber && (
                <a href={whatsappHref(settings.whatsappNumber, ask)} target="_blank" rel="noopener noreferrer" className="h-12 rounded-full bg-[#25d366] text-white text-sm font-bold flex items-center justify-center gap-2">
                  <MessageCircle size={18} /> استفسر عبر واتساب
                </a>
              )}
              {settings.phone && (
                <a href={`tel:${settings.phone.replace(/[^\d+]/g, '')}`} className="h-12 rounded-full text-white text-sm font-bold flex items-center justify-center gap-2" style={{ backgroundColor: accent }}>
                  <Phone size={18} /> اتصل بنا
                </a>
              )}
              {!settings.whatsappNumber && !settings.phone && (
                <p className="sm:col-span-2 text-xs text-neutral-400">أضف رقم واتساب أو هاتف المعرض من إعدادات المعرض لتظهر أزرار التواصل هنا.</p>
              )}
              {canAsk && !asking && (
                <>
                  <button type="button" onClick={() => setAsking('testDrive')} className="h-12 rounded-full border-2 text-sm font-bold flex items-center justify-center gap-2 cursor-pointer" style={{ borderColor: accent, color: accent }}>
                    <KeyRound size={18} /> احجز تجربة قيادة
                  </button>
                  <button type="button" onClick={() => setAsking('buy')} className="h-12 rounded-full border-2 text-sm font-bold flex items-center justify-center gap-2 cursor-pointer" style={{ borderColor: accent, color: accent }}>
                    <ShoppingBag size={18} /> اطلب السيارة
                  </button>
                </>
              )}
            </div>
            {canAsk && asking && <RequestForm key={asking} car={car} type={asking} settings={settings} accent={accent} onDone={() => setAsking(null)} />}
          </div>
        </div>

        <div className="grid lg:grid-cols-[1.35fr_1fr] gap-6 px-4 sm:px-6 pb-6">
          <div className="space-y-5">
            {car.description && (
              <section className="space-y-2">
                <h3 className="text-lg font-black">عن السيارة</h3>
                <p className="text-sm leading-loose text-neutral-600 whitespace-pre-line">{car.description}</p>
              </section>
            )}
            {car.features.length > 0 && (
              <section className="space-y-2">
                <h3 className="text-lg font-black">التجهيزات</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {car.features.map((f) => (
                    <span key={f} className="flex items-center gap-1.5 text-sm text-neutral-700"><Check size={15} style={{ color: accent }} className="shrink-0" />{f}</span>
                  ))}
                </div>
              </section>
            )}
            {car.conditionNotes && (
              <section className="space-y-2">
                <h3 className="text-lg font-black">حالة السيارة</h3>
                <p className="text-sm leading-loose text-neutral-600 whitespace-pre-line">{car.conditionNotes}</p>
              </section>
            )}
          </div>
          <section className="space-y-2">
            <h3 className="text-lg font-black">المواصفات</h3>
            <div className="rounded-2xl border border-neutral-100 overflow-hidden">
              {specs.map((r, k) => (
                <div key={r.label} className={`flex items-center justify-between gap-3 px-4 h-10 text-sm ${k % 2 ? 'bg-white' : 'bg-neutral-50'}`}>
                  <span className="text-neutral-500">{r.label}</span>
                  <span className="font-bold text-left">{r.value}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>,
    document.body
  );
};
