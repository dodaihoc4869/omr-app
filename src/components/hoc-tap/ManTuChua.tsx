// TỰ CHỮA LỖI — danh sách câu cần chữa (mở từ Hôm nay › "Tự chữa lỗi", từ màn làm câu › "Tự chữa câu này", từ hồ sơ › câu chưa chữa).
// 12/10 (thầy: "mục chữa lỗi hiển thị cho thật chuẩn để học sinh chữa lỗi được"): mỗi câu có TÊN (dạng bài + phần + lần sai gần nhất, lấy từ
// "Câu đã làm") và TRẠNG THÁI bằng chữ; lỗi tải có Thử lại; rỗng thì gợi ý việc tiếp.
// TRÙNG TU 12/10 đợt 16 (thầy: "Trùng tu toàn diện giao diện tự sửa lỗi, mời gọi hs sửa lỗi, phải siêu đẹp, siêu thân thiện, rất khoa học.
// Tối ưu cho cả màn hình dọc, ngang máy tính." · "chỗ các câu học sinh chưa chữa đc bấm vào phải nảy vào đúng chỗ tự sửa"):
//   · THẺ TỔNG đầu màn: số câu cần chữa (số lớn có nhãn), thanh "Đã tự sửa x/y câu", vì sao nên chữa (lịch ôn 1 · 3 · 7 ngày — chữ app đã
//     dùng ở màn làm câu), cách tự chữa ba bước, và MỘT nút chính "Bắt đầu chữa" mở câu đứng đầu nhóm Cần chữa THEO THỨ TỰ MÁY CHỦ
//     (máy chủ xếp: lần gặp lại đã tới trước, rồi câu giao gần nhất, câu đã tự sửa cuối) — màn không tự xếp lại;
//   · THẺ CÂU: tên dạng · phần · lần sai gần nhất · trạng thái bằng chữ · động từ (Chữa / Chữa tiếp / Xem / Xem lại); không mã nội bộ;
//   · MỞ THẲNG MỘT CÂU (`qid`): chờ danh sách ⇒ có câu ⇒ mở đúng đợt của câu đó (khớp cả bản đổi số "~n"/"#n"); không có trong danh sách
//     ⇒ vẫn thử mở (vòng chữa tự lập đợt cho câu sai đã công bố — lệnh `mo-dot` như cũ), mở không được ⇒ về danh sách kèm lời báo thật
//     + "Thử mở lại"; danh sách lỗi ⇒ báo lỗi + Thử lại (không màn trắng, không kẹt). Mở câu ⇒ cuộn về đầu màn chữa; quay ra ⇒ về đúng chỗ
//     trong danh sách (đã tải lại trạng thái);
//   · dọc: một cột; ngang và máy tính: hai cột (thẻ tổng bên trái, danh sách bên phải). Chỉ biến màu sẵn có — kiểu ở tu-chua.css.
// ĐỢT 18 (13/10 — thầy: "Mời gọi học sinh tự sửa lỗi … Làm nổi bật phần tự sửa lỗi lên và mời gọi thân thiện" · "Tối ưu lại câu từ cho dễ hiểu ở mọi
// [màn]. Bỏ hết các gợi ý hướng dẫn để học sinh phụ huynh không bị phân tâm"): tên màn theo chữ của thầy "Tự sửa lỗi" (em SỬA, thầy CHỮA trên lớp);
// bỏ khối "Cách tự chữa một câu", câu "vì sao nên chữa", dòng giải thích nhóm chờ và lời dặn "chọn một câu trong danh sách"; nhóm của từng câu theo
// MỘT luật `nhomMucChua` (src/lib/tu-sua-loi.ts — thẻ mời ở Hôm nay và hồ sơ đếm cùng luật); danh sách tải MỚI qua `taiTuSuaLoi` để Hôm nay cập nhật số.
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { AlertCircle, ArrowLeft, ArrowRight, CheckCircle2, ChevronRight, Clock3, Lock, PencilLine, RotateCcw } from 'lucide-react'
import type { KetQuaDanhSachChua, LichKiemLaiHoiThay, MucChua } from '../../lib/chua-cau-sai-api'
import { nhomMucChua, taiTuSuaLoi, type NhomMucChua } from '../../lib/tu-sua-loi'
import { dungViecHomNay, docSbdHs, luuViecHomNay, themMotChang } from '../../lib/tu-sua-viec-hom-nay'
import ViecHomNay from './ViecHomNay'
import { useDanhDauHt2 } from './HocTapHomNay'
import type { ViecHomNay as KieuViecHomNay, ViecMuc } from '../../lib/tu-sua-viec-hom-nay'
import type { TienDoSua } from '../chua-cau-sai/KhungDuoSua'
import { taiCauDaLam, NHAN_NGUON_LAN, type CauDaLamMuc } from '../hoa2/api'
import { henGapLai } from '../../lib/chua-truc-tiep'
import { khoaMoChua } from '../../../server/src/ho-so-em-hs-loc'

import './hoc-tap.css'
import './tu-chua.css'
// «Trong» 26/10 (nhóm 2): tờ trình bày styles/trong-lam-bai.css nạp RIÊNG, chỉ khi <html data-trong> (main.tsx gắn trước khi nạp màn) — không cộng byte lượt mở app.
if (typeof document !== 'undefined' && document.documentElement.dataset.trong) void import('../../styles/trong-lam-bai.css').catch(() => {})
// Tên trang chính trên nút «về» (Boss 27/10): giao diện Trong ⇒ «Lộ trình»; giao diện cũ ⇒ «Hôm nay». Viết tại chỗ: nhập mô-đun dùng chung sẽ đẻ mảnh tải riêng (+1 tệp mở app).
const tenTrangChinh = (): string => (typeof document !== 'undefined' && document.documentElement.dataset.trong ? 'Lộ trình' : 'Hôm nay')

const ManChua = lazy(() => import('../chua-cau-sai/ManChuaCauSai'))
const KiemHoiThay = lazy(() => import('../loi-giai/HoiThayKiemChung'))
// Thẻ mời ở Hôm nay đi CÙNG khối mã với màn này (một khối nạp lười, không thêm tệp precache — trần 170 tệp của kiem-sw).
export { default as TheMoiTuSua } from './TheMoiTuSua'
// Lộ trình «Trong» (TrongHs: số trên nút «Sửa lỗi») đọc việc hôm nay QUA mảnh này (đã là điểm nạp lười) — nạp động thẳng tu-sua-viec-hom-nay sẽ tách thêm mảnh precache.
export { conSuaHomNay, docSbdHs, dungViecHomNay, luuViecHomNay } from '../../lib/tu-sua-viec-hom-nay'

/** Trạng thái đợt chữa ⇒ chữ em đọc được (bảng từ chuẩn: không mã nội bộ). */
export const CHU_TRANG_THAI_CHUA: Record<string, string> = {
  // Chữa câu gọn (thầy 25/10): em chỉ thấy HAI trạng thái — mọi câu chưa xong là "Cần sửa" (một đường sửa cho mọi câu, ChuaGon).
  can_chan_doan: 'Cần sửa',
  dang_chua_buoc: 'Cần sửa',
  dang_ghep_bai: 'Cần sửa',
  dang_kiem_chung: 'Cần sửa',
  cho_gap_lai_2: 'Cần sửa',
  can_thay: 'Cần sửa · đã báo thầy',
  thieu_hoc_lieu: 'Cần sửa',
  cau_thay_doi: 'Cần sửa',
  tam_khoa: 'Cần sửa',
  da_tu_sua: 'Đã tự sửa',
}
const TEN_PHAN: Record<string, string> = { I: 'Trắc nghiệm', II: 'Đúng–sai', III: 'Trả lời ngắn' }
/** Khoá mở Tự chữa từ Hồ sơ ("g<số>" — `khoaMoChua`). */
export const laKhoaHoSo = (q: string) => /^g\d+$/.test(q)
/** Mã gốc của câu: bỏ đuôi bản đổi số (~n, #n) và tiền tố "tc:" — để khớp câu mở thẳng với đợt trong danh sách. */
export const goc = (q: string) => q.replace(/(~\d+|#\d+)$/, '').replace(/^tc:/, '')
const ngayNgan = (ymd: string) => (/^\d{4}-\d{2}-\d{2}$/.test(ymd) ? `${ymd.slice(8, 10)}/${ymd.slice(5, 7)}` : '')
const cau = (s: string) => (/[.!?…]$/.test(s.trim()) ? s.trim() : `${s.trim()}.`)
const DANG_LAM = new Set(['dang_chua_buoc', 'dang_ghep_bai', 'dang_kiem_chung'])

type Nhom = NhomMucChua
interface DongChua {
  m: MucChua
  ten: string
  phu: string
  trangThai: string
  nhom: Nhom
  /** Động từ trên thẻ: Sửa · Sửa tiếp · Xem · Xem lại. */
  lam: string
}

/** Tên + dòng phụ của một câu: dạng bài (Câu đã làm) · phần · lần sai gần nhất ở đâu. Không có ⇒ "Câu sai số N". */
export function dungDong(m: MucChua, i: number, cdl: ReadonlyMap<string, CauDaLamMuc>, nayMs: number): DongChua {
  const c = cdl.get(goc(m.qid))
  const saiCuoi = c ? [...c.lichSu].filter((l) => !l.dung).sort((a, b) => (a.ngay < b.ngay ? 1 : -1))[0] : undefined
  const phu = [
    c ? TEN_PHAN[c.phan] : '',
    saiCuoi ? `sai lần gần nhất ${ngayNgan(saiCuoi.ngay)}${saiCuoi.nguon ? `\u00a0· ${NHAN_NGUON_LAN[saiCuoi.nguon]}` : ''}` : '',
  ].filter(Boolean).join('\u00a0· ') // SOÁT 26/10: «·» không mở đầu dòng
  const nhom: Nhom = nhomMucChua(m, nayMs)
  // Đợt cũ còn ở nhóm chờ lần gặp lại (vòng từng bước trước 25/10) ⇒ nói đúng mốc hẹn như nhóm của nó; mọi câu khác: Cần sửa / Đã tự sửa.
  const hen = nhom === 'cho' ? henGapLai(m.denHan, nayMs) : null
  // «·» dính chữ đứng trước (khoảng trắng không ngắt) ⇒ dòng không mở đầu bằng «·» ở 360 px (phông ĐĐH Rounded, 27/10)
  const trangThai = hen ? `Lần gặp lại 2 mở lúc ${hen.luc.replace(/ ·/g, '\u00a0·')}` : CHU_TRANG_THAI_CHUA[m.trangThai] ?? 'Cần sửa'
  const lam = nhom === 'xong' ? 'Xem lại' : m.kiemHoiThay && m.trangThai !== 'can_thay' ? 'Kiểm lại' : 'Sửa'
  return { m, ten: c?.tenDang || `Câu sai số ${i + 1}`, phu, trangThai, nhom, lam }
}

/** Đợt ứng với câu mở thẳng: cùng mã gốc; có cả đợt đã đóng lẫn đợt đang mở thì lấy đợt đang mở. */
export function timMucChua(ds: readonly MucChua[], qid: string): MucChua | undefined {
  // Từ Hồ sơ (đợt 16): khoá băm "g<số>" của mã gốc ⇒ băm từng câu trong danh sách bằng CÙNG hàm của máy chủ để khớp (không có mã nội bộ trong hồ sơ).
  if (laKhoaHoSo(qid)) {
    const cung = ds.filter((m) => khoaMoChua(m.qid) === qid)
    return cung.find((m) => m.trangThai !== 'da_tu_sua') ?? cung[0]
  }
  const g = goc(qid)
  const cung = ds.filter((m) => goc(m.qid) === g)
  return cung.find((m) => m.trangThai !== 'da_tu_sua') ?? cung[0]
}

/** Khung cuộn gần nhất (vỏ app học sinh bọc màn trong một lớp `overflow-y-auto`); không có thì cuộn cả trang. */
function khungCuon(el: HTMLElement | null): HTMLElement | null {
  for (let p = el?.parentElement ?? null; p; p = p.parentElement) {
    const o = getComputedStyle(p).overflowY
    if (o === 'auto' || o === 'scroll') return p
  }
  return (document.scrollingElement as HTMLElement | null) ?? null
}

function BieuTuong({ d }: { d: DongChua }) {
  const sac = d.nhom === 'xong' ? 'muc' : d.nhom === 'cho' ? 'vang' : 'cham'
  const Icon = d.nhom === 'xong' ? CheckCircle2 : d.nhom === 'cho' ? Clock3 : d.m.trangThai === 'tam_khoa' ? Lock : PencilLine
  return <span className="ht2-dong-bt" data-sac={sac}><Icon size={20} aria-hidden="true" /></span>
}

const TEN_NHOM: Record<Nhom, string> = { can: 'Cần sửa', cho: 'Đang chờ lần gặp lại', xong: 'Đã tự sửa' }

/** Chỗ của câu đang sửa trong chặng của Việc hôm nay ⇒ thanh tiến độ + màn xong chặng của màn sửa câu kiểu Duolingo («Trong» HS, 27/10). Câu ngoài việc hôm nay ⇒ vắng. */
export function tienDoSua(viec: KieuViecHomNay | null | undefined, qid: string): TienDoSua | undefined {
  if (!viec) return undefined
  const g = goc(qid), la = (x: ViecMuc) => goc(x.m.qid) === g
  const ci = viec.chang.findIndex((c) => c.some(la))
  if (ci < 0) return undefined
  const c = viec.chang[ci]!, khac = c.filter((x) => !la(x)), nay = c.find(la)!
  const tiep = viec.muc.find((x) => !x.xong && !la(x) && !c.includes(x))
  return {
    so: ci + 1, xong: khac.filter((x) => x.xong).length, tong: c.length, cuoi: khac.every((x) => x.xong),
    // Câu kế = câu chưa xong đầu tiên theo thứ tự ngày (đúng câu `onTiep` mở).
    conSau: !!tiep, changTiep: tiep ? viec.chang.findIndex((k) => k.includes(tiep)) + 1 || undefined : undefined,
    homNay: { xong: Math.min(viec.tong, viec.xong + (nay.xong ? 0 : 1)), tong: viec.tong },
  }
}

type Chon = { qid: string; ten?: string; kiemHoiThay?: boolean; /** câu mở thẳng KHÔNG có trong danh sách: mở không được thì về danh sách kèm lời báo */ thu?: boolean }

export default function ManTuChua({ token, qid, onVe, onTuLuyen }: { token: string; qid?: string; onVe: () => void; onTuLuyen?: () => void }) {
  useDanhDauHt2() // <html data-ht2> (xem HocTapHomNay.tsx)
  const [chon, setChon] = useState<Chon | null>(null)
  /** Câu mở thẳng đang chờ danh sách để tìm đúng đợt. */
  const [doi, setDoi] = useState(qid ?? '')
  /** Lời báo khi không mở được câu em chọn (giữ mã câu để "Thử mở lại"). */
  const [bao, setBao] = useState<{ qid: string; loi: string } | null>(null)
  const [qidTruoc, setQidTruoc] = useState(qid)
  if (qid !== qidTruoc) {
    // Vỏ đổi câu mở thẳng khi màn đang mở ⇒ làm lại từ đầu với câu mới.
    setQidTruoc(qid)
    setDoi(qid ?? '')
    setChon(null)
    setBao(null)
  }
  const [kq, setKq] = useState<KetQuaDanhSachChua | null>(null)
  const [cdl, setCdl] = useState<ReadonlyMap<string, CauDaLamMuc>>(new Map())
  const [lan, setLan] = useState(0)
  const [dangThem, setDangThem] = useState(false)
  const [loiThem, setLoiThem] = useState('')
  const lanDoc = useRef(0), khoaThem = useRef(false)
  const gocRef = useRef<HTMLDivElement>(null)
  const viTri = useRef<{ top: number; khoa: string } | null>(null)
  const choDongBoViTri = useRef(false)
  /** Tải lại "lặng" khi em quay ra từ một câu: giữ danh sách cũ trên màn tới khi bản mới về (không nháy khung chờ, giữ chỗ cuộn). */
  const lang = useRef(false)

  useEffect(() => {
    let huy = false
    const moc = ++lanDoc.current
    khoaThem.current = false; setDangThem(false); setLoiThem('')
    if (!lang.current) setKq(null)
    lang.current = false
    // Luôn tải MỚI (em vừa sửa xong một câu thì số đổi) — bản nhớ chung được ghi đè ⇒ thẻ mời ở Hôm nay cập nhật theo.
    void taiTuSuaLoi(token, { moi: true }).then((r) => { if (!huy && moc === lanDoc.current) { choDongBoViTri.current = false; setKq(r) } })
    // Tên câu: lấy từ "Câu đã làm" (cùng tên dạng em đã thấy ở đó); hỏng thì giữ tên dự phòng — không chặn danh sách.
    void taiCauDaLam(token).then((r) => {
      if (!huy && r.cheDo2) setCdl(new Map(r.cau.map((c) => [goc(c.qid), c])))
    }).catch(() => {})
    return () => { huy = true; lanDoc.current++ }
  }, [token, lan])
  const dong = useMemo(() => (kq?.trangThai === 'bat' ? kq.ds.map((m, i) => dungDong(m, i, cdl, Date.now())) : []), [kq, cdl])
  // VIỆC HÔM NAY (thầy 20/10): tối thiểu 12 câu/ngày chia chặng 4 câu; cần SBD để giữ ổn định trong ngày — thiếu ⇒ danh sách cũ.
  const sbd = useMemo(() => docSbdHs(), [])
  const [lanThem, setLanThem] = useState(0)
  const { viec, luu, day } = useMemo(() => (sbd ? dungViecHomNay(kq, Date.now(), sbd) : { viec: null, luu: null, day: null }), [kq, sbd, lanThem])
  useEffect(() => { luuViecHomNay(luu, day ?? null) }, [luu, day])
  // 27/10 tốc độ (thầy: «sửa lỗi chỗ mở câu phải tức thì»): danh sách vừa mở ⇒ lúc rảnh nạp sẵn mảnh màn sửa câu, bấm câu là vào ngay, không màn chờ nạp mảnh.
  useEffect(() => {
    // Chỉ nạp mảnh màn sửa câu: khung Duo (ChuaGonDuo) do chính màn ấy nạp song song lệnh mở đợt — nạp thẳng từ đây làm Rolldown tách thêm mảnh dùng chung (+1 tệp precache).
    const nap = () => { void import('../chua-cau-sai/ManChuaCauSai').catch(() => {}) }
    const ric = (globalThis as { requestIdleCallback?: (f: () => void, o?: { timeout: number }) => number }).requestIdleCallback
    if (ric) ric(nap, { timeout: 2000 }); else setTimeout(nap, 600)
  }, [])

  // Câu mở thẳng: danh sách về ⇒ mở đúng đợt (hoặc thử mở câu chưa có đợt); vòng chữa tắt ⇒ bỏ, hiện màn "chưa mở cho em".
  useEffect(() => {
    if (!doi || !kq) return
    if (kq.trangThai === 'bat') {
      const m = timMucChua(kq.ds, doi)
      const k = kq.kiemLaiHoiThay?.find((x) => laKhoaHoSo(doi) ? khoaMoChua(x.qid) === doi : goc(x.qid) === goc(doi))
      // Khoá từ Hồ sơ không có trong danh sách (đã sửa xong / chưa vào vòng chữa) ⇒ không "thử mở" bằng khoá băm: hiện danh sách kèm lời báo.
      if (!m && !k && laKhoaHoSo(doi)) setBao({ qid: doi, loi: kq.sau ? 'Câu em chọn chưa nằm trong phần đã tải. Em xem tiếp danh sách nhé.' : 'Câu này chưa có trong Tự sửa lỗi của em.' })
      else setChon(m ? { qid: m.qid, kiemHoiThay: m.kiemHoiThay } : k ? { qid: k.qid, ten: k.ten, kiemHoiThay: true } : { qid: doi, thu: true })
      setDoi('')
    } else if (kq.trangThai === 'tat') setDoi('')
  }, [kq, doi])
  useEffect(() => {
    if (!bao || !laKhoaHoSo(bao.qid) || kq?.trangThai !== 'bat') return
    const m = timMucChua(kq.ds, bao.qid)
    if (m) { setBao(null); setChon({ qid: m.qid, kiemHoiThay: m.kiemHoiThay }) }
  }, [bao, kq])
  // Mở câu ⇒ màn chữa bắt đầu từ đầu (không kẹt ở giữa vì danh sách đã cuộn xuống).
  useEffect(() => {
    if (!chon) return
    const k = khungCuon(gocRef.current)
    if (k) k.scrollTop = 0
  }, [chon])
  // Quay ra ⇒ danh sách về đúng chỗ em đang đứng, con trỏ bàn phím ở lại thẻ câu vừa chữa.
  useEffect(() => {
    if (chon || kq?.trangThai !== 'bat' || !viTri.current) return
    const { top, khoa } = viTri.current
    // Khôi phục ngay trên danh sách cũ, rồi khôi phục lần nữa khi số/trạng thái
    // mới về (câu vừa sửa có thể chuyển nhóm và React thay nút cũ).
    if (!choDongBoViTri.current) viTri.current = null
    const k = khungCuon(gocRef.current)
    if (k) k.scrollTop = top
    const the = [...(gocRef.current?.querySelectorAll<HTMLElement>('[data-khoa]') ?? [])].find((x) => x.dataset.khoa === khoa)
    if (the) the.focus({ preventScroll: true })
    else gocRef.current?.querySelector<HTMLButtonElement>('.tcl-dau-trang button')?.focus({ preventScroll: true })
  }, [chon, kq])

  const moCau = (d: DongChua) => {
    viTri.current = { top: khungCuon(gocRef.current)?.scrollTop ?? 0, khoa: d.m.dotId ?? d.m.qid }
    setBao(null)
    setChon({ qid: d.m.qid, kiemHoiThay: d.m.kiemHoiThay })
  }
  const moKiemLai = (m: LichKiemLaiHoiThay) => {
    viTri.current = { top: khungCuon(gocRef.current)?.scrollTop ?? 0, khoa: `kiem-hoi-${m.qid}` }
    setBao(null); setChon({ qid: m.qid, ten: m.ten, kiemHoiThay: true })
  }
  const taiThem = async () => {
    if (kq?.trangThai !== 'bat' || !kq.sau || khoaThem.current) return
    const moc = lanDoc.current
    khoaThem.current = true; setDangThem(true); setLoiThem('')
    const r = await taiTuSuaLoi(token, { sau: kq.sau })
    if (moc !== lanDoc.current) return
    khoaThem.current = false; setDangThem(false)
    if (r.trangThai === 'loi') { setLoiThem(r.loi); return }
    setKq(r)
  }

  if (chon) {
    const d = dong.find((x) => goc(x.m.qid) === goc(chon.qid))
    const ten = d?.ten ?? chon.ten ?? (cdl.get(goc(chon.qid))?.tenDang || undefined)
    const veDanhSach = () => { lang.current = true; choDongBoViTri.current = true; setChon(null); setLan((n) => n + 1) }
    if (chon.kiemHoiThay) return (
      <div ref={gocRef} className="ht-app ht2 tcl-man m3">
        <header className="ht-thanh tcl-dau-trang"><button type="button" className="ht-nut-phu" onClick={veDanhSach}><ArrowLeft size={18} aria-hidden="true" />Quay lại danh sách</button><strong className="tcl-dau-trang-ten">Kiểm lại câu đã sửa</strong></header>
        <main className="ht-noi-dung ht2-noi-dung tcl-noi-dung">
          <h1>{ten || 'Câu em đang sửa'}</h1>
          <Suspense fallback={<p className="tcl-cho-mo" role="status"><span className="chu-cho-tre">Đang mở câu kiểm lại…</span></p>}><KiemHoiThay key={chon.qid} qid={chon.qid} token={token} tuMo /></Suspense>
        </main>
      </div>
    )
    return (
      <div ref={gocRef}>
        <Suspense fallback={<div className="ht-app ht2 tcl-man"><p className="ht-noi-dung tcl-cho-mo" role="status"><span className="chu-cho-tre">Đang mở câu…</span></p></div>}>
          <ManChua
            token={token}
            qid={chon.qid}
            tenCau={ten}
            onVe={veDanhSach}
            tienDo={tienDoSua(viec, chon.qid)}
            onTiep={viec ? () => {
              // Chữa câu gọn (25/10): câu vừa khép đã ghi "xong phần" trên máy ⇒ dựng lại việc hôm nay và mở THẲNG câu kế; hết câu ⇒ về danh sách.
              const v = dungViecHomNay(kq, Date.now(), sbd).viec
              const t = v?.muc.find((x) => !x.xong && goc(x.m.qid) !== goc(chon.qid))
              if (!t) { veDanhSach(); return }
              lang.current = true; setLan((n) => n + 1); setChon({ qid: t.m.qid, kiemHoiThay: t.m.kiemHoiThay })
            } : undefined}
            onKhongMo={chon.thu ? (loi) => { setChon(null); setBao({ qid: chon.qid, loi }) } : undefined}
          />
        </Suspense>
      </div>
    )
  }

  const can = dong.filter((d) => d.nhom === 'can')
  const dem = kq?.trangThai === 'bat' ? kq.dem : undefined
  const soCan = dem?.can ?? can.length
  const soCho = dem?.cho ?? dong.filter((d) => d.nhom === 'cho').length
  const soXong = dem?.xong ?? dong.filter((d) => d.nhom === 'xong').length
  const tong = dem?.tong ?? dong.length
  const daHien = new Set(dong.map((d) => goc(d.m.qid)))
  const kiemRieng = kq?.trangThai === 'bat' ? (kq.kiemLaiHoiThay ?? []).filter((m) => !daHien.has(goc(m.qid))).slice(0, 12) : []
  const dangMoThang = !!doi && (!kq || kq.trangThai === 'bat')
  return (
    <div ref={gocRef} className="ht-app ht2 tcl-man">
      <header className="ht-thanh tcl-dau-trang">
        <button type="button" className="ht-nut-phu" onClick={onVe}><ArrowLeft size={18} aria-hidden="true" />{tenTrangChinh()}</button>
        <strong className="tcl-dau-trang-ten">Tự sửa lỗi</strong>
      </header>
      <main className="ht-noi-dung ht2-noi-dung tcl-noi-dung">
        {kiemRieng.length > 0 && !dangMoThang && <section className="tcl-nhom" aria-label="Kiểm lại sau Hỏi thầy">
          <div className="tcl-nhom-dau"><h2>Kiểm lại sau Hỏi thầy</h2><span className="tcl-dem">{kiemRieng.length} câu</span></div>
          <p className="ht2-phu">Các câu kiểm lại được xếp riêng theo lịch ôn của em.</p>
          {kiemRieng.map((m) => {
            const hen = m.denHan ? henGapLai(m.denHan, Date.now()) : null
            const chu = m.trangThai === 'dang_lam' ? 'Đang tự làm' : m.trangThai === 'den_han' ? 'Đến lịch kiểm lại' : hen ? `Chờ kiểm lại\u00a0· ${hen.luc.replace(/ ·/g, '\u00a0·')}` : 'Đang chờ lịch kiểm lại'
            return <button type="button" className="tcl-the" data-khoa={`kiem-hoi-${m.qid}`} key={m.qid} onClick={() => moKiemLai(m)}>
              <span className="ht2-dong-bt" data-sac="cham" aria-hidden="true"><CheckCircle2 size={20} /></span>
              <span className="tcl-the-chu"><strong className="tcl-the-ten">{m.ten || 'Câu em đang luyện'}</strong><small className="tcl-the-phu">{TEN_PHAN[m.phan] || 'Câu kiểm lại'}</small><small className="tcl-the-tt">{chu}</small></span>
              <span className="tcl-the-lam">{m.trangThai === 'dang_lam' ? 'Làm tiếp' : m.trangThai === 'den_han' ? 'Kiểm lại' : 'Xem lịch'}<ChevronRight size={18} aria-hidden="true" /></span>
            </button>
          })}
        </section>}
        {bao && (
          <div className="tcl-bao" role="alert">
            <AlertCircle size={22} aria-hidden="true" />
            <span className="tcl-bao-chu">
              <strong>Chưa mở được câu em chọn</strong>
              {bao.loi && <small>{cau(bao.loi)}</small>}
            </span>
            {!laKhoaHoSo(bao.qid) && <button type="button" className="ht-nut-phu" onClick={() => { setBao(null); setChon({ qid: bao.qid, thu: true }) }}>
              <RotateCcw size={16} aria-hidden="true" />Thử mở lại
            </button>}
          </div>
        )}
        {dangMoThang || !kq ? (
          <div className="tcl-bo-cuc" aria-busy="true">
            <div className="tcl-tong tcl-xuong" role="status">
              <p className="tcl-cho-mo"><span className="chu-cho-tre">{dangMoThang ? 'Đang mở câu em chọn…' : 'Đang tải câu cần sửa…'}</span></p>
            </div>
            <div className="tcl-ds" aria-hidden="true">
              <div className="tcl-nhom"><div className="tcl-the tcl-xuong" /><div className="tcl-the tcl-xuong" /><div className="tcl-the tcl-xuong" /></div>
            </div>
          </div>
        ) : kq.trangThai === 'loi' ? (
          <section className="tcl-trong" aria-labelledby="tcl-loi-tieu">
            <span className="tcl-trong-bt" data-sac="do"><AlertCircle size={26} aria-hidden="true" /></span>
            <h1 id="tcl-loi-tieu">Chưa tải được câu cần sửa</h1>
            <div className="ht-thong-bao ht2-loi tcl-loi" role="alert">
              <span>{doi ? 'Chưa mở được câu em chọn vì chưa tải được danh sách câu cần sửa. ' : ''}{kq.loi}</span>
              <button type="button" className="ht-nut-chinh" onClick={() => setLan((n) => n + 1)}>Thử lại</button>
            </div>
          </section>
        ) : kq.trangThai === 'tat' ? (
          <section className="tcl-trong" aria-labelledby="tcl-tat-tieu">
            <span className="tcl-trong-bt" data-sac="cham"><Lock size={26} aria-hidden="true" /></span>
            <h1 id="tcl-tat-tieu">Tự sửa lỗi chưa mở cho em</h1>
            <p className="ht2-phu">Lời giải câu đã làm có ở Ôn &amp; sửa › Câu đã làm.</p>
            <div className="ht2-hang-nut">
              <button type="button" className="ht-nut-chinh ht2-nut-lon" onClick={onVe}>Về {tenTrangChinh()}</button>
            </div>
          </section>
        ) : !tong || (!soCan && !soCho) ? (
          <div className={soXong ? 'tcl-bo-cuc' : undefined}>
            <section className="tcl-trong" aria-labelledby="tcl-xong-tieu">
              <span className="tcl-trong-bt" data-sac="xanh"><CheckCircle2 size={28} aria-hidden="true" /></span>
              <h1 id="tcl-xong-tieu">Em không còn câu nào cần sửa</h1>
              {soXong > 0 && <p className="tcl-trong-so">Đã tự sửa: <b>{soXong} câu</b></p>}
              <p className="ht2-phu">Câu em làm sai sẽ tự vào đây.</p>
              <div className="ht2-hang-nut">
                <button type="button" className="ht-nut-chinh ht2-nut-lon" onClick={onVe}>Về {tenTrangChinh()}</button>
                {onTuLuyen && <button type="button" className="ht-nut-phu" onClick={onTuLuyen}>Luyện thêm ở Tu luyện</button>}
              </div>
            </section>
            {soXong > 0 && <div className="tcl-ds"><DanhSach nhom="xong" ds={dong} tong={soXong} onChon={moCau} /></div>}
          </div>
        ) : (
          <div className="tcl-bo-cuc">
            {viec && viec.tong > 0
              ? <div className="vh-cot"><ViecHomNay
                  viec={viec} soXong={soXong} tong={tong} soCan={soCan} xongHomNay={dem?.xongHomNay} nayMs={Date.now()}
                  thongTin={(m, i) => { const d = dungDong(m, i, cdl, Date.now()); return { ten: d.ten, phu: d.phu, trangThai: d.trangThai } }}
                  onChon={(m, i) => moCau(dungDong(m, i, cdl, Date.now()))}
                  onThem={() => { themMotChang(kq); setLanThem((n) => n + 1) }}
                  onVe={onVe} /></div>
              : <TheTong can={can} soCan={soCan} soCho={soCho} soXong={soXong} tong={tong} onChon={moCau} onVe={onVe} onTaiThem={kq.sau ? () => void taiThem() : undefined} dangThem={dangThem} />}
            <div className="tcl-ds">
              {(['can', 'cho', 'xong'] as Nhom[]).map((n) => {
                const ds = dong.filter((d) => d.nhom === n)
                if (!ds.length) return null
                // Có việc hôm nay ⇒ danh sách đầy đủ gập lại (em không phải nhìn cả trăm câu một lúc).
                return viec && viec.tong > 0
                  ? <details className="vh-gap" key={n}><summary><b>{n === 'can' ? 'Tất cả câu cần sửa' : TEN_NHOM[n]}</b><span>{dem?.[n] ?? ds.length} câu</span></summary><DanhSach nhom={n} ds={ds} tong={dem?.[n]} onChon={moCau} /></details>
                  : <DanhSach key={n} nhom={n} ds={ds} tong={dem?.[n]} onChon={moCau} />
              })}
            </div>
          </div>
        )}
        {kq?.trangThai === 'bat' && (kq.sau || loiThem) && <div className="tcl-nhom" style={{ marginTop: 'var(--k3)' }}>
          <p className="ht2-phu">Đã tải {kq.ds.length}/{tong} câu trong danh sách.</p>
          {loiThem && <p className="ht2-loi" role="alert">{loiThem}</p>}
          {kq.sau && <button type="button" className="ht-nut-phu" disabled={dangThem} onClick={() => void taiThem()}>{dangThem ? 'Đang tải thêm…' : 'Xem tiếp các câu'}</button>}
        </div>}
      </main>
    </div>
  )
}

/** Tiêu đề thẻ tổng — lời mời ngắn, động từ đứng đầu (thầy 13/10: "mời gọi thân thiện"). */
export const TIEU_DE_TONG = 'Sửa lại câu em làm sai'

/** Thẻ tổng: điểm nhấn của màn (số câu cần sửa) + tiến độ + MỘT nút chính. Đợt 18: bỏ câu "vì sao" và khối "Cách tự chữa" (thầy: bỏ gợi ý hướng dẫn). */
function TheTong({ can, soCan, soCho, soXong, tong, onChon, onVe, onTaiThem, dangThem }: {
  can: DongChua[]
  soCan: number
  soCho: number
  soXong: number
  tong: number
  onChon: (d: DongChua) => void
  onVe: () => void
  onTaiThem?: () => void
  dangThem: boolean
}) {
  const dau = can[0]
  const phan = (n: number) => `${Math.round((n / Math.max(1, tong)) * 1000) / 10}%`
  return (
    <section className="tcl-tong" aria-labelledby="tcl-tong-tieu">
      <div className="tcl-tong-dau">
        <p className="tcl-so"><b>{soCan}</b><small>câu cần sửa</small></p>
        <div className="tcl-tong-chu">
          <h1 id="tcl-tong-tieu">{TIEU_DE_TONG}</h1>
          {!soCan && <p className="tcl-vi-sao">Lúc này chưa có câu cần sửa ngay.</p>}
        </div>
      </div>
      <div className="tcl-tien-do">
        <p className="tcl-tien-do-chu"><span>Đã tự sửa</span><b>{soXong}/{tong} câu</b></p>
        <div className="tcl-thanh" role="img" aria-label={`Đã tự sửa ${soXong} trong ${tong} câu${soCho ? `, ${soCho} câu chờ lần gặp lại` : ''}`}>
          {soXong > 0 && <i data-tt="xong" style={{ width: phan(soXong) }} />}
          {soCho > 0 && <i data-tt="cho" style={{ width: phan(soCho) }} />}
        </div>
        {soCho > 0 && <p className="tcl-chu-giai"><span data-tt="xong">Đã tự sửa</span><span data-tt="cho">Chờ lần gặp lại: {soCho} câu</span></p>}
      </div>
      {dau ? (
        <div className="tcl-bat-dau">
          <button type="button" className="ht-nut-chinh ht2-nut-lon tcl-nut-chinh" aria-describedby="tcl-cau-dau" onClick={() => onChon(dau)}>
            <span>{dau.m.kiemHoiThay ? dau.lam === 'Xem' ? 'Xem tiến độ sửa' : dau.lam : DANG_LAM.has(dau.m.trangThai) ? 'Sửa tiếp' : 'Bắt đầu sửa'}</span><ArrowRight size={20} aria-hidden="true" />
          </button>
          <p className="tcl-cau-dau" id="tcl-cau-dau">Câu đầu tiên: <b>{dau.ten}</b></p>
        </div>
      ) : soCan > 0 && onTaiThem ? (
        <button type="button" className="ht-nut-chinh ht2-nut-lon tcl-nut-chinh" onClick={onTaiThem} disabled={dangThem}>{dangThem ? 'Đang tải thêm…' : 'Tải thêm câu cần sửa'}</button>
      ) : (
        <button type="button" className="ht-nut-chinh ht2-nut-lon tcl-nut-chinh" onClick={onVe}>
          <span>Về {tenTrangChinh()}</span><ArrowRight size={20} aria-hidden="true" />
        </button>
      )}
    </section>
  )
}

function DanhSach({ nhom, ds, tong, onChon }: { nhom: Nhom; ds: DongChua[]; tong?: number; onChon: (d: DongChua) => void }) {
  const cua = ds.filter((d) => d.nhom === nhom)
  const ten = TEN_NHOM[nhom]
  return (
    <section className="tcl-nhom" data-nhom={nhom} aria-label={`${ten}: ${tong ?? cua.length} câu`}>
      <div className="tcl-nhom-dau">
        <h2>{ten}</h2>
        <span className="tcl-dem">{tong ?? cua.length} câu</span>
      </div>
      {cua.map((d) => (
        <button type="button" className="tcl-the" key={d.m.dotId ?? d.m.qid} data-khoa={d.m.dotId ?? d.m.qid} data-nhom={d.nhom} onClick={() => onChon(d)}>
          <BieuTuong d={d} />
          <span className="tcl-the-chu">
            <strong className="tcl-the-ten">{d.ten}</strong>
            {d.phu && <small className="tcl-the-phu">{d.phu}</small>}
            <small className="tcl-the-tt" data-nhom={d.nhom}>{d.trangThai}</small>
          </span>
          <span className="tcl-the-lam" data-nhom={d.nhom}>{d.lam}<ChevronRight size={18} aria-hidden="true" /></span>
        </button>
      ))}
    </section>
  )
}
