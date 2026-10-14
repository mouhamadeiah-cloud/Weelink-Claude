// «لوحة التواصل» in the admin site: one chat channel for all admins. A message can be about a subscriber
// (by email); it then also appears in that subscriber's history. The board refreshes every few seconds
// while it is open and the tab is visible.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { AdminError, ChatMessage, adminChat, adminChatSend } from '../../services/adminApi';

const POLL_MS = 5000;
const inputCls = 'rounded-ctl border border-line bg-surface px-3 py-2 text-small text-ink outline-none focus:border-brand';
const time = (ms: number) => new Date(ms).toLocaleString('ar-SY', { dateStyle: 'short', timeStyle: 'short' });

export const ChatView: React.FC<{ onSessionEnd: () => void }> = ({ onSessionEnd }) => {
  const [messages, setMessages] = useState<ChatMessage[] | null>(null);
  const [me, setMe] = useState('');
  const [text, setText] = useState('');
  const [about, setAbout] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const last = useRef(0);
  const end = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const r = await adminChat(last.current ? { after: last.current } : {});
      setMe(r.me);
      if (r.rows.length) {
        last.current = Math.max(last.current, ...r.rows.map((m) => m.at));
        setMessages((cur) => {
          const seen = new Set((cur || []).map((m) => m.id));
          return [...(cur || []), ...r.rows.filter((m) => !seen.has(m.id))];
        });
      } else setMessages((cur) => cur || []);
    } catch (e) {
      if ((e as AdminError)?.code === 'session') return onSessionEnd();
      setError('تعذّر تحميل الرسائل.');
    }
  }, [onSessionEnd]);

  useEffect(() => {
    load();
    const timer = setInterval(() => { if (!document.hidden) load(); }, POLL_MS);
    return () => clearInterval(timer);
  }, [load]);
  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }); }, [messages?.length]);

  const send = async () => {
    if (!text.trim()) return;
    setBusy(true);
    setError('');
    try {
      await adminChatSend(text, about.trim() || undefined);
      setText('');
      setAbout('');
      await load();
    } catch (e) {
      if ((e as AdminError)?.code === 'session') return onSessionEnd();
      setError((e as AdminError)?.code === 'no-subscriber' ? 'ما لقيت مشتركاً بهذا الإيميل.' : 'تعذّر الإرسال.');
    }
    setBusy(false);
  };

  return (
    <section className="flex h-[calc(100vh-130px)] min-h-[420px] flex-col gap-3">
      <h1 className="text-title font-semibold">لوحة التواصل</h1>
      {error && <p className="text-small text-danger">{error}</p>}
      <div className="flex-1 overflow-y-auto rounded-card border border-line bg-surface p-3">
        {!messages ? <Loader2 className="h-5 w-5 animate-spin text-muted" /> : messages.length === 0 ? (
          <p className="py-8 text-center text-small text-muted">لا رسائل بعد. اكتب أول رسالة للفريق.</p>
        ) : (
          <ol className="flex flex-col gap-3">
            {messages.map((m) => (
              <li key={m.id} className={`flex flex-col ${m.by === me ? 'items-start' : 'items-end'}`}>
                <div className="text-tiny text-faint">{m.byName} · {time(m.at)}</div>
                <div className={`max-w-[85%] whitespace-pre-wrap rounded-card px-3 py-2 text-small ${m.by === me ? 'bg-brand text-white' : 'bg-bg text-ink'}`}>
                  {m.subscriber && <div className={`mb-1 text-tiny ${m.by === me ? 'text-white/80' : 'text-muted'}`}>عن المشترك: {m.subscriber}</div>}
                  {m.text}
                </div>
              </li>
            ))}
          </ol>
        )}
        <div ref={end} />
      </div>
      <div className="flex flex-wrap gap-2">
        <input value={about} onChange={(e) => setAbout(e.target.value)} placeholder="عن مشترك؟ إيميله (اختياري)" dir="ltr" className={`${inputCls} w-full sm:w-56`} />
        <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} placeholder="اكتب رسالة للفريق" className={`${inputCls} min-w-0 flex-1`} />
        <button disabled={busy || !text.trim()} onClick={send} className="inline-flex items-center gap-1 rounded-ctl bg-brand px-4 py-2 text-small text-white hover:bg-brand-hover disabled:opacity-50">{busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />} إرسال</button>
      </div>
    </section>
  );
};
