// NHẬT KÝ BÀI DẠY — ĐƯỜNG CHO VĂN PHÒNG SOẠN (thầy 13/11: «nhật kí sau khi live xong gửi cho văn phòng soạn» · «Làm luôn đường nhật ký cho văn phòng nhé»).
// Hợp đồng: docs/hop-dong-nhat-ky-bai-day-van-phong-1311.md. Ba lệnh (mã GV như các lệnh văn phòng khác, qua cửa xem lại `cuaXemLai`):
//   POST /gv/live-nhat-ky-ds       { sau? }                       buổi live đã chốt xong ≥ 3 phút (30 ngày gần nhất) + tình trạng nhật ký · MỘT lệnh D1
//   POST /gv/live-nhat-ky-tu-lieu  { buoiId }                     tư liệu để soạn: câu ĐÃ CHỮA (từ buoi.json — câu chưa mở đáp án đã bị cắt sẵn), trang bảng
//                                                                (tách từ net.bin, mỗi trang một ảnh SVG + khoảng giờ), đường tải tiếng, lược đồ kịch bản
//   POST /gv/live-nhat-ky-ghi      { buoiId, ban, kichBan }       nhận kịch bản ⇒ kiểm lược đồ ⇒ CỔNG TỰ KIỂM (src/lib/nhat-ky/cong.ts, cùng cổng máy em
//                                                                chạy) ⇒ máy điền phần của máy ⇒ cất R2 `live/<id>/nhat-ky.json` (chỉ khi đủ cảnh đạt)
// Ảnh trang: GET /live-tep/<id>/trang-<n>.svg?ve= (vé tệp của buổi, như tieng.mp3).
// AN TOÀN: không người duyệt ⇒ cổng là chốt duy nhất; kịch bản gắn với BẢN DỰNG của buổi (`ban`: giờ tu / den chỉ đúng trên trục tiếng của bản ấy — buổi
// dựng lại ⇒ đòi soạn lại); không đọc lại nội dung câu từ D1 (chỉ buoi.json đã lọc câu chưa mở đáp án); tên học sinh trong chữ bị che; không lộ mã câu.
import type { Env } from './kieu'
import { chayDdlMotLan } from './ddl-mot-lan'
import { khoaTep } from './live-xem-lai'
import { TEP_LIVE, type BuoiLiveJson, type CauBuoiLive } from '../../src/lib/live/xem-lai-kieu'
import { netKhuon, svgTrang, tachTrang, vungTrong, type MauAnhTrang, type TrangBang } from '../../src/lib/nhat-ky/trang-bang'
/** Màu ảnh trang bảng gửi văn phòng: nền xanh than Duolingo (như bảng thật) · mực xanh sáng lên · phấn trắng. */
const MAU_ANH: MauAnhTrang = { nen: 'rgb(19,31,36)', mucXanh: 'rgb(125,170,255)', macDinh: 'rgb(244,239,228)' }
import { LUOC_DO, boPhanMay, kiemKichBan } from '../../src/lib/nhat-ky/luoc-do'
import { kiemChu, quaCong } from '../../src/lib/nhat-ky/cong'

type Row = Record<string, unknown>
const str = (v: unknown): string => (v == null ? '' : String(v))
const so = (v: unknown): number => Number(v) || 0
const laObj = (v: unknown): v is Row => !!v && typeof v === 'object' && !Array.isArray(v)

export const TEP_NHAT_KY = 'nhat-ky.json'
const TEP_NHAT_KY_GOC = 'nhat-ky-goc.json'
/** Kịch bản dài tối đa (byte JSON). Mẫu thật của bản vẽ ~14 KB. */
export const NHAT_KY_TOI_DA = 300_000
/** Buổi tắt live chưa đủ ngần này thì chưa đưa ra (thầy có thể bật lại ⇒ dựng lại). */
const CHO_SAU_TAT_MS = 3 * 60_000

const SQL_NHAT_KY = [
  `CREATE TABLE IF NOT EXISTS live_nhat_ky (buoi_id TEXT PRIMARY KEY, ban_buoi INTEGER NOT NULL, luc TEXT NOT NULL, so_canh INTEGER NOT NULL DEFAULT 0,
     so_dat INTEGER NOT NULL DEFAULT 0, phat_hanh INTEGER NOT NULL DEFAULT 0)`,
] as const
export const damBaoNhatKy = (env: Env): Promise<void> => chayDdlMotLan(env, 'live_nhat_ky_v1', SQL_NHAT_KY)

export interface CongCuNhatKy {
  /** Gốc địa chỉ máy chủ (https://…) để ghép đường tải tệp. */
  goc: string
  /** Vé tệp của buổi (vai thầy) — `kyVeLive` của live-xem-lai-lenh.ts. */
  kyVe: (id: string, ban: number) => Promise<string>
}

const gioVn = (iso: string): string => { const t = Date.parse(iso); return Number.isFinite(t) ? new Date(t + 7 * 3_600_000).toISOString().slice(11, 16) : '' }
const THU = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy']
const thuVn = (ngay: string): string => { const t = Date.parse(`${ngay}T00:00:00Z`); return Number.isFinite(t) ? THU[new Date(t).getUTCDay()]! : '' }

async function docR2(env: Env, id: string, tep: string): Promise<Uint8Array | null> {
  if (!env.DE) return null
  const o = await env.DE.get(khoaTep(id, tep))
  if (!o) return null
  return o.arrayBuffer ? new Uint8Array(await o.arrayBuffer()) : null
}
async function docBuoiJson(env: Env, id: string): Promise<BuoiLiveJson | null> {
  const b = await docR2(env, id, TEP_LIVE.buoi)
  if (!b) return null
  try { return JSON.parse(new TextDecoder().decode(b)) as BuoiLiveJson } catch { return null }
}
/** Các trang bảng của buổi (tách từ net.bin). Thiếu tệp ⇒ []. */
export async function trangCuaBuoi(env: Env, id: string, msLive: number): Promise<TrangBang[]> {
  const net = await docR2(env, id, TEP_LIVE.net)
  return net ? tachTrang(net, msLive) : []
}
/** Câu đang dạy lúc trang hiện (khoảng giao dài nhất với chương của câu). */
function cauCuaTrang(tr: TrangBang, cau: readonly CauBuoiLive[]): number | null {
  let tot = 0, ra: number | null = null
  for (const c of cau) {
    let giao = 0
    for (const [a, b] of tr.doan) giao += Math.max(0, Math.min(b, c.t1) - Math.max(a, c.t0))
    if (giao > tot) { tot = giao; ra = c.so }
  }
  return ra
}
const BO_KHOA_CAU = new Set(['qid', 'maDe', 'version', 'group', 'contentGroup', 'content_group', 'dang', 'mucDo', 'sao', 'kienThuc', 'ideas'])
/** Câu công khai bỏ các trường nội bộ (mã câu, mã đề, phiên bản…). */
const deSach = (c: unknown): Row => (laObj(c) ? Object.fromEntries(Object.entries(c).filter(([k]) => !BO_KHOA_CAU.has(k))) : {})

// ── POST /gv/live-nhat-ky-ds ──
export async function nhatKyDs(env: Env, b: Row, nay = Date.now()): Promise<Row> {
  await damBaoNhatKy(env)
  const sau = str(b.sau).trim().slice(0, 40)
  const r = await env.DB.prepare(`SELECT b.id, b.lop, b.ngay, b.bat_luc, b.tat_luc, b.ten_tu_dong, b.ten_thay, b.so_cau, b.giay_live, b.ban, b.cap_nhat,
      n.ban_buoi AS nk_ban, n.luc AS nk_luc, n.phat_hanh AS nk_ph, n.so_dat AS nk_dat, n.so_canh AS nk_canh
      FROM live_buoi b LEFT JOIN live_nhat_ky n ON n.buoi_id = b.id
      WHERE b.trang_thai = 'xong' AND b.so_doan > 0 AND b.tat_luc IS NOT NULL AND b.tat_luc <= ?1 AND b.bat_luc >= ?2 AND (?3 = '' OR b.cap_nhat > ?3)
      ORDER BY b.tat_luc DESC LIMIT 30`).bind(new Date(nay - CHO_SAU_TAT_MS).toISOString(), new Date(nay - 30 * 86_400_000).toISOString(), sau).all<Row>()
  const dong = r.results ?? []
  let moc = sau
  const ds = dong.map((x) => {
    if (str(x.cap_nhat) > moc) moc = str(x.cap_nhat)
    const ban = so(x.ban), nk = x.nk_luc == null ? null : { ban: so(x.nk_ban), luc: str(x.nk_luc), phatHanh: so(x.nk_ph) === 1, soDat: so(x.nk_dat), soCanh: so(x.nk_canh) }
    return {
      buoiId: str(x.id), ten: str(x.ten_thay).trim() || str(x.ten_tu_dong), lop: str(x.lop), ngay: str(x.ngay), batLuc: str(x.bat_luc), tatLuc: str(x.tat_luc),
      soCau: so(x.so_cau), phutLive: Math.round(so(x.giay_live) / 60), ban, nhatKy: nk, canSoan: !nk || nk.ban !== ban || !nk.phatHanh,
    }
  })
  return { ok: true, ds, moc }
}

async function dongBuoi(env: Env, id: string): Promise<Row | null> {
  return env.DB.prepare("SELECT id, lop, ngay, bat_luc, tat_luc, ten_tu_dong, ten_thay, ban, giay_live FROM live_buoi WHERE id = ? AND trang_thai = 'xong' AND so_doan > 0").bind(id).first<Row>()
}

// ── POST /gv/live-nhat-ky-tu-lieu ──
export async function nhatKyTuLieu(env: Env, id: string, cc: CongCuNhatKy): Promise<Row> {
  const [dong, buoi] = await Promise.all([dongBuoi(env, id), docBuoiJson(env, id)])
  if (!dong || !buoi) return { ok: false, lyDo: 'khong-co', error: 'Buổi chưa chốt xong hoặc không có bản ghi.' }
  const ban = so(dong.ban)
  if (buoi.ban !== ban) return { ok: false, lyDo: 'dang-dung', error: 'Buổi đang được dựng lại, đọc lại sau ít phút.' }
  const [trang, ve] = await Promise.all([trangCuaBuoi(env, id, buoi.msLive), cc.kyVe(id, ban)])
  const tep = (t: string): string => `${cc.goc}/live-tep/${encodeURIComponent(id)}/${t}?ve=${encodeURIComponent(ve)}`
  return {
    ok: true, buoiId: id, ban,
    buoi: { ten: str(dong.ten_thay).trim() || str(dong.ten_tu_dong), lop: str(dong.lop), ngay: str(dong.ngay), thu: thuVn(str(dong.ngay)), gioBatDau: gioVn(str(dong.bat_luc)), phutLive: Math.round(buoi.msLive / 60_000), giayTieng: Math.round(buoi.msLive / 1000), coTieng: buoi.coTieng },
    tieng: buoi.coTieng ? tep(TEP_LIVE.tieng) : null,
    cau: buoi.cau.map((c) => ({
      so: c.so, phan: c.phan, tuLuan: c.tuLuan, bai: c.bai, de: deSach(c.cau), moDapAn: c.moDapAn !== false, dapAn: c.dung, loiGiai: c.giai?.solution ?? null,
      tu: Math.round(c.t0 / 100) / 10, den: Math.round(c.t1 / 100) / 10, soDung: c.soDung, soGui: c.soGui,
    })),
    trang: trang.map((t) => ({ trang: t.stt, loai: t.loai, cau: cauCuaTrang(t, buoi.cau), doan: t.doan.map(([a, z]) => [Math.round(a / 100) / 10, Math.round(z / 100) / 10]), soNet: t.net.length, anh: tep(`trang-${t.stt}.svg`) })),
    hanVe: 'Đường tải tệp dùng được 6 giờ; quá hạn thì gọi lại lệnh này.',
    luocDo: LUOC_DO,
  }
}

/** Ảnh SVG của một trang bảng (đã kiểm vé ở cửa tệp). null = không có trang ấy. */
export async function svgTrangCuaBuoi(env: Env, id: string, stt: number): Promise<string | null> {
  const buoi = await docBuoiJson(env, id)
  if (!buoi) return null
  const tr = (await trangCuaBuoi(env, id, buoi.msLive)).find((t) => t.stt === stt)
  return tr ? svgTrang(tr, MAU_ANH) : null
}

/** Nét phấn mọi trang bảng của buổi theo dạng khuôn hoạt hoạ đọc (màn học sinh xem nhật ký — public/nhat-ky/). Thiếu tệp ⇒ null. */
export async function netTrangCuaBuoi(env: Env, id: string): Promise<{ trang: Record<string, unknown>[] } | null> {
  const buoi = await docBuoiJson(env, id)
  if (!buoi) return null
  return { trang: (await trangCuaBuoi(env, id, buoi.msLive)).map((t) => ({ stt: t.stt, loai: t.loai, ...netKhuon(t, MAU_ANH) })) }
}

/** Tên người có thể xuất hiện trong lời Thầy: học sinh đã điểm danh buổi + học sinh cùng lớp buổi (họ tên, tên gọi, hai chữ cuối). */
async function tenTrongBuoi(env: Env, id: string, lop: string): Promise<string[]> {
  const r = await env.DB.prepare(`SELECT DISTINCT h.ho_ten FROM hoc_sinh h WHERE h.sbd IN (SELECT d.sbd FROM buoi_hoc_diem_danh d WHERE d.buoi_id = ?1)
      OR (?2 <> '' AND (TRIM(COALESCE(h.ten_lop, '')) = ?2 OR TRIM(COALESCE(h.lop, '')) = ?2)) LIMIT 600`).bind(id, lop).all<Row>().catch(() => ({ results: [] as Row[] }))
  const ten = new Set<string>()
  for (const x of r.results ?? []) {
    const ho = str(x.ho_ten).trim().replace(/\s+/g, ' ')
    if (!ho) continue
    const c = ho.split(' ')
    ten.add(ho); if (c.length >= 3) ten.add(c.slice(-2).join(' '))
    // tên gọi MỘT chữ chỉ che khi đi sau «bạn» / «em» (không che nhầm chữ thường như «Hà Nội», «miền Nam»)
    const goi = c[c.length - 1]!
    for (const t of ['bạn', 'Bạn', 'em', 'Em']) ten.add(`${t} ${goi}`)
  }
  // dài trước (che «Minh Anh» trước «Anh»); tên dưới 2 ký tự bỏ
  return [...ten].filter((t) => t.length >= 2).sort((a, z) => z.length - a.length)
}

// ── POST /gv/live-nhat-ky-ghi ──
export async function nhatKyGhi(env: Env, b: Row, nay = Date.now()): Promise<Row> {
  const id = str(b.buoiId).trim()
  const kb0 = typeof b.kichBan === 'string' ? (() => { try { return JSON.parse(b.kichBan as string) as unknown } catch { return null } })() : b.kichBan
  if (!laObj(kb0)) return { ok: false, lyDo: 'thieu', error: 'Thiếu kịch bản (kichBan là một đối tượng JSON).' }
  if (JSON.stringify(kb0).length > NHAT_KY_TOI_DA) return { ok: false, lyDo: 'qua-dai', error: `Kịch bản quá ${NHAT_KY_TOI_DA} byte.` }
  await damBaoNhatKy(env)
  const [dong, buoi] = await Promise.all([dongBuoi(env, id), docBuoiJson(env, id)])
  if (!dong || !buoi) return { ok: false, lyDo: 'khong-co', error: 'Buổi chưa chốt xong hoặc không có bản ghi.' }
  const ban = so(dong.ban)
  if (so(b.ban) !== ban || buoi.ban !== ban) return { ok: false, lyDo: 'ban-doi', ban, error: `Buổi đã dựng lại (bản ${ban}): đọc lại tư liệu rồi soạn lại theo trục tiếng mới.` }
  const kb = boPhanMay(kb0) as Row
  const loiLd = kiemKichBan(kb)
  if (loiLd.length) return { ok: false, lyDo: 'luoc-do', loi: loiLd, error: 'Kịch bản sai lược đồ.' }
  // mã nội bộ không được lọt vào chữ học sinh đọc
  const tho = JSON.stringify(kb), lo = buoi.cau.map((c) => c.qid).filter((q) => q && q.length >= 4 && tho.includes(q))
  if (lo.length) return { ok: false, lyDo: 'ma-noi-bo', error: 'Kịch bản có mã câu nội bộ, bỏ đi rồi gửi lại.' }
  const loiBia = kiemChu((kb.bia as Row).loi)
  if (loiBia.length) return { ok: false, lyDo: 'chu-bia', loi: loiBia, error: 'Lời mời ở bìa chưa đạt luật chữ.' }
  // máy chủ tự kiểm thêm theo tư liệu thật: trang bảng có thật, giờ nằm trong trục tiếng
  const [trang, tenLop] = await Promise.all([trangCuaBuoi(env, id, buoi.msLive), tenTrongBuoi(env, id, str(dong.lop))])
  const giay = buoi.msLive / 1000, them: Record<string, string[]> = {}
  for (const c of kb.canh as Row[]) {
    const ng = (c.nguon ?? {}) as Row, l: string[] = []
    if (c.khuon !== 'tong-ket' && so(ng.trang) > trang.length) l.push(`Trang bảng ${so(ng.trang)} không có (buổi có ${trang.length} trang)`)
    const ngoaiTruc = (t: unknown): boolean => !(so(t) >= 0 && so(t) <= giay + 1)
    if (c.khuon !== 'tong-ket' && (ngoaiTruc(ng.tu) || ngoaiTruc(ng.den))) l.push('Giờ của cảnh nằm ngoài trục tiếng của buổi')
    if (((c.loi ?? []) as Row[]).some((x) => ngoaiTruc(x.tu) || ngoaiTruc(x.den))) l.push('Giờ lời Thầy nằm ngoài trục tiếng của buổi')
    if (l.length) them[str(c.id)] = l
  }
  const { kb: ra, cong } = quaCong(kb, { tenLop, them })
  // phần MÁY điền: vùng nét của từng cảnh trên trang bảng, giây của ý tổng kết, đầu tệp
  for (const c of ra.canh as Row[]) {
    const ng = c.nguon as Row, tr = trang.find((t) => t.stt === so(ng?.trang))
    if (ng && tr) ng.vung = vungTrong(tr, so(ng.tu) * 1000, so(ng.den) * 1000) ?? []
  }
  for (const c of ra.canh as Row[]) if (c.khuon === 'tong-ket') for (const y of ((c.duLieu as Row).y as Row[])) y.giay = so(((ra.canh as Row[]).find((x) => x.id === y.canh)?.nguon as Row | undefined)?.tu)
  const luc = new Date(nay).toISOString()
  ra.buoi = { ten: str(dong.ten_thay).trim() || str(dong.ten_tu_dong), lop: str(dong.lop), ngay: str(dong.ngay), thu: thuVn(str(dong.ngay)), gioBatDau: gioVn(str(dong.bat_luc)), phutLive: Math.round(buoi.msLive / 60_000), ban }
  ra.nguon = { soTrangBang: trang.length, nguoiSoan: 'van-phong', luc, dat: cong.dat.length, soCanh: cong.soCau }
  if (!env.DE) return { ok: false, lyDo: 'khong-r2', error: 'Máy chủ chưa có kho tệp.' }
  await env.DE.put(khoaTep(id, TEP_NHAT_KY_GOC), JSON.stringify({ luc, ban, kichBan: kb }), { httpMetadata: { contentType: 'application/json;charset=utf-8' } })
  if (cong.phatHanh) await env.DE.put(khoaTep(id, TEP_NHAT_KY), JSON.stringify(ra), { httpMetadata: { contentType: 'application/json;charset=utf-8' } })
  else await env.DE.delete(khoaTep(id, TEP_NHAT_KY)).catch(() => undefined)
  await env.DB.prepare(`INSERT INTO live_nhat_ky (buoi_id, ban_buoi, luc, so_canh, so_dat, phat_hanh) VALUES (?1, ?2, ?3, ?4, ?5, ?6)
      ON CONFLICT(buoi_id) DO UPDATE SET ban_buoi = ?2, luc = ?3, so_canh = ?4, so_dat = ?5, phat_hanh = ?6`).bind(id, ban, luc, cong.soCau, cong.dat.length, cong.phatHanh ? 1 : 0).run()
  return {
    ok: true, buoiId: id, ban, phatHanh: cong.phatHanh, soCanh: cong.soCau, dat: cong.dat, bo: cong.bo, nguong: cong.nguong.moTa,
    ...(cong.phatHanh ? {} : { lyDo: 'chua-du-canh', error: `Mới ${cong.dat.length}/${cong.soCau} cảnh đạt (cần ít nhất 4 cảnh và 60 %): học sinh chưa thấy bài, sửa các cảnh bị bỏ rồi gửi lại.` }),
  }
}

/** Lệnh của văn phòng (cửa xem lại đã kiểm mã GV). */
export async function lenhNhatKy(env: Env, p: string, b: Row, cc: CongCuNhatKy): Promise<Row | null> {
  if (p === '/gv/live-nhat-ky-ds') return nhatKyDs(env, b)
  const id = str(b.buoiId).trim()
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(id)) return { ok: false, lyDo: 'thieu', error: 'Thiếu mã buổi (buoiId).' }
  if (p === '/gv/live-nhat-ky-tu-lieu') return nhatKyTuLieu(env, id, cc)
  if (p === '/gv/live-nhat-ky-ghi') return nhatKyGhi(env, b)
  return null
}
