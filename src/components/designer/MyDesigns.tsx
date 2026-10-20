// «تصاميمي»: the designs the designer sent to the gallery, with where each one stands (read from gallerySlides).
import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { db } from '../../services/firebase';

const SLIDE_STATUS: Record<string, { text: string; cls: string }> = {
  approved: { text: 'بالمعرض', cls: 'bg-brand/10 text-brand' },
  pending: { text: 'قيد المراجعة', cls: 'bg-bg text-muted' },
  rejected: { text: 'مرفوض', cls: 'bg-danger/10 text-danger' },
};

export const MyDesigns: React.FC<{ uid: string }> = ({ uid }) => {
  const [slides, setSlides] = useState<{ id: string; name: string; status: string }[] | null>(null);
  useEffect(() => {
    getDocs(query(collection(db, 'gallerySlides'), where('designerUid', '==', uid)))
      .then((snap) => setSlides(snap.docs.map((d) => ({ id: d.id, name: String(d.data().name || ''), status: String(d.data().status || 'pending') }))))
      .catch(() => setSlides([]));
  }, [uid]);
  if (slides === null) return <p className="flex items-center gap-2 text-sm text-muted"><Loader2 size={15} className="animate-spin" /> عم نجيب تصميماتك…</p>;
  if (slides.length === 0) return <p className="text-sm text-muted">ما بعتت تصاميم للمعرض لسا. افتح مسودة وصدّرها من زر «تصدير للمعرض».</p>;
  return (
    <ul className="divide-y divide-line">
      {slides.map((s) => {
        const st = SLIDE_STATUS[s.status] || SLIDE_STATUS.pending;
        return (
          <li key={s.id} className="flex items-center justify-between gap-3 py-2.5">
            <span className="truncate text-sm font-bold">{s.name || 'بدون اسم'}</span>
            <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${st.cls}`}>{st.text}</span>
          </li>
        );
      })}
    </ul>
  );
};
