// The whole project's settings (the gear beside the project name in the top bar), as opposed to one
// page's. For now its name and its site's address; publishing and the own domain will come here.
import React, { useState } from 'react';
import { Check, Copy, ExternalLink, Globe, Rocket } from 'lucide-react';

interface ProjectSettingsSectionProps {
  name: string;
  onRename: (name: string) => void;
  kindLabel: string;
  siteUrl?: string;
}

export const ProjectSettingsSection = ({ name, onRename, kindLabel, siteUrl }: ProjectSettingsSectionProps) => {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    if (!siteUrl) return;
    navigator.clipboard?.writeText(siteUrl).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      },
      () => {}
    );
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <label className="text-xs font-bold text-neutral-800 block">اسم المشروع:</label>
        <input
          type="text"
          value={name}
          onChange={(e) => onRename(e.target.value)}
          className="w-full text-xs font-semibold px-3 py-2 bg-neutral-50 rounded-xl border border-neutral-300 focus:border-[#0071e3] focus:bg-white focus:outline-none transition-all"
          placeholder="اسم المشروع..."
        />
        <p className="text-[10.5px] text-neutral-500">يظهر في النافبار على كل صفحات الموقع. نوع المشروع: {kindLabel}.</p>
      </div>

      <div className="space-y-1.5 pt-3 border-t border-neutral-200">
        <label className="text-xs font-bold text-neutral-800 block">رابط الموقع:</label>
        {siteUrl ? (
          <div className="flex items-center gap-1.5">
            <div className="flex-1 min-w-0 text-[11px] font-mono text-neutral-700 bg-neutral-50 border border-neutral-200 rounded-xl px-2.5 py-2 truncate" dir="ltr">
              {siteUrl}
            </div>
            <button
              type="button"
              onClick={copy}
              className="w-8 h-8 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 flex items-center justify-center cursor-pointer"
              title="نسخ الرابط"
            >
              {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
            </button>
            <a
              href={siteUrl}
              target="_blank"
              rel="noreferrer"
              className="w-8 h-8 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 flex items-center justify-center"
              title="فتح الموقع"
            >
              <ExternalLink size={14} />
            </a>
          </div>
        ) : (
          <p className="text-[11px] text-neutral-500 bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2">يظهر رابط الموقع هنا بعد نشره.</p>
        )}
      </div>

      <div className="space-y-2 pt-3 border-t border-neutral-200">
        <div className="flex items-center gap-2 text-xs font-semibold text-neutral-400">
          <Rocket size={14} />
          <span>النشر</span>
          <span className="mr-auto text-[10px] font-bold bg-neutral-100 rounded-full px-2 py-0.5">قريباً</span>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-neutral-400">
          <Globe size={14} />
          <span>الدومين الخاص</span>
          <span className="mr-auto text-[10px] font-bold bg-neutral-100 rounded-full px-2 py-0.5">قريباً</span>
        </div>
      </div>
    </div>
  );
};
