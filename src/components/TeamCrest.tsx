import React, { useId } from 'react';
import { GameIcon } from './GameIcons';
import type { Team } from '../types';
export function TeamCrest({team,className=''}:{team?:Team;className?:string}) {
 const id=useId(), metal=id+'metal', body=id+'body', light=id+'light';
 const color=team?.color || '#778e68';
 return <div className={'relative aspect-[5/6] '+className} style={{filter:`drop-shadow(0 6px 14px ${color}55)`}}>
 <svg aria-hidden="true" viewBox="0 0 200 240" className="absolute inset-0 h-full w-full">
 <defs><linearGradient id={metal} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fff8d7"/><stop offset=".22" stopColor="#8f7444"/><stop offset=".41" stopColor="#f1d799"/><stop offset=".55" stopColor="#54452a"/><stop offset=".8" stopColor="#c2b079"/><stop offset="1" stopColor="#fff0b8"/></linearGradient><linearGradient id={body} x1="0" y1="0" x2="1" y2="1"><stop stopColor={color}/><stop offset=".55" stopColor="#121b18"/><stop offset="1" stopColor={color}/></linearGradient><linearGradient id={light}><stop stopColor="#ffffff" stopOpacity=".3"/><stop offset="1" stopColor="#ffffff" stopOpacity="0"/></linearGradient></defs>
 <path d="M100 8 188 37 183 132Q178 194 100 231Q22 194 17 132L12 37Z" fill="#080c0a" stroke={`url(#${metal})`} strokeWidth="7"/>
 <path d="M100 23 174 47 169 130Q165 182 100 215Q35 182 31 130L26 47Z" fill={`url(#${body})`} stroke={color} strokeWidth="2"/>
 <path d="M100 23 26 47 31 130Q35 182 100 215Z" fill={`url(#${light})`}/>
 <path d="M32 55 100 34 168 55M42 143Q54 184 100 201Q146 184 158 143" fill="none" stroke="#f6f1da" strokeOpacity=".35"/>
 <path d="M77 22 84 11 94 16 100 3 106 16 116 11 123 22 119 30H81Z" fill={`url(#${metal})`} stroke="#f7e2ac"/>
 </svg>
 <div className="absolute left-[25%] top-[24%] h-[45%] w-[50%] grid place-items-center"><GameIcon name={team?.logo || 'shield'} className="h-full w-full text-white" /></div>
 <div className="absolute bottom-[18%] inset-x-0 text-center font-orbitron font-black text-white text-sm sm:text-xl">{team?.shortName || ''}</div>
 </div>;
}
