// «استوديو المصمم»: the designer's own screen (the designer's role, Eyad 21 Oct). It is where a designer lands after
// signing in as one: their drafts, their designs in the gallery, their orders and numbers. The editor opens from here
// on a draft and comes back here; nothing of the user's projects is on this screen.
import React from 'react';
import type { User } from 'firebase/auth';
import { BarChart3, ClipboardList, FileText, LogOut, Palette, Plus, Presentation, Trash2, UserRound } from 'lucide-react';
import { AttentionDot } from '../../services/orderAttention';
import { DESIGN_KIND_LABEL, type DesignKind } from '../../data/slideCategories';
import { MAX_DRAFTS, type DraftMeta } from '../../services/designerDrafts';
import { ROLE_LABEL, useRoleState } from '../../services/accountRole';
import { MyDesigns } from './MyDesigns';

interface Props {
  user: User;
  name: string;
  drafts: DraftMeta[];
  busy: boolean;
  attention: number;
  onOpenDraft: (slot: string) => void;
  onNewDraft: (kind: DesignKind) => void;
  onDeleteDraft: (slot: string) => void;
  onOrders: () => void;
  onDashboard: () => void;
  onAccount: () => void;
  onLogout: () => void;
}

const card = 'rounded-card border border-line bg-surface p-5 sm:p-6';
const dateText = (ms: number) => (ms ? new Date(ms).toLocaleDateString('ar') : '');

export const StudioPage: React.FC<Props> = ({ user, name, drafts, busy, attention, onOpenDraft, onNewDraft, onDeleteDraft, onOrders, onDashboard, onAccount, onLogout }) => {
  const roleState = useRoleState();
  const full = drafts.length >= MAX_DRAFTS;
  return (
    <div dir="rtl" className="min-h-screen bg-bg text-ink">
      <header className="sticky top-0 z-30 border-b border-line bg-ink text-white">
        <nav className="mx-auto flex h-12 max-w-6xl items-center gap-2 px-3 sm:px-4" aria-label="استوديو المصمم">
          <span className="flex h-7 w-7 items-center justify-center rounded-ctl bg-brand text-sm font-bold">W</span>
          <span className="flex items-center gap-1.5 text-sm font-bold"><Palette size={15} /> استوديو المصمم</span>
          <span className="flex-1" />
          {roleState.switchTo && (
            <button type="button" onClick={() => roleState.switchTo?.('user')} title="الدخول كمستخدم" className="inline-flex items-center gap-1.5 rounded-md border border-white/25 px-2 py-1 text-xs font-medium text-white/80 hover:text-white">
              <span className="font-bold text-white">{ROLE_LABEL.designer}</span><span aria-hidden="true">⇄</span><span>{ROLE_LABEL.user}</span>
            </button>
          )}
          <button type="button" onClick={onAccount} className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-white/80 hover:text-white"><UserRound size={15} /> حسابي</button>
          <button type="button" onClick={onLogout} className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-white/80 hover:text-white"><LogOut size={15} /> خروج</button>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl space-y-5 px-3 py-6 sm:px-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-heading font-bold">{name ? `أهلاً ${name}` : 'استوديو المصمم'}</h1>
            <p className="text-sm text-muted">مسوداتك وتصاميمك في المعرض وطلبات الزبائن، كلها هون.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={onDashboard} className="h-9 px-3.5 rounded-ctl border border-line bg-surface text-xs font-bold inline-flex items-center gap-1.5 hover:border-brand/40"><BarChart3 size={14} /> لوحتي</button>
            <button type="button" onClick={onOrders} className="h-9 px-3.5 rounded-ctl border border-line bg-surface text-xs font-bold inline-flex items-center gap-1.5 hover:border-brand/40"><ClipboardList size={14} /> طلبات التصميم <AttentionDot n={attention} /></button>
          </div>
        </div>

        <section className={card} aria-labelledby="drafts-title">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 id="drafts-title" className="text-heading font-bold">مسوداتي <span className="text-xs font-normal text-muted tabular-nums">{drafts.length}/{MAX_DRAFTS}</span></h2>
            <div className="flex flex-wrap gap-2">
              {([['slide', 'شريحة جديدة', Presentation, 'مسودة شريحة واحدة'], ['page', 'صفحة جديدة', FileText, 'مسودة صفحة: حتى ثلاث شرائح مع شريط تنقل']] as const).map(([kind, label, Icon, hint]) => (
                <button key={kind} type="button" disabled={busy || full} onClick={() => onNewDraft(kind)} title={full ? `الحد الأقصى ${MAX_DRAFTS} مسودات` : hint} className="h-9 px-3.5 rounded-ctl border border-dashed border-brand/40 text-brand text-xs font-bold inline-flex items-center gap-1.5 hover:bg-brand/5 disabled:opacity-50 disabled:cursor-not-allowed">
                  <Plus size={14} /><Icon size={14} /> {label}
                </button>
              ))}
            </div>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {drafts.map((d, i) => (
              <li key={d.slot} className="flex items-center gap-2 rounded-ctl border border-line bg-bg p-3">
                <button type="button" disabled={busy} onClick={() => onOpenDraft(d.slot)} className="flex min-w-0 flex-1 items-center gap-3 text-right disabled:cursor-wait">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-ctl bg-brand/10 text-brand">{d.kind === 'page' ? <FileText size={18} /> : <Presentation size={18} />}</span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold">{d.name || `مسودة ${i + 1}`}</span>
                    <span className="block text-xs text-muted">{DESIGN_KIND_LABEL[d.kind]}{d.updatedAt ? ` · ${dateText(d.updatedAt)}` : ''}</span>
                  </span>
                </button>
                {drafts.length > 1 && (
                  <button type="button" disabled={busy} onClick={() => onDeleteDraft(d.slot)} aria-label={`حذف ${d.name || `مسودة ${i + 1}`}`} title="حذف المسودة" className="flex h-8 w-8 shrink-0 items-center justify-center text-faint hover:text-danger"><Trash2 size={15} /></button>
                )}
              </li>
            ))}
          </ul>
        </section>

        <section className={card} aria-labelledby="designs-title">
          <h2 id="designs-title" className="mb-4 text-heading font-bold">تصاميمي في المعرض</h2>
          <MyDesigns uid={user.uid} />
        </section>
      </main>
    </div>
  );
};
