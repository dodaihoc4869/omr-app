// KÊNH 5 — LỚP D1: đọc hồ sơ + kho câu rồi chọn câu cho bài hằng ngày của phụ huynh (GĐ 5).
//
// Nguồn câu là `game_v2_question.json` (PrivateQuestion: đủ text, choices, ideas, correct, solution, dang, mucDo), KHÔNG phải R2.
// Lỗi gốc của `layCauTuKhoDe` cũ: tờ kho R2 không có `text`/`dapAnDung`/`choices` mà là `de`/`dap_an`/`pa`/`y`, nên hàm đòi
// `c.text && c.dapAnDung` và luôn trả rỗng; ngoài ra nó lấy 6 tờ đầu tiên, không lọc lớp, không lọc chuyên đề.
// Chọn từ chỉ mục game thì có nhãn dạng/mức độ, có `reviewed`, và loại được đề thi đang bảo vệ (`protectedQuestions`).
import type { D1Result, Env } from './kieu'
import { learnedQuestionFilter, type PrivateQuestion } from '../../src/game/than-thu-v2/core'
import { hashSeed } from '../../src/lib/exam-shuffle'
import { chuoiLoiGiai } from './goi-cu'
import { protectedQuestions, readScope } from './game-v2-bank'
import { cauHopKhoi, khoiCuaEm } from '../../src/lib/khoi-cau'
import { dangYeu, type NamKtDang } from './ho-so-nam-kt'
import { hopLe3DangChuan } from './loc-cau-chuan'
import { laCauTuLuan } from './cam-tu-luan'
import {
  chonCauChoPhuHuynh, SO_NGAY_KHONG_GIAO_LAI, type CauChon, type CauToiHan, type NguonCau, type UngVien,
} from './parent-news-chon-cau'
import { ngayVn } from './su-kien-hoc'
// PHẠM VI HỌC CÁ NHÂN (CNH-1.0 P02): cờ `pham_vi_hoc` TẮT (mặc định) ⇒ đường cũ y nguyên, không đổi hành vi.
import { docPhamVi, eligibleScope, phamViBat, type TrangThaiScope } from './pham-vi-hoc'

type Row = Record<string, unknown>

const MOT_NGAY_MS = 86_400_000
const TRAN_DOC_TOI_HAN = 200
const TRAN_DOC_MOI_NHOM = 400
const TRAN_DOC_BU = 300
const LOP_HOP_LE = new Set(['10', '11', '12'])

const themNgay = (ngay: string, n: number) => new Date(Date.parse(`${ngay}T00:00:00Z`) + n * MOT_NGAY_MS).toISOString().slice(0, 10)

const trong = <T = Row>(): D1Result<T> => ({ results: [], success: true, meta: { changes: 0, last_row_id: 0, rows_read: 0, rows_written: 0 } })

/** Bảng/cột chưa có (migration chưa chạy) thì coi như trống; lỗi khác vẫn ném. */
async function tat<T>(f: () => Promise<T>, dpr: T): Promise<T> {
  try {
    return await f()
  } catch (e) {
    if (/no such (table|column)/i.test(e instanceof Error ? e.message : String(e))) return dpr
    throw e
  }
}

/** Dạng yếu nhất trước: tỉ lệ (đã khắc phục + chưa thấy sai)/đã gặp thấp nhất, rồi nhiều câu mới sai hơn, rồi mã dạng. Cùng thứ tự với kế hoạch ngày. */
export function dangYeuNhatTruoc(dang: NamKtDang[], homNay: string): NamKtDang[] {
  return dang
    .filter((x) => !x.maDang.startsWith('CD:') && dangYeu(x, homNay))
    .sort(
      (a, b) =>
        (a.soDaKhacPhuc + a.soChuaThaySai) / a.soGap - (b.soDaKhacPhuc + b.soChuaThaySai) / b.soGap ||
        b.soMoiSai - a.soMoiSai ||
        a.maDang.localeCompare(b.maDang),
    )
}

const CHON_CAU_KHO = `SELECT q.json FROM game_v2_question q JOIN de_kho d ON d.ma_de = q.ma_de
    JOIN game_v2_index g ON g.ma_de = d.ma_de AND g.source_version = d.cap_nhat_luc
   WHERE COALESCE(d.da_xoa, 0) = 0`

/** Câu dùng được cho bài hằng ngày: đã duyệt, đúng 3 dạng chuẩn, không thuộc đề thi đang bảo vệ, không có hình rời (Mom chưa vẽ). */
export function dungDuoc(q: PrivateQuestion, baoVe: ReadonlySet<string>): boolean {
  if (!q.reviewed || baoVe.has(q.qid) || baoVe.has(q.group)) return false
  if (laCauTuLuan(q)) return false // CẤM RÚT TỰ LUẬN (21/09): luật chung của thầy, đứng TRƯỚC luật 3 dạng chuẩn (chặt hơn, giữ nguyên) bên dưới
  if ((q.hinhAnh ?? []).some((h) => h.viTri !== 'sau_loi_giai')) return false
  return hopLe3DangChuan({ phan: q.phan, text: q.text, dapAnDung: q.correct, choices: q.choices, ideas: q.ideas, maDe: q.maDe })
}

/** Câu ở dạng Mom hiện đang nhận (`id` = qid THẬT, nên `questionOutcomes` khớp với sổ: hết lỗi `cau_N`). */
export function cauChoMom(q: PrivateQuestion): Record<string, unknown> {
  return {
    id: q.qid, qid: q.qid, maDe: q.maDe, phan: q.phan, text: q.text,
    choices: q.phan === 'II' ? [] : q.choices, ideas: q.ideas, table: q.table,
    thanCauImg: q.thanCauImg, imageDataUrl: q.imageDataUrl, choiceImgs: q.choiceImgs, ideaImgs: q.ideaImgs,
    dapAn: q.correct, dapAnDung: q.correct, loiGiai: chuoiLoiGiai(q.solution),
    chuyenDe: q.tenDang || q.dang || '', dang: q.dang, mucDo: q.mucDo ?? '', sao: q.sao ?? 0,
  }
}

export async function docCauKho(env: Env, dieuKien: string, thamSo: unknown[], baoVe: ReadonlySet<string>, gioiHan: number): Promise<PrivateQuestion[]> {
  const r = await tat(
    () => env.DB.prepare(`${CHON_CAU_KHO} ${dieuKien} ORDER BY q.content_group, q.qid LIMIT ${gioiHan}`).bind(...thamSo).all<{ json: string }>(),
    trong<{ json: string }>(),
  )
  const ra: PrivateQuestion[] = []
  for (const x of r.results ?? []) {
    try {
      const q = JSON.parse(x.json) as PrivateQuestion
      if (q?.qid && dungDuoc(q, baoVe)) ra.push(q)
    } catch { /* dòng hỏng: bỏ */ }
  }
  return ra
}

export interface KetQuaChonCau {
  cau: Record<string, unknown>[]
  /** Số câu theo nguồn, để ghi vào chữ giải thích và log. */
  theoNguon: Record<NguonCau, number>
  chon: CauChon[]
}

/**
 * Chọn `soCan` câu cho `sbd` hôm nay. Đọc: hồ sơ `nam_kt_cau` (câu tới hạn), `nam_kt_dang` (dạng yếu + bậc),
 * sổ `su_kien_hoc` (3 ngày qua), rồi kho `game_v2_question` (lọc lớp). Tối đa ~9 câu truy vấn.
 */
export async function chonCauBaiHangNgay(env: Env, sbd: string, soCan: number, now: number): Promise<KetQuaChonCau> {
  const rong: KetQuaChonCau = { cau: [], theoNguon: { on_toi_han: 0, cung_dang: 0, bu_kho: 0 }, chon: [] }
  if (soCan <= 0) return rong
  const homNay = ngayVn(now)
  const seed = hashSeed(`${sbd}|${homNay}|bai-hang-ngay`)

  const lopEm = String((await tat(() => env.DB.prepare('SELECT lop FROM hoc_sinh WHERE sbd = ?').bind(sbd).first<Row>(), null))?.lop ?? '').trim()
  const lop = LOP_HOP_LE.has(lopEm) ? lopEm : ''
  const [baoVe, phamVi] = await Promise.all([protectedQuestions(env), readScope(env, sbd)])
  const daHocCau = learnedQuestionFilter(phamVi.evidence, baoVe)
  // PHẠM VI HỌC CÁ NHÂN (CNH-1.0 P02 — đặc tả 02 §2). Cờ TẮT ⇒ `phamViHoc` rỗng và `nap` không lọc thêm gì.
  // Cờ BẬT mà kho chưa gắn nhãn `kienThuc` ⇒ câu thiếu nhãn bị loại `THIEU_NHAN` ⇒ kênh có thể trả THIẾU câu:
  // đúng luật "thiếu kho phải trả thiếu, không nới lọc", và là lý do phải gắn nhãn trước khi bật.
  const batPhamVi = await phamViBat(env)
  const phamViHoc: Map<string, TrangThaiScope> = batPhamVi ? await docPhamVi(env, sbd) : new Map()
  /** Câu này có được phát theo phạm vi không? (khi cờ TẮT luôn `true`). */
  const hopPhamVi = (q: PrivateQuestion): boolean => !batPhamVi || eligibleScope({
    qid: q.qid, version: q.version, contentGroup: q.group,
    skillIds: Array.isArray(q.kienThuc) ? q.kienThuc : [], prerequisiteIds: [],
    qualityStatus: q.reviewed ? 'approved' : 'chua_duyet',
  }, phamViHoc).duoc

  const rc = await tat(
    () => env.DB.prepare(
      `SELECT qid, ma_dang, moc_on_ke, lan_sai FROM nam_kt_cau
        WHERE sbd = ? AND trang_thai IN ('moi_sai','dang_on','da_khac_phuc') AND can_day_lai = 0 AND moc_on_ke IS NOT NULL AND moc_on_ke <= ?
        ORDER BY moc_on_ke, lan_sai DESC, qid LIMIT ${TRAN_DOC_TOI_HAN}`,
    ).bind(sbd, homNay).all<Row>(),
    trong(),
  )
  const toiHanDong = rc.results ?? []
  const toiHan: CauToiHan[] = toiHanDong.map((x) => ({ qid: String(x.qid), mocOnKe: String(x.moc_on_ke), lanSai: Number(x.lan_sai) || 0 }))

  const rd = await tat(() => env.DB.prepare('SELECT * FROM nam_kt_dang WHERE sbd = ?').bind(sbd).all<Row>(), trong())
  const dangCuaEm: NamKtDang[] = (rd.results ?? []).map((x) => ({
    sbd: String(x.sbd), maDang: String(x.ma_dang), soGap: Number(x.so_gap), soSai: Number(x.so_sai), soDaKhacPhuc: Number(x.so_da_khac_phuc),
    soMoiSai: Number(x.so_moi_sai), soChuaThaySai: Number(x.so_chua_thay_sai), bac: Number(x.bac),
    mocOnKe: x.moc_on_ke ? String(x.moc_on_ke) : null, mocMoiSai: x.moc_moi_sai ? String(x.moc_moi_sai) : null,
  }))
  const dangDaHoc = new Set(dangCuaEm.filter((d) => d.soGap > 0 && !d.maDang.startsWith('CD:')).map((d) => d.maDang))
  const dangYeuEm = dangYeuNhatTruoc(dangCuaEm, homNay)

  const rs = await tat(
    () => env.DB.prepare('SELECT DISTINCT e.qid, q.content_group FROM su_kien_hoc e LEFT JOIN game_v2_question q ON q.qid = e.qid WHERE e.sbd = ? AND e.ngay_vn >= ?').bind(sbd, themNgay(homNay, -(SO_NGAY_KHONG_GIAO_LAI - 1))).all<Row>(),
    trong(),
  )
  const suKienGanDay = new Set((rs.results ?? []).map((x) => String(x.qid)))
  const nhomGanDay = new Set((rs.results ?? []).map((x) => String(x.content_group ?? '')).filter(Boolean))

  // Kho: câu tới hạn, câu cùng dạng yếu, rồi các dạng khác có bằng chứng cá nhân.
  const loLop = lop ? ' AND d.lop = ?' : ''
  const themLop = lop ? [lop] : []
  const kho = new Map<string, PrivateQuestion>()
  // LUẬT KHỐI (Boss 21/09): câu nạp theo qid (tới hạn) nằm ngoài bộ lọc `d.lop` — câu khối CAO đã lọt vào sổ em từ trước vẫn không được phát lại. Khối em không rõ ⇒ không lọc.
  const khoiEm = khoiCuaEm({ lop: lopEm })
  const nap = (ds: PrivateQuestion[]) => { for (const q of ds) if (cauHopKhoi(khoiEm, q) && daHocCau(q) && hopPhamVi(q) && !kho.has(q.qid)) kho.set(q.qid, q) }
  if (toiHan.length > 0) nap(await docCauKho(env, 'AND q.qid IN (SELECT value FROM json_each(?))', [JSON.stringify(toiHan.map((c) => c.qid))], baoVe, TRAN_DOC_TOI_HAN))
  if (dangYeuEm.length > 0) nap(await docCauKho(env, `AND q.dang IN (SELECT value FROM json_each(?))${loLop}`, [JSON.stringify(dangYeuEm.map((d) => d.maDang)), ...themLop], baoVe, TRAN_DOC_MOI_NHOM))
  // Chỉ bù trong dạng chính em đã học; thiếu câu thì giảm số lượng.
  if (dangDaHoc.size > 0) nap(await docCauKho(env, `AND q.dang IN (SELECT value FROM json_each(?))${loLop}`, [JSON.stringify([...dangDaHoc]), ...themLop], baoVe, TRAN_DOC_BU))

  const chonTuKho = () => chonCauChoPhuHuynh({
    soCan, seed, toiHan, suKienGanDay, dangDaHoc, nhomGanDay,
    dangYeu: dangYeuEm.map((d) => ({ maDang: d.maDang, bac: d.bac })),
    ungVien: [...kho.values()].map((q): UngVien => ({ qid: q.qid, dang: q.dang, mucDo: q.mucDo, group: q.group })),
  })
  const chon = chonTuKho()

  const theoNguon: Record<NguonCau, number> = { on_toi_han: 0, cung_dang: 0, bu_kho: 0 }
  for (const c of chon) theoNguon[c.nguon]++
  return { cau: chon.map((c) => cauChoMom(kho.get(c.qid)!)), theoNguon, chon }
}
