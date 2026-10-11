import { useEffect, useState } from 'react'
import { goiLenh } from '../../lib/goi-lenh-thay'
import { propsCauHoc } from '../hoc-tap/ManLamBaiTap'
import TheCau from '../TheCau'
import type { PrivateQuestion } from '../../game/than-thu-v2/core'
import type { CauGoi7 } from '../../../server/src/goi-bai-7-loi'
import './chien-dich.css'
import './goi7.css'
interface Du {
  bat:boolean;nguonDayDu?:boolean;goiId:string;canChua:number;soEm:number;soCau:number
  goi:{id:string;ten:string;lop:string;han:string}[]
  cau:(CauGoi7&{lyDo:string[];daChua:boolean;loiGo:string;daDo:number;sai:number;chuaGap:{ten:string;sbd:string}[];canKiem:{ten:string;sbd:string}[];choChua?:{ten:string;sbd:string}[]})[]
  em:{sbd:string;ten:string;tong:number;daGap:number;tuLam:number;con:number;kyNang:{tong:number;dat:number;tyLe:number|null};diem:{maDe:string;diem:number}[]}[]
}
export default function BangGoi7({lop,onBat,trangRieng=false}:{lop?:string|null;onBat?:(bat:boolean)=>void;trangRieng?:boolean}) {
  const [du,setDu]=useState<Du|null>(null),[goi,setGoi]=useState(''),[tai,setTai]=useState(true),[loi,setLoi]=useState(''),[lan,setLan]=useState(0),[q,setQ]=useState<PrivateQuestion|null>(null),[loiGo,setLoiGo]=useState('')
  useEffect(()=>{onBat?.(!!du?.bat)},[du?.bat,onBat])
  useEffect(()=>{
    let huy=false;setTai(true)
    void goiLenh('/gv/goi-bai-7',{lop:lop??'',goiId:goi},'Máy chủ chưa có bảng bài 7 ngày.').then(r=>{if(huy)return;if(!r.ok){setLoi(r.chu);return}const d=r.du as unknown as Du;if(d.bat&&Array.isArray(d.goi)&&Array.isArray(d.em)&&Array.isArray(d.cau)){setDu(d);setLoi('')}else setDu(null)}).finally(()=>{if(!huy)setTai(false)})
    return()=>{huy=true}
  },[lop,goi,lan])
  const mo=async(c:Du['cau'][number])=>{
    if(!du)return;setLoi('');setTai(true)
    const r=await goiLenh('/gv/goi-bai-7',{action:'chi_tiet',goiId:du.goiId,qid:c.qid},'Chưa mở được câu.')
    if(r.ok){setQ(r.du.cau as PrivateQuestion);setLoiGo(c.loiGo==='@loi-giai-goc'?'':c.loiGo)}else setLoi(r.chu)
    setTai(false)
  }
  const luu=async(dungLoiGiaiSan=false)=>{
    if(!q||!du)return;setTai(true)
    const r=await goiLenh('/gv/goi-bai-7',{action:'chua',goiId:du.goiId,qid:q.qid,version:q.version,loiGo,dungLoiGiaiSan},'Chưa lưu được bài chữa.')
    if(r.ok){setQ(null);setLan(n=>n+1)}else setLoi(r.chu)
    setTai(false)
  }
  if(!du&&!loi&&!trangRieng)return null
  const coGoi=!!du?.goi.length
  return <section className="cd-the g7-thay" aria-label="Bài mới trong 7 ngày" aria-busy={tai}><div className="g7-dau"><div><h2>Bài mới trong 7 ngày</h2>{du&&coGoi&&<p>{du.soEm} học sinh · {du.soCau} câu · {du.canChua} câu cần chữa</p>}</div><button className="cd-nut cd-nut--vien" onClick={()=>setLan(n=>n+1)} disabled={tai}>Cập nhật</button></div>
    {tai&&!du&&!loi&&<p role="status">Đang đọc bài mới và tiến độ học sinh…</p>}
    {!tai&&!loi&&!coGoi&&trangRieng&&<p>Chưa có bài mới trong 7 ngày. Thầy chọn bài ở Dạy học → Bài hôm nay, rồi cập nhật lại.</p>}
    {loi&&<p role="alert">{loi}</p>}{du&&coGoi&&<><label>Bài của lớp <select value={du.goiId} onChange={e=>{setGoi(e.target.value);setQ(null)}}>{du.goi.map(g=><option key={g.id} value={g.id}>{g.lop} · {g.ten} · hạn {g.han.slice(8,10)}/{g.han.slice(5,7)}</option>)}</select></label>
    {du.nguonDayDu===false&&<p role="alert">Bộ bài chưa đủ nguồn của mọi tờ đã chọn. Tổng câu và tiến độ dưới đây là phần đã có, chưa xác nhận phủ toàn bộ bài. Thầy bổ sung hoặc kiểm tra nguồn câu.</p>}<p>Gặp câu gốc, tự làm và kỹ năng đã đạt được đo riêng. Chữa cho cả lớp chưa xác nhận từng em đã hiểu.</p>
    <details><summary>Tiến độ {du.em.length} học sinh</summary><div className="cd-cuon-doc" tabIndex={0} role="region" aria-label="Tiến độ từng học sinh trong bài mới"><table className="cd-bang"><thead><tr><th>Học sinh</th><th>Đã gặp câu gốc</th><th>Đã tự làm</th><th>Kỹ năng đã đạt</th><th>Điểm tự kiểm</th></tr></thead><tbody>{du.em.map(e=><tr key={e.sbd}><td>{e.ten}</td><td>{e.daGap}/{e.tong} câu · còn {e.con}</td><td>{e.tuLam} câu</td><td>{e.kyNang.tong?`${e.kyNang.dat}/${e.kyNang.tong} kỹ năng (${e.kyNang.tyLe}%)`:'Chưa có bản đồ kỹ năng'}</td><td>{e.diem.length?e.diem.map((d,i)=>`Tờ ${i+1}: ${d.diem.toFixed(2)}/10`).join(' · '):'Chưa đo'}</td></tr>)}</tbody></table></div></details>
    {q&&<section className="g7-chua m3" aria-label="Soạn phần chữa"><TheCau {...propsCauHoc(q,1,'',()=>{},{correct:true,answer:q.correct,solution:q.solution})}/><label>Giải thích để học sinh học lại<textarea value={loiGo} onChange={e=>setLoiGo(e.target.value)} rows={6} maxLength={20000}/></label><div className="g7-dau"><button className="cd-nut" disabled={tai||loiGo.trim().length<10} onClick={()=>void luu()}>Lưu phần chữa</button><button className="cd-nut cd-nut--vien" disabled={tai||!q.solution} onClick={()=>void luu(true)}>Duyệt lời giải đã có</button><button className="cd-nut cd-nut--vien" disabled={tai} onClick={()=>setQ(null)}>Đóng phần chữa</button></div></section>}
    <details open><summary>Danh sách chữa · phủ toàn bộ {du.cau.length} câu</summary><p>Câu khó và tính toán được đưa lên trước; nhãn nhiều học sinh sai cần ít nhất 5 học sinh đã tự làm.</p>{du.cau.map((c,i)=><article className="g7-cau" key={c.qid}><div><strong>{c.maTo??c.maDe} · Câu {c.soCau??i+1} · {c.phan==='I'?'Trắc nghiệm':c.phan==='II'?'Đúng – sai':'Trả lời ngắn'}</strong><p>{c.lyDo.join(' · ')||'Theo dõi độ phủ'} · {c.daChua?'Đã có phần chữa':'Chưa duyệt phần chữa'}{c.hopLe===false?' · Cần bổ sung câu đã duyệt':''}</p><p>{c.sai}/{c.daDo} học sinh sai ở lần tự làm đầu · {c.chuaGap.length} em chưa gặp · {c.canKiem.length} em cần kiểm lại{c.choChua?.length?` · ${c.choChua.length} em nhờ thầy chữa`:""}</p><details><summary>Học sinh cần hỗ trợ</summary>{c.choChua?.length?<p>Nhờ thầy chữa: {c.choChua.map(e=>e.ten).join(', ')}</p>:null}<p>Chưa gặp: {c.chuaGap.map(e=>e.ten).join(', ')||'Không còn'}</p><p>Cần kiểm lại: {c.canKiem.map(e=>e.ten).join(', ')||'Không còn'}</p></details></div><button className="cd-nut cd-nut--vien" onClick={()=>void mo(c)} disabled={tai}>Mở câu và chữa</button></article>)}</details>
    </>}
  </section>
}
