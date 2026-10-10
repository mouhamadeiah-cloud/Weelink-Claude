// «نشر»: the floating window where the customer names their page, sees its address
// (name.testweelink.de) while typing with a check that the name is free, publishes, and gets the
// link with a QR code to share. Below, two wide buttons fold out: connecting a domain the customer
// bought themselves, and buying a domain through Weelink (a request handled by the office for now).
// Before publishing, the customer sees the page in a computer and a phone (and full size), can
// arrange it for phones there, and writes its title, description and keywords for search.
import React, { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import {
  CheckCircle2, ChevronDown, Copy, Download, ExternalLink, Globe, ImagePlus, Link2, Loader2, Maximize2, Monitor, RefreshCw, Search, Share2, ShoppingCart, Smartphone, Trash2, Wand2, X, XCircle,
} from 'lucide-react';
import type { CanvasElement, Page } from '../../types';
import type { ProjectType } from '../shop/shopTypes';
import {
  CustomDomainState, DomainContact, NameState, PublishedSite, SEO_LIMITS, SITE_DOMAIN, SiteSeo, checkDomain, checkSiteName, connectDomain,
  contentHash, domainPrice, isValidDomain, letterIcon, makeSiteIcon, normalizeDomain, normalizeKeywords, normalizeSiteName, publishSite,
  readMySite, removeDomain, requestDomainPurchase, setSiteIcon, setSiteSeo, siteFallbackUrl, siteNameProblem, siteUrl, unpublishSite,
} from '../../services/sites';
import { withLocalGraphics } from '../../utils/localGraphics';
import { SiteView } from './SiteView';

interface PublishModalProps {
  open: boolean;
  onClose: () => void;
  owner: string;
  project: ProjectType;
  pages: Page[];
  elements: CanvasElement[];
  data: any; // the project's public data (see publicData.ts)
  suggestedName: string;
  onPublishedChange: (name: string | null) => void;
  onArrangeForMobile?: () => void; // the editor's «تنسيق الموبايل»
}

const input = 'w-full h-11 px-3.5 rounded-xl border border-neutral-200 bg-white text-sm text-[#1d1d1f] outline-none focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/15 transition';
const label = 'block text-[11px] font-bold text-neutral-500 mb-1';

const domainErrorText = (e: string) =>
  e === 'not_configured'
    ? 'ربط الدومينات سيتفعّل قريباً. احفظ بياناتك، وسنفعّل الربط من عندنا.'
    : e === 'bad_domain' ? 'اكتب الدومين بشكل صحيح، مثل alnour.com.'
    : e === 'domain_taken' ? 'هذا الدومين مربوط بصفحة أخرى على Weelink.'
    : e === 'not_published' ? 'انشر صفحتك أولاً ثم اربط الدومين.'
    : e === 'vercel_refused' ? 'رُفض الدومين. تأكد أنه صحيح وأنه ليس مستعملاً في موقع آخر.'
    : e === 'forbidden' ? 'فقط صاحب الصفحة يستطيع ربط دومين.'
    : 'تعذر الاتصال. حاول مرة أخرى.';

// A wide button that folds its fields out below it.
const Fold: React.FC<{ icon: React.ElementType; title: string; hint: string; open: boolean; onToggle: () => void; children: React.ReactNode }> = ({ icon: Icon, title, hint, open, onToggle, children }) => (
  <div className={`rounded-2xl border transition ${open ? 'border-[#0071e3]/40 bg-[#0071e3]/[0.03]' : 'border-neutral-200 bg-white'}`}>
    <button type="button" onClick={onToggle} className="w-full flex items-center gap-3 p-4 text-right cursor-pointer" aria-expanded={open}>
      <span className="w-10 h-10 rounded-xl bg-[#0071e3]/10 text-[#0071e3] flex items-center justify-center shrink-0"><Icon size={19} /></span>
      <span className="flex-1 min-w-0">
        <span className="block text-sm font-black text-[#1d1d1f]">{title}</span>
        <span className="block text-[11px] text-neutral-500">{hint}</span>
      </span>
      <ChevronDown size={18} className={`text-neutral-400 transition ${open ? 'rotate-180' : ''}`} />
    </button>
    {open && <div className="px-4 pb-4 space-y-3">{children}</div>}
  </div>
);

const CopyButton: React.FC<{ text: string; label?: string }> = ({ text, label: l }) => {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard?.writeText(text).then(() => {
          setDone(true);
          window.setTimeout(() => setDone(false), 1500);
        });
      }}
      className="h-9 px-3 rounded-xl border border-neutral-200 bg-white text-xs font-bold text-neutral-700 inline-flex items-center gap-1.5 cursor-pointer hover:bg-neutral-50"
    >
      {done ? <CheckCircle2 size={14} className="text-[#34c759]" /> : <Copy size={14} />}
      {done ? 'نُسخ' : l || 'نسخ'}
    </button>
  );
};

// ---------- The customer's own domain ----------

const ConnectDomain: React.FC<{ owner: string; project: ProjectType; site: PublishedSite | null; onChange: (d: CustomDomainState | null) => void }> = ({ owner, project, site, onChange }) => {
  const current = site?.customDomain || null;
  const [domain, setDomain] = useState(current?.name || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError('');
    await fn();
    setBusy(false);
  };
  const connect = () => {
    const d = normalizeDomain(domain);
    setDomain(d);
    if (!isValidDomain(d)) return setError(domainErrorText('bad_domain'));
    run(async () => {
      const r = await connectDomain(owner, project, d);
      if ('error' in r) setError(domainErrorText(r.error));
      else onChange(r.domain);
    });
  };
  const check = () => run(async () => {
    const r = await checkDomain(owner, project);
    if ('error' in r) setError(domainErrorText(r.error));
    else onChange(r.domain);
  });
  const remove = () => run(async () => {
    const r = await removeDomain(owner, project);
    if ('error' in r) setError(domainErrorText(r.error));
    else {
      onChange(null);
      setDomain('');
    }
  });

  return (
    <>
      <div>
        <span className={label}>الدومين الذي اشتريته</span>
        <div className="flex gap-2">
          <input className={input} dir="ltr" placeholder="alnour.com" value={domain} onChange={(e) => setDomain(e.target.value)} disabled={!!current} />
          {!current && (
            <button type="button" onClick={connect} disabled={busy || !site} className="h-11 px-4 shrink-0 rounded-xl bg-[#0071e3] text-white text-sm font-bold cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5">
              {busy && <Loader2 size={15} className="animate-spin" />} ربط
            </button>
          )}
        </div>
        {!site && <p className="text-[11px] text-neutral-500 mt-1">انشر صفحتك أولاً، ثم اربط الدومين.</p>}
      </div>

      {current && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold">
            {current.status === 'active' ? (
              <><CheckCircle2 size={18} className="text-[#34c759]" /> الدومين يعمل: <a href={`https://${current.name}`} target="_blank" rel="noreferrer" dir="ltr" className="text-[#0071e3]">{current.name}</a></>
            ) : (
              <><Loader2 size={16} className="animate-spin text-[#f29900]" /> بانتظار إعداد السجلات عند شركة الدومين</>
            )}
          </div>
          {current.status !== 'active' && (
            <>
              <p className="text-xs text-neutral-600 leading-relaxed">
                ادخل إلى حسابك في الشركة التي اشتريت منها الدومين (GoDaddy، Namecheap...)، وافتح إعدادات DNS، وأضف هذه السجلات كما هي:
              </p>
              <div className="rounded-xl border border-neutral-200 bg-white divide-y divide-neutral-100 text-xs" dir="ltr">
                <div className="grid grid-cols-[70px_1fr_1.6fr_auto] gap-2 px-3 py-2 font-bold text-neutral-500"><span>Type</span><span>Name</span><span>Value</span><span /></div>
                {(current.records || []).map((r, i) => (
                  <div key={i} className="grid grid-cols-[70px_1fr_1.6fr_auto] gap-2 items-center px-3 py-2 font-mono">
                    <span className="font-bold">{r.type}</span>
                    <span className="truncate">{r.name}</span>
                    <span className="truncate">{r.value}</span>
                    <CopyButton text={r.value} label=" " />
                  </div>
                ))}
              </div>
              {current.message && <p className="text-[11px] text-neutral-500">{current.message}</p>}
            </>
          )}
          <div className="flex flex-wrap gap-2">
            {current.status !== 'active' && (
              <button type="button" onClick={check} disabled={busy} className="h-9 px-3 rounded-xl bg-[#0071e3] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50">
                {busy ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />} فحص الربط
              </button>
            )}
            <button type="button" onClick={remove} disabled={busy} className="h-9 px-3 rounded-xl border border-neutral-200 bg-white text-xs font-bold text-neutral-600 inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50">
              <Trash2 size={14} /> إزالة الدومين
            </button>
          </div>
        </div>
      )}
      {error && <p className="text-xs font-bold text-[#c2410c]">{error}</p>}
    </>
  );
};

// ---------- Buying a domain through Weelink ----------

const COUNTRIES: [string, string][] = [
  ['SY', 'سوريا'], ['LB', 'لبنان'], ['JO', 'الأردن'], ['IQ', 'العراق'], ['TR', 'تركيا'], ['SA', 'السعودية'], ['AE', 'الإمارات'],
  ['EG', 'مصر'], ['DE', 'ألمانيا'], ['NL', 'هولندا'], ['SE', 'السويد'], ['AT', 'النمسا'], ['FR', 'فرنسا'], ['GB', 'بريطانيا'], ['US', 'أمريكا'],
];

const BuyDomain: React.FC<{ owner: string; project: ProjectType; suggested: string }> = ({ owner, project, suggested }) => {
  const [domain, setDomain] = useState(suggested ? `${suggested}.com` : '');
  const [years, setYears] = useState(1);
  const [quote, setQuote] = useState<{ available: boolean; price: number | null } | null>(null);
  const [contact, setContact] = useState<DomainContact>({ firstName: '', lastName: '', email: '', phone: '', address: '', city: '', zip: '', country: 'SY' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const [sentId, setSentId] = useState('');
  const set = (k: keyof DomainContact) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setContact({ ...contact, [k]: e.target.value });

  const check = async () => {
    const d = normalizeDomain(domain);
    setDomain(d);
    setQuote(null);
    setNote('');
    if (!isValidDomain(d)) return setError(domainErrorText('bad_domain'));
    setError('');
    setBusy(true);
    const r = await domainPrice(d);
    setBusy(false);
    if ('error' in r) setNote(r.error === 'not_configured' ? 'فحص الأسعار سيتفعّل قريباً. يمكنك إرسال الطلب الآن وسنؤكد لك السعر.' : domainErrorText(r.error));
    else setQuote({ available: r.available, price: r.price });
  };

  const send = async () => {
    const d = normalizeDomain(domain);
    if (!isValidDomain(d)) return setError(domainErrorText('bad_domain'));
    if (quote && !quote.available) return setError('هذا الدومين غير متاح. جرّب اسماً آخر.');
    const missing = (['firstName', 'lastName', 'email', 'phone', 'address', 'city', 'country'] as const).some((k) => !contact[k].trim());
    if (missing) return setError('شركات الدومين تطلب بيانات صاحب الدومين كاملة. أكمل الحقول المعلّمة بنجمة.');
    if (!/^\S+@\S+\.\S+$/.test(contact.email.trim())) return setError('اكتب بريداً إلكترونياً صحيحاً.');
    setError('');
    setBusy(true);
    try {
      const id = await requestDomainPurchase(owner, project, d, years, contact, quote?.price ?? null);
      setSentId(id);
    } catch {
      setError('تعذر إرسال الطلب. حاول مرة أخرى.');
    }
    setBusy(false);
  };

  if (sentId) {
    return (
      <div className="p-4 rounded-xl bg-[#34c759]/10 text-sm text-[#1d6b34] font-bold leading-relaxed flex gap-2">
        <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
        <span>وصل طلب شراء <span dir="ltr">{domain}</span>. سنتواصل معك لإتمام الدفع عن طريق المكتب، ثم نربطه بصفحتك تلقائياً.</span>
      </div>
    );
  }

  return (
    <>
      <div>
        <span className={label}>الدومين الذي تريده *</span>
        <div className="flex gap-2">
          <input className={input} dir="ltr" placeholder="alnour.com" value={domain} onChange={(e) => { setDomain(e.target.value); setQuote(null); }} />
          <button type="button" onClick={check} disabled={busy} className="h-11 px-4 shrink-0 rounded-xl border border-neutral-200 bg-white text-sm font-bold cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5">
            {busy && <Loader2 size={15} className="animate-spin" />} فحص
          </button>
        </div>
        {quote && (
          <p className={`text-xs font-bold mt-1.5 ${quote.available ? 'text-[#1d6b34]' : 'text-[#c2410c]'}`}>
            {quote.available ? `متاح${quote.price !== null ? ` · ${quote.price}$ للسنة` : ''}` : 'غير متاح، جرّب اسماً آخر.'}
          </p>
        )}
        {note && <p className="text-[11px] text-neutral-500 mt-1.5">{note}</p>}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <span className={label}>مدة التسجيل</span>
          <select className={input} value={years} onChange={(e) => setYears(Number(e.target.value))}>
            {[1, 2, 3, 5].map((y) => <option key={y} value={y}>{y === 1 ? 'سنة' : y === 2 ? 'سنتان' : `${y} سنوات`}</option>)}
          </select>
        </div>
        <div>
          <span className={label}>الدولة *</span>
          <select className={input} value={contact.country} onChange={set('country')}>
            {COUNTRIES.map(([c, n]) => <option key={c} value={c}>{n}</option>)}
          </select>
        </div>
        <div><span className={label}>الاسم الأول *</span><input className={input} autoComplete="given-name" value={contact.firstName} onChange={set('firstName')} /></div>
        <div><span className={label}>اسم العائلة *</span><input className={input} autoComplete="family-name" value={contact.lastName} onChange={set('lastName')} /></div>
        <div><span className={label}>البريد الإلكتروني *</span><input className={input} type="email" dir="ltr" autoComplete="email" value={contact.email} onChange={set('email')} /></div>
        <div><span className={label}>الهاتف *</span><input className={input} type="tel" dir="ltr" autoComplete="tel" placeholder="+963..." value={contact.phone} onChange={set('phone')} /></div>
        <div className="col-span-2"><span className={label}>العنوان *</span><input className={input} autoComplete="street-address" value={contact.address} onChange={set('address')} /></div>
        <div><span className={label}>المدينة *</span><input className={input} autoComplete="address-level2" value={contact.city} onChange={set('city')} /></div>
        <div><span className={label}>الرمز البريدي</span><input className={input} dir="ltr" autoComplete="postal-code" value={contact.zip} onChange={set('zip')} /></div>
      </div>
      <p className="text-[11px] text-neutral-500 leading-relaxed">تُسجَّل هذه البيانات عند شركة الدومين كصاحب الدومين. الدفع عن طريق المكتب، ونشتري الدومين ونربطه بصفحتك.</p>
      {error && <p className="text-xs font-bold text-[#c2410c]">{error}</p>}
      <button type="button" onClick={send} disabled={busy} className="w-full h-11 rounded-xl bg-[#1d1d1f] text-white text-sm font-black cursor-pointer disabled:opacity-50 inline-flex items-center justify-center gap-2">
        {busy && <Loader2 size={15} className="animate-spin" />} اطلب شراء الدومين
      </button>
    </>
  );
};

// ---------- The browser icon ----------

// How the page looks on a browser tab, with the customer's logo (or the name's first letter).
const IconPicker: React.FC<{ icon: string; title: string; name: string; onChange: (icon: string) => void }> = ({ icon, title, name, onChange }) => {
  const [error, setError] = useState('');
  const shown = icon || letterIcon(title || name);
  const pick = async (file?: File) => {
    if (!file) return;
    setError('');
    try {
      onChange(await makeSiteIcon(file));
    } catch {
      setError('تعذر فتح الصورة. جرّب صورة PNG أو JPG.');
    }
  };
  return (
    <div>
      <span className={label}>أيقونة الصفحة في المتصفح</span>
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0 flex items-center gap-2 h-10 px-3 rounded-t-xl bg-neutral-100 border border-b-0 border-neutral-200 max-w-[260px]" title="هكذا يظهر تبويب صفحتك">
          {shown && <img src={shown} alt="" className="w-4 h-4 rounded-sm shrink-0" />}
          <span className="text-xs font-bold text-neutral-700 truncate">{title || name || 'صفحتي'}</span>
          <X size={12} className="text-neutral-400 shrink-0 mr-auto" />
        </div>
        <label className="h-9 px-3 rounded-xl border border-neutral-200 bg-white text-xs font-bold text-neutral-700 inline-flex items-center gap-1.5 cursor-pointer hover:bg-neutral-50 shrink-0">
          <ImagePlus size={14} /> {icon ? 'تغيير اللوغو' : 'رفع لوغو'}
          <input type="file" accept="image/*" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
        </label>
        {icon && (
          <button type="button" onClick={() => onChange('')} className="w-9 h-9 rounded-xl text-neutral-400 hover:text-[#c2410c] flex items-center justify-center cursor-pointer" aria-label="إزالة اللوغو">
            <Trash2 size={15} />
          </button>
        )}
      </div>
      <p className="text-[11px] text-neutral-500 mt-1">تظهر أيضاً عندما يضيف الزائر صفحتك إلى شاشة هاتفه. صورة مربعة أفضل.</p>
      {error && <p className="text-xs font-bold text-[#c2410c] mt-1">{error}</p>}
    </div>
  );
};

// ---------- How the page looks ----------

type Device = 'desktop' | 'mobile';
const SIZES: Record<Device, [number, number]> = { desktop: [1280, 800], mobile: [390, 844] };

const ComputerFrame: React.FC<{ children: React.ReactNode; label: React.ReactNode }> = ({ children, label: l }) => (
  <div className="flex flex-col items-center gap-1.5">
    <div className="rounded-xl border-[6px] border-[#1d1d1f] overflow-hidden shadow-md bg-white">{children}</div>
    <div className="w-14 h-2 rounded-b-lg bg-[#1d1d1f]" />
    {l}
  </div>
);
const PhoneFrame: React.FC<{ children: React.ReactNode; label: React.ReactNode }> = ({ children, label: l }) => (
  <div className="flex flex-col items-center gap-1.5">
    <div className="rounded-[18px] border-[5px] border-[#1d1d1f] overflow-hidden shadow-md bg-white">{children}</div>
    {l}
  </div>
);
const deviceLabel = (d: Device) => (
  <span className="text-[11px] font-bold text-neutral-500 inline-flex items-center gap-1">
    {d === 'desktop' ? <><Monitor size={12} /> كمبيوتر</> : <><Smartphone size={12} /> موبايل</>}
  </span>
);

// A box of the device's real size, scaled down. Position: fixed parts of the page stay inside it
// (a transformed box contains them).
const Scaled: React.FC<{ device: Device; scale: number; children: React.ReactNode }> = ({ device, scale, children }) => {
  const [w, h] = SIZES[device];
  return (
    <div dir="ltr" className="overflow-hidden" style={{ width: w * scale, height: h * scale }}>
      <div className="pointer-events-none" style={{ width: w, height: h, transform: `scale(${scale})`, transformOrigin: 'top left' }}>{children}</div>
    </div>
  );
};

interface Draft { project: ProjectType; pages: Page[]; elements: CanvasElement[]; data: any }

// The page as it is now in the editor (what «نشر» publishes): its first page in a computer and a
// phone. A click opens it full size.
const DraftPreviews: React.FC<{ draft: Draft; onOpen: (d: Device) => void; onArrange?: () => void; arranged: boolean }> = ({ draft, onOpen, onArrange, arranged }) => {
  const first = draft.pages[0]?.id || '';
  const thumb = (d: Device) => (
    <button type="button" onClick={() => onOpen(d)} className="block cursor-zoom-in" aria-label={d === 'desktop' ? 'عرض على الكمبيوتر' : 'عرض على الموبايل'}>
      <Scaled device={d} scale={0.25}>
        <SiteView project={draft.project} pages={draft.pages} elements={draft.elements} data={draft.data} phone={d === 'mobile'} pageId={first} />
      </Scaled>
    </button>
  );
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end justify-center gap-4">
        <ComputerFrame label={deviceLabel('desktop')}>{thumb('desktop')}</ComputerFrame>
        <PhoneFrame label={deviceLabel('mobile')}>{thumb('mobile')}</PhoneFrame>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <button type="button" onClick={() => onOpen('desktop')} className="h-9 px-3 rounded-xl border border-neutral-200 bg-white text-xs font-bold text-neutral-700 inline-flex items-center gap-1.5 cursor-pointer hover:bg-neutral-50">
          <Maximize2 size={14} /> معاينة على الكمبيوتر
        </button>
        <button type="button" onClick={() => onOpen('mobile')} className="h-9 px-3 rounded-xl border border-neutral-200 bg-white text-xs font-bold text-neutral-700 inline-flex items-center gap-1.5 cursor-pointer hover:bg-neutral-50">
          <Smartphone size={14} /> معاينة الموبايل
        </button>
        {onArrange && (
          <button type="button" onClick={onArrange} className="h-9 px-3 rounded-xl bg-[#0071e3]/10 text-[#0071e3] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer hover:bg-[#0071e3]/15">
            <Wand2 size={14} /> تنسيق الموبايل
          </button>
        )}
      </div>
      {onArrange && !arranged && (
        <p className="text-[11px] text-neutral-500 text-center leading-relaxed">
          لم تنسّق صفحتك للموبايل بعد، فرتّبناها تلقائياً في المعاينة. اضغط «تنسيق الموبايل» ليُحفظ الترتيب وتستطيع تعديله في المحرر.
        </p>
      )}
    </div>
  );
};

// The page full size, on a computer (the whole window) or in a phone, with its pages clickable.
const FullPreview: React.FC<{ draft: Draft; device: Device; onDevice: (d: Device) => void; onClose: () => void; onArrange?: () => void }> = ({ draft, device, onDevice, onClose, onArrange }) => {
  const [pageId, setPageId] = useState(draft.pages[0]?.id || '');
  const tab = (d: Device) => (
    <button type="button" onClick={() => onDevice(d)} className={`h-9 px-3 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer ${device === d ? 'bg-white text-[#1d1d1f]' : 'text-white/70 hover:text-white'}`}>
      {d === 'desktop' ? <><Monitor size={14} /> كمبيوتر</> : <><Smartphone size={14} /> موبايل</>}
    </button>
  );
  const view = <SiteView project={draft.project} pages={draft.pages} elements={draft.elements} data={draft.data} phone={device === 'mobile'} pageId={pageId} onSelectPage={setPageId} />;
  return (
    <div className="fixed inset-0 z-[4000001] bg-[#1d1d1f] flex flex-col" onClick={(e) => e.stopPropagation()}>
      <div dir="rtl" className="h-14 shrink-0 flex items-center gap-2 px-3 font-sans">
        <span className="text-sm font-black text-white hidden sm:block">معاينة قبل النشر</span>
        <div className="flex gap-1 p-1 rounded-xl bg-white/10 mx-auto sm:mx-0 sm:mr-4">{tab('desktop')}{tab('mobile')}</div>
        {device === 'mobile' && onArrange && (
          <button type="button" onClick={onArrange} className="h-9 px-3 rounded-lg bg-[#0071e3] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer">
            <Wand2 size={14} /> <span className="hidden sm:inline">تنسيق الموبايل</span>
          </button>
        )}
        <button type="button" onClick={onClose} className="w-9 h-9 rounded-full bg-white/10 text-white flex items-center justify-center cursor-pointer sm:mr-auto" aria-label="إغلاق المعاينة"><X size={18} /></button>
      </div>
      {device === 'desktop' ? (
        <div className="flex-1 min-h-0 bg-white" style={{ transform: 'translateZ(0)' }}>{view}</div>
      ) : (
        <div className="flex-1 min-h-0 flex items-center justify-center p-3">
          <div className="rounded-[28px] border-[8px] border-black overflow-hidden bg-white" style={{ width: 390 + 16, height: 'min(860px, 100%)', transform: 'translateZ(0)' }}>{view}</div>
        </div>
      )}
    </div>
  );
};

// A restaurant's site is always live: shown as its visitors open it (in frames).
const LivePreviews: React.FC<{ url: string }> = ({ url }) => {
  const frame = (d: Device) => {
    const [w, h] = SIZES[d];
    return (
      <div dir="ltr" className="overflow-hidden bg-white" style={{ width: w * 0.25, height: h * 0.25 }}>
        <iframe src={url} title="معاينة" loading="lazy" tabIndex={-1} className="block border-0 pointer-events-none" style={{ width: w, height: h, transform: 'scale(0.25)', transformOrigin: 'top left' }} />
      </div>
    );
  };
  return (
    <div className="flex flex-wrap items-end justify-center gap-4">
      <ComputerFrame label={deviceLabel('desktop')}>{frame('desktop')}</ComputerFrame>
      <PhoneFrame label={deviceLabel('mobile')}>{frame('mobile')}</PhoneFrame>
    </div>
  );
};

// ---------- Search ----------

// The title, description and keywords for Google and Weelink's search, with how Google shows them.
const SeoFields: React.FC<{ seo: SiteSeo; keywords: string; onSeo: (s: SiteSeo) => void; onKeywords: (k: string) => void; link: string }> = ({ seo, keywords, onSeo, onKeywords, link }) => {
  const chips = normalizeKeywords(keywords);
  return (
    <>
      <div>
        <span className={label}>عنوان الصفحة في البحث</span>
        <input className={input} maxLength={SEO_LIMITS.title} placeholder="مطعم النور - مشاوي ووجبات سريعة في حلب" value={seo.title} onChange={(e) => onSeo({ ...seo, title: e.target.value })} />
        <div className="text-[10px] text-neutral-400 mt-0.5 text-left" dir="ltr">{seo.title.length}/{SEO_LIMITS.title}</div>
      </div>
      <div>
        <span className={label}>وصف قصير</span>
        <textarea
          className={`${input} h-20 py-2.5 resize-none`}
          maxLength={SEO_LIMITS.description}
          placeholder="ماذا تقدّم، وأين أنت، ولماذا يختارك الزبون. جملتان تكفيان."
          value={seo.description}
          onChange={(e) => onSeo({ ...seo, description: e.target.value })}
        />
        <div className="text-[10px] text-neutral-400 mt-0.5 text-left" dir="ltr">{seo.description.length}/{SEO_LIMITS.description}</div>
      </div>
      <div>
        <span className={label}>كلمات مفتاحية (افصل بينها بفاصلة)</span>
        <input className={input} placeholder="مطعم، مشاوي، حلب، توصيل" value={keywords} onChange={(e) => onKeywords(e.target.value)} />
        {chips.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {chips.map((k) => <span key={k} className="px-2.5 py-1 rounded-full bg-[#0071e3]/10 text-[#0071e3] text-[11px] font-bold">{k}</span>)}
          </div>
        )}
        <p className="text-[11px] text-neutral-500 mt-1">حتى {SEO_LIMITS.keywords} كلمة. يجدك بها الناس في بحث Weelink، وتساعد Google على فهم صفحتك.</p>
      </div>
      <div className="rounded-xl bg-white border border-neutral-200 p-3">
        <div className="text-[10px] font-bold text-neutral-400 mb-1.5">هكذا قد تظهر في Google</div>
        <div className="text-[11px] text-[#202124] truncate" dir="ltr">{link.replace('https://', '')}</div>
        <div className="text-[15px] text-[#1a0dab] font-medium truncate">{seo.title || 'عنوان صفحتك'}</div>
        <div className="text-xs text-[#4d5156] line-clamp-2">{seo.description || 'اكتب وصفاً قصيراً لصفحتك ليظهر هنا.'}</div>
      </div>
    </>
  );
};

// ---------- The window ----------

const sameSeo = (a?: SiteSeo, b?: SiteSeo) =>
  (a?.title || '') === (b?.title || '') && (a?.description || '') === (b?.description || '') && (a?.keywords || []).join(',') === (b?.keywords || []).join(',');

export const PublishModal: React.FC<PublishModalProps> = ({ open, onClose, owner, project, pages, elements, data, suggestedName, onPublishedChange, onArrangeForMobile }) => {
  const [site, setSite] = useState<PublishedSite | null | 'loading'>('loading');
  const [name, setName] = useState('');
  const [state, setState] = useState<NameState | 'checking' | ''>('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [qr, setQr] = useState('');
  const [fold, setFold] = useState<'' | 'connect' | 'buy' | 'seo'>('');
  const [seo, setSeo] = useState<SiteSeo>({ title: '', description: '', keywords: [] });
  const [keywords, setKeywords] = useState('');
  const [preview, setPreview] = useState<Device | null>(null);
  // The logo picked before the first «نشر»; once published it is saved right away.
  const [draftIcon, setDraftIcon] = useState('');

  // What «نشر» publishes. A restaurant's site is already live (restaurants/{uid}); it only gets a name.
  const content = useMemo(
    () => (open ? (project === 'restaurant' ? { pages: [], elements: [], data: null } : { pages, elements, data }) : null),
    [open, project, pages, elements, data]
  );
  const hash = useMemo(() => (content ? contentHash(content) : ''), [content]);
  // What the previews show: the editor's content as visitors will see it.
  const draft = useMemo<Draft | null>(
    () => (open && project !== 'restaurant' ? { project, pages, elements: elements.map(withLocalGraphics), data } : null),
    [open, project, pages, elements, data]
  );
  const arranged = useMemo(() => elements.some((e) => e.mobile), [elements]);

  useEffect(() => {
    if (!open) return;
    setSite('loading');
    setError('');
    readMySite(owner, project)
      .then((s) => {
        setSite(s);
        setName(s?.name || normalizeSiteName(suggestedName));
        setSeo(s?.seo || { title: suggestedName, description: '', keywords: [] });
        setKeywords((s?.seo?.keywords || []).join('، '));
      })
      .catch(() => setSite(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, owner, project]);

  // The name is checked while typing.
  const problem = siteNameProblem(name);
  useEffect(() => {
    if (!open || problem) return setState('');
    setState('checking');
    const t = window.setTimeout(() => {
      checkSiteName(name, owner, project).then(setState).catch(() => setState(''));
    }, 400);
    return () => window.clearTimeout(t);
  }, [open, name, problem, owner, project]);

  const published = site && site !== 'loading' ? site : null;
  const link = published ? siteUrl(published.name) : '';

  useEffect(() => {
    if (!link) return setQr('');
    QRCode.toDataURL(link, { margin: 1, width: 480, errorCorrectionLevel: 'M' }).then(setQr).catch(() => setQr(''));
  }, [link]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (preview) setPreview(null);
      else onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose, preview]);

  if (!open) return null;

  const nextSeo: SiteSeo = { ...seo, keywords: normalizeKeywords(keywords) };
  const seoChanged = !!published && !sameSeo({ ...nextSeo, title: nextSeo.title.trim(), description: nextSeo.description.trim() }, published.seo);

  const publish = async () => {
    if (problem || state === 'taken' || !content) return;
    setBusy(true);
    setError('');
    try {
      if (published && !changed && !renaming && seoChanged && project !== 'restaurant') {
        // Only the search texts changed: no need to publish the page again.
        const saved = await setSiteSeo(owner, project, published.name, nextSeo);
        setSite({ ...published, seo: saved });
        setBusy(false);
        return;
      }
      await publishSite(owner, project, name, content, nextSeo);
      if (!published && draftIcon) await setSiteIcon(owner, project, draftIcon).catch(() => {});
      const s = await readMySite(owner, project);
      setSite(s);
      onPublishedChange(s?.name || name);
    } catch (e: any) {
      setError(e?.message === 'name-taken' ? 'سبقك أحد إلى هذا الاسم. اختر اسماً آخر.' : String(e?.message || '').includes('exceeds the maximum') ? 'الصفحة كبيرة جداً للنشر. صغّر الصور المرفوعة وحاول مرة أخرى.' : 'تعذر النشر. تحقق من الإنترنت وحاول مرة أخرى.');
    }
    setBusy(false);
  };

  const unpublish = async () => {
    if (!window.confirm('إلغاء نشر الصفحة؟ لن يفتح رابطها لأحد حتى تنشرها من جديد.')) return;
    setBusy(true);
    try {
      if (published?.customDomain) await removeDomain(owner, project);
      await unpublishSite(owner, project);
      setSite(null);
      onPublishedChange(null);
    } catch {
      setError('تعذر إلغاء النشر. حاول مرة أخرى.');
    }
    setBusy(false);
  };

  const icon = published ? published.icon || '' : draftIcon;
  const changeIcon = (next: string) => {
    if (!published) return setDraftIcon(next);
    setSite({ ...published, icon: next });
    setSiteIcon(owner, project, next).catch(() => setError('تعذر حفظ الأيقونة. حاول مرة أخرى.'));
  };
  const changed = !!published && project !== 'restaurant' && published.hash !== hash;
  const arrange = onArrangeForMobile && project !== 'restaurant' ? onArrangeForMobile : undefined;
  const renaming = !!published && name !== published.name;
  const shareText = `${suggestedName ? `${suggestedName}: ` : ''}${link}`;
  const share = async () => {
    try {
      await navigator.share?.({ title: suggestedName || 'صفحتي', url: link });
    } catch {
      // the customer closed the share sheet
    }
  };
  const nameStatus =
    problem && name ? <span className="text-[#c2410c]">{problem}</span>
    : state === 'checking' ? <span className="text-neutral-500 inline-flex items-center gap-1"><Loader2 size={12} className="animate-spin" /> جاري الفحص...</span>
    : state === 'free' ? <span className="text-[#1d6b34] inline-flex items-center gap-1"><CheckCircle2 size={13} /> الاسم متاح</span>
    : state === 'mine' ? <span className="text-[#1d6b34] inline-flex items-center gap-1"><CheckCircle2 size={13} /> هذا اسم صفحتك</span>
    : state === 'taken' ? <span className="text-[#c2410c] inline-flex items-center gap-1"><XCircle size={13} /> الاسم محجوز، اختر اسماً آخر</span>
    : null;

  return (
    <div className="fixed inset-0 z-[4000000] bg-black/40 backdrop-blur-[2px] flex items-end sm:items-center justify-center" onClick={onClose}>
      <div dir="rtl" className="w-full sm:max-w-xl max-h-[94dvh] overflow-y-auto bg-[#f5f5f7] rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 space-y-4 font-sans" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="w-10 h-10 rounded-xl bg-[#0071e3] text-white flex items-center justify-center"><Globe size={20} /></span>
            <div>
              <div className="text-lg font-black text-[#1d1d1f]">نشر صفحتك</div>
              <div className="text-[11px] text-neutral-500">{published ? 'صفحتك منشورة ويستطيع أي أحد فتحها' : 'اختر اسماً لصفحتك واحصل على رابطها'}</div>
            </div>
          </div>
          <button type="button" onClick={onClose} className="w-9 h-9 rounded-full bg-black/5 flex items-center justify-center cursor-pointer" aria-label="إغلاق"><X size={18} /></button>
        </div>

        {site === 'loading' ? (
          <div className="py-12 flex justify-center"><Loader2 size={28} className="animate-spin text-[#0071e3]" /></div>
        ) : (
          <>
            <section className="bg-white rounded-2xl p-4 border border-neutral-200 space-y-3">
              <div className="text-sm font-black text-[#1d1d1f]">{published && !changed ? 'هكذا يرى الناس صفحتك' : 'هكذا ستظهر صفحتك'}</div>
              {draft ? (
                <DraftPreviews draft={draft} onOpen={setPreview} onArrange={arrange} arranged={arranged} />
              ) : (
                <LivePreviews url={`${window.location.origin}/?r=${encodeURIComponent(owner)}`} />
              )}
            </section>

            <section className="bg-white rounded-2xl p-4 space-y-3 border border-neutral-200">
              <div>
                <span className={label}>اسم صفحتك</span>
                <div className="flex items-stretch rounded-xl border border-neutral-200 focus-within:border-[#0071e3] focus-within:ring-2 focus-within:ring-[#0071e3]/15 overflow-hidden" dir="ltr">
                  <span className="px-3 flex items-center text-sm text-neutral-400 bg-neutral-50 border-r border-neutral-200">https://</span>
                  <input
                    className="flex-1 min-w-0 h-11 px-2 text-sm font-bold text-[#1d1d1f] outline-none"
                    placeholder="alnour"
                    value={name}
                    onChange={(e) => setName(normalizeSiteName(e.target.value))}
                    autoFocus={!published}
                    aria-label="اسم صفحتك"
                  />
                  <span className="px-3 flex items-center text-sm font-bold text-neutral-500 bg-neutral-50 border-l border-neutral-200">.{SITE_DOMAIN}</span>
                </div>
                <div className="text-[11px] font-bold mt-1.5 min-h-[16px]">{nameStatus}</div>
              </div>
              {name && !problem && (
                <div className="text-xs text-neutral-500">
                  سيكون رابط صفحتك: <span dir="ltr" className="font-black text-[#0071e3]">{siteUrl(name).replace('https://', '')}</span>
                </div>
              )}
              <IconPicker icon={icon} title={suggestedName} name={name} onChange={changeIcon} />
              <Fold icon={Search} title="الظهور في Google وبحث Weelink" hint="عنوان ووصف وكلمات مفتاحية يجدك بها الناس" open={fold === 'seo'} onToggle={() => setFold(fold === 'seo' ? '' : 'seo')}>
                <SeoFields seo={seo} keywords={keywords} onSeo={setSeo} onKeywords={setKeywords} link={siteUrl(name || 'alnour')} />
              </Fold>
              {(changed || seoChanged) && !renaming && (
                <div className="text-xs font-bold text-[#a34a00] bg-[#fff4e6] rounded-xl px-3 py-2">لديك تغييرات غير منشورة. اضغط «تحديث النشر» ليراها الناس.</div>
              )}
              {renaming && <div className="text-xs font-bold text-[#a34a00] bg-[#fff4e6] rounded-xl px-3 py-2">تغيير الاسم يغيّر الرابط، والرابط القديم يتوقف عن العمل.</div>}
              {error && <p className="text-xs font-bold text-[#c2410c]">{error}</p>}
              <button
                type="button"
                onClick={publish}
                disabled={busy || !!problem || state === 'taken' || state === 'checking'}
                className="w-full h-12 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white text-base font-black cursor-pointer disabled:opacity-50 inline-flex items-center justify-center gap-2 transition"
              >
                {busy ? <Loader2 size={18} className="animate-spin" /> : <Globe size={18} />}
                {!published ? 'نشر الصفحة' : renaming ? 'نشر بالاسم الجديد' : project === 'restaurant' ? 'حفظ' : changed ? 'تحديث النشر' : seoChanged ? 'حفظ بيانات البحث' : 'تحديث النشر'}
              </button>
              {project === 'restaurant' && <p className="text-[11px] text-neutral-500">موقع المطعم يتحدّث تلقائياً مع كل تعديل؛ النشر هنا يعطيه اسمه ورابطه.</p>}
            </section>

            {published && (
              <section className="bg-white rounded-2xl p-4 border border-neutral-200 space-y-3">
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                  {qr && <img src={qr} alt="رمز QR لصفحتك" className="w-36 h-36 rounded-xl border border-neutral-100 shrink-0" />}
                  <div className="flex-1 min-w-0 space-y-2 w-full">
                    <a href={link} target="_blank" rel="noreferrer" dir="ltr" className="flex items-center gap-1.5 text-base font-black text-[#0071e3] break-all">
                      <ExternalLink size={16} className="shrink-0" /> {link.replace('https://', '')}
                    </a>
                    {published.customDomain?.status === 'active' && (
                      <a href={`https://${published.customDomain.name}`} target="_blank" rel="noreferrer" dir="ltr" className="block text-sm font-bold text-[#0071e3]">{published.customDomain.name}</a>
                    )}
                    <div className="text-[11px] text-neutral-500">
                      إذا لم يفتح الرابط بعد، استعمل: <a href={siteFallbackUrl(published.name)} target="_blank" rel="noreferrer" dir="ltr" className="text-[#0071e3] font-bold break-all">{siteFallbackUrl(published.name).replace(/^https?:\/\//, '')}</a>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <CopyButton text={link} label="نسخ الرابط" />
                      {qr && (
                        <a href={qr} download={`${published.name}-qr.png`} className="h-9 px-3 rounded-xl border border-neutral-200 bg-white text-xs font-bold text-neutral-700 inline-flex items-center gap-1.5 hover:bg-neutral-50">
                          <Download size={14} /> تنزيل QR
                        </a>
                      )}
                      {typeof navigator.share === 'function' && (
                        <button type="button" onClick={share} className="h-9 px-3 rounded-xl border border-neutral-200 bg-white text-xs font-bold text-neutral-700 inline-flex items-center gap-1.5 cursor-pointer hover:bg-neutral-50">
                          <Share2 size={14} /> مشاركة
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <a href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noreferrer" className="h-10 rounded-xl bg-[#25D366] text-white text-xs font-bold flex items-center justify-center">واتساب</a>
                  <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`} target="_blank" rel="noreferrer" className="h-10 rounded-xl bg-[#1877F2] text-white text-xs font-bold flex items-center justify-center">فيسبوك</a>
                  <a href={`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(suggestedName)}`} target="_blank" rel="noreferrer" className="h-10 rounded-xl bg-[#229ED9] text-white text-xs font-bold flex items-center justify-center">تيليغرام</a>
                  <a href={`https://x.com/intent/post?url=${encodeURIComponent(link)}&text=${encodeURIComponent(suggestedName)}`} target="_blank" rel="noreferrer" className="h-10 rounded-xl bg-black text-white text-xs font-bold flex items-center justify-center">X</a>
                </div>
                <p className="text-[11px] text-neutral-500">لإنستغرام وتيك توك: نزّل رمز QR أو انسخ الرابط وضعه في البايو.</p>
              </section>
            )}


            <Fold icon={Link2} title="إضافة دومين اشتريته بنفسك" hint="مثل alnour.com، نربطه بصفحتك ونعطيك السجلات المطلوبة" open={fold === 'connect'} onToggle={() => setFold(fold === 'connect' ? '' : 'connect')}>
              <ConnectDomain owner={owner} project={project} site={published} onChange={(d) => setSite(published ? { ...published, customDomain: d } : published)} />
            </Fold>
            <Fold icon={ShoppingCart} title="اشترِ دومين الآن" hint="نشتريه لك ونربطه بصفحتك، والدفع عن طريق المكتب" open={fold === 'buy'} onToggle={() => setFold(fold === 'buy' ? '' : 'buy')}>
              <BuyDomain owner={owner} project={project} suggested={published?.name || name} />
            </Fold>

            {published && (
              <div className="text-center">
                <button type="button" onClick={unpublish} disabled={busy} className="text-xs font-bold text-neutral-500 hover:text-[#c2410c] underline decoration-neutral-300 cursor-pointer">إلغاء نشر الصفحة</button>
              </div>
            )}
          </>
        )}
      </div>
      {preview && draft && <FullPreview draft={draft} device={preview} onDevice={setPreview} onClose={() => setPreview(null)} onArrange={arrange} />}
    </div>
  );
};
