// «فريق العمل» (Eyad, 24 Oct): the people who work for the business, in every admin (free page,
// shop, car showroom, restaurant). Each person has a name, photo, specialty, email and phone. A person
// who «يستقبل حجوزات» is a specialist a visitor will book with (their own email gets the booking and
// the reminder); the owner may also invite a person into the admin with the existing invitation
// link (services/members.ts), which ties the person to the member that joins with it.
//   team/{owner}/people/{id}  the person; the owner writes, the owner and the members read
//   teamPublic/{owner}        { people: [{ id, name, role, photo }] } of those who take bookings; anyone reads it
// The email and the phone stay out of teamPublic: visitors see only who they can book with.
import { useEffect, useState } from 'react';
import { collection, deleteDoc, doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { cleanDays, cleanRota, type PersonHours, type WorkRota } from './teamHours';

export interface TeamPerson {
  id: string;
  name: string;
  role: string; // the specialty or job: «طبيبة أسنان»، «حلاق»
  photo: string;
  email: string;
  phone: string;
  takesBookings: boolean;
  invite: string; // the code of the invitation sent to this person, '' when none
  workingDays: string[]; // their own days inside the schedule's, [] = the schedule's
  workStart: string; // their own hours, '' = the schedule's
  workEnd: string;
  rota: WorkRota | null; // a shift rota of 1–2 weeks; replaces the three fields above when set
  at: string;
}

export type PublicPerson = Pick<TeamPerson, 'id' | 'name' | 'role' | 'photo'> & PersonHours;

const timeOf = (v: unknown) => (typeof v === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(v) ? v : '');

export const MAX_TEAM = 50;

const peopleCol = (owner: string) => collection(db, 'team', owner, 'people');

const clip = (v: unknown, n: number) => String(v ?? '').trim().slice(0, n);

export const normalizePerson = (id: string, d: any): TeamPerson => ({
  id,
  name: clip(d?.name, 80),
  role: clip(d?.role, 80),
  photo: clip(d?.photo, 1000),
  email: clip(d?.email, 200).toLowerCase(),
  phone: clip(d?.phone, 40),
  takesBookings: d?.takesBookings === true,
  invite: clip(d?.invite, 60),
  workingDays: cleanDays(d?.workingDays),
  workStart: timeOf(d?.workStart),
  workEnd: timeOf(d?.workEnd),
  rota: cleanRota(d?.rota),
  at: clip(d?.at, 40),
});

// What visitors may see: the people who take bookings, in the order of the list.
export const publicPeople = (people: TeamPerson[]): PublicPerson[] =>
  people.filter((p) => p.takesBookings && p.name).map(({ id, name, role, photo, workingDays, workStart, workEnd, rota }) => ({ id, name, role, photo, workingDays, workStart, workEnd, ...(rota ? { rota } : {}) }));

// What visitors see: the people who take bookings (teamPublic/{owner}); empty until it loads.
export const usePublicTeam = (owner: string | null | undefined) => {
  const [state, setState] = useState<{ owner: string; people: PublicPerson[] }>({ owner: '', people: [] });
  useEffect(() => {
    if (!owner) return;
    return onSnapshot(
      doc(db, 'teamPublic', owner),
      (snap) => {
        const list = snap.data()?.people;
        setState({ owner, people: Array.isArray(list) ? list.filter((p: any) => p && typeof p.id === 'string' && typeof p.name === 'string').map((p: any) => ({ id: p.id, name: p.name, role: String(p.role || ''), photo: String(p.photo || ''), workingDays: cleanDays(p.workingDays), workStart: timeOf(p.workStart), workEnd: timeOf(p.workEnd), rota: cleanRota(p.rota) })) : [] });
      },
      () => setState({ owner, people: [] })
    );
  }, [owner]);
  return state.owner === owner ? state.people : [];
};

export const newPersonId = () => `p${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

const writePublic = (owner: string, people: TeamPerson[]) => setDoc(doc(db, 'teamPublic', owner), { people: publicPeople(people) });

// `all` is the whole list after the change, so the visitors' copy follows it.
export const savePerson = async (owner: string, person: TeamPerson, all: TeamPerson[]) => {
  const { id, rota, ...rest } = normalizePerson(person.id, person);
  await setDoc(doc(peopleCol(owner), id), rota ? { ...rest, rota } : rest);
  await writePublic(owner, all);
};

export const deletePerson = async (owner: string, id: string, all: TeamPerson[]) => {
  await deleteDoc(doc(peopleCol(owner), id));
  await writePublic(owner, all);
};

const byTime = (a: TeamPerson, b: TeamPerson) => a.at.localeCompare(b.at);

export const useTeam = (owner: string | null) => {
  const [state, setState] = useState<{ people: TeamPerson[]; loading: boolean; error: string }>({ people: [], loading: true, error: '' });
  useEffect(() => {
    if (!owner) return;
    setState({ people: [], loading: true, error: '' });
    return onSnapshot(
      peopleCol(owner),
      (snap) => setState({ people: snap.docs.map((d) => normalizePerson(d.id, d.data())).sort(byTime), loading: false, error: '' }),
      (e) => setState({ people: [], loading: false, error: e.code || e.message })
    );
  }, [owner]);
  return state;
};
