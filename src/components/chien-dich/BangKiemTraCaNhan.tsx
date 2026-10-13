import { useEffect, useState } from 'react'
import { CalendarCheck, RefreshCw } from 'lucide-react'
import { goiLenh } from '../../lib/goi-lenh-thay'
import { docKiemTra, gioKiemTra, type TomTatKiemTra } from '../../lib/kiem-tra-ca-nhan'
import './kiem-tra-ca-nhan.css'
type Em={sbd:string;ten:string;lop:string;kiemTra:TomTatKiemTra}
export default function BangKiemTraCaNhan(){
 const [ds,setDs]=useState<Em[]>([]),[busy,setBusy]=useState(true),[loi,setLoi]=useState(''),[bat,setBat]=useState(false),[loc,setLoc]=useState(''),[trang,setTrang]=useState(0)
 const tai=async()=>{setBusy(true);setLoi('');try{const r=await goiLenh('/gv/kiem-tra-ca-nhan',{},'Máy chủ chưa có lịch kiểm tra riêng.');if(!r.ok)throw new Error(r.chu);setBat(r.du.bat===true);if(!Array.isArray(r.du.em))throw new Error('Chưa đọc được danh sách lịch kiểm tra.');const rows=r.du.em.map((x:Record<string,unknown>)=>({sbd:String(x.sbd??''),ten:String(x.ten??''),lop:String(x.lop??''),kiemTra:docKiemTra(x.kiemTra)}));if(rows.some((x:{kiemTra:unknown})=>!x.kiemTra))throw new Error('Một lịch kiểm tra đang thiếu số liệu.');setDs(rows as Em[])}catch(e){setLoi(e instanceof Error?e.message:'Chưa tải được lịch kiểm tra.')}finally{setBusy(false)}}
 useEffect(()=>{void tai()},[])
 if(!busy&&!loi&&!bat)return null
 const filtered=ds.filter(e=>(e.ten+' '+e.lop).toLocaleLowerCase('vi').includes(loc.toLocaleLowerCase('vi'))),show=filtered.slice(trang*20,(trang+1)*20)
 const ten=(t:TomTatKiemTra)=>t.trangThai==='cho_nguon'?`Chờ bổ sung ${t.thieuNguon} phần`:t.nopLuc!==null?t.trangThai==='het_han'?'Hết hạn · đã chốt':'Đã nộp':t.homNay?'Đến lịch hôm nay':'Sắp đến lịch'
 return <section className="gv-ktcn" aria-labelledby="gv-ktcn-tieu"><header><div><p>Lịch và đề dành riêng cho từng em</p><h2 id="gv-ktcn-tieu"><CalendarCheck size={22} aria-hidden="true"/>Kiểm tra ôn tập</h2></div><button type="button" onClick={()=>void tai()} disabled={busy}><RefreshCw size={18} aria-hidden="true"/>Cập nhật</button></header>
 {busy&&<p role="status">Đang tải lịch kiểm tra…</p>}{loi&&<p role="alert">{loi}</p>}
 {!busy&&!loi&&<><header><p>{ds.filter(e=>e.kiemTra.homNay&&e.kiemTra.nopLuc===null).length} em đến lịch hôm nay · {ds.filter(e=>e.kiemTra.trangThai==='cho_nguon').length} lịch chờ bổ sung</p><label>Tìm học sinh hoặc lớp<input value={loc} onChange={e=>{setLoc(e.target.value);setTrang(0)}}/></label></header>
 {show.length?<table><thead><tr><th>Học sinh</th><th>Lịch riêng</th><th>Bài kiểm tra</th><th>Tiến độ</th></tr></thead><tbody>{show.map(e=><tr key={e.kiemTra.id}><td><strong>{e.ten}</strong><small>{e.lop}</small></td><td>{gioKiemTra(e.kiemTra.moLuc)}<small>{ten(e.kiemTra)}</small></td><td>{e.kiemTra.tong} câu · {e.kiemTra.phut} phút<small>{e.kiemTra.soBai} bài đã dạy</small></td><td>{e.kiemTra.daTra}/{e.kiemTra.tong} câu<small>{e.kiemTra.diem!==null?`${e.kiemTra.diem}/10 điểm lần này`:'Chưa có điểm'}</small></td></tr>)}</tbody></table>:<p>Chưa có lịch phù hợp trong danh sách. Máy đang chuẩn bị từ phạm vi bài đã dạy.</p>}
 {filtered.length>20&&<footer><button disabled={trang===0} onClick={()=>setTrang(trang-1)}>Trang trước</button><span>Trang {trang+1}/{Math.ceil(filtered.length/20)}</span><button disabled={(trang+1)*20>=filtered.length} onClick={()=>setTrang(trang+1)}>Trang sau</button></footer>}</>}
 </section>
}
