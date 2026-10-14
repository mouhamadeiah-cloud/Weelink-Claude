// «إعدادات الفوترة»: the company details printed at the top of every invoice.
import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { AdminError, Company, adminGetCompany, adminSetCompany } from '../../services/adminApi';

const FIELDS: { key: keyof Company; label: string; long?: boolean }[] = [
  { key: 'name', label: 'اسم الشركة' },
  { key: 'address', label: 'العنوان' },
  { key: 'phone', label: 'الهاتف' },
  { key: 'email', label: 'الإيميل' },
  { key: 'taxNo', label: 'الرقم الضريبي (اختياري)' },
  { key: 'footer', label: 'سطر أسفل الفاتورة', long: true },
];

export const BillingSettings: React.FC<{ onSessionEnd: () => void }> = ({ onSessionEnd }) => {
  const [company, setCompany] = useState<Company | null>(null);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    adminGetCompany().then((r) => setCompany(r.company)).catch((e) => ((e as AdminError)?.code === 'session' ? onSessionEnd() : setMsg('تعذّر التحميل.')));
  }, [onSessionEnd]);

  const save = async () => {
    if (!company) return;
    setBusy(true);
    setMsg('');
    try {
      setCompany((await adminSetCompany(company)).company);
      setMsg('تم الحفظ.');
    } catch (e) {
      if ((e as AdminError)?.code === 'session') return onSessionEnd();
      setMsg('تعذّر الحفظ.');
    }
    setBusy(false);
  };

  if (!company) return msg ? <p className="text-small text-danger">{msg}</p> : <Loader2 className="h-5 w-5 animate-spin text-muted" />;
  return (
    <section className="flex max-w-lg flex-col gap-3">
      <h1 className="text-title font-semibold">إعدادات الفوترة</h1>
      <p className="text-small text-muted">تظهر هذه البيانات أعلى كل فاتورة تُرسل للمشتركين.</p>
      {FIELDS.map((f) => (
        <label key={f.key} className="text-small text-muted">{f.label}
          <input value={company[f.key]} onChange={(e) => setCompany({ ...company, [f.key]: e.target.value })} className="mt-1 w-full rounded-ctl border border-line bg-surface px-3 py-2 text-body text-ink outline-none focus:border-brand" />
        </label>
      ))}
      <div className="flex items-center gap-3">
        <button disabled={busy} onClick={save} className="inline-flex items-center gap-2 rounded-ctl bg-brand px-4 py-2 text-white hover:bg-brand-hover disabled:opacity-50">{busy && <Loader2 className="h-4 w-4 animate-spin" />} حفظ</button>
        {msg && <span className="text-small text-muted">{msg}</span>}
      </div>
    </section>
  );
};
