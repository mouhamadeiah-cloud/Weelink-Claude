// «فريق العمل» in every admin (Eyad, 24 Oct): the people who work for the business. A person who
// «يستقبل حجوزات» shows to visitors as a specialist to book with, and gets the emails of their own
// bookings. «ادعُه للإدارة» sends the existing invitation link to the person's email, so they can sign
// in to the admin. See services/team.ts and services/members.ts.
import React, { useMemo, useState } from 'react';
import { CalendarCheck2, Check, Mail, MessageCircle, Pencil, Phone, Trash2, UserPlus, Users } from 'lucide-react';
import { auth } from '../../services/firebase';
import { ALL_PERMS, Perms, createInvite, deleteInvite, inviteUrl, removeMember, useInvites, useMembers } from '../../services/members';
import { MAX_TEAM, TeamPerson, deletePerson, newPersonId, savePerson, useTeam } from '../../services/team';
import { Card, EmptyState, Field, GhostButton, inputClass, PrimaryButton, Toggle } from '../shop/adminUi';
import { CloudNotice, ImagePicker } from '../restaurant/tabs/shared';
import { CopyLink } from '../restaurant/tabs/DevicesTab';

const EMPTY: Omit<TeamPerson, 'id' | 'at'> = { name: '', role: '', photo: '', email: '', phone: '', takesBookings: true, invite: '' };
const isEmail = (v: string) => /^\S+@\S+\.\S+$/.test(v);

const whatsappLink = (url: string, name: string, phone: string) =>
  `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(`${name ? name + '، ' : ''}أدعوك لإدارة صفحتنا معي على Weelink. افتح الرابط وسجّل الدخول أو أنشئ حساباً بنفس بريدك الإلكتروني:\n${url}`)}`;

interface TeamSectionProps {
  owner: string;
  // The restaurant chooses what an invited person sees (its «الصلاحيات»); elsewhere a member sees the admin.
  invitePerms?: Perms;
  // The free page's admin shows the team as one section among others, with its own heading.
  asSection?: boolean;
}

export const TeamSection: React.FC<TeamSectionProps> = ({ owner, invitePerms = { ...ALL_PERMS, accounts: false }, asSection = false }) => {
  const team = useTeam(owner);
  const members = useMembers(owner);
  const invites = useInvites(owner);
  // The person being added or changed ('' while the form is closed).
  const [editing, setEditing] = useState<TeamPerson | null>(null);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [fresh, setFresh] = useState<{ id: string; url: string } | null>(null);

  const memberOf = useMemo(() => {
    const m = new Map<string, { uid: string }>();
    for (const x of members.items) if (x.invite) m.set(x.invite, { uid: x.uid });
    return m;
  }, [members.items]);
  const pending = useMemo(() => new Set(invites.items.map((i) => i.code)), [invites.items]);

  const startNew = () => {
    setError('');
    setEditing({ ...EMPTY, id: '', at: '' });
  };

  const save = async () => {
    if (!editing) return;
    const p = { ...editing, name: editing.name.trim(), email: editing.email.trim().toLowerCase() };
    if (p.name.length < 2) return setError('اكتب اسم الشخص.');
    if (p.email && !isEmail(p.email)) return setError('تأكد من الإيميل.');
    if (p.takesBookings && !p.email) return setError('اللي بيستقبل حجوزات لازم يكون إلو إيميل، ليوصله الحجز والتذكير.');
    const isNew = !p.id;
    if (isNew && team.people.length >= MAX_TEAM) return setError(`الحد ${MAX_TEAM} شخص.`);
    const person: TeamPerson = isNew ? { ...p, id: newPersonId(), at: new Date().toISOString() } : p;
    const all = isNew ? [...team.people, person] : team.people.map((x) => (x.id === person.id ? person : x));
    setBusy('save');
    setError('');
    try {
      await savePerson(owner, person, all);
      setEditing(null);
    } catch (e) {
      console.warn('Could not save the person:', e);
      setError('ما قدرنا نحفظ. بس صاحب الصفحة بيقدر يعدّل فريق العمل، وتأكد من الإنترنت.');
    }
    setBusy('');
  };

  const remove = async (p: TeamPerson) => {
    const member = p.invite ? memberOf.get(p.invite) : undefined;
    const also = member ? ' ورح ينشال دخوله للإدارة كمان' : '';
    if (!window.confirm(`حذف ${p.name} من فريق العمل؟${also}`)) return;
    setBusy(p.id);
    try {
      if (p.invite && pending.has(p.invite)) await deleteInvite(owner, p.invite).catch(() => {});
      if (member) await removeMember(owner, member.uid).catch(() => {});
      await deletePerson(owner, p.id, team.people.filter((x) => x.id !== p.id));
    } catch (e) {
      console.warn('Could not delete the person:', e);
      setError('ما قدرنا نحذف هلق. جرّب مرة ثانية.');
    }
    setBusy('');
  };

  const invite = async (p: TeamPerson) => {
    if (!isEmail(p.email)) return setError(`اكتب إيميل ${p.name} أول، لأنه بيدخل بنفس هالإيميل.`);
    if (p.email === (auth.currentUser?.email || '').toLowerCase()) return setError('هذا إيميلك أنت.');
    setBusy(p.id);
    setError('');
    try {
      if (p.invite && pending.has(p.invite)) await deleteInvite(owner, p.invite).catch(() => {});
      const code = await createInvite(owner, auth.currentUser?.uid || '', { name: p.name, email: p.email, perms: invitePerms });
      const next = { ...p, invite: code };
      await savePerson(owner, next, team.people.map((x) => (x.id === p.id ? next : x)));
      setFresh({ id: p.id, url: inviteUrl(owner, code) });
    } catch (e) {
      console.warn('Could not create the invitation:', e);
      setError('تعذر إنشاء الدعوة. بس صاحب الصفحة بيقدر يدعو.');
    }
    setBusy('');
  };

  const accessLabel = (p: TeamPerson) =>
    p.invite && memberOf.has(p.invite) ? { text: 'بيدخل للإدارة', cls: 'bg-[#EBFBEE] text-[#2B8A3E]' }
      : p.invite && pending.has(p.invite) ? { text: 'الدعوة لسا ما انقبلت', cls: 'bg-[#FFF4E6] text-[#A34A00]' }
      : null;

  const form = editing && (
    <div className="p-3 rounded-2xl border-2 border-brand/40 bg-white space-y-3">
      <div className="grid sm:grid-cols-[120px_1fr] gap-3 items-start">
        <Field label="الصورة">
          <ImagePicker value={editing.photo} onChange={(photo) => setEditing({ ...editing, photo })} />
        </Field>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="الاسم">
            <input className={inputClass} placeholder="مثلاً: د. سارة" value={editing.name} maxLength={80} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
          </Field>
          <Field label="التخصص أو العمل" hint="بيبين للزبون تحت الاسم">
            <input className={inputClass} placeholder="مثلاً: طبيبة أسنان، حلاق، مدير" value={editing.role} maxLength={80} onChange={(e) => setEditing({ ...editing, role: e.target.value })} />
          </Field>
          <Field label="الإيميل" hint="عليه بيوصل الحجز والتذكير">
            <input className={inputClass} dir="ltr" type="email" placeholder="name@email.com" value={editing.email} maxLength={200} onChange={(e) => setEditing({ ...editing, email: e.target.value })} />
          </Field>
          <Field label="الهاتف">
            <input className={inputClass} dir="ltr" type="tel" placeholder="+963…" value={editing.phone} maxLength={40} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} />
          </Field>
        </div>
      </div>
      <div>
        <Toggle checked={editing.takesBookings} onChange={(takesBookings) => setEditing({ ...editing, takesBookings })} label="يستقبل حجوزات" />
        <div className="text-xs text-neutral-400 font-bold -mt-0.5">الزبون بيقدر يختاره وقت الحجز، وبيوصله إيميل بكل حجز عنده.</div>
      </div>
      {error && <div className="text-xs font-bold text-[#E03131]">{error}</div>}
      <div className="flex flex-wrap gap-2">
        <PrimaryButton onClick={save} disabled={busy === 'save'}>{busy === 'save' ? 'جاري الحفظ…' : editing.id ? 'احفظ التعديل' : 'أضف للفريق'}</PrimaryButton>
        <GhostButton onClick={() => { setEditing(null); setError(''); }}>إلغاء</GhostButton>
      </div>
    </div>
  );

  const body = (
    <div className="space-y-3">
      <CloudNotice error={team.error} />
      {editing && !editing.id && form}
      {!team.loading && team.people.length === 0 && !editing && <EmptyState text="ما في حدا بفريق العمل بعد" />}
      {team.people.map((p) =>
        editing?.id === p.id ? (
          <React.Fragment key={p.id}>{form}</React.Fragment>
        ) : (
          <div key={p.id} className="p-3 rounded-2xl border border-neutral-200 bg-white space-y-2">
            <div className="flex items-center gap-3">
              {p.photo ? (
                <img src={p.photo} alt="" className="w-12 h-12 rounded-2xl object-cover shrink-0" />
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-neutral-100 text-neutral-400 flex items-center justify-center shrink-0"><Users size={20} /></div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-black text-ink truncate">{p.name}</div>
                {p.role && <div className="text-xs font-bold text-neutral-500 truncate">{p.role}</div>}
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {p.takesBookings && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-brand/10 text-brand"><CalendarCheck2 size={12} /> يستقبل حجوزات</span>
                  )}
                  {accessLabel(p) && <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${accessLabel(p)!.cls}`}>{accessLabel(p)!.text}</span>}
                </div>
              </div>
              <GhostButton onClick={() => { setError(''); setEditing(p); }} aria-label="تعديل"><Pencil size={14} /></GhostButton>
              <GhostButton className="text-[#E03131]" disabled={busy === p.id} onClick={() => remove(p)} aria-label="حذف"><Trash2 size={14} /></GhostButton>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-bold text-neutral-500">
              {p.email && <span className="inline-flex items-center gap-1" dir="ltr"><Mail size={12} />{p.email}</span>}
              {p.phone && <span className="inline-flex items-center gap-1" dir="ltr"><Phone size={12} />{p.phone}</span>}
              {!(p.invite && memberOf.has(p.invite)) && (
                <button type="button" disabled={busy === p.id} onClick={() => invite(p)} className="mr-auto inline-flex items-center gap-1 text-brand cursor-pointer disabled:opacity-50">
                  <UserPlus size={13} /> {p.invite && pending.has(p.invite) ? 'دعوة جديدة' : 'ادعُه للإدارة'}
                </button>
              )}
              {p.invite && memberOf.has(p.invite) && <span className="mr-auto inline-flex items-center gap-1 text-[#2B8A3E]"><Check size={13} /> دخل بحسابه</span>}
            </div>
            {fresh?.id === p.id && (
              <div className="p-3 rounded-2xl bg-[#EBFBEE] border border-[#B2F2BB] space-y-2">
                <div className="text-xs font-black text-[#2B8A3E]">أرسل هالرابط لـ{p.name}. بيشتغل مرة وحدة وبنفس الإيميل بس.</div>
                <CopyLink url={fresh.url} />
                <a href={whatsappLink(fresh.url, p.name, p.phone)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl bg-[#25D366] text-white text-xs font-bold">
                  <MessageCircle size={14} /> أرسل عبر واتساب
                </a>
              </div>
            )}
          </div>
        )
      )}
      {error && !editing && <div className="text-xs font-bold text-[#E03131]">{error}</div>}
      {!editing && (
        <PrimaryButton onClick={startNew}>
          <span className="inline-flex items-center gap-1.5"><UserPlus size={15} /> أضف شخص</span>
        </PrimaryButton>
      )}
    </div>
  );

  const intro = 'الأشخاص اللي بيشتغلوا معك. اللي «يستقبل حجوزات» بيختاره الزبون وقت الحجز وبيوصله إيميل بحجوزاته. وإذا بدك يدخل للإدارة، ادعُه بإيميله.';

  return asSection ? (
    <section className="rounded-2xl bg-white border border-neutral-200 p-4 space-y-3">
      <div className="flex items-center gap-2 text-xs font-bold text-neutral-500"><Users size={15} /> فريق العمل</div>
      <p className="text-xs text-neutral-500 leading-relaxed">{intro}</p>
      {body}
    </section>
  ) : (
    <div className="space-y-4">
      <div className="p-3 rounded-2xl bg-white border border-neutral-200 text-xs text-neutral-600 font-bold leading-relaxed">{intro}</div>
      <Card title="فريق العمل">{body}</Card>
    </div>
  );
};
