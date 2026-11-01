import { chuCuaLoi, guiLaiBenVung } from '../../lib/loi-may-chu'
import { lazy, startTransition, Suspense, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { ArrowLeft, ArrowRight, BookOpen, Check, ChevronDown, Clock, Flame, Info, Lightbulb, PenLine, RefreshCw, Target, X as XIcon } from 'lucide-react'
import { ChemText } from '../../lib/chem-format'
import '../../lib/chem-trinh-bay' // thầy 27/10: phương trình rõ ràng (khoảng hẹp quanh toán tử, ⇌ cỡ chữ, «l» có đuôi) — chỉ app học sinh
import type { TheCauProps } from '../TheCau'
import { loiGiaiChuanTuKho } from '../loi-giai/KhoiLoiGiaiChuan'
import { ghiNhoKetQuaSanh, goiHoa2, type KetQuaSanh } from '../hoa2/api'
import { layDiaChiMayChu } from '../../lib/dia-chi-may-chu'
import { nopCauLuong } from '../hoa2/doc-luong-nop'
import { chamTaiMay, moDm } from '../../lib/dap-an-may' // ĐÁP ÁN TRÊN MÁY (thầy 31/10): chấm tại máy, nằm trong mảnh màn làm bài (đã nạp lười)
import { chotHanhVi, ghiAn, ghiChon, ghiHien, maMayNgan, taoDem, type DemLuot } from '../../lib/doi-dap-an' // đợt 2 đánh giá 99% (01/11): đổi / dò đáp án, rời app ngay trước khi chọn, mã máy
import { boChangMoTruoc, boGoiNgay, CAU_MOI_CHANG_GOI, docChangDangLam, ghiCauXong, GIAY_CHO_MO_CHANG, layChangGoi, layChangMoTruoc, layChangMoTruocNgay, luuChangDangLam, moChangTruoc, napGoiNgay, nghePhanAnRoiApp, xoaChangDangLam } from './mo-chang-truoc'
// Tên trang chính trên nút «về» (Boss 27/10): giao diện Trong ⇒ «Lộ trình»; giao diện cũ ⇒ «Hôm nay». Viết tại chỗ: nhập mô-đun dùng chung sẽ đẻ mảnh tải riêng (+1 tệp mở app).
const tenTrangChinh = (): string => (typeof document !== 'undefined' && document.documentElement.dataset.trong ? 'Lộ trình' : 'Hôm nay')

// Hôm nay nạp ĐỘNG đúng mảnh này để mở chặng trước (không sinh thêm tệp nạp / precache; mảnh màn làm bài được nạp sẵn luôn).
export { moChangTruoc, napGoiNgay } from './mo-chang-truoc'
import type { HinhAnh } from '../../data/examContent'
import type { Question } from '../../game/than-thu-v2/core'
import { docTomTatGoi7, type TomTatGoi7 } from '../../lib/goi-bai-7'
import { soOCuaCau } from '../../lib/so-o-tra-loi-ngan'
import { BanDoY, BanPhimSo, ChonDungSai, ChonTracNghiem, DeCau, HinhCuoiCau, LoiGiaiCau, OTraLoiNgan, PhanHoiDungSai, PhanHoiTraLoiNgan, PhanHoiTracNghiem, traLoiCotPhai, useBoCucLam } from './LamCau'
import { TroGiupDuo } from './TroGiupDuo'
import { ThanhCuon } from './ThanhCuon' // CHẶNG NGANG 01/11: thanh cuộn riêng cột đề / cột trả lời (xoay ngang + máy tính)
import { chuDS, chuThoiGian, kyTuHien, nhanPhim, phimTuBanPhim, soChangXong, soSanhDungSai, type PhimSo, type SoHomNay } from './lam-bai'
import { chuDanhSachCau, coChuSo, cuonDeThayO, soHomNayGoi7 } from './lam-bai-man'
import NutHoiThay from '../loi-giai/NutHoiThay'
import { phanHoi } from '../../lib/phan-hoi'
import { Bi } from '../linh-vat/Bi'
import { banHat, truotRa, useDemSo, yenLang } from '../../lib/hieu-ung'
import { hamNongTuDien } from '../goi-y-cham/tu-dien'
import { batAnKhiBiChe } from '../../lib/an-khi-bi-che'
import { VungChamDe } from '../goi-y-cham/VungChamDe'
// Lời giải kiểu sơ đồ (hợp đồng chạm để hiểu đề, chỗ 3): chỉ cần khi em mở «Lời giải từng bước» ⇒ nạp LƯỜI, lúc chờ vẽ lời giải cũ (không chớp trống).
const LoiGiaiCauCoSoDo = lazy(() => import('../goi-y-cham/LoiGiaiCauCoSoDo'))
// NÂNG CẤP 27/10 (bản vẽ ve-moi/nang-cap): tranh Hoá học (cảnh phản ứng dưới đề · phân tử trong ô phương án). Nằm CHUNG mảnh màn làm bài (mảnh này đã
// nạp lười, ngoài lượt mở app) — không tách mảnh riêng để precache không thêm tệp; chỉ vẽ khi chữ đề / phương án có dáng chất (lọc rẻ ngay đây).
import { IcLapLanh, IcMayTinh, MinhHoaDe, TranhPa } from './minh-hoa-hoa'
import { chayThuong, chuMoc, mocCombo } from './hieu-ung-duo'
import { SoLan } from './SoLan'
import { BungDung } from './BungDung'
/** Đề có «<số> gam|mol <tên chất>» ⇒ đáng thử vẽ cảnh. */
const coDangCanh = (text: string) => /\d\s*(?:gam|g|mol)\s+[A-Za-z(]/.test(text)
/** Bốn phương án đều là tên / công thức chất ngắn (không phải số, không phải câu) ⇒ đáng thử vẽ phân tử. */
const coDangChat = (pa: readonly string[]) => pa.length === 4 && pa.every((c) => /^[A-Za-z(][A-Za-z0-9() ]{1,24}\.?$/.test((c ?? '').trim()) && /[a-z]{4}|[A-Z][a-z]?\d/.test(c ?? ''))
/** Câu khen xoay vòng ở dải ĐÚNG (thầy 27/10, như Duolingo) — theo thứ tự câu, câu đầu luôn «Chính xác!». */
const LOI_KHEN = ['Chính xác!', 'Giỏi quá!', 'Làm tốt lắm!', 'Tuyệt vời!', 'Xuất sắc!']
/** Chủ đề ngắn cho nhãn câu: đoạn đầu trước « — » (thầy 27/10 bản vẽ: «CÂU MỚI · Amine» thay «AMINE — TÍNH BASE — TÍNH KHỐI LƯỢNG»); «Ester – Lipid» giữ nguyên. */
export const chuDeNgan = (ten: string) => ten.split(/\s—\s/)[0]!.trim()
import { createPortal } from 'react-dom'
import '../bang-nhiem-vu/m3-theme.css'
import '../m3/m3.css'
import './hoc-tap.css'
// THƯỞNG PHẠT (gộp đợt 3, 26/10 — src/components/thuong/CAM-VAO.md mục 4–5): tấm thưởng câu (`thuong` của lệnh answer) + băng chuỗi đúng là phần nhỏ hiện
// ngay; màn kết bài (`ketBai`, câu cuối) nạp lười. Máy chủ không gửi hai trường ⇒ màn y như trước.
import { BangCombo as BangComboTp, TamThuong } from '../thuong/TamThuong'
import { IcNguyenTu } from '../thuong/hinh'
import { capNhatTongQuan } from '../thuong/dung-thuong'
import { DUONG, docKetBai, docThuongCau, khoaTam, layTam, ngayVn, type TongQuanThuong } from '../../lib/thuong-api'
// LỬA ĐỔI CẢM XÚC (thầy chốt 31/10): sổ nhỏ trên máy «câu được tính / chưa được tính» (cùng mảnh thuong-gon) — Lộ trình đọc để Lửa vui / giận; 0 lệnh máy chủ.
import { ghiCauLua, ghiXongChangLua } from '../../lib/lua-that'
import { gioMayChu } from '../../lib/gio-may-chu'
// GIỮ CHÂN KHI THOÁT + băng nhắc + lời động viên (thầy 27/10, ảnh Duolingo): móc nhỏ ở đây, tấm + CSS là mảnh nạp lười (GiuChan.tsx).
import { napSanGiuChan, TamGiuChanLuoi, useGiuChan } from './GiuChan'
import { canGiuChan, chuoiHomNay, loiBangNhac, loiDongVien, loiGiuChan, type CauDaCham } from './giu-chan'
const KetBaiThuong = lazy(() => import('../thuong/KetBaiThuong'))
// Chạm ô nguyên tử trên thanh trên ⇒ tấm hướng dẫn (thầy 30/10) — đi trong mảnh nạp lười ManThuong, chỉ «Đã hiểu» (không rời bài).
const TamHuongDan = lazy(() => import('../thuong/ManThuong').then((m) => ({ default: m.TamHuongDan })))
// Giám thị theo mức câu (thầy chốt 27/10): mảnh lười + tờ riêng; ở đây chỉ phần chọn mức (nhỏ).
const GiamThiCau = lazy(() => import('../giam-thi/GiamThi'))
import { mucGiamThi } from '../giam-thi/muc-giam-thi'
/** Trùng tên với TrongHs.SU_KIEN_MO_CHUOI (không nhập TrongHs vào mảnh màn làm bài). */
const SU_KIEN_MO_CHUOI = 'ddh-thuong-mo-chuoi'
// «Trong» 26/10 (nhóm 2): tờ trình bày styles/trong-lam-bai.css nạp RIÊNG, chỉ khi <html data-trong> (main.tsx gắn trước khi nạp màn) — không cộng byte lượt mở app.
if (typeof document !== 'undefined' && document.documentElement.dataset.trong) void import('../../styles/trong-lam-bai.css').catch(() => {})

type Cau = Question & { vaiGoi7?:string; huongDan7?:boolean; coGoi7?:boolean; goiY?: { gach?: string[]; cotLoi?: string }; lamLaiCua?: string; /** TEM NIÊM PHONG đáp án (máy chủ cấp lúc phát câu; chuỗi mờ) — gửi lại cùng lệnh nộp để dòng 1 «Kiểm tra» tức thì ở mọi máy chủ. */ sk?: string; /** ĐÁP ÁN TRÊN MÁY (thầy 31/10, src/lib/dap-an-may.ts): «khoá.gói» mã hoá — máy em chấm tại chỗ khi bấm «Kiểm tra», máy chủ vẫn chấm lại. */ dm?: string }
/** Câu không đủ nội dung để hiện (cùng luật lúc mở chặng và lúc nhận vòng làm lại). */
const cauHong = (c: Cau) => !c.qid || !['I', 'II', 'III'].includes(c.phan) || typeof c.text !== 'string' || !Array.isArray(c.hinhAnh) || c.phan === 'I' && c.choices?.length !== 4 || c.phan === 'II' && c.ideas?.length !== 4
type Ket = { /** CHẤM NHANH 28/10: kết quả TẠM (đúng / sai chấm từ bộ nhớ máy chủ, chưa có thưởng — server/src/nop-luong.ts); phản hồi đầy đủ thay ngay khi về */ tam?: boolean; soDo?: unknown; choThay?:boolean; hocCoHoTro?:boolean; assisted?:boolean; correct: boolean; answer: string; solution?: unknown; omni?: { luot?: boolean }; solutionImages?: Question['hinhAnh']; chamLanTruoc?: boolean; /** thưởng phạt 26/10 */ thuong?: unknown; ketBai?: unknown }
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
function TheSo({ i, sac, ten, Icon, den, dinh, dv }: { i: number; sac: string; ten: string; Icon: typeof Target; den: number; dinh: (v: number) => string; dv?: string }) {
  const v = useDemSo(den, 900, 200 + i * 120) // 27/10: ease-out 900 ms như thẻ kết chặng thưởng phạt
  // dv: đơn vị chữ nhỏ sau số (Boss 27/10 «số nào cũng có nhãn»: «11/24 câu»)
  return <div data-sac={sac} style={{ '--i': i } as CSSProperties}><p>{ten}</p><b><Icon size={20} aria-hidden="true" /><span aria-hidden="true">{dinh(v)}{dv && <small className="duo-so-dv">{dv}</small>}</span><span className="ht2-an">{dinh(den)}{dv ? ` ${dv}` : ''}</span></b></div>
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
/** Mở chặng bị chặn TU_SUA_TRUOC: gửi NGAY việc Sửa lỗi hôm nay đã lưu trên máy (`omr_tu_sua_hom_nay_<sbd>`, lib/tu-sua-viec-hom-nay.ts — cùng lệnh
 *  `viec-ngay` như lượt gửi nền) — câu đã xong trên máy có thể chưa lên máy chủ vì mạng chậm. Viết tại chỗ (không nhập mảnh Tự sửa: thêm mảnh làm phình precache).
 *  true = máy chủ đã ghi. */
async function daySuaNgay(token: string, sbd: string, moKhoa = false): Promise<boolean> {
  try {
    // `moKhoa`: Lộ trình cho bấm chặng này mà máy chủ vẫn chặn (dòng khoá cũ) ⇒ gỡ khoá của hôm nay (server/src/tu-sua-viec-ngay.ts `khoa: false`).
    const nk = moKhoa ? { n: new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10), m: [], x: [], them: 0 } : JSON.parse(localStorage.getItem(`omr_tu_sua_hom_nay_${sbd}`) || 'null') as { n?: unknown; m?: unknown; x?: unknown; them?: unknown } | null
    if (!nk || typeof nk.n !== 'string' || !Array.isArray(nk.m) || !Array.isArray(nk.x) || (!moKhoa && !nk.x.length)) return false
    const goc = await layDiaChiMayChu()
    if (!goc) return false // như lệnh Tự sửa khác (chua-cau-sai-api `goi`)
    const c = new AbortController(), h = setTimeout(() => c.abort(), 10_000) // iPhone cũ (iOS 14–15) chưa có AbortSignal.timeout
    try {
      const r = await fetch(`${goc}/hs/chua-cau-sai/viec-ngay`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(moKhoa ? { ngay: nk.n, khoa: false, token } : { ngay: nk.n, m: nk.m, x: nk.x, them: nk.them ?? 0, token }), signal: c.signal })
      return ((await r.json()) as { ok?: unknown } | null)?.ok === true
    } finally { clearTimeout(h) }
  } catch { return false }
}

/** Vá Sảnh NGAY (thầy 29/10 «làm xong thoát ra Lộ trình phải đồng bộ chính xác ngay lập tức»): nâng «đã làm hôm nay» lên `d` — KHÔNG bao giờ hạ; số câu còn lại
 *  trừ đúng phần nâng (câu tiếp cận trừ ở `tiepCanCon`). Máy chủ ghi sổ học SAU khi trả lời nên Sảnh nạp ngay lúc thoát có thể mang số cũ; máy chủ theo kịp ⇒ không đổi gì. */
export const vaDaLamSanh = (d: number, tiep: number, ngay: string, sbd?: string) => (kq: KetQuaSanh): KetQuaSanh => {
  if (!kq.cheDo2 || !('sanh' in kq)) return kq
  const s = kq.sanh, g = s.goi7, ht = s.hanhTrinh
  const ngaySanh = g?.ngay || s.ngay
  if ((ngay && ngaySanh && ngaySanh !== ngay) || (!g && !ht)) return kq // chỉ vá đúng NGÀY của chặng này (sang ngày mới bản vá hết tác dụng)
  const hienTai = g?.daLamHomNay ?? ht?.daLam ?? 0
  if (hienTai >= d) return kq
  const them = d - hienTai, tc = g ? Math.min(g.tiepCanCon, tiep) : 0
  const kqMoi: KetQuaSanh = {
    ...kq,
    sanh: {
      ...s,
      ...(g && g.daLamHomNay < d ? { goi7: { ...g, daLamHomNay: d, tiepCanCon: g.tiepCanCon - tc, tuLamCon: Math.max(0, g.tuLamCon - (them - tc)) } } : {}),
      ...(ht && ht.daLam < d ? { hanhTrinh: { ...ht, daLam: d } } : {}),
      theLuc: { ...s.theLuc, con: Math.max(0, s.theLuc.con - them) },
    },
  }
  if (sbd) ghiNhoKetQuaSanh(sbd, kqMoi)
  return kqMoi
}
/** Nạp lại Sảnh thêm hai lần sau khi thoát (4 s, 12 s): lần nạp ngay lúc thoát có thể đọc trước khi sổ học kịp ghi. */
const henNapLai = (f: () => void) => { for (const ms of [4000, 12000]) window.setTimeout(f, ms) }
export default function ManLamBaiTap({ token, sbd, onVe, onCapNhat, onChua, onVa, homNay }: {
  token: string; sbd: string; onVe: () => void; onCapNhat: () => void; onChua: (qid: string) => void
  /** Vá bản Sảnh đang hiện (hoa2.va) — số «đã làm» đúng ngay lúc thoát ra Lộ trình. */
  onVa?: (f: (k: KetQuaSanh) => KetQuaSanh) => void
  /** Số "đã làm/M câu hôm nay" + chặng — cùng nguồn vòng tròn Hôm nay (`soHomNay` trong lam-bai.ts). Thiếu ⇒ ẩn ô số, tiêu đề không ghi chặng. */
  homNay?: SoHomNay | null
}) {
  // 30/10 (thầy: «Khi hs thoát app bất thình lình … Bất kể điều gì khi làm lại phải load lại đúng chỗ em đang dở. Lưu đúng chỗ đó.»):
  // khôi phục ĐỒNG BỘ chặng đang làm dở ngay từ khung vẽ đầu (0 ms): đúng danh sách câu gốc, vị trí câu, kết quả câu trước, nháp, cách làm, gợi ý, vòng làm lại.
  const docDang0 = () => {
    const d = docChangDangLam(sbd, Date.now())
    if (!d) return null
    const ds = d.cau as unknown as Cau[]
    if (!ds.length || ds.some(cauHong)) { xoaChangDangLam(sbd); return null }
    return { ...d, ds, g7: docTomTatGoi7(d.goi7) }
  }
  const [dang0] = useState(docDang0)
  const moLucRef = useRef(dang0?.moLuc ?? Date.now())
  // 29/10 tối (thầy «làm cho app hs load tức thì kể cả giờ cao điểm»): lượt mở trước đã về sẵn ở Lộ trình / màn kết chặng ⇒ nạp ĐỒNG BỘ ngay từ khung vẽ đầu (0 ms, không chớp khung chờ).
  const docMoNgay = (tk: string, chiXem = false) => {
    const r = layChangMoTruocNgay(tk, Date.now(), chiXem)
    if (!r || !r.ok || !Array.isArray(r.questions)) return null
    const ds = r.questions as Cau[]
    if (!ds.length || ds.some(cauHong)) return null
    return { ds, id: typeof r.id === 'string' ? r.id : '', g7: docTomTatGoi7(r.goi7) }
  }
  // Lượt dựng đầu chỉ XEM lượt mở trước (React có thể bỏ lượt dựng này rồi dựng lại); effect lúc màn đã hiện thật mới LẤY (mo-chang-truoc.ts `chiXem`).
  const [mo0] = useState(() => (dang0 ? null : docMoNgay(token, true)))
  // ĐỒNG BỘ NHIỀU MÁY (thầy 31/10 «hai thiết bị đăng nhập ko đồng bộ … làm như doligo»): mở lại chặng dở LUÔN làm tươi phiên ở NỀN (câu & vị trí vẫn hiện ngay 0 ms) —
  // trước: dưới 35 phút tin bản lưu, không hỏi máy chủ ⇒ máy khác đã làm tiếp mà máy này vẫn hiện câu cũ. Làm tươi đối chiếu câu (máy chủ bỏ câu đã làm ở máy khác).
  const daNapMo0 = useRef(!!((dang0 && dang0.ds.length > 0 && dang0.ds.every(c => !!dang0.ket?.[c.qid])) || mo0))
  // GÓI CẢ NGÀY (mo-chang-truoc.ts): không có lượt mở trước đã về ⇒ chặng kế trong gói trên máy hiện NGAY từ khung vẽ đầu (đề công khai, bỏ tem dài); phiên mở NỀN ở effect.
  // Số «đã làm» của gói (lúc lập) có thể cũ hơn Lộ trình ⇒ lấy số lớn hơn.
  const g7Goi = (raw: unknown) => { const g = docTomTatGoi7(raw), d0 = Math.max(g?.daLamHomNay ?? -1, homNay?.daLam ?? -1); return g && d0 > g.daLamHomNay ? { ...g, daLamHomNay: d0 } : g }
  const dsTuGoi = (qs: Record<string, unknown>[]) => { const ds = qs.map(({ sk: _sk, ...c }) => c as unknown as Cau); return ds.length && !ds.some(cauHong) ? ds : null }
  // Số câu chặng từ gói: tới ranh chặng kế của Lộ trình (đã làm hôm nay chia 6) — không chặng lẻ khi em làm dở rồi thoát. Gói phải ĐỦ số câu ấy (thầy 30/10:
  // gói sót 3 câu ⇒ chặng 3 câu ⇒ Lộ trình lệch ranh); chưa biết số hôm nay (homNay vắng) ⇒ không biết ranh ⇒ nhận gói như cũ.
  const layGoiChang = () => homNay ? layChangGoi(sbd, Date.now(), 6 - (Math.max(homNay.daLam, 0) % 6)) : layChangGoi(sbd, Date.now(), CAU_MOI_CHANG_GOI, false)
  const [goi0] = useState(() => { if (dang0 || mo0) return null; const g = layGoiChang(), ds = g && dsTuGoi(g.questions); return g && ds ? { ds, g7: g7Goi(g.goi7) } : null })
  const dau0 = dang0 ?? mo0 ?? goi0
  const viTri0 = dang0 ? Math.min(dang0.viTri, Math.max(0, dang0.ds.length - 1)) : 0
  const docTra0 = () => {
    const c = dau0?.ds[viTri0]
    if (!c) return ''
    let nhap = ''
    try { nhap = localStorage.getItem(`hoc-tap:nhap:${sbd}:${c.qid}:${c.version}`) || '' } catch { /* bỏ qua */ }
    return nhap || dang0?.tra || ''
  }
  const tra0 = docTra0()
  const [phien, setPhien] = useState(dang0?.phien ?? mo0?.id ?? ''), [cau, setCau] = useState<Cau[]>(dau0?.ds ?? []), [viTri, setViTri] = useState(viTri0)
  const [tra, setTra] = useState(tra0), [ket, setKet] = useState<Record<string, Ket>>((dang0?.ket as Record<string, Ket> | undefined) ?? {}), [tai, setTai] = useState(!dau0), [nop, setNop] = useState(false), [loi, setLoi] = useState(''), [hetCau, setHetCau] = useState(''), [lan, setLan] = useState(0), [xong, setXong] = useState(false), [goiY, setGoiY] = useState(!!dang0?.goiY)
  const [tuLam, setTuLam] = useState(dang0 ? (!!dang0.tuLam || !!tra0) : !!tra0), [moLoiGiai, setMoLoiGiai] = useState(!!dang0?.moLoiGiai), [msCau, setMsCau] = useState<Record<string, number>>(dang0?.msCau ?? {})
  const [goi7, setGoi7] = useState<TomTatGoi7 | undefined>(dau0?.g7), [chang, setChang] = useState<number | null>(dang0?.chang ?? null)
  // «Làm chặng kiểu Duolingo» (thầy chốt bản vẽ docs/ban-ve-duo-2610, 26/10): CHỈ khi <html data-trong> — cùng state, cùng lệnh, cùng luồng chấm/lưu/đo giây;
  // chỉ dựng cây trình bày khác (nhánh `if (duo)` cuối hàm). Tắt «Trong» ⇒ màn y cũ.
  const [duo] = useState(() => typeof document !== 'undefined' && !!document.documentElement.dataset.trong)
  // LÀM LẠI CUỐI CHẶNG kiểu Duolingo (hợp đồng docs/hop-dong-duolingo-2610.md mục 3; máy chủ goi-bai-7-lam-lai.ts): `soGoc` = số câu của chặng; câu làm lại
  // (≤ 3, chỉ đề) nối sau, mỗi chặng xin MỘT lần (`hoc-tap-lam-lai`), nộp qua `answer` cùng phiên (máy chủ tự ép có hỗ trợ). Không đếm vào số câu của chặng.
  const soGoc0 = dang0 ? (dang0.soGoc || dang0.ds.length) : (dau0?.ds.length ?? 0)
  const [soGoc, setSoGoc] = useState(soGoc0), daXinLamLai = useRef(!!dang0?.daXinLamLai), daDaySua = useRef(0), daXongRef = useRef(false)
  // A6 — băng combo «N câu đúng liền!» / «Phản ứng dây chuyền!» (n = số câu đúng liền lúc hiện, id = câu vừa đúng ⇒ hoạt ảnh chạy lại mỗi câu).
  const [combo, setCombo] = useState<{ n: number; id: string } | null>(null)
  // THƯỞNG BAY + MỐC COMBO (thầy 27/10, hieu-ung-duo.ts): `luot` = một lượt hiệu ứng của câu vừa chấm; `ntTre` = số nguyên tử ĐANG HIỆN trên bộ đếm khi
  // hạt còn bay (null ⇒ số thật). Bấm «Tiếp tục» ⇒ lượt huỷ ⇒ số nhảy tới số cuối.
  const [luot, setLuot] = useState<{ id: string; N: number; phu: number; moc: 0 | 3 | 5 | 10; chuoi: number } | null>(null)
  const [ntTre, setNtTre] = useState<number | null>(null)
  // câu đã bật viên «+N» (số trên bộ đếm đã cộng). Câu vừa chấm mà CHƯA bật ⇒ bộ đếm vẽ số TRƯỚC câu ngay từ lượt vẽ đầu (không loé số cuối rồi lăn ngược).
  const daCong = useRef(new Set<string>(Object.keys(dang0?.ket ?? {})))
  const demRef = useRef<HTMLButtonElement>(null), biGomRef = useRef<HTMLSpanElement>(null)
  const [hdNt, setHdNt] = useState(false)
  const d0BanDau = (g?: TomTatGoi7) => Math.max(g?.daLamHomNay ?? -1, homNay?.daLam ?? -1)
  const ngayBanDau = (g?: TomTatGoi7) => g?.ngay || new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10)
  const qidsDang0: string[] = []
  let tiepDang0 = 0
  if (dang0) {
    for (const c of dang0.ds.slice(0, soGoc0)) {
      if (c.vaiGoi7 === 'lam_lai') continue
      const r = dang0.ket?.[c.qid] as Ket | undefined
      if (!r || r.omni?.luot === true) continue
      qidsDang0.push(c.qid)
      if (c.vaiGoi7 === 'tiep_can') tiepDang0++
    }
  }
  const d0KhungDau = (() => {
    if (!dang0) return d0BanDau(dau0?.g7)
    const chang0 = dang0.chang ?? (homNay?.chang && homNay.chang >= 1 ? homNay.chang : null)
    const muc0 = dang0.dem?.muc ?? dau0?.g7?.toiThieu ?? homNay?.muc ?? 0
    const soChang0 = muc0 > 0 ? Math.ceil(muc0 / 6) : (homNay?.soChang ?? 0)
    if (chang0 && chang0 >= 1 && soChang0 >= chang0 && muc0 > 0) {
      const dauChang = Math.min((chang0 - 1) * 6, muc0)
      const cuoiChang = chang0 === soChang0 ? muc0 : Math.min(chang0 * 6, muc0)
      const d0Max = Math.max(dauChang, cuoiChang - soGoc0)
      if (typeof dang0.moi?.d0 === 'number' && dang0.moi.d0 >= dauChang && dang0.moi.d0 <= d0Max) return dang0.moi.d0
      return d0Max
    }
    if (typeof dang0.moi?.d0 === 'number' && dang0.moi.d0 >= 0) return dang0.moi.d0
    const dHomNay = d0BanDau(dau0?.g7)
    return dHomNay >= 0 ? Math.max(0, dHomNay - qidsDang0.length) : -1
  })()
  // SỐ HÔM NAY TRONG CHẶNG (khẩn 12/10 22h30 — giờ cao điểm máy chủ chậm): nhánh Gói 7 lấy (đã làm, M) từ `hoc-tap-start` lúc mở chặng rồi lệnh nhẹ
  // `hoc-tap-dem` sau mỗi câu — KHÔNG gọi lại cả sảnh (`lapGoi7` ~25 truy vấn) sau mỗi câu. Sảnh nạp lại MỘT lần khi xong chặng / rời màn.
  const [dem, setDem] = useState<{ daLam: number; muc: number } | null>(() => {
    const muc0 = dang0?.dem?.muc ?? dau0?.g7?.toiThieu ?? homNay?.muc ?? 0
    if (muc0 <= 0) return dang0?.dem ?? null
    const daLam0 = d0KhungDau >= 0 ? d0KhungDau + qidsDang0.length : Math.max(0, dang0?.dem?.daLam ?? homNay?.daLam ?? 0)
    return { daLam: daLam0, muc: muc0 }
  })
  const canTaiSanh = useRef(false), soLuotDem = useRef(0), capNhatRef = useRef(onCapNhat)
  capNhatRef.current = onCapNhat
  // Câu MỚI em làm trong lượt này (không tính làm lại) + số «đã làm» lúc mở chặng ⇒ số thật ngay sau mỗi câu, không chờ máy chủ.
  const moi = useRef<{ qids: Set<string>; tiep: number; d0: number; ngay: string }>(dang0 ? { qids: new Set(qidsDang0), tiep: tiepDang0, d0: d0KhungDau, ngay: dang0.moi?.ngay || ngayBanDau(dau0?.g7) } : { qids: new Set(), tiep: 0, d0: d0KhungDau, ngay: ngayBanDau(dau0?.g7) }), onVaRef = useRef(onVa)
  onVaRef.current = onVa
  const vaSo = (d: number) => onVaRef.current?.(vaDaLamSanh(d, moi.current.tiep, moi.current.ngay, sbd))
  const batDau = useRef(Date.now() - (dang0?.dhMs ?? 0)), gui = useRef(false), traRef = useRef(tra0)
  // CHẤM NHANH (thầy 28/10 «bấm kiểm tra … chưa tức thì ngay»): `cham` = đang chờ máy chủ chấm (dải «Đang chấm…» trượt lên ngay khi chạm); `tiepCho` = em bấm
  // «Tiếp tục» khi kết quả còn TẠM ⇒ sang câu ngay khi bản đầy đủ (đã ghi) về — câu kế không bao giờ nộp chồng lên lượt ghi của câu trước.
  const [cham, setCham] = useState(false), tiepCho = useRef(false), tiepMoi = useRef<() => void>(() => {})
  // GHI NỀN (29/10, thầy «tải sẵn gì tải luôn, tức thì cả giờ cao điểm»): kết quả đã hiện (dòng tạm) mà bản đầy đủ (đã ghi) chưa về ⇒ «Tiếp tục» sang câu kế NGAY (trừ câu cuối), lượt ghi chạy tiếp nền.
  // `ghiTruoc` = lượt nộp trước còn chạy: câu kế chỉ GỬI sau khi nó xong (hồ sơ game ghi bằng CAS — không chồng hai lượt ghi của một em); `tachRoi` = câu đã rời màn khi bản đầy đủ chưa về.
  const ghiTruoc = useRef<Promise<void> | null>(null), tachRoi = useRef<Set<string>>(new Set())
  // «Kiểm tra» tức thì cả câu sai nhanh (29/10): số lượt LƯỚT máy chủ đã báo từ lúc mở chặng (tem mang số lướt lúc niêm phong) — gửi kèm `lm` để dòng 1 từ tem quyết lướt đúng.
  const luotChang = useRef(dang0?.luotChang ?? 0)
  // LÀM LẠI SỚM: lời hứa của lệnh `hoc-tap-lam-lai` đã xin NGAY khi câu cuối có bản đầy đủ (em đang đọc lời giải) — `xinLamLai` dùng lại; mỗi chặng một lần.
  const lamLaiSom = useRef<Promise<Record<string, unknown>> | null>(null)
  // GÓI CẢ NGÀY (mo-chang-truoc.ts): câu đã hiện từ máy, phiên đang mở NỀN ⇒ «Kiểm tra» / «Chưa tự làm được» đợi lời hứa này (mã phiên + tem mới + câu còn nhận).
  const phienCho = useRef<Promise<{ id: string; sk: Record<string, unknown>; qids: Set<string> }> | null>(null)
  const gocRef = useRef<HTMLDivElement>(null), nutTiepRef = useRef<HTMLButtonElement>(null)
  const q = cau[viTri], k = q ? ket[q.qid] : undefined
  // 20/10 đo giây (thầy: mọi câu đều đo được): giây câu đang hiện, CHỈ cộng khi tab đang hiện và em còn chạm màn trong 180 giây; trần 900; gửi cùng lượt nộp
  // (`doGiay: {g}`; số từ/hình/phần do máy chủ tự đo). `msLam` cũ giữ nguyên cho OMNI. Viết nội tuyến (không tệp chung): thêm một tệp dùng chung làm tăng
  // tải mở cả ba app (cổng `kiem:toc-do`) hoặc thêm một chunk (cổng `kiem-sw` đang 170/170). Cùng định nghĩa với màn ôn lại (LamCauOn).
  // 22/10 ĐO TREO MÁY (thầy: thêm Mức làm 5 "Treo máy", 6 "Cố tình treo máy"; docs/dac-ta-muc-lam-6-muc-2210.md mục 3): `g` GIỮ NGUYÊN; thêm v (giây câu mở khi tab
  // hiện, không cắt 180) · a (giây câu mở khi tab ẩn / tắt màn) · l (khoảng lặng dài nhất giữa hai lần chạm, khi tab hiện) · n (số khoảng lặng 120–179 giây) ·
  // w (1 = xin được giữ màn sáng: màn ẩn lúc ấy là em tự rời app/tắt màn, không phải màn tự tắt). Gửi cùng cụm `doGiay`.
  const dhMs = useRef(dang0?.dhMs ?? 0), dhCham = useRef(Date.now()), giuDh = useRef(!!dang0)
  const dhT = useRef(dang0?.dhT ? { ...dang0.dhT } : { v: 0, a: 0, l: 0, n: 0, lang: 0 }), dhW = useRef(false)
  // ĐỢT 2 ĐÁNH GIÁ 99% (01/11, src/lib/doi-dap-an.ts): bộ đếm đổi / dò đáp án + rời app ngay trước khi chọn của câu đang làm — ref, đổi tại chỗ (0 lần vẽ lại
  // mỗi chạm); tạo mới khi sang câu (effect `khoa` dưới), gửi cùng cụm `doGiay`. `tb` = mã máy ngắn, đọc một lần sau khi mở màn (ngoài lượt chạm).
  const demDoi = useRef<DemLuot>(null as unknown as DemLuot), maMay = useRef('')
  if (!demDoi.current) demDoi.current = taoDem() // tạo MỘT lần (không cấp phát mỗi lần vẽ)
  useEffect(() => { if (giuDh.current) { giuDh.current = false; dhCham.current = Date.now(); return } dhMs.current = 0; dhCham.current = Date.now(); dhT.current = { v: 0, a: 0, l: 0, n: 0, lang: 0 } }, [q?.qid])
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
        ghiHien(demDoi.current, Date.now())
        xin()
      } else { if (!anTu) anTu = Date.now(); ghiAn(demDoi.current, Date.now()); khoaMan = null /* trình duyệt tự nhả khi ẩn */ }
    }
    xin()
    document.addEventListener('visibilitychange', doiHien)
    // Mã máy ngắn đọc NGOÀI lượt chạm (một lần đọc localStorage, sau khi màn đã vẽ) — «Kiểm tra» không phải đọc lại.
    const henMay = window.setTimeout(() => { if (!maMay.current) maMay.current = maMayNgan() }, 1500)
    return () => {
      het = true
      window.clearTimeout(henMay)
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
    if (daNapMo0.current && lan === 0) {
      daNapMo0.current = false
      if (dang0) { if (moi.current.qids.size > 0 && moi.current.d0 >= 0) vaSo(moi.current.d0 + moi.current.qids.size) }
      else layChangMoTruocNgay(token)
      return
    }
    let huy = false
    const duongCu = () => layChangMoTruoc(token) ?? guiLaiBenVung(() => goiHoa2('hoc-tap-start', token, {}, GIAY_CHO_MO_CHANG))
    // Khôi phục chặng đang dở khi chưa kịp có mã phiên (thoát ngay lúc mở từ gói) hoặc tem đã quá 35 phút: giữ nguyên câu & vị trí đang làm (0 ms), chỉ làm tươi phiên + tem ở nền.
    if (dang0 && lan === 0) {
      if (moi.current.qids.size > 0 && moi.current.d0 >= 0) vaSo(moi.current.d0 + moi.current.qids.size)
      const dsDang = dang0.ds
      const qidsCan = dsDang.filter(c => !dang0.ket?.[c.qid]).map(c => c.qid)
      if (!qidsCan.length) return
      const goi = layChangGoi(sbd, Date.now(), CAU_MOI_CHANG_GOI * 2, false)
      const temDai: Record<string, unknown> = {}
      for (const c of goi?.questions ?? []) if (typeof c.qid === 'string' && typeof c.sk === 'string') temDai[c.qid] = c.sk
      // 30/10 (ảnh thầy: bấm «Kiểm tra» ⇒ «Câu không thuộc lượt học.»): lượt làm tươi ở đây có thể KHÔNG chứa câu đang dở — đường cũ trả lượt mở sẵn của chặng
      // KẾ (câu khác), máy chủ bỏ bớt câu em đã làm ở máy khác… Trước đây chỉ thay mã lượt, giữ câu cũ ⇒ nộp câu cũ vào lượt mới ⇒ máy chủ từ chối. Nay đối chiếu:
      // câu chưa làm không có trong lượt mới ⇒ thay bằng câu của lượt mới (giữ câu đã nộp, giữ số câu chặng).
      const layTuDuongCu = async () => {
        const r = await duongCu()
        const ds = Array.isArray(r.questions) ? (r.questions as Cau[]).filter(c => !cauHong(c)) : []
        const g7 = docTomTatGoi7(r.goi7)
        return { id: typeof r.id === 'string' ? r.id : '', sk: Object.fromEntries(ds.map(c => [c.qid, c.sk])) as Record<string, unknown>, daLam: g7?.daLamHomNay, g7, dsMoi: ds, coQid: new Set(ds.map(c => c.qid)) }
      }
      const mo = (goi && qidsCan.length && qidsCan.every(id => temDai[id])
        ? goiHoa2('hoc-tap-mo-goi', token, { ves: goi.ves, qids: qidsCan, sk: temDai }, GIAY_CHO_MO_CHANG).then(r => {
            if (r.ok !== true || typeof r.id !== 'string') throw new Error('goi')
            // máy chủ bỏ bớt câu đang dở (đã làm ở máy khác…) ⇒ lấy lượt đủ câu từ đường cũ
            if (Array.isArray(r.qids) && !qidsCan.every(x => (r.qids as unknown[]).includes(x))) throw new Error('goi-thieu')
            return { id: r.id, sk: (r.sk && typeof r.sk === 'object' ? r.sk : {}) as Record<string, unknown>, daLam: typeof r.daLam === 'number' ? r.daLam : undefined, g7: undefined, dsMoi: [] as Cau[], coQid: new Set(qidsCan) }
          }).catch(layTuDuongCu)
        : layTuDuongCu()
      ).then(({ id, sk, daLam, g7, dsMoi, coQid }) => {
        const daNop = (c: Cau) => !!dang0.ket?.[c.qid]
        const giu = dsDang.filter(c => daNop(c) || coQid.has(c.qid))
        const them = giu.length < dsDang.length ? dsMoi.filter(c => !giu.some(x => x.qid === c.qid)).slice(0, dsDang.length - giu.length) : []
        const dsMoiChang = them.length || giu.length < dsDang.length ? [...giu, ...them] : null
        if (!huy && id) {
          moLucRef.current = Date.now()
          setPhien(id)
          if (g7 && !goi7) setGoi7(g7)
          if (typeof daLam === 'number' && moi.current.d0 < 0) moi.current.d0 = Math.max(0, daLam - moi.current.qids.size)
          if (moi.current.qids.size > 0 && moi.current.d0 >= 0) vaSo(moi.current.d0 + moi.current.qids.size)
          const vaSk = (c: Cau) => typeof sk[c.qid] === 'string' ? { ...c, sk: sk[c.qid] as string } : c
          if (dsMoiChang) {
            const ds = dsMoiChang.map(vaSk), dau = ds.findIndex(c => !daNop(c))
            setCau(ds); setSoGoc(n => Math.min(n || ds.length, ds.length)); setViTri(dau >= 0 ? dau : Math.max(0, ds.length - 1))
          } else setCau(prev => prev.map(vaSk))
        }
        return { id, sk, qids: new Set((dsMoiChang ?? dsDang).filter(c => coQid.has(c.qid) || daNop(c)).map(c => c.qid)) }
      })
      phienCho.current = mo
      void mo.catch(() => {})
      return () => { huy = true }
    }
    if (lan > 0) { daXongRef.current = false; xoaChangDangLam(sbd) }
    luotChang.current = 0; lamLaiSom.current = null; phienCho.current = null
    const san = docMoNgay(token)
    if (san) {
      moLucRef.current = Date.now()
      setTai(false); setLoi(''); setHetCau(''); setCau(san.ds); setSoGoc(san.ds.length); setPhien(san.id); setGoi7(san.g7); setXong(false); setKet({}); setViTri(0); setMsCau({}); setChang(null); setCombo(null); daXinLamLai.current = false; soLuotDem.current++
      const d0 = d0BanDau(san.g7)
      moi.current = { qids: new Set(), tiep: 0, d0, ngay: ngayBanDau(san.g7) }
      setDem(san.g7 ? { daLam: Math.max(0, d0), muc: san.g7.toiThieu } : homNay ? { daLam: homNay.daLam, muc: homNay.muc } : null)
      return
    }
    setTai(true); setLoi(''); setHetCau(''); setCau([]); setPhien(''); setXong(false); setKet({}); setViTri(0); setMsCau({}); setChang(null); setDem(null); setSoGoc(0); setCombo(null); daXinLamLai.current = false; soLuotDem.current++
    /** Nhận một lượt mở chặng (đường cũ — cũng là lối rơi về của gói cả ngày). */
    const nhan = (r: Record<string, unknown>) => {
      if (!r.ok) throw Object.assign(new Error(typeof r.error === 'string' ? r.error : 'Chưa mở được chặng học.'), { ma: r.ma })
      const ds = Array.isArray(r.questions) ? r.questions as Cau[] : []
      if (ds.some(cauHong)) throw new Error('Nội dung câu chưa đầy đủ. Em cập nhật lại bài học nhé.')
      const g7 = docTomTatGoi7(r.goi7), d0 = d0BanDau(g7)
      moLucRef.current = Date.now()
      setCau(ds); setSoGoc(ds.length); setViTri(0); setPhien(typeof r.id === 'string' ? r.id : ''); setGoi7(g7); moi.current = { qids: new Set(), tiep: 0, d0, ngay: ngayBanDau(g7) }
      if (g7) setDem({ daLam: Math.max(0, d0), muc: g7.toiThieu })
      // 27/10 (ảnh thầy: khung đỏ «Em đã hoàn thành phần được xếp hôm nay…» + «Thử lại» ⇒ em kẹt, thử lại ra đúng câu ấy): chặng rỗng KHÔNG phải lỗi —
      // thẻ trung tính + nút về trang chính (làm mới số ở đó), không «Thử lại».
      if (!ds.length) { xoaChangDangLam(sbd); setHetCau(typeof r.message === 'string' && r.message.trim() ? r.message : `Chưa có câu mới cho chặng này. Em về ${tenTrangChinh()} xem tiến độ.`) }
      return { id: typeof r.id === 'string' ? r.id : '', sk: Object.fromEntries(ds.map(c => [c.qid, c.sk])), qids: new Set(ds.map(c => c.qid)) }
    }
    // GÓI CẢ NGÀY (thầy 29/10 «cách khác hoàn toàn … tức thì ở mọi thời điểm, kể cả giờ cao điểm»; mo-chang-truoc.ts): máy em có sẵn chặng ⇒ câu hiện NGAY (không chờ máy
    // chủ); phiên mở NỀN bằng lệnh nhẹ `hoc-tap-mo-goi` rồi nhận mã phiên + tem mới, bỏ câu máy chủ báo em đã làm (máy khác). Máy chủ từ chối / lỗi ⇒ đường cũ.
    const goi = layGoiChang()
    // Gói còn câu mà không đủ trọn chặng (thầy 30/10) ⇒ chặng này đi đường máy chủ (đủ câu), lập lại gói ở nền cho chặng sau.
    if (!goi && layChangGoi(sbd, Date.now(), 1)) void napGoiNgay(token, goiHoa2, Date.now(), true)
    const dsGoi = goi && dsTuGoi(goi.questions)
    const mo: Promise<{ id: string; sk: Record<string, unknown>; qids: Set<string> }> = goi && dsGoi ? (() => {
      const g7 = g7Goi(goi.goi7), d0 = d0BanDau(g7)
      moLucRef.current = Date.now()
      setCau(dsGoi); setSoGoc(dsGoi.length); setGoi7(g7); moi.current = { qids: new Set(), tiep: 0, d0, ngay: ngayBanDau(g7) }
      if (g7) setDem({ daLam: Math.max(0, d0), muc: g7.toiThieu })
      setTai(false)
      const temDai: Record<string, unknown> = {}
      for (const c of goi.questions) if (typeof c.qid === 'string' && typeof c.sk === 'string') temDai[c.qid] = c.sk
      // Lệnh nhẹ (một đợt đọc + một lệnh ghi): chờ tối đa 20 s rồi rơi về đường cũ — không để em đã bấm «Kiểm tra» chờ đủ 40 s + 40 s.
      return goiHoa2('hoc-tap-mo-goi', token, { ves: goi.ves, qids: dsGoi.map(c => c.qid), sk: temDai }, 20).then(r => {
        if (r.ok !== true || typeof r.id !== 'string' || !Array.isArray(r.qids)) {
          if (typeof r.ma === 'string' && r.ma.startsWith('GOI_')) boGoiNgay(sbd) // gói không dùng được nữa ⇒ đường cũ tới khi gói mới về
          throw Object.assign(new Error('goi'), { roiVe: true })
        }
        const qids = new Set(r.qids.filter((x): x is string => typeof x === 'string')), sk = (r.sk && typeof r.sk === 'object' ? r.sk : {}) as Record<string, unknown>
        // Máy chủ bỏ bớt câu em đã làm ở máy khác ⇒ chặng hụt câu (thầy 30/10: Lộ trình lệch ranh, chặng sau «chỉ còn 3 câu»). Em chưa nộp câu nào ⇒ lấy chặng
        // đủ câu từ đường máy chủ và lập lại gói ở nền; đã nộp ⇒ giữ (không đổi câu dưới tay em).
        if (qids.size < dsGoi.length && moi.current.qids.size === 0) {
          void napGoiNgay(token, goiHoa2, Date.now(), true)
          throw Object.assign(new Error('goi-thieu'), { roiVe: true })
        }
        if (!huy) {
          moLucRef.current = Date.now()
          const ds = dsGoi.filter(c => qids.has(c.qid)).map(c => typeof sk[c.qid] === 'string' ? { ...c, sk: sk[c.qid] as string } : c)
          setCau(ds); setSoGoc(ds.length); setViTri(v => Math.min(v, Math.max(0, ds.length - 1))); setPhien(r.id)
          if (typeof r.daLam === 'number' && r.daLam >= 0 && moi.current.qids.size === 0) { const d = r.daLam; moi.current.d0 = d; setDem(v => v ? { ...v, daLam: d } : v) }
        }
        return { id: r.id, sk, qids }
      }).catch(async () => { // mạng lỗi / máy chủ từ chối gói ⇒ đường cũ (lỗi của đường cũ hiện như trước)
        const r = await duongCu()
        if (huy) throw new Error('Đã rời chặng.')
        return nhan(r)
      })
    })() : duongCu().then(r => { if (huy) throw new Error('Đã rời chặng.'); return nhan(r) })
    phienCho.current = mo
    void mo.catch(async e => {
      if (huy) return
      // KHOÁ SAU SỬA LỖI (ảnh thầy 28/10 19:55: khung đỏ «Em sửa xong lỗi hôm nay rồi mới mở chặng tiếp nhé.» + «Thử lại» ⇒ em kẹt): gửi ngay câu Sửa lỗi đã xong
      // trên máy (có thể chưa lên máy chủ vì mạng chậm) rồi mở lại MỘT lần; vẫn chặn ⇒ thẻ trung tính + nút về Lộ trình (nút Sửa lỗi ở đó), không «Thử lại».
      if ((e as { ma?: unknown })?.ma === 'TU_SUA_TRUOC') {
        xoaChangDangLam(sbd)
        // Lần 1: gửi tiến độ Sửa lỗi trên máy rồi mở lại. Lần 2 (vẫn chặn): Lộ trình đã cho bấm chặng này ⇒ gỡ dòng khoá cũ trên máy chủ rồi mở lại.
        while (daDaySua.current < 2) {
          const moKhoa = daDaySua.current++ === 1
          if (await daySuaNgay(token, sbd, moKhoa)) { if (!huy) setLan(n => n + 1); return }
        }
        if (!huy) setHetCau(chuCuaLoi(e, 'Em sửa xong lỗi hôm nay rồi mới mở chặng tiếp nhé.'))
        return
      }
      setLoi(chuCuaLoi(e, 'Chưa tải được bài học.'))
    }).finally(() => { if (!huy) setTai(false) })
    return () => { huy = true }
  }, [token, lan]) // eslint-disable-line react-hooks/exhaustive-deps -- sbd đi cùng token; số «đã làm» của Lộ trình chỉ đọc lúc mở chặng
  const giuKhoa = useRef(!!dang0)
  useEffect(() => {
    if (giuKhoa.current) { giuKhoa.current = false; batDau.current = Date.now() - (dang0?.dhMs ?? 0); demDoi.current = taoDem(traRef.current, q?.phan, Date.now(), document.hidden); return }
    let nhap = ''
    if (khoa) try { nhap = localStorage.getItem(khoa) || '' } catch { /* Lưu nháp không khả dụng. */ }
    setTra(nhap); traRef.current = nhap; setGoiY(false); setMoLoiGiai(false); setTuLam(!!nhap); batDau.current = Date.now()
    demDoi.current = taoDem(nhap, q?.phan, Date.now(), document.hidden) // câu mới: đáp án nháp khôi phục không tính là «đổi»
  }, [khoa]) // eslint-disable-line react-hooks/exhaustive-deps
  // Rời màn (Về, Tự chữa…) khi đã nộp câu mà sảnh chưa nạp lại ⇒ nạp MỘT lần để Hôm nay đúng số.
  useEffect(() => () => { if (canTaiSanh.current) { canTaiSanh.current = false; capNhatRef.current(); henNapLai(() => capNhatRef.current()) } }, [])
  // Thưởng phạt: rời màn sau khi đã có câu được thưởng ⇒ đọc lại tổng quan MỘT lần (thanh trên Lộ trình: nguyên tử hôm nay, mục tiêu ngày).
  const coThuongRef = useRef(false)
  useEffect(() => () => { if (coThuongRef.current) void capNhatTongQuan(token) }, [token])
  /** Sau mỗi câu: Gói 7 ⇒ lệnh nhẹ `hoc-tap-dem` (chỉ đọc, 3 truy vấn); lượt trả về muộn hơn lượt mới hơn bị bỏ. Nhánh khác ⇒ nạp lại sảnh như cũ. */
  const capNhatSo = () => {
    if (!goi7) { onCapNhat(); return }
    canTaiSanh.current = true
    const luot = ++soLuotDem.current
    void goiHoa2('hoc-tap-dem', token, {}, 20).then(r => {
      if (luot !== soLuotDem.current) return
      const daLam = Number(r.daLamHomNay), muc = r.toiThieu == null ? NaN : Number(r.toiThieu)
      if (r.daLamHomNay == null || !Number.isFinite(daLam) || daLam < 0) return
      setDem(v => { const m = Number.isFinite(muc) && muc > 0 ? muc : v?.muc ?? 0; return m > 0 ? { daLam: Math.max(daLam, v?.daLam ?? 0), muc: m } : v })
      vaSo(Math.max(daLam, moi.current.d0 + moi.current.qids.size)) // số máy chủ có thể CŨ (sổ học chưa kịp ghi): không bao giờ thấp hơn số đã đếm ở máy
    }).catch(() => { /* Giữ số cũ; xong chặng / rời màn sẽ nạp lại sảnh. */ })
  }
  /** Câu MỚI (không phải làm lại, chưa tính trong lượt này) ⇒ cộng vào «đã làm hôm nay» NGAY và vá Sảnh — không chờ `hoc-tap-dem` / sổ học của máy chủ. */
  const tinhCauMoi = (c: Cau, ketMoi?: Record<string, Ket>) => {
    const m = moi.current
    if (m.d0 < 0 && homNay) m.d0 = Math.max(0, homNay.daLam - m.qids.size)
    if (!m.ngay) m.ngay = ngayBanDau(goi7)
    if (m.d0 < 0 || c.vaiGoi7 === 'lam_lai') return
    const daCo = m.qids.has(c.qid)
    if (!daCo) { m.qids.add(c.qid); if (c.vaiGoi7 === 'tiep_can') m.tiep++ }
    if (ketMoi) luuDangRef.current(ketMoi)
    if (daCo) return
    canTaiSanh.current = true
    setDem(v => (v ? { ...v, daLam: Math.max(v.daLam, m.d0 + m.qids.size) } : homNay ? { daLam: m.d0 + m.qids.size, muc: homNay.muc } : v)); vaSo(m.d0 + m.qids.size)
  }
  const doiTra = (v: string) => { phanHoi('chon'); ghiChon(demDoi.current, q?.phan, v, Date.now()); setTra(v); traRef.current = v; try { localStorage.setItem(khoa, v) } catch { /* Em vẫn làm và nộp được. */ } }
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
  const daHoiThay = useRef(dang0?.daHoiThay ?? '')
  // «Chạm để hiểu đề» (src/components/goi-y-cham, hợp đồng docs/hop-dong-doc-de-2610.md): em mở «Bắt đầu từ đâu?» của câu này ⇒ lượt nộp có hỗ trợ
  // (như Gợi ý, Hỏi thầy). Ruột tự vẽ thẻ giải nghĩa / gợi ý (TamGiaiThich); màn chỉ chừa chỗ đặt nút ở hàng nút đáy (`oNutCham`).
  const hoTroCham = useRef(dang0?.hoTroCham ?? '')
  const [oNutCham, setONutCham] = useState<HTMLElement | null>(null)
  useEffect(() => {
    if (!q) return
    if (daMo.current && !daVeDau.current) veDau(); daVeDau.current = false; daMo.current = true
    // CHẶNG NGANG 01/11: cột đề (giữ nguyên qua các câu) cuộn riêng ở xoay ngang / máy tính ⇒ câu mới đọc từ đầu đề.
    const cotDe = gocRef.current?.querySelector<HTMLElement>('.duo-cot-de')
    if (cotDe?.scrollTop) cotDe.scrollTop = 0
  }, [q?.qid]) // eslint-disable-line react-hooks/exhaustive-deps
  // Màn Duo ở khung thấp xoay ngang: tấm kết quả nằm ở cột phải DƯỚI phương án ⇒ đưa tấm (nút «Tiếp tục») vào khung nhìn thay vì cuộn về đầu.
  // MÁY YẾU 30/10 (vết Chrome «Kiểm tra» CPU ×6: `scrollIntoView` + đo phương án ép tính kiểu + bố cục cả màn ~120 ms NGAY trong lượt chạm, trước khi tấm kết
  // quả kịp vẽ): React chạy hiệu ứng của cú chạm ĐỒNG BỘ trước lần sơn ⇒ dời cuộn / đo / tiêu điểm sang SAU khung đầu (rAF → setTimeout). Tấm kết quả hiện
  // ngay khung kế; cuộn chạy lúc bố cục đã sạch (rẻ).
  useEffect(() => {
    if (!k) return
    let raf = 0, hen = 0
    const lam = () => { if (gocRef.current) chinhKhiCoKet() }
    if (document.hidden) hen = window.setTimeout(lam, 0); else raf = requestAnimationFrame(() => { hen = window.setTimeout(lam, 0) })
    return () => { cancelAnimationFrame(raf); clearTimeout(hen) }
  }, [!!k]) // eslint-disable-line react-hooks/exhaustive-deps
  const chinhKhiCoKet = () => {
    const ngangThap = duo && !!window.matchMedia?.('(orientation: landscape) and (max-height: 500px)').matches
    // NGANG 27/10: khung thấp xoay ngang — dải kết quả GHIM ĐÁY trải bề ngang (position: fixed, trong-lam-ngang.css) ⇒ như bản dọc: cuộn cho phương án ĐÚNG
    // nằm trọn trên mép dải (không cuộn về đầu: đề cột trái ghim sẵn). Dải chưa ghim (tờ cũ) ⇒ đưa nút «Tiếp tục» vào khung như trước.
    const ghimNgang = ngangThap && getComputedStyle(nutTiepRef.current?.closest('.duo-day') ?? document.body).position === 'fixed'
    if (ngangThap && !ghimNgang) nutTiepRef.current?.scrollIntoView?.({ block: 'nearest' })
    else {
      if (!ngangThap) veDau()
      // thầy 27/10 (ảnh: tấm kết quả che nửa phương án D): tấm dính đáy ⇒ cuộn thêm cho phương án ĐÚNG nằm trọn trên mép tấm.
      if (duo) requestAnimationFrame(() => {
        const pa = gocRef.current?.querySelector<HTMLElement>('.ht2-lam-pa[data-ket=dung]'), tam = nutTiepRef.current?.closest<HTMLElement>('.duo-day')
        if (!pa || !tam || !['sticky', 'fixed'].includes(getComputedStyle(tam).position)) return
        // 27/10 (nâng cấp): đo thẳng thay vì scrollIntoView «nearest» + scroll-margin (Chrome bỏ qua khi phương án còn trong khung cuộn dù đã nằm dưới tấm
        // dính) ⇒ cuộn đúng khoảng phương án bị che, không đẩy đỉnh phương án lên dưới thanh trên (64 px).
        // Mép trên tấm tính từ offsetHeight (tấm đang trượt lên ⇒ getBoundingClientRect còn lệch theo transform).
        const khung = khungCuonCua(pa)
        const r = pa.getBoundingClientRect(), mepTam = (khung ? khung.getBoundingClientRect().bottom : window.innerHeight) - tam.offsetHeight
        const can = Math.min(r.bottom + 12 - mepTam, r.top - (ngangThap ? 56 : 72))
        if (can <= 0) return
        if (khung) khung.scrollBy({ top: can }); else window.scrollBy({ top: can })
      })
    }
    nutTiepRef.current?.focus({ preventScroll: true })
  }
  // Rung phản hồi kiểu Duolingo (thầy 26/10) — chỉ app học sinh «Trong» (phan-hoi.ts tự kiểm): tấm kết quả đúng / sai, hết chặng.
  useEffect(() => { if (k && !k.choThay && !k.hocCoHoTro && !k.omni?.luot) phanHoi(k.correct ? 'dung' : 'sai') }, [!!k]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (xong) phanHoi('xong') }, [xong])
  // NỘP TỨC THÌ (thầy 27/10): em đang đọc kết quả câu này ⇒ tải sẵn + giải mã sẵn ảnh đề / phương án của câu KẾ (không gồm ảnh lời giải) — bấm «Tiếp tục» là câu hiện đủ ngay, không nghẽn luồng chính trên máy yếu.
  useEffect(() => {
    const sau = k ? cau[viTri + 1] : undefined
    if (!sau) return
    const ds = [...sau.hinhAnh.filter(h => h.viTri !== 'sau_loi_giai').map(h => h.src), sau.thanCauImg, ...(sau.choiceImgs ?? []), ...(sau.ideaImgs ?? [])]
    for (const src of ds) if (src && !src.startsWith('data:')) { const im = new Image(); im.decoding = 'async'; im.src = src; im.decode?.().catch(() => {}) }
  }, [!!k, viTri, cau]) // eslint-disable-line react-hooks/exhaustive-deps
  const nopCau = async () => {
    if (!q || !phien && !phienCho.current || !duTraLoi(q.phan, tra) || gui.current || k) return
    gui.current = true; setNop(true); setCham(true); setLoi('')
    const truoc = ghiTruoc.current
    let xongLuot!: () => void
    const luotNay = new Promise<void>((r) => { xongLuot = r })
    ghiTruoc.current = luotNay
    const qidNop = q.qid
    // NỘP TỨC THÌ (thầy 27/10): trong lúc chờ máy chấm, nạp sẵn mảnh lời giải từng bước (+ màn kết bài khi là câu cuối) — bấm «Lời giải» / hết chặng là có ngay.
    // Chỉ mã giao diện (không có đáp án); đáp án vẫn chỉ về cùng phản hồi chấm.
    if (duo) { void import('../goi-y-cham/LoiGiaiCauCoSoDo').catch(() => {}); if (viTri + 1 >= cau.length) void import('../thuong/KetBaiThuong').catch(() => {}) }
    const msLam = Math.max(0, Date.now() - batDau.current)
    // Chốt đổi / dò đáp án + rời app ngay trước lựa chọn cuối NGAY lúc bấm «Kiểm tra» (trước mọi lần chờ mạng).
    if (!maMay.current) maMay.current = maMayNgan()
    const hanhVi = chotHanhVi(demDoi.current, q.phan, maMay.current)
    const assisted = !!q.goiY || daHoiThay.current === q.qid || hoTroCham.current === q.qid
    // KẾT QUẢ TẠM (dòng 1 của máy chủ, hoặc chấm tại máy): đổi màu đúng / sai NGAY tại dải + đồng bộ tiến độ chặng (0 ms) nếu em bấm thoát ngay sau đó; thưởng / EXP đến cùng phản hồi đầy đủ.
    // Tạm đầu tiên thắng; bản đầy đủ của máy chủ luôn thay (lệch ⇒ theo máy chủ); bản đầy đủ không về ⇒ bỏ tạm (dưới).
    const apKetTam = (o: Record<string, unknown>): boolean => {
      if (typeof o.correct !== 'boolean' || typeof o.answer !== 'string') return false
      const kTam: Ket = { ...(o as unknown as Ket), tam: true, assisted, ...(o.khongTinh === true ? { thuong: { tinh: false, nguyenTu: 0, dong: [], chuoiDung: 0 } } : {}) }
      setKet(v => {
        if (v[qidNop]) return v
        const ketMoi = { ...v, [qidNop]: kTam }
        luuDangRef.current(ketMoi)
        return ketMoi
      })
      ghiCauXong(sbd, q.qid)
      if ((o.omni as { luot?: unknown } | undefined)?.luot !== true) tinhCauMoi(q, { ...ket, [qidNop]: kTam })
      return true
    }
    // ĐÁP ÁN TRÊN MÁY (thầy 31/10): câu mang `dm` ⇒ chấm tại máy TRƯỚC mọi lần chờ mạng (lượt ghi câu trước, mở phiên) — đúng luật chấm của máy chủ; lệnh nộp vẫn gửi như cũ.
    let daXongNop = false // lượt nộp đã kết thúc (đủ / lỗi) ⇒ chấm tại máy về muộn không gắn lại kết quả tạm
    if (duo && q.dm) {
      const dm = q.dm, qidMay = q.qid, traMay = tra
      void moDm(qidMay, dm).then((da) => { const o = da && chamTaiMay(da, traMay, msLam); if (o && !daXongNop) apKetTam(o as unknown as Record<string, unknown>) }).catch(() => {})
    }
    try {
      if (truoc) await truoc // lượt ghi của câu trước (đã bấm «Tiếp tục» khi còn tạm) xong rồi mới gửi câu này
      // GÓI CẢ NGÀY: câu hiện từ máy, phiên còn đang mở nền ⇒ đợi phiên (mã + tem mới của câu này).
      let ph = phien, skCau = q.sk
      if (!ph) {
        const m = await phienCho.current!
        if (!m.id || !m.qids.has(q.qid)) throw new Error('Danh sách câu vừa được cập nhật. Em làm câu đang hiện nhé.')
        ph = m.id
        if (typeof m.sk[q.qid] === 'string') skCau = m.sk[q.qid] as string
      }
      // CHẤM NHANH: dòng TẠM (đúng / sai từ bộ nhớ máy chủ) ⇒ đổi màu đúng / sai NGAY tại dải + đồng bộ tiến độ chặng ngay (0 ms) nếu em bấm thoát ngay sau đó; thưởng / EXP đến cùng phản hồi đầy đủ ngay sau. Bản nháp giữ tới bản đầy đủ.
      const khiTam = (o: Record<string, unknown>) => {
        if (!apKetTam(o)) return
        // TỨC THÌ: nếu là câu cuối và có câu sai (hoặc câu này sai), kích hoạt xin làm lại sớm ngay từ lúc có kết quả tạm!
        if (goi7 && !daXinLamLai.current && !lamLaiSom.current && q.vaiGoi7 !== 'lam_lai' && viTri + 1 >= cau.length && (cauSai.length > 0 || (o.correct === false && (o.omni as { luot?: unknown } | undefined)?.luot !== true))) {
          const p = goiHoa2('hoc-tap-lam-lai', token, { session: ph }, 15)
          p.catch(() => {})
          lamLaiSom.current = p
        }
      }
      const than = { session: ph, qid: q.qid, answer: tra, assisted, msLam, ...(typeof skCau === 'string' && skCau ? { sk: skCau, ...(luotChang.current > 0 ? { lm: luotChang.current } : {}) } : {}), doGiay: dhMs.current >= 1000 ? { g: Math.round(dhMs.current / 1000), v: dhT.current.v, a: dhT.current.a, l: Math.max(dhT.current.l, dhT.current.lang), n: dhT.current.n, w: dhW.current ? 1 : 0, ...hanhVi } : undefined }
      const r = await guiLaiBenVung(() => duo ? nopCauLuong(token, than, 15, khiTam) : goiHoa2('answer', token, than, 15)) // chống trùng theo biên nhận ⇒ kẹt mạng tự gửi lại
      if (typeof r.correct !== 'boolean' || typeof r.answer !== 'string') throw new Error(typeof r.error === 'string' ? r.error : 'Chưa xác nhận được bài nộp. Em thử lại; kết quả không bị tính hai lần.')
      setMsCau(v => ({ ...v, [q.qid]: msLam })); ghiCauXong(sbd, q.qid)
      // LẶP CÂU (27/10): lượt mở chặng trước (Hôm nay gọi sẵn) lập TRƯỚC câu này ⇒ có thể chứa đúng câu em vừa làm — bỏ, hết chặng sẽ mở trước lượt mới.
      boChangMoTruoc()
      if (r.thuong !== undefined) coThuongRef.current = true
      if ((r.omni as { luot?: unknown } | undefined)?.luot === true) luotChang.current++
      // Câu CUỐI của chặng + có câu tự làm sai ⇒ xin vòng làm lại ngay (không chờ bấm «Tiếp tục»: trước ~1,2 s trắng giữa câu cuối và vòng làm lại).
      if (goi7 && !daXinLamLai.current && !lamLaiSom.current && q.vaiGoi7 !== 'lam_lai' && viTri + 1 >= cau.length && (cauSai.length > 0 || (r.correct === false && (r.omni as { luot?: unknown } | undefined)?.luot !== true))) {
        const p = goiHoa2('hoc-tap-lam-lai', token, { session: ph }, 15); p.catch(() => {}); lamLaiSom.current = p
      }
      // CHẤM THEO ĐÚNG ĐÁP ÁN MÁY CHỦ ĐÃ CHẤM (khẩn 12/10 23h — thầy: "hs làm đúng cả 4 ý nhưng app lại báo sai"): mỗi câu của một đợt chỉ chấm MỘT lần
      // (khoá lượt|câu). Giờ cao điểm lần nộp đầu chậm / hết 40 giây ⇒ em sửa đáp án rồi nộp lại ⇒ máy chủ trả kết quả LẦN ĐẦU (`replayed`, kèm `traLoi`
      // đã chấm) — trước đây màn so từng ý bằng đáp án đang chọn ⇒ "Đúng 4/4 ý · sai ý". Nay hiện đúng đáp án đã chấm và ghi rõ là lần nộp trước.
      const daCham = typeof r.traLoi === 'string' && duTraLoi(q.phan, r.traLoi) ? r.traLoi : tra
      if (daCham !== tra) { setTra(daCham); traRef.current = daCham }
      // Lượt đã chấm quyết định tự làm hay có hỗ trợ, kể cả nộp lại trên máy khác. Máy chủ cũ thiếu cờ thì dùng cờ đã gửi.
      const hoTro = (r.attempt as { assisted?: unknown } | undefined)?.assisted
      const kDayDu: Ket = { ...(r as unknown as Ket), assisted: typeof hoTro === 'boolean' ? hoTro : assisted, ...(r.replayed === true && daCham !== tra ? { chamLanTruoc: true } : {}) }
      const ketMoi = { ...ket, [q.qid]: kDayDu }
      setKet(v => ({ ...v, [q.qid]: kDayDu })); try { localStorage.removeItem(khoa) } catch { /* Không cản nhận kết quả. */ }
      // sổ Lửa: đúng cờ `thuong.tinh` máy chủ vừa gửi (câu hỗ trợ / lượt Omni / bản trả lại lần trước không ghi)
      const thLua = docThuongCau(r.thuong)
      if (thLua && r.replayed !== true && !r.choThay && !r.hocCoHoTro && (r.omni as { luot?: unknown } | undefined)?.luot !== true) ghiCauLua(sbd, thLua.tinh, gioMayChu())
      if ((r.omni as { luot?: unknown } | undefined)?.luot !== true) tinhCauMoi(q, ketMoi); else luuDangRef.current(ketMoi)
      capNhatSo()
    } catch (e) {
      // Bản đầy đủ không về được ⇒ bỏ kết quả TẠM (câu chưa chắc đã ghi), giữ nháp, em bấm lại (biên nhận chống trùng ⇒ không tính hai lần).
      setKet(v => { const x = v[qidNop]; if (!x?.tam) return v; if (moi.current.qids.delete(qidNop) && q.vaiGoi7 === 'tiep_can' && moi.current.tiep > 0) moi.current.tiep--; const { [qidNop]: _bo, ...con } = v; return con })
      // Lưới an toàn (30/10, ảnh thầy «Câu không thuộc lượt học.»): mã lượt trên máy không còn chứa câu này (lượt đã thay ở máy chủ) ⇒ không bắt em bấm lại
      // vô ích — bỏ chặng dở trên máy, mở lại chặng (câu đã nộp vẫn tính, số hôm nay giữ nguyên).
      if (e instanceof Error && /không thuộc lượt học/.test(e.message) && !tachRoi.current.has(qidNop)) { xoaChangDangLam(sbd); setLan(n => n + 1); return }
      if (tachRoi.current.has(qidNop)) setLoi(`Câu ${cau.findIndex(c => c.qid === qidNop) + 1} chưa được lưu: ${chuCuaLoi(e, 'mất kết nối máy chủ')}. Em làm lại câu đó ở cuối chặng nhé.`) // đã sang câu khác: báo ở câu đang làm
      else { tiepCho.current = false; nutTiepRef.current?.removeAttribute('data-lun'); setLoi(chuCuaLoi(e, 'Chưa nộp được câu. Đáp án nháp vẫn được giữ.')) }
    }
    finally {
      daXongNop = true
      xongLuot(); if (ghiTruoc.current === luotNay) ghiTruoc.current = null
      // em đã sang câu khác lúc bản đầy đủ chưa về ⇒ cờ gửi / chờ thuộc câu đang làm, không đụng
      if (!tachRoi.current.delete(qidNop)) { gui.current = false; setNop(false); setCham(false); if (tiepCho.current) { tiepCho.current = false; window.setTimeout(() => tiepMoi.current(), 0) } }
    }
  }
  const hocHuongDan = async () => {
    if(!q || !phien && !phienCho.current || gui.current || k)return
    gui.current=true;setNop(true);setLoi('')
    try {
      const ph = phien || await phienCho.current!.then(m => { if (!m.id || !m.qids.has(q.qid)) throw new Error('Danh sách câu vừa được cập nhật. Em làm câu đang hiện nhé.'); return m.id })
      const r=await guiLaiBenVung(()=>goiHoa2('hoc-tap-gap',token,{session:ph,qid:q.qid,chuaTuLam:true},15))
      if(r.ok!==true || !(r.choThay===true || r.hocCoHoTro===true&&typeof r.answer==='string'))throw new Error(typeof r.error==='string'?r.error:'Chưa mở được phần chữa.')
      const ketMoi = { ...ket, [q.qid]: r as unknown as Ket }
      setKet(v=>({...v,[q.qid]:r as unknown as Ket}));ghiCauXong(sbd,q.qid);tinhCauMoi(q, ketMoi);capNhatSo()
    } catch(e){setLoi(chuCuaLoi(e, 'Chưa tải được phần chữa.'))}finally{gui.current=false;setNop(false)}
  }
  // Xong chặng: câu cuối đã nộp ⇒ mở trước chặng sau (em bấm "Học tiếp chặng N" là có câu ngay).
  const ketThuc = () => {
    daXongRef.current = true
    xoaChangDangLam(sbd)
    // xong chặng làm thật (≥ 2/3 câu của chặng được tính, vd 4/6) ⇒ Lửa vui lại 30 phút (sổ trên máy)
    const cauChang = soGoc ? cau.slice(0, soGoc) : cau
    ghiXongChangLua(sbd, cauChang.filter(c => docThuongCau(ket[c.qid]?.thuong)?.tinh === true).length, cauChang.length, gioMayChu())
    const goc = gocRef.current, kh = goc ? khungCuonCua(goc) : null
    if (kh && kh.scrollTop > 0) { kh.scrollTop = 0; daVeDau.current = true }
    startTransition(() => {
      setXong(true)
    })
    if (moi.current.d0 >= 0 && moi.current.qids.size > 0) vaSo(moi.current.d0 + moi.current.qids.size)
    else onVaRef.current?.(k => (k ? { ...k } : k))
    canTaiSanh.current = false
    onCapNhat()
    henNapLai(() => capNhatRef.current())
    boChangMoTruoc()
    void napGoiNgay(token, goiHoa2, Date.now(), true)
    moChangTruoc(token)
  }
  // A3 — câu cũ trượt trái mờ dần (bản sao, không trễ bước sang câu mới; chỉ màn Duo).
  // 27/10 MƯỢT (đo scripts/do-muot-hs.mjs): sang câu mới ⇒ đo khối câu cũ + cuộn khung về đầu NGAY TRONG lượt bấm, lúc bố cục còn sạch (rẻ), rồi mới dựng
  // câu mới. Trước: `scrollIntoView` chạy SAU khi câu mới dựng ⇒ ép trình duyệt tính lại kiểu + bố cục cả màn thêm một lượt (~35–60 ms ở CPU ×6).
  const daVeDau = useRef(false)
  // 27/10 MƯỢT (đo chuyển câu CPU ×6): khối giám thị + đề (`.duo-gt-san`) KHÔNG dựng lại mỗi câu — giám thị (~160 / ~220 phần tử của cột đề) đứng yên
  // trong cây, chỉ phần chữ đề / nhãn / lệnh đổi theo câu (gắn key theo câu). Hiệu ứng «trượt vào» của khối (CSS duo-vao, chạy khi phần tử mới gắn) được
  // chạy lại bằng Web Animations cùng thông số — nhìn y như cũ; máy yếu / giảm chuyển động: không chạy (như CSS).
  const sanRef = useRef<HTMLDivElement>(null), sanQid = useRef('')
  // CHẶNG NGANG 01/11: xoay ngang / máy tính hai cột ⇒ khung câu (`.duo-than`) là display: contents (không có hộp để mờ / chụp bản sao) ⇒ trượt + ẩn TỪNG CỘT.
  const khoiCau = (): HTMLElement[] => {
    const than = gocRef.current?.querySelector<HTMLElement>('.duo-than')
    if (!than) return []
    return getComputedStyle(than).display === 'contents' ? Array.from(than.querySelectorAll<HTMLElement>(':scope > .duo-cot-de, :scope > .duo-cot-tra')) : [than]
  }
  useLayoutEffect(() => { for (const e of gocRef.current?.querySelectorAll<HTMLElement>('.duo-than, .duo-cot-de') ?? []) e.style.removeProperty('opacity') }, [q?.qid, xong])
  // Rời app GIỮA chặng (đã trả lời ≥ 1 câu, chưa kết chặng) ⇒ báo máy chủ lập lại bản sẵn Sảnh + chặng (mo-chang-truoc.ts); câu cuối chặng máy chủ vốn đã lập sẵn.
  const dangDoRef = useRef(false)
  dangDoRef.current = !xong && Object.keys(ket).length > 0
  useEffect(() => nghePhanAnRoiApp(() => dangDoRef.current, token), [token])
  // Lưu tức thì toàn bộ tiến độ chặng đang làm (câu đang mở, các câu đã nộp, nháp, chọn cách làm, gợi ý, lời giải, đồng hồ câu) để thoát bất thình lình mở lại đúng chỗ 0ms.
  const luuDangRef = useRef<(ketMoi?: Record<string, Ket>) => void>(() => {})
  luuDangRef.current = (ketMoi) => {
    if (!sbd || tai || xong || daXongRef.current || !cau.length) return
    const ketLuu = ketMoi ?? ket
    const daLamLuu = moi.current.d0 >= 0 ? Math.max(dem?.daLam ?? 0, moi.current.d0 + moi.current.qids.size) : (dem?.daLam ?? 0)
    luuChangDangLam(sbd, {
      moLuc: moLucRef.current,
      phien, cau: cau as unknown as Record<string, unknown>[], soGoc: soGoc || cau.length,
      viTri: Math.max(0, Math.min(cau.length - 1, viTri)), ket: ketLuu, tra: traRef.current,
      chang, goi7, dem: dem ? { ...dem, daLam: daLamLuu } : dem,
      moi: { qids: [...moi.current.qids], tiep: moi.current.tiep, d0: moi.current.d0, ngay: moi.current.ngay },
      tuLam, goiY, moLoiGiai, msCau, dhMs: dhMs.current, dhT: { ...dhT.current },
      daXinLamLai: daXinLamLai.current, luotChang: luotChang.current,
      daHoiThay: daHoiThay.current, hoTroCham: hoTroCham.current,
    })
  }
  // MÁY YẾU (đo scripts/do-muot-hs.mjs CPU ×6, 30/10): ghi cả chặng (đề + kết quả, vài chục KB) vào localStorage NGAY trong lượt bấm «Kiểm tra» / «Tiếp tục» / mỗi lần gõ
  // làm chậm thêm 35–50 ms mỗi lượt ⇒ gom ghi 400 ms sau thay đổi cuối. Rời app (ẩn tab / đóng trang / rời màn) vẫn ghi NGAY như trước — thoát bất thình lình không mất gì.
  useEffect(() => { const h = window.setTimeout(() => luuDangRef.current(), 400); return () => window.clearTimeout(h) }, [sbd, tai, xong, phien, cau, soGoc, viTri, ket, tra, tuLam, goiY, moLoiGiai, msCau, dem, moi, goi7, chang])
  useEffect(() => {
    const f = () => { if (document.visibilityState === 'hidden') luuDangRef.current() }
    const g = () => luuDangRef.current()
    document.addEventListener('visibilitychange', f)
    window.addEventListener('pagehide', g)
    return () => { luuDangRef.current(); document.removeEventListener('visibilitychange', f); window.removeEventListener('pagehide', g) }
  }, [])
  useLayoutEffect(() => {
    const san = sanRef.current, id = q?.qid ?? ''
    if (!san) { sanQid.current = ''; return }
    if (sanQid.current && sanQid.current !== id && !yenLang() && typeof san.animate === 'function') san.animate([{ opacity: 0, transform: 'translateX(40px)' }, { opacity: 1, transform: 'none' }], { duration: 180, easing: 'ease-out', fill: 'backwards' })
    sanQid.current = id
  })
  const truotCauCu = () => {
    const goc = gocRef.current, khoi = duo ? khoiCau() : []
    const rs = khoi.map((e) => e.getBoundingClientRect())
    const kh = goc ? khungCuonCua(goc) : null
    if (goc && kh) { const lech = goc.getBoundingClientRect().top - kh.getBoundingClientRect().top; if (lech) kh.scrollTop += lech; daVeDau.current = true }
    else if (goc && !kh && goc.getBoundingClientRect().top === 0) daVeDau.current = true // không khung nào cuộn được, màn đã ở đầu ⇒ khỏi cuộn
    khoi.forEach((e, i) => truotRa(e, 180, rs[i], 'svg.gtv'))
  }
  // Hết câu của chặng mà có câu TỰ LÀM SAI ⇒ xin vòng làm lại MỘT lần. Rỗng / lỗi mạng ⇒ vào màn kết chặng như cũ. Đang xin ⇒ chạm lặp không kết chặng giữa chừng.
  const xinLamLai = async () => {
    daXinLamLai.current = true; gui.current = true; setNop(true)
    try {
      const som = lamLaiSom.current; lamLaiSom.current = null
      const r = await (som ?? goiHoa2('hoc-tap-lam-lai', token, { session: phien }, 15)).catch(() => goiHoa2('hoc-tap-lam-lai', token, { session: phien }, 15)) // lệnh xin sớm lỗi ⇒ xin lại MỘT lần (máy chủ trả đúng vòng đã cấp nếu đã cấp)
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
  // 27/10 MƯỢT (máy yếu, đo CPU ×6): dựng câu kế trong lượt «chuyển tiếp» của React — chia nhỏ, không giữ luồng chính một mạch 250–350 ms ⇒ nút vừa
  // bấm lún ngay, câu mới hiện ngay sau đó (28/10: máy thường cũng vậy, xem dưới).
  const dangSang = useRef(-1)
  const tiep = () => {
    // TỨC THÌ 100%: kết quả còn TẠM (bản đầy đủ đang về nền) ⇒ tách rời lượt ghi chạy tiếp nền, sang câu mới hoặc kết thúc chặng TỨC THÌ 0ms, không đứng đợi mạng!
    if (gui.current && k?.tam && q) {
      tachRoi.current.add(q.qid)
      gui.current = false
      setNop(false)
      setCham(false)
    }
    if (gui.current || dangSang.current === viTri) return
    setLoi('')
    setCombo(null) // băng combo chỉ sống ở câu vừa đúng — sang câu mới thì tắt, không che đề
    if (viTri + 1 < cau.length) {
      // 28/10 MƯỢT (thầy: «tách việc dài SAU lần vẽ phản hồi đầu»): lượt chạm chỉ đổi phần nhỏ (nút, tấm kết quả) ⇒ khung kế vẽ ngay; việc nặng (bản sao
      // trượt ra, dựng câu kế) chạy SAU lần vẽ đó (rAF + setTimeout 0). `dangSang` chặn chạm đúp tới khi câu kế hiện.
      dangSang.current = viTri
      nutTiepRef.current?.setAttribute('data-lun', '') // 28/10 MƯỢT: nút giữ dáng lún tới khi câu kế hiện (trong-lam-bai.css) — phản hồi chạm vẽ ngay khung kế
      // 28/10 MƯỢT: bỏ tiêu điểm khỏi nút «Tiếp tục» TRƯỚC khi tấm kết quả rời cây — gỡ phần tử đang giữ tiêu điểm bắt trình duyệt tính kiểu + bố cục
      // ngay giữa lượt React gỡ nút (vết ×4: ~30 ms). Sau khi đổi câu tiêu điểm vẫn về trang như cũ.
      const sauKhiVe = (f: () => void) => { const g = () => { (document.activeElement as HTMLElement | null)?.blur?.(); f() }; if (document.hidden) window.setTimeout(g, 0); else requestAnimationFrame(() => { window.setTimeout(g, 0) }) }
      // máy yếu: không có hiệu ứng trượt; cuộn về đầu để sau khi câu mới dựng (không kéo câu cũ lên đầu trong lúc chờ)
      if (yenLang()) sauKhiVe(() => {
        // khung đang ở đầu (đọc lúc bố cục còn sạch — rẻ) ⇒ câu mới khỏi `scrollIntoView` sau khi dựng (mỗi lần là một lượt ép bố cục cả màn)
        const goc = gocRef.current, kh = goc ? khungCuonCua(goc) : null
        if (goc && (kh ? kh.scrollTop === 0 : goc.getBoundingClientRect().top === 0)) daVeDau.current = true
        startTransition(() => setViTri(i => i + 1))
      })
      else if (duo) sauKhiVe(() => {
        // máy thường: bản sao câu cũ trượt ra phủ trên ⇒ câu thật ẩn bằng opacity (một phần tử, không lan xuống con) và câu kế dựng trong lượt chuyển
        // tiếp (chia nhỏ) — không giữ luồng chính một mạch ~200 ms. Câu kế gắn thì hiện lại (layout effect theo qid).
        truotCauCu()
        for (const e of khoiCau()) e.style.setProperty('opacity', '0')
        startTransition(() => setViTri(i => i + 1))
      })
      else { dangSang.current = -1; truotCauCu(); setViTri(i => i + 1) }
    }
    else if (goi7 && !daXinLamLai.current && !laLamLai && cauSai.length > 0) void xinLamLai()
    else ketThuc()
  }
  tiepMoi.current = tiep
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
        <button type="button" className="ht2-lam-nut ht2-lam-nut-phu" onClick={onVe}>Nghỉ và về {tenTrangChinh()}</button>
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
  // Tranh phân tử trong ô phương án (chỉ màn Duo): bốn ô cùng kiểu — mảnh tranh tự bỏ nếu một phương án không có trong từ điển.
  const tranhPa = duo && q?.phan === 'I' && coDangChat(q.choices as string[]) ? [0, 1, 2, 3].map((i) => <TranhPa key={i} choices={q.choices as string[]} i={i} />) : undefined
  const khoiTraLoi = !q ? null : <>
    {dangTraLoi && (q.phan === 'II' ? <ChonDungSai q={q} value={tra} khoa={nop} onChon={(i, v) => { const a = tra.padEnd(4, '-').split(''); a[i] = v; doiTra(a.join('')) }} />
      : q.phan === 'I' ? <ChonTracNghiem q={q} value={tra} khoa={nop} onChon={doiTra} tranh={tranhPa} />
      : <OTraLoiNgan value={tra} soO={soO} />)}
    {k && !k.choThay && (q.phan === 'II' ? <PhanHoiDungSai q={q} tra={traHien} dapAn={k.answer} lyDo={(chu) => lg?.tungY?.[chu]?.viSao} />
      : q.phan === 'I' ? <PhanHoiTracNghiem q={q} tra={traHien} dapAn={k.answer} tranh={tranhPa} />
      : <PhanHoiTraLoiNgan tra={traHien} dapAn={k.answer} dung={k.correct} soO={soO} />)}
  </>
  const ghiTraLoi = !q ? null : <>
    {dangTraLoi && q.goiY && <p className="ht2-lam-ghi"><Lightbulb size={14} aria-hidden="true" />Câu có gợi ý: tính là có hỗ trợ.</p>}
  </>

  const homNayO = homNayHien ? <span className="ht2-lam-hom-nay"><b aria-hidden="true">{homNayHien.daLam}/{homNayHien.muc}</b><small aria-hidden="true">câu hôm nay</small><span className="ht2-an">Hôm nay đã làm {homNayHien.daLam} trên {homNayHien.muc} câu</span></span> : <span />

  const ntBaiNay = () => cau.reduce((t, c) => t + (docThuongCau(ket[c.qid]?.thuong)?.nguyenTu ?? 0), 0)
  // Chuỗi đúng liền (màn Duo): số trình bày suy từ kết quả các câu ĐÃ CHẤM của chặng (sai / có hỗ trợ ⇒ về 0), không gửi máy chủ; vòng làm lại không tính.
  let chuoi = 0
  for (const c of goc) { const r = ket[c.qid]; if (!r) break; chuoi = r.correct && !r.assisted && !r.choThay && !r.hocCoHoTro && !r.omni?.luot ? chuoi + 1 : 0 }
  // A4 — đúng ⇒ 8 hạt lục giác bung từ ô đúng (hoặc từ Bi ở tấm kết quả); A6 — chuỗi ≥ 3 ⇒ băng combo + tiếng chuông lên một nốt mỗi bậc.
  useEffect(() => {
    if (!duo || !q || !k || !k.correct || k.choThay || k.hocCoHoTro || k.omni?.luot || daCong.current.has(q.qid)) return
    const g = gocRef.current
    banHat(g?.querySelector('.ht2-lam-pa[data-ket=dung], .ht2-lam-o-hang[data-ket=dung]') ?? g?.querySelector('.duo-ket .duo-tick'), { so: 8, xa: 72 })
  }, [!!k]) // eslint-disable-line react-hooks/exhaustive-deps
  // Băng chuỗi đúng: cần biết máy chủ có gửi thưởng không ⇒ chờ bản ĐẦY ĐỦ (kết quả tạm của chấm nhanh chưa có `thuong`).
  const kDu = !!k && !k.tam
  useEffect(() => {
    if (!duo || !q || !k || k.tam || !k.correct || k.choThay || k.hocCoHoTro || k.omni?.luot || daCong.current.has(q.qid)) return
    if (laLamLai || chuoi < 3 || k.thuong !== undefined || mocCombo(chuoi)) return // máy chủ gửi thưởng ⇒ băng chuỗi đúng của thưởng phạt (BangComboTp) thay băng cũ; mốc 3 · 5 · 10 ⇒ hiệu ứng mốc (dưới)
    setCombo({ n: chuoi, id: q.qid })
    const t = window.setTimeout(() => phanHoi('combo', chuoi - 3), 280)
    return () => window.clearTimeout(t)
  }, [kDu]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (!combo) return; const t = window.setTimeout(() => setCombo(null), 2200); return () => window.clearTimeout(t) }, [combo])
  // Lượt thưởng / mốc combo (làm lại 27/10): câu được tính có nguyên tử (đúng, hoặc sai mà «Làm nghiêm túc») ⇒ viên «+N» bật cạnh bộ đếm; mốc chuỗi đúng
  // liền 3 · 5 · 10 chỉ ở câu ĐÚNG. N = `thuong.nguyenTu` của máy chủ; phần chuỗi / dây chuyền / nghiêm túc trong các dòng máy chủ ⇒ viên cam thứ hai.
  useEffect(() => {
    if (k?.tam) return // kết quả tạm (chấm nhanh): viên «+N» / mốc chuỗi chờ thưởng của bản đầy đủ
    if (!duo || !q || !k || k.choThay || k.hocCoHoTro || k.omni?.luot || laLamLai || daCong.current.has(q.qid)) { setLuot(null); return }
    const t = docThuongCau(k.thuong)
    const N = t?.tinh && t.nguyenTu > 0 ? t.nguyenTu : 0
    const n = !k.correct ? 0 : t ? (t.tinh ? t.chuoiDung : 0) : chuoi
    const moc = !k.correct || (t && !t.tinh) ? 0 : mocCombo(n)
    const phu = (t?.dong ?? []).filter((d) => /chuỗi|dây chuyền|nghiêm túc|combo/i.test(d.nhan) && d.so > 0).reduce((a, d) => a + d.so, 0)
    setLuot(N || moc ? { id: q.qid, N, phu, moc, chuoi: n } : null)
  }, [kDu]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!luot) return
    let tre = luot.N > 0 ? ntBaiNay() - luot.N : null
    daCong.current.delete(luot.id)
    const huy = chayThuong({ goc: gocRef.current?.querySelector('.duo-than') ?? null, day: gocRef.current?.querySelector('.duo-ket') ?? null, dem: demRef.current, bi: biGomRef.current,
      N: luot.N, phu: luot.phu, moc: luot.moc, chuoi: luot.chuoi, onSo: (them) => { daCong.current.add(luot.id); if (tre === null) return; tre += them; setNtTre(tre) } }, yenLang())
    return () => { huy(); setNtTre(null) }
  }, [luot]) // eslint-disable-line react-hooks/exhaustive-deps
  // Kết bài thưởng phạt: câu cuối có `ketBai` (vòng làm lại thì lấy bản MỚI NHẤT). Xong ⇒ đọc lại tổng quan (thanh trên Lộ trình đổi số).
  const ketBaiGoc = (() => { for (let i = cau.length - 1; i >= 0; i--) { const x = ket[cau[i]!.qid]?.ketBai; if (x) return x } return undefined })()
  const ketBaiTp = duo && xong && ketBaiGoc ? docKetBai(ketBaiGoc) : null
  useEffect(() => { if (ketBaiTp) void capNhatTongQuan(token) }, [!!ketBaiTp]) // eslint-disable-line react-hooks/exhaustive-deps
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
  // GIỮ CHÂN (màn Duo): đã chấm ≥ 1 câu, chặng chưa xong và còn câu phải làm ⇒ X / Esc / back mở tấm thay vì thoát thẳng.
  useEffect(() => { if (duo) { napSanGiuChan(); void import('../giam-thi/GiamThi').catch(() => {}); hamNongTuDien() } }, [duo]) // nạp sẵn mảnh giám thị + hâm nóng bộ dò chạm-hiểu-đề trong lúc chờ câu
  // 27/10 MƯỢT: màn làm chặng che kín Lộ trình (khung `inert` của cổng) ⇒ trình duyệt bỏ qua kiểu / bố cục / vẽ của Lộ trình suốt lúc làm (src/lib/an-khi-bi-che.ts)
  useEffect(() => { const tr = document.querySelector('.ht2')?.closest<HTMLElement>('[inert]'); return tr ? batAnKhiBiChe(tr) : undefined }, [])
  const conLai = cau.length - viTri - (k ? 1 : 0)
  const daChamGoc: CauDaCham[] = goc.flatMap((c) => {
    const r = ket[c.qid]
    if (!r) return []
    const hoTro = !!(r.choThay || r.hocCoHoTro), t = docThuongCau(r.thuong)
    return [{ d: r.correct === true && !hoTro, tu: !hoTro && !r.assisted && !r.omni?.luot, tinh: !hoTro && !r.omni?.luot && t?.tinh !== false, kho: t?.cauKho }]
  })
  const giu = useGiuChan({ bat: duo && !!q && conLai >= 1 && canGiuChan(Object.keys(ket).length, xong), onThoat: onVe })
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
    // Thưởng phạt: thưởng của câu vừa chấm; `tinh: false` (câu chưa được tính) ⇒ tấm xám trung tính, KHÔNG «Chính xác / Chưa đúng», không nhãn nào khác.
    const th = k ? docThuongCau(k.thuong) : null
    const khongTinh = th?.tinh === false
    const truocQ = viTri > 0 ? cau[viTri - 1] : undefined
    const chuoiTruocTp = truocQ ? docThuongCau(ket[truocQ.qid]?.thuong)?.chuoiDung ?? 0 : 0
    // Nguyên tử của bài (cộng thưởng các câu đã chấm) — thay số «chuỗi đúng liền» ở thanh trên khi máy chủ gửi thưởng («EXP» ⇒ «nguyên tử»).
    const coNt = cau.some(c => ket[c.qid]?.thuong !== undefined)
    const ntBai = coNt ? cau.reduce((t, c) => t + (docThuongCau(ket[c.qid]?.thuong)?.nguyenTu ?? 0), 0) : 0
    const ntCau = q && k && !k.choThay && !k.hocCoHoTro && !k.omni?.luot && !laLamLai ? docThuongCau(k.thuong) : null
    const ntHien = ntTre ?? (q && ntCau?.tinh && !daCong.current.has(q.qid) ? ntBai - ntCau.nguyenTu : ntBai)
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
    // DÒNG LỆNH to đậm kiểu Duolingo («Chọn hình ảnh đúng») + nút bóng đèn nhỏ cạnh (gộp «Gợi ý» / «Học cách giải» — bỏ nút lẻ dưới đáy).
    const soPa = q?.phan === 'I' && pa.every((c) => /^\s*[-−]?\d+(?:[.,]\d+)?\s*(?:gam|g|mol|lít|ml|%|kJ)?\.?\s*$/i.test(c ?? ''))
    const lenh = q?.phan === 'II' ? 'Chọn Đúng hoặc Sai cho từng ý' : q?.phan === 'III' ? 'Tính rồi nhập đáp án' : soPa ? 'Tính rồi chọn đáp án' : 'Chọn đáp án đúng'
    const danhDauHoTro = () => { if (q && !k) hoTroCham.current = q.qid }
    // nutBatDau (hợp đồng chạm để hiểu đề): nút «Bắt đầu từ đâu?» của ruột đưa vào ô trong tấm bóng đèn «Trợ giúp» (TroGiupDuo), cạnh «Gợi ý».
    const nutBatDau = (nut: ReactNode) => oNutCham && !k ? createPortal(nut, oNutCham) : null
    const linkHoi = q && <NutHoiThay gon dangLam={!k} chi="hoi" qid={q.qid} nguon="bai_hang_ngay" dapAnEm={k ? traHien : undefined} tong={k ? (khongTinh ? 'trung' : tt) : undefined} onHoi={k ? undefined : () => { daHoiThay.current = q.qid }} />
    // Thầy 27/10 («rối quá, ẩn đi, bấm vào mới hiện» ⇒ «Cho chỗ khoanh vào cái bóng đèn luôn nhé»): MỌI trợ giúp của câu (Bắt đầu từ đâu? · Gợi ý ·
    // Học cách giải · Hỏi thầy) gom vào bóng đèn này — bấm ⇒ tấm nhỏ bật xuống (TroGiupDuo); thanh đáy chỉ còn KIỂM TRA. Cùng các nút cũ, cùng hành vi.
    const nutDen = !q || !dangTraLoi ? null : <TroGiupDuo key={q.qid}>
      <span ref={setONutCham} className="duo-o-nut-cham" />
      {q.goiY && <button type="button" className="duo-lien" aria-expanded={goiY} aria-controls="ht2-lam-goi-y" onClick={() => setGoiY(v => !v)}><Lightbulb size={18} aria-hidden="true" />{goiY ? 'Thu gợi ý' : 'Gợi ý'}</button>}
      {coHuongDan && <button type="button" className="duo-lien" onClick={() => void hocHuongDan()} disabled={nop}><BookOpen size={18} aria-hidden="true" />Học cách giải</button>}
      {linkHoi}
    </TroGiupDuo>
    const loiGiu = giu.mo ? (() => {
      const tq = layTam<TongQuanThuong>(khoaTam(DUONG.tongQuan, token))
      return loiGiuChan({ conLai, lamLai: laLamLai, soCau: goc.length, daCham: daChamGoc, coThuong: coNt, chuoi: chuoiHomNay(tq?.chuoiNgay, ngayVn()), cauHomNay: homNayHien?.daLam, mucTieu: tq?.mucTieu })
    })() : null
    const dongVien = q && k && tt === 'sai' && !khongTinh && !laLamLai ? loiDongVien(daChamGoc) : ''
    const bangNhac = q && !xong ? loiBangNhac({ viTri: viTri, soCau: goc.length, chang, lamLai: laLamLai, daCham: !!k }) : ''
    // Giám thị: câu có mức độ ⇒ con của mức ấy đứng cạnh đề; tấm kết quả dùng dấu tròn ✓ / ✗ thay Bi (giám thị đã phản ứng). Không mức ⇒ y cũ.
    const mucGt = q ? mucGiamThi(q) : null
    const ketGt = !k ? null : khongTinh ? 'chua-tinh' as const : tt === 'trung' ? 'trung' as const : tt === 'sai' ? 'sai' as const : chuoi >= 3 && !laLamLai ? 'combo' as const : 'dung' as const
    // thầy 27/10 «Lời giải từng bước cho lên hàng chưa đúng, làm nhỏ lại»: nút nhỏ ở BÊN PHẢI hàng tiêu đề dải (kiểu icon cờ Duolingo), mọi dải đúng / sai /
    // chưa tính; khổ hẹp + tiêu đề dài ⇒ chỉ còn icon sách (tên đọc màn hình giữ «Lời giải từng bước»).
    const nutLg = q && k && !k.choThay ? <button type="button" className="duo-ct-lg" aria-label="Lời giải từng bước" onClick={() => setMoLoiGiai(true)}><BookOpen size={18} aria-hidden="true" /><span>Lời giải</span></button> : null
    const dauDai = (tieu: ReactNode, chu: string) => <div className="duo-ct-dau" data-dai={chu.length > 12 || undefined}>{tieu}{nutLg}</div>

    const day = tai ? null
      : xong ? <div className="duo-day" data-xong=""><div className="duo-giua">
          <button type="button" className="duo-nut" onClick={() => { phanHoi('chon'); setLan(n => n + 1) }}>{chuHocTiep}</button>
          <div className="duo-bo"><button type="button" className="duo-lien" onClick={onVe}>Về {tenTrangChinh()}</button></div>
        </div></div>
      : !q ? null
      : k ? <section className="duo-day duo-ket" data-tt={khongTinh ? 'trung' : tt} data-tp-trung={khongTinh || undefined} role="status" aria-live="polite"><div className="duo-giua">
          <BungDung key={q.qid} loai={khongTinh ? 'trung' : tt === 'dung' || tt === 'sai' ? tt : 'trung'} />{/* thầy 27/10 (video Duolingo): mây bọt — đúng: xanh + hạt vuông · sai: đỏ nhạt + hạt tròn · chưa tính: xám, không hạt */}
          <div className="duo-kq">
            {/* 27/10 (thầy: «dải … như dolingo»; phối hợp giám thị đứng trái đề): dải đúng / sai chỉ có dấu tròn tick / × ở tiêu đề — không đặt Bi */}
            {tt === 'trung' && !khongTinh ? <span className="duo-kq-o" aria-hidden="true"><BookOpen size={26} /></span> : null}
            <div className="duo-kq-chu">
              {/* 27/10 (thầy: «phần màu xám … làm cho tinh tế lại»): tấm CHƯA ĐƯỢC TÍNH gọn kiểu Duolingo — dấu (i) tròn nhỏ cùng dòng tiêu đề ngắn, một dòng
                  phụ (không nhãn lười: máy chủ chỉ báo `tinh: false`, không nói vì sao), «Lời giải từng bước» là liên kết nhỏ ở góc phải hàng tiêu đề.
                  TamThuong vẫn gắn (ẩn) để giữ tiếng / rung «không tính» như cũ. */}
              {khongTinh ? <>
                {dauDai(<h2><span className="duo-ct-i" aria-hidden="true"><Info size={20} strokeWidth={2.6} /></span>Chưa được tính</h2>, 'Chưa được tính')}
                <p className="duo-mo">Đọc kĩ đề rồi làm nhé.</p>
                <span hidden><TamThuong thuong={th} /></span>
              </>
              : tt === 'dung' ? <>{dauDai(<h2><svg className="duo-tick" viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path d="M5 12.5 10 17.5 19 7" /></svg>{laLamLai ? 'Làm lại đúng' : LOI_KHEN[viTri % LOI_KHEN.length]}</h2>, laLamLai ? 'Làm lại đúng' : LOI_KHEN[viTri % LOI_KHEN.length]!)}<TamThuong thuong={th} demLen />{cotLoi && <p><ChemText text={cotLoi} /></p>}</>
              : tt === 'sai' ? <>{dauDai(<h2><svg className="duo-tick" data-sai="" viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path d="M7 7 17 17M17 7 7 17" /></svg>Chưa đúng</h2>, 'Chưa đúng')}<TamThuong thuong={th} demLen />{dongVien && <p className="giu-dong-vien">{dongVien}</p>}
                  <p><b>{q.phan === 'II' && ketDai ? ketDai.tieu : <>Đáp án đúng: <ChemText text={chuDapAnDuo} /></>}</b></p>
                  <p className="duo-mo">{(lyDoEm || cotLoi) && <><ChemText text={lyDoEm || cotLoi} />{' '}</>}{laLamLai ? 'Câu gốc vẫn' : 'Câu này đã'} vào lịch ôn <span className="duo-lien-chu">1 · 3 · 7 ngày</span>.</p></>
              : <>{dauDai(<h2>{ketDai?.tieu}</h2>, ketDai?.tieu ?? '')}<TamThuong thuong={th} demLen />{ketDai?.phu && <p className="duo-mo">{ketDai.phu}</p>}</>}
              {lanTruoc && !khongTinh && <p className="duo-mo">Chấm theo đáp án em nộp lần trước.</p>}
            </div>
          </div>
          {loi && <p className="duo-loi" role="alert">{loi}</p>}
          {/* thầy 27/10: Hỏi thầy (nút 3D phụ ~1/4, trái) + «Tiếp tục» CÙNG MỘT HÀNG */}
          <div className="duo-hang-nut">{linkHoi}<button ref={nutTiepRef} type="button" className="duo-nut" data-sac={tt === 'sai' && !khongTinh ? 'do' : khongTinh ? 'lam' : undefined} onClick={() => { phanHoi('chon'); tiep() }}>Tiếp tục</button></div>
        </div></section>
      // CHẤM NHANH (28/10): chạm «Kiểm tra» ⇒ dải kết quả trượt lên NGAY ở trạng thái trung tính «Đang chấm…»; kết quả về ⇒ CÙNG dải đổi màu đúng / sai tại chỗ.
      : cham ? <section className="duo-day duo-ket" data-tt="cho" role="status" aria-live="polite" aria-busy="true"><div className="duo-giua">
          {/* thầy 28/10 «Ẩn cái chữ đang chấm»: dải vẫn trượt lên ngay (phản hồi chạm), không hiện chữ chờ — trình đọc màn hình vẫn đọc «Đang chấm» */}
          <div className="duo-kq"><div className="duo-kq-chu"><div className="duo-ct-dau"><h2 className="sr-only">Đang chấm</h2></div></div></div>
          <div className="duo-hang-nut"><button ref={nutTiepRef} type="button" className="duo-nut" data-cho="" aria-busy="true" disabled>Kiểm tra</button></div>
        </div></section>
      : choChonCach ? <div className="duo-day"><div className="duo-giua">
          <div className="duo-hai">
            <button type="button" className="duo-nut" data-sac="vang" onClick={() => { phanHoi('chon'); void hocHuongDan() }} disabled={nop}>Học cách giải</button>
            <button type="button" className="duo-nut" onClick={() => { phanHoi('chon'); setTuLam(true) }} disabled={nop}>Tự làm câu này</button>
          </div>
          {loi && <p className="duo-loi" role="alert">{loi}</p>}
        </div></div>
      : <div className="duo-day"><div className="duo-giua">
          {loi && <p className="duo-loi" role="alert">{loi}</p>}
          <button type="button" className="duo-nut" onClick={(e) => { e.currentTarget.setAttribute('data-lun', ''); phanHoi('chon'); void nopCau() }} disabled={nop || !duocNop}>{q.phan === 'II' && soYChua ? `Còn ${soYChua} ý chưa chọn` : 'Kiểm tra'}</button>
        </div></div>

    // MÀN KẾT BÀI thưởng phạt (bản vẽ tp-3): một màn đủ «được bao nhiêu nguyên tử, vì sao · hôm nay còn mấy bài · hạng giải». «Tiếp tục» ⇒ về Lộ trình;
    // bài ĐẦU TIÊN trong ngày (mục tiêu ngày 1 bài) và có chuỗi ngày ⇒ Lộ trình mở «Chuỗi ngày» lửa bùng (C1). Đang nạp mảnh ⇒ màn xong chặng cũ.
    if (xong && ketBaiTp) {
      const tqLuu = layTam<TongQuanThuong>(khoaTam(DUONG.tongQuan, token))
      const phu = [tenChuong, chang ? `chặng ${chang}` : '', `${goc.length} câu`].filter(Boolean).join(' · ')
      const veLoTrinh = () => {
        if (ketBaiTp.mucTieu?.daXong === 1 && tqLuu?.chuoiNgay) window.dispatchEvent(new Event(SU_KIEN_MO_CHUOI))
        onVe()
      }
      return <div ref={gocRef} className="ht-app ht2-lam duo" data-duo="" data-xong="">
        <Suspense fallback={<main className="duo-than"><section className="duo-xong" aria-label="Kết quả chặng"><div className="duo-xong-bi"><Bi cam="mung" size={135} /></div><h1>{chang ? `Xong chặng ${chang}!` : 'Xong chặng học!'}</h1></section></main>}>
          <KetBaiThuong ketBai={ketBaiTp} hang={tqLuu?.giai?.hang} bat={tqLuu?.bat} phu={phu} onTiep={veLoTrinh} cauHomNay={homNayHien} />
        </Suspense>
      </div>
    }
    // CHẶNG NGANG 01/11 (styles/trong-chang-ngang.css): `data-chang` = gốc riêng màn làm chặng (màn thi / kiểm tra / sửa câu dùng chung lớp .duo KHÔNG đổi);
    // `data-phan` = loại câu (đúng–sai dành cột trả lời rộng hơn); `data-ket` = dải kết quả đang hiện (đang chấm / đã chấm) ⇒ điện thoại ngang chừa hàng đáy cho dải.
    return <div ref={gocRef} className="ht-app ht2-lam duo" data-duo="" data-chang="" data-phan={q?.phan} data-ket={!xong && (!!k || cham) ? '' : undefined} data-hai-cot={deDai || undefined} data-xong={xong || undefined} data-tt={k ? tt : undefined}>
      {!xong && <header className="duo-tren">
        {/* thầy 27/10 (video Duolingo): đúng liền ≥ 2 câu ⇒ nhãn nhỏ «COMBO ×N» ngay TRÊN thanh tiến độ, số theo chuỗi */}
        {chuoi >= 2 && !laLamLai && <span key={chuoi} className="duo-combo-nhan" aria-hidden="true">COMBO ×{chuoi}</span>}
        <button type="button" className="duo-dong" onClick={giu.xinThoat} disabled={nop} aria-label={`Lưu và về ${tenTrangChinh()}`}><XIcon size={26} aria-hidden="true" /></button>
        {/* A7 — ỐNG NGHIỆM: chất lỏng dâng theo câu, bọt nổi; chuỗi ≥ 3 ⇒ chất lỏng cam phát sáng + vệt sáng lướt. */}
        <div className="duo-thanh" data-combo={chuoi >= 3 || undefined} role="progressbar" aria-label={laLamLai ? `Làm lại · câu ${stt}/${lamLai.length}` : q ? `Câu ${stt}/${goc.length}${chang ? ` của chặng ${chang}` : ''}` : 'Chặng học của em'} aria-valuemin={0} aria-valuemax={goc.length || 1} aria-valuenow={Math.min(daCham, goc.length)}><i style={{ width: `${pct}%` }}><b /><b /><b />{k?.correct && <span key={q?.qid} className="duo-loe" />}</i></div>
        {coNt ? <button ref={demRef} type="button" className="duo-chuoi duo-chuoi-nut" data-co={ntBai > 0 || undefined} aria-haspopup="dialog" aria-label={`Nguyên tử của bài này: ${ntBai} · xem hướng dẫn`} onClick={() => setHdNt(true)}><IcNguyenTu /><SoLan v={ntHien} /></button>
          : <span className="duo-chuoi" data-co={chuoi > 0 || undefined} aria-label={`Chuỗi ${chuoi} câu đúng liền`}><Flame size={22} aria-hidden="true" />{chuoi}</span>}
        {combo && <BangCombo key={combo.id} n={combo.n} />}
        {hdNt && createPortal(<Suspense fallback={null}><TamHuongDan loai="nt" soBai={ntBai} onDong={() => setHdNt(false)} /></Suspense>, document.body)}
        {/* băng mốc (làm lại 27/10: «băng mốc che chữ TRẮC NGHIỆM»): nằm TRONG thanh trên dính, đè lên ống tiến độ ~1,4 s — không che chữ nào của câu */}
        {luot?.moc ? <p key={`m${luot.id}`} className="duo-moc" data-moc={luot.moc} role="status">{chuMoc(luot.chuoi)}</p> : null}
      </header>}
      <main className="duo-than" data-de-dai={deDai || undefined} aria-live={xong ? 'polite' : undefined}>
        {tai ? <div className="ht2-lam-the m3-xuong" style={{ minHeight: 168 }} role="status" aria-busy="true" aria-label="Chặng học của em" />
        : xong ? <section className="duo-xong" data-hoan-hao={hoanHao || undefined} aria-label="Kết quả chặng">
            <div className="duo-hoa" aria-hidden="true">{Array.from({ length: 14 }, (_, i) => <i key={i} style={{ '--i': i } as CSSProperties} />)}</div>
            {/* B2 — chặng hoàn hảo (tự làm đúng cả chặng): tinh thể kim cương kết tinh từ tâm sau lưng Bi, tia sáng xoay chậm; B3 — Bi mừng nhảy, hoa giấy lục giác. */}
            <div className="duo-xong-bi">{hoanHao && <span className="duo-tinh" aria-hidden="true"><i /><svg viewBox="0 0 100 100"><path d="M50 4 86 36 50 96 14 36Z" /><path className="mat" d="M14 36H86M50 4 34 36 50 96 66 36Z" /></svg></span>}<Bi cam="mung" size={135} /></div>
            <h1>{chang ? `Xong chặng ${chang}!` : 'Xong chặng học!'}</h1>
            {hoanHao && <p className="duo-hoan-hao">Hoàn hảo · tự làm đúng cả {goc.length} câu</p>}
            {tenChuong && <p className="duo-xong-phu">{tenChuong}</p>}
            <div className="duo-3">
              <TheSo i={0} sac="dung" ten="Tự làm đúng" Icon={Target} den={soDung} dinh={(v) => `${v}/${goc.length}`} />
              <TheSo i={1} sac="tin" ten="Thời gian" Icon={Clock} den={Math.round(tongMs / 1000)} dinh={(v) => tongMs > 0 ? `${Math.floor(v / 60)}:${String(v % 60).padStart(2, '0')}` : '—'} />
              {homNayHien && <TheSo i={2} sac="sao" ten="Hôm nay" Icon={Flame} den={homNayHien.daLam} dinh={(v) => `${v}/${homNayHien.muc}`} dv="câu" />}
            </div>
            {homNayHien && homNayHien.soChang > 0 && <VongMucTieu xong={soChangXong(homNayHien)} tong={homNayHien.soChang} />}
            <p className="duo-ghi">{[lamLai.length ? `Đã làm lại ${lamLai.length} câu.` : '', cauSai.length ? `${chuDanhSachCau(cauSai)} sai đã vào lịch ôn 1 · 3 · 7 ngày.` : '', conDu === null ? '' : conDu > 0 ? `Còn ${conDu} câu nữa là đủ mức hôm nay.` : 'Em đã đủ mức hôm nay.'].filter(Boolean).join(' ')}</p>
          </section>
        : q ? <>
          {th && k && !laLamLai && !luot?.moc && <BangComboTp chuoi={khongTinh ? 0 : th.chuoiDung} tat={khongTinh && chuoiTruocTp >= 3} truoc={chuoiTruocTp} />}
          <div key="d" className="duo-cot-de">{/* khung thấp xoay ngang: cột trái = đề, cột phải = phương án + Kiểm tra / tấm kết quả; dọc / máy tính: display: contents (y bố cục cũ) */}
          {laLamLai ? <p key={`n${q.qid}`} className="duo-nhan" data-lam-lai=""><span>Làm lại · câu {stt}/{lamLai.length}</span><span className="duo-chip">Cùng dạng câu {goc.findIndex(c => c.qid === q.lamLaiCua) + 1 || '?'}</span></p>
            // thầy 27/10: lời nhắc chặng nằm TRONG dòng nhãn (không lớp nổi đè), mờ về nhãn thường sau 1,8 s — CSS «NHÃN CÂU NHẮC CHẶNG»
            : <p key={`n${q.qid}`} className="duo-nhan" data-nc="" data-nhac={bangNhac ? '' : undefined}>{bangNhac && <span className="duo-nhan-nhac" role="status">{bangNhac}</span>}<span className="duo-nhan-o" aria-hidden="true">{q.phan === 'III' || soPa ? <IcMayTinh /> : <IcLapLanh />}</span><span>{q.vaiGoi7 === 'moi' ? 'Câu mới' : loai}</span>{tenBai || q.tenDang ? <span className="duo-chip" data-cong-thuc={/[A-Z][a-z]?(\d|[A-Z(])/.test(tenBai || q.tenDang || '') || undefined}><ChemText text={chuDeNgan(tenBai || q.tenDang || '')} /></span> : null}{chang ? <span className="ht2-an">Chặng {chang}</span> : null}</p>}
          {(!laLamLai || nutDen) && <div key={`l${q.qid}`} className="duo-lenh">{!laLamLai && <h2>{lenh}</h2>}{nutDen}</div>}
          {laLamLai && !k && viTri === soGoc && <p key={`g${q.qid}`} className="duo-mo-ghi">Câu cùng dạng với câu em vừa sai. Lượt này tính là có hỗ trợ.</p>}
          {mucGt ? <div ref={sanRef} className="duo-gt-san">
              <div className="duo-gt-loi-o" />{/* hàng riêng của bong bóng càu nhàu: không đè nhãn, đề, phương án */}
              <div className="duo-gt-nv"><Suspense fallback={null}><GiamThiCau muc={mucGt} qid={q.qid} phien={phien} nop={nop} ket={ketGt} vung={() => gocRef.current} /></Suspense></div>
              {/* chữ L (bong bóng gần trọn bề ngang, khuyết góc trái trên ôm giám thị) CHỈ khi chữ thật sự tràn xuống dưới chân giám thị — mảnh GiamThi đo rồi bật `data-l` */}
              <div key={`b${q.qid}`} className="duo-gt-bong"><svg className="duo-gt-vien" aria-hidden="true"><path /></svg><span className="duo-gt-cho" aria-hidden="true" /><VungChamDe q={q} token={token} phien={phien} onHoTro={danhDauHoTro} nutBatDau={nutBatDau}><DeCau q={q} stt={stt} /></VungChamDe></div>
            </div>
            : <VungChamDe key={`v${q.qid}`} q={q} token={token} phien={phien} onHoTro={danhDauHoTro} nutBatDau={nutBatDau}><DeCau q={q} stt={stt} /></VungChamDe>}
          {coDangCanh(q.text) && <MinhHoaDe key={`m${q.qid}`} text={q.text} />}
          {q.goiY && goiY && dangTraLoi && <section key={`y${q.qid}`} id="ht2-lam-goi-y" className="ht2-lam-goi-y" aria-label="Gợi ý"><b><Lightbulb size={18} aria-hidden="true" />Gợi ý</b><p>{q.goiY.cotLoi || (q.goiY.gach?.length ? `Có thể loại phương án ${q.goiY.gach.join(', ')}.` : 'Đọc lại kiến thức cốt lõi của bài.')}</p></section>}
          </div>
          <ThanhCuon key="cd" cot="de" />
          <div key={`t${q.qid}`} className="duo-cot-tra">
          {/* Thầy 27/10 (ảnh): ẩn khung «Câu này em chọn làm thế nào?» ở màn Duo — hai nút đáy «Học cách giải» / «Tự làm câu này» đã nói đủ. */}
          <div className="duo-tra" data-luoi={luoi || undefined} data-pa={doDaiPa} data-so={soPa || undefined}>{khoiTraLoi}</div>
          {dangTraLoi && q.phan === 'III' && <BanPhimSo value={tra} khoa={nop} soO={soO} onPhim={(p: PhimSo) => doiTra(nhanPhim(tra, p, soO))} />}
          {(dangTraLoi || k) && <HinhCuoiCau q={q} stt={stt} />}
          {ghiTraLoi}
          </div>
          <ThanhCuon key={`ct${q.qid}`} cot="tra" />
        </> : null}
        {loi && !q && <div className="ht2-lam-loi" role="alert"><span>{loi}</span><button type="button" className="ht2-lam-nut ht2-lam-nut-phu" onClick={() => setLan(n => n + 1)}><RefreshCw size={17} aria-hidden="true" />Thử lại</button></div>}
        {hetCau && !q && !loi && <div className="ht2-lam-loi" data-tt="xong" role="status"><span>{hetCau}</span><button type="button" className="ht2-lam-nut ht2-lam-nut-phu" onClick={() => { onCapNhat(); onVe() }}>Về {tenTrangChinh()}</button></div>}
      </main>
      {day}
      {/* Bi gom thưởng ở mốc combo — không còn nhãn chữ cạnh Bi (viên thưởng chỉ bật cạnh bộ đếm) */}
      {luot?.moc && luot.N > 0 ? <span ref={biGomRef} key={`b${luot.id}`} className="duo-bi-gom" aria-hidden="true"><Bi cam="mung" size={92} /></span> : null}
      {moLoiGiai && q && k && !k.choThay && <div className="duo-lg" role="dialog" aria-modal="true" aria-label="Lời giải từng bước">
        <div className="duo-lg-the">
          <header className="duo-lg-dau"><b>Lời giải · Câu {stt}</b><button type="button" className="duo-dong" aria-label="Đóng lời giải" onClick={() => { setMoLoiGiai(false); nutTiepRef.current?.focus({ preventScroll: true }) }}><XIcon size={24} aria-hidden="true" /></button></header>
          <Suspense fallback={<LoiGiaiCau q={q} solution={k.solution} dapAn={k.answer} hinhLoiGiai={k.solutionImages} />}><LoiGiaiCauCoSoDo q={q} solution={k.solution} dapAn={k.answer} hinhLoiGiai={k.solutionImages} soDo={k.soDo} /></Suspense>
          <NutHoiThay gon chi="giai" qid={q.qid} nguon="bai_hang_ngay" dapAnEm={traHien} />
        </div>
      </div>}
      {loiGiu && <TamGiuChanLuoi tieuDe={loiGiu.tieuDe} phu={loiGiu.phu} onTiep={giu.tiepTuc} onThoat={giu.thoat} />}
    </div>
  }

  return <div ref={gocRef} className="ht-app ht2-lam" data-xong={xong || undefined}>
    <header className="ht2-lam-tren">
      <button type="button" className="ht2-lam-nut-ve" onClick={onVe} disabled={nop} aria-label={xong ? `Về ${tenTrangChinh()}` : `Lưu và về ${tenTrangChinh()}`}><ArrowLeft size={20} aria-hidden="true" /></button>
      <div className="ht2-lam-giua">
        <h1 className="ht2-lam-tieu" aria-live="polite">{tieuDe}</h1>
        {vach.length > 0 && !xong && <div className="ht2-lam-vach" role="img" aria-label={vachChu} style={{ gridTemplateColumns: `repeat(${vach.length}, minmax(0, 1fr))` }}>{vach.map((c, j) => <i key={c.qid} data-tt={ttCau(c, dauVach + j)} />)}</div>}
      </div>
      {homNayO}
    </header>
    <div className="ht2-lam-khung" data-tra-loi={traLoiPhai ? q.phan : undefined} data-ket={traLoiPhai && k ? '' : undefined}>
      <main className="ht2-lam-than">
        {tai ? <div className="ht2-lam-the m3-xuong" style={{ minHeight: 168 }} role="status" aria-busy="true" aria-label="Chặng học của em" />
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
        {hetCau && !q && !loi && <div className="ht2-lam-loi" data-tt="xong" role="status"><span>{hetCau}</span><button type="button" className="ht2-lam-nut ht2-lam-nut-phu" onClick={() => { onCapNhat(); onVe() }}>Về {tenTrangChinh()}</button></div>}
      </main>
      {thanhDay && <div className="ht2-lam-day" role="region" aria-label="Thao tác câu" data-tra-loi={traLoiPhai ? q.phan : undefined}>
        {traLoiPhai && <div className="ht2-lam-cot-tra-loi">{daiPhai && daiKet}{khoiTraLoi}{ghiTraLoi}</div>}
        {loi && q && <p className="ht2-lam-loi" role="alert">{loi}</p>}
        {thanhDay}
      </div>}
    </div>
  </div>
}
