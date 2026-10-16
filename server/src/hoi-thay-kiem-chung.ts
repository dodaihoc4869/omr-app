// Bằng chứng sau Hỏi thầy. Câu kiểm/lần nộp đầu ở máy chủ; không sửa luật chấm/điểm/EXP.
import type { Env } from './kieu'
import { gameIdentity } from './game-v2-auth'
import { trangThaiHoiThay } from './hoi-thay-ca-nhan'
import { docHoTroHoiThay } from './hoi-thay-can-giup'
import { dongBoSuaLoiHoiThay } from './hoi-thay-dong-bo-sua'
import { layCauChoEm } from './cau-theo-qid'
import { chanKhacKhoiEm } from './chan-khac-khoi'
import { qidChuan, SQL_DAU_HO_TRO_CHUA } from './chua-cau-sai-adapter'
import { chamMotCau, daTraLoi } from './on-lai-nop'
import { khopPhanIII } from '../../src/lib/cham-so'
import { ketQuaTungY } from './omni-game'
import { lenhGhiSuKienNguyenTu, type SuKien } from './su-kien-hoc'
import { emCoGhi } from './dem-ke-hoach'
import { bamKiemHoiThay, congKhaiKiemHoiThay, docNguonKiemHoiThay, xepSoanKiemHoiThay, type CauKiemHoiThay } from './hoi-thay-kiem-chung-nguon'
import type { PrivateQuestion } from '../../src/game/than-thu-v2/core'
import { sqlCauHoiThayDenHan } from './hoi-thay-lich-on'

type Obj = Record<string, unknown>
type Dong = { id: string; sbd: string; qid_goc: string; nhom_goc: string; version_goc: string; qid_kiem: string; version_kiem: string; khoa_noi_dung: string; snapshot_json: string; assistance: string; trang_thai: string; phat_luc: number; het_han_luc: number; nop_luc: number | null; tra_loi: string | null; dung: number | null; attempt_id: string | null; request_hash: string | null; response_json: string | null; den_han: number | null; revision: number }
const str = (x: unknown) => typeof x === 'string' ? x.trim() : ''
const GIO = 3_600_000
const NGAY = 24 * GIO
const loi = (ma: string, error: string) => ({ ok: false, ma, error })
const LOI_CHO = () => loi('CHO_GHI_SO', 'Chưa lưu được tiến độ. Em giữ câu trả lời và thử lại nhé.')
export { SQL_HOI_THAY_KIEM } from './hoi-thay-kiem-chung-schema'
// Không tạo DDL ở đường mở app. Migration chưa áp thì chỉ các nút kiểm mới trả lời mềm.
async function quyen(env: Env, b: Obj): Promise<string | null> {
  try { return await gameIdentity(env, b) } catch { return null }
}
async function docGoc(env: Env, sbd: string, qid: string, now: number): Promise<PrivateQuestion | null> {
  const [ca, r] = await Promise.all([
    trangThaiHoiThay(env, sbd, qid, now),
    layCauChoEm(env, sbd, [qid]),
  ])
  if (ca.dangKiemTra || ca.dangLam || r.loi) return null
  const q = r.cau.find(x => x.qid === qid)
  if (!q || q.reviewed !== true || !q.version || !q.group || !q.correct?.trim()) return null
  const duoc = await chanKhacKhoiEm(env, 'hoi_thay_kiem', sbd, [q], r.nghi ? { nghiSan: r.nghi } : {})
  return duoc[0] ?? null
}
const docLich = async (env: Env, sbd: string, qid: string): Promise<Dong[]> => (await env.DB.prepare('SELECT * FROM hoi_thay_kiem WHERE sbd=? AND qid_goc=? ORDER BY phat_luc DESC,id DESC LIMIT 64').bind(sbd, qid).all<Dong>()).results ?? []
function docSnapshot(d: Dong): CauKiemHoiThay | null {
  try { const x = JSON.parse(d.snapshot_json); return x?.q?.qid === d.qid_kiem && x.q.version === d.version_kiem && x.khoa === d.khoa_noi_dung ? x : null } catch { return null }
}
function docPhanHoi(d: Dong): Obj | null {
  try { const x = JSON.parse(d.response_json ?? ''); return x?.ok === true ? x : null } catch { return null }
}
/** Mọi dấu trợ giúp thật, kể cả gợi ý co_ho_so=0. Chỉ mở hộp chưa có lời giải không chặn lần kiểm sau. */
async function hoTroCuoi(env: Env, sbd: string, q: PrivateQuestion, qidKiem: string, now: number): Promise<number> {
  const r = await env.DB.prepare(`SELECT MAX(l.luc) AS luc FROM loi_giai_hoi l WHERE l.sbd=? AND l.luc<=? AND ${SQL_DAU_HO_TRO_CHUA} AND
    (l.qid IN (?,?) OR l.qid IN (SELECT qid FROM game_v2_question WHERE content_group=?))`)
    .bind(sbd, new Date(now).toISOString(), q.qid, qidKiem, q.group).first<{ luc: string | null }>()
  return Date.parse(r?.luc ?? '') || 0
}
function henLai(now: number): number { return now + NGAY }
/** Chỉ replay luật sẵn có được công nhận đóng lỗi; kiểm trong phiên không đổi P hay chua_loi_dot. */
async function daXacNhan(env: Env, sbd: string, qid: string, ds: Dong[], now: number): Promise<boolean> {
  // Lần đầu chưa có receipt: không kéo replay vào đường phát câu. Sau đó dùng MỘT
  // luật chung: bằng chứng kiểm ở đây HOẶC tự làm trong lịch ôn, đúng phiên bản.
  if (!ds.some(d => d.trang_thai === 'da_nop')) return false
  return (await dongBoSuaLoiHoiThay(env, sbd, qid, now)).daXacNhan
}
function traCau(d: Dong) {
  const c = docSnapshot(d)
  return c ? { ok: true, trangThai: 'co_cau', phienId: d.id, cau: congKhaiKiemHoiThay(c.q), thongBao: 'Em tự làm câu tương đương này. Kết quả đầu tiên được lưu để chọn cách hỗ trợ tiếp.' } : LOI_CHO()
}

export async function hsMoKiemHoiThay(env: Env, b: Obj): Promise<Obj> {
  const sbd = await quyen(env, b)
  if (!sbd) return loi('CAN_DANG_NHAP', 'Em đăng nhập lại để kiểm tra nhé.')
  const qid = qidChuan(str(b.qid)), now = Date.now()
  if (!qid || qid.length > 120) return loi('THIEU_CAU', 'Thiếu câu cần kiểm tra.')
  try {
    const [goc, ds] = await Promise.all([docGoc(env, sbd, qid, now), docLich(env, sbd, qid)])
    if (!goc) return loi('CAU_CHUA_MO', 'Câu này hiện chưa được phép luyện. Em hoàn thành ca kiểm tra hoặc quay lại câu đã học nhé.')
    const hoTro = await docHoTroHoiThay(env, sbd, qid, now)
    const loiThay = hoTro.loiThay ? { loiThay: hoTro.loiThay } : {}
    const dungBan = ds.filter(d => d.version_goc === goc.version && d.nhom_goc === goc.group)
    if (await daXacNhan(env, sbd, qid, dungBan, now)) {
      // Helper đã khép lịch cùng giao dịch GUARD; không ghi lại sau chốt để tránh xoá lịch mới xen ngang.
      return { ok: true, trangThai: 'da_xac_nhan', ...loiThay, thongBao: 'Em đã có bằng chứng tự giải được câu tương đương ở các ngày khác nhau. App tiếp tục ôn theo lịch chung.' }
    }
    const mo = dungBan.find(d => d.trang_thai === 'dang_lam' && d.het_han_luc > now)
    if (mo) {
      const c = docSnapshot(mo), nguon = await docNguonKiemHoiThay(env, goc, undefined, mo.khoa_noi_dung)
      if (c && nguon.cau.some(x => x.khoa === c.khoa && x.q.version === c.q.version)) return { ...traCau(mo), ...loiThay }
      // Học liệu vừa sửa/thu hồi: không chấm ảnh cũ bằng nguồn mới.
      await env.DB.prepare("UPDATE hoi_thay_kiem SET trang_thai='het_han',revision=revision+1 WHERE id=? AND trang_thai='dang_lam'").bind(mo.id).run()
      return loi('CAU_THAY_DOI', 'Câu kiểm vừa được cập nhật. Em mở lại để nhận đúng bản nhé.')
    }
    const cu = dungBan.find(d => d.trang_thai === 'da_nop')
    if (cu && (cu.den_han ?? 0) > now) return { ok: true, trangThai: 'cho_kiem_lai', ...loiThay, denHan: new Date(cu.den_han!).toISOString(), thongBao: 'Kết quả của em đã được lưu. Câu này sẽ được kiểm lại theo lịch ôn chung; không cộng thêm bài bắt buộc.' }
    const daDung = new Set(ds.filter(d => d.trang_thai === 'da_nop').map(d => d.khoa_noi_dung))
    const nguon = await docNguonKiemHoiThay(env, goc, daDung)
    const c = nguon.cau.find(x => !daDung.has(x.khoa))
    if (!c) {
      // Không hứa đã xếp nếu ghi hàng soạn thất bại.
      let daXep = false
      try { daXep = await xepSoanKiemHoiThay(env, goc, nguon.bamGoc, now) } catch { /* thiếu hàng soạn: em vẫn gửi thầy được */ }
      return { ok: true, trangThai: 'cho_nguon', ...loiThay, thongBao: daXep ? 'Thầy đang chuẩn bị thêm bản kiểm đã duyệt. Em có thể gửi chỗ còn vướng cho thầy.' : 'Chưa có bản kiểm phù hợp đã duyệt. Em có thể gửi chỗ còn vướng cho thầy.' }
    }
    const tro = await hoTroCuoi(env, sbd, goc, c.q.qid, now)
    const assistance = tro && now - tro < 12 * GIO ? 'assisted' : 'none'
    const id = crypto.randomUUID(), snap = JSON.stringify(c)
    const r = await env.DB.batch([
      env.DB.prepare("UPDATE hoi_thay_kiem SET trang_thai='het_han',revision=revision+1 WHERE sbd=? AND qid_goc=? AND trang_thai='dang_lam' AND (het_han_luc<=? OR version_goc<>?)").bind(sbd, qid, now, goc.version),
      env.DB.prepare(`INSERT OR IGNORE INTO hoi_thay_kiem(id,sbd,qid_goc,nhom_goc,version_goc,qid_kiem,version_kiem,khoa_noi_dung,snapshot_json,assistance,phat_luc,het_han_luc)
        SELECT ?,?,?,?,?,?,?,?,?,?,?,? WHERE NOT EXISTS(SELECT 1 FROM hoi_thay_kiem WHERE sbd=? AND qid_goc=? AND trang_thai='da_nop' AND (khoa_noi_dung=? OR den_han>?))`)
        .bind(id, sbd, qid, goc.group, goc.version, c.q.qid, c.q.version, c.khoa, snap, assistance, now, now + NGAY, sbd, qid, c.khoa, now),
      env.DB.prepare("SELECT * FROM hoi_thay_kiem WHERE sbd=? AND qid_goc=? ORDER BY CASE trang_thai WHEN 'dang_lam' THEN 0 ELSE 1 END,phat_luc DESC,id DESC LIMIT 1").bind(sbd, qid),
    ])
    const d = r[2]?.results[0] as Dong | undefined
    if (d?.trang_thai === 'da_nop' && d.den_han) return { ok: true, trangThai: 'cho_kiem_lai', ...loiThay, denHan: new Date(d.den_han).toISOString(), thongBao: 'Kết quả đầu tiên đã được lưu. Em kiểm lại theo lịch ôn chung nhé.' }
    return d?.trang_thai === 'dang_lam' ? { ...traCau(d), ...loiThay } : LOI_CHO()
  } catch { return loi('CHO_CHUAN_BI', 'Chưa mở được câu kiểm. Tiến độ của em vẫn được giữ; em thử lại sau nhé.') }
}

export async function hsNopKiemHoiThay(env: Env, b: Obj): Promise<Obj> {
  const sbd = await quyen(env, b)
  if (!sbd) return loi('CAN_DANG_NHAP', 'Em đăng nhập lại để nộp nhé.')
  const phienId = str(b.phienId), attempt = str(b.attemptId), tra = str(b.traLoi)
  if (!phienId || phienId.length > 120 || !attempt || attempt.length > 120 || !tra || tra.length > 100) return loi('THIEU_BAI_LAM', 'Em nhập đủ câu trả lời trước khi kiểm tra nhé.')
  const hash = await bamKiemHoiThay([phienId, tra]), now = Date.now()
  try {
    const r = await env.DB.batch([
      env.DB.prepare('SELECT * FROM hoi_thay_kiem WHERE id=? AND sbd=?').bind(phienId, sbd),
      env.DB.prepare('SELECT id,request_hash,response_json FROM hoi_thay_kiem WHERE sbd=? AND attempt_id=?').bind(sbd, attempt),
    ])
    const d = r[0]?.results[0] as Dong | undefined, cu = r[1]?.results[0] as Dong | undefined
    if (cu) return cu.id === phienId && cu.request_hash === hash && docPhanHoi(cu) ? { ...docPhanHoi(cu), idempotent: true } : loi('XUNG_DOT_ATTEMPT', 'Mã lần nộp đã gắn với bài làm khác. Kết quả đầu tiên được giữ.')
    if (!d) return loi('KHONG_CO_PHIEN', 'Không tìm thấy câu kiểm của em. Em mở lại từ Hỏi thầy nhé.')
    if (d.trang_thai === 'da_nop') return d.request_hash === hash && docPhanHoi(d) ? { ...docPhanHoi(d), idempotent: true } : loi('DA_NOP', 'Câu này đã lưu lần trả lời đầu tiên. Em kiểm lại bằng bản mới theo lịch ôn nhé.')
    if (d.trang_thai !== 'dang_lam' || d.het_han_luc <= now) return loi('PHIEN_HET_HAN', 'Câu kiểm đã hết hạn. Em mở lại để tiếp tục nhé.')
    const c = docSnapshot(d)
    if (!c || !daTraLoi(c.q.phan, tra) || (c.q.phan === 'III' && !khopPhanIII(tra, tra))) return loi('CAU_TRA_LOI_CHUA_HOP_LE', 'Em nhập một số hoặc chọn đủ các ý trước khi kiểm tra nhé.')
    const [goc, ds] = await Promise.all([docGoc(env, sbd, d.qid_goc, now), docLich(env, sbd, d.qid_goc)])
    if (!goc || goc.version !== d.version_goc || goc.group !== d.nhom_goc) return loi('CAU_THAY_DOI', 'Câu đã đổi hoặc đang được bảo vệ. Tiến độ được giữ; em mở lại sau nhé.')
    const [nguon, tro] = await Promise.all([docNguonKiemHoiThay(env, goc, undefined, c.khoa), hoTroCuoi(env, sbd, goc, c.q.qid, now)])
    if (!nguon.cau.some(x => x.khoa === c.khoa && x.q.version === c.q.version && x.q.qid === c.q.qid)) return loi('CAU_THAY_DOI', 'Học liệu kiểm đã được cập nhật. Em mở lại để nhận đúng bản, lượt này không tính sai.')
    const assisted = d.assistance !== 'none' || (tro > 0 && (tro >= d.phat_luc || now - tro < 12 * GIO))
    const dung = chamMotCau({ qid: c.q.qid, dapAn: tra }, c.q)
    const nopTruoc = ds.filter(x => x.trang_thai === 'da_nop' && x.version_goc === goc.version && x.nhom_goc === goc.group)
    const saiLien = nopTruoc.findIndex(x => x.dung === 1)
    const soSai = saiLien < 0 ? nopTruoc.filter(x => x.dung === 0).length : nopTruoc.slice(0, saiLien).length
    const canThay = !dung && soSai >= 1
    const denHan = henLai(now)
    const response: Obj = {
      ok: true, dung, trangThai: canThay ? 'can_thay' : dung && !assisted ? 'da_tu_lam' : 'cho_kiem_lai',
      denHan: new Date(denHan).toISOString(),
      thongBao: canThay ? 'Em còn vướng ở câu tương đương. Thầy cần xem chỗ này để hỗ trợ; các bước em đã làm được vẫn được giữ.'
        : dung && !assisted ? 'Em đã tự làm đúng bản tương đương. App tiếp tục đối chiếu bằng chứng ở các ngày khác nhau theo lịch ôn chung.'
          : dung ? 'Em đã làm đúng sau khi được hướng dẫn. Cần kiểm lại vào ngày khác để xác nhận em tự làm được.'
            : 'Câu này chưa đúng. Em xem lại quan hệ đang vướng; app sẽ chọn bản kiểm khác theo lịch ôn chung.',
    }
    const event: SuKien = {
      nguon: 'chua_loi', maNguon: `hoi_thay_kiem:${d.id}`, sbd, qid: c.q.qid,
      cauVersion: c.q.version, lan: 1, ketQua: dung ? 1 : 0, luc: new Date(now).toISOString(), receivedAt: now,
      attemptId: d.id, assistance: assisted ? 'assisted' : 'none', visibility: 'released', purpose: 'repair',
      maDang: goc.dang, mucDo: goc.mucDo ?? '', giay: Math.min(1800, Math.max(0, Math.floor((now - d.phat_luc) / 1000))),
      raw: { answer: tra, tc: d.qid_goc, hoiThayKiem: true, phienId: d.id, nguon: c.nguon },
      ...(c.q.phan === 'II' ? { subitem: ketQuaTungY(tra, c.q.correct) } : {}),
    }
    const guard = { sql: "EXISTS(SELECT 1 FROM hoi_thay_kiem WHERE id=? AND sbd=? AND attempt_id=? AND request_hash=? AND trang_thai='da_nop')", params: [d.id, sbd, attempt, hash] }
    const kq = await env.DB.batch([
      env.DB.prepare(`UPDATE hoi_thay_kiem SET trang_thai='da_nop',tra_loi=?,dung=?,assistance=?,attempt_id=?,request_hash=?,response_json=?,nop_luc=?,den_han=?,revision=revision+1
        WHERE id=? AND sbd=? AND trang_thai='dang_lam' AND revision=? AND het_han_luc>?
        AND EXISTS(SELECT 1 FROM game_v2_question q JOIN de_kho b ON b.ma_de=q.ma_de JOIN game_v2_index i ON i.ma_de=b.ma_de AND i.source_version=b.cap_nhat_luc
          WHERE q.qid=? AND q.version=? AND q.content_group=? AND COALESCE(b.da_xoa,0)=0 AND json_extract(q.json,'$.reviewed')=1
          AND NOT EXISTS(SELECT 1 FROM cau_nghi_dap_an n WHERE n.trang_thai='nghi' AND (n.qid=q.qid OR n.qid IN(SELECT a.qid FROM game_v2_question a WHERE a.content_group=q.content_group))))
        AND (?=1 OR NOT EXISTS(SELECT 1 FROM loi_giai_hoi l WHERE l.sbd=? AND ${SQL_DAU_HO_TRO_CHUA} AND julianday(l.luc)>julianday(?) AND (l.qid IN(?,?) OR l.qid IN(SELECT qid FROM game_v2_question WHERE content_group=?))))`)
        .bind(tra, dung ? 1 : 0, assisted ? 'assisted' : 'none', attempt, hash, JSON.stringify(response), now, denHan, d.id, sbd, d.revision, now,
          d.qid_goc, d.version_goc, d.nhom_goc, assisted ? 1 : 0, sbd, new Date(tro).toISOString(), d.qid_goc, c.q.qid, d.nhom_goc),
      lenhGhiSuKienNguyenTu(env, [event], guard),
      env.DB.prepare('SELECT * FROM hoi_thay_kiem WHERE id=? AND sbd=?').bind(d.id, sbd),
    ])
    const winner = kq[2]?.results[0] as Dong | undefined
    if (winner?.trang_thai === 'dang_lam') return LOI_CHO() // trợ giúp/phiên bản vừa đổi giữa lượt đọc và batch; retry sẽ đọc lại đúng dấu.
    if (!winner || winner.request_hash !== hash || !docPhanHoi(winner)) return loi('DA_NOP', 'Kết quả đầu tiên đã được giữ. Em mở lại để xem tiến độ nhé.')
    emCoGhi(sbd)
    if (dung && !assisted && winner.attempt_id === attempt) {
      try {
        const dungBan = [winner, ...ds.filter(x => x.id !== winner.id)].filter(x => x.version_goc === goc.version && x.nhom_goc === goc.group)
        await daXacNhan(env, sbd, d.qid_goc, dungBan, now)
      } catch { /* Receipt/sổ đã bền. Lần mở sau tự đối chiếu lại, không ghi nhận giả khi đồng bộ lỗi. */ }
    }
    if (canThay && winner.attempt_id === attempt) {
      try {
        const { guiCanGiupHoiThay } = await import('./hoi-thay-can-giup')
        await guiCanGiupHoiThay(env, { sbd, qid: d.qid_goc, lyDo: 'kiem_chua_dat', nowMs: now })
      } catch { /* Receipt/sổ đã chắc chắn lưu; không nói "đã gửi" khi hàng thầy chưa ghi được. */ }
    }
    return { ...docPhanHoi(winner), ...(winner.attempt_id !== attempt ? { idempotent: true } : {}) }
  } catch { return LOI_CHO() }
}

/** Móc vào bộ lập kế hoạch chung: thay chỗ ôn trong ngân sách sẵn có, tuyệt đối không tăng quota. */
export async function docCauHoiThayDenHan(env: Env, sbd: string, now = Date.now()): Promise<string[]> {
  try {
    const r = await env.DB.prepare(sqlCauHoiThayDenHan('?1', '?2')).bind(sbd, now).all<{ qid_goc: string }>()
    return (r.results ?? []).map(x => x.qid_goc)
  } catch { return [] }
}
