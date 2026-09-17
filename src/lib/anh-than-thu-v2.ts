import {PETS} from '../game/than-thu-v2/core'
import {evolutionCrop,evolutionStage,evolutionMirror,EVOLUTION_NAMES} from '../game/than-thu-v2/evolution'
import type {OBang} from './html-may-chieu'
export interface ClassroomSpirit {nickname?:string;pet:string;cap:number;tower:number;earned:number}
const atlases=new Map<string,Promise<HTMLImageElement>>()
function atlas(name:string){
 let pending=atlases.get(name)
 if(!pending){pending=new Promise<HTMLImageElement>((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(new Error('Chưa tải được ảnh thần thú'));image.src=`/than-thu-v2/evolution-${name}-cutout.png`});atlases.set(name,pending);pending.catch(()=>atlases.delete(name))}
 return pending
}
/** Uses the exact transparent cell and orientation used by the student's 2D game. */
export async function classroomSpiritImage(index:number,level:number){
 const c=evolutionCrop(index,level),image=await atlas(c.atlas),canvas=document.createElement('canvas');canvas.width=360;canvas.height=360
 const ctx=canvas.getContext('2d');if(!ctx)return ''
 const scale=330/Math.max(c.width,c.height),w=c.width*scale,h=c.height*scale
 ctx.translate(180,180);if(evolutionMirror(index,level))ctx.scale(-1,1)
 ctx.drawImage(image,c.x,c.y,c.width,c.height,-w/2,-h/2,w,h)
 return canvas.toDataURL('image/png')
}
export async function thanThuV2ChoToChieu(doc:(sbd:string)=>Promise<unknown>,sbd:string,timeout=5000):Promise<OBang['thanThu']|null>{
 let timer:ReturnType<typeof setTimeout>|undefined
 const work=async()=>{
  const p=await doc(sbd) as ClassroomSpirit|null
  if(!p||!Number.isInteger(p.cap)||p.cap<1||p.cap>120)return null
  const index=PETS.findIndex(x=>x.id===p.pet);if(index<0)return null
  const pet=PETS[index]!,anh=await classroomSpiritImage(index,p.cap)
  if(!anh)return null
  return {anh,ten:p.nickname||pet.name,danhHieu:pet.skill,he:pet.element,capDo:p.cap,hinhThai:EVOLUTION_NAMES[evolutionStage(p.cap)],tangThapCaoNhat:p.tower,soCauDaThanhTay:0,earned:p.earned,capToiDa:120}
 }
 try{return await Promise.race([work(),new Promise<null>(resolve=>{timer=setTimeout(()=>resolve(null),timeout)})])}catch{return null}finally{if(timer)clearTimeout(timer)}
}
