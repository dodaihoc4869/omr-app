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
import { chonTheoLuatChongLap, type DaChonTrongLuot, type LyDoNgoaiLe, type UngVienLap } from './chong-lap'
import { uocLuongMotCau, type MauThoiGian } from './uoc-luong-thoi-gian'
import { docNangLucEm } from './nang-luc-d1'
import { docDaLamHomNay } from './chong-lap'
import { docCho } from './giu-cho'
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
 *   · `taskDangMo`    = `content_group` → taskId của chỗ ĐANG GIỮ còn hiệu lực (bảng `giu_cho`).
 *   · `familyLanCuoi` = family → ngày gần nhất có bằng chứng; kho chưa gắn nhãn ⇒ RỖNG (không bịa).
 */
export async function docNguCanhChongLap(
  env: Env, sbd: string, ngay: string, nowMs: number,
): Promise<{ daLamHomNay: Set<string>; taskDangMo: Map<string, string>; familyLanCuoi: Map<string, string> }> {
  const daLamHomNay = (await docDaLamHomNay(env, [sbd], ngay)).get(sbd) ?? new Set<string>()
  const taskDangMo = new Map<string, string>()
  try {
    const r = await env.DB.prepare(
      "SELECT q.content_group, g.task_id FROM giu_cho g JOIN game_v2_question q ON q.qid = g.qid WHERE g.sbd = ? AND g.ngay = ? AND g.lease_until >= ? AND COALESCE(q.content_group, '') <> ''",
    ).bind(sbd, ngay, nowMs).all<{ content_group: string; task_id: string }>()
    for (const x of r.results ?? []) taskDangMo.set(String(x.content_group), String(x.task_id))
  } catch {
    /* chưa áp migration bảng giữ chỗ ⇒ coi như chưa có nhiệm vụ nào đang mở */
  }
  return { daLamHomNay, taskDangMo, familyLanCuoi: new Map() }
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
): Promise<{ duocPhep: CauDuocPhep[]; dungLai: Map<string, string>; loai: Map<string, string>; thieu: number }> {
  const nowMs = tuyChon.nowMs ?? Date.now()
  const ctx = await docNguCanhChongLap(env, sbd, ngay, nowMs)
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
  const theoQid = new Map(ds.map((c) => [c.qid, c]))
  const kq = chonTheoLuatChongLap(ung, {
    homNay: ngay,
    taskDangMo: ctx.taskDangMo,
    daLamHomNay: ctx.daLamHomNay,
    familyLanCuoi: ctx.familyLanCuoi,
    daChon: tuyChon.daChon,
    tranCau: Number.isFinite(tranCau) ? tranCau : ds.length,
  })
  const duocPhep: CauDuocPhep[] = []
  const dungLai = new Map<string, string>()
  for (const v of kq.chon) {
    if (v.dungLaiTask) { dungLai.set(v.qid, v.dungLaiTask); continue }
    const goc = theoQid.get(v.qid)
    if (!goc) continue
    duocPhep.push(v.repeatReason ? { ...goc, repeatReason: v.repeatReason } : { ...goc })
  }
  const loai = new Map<string, string>()
  for (const x of kq.loai) loai.set(x.qid, x.lyDo)
  return { duocPhep, dungLai, loai, thieu: Math.max(0, (Number.isFinite(tranCau) ? (tranCau as number) : ds.length) - duocPhep.length) }
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

export interface ChonCauInput {
  sbd: string
  ngay: string
  nowMs: number
  mastery: readonly { key: string; due: number }[]
  /** Ngân sách còn lại của ngày (giây). Vắng = KHÔNG cắt theo ngân sách (hành vi cũ). */
  conLaiGiay?: number | null
  tranCau?: number
  mucTheoKyNang?: ReadonlyMap<string, number>
  hoSoCau?: ReadonlyMap<string, HangHoSoCau>
  /** Probe hợp lệ do server cấp: cho phép khó hơn mức tối đa +1 và không quá 2 (§7.1). */
  probeChoPhep?: boolean
  mauTocDo?: readonly MauThoiGian[]
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
  const dangGiu = await docCho(env, inp.sbd, inp.ngay)
  const muc = inp.mucTheoKyNang ?? await mucTheoKyNangCuaEm(env, inp.sbd)
  const tranCau = Number.isFinite(inp.tranCau) ? Math.max(0, Math.floor(inp.tranCau as number)) : SO_CAU_LUOT_MAC_DINH

  // §7.1 bước 3–6 trên TOÀN BỘ tập ứng viên (RV05: KHÔNG cắt 6 câu trước khi lọc).
  //   · độ khó: trần theo MỨC ĐANG LUYỆN (min của MỌI skill; thiếu hồ sơ = 0), probe hợp lệ = +1 và ≤2;
  //   · nguồn còn sống: câu đã chết trong kho thì `docCho`/scope đã lo;
  //   · luật lặp/family: chạy TRONG vòng lặp chọn bên dưới (cần `daChon` của lượt đang hình thành).
  const hoSoCau = inp.hoSoCau ?? await docHoSoCau(env, inp.sbd, ds.map((c) => c.qid))
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
  let ung = [...quaKho]
  while (ung.length && chon.length < tranCau) {
    // (a) LUẬT LẶP + FAMILY (02 §4.2.6–4.2.7). Trần lượt truyền = `tranCau + số đã chọn` để CHÍNH VÒNG LẶP này
    // giữ trần (RV05: trần chỉ áp lên kết quả cuối); policy không được chặn oan khi pool còn ít câu.
    const { duocPhep, dungLai, loai } = await locTheoLuatLap(env, inp.sbd, inp.ngay, ung, tranCau + chon.length, {
      nowMs: inp.nowMs, mastery: inp.mastery, hoSoCau,
      daChon: chon.map((c) => ({ qid: c.qid, familyId: familyTheoQid.get(c.qid) ?? null, purpose: 'maintenance', contentGroup: ung.find((u) => u.qid === c.qid)?.group ?? '' })),
    })
    for (const [qid, taskId] of dungLai) dungLaiTask.set(qid, taskId)
    // `TRAN_LUOT` của policy là TRẦN LƯỢT (do chính vòng lặp này giữ theo RV05) — không đếm lại vào bản đồ lý do.
    for (const r of loai.values()) if (r !== 'TRAN_LUOT') dem(r)
    if (duocPhep.length === 0) break
    // (b)+(c) chấm điểm trên tập HỢP LỆ rồi lấy câu vừa ngân sách tốt nhất.
    const xep = await xepLuotTheoChinhSach(duocPhep, {
      sbd: inp.sbd, ngay: inp.ngay, mastery: inp.mastery, mucTheoKyNang: muc, hoSoCau, nowMs: inp.nowMs,
      mauTocDo: inp.mauTocDo,
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
    const cuoi = await xepLuotTheoChinhSach(duocPhep, {
      sbd: inp.sbd, ngay: inp.ngay, mastery: inp.mastery, mucTheoKyNang: muc, hoSoCau, nowMs: inp.nowMs, mauTocDo: inp.mauTocDo,
    })
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
    const haiTaskTruoc = daChon.slice(-2).map((x) => ({ part: x.part, solveSeconds: x.solveSeconds }))
    const diem = chamDiem(
      { qid: c.qid, version: c.version, part: c.part, difficulty, familyId: null },
      {
        nowMs: inp.nowMs, trangThaiDot: trangThaiDotTuHoSoCau(hoSo), workingLevel: mucDangLuyen(c, inp.mucTheoKyNang),
        dueMs: due, intervalMs: null, soTaskCungSkillTrongPlan: soTaskCungSkill,
        haiTaskTruoc, solveSeconds: uoc.solveSeconds,
      },
    )
    diemTheo.push({ qid: c.qid, version: c.version, part: c.part, difficulty, familyId: null })
    diemSo.set(c.qid, diem.score)
    theoQid.set(c.qid, { diem, solveSeconds: uoc.solveSeconds, taskSeconds: uoc.taskSeconds })
  }

  const sap = await sapTheoDiem(diemTheo, diemSo, (c) => khoaHashSap(inp.sbd, inp.ngay, 0, c.qid, c.version))
  return {
    xep: sap.map((c) => {
      const t = theoQid.get(c.qid)!
      return { qid: c.qid, diem: t.diem, solveSeconds: t.solveSeconds, taskSeconds: t.taskSeconds }
    }),
    theoQid,
  }
}
