export type Command={type:'move'|'blast'|'guard'|'skill';target?:number;x?:number;y?:number}
export interface EscortPlayer {nickname?:string;id:string;pet:number;level:number;team:number;x:number;y:number;hp:number;shield:number;left:boolean;command?:Command;energy:number;credit:string[];correct:boolean}
export interface Escort {kind:'escort';mode?:'solo'|'pvp'|'duel';owner:string;created:number;started:boolean;finished:boolean;round:number;roundAt:number;deadline:number;players:EscortPlayer[];score:number[];crystal:{x:number;y:number;carrier:string|null};walls:{x:number;y:number;until:number}[];log:string[];effects:{from:number;to:number;kind:string}[];winner:number|null}
export const SKILLS=['Tường Địa Tinh','Dòng Nước Tiếp Sức','Liệt Diễm Đẩy Lùi','Phong Bộ Vượt Cầu','Tinh Quang Liên Kết','Ái Tâm Hồi Phục','Vườn Ân Lộc','Minh Quang Soi Đường']
export const distance=(a:{x:number;y:number},b:{x:number;y:number})=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y)
export function newEscort(owner:string,pet:number,level:number,now:number):Escort{return {kind:'escort',owner,created:now,started:false,finished:false,round:1,roundAt:now,deadline:0,players:[player(owner,pet,level,0)],score:[0,0],crystal:{x:3,y:2,carrier:null},walls:[],log:[],effects:[],winner:null}}
export function player(id:string,pet:number,level:number,index:number):EscortPlayer{const team=index%2;return{id,pet,level,team,x:team?6:0,y:index<2?1:3,hp:100,shield:0,left:false,energy:0,credit:[],correct:false}}
export function canStand(r:Escort,x:number,y:number,ignore?:string){return Number.isInteger(x)&&Number.isInteger(y)&&x>=0&&x<7&&y>=0&&y<5&&!r.walls.some(w=>w.x===x&&w.y===y)&&!r.players.some(p=>!p.left&&p.id!==ignore&&p.x===x&&p.y===y)}
export function checkCommand(r:Escort,p:EscortPlayer,c:Command){
 if(!c||!['move','blast','guard','skill'].includes(c.type))throw new Error('Chọn một hành động trên bản đồ.')
 if(c.type!=='guard'&&!p.correct&&!(r.mode==='solo'&&p.id==='boss'))throw new Error('Em cần trả lời đúng và tự làm để di chuyển hoặc dùng chiêu.')
 if(c.type==='move'){if(distance(p,{x:c.x!,y:c.y!})!==1||!canStand(r,c.x!,c.y!,p.id))throw new Error('Em chỉ đi được một ô trống liền kề.')}
 if(c.type==='blast'){
  const t=r.players[c.target??-1];if(p.energy<2||!t||t.left||t.team===p.team||distance(p,t)>3)throw new Error('Chưởng cần 2 năng lượng và đối thủ trong 3 ô.')
 }
 if(c.type==='skill'){
  if(p.energy<2)throw new Error('Trả lời đúng để nhận 2 năng lượng dùng kỹ năng.')
  if([0,1,3,6].includes(p.pet)){
   const d=distance(p,{x:c.x!,y:c.y!});const reach=p.pet===3&&r.crystal.carrier!==p.id?2:1
   if(d<1||d>reach||!canStand(r,c.x!,c.y!,p.id))throw new Error(`Chọn ô trống trong ${reach} ô.`)
   if(p.pet===0&&(c.x===0||c.x===6||c.x===r.crystal.x&&c.y===r.crystal.y))throw new Error('Không dựng tường lên căn cứ hoặc tinh thể.')
  }else if(p.pet===2){const t=r.players[c.target??-1];if(!t||t.left||t.team===p.team||distance(p,t)>3)throw new Error('Chọn đối thủ trong 3 ô.')}
 }
}
export function resolveEscort(r:Escort,now:number){
 r.effects=[];r.walls=r.walls.filter(w=>w.until>r.round)
 const names=['Thạch Quy','Thuỷ Long','Viêm Sư','Phong Thố','Tinh Lang','Ái Hồ','Ân Lộc','Minh Linh']
 const name=(p:EscortPlayer)=>p.nickname||names[p.pet]
 const log=(s:string)=>r.log.unshift(`Lượt ${r.round}: ${s}`)
 const hit=(a:EscortPlayer,b:EscortPlayer,n:number,push=false)=>{const absorbed=Math.min(b.shield,n);b.shield-=absorbed;b.hp-=n-absorbed;r.effects.push({from:r.players.indexOf(a),to:r.players.indexOf(b),kind:'blast'});log(`${name(a)} tung chưởng · ${n-absorbed} sát thương.`);if(push){const x=b.x+Math.sign(b.x-a.x),y=b.y+(b.x===a.x?Math.sign(b.y-a.y):0);if(canStand(r,x,y,b.id)){b.x=x;b.y=y}}}
 // Rotate initiative for fair conflict resolution; every submitted action is validated again against the evolving board.
 const order=r.players.map((_,i)=>(i+r.round-1)%r.players.length)
 for(const i of order){const p=r.players[i]!,c=p.command??{type:'guard'};if(p.left)continue
  if(p.hp<=0||!p.command)continue
  try{checkCommand(r,p,c)}catch{p.shield=Math.min(40,p.shield+10);log(`${name(p)} giữ vị trí vì ô hoặc mục tiêu đã đổi.`);continue}
  if(c.type!=='guard'&&!p.correct&&!(r.mode==='solo'&&p.id==='boss'))throw new Error('Em cần trả lời đúng và tự làm để di chuyển hoặc dùng chiêu.')
 if(c.type==='move'){p.x=c.x!;p.y=c.y!;r.effects.push({from:i,to:i,kind:'move'})}
  if(c.type==='guard')p.shield=Math.min(40,p.shield+(p.correct?20:5))
  if(c.type==='blast')hit(p,r.players[c.target!]!,25)
  if(c.type==='skill'){
   const allies=r.players.filter(q=>q.team===p.team&&!q.left)
   if(p.pet===0)r.walls.push({x:c.x!,y:c.y!,until:r.round+2})
   if(p.pet===1){p.x=c.x!;p.y=c.y!;for(const q of allies)q.shield=Math.min(40,q.shield+10)}
   if(p.pet===2)hit(p,r.players[c.target!]!,30,true)
   if(p.pet===3){p.x=c.x!;p.y=c.y!}
   if(p.pet===4)for(const q of allies)q.shield=Math.min(40,q.shield+25)
   if(p.pet===5)for(const q of allies)q.hp=Math.min(100,q.hp+25)
   if(p.pet===6){p.x=c.x!;p.y=c.y!;for(const q of allies)if(distance(p,q)<=2)q.hp=Math.min(100,q.hp+20)}
   if(p.pet===7){for(const q of r.players.filter(q=>q.team!==p.team&&!q.left&&distance(p,q)<=3))hit(p,q,15);for(const q of allies)q.shield=Math.min(40,q.shield+10)}
   r.effects.push({from:i,to:i,kind:'skill'});log(`${name(p)} · ${SKILLS[p.pet]}.`)
  }
 }
 for(let team=0;team<2;team++){const pair=r.players.filter(p=>p.team===team&&!p.left&&p.hp>0);if(pair.length===2&&pair.every(p=>p.correct)){for(const p of pair)p.shield=Math.min(40,p.shield+10);const enemy=r.players.find(q=>q.team!==team&&!q.left&&q.hp>0&&pair.every(p=>distance(p,q)<=3));if(enemy)for(const p of pair)hit(p,enemy,10);log(`Đội ${team+1} liên kích đồng tâm: +10 giáp${enemy?' · hai luồng chưởng hợp lực!':'!'}`)}}
 for(const p of r.players){if(p.left)continue
  if(p.hp<=0){if(r.crystal.carrier===p.id){r.crystal={x:p.x,y:p.y,carrier:null}}p.hp=100;p.shield=0;const home=p.team?6:0;p.x=home;p.y=[1,3,0,4,2].find(y=>canStand(r,home,y,p.id))??2;log(`${name(p)} hồi sinh tại căn cứ.`)}
  if((p.x===2&&p.y===0)||(p.x===4&&p.y===4))p.hp=Math.min(100,p.hp+10)
 }
 if(r.crystal.carrier){const carrier=r.players.find(p=>p.id===r.crystal.carrier)!;r.crystal.x=carrier.x;r.crystal.y=carrier.y;if((carrier.correct||r.mode==='solo'&&carrier.id==='boss')&&carrier.command&&carrier.x===(carrier.team?6:0)){r.score[carrier.team]!++;r.crystal={x:3,y:2,carrier:null};log(`Đội ${carrier.team+1} đưa Linh Tâm về căn cứ!`)}}
 else{const p=r.players.find(p=>!p.left&&(p.correct||r.mode==='solo'&&p.id==='boss')&&p.command&&p.x===r.crystal.x&&p.y===r.crystal.y);if(p){r.crystal.carrier=p.id;log(`${name(p)} đã nhặt Linh Tâm!`)}}
 r.finished=r.score.some(s=>s>=2)||r.round>=12||now>=r.deadline
 if(r.finished)r.winner=r.score[0]===r.score[1]?null:r.score[0]!>r.score[1]!?0:1
 else{r.round++;r.roundAt=now;for(const p of r.players){delete p.command;p.energy=0;p.correct=false}}
 r.log=r.log.slice(0,14)
}

/** Server-controlled opponent. It never creates answers, EXP or learner history. */
export function newSoloEscort(owner:string,pet:number,level:number,now:number):Escort{
 const r=newEscort(owner,pet,level,now);r.mode='solo';r.players.push(player('boss',2,level,1));r.started=true;r.deadline=now+8*60000;return r
}
export function prepareBoss(r:Escort){
 if(r.mode!=='solo'||r.finished)return
 const boss=r.players.find(p=>p.id==='boss');if(!boss||boss.left||boss.command)return
 boss.energy=2
 const enemy=r.players.find(p=>p.team!==boss.team&&!p.left)
 if(enemy&&r.crystal.carrier===enemy.id&&distance(boss,enemy)<=3){boss.command={type:'blast',target:r.players.indexOf(enemy)};return}
 const goal=r.crystal.carrier===boss.id?{x:6,y:boss.y}:r.crystal
 // Breadth-first path avoids walls and occupied cells, including the other player.
 const queue=[{x:boss.x,y:boss.y,first:undefined as {x:number;y:number}|undefined}],seen=new Set([`${boss.x},${boss.y}`])
 let best=queue[0]!
 while(queue.length){const cell=queue.shift()!;if(distance(cell,goal)<distance(best,goal))best=cell;if(distance(cell,goal)===0){best=cell;break}
  for(const [dx,dy] of [[-1,0],[0,-1],[1,0],[0,1]]){const next={x:cell.x+dx!,y:cell.y+dy!};const key=`${next.x},${next.y}`;if(seen.has(key)||!canStand(r,next.x,next.y,boss.id))continue;seen.add(key);queue.push({...next,first:cell.first??next})}
 }
 boss.command=best.first?{type:'move',...best.first}:enemy&&distance(boss,enemy)<=3?{type:'blast',target:r.players.indexOf(enemy)}:{type:'guard'}
}

export const escortCapacity=(r:Pick<Escort,'mode'>)=>r.mode==='duel'||r.mode==='solo'?2:4
