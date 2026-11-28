import { test, expect } from 'bun:test';
import { applyRoundScore, isCertifiedFinal } from '../src/utils/matchRules.ts';
const initial = () => ({teamAId:'a',teamBId:'b',teamAScore:0,teamBScore:0,currentRound:1,rounds:[],activeGameId:null});
test('real B-A-B-A-A sequence is stored and a sixth round is rejected',()=>{
 let m=initial(); for(const slot of ['B','A','B','A','A'])m=applyRoundScore(m,slot,1,[]);
 expect([m.teamAScore,m.teamBScore]).toEqual([3,2]);
 expect(m.rounds.map(r=>r.winnerTeamId)).toEqual(['b','a','b','a','a']);
 expect(applyRoundScore(m,'B',1,[])).toBe(m);
});
test('correction removes the last actual win and renumbers the rounds',()=>{
 let m=initial(); for(const slot of ['B','A','B'])m=applyRoundScore(m,slot,1,[]);
 m=applyRoundScore(m,'B',-1,[]);
 expect(m.rounds.map(r=>[r.round,r.winnerTeamId])).toEqual([[1,'b'],[2,'a']]);
 expect(m.teamBScore).toBe(1);
});
test('old aggregate scores never fabricate round winners',()=>{
 const m=applyRoundScore({...initial(),teamBScore:2},'A',1,[]);
 expect(m.rounds).toEqual([]);
});
test('no negative score, invalid delta, or self-match',()=>{
 const m=initial();expect(applyRoundScore(m,'A',-1,[])).toBe(m);
 expect(applyRoundScore(m,'A',2,[])).toBe(m);
 const bad={...m,teamBId:'a'};expect(applyRoundScore(bad,'A',1,[])).toBe(bad);
});
test('only a valid saved final certifies a champion',()=>{
 const m={stage:'final',teamAId:'a',teamBId:'b',teamAScore:2,teamBScore:3,winnerId:'b',loserId:'a'};
 expect(isCertifiedFinal(m)).toBe(true);
 expect(isCertifiedFinal({...m,winnerId:'a'})).toBe(false);
 expect(isCertifiedFinal({...m,teamAScore:3})).toBe(false);
 expect(isCertifiedFinal({...m,stage:undefined})).toBe(false);
 expect(isCertifiedFinal({...m,teamAScore:-1})).toBe(false);
});
