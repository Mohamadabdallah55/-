import React from 'react';
import { CategoryInfo, CategoryKey } from '../types';
import { GameIcon } from './GameIcons';
import { Check, Crown, Flame, Swords } from 'lucide-react';

interface CategoryPickerProps {
  categories: CategoryInfo[];
  selectedCategories: CategoryKey[];
  onToggleCategory: (catId: CategoryKey) => void;
}

export const CategoryPicker: React.FC<CategoryPickerProps> = ({
  categories,
  selectedCategories,
  onToggleCategory,
}) => {
  return (
    <div className="bg-[#0C1226]/80 border border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-800/60">
        <div>
          <h3 className="text-base font-bold font-changa text-white flex items-center gap-2">
            <span>الفئات الـ 5 المعتمدة لمواجهة اليوم</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-mono font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
              {selectedCategories.length} فئات نشطة (نظام 5 فئات)
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            تشمل فئات المواجهة: إلكتروني، ذكاء، بدني، <strong className="text-rose-400">تحدي الكباتن (1 ضد 1)</strong>، و<strong className="text-pink-400">تصويت الجمهور</strong> (متاح كامل المكتبة).
          </p>
        </div>
      </div>

      {/* Categories Grid (5 categories) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {categories.map((cat) => {
          const isSelected = selectedCategories.includes(cat.id);

          return (
            <button
              key={cat.id}
              onClick={() => onToggleCategory(cat.id)}
              className={`relative p-3.5 rounded-xl border text-right transition-all group flex flex-col justify-between min-h-[105px] ${
                isSelected
                  ? cat.id === '1v1' || cat.id === 'captains'
                    ? 'bg-rose-950/40 border-rose-500 shadow-md shadow-rose-500/20 ring-1 ring-rose-400'
                    : cat.id === 'fan_vote'
                    ? 'bg-pink-950/40 border-pink-500 shadow-md shadow-pink-500/20 ring-1 ring-pink-400'
                    : 'bg-slate-800/90 border-purple-500 shadow-md shadow-purple-500/20 ring-1 ring-purple-400'
                  : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
              }`}
            >
              {/* Checkbox indicator */}
              <div className="flex items-center justify-between w-full mb-2">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{
                    backgroundColor: `${cat.accentColor}20`,
                    color: cat.accentColor,
                  }}
                >
                  {cat.id === '1v1' || cat.id === 'captains' ? (
                    <Swords className="w-4 h-4 text-rose-400" />
                  ) : cat.id === 'fan_vote' ? (
                    <Flame className="w-4 h-4 text-pink-400 fill-pink-400" />
                  ) : (
                    <GameIcon name={cat.icon} className="w-4 h-4" />
                  )}
                </div>

                <div
                  className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                    isSelected
                      ? cat.id === '1v1' || cat.id === 'captains'
                        ? 'bg-rose-600 text-white'
                        : cat.id === 'fan_vote'
                        ? 'bg-pink-600 text-white'
                        : 'bg-purple-600 text-white'
                      : 'border border-slate-700 bg-slate-800 text-transparent'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                </div>
              </div>

              <div>
                <div className="font-bold text-sm text-white font-changa group-hover:text-purple-300 transition-colors">
                  {cat.nameAr}
                </div>
                <div className="text-[11px] font-mono tracking-wider text-slate-400 uppercase">
                  {cat.nameEn}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
