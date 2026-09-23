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
import {
  chamDiem, khoaHashSap, sapTheoDiem, type CauChonDiem, type KetQuaDiem, type TrangThaiDot,
} from './bo-chon-diem'
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

/** Mức đang luyện của một câu = mức THẤP NHẤT trong các kỹ năng của câu (0 khi chưa có hồ sơ). */
export function mucDangLuyen(c: CauUngVien, mucTheoKyNang: ReadonlyMap<string, number>): number {
  const ds = c.skillIds.map((s) => mucTheoKyNang.get(s)).filter((x): x is number => typeof x === 'number')
  return ds.length ? Math.min(...ds) : 0
}

/**
 * LỌC LUẬT LẶP (P04) cho một lượt, dùng dữ liệu THẬT: `content_group` đã có kết quả HÔM NAY của em
 * (`docDaLamHomNay`) và trần câu của lượt.
 *
 * GHI RÕ PHẦN CHƯA ÁP ĐƯỢC: luật family của 02 §4.2.6–4.2.7 (mỗi family 1 câu thường, chưa gán family
 * tối đa 1 câu, nghỉ 1 ngày VN, 4 ngoại lệ có `repeat_reason`) **KHÔNG áp** ở đây vì KHO THẬT CHƯA GẮN
 * NHÃN FAMILY (P02 ghi nhận; thầy nhận danh sách thiếu qua `baoThieuNhan`) — áp nguyên văn sẽ hạ mọi lượt
 * xuống 1 câu. Phần đó chờ dữ liệu nhãn; KHÔNG bịa family để lách.
 */
export async function locTheoLuatLap(
  env: Env, sbd: string, ngay: string, ds: readonly CauUngVien[], tranCau?: number,
  dangGiu?: ReadonlySet<string>,
): Promise<{ giu: Set<string>; loai: Map<string, string> }> {
  const daLam = (await docDaLamHomNay(env, [sbd], ngay)).get(sbd) ?? new Set<string>()
  const loai = new Map<string, string>()
  const giu = new Set<string>()
  // BƯỚC 5 của §7.1 (GIỮ CHỖ ĐANG HIỆU LỰC + lượt làm hôm nay) — chạy TRƯỚC khi chấm điểm, không phải sau.
  for (const c of ds) {
    if (dangGiu?.has(c.qid)) { loai.set(c.qid, 'RESERVATION_CONFLICT'); continue }
    // Ứng viên đã trả lời hôm nay (theo content_group) bị chặn — TRỪ khi có `repair_retry` do máy chủ tạo (rỗng ở đây).
    if (c.group && daLam.has(c.group)) { loai.set(c.qid, 'REPEAT_LIMIT'); continue }
    giu.add(c.qid)
  }
  // GHI RÕ PHẦN CHƯA ÁP ĐƯỢC: luật family của 02 §4.2.6–4.2.7 (mỗi family 1 câu thường, chưa gán family
  // tối đa 1 câu, nghỉ 1 ngày VN, 4 ngoại lệ có `repeat_reason`) **KHÔNG áp** ở đây vì KHO THẬT CHƯA GẮN
  // NHÃN FAMILY (P02 ghi nhận; thầy nhận danh sách thiếu qua `baoThieuNhan`) — áp nguyên văn sẽ hạ mọi lượt
  // xuống 1 câu. Phần đó chờ dữ liệu nhãn; KHÔNG bịa family để lách.
  // Trần số câu của lượt: giữ đúng thứ tự nơi gọi đưa vào (bộ chọn đã sắp ở bước sau).
  const tran = Number.isFinite(tranCau) ? Math.max(0, Math.floor(tranCau as number)) : ds.length
  let dem = 0
  for (const c of ds) {
    if (!giu.has(c.qid)) continue
    dem++
    if (dem > tran) { giu.delete(c.qid); loai.set(c.qid, 'TRAN_LUOT') }
  }
  return { giu, loai }
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
  chon: { qid: string; version: string; part: 'I' | 'II' | 'III'; diem: KetQuaDiem; solveSeconds: number; taskSeconds: number }[]
  /** Đếm câu bị loại theo TỪNG nguyên nhân §7.1 (cho giáo viên; KHÔNG lộ qid đề bảo vệ). */
  lyDo: Record<string, number>
  /** Số câu hoãn vì hết ngân sách ngày. */
  deferredCount: number
  /** Tổng giây của các câu bị hoãn (thầy thấy mức vượt tải). */
  overBudgetSeconds: number
  /** Chỗ đang bị giữ (hiệu lực) trong ngày của em. */
  dangGiu: Map<string, { taskId: string; leaseUntil: number }>
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
  const conHieuLuc = new Set([...dangGiu].filter(([, v]) => v.leaseUntil >= inp.nowMs).map(([k]) => k))

  // §7.1 bước 5–7: giữ chỗ hiệu lực + lượt làm hôm nay + trần câu (family chờ nhãn — xem `locTheoLuatLap`).
  const { giu, loai } = await locTheoLuatLap(env, inp.sbd, inp.ngay, ds, inp.tranCau ?? SO_CAU_LUOT_MAC_DINH, conHieuLuc)
  for (const r of loai.values()) dem(r)
  const qua1 = ds.filter((c) => giu.has(c.qid))

  // §7.1 bước 6: trần độ khó theo MỨC ĐANG LUYỆN (min của các skill); probe hợp lệ = +1, không quá 2.
  const muc = inp.mucTheoKyNang ?? await mucTheoKyNangCuaEm(env, inp.sbd)
  const hoSoCau = inp.hoSoCau ?? await docHoSoCau(env, inp.sbd, qua1.map((c) => c.qid))
  const qua2: CauUngVien[] = []
  for (const c of qua1) {
    const working = mucDangLuyen(c, muc)
    const difficulty = typeof c.mucDo === 'string' ? mucTuChu(c.mucDo) : 0
    const tran = inp.probeChoPhep ? Math.min(2, working + 1) : working
    if (difficulty > tran) { dem('DIFFICULTY_LIMIT'); continue }
    qua2.push(c)
  }

  // §7.2 bước 8–9: điểm tất định rồi chọn GREEDY từng câu vừa ngân sách còn lại; tính lại coverage/fatigue
  // sau MỖI lựa chọn (đúng câu "kiểm lại coverage/family sau mỗi lựa chọn").
  const conLaiCoTran = inp.conLaiGiay !== undefined && inp.conLaiGiay !== null
  let conLai = conLaiCoTran ? Math.max(0, Math.floor(inp.conLaiGiay as number)) : 0
  const chon: ChonCauKetQua['chon'] = []
  const daChonSkill = new Map<string, readonly string[]>()
  let ung = [...qua2]
  while (ung.length) {
    const xep = await xepLuotTheoChinhSach(ung, {
      sbd: inp.sbd, ngay: inp.ngay, mastery: inp.mastery, mucTheoKyNang: muc, hoSoCau, nowMs: inp.nowMs,
      mauTocDo: inp.mauTocDo,
      daChon: chon.map((c) => ({ qid: c.qid, part: c.part, solveSeconds: c.solveSeconds, skillIds: daChonSkill.get(c.qid) ?? [] })),
    })
    const vua = xep.xep.find((v) => !conLaiCoTran || v.taskSeconds <= conLai)
    if (!vua) break
    const goc = ung.find((u) => u.qid === vua.qid)!
    chon.push({ qid: vua.qid, version: goc.version, part: goc.part, diem: vua.diem, solveSeconds: vua.solveSeconds, taskSeconds: vua.taskSeconds })
    daChonSkill.set(vua.qid, goc.skillIds)
    if (conLaiCoTran) conLai -= vua.taskSeconds
    ung = ung.filter((u) => u.qid !== vua.qid)
  }
  let deferredCount = 0
  let overBudgetSeconds = 0
  if (ung.length && conLaiCoTran) {
    const cuoi = await xepLuotTheoChinhSach(ung, {
      sbd: inp.sbd, ngay: inp.ngay, mastery: inp.mastery, mucTheoKyNang: muc, hoSoCau, nowMs: inp.nowMs, mauTocDo: inp.mauTocDo,
    })
    deferredCount = ung.length
    overBudgetSeconds = cuoi.xep.reduce((s, v) => s + v.taskSeconds, 0)
    dem('BUDGET_EXHAUSTED')
  }
  return { chon, lyDo, deferredCount, overBudgetSeconds, dangGiu }
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
