// THUẬT TOÁN 2.0 — LỚP D1 (đọc chiến dịch, sổ sự kiện; chốt kế hoạch ngày; số liệu Sảnh; Rương Bát Linh).
// Lõi thuần ở `srs2-loi.ts`. Công tắc `cau_hinh.game_hoa_2` (mặc định TẮT ⇒ mọi đường cũ giữ nguyên):
//   {"bat":true}                         ⇒ toàn trung tâm
//   {"bat":true,"lop":["12A1"]}          ⇒ chỉ các lớp này
//   {"bat":true,"sbd":["12001","12002"]} ⇒ chỉ các em này (chạy thử)
import type { Env } from './kieu'
import {
  lapKeHoachNgay, tranHuyetChienTheo, phatLaiCau, canGoiY, moDuocRuong, tiLeChienDich, ngayThanhThaoSomNhat, soNgayConLai,
  type CauSrs, type LanLam, type TrangThaiCau, type Phan,
} from './srs2-loi'

type Row = Record<string, unknown>
const str = (v: unknown): string => (v == null ? '' : String(v))
const GIO_VN_MS = 7 * 3_600_000
export const ngayVnCua = (ms: number): string => new Date(ms + GIO_VN_MS).toISOString().slice(0, 10)
const parseMang = (v: unknown): string[] => {
  try {
    const a = JSON.parse(str(v) || '[]') as unknown
    return Array.isArray(a) ? a.map(String).filter(Boolean) : []
  } catch {
    return []
  }
}

// ---------------------------------------------------------------- công tắc
export interface CoHoa2 { bat: boolean; lop: string[]; sbd: string[] }
export const KHOA_CO_HOA2 = 'game_hoa_2'
export function docCoHoa2Tu(giaTri: unknown): CoHoa2 {
  try {
    const o = typeof giaTri === 'string' ? (JSON.parse(giaTri) as Row) : ((giaTri ?? {}) as Row)
    return { bat: o.bat === true || o.bat === 1 || o.bat === '1', lop: parseMang(JSON.stringify(o.lop ?? [])), sbd: parseMang(JSON.stringify(o.sbd ?? [])) }
  } catch {
    return { bat: false, lop: [], sbd: [] }
  }
}
export async function docCoHoa2(env: Env): Promise<CoHoa2> {
  const r = await env.DB.prepare('SELECT gia_tri FROM cau_hinh WHERE khoa = ?').bind(KHOA_CO_HOA2).first<{ gia_tri: string }>().catch(() => null)
  return docCoHoa2Tu(r?.gia_tri)
}
/** Em này đang ở chế độ Game Hóa 2.0? Lỗi đọc ⇒ `false` (đường cũ). */
export async function cheDo2(env: Env, sbd: string): Promise<boolean> {
  const co = await docCoHoa2(env)
  if (!co.bat) return false
  if (co.sbd.includes(sbd)) return true
  if (!co.lop.length && !co.sbd.length) return true
  if (!co.lop.length) return false
  const r = await env.DB.prepare('SELECT lop FROM hoc_sinh WHERE sbd = ?').bind(sbd).first<{ lop: string }>().catch(() => null)
  return !!r && co.lop.includes(str(r.lop))
}

// ---------------------------------------------------------------- chiến dịch
export interface ChienDich {
  id: string
  ten: string
  lop: string | null
  sbd: string[]
  maDe: string[]
  qids: string[]
  hanNop: string
  theLucNgay: number
  huyetChien: boolean
  maCa: string | null
  taoLuc: string
  trangThai: 'dang_chay' | 'da_dong' | 'da_huy'
}
export const docChienDichTuDong = (r: Row): ChienDich => ({
  id: str(r.id), ten: str(r.ten), lop: r.lop == null ? null : str(r.lop), sbd: parseMang(r.sbd_json), maDe: parseMang(r.ma_de_json), qids: parseMang(r.qid_json),
  hanNop: str(r.han_nop), theLucNgay: Number(r.the_luc_ngay) || 40, huyetChien: Number(r.huyet_chien ?? 1) !== 0, maCa: r.ma_ca == null ? null : str(r.ma_ca),
  taoLuc: str(r.tao_luc), trangThai: (['dang_chay', 'da_dong', 'da_huy'].includes(str(r.trang_thai)) ? str(r.trang_thai) : 'dang_chay') as ChienDich['trangThai'],
})

/** Mọi chiến dịch (chưa huỷ) có em này, mới giao trước. */
export async function docChienDichCuaEm(env: Env, sbd: string): Promise<ChienDich[]> {
  const r = await env.DB.prepare("SELECT * FROM chien_dich WHERE trang_thai <> 'da_huy' AND EXISTS (SELECT 1 FROM json_each(chien_dich.sbd_json) WHERE value = ?) ORDER BY tao_luc DESC")
    .bind(sbd).all<Row>().catch(() => ({ results: [] as Row[] }))
  return (r.results ?? []).map(docChienDichTuDong)
}
/** Chiến dịch đang chạy của em (giao gần nhất, còn hạn). */
export const chienDichDangChay = (ds: readonly ChienDich[], homNay: string): ChienDich | null => ds.find((c) => c.trangThai === 'dang_chay' && c.hanNop >= homNay) ?? null

// ---------------------------------------------------------------- câu và sổ
export interface MetaCau { qid: string; maDe: string; version: string; group: string; phan: Phan; mucDo: string | null; dang: string | null; tenDang: string | null }
/** Siêu dữ liệu câu (không đáp án, không lời giải). Câu có ở nhiều tờ: ưu tiên tờ thuộc `uuTienMaDe`. */
export async function docMetaCau(env: Env, qids: readonly string[], uuTienMaDe: readonly string[] = []): Promise<Map<string, MetaCau>> {
  const ra = new Map<string, MetaCau>()
  if (!qids.length) return ra
  const r = await env.DB.prepare(`SELECT qid, ma_de, version, content_group, dang, json_extract(json,'$.phan') AS phan, json_extract(json,'$.mucDo') AS muc_do, json_extract(json,'$.tenDang') AS ten_dang
      FROM game_v2_question WHERE qid IN (SELECT value FROM json_each(?))`).bind(JSON.stringify([...new Set(qids)])).all<Row>()
  const uuTien = new Set(uuTienMaDe)
  for (const x of r.results ?? []) {
    const qid = str(x.qid)
    const cu = ra.get(qid)
    if (cu && (uuTien.has(cu.maDe) || !uuTien.has(str(x.ma_de)))) continue
    const phan = (['I', 'II', 'III'].includes(str(x.phan)) ? str(x.phan) : 'I') as Phan
    ra.set(qid, { qid, maDe: str(x.ma_de), version: str(x.version), group: str(x.content_group), phan, mucDo: x.muc_do == null ? null : str(x.muc_do), dang: x.dang == null ? null : str(x.dang), tenDang: x.ten_dang == null ? null : str(x.ten_dang) })
  }
  return ra
}

/** Lần làm của em với các câu (mọi nguồn). Bỏ sự kiện CHE (ca chưa công bố); bỏ trống tính là sai; `assistance='assisted'` ⇒ có gợi ý. */
export async function docLanLam(env: Env, sbd: string, qids: readonly string[]): Promise<LanLam[]> {
  if (!qids.length) return []
  const ds = JSON.stringify([...new Set(qids)])
  let rows: Row[]
  try {
    rows = (await env.DB.prepare(`SELECT qid, ngay_vn, luc, ket_qua, assistance, visibility FROM su_kien_hoc WHERE sbd = ? AND qid IN (SELECT value FROM json_each(?))`).bind(sbd, ds).all<Row>()).results ?? []
  } catch {
    rows = (await env.DB.prepare(`SELECT qid, ngay_vn, luc, ket_qua FROM su_kien_hoc WHERE sbd = ? AND qid IN (SELECT value FROM json_each(?))`).bind(sbd, ds).all<Row>()).results ?? []
  }
  return rows
    .filter((x) => str(x.visibility) !== 'embargoed')
    .map((x) => ({ qid: str(x.qid), ngay: str(x.ngay_vn), luc: str(x.luc), dung: Number(x.ket_qua) === 1, coGoiY: str(x.assistance) === 'assisted' }))
}

/** Thời điểm thầy bấm "Chữa xong" cho từng câu của em. */
export async function docMocDayLai(env: Env, sbd: string): Promise<Map<string, string[]>> {
  const ra = new Map<string, string[]>()
  const r = await env.DB.prepare('SELECT qid, luc FROM srs2_day_lai WHERE sbd = ?').bind(sbd).all<Row>().catch(() => ({ results: [] as Row[] }))
  for (const x of r.results ?? []) {
    const k = str(x.qid)
    ra.set(k, [...(ra.get(k) ?? []), str(x.luc)])
  }
  return ra
}

export interface HoSo2 {
  chienDich: ChienDich | null
  /** Mọi câu trong phạm vi luyện, kèm nguồn. */
  cau: CauSrs[]
  meta: Map<string, MetaCau>
  tt: Map<string, TrangThaiCau>
  /** Trạng thái câu của chiến dịch đang chạy. */
  ttChienDich: TrangThaiCau[]
}

/** Toàn bộ trạng thái luyện của em: chiến dịch đang chạy + nợ cũ + ôn duy trì của chiến dịch trước. */
export async function docHoSo2(env: Env, sbd: string, homNay: string): Promise<HoSo2> {
  const ds = await docChienDichCuaEm(env, sbd)
  const dangChay = chienDichDangChay(ds, homNay)
  const hanTheoQid = new Map<string, string>()
  const nguonTheoQid = new Map<string, 'chien_dich' | 'cu'>()
  if (dangChay) for (const q of dangChay.qids) { hanTheoQid.set(q, dangChay.hanNop); nguonTheoQid.set(q, 'chien_dich') }
  for (const c of ds) {
    if (c === dangChay) continue
    for (const q of c.qids) if (!nguonTheoQid.has(q)) { hanTheoQid.set(q, c.hanNop); nguonTheoQid.set(q, 'cu') }
  }
  const qids = [...nguonTheoQid.keys()]
  const [meta, lanLam, moc] = await Promise.all([docMetaCau(env, qids, dangChay?.maDe ?? []), docLanLam(env, sbd, qids), docMocDayLai(env, sbd)])
  const theoQid = new Map<string, LanLam[]>()
  for (const x of lanLam) theoQid.set(x.qid, [...(theoQid.get(x.qid) ?? []), x])
  const tt = new Map<string, TrangThaiCau>()
  const cau: CauSrs[] = []
  for (const qid of qids) {
    const m = meta.get(qid)
    if (!m) continue // câu đã rút khỏi kho
    const t = phatLaiCau(qid, theoQid.get(qid) ?? [], hanTheoQid.get(qid) ?? null, moc.get(qid) ?? [])
    tt.set(qid, t)
    const nguon = nguonTheoQid.get(qid) === 'chien_dich' ? 'chien_dich' : t.thanhThao ? 'duy_tri' : t.laMoi ? null : 'no_cu'
    if (!nguon) continue // câu chiến dịch cũ em chưa từng gặp: không kéo sang
    cau.push({ qid, phan: m.phan, mucDo: m.mucDo, dang: m.dang, nguon })
  }
  return { chienDich: dangChay, cau, meta, tt, ttChienDich: dangChay ? dangChay.qids.map((q) => tt.get(q)).filter((x): x is TrangThaiCau => !!x) : [] }
}

// ---------------------------------------------------------------- kế hoạch ngày (chốt một lần)
export interface KeHoachDaChot {
  ngay: string
  chienDichId: string | null
  /** Khoá câu theo thứ tự phục vụ; `qid#2` = lần làm thứ 2 trong ngày (ngày cuối trước hạn). */
  dao: string[]
  doan: string[]
  huyetChien: boolean
  tong: number
  conDao: string[]
  conDoan: string[]
}

/** Bỏ hậu tố lần-làm-trong-ngày (`qid#2`). */
export const qidGoc = (k: string): string => k.replace(/#\d+$/, '')
const lanThu = (k: string): number => Number(/#(\d+)$/.exec(k)?.[1] ?? 1)

/** Số lần em đã làm mỗi câu hôm nay trong game. */
async function docDemHomNay(env: Env, sbd: string, ngay: string): Promise<Map<string, number>> {
  const r = await env.DB.prepare("SELECT qid, COUNT(*) AS n FROM su_kien_hoc WHERE sbd = ? AND ngay_vn = ? AND nguon = 'game' GROUP BY qid").bind(sbd, ngay).all<Row>().catch(() => ({ results: [] as Row[] }))
  return new Map((r.results ?? []).map((x) => [str(x.qid), Number(x.n) || 0]))
}

const hoanThien = (ngay: string, id: string | null, dao: string[], doan: string[], huyetChien: boolean, dem: ReadonlyMap<string, number>): KeHoachDaChot => {
  const chua = (k: string) => (dem.get(qidGoc(k)) ?? 0) < lanThu(k)
  return { ngay, chienDichId: id, dao, doan, huyetChien, tong: dao.length + doan.length, conDao: dao.filter(chua), conDoan: doan.filter(chua) }
}
const tuDong = (r: Row, ngay: string, dem: ReadonlyMap<string, number>) =>
  hoanThien(ngay, r.chien_dich_id == null ? null : str(r.chien_dich_id), parseMang(r.dao_json), parseMang(r.doan_json), Number(r.huyet_chien) === 1, dem)

/** Gắn hậu tố cho câu đã có trong kế hoạch (lần làm thứ n trong ngày). */
function themLanLam(cu: readonly string[], moi: readonly string[]): string[] {
  const n = new Map<string, number>()
  for (const k of cu) n.set(qidGoc(k), Math.max(n.get(qidGoc(k)) ?? 0, lanThu(k)))
  return moi.map((q) => {
    const k = (n.get(q) ?? 0) + 1
    n.set(q, k)
    return k === 1 ? q : `${q}#${k}`
  })
}

/**
 * Kế hoạch HÔM NAY của em: lần mở đầu tiên trong ngày thì lập và CHỐT (bảng `srs2_ke_hoach`), các lần sau đọc lại —
 * Thể lực là con số thật, không nhảy. Ngoại lệ luật B.7: ngày cuối trước hạn, làm hết kế hoạch mà trần ngày còn chỗ và
 * có câu đến lịch lại trong ngày (câu vừa sai) thì BỔ SUNG, không vượt trần.
 */
export async function layKeHoachHomNay(env: Env, sbd: string, nowMs: number, hs?: HoSo2): Promise<{ kh: KeHoachDaChot; hs: HoSo2 }> {
  const ngay = ngayVnCua(nowMs)
  const hoSo = hs ?? (await docHoSo2(env, sbd, ngay))
  const dem = await docDemHomNay(env, sbd, ngay)
  const cd = hoSo.chienDich
  const tranNgay = cd?.theLucNgay
  const tuyChon = { homNay: ngay, hanNop: cd?.hanNop ?? null, ...(tranNgay ? { tranNgay } : {}), ...(cd ? { tranHuyetChien: cd.huyetChien ? tranHuyetChienTheo(cd.theLucNgay) : cd.theLucNgay } : {}) }
  const cu = await env.DB.prepare('SELECT * FROM srs2_ke_hoach WHERE sbd = ? AND ngay = ?').bind(sbd, ngay).first<Row>().catch(() => null)
  if (cu) {
    let kh = tuDong(cu, ngay, dem)
    // Thầy 28/09 ("đã giao chiến dịch test nhưng không bấm vào làm được"): kế hoạch chốt LÚC CHƯA CÓ chiến dịch (hoặc chiến dịch khác)
    // thì LẬP LẠI theo chiến dịch hiện tại — giữ các câu đã làm hôm nay (vẫn trừ vào thể lực), thêm câu mới của kế hoạch.
    if ((kh.chienDichId ?? null) !== (cd?.id ?? null)) {
      const xongDao = kh.dao.filter((k) => !kh.conDao.includes(k))
      const xongDoan = kh.doan.filter((k) => !kh.conDoan.includes(k))
      const lap = lapKeHoachNgay(hoSo.cau, hoSo.tt, tuyChon, xongDao.length + xongDoan.length)
      const dao = [...xongDao, ...themLanLam([...xongDao, ...xongDoan], lap.dao)]
      const doan = [...xongDoan, ...themLanLam([...dao, ...xongDoan], lap.doan)]
      await env.DB.prepare('UPDATE srs2_ke_hoach SET chien_dich_id = ?, dao_json = ?, doan_json = ?, huyet_chien = ?, tong = ? WHERE sbd = ? AND ngay = ?')
        .bind(cd?.id ?? null, JSON.stringify(dao), JSON.stringify(doan), lap.huyetChien ? 1 : 0, dao.length + doan.length, sbd, ngay).run()
      return { kh: hoanThien(ngay, cd?.id ?? null, dao, doan, lap.huyetChien, dem), hs: hoSo }
    }
    if (cd && cd.hanNop === ngay && kh.conDao.length + kh.conDoan.length === 0) {
      const them = lapKeHoachNgay(hoSo.cau, hoSo.tt, tuyChon, kh.tong)
      if (them.dao.length + them.doan.length) {
        const dao = [...kh.dao, ...themLanLam([...kh.dao, ...kh.doan], them.dao)]
        const doan = [...kh.doan, ...themLanLam([...dao, ...kh.doan], them.doan)]
        await env.DB.prepare('UPDATE srs2_ke_hoach SET dao_json = ?, doan_json = ?, tong = ? WHERE sbd = ? AND ngay = ?').bind(JSON.stringify(dao), JSON.stringify(doan), dao.length + doan.length, sbd, ngay).run()
        kh = hoanThien(ngay, kh.chienDichId, dao, doan, kh.huyetChien, dem)
      }
    }
    return { kh, hs: hoSo }
  }
  const lap = lapKeHoachNgay(hoSo.cau, hoSo.tt, tuyChon)
  await env.DB.prepare('INSERT OR IGNORE INTO srs2_ke_hoach (sbd, ngay, chien_dich_id, dao_json, doan_json, huyet_chien, tong, tao_luc) VALUES (?,?,?,?,?,?,?,?)')
    .bind(sbd, ngay, cd?.id ?? null, JSON.stringify(lap.dao), JSON.stringify(lap.doan), lap.huyetChien ? 1 : 0, lap.dao.length + lap.doan.length, new Date(nowMs).toISOString()).run()
  // Hai yêu cầu song song: bản ghi thắng là bản CHỐT, đọc lại để cả hai trả cùng một kế hoạch.
  const chot = await env.DB.prepare('SELECT * FROM srs2_ke_hoach WHERE sbd = ? AND ngay = ?').bind(sbd, ngay).first<Row>()
  return { kh: chot ? tuDong(chot, ngay, dem) : hoanThien(ngay, cd?.id ?? null, lap.dao, lap.doan, lap.huyetChien, dem), hs: hoSo }
}

// ---------------------------------------------------------------- màn Sảnh
export const LOI_KHOA_DAO = 'Có xe hàng đang bị phục kích, hãy hoàn thành Hộ Tống trước khi ra Đảo nhé!'

export async function sanh2(env: Env, sbd: string, nowMs: number): Promise<Record<string, unknown>> {
  const { kh, hs } = await layKeHoachHomNay(env, sbd, nowMs)
  const cd = hs.chienDich
  const tl = tiLeChienDich(hs.ttChienDich)
  const conLai = kh.conDao.length + kh.conDoan.length
  const ruong = await env.DB.prepare('SELECT mo_luc, qua_json FROM ruong_bat_linh WHERE sbd = ? AND ngay = ?').bind(sbd, kh.ngay).first<Row>().catch(() => null)
  return {
    ok: true,
    cheDo2: true,
    ngay: kh.ngay,
    chienDich: cd ? { id: cd.id, ten: cd.ten, hanNop: cd.hanNop, D: soNgayConLai(kh.ngay, cd.hanNop), tong: tl.tong, coXat: tl.coXat, thanhThao: tl.thanhThao, canDayLai: tl.canDayLai, thanhThaoTangTu: tl.thanhThao ? null : ngayThanhThaoSomNhat(hs.ttChienDich) } : null,
    theLuc: { con: conLai, tong: kh.tong },
    huyetChien: kh.huyetChien,
    doan: { con: kh.conDoan.length },
    dao: { con: kh.conDao.length },
    khoaDao: kh.conDoan.length > 0,
    ...(kh.conDoan.length > 0 ? { loiKhoaDao: LOI_KHOA_DAO } : {}),
    ruong: { daLam: kh.tong - conLai, tong: kh.tong, moDuoc: moDuocRuong(kh.tong, kh.tong - conLai), daMo: !!ruong, ...(ruong ? { qua: JSON.parse(str(ruong.qua_json) || '{}') } : {}) },
  }
}

/** Gợi ý M3 cho lần phục vụ tới của câu. */
export const coGoiY = (t: TrangThaiCau | undefined): boolean => !!t && canGoiY(t)

/** CHẨN ĐOÁN (thầy, CHỈ ĐỌC — không ghi kế hoạch): máy chủ thấy gì với một em hôm nay. Dùng khi Sảnh báo "chưa có câu nào". */
export async function chanDoanEm(env: Env, sbd: string, nowMs: number): Promise<Record<string, unknown>> {
  const ngay = ngayVnCua(nowMs)
  const hoSo = await docHoSo2(env, sbd, ngay)
  const cd = hoSo.chienDich
  const dsCd = await docChienDichCuaEm(env, sbd)
  const tuyChon = { homNay: ngay, hanNop: cd?.hanNop ?? null, ...(cd?.theLucNgay ? { tranNgay: cd.theLucNgay } : {}), ...(cd ? { tranHuyetChien: cd.huyetChien ? tranHuyetChienTheo(cd.theLucNgay) : cd.theLucNgay } : {}) }
  const lap = lapKeHoachNgay(hoSo.cau, hoSo.tt, tuyChon)
  const cu = await env.DB.prepare('SELECT chien_dich_id, tong, tao_luc, dao_json, doan_json FROM srs2_ke_hoach WHERE sbd = ? AND ngay = ?').bind(sbd, ngay).first<Row>().catch((e) => ({ loi: String(e) }) as Row)
  const cauCd = hoSo.cau.filter((c) => c.nguon === 'chien_dich')
  return {
    ok: true, ngay, sbd,
    coHoa2: await cheDo2(env, sbd),
    chienDichCuaEm: dsCd.map((c) => ({ id: c.id, ten: c.ten, trangThai: c.trangThai, hanNop: c.hanNop, soCau: c.qids.length })),
    chienDichDangChay: cd ? { id: cd.id, hanNop: cd.hanNop, theLucNgay: cd.theLucNgay, soQid: cd.qids.length } : null,
    soMetaTimThay: hoSo.meta.size,
    soCauTrongHoSo: hoSo.cau.length,
    soCauChienDich: cauCd.length,
    soCauMoi: cauCd.filter((c) => hoSo.tt.get(c.qid)?.laMoi).length,
    keHoachDaChot: cu ? { chienDichId: cu.chien_dich_id ?? null, tong: cu.tong ?? null, taoLuc: cu.tao_luc ?? null, loi: (cu as Row).loi ?? null } : null,
    lapLaiSeRa: { dao: lap.dao.length, doan: lap.doan.length, huyetChien: lap.huyetChien },
  }
}
