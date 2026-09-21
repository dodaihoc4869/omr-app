import {layDiaChiMayChu} from '../../lib/dia-chi-may-chu'
const cursors=new Map<string,number>()
const inflight=new Map<string,Promise<boolean>>()
/** Trả `true` khi máy chủ nhận, `false` khi lỗi/hết giờ (vòng nền lùi dần theo đó); đang có lệnh cùng em bay ⇒ dùng lại lệnh ấy. */
export function syncStudentExp(sbd:string,token:string):Promise<boolean>{
 if(!token)return Promise.resolve(true)
 const running=inflight.get(sbd);if(running)return running
 const work=(async()=>{
  const base=await layDiaChiMayChu('');let mom:unknown[]=[]
  try{const data=JSON.parse(localStorage.getItem(`omr_mom_btvn_${sbd}`)||'[]');mom=data.filter((m:{trangThai:string})=>m.trangThai==='da_nop').map((m:{id:string;nopLuc:string;dapAnDaNop?:unknown})=>({id:m.id,at:m.nopLuc,answers:m.dapAnDaNop}))}catch{/* Local storage is optional. */}
  const cursor=cursors.get(sbd)??0;const batch=mom.slice(cursor,cursor+8);cursors.set(sbd,cursor+8>=mom.length?0:cursor+8);mom=batch
  const response=await fetch(`${base}/game-v2/academic-sync`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({token,mom})})
  const result=await response.json();if(result.ok){window.dispatchEvent(new CustomEvent('spirit-academic-synced',{detail:{sbd,...result}}));return true}return false
 })().catch(()=>false/* Submission remains successful; next visible poll retries EXP only. */).finally(()=>inflight.delete(sbd))
 inflight.set(sbd,work);return work
}
