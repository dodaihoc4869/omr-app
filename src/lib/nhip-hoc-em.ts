// NHỊP HỌC CỦA EM (app học sinh, phần dưới của thẻ "Hôm nay của em" ở đầu màn Hôm nay — thầy 12/10 duyệt bản vẽ HS-Cham / HS-Luoi, rồi 12/10:
// "gộp 2 phần làm bài này vào làm một"). Lớp nối + PHÉP THUẦN (test gọi thẳng — tests/nhip-hoc-em-1210c.test.tsx, tests/the-hom-nay-em-1210e.test.tsx).
// Lệnh CHỈ ĐỌC `POST /hs/nhip-hoc {token}` (hợp đồng `KetQuaNhipHocEm`, server/src/nhip-hoc-kieu.ts; máy chủ server/src/nhip-hoc-em.ts). Không ném lỗi:
// thiếu token / mất mạng / 404 / thân lạ ⇒ null ⇒ phần Nhịp học ẩn gọn (phần chính của thẻ vẫn đủ).
// Luật nhóm + mọi số do máy chủ tính bằng CÙNG phép thuần với Hôm nay của thầy (server/src/nhip-hoc-luat.ts) ⇒ em và thầy thấy cùng một số. Riêng HÔM NAY:
// `nhipTheoSanh` thay số hôm nay bằng số của Sảnh (cập nhật sau mỗi câu) rồi tính lại bằng đúng phép thuần ấy ⇒ thẻ chỉ có MỘT con số câu hôm nay.
// Chữ: bảng từ chuẩn (docs/CHUAN-TU-NGU-VA-GIAO-DIEN.md) — "đủ mức", "Chuỗi ngày", không mã nội bộ; lời thẳng, không khen sáo.
import { layDiaChiMayChu } from './dia-chi-may-chu'
import { LUAT_NHOM_NHIP, type KetQuaNhipHocEm, type NgayNhipEm, type NhomNhip, type TocDoNhipEm, type ViecTiepNhip } from '../../server/src/nhip-hoc-kieu'
import { NGUONG_THAI_DO } from '../../server/src/bai-hang-ngay-kieu'
import { TEN_NHOM_NHIP, tomTatNhip, viecTiepNhip } from '../../server/src/nhip-hoc-luat'

export type { KetQuaNhipHocEm, NgayNhipEm, NhomNhip, TocDoNhipEm, ViecTiepNhip }
/** ĐỢT 16 — làn máy chủ D CHỈ THÊM hai trường TUỲ CHỌN (khai phía app): độ tin cậy của nhóm (0–100, máy chủ kẹp ≤ 99) + câu "cần thêm" khi chưa chắc.
 *  Máy chủ cũ không gửi ⇒ trường vắng, bảng y như trước. */
export type KetQuaNhipHocApp = KetQuaNhipHocEm & { doTinCay?: number; canThem?: string }
/** Độ tin cậy dưới mức này ⇒ kết luận ghi "tạm — đang theo dõi" (thầy 12/10: "chính xác hơn 90%"). Dùng chung bảng Nhịp học + tấm Hồ sơ làm bài. */
export const NGUONG_TIN_CAY = 90
/** "Độ tin cậy 86%" — kẹp 0–99 (chuẩn từ ngữ: độ tin không bao giờ ghi 100%). */
export const chuDoTinCay = (n: number): string => `Độ tin cậy ${Math.max(0, Math.min(99, Math.round(n)))}%`
/** Câu "cần thêm" của máy chủ thành một câu đọc được: đã mở đầu bằng "Cần …" ⇒ giữ (viết hoa chữ đầu); không thì "Cần thêm: …". */
export const chuCanThem = (s: string): string => {
  const t = s.trim()
  return /^cần\s/i.test(t) ? t.charAt(0).toUpperCase() + t.slice(1) : `Cần thêm: ${t}`
}
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
    // ĐỢT 16 — tuỳ chọn (xem `KetQuaNhipHocApp`)
    ...(so(du.doTinCay) !== null ? { doTinCay: Math.max(0, Math.min(100, Math.round(so(du.doTinCay)!))) } : {}),
    ...(typeof du.canThem === 'string' && du.canThem.trim() ? { canThem: du.canThem.trim() } : {}),
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

const L = LUAT_NHOM_NHIP
const conHomNay = (k: KetQuaNhipHocEm): number => (k.homNayMuc ? Math.max(0, k.homNayMuc.muc - k.homNayMuc.lam) : 0)
const homNayDu = (k: KetQuaNhipHocEm): boolean => !!k.homNayMuc && k.homNayMuc.lam >= k.homNayMuc.muc

/** Dòng đầu phần Nhịp học: "Đủ mức 2/11 ngày từ 01/10" (số ngày ĐÃ QUA, không gồm hôm nay — hôm nay là ô viền cuối dải). */
export const chuDuMucEm = (k: KetQuaNhipHocEm): string =>
  k.soNgayQua > 0 ? `Đủ mức ${k.soNgayDu}/${k.soNgayQua} ngày từ ${ngayNgan(k.tu)}` : `Bắt đầu đếm từ hôm nay ${ngayNgan(k.homNay)}`

/**
 * MỘT CON SỐ (thầy 12/10: gộp hai phần làm một): ô "hôm nay" của dải và mọi câu nói về hôm nay dùng CÙNG mức M và số đã làm của Sảnh (cập nhật sau
 * mỗi câu), không dùng số cũ của `/hs/nhip-hoc` khi lệch. Thay ngày hôm nay trong dải (chưa có thì thêm cuối) rồi tính lại bằng ĐÚNG phép thuần máy
 * chủ (`tomTatNhip` + `viecTiepNhip`) — các ngày đã qua (đủ mức a/b, chuỗi bỏ) không đổi; nhóm, chuỗi ngày và việc tiếp theo kịp số hôm nay.
 * Thiếu số Sảnh (M ≤ 0) ⇒ giữ nguyên. Thuần.
 */
export function nhipTheoSanh(k: KetQuaNhipHocEm, so: { muc: number; daLam: number } | null | undefined): KetQuaNhipHocEm {
  if (!so || !Number.isFinite(so.muc) || !Number.isFinite(so.daLam) || so.muc <= 0) return k
  const hom: NgayNhipEm = { ngay: k.homNay, muc: Math.round(so.muc), lam: Math.max(0, Math.round(so.daLam)) }
  const ngay = k.ngay.some((x) => x.ngay === k.homNay) ? k.ngay.map((x) => (x.ngay === k.homNay ? hom : x)) : [...k.ngay, hom]
  const t = tomTatNhip(ngay, k.homNay)
  return {
    ...k,
    ngay,
    nhom: t.nhom,
    chuoiDuGanNhat: t.chuoiDuGanNhat,
    ngayDuGanNhat: t.ngayDuGanNhat,
    tongDaLam: t.tongLam + hom.lam,
    homNayMuc: t.homNay,
    viecTiep: viecTiepNhip(t),
  }
}

/** "Việc tiếp:" cho Chăm / Chưa đều / Chưa đủ dữ liệu (Lười dùng `chuRaKhoiLuoi`). */
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
  return chuRaKhoiLuoi(k)
}

/** Dòng Lười (thầy 12/10: "6 ngày liền làm đủ mới thoát nhóm lười"): "Ra khỏi nhóm Lười: đủ mức 6 ngày liền — em đang có k/6 ngày" + hôm nay chưa đủ
 *  thì "hôm nay còn N câu nữa là được k+1/6 ngày" (N, k theo số của Sảnh qua `nhipTheoSanh`). Không có nút thứ hai — nút học duy nhất ở phần chính. */
export function chuRaKhoiLuoi(k: KetQuaNhipHocEm): string {
  const v = k.viecTiep
  const can = v.loai === 'thoat-luoi' ? v.canNgay : L.ngayLienThoatLuoi
  const co = Math.min(v.loai === 'thoat-luoi' ? v.coNgay : k.chuoiDuGanNhat, can)
  const dau = `Ra khỏi nhóm Lười: đủ mức ${can} ngày liền — em đang có ${co}/${can} ngày`
  if (co >= can || !k.homNayMuc) return `${dau}.`
  if (homNayDu(k)) return `${dau}, đã tính hôm nay. Mai làm đủ mức là được ${co + 1}/${can} ngày.`
  return `${dau}, hôm nay còn ${conHomNay(k)} câu nữa là được ${co + 1}/${can} ngày.`
}

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
