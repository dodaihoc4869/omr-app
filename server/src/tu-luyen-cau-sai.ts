// TU LUYỆN · CHẾ ĐỘ 1 "SỬA CÂU SAI" — LUẬT MỚI (thầy lệnh 30/09, Boss chuyển nguyên văn):
//   "phần tu luyện sửa câu sai nó lấy hết câu sai ở mọi ca thi từ ngày hôm qua và chiến dịch từ ngày hôm qua cộng dồn lại xong học sinh được
//    chọn số câu để luyện, lần luyện sau câu sẽ khác lần luyện trước, sắp xếp bốc ngẫu nhiên câu khó và dễ, nếu lần luyện sau chọn số câu nhiều
//    hơn mà kho câu sai không đủ thì lấy lại trùng cũng được, nhớ gắn nhãn bạn đã luyện lại câu này mấy lần, đã sai gốc ở đâu nhé."
//
// 1. NGUỒN (chỉ ĐỌC): mọi câu em trả lời SAI ít nhất một lần từ MỐC 29/09/2026 00:00 (+07) trong sổ `su_kien_hoc`:
//      · ca kiểm tra (`nguon = 'thi'`, ca ĐÃ CÔNG BỐ, không xoá, lần làm không bị che) — sai hoặc bỏ trống (đúng như câu sai của ca);
//      · chiến dịch làm trong game (`nguon = 'game'`: Đảo thần thú / Đoàn Hộ Tống / Bi-a theo phiên) — chỉ lần trả lời SAI (`ket_qua = 0`).
//    Cộng dồn, khử trùng theo qid và NHÓM NỘI DUNG; bỏ câu tự luận, câu thuộc ca đang bảo vệ, câu đã đổi/rút khỏi kho (không còn trong chỉ mục game).
// 2. CHỌN (ở máy chủ): câu CHƯA luyện ở Tu luyện trước, rồi câu luyện ít lần nhất, rồi câu luyện lâu nhất ⇒ lần sau khác lần trước. Em xin nhiều
//    hơn kho ⇒ lấy LẶP theo cùng thứ tự (bản lặp mang mã `<qid>~2`, `~3`… để chấm riêng từng lần). Trong lượt: TRỘN câu khó và dễ, rải câu khó đều.
// 3. NHÃN mỗi câu: "Luyện lần đầu" / "Luyện lại lần K" và "Sai gốc: …" (chữ đời thường, không mã nội bộ).
// KHÔNG ghi gì ngoài hai bảng tu_luyen_* (ghi khi rút/nộp ở tu-luyen.ts); không EXP, không sổ sự kiện. Đáp án chỉ nằm trong phần RIÊNG của lượt.
import type { Env } from './kieu'
import type { PrivateQuestion } from '../../src/game/than-thu-v2/core'
import type { CauLuyen } from '../../src/lib/bai-tap-pdf'
import { cauLuyenTuBoCau } from '../../src/lib/bai-tap-pdf'
import { laCauTuLuan } from './cam-tu-luan'
import { SQL_DA_CONG_BO } from './cong-bo-diem'
import { docBaoVeKho, LOI_CHUA_KIEM_BAO_VE } from './bao-ve-kho-cong-khai'
import { chanKhacKhoiEm } from './chan-khac-khoi'

type Row = Record<string, unknown>
const str = (v: unknown) => (v === null || v === undefined ? '' : String(v))

/** MỐC nguồn câu sai: 29/09/2026 00:00 giờ Việt Nam (thầy: "từ ngày hôm qua" — lệnh ngày 30/09). Hằng số, không trượt theo ngày. */
export const MOC_CAU_SAI_NGAY = '2026-09-29'
export const MOC_CAU_SAI_ISO = '2026-09-28T17:00:00.000Z'
export const LOI_KHO_CAU_SAI_TRONG = 'Em chưa sai câu nào từ 29/09.'
export const MOC_CAU_SAI_MS = Date.parse(MOC_CAU_SAI_ISO)

/** Nguồn của một lần sai: ca kiểm tra, trò chơi trong chiến dịch, Luyện đề cấu trúc, hoặc lượt Tu luyện (chế độ 2–4) đã nộp. */
export type LoaiNguonSai = 'ca' | 'dao' | 'doan' | 'bia' | 'luyen_de' | 'tu_luyen'
export interface LanSai { qid: string; loai: LoaiNguonSai; tenCa: string; tenChienDich: string; luc: string; ngay: string }

const TEN_TRO: Record<Exclude<LoaiNguonSai, 'ca'>, string> = { dao: 'Đảo thần thú', doan: 'Đoàn Hộ Tống', bia: 'Bi-a', luyen_de: 'Luyện đề cấu trúc', tu_luyen: 'Tu luyện' }
const LA_TRO = new Set<LoaiNguonSai>(['dao', 'doan', 'bia'])
const ddmm = (ngay: string) => (/^\d{4}-\d{2}-\d{2}/.test(ngay) ? `${ngay.slice(8, 10)}/${ngay.slice(5, 7)}` : '')

/** Chữ một nguồn sai: "Ca kiểm tra Ester · 29/09" · "Chiến dịch Ôn ester · Đoàn Hộ Tống · 30/09" · "Đảo thần thú · 30/09". */
export function chuNguonSai(l: LanSai): string {
  const ngay = ddmm(l.ngay)
  const duoi = ngay ? ` · ${ngay}` : ''
  if (l.loai === 'ca') return `${l.tenCa.trim() || 'Ca kiểm tra'}${duoi}`
  if (!LA_TRO.has(l.loai)) return `${TEN_TRO[l.loai as 'luyen_de']}${duoi}`
  return `${l.tenChienDich.trim() ? `Chiến dịch ${l.tenChienDich.trim()} · ` : ''}${TEN_TRO[l.loai]}${duoi}`
}

const khoaNguon = (l: LanSai) => (l.loai === 'ca' ? `ca|${l.tenCa}` : LA_TRO.has(l.loai) ? `${l.loai}|${l.tenChienDich}` : l.loai)
const theoLuc = (a: LanSai, b: LanSai) => (a.luc < b.luc ? -1 : a.luc > b.luc ? 1 : 0)

/**
 * Nhãn "Sai gốc" của một câu. Một nguồn ⇒ lần sai ĐẦU TIÊN kể từ mốc ("Sai gốc: Ca kiểm tra Ester · 29/09").
 * Nhiều nguồn ⇒ nguồn GẦN NHẤT + "và N lần khác" (N = số lần sai còn lại kể từ mốc) — đúng chữ Boss chốt 30/09.
 */
export function nhanSaiGoc(ds: readonly LanSai[], uuTien?: ReadonlySet<LoaiNguonSai> | null): string {
  if (!ds.length) return ''
  const xep = [...ds].sort(theoLuc)
  // Em chọn nguồn (30/09): nguồn HIỂN THỊ lấy trong số nguồn em đã tick; "N lần khác" vẫn đếm mọi lần sai.
  const hien = uuTien?.size ? xep.filter((l) => uuTien.has(l.loai)) : xep
  const nhin = hien.length ? hien : xep
  if (new Set(xep.map(khoaNguon)).size <= 1) return `Sai gốc: ${chuNguonSai(nhin[0]!)}`
  return `Sai gốc: ${chuNguonSai(nhin[nhin.length - 1]!)} và ${xep.length - 1} lần khác`
}

/** "Luyện lần đầu" (K = 1) / "Luyện lại lần K" — K = số lần câu đã có trong các lượt Tu luyện ĐÃ NỘP + 1. */
export const nhanLanLuyen = (k: number): string => (k <= 1 ? 'Luyện lần đầu' : `Luyện lại lần ${k}`)

/** Câu KHÓ để trộn: 2 sao, hoặc mức Vận dụng trở lên. */
export const laCauKho = (q: { sao?: number | null; mucDo?: string | null }): boolean => Number(q.sao) === 2 || /van_dung|vd/i.test(str(q.mucDo))

/** Mã bản lặp trong cùng lượt: `<qid>~2`. Bỏ đuôi ⇒ qid gốc (đếm lần luyện, đề bảo vệ, Hỏi thầy). */
export const qidGoc = (id: string): string => str(id).replace(/~\d+$/, '')

/** Trộn Fisher–Yates bằng `rnd` (test truyền hàm tất định). */
export function tron<T>(ds: readonly T[], rnd: () => number): T[] {
  const a = [...ds]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    ;[a[i], a[j]] = [a[j]!, a[i]!]
  }
  return a
}

/**
 * XEN KẼ dễ/khó (thầy: "bốc ngẫu nhiên câu khó và dễ", Boss: "không dồn khó về một chỗ"): trộn riêng hai nhóm rồi RẢI câu khó đều trên cả lượt
 * (vị trí câu khó thứ i = ⌊(i + lệch)·n/k⌋, lệch ngẫu nhiên) — số câu khó ≤ nửa lượt thì không bao giờ có hai câu khó liền nhau.
 */
export function xenKeDeKho<T extends { kho: boolean }>(ds: readonly T[], rnd: () => number): T[] {
  const kho = tron(ds.filter((c) => c.kho), rnd)
  const de = tron(ds.filter((c) => !c.kho), rnd)
  if (!kho.length || !de.length) return [...kho, ...de]
  const n = ds.length
  const lech = rnd()
  const viTri = new Set(kho.map((_, i) => Math.min(n - 1, Math.floor(((i + lech) * n) / kho.length))))
  const ra: T[] = []
  let k = 0, d = 0
  for (let i = 0; i < n; i++) {
    if ((viTri.has(i) && k < kho.length) || d >= de.length) ra.push(kho[k++]!)
    else ra.push(de[d++]!)
  }
  return ra
}

export interface UngVienSai {
  qid: string
  kho: boolean
  soLanLuyen: number
  lanCuoi: number
  /** Ôn cách quãng (luật 30/09 v3): đã đúng lần 1 và TỚI HẠN hẹn gặp lại ⇒ lấy TRƯỚC mọi câu khác. */
  toiHan?: boolean
  /** Đã đúng lần 1 nhưng CHƯA tới hạn ⇒ chỉ lấy khi kho cạn (đứng sau mọi câu khác, trước vòng lặp). */
  choHen?: boolean
}

/** Thứ tự ƯU TIÊN: câu tới hạn hẹn lại → chưa luyện → luyện ít lần nhất → luyện lâu nhất; bằng nhau thì ngẫu nhiên. Câu đang chờ hẹn xếp CUỐI. */
export function thuTuUuTien<T extends UngVienSai>(ds: readonly T[], rnd: () => number): T[] {
  const xep = (a: readonly T[]) => tron(a, rnd).sort((x, y) => Number(!!y.toiHan) - Number(!!x.toiHan) || x.soLanLuyen - y.soLanLuyen || x.lanCuoi - y.lanCuoi)
  return [...xep(ds.filter((c) => !c.choHen)), ...xep(ds.filter((c) => c.choHen))]
}

/** Trần số câu một lượt chế độ 1: mỗi câu lặp tối đa hai lần trong lượt (kho N câu ⇒ tối đa 2N), không quá `tran`. */
export const tranSoCauCheDo1 = (n: number, tran: number): number => Math.max(0, Math.min(tran, 2 * n))

/**
 * CHỌN `soCau` câu từ kho câu sai: lấy theo thứ tự ưu tiên; hết kho mà còn thiếu ⇒ vòng LẶP (cùng thứ tự). Mỗi vòng trộn dễ/khó riêng rồi nối lại
 * (bản lặp của một câu không đứng liền bản trước của nó). `lap` = 0 ở vòng đầu, 1 ở vòng lặp thứ nhất…
 */
export function chonCauSai<T extends UngVienSai>(ds: readonly T[], soCau: number, rnd: () => number): (T & { lap: number })[] {
  const xep = thuTuUuTien(ds, rnd)
  const ra: (T & { lap: number })[] = []
  for (let vong = 0; ra.length < soCau && xep.length; vong++) {
    const lay = xenKeDeKho(xep.slice(0, soCau - ra.length).map((c) => ({ ...c, lap: vong })), rnd)
    if (lay.length > 1 && ra.length && lay[0]!.qid === ra[ra.length - 1]!.qid) [lay[0], lay[1]] = [lay[1]!, lay[0]!]
    ra.push(...lay)
  }
  return ra
}

/** Câu kho (chỉ mục game, CÓ đáp án) → CauLuyen (khuôn Tu luyện dùng để tách câu công khai / phần riêng). */
export function cauLuyenTuCauGame(q: PrivateQuestion): CauLuyen {
  const sol = q.solution
  const loiGiai = sol && typeof sol === 'object' ? sol : typeof sol === 'string' && sol.trim() ? { chot: sol } : undefined
  const chung = {
    id: q.qid,
    text: q.text,
    mucDo: q.mucDo ?? undefined,
    loiGiai,
    thanCauImg: q.thanCauImg,
    imageDataUrl: q.imageDataUrl,
    hinhAnh: q.hinhAnh,
    table: q.table,
    canChua: q.sao === 1 || q.sao === 2 ? { sao: q.sao } : undefined,
    dang: q.dang ? { ma: q.dang, ten: q.tenDang || q.dang } : undefined,
  }
  const cau =
    q.phan === 'I' ? { ...chung, choices: q.choices, choiceImgs: q.choiceImgs, correct: q.correct }
    : q.phan === 'II' ? { ...chung, ideas: q.ideas, ideaImgs: q.ideaImgs, correct: str(q.correct).split('') }
    : { ...chung, correct: q.correct }
  return cauLuyenTuBoCau([{ phan: q.phan, maDe: q.maDe, q: cau as never }])[0]!
}

export interface CauSaiKho {
  qid: string
  q: PrivateQuestion
  lanSai: LanSai[]
  kho: boolean
  /** Mọi qid cùng nhóm nội dung (khử trùng) — trạng thái khắc phục đọc theo bất kỳ qid nào trong nhóm. */
  qids: string[]
  /** Trạng thái ôn cách quãng ĐANG HIỆU LỰC (đã tính "sai lại ⇒ về đầu"); null = chưa đúng lần nào kể từ lần sai cuối. */
  khacPhuc: TrangThaiKhacPhuc | null
}
export interface KhoCauSai {
  /** Câu CÒN trong kho (chưa khắc phục). */
  ds: CauSaiKho[]
  tuCa: number
  tuChienDich: number
  tuLuyenDe: number
  tuTuLuyen: number
  /** Tổng câu sai từ mốc (còn trong kho + đã khắc phục) và số đã khắc phục — bộ đếm "Đã khắc phục X/Y câu sai". */
  tong: number
  daKhacPhuc: number
  /** Lịch sử để Tổng hợp tính tỉ lệ khắc phục theo tuần: lúc câu vào kho (lần sai đầu, ms) và lúc khắc phục (ms | null). */
  lichSu: { qid: string; vao: number; khacPhucLuc: number | null }[]
  loi: string
}

// ------------------------------------------------------------------ ÔN CÁCH QUÃNG (luật 30/09 v3)
//   đúng lần 1 ⇒ hẹn gặp lại sau ≥ 1 ngày (không rút lại trước hạn trừ khi kho cạn);
//   đúng lần 2 LIÊN TIẾP ở NGÀY KHÁC ⇒ "Đã khắc phục", rời kho;  sai lại (ở Tu luyện hay bất kỳ nguồn nào sau đó) ⇒ về đầu.
// Trạng thái ở bảng CHỈ-THÊM `tu_luyen_khac_phuc` (server/migration-3009-tu-luyen-khac-phuc.sql; dựng tại chỗ ở tu-luyen.ts).

export const MOT_NGAY_MS = 86_400_000
export interface TrangThaiKhacPhuc { soDungLien: number; lanCuoi: number; henLai: number | null; daKhacPhucLuc: number | null }
const ngayVn = (ms: number) => Math.floor((ms + 7 * 3_600_000) / MOT_NGAY_MS)

/** Trạng thái còn HIỆU LỰC: có lần sai (ở bất kỳ nguồn nào) SAU mốc của trạng thái ⇒ về đầu (null). */
export function khacPhucHieuLuc(cu: TrangThaiKhacPhuc | null | undefined, saiCuoiMs: number): TrangThaiKhacPhuc | null {
  if (!cu) return null
  const moc = cu.daKhacPhucLuc ?? cu.lanCuoi
  return saiCuoiMs > moc ? null : cu
}

/** Chấm xong một câu của kho câu sai ⇒ trạng thái mới (hàm thuần). `saiCuoiMs` = lần sai gần nhất của câu ở các nguồn (để "sai lại ⇒ về đầu"). */
export function capNhatKhacPhuc(cu: TrangThaiKhacPhuc | null | undefined, dung: boolean, now: number, saiCuoiMs = 0): TrangThaiKhacPhuc {
  if (!dung) return { soDungLien: 0, lanCuoi: now, henLai: null, daKhacPhucLuc: null }
  const hl = khacPhucHieuLuc(cu, saiCuoiMs)
  if (hl?.daKhacPhucLuc) return hl
  if (!hl || hl.soDungLien <= 0) return { soDungLien: 1, lanCuoi: now, henLai: now + MOT_NGAY_MS, daKhacPhucLuc: null }
  if (ngayVn(now) !== ngayVn(hl.lanCuoi)) return { soDungLien: 2, lanCuoi: now, henLai: null, daKhacPhucLuc: now }
  return hl // đúng lần nữa trong CÙNG ngày: chưa tính, giữ hẹn cũ
}

/** Nhãn thêm trên thẻ câu khi áp dụng. */
export const nhanConMotLan = (t: TrangThaiKhacPhuc | null): string => (t && !t.daKhacPhucLuc && t.soDungLien === 1 ? 'Còn 1 lần đúng nữa là khắc phục' : '')

/** Chữ sau khi chấm một câu của kho câu sai. */
export function chuSauCham(t: TrangThaiKhacPhuc, dung: boolean): string {
  if (!dung) return 'Chưa đúng — câu này ở lại kho, luyện lại từ đầu'
  if (t.daKhacPhucLuc) return 'Đã khắc phục câu này — rời kho câu sai'
  if (t.soDungLien === 1) return 'Đúng lần 1 — hẹn gặp lại câu này sau 1 ngày'
  return 'Đúng — làm lại vào ngày khác để khắc phục'
}

/** Hai bảng CHỈ-THÊM của bản v3 — y hệt server/migration-3009-tu-luyen-khac-phuc.sql (test khoá). */
export const SQL_BANG_KHAC_PHUC: readonly string[] = [
  'CREATE TABLE IF NOT EXISTS tu_luyen_khac_phuc ( sbd TEXT NOT NULL, qid TEXT NOT NULL, so_dung_lien INTEGER NOT NULL DEFAULT 0, lan_cuoi INTEGER NOT NULL DEFAULT 0, hen_lai INTEGER, da_khac_phuc_luc INTEGER, PRIMARY KEY (sbd, qid) )',
  'CREATE TABLE IF NOT EXISTS tu_luyen_cham_cau ( luot_id TEXT NOT NULL, sbd TEXT NOT NULL, qid TEXT NOT NULL, tra_loi TEXT NOT NULL DEFAULT \'\', dung INTEGER NOT NULL DEFAULT 0, diem REAL NOT NULL DEFAULT 0, luc INTEGER NOT NULL, PRIMARY KEY (luot_id, qid) )',
]

/** Trạng thái khắc phục của em (qid ⇒ trạng thái). Bảng chưa có ⇒ rỗng. */
export async function docKhacPhuc(env: Env, sbd: string): Promise<Map<string, TrangThaiKhacPhuc>> {
  const r = await env.DB.prepare('SELECT qid, so_dung_lien, lan_cuoi, hen_lai, da_khac_phuc_luc FROM tu_luyen_khac_phuc WHERE sbd = ?').bind(sbd).all<Row>()
    .catch(() => ({ results: [] as Row[] }))
  const ra = new Map<string, TrangThaiKhacPhuc>()
  for (const x of r.results ?? []) {
    ra.set(str(x.qid), {
      soDungLien: Number(x.so_dung_lien) || 0,
      lanCuoi: Number(x.lan_cuoi) || 0,
      henLai: x.hen_lai == null ? null : Number(x.hen_lai),
      daKhacPhucLuc: x.da_khac_phuc_luc == null ? null : Number(x.da_khac_phuc_luc),
    })
  }
  return ra
}

/** Câu lệnh GHI trạng thái (gộp vào batch của lượt nộp / chấm câu). */
export function lenhGhiKhacPhuc(env: Env, sbd: string, qid: string, t: TrangThaiKhacPhuc) {
  return env.DB.prepare(
    `INSERT INTO tu_luyen_khac_phuc (sbd, qid, so_dung_lien, lan_cuoi, hen_lai, da_khac_phuc_luc) VALUES (?,?,?,?,?,?)
     ON CONFLICT(sbd, qid) DO UPDATE SET so_dung_lien = excluded.so_dung_lien, lan_cuoi = excluded.lan_cuoi, hen_lai = excluded.hen_lai, da_khac_phuc_luc = excluded.da_khac_phuc_luc`,
  ).bind(sbd, qid, t.soDungLien, t.lanCuoi, t.henLai, t.daKhacPhucLuc)
}

// ------------------------------------------------------------------ KHO CÂU SAI CHUNG (chế độ 1, 2, 4)

const isoTuMs = (ms: number) => new Date(ms).toISOString()
const ngayVnChu = (ms: number) => new Date(ms + 7 * 3_600_000).toISOString().slice(0, 10)

/**
 * Lần sai của em từ mốc — BỐN nguồn, chỉ ĐỌC:
 *   · sổ `su_kien_hoc`: ca kiểm tra ĐÃ CÔNG BỐ (sai hoặc bỏ trống) · game/chiến dịch (lần SAI) · Luyện đề cấu trúc (`nguon='luyen'`, đề ĐÃ NỘP, lần SAI);
 *   · bảng `tu_luyen_cau`: câu SAI ở lượt Tu luyện chế độ 2–4 ĐÃ NỘP (chế độ 1 là luyện lại chính kho này — sai ở đó chỉ đặt lại ôn cách quãng).
 * Cột `visibility` chưa có ở CSDL cũ ⇒ đọc lại không có cột ấy.
 */
async function docLanSai(env: Env, sbd: string): Promise<LanSai[]> {
  const sql = (coVis: boolean) => `SELECT s.qid, s.nguon, s.luc, s.ngay_vn, ${coVis ? 's.visibility' : 'NULL AS visibility'},
      c.ten_ca, CASE WHEN s.nguon = 'thi' THEN (c.ma_ca IS NOT NULL AND COALESCE(c.trang_thai, '') <> 'da_xoa' AND ${SQL_DA_CONG_BO('c')})
        WHEN s.nguon = 'luyen' THEN EXISTS (SELECT 1 FROM luyen_de_2026 ld WHERE ld.id = s.ma_nguon AND ld.sbd = s.sbd AND ld.status = 'submitted') ELSE 1 END AS hop_le,
      COALESCE(json_extract(g.json, '$.bia'), 0) AS bia, json_extract(g.json, '$.doan') AS doan
    FROM su_kien_hoc s
    LEFT JOIN ca c ON s.nguon = 'thi' AND c.ma_ca = s.ma_nguon
    LEFT JOIN game_v2_session g ON s.nguon = 'game' AND g.id = s.ma_nguon
    WHERE s.sbd = ? AND s.ngay_vn >= ? AND s.luc >= ? AND s.nguon IN ('thi', 'game', 'luyen') AND COALESCE(s.qid, '') <> '' AND s.qid NOT LIKE 'nen:%'
      AND ((s.nguon = 'thi' AND COALESCE(s.ket_qua, 0) <> 1) OR (s.nguon IN ('game', 'luyen') AND s.ket_qua = 0))`
  // 06/10: `qid NOT LIKE 'nen:%'` — câu CHẨN ĐOÁN bước sai trong chuyến (chan-doan-buoc-sai.ts, qid `nen:…`, không có trong kho) không vào kho câu sai của Tu luyện.
  // Hai nguồn đọc SONG SONG (một đợt D1).
  const [r, tl] = await Promise.all([
    env.DB.prepare(sql(true)).bind(sbd, MOC_CAU_SAI_NGAY, MOC_CAU_SAI_ISO).all<Row>()
      .catch(() => env.DB.prepare(sql(false)).bind(sbd, MOC_CAU_SAI_NGAY, MOC_CAU_SAI_ISO).all<Row>()),
    env.DB.prepare('SELECT qid, nop_luc FROM tu_luyen_cau WHERE sbd = ? AND dung = 0 AND che_do <> 1 AND nop_luc >= ?').bind(sbd, MOC_CAU_SAI_MS).all<Row>()
      .catch(() => ({ results: [] as Row[] })),
  ])
  const ra: LanSai[] = []
  for (const x of r.results ?? []) {
    if (str(x.visibility) === 'embargoed' || Number(x.hop_le) !== 1) continue
    const nguon = str(x.nguon)
    const loai: LoaiNguonSai = nguon === 'thi' ? 'ca' : nguon === 'luyen' ? 'luyen_de' : Number(x.bia) === 1 ? 'bia' : x.doan != null ? 'doan' : 'dao'
    ra.push({ qid: str(x.qid), loai, tenCa: loai === 'ca' ? str(x.ten_ca) : '', tenChienDich: '', luc: str(x.luc), ngay: str(x.ngay_vn) })
  }
  for (const x of tl.results ?? []) {
    const ms = Number(x.nop_luc) || 0
    ra.push({ qid: qidGoc(str(x.qid)), loai: 'tu_luyen', tenCa: '', tenChienDich: '', luc: isoTuMs(ms), ngay: ngayVnChu(ms) })
  }
  return ra
}

/** qid → tên chiến dịch (mới nhất trước) của CHÍNH em. Lỗi đọc ⇒ rỗng (nhãn chỉ còn tên trò). */
async function docTenChienDich(env: Env, sbd: string): Promise<Map<string, string>> {
  const r = await env.DB.prepare("SELECT ten, qid_json FROM chien_dich WHERE trang_thai <> 'da_huy' AND EXISTS (SELECT 1 FROM json_each(chien_dich.sbd_json) WHERE value = ?) ORDER BY tao_luc DESC")
    .bind(sbd).all<Row>().catch(() => ({ results: [] as Row[] }))
  const ra = new Map<string, string>()
  for (const c of r.results ?? []) {
    let qids: unknown[] = []
    try { qids = JSON.parse(str(c.qid_json) || '[]') as unknown[] } catch { /* bỏ */ }
    for (const q of Array.isArray(qids) ? qids : []) if (!ra.has(str(q))) ra.set(str(q), str(c.ten))
  }
  return ra
}

/** Nội dung câu từ chỉ mục game (tờ còn, chỉ mục khớp nguồn). Câu vắng = đã đổi/rút khỏi kho ⇒ bỏ. */
export async function docNoiDung(env: Env, qids: string[]): Promise<Map<string, { group: string; q: PrivateQuestion }>> {
  const ra = new Map<string, { group: string; q: PrivateQuestion }>()
  for (let i = 0; i < qids.length; i += 800) {
    const r = await env.DB.prepare(`SELECT q.qid, q.content_group, q.json FROM game_v2_question q JOIN de_kho d ON d.ma_de = q.ma_de
        JOIN game_v2_index g ON g.ma_de = d.ma_de AND g.source_version = d.cap_nhat_luc
       WHERE COALESCE(d.da_xoa, 0) = 0 AND q.qid IN (SELECT value FROM json_each(?))`).bind(JSON.stringify(qids.slice(i, i + 800))).all<Row>()
    for (const x of r.results ?? []) {
      const qid = str(x.qid)
      if (ra.has(qid)) continue
      try { ra.set(qid, { group: str(x.content_group), q: JSON.parse(str(x.json)) as PrivateQuestion }) } catch { /* dòng hỏng: bỏ */ }
    }
  }
  return ra
}

/**
 * KHO CÂU SAI CHUNG của em từ mốc (chế độ 1, 2, 4 cùng dùng) — khử trùng qid + nhóm nội dung; bỏ tự luận, câu đang bảo vệ, câu đã đổi/rút khỏi kho;
 * kèm trạng thái ôn cách quãng từng câu; câu ĐÃ KHẮC PHỤC (không sai lại sau đó) rời `ds` nhưng vẫn đếm vào `tong` / `daKhacPhuc`.
 * `loi` ≠ '' khi kho (còn lại) rỗng hoặc phải đóng cửa.
 */
export async function docKhoCauSai(env: Env, sbd: string): Promise<KhoCauSai> {
  const rong = (loi: string): KhoCauSai => ({ ds: [], tuCa: 0, tuChienDich: 0, tuLuyenDe: 0, tuTuLuyen: 0, tong: 0, daKhacPhuc: 0, lichSu: [], loi })
  const lan = await docLanSai(env, sbd)
  if (!lan.length) return rong(LOI_KHO_CAU_SAI_TRONG)
  const tenCd = lan.some((l) => LA_TRO.has(l.loai)) ? await docTenChienDich(env, sbd) : new Map<string, string>()
  const theoQid = new Map<string, LanSai[]>()
  for (const l of lan) {
    if (LA_TRO.has(l.loai)) l.tenChienDich = tenCd.get(l.qid) ?? ''
    theoQid.set(l.qid, [...(theoQid.get(l.qid) ?? []), l])
  }
  const noiDung = await docNoiDung(env, [...theoQid.keys()])
  const baoVe = await docBaoVeKho(env)
  if (!baoVe) return rong(LOI_CHUA_KIEM_BAO_VE)
  // Khử trùng theo NHÓM NỘI DUNG: cùng một đề chép ở nhiều tờ ⇒ một câu (gộp lịch sử sai), giữ qid có lần sai gần nhất.
  const theoNhom = new Map<string, Omit<CauSaiKho, 'khacPhuc'>>()
  for (const [qid, ds] of theoQid) {
    const nd = noiDung.get(qid)
    if (!nd || laCauTuLuan(nd.q) || baoVe.has(qid) || (nd.group && baoVe.has(nd.group))) continue
    const khoa = nd.group || `qid|${qid}`
    const cu = theoNhom.get(khoa)
    const xep = [...ds].sort(theoLuc)
    if (!cu) { theoNhom.set(khoa, { qid, q: nd.q, lanSai: xep, kho: laCauKho(nd.q), qids: [qid] }); continue }
    const gop = [...cu.lanSai, ...xep].sort(theoLuc)
    const moiHon = xep[xep.length - 1]!.luc > cu.lanSai[cu.lanSai.length - 1]!.luc
    const qids = [...cu.qids, qid]
    theoNhom.set(khoa, moiHon ? { qid, q: nd.q, lanSai: gop, kho: laCauKho(nd.q), qids } : { ...cu, lanSai: gop, qids })
  }
  const tatCa = await chanKhacKhoiEm(env, 'tu_luyen_kho_sai', sbd, [...theoNhom.values()], { cauCua: (c) => c.q }) // LUẬT THẦY 05/10: câu sai cũ KHÁC khối em không vào kho câu sai (chế độ 1, 2, 4)
  if (!tatCa.length) return rong(LOI_KHO_CAU_SAI_TRONG)
  const tt = await docKhacPhuc(env, sbd)
  const ds: CauSaiKho[] = []
  const lichSu: KhoCauSai['lichSu'] = []
  let daKhacPhuc = 0
  for (const c of tatCa) {
    const hl = khacPhucHieuLuc(c.qids.map((x) => tt.get(x)).find(Boolean) ?? null, saiCuoiMs(c.lanSai))
    lichSu.push({ qid: c.qid, vao: Date.parse(c.lanSai[0]!.luc) || 0, khacPhucLuc: hl?.daKhacPhucLuc ?? null })
    if (hl?.daKhacPhucLuc) { daKhacPhuc++; continue }
    ds.push({ ...c, khacPhuc: hl })
  }
  const dem = (loai: (l: LoaiNguonSai) => boolean) => ds.filter((c) => loai(c.lanSai[0]!.loai)).length
  return {
    ds,
    tuCa: dem((l) => l === 'ca'),
    tuChienDich: dem((l) => LA_TRO.has(l)),
    tuLuyenDe: dem((l) => l === 'luyen_de'),
    tuTuLuyen: dem((l) => l === 'tu_luyen'),
    tong: tatCa.length,
    daKhacPhuc,
    lichSu,
    loi: ds.length ? '' : `Em đã khắc phục hết ${tatCa.length} câu sai từ 29/09.`,
  }
}

/** Lần sai GẦN NHẤT (ms) trong lịch sử sai của một câu. */
export const saiCuoiMs = (ds: readonly LanSai[]): number => ds.reduce((m, l) => Math.max(m, Date.parse(l.luc) || 0), 0)

/** Số lần mỗi câu (qid gốc) đã có trong lượt Tu luyện ĐÃ NỘP của em + lần gần nhất (ms). Bảng chưa có ⇒ rỗng. */
export async function docLanLuyen(env: Env, sbd: string): Promise<Map<string, { n: number; cuoi: number }>> {
  const r = await env.DB.prepare('SELECT qid, COUNT(*) AS n, MAX(nop_luc) AS cuoi FROM tu_luyen_cau WHERE sbd = ? GROUP BY qid').bind(sbd).all<Row>()
    .catch(() => ({ results: [] as Row[] }))
  const ra = new Map<string, { n: number; cuoi: number }>()
  for (const x of r.results ?? []) {
    const q = qidGoc(str(x.qid))
    const cu = ra.get(q) ?? { n: 0, cuoi: 0 }
    ra.set(q, { n: cu.n + (Number(x.n) || 0), cuoi: Math.max(cu.cuoi, Number(x.cuoi) || 0) })
  }
  return ra
}

// ------------------------------------------------------------------ CHỌN NGUỒN CÂU SAI (thầy lệnh 30/09: "cho hs chọn tick nguồn để rút câu")
// Sáu nguồn, thứ tự cố định = thứ tự BIT trong mặt nạ (máy em dùng cùng thứ tự — src/components/tu-luyen/nguon-cau-sai.ts).
export const DS_NGUON_SAI: readonly LoaiNguonSai[] = ['ca', 'dao', 'doan', 'bia', 'tu_luyen', 'luyen_de']
const BIT_NGUON = new Map(DS_NGUON_SAI.map((l, i) => [l, 1 << i]))

/** Mặt nạ nguồn của một câu: bit i bật ⇔ câu có ít nhất một lần sai thuộc nguồn DS_NGUON_SAI[i]. */
export const matNguon = (ds: readonly LanSai[]): number => ds.reduce((m, l) => m | (BIT_NGUON.get(l.loai) ?? 0), 0)

/**
 * Đếm câu còn trong kho theo nguồn — một câu sai ở nhiều nguồn được đếm cho MỖI nguồn (`theoNguon`);
 * `theoMat` = số câu theo từng mặt nạ nguồn (≤ 63 khoá) để máy em tính NGAY tổng câu DUY NHẤT của bất kỳ tổ hợp nguồn nào mà không hỏi lại máy chủ.
 */
export function demTheoNguon(ds: readonly { lanSai: readonly LanSai[] }[]): { theoNguon: Record<LoaiNguonSai, number>; theoMat: Record<string, number> } {
  const theoNguon = Object.fromEntries(DS_NGUON_SAI.map((l) => [l, 0])) as Record<LoaiNguonSai, number>
  const theoMat: Record<string, number> = {}
  for (const c of ds) {
    const m = matNguon(c.lanSai)
    if (!m) continue
    theoMat[m] = (theoMat[m] ?? 0) + 1
    DS_NGUON_SAI.forEach((l, i) => { if (m & (1 << i)) theoNguon[l]++ })
  }
  return { theoNguon, theoMat }
}

/** Đọc CHẶT danh sách nguồn từ máy em. Không gửi (máy bản cũ) ⇒ null = mọi nguồn; gửi mảng ⇒ chỉ giữ tên nguồn hợp lệ (có thể rỗng). */
export function docDsNguon(v: unknown): Set<LoaiNguonSai> | null {
  if (!Array.isArray(v)) return null
  const hop = new Set<string>(DS_NGUON_SAI)
  return new Set(v.map((x) => str(x).trim()).filter((x): x is LoaiNguonSai => hop.has(x)))
}

/** Câu có ít nhất một lần sai thuộc nguồn đã chọn. `nguon = null` ⇒ giữ cả kho. */
export function locTheoNguon<T extends { lanSai: readonly LanSai[] }>(ds: readonly T[], nguon: ReadonlySet<LoaiNguonSai> | null): T[] {
  if (!nguon) return [...ds]
  return ds.filter((c) => c.lanSai.some((l) => nguon.has(l.loai)))
}

export const LOI_CHUA_CHON_NGUON = 'Em chọn ít nhất 1 nguồn câu sai.'
