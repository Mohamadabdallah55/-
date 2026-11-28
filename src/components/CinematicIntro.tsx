import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Team } from '../types';
import { BrandMark } from './BrandMark';
import { GameIcon } from './GameIcons';
import { CinematicStage } from './CinematicStage';
import { FinalPresentation } from './FinalPresentation';
export function CinematicIntro({teams,onClose}:{teams:Team[];onClose:()=>void}) {
 const reduced = useReducedMotion();
 const [scene,setScene]=useState(0);
 const durations=[3500,6500,6000];
 useEffect(()=>{const timer=window.setTimeout(()=>{if(scene<2)setScene(scene+1);else onClose();},durations[scene]);return()=>window.clearTimeout(timer)},[scene,onClose]);
 useEffect(()=>{const listener=(e:KeyboardEvent)=>{if(e.key==='Escape')onClose()};window.addEventListener('keydown',listener);return()=>window.removeEventListener('keydown',listener)},[onClose]);

 return createPortal(<div role="dialog" aria-modal="true" aria-label="افتتاحية صراع النخبة" className="fixed inset-0 z-[10001] isolate overflow-hidden bg-[#050908] text-white">
   <button autoFocus onClick={onClose} className="absolute left-4 top-4 z-20 rounded-xl border border-white/25 bg-black/40 px-4 py-3 text-sm font-bold">تخطي الافتتاحية</button>
   <AnimatePresence mode="wait" initial={false}>
   {scene===0?<motion.div key="opening" className="absolute inset-0 isolate" initial={false} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:reduced?0:.28}}>
   <motion.div initial={reduced?false:{opacity:0,scale:1.05}} animate={{opacity:1,scale:1}} transition={{duration:1.05,ease:'easeOut'}} className="absolute inset-0 -z-10"><CinematicStage/></motion.div>
   <div className="absolute inset-x-0 top-[19%] flex items-start justify-center gap-2 sm:gap-6 px-4" aria-hidden="true">
     {teams.slice(0,6).map((team,i)=><motion.div key={team.id} initial={reduced?false:{y:-40,opacity:0}} animate={{y:0,opacity:1}} transition={{duration:.45,delay:.1+i*.09}} className="relative flex h-24 w-[11%] max-w-[100px] flex-col items-center justify-center gap-2 sm:h-40" style={{background:`linear-gradient(90deg,#0007,transparent,#0007),${team.color}`,clipPath:'polygon(0 0,100% 0,100% 80%,50% 100%,0 80%)'}}><GameIcon name={team.logo} className="h-7 w-7 text-white sm:h-12 sm:w-12"/><span className="font-orbitron text-lg font-black">{team.shortName}</span></motion.div>)}
   </div>
   <motion.div initial={reduced?false:{opacity:0,scale:.8,y:25}} animate={{opacity:1,scale:1,y:0}} transition={{duration:.65,delay:.55,ease:[.22,1,.36,1]}} className="absolute inset-x-0 top-[46%] flex flex-col items-center px-4 text-center">
     <BrandMark className="h-20 w-20 text-lime-200 sm:h-36 sm:w-36 drop-shadow-[0_0_35px_#c5ed5a77]"/>
     <h1 className="mt-3 font-changa text-4xl font-black sm:text-7xl text-[#e3f5b6]">صراع النخبة</h1><p className="mt-2 font-orbitron text-xs sm:text-lg tracking-[.32em] text-lime-300">CLASH OF ELITES</p>
     <p className="mt-4 text-sm sm:text-lg text-slate-200">ستة فرق · هدف واحد · لقب واحد</p>
   </motion.div>
   </motion.div>:<motion.div key={scene} className="absolute inset-0 flex ce-opening-final-scene" initial={reduced?false:{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:reduced?0:.3}}><FinalPresentation view={scene===1?'welcome':'finalists'} teams={teams}/></motion.div>}
   </AnimatePresence>
 </div>,document.body);
}
