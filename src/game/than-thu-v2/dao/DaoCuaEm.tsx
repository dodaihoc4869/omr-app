import {useState} from 'react'
import type {FormEvent,ReactNode} from 'react'
import {PETS} from '../core'
import {EVOLUTION_NAMES,evolutionStage} from '../evolution'
import {normalizePetName} from '../pet-name'
import {anhThu,anhThuTheoDang} from './anh'
import {CAP_TOI_DA,NHOM_AI,chiSoThu,chuLuotConLai,chuMaiCho,chuMoThemLuot,duTruNgayAn,duongTienHoa,hapThuHienThi,loiThu,mucTieuGanNhat,nhanLuot,tenThu,tienHoaKe,trangLuot,vongExp} from './dao-core'
import type {LuotNgay,MaiCho,MucTieu} from './dao-core'
import type {DaoExp,DaoProfile} from './kieu'
import {chuHetLuotDao,type LuotCauNgay} from '../chu-het-luot'
import './dao.css'

export interface DaoCuaEmProps{
 profile:DaoProfile;exp?:DaoExp|null;chuoiNgay?:number;now?:number
 /** Từ lệnh `recommendations`: tên 3 dạng sẽ gặp + số câu còn lại hôm nay. `null` = chưa tải xong. */
 goiY?:readonly {title:string}[]|null;conLai?:number|null
 /** `dailyUsed` + `tranNgay` của `recommendations` (máy chủ nói trần, màn không viết cứng); vắng ⇒ lời hết lượt không nói số. */
 luotCau?:LuotCauNgay|null
 /** Đợt 2 (máy chủ mới; đọc chặt bằng `docLuotNgay`/`docMaiCho`): lượt trong ngày + "Mai thú chờ em". Vắng ⇒ không dải lượt, không màn hết lượt (máy chủ cũ). */
 luotNgay?:LuotNgay|null;maiCho?:MaiCho|null
 /** Tên dạng đã biết (mã → tên) để gọi tên mục tiêu "thành thạo dạng …". */
 tenDang?:Readonly<Record<string,string>>
 tasks?:readonly {id:string;dang:string}[]
 busy?:boolean;thongBao?:string;loi?:string
 onLenDuong:()=>void;onOnTheoNhac?:(dang:string)=>void;onNap?:()=>void;onDoiTen?:(ten:string)=>void
}

const ICON:Record<MucTieu['loai'],ReactNode>={
 cap:<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m18 15-6-6-6 6"/></svg>,
 dang:<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M12 2l3 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.9 21l1.2-6.8-5-4.9 6.9-1z"/></svg>,
 khien:<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 13c0 5-3.5 7.5-8 9-4.5-1.5-8-4-8-9V6l8-3 8 3z"/></svg>,
 'tien-hoa':<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3v18M5 10l7-7 7 7"/></svg>,
}
const BAN_KINH=118,CHU_VI=2*Math.PI*BAN_KINH

export default function DaoCuaEm({profile,exp,chuoiNgay,now=Date.now(),goiY=null,conLai=null,luotCau=null,luotNgay=null,maiCho=null,tenDang,tasks=[],busy=false,thongBao='',loi='',onLenDuong,onOnTheoNhac,onNap,onDoiTen}:DaoCuaEmProps){
 const thu=chiSoThu(profile.pet),ten=tenThu(profile),vong=vongExp(profile.cap,profile.exp),ke=tienHoaKe(profile.cap)
 const [suaTen,setSuaTen]=useState(false),[tenMoi,setTenMoi]=useState(''),[loiTen,setLoiTen]=useState('')
 const luuTen=(e:FormEvent)=>{e.preventDefault();try{const sach=normalizePetName(tenMoi);setLoiTen('');setSuaTen(false);onDoiTen?.(sach)}catch(x){setLoiTen(x instanceof Error?x.message:'Tên chưa hợp lệ.')}}
 const hetLuotCau=conLai===0,hetLuotNgay=!!luotNgay&&luotNgay.conLai===0,hetLuot=hetLuotCau||hetLuotNgay,soAi=NHOM_AI.reduce((s,n)=>s+n.suat,0)
 const hapThu=hapThuHienThi(profile.hapThuHomNay,ten,profile.wallet>0)
 const duTru=hapThu?duTruNgayAn(profile.wallet):null
 return <div className="dao-nha" data-thu={thu}>
  <header className="dao-nha-dau"><div><small className="dao-nhan">BÁT LINH ĐẢO</small>
   {suaTen?<form className="dao-nha-doi-ten" onSubmit={luuTen}><input aria-label="Tên thần thú" value={tenMoi} maxLength={48} autoComplete="off" autoFocus onChange={e=>{setTenMoi(e.target.value);setLoiTen('')}}/><button type="submit" className="dao-nut-nho" disabled={busy||!tenMoi.trim()}>Lưu</button><button type="button" className="dao-nut-nho dao-nut-nho-mo" onClick={()=>{setSuaTen(false);setLoiTen('')}}>Huỷ</button></form>
    :<h2>{ten}{onDoiTen&&<button type="button" className="dao-nha-but" aria-label="Đổi tên thần thú" onClick={()=>{setTenMoi(ten);setSuaTen(true)}}><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg></button>}</h2>}
   {loiTen&&<p role="alert" className="dao-nha-loi-ten">{loiTen}</p>}</div>
   <div className="dao-nha-chip">{!!chuoiNgay&&chuoiNgay>0&&<span className="dao-chip dao-chip-lua"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>Chuỗi {chuoiNgay} ngày</span>}
    {exp&&<span className="dao-chip dao-chip-exp">+{exp.homNay.toLocaleString('vi-VN')} EXP hôm nay</span>}</div></header>

  <section className="dao-hon" aria-label={`${ten}, ${PETS[thu]!.name} dạng ${EVOLUTION_NAMES[evolutionStage(profile.cap)]}, cấp ${profile.cap}`}>
   <div className="dao-hon-mat-troi" aria-hidden="true"/>
   <svg className="dao-hon-dat" viewBox="0 0 358 400" preserveAspectRatio="xMidYMax slice" aria-hidden="true"><path className="dao-dat-nui" d="M0 330 C70 300 120 340 190 316 S 300 300 358 326 L358 400 L0 400Z"/><ellipse className="dao-dat-co-dam" cx="179" cy="338" rx="150" ry="34"/><ellipse className="dao-dat-co" cx="179" cy="330" rx="150" ry="30"/><path className="dao-dat-da" d="M40 338 C70 392 130 400 179 400 C228 400 290 392 318 338Z"/><path className="dao-dat-re" d="M70 350 q10 26 22 4 M250 352 q12 30 24 2"/><g className="dao-dat-cay"><circle cx="66" cy="312" r="16"/><circle cx="84" cy="304" r="20"/><circle cx="292" cy="308" r="18"/><circle cx="276" cy="300" r="14"/></g></svg>
   <div className="dao-hon-vong"><svg viewBox="0 0 260 260" aria-hidden="true"><circle className="dao-vong-nen" cx="130" cy="130" r={BAN_KINH}/><circle className="dao-vong-day" cx="130" cy="130" r={BAN_KINH} strokeDasharray={`${(CHU_VI*vong.tiLe).toFixed(0)} ${CHU_VI.toFixed(0)}`}/></svg>
    <img className="dao-hon-thu" src={anhThu(thu,profile.cap)} alt="" width="288" height="288" decoding="async" draggable={false}/></div>
   <div className="dao-hon-cap"><small>CẤP</small><strong>{profile.cap}</strong></div>
   <div className="dao-hon-con" role="status">{vong.toiDa?`Cấp cao nhất · ${CAP_TOI_DA}`:`còn ${vong.con.toLocaleString('vi-VN')} EXP lên cấp ${profile.cap+1}`}</div>
   {profile.wallet>0&&profile.cap<CAP_TOI_DA&&onNap&&<button type="button" className="dao-hon-nap" disabled={busy} onClick={onNap}>Nạp {profile.wallet.toLocaleString('vi-VN')} EXP cho {ten}</button>}
   <p className="dao-hon-loi">{loiThu(profile,now,chuoiNgay)}</p>
  </section>
  {/* THẦN THÚ MỖI NGÀY (Đợt 1): ngay dưới khối có nút nạp — hôm nay đã hấp thụ bao nhiêu / trần; bị chặn thì nói thật. Máy chủ cũ (thiếu `hapThuHomNay`) ⇒ ẩn. */}
  {hapThu&&<section className="dao-kinh dao-hap-thu" data-vung="hap-thu" aria-label="EXP hấp thụ hôm nay"><p className="dao-hap-thu-chu">Hôm nay {ten} đã hấp thụ <b>{hapThu.da} / {hapThu.toiDa} EXP</b></p>
   <div className="dao-thanh" role="progressbar" aria-label={`EXP ${ten} đã hấp thụ hôm nay`} aria-valuemin={0} aria-valuemax={hapThu.toiDa} aria-valuenow={hapThu.da} aria-valuetext={`${hapThu.da} trên ${hapThu.toiDa} EXP`}><i style={{width:`${Math.round(hapThu.tiLe*100)}%`}}/></div>
   {hapThu.bao&&<p className="dao-hap-thu-bao" role="status">{hapThu.bao}</p>}
   {duTru!==null&&<p className="dao-hap-thu-du-tru" data-vung="du-tru">Dự trữ đủ <b>{duTru} ngày ăn</b> · ống nghiệm có {profile.wallet.toLocaleString('vi-VN')} EXP</p>}</section>}

  {tasks.map(t=><section className="dao-kinh dao-nhac" key={t.id}><p>Gia đình nhắc em ôn: <b>{t.dang}</b></p><button type="button" className="dao-nut-nho" disabled={busy} onClick={()=>onOnTheoNhac?.(t.dang)}>Ôn ngay</button></section>)}

  <section className="dao-chuyen" aria-labelledby="dao-chuyen-ten">
   <div className="dao-chuyen-dau"><h3 id="dao-chuyen-ten">CHUYẾN THÁM HIỂM HÔM NAY</h3><span>{soAi} ải · {soAi}–{soAi+2} phút</span></div>
   <ol className="dao-chuyen-ai">{NHOM_AI.map(n=><li key={n.vai} data-vai={n.vai}><b>{n.suat}</b><span>{n.ten}</span></li>)}</ol>
   <p className="dao-chuyen-ta">{hetLuotCau?chuHetLuotDao(luotCau):goiY?.length?<>Hôm nay em sẽ gặp: {goiY.slice(0,3).map((g,i)=><span key={i}>{i>0&&' · '}<b>{g.title}</b></span>)}.</>
    :<>Mỗi chuyến: <b>2 câu dạng em hay sai</b> · <b>1 câu đến lịch ôn lại</b> · 2 câu vừa sức · 1 câu khó hơn sức em một bậc để đánh Trùm ải.</>}</p>
   {luotNgay&&<div className="dao-luot" data-vung="luot-ngay" data-het={hetLuotNgay?'':undefined}>
    <p className="dao-luot-chu" role="status">{chuLuotConLai(luotNgay)}</p>
    <ol className="dao-luot-ds" aria-label="Các lượt hôm nay">{luotNgay.danhSach.map(o=>{const tt=trangLuot(luotNgay,o.so);return <li key={o.so} data-trang={tt} data-loai={o.loai} data-thuong={o.thuong?'':undefined} aria-label={`${nhanLuot(o)}: ${tt==='xong'?'đã đi':tt==='tiep'?'lượt kế tiếp':'chưa tới'}`}><b aria-hidden="true">{o.loai==='trum'?'T':o.so}</b><span aria-hidden="true">{o.loai==='trum'?'Trùm':o.thuong?'Thưởng':`Lượt ${o.so}`}</span></li>})}</ol>
    {luotNgay.khoa.filter(k=>!k.daMo).map(k=><p className="dao-luot-mo" key={k.ma} data-ma={k.ma}>{chuMoThemLuot(k)}.</p>)}
   </div>}
   {hetLuotNgay&&<div className="dao-het-luot" data-vung="het-luot" role="status"><p>{chuMaiCho(ten,maiCho)}</p></div>}
   {(thongBao||loi)&&<p className={loi?'dao-loi':'dao-chuyen-bao'} role={loi?'alert':'status'}>{loi||thongBao}</p>}
   <button type="button" className="dao-nut-vang" disabled={busy||hetLuot} onClick={onLenDuong}><span className="dao-nut-tam-giac" aria-hidden="true"/><span>{busy?'ĐANG SOẠN HÀNH TRANG…':hetLuotNgay?'HẾT LƯỢT HÔM NAY':'LÊN ĐƯỜNG'}</span></button>
  </section>

  <section className="dao-kinh dao-muc-tieu" aria-labelledby="dao-mt-ten"><h3 id="dao-mt-ten" className="dao-nhan-nho">MỤC TIÊU GẦN NHẤT</h3>
   {mucTieuGanNhat(profile,exp,tenDang).map(m=><div className="dao-mt" key={m.loai} data-loai={m.loai}><span className="dao-mt-icon">{ICON[m.loai]}</span><div><p><b>{m.tieuDe}</b><span>{m.phu}</span></p><div className="dao-thanh" role="progressbar" aria-label={m.tieuDe} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(m.tiLe*100)}><i style={{width:`${Math.round(m.tiLe*100)}%`}}/></div></div></div>)}
  </section>

  <section className="dao-kinh dao-tien-hoa" aria-labelledby="dao-th-ten"><div className="dao-tien-hoa-dau"><h3 id="dao-th-ten" className="dao-nhan-nho">ĐƯỜNG TIẾN HOÁ</h3><span>{ke?`${ke.conCap} cấp nữa tới dạng ${ke.dang+1}`:'Em đã mở dạng cuối cùng'}</span></div>
   <ol>{duongTienHoa(profile.cap).map(d=><li key={d.dang} data-hien-tai={d.hienTai?'':undefined} data-da-toi={d.daToi?'':undefined} aria-label={d.daToi?`Dạng ${d.dang+1} · ${EVOLUTION_NAMES[d.dang]} · cấp ${d.moc}${d.hienTai?' · hiện tại':''}`:`Dạng ${d.dang+1} chưa mở · cấp ${d.moc}`}><span>{d.daToi?<img src={anhThuTheoDang(thu,d.dang,true)} alt="" width="96" height="96" loading="lazy" decoding="async"/>:<b>?</b>}</span><small>cấp {d.moc}</small></li>)}</ol>
  </section>
 </div>
}
