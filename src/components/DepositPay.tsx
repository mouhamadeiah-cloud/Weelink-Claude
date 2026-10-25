// The deposit step of a booking widget (Eyad, 25 Oct): the visitor sees the amount, picks an e-wallet,
// transfers it to the owner's account, then enters the transaction number and (optionally) a screenshot.
// The owner confirms it from «المواعيد»; see src/services/bookingDeposit.ts.
import React, { useState } from 'react';
import { Check, Copy, ImagePlus, Loader2 } from 'lucide-react';
import { uploadImageFile } from './shop/adminUi';
import { DEPOSIT_WALLETS, usableWallets, type BookingPayments, type DepositWalletId } from '../services/bookingDeposit';

export interface DepositDraft {
  wallet: DepositWalletId | '';
  txn: string;
  screenshot: string;
}

export const EMPTY_DEPOSIT: DepositDraft = { wallet: '', txn: '', screenshot: '' };

// What is missing before a booking with this deposit can be sent; '' when it is ready.
export const depositProblem = (draft: DepositDraft, payments: BookingPayments | null | undefined) => {
  if (usableWallets(payments).length === 0) return 'الدفع غير جاهز بعد: المالك لازم يضيف حساب محفظة من «إعدادات الحجز».';
  if (!draft.wallet) return 'اختر المحفظة اللي دفعت منها العربون.';
  if (draft.txn.trim().length < 3) return 'اكتب رقم عملية التحويل.';
  return '';
};

// The proof the server expects, or undefined when no deposit is asked.
export const depositPayload = (draft: DepositDraft, amount: number) => (amount > 0 && draft.wallet ? { wallet: draft.wallet, txn: draft.txn.trim(), screenshot: draft.screenshot } : undefined);

interface Props {
  payments: BookingPayments | null | undefined;
  amount: number;
  accent: string;
  dark: boolean;
  value: DepositDraft;
  onChange: (v: DepositDraft) => void;
}

export const DepositPay: React.FC<Props> = ({ payments, amount, accent, dark, value, onChange }) => {
  const [copied, setCopied] = useState(false);
  const [uploading, setUploading] = useState(false);
  const wallets = usableWallets(payments);
  const chosen = wallets.find((w) => w.id === value.wallet);
  const setup = chosen && payments ? payments.wallets[chosen.id] : null;
  const text = dark ? 'text-white' : 'text-neutral-800';
  const sub = dark ? 'text-white/80' : 'text-neutral-600';
  const field = `w-full rounded-lg border px-2.5 py-1.5 text-[11px] outline-none ${dark ? 'bg-white/10 border-white/25 text-white placeholder:text-white/50' : 'bg-white border-neutral-200 text-neutral-800'}`;
  const steps = (setup?.instructions || '').split('\n').map((l) => l.trim()).filter(Boolean);

  const copy = async () => {
    if (!setup) return;
    try {
      await navigator.clipboard.writeText(setup.account);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard blocked: the account is still shown to copy by hand.
    }
  };

  const pickShot = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    const url = await uploadImageFile(file);
    setUploading(false);
    if (url) onChange({ ...value, screenshot: url });
  };

  return (
    <div className={`rounded-xl border p-2.5 space-y-2 ${dark ? 'bg-white/5 border-white/15' : 'bg-neutral-50 border-neutral-200'}`}>
      <div className={`text-[11px] font-black ${text}`}>عربون مطلوب: {amount} {payments?.currency}</div>
      {wallets.length === 0 ? (
        <div className="text-[10px] font-bold text-amber-700">الدفع غير جاهز بعد: المالك لازم يضيف حساب محفظة من «إعدادات الحجز».</div>
      ) : (
        <>
          <div className="flex flex-wrap gap-1">
            {wallets.map((w) => (
              <button key={w.id} type="button" onClick={() => onChange({ ...value, wallet: w.id })}
                className={`px-2 h-7 rounded-lg border text-[10px] font-bold cursor-pointer ${value.wallet === w.id ? 'text-white' : text}`}
                style={value.wallet === w.id ? { backgroundColor: accent, borderColor: accent } : undefined}>{w.label}</button>
            ))}
          </div>
          {setup && chosen && (
            <div className={`space-y-1.5 text-[10px] ${sub}`}>
              <div>حوّل العربون إلى {setup.holderName ? <b>{setup.holderName}</b> : 'الحساب'} ({DEPOSIT_WALLETS.find((w) => w.id === chosen.id)?.accountLabel}):</div>
              <div className="flex items-center gap-2">
                <b dir="ltr" className={`text-[12px] ${text}`}>{setup.account}</b>
                <button type="button" onClick={copy} className={`inline-flex items-center gap-1 text-[10px] font-bold cursor-pointer ${text}`}>{copied ? <Check size={12} /> : <Copy size={12} />}{copied ? 'تم النسخ' : 'نسخ'}</button>
              </div>
              {setup.qrImage && <img src={setup.qrImage} alt="QR" className="w-24 h-24 rounded-lg border border-neutral-200 object-contain bg-white" referrerPolicy="no-referrer" />}
              {steps.length > 0 && <ol className="list-decimal pr-4 space-y-0.5">{steps.map((l, i) => <li key={i}>{l}</li>)}</ol>}
              <input className={field} dir="ltr" placeholder="رقم عملية التحويل" value={value.txn} onChange={(e) => onChange({ ...value, txn: e.target.value })} />
              <label className={`inline-flex items-center gap-1.5 text-[10px] font-bold cursor-pointer ${text}`}>
                {uploading ? <Loader2 size={13} className="animate-spin" /> : <ImagePlus size={13} />}
                {value.screenshot ? 'تغيير صورة التحويل' : 'صورة التحويل (اختياري)'}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => pickShot(e.target.files?.[0])} />
              </label>
              {value.screenshot && <img src={value.screenshot} alt="" className="w-20 h-20 rounded-lg border border-neutral-200 object-cover" referrerPolicy="no-referrer" />}
            </div>
          )}
        </>
      )}
    </div>
  );
};
