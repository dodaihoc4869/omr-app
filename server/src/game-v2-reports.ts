import type {Env} from './kieu'
import {parentIdentity} from './game-v2-auth'
import type {Profile} from './game-v2'
export interface Scope {enabled:boolean;types:string[];blocked:string[]}
export async function readGameScope(env:Env,sbd:string):Promise<Scope>{const row=await env.DB.prepare('SELECT json FROM game_v2_scope WHERE sbd=?').bind(sbd).first<{json:string}>();return row?JSON.parse(row.json):{enabled:true,types:[],blocked:[]}}
async function report(env:Env,sbd:string){const row=await env.DB.prepare('SELECT json FROM game_v2_profile WHERE sbd=?').bind(sbd).first<{json:string}>();if(!row)return {sbd,mastery:[],played:false};const p=JSON.parse(row.json) as Profile;return {sbd,played:true,mastery:p.mastery.map(m=>({dang:m.key,stage:m.stage,due:m.due,distinct:m.groups.length})),earned:p.earned,cutover:p.cutover}}
export async function parentGame(env:Env,b:Record<string,unknown>):Promise<Record<string,unknown>>{
 const sbd=await parentIdentity(env,String(b.pass??''));const r=await report(env,sbd)
 if(b.action==='task'){
  const dang=String(b.dang??'');if(!r.mastery.some(m=>m.dang===dang)||!/^[A-Z0-9_]+\.[A-Z0-9_]+\.[A-Z0-9_]+$/.test(dang))throw new Error('Chỉ nhắc ôn dạng con đã học và đã có kết quả game.')
  const existing=await env.DB.prepare('SELECT id FROM game_v2_task WHERE sbd=? AND dang=? AND completed_at IS NULL').bind(sbd,dang).first<{id:string}>()
  if(!existing)await env.DB.prepare('INSERT INTO game_v2_task(id,sbd,dang,created_at) VALUES(?,?,?,?)').bind(crypto.randomUUID(),sbd,dang,new Date().toISOString()).run()
 }
 return {ok:true,report:r}
}
export async function adminGame(env:Env,b:Record<string,unknown>):Promise<Record<string,unknown>>{
 const sbd=String(b.sbd??'').trim();if(!sbd)throw new Error('Nhập SBD cần xem.')
 if(b.action==='spirit'){
  // Read only: never import legacy progress or reset a profile from a classroom projection.
  const row=await env.DB.prepare('SELECT json FROM game_v2_profile WHERE sbd=?').bind(sbd).first<{json:string}>()
  if(!row)return {ok:true,spirit:null}
  const p=JSON.parse(row.json) as Profile
  const setting=await env.DB.prepare("SELECT json FROM game_v2_settings WHERE key='season'").first<{json:string}>()
  if(p.choice||(setting&&p.season!==JSON.parse(setting.json).id))return {ok:true,spirit:null}
  return {ok:true,spirit:{nickname:p.nickname,pet:p.pet,cap:p.cap,tower:p.tower,earned:p.earned}}
 }
 if(b.action==='scope'){
  const types=Array.isArray(b.types)?b.types.map(String).filter(x=>/^[A-Z0-9_]+\.[A-Z0-9_]+\.[A-Z0-9_]+$/.test(x)).slice(0,100):[]
  const blocked=Array.isArray(b.blocked)?b.blocked.map(String).slice(0,500):[]
  await env.DB.prepare('INSERT INTO game_v2_scope(sbd,json,updated_at) VALUES(?,?,?) ON CONFLICT(sbd) DO UPDATE SET json=excluded.json,updated_at=excluded.updated_at').bind(sbd,JSON.stringify({enabled:b.enabled!==false,types,blocked}),new Date().toISOString()).run()
 }
 return {ok:true,report:await report(env,sbd),scope:await readGameScope(env,sbd)}
}
