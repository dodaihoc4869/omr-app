import type {Env} from './kieu'
import {hash} from './game-v2-bank'
const enc=new TextEncoder()
async function signature(env:Env,payload:string){const k=await crypto.subtle.importKey('raw',enc.encode(env.MA_BI_MAT),{name:'HMAC',hash:'SHA-256'},false,['sign']);const s=await crypto.subtle.sign('HMAC',k,enc.encode(payload));return [...new Uint8Array(s)].map(x=>x.toString(16).padStart(2,'0')).join('')}
export async function gameToken(env:Env,sbd:string):Promise<string>{const row=await env.DB.prepare('SELECT mat_khau FROM hoc_sinh WHERE sbd=?').bind(sbd).first<{mat_khau:string}>();if(!row?.mat_khau)return '';const payload=btoa(JSON.stringify({sbd,exp:Date.now()+30*86400000,pwd:await hash(row.mat_khau)}));return `${payload}.${await signature(env,payload)}`}
export async function gameIdentity(env:Env,b:Record<string,unknown>):Promise<string>{
  const token=String(b.token??'');const [payload,sig]=token.split('.');if(!payload||!sig)throw new Error('Em nhập lại mật khẩu để mở hồ sơ game trên máy này.')
  const expected=await signature(env,payload);let diff=expected.length^sig.length;for(let i=0;i<expected.length;i++)diff|=expected.charCodeAt(i)^(sig.charCodeAt(i)||0);if(diff)throw new Error('Phiên game không hợp lệ.')
  let o:{sbd:string;exp:number;pwd:string};try{o=JSON.parse(atob(payload))}catch{throw new Error('Phiên game không hợp lệ.')}
  if((o as {purpose?:unknown}).purpose)throw new Error('Phiên game không hợp lệ.') // mã phụ huynh (có `purpose`) KHÔNG bao giờ là phiên học sinh
  if(!o.sbd||o.exp<Date.now())throw new Error('Phiên game đã hết hạn. Em đăng nhập lại.')
  const row=await env.DB.prepare('SELECT mat_khau FROM hoc_sinh WHERE sbd=?').bind(o.sbd).first<{mat_khau:string}>();if(!row?.mat_khau||await hash(row.mat_khau)!==o.pwd)throw new Error('Mật khẩu đã đổi. Em đăng nhập lại.')
  return o.sbd
}
/**
 * MÃ PHỤ HUYNH (dùng cho `/game-v2-parent`, `/parent-news/*`, `/mom/create|parent-list`, `/ph/*`). HMAC-SHA256, 30 ngày, `purpose:'game-parent'`.
 * RÀNG BUỘC MẬT KHẨU EM: nếu em có mật khẩu thì token mang `pk` = băm mật khẩu lúc cấp — em/thầy đổi mật khẩu là mọi liên kết đã phát THU HỒI ngay (như `gameToken`).
 * Token cũ (cấp trước 21/09, không có `pk`) vẫn dùng được tới khi hết hạn 30 ngày; không thu hồi được.
 */
export async function parentPass(env:Env,sbd:string):Promise<string>{
  const row=await env.DB.prepare('SELECT mat_khau FROM hoc_sinh WHERE sbd=?').bind(sbd).first<{mat_khau:string|null}>().catch(()=>null)
  const o:Record<string,unknown>={sbd,exp:Date.now()+30*86400000,purpose:'game-parent'}
  if(row?.mat_khau)o.pk=await hash(row.mat_khau) // KHÔNG đặt tên `pwd`: `gameIdentity` kiểm `pwd` — token PH mà đọc được như token học sinh là PH thành em
  const payload=btoa(JSON.stringify(o));return `${payload}.${await signature(env,payload)}`
}
const soSanhHang=(a:string,b:string)=>{let d=a.length^b.length;for(let i=0;i<a.length;i++)d|=a.charCodeAt(i)^(b.charCodeAt(i)||0);return d===0}
export async function parentIdentity(env:Env,token:string):Promise<string>{
  const [payload,sig]=String(token??'').split('.');if(!payload||!sig||!soSanhHang(await signature(env,payload),sig))throw new Error('Mã xem tiến bộ không hợp lệ.')
  let o:{sbd?:unknown;exp?:unknown;purpose?:unknown;pk?:unknown};try{o=JSON.parse(atob(payload))}catch{throw new Error('Mã xem tiến bộ không hợp lệ.')}
  if(o.purpose!=='game-parent'||!(Number(o.exp)>=Date.now()))throw new Error('Mã xem tiến bộ đã hết hạn.')
  const sbd=String(o.sbd??'');if(!sbd)throw new Error('Mã xem tiến bộ không hợp lệ.')
  if(typeof o.pk==='string'){
    const row=await env.DB.prepare('SELECT mat_khau FROM hoc_sinh WHERE sbd=?').bind(sbd).first<{mat_khau:string|null}>()
    if(!row?.mat_khau||await hash(row.mat_khau)!==o.pk)throw new Error('Mật khẩu của con đã đổi nên liên kết này hết hiệu lực. Anh/chị nhờ Thầy gửi lại liên kết mới.')
  }
  return sbd
}
