// Gọi máy chủ cho việc "ÔN CÂU" (on_lai) — docs/ke-hoach-ngay-api-1909.md mục "Làm câu ôn":
//   (1) POST /hs/cau-theo-qid  lấy ĐỀ (không đáp án)         (2) em làm
//   (3) POST /hs/on-lai/nop    máy chủ chấm + ghi sổ, rồi mới trả đáp án/lời giải
//   (4) gọi lại /hs/ke-hoach-ngay (màn cổng tự gọi khi sheet đóng: useLamMoiKhiDong)
// Mọi lỗi mạng → null, KHÔNG ném (màn phải sống được khi mất mạng). Khác `goiPost` của may-chu.ts: ở đây cần cả chữ báo lỗi của
// máy chủ (`ok:false, error`) nên trả kèm mã HTTP và thân JSON.
import { layDiaChiMayChu } from '../../lib/dia-chi-may-chu'
import { chanCauTuLuan } from '../../lib/cau-tu-luan-may-hs'
import { docThuThachRieng, type ThuThachRieng } from '../../lib/thu-thach-rieng'

/** Một câu ôn — hình dạng `publicQuestion` của game v2: KHÔNG có đáp án, lời giải. */
export interface CauOn {
  qid: string
  maDe?: string
  phan: 'I' | 'II' | 'III'
  text: string
  choices?: string[]
  ideas?: string[]
  table?: unknown
  thanCauImg?: string
  imageDataUrl?: string
  choiceImgs?: (string | undefined)[]
  ideaImgs?: (string | undefined)[]
  hinhAnh?: { viTri: string; src: string; alt?: string }[]
  dang?: string | null
  tenDang?: string | null
  mucDo?: 'biet' | 'hieu' | 'van_dung' | null
  sao?: 0 | 1 | 2 | null
  kienThuc?: string[]
}

export interface KetQuaCauOn {
  qid: string
  dung: boolean
  dapAnDung: string
  /** Chữ hoặc đối tượng như kho; `null` nếu kho chưa có. Vẽ bằng LoiGiaiCauSai. */
  loiGiai: unknown
  anhLoiGiai?: { viTri: string; src: string; alt?: string }[]
}

export interface TienBoOn {
  daLamCau: number
  lenBac: number
  tutBac: number
}

export interface PhanHoiNopOn {
  ok: boolean
  error?: string
  ketQua?: KetQuaCauOn[]
  khongCo?: string[]
  /** Câu nhận được nhưng CHƯA TRẢ LỜI: không ghi sổ, không khoá, không đáp án — em làm nốt. */
  chuaLam?: string[]
  tienBo?: TienBoOn | null
  /** EXP vừa cộng (0 = không cộng). Chưa có trường thì coi như 0 và không hiện. */
  exp?: number
  /** Khi EXP mới đã bật cho em: từng khoản vừa ghi (`ghiChu` là tiếng Việt máy chủ đã viết sẵn — in nguyên văn) và mảnh khiên mới. */
  expNhan?: { exp: number; ghiChu: string }[]
  manhNhan?: { so: number; ghiChu: string }[]
}

interface KetQuaGoi {
  trangThai: number
  du: any
}

async function goiChiTiet(duong: string, body: unknown, giay: number): Promise<KetQuaGoi | null> {
  const c = new AbortController()
  const t = setTimeout(() => c.abort(), giay * 1000)
  try {
    const url = await layDiaChiMayChu()
    if (!url) return null
    const r = await fetch(`${url}${duong}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), signal: c.signal })
    let du: any = null
    try {
      du = await r.json()
    } catch {
      du = null
    }
    return { trangThai: r.status, du }
  } catch {
    return null
  } finally {
    clearTimeout(t)
  }
}

/** Tối đa 20 mỗi lượt (giới hạn của máy chủ); quá thì cắt bớt, phần thừa để hôm sau. */
export const TOI_DA_CAU_ON = 20

export type KetQuaTaiCau = { ok: true; cau: CauOn[]; khongCo: string[] } | { ok: false; loi: string }

/** `POST /hs/cau-theo-qid` với token học sinh (SBD lấy từ chữ ký). */
export async function taiCauTheoQid(token: string, qid: string[]): Promise<KetQuaTaiCau> {
  const ds = [...new Set(qid.filter((q) => typeof q === 'string' && q.trim()))].slice(0, TOI_DA_CAU_ON)
  if (!token) return { ok: false, loi: 'Chưa đăng nhập nên chưa mở được câu ôn.' }
  if (ds.length === 0) return { ok: false, loi: 'Việc này chưa có câu nào để ôn.' }
  const r = await goiChiTiet('/hs/cau-theo-qid', { token, qid: ds }, 15)
  if (!r) return { ok: false, loi: 'Chưa tải được câu ôn. Em kiểm tra mạng rồi thử lại.' }
  const d = r.du
  if (!d || d.ok !== true || !Array.isArray(d.cau)) return { ok: false, loi: 'Máy chủ chưa đưa được câu ôn lúc này. Em thử lại sau ít phút.' }
  // Chốt chặn cuối (thầy lệnh 21/09 cấm rút câu tự luận): máy chủ đã lọc, đây chỉ để chắc — câu tự luận KHÔNG vào màn ôn.
  const cau = chanCauTuLuan((d.cau as any[]).filter((c) => c && typeof c.qid === 'string' && (c.phan === 'I' || c.phan === 'II' || c.phan === 'III')) as CauOn[], 'on-lai/cau-theo-qid')
  return { ok: true, cau, khongCo: Array.isArray(d.khongCo) ? d.khongCo.map(String) : [] }
}

export interface MucTraLoi {
  qid: string
  /** Phần I: một chữ A–D. Phần II: 4 ký tự D/S (ô bỏ trống ghi "-"). Phần III: số. Rỗng = chưa trả lời. */
  dapAn: string
  giay?: number
}

/** `POST /hs/on-lai/nop` — BẮT BUỘC token học sinh. Đáp án/lời giải chỉ có trong phản hồi `ok:true`. */
export async function nopOnLai(token: string, traLoi: MucTraLoi[], duong = '/hs/on-lai/nop'): Promise<PhanHoiNopOn> {
  if (!token) return { ok: false, error: 'Chưa đăng nhập nên chưa nộp được.' }
  // `duong` mặc định là ôn câu thường; "Thử thách riêng hôm nay" nộp qua `/hs/thu-thach-hom-nay/nop` (trả y hệt, máy chủ ghi nguồn `thu_thach_rieng`).
  const r = await goiChiTiet(duong, { token, traLoi: traLoi.slice(0, TOI_DA_CAU_ON) }, 20)
  if (!r) return { ok: false, error: 'Chưa gửi được lên máy chủ. Bài làm của em vẫn được giữ, em bấm nộp lại khi có mạng.' }
  const d = r.du
  if (!d || typeof d !== 'object') return { ok: false, error: 'Máy chủ trả lời không đọc được. Em thử nộp lại.' }
  if (d.ok !== true) return { ok: false, error: typeof d.error === 'string' && d.error.trim() ? d.error : 'Máy chủ chưa nhận bài. Em thử nộp lại.' }
  return {
    ok: true,
    ketQua: Array.isArray(d.ketQua) ? d.ketQua : [],
    khongCo: Array.isArray(d.khongCo) ? d.khongCo.map(String) : [],
    chuaLam: Array.isArray(d.chuaLam) ? d.chuaLam.map(String) : [],
    tienBo: d.tienBo && typeof d.tienBo === 'object' ? d.tienBo : null,
    exp: Number.isFinite(Number(d.exp)) ? Number(d.exp) : 0,
    expNhan: (Array.isArray(d.expNhan) ? d.expNhan : []).map((x: any) => ({ exp: Math.max(0, Math.floor(Number(x?.exp) || 0)), ghiChu: String(x?.ghiChu ?? '').trim() })).filter((x: { ghiChu: string }) => x.ghiChu),
    manhNhan: (Array.isArray(d.manhNhan) ? d.manhNhan : []).map((x: any) => ({ so: Math.max(0, Math.floor(Number(x?.so) || 0)), ghiChu: String(x?.ghiChu ?? '').trim() })).filter((x: { ghiChu: string }) => x.ghiChu),
  }
}

export const DUONG_NOP_THU_THACH = '/hs/thu-thach-hom-nay/nop'

/**
 * `POST /hs/thu-thach-hom-nay {}` — "Thử thách riêng hôm nay" của Bộ não (hợp đồng docs/hop-dong-thu-thach-rieng-2109.md mục 3). Máy chủ lần đầu trong ngày CHỌN VÀ CHỐT câu,
 * các lần sau trả đúng các câu đã chốt. `co:false`, lỗi, 404 (Worker chưa lên), mất mạng ⇒ null ⇒ KHÔNG thẻ (im lặng, không lỗi đỏ).
 */
export async function taiThuThachHomNay(token: string): Promise<ThuThachRieng | null> {
  if (!token) return null
  const r = await goiChiTiet('/hs/thu-thach-hom-nay', { token }, 15)
  if (!r || r.trangThai >= 400) return null
  return docThuThachRieng(r.du)
}
