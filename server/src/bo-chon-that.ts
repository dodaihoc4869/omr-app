// BỘ CHỌN THẬT — nối dữ liệu THẬT vào điểm §7.2 rồi sắp thứ tự (P05), dùng cho đường phát câu.
//
// Vì sao có tệp này: `bo-chon-diem.ts` là hàm thuần; nếu không ai truyền dữ liệu thật vào thì mọi câu
// cùng điểm và "cá nhân hóa" chỉ là hình thức. Tệp này đọc ĐÚNG các nguồn thật đang chạy:
//   · đến hạn / lịch ôn  → `masteryTheoHoSo` (mốc `nam_kt_dang.moc_on_ke`, FSRS-6) — qua tham số `mastery`.
//   · đợt dạy lại       → `nam_kt_cau.can_day_lai` + `trang_thai` (hồ sơ mạnh–yếu đang chạy).
//   · mức đang luyện    → `skill_snapshot` của P03 (`docNangLucEm`, nguồn: sổ sự kiện).
//   · thời gian mỗi câu → `uoc-luong-thoi-gian.ts` (part × mức + phản hồi).
// Family: KHO THẬT CHƯA GẮN NHÃN (P02 ghi nhận) ⇒ `transferValue = 0` toàn bộ; KHÔNG bịa family.
import type { Env } from './kieu'
import { chamDiem, khoaHashSap, sapTheoDiem, type CauChonDiem, type KetQuaDiem, type TrangThaiDot } from './bo-chon-diem'
import { lietKeUngVienHopLe, type DaChonTrongLuot, type LyDoNgoaiLe, type UngVienLap } from './chong-lap'
import { uocLuongMotCau, type MauThoiGian } from './uoc-luong-thoi-gian'
import { docNangLucEm } from './nang-luc-d1'
import { docDaLamHomNay } from './chong-lap'
import { docCho } from './giu-cho'
import { PHIEN_BAN_KE_HOACH } from './ho-so-cau-hinh'
import { mucTuChu } from '../../src/lib/btvn-nang-do'

/** Câu ứng viên ở dạng bộ chọn thật dùng (khớp phần cần của `CauPool` trong `game-v2-bank`). */
export interface CauUngVien {
  qid: string
  version: string
  part: 'I' | 'II' | 'III'
  /** Mức độ dạng chữ trong kho ('biet' | 'hieu' | 'van_dung') hoặc số. */
  mucDo: string | null
  /** Nhóm nội dung (bản sao cùng nhóm là một đơn vị). */
  group: string
  /** Khoá dạng dùng cho lịch ôn của game: `dang ?? group`. */
  dangKey: string
  skillIds: string[]
  /**
   * NHÃN FAMILY lấy từ KHO. Kho thật CHƯA gắn nhãn (P02) ⇒ `null`/vắng ⇒ đi trần "chưa gán family"
   * (02 §4.2.6: tối đa 1 câu chưa family mỗi lượt). KHÔNG bịa family từ qid/group.
   */
  familyId?: string | null
}

/**
 * BIỂU THỨC SQL ĐỌC NHÃN FAMILY — DÙNG CHUNG cho mọi truy vấn (kho ghi `family` HOẶC `familyId`).
 * Phải khớp ĐÚNG thứ tự ưu tiên của `familyTuNhan` (JS): `family` trước, thiếu thì `familyId`; rỗng coi như thiếu.
 * Dùng alias `q` cho bảng câu (`game_v2_question`).
 */
export const SQL_NHAN_FAMILY = "COALESCE(NULLIF(json_extract(q.json, '$.family'), ''), NULLIF(json_extract(q.json, '$.familyId'), ''))"

/**
 * CƠ HỘI TRANSFER DO MÁY CHỦ CẤP (§7.2 `transferValue`): câu CÓ NHÃN FAMILY, ĐÃ DUYỆT, và `content_group` CHƯA từng
 * có kết quả trong sổ của em — tức "nhóm nội dung mới". Nhờ vậy:
 *   · family đã biết + nhóm mới ⇒ `transferValue` = 1 (đúng "1 nếu có cơ hội do server cấp và content_group mới, family đã biết");
 *   · family chưa gặp + nhóm mới ⇒ 0,5 (nơi chấm tự biết qua `familyMoiVoiEm`);
 *   · nhóm đã gặp ⇒ KHÔNG cấp cơ hội ⇒ 0 (không gọi làm lại một nhóm cũ là "chuyển giao").
 *
 * ÁNH XẠ TẠM (cần thầy xác nhận nhãn): kho hiện chỉ có `reviewed` theo CÂU, chưa có trạng thái duyệt theo FAMILY ⇒
 * điều kiện "family đã duyệt" dùng `reviewed` của chính câu đó + nhãn family không rỗng. Thiếu nhãn ⇒ KHÔNG cấp
 * (không bịa family, không tự nới). Lỗi đọc ⇒ tập rỗng (đúng "0 nếu không có cơ hội"), KHÔNG đoán.
 */
export async function docCoHoiTransfer(env: Env, sbd: string, ds: readonly { qid: string; group?: string }[]): Promise<Set<string>> {
  const ra = new Set<string>()
  try {
    const qids = [...new Set(ds.map((c) => c.qid))]
    if (qids.length === 0) return ra
    const r = await env.DB.prepare(
      `SELECT q.qid, COALESCE(q.content_group, '') AS nhom, ${SQL_NHAN_FAMILY} AS family
         FROM game_v2_question q
         JOIN de_kho d ON d.ma_de = q.ma_de
         JOIN game_v2_index g ON g.ma_de = d.ma_de AND g.source_version = d.cap_nhat_luc
        WHERE COALESCE(d.da_xoa, 0) = 0 AND ${SQL_NHAN_FAMILY} IS NOT NULL AND json_extract(q.json, '$.reviewed') = 1
          AND q.qid IN (SELECT value FROM json_each(?))`,
    ).bind(JSON.stringify(qids)).all<{ qid: string; nhom: string; family: string }>()
    const ung = (r.results ?? []).filter((x) => x.family)
    if (ung.length === 0) return ra
    const da = await env.DB.prepare(
      `SELECT DISTINCT COALESCE(q.content_group, '') AS nhom FROM su_kien_hoc k JOIN game_v2_question q ON q.qid = k.qid
        WHERE k.sbd = ? AND k.ket_qua IS NOT NULL`,
    ).bind(sbd).all<{ nhom: string }>()
    const daGap = new Set((da.results ?? []).map((x) => String(x.nhom)))
    for (const x of ung) if (!daGap.has(String(x.nhom))) { ra.add(String(x.qid)); ra.add(String(x.nhom)) }
  } catch {
    /* thiếu nhãn/bảng ⇒ không cấp cơ hội (transferValue = 0), KHÔNG đoán */
  }
  return ra
}

/**
 * KHOẢNG ÔN THẬT theo `content_group` (RV07 — §7.2 `intervalSeconds`): khoảng giữa lần **review trước** (mốc cuối
 * cùng em đã trả lời câu thuộc nhóm đó, đọc từ SỔ) và **mốc đến hạn hiện tại** (hồ sơ). Sàn 1 ngày (`86400 s`).
 * Chưa có bằng chứng (chưa trả lời nhóm đó / chưa có mốc) ⇒ KHÔNG trả giá trị giả: nhóm đó không có mặt trong map
 * và nơi chấm dùng nhánh fallback sàn 1 ngày (ghi rõ, KHÔNG coi là cá nhân hóa đầy đủ).
 */
export async function docKhoangOnTheoNhom(
  env: Env, sbd: string, nhomCuaUngVien: readonly string[], mocDenHanTheoNhom: ReadonlyMap<string, number>,
): Promise<Map<string, number>> {
  const ra = new Map<string, number>()
  const nhom = [...new Set(nhomCuaUngVien.map((g) => String(g ?? '').trim()).filter(Boolean))]
  if (nhom.length === 0) return ra
  try {
    const r = await env.DB.prepare(
      `SELECT q.content_group AS nhom, MAX(k.luc) AS luc FROM su_kien_hoc k JOIN game_v2_question q ON q.qid = k.qid
        WHERE k.sbd = ? AND k.ket_qua IS NOT NULL AND q.content_group IN (SELECT value FROM json_each(?))
        GROUP BY 1`,
    ).bind(sbd, JSON.stringify(nhom)).all<{ nhom: string; luc: string }>()
    for (const x of r.results ?? []) {
      const due = mocDenHanTheoNhom.get(String(x.nhom))
      const luc = Date.parse(String(x.luc))
      if (due === undefined || !Number.isFinite(luc) || !Number.isFinite(due)) continue
      ra.set(String(x.nhom), Math.max(86_400_000, due - luc))
    }
  } catch {
    /* thiếu chỉ mục/bảng ⇒ không có khoảng ôn thật */
  }
  return ra
}

/**
 * FAMILY em ĐÃ GẶP (RV07 — `transferValue`): family (nhãn trong kho) của những câu em đã có kết quả trong sổ.
 * Nhãn đọc bằng `SQL_NHAN_FAMILY` (khớp `familyTuNhan`). Không bịa nhãn: family rỗng bị loại.
 */
export async function docFamilyDaGap(env: Env, sbd: string): Promise<Set<string>> {
  const ra = new Set<string>()
  try {
    const r = await env.DB.prepare(
      `SELECT DISTINCT ${SQL_NHAN_FAMILY} AS family FROM su_kien_hoc k JOIN game_v2_question q ON q.qid = k.qid
        WHERE k.sbd = ? AND k.ket_qua IS NOT NULL AND ${SQL_NHAN_FAMILY} IS NOT NULL`,
    ).bind(sbd).all<{ family: string }>()
    for (const x of r.results ?? []) if (x.family) ra.add(String(x.family))
  } catch {
    /* thiếu nhãn/bảng ⇒ rỗng */
  }
  return ra
}

/**
 * ĐỢT DẠY LẠI THEO **KỸ NĂNG** (RV07 — `repairNeed`): đọc bản dựng P03 (`skill_snapshot`: `episode_state`) và
 * quy về trạng thái đợt của §7.2. Đây là nguồn THEO KỸ NĂNG (không suy thành thạo chỉ từ hồ sơ một câu);
 * câu nhiều kỹ năng lấy đợt mở của kỹ năng THẤP NHẤT đang mở (ưu tiên `needs_teaching` trước `practicing`).
 */
export async function docRepairTheoKyNang(env: Env, sbd: string): Promise<Map<string, TrangThaiDot>> {
  const ra = new Map<string, TrangThaiDot>()
  try {
    const bang = await docNangLucEm(env, sbd)
    for (const s of bang?.skills ?? []) {
      const st = String(s.dotDangMo?.state ?? '')
      if (st === 'needs_teaching' || st === 'practicing') ra.set(s.skillId, st)
    }
  } catch {
    /* chưa áp migration/chưa dựng ⇒ rỗng (không suy đoán) */
  }
  return ra
}

/**
 * COVERAGE THEO **PLAN HÔM NAY** (RV07 — `coverage` = số task cùng skill đã hoàn tất HOẶC đang giữ chỗ, cả plan):
 *   · task đã hoàn tất: việc trong `ke_hoach_ngay.viec_json` có qid đã có KẾT QUẢ trong sổ hôm nay;
 *   · đang giữ chỗ: dòng `giu_cho` còn hiệu lực của hôm nay (kể cả xuyên ngày).
 * Trả về `skill → số task` (theo kỹ năng của CHÍNH qid đó, đọc từ kho). Lỗi/thiếu ⇒ map rỗng (không bịa).
 */
export async function docCoverageTheoPlan(
  env: Env, sbd: string, ngay: string, nowMs: number,
): Promise<Map<string, number>> {
  const ra = new Map<string, number>()
  try {
    const viec: { chiTiet?: { qid?: unknown } }[] = []
    const row = await env.DB.prepare('SELECT viec_json FROM ke_hoach_ngay WHERE sbd = ? AND ngay = ? LIMIT 1').bind(sbd, ngay).first<{ viec_json: string }>()
    if (row) {
      try {
        const v = JSON.parse(String(row.viec_json)) as { viec?: unknown }
        if (Array.isArray(v.viec)) viec.push(...(v.viec as { chiTiet?: { qid?: unknown } }[]))
      } catch { /* kế hoạch hỏng ⇒ chỉ còn phần giữ chỗ */ }
    }
    const qidKeHoach = viec.flatMap((x) => (Array.isArray(x.chiTiet?.qid) ? (x.chiTiet!.qid as string[]) : []))
    const daXong = new Set<string>()
    if (qidKeHoach.length) {
      const r = await env.DB.prepare(
        'SELECT DISTINCT qid FROM su_kien_hoc WHERE sbd = ? AND ngay_vn = ? AND ket_qua IS NOT NULL AND qid IN (SELECT value FROM json_each(?))',
      ).bind(sbd, ngay, JSON.stringify(qidKeHoach)).all<{ qid: string }>()
      for (const x of r.results ?? []) daXong.add(String(x.qid))
    }
    const dangGiu = new Set((await docCho(env, sbd, nowMs)).keys())
    const demTheoQid = new Map<string, number>()
    for (const id of qidKeHoach) {
      const xong = daXong.has(id)
      const giu = dangGiu.has(id)
      if (!xong && !giu) continue
      demTheoQid.set(id, (demTheoQid.get(id) ?? 0) + 1)
    }
    if (demTheoQid.size === 0) return ra
    // Kỹ năng của từng qid: đọc CHÍNH kho (một truy vấn cho cả tập).
    const r2 = await env.DB.prepare('SELECT qid, json FROM game_v2_question WHERE qid IN (SELECT value FROM json_each(?))')
      .bind(JSON.stringify([...demTheoQid.keys()])).all<{ qid: string; json: string }>()
    for (const x of r2.results ?? []) {
      let kt: string[] = []
      try {
        const j = JSON.parse(String(x.json)) as { kienThuc?: unknown }
        kt = Array.isArray(j.kienThuc) ? (j.kienThuc as string[]) : []
      } catch { continue }
      for (const s of kt) ra.set(s, (ra.get(s) ?? 0) + (demTheoQid.get(String(x.qid)) ?? 0))
    }
  } catch {
    /* thiếu bảng/cột ⇒ rỗng */
  }
  return ra
}

/**
 * NHÃN FAMILY của một câu, đọc từ CHÍNH bản ghi kho (`family` hoặc `familyId`) — KHO THẬT hiện CHƯA có nhãn
 * (P02) nên trả `null` ⇒ câu đi trần "chưa gán family" của 02 §4.2.6. Khi thầy gắn nhãn vào kho thì pipeline
 * dùng ngay, KHÔNG cần sửa thêm. KHÔNG suy nhãn từ qid/group (không bịa family).
 */
export function familyTuNhan(q: unknown): string | null {
  if (!q || typeof q !== 'object') return null
  const j = q as { family?: unknown; familyId?: unknown }
  for (const v of [j.family, j.familyId]) {
    if (typeof v === 'string' && v.trim()) return v.trim()
  }
  return null
}

export interface HangHoSoCau {
  trangThai: string
  canDayLai: boolean
}

/** Đọc trạng thái hồ sơ mạnh–yếu của đúng các câu ứng viên (một truy vấn; lỗi đọc ⇒ rỗng). */
export async function docHoSoCau(env: Env, sbd: string, qids: readonly string[]): Promise<Map<string, HangHoSoCau>> {
  const ra = new Map<string, HangHoSoCau>()
  const ds = [...new Set(qids.filter(Boolean))]
  if (ds.length === 0) return ra
  try {
    const r = await env.DB.prepare(
      'SELECT qid, trang_thai, can_day_lai FROM nam_kt_cau WHERE sbd = ? AND qid IN (SELECT value FROM json_each(?))',
    ).bind(sbd, JSON.stringify(ds)).all<{ qid: string; trang_thai: string; can_day_lai: number }>()
    for (const x of r.results ?? []) ra.set(String(x.qid), { trangThai: String(x.trang_thai ?? ''), canDayLai: Number(x.can_day_lai) === 1 })
  } catch {
    /* chưa dựng hồ sơ ⇒ coi như không có đợt dạy lại (không chặn oan) */
  }
  return ra
}

/**
 * Quy đổi trạng thái TỪNG CÂU (hồ sơ mạnh–yếu) sang trạng thái ĐỢT DẠY LẠI của §7.2.
 * Đây là CẦU NỐI ngắn giữa hồ sơ per-câu đang chạy và mô hình đợt theo KỸ NĂNG của P03 (`nang-luc.ts`).
 */
export function trangThaiDotTuHoSoCau(h: HangHoSoCau | undefined): TrangThaiDot {
  if (!h) return null
  if (h.canDayLai) return 'needs_teaching'
  if (h.trangThai === 'moi_sai') return 'practicing'
  if (h.trangThai === 'da_khac_phuc') return 'recovered'
  return null
}

/**
 * MỨC ĐANG LUYỆN của một câu = mức THẤP NHẤT trong **MỌI** kỹ năng của câu.
 *
 * RV04 (rà soát độc lập 01): bản cũ `map(...).filter(bỏ undefined)` đã **bỏ qua** kỹ năng CHƯA có hồ sơ,
 * nên câu [skill A mức 2, skill B chưa có hồ sơ] bị coi là mức 2 ⇒ NÂNG trần độ khó trái đặc tả.
 * Nay: kỹ năng thiếu hồ sơ đi theo **nhánh chưa đủ bằng chứng = mức 0** (02 §4.2/§7.1); giá trị không hữu hạn,
 * không nguyên, hoặc ngoài miền {0,1,2} cũng về 0 (KHÔNG nâng trần từ dữ liệu hỏng). Câu không có kỹ năng ⇒ 0.
 */
export function mucDangLuyen(c: CauUngVien, mucTheoKyNang: ReadonlyMap<string, number>): number {
  if (c.skillIds.length === 0) return 0
  let thapNhat = 2
  for (const s of c.skillIds) {
    const raw = mucTheoKyNang.get(s)
    const hopLe = typeof raw === 'number' && Number.isFinite(raw) && Number.isInteger(raw) && raw >= 0 && raw <= 2
    const v = hopLe ? raw : 0
    if (v < thapNhat) thapNhat = v
  }
  return thapNhat
}

/**
 * NGỮ CẢNH CHỐNG LẶP của một lượt, đọc từ D1 THẬT (không bịa nhãn):
 *   · `daLamHomNay`   = `content_group` đã có kết quả hôm nay (chong-lap.ts).
 *   · `taskDangMo`    = `content_group` → taskId của chỗ ĐANG GIỮ, kể cả CÒN HIỆU LỰC QUA NGÀY (bảng `giu_cho`).
 *   · `familyLanCuoi` = family → ngày VN gần nhất family có bằng chứng, đọc từ SỔ cho ĐÚNG các family của ứng viên
 *     (RV03: trước đây để rỗng nên luật giãn family không hoạt động dù kho đã có nhãn). Kho chưa gắn nhãn ⇒ rỗng.
 */
export async function docNguCanhChongLap(
  env: Env, sbd: string, ngay: string, nowMs: number, familyCuaUngVien: readonly string[] = [],
): Promise<{ daLamHomNay: Set<string>; taskDangMo: Map<string, string>; familyLanCuoi: Map<string, string> }> {
  const daLamHomNay = (await docDaLamHomNay(env, [sbd], ngay)).get(sbd) ?? new Set<string>()
  const taskDangMo = new Map<string, string>()
  try {
    const r = await env.DB.prepare(
      "SELECT q.content_group, g.task_id FROM giu_cho g JOIN game_v2_question q ON q.qid = g.qid WHERE g.sbd = ? AND ((g.het_han_task > 0 AND g.het_han_task > ?) OR (g.het_han_task = 0 AND g.lease_until >= ?)) AND COALESCE(q.content_group, '') <> ''",
    ).bind(sbd, nowMs, nowMs).all<{ content_group: string; task_id: string }>()
    for (const x of r.results ?? []) taskDangMo.set(String(x.content_group), String(x.task_id))
  } catch {
    /* chưa áp migration bảng giữ chỗ ⇒ coi như chưa có nhiệm vụ nào đang mở */
  }
  const familyLanCuoi = new Map<string, string>()
  const families = [...new Set(familyCuaUngVien.map((f) => String(f ?? '').trim()).filter(Boolean))]
  if (families.length) {
    try {
      // MỘT truy vấn cho cả tập family của ứng viên; nguồn: SỔ (`su_kien_hoc`) ⋈ kho (nhãn family trong JSON).
      // NHÃN đọc bằng CHÍNH biểu thức dùng chung (`SQL_NHAN_FAMILY`: `family` rồi `familyId`) để kho ghi kiểu nào cũng khớp.
      const r = await env.DB.prepare(
        `SELECT ${SQL_NHAN_FAMILY} AS family, MAX(k.ngay_vn) AS ngay
           FROM su_kien_hoc k JOIN game_v2_question q ON q.qid = k.qid
          WHERE k.sbd = ? AND k.ket_qua IS NOT NULL
            AND ${SQL_NHAN_FAMILY} IN (SELECT value FROM json_each(?))
          GROUP BY 1`,
      ).bind(sbd, JSON.stringify(families)).all<{ family: string; ngay: string }>()
      for (const x of r.results ?? []) if (x.family) familyLanCuoi.set(String(x.family), String(x.ngay))
    } catch {
      /* thiếu chỉ mục/cột ⇒ coi như chưa có lịch sử family (không chặn oan) */
    }
  }
  return { daLamHomNay, taskDangMo, familyLanCuoi }
}

/** Ứng viên + `repeat_reason` khi được phát (ngoại lệ của luật giãn family phải giải thích được). */
export type CauDuocPhep = CauUngVien & { repeatReason?: LyDoNgoaiLe; dungLaiTask?: string }

/**
 * LỌC LUẬT LẶP theo 02 §4.2 bằng CHÍNH SÁCH THUẦN trong `chong-lap.ts` — RV03: trước đây adapter tự viết
 * lại luật rồi BỎ nhánh family; nay mọi ứng viên đi qua `chonTheoLuatChongLap`.
 *
 * RV05: hàm này **KHÔNG tự cắt trần số câu của lượt** nữa (trần chỉ áp lên KẾT QUẢ CHỌN CUỐI, sau khi đã lọc
 * độ khó và chấm điểm) — nơi gọi truyền `tranCau` bằng số ứng viên khi muốn xem toàn bộ tập hợp lệ.
 * Trả `duocPhep` (đủ điều kiện phát), `dungLai` (đã phát cho NHIỆM VỤ ĐANG MỞ ⇒ TRẢ LẠI task cũ) và `loai`.
 */
export async function locTheoLuatLap(
  env: Env, sbd: string, ngay: string, ds: readonly CauUngVien[], tranCau?: number,
  tuyChon: {
    nowMs?: number
    mastery?: readonly { key: string; due: number }[]
    hoSoCau?: ReadonlyMap<string, HangHoSoCau>
    daChon?: readonly DaChonTrongLuot[]
  } = {},
): Promise<{ duocPhep: CauDuocPhep[]; dungLai: Map<string, string>; loai: Map<string, string>; thieu: number; ung: Map<string, UngVienLap> }> {
  const nowMs = tuyChon.nowMs ?? Date.now()
  const hoSoCau = tuyChon.hoSoCau ?? new Map<string, HangHoSoCau>()
  const mastery = tuyChon.mastery ?? []
  const ung: UngVienLap[] = ds.map((c) => {
    const due = mastery.find((m) => m.key === c.dangKey)?.due ?? null
    const dot = trangThaiDotTuHoSoCau(hoSoCau.get(c.qid))
    const denHan = due !== null && due <= nowMs
    const purpose = dot === 'needs_teaching' || dot === 'practicing' || dot === 'recovered'
      ? 'repair'
      : denHan ? 'due_review' : 'maintenance'
    return {
      qid: c.qid, contentGroup: c.group, familyId: c.familyId ?? null,
      difficulty: (typeof c.mucDo === 'string' ? mucTuChu(c.mucDo) : 0) as 0 | 1 | 2,
      skillIds: c.skillIds, denHan, purpose,
    }
  })
  const ctx = await docNguCanhChongLap(env, sbd, ngay, nowMs, ds.map((c) => c.familyId ?? ''))
  const theoQid = new Map(ds.map((c) => [c.qid, c]))
  // RV05: LIỆT KÊ độc lập — mỗi ứng viên xét với `daChon` THỰC, không cộng dồn, không áp trần lượt.
  const kq = lietKeUngVienHopLe(ung, {
    homNay: ngay,
    taskDangMo: ctx.taskDangMo,
    daLamHomNay: ctx.daLamHomNay,
    familyLanCuoi: ctx.familyLanCuoi,
    daChon: tuyChon.daChon,
  })
  const duocPhep: CauDuocPhep[] = []
  const dungLai = new Map<string, string>()
  for (const v of kq.duocPhep) {
    if (v.dungLaiTask) { dungLai.set(v.qid, v.dungLaiTask); continue }
    const goc = theoQid.get(v.qid)
    if (!goc) continue
    duocPhep.push(v.repeatReason ? { ...goc, repeatReason: v.repeatReason } : { ...goc })
  }
  const loai = new Map<string, string>()
  for (const x of kq.loai) loai.set(x.qid, x.lyDo)
  const tran = Number.isFinite(tranCau) ? Math.max(0, Math.floor(tranCau as number)) : duocPhep.length
  return { duocPhep, dungLai, loai, thieu: Math.max(0, tran - duocPhep.length), ung: new Map(ung.map((u) => [u.qid, u])) }
}

/**
 * Mức đang luyện theo KỸ NĂNG của một em, đọc từ bản dựng P03 (`skill_snapshot`).
 * Đường này CHỈ ĐỌC (không dựng lại) nên không tốn truy vấn sổ; chưa có bản dựng ⇒ map rỗng và
 * `fit` coi như cùng mức (KHÔNG bịa mức cho em).
 */
export async function mucTheoKyNangCuaEm(env: Env, sbd: string): Promise<Map<string, number>> {
  const ra = new Map<string, number>()
  try {
    const bang = await docNangLucEm(env, sbd)
    for (const s of bang?.skills ?? []) ra.set(s.skillId, s.workingLevel)
  } catch {
    /* chưa áp migration/chưa dựng ⇒ rỗng */
  }
  return ra
}


/** Số câu mặc định của một lượt khi nơi gọi không truyền trần (§7.2: gói ≤6 câu, có thể ít hơn). */
export const SO_CAU_LUOT_MAC_DINH = 6

export type ChonCauInput = Omit<XepLuotInput, 'mucTheoKyNang' | 'hoSoCau'> & {
  /** Ngân sách còn lại của ngày (giây). Vắng = KHÔNG cắt theo ngân sách (hành vi cũ). */
  conLaiGiay?: number | null
  tranCau?: number
  /** Vắng ⇒ `chonCauChoLuot` tự đọc từ bản dựng P03 (`skill_snapshot`). */
  mucTheoKyNang?: ReadonlyMap<string, number>
  /** Vắng ⇒ `chonCauChoLuot` tự đọc `nam_kt_cau` cho đúng các câu ứng viên. */
  hoSoCau?: ReadonlyMap<string, HangHoSoCau>
}

export interface ChonCauKetQua {
  /** Câu ĐƯỢC CHỌN, đã sắp theo §7.2 và vừa ngân sách. */
  chon: { qid: string; version: string; part: 'I' | 'II' | 'III'; diem: KetQuaDiem; solveSeconds: number; taskSeconds: number; repeatReason?: LyDoNgoaiLe }[]
  /** Đếm câu bị loại theo TỪNG nguyên nhân §7.1 (cho giáo viên; KHÔNG lộ qid đề bảo vệ). */
  lyDo: Record<string, number>
  /** Số câu hoãn vì hết ngân sách ngày. */
  deferredCount: number
  /** Tổng giây của các câu bị hoãn (thầy thấy mức vượt tải). */
  overBudgetSeconds: number
  /** Chỗ đang bị giữ (hiệu lực) trong ngày của em. */
  dangGiu: Map<string, { taskId: string; leaseUntil: number }>
  /** `content_group` → taskId: đã phát cho NHIỆM VỤ ĐANG MỞ ⇒ nơi gọi phải TRẢ LẠI task cũ (04 §2). */
  dungLaiTask: Map<string, string>
}

/**
 * BỘ CHỌN CHUNG §7.1 cho MỘT lượt/nhiệm vụ: chạy ĐÚNG thứ tự hard filter của 02 §7.1
 * (giữ chỗ hiệu lực + lượt làm hôm nay → trần độ khó theo mức đang luyện → điểm §7.2 →
 * fit ngân sách greedy) rồi trả lý do bị loại theo nguyên nhân.
 *
 * KHÔNG bước nào nới quyền/nới mức để có thêm câu: hết ứng viên ⇒ lượt NGẮN (có thể 0 câu).
 * Bước cuối `atomic reserve` do nơi gọi làm sau khi đã có danh sách (xem `giuCho`).
 */
export async function chonCauChoLuot(env: Env, ds: readonly CauUngVien[], inp: ChonCauInput): Promise<ChonCauKetQua> {
  const lyDo: Record<string, number> = {}
  const dem = (k: string) => { lyDo[k] = (lyDo[k] ?? 0) + 1 }
  const dangGiu = await docCho(env, inp.sbd, inp.nowMs)
  const muc = inp.mucTheoKyNang ?? await mucTheoKyNangCuaEm(env, inp.sbd)
  const tranCau = Number.isFinite(inp.tranCau) ? Math.max(0, Math.floor(inp.tranCau as number)) : SO_CAU_LUOT_MAC_DINH

  // ── RV07: đọc ĐỦ nguồn thật cho §7.2 (mỗi nguồn một lượt đọc, không đọc theo từng câu) ────────────────
  const hoSoCau = inp.hoSoCau ?? await docHoSoCau(env, inp.sbd, ds.map((c) => c.qid))
  // `moc đến hạn` theo NHÓM (khoá `dangKey` của hồ sơ → nhóm nội dung) để suy KHOẢNG ÔN thật.
  const mocDenHanTheoNhom = new Map<string, number>()
  for (const c of ds) {
    const due = inp.mastery.find((m) => m.key === c.dangKey)?.due
    if (typeof due === 'number' && c.group) mocDenHanTheoNhom.set(c.group, due)
  }
  const khoangOnTheoNhom = inp.khoangOnTheoNhom ?? await docKhoangOnTheoNhom(env, inp.sbd, ds.map((c) => c.group), mocDenHanTheoNhom)
  const familyDaGap = inp.familyDaGap ?? await docFamilyDaGap(env, inp.sbd)
  // RV07: nguồn CẤP cơ hội transfer (§7.2) — chỉ đọc khi nơi gọi KHÔNG truyền tập đã cấp.
  const transferChoPhep = inp.transferChoPhep ?? await docCoHoiTransfer(env, inp.sbd, ds)
  const repairTheoKyNang = inp.repairTheoKyNang ?? await docRepairTheoKyNang(env, inp.sbd)
  const coverageTheoPlan = inp.coverageTheoPlan ?? await docCoverageTheoPlan(env, inp.sbd, inp.ngay, inp.nowMs)
  const dungChung: XepLuotInput = {
    sbd: inp.sbd, ngay: inp.ngay, mastery: inp.mastery, mucTheoKyNang: muc, hoSoCau, nowMs: inp.nowMs,
    mauTocDo: inp.mauTocDo, phienBanKeHoach: inp.phienBanKeHoach, khoangOnTheoNhom, familyDaGap,
    transferChoPhep, coverageTheoPlan, repairTheoKyNang, probeChoPhep: inp.probeChoPhep,
  }

  // §7.1 bước 3–6 trên TOÀN BỘ tập ứng viên (RV05: KHÔNG cắt 6 câu trước khi lọc).
  //   · độ khó: trần theo MỨC ĐANG LUYỆN (min của MỌI skill; thiếu hồ sơ = 0), probe hợp lệ = +1 và ≤2;
  //   · nguồn còn sống: câu đã chết trong kho thì `docCho`/scope đã lo;
  //   · luật lặp/family: chạy TRONG vòng lặp chọn bên dưới (cần `daChon` của lượt đang hình thành).
  const quaKho: CauUngVien[] = []
  for (const c of ds) {
    const working = mucDangLuyen(c, muc)
    const difficulty = typeof c.mucDo === 'string' ? mucTuChu(c.mucDo) : 0
    const tran = inp.probeChoPhep ? Math.min(2, working + 1) : working
    if (difficulty > tran) { dem('DIFFICULTY_LIMIT'); continue }
    quaKho.push(c)
  }

  // §7.2 bước 7–9: mỗi vòng — (a) xét LUẬT LẶP/FAMILY theo `daChon` hiện tại, (b) chấm điểm §7.2,
  // (c) chọn câu điểm cao nhất VỪA ngân sách còn lại. Trần `tranCau` chỉ áp lên KẾT QUẢ CUỐI (RV05).
  const conLaiCoTran = inp.conLaiGiay !== undefined && inp.conLaiGiay !== null
  let conLai = conLaiCoTran ? Math.max(0, Math.floor(inp.conLaiGiay as number)) : 0
  const chon: ChonCauKetQua['chon'] = []
  const daChonSkill = new Map<string, readonly string[]>()
  const dungLaiTask = new Map<string, string>()
  // Nhãn family theo qid (kho chưa gắn ⇒ `null` ⇒ trần "chưa gán family" của §4.2.6 áp đúng).
  const familyTheoQid = new Map(ds.map((c) => [c.qid, c.familyId ?? null]))
  /** Ứng viên đã hoá (family/purpose thật) của những câu ĐÃ CHỌN — dùng cho luật family/repeat ở vòng sau. */
  const ungTheoQidDaChon = new Map<string, UngVienLap>()
  let ung = [...quaKho]
  while (ung.length && chon.length < tranCau) {
    // (a) LIỆT KÊ ứng viên HỢP LỆ (RV05): mỗi ứng viên xét ĐỘC LẬP với tập ĐÃ CHỌN THỰC (`chon`), không cộng dồn,
    // không áp trần lượt ở bước này ⇒ trần 6 không cắt mất câu thứ 7 và câu tốt hơn trong cùng family không bị
    // che bởi câu đứng trước trong pool. Trần do CHÍNH vòng lặp này giữ trên kết quả cuối.
    const { duocPhep, dungLai, loai, ung: ungTheoQid } = await locTheoLuatLap(env, inp.sbd, inp.ngay, ung, tranCau, {
      nowMs: inp.nowMs, mastery: inp.mastery, hoSoCau,
      daChon: chon.map((c) => {
        const goc = ungTheoQidDaChon.get(c.qid)
        return {
          qid: c.qid, familyId: goc?.familyId ?? familyTheoQid.get(c.qid) ?? null,
          purpose: goc?.purpose ?? 'maintenance', contentGroup: goc?.contentGroup ?? '',
        }
      }),
    })
    for (const [qid, taskId] of dungLai) dungLaiTask.set(qid, taskId)
    for (const [qid, u] of ungTheoQid) ungTheoQidDaChon.set(qid, u)
    // `TRAN_LUOT` của policy là TRẦN LƯỢT (do chính vòng lặp này giữ theo RV05) — không đếm lại vào bản đồ lý do.
    for (const r of loai.values()) if (r !== 'TRAN_LUOT') dem(r)
    if (duocPhep.length === 0) break
    // (b)+(c) chấm điểm trên tập HỢP LỆ rồi lấy câu vừa ngân sách tốt nhất.
    const xep = await xepLuotTheoChinhSach(duocPhep, {
      ...dungChung,
      daChon: chon.map((c) => ({ qid: c.qid, part: c.part, solveSeconds: c.solveSeconds, skillIds: daChonSkill.get(c.qid) ?? [] })),
    })
    const vua = xep.xep.find((v) => !conLaiCoTran || v.taskSeconds <= conLai)
    if (!vua) break // còn hợp lệ nhưng KHÔNG vừa ngân sách ⇒ hoãn phần còn lại (không nhét, không nới)
    const goc = duocPhep.find((u) => u.qid === vua.qid)!
    chon.push({
      qid: vua.qid, version: goc.version, part: goc.part, diem: vua.diem,
      solveSeconds: vua.solveSeconds, taskSeconds: vua.taskSeconds,
      ...(goc.repeatReason ? { repeatReason: goc.repeatReason } : {}),
    })
    daChonSkill.set(vua.qid, goc.skillIds)
    if (conLaiCoTran) conLai -= vua.taskSeconds
    ung = ung.filter((u) => u.qid !== vua.qid)
  }
  // Hoãn vì NGÂN SÁCH: chỉ tính phần CÒN CHỖ trong lượt (trần `tranCau` vẫn do vòng lặp giữ) và chỉ gồm câu
  // mà luật cho phép phát ⇒ `deferred_count` = số câu thầy phải xếp thêm chỗ nếu muốn phát hết.
  let deferredCount = 0
  let overBudgetSeconds = 0
  const conChoLuot = Math.max(0, tranCau - chon.length)
  if (ung.length && conLaiCoTran && conChoLuot > 0) {
    const { duocPhep } = await locTheoLuatLap(env, inp.sbd, inp.ngay, ung, tranCau + chon.length, { nowMs: inp.nowMs, mastery: inp.mastery, hoSoCau })
    const cuoi = await xepLuotTheoChinhSach(duocPhep, { ...dungChung })
    const hanChe = cuoi.xep.slice(0, conChoLuot)
    deferredCount = hanChe.length
    overBudgetSeconds = hanChe.reduce((s, v) => s + v.taskSeconds, 0)
    if (deferredCount > 0) dem('BUDGET_EXHAUSTED')
  }
  return { chon, lyDo, deferredCount, overBudgetSeconds, dangGiu, dungLaiTask }
}

export interface XepLuotInput {
  sbd: string
  ngay: string
  /** `mastery` đã qua `masteryTheoHoSo` (mốc ôn THẬT của hồ sơ). */
  mastery: readonly { key: string; due: number }[]
  /** Mức đang luyện theo kỹ năng (từ `skill_snapshot` của P03). */
  mucTheoKyNang: ReadonlyMap<string, number>
  /** Trạng thái hồ sơ mạnh–yếu của các ứng viên (từ `docHoSoCau`). */
  hoSoCau: ReadonlyMap<string, HangHoSoCau>
  nowMs: number
  /** Mẫu tốc độ (P05 §5.1); rỗng ⇒ hệ số 1. */
  mauTocDo?: readonly MauThoiGian[]
  /** Đã chọn trong lượt trước đó (để tính `coverage`/`fatigue`). */
  daChon?: readonly { qid: string; part: 'I' | 'II' | 'III'; solveSeconds: number; skillIds: readonly string[] }[]
  // ── RV07 (02 §7.2): DỮ LIỆU THẬT cho từng thành phần điểm ─────────────────────────────────────
  /** Phiên bản plan THẬT cho khoá hash `student|day|plan_version|qid|version` (vắng ⇒ `PHIEN_BAN_KE_HOACH`). */
  phienBanKeHoach?: number
  /** `content_group` → khoảng ôn THẬT (ms) giữa lần review trước và mốc đến hạn (`docKhoangOnTheoNhom`). */
  khoangOnTheoNhom?: ReadonlyMap<string, number>
  /** Family em ĐÃ GẶP (`docFamilyDaGap`) — để `transferValue` biết family nào KHÔNG mới với em. */
  familyDaGap?: ReadonlySet<string>
  /** `qid` hoặc `content_group` được MÁY CHỦ cấp cơ hội chuyển giao (§7.2) — rỗng ⇒ `transferValue = 0`. */
  transferChoPhep?: ReadonlySet<string>
  /** `skill` → số task cùng skill đã hoàn tất/giữ chỗ trong PLAN hôm nay (`docCoverageTheoPlan`). */
  coverageTheoPlan?: ReadonlyMap<string, number>
  /** `skill` → ĐỢT DẠY LẠI đang mở theo KỸ NĂNG (`docRepairTheoKyNang`, P03) — ưu tiên hơn hồ sơ từng câu. */
  repairTheoKyNang?: ReadonlyMap<string, TrangThaiDot>
  /** Bật probe hợp lệ cho cả lượt (dùng khi nơi gọi đã cấp; mặc định theo từng câu). */
  probeChoPhep?: boolean
}

export interface KetQuaXepLuot {
  xep: { qid: string; diem: KetQuaDiem; solveSeconds: number; taskSeconds: number }[]
  /** Điểm + thời gian theo qid để nơi gọi cắt ngân sách mà không phải tính lại. */
  theoQid: Map<string, { diem: KetQuaDiem; solveSeconds: number; taskSeconds: number }>
}

/**
 * Tính ĐIỂM §7.2 cho từng câu ứng viên bằng dữ liệu THẬT rồi sắp thứ tự tất định.
 * KHÔNG lọc bỏ câu nào (hard filter đã chạy trước ở P02/P04) và KHÔNG nới bảo vệ nào.
 */
export async function xepLuotTheoChinhSach(ds: readonly CauUngVien[], inp: XepLuotInput): Promise<KetQuaXepLuot> {
  const theoQid = new Map<string, { diem: KetQuaDiem; solveSeconds: number; taskSeconds: number }>()
  const diemTheo: CauChonDiem[] = []
  const diemSo = new Map<string, number>()
  const daChon = [...(inp.daChon ?? [])]

  for (const c of ds) {
    const difficulty = (typeof c.mucDo === 'string' ? mucTuChu(c.mucDo) : 0) as 0 | 1 | 2
    const uoc = uocLuongMotCau({ qid: c.qid, part: c.part, difficulty }, { mau: inp.mauTocDo ?? [], nowMs: inp.nowMs })
    const due = inp.mastery.find((m) => m.key === c.dangKey)?.due ?? null
    const hoSo = inp.hoSoCau.get(c.qid)
    const soTaskCungSkill = daChon.filter((x) => x.skillIds.some((s) => c.skillIds.includes(s))).length
      + c.skillIds.reduce((t, s) => t + (inp.coverageTheoPlan?.get(s) ?? 0), 0) // RV07: coverage tính CẢ PLAN hôm nay
    const haiTaskTruoc = daChon.slice(-2).map((x) => ({ part: x.part, solveSeconds: x.solveSeconds }))
    // RV07: ĐỢT DẠY LẠI theo KỸ NĂNG (P03) ưu tiên hơn hồ sơ từng câu; không có ⇒ mới dùng hồ sơ câu.
    const dotKyNang = c.skillIds.map((s) => inp.repairTheoKyNang?.get(s)).find((x): x is TrangThaiDot => x === 'needs_teaching' || x === 'practicing') ?? null
    const family = c.familyId ?? null
    const diem = chamDiem(
      {
        qid: c.qid, version: c.version, part: c.part, difficulty, familyId: family,
        // `transferValue` (§7.2): chỉ khi MÁY CHỦ cấp cơ hội; `familyMoiVoiEm` = family chưa từng gặp (đọc từ sổ).
        transferChoPhep: Boolean(inp.transferChoPhep?.has(c.qid) || inp.transferChoPhep?.has(c.group)),
        familyMoiVoiEm: family !== null && !(inp.familyDaGap?.has(family) ?? false),
      },
      {
        nowMs: inp.nowMs, trangThaiDot: dotKyNang ?? trangThaiDotTuHoSoCau(hoSo), workingLevel: mucDangLuyen(c, inp.mucTheoKyNang),
        dueMs: due, intervalMs: (c.group ? inp.khoangOnTheoNhom?.get(c.group) : undefined) ?? null, soTaskCungSkillTrongPlan: soTaskCungSkill,
        haiTaskTruoc, solveSeconds: uoc.solveSeconds, probeChoPhep: inp.probeChoPhep,
      },
    )
    diemTheo.push({ qid: c.qid, version: c.version, part: c.part, difficulty, familyId: family })
    diemSo.set(c.qid, diem.score)
    theoQid.set(c.qid, { diem, solveSeconds: uoc.solveSeconds, taskSeconds: uoc.taskSeconds })
  }

  // Khoá hash dùng PHIÊN BẢN PLAN THẬT khi nơi gọi có (RV07); vắng ⇒ hằng số phiên bản kế hoạch (KHÔNG dùng 0).
  const phienBan = Number.isFinite(inp.phienBanKeHoach) ? Math.max(1, Math.floor(inp.phienBanKeHoach as number)) : PHIEN_BAN_KE_HOACH
  const sap = await sapTheoDiem(diemTheo, diemSo, (c) => khoaHashSap(inp.sbd, inp.ngay, phienBan, c.qid, c.version))
  return {
    xep: sap.map((c) => {
      const t = theoQid.get(c.qid)!
      return { qid: c.qid, diem: t.diem, solveSeconds: t.solveSeconds, taskSeconds: t.taskSeconds }
    }),
    theoQid,
  }
}
