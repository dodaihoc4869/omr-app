// CHẤM BÙ Ở MÁY CHỦ — lượt ĐÃ NỘP mà CHƯA CÓ ĐIỂM (thầy 30/10 tối: «nay có 5 bạn không chấm được bài»).
//
// ĐO THẬT (workflow chỉ-đọc do-cham-bai-3010.yml, ca 269333 30/10): 32 lượt đã nộp, 5 lượt `tong` NULL. Cả 5 là lượt CÒN `dang_lam` lúc thầy bấm
// Khoá ca (19:20:11 VN, 2 phút sau giờ hết — máy em nộp tự động lúc hết giờ hỏng vì D1 nghẽn 19:00–22:20) ⇒ `khoaCa` nộp hộ bằng bản lưu tạm
// rồi KHÔNG chấm. Lõi chấm máy chủ chấm được (thử trong bộ nhớ: 26/26 lượt đã có điểm khớp đúng điểm D1; 4/5 lượt thiếu điểm chấm được bằng
// đáp án có sẵn của ca). Không ai ghi điểm vì MỌI đường ghi điểm của ca thi đều là lệnh MÁY KHÁCH bắn-một-lần:
//   · máy em: `sendFeedback` (một lần, `.catch(() => {})`) — mà máy em đang mất sóng / đã tắt app thì không bao giờ gửi;
//   · máy thầy: màn Theo dõi tự `ghiDiem` khi thấy lượt chấm được — lỗi thì «lần tải sau ghi lại», nhưng ca đã khoá + không còn em đang làm
//     ⇒ màn KHÔNG tải lại nữa ⇒ không có «lần sau»;
//   · đường đọc chậm (`danhGiaLuot`) ghi `chi_tiet_cau` nhưng không ghi `luot.tong` (4/5 lượt có 28 dòng chi tiết mà không có điểm).
// Tệp này là LƯỚI AN TOÀN phía máy chủ: cron mỗi phút tìm lượt đã nộp ≥ 2 phút mà chưa có điểm (trong 3 giờ gần nhất), chấm bằng ĐÚNG lõi
// `chamLaiMotCa` và ghi qua ĐÚNG đường ghi `chamDiem` (một đường ghi duy nhất cho ca thi). Không đụng lượt đã có điểm.
//
// TẢI D1: lúc không có việc (gần như mọi phút) chỉ MỘT câu đọc nhỏ (bảng `ca` vài trăm dòng + chỉ mục `idx_luot_ca`). Có việc ⇒ ≤ 2 ca/phút.
// Em không chấm được (bộ câu lệch bài làm, tờ đáp án thiếu câu) ⇒ KHÔNG ghi gì (giữ trống như cũ), hẹn thử lại sau 30 phút trong isolate.
import type { Env } from './kieu'
import { chamLaiMotCa, docNguonChamLai, type GoiGhiDiem, type LuotChoCham } from './cham-lai-ca'

/** Lượt nộp chưa đủ 2 phút: để đường máy em / máy thầy ghi trước (tránh hai bên cùng ghi một lượt). */
export const PHUT_CHO_CHAM_BU = 2
/** Chỉ bù lượt nộp trong 3 giờ gần nhất — lưới an toàn cho sự cố đang diễn ra, KHÔNG phải công cụ chấm lại ca cũ (ca cũ: `/ca/cham-bu` của thầy). */
export const GIO_CUA_SO_CHAM_BU = 3
/** Tối đa ca mỗi lượt cron (mỗi ca: đọc ca + tờ đáp án R2 + lượt của ca, rồi một lượt ghi). */
export const TOI_DA_CA_MOT_LUOT = 2
/** Em không chấm được ⇒ hẹn lại sau từng ấy phút (trong isolate). Lỗi đọc / ghi (D1 nghẽn) ⇒ hẹn lại sau 3 phút. */
const PHUT_HEN_TU_CHOI = 30
const PHUT_HEN_LOI = 3

/** Đường ghi điểm của ca thi (`chamDiem` trong index.ts) — truyền vào để tệp này không vòng import index.ts. */
export type GhiDiemCa = (env: Env, b: { maCa: string; bai: GoiGhiDiem[] }) => Promise<Response>

export interface KetQuaChamBuCa {
  ok: boolean
  maCa: string
  lyDo?: string
  error?: string
  xemTruoc: boolean
  /** Số lượt đã nộp, có bài, chưa có điểm được xét. */
  soCan: number
  /** Lượt chấm được (thầy xem trước: điểm sẽ ghi). */
  bai: { sbd: string; lanThu: number; diem: GoiGhiDiem['diem'] }[]
  tuChoi: { sbd: string; viSao: string }[]
  /** Số lượt đã ghi (0 khi xem trước). */
  soGhi: number
}

/**
 * Chấm bù MỘT ca: chỉ lượt MỚI NHẤT của mỗi em, đã nộp / bị khoá, có bài làm, CHƯA có điểm (`tong` NULL). `chi` (tuỳ chọn) bó về đúng các
 * lượt `${sbd}|${lanThu}` cron đã chọn (lượt nộp đủ lâu). `xemTruoc` ⇒ chấm nhưng KHÔNG ghi gì.
 * Đọc nguyên liệu bằng `docNguonChamLai` (bỏ cổng "ca đã xong": chấm từng lượt đã nộp giữa giờ là việc `sendFeedback` vẫn làm).
 */
export async function chamBuCa(env: Env, maCa: string, ghi: GhiDiemCa, tuyChon: { xemTruoc?: boolean; chi?: ReadonlySet<string> } = {}): Promise<KetQuaChamBuCa> {
  const xemTruoc = tuyChon.xemTruoc === true
  const rong = { maCa, xemTruoc, soCan: 0, bai: [], tuChoi: [], soGhi: 0 }
  const n = await docNguonChamLai(env, maCa, { boQuaCongCaDaXong: true })
  if (n.ok !== true) return { ok: false, ...rong, lyDo: n.lyDo, error: n.error }
  const moiNhat = new Map<string, LuotChoCham>()
  for (const l of n.dsLuot) {
    const c = moiNhat.get(l.sbd)
    if (!c || l.lanThu > c.lanThu) moiNhat.set(l.sbd, l)
  }
  const can = [...moiNhat.values()].filter(
    (l) => (l.trangThai === 'da_nop' || l.trangThai === 'khoa') && !!l.dapAn && l.diem.tong === null && (!tuyChon.chi || tuyChon.chi.has(`${l.sbd}|${l.lanThu}`)),
  )
  if (can.length === 0) return { ok: true, ...rong }
  const kq = chamLaiMotCa(maCa, String(n.ca.ten_ca ?? ''), n.nh, can, n.soCauCa, n.boD1)
  const bai = kq.bai.map((x) => ({ sbd: x.sbd, lanThu: x.lanThu, diem: x.diem }))
  if (xemTruoc || kq.bai.length === 0) return { ok: true, maCa, xemTruoc, soCan: can.length, bai, tuChoi: kq.tuChoi, soGhi: 0 }
  const r = (await (await ghi(env, { maCa, bai: kq.bai })).json()) as { ok?: boolean; error?: string }
  if (r?.ok === false) return { ok: false, maCa, xemTruoc, soCan: can.length, bai, tuChoi: kq.tuChoi, soGhi: 0, lyDo: 'ghi_loi', error: String(r.error ?? 'Không ghi được điểm') }
  return { ok: true, maCa, xemTruoc, soCan: can.length, bai, tuChoi: kq.tuChoi, soGhi: kq.bai.length }
}

/** Hẹn thử lại theo lượt (`maCa|sbd|lan`) — trong isolate. Xuất cho test. */
const henLai = new Map<string, number>()
export function xoaHenChamBu(): void {
  henLai.clear()
}

/**
 * CRON mỗi phút: lượt đã nộp ≥ 2 phút, trong 3 giờ gần nhất, chưa có điểm ⇒ chấm bù (≤ 2 ca mỗi lượt). Trả số đếm để ghi nhật ký (không SBD).
 * Câu đọc: bảng `ca` lọc ca còn mở hoặc vừa đổi trong 12 giờ (ca thi dài nhất vài giờ), rồi `luot` theo chỉ mục `idx_luot_ca`.
 */
export async function cronChamBu(env: Env, nowMs: number, ghi: GhiDiemCa): Promise<{ soLuot: number; soCa: number; soGhi: number; soTuChoi: number; loi: number }> {
  const ra = { soLuot: 0, soCa: 0, soGhi: 0, soTuChoi: 0, loi: 0 }
  const tu = new Date(nowMs - GIO_CUA_SO_CHAM_BU * 3_600_000).toISOString()
  const den = new Date(nowMs - PHUT_CHO_CHAM_BU * 60_000).toISOString()
  const caTu = new Date(nowMs - 12 * 3_600_000).toISOString()
  const r = await env.DB.prepare(
    `SELECT l.ma_ca, l.sbd, l.lan_thu
       FROM ca c JOIN luot l ON l.ma_ca = c.ma_ca
      WHERE (c.trang_thai = 'mo' OR c.cap_nhat_luc >= ?) AND c.trang_thai <> 'da_xoa' AND c.ma_ca <> 'DOTAI'
        AND l.trang_thai IN ('da_nop', 'khoa') AND l.tong IS NULL
        AND l.nop_luc >= ? AND l.nop_luc <= ?
        AND l.dap_an_json IS NOT NULL AND l.dap_an_json NOT IN ('', '{}')
      ORDER BY l.nop_luc LIMIT 200`,
  ).bind(caTu, tu, den).all<{ ma_ca: string; sbd: string; lan_thu: number }>()
  const theoCa = new Map<string, Set<string>>()
  for (const x of r.results ?? []) {
    const k = `${x.ma_ca}|${x.sbd}|${Number(x.lan_thu) || 1}`
    if ((henLai.get(k) ?? 0) > nowMs) continue
    const s = theoCa.get(x.ma_ca) ?? new Set<string>()
    s.add(`${x.sbd}|${Number(x.lan_thu) || 1}`)
    theoCa.set(x.ma_ca, s)
    ra.soLuot++
  }
  for (const [maCa, chi] of [...theoCa].slice(0, TOI_DA_CA_MOT_LUOT)) {
    ra.soCa++
    const hen = (phut: number, ds: Iterable<string>) => { for (const x of ds) henLai.set(`${maCa}|${x}`, nowMs + phut * 60_000) }
    try {
      const kq = await chamBuCa(env, maCa, ghi, { chi })
      ra.soGhi += kq.soGhi
      ra.soTuChoi += kq.tuChoi.length
      if (!kq.ok) { ra.loi++; hen(kq.lyDo === 'ghi_loi' ? PHUT_HEN_LOI : PHUT_HEN_TU_CHOI, chi) }
      else {
        const daTuChoi = new Set(kq.tuChoi.map((t) => t.sbd))
        hen(PHUT_HEN_TU_CHOI, [...chi].filter((x) => daTuChoi.has(x.split('|')[0]!)))
      }
    } catch (e) {
      ra.loi++
      hen(PHUT_HEN_LOI, chi)
      console.error('[cham-bu] lỗi ca', maCa, e instanceof Error ? e.message : e)
    }
  }
  return ra
}
