import {useMemo,useState,type CSSProperties} from 'react'
import {PETS} from '../core'
import {normalizePetName} from '../pet-name'
import {anhThuTheoDang} from './anh'
import './dao.css'

export const TEN_GOI_Y:readonly (readonly string[])[]=[
 ['Đá Nhỏ','Rêu Xanh','Bình An','Núi Con'],['Sóng Nhỏ','Giọt Sương','Lam Lam','Mưa Rào'],['Lửa Nhỏ','Tia Nắng','Than Hồng','Hoả Hoả'],['Gió Nhẹ','Mây Bông','Lá Non','Vút'],
 ['Sao Đêm','Ánh Sao','Bắc Đẩu','Tinh Tú'],['Hoa Đào','Má Hồng','Thương Thương','Cánh Hoa'],['Nai Vàng','Lộc Non','Hoa Mai','Nắng Mai'],['Cú Tím','Trăng Non','Pha Lê','Minh Minh'],
]
export function theMoDau(sbd:string){let h=2166136261;for(const c of sbd)h=Math.imul(h^c.charCodeAt(0),16777619);return 1+((h>>>0)%6)}
export interface ChonBanDongHanhProps{batDau?:number;busy?:boolean;loi?:string;moiDoan?:boolean;onChon:(petId:string,ten:string)=>void}

/** V2: toàn bộ Bát Linh luôn xuất hiện trong một đội hình, không giấu thú ngoài màn hình. */
export default function ChonBanDongHanh({batDau=2,busy=false,loi='',moiDoan=false,onChon}:ChonBanDongHanhProps){
 const dau=Math.max(0,Math.min(PETS.length-1,Math.trunc(batDau)))
 const [giua,setGiua]=useState(dau),[ten,setTen]=useState(''),[loiTen,setLoiTen]=useState(''),[luotGoiY,setLuotGoiY]=useState(0)
 const thu=PETS[giua]!
 const mau=useMemo(()=>({'--thu-mau':thu.color,'--thu-nhan':thu.accent} as CSSProperties),[thu])
 const goiY=()=>{const ds=TEN_GOI_Y[giua]!;setTen(ds[luotGoiY%ds.length]!);setLuotGoiY(n=>n+1);setLoiTen('')}
 const chon=()=>{let sach='';if(ten.trim()){try{sach=normalizePetName(ten)}catch(e){setLoiTen(e instanceof Error?e.message:'Tên chưa hợp lệ.');return}}setLoiTen('');onChon(thu.id,sach)}
 return <div className="dao dao-chon dao-chon-v2" data-thu={giua} style={mau}>
  <header className="dao-chon-dau"><small className="dao-nhan">BÁT LINH ĐỒNG HÀNH</small><h2>Chọn người bạn của em</h2><p>Tám thần thú, tám cá tính · tất cả đều cùng em chinh phục môn Hoá</p>{moiDoan&&<p className="dao-chon-moi">Đoàn Hộ Tống đang chờ em — chọn xong là lên đường.</p>}</header>
  <section className="dao-chon-san-khau" aria-live="polite">
   <span className="dao-chon-hao" aria-hidden="true"/><img src={anhThuTheoDang(giua,2)} alt={`${thu.name}, hệ ${thu.element}`} width="320" height="320" decoding="async" draggable={false}/>
   <div><small>ĐANG CHỌN · HỆ {thu.element.toLocaleUpperCase('vi')}</small><h3>{thu.name}</h3><p>{thu.skill}. Càng làm đúng độc lập, bạn ấy càng lớn và mở hiệu ứng mới.</p></div>
  </section>
  <div className="dao-chon-doi-hinh" role="listbox" aria-label="Toàn bộ tám thần thú">
   {PETS.map((p,i)=><button type="button" role="option" aria-selected={i===giua} className="dao-chon-thu-v2" key={p.id} data-chon={i===giua?'':undefined} onClick={()=>{setGiua(i);setLoiTen('')}}>
    <span className="dao-chon-thu-anh"><img src={anhThuTheoDang(i,1,true)} alt="" width="96" height="96" loading={i<4?'eager':'lazy'} decoding="async" draggable={false}/></span><span><b>{p.name}</b><small>{p.element}</small></span>
   </button>)}
  </div>
  <div className="dao-chon-ten-o"><input aria-label="Đặt tên cho thần thú" placeholder={`Đặt tên riêng cho ${thu.name}…`} value={ten} maxLength={48} autoComplete="off" enterKeyHint="done" onChange={e=>{setTen(e.target.value);setLoiTen('')}}/>
   <button type="button" className="dao-chon-goi-y" aria-label="Gợi ý một cái tên" onClick={goiY}><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 12a9 9 0 1 1-9-9c2.5 0 4.8 1 6.5 2.7L21 8"/><path d="M21 3v5h-5"/></svg></button></div>
  {(loiTen||loi)&&<p role="alert" className="dao-loi">{loiTen||loi}</p>}
  <button type="button" className="dao-nut-vang" aria-label={busy?'ĐANG ĐÓN BẠN ẤY':`CHỌN ${thu.name.toLocaleUpperCase('vi')}`} disabled={busy} onClick={chon}><span aria-hidden="true">{busy?'ĐANG ĐÓN BẠN ẤY…':`ĐỒNG HÀNH CÙNG ${thu.name.toLocaleUpperCase('vi')}`}</span></button>
  <p className="dao-chon-meo">Em thấy đủ cả Bát Linh ở đây · tên riêng có thể đổi lại bất cứ lúc nào</p>
 </div>
}
