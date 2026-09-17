import {useEffect,useRef,useState} from 'react'
import {createPortal} from 'react-dom'
import {EVOLUTION_LEVELS,evolutionStage} from './evolution'
import {shieldEntitlement,shieldRemaining,type ShieldState} from './shields'
const TITLES=['Khiên Khởi Nguyên','Khiên Tinh Tú','Khiên Long Giáp','Khiên Thiên Quang','Khiên Bất Diệt']
const COLORS=['#5eead4','#60a5fa','#c084fc','#fbbf24','#fb7185']
export default function ImmortalShield({level,state,busy,onUse}:{level:number;state?:ShieldState;busy:boolean;onUse:(id:string)=>Promise<unknown>}){
 const [now,setNow]=useState(Date.now),pending=useRef(''),button=useRef<HTMLButtonElement>(null),overlay=useRef<HTMLDivElement>(null)
 const previousLevel=useRef(level),[gift,setGift]=useState(0)
 useEffect(()=>{const earned=shieldEntitlement(level)-shieldEntitlement(previousLevel.current);if(earned>0)setGift(earned);previousLevel.current=level},[level])
 const until=state?.activeUntil??0,active=until>now,remaining=shieldRemaining(level,state),stage=evolutionStage(level),tier=Math.max(0,stage-1)
 useEffect(()=>{setNow(Date.now());if(until<=Date.now())return;const t=setInterval(()=>setNow(Date.now()),100);return()=>clearInterval(t)},[until])
 useEffect(()=>{if(!active)return;const previous=document.activeElement as HTMLElement|null,overflow=document.body.style.overflow;document.body.style.overflow='hidden';overlay.current?.focus();return()=>{document.body.style.overflow=overflow;previous?.focus()}},[active])
 const use=async()=>{pending.current||=crypto.randomUUID();await onUse(pending.current)}
 useEffect(()=>{if(state?.lastUse===pending.current)pending.current=''},[state?.lastUse])
 return <><div className="immortal-inventory mission-shield"><div>{gift>0&&<p role="status" className="immortal-gift">✨ Tiến hoá thành công! Em nhận thêm {gift} Khiên miễn tử.</p>}<strong>🛡 Khiên miễn tử · {remaining} lượt</strong><p>{stage?`${TITLES[tier]} · Quà tiến hoá đã nhận ${[1,3,6,9,12][tier]} khiên`:'Đạt cấp 10 để nhận khiên đầu tiên.'} · Mỗi lần dùng hiện 10 giây.</p><small>Cấp 10: +1 · cấp 30: +2 · cấp 50, 70, 100: mỗi mốc +3.</small></div><button ref={button} disabled={busy||active||remaining<1} onClick={()=>void use()}>Dùng Khiên miễn tử</button></div>{active&&createPortal(<div ref={overlay} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Khiên miễn tử đang kích hoạt" className={`immortal-screen immortal-tier-${tier}`} style={{'--shield-color':COLORS[tier]} as React.CSSProperties} onKeyDown={e=>{if(e.key==='Tab')e.preventDefault()}}>
 <div className="immortal-orbit"/><div className="immortal-orbit second"/>
 <p className="immortal-kicker">PHẦN THƯỞNG TIẾN HOÁ · CẤP {EVOLUTION_LEVELS[stage]}</p><h2>KHIÊN MIỄN TỬ</h2>
 <svg className="immortal-emblem" viewBox="0 0 400 440" aria-hidden="true"><defs><linearGradient id="shield-metal" x2="1" y2="1"><stop stopColor="#fff7ce"/><stop offset=".45" stopColor="var(--shield-color)"/><stop offset="1" stopColor="#fff7ce"/></linearGradient><radialGradient id="shield-core"><stop stopColor="var(--shield-color)"/><stop offset="1" stopColor="#10152d"/></radialGradient></defs>
 <path d="M200 15 340 80 325 252Q304 340 200 414Q96 340 75 252L60 80Z" fill="url(#shield-core)" stroke="url(#shield-metal)" strokeWidth="12"/>
 <path d="M200 46 310 100 296 245Q277 318 200 375Q123 318 104 245L90 100Z" fill="none" stroke="var(--shield-color)" strokeWidth="3"/>
 {Array.from({length:tier+2},(_,i)=><g key={i} transform={`translate(200 216) rotate(${i*360/(tier+2)})`}><path d="M0-115 12-80 0-60-12-80Z" fill="url(#shield-metal)"/></g>)}
 <path d="m200 116 48 93-48 111-48-111Z" fill="url(#shield-metal)" stroke="white" strokeWidth="3"/><path d="m200 149 24 60-24 71-24-71Z" fill="#ffffff"/>
 <path d="M70 145 20 95 36 235 91 283M330 145 380 95 364 235 309 283" fill="none" stroke="url(#shield-metal)" strokeWidth={tier>=2?12:5}/>
 {tier>=3&&<path d="m130 62-10-48 50 28 30-38 30 38 50-28-10 48" fill="url(#shield-metal)"/>}</svg>
 <h3>{TITLES[tier]}</h3><p className="immortal-count">{Math.max(1,Math.ceil((until-now)/1000))}<span>giây</span></p><p>Đã dùng 1 khiên · Còn {remaining} lượt</p>
 </div>,document.body)}</>
}
