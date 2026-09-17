import {useEffect,useState} from 'react'
import {PETS} from './core'
import type {Arena,ArenaAction,Unit} from './core'
import SpiritArt from './SpiritArt'
interface RoomState {id:string;revision:number;round:number;started:boolean;finished:boolean;owner:boolean;members:{alias:string;self:boolean;ready:boolean;hp:number;units:Unit[]}[];board:Arena}
export default function Room({call,onLearn,storageKey,level}:{level:number;storageKey:string;call:(action:string,data:Record<string,unknown>)=>Promise<unknown>;onLearn:()=>void}){
 const [room,setRoom]=useState<RoomState|null>(null);const [code,setCode]=useState('');const [busy,setBusy]=useState(false);const [error,setError]=useState('');const [unit,setUnit]=useState<string|null>(null)
 useEffect(()=>{const id=sessionStorage.getItem(`game-room:${storageKey}`);if(id)void call('room-view',{room:id}).then(r=>setRoom((r as {room:RoomState}).room)).catch(()=>sessionStorage.removeItem(`game-room:${storageKey}`))},[call,storageKey])
 useEffect(()=>{if(room)sessionStorage.setItem(`game-room:${storageKey}`,room.id)},[room,storageKey])
 const go=async(action:string,data:Record<string,unknown>={})=>{if(busy)return;setBusy(true);setError('');try{const r=await call(action,{room:room?.id||code,revision:room?.revision,...data}) as {room:RoomState};setRoom(r.room);setUnit(null)}catch(e){setError(e instanceof Error?e.message:'Không nối được phòng.')}finally{setBusy(false)}}
 useEffect(()=>{if(!room||room.finished)return;let active=true;const t=setInterval(()=>{if(document.hidden||busy)return;void call('room-view',{room:room.id}).then(r=>{if(active)setRoom((r as {room:RoomState}).room)}).catch(()=>{/* Keep board, allow explicit retry. */})},7000);return()=>{active=false;clearInterval(t)}},[room?.id,room?.finished,busy,call])
 const action=(a:ArenaAction)=>go('room-action',{action:a});const me=room?.members.find(m=>m.self);const locked=busy||!room?.started||room.finished||me?.ready||me?.hp===0
 return <div className="spirit-panel"><h2>Phòng bạn bè · tối đa 6 người</h2>{error&&<p role="alert" className="spirit-error">{error}</p>}{!room?<><p>Chủ phòng gửi mã cho bạn. Mỗi bạn tự đăng nhập và nhập mã để tham gia.</p><div className="spirit-row"><button disabled={busy} onClick={()=>void go('room-create')}>Tạo phòng</button><input aria-label="Mã phòng" value={code} onChange={e=>setCode(e.target.value.toUpperCase())} placeholder="Mã phòng"/><button disabled={busy||!code} onClick={()=>void go('room-join')}>Vào phòng</button></div></>:<>
 <header className="spirit-row"><strong>Mã phòng: {room.id} · Vòng {Math.min(10,room.round)}</strong><button disabled={busy} onClick={()=>void go('room-view')}>Tải lại bàn cờ</button></header>
 <div className="spirit-stats">{room.members.map(m=><span key={m.alias}>{m.alias}{m.self?' (em)':''}: {m.hp} máu {m.ready?'· Đã chốt':''}</span>)}</div>
 {!room.started?<><p>Chủ phòng bắt đầu khi có từ 2 đến 6 bạn. Mỗi người có cùng cơ hội mua quân.</p>{room.owner&&<button disabled={busy||room.members.length<2} onClick={()=>void go('room-start')}>Bắt đầu</button>}</>:<>
 {room.finished?<h3>Ván đã kết thúc. Thứ hạng võ đài chỉ tính chiến thuật, không xếp hạng học Hoá.</h3>:<p>{me?.ready?'Đội hình đã chốt. Đang chờ các bạn.':`${room.board.gold} vàng · cấp đội ${room.board.level} · chạm quân rồi chạm ô để đổi vị trí.`}</p>}
 <div className="spirit-board">{Array.from({length:8},(_,pos)=>{const u=room.board.units.find(x=>x.pos===pos);return <button key={pos} disabled={!!locked} className={unit===u?.id?'selected':''} onClick={()=>{if(unit)void action({type:'place',id:unit,pos});else if(u)setUnit(u.id)}}>{u?<><SpiritArt index={u.pet} level={level}/>{PETS[u.pet]?.name} {'★'.repeat(u.star)}</>:pos<4?'Tiền tuyến':'Hậu tuyến'}</button>})}</div>
 <div className="spirit-bench">{room.board.units.filter(u=>u.pos===null).map(u=><button key={u.id} disabled={!!locked} onClick={()=>setUnit(u.id)} className={unit===u.id?'selected':''}><SpiritArt index={u.pet} level={level}/>{PETS[u.pet]?.name} {'★'.repeat(u.star)}</button>)}</div>
 {unit&&<div className="spirit-row"><button disabled={!!locked} onClick={()=>void action({type:'place',id:unit,pos:null})}>Về dự bị</button><button disabled={!!locked} onClick={()=>void action({type:'sell',id:unit})}>Bán quân</button></div>}
 <div className="spirit-row"><button disabled={!!locked} onClick={()=>void action({type:'fight'})}>Chốt đội hình</button><button disabled={!!locked} onClick={onLearn}>Luyện Hoá tiếp sức đội</button><button disabled={!!locked||room.board.gold<4} onClick={()=>void action({type:'xp'})}>Nâng cấp · 4 vàng</button><button disabled={!!locked||room.board.gold<2} onClick={()=>void action({type:'refresh'})}>Đổi cửa hàng · 2 vàng</button></div>
 <div className="spirit-shop">{room.board.shop.map((pet,slot)=><button key={slot} disabled={!!locked||pet===null||room.board.gold<2} onClick={()=>void action({type:'buy',slot})}>{pet===null?'Đã mua':<><SpiritArt index={pet} level={level}/>{PETS[pet]?.name}<small>2 vàng</small></>}</button>)}</div>
 <p className="spirit-note">Hai câu tự làm đúng khác nhau trong vòng được thêm tối đa 4 vàng khi em thao tác bàn cờ. Mỗi vòng đều có vàng nền. Bốn hệ khác nhau tăng sức đội 20%.</p>
 <ol className="spirit-log">{room.board.log.map(x=><li key={x}>{x}</li>)}</ol>
 </>}
 <button disabled={busy} onClick={()=>void go('room-leave').then(()=>{sessionStorage.removeItem(`game-room:${storageKey}`);setRoom(null)})}>Rời phòng</button>
 </>}</div>
}
