// ĐẢO 2.0 · HOẠT CẢNH BẮN CHƯỞNG trong cảnh trận (`CanhRung`) — thầy 28/09: "thêm màn bắn chưởng ứng với đáp án đúng sai".
// CHỈ đọc kết quả MÁY CHỦ đã chấm (`ketQua` = [{qid,correct}]) + công thức máu `learningBattle` — không đoán đúng/sai trên máy, không chạm đáp án.
//  · ĐÚNG: thần thú nhún lấy đà, hào quang tụ → cầu năng lượng màu hệ (vệt đuôi + hạt lấp lánh) bay vòng cung → nổ (sóng xung kích, tia sáng,
//    rung màn) → quái nháy trắng, lùi, mặt nhăn; số "−X" bật đúng lúc trúng; thanh máu quái tụt mượt. Đúng liền ⇒ cầu to dần, Cuồng nộ đổi màu + "Combo xN".
//  · SAI: quái phồng lên, phun cục sương axit tím sang thần thú → thần thú chớp đỏ, giật lùi; số và thanh máu bên thần thú.
//  · Tổng 2,16 s (Cuồng nộ 3,05 s); lớp phủ `pointer-events:none` nên em bấm tiếp ngay được; số máu là số thật, hoạt cảnh chỉ trễ lúc HIỆN.
//  · Chỉ animate transform/opacity (thanh máu: scaleX). `prefers-reduced-motion` ⇒ bản giản lược: một nháy sáng tại phía trúng đòn.
import {useEffect,useRef,useState} from 'react'
import type {CSSProperties} from 'react'
import {learningBattle,BATTLE_SKINS} from '../learning-battle'
import type {BattleAnswer} from '../learning-battle'
import {chanTiengTran,nguCanhTran} from '../battle-audio'
import './chuong.css'
import {NHIP_CHUONG,giamDienHoat} from '../dien-hoat/kieu'

/** Mốc thời gian (giây) — CSS dùng cùng số qua biến `--d2c-phong` / `--d2c-trung`. */
export const MOC_CHUONG=NHIP_CHUONG.thuong

export interface DonChuong{dung:boolean;satThuong:number;combo:number;cuongNo:boolean;quaiTu:number;thuTu:number}
/** Đòn vừa chấm (câu cuối trong `ketQua`); null khi chưa có câu nào. `quaiTu`/`thuTu` = máu trước ÷ máu sau (để thanh tụt từ mức cũ). */
export function donChuong(ketQua:readonly BattleAnswer[],tong:number,suKien:number):DonChuong|null{
 if(suKien<=0||!ketQua.length)return null
 const nay=learningBattle([...ketQua],tong);if(!nay.count)return null
 const truoc=learningBattle(ketQua.slice(0,-1),tong),ti=(cu:number,moi:number)=>moi>0?Math.min(8,cu/moi):1
 return {dung:!!nay.correct,satThuong:nay.damage,combo:nay.correct?nay.streak:0,cuongNo:!!nay.correct&&nay.rage,quaiTu:ti(truoc.enemy,nay.enemy),thuTu:ti(truoc.hp,nay.hp)}
}
/** Thuộc tính gắn lên `<section className="dao2-canh">`: CSS dựa vào đây để lấy đà / lùi / rung màn / tụt thanh máu đúng nhịp chưởng. */
export function thuocTinhCanh(ketQua:readonly BattleAnswer[],tong:number,suKien:number){
 const d=donChuong(ketQua,tong,suKien);if(!d)return {}
 const nhip=d.cuongNo?NHIP_CHUONG.tuyet:MOC_CHUONG
 return {'data-chuong':d.dung?'dung':'sai','data-nhip':String(suKien%2),style:{'--d2c-quai-tu':d.quaiTu,'--d2c-thu-tu':d.thuTu,'--d2c-trung':`${nhip.trung}s`} as CSSProperties}
}
// Máy xin giảm chuyển động HOẶC chế độ máy yếu (29/09) ⇒ bản giản lược.
export function giamChuyenDong():boolean{
 return giamDienHoat()
}

/** Tiếng chưởng tổng hợp (WebAudio, không tải tệp): "vút" lúc phóng + "bùm" lúc trúng, khớp mốc hoạt cảnh. Tắt tiếng / chưa mở âm ⇒ im. */
export function phatTiengChuong(dung:boolean,combo:number,cuongNo:boolean,gianLuoc=false):boolean{
 const ctx=nguCanhTran();if(!ctx)return false
 try{
  const t0=ctx.currentTime+.01,ra=ctx.createGain();ra.gain.value=.22;ra.connect(ctx.destination)
  const giong=(f:number,den:number,luc:number,dai:number,kieu:OscillatorType,to:number)=>{const o=ctx.createOscillator(),g=ctx.createGain();o.type=kieu
   o.frequency.setValueAtTime(f,t0+luc);o.frequency.exponentialRampToValueAtTime(Math.max(25,den),t0+luc+dai)
   g.gain.setValueAtTime(.0001,t0+luc);g.gain.exponentialRampToValueAtTime(to,t0+luc+.02);g.gain.exponentialRampToValueAtTime(.0001,t0+luc+dai)
   o.connect(g);g.connect(ra);o.start(t0+luc);o.stop(t0+luc+dai+.02)}
  const on=(luc:number,dai:number,loc:BiquadFilterType,f:number,to:number)=>{const b=ctx.createBuffer(1,Math.ceil(ctx.sampleRate*dai),ctx.sampleRate),d=b.getChannelData(0)
   for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*(1-i/d.length)
   const s=ctx.createBufferSource(),l=ctx.createBiquadFilter(),g=ctx.createGain();s.buffer=b;l.type=loc;l.frequency.value=f;g.gain.value=to;s.connect(l);l.connect(g);g.connect(ra);s.start(t0+luc)}
  const {phong,trung}=gianLuoc?{phong:.04,trung:.12}:cuongNo?NHIP_CHUONG.tuyet:MOC_CHUONG,cao=1+Math.min(3,combo)*.12
  if(dung){giong(180*cao,620*cao,0,.3,'sine',.25);giong(320*cao,1300*cao,phong,.36,'triangle',.18);on(phong,.34,'highpass',2400,.25)
   giong(140,38,trung,.4,'sine',cuongNo?.9:.6);on(trung,.3,'bandpass',900,.5);giong(880*cao,660*cao,trung+.04,.35,'sine',.1)
   if(cuongNo)giong(1320,990,trung+.1,.45,'triangle',.1)}
  else{giong(120,70,0,.3,'triangle',.3);giong(90,210,phong,.36,'sawtooth',.06);on(phong,.36,'lowpass',700,.22)
   giong(95,40,trung,.35,'sine',.55);on(trung,.28,'lowpass',500,.45)}
  setTimeout(()=>ra.disconnect(),(MOC_CHUONG.het+.6)*1000)
  return true
 }catch{return false}
}


/** Lớp phủ hoạt cảnh; dựng mới theo `suKien` (mỗi lần máy chủ chấm một câu). Tự gỡ sau khi chưởng tan. */
export default function ChuongTranDau({thu,ketQua,tong,suKien}:{thu:number;ketQua:readonly BattleAnswer[];tong:number;suKien:number}){
 const d=donChuong(ketQua,tong,suKien),[xong,setXong]=useState(false),[gianLuoc]=useState(giamChuyenDong),lop=useRef<HTMLDivElement>(null)
 useEffect(()=>{
  if(!d)return
  // chưởng phát tiếng khớp nhịp ⇒ chặn tiếng đòn chung (DaiKetQua) cùng lượt để không kêu hai lần
  if(phatTiengChuong(d.dung,d.combo,d.cuongNo,gianLuoc))chanTiengTran(((d.cuongNo?NHIP_CHUONG.tuyet.het:MOC_CHUONG.het)+.8)*1000)
  const h=setTimeout(()=>setXong(true),((d.cuongNo?NHIP_CHUONG.tuyet.het:MOC_CHUONG.het)+.3)*1000);return()=>clearTimeout(h)
 },[]) // eslint-disable-line react-hooks/exhaustive-deps -- một lần mỗi đòn (component được key theo suKien)
 if(!d||xong)return null
 const kieu=d.dung?'dung':'sai'
 if(gianLuoc)return <div ref={lop} className="d2c" data-kieu={kieu} data-gian-luoc="" aria-hidden="true"><i className="d2c-nhay"/></div>
 const mau=`rgb(${BATTLE_SKINS[thu]?.color??BATTLE_SKINS[0].color})`
 const co=d.cuongNo?1.7:1+Math.min(3,Math.max(0,d.combo-1))*.18
 // màu hệ thần thú chỉ cho chưởng thường; phản đòn (tím) và Cuồng nộ (hồng–vàng) lấy màu trong chuong.css
 const nhip=d.cuongNo?NHIP_CHUONG.tuyet:MOC_CHUONG
 const st={...(d.dung&&!d.cuongNo?{'--d2c-mau':mau}:{}),'--d2c-co':co,'--d2c-phong':`${nhip.phong}s`,'--d2c-trung':`${nhip.trung}s`} as CSSProperties
 return <div ref={lop} className="d2c" data-kieu={kieu} data-cuong-no={d.cuongNo?'':undefined} style={st} aria-hidden="true">
  {/* Hình chưởng và phản đòn nằm trong SanDauDienHoat; lớp này giữ âm thanh/nhãn combo. */}
  {d.dung&&d.combo>=2&&<p className="d2c-combo">Combo x{d.combo}</p>}
 </div>
}
