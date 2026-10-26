// HÔM NAY CỦA THẦY — màn đầu app thầy khi Game Hóa 2.0 bật. Trả lời MỘT câu: "Lớp tôi cần gì hôm nay, em nào chăm, em nào lười?". Mã màn vẫn là
// `tongquan` để giữ lối điều hướng cũ.
// LỊCH SỬ: bản vẽ tối giản thầy chốt 09/10 (GV-HomNay: việc cần thầy xếp theo độ gấp, mỗi việc một nút + thẻ "Đủ mức tối thiểu hôm nay").
// BẢN VẼ THẦY DUYỆT 12/10 (dot10-canvas Main.dc.html + HomNay-DienThoai.dc.html; thầy: "Mục hôm nay hiển thị rõ cho tôi vô cùng đẹp Nhịp học, phải
// làm rất đẹp, tôi nhìn vào thấy ngay học sinh nào chăm học sinh nào lười" · "duyệt bản vẽ, buid và đẩy luôn nhé"):
//   · đầu màn: tiêu đề + "Thứ Hai 12/10/2026 · N em đang học · cập nhật HH:MM"; MỘT nút chính góc phải = việc gấp nhất (ca đang mở ⇒ "Theo dõi ca
//     đang mở", không thì "Bổ sung bài hôm nay").
//   · "Việc cần thầy": GIỮ ĐỦ chức năng cũ (ca đang mở → Theo dõi ca · Cần thầy chữa → Hành trình › Chữa bài · Học sinh hỏi → màn câu hỏi · lớp
//     chờ bài mới → Hành trình › Dạy học · phần chưa đọc được → Thử lại · không có chỗ cần chữa ⇒ thẻ ✓ không nút), trình bày thành HÀNG THẺ gọn
//     (máy tính: thẻ có biểu tượng + chữ + chữ hành động viền; điện thoại: danh sách dòng có mũi tên). BỎ việc "N em chưa làm câu nào hôm nay" (Nhịp
//     học đã nói). Nút "Cần thầy chữa" mở Hành trình › mục Chữa bài: thẻ mới do làn Hành trình đặt mã `chua-bai`; tạm gọi đúng cách mở thẻ Cần thầy
//     chữa đang có (`{ the: 'can-chua' }`) — làn Hành trình ánh xạ khoá cũ `can-chua` sang `chua-bai`.
//   · "Nhịp học" (từ 01/10) thay thẻ "Đủ mức tối thiểu hôm nay" và nút "Xem bài hằng ngày từ 01/10" (hai thẻ Nhịp học / Bài hằng ngày đã rời Hành
//     trình): `src/components/hom-nay-thay/NhipHocThay.tsx`, MỘT lệnh CHỈ ĐỌC `/gv/nhip-hoc` (src/lib/nhip-hoc-thay.ts), tải SONG SONG với phần việc —
//     phần nào lỗi thì phần ấy nói thật + Thử lại, phần kia vẫn hiện.
//   · Chờ tải: khung xương đúng hình (`.tt-xuong`). Lỗi: câu dễ hiểu (`lyDoDeHieu`), không in lỗi kỹ thuật thô.
// SỐ CHỈ TỪ API, không số giả: lệnh nào lỗi thì phần của nó KHÔNG vẽ. "Cần thầy chữa" = cùng nguồn và cùng cách gộp với danh sách Cần thầy chữa.
// Ghi số cho thanh bên (`useSoDemGv`: ca đang mở, Cần thầy chữa). Phép tính thuần xuất ra để test (tests/gv-hom-nay-0910.test.tsx).
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { BookOpen, Check, ChevronRight, CircleHelp, Eye, MonitorCheck, PenLine, Plus, RefreshCw, type LucideIcon } from 'lucide-react'
import { danhSachCa, danhSachCauHoi, type CaTomTat } from '../lib/exam-api'
import { gomTheoCa } from '../lib/hoi-bai'
import { lyDoDeHieu } from '../lib/loi-de-hieu'
import { loadScriptUrl, loadTeacherSecret } from '../lib/exam-db'
import { gioMayChu } from '../lib/gio-may-chu'
import { useAppStore } from '../store/appStore'
import { useSoDemGv, type MoHanhTrinh } from '../lib/so-dem-gv'
import { taiGioiHan } from '../lib/tai-gioi-han'
import { layLopThay } from '../lib/ten-lop-thay'
import { chuChoBaiMoi } from '../lib/bai-hom-nay'
import { layNhipHoc } from '../lib/nhip-hoc-thay'
import { danhSach, docBang, type BangChienDich, type CauCanDayLai, type ChienDichTom } from '../components/chien-dich/api'
import { baiDaDayDanhSach, docBangOmniCua, docCoOmni } from '../components/chien-dich/api-omni'
import { nhomCanThayChua } from '../components/chien-dich/omni-bang'
import { hienNgay, ngayVn } from '../components/chien-dich/ngay'
import NhipHocThay, { type DuNhip } from '../components/hom-nay-thay/NhipHocThay'
import type { CanThayChua } from '../../server/src/omni-kieu'
import { caConEmDangLam } from '../lib/ca-dang-chay'
import './gv-hoa2.css'
import '../styles/trong-gv-hom-nay.css'
import '../components/chien-dich/gv-v2.css'
import './gv-hom-nay.css'
import '../components/hom-nay-thay/hom-nay-thay.css'
import '../styles/trong-gv-ngang.css' // NGANG GV 26/10: dải biểu tượng điện thoại ngang + khung 1480 (≥ 1600) — mảnh CSS chung của các màn thầy, ngoài đường /gv

// 21/10 (thầy: "nút này làm riêng bấm vào popup lên để chọn luôn chứ không gắn vào phần hành trình nữa"): "Bổ sung bài hôm nay" / "Bổ sung bài" mở
// hộp NGAY TẠI CHỖ — mảnh nạp lười, chỉ tải khi bấm (mở màn Hôm nay không thêm byte).
const HopBoSungBai = lazy(() => import('../components/day-hoc/HopBoSungBai'))

// ------------------------------------------------------------------ PHÉP TÍNH THUẦN

export interface DemCanThayChua {
  catTia: number
  nutThat: number
  soY: number
  /** Câu em tự gỡ vẫn vướng (bước cuối trên lớp) — nguồn ngoài chiến dịch, như danh sách Cần thầy chữa. */
  tuGo?: number
  /** Số em cần kèm riêng (sai lại sau lời gỡ) — cả nhóm là MỘT dòng của danh sách. */
  kemRieng?: number
  tong: number
}

/** Đếm "Cần thầy chữa" — đúng ba nhóm của thẻ Cần thầy chữa trên Bảng chiến dịch (`nhomCanThayChua`; máy chủ chưa gửi nhóm câu sai từ 4 lần
 *  ⇒ dựng từ "Cần thầy dạy lại" sẵn có, cùng nghĩa). Một dòng = một chỗ. */
export function demCanThayChua(ds: readonly { canDayLai: readonly CauCanDayLai[]; omni: readonly CanThayChua[] }[]): DemCanThayChua {
  const d = { catTia: 0, nutThat: 0, soY: 0, tong: 0 }
  for (const x of ds) {
    for (const g of nhomCanThayChua(x.omni, x.canDayLai)) {
      if (g.loai === 'cat_tia') d.catTia += g.dong.length
      else if (g.loai === 'nut_that') d.nutThat += g.dong.length
      else d.soY += g.dong.length
    }
  }
  d.tong = d.catTia + d.nutThat + d.soY
  return d
}

/** "4 câu sai từ 4 lần trở lên · 2 câu có thẻ nút thắt · 1 em sơ ý cao" — nhóm 0 thì bỏ. */
export function chuCanThayChua(d: DemCanThayChua): string {
  return [
    d.catTia && `${d.catTia} câu sai từ 4 lần trở lên`,
    d.nutThat && `${d.nutThat} câu có thẻ nút thắt`,
    d.tuGo && `${d.tuGo} câu tự gỡ vẫn vướng`,
    d.soY && `${d.soY} em sơ ý cao`,
    d.kemRieng && `${d.kemRieng} em cần kèm riêng`,
  ].filter(Boolean).join(' · ')
}

// ------------------------------------------------------------------ TẢI SỐ

export interface DuLieuHomNay {
  /** null = chưa đọc được danh sách ca (lý do ở `loiCa`). */
  ca: CaTomTat[] | null
  loiCa: string
  /** null = chưa đọc được danh sách chiến dịch (lý do ở `loiCd`). */
  cd: ChienDichTom[] | null
  loiCd: string
  /** null = chưa biết (danh sách lỗi / mọi bảng lỗi). */
  canThayChua: DemCanThayChua | null
  /** Lớp chờ bài mới (OMNI): chỉ lớp đã chờ từ `NGAY_NHAC_CHO_BAI_MOI` ngày. */
  choBaiMoi: { lop: string; soNgay: number }[]
  /** Em hỏi bài chờ thầy chữa (màn Học sinh hỏi): `chuaChua` lượt hỏi ở `soCa` ca, `caMoi` = tên ca có lượt mới nhất. null = chưa đọc được. */
  hoi: { chuaChua: number; soCa: number; caMoi: string } | null
  loiHoi: string
  /** CÒN CHỜ (21/10, "app gv load chậm"): phần đầu (ca + chiến dịch) đã về nhưng bảng chiến dịch / lớp chờ / em hỏi chưa đủ ⇒ màn vẽ ngay phần đã có và để một khung xương cho phần còn lại. Vắng = đã đủ. */
  conCho?: true
}

/** Lý do dễ hiểu (câu tiếng Việt sẵn có giữ nguyên; lỗi kỹ thuật thô ⇒ "Mạng có thể đang chập chờn."). */
const loiChu = (e: unknown) => lyDoDeHieu(e)

export async function taiHomNay(onPhan?: (d: DuLieuHomNay) => void): Promise<DuLieuHomNay> {
  const cauHinh = (async () => {
    const [url, mat] = await Promise.all([loadScriptUrl(), loadTeacherSecret()])
    if (!url.trim() || !mat.trim()) throw new Error('Chưa kết nối máy chủ — vào Cài đặt › Công cụ kỹ thuật › Kết nối máy chủ')
    return { url: url.trim(), mat: mat.trim() }
  })()
  cauHinh.catch(() => {}) // lỗi cấu hình được từng lệnh dưới bắt và nói thật; dòng này chỉ để không báo "promise bị bỏ rơi"
  const taiCa = async () => {
    try {
      const { url, mat } = await cauHinh
      const ca = await danhSachCa(url, mat, false)
      if (!Array.isArray(ca)) throw new TypeError('danhSachCa: not an array') // máy chủ trả thiếu trường ⇒ câu dễ hiểu, không "Cannot read…"
      return { ca, loiCa: '' }
    } catch (e) {
      return { ca: null, loiCa: loiChu(e) }
    }
  }
  const taiCd = async () => {
    try {
      const r = await danhSach()
      return r.ok ? { cd: r.du.chienDich, loiCd: '' } : { cd: null, loiCd: loiChu(r.chu) }
    } catch (e) {
      return { cd: null, loiCd: loiChu(e) }
    }
  }
  // Em hỏi bài (nút "Hỏi bài Thầy" sau ca kiểm tra): MỘT lệnh cho mọi ca, gom theo ca tại máy — như màn Học sinh hỏi.
  const taiHoi = async () => {
    try {
      const { url, mat } = await cauHinh
      const ca = gomTheoCa(await danhSachCauHoi(url, mat, '', false)).filter((c) => c.chuaChua > 0)
      return { hoi: { chuaChua: ca.reduce((n, c) => n + c.chuaChua, 0), soCa: ca.length, caMoi: ca[0]?.tenCa || (ca[0] ? `Ca ${ca[0].maCa}` : '') }, loiHoi: '' }
    } catch (e) {
      return { hoi: null, loiHoi: loiChu(e) }
    }
  }
  const huaHoi = taiHoi()
  const taiCoOmni = async () => {
    try {
      const r = await docCoOmni()
      return r.ok ? r.du : null
    } catch {
      return null
    }
  }
  // Bước cuối + thẻ nút thắt: CÙNG bộ nạp và CÙNG cách gộp với danh sách Cần thầy chữa (Hành trình) ⇒ "Cần thầy chữa: N chỗ" ở đây,
  // số cạnh mục Hành trình và số dòng của danh sách là MỘT con số. Mảnh nạp lười; đọc hỏng ⇒ chỉ đếm phần chiến dịch (không bịa).
  const huaPhu = import('../components/chien-dich/TheCanThayChua')
    .then(async (m) => ({ gom: m.gomCanChua, ...(await m.taiNguonPhu()) }))
    .catch(() => null)
  // BỚT MỘT VÒNG CHỜ (21/10, thầy: "tối ưu tốc độ app tức thì"): đọc bảng chiến dịch chỉ cần danh sách chiến dịch, lớp chờ bài mới chỉ cần công tắc
  // OMNI ⇒ mỗi việc bắt đầu NGAY khi phần nó cần về, không chờ cả ba lệnh đầu (trước: chờ ca + chiến dịch + OMNI rồi mới đọc bảng / lớp chờ).
  const huaCa = taiCa()
  const huaCd = taiCd()
  const huaCo = taiCoOmni()
  const huaBang = huaCd.then(async ({ cd }) => {
    const chay = (cd ?? []).filter((c) => c.trangThai === 'dang_chay')
    const bang: (BangChienDich | null)[] = await taiGioiHan(chay, async (c) => {
      try {
        const r = await docBang(c.id, true) // chỉ đếm: bỏ báo cáo A/B nặng (srs2-gv.ts `boDoLuong`)
        return r.ok ? r.du : null
      } catch {
        return null
      }
    })
    return { chay, bang }
  })
  // Lớp chờ bài mới (OMNI) KHÔNG phụ thuộc bảng chiến dịch (chỉ cần công tắc OMNI + danh sách lớp) ⇒ chạy ngay khi biết công tắc.
  const taiCho = (async () => {
    const co = await huaCo
    if (!co?.bat) return []
    try {
      let lop = co.lop
      if (!lop.length) {
        const r = await layLopThay()
        lop = r.ok ? r.du.lop.map((l) => l.tenLop) : []
      }
      const kq = await taiGioiHan(lop, async (l) => {
        try {
          const r = await baiDaDayDanhSach(l)
          return r.ok && r.du.choBaiMoi && chuChoBaiMoi(l, r.du.choBaiMoi) ? { lop: l.trim(), soNgay: r.du.choBaiMoi.soNgay } : null
        } catch {
          return null
        }
      })
      return kq.filter((x): x is { lop: string; soNgay: number } => !!x).sort((a, b) => b.soNgay - a.soNgay || a.lop.localeCompare(b.lop, 'vi'))
    } catch {
      return []
    }
  })()
  const [{ ca, loiCa }, { cd, loiCd }, co] = await Promise.all([huaCa, huaCd, huaCo])

  // PHÁT PHẦN ĐẦU NGAY (21/10): ca + chiến dịch về là màn đã có việc để hiện (Ca đang mở · lỗi) — không chờ bảng chiến dịch, OMNI, lớp chờ. Em hỏi bài về lúc nào thì phát thêm lúc ấy.
  let hoiSom: { hoi: DuLieuHomNay['hoi']; loiHoi: string } | null = null
  let xongHet = false
  const phatPhanDau = () => {
    if (xongHet) return
    onPhan?.({ ca, loiCa, cd, loiCd, canThayChua: null, choBaiMoi: [], hoi: hoiSom?.hoi ?? null, loiHoi: hoiSom?.loiHoi ?? '', conCho: true })
  }
  phatPhanDau()
  if (onPhan) void huaHoi.then((r) => { hoiSom = r; phatPhanDau() })

  const { chay, bang } = await huaBang

  // Bảng bài OMNI (ba nhóm Cần thầy chữa): như Lên bảng chiến dịch — chỉ chiến dịch còn chạy, không phải Hành trình; OMNI tắt ⇒ không hỏi.
  const canOmni = chay.map((c, i) => ({ c, b: bang[i] })).filter((x) => co?.bat && x.b && !x.b.hanhTrinhNgay && !x.b.hetHan)
  const taiOmni = taiGioiHan(canOmni, async ({ c }) => {
    try {
      const r = await docBangOmniCua(c.id)
      return r.ok && (!r.du.chienDich.id || r.du.chienDich.id === c.id) ? r.du.canThayChua : []
    } catch {
      return [] as CanThayChua[]
    }
  })
  const [omni, choBaiMoi, { hoi, loiHoi }, phu] = await Promise.all([taiOmni, taiCho, huaHoi, huaPhu])
  const omniCua = new Map(canOmni.map((x, i) => [x.c.id, omni[i] ?? []] as const))

  const daDoc = chay.map((c, i) => ({ c, b: bang[i] })).filter((x): x is { c: ChienDichTom; b: BangChienDich } => !!x.b)
  const canThayChua = cd === null || (chay.length > 0 && daDoc.length === 0) ? null : demCanThayChua(daDoc.map(({ c, b }) => ({ canDayLai: b.canDayLai ?? [], omni: omniCua.get(c.id) ?? [] })))
  if (canThayChua && phu && (phu.buocCuoi || phu.nut)) {
    const dong = phu.gom({ chienDich: daDoc.map(({ c, b }) => ({ c, b, omni: omniCua.get(c.id) ?? [] })), buocCuoi: phu.buocCuoi ?? [], nutThat: phu.nut?.nhom ?? [], kemRieng: phu.nut?.kemRieng ?? [] })
    canThayChua.nutThat += dong.filter((d) => d.nguon === 'nut-that').length
    canThayChua.tuGo = dong.filter((d) => d.nguon === 'buoc-cuoi').length
    canThayChua.kemRieng = dong.find((d) => d.nguon === 'kem-rieng')?.soEm ?? 0
    canThayChua.tong = dong.length
  }

  xongHet = true
  return { ca, loiCa, cd, loiCd, canThayChua, choBaiMoi, hoi, loiHoi }
}

// ------------------------------------------------------------------ BẢN LẦN TRƯỚC (vẽ NGAY, rồi đọc mới)

/** Bản đọc xong lần trước, cất trong máy (21/10, thầy: "app gv load chậm … tức thì"): mở Hôm nay là vẽ ngay số lần trước + giờ "cập nhật", rồi đọc mới thay vào.
 * Chỉ giữ bản ĐỦ và KHÔNG lỗi, tối đa 3 giờ (ca đang mở lọc theo giờ thật nên không lên thẻ ca đã đóng). Đọc/ghi hỏng ⇒ như chưa có. */
const KHOA_DEM_DU = 'ddh.gvhn.du.v1'
const KHOA_DEM_NHIP = 'ddh.gvhn.nhip.v1'
const HAN_DEM_MS = 3 * 3_600_000
const TOI_DA_DEM_KY_TU = 450_000
function docDem<T>(khoa: string, hopLe: (du: unknown) => boolean): { luc: number; du: T } | null {
  try {
    const t = localStorage.getItem(khoa)
    if (!t) return null
    const o = JSON.parse(t) as { luc?: unknown; du?: unknown }
    if (typeof o.luc !== 'number' || !Number.isFinite(o.luc) || Math.abs(gioMayChu() - o.luc) > HAN_DEM_MS || !hopLe(o.du)) return null
    return { luc: o.luc, du: o.du as T }
  } catch {
    return null
  }
}
function ghiDem(khoa: string, du: unknown): void {
  try {
    const t = JSON.stringify({ luc: gioMayChu(), du })
    if (t.length <= TOI_DA_DEM_KY_TU) localStorage.setItem(khoa, t)
  } catch {
    /* bộ nhớ đầy / bị chặn: bỏ qua */
  }
}
const laDuHomNay = (d: unknown): boolean => {
  const o = d as Partial<DuLieuHomNay> | null
  return !!o && typeof o === 'object' && Array.isArray(o.choBaiMoi) && (o.ca === null || Array.isArray(o.ca)) && !o.conCho && !o.loiCa && !o.loiCd && !o.loiHoi && !!o.canThayChua
}
const laDuNhip = (d: unknown): boolean => !!d && typeof d === 'object' && (d as { ok?: unknown }).ok === true && !!(d as { kq?: unknown }).kq

// ------------------------------------------------------------------ MÀN

/** «Một trang» (giao diện «Trong»): số việc hiện trước khi bấm «Xem đủ N việc» (thừa đúng một việc thì hiện luôn, không cắt). */
const SO_VIEC_MOT_TRANG = 4

type Mau = 'xl' | 'ho' | 'hp' | 'xd' | 'tim' | 'xam'
interface Viec {
  key: string
  mau: Mau
  icon: LucideIcon
  /** Dòng đậm trên máy tính ("Cần thầy chữa · 8 chỗ"). */
  tieuDe: string
  /** Điện thoại: tên việc đậm + số ngắn ("Cần thầy chữa" · "8 chỗ"). */
  ten: string
  soNgan?: string
  phu: string
  /** Không có nút (thẻ báo "không có chỗ cần chữa") ⇒ để trống. */
  nut?: string
  lam?: () => void
  /** Thẻ báo lệnh chưa đọc được — trình đọc màn hình đọc ngay. */
  loi?: boolean
}

/** "10:15" giờ Việt Nam. */
const gioPhut = (ms: number): string => {
  const d = new Date(ms + 7 * 3_600_000)
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`
}

/** Khung xương đúng hình hàng thẻ việc. */
function XuongViec({ mot = false }: { mot?: boolean }) {
  return (
    <div className="gvhn-the-ds" role="status" aria-label={mot ? 'Đang kiểm tra phần còn lại' : 'Đang tải việc hôm nay'}>
      {(mot ? [0] : [0, 1, 2]).map((i) => (
        <span key={i} className="gvhn-the-viec gvhn-xuong-the">
          <span className="gv-xuong-khoi tt-xuong" style={{ width: 44, height: 44, borderRadius: 12 }} />
          <span className="gvhn-xuong-chu">
            <span className="gv-xuong-khoi tt-xuong" style={{ width: '70%', height: 14 }} />
            <span className="gv-xuong-khoi tt-xuong" style={{ width: '45%', height: 12 }} />
          </span>
        </span>
      ))}
    </div>
  )
}

export default function GvHomNayScreen() {
  const setScreen = useAppStore((s) => s.setScreen)
  const moChiTietCa = useAppStore((s) => s.moChiTietCa)
  const datSo = useSoDemGv((s) => s.datSo)
  const datMoHanhTrinh = useSoDemGv((s) => s.datMoHanhTrinh)
  const [demDu] = useState(() => docDem<DuLieuHomNay>(KHOA_DEM_DU, laDuHomNay))
  const [demNhip] = useState(() => docDem<DuNhip>(KHOA_DEM_NHIP, laDuNhip))
  const [du, setDu] = useState<DuLieuHomNay | null>(demDu?.du ?? null)
  const [dangTai, setDangTai] = useState(false)
  const [nhip, setNhip] = useState<DuNhip | null>(demNhip?.du ?? null)
  const [dangTaiNhip, setDangTaiNhip] = useState(false)
  const [capNhat, setCapNhat] = useState<number | null>(demNhip?.luc ?? demDu?.luc ?? null)

  const lanTai = useRef(0)
  const tai = useCallback(async () => {
    const lan = ++lanTai.current
    setDangTai(true)
    // Đã có bản lần trước trên màn ⇒ KHÔNG thay bằng phần đầu (sẽ mất số "Cần thầy chữa" tới khi đọc đủ); chưa có ⇒ vẽ từng phần ngay khi về.
    const kq = await taiHomNay(demDu ? undefined : (phan) => { if (lan === lanTai.current) setDu(phan) })
    if (lan !== lanTai.current) return
    setDu(kq)
    setDangTai(false)
    if (laDuHomNay(kq)) ghiDem(KHOA_DEM_DU, kq)
  }, [demDu])
  // Nhịp học: MỘT lệnh, hỏi SAU phần việc (xem useEffect dưới); lỗi chỉ ảnh hưởng khối Nhịp học (Thử lại riêng).
  const lanNhip = useRef(0)
  const taiNhip = useCallback(async () => {
    const lan = ++lanNhip.current
    setDangTaiNhip(true)
    let kq: DuNhip
    try {
      const r = await layNhipHoc()
      kq = r.ok ? { ok: true, kq: r.du } : { ok: false, chu: r.loai === 'chua_co_lenh' ? r.chu : lyDoDeHieu(r.chu) }
    } catch (e) {
      kq = { ok: false, chu: lyDoDeHieu(e) }
    }
    if (lan !== lanNhip.current) return
    setNhip(kq)
    if (kq.ok) {
      setCapNhat(gioMayChu())
      ghiDem(KHOA_DEM_NHIP, kq)
    }
    setDangTaiNhip(false)
  }, [])
  useEffect(() => {
    let huy = false
    const viec = tai()
    // NHỊP HỌC ĐỨNG SAU PHẦN VIỆC (21/10, thầy: "app gv không vào được"): nó là lệnh nặng nhất màn này (≈ 188 nghìn dòng đọc) và D1 đơn luồng — chạy CÙNG LÚC thì các lệnh nhẹ của phần việc xếp hàng
    // sau nó, cả màn quá 20 giây là máy thầy bỏ. Phần việc xong (hoặc quá 5 giây) mới hỏi Nhịp học; đã có bản lần trước thì màn vẫn vẽ ngay, Nhịp học chỉ đọc mới sau.
    const cho = new Promise<void>((xong) => {
      const hen = setTimeout(xong, 5000)
      void viec.finally(() => { clearTimeout(hen); xong() })
    })
    void cho.then(() => { if (!huy) void taiNhip() })
    return () => {
      huy = true
      lanTai.current++
      lanNhip.current++
    }
  }, [tai, taiNhip])

  const now = gioMayChu()
  const caMo = useMemo(() => (du?.ca ?? []).filter((c) => c.loai !== 'baitap' && caConEmDangLam(c, now)), [du, now])

  useEffect(() => {
    if (!du) return
    // Phần đầu (còn chờ) chưa biết "Cần thầy chữa" ⇒ không ghi đè số cũ bằng "chưa biết".
    datSo({ caMo: du.ca ? caMo.length : null, ...(du.conCho ? {} : { canThayChua: du.canThayChua ? du.canThayChua.tong : null }) })
  }, [du, caMo.length, datSo])

  const moHanhTrinh = (m: MoHanhTrinh) => {
    datMoHanhTrinh(m)
    setScreen('chiendich')
  }
  const [moBoSung, setMoBoSung] = useState(false)
  // «Một trang» (chỉ «Trong»): danh sách Việc cần thầy dài ⇒ 4 việc đầu + «Xem đủ N việc» (mở ra thì cuộn trong thẻ, trang không cuộn)
  const [moHetViec, setMoHetViec] = useState(false)

  // VIỆC CẦN THẦY — xếp theo độ gấp: ca đang mở → Cần thầy chữa → em hỏi bài → lớp chờ bài mới → phần chưa đọc được (Thử lại)
  // → không có chỗ cần chữa (✓, không nút). Việc "em chưa làm câu nào" đã bỏ: khối Nhịp học nói đủ và rõ hơn.
  const viec: Viec[] = []
  for (const c of caMo) {
    const ten = c.tenCa || `Ca ${c.maCa}`
    viec.push({
      key: `ca-${c.maCa}`,
      mau: 'xd',
      icon: MonitorCheck,
      tieuDe: 'Ca đang mở',
      ten: 'Ca đang mở',
      soNgan: `đã nộp ${c.daNop}/${c.daVao}`,
      phu: `${ten}${c.lop && !ten.includes(c.lop) ? ` · ${c.lop}` : ''} · đã nộp ${c.daNop}/${c.daVao} em`,
      nut: 'Theo dõi',
      lam: () => moChiTietCa(c.maCa),
    })
  }
  if (du?.canThayChua && du.canThayChua.tong > 0) {
    const n = du.canThayChua.tong
    viec.push({ key: 'can-chua', mau: 'hp', icon: PenLine, tieuDe: `Cần thầy chữa · ${n} chỗ`, ten: 'Cần thầy chữa', soNgan: `${n} chỗ`, phu: chuCanThayChua(du.canThayChua), nut: 'Chữa bài', lam: () => moHanhTrinh({ the: 'can-chua' }) })
  }
  if (du?.hoi && du.hoi.chuaChua > 0) {
    const h = du.hoi
    viec.push({
      key: 'hoi',
      mau: 'tim',
      icon: CircleHelp,
      tieuDe: `Học sinh hỏi · ${h.chuaChua} lượt`,
      ten: 'Học sinh hỏi',
      soNgan: `${h.chuaChua} lượt`,
      phu: `chờ thầy chữa · ${h.soCa === 1 ? h.caMoi : `${h.soCa} ca, mới nhất: ${h.caMoi}`}`,
      nut: 'Xem',
      lam: () => setScreen('cauhoi'),
    })
  }
  if (du && du.choBaiMoi.length > 0) {
    const ds = du.choBaiMoi
    viec.push({
      key: 'bai-moi',
      mau: 'tim',
      icon: BookOpen,
      tieuDe: ds.length === 1 ? `${ds[0]!.lop}: ${ds[0]!.soNgay} ngày chưa có bài mới` : `${ds.length} lớp chưa có bài mới`,
      ten: ds.length === 1 ? `${ds[0]!.lop}: chưa có bài mới` : 'Lớp chưa có bài mới',
      soNgan: ds.length === 1 ? `${ds[0]!.soNgay} ngày` : `${ds.length} lớp`,
      phu: ds.length === 1 ? 'Hành trình đang ôn bài cũ · tick bài vừa dạy để mở câu mới' : `${ds.map((x) => `${x.lop}: ${x.soNgay} ngày`).join(' · ')} — tick bài vừa dạy để mở câu mới`,
      nut: 'Bổ sung bài',
      lam: () => setMoBoSung(true),
    })
  }
  // Phần chưa đọc được: MỘT thẻ, nói thật phần nào + lý do dễ hiểu + Thử lại (không in lỗi kỹ thuật thô).
  const hong = du
    ? ([
        du.loiCa && ['danh sách ca kiểm tra', du.loiCa],
        du.loiCd && ['Hành trình và chiến dịch', du.loiCd],
        du.loiHoi && ['câu học sinh hỏi', du.loiHoi],
      ].filter(Boolean) as [string, string][])
    : []
  if (hong.length > 0) {
    const lyDo = Array.from(new Set(hong.map(([, l]) => l))).join(' ')
    const conLai = !!du && (du.canThayChua !== null || du.ca !== null || du.hoi !== null)
    viec.push({
      key: 'loi',
      mau: 'xam',
      icon: RefreshCw,
      tieuDe: `Chưa tải được ${hong.map(([ten]) => ten).join(' · ')}`,
      ten: 'Chưa tải được',
      soNgan: hong.map(([ten]) => ten).join(' · '),
      phu: `${lyDo}${conLai ? ' Số khác trên trang vẫn đúng.' : ''}`,
      nut: dangTai ? 'Đang tải lại…' : 'Thử lại',
      lam: () => void tai(),
      loi: true,
    })
  }
  if (du?.canThayChua && du.canThayChua.tong === 0) {
    viec.push({ key: 'khong-chua', mau: 'xl', icon: Check, tieuDe: 'Không có chỗ cần thầy chữa hôm nay.', ten: 'Không có chỗ cần thầy chữa hôm nay.', phu: '' })
  }

  // Nút chính góc phải = việc gấp nhất: có ca đang mở ⇒ theo dõi ca ấy; không thì bổ sung bài hôm nay.
  const nutChinh = caMo.length > 0 ? { chu: 'Theo dõi ca đang mở', lam: () => moChiTietCa(caMo[0]!.maCa) } : { chu: 'Bổ sung bài hôm nay', lam: () => setMoBoSung(true) }
  const soEm = nhip?.ok ? nhip.kq.em.length : null

  // «Trong» · «Một trang» (bản vẽ 26/10 chiều): khối Việc cần thầy là cột đầu của lưới một khung hình (NhipHocThay đặt); không «Trong» ⇒ đúng chỗ cũ.
  const trong = typeof document !== 'undefined' && document.documentElement.dataset.trong === 'gv'
  const soViec = viec.filter((v) => v.nut && !v.loi).length
  const catViec = trong && !moHetViec && viec.length > SO_VIEC_MOT_TRANG + 1
  const viecHien = catViec ? viec.slice(0, SO_VIEC_MOT_TRANG) : viec
  const khoiViec = (
      <section className="gvhn-viec-khoi" aria-label="Việc cần thầy">
        {trong && du && viec.length > 0 && (
          <div className="gvhn-viec-dau">
            <h2>Việc cần thầy</h2>
            {soViec > 0 && <span className="gvv2-so">{soViec} việc</span>}
            {/* «Một trang»: nút cắt/mở danh sách nằm ở đầu thẻ (không tốn thêm một hàng dưới danh sách) */}
            {viec.length > SO_VIEC_MOT_TRANG + 1 && (
              <button type="button" className="gvv2-nut-chu tt-nhan gvhn-viec-them" aria-expanded={!catViec} onClick={() => setMoHetViec((m) => !m)}>
                {catViec ? `Xem đủ ${viec.length} việc` : 'Thu gọn'}
                <ChevronRight size={16} aria-hidden="true" />
              </button>
            )}
          </div>
        )}
        {!du || (viec.length === 0 && du.conCho) ? (
          <XuongViec />
        ) : viec.length === 0 ? (
          <p className="gvv2-trong gvhn-viec-trong">Không có việc cần thầy lúc này. Màn tự đọc lại số mỗi lần thầy mở.</p>
        ) : (
          <ul className="gvhn-the-ds">
            {viecHien.map((v) => {
              const Icon = v.icon
              const ruot = (
                <>
                  <span className="gvhn-dau-o" data-mau={v.mau} aria-hidden="true">
                    <Icon size={20} aria-hidden="true" />
                  </span>
                  <span className="gvhn-the-chu">
                    <b className="nht-an-hep">{v.tieuDe}</b>
                    <span className="nht-chi-hep">
                      <b>{v.ten}</b>
                      {v.soNgan && <span className="gvv2-so"> · {v.soNgan}</span>}
                    </span>
                    {v.phu && <span className="gvhn-the-phu">{v.phu}</span>}
                  </span>
                </>
              )
              return (
                <li key={v.key} className="gvhn-the-viec" role={v.loi ? 'alert' : undefined} data-viec={v.key}>
                  {v.nut && v.lam ? (
                    <button type="button" className="gvhn-the-nut tt-nhan" onClick={v.lam} disabled={v.loi && dangTai}>
                      {ruot}
                      {/* MỘT nút chính trên màn (luật C2) ở đầu màn; mỗi việc là MỘT nút (cả thẻ), chữ hành động viền như nút phụ. */}
                      <span className="gvhn-the-hanh">{v.nut}</span>
                      <ChevronRight className="gvhn-the-mui" size={18} aria-hidden="true" />
                    </button>
                  ) : (
                    <div className="gvhn-the-nut" data-tinh="true">
                      {ruot}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
        {du?.conCho && viec.length > 0 && <XuongViec mot />}
      </section>
  )

  return (
    <div className="gv2-trang gvhn gvhn-1210">
      <header className="gvhn-dau" data-co-ca={caMo.length > 0 ? '' : undefined}>
        <div className="gvhn-dau-chu">
          <h1 className="gvv2-h1">Hôm nay của thầy</h1>
          {/* điện thoại (bản vẽ): "Thứ Hai 12/10 · 262 em · cập nhật 10:15" — bỏ năm và chữ "đang học" cho vừa một dòng */}
          <p className="gvv2-phu gvv2-so">
            <span className="nht-an-hep">{hienNgay(ngayVn(now))}</span>
            <span className="nht-chi-hep">{hienNgay(ngayVn(now), false)}</span>
            {soEm !== null && soEm > 0 && (
              <>
                {` · ${soEm} em`}
                <span className="nht-an-hep"> đang học</span>
              </>
            )}
            {capNhat !== null && ` · cập nhật ${gioPhut(capNhat)}`}
          </p>
        </div>
        {/* «Một trang»: có ca đang mở thì «Bổ sung bài hôm nay» thành nút phụ cạnh nút chính (cùng hộp bổ sung bài như nút ở việc «Lớp chưa có bài mới») */}
        {trong && caMo.length > 0 && (
          <button type="button" className="gvv2-nut-vien gvhn-nut-phu tt-nhan" onClick={() => setMoBoSung(true)}>
            <Plus size={18} aria-hidden="true" />
            Bổ sung bài hôm nay
          </button>
        )}
        <button type="button" className="gvv2-nut-chinh gvhn-nut-chinh tt-nhan" onClick={nutChinh.lam}>
          {trong && (caMo.length > 0 ? <Eye size={18} aria-hidden="true" /> : <Plus size={18} aria-hidden="true" />)}
          {nutChinh.chu}
        </button>
      </header>

      {!trong && khoiViec}

      <NhipHocThay du={nhip} dangTai={dangTaiNhip} onThuLai={() => void taiNhip()} viec={trong ? khoiViec : undefined} />
      {moBoSung && (
        <Suspense fallback={null}>
          <HopBoSungBai
            onDong={(daGiao) => {
              setMoBoSung(false)
              // Vừa giao / bỏ tick ⇒ tải lại việc (thẻ "Lớp chưa có bài mới" theo đúng máy chủ).
              if (daGiao) void tai()
            }}
          />
        </Suspense>
      )}
    </div>
  )
}
