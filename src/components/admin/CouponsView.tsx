// «الكوبونات والتجربة»: codes the team gives out. A trial adds days of subscription, a gift adds Wee AI
// tokens, a discount takes a percent off one payment. Each subscriber can use a code once; the admin
// applies it from the subscriber's file (the payment is collected at the office).
import React, { useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { AdminError, Coupon, CouponKind, adminCouponSave, adminCouponToggle, adminCoupons } from '../../services/adminApi';

const inputCls = 'w-full rounded-ctl border border-line bg-surface px-3 py-2 text-small text-ink outline-none focus:border-brand';
const UNIT: Record<CouponKind, string> = { trial: 'يوم', tokens: 'توكن', discount: '%' };
const ERRORS: Record<string, string> = {
  'bad-code': 'الرمز: 3 أحرف على الأقل (إنكليزي وأرقام).', 'bad-value': 'القيمة غير صالحة (الخصم حتى 100، والتجربة حتى 365 يوماً).', 'bad-date': 'تاريخ الانتهاء غير صالح.',
};
const EMPTY = { code: '', kind: 'trial' as CouponKind, value: '', maxUses: '', expires: '', note: '' };

export const CouponsView: React.FC<{ onSessionEnd: () => void }> = ({ onSessionEnd }) => {
  const [rows, setRows] = useState<Coupon[] | null>(null);
  const [kinds, setKinds] = useState<Record<CouponKind, string>>({ trial: '', tokens: '', discount: '' });
  const [form, setForm] = useState<typeof EMPTY | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const fail = useCallback((e: unknown, fallback: string) => {
    if ((e as AdminError)?.code === 'session') return onSessionEnd();
    setError(ERRORS[(e as AdminError)?.code] || fallback);
  }, [onSessionEnd]);
  const load = useCallback(async () => {
    try {
      const r = await adminCoupons();
      setRows(r.rows);
      setKinds(r.kinds);
    } catch (e) {
      fail(e, 'تعذّر تحميل الكوبونات.');
    }
  }, [fail]);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!form) return;
    setBusy(true);
    setError('');
    try {
      await adminCouponSave({ code: form.code, kind: form.kind, value: Number(form.value), maxUses: Number(form.maxUses) || 0, expires: form.expires, note: form.note });
      setForm(null);
      await load();
    } catch (e) {
      fail(e, 'تعذّر الحفظ.');
    }
    setBusy(false);
  };
  const toggle = async (c: Coupon) => {
    setError('');
    try {
      await adminCouponToggle(c.code, !c.active);
      await load();
    } catch (e) {
      fail(e, 'تعذّر التغيير.');
    }
  };

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-title font-semibold">الكوبونات والتجربة</h1>
        {!form && <button onClick={() => { setForm(EMPTY); setError(''); }} className="rounded-ctl bg-brand px-3 py-2 text-small text-white hover:bg-brand-hover">كوبون جديد</button>}
      </div>
      {error && <p className="text-small text-danger">{error}</p>}

      {form && (
        <div className="flex flex-col gap-2 rounded-card border border-line bg-surface p-3">
          <div className="grid gap-2 sm:grid-cols-4">
            <input dir="ltr" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="الرمز مثل WELCOME7" className={inputCls} />
            <select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value as CouponKind })} className={inputCls}>
              {(Object.keys(kinds) as CouponKind[]).map((k) => <option key={k} value={k}>{kinds[k]}</option>)}
            </select>
            <input type="number" min={1} value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} placeholder={`القيمة (${UNIT[form.kind]})`} className={inputCls} />
            <input type="number" min={0} value={form.maxUses} onChange={(e) => setForm({ ...form, maxUses: e.target.value })} placeholder="أقصى استعمال (فارغ = بلا حد)" className={inputCls} />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="text-small text-muted">ينتهي (اختياري)<input type="date" value={form.expires} onChange={(e) => setForm({ ...form, expires: e.target.value })} className={`${inputCls} mt-1`} /></label>
            <label className="text-small text-muted">ملاحظة داخلية<input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} className={`${inputCls} mt-1`} /></label>
          </div>
          <div className="flex gap-2">
            <button disabled={busy || form.code.trim().length < 3 || !Number(form.value)} onClick={save} className="inline-flex items-center gap-1 rounded-ctl bg-brand px-3 py-1.5 text-small text-white hover:bg-brand-hover disabled:opacity-50">{busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />} حفظ</button>
            <button onClick={() => setForm(null)} className="rounded-ctl px-3 py-1.5 text-small hover:bg-bg">رجوع</button>
          </div>
        </div>
      )}

      {!rows ? <Loader2 className="h-5 w-5 animate-spin text-muted" /> : (
        <div className="overflow-x-auto rounded-card border border-line bg-surface">
          <table className="w-full min-w-[640px] text-right text-small">
            <thead className="border-b border-line text-muted"><tr>{['الرمز', 'النوع', 'القيمة', 'الاستعمال', 'ينتهي', 'الحالة'].map((h) => <th key={h} className="px-3 py-2 font-medium">{h}</th>)}</tr></thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.code} className="border-b border-line last:border-0">
                  <td className="px-3 py-2" dir="ltr">{c.code}{c.note && <div className="text-tiny text-faint" dir="rtl">{c.note}</div>}</td>
                  <td className="px-3 py-2">{kinds[c.kind] || c.kind}</td>
                  <td className="px-3 py-2 tabular-nums">{c.value.toLocaleString('ar-SY')} {UNIT[c.kind]}</td>
                  <td className="px-3 py-2 tabular-nums">{c.used}{c.maxUses ? ` / ${c.maxUses}` : ''}</td>
                  <td className="px-3 py-2">{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString('ar-SY', { dateStyle: 'medium' }) : '—'}</td>
                  <td className="px-3 py-2"><button onClick={() => toggle(c)} className={`hover:underline ${c.active ? 'text-success' : 'text-faint'}`}>{c.active ? 'فعّال (إيقاف)' : 'متوقف (تفعيل)'}</button></td>
                </tr>
              ))}
              {!rows.length && <tr><td colSpan={6} className="px-3 py-8 text-center text-muted">ما فيه كوبونات بعد.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};
