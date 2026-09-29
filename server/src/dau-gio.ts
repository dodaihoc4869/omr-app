// KIỂM TRA ĐẦU GIỜ — lệnh thầy `POST /gv/dau-gio {action, …}` (thẻ "Kiểm tra đầu giờ" của mục Lên bảng; đặc tả docs/DAC-TA-KIEM-TRA-DAU-GIO-SO-NO-2909.md mục B).
// Dùng CHUNG buổi học + điểm danh của thẻ Dạy học (`buoi-hoc.ts`): chỉ em CÓ MẶT của buổi đang mở mới được gọi.
//
//   ung-vien {buoiId}                 ĐỌC — mỗi em có mặt CHƯA gọi trong buổi: các câu em đã làm ĐÚNG (lần gần nhất đúng, kể cả đã khắc phục) trong MỌI chiến dịch,
//                                     MỌI nguồn của sổ `su_kien_hoc` tới lúc bấm (đi chỉ mục (sbd, qid)), BỎ câu em từng được hỏi ở đầu giờ (mọi buổi),
//                                     xếp "thành thạo ảo" trước (`src/lib/dau-gio.ts`), ≤ 40 câu/em.
//   chot {buoiId, cap[{sbd,qid,chuyenDe}]}  GHI — lưu lượt hỏi (app đã chọn ≤ 6 em bằng `chonLuotDauGio`). Máy chủ KIỂM LẠI mọi luật: ≤ 6 em, em có mặt,
//                                     em chưa gọi trong buổi, không trùng câu trong lượt/buổi, câu em ĐÃ làm đúng, và (sbd, qid) CHƯA TỪNG hỏi (khoá chính).
//   cham {buoiId, sbd, qid, dat}      GHI — Đạt / Chưa đạt. IDEMPOTENT theo buổi + em + câu: chấm lần hai trả kết quả đã có, không ghi sổ lần hai.
//                                     Ghi sổ bằng đường ghi sẵn có `ghiSuKien` với nguon = 'dau_gio', ket_qua 1/0 (hợp đồng với trợ lý A — sổ nợ + luật "Đạt ⇒ thành thạo").
//   da-chua {buoiId, sbd, qid}        GHI — ô "Thầy đã chữa": nhãn (ngày) vào `thay_da_chua` + mốc dạy lại (`ghiMocDayLai`, hợp đồng với A). Idempotent theo buổi + em + câu.
//   ket-thuc {buoiId}                 GHI — dừng: câu chưa chấm chuyển 'bo' (KHÔNG ghi gì vào sổ); sau đó không chấm / gọi thêm được nữa trong buổi.
//   xem {buoiId}                      ĐỌC — các lượt hỏi của buổi (mở lại app giữa buổi vẫn thấy bảng chấm).
//   lich-su {cap[{sbd,qid}]}          ĐỌC — lịch sử từng cặp cho thẻ tên: "Sai 20/09 (Ca) · Đúng 22/09 (Đoàn) · Đúng 25/09 (Bi-a)" (bỏ sự kiện CHE của ca chưa công bố).
//
// BẢNG (chỉ-thêm, tạo lúc chạy):
//   dau_gio_hoi   (sbd, qid, buoi_id, luot, hoi_luc, chuyen_de, trang_thai 'cho'|'dat'|'chua_dat'|'bo', cham_luc, da_chua_luc)  PK (sbd, qid) ⇒ một em KHÔNG BAO GIỜ bị hỏi lại một câu.
//   dau_gio_buoi  (buoi_id, ket_thuc_luc) — buổi đã bấm "Kết thúc" kiểm tra đầu giờ (không gọi thêm / chấm nữa).
//   thay_da_chua  (sbd, qid, nguon, ma_nguon, luc, ngay_vn)  PK (sbd, qid, nguon, ma_nguon) — nhãn "Thầy đã chữa" (ngày) của câu em.
import type { Env } from './kieu'
import { chayDdlMotLan } from './ddl-mot-lan'
import { ghiSuKien, ngayVn } from './su-kien-hoc'
// Mốc dạy lại của Sổ nợ (trợ lý A, docs/so-no-2909/HOP-DONG.md mục 2): ghi `srs2_day_lai` ⇒ đếm sai về 0, câu quay lại kế hoạch hôm sau.
import { ghiMocDayLai } from './srs2-d1'
import { chuLichSuCau, tenNguonNgan, xepUngVien, TOI_DA_EM_MOI_LUOT, TOI_DA_UNG_VIEN_MOI_EM, type LanLamNgan, type UngVienCau } from '../../src/lib/dau-gio'

type Row = Record<string, unknown>
const str = (x: unknown): string => (x === null || x === undefined ? '' : String(x)).trim()
const num = (x: unknown): number => (Number.isFinite(Number(x)) ? Number(x) : 0)

export const NGUON_DAU_GIO = 'dau_gio' as const
export const TOI_DA_EM_UNG_VIEN = 120
export const TOI_DA_CAP_LICH_SU_DAU_GIO = 24

export const SQL_TAO_BANG_DAU_GIO = [
  "CREATE TABLE IF NOT EXISTS dau_gio_hoi (sbd TEXT NOT NULL, qid TEXT NOT NULL, buoi_id TEXT NOT NULL, luot INTEGER NOT NULL, hoi_luc TEXT NOT NULL, chuyen_de TEXT NOT NULL DEFAULT '', trang_thai TEXT NOT NULL DEFAULT 'cho', cham_luc TEXT, da_chua_luc TEXT, PRIMARY KEY (sbd, qid))",
  'CREATE INDEX IF NOT EXISTS idx_dau_gio_hoi_buoi ON dau_gio_hoi(buoi_id, luot)',
  'CREATE TABLE IF NOT EXISTS dau_gio_buoi (buoi_id TEXT PRIMARY KEY, ket_thuc_luc TEXT NOT NULL)',
  'CREATE TABLE IF NOT EXISTS thay_da_chua (sbd TEXT NOT NULL, qid TEXT NOT NULL, nguon TEXT NOT NULL, ma_nguon TEXT NOT NULL, luc TEXT NOT NULL, ngay_vn TEXT NOT NULL, PRIMARY KEY (sbd, qid, nguon, ma_nguon))',
]

async function taoBang(env: Env): Promise<void> {
  await chayDdlMotLan(env, 'dau_gio', SQL_TAO_BANG_DAU_GIO)
}

async function hoi(env: Env, sql: string, ...bind: unknown[]): Promise<Row[] | null> {
  try {
    return (await env.DB.prepare(sql).bind(...bind).all<Row>()).results ?? []
  } catch {
    return null
  }
}

/** Buổi + danh sách có mặt. */
async function docBuoiCoMat(env: Env, buoiId: string, nowMs: number): Promise<{ dangMo: boolean; coMat: Map<string, string> } | null> {
  const b = (await hoi(env, 'SELECT id, het_han, dong_luc FROM buoi_hoc WHERE id = ?', buoiId))?.[0]
  if (!b) return null
  const dangMo = !str(b.dong_luc) && Date.parse(str(b.het_han)) > nowMs
  const r =
    (await hoi(env, "SELECT d.sbd, h.ho_ten FROM buoi_hoc_diem_danh d LEFT JOIN hoc_sinh h ON h.sbd = d.sbd WHERE d.buoi_id = ? AND d.trang_thai = 'co_mat' ORDER BY d.luc, d.sbd", buoiId)) ?? []
  return { dangMo, coMat: new Map(r.map((x) => [str(x.sbd), str(x.ho_ten)])) }
}

/** Các lượt hỏi của buổi (mọi trạng thái). */
async function docLuotBuoi(env: Env, buoiId: string): Promise<Row[]> {
  return (
    (await hoi(
      env,
      'SELECT d.sbd, d.qid, d.luot, d.hoi_luc, d.chuyen_de, d.trang_thai, d.cham_luc, d.da_chua_luc, h.ho_ten FROM dau_gio_hoi d LEFT JOIN hoc_sinh h ON h.sbd = d.sbd WHERE d.buoi_id = ? ORDER BY d.luot, d.hoi_luc, d.sbd',
      buoiId,
    )) ?? []
  )
}
const luotRa = (x: Row) => ({
  sbd: str(x.sbd),
  hoTen: str(x.ho_ten),
  qid: str(x.qid),
  luot: num(x.luot),
  chuyenDe: str(x.chuyen_de),
  trangThai: (['cho', 'dat', 'chua_dat', 'bo'].includes(str(x.trang_thai)) ? str(x.trang_thai) : 'cho') as 'cho' | 'dat' | 'chua_dat' | 'bo',
  chamLuc: str(x.cham_luc) || null,
  daChuaLuc: str(x.da_chua_luc) || null,
})

/**
 * Câu em đã làm ĐÚNG (lần gần nhất có kết quả là đúng) — theo từng em, MỘT truy vấn gộp theo (sbd, qid) đi chỉ mục `idx_skh_em_qid`.
 * Lần đầu/lần cuối lấy bằng MIN/MAX của `luc || ket_qua` (ISO cùng độ dài ⇒ so chuỗi = so thời gian; ký tự cuối là kết quả).
 * Bỏ sự kiện CHE (ca chưa công bố) nếu sổ có cột `visibility`. `qidLoc` (tuỳ chọn) ⇒ chỉ các câu ấy.
 */
async function cauDaDung(env: Env, sbd: readonly string[], qidLoc?: readonly string[]): Promise<Map<string, UngVienCau[]>> {
  const ra = new Map<string, UngVienCau[]>()
  if (!sbd.length) return ra
  const locQ = qidLoc ? ' AND qid IN (SELECT value FROM json_each(?))' : ''
  const sql = (loc: string) =>
    `SELECT sbd, qid, COUNT(*) AS n, MIN(luc || ket_qua) AS dau, MAX(luc || ket_qua) AS cuoi FROM su_kien_hoc
      WHERE sbd IN (SELECT value FROM json_each(?))${locQ} AND ket_qua IS NOT NULL${loc} GROUP BY sbd, qid`
  const bind: unknown[] = [JSON.stringify(sbd), ...(qidLoc ? [JSON.stringify(qidLoc)] : [])]
  const r = (await hoi(env, sql(" AND COALESCE(visibility, '') <> 'embargoed'"), ...bind)) ?? (await hoi(env, sql(''), ...bind)) ?? []
  for (const x of r) {
    const cuoi = str(x.cuoi)
    if (!cuoi.endsWith('1')) continue // lần gần nhất sai ⇒ câu đang nợ, không phải câu "đã làm đúng"
    const dau = str(x.dau)
    const em = str(x.sbd)
    const ds = ra.get(em) ?? []
    ds.push({ qid: str(x.qid), soLan: num(x.n), dungLanDau: dau.endsWith('1'), lanCuoi: cuoi.slice(0, -1) })
    ra.set(em, ds)
  }
  return ra
}

async function daKetThuc(env: Env, buoiId: string): Promise<boolean> {
  return !!(await hoi(env, 'SELECT 1 AS x FROM dau_gio_buoi WHERE buoi_id = ?', buoiId))?.length
}

/** (sbd, qid) đã từng hỏi ở đầu giờ (mọi buổi). */
async function daHoiCua(env: Env, sbd: readonly string[]): Promise<Set<string>> {
  if (!sbd.length) return new Set()
  const r = (await hoi(env, 'SELECT sbd, qid FROM dau_gio_hoi WHERE sbd IN (SELECT value FROM json_each(?))', JSON.stringify(sbd))) ?? []
  return new Set(r.map((x) => `${str(x.sbd)}|${str(x.qid)}`))
}

/** Loại lượt game theo phiên: Đoàn (`$.doan`), Bi-a (`$.bia` = 1), còn lại Đảo. */
async function loaiGameCua(env: Env, phien: readonly string[]): Promise<Map<string, 'doan' | 'bia' | 'dao'>> {
  const ra = new Map<string, 'doan' | 'bia' | 'dao'>()
  if (!phien.length) return ra
  const r =
    (await hoi(
      env,
      "SELECT id, json_extract(json, '$.doan') IS NOT NULL AS doan, COALESCE(json_extract(json, '$.bia'), 0) AS bia FROM game_v2_session WHERE id IN (SELECT value FROM json_each(?))",
      JSON.stringify([...new Set(phien)]),
    )) ?? []
  for (const x of r) ra.set(str(x.id), num(x.doan) === 1 ? 'doan' : num(x.bia) === 1 ? 'bia' : 'dao')
  return ra
}

export async function gvDauGio(env: Env, b: Row, nowMs: number = Date.now()): Promise<Row> {
  const action = str(b.action)
  await taoBang(env)
  const nay = new Date(nowMs).toISOString()

  if (action === 'lich-su') {
    const cap = (Array.isArray(b.cap) ? (b.cap as unknown[]) : [])
      .map((x) => (x && typeof x === 'object' ? (x as Row) : {}))
      .map((x) => ({ sbd: str(x.sbd), qid: str(x.qid) }))
      .filter((x) => x.sbd && x.qid && x.sbd.length <= 40 && x.qid.length <= 120)
    if (!cap.length) return { ok: false, error: 'Thiếu danh sách (em, câu).' }
    if (cap.length > TOI_DA_CAP_LICH_SU_DAU_GIO) return { ok: false, error: `Tối đa ${TOI_DA_CAP_LICH_SU_DAU_GIO} cặp mỗi lần.` }
    const J = JSON.stringify(cap)
    const sql = (cot: string, loc: string) =>
      `SELECT s.sbd, s.qid, s.nguon, s.ma_nguon, s.ket_qua, s.luc${cot} FROM json_each(?) j JOIN su_kien_hoc s ON s.sbd = json_extract(j.value, '$.sbd') AND s.qid = json_extract(j.value, '$.qid') WHERE s.ket_qua IS NOT NULL${loc}`
    const r = (await hoi(env, sql('', " AND COALESCE(s.visibility, '') <> 'embargoed'"), J)) ?? (await hoi(env, sql('', ''), J)) ?? []
    const loai = await loaiGameCua(env, r.filter((x) => str(x.nguon) === 'game').map((x) => str(x.ma_nguon)))
    const chua = (await hoi(env, 'SELECT t.sbd, t.qid, t.luc FROM json_each(?) j JOIN thay_da_chua t ON t.sbd = json_extract(j.value, \'$.sbd\') AND t.qid = json_extract(j.value, \'$.qid\') ORDER BY t.luc', J)) ?? []
    const theo = new Map<string, LanLamNgan[]>()
    for (const x of r) {
      const k = `${str(x.sbd)}|${str(x.qid)}`
      const nguon = str(x.nguon)
      theo.set(k, [...(theo.get(k) ?? []), { luc: str(x.luc), dung: num(x.ket_qua) === 1, nguon: tenNguonNgan(nguon, nguon === 'game' ? (loai.get(str(x.ma_nguon)) ?? 'dao') : null) }])
    }
    return {
      ok: true,
      ketQua: cap.map((c) => {
        const k = `${c.sbd}|${c.qid}`
        const lan = [...(theo.get(k) ?? [])].sort((a, b2) => (a.luc < b2.luc ? -1 : 1))
        return {
          sbd: c.sbd,
          qid: c.qid,
          lan,
          chu: chuLichSuCau(lan),
          daChua: chua.filter((x) => `${str(x.sbd)}|${str(x.qid)}` === k).map((x) => str(x.luc)),
        }
      }),
    }
  }

  const buoiId = str(b.buoiId)
  if (!buoiId) return { ok: false, error: 'Thiếu mã buổi học.' }
  const buoi = await docBuoiCoMat(env, buoiId, nowMs)
  if (!buoi) return { ok: false, error: 'Không tìm thấy buổi học này.' }

  if (action === 'xem') {
    const luot = (await docLuotBuoi(env, buoiId)).map(luotRa)
    return { ok: true, dangMo: buoi.dangMo, daKetThuc: await daKetThuc(env, buoiId), luot }
  }

  if (action === 'ung-vien') {
    const luot = (await docLuotBuoi(env, buoiId)).map(luotRa)
    const daGoi = new Set(luot.map((x) => x.sbd))
    const em = [...buoi.coMat.keys()].filter((s) => !daGoi.has(s)).slice(0, TOI_DA_EM_UNG_VIEN)
    const [dung, daHoi] = await Promise.all([cauDaDung(env, em), daHoiCua(env, em)])
    const cauBuoi = new Set(luot.map((x) => x.qid))
    return {
      ok: true,
      daGoi: [...daGoi],
      cauDaDung: [...cauBuoi],
      em: em.map((s) => ({
        sbd: s,
        hoTen: buoi.coMat.get(s) ?? '',
        cau: xepUngVien((dung.get(s) ?? []).filter((c) => !daHoi.has(`${s}|${c.qid}`) && !cauBuoi.has(c.qid)), nowMs).slice(0, TOI_DA_UNG_VIEN_MOI_EM),
      })),
    }
  }

  if (action === 'chot') {
    if (!buoi.dangMo) return { ok: false, error: 'Buổi học đã kết thúc — mở buổi mới để kiểm tra đầu giờ.' }
    const luotCu = (await docLuotBuoi(env, buoiId)).map(luotRa)
    if (await daKetThuc(env, buoiId)) return { ok: false, error: 'Buổi này đã bấm Kết thúc kiểm tra đầu giờ.' }
    const cap = (Array.isArray(b.cap) ? (b.cap as unknown[]) : [])
      .map((x) => (x && typeof x === 'object' ? (x as Row) : {}))
      .map((x) => ({ sbd: str(x.sbd), qid: str(x.qid), chuyenDe: str(x.chuyenDe).slice(0, 120) }))
      .filter((x) => x.sbd && x.qid && x.sbd.length <= 40 && x.qid.length <= 120)
    if (!cap.length) return { ok: false, error: 'Chưa chọn em nào.' }
    if (cap.length > TOI_DA_EM_MOI_LUOT) return { ok: false, error: `Tối đa ${TOI_DA_EM_MOI_LUOT} em một lượt.` }
    const daGoi = new Set(luotCu.map((x) => x.sbd))
    const cauBuoi = new Set(luotCu.map((x) => x.qid))
    const dung = await cauDaDung(
      env,
      cap.map((x) => x.sbd),
      cap.map((x) => x.qid),
    )
    const daHoi = await daHoiCua(
      env,
      cap.map((x) => x.sbd),
    )
    const nhan: typeof cap = []
    const tuChoi: { sbd: string; qid: string; lyDo: string }[] = []
    const emLuot = new Set<string>()
    for (const c of cap) {
      const lyDo = !buoi.coMat.has(c.sbd)
        ? 'khong_co_mat'
        : daGoi.has(c.sbd) || emLuot.has(c.sbd)
          ? 'da_goi'
          : cauBuoi.has(c.qid)
            ? 'trung_cau'
            : daHoi.has(`${c.sbd}|${c.qid}`)
              ? 'da_hoi'
              : !(dung.get(c.sbd) ?? []).some((x) => x.qid === c.qid)
                ? 'chua_lam_dung'
                : ''
      if (lyDo) {
        tuChoi.push({ sbd: c.sbd, qid: c.qid, lyDo })
        continue
      }
      nhan.push(c)
      emLuot.add(c.sbd)
      cauBuoi.add(c.qid)
    }
    const luot = Math.max(0, ...luotCu.map((x) => x.luot)) + 1
    if (nhan.length)
      await env.DB.batch(
        nhan.map((c) =>
          env.DB.prepare("INSERT OR IGNORE INTO dau_gio_hoi (sbd, qid, buoi_id, luot, hoi_luc, chuyen_de, trang_thai) VALUES (?,?,?,?,?,?,'cho')").bind(c.sbd, c.qid, buoiId, luot, nay, c.chuyenDe),
        ),
      )
    return { ok: true, luot, nhan: nhan.map((c) => ({ sbd: c.sbd, qid: c.qid })), tuChoi, ds: (await docLuotBuoi(env, buoiId)).map(luotRa) }
  }

  const sbd = str(b.sbd)
  const qid = str(b.qid)

  if (action === 'cham') {
    if (!sbd || !qid) return { ok: false, error: 'Thiếu em hoặc câu.' }
    if (typeof b.dat !== 'boolean') return { ok: false, error: 'Thiếu kết quả Đạt / Chưa đạt.' }
    const row = (await hoi(env, 'SELECT trang_thai, chuyen_de, da_chua_luc FROM dau_gio_hoi WHERE sbd = ? AND qid = ? AND buoi_id = ?', sbd, qid, buoiId))?.[0]
    if (!row) return { ok: false, error: 'Câu này không có trong lượt kiểm tra đầu giờ của buổi.' }
    const tt = str(row.trang_thai)
    if (tt === 'dat' || tt === 'chua_dat') return { ok: true, daCoTruoc: true, ketQua: tt }
    if (tt === 'bo') return { ok: false, error: 'Buổi đã kết thúc kiểm tra đầu giờ — câu chưa chấm không ghi nữa.' }
    const moi = b.dat ? 'dat' : 'chua_dat'
    const r = await env.DB.prepare("UPDATE dau_gio_hoi SET trang_thai = ?, cham_luc = ? WHERE sbd = ? AND qid = ? AND buoi_id = ? AND trang_thai = 'cho'").bind(moi, nay, sbd, qid, buoiId).run()
    if (!Number(r.meta?.changes ?? 0)) {
      const lai = str((await hoi(env, 'SELECT trang_thai FROM dau_gio_hoi WHERE sbd = ? AND qid = ?', sbd, qid))?.[0]?.trang_thai)
      return lai === 'dat' || lai === 'chua_dat' ? { ok: true, daCoTruoc: true, ketQua: lai } : { ok: false, error: 'Không chấm được câu này.' }
    }
    // SỔ HỌC: đường ghi sẵn có (`ghiSuKien`, như lên bảng) — khoá `dau_gio|<buổi>|<em>|<câu>|1` ⇒ ghi lại không thêm dòng.
    const ghi = await ghiSuKien(env, [{ nguon: NGUON_DAU_GIO, maNguon: buoiId, sbd, qid, lan: 1, ketQua: b.dat ? 1 : 0, luc: nay, chuyenDe: str(row.chuyen_de), mucDo: '', assistance: 'none', purpose: 'dau_gio' }])
    // Hợp đồng A: mốc dạy lại phải SAU sự kiện. Thầy tích "Thầy đã chữa" TRƯỚC khi chấm ⇒ đặt lại mốc ngay sau lần chấm này.
    if (str(row.da_chua_luc)) await ghiMocDayLai(env, sbd, qid, nay).catch(() => undefined)
    return { ok: true, ketQua: moi, soGhi: ghi.soGui, ...(ghi.ok ? {} : { canhBao: 'Đã chấm nhưng chưa ghi được sổ học — máy chủ sẽ báo lỗi trong nhật ký.' }) }
  }

  if (action === 'da-chua') {
    if (!sbd || !qid) return { ok: false, error: 'Thiếu em hoặc câu.' }
    const row = (await hoi(env, 'SELECT da_chua_luc FROM dau_gio_hoi WHERE sbd = ? AND qid = ? AND buoi_id = ?', sbd, qid, buoiId))?.[0]
    if (!row) return { ok: false, error: 'Câu này không có trong lượt kiểm tra đầu giờ của buổi.' }
    if (str(row.da_chua_luc)) return { ok: true, daCoTruoc: true, luc: str(row.da_chua_luc) }
    const r = await env.DB.prepare('UPDATE dau_gio_hoi SET da_chua_luc = ? WHERE sbd = ? AND qid = ? AND buoi_id = ? AND da_chua_luc IS NULL').bind(nay, sbd, qid, buoiId).run()
    if (!Number(r.meta?.changes ?? 0)) return { ok: true, daCoTruoc: true }
    await env.DB.prepare('INSERT OR IGNORE INTO thay_da_chua (sbd, qid, nguon, ma_nguon, luc, ngay_vn) VALUES (?,?,?,?,?,?)').bind(sbd, qid, NGUON_DAU_GIO, buoiId, nay, ngayVn(nay)).run()
    let mocLoi = ''
    try {
      await ghiMocDayLai(env, sbd, qid, nay)
    } catch (e) {
      mocLoi = e instanceof Error ? e.message : String(e)
    }
    return { ok: true, luc: nay, ...(mocLoi ? { canhBao: 'Đã lưu nhãn "Thầy đã chữa" nhưng chưa ghi được mốc dạy lại.' } : {}) }
  }

  if (action === 'ket-thuc') {
    const [r] = await env.DB.batch([
      env.DB.prepare("UPDATE dau_gio_hoi SET trang_thai = 'bo' WHERE buoi_id = ? AND trang_thai = 'cho'").bind(buoiId),
      env.DB.prepare('INSERT OR IGNORE INTO dau_gio_buoi (buoi_id, ket_thuc_luc) VALUES (?,?)').bind(buoiId, nay),
    ])
    return { ok: true, soBo: Number(r.meta?.changes ?? 0), luot: (await docLuotBuoi(env, buoiId)).map(luotRa) }
  }

  return { ok: false, error: 'Lệnh kiểm tra đầu giờ không rõ.' }
}
