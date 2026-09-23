import ImmortalShield from '../ImmortalShield'
import {manhKhien,tenThu} from './dao-core'
import type {DaoExp,DaoProfile} from './kieu'
import './dao.css'

export interface TuiDoProps{profile:DaoProfile;exp?:DaoExp|null;busy?:boolean;loi?:string
 /** = `request('shield-use',{useId})` — GIỮ NGUYÊN tác dụng khiên chống đuổi. */
 onDungKhien:(useId:string)=>Promise<unknown>
 onRenKhien?:(soDaRen:number)=>Promise<unknown>
 onMoVoDai?:()=>void;onMoTienBo?:()=>void}

/** Túi đồ: khiên "chống đuổi" + mảnh khiên chuyển từ màn đảo cũ về đây. Phần thưởng chưa có thì để SẮP MỞ, không bịa. */
export default function TuiDo({profile,exp,busy=false,loi='',onDungKhien,onRenKhien,onMoVoDai,onMoTienBo}:TuiDoProps){
 const k=manhKhien(profile,exp),daRen=profile.khienRen?.daRen
 return <div className="dao-tui">
  <header><small className="dao-nhan">TÚI ĐỒ</small><h2>Đồ của {tenThu(profile)}</h2></header>
  {profile.renKhien&&onRenKhien&&<section className="dao-kinh dao-tui-the">
   <h3>Rèn khiên</h3>
   <p>{profile.renKhien.manh} mảnh và {profile.renKhien.gia} EXP cho một khiên. Giữ lại {profile.renKhien.duTru} EXP để thần thú ăn.</p>
   <button type="button" disabled={busy||(profile.soNgayDat??0)<profile.renKhien.manh||(k?.manh??0)<profile.renKhien.manh||profile.wallet<profile.renKhien.gia+profile.renKhien.duTru||(profile.khienRen?.chuaDung??0)>=5} onClick={()=>onRenKhien(daRen??0)}>Rèn 1 khiên · {profile.renKhien.gia} EXP</button>
  </section>}
  {loi&&<p role="alert" className="dao-loi">{loi}</p>}
  <section className="dao-kinh dao-tui-the" aria-label="Khiên"><ImmortalShield serverRemaining={profile.khienConLai??profile.khienRen?.conLai??exp?.manhKhien?.khienConLai} ngayDat={profile.soNgayDat} ngayMo={profile.ngayMoKhienQua} level={profile.cap} state={profile.shields} busy={busy} onUse={onDungKhien}/></section>
  {k&&<section className="dao-kinh dao-tui-the" aria-label="Mảnh khiên"><div className="dao-tui-dong"><span className="dao-tui-so">{k.manh}</span><div><strong>Mảnh khiên · {k.manh}/{k.moiKhien}</strong><p>Đạt nhiệm vụ ngày để nhận 1 mảnh. Rèn một khiên cần <b>{k.moiKhien} mảnh</b> và đủ EXP dư{typeof daRen==='number'&&daRen>0?<> · em đã rèn <b>{daRen}</b> khiên</>:null}.</p></div></div>
   <div className="dao-thanh" role="progressbar" aria-label="Tiến độ rèn khiên" aria-valuemin={0} aria-valuemax={k.moiKhien} aria-valuenow={Math.min(k.manh,k.moiKhien)}><i style={{width:`${Math.round(Math.min(k.manh,k.moiKhien)/k.moiKhien*100)}%`}}/></div></section>}
  <section className="dao-kinh dao-tui-the dao-tui-khoa" aria-label="Trang phục, sắp mở"><div className="dao-tui-dong"><span className="dao-tui-so"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg></span><div><strong>Trang phục · SẮP MỞ</strong><p>Phần thưởng cho em thành thạo trọn một chương đang được chuẩn bị.</p></div></div></section>
  {(onMoVoDai||onMoTienBo)&&<section className="dao-tui-the" aria-label="Lối khác">{onMoTienBo&&<button type="button" className="dao-tui-loi" onClick={onMoTienBo}><span>Tiến bộ của em</span><span aria-hidden="true">›</span></button>}{onMoVoDai&&<button type="button" className="dao-tui-loi" onClick={onMoVoDai}><span>Võ đài</span><span aria-hidden="true">›</span></button>}</section>}
 </div>
}
