// ĐẢO 2.0 · ĐỀ THỬ (OMNI 3, 05/10 — hợp đồng docs/hop-dong-omni-3.md mục A; chữ một nguồn src/lib/omni-chu.ts). Không bắt buộc, chỉ để đo.
// Mở từ nút "Đề thử …" trên Sảnh (khoá `game-v2:omni-dao`, Dao2 đọc một lần). Dùng lại ĐÚNG thành phần của Đảo: đầu trang `dao2-bd-dau` + ô kính
// `dao2-the-luc` (ở đây là đồng hồ đếm ngược theo hạn MÁY CHỦ `hetLuc`), nhãn ải `dao2-ai-nhan`, thẻ câu giấy `TheCauAi` (chế độ làm — KHÔNG có đáp án),
// nút chốt `dao2-nut-chot`; sau nộp: dải kết quả `dao2-ket-qua` + thẻ lời giải `KhoiLoiGiai`. Làm đủ các câu ⇒ "Nộp đề thử" (hỏi lại một lần) ⇒
// `hoa2-omni-de-thu-nop`; hết giờ ⇒ tự nộp phần đã làm. Đáp án / lời giải CHỈ xuống máy em sau khi nộp.
import {useCallback,useEffect,useRef,useState} from 'react'
import NutToanManHinh from '../../../components/NutToanManHinh'
import {ManHinhAnh} from '../../../components/QuestionMedia'
import {hoiXacNhan} from '../../../components/hop-thoai'
import {omniDeThu,omniDeThuNop,type DeThuOmni,type KetQuaDeThu} from '../../../components/hoa2/api'
import {diemChu} from '../../../lib/omni-chu'
import type {DaoCall} from '../dao/kieu'
import type {CauDao2} from './dao2-core'
import {KhoiLoiGiai,TheCauAi} from './TrongAi'
import './dao2.css'

export const NUT_NOP_DE_THU='Nộp đề thử'
const LUI=<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>
const dongHo=(giay:number)=>`${Math.floor(giay/60)}:${String(giay%60).padStart(2,'0')}`
/** Câu đã có câu trả lời đủ để chấm (cùng điều kiện nút chốt của ải). */
export const daLamCau=(phan:string,v:string|undefined)=>{const t=(v??'').trim();return phan==='I'?/^[ABCD]$/.test(t):phan==='II'?/^[DS]{4}$/.test(t):t.length>0}
const khoaNhap=(id:string)=>`omni:de-thu:${id}`
function docNhap(id:string):Record<string,string>{try{const o=JSON.parse(sessionStorage.getItem(khoaNhap(id))??'{}');return o&&typeof o==='object'&&!Array.isArray(o)?Object.fromEntries(Object.entries(o).filter(([,v])=>typeof v==='string')) as Record<string,string>:{}}catch{return {}}}
function ghiNhap(id:string,tl:Record<string,string>|null){try{if(tl)sessionStorage.setItem(khoaNhap(id),JSON.stringify(tl));else sessionStorage.removeItem(khoaNhap(id))}catch{/* máy chặn lưu: chỉ mất bản nháp khi tải lại trang */}}

export interface DeThuProps{sbd:string;call:DaoCall;/** Về Sảnh (app học sinh). */onVe:()=>void}
export default function DeThu({call,onVe}:DeThuProps){
 const [de,setDe]=useState<DeThuOmni|null>(null),[loiTai,setLoiTai]=useState(''),[traLoi,setTraLoi]=useState<Record<string,string>>({})
 const [dangNop,setDangNop]=useState(false),[loi,setLoi]=useState(''),[kq,setKq]=useState<KetQuaDeThu|null>(null),[zoom,setZoom]=useState(''),[,setNhip]=useState(0)
 const hetMs=useRef(0),daNop=useRef(false),song=useRef(true)
 useEffect(()=>{song.current=true;return()=>{song.current=false}},[])
 const tai=useCallback(()=>{setLoiTai('');setDe(null)
  omniDeThu(call).then(d=>{if(!song.current)return
   hetMs.current=Number.isFinite(Date.parse(d.hetLuc))?Date.parse(d.hetLuc):Date.now()+Math.max(1,d.phut)*60_000
   setTraLoi(docNhap(d.id));setDe(d)}).catch(e=>{if(song.current)setLoiTai(e instanceof Error&&e.message?e.message:'Chưa soạn được đề thử. Em thử lại sau ít phút.')})},[call])
 useEffect(()=>{tai()},[tai])
 const cau=(de?.cau??[]) as unknown as CauDao2[]
 const con=de&&!kq?Math.max(0,Math.ceil((hetMs.current-Date.now())/1000)):0,hetGio=!!de&&!kq&&con<=0
 const daLam=cau.filter(q=>daLamCau(q.phan,traLoi[q.qid])).length,duHet=cau.length>0&&daLam===cau.length
 const nop=async(tuDong:boolean)=>{
  if(!de||daNop.current||kq)return
  if(!tuDong&&!(await hoiXacNhan({tieuDe:'Nộp đề thử?',noiDung:'Nộp xong em xem điểm và lời giải từng câu; đề này không làm lại được.',nhanDongY:NUT_NOP_DE_THU,nhanKhong:'Làm tiếp'})))return
  daNop.current=true;setDangNop(true);setLoi('')
  try{const r=await omniDeThuNop(call,de.id,Object.fromEntries(cau.map(q=>[q.qid,(traLoi[q.qid]??'').trim()])));if(!song.current)return;ghiNhap(de.id,null);setKq(r)}
  catch(e){daNop.current=false;if(song.current)setLoi(e instanceof Error&&e.message?e.message:'Chưa nộp được đề thử. Em bấm nộp lại.')}
  finally{if(song.current)setDangNop(false)}}
 const nopRef=useRef(nop);nopRef.current=nop
 // Đồng hồ: vẽ lại mỗi giây (chỉ để hiện); hết giờ theo hạn máy chủ ⇒ tự nộp MỘT lần phần đã làm.
 useEffect(()=>{if(!de||kq)return
  const t=setInterval(()=>{setNhip(n=>n+1);if(Date.now()>=hetMs.current&&!daNop.current)void nopRef.current(true)},1000)
  return()=>clearInterval(t)},[de,kq])
 const doi=(qid:string,v:string)=>{if(dangNop||hetGio||!de)return;setTraLoi(x=>{const m={...x,[qid]:v};ghiNhap(de.id,m);return m})}
 const roi=async()=>{if(kq||!de){onVe();return}
  if(await hoiXacNhan({tieuDe:'Rời đề thử?',noiDung:'Câu em đã chọn được giữ trên máy này. Đồng hồ đề thử vẫn chạy khi em rời.',nhanDongY:'Rời đề thử',nhanKhong:'Làm tiếp'}))onVe()}
 const dau=(tieuDe:string)=><header className="dao2-bd-dau">
  <button type="button" className="dao2-nut-tron dao2-nut-tron-lon" onClick={()=>void roi()} aria-label="Rời đề thử về app học sinh" title="Về app học sinh">{LUI}</button>
  <h2><small>BÁT LINH ĐẢO</small>{tieuDe}</h2>
  {de&&!kq&&<p className="dao2-kinh dao2-the-luc" role="timer" aria-label={`Thời gian còn lại của đề thử: ${Math.floor(con/60)} phút ${con%60} giây`}><span><small>Còn lại</small>{dongHo(con)}</span></p>}
  <NutToanManHinh/>
 </header>
 if(!de)return <div className="dao2-de-thu" data-khoi="de-thu">
  {dau('Đề thử')}
  {loiTai?<div className="dao2-bd-loi" role="alert"><p>{loiTai}</p><button type="button" className="dao2-nut-vien" onClick={tai}>Thử lại</button></div>
  :<p className="dao2-bd-cho" role="status" aria-busy="true">Đang soạn đề thử…</p>}
 </div>
 if(kq)return <div className="dao2-de-thu" data-khoi="de-thu" data-pha="ket-qua">
  {zoom&&<ManHinhAnh src={zoom} alt="Ảnh câu hỏi / lời giải" onClose={()=>setZoom('')}/>}
  {dau('Kết quả đề thử')}
  <div className="dao2-kinh dao2-ket-qua" data-dung="" role="status"><span><strong>{kq.diem!==null?`Điểm đề thử: ${diemChu(kq.diem)}`:'Em đã nộp đề thử'}</strong><small>Đúng {kq.dung}/{kq.tong} câu · lời giải từng câu ở dưới</small></span></div>
  {cau.map((q,i)=>{const c=kq.cau.find(x=>x.qid===q.qid);return c?<KhoiLoiGiai key={q.qid} cau={q} stt={i+1} nhan={`CÂU ${i+1}`} tuCuon={false} nguon="de_thu" onZoom={setZoom} traLoiMay={traLoi[q.qid]??''}
   phanHoi={{correct:c.dung,answer:c.dapAn,traLoi:c.traLoi,solution:c.loiGiai,solutionImages:[],reward:0,lyDo:{moc:0,exp:0,chu:''}}}/>:null})}
  <div className="dao2-chan"><button type="button" className="dao2-nut-vang" onClick={onVe}>VỀ SẢNH</button></div>
 </div>
 return <div className="dao2-de-thu" data-khoi="de-thu" data-pha="lam">
  {zoom&&<ManHinhAnh src={zoom} alt="Ảnh câu hỏi" onClose={()=>setZoom('')}/>}
  {dau(`Đề thử ${cau.length} câu`)}
  {cau.map((q,i)=><section key={q.qid} className="dao2-de-thu-cau" aria-label={`Câu ${i+1} trên ${cau.length}`}>
   <p className="dao2-ai-nhan">CÂU {i+1}/{cau.length}{q.tenDang?<span> · {q.tenDang}</span>:null}</p>
   <TheCauAi cau={q} stt={i+1} nhan={`Câu ${i+1}`} traLoi={traLoi[q.qid]??''} khoa={dangNop||hetGio} onTraLoi={v=>doi(q.qid,v)} onZoom={setZoom}/>
  </section>)}
  <div className="dao2-chan" data-noi="">
   {loi&&<p className="dao2-loi" role="alert">{loi}</p>}
   <small className="dao2-tro-ghi" role="status">{hetGio?`Đã hết giờ · em làm ${daLam}/${cau.length} câu`:`Đã làm ${daLam}/${cau.length} câu`}</small>
   <button type="button" className="dao2-nut-chot" disabled={dangNop||!(duHet||hetGio)} onClick={()=>void nop(false)}>{dangNop?'Đang nộp…':duHet||hetGio?NUT_NOP_DE_THU:`Còn ${cau.length-daLam} câu chưa làm`}</button>
  </div>
 </div>
}
