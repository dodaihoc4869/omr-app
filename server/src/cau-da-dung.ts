// CHẾ ĐỘ "KIỂM CHỨNG CÂU ĐÃ ĐÚNG" (02/10) — PHẦN MÁY CHỦ.
//   · `/ca/cau-da-dung` (thầy, mã bí mật) {sbd:[...]} ⇒ {em: {sbd: [{qid, phan, mucDo, dang, noi, ngayDung, nhan, lucDung, soLanDung, soLanSai}]}}:
//     câu thuộc BẤT KỲ chiến dịch nào em có mặt (chien_dich.sbd_json chứa em, trang_thai ≠ 'da_huy') mà em đã TỰ LÀM ĐÚNG ít nhất
//     một lần — ket_qua = 1, KHÔNG có hỗ trợ (assistance ≠ 'assisted'), KHÔNG phải chỉ đọc lời giải (purpose ≠ 'xem_loi_giai'), KHÔNG
//     thuộc ca chưa công bố (visibility ≠ 'embargoed'). Lần làm câu song sinh / lượt lặp game ("#n") quy về câu gốc. Câu phải còn
//     trong kho (game_v2_question) và KHÔNG tự luận.
//   · `lapBoDaDungChoEmVaoMuon`: `/vao-thi` của ca chế độ này mà bản đồ chưa có em ⇒ lấp riêng bằng đúng luật (src/lib/rut-de-da-dung.ts)
//     từ những câu em đã đúng CÓ TRONG kho đáp án của ca, gộp vào bản đồ bằng MỘT câu `json_patch`.
// GIẢ ĐỊNH ĐÃ CHỐT: nhãn = nơi của LẦN ĐÚNG GẦN NHẤT; câu đúng rồi sai lại vẫn vào nguồn (đếm số lần đúng/sai cho thầy); thiếu câu thì
// để trống ô và báo, không lấp câu chưa đúng.
import type { Env } from './kieu'
import { tachSongSinh } from './loi-hoc-luat'
import { SQL_DA_CONG_BO } from './cong-bo-diem'
import { SQL_LA_LAN_LAM } from './omni-kieu'
import { chuanMucDo } from './rut-de-v2'
import { xoaDemCaBaoVe } from './game-v2-bank'
import { docKeyBankDem } from './dem-ca-thi'
import { khoTuNguon, type NguonV2, type PhanV2 } from '../../src/lib/rut-de-v2'
import { banDoDaDung, khoBuTuKho, rutDeDaDung, taoNhanDaDung, type CauDaDung } from '../../src/lib/rut-de-da-dung'

type Obj = Record<string, unknown>
const chuoi = (v: unknown): string => (v === null || v === undefined ? '' : String(v).trim())
const SBD_DUONG_JSON = /^[A-Za-z0-9_-]{1,64}$/
/** Tối đa em mỗi lượt `/ca/cau-da-dung` (máy thầy chia lô — như `/ca/loi-den-han`). */
export const TOI_DA_EM_CAU_DA_DUNG = 20

/** Lần làm được tính là "tự làm": không hỗ trợ, không chỉ đọc lời giải, không phải lượt LƯỚT (OMNI 3, `SQL_LA_LAN_LAM`), không thuộc ca chưa công bố. */
const TU_LAM_MOI = `COALESCE(assistance,'') <> 'assisted' AND ${SQL_LA_LAN_LAM} AND COALESCE(visibility,'') <> 'embargoed' AND qid NOT LIKE 'nen:%'`
// Sổ CŨ chưa có cột assistance/purpose/visibility (migration-2309 chưa chạy trên bản thật — 05/10: lỗi "no such column: assistance") ⇒ lọc
// được gì lọc nấy: câu nền, và câu ca thi chỉ tính khi ca đã công bố (thay cho cờ che 'embargoed').
const TU_LAM_CU = `qid NOT LIKE 'nen:%' AND (nguon <> 'thi' OR EXISTS (SELECT 1 FROM ca c WHERE c.ma_ca = su_kien_hoc.ma_nguon AND c.trang_thai <> 'da_xoa' AND ${SQL_DA_CONG_BO('c')}))`

/** Tên kênh thân thiện (bảng từ chuẩn) cho nguồn không phải ca thi / game. */
const TEN_KENH: Record<string, string> = {
  on_lai: 'Ôn lại',
  len_bang: 'Lên bảng',
  dau_gio: 'Kiểm tra đầu giờ',
  luyen: 'Luyện đề',
  btvn: 'Bài tập về nhà',
  btvn_lo: 'Bài tập về nhà',
  khac_phuc: 'Khắc phục sau ca',
  mom: 'Bài gia đình giao',
  thu_thach_rieng: 'Thử thách riêng',
}
const TEN_KENH_GAME: Record<string, string> = { dao: 'Đảo thần thú', doan: 'Đoàn Hộ Tống', bia: 'Bi-a' }

export interface CauDaDungRa {
  qid: string
  phan: PhanV2
  mucDo: string
  dang: string
  /** Nơi của lần đúng gần nhất: "Ca Kiểm tra tuần 3" · "Chiến dịch Ôn chương 1 (Đảo thần thú)" · "Ôn lại". */
  noi: string
  /** Ngày VN của lần đúng gần nhất ('YYYY-MM-DD'). */
  ngayDung: string
  /** Nhãn hiện cho em: "<nơi> · dd/mm · <mức độ>". */
  nhan: string
  lucDung: string
  soLanDung: number
  soLanSai: number
}

interface ChienDichRa { id: string; ten: string; taoLuc: string; qids: Set<string> }

/** Đọc câu em đã tự làm đúng cho một lô em — 5 truy vấn cho CẢ lô (không theo từng em). */
export async function docCauDaDung(env: Env, dsSbd: readonly string[]): Promise<Record<string, CauDaDungRa[]>> {
  const ds = [...new Set(dsSbd.map(chuoi).filter(Boolean))]
  const ra: Record<string, CauDaDungRa[]> = Object.fromEntries(ds.map((s) => [s, [] as CauDaDungRa[]]))
  if (ds.length === 0) return ra
  const dsJson = JSON.stringify(ds)
  const lo = (TU_LAM: string) => env.DB.batch([
    // Chiến dịch còn hiệu lực mà ít nhất một em của lô có mặt.
    env.DB.prepare(
      `SELECT id, ten, sbd_json, qid_json, tao_luc FROM chien_dich
        WHERE trang_thai <> 'da_huy' AND json_valid(sbd_json) AND json_valid(qid_json)
          AND EXISTS (SELECT 1 FROM json_each(chien_dich.sbd_json) j WHERE CAST(j.value AS TEXT) IN (SELECT value FROM json_each(?)))`,
    ).bind(dsJson),
    // Số lần tự làm đúng / sai theo (em, qid thô).
    env.DB.prepare(
      `SELECT sbd, qid, SUM(CASE WHEN ket_qua = 1 THEN 1 ELSE 0 END) AS d, SUM(CASE WHEN ket_qua = 0 THEN 1 ELSE 0 END) AS s
         FROM su_kien_hoc WHERE sbd IN (SELECT value FROM json_each(?)) AND ket_qua IS NOT NULL AND ${TU_LAM} GROUP BY sbd, qid`,
    ).bind(dsJson),
    // Lần tự làm ĐÚNG gần nhất theo (em, qid thô) — cột trần lấy từ đúng dòng MAX(luc) (luật SQLite).
    env.DB.prepare(
      `SELECT sbd, qid, nguon, ma_nguon, ngay_vn, MAX(luc) AS luc
         FROM su_kien_hoc WHERE sbd IN (SELECT value FROM json_each(?)) AND ket_qua = 1 AND ${TU_LAM} GROUP BY sbd, qid`,
    ).bind(dsJson),
  ])
  const [rCd, rDem, rMoi] = await lo(TU_LAM_MOI).catch(() => lo(TU_LAM_CU))
  // Em → câu gốc → các chiến dịch chứa câu (em có mặt).
  const cdCuaEm = new Map<string, Map<string, ChienDichRa[]>>()
  for (const x of (rCd?.results ?? []) as Obj[]) {
    let sbds: unknown, qids: unknown
    try { sbds = JSON.parse(chuoi(x.sbd_json)); qids = JSON.parse(chuoi(x.qid_json)) } catch { continue }
    if (!Array.isArray(sbds) || !Array.isArray(qids)) continue
    const cd: ChienDichRa = { id: chuoi(x.id), ten: chuoi(x.ten), taoLuc: chuoi(x.tao_luc), qids: new Set(qids.map((q) => tachSongSinh(chuoi(q)).goc).filter(Boolean)) }
    for (const s of sbds.map(chuoi)) {
      if (!(s in ra)) continue
      const m = cdCuaEm.get(s) ?? new Map<string, ChienDichRa[]>()
      for (const q of cd.qids) m.set(q, [...(m.get(q) ?? []), cd])
      cdCuaEm.set(s, m)
    }
  }
  // Gộp theo câu GỐC (song sinh, lượt lặp game "#n").
  type Gom = { d: number; s: number; luc: string; nguon: string; maNguon: string; ngay: string }
  const gom = new Map<string, Map<string, Gom>>()
  const lay = (sbd: string, qidTho: string): Gom | null => {
    const goc = tachSongSinh(qidTho).goc
    if (!cdCuaEm.get(sbd)?.has(goc)) return null // ngoài mọi chiến dịch của em
    const m = gom.get(sbd) ?? new Map<string, Gom>()
    gom.set(sbd, m)
    let g = m.get(goc)
    if (!g) { g = { d: 0, s: 0, luc: '', nguon: '', maNguon: '', ngay: '' }; m.set(goc, g) }
    return g
  }
  for (const x of (rDem?.results ?? []) as Obj[]) {
    const g = lay(chuoi(x.sbd), chuoi(x.qid))
    if (g) { g.d += Number(x.d) || 0; g.s += Number(x.s) || 0 }
  }
  for (const x of (rMoi?.results ?? []) as Obj[]) {
    const g = lay(chuoi(x.sbd), chuoi(x.qid))
    const luc = chuoi(x.luc)
    if (g && luc > g.luc) { g.luc = luc; g.nguon = chuoi(x.nguon); g.maNguon = chuoi(x.ma_nguon); g.ngay = chuoi(x.ngay_vn) }
  }
  const qidCan = new Set<string>()
  const caCan = new Set<string>()
  const phienCan = new Set<string>()
  for (const m of gom.values()) for (const [q, g] of m) {
    if (g.d <= 0 || !g.luc) continue
    qidCan.add(q)
    if (g.nguon === 'thi') caCan.add(g.maNguon)
    if (g.nguon === 'game') phienCan.add(g.maNguon)
  }
  if (qidCan.size === 0) return ra
  const [rQ, rCa, rPhien] = await env.DB.batch([
    env.DB.prepare(
      `SELECT qid, json_extract(json,'$.phan') AS phan, json_extract(json,'$.mucDo') AS muc, dang, json_extract(json,'$.tuLuan') AS tl
         FROM game_v2_question WHERE qid IN (SELECT value FROM json_each(?))`,
    ).bind(JSON.stringify([...qidCan])),
    env.DB.prepare('SELECT ma_ca, ten_ca FROM ca WHERE ma_ca IN (SELECT value FROM json_each(?))').bind(JSON.stringify([...caCan])),
    env.DB.prepare(
      `SELECT id, CASE WHEN json_extract(json,'$.doan') IS NOT NULL THEN 'doan' WHEN json_extract(json,'$.bia') IS NOT NULL THEN 'bia' ELSE 'dao' END AS kenh
         FROM game_v2_session WHERE id IN (SELECT value FROM json_each(?)) AND json_valid(json)`,
    ).bind(JSON.stringify([...phienCan])),
  ])
  const meta = new Map<string, { phan: PhanV2; mucDo: string; dang: string; tuLuan: boolean }>()
  for (const x of (rQ?.results ?? []) as Obj[]) {
    const q = chuoi(x.qid)
    const phan = chuoi(x.phan)
    if (meta.has(q) || (phan !== 'I' && phan !== 'II' && phan !== 'III')) continue
    meta.set(q, { phan, mucDo: chuanMucDo(x.muc), dang: chuoi(x.dang), tuLuan: x.tl === 1 || x.tl === true || x.tl === 'true' })
  }
  const tenCa = new Map(((rCa?.results ?? []) as Obj[]).map((x) => [chuoi(x.ma_ca), chuoi(x.ten_ca)]))
  const kenhPhien = new Map(((rPhien?.results ?? []) as Obj[]).map((x) => [chuoi(x.id), chuoi(x.kenh)]))
  for (const [sbd, m] of gom) {
    const cds = cdCuaEm.get(sbd)
    const list: CauDaDungRa[] = []
    for (const [qid, g] of m) {
      if (g.d <= 0 || !g.luc) continue
      const mt = meta.get(qid)
      if (!mt || mt.tuLuan) continue // không còn trong kho / câu tự luận
      let noi: string
      if (g.nguon === 'thi') {
        const ten = tenCa.get(g.maNguon)
        noi = ten ? (/^ca\s/i.test(ten) ? ten : `Ca ${ten}`) : 'Ca kiểm tra'
      } else if (g.nguon === 'game') {
        // Chiến dịch chứa câu: chiến dịch mở gần nhất TRƯỚC lần đúng; không có thì chiến dịch mới nhất chứa câu.
        const ung = [...(cds?.get(qid) ?? [])].sort((a, b) => b.taoLuc.localeCompare(a.taoLuc))
        const cd = ung.find((c) => c.taoLuc && c.taoLuc <= g.luc) ?? ung[0]
        const kenh = TEN_KENH_GAME[kenhPhien.get(g.maNguon) ?? 'dao'] ?? 'Đảo thần thú'
        noi = cd?.ten ? `Chiến dịch ${cd.ten} (${kenh})` : kenh
      } else {
        noi = TEN_KENH[g.nguon] ?? 'Luyện tập'
      }
      list.push({ qid, phan: mt.phan, mucDo: mt.mucDo, dang: mt.dang, noi, ngayDung: g.ngay, nhan: taoNhanDaDung(noi, g.ngay, mt.mucDo), lucDung: g.luc, soLanDung: g.d, soLanSai: g.s })
    }
    ra[sbd] = list.sort((a, b) => a.qid.localeCompare(b.qid))
  }
  return ra
}

/** `/ca/cau-da-dung` {sbd:[...]} → {ok, em: {sbd: [...]}}. */
export async function cauDaDung(env: Env, b: Obj): Promise<Obj> {
  const ds = [...new Set((Array.isArray(b.sbd) ? b.sbd : []).map(chuoi).filter(Boolean))]
  if (ds.length === 0) return { ok: true, em: {} }
  if (ds.length > TOI_DA_EM_CAU_DA_DUNG) return { ok: false, error: `Tối đa ${TOI_DA_EM_CAU_DA_DUNG} em mỗi lượt` }
  return { ok: true, em: await docCauDaDung(env, ds) }
}

/** Câu em đã đúng dựng thành ứng viên rút, chỉ giữ câu CÓ TRONG kho `theoId` (phần/mức theo kho đề của ca). */
export function nguonDaDungTrongKho(ds: readonly CauDaDungRa[], theoId: ReadonlyMap<string, { phan: PhanV2; mucDo: string }>): CauDaDung[] {
  const ra: CauDaDung[] = []
  for (const c of ds) {
    const k = theoId.get(c.qid)
    if (!k) continue
    const mucDo = k.mucDo || c.mucDo
    ra.push({ qid: c.qid, phan: k.phan, mucDo, dang: c.dang, nhan: taoNhanDaDung(c.noi, c.ngayDung, mucDo), lucDung: c.lucDung, soLanDung: c.soLanDung, soLanSai: c.soLanSai })
  }
  return ra
}

/** Em vào phòng sau khi chốt ở ca "Kiểm chứng câu đã đúng" ⇒ lấp riêng từ câu em đã đúng CÓ TRONG kho đáp án của ca; thiếu (kể cả em
 * chưa đúng câu nào) ⇒ BÙ câu khác trong kho ca cùng mức độ (thầy 05/10 — em không bị chặn). Kho ca trống ⇒ `null`. */
export async function lapBoDaDungChoEmVaoMuon(env: Env, maCa: string, sbd: string, soCauJson: unknown, nowMs: number): Promise<Obj | null> {
  if (!SBD_DUONG_JSON.test(sbd) || !env.DE) return null
  let tong = 0
  try {
    const x = JSON.parse(chuoi(soCauJson) || 'null') as Obj | null
    tong = Math.max(0, Number(x?.I) || 0) + Math.max(0, Number(x?.II) || 0) + Math.max(0, Number(x?.III) || 0)
  } catch {
    return null
  }
  if (tong === 0) return null
  const key = (await docKeyBankDem(env, maCa).catch(() => ({ giaTri: null }))).giaTri as NguonV2 | null
  if (!key || typeof key !== 'object') return null
  const theoId = new Map(khoTuNguon([key]).filter((c) => !c.songSinhCua).map((c) => [c.id, c]))
  if (theoId.size === 0) return null
  const em = (await docCauDaDung(env, [sbd]))[sbd] ?? []
  const nguon = nguonDaDungTrongKho(em, theoId)
  const kq = rutDeDaDung({ nguon: { [sbd]: nguon }, dsSbd: [sbd], tongCau: tong, seed: maCa, khoBu: khoBuTuKho([...theoId.values()]) })
  const bd = banDoDaDung(kq)
  const bo = bd.bo[sbd]
  if (!bo || bo.length === 0) return null
  const patch = { bo: { [sbd]: bo }, daDung: { [sbd]: bd.daDung[sbd] ?? {} }, demDaDung: { [sbd]: bd.demDaDung[sbd] ?? {} }, cheDo: 'da_dung' }
  const duong = `$.bo."${sbd}"`
  const r = await env.DB.prepare(
    `UPDATE ca SET bo_theo_em_json = json_patch(CASE WHEN bo_theo_em_json IS NULL OR bo_theo_em_json = '' THEN '{}' ELSE bo_theo_em_json END, ?), cap_nhat_luc = ?
      WHERE ma_ca = ? AND (bo_theo_em_json IS NULL OR bo_theo_em_json = ''
        OR (json_valid(bo_theo_em_json) AND json_type(bo_theo_em_json, '$.bo') = 'object' AND json_type(bo_theo_em_json, ?) IS NULL))`,
  ).bind(JSON.stringify(patch), new Date(nowMs).toISOString(), maCa, duong).run()
  if (Number(r.meta?.changes ?? 0) === 0) {
    // Lượt khác của CHÍNH em vừa ghi trước ⇒ dùng đúng bộ đã ghi (máy thầy chấm theo nó).
    const co = await env.DB.prepare(`SELECT json_extract(bo_theo_em_json, ?) AS bo, json_extract(bo_theo_em_json, ?) AS nhan FROM ca WHERE ma_ca = ? AND json_valid(bo_theo_em_json)`)
      .bind(duong, `$.daDung."${sbd}"`, maCa).first<Obj>().catch(() => null)
    const daCo = co?.bo ? (JSON.parse(String(co.bo)) as unknown) : null
    if (!Array.isArray(daCo) || daCo.length === 0) return null
    return { bo: { [sbd]: daCo }, lap: {}, dem: {}, ...(co?.nhan ? { daDung: { [sbd]: JSON.parse(String(co.nhan)) as unknown } } : {}), bb: null }
  }
  xoaDemCaBaoVe()
  return { bo: { [sbd]: bo }, lap: {}, dem: {}, daDung: { [sbd]: bd.daDung[sbd] ?? {} }, bb: null }
}
