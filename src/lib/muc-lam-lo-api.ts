// MỨC LÀM THEO LÔ EM — lớp nối của bảng điểm danh app thầy (bản vẽ 03 "Bảng điểm danh", thầy 20/10). Chỉ tệp này biết lệnh CHỈ ĐỌC `POST /gv/muc-lam-lo {sbds}` (server/src/muc-lam-lo.ts):
// số lượt 14 ngày của từng em theo Mức làm 1 → 4 + Treo máy / Cố tình treo máy (6 mức, 22/10) + lượt sai vội / dù nghĩ. Máy chủ đã xếp mức; ở đây CHỈ ĐỌC chặt (trường thiếu / sai kiểu ⇒ bỏ em ấy, không bịa số) và dựng câu chữ.
// Không ném lỗi: trả `KetQuaLenh` với MỘT câu nói thật.
import { goiLenh, type KetQuaLenh } from './goi-lenh-thay'

export const DUONG_MUC_LAM_LO = '/gv/muc-lam-lo'
/** Trần số em một lần hỏi (máy chủ cũng cắt ở đây). */
export const TOI_DA_EM_MUC_LAM_LO = 40
const CHU_CHUA_CO = 'Máy chủ chưa có lệnh Mức làm theo lô — cần đẩy bản máy chủ mới.'

export interface MucLamEm {
  /** Số lượt CÓ số đo (= Σm + soTreo + soCoTinh). */
  soDo: number
  /** Số lượt chưa có số đo (đồng hồ cũ không kích thước đề, ca thi, không giây…). */
  chuaCoSoDo: number
  /** Số lượt Mức 1 → 4 KHÔNG treo (máy chủ `tachTreo`, 6 mức). */
  m: [number, number, number, number]
  /** Trong `soDo`: số lượt xếp từ giây cũ / ước tính (hiện "≈"). */
  soUocTinh: number
  /** (6 mức, 22/10) Mức 5 · Treo máy / Mức 6 · Cố tình treo máy (CHỈ màn thầy) / lượt chưa đo treo máy. Máy chủ cũ không gửi ⇒ 0. */
  soTreo: number
  soCoTinh: number
  soChuaDoTreo: number
  /** Lượt SAI ở Mức 1–2 / Mức 3–4 (không kể lượt treo). Máy chủ cũ không gửi ⇒ vắng (ô «Sai vì vội» ghi "—"). */
  saiLamVoi?: number
  saiDuNghi?: number
}

type O = Record<string, unknown>
const dt = (x: unknown): O | null => (x && typeof x === 'object' && !Array.isArray(x) ? (x as O) : null)
const soNguyen = (x: unknown): number | null => (typeof x === 'number' && Number.isFinite(x) && x >= 0 && Number.isInteger(x) ? x : null)

/**
 * Một em của lệnh; hỏng ⇒ null (không bịa thanh). `m` phải đúng 4 số nguyên ≥ 0 và `Σm + soTreo + soCoTinh = soDo`.
 * Máy chủ CŨ (chưa có treo máy) không gửi các trường treo ⇒ 0 ⇒ `Σm = soDo` vẫn đọc được; máy chủ giữa chừng (có treo nhưng chưa tách khỏi `m`) ⇒ tổng lệch ⇒ bỏ em ấy.
 */
export function docMucLamEm(x: unknown): MucLamEm | null {
  const o = dt(x)
  if (!o) return null
  const soDo = soNguyen(o.soDo), chua = soNguyen(o.chuaCoSoDo), uoc = soNguyen(o.soUocTinh)
  const m = Array.isArray(o.m) && o.m.length === 4 ? o.m.map(soNguyen) : null
  if (soDo === null || chua === null || uoc === null || !m || m.some((v) => v === null)) return null
  const tuy = (k: string): number | null => (o[k] === undefined ? 0 : soNguyen(o[k]))
  const treo = tuy('soTreo'), coTinh = tuy('soCoTinh'), chuaTreo = tuy('soChuaDoTreo')
  if (treo === null || coTinh === null || chuaTreo === null) return null
  const mm = m as [number, number, number, number]
  if (mm[0] + mm[1] + mm[2] + mm[3] + treo + coTinh !== soDo || uoc > soDo || chuaTreo > soDo) return null
  const sv = soNguyen(o.saiLamVoi), sn = soNguyen(o.saiDuNghi)
  const coSai = sv !== null && sn !== null && sv <= mm[0] + mm[1] && sn <= mm[2] + mm[3]
  return { soDo, chuaCoSoDo: chua, m: mm, soUocTinh: uoc, soTreo: treo, soCoTinh: coTinh, soChuaDoTreo: chuaTreo, ...(coSai ? { saiLamVoi: sv, saiDuNghi: sn } : {}) }
}

// ───────────── DẤU HIỆU 2 GIÂY (bản vẽ docs/ban-ve-muc-lam-6-muc-2210, thầy duyệt 22/10). Ngưỡng TẠM — chỉnh sau ~1 tuần dữ liệu thật. ─────────────
/** «Sai vì vội» chỉ tính khi em có ít nhất ngần này lượt SAI có Mức làm 1–4 (Mức làm chỉ GIẢI THÍCH lượt sai — lượt đúng nộp nhanh không phải vội). */
export const MAU_SAI_VOI = 5
/** Tỉ lệ lượt sai ở Mức 1–2 để tô hổ phách + vào bộ lọc «Sai vì vội nhiều». */
export const TI_LE_SAI_VOI = 0.5
/** Số lượt treo (Mức 5 + 6) để tô ô «Treo máy» (1 lượt có thể chỉ là em nghe điện thoại). */
export const TREO_TO = 2

/** «Sai vì vội» của một em: `{ phanTram, voi, sai }` khi đủ mẫu; `{ it: sai }` khi ít lượt sai; null khi máy chủ không gửi số lượt sai. Thuần. */
export function tiLeSaiVoi(d: MucLamEm): { phanTram: number; voi: number; sai: number } | { it: number } | null {
  if (d.saiLamVoi === undefined || d.saiDuNghi === undefined) return null
  const sai = d.saiLamVoi + d.saiDuNghi
  if (sai < MAU_SAI_VOI) return { it: sai }
  return { phanTram: Math.round((100 * d.saiLamVoi) / sai), voi: d.saiLamVoi, sai }
}

export type LocMucLam = 'voi' | 'treo' | 'co-tinh'
/** Bộ lọc dòng tổng: «Sai vì vội nhiều» = đủ mẫu và ≥ 50%; «Treo máy» = ≥ 1 lượt treo (Mức 5 hoặc 6); «Cố tình treo máy» = có Mức 6. Thuần. */
export function coDauHieu(d: MucLamEm | undefined, k: LocMucLam): boolean {
  if (!d) return false
  if (k === 'treo') return d.soTreo + d.soCoTinh > 0
  if (k === 'co-tinh') return d.soCoTinh > 0
  const t = tiLeSaiVoi(d)
  return !!t && 'phanTram' in t && t.voi / t.sai >= TI_LE_SAI_VOI
}

export async function layMucLamLo(sbds: readonly string[]): Promise<KetQuaLenh<{ em: Map<string, MucLamEm> }>> {
  const ds = [...new Set(sbds.filter(Boolean))].slice(0, TOI_DA_EM_MUC_LAM_LO)
  if (!ds.length) return { ok: true, du: { em: new Map() } }
  const r = await goiLenh(DUONG_MUC_LAM_LO, { sbds: ds }, CHU_CHUA_CO)
  if (!r.ok) return r
  const goc = dt(r.du.em)
  if (!goc) return { ok: false, loai: 'khong_doc_duoc', chu: 'Máy chủ trả Mức làm không đúng dạng.' }
  const em = new Map<string, MucLamEm>()
  for (const s of ds) {
    const v = docMucLamEm(goc[s])
    if (v) em.set(s, v)
  }
  return { ok: true, du: { em } }
}

/** Câu một dòng cho nhãn đọc màn hình của dòng em (số trên cột % + thanh + treo + cờ). Thuần. */
export function chuMucLamEm(d: MucLamEm): string {
  if (d.soDo === 0) return d.chuaCoSoDo > 0 ? `Chưa có số đo (${d.chuaCoSoDo} lượt)` : 'Chưa có lượt nào 14 ngày qua'
  const t = tiLeSaiVoi(d)
  const phan: string[] = []
  if (d.soCoTinh > 0) phan.push(`Cố tình treo máy ${d.soCoTinh} lượt`)
  if (t && 'phanTram' in t) phan.push(`Sai vì vội ${t.phanTram}%, ${t.voi} trên ${t.sai} lượt sai`)
  else if (t) phan.push(`Ít lượt sai có số đo (${t.it})`)
  const treo = d.soTreo + d.soCoTinh
  phan.push(`${d.soUocTinh > 0 ? 'khoảng ' : ''}vội ${d.m[0] + d.m[1]}, có nghĩ ${d.m[2] + d.m[3]}${treo ? `, treo máy ${treo}` : ''} lượt trong 14 ngày`)
  return phan.join('. ')
}
