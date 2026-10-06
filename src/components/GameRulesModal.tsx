import React, { useState } from 'react';
import { GameItem, CategoryInfo } from '../types';
import { GameIcon } from './GameIcons';
import { sound } from '../utils/audio';
import {
  X,
  BookOpen,
  Edit3,
  Check,
  RotateCcw,
  Sparkles,
  Scale,
  AlertCircle,
  FileText,
} from 'lucide-react';

interface GameRulesModalProps {
  game: GameItem | null;
  category?: CategoryInfo | null;
  onSaveRules: (gameId: string, rules: string) => void;
  onClose: () => void;
}

const DEFAULT_RULE_TEMPLATE = `• نظام الجولة: مواجهة رسمية بين ممثلي الفريقين (أو الفريق كاملاً).
• طريقة احتساب الفائز: أول من يحقق الهدف المطلوب أو يحرز أعلى نقاط قبل انتهاء الوقت.
• وقت التحدي: محدد بصافرة الحكم الميداني ومؤقت الساحة.
• الأخطاء والمخالفات: البدء قبل إطلاق الصافرة يُلغي المحاولة ويمنح الخصم فرصة إعادة أو نقطة.
• شروط التحكيم: قرار الحكم الميداني نهائي ولا يقبل الطعن أثناء البث.`;

export const GameRulesModal: React.FC<GameRulesModalProps> = ({
  game,
  category,
  onSaveRules,
  onClose,
}) => {
  if (!game) return null;

  const [isEditing, setIsEditing] = useState<boolean>(!game.rules || game.rules.trim() === '');
  const [rulesText, setRulesText] = useState<string>(game.rules || '');

  const handleSave = () => {
    sound.playPick('pick');
    onSaveRules(game.id, rulesText.trim());
    setIsEditing(false);
  };

  const handleInsertTemplate = () => {
    sound.playTick();
    setRulesText(DEFAULT_RULE_TEMPLATE);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 animate-fade-in text-right">
      <div className="relative w-full max-w-lg bg-[#0C1024] border-2 border-slate-700/80 rounded-3xl p-5 sm:p-7 shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden">
        {/* Glow */}
        <div
          className="absolute -top-32 -right-32 w-80 h-80 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ backgroundColor: category?.accentColor || '#6366F1' }}
        />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 left-5 text-slate-400 hover:text-white p-2 rounded-xl bg-slate-900 border border-slate-800 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Ribbon */}
        <div className="flex items-center gap-3.5 mb-5 pb-4 border-b border-slate-800/80">
          <div
            className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-white border border-white/20 shadow-lg shrink-0"
            style={{
              backgroundColor: category?.accentColor || '#4F46E5',
              boxShadow: `0 0 20px ${category?.glowColor || 'rgba(99,102,241,0.4)'}`,
            }}
          >
            <GameIcon name={game.iconType} className="w-7 h-7 sm:w-8 sm:h-8" />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-orbitron font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {category?.nameAr || 'فئة معتمدة'}
              </span>
              <span className="text-xs text-amber-400 font-semibold flex items-center gap-1">
                <Scale className="w-3.5 h-3.5" />
                <span>قوانين اللعبة الرسمية</span>
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black font-changa text-white">
              {game.nameAr}
            </h2>
            <p className="text-xs text-slate-400 font-orbitron tracking-wide">
              {game.nameEn}
            </p>
          </div>
        </div>

        {/* View / Edit Mode Switcher */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-indigo-400" />
            <span>{isEditing ? 'تعديل وكتابة القوانين:' : 'بنود وقوانين التحدي:'}</span>
          </span>

          <div className="flex items-center gap-2">
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1 px-3 py-1 rounded-lg bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 hover:bg-indigo-600/50 text-xs font-semibold transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>تعديل القوانين</span>
              </button>
            )}

            {isEditing && (
              <button
                type="button"
                onClick={handleInsertTemplate}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 text-amber-300 border border-amber-500/30 hover:bg-slate-700 text-[11px] font-semibold transition-colors"
                title="إدراج نموذج شروط قياسي لتعديله"
              >
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>إدراج نموذج مقترح</span>
              </button>
            )}
          </div>
        </div>

        {/* Content Area: View or Textarea */}
        {isEditing ? (
          <div className="space-y-3">
            <textarea
              rows={6}
              value={rulesText}
              onChange={(e) => setRulesText(e.target.value)}
              placeholder="اكتب هنا قوانين وشروط اللعبة بالتفصيل (مثل: عدد الجولات، الممنوعات، شروط الفوز)..."
              className="w-full bg-[#070A18] border border-indigo-500/40 focus:border-indigo-400 rounded-2xl p-3.5 text-white text-xs sm:text-sm font-sans leading-relaxed focus:outline-none resize-none placeholder-slate-600"
            />
            <p className="text-[11px] text-slate-400 leading-normal flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>ستظهر هذه القوانين فوراً عند الضغط على أيقونة القوانين في بطاقة اللعبة.</span>
            </p>
          </div>
        ) : (
          <div className="bg-[#070A18] border border-slate-800 rounded-2xl p-4 min-h-[140px] max-h-[260px] overflow-y-auto">
            {rulesText && rulesText.trim() !== '' ? (
              <div className="text-slate-200 text-xs sm:text-sm leading-relaxed whitespace-pre-line font-sans space-y-1">
                {rulesText}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center text-slate-500 text-xs">
                <FileText className="w-8 h-8 text-slate-600 mb-2 stroke-[1.5]" />
                <p>لم تتم إضافة قوانين خاصة بهذه اللعبة حتى الآن.</p>
                <button
                  onClick={() => setIsEditing(true)}
                  className="mt-3 px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-500 transition-colors"
                >
                  + أضف القوانين الآن
                </button>
              </div>
            )}
          </div>
        )}

        {/* Bottom Actions */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between gap-3">
          {isEditing ? (
            <>
              <button
                onClick={handleSave}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold font-changa text-sm shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-transform active:scale-98"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>حفظ القوانين</span>
              </button>

              <button
                onClick={() => {
                  setRulesText(game.rules || '');
                  setIsEditing(false);
                }}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
              >
                إلغاء
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors"
            >
              إغلاق
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
