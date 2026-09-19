import {useEffect,useRef,useState,useId} from 'react'
import type {CSSProperties} from 'react'
import {BATTLE_SKINS,learningBattle} from './learning-battle'
import type {BattleAnswer} from './learning-battle'
import Spirit2D from './Spirit2D'
import {evolutionStage,EVOLUTION_NAMES} from './evolution'
import {battleMuted,setBattleMuted,playBattleSound} from './battle-audio'
import './learning-battle.css'
export default function LearningBattle({pet,nickname,level,answers,total,event,finished}:{nickname?:string;pet:number;level:number;answers:BattleAnswer[];total:number;event:number;finished:boolean}){
 const battle=learningBattle(answers,total),skin=BATTLE_SKINS[pet]??BATTLE_SKINS[0]
 const [active,setActive]=useState(false);const [muted,setMuted]=useState(battleMuted);const spellClip=useId();const stageIndex=evolutionStage(level)
 const [quiet,setQuiet]=useState(()=>localStorage.getItem('game-battle-quiet')==='1')
 const stage=useRef<HTMLDivElement>(null),lastEvent=useRef(event)
 useEffect(()=>{if(!event||lastEvent.current===event)return;lastEvent.current=event;setActive(true);playBattleSound(pet,stageIndex,!!battle.correct,battle.rage);stage.current?.scrollIntoView({behavior:'instant',block:'start'});const timer=setTimeout(()=>setActive(false),1800);return()=>clearTimeout(timer)},[event])
 useEffect(()=>{const image=new Image();image.src=`/than-thu-v2/spells/${SPELL_NAMES[pet]}.png`},[pet])
 const firing=active&&battle.correct,hit=active&&battle.correct===false
 const label=finished?(battle.enemy===0?'Đã phá tan quái vật!':'Đã hoàn thành lượt học'):active?(firing?(battle.rage?'CƯỜNG NỘ · ':'')+skin.move+' · '+EVOLUTION_NAMES[stageIndex]:'QUÁI VẬT PHẢN CÔNG'):battle.enemy===0?'Quái đã tan · tiếp tục luyện để giữ vững kiến thức':battle.protected?'Bảo hộ đang che chở thần thú':'Kiến thức tiếp sức cho thần thú'
 return <div ref={stage} data-element={pet} className={`learning-battle ${quiet?'battle-quiet':''} ${firing?'battle-fire':''} ${hit?'battle-hurt':''} ${active&&battle.rage?'battle-rage':''}`} style={{'--battle-color':skin.color} as CSSProperties}>
  <div className="battle-topline"><span>✦ ĐỐI ĐẦU TRI THỨC</span><button aria-pressed={!muted} aria-label={muted?"Bật âm thanh":"Tắt âm thanh"} onClick={()=>{setBattleMuted(!muted);setMuted(!muted)}}>{muted?"🔇 Âm tắt":"🔊 Âm bật"}</button><button aria-pressed={quiet} onClick={()=>{setQuiet(!quiet);localStorage.setItem('game-battle-quiet',quiet?'0':'1')}}>{quiet?'Bật chuyển động':'Giảm chuyển động'}</button></div>
  <div className="battle-health"><div><b>{nickname||skin.name} · Cấp {level}</b><span>{battle.hp}/100 HP{battle.protected?' · Bảo hộ':''}</span><progress aria-label="Máu thần thú" max={100} value={battle.hp}/></div><div><b>Quái Sương Mù</b><span>{battle.enemy}/100 HP</span><progress aria-label="Máu quái vật" max={100} value={battle.enemy}/></div></div>
  <div className="battle-world" aria-hidden="true">
   <div className="battle-stars"/><div className="battle-moon"/><div className="battle-floor"/>
   <div className="battle-companion"><div className="battle-aura"/><div className="battle-sprite"><Spirit2D index={pet} level={level} compact battle reducedMotion={quiet} motion={firing?'cast':hit?'hurt':'idle'} event={event}/></div><div className="battle-plinth"/>{firing&&<div key={event} className="battle-debris">{Array.from({length:9},(_,i)=><i key={i} style={{'--i':i} as CSSProperties}>◆</i>)}</div>}</div>
   <div className={`battle-monster ${battle.enemy===0?'battle-defeated':''}`}><svg viewBox="0 0 240 240"><defs><radialGradient id="battle-monster-body"><stop stopColor="rgb(112,84,163)"/><stop offset="1" stopColor="rgb(32,24,72)"/></radialGradient></defs><path fill="url(#battle-monster-body)" stroke="rgb(171,142,221)" strokeWidth="3" d="M55 184 67 151 47 140 18 124 27 104 61 91 81 67 78 30 112 58 144 48 175 22 175 76 198 111 212 159 225 182 191 181 192 207 153 207 139 178 111 175 96 207 53 207Z"/><path fill="rgb(100,66,146)" stroke="rgb(162,113,202)" strokeWidth="2" d="m149 123 41-44 30-19-9 47 19 28-42-6-20 28Z"/><path fill="rgb(255,170,218)" d="m58 105 44-17-12 27-28 4Z"/><path fill="rgb(25,15,45)" d="m64 104 10-5-2 17-6 2Z"/><path fill="rgb(238,215,255)" d="m27 131 30 12-12 10Z"/><path fill="none" stroke="rgb(180,140,229)" strokeWidth="4" d="m110 64 10 19-12 13m31 45 17 12-6 13"/></svg><div className="battle-plinth"/></div>
   {active&&<div key={event} className={`battle-spell ${hit?'battle-reverse':''}`}><div className="battle-charge"/>{!hit&&<SpellArt pet={pet} stage={stageIndex} clipId={spellClip}/>}<div className="battle-beam"/><svg className="battle-ribbons" viewBox="0 0 600 160" preserveAspectRatio="none"><path d="M0 80 C90 -20 110 180 210 80 S330 -20 410 80 S530 180 600 80"/><path d="M0 80 C90 180 110 -20 210 80 S330 180 410 80 S530 -20 600 80"/><path d="M0 80 Q160 25 300 80 T600 80"/></svg>{[0,1,2].map(i=><span key={i} className="battle-ring" style={{left:`${38+i*13}%`}}/>)}<div className="battle-orb">{hit?'✹':skin.symbol}</div><div className="battle-impact"/>{Array.from({length:14},(_,i)=><i className="battle-particle" key={i} style={{'--i':i,'--angle':`${i*360/14}deg`} as CSSProperties}>{hit?'◆':skin.symbol}</i>)}</div>}
   {active&&<div key={`damage-${event}`} className={`battle-damage ${hit?'on-pet':''}`}>−{battle.damage}{battle.rage&&<small>CƯỜNG NỘ ×2</small>}{battle.heal>0&&<small>+{battle.heal} HP hồi phục</small>}</div>}
   <div className="battle-combo">{battle.streak>0?`${battle.streak} câu đúng liên tiếp`:'Đọc kỹ · nghĩ chắc · ra chiêu'}<span>{[0,1,2].map(i=><i key={i} className={i<(battle.streak%3|| (battle.streak?3:0))?'lit':''}>◆</i>)}</span></div>
  </div>
  <div className="battle-caption" role="status" aria-live="polite"><strong>{label}</strong><span>{battle.count?`${battle.correct?'Đúng':'Sai'} · ${battle.correct?'Quái':'Thần thú'} −${battle.damage} HP${battle.heal?` · Hồi ${battle.heal} HP`:''}`:'Ba câu đúng liên tiếp mở chưởng cường nộ'}</span></div>
  <details className="battle-rules"><summary>Luật giao chiến</summary><p>Đúng: quái mất {Math.ceil(100/Math.max(1,total))} máu. Mỗi chuỗi 3 câu đúng: sát thương gấp đôi. Sai: mất tối đa 18 máu; câu đúng tiếp theo hồi 10 máu. Hết máu vẫn được chữa bài và học tiếp. Máu chỉ thuộc lượt chơi này, không trừ EXP hay điểm thi. Chưởng không thưởng thêm EXP và không phụ thuộc tốc độ trả lời.</p></details>
 </div>
}

const SPELL_NAMES=['earth','water','fire','wind','faith','love','gratitude','awareness']
// Row boundaries are measured from each painted source, not assumed equal.
const SPELL_ROWS:number[][]=[
 [0,130,247,391,554,762,1024],
 [0,144,274,414,574,771,1024],
 [0,126,251,390,550,754,1024],
 [0,125,259,405,575,778,1024],
 [0,138,268,420,599,797,1024],
 [0,125,262,396,563,771,1024],
 [0,124,257,394,558,766,1024],
 [0,123,259,410,568,772,1024],
]
const SPELL_LEFT=[[60,60,60,60,35,0],[40,40,30,20,0,0],[450,310,210,150,80,0],[340,250,170,120,60,0],[100,80,50,20,0,0],[130,100,80,20,0,0],[340,100,60,30,0,0],[60,40,20,0,0,0]]
const SPELL_RIGHT=[[850,980,1110,1250,1400,1536],[1480,1480,1500,1536,1536,1536],[1100,1180,1270,1330,1450,1536],[1170,1260,1370,1460,1536,1536],[1440,1470,1536,1536,1536,1536],[1240,1340,1430,1510,1536,1536],[1160,1330,1420,1470,1536,1536],[1310,1380,1460,1536,1536,1536]]
export function SpellArt({pet,stage,clipId}:{pet:number;stage:number;clipId:string}){
 const rows=SPELL_ROWS[pet]??SPELL_ROWS[0]!,y=rows[stage]!,height=rows[stage+1]!-y,x=SPELL_LEFT[pet]![stage]!,width=SPELL_RIGHT[pet]![stage]!-x
 return <svg className="battle-painted-spell" data-stage={stage} data-pet={pet} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none"><defs><clipPath id={clipId}><rect width={width} height={height}/></clipPath></defs><g clipPath={`url(#${clipId})`}><image href={`/than-thu-v2/spells/${SPELL_NAMES[pet]}.png`} width="1536" height="1024" x={-x} y={-y}/></g></svg>
}

export function SpellPreview({pet,level}:{pet:number;level:number}){
 const id=useId(),stage=evolutionStage(level)
 return <div><p>{BATTLE_SKINS[pet]?.move} · {EVOLUTION_NAMES[stage]} · cấp {level}</p><div className="spell-preview" aria-label={`Chưởng xem trước cấp ${level}`}><SpellArt pet={pet} stage={stage} clipId={id}/></div></div>
}
