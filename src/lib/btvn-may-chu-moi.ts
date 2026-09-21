// BÀI TẬP VỀ NHÀ — dựng mới trọn trên máy chủ mới, 0% Apps Script.
//
// Đặc tả: `claude/PHAN-CONG-GIAO-BTVN.md`. Khác bản đặc tả một điểm, và thầy đã
// chốt: bản này KHÔNG ghi sang Apps Script nữa. Bài giao, bài nộp, đếm đã
// nộp/chưa nộp — tất cả ở D1.
//
// BA LUẬT CHỐT CỨNG, cả ba đều chặn ở MÁY CHỦ chứ không chỉ ẩn nút ở máy em:
//   1. Chỉ em CÓ LƯỢT trong ca ấy mới được giao.
//   2. Lấy TẤT CẢ câu của tờ đề, đúng thứ tự kho — không xáo, không lọc.
//   3. Hạn 48 giờ tính từ lúc thầy bấm Giao, chung cho cả lớp. Quá hạn thì máy
//      chủ từ chối, vì giờ trên máy em chỉnh được.
import type { CauHinhMayChu } from './cau-hinh-may-chu'
import { docKetQuaChang, type KetQuaChang } from './btvn-ca-nhan-kieu'

export interface KetQuaGiaoBtvn {
  maBtvn: string
  soEm: number
  soCau: number
  hanNop: string
  /** Số ca THẬT SỰ được giao — ca chưa em nào vào thi bị bỏ qua. */
  soCa?: number
  /** Những ca bị bỏ qua vì chưa em nào vào thi. */
  caRong?: string[]
  /** Máy chủ xác nhận bài này giao theo kiểu NÂNG ĐỠ (mỗi em một bộ câu). Vắng ⇒ máy chủ chưa hỗ trợ: bài đã giao NHƯ CŨ (cả lớp đủ câu). */
  caNhan?: boolean
  /** Số câu LÕI chung máy chủ chọn (bài nâng đỡ). */
  soLoi?: number
  /** 'loi_it_hon_6': lõi < 6 câu ⇒ so chống chép bài không đủ mẫu chung (vẫn giao). */
  canhBao?: string
  /** qid thầy gửi mà tờ đề không có (bị bỏ). */
  boQuaQid?: string[]
  /** Số câu của tờ đề mà `cau[]` gửi thiếu (máy chủ điền dạng/mức mặc định). */
  thieuMeta?: number
}

export interface DongTheoDoiBtvn {
  maBtvn: string
  maCa: string
  maDe: string
  soCau: number
  giaoLuc: string
  hanNop: string
  quaHan: boolean
  tong: number
  daNop: number
  /** BTVN NÂNG ĐỠ (hợp đồng docs/hop-dong-btvn-nang-do-2109.md mục 6): bài giao theo bộ câu riêng từng em; vắng ⇒ bài cũ. */
  caNhan?: boolean
  /** Số câu LÕI chung của bài nâng đỡ. */
  soLoi?: number
  hocSinh?: {
    sbd: string
    hoTen: string
    nopLuc: string | null
    soDung: number | null
    soCau: number | null
    thuHoi: boolean
    /** Bài nâng đỡ: số câu CỦA EM (null = em chưa mở bài, bộ chưa chốt) · số chặng · chặng đã xong · đúng/lõi (so lớp CHỈ trên lõi) · câu thưởng em sai (không vào điểm). */
    soCauCuaEm?: number | null
    /** BẢN 1.2: số câu "thử sức thêm — không bắt buộc" của em (KHÔNG nằm trong `soCauCuaEm` / chặng). Vắng ⇒ bài chưa có luật 1.2 (màn giữ cách hiện cũ). */
    soThuSucThem?: number | null
    soChang?: number | null
    loDaXong?: number | null
    soDungLoi?: number | null
    soCauLoi?: number | null
    diemLoi?: number | null
    soCauThuongSai?: number | null
    gianLan?: boolean
    xacSuatGianLan?: number
    lyDoGianLan?: string
    diemThiDoiChieu?: number | null
    chiTietDoiChieu?: {
      diemThiTB?: number | null
      diemThiMax?: number | null
      soCaThi?: number
      diemBtvnQuyDoi?: number | null
      doLechNangLuc?: number | null
      trungLapVoi?: string | null
      tiLeTrungLap?: number | null
      trungLoiSai?: number | null
      khoangCachPhut?: number | null
      soLanRoiManThi?: number
    }
  }[]
  chuaNop: { sbd: string; hoTen: string }[]
}

async function goi<T>(ch: CauHinhMayChu, duong: string, than: unknown, mat?: string): Promise<T | null> {
  if (!ch.URL) return null
  const bo = new AbortController()
  const hen = setTimeout(() => bo.abort(), (ch.HAN_GIAY || 20) * 1000)
  try {
    const dau: Record<string, string> = { 'content-type': 'application/json' }
    if (mat) dau['x-ma-bi-mat'] = mat
    const res = await fetch(`${ch.URL}${duong}`, { method: 'POST', headers: dau, body: JSON.stringify(than), signal: bo.signal })
    // Preserve server errors (including expired teacher credentials) for visible feedback.
    return (await res.json()) as T
  } catch {
    return null
  } finally {
    clearTimeout(hen)
  }
}

/** THẦY GIAO BÀI cho một ca đã thi (hoặc cho từng học sinh cụ thể). Ném lỗi có câu chữ để màn hình hiện thẳng. */
export async function giaoBtvn(
  ch: CauHinhMayChu,
  mat: string,
  dsMaCa: string[],
  dsMaDe: string[],
  dsSbd?: string[],
  hanNop?: string,
  dsSbdThem?: string[],
  /** BTVN NÂNG ĐỠ (thầy bật công tắc Cá nhân hoá): gửi kèm dạng/mức/sao từng câu + câu ghim. Vắng ⇒ y như cũ, không đổi một byte thân gửi. */
  nangDo?: { cau: unknown[]; ghim: string[]; hatGiong?: string },
): Promise<KetQuaGiaoBtvn> {
  const coSbd = Boolean(dsSbd && dsSbd.length > 0)
  if (dsMaCa.length === 0 && !coSbd && !dsSbdThem?.length) throw new Error('Chưa tick ca nào')
  if (dsMaDe.length === 0) throw new Error('Chưa tick tờ đề nào')
  if (dsSbd && dsSbd.length === 0) throw new Error('Chưa tick học sinh nào')
  const r = await goi<{ ok?: boolean; error?: string } & KetQuaGiaoBtvn>(
    ch,
    '/btvn/giao',
    { dsMaCa: dsMaCa.length > 0 ? dsMaCa : undefined, dsMaDe, dsSbd: coSbd ? dsSbd : undefined, dsSbdThem, hanNop, ...(nangDo ? { caNhan: true, cau: nangDo.cau, ghim: nangDo.ghim, ...(nangDo.hatGiong ? { hatGiong: nangDo.hatGiong } : {}) } : {}) },
    mat,
  )
  if (!r) throw new Error('Máy chủ không trả lời')
  if (!r.ok) throw new Error(r.error || 'Không giao được bài tập')
  return { maBtvn: r.maBtvn, soEm: r.soEm, soCau: r.soCau, hanNop: r.hanNop, soCa: r.soCa, caRong: r.caRong, ...(nangDo ? { caNhan: r.caNhan === true, soLoi: r.soLoi, canhBao: r.canhBao, boQuaQid: r.boQuaQid, thieuMeta: r.thieuMeta } : {}) }
}

/** THẦY THEO DÕI đã nộp / chưa nộp. */
export async function theoDoiBtvn(ch: CauHinhMayChu, mat: string, maCa = ''): Promise<DongTheoDoiBtvn[]> {
  const r = await goi<{ ok?: boolean; ds?: DongTheoDoiBtvn[] }>(ch, '/btvn/theo-doi', { maCa }, mat)
  return r?.ok && Array.isArray(r.ds) ? r.ds : []
}

/** EM MỞ BÀI TẬP — đường CÔNG KHAI, em chỉ có mã ca và số báo danh.
 *
 * Trả về cả `lyDo` khi bị từ chối, để màn hình hiện đúng câu chữ đã chốt
 * ("Bạn đã quá hạn nộp BTVN") thay vì một câu lỗi chung chung. */
export async function btvnCuaEm(
  ch: CauHinhMayChu,
  maCa: string,
  sbd: string,
  maBtvn?: string,
): Promise<{ ok: boolean; lyDo?: string; error?: string; maBtvn?: string; hanNop?: string; daNop?: boolean; soCau?: number; de?: unknown; [khac: string]: unknown }> {
  // Bài `ca_nhan` mang thêm caNhan/chang/nhan/tomTat/changDangMo… — đọc bằng `docBaiCaNhan` (btvn-ca-nhan-em.ts).
  const r = await goi<{ ok?: boolean; lyDo?: string; error?: string; maBtvn?: string; hanNop?: string; daNop?: boolean; soCau?: number; de?: unknown; [khac: string]: unknown }>(
    ch,
    '/btvn/cua-em',
    { maCa, sbd, maBtvn },
  )
  if (!r) return { ok: false, lyDo: 'mang', error: 'Không nối được máy chủ' }
  return { ...r, ok: r.ok === true }
}

/** EM NỘP BÀI TẬP. */
export async function nopBtvn(
  ch: CauHinhMayChu,
  d: { maBtvn: string; sbd: string; dapAn: unknown; soDung: number; soCau: number },
): Promise<{ ok: boolean; lyDo?: string; error?: string; nopLuc?: string; daNhan?: boolean }> {
  const r = await goi<{ ok?: boolean; lyDo?: string; error?: string; nopLuc?: string; daNhan?: boolean }>(ch, '/btvn/nop', d)
  if (!r) return { ok: false, lyDo: 'mang', error: 'Không nối được máy chủ' }
  return { ...r, ok: r.ok === true }
}

export async function suaGiaoBtvn(ch:CauHinhMayChu,mat:string,maBtvn:string,options:{thuHoi?:boolean;hanNop?:string;sbd?:string;hanhDong?:'reset'|'thu-hoi'}) {
 const r=await goi<{ok:boolean;error?:string}>(ch,'/btvn/sua',{maBtvn,...options},mat)
 if(!r?.ok)throw new Error(r?.error||'Chưa cập nhật được bài tập. Thầy thử lại.')
}

/** EM BÁO XONG MỘT LÔ BTVN (thay Vòng 1/2 — mục 3 SO-VIEC.md 19/09, xem
 * `lich-lo-btvn.ts`) — đường CÔNG KHAI như `btvnCuaEm`. An toàn gọi lại nhiều
 * lần: máy chủ chỉ TĂNG tiến độ (MAX), nên phiếu mở lại hay mất mạng giữa
 * chừng gọi lại cũng không lùi mốc đã có. */
export async function xongLoBtvn(
  ch: CauHinhMayChu,
  d: { maBtvn: string; sbd: string; chiSo: number },
): Promise<{ ok: boolean; loDaXong?: number; error?: string }> {
  const r = await goi<{ ok?: boolean; loDaXong?: number; error?: string }>(ch, '/btvn/xong-lo', d)
  if (!r) return { ok: false, error: 'Không nối được máy chủ' }
  return { ...r, ok: r.ok === true }
}

/** EM NỘP MỘT CHẶNG của bài `ca_nhan` (hợp đồng docs/hop-dong-btvn-nang-do-2109.md mục 4): gửi đáp án CÁC CÂU MỚI LÀM
 * của chặng; máy chủ chấm, ghi sổ, khoá đáp án đầu rồi trả kết quả + lời giải. Máy em KHÔNG có đáp án nên không tự chấm.
 * Gọi lại được khi mạng chập chờn (đáp án đầu thắng). Không bao giờ ném lỗi: hỏng thì `ok:false` kèm lời báo. */
export async function nopChangBtvn(
  ch: CauHinhMayChu,
  d: { maBtvn: string; sbd: string; chiSo: number; dapAn: Record<string, string> },
): Promise<KetQuaChang> {
  const r = await goi<unknown>(ch, '/btvn/xong-lo', d)
  if (!r) return { ok: false, error: 'Không nối được máy chủ', ketQua: [], chuaLam: [] }
  return docKetQuaChang(r) ?? { ok: false, error: 'Máy chủ trả về dữ liệu lạ', ketQua: [], chuaLam: [] }
}
