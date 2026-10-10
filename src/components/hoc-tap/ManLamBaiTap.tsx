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

type Cau = Question & { goiY?: { gach?: string[]; cotLoi?: string } }
type Ket = { correct: boolean; answer: string; solution?: unknown; omni?: { luot?: boolean }; solutionImages?: Question['hinhAnh'] }
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
  const tiep = () => { setLoi(''); if (viTri + 1 < cau.length) setViTri(i => i + 1); else { setXong(true); onCapNhat() } }
  return <div className="ht-app ht-lam m3"><header className="ht-thanh"><button className="ht-nut-phu" onClick={onVe} disabled={nop}><ArrowLeft size={18} aria-hidden="true" />Hôm nay</button><strong>Đợt học của em</strong><span>{q && !xong ? `${viTri + 1}/${cau.length} câu` : ''}</span></header>
    <main className="ht-phien">
      {tai ? <div className="ht-the ht-trong" role="status">Đang chuẩn bị những câu phù hợp với em…</div> : xong ? <section className="ht-the ht-hoan-thanh"><Check size={38} aria-hidden="true" /><p className="ht-nhan">ĐỢT HỌC ĐÃ ĐƯỢC LƯU</p><h1>Em đã hoàn thành đợt này</h1><p>{Object.keys(ket).length} câu đã nhận phản hồi. Tiến độ hôm nay được cập nhật theo từng loại nhiệm vụ.</p><p className="ht-chu-phu">Câu tự làm, câu có hỗ trợ và kiến thức đã vững được theo dõi riêng.</p><button className="ht-nut-chinh" onClick={() => setLan(n => n + 1)}>Mở đợt tiếp theo<ArrowRight size={18} aria-hidden="true" /></button><button className="ht-nut-phu" onClick={onVe}>Nghỉ và về Hôm nay</button></section> : q ? <div className="ht-vung-lam">
        <section className="ht-de"><p className="ht-nhan">{q.phan === 'I' ? 'TRẮC NGHIỆM' : q.phan === 'II' ? 'ĐÚNG – SAI' : 'TRẢ LỜI NGẮN'}{q.tenDang ? ` · ${q.tenDang}` : ''}</p><TheCau {...propsCauHoc(q, viTri + 1, tra, doiTra, k, nop)} /></section>
        <aside className="ht-dieu-khien"><section className="ht-the"><h2>Một câu, một bước tiến</h2><div className="ht-dot">{cau.map((c, i) => <span key={c.qid} data-xong={!!ket[c.qid]} aria-current={i === viTri ? 'step' : undefined}>{ket[c.qid] ? <Check size={15} aria-label="Đã nhận phản hồi" /> : i + 1}</span>)}</div><p className="ht-chu-phu">Đọc kỹ dữ kiện. Em có thể nghỉ sau đợt học.</p>
          {q.goiY && !k && <><button className="ht-nut-phu" onClick={() => setGoiY(v => !v)}><Lightbulb size={18} aria-hidden="true" />{goiY ? 'Thu gọn gợi ý' : 'Xem gợi ý'}</button><p className="ht-chu-phu">Câu này được giao ở chế độ có hỗ trợ.</p>{goiY && <div className="ht-thong-bao">{q.goiY.cotLoi || (q.goiY.gach?.length ? `Có thể loại phương án ${q.goiY.gach.join(', ')}.` : 'Đọc lại kiến thức cốt lõi của bài.')}</div>}</>}
          {k ? <><p className="ht-phan-hoi" role="status">{k.omni?.luot ? 'Lượt này chưa được tính là bằng chứng đúng/sai.' : k.correct ? 'Em đã trả lời đúng.' : 'Em xem lời giải để hiểu chỗ còn mắc.'}</p><button className="ht-nut-chinh" onClick={tiep}>{viTri + 1 === cau.length ? 'Kết thúc đợt' : 'Câu tiếp theo'}<ArrowRight size={18} aria-hidden="true" /></button>{!k.correct && !k.omni?.luot && <button className="ht-nut-phu" onClick={() => onChua(q.qid)}>Tự chữa câu này</button>}</> : <button className="ht-nut-chinh" onClick={() => void nopCau()} disabled={nop || !duTraLoi(q.phan, tra)}>{nop ? 'Đang nộp…' : 'Nộp câu trả lời'}<ArrowRight size={18} aria-hidden="true" /></button>}
        </section></aside>
      </div> : null}
      {loi && <div className="ht-thong-bao" role="alert">{loi}{!q && <button className="ht-nut-phu" onClick={() => setLan(n => n + 1)}><RefreshCw size={17} aria-hidden="true" />Thử lại</button>}</div>}
    </main>
  </div>
}
