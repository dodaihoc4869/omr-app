// ĐẢO 2.0 · BẢN ĐỒ BÁT LINH ĐẢO — lớp hình 3D (CanhDao3D, bản vẽ docs/ban-ve-dao-3d-2809/Dao3D.html, đồng bộ Sảnh 3D): sương mù tan theo % vùng + CỌ XÁT, vùng theo dạng có %,
// đường 6 nút của chuyến hôm nay (nút Trùm có vương miện), thần thú đứng ở đầu đường; tấm dưới: "Chuyến thám hiểm k/n", 6 ô vai,
// Rương Bát Linh, nút LÊN ĐƯỜNG. Mọi số lấy từ `hoa2-sanh` / câu `start` trả — thiếu thì ẩn, không bịa.
import NutToanManHinh from '../../../components/NutToanManHinh'
import type {ReactNode} from 'react'
import type {BattleAnswer} from '../learning-battle'
import {anhThu} from '../dao/anh'
import {chiSoThu,tenThu} from '../dao/dao-core'
import type {DaoProfile} from '../dao/kieu'
import {NHAN_O_VAI,TEN_VAI,chuNgay,docVai,soDamSuong} from './dao2-core'
import type {CauDao2,Sanh2,Vung} from './dao2-core'
import CanhDao3D from './CanhDao3D'
import './dao2.css'

export interface BanDoProps{
 profile:DaoProfile;sanh:Sanh2|null;dangTai:boolean;loiSanh?:string
 /** Câu của chuyến sắp đi / đang đi dở (máy chủ `start`/`resume` trả) — null khi chưa soạn xong. */
 cau:readonly CauDao2[]|null;ketQua:readonly BattleAnswer[]
 soan?:string;het?:string;soChuyen:{k:number;n:number}|null;vung:readonly Vung[]
 busy?:boolean;loi?:string;ruongVua?:number|null
 onLenDuong:()=>void;onThuLai:()=>void;onVe:()=>void;onMoRuong?:()=>void
 thanhDuoi?:ReactNode
}
export default function BanDo({profile,sanh,dangTai,loiSanh='',cau,ketQua,soan='',het='',soChuyen,vung,busy=false,loi='',ruongVua=null,onLenDuong,onThuLai,onVe,onMoRuong,thanhDuoi}:BanDoProps){
 const thu=chiSoThu(profile.pet),ten=tenThu(profile),cd=sanh?.chienDich??null,ru=sanh?.ruong??null
 const damSuong=cd?soDamSuong(cd.coXat,cd.tong):10
 const dangDo=ketQua.length>0&&!!cau?.length
 const oVai=cau?cau.slice(0,6):null
 return <div className="dao2-bd">
  <header className="dao2-bd-dau">
   <button type="button" className="dao2-nut-tron dao2-nut-tron-lon" onClick={onVe} aria-label="Về app học sinh" title="Về app học sinh"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button>
   <h2><small>BÁT LINH ĐẢO</small>{cd?.ten?`Đảo ${cd.ten}`:'Bát Linh Đảo'}</h2>
   {sanh?.theLuc&&<p className="dao2-kinh dao2-the-luc" aria-label={`Thể lực hôm nay: còn ${sanh.theLuc.con} trên ${sanh.theLuc.tong} câu`}><svg viewBox="0 0 14 16" width="14" height="16" aria-hidden="true"><polygon points="7,0 14,5 11,16 3,16 0,5"/></svg><span><small>Thể lực</small>{sanh.theLuc.con}/{sanh.theLuc.tong}</span></p>}
   <NutToanManHinh/>
  </header>

  {/* Dọc: hai lớp bọc là `display:contents` (một cột như cũ). Ngang: TRÁI = bản đồ đảo cao hết màn · PHẢI = số chiến dịch + tấm chuyến, nút ở đáy. */}
  <div className="dao2-bd-trai">
  <div className="dao2-bd-khung">
   <CanhDao3D vung={vung} coXat={cd?.coXat??0} tong={cd?.tong??0} thanhThao={cd?.thanhThao??0} damSuong={damSuong} cau={cau} ketQua={ketQua} anhThu={anhThu(thu,profile.cap,true)} tenThu={ten}/>
  </div>
  </div>

  <div className="dao2-bd-phai">
  {cd&&<div className="dao2-bd-so">
   <p className="dao2-kinh"><small>Sương đã tan · Cọ xát</small><b className="dao2-so-xanh">{cd.coXat}/{cd.tong} ô</b></p>
   <p className="dao2-kinh"><small>Đền đã dựng · Thành thạo</small><b className="dao2-so-vang">{cd.thanhThao}/{cd.tong} ô</b>{cd.thanhThao===0&&cd.thanhThaoTangTu&&chuNgay(cd.thanhThaoTangTu)?<small>Đền mọc từ {chuNgay(cd.thanhThaoTangTu)}</small>:null}</p>
   {vung.length>0&&<p className="dao2-bd-chu-thich">1 ô = 1 câu của chiến dịch · % ở mỗi vùng = câu em làm đúng ở lần gần nhất</p>}
  </div>}

  <section className="dao2-kinh dao2-bd-tam" aria-label="Chuyến thám hiểm hôm nay">
   {dangTai&&!sanh?<p className="dao2-bd-cho" role="status" aria-busy="true">Đang mở bản đồ đảo…</p>
   :loiSanh&&!sanh?<div className="dao2-bd-loi" role="alert"><p>{loiSanh}</p><button type="button" className="dao2-nut-vien" onClick={onThuLai}>Thử lại</button></div>
   :<>
    <div className="dao2-bd-tam-dau">
     <h3>{soChuyen?`Chuyến thám hiểm ${soChuyen.k}/${soChuyen.n}`:'Chuyến thám hiểm'}</h3>
     {oVai&&oVai.length>0&&<span>{oVai.length} ải · {oVai.length}–{oVai.length+2} phút</span>}
    </div>
    {het?<p className="dao2-bd-het" role="status">{het}</p>
    :<ol className="dao2-bd-vai" aria-label="Vai của từng ải" aria-busy={!oVai||undefined}>
     {(oVai??Array.from({length:6},()=>null)).map((c,i)=>{const vai=c?docVai(c.vai):null,kq=c?ketQua.find(k=>k.qid===c.qid):undefined
      return <li key={c?.qid??`cho-${i}`} data-vai={vai??undefined} data-trang={kq?(kq.correct?'dung':'sai'):undefined} data-cho={c?undefined:''} aria-label={c?`Ải ${i+1}: ${vai?TEN_VAI[vai]:'chưa rõ vai'}${kq?(kq.correct?' · đã qua, đúng':' · đã qua, chưa đúng'):''}`:`Ải ${i+1}: đang soạn`}>{c?(vai?NHAN_O_VAI[vai]:`Ải ${i+1}`):''}</li>})}
    </ol>}
    {ru&&ru.tong>0&&<div className="dao2-ruong">
     <svg viewBox="0 0 28 24" width="28" height="24" aria-hidden="true"><rect x="2" y="9" width="24" height="13" rx="2" className="dao2-ruong-than"/><path d="M2 11 C2 4 26 4 26 11 Z" className="dao2-ruong-nap"/><rect x="12" y="9" width="4" height="7" rx="1" className="dao2-ruong-khoa"/></svg>
     <span className="dao2-ruong-chu"><b>{ru.daMo?`Rương Bát Linh · đã mở hôm nay${(ruongVua??ru.vang)?` · +${ruongVua??ru.vang} vàng`:''}`:`Rương Bát Linh · xong ${ru.tong}/${ru.tong} câu hôm nay để mở`}</b>
      <span className="dao2-vach dao2-vach-vang" role="progressbar" aria-label="Câu đã làm hôm nay" aria-valuemin={0} aria-valuemax={ru.tong} aria-valuenow={Math.min(ru.daLam,ru.tong)}><i style={{width:`${Math.min(100,ru.daLam/ru.tong*100)}%`}}/></span></span>
     <span className="dao2-ruong-so">{Math.min(ru.daLam,ru.tong)}/{ru.tong}</span>
     {ru.moDuoc&&!ru.daMo&&onMoRuong&&<button type="button" className="dao2-nut-vien dao2-nut-ruong" disabled={busy} onClick={onMoRuong}>Mở rương</button>}
    </div>}
    {(soan||loi)&&<p className={loi?'dao2-loi':'dao2-bd-cho'} role={loi?'alert':'status'}>{loi||soan}</p>}
    {dangDo&&!het&&<p className="dao2-bd-cho">Em đang đi dở chuyến — bấm LÊN ĐƯỜNG để đi tiếp từ ải {ketQua.length+1}.</p>}
    {!het&&<button type="button" className="dao2-nut-vang" disabled={busy||!!sanh?.khoaDao} onClick={onLenDuong}><svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>{busy&&soan?'ĐANG SOẠN HÀNH TRANG…':'LÊN ĐƯỜNG · XUA SƯƠNG MÙ'}</button>}
   </>}
  </section>
  </div>
  {thanhDuoi}
 </div>
}
