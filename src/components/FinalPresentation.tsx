import React from 'react';
import {motion,useReducedMotion} from 'motion/react';
import {CinematicStage} from './CinematicStage';
import {EliteTrophy} from './EliteTrophy';
import {TeamCrest} from './TeamCrest';
import {BrandMark} from './BrandMark';
import {INITIAL_TEAMS} from '../data/defaultGames';
import type {Team} from '../types';
import './FinalPresentation.css';

export type BroadcastView='scoreboard'|'games'|'welcome'|'finalists';
export const isBroadcastView=(v:unknown):v is BroadcastView=>v==='scoreboard'||v==='games'||v==='welcome'||v==='finalists';

export function FinalPresentation({view,teams}:{view:'welcome'|'finalists';teams:Team[]}){
 const reduced=useReducedMotion();
 const get=(id:string)=>teams.find(t=>t.id===id)||INITIAL_TEAMS.find(t=>t.id===id);
 const e=get('team-5'),d=get('team-4');
 const reveal=(delay=0,x=0)=>({initial:reduced?false:{opacity:0,y:24,x,scale:.96},animate:{opacity:1,y:0,x:0,scale:1},transition:{duration:.65,delay:reduced?0:delay,ease:[.22,1,.36,1] as [number,number,number,number]}});
 return <section className={'ce-final-scene ce-final-'+view} dir="rtl">
   <div className="ce-final-background"><CinematicStage gold left={view==='finalists'?d?.color:'#d5aa55'} right={view==='finalists'?e?.color:'#d5aa55'}/></div>
   <div className="ce-final-frame" aria-hidden="true"/><div className="ce-final-rays" aria-hidden="true"/>
   <motion.header {...reveal(.05)} className="ce-final-kicker"><BrandMark className="ce-final-brand"/><span>CLASH OF ELITES</span><i/> <span>THE GRAND FINAL</span></motion.header>
   {view==='welcome'?<div className="ce-welcome-content">
     <motion.div {...reveal(.1)} className="ce-welcome-cup"><EliteTrophy className="ce-final-trophy"/></motion.div>
     <motion.div {...reveal(.3)} className="ce-welcome-copy"><p className="ce-final-overline">ليلة الختام · دوري صراع النخبة</p><h1>أهلًا وسهلًا<br/>بجمهور النخبة</h1><p className="ce-welcome-sub">نتمنى لكم مشاهدة ممتعة</p><p className="ce-welcome-line">شجّعوا بروح رياضية، واستمتعوا بلحظات النهائي.</p></motion.div>
   </div>:<div className="ce-finalists-content">
     <motion.div {...reveal(.08)} className="ce-finalists-heading"><p className="ce-final-overline">المواجهة الختامية</p><h1>طرفي النهائي</h1></motion.div>
     <div className="ce-finalists-grid">
       <motion.div {...reveal(.2,70)} className="ce-final-contender" style={{'--final-team':e?.color||'#f43f5e'} as React.CSSProperties}><div className="ce-final-teamlight"/><TeamCrest team={e} className="ce-final-crest"/><span className="ce-final-teamid">TEAM E</span><h2>يوسف</h2><p>الفريق E</p></motion.div>
       <motion.div {...reveal(.42)} className="ce-final-center"><EliteTrophy className="ce-final-trophy"/><div className="ce-final-vs">VS</div><span>كأس النخبة</span></motion.div>
       <motion.div {...reveal(.2,-70)} className="ce-final-contender" style={{'--final-team':d?.color||'#f59e0b'} as React.CSSProperties}><div className="ce-final-teamlight"/><TeamCrest team={d} className="ce-final-crest"/><span className="ce-final-teamid">TEAM D</span><h2>عمر</h2><p>الفريق D</p></motion.div>
     </div>
     <motion.p {...reveal(.6)} className="ce-final-tagline">فريقان · لقب واحد · من يرفع الكأس؟</motion.p>
   </div>}
   <motion.footer {...reveal(.6)} className="ce-final-foot"><span>دوري صراع النخبة</span><span>النهائي الكبير</span></motion.footer>
 </section>;
}
