// The packages of the chosen kind, the start page's step right after the kind (Eyad, 12 Oct): what
// each one holds, a drawing of what comes with it, its price, and the extras. Picking one starts the
// questions. Nothing is charged yet (subscriptions come later); the choice is remembered.
import React, { useState } from 'react';
import { ArrowLeft, Check, Plus } from 'lucide-react';
import type { ProjectType } from '../shop/shopTypes';
import { ADD_ONS, PLANS, YEARLY_DISCOUNT, formatPounds, readPlan, savePlan, yearlyPrice } from '../../data/plans';
import { PlanArt } from './PlanArt';


interface PlanPickerProps {
  kind: ProjectType;
  // Whose choice it is (the account, or the visitor before signing up).
  owner: string;
  title: string;
  onPicked: (planId: string) => void;
}

export const PlanPicker: React.FC<PlanPickerProps> = ({ kind, owner, title, onPicked }) => {
  const plans = PLANS[kind];
  const [yearly, setYearly] = useState(false);
  const before = readPlan(owner, kind);

  const pick = (id: string) => {
    savePlan(owner, kind, id);
    onPicked(id);
  };

  return (
    <section className="max-w-6xl mx-auto px-4 py-5 sm:py-8 space-y-5" aria-labelledby="plans-title">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-bold text-brand">{title}</p>
          <h1 id="plans-title" className="text-title font-bold">اختر باقتك</h1>
          <p className="text-sm text-muted">بعد ما تختار، منبلّش بالأسئلة. فيك تغيّر الباقة بأي وقت، والدفع لسا ما بلّش.</p>
        </div>
        <div className="inline-flex rounded-full bg-surface border border-line p-1 text-xs font-bold" role="group" aria-label="طريقة الدفع">
          {[false, true].map((y) => (
            <button
              key={String(y)}
              type="button"
              onClick={() => setYearly(y)}
              aria-pressed={yearly === y}
              className={`rounded-full px-3.5 py-1.5 transition ${yearly === y ? 'bg-brand text-white' : 'text-muted hover:text-ink'}`}
            >
              {y ? `سنوي (أرخص ${Math.round(YEARLY_DISCOUNT * 100)}٪)` : 'شهري'}
            </button>
          ))}
        </div>
      </div>

      <div className={`grid gap-3 sm:gap-4 ${plans.length === 2 ? 'sm:grid-cols-2 max-w-3xl' : 'sm:grid-cols-3'}`}>
        {plans.map((p, i) => {
          const was = before === p.id;
          return (
            <article
              key={p.id}
              style={{ animationDelay: `${80 + i * 90}ms` }}
              className={`wl-rise relative flex flex-col rounded-card bg-surface p-5 border-2 transition ${p.popular ? 'border-brand' : 'border-line hover:border-faint'}`}
            >
              {p.popular && (
                <span className="absolute -top-3 left-4 text-xs font-bold text-white bg-brand rounded-full px-2.5 py-0.5">الأكثر طلباً</span>
              )}
              <PlanArt art={p.art} kind={kind} />
              <div className="mt-4 space-y-0.5">
                <h2 className="text-heading font-bold">{p.monthly === 0 ? 'الباقة المجانية' : `باقة ${p.name}`}</h2>
                <p className="text-sm text-muted">{p.tagline}</p>
              </div>
              <div className="my-4">
                {p.monthly === 0 ? (
                  <span className="text-title font-bold">مجاناً</span>
                ) : yearly ? (
                  <>
                    <span className="text-title font-bold">{formatPounds(yearlyPrice(p.monthly))}</span>
                    <span className="text-xs text-muted font-bold"> / بالسنة</span>
                    <span className="block text-xs font-bold mt-1 text-brand">
                      بدل {formatPounds(p.monthly * 12)}، ومعها دومين خاص مجاناً
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-title font-bold">{formatPounds(p.monthly)}</span>
                    <span className="text-xs text-muted font-bold"> / بالشهر</span>
                  </>
                )}
              </div>
              <ul className="space-y-2 flex-1">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm leading-relaxed">
                    <Check size={16} className="mt-0.5 shrink-0 text-brand" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => pick(p.id)}
                className={`mt-5 w-full inline-flex items-center justify-center gap-1.5 rounded-ctl py-3 text-sm font-bold transition ${p.popular ? 'bg-brand hover:bg-brand-hover text-white' : 'bg-bg text-ink hover:bg-line'}`}
              >
                {was ? 'كمّل بهالباقة' : 'اختار هالباقة'}
                <ArrowLeft size={15} />
              </button>
            </article>
          );
        })}
      </div>

      <div className="rounded-card bg-surface border border-line p-5 space-y-3">
        <h3 className="text-heading font-bold">إضافات</h3>
        <ul className="grid sm:grid-cols-2 gap-2">
          {ADD_ONS[kind].map((a) => (
            <li key={a.name} className="flex items-center gap-2.5 rounded-ctl bg-bg px-3 py-2.5 text-sm">
              <Plus size={15} className="shrink-0 text-brand" />
              <span className="flex-1 font-bold">{a.name}</span>
              <span className="text-muted">{a.price}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};
