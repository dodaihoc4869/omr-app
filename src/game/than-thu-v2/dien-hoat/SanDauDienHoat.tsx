import {useEffect,useLayoutEffect,useRef,useState} from 'react'
import bangThu from './atlas.json'
import QuaiSonThuy,{oQuaiSonThuy} from '../QuaiSonThuy'
import {veChuong,glow,ring} from './chuong'
import {boCucSan,NHIP_CHUONG,giamDienHoat} from './kieu'
import type {BanDongHanh,BangThu,DichDienHoat,DongTac,ThuDienHoat} from './kieu'
import './san-dau.css'

const THU=bangThu as ThuDienHoat[]
const khoAnh=new Map<string,Promise<HTMLImageElement>>()
/** Nạp đúng thú đang có mặt; giữ tối đa tám bảng trong bộ nhớ đệm. */
function napAnh(src:string){let p=khoAnh.get(src);if(p){khoAnh.delete(src);khoAnh.set(src,p);return p}
 p=new Promise<HTMLImageElement>((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>{khoAnh.delete(src);reject(new Error('Chưa nạp được hình thần thú'))};im.src=src})
 khoAnh.set(src,p);if(khoAnh.size>8)khoAnh.delete(khoAnh.keys().next().value!);return p}
const clamp=(x:number)=>Math.max(0,Math.min(1,x)),mix=(a:number,b:number,t:number)=>a+(b-a)*t
const ease=(t:number)=>1-(1-clamp(t))**3
const khungChuong=(t:number,ult=false)=>{const ends=ult?[.19,.43,.96,1.58,2.38,3.05]:[.15,.34,.63,1.12,1.67,2.16],i=ends.findIndex(end=>t<end);return i<0?5:i}
function sacThu(thu:number){return THU[thu]??THU[0]!}

interface Props{thu:number;hanhDong?:DongTac;suKien?:string|number;dich:DichDienHoat[];ban?:BanDongHanh[];tinh?:boolean;vaoSan?:boolean}
/** Lớp tranh dùng chung Đảo/Đoàn: không nhận đáp án, không ghi máu hoặc EXP. */
export default function SanDauDienHoat({thu,hanhDong='idle',suKien=0,dich,ban=[],tinh=false,vaoSan=true}:Props){
 const canvas=useRef<HTMLCanvasElement>(null),live=useRef({thu,hanhDong,suKien,dich,ban,tinh,vaoSan})
 useLayoutEffect(()=>{live.current={thu,hanhDong,suKien,dich,ban,tinh,vaoSan}})
 const [sanSang,setSanSang]=useState(false),[nhe,setNhe]=useState(()=>tinh||giamDienHoat()),[phienAnh,setPhienAnh]=useState(0)
 const khoa=`${thu}/${hanhDong}/${suKien}`,ds=`${thu}/${ban.map(b=>`${b.pet}:${!!b.raDon}`).join(',')}/${dich.map(d=>d.loai).join(',')}/${nhe}`
 const anh=useRef(new Map<string,HTMLImageElement>()),moc=useRef(0),mocVao=useRef(0)
 useEffect(()=>{moc.current=performance.now()},[khoa])
 useEffect(()=>{const cap=()=>setNhe(tinh||giamDienHoat()),mq=window.matchMedia?.('(prefers-reduced-motion: reduce)');cap();mq?.addEventListener?.('change',cap)
  const observer=typeof MutationObserver!=='undefined'?new MutationObserver(cap):null;observer?.observe(document.documentElement,{attributes:true,attributeFilter:['class']})
  return()=>{mq?.removeEventListener?.('change',cap);observer?.disconnect()}
 },[tinh])
 useEffect(()=>{
  let song=true,daSanSang=false;anh.current=new Map();setSanSang(false)
  const pets=[...new Set([thu,...ban.map(b=>b.pet)])],nguon=new Set(['/bat-linh/quai-son-thuy.webp'])
  for(const id of pets){const p=sacThu(id);nguon.add(p.portrait);if(!nhe){nguon.add(p.sheets['dung-trung'].preview);if(id===thu){nguon.add(p.sheets.chuong.preview);nguon.add(p.sheets.chay.preview);nguon.add(p.sheets.dam.preview)}else if(ban.some(b=>b.pet===id&&b.raDon))nguon.add(p.sheets.chuong.preview)}}
  for(const src of nguon)void napAnh(src).then(im=>{if(!song)return;anh.current.set(src,im);setPhienAnh(n=>n+1);if(!daSanSang&&anh.current.has(sacThu(thu).portrait)&&anh.current.has('/bat-linh/quai-son-thuy.webp')&&typeof CanvasRenderingContext2D!=='undefined'&&canvas.current?.getContext('2d')){daSanSang=true;mocVao.current=performance.now();setSanSang(true)}}).catch(()=>{/* Hình tĩnh bên dưới vẫn giữ sân; không chặn học vì lỗi ảnh. */})
  return()=>{song=false}
 },[ds]) // eslint-disable-line react-hooks/exhaustive-deps -- khóa tài nguyên độc lập với nhịp hỏi máy chủ

 useEffect(()=>{
  const el=canvas.current
  // jsdom không có Canvas; hình tĩnh vẫn có đủ nội dung và được kiểm độc lập.
  if(!el||typeof CanvasRenderingContext2D==='undefined')return
  const c=el.getContext('2d');if(!c)return
  let raf=0,het=false,ngoai=false,lanCuoi=0
  const giam=()=>nhe||live.current.tinh
  function actor(p:ThuDienHoat,bang:BangThu,frame:number,x:number,y:number,size:number){
   const m=p.sheets[bang].frames[Math.max(0,Math.min(5,frame))]!,im=anh.current.get(p.sheets[bang].preview),s=size/512
   c!.save();c!.translate(x,y)
   if(im){if(m.clip){c!.beginPath();m.clip.forEach(([px,py],i)=>{const dx=(px-m.col*512-m.anchorX)*s,dy=(py-m.y-m.foot)*s;if(i)c!.lineTo(dx,dy);else c!.moveTo(dx,dy)});c!.closePath();c!.clip()}
    c!.drawImage(im,m.x,m.y,m.w,m.h,(m.x-m.col*512-m.anchorX)*s,-m.foot*s,m.w*s,m.h*s)
   }else{const portrait=anh.current.get(p.portrait);if(portrait)c!.drawImage(portrait,-size*.63,-size*.86,size*.86,size*.86)}
   c!.restore()
  }
  function ve(now:number){raf=0;if(het||ngoai||document.hidden)return
   const v0=live.current,active0=v0.hanhDong!=='idle'&&(now-moc.current)<3500||now-mocVao.current<620
   if(!giam()&&!active0&&now-lanCuoi<66){raf=requestAnimationFrame(ve);return}lanCuoi=now
   const v=live.current,quiet=giam(),rect=el!.getBoundingClientRect();if(!rect.width||!rect.height)return
   const g=boCucSan(rect.width,rect.height),dpr=Math.min(devicePixelRatio||1,quiet?1:1.5),W=Math.round(g.W*dpr),H=Math.round(g.H*dpr)
   if(el!.width!==W||el!.height!==H){el!.width=W;el!.height=H}
   c!.setTransform(dpr,0,0,dpr,0,0);c!.clearRect(0,0,g.W,g.H)
   const t=Math.max(0,(now-moc.current)/1000),ult=v.hanhDong==='ultimate',nhip=ult?NHIP_CHUONG.tuyet:NHIP_CHUONG.thuong,lead=v.hanhDong==='punch'?.42:0
   const dang=v.hanhDong!=='idle'&&v.hanhDong!=='guard'&&t<nhip.het+lead,p=sacThu(v.thu),target={x:g.right-18,y:g.ground-g.enemySize*.6}
   const m=p.sheets.chuong.frames[3]!,source={x:g.left+(p.release.x-m.anchorX)*g.size/512,y:g.ground+(p.release.y-m.y%512-m.foot)*g.size/512}
   const cast=dang&&['cast','ultimate','punch'].includes(v.hanhDong)&&t>=lead
   const q=clamp((t-lead)/nhip.phong),chargeSource=t-lead<nhip.phong?{x:mix(g.left+10,source.x,ease(q)),y:mix(g.ground-g.size*.44,source.y,ease(q))}:source
   const spell={skin:p,time:Math.max(0,t-lead),source:chargeSource,target,ground:g.ground,ultimate:ult,light:quiet}
   c!.save()
   if(cast&&!quiet)veChuong(c!,{...spell,layer:'behind'})
   c!.fillStyle='rgba(7,42,36,.4)';c!.beginPath();c!.ellipse(g.left,g.ground+5,g.size*.29,9,0,0,Math.PI*2);c!.fill()
   // Phản đòn và trúng đích dùng cùng một mốc; quái không đổi màu nhận diện.
   const impact=clamp((t-lead-nhip.trung)/.86),recoil=cast&&!quiet&&impact>0?Math.sin(impact*12)*(1-impact)*11:0
   const quai=anh.current.get('/bat-linh/quai-son-thuy.webp')
   for(let i=v.dich.length-1;i>=0;i--){const d=v.dich[i]!,crop=oQuaiSonThuy(d.loai),size=g.enemySize*(i===0?1:i===1?.7:.53),x=g.right+i*size*.27,y=g.ground-i*size*.12
    c!.save();c!.globalAlpha=d.ha?.35:1;c!.translate(x+(i===0?recoil:0),y);c!.rotate(i===0?-recoil*.002:0)
    if(quai)c!.drawImage(quai,...crop,-size/2,-size,size,size*1.13)
    c!.restore()
   }
   // Bạn đứng sau và nhỏ hơn; cùng quay phải để chưởng hướng về bầy quái.
   for(let i=v.ban.length-1;i>=0;i--){const b=v.ban[i]!,bp=sacThu(b.pet),bx=g.left-g.size*(.12+i*.16),by=g.ground-g.size*(.33+i*.14),bs=g.size*(i? .43:.55),bt=Math.max(0,t-.22),banCast=!!b.raDon&&bt<NHIP_CHUONG.thuong.het
    const bf=banCast&&!quiet?khungChuong(bt):Math.floor(now/750)%2
    actor(bp,banCast?'chuong':'dung-trung',bf,bx,by,bs)
    if(banCast&&!quiet){const bm=bp.sheets.chuong.frames[3]!;veChuong(c!,{skin:bp,time:bt,source:{x:bx+(bp.release.x-bm.anchorX)*bs/512,y:by+(bp.release.y-bm.y%512-bm.foot)*bs/512},target,ground:by,light:quiet})}
   }
   let sheet:BangThu='dung-trung',frame=quiet?0:Math.floor(now/750)%2,x=g.left,y=g.ground
   if(!quiet&&v.hanhDong==='idle'&&v.vaoSan&&(now-mocVao.current)/1000<.62){const a=(now-mocVao.current)/620;sheet='chay';frame=Math.floor(a*8)%6;x=mix(-g.size*.1,g.left,ease(a))}
   else if(dang&&!quiet){
    if(v.hanhDong==='run'){sheet='chay';frame=Math.floor(t/.082)%6;x=g.left+Math.sin(t/nhip.het*Math.PI)*g.size*.28}
    else if(v.hanhDong==='hit'){const h=t-nhip.trung;frame=h<0?0:h<.2?2:h<.5?3:h<.86?4:0;if(h>.2&&h<.5){x-=Math.sin((h-.2)/.3*Math.PI)*24;y-=Math.sin((h-.2)/.3*Math.PI)*20}}
    else if(v.hanhDong==='punch'&&t<lead){sheet='dam';frame=Math.min(5,Math.floor(t/.07))}
    else if(cast){sheet='chuong';frame=khungChuong(t-lead,ult)}
   }
   if(!quiet&&!dang)y-=Math.sin(now/560)*1.2
   actor(p,sheet,frame,x,y,g.size)
   if(cast&&!quiet)veChuong(c!,{...spell,layer:'front'})
   if(dang&&v.hanhDong==='hit'&&!quiet){const hurtTarget={x:g.left,y:g.ground-g.size*.48};c!.save();c!.translate(g.W,0);c!.scale(-1,1);veChuong(c!,{skin:{main:'rgb(166,114,236)',accent:'rgb(232,218,255)',type:'water'},time:t,source:{x:g.W-target.x,y:target.y},target:{x:g.W-hurtTarget.x,y:hurtTarget.y},ground:g.ground});c!.restore()}
   if(v.hanhDong==='guard'){ring(c!,g.left,g.ground-g.size*.38,g.size*.36,p.accent,.65);glow(c!,g.left,g.ground-g.size*.4,g.size*.42,p.main,.18)}
   if(dang&&quiet){const point=v.hanhDong==='hit'?{x:g.left,y:g.ground-g.size*.48}:target;glow(c!,point.x,point.y,38,p.main,.4);ring(c!,point.x,point.y,19,p.accent,.5)}
   c!.restore();el!.dataset.action=dang?v.hanhDong:'idle';el!.dataset.frame=String(frame+1);el!.dataset.sheet=sheet;el!.dataset.ready=String(sanSang);el!.dataset.source=JSON.stringify(source);el!.dataset.target=JSON.stringify(target);el!.dataset.quality=quiet?'light':'full'
   if(!quiet)raf=requestAnimationFrame(ve)
  }
  const schedule=()=>{if(!raf&&!het&&!ngoai&&!document.hidden)raf=requestAnimationFrame(ve)}
  const visibility=()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0}else schedule()}
  const observer=typeof IntersectionObserver!=='undefined'?new IntersectionObserver(([e])=>{ngoai=!e!.isIntersecting;if(ngoai){cancelAnimationFrame(raf);raf=0}else schedule()},{rootMargin:'100px'}):null
  observer?.observe(el);const resize=typeof ResizeObserver!=='undefined'?new ResizeObserver(()=>schedule()):null;resize?.observe(el)
  document.addEventListener('visibilitychange',visibility);schedule()
  const end=nhe?setTimeout(()=>{moc.current-=4000;schedule()},450):null
  return()=>{het=true;cancelAnimationFrame(raf);if(end!==null)clearTimeout(end);observer?.disconnect();resize?.disconnect();document.removeEventListener('visibilitychange',visibility)}
 },[khoa,ds,sanSang,nhe,phienAnh])

 const p=sacThu(thu)
 return <div className={`bl-arena${sanSang?' bl-arena-ready':''}`} data-thu={thu} data-dong-tac={hanhDong} data-su-kien={suKien} data-ban={ban.map(b=>b.pet).join(',')}>
  <div className="bl-arena-fallback" aria-hidden="true"><img src={p.portrait} className="bl-arena-thu" alt="" width="335" height="335"/>{dich[0]&&<QuaiSonThuy loai={dich[0].loai} size={220} className="bl-arena-quai"/>}</div>
  <canvas ref={canvas} className="bl-arena-canvas" aria-hidden="true"/>
 </div>
}
