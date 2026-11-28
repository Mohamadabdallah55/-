import React, { useLayoutEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { LeagueRow, MatchRecord } from '../types';
import { Trophy, History, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { CountUpValue } from './CountUpValue';
import { TeamCrest } from './TeamCrest';
import { CinematicStage } from './CinematicStage';
import { isCertifiedFinal } from '../utils/matchRules';
import './BigScreen.css';

interface StandingsTableProps {
 standings: LeagueRow[];
 matchesHistory: MatchRecord[];
 onOpenHistoryModal: () => void;
 onResetLeague: () => void;
}
export const StandingsTable: React.FC<StandingsTableProps> = ({standings,matchesHistory,onOpenHistoryModal,onResetLeague}) => {
 const reduced = useReducedMotion();
 const previous = useRef<Record<string,number>>({});
 const [changes,setChanges] = useState<Record<string,number>>({});
 const key = JSON.stringify(standings.map(r=>r.teamId));
 useLayoutEffect(()=>{
   const ids: string[]=JSON.parse(key);
   const next:Record<string,number>={},delta:Record<string,number>={};
   ids.forEach((id,i)=>{next[id]=i+1;if(previous.current[id]!==undefined)delta[id]=previous.current[id]-i-1;});
   previous.current=next;setChanges(delta);
 },[key,matchesHistory.length]);
 const leader = standings[0]?.played > 0 ? standings[0] : undefined;
 const final = matchesHistory.filter(isCertifiedFinal).sort((a,b)=>b.timestamp-a.timestamp)[0];
 const leaderCaption = leader ? (final?.winnerId===leader.teamId?'البطل المعتمد':'متصدر الترتيب') : 'بانتظار النتائج';
 return <section dir="rtl" className="ce-rankboard">
   <div className="ce-rankhero">
     <div className="ce-rank-scene"><CinematicStage gold left={leader?.team.color} right={leader?.team.color}/></div>
     <div className="ce-rankhero-copy">
       <span className="ce-eyebrow">CLASH OF ELITES / LEADERBOARD</span>
       <h2>ترتيب النخبة</h2>
       <p>الترتيب الرسمي · {matchesHistory.length} مواجهة مكتملة</p>
       <div className="ce-rank-actions"><button onClick={onOpenHistoryModal}><History size={18}/> سجل المواجهات</button>{matchesHistory.length>0&&<button onClick={onResetLeague}><Trash2 size={16}/> تصفير الدوري</button>}</div>
     </div>
     {leader&&<div className="ce-leader"><TeamCrest team={leader.team} className="ce-leader-crest"/><div><span className="ce-eyebrow">{leaderCaption}</span><strong>{leader.team.name}</strong><span className="ce-leader-points"><CountUpValue value={leader.points}/> نقطة</span></div></div>}
   </div>
   <div className="ce-rank-grid ce-rank-header"><span>المركز</span><span>الفريق</span><span>لعب</span><span>فاز</span><span>خسر</span><span>له</span><span>عليه</span><span>الفارق</span><span>النقاط</span></div>
   <div className="ce-rank-rows">
     {standings.map((row,i)=>{
       const change=changes[row.teamId]||0;
       return <motion.article key={row.teamId} layout={reduced?false:'position'} transition={{layout:{duration:.44,ease:[.22,1,.36,1]}}} className={'ce-rank-grid ce-rank-row '+(i===0&&row.played?'ce-rank-first':'')} style={{'--team':row.team.color} as React.CSSProperties}>
         <div className="ce-rank-number"><b>{String(i+1).padStart(2,'0')}</b>{change!==0&&<span className={change>0?'ce-rise':'ce-fall'} aria-label={(change>0?'صعد ':'هبط ')+Math.abs(change)}>{change>0?<ArrowUp size={15}/>:<ArrowDown size={15}/>} {Math.abs(change)}</span>}</div>
         <div className="ce-rank-team"><TeamCrest team={row.team} className="ce-row-crest"/><div className="ce-rank-name"><h3>{row.team.name}</h3>{row.team.captain&&<small>{row.team.captain}</small>}<div className="ce-form">{row.form.map((r,n)=><i key={n} title={r==='W'?'فوز':'خسارة'} className={r==='W'?'win':'loss'}>{r==='W'?'ف':'خ'}</i>)}</div></div></div>
         {[[row.played,'لعب'],[row.won,'فاز'],[row.lost,'خسر'],[row.gf,'له'],[row.ga,'عليه'],[row.gd,'الفارق']].map(([n,label],idx)=><div className={'ce-rank-stat '+(idx===1?'ce-win':idx===2?'ce-loss':'')} key={label}><small>{label}</small><b>{idx===5&&Number(n)>0?'+':''}{n}</b></div>)}
         <div className="ce-rank-points"><CountUpValue value={row.points}/><small>نقطة</small></div>
       </motion.article>;
     })}
   </div>
   <p className="ce-rank-note">النقاط حسب إعدادات كل أسبوع، ثم فارق الجولات والجولات المسجلة. المتصدر ليس بالضرورة بطل النهائي.</p>
 </section>;
};
