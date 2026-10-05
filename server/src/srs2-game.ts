// THUẬT TOÁN 2.0 — NỐI VÀO GAME (Bát Linh Đảo, Đoàn Hộ Tống) + lệnh `hoa2-*` của app học sinh.
// Chỉ chạy khi `cheDo2(env, sbd)` (cờ `cau_hinh.game_hoa_2`); cờ tắt ⇒ game đi đường cũ nguyên vẹn.
// Luật chơi giữ nguyên; chỉ đổi NGUỒN CÂU: Đảo nhận câu mới + câu ôn Đúng–sai, Đoàn nhận câu ôn Trắc nghiệm/Trả lời ngắn,
// đúng kế hoạch ngày đã chốt (`layKeHoachHomNay`). Đảo khoá khi còn câu ôn hôm nay ở Đoàn.
import { phuNeuCan } from './hang-chua-loi'
import { apLamLaiKhac, batDauLamLaiKhac, napLaiLuotCho, type BoiCanhLamLai, type CauLuot } from './cau-anh-em'
import { refLamLai, type LamLaiRef } from './lam-lai-so'
import type { Env } from './kieu'
import type { PrivateQuestion, Question } from '../../src/game/than-thu-v2/core'
import { publicQuestion } from '../../src/game/than-thu-v2/core'
import { jsonLaTuLuan, laCauTuLuan } from './cam-tu-luan'
import { chanKhacKhoiEm } from './chan-khac-khoi'
import { doDayDu, napDayDuMem, protectedQuestions, type CauPool } from './game-v2-bank'
import { chiaLuot, chonPhuongAnGach, danXenLuot, moDuocRuong, nhanNo, phanLoaiDanXen, sucEmCua, type CauDanXen, type HoSoDangTho, type NguonNhan, type SucEm, type TrangThaiCau } from './srs2-loi'
import { coGoiY, docHangEm, docHoSo2, docHoSoDangCaLop, docLichSuCoNguon, docNhanNo, ganNguonDuoi, layKeHoachHomNay, LOI_KHOA_DAO, lyDoKhongPhucVu, ngayVnCua, qidCanNhanNo, qidGoc, sanh2, thuSucThem, type HoSo2, type LanLamCoNguon, type MetaCau } from './srs2-d1'
import { ghiLoiMay } from './nhat-ky-may'
import { omniBat } from './omni-d1'
import { hoa2OmniAction, LENH_OMNI_HOA2, startVe } from './omni-game'
import { CHU_CHO_BAI_MOI } from '../../src/lib/omni-chu'

type Row = Record<string, unknown>
const str = (v: unknown): string => (v == null ? '' : String(v))

/** Số câu một chuyến thám hiểm (6 ải) và số câu riêng của một chặng Đoàn (8 hiệp − 2 hiệp trùm). */
export const SO_CAU_CHUYEN = 6
export const SO_CAU_CHANG = 6
/** Rương Bát Linh: vàng (mua phụ kiện ở Cửa hàng), KHÔNG phải EXP — không đụng trần 120 EXP/ngày. */
export const VANG_RUONG = 20

/** Gợi ý M3 gửi xuống máy em: Phần I gạch 2 phương án sai (máy chủ chọn, KHÔNG gửi đáp án); Phần II, III mở trước ô Kiến thức cốt lõi. */
export interface GoiYM3 { gach?: string[]; cotLoi?: string }

/** Ô "Kiến thức cốt lõi" của lời giải (trường `chot`), đọc được mọi cách kho đã lưu. Không có ⇒ không gợi ý kiểu này. */
export function docCotLoi(solution: unknown): string | null {
  let o: unknown = solution
  if (typeof o === 'string') {
    try { o = JSON.parse(o) } catch { return null }
  }
  if (!o || typeof o !== 'object') return null
  const r = o as Row
  const c = r.chot ?? r.kienThucCotLoi ?? r.kien_thuc_cot_loi
  return typeof c === 'string' && c.trim() && !c.includes('[object Object]') ? c.trim() : null
}

export function goiYCho(q: PrivateQuestion, t: TrangThaiCau | undefined, khoa: string): GoiYM3 | null {
  if (!coGoiY(t)) return null
  if (q.phan === 'I' && /^[ABCD]$/.test(q.correct)) return { gach: chonPhuongAnGach(q.correct, khoa) }
  const cotLoi = docCotLoi(q.solution)
  return cotLoi ? { cotLoi } : null
}

/** Câu thứ mấy em làm trong game hôm nay (đếm cả câu này): quá 40 ⇒ không rơi EXP, không rơi vật phẩm (luật Huyết Chiến). */
export async function soCauGameHomNay(env: Env, sbd: string, nowMs: number): Promise<number> {
  const r = await env.DB.prepare("SELECT COUNT(*) AS n FROM su_kien_hoc WHERE sbd = ? AND ngay_vn = ? AND nguon = 'game'").bind(sbd, ngayVnCua(nowMs)).first<{ n: number }>().catch(() => null)
  return Number(r?.n) || 0
}

/** `tc`/`xt`/`nv` (05/10, cau-anh-em.ts): làm lại câu sai bằng bản khác — chỉ ở JSON phiên máy chủ (chấm, ghi sổ), KHÔNG xuống máy em. */
export interface RefPhien extends LamLaiRef { qid: string; maDe: string; version: string; group: string; novel: boolean; role: string; goiY?: GoiYM3; /** Nhãn nợ (Sổ nợ 29/09). */ nhanNo?: string }

/**
 * ĐAN XEN (thầy 29/09): câu của LƯỢT TỚI (chuyến Đảo / chặng Đoàn) — chia phần kế hoạch còn lại theo mật độ của em (`chiaLuot`), lấy lượt
 * đầu, nạp câu đầy đủ, rồi xếp thứ tự trong lượt (`danXenLuot`: mở/kết bằng câu dễ, không 2 khó/2 nợ liền nhau). Tất định: cùng kế hoạch
 * còn lại ⇒ cùng lượt. Câu bị chặn / thiếu siêu dữ liệu bị bỏ TRƯỚC khi chia.
 */
export async function napLuot(env: Env, hs: HoSo2, khoa: readonly string[], chan: ReadonlySet<string>, suc: SucEm, co: number, trumKho = false, boQua?: BoQuaNap, lamLai?: BoiCanhLamLai, khiCoLuot?: (qids: string[]) => void): Promise<CauLuot[]> {
  const thay = new Set<string>()
  const ung: CauDanXen[] = []
  for (const k of khoa) {
    const q = qidGoc(k), m = hs.meta.get(q)
    if (thay.has(q) || !m || chan.has(q) || chan.has(m.group)) continue
    if (m.tuLuan) { boQua?.tuLuan.add(q); continue } // 30/09: câu tự luận lặng lẽ bỏ (kế hoạch đã không đếm — `tamHoanCauKhoa`)
    thay.add(q)
    ung.push(phanLoaiDanXen(q, hs.tt.get(q), m))
  }
  const luot = chiaLuot(ung, suc, co)[0] ?? []
  // `khiCoLuot` (tối ưu 05/10): nơi gọi bắt đầu được phần đọc theo câu (nhãn nợ) của lượt này CÙNG lúc nạp câu. Câu trả về có thể khác lượt (song sinh,
  // câu anh em của thang làm lại) ⇒ nơi gọi chỉ dùng phần đọc sớm khi nó PHỦ đủ câu cần nhãn (`batDauNhanNo().ls`), không thì đọc như cũ.
  khiCoLuot?.(luot.map((x) => x.qid))
  // Tối ưu 05/10: phần ĐỌC của thang làm lại (công tắc, phạm vi + bối cảnh, chỉ mục câu cùng dạng) chạy CÙNG đợt nạp câu khi lượt có câu chắc cần
  // câu anh em (cau-anh-em.ts `batDauLamLaiKhac`) — trước: 4–5 đợt nối tiếp sau khi nạp xong. `apLamLaiKhac` quyết y hệt.
  const lamLaiSom = lamLai ? batDauLamLaiKhac(env, hs, luot.map((x) => x.qid), lamLai, chan) : undefined
  const day = await napCau(env, hs, luot.map((x) => x.qid), luot.length, chan, boQua)
  const theo = new Map(day.map((x) => [x.q.qid, x]))
  const xep = danXenLuot(luot.filter((x) => theo.has(x.qid)), suc, { trumKho: trumKho && theo.size === co })
  // VÒNG HỌC v2: câu lỗi đến lượt làm lại ⇒ phục vụ CÂU SONG SINH (qid ảo "<gốc>~ss0..3"; chấm ở máy chủ như câu thường).
  const ds = xep.map((x) => { const c = theo.get(x.qid)!; return { ...c, q: phuNeuCan(c.q, hs.songSinhCho, hs.boTro) } })
  // 05/10 thang làm lại (cau-anh-em.ts): câu lỗi trong cửa sổ lỗi mà vẫn ra nguyên văn ⇒ song sinh bản kế / câu anh em cùng dạng / bản xáo / nguyên văn (đếm).
  // Câu anh em cũng tránh `chan` của lượt. Không `lamLai` (hoặc khoá `lam_lai_khac` tắt) ⇒ y hệt hôm nay.
  return lamLai ? apLamLaiKhac(env, hs, ds, lamLai, chan, lamLaiSom) : ds
}
/** Sức em (hạng chung) cho đan xen; lỗi đọc ⇒ trung bình. */
export async function sucEmHomNay(env: Env, sbd: string, hs: HoSo2, hoSoDangSom?: Promise<Map<string, HoSoDangTho[]>>): Promise<SucEm> {
  // `hoSoDangSom` (tối ưu 05/10): hồ sơ dạng (lượt ĐỌC duy nhất của `docHangEm`, không phụ thuộc kế hoạch) đã bắt đầu từ đầu lệnh.
  return sucEmCua((await docHangEm(env, sbd, hs, hoSoDangSom).catch(() => null))?.hangChung)
}
/** Đọc sớm cho `start` Đảo/Đoàn (tối ưu 05/10): hồ sơ dạng (sức em) — trước: đọc SAU lô đóng phiên Bi-a (một đợt riêng). Không ném lỗi treo. */
function hoSoDangSom(env: Env, sbd: string): Promise<Map<string, HoSoDangTho[]>> {
  const p = docHoSoDangCaLop(env, [sbd])
  p.catch(() => {})
  return p
}
/** Lịch sử có nguồn cho nhãn nợ của LƯỢT sắp phát (tập cha của câu được chọn) — bắt đầu cùng lúc nạp câu (`napLuot` gọi `khiCoLuot`). */
function batDauNhanNo(env: Env, sbd: string, hs: HoSo2): { khiCoLuot: (qids: string[]) => void; ls: (qids: readonly string[]) => Promise<Map<string, LanLamCoNguon[]> | null> | undefined } {
  let ls: Promise<Map<string, LanLamCoNguon[]> | null> | undefined
  let phu = new Set<string>()
  return {
    khiCoLuot: (qids) => { const can = qidCanNhanNo(hs, qids); if (can.length) { phu = new Set(can); ls = docLichSuCoNguon(env, sbd, can); ls.catch(() => {}) } },
    // Chỉ dùng phần đọc sớm khi nó PHỦ mọi câu cần nhãn của lượt thật (thang làm lại có thể thay câu) — không thì `docNhanNo` đọc như cũ.
    ls: (qids) => (ls && qidCanNhanNo(hs, qids).every((q) => phu.has(q)) ? ls : undefined),
  }
}

/** Cỡ lô một truy vấn nạp câu đầy đủ (chặn cỡ tham số JSON; kế hoạch ngày ≤ vài chục câu nên thường chỉ MỘT lô). */
export const LO_NAP_CAU = 40
/**
 * Nạp câu đầy đủ theo thứ tự kế hoạch, bỏ câu đang bảo vệ/tự luận/rút khỏi kho; lấy tối đa `toiDa`.
 * Tối ưu 28/09: trước gọi `doDayDu` TỪNG câu nối tiếp (N+1, ≥ 6 vòng D1 mỗi lượt Đảo/Đoàn); nay nạp theo LÔ ứng viên (một truy vấn IN,
 * ≤ LO_NAP_CAU câu), chỉ nạp lô kế khi lô trước bị loại quá nhiều. Kết quả (thứ tự, luật bỏ câu) y hệt.
 */
/** Câu `napCau` đã BỎ và vì sao (30/09 — để `lyDoLuotRong` nói đúng lý do): `tuLuan` = luật tự luận, `vang` = không nạp được bản đầy đủ (đã sửa/rút/JSON hỏng), `loiLo` = D1 ném khi nạp lô. */
export interface BoQuaNap { tuLuan: Set<string>; vang: Set<string>; loiLo: boolean }
export const boQuaMoi = (): BoQuaNap => ({ tuLuan: new Set(), vang: new Set(), loiLo: false })
/** Tên nguồn nhật ký máy khi nạp lô câu cho Đảo/Đoàn lỗi (nhat-ky-may.ts). */
export const NGUON_LOI_NAP_CAU = 'nap_cau_game'
/**
 * Log chi tiết khi trả `chua_nap_duoc` (phản biện vòng 2 #110 — Boss tra "em nào, câu nào"): SBD + tối đa 20 câu còn lại dạng `mãĐề|qid`
 * (đánh dấu câu vắng khi nạp). Không tên em, không nội dung/đáp án. Xem bằng `wrangler tail`; nhật ký máy chỉ giữ câu chung cho thầy.
 */
export function logChuaNap(kenh: 'dao' | 'doan', sbd: string, khoa: readonly string[], hs: Pick<HoSo2, 'meta'>, boQua: BoQuaNap): void {
  const cau = [...new Set(khoa.map(qidGoc))].slice(0, 20).map((q) => `${hs.meta.get(q)?.maDe ?? '?'}|${q}${boQua.vang.has(q) ? ' (vắng khi nạp)' : ''}`)
  console.error(`[nap-cau-game] ${kenh}: chua_nap_duoc`, JSON.stringify({ sbd, loiLo: boQua.loiLo, cau }))
}
export async function napCau(env: Env, hs: HoSo2, khoa: readonly string[], toiDa: number, chan: ReadonlySet<string>, boQua?: BoQuaNap): Promise<{ q: PrivateQuestion; m: MetaCau }[]> {
  const ra: { q: PrivateQuestion; m: MetaCau }[] = []
  // Ứng viên theo thứ tự, mỗi qid một lần, đã lọc meta/chặn (không tốn truy vấn).
  const ung: { qid: string; m: MetaCau }[] = []
  const thay = new Set<string>()
  for (const k of khoa) {
    const qid = qidGoc(k)
    if (thay.has(qid)) continue
    thay.add(qid)
    const m = hs.meta.get(qid)
    if (!m || chan.has(qid) || chan.has(m.group)) continue
    ung.push({ qid, m })
  }
  let i = 0
  while (ra.length < toiDa && i < ung.length) {
    const lo = ung.slice(i, i + Math.min(LO_NAP_CAU, Math.max(toiDa - ra.length + 2, 8)))
    i += lo.length
    let day: Map<string, PrivateQuestion>
    try { day = await napDayDuMem(env, lo.map((x) => ({ maDe: x.m.maDe, qid: x.qid, version: x.m.version }))) } catch (e) {
      // lỗi đọc lô: bỏ lô như bỏ câu (hành vi cũ) — 30/09: ghi nhật ký máy để Boss tra được vì sao "Chưa tải được câu hôm nay"
      // (phản biện vòng 2 #110: dòng nhật ký máy chỉ có câu chung ⇒ chi tiết mã đề|qid|version + lỗi ra log `wrangler tail`)
      console.error('[nap-cau-game] lỗi đọc lô câu', JSON.stringify({ cau: lo.map((x) => `${x.m.maDe}|${x.qid}|${x.m.version}`), loi: e instanceof Error ? e.message : String(e) }))
      if (boQua) boQua.loiLo = true
      await ghiLoiMay(env, NGUON_LOI_NAP_CAU)
      continue
    }
    for (const x of lo) {
      if (ra.length >= toiDa) break
      const q = day.get(`${x.m.maDe}|${x.qid}|${x.m.version}`)
      if (!q) { boQua?.vang.add(x.qid); continue } // câu vừa sửa/rút khỏi kho: bỏ qua
      if (laCauTuLuan(q)) { boQua?.tuLuan.add(x.qid); continue } // tự luận (luật chặt #107): lặng lẽ bỏ
      ra.push({ q, m: x.m })
    }
  }
  return ra
}

/** Điều kiện SQL (bảng `game_v2_session` bí danh `s`): phiên Bi-a Phản Ứng còn mở (chưa `dong`). */
export const DK_PHIEN_BIA_MO = "json_extract(s.json,'$.bia') = 1 AND COALESCE(json_extract(s.json,'$.dong'),0) = 0"
/** Điều kiện SQL: phiên Game Hóa 2.0 của Đảo/Đoàn (không phải Bi-a). */
export const DK_PHIEN_DAO_DOAN = "json_extract(s.json,'$.hoa2') = 1 AND COALESCE(json_extract(s.json,'$.bia'),0) = 0"
/**
 * Câu đang GIỮ trong các phiên còn hạn (< 2 giờ) thoả `dieuKien` mà em CHƯA trả lời — để Đảo/Đoàn và Bi-a không phát trùng câu của nhau
 * (Bi-a Phản Ứng, đặc tả mục 4.7). Lỗi đọc ⇒ tập rỗng (không chặn thêm, hành vi cũ).
 */
/** Câu các phiên khớp `dieuKien` còn giữ (chưa trả lời). Quét tối ưu 30/09: MỘT truy vấn (lượt đã trả lời gom bằng truy vấn con theo chỉ mục
 * game_v2_attempt_session) thay cho hai lượt nối tiếp (phiên → lượt trả lời). Kết quả y hệt. */
const sqlCauDangGiu = (dieuKien: string) => `SELECT s.id AS id, s.json AS json,
    (SELECT json_group_array(a2.qid) FROM game_v2_attempt a2 WHERE a2.session = s.id AND a2.sbd = s.sbd) AS da
    FROM game_v2_session s WHERE s.sbd = ? AND s.created_at >= ? AND ${dieuKien}`
function cauGiuTuPhien(phien: readonly Row[]): Set<string> {
  const ra = new Set<string>()
  for (const x of phien) {
    let da: unknown = []
    try { da = JSON.parse(str(x.da) || '[]') } catch { da = [] }
    const daTraLoi = new Set((Array.isArray(da) ? da : []).map((q) => str(q)))
    const qs = (JSON.parse(str(x.json)) as { questions?: RefPhien[] }).questions ?? []
    for (const q of qs) if (!daTraLoi.has(q.qid)) ra.add(q.qid)
  }
  return ra
}
export async function cauDangGiu(env: Env, sbd: string, nowMs: number, dieuKien: string): Promise<Set<string>> {
  try {
    const r = await env.DB.prepare(sqlCauDangGiu(dieuKien)).bind(sbd, new Date(nowMs - 2 * 3_600_000).toISOString()).all<Row>()
    return cauGiuTuPhien(r.results ?? [])
  } catch { return new Set() } // lỗi đọc: không chặn thêm
}

/**
 * Bàn Bi-a (ván A.I / online) giữ câu chừng nào còn HOẠT ĐỘNG; KHÔNG hoạt động quá ngần này (không trả lời câu, không đổi câu, màn chơi không báo
 * "còn ở bàn" — `bia-giu-ban` mỗi 3 phút khi màn đang hiện) ⇒ coi như em đã bỏ bàn. Sửa 30/09: trước tính theo GIỜ TẠO (30 phút) nên ván dài đang chơi bị đóng.
 */
export const HAN_GIU_BAN_BIA_MS = 15 * 60_000
/**
 * Mốc hoạt động gần nhất của một phiên Bi-a `s` (ISO, so chuỗi được): lớn nhất của giờ tạo, `$.hoatDong` (ms, từ `bia-giu-ban`) và lần trả lời gần nhất.
 * Dùng trong điều kiện SQL (bảng `game_v2_session` đặt bí danh `s`).
 */
export const SQL_HOAT_DONG_BIA = `MAX(s.created_at,
    COALESCE(strftime('%Y-%m-%dT%H:%M:%fZ', json_extract(s.json,'$.hoatDong') / 1000.0, 'unixepoch'), ''),
    COALESCE((SELECT MAX(a.created_at) FROM game_v2_attempt a WHERE a.session = s.id AND a.sbd = s.sbd), ''))`
/**
 * Em mở Đảo/Đoàn ⇒ Bi-a KHÔNG được "ăn" mất câu (sửa lỗi 29/09: phiên "Trả lời câu hỏi" em tắt máy không gọi `dong` giữ 4 câu cuối 2 giờ,
 * Đảo báo nhầm "ca kiểm tra"). Đóng NGAY mọi phiên chỉ-trả-lời (`chiCau`) còn mở và mọi bàn Bi-a KHÔNG hoạt động quá `HAN_GIU_BAN_BIA_MS`
 * (câu chưa trả lời về lại kế hoạch; `bi_a_van` để nguyên cho `bia-ket-van`). Trả câu còn giữ ở bàn đang chơi thật (còn hoạt động).
 */
export async function nhaCauBiaChoDaoDoan(env: Env, sbd: string, nowMs: number): Promise<Set<string>> {
  // Quét tối ưu 30/09: đóng phiên + đọc câu còn giữ trong MỘT lô D1 (chạy tuần tự trong một giao dịch ⇒ lượt đọc thấy phiên vừa đóng) — trước: 3 lượt nối tiếp.
  const dong = env.DB.prepare(`UPDATE game_v2_session AS s SET json = json_set(s.json, '$.dong', 1) WHERE s.sbd = ? AND json_extract(s.json,'$.bia') = 1 AND COALESCE(json_extract(s.json,'$.dong'),0) = 0
      AND (COALESCE(json_extract(s.json,'$.chiCau'),0) = 1 OR ${SQL_HOAT_DONG_BIA} < ?)`).bind(sbd, new Date(nowMs - HAN_GIU_BAN_BIA_MS).toISOString())
  try {
    const [, r] = await env.DB.batch<Row>([dong, env.DB.prepare(sqlCauDangGiu(DK_PHIEN_BIA_MO)).bind(sbd, new Date(nowMs - 2 * 3_600_000).toISOString())])
    return cauGiuTuPhien(r?.results ?? [])
  } catch {
    // Lô lỗi (vd. câu đóng phiên hỏng) ⇒ như cũ: bỏ qua việc đóng, vẫn đọc câu đang giữ.
    return cauDangGiu(env, sbd, nowMs, DK_PHIEN_BIA_MO)
  }
}

/** Lời báo khi lượt Đảo/Đoàn RỖNG — nói ĐÚNG lý do (trước 29/09 mọi trường hợp đều báo "ca kiểm tra"). */
export const LOI_LUOT_RONG = {
  cau_dang_bao_ve: 'Các câu còn lại hôm nay đang dùng cho ca kiểm tra. Em quay lại sau khi ca kết thúc nhé.',
  cau_dang_o_bia: 'Các câu còn lại đang nằm trên bàn Bi-a em đang chơi. Em chơi xong hoặc thoát ván Bi-a rồi quay lại nhé.',
  chua_nap_duoc: 'Chưa tải được câu hôm nay (kho câu đang cập nhật). Em thử lại sau ít phút nhé.',
} as const
/**
 * Chẩn đoán vì sao `napLuot` rỗng trên các khoá còn lại: ca khoá > bàn Bi-a giữ > lỗi tải thật (D1 ném) > mọi câu còn lại đều tự luận / không còn trong kho
 * (⇒ `xong`: coi như hết câu hôm nay, KHÔNG lộ lý do — kế hoạch bình thường đã bỏ chúng ở `tamHoanCauKhoa`) > câu vắng khi nạp mà meta còn / không rõ
 * (⇒ `chua_nap_duoc` + nhật ký máy).
 */
export function lyDoLuotRong(khoa: readonly string[], hs: Pick<HoSo2, 'meta'>, chanCa: ReadonlySet<string>, giuBia: ReadonlySet<string>, boQua?: BoQuaNap): keyof typeof LOI_LUOT_RONG | 'xong' {
  const qs = khoa.map(qidGoc)
  if (qs.some((q) => chanCa.has(q) || chanCa.has(hs.meta.get(q)?.group ?? '\u0000'))) return 'cau_dang_bao_ve'
  if (qs.some((q) => giuBia.has(q))) return 'cau_dang_o_bia'
  if (boQua?.loiLo) return 'chua_nap_duoc'
  // Phản biện #108: câu VẮNG khi nạp mà meta vẫn còn (chỉ mục đang lập lại / lệch trong khoảnh khắc) KHÔNG phải "xong" — Sảnh vẫn đếm nó ⇒ báo lỗi tạm
  // (`chua_nap_duoc`, thử lại được) kèm nhật ký máy. Chỉ "xong" khi câu thật sự không phục vụ được (meta mất / tự luận).
  if (qs.every((q) => lyDoKhongPhucVu(hs.meta.get(q)) !== null || boQua?.tuLuan.has(q))) return 'xong'
  return 'chua_nap_duoc'
}
/** Lời báo hết câu có nhắc câu tạm hoãn vì ca (không lộ câu nào). */
const loiTamHoan = (n: number): string => (n > 0 ? ` Còn ${n} câu đang dùng cho ca kiểm tra, để dành hôm khác.` : '')

/**
 * Lượt Bát Linh Đảo (chuyến thám hiểm 6 ải) ở chế độ 2.0.
 * - Còn câu ôn hôm nay ở Đoàn ⇒ khoá, trả đúng lời thầy.
 * - Lượt đang chờ (chưa trả lời câu nào) ⇒ trả lại chính lượt ấy.
 * - Thứ tự trong chuyến: ĐAN XEN (thầy 29/09, `napLuot`) — mở/kết bằng câu dễ, không 2 câu khó/2 câu nợ liền nhau; em khá/giỏi Trùm là câu khó nhất.
 */
export async function startDao2(env: Env, sbd: string, nowMs: number): Promise<Record<string, unknown>> {
  // 29/09 (cao điểm): chuyến đang chờ (chưa làm câu nào) đọc SONG SONG với kế hoạch — không phụ thuộc nhau (trước: một đợt nối tiếp).
  const dangChoSom = env.DB.prepare(`SELECT id, json FROM game_v2_session s WHERE sbd = ? AND created_at >= ? AND json_extract(json,'$.hoa2') = 1 AND COALESCE(json_extract(json,'$.doan'),0) = 0 AND COALESCE(json_extract(json,'$.bia'),0) = 0
      AND NOT EXISTS (SELECT 1 FROM game_v2_attempt a WHERE a.session = s.id) ORDER BY created_at DESC LIMIT 1`).bind(sbd, new Date(nowMs - 2 * 3_600_000).toISOString()).first<Row>().catch(() => null)
  const hdSom = hoSoDangSom(env, sbd)
  const { kh, hs } = await layKeHoachHomNay(env, sbd, nowMs)
  const tamHoan = kh.tamHoan?.ca ?? 0
  const tomTat = { theLuc: { con: kh.conDao.length + kh.conDoan.length, tong: kh.tong }, dao: { con: kh.conDao.length }, doan: { con: kh.conDoan.length }, ...(tamHoan ? { tamHoan } : {}) }
  if (kh.conDoan.length) return { ok: true, questions: [], lyDo: 'khoa_cho_doan', khoaDao: true, message: LOI_KHOA_DAO, ...tomTat }
  // OMNI 3: ngày chưa có câu nào mà em đang ở chế độ chờ bài mới (`hs.omni` chỉ có khi OMNI bật cho em) ⇒ lời báo "chờ thầy giao bài mới".
  if (!kh.conDao.length) return { ok: true, questions: [], lyDo: 'xong_ke_hoach', het: true, message: kh.tong || kh.tamHoan?.nghi ? `Hôm nay em xong rồi.${loiTamHoan(tamHoan)} Mai quay lại khám phá tiếp nhé.` : tamHoan ? `Các câu hôm nay đang dùng cho ca kiểm tra. Em quay lại sau khi ca kết thúc nhé.` : cheDoChoOmni(hs) ? CHU_CHO_BAI_MOI : 'Hôm nay chưa có câu nào cho em. Thầy giao chiến dịch là đảo mở.', ...tomTat }
  const dangCho = await dangChoSom
  if (dangCho) {
    const cu = JSON.parse(str(dangCho.json)) as { questions: RefPhien[] }
    // 05/10: câu anh em (`tc`) đứng thay câu gốc của kế hoạch; lượt có câu anh em / bản xáo nạp lại theo ref phiên (cau-anh-em.ts), còn lại như cũ.
    if (cu.questions.every((r) => kh.conDao.some((k) => qidGoc(k) === (r.tc ?? r.qid)))) {
      const day = await napLaiLuotCho(env, hs, cu.questions, SO_CAU_CHUYEN, () => napCau(env, hs, cu.questions.map((r) => r.qid), SO_CAU_CHUYEN, new Set()))
      if (day.length === cu.questions.length) return { ok: true, id: str(dangCho.id), questions: day.map(({ q }, i) => ({ ...publicQuestion(q), vai: cu.questions[i]!.role, ...(cu.questions[i]!.goiY ? { goiY: cu.questions[i]!.goiY } : {}), ...(cu.questions[i]!.nhanNo ? { nhanNo: cu.questions[i]!.nhanNo } : {}) })), ...tomTat }
    }
  }
  // 29/09 (cao điểm): câu bảo vệ ca thi (đệm 5 s, thường đã có từ bước kế hoạch), câu Bi-a đang giữ và sức em là ba việc độc lập ⇒ SONG SONG (trước: nối tiếp).
  // ĐAN XEN (thầy 29/09): chuyến mở/kết bằng câu dễ, không 2 câu khó / 2 câu nợ liền nhau, mật độ theo sức em.
  // Em khá/giỏi, chuyến đủ 6 ải: ải 6 (Trùm) vẫn là câu khó nhất (thầy 28/09); em yếu/TB kết chuyến bằng câu dễ.
  const [chanCa, giuBia, suc] = await Promise.all([
    protectedQuestions(env),
    nhaCauBiaChoDaoDoan(env, sbd, nowMs), // phiên chỉ-trả-lời / bàn bỏ dở nhả câu; câu trên bàn đang chơi không ra Đảo
    sucEmHomNay(env, sbd, hs, hdSom),
  ])
  const chan = new Set([...chanCa, ...giuBia])
  const boQua = boQuaMoi()
  const nhanSom = batDauNhanNo(env, sbd, hs)
  const chon = await chanKhacKhoiEm(env, 'dao2', { sbd, meta: hs.meta }, await napLuot(env, hs, kh.conDao, chan, suc, SO_CAU_CHUYEN, suc === 'kha', boQua, { sbd, nowMs, keHoach: [...kh.dao, ...kh.doan] }, nhanSom.khiCoLuot), { cauCua: (x) => x.q }) // LUẬT THẦY 05/10: cổng cuối — chỉ câu đúng khối em
  if (!chon.length) {
    const lyDo = lyDoLuotRong(kh.conDao, hs, chanCa, giuBia, boQua)
    if (lyDo === 'xong') return { ok: true, questions: [], lyDo: 'xong_ke_hoach', het: true, message: `Hôm nay em xong rồi.${loiTamHoan(tamHoan)} Mai quay lại khám phá tiếp nhé.`, ...tomTat }
    if (lyDo === 'chua_nap_duoc') {
      logChuaNap('dao', sbd, kh.conDao, hs, boQua)
      if (!boQua.loiLo) await ghiLoiMay(env, NGUON_LOI_NAP_CAU, nowMs)
    }
    return { ok: true, questions: [], lyDo, message: LOI_LUOT_RONG[lyDo], ...tomTat }
  }
  const nhan = await docNhanNo(env, sbd, hs, chon.map(({ q }) => q.qid), nhanSom.ls(chon.map(({ q }) => q.qid))).catch(() => new Map<string, string>())
  const refs: RefPhien[] = chon.map((x, i) => {
    const { q, m } = x, t = hs.tt.get(q.qid)
    const g = goiYCho(q, t, `${sbd}|${q.qid}|${kh.ngay}`)
    const n = nhan.get(q.qid)
    return { qid: q.qid, maDe: m.maDe, version: m.version, group: m.group, novel: !!t?.laMoi, role: i === chon.length - 1 && chon.length === SO_CAU_CHUYEN ? 'trum' : t?.laMoi ? 'moi' : 'on_lai', ...(g ? { goiY: g } : {}), ...(n ? { nhanNo: n } : {}), ...refLamLai(x) }
  })
  const id = crypto.randomUUID()
  await env.DB.prepare('INSERT INTO game_v2_session(id,sbd,json,created_at) VALUES(?,?,?,?)').bind(id, sbd, JSON.stringify({ mode: 'adventure', created: nowMs, hoa2: 1, questions: refs }), new Date(nowMs).toISOString()).run()
  return { ok: true, id, questions: chon.map(({ q }, i) => ({ ...publicQuestion(q), vai: refs[i]!.role, ...(refs[i]!.goiY ? { goiY: refs[i]!.goiY } : {}), ...(refs[i]!.nhanNo ? { nhanNo: refs[i]!.nhanNo } : {}) })), ...tomTat }
}

/** OMNI 3: em đang ở chế độ chờ bài mới? (`HoSo2.omni` do làn kế hoạch thêm, CHỈ có khi OMNI bật cho em ⇒ cờ tắt luôn false.) */
const cheDoChoOmni = (hs: HoSo2): boolean => {
  const o = (hs as HoSo2 & { omni?: { bat?: boolean; cheDoCho?: boolean } }).omni
  return !!o && o.bat !== false && o.cheDoCho === true
}
/**
 * `start` Đảo (Hoá 2.0): thân có `ve` (mã dạng | 'auto') VÀ OMNI bật cho em ⇒ chuyến VÉ THỬ THÁCH (omni-game.ts `startVe`).
 * Không có `ve` hoặc OMNI tắt ⇒ `startDao2` y hệt hôm nay (không thêm lượt đọc nào khi không có `ve`).
 */
export async function startDao2CoVe(env: Env, sbd: string, b: Row, nowMs: number): Promise<Record<string, unknown>> {
  const ve = typeof b.ve === 'string' ? b.ve.trim() : ''
  if (ve && await omniBat(env, sbd).catch(() => false)) return startVe(env, sbd, ve, nowMs)
  return startDao2(env, sbd, nowMs)
}

/** Phiên câu riêng của em cho MỘT chặng Đoàn (gọi nội bộ từ `taoNguoi`). Chặng ít câu ôn thì ngắn lại, không độn câu. */
export async function startDoan2(env: Env, sbd: string, nowMs: number): Promise<Record<string, unknown>> {
  const hdSom = hoSoDangSom(env, sbd)
  const { kh, hs } = await layKeHoachHomNay(env, sbd, nowMs)
  if (!kh.conDoan.length) return { ok: true, questions: [], lyDo: 'xong_on_hom_nay', message: kh.conDao.length ? 'Em đã phá hết ổ phục kích hôm nay. Cầu sang Bát Linh Đảo đã hạ — ra đảo khám phá nhé.' : `Hôm nay em không còn câu ôn nào.${loiTamHoan(kh.tamHoan?.ca ?? 0)} Mai quay lại hộ tống nhé.` }
  // Câu đã nằm trong một phiên Đoàn chưa chốt hết của hôm nay thì không phát lại ở phiên khác.
  // 29/09 (cao điểm): phiên Đoàn đang phát, câu bảo vệ ca thi, câu Bi-a đang giữ, sức em — bốn việc độc lập ⇒ SONG SONG (trước: bốn đợt nối tiếp).
  const [r, chanCa, chanBia, suc] = await Promise.all([
    env.DB.prepare(`SELECT json FROM game_v2_session WHERE sbd = ? AND created_at >= ? AND json_extract(json,'$.hoa2') = 1 AND json_extract(json,'$.doan') = 1`).bind(sbd, new Date(nowMs - 2 * 3_600_000).toISOString()).all<Row>().catch(() => ({ results: [] as Row[] })),
    protectedQuestions(env),
    nhaCauBiaChoDaoDoan(env, sbd, nowMs), // phiên chỉ-trả-lời / bàn bỏ dở nhả câu; câu trên bàn đang chơi không ra Đoàn
    // ĐAN XEN (thầy 29/09): chặng của TỪNG em theo sức em (mỗi em câu riêng).
    sucEmHomNay(env, sbd, hs, hdSom),
  ])
  const dangPhat = new Set<string>()
  for (const x of r.results ?? []) for (const q of (JSON.parse(str(x.json)) as { questions: RefPhien[] }).questions) { dangPhat.add(q.qid); if (q.tc) dangPhat.add(q.tc) } // 05/10: câu anh em đang phát thay câu gốc ⇒ câu gốc cũng đang phát
  const chan = new Set(chanCa)
  for (const q of dangPhat) chan.add(q)
  for (const q of chanBia) chan.add(q)
  const boQua = boQuaMoi()
  const nhanSom = batDauNhanNo(env, sbd, hs)
  const lamLai: BoiCanhLamLai = { sbd, nowMs, keHoach: [...kh.dao, ...kh.doan] }
  let chon = await napLuot(env, hs, kh.conDoan, chan, suc, SO_CAU_CHANG, false, boQua, lamLai, nhanSom.khiCoLuot)
  if (!chon.length) { const lai = new Set(chanCa); for (const q of chanBia) lai.add(q); chon = await napLuot(env, hs, kh.conDoan, lai, suc, SO_CAU_CHANG, false, boQua, lamLai, nhanSom.khiCoLuot) } // phiên cũ bỏ dở: phát lại
  chon = await chanKhacKhoiEm(env, 'doan2', { sbd, meta: hs.meta }, chon, { cauCua: (x) => x.q }) // LUẬT THẦY 05/10: cổng cuối — chỉ câu đúng khối em
  if (!chon.length) {
    const lyDo = lyDoLuotRong(kh.conDoan, hs, chanCa, chanBia, boQua)
    if (lyDo === 'xong') return { ok: true, questions: [], lyDo: 'xong_on_hom_nay', message: kh.conDao.length ? 'Em đã phá hết ổ phục kích hôm nay. Cầu sang Bát Linh Đảo đã hạ — ra đảo khám phá nhé.' : `Hôm nay em không còn câu ôn nào.${loiTamHoan(kh.tamHoan?.ca ?? 0)} Mai quay lại hộ tống nhé.` }
    if (lyDo === 'chua_nap_duoc') {
      logChuaNap('doan', sbd, kh.conDoan, hs, boQua)
      if (!boQua.loiLo) await ghiLoiMay(env, NGUON_LOI_NAP_CAU, nowMs)
    }
    return { ok: true, questions: [], lyDo, message: LOI_LUOT_RONG[lyDo] }
  }
  const nhan = await docNhanNo(env, sbd, hs, chon.map(({ q }) => q.qid), nhanSom.ls(chon.map(({ q }) => q.qid))).catch(() => new Map<string, string>())
  const refs: RefPhien[] = chon.map((x) => {
    const { q, m } = x
    const g = goiYCho(q, hs.tt.get(q.qid), `${sbd}|${q.qid}|${kh.ngay}`)
    const n = nhan.get(q.qid)
    return { qid: q.qid, maDe: m.maDe, version: m.version, group: m.group, novel: false, role: 'toi_han', ...(g ? { goiY: g } : {}), ...(n ? { nhanNo: n } : {}), ...refLamLai(x) }
  })
  const id = crypto.randomUUID()
  await env.DB.prepare('INSERT INTO game_v2_session(id,sbd,json,created_at) VALUES(?,?,?,?)').bind(id, sbd, JSON.stringify({ mode: 'adventure', created: nowMs, hoa2: 1, questions: refs }), new Date(nowMs).toISOString()).run()
  // Kết quả này CHỈ đi nội bộ tới Đoàn (`taoNguoi` → `ganNhan`), không xuống máy em: kèm hoán vị `xt` để Đoàn hiển thị đúng bản xáo đã chấm (cau-anh-em.ts).
  return { ok: true, id, questions: chon.map(({ q }, i) => ({ ...publicQuestion(q), role: 'toi_han', ...(refs[i]!.goiY ? { goiY: refs[i]!.goiY } : {}), ...(refs[i]!.nhanNo ? { nhanNo: refs[i]!.nhanNo } : {}), ...(refs[i]!.xt ? { xt: refs[i]!.xt } : {}) })), soCauThieu: Math.max(0, SO_CAU_CHANG - chon.length) }
}

// ---------------------------------------------------------------- lệnh hoa2-* của app học sinh
export const LENH_HOA2: ReadonlySet<string> = new Set(['hoa2-sanh', 'hoa2-cau-da-lam', 'hoa2-cau-chi-tiet', 'hoa2-ruong-mo', 'hoa2-thu-suc-them', ...LENH_OMNI_HOA2])

export async function hoa2Action(env: Env, sbd: string, action: string, b: Row, nowMs = Date.now()): Promise<Record<string, unknown>> {
  if (action === 'hoa2-sanh') return sanh2(env, sbd, nowMs)
  if (action === 'hoa2-cau-da-lam') return cauDaLam(env, sbd, nowMs)
  if (action === 'hoa2-cau-chi-tiet') return cauChiTiet(env, sbd, b)
  if (action === 'hoa2-ruong-mo') return moRuong(env, sbd, nowMs)
  // THỬ SỨC THÊM (thầy 30/09): xong kế hoạch hôm nay ⇒ lấy trước một lô câu mới của ngày mai (srs2-d1 `thuSucThem`).
  if (action === 'hoa2-thu-suc-them') return thuSucThem(env, sbd, nowMs)
  // OMNI 3 (omni-game.ts): Trạm hồi phục xong, nhật ký, đổi thứ tự khung giờ, đề thử nửa. OMNI tắt cho em ⇒ { ok:false, error }.
  if (LENH_OMNI_HOA2.includes(action)) return hoa2OmniAction(env, sbd, action, b, nowMs)
  return { ok: false, error: 'Lệnh không hợp lệ.' }
}

/** Nhóm "chiến dịch" giả cho câu ôn NGOÀI chiến dịch (câu sai trong ca kiểm tra đã công bố — nguồn `ca_sai` của `docHoSo2`). */
export const NHOM_CAU_ON_CA = 'cau-sai-ca-kiem-tra'
/** Nhóm giả cho câu nợ vì sai khi Lên bảng / Kiểm tra đầu giờ ngoài mọi chiến dịch và ca (Sổ nợ 29/09). */
export const NHOM_CAU_SAI_TAI_LOP = 'cau-sai-tai-lop'
/** Nguồn của một lần làm, hiện cạnh lịch sử câu: Bi-a / Đoàn Hộ Tống / Bát Linh Đảo / Ca kiểm tra / Lên bảng / Kiểm tra đầu giờ; nguồn khác ⇒ 'khac'. */
export type NguonLanLam = NguonNhan
/**
 * Gắn nguồn cho từng lần trong `lichSu` của các câu đã liệt kê (một truy vấn sổ, `docLichSuCoNguon`) và nhãn nợ `nhan`
 * ("Sai 2 lần · Ca 26/09 · Lên bảng 28/09") cho câu chưa thành thạo. Lỗi đọc ⇒ để trống nguồn (không làm hỏng danh sách).
 */
async function ganNguonLanLam(env: Env, sbd: string, cau: Record<string, unknown>[], hs: HoSo2): Promise<void> {
  if (!cau.length) return
  const ls = await docLichSuCoNguon(env, sbd, cau.map((c) => str(c.qid))).catch(() => null)
  for (const c of cau) {
    const goc = c.lichSu as TrangThaiCau['lichSu']
    const coNguon = ls ? ganNguonDuoi(goc, ls.get(str(c.qid))) : null
    if (coNguon) c.lichSu = coNguon
    const t = hs.tt.get(str(c.qid))
    if (t && !t.thanhThao) {
      const n = nhanNo(coNguon ?? goc, t.ngayChua ?? null, hs.chienDichCuCuaCau?.get(str(c.qid)) ?? null)
      if (n) c.nhan = n
    }
  }
}

/** Danh sách câu em ĐÃ làm trong mọi chiến dịch + câu ôn ngoài chiến dịch em đã làm (câu chưa làm không hiện). */
async function cauDaLam(env: Env, sbd: string, nowMs: number): Promise<Record<string, unknown>> {
  const homNay = ngayVnCua(nowMs)
  const hs = await docHoSo2(env, sbd, homNay)
  const cds = (await env.DB.prepare("SELECT id, ten, han_nop, qid_json FROM chien_dich WHERE trang_thai <> 'da_huy' AND EXISTS (SELECT 1 FROM json_each(chien_dich.sbd_json) WHERE value = ?) ORDER BY tao_luc DESC").bind(sbd).all<Row>().catch(() => ({ results: [] as Row[] }))).results ?? []
  const chienDich = cds.map((c) => ({ id: str(c.id), ten: str(c.ten), hanNop: str(c.han_nop), qids: (JSON.parse(str(c.qid_json) || '[]') as string[]).map(String) }))
  const cau: Record<string, unknown>[] = []
  const daCo = new Set<string>()
  for (const c of chienDich) {
    c.qids.forEach((qid, i) => {
      const t = hs.tt.get(qid), m = hs.meta.get(qid)
      if (!t || !m || t.laMoi || daCo.has(qid)) return
      daCo.add(qid)
      cau.push({
        qid, chienDichId: c.id, stt: i + 1, phan: m.phan, mucDo: m.mucDo, tenDang: m.tenDang ?? m.dang,
        trangThai: t.catTia ? 'can_day_lai' : t.thanhThao ? 'thanh_thao' : 'dang_on', lanCuoiDung: t.lanCuoiDung, henOn: t.henOn, lichSu: t.lichSu,
      })
    })
  }
  // Câu ôn NGOÀI chiến dịch (câu sai trong ca kiểm tra đã công bố): Đoàn và Bi-a phát câu ôn trước ⇒ em làm rồi thì phải thấy ở đây
  // (thầy 28/09: "Phải lưu câu đã làm ở game bia nữa").
  const ngoai: string[] = []
  for (const qid of hs.qidCaSai ?? []) {
    const t = hs.tt.get(qid), m = hs.meta.get(qid)
    if (!t || !m || t.laMoi || daCo.has(qid)) continue
    daCo.add(qid)
    ngoai.push(qid)
    cau.push({
      qid, chienDichId: NHOM_CAU_ON_CA, stt: ngoai.length, phan: m.phan, mucDo: m.mucDo, tenDang: m.tenDang ?? m.dang,
      trangThai: t.catTia ? 'can_day_lai' : t.thanhThao ? 'thanh_thao' : 'dang_on', lanCuoiDung: t.lanCuoiDung, henOn: t.henOn, lichSu: t.lichSu,
    })
  }
  if (ngoai.length) chienDich.push({ id: NHOM_CAU_ON_CA, ten: 'Câu sai trong ca kiểm tra', hanNop: '', qids: ngoai })
  // SỔ NỢ (29/09): câu sai khi Lên bảng / Kiểm tra đầu giờ ngoài mọi chiến dịch và ca.
  const taiLop: string[] = []
  for (const qid of hs.qidSaiTaiLop ?? []) {
    const t = hs.tt.get(qid), m = hs.meta.get(qid)
    if (!t || !m || t.laMoi || daCo.has(qid)) continue
    daCo.add(qid)
    taiLop.push(qid)
    cau.push({
      qid, chienDichId: NHOM_CAU_SAI_TAI_LOP, stt: taiLop.length, phan: m.phan, mucDo: m.mucDo, tenDang: m.tenDang ?? m.dang,
      trangThai: t.catTia ? 'can_day_lai' : t.thanhThao ? 'thanh_thao' : 'dang_on', lanCuoiDung: t.lanCuoiDung, henOn: t.henOn, lichSu: t.lichSu,
    })
  }
  if (taiLop.length) chienDich.push({ id: NHOM_CAU_SAI_TAI_LOP, ten: 'Câu sai khi lên bảng', hanNop: '', qids: taiLop })
  // 30/09 LUẬT TỰ LUẬN CHẶT (thầy: "Lọc cẩn thận những câu tự luận này"): câu tự luận em CHƯA trả lời ⇒ ẨN; em đã trả lời (lịch sử cũ) ⇒ vẫn hiện
  // nhưng mang `tuLuan: true` (máy em ghi "Câu tự luận — không chấm tự động" thay đúng/sai), KHÔNG tính sai, không hẹn ôn, không nhãn nợ.
  const tl = await phanLoaiTuLuanDaLam(env, sbd, cau.map((c) => ({ qid: str(c.qid), m: hs.meta.get(str(c.qid)) })))
  const hienThi = cau.filter((c) => !tl.tuLuan.has(str(c.qid)) || tl.daTraLoi.has(str(c.qid)))
  await ganNguonLanLam(env, sbd, hienThi, hs)
  for (const c of hienThi) {
    if (!tl.tuLuan.has(str(c.qid))) continue
    c.tuLuan = true
    c.lanCuoiDung = null
    c.henOn = null
    delete c.nhan
  }
  return { ok: true, chienDich: chienDich.map(({ qids, ...c }) => ({ ...c, tong: qids.length })), cau: hienThi }
}

/**
 * Câu nào trong danh sách là TỰ LUẬN (định nghĩa chung `laCauTuLuan`, đọc JSON chỉ mục đúng tờ + phiên bản em đã làm; không thấy dòng khớp ⇒ xét
 * mọi dòng cùng qid) và câu tự luận nào em ĐÃ TRẢ LỜI (sổ `su_kien_hoc` có kết quả khác NULL — NULL là bỏ trống/chưa làm). Lỗi đọc ⇒ coi như
 * không có câu tự luận (không làm hỏng danh sách).
 */
export async function phanLoaiTuLuanDaLam(env: Env, sbd: string, ds: readonly { qid: string; m?: MetaCau }[]): Promise<{ tuLuan: Set<string>; daTraLoi: Set<string> }> {
  const tuLuan = new Set<string>(), daTraLoi = new Set<string>()
  const qids = [...new Set(ds.map((x) => x.qid).filter(Boolean))]
  if (!qids.length) return { tuLuan, daTraLoi }
  try {
    const khop = new Map(ds.map((x) => [x.qid, x.m ? `${x.m.maDe}|${x.m.version}` : '']))
    const tatCa = new Map<string, boolean[]>(), dung = new Map<string, boolean>()
    for (let i = 0; i < qids.length; i += 400) {
      const r = await env.DB.prepare('SELECT qid, ma_de, version, json FROM game_v2_question WHERE qid IN (SELECT value FROM json_each(?))').bind(JSON.stringify(qids.slice(i, i + 400))).all<Row>()
      for (const x of r.results ?? []) {
        const q = str(x.qid), la = jsonLaTuLuan(x.json)
        tatCa.set(q, [...(tatCa.get(q) ?? []), la])
        if (khop.get(q) === `${str(x.ma_de)}|${str(x.version)}`) dung.set(q, la)
      }
    }
    for (const q of qids) {
      const la = dung.has(q) ? dung.get(q)! : (tatCa.get(q) ?? []).some(Boolean)
      if (la) tuLuan.add(q)
    }
    if (tuLuan.size) {
      const r = await env.DB.prepare('SELECT DISTINCT qid FROM su_kien_hoc WHERE sbd = ? AND ket_qua IS NOT NULL AND qid IN (SELECT value FROM json_each(?))').bind(sbd, JSON.stringify([...tuLuan])).all<Row>()
      for (const x of r.results ?? []) daTraLoi.add(str(x.qid))
    }
  } catch (e) {
    console.error('[cau-da-lam] chưa phân loại được câu tự luận:', e instanceof Error ? e.message : e)
  }
  return { tuLuan, daTraLoi }
}

/** Đề + đáp án + lời giải của câu em ĐÃ làm (đáp án không bao giờ xuống máy trước khi em làm câu đó). Tối đa 60 câu/lượt (tải PDF). */
async function cauChiTiet(env: Env, sbd: string, b: Row): Promise<Record<string, unknown>> {
  const qids = (Array.isArray(b.qids) ? b.qids : [b.qid]).map(str).filter(Boolean).slice(0, 60)
  if (!qids.length) return { ok: false, error: 'Thiếu câu cần xem.' }
  // Tối ưu 05/10: ba lượt ĐỌC độc lập (câu em đã làm, hồ sơ 2.0, câu đang bảo vệ) bắt đầu CÙNG lúc — trước: nối tiếp. Dùng đúng thứ tự cũ.
  const hsSom = docHoSo2(env, sbd, ngayVnCua(Date.now()))
  hsSom.catch(() => {})
  const baoVeSom = protectedQuestions(env).catch(() => null)
  const daLam = await env.DB.prepare(`SELECT DISTINCT qid FROM su_kien_hoc WHERE sbd = ? AND qid IN (SELECT value FROM json_each(?)) AND COALESCE(visibility,'released') <> 'embargoed'`).bind(sbd, JSON.stringify(qids)).all<Row>()
    .catch(() => env.DB.prepare('SELECT DISTINCT qid FROM su_kien_hoc WHERE sbd = ? AND qid IN (SELECT value FROM json_each(?))').bind(sbd, JSON.stringify(qids)).all<Row>())
  const duoc = new Set((daLam.results ?? []).map((x) => str(x.qid)))
  const hs = await hsSom
  // Câu đang bảo vệ cho ca chưa công bố / còn làm được (theo qid HOẶC nhóm nội dung — bản chép ở tờ khác) ⇒ KHÔNG trả đáp án, lời giải.
  // Lỗi đọc phạm vi ⇒ giấu hết (thà giấu nhầm một lúc còn hơn lộ). Trả `khoa` để app báo "đang khoá tới khi Thầy công bố".
  const tapBaoVe = await baoVeSom
  const ra: Record<string, unknown>[] = []
  const khoa: string[] = []
  // Tối ưu 05/10: mỗi câu hai lượt ĐỌC (bản đầy đủ + đáp án em chọn gần nhất) — trước: 2 đợt nối tiếp CHO TỪNG CÂU (12 câu = 24 đợt); nay mọi câu
  // đọc CÙNG đợt (gộp một lô), rồi xét đúng thứ tự cũ: câu đang bảo vệ vẫn vào `khoa`, không trả đáp án/lời giải/đáp án em chọn.
  const viec = qids.map((qid) => {
    if (!duoc.has(qid)) return null
    const m = hs.meta.get(qid)
    if (!m) return null
    const q = doDayDu(env, [{ qid, maDe: m.maDe, version: m.version, nhe: true } as unknown as CauPool]).then(([x]) => x)
    q.catch(() => {})
    // 05/10: lượt BẢN XÁO lưu thêm `traLoiGoc` (đáp án em chọn quy về khung gốc) — xem lại trên câu gốc phải đọc khoá ấy.
    const tl = env.DB.prepare("SELECT COALESCE(json_extract(json,'$.traLoiGoc'), json_extract(json,'$.traLoi')) AS t FROM game_v2_attempt WHERE sbd = ? AND qid = ? ORDER BY created_at DESC LIMIT 1").bind(sbd, qid).first<Row>().catch(() => null)
    return { qid, q, tl }
  })
  for (const v of viec) {
    if (!v) continue
    const qid = v.qid
    try {
      const q = await v.q
      if (!q) continue
      if (!tapBaoVe || tapBaoVe.has(qid) || tapBaoVe.has(q.group)) { khoa.push(qid); continue }
      const tl = await v.tl
      // 30/09: câu tự luận ⇒ `tuLuan: true` — máy em hiện "Câu tự luận — không chấm tự động" thay đỏ/xanh (PDF cũng vậy).
      ra.push({ de: publicQuestionDayDu(q), dapAn: q.correct, loiGiai: q.solution, emTraLoi: tl?.t == null ? null : str(tl.t), ...(laCauTuLuan(q) ? { tuLuan: true } : {}) })
    } catch { /* câu đã rút khỏi kho */ }
  }
  return { ok: true, cau: ra, ...(khoa.length ? { khoa } : {}) }
}
/** Bản đề để XEM LẠI: như bản công khai nhưng giữ cả hình sau lời giải. */
const publicQuestionDayDu = (q: PrivateQuestion): Question => {
  const { correct: _c, solution: _s, reviewed: _r, ...pub } = q
  return pub
}

/** Mở Rương Bát Linh: chỉ khi xong trọn kế hoạch hôm nay; mỗi ngày một lần. Quà = vàng (mua phụ kiện). */
async function moRuong(env: Env, sbd: string, nowMs: number): Promise<Record<string, unknown>> {
  const { kh } = await layKeHoachHomNay(env, sbd, nowMs)
  const daLam = kh.tong - kh.conDao.length - kh.conDoan.length
  if (!moDuocRuong(kh.tong, daLam)) {
    // Thử sức thêm (30/09): rương hôm nay ĐÃ MỞ rồi em mới lấy thêm lô câu mới ⇒ `tong` tăng nhưng rương KHÔNG khoá lại — trả như mở lần hai.
    const daMo = await env.DB.prepare('SELECT 1 AS co FROM ruong_bat_linh WHERE sbd = ? AND ngay = ?').bind(sbd, kh.ngay).first<Row>().catch(() => null)
    if (daMo) return { ok: true, qua: { vang: VANG_RUONG }, lapLai: true }
    // Trả CẢ `loi` (hợp đồng gốc) lẫn `error` (lớp gọi game-v2 chung của app học sinh đọc `error`) — cùng một lời, chỉ-thêm.
    const loi = `Em làm xong ${kh.tong}/${kh.tong} câu hôm nay thì rương mở. Hiện em đã làm ${daLam} câu.`
    return { ok: false, ma: 'chua_du', loi, error: loi }
  }
  const luc = new Date(nowMs).toISOString()
  const qua = { vang: VANG_RUONG }
  const ghi = await env.DB.prepare('INSERT OR IGNORE INTO ruong_bat_linh(sbd, ngay, mo_luc, qua_json) VALUES (?,?,?,?)').bind(sbd, kh.ngay, luc, JSON.stringify(qua)).run()
  if (ghi.meta.changes) {
    // Sổ vàng chỉ nhận loai ∈ {doi, mua, hoan} (CHECK có sẵn; đổi CHECK = đổi lược đồ, không làm). Quà rương ghi là
    // dòng `doi` với exp_tru = 0 (đổi 0 EXP lấy vàng), khoá `ruong-<ngày>` ⇒ nhận diện được và không trùng.
    await env.DB.prepare("INSERT OR IGNORE INTO vang_so(sbd, loai, so_vang, exp_tru, ma_mon, khoa_yeu_cau, luc) VALUES (?, 'doi', ?, 0, NULL, ?, ?)").bind(sbd, VANG_RUONG, `ruong-${kh.ngay}`, luc).run()
      .catch((e: unknown) => console.error('[ruong-bat-linh] ghi vàng lỗi:', e instanceof Error ? e.message : e))
    return { ok: true, qua, lapLai: false }
  }
  return { ok: true, qua, lapLai: true }
}


