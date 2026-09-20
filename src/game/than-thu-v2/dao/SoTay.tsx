import {soTay} from './dao-core'
import type {DaoProfile} from './kieu'
import './dao.css'

export interface SoTayProps{profile:DaoProfile;now?:number
 /** Lệnh `so-tay` của máy chủ; `null`/vắng = Worker chưa có ⇒ chỉ hiện dạng em đã gặp. */
 danhMuc?:readonly {key:string;ten:string;chuong:string}[]|null
 tenDang?:Readonly<Record<string,string>>;tenChuong?:Readonly<Record<string,string>>}

const SAO='M12 2l3 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.9 21l1.2-6.8-5-4.9 6.9-1z'
function BaSao({n}:{n:number}){return <span className="dao-sao" role="img" aria-label={`${n} trên 3 sao`}>{[0,1,2].map(i=><svg key={i} viewBox="0 0 24 24" width="14" height="14" data-sang={i<n?'':undefined} aria-hidden="true"><path d={SAO}/></svg>)}</span>}

/** Sổ tay dạng bài: 3 sao/dạng từ `mastery[]`, gom theo chương, dạng chưa gặp = "???", thẻ "N dạng đang yếu". Không bịa phần thưởng. */
export default function SoTay({profile,now=Date.now(),danhMuc,tenDang,tenChuong}:SoTayProps){
 const s=soTay(profile.mastery,now,danhMuc,tenDang,tenChuong)
 return <div className="dao-so">
  <header><small className="dao-nhan">SỔ TAY DẠNG BÀI</small><h2>{s.tong?`Em đã thành thạo ${s.thanhThao}/${s.tong} dạng`:'Sổ tay đang chờ trang đầu tiên'}</h2><p>Mỗi dạng 3 sao: đúng lần đầu · đúng lại sau 1 ngày · đúng lại sau 7 ngày</p></header>
  {s.yeu.length>0&&<section className="dao-so-yeu" aria-label="Dạng đang yếu"><b>{s.yeu.length}</b><div><strong>{s.yeu.length} dạng đang yếu — sửa là lên sao nhanh nhất</strong><p>Chuyến thám hiểm tới sẽ ưu tiên 2 câu của các dạng này{s.yeu.some(d=>d.ten)?<>: {s.yeu.filter(d=>d.ten).slice(0,3).map(d=>d.ten).join(' · ')}</>:null}.</p></div></section>}
  {!s.tong&&<section className="dao-kinh dao-so-trong"><p>Mỗi dạng bài em gặp trong chuyến thám hiểm sẽ mở một ô ở đây. Em về Đảo, bấm <b>LÊN ĐƯỜNG</b> để mở ô đầu tiên.</p></section>}
  {s.chuong.map(c=><section className="dao-kinh dao-so-chuong" key={c.ma} aria-label={c.ten}><div className="dao-so-chuong-dau"><h3>{c.ten}</h3><span>{c.thanhThao}/{c.dang.length} dạng thành thạo</span></div>
   <ul>{c.dang.map(d=>d.daGap?<li key={d.key} data-sao={d.sao} data-toi-han={d.toiHan?'':undefined}><span>{d.ten||'Dạng em đã gặp'}</span>{d.toiHan&&<em>tới hạn ôn</em>}<BaSao n={d.sao}/></li>
    :<li key={d.key} data-khoa="" aria-label="Dạng chưa gặp"><span>???</span><small>gặp dạng này trong chuyến thám hiểm là mở</small></li>)}</ul></section>)}
  <section className="dao-kinh dao-so-thuong" aria-label="Phần thưởng chương, sắp mở"><span><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg></span><div><strong>Phần thưởng thành thạo trọn chương · SẮP MỞ</strong><p>Đang được chuẩn bị. Sao em gom từ bây giờ vẫn được tính.</p></div></section>
 </div>
}
