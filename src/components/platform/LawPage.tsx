// «قانون الصفحة»: the law every page and every design in the gallery is under, read from platformSettings/pageLaw
// (written in the admin site). A screen of its own, under the same top bar.
import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { readPageLaw, type PageLaw } from '../../services/gallery';
import { PlatformNav } from './PlatformNav';
import type { ComponentProps } from 'react';

type NavProps = Omit<ComponentProps<typeof PlatformNav>, 'current' | 'extra'>;

export const LawPage: React.FC<NavProps> = (nav) => {
  const [law, setLaw] = useState<PageLaw | null | undefined>(undefined);
  useEffect(() => {
    readPageLaw().then(setLaw).catch(() => setLaw(null));
  }, []);
  return (
    <div dir="rtl" className="min-h-screen bg-bg text-ink">
      <PlatformNav {...nav} current="law" />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
        <h1 className="text-title sm:text-display font-bold">قانون الصفحة</h1>
        {law && <p className="mt-1 text-xs text-muted">النسخة {law.version.toLocaleString('ar-SY')}</p>}
        <div className="mt-6 rounded-card border border-line bg-surface p-5 sm:p-8">
          {law === undefined ? (
            <div className="flex justify-center py-6 text-faint"><Loader2 className="animate-spin" /></div>
          ) : law ? (
            <p className="whitespace-pre-wrap text-sm leading-loose sm:text-base">{law.text}</p>
          ) : (
            <p className="text-sm text-muted">قانون الصفحة غير منشور بعد.</p>
          )}
        </div>
      </main>
    </div>
  );
};
