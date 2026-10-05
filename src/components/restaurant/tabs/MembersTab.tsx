// أعضاء الإدارة: the owner invites a partner or a manager with a link. Each member signs in with
// their own email and password and sees only what the owner allowed; the owner can change that or
// remove the member at any time. See services/members.ts.
import React, { useState } from 'react';
import { Trash2, UserPlus, Users, MessageCircle } from 'lucide-react';
import { auth } from '../../../services/firebase';
import { ALL_PERMS, PERMS, Perms, createInvite, deleteInvite, inviteUrl, removeMember, setMemberPerms, useInvites, useMembers } from '../../../services/members';
import { Card, Field, inputClass, PrimaryButton, GhostButton, EmptyState, Toggle } from '../../shop/adminUi';
import { CloudNotice, RestaurantTabProps } from './shared';
import { CopyLink } from './DevicesTab';

const PermToggles: React.FC<{ perms: Perms; onChange: (p: Perms) => void }> = ({ perms, onChange }) => (
  <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1">
    {PERMS.map((p) => (
      <div key={p.id}>
        <Toggle checked={perms[p.id]} onChange={(v) => onChange({ ...perms, [p.id]: v })} label={p.label} />
        <div className="text-[11px] text-neutral-400 font-bold -mt-0.5 mb-1">{p.hint}</div>
      </div>
    ))}
  </div>
);

const permSummary = (p: Perms) => {
  const on = PERMS.filter((x) => p[x.id]).map((x) => x.label);
  return on.length === PERMS.length ? 'كل الأقسام' : on.length ? on.join('، ') : 'لا شيء بعد';
};

const whatsappLink = (url: string, name: string) =>
  `https://wa.me/?text=${encodeURIComponent(`${name ? name + '، ' : ''}أدعوك لإدارة المطعم معي على Weelink. افتح الرابط وسجّل الدخول أو أنشئ حساباً بنفس بريدك الإلكتروني:\n${url}`)}`;

export const MembersTab: React.FC<RestaurantTabProps> = ({ ownerUid }) => {
  const members = useMembers(ownerUid);
  const invites = useInvites(ownerUid);
  const [draft, setDraft] = useState({ name: '', email: '', perms: { ...ALL_PERMS, accounts: false } as Perms });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [fresh, setFresh] = useState<{ url: string; name: string } | null>(null);

  const add = async () => {
    const email = draft.email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError('اكتب البريد الإلكتروني للعضو.');
      return;
    }
    if (email === (auth.currentUser?.email || '').toLowerCase()) {
      setError('هذا بريدك أنت.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const code = await createInvite(ownerUid, auth.currentUser?.uid || '', { ...draft, email });
      setFresh({ url: inviteUrl(ownerUid, code), name: draft.name.trim() });
      setDraft({ name: '', email: '', perms: { ...ALL_PERMS, accounts: false } });
    } catch (e) {
      console.warn('Could not create the invitation:', e);
      setError('تعذر إنشاء الدعوة. فقط صاحب الحساب يستطيع دعوة الأعضاء.');
    }
    setBusy(false);
  };

  return (
    <div className="space-y-4">
      <div className="p-3 rounded-2xl bg-white border border-neutral-200 text-xs text-neutral-600 font-bold leading-relaxed">
        أضف شريكاً أو مديراً يدير المطعم معك. كل عضو يدخل ببريده وكلمة سره هو، ويرى فقط الأقسام التي تسمح له بها. العمال لا يحتاجون هذا: يدخلون من الأجهزة برقمهم السري.
      </div>
      <CloudNotice error={members.error || invites.error} />

      <Card title="دعوة عضو جديد">
        <div className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="الاسم">
              <input className={inputClass} placeholder="مثلاً: سامر، المدير" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            </Field>
            <Field label="البريد الإلكتروني" hint="يجب أن يدخل العضو بنفس هذا البريد">
              <input className={inputClass} dir="ltr" type="email" placeholder="name@email.com" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} />
            </Field>
          </div>
          <div className="text-xs font-black text-neutral-500">ماذا يرى؟</div>
          <PermToggles perms={draft.perms} onChange={(perms) => setDraft({ ...draft, perms })} />
          {error && <div className="text-xs font-bold text-[#E03131]">{error}</div>}
          <PrimaryButton onClick={add} disabled={busy}>
            <span className="inline-flex items-center gap-1.5"><UserPlus size={15} />{busy ? 'جاري الإنشاء…' : 'أنشئ رابط الدعوة'}</span>
          </PrimaryButton>
          {fresh && (
            <div className="p-3 rounded-2xl bg-[#EBFBEE] border border-[#B2F2BB] space-y-2">
              <div className="text-xs font-black text-[#2B8A3E]">أرسل هذا الرابط للعضو. يعمل مرة واحدة وبنفس البريد فقط.</div>
              <CopyLink url={fresh.url} />
              <a href={whatsappLink(fresh.url, fresh.name)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl bg-[#25D366] text-white text-xs font-bold">
                <MessageCircle size={14} /> أرسل عبر واتساب
              </a>
            </div>
          )}
        </div>
      </Card>

      {invites.items.length > 0 && (
        <Card title="دعوات لم تُقبل بعد">
          <div className="space-y-2">
            {invites.items.map((i) => (
              <div key={i.code} className="flex flex-wrap items-center gap-2 p-3 rounded-2xl border border-neutral-200">
                <div className="flex-1 min-w-[180px]">
                  <div className="text-sm font-black">{i.name || i.email}</div>
                  <div className="text-[11px] text-neutral-400 font-bold" dir="ltr">{i.email}</div>
                  <div className="text-[11px] text-neutral-500 font-bold mt-0.5">{permSummary(i.perms)}</div>
                </div>
                <GhostButton onClick={() => navigator.clipboard?.writeText(inviteUrl(ownerUid, i.code)).catch(() => {})}>نسخ الرابط</GhostButton>
                <GhostButton onClick={() => deleteInvite(ownerUid, i.code).catch(() => {})} className="text-[#E03131]">
                  <span className="inline-flex items-center gap-1"><Trash2 size={13} />إلغاء</span>
                </GhostButton>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card title="الأعضاء">
        {members.items.length === 0 ? (
          <EmptyState text="لا يوجد أعضاء بعد" />
        ) : (
          <div className="space-y-3">
            {members.items.map((m) => (
              <div key={m.uid} className="p-3 rounded-2xl border border-neutral-200 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-neutral-100 text-neutral-500 flex items-center justify-center"><Users size={16} /></div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-black truncate">{m.name || m.email}</div>
                    <div className="text-[11px] text-neutral-400 font-bold truncate" dir="ltr">{m.email}</div>
                  </div>
                  <GhostButton
                    className="text-[#E03131]"
                    onClick={() => window.confirm(`إزالة ${m.name || m.email} من إدارة المطعم؟`) && removeMember(ownerUid, m.uid).catch(() => {})}
                  >
                    <span className="inline-flex items-center gap-1"><Trash2 size={13} />إزالة</span>
                  </GhostButton>
                </div>
                <PermToggles perms={m.perms} onChange={(p) => setMemberPerms(ownerUid, m.uid, p).catch(() => {})} />
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
