import type {Env} from './kieu'
import {hash} from './game-v2-bank'
const enc=new TextEncoder()
async function signature(env:Env,payload:string){const k=await crypto.subtle.importKey('raw',enc.encode(env.MA_BI_MAT),{name:'HMAC',hash:'SHA-256'},false,['sign']);const s=await crypto.subtle.sign('HMAC',k,enc.encode(payload));return [...new Uint8Array(s)].map(x=>x.toString(16).padStart(2,'0')).join('')}
export async function gameToken(env:Env,sbd:string):Promise<string>{const row=await env.DB.prepare('SELECT mat_khau FROM hoc_sinh WHERE sbd=?').bind(sbd).first<{mat_khau:string}>();if(!row?.mat_khau)return '';const payload=btoa(JSON.stringify({sbd,exp:Date.now()+30*86400000,pwd:await hash(row.mat_khau)}));return `${payload}.${await signature(env,payload)}`}
export async function gameIdentity(env:Env,b:Record<string,unknown>):Promise<string>{
  const token=String(b.token??'');const [payload,sig]=token.split('.');if(!payload||!sig)throw new Error('Em nhập lại mật khẩu để mở hồ sơ game trên máy này.')
  const expected=await signature(env,payload);let diff=expected.length^sig.length;for(let i=0;i<expected.length;i++)diff|=expected.charCodeAt(i)^(sig.charCodeAt(i)||0);if(diff)throw new Error('Phiên game không hợp lệ.')
  let o:{sbd:string;exp:number;pwd:string};try{o=JSON.parse(atob(payload))}catch{throw new Error('Phiên game không hợp lệ.')}
  if(!o.sbd||o.exp<Date.now())throw new Error('Phiên game đã hết hạn. Em đăng nhập lại.')
  const row=await env.DB.prepare('SELECT mat_khau FROM hoc_sinh WHERE sbd=?').bind(o.sbd).first<{mat_khau:string}>();if(!row?.mat_khau||await hash(row.mat_khau)!==o.pwd)throw new Error('Mật khẩu đã đổi. Em đăng nhập lại.')
  return o.sbd
}
export async function parentPass(env:Env,sbd:string):Promise<string>{const payload=btoa(JSON.stringify({sbd,exp:Date.now()+30*86400000,purpose:'game-parent'}));return `${payload}.${await signature(env,payload)}`}
export async function parentIdentity(env:Env,token:string):Promise<string>{const [payload,sig]=token.split('.');if(!payload||!sig||await signature(env,payload)!==sig)throw new Error('Mã xem tiến bộ không hợp lệ.');const o=JSON.parse(atob(payload));if(o.purpose!=='game-parent'||o.exp<Date.now())throw new Error('Mã xem tiến bộ đã hết hạn.');return String(o.sbd)}
