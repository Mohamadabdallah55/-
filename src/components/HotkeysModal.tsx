import React from 'react';
import { X, Keyboard, Sparkles, Tv, Timer, Trophy } from 'lucide-react';

interface HotkeysModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HotkeysModal: React.FC<HotkeysModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const hotkeys = [
    {
      key: 'B',
      description: 'تبديل وضع المسرح / العرض الصافي للجمهور (Clean Broadcast Stage)',
      category: 'العرض والبث',
      icon: <Tv className="w-4 h-4 text-cyan-400" />,
    },
    {
      key: 'F',
      description: 'تبديل ملء الشاشة (Fullscreen) لأجهزة العرض والبروجكتر',
      category: 'العرض والبث',
      icon: <Tv className="w-4 h-4 text-cyan-400" />,
    },
    {
      key: 'Space',
      description: 'إيقاف / تشغيل المؤقت التنازلي الميداني مباشرة',
      category: 'المؤقت',
      icon: <Timer className="w-4 h-4 text-purple-400" />,
    },
    {
      key: '↑ / ↓',
      description: 'إضافة أو خصم نقطة للفريق الأول (الأرجواني)',
      category: 'التحكم بالنتيجة',
      icon: <Trophy className="w-4 h-4 text-amber-400" />,
    },
    {
      key: '→ / ←',
      description: 'إضافة أو خصم نقطة للفريق الثاني (السماوي)',
      category: 'التحكم بالنتيجة',
      icon: <Trophy className="w-4 h-4 text-amber-400" />,
    },
    {
      key: 'T',
      description: 'الانتقال الفوري لتبويب المؤقت الميداني',
      category: 'التنقل السريع',
      icon: <Keyboard className="w-4 h-4 text-emerald-400" />,
    },
    {
      key: 'M',
      description: 'الانتقال الفوري لتبويب المواجهة المباشرة',
      category: 'التنقل السريع',
      icon: <Keyboard className="w-4 h-4 text-emerald-400" />,
    },
    {
      key: 'ESC',
      description: 'الخروج من وضع المسرح، أو إغلاق أي نافذة منبثقة',
      category: 'عام',
      icon: <X className="w-4 h-4 text-rose-400" />,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 select-none animate-fade-in text-right">
      <div className="bg-[#0A0F24] border border-slate-700/80 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 left-5 text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800/80 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5 pb-3 border-b border-slate-800">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg">
            <Keyboard className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-changa text-white flex items-center gap-2">
              <span>اختصارات لوحة المفاتيح السريعة</span>
              <span className="text-[10px] font-mono bg-purple-950 text-purple-300 border border-purple-700 px-2 py-0.5 rounded-full font-bold">
                HOTKEYS
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              تحكم بالبث الميداني والنتائج دون لمس الماوس
            </p>
          </div>
        </div>

        {/* Hotkeys Grid */}
        <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
          {hotkeys.map((item, idx) => (
            <div
              key={idx}
              className="p-3 rounded-2xl bg-[#060A1A] border border-slate-800/80 flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center">
                  {item.icon}
                </div>
                <div>
                  <span className="text-xs text-white font-bold font-changa block">
                    {item.description}
                  </span>
                  <span className="text-[10px] text-slate-500 font-changa">{item.category}</span>
                </div>
              </div>

              <kbd className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-amber-300 font-orbitron font-black text-xs shadow-inner shrink-0">
                {item.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="mt-5 pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold font-changa transition-colors"
          >
            حسناً، فهمت
          </button>
        </div>
      </div>
    </div>
  );
};
