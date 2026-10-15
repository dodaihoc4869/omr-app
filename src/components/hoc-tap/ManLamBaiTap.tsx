import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, BookOpen, Check, ChevronDown, Info, Lightbulb, PenLine, RefreshCw, X as XIcon } from 'lucide-react'
import type { TheCauProps } from '../TheCau'
import { loiGiaiChuanTuKho } from '../loi-giai/KhoiLoiGiaiChuan'
import { goiHoa2 } from '../hoa2/api'
import type { HinhAnh } from '../../data/examContent'
import type { Question } from '../../game/than-thu-v2/core'
import { docTomTatGoi7, type TomTatGoi7 } from '../../lib/goi-bai-7'
import { soOCuaCau } from '../../lib/so-o-tra-loi-ngan'
import { BanDoY, BanPhimSo, ChonDungSai, ChonTracNghiem, DeCau, HinhCuoiCau, LoiGiaiCau, OTraLoiNgan, PhanHoiDungSai, PhanHoiTraLoiNgan, PhanHoiTracNghiem, traLoiCotPhai, useBoCucLam } from './LamCau'
import { chuDanhSachCau, chuThoiGian, coChuSo, kyTuHien, nhanPhim, phimTuBanPhim, soChangXong, soHomNayGoi7, soSanhDungSai, type PhimSo, type SoHomNay } from './lam-bai'
import NutHoiThay from '../loi-giai/NutHoiThay'
import '../bang-nhiem-vu/m3-theme.css'
import '../m3/m3.css'
import './hoc-tap.css'

type Cau = Question & { vaiGoi7?:string; huongDan7?:boolean; coGoi7?:boolean; goiY?: { gach?: string[]; cotLoi?: string } }
type Ket = { choThay?:boolean; hocCoHoTro?:boolean; assisted?:boolean; correct: boolean; answer: string; solution?: unknown; omni?: { luot?: boolean }; solutionImages?: Question['hinhAnh']; chamLanTruoc?: boolean }
export function duTraLoi(phan: string, value: string): boolean { return phan === 'II' ? /^[DS]{4}$/.test(value) : phan === 'I' ? /^[ABCD]$/.test(value) : value.trim().length > 0 }
/** Props `TheCau` cho câu học (bảng Gói 7 của thầy vẫn dùng — `src/components/chien-dich/BangGoi7.tsx`). Màn làm bài của em từ 12/10 dựng phần trả lời riêng (LamCau.tsx). */
export function propsCauHoc(q: Cau, stt: number, value: string, onChange: (v: string) => void, ket?: Ket, khoa = false): TheCauProps {
  const chung = { cheDo: ket ? 'xem_lai' as const : 'thi' as const, stt, text: q.text, table: q.table, thanCauImg: q.thanCauImg, imageDataUrl: q.imageDataUrl, hinhAnh: [...q.hinhAnh, ...(ket?.solutionImages ?? [])] as HinhAnh[], ...(ket ? { loiGiai: loiGiaiChuanTuKho(ket.solution, q.phan, ket.answer), explanation: typeof ket.solution === 'string' ? ket.solution : undefined } : {}) }
  if (q.phan === 'I') return { ...chung, phan: 'I', choices: q.choices as [string, string, string, string], choiceImgs: q.choiceImgs as [string?, string?, string?, string?], choicePerm: [0, 1, 2, 3], selected: /^[ABCD]$/.test(value) ? value as 'A' | 'B' | 'C' | 'D' : null, onSelect: khoa || ket ? undefined : onChange, ...(ket ? { correct: ket.answer as 'A' | 'B' | 'C' | 'D' } : {}) }
  if (q.phan === 'II') return { ...chung, phan: 'II', ideas: q.ideas as [string, string, string, string], ideaImgs: q.ideaImgs as [string?, string?, string?, string?], selected: Array.from({ length: 4 }, (_, i) => value[i] === 'D' ? 'D' : value[i] === 'S' ? 'S' : null), onSelect: khoa || ket ? undefined : (i, v) => { const a = value.padEnd(4, '-').split(''); a[i] = v; onChange(a.join('')) }, ...(ket ? { correct: ket.answer.split('') as ['D' | 'S', 'D' | 'S', 'D' | 'S', 'D' | 'S'] } : {}) }
  return { ...chung, phan: 'III', selected: value, onChange, khoaO: khoa || !!ket, ...(ket ? { correct: ket.answer } : {}) }
}
/** Đủ điều kiện bấm "Nộp câu" ở màn luyện: `duTraLoi` + Phần III có ít nhất một chữ số (không nộp "-" hay "," trơn). */
export const nopDuoc = (phan: string, value: string) => duTraLoi(phan, value) && (phan !== 'III' || coChuSo(value))

type TT = 'dung' | 'sai' | 'ho-tro' | 'dang' | 'cho'
const CHU_TT: Record<TT, string> = { dung: 'tự làm đúng', sai: 'sai', 'ho-tro': 'có hỗ trợ', dang: 'đang làm', cho: 'chưa làm' }

/**
 * MÀN LÀM BÀI CỦA HỌC SINH — trùng tu theo bản vẽ thầy duyệt 12/10 ("tối ưu tối đa cho màn hình dọc … thật đẹp mịn mắt"; "Chốt build đẩy lên luôn đi").
 * Bố cục dọc: thanh trên 64 px (lưu-và-về · "Chặng N · Câu x/y" + vạch từng câu · "đã làm/M câu hôm nay") → nội dung → THANH ĐÁY dính đáy màn
 * (vùng ngón cái; một nút chính). Màn rộng: cùng thẻ, thanh đáy thành cột phải dính trên.
 * CUỘN: một khung cuộn duy nhất (lớp bọc của cổng học sinh); thanh trên / thanh đáy là `position: sticky` NẰM TRONG dòng chảy ⇒ chiều cao thanh
 * đáy (kể cả bàn phím số + vùng an toàn) luôn được chừa dưới nội dung, không che ý d hay nút cuối; không chiều cao cố định, không khoá cuộn,
 * không chặn chạm. Kiểm bằng vuốt thật: `scripts/kiem-vuot-lam-bai.mjs`.
 * Giữ nguyên: luồng máy chủ (`hoc-tap-start` → `answer` / `hoc-tap-gap`; đáp án chỉ về SAU khi nộp), lưu nháp localStorage, `msLam`, `assisted`, Tự chữa, Thử lại.
 */
export default function ManLamBaiTap({ token, sbd, onVe, onCapNhat, onChua, homNay }: {
  token: string; sbd: string; onVe: () => void; onCapNhat: () => void; onChua: (qid: string) => void
  /** Số "đã làm/M câu hôm nay" + chặng — cùng nguồn vòng tròn Hôm nay (`soHomNay` trong lam-bai.ts). Thiếu ⇒ ẩn ô số, tiêu đề không ghi chặng. */
  homNay?: SoHomNay | null
}) {
  const [phien, setPhien] = useState(''), [cau, setCau] = useState<Cau[]>([]), [viTri, setViTri] = useState(0)
  const [tra, setTra] = useState(''), [ket, setKet] = useState<Record<string, Ket>>({}), [tai, setTai] = useState(true), [nop, setNop] = useState(false), [loi, setLoi] = useState(''), [lan, setLan] = useState(0), [xong, setXong] = useState(false), [goiY, setGoiY] = useState(false)
  const [tuLam, setTuLam] = useState(false), [moLoiGiai, setMoLoiGiai] = useState(false), [msCau, setMsCau] = useState<Record<string, number>>({})
  const [goi7, setGoi7] = useState<TomTatGoi7 | undefined>(), [chang, setChang] = useState<number | null>(null)
  // SỐ HÔM NAY TRONG CHẶNG (khẩn 12/10 22h30 — giờ cao điểm máy chủ chậm): nhánh Gói 7 lấy (đã làm, M) từ `hoc-tap-start` lúc mở chặng rồi lệnh nhẹ
  // `hoc-tap-dem` sau mỗi câu — KHÔNG gọi lại cả sảnh (`lapGoi7` ~25 truy vấn) sau mỗi câu. Sảnh nạp lại MỘT lần khi xong chặng / rời màn.
  const [dem, setDem] = useState<{ daLam: number; muc: number } | null>(null)
  const canTaiSanh = useRef(false), soLuotDem = useRef(0), capNhatRef = useRef(onCapNhat)
  capNhatRef.current = onCapNhat
  const batDau = useRef(0), gui = useRef(false), traRef = useRef('')
  const gocRef = useRef<HTMLDivElement>(null), nutTiepRef = useRef<HTMLButtonElement>(null)
  const q = cau[viTri], k = q ? ket[q.qid] : undefined
  // 15/10 (em Lê Công: đáp án 10000 chỉ nhập được 1000): số ô của câu Trả lời ngắn do máy chủ gửi kèm (đáp số dài hơn 4 kí tự), thiếu ⇒ 4.
  const soO = soOCuaCau(q), soORef = useRef(soO)
  soORef.current = soO
  const homNayHien: SoHomNay | null | undefined = (dem && soHomNayGoi7(dem.daLam, dem.muc)) || homNay
  // Số chặng CHỐT lúc mở chặng (sau mỗi câu số hôm nay cập nhật — chặng đang làm không nhảy giữa chừng). Trạng thái suy ra NGAY khi vẽ (không đợi effect).
  if (!tai && chang === null && homNayHien?.chang) setChang(homNayHien.chang)
  const khoa = q ? `hoc-tap:nhap:${sbd}:${q.qid}:${q.version}` : ''
  useEffect(() => {
    let huy = false
    setTai(true); setLoi(''); setXong(false); setKet({}); setViTri(0); setMsCau({}); setChang(null); setDem(null); soLuotDem.current++
    void goiHoa2('hoc-tap-start', token, {}, 40).then(r => {
      if (huy) return
      if (!r.ok) throw new Error(typeof r.error === 'string' ? r.error : 'Chưa mở được chặng học.')
      const ds = Array.isArray(r.questions) ? r.questions as Cau[] : []
      if (ds.some(c => !c.qid || !['I', 'II', 'III'].includes(c.phan) || typeof c.text !== 'string' || !Array.isArray(c.hinhAnh) || c.phan === 'I' && c.choices?.length !== 4 || c.phan === 'II' && c.ideas?.length !== 4)) throw new Error('Nội dung câu chưa đầy đủ. Em cập nhật lại bài học nhé.')
      const g7 = docTomTatGoi7(r.goi7)
      setCau(ds); setPhien(typeof r.id === 'string' ? r.id : ''); setGoi7(g7)
      if (g7) setDem({ daLam: g7.daLamHomNay, muc: g7.toiThieu })
      if (!ds.length) setLoi(typeof r.message === 'string' && r.message.trim() ? r.message : 'Chưa có câu mới cho chặng này. Em về Hôm nay xem tiến độ.')
    }).catch(e => { if (!huy) setLoi(e instanceof Error ? e.message : 'Chưa tải được bài học.') }).finally(() => { if (!huy) setTai(false) })
    return () => { huy = true }
  }, [token, lan])
  useEffect(() => {
    let nhap = ''
    if (khoa) try { nhap = localStorage.getItem(khoa) || '' } catch { /* Lưu nháp không khả dụng. */ }
    setTra(nhap); traRef.current = nhap; setGoiY(false); setMoLoiGiai(false); setTuLam(!!nhap); batDau.current = Date.now()
  }, [khoa])
  // Rời màn (Về, Tự chữa…) khi đã nộp câu mà sảnh chưa nạp lại ⇒ nạp MỘT lần để Hôm nay đúng số.
  useEffect(() => () => { if (canTaiSanh.current) { canTaiSanh.current = false; capNhatRef.current() } }, [])
  /** Sau mỗi câu: Gói 7 ⇒ lệnh nhẹ `hoc-tap-dem` (chỉ đọc, 3 truy vấn); lượt trả về muộn hơn lượt mới hơn bị bỏ. Nhánh khác ⇒ nạp lại sảnh như cũ. */
  const capNhatSo = () => {
    if (!goi7) { onCapNhat(); return }
    canTaiSanh.current = true
    const luot = ++soLuotDem.current
    void goiHoa2('hoc-tap-dem', token, {}, 20).then(r => {
      if (luot !== soLuotDem.current) return
      const daLam = Number(r.daLamHomNay), muc = r.toiThieu == null ? NaN : Number(r.toiThieu)
      if (r.daLamHomNay == null || !Number.isFinite(daLam) || daLam < 0) return
      setDem(v => { const m = Number.isFinite(muc) && muc > 0 ? muc : v?.muc ?? 0; return m > 0 ? { daLam, muc: m } : v })
    }).catch(() => { /* Giữ số cũ; xong chặng / rời màn sẽ nạp lại sảnh. */ })
  }
  const doiTra = (v: string) => { setTra(v); traRef.current = v; try { localStorage.setItem(khoa, v) } catch { /* Em vẫn làm và nộp được. */ } }
  // Sang câu mới / vừa có kết quả ⇒ đưa màn về đầu (dải kết quả, đề) — em không phải tự vuốt ngược. Trình đọc màn hình: tiêu đề "Câu x/y" và dải
  // kết quả tự đọc (aria-live / role=status); có kết quả thì con trỏ bàn phím sang nút chính "Câu tiếp theo" (Enter = đi tiếp), không vẽ viền khi em chạm.
  const veDau = () => gocRef.current?.scrollIntoView?.({ block: 'start' })
  const daMo = useRef(false)
  // Thầy 13/10: em hỏi Thầy (AI gợi hướng) lúc đang làm câu ⇒ lần nộp câu đó là "có trợ giúp" (như Gợi ý).
  const daHoiThay = useRef('')
  useEffect(() => { if (!q) return; if (daMo.current) veDau(); daMo.current = true }, [q?.qid]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (k) { veDau(); nutTiepRef.current?.focus({ preventScroll: true }) } }, [!!k]) // eslint-disable-line react-hooks/exhaustive-deps
  const nopCau = async () => {
    if (!q || !phien || !duTraLoi(q.phan, tra) || gui.current || k) return
    gui.current = true; setNop(true); setLoi('')
    const msLam = Math.max(0, Date.now() - batDau.current)
    const assisted = !!q.goiY || daHoiThay.current === q.qid
    try {
      const r = await goiHoa2('answer', token, { session: phien, qid: q.qid, answer: tra, assisted, msLam }, 40)
      if (typeof r.correct !== 'boolean' || typeof r.answer !== 'string') throw new Error(typeof r.error === 'string' ? r.error : 'Chưa xác nhận được bài nộp. Em thử lại; kết quả không bị tính hai lần.')
      setMsCau(v => ({ ...v, [q.qid]: msLam }))
      // CHẤM THEO ĐÚNG ĐÁP ÁN MÁY CHỦ ĐÃ CHẤM (khẩn 12/10 23h — thầy: "hs làm đúng cả 4 ý nhưng app lại báo sai"): mỗi câu của một đợt chỉ chấm MỘT lần
      // (khoá lượt|câu). Giờ cao điểm lần nộp đầu chậm / hết 40 giây ⇒ em sửa đáp án rồi nộp lại ⇒ máy chủ trả kết quả LẦN ĐẦU (`replayed`, kèm `traLoi`
      // đã chấm) — trước đây màn so từng ý bằng đáp án đang chọn ⇒ "Đúng 4/4 ý · sai ý". Nay hiện đúng đáp án đã chấm và ghi rõ là lần nộp trước.
      const daCham = typeof r.traLoi === 'string' && duTraLoi(q.phan, r.traLoi) ? r.traLoi : tra
      if (daCham !== tra) { setTra(daCham); traRef.current = daCham }
      // Lượt đã chấm quyết định tự làm hay có hỗ trợ, kể cả nộp lại trên máy khác. Máy chủ cũ thiếu cờ thì dùng cờ đã gửi.
      const hoTro = (r.attempt as { assisted?: unknown } | undefined)?.assisted
      setKet(v => ({ ...v, [q.qid]: { ...(r as unknown as Ket), assisted: typeof hoTro === 'boolean' ? hoTro : assisted, ...(r.replayed === true && daCham !== tra ? { chamLanTruoc: true } : {}) } })); try { localStorage.removeItem(khoa) } catch { /* Không cản nhận kết quả. */ } capNhatSo()
    } catch (e) { setLoi(e instanceof Error ? e.message : 'Chưa nộp được câu. Đáp án nháp vẫn được giữ.') }
    finally { gui.current = false; setNop(false) }
  }
  const hocHuongDan = async () => {
    if(!q || !phien || gui.current || k)return
    gui.current=true;setNop(true);setLoi('')
    try {
      const r=await goiHoa2('hoc-tap-gap',token,{session:phien,qid:q.qid,chuaTuLam:true},40)
      if(r.ok!==true || !(r.choThay===true || r.hocCoHoTro===true&&typeof r.answer==='string'))throw new Error(typeof r.error==='string'?r.error:'Chưa mở được phần chữa.')
      setKet(v=>({...v,[q.qid]:r as unknown as Ket}));capNhatSo()
    } catch(e){setLoi(e instanceof Error?e.message:'Chưa tải được phần chữa.')}finally{gui.current=false;setNop(false)}
  }
  const tiep = () => { setLoi(''); if (viTri + 1 < cau.length) setViTri(i => i + 1); else { setXong(true); canTaiSanh.current = false; onCapNhat(); gocRef.current?.scrollIntoView?.({ block: 'start' }) } }

  const ttCau = (c: Cau, i: number): TT => { const r = ket[c.qid]; return r ? (r.choThay || r.hocCoHoTro || r.omni?.luot ? 'ho-tro' : r.correct ? (r.assisted ? 'ho-tro' : 'dung') : 'sai') : i === viTri && !xong ? 'dang' : 'cho' }
  const soDung = cau.filter((c, i) => ttCau(c, i) === 'dung').length
  const cauSai = cau.flatMap((c, i) => ttCau(c, i) === 'sai' ? [i + 1] : [])
  const loai = q ? (q.phan === 'I' ? 'Trắc nghiệm' : q.phan === 'II' ? 'Đúng – sai' : 'Trả lời ngắn') : ''
  // Câu Gói 7 có hướng dẫn: em CHỌN cách làm trước (Học cách giải / Tự làm câu này) — cùng điều kiện nút cũ "Chưa tự làm được · xem chữa".
  const coHuongDan = !!q && !k && (!!q.coGoi7 || q.vaiGoi7 === 'moi' || q.vaiGoi7 === 'tiep_can' || q.vaiGoi7 === 'chua')
  const choChonCach = coHuongDan && !tuLam
  const dangTraLoi = !!q && !k && !choChonCach
  const tenBai = q?.vaiGoi7 === 'moi' ? goi7?.goi.find(g => g.to.includes(q.maDe))?.ten : undefined
  // LÀN B ĐỢT 16: máy tính / điện thoại xoay ngang ⇒ đề bên trái, phần trả lời (hoặc phản hồi sau khi nộp) bên phải ngay trên nút Nộp — cùng
  // các khối, cùng state; bản dọc giữ nguyên thứ tự cũ. Chỉ đổi CHỖ ĐẶT (xem `traLoiCotPhai` trong LamCau.tsx).
  const boCuc = useBoCucLam()
  const traLoiPhai = !tai && !xong && !!q && (dangTraLoi || (!!k && !k.choThay)) && traLoiCotPhai(boCuc, q.phan) // đang tải / xong chặng: bố cục cũ

  // Gõ số trên máy tính vẫn nhập được (Trả lời ngắn) — không có ô nhập nên bàn phím điện thoại không bật.
  const laTLN = dangTraLoi && q?.phan === 'III'
  useEffect(() => {
    if (!laTLN) return
    const f = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || gui.current) return
      const t = e.target as HTMLElement | null
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return
      const p = phimTuBanPhim(e.key)
      if (!p) return
      e.preventDefault(); doiTra(nhanPhim(traRef.current, p, soORef.current))
    }
    window.addEventListener('keydown', f)
    return () => window.removeEventListener('keydown', f)
  }, [laTLN, khoa]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── chữ dải kết quả (giữ NGUYÊN câu trạng thái đặc biệt: nhờ thầy chữa, học có hỗ trợ, lượt chưa tính)
  const thoiGian = q && k && !k.choThay && !k.hocCoHoTro ? chuThoiGian(msCau[q.qid]) : ''
  const yDS = q?.phan === 'II' && k ? soSanhDungSai(tra, k.answer) : []
  const lanTruoc = k?.chamLanTruoc ? 'chấm theo đáp án em nộp lần trước' : ''
  const ketDai = !q || !k ? null
    : k.choThay ? { tt: 'ho-tro', tieu: 'Chờ phần chữa của thầy', phu: 'Em đã gặp câu này và nhờ thầy chữa. Khi có phần chữa, em sẽ được học lại; hiện chưa tính đúng hoặc đã hiểu.' }
    : k.hocCoHoTro ? { tt: 'ho-tro', tieu: 'Đã học cách giải · có hỗ trợ', phu: 'Em đã học phần chữa. Câu này được ghi là đã gặp với hỗ trợ, chưa tính tự làm đúng.' }
    : k.omni?.luot ? { tt: 'cho', tieu: 'Lượt này chưa được tính đúng hay sai.', phu: thoiGian }
    : k.correct ? { tt: k.assisted ? 'ho-tro' : 'dung', tieu: k.assisted ? q.goiY ? 'Đúng · có gợi ý' : 'Đúng · có hỗ trợ' : 'Đúng · tự làm', phu: [lanTruoc, thoiGian, k.assisted && q.goiY ? 'câu có gợi ý tính là học có hỗ trợ' : ''].filter(Boolean).join(' · ') }
    : { tt: 'sai', tieu: q.phan === 'II' ? `Đúng ${yDS.filter(y => y.dung).length}/4 ý · sai ý ${yDS.filter(y => !y.dung).map(y => y.chu).join(', ')}` : `Chưa đúng · đáp án ${k.answer}`, phu: [lanTruoc, thoiGian, 'câu này vào lịch ôn 1 · 3 · 7 ngày'].filter(Boolean).join(' · ') }
  const coTuChua = !!k && !k.correct && !k.omni?.luot && !k.hocCoHoTro && !k.choThay
  const traHien = k?.hocCoHoTro ? '' : tra // học cách giải: nháp chưa nộp KHÔNG phải câu trả lời của em
  const lg = q && k && !k.choThay ? loiGiaiChuanTuKho(k.solution, q.phan, k.answer) : undefined
  const coLyDoY = !!lg?.tungY && Object.values(lg.tungY).some(y => !!y?.viSao?.trim())

  // ── thanh trên
  const stt = viTri + 1
  const vachChu = cau.map((c, i) => { const t = ttCau(c, i); return t === 'dang' ? `đang làm câu ${i + 1}` : `câu ${i + 1} ${CHU_TT[t]}` }).join(', ')
  const tieuDe = xong ? (chang ? `Xong chặng ${chang}` : 'Xong chặng học') : q ? `${chang ? `Chặng ${chang} · ` : ''}Câu ${stt}/${cau.length}` : 'Chặng học của em'

  // ── nút chính theo loại câu
  const soYChua = q?.phan === 'II' ? [0, 1, 2, 3].filter(i => tra[i] !== 'D' && tra[i] !== 'S').length : 0
  const duocNop = !!q && nopDuoc(q.phan, tra)
  const chuNop = nop ? 'Đang nộp…' : !q ? '' : q.phan === 'II' ? (soYChua ? `Còn ${soYChua} ý chưa chọn` : 'Nộp câu')
    : q.phan === 'I' ? (duocNop ? `Nộp câu · đã chọn ${tra}` : 'Chọn một đáp án để nộp')
    : duocNop ? `Nộp câu · ${[...tra].map(kyTuHien).join('')}` : 'Nhập đáp án để nộp'
  const nutGoiY = q?.goiY && dangTraLoi ? <button type="button" className="ht2-lam-nut-goi-y" aria-label={goiY ? 'Thu gọn gợi ý' : 'Xem gợi ý'} aria-expanded={goiY} aria-controls="ht2-lam-goi-y" onClick={() => setGoiY(v => !v)}><Lightbulb size={20} aria-hidden="true" /></button> : null
  const nutNop = <button type="button" className="ht2-lam-nut ht2-lam-nut-chinh" onClick={() => void nopCau()} disabled={nop || !duocNop}>{chuNop}{duocNop && !nop && <ArrowRight size={18} aria-hidden="true" />}</button>
  const chuHocTiep = chang && homNayHien && chang < homNayHien.soChang ? `Học tiếp chặng ${chang + 1}` : 'Học tiếp chặng sau'

  const thanhDay = tai ? null
    : xong ? <div className="ht2-lam-cot-nut">
        <button type="button" className="ht2-lam-nut ht2-lam-nut-chinh" onClick={() => setLan(n => n + 1)}>{chuHocTiep}<ArrowRight size={18} aria-hidden="true" /></button>
        <button type="button" className="ht2-lam-nut ht2-lam-nut-phu" onClick={onVe}>Nghỉ và về Hôm nay</button>
      </div>
    : !q ? null
    : k ? <div className="ht2-lam-hang-nut" data-mot={!coTuChua || undefined}>
        {coTuChua && <button type="button" className="ht2-lam-nut ht2-lam-nut-phu" onClick={() => onChua(q.qid)}>Sửa câu này</button>}
        <button ref={nutTiepRef} type="button" className="ht2-lam-nut ht2-lam-nut-chinh" onClick={tiep}>{viTri + 1 === cau.length ? 'Kết thúc chặng' : 'Câu tiếp theo'}<ArrowRight size={18} aria-hidden="true" /></button>
      </div>
    : choChonCach ? <div className="ht2-lam-hang-nut">
        <button type="button" className="ht2-lam-nut ht2-lam-nut-vang" onClick={() => void hocHuongDan()} disabled={nop}>Học cách giải</button>
        <button type="button" className="ht2-lam-nut ht2-lam-nut-chinh" onClick={() => setTuLam(true)} disabled={nop}>Tự làm câu này</button>
      </div>
    : q.phan === 'II' ? <><div className="ht2-lam-hang-ban-do"><BanDoY value={tra} />{nutGoiY}</div>{nutNop}</>
    : q.phan === 'III' ? <><BanPhimSo value={tra} khoa={nop} soO={soO} onPhim={(p: PhimSo) => doiTra(nhanPhim(tra, p, soO))} /><div className="ht2-lam-hang-nop" data-goi-y={!!nutGoiY || undefined}>{nutGoiY}{nutNop}</div></>
    : <div className="ht2-lam-hang-nop" data-goi-y={!!nutGoiY || undefined}>{nutGoiY}{nutNop}</div>

  // Dải kết quả sau khi nộp: máy tính ⇒ đầu cột phải, ngay trên các phương án đã tô (điện thoại xoay ngang: giữ trên đề cho cột phải vừa một màn).
  const daiPhai = traLoiPhai && boCuc === 'rong'
  const daiKet = ketDai && <section className="ht2-lam-ket" data-tt={ketDai.tt} role="status">
    <span className="ht2-lam-ket-dau" aria-hidden="true">{ketDai.tt === 'dung' ? <Check size={22} strokeWidth={2.6} /> : ketDai.tt === 'sai' ? <XIcon size={22} strokeWidth={2.6} /> : ketDai.tt === 'cho' ? <Info size={22} /> : <BookOpen size={20} />}</span>
    <span className="ht2-lam-ket-chu"><b>{ketDai.tieu}</b>{ketDai.phu && <small>{ketDai.phu}</small>}</span>
  </section>
  // Phần trả lời (đang làm) / phản hồi (sau khi nộp) + ghi chú cách chọn — đặt dưới đề (dọc) hoặc ở cột phải cạnh nút Nộp (`traLoiPhai`).
  const khoiTraLoi = !q ? null : <>
    {dangTraLoi && (q.phan === 'II' ? <ChonDungSai q={q} value={tra} khoa={nop} onChon={(i, v) => { const a = tra.padEnd(4, '-').split(''); a[i] = v; doiTra(a.join('')) }} />
      : q.phan === 'I' ? <ChonTracNghiem q={q} value={tra} khoa={nop} onChon={doiTra} />
      : <OTraLoiNgan value={tra} soO={soO} />)}
    {k && !k.choThay && (q.phan === 'II' ? <PhanHoiDungSai q={q} tra={traHien} dapAn={k.answer} lyDo={(chu) => lg?.tungY?.[chu]?.viSao} />
      : q.phan === 'I' ? <PhanHoiTracNghiem q={q} tra={traHien} dapAn={k.answer} />
      : <PhanHoiTraLoiNgan tra={traHien} dapAn={k.answer} dung={k.correct} soO={soO} />)}
  </>
  const ghiTraLoi = !q ? null : <>
    {dangTraLoi && q.goiY && <p className="ht2-lam-ghi"><Lightbulb size={14} aria-hidden="true" />Câu có gợi ý: tính là có hỗ trợ.</p>}
  </>

  const homNayO = homNayHien ? <span className="ht2-lam-hom-nay"><b aria-hidden="true">{homNayHien.daLam}/{homNayHien.muc}</b><small aria-hidden="true">câu hôm nay</small><span className="ht2-an">Hôm nay đã làm {homNayHien.daLam} trên {homNayHien.muc} câu</span></span> : <span />

  return <div ref={gocRef} className="ht-app ht2-lam" data-xong={xong || undefined}>
    <header className="ht2-lam-tren">
      <button type="button" className="ht2-lam-nut-ve" onClick={onVe} disabled={nop} aria-label={xong ? 'Về Hôm nay' : 'Lưu và về Hôm nay'}><ArrowLeft size={20} aria-hidden="true" /></button>
      <div className="ht2-lam-giua">
        <h1 className="ht2-lam-tieu" aria-live="polite">{tieuDe}</h1>
        {cau.length > 0 && !xong && <div className="ht2-lam-vach" role="img" aria-label={vachChu} style={{ gridTemplateColumns: `repeat(${cau.length}, minmax(0, 1fr))` }}>{cau.map((c, i) => <i key={c.qid} data-tt={ttCau(c, i)} />)}</div>}
      </div>
      {homNayO}
    </header>
    <div className="ht2-lam-khung" data-tra-loi={traLoiPhai ? q.phan : undefined} data-ket={traLoiPhai && k ? '' : undefined}>
      <main className="ht2-lam-than">
        {tai ? <div className="ht2-lam-the ht2-lam-cho" role="status">Đang chuẩn bị những câu phù hợp với em…</div>
        : xong ? <>
          <section className="ht2-lam-the ht2-lam-xong" aria-label="Kết quả chặng">
            <span className="ht2-lam-xong-dau" aria-hidden="true"><Check size={30} strokeWidth={2.4} /></span>
            <h2 className="ht2-lam-xong-tieu">{chang ? `Đã lưu chặng ${chang}` : 'Đã lưu chặng học'}</h2>
            <p className="ht2-lam-xong-so"><b>{soDung}</b>/{cau.length} câu tự làm đúng</p>
            <div className="ht2-lam-xong-cau" role="img" aria-label={cau.map((c, i) => `Câu ${i + 1} ${CHU_TT[ttCau(c, i)]}`).join(', ')}>{cau.map((c, i) => <span key={c.qid} data-tt={ttCau(c, i)}>{i + 1}</span>)}</div>
            {cauSai.length > 0 && <p className="ht2-lam-phu">{chuDanhSachCau(cauSai)} đã vào lịch ôn 1 · 3 · 7 ngày.</p>}
          </section>
          {homNayHien && <section className="ht2-lam-the ht2-lam-hom-nay-the" aria-label="Hôm nay">
            <div className="ht2-lam-hom-nay-dau"><b>Hôm nay {homNayHien.daLam}/{homNayHien.muc} câu</b><span>{homNayHien.daLam >= homNayHien.muc ? 'đã đủ mức hôm nay' : `còn ${homNayHien.muc - homNayHien.daLam} câu · ${homNayHien.soChang - soChangXong(homNayHien)} chặng`}</span></div>
            {homNayHien.soChang > 0 && <div className="ht2-lam-chang" role="img" aria-label={`Xong ${soChangXong(homNayHien)} trên ${homNayHien.soChang} chặng`} style={{ gridTemplateColumns: `repeat(${homNayHien.soChang}, minmax(0, 1fr))` }}>{Array.from({ length: homNayHien.soChang }, (_, i) => <i key={i} data-xong={i < soChangXong(homNayHien) || undefined} />)}</div>}
          </section>}
        </>
        : q ? <>
          {!daiPhai && daiKet}
          {!k && <div className="ht2-lam-nhan">
            <span className="ht2-lam-chip">{loai}</span>
            {q.vaiGoi7 === 'moi' ? <span className="ht2-lam-chip" data-sac="vang">{tenBai ? `Câu mới · ${tenBai}` : 'Câu mới'}</span>
              : q.tenDang ? <span className="ht2-lam-dang" title={q.tenDang}>{q.tenDang}</span> : null}
          </div>}
          <DeCau q={q} stt={stt} />
          {q.goiY && goiY && dangTraLoi && <section id="ht2-lam-goi-y" className="ht2-lam-goi-y" aria-label="Gợi ý"><b><Lightbulb size={18} aria-hidden="true" />Gợi ý</b><p>{q.goiY.cotLoi || (q.goiY.gach?.length ? `Có thể loại phương án ${q.goiY.gach.join(', ')}.` : 'Đọc lại kiến thức cốt lõi của bài.')}</p></section>}
          {choChonCach && <section className="ht2-lam-the ht2-lam-chon-cach" aria-label="Chọn cách làm">
            <h2 className="ht2-lam-chon-tieu">Câu này em chọn làm thế nào?</h2>
            <div className="ht2-lam-chon-dong"><span aria-hidden="true"><PenLine size={20} /></span><p><b>Tự làm:</b> tính là câu tự làm.</p></div>
            <div className="ht2-lam-chon-dong" data-sac="vang"><span aria-hidden="true"><BookOpen size={20} /></span><p><b>Học cách giải:</b> {q.vaiGoi7 === 'chua' ? 'xem phần thầy chữa' : 'xem lời giải từng bước'}, tính là có hỗ trợ.</p></div>
          </section>}
          {!traLoiPhai && khoiTraLoi}
          {(dangTraLoi || k) && <HinhCuoiCau q={q} stt={stt} />}
          {k && !k.choThay && (q.phan !== 'II' || moLoiGiai
            ? <LoiGiaiCau q={q} solution={k.solution} dapAn={k.answer} hinhLoiGiai={k.solutionImages} />
            : <button type="button" className="ht2-lam-nut ht2-lam-nut-mo" aria-expanded={false} onClick={() => setMoLoiGiai(true)}><ChevronDown size={18} aria-hidden="true" />{coLyDoY ? 'Xem lời giải đầy đủ cả 4 ý' : 'Xem lời giải đầy đủ'}</button>)}
          {/* Thầy 13/10 "nút hỏi bài ở tất cả các câu… hỏi bài thầy mọi lúc": đang làm ⇒ Hỏi thầy (gợi hướng, không đáp án); có kết quả ⇒ thêm Lời giải từng bước. */}
          {dangTraLoi && <NutHoiThay gon dangLam qid={q.qid} nguon="bai_hang_ngay" onHoi={() => { daHoiThay.current = q.qid }} />}
          {k && !k.choThay && <NutHoiThay gon qid={q.qid} nguon="bai_hang_ngay" />}
          {dangTraLoi && coHuongDan && <button type="button" className="ht2-lam-nut ht2-lam-nut-mo" onClick={() => void hocHuongDan()} disabled={nop}><BookOpen size={18} aria-hidden="true" />Chưa làm được? Học cách giải</button>}
          {!traLoiPhai && ghiTraLoi}
        </> : null}
        {loi && !q && <div className="ht2-lam-loi" role="alert"><span>{loi}</span><button type="button" className="ht2-lam-nut ht2-lam-nut-phu" onClick={() => setLan(n => n + 1)}><RefreshCw size={17} aria-hidden="true" />Thử lại</button></div>}
      </main>
      {thanhDay && <div className="ht2-lam-day" role="region" aria-label="Thao tác câu" data-tra-loi={traLoiPhai ? q.phan : undefined}>
        {traLoiPhai && <div className="ht2-lam-cot-tra-loi">{daiPhai && daiKet}{khoiTraLoi}{ghiTraLoi}</div>}
        {loi && q && <p className="ht2-lam-loi" role="alert">{loi}</p>}
        {thanhDay}
      </div>}
    </div>
  </div>
}
