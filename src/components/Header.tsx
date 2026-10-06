import React from 'react';
import {
  ExternalLink,
  Users,
  Smartphone,
  Tv,
  Keyboard,
  Download,
} from 'lucide-react';

interface HeaderProps {
  activeTab: 'match' | 'arena' | 'library' | 'standings' | 'timer' | 'broadcast';
  setActiveTab: (tab: 'match' | 'arena' | 'library' | 'standings' | 'timer' | 'broadcast') => void;
  onOpenTeamsModal: () => void;
  onOpenResetModal: () => void;
  onOpenMobileConnectModal?: () => void;
  onToggleStageView?: () => void;
  onOpenHotkeys?: () => void;
  canInstallPwa?: boolean;
  onInstallPwa?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenTeamsModal,
  onOpenMobileConnectModal,
  onToggleStageView,
  onOpenHotkeys,
  canInstallPwa,
  onInstallPwa,
}) => {
  const openStandaloneTimer = () => {
    window.open(window.location.href.split('#')[0] + '#standalone-timer', '_blank', 'width=1100,height=750');
  };

  const navItems: Array<{ id: 'match' | 'arena' | 'library' | 'standings' | 'timer' | 'broadcast'; label: string }> = [
    { id: 'match', label: 'المواجهة المباشرة' },
    { id: 'arena', label: 'شاشة الألعاب (Ban & Pick)' },
    { id: 'standings', label: 'جدول الترتيب' },
    { id: 'library', label: 'مكتبة الألعاب' },
    { id: 'timer', label: 'المؤقت الميداني' },
    { id: 'broadcast', label: 'شاشة العرض' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#070B19]/95 border-b border-slate-800 px-3 md:px-8 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Zone 1: Wordmark */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('match')}
            className="flex items-center gap-2.5 text-right group focus:outline-none"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 via-purple-600 to-indigo-600 flex items-center justify-center font-orbitron font-extrabold text-white shadow-lg shadow-purple-500/25 group-hover:scale-105 transition-transform text-sm tracking-wider">
              CE
            </div>
            <div className="flex flex-col text-right">
              <span className="text-lg md:text-xl font-changa font-bold tracking-tight text-white group-hover:text-amber-300 transition-colors">
                دوري صراع النخبة
              </span>
              <span className="text-[9px] md:text-[10px] font-orbitron text-purple-300/80 tracking-widest uppercase font-semibold">
                CLASH OF ELITES
              </span>
            </div>
          </button>
        </div>

        {/* Zone 2: Navigation links */}
        <nav className="hidden lg:flex items-center gap-1 bg-[#050814] p-1 rounded-xl border border-slate-800">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap font-changa ${
                  isActive
                    ? 'bg-purple-600/30 text-purple-200 border border-purple-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Stage View Button for Audience */}
          {onToggleStageView && (
            <button
              onClick={onToggleStageView}
              title="وضع المسرح والعرض الصافي للجمهور والبروجكتر (B)"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-200 bg-amber-950/70 hover:bg-amber-900/90 border border-amber-500/60 rounded-xl shadow-sm transition-all whitespace-nowrap active:scale-95"
            >
              <Tv className="w-3.5 h-3.5 text-amber-400" />
              <span>وضع المسرح 📺</span>
            </button>
          )}

          {/* Hotkeys Button */}
          {onOpenHotkeys && (
            <button
              onClick={onOpenHotkeys}
              title="دليل اختصارات الكيبورد السريعة"
              className="p-1.5 sm:px-2.5 sm:py-1.5 text-xs font-semibold text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl transition-colors whitespace-nowrap flex items-center gap-1"
            >
              <Keyboard className="w-4 h-4 text-slate-400" />
              <span className="hidden md:inline font-mono text-[11px]">اختصارات ⌨️</span>
            </button>
          )}

          {/* Mobile Controller QR */}
          {onOpenMobileConnectModal && (
            <button
              onClick={onOpenMobileConnectModal}
              title="تحكم بالموقع والألعاب من هاتفك المحمول عن بُعد"
              className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 text-xs font-bold text-emerald-300 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/60 rounded-xl shadow-sm transition-all whitespace-nowrap active:scale-95"
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">تحكم بالهاتف 📱</span>
            </button>
          )}

          {/* Teams Customization */}
          <button
            onClick={onOpenTeamsModal}
            title="تعديل أسماء وشعارات الفرق الـ 6"
            className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl transition-colors whitespace-nowrap"
          >
            <Users className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">الفرق</span>
          </button>

          {/* Standalone Timer */}
          <button
            onClick={openStandaloneTimer}
            title="فتح المؤقت في نافذة مستقلة للشاشة الثانية أو المخرج"
            className="hidden sm:flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl shadow-sm transition-all whitespace-nowrap active:scale-95"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>المؤقت المنفصل</span>
          </button>

          {/* PWA Install Button */}
          {canInstallPwa && onInstallPwa && (
            <button
              onClick={onInstallPwa}
              title="تثبيت دوري صراع النخبة كتطبيق مستقل على جهازك"
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-cyan-200 bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/50 rounded-xl shadow-sm transition-all whitespace-nowrap active:scale-95"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400 animate-bounce" />
              <span className="hidden sm:inline">تثبيت التطبيق</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile nav row */}
      <div className="lg:hidden flex items-center justify-between gap-1 overflow-x-auto pt-2 pb-1 border-t border-slate-800/50 mt-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors font-changa ${
              activeTab === item.id
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </header>
  );
};
