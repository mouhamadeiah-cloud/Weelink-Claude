// The e-wallet accounts a booking deposit is paid to (Eyad, 25 Oct): the same ways the online shop offers
// (Syriatel / Sham / MTN Cash), kept once per page in «إعدادات الحجز» and used by every schedule that asks
// for a deposit. A store page can copy its own accounts with one button.
import React, { useContext, useEffect, useState } from 'react';
import { ImagePlus, Loader2, Trash2 } from 'lucide-react';
import { DEPOSIT_WALLETS, emptyPayments, normalizePayments, type BookingPayments, type DepositWallet, type DepositWalletId } from '../../services/bookingDeposit';
import { ShopDataContext } from '../shop/store/ShopDataContext';
import { Field, GhostButton, inputFitClass, PrimaryButton, Toggle, textareaClass, uploadImageFile } from '../shop/adminUi';

interface Props {
  payments: BookingPayments | undefined;
  // false until the page has a saved schedule (the payments are saved with them).
  canSave: boolean;
  onSave: (payments: BookingPayments) => Promise<boolean>;
}

export const BookingPaymentsEditor: React.FC<Props> = ({ payments, canSave, onSave }) => {
  const shop = useContext(ShopDataContext);
  const saved = payments || emptyPayments();
  const [draft, setDraft] = useState<BookingPayments>(saved);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState<DepositWalletId | ''>('');
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const key = JSON.stringify(saved);
  useEffect(() => setDraft(normalizePayments(JSON.parse(key))), [key]);
  const dirty = JSON.stringify(normalizePayments(draft)) !== JSON.stringify(normalizePayments(saved));

  const setWallet = (id: DepositWalletId, patch: Partial<DepositWallet>) => {
    setNote(null);
    setDraft((d) => ({ ...d, wallets: { ...d.wallets, [id]: { ...d.wallets[id], ...patch } } }));
  };

  const pickQr = async (id: DepositWalletId, file: File | undefined) => {
    if (!file) return;
    setUploading(id);
    const url = await uploadImageFile(file);
    setUploading('');
    if (url) setWallet(id, { qrImage: url });
  };

  const copyFromShop = () => {
    const w = shop?.settings.payments.wallets;
    if (!w) return;
    setNote(null);
    setDraft((d) => ({
      ...d,
      wallets: Object.fromEntries(DEPOSIT_WALLETS.map(({ id }) => [id, { enabled: w[id].enabled, account: w[id].account, holderName: w[id].holderName, qrImage: w[id].qrImage, instructions: w[id].instructions }])) as BookingPayments['wallets'],
    }));
  };

  const save = async () => {
    const clean = normalizePayments(draft);
    if (clean.wallets && DEPOSIT_WALLETS.some(({ id }) => clean.wallets[id].enabled && !clean.wallets[id].account)) {
      return setNote({ ok: false, text: 'اكتب رقم أو رمز الحساب للمحفظة المفعّلة.' });
    }
    setBusy(true);
    const ok = await onSave(clean);
    setBusy(false);
    setNote(ok ? { ok: true, text: 'انحفظت حسابات الدفع.' } : { ok: false, text: 'ما قدرنا نحفظ. تأكد من الإنترنت وجرّب مرة ثانية.' });
  };

  return (
    <div className="space-y-3 rounded-2xl border border-neutral-200 p-3">
      <div className="text-xs font-bold text-neutral-500">حسابات الدفع للعربون (تنطبق على كل الجداول اللي بتطلب عربون)</div>
      {!canSave && <div className="text-xs font-bold text-[#A34A00]">احفظ جدولاً أولاً، وبعدها بتقدر تضيف حسابات الدفع.</div>}
      <Field label="العملة" hint="بتظهر بعد مبلغ العربون، مثلاً ل.س أو $">
        <input className={`${inputFitClass} w-28`} value={draft.currency} maxLength={12} onChange={(e) => { setNote(null); setDraft({ ...draft, currency: e.target.value }); }} />
      </Field>
      {shop && <GhostButton onClick={copyFromShop}>انسخ حسابات المتجر</GhostButton>}
      {DEPOSIT_WALLETS.map(({ id, label, accountLabel }) => {
        const w = draft.wallets[id];
        return (
          <div key={id} className="rounded-xl border border-neutral-200 p-2.5 space-y-2">
            <Toggle checked={w.enabled} onChange={(enabled) => setWallet(id, { enabled })} label={label} />
            {w.enabled && (
              <div className="grid sm:grid-cols-2 gap-2">
                <Field label={accountLabel}><input className={inputFitClass} dir="ltr" value={w.account} maxLength={60} onChange={(e) => setWallet(id, { account: e.target.value })} /></Field>
                <Field label="اسم صاحب الحساب"><input className={inputFitClass} value={w.holderName} maxLength={60} onChange={(e) => setWallet(id, { holderName: e.target.value })} /></Field>
                <Field label="خطوات الدفع (سطر لكل خطوة، اختياري)">
                  <textarea className={`${textareaClass} h-20`} value={w.instructions} maxLength={600} onChange={(e) => setWallet(id, { instructions: e.target.value })} />
                </Field>
                <Field label="صورة QR (اختياري)">
                  <div className="flex items-center gap-2">
                    {w.qrImage && <img src={w.qrImage} alt="QR" className="w-16 h-16 rounded-lg border border-neutral-200 object-contain bg-white" referrerPolicy="no-referrer" />}
                    <label className="inline-flex items-center gap-1 text-xs font-bold text-brand cursor-pointer">
                      {uploading === id ? <Loader2 size={13} className="animate-spin" /> : <ImagePlus size={13} />}
                      {w.qrImage ? 'تغيير' : 'رفع صورة'}
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => pickQr(id, e.target.files?.[0])} />
                    </label>
                    {w.qrImage && <button type="button" aria-label="حذف QR" className="text-[#E03131] cursor-pointer" onClick={() => setWallet(id, { qrImage: '' })}><Trash2 size={14} /></button>}
                  </div>
                </Field>
              </div>
            )}
          </div>
        );
      })}
      {note && <div className={`text-xs font-bold ${note.ok ? 'text-[#2B8A3E]' : 'text-[#E03131]'}`}>{note.text}</div>}
      <PrimaryButton onClick={save} disabled={busy || !dirty || !canSave}>{busy ? 'جاري الحفظ…' : 'احفظ حسابات الدفع'}</PrimaryButton>
    </div>
  );
};
