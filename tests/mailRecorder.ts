// Records the order mails instead of sending them: orderMail.ts calls this tap when it is set.
import { setMailTap } from '../server/orderMail.ts';

export const sent: string[] = [];
setMailTap((entry) => { sent.push(entry); });
