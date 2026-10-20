// Shown to a designer's account at every sign-in (and in a new tab): which role to work in this time.
import React from 'react';
import { Palette, UserRound } from 'lucide-react';
import type { Role } from '../../services/accountRole';

interface Props {
  name: string;
  onPick: (role: Role) => void;
  onLogout: () => void;
}

export const RolePicker: React.FC<Props> = ({ name, onPick, onLogout }) => (
  <div dir="rtl" className="min-h-screen bg-bg text-ink flex flex-col items-center justify-center px-4 py-16">
    <div className="w-full max-w-[460px] space-y-5">
      <div className="flex items-center justify-center gap-2">
        <span className="w-8 h-8 rounded-ctl bg-brand text-white flex items-center justify-center font-bold">W</span>
        <span className="text-lg font-bold tracking-tight font-logo">weelink</span>
      </div>
      <div className="bg-surface border border-line rounded-card p-6 sm:p-8 space-y-5">
        <div className="space-y-1">
          <h1 className="text-heading font-bold">{name ? `أهلاً ${name}` : 'أهلاً بك'}</h1>
          <p className="text-sm text-muted leading-relaxed">كيف تريد أن تدخل هذه المرة؟ يمكنك التبديل لاحقاً من الشريط العلوي.</p>
        </div>
        <button type="button" onClick={() => onPick('user')} className="w-full text-right border border-line hover:border-brand/40 rounded-card p-4 flex items-center gap-3 transition cursor-pointer">
          <span className="w-11 h-11 rounded-ctl bg-brand/10 text-brand flex items-center justify-center shrink-0"><UserRound size={22} /></span>
          <span className="flex-1 min-w-0">
            <span className="block text-sm font-bold">أدخل كمستخدم</span>
            <span className="block text-xs text-muted leading-relaxed">مشاريعي وصفحاتي وطلباتي وإدارة موقعي</span>
          </span>
        </button>
        <button type="button" onClick={() => onPick('designer')} className="w-full text-right border border-line hover:border-brand/40 rounded-card p-4 flex items-center gap-3 transition cursor-pointer">
          <span className="w-11 h-11 rounded-ctl bg-ink text-white flex items-center justify-center shrink-0"><Palette size={22} /></span>
          <span className="flex-1 min-w-0">
            <span className="block text-sm font-bold">أدخل كمصمم</span>
            <span className="block text-xs text-muted leading-relaxed">استوديو المصمم: مسوداتي وتصاميمي في المعرض وطلبات التصميم والأرباح</span>
          </span>
        </button>
        <button type="button" onClick={onLogout} className="w-full text-center text-xs text-muted hover:text-ink cursor-pointer">تسجيل الخروج</button>
      </div>
    </div>
  </div>
);
