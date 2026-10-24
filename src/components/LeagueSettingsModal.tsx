import React, { useState } from 'react';
import { Check, Settings2, X } from 'lucide-react';
import { LeagueSettings } from '../types';

interface Props { isOpen: boolean; onClose: () => void; settings: LeagueSettings; onSave: (settings: LeagueSettings) => void; }

export const LeagueSettingsModal: React.FC<Props> = ({ isOpen, onClose, settings, onSave }) => {
  const [draft, setDraft] = useState<LeagueSettings>(settings);
  React.useEffect(() => { if (isOpen) setDraft(settings); }, [isOpen, settings]);
  if (!isOpen) return null;
  const weeks = Array.from({ length: Math.max(8, draft.currentWeek + 2) }, (_, i) => i + 1);
  return <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
    <section className="league-settings-modal" role="dialog" aria-modal="true" aria-labelledby="league-settings-title">
      <button className="vault-modal-close" aria-label="إغلاق" onClick={onClose}><X /></button>
      <div className="league-settings-heading"><Settings2 /><div><span>LEAGUE CONFIGURATION</span><h2 id="league-settings-title">إعدادات الدوري</h2><p>حدّد الأسبوع الحالي ونقاط الفوز لكل أسبوع.</p></div></div>
      <label className="league-current-week">الأسبوع الحالي
        <input type="number" min="1" max="52" value={draft.currentWeek} onChange={(e) => setDraft({ ...draft, currentWeek: Math.max(1, Number(e.target.value) || 1) })} />
      </label>
      <div className="league-week-points">{weeks.map((week) => <label key={week}><span>الأسبوع {week}</span><small>نقطة للفوز</small><input aria-label={`نقاط الفوز للأسبوع ${week}`} type="number" min="0" max="99" value={draft.pointsByWeek[week] ?? 3} onChange={(e) => setDraft({ ...draft, pointsByWeek: { ...draft.pointsByWeek, [week]: Math.max(0, Number(e.target.value) || 0) } })} /></label>)}</div>
      <footer><button className="league-settings-cancel" onClick={onClose}>إلغاء</button><button className="league-settings-save" onClick={() => { onSave(draft); onClose(); }}><Check /> حفظ الإعدادات</button></footer>
    </section>
  </div>;
};
