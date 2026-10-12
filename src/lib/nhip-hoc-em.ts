// BẢNG "NHỊP HỌC CỦA EM" (app học sinh, đầu màn Hôm nay — thầy 12/10 duyệt bản vẽ HS-Cham / HS-Luoi). Lớp nối + PHÉP THUẦN (test gọi thẳng —
// tests/nhip-hoc-em-1210c.test.tsx). Lệnh CHỈ ĐỌC `POST /hs/nhip-hoc {token}` (hợp đồng `KetQuaNhipHocEm`, server/src/nhip-hoc-kieu.ts; máy chủ
// server/src/nhip-hoc-em.ts). Không ném lỗi: thiếu token / mất mạng / 404 / thân lạ ⇒ null ⇒ bảng ẩn gọn (không chặn màn).
// Luật nhóm + mọi số do máy chủ tính bằng CÙNG phép thuần với Hôm nay của thầy (server/src/nhip-hoc-luat.ts) ⇒ em và thầy thấy cùng một số.
// Chữ: bảng từ chuẩn (docs/CHUAN-TU-NGU-VA-GIAO-DIEN.md) — "đủ mức", "Chuỗi ngày", không mã nội bộ; lời thẳng, không khen sáo.
import { layDiaChiMayChu } from './dia-chi-may-chu'
import { LUAT_NHOM_NHIP, type KetQuaNhipHocEm, type NgayNhipEm, type NhomNhip, type TocDoNhipEm, type ViecTiepNhip } from '../../server/src/nhip-hoc-kieu'
import { NGUONG_THAI_DO } from '../../server/src/bai-hang-ngay-kieu'
import { TEN_NHOM_NHIP } from '../../server/src/nhip-hoc-luat'

export type { KetQuaNhipHocEm, NgayNhipEm, NhomNhip, TocDoNhipEm, ViecTiepNhip }
export { LUAT_NHOM_NHIP, TEN_NHOM_NHIP }

export const DUONG_NHIP_HOC_EM = '/hs/nhip-hoc'

// ------------------------------------------------------------------ ĐỌC TRẢ LỜI (thuần)
type O = Record<string, unknown>
const so = (x: unknown): number | null => (typeof x === 'number' && Number.isFinite(x) ? x : null)
const soKhongAm = (x: unknown): number => Math.max(0, Math.round(so(x) ?? 0))
const laNgay = (x: unknown): x is string => typeof x === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x)
const dt = (x: unknown): O | null => (x && typeof x === 'object' && !Array.isArray(x) ? (x as O) : null)
const NHOM: readonly NhomNhip[] = ['cham', 'chua-deu', 'luoi', 'chua-du']
const MUC_TOC_DO: readonly TocDoNhipEm['muc'][] = ['tot', 'chu-y', 'xau', 'chua-du']

function docViecTiep(x: unknown, nhom: NhomNhip): ViecTiepNhip | null {
  const o = dt(x)
  if (!o) return null
  const c = soKhongAm(o.cauConHomNay)
  const homNayDu = o.homNayDu === true
  // loại việc phải khớp nhóm — lệch ⇒ bỏ cả bảng (không hiện việc sai nhóm)
  if (o.loai === 'thoat-luoi' && nhom === 'luoi') return { loai: 'thoat-luoi', coNgay: soKhongAm(o.coNgay), canNgay: soKhongAm(o.canNgay) || LUAT_NHOM_NHIP.ngayLienThoatLuoi, cauConHomNay: c, homNayDu }
  if (o.loai === 'len-cham' && nhom === 'chua-deu') return { loai: 'len-cham', ngayCanThem: soKhongAm(o.ngayCanThem), cauConHomNay: c, homNayDu, nhoChuoi: o.nhoChuoi === true, chuoi: soKhongAm(o.chuoi) }
  if (o.loai === 'giu-chuoi' && nhom === 'cham') return { loai: 'giu-chuoi', cauConHomNay: c, homNayDu, chuoiNeuDu: soKhongAm(o.chuoiNeuDu) }
  if (o.loai === 'chua-du' && nhom === 'chua-du') return { loai: 'chua-du', conNgay: soKhongAm(o.conNgay), cauConHomNay: c, homNayDu }
  return null
}

/** Đọc CHẶT trả lời `/hs/nhip-hoc`; thiếu khung / sai kiểu ⇒ null (bảng ẩn, không bịa số). Thuần. */
export function docNhipHocEm(v: unknown): KetQuaNhipHocEm | null {
  const du = dt(v)
  if (!du || du.ok !== true || !laNgay(du.tu) || !laNgay(du.homNay) || !NHOM.includes(du.nhom as NhomNhip) || !Array.isArray(du.ngay)) return null
  const nhom = du.nhom as NhomNhip
  const ngay: NgayNhipEm[] = []
  for (const x of du.ngay) {
    const o = dt(x)
    if (!o || !laNgay(o.ngay) || so(o.muc) === null || so(o.lam) === null) return null
    ngay.push({ ngay: o.ngay, muc: soKhongAm(o.muc), lam: soKhongAm(o.lam) })
  }
  const viecTiep = docViecTiep(du.viecTiep, nhom)
  if (!viecTiep) return null
  const h = dt(du.homNayMuc)
  const b = dt(du.chuoiBo)
  const t = dt(du.tocDo)
  return {
    ok: true,
    tu: du.tu,
    homNay: du.homNay,
    nhom,
    soNgayQua: soKhongAm(du.soNgayQua),
    soNgayDu: soKhongAm(du.soNgayDu),
    phanTram: so(du.phanTram),
    ngay,
    chuoiDuGanNhat: soKhongAm(du.chuoiDuGanNhat),
    tongDaLam: soKhongAm(du.tongDaLam),
    tongCauThieu: soKhongAm(du.tongCauThieu),
    ngayDuGanNhat: laNgay(du.ngayDuGanNhat) ? du.ngayDuGanNhat : null,
    homNayMuc: h && so(h.muc) !== null && so(h.lam) !== null ? { muc: soKhongAm(h.muc), lam: soKhongAm(h.lam) } : null,
    chuoiBo: b && laNgay(b.tu) && laNgay(b.den) && so(b.dai) !== null ? { dai: soKhongAm(b.dai), tu: b.tu, den: b.den } : null,
    tocDo:
      t && so(t.soNhanh) !== null && so(t.soCoGiay) !== null && MUC_TOC_DO.includes(t.muc as TocDoNhipEm['muc'])
        ? { soNhanh: soKhongAm(t.soNhanh), soCoGiay: soKhongAm(t.soCoGiay), dungNhanh: so(t.dungNhanh), coTuTinh: t.coTuTinh === true, muc: t.muc as TocDoNhipEm['muc'] }
        : null,
    viecTiep,
  }
}

/** Nhịp học của em — MỘT lệnh. Lỗi gì cũng ⇒ null. */
export async function layNhipHocEm(token: string): Promise<KetQuaNhipHocEm | null> {
  if (!token) return null
  try {
    const url = await layDiaChiMayChu()
    if (!url) return null
    const bo = new AbortController()
    const hen = setTimeout(() => bo.abort(), 15_000)
    try {
      const r = await fetch(`${String(url).replace(/\/+$/, '')}${DUONG_NHIP_HOC_EM}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token }), signal: bo.signal })
      if (!r.ok) return null
      return docNhipHocEm(await r.json().catch(() => null))
    } finally {
      clearTimeout(hen)
    }
  } catch {
    return null
  }
}

// ------------------------------------------------------------------ CHỮ (thuần)

/** "01/10". */
export const ngayNgan = (ngay: string): string => `${ngay.slice(8, 10)}/${ngay.slice(5, 7)}`
/** "06–09/10" (cùng tháng) · "30/09–02/10". */
export const khoangNgan = (tu: string, den: string): string => (tu === den ? ngayNgan(tu) : tu.slice(0, 7) === den.slice(0, 7) ? `${tu.slice(8, 10)}–${ngayNgan(den)}` : `${ngayNgan(tu)}–${ngayNgan(den)}`)
/** 1234 ⇒ "1.234" (không phụ thuộc Intl). */
export const soChu = (n: number): string => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.')

const L = LUAT_NHOM_NHIP
const conHomNay = (k: KetQuaNhipHocEm): number => (k.homNayMuc ? Math.max(0, k.homNayMuc.muc - k.homNayMuc.lam) : 0)
const homNayDu = (k: KetQuaNhipHocEm): boolean => !!k.homNayMuc && k.homNayMuc.lam >= k.homNayMuc.muc

/** Dòng điều kiện dưới số lớn (bản vẽ: "91% số ngày đã qua · nhóm Chăm cần từ 80%" · "18% số ngày đã qua · bỏ 4 ngày liền (06–09/10)"). */
export function chuDieuKienEm(k: KetQuaNhipHocEm): string {
  if (k.nhom === 'chua-du') {
    const con = Math.max(0, L.soNgayToiThieu - k.soNgayQua)
    return `Cần ít nhất ${L.soNgayToiThieu} ngày đã qua để xếp nhóm — còn ${con} ngày nữa.`
  }
  const p = `${k.phanTram ?? 0}% số ngày đã qua`
  if (k.nhom === 'luoi') {
    const b = k.chuoiBo
    return b && b.dai >= L.ngayLienKhongLam ? `${p} · bỏ ${b.dai} ngày liền (${khoangNgan(b.tu, b.den)})` : `${p} · từ ${L.luoiDen}% trở xuống là nhóm Lười`
  }
  return `${p} · nhóm Chăm cần từ ${L.chamTu}%`
}

/** "Việc tiếp:" cho Chăm / Chưa đều / Chưa đủ dữ liệu (Lười dùng `chuThoatLuoi`). */
export function chuViecTiep(k: KetQuaNhipHocEm): string {
  const v = k.viecTiep
  const c = conHomNay(k)
  if (v.loai === 'giu-chuoi') {
    if (v.homNayDu) return `hôm nay em đã đủ mức — chuỗi đang là ${v.chuoiNeuDu} ngày liền đủ mức. Mai làm đủ mức để giữ chuỗi.`
    return v.chuoiNeuDu >= 2 ? `còn ${c} câu nữa là đủ mức hôm nay — em giữ được chuỗi ${v.chuoiNeuDu} ngày liền.` : `còn ${c} câu nữa là đủ mức hôm nay — bắt đầu lại chuỗi ngày đủ mức.`
  }
  if (v.loai === 'len-cham') {
    const giu = v.nhoChuoi ? ` Em đang ở ngoài nhóm Lười nhờ ${v.chuoi} ngày liền đủ mức — giữ chuỗi này để không quay lại.` : ''
    if (v.homNayDu) return (v.ngayCanThem === 0 ? 'hôm nay em đã đủ mức — hết hôm nay em lên nhóm Chăm.' : `hôm nay em đã đủ mức — cần thêm ${v.ngayCanThem} ngày đủ mức nữa để lên nhóm Chăm.`) + giu
    return `cần thêm ${v.ngayCanThem} ngày đủ mức (tính cả hôm nay) để lên nhóm Chăm — hôm nay còn ${c} câu.${giu}`
  }
  if (v.loai === 'chua-du') return v.homNayDu ? 'hôm nay em đã đủ mức. Mỗi ngày đủ mức là một ngày đủ trên dải ô.' : `làm đủ mức mỗi ngày — hôm nay còn ${c} câu.`
  return chuThoatLuoi(k)
}

/** Câu trong khối "Cách ra khỏi nhóm Lười" (bản vẽ: "Em đang có 0/6 ngày — bắt đầu từ hôm nay với 30 câu."). */
export function chuThoatLuoi(k: KetQuaNhipHocEm): string {
  const v = k.viecTiep
  const can = v.loai === 'thoat-luoi' ? v.canNgay : L.ngayLienThoatLuoi
  const co = Math.min(v.loai === 'thoat-luoi' ? v.coNgay : k.chuoiDuGanNhat, can)
  const c = conHomNay(k)
  if (homNayDu(k)) return `Em đang có ${co}/${can} ngày, đã tính hôm nay — mai làm đủ mức để lên ${Math.min(co + 1, can)}/${can}.`
  if (co === 0) return (k.homNayMuc?.lam ?? 0) > 0 ? `Em đang có 0/${can} ngày — hôm nay còn ${c} câu nữa là được ngày đầu tiên.` : `Em đang có 0/${can} ngày — bắt đầu từ hôm nay với ${c} câu.`
  return `Em đang có ${co}/${can} ngày — hôm nay làm đủ thêm ${c} câu để lên ${co + 1}/${can}.`
}

/** Nút trong khối Lười: chỉ khi hôm nay còn câu. */
export const chuNutHocNgay = (k: KetQuaNhipHocEm): string | null => (homNayDu(k) || conHomNay(k) <= 0 ? null : `Học ngay · ${conHomNay(k)} câu hôm nay`)

/** Dòng tốc độ làm bài (bản vẽ: "Tốc độ làm bài bình thường: 2/96 lượt dưới 8 giây." · "21/49 lượt em trả lời dưới 8 giây, nhóm này chỉ đúng 28%. Đọc hết đề rồi mới chọn."). */
export function chuTocDo(t: TocDoNhipEm): string {
  const NG = NGUONG_THAI_DO
  const nguong = t.coTuTinh ? `quá nhanh (dưới ${NG.giayNhanhTracNghiem} giây, câu tự tính dưới ${NG.giayNhanhTuTinh} giây)` : `dưới ${NG.giayNhanhTracNghiem} giây`
  if (t.muc === 'chua-du') return `Tốc độ làm bài: cần ít nhất ${NG.soLuotGiayToiThieu} lượt đo được số giây để xét, em đang có ${t.soCoGiay}.`
  if (t.muc === 'tot') return `Tốc độ làm bài bình thường: ${t.soNhanh}/${t.soCoGiay} lượt ${nguong}.`
  const p = Math.round((100 * t.soNhanh) / Math.max(1, t.soCoGiay))
  if (t.muc === 'xau') return `${t.soNhanh}/${t.soCoGiay} lượt em trả lời ${nguong}, nhóm này chỉ đúng ${t.dungNhanh ?? 0}%. Đọc hết đề rồi mới chọn.`
  return `${t.soNhanh}/${t.soCoGiay} lượt em trả lời ${nguong} (${p}%)${t.dungNhanh !== null ? `, nhóm này đúng ${t.dungNhanh}%` : ''}. Đọc hết đề rồi mới chọn.`
}

/** Ba ô số (bản vẽ). Chăm / Chưa đều / Chưa đủ dữ liệu: ngày liền đủ mức · câu đã làm · câu hôm nay. Lười: câu còn thiếu · ngày đủ mức gần nhất · câu hôm nay. */
export interface OSoEm {
  so: string
  nhan: string
  /** 'nhom' = màu của nhóm · 'chinh' = màu nhấn chàm (câu hôm nay) · '' = màu chữ thường. */
  sac: 'nhom' | 'chinh' | ''
}
export function oSoEm(k: KetQuaNhipHocEm): OSoEm[] {
  const hom: OSoEm = { so: k.homNayMuc ? `${k.homNayMuc.lam}/${k.homNayMuc.muc}` : '—', nhan: 'câu hôm nay', sac: 'chinh' }
  if (k.nhom === 'luoi') {
    return [
      { so: soChu(k.tongCauThieu), nhan: `câu còn thiếu từ ${ngayNgan(k.tu)}`, sac: 'nhom' },
      { so: k.ngayDuGanNhat ? ngayNgan(k.ngayDuGanNhat) : 'Chưa có', nhan: 'ngày đủ mức gần nhất', sac: '' },
      hom,
    ]
  }
  return [
    { so: String(k.chuoiDuGanNhat), nhan: 'ngày liền đủ mức', sac: 'nhom' },
    { so: soChu(k.tongDaLam), nhan: `câu đã làm từ ${ngayNgan(k.tu)}`, sac: '' },
    hom,
  ]
}

/** Loại một ô ngày trên dải (đúng bốn mức của bảng Bài hằng ngày; hôm nay chưa làm ⇒ 'cho'). */
export type LoaiONgayEm = 'du' | 'thieu-it' | 'thieu-nhieu' | 'khong-lam' | 'cho'
export function loaiONgay(x: NgayNhipEm, homNay: string): LoaiONgayEm {
  if (x.lam >= x.muc) return 'du'
  if (x.ngay === homNay) return x.lam > 0 ? 'thieu-it' : 'cho'
  return x.lam <= 0 ? 'khong-lam' : 2 * x.lam >= x.muc ? 'thieu-it' : 'thieu-nhieu'
}
export const TEN_LOAI_O_EM: Record<Exclude<LoaiONgayEm, 'cho'>, string> = { du: 'Đủ mức', 'thieu-it': 'Thiếu ít', 'thieu-nhieu': 'Thiếu nhiều', 'khong-lam': 'Không làm' }

/** Câu một ô (chú thích khi trỏ / chạm). */
export function chuMotOEm(x: NgayNhipEm, homNay: string): string {
  const ngay = `${ngayNgan(x.ngay)}${x.ngay === homNay ? ' (hôm nay)' : ''}`
  return `${ngay}: đã làm ${x.lam}/${x.muc} câu — ${x.lam >= x.muc ? 'đủ mức' : x.ngay === homNay ? 'đang làm' : `thiếu ${x.muc - x.lam} câu`}`
}

/** Câu đầy đủ cho trình đọc màn hình của dải ô. */
export function chuDaiOEm(k: KetQuaNhipHocEm): string {
  const h = k.homNayMuc ? `; hôm nay ${k.homNayMuc.lam}/${k.homNayMuc.muc} câu` : ''
  return `Từ ${ngayNgan(k.tu)} tới hôm nay: đủ mức ${k.soNgayDu}/${k.soNgayQua} ngày đã qua${h}`
}
