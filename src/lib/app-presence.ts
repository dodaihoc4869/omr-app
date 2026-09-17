import {layDiaChiMayChu} from './dia-chi-may-chu'
// Anonymous browser session only: never send a name, SBD, device fingerprint or IP field.
export function startAppPresence(){
 const role=/^\/(ph|phu-huynh)(\/|$)/.test(location.pathname)?'ph':/^\/hs(\/|$)/.test(location.pathname)?'hs':'gv'
 let session='';try{session=sessionStorage.getItem('omr_presence_session')||'';if(!session){session=`${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;sessionStorage.setItem('omr_presence_session',session)}}catch{return()=>{}}
 let busy=false,stopped=false
 const ping=async()=>{if(document.hidden||busy||stopped)return;busy=true;const c=new AbortController(),t=setTimeout(()=>c.abort(),10000);try{const url=await layDiaChiMayChu();if(url&&!stopped)await fetch(`${url}/presence`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({session,role}),signal:c.signal})}catch{/* Presence never blocks learning. */}finally{clearTimeout(t);busy=false}}
 void ping();const interval=setInterval(()=>void ping(),30000);const focus=()=>void ping();window.addEventListener('focus',focus);document.addEventListener('visibilitychange',focus)
 return()=>{stopped=true;clearInterval(interval);window.removeEventListener('focus',focus);document.removeEventListener('visibilitychange',focus)}
}
