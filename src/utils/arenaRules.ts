import type { CardState, BanPickStatus } from '../types';
export function swapCardSides(cards: Record<string,CardState>): Record<string,CardState> {
 const remap:Partial<Record<BanPickStatus,BanPickStatus>>={banned_team_a:'banned_team_b',banned_team_b:'banned_team_a',picked_team_a:'picked_team_b',picked_team_b:'picked_team_a'};
 return Object.fromEntries(Object.entries(cards).map(([id,card])=>[id,{...card,status:remap[card.status]||card.status}]));
}
export function setArenaCard(cards:Record<string,CardState>,gameId:string,status:BanPickStatus):Record<string,CardState>{
 const next={...cards};
 if(status==='current')for(const [id,card] of Object.entries(next))if(id!==gameId&&card.status==='current')next[id]={...card,status:'completed'};
 if(status==='available')delete next[gameId];else next[gameId]={...next[gameId],gameId,status};
 return next;
}
