import {test,expect} from 'bun:test';
import {swapCardSides,setArenaCard} from '../src/utils/arenaRules.ts';
test('the same acting team remains the actor after swapping sides',()=>{const cards={x:{gameId:'x',status:'banned_team_a'},y:{gameId:'y',status:'picked_team_b'}};const next=swapCardSides(cards);expect(next.x.status).toBe('banned_team_b');expect(next.y.status).toBe('picked_team_a');expect(swapCardSides(next)).toEqual(cards);});
test('only one current game, previous one completed',()=>{const cards=setArenaCard({x:{gameId:'x',status:'current'}},'y','current');expect(cards.x.status).toBe('completed');expect(cards.y.status).toBe('current');expect(setArenaCard(cards,'y','available').y).toBeUndefined();});

test('picker survives active and completed status and side swaps',()=>{const picked=setArenaCard({},'x','picked_team_b');const active=setArenaCard(picked,'x','current');expect(active.x.pickedBy).toBe('b');const done=setArenaCard(active,'y','current');expect(done.x.status).toBe('completed');expect(done.x.pickedBy).toBe('b');expect(swapCardSides(done).x.pickedBy).toBe('a');expect(setArenaCard(done,'x','banned_team_a').x.pickedBy).toBeUndefined();});
