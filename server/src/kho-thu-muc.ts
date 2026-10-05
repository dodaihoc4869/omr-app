// OMNI 3 — HAI THƯ MỤC MỤC ĐÍCH CỦA KHO: DẠY HỌC (tick bài, game) · TU LUYỆN (mọi tờ còn lại: chỉ Tu luyện + ca kiểm tra).
// Đặc tả: DAC-TA-BUILD-OMNI-3-0510.md mục 2 · prompt-tick-bai-tu-giao.md mục E · hợp đồng docs/hop-dong-omni-3.md mục B.
// Bảng CHỈ-THÊM `de_kho_thu_muc (ma_de PK, thu_muc 'DAY_HOC'|'TU_LUYEN', cap_nhat_luc)` — tạo lúc chạy (CI không chạy migration),
// câu tạo y hệt server/migration-0510-omni-3.sql. Hai đường ghi:
//   · app thầy đồng bộ `POST /kho/thu-muc` (≤ 1 lần/ngày, ≤ 400 mã/lệnh) — `gvKhoThuMuc`;
//   · lúc thầy đẩy tờ lên kho (`dayDeKho`, index.ts) — `ghiThuMucKhiDayDe` suy từ trường `nhom` của tờ (không bao giờ ném lỗi).
// Thiếu dòng ⇒ TU_LUYEN, TRỪ mã bắt đầu bằng "DH-" ⇒ DAY_HOC. Khoá bảng là MÃ GỐC (mã tách phần -TN/-DS/-TLN quy về gốc).
// Thư mục KHÔNG ghi đè `nhom` của tờ, không di chuyển dữ liệu: chỉ là một nhãn mục đích để máy chủ lọc nguồn câu.
import type { Env } from './kieu'
import { chayDdlMotLan } from './ddl-mot-lan'
import { tachMaTo } from './srs2-gv'
import { thuMucCuaDe } from '../../src/lib/cay-chon-de'

export type ThuMuc = 'DAY_HOC' | 'TU_LUYEN'
/** Luật lùi khi chưa đồng bộ: mã "DH-…" là DẠY HỌC, còn lại TU LUYỆN. Thuần. */
export const thuMucTheoMa = (maDe: string): ThuMuc => (maDe.trim().toUpperCase().startsWith('DH-') ? 'DAY_HOC' : 'TU_LUYEN')

type Row = Record<string, unknown>
const str = (v: unknown): string => (v == null ? '' : String(v))
const laThuMuc = (v: unknown): v is ThuMuc => v === 'DAY_HOC' || v === 'TU_LUYEN'
/** Mã gốc của một mã tờ (bỏ hậu tố tách phần). */
const maGoc = (maDe: string): string => tachMaTo(maDe).goc

/** Câu tạo bảng — y hệt dòng tương ứng trong server/migration-0510-omni-3.sql (test khoá). */
export const SQL_BANG_THU_MUC: readonly string[] = [
  'CREATE TABLE IF NOT EXISTS de_kho_thu_muc (ma_de TEXT PRIMARY KEY, thu_muc TEXT NOT NULL, cap_nhat_luc TEXT NOT NULL)',
]
/** Tạo bảng (IF NOT EXISTS), một lần mỗi isolate (ddl-mot-lan.ts). */
export function damBaoBangThuMuc(env: Env): Promise<void> {
  return chayDdlMotLan(env, 'de_kho_thu_muc', SQL_BANG_THU_MUC)
}

/** Tên thư mục DẠY HỌC trên cây kho của app thầy (src/lib/day-hoc-len-bang.ts `TEN_THU_MUC_DAY_HOC`). */
const TEN_THU_MUC_DAY_HOC = 'DẠY HỌC'
/**
 * Thư mục mục đích suy từ tờ: mã "DH-" ⇒ DẠY HỌC; thư mục lớn của `nhom` ("12 · DẠY HỌC/C1 - Ester lipid" ⇒ "DẠY HỌC") ⇒ DẠY HỌC;
 * mọi thư mục khác hoặc không có thư mục ⇒ TU LUYỆN. Cùng luật cây kho của app thầy (`thuMucCuaDe` + so NFC chữ hoa như `laDeDayHoc`). Thuần.
 */
export function thuMucTuNhom(maDe: string, nhom: unknown): ThuMuc {
  if (thuMucTheoMa(maDe) === 'DAY_HOC') return 'DAY_HOC'
  const tm = thuMucCuaDe({ nhom: typeof nhom === 'string' ? nhom : '' }).normalize('NFC').toUpperCase()
  return tm === TEN_THU_MUC_DAY_HOC ? 'DAY_HOC' : 'TU_LUYEN'
}

/** Ghi (upsert) một lô mã gốc → thư mục; chỉ đổi `cap_nhat_luc` khi thư mục thật sự đổi. Trả số dòng D1 báo đã ghi. */
async function ghiLo(env: Env, ds: readonly (readonly [string, ThuMuc])[], nowMs: number): Promise<number> {
  if (!ds.length) return 0
  await damBaoBangThuMuc(env)
  // `WHERE true`: bắt buộc với INSERT … SELECT … ON CONFLICT (SQLite phân biệt mệnh đề ON của JOIN).
  const r = await env.DB.prepare(`INSERT INTO de_kho_thu_muc (ma_de, thu_muc, cap_nhat_luc)
      SELECT json_extract(value, '$[0]'), json_extract(value, '$[1]'), ? FROM json_each(?) WHERE true
      ON CONFLICT(ma_de) DO UPDATE SET thu_muc = excluded.thu_muc, cap_nhat_luc = excluded.cap_nhat_luc
      WHERE de_kho_thu_muc.thu_muc <> excluded.thu_muc`).bind(new Date(nowMs).toISOString(), JSON.stringify(ds)).run()
  return Number(r.meta?.changes ?? 0)
}

/** Số mã tối đa mỗi lệnh `/kho/thu-muc`. */
export const TOI_DA_MA_MOI_LENH = 400

/**
 * `POST /kho/thu-muc {ds:[{maDe, thuMuc}]}` (sau cổng thầy) ⇒ { ok, daGhi }.
 * Chỉ nhận thư mục 'DAY_HOC' | 'TU_LUYEN' (dòng khác bỏ qua, đếm ở `boQua`); quá 400 mã ⇒ từ chối cả lệnh (app thầy chia lô).
 * `daGhi` = số mã gốc hợp lệ đã nhận (ghi lại đúng thư mục cũ là vô hại, không đổi `cap_nhat_luc`).
 */
export async function gvKhoThuMuc(env: Env, b: Record<string, unknown>, nowMs = Date.now()): Promise<Record<string, unknown>> {
  if (!Array.isArray(b.ds)) return { ok: false, error: 'Thiếu danh sách tờ đề cần ghi thư mục.' }
  if (b.ds.length > TOI_DA_MA_MOI_LENH) return { ok: false, error: `Mỗi lần ghi tối đa ${TOI_DA_MA_MOI_LENH} tờ đề. Thầy chia nhỏ rồi gửi lại.` }
  const theoMa = new Map<string, ThuMuc>()
  let boQua = 0
  for (const x of b.ds as unknown[]) {
    const o = (x && typeof x === 'object' ? x : {}) as Row
    const ma = maGoc(str(o.maDe))
    if (!ma || !laThuMuc(o.thuMuc)) { boQua++; continue }
    theoMa.set(ma, o.thuMuc)
  }
  try {
    await ghiLo(env, [...theoMa], nowMs)
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
  return { ok: true, daGhi: theoMa.size, ...(boQua ? { boQua } : {}) }
}

/**
 * Thư mục của các mã tờ (mã gốc hoặc mã tách phần đều được; khoá Map = đúng chuỗi đã truyền vào).
 * Mã tách phần tra theo mã gốc; thiếu dòng / bảng chưa có / lỗi đọc ⇒ luật lùi `thuMucTheoMa`.
 */
export async function thuMucCuaMaDe(env: Env, maDe: readonly string[]): Promise<Map<string, ThuMuc>> {
  const gocCua = new Map<string, string>()
  for (const m of maDe) gocCua.set(m, maGoc(str(m)))
  const ds = [...new Set(gocCua.values())].filter(Boolean)
  const bang = new Map<string, ThuMuc>()
  if (ds.length) {
    try {
      const r = await env.DB.prepare('SELECT ma_de, thu_muc FROM de_kho_thu_muc WHERE ma_de IN (SELECT value FROM json_each(?))').bind(JSON.stringify(ds)).all<Row>()
      for (const x of r.results ?? []) if (laThuMuc(x.thu_muc)) bang.set(str(x.ma_de), x.thu_muc)
    } catch {
      // bảng chưa có (chưa đồng bộ lần nào) ⇒ luật lùi
    }
  }
  return new Map([...gocCua].map(([m, g]) => [m, bang.get(g) ?? thuMucTheoMa(g)]))
}

/**
 * Lúc thầy đẩy một tờ lên kho (`dayDeKho`): ghi thư mục suy từ `nhom` của tờ (`thuMucTuNhom`). Phiên điều phối gọi trong index.ts.
 * KHÔNG BAO GIỜ ném lỗi ra ngoài (lỗi ghi ⇒ bỏ qua; app thầy đồng bộ lại ở `/kho/thu-muc`).
 */
export async function ghiThuMucKhiDayDe(env: Env, maDe: string, nhom: string | null | undefined, nowMs = Date.now()): Promise<void> {
  try {
    const ma = maGoc(str(maDe))
    if (!ma) return
    await ghiLo(env, [[ma, thuMucTuNhom(ma, nhom)]], nowMs)
  } catch {
    // không chặn việc đẩy tờ
  }
}
