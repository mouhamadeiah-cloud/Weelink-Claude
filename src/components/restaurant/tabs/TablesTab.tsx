// الموقع والطاولات: the guests' link to the restaurant's site (copy, open, its QR code), a QR code
// for each table of each hall (a guest who scans it orders to that table, with no address or
// delivery fee), a sheet of all the table cards to print, and the kitchen screen's link. The halls
// and tables themselves are set in «الصالات والطاولات».
import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Copy, ExternalLink, Printer, Check, Armchair } from 'lucide-react';
import { restaurantSiteUrl } from '../restaurantCloud';
import { allTables } from '../restaurantTypes';
import { Card, GhostButton, EmptyState } from '../../shop/adminUi';
import { RestaurantTabProps } from './shared';

const useQr = (text: string) => {
  const [src, setSrc] = useState('');
  useEffect(() => {
    let alive = true;
    QRCode.toDataURL(text, { margin: 1, width: 360, errorCorrectionLevel: 'M' }).then((u) => alive && setSrc(u)).catch(() => {});
    return () => { alive = false; };
  }, [text]);
  return src;
};

const QrImage: React.FC<{ text: string; size: number; label: string }> = ({ text, size, label }) => {
  const src = useQr(text);
  return src ? <img src={src} alt={label} width={size} height={size} /> : <div style={{ width: size, height: size }} className="bg-neutral-100 rounded-lg" />;
};

const LinkRow: React.FC<{ url: string }> = ({ url }) => {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(url).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    }).catch(() => {});
  };
  return (
    <div className="flex flex-wrap items-center gap-2">
      <code className="flex-1 min-w-[220px] h-10 px-3 rounded-xl bg-neutral-50 border border-neutral-200 text-xs flex items-center overflow-x-auto whitespace-nowrap" dir="ltr">{url}</code>
      <GhostButton onClick={copy} className="h-10"><span className="inline-flex items-center gap-1">{copied ? <Check size={14} /> : <Copy size={14} />}{copied ? 'نُسخ' : 'نسخ'}</span></GhostButton>
      <a href={url} target="_blank" rel="noreferrer" className="h-10 px-3 rounded-xl border border-neutral-200 bg-white text-xs font-bold inline-flex items-center gap-1 text-neutral-700"><ExternalLink size={14} /> فتح</a>
    </div>
  );
};

// A print window with one card per table: the restaurant's name, «اطلب من طاولتك» and the code.
const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');

const printTables = async (name: string, uid: string, tables: { name: string; hallName: string }[]) => {
  const cards = await Promise.all(
    tables.map(async (t) => {
      const src = await QRCode.toDataURL(restaurantSiteUrl(uid, t.name), { margin: 1, width: 400 });
      return `<div class="card"><div class="name">${esc(name)}</div><img src="${src}"/><div class="table">طاولة ${esc(t.name)}</div><div class="hint">${esc(t.hallName)} · امسح الرمز واطلب من طاولتك</div></div>`;
    })
  );
  const w = window.open('', '_blank');
  if (!w) return;
  w.document.write(`<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><title>رموز الطاولات</title><style>
    body{font-family:'IBM Plex Sans Arabic',Tahoma,sans-serif;margin:0;padding:12mm}
    .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8mm}
    .card{border:1.5px dashed #999;border-radius:6mm;padding:6mm;text-align:center;break-inside:avoid}
    .name{font-weight:800;font-size:16pt}.table{font-weight:800;font-size:20pt;margin-top:2mm}.hint{font-size:10pt;color:#555}
    img{width:45mm;height:45mm;margin-top:3mm}
  </style></head><body><div class="grid">${cards.join('')}</div><script>window.onload=()=>setTimeout(()=>window.print(),300)</script></body></html>`);
  w.document.close();
};

export const TablesTab: React.FC<RestaurantTabProps> = ({ data, ownerUid, onGoTo }) => {
  const tables = allTables(data.halls).filter((t) => t.name.trim());
  const siteUrl = restaurantSiteUrl(ownerUid);

  return (
    <div className="space-y-4">
      <Card title="رابط موقع المطعم للزبائن">
        <p className="text-xs text-neutral-500 leading-relaxed">ضع هذا الرابط في صفحاتك على السوشيال أو اطبع رمزه. يتحدث الموقع تلقائيًا بعد كل تعديل، وكل طلب منه يصل إلى «الطلبات» وشاشة المطبخ لحظة إرساله.</p>
        <LinkRow url={siteUrl} />
        <div className="flex items-center gap-4">
          <QrImage text={siteUrl} size={120} label="رمز موقع المطعم" />
          <p className="text-[11px] text-neutral-400 leading-relaxed">يمكن للزبون أيضًا تثبيت الموقع على شاشة هاتفه من قائمة المتصفح («إضافة إلى الشاشة الرئيسية») ليصبح تطبيق طلب.</p>
        </div>
      </Card>

      <Card title="الكاشير وشاشة المطبخ">
        <p className="text-xs text-neutral-500 leading-relaxed">
          يعمل الكاشير وشاشة المطبخ على أجهزة المطعم، كل جهاز بكوده.{' '}
          <button type="button" onClick={() => onGoTo('devices')} className="font-bold text-[#0071e3] cursor-pointer">الأجهزة والأكواد</button>
        </p>
      </Card>

      <Card title="رموز QR للطاولات" actions={tables.length > 0 ? <GhostButton onClick={() => printTables(data.settings.name || 'مطعمنا', ownerUid, tables)}><span className="inline-flex items-center gap-1"><Printer size={14} /> اطبع كل الرموز</span></GhostButton> : undefined}>
        <p className="text-xs text-neutral-500 leading-relaxed">
          كل طاولة لها رمز خاص. الطلب منه يصل باسم الطاولة، بلا عنوان ولا رسوم توصيل.{' '}
          <button type="button" onClick={() => onGoTo('halls')} className="font-bold text-[#0071e3] cursor-pointer">تعديل الصالات والطاولات</button>
        </p>
        {tables.length === 0 && <EmptyState text="لا توجد طاولات بعد. أضفها من «الصالات والطاولات»." />}
        {data.halls.filter((h) => h.tables.length > 0).map((h) => (
          <div key={h.id} className="space-y-2">
            <div className="text-sm font-black text-neutral-700 inline-flex items-center gap-1.5"><Armchair size={15} /> {h.name}</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
              {h.tables.filter((t) => t.name.trim()).map((t) => (
                <a key={t.id} href={restaurantSiteUrl(ownerUid, t.name)} target="_blank" rel="noreferrer" className="flex flex-col items-center gap-1 p-3 rounded-2xl border border-neutral-200 bg-white hover:border-[#0071e3]">
                  <QrImage text={restaurantSiteUrl(ownerUid, t.name)} size={110} label={`رمز طاولة ${t.name}`} />
                  <span className="text-sm font-black">طاولة {t.name}</span>
                </a>
              ))}
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
};
