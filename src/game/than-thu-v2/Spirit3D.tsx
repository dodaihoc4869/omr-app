import {useEffect,useRef,useState} from 'react'
import * as T from 'three'
import {evolutionStage,EVOLUTION_NAMES} from './evolution'
import {BATTLE_SKINS} from './learning-battle'
import {buildSpirit} from './spirit-model'
export {buildSpirit} from './spirit-model'
export type SpiritMotion='idle'|'cast'|'hurt'|'victory'
// All cards share one WebGL context. Each visible canvas receives a live render of its own 3D scene.
// This avoids the browser's context limit when a shop, bench and board are on screen together.
interface View {draw:(renderer:T.WebGLRenderer,time:number)=>void;visible:boolean;last:number;fps:number}
const views=new Set<View>();let renderer:T.WebGLRenderer|null=null,frameId=0
function tick(time:number){if(renderer&&!document.hidden){for(const v of views)if(v.visible&&time-v.last>=1000/v.fps){v.draw(renderer,time);v.last=time}}frameId=requestAnimationFrame(tick)}
function register(view:View){if(!renderer){renderer=new T.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true});renderer.setPixelRatio(1);renderer.outputColorSpace=T.SRGBColorSpace;frameId=requestAnimationFrame(tick)}views.add(view);return()=>{views.delete(view);if(!views.size){cancelAnimationFrame(frameId);renderer?.forceContextLoss();renderer?.dispose();renderer=null}}}
export default function Spirit3D({index,level,onFail,compact=false,motion='idle',event=0,low=false,reducedMotion=false}:{index:number;level:number;onFail?:()=>void;compact?:boolean;motion?:SpiritMotion;event?:number;low?:boolean;reducedMotion?:boolean}){
 const host=useRef<HTMLDivElement>(null),canvas=useRef<HTMLCanvasElement>(null),[failed,setFailed]=useState(false)
 const animation=useRef({motion,event,start:0});useEffect(()=>{animation.current={motion,event,start:performance.now()}},[motion,event])
 useEffect(()=>{
  const el=host.current,out=canvas.current,ctx=out?.getContext('2d');if(!el||!out||!ctx)return
  const scene=new T.Scene(),group=new T.Group();scene.add(group)
  const skin=BATTLE_SKINS[index]??BATTLE_SKINS[0],stage=evolutionStage(level),color=new T.Color(`rgb(${skin.color})`)
  const camera=new T.PerspectiveCamera(35,1,.1,100);camera.position.set(0,1.75,5.8);camera.lookAt(0,1,0)
  scene.add(new T.HemisphereLight('rgb(255,246,225)','rgb(59,62,105)',3))
  const key=new T.DirectionalLight('rgb(255,241,209)',4);key.position.set(3,4,5);scene.add(key)
  const rim=new T.PointLight(color,12,8);rim.position.set(-2,2,-1);scene.add(rim)
  const pet=buildSpirit(index,level,low||compact);group.add(pet);const bounds=new T.Box3().setFromObject(pet),size=bounds.getSize(new T.Vector3()),center=bounds.getCenter(new T.Vector3())
  const auraMaterial=new T.MeshBasicMaterial({color,transparent:true,opacity:.5})
  for(let i=0;i<2+stage;i++){const ring=new T.Mesh(new T.TorusGeometry(1.08+i*.045,.012,6,64),auraMaterial);ring.rotation.x=Math.PI/2;ring.position.y=.03+i*.015;group.add(ring)}
  const gems:T.Mesh[]=[];for(let i=0;i<(low?4:8+stage*2);i++){const g=new T.Mesh(new T.OctahedronGeometry(.026+(i%3)*.01),new T.MeshStandardMaterial({color,emissive:color,emissiveIntensity:1.2}));gems.push(g);group.add(g)}
  let yaw=.55,drag=false,lastX=0,lastTime=0,width=240,height=compact?180:330
  const resize=()=>{width=Math.max(1,Math.floor(el.clientWidth));height=Math.max(1,Math.floor(el.clientHeight));const ratio=low?1:Math.min(devicePixelRatio,1.5);out.width=Math.round(width*ratio);out.height=Math.round(height*ratio);camera.aspect=width/height;const fit=Math.max((size.y+.5)/(2*Math.tan(Math.PI*35/360)),Math.max(size.x,size.z)*1.15/(2*Math.tan(Math.PI*35/360)*camera.aspect));camera.position.set(0,center.y+.35,fit+.55);camera.lookAt(0,center.y+.15,0);camera.updateProjectionMatrix()}
  resize();const ro=new ResizeObserver(resize);ro.observe(el);const reduced=matchMedia('(prefers-reduced-motion: reduce)')
  const view:View={visible:true,last:0,fps:compact||low?12:30,draw(r,t){
   view.fps=animation.current.motion==='cast'||animation.current.motion==='hurt'?30:compact||low?12:30;const a=animation.current,elapsed=(t-a.start)/1000,dt=Math.min(50,t-lastTime);lastTime=t
   if(!(reduced.matches||reducedMotion)&&!drag&&a.motion==='idle')yaw+=dt*(compact?.00015:.0003)
   pet.rotation.set(0,a.motion==='idle'?yaw:.95,0);pet.position.set(0,0,0);pet.scale.setScalar(.8+stage*.055)
   if(!(reduced.matches||reducedMotion)){
    if(a.motion==='cast'&&elapsed<1.8){const jump=elapsed<.25?-Math.sin(elapsed/.25*Math.PI)*.1:elapsed<1.05?Math.sin((elapsed-.25)/.8*Math.PI)*.5:0;pet.position.y=jump;pet.rotation.z=elapsed>.4&&elapsed<1.05?-.12:0;pet.scale.y*=elapsed<.25?.88:1}
    else if(a.motion==='hurt'&&elapsed<1.4){pet.position.x=-Math.sin(Math.min(1,elapsed/.4)*Math.PI)*.2;pet.rotation.z=Math.sin(elapsed*35)*.06*Math.max(0,1-elapsed)}
    else pet.position.y=Math.sin(t*.0017)*.025
   }
   gems.forEach((g,i)=>{const angle=i*Math.PI*2/gems.length+((reduced.matches||reducedMotion)?0:t*.00035);g.position.set(Math.cos(angle)*1.05,.2+(i%4)*.36,Math.sin(angle)*.55);g.rotation.y=angle})
   r.setSize(out.width,out.height,false);r.setClearColor(0,0);r.render(scene,camera);ctx.clearRect(0,0,out.width,out.height);ctx.drawImage(r.domElement,0,0,out.width,out.height)
  }}
  let remove:()=>void=()=>{};try{remove=register(view)}catch{setFailed(true);onFail?.()}
  const io=new IntersectionObserver(entries=>{view.visible=entries[0]?.isIntersecting??false});io.observe(el)
  const down=(e:PointerEvent)=>{drag=true;lastX=e.clientX;out.setPointerCapture(e.pointerId)};const move=(e:PointerEvent)=>{if(drag){yaw+=(e.clientX-lastX)*.008;lastX=e.clientX}};const up=()=>{drag=false}
  out.addEventListener('pointerdown',down);out.addEventListener('pointermove',move);out.addEventListener('pointerup',up);out.addEventListener('pointercancel',up)
  return()=>{remove();ro.disconnect();io.disconnect();out.removeEventListener('pointerdown',down);out.removeEventListener('pointermove',move);out.removeEventListener('pointerup',up);out.removeEventListener('pointercancel',up);scene.traverse(o=>{if(o instanceof T.Mesh){o.geometry.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose()}})}
 },[index,level,compact,low,onFail,reducedMotion])
 const skin=BATTLE_SKINS[index]??BATTLE_SKINS[0]
 return <div className="spirit-model" ref={host} data-stage={evolutionStage(level)} data-pet={index} style={{height:compact?180:330,width:'100%',position:'relative'}} role="img" aria-label={`${skin.name}, ${EVOLUTION_NAMES[evolutionStage(level)]}, cấp ${level}, không gian 3D`}><canvas ref={canvas} style={{width:'100%',height:'100%',touchAction:'pan-y'}}/>{failed&&<span>Máy chưa bật được 3D. Em thử bật tăng tốc đồ hoạ hoặc mở bằng trình duyệt khác.</span>}</div>
}
