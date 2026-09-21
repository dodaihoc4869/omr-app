import {layDiaChiMayChu} from './dia-chi-may-chu'
import {batNhipBenVung} from './nhip-ben-vung'
// Anonymous browser session only: never send a name, SBD, device fingerprint or IP field.
export function startAppPresence(){
 const role=/^\/(ph|phu-huynh)(\/|$)/.test(location.pathname)?'ph':/^\/hs(\/|$)/.test(location.pathname)?'hs':'gv'
 let session='';try{session=sessionStorage.getItem('omr_presence_session')||'';if(!session){session=`${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;sessionStorage.setItem('omr_presence_session',session)}}catch{return()=>{}}
 let busy=false,stopped=false
 const ping=async():Promise<boolean>=>{if(document.hidden||busy||stopped)return true;busy=true;const c=new AbortController(),t=setTimeout(()=>c.abort(),10000);try{const url=await layDiaChiMayChu();if(url&&!stopped)await fetch(`${url}/presence`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({session,role}),signal:c.signal});return true}catch{/* Presence never blocks learning. */return false}finally{clearTimeout(t);busy=false}}
 // Sự cố D1 21/09: 30 giây × mọi máy. Máy chủ tính "đang online" trong 90 giây (teacher-news.ts) nên KHÔNG chậm hơn 60 s ± 10 s được (chờ Code 3 nới cửa sổ rồi mới tăng); vẫn không gọi chồng, lỗi ⇒ lùi 30→60→120 s, quay lại tab dội ≥ 20 s.
 const nhip=batNhipBenVung(ping,{coSoMs:60_000,lechMs:10_000,heSoToiDa:1});const focus=()=>nhip.kich();window.addEventListener('focus',focus);document.addEventListener('visibilitychange',focus)
 return()=>{stopped=true;nhip.dung();window.removeEventListener('focus',focus);document.removeEventListener('visibilitychange',focus)}
}
