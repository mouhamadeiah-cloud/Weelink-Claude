import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  Monitor, 
  Tablet, 
  Smartphone, 
  Undo2, 
  Redo2, 
  Eye, 
  Settings, 
  ChevronDown, 
  Plus,
  LogOut,
  Check,
  Globe,
  Palette,
  Upload,
  UserRound
} from 'lucide-react';
import { DevicePreviewMode, Page } from '../types';

interface ControlBarProps {
  currentPage: Page;
  pages: Page[];
  onSelectPage: (pageId: string) => void;
  onAddPage: (name: string) => void;
  previewMode: DevicePreviewMode;
  onChangePreviewMode: (mode: DevicePreviewMode) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onTogglePreview?: () => void;
  isPreviewActive?: boolean;
  onOpenPageSettings?: () => void;
  user: any;
  onLogin: () => void;
  onLogout: () => void;
  isSaving: boolean;
  onOpenWorkspaceHub?: () => void;
  onManualSave?: () => Promise<boolean>; // resolves once the cloud has it
  // Shown after the weelink logo, e.g. "Shops" for an Online Shop project.
  projectLabel?: string;
  // Opens the project chooser (clicking the logo).
  onOpenProjects?: () => void;
  // The project's name before the page's, with the gear of the project's settings.
  projectName?: string;
  onOpenProjectSettings?: () => void;
  // «نشر»: opens the publish window (the page's name, its link, QR code and domain).
  onPublish?: () => void;
  isPublished?: boolean;
  // The designers' programme: a designer's account has «وضع المصمم» here; inside it the page's own
  // publish button gives way to «تصدير الشريحة للمعرض».
  isDesigner?: boolean;
  isDesignerMode?: boolean;
  onToggleDesignerMode?: () => void;
  onExportSlide?: () => void;
  // The account menu (the person icon with the name): the account's projects to switch between.
  currentProjectKey?: string;
  onLoadProjects?: () => Promise<{ key: string; label: string; sub: string }[]>;
  onSwitchProject?: (key: string) => void;
  onOpenAccount?: () => void;
}

// A menu that floats above the bar: the bar scrolls sideways on a narrow screen, which would clip
// a menu placed inside it, so it is drawn at the page level next to its button.
const Floating: React.FC<{ anchor: React.RefObject<HTMLElement | null>; align: 'start' | 'end'; onClose: () => void; children: React.ReactNode; className?: string }> = ({ anchor, align, onClose, children, className = '' }) => {
  const [pos, setPos] = useState<{ top: number; left?: number; right?: number } | null>(null);
  useLayoutEffect(() => {
    const place = () => {
      const r = anchor.current?.getBoundingClientRect();
      if (!r) return;
      setPos(align === 'end' ? { top: r.bottom + 8, right: Math.max(8, window.innerWidth - r.right) } : { top: r.bottom + 8, left: Math.max(8, r.left) });
    };
    place();
    window.addEventListener('resize', place);
    return () => window.removeEventListener('resize', place);
  }, [anchor, align]);
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (anchor.current?.contains(t) || (t as Element).closest?.('[data-floating-menu]')) return;
      onClose();
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [anchor, onClose]);
  if (!pos) return null;
  return createPortal(
    <div data-floating-menu dir="rtl" style={{ position: 'fixed', top: pos.top, left: pos.left, right: pos.right }} className={`z-[1000001] bg-white/95 backdrop-blur-xl rounded-2xl border border-black/[0.08] shadow-[0_12px_36px_rgba(0,0,0,0.12)] p-2 text-right ${className}`}>
      {children}
    </div>,
    document.body
  );
};

export const ControlBar: React.FC<ControlBarProps> = ({
  currentPage,
  pages,
  onSelectPage,
  onAddPage,
  previewMode,
  onChangePreviewMode,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onTogglePreview,
  isPreviewActive,
  onOpenPageSettings,
  user,
  onLogin,
  onLogout,
  isSaving,
  onOpenWorkspaceHub,
  onManualSave,
  projectLabel,
  onOpenProjects,
  projectName,
  onOpenProjectSettings,
  onPublish,
  isPublished,
  isDesigner,
  isDesignerMode,
  onToggleDesignerMode,
  onExportSlide,
  currentProjectKey,
  onLoadProjects,
  onSwitchProject,
  onOpenAccount,
}) => {
  const [isPagesDropdownOpen, setIsPagesDropdownOpen] = useState(false);
  const [newPageName, setNewPageName] = useState('');
  const [isAddingPage, setIsAddingPage] = useState(false);

  // The account menu: opened with the person icon, it lists the account's projects to switch between.
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [accountProjects, setAccountProjects] = useState<{ key: string; label: string; sub: string }[] | null>(null);
  const accountRef = useRef<HTMLButtonElement>(null);
  const pagesRef = useRef<HTMLDivElement>(null);
  const toggleAccountMenu = () => {
    const next = !isAccountMenuOpen;
    setIsAccountMenuOpen(next);
    if (next && onLoadProjects) {
      setAccountProjects(null);
      onLoadProjects().then(setAccountProjects).catch(() => setAccountProjects([]));
    }
  };
  const firstName = user ? (user.displayName || user.email?.split('@')[0] || '').split(' ')[0] : '';

  const handleCreatePage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPageName.trim()) {
      onAddPage(newPageName.trim());
      setNewPageName('');
      setIsAddingPage(false);
      setIsPagesDropdownOpen(false);
    }
  };

  return (
    <header 
      style={{
        scrollbarWidth: 'none',
        msOverflowStyle: 'none'
      }}
      className="w-full bg-[#fbfbfd]/90 backdrop-blur-xl border-b border-black/[0.07] px-4 lg:px-6 h-14 flex items-center justify-between z-40 transition-all select-none overflow-x-auto whitespace-nowrap gap-4"
    >
      {/* Right side items (in RTL: Right to Left) */}
      <div className="flex items-center gap-2 sm:gap-3.5 flex-shrink-0">
        {/* 0. The project's name + the gear of the project's settings */}
        {projectName !== undefined && !isPreviewActive && !isDesignerMode && (
          <div className="flex items-center gap-1 bg-neutral-100/90 rounded-xl p-1 border border-black/[0.05]">
            <button
              type="button"
              onClick={onOpenProjectSettings}
              className="px-2.5 py-1 text-xs sm:text-sm font-bold text-ink max-w-[110px] sm:max-w-[160px] truncate rounded-lg hover:bg-black/[0.04] transition-colors cursor-pointer"
              title="المشروع"
            >
              {projectName || 'مشروعي'}
            </button>
            <button
              type="button"
              onClick={onOpenProjectSettings}
              className="w-7 h-7 rounded-lg text-neutral-400 hover:text-brand hover:bg-black/[0.04] active:scale-95 flex items-center justify-center transition-all cursor-pointer"
              title="إعدادات المشروع (الاسم والرابط، ولاحقاً النشر والدومين)"
              aria-label="إعدادات المشروع"
            >
              <Settings size={14} strokeWidth={2} />
            </button>
          </div>
        )}
        {projectName !== undefined && !isPreviewActive && !isDesignerMode && <span className="text-neutral-300 text-lg -mx-1 select-none">/</span>}

        {/* 1. Current Page Name in a Dropdown Box + Settings Gear */}
        <div ref={pagesRef} className="flex items-center gap-1.5 bg-neutral-100/90 hover:bg-neutral-200/70 rounded-xl p-1 border border-black/[0.05] transition-colors">
          <button
            onClick={() => setIsPagesDropdownOpen(!isPagesDropdownOpen)}
            className="flex items-center gap-2 px-2.5 py-1 text-xs sm:text-sm font-medium text-ink hover:text-black transition-colors rounded-lg focus:outline-none"
            title="اختيار الصفحة الحالية"
          >
            <span className="max-w-[100px] sm:max-w-[140px] truncate">
              {currentPage.name || 'الرئيسية'}
            </span>
            <ChevronDown 
              size={14} 
              className={`text-neutral-500 transition-transform duration-200 ${isPagesDropdownOpen ? 'rotate-180' : ''}`} 
            />
          </button>

          {/* Small settings gear icon right beside page name (opens page settings in control panel) */}
          <button
            onClick={onOpenPageSettings}
            className="w-7 h-7 rounded-lg text-neutral-400 hover:text-brand hover:bg-black/[0.04] active:scale-95 flex items-center justify-center transition-all cursor-pointer"
            title="إعدادات الصفحة (فتح في لوحة التحكم)"
            aria-label="إعدادات الصفحة"
          >
            <Settings size={14} strokeWidth={2} />
          </button>

          {/* Pages Dropdown Menu */}
          {isPagesDropdownOpen && (
            <Floating anchor={pagesRef} align="end" onClose={() => setIsPagesDropdownOpen(false)} className="w-56">
              <div className="text-xs font-semibold text-neutral-400 px-2.5 py-1">
                صفحات الموقع
              </div>
              <div className="space-y-0.5 max-h-48 overflow-y-auto">
                {pages.map((page) => (
                  <button
                    key={page.id}
                    onClick={() => {
                      onSelectPage(page.id);
                      setIsPagesDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-1.5 text-xs rounded-xl font-medium transition-all ${
                      page.id === currentPage.id
                        ? 'bg-brand text-white'
                        : 'text-neutral-700 hover:bg-neutral-100'
                    }`}
                  >
                    <span>{page.name}</span>
                    <span className="text-xs opacity-75">{page.slug}</span>
                  </button>
                ))}
              </div>

              {/* Add page section */}
              <div className="mt-2 pt-2 border-t border-black/[0.06]">
                {isAddingPage ? (
                  <form onSubmit={handleCreatePage} className="p-1">
                    <input
                      type="text"
                      value={newPageName}
                      onChange={(e) => setNewPageName(e.target.value)}
                      placeholder="اسم الصفحة الجديدة..."
                      autoFocus
                      className="w-full text-xs px-2.5 py-1.5 bg-neutral-100 rounded-lg border border-black/[0.08] focus:outline-none focus:border-brand mb-2 text-right"
                    />
                    <div className="flex gap-1.5 justify-end">
                      <button
                        type="button"
                        onClick={() => setIsAddingPage(false)}
                        className="px-2 py-1 text-xs rounded-md text-neutral-500 hover:bg-neutral-100"
                      >
                        إلغاء
                      </button>
                      <button
                        type="submit"
                        className="px-2.5 py-1 text-xs rounded-md bg-brand text-white font-medium hover:bg-brand-hover"
                      >
                        إضافة
                      </button>
                    </div>
                  </form>
                ) : (
                  <button
                    onClick={() => setIsAddingPage(true)}
                    className="w-full py-1.5 px-2.5 text-xs text-brand hover:bg-brand/10 rounded-xl flex items-center justify-center gap-1.5 font-medium transition-colors"
                  >
                    <Plus size={14} />
                    <span>إضافة صفحة جديدة</span>
                  </button>
                )}
              </div>
            </Floating>
          )}
        </div>

        {/* 2. Device Preview Icons (Desktop, Tablet, Mobile) */}
        <div className="flex items-center bg-neutral-100/80 p-0.5 rounded-xl border border-black/[0.05]">
          <button
            onClick={() => onChangePreviewMode('desktop')}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
              previewMode === 'desktop'
                ? 'bg-white text-brand shadow-xs font-semibold'
                : 'text-neutral-500 hover:text-black hover:bg-black/[0.03]'
            }`}
            title="معاينة شاشة الكمبيوتر"
            aria-label="كمبيوتر"
          >
            <Monitor size={16} strokeWidth={2.1} />
          </button>
          <button
            onClick={() => onChangePreviewMode('tablet')}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
              previewMode === 'tablet'
                ? 'bg-white text-brand shadow-xs font-semibold'
                : 'text-neutral-500 hover:text-black hover:bg-black/[0.03]'
            }`}
            title="معاينة شاشة التابلت"
            aria-label="تابلت"
          >
            <Tablet size={16} strokeWidth={2.1} />
          </button>
          <button
            onClick={() => onChangePreviewMode('mobile')}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
              previewMode === 'mobile'
                ? 'bg-white text-brand shadow-xs font-semibold'
                : 'text-neutral-500 hover:text-black hover:bg-black/[0.03]'
            }`}
            title="معاينة شاشة الهاتف المحمول"
            aria-label="موبايل"
          >
            <Smartphone size={16} strokeWidth={2.1} />
          </button>
        </div>

        {/* 3. Undo and Redo Step Arrows (strictly icons only, without words) */}
        <div className="flex items-center bg-neutral-100/80 p-0.5 rounded-xl border border-black/[0.05]">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
              canUndo
                ? 'text-neutral-700 hover:text-black hover:bg-white active:scale-95'
                : 'text-neutral-300 cursor-not-allowed'
            }`}
            title="تراجع خطوة للخلف"
            aria-label="تراجع"
          >
            <Undo2 size={16} strokeWidth={2.1} />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
              canRedo
                ? 'text-neutral-700 hover:text-black hover:bg-white active:scale-95'
                : 'text-neutral-300 cursor-not-allowed'
            }`}
            title="تقدم خطوة للأمام"
            aria-label="تقدم"
          >
            <Redo2 size={16} strokeWidth={2.1} />
          </button>
        </div>

        {/* 4. Eye icon for Fullscreen Preview (voll screen) */}
        <button
          onClick={() => onTogglePreview?.()}
          className={`h-9 px-2.5 sm:px-3 rounded-xl border border-black/[0.05] active:scale-95 flex items-center gap-1.5 transition-all ${
            isPreviewActive
              ? 'bg-brand text-white shadow-xs font-semibold text-xs'
              : 'bg-neutral-100/80 hover:bg-white text-neutral-700 hover:text-brand hover:shadow-xs text-xs'
          }`}
          title={isPreviewActive ? "إنهاء المعاينة والعودة للتحرير" : "معاينة الصفحة كمتصفح ويب حقيقي بدون هوامش"}
          aria-label="معاينة كاملة"
        >
          <Eye size={16} strokeWidth={2.2} />
          {isPreviewActive && <span className="hidden sm:inline">إنهاء المعاينة</span>}
        </button>
      </div>

      {/* Left side: Logo Weelink & User Auth / Cloud Sync Status */}
      <div className="flex items-center gap-3.5 flex-shrink-0">
        {isDesigner && onToggleDesignerMode && !isPreviewActive && (
          <button
            type="button"
            onClick={onToggleDesignerMode}
            aria-pressed={!!isDesignerMode}
            className={`h-9 px-3 rounded-xl border text-xs sm:text-sm font-black active:scale-95 flex items-center gap-1.5 transition-all cursor-pointer ${isDesignerMode ? 'bg-ink text-white border-ink' : 'bg-neutral-100/80 border-black/[0.05] text-neutral-700 hover:bg-white hover:text-brand'}`}
            title={isDesignerMode ? 'العودة لصفحتك' : 'وضع المصمم: صمّم شرائح وصدّرها لمعرض Weelink'}
          >
            <Palette size={15} strokeWidth={2.3} />
            {isDesignerMode ? 'صفحتي' : 'وضع المصمم'}
          </button>
        )}
        {isDesignerMode && onExportSlide && !isPreviewActive && (
          <button
            type="button"
            onClick={onExportSlide}
            className="h-9 px-4 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs sm:text-sm font-black shadow-sm active:scale-95 flex items-center gap-1.5 transition-all cursor-pointer"
            title="أرسل هذه الشريحة إلى معرض المصممين (تُراجع قبل أن تظهر)"
          >
            <Upload size={15} strokeWidth={2.4} />
            تصدير الشريحة للمعرض
          </button>
        )}
        {onPublish && !isDesignerMode && !isPreviewActive && (
          <button
            type="button"
            onClick={onPublish}
            className="h-9 px-4 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs sm:text-sm font-black shadow-sm active:scale-95 flex items-center gap-1.5 transition-all cursor-pointer"
            title={isPublished ? 'صفحتك منشورة: الرابط ورمز QR وتحديث النشر' : 'انشر صفحتك واحصل على رابطها'}
          >
            <Globe size={15} strokeWidth={2.4} />
            {isPublished ? 'منشورة' : 'نشر'}
          </button>
        )}
        {/* The account: the name with the person icon, a menu to switch between the account's projects */}
        {user && !user.isAnonymous && (
          <>
            <button
              ref={accountRef}
              type="button"
              onClick={toggleAccountMenu}
              aria-expanded={isAccountMenuOpen}
              className="h-9 px-2.5 rounded-xl border border-black/[0.05] bg-neutral-100/80 hover:bg-white text-xs sm:text-sm font-bold text-ink inline-flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
              title="حسابك ومشاريعك"
            >
              <UserRound size={16} aria-hidden="true" />
              <span className="max-w-[7rem] truncate">{firstName || 'حسابي'}</span>
            </button>
            {isAccountMenuOpen && (
              <Floating anchor={accountRef} align="start" onClose={() => setIsAccountMenuOpen(false)} className="w-64">
                <div className="text-xs font-semibold text-neutral-400 px-2.5 py-1">مشاريعك</div>
                <div className="space-y-0.5 max-h-60 overflow-y-auto">
                  {accountProjects === null ? (
                    <div className="px-3 py-2 text-xs text-neutral-400">جاري التحميل...</div>
                  ) : accountProjects.length === 0 ? (
                    <div className="px-3 py-2 text-xs text-neutral-400">ما في مشاريع بعد</div>
                  ) : (
                    accountProjects.map((p) => (
                      <button
                        key={p.key}
                        type="button"
                        onClick={() => {
                          setIsAccountMenuOpen(false);
                          if (p.key !== currentProjectKey) onSwitchProject?.(p.key);
                        }}
                        className={`w-full flex items-center justify-between gap-2 px-3 py-1.5 text-xs rounded-xl font-medium transition-all cursor-pointer ${p.key === currentProjectKey ? 'bg-brand/10 text-brand' : 'text-neutral-700 hover:bg-neutral-100'}`}
                      >
                        <span className="truncate">{p.label}</span>
                        <span className="flex items-center gap-1 text-xs opacity-70 shrink-0">{p.sub}{p.key === currentProjectKey && <Check size={12} />}</span>
                      </button>
                    ))
                  )}
                </div>
                <div className="mt-2 pt-2 border-t border-black/[0.06] space-y-0.5">
                  {onOpenAccount && (
                    <button type="button" onClick={() => { setIsAccountMenuOpen(false); onOpenAccount(); }} className="w-full text-right px-3 py-1.5 text-xs rounded-xl font-medium text-neutral-700 hover:bg-neutral-100 cursor-pointer">صفحة حسابي</button>
                  )}
                  <button type="button" onClick={() => { setIsAccountMenuOpen(false); onLogout(); }} className="w-full text-right px-3 py-1.5 text-xs rounded-xl font-medium text-red-600 hover:bg-red-50 cursor-pointer">تسجيل الخروج</button>
                </div>
              </Floating>
            )}
          </>
        )}
        {user?.isAnonymous && (
          <button
            type="button"
            onClick={onLogin}
            className="h-8 px-2 text-xs font-bold bg-brand text-white hover:bg-brand-hover rounded-lg flex items-center gap-1 transition-all cursor-pointer active:scale-95"
            title="ربط المشروع بحساب Google لحفظ دائم"
          >
            حفظ بـ Google
          </button>
        )}

        <button
          type="button"
          onClick={onOpenProjects}
          className="flex items-center gap-2 group cursor-pointer"
          title="العودة إلى Weelink (يُحفظ عملك)"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand to-[#40a9ff] text-white flex items-center justify-center shadow-[0_2px_8px_rgba(0,113,227,0.3)] transition-transform group-hover:scale-105">
            <span className="text-sm font-bold tracking-tighter">W</span>
          </div>
          <div className="flex items-baseline gap-1" dir="ltr">
            <span className="text-lg font-bold tracking-tight text-ink">
              weelink
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-brand inline-block mb-1" />
            {projectLabel && (
              <span className="text-lg font-bold tracking-tight text-neutral-400">
                / <span className="text-ink">{projectLabel}</span>
              </span>
            )}
          </div>
        </button>
      </div>
    </header>
  );
};
