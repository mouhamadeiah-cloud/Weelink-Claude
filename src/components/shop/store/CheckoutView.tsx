// The Online Shop's checkout page (the cart element in a shop project): the cart summary on one
// half, and on the other the visitor's details, an optional account, delivery and payment (cash
// on delivery or an e-wallet). A wallet payment is sent with its transaction number and a
// screenshot, and the order waits for the merchant to confirm it in the admin's orders page.
import React, { useMemo, useState } from 'react';
import {
  Minus, Plus, ShoppingBag, Trash2, Truck, Wallet, Banknote, Copy, Check, ImagePlus, Loader2, CheckCircle2, Clock, MessageCircle,
} from 'lucide-react';
import { useCart, setCartQty, clearCart, formatPrice } from '../../../utils/cartStore';
import { useShopData, useShopUpdate } from './ShopDataContext';
import { deliveryQuote } from '../productModel';
import { addOrder, enabledWallets, nextOrderNumber, walletFee, whatsappLink } from '../orderModel';
import { newId, ShopAdminData, ShopOrder, ShopCustomer, WalletId, SYRIAN_GOVERNORATES } from '../shopTypes';
import { uploadImageFile } from '../adminUi';

interface CheckoutViewProps {
  accent: string;
  isPreviewActive: boolean;
}

type PayChoice = 'cash' | 'wallet';

const fieldClass =
  'w-full h-11 px-3.5 rounded-xl border border-black/[0.1] bg-white text-sm text-[#2A1F1A] outline-none focus:border-[#B4532A] transition';

const Section: React.FC<{ n: number; title: string; children: React.ReactNode }> = ({ n, title, children }) => (
  <section className="space-y-3">
    <h3 className="flex items-center gap-2 text-[15px] font-bold text-[#2A1F1A]">
      <span className="w-6 h-6 rounded-full bg-[#2A1F1A] text-white text-xs flex items-center justify-center">{n}</span>
      {title}
    </h3>
    {children}
  </section>
);

// A customer already registered with the same WhatsApp number or email.
const findCustomer = (d: ShopAdminData, phone: string, email: string) =>
  d.customers.find((x) => (phone && x.phone === phone) || (email && x.email.toLowerCase() === email.toLowerCase()));

// Adds the visitor to the store's customers under `id`, or updates the existing entry.
const registerCustomer = (d: ShopAdminData, id: string, c: Omit<ShopCustomer, 'id' | 'createdAt'>): ShopAdminData =>
  d.customers.some((x) => x.id === id)
    ? { ...d, customers: d.customers.map((x) => (x.id === id ? { ...x, ...c } : x)) }
    : { ...d, customers: [{ id, ...c, createdAt: new Date().toISOString() }, ...d.customers] };

export const CheckoutView: React.FC<CheckoutViewProps> = ({ accent, isPreviewActive }) => {
  const items = useCart();
  const shop = useShopData()!;
  const updateShop = useShopUpdate();
  const s = shop.settings;
  const currency = items[0]?.currency || s.currency;

  const [form, setForm] = useState({ name: '', province: '', address: '', email: '', whatsapp: '', note: '' });
  const [register, setRegister] = useState(false);
  const canDeliver = s.delivery.delivery;
  const canPickup = s.delivery.pickup;
  const [method, setMethod] = useState<'delivery' | 'pickup'>(canDeliver || !canPickup ? 'delivery' : 'pickup');
  const wallets = enabledWallets(shop);
  const offersCash = s.payments.cash || wallets.length === 0;
  const [pay, setPay] = useState<PayChoice>(offersCash ? 'cash' : 'wallet');
  const [walletId, setWalletId] = useState<WalletId | null>(null);
  const [paid, setPaid] = useState(false); // the visitor pressed "لقد دفعت"
  const [txn, setTxn] = useState('');
  const [shot, setShot] = useState('');
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [placed, setPlaced] = useState<ShopOrder | null>(null);

  const delivering = method === 'delivery' && canDeliver;
  const quote = items.length ? deliveryQuote(items, shop.products, s) : null;
  const subtotal = quote?.subtotal || 0;
  const deliveryFee = delivering && quote ? quote.fee : 0;
  const wallet = pay === 'wallet' && walletId ? s.payments.wallets[walletId] : null;
  const walletMeta = wallets.find((w) => w.id === walletId);
  const fee = wallet ? walletFee(wallet, subtotal + deliveryFee) : 0;
  const total = subtotal + deliveryFee + fee;
  const freeProgress = quote && delivering && quote.freeFrom > 0 ? Math.min(1, quote.subtotal / quote.freeFrom) : 0;
  const steps = useMemo(() => (wallet?.instructions || '').split('\n').map((l) => l.trim()).filter(Boolean), [wallet?.instructions]);

  const stop = (e: React.SyntheticEvent) => e.stopPropagation();
  const setField = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setForm({ ...form, [k]: e.target.value });

  const copyAccount = async () => {
    if (!wallet) return;
    try {
      await navigator.clipboard.writeText(wallet.account);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard blocked: the number is still shown to copy by hand.
    }
  };

  const pickShot = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    const url = await uploadImageFile(file);
    setUploading(false);
    if (url) setShot(url);
  };

  const validate = () => {
    if (!form.name.trim()) return 'اكتب اسمك.';
    if (!form.province) return 'اختر محافظتك.';
    if (delivering && !form.address.trim()) return 'اكتب عنوان التوصيل.';
    if (!form.whatsapp.trim()) return 'اكتب رقم واتساب للتواصل معك.';
    if (form.email.trim() && !/^\S+@\S+\.\S+$/.test(form.email.trim())) return 'البريد الإلكتروني غير صحيح.';
    if (pay === 'wallet') {
      if (!wallet) return 'اختر المحفظة التي ستدفع بها.';
      if (!txn.trim()) return 'أدخل رقم عملية التحويل.';
    }
    return '';
  };

  const submit = () => {
    const problem = validate();
    setError(problem);
    if (problem || !updateShop || !items.length) return;
    const contact = { name: form.name.trim(), province: form.province, address: delivering ? form.address.trim() : '', email: form.email.trim(), whatsapp: form.whatsapp.trim() };
    const now = new Date().toISOString();
    const customerId = register ? findCustomer(shop, contact.whatsapp, contact.email)?.id || newId('cus') : '';
    const order: ShopOrder = {
      id: newId('ord'),
      number: nextOrderNumber(shop),
      customerId,
      contact,
      items: items.map((i) => ({
        productId: i.productId || '',
        name: i.variant ? shop.products.find((p) => p.id === i.productId)?.name || i.name : i.name,
        variant: i.variant,
        price: i.price,
        qty: i.qty,
      })),
      total,
      deliveryFee,
      status: pay === 'wallet' ? 'awaiting-payment' : 'new',
      paymentMethod: pay === 'wallet' && walletMeta ? walletMeta.method : 'cash',
      ...(pay === 'wallet' ? { payment: { fee, transactionId: txn.trim(), screenshot: shot, paidAt: now } } : {}),
      deliveryMethod: delivering ? 'delivery' : 'pickup',
      note: form.note.trim(),
      source: 'checkout',
      createdAt: now,
    };
    updateShop((d) => {
      const next = register
        ? registerCustomer(d, customerId, { name: contact.name, phone: contact.whatsapp, email: contact.email, address: contact.address, province: contact.province, registered: true })
        : d;
      return addOrder(next, { ...order, number: nextOrderNumber(next) });
    });
    setPlaced(order);
    clearCart();
  };

  if (placed) {
    const waiting = placed.status === 'awaiting-payment';
    const summary = `طلب جديد رقم ${placed.number}\nالاسم: ${placed.contact?.name}\nالمجموع: ${formatPrice(placed.total, currency)}`;
    return (
      <div dir="rtl" className="w-full h-full bg-white rounded-3xl border border-black/[0.06] flex flex-col items-center justify-center gap-3 text-center p-8 font-['IBM_Plex_Sans_Arabic',sans-serif]" style={{ pointerEvents: isPreviewActive ? 'auto' : 'none' }} onClick={stop}>
        {waiting ? <Clock size={52} style={{ color: accent }} /> : <CheckCircle2 size={52} className="text-[#34a853]" />}
        <div className="text-2xl font-bold text-[#2A1F1A]">شكراً {placed.contact?.name}!</div>
        <div className="text-base text-neutral-600">رقم طلبك <span className="font-bold text-[#2A1F1A]">#{placed.number}</span></div>
        <div className="px-4 py-2 rounded-full text-sm font-bold" style={{ backgroundColor: waiting ? '#bf5af21a' : '#34a8531a', color: waiting ? '#9b3fd0' : '#2a8a45' }}>
          حالة الطلب: {waiting ? 'بانتظار تأكيد الدفع' : 'تم استلام الطلب'}
        </div>
        <p className="text-sm text-neutral-500 max-w-md leading-relaxed">
          {waiting
            ? 'سيتحقق المتجر من التحويل ويؤكد طلبك، ثم يتواصل معك على واتساب.'
            : 'سيتواصل معك المتجر على واتساب لتأكيد التوصيل.'}
        </p>
        {s.whatsappNumber && (
          <a href={whatsappLink(s.whatsappNumber, summary)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#25d366] text-white text-sm font-semibold">
            <MessageCircle size={16} /> راسل المتجر على واتساب
          </a>
        )}
        <button type="button" onClick={() => setPlaced(null)} className="text-xs text-neutral-400 hover:text-neutral-600 cursor-pointer mt-2">طلب جديد</button>
      </div>
    );
  }

  return (
    <div
      dir="rtl"
      className="@container w-full h-full bg-white rounded-3xl border border-black/[0.06] overflow-hidden font-['IBM_Plex_Sans_Arabic',sans-serif]"
      style={{ pointerEvents: isPreviewActive ? 'auto' : 'none' }}
      onClick={stop}
    >
      <div className="h-full grid grid-rows-[auto_1fr] @3xl:grid-rows-1 @3xl:grid-cols-2 overflow-y-auto @3xl:overflow-hidden" onWheel={stop}>
        {/* Cart summary: the right half */}
        <div className="flex flex-col min-h-0 bg-[#FBF6EF] @3xl:border-l border-black/[0.06]">
          <div className="flex items-center justify-between px-6 py-4 border-b border-black/[0.06]">
            <div className="flex items-center gap-2 text-[#2A1F1A] font-bold text-lg">
              <ShoppingBag size={20} style={{ color: accent }} />
              <span>ملخص السلة</span>
            </div>
            {items.length > 0 && (
              <button type="button" onClick={clearCart} className="text-xs text-neutral-400 hover:text-red-500 cursor-pointer">إفراغ السلة</button>
            )}
          </div>

          {items.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center px-6 py-10">
              <ShoppingBag size={44} className="text-neutral-200" />
              <span className="text-base font-semibold text-neutral-600">سلتك فارغة</span>
              <span className="text-sm text-neutral-400">
                {isPreviewActive ? 'افتح أي منتج في المتجر وأضفه إلى السلة.' : 'ستظهر هنا المنتجات التي يضيفها الزائر. جرّبها من وضع المعاينة.'}
              </span>
            </div>
          ) : (
            <div className="flex-1 min-h-0 @3xl:overflow-y-auto px-6 divide-y divide-black/[0.05]">
              {items.map((item) => (
                <div key={item.key} className="flex items-center gap-3 py-3">
                  {item.image ? (
                    <img src={item.image} alt="" referrerPolicy="no-referrer" className="w-14 h-14 rounded-xl object-cover bg-neutral-100 shrink-0" />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-neutral-100 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-[#2A1F1A] truncate">{item.name}</div>
                    <div className="text-xs text-neutral-500">{formatPrice(item.price, item.currency)}</div>
                    <div className="mt-1 inline-flex items-center gap-1 border border-black/[0.08] rounded-full px-1 bg-white">
                      <button type="button" aria-label="زيادة" onClick={() => setCartQty(item.key, item.qty + 1)} className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-neutral-100 cursor-pointer"><Plus size={12} /></button>
                      <span className="w-5 text-center text-xs font-bold">{item.qty}</span>
                      <button type="button" aria-label="إنقاص" onClick={() => setCartQty(item.key, item.qty - 1)} className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-neutral-100 cursor-pointer"><Minus size={12} /></button>
                    </div>
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-sm" style={{ color: accent }}>{formatPrice(item.price * item.qty, item.currency)}</div>
                    <button type="button" aria-label="حذف" onClick={() => setCartQty(item.key, 0)} className="mt-1 text-neutral-300 hover:text-red-500 cursor-pointer"><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {quote && (
            <div className="px-6 py-4 border-t border-black/[0.06] space-y-2 text-sm">
              <div className="flex items-center justify-between text-neutral-600">
                <span>مجموع المنتجات</span>
                <span className="font-semibold">{formatPrice(subtotal, currency)}</span>
              </div>
              {delivering && (
                <div className="flex items-center justify-between text-neutral-600">
                  <span className="flex items-center gap-1.5"><Truck size={15} /> التوصيل</span>
                  <span className={`font-semibold ${deliveryFee === 0 ? 'text-[#34a853]' : ''}`}>{deliveryFee > 0 ? formatPrice(deliveryFee, currency) : 'مجاني'}</span>
                </div>
              )}
              {fee > 0 && (
                <div className="flex items-center justify-between text-neutral-600">
                  <span>رسوم {walletMeta?.label}</span>
                  <span className="font-semibold">{formatPrice(fee, currency)}</span>
                </div>
              )}
              {delivering && quote.freeFrom > 0 && (
                <div className="space-y-1">
                  <div className={`text-xs font-semibold ${quote.remaining > 0 ? 'text-[#5A4C42]' : 'text-[#34a853]'}`}>
                    {quote.remaining > 0 ? `أضف ${formatPrice(quote.remaining, currency)} إلى مشترياتك لتحصل على توصيل مجاني` : '🎉 حصلت على توصيل مجاني'}
                  </div>
                  <div className="h-1.5 rounded-full bg-black/[0.06] overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${freeProgress * 100}%`, backgroundColor: quote.remaining > 0 ? accent : '#34a853' }} />
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between pt-2 border-t border-black/[0.06]">
                <span className="font-bold text-[#2A1F1A]">الإجمالي النهائي</span>
                <span className="text-xl font-bold text-[#2A1F1A]">{formatPrice(total, currency)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Details and payment: the left half */}
        <div className="min-h-0 @3xl:overflow-y-auto px-6 py-5 space-y-6">
          <Section n={1} title="بياناتك">
            <div className="grid @lg:grid-cols-2 gap-2.5">
              <input className={fieldClass} placeholder="الاسم الكامل *" value={form.name} onChange={setField('name')} aria-label="الاسم" />
              <input className={fieldClass} placeholder="رقم واتساب *" value={form.whatsapp} onChange={setField('whatsapp')} dir="ltr" inputMode="tel" aria-label="رقم واتساب" style={{ textAlign: 'right' }} />
              <select className={fieldClass} value={form.province} onChange={setField('province')} aria-label="المحافظة" style={{ color: form.province ? undefined : '#a3a3a3' }}>
                <option value="">المحافظة *</option>
                {SYRIAN_GOVERNORATES.map((g) => <option key={g} value={g} style={{ color: '#2A1F1A' }}>{g}</option>)}
              </select>
              <input className={fieldClass} placeholder="البريد الإلكتروني" type="email" value={form.email} onChange={setField('email')} dir="ltr" aria-label="البريد الإلكتروني" style={{ textAlign: 'right' }} />
              {delivering && (
                <input className={`${fieldClass} @lg:col-span-2`} placeholder="العنوان (المدينة، الحي، الشارع) *" value={form.address} onChange={setField('address')} aria-label="العنوان" />
              )}
            </div>
            <label className="flex items-start gap-2.5 p-3 rounded-xl border border-black/[0.08] cursor-pointer">
              <input type="checkbox" checked={register} onChange={(e) => setRegister(e.target.checked)} className="mt-0.5 w-4 h-4 accent-[#2A1F1A]" />
              <span className="text-sm text-[#2A1F1A]">
                <span className="font-semibold">أنشئ حساباً في المتجر</span>
                <span className="block text-xs text-neutral-500">نحفظ بياناتك لطلباتك القادمة.</span>
              </span>
            </label>
          </Section>

          {canDeliver && canPickup && (
            <Section n={2} title="الاستلام">
              <div className="grid grid-cols-2 gap-2">
                {(['delivery', 'pickup'] as const).map((m) => (
                  <button key={m} type="button" onClick={() => setMethod(m)} aria-pressed={method === m}
                    className={`h-11 rounded-xl border text-sm font-semibold cursor-pointer transition ${method === m ? 'text-white' : 'bg-white text-[#2A1F1A] border-black/[0.1]'}`}
                    style={method === m ? { backgroundColor: accent, borderColor: accent } : undefined}>
                    {m === 'delivery' ? 'توصيل' : 'استلام من المتجر'}
                  </button>
                ))}
              </div>
              {method === 'pickup' && s.delivery.storeAddress && <p className="text-xs text-neutral-500">عنوان المتجر: {s.delivery.storeAddress}</p>}
            </Section>
          )}

          <Section n={canDeliver && canPickup ? 3 : 2} title="الدفع">
            <div className="grid grid-cols-2 gap-2">
              {offersCash && (
                <button type="button" onClick={() => { setPay('cash'); setPaid(false); }} aria-pressed={pay === 'cash'}
                  className={`flex items-center justify-center gap-2 h-12 rounded-xl border text-sm font-semibold cursor-pointer transition ${pay === 'cash' ? 'border-2' : 'border-black/[0.1]'}`}
                  style={pay === 'cash' ? { borderColor: accent, color: accent } : undefined}>
                  <Banknote size={17} /> الدفع عند الاستلام
                </button>
              )}
              {wallets.length > 0 && (
                <button type="button" onClick={() => setPay('wallet')} aria-pressed={pay === 'wallet'}
                  className={`flex items-center justify-center gap-2 h-12 rounded-xl border text-sm font-semibold cursor-pointer transition ${pay === 'wallet' ? 'border-2' : 'border-black/[0.1]'}`}
                  style={pay === 'wallet' ? { borderColor: accent, color: accent } : undefined}>
                  <Wallet size={17} /> محفظة إلكترونية
                </button>
              )}
            </div>

            {pay === 'wallet' && (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="المحفظة">
                  {wallets.map((w) => {
                    const min = s.payments.wallets[w.id].minOrder;
                    const below = min > 0 && subtotal < min;
                    return (
                      <button key={w.id} type="button" role="radio" aria-checked={walletId === w.id} disabled={below}
                        onClick={() => { setWalletId(w.id); setPaid(false); }}
                        className={`px-4 h-10 rounded-full border text-sm font-semibold cursor-pointer transition disabled:opacity-40 disabled:cursor-not-allowed ${walletId === w.id ? 'text-white' : 'bg-white text-[#2A1F1A] border-black/[0.1]'}`}
                        style={walletId === w.id ? { backgroundColor: accent, borderColor: accent } : undefined}
                        title={below ? `الحد الأدنى للطلب ${formatPrice(min, currency)}` : undefined}>
                        {w.label}{below ? ` (الحد الأدنى ${formatPrice(min, currency)})` : ''}
                      </button>
                    );
                  })}
                </div>

                {wallet && walletMeta && (
                  <div className="rounded-2xl border border-black/[0.08] p-4 space-y-3 bg-[#FBF6EF]">
                    <div className="flex gap-4">
                      {wallet.qrImage && (
                        <img src={wallet.qrImage} alt={`QR ${walletMeta.label}`} referrerPolicy="no-referrer" className="w-28 h-28 rounded-xl bg-white border border-black/[0.06] object-contain shrink-0" />
                      )}
                      <div className="space-y-2 text-sm min-w-0">
                        <div>
                          <div className="text-xs text-neutral-500">{walletMeta.accountLabel}</div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#2A1F1A] break-all" dir="ltr">{wallet.account || '—'}</span>
                            {wallet.account && (
                              <button type="button" onClick={copyAccount} aria-label="نسخ" className="text-neutral-400 hover:text-neutral-700 cursor-pointer">
                                {copied ? <Check size={14} className="text-[#34a853]" /> : <Copy size={14} />}
                              </button>
                            )}
                          </div>
                        </div>
                        {wallet.holderName && (
                          <div>
                            <div className="text-xs text-neutral-500">اسم صاحب الحساب</div>
                            <div className="font-semibold text-[#2A1F1A]">{wallet.holderName}</div>
                          </div>
                        )}
                        <div>
                          <div className="text-xs text-neutral-500">المبلغ المطلوب</div>
                          <div className="text-lg font-bold" style={{ color: accent }}>{formatPrice(total, currency)}</div>
                        </div>
                      </div>
                    </div>
                    {steps.length > 0 && (
                      <ol className="space-y-1 text-sm text-[#5A4C42] list-decimal pr-5">
                        {steps.map((st, i) => <li key={i}>{st}</li>)}
                      </ol>
                    )}

                    {!paid ? (
                      <button type="button" onClick={() => setPaid(true)} className="w-full h-11 rounded-xl text-white text-sm font-semibold cursor-pointer" style={{ backgroundColor: '#2A1F1A' }}>
                        لقد دفعت
                      </button>
                    ) : (
                      <div className="space-y-2.5 pt-1">
                        <input className={fieldClass} placeholder="رقم العملية *" value={txn} onChange={(e) => setTxn(e.target.value)} dir="ltr" aria-label="رقم العملية" style={{ textAlign: 'right' }} />
                        <label className="flex items-center gap-3 p-2.5 rounded-xl border border-dashed border-black/[0.15] bg-white cursor-pointer">
                          {shot ? (
                            <img src={shot} alt="لقطة الشاشة" className="w-12 h-12 rounded-lg object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <span className="w-12 h-12 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-400">
                              {uploading ? <Loader2 size={18} className="animate-spin" /> : <ImagePlus size={18} />}
                            </span>
                          )}
                          <span className="text-sm text-[#2A1F1A]">{shot ? 'تغيير لقطة الشاشة' : 'رفع لقطة شاشة للتحويل'}</span>
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => { pickShot(e.target.files?.[0]); e.target.value = ''; }} />
                        </label>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </Section>

          <textarea className={`${fieldClass} h-20 py-2.5 resize-none`} placeholder="ملاحظة للمتجر (اختياري)" value={form.note} onChange={setField('note')} aria-label="ملاحظة" />

          {error && <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm font-semibold">{error}</div>}

          <button
            type="button"
            onClick={submit}
            disabled={!items.length || uploading || (pay === 'wallet' && !paid)}
            className="w-full h-12 rounded-full text-white font-semibold text-sm disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            style={{ backgroundColor: accent }}
          >
            {pay === 'wallet' ? 'إرسال الطلب وإثبات الدفع' : 'تأكيد الطلب'} · {formatPrice(total, currency)}
          </button>
        </div>
      </div>
    </div>
  );
};
