import {useCallback,useEffect,useLayoutEffect,useRef,useState} from 'react'
import {PETS} from '../core'
import {normalizePetName} from '../pet-name'
import {anhThe} from './anh'
import './dao.css'

/** Gợi ý tên (nút xoay vòng cạnh ô tên) — đều hợp lệ với normalizePetName. */
export const TEN_GOI_Y:readonly (readonly string[])[]=[
 ['Đá Nhỏ','Rêu Xanh','Bình An','Núi Con'],['Sóng Nhỏ','Giọt Sương','Lam Lam','Mưa Rào'],['Lửa Nhỏ','Tia Nắng','Than Hồng','Hoả Hoả'],['Gió Nhẹ','Mây Bông','Lá Non','Vút'],
 ['Sao Đêm','Ánh Sao','Bắc Đẩu','Tinh Tú'],['Hoa Đào','Má Hồng','Thương Thương','Cánh Hoa'],['Nai Vàng','Lộc Non','Hoa Mai','Nắng Mai'],['Cú Tím','Trăng Non','Pha Lê','Minh Minh'],
]
/** Thẻ mở đầu theo SBD: mỗi em thấy một thú khác nhau ở giữa (cả lớp không dồn vào một con), luôn có thẻ ló hai bên. */
export function theMoDau(sbd:string){let h=2166136261;for(const c of sbd)h=Math.imul(h^c.charCodeAt(0),16777619);return 1+((h>>>0)%6)}

export interface ChonBanDongHanhProps{
 /** Thẻ nằm giữa lúc mở (0..7). */
 batDau?:number
 busy?:boolean
 /** Lỗi máy chủ trả về cho lần chọn vừa rồi. */
 loi?:string
 /** Dòng mời khi em vào từ cửa Đoàn Hộ Tống. */
 moiDoan?:boolean
 /** MỘT chạm vào nút vàng. `ten` đã chuẩn hoá, rỗng = giữ tên gốc của thú. Máy chủ chỉ cho chọn MỘT lần. */
 onChon:(petId:string,ten:string)=>void
}

export default function ChonBanDongHanh({batDau=2,busy=false,loi='',moiDoan=false,onChon}:ChonBanDongHanhProps){
 const dau=Math.max(0,Math.min(PETS.length-1,Math.trunc(batDau)))
 const [giua,setGiua]=useState(dau),[lat,setLat]=useState(false),[ten,setTen]=useState(''),[loiTen,setLoiTen]=useState(''),[luotGoiY,setLuotGoiY]=useState(0)
 // chỉ nạp tranh của thẻ giữa và hai thẻ kề (mỗi thẻ ~50 KB); thẻ đã nạp thì giữ
 const [daNap,setDaNap]=useState<ReadonlySet<number>>(()=>new Set([dau-1,dau,dau+1])),[daNapNo,setDaNapNo]=useState<ReadonlySet<number>>(()=>new Set())
 const bang=useRef<HTMLDivElement>(null),khung=useRef(0)
 const buoc=()=>{const o=bang.current?.querySelector<HTMLElement>('.dao-chon-o');return o?.offsetWidth||1}
 const toi=useCallback((i:number,muot=true)=>{const b=bang.current;if(!b)return;const dich=Math.max(0,Math.min(PETS.length-1,i))*buoc();if(typeof b.scrollTo==='function')b.scrollTo({left:dich,behavior:muot&&!(typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches)?'smooth':'auto'});else b.scrollLeft=dich},[])
 useLayoutEffect(()=>{toi(dau,false)},[dau,toi])
 useEffect(()=>{setLat(false);setDaNap(cu=>cu.has(giua-1)&&cu.has(giua)&&cu.has(giua+1)?cu:new Set([...cu,giua-1,giua,giua+1]))},[giua])
 const khiCuon=()=>{cancelAnimationFrame(khung.current);khung.current=requestAnimationFrame(()=>{const b=bang.current;if(b)setGiua(Math.max(0,Math.min(PETS.length-1,Math.round(b.scrollLeft/buoc()))))})}
 useEffect(()=>()=>cancelAnimationFrame(khung.current),[])
 const thu=PETS[giua]!
 const chamThe=(i:number)=>{if(i!==giua){toi(i);return}setDaNapNo(cu=>cu.has(i)?cu:new Set([...cu,i]));setLat(v=>!v)}
 const goiY=()=>{const ds=TEN_GOI_Y[giua]!;setTen(ds[luotGoiY%ds.length]!);setLuotGoiY(n=>n+1);setLoiTen('')}
 const chon=()=>{let sach='';if(ten.trim()){try{sach=normalizePetName(ten)}catch(e){setLoiTen(e instanceof Error?e.message:'Tên chưa hợp lệ.');return}}setLoiTen('');onChon(thu.id,sach)}
 return <div className="dao dao-chon" data-thu={giua}>
  <header className="dao-chon-dau"><small className="dao-nhan">BÁT LINH ĐẢO</small><h2>Chọn bạn đồng hành</h2><p>Tám thần thú — con nào cũng học được mọi phần Hoá</p>{moiDoan&&<p className="dao-chon-moi">Đoàn Hộ Tống đang chờ em — chọn xong là lên đường được ngay.</p>}</header>
  <div className="dao-chon-bang" ref={bang} onScroll={khiCuon} role="group" aria-label="Tám thần thú, vuốt ngang để xem">
   {PETS.map((p,i)=>{const lech=i-giua,dangLat=i===giua&&lat
    return <div className="dao-chon-o" key={p.id} data-lech={lech===0?'0':lech<0?'truoc':'sau'} data-xa={Math.abs(lech)>1?'':undefined}>
     <button type="button" className="dao-chon-the" data-thu={i} data-lat={dangLat?'':undefined} aria-current={i===giua?'true':undefined} aria-label={i===giua?`${p.name}, hệ ${p.element}. Chạm để xem dạng ${dangLat?'Bình thường':'Cuồng nộ'}.`:`Xem ${p.name}, hệ ${p.element}`} onClick={()=>chamThe(i)}>
      <span className="dao-chon-tranh">
       {daNap.has(i)&&<img className="dao-chon-mat" src={anhThe(i,'binh-thuong')} alt="" width="512" height="512" decoding="async" draggable={false}/>}
       {daNapNo.has(i)&&<img className="dao-chon-mat dao-chon-mat-no" src={anhThe(i,'cuong-no')} alt="" width="512" height="512" decoding="async" draggable={false}/>}
       {dangLat&&<span className="dao-chon-no-nhan">CUỒNG NỘ</span>}
      </span>
      <span className="dao-chon-chu"><span className="dao-chon-ten"><strong>{p.name}</strong><em>{p.element}</em></span>
       {i===giua&&<span className="dao-chon-ta">Giỏi nhất việc: <b>{p.skill.toLocaleLowerCase('vi')}</b>. Càng làm đúng liên tiếp càng dễ <b className="dao-chon-no-chu">CUỒNG NỘ</b>.</span>}</span>
     </button></div>})}
  </div>
  <div className="dao-chon-cham" role="group" aria-label="Chọn nhanh thần thú">{PETS.map((p,i)=><button type="button" key={p.id} aria-label={p.name} aria-current={i===giua?'true':undefined} onClick={()=>toi(i)}><i/></button>)}</div>
  <div className="dao-chon-ten-o"><input aria-label="Đặt tên cho bạn ấy" placeholder="Đặt tên cho bạn ấy…" value={ten} maxLength={48} autoComplete="off" enterKeyHint="done" onChange={e=>{setTen(e.target.value);setLoiTen('')}}/>
   <button type="button" className="dao-chon-goi-y" aria-label="Gợi ý một cái tên" onClick={goiY}><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 12a9 9 0 1 1-9-9c2.5 0 4.8 1 6.5 2.7L21 8"/><path d="M21 3v5h-5"/></svg></button></div>
  {(loiTen||loi)&&<p role="alert" className="dao-loi">{loiTen||loi}</p>}
  <button type="button" className="dao-nut-vang" disabled={busy} onClick={chon}><span>{busy?'ĐANG ĐÓN BẠN ẤY…':`CHỌN ${thu.name.toLocaleUpperCase('vi')}`}</span></button>
  <p className="dao-chon-meo">Vuốt để xem cả tám · chạm thẻ để xem dạng CUỒNG NỘ · tên thì đổi lại lúc nào cũng được</p>
 </div>
}
