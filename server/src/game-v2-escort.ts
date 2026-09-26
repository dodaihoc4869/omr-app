import type {Env} from './kieu'
import {PETS} from '../../src/game/than-thu-v2/core'
import {newEscort,newSoloEscort,escortCapacity,prepareBoss,player,checkCommand,resolveEscort,type Escort,type Command} from '../../src/game/than-thu-v2/escort-core'
export async function escortContext(env:Env,id:string,sbd:string){const row=await env.DB.prepare('SELECT json,revision FROM game_v2_room WHERE id=?').bind(id).first<{json:string;revision:number}>();if(!row)throw new Error('Không tìm thấy phòng Linh Tâm.');const r=JSON.parse(row.json) as Escort;if(r.kind!=='escort'||Date.now()-r.created>6*3600000)throw new Error('Phòng Linh Tâm đã hết hạn.');if(!r.players.some(p=>p.id===sbd&&!p.left))throw new Error('Em chưa ở trong phòng này.');await hydrateNames(env,r);return {r,revision:row.revision}}
async function view(env:Env,r:Escort,id:string,sbd:string,revision:number){await hydrateNames(env,r);return {ok:true,escort:{...r,id,revision,owner:r.owner===sbd,players:r.players.map((p,i)=>({...p,id:`p${i}`,self:p.id===sbd,credit:undefined,command:undefined,ready:!!p.command,alias:p.id==='boss'?'Boss · '+PETS[p.pet]!.name:p.nickname||PETS[p.pet]!.name})),crystal:{...r.crystal,carrier:r.crystal.carrier?`p${r.players.findIndex(p=>p.id===r.crystal.carrier)}`:null}}}}
export async function escortAction(env:Env,sbd:string,pet:string,level:number,action:string,b:Record<string,unknown>){
 const now=Date.now();if(action==='escort-create'){
 const id='LT'+[...crypto.getRandomValues(new Uint8Array(4))].map(n=>n.toString(16).padStart(2,'0')).join('').toUpperCase(),r=(b.mode==='solo'?newSoloEscort:newEscort)(sbd,Math.max(0,PETS.findIndex(p=>p.id===pet)),level,now)
 if(b.mode==='duel')r.mode='duel'
 await env.DB.prepare('INSERT INTO game_v2_room(id,json,created_at) VALUES(?,?,?)').bind(id,JSON.stringify(r),new Date(now).toISOString()).run();return view(env,r,id,sbd,0)}
 const id=String(b.room??'').trim().toUpperCase();let r:Escort,revision:number
 if(action==='escort-join'){
  const row=await env.DB.prepare('SELECT json,revision FROM game_v2_room WHERE id=?').bind(id).first<{json:string;revision:number}>();if(!row)throw new Error('Mã phòng chưa đúng.');r=JSON.parse(row.json);revision=row.revision
  if(r.kind!=='escort'||now-r.created>6*3600000)throw new Error('Phòng không còn mở.')
  if(r.mode==='solo'&&r.owner!==sbd)throw new Error('Đây là trận luyện riêng với Boss.');
  if(!r.players.some(p=>p.id===sbd)){if(r.started||r.players.length>=escortCapacity(r))throw new Error(r.mode==='duel'?'Phòng đã bắt đầu hoặc đủ hai bạn.':'Phòng đã bắt đầu hoặc đủ bốn bạn.');r.players.push(player(sbd,Math.max(0,PETS.findIndex(p=>p.id===pet)),level,r.players.length))}
 }else{const found=await escortContext(env,id,sbd);r=found.r;revision=found.revision}
 const me=r.players.find(p=>p.id===sbd)!
 if(action==='escort-view'){
  if(r.started&&!r.finished&&now>=Math.min(r.roundAt+60000,r.deadline)){
   resolveRound(r,now);const update=await env.DB.prepare('UPDATE game_v2_room SET json=?,revision=revision+1 WHERE id=? AND revision=?').bind(JSON.stringify(r),id,revision).run()
   if(update.meta.changes)return view(env,r,id,sbd,revision+1)
   const latest=await escortContext(env,id,sbd);return view(env,latest.r,id,sbd,latest.revision)
  }
  return view(env,r,id,sbd,revision)
 }
 r.effects=[]
 if(action!=='escort-join'&&Number(b.revision)!==revision)throw new Error('Bạn vừa thao tác. Em tải lại bản đồ rồi thử tiếp.')
 if(action==='escort-start'){if(r.owner!==sbd||r.started||r.players.length!==escortCapacity(r))throw new Error(`Cần đủ ${escortCapacity(r)} bạn, chủ phòng mới bắt đầu được.`);r.started=true;r.roundAt=now;r.deadline=now+8*60000}
 else if(action==='escort-act'){
  if(!r.started||r.finished||me.command)throw new Error('Lượt chưa mở hoặc em đã chốt hành động.')
  if(now>=r.deadline)resolveRound(r,now)
  else{
   const answers=await env.DB.prepare(`SELECT a.id,a.json FROM game_v2_attempt a JOIN game_v2_session s ON s.id=a.session WHERE a.sbd=? AND a.created_at>=? AND json_extract(s.json,'$.guardian')=? AND json_extract(s.json,'$.guardianRound')=? ORDER BY a.created_at LIMIT 20`).bind(sbd,new Date(r.roundAt).toISOString(),id,r.round).all<{id:string;json:string}>()
   const fresh=answers.results.filter(a=>!me.credit.includes(a.id));if(!fresh.length)throw new Error('Em làm một câu Hoá của lượt này trước khi hành động.')
   me.correct=fresh.some(a=>{const v=JSON.parse(a.json).attempt;return v.correct&&!v.assisted});me.energy=me.correct?2:0
   checkCommand(r,me,b.command as Command);me.command=b.command as Command;me.credit.push(...fresh.map(a=>a.id))
   prepareBoss(r)
   if(r.players.every(p=>p.left||p.command))resolveRound(r,now)
  }
 }else if(action==='escort-advance'){
  if(!r.started||r.finished||now<Math.min(r.roundAt+60000,r.deadline))throw new Error('Lượt vẫn còn thời gian.');resolveRound(r,now)
 }else if(action==='escort-leave'){
  if(r.finished)return view(env,r,id,sbd,revision)
  if(!r.started){r.players=r.players.filter(p=>p.id!==sbd).map((p,i)=>({...p,team:i%2,x:i%2?6:0,y:i<2?1:3}));if(r.owner===sbd)r.owner=r.players[0]?.id??''}
  else{me.left=true;if(r.crystal.carrier===me.id)r.crystal={x:me.x,y:me.y,carrier:null};const active=[0,1].map(t=>r.players.some(p=>p.team===t&&!p.left));if(!active[0]||!active[1]){r.finished=true;r.winner=active[0]?0:active[1]?1:null}else if(r.players.every(p=>p.left||p.command))resolveRound(r,now)}
 }else if(!['escort-start','escort-join'].includes(action))throw new Error('Thao tác chưa hỗ trợ.')
 const changed=await env.DB.prepare('UPDATE game_v2_room SET json=?,revision=revision+1 WHERE id=? AND revision=?').bind(JSON.stringify(r),id,revision).run();if(!changed.meta.changes)throw new Error('Phòng vừa thay đổi. Em tải lại bản đồ.');return view(env,r,id,sbd,revision+1)
}

function resolveRound(r:Escort,now:number){prepareBoss(r);resolveEscort(r,now)}

async function hydrateNames(env:Env,r:Escort){
 const ids=r.players.filter(p=>p.id!=='boss').map(p=>p.id);if(!ids.length)return
 const rows=await env.DB.prepare(`SELECT sbd,json_extract(json,'$.nickname') nickname FROM game_v2_profile WHERE sbd IN (${ids.map(()=>'?').join(',')})`).bind(...ids).all<{sbd:string;nickname:string|null}>()
 for(const p of r.players)p.nickname=rows.results.find(x=>x.sbd===p.id)?.nickname||undefined
}
