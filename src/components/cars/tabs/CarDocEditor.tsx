// One document (sale contract, test drive form or handover record) in a window over the admin: the car
// and the customer, the fields filled from what the showroom knows, both signatures drawn on screen,
// and the A4 page beside it as it will print. Saved documents stay on the car and the customer.
import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Printer, FileDown, Save, Trash2, Lock, Pencil } from 'lucide-react';
import { CarAdminData, CarDocType, CarDocument } from '../carTypes';
import { carSubtitle, carTitle } from '../carModel';
import { buildDocHtml, docTypeLabel, DOC_GROUPS, HANDOVER_CHECKS, isSigned, newDocument, prefillDoc, printDoc, SIGNER_LABELS } from '../carDocs';
import { Card, Field, inputClass, textareaClass, PrimaryButton, GhostButton, uploadImageFile } from '../../shop/adminUi';
import { newId } from '../../shop/shopTypes';
import { SignaturePad } from './SignaturePad';

export interface DocEditorTarget {
  type: CarDocType;
  carId: string;
  customerId?: string;
  docId?: string;
}

interface Props {
  data: CarAdminData;
  update: (fn: (d: CarAdminData) => CarAdminData) => void;
  target: DocEditorTarget;
  onClose: () => void;
}

// A drawn signature is kept as an uploaded image once the document is saved.
// When the upload cannot finish (offline, no storage), the small drawn image itself is kept.
const storeSignature = async (value: string) => {
  if (!value.startsWith('data:')) return value;
  try {
    const blob = await (await fetch(value)).blob();
    const upload = uploadImageFile(new File([blob], `signature-${Date.now()}.png`, { type: blob.type || 'image/png' }));
    const timeout = new Promise<null>((r) => setTimeout(() => r(null), 8000));
    return (await Promise.race([upload, timeout])) || value;
  } catch {
    return value;
  }
};

export const CarDocEditor: React.FC<Props> = ({ data, update, target, onClose }) => {
  const saved = target.docId ? data.documents.find((d) => d.id === target.docId) : undefined;
  const [doc, setDoc] = useState<CarDocument>(() => {
    if (saved) return saved;
    const car = data.cars.find((c) => c.id === target.carId);
    const customerId = target.customerId ?? (car?.sale?.customerId || car?.reservation?.customerId || '');
    return newDocument(target.type, data, target.carId, customerId);
  });
  const [unlocked, setUnlocked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [dirty, setDirty] = useState(false);

  const stored = doc.id ? data.documents.find((d) => d.id === doc.id) : undefined;
  const locked = !!stored && isSigned(stored) && !unlocked;
  const car = data.cars.find((c) => c.id === doc.carId);
  const customer = data.customers.find((c) => c.id === doc.customerId);
  const html = useMemo(() => buildDocHtml(doc, data), [doc, data]);

  const close = () => {
    if (dirty && !window.confirm('لم تُحفظ التغييرات. إغلاق الورقة بدونها؟')) return;
    onClose();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); close(); } };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  });

  const change = (fn: (d: CarDocument) => CarDocument) => {
    setDoc(fn);
    setDirty(true);
    setNotice('');
  };
  const setField = (key: string, value: string) => change((d) => ({ ...d, fields: { ...d.fields, [key]: value } }));

  // Picking another car or customer refills only the fields that still hold what was filled in.
  const repick = (carId: string, customerId: string) =>
    change((d) => {
      const before = prefillDoc(d.type, data, data.cars.find((c) => c.id === d.carId), data.customers.find((c) => c.id === d.customerId));
      const after = prefillDoc(d.type, data, data.cars.find((c) => c.id === carId), data.customers.find((c) => c.id === customerId));
      const fields = { ...d.fields };
      Object.keys(after).forEach((k) => { if ((fields[k] || '') === (before[k] || '')) fields[k] = after[k]; });
      return { ...d, carId, customerId, fields };
    });

  const save = async () => {
    if (!doc.carId) return setNotice('اختر السيارة.');
    setSaving(true);
    try {
      const [showroomSignature, customerSignature] = await Promise.all([storeSignature(doc.showroomSignature), storeSignature(doc.customerSignature)]);
      const final: CarDocument = { ...doc, id: doc.id || newId('doc'), showroomSignature, customerSignature, updatedAt: new Date().toISOString() };
      update((d) => ({
        ...d,
        documents: d.documents.some((x) => x.id === final.id) ? d.documents.map((x) => (x.id === final.id ? final : x)) : [final, ...d.documents],
      }));
      setDoc(final);
      setDirty(false);
      setUnlocked(false);
      setNotice(isSigned(final) ? 'حُفظت الورقة موقّعة.' : 'حُفظت الورقة. يمكنك التوقيع لاحقًا.');
    } finally {
      setSaving(false);
    }
  };

  const remove = () => {
    if (!doc.id) return onClose();
    if (!window.confirm(`حذف ${docTypeLabel(doc.type)} ${doc.number}؟`)) return;
    update((d) => ({ ...d, documents: d.documents.filter((x) => x.id !== doc.id) }));
    onClose();
  };

  const unlock = () => {
    if (!window.confirm('التعديل يمسح التوقيعين، ويجب التوقيع من جديد. متابعة؟')) return;
    setUnlocked(true);
    change((d) => ({ ...d, showroomSignature: '', customerSignature: '' }));
  };

  const [l1, l2] = SIGNER_LABELS[doc.type];
  const carOptions = data.cars;

  return createPortal(
    <div data-car-doc-editor className="fixed inset-0 z-[1000003] bg-black/30 flex items-center justify-center p-2 sm:p-6" onMouseDown={close}>
      <div dir="rtl" role="dialog" aria-label={docTypeLabel(doc.type)} className="w-full max-w-6xl h-full max-h-[900px] bg-[#f5f5f7] rounded-3xl shadow-[0_30px_80px_rgba(0,0,0,0.35)] flex flex-col overflow-hidden text-right font-sans" onMouseDown={(e) => e.stopPropagation()}>
        <header className="flex items-center gap-3 px-4 sm:px-6 h-16 bg-white border-b border-neutral-200 shrink-0">
          <div className="flex-1 min-w-0">
            <div className="text-sm font-black text-[#1d1d1f] truncate">{docTypeLabel(doc.type)} <span dir="ltr" className="text-neutral-400">{doc.number}</span></div>
            <div className="text-[10px] text-neutral-400 font-bold truncate">{car ? `${carTitle(car)} · ${carSubtitle(car)}` : 'بدون سيارة'}{customer ? ` · ${customer.name}` : ''}</div>
          </div>
          <GhostButton onClick={() => printDoc(doc, data, false)} className="h-9 flex items-center gap-1.5"><Printer size={14} /> طباعة A4</GhostButton>
          <GhostButton onClick={() => printDoc(doc, data, true)} className="h-9 hidden sm:flex items-center gap-1.5"><FileDown size={14} /> حفظ PDF</GhostButton>
          <button type="button" onClick={close} className="w-9 h-9 rounded-xl hover:bg-neutral-100 text-neutral-500 flex items-center justify-center cursor-pointer" aria-label="إغلاق"><X size={18} /></button>
        </header>

        <div className="flex-1 min-h-0 grid lg:grid-cols-2 overflow-y-auto lg:overflow-hidden">
          <div className="lg:overflow-y-auto p-3 sm:p-5 space-y-4">
            {locked && (
              <div className="rounded-2xl bg-green-50 border border-green-100 p-3 flex items-center gap-2 text-xs font-bold text-[#1e7a34]">
                <Lock size={15} className="shrink-0" />
                <span className="flex-1">الورقة موقّعة من الطرفين ومقفلة.</span>
                <button type="button" onClick={unlock} className="h-8 px-3 rounded-lg bg-white border border-green-200 flex items-center gap-1 cursor-pointer"><Pencil size={12} /> تعديل (يمسح التوقيعين)</button>
              </div>
            )}
            <fieldset disabled={locked} className="space-y-4 min-w-0">
              <Card title="السيارة والزبون">
                <div className="grid sm:grid-cols-2 gap-3">
                  <Field label="السيارة">
                    <select className={inputClass} value={doc.carId} onChange={(e) => repick(e.target.value, doc.customerId)}>
                      <option value="">اختر سيارة</option>
                      {carOptions.map((c) => <option key={c.id} value={c.id}>{carTitle(c)} {c.year || ''} {c.stockNumber ? `(${c.stockNumber})` : ''}</option>)}
                    </select>
                  </Field>
                  <Field label={doc.type === 'testDrive' ? 'السائق من الزبائن' : 'الزبون'}>
                    <select className={inputClass} value={doc.customerId} onChange={(e) => repick(doc.carId, e.target.value)}>
                      <option value="">بدون (اكتب البيانات يدويًا)</option>
                      {data.customers.map((c) => <option key={c.id} value={c.id}>{c.name}{c.phone ? ` · ${c.phone}` : ''}</option>)}
                    </select>
                  </Field>
                  <Field label="تاريخ الورقة"><input type="date" className={inputClass} value={doc.date} onChange={(e) => change((d) => ({ ...d, date: e.target.value }))} /></Field>
                </div>
              </Card>

              {DOC_GROUPS[doc.type].map((g) => (
                <Card key={g.title} title={g.title}>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {g.fields.map((f) => (
                      <div key={f.key} className={f.wide ? 'sm:col-span-2' : ''}>
                        <Field label={f.label}>
                          <input type={f.type || 'text'} dir={f.ltr ? 'ltr' : undefined} className={inputClass} value={doc.fields[f.key] || ''} onChange={(e) => setField(f.key, e.target.value)} />
                        </Field>
                      </div>
                    ))}
                  </div>
                </Card>
              ))}

              {doc.type === 'handover' && (
                <Card title="الملحقات والحالة عند التسليم">
                  <div className="grid sm:grid-cols-2 gap-1.5">
                    {HANDOVER_CHECKS.map((c) => (
                      <label key={c.key} className="flex items-center gap-2 text-xs font-bold text-neutral-700 cursor-pointer">
                        <input type="checkbox" className="w-4 h-4 accent-[#0071e3]" checked={!!doc.checks[c.key]} onChange={(e) => change((d) => ({ ...d, checks: { ...d.checks, [c.key]: e.target.checked } }))} />
                        {c.label}
                      </label>
                    ))}
                  </div>
                </Card>
              )}

              <Card title={doc.type === 'contract' ? 'البنود' : 'الشروط'}>
                <textarea className={`${textareaClass} min-h-[150px]`} value={doc.terms} onChange={(e) => change((d) => ({ ...d, terms: e.target.value }))} />
                <p className="text-[10px] text-neutral-400">كل سطر بند مستقل. النص الافتراضي يُعدَّل من «إعدادات المعرض ← الأوراق والعقود».</p>
              </Card>
            </fieldset>

            <Card title="التوقيع">
              <div className="grid sm:grid-cols-2 gap-3">
                <SignaturePad label={l1} value={doc.showroomSignature} disabled={locked} onChange={(v) => change((d) => ({ ...d, showroomSignature: v }))} />
                <SignaturePad label={l2} value={doc.customerSignature} disabled={locked} onChange={(v) => change((d) => ({ ...d, customerSignature: v }))} />
              </div>
            </Card>

            <div className="flex flex-wrap items-center gap-2 pb-2">
              {!locked && <PrimaryButton onClick={save} disabled={saving} className="flex items-center gap-1.5"><Save size={14} /> {saving ? 'جارٍ الحفظ...' : 'حفظ الورقة'}</PrimaryButton>}
              {doc.id && <GhostButton onClick={remove} className="h-10 flex items-center gap-1.5 hover:text-red-500"><Trash2 size={14} /> حذف</GhostButton>}
              {notice && <span className="text-xs font-bold text-neutral-600">{notice}</span>}
            </div>
          </div>

          <div className="bg-neutral-200/70 p-3 sm:p-5 flex flex-col min-h-[620px] lg:min-h-0">
            <div className="text-[11px] font-bold text-neutral-500 mb-2">معاينة الصفحة كما تُطبع</div>
            <iframe title="معاينة الورقة" srcDoc={html} className="flex-1 w-full rounded-xl bg-white shadow-sm border border-neutral-200" />
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
