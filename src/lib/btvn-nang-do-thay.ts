/** BTVN "NÂNG ĐỠ" — LỚP NỐI của app thầy (Code 4, đề bài `prompt-btvn-nang-do.md`, thiết kế `DE-XUAT-BTVN-NANG-DO-2109.md`, bản vẽ `docs/ban-ve-btvn-nang-do-2109/`).
 *
 *  Mọi thứ dính tới hợp đồng máy chủ (tên trường, đường, hình dạng phản hồi) nằm ở ĐÂY và ở `giaoBtvn` — màn hình chỉ đọc các kiểu bên dưới. Hợp đồng chính thức
 *  `docs/hop-dong-btvn-nang-do-2109.md` (Code 3) đổi thì đổi tại đây, màn không vỡ. KIỂU dùng chung với lõi thuần của Code 1 (`btvn-nang-do.ts`, chỉ import KIỂU).
 *  Máy chủ chưa có lệnh ⇒ ném lỗi thật, KHÔNG giả số. Chỉ SỐ ĐẾM; không xếp hạng em với em. */
import type { CauGiao, Muc, NhanCau, PhanCau, Sao, TomTatBo } from './btvn-nang-do'
import type { TeacherExamSource } from '../data/examContent'
import { layCauHinhMayChu } from './may-chu-moi'
import { loadTeacherSecret } from './exam-db'

/** Ghim câu "cả lớp bắt buộc": tối đa bấy nhiêu câu (thầy chốt qua bản vẽ 21/09). */
export const GHIM_TOI_DA = 10

export const TEN_MUC: Record<Muc, string> = { 0: 'Biết', 1: 'Hiểu', 2: 'Vận dụng' }

/** Mức độ dạng chữ của câu ('biet' | 'hieu' | 'van_dung') → thang số 0|1|2; chữ lạ/thiếu ⇒ 0 (Biết). Cùng quy ước với `mucTuChu` của Code 1. */
export function mucSo(chu: string | null | undefined): Muc {
  return chu === 'hieu' ? 1 : chu === 'van_dung' ? 2 : 0
}

/** Mã dạng để ĐẾM số dạng của bài: `dang` nếu có, không thì `CD:<chuyên đề>` — cùng quy ước với `maDangCua` của Code 1 (viết lại ở đây để màn không phụ thuộc thân hàm đó). */
export function maDangCuaThay(c: Pick<CauGiao, 'dang' | 'chuyenDe'>): string {
  return c.dang ?? `CD:${c.chuyenDe}`
}

/** MÃ CÂU gửi máy chủ cho một câu trong tờ đề. Điểm nối DUY NHẤT: hợp đồng máy chủ đổi cách gọi mã câu thì sửa đúng hàm này. */
export function qidCuaCau(_maDe: string, q: { id: string }): string {
  return q.id
}

type CauTrongDe = { id: string; chuyenDe?: string; mucDo?: 'biet' | 'hieu' | 'van_dung'; dang?: { ma: string; ten: string } | null; canChua?: { sao?: Sao } }

/** Các câu của những tờ đề thầy đã tick, đúng THỨ TỰ kho (phần I → II → III), kèm dạng/mức/sao đọc từ `LoiGiaiMeta` trên MÁY THẦY. Thiếu thì để trống/0, không đoán. */
export function taoCauGiao(dsDe: TeacherExamSource[]): CauGiao[] {
  const kq: CauGiao[] = []
  for (const de of dsDe) {
    for (const [phan, ds] of [['I', de.phanI], ['II', de.phanII], ['III', de.phanIII]] as [PhanCau, CauTrongDe[]][]) {
      for (const q of ds ?? []) {
        kq.push({
          qid: qidCuaCau(de.maDe, q),
          dang: q.dang?.ma ?? null,
          chuyenDe: q.chuyenDe ?? '',
          mucDo: mucSo(q.mucDo),
          sao: (q.canChua?.sao ?? 0) as Sao,
          phan,
        })
      }
    }
  }
  return kq
}

// ─────────────────────────────── XEM TRƯỚC PHÂN BỔ ───────────────────────────────
// Hợp đồng `docs/hop-dong-btvn-nang-do-2109.md` mục 5 (Code 3): `POST /btvn/xem-truoc`, thầy, CHỈ ĐỌC, ≤ 50 em mỗi lượt.

/** Số em tối đa mỗi lượt gọi `/btvn/xem-truoc`. */
export const EM_MOI_LUOT = 50

/** Hạt giống của MỘT hộp thoại giao: sinh MỘT lần, dùng chung cho `/btvn/xem-truoc` và `/btvn/giao` để bộ xem trước khớp bộ thật (≤ 40 ký tự). */
export function taoHatGiong(): string {
  const ngauNhien = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID().replace(/-/g, '').slice(0, 12) : Math.floor(Math.random() * 1e12).toString(36)
  return `g${Date.now().toString(36)}${ngauNhien}`.slice(0, 40)
}

export interface EmXemTruoc {
  sbd: string
  hoTen: string
  /** Em đã mở bài và bộ đã CHỐT (chỉ có ở chế độ sau giao). */
  daChot: boolean
  /** `false` = em chưa có hồ sơ (chặng 1 kiêm chẩn đoán). */
  coHoSo: boolean
  tomTat: TomTatBo
}

/** Danh sách câu của MỘT em (chỉ có cho `sbdChiTiet`). */
export interface ChiTietEmXemTruoc {
  sbd: string
  chang: string[][]
  nhan: Record<string, NhanCau>
}

export interface KetQuaXemTruoc {
  hatGiong: string
  soCauBai: number
  soLoi: number
  /** Lõi chung (qid) — giống nhau ở mọi em. */
  loi: string[]
  ds: EmXemTruoc[]
  chiTiet: ChiTietEmXemTruoc | null
}

export interface DauVaoXemTruoc {
  /** ≤ 50 em mỗi lượt (`EM_MOI_LUOT`). */
  dsSbd: string[]
  dsMaDe: string[]
  cau: CauGiao[]
  ghim: string[]
  /** ISO — hạn nộp thầy đặt (để trống thì màn dùng mặc định 48 giờ như lúc giao). */
  hanNop: string
  hatGiong: string
  sbdChiTiet?: string
}

const HAN_GIAY = 20

/** Lệnh thầy CHỈ ĐỌC `/btvn/xem-truoc` (không ghi gì). Máy chủ chưa có lệnh (404), mất mạng, quá hạn hay từ chối ⇒ NÉM lỗi bằng lời — màn hiện đúng câu ấy. */
export async function xemTruocPhanBo(v: DauVaoXemTruoc): Promise<KetQuaXemTruoc> {
  const [ch, mat] = await Promise.all([layCauHinhMayChu(), loadTeacherSecret()])
  if (!ch.URL) throw new Error('Chưa kết nối được máy chủ.')
  const dk = new AbortController()
  const hen = setTimeout(() => dk.abort(), HAN_GIAY * 1000)
  let res: Response
  try {
    res = await fetch(`${ch.URL}/btvn/xem-truoc`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-ma-bi-mat': mat || '' },
      body: JSON.stringify({ dsSbd: v.dsSbd.slice(0, EM_MOI_LUOT), dsMaDe: v.dsMaDe, cau: v.cau, ghim: v.ghim, hanNop: v.hanNop, hatGiong: v.hatGiong, ...(v.sbdChiTiet ? { sbdChiTiet: v.sbdChiTiet } : {}) }),
      signal: dk.signal,
    })
  } catch (e) {
    if ((e as { name?: string })?.name === 'AbortError') throw new Error('Máy chủ trả lời chậm — chưa xem trước được. Thử lại sau ít phút.')
    throw new Error('Không nối được máy chủ — chưa xem trước được.')
  } finally {
    clearTimeout(hen)
  }
  if (res.status === 404) throw new Error('Máy chủ chưa có lệnh Xem trước phân bổ — chưa có số nào để hiện.')
  let j: Record<string, unknown> = {}
  try {
    j = (await res.json()) as Record<string, unknown>
  } catch {
    throw new Error('Máy chủ trả lời không đọc được — chưa xem trước được.')
  }
  if (!res.ok || j.ok !== true) throw new Error(String(j.error || j.loi || 'Máy chủ không cho xem trước.'))
  const ds = Array.isArray(j.ds) ? (j.ds as Record<string, unknown>[]) : []
  const ct = j.chiTiet as Record<string, unknown> | undefined
  return {
    hatGiong: String(j.hatGiong ?? v.hatGiong),
    soCauBai: Number(j.soCauBai) || v.cau.length,
    soLoi: Number(j.soLoi) || 0,
    loi: Array.isArray(j.loi) ? (j.loi as unknown[]).map(String) : [],
    ds: ds.map((x) => ({ sbd: String(x.sbd ?? ''), hoTen: String(x.hoTen ?? ''), daChot: x.daChot === true, coHoSo: x.coHoSo !== false, tomTat: x.tomTat as TomTatBo })).filter((x) => x.sbd && x.tomTat),
    chiTiet: ct && Array.isArray(ct.chang) ? { sbd: String(ct.sbd ?? ''), chang: (ct.chang as unknown[][]).map((c) => (Array.isArray(c) ? c.map(String) : [])), nhan: (ct.nhan ?? {}) as Record<string, NhanCau> } : null,
  }
}

// ─────────────────────────────── NHÃN CHO THẦY ───────────────────────────────

/** Nhãn + lý do của một câu trong bộ của em, đúng chữ bản vẽ (Code 2 dùng cùng bộ chữ cho em). Chỉ mô tả CÂU, không đánh giá em. */
export function nhanCuaCau(n: NhanCau | undefined): { chu: string; ly: string; loai: 'khoi_dong' | 'loi' | 'rieng' | 'thu_thach' } {
  switch (n) {
    case 'khoi_dong':
      return { chu: 'Khởi động', ly: 'câu mở đầu chặng', loai: 'khoi_dong' }
    case 'loi':
      return { chu: 'Cốt lõi', ly: 'câu cả lớp cùng làm', loai: 'loi' }
    case 'dang_yeu':
      return { chu: 'Dành riêng cho em', ly: 'dạng em đang yếu · đúng bậc của em', loai: 'rieng' }
    case 'cung_co':
      return { chu: 'Dành riêng cho em', ly: 'củng cố dạng em đang ổn', loai: 'rieng' }
    case 'thu_thach':
      return { chu: 'Thử thách · sai không sao', ly: '+1 bậc, chỉ ở dạng em đang ổn', loai: 'thu_thach' }
    case 'loi_cao':
      return { chu: 'Cốt lõi · câu thưởng', ly: 'câu cả lớp cùng làm, cao hơn bậc của em — sai không tính điểm', loai: 'thu_thach' }
    default:
      return { chu: 'Câu', ly: '', loai: 'loi' }
  }
}
