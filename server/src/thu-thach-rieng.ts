// THỬ THÁCH RIÊNG HÔM NAY (Bộ não A.I Nấc 1 · V1 + V2 — thầy chốt 21/09 11:31; hợp đồng docs/hop-dong-thu-thach-rieng-2109.md; Code 3).
// Bộ não chỉ chọn DẠNG + SỐ CÂU + BẬC và viết `loiMoi`; MÁY CHỦ chọn và CHỐT câu (một lần/ngày): cùng dạng · KHÔNG tự luận · KHÔNG thuộc đề thi đang bảo vệ · đúng bậc, không vượt bậc + 1 ·
// chưa làm trong 14 ngày · không nằm trong bộ câu bài tập về nhà đang chạy của em. KHÔNG bắt buộc, không hạn, không tính vào bài tập về nhà; KHÔNG gửi đáp án trước khi nộp.
// Chấm + ghi sổ + EXP đi ĐƯỜNG CÓ SẴN của ôn lại (`chamVaGhiTraLoi`, nguồn sổ `thu_thach_rieng`); câu sai vào lịch ôn như mọi câu. Không thêm loại thưởng mới.
//   · `docThanThuSoThat`  SỐ THẬT thần thú (tên loài, cấp, EXP còn thiếu, mảnh khiên/12, chuỗi ngày) — dùng cho thẻ `/ai/ho-so-ngay` (ẩn danh) và cho thẻ của em.
//   · `chonCauThuThach`   hàm THUẦN xếp câu (tất định theo sbd|ngày, không Math.random).
//   · `hsThuThachHomNay` / `hsThuThachNop`  hai lệnh của máy em.
import type { Env } from './kieu'
import { gameIdentity } from './game-v2-auth'
import { protectedQuestions } from './game-v2-bank'
import { jsonLaTuLuan } from './cam-tu-luan'
import { cauCongKhai, khongBiBaoVe, layCauChoEm } from './cau-theo-qid'
import { CAN_DANG_NHAP, chamVaGhiTraLoi } from './on-lai-nop'
import { SO_CAU_DU_TIN } from './ho-so-cau-hinh'
import { MANH_MOI_KHIEN } from './exp-cau-hinh'
import { demChuoiDat } from './ke-hoach-ngay'
import { themNgay } from './ho-so-nam-kt'
import { ngayVn } from './su-kien-hoc'
import { tenCuaCacDang } from './ten-dang-bo-nao'
import { thanhExp } from '../../src/game/than-thu-hoa-hoc/kinh-nghiem'
import { PETS } from '../../src/game/than-thu-v2/core'
import { mucTuChu } from '../../src/lib/btvn-nang-do'

type Dong = Record<string, unknown>
const chuoi = (v: unknown): string => (v === null || v === undefined ? '' : String(v)).trim()
const so = (v: unknown): number => Number(v) || 0
const json = (v: unknown): string => JSON.stringify(v)

export const NGUON_THU_THACH = 'thu_thach_rieng'
export const SO_NGAY_CHUA_LAM = 14
export const SO_CAU_TOI_THIEU = 3
export const SO_CAU_TOI_DA = 8
export const SO_DANG_TOI_DA = 2
export const LOI_MOI_TOI_DA = 200
export const BAC_THU_THACH = ['dung_bac', 'thap_hon_mot_bac', 'cao_hon_mot_bac'] as const
export type BacThuThach = (typeof BAC_THU_THACH)[number]
export const maNguonThuThach = (ngay: string): string => `thu_thach:${ngay}`
export const LY_DO_THIEU_CAU = 'Dạng này còn ít câu em chưa làm gần đây.'

export interface ThuThachBoNao {
  dang: string[]
  soCau: number
  bac: BacThuThach
}

/** Đọc `thuThach` + `loiMoi` từ JSON điều chỉnh đã lưu — KIỂM LẠI chặt (Code 1 đã kiểm khuôn lúc nộp; ở đây chỉ nhận cái đúng dạng). Sai ⇒ null. */
export function docThuThachTuDieuChinh(v: unknown): { thuThach: ThuThachBoNao; loiMoi: string } | null {
  let o: unknown = v
  if (typeof v === 'string') {
    try { o = JSON.parse(v) } catch { return null }
  }
  if (!o || typeof o !== 'object' || Array.isArray(o)) return null
  const d = o as Dong
  const t = d.thuThach
  if (!t || typeof t !== 'object' || Array.isArray(t)) return null
  const x = t as Dong
  const dang = Array.isArray(x.dang) ? [...new Set(x.dang.map(chuoi).filter(Boolean))] : []
  const soCau = typeof x.soCau === 'number' ? x.soCau : NaN
  const bac = chuoi(x.bac) as BacThuThach
  const loiMoi = typeof d.loiMoi === 'string' ? d.loiMoi.replace(/\s+/g, ' ').trim() : ''
  if (dang.length < 1 || dang.length > SO_DANG_TOI_DA || !Number.isInteger(soCau) || soCau < SO_CAU_TOI_THIEU || soCau > SO_CAU_TOI_DA || !BAC_THU_THACH.includes(bac)) return null
  if (!loiMoi || [...loiMoi].length > LOI_MOI_TOI_DA) return null
  return { thuThach: { dang, soCau, bac }, loiMoi }
}

/** Mức (0 biết · 1 hiểu · 2 vận dụng) câu sẽ nhắm: bậc đích của em ± 1 theo `bac`, KHÔNG BAO GIỜ quá bậc đích + 1 và không dưới 0. */
export function mucNham(bacDich: number, bac: BacThuThach): 0 | 1 | 2 {
  const b = Math.max(0, Math.min(2, Math.round(bacDich)))
  return (bac === 'dung_bac' ? b : bac === 'thap_hon_mot_bac' ? Math.max(0, b - 1) : Math.min(2, b + 1)) as 0 | 1 | 2
}

const bamChuoi = (s: string): number => {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 0x01000193) >>> 0
  return h
}

export interface UngVien {
  qid: string
  dang: string
  muc: 0 | 1 | 2
}

/**
 * XẾP CÂU (THUẦN, tất định): mỗi dạng nhận phần chia đều (dạng đầu nhận phần dư); trong dạng ưu tiên câu ĐÚNG mức nhắm, thiếu thì lấy mức thấp hơn liền kề (không bao giờ CAO hơn mức nhắm);
 * thứ tự trong cùng mức xáo tất định theo `<sbd>|<ngày>|<qid>`. Dạng thiếu câu thì phần thiếu nhường dạng còn lại (nếu có). Kết quả xen kẽ giữa các dạng.
 */
export function chonCauThuThach(p: { sbd: string; ngay: string; dang: string[]; soCau: number; mucNhamTheoDang: ReadonlyMap<string, number>; ungVien: readonly UngVien[]; loaiTru: ReadonlySet<string> }): { qid: string[]; thieu: number } {
  const xepHang = (d: string): string[] => {
    const nham = p.mucNhamTheoDang.get(d) ?? 0
    const cua = p.ungVien.filter((u) => u.dang === d && u.muc <= nham && !p.loaiTru.has(u.qid))
    return [...cua].sort((a, c) => c.muc - a.muc || bamChuoi(`${p.sbd}|${p.ngay}|${a.qid}`) - bamChuoi(`${p.sbd}|${p.ngay}|${c.qid}`) || (a.qid < c.qid ? -1 : 1)).map((u) => u.qid)
  }
  const hang = new Map(p.dang.map((d) => [d, xepHang(d)] as const))
  const chon = new Map<string, string[]>(p.dang.map((d) => [d, []]))
  const dung = new Set<string>()
  p.dang.forEach((d, i) => {
    const phan = Math.floor(p.soCau / p.dang.length) + (i < p.soCau % p.dang.length ? 1 : 0)
    for (const q of hang.get(d)!) {
      if (chon.get(d)!.length >= phan) break
      if (!dung.has(q)) { chon.get(d)!.push(q); dung.add(q) }
    }
  })
  // nhường phần thiếu cho dạng còn câu
  let tong = [...chon.values()].reduce((s, a) => s + a.length, 0)
  for (const d of p.dang) {
    for (const q of hang.get(d)!) {
      if (tong >= p.soCau) break
      if (!dung.has(q)) { chon.get(d)!.push(q); dung.add(q); tong++ }
    }
  }
  const ra: string[] = []
  for (let k = 0; ra.length < tong; k++) for (const d of p.dang) { const q = chon.get(d)![k]; if (q !== undefined) ra.push(q) }
  return { qid: ra, thieu: Math.max(0, p.soCau - ra.length) }
}

// ================================================================== SỐ THẬT THẦN THÚ ==================================================================

export interface ThanThuSoThat {
  ten: string
  cap: number
  expConThieu: number
  manhKhien: number
  manhKhienTong: number
  chuoiNgay: number
}

/**
 * SỐ THẬT thần thú của các em (2 truy vấn cho cả lô): tên LOÀI thú (không nickname — ẩn danh), cấp, EXP còn thiếu để lên cấp (`thanhExp(cấp) − exp`), mảnh khiên hiện có / 12, chuỗi ngày đạt.
 * Em chưa có hồ sơ game / chưa chọn thú / loài lạ ⇒ VẮNG khỏi bản đồ (không bịa thú mặc định). Không ném lỗi.
 */
export async function docThanThuSoThat(env: Env, dsSbd: string[]): Promise<Map<string, ThanThuSoThat>> {
  const ra = new Map<string, ThanThuSoThat>()
  if (dsSbd.length === 0) return ra
  try {
    const r = await env.DB.prepare(
      `SELECT sbd, json_extract(json, '$.pet') AS pet, json_type(json, '$.pet') AS pet_kieu, json_extract(json, '$.cap') AS cap, json_extract(json, '$.exp') AS exp,
              json_extract(json, '$.choice') AS choice, json_extract(json, '$.khienRen.manh') AS manh
         FROM game_v2_profile WHERE sbd IN (SELECT value FROM json_each(?))`,
    ).bind(json(dsSbd)).all<Dong>()
    const lichSu = new Map<string, { ketQua: 'dat' | 'mot_phan' | 'khong' | null }[]>()
    const coThu = (r.results ?? []).filter((x) => Number(x.choice) !== 1 && x.pet_kieu === 'text')
    if (coThu.length > 0) {
      const homNay = ngayVn(Date.now())
      const kh = await env.DB.prepare('SELECT sbd, ket_qua, la_ngay_nghi FROM ke_hoach_ngay WHERE sbd IN (SELECT value FROM json_each(?)) AND ngay >= ? ORDER BY sbd, ngay DESC')
        .bind(json(coThu.map((x) => chuoi(x.sbd))), themNgay(homNay, -60)).all<Dong>().catch(() => ({ results: [] as Dong[] }))
      for (const x of kh.results ?? []) {
        const k = so(x.la_ngay_nghi) === 1 ? null : (chuoi(x.ket_qua) as 'dat' | 'mot_phan' | 'khong')
        lichSu.set(chuoi(x.sbd), [...(lichSu.get(chuoi(x.sbd)) ?? []), { ketQua: k || null }])
      }
    }
    for (const x of coThu) {
      const ten = PETS.find((p) => p.id === chuoi(x.pet))?.name
      if (!ten) continue
      const cap = Math.max(1, Math.min(120, Math.round(so(x.cap)) || 1))
      const can = thanhExp(cap)
      ra.set(chuoi(x.sbd), {
        ten, cap, expConThieu: can <= 0 ? 0 : Math.max(0, can - Math.max(0, Math.round(so(x.exp)))),
        manhKhien: Math.max(0, Math.round(so(x.manh))) % MANH_MOI_KHIEN, manhKhienTong: MANH_MOI_KHIEN,
        chuoiNgay: demChuoiDat((lichSu.get(chuoi(x.sbd)) ?? []) as never),
      })
    }
  } catch (e) {
    console.error('[thu-thach] đọc số thật thần thú lỗi (bỏ qua):', e instanceof Error ? e.message : e)
  }
  return ra
}

// ================================================================== ÁP THỬ THÁCH CỦA BỘ NÃO ==================================================================

/** Cờ `cau_hinh.bo_nao.thuThach` (mặc định BẬT; chỉ `false` mới tắt). */
export async function docCoThuThach(env: Env): Promise<boolean> {
  try {
    const r = await env.DB.prepare("SELECT gia_tri FROM cau_hinh WHERE khoa = 'bo_nao'").first<{ gia_tri: string }>()
    const o = r?.gia_tri ? (JSON.parse(r.gia_tri) as Dong) : null
    return !(o && typeof o === 'object' && o.thuThach === false)
  } catch {
    return true
  }
}

/** Thử thách Bộ não ĐÃ ÁP cho (em, ngày): điều chỉnh `ap_dung = 1`, chưa huỷ, đúng khuôn, cờ bật. */
export async function docThuThachDaAp(env: Env, sbd: string, ngay: string): Promise<{ thuThach: ThuThachBoNao; loiMoi: string } | null> {
  try {
    const r = await env.DB.prepare('SELECT json FROM ai_dieu_chinh WHERE sbd = ? AND ngay = ? AND ap_dung = 1 AND huy = 0').bind(sbd, ngay).first<{ json: string }>()
    if (!r) return null
    const t = docThuThachTuDieuChinh(r.json)
    if (!t || !(await docCoThuThach(env))) return null
    return t
  } catch {
    return null
  }
}

interface HangThuThach {
  dang: string[]
  bac: BacThuThach
  soCau: number
  soCauMuon: number
  qid: string[]
  loiMoi: string
}

async function docHang(env: Env, sbd: string, ngay: string): Promise<HangThuThach | null> {
  const r = await env.DB.prepare('SELECT dang_json, bac, so_cau, so_cau_muon, qid_json, loi_moi FROM thu_thach_rieng WHERE sbd = ? AND ngay = ?').bind(sbd, ngay).first<Dong>()
  if (!r) return null
  try {
    return {
      dang: JSON.parse(chuoi(r.dang_json)) as string[], bac: chuoi(r.bac) as BacThuThach, soCau: so(r.so_cau), soCauMuon: so(r.so_cau_muon),
      qid: JSON.parse(chuoi(r.qid_json)) as string[], loiMoi: chuoi(r.loi_moi),
    }
  } catch {
    return null
  }
}

/** CHỐT câu cho (em, ngày) — một lần/ngày. `null` = em không có thử thách (chưa áp / tắt / không chọn được câu nào). Lỗi bảng thiếu ⇒ null. */
export async function chotThuThach(env: Env, sbd: string, ngay: string, nowMs: number = Date.now()): Promise<HangThuThach | null> {
  try {
    const da = await docHang(env, sbd, ngay)
    if (da) return da
    const ap = await docThuThachDaAp(env, sbd, ngay)
    if (!ap) return null
    const { thuThach: tt, loiMoi } = ap

    // bậc đích của em ở từng dạng — cùng luật với bộ câu bài tập về nhà (đủ căn cứ ⇒ bậc hồ sơ, chưa đủ ⇒ 0)
    const rBac = await env.DB.prepare('SELECT ma_dang, so_gap, bac FROM nam_kt_dang WHERE sbd = ? AND ma_dang IN (SELECT value FROM json_each(?))').bind(sbd, json(tt.dang)).all<Dong>()
    const bacDich = new Map((rBac.results ?? []).map((x) => [chuoi(x.ma_dang), so(x.so_gap) >= SO_CAU_DU_TIN ? Math.max(0, Math.min(2, so(x.bac))) : 0]))
    const mucNhamTheoDang = new Map(tt.dang.map((d) => [d, mucNham(bacDich.get(d) ?? 0, tt.bac)] as const))

    // câu KHÔNG được chọn: đã làm trong 14 ngày + đang nằm trong bộ câu bài tập về nhà chưa nộp của em
    const tu = themNgay(ngay, -SO_NGAY_CHUA_LAM)
    const rLoai = await env.DB.prepare(
      `SELECT qid FROM su_kien_hoc WHERE sbd = ? AND ngay_vn >= ?
       UNION SELECT qid FROM btvn_em_cau WHERE sbd = ? AND ma_btvn IN (SELECT ma_btvn FROM btvn_em WHERE sbd = ? AND nop_luc IS NULL AND thu_hoi = 0)`,
    ).bind(sbd, tu, sbd, sbd).all<Dong>().catch(() => ({ results: [] as Dong[] }))
    const loaiTru = new Set((rLoai.results ?? []).map((x) => chuoi(x.qid)))

    // ứng viên: cùng chỉ mục "phục vụ được" như /hs/cau-theo-qid (câu còn ở kho, chỉ mục khớp), không tự luận
    const ungVien: UngVien[] = []
    const nhomCua = new Map<string, string>()
    for (const d of tt.dang) {
      const rc = await env.DB.prepare(
        `SELECT q.qid, q.content_group, q.json FROM game_v2_question q JOIN de_kho k ON k.ma_de = q.ma_de JOIN game_v2_index g ON g.ma_de = k.ma_de AND g.source_version = k.cap_nhat_luc
          WHERE COALESCE(k.da_xoa, 0) = 0 AND q.dang = ? LIMIT 600`,
      ).bind(d).all<Dong>()
      for (const x of rc.results ?? []) {
        if (jsonLaTuLuan(x.json)) continue
        let muc: 0 | 1 | 2 = 0
        try { muc = mucTuChu((JSON.parse(chuoi(x.json)) as Dong).mucDo as string) } catch { continue }
        if (!nhomCua.has(chuoi(x.qid))) { nhomCua.set(chuoi(x.qid), chuoi(x.content_group)); ungVien.push({ qid: chuoi(x.qid), dang: d, muc }) }
      }
    }
    let baoVe: Set<string>
    try { baoVe = await protectedQuestions(env) } catch { return null } // không kiểm được đề bảo vệ ⇒ đóng cửa (không phát thử thách)
    const duoc = ungVien.filter((u) => khongBiBaoVe({ qid: u.qid, group: nhomCua.get(u.qid) ?? '' }, baoVe))

    const kq = chonCauThuThach({ sbd, ngay, dang: tt.dang, soCau: tt.soCau, mucNhamTheoDang, ungVien: duoc, loaiTru })
    if (kq.qid.length === 0) return null
    await env.DB.prepare('INSERT OR IGNORE INTO thu_thach_rieng (sbd, ngay, dang_json, bac, so_cau, so_cau_muon, qid_json, loi_moi, tao_luc) VALUES (?,?,?,?,?,?,?,?,?)')
      .bind(sbd, ngay, json(tt.dang), tt.bac, kq.qid.length, tt.soCau, json(kq.qid), loiMoi, new Date(nowMs).toISOString()).run()
    return await docHang(env, sbd, ngay) // thua cuộc đua ⇒ đọc lại đúng hàng đã chốt
  } catch (e) {
    console.error('[thu-thach] chốt câu lỗi (thẻ ẩn):', e instanceof Error ? e.message : e)
    return null
  }
}

// ================================================================== LỆNH CỦA MÁY EM ==================================================================

async function ketQuaDaNop(env: Env, sbd: string, ngay: string, qid: string[]): Promise<Map<string, boolean>> {
  const r = await env.DB.prepare(`SELECT qid, ket_qua FROM su_kien_hoc WHERE sbd = ? AND nguon = ? AND ma_nguon = ? AND lan = 1 AND ket_qua IS NOT NULL AND qid IN (SELECT value FROM json_each(?))`)
    .bind(sbd, NGUON_THU_THACH, maNguonThuThach(ngay), json(qid)).all<Dong>().catch(() => ({ results: [] as Dong[] }))
  return new Map((r.results ?? []).map((x) => [chuoi(x.qid), so(x.ket_qua) === 1]))
}

/** `POST /hs/thu-thach-hom-nay {token|sbd}` — thẻ thử thách + câu công khai (KHÔNG đáp án). Không có thử thách / chưa migration / lỗi ⇒ `{ok:true, co:false}` (app ẩn thẻ). */
export async function hsThuThachHomNay(env: Env, b: Dong, nowMs: number = Date.now()): Promise<Dong> {
  let sbd: string
  try {
    sbd = await gameIdentity(env, b)
  } catch {
    return { ok: false, error: CAN_DANG_NHAP }
  }
  const ngay = ngayVn(nowMs)
  const hang = await chotThuThach(env, sbd, ngay, nowMs)
  if (!hang || hang.qid.length === 0) return { ok: true, co: false }
  const daNopMap = await ketQuaDaNop(env, sbd, ngay, hang.qid)
  const chuaLam = hang.qid.filter((q) => !daNopMap.has(q))
  let cau: Dong[] = []
  if (chuaLam.length > 0) {
    const r = await layCauChoEm(env, sbd, chuaLam, new Set(hang.qid))
    if (r.loi) return { ok: true, co: false }
    const theoQid = new Map(r.cau.map((q) => [q.qid, cauCongKhai(q) as unknown as Dong]))
    cau = chuaLam.flatMap((q) => (theoQid.has(q) ? [theoQid.get(q)!] : []))
    if (cau.length === 0 && daNopMap.size === 0) return { ok: true, co: false } // không phục vụ được câu nào ⇒ không thẻ
  }
  const tenDang = await tenCuaCacDang(env, hang.dang)
  const thanThu = (await docThanThuSoThat(env, [sbd])).get(sbd)
  const soDaLam = daNopMap.size
  return {
    ok: true, co: true, ngay, loiMoi: hang.loiMoi, soCau: hang.qid.length,
    dang: hang.dang.map((ma) => ({ ma, ten: tenDang.get(ma) ?? ma.replace(/^CD:/, '') })), bac: hang.bac,
    trangThai: soDaLam === 0 ? 'chua_lam' : soDaLam >= hang.qid.length ? 'xong' : 'dang_lam', soDaLam,
    ...(thanThu ? { thanThu } : {}), cau, daNop: hang.qid.filter((q) => daNopMap.has(q)).map((q) => ({ qid: q, dung: daNopMap.get(q) === true })),
    ...(hang.soCau < hang.soCauMuon ? { thieu: { soCau: hang.soCauMuon - hang.soCau, lyDo: LY_DO_THIEU_CAU } } : {}),
  }
}

/** `POST /hs/thu-thach-hom-nay/nop {traLoi:[{qid,dapAn,giay?}]}` — CHỈ câu đã chốt hôm nay cho em; trả y hệt `/hs/on-lai/nop` + `trangThai`, `soDaLam`. */
export async function hsThuThachNop(env: Env, b: Dong, nowMs: number = Date.now()): Promise<Dong> {
  const ngay = ngayVn(nowMs)
  const giu: { hang: HangThuThach | null } = { hang: null }
  const r = await chamVaGhiTraLoi(env, b, {
    nguon: NGUON_THU_THACH,
    maNguon: (now) => maNguonThuThach(ngayVn(now)),
    choPhepTheoEm: async (sbd) => {
      giu.hang = await docHang(env, sbd, ngay).catch(() => null)
      return new Set(giu.hang?.qid ?? [])
    },
  })
  if (r.ok !== true || !giu.hang) return r
  const hang: HangThuThach = giu.hang
  try {
    const sbd = await gameIdentity(env, b)
    const daNop = await ketQuaDaNop(env, sbd, ngay, hang.qid)
    return { ...r, trangThai: daNop.size === 0 ? 'chua_lam' : daNop.size >= hang.qid.length ? 'xong' : 'dang_lam', soDaLam: daNop.size }
  } catch {
    return r
  }
}
