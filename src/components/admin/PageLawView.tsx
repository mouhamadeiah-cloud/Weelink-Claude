// «قانون الصفحة»: the terms a designer agrees to when exporting a slide to the gallery. What is saved
// here (platformSettings/pageLaw) is the only text designers see; every save raises its version, and
// each exported slide records the version it was agreed under. The first time, the editor opens on a
// draft (data/pageLawDefault.ts) that nothing shows to designers until it is saved.
import React, { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, Scale } from 'lucide-react';
import { AdminError, PageLaw, adminPageLaw, adminSetPageLaw } from '../../services/adminApi';
import { PAGE_LAW_DEFAULT } from '../../data/pageLawDefault';

const date = (ms: number) => (ms ? new Date(ms).toLocaleString('ar-SY', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—');

export const PageLawView: React.FC<{ onSessionEnd: () => void }> = ({ onSessionEnd }) => {
  const [law, setLaw] = useState<PageLaw | null>(null);
  const [text, setText] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    adminPageLaw()
      .then((r) => {
        setLaw(r.law);
        setText(r.law ? r.law.text : PAGE_LAW_DEFAULT);
        setLoaded(true);
      })
      .catch((e) => {
        if ((e as AdminError)?.code === 'session') return onSessionEnd();
        setError('تعذّر تحميل قانون الصفحة.');
      });
  }, [onSessionEnd]);

  const save = async () => {
    setBusy(true);
    setError('');
    setSaved(false);
    try {
      const r = await adminSetPageLaw(text);
      setLaw(r.law);
      setSaved(true);
    } catch (e) {
      const code = (e as AdminError)?.code;
      if (code === 'session') return onSessionEnd();
      setError(code === 'bad-text' ? 'النص قصير جداً أو طويل جداً (50 حرفاً على الأقل، 20000 على الأكثر).' : 'تعذّر الحفظ. جرّب مرة ثانية.');
    }
    setBusy(false);
  };

  const unchanged = !!law && law.text === text.trim();

  return (
    <section className="flex flex-col gap-4">
      <h1 className="flex items-center gap-2 text-title font-semibold"><Scale className="h-6 w-6 text-brand" /> قانون الصفحة</h1>
      <p className="text-small text-muted leading-relaxed">
        هذا النص هو المصدر الوحيد لما يوافق عليه المصمم قبل تصدير شريحته إلى المعرض، ويمكن تعديله دائماً. كل حفظ يرفع رقم النسخة، وكل شريحة تحفظ رقم النسخة التي وافق عليها مصممها.
      </p>

      {!loaded && !error && <Loader2 className="mx-auto mt-8 h-6 w-6 animate-spin text-muted" />}
      {loaded && (
        <>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-small">
            {law ? (
              <>
                <span className="rounded-full bg-success/10 px-3 py-0.5 font-medium text-success">منشور · النسخة {law.version}</span>
                <span className="text-muted">آخر تعديل: {date(law.updatedAt)} · {law.updatedBy}</span>
              </>
            ) : (
              <span className="rounded-full bg-warn/10 px-3 py-0.5 font-medium text-warn">لم يُنشر بعد: هذه مسودة أولية، والمصممون لا يستطيعون التصدير قبل حفظها</span>
            )}
          </div>
          <textarea
            value={text}
            onChange={(e) => { setText(e.target.value); setSaved(false); }}
            rows={26}
            dir="rtl"
            className="w-full rounded-card border border-line bg-surface p-4 text-body leading-loose text-ink outline-none focus:border-brand"
            aria-label="نص قانون الصفحة"
          />
          {error && <p role="alert" className="text-small text-danger">{error}</p>}
          <div className="flex flex-wrap items-center gap-3">
            <button onClick={save} disabled={busy || unchanged || text.trim().length < 50} className="inline-flex items-center justify-center gap-2 rounded-ctl bg-brand px-4 py-2.5 text-body font-medium text-white hover:bg-brand-hover disabled:opacity-50">
              {busy && <Loader2 className="h-4 w-4 animate-spin" />} {law ? 'حفظ نسخة جديدة' : 'حفظ ونشر'}
            </button>
            {saved && <span className="inline-flex items-center gap-1 text-small text-success"><CheckCircle2 className="h-4 w-4" /> انحفظ، النسخة {law?.version}</span>}
            <span className="text-tiny text-faint">{text.trim().length.toLocaleString('ar-SY')} حرف</span>
          </div>
        </>
      )}
      {!loaded && error && <p role="alert" className="text-small text-danger">{error}</p>}
    </section>
  );
};
