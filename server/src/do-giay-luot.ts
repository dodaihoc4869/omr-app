// ĐO GIÂY TỪNG LƯỢT LÀM CÂU (thầy 20/10/2026: "tất cả các câu học sinh đã làm, đang làm hoặc sắp làm đều phải đo được").
// Đặc tả: docs/dac-ta-muc-lam-bai-2010.md mục 4. Máy em gửi MỘT cụm `doGiay` cùng lượt nộp; máy chủ CHỈ làm sạch rồi ghi vào sổ:
//   · cột `giay` (số nguyên 1–900) — giây câu hiện đủ trên màn, tab đang hiện, dừng khi 180 giây không chạm;
//   · `raw_json.doc = { t: số từ của đề, h: có hình 0/1, p: phần I/II/III }` — kích thước đề tại lúc làm, để sau này tính "thời gian đọc hết đề"
//     (8 + 0,35 × số từ + 10 × có hình, `thoi-gian-len-bang.ts`) và xếp Mức làm mà KHÔNG cần đọc lại đề.
// Máy chủ KHÔNG bao giờ tự ước giây vào sổ. Thiếu / sai khuôn / ngoài khoảng ⇒ bỏ giá trị đó (NULL), lượt vẫn ghi như cũ.
// Giây < 1 bị bỏ: đồng hồ hỏng báo 0 sẽ thành "Mức làm 1" oan cho cả lớp.
import { noiDungTuCauGoc } from '../../src/lib/thoi-gian-len-bang'

export const GIAY_LUOT_TOI_DA = 900
export const SO_TU_TOI_DA = 3000
export type PhanDo = 'I' | 'II' | 'III'
export interface DoLuot {
  /** Giây đo thật (nguyên, 1–900) hoặc null. */
  giay: number | null
  /** Số từ của đề (đề + phương án/ý) lúc làm, hoặc null. */
  tu: number | null
  /** Có hình/bảng (1) hay không (0), hoặc null khi máy em không báo. */
  hinh: 0 | 1 | null
  phan: PhanDo | null
}

const laObj = (x: unknown): x is Record<string, unknown> => !!x && typeof x === 'object' && !Array.isArray(x)
const laSo = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x)

/** Làm sạch MỘT cụm `{g, t, h, p}`. Không có giá trị hợp lệ nào ⇒ null. */
export function lamSachDo(x: unknown): DoLuot | null {
  if (!laObj(x)) return null
  const g = laSo(x.g) ? Math.round(x.g) : null
  const t = laSo(x.t) ? Math.round(x.t) : null
  const giay = g !== null && g >= 1 && g <= GIAY_LUOT_TOI_DA ? g : null
  const tu = t !== null && t >= 0 && t <= SO_TU_TOI_DA ? t : null
  const hinh = x.h === 1 || x.h === true ? 1 : x.h === 0 || x.h === false ? 0 : null
  const phan = x.p === 'I' || x.p === 'II' || x.p === 'III' ? x.p : null
  if (giay === null && tu === null) return null
  return { giay, tu, hinh, phan }
}

/**
 * Lệnh nộp MỘT câu (game, ôn lại, chữa lỗi): thân có `doGiay: {g, t, h, p}`.
 * `ms` (tuỳ chọn): số mili-giây cũ của lệnh (game gửi `msLam`) — chỉ dùng khi `doGiay.g` vắng, đổi ra giây (1–900).
 */
export function docDoGiayMot(body: unknown, tuy: { ms?: unknown } = {}): DoLuot | null {
  const d = laObj(body) ? lamSachDo(body.doGiay) : null
  if (d && d.giay !== null) return d
  const ms = laSo(tuy.ms) ? Math.round(tuy.ms / 1000) : null
  const giay = ms !== null && ms >= 1 && ms <= GIAY_LUOT_TOI_DA ? ms : null
  if (giay === null) return d
  return { giay, tu: d?.tu ?? null, hinh: d?.hinh ?? null, phan: d?.phan ?? null }
}

/** Lệnh nộp NHIỀU câu (phiếu BTVN, khắc phục, chặng lô): thân có `doGiay: { [qid]: {g, t, h, p} }`. Tối đa 200 câu. */
export function docDoGiayNhieu(body: unknown): Map<string, DoLuot> {
  const ra = new Map<string, DoLuot>()
  if (!laObj(body) || !laObj(body.doGiay)) return ra
  let n = 0
  for (const [qid, v] of Object.entries(body.doGiay)) {
    if (++n > 200) break
    const d = lamSachDo(v)
    if (d && qid) ra.set(qid, d)
  }
  return ra
}

/** Ghép kích thước đề vào `raw` của sự kiện sổ (thêm khoá `doc`, không đụng khoá nào khác). Không có số từ ⇒ trả `raw` nguyên. */
export function ghepDocVaoRaw(raw: unknown, d: DoLuot | null | undefined): unknown {
  if (!d || d.tu === null) return raw
  const goc = laObj(raw) ? { ...raw } : {}
  goc.doc = { t: d.tu, ...(d.hinh !== null ? { h: d.hinh } : {}), ...(d.phan ? { p: d.phan } : {}) }
  return goc
}

/** Phần sổ `SuKien` cần thêm cho một lượt: `{ giay, raw }` (chỉ trường có giá trị). `raw` vào để máy chủ gộp với raw sẵn có. */
export function phanSoCuaDo(d: DoLuot | null | undefined, rawCu?: unknown): { giay?: number; raw?: unknown } {
  if (!d) return rawCu === undefined ? {} : { raw: rawCu }
  const raw = ghepDocVaoRaw(rawCu, d)
  return { ...(d.giay !== null ? { giay: d.giay } : {}), ...(raw !== undefined ? { raw } : {}) }
}

/**
 * Máy chủ TỰ đo kích thước đề từ chính câu nó vừa chấm (không tin số máy em gửi, không đọc thêm D1/R2): số từ + có hình + phần, bằng ĐÚNG hàm của
 * màn lên bảng (`noiDungTuCauGoc`). Chỉ cần khi lượt có giây đo thật; phần lạ ⇒ trả nguyên.
 */
export function boSungKichThuocDe(d: DoLuot | null, phan: unknown, cau: unknown): DoLuot | null {
  if (!d || d.giay === null) return d
  if (phan !== 'I' && phan !== 'II' && phan !== 'III') return d
  // Đường ghi sổ là đường QUAN TRỌNG NHẤT của lượt nộp: câu có khuôn lạ làm hàm đếm ném lỗi thì chỉ bỏ phần kích thước đề, TUYỆT ĐỐI không để lỗi lan ra làm mất dòng sổ.
  try {
    const nd = noiDungTuCauGoc(phan, cau)
    return { ...d, tu: Math.min(SO_TU_TOI_DA, Math.max(0, nd.soTu)), hinh: nd.coHinh ? 1 : 0, phan }
  } catch {
    return d
  }
}
