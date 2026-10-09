// HÀNH TRÌNH › THẺ "CẦN THẦY CHỮA" — TRUNG TU 09/10 tối (thầy: "phần câu cần chữa trùng tu lại bỏ hết những thứ không cần thiết, thiết kế trực
// quan khoa học phù hợp với các chức năng hiện tại"). Trước đây thẻ là ba thẻ con (Buổi chữa · Bước cuối trên lớp · Gỡ nút thắt) + ô chọn chiến dịch
// + bảng từng em kiểu "Nhịp" (Đang học, Đã làm hôm nay, Chặng…) — thầy phải đoán chỗ nào cần chữa nằm ở thẻ nào.
// NAY MỘT LUỒNG:
//   1. ĐẦU THẺ: MỘT danh sách "câu / dạng cần chữa", nhiều em sai đứng trước. Mỗi dòng: tên câu/dạng ngắn · số em · khối/lớp · lý do gấp (chữ thật)
//      · MỘT nút viền đúng việc (Chiếu lên bảng / Xếp buổi chữa / Chữa trên lớp / Gỡ nút thắt) · nút chữ phụ "Gỡ nút thắt · N em" khi chính câu ấy có
//      thẻ nút thắt. Thanh phân đoạn Khối (Tất cả · Khối 10 · 11 · 12, mỗi ô ghi số CHỖ cần chữa — cùng đơn vị với "Tất cả") lọc danh sách — chỉ hiện ở thẻ này.
//   2. BẤM NÚT ⇒ mở đúng chỗ làm việc SẴN CÓ cho dòng ấy (nút "Danh sách cần chữa" quay lại):
//      · câu sai từ 4 lần / vi kỹ năng / em sơ ý (chiến dịch) — `LenBangChienDich` ghim chiến dịch (không ô chọn) + `chiChua` (chỉ khối Cần thầy
//        chữa của Bảng chiến dịch: danh sách, Chiếu cả N câu, Chữa xong; hết hạn nộp ⇒ điểm danh bằng mã → Buổi chữa như cũ);
//      · bước cuối trên lớp — `CauCanChuaTrenLop` gọn (điểm danh + chiếu bước cuối, "Thầy chữa" trên tờ);
//      · nút thắt / kèm riêng — `BanGoNutThatScreen` nhúng, chọn sẵn đúng thẻ (Gỡ ngắn · Dạy trên lớp · Sửa lời giải/đề).
// CHỈ ĐỔI GIAO DIỆN VÀ CÁCH XẾP: đọc bằng đúng các lệnh sẵn có (giống màn Hôm nay đếm "Cần thầy chữa": `danh-sach` → `bang` từng chiến dịch đang chạy,
// Bảng bài OMNI khi cờ bật; + `/gv/chua-cau-sai/hang-chieu`, `/gv/nut-that/ds`), mọi lệnh chữa/chấm vẫn do thành phần sẵn có gửi — không đổi máy chủ.
// Năm trạng thái: chờ tải = khung xương `.tt-xuong` · trống = "Chưa có câu nào cần thầy chữa." · lỗi = câu dễ hiểu + Thử lại (phần nào lỗi thì một
// dòng nói phần ấy, phần khác vẫn hiện) · có dữ liệu · lỗi mạng (cùng đường lỗi).
// Mỗi phần chỗ làm việc nạp LƯỜI (mảnh riêng, ngoài precache — vite.config.ts). Màn `goilenbang` / `bangonutthat` giữ nguyên cho mọi lối cũ.
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AlertCircle, ArrowLeft, Check, ListChecks, Presentation, Puzzle, RefreshCw, Unlink, Users, type LucideIcon } from 'lucide-react'
import type { CanThayChua } from '../../../server/src/omni-kieu'
import type { NhomChuaTrenLop } from '../../../server/src/chua-cau-sai-chieu-kieu'
import { ChemText } from '../../lib/chem-format'
import { khoiCuaLop, khoiCuaMaDe, type Khoi } from '../../lib/khoi-cau'
import { lyDoDeHieu } from '../../lib/loi-de-hieu'
import { taiGioiHan } from '../../lib/tai-gioi-han'
import type { EmKemRieng, KetQuaDsNut, NhomNut } from '../../lib/nut-that-api'
import { danhSach, docBang, type BangChienDich, type ChienDichTom } from './api'
import { docBangOmniCua, docCoOmni } from './api-omni'
import { khoiCuaHanhTrinh } from './nhip-hanh-trinh'
import { nhomCanThayChua } from './omni-bang'

const LenBangChienDich = lazy(() => import('./LenBangChienDich'))
const CauCanChuaTrenLop = lazy(() => import('../chua-cau-sai/CauCanChuaTrenLop'))
const BanGoNutThatScreen = lazy(() => import('../../screens/BanGoNutThatScreen'))

// ------------------------------------------------------------------ DỮ LIỆU (thuần — kiểm ở tests/gv-hom-nay-0910.test.tsx)

/** Chỗ làm việc của một dòng. */
export type MoViec =
  | { loai: 'chien-dich'; id: string; ten: string; hetHan: boolean }
  | { loai: 'buoc-cuoi'; id: string }
  | { loai: 'nut-that'; khoa: string | null }

export type NguonChua = 'cau-sai' | 'vi-ky-nang' | 'so-y' | 'buoc-cuoi' | 'nut-that' | 'kem-rieng'

export interface DongCanChua {
  khoa: string
  nguon: NguonChua
  /** Tên câu / dạng ngắn: "Câu 9 · Ester", "Câu 6 · bước 3". */
  ten: string
  /** Dòng phụ ngắn (mức độ, kiến thức nền, chỗ vướng) — rỗng thì bỏ. */
  phu: string
  /** Số em (sai / vướng / chờ thầy) của dòng. */
  soEm: number
  /** Khối hoặc lớp: "Khối 12", "12A1"; rỗng = chưa rõ. */
  noi: string
  khoi: Khoi | null
  /** Gấp = em đã rời kế hoạch / hết hạn nộp / nhiều em cùng vướng / sai lại sau lời gỡ. */
  gap: boolean
  /** Lý do bằng chữ thật (luật A1.7): "Sai từ 4 lần", "Nhiều em vướng"… */
  lyDo: string
  /** Nút chính của dòng — vắng ⇒ dòng chỉ để biết (em sơ ý cao: thẻ chiến dịch cũng không có nút). */
  nut?: { chu: string; mo: MoViec }
  /** Nút phụ "Gỡ nút thắt · N em" khi chính câu ấy có thẻ nút thắt. */
  nutPhu?: { chu: string; mo: MoViec }
  /** Mã câu để ghép thẻ nút thắt cùng câu (không hiện). */
  qids: readonly string[]
}

export interface NguonCanChua {
  chienDich: readonly { c: ChienDichTom; b: BangChienDich; omni: readonly CanThayChua[] }[]
  buocCuoi: readonly NhomChuaTrenLop[]
  nutThat: readonly NhomNut[]
  kemRieng: readonly EmKemRieng[]
}

const laKhoi = (k: unknown): k is Khoi => k === 10 || k === 11 || k === 12

function khoiChienDich(c: ChienDichTom): Khoi | null {
  if (c.hanhTrinh) {
    const k = Number(khoiCuaHanhTrinh(c))
    return laKhoi(k) ? k : null
  }
  return khoiCuaLop(c.lop)
}

/** Gom mọi chỗ cần thầy chữa thành MỘT danh sách, nhiều em đứng trước (cùng số em ⇒ dòng gấp trước, rồi theo tên). */
export function gomCanChua(n: NguonCanChua): DongCanChua[] {
  const ra: DongCanChua[] = []
  for (const { c, b, omni } of n.chienDich) {
    const khoi = khoiChienDich(c)
    const noi = (c.lop ?? '').trim() || (khoi ? `Khối ${khoi}` : '')
    const mo: MoViec = { loai: 'chien-dich', id: c.id, ten: c.ten, hetHan: !!b.hetHan }
    for (const g of nhomCanThayChua(omni, b.canDayLai ?? [])) {
      g.dong.forEach((d, i) => {
        const chung = { khoa: `cd:${c.id}:${g.loai}:${d.qids?.join(',') ?? d.vkn ?? d.sbd?.join(',') ?? i}:${i}`, ten: d.tieuDe || '—', phu: d.phu, soEm: d.soEm, noi, khoi, qids: d.qids ?? [] }
        if (g.loai === 'cat_tia')
          ra.push({ ...chung, nguon: 'cau-sai', gap: true, lyDo: b.hetHan ? 'Sai từ 4 lần · hết hạn nộp' : 'Sai từ 4 lần', nut: { chu: b.hetHan ? 'Xếp buổi chữa' : 'Chiếu lên bảng', mo } })
        else if (g.loai === 'nut_that') ra.push({ ...chung, nguon: 'vi-ky-nang', gap: false, lyDo: 'Có thẻ nút thắt', nut: { chu: 'Chữa trên lớp', mo } })
        else ra.push({ ...chung, nguon: 'so-y', gap: false, lyDo: 'Sơ ý cao', nut: { chu: 'Xem các em', mo } })
      })
    }
  }
  for (const g of n.buocCuoi) {
    const khoi = khoiCuaLop(g.lop) ?? khoiCuaMaDe(g.qid)
    ra.push({
      khoa: `bc:${g.id}`,
      nguon: 'buoc-cuoi',
      ten: g.tieuDe || 'Câu cần chữa',
      phu: g.diemVuong,
      soEm: g.em.length,
      noi: (g.lop ?? '').trim() || (khoi ? `Khối ${khoi}` : ''),
      khoi,
      gap: false,
      lyDo: 'Tự gỡ vẫn vướng',
      nut: { chu: 'Chữa trên lớp', mo: { loai: 'buoc-cuoi', id: g.id } },
      qids: g.qid ? [g.qid] : [],
    })
  }
  // Thẻ nút thắt CÙNG câu với một dòng ở trên ⇒ thành nút phụ của dòng ấy (không lặp một dòng nữa).
  const daGhep = new Set<string>()
  for (const d of ra) {
    if (!d.qids.length) continue
    const khop = n.nutThat.filter((x) => !daGhep.has(x.khoa) && d.qids.includes(x.qidMau)).sort((a, b) => b.soEm - a.soEm)[0]
    if (!khop) continue
    daGhep.add(khop.khoa)
    d.nutPhu = { chu: `Gỡ nút thắt · ${khop.soEm} em`, mo: { loai: 'nut-that', khoa: khop.khoa } }
  }
  for (const x of n.nutThat) {
    if (daGhep.has(x.khoa)) continue
    const khoi = khoiCuaMaDe(x.qidMau)
    ra.push({
      khoa: `nt:${x.khoa}`,
      nguon: 'nut-that',
      ten: `${x.so || 'Câu trong kho'} · bước ${x.buoc + 1}`,
      phu: x.nhanNen ? `Kiến thức nền: ${x.nhanNen}` : '',
      soEm: x.soEm,
      noi: khoi ? `Khối ${khoi}` : '',
      khoi,
      gap: x.nhieuEmVuong,
      lyDo: x.nhieuEmVuong ? 'Nhiều em vướng' : 'Em gửi thẻ nút thắt',
      nut: { chu: 'Gỡ nút thắt', mo: { loai: 'nut-that', khoa: x.khoa } },
      qids: [x.qidMau],
    })
  }
  if (n.kemRieng.length) {
    const ten = [...new Map(n.kemRieng.map((e) => [e.sbd, e.hoTen || e.sbd])).values()]
    ra.push({
      khoa: 'kem-rieng',
      nguon: 'kem-rieng',
      ten: 'Kèm riêng trên lớp',
      phu: ten.length > 3 ? `${ten.slice(0, 3).join(', ')} và ${ten.length - 3} em khác` : ten.join(', '),
      soEm: ten.length,
      noi: '',
      khoi: null,
      gap: true,
      lyDo: 'Sai lại sau lời gỡ',
      nut: { chu: 'Xem các em', mo: { loai: 'nut-that', khoa: null } },
      qids: [],
    })
  }
  return ra.sort((a, b) => b.soEm - a.soEm || Number(b.gap) - Number(a.gap) || a.ten.localeCompare(b.ten, 'vi'))
}

/** Khối lọc: các Hành trình khối đang chạy (kèm số em); không có Hành trình ⇒ khối đọc được từ chính danh sách. */
export function khoiLoc(cd: readonly ChienDichTom[], dong: readonly DongCanChua[]): { khoi: Khoi; soEm: number | null }[] {
  const ht = new Map<Khoi, number>()
  for (const c of cd) {
    if (!c.hanhTrinh || c.trangThai !== 'dang_chay') continue
    const k = khoiChienDich(c)
    if (k) ht.set(k, (ht.get(k) ?? 0) + (c.soEm ?? 0))
  }
  if (ht.size) return [...ht.entries()].sort((a, b) => a[0] - b[0]).map(([khoi, soEm]) => ({ khoi, soEm }))
  return [...new Set(dong.map((d) => d.khoi).filter(laKhoi))].sort((a, b) => a - b).map((khoi) => ({ khoi, soEm: null }))
}

interface DuCanChua {
  dong: DongCanChua[]
  khoi: { khoi: Khoi; soEm: number | null }[]
  /** Phần chưa đọc được: tên phần + lý do dễ hiểu. */
  loi: { phan: string; chu: string }[]
  /** Không đọc được phần nào ⇒ cả thẻ là một khung lỗi. */
  hongHet: boolean
}

/** Hai nguồn NGOÀI chiến dịch: bước cuối trên lớp + thẻ nút thắt (kèm riêng). Màn Hôm nay nạp chung để số "Cần thầy chữa: N chỗ"
 *  khớp đúng số dòng của danh sách này (một nhãn — một con số). Phần lỗi ghi vào `loi`; null = không đọc được. */
export async function taiNguonPhu(loi: { phan: string; chu: string }[] = []): Promise<{ buocCuoi: NhomChuaTrenLop[] | null; nut: KetQuaDsNut | null }> {
  const taiBuocCuoi = async () => {
    try {
      const { goiChuaThay } = await import('../../lib/chua-cau-sai-thay-api')
      const r = await goiChuaThay('hang-chieu', { lop: '' })
      // Vòng tự chữa chưa bật ⇒ không có bước cuối nào, không phải lỗi.
      return r.bat && Array.isArray(r.ds) ? (r.ds as NhomChuaTrenLop[]) : []
    } catch (e) {
      loi.push({ phan: 'bước cuối trên lớp', chu: lyDoDeHieu(e) })
      return null
    }
  }
  const taiNutThat = async () => {
    try {
      const { gvDsNutThat } = await import('../../lib/nut-that-api')
      const r: KetQuaDsNut = await gvDsNutThat()
      if (!r.ok) {
        loi.push({ phan: 'thẻ nút thắt', chu: lyDoDeHieu(r.error ?? '') })
        return null
      }
      return r
    } catch (e) {
      loi.push({ phan: 'thẻ nút thắt', chu: lyDoDeHieu(e) })
      return null
    }
  }
  const [buocCuoi, nut] = await Promise.all([taiBuocCuoi(), taiNutThat()])
  return { buocCuoi, nut }
}

async function taiCanChua(): Promise<DuCanChua> {
  const loi: { phan: string; chu: string }[] = []
  const taiCd = async () => {
    try {
      const r = await danhSach()
      if (!r.ok) {
        loi.push({ phan: 'câu sai của chiến dịch', chu: lyDoDeHieu(r.chu) })
        return null
      }
      const cd = r.du.chienDich ?? []
      const chay = cd.filter((c) => c.trangThai === 'dang_chay')
      const [bang, co] = await Promise.all([
        taiGioiHan(chay, async (c) => {
          try {
            const b = await docBang(c.id)
            return b.ok ? b.du : null
          } catch {
            return null
          }
        }),
        docCoOmni().catch(() => null),
      ])
      const daDoc = chay.map((c, i) => ({ c, b: bang[i] })).filter((x): x is { c: ChienDichTom; b: BangChienDich } => !!x.b)
      if (chay.length > 0 && daDoc.length === 0) loi.push({ phan: 'câu sai của chiến dịch', chu: 'Mạng có thể đang chập chờn.' })
      // Bảng bài OMNI (ba nhóm Cần thầy chữa) — đúng như màn Hôm nay đếm: chỉ chiến dịch còn chạy, không phải Hành trình; OMNI tắt ⇒ không hỏi.
      const bat = !!co && co.ok && co.du.bat
      const omni = await taiGioiHan(daDoc, async ({ c, b }) => {
        if (!bat || b.hanhTrinhNgay || b.hetHan) return [] as CanThayChua[]
        try {
          const r = await docBangOmniCua(c.id)
          return r.ok && (!r.du.chienDich.id || r.du.chienDich.id === c.id) ? r.du.canThayChua : []
        } catch {
          return [] as CanThayChua[]
        }
      })
      return { cd, chienDich: daDoc.map((x, i) => ({ ...x, omni: omni[i] ?? [] })) }
    } catch (e) {
      loi.push({ phan: 'câu sai của chiến dịch', chu: lyDoDeHieu(e) })
      return null
    }
  }
  const [cd, { buocCuoi, nut }] = await Promise.all([taiCd(), taiNguonPhu(loi)])
  const dong = gomCanChua({ chienDich: cd?.chienDich ?? [], buocCuoi: buocCuoi ?? [], nutThat: nut?.nhom ?? [], kemRieng: nut?.kemRieng ?? [] })
  return { dong, khoi: khoiLoc(cd?.cd ?? [], dong), loi, hongHet: cd === null && buocCuoi === null && nut === null }
}

// ------------------------------------------------------------------ GIAO DIỆN

const BIEU: Record<NguonChua, { icon: LucideIcon; mau: 'hp' | 'xd' | 'tim' | 'ho' | 'xam' }> = {
  'cau-sai': { icon: Presentation, mau: 'hp' },
  'vi-ky-nang': { icon: Puzzle, mau: 'tim' },
  'so-y': { icon: AlertCircle, mau: 'xam' },
  'buoc-cuoi': { icon: ListChecks, mau: 'xd' },
  'nut-that': { icon: Unlink, mau: 'tim' },
  'kem-rieng': { icon: Users, mau: 'ho' },
}

function XuongDanhSach() {
  return (
    <div className="gvv2-cc-xuong" role="status" aria-label="Đang tải danh sách cần chữa">
      {[0, 1, 2].map((i) => (
        <span key={i} className="gvv2-cc-xuong-dong">
          <span className="gvv2-cc-xuong-khoi tt-xuong" style={{ width: 44, height: 44, borderRadius: 14 }} />
          <span className="gvv2-cc-xuong-chu">
            <span className="gvv2-cc-xuong-khoi tt-xuong" style={{ width: '46%', height: 14 }} />
            <span className="gvv2-cc-xuong-khoi tt-xuong" style={{ width: '30%', height: 12 }} />
          </span>
          <span className="gvv2-cc-xuong-khoi tt-xuong" style={{ width: 132, height: 44, borderRadius: 12 }} />
        </span>
      ))}
    </div>
  )
}

function DongChua({ d, onMo }: { d: DongCanChua; onMo: (mo: MoViec, d: DongCanChua) => void }) {
  const { icon: Icon, mau } = BIEU[d.nguon]
  return (
    <li className="gvv2-cc-dong" data-khoa={d.khoa} data-nguon={d.nguon}>
      <span className="gvv2-cc-bieu" data-mau={mau} aria-hidden="true">
        <Icon size={20} />
      </span>
      <div className="gvv2-cc-chu">
        <b>{d.ten}</b>
        {d.phu && (
          <span className="gvv2-cc-phu">
            <ChemText text={d.phu} />
          </span>
        )}
        <span className="gvv2-cc-meta">
          {d.noi && <span>{d.noi}</span>}
          <span className="gvv2-cc-ly-do" data-gap={d.gap ? 'true' : 'false'}>
            {d.lyDo}
          </span>
        </span>
      </div>
      <span className="gvv2-cc-so">
        <b className="gvv2-so">{d.soEm}</b>
        <small>em</small>
      </span>
      <div className="gvv2-cc-nut">
        {d.nutPhu && (
          <button type="button" className="gvv2-nut-chu tt-nhan" onClick={() => onMo(d.nutPhu!.mo, d)}>
            {d.nutPhu.chu}
          </button>
        )}
        {d.nut && (
          <button type="button" className="gvv2-nut-vien tt-nhan" onClick={() => onMo(d.nut!.mo, d)} aria-label={`${d.nut.chu}: ${d.ten}`}>
            {d.nut.chu}
          </button>
        )}
      </div>
    </li>
  )
}

function tieuDeViec(mo: MoViec): string {
  if (mo.loai === 'chien-dich') return `${mo.hetHan ? 'Buổi chữa' : 'Chiếu lên bảng'} · ${mo.ten}`
  return mo.loai === 'buoc-cuoi' ? 'Chữa bước cuối trên lớp' : 'Gỡ nút thắt'
}

function ChoViec() {
  return (
    <div className="gvv2-cc-xuong" role="status" aria-label="Đang mở chỗ chữa">
      <span className="gvv2-cc-xuong-khoi tt-xuong" style={{ width: '40%', height: 16 }} />
      <span className="gvv2-cc-xuong-khoi tt-xuong" style={{ width: '100%', height: 120, borderRadius: 16 }} />
    </div>
  )
}

/** Chỗ làm việc của một dòng: thành phần SẴN CÓ, gọn (không tiêu đề lặp, không ô chọn chiến dịch). */
function ChoLamViec({ mo, onVe }: { mo: MoViec; onVe: () => void }) {
  const ve = useRef<HTMLButtonElement>(null)
  useEffect(() => ve.current?.focus(), [])
  return (
    <section className="gvv2-viec" aria-labelledby="gvv2-viec-tieu">
      <div className="gvv2-viec-dau">
        <button ref={ve} type="button" className="gvv2-nut-chu tt-nhan" onClick={onVe}>
          <ArrowLeft size={18} aria-hidden="true" />
          Danh sách cần chữa
        </button>
        <h2 id="gvv2-viec-tieu" className="gvv2-h2">
          {tieuDeViec(mo)}
        </h2>
      </div>
      <div className="gvv2-nhung gvv2-nhung--chua">
        <Suspense fallback={<ChoViec />}>
          {mo.loai === 'chien-dich' ? (
            <LenBangChienDich chienDichId={mo.id} chiChua />
          ) : mo.loai === 'buoc-cuoi' ? (
            <CauCanChuaTrenLop gon chonDau={mo.id} />
          ) : (
            <BanGoNutThatScreen nhung chonDau={mo.khoa} />
          )}
        </Suspense>
      </div>
    </section>
  )
}

/** `onDem` = số chỗ của danh sách (khi đọc xong) — màn Hành trình ghi cạnh tên thẻ cho khớp với số trong thẻ. */
export default function TheCanThayChua({ onDem }: { onDem?: (n: number) => void } = {}) {
  const [du, setDu] = useState<DuCanChua | null>(null)
  const [dangTai, setDangTai] = useState(true)
  const [khoi, setKhoi] = useState<Khoi | null>(null)
  const [mo, setMo] = useState<{ viec: MoViec; khoa: string } | null>(null)
  const traFocus = useRef<string | null>(null)
  const goc = useRef<HTMLElement>(null)

  const lan = useRef(0)
  const tai = useCallback(async () => {
    const l = ++lan.current
    setDangTai(true)
    const kq = await taiCanChua()
    if (l !== lan.current) return
    setDu(kq)
    setDangTai(false)
    if (!kq.hongHet) onDem?.(kq.dong.length)
  }, [onDem])
  useEffect(() => {
    void tai()
    return () => {
      lan.current++
    }
  }, [tai])

  // Quay lại từ chỗ làm việc ⇒ nạp lại (việc vừa chữa có thể đã xong) và trả focus về đúng nút của dòng.
  useEffect(() => {
    if (mo || !traFocus.current || !goc.current) return
    const dong = [...goc.current.querySelectorAll<HTMLElement>('li[data-khoa]')].find((li) => li.dataset.khoa === traFocus.current)
    const nut = dong?.querySelector<HTMLButtonElement>('.gvv2-nut-vien')
    if (nut) {
      nut.focus()
      traFocus.current = null
    }
  }, [mo, du])

  const dsKhoi = du?.khoi ?? []
  const khoiChon = khoi !== null && dsKhoi.some((k) => k.khoi === khoi) ? khoi : null
  const hien = useMemo(() => (du ? (khoiChon === null ? du.dong : du.dong.filter((d) => d.khoi === khoiChon)) : []), [du, khoiChon])
  const chuaRoKhoi = du && khoiChon !== null ? du.dong.filter((d) => d.khoi === null).length : 0

  if (mo)
    return (
      <ChoLamViec
        mo={mo.viec}
        onVe={() => {
          traFocus.current = mo.khoa
          setMo(null)
          void tai()
        }}
      />
    )

  const tongEm = hien.reduce((s, d) => s + d.soEm, 0)
  return (
    <section ref={goc} className="gvv2-the gvv2-cc" aria-label="Cần thầy chữa · nhiều em sai trước">
      <div className="gvv2-cc-dau">
        <p className="gvv2-cc-tom" aria-live="polite">
          {du && !du.hongHet ? (
            <>
              <b className="gvv2-so">{hien.length}</b> chỗ cần chữa · <b className="gvv2-so">{tongEm}</b> lượt em · nhiều em sai đứng trước
            </>
          ) : (
            'Câu và dạng các em còn vướng, nhiều em sai đứng trước'
          )}
        </p>
        <button type="button" className="gvv2-nut-chu tt-nhan" onClick={() => void tai()} disabled={dangTai} aria-busy={dangTai}>
          <RefreshCw size={18} aria-hidden="true" className={dangTai && du ? 'gvv2-quay' : undefined} />
          {dangTai && du ? 'Đang làm mới…' : 'Làm mới'}
        </button>
      </div>

      {dsKhoi.length > 0 && du && du.dong.length > 0 && (
        <div className="gvv2-phan-doan" role="radiogroup" aria-label="Lọc theo khối">
          <button type="button" role="radio" aria-checked={khoiChon === null} className="gvv2-phan-doan-nut tt-nhan" onClick={() => setKhoi(null)}>
            <b>Tất cả</b>
            <small className="gvv2-so">{du.dong.length} chỗ</small>
          </button>
          {dsKhoi.map((k) => (
            <button key={k.khoi} type="button" role="radio" aria-checked={khoiChon === k.khoi} className="gvv2-phan-doan-nut tt-nhan" onClick={() => setKhoi(k.khoi)}>
              <b>Khối {k.khoi}</b>
              <small className="gvv2-so">{du.dong.filter((d) => d.khoi === k.khoi).length} chỗ</small>
            </button>
          ))}
        </div>
      )}

      {du === null ? (
        <XuongDanhSach />
      ) : du.hongHet ? (
        <div className="gvv2-loi gvv2-cc-loi" role="alert">
          <p>Chưa tải được danh sách cần chữa. {du.loi[0]?.chu ?? 'Mạng có thể đang chập chờn.'}</p>
          <button type="button" className="gvv2-nut-vien tt-nhan" onClick={() => void tai()} disabled={dangTai}>
            Thử lại
          </button>
        </div>
      ) : (
        <ul className="gvv2-cc-ds">
          {hien.map((d) => (
            <DongChua
              key={d.khoa}
              d={d}
              onMo={(viec, dong) => {
                traFocus.current = null
                setMo({ viec, khoa: dong.khoa })
              }}
            />
          ))}
          {hien.length === 0 && (
            <li className="gvv2-cc-dong" data-nguon="trong">
              <span className="gvv2-cc-bieu" data-mau="xl" aria-hidden="true">
                <Check size={20} />
              </span>
              <span className="gvv2-cc-trong">{khoiChon === null ? 'Chưa có câu nào cần thầy chữa.' : `Chưa có câu nào cần thầy chữa ở Khối ${khoiChon}.`}</span>
            </li>
          )}
          {chuaRoKhoi > 0 && (
            <li className="gvv2-cc-ghi">
              {chuaRoKhoi} chỗ chưa rõ khối — xem ở <button type="button" className="gvv2-nut-chu gvv2-nut-chu--trong-dong" onClick={() => setKhoi(null)}>Tất cả</button>
            </li>
          )}
          {du.loi.map((l) => (
            <li key={l.phan} className="gvv2-cc-dong" data-nguon="loi" role="alert">
              <span className="gvv2-cc-bieu" data-mau="xam" aria-hidden="true">
                <RefreshCw size={20} />
              </span>
              <div className="gvv2-cc-chu">
                <b>Chưa tải được {l.phan}</b>
                <span className="gvv2-cc-phu">{l.chu} Phần khác trong danh sách vẫn đúng.</span>
              </div>
              <div className="gvv2-cc-nut">
                <button type="button" className="gvv2-nut-vien tt-nhan" onClick={() => void tai()} disabled={dangTai}>
                  Thử lại
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
