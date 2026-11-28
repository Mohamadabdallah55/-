import React, { useId } from 'react';
export function CinematicStage({left='#c5ed5a',right='#c5ed5a',gold=false}:{left?:string;right?:string;gold?:boolean}) {
 const id=useId(), rim=id+'rim', floor=id+'floor', sky=id+'sky';
 const metal=gold?'#e7bd6e':'#b9dc77';
 return <svg aria-hidden="true" viewBox="0 0 1440 820" preserveAspectRatio="xMidYMid slice" className="pointer-events-none absolute inset-0 h-full w-full">
 <defs><radialGradient id={sky} cx="50%" cy="45%" r="65%"><stop stopColor="#2b3931"/><stop offset=".6" stopColor="#0b1312"/><stop offset="1" stopColor="#040605"/></radialGradient><linearGradient id={rim}><stop stopColor="#171c18"/><stop offset=".42" stopColor={metal}/><stop offset=".48" stopColor="#fff4c8"/><stop offset=".51" stopColor="#4c503c"/><stop offset="1" stopColor="#080d0b"/></linearGradient><linearGradient id={floor} x1="0" x2="0" y1="0" y2="1"><stop stopColor="#27332b"/><stop offset="1" stopColor="#040605"/></linearGradient></defs>
 <rect width="1440" height="820" fill={`url(#${sky})`}/>
 <path d="M0 0H260L460 420 0 630Z" fill="#0a100d"/><path d="M1440 0H1180L980 420 1440 630Z" fill="#0a100d"/>
 {[0,1,2,3,4].map(i=><g key={i} fill="none"><path d={`M${-180+i*114} 710V${240+i*20}L${720-i*13} ${-220+i*110}L${1620-i*114} ${240+i*20}V710`} stroke="#010302" strokeWidth={28-i*3}/><path d={`M${-180+i*114} 710V${240+i*20}L${720-i*13} ${-220+i*110}L${1620-i*114} ${240+i*20}V710`} stroke={`url(#${rim})`} strokeWidth="2" opacity={.65-i*.1}/></g>)}
 <g opacity=".18"><path d="M55 120 400 645 640 645 100 120Z" fill={left}/><path d="M1385 120 1040 645 800 645 1340 120Z" fill={right}/></g>
 <path d="M0 595H1440V820H0Z" fill={`url(#${floor})`}/>
 <g stroke={metal} opacity=".14" fill="none">{Array.from({length:14},(_,i)=><path key={i} d={`M720 555L${i*160-320} 820`}/>)}{[605,635,675,730,805].map(y=><path key={y} d={`M0 ${y}H1440`}/>)}</g>
 <path d="M0 595H1440" stroke={metal} strokeOpacity=".45"/>
 <ellipse cx="720" cy="690" rx="300" ry="59" fill="#040705" stroke="#a89b6b" strokeOpacity=".65"/><ellipse cx="720" cy="680" rx="270" ry="43" fill="#171d19" stroke={metal} strokeOpacity=".8"/><ellipse cx="720" cy="679" rx="226" ry="33" fill="#0b110e" stroke={metal} strokeOpacity=".28"/>
 {Array.from({length:24},(_,i)=><circle key={i} cx={(i*179+31)%1440} cy={(i*113+53)%600} r={i%4===0?1.6:.8} fill={metal} opacity={.12+(i%4)*.08}/>)}
 </svg>;
}
