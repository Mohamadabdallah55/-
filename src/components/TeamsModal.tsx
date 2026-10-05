import React, { useState } from 'react';
import { Team } from '../types';
import { GameIcon } from './GameIcons';
import { X, Check, RotateCcw, Palette } from 'lucide-react';
import { INITIAL_TEAMS } from '../data/defaultGames';

interface TeamsModalProps {
  isOpen: boolean;
  onClose: () => void;
  teams: Team[];
  onSaveTeams: (updatedTeams: Team[]) => void;
}

const AVAILABLE_ICONS = [
  'crown',
  'shield',
  'flame',
  'zap',
  'target',
  'swords',
  'trophy',
  'brain',
  'gamepad',
  'activity',
];

const PRESET_COLORS = [
  '#A855F7', // Purple
  '#06B6D4', // Cyan
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#F43F5E', // Rose
  '#3B82F6', // Blue
  '#8B5CF6', // Violet
  '#EC4899', // Pink
];

export const TeamsModal: React.FC<TeamsModalProps> = ({
  isOpen,
  onClose,
  teams,
  onSaveTeams,
}) => {
  const [editedTeams, setEditedTeams] = useState<Team[]>(teams);

  if (!isOpen) return null;

  const handleChangeName = (index: number, name: string) => {
    const next = [...editedTeams];
    next[index] = { ...next[index], name };
    setEditedTeams(next);
  };

  const handleChangeShortName = (index: number, shortName: string) => {
    const next = [...editedTeams];
    next[index] = { ...next[index], shortName };
    setEditedTeams(next);
  };

  const handleChangeColor = (index: number, color: string) => {
    const next = [...editedTeams];
    next[index] = { ...next[index], color };
    setEditedTeams(next);
  };

  const handleChangeLogo = (index: number, logo: string) => {
    const next = [...editedTeams];
    next[index] = { ...next[index], logo };
    setEditedTeams(next);
  };

  const handleSave = () => {
    onSaveTeams(editedTeams);
    onClose();
  };

  const handleResetToDefault = () => {
    if (window.confirm('هل تريد استعادة أسماء وشعارات الفرق الافتراضية؟')) {
      setEditedTeams(INITIAL_TEAMS);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-[#0C1226] border border-slate-700 rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl relative text-right my-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 left-5 text-slate-400 hover:text-white p-1.5 rounded-xl bg-slate-800/80 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6 pb-3 border-b border-slate-800">
          <h2 className="text-xl font-bold font-changa text-white flex items-center gap-2">
            <span>إدارة وتسمية الفرق الستة (Teams Management)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            عدّل أسماء الفرق، الاختصارات، الألوان والشعارات. تُحفظ التعديلات تلقائياً في الترتيب والمواجهات.
          </p>
        </div>

        {/* 6 Teams Edit List */}
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          {editedTeams.map((team, idx) => (
            <div
              key={team.id}
              className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
            >
              {/* Team Index & Logo Picker */}
              <div className="flex items-center gap-3">
                <span className="font-orbitron font-bold text-slate-500 text-sm w-5">
                  #{idx + 1}
                </span>

                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white border shadow-md shrink-0 cursor-pointer"
                  style={{ backgroundColor: team.color, borderColor: `${team.color}80` }}
                  title="رمز وشعار الفريق"
                >
                  <GameIcon name={team.logo} className="w-5 h-5" />
                </div>

                {/* Team Name Inputs */}
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={team.name}
                      onChange={(e) => handleChangeName(idx, e.target.value)}
                      placeholder="اسم الفريق بالعربي"
                      className="bg-[#070B19] text-white font-changa font-bold text-sm px-3 py-1.5 rounded-lg border border-slate-700 focus:border-purple-400 focus:outline-none w-44 sm:w-52"
                    />
                    <input
                      type="text"
                      value={team.shortName}
                      onChange={(e) => handleChangeShortName(idx, e.target.value.toUpperCase())}
                      placeholder="SHORT NAME"
                      className="bg-[#070B19] text-white font-mono text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 focus:border-purple-400 focus:outline-none w-28 uppercase"
                    />
                  </div>
                </div>
              </div>

              {/* Color & Icon Selectors */}
              <div className="flex items-center gap-2 self-end sm:self-center">
                {/* Color Selector */}
                <div className="flex items-center gap-1">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => handleChangeColor(idx, c)}
                      className={`w-5 h-5 rounded-full transition-transform ${
                        team.color === c ? 'scale-125 ring-2 ring-white' : 'hover:scale-110 opacity-70'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>

                {/* Logo dropdown */}
                <select
                  value={team.logo}
                  onChange={(e) => handleChangeLogo(idx, e.target.value)}
                  className="bg-[#070B19] text-slate-300 text-xs px-2 py-1 rounded-md border border-slate-700"
                >
                  {AVAILABLE_ICONS.map((icon) => (
                    <option key={icon} value={icon}>
                      {icon}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Actions */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>استعادة الأسماء الأصلية</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 rounded-xl"
            >
              إلغاء
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 rounded-xl shadow-lg shadow-purple-600/30 flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>حفظ وتحديث الفرق</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
