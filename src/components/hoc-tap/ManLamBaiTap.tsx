import { lazy, Suspense, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { ArrowLeft, ArrowRight, BookOpen, Check, ChevronDown, Clock, Flame, Info, Lightbulb, PenLine, RefreshCw, Target, X as XIcon } from 'lucide-react'
import { ChemText } from '../../lib/chem-format'
import type { TheCauProps } from '../TheCau'
import { loiGiaiChuanTuKho } from '../loi-giai/KhoiLoiGiaiChuan'
import { goiHoa2, guiLaiKhiKetMang } from '../hoa2/api'
import { GIAY_CHO_MO_CHANG, layChangMoTruoc, moChangTruoc } from './mo-chang-truoc'
// Hôm nay nạp ĐỘNG đúng mảnh này để mở chặng trước (không sinh thêm tệp nạp / precache; mảnh màn làm bài được nạp sẵn luôn).
export { moChangTruoc } from './mo-chang-truoc'
import type { HinhAnh } from '../../data/examContent'
import type { Question } from '../../game/than-thu-v2/core'
import { docTomTatGoi7, type TomTatGoi7 } from '../../lib/goi-bai-7'
import { soOCuaCau } from '../../lib/so-o-tra-loi-ngan'
import { BanDoY, BanPhimSo, ChonDungSai, ChonTracNghiem, DeCau, HinhCuoiCau, LoiGiaiCau, OTraLoiNgan, PhanHoiDungSai, PhanHoiTraLoiNgan, PhanHoiTracNghiem, traLoiCotPhai, useBoCucLam } from './LamCau'
import { chuDanhSachCau, chuDS, chuThoiGian, coChuSo, cuonDeThayO, kyTuHien, nhanPhim, phimTuBanPhim, soChangXong, soHomNayGoi7, soSanhDungSai, type PhimSo, type SoHomNay } from './lam-bai'
import NutHoiThay from '../loi-giai/NutHoiThay'
import { phanHoi } from '../../lib/phan-hoi'
import { Bi } from '../linh-vat/Bi'
import { banHat, truotRa, useDemSo, yenLang } from '../../lib/hieu-ung'
import { VungChamDe } from '../goi-y-cham/VungChamDe'
// Lời giải kiểu sơ đồ (hợp đồng chạm để hiểu đề, chỗ 3): chỉ cần khi em mở «Lời giải từng bước» ⇒ nạp LƯỜI, lúc chờ vẽ lời giải cũ (không chớp trống).
const LoiGiaiCauCoSoDo = lazy(() => import('../goi-y-cham/LoiGiaiCauCoSoDo'))
import { createPortal } from 'react-dom'
import '../bang-nhiem-vu/m3-theme.css'
import '../m3/m3.css'
import './hoc-tap.css'
// «Trong» 26/10 (nhóm 2): tờ trình bày styles/trong-lam-bai.css nạp RIÊNG, chỉ khi <html data-trong> (main.tsx gắn trước khi nạp màn) — không cộng byte lượt mở app.
if (typeof document !== 'undefined' && document.documentElement.dataset.trong) void import('../../styles/trong-lam-bai.css').catch(() => {})

type Cau = Question & { vaiGoi7?:string; huongDan7?:boolean; coGoi7?:boolean; goiY?: { gach?: string[]; cotLoi?: string }; lamLaiCua?: string }
/** Câu không đủ nội dung để hiện (cùng luật lúc mở chặng và lúc nhận vòng làm lại). */
const cauHong = (c: Cau) => !c.qid || !['I', 'II', 'III'].includes(c.phan) || typeof c.text !== 'string' || !Array.isArray(c.hinhAnh) || c.phan === 'I' && c.choices?.length !== 4 || c.phan === 'II' && c.ideas?.length !== 4
type Ket = { soDo?: unknown; choThay?:boolean; hocCoHoTro?:boolean; assisted?:boolean; correct: boolean; answer: string; solution?: unknown; omni?: { luot?: boolean }; solutionImages?: Question['hinhAnh']; chamLanTruoc?: boolean }
export function duTraLoi(phan: string, value: string): boolean { return phan === 'II' ? /^[DS]{4}$/.test(value) : phan === 'I' ? /^[ABCD]$/.test(value) : value.trim().length > 0 }
/** Props `TheCau` cho câu học (bảng Gói 7 của thầy vẫn dùng — `src/components/chien-dich/BangGoi7.tsx`). Màn làm bài của em từ 12/10 dựng phần trả lời riêng (LamCau.tsx). */
export function propsCauHoc(q: Cau, stt: number, value: string, onChange: (v: string) => void, ket?: Ket, khoa = false): TheCauProps {
  const chung = { cheDo: ket ? 'xem_lai' as const : 'thi' as const, stt, text: q.text, table: q.table, thanCauImg: q.thanCauImg, imageDataUrl: q.imageDataUrl, hinhAnh: [...q.hinhAnh, ...(ket?.solutionImages ?? [])] as HinhAnh[], ...(ket ? { loiGiai: loiGiaiChuanTuKho(ket.solution, q.phan, ket.answer), explanation: typeof ket.solution === 'string' ? ket.solution : undefined } : {}) }
  if (q.phan === 'I') return { ...chung, phan: 'I', choices: q.choices as [string, string, string, string], choiceImgs: q.choiceImgs as [string?, string?, string?, string?], choicePerm: [0, 1, 2, 3], selected: /^[ABCD]$/.test(value) ? value as 'A' | 'B' | 'C' | 'D' : null, onSelect: khoa || ket ? undefined : onChange, ...(ket ? { correct: ket.answer as 'A' | 'B' | 'C' | 'D' } : {}) }
  if (q.phan === 'II') return { ...chung, phan: 'II', ideas: q.ideas as [string, string, string, string], ideaImgs: q.ideaImgs as [string?, string?, string?, string?], selected: Array.from({ length: 4 }, (_, i) => value[i] === 'D' ? 'D' : value[i] === 'S' ? 'S' : null), onSelect: khoa || ket ? undefined : (i, v) => { const a = value.padEnd(4, '-').split(''); a[i] = v; onChange(a.join('')) }, ...(ket ? { correct: ket.answer.split('') as ['D' | 'S', 'D' | 'S', 'D' | 'S', 'D' | 'S'] } : {}) }
  return { ...chung, phan: 'III', soO: (q as { soO?: number }).soO, selected: value, onChange, khoaO: khoa || !!ket, ...(ket ? { correct: ket.answer } : {}) }
}
/** Đủ điều kiện bấm "Nộp câu" ở màn luyện: `duTraLoi` + Phần III có ít nhất một chữ số (không nộp "-" hay "," trơn). */
export const nopDuoc = (phan: string, value: string) => duTraLoi(phan, value) && (phan !== 'III' || coChuSo(value))

/** Khung cuộn gần nhất chứa màn (cổng học sinh: lớp bọc `fixed inset-0 overflow-y-auto`); không có ⇒ null (cuộn cả trang). */
function khungCuonCua(el: HTMLElement): HTMLElement | null {
  for (let p: HTMLElement | null = el; p; p = p.parentElement) {
    if (/(auto|scroll|overlay)/.test(getComputedStyle(p).overflowY) && p.scrollHeight > p.clientHeight) return p
  }
  return null
}

type TT = 'dung' | 'sai' | 'ho-tro' | 'dang' | 'cho'
const CHU_TT: Record<TT, string> = { dung: 'tự làm đúng', sai: 'sai', 'ho-tro': 'có hỗ trợ', dang: 'đang làm', cho: 'chưa làm' }

/** A6 — PHẢN ỨNG DÂY CHUYỀN: băng nhỏ trượt xuống dưới thanh trên; phân tử có n nguyên tử (mọc thêm một nguyên tử mỗi câu đúng liền, tối đa 10).
 *  Từ 5 câu: «Phản ứng dây chuyền!». Không chặn bấm (pointer-events: none), nằm đè (absolute) ⇒ không xô bố cục. */
function BangCombo({ n }: { n: number }) {
  const so = Math.min(10, Math.max(3, n)), w = 16 + (so - 1) * 15
  return <div className="duo-combo" role="status">
    <svg className="duo-phan-tu" viewBox={`0 0 ${w} 30`} width={w} height={30} aria-hidden="true">
      {Array.from({ length: so - 1 }, (_, i) => <line key={i} x1={8 + i * 15} y1={i % 2 ? 21 : 9} x2={8 + (i + 1) * 15} y2={i % 2 ? 9 : 21} />)}
      {Array.from({ length: so }, (_, i) => <circle key={i} cx={8 + i * 15} cy={i % 2 ? 21 : 9} r={i === so - 1 ? 6.5 : 5.5} data-moi={i === so - 1 || undefined} data-sac={i % 3} />)}
    </svg>
    <b>{n >= 5 ? 'Phản ứng dây chuyền!' : `${n} câu đúng liền!`}</b>
  </div>
}

/** B1 — một thẻ số kết chặng: bật lên (trễ theo `i` × 120 ms), số đếm tăng từ 0. `dinh` đổi số đếm ra chữ (vd. giây ⇒ «m:ss»). */
function TheSo({ i, sac, ten, Icon, den, dinh }: { i: number; sac: string; ten: string; Icon: typeof Target; den: number; dinh: (v: number) => string }) {
  const v = useDemSo(den, 800, 200 + i * 120)
  return <div data-sac={sac} style={{ '--i': i } as CSSProperties}><p>{ten}</p><b><Icon size={20} aria-hidden="true" /><span aria-hidden="true">{dinh(v)}</span><span className="ht2-an">{dinh(den)}</span></b></div>
}

/** B4 — VÒNG MỤC TIÊU NGÀY: số chặng đã xong / số chặng kế hoạch hôm nay; tô dần từ trước chặng này tới bây giờ (600 ms). Đầy ⇒ nổ hạt + «Đạt mục tiêu!». */
function VongMucTieu({ xong, tong }: { xong: number; tong: number }) {
  const dat = tong > 0 && xong >= tong
  const truoc = Math.max(0, Math.min(tong, xong - 1)) / tong, sau = Math.min(1, xong / tong)
  const [v, setV] = useState(() => (yenLang() ? sau : truoc)), [hien, setHien] = useState(() => dat && yenLang())
  const vong = useRef<SVGSVGElement>(null)
  useEffect(() => {
    if (yenLang()) { setV(sau); setHien(dat); return }
    const a = requestAnimationFrame(() => requestAnimationFrame(() => setV(sau)))
    const b = dat ? window.setTimeout(() => { setHien(true); banHat(vong.current, { so: 16, xa: 70, ms: 600 }) }, 900) : 0
    return () => { cancelAnimationFrame(a); window.clearTimeout(b) }
  }, [sau, dat])
  const C = 2 * Math.PI * 26
  return <div className="duo-muc" role="img" aria-label={`Xong ${xong} trên ${tong} chặng hôm nay${dat ? ', đạt mục tiêu' : ''}`}>
    <svg ref={vong} viewBox="0 0 64 64" width="64" height="64" aria-hidden="true"><circle className="nen" cx="32" cy="32" r="26" /><circle className="chay" cx="32" cy="32" r="26" strokeDasharray={C} strokeDashoffset={C * (1 - v)} /></svg>
    <div aria-hidden="true"><b>{xong}/{tong} chặng</b><span>{hien ? <em>Đạt mục tiêu!</em> : 'Mục tiêu hôm nay'}</span></div>
  </div>
}

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
  // «Làm chặng kiểu Duolingo» (thầy chốt bản vẽ docs/ban-ve-duo-2610, 26/10): CHỈ khi <html data-trong> — cùng state, cùng lệnh, cùng luồng chấm/lưu/đo giây;
  // chỉ dựng cây trình bày khác (nhánh `if (duo)` cuối hàm). Tắt «Trong» ⇒ màn y cũ.
  const [duo] = useState(() => typeof document !== 'undefined' && !!document.documentElement.dataset.trong)
  // LÀM LẠI CUỐI CHẶNG kiểu Duolingo (hợp đồng docs/hop-dong-duolingo-2610.md mục 3; máy chủ goi-bai-7-lam-lai.ts): `soGoc` = số câu của chặng; câu làm lại
  // (≤ 3, chỉ đề) nối sau, mỗi chặng xin MỘT lần (`hoc-tap-lam-lai`), nộp qua `answer` cùng phiên (máy chủ tự ép có hỗ trợ). Không đếm vào số câu của chặng.
  const [soGoc, setSoGoc] = useState(0), daXinLamLai = useRef(false)
  // A6 — băng combo «N câu đúng liền!» / «Phản ứng dây chuyền!» (n = số câu đúng liền lúc hiện, id = câu vừa đúng ⇒ hoạt ảnh chạy lại mỗi câu).
  const [combo, setCombo] = useState<{ n: number; id: string } | null>(null)
  // SỐ HÔM NAY TRONG CHẶNG (khẩn 12/10 22h30 — giờ cao điểm máy chủ chậm): nhánh Gói 7 lấy (đã làm, M) từ `hoc-tap-start` lúc mở chặng rồi lệnh nhẹ
  // `hoc-tap-dem` sau mỗi câu — KHÔNG gọi lại cả sảnh (`lapGoi7` ~25 truy vấn) sau mỗi câu. Sảnh nạp lại MỘT lần khi xong chặng / rời màn.
  const [dem, setDem] = useState<{ daLam: number; muc: number } | null>(null)
  const canTaiSanh = useRef(false), soLuotDem = useRef(0), capNhatRef = useRef(onCapNhat)
  capNhatRef.current = onCapNhat
  const batDau = useRef(0), gui = useRef(false), traRef = useRef('')
  const gocRef = useRef<HTMLDivElement>(null), nutTiepRef = useRef<HTMLButtonElement>(null)
  const q = cau[viTri], k = q ? ket[q.qid] : undefined
  // 20/10 đo giây (thầy: mọi câu đều đo được): giây câu đang hiện, CHỈ cộng khi tab đang hiện và em còn chạm màn trong 180 giây; trần 900; gửi cùng lượt nộp
  // (`doGiay: {g}`; số từ/hình/phần do máy chủ tự đo). `msLam` cũ giữ nguyên cho OMNI. Viết nội tuyến (không tệp chung): thêm một tệp dùng chung làm tăng
  // tải mở cả ba app (cổng `kiem:toc-do`) hoặc thêm một chunk (cổng `kiem-sw` đang 170/170). Cùng định nghĩa với màn ôn lại (LamCauOn).
  // 22/10 ĐO TREO MÁY (thầy: thêm Mức làm 5 "Treo máy", 6 "Cố tình treo máy"; docs/dac-ta-muc-lam-6-muc-2210.md mục 3): `g` GIỮ NGUYÊN; thêm v (giây câu mở khi tab
  // hiện, không cắt 180) · a (giây câu mở khi tab ẩn / tắt màn) · l (khoảng lặng dài nhất giữa hai lần chạm, khi tab hiện) · n (số khoảng lặng 120–179 giây) ·
  // w (1 = xin được giữ màn sáng: màn ẩn lúc ấy là em tự rời app/tắt màn, không phải màn tự tắt). Gửi cùng cụm `doGiay`.
  const dhMs = useRef(0), dhCham = useRef(Date.now())
  const dhT = useRef({ v: 0, a: 0, l: 0, n: 0, lang: 0 }), dhW = useRef(false)
  useEffect(() => { dhMs.current = 0; dhCham.current = Date.now(); dhT.current = { v: 0, a: 0, l: 0, n: 0, lang: 0 } }, [q?.qid])
  useEffect(() => {
    const id = window.setInterval(() => {
      const t = dhT.current
      if (document.visibilityState !== 'visible') return // `a` tính theo MỐC lúc ẩn → lúc hiện (trình duyệt hãm/đóng băng nhịp ở tab ẩn: đếm nhịp sẽ hụt)
      t.v = Math.min(7200, t.v + 1); t.lang++
      if (Date.now() - dhCham.current <= 180_000) dhMs.current = Math.min(900_000, dhMs.current + 1000)
      if (khoaMan && Date.now() - dhCham.current > 600_000) { void khoaMan.release().catch(() => {}); khoaMan = null } // 10 phút không chạm ⇒ nhả giữ màn sáng (máy bỏ quên không sáng mãi)
    }, 1000)
    const cham = () => {
      const t = dhT.current
      if (t.lang >= 120 && t.lang < 180) t.n++
      t.l = Math.max(t.l, t.lang); t.lang = 0
      dhCham.current = Date.now()
      if (!khoaMan) xin() // chạm lại sau khi đã nhả ⇒ giữ màn sáng lại
    }
    const ev = ['pointerdown', 'keydown', 'input', 'touchstart', 'wheel']
    for (const e of ev) window.addEventListener(e, cham, { passive: true, capture: true })
    // Giữ màn sáng khi đang làm câu (tự nhả khi rời màn; trình duyệt tự nhả khi tab ẩn ⇒ xin lại khi hiện lại). Không hỗ trợ / bị từ chối ⇒ w = 0, không báo lỗi.
    type Khoa = { release: () => Promise<void> }
    const wl = (navigator as Navigator & { wakeLock?: { request: (t: 'screen') => Promise<Khoa> } }).wakeLock
    let khoaMan: Khoa | null = null, het = false, dangXin = false
    const xin = () => {
      if (!wl || het || khoaMan || dangXin || document.visibilityState !== 'visible') return
      dangXin = true
      wl.request('screen').then((k) => { dangXin = false; if (het) void k.release().catch(() => {}); else { khoaMan = k; dhW.current = true } }, () => { dangXin = false; dhW.current = false })
    }
    let anTu = document.visibilityState === 'visible' ? 0 : Date.now()
    const doiHien = () => {
      if (document.visibilityState === 'visible') {
        if (anTu) { const t = dhT.current; t.a = Math.min(7200, t.a + Math.round((Date.now() - anTu) / 1000)); anTu = 0 }
        xin()
      } else { if (!anTu) anTu = Date.now(); khoaMan = null /* trình duyệt tự nhả khi ẩn */ }
    }
    xin()
    document.addEventListener('visibilitychange', doiHien)
    return () => {
      het = true
      window.clearInterval(id)
      for (const e of ev) window.removeEventListener(e, cham, { capture: true })
      document.removeEventListener('visibilitychange', doiHien)
      void khoaMan?.release().catch(() => {})
    }
  }, [])
  // 15/10 (em Lê Công: đáp án 10000 chỉ nhập được 1000; thầy: "hiển thị đúng số ô cần điền"): số ô của câu Trả lời ngắn = đúng số kí tự đáp số, máy
  // chủ gửi kèm; thiếu ⇒ 4.
  const soO = soOCuaCau(q), soORef = useRef(soO)
  soORef.current = soO
  const homNayHien: SoHomNay | null | undefined = (dem && soHomNayGoi7(dem.daLam, dem.muc)) || homNay
  // Số chặng CHỐT lúc mở chặng (sau mỗi câu số hôm nay cập nhật — chặng đang làm không nhảy giữa chừng). Trạng thái suy ra NGAY khi vẽ (không đợi effect).
  if (!tai && chang === null && homNayHien?.chang) setChang(homNayHien.chang)
  const khoa = q ? `hoc-tap:nhap:${sbd}:${q.qid}:${q.version}` : ''
  useEffect(() => {
    let huy = false
    setTai(true); setLoi(''); setCau([]); setPhien(''); setXong(false); setKet({}); setViTri(0); setMsCau({}); setChang(null); setDem(null); setSoGoc(0); setCombo(null); daXinLamLai.current = false; soLuotDem.current++
    // Mở chặng trước (mo-chang-truoc.ts): Hôm nay / màn xong chặng đã gọi sẵn ⇒ dùng lại đúng lượt ấy, câu hiện ngay; không có ⇒ gọi như cũ.
    void (layChangMoTruoc(token) ?? goiHoa2('hoc-tap-start', token, {}, GIAY_CHO_MO_CHANG)).then(r => {
      if (huy) return
      if (!r.ok) throw new Error(typeof r.error === 'string' ? r.error : 'Chưa mở được chặng học.')
      const ds = Array.isArray(r.questions) ? r.questions as Cau[] : []
      if (ds.some(cauHong)) throw new Error('Nội dung câu chưa đầy đủ. Em cập nhật lại bài học nhé.')
      const g7 = docTomTatGoi7(r.goi7)
      setCau(ds); setSoGoc(ds.length); setPhien(typeof r.id === 'string' ? r.id : ''); setGoi7(g7)
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
  const doiTra = (v: string) => { phanHoi('chon'); setTra(v); traRef.current = v; try { localStorage.setItem(khoa, v) } catch { /* Em vẫn làm và nộp được. */ } }
  // Sang câu mới / vừa có kết quả ⇒ đưa màn về đầu (dải kết quả, đề) — em không phải tự vuốt ngược. Trình đọc màn hình: tiêu đề "Câu x/y" và dải
  // kết quả tự đọc (aria-live / role=status); có kết quả thì con trỏ bàn phím sang nút chính "Câu tiếp theo" (Enter = đi tiếp), không vẽ viền khi em chạm.
  const veDau = () => gocRef.current?.scrollIntoView?.({ block: 'start' })
  // Trả lời ngắn (15/10, việc văn phòng a254c6118c6b): màn nhỏ, câu dài ⇒ thanh đáy (bàn phím số) che hàng ô. Em BẤM PHÍM (phím số của app hoặc phím
  // máy tính) mà hàng ô còn dưới thanh ⇒ cuộn khung cuộn vừa đủ để hàng ô nằm trên thanh 12 px (`cuonDeThayO`). Lúc mở câu không cuộn (em đọc đề
  // trước). Màn rộng: hàng ô nằm trong cột phải (không ở thân) hoặc thanh không chồng ngang ⇒ không cuộn.
  const keoOVaoTam = () => {
    const goc = gocRef.current
    const hang = goc?.querySelector('.ht2-lam-than .ht2-lam-o-hang'), thanh = goc?.querySelector('.ht2-lam-day')
    if (!goc || !hang || !thanh) return
    const top = cuonDeThayO(hang.getBoundingClientRect(), thanh.getBoundingClientRect())
    if (top <= 0) return
    const behavior: ScrollBehavior = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
    const khung = khungCuonCua(goc)
    if (khung) khung.scrollBy({ top, behavior }); else window.scrollBy({ top, behavior })
  }
  const daMo = useRef(false)
  // Thầy 13/10: em hỏi Thầy (AI gợi hướng) lúc đang làm câu ⇒ lần nộp câu đó là "có trợ giúp" (như Gợi ý).
  const daHoiThay = useRef('')
  // «Chạm để hiểu đề» (src/components/goi-y-cham, hợp đồng docs/hop-dong-doc-de-2610.md): em mở «Bắt đầu từ đâu?» của câu này ⇒ lượt nộp có hỗ trợ
  // (như Gợi ý, Hỏi thầy). Ruột tự vẽ thẻ giải nghĩa / gợi ý (TamGiaiThich); màn chỉ chừa chỗ đặt nút ở hàng nút đáy (`oNutCham`).
  const hoTroCham = useRef('')
  const [oNutCham, setONutCham] = useState<HTMLElement | null>(null)
  useEffect(() => { if (!q) return; if (daMo.current) veDau(); daMo.current = true }, [q?.qid]) // eslint-disable-line react-hooks/exhaustive-deps
  // Màn Duo ở khung thấp xoay ngang: tấm kết quả nằm ở cột phải DƯỚI phương án ⇒ đưa tấm (nút «Tiếp tục») vào khung nhìn thay vì cuộn về đầu.
  useEffect(() => {
    if (!k) return
    const ngangThap = duo && !!window.matchMedia?.('(orientation: landscape) and (max-height: 500px)').matches
    if (ngangThap) nutTiepRef.current?.scrollIntoView?.({ block: 'nearest' }); else veDau()
    nutTiepRef.current?.focus({ preventScroll: true })
  }, [!!k]) // eslint-disable-line react-hooks/exhaustive-deps
  // Rung phản hồi kiểu Duolingo (thầy 26/10) — chỉ app học sinh «Trong» (phan-hoi.ts tự kiểm): tấm kết quả đúng / sai, hết chặng.
  useEffect(() => { if (k && !k.choThay && !k.hocCoHoTro && !k.omni?.luot) phanHoi(k.correct ? 'dung' : 'sai') }, [!!k]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (xong) phanHoi('xong') }, [xong])
  const nopCau = async () => {
    if (!q || !phien || !duTraLoi(q.phan, tra) || gui.current || k) return
    gui.current = true; setNop(true); setLoi('')
    const msLam = Math.max(0, Date.now() - batDau.current)
    const assisted = !!q.goiY || daHoiThay.current === q.qid || hoTroCham.current === q.qid
    try {
      const r = await guiLaiKhiKetMang(() => goiHoa2('answer', token, { session: phien, qid: q.qid, answer: tra, assisted, msLam, doGiay: dhMs.current >= 1000 ? { g: Math.round(dhMs.current / 1000), v: dhT.current.v, a: dhT.current.a, l: Math.max(dhT.current.l, dhT.current.lang), n: dhT.current.n, w: dhW.current ? 1 : 0 } : undefined }, 15)) // chống trùng theo biên nhận ⇒ kẹt mạng tự gửi lại
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
      const r=await guiLaiKhiKetMang(()=>goiHoa2('hoc-tap-gap',token,{session:phien,qid:q.qid,chuaTuLam:true},15))
      if(r.ok!==true || !(r.choThay===true || r.hocCoHoTro===true&&typeof r.answer==='string'))throw new Error(typeof r.error==='string'?r.error:'Chưa mở được phần chữa.')
      setKet(v=>({...v,[q.qid]:r as unknown as Ket}));capNhatSo()
    } catch(e){setLoi(e instanceof Error?e.message:'Chưa tải được phần chữa.')}finally{gui.current=false;setNop(false)}
  }
  // Xong chặng: câu cuối đã nộp ⇒ mở trước chặng sau (em bấm "Học tiếp chặng N" là có câu ngay).
  const ketThuc = () => { setXong(true); canTaiSanh.current = false; onCapNhat(); moChangTruoc(token); gocRef.current?.scrollIntoView?.({ block: 'start' }) }
  // A3 — câu cũ trượt trái mờ dần (bản sao, không trễ bước sang câu mới; chỉ màn Duo).
  const truotCauCu = () => { if (duo) truotRa(gocRef.current?.querySelector('.duo-than')) }
  // Hết câu của chặng mà có câu TỰ LÀM SAI ⇒ xin vòng làm lại MỘT lần. Rỗng / lỗi mạng ⇒ vào màn kết chặng như cũ. Đang xin ⇒ chạm lặp không kết chặng giữa chừng.
  const xinLamLai = async () => {
    daXinLamLai.current = true; gui.current = true; setNop(true)
    try {
      const r = await goiHoa2('hoc-tap-lam-lai', token, { session: phien }, 15)
      const ds = (Array.isArray(r.questions) ? r.questions as Cau[] : []).filter(c => !cauHong(c) && !cau.some(x => x.qid === c.qid)).slice(0, 3)
      if (!ds.length) { ketThuc(); return }
      truotCauCu(); setCau(v => [...v, ...ds]); setViTri(i => i + 1)
    } catch { ketThuc() } finally { gui.current = false; setNop(false) }
  }

  const ttCau = (c: Cau, i: number): TT => { const r = ket[c.qid]; return r ? (r.choThay || r.hocCoHoTro || r.omni?.luot ? 'ho-tro' : r.correct ? (r.assisted && c.vaiGoi7 !== 'lam_lai' ? 'ho-tro' : 'dung') : 'sai') : i === viTri && !xong ? 'dang' : 'cho' }
  // Câu của chặng (không gồm vòng làm lại) — mọi số «x/6», thanh tiến độ, chuỗi đúng liền, kết chặng tính trên phần này.
  const goc = soGoc ? cau.slice(0, soGoc) : cau, lamLai = soGoc ? cau.slice(soGoc) : []
  const laLamLai = !!q && q.vaiGoi7 === 'lam_lai'
  const soDung = goc.filter((c, i) => ttCau(c, i) === 'dung').length
  const cauSai = goc.flatMap((c, i) => ttCau(c, i) === 'sai' ? [i + 1] : [])
  const lamLaiDung = lamLai.filter(c => ket[c.qid]?.correct === true).length
  const tiep = () => {
    if (gui.current) return
    setLoi('')
    setCombo(null) // băng combo chỉ sống ở câu vừa đúng — sang câu mới thì tắt, không che đề
    if (viTri + 1 < cau.length) { truotCauCu(); setViTri(i => i + 1) }
    else if (goi7 && !daXinLamLai.current && !laLamLai && cauSai.length > 0) void xinLamLai()
    else ketThuc()
  }
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
      e.preventDefault(); doiTra(nhanPhim(traRef.current, p, soORef.current)); keoOVaoTam()
    }
    window.addEventListener('keydown', f)
    return () => window.removeEventListener('keydown', f)
  }, [laTLN, khoa]) // eslint-disable-line react-hooks/exhaustive-deps
  // PHÍM TẮT kiểu Duolingo (máy tính, chỉ nhánh duo — thầy 26/10): 1–4 / A–D chọn phương án Phần I; Enter = Kiểm tra / Tiếp tục. Đang gõ ô chữ, đang
  // mở tấm lời giải / giải thích / hộp thoại ⇒ bỏ qua; nút thường đang có tiêu điểm ⇒ để Enter bấm chính nút đó (trừ ô phương án).
  const phimDuo = useRef<(e: KeyboardEvent) => void>(() => {})
  useEffect(() => {
    if (!duo) return
    const f = (e: KeyboardEvent) => phimDuo.current(e)
    window.addEventListener('keydown', f)
    return () => window.removeEventListener('keydown', f)
  }, [duo])

  // ── chữ dải kết quả (giữ NGUYÊN câu trạng thái đặc biệt: nhờ thầy chữa, học có hỗ trợ, lượt chưa tính)
  const thoiGian = q && k && !k.choThay && !k.hocCoHoTro ? chuThoiGian(msCau[q.qid]) : ''
  const yDS = q?.phan === 'II' && k ? soSanhDungSai(tra, k.answer) : []
  const lanTruoc = k?.chamLanTruoc ? 'chấm theo đáp án em nộp lần trước' : ''
  const ketDai = !q || !k ? null
    : k.choThay ? { tt: 'ho-tro', tieu: 'Chờ phần chữa của thầy', phu: 'Em đã gặp câu này và nhờ thầy chữa. Khi có phần chữa, em sẽ được học lại; hiện chưa tính đúng hoặc đã hiểu.' }
    : k.hocCoHoTro ? { tt: 'ho-tro', tieu: 'Đã học cách giải · có hỗ trợ', phu: 'Em đã học phần chữa. Câu này được ghi là đã gặp với hỗ trợ, chưa tính tự làm đúng.' }
    : k.omni?.luot ? { tt: 'cho', tieu: 'Lượt này chưa được tính đúng hay sai.', phu: thoiGian }
    : laLamLai ? (k.correct ? { tt: 'dung', tieu: 'Làm lại đúng', phu: [thoiGian, 'lượt làm lại tính là có hỗ trợ'].filter(Boolean).join(' · ') }
      : { tt: 'sai', tieu: q.phan === 'II' ? `Đúng ${yDS.filter(y => y.dung).length}/4 ý · sai ý ${yDS.filter(y => !y.dung).map(y => y.chu).join(', ')}` : `Chưa đúng · đáp án ${k.answer}`, phu: 'câu gốc vẫn vào lịch ôn 1 · 3 · 7 ngày' })
    : k.correct ? { tt: k.assisted ? 'ho-tro' : 'dung', tieu: k.assisted ? q.goiY ? 'Đúng · có gợi ý' : 'Đúng · có hỗ trợ' : 'Đúng · tự làm', phu: [lanTruoc, thoiGian, k.assisted && q.goiY ? 'câu có gợi ý tính là học có hỗ trợ' : ''].filter(Boolean).join(' · ') }
    : { tt: 'sai', tieu: q.phan === 'II' ? `Đúng ${yDS.filter(y => y.dung).length}/4 ý · sai ý ${yDS.filter(y => !y.dung).map(y => y.chu).join(', ')}` : `Chưa đúng · đáp án ${k.answer}`, phu: [lanTruoc, thoiGian, 'câu này vào lịch ôn 1 · 3 · 7 ngày'].filter(Boolean).join(' · ') }
  const coTuChua = !!k && !k.correct && !k.omni?.luot && !k.hocCoHoTro && !k.choThay && !laLamLai
  const traHien = k?.hocCoHoTro ? '' : tra // học cách giải: nháp chưa nộp KHÔNG phải câu trả lời của em
  const lg = q && k && !k.choThay ? loiGiaiChuanTuKho(k.solution, q.phan, k.answer) : undefined
  const coLyDoY = !!lg?.tungY && Object.values(lg.tungY).some(y => !!y?.viSao?.trim())

  // ── thanh trên
  const stt = viTri + 1 - (laLamLai ? soGoc : 0) // vòng làm lại đánh số lại từ 1
  // Vạch: đang làm lại ⇒ vạch các câu làm lại; còn lại ⇒ vạch các câu của chặng.
  const dauVach = laLamLai ? soGoc : 0, vach = laLamLai ? lamLai : goc
  const vachChu = vach.map((c, j) => { const t = ttCau(c, dauVach + j); return t === 'dang' ? `đang làm câu ${j + 1}` : `câu ${j + 1} ${CHU_TT[t]}` }).join(', ')
  const tieuDe = xong ? (chang ? `Xong chặng ${chang}` : 'Xong chặng học') : laLamLai ? `Làm lại · Câu ${stt}/${lamLai.length}` : q ? `${chang ? `Chặng ${chang} · ` : ''}Câu ${stt}/${goc.length}` : 'Chặng học của em'

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
        <button ref={nutTiepRef} type="button" className="ht2-lam-nut ht2-lam-nut-chinh" onClick={tiep} disabled={nop}>{viTri + 1 === cau.length ? (laLamLai || !goi7 || daXinLamLai.current || !cauSai.length ? 'Kết thúc chặng' : 'Làm lại câu sai') : 'Câu tiếp theo'}<ArrowRight size={18} aria-hidden="true" /></button>
      </div>
    : choChonCach ? <div className="ht2-lam-hang-nut">
        <button type="button" className="ht2-lam-nut ht2-lam-nut-vang" onClick={() => void hocHuongDan()} disabled={nop}>Học cách giải</button>
        <button type="button" className="ht2-lam-nut ht2-lam-nut-chinh" onClick={() => setTuLam(true)} disabled={nop}>Tự làm câu này</button>
      </div>
    : q.phan === 'II' ? <><div className="ht2-lam-hang-ban-do"><BanDoY value={tra} />{nutGoiY}</div>{nutNop}</>
    : q.phan === 'III' ? <><BanPhimSo value={tra} khoa={nop} soO={soO} onPhim={(p: PhimSo) => { doiTra(nhanPhim(tra, p, soO)); keoOVaoTam() }} /><div className="ht2-lam-hang-nop" data-goi-y={!!nutGoiY || undefined}>{nutGoiY}{nutNop}</div></>
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

  // Chuỗi đúng liền (màn Duo): số trình bày suy từ kết quả các câu ĐÃ CHẤM của chặng (sai / có hỗ trợ ⇒ về 0), không gửi máy chủ; vòng làm lại không tính.
  let chuoi = 0
  for (const c of goc) { const r = ket[c.qid]; if (!r) break; chuoi = r.correct && !r.assisted && !r.choThay && !r.hocCoHoTro && !r.omni?.luot ? chuoi + 1 : 0 }
  // A4 — đúng ⇒ 8 hạt lục giác bung từ ô đúng (hoặc từ Bi ở tấm kết quả); A6 — chuỗi ≥ 3 ⇒ băng combo + tiếng chuông lên một nốt mỗi bậc.
  useEffect(() => {
    if (!duo || !q || !k || !k.correct || k.choThay || k.hocCoHoTro || k.omni?.luot) return
    const g = gocRef.current
    banHat(g?.querySelector('.ht2-lam-pa[data-ket=dung], .ht2-lam-o-hang[data-ket=dung]') ?? g?.querySelector('.duo-kq-bi'), { so: 8, xa: 72 })
    if (laLamLai || chuoi < 3) return
    setCombo({ n: chuoi, id: q.qid })
    const t = window.setTimeout(() => phanHoi('combo', chuoi - 3), 280)
    return () => window.clearTimeout(t)
  }, [!!k]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (!combo) return; const t = window.setTimeout(() => setCombo(null), 2200); return () => window.clearTimeout(t) }, [combo])
  phimDuo.current = (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey || e.repeat || !q || moLoiGiai || gui.current || document.documentElement.hasAttribute('data-gyc-cot-phai')) return
    const t = e.target instanceof HTMLElement ? e.target : null
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT|A)$/.test(t.tagName) || t.closest('[role=dialog], .aid-tam'))) return
    if (t?.tagName === 'BUTTON' && t.getAttribute('role') !== 'radio') return
    const so = 'ABCD'.indexOf(e.key.toUpperCase()) >= 0 ? e.key.toUpperCase() : /^[1-4]$/.test(e.key) ? 'ABCD'[Number(e.key) - 1]! : ''
    if (so && dangTraLoi && q.phan === 'I' && !nop) { e.preventDefault(); doiTra(so); return }
    if (e.key !== 'Enter') return
    if (k) { e.preventDefault(); phanHoi('chon'); tiep() }
    else if (dangTraLoi && duocNop && !nop) { e.preventDefault(); phanHoi('chon'); void nopCau() }
  }
  if (duo) {
    // ═══ LÀM CHẶNG KIỂU DUOLINGO (bản vẽ docs/ban-ve-duo-2610, thầy chốt 26/10, bỏ «Bỏ qua»). Một câu một lúc: thanh trên (thoát · MỘT thanh tiến độ ·
    // chuỗi đúng liền) → nhãn + đề chữ to + phương án ô lớn → ĐÁY GHIM «Kiểm tra» (+ Hỏi thầy) ⇒ bấm ⇒ tấm kết quả trượt từ đáy (đúng xanh / sai đỏ,
    // một câu kiến thức cốt lõi hoặc lý do của phương án em chọn — lấy từ lời giải sẵn có, không có thì bỏ dòng) + «Lời giải từng bước» (tấm riêng,
    // không chen giữa màn) + «Tiếp tục». Đáp án vẫn chỉ về SAU khi bấm Kiểm tra (nopCau như cũ). Chuỗi đúng liền: số trình bày suy từ kết quả các câu
    // đã chấm trong chặng (sai/có hỗ trợ ⇒ về 0), không gửi máy chủ.
    // Thanh tiến độ (thầy 26/10 «hiệu ứng như dolingo»): ĐÚNG ⇒ tăng ngay kèm vệt sáng; SAI ⇒ không tăng lúc hiện kết quả, chỉ nhích khi em sang câu sau.
    // Vòng làm lại: thanh tiến độ GIỮ NGUYÊN (đầy theo câu của chặng), không đếm câu làm lại.
    const daCham = laLamLai ? goc.length : Math.min(goc.length, viTri + (k?.correct ? 1 : 0)) + (xong ? goc.length : 0)
    const pct = goc.length ? Math.min(100, Math.round((100 * daCham) / goc.length)) : 0
    const pa = q?.phan === 'I' ? (q.choices as string[]) : []
    // Lưới 2×2 khi bốn phương án ngắn, không ảnh; dài / có ảnh ⇒ một cột.
    const luoi = q?.phan === 'I' && !q.choiceImgs?.some(Boolean) && !q.hinhAnh.some(h => h.viTri.startsWith('sau_pa_')) && pa.every(c => (c ?? '').length <= 22)
    // Móc trình bày (kiểm định 26/10): phương án dài 9–15 / 16–22 kí tự ⇒ khung hẹp về một cột (CSS @container) — không bẻ công thức giữa chừng.
    const paDai = Math.max(0, ...pa.map(c => (c ?? '').length))
    const doDaiPa = !luoi ? undefined : paDai > 15 ? 'dai' : paDai > 8 ? 'vua' : undefined
    // Đề dài / có hình / có bảng ⇒ máy tính chia hai cột đề | trả lời (CSS); đề ngắn giữ một cột giữa như bản vẽ.
    const deDai = !!q && (q.text.length > 160 || !!q.thanCauImg || !!q.table || q.hinhAnh.some(h => h.viTri === 'sau_de'))
    const thuong = !!k && !k.choThay && !k.hocCoHoTro && !k.omni?.luot
    const tt: 'dung' | 'sai' | 'trung' = !k ? 'trung' : thuong ? (k.correct ? 'dung' : 'sai') : 'trung'
    const chuDapAnDuo = !q || !k ? '' : q.phan === 'I' ? `${k.answer}. ${pa['ABCD'.indexOf(k.answer)] ?? ''}`.trim()
      : q.phan === 'II' ? [...k.answer].map((v, i) => `${'abcd'[i]} ${chuDS(v === 'D' || v === 'S' ? v : null)}`).join(' · ') : k.answer
    // Lý do: Phần I ⇒ lý do của phương án em chọn; Phần II ⇒ lý do ý sai đầu tiên (các ý đã hiện «Em chọn · đáp án» ngay trong câu).
    const ySaiDau = q?.phan === 'II' && k ? yDS.find(y => !y.dung) : undefined
    const lyDoEm = q?.phan === 'I' && /^[ABCD]$/.test(traHien) ? lg?.tungPa?.[traHien as 'A' | 'B' | 'C' | 'D']?.viSao?.trim()
      : ySaiDau ? (v => v ? `Ý ${ySaiDau.chu}: ${v}` : undefined)(lg?.tungY?.[ySaiDau.chu]?.viSao?.trim()) : undefined
    const cotLoi = typeof lg?.chot === 'string' && lg.chot.trim() && !lg.chot.includes('[object Object]') ? lg.chot.trim() : ''
    const tongMs = goc.reduce((a, c) => a + (msCau[c.qid] ?? 0), 0)
    const hoanHao = goc.length > 0 && soDung === goc.length
    const conDu = homNayHien ? Math.max(0, homNayHien.muc - homNayHien.daLam) : null
    const tenChuong = tenBai || q?.tenDang || goc[goc.length - 1]?.tenDang || ''
    const danhDauHoTro = () => { if (q && !k) hoTroCham.current = q.qid }
    // nutBatDau (hợp đồng chạm để hiểu đề): nút «Bắt đầu từ đâu?» của ruột đưa vào ô ở hàng nút đáy cạnh «Gợi ý» (khung thấp xoay ngang: cột phải).
    const nutBatDau = (nut: ReactNode) => oNutCham && !k ? createPortal(nut, oNutCham) : null
    const linkHoi = q && <NutHoiThay gon dangLam={!k} chi="hoi" qid={q.qid} nguon="bai_hang_ngay" dapAnEm={k ? traHien : undefined} onHoi={k ? undefined : () => { daHoiThay.current = q.qid }} />
    const linkGiai = q && k && !k.choThay && <button type="button" className="duo-lien" onClick={() => setMoLoiGiai(true)}><BookOpen size={18} aria-hidden="true" />Lời giải từng bước</button>

    const day = tai ? null
      : xong ? <div className="duo-day" data-xong=""><div className="duo-giua">
          <button type="button" className="duo-nut" onClick={() => setLan(n => n + 1)}>{chuHocTiep}</button>
          <div className="duo-bo"><button type="button" className="duo-lien" onClick={onVe}>Về Hôm nay</button></div>
        </div></div>
      : !q ? null
      : k ? <section className="duo-day duo-ket" data-tt={tt} role="status" aria-live="polite"><div className="duo-giua">
          <div className="duo-kq">
            {tt === 'trung' ? <span className="duo-kq-o" aria-hidden="true"><BookOpen size={26} /></span>
              : <span className="duo-kq-bi" aria-hidden="true"><Bi key={q.qid} cam={tt === 'dung' ? 'vui' : 'sai'} size={64} /></span>}{/* linh vật Bi: đúng ⇒ vui nảy, sai ⇒ lo lắng lắc đầu */}
            <div className="duo-kq-chu">
              {tt === 'dung' ? <><h2><svg className="duo-tick" viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path d="M5 12.5 10 17.5 19 7" /></svg>{laLamLai ? 'Làm lại đúng' : 'Chính xác!'}</h2>{cotLoi && <p><ChemText text={cotLoi} /></p>}</>
              : tt === 'sai' ? <><h2>Chưa đúng</h2>
                  <p><b>{q.phan === 'II' && ketDai ? ketDai.tieu : <>Đáp án: <ChemText text={chuDapAnDuo} /></>}</b></p>
                  <p className="duo-mo">{(lyDoEm || cotLoi) && <><ChemText text={lyDoEm || cotLoi} />{' '}</>}{laLamLai ? 'Câu gốc vẫn' : 'Câu này đã'} vào lịch ôn <span className="duo-lien-chu">1 · 3 · 7 ngày</span>.</p></>
              : <><h2>{ketDai?.tieu}</h2>{ketDai?.phu && <p className="duo-mo">{ketDai.phu}</p>}</>}
              {lanTruoc && <p className="duo-mo">Chấm theo đáp án em nộp lần trước.</p>}
            </div>
          </div>
          <div className="duo-them">{linkGiai}{linkHoi}{/* thầy 26/10 «Bỏ câu sai từng bước»: tấm kết quả không có «Sửa câu này» — chỉ Lời giải từng bước + Hỏi thầy */}</div>
          {loi && <p className="duo-loi" role="alert">{loi}</p>}
          <button ref={nutTiepRef} type="button" className="duo-nut" data-sac={tt === 'sai' ? 'do' : undefined} onClick={() => { phanHoi('chon'); tiep() }}>Tiếp tục</button>
        </div></section>
      : choChonCach ? <div className="duo-day"><div className="duo-giua">
          <div className="duo-hai">
            <button type="button" className="duo-nut" data-sac="vang" onClick={() => void hocHuongDan()} disabled={nop}>Học cách giải</button>
            <button type="button" className="duo-nut" onClick={() => setTuLam(true)} disabled={nop}>Tự làm câu này</button>
          </div>
          {loi && <p className="duo-loi" role="alert">{loi}</p>}
        </div></div>
      : <div className="duo-day"><div className="duo-giua">
          {loi && <p className="duo-loi" role="alert">{loi}</p>}
          <button type="button" className="duo-nut" onClick={() => { phanHoi('chon'); void nopCau() }} disabled={nop || !duocNop}>{nop ? 'Đang kiểm tra…' : q.phan === 'II' && soYChua ? `Còn ${soYChua} ý chưa chọn` : 'Kiểm tra'}</button>
          <div className="duo-bo">
            {linkHoi}
            <span ref={setONutCham} className="duo-o-nut-cham" />
            {q.goiY && <button type="button" className="duo-lien" aria-expanded={goiY} aria-controls="ht2-lam-goi-y" onClick={() => setGoiY(v => !v)}><Lightbulb size={18} aria-hidden="true" />{goiY ? 'Thu gợi ý' : 'Gợi ý'}</button>}
            {coHuongDan && <button type="button" className="duo-lien" onClick={() => void hocHuongDan()} disabled={nop}><BookOpen size={18} aria-hidden="true" />Học cách giải</button>}
          </div>
        </div></div>

    return <div ref={gocRef} className="ht-app ht2-lam duo" data-duo="" data-xong={xong || undefined} data-tt={k ? tt : undefined}>
      {!xong && <header className="duo-tren">
        <button type="button" className="duo-dong" onClick={onVe} disabled={nop} aria-label="Lưu và về Hôm nay"><XIcon size={26} aria-hidden="true" /></button>
        {/* A7 — ỐNG NGHIỆM: chất lỏng dâng theo câu, bọt nổi; chuỗi ≥ 3 ⇒ chất lỏng cam phát sáng + vệt sáng lướt. */}
        <div className="duo-thanh" data-combo={chuoi >= 3 || undefined} role="progressbar" aria-label={laLamLai ? `Làm lại · câu ${stt}/${lamLai.length}` : q ? `Câu ${stt}/${goc.length}${chang ? ` của chặng ${chang}` : ''}` : 'Chặng học của em'} aria-valuemin={0} aria-valuemax={goc.length || 1} aria-valuenow={Math.min(daCham, goc.length)}><i style={{ width: `${pct}%` }}><b /><b /><b />{k?.correct && <span key={q?.qid} className="duo-loe" />}</i></div>
        <span className="duo-chuoi" data-co={chuoi > 0 || undefined} aria-label={`Chuỗi ${chuoi} câu đúng liền`}><Flame size={22} aria-hidden="true" />{chuoi}</span>
        {combo && <BangCombo key={combo.id} n={combo.n} />}
      </header>}
      <main className="duo-than" data-de-dai={deDai || undefined} aria-live={xong ? 'polite' : undefined}>
        {tai ? <div className="ht2-lam-the ht2-lam-cho" role="status"><span className="chu-cho-tre">Đang chuẩn bị những câu phù hợp với em…</span></div>
        : xong ? <section className="duo-xong" data-hoan-hao={hoanHao || undefined} aria-label="Kết quả chặng">
            <div className="duo-hoa" aria-hidden="true">{Array.from({ length: 14 }, (_, i) => <i key={i} style={{ '--i': i } as CSSProperties} />)}</div>
            {/* B2 — chặng hoàn hảo (tự làm đúng cả chặng): tinh thể kim cương kết tinh từ tâm sau lưng Bi, tia sáng xoay chậm; B3 — Bi mừng nhảy, hoa giấy lục giác. */}
            <div className="duo-xong-bi">{hoanHao && <span className="duo-tinh" aria-hidden="true"><i /><svg viewBox="0 0 100 100"><path d="M50 4 86 36 50 96 14 36Z" /><path className="mat" d="M14 36H86M50 4 34 36 50 96 66 36Z" /></svg></span>}<Bi cam="mung" size={148} /></div>
            <h1>{chang ? `Xong chặng ${chang}!` : 'Xong chặng học!'}</h1>
            {hoanHao && <p className="duo-hoan-hao">Hoàn hảo · tự làm đúng cả {goc.length} câu</p>}
            {tenChuong && <p className="duo-xong-phu">{tenChuong}</p>}
            <div className="duo-3">
              <TheSo i={0} sac="dung" ten="Tự làm đúng" Icon={Target} den={soDung} dinh={(v) => `${v}/${goc.length}`} />
              <TheSo i={1} sac="tin" ten="Thời gian" Icon={Clock} den={Math.round(tongMs / 1000)} dinh={(v) => tongMs > 0 ? `${Math.floor(v / 60)}:${String(v % 60).padStart(2, '0')}` : '—'} />
              {homNayHien && <TheSo i={2} sac="sao" ten="Hôm nay" Icon={Flame} den={homNayHien.daLam} dinh={(v) => `${v}/${homNayHien.muc}`} />}
            </div>
            {homNayHien && homNayHien.soChang > 0 && <VongMucTieu xong={soChangXong(homNayHien)} tong={homNayHien.soChang} />}
            <p className="duo-ghi">{[lamLai.length ? `Đã làm lại ${lamLai.length} câu.` : '', cauSai.length ? `${chuDanhSachCau(cauSai)} sai đã vào lịch ôn 1 · 3 · 7 ngày.` : '', conDu === null ? '' : conDu > 0 ? `Còn ${conDu} câu nữa là đủ mức hôm nay.` : 'Em đã đủ mức hôm nay.'].filter(Boolean).join(' ')}</p>
          </section>
        : q ? <>
          <div key={`d${q.qid}`} className="duo-cot-de">{/* khung thấp xoay ngang: cột trái = đề, cột phải = phương án + Kiểm tra / tấm kết quả; dọc / máy tính: display: contents (y bố cục cũ) */}
          {laLamLai ? <p className="duo-nhan" data-lam-lai=""><span>Làm lại · câu {stt}/{lamLai.length}</span><span className="duo-chip">Cùng dạng câu {goc.findIndex(c => c.qid === q.lamLaiCua) + 1 || '?'}</span></p>
            : <p className="duo-nhan"><span>{q.vaiGoi7 === 'moi' ? 'Câu mới' : loai}{tenBai || q.tenDang ? <>{' · '}<span data-cong-thuc={/[A-Z][a-z]?(\d|[A-Z(])/.test(tenBai || q.tenDang || '') || undefined}><ChemText text={tenBai || q.tenDang || ''} /></span></> : null}</span>{chang ? <span className="duo-chip">Chặng {chang}</span> : null}</p>}
          {laLamLai && !k && viTri === soGoc && <p className="duo-mo-ghi">Câu cùng dạng với câu em vừa sai. Lượt này tính là có hỗ trợ.</p>}
          <VungChamDe q={q} token={token} phien={phien} onHoTro={danhDauHoTro} nutBatDau={nutBatDau}><DeCau q={q} stt={stt} /></VungChamDe>
          {q.goiY && goiY && dangTraLoi && <section id="ht2-lam-goi-y" className="ht2-lam-goi-y" aria-label="Gợi ý"><b><Lightbulb size={18} aria-hidden="true" />Gợi ý</b><p>{q.goiY.cotLoi || (q.goiY.gach?.length ? `Có thể loại phương án ${q.goiY.gach.join(', ')}.` : 'Đọc lại kiến thức cốt lõi của bài.')}</p></section>}
          </div>
          <div key={`t${q.qid}`} className="duo-cot-tra">
          {choChonCach && <section className="ht2-lam-the ht2-lam-chon-cach" aria-label="Chọn cách làm">
            <h2 className="ht2-lam-chon-tieu">Câu này em chọn làm thế nào?</h2>
            <div className="ht2-lam-chon-dong"><span aria-hidden="true"><PenLine size={20} /></span><p><b>Tự làm:</b> tính là câu tự làm.</p></div>
            <div className="ht2-lam-chon-dong" data-sac="vang"><span aria-hidden="true"><BookOpen size={20} /></span><p><b>Học cách giải:</b> {q.vaiGoi7 === 'chua' ? 'xem phần thầy chữa' : 'xem lời giải từng bước'}, tính là có hỗ trợ.</p></div>
          </section>}
          <div className="duo-tra" data-luoi={luoi || undefined} data-pa={doDaiPa}>{khoiTraLoi}</div>
          {dangTraLoi && q.phan === 'III' && <BanPhimSo value={tra} khoa={nop} soO={soO} onPhim={(p: PhimSo) => doiTra(nhanPhim(tra, p, soO))} />}
          {(dangTraLoi || k) && <HinhCuoiCau q={q} stt={stt} />}
          {ghiTraLoi}
          </div>
        </> : null}
        {loi && !q && <div className="ht2-lam-loi" role="alert"><span>{loi}</span><button type="button" className="ht2-lam-nut ht2-lam-nut-phu" onClick={() => setLan(n => n + 1)}><RefreshCw size={17} aria-hidden="true" />Thử lại</button></div>}
      </main>
      {day}
      {moLoiGiai && q && k && !k.choThay && <div className="duo-lg" role="dialog" aria-modal="true" aria-label="Lời giải từng bước">
        <div className="duo-lg-the">
          <header className="duo-lg-dau"><b>Lời giải · Câu {stt}</b><button type="button" className="duo-dong" aria-label="Đóng lời giải" onClick={() => { setMoLoiGiai(false); nutTiepRef.current?.focus({ preventScroll: true }) }}><XIcon size={24} aria-hidden="true" /></button></header>
          <Suspense fallback={<LoiGiaiCau q={q} solution={k.solution} dapAn={k.answer} hinhLoiGiai={k.solutionImages} />}><LoiGiaiCauCoSoDo q={q} solution={k.solution} dapAn={k.answer} hinhLoiGiai={k.solutionImages} soDo={k.soDo} /></Suspense>
          <NutHoiThay gon chi="giai" qid={q.qid} nguon="bai_hang_ngay" dapAnEm={traHien} />
        </div>
      </div>}
    </div>
  }

  return <div ref={gocRef} className="ht-app ht2-lam" data-xong={xong || undefined}>
    <header className="ht2-lam-tren">
      <button type="button" className="ht2-lam-nut-ve" onClick={onVe} disabled={nop} aria-label={xong ? 'Về Hôm nay' : 'Lưu và về Hôm nay'}><ArrowLeft size={20} aria-hidden="true" /></button>
      <div className="ht2-lam-giua">
        <h1 className="ht2-lam-tieu" aria-live="polite">{tieuDe}</h1>
        {vach.length > 0 && !xong && <div className="ht2-lam-vach" role="img" aria-label={vachChu} style={{ gridTemplateColumns: `repeat(${vach.length}, minmax(0, 1fr))` }}>{vach.map((c, j) => <i key={c.qid} data-tt={ttCau(c, dauVach + j)} />)}</div>}
      </div>
      {homNayO}
    </header>
    <div className="ht2-lam-khung" data-tra-loi={traLoiPhai ? q.phan : undefined} data-ket={traLoiPhai && k ? '' : undefined}>
      <main className="ht2-lam-than">
        {tai ? <div className="ht2-lam-the ht2-lam-cho" role="status"><span className="chu-cho-tre">Đang chuẩn bị những câu phù hợp với em…</span></div>
        : xong ? <>
          <section className="ht2-lam-the ht2-lam-xong" aria-label="Kết quả chặng">
            <span className="ht2-lam-xong-dau" aria-hidden="true"><Check size={30} strokeWidth={2.4} /></span>
            <h2 className="ht2-lam-xong-tieu">{chang ? `Đã lưu chặng ${chang}` : 'Đã lưu chặng học'}</h2>
            <p className="ht2-lam-xong-so"><b>{soDung}</b>/{goc.length} câu tự làm đúng</p>
            <div className="ht2-lam-xong-cau" role="img" aria-label={goc.map((c, i) => `Câu ${i + 1} ${CHU_TT[ttCau(c, i)]}`).join(', ')}>{goc.map((c, i) => <span key={c.qid} data-tt={ttCau(c, i)}>{i + 1}</span>)}</div>
            {lamLai.length > 0 && <p className="ht2-lam-phu">Đã làm lại {lamLai.length} câu · đúng {lamLaiDung}/{lamLai.length}.</p>}
            {cauSai.length > 0 && <p className="ht2-lam-phu">{chuDanhSachCau(cauSai)} đã vào lịch ôn 1 · 3 · 7 ngày.</p>}
          </section>
          {homNayHien && <section className="ht2-lam-the ht2-lam-hom-nay-the" aria-label="Hôm nay">
            <div className="ht2-lam-hom-nay-dau"><b>Hôm nay {homNayHien.daLam}/{homNayHien.muc} câu</b><span>{homNayHien.daLam >= homNayHien.muc ? 'đã đủ mức hôm nay' : `còn ${homNayHien.muc - homNayHien.daLam} câu · ${homNayHien.soChang - soChangXong(homNayHien)} chặng`}</span></div>
            {homNayHien.soChang > 0 && <div className="ht2-lam-chang" role="img" aria-label={`Xong ${soChangXong(homNayHien)} trên ${homNayHien.soChang} chặng`} style={{ gridTemplateColumns: `repeat(${homNayHien.soChang}, minmax(0, 1fr))` }}>{Array.from({ length: homNayHien.soChang }, (_, i) => <i key={i} data-xong={i < soChangXong(homNayHien) || undefined} />)}</div>}
          </section>}
        </>
        : q ? <>
          {!daiPhai && daiKet}
          {laLamLai && !k && viTri === soGoc && <p className="ht2-lam-ghi"><Info size={14} aria-hidden="true" />Làm lại câu cùng dạng với câu em vừa sai. Lượt này tính là có hỗ trợ.</p>}
          {!k && <div className="ht2-lam-nhan">
            <span className="ht2-lam-chip">{loai}</span>
            {laLamLai ? <span className="ht2-lam-chip" data-sac="vang">{`Làm lại · cùng dạng câu ${goc.findIndex(c => c.qid === q.lamLaiCua) + 1 || ''}`.trim()}</span>
            : q.vaiGoi7 === 'moi' ? <span className="ht2-lam-chip" data-sac="vang">{tenBai ? `Câu mới · ${tenBai}` : 'Câu mới'}</span>
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
          {k && !k.choThay && <NutHoiThay gon qid={q.qid} nguon="bai_hang_ngay" dapAnEm={traHien} />}
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
