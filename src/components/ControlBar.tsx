import React, { useState } from 'react';
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
  Loader2,
  Wand2,
  Globe
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
  onArrangeForMobile?: () => void;
  onTogglePreview?: () => void;
  isPreviewActive?: boolean;
  onOpenPageSettings?: () => void;
  user: any;
  onLogin: () => void;
  onLogout: () => void;
  isSaving: boolean;
  onOpenWorkspaceHub?: () => void;
  onManualSave?: () => void;
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
}

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
  onArrangeForMobile,
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
}) => {
  const [isPagesDropdownOpen, setIsPagesDropdownOpen] = useState(false);
  const [newPageName, setNewPageName] = useState('');
  const [isAddingPage, setIsAddingPage] = useState(false);

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
        {projectName !== undefined && !isPreviewActive && (
          <div className="flex items-center gap-1 bg-neutral-100/90 rounded-xl p-1 border border-black/[0.05]">
            <button
              type="button"
              onClick={onOpenProjectSettings}
              className="px-2.5 py-1 text-xs sm:text-sm font-bold text-[#1d1d1f] max-w-[110px] sm:max-w-[160px] truncate rounded-lg hover:bg-black/[0.04] transition-colors cursor-pointer"
              title="المشروع"
            >
              {projectName || 'مشروعي'}
            </button>
            <button
              type="button"
              onClick={onOpenProjectSettings}
              className="w-7 h-7 rounded-lg text-neutral-400 hover:text-[#0071e3] hover:bg-black/[0.04] active:scale-95 flex items-center justify-center transition-all cursor-pointer"
              title="إعدادات المشروع (الاسم والرابط، ولاحقاً النشر والدومين)"
              aria-label="إعدادات المشروع"
            >
              <Settings size={14} strokeWidth={2} />
            </button>
          </div>
        )}
        {projectName !== undefined && !isPreviewActive && <span className="text-neutral-300 text-lg -mx-1 select-none">/</span>}

        {/* 1. Current Page Name in a Dropdown Box + Settings Gear */}
        <div className="flex items-center gap-1.5 bg-neutral-100/90 hover:bg-neutral-200/70 rounded-xl p-1 border border-black/[0.05] transition-colors relative">
          <button
            onClick={() => setIsPagesDropdownOpen(!isPagesDropdownOpen)}
            className="flex items-center gap-2 px-2.5 py-1 text-xs sm:text-sm font-medium text-[#1d1d1f] hover:text-black transition-colors rounded-lg focus:outline-none"
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
            className="w-7 h-7 rounded-lg text-neutral-400 hover:text-[#0071e3] hover:bg-black/[0.04] active:scale-95 flex items-center justify-center transition-all cursor-pointer"
            title="إعدادات الصفحة (فتح في لوحة التحكم)"
            aria-label="إعدادات الصفحة"
          >
            <Settings size={14} strokeWidth={2} />
          </button>

          {/* Pages Dropdown Menu */}
          {isPagesDropdownOpen && (
            <div 
              className="absolute top-full right-0 mt-2 w-56 bg-white/95 backdrop-blur-xl rounded-2xl border border-black/[0.08] shadow-[0_12px_36px_rgba(0,0,0,0.12)] p-2 z-50 text-right animate-in fade-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-[11px] font-semibold text-neutral-400 px-2.5 py-1">
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
                        ? 'bg-[#0071e3] text-white'
                        : 'text-neutral-700 hover:bg-neutral-100'
                    }`}
                  >
                    <span>{page.name}</span>
                    <span className="text-[10px] opacity-75">{page.slug}</span>
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
                      className="w-full text-xs px-2.5 py-1.5 bg-neutral-100 rounded-lg border border-black/[0.08] focus:outline-none focus:border-[#0071e3] mb-2 text-right"
                    />
                    <div className="flex gap-1.5 justify-end">
                      <button
                        type="button"
                        onClick={() => setIsAddingPage(false)}
                        className="px-2 py-1 text-[11px] rounded-md text-neutral-500 hover:bg-neutral-100"
                      >
                        إلغاء
                      </button>
                      <button
                        type="submit"
                        className="px-2.5 py-1 text-[11px] rounded-md bg-[#0071e3] text-white font-medium hover:bg-[#0077ed]"
                      >
                        إضافة
                      </button>
                    </div>
                  </form>
                ) : (
                  <button
                    onClick={() => setIsAddingPage(true)}
                    className="w-full py-1.5 px-2.5 text-xs text-[#0071e3] hover:bg-[#0071e3]/10 rounded-xl flex items-center justify-center gap-1.5 font-medium transition-colors"
                  >
                    <Plus size={14} />
                    <span>إضافة صفحة جديدة</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 2. Device Preview Icons (Desktop, Tablet, Mobile) */}
        <div className="flex items-center bg-neutral-100/80 p-0.5 rounded-xl border border-black/[0.05]">
          <button
            onClick={() => onChangePreviewMode('desktop')}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
              previewMode === 'desktop'
                ? 'bg-white text-[#0071e3] shadow-xs font-semibold'
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
                ? 'bg-white text-[#0071e3] shadow-xs font-semibold'
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
                ? 'bg-white text-[#0071e3] shadow-xs font-semibold'
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
          {onArrangeForMobile && !isPreviewActive && (
            <button
              onClick={onArrangeForMobile}
              className="h-8 px-2 rounded-lg flex items-center justify-center gap-1 text-neutral-700 hover:text-[#0071e3] hover:bg-white active:scale-95 transition-all"
              title="تنسيق الموبايل: ترتيب العناصر تلقائياً لشاشات الهاتف دون تغيير تصميم الكمبيوتر"
              aria-label="تنسيق الموبايل"
            >
              <Smartphone size={15} strokeWidth={2.1} />
              <Wand2 size={13} strokeWidth={2.1} />
            </button>
          )}
        </div>

        {/* 4. Eye icon for Fullscreen Preview (voll screen) */}
        <button
          onClick={() => onTogglePreview?.()}
          className={`h-9 px-2.5 sm:px-3 rounded-xl border border-black/[0.05] active:scale-95 flex items-center gap-1.5 transition-all ${
            isPreviewActive
              ? 'bg-[#0071e3] text-white shadow-xs font-semibold text-xs'
              : 'bg-neutral-100/80 hover:bg-white text-neutral-700 hover:text-[#0071e3] hover:shadow-xs text-xs'
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
        {onPublish && !isPreviewActive && (
          <button
            type="button"
            onClick={onPublish}
            className="h-9 px-4 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs sm:text-sm font-black shadow-sm active:scale-95 flex items-center gap-1.5 transition-all cursor-pointer"
            title={isPublished ? 'صفحتك منشورة: الرابط ورمز QR وتحديث النشر' : 'انشر صفحتك واحصل على رابطها'}
          >
            <Globe size={15} strokeWidth={2.4} />
            {isPublished ? 'منشورة' : 'نشر'}
          </button>
        )}
        {/* Firebase Cloud Sync Status & Auth Controls */}
        <div className="flex items-center gap-2">
          {user ? (
            <div className="flex items-center gap-2 bg-neutral-100 border border-neutral-200/60 rounded-xl p-1 pr-2.5">
              <div className="flex flex-col text-right">
                <span className="text-[10px] font-bold text-neutral-800 leading-tight truncate max-w-[100px]">
                  {user.isAnonymous ? 'مستخدم زائر ☁️' : (user.displayName || 'مستخدم السحاب')}
                </span>
                <span className="text-[8.5px] text-emerald-600 font-medium flex items-center gap-0.5 leading-none">
                  {isSaving ? (
                    <>
                      <Loader2 size={8} className="animate-spin text-blue-600" />
                      <span className="text-blue-600">جاري الحفظ...</span>
                    </>
                  ) : (
                    <>
                      <span className="w-1 h-1 rounded-full bg-emerald-500 inline-block animate-pulse" />
                      <span>متزامن ومحفوظ</span>
                    </>
                  )}
                </span>
              </div>
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || ''}
                  className="w-7 h-7 rounded-lg border border-black/[0.08]"
                />
              ) : (
                <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold font-sans">
                  {user.isAnonymous ? 'A' : (user.displayName ? user.displayName[0] : 'U')}
                </div>
              )}
              
              {user.isAnonymous ? (
                <button
                  type="button"
                  onClick={onLogin}
                  className="h-7 px-2 text-[9px] font-bold bg-[#0071e3] text-white hover:bg-[#0077ed] rounded-lg flex items-center gap-1 shadow-2xs transition-all cursor-pointer mr-1 active:scale-95"
                  title="ربط المشروع بحساب Google لحفظ دائم"
                >
                  <span>حفظ بـ Google</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onLogout}
                  className="w-7 h-7 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-all cursor-pointer"
                  title="تسجيل الخروج من الحساب السحابي"
                >
                  <LogOut size={13} />
                </button>
              )}
            </div>
          ) : null}
        </div>

        <button
          type="button"
          onClick={onOpenProjects}
          className="flex items-center gap-2 group cursor-pointer"
          title="المشاريع: التبديل بين الصفحة المجانية والمتجر"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#0071e3] to-[#40a9ff] text-white flex items-center justify-center shadow-[0_2px_8px_rgba(0,113,227,0.3)] transition-transform group-hover:scale-105">
            <span className="text-sm font-bold tracking-tighter">W</span>
          </div>
          <div className="flex items-baseline gap-1" dir="ltr">
            <span className="text-lg font-bold tracking-tight text-[#1d1d1f]">
              weelink
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#0071e3] inline-block mb-1" />
            {projectLabel && (
              <span className="text-lg font-bold tracking-tight text-neutral-400">
                / <span className="text-[#1d1d1f]">{projectLabel}</span>
              </span>
            )}
          </div>
        </button>
      </div>
    </header>
  );
};
