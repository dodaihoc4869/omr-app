// OMNI 3 · CHƯƠNG TRÌNH "CẨN THẬN" — đặc tả DAC-TA-BUILD-OMNI-3-0510.md mục 4.6 (thầy 05/10 "làm tất nhé, tôi ko duyệt gì cả" + 06/10 "Làm nốt đi tất cả").
// Khi Sơ ý S_em > 0,07 (đúng số em thấy ở Sảnh — đủ dữ liệu mới có) có ba việc tự động, CHỈ cho em máy chủ báo `canThan = true`:
//   (a) câu đã vững vẫn quay lại ôn duy trì dày hơn: mốc kiểm duy trì 14/30 ngày × 0,7 (`nhanMocDuyTri`, móc ở `docHoSo2` — lúc LẬP kế hoạch ngày);
//   (b) trước khi nộp câu Phần III hiện ô "Soát lại đơn vị và số liệu" (một chạm, KHÔNG bắt buộc) — phía máy em (Đảo 2.0, Đoàn, Làm câu ôn);
//   (c) lượt chắc-mà-sai ở câu vững hiện thẻ "Em biết câu này. Sai vì bước nào?" — em bấm một bước (hoặc "Em chưa rõ") ⇒ ghi sổ riêng `omni_buoc_sai`, KHÔNG chấm.
// S_em ≤ ngưỡng, chưa đủ dữ liệu, hoặc OMNI tắt ⇒ KHÔNG có gì thêm: mọi hàm ở đây trả đúng như hôm nay (mốc không đổi, không trường `canThan`, không thẻ).
// Không bao giờ viết "em bất cẩn". Tệp THUẦN (trừ `ghiBuocSai`): chỉ import hằng/kiểu — KHÔNG import omni-d1 / srs2-d1 (tránh vòng phụ thuộc); nơi gọi đưa hồ sơ/tên bước vào.
// Bảng chỉ-thêm `omni_buoc_sai` tạo lúc chạy (CREATE TABLE IF NOT EXISTS, một lần mỗi isolate) — KHÔNG đụng sổ học `su_kien_hoc` (append-only), KHÔNG xoá/ghi đè gì.
import type { Env } from './kieu'
import { THAM_SO_OMNI, type HoSoOmniEm, type KetQuaOmniTraLoi, type LuaChonBuocSai, type ThamSoOmni } from './omni-kieu'
import { tachSongSinh, type ThamSoLuat } from './loi-hoc-luat'
import { chayDdlMotLan } from './ddl-mot-lan'

const str = (v: unknown): string => (v == null ? '' : String(v))

/** Mốc duy trì nhỏ nhất sau khi nhân hệ số (cùng cận dưới `chuanThamSo` của tu-hoan-thien.ts: số nguyên ≥ 3 ngày). */
const MOC_TOI_THIEU = 3
/** Số lựa chọn bước tối đa của thẻ (c) — đặc tả "3 lựa chọn tên lỗi"; thêm nút "Em chưa rõ" ở máy em (không tính vào đây). */
export const LUA_CHON_BUOC_TOI_DA = 3
/** Mã lựa chọn "Em chưa rõ" (máy em gửi khi chạm nút ấy). */
export const MA_EM_CHUA_RO = 'chua_ro'

// ---------------------------------------------------------------- cờ `canThan`
/**
 * S_em dùng để quyết = số em THẤY ở Sảnh: chỉ có khi ĐỦ DỮ LIỆU (≥ S_AO lượt ở câu đã vững). Chưa đủ ⇒ null. Lý do: prior S0 = 0,08 đã LỚN HƠN ngưỡng 0,07 —
 * không có ràng buộc này thì em mới (chưa làm gì) bị coi là "sơ ý" và hiện ô/thẻ thêm, trái đặc tả ("S_em ≤ 0,07 ⇒ không có gì thêm") và trái số em thấy.
 */
export function sEmDeXet(hs: Pick<HoSoOmniEm, 'sEm' | 'nVung'> | null | undefined, ts: ThamSoOmni = THAM_SO_OMNI): number | null {
  if (!hs || !Number.isFinite(hs.sEm) || !(hs.nVung >= ts.S_AO)) return null
  return hs.sEm
}
/** `canThan` = OMNI bật cho em ∧ S_em (đủ dữ liệu) > ngưỡng của đặc tả (`C_SO_Y` = 0,07, nghiêm ngặt). Thuần. */
export function canThanTu(batOmni: boolean, hs: Pick<HoSoOmniEm, 'sEm' | 'nVung'> | null | undefined, ts: ThamSoOmni = THAM_SO_OMNI): boolean {
  if (!batOmni) return false
  const s = sEmDeXet(hs, ts)
  return s !== null && s > ts.C_SO_Y
}

// ---------------------------------------------------------------- (a) ôn duy trì dày hơn
/**
 * Mốc kiểm duy trì × hệ số (mặc định 0,7): [14, 30] ⇒ [10, 21]. Làm tròn gần nhất, ≥ 3 ngày, tăng dần (mốc sau luôn lớn hơn mốc trước ≥ 1 ngày).
 * `canThan` sai ⇒ trả CHÍNH tham số vào (không sao chép) — nơi gọi y hệt hôm nay. Không đổi `cachSaiCuoi`, `gioDocLoiGiai`. Thuần.
 */
export function nhanMocDuyTri(ts: ThamSoLuat, canThan: boolean, heSo: number = THAM_SO_OMNI.CAN_THAN_HE_SO_MOC): ThamSoLuat {
  if (!canThan || !ts.mocDuyTri.length) return ts
  const moc: number[] = []
  for (const m of ts.mocDuyTri) {
    const x = Math.max(MOC_TOI_THIEU, Math.round(m * heSo))
    moc.push(moc.length && x <= moc[moc.length - 1]! ? moc[moc.length - 1]! + 1 : x)
  }
  return { ...ts, mocDuyTri: moc }
}

// ---------------------------------------------------------------- (c) thẻ "Sai vì bước nào?"
/**
 * Tên bước đưa lên màn HỌC SINH (luật chữ 05/10): không mã nội bộ (`nen:…`, `dang:…`, `cau:…`, `cd:…`, `<mã>#<số>`), không chữ "vi kỹ năng". Không đạt ⇒ null.
 * (Cùng luật `chuChoEm` của Trạm hồi phục — omni-game.ts.)
 */
export function tenBuocChoEm(v: unknown): string | null {
  const s = str(v).trim()
  if (!s || /^(nen|dang|cau|cd):/i.test(s) || /#\d+$/.test(s) || /vi\s*kỹ\s*năng/i.test(s.normalize('NFC'))) return null
  return s
}
/**
 * Các lựa chọn của thẻ (c) từ vi kỹ năng của câu (cả câu ∪ từng ý Phần II) và bảng tên: bước tính `nen:*` TRƯỚC (đúng chỗ em hay sơ ý), rồi vi kỹ năng khác,
 * `dang:*` (tên dạng) SAU cùng; giữ thứ tự của ma trận Q trong mỗi nhóm; bỏ tên mã nội bộ / tên trùng; tối đa LUA_CHON_BUOC_TOI_DA. Không lựa chọn nào ⇒ []. Thuần.
 */
export function luaChonBuocSai(vkn: readonly string[], ten: ReadonlyMap<string, { ten?: string | null }>): LuaChonBuocSai[] {
  const hang = (k: string): number => (k.startsWith('nen:') ? 0 : k.startsWith('dang:') ? 2 : 1)
  const ds = [...new Set(vkn.filter(Boolean))].map((k, i) => ({ k, i })).sort((a, b) => hang(a.k) - hang(b.k) || a.i - b.i)
  const ra: LuaChonBuocSai[] = []
  const daCo = new Set<string>()
  for (const { k } of ds) {
    const t = tenBuocChoEm(ten.get(k)?.ten)
    if (!t || daCo.has(t.toLocaleLowerCase('vi'))) continue
    daCo.add(t.toLocaleLowerCase('vi'))
    ra.push({ ma: k, ten: t })
    if (ra.length >= LUA_CHON_BUOC_TOI_DA) break
  }
  return ra
}
/**
 * Phần THÊM của kết quả `answer` (đưa vào `omni`): `canThan` sai ⇒ `{}` (không trường nào). `canThan` đúng ⇒ `{ canThan: true }`; thêm `buocSai` khi lượt này là
 * CHẮC-MÀ-SAI (đã vững mà tự tin sai) và tra được ≥ 1 tên bước. `tenVkn` do nơi gọi đưa vào (omni-d1 `vknTheoId`) — chỉ gọi ở nhánh chắc-mà-sai ∧ canThan
 * (hiếm) ⇒ không thêm truy vấn D1 nào ở lượt thường. Lỗi tra tên ⇒ chỉ `{ canThan: true }`, KHÔNG làm hỏng lượt trả lời.
 */
export async function phanCanThanChoTraLoi(a: { canThan: boolean; chacMaSai: boolean; vkn: readonly string[]; tenVkn: (ids: string[]) => Promise<ReadonlyMap<string, { ten?: string | null }>> }): Promise<Pick<KetQuaOmniTraLoi, 'canThan' | 'buocSai'>> {
  if (!a.canThan) return {}
  if (!a.chacMaSai) return { canThan: true }
  const ids = [...new Set(a.vkn.filter(Boolean))]
  if (!ids.length) return { canThan: true }
  try {
    const lua = luaChonBuocSai(ids, await a.tenVkn(ids))
    return lua.length ? { canThan: true, buocSai: { lua } } : { canThan: true }
  } catch {
    return { canThan: true }
  }
}

// ---------------------------------------------------------------- ghi sổ riêng `omni_buoc_sai`
/** Lệnh `hoa2-omni-*` mới của làn này (omni-game.ts `LENH_OMNI_HOA2` nối thêm). */
export const LENH_OMNI_CAN_THAN: readonly string[] = ['hoa2-omni-buoc-sai']
/** Bảng chỉ-thêm: một dòng cho mỗi (em, câu gốc, ngày VN) — em bấm lại cùng câu cùng ngày (mạng chập chờn gọi lại) không thêm dòng. */
export const LENH_TAO_BANG_CAN_THAN: readonly string[] = [
  'CREATE TABLE IF NOT EXISTS omni_buoc_sai (sbd TEXT NOT NULL, qid TEXT NOT NULL, ngay TEXT NOT NULL, ma_vkn TEXT NOT NULL, luc TEXT NOT NULL, PRIMARY KEY (sbd, qid, ngay))',
]
export const damBaoBangCanThan = (env: Env): Promise<void> => chayDdlMotLan(env, 'omni_can_than_0610', LENH_TAO_BANG_CAN_THAN)
/** Trần số dòng `omni_buoc_sai` của MỘT em trong MỘT ngày (chắc-mà-sai thật chỉ vài lượt/ngày; trần chặn máy gửi lệnh dồn dập làm đầy bảng). */
export const TRAN_BUOC_SAI_NGAY = 200
const MA_QID_HOP_LE = /^[\w.-]{1,80}$/
const MA_BUOC_HOP_LE = /^(?:chua_ro|[\w.:#-]{1,100})$/
/**
 * `hoa2-omni-buoc-sai {qid, ma}` — em bấm một bước ở thẻ "Em biết câu này. Sai vì bước nào?" (hoặc "Em chưa rõ"): ghi MỘT dòng `omni_buoc_sai` (tối đa TRAN_BUOC_SAI_NGAY dòng/em/ngày). KHÔNG chấm, KHÔNG đổi
 * sổ học, KHÔNG đổi P/EXP. `qid` quy về câu GỐC (bỏ `#n`, `~ss…`). Dòng đã có (cùng em, câu, ngày) ⇒ giữ lựa chọn đầu, `daGhi:false`. Nơi gọi đã kiểm OMNI bật cho em.
 */
export async function ghiBuocSai(env: Env, sbd: string, b: Record<string, unknown>, nowMs: number): Promise<Record<string, unknown>> {
  const qid = tachSongSinh(str(b.qid).trim()).goc
  const ma = str(b.ma).trim()
  if (!MA_QID_HOP_LE.test(qid)) return { ok: false, error: 'Câu em chọn không hợp lệ.' }
  if (!MA_BUOC_HOP_LE.test(ma)) return { ok: false, error: 'Bước em chọn không hợp lệ.' }
  await damBaoBangCanThan(env)
  const ngay = new Date(nowMs + 7 * 3_600_000).toISOString().slice(0, 10)
  const r = await env.DB.prepare('INSERT OR IGNORE INTO omni_buoc_sai (sbd, qid, ngay, ma_vkn, luc) SELECT ?,?,?,?,? WHERE (SELECT COUNT(*) FROM omni_buoc_sai WHERE sbd = ? AND ngay = ?) < ?')
    .bind(sbd, qid, ngay, ma, new Date(nowMs).toISOString(), sbd, ngay, TRAN_BUOC_SAI_NGAY).run()
  return { ok: true, daGhi: Number(r.meta?.changes ?? 0) > 0 }
}
