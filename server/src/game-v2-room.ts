import type {Env} from './kieu'
import {PETS,newArena,arenaAction,arenaPower} from '../../src/game/than-thu-v2/core'
import type {Arena,ArenaAction} from '../../src/game/than-thu-v2/core'
interface Member {sbd:string;pet:string;board:Arena;ready:boolean;credit:string[]}
interface Room {owner:string;round:number;started:boolean;finished:boolean;members:Member[];roundAt:number;created:number}
function view(room:Room,sbd:string,id:string,revision:number){return {ok:true,room:{id,revision,round:room.round,started:room.started,finished:room.finished,owner:room.owner===sbd,members:room.members.map((m,i)=>({alias:`${PETS.find(p=>p.id===m.pet)?.name??'Thần thú'} ${i+1}`,self:m.sbd===sbd,ready:m.ready,hp:m.board.hp,units:m.board.units.filter(u=>u.pos!==null)})),board:room.members.find(m=>m.sbd===sbd)?.board}}}
function resolveRound(room:Room,now:number){
 const alive=room.members.filter(m=>m.board.hp>0)
 if(alive.length<=1){room.finished=true;return}
 if(!alive.every(m=>m.ready))return
    const order=[...alive];if(order.length>2){const first=order.shift()!;for(let i=0;i<(room.round-1)%(order.length);i++)order.unshift(order.pop()!);order.unshift(first)}
    for(let i=0;i<order.length;i+=2){const a=order[i]!;const enemy=order[i+1]??order[0]!;const pa=arenaPower(a.board);const pb=arenaPower(enemy.board);const loss=Math.min(25,8+room.round)
     if(pa<pb)a.board.hp=Math.max(0,a.board.hp-loss);else if(pa>pb&&i+1<order.length)enemy.board.hp=Math.max(0,enemy.board.hp-loss)
     a.board.log.unshift(`Vòng ${room.round}: sức đội ${Math.round(pa)} / ${Math.round(pb)} · ${pa>=pb?'giữ máu':'mất '+loss+' máu'}.`)
     if(i+1<order.length)enemy.board.log.unshift(`Vòng ${room.round}: sức đội ${Math.round(pb)} / ${Math.round(pa)} · ${pb>=pa?'giữ máu':'mất '+loss+' máu'}.`)
    }
    room.round++;room.roundAt=now;room.finished=room.round>10||room.members.filter(m=>m.board.hp>0).length<=1
    for(const m of room.members){m.ready=false;m.credit=[];m.board.round=room.round;m.board.gold+=5+Math.min(5,Math.floor(m.board.gold/10));m.board.learned=0;m.board.finished=room.finished||m.board.hp===0;m.board.shop=newArena(m.board.seed+room.round).shop;m.board.log=m.board.log.slice(0,10)}
}
export async function roomAction(env:Env,sbd:string,pet:string,action:string,b:Record<string,unknown>):Promise<Record<string,unknown>>{
 const now=Date.now();if(action==='room-create'){
  const id=[...crypto.getRandomValues(new Uint8Array(5))].map(x=>x.toString(16).padStart(2,'0')).join('').toUpperCase()
  const room:Room={owner:sbd,round:1,started:false,finished:false,members:[{sbd,pet,board:newArena(crypto.getRandomValues(new Uint32Array(1))[0]!),ready:false,credit:[]}],roundAt:now,created:now}
  await env.DB.prepare('INSERT INTO game_v2_room(id,json,created_at) VALUES(?,?,?)').bind(id,JSON.stringify(room),new Date(now).toISOString()).run();return view(room,sbd,id,0)
 }
 const id=String(b.room??'').trim().toUpperCase();const row=await env.DB.prepare('SELECT json,revision FROM game_v2_room WHERE id=?').bind(id).first<{json:string;revision:number}>();if(!row)throw new Error('Không tìm thấy phòng.')
 const room=JSON.parse(row.json) as Room;if(now-room.created>6*3600000)throw new Error('Phòng đã hết hạn. Em mở phòng mới.')
 let me=room.members.find(m=>m.sbd===sbd)
 if(action==='room-join'&&!me){if(room.started||room.members.length>=6)throw new Error('Phòng đã bắt đầu hoặc đủ sáu người.');me={sbd,pet,board:newArena(room.members[0]!.board.seed),ready:false,credit:[]};room.members.push(me)}
 if(!me)throw new Error('Em chưa tham gia phòng này.')
 if(action==='room-view')return view(room,sbd,id,row.revision)
 if(action!=='room-join'&&Number(b.revision)!==row.revision)throw new Error('Phòng vừa thay đổi. Em tải lại bàn cờ.')
 if(action==='room-start'){
  if(room.owner!==sbd||room.started||room.members.length<2)throw new Error('Chủ phòng bắt đầu khi có ít nhất hai người.')
  room.started=true;room.roundAt=now
 }else if(action==='room-action'){
  if(!room.started||room.finished||me.ready||me.board.hp<=0)throw new Error('Đội hình đã chốt hoặc vòng chưa mở.')
  // At most two distinct, server-graded answers per round, independent of difficulty.
  const learned=await env.DB.prepare(`SELECT a.content_group FROM game_v2_attempt a JOIN game_v2_session s ON s.id=a.session WHERE a.sbd=? AND a.created_at>=? AND json_extract(a.json,'$.attempt.correct')=1 AND json_extract(a.json,'$.attempt.assisted')=0 AND json_extract(s.json,'$.mode')='arena' GROUP BY a.content_group ORDER BY a.created_at LIMIT 2`).bind(sbd,new Date(room.roundAt).toISOString()).all<{content_group:string}>()
  for(const q of learned.results)if(!me.credit.includes(q.content_group)&&me.credit.length<2){me.board.gold+=2;me.credit.push(q.content_group)}
  const command=b.action as ArenaAction
  if(command.type==='fight'){
   if(room.round>1){const attempted=await env.DB.prepare(`SELECT a.id FROM game_v2_attempt a JOIN game_v2_session s ON s.id=a.session WHERE a.sbd=? AND a.created_at>=? AND json_extract(s.json,'$.mode')='arena' LIMIT 1`).bind(sbd,new Date(room.roundAt).toISOString()).first();if(!attempted)throw new Error('Em làm một câu Hoá của vòng này trước khi chốt đội.')}

   if(!me.board.units.some(u=>u.pos!==null))throw new Error('Em đặt quân lên bàn trước khi chốt.')
   me.ready=true
   const alive=room.members.filter(m=>m.board.hp>0)
   if(alive.every(m=>m.ready)){
    resolveRound(room,now)
   }
  }else me.board=arenaAction(me.board,command)
 }else if(action==='room-leave'){
  if(room.started){me.board.hp=0;me.ready=true;me.board.finished=true;room.finished=room.members.filter(m=>m.board.hp>0).length<=1;if(!room.finished)resolveRound(room,now)}else{room.members=room.members.filter(m=>m.sbd!==sbd);if(room.owner===sbd)room.owner=room.members[0]?.sbd??''}
 }
 const changed=await env.DB.prepare('UPDATE game_v2_room SET json=?,revision=revision+1 WHERE id=? AND revision=?').bind(JSON.stringify(room),id,row.revision).run()
 if(!changed.meta.changes)throw new Error('Bạn vừa cập nhật phòng. Em tải lại rồi thử tiếp.')
 return view(room,sbd,id,row.revision+1)
}
