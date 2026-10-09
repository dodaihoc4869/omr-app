// HÔM NAY CỦA THẦY — màn đầu app thầy khi Game Hóa 2.0 bật (BẢN VẼ TỐI GIẢN THẦY CHỐT 09/10 · GV-HomNay.dc.html, BoGop: "Tổng quan: 2 nút chính
// + nút Mở ca → Hôm nay: danh sách việc, mỗi việc 1 nút"). Trả lời MỘT câu: "Lớp tôi cần gì hôm nay?". Mã màn vẫn là `tongquan` (TongQuanScreen giữ mã).
// TRUNG TU 09/10 (thầy duyệt bản vẽ GV-HomNay, "build luôn"):
//   · đầu màn: tiêu đề 32 + dòng phụ; MỘT nút chính gọn ở góc phải = việc gấp nhất (có ca đang mở ⇒ "Theo dõi ca đang mở", không thì
//     "Bổ sung bài hôm nay").
//   · lưới 2fr / 1fr. Trái "Việc cần thầy · xếp theo độ gấp" (thứ tự DOM = thứ tự mắt = thứ tự Tab — bỏ column-reverse): ca đang mở → Theo dõi
//     ca · Cần thầy chữa → Hành trình › Cần thầy chữa · em hỏi bài chờ chữa → Học sinh hỏi · lớp chờ bài mới (OMNI) → Hành trình › Bài đã dạy ·
//     em chưa làm câu nào → Hành trình › Nhịp hôm nay · phần chưa đọc được → Thử lại · không có chỗ cần chữa ⇒ một dòng ✓. MỖI việc MỘT nút viền.
//   · phải: thẻ "Đủ mức tối thiểu hôm nay a/b em" + mỗi khối một dòng (thanh + a/b), bấm mở Hành trình khối đó.
//   · BỎ bốn ô số lặp lại danh sách việc (C4: một thông tin một chỗ). Chờ tải: khung xương đúng hình (`.tt-xuong`). Lỗi: câu dễ hiểu
//     (`lyDoDeHieu`), không in lỗi kỹ thuật thô.
//   Số "Đủ mức" / "chưa làm" cộng từ bảng hôm nay của các Hành trình — `danh-sach` lọc `hanhTrinh` rồi `bang` → `hanhTrinhNgay.em`, cùng phép
//   đếm `chiSoNhip` của màn Hành trình. "Cần thầy chữa" = ba nhóm thẻ Cần thầy chữa của Bảng chiến dịch (`nhomCanThayChua`).
// SỐ CHỈ TỪ API SẴN CÓ, không đổi máy chủ, không số giả: lệnh nào lỗi thì phần của nó KHÔNG vẽ, và một dòng nói thật phần nào chưa đọc được.
// Ghi số cho thanh bên (`useSoDemGv`: ca đang mở, Cần thầy chữa). Phép tính thuần xuất ra để test (tests/gv-hom-nay-0910.test.tsx).
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { BookOpen, Check, ChevronRight, Clock, MessageCircleQuestion, MonitorCheck, Presentation, RefreshCw, type LucideIcon } from 'lucide-react'
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
import { danhSach, docBang, type BangChienDich, type CauCanDayLai, type ChienDichTom } from '../components/chien-dich/api'
import { baiDaDayDanhSach, docBangOmniCua, docCoOmni } from '../components/chien-dich/api-omni'
import { nhomCanThayChua } from '../components/chien-dich/omni-bang'
import { chiSoNhip, khoiCuaHanhTrinh, type ChiSoNhip } from '../components/chien-dich/nhip-hanh-trinh'
import { hienNgay, ngayVn } from '../components/chien-dich/ngay'
import type { CanThayChua } from '../../server/src/omni-kieu'
import { caConEmDangLam } from './LichSuCaScreen'
import './gv-hoa2.css'
import '../components/chien-dich/gv-v2.css'
import './gv-hom-nay.css'

// ------------------------------------------------------------------ PHÉP TÍNH THUẦN

/** Nhịp hôm nay của một Hành trình (một khối). `cs` null = chưa đọc được bảng hôm nay ⇒ không vẽ hàng. */
export interface NhipKhoi {
  cd: ChienDichTom
  khoi: string | null
  cs: ChiSoNhip | null
}

/** Cộng nhịp các khối đã đọc được bảng. Không khối nào đọc được ⇒ null (không vẽ ô số). */
export function tongNhip(ds: readonly NhipKhoi[]): { duMuc: number; coMuc: number; chuaLam: number; tong: number } | null {
  const co = ds.filter((d) => d.cs)
  if (co.length === 0) return null
  return co.reduce((s, d) => ({ duMuc: s.duMuc + d.cs!.duMuc, coMuc: s.coMuc + d.cs!.coMuc, chuaLam: s.chuaLam + d.cs!.chuaLam, tong: s.tong + d.cs!.tong }), { duMuc: 0, coMuc: 0, chuaLam: 0, tong: 0 })
}

export interface DemCanThayChua {
  catTia: number
  nutThat: number
  soY: number
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
  return [d.catTia && `${d.catTia} câu sai từ 4 lần trở lên`, d.nutThat && `${d.nutThat} câu có thẻ nút thắt`, d.soY && `${d.soY} em sơ ý cao`].filter(Boolean).join(' · ')
}

// ------------------------------------------------------------------ TẢI SỐ

export interface DuLieuHomNay {
  /** null = chưa đọc được danh sách ca (lý do ở `loiCa`). */
  ca: CaTomTat[] | null
  loiCa: string
  /** null = chưa đọc được danh sách chiến dịch (lý do ở `loiCd`). */
  cd: ChienDichTom[] | null
  loiCd: string
  nhip: NhipKhoi[]
  /** null = chưa biết (danh sách lỗi / mọi bảng lỗi). */
  canThayChua: DemCanThayChua | null
  /** Lớp chờ bài mới (OMNI): chỉ lớp đã chờ từ `NGAY_NHAC_CHO_BAI_MOI` ngày. */
  choBaiMoi: { lop: string; soNgay: number }[]
  /** Em hỏi bài chờ thầy chữa (màn Học sinh hỏi): `chuaChua` lượt hỏi ở `soCa` ca, `caMoi` = tên ca có lượt mới nhất. null = chưa đọc được. */
  hoi: { chuaChua: number; soCa: number; caMoi: string } | null
  loiHoi: string
}

/** Lý do dễ hiểu (câu tiếng Việt sẵn có giữ nguyên; lỗi kỹ thuật thô ⇒ "Mạng có thể đang chập chờn."). */
const loiChu = (e: unknown) => lyDoDeHieu(e)

export async function taiHomNay(): Promise<DuLieuHomNay> {
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
  const [{ ca, loiCa }, { cd, loiCd }, co] = await Promise.all([taiCa(), taiCd(), taiCoOmni()])

  const chay = (cd ?? []).filter((c) => c.trangThai === 'dang_chay')
  const bang: (BangChienDich | null)[] = await taiGioiHan(chay, async (c) => {
    try {
      const r = await docBang(c.id)
      return r.ok ? r.du : null
    } catch {
      return null
    }
  })

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
  // Lớp chờ bài mới (OMNI): lớp OMNI áp (danh sách lớp của công tắc; bật cả trung tâm ⇒ mọi lớp của thầy), mỗi lớp một lệnh `danh-sach`.
  const taiCho = (async () => {
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
  const [omni, choBaiMoi, { hoi, loiHoi }] = await Promise.all([taiOmni, taiCho, huaHoi])
  const omniCua = new Map(canOmni.map((x, i) => [x.c.id, omni[i] ?? []] as const))

  const daDoc = chay.map((c, i) => ({ c, b: bang[i] })).filter((x): x is { c: ChienDichTom; b: BangChienDich } => !!x.b)
  const canThayChua = cd === null || (chay.length > 0 && daDoc.length === 0) ? null : demCanThayChua(daDoc.map(({ c, b }) => ({ canDayLai: b.canDayLai ?? [], omni: omniCua.get(c.id) ?? [] })))

  const nhip: NhipKhoi[] = chay
    .map((c, i) => ({ c, b: bang[i] }))
    .filter((x) => x.c.hanhTrinh)
    .map(({ c, b }) => ({ cd: c, khoi: khoiCuaHanhTrinh(c), cs: b?.hanhTrinhNgay ? chiSoNhip(b.hanhTrinhNgay.em) : null }))
    .sort((a, b) => String(a.khoi).localeCompare(String(b.khoi)))

  return { ca, loiCa, cd, loiCd, nhip, canThayChua, choBaiMoi, hoi, loiHoi }
}

// ------------------------------------------------------------------ MÀN

type Mau = 'xl' | 'ho' | 'hp' | 'xd' | 'tim' | 'xam'
interface Viec {
  key: string
  mau: Mau
  icon: LucideIcon
  tieuDe: string
  phu: string
  /** Không có nút (dòng báo "không có chỗ cần chữa") ⇒ để trống. */
  nut?: string
  lam?: () => void
  /** Dòng báo lệnh chưa đọc được — trình đọc màn hình đọc ngay. */
  loi?: boolean
}

const tiLe = (a: number, b: number) => (b > 0 ? Math.round((100 * Math.min(a, b)) / b) : 0)

/** Khung xương đúng hình màn Hôm nay (thẻ việc 3 dòng + thẻ đủ mức 3 khối) — thay chữ "Đang tải…". */
function XuongHomNay() {
  return (
    <div className="gvhn-luoi" role="status" aria-label="Đang tải việc hôm nay">
      <div className="gvv2-the gvhn-viec gvhn-xuong">
        <span className="gv-xuong-khoi tt-xuong" style={{ width: 260, height: 18 }} />
        {[0, 1, 2].map((i) => (
          <span key={i} className="gvhn-xuong-dong">
            <span className="gv-xuong-khoi tt-xuong" style={{ width: 44, height: 44, borderRadius: 14 }} />
            <span className="gvhn-xuong-chu">
              <span className="gv-xuong-khoi tt-xuong" style={{ width: '70%', height: 14 }} />
              <span className="gv-xuong-khoi tt-xuong" style={{ width: '45%', height: 12 }} />
            </span>
            <span className="gv-xuong-khoi tt-xuong" style={{ width: 112, height: 44, borderRadius: 12 }} />
          </span>
        ))}
      </div>
      <div className="gvv2-the gvhn-du gvhn-xuong">
        <span className="gv-xuong-khoi tt-xuong" style={{ width: 160, height: 14 }} />
        <span className="gv-xuong-khoi tt-xuong" style={{ width: 140, height: 44 }} />
        <span className="gv-xuong-khoi tt-xuong" style={{ width: '100%', height: 8 }} />
        {[0, 1, 2].map((i) => (
          <span key={i} className="gv-xuong-khoi tt-xuong" style={{ width: '100%', height: 20 }} />
        ))}
      </div>
    </div>
  )
}

export default function GvHomNayScreen() {
  const setScreen = useAppStore((s) => s.setScreen)
  const moChiTietCa = useAppStore((s) => s.moChiTietCa)
  const datSo = useSoDemGv((s) => s.datSo)
  const datMoHanhTrinh = useSoDemGv((s) => s.datMoHanhTrinh)
  const [du, setDu] = useState<DuLieuHomNay | null>(null)
  const [dangTai, setDangTai] = useState(false)

  const lanTai = useRef(0)
  const tai = useCallback(async () => {
    const lan = ++lanTai.current
    setDangTai(true)
    const kq = await taiHomNay()
    if (lan !== lanTai.current) return
    setDu(kq)
    setDangTai(false)
  }, [])
  useEffect(() => {
    void tai()
    return () => {
      lanTai.current++
    }
  }, [tai])

  const now = gioMayChu()
  const caMo = useMemo(() => (du?.ca ?? []).filter((c) => c.loai !== 'baitap' && caConEmDangLam(c, now)), [du, now])
  const tong = useMemo(() => (du ? tongNhip(du.nhip) : null), [du])
  const khoiCo = useMemo(() => (du?.nhip ?? []).filter((n) => n.cs), [du])

  useEffect(() => {
    if (!du) return
    datSo({ caMo: du.ca ? caMo.length : null, canThayChua: du.canThayChua ? du.canThayChua.tong : null })
  }, [du, caMo.length, datSo])

  const moHanhTrinh = (m: MoHanhTrinh) => {
    datMoHanhTrinh(m)
    setScreen('chiendich')
  }

  // VIỆC CẦN THẦY — xếp theo độ gấp: ca đang mở (đang diễn ra) → Cần thầy chữa → em hỏi bài → lớp chờ bài mới → em chưa làm câu nào
  // → phần chưa đọc được (Thử lại) → không có chỗ cần chữa (✓, không nút).
  const viec: Viec[] = []
  for (const c of caMo) {
    viec.push({
      key: `ca-${c.maCa}`,
      mau: 'xd',
      icon: MonitorCheck,
      tieuDe: `Ca đang mở: ${c.tenCa || `Ca ${c.maCa}`}${c.lop ? ` · ${c.lop}` : ''}`,
      phu: `Đã vào ${c.daVao} em · đã nộp ${c.daNop} em`,
      nut: 'Theo dõi ca',
      lam: () => moChiTietCa(c.maCa),
    })
  }
  if (du?.canThayChua && du.canThayChua.tong > 0) {
    viec.push({ key: 'can-chua', mau: 'hp', icon: Presentation, tieuDe: `Cần thầy chữa: ${du.canThayChua.tong} chỗ`, phu: chuCanThayChua(du.canThayChua), nut: 'Xếp buổi chữa', lam: () => moHanhTrinh({ the: 'can-chua' }) })
  }
  if (du?.hoi && du.hoi.chuaChua > 0) {
    const h = du.hoi
    viec.push({
      key: 'hoi',
      mau: 'tim',
      icon: MessageCircleQuestion,
      tieuDe: `Học sinh hỏi: ${h.chuaChua} lượt chờ thầy chữa`,
      phu: h.soCa === 1 ? h.caMoi : `${h.soCa} ca · mới nhất: ${h.caMoi}`,
      nut: 'Xem câu hỏi',
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
      phu: ds.length === 1 ? 'Hành trình đang ôn bài cũ · tick bài vừa dạy để mở câu mới' : `${ds.map((x) => `${x.lop}: ${x.soNgay} ngày`).join(' · ')} — tick bài vừa dạy để mở câu mới`,
      nut: 'Bổ sung bài',
      lam: () => moHanhTrinh({ the: 'bai-da-day', boSungBai: true }),
    })
  }
  if (tong && tong.chuaLam > 0) {
    const coEm = khoiCo.filter((n) => n.cs!.chuaLam > 0)
    const nhieuNhat = [...coEm].sort((a, b) => b.cs!.chuaLam - a.cs!.chuaLam)[0]
    viec.push({
      key: 'chua-lam',
      mau: 'ho',
      icon: Clock,
      tieuDe: `${tong.chuaLam} em chưa làm câu nào hôm nay`,
      phu: coEm.map((n) => `Khối ${n.khoi ?? '—'}: ${n.cs!.chuaLam} em`).join(' · '),
      nut: 'Xem danh sách',
      lam: () => moHanhTrinh({ the: 'nhip', chienDichId: nhieuNhat?.cd.id }),
    })
  }
  // Phần chưa đọc được: MỘT dòng, nói thật phần nào + lý do dễ hiểu + Thử lại (không in lỗi kỹ thuật thô).
  const hong = du
    ? ([
        du.loiCa && ['danh sách ca kiểm tra', du.loiCa],
        du.loiCd && ['Hành trình và chiến dịch', du.loiCd],
        du.loiHoi && ['câu học sinh hỏi', du.loiHoi],
      ].filter(Boolean) as [string, string][])
    : []
  if (hong.length > 0) {
    const lyDo = Array.from(new Set(hong.map(([, l]) => l))).join(' ')
    const conLai = !!du && (!!tong || du.canThayChua !== null || du.ca !== null || du.hoi !== null)
    viec.push({
      key: 'loi',
      mau: 'xam',
      icon: RefreshCw,
      tieuDe: `Chưa tải được ${hong.map(([ten]) => ten).join(' · ')}`,
      phu: `${lyDo}${conLai ? ' Số khác trên trang vẫn đúng.' : ''}`,
      nut: dangTai ? 'Đang tải lại…' : 'Thử lại',
      lam: () => void tai(),
      loi: true,
    })
  }
  if (du?.canThayChua && du.canThayChua.tong === 0) {
    viec.push({ key: 'khong-chua', mau: 'xl', icon: Check, tieuDe: 'Không có chỗ cần thầy chữa hôm nay.', phu: '' })
  }

  // Nút chính góc phải = việc gấp nhất: có ca đang mở ⇒ theo dõi ca ấy; không thì bổ sung bài hôm nay.
  const nutChinh = caMo.length > 0 ? { chu: 'Theo dõi ca đang mở', lam: () => moChiTietCa(caMo[0]!.maCa) } : { chu: 'Bổ sung bài hôm nay', lam: () => moHanhTrinh({ the: 'bai-da-day', boSungBai: true }) }

  return (
    <div className="gv2-trang gvhn">
      <header className="gvhn-dau">
        <div className="gvhn-dau-chu">
          <h1 className="gvv2-h1">Hôm nay của thầy</h1>
          <p className="gvv2-phu">
            {hienNgay(ngayVn(now))}
            {khoiCo.length > 0 && tong && (
              <>
                {' · '}
                <span className="gvv2-so">{khoiCo.length}</span> khối · <span className="gvv2-so">{tong.tong}</span> em đang chạy Hành trình
              </>
            )}
          </p>
        </div>
        <button type="button" className="gvv2-nut-chinh gvhn-nut-chinh tt-nhan" onClick={nutChinh.lam}>
          {nutChinh.chu}
        </button>
      </header>

      {!du ? (
        <XuongHomNay />
      ) : (
        <div className="gvhn-luoi">
          <section className="gvv2-the gvhn-viec" aria-labelledby="gvhn-viec-tieu">
            <h2 id="gvhn-viec-tieu" className="gvv2-h2">
              Việc cần thầy · xếp theo độ gấp
            </h2>
            {viec.length === 0 ? (
              <p className="gvv2-trong">Không có việc cần thầy lúc này. Màn tự đọc lại số mỗi lần thầy mở.</p>
            ) : (
              <ul className="gvhn-viec-ds">
                {viec.map((v) => {
                  const Icon = v.icon
                  return (
                    <li key={v.key} className="gvhn-viec-dong" role={v.loi ? 'alert' : undefined} data-viec={v.key}>
                      <span className="gvhn-dau-o" data-mau={v.mau} aria-hidden="true">
                        <Icon size={20} aria-hidden="true" />
                      </span>
                      <span className="gvhn-viec-chu">
                        <b>{v.tieuDe}</b>
                        {v.phu && <span>{v.phu}</span>}
                      </span>
                      {/* Một nút chính trên màn (luật C2) ở đầu màn; mỗi việc MỘT nút viền. */}
                      {v.nut && v.lam && (
                        <button type="button" className="gvv2-nut-vien tt-nhan" onClick={v.lam} disabled={v.loi && dangTai} aria-label={v.loi ? v.nut : `${v.nut}: ${v.tieuDe}`}>
                          {v.nut}
                        </button>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </section>

          {tong && khoiCo.length > 0 && (
            <aside className="gvv2-the gvhn-du" aria-labelledby="gvhn-du-tieu">
              <span id="gvhn-du-tieu" className="gvhn-du-nhan">
                Đủ mức tối thiểu hôm nay
              </span>
              <b className="gvhn-du-so gvv2-so">
                {tong.duMuc}
                <small>/{tong.coMuc} em</small>
              </b>
              <span className="gvv2-thanh gvhn-du-thanh" data-du="true" role="progressbar" aria-label="Em đủ mức tối thiểu hôm nay" aria-valuemin={0} aria-valuemax={100} aria-valuenow={tiLe(tong.duMuc, tong.coMuc)}>
                <i className="tt-thanh" style={{ width: `${tiLe(tong.duMuc, tong.coMuc)}%` }} />
              </span>
              <div className="gvhn-khoi-ds">
                {khoiCo.map((n) => {
                  const ti = tiLe(n.cs!.duMuc, n.cs!.coMuc)
                  return (
                    <button
                      key={n.cd.id}
                      type="button"
                      className="gvhn-khoi-dong tt-nhan"
                      onClick={() => moHanhTrinh({ the: 'nhip', chienDichId: n.cd.id })}
                      aria-label={`Khối ${n.khoi ?? '—'}: ${n.cs!.duMuc}/${n.cs!.coMuc} em đủ mức — mở Hành trình khối ${n.khoi ?? '—'}`}
                    >
                      <b>Khối {n.khoi ?? '—'}</b>
                      <span className="gvv2-thanh" data-du="true" aria-hidden="true">
                        <i className="tt-thanh" style={{ width: `${ti}%` }} />
                      </span>
                      <span className="gvv2-so gvhn-khoi-so">
                        {n.cs!.duMuc}/{n.cs!.coMuc}
                      </span>
                      <ChevronRight size={16} aria-hidden="true" />
                    </button>
                  )
                })}
              </div>
              <span className="gvhn-du-ghi">Bấm một khối để mở Hành trình của khối đó.</span>
            </aside>
          )}
        </div>
      )}
    </div>
  )
}
