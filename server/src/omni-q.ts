// OMNI 3 — MA TRẬN Q: A.I Đỗ Đại Học GỢI vi kỹ năng cho câu từ nhãn sẵn có của kho (kienThuc[], nhãn nền từng bước); lùi về một vi kỹ năng = dạng. LÕI THUẦN.
// Đặc tả mục 4.1 (ma trận Q) + 8. MÃ VI KỸ NĂNG THỐNG NHẤT (phiên điều phối 05/10): mỗi câu cần (cổng AND) = `dang:<ma_dang>` (kiến thức khái
// niệm của dạng — LUÔN có) ∪ vi kỹ năng của dạng khớp `kienThuc` ∪ `nen:<nhãn>` cho mỗi nhãn kiến thức nền ở các bước lời giải (danh mục
// TEN_NEN của thang-tu-go.ts; bỏ trùng, tối đa SO_NEN_TOI_DA nhãn, theo thứ tự bước). `nen:*` dùng CHUNG mọi dạng.
// Làn ghi omni_q tự động dùng đúng luật này; `goiYQ` là đường lùi cho câu chưa được ghi.
import type { Phan, QCau, Vkn } from './omni-kieu'

/** Số nhãn kiến thức nền tối đa gắn vào một câu (hoặc một ý Đúng–sai). */
export const SO_NEN_TOI_DA = 3
/** Tiền tố vi kỹ năng kiến thức nền dùng chung mọi dạng. */
export const TIEN_TO_NEN = 'nen:'
/** Dạng nhãn nền hợp lệ (như NHAN_HOP_LE của thang-tu-go.ts) — dùng khi nơi gọi không truyền danh mục. */
const NHAN_NEN_HOP_LE = /^[a-z][a-z0-9_]{1,39}$/

/** Vi kỹ năng mặc định của một dạng (khi chưa có nhãn): `dang:<ma_dang>`; không có dạng ⇒ `cd:<chuyên đề>`; không có gì ⇒ `cau:<qid>`. */
export function vknMacDinh(maDang: string | null | undefined, chuyenDe?: string | null, qid?: string): string {
  if (maDang) return `dang:${maDang}`
  if (chuyenDe) return `cd:${chuyenDe}`
  return `cau:${qid ?? ''}`
}
export function qMacDinh(qid: string, phan: Phan, maDang: string | null, mucDo: string | null, chuyenDe?: string | null): QCau {
  return { qid, phan, maDang, mucDo, vkn: [vknMacDinh(maDang, chuyenDe, qid)], nguon: 'mac_dinh' }
}
/** Vi kỹ năng kiến thức nền của một nhãn: `nen:<nhãn>`. */
export function vknNen(nhan: string): string {
  return `${TIEN_TO_NEN}${nhan}`
}

/** Chuẩn hoá nhãn để so khớp: bỏ dấu tiếng Việt (cả đ/Đ), viết thường, gộp khoảng trắng, cắt hai đầu. */
export function chuanHoaNhan(s: string | null | undefined): string {
  return String(s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

/** Danh mục nhãn nền: object TEN_NEN (khoá là nhãn), Set hoặc mảng nhãn. */
export type DanhMucNen = Readonly<Record<string, string>> | ReadonlySet<string> | readonly string[]
const taoKiemNen = (dm: DanhMucNen | undefined): ((nhan: string) => boolean) => {
  if (!dm) return (n) => n !== 'khac' && NHAN_NEN_HOP_LE.test(n)
  const tap = dm instanceof Set ? new Set(dm) : Array.isArray(dm) ? new Set(dm as readonly string[]) : new Set(Object.keys(dm))
  return (n) => n !== 'khac' && tap.has(n)
}
/** Nhãn nền theo thứ tự bước (bước bằng nhau ⇒ thứ tự truyền vào), chỉ nhãn thuộc danh mục, bỏ trùng, tối đa SO_NEN_TOI_DA ⇒ `nen:<nhãn>`. */
export function vknNenTuBuoc(nhanNen: readonly { buoc: number; nen: string }[] | null | undefined, danhMucNen?: DanhMucNen): string[] {
  const thuoc = taoKiemNen(danhMucNen)
  const ds = (nhanNen ?? [])
    .map((x, i) => ({ buoc: Number.isFinite(x?.buoc) ? Number(x.buoc) : Number.POSITIVE_INFINITY, i, nen: typeof x?.nen === 'string' ? x.nen.trim() : '' }))
    .filter((x) => x.nen && thuoc(x.nen))
    .sort((a, b) => a.buoc - b.buoc || a.i - b.i)
  const ra: string[] = []
  for (const x of ds) {
    const k = vknNen(x.nen)
    if (!ra.includes(k)) ra.push(k)
    if (ra.length >= SO_NEN_TOI_DA) break
  }
  return ra
}

/**
 * Gợi Q cho một câu (đường lùi khi omni_q chưa có dòng của câu):
 *   vkn = [vknMacDinh (dang:<ma_dang>)] ∪ vi kỹ năng của dạng khớp `kienThuc` (nhãn chuẩn hoá BẰNG `ten` hoặc `nhanNen` của một phần tử `vknDang`;
 *         sắp theo (thuTu, id)) ∪ `nen:<nhãn>` theo `nhanNen` (vknNenTuBuoc). Bỏ trùng; cổng AND.
 *   Phần II: ý i có dữ liệu riêng (`kienThucY[i]` hoặc `nhanNenY[i]` không rỗng) ⇒ vknY[i] = [dang] ∪ khớp kienThucY[i] ∪ nen của nhanNenY[i];
 *   ý không có ⇒ vknY[i] = vkn. Không ý nào có dữ liệu riêng ⇒ không có vknY (mỗi ý dùng vkn).
 *   Chỉ có dang (không khớp gì thêm) ⇒ qMacDinh (nguon 'mac_dinh'); có thêm ⇒ nguon 'goi_y'.
 * `danhMucNen`: truyền TEN_NEN (thang-tu-go.ts) để chỉ nhận nhãn trong danh mục; vắng ⇒ nhận nhãn đúng dạng a-z0-9_ (bỏ 'khac').
 */
export function goiYQ(
  cau: { qid: string; phan: Phan; maDang: string | null; mucDo: string | null; chuyenDe?: string | null; kienThuc?: readonly string[]; kienThucY?: readonly (readonly string[])[]; nhanNen?: readonly { buoc: number; nen: string }[]; nhanNenY?: readonly (readonly { buoc: number; nen: string }[])[] },
  vknDang: readonly Vkn[],
  danhMucNen?: DanhMucNen,
): QCau {
  const theoNhan = new Map<string, Vkn[]>()
  for (const v of vknDang ?? []) {
    if (!v || typeof v.id !== 'string' || !v.id) continue
    for (const nhan of new Set([chuanHoaNhan(v.ten), chuanHoaNhan(v.nhanNen)])) {
      if (!nhan) continue
      const ds = theoNhan.get(nhan) ?? []
      if (!ds.some((x) => x.id === v.id)) ds.push(v)
      theoNhan.set(nhan, ds)
    }
  }
  const khop = (nhan: readonly (string | null | undefined)[] | null | undefined): string[] => {
    const gap = new Map<string, Vkn>()
    for (const n of nhan ?? []) for (const v of theoNhan.get(chuanHoaNhan(n)) ?? []) gap.set(v.id, v)
    return [...gap.values()]
      .sort((a, b) => (a.thuTu ?? 0) - (b.thuTu ?? 0) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
      .map((v) => v.id)
  }
  const dang = vknMacDinh(cau.maDang, cau.chuyenDe, cau.qid)
  const hop = (...ds: string[][]): string[] => [...new Set(ds.flat())]
  const vkn = hop([dang], khop(cau.kienThuc), vknNenTuBuoc(cau.nhanNen, danhMucNen))
  let vknY: string[][] | undefined
  if (cau.phan === 'II') {
    const coRieng = (i: number): boolean => !!(cau.kienThucY?.[i]?.length || cau.nhanNenY?.[i]?.length)
    if ([0, 1, 2, 3].some(coRieng)) {
      vknY = [0, 1, 2, 3].map((i) => (coRieng(i) ? hop([dang], khop(cau.kienThucY?.[i]), vknNenTuBuoc(cau.nhanNenY?.[i], danhMucNen)) : [...vkn]))
    }
  }
  const coThem = vkn.length > 1 || !!vknY?.some((ds) => ds.length > 1)
  if (!coThem) return qMacDinh(cau.qid, cau.phan, cau.maDang, cau.mucDo, cau.chuyenDe)
  return { qid: cau.qid, phan: cau.phan, maDang: cau.maDang, mucDo: cau.mucDo, vkn, ...(vknY ? { vknY } : {}), nguon: 'goi_y' }
}
