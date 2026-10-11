import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, Lightbulb, RefreshCw } from 'lucide-react'
import TheCau, { type TheCauProps } from '../TheCau'
import { loiGiaiChuanTuKho } from '../loi-giai/KhoiLoiGiaiChuan'
import { goiHoa2 } from '../hoa2/api'
import type { HinhAnh } from '../../data/examContent'
import type { Question } from '../../game/than-thu-v2/core'
import '../bang-nhiem-vu/m3-theme.css'
import '../m3/m3.css'
import './hoc-tap.css'

type Cau = Question & { vaiGoi7?:string; huongDan7?:boolean; coGoi7?:boolean; goiY?: { gach?: string[]; cotLoi?: string } }
type Ket = { choThay?:boolean; hocCoHoTro?:boolean; correct: boolean; answer: string; solution?: unknown; omni?: { luot?: boolean }; solutionImages?: Question['hinhAnh'] }
export function duTraLoi(phan: string, value: string): boolean { return phan === 'II' ? /^[DS]{4}$/.test(value) : phan === 'I' ? /^[ABCD]$/.test(value) : value.trim().length > 0 }
export function propsCauHoc(q: Cau, stt: number, value: string, onChange: (v: string) => void, ket?: Ket, khoa = false): TheCauProps {
  const chung = { cheDo: ket ? 'xem_lai' as const : 'thi' as const, stt, text: q.text, table: q.table, thanCauImg: q.thanCauImg, imageDataUrl: q.imageDataUrl, hinhAnh: [...q.hinhAnh, ...(ket?.solutionImages ?? [])] as HinhAnh[], ...(ket ? { loiGiai: loiGiaiChuanTuKho(ket.solution, q.phan, ket.answer), explanation: typeof ket.solution === 'string' ? ket.solution : undefined } : {}) }
  if (q.phan === 'I') return { ...chung, phan: 'I', choices: q.choices as [string, string, string, string], choiceImgs: q.choiceImgs as [string?, string?, string?, string?], choicePerm: [0, 1, 2, 3], selected: /^[ABCD]$/.test(value) ? value as 'A' | 'B' | 'C' | 'D' : null, onSelect: khoa || ket ? undefined : onChange, ...(ket ? { correct: ket.answer as 'A' | 'B' | 'C' | 'D' } : {}) }
  if (q.phan === 'II') return { ...chung, phan: 'II', ideas: q.ideas as [string, string, string, string], ideaImgs: q.ideaImgs as [string?, string?, string?, string?], selected: Array.from({ length: 4 }, (_, i) => value[i] === 'D' ? 'D' : value[i] === 'S' ? 'S' : null), onSelect: khoa || ket ? undefined : (i, v) => { const a = value.padEnd(4, '-').split(''); a[i] = v; onChange(a.join('')) }, ...(ket ? { correct: ket.answer.split('') as ['D' | 'S', 'D' | 'S', 'D' | 'S', 'D' | 'S'] } : {}) }
  return { ...chung, phan: 'III', selected: value, onChange, khoaO: khoa || !!ket, ...(ket ? { correct: ket.answer } : {}) }
}
export default function ManLamBaiTap({ token, sbd, onVe, onCapNhat, onChua }: { token: string; sbd: string; onVe: () => void; onCapNhat: () => void; onChua: (qid: string) => void }) {
  const [phien, setPhien] = useState(''), [cau, setCau] = useState<Cau[]>([]), [viTri, setViTri] = useState(0)
  const [tra, setTra] = useState(''), [ket, setKet] = useState<Record<string, Ket>>({}), [tai, setTai] = useState(true), [nop, setNop] = useState(false), [loi, setLoi] = useState(''), [lan, setLan] = useState(0), [xong, setXong] = useState(false), [goiY, setGoiY] = useState(false)
  const batDau = useRef(0), gui = useRef(false)
  const q = cau[viTri], k = q ? ket[q.qid] : undefined
  const khoa = q ? `hoc-tap:nhap:${sbd}:${q.qid}:${q.version}` : ''
  useEffect(() => {
    let huy = false
    setTai(true); setLoi(''); setXong(false); setKet({}); setViTri(0)
    void goiHoa2('hoc-tap-start', token, {}, 40).then(r => {
      if (huy) return
      if (!r.ok) throw new Error(typeof r.error === 'string' ? r.error : 'Chưa mở được đợt học.')
      const ds = Array.isArray(r.questions) ? r.questions as Cau[] : []
      if (ds.some(c => !c.qid || !['I', 'II', 'III'].includes(c.phan) || typeof c.text !== 'string' || !Array.isArray(c.hinhAnh) || c.phan === 'I' && c.choices?.length !== 4 || c.phan === 'II' && c.ideas?.length !== 4)) throw new Error('Nội dung câu chưa đầy đủ. Em cập nhật lại bài học nhé.')
      setCau(ds); setPhien(typeof r.id === 'string' ? r.id : '')
      if (!ds.length) setLoi('Hiện chưa có câu phù hợp để mở đợt mới. Em về Hôm nay để xem tiến độ và tình trạng nguồn câu.')
    }).catch(e => { if (!huy) setLoi(e instanceof Error ? e.message : 'Chưa tải được bài học.') }).finally(() => { if (!huy) setTai(false) })
    return () => { huy = true }
  }, [token, lan])
  useEffect(() => { setTra(''); setGoiY(false); batDau.current = Date.now(); if (khoa) try { setTra(localStorage.getItem(khoa) || '') } catch { /* Lưu nháp không khả dụng. */ } }, [khoa])
  const doiTra = (v: string) => { setTra(v); try { localStorage.setItem(khoa, v) } catch { /* Em vẫn làm và nộp được. */ } }
  const nopCau = async () => {
    if (!q || !phien || !duTraLoi(q.phan, tra) || gui.current || k) return
    gui.current = true; setNop(true); setLoi('')
    try {
      const r = await goiHoa2('answer', token, { session: phien, qid: q.qid, answer: tra, assisted: !!q.goiY, msLam: Math.max(0, Date.now() - batDau.current) }, 40)
      if (typeof r.correct !== 'boolean' || typeof r.answer !== 'string') throw new Error(typeof r.error === 'string' ? r.error : 'Chưa xác nhận được bài nộp. Em thử lại; kết quả không bị tính hai lần.')
      setKet(v => ({ ...v, [q.qid]: r as unknown as Ket })); try { localStorage.removeItem(khoa) } catch { /* Không cản nhận kết quả. */ } onCapNhat()
    } catch (e) { setLoi(e instanceof Error ? e.message : 'Chưa nộp được câu. Đáp án nháp vẫn được giữ.') }
    finally { gui.current = false; setNop(false) }
  }
  const hocHuongDan = async () => {
    if(!q || !phien || gui.current || k)return
    gui.current=true;setNop(true);setLoi('')
    try {
      const r=await goiHoa2('hoc-tap-gap',token,{session:phien,qid:q.qid,chuaTuLam:true},40)
      if(r.ok!==true || !(r.choThay===true || r.hocCoHoTro===true&&typeof r.answer==='string'))throw new Error(typeof r.error==='string'?r.error:'Chưa mở được phần chữa.')
      setKet(v=>({...v,[q.qid]:r as unknown as Ket}));onCapNhat()
    } catch(e){setLoi(e instanceof Error?e.message:'Chưa tải được phần chữa.')}finally{gui.current=false;setNop(false)}
  }
  const tiep = () => { setLoi(''); if (viTri + 1 < cau.length) setViTri(i => i + 1); else { setXong(true); onCapNhat() } }
  // TRÙNG TU 11/10 (bản vẽ thầy duyệt): thanh trên = lưu-và-về · "Câu x trong y câu" · vạch từng câu; phản hồi nằm ngay dưới câu; trên điện thoại
  // khối nút dính đáy màn (sát ngón cái); xong chặng = kết quả từng câu + một nút học tiếp. Chữ "đợt" → "chặng" (bảng từ chuẩn A2).
  const ttCau = (c: Cau, i: number) => { const r = ket[c.qid]; return r ? (r.choThay || r.hocCoHoTro || r.omni?.luot ? 'ho-tro' : r.correct ? 'dung' : 'sai') : i === viTri && !xong ? 'dang' : 'cho' }
  const soDung = cau.filter((c, i) => ttCau(c, i) === 'dung').length
  const soDaNop = cau.filter(c => !!ket[c.qid]).length
  const loai = q ? (q.phan === 'I' ? 'Trắc nghiệm' : q.phan === 'II' ? 'Đúng – sai' : 'Trả lời ngắn') : ''
  const chuKet = k ? (k.choThay ? 'Em đã gặp câu này và nhờ thầy chữa. Khi có phần chữa, em sẽ được học lại; hiện chưa tính đúng hoặc đã hiểu.' : k.hocCoHoTro ? 'Em đã học phần chữa. Câu này được ghi là đã gặp với hỗ trợ, chưa tính tự làm đúng.' : k.omni?.luot ? 'Lượt này chưa được tính đúng hay sai.' : k.correct ? 'Em đã trả lời đúng.' : 'Em xem lời giải để hiểu chỗ còn mắc.') : ''
  return <div className="ht-app ht-lam ht2-lam m3"><header className="ht-thanh ht2-lam-dau"><button className="ht-nut-bieu-tuong" onClick={onVe} disabled={nop} aria-label="Lưu và về Hôm nay"><ArrowLeft size={18} aria-hidden="true" /></button>
      <div className="ht2-lam-giua"><strong>{xong ? 'Xong chặng học' : q ? `Câu ${viTri + 1} trong ${cau.length} câu` : 'Chặng học của em'}</strong>{cau.length > 0 && <div className="ht2-lam-vach" aria-hidden="true">{cau.map((c, i) => <i key={c.qid} data-tt={ttCau(c, i)} />)}</div>}</div>
      <span className="ht2-lam-phai">{q && !xong ? `${viTri + 1}/${cau.length} câu` : ''}</span></header>
    <main className="ht-phien">
      {tai ? <div className="ht-the ht-trong" role="status">Đang chuẩn bị những câu phù hợp với em…</div> : xong ? <section className="ht-the ht-hoan-thanh ht2-xong"><span className="ht2-xong-dau" aria-hidden="true"><Check size={32} /></span><p className="ht2-nhan">Chặng học đã được lưu</p><h1>Em đã hoàn thành chặng này</h1>
        <p className="ht2-xong-so"><b>{soDung}</b><small>/{cau.length} câu tự làm đúng</small></p>
        <div className="ht2-xong-cau" aria-label="Kết quả từng câu">{cau.map((c, i) => <span key={c.qid} data-tt={ttCau(c, i)}>{i + 1}</span>)}</div>
        <p>{soDaNop} câu đã nhận phản hồi. Tiến độ hôm nay được cập nhật theo từng loại nhiệm vụ.</p><p className="ht-chu-phu">Câu sai tự vào lịch ôn 1 · 3 · 7 ngày. Câu tự làm, câu có hỗ trợ và kiến thức đã vững được theo dõi riêng.</p>
        <button className="ht-nut-chinh ht2-nut-lon" onClick={() => setLan(n => n + 1)}>Học tiếp chặng sau<ArrowRight size={18} aria-hidden="true" /></button><button className="ht-nut-phu" onClick={onVe}>Nghỉ và về Hôm nay</button></section> : q ? <div className="ht-vung-lam">
        <section className="ht-de"><p className="ht2-loai"><span>{loai}</span>{q.tenDang ? <span>{q.tenDang}</span> : null}</p><TheCau {...propsCauHoc(q, viTri + 1, tra, doiTra, k?.choThay?undefined:k, nop||!!k?.choThay)} />
          {k && <p className="ht-phan-hoi ht2-ket" data-tt={ttCau(q, viTri)} role="status">{chuKet}</p>}</section>
        <aside className="ht-dieu-khien"><section className="ht-the"><h2>Chặng của em</h2><div className="ht-dot">{cau.map((c, i) => <span key={c.qid} data-xong={!!ket[c.qid]} aria-current={i === viTri ? 'step' : undefined}>{ket[c.qid] ? <Check size={15} aria-label="Đã nhận phản hồi" /> : i + 1}</span>)}</div><p className="ht-chu-phu ht2-nhac">Tự làm trước, đọc kỹ dữ kiện. Em có thể nghỉ sau mỗi chặng.</p>
          {q.huongDan7 && !k && <p>Em có thể thử tự làm hoặc học cách giải từng bước. Câu khó này không bắt buộc phải tự giải ngay.</p>}
          {(q.coGoi7||q.vaiGoi7==='moi'||q.vaiGoi7==='tiep_can'||q.vaiGoi7==='chua')&&!k&&<button className="ht-nut-phu" onClick={()=>void hocHuongDan()} disabled={nop}><Lightbulb size={18} aria-hidden="true" />{q.vaiGoi7==='chua'?'Thầy đã chữa · học cách giải':'Chưa tự làm được · xem chữa'}</button>}
          {q.goiY && !k && <><button className="ht-nut-phu" onClick={() => setGoiY(v => !v)}><Lightbulb size={18} aria-hidden="true" />{goiY ? 'Thu gọn gợi ý' : 'Xem gợi ý'}</button><p className="ht-chu-phu">Câu này có gợi ý; lượt dùng gợi ý tính là có hỗ trợ.</p>{goiY && <div className="ht-thong-bao">{q.goiY.cotLoi || (q.goiY.gach?.length ? `Có thể loại phương án ${q.goiY.gach.join(', ')}.` : 'Đọc lại kiến thức cốt lõi của bài.')}</div>}</>}
          {k ? <><button className="ht-nut-chinh ht2-nut-lon" onClick={tiep}>{viTri + 1 === cau.length ? 'Kết thúc chặng' : 'Câu tiếp theo'}<ArrowRight size={18} aria-hidden="true" /></button>{!k.correct && !k.omni?.luot && !k.hocCoHoTro && !k.choThay && <button className="ht-nut-phu" onClick={() => onChua(q.qid)}>Tự chữa câu này</button>}</> : <button className="ht-nut-chinh ht2-nut-lon" onClick={() => void nopCau()} disabled={nop || !duTraLoi(q.phan, tra)}>{nop ? 'Đang nộp…' : 'Nộp câu trả lời'}<ArrowRight size={18} aria-hidden="true" /></button>}
        </section></aside>
      </div> : null}
      {loi && <div className="ht-thong-bao ht2-loi" role="alert"><span>{loi}</span>{!q && <button className="ht-nut-phu" onClick={() => setLan(n => n + 1)}><RefreshCw size={17} aria-hidden="true" />Thử lại</button>}</div>}
    </main>
  </div>
}
