// The list lives on globalThis: the test file and the server module reach this file through two different
// module URLs on some Node/tsx versions (CI), which made two copies of a plain module-level array.
const g = globalThis as { __mailSent?: string[] };
export const sent: string[] = (g.__mailSent ||= []);
export const mailOrder = async (_a: any, uid: string, ev: string, id: string) => { sent.push(`${uid}:${ev}`); return 'sent'; };
export const mailOffice = async (id: string, t: string) => { sent.push(`office:${id}`); };
