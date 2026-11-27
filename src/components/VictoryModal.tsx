import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Team, CurrentMatch } from '../types';
import { GameIcon } from './GameIcons';
import { EliteTrophy } from './EliteTrophy';
import { X, Camera } from 'lucide-react';
import confetti from 'canvas-confetti';
import { sound } from '../utils/audio';

interface VictoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  winnerTeam: Team;
  loserTeam: Team;
  currentMatch: CurrentMatch | null;
  onNextMatch?: () => void;
  onOpenRecapModal?: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  isOpen,
  onClose,
  winnerTeam,
  loserTeam,
  currentMatch,
  onNextMatch,
  onOpenRecapModal,
}) => {
  const reducedMotion = useReducedMotion();
  const [championship, setChampionship] = useState(currentMatch?.stage === 'final');
  useEffect(() => {
    if (!isOpen) return;
    setChampionship(currentMatch?.stage === 'final');
  }, [isOpen, winnerTeam.id, currentMatch?.stage]);
  useEffect(() => {
    if (!isOpen) return;
    sound.playChampionshipVictory();
    if (reducedMotion) return;
    try {
      confetti({ particleCount: 70, spread: 75, origin: { y: 0.62 }, zIndex: 10000, disableForReducedMotion: true, colors: [winnerTeam.color, '#f59e0b', '#fef3c7'] });
    } catch {}
  }, [isOpen, winnerTeam.id, winnerTeam.color, reducedMotion]);
  useEffect(() => {
    if (!isOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  const winnerScore = currentMatch ? (currentMatch.teamAId === winnerTeam.id ? currentMatch.teamAScore : currentMatch.teamBScore) : null;
  const loserScore = currentMatch ? (currentMatch.teamAId === loserTeam.id ? currentMatch.teamAScore : currentMatch.teamBScore) : null;
  const canCrown = currentMatch?.stage === 'final' && winnerScore !== null && loserScore !== null && winnerScore > loserScore;

  return (
    <div role="dialog" aria-modal="true" aria-label={championship ? 'تتويج بطل الدوري' : 'احتفال فوز المواجهة'} className="fixed inset-0 z-[9999] overflow-y-auto bg-[#060908] text-center text-white">
      <div aria-hidden="true" className="fixed inset-0 pointer-events-none" style={{background:`radial-gradient(ellipse at 50% 10%, #d6a64c30, transparent 50%), radial-gradient(ellipse at 50% 50%, ${winnerTeam.color}38, transparent 62%)`}} />
      <div className="relative mx-auto flex min-h-full max-w-5xl flex-col items-center justify-center px-4 py-12 sm:px-10 sm:py-16">
        <button autoFocus type="button" onClick={onClose} aria-label="إغلاق شاشة التتويج" className="absolute left-4 top-4 grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-black/40 text-white hover:bg-white/15"><X className="h-6 w-6" /></button>
        <motion.div initial={reducedMotion ? false : { opacity:0, y:14 }} animate={{opacity:1,y:0}} transition={{duration:0.4}} className="w-full">
          <p className="font-orbitron text-[10px] sm:text-sm font-bold tracking-[0.3em] text-amber-300">ELITE CLASH / HALL OF VICTORY</p>
          <h1 className="mt-3 font-changa text-3xl sm:text-6xl font-black text-white">{championship ? 'بطل صراع النخبة' : 'لحظة الانتصار'}</h1>
          {/* Original faceted cup, drawn as vector geometry; no external models or artwork. */}
          <div className="relative mx-auto my-2 flex h-56 w-full max-w-[450px] sm:h-80 items-center justify-center">
            <div aria-hidden="true" className="absolute inset-0 pointer-events-none" style={{background:'conic-gradient(from 150deg at 50% 12%,transparent 0deg,#f8d88a25 16deg,transparent 30deg,transparent 90deg,#f8d88a25 105deg,transparent 120deg)'}}/>
            <svg aria-hidden="true" viewBox="0 0 360 75" className="absolute bottom-0 w-full max-w-sm"><ellipse cx="180" cy="45" rx="145" ry="24" fill="#000" stroke="#a87c36"/><ellipse cx="180" cy="36" rx="116" ry="18" fill="#171b14" stroke="#e9bc65" strokeOpacity=".65"/></svg>
            <motion.div initial={reducedMotion ? false : {y:35,scale:.9,opacity:0}} animate={{y:0,scale:1,opacity:1}} transition={{duration:.8,ease:[0.22,1,0.36,1]}} className="relative h-[96%] aspect-[6/7]"><EliteTrophy className="h-full w-full drop-shadow-[0_15px_25px_#e6b95b40]" /></motion.div>
          </div>
          <motion.div initial={reducedMotion ? false : {opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{duration:.45,delay:reducedMotion?0:.45}} className="mx-auto flex max-w-xl flex-col items-center border-y border-amber-300/35 bg-black/25 px-4 py-5 sm:px-8">
            <span className="grid h-16 w-16 sm:h-20 sm:w-20 place-items-center rounded-2xl border-2" style={{backgroundColor:winnerTeam.color,borderColor:'#ffffff50'}}><GameIcon name={winnerTeam.logo || 'crown'} className="h-10 w-10 text-white" /></span>
            <h2 className="mt-3 break-words max-w-full font-changa text-3xl sm:text-5xl font-black text-white">{winnerTeam.name}</h2>
            {winnerTeam.captain && <p className="mt-1 text-sm text-amber-200">الكابتن: {winnerTeam.captain}</p>}
            {winnerScore !== null && loserScore !== null ? (
              <div className="mt-4 flex items-center justify-center gap-4 font-orbitron text-3xl sm:text-4xl font-black tabular-nums" dir="ltr">
                <span className="text-amber-300">{winnerScore}</span><span className="text-slate-500">:</span><span className="text-slate-300">{loserScore}</span>
              </div>
            ) : <p className="mt-4 text-sm text-slate-300">نتيجة المواجهة غير متاحة في أمر الاحتفال.</p>}
            <p className="mt-2 text-xs sm:text-sm text-slate-300">المنافس: {loserTeam.name}</p>
          </motion.div>
          <div className="mx-auto mt-6 flex max-w-2xl flex-wrap items-center justify-center gap-3">
            {canCrown && !championship && <button type="button" onClick={() => { if (window.confirm('هل هذه المباراة هي النهائي الرسمي، وهل تم اعتماد هذا الفريق بطلاً للدوري؟')) setChampionship(true); }} className="rounded-xl border border-amber-400/60 bg-amber-950/40 px-5 py-3 font-changa font-bold text-amber-200">عرض تتويج بطل الدوري</button>}
            {championship && <button type="button" onClick={()=>setChampionship(false)} className="rounded-xl border border-white/20 px-5 py-3 font-changa text-sm">العودة إلى احتفال المواجهة</button>}
            {onOpenRecapModal && <button type="button" onClick={onOpenRecapModal} className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-5 py-3 font-changa text-sm"><Camera className="h-4 w-4" /> ملخص المواجهة</button>}
            {onNextMatch && <button type="button" onClick={() => {onClose();onNextMatch();}} className="rounded-xl bg-amber-300 px-5 py-3 font-changa font-bold text-slate-950 hover:bg-amber-200">مواجهة جديدة</button>}
            <button type="button" onClick={onClose} className="rounded-xl border border-white/20 px-5 py-3 font-changa text-sm text-slate-200">إغلاق العرض</button>
          </div>
          <p className="mt-4 text-xs text-slate-400">{championship ? 'عرض تتويج مرئي بناءً على اعتماد المنظم؛ لا يغيّر نتائج الدوري.' : 'فوز المواجهة لا يعني تلقائياً الفوز بلقب الدوري.'}</p>
        </motion.div>
      </div>
    </div>
  );
};
