import {describe,it,expect} from 'vitest'
import {newEscort,player,checkCommand,resolveEscort} from '../src/game/than-thu-v2/escort-core'
function room(){const r=newEscort('a',0,1,1);r.players.push(player('b',2,100,1),player('c',3,1,2),player('d',4,50,3));r.started=true;r.deadline=999999;return r}
describe('Hộ Tống Linh Tâm',()=>{
 it('cấp 1 và 100 cùng chỉ số; chặn dịch chuyển, chưởng thiếu năng lượng và bắn đồng đội',()=>{const r=room(),p=r.players[0]!;expect(r.players.map(p=>p.hp)).toEqual([100,100,100,100]);expect(()=>checkCommand(r,p,{type:'move',x:6,y:4})).toThrow();expect(()=>checkCommand(r,p,{type:'blast',target:1})).toThrow();p.energy=2;expect(()=>checkCommand(r,p,{type:'blast',target:2})).toThrow()})
 it('nhặt tinh thể, đưa về căn cứ, đủ hai viên thắng',()=>{const r=room(),p=r.players[0]!;p.correct=true;p.x=3;p.y=2;p.command={type:'guard'};resolveEscort(r,2);expect(r.crystal.carrier).toBe('a');p.correct=true;p.command={type:'guard'};p.x=0;p.y=2;r.score[0]=1;resolveEscort(r,3);expect(r.score[0]).toBe(2);expect(r.finished).toBe(true);expect(r.winner).toBe(0)})
 it('bị hạ rơi tinh thể, hồi sinh và còn quyền chơi; hết thời gian xử hoà',()=>{const r=room(),p=r.players[0]!;p.x=3;p.y=2;p.hp=0;r.crystal.carrier=p.id;resolveEscort(r,2);expect(p.hp).toBe(100);expect(p.x).toBe(0);expect(r.crystal.carrier).toBeNull();r.deadline=3;resolveEscort(r,4);expect(r.finished).toBe(true);expect(r.winner).toBeNull()})
 it('tám kỹ năng đều giải quyết được; tường có hạn, người mang không nhảy hai ô',()=>{for(let pet=0;pet<8;pet++){const r=room(),p=r.players[0]!;p.pet=pet;p.correct=true;p.energy=2;p.x=2;p.y=2;r.players[1]!.x=4;r.players[1]!.y=2;p.command={type:'skill',x:2,y:1,target:1};checkCommand(r,p,p.command);resolveEscort(r,2);expect(r.effects.length).toBeGreaterThan(0)}const r=room(),p=r.players[2]!;r.crystal.carrier=p.id;p.energy=2;expect(()=>checkCommand(r,p,{type:'skill',x:2,y:3})).toThrow()})
 it('tranh ô không chồng hình; đúng cùng lượt được giáp đồng đội',()=>{const r=room();r.players[0]!.x=2;r.players[0]!.y=2;r.players[1]!.x=4;r.players[1]!.y=2;r.players[0]!.command={type:'move',x:3,y:2};r.players[1]!.command={type:'move',x:3,y:2};r.players[0]!.correct=r.players[2]!.correct=true;resolveEscort(r,2);expect(r.players.filter(p=>p.x===3&&p.y===2)).toHaveLength(1);expect(r.players[0]!.shield).toBeGreaterThanOrEqual(10)})
})

import {newSoloEscort,prepareBoss} from '../src/game/than-thu-v2/escort-core'
describe('Tự luyện với Boss',()=>{
 it('bắt đầu ngay, hai phe, không tạo bằng chứng học giả',()=>{const r=newSoloEscort('em',0,5,1000);expect(r.started).toBe(true);expect(r.players).toHaveLength(2);prepareBoss(r);const boss=r.players[1]!;expect(boss.credit).toEqual([]);expect(boss.correct).toBe(false);expect(()=>checkCommand(r,boss,boss.command!)).not.toThrow()})
 it('Boss đuổi người mang tinh thể và tìm đường tránh tường',()=>{const r=newSoloEscort('em',0,5,1000);const boss=r.players[1]!;boss.x=4;boss.y=2;r.players[0]!.x=3;r.players[0]!.y=2;r.crystal.carrier='em';prepareBoss(r);expect(boss.command?.type).toBe('blast');delete boss.command;r.crystal.carrier=null;r.players[0]!.x=0;r.walls.push({x:3,y:2,until:10});prepareBoss(r);expect(()=>checkCommand(r,boss,boss.command!)).not.toThrow();expect(boss.command).not.toMatchObject({x:3,y:2})})
 it('không tự điều khiển người chơi PvP',()=>{const r=room();prepareBoss(r);expect(r.players.every(p=>!p.command)).toBe(true)})
})
it('sai chỉ được khiên yếu, hết giờ đứng yên; nhặt và giao tinh thể cần đúng tự làm',()=>{
 const r=room(),p=r.players[0]!;p.x=3;p.y=2;p.energy=2
 expect(()=>checkCommand(r,p,{type:'move',x:2,y:2})).toThrow('đúng');expect(()=>checkCommand(r,p,{type:'skill',x:2,y:2})).toThrow('đúng')
 p.command={type:'guard'};resolveEscort(r,2);expect(p.shield).toBe(5);expect(r.crystal.carrier).toBeNull()
 const before=p.shield;resolveEscort(r,3);expect(p.shield).toBe(before)
 r.crystal.carrier=p.id;p.x=0;p.command={type:'guard'};resolveEscort(r,4);expect(r.score[0]).toBe(0)
 p.correct=true;p.command={type:'guard'};resolveEscort(r,5);expect(r.score[0]).toBe(1)
})
