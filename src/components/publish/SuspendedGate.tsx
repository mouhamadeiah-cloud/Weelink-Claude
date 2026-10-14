// Shows «غير متاحة مؤقتاً» instead of a published page (or a restaurant's site) whose owner the
// platform admin froze or cancelled (suspendedAccounts/{owner}, see api/admin.ts).
import React, { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';

export const SuspendedGate: React.FC<{ owner: string; children: React.ReactNode }> = ({ owner, children }) => {
  const [suspended, setSuspended] = useState(false);
  useEffect(() => {
    // A failed check must never hide a working page.
    getDoc(doc(db, 'suspendedAccounts', owner)).then((s) => setSuspended(s.exists())).catch(() => undefined);
  }, [owner]);
  if (!suspended) return <>{children}</>;
  return (
    <div dir="rtl" className="min-h-[100dvh] flex flex-col items-center justify-center gap-3 bg-[#f5f5f7] text-center p-6 font-sans">
      <span className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#0071e3] to-[#40a9ff] text-white flex items-center justify-center text-xl font-bold">W</span>
      <div className="text-xl font-black text-[#1d1d1f]">هذه الصفحة غير متاحة مؤقتاً</div>
      <p className="text-sm text-black/50">تواصل مع صاحب الصفحة، أو اصنع صفحتك مجاناً على Weelink.</p>
    </div>
  );
};
