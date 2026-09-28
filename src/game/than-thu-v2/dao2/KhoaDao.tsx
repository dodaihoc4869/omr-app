// ĐẢO 2.0 · ĐẢO KHOÁ (máy chủ `start` trả `lyDo:'khoa_cho_doan'` hoặc `hoa2-sanh` báo `khoaDao`): còn câu ôn hôm nay ở Đoàn Hộ Tống.
// Hiện ĐÚNG câu máy chủ gửi (`message` / `loiKhoaDao`) + nút về Sảnh. Có Đoàn thì thêm lối phụ vào thẳng Đoàn Hộ Tống.
import {LOI_KHOA_DAO_MAC_DINH} from './dao2-core'
import './dao2.css'

export interface KhoaDaoProps{
 /** Câu máy chủ trả. Trống ⇒ dùng đúng lời máy chủ `LOI_KHOA_DAO` (không tự viết câu khác). */
 message?:string
 /** Số câu ôn còn ở Đoàn (ổ phục kích) — `hoa2-sanh.doan.con`; null ⇒ không nói số. */
 doanCon?:number|null
 onVeSanh:()=>void;onMoDoan?:()=>void
}
export default function KhoaDao({message,doanCon=null,onVeSanh,onMoDoan}:KhoaDaoProps){
 const chu=message?.trim()||LOI_KHOA_DAO_MAC_DINH
 return <section className="dao2-khoa" aria-labelledby="dao2-khoa-tieu-de">
  <svg className="dao2-khoa-canh" viewBox="0 0 390 240" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
   <defs>
    <linearGradient id="d2-dem" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style={{stopColor:'var(--d2-bien-1)'}}/><stop offset="1" style={{stopColor:'var(--d2-bien-2)'}}/></linearGradient>
    <filter id="d2-suong-k" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="12"/></filter>
   </defs>
   <rect width="390" height="240" fill="url(#d2-dem)"/>
   <path d="M230 200 C240 120 300 90 350 96 C390 100 400 160 390 200 Z" className="dao2-khoa-dao"/>
   <g filter="url(#d2-suong-k)" className="dao2-khoa-suong"><circle cx="300" cy="120" r="46"/><circle cx="350" cy="170" r="40"/></g>
   <path d="M20 190 L120 176" className="dao2-khoa-cau"/><path d="M150 172 L236 160" className="dao2-khoa-cau dao2-khoa-cau-ha"/>
   <g className="dao2-khoa-o"><path d="M112 176 C112 158 128 146 142 146 C158 146 170 160 168 176 Z"/><path d="M126 162 l8 4 M156 162 l-8 4"/></g>
   <g className="dao2-khoa-xe"><rect x="44" y="160" width="46" height="20" rx="3"/><circle cx="54" cy="184" r="6"/><circle cx="80" cy="184" r="6"/></g>
  </svg>
  <div className="dao2-khoa-than">
   <p className="dao2-nhan-nho">BÁT LINH ĐẢO · CẦU CHƯA HẠ</p>
   <h2 id="dao2-khoa-tieu-de">{chu}</h2>
   {doanCon!==null&&doanCon>0&&<p className="dao2-khoa-phu">Còn {doanCon} câu ôn đang chờ ở Đoàn Hộ Tống. Xong hết là cầu sang đảo hạ.</p>}
   <button type="button" className="dao2-nut-vang" onClick={onVeSanh}>VỀ SẢNH</button>
   {onMoDoan&&<button type="button" className="dao2-nut-vien" onClick={onMoDoan}>Vào Đoàn Hộ Tống</button>}
  </div>
 </section>
}
