import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, useReducedMotion } from 'motion/react';
import { Team } from '../types';
import { BrandMark } from './BrandMark';
import { GameIcon } from './GameIcons';
export function CinematicIntro({teams,onClose}:{teams:Team[];onClose:()=>void}) {
 const reduced = useReducedMotion();
 useEffect(()=>{const timer=window.setTimeout(onClose,reduced?100:2800); const listener=(e:KeyboardEvent)=>{if(e.key==='Escape')onClose()};window.addEventListener('keydown',listener);return()=>{window.clearTimeout(timer);window.removeEventListener('keydown',listener)}},[onClose,reduced]);
 return createPortal(<div role="dialog" aria-modal="true" aria-label="افتتاحية صراع النخبة" className="fixed inset-0 z-[10001] isolate overflow-hidden bg-[#050908] text-white">
   <svg viewBox="0 0 1200 700" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full -z-10" aria-hidden="true">
     <defs><radialGradient id="intro-lights"><stop stopColor="#bedf62" stopOpacity=".23"/><stop offset="1" stopColor="#050908"/></radialGradient></defs>
     <rect width="1200" height="700" fill="url(#intro-lights)"/>
     {[0,1,2,3,4].map(i=><g key={i} fill="none" stroke="#9ab754" strokeOpacity={.13+i*.025}><path d={`M${60+i*45} 700V${250+i*25}L600 ${-20+i*52}L${1140-i*45} ${250+i*25}V700`} strokeWidth={i===0?4:2}/></g>)}
     <g stroke="#b4d16d" strokeOpacity=".17" fill="none">{Array.from({length:11},(_,i)=><path key={i} d={`M600 370L${i*160-200} 700`}/>)}{[410,450,510,590,690].map(y=><path key={y} d={`M0 ${y}H1200`}/>)}</g>
     <ellipse cx="600" cy="580" rx="270" ry="48" fill="#131b12" stroke="#d1e78b" strokeOpacity=".35"/><ellipse cx="600" cy="571" rx="220" ry="30" fill="#080d09" stroke="#c5ed5a" strokeOpacity=".6"/>
   </svg>
   <button autoFocus onClick={onClose} className="absolute left-4 top-4 z-20 rounded-xl border border-white/25 bg-black/40 px-4 py-3 text-sm font-bold">تخطي الافتتاحية</button>
   <div className="absolute inset-x-0 top-[19%] flex items-start justify-center gap-2 sm:gap-6 px-4" aria-hidden="true">
     {teams.slice(0,6).map((team,i)=><motion.div key={team.id} initial={reduced?false:{y:-40,opacity:0}} animate={{y:0,opacity:1}} transition={{duration:.45,delay:.1+i*.09}} className="relative flex h-24 w-[11%] max-w-[100px] flex-col items-center justify-center gap-2 sm:h-40" style={{background:`linear-gradient(90deg,#0007,transparent,#0007),${team.color}`,clipPath:'polygon(0 0,100% 0,100% 80%,50% 100%,0 80%)'}}><GameIcon name={team.logo} className="h-7 w-7 text-white sm:h-12 sm:w-12"/><span className="font-orbitron text-lg font-black">{team.shortName}</span></motion.div>)}
   </div>
   <motion.div initial={reduced?false:{opacity:0,scale:.8,y:25}} animate={{opacity:1,scale:1,y:0}} transition={{duration:.65,delay:.55,ease:[.22,1,.36,1]}} className="absolute inset-x-0 top-[46%] flex flex-col items-center px-4 text-center">
     <BrandMark className="h-20 w-20 text-lime-200 sm:h-36 sm:w-36 drop-shadow-[0_0_35px_#c5ed5a77]"/>
     <h1 className="mt-3 font-changa text-4xl font-black sm:text-7xl text-[#e3f5b6]">صراع النخبة</h1><p className="mt-2 font-orbitron text-xs sm:text-lg tracking-[.32em] text-lime-300">CLASH OF ELITES</p>
     <p className="mt-4 text-sm sm:text-lg text-slate-200">ستة فرق · هدف واحد · لقب واحد</p>
   </motion.div>
 </div>,document.body);
}
