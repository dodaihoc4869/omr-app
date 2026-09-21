// BỘ NÃO A.I — TẦNG ĐỌC (chế độ THẬT). Code 3. Đặc tả: docs/hop-dong-bo-nao-2109.md + prompt-bo-nao.md (CẬP NHẬT 2, 3).
//
// Chỉ ĐỌC `ai_dieu_chinh` (Code 1 ghi qua `bo-nao.ts`) và chỉ khi chế độ HIỆU LỰC của lớp em là `that`:
//   · điều chỉnh (nhịp, khởi động, núm dạng, khắc phục) → kế hoạch ngày + BTVN nâng đỡ, CHỈ khi `ap_dung = 1`, `huy = 0`, còn hạn (`het_han ≥ hôm nay`);
//   · lời nhắn cho em (`loiNhanHlv`) và cho phụ huynh / thư tuần (`boNaoAi`).
// CHẠY THỬ (`bong`) ⇒ KHÔNG trả gì, KHÔNG tầng nào đổi một byte (test khoá). Công tắc `cau_hinh.bo_nao`: `bat = false` hoặc chuyển về `bong` ⇒ DỪNG NGAY (mọi
// điều chỉnh đang còn hạn thôi có hiệu lực — thầy có nút tắt tức thì). KHÔNG BAO GIỜ đổi `han_nop`; lỗi đọc (bảng chưa có…) ⇒ coi như không có điều chỉnh.
import type { Env } from './kieu'
import { dieuChinhTuDauRa } from '../../src/lib/bo-nao-khuon'
import type { DauRaEm, KhacPhucEm } from '../../src/lib/bo-nao-khuon'
import type { DieuChinhEm } from '../../src/lib/btvn-nang-do'
import { cheDoHieuLuc, docCauHinhBoNao, khongPhaiHangChieu, type CauHinhBoNao } from './bo-nao'
import { themNgay } from './ho-so-nam-kt'
import { coChuGame } from './chu-game'

type Hang = Record<string, unknown>

const chuoi = (v: unknown): string => (v === null || v === undefined ? '' : String(v))
const json = (v: unknown): string => JSON.stringify(v)
const doc = <T>(v: unknown, dpr: T): T => {
  try {
    const o = JSON.parse(chuoi(v)) as unknown
    return o && typeof o === 'object' ? (o as T) : dpr
  } catch {
    return dpr
  }
}

/** Lời nhắn cho HS chỉ hiện nếu mới ≤ bấy nhiêu ngày (lời kiểm khuôn chỉ nhắc con số của thẻ ngày ấy — cũ quá thì sai). */
export const TUOI_LOI_NHAN_TOI_DA_NGAY = 1
export const SO_LOI_GAN_DAY = 7
/** Thư tuần cho phụ huynh còn hiện trong bấy nhiêu ngày kể từ ngày viết. */
export const TUOI_THU_TUAN_NGAY = 7
export const TUOI_LOI_PH_NGAY = 2

/** Điều chỉnh CÓ HIỆU LỰC của một em (ap_dung = 1, chưa huỷ, còn hạn, chế độ hiệu lực `that`). */
export interface DieuChinhHieuLuc {
  ngay: string
  hetHan: string
  doTin: number
  /** Dạng cổng `dieuChinh` của lõi BTVN (nhịp, khởi động, núm dạng, khắc phục) — đã qua `dieuChinhTuDauRa`. */
  dieuChinh: DieuChinhEm
  /** Các dạng `on_som` (kế hoạch ngày kéo `moc_on_ke` của câu vừa sai về ngày mai). */
  onSom: string[]
  nhip: number
}

/** Cấu hình rút gọn: `null` khi tầng đọc phải im (tắt, hoặc không lớp nào ở chế độ thật). Một truy vấn. */
export async function docCauHinhTangDoc(env: Env): Promise<CauHinhBoNao | null> {
  try {
    const ch = await docCauHinhBoNao(env)
    if (!ch.bat) return null
    if (ch.cheDo !== 'that' && ch.lopThat.length === 0) return null
    return ch
  } catch {
    return null
  }
}

/**
 * Điều chỉnh có hiệu lực của các em ở ngày `homNay` (mới nhất mỗi em). `ch` truyền vào để nhiều nơi cùng dùng MỘT lần đọc cấu hình.
 * Chế độ hiệu lực theo LỚP: đọc `lop` ghi cùng thẻ (`ai_ho_so_ngay.lop`) — không thêm truy vấn.
 */
export async function docDieuChinhHieuLuc(env: Env, dsSbd: string[], homNay: string, ch?: CauHinhBoNao | null): Promise<Map<string, DieuChinhHieuLuc>> {
  const ra = new Map<string, DieuChinhHieuLuc>()
  const cauHinh = ch === undefined ? await docCauHinhTangDoc(env) : ch
  if (!cauHinh || dsSbd.length === 0) return ra
  let r: { results?: Hang[] }
  try {
    r = await env.DB.prepare(
      `SELECT d.sbd, d.ngay, d.json, d.do_tin, d.het_han, COALESCE(h.lop, '') AS lop
         FROM ai_dieu_chinh d LEFT JOIN ai_ho_so_ngay h ON h.sbd = d.sbd AND h.ngay = d.ngay
        WHERE d.sbd IN (SELECT value FROM json_each(?)) AND d.ap_dung = 1 AND d.huy = 0 AND d.tu_go = 0 AND d.het_han >= ? AND d.ngay <= ? AND ${khongPhaiHangChieu('d.json')}
        ORDER BY d.ngay DESC`,
    ).bind(json(dsSbd), homNay, homNay).all<Hang>()
  } catch {
    return ra
  }
  for (const x of r.results ?? []) {
    const sbd = chuoi(x.sbd)
    if (ra.has(sbd)) continue // hàng đầu = mới nhất
    if (cheDoHieuLuc(cauHinh, chuoi(x.lop)) !== 'that') continue
    const dauRa = doc<Partial<DauRaEm>>(x.json, {})
    const nhip = { lech: Number(dauRa.nhip?.lech) || 0, khoiDong: Number(dauRa.nhip?.khoiDong) || 2 }
    const khacPhuc = (Array.isArray(dauRa.khacPhuc) ? dauRa.khacPhuc : []) as KhacPhucEm[]
    const dieuChinh = dieuChinhTuDauRa({ nhip, dang: Array.isArray(dauRa.dang) ? dauRa.dang : [], khacPhuc })
    ra.set(sbd, {
      ngay: chuoi(x.ngay),
      hetHan: chuoi(x.het_han),
      doTin: Number(x.do_tin) || 0,
      dieuChinh,
      onSom: khacPhuc.filter((k) => k.kieu === 'on_som').map((k) => k.dang),
      nhip: nhip.lech,
    })
  }
  return ra
}

interface LoiNhanHang {
  ngay: string
  loiEm: string
  loiPh: string
  thuTuan: string
}

/** Các dòng lời nhắn còn dùng được của MỘT em (`che_do = 'that'` lúc nộp — lời của những đêm chạy thử KHÔNG BAO GIỜ ra; chưa huỷ), mới nhất trước. */
async function docLoiNhanCuaEm(env: Env, sbd: string, homNay: string, soNgay: number, ch?: CauHinhBoNao | null): Promise<LoiNhanHang[]> {
  const cauHinh = ch === undefined ? await docCauHinhTangDoc(env) : ch
  if (!cauHinh) return []
  let r: { results?: Hang[] }
  try {
    r = await env.DB.prepare(
      `SELECT d.ngay, d.json, COALESCE(h.lop, '') AS lop
         FROM ai_dieu_chinh d LEFT JOIN ai_ho_so_ngay h ON h.sbd = d.sbd AND h.ngay = d.ngay
        WHERE d.sbd = ? AND d.che_do = 'that' AND d.huy = 0 AND d.ngay <= ? AND d.ngay >= ? AND ${khongPhaiHangChieu('d.json')} ORDER BY d.ngay DESC LIMIT ?`,
    ).bind(sbd, homNay, themNgay(homNay, -(soNgay - 1)), soNgay).all<Hang>()
  } catch {
    return []
  }
  const ra: LoiNhanHang[] = []
  for (const x of r.results ?? []) {
    if (cheDoHieuLuc(cauHinh, chuoi(x.lop)) !== 'that') continue
    const d = doc<Partial<DauRaEm>>(x.json, {})
    // Lời cho PHỤ HUYNH và thư tuần KHÔNG được nhắc thần thú / EXP / khiên / game (thầy lệnh 21/09): lớp phòng thủ ở máy chủ, lời vi phạm coi như vắng (lời cho EM giữ nguyên).
    const loiPh = chuoi(d.loiNhanChoPhuHuynh).trim()
    const thuTuan = chuoi(d.thuTuan).trim()
    ra.push({ ngay: chuoi(x.ngay), loiEm: chuoi(d.loiNhanChoEm).trim(), loiPh: coChuGame(loiPh) ? '' : loiPh, thuTuan: coChuGame(thuTuan) ? '' : thuTuan })
  }
  return ra
}

/**
 * `loiNhanHlv` của `/hs/ke-hoach-ngay`: `{ngay, loi, gan:[{ngay, loi}]}` (gan ≤ 7, mới nhất trước, gồm cả hôm nay). `null` ⇒ KHÔNG đính khoá nào vào phản hồi
 * (chạy thử / tắt / không có lời / lời mới nhất đã cũ hơn `TUOI_LOI_NHAN_TOI_DA_NGAY` ngày). CHỈ lời cho em — không bao giờ lời phụ huynh hay thư tuần.
 */
export async function docLoiNhanHlv(env: Env, sbd: string, homNay: string, ch?: CauHinhBoNao | null): Promise<{ ngay: string; loi: string; gan: { ngay: string; loi: string }[] } | null> {
  const hang = (await docLoiNhanCuaEm(env, sbd, homNay, SO_LOI_GAN_DAY, ch)).filter((h) => h.loiEm)
  const moi = hang[0]
  if (!moi || moi.ngay < themNgay(homNay, -TUOI_LOI_NHAN_TOI_DA_NGAY)) return null
  return { ngay: moi.ngay, loi: moi.loiEm, gan: hang.map((h) => ({ ngay: h.ngay, loi: h.loiEm })) }
}

/**
 * `boNaoAi` của `/ph/ke-hoach`: `{ngay, loiNhan, thuTuan, tuanTu?}` cho ĐÚNG con của phụ huynh (SBD lấy từ token PH ở chỗ gọi). `null` ⇒ không đính khoá nào.
 * `loiNhan` = lời phụ huynh mới nhất trong `TUOI_LOI_PH_NGAY` ngày; `thuTuan` = thư tuần mới nhất trong `TUOI_THU_TUAN_NGAY` ngày (`tuanTu` = ngày viết).
 */
export async function docBoNaoAiChoPhuHuynh(env: Env, sbd: string, homNay: string, ch?: CauHinhBoNao | null): Promise<{ ngay: string; loiNhan: string; thuTuan: string; tuanTu?: string } | null> {
  const hang = await docLoiNhanCuaEm(env, sbd, homNay, TUOI_THU_TUAN_NGAY, ch)
  const loi = hang.find((h) => h.loiPh && h.ngay >= themNgay(homNay, -TUOI_LOI_PH_NGAY + 1))
  const thu = hang.find((h) => h.thuTuan)
  if (!loi && !thu) return null
  return { ngay: loi?.ngay ?? thu!.ngay, loiNhan: loi?.loiPh ?? '', thuTuan: thu?.thuTuan ?? '', ...(thu ? { tuanTu: thu.ngay } : {}) }
}
