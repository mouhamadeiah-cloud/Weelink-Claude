// The Online Shop's checkout page: the cart summary, and the order card with the visitor's
// details, an optional account, delivery and payment (cash on delivery or an e-wallet). A wallet
// payment is sent with its transaction number and a screenshot, and the order waits for the
// merchant to confirm it in the admin's orders page.
// The summary (the 'cart' element) and the order card (the 'checkout' element) are usually two
// elements side by side; older cart elements show both halves in one (CheckoutView). Their
// background, border, corners, font, text colour, accent and texts come from the elements.
import React, { useMemo, useState } from 'react';
import {
  Minus, Plus, ShoppingBag, Trash2, Truck, Wallet, Banknote, Copy, Check, ImagePlus, Loader2, CheckCircle2, Clock, MessageCircle, ClipboardList,
} from 'lucide-react';
import { useCart, setCartQty, clearCart, formatPrice } from '../../../utils/cartStore';
import { useShopData, useShopUpdate } from './ShopDataContext';
import { deliveryQuote } from '../productModel';
import { addOrder, enabledWallets, nextOrderNumber, walletFee, whatsappLink } from '../orderModel';
import { newId, ShopAdminData, ShopOrder, ShopCustomer, SYRIAN_GOVERNORATES } from '../shopTypes';
import { uploadImageFile } from '../adminUi';
import { CheckoutLook, lookVars, setCheckoutChoices, useCheckoutChoices } from './checkoutStore';

interface PartProps {
  look: CheckoutLook;
  isPreviewActive: boolean;
}

// The fields look like the platform's own input element.
const fieldClass =
  'w-full h-11 px-3.5 rounded-xl border border-neutral-300 bg-white/95 text-sm text-neutral-800 placeholder:text-neutral-400 outline-none focus:border-(--accent) focus:ring-2 focus:ring-(--accent)/20 transition shadow-2xs';

const Section: React.FC<{ n: number; title: string; children: React.ReactNode }> = ({ n, title, children }) => (
  <section className="space-y-3">
    <h3 className="flex items-center gap-2 text-[15px] font-bold text-(--ink)">
      <span className="w-6 h-6 rounded-full bg-(--accent) text-white text-xs flex items-center justify-center">{n}</span>
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

// The cart, the visitor's choices and the totals, the same in the summary and the order card.
const useCheckout = () => {
  const items = useCart();
  const shop = useShopData()!;
  const choices = useCheckoutChoices();
  const s = shop.settings;
  const currency = items[0]?.currency || s.currency;
  const canDeliver = s.delivery.delivery;
  const canPickup = s.delivery.pickup;
  const method = choices.method && (choices.method === 'delivery' ? canDeliver : canPickup) ? choices.method : canDeliver || !canPickup ? 'delivery' : 'pickup';
  const wallets = enabledWallets(shop);
  const offersCash = s.payments.cash || wallets.length === 0;
  const pay = choices.pay === 'wallet' && wallets.length ? 'wallet' : choices.pay === 'cash' && offersCash ? 'cash' : offersCash ? 'cash' : 'wallet';
  const walletId = choices.walletId && wallets.some((w) => w.id === choices.walletId) ? choices.walletId : null;

  const delivering = method === 'delivery' && canDeliver;
  const quote = items.length ? deliveryQuote(items, shop.products, s) : null;
  const subtotal = quote?.subtotal || 0;
  const deliveryFee = delivering && quote ? quote.fee : 0;
  const wallet = pay === 'wallet' && walletId ? s.payments.wallets[walletId] : null;
  const walletMeta = wallets.find((w) => w.id === walletId);
  const fee = wallet ? walletFee(wallet, subtotal + deliveryFee) : 0;
  const total = subtotal + deliveryFee + fee;
  return { items, shop, s, currency, canDeliver, canPickup, method, wallets, offersCash, pay, walletId, delivering, quote, subtotal, deliveryFee, wallet, walletMeta, fee, total };
};

const stop = (e: React.SyntheticEvent) => e.stopPropagation();

// The element's root: its own white card when the element has no background of its own.
const Root: React.FC<PartProps & { className?: string; children: React.ReactNode }> = ({ look, isPreviewActive, className = '', children }) => (
  <div
    dir="rtl"
    className={`@container w-full h-full overflow-hidden text-(--ink) ${look.framed ? 'bg-white rounded-3xl border border-black/[0.06]' : ''} ${className}`}
    style={{ ...lookVars(look), '--accent': look.accent, pointerEvents: isPreviewActive ? 'auto' : 'none' } as React.CSSProperties}
    onClick={stop}
  >
    {children}
  </div>
);

// The cart summary: the products, quantities and totals.
const SummaryBody: React.FC<PartProps> = ({ look, isPreviewActive }) => {
  const { items, currency, delivering, quote, subtotal, deliveryFee, fee, walletMeta, total } = useCheckout();
  const freeProgress = quote && delivering && quote.freeFrom > 0 ? Math.min(1, quote.subtotal / quote.freeFrom) : 0;
  const accent = look.accent;
  return (
    <>
      <div className="flex items-center justify-between px-6 py-4 border-b border-(--line)">
        <div className="flex items-center gap-2 font-bold text-lg">
          <ShoppingBag size={20} style={{ color: accent }} />
          <span>{look.text('summaryTitle')}</span>
        </div>
        {items.length > 0 && (
          <button type="button" onClick={clearCart} className="text-xs text-(--muted) hover:text-red-500 cursor-pointer">إفراغ السلة</button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center px-6 py-10">
          <ShoppingBag size={44} className="text-(--line)" />
          <span className="text-base font-semibold">{look.text('empty')}</span>
          <span className="text-sm text-(--muted)">
            {isPreviewActive ? 'افتح أي منتج في المتجر وأضفه إلى السلة.' : 'ستظهر هنا المنتجات التي يضيفها الزائر. جرّبها من وضع المعاينة.'}
          </span>
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto px-6 divide-y divide-(--line)" onWheel={stop}>
          {items.map((item) => (
            <div key={item.key} className="flex items-center gap-3 py-3">
              {item.image ? (
                <img src={item.image} alt="" referrerPolicy="no-referrer" className="w-14 h-14 rounded-xl object-cover bg-neutral-100 shrink-0" />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-neutral-100 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm truncate">{item.name}</div>
                <div className="text-xs text-(--muted)">{formatPrice(item.price, item.currency)}</div>
                <div className="mt-1 inline-flex items-center gap-1 border border-black/[0.08] rounded-full px-1 bg-white text-[#2A1F1A]">
                  <button type="button" aria-label="زيادة" onClick={() => setCartQty(item.key, item.qty + 1)} className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-neutral-100 cursor-pointer"><Plus size={12} /></button>
                  <span className="w-5 text-center text-xs font-bold">{item.qty}</span>
                  <button type="button" aria-label="إنقاص" onClick={() => setCartQty(item.key, item.qty - 1)} className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-neutral-100 cursor-pointer"><Minus size={12} /></button>
                </div>
              </div>
              <div className="text-left">
                <div className="font-bold text-sm" style={{ color: accent }}>{formatPrice(item.price * item.qty, item.currency)}</div>
                <button type="button" aria-label="حذف" onClick={() => setCartQty(item.key, 0)} className="mt-1 text-(--muted) hover:text-red-500 cursor-pointer"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {quote && (
        <div className="px-6 py-4 border-t border-(--line) space-y-2 text-sm">
          <div className="flex items-center justify-between text-(--muted)">
            <span>مجموع المنتجات</span>
            <span className="font-semibold">{formatPrice(subtotal, currency)}</span>
          </div>
          {delivering && (
            <div className="flex items-center justify-between text-(--muted)">
              <span className="flex items-center gap-1.5"><Truck size={15} /> التوصيل</span>
              <span className={`font-semibold ${deliveryFee === 0 ? 'text-[#34a853]' : ''}`}>{deliveryFee > 0 ? formatPrice(deliveryFee, currency) : 'مجاني'}</span>
            </div>
          )}
          {fee > 0 && (
            <div className="flex items-center justify-between text-(--muted)">
              <span>رسوم {walletMeta?.label}</span>
              <span className="font-semibold">{formatPrice(fee, currency)}</span>
            </div>
          )}
          {delivering && quote.freeFrom > 0 && (
            <div className="space-y-1">
              <div className={`text-xs font-semibold ${quote.remaining > 0 ? '' : 'text-[#34a853]'}`}>
                {quote.remaining > 0 ? `أضف ${formatPrice(quote.remaining, currency)} إلى مشترياتك لتحصل على توصيل مجاني` : '🎉 حصلت على توصيل مجاني'}
              </div>
              <div className="h-1.5 rounded-full bg-(--line) overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${freeProgress * 100}%`, backgroundColor: quote.remaining > 0 ? accent : '#34a853' }} />
              </div>
            </div>
          )}
          <div className="flex items-center justify-between pt-2 border-t border-(--line)">
            <span className="font-bold">{look.text('totalLabel')}</span>
            <span className="text-xl font-bold">{formatPrice(total, currency)}</span>
          </div>
        </div>
      )}
    </>
  );
};

// The order card's content: the visitor's details, delivery, payment and the confirm button.
// `onPlaced` shows the thank-you screen in place of the whole element.
const FormBody: React.FC<PartProps & { onPlaced: (o: ShopOrder) => void }> = ({ look, onPlaced }) => {
  const updateShop = useShopUpdate();
  const { items, shop, s, currency, canDeliver, canPickup, method, wallets, offersCash, pay, walletId, delivering, subtotal, deliveryFee, wallet, walletMeta, fee, total } = useCheckout();
  const accent = look.accent;

  const [form, setForm] = useState({ name: '', province: '', address: '', email: '', whatsapp: '', note: '' });
  const [register, setRegister] = useState(false);
  const [paid, setPaid] = useState(false); // the visitor pressed "لقد دفعت"
  const [txn, setTxn] = useState('');
  const [shot, setShot] = useState('');
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const steps = useMemo(() => (wallet?.instructions || '').split('\n').map((l) => l.trim()).filter(Boolean), [wallet?.instructions]);

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
    onPlaced(order);
    clearCart();
  };

  return (
    <>
      <Section n={1} title={look.text('details')}>
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
        <label className="flex items-start gap-2.5 p-3 rounded-xl border border-(--line) cursor-pointer">
          <input type="checkbox" checked={register} onChange={(e) => setRegister(e.target.checked)} className="mt-0.5 w-4 h-4 accent-(--accent)" />
          <span className="text-sm">
            <span className="font-semibold">أنشئ حساباً في المتجر</span>
            <span className="block text-xs text-(--muted)">نحفظ بياناتك لطلباتك القادمة.</span>
          </span>
        </label>
      </Section>

      {canDeliver && canPickup && (
        <Section n={2} title={look.text('receive')}>
          <div className="grid grid-cols-2 gap-2">
            {(['delivery', 'pickup'] as const).map((m) => (
              <button key={m} type="button" onClick={() => setCheckoutChoices({ method: m })} aria-pressed={method === m}
                className={`h-11 rounded-xl border text-sm font-semibold cursor-pointer transition ${method === m ? 'text-white' : 'bg-white text-[#2A1F1A] border-neutral-300'}`}
                style={method === m ? { backgroundColor: accent, borderColor: accent } : undefined}>
                {m === 'delivery' ? 'توصيل' : 'استلام من المتجر'}
              </button>
            ))}
          </div>
          {method === 'pickup' && s.delivery.storeAddress && <p className="text-xs text-(--muted)">عنوان المتجر: {s.delivery.storeAddress}</p>}
        </Section>
      )}

      <Section n={canDeliver && canPickup ? 3 : 2} title={look.text('payment')}>
        <div className="grid grid-cols-2 gap-2">
          {offersCash && (
            <button type="button" onClick={() => { setCheckoutChoices({ pay: 'cash' }); setPaid(false); }} aria-pressed={pay === 'cash'}
              className={`flex items-center justify-center gap-2 h-12 rounded-xl border bg-white text-[#2A1F1A] text-sm font-semibold cursor-pointer transition ${pay === 'cash' ? 'border-2' : 'border-neutral-300'}`}
              style={pay === 'cash' ? { borderColor: accent, color: accent } : undefined}>
              <Banknote size={17} /> الدفع عند الاستلام
            </button>
          )}
          {wallets.length > 0 && (
            <button type="button" onClick={() => setCheckoutChoices({ pay: 'wallet' })} aria-pressed={pay === 'wallet'}
              className={`flex items-center justify-center gap-2 h-12 rounded-xl border bg-white text-[#2A1F1A] text-sm font-semibold cursor-pointer transition ${pay === 'wallet' ? 'border-2' : 'border-neutral-300'}`}
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
                    onClick={() => { setCheckoutChoices({ walletId: w.id }); setPaid(false); }}
                    className={`px-4 h-10 rounded-full border text-sm font-semibold cursor-pointer transition disabled:opacity-40 disabled:cursor-not-allowed ${walletId === w.id ? 'text-white' : 'bg-white text-[#2A1F1A] border-neutral-300'}`}
                    style={walletId === w.id ? { backgroundColor: accent, borderColor: accent } : undefined}
                    title={below ? `الحد الأدنى للطلب ${formatPrice(min, currency)}` : undefined}>
                    {w.label}{below ? ` (الحد الأدنى ${formatPrice(min, currency)})` : ''}
                  </button>
                );
              })}
            </div>

            {wallet && walletMeta && (
              <div className="rounded-2xl border border-black/[0.08] p-4 space-y-3 bg-[#FBF6EF] text-[#2A1F1A]">
                <div className="flex gap-4">
                  {wallet.qrImage && (
                    <img src={wallet.qrImage} alt={`QR ${walletMeta.label}`} referrerPolicy="no-referrer" className="w-28 h-28 rounded-xl bg-white border border-black/[0.06] object-contain shrink-0" />
                  )}
                  <div className="space-y-2 text-sm min-w-0">
                    <div>
                      <div className="text-xs text-neutral-500">{walletMeta.accountLabel}</div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold break-all" dir="ltr">{wallet.account || '—'}</span>
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
                        <div className="font-semibold">{wallet.holderName}</div>
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
                      <span className="text-sm">{shot ? 'تغيير لقطة الشاشة' : 'رفع لقطة شاشة للتحويل'}</span>
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
        {pay === 'wallet' ? 'إرسال الطلب وإثبات الدفع' : look.text('submit')} · {formatPrice(total, currency)}
      </button>
    </>
  );
};

// After the order is sent: its number and status, in place of the whole element.
const Placed: React.FC<PartProps & { order: ShopOrder; onNew: () => void }> = ({ look, isPreviewActive, order, onNew }) => {
  const shop = useShopData()!;
  const s = shop.settings;
  const waiting = order.status === 'awaiting-payment';
  const summary = `طلب جديد رقم ${order.number}\nالاسم: ${order.contact?.name}\nالمجموع: ${formatPrice(order.total, s.currency)}`;
  return (
    <Root look={look} isPreviewActive={isPreviewActive} className="flex flex-col items-center justify-center gap-3 text-center p-8">
      {waiting ? <Clock size={52} style={{ color: look.accent }} /> : <CheckCircle2 size={52} className="text-[#34a853]" />}
      <div className="text-2xl font-bold">{look.text('thanks')} {order.contact?.name}!</div>
      <div className="text-base text-(--muted)">رقم طلبك <span className="font-bold text-(--ink)">#{order.number}</span></div>
      <div className="px-4 py-2 rounded-full text-sm font-bold" style={{ backgroundColor: waiting ? '#bf5af21a' : '#34a8531a', color: waiting ? '#9b3fd0' : '#2a8a45' }}>
        حالة الطلب: {waiting ? 'بانتظار تأكيد الدفع' : 'تم استلام الطلب'}
      </div>
      <p className="text-sm text-(--muted) max-w-md leading-relaxed">
        {waiting
          ? 'سيتحقق المتجر من التحويل ويؤكد طلبك، ثم يتواصل معك على واتساب.'
          : 'سيتواصل معك المتجر على واتساب لتأكيد التوصيل.'}
      </p>
      {s.whatsappNumber && (
        <a href={whatsappLink(s.whatsappNumber, summary)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#25d366] text-white text-sm font-semibold">
          <MessageCircle size={16} /> راسل المتجر على واتساب
        </a>
      )}
      <button type="button" onClick={onNew} className="text-xs text-(--muted) hover:text-(--ink) cursor-pointer mt-2">طلب جديد</button>
    </Root>
  );
};

// The 'cart' element of a shop whose order card is a separate element: the summary only.
export const CartSummary: React.FC<PartProps> = (props) => (
  <Root {...props} className="flex flex-col">
    <SummaryBody {...props} />
  </Root>
);

// The 'checkout' element: the order card.
export const CheckoutForm: React.FC<PartProps> = (props) => {
  const [placed, setPlaced] = useState<ShopOrder | null>(null);
  if (placed) return <Placed {...props} order={placed} onNew={() => setPlaced(null)} />;
  return (
    <Root {...props}>
      <div className="h-full overflow-y-auto px-6 py-5 space-y-6" onWheel={stop}>
        <div className="flex items-center gap-2 font-bold text-lg">
          <ClipboardList size={20} style={{ color: props.look.accent }} />
          <span>{props.look.text('formTitle')}</span>
        </div>
        <FormBody {...props} onPlaced={setPlaced} />
      </div>
    </Root>
  );
};

// Older 'cart' elements of a shop: the summary and the order card in one element.
export const CheckoutView: React.FC<PartProps> = (props) => {
  const [placed, setPlaced] = useState<ShopOrder | null>(null);
  if (placed) return <Placed {...props} order={placed} onNew={() => setPlaced(null)} />;
  return (
    <Root {...props}>
      <div className="h-full grid grid-rows-[auto_1fr] @3xl:grid-rows-1 @3xl:grid-cols-2 overflow-y-auto @3xl:overflow-hidden" onWheel={stop}>
        <div className="flex flex-col min-h-0 bg-(--soft) @3xl:border-l border-(--line)">
          <SummaryBody {...props} />
        </div>
        <div className="min-h-0 @3xl:overflow-y-auto px-6 py-5 space-y-6">
          <FormBody {...props} onPlaced={setPlaced} />
        </div>
      </div>
    </Root>
  );
};
