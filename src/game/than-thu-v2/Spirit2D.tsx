import {useId} from 'react'
import type {CSSProperties} from 'react'
import {evolutionCrop,evolutionMirror,EVOLUTION_NAMES} from './evolution'
import {BATTLE_SKINS} from './learning-battle'
import './spirit-2d.css'
export type SpiritMotion='idle'|'cast'|'hurt'|'victory'
/** One clipped, transparent evolution cell; previews never change the student's level. */
export default function Spirit2D({index=0,level=1,compact=false,motion='idle',event=0,low=false,reducedMotion=false,battle=false}:{index?:number;level?:number;compact?:boolean;motion?:SpiritMotion;event?:number;low?:boolean;reducedMotion?:boolean;battle?:boolean}){
 const crop=evolutionCrop(index,level),skin=BATTLE_SKINS[index]??BATTLE_SKINS[0],clip=useId()
 // The third earth drawing faces left; all the other approved cells face right.
 const mirror=evolutionMirror(index,level)
 return <div className={`spirit-2d ${compact?'spirit-2d-compact':''} ${low||reducedMotion?'spirit-2d-quiet':''} ${battle?'spirit-2d-battle':''}`} data-pet={index} data-stage={crop.column} data-motion={motion} style={{'--spirit-tint':skin.color,'--spirit-stage':crop.column} as CSSProperties} role="img" aria-label={`${skin.name}, ${EVOLUTION_NAMES[crop.column]}, cấp ${level}`}>
  <div className="spirit-2d-halo"/><div className="spirit-2d-orbit"/><div className="spirit-2d-ground"/>
  <div key={`${index}-${crop.column}-${event}-${motion}`} className={`spirit-2d-body spirit-2d-${motion}`}>
   <svg className="spirit-2d-image" viewBox={`0 0 ${crop.width} ${crop.height}`} style={{transform:mirror?'scaleX(-1)':undefined}}><defs><clipPath id={clip}><rect width={crop.width} height={crop.height}/></clipPath></defs><g clipPath={`url(#${clip})`}><image href={`/than-thu-v2/evolution-${crop.atlas}-cutout.png`} x={-crop.x} y={-crop.y} width="1536" height="1024"/></g></svg>
  </div>
  <div className="spirit-2d-motes" aria-hidden="true">{Array.from({length:compact?5:10},(_,i)=><i key={i} style={{'--mote':i,left:`${8+(i*29)%85}%`,top:`${12+(i*37)%75}%`} as CSSProperties}>{skin.symbol}</i>)}</div>
 </div>
}
