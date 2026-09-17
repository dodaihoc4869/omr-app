/** Short synthesized combat sounds: no external audio downloads or autoplay on page load. */
let context:AudioContext|null=null
let muted=false
try{muted=localStorage.getItem('game-battle-muted')==='1'}catch{/* Optional preference. */}
export const battleMuted=()=>muted
export function setBattleMuted(value:boolean){muted=value;try{localStorage.setItem('game-battle-muted',value?'1':'0')}catch{/* Optional preference. */}if(!value)unlockBattleAudio()}
export function unlockBattleAudio(){try{if(muted)return;context??=new AudioContext();if(context.state==='suspended')void context.resume().catch(()=>{})}catch{/* Sound must never block grading. */}}
export function playBattleSound(pet:number,stage:number,correct:boolean,rage:boolean){
 try{
 const ctx=context;if(muted||!ctx||ctx.state!=='running'||document.hidden)return
 const start=ctx.currentTime+.015,duration=rage?1.3:.8
 const master=ctx.createGain();master.gain.value=.24;master.connect(ctx.destination)
 const tone=(frequency:number,to:number,at:number,length:number,type:OscillatorType,volume:number)=>{const osc=ctx.createOscillator(),gain=ctx.createGain();osc.type=type;osc.frequency.setValueAtTime(frequency,start+at);osc.frequency.exponentialRampToValueAtTime(Math.max(25,to),start+at+length);gain.gain.setValueAtTime(.0001,start+at);gain.gain.exponentialRampToValueAtTime(volume,start+at+.025);gain.gain.exponentialRampToValueAtTime(.0001,start+at+length);osc.connect(gain);gain.connect(master);osc.start(start+at);osc.stop(start+at+length+.03);osc.onended=()=>{osc.disconnect();gain.disconnect()}}
 const bases=[100,250,140,440,330,520,390,660],base=(bases[pet]??220)*(1+stage*.035)
 tone(correct?base:110,correct?base*2.3:48,0,.26,'sine',.45)
 const buffer=ctx.createBuffer(1,Math.ceil(ctx.sampleRate*.52),ctx.sampleRate),data=buffer.getChannelData(0)
 for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*(1-i/data.length)
 const source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),noise=ctx.createGain();source.buffer=buffer;filter.type='bandpass';filter.Q.value=.8;filter.frequency.setValueAtTime(correct?1600:600,start+.22);filter.frequency.exponentialRampToValueAtTime(180,start+.72);noise.gain.setValueAtTime(correct?.48:.28,start+.22);noise.gain.exponentialRampToValueAtTime(.0001,start+.76);source.connect(filter);filter.connect(noise);noise.connect(master);source.start(start+.22);source.onended=()=>{source.disconnect();filter.disconnect();noise.disconnect()}
 tone(correct?90:65,28,.42,.35,'sine',rage?.8:.5)
 if(correct){tone(base*2,base*1.5,.42,.32,'triangle',.14);tone(base*3,base*2,.49,.28,'sine',.12)}
 if(rage){tone(base*1.5,base*3,.18,.55,'triangle',.17);tone(72,26,.65,.5,'sine',.65);tone(base*4,base*2,.7,.45,'sine',.12)}
 setTimeout(()=>master.disconnect(),(duration+.3)*1000)
 }catch{/* Audio is ornamental. */}
}
