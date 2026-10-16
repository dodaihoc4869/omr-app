// Chỗ còn mắc có người nhận: lưu yêu cầu, gom theo lớp/câu, thầy trả lời một lần.
// Hướng dẫn không tự đóng lỗi; khi được phục vụ cho em mới ghi mốc hỗ trợ.
import type { Env } from './kieu'
import { gameIdentity } from './game-v2-auth'
import { nguCanhHoiTroLy } from './loi-giai'
import { trangThaiHoiThay } from './hoi-thay-ca-nhan'
import { qidChuan } from './chua-cau-sai-adapter'
import { emCoGhi } from './dem-ke-hoach'
import { sqlTenLopHs } from './goi-bai-7'

type Obj = Record<string, unknown>
const chu = (v: unknown) => typeof v === 'string' ? v.trim() : ''
const khoa = (q: unknown) => {
  const s = chu(q)
  return s && s.length <= 120 ? qidChuan(s) : ''
}
const nhan = (s: string) => s.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 320)
const LOI = { ok: false as const, error: 'Chưa lưu được yêu cầu. Em thử lại nhé.' }

export async function guiCanGiupHoiThay(env: Env, x: { sbd: string; qid: string; lyDo: string; nowMs?: number; tieuDe?: string }): Promise<void> {
  const now = x.nowMs ?? Date.now(), qid = khoa(x.qid)
  if (!qid || !x.sbd) throw new Error('Thiếu em hoặc câu cần giúp.')
  await env.DB.prepare(`INSERT INTO hoi_thay_can_giup(sbd,qid,tieu_de,ly_do,gui_luc,cap_nhat_luc)
    VALUES(?,?,?,?,?,?) ON CONFLICT(sbd,qid) DO UPDATE SET
    tieu_de=CASE WHEN excluded.tieu_de<>'' THEN excluded.tieu_de ELSE hoi_thay_can_giup.tieu_de END,
    ly_do=excluded.ly_do,trang_thai='can_thay',cap_nhat_luc=excluded.cap_nhat_luc,
    revision=hoi_thay_can_giup.revision+1`)
    .bind(x.sbd, qid, nhan(x.tieuDe ?? ''), x.lyDo === 'kiem_chua_dat' ? 'Em chưa tự làm được câu tương đương sau hướng dẫn.' : nhan(x.lyDo), now, now).run()
}

export async function hsGuiThayHoiThay(env: Env, b: Obj, nowMs = Date.now()) {
  const sbd = await gameIdentity(env, b), qid = khoa(b.qid)
  if (!sbd) return { ok: false, ma: 'dang_nhap', error: 'Em đăng nhập lại để tiếp tục.' }
  if (!qid) return { ok: false, ma: 'thieu_cau', error: 'Em mở câu cần hỏi rồi thử lại nhé.' }
  try {
    const [nc, ca] = await Promise.all([
      nguCanhHoiTroLy(env, sbd, qid, nowMs),
      trangThaiHoiThay(env, sbd, qid, nowMs),
    ])
    if (ca.dangKiemTra) return { ok: false, ma: 'dang_kiem_tra', error: 'Em hoàn thành ca kiểm tra rồi hỏi thầy nhé.' }
    if (!nc.ok) return { ok: false, ma: nc.khoa ?? 'khong_mo', error: nc.error }
    const cu = await env.DB.prepare('SELECT trang_thai FROM hoi_thay_can_giup WHERE sbd=? AND qid=?').bind(sbd, qid).first<{ trang_thai: string }>()
    // Bấm lặp không đưa yêu cầu cũ lên đầu hoặc xoá lời thầy đã gửi.
    if (cu?.trang_thai !== 'can_thay') await guiCanGiupHoiThay(env, { sbd, qid, nowMs, lyDo: 'Em vẫn còn chỗ chưa hiểu.', tieuDe: nc.cau.de })
    return { ok: true, thongBao: 'Đã gửi chỗ em còn vướng cho thầy. Em có thể tiếp tục phần khác.' }
  } catch { return { ...LOI, ma: 'chua_luu' } }
}

/** Chỉ gọi SAU cổng quyền câu/ca. Không trả lời thầy nếu chưa lưu được dấu hỗ trợ. */
export async function docHoTroHoiThay(env: Env, sbd: string, qid: string, nowMs = Date.now()): Promise<{ loiThay?: string; capNhatLuc?: number }> {
  const q = khoa(qid)
  const r = await env.DB.prepare('SELECT loi_thay,loi_luc,doc_luc,revision FROM hoi_thay_can_giup WHERE sbd=? AND qid=?').bind(sbd, q).first<{ loi_thay: string; loi_luc: number; doc_luc: number; revision: number }>()
  if (!r?.loi_thay) return {}
  if (r.doc_luc < r.loi_luc) {
    const ghi = await env.DB.batch([
      env.DB.prepare('UPDATE hoi_thay_can_giup SET doc_luc=? WHERE sbd=? AND qid=? AND loi_luc=? AND revision=? AND doc_luc<loi_luc').bind(nowMs, sbd, q, r.loi_luc, r.revision),
      env.DB.prepare("INSERT OR IGNORE INTO loi_giai_hoi(sbd,qid,nguon,luc,co_ho_so) SELECT ?,?,'hoi_thay:thay_go',?,0 WHERE changes()=1").bind(sbd, q, new Date(nowMs).toISOString()),
    ])
    // Một tab khác có thể đã nhận lời hoặc thầy vừa gửi bản mới trong lúc đọc.
    // Chỉ phục vụ bản cũ nếu mốc hỗ trợ của chính bản ấy đã được lưu.
    if (!ghi[0]?.meta.changes) {
      const moi = await env.DB.prepare('SELECT loi_luc,doc_luc,revision FROM hoi_thay_can_giup WHERE sbd=? AND qid=?').bind(sbd, q).first<{ loi_luc: number; doc_luc: number; revision: number }>()
      if (!moi || moi.revision !== r.revision || moi.loi_luc !== r.loi_luc || moi.doc_luc < r.loi_luc) throw new Error('Lời thầy vừa thay đổi. Em mở lại để nhận bản mới.')
    }
    emCoGhi(sbd)
  }
  return { loiThay: r.loi_thay, capNhatLuc: r.loi_luc }
}

interface DongCanGiup {
  sbd: string; qid: string; tieu_de: string; ly_do: string; gui_luc: number;
  cap_nhat_luc: number; revision: number; ho_ten: string; lop: string;
}
export async function gvSoCanGiupHoiThay(env: Env, b: Obj) {
  const lop = chu(b.lop).slice(0, 80)
  const c = b.sau && typeof b.sau === 'object' ? b.sau as Obj : {}
  const coMoc = Number.isSafeInteger(c.luc) && Number(c.luc) > 0 && !!chu(c.sbd) && !!khoa(c.qid)
  const moc = coMoc ? Number(c.luc) : Number.MAX_SAFE_INTEGER
  const [rows, tong] = await Promise.all([
    env.DB.prepare(`SELECT c.sbd,c.qid,c.tieu_de,c.ly_do,c.gui_luc,c.cap_nhat_luc,c.revision,
      COALESCE(h.ho_ten,'') AS ho_ten,${sqlTenLopHs('h')} AS lop
      FROM hoi_thay_can_giup c LEFT JOIN hoc_sinh h ON h.sbd=c.sbd
      WHERE c.trang_thai='can_thay' AND (?='' OR ${sqlTenLopHs('h')}=?)
      AND (c.cap_nhat_luc<? OR (c.cap_nhat_luc=? AND (c.sbd>? OR (c.sbd=? AND c.qid>?))))
      ORDER BY c.cap_nhat_luc DESC,c.sbd,c.qid LIMIT 101`)
      .bind(lop, lop, moc, moc, coMoc ? chu(c.sbd) : '', coMoc ? chu(c.sbd) : '', coMoc ? khoa(c.qid) : '').all<DongCanGiup>(),
    env.DB.prepare(`SELECT COUNT(*) AS n FROM hoi_thay_can_giup c LEFT JOIN hoc_sinh h ON h.sbd=c.sbd WHERE c.trang_thai='can_thay' AND (?='' OR ${sqlTenLopHs('h')}=?)`).bind(lop, lop).first<{ n: number }>(),
  ])
  const ds = (rows.results ?? []).slice(0, 100)
  const cuoi = ds.at(-1)
  return {
    ok: true, tong: Number(tong?.n) || 0,
    ds: ds.map(r => ({ sbd: r.sbd, qid: r.qid, ten: r.ho_ten, lop: r.lop, tieuDe: r.tieu_de,
      lyDo: r.ly_do, guiLuc: r.gui_luc, capNhatLuc: r.cap_nhat_luc, revision: r.revision })),
    ...(rows.results.length > 100 && cuoi ? { sau: { luc: cuoi.cap_nhat_luc, sbd: cuoi.sbd, qid: cuoi.qid } } : {}),
  }
}

async function bam(v: unknown): Promise<string> {
  const a = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(v)))
  return [...new Uint8Array(a)].map(x => x.toString(16).padStart(2, '0')).join('')
}
/** Cổng thầy ở index.ts; CAS từng yêu cầu và receipt cả lô, không tự đóng lỗi hay đổi điểm. */
export async function gvGhiHoTroHoiThay(env: Env, b: Obj, nowMs = Date.now()) {
  const qid = khoa(b.qid), loiGo = chu(b.loiGo), id = chu(b.requestId)
  const em = Array.isArray(b.em) ? b.em as Obj[] : []
  if (!qid || !loiGo || loiGo.length > 4000 || !/^[\w-]{16,100}$/.test(id) || !em.length || em.length > 50 ||
    em.some(x => !chu(x.sbd) || chu(x.sbd).length > 80 || !Number.isSafeInteger(x.revision) || Number(x.revision) < 0) ||
    new Set(em.map(x => chu(x.sbd))).size !== em.length)
    return { ok: false, ma: 'thieu_thong_tin', error: 'Cần lời hướng dẫn và đúng danh sách tối đa 50 em vừa xem.' }
  const nhanEm = em.map(x => ({ sbd: chu(x.sbd), revision: Number(x.revision) })).sort((a, c) => a.sbd.localeCompare(c.sbd))
  const hash = await bam([qid, loiGo, nhanEm])
  const cu = await env.DB.prepare('SELECT request_hash,response_json FROM hoi_thay_ho_tro_receipt WHERE request_id=?').bind(id).first<{ request_hash: string; response_json: string }>()
  if (cu) return cu.request_hash === hash ? { ...JSON.parse(cu.response_json), idempotent: true } : { ok: false, ma: 'khac_noi_dung', error: 'Lần gửi này đã dùng cho lời hướng dẫn khác.' }
  const result = { ok: true, soEm: nhanEm.length, thongBao: `Đã gửi hướng dẫn cho ${nhanEm.length} em. Các em sẽ tự kiểm lại.` }
  const nhom = JSON.stringify(nhanEm)
  const rr = await env.DB.batch([
    env.DB.prepare(`INSERT OR IGNORE INTO hoi_thay_ho_tro_receipt(request_id,request_hash,response_json,tao_luc)
      SELECT ?,?,?,? WHERE NOT EXISTS(SELECT 1 FROM json_each(?) x
      LEFT JOIN hoi_thay_can_giup c ON c.sbd=json_extract(x.value,'$.sbd') AND c.qid=?
      WHERE c.sbd IS NULL OR c.trang_thai<>'can_thay' OR c.revision<>json_extract(x.value,'$.revision'))`)
      .bind(id, hash, JSON.stringify(result), nowMs, nhom, qid),
    env.DB.prepare(`UPDATE hoi_thay_can_giup SET loi_thay=?,loi_luc=?,doc_luc=0,trang_thai='da_ho_tro',revision=revision+1,cap_nhat_luc=?
      WHERE qid=? AND sbd IN(SELECT json_extract(value,'$.sbd') FROM json_each(?)) AND changes()=1`)
      .bind(loiGo, nowMs, nowMs, qid, nhom),
    env.DB.prepare('SELECT request_hash,response_json FROM hoi_thay_ho_tro_receipt WHERE request_id=?').bind(id),
  ])
  const dong = rr[2]?.results?.[0] as { request_hash: string; response_json: string } | undefined
  if (!dong) return { ok: false, ma: 'tien_do_doi', error: 'Danh sách vừa thay đổi. Thầy tải lại rồi gửi hướng dẫn nhé.' }
  if (dong.request_hash !== hash) return { ok: false, ma: 'khac_noi_dung', error: 'Lần gửi này đã dùng cho nội dung khác.' }
  return JSON.parse(dong.response_json) as typeof result
}
