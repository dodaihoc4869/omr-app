// MỨC LÀM THEO LÔ EM — lớp nối của bảng điểm danh app thầy (bản vẽ 03 "Bảng điểm danh", thầy 20/10). Chỉ tệp này biết lệnh CHỈ ĐỌC `POST /gv/muc-lam-lo {sbds}` (server/src/muc-lam-lo.ts):
// số lượt 14 ngày của từng em theo Mức làm 1 → 4. Máy chủ đã xếp mức; ở đây CHỈ ĐỌC chặt (trường thiếu / sai kiểu ⇒ bỏ em ấy, không bịa số) và dựng câu chữ.
// Không ném lỗi: trả `KetQuaLenh` với MỘT câu nói thật.
import { goiLenh, type KetQuaLenh } from './goi-lenh-thay'

export const DUONG_MUC_LAM_LO = '/gv/muc-lam-lo'
/** Trần số em một lần hỏi (máy chủ cũng cắt ở đây). */
export const TOI_DA_EM_MUC_LAM_LO = 40
const CHU_CHUA_CO = 'Máy chủ chưa có lệnh Mức làm theo lô — cần đẩy bản máy chủ mới.'

export interface MucLamEm {
  /** Số lượt CÓ số đo (đủ để xếp Mức làm 1–4). */
  soDo: number
  /** Số lượt chưa có số đo (đồng hồ cũ không kích thước đề, ca thi, không giây…). */
  chuaCoSoDo: number
  /** Số lượt Mức 1 → 4. */
  m: [number, number, number, number]
  /** Trong `soDo`: số lượt xếp từ giây cũ / ước tính (hiện "≈"). */
  soUocTinh: number
}

type O = Record<string, unknown>
const dt = (x: unknown): O | null => (x && typeof x === 'object' && !Array.isArray(x) ? (x as O) : null)
const soNguyen = (x: unknown): number | null => (typeof x === 'number' && Number.isFinite(x) && x >= 0 && Number.isInteger(x) ? x : null)

/** Một em của lệnh; hỏng ⇒ null. `m` phải đúng 4 số nguyên ≥ 0 và cộng đúng `soDo` (không khớp ⇒ bỏ: không bịa thanh). */
export function docMucLamEm(x: unknown): MucLamEm | null {
  const o = dt(x)
  if (!o) return null
  const soDo = soNguyen(o.soDo), chua = soNguyen(o.chuaCoSoDo), uoc = soNguyen(o.soUocTinh)
  const m = Array.isArray(o.m) && o.m.length === 4 ? o.m.map(soNguyen) : null
  if (soDo === null || chua === null || uoc === null || !m || m.some((v) => v === null)) return null
  const mm = m as [number, number, number, number]
  if (mm[0] + mm[1] + mm[2] + mm[3] !== soDo || uoc > soDo) return null
  return { soDo, chuaCoSoDo: chua, m: mm, soUocTinh: uoc }
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

/** Câu một dòng cho thanh Mức làm của một em (dùng cho nhãn đọc màn hình + chú thích). Thuần. */
export function chuMucLamEm(d: MucLamEm): string {
  if (d.soDo === 0) return d.chuaCoSoDo > 0 ? `Chưa có số đo (${d.chuaCoSoDo} lượt)` : 'Chưa có lượt nào 14 ngày qua'
  const x = d.m[0] + d.m[1]
  return `Mức làm 1–2: ${x}/${d.soDo} lượt${d.soUocTinh > 0 ? ' (có lượt ≈ ước tính)' : ''}`
}
