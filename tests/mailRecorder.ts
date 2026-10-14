export const sent: string[] = [];
export const mailOrder = async (_a: any, uid: string, ev: string, id: string) => { sent.push(`${uid}:${ev}`); return 'sent'; };
export const mailOffice = async (id: string, t: string) => { sent.push(`office:${id}`); };
