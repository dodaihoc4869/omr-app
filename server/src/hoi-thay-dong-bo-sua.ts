// Nối bằng chứng toàn bài vào hàng sửa lỗi. Không dùng kết quả microcheck, không đổi luật đóng lỗi hay ghi lại sổ học.
import type { Env } from './kieu'
import { docTrangThaiLoiDau, docLuatChua, qidChuan, SQL_DAU_HO_TRO_CHUA } from './chua-cau-sai-adapter'
import { SQL_LA_LAN_LAM } from './omni-kieu'
import { SQL_DA_CONG_BO } from './cong-bo-diem'
import { ngayVn } from './su-kien-hoc'
import { emCoGhi } from './dem-ke-hoach'
import { tachSongSinh } from './loi-hoc-luat'

type DongRevision = { id?: string; qid?: string; revision: number }
export interface KetQuaDongBoSuaHoiThay { daXacNhan: boolean; soDotDong: number; soYeuCauDong: number }
export interface BangChungBanHoiThay { version_goc: string; nhom_goc: string; dung: number | null; assistance: string; nop_luc: number | null; khoa_noi_dung: string; laBanKhac?: boolean }
type DongSo = { qid: string; ket_qua: number | null; luc: string; assistance: string | null; nguon: string; ma_nguon: string; attempt_id: string; raw_json: string }
type DongKiem = BangChungBanHoiThay & { id: string; qid_goc: string; qid_kiem: string; version_kiem: string }
/** Bằng chứng phải thuộc bản nguồn đang dùng. Không dùng hai ngày đúng ở phiên bản cũ để xác nhận bản mới. */
export function duBangChungBanHienTai(ds: readonly BangChungBanHoiThay[], version: string, group: string, lastWrong = 0, canHaiNoiDung = true): boolean {
  const ban = ds.filter(d => d.version_goc === version && d.nhom_goc === group)
  const sai = Math.max(lastWrong, 0, ...ban.filter(d => d.dung === 0 && d.assistance === 'none').map(d => d.nop_luc ?? 0))
  const dung = ban.filter(d => d.dung === 1 && d.assistance === 'none' && (d.nop_luc ?? 0) > sai)
  return new Set(dung.map(d => ngayVn(d.nop_luc!))).size >= 2 && (!canHaiNoiDung || new Set(dung.map(d => d.khoa_noi_dung).filter(Boolean)).size >= 2)
}
const ROOTS = `WITH roots AS (
  SELECT qid FROM game_v2_question WHERE qid=?2 OR (content_group<>'' AND content_group=(SELECT content_group FROM game_v2_question WHERE qid=?2 LIMIT 1))
  UNION SELECT ?2
)`
// Đúng một câu + bản trùng/song sinh của nó; giữ tra qid bằng IN, không quét phát lại toàn bộ hồ sơ em.
const qidThuoc = (q: string) => `(${q} IN(SELECT qid FROM roots) OR ${q} IN(
  SELECT r.qid||'~ss'||j.value FROM roots r,json_each('[0,1,2,3,4,5,6,7]') j))`
const CAU_SO = `(${qidThuoc('s.qid')} OR json_extract(s.raw_json,'$.tc') IN(SELECT qid FROM roots))`
const CAU_DOT = `(qid_chuan IN(SELECT qid FROM roots) OR (content_group<>'' AND content_group=(SELECT content_group FROM game_v2_question WHERE qid=?2 LIMIT 1)))`
const MARK = `(${qidThuoc('qid')} OR qid IN(SELECT qid_kiem FROM hoi_thay_kiem WHERE sbd=?1 AND qid_goc IN(SELECT qid FROM roots))) AND ${SQL_DAU_HO_TRO_CHUA}`
const LAN_HOP_LE = `COALESCE(s.assistance,'none') IN('none','')
  AND COALESCE(s.visibility,'released')<>'embargoed' AND s.ngay_vn>='2026-09-29' AND ${SQL_LA_LAN_LAM}
  AND (s.nguon<>'thi' OR EXISTS(SELECT 1 FROM ca c WHERE c.ma_ca=s.ma_nguon AND c.trang_thai<>'da_xoa' AND ${SQL_DA_CONG_BO('c')}))
  AND (s.nguon<>'luyen' OR EXISTS(SELECT 1 FROM luyen_de_2026 ld WHERE ld.id=s.ma_nguon AND ld.sbd=s.sbd AND ld.status='submitted'))`
const SAI_HOP_LE = `COALESCE(s.ket_qua,0)=0 AND ${LAN_HOP_LE}`
// Sổ chỉ-thêm: bất kỳ dòng mới của câu, hoặc dấu hỗ trợ mới, sau ảnh chụp trước replay đều khiến lần chốt này dừng.
// MAX sai còn kiểm thêm lượt cũ vừa được công bố (rowid không đổi), không coi embargo là dữ liệu độc lập.
const GUARD = `NOT EXISTS(SELECT 1 FROM su_kien_hoc s WHERE s.sbd=?1 AND ${CAU_SO} AND s.rowid>?3)
  AND NOT EXISTS(SELECT 1 FROM loi_giai_hoi WHERE sbd=?1 AND ${MARK} AND rowid>?4)
  AND NOT EXISTS(SELECT 1 FROM su_kien_hoc s WHERE s.sbd=?1 AND ${CAU_SO} AND ${SAI_HOP_LE} AND julianday(s.luc)>julianday(?5))
  AND EXISTS(SELECT 1 FROM game_v2_question q JOIN de_kho b ON b.ma_de=q.ma_de
    JOIN game_v2_index i ON i.ma_de=q.ma_de AND i.source_version=b.cap_nhat_luc
    WHERE q.qid=?2 AND q.version=json_extract(?6,'$.version') AND q.content_group=json_extract(?6,'$.group') AND COALESCE(b.da_xoa,0)=0)`

/** Chỉ sổ đã chấm mới là lần làm. HTK phải khớp receipt riêng; game/ôn phải có version do máy chủ gắn.
 *  Không cộng riêng receipt rồi cộng lại chính dòng ledger của receipt ấy. */
function bangChungTuSo(lan: readonly DongSo[], kiem: readonly DongKiem[], docs: readonly { qid: string; luc: string }[], roots: Set<string>, version: string, group: string, gioDoc: number): BangChungBanHoiThay[] {
  const theoPhien = new Map(kiem.map(k => [k.id, k])), mocDoc = docs.map(d => ({ qid: d.qid, luc: Date.parse(d.luc) }))
  const ra: BangChungBanHoiThay[] = []
  for (const s of lan) {
    let raw: Record<string, unknown>
    try { raw = JSON.parse(s.raw_json || '{}') } catch { continue }
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) continue
    const luc = Date.parse(s.luc), goc = tachSongSinh(s.qid), tc = typeof raw.tc === 'string' ? qidChuan(raw.tc) : ''
    if (!Number.isFinite(luc) || mocDoc.some(d => Number.isFinite(d.luc) && d.luc <= luc && luc - d.luc < gioDoc * 3_600_000
      && (roots.has(qidChuan(d.qid)) || d.qid === s.qid))) continue
    let khoa = '', laBanKhac = false
    if (raw.hoiThayKiem === true || s.qid.startsWith('hk:')) {
      const k = typeof raw.phienId === 'string' ? theoPhien.get(raw.phienId) : undefined
      if (!k || k.version_goc !== version || k.nhom_goc !== group || k.qid_kiem !== s.qid || k.version_kiem !== raw.ht_cau_version
        || k.qid_goc !== tc || !roots.has(tc) || k.assistance !== 'none' || k.dung !== s.ket_qua || k.nop_luc !== luc
        || s.nguon !== 'chua_loi' || s.ma_nguon !== `hoi_thay_kiem:${k.id}` || s.attempt_id !== k.id) continue
      khoa = `kiem:${k.khoa_noi_dung}`
      laBanKhac = true
    } else {
      if (raw.ht_cau_version !== version || !roots.has(goc.goc) || (tc && !roots.has(tc))) continue
      khoa = goc.songSinh === null ? `goc:${group}:${version}` : `ban:${s.qid.replace(/#\d+$/, '')}`
      laBanKhac = goc.songSinh !== null
    }
    ra.push({ version_goc: version, nhom_goc: group, dung: s.ket_qua, assistance: 'none', nop_luc: luc, khoa_noi_dung: khoa, laBanKhac })
  }
  return ra
}

/** Chỉ gọi ở mở/nộp kiểm chứng toàn bài sau khi receipt đã ghi bền. Lỗi D1 ném ra để caller giữ receipt và báo thử lại.
 *  Không gọi ở banner/Hôm nay. Mọi trạng thái đóng là projection của replay chung (2 ngày, độ trễ, biến thể theo luật đang áp dụng).
 *  Các UPDATE cùng giao dịch, CAS revision; sai xen trước transaction chặn đóng, sai sau commit tạo đợt mới qua trigger có sẵn. */
export async function dongBoSuaLoiHoiThay(env: Env, sbd: string, qidVao: string, nowMs: number): Promise<KetQuaDongBoSuaHoiThay> {
  const qid = qidChuan(qidVao), khong = { daXacNhan: false, soDotDong: 0, soYeuCauDong: 0 }
  if (!qid || !sbd || qid.length > 120) return khong
  // Ảnh chụp trước replay: watermark của CHÍNH câu và revision của các projection cần cập nhật.
  const luatP = docLuatChua(env, sbd)
  const docP = env.DB.batch<{ so?: number; doc?: number; source_version?: string; source_group?: string; roots_json?: string } & DongRevision & DongKiem & DongSo>([
    env.DB.prepare(`${ROOTS} SELECT
      COALESCE((SELECT MAX(s.rowid) FROM su_kien_hoc s WHERE s.sbd=?1 AND ${CAU_SO}),0) so,
      COALESCE((SELECT MAX(rowid) FROM loi_giai_hoi WHERE sbd=?1 AND ${MARK}),0) doc,
      (SELECT version FROM game_v2_question WHERE qid=?2 LIMIT 1) source_version,
      (SELECT content_group FROM game_v2_question WHERE qid=?2 LIMIT 1) source_group,
      (SELECT json_group_array(qid) FROM roots) roots_json`).bind(sbd, qid),
    env.DB.prepare(`${ROOTS} SELECT id,revision FROM chua_loi_dot WHERE sbd=?1 AND ${CAU_DOT} AND dong_luc IS NULL`).bind(sbd, qid),
    env.DB.prepare(`${ROOTS} SELECT qid,revision FROM hoi_thay_can_giup WHERE sbd=?1 AND qid IN(SELECT qid FROM roots) AND trang_thai IN('can_thay','da_ho_tro')`).bind(sbd, qid),
    env.DB.prepare(`${ROOTS} SELECT id,qid_goc,qid_kiem,version_kiem,version_goc,nhom_goc,dung,assistance,nop_luc,khoa_noi_dung FROM hoi_thay_kiem
      WHERE sbd=?1 AND qid_goc IN(SELECT qid FROM roots) AND trang_thai='da_nop' AND nop_luc<=?3 ORDER BY phat_luc DESC LIMIT 64`).bind(sbd, qid, nowMs),
    env.DB.prepare(`${ROOTS} SELECT s.qid,s.ket_qua,s.luc,s.assistance,s.nguon,s.ma_nguon,s.attempt_id,s.raw_json FROM su_kien_hoc s
      WHERE s.sbd=?1 AND ${CAU_SO} AND ${LAN_HOP_LE} AND s.ket_qua IN(0,1) AND julianday(s.luc)<=julianday(?3) ORDER BY s.luc DESC LIMIT 256`).bind(sbd, qid, new Date(nowMs).toISOString()),
    env.DB.prepare(`${ROOTS} SELECT qid,luc FROM loi_giai_hoi WHERE sbd=?1 AND ${MARK} AND luc>='2026-09-29' AND julianday(luc)<=julianday(?3)`).bind(sbd, qid, new Date(nowMs).toISOString()),
  ])
  const [[moc, dots, helps, kiem, lan, docs], ts] = await Promise.all([docP, luatP])
  const m = moc.results[0], version = m?.source_version ?? '', group = m?.source_group ?? ''
  const roots = new Set<string>(JSON.parse(m?.roots_json || '[]'))
  const bangChung = bangChungTuSo(lan.results, kiem.results, docs.results, roots, version, group, ts.gioDocLoiGiai)
  // Phần lớn lần nộp mới chỉ một ngày: không phát lại sổ lỗi khi điều kiện tối thiểu còn thiếu.
  if (!version || !group || !duBangChungBanHienTai(bangChung, version, group, 0, false)) return khong
  const dau = await docTrangThaiLoiDau(env, sbd, qid, ngayVn(nowMs), ts)
  if (dau && !['dong', 'duy_tri'].includes(dau.loiHoc.trangThai)) return khong
  const saiCuoi = dau?.saiCuoiLuc ?? 0
  if (!duBangChungBanHienTai(bangChung, version, group, saiCuoi, !dau)) return khong
  // Luật chung miễn song sinh nếu không có; nếu đã cần song sinh, phải có bản khác của phiên bản HIỆN TẠI sau sai cuối.
  if (dau?.loiHoc.daDungSongSinh && !bangChung.some(b => b.dung === 1 && b.laBanKhac && (b.nop_luc ?? 0) > saiCuoi)) return khong
  const tham = [sbd, qid, Number(m?.so) || 0, Number(m?.doc) || 0, new Date(dau?.saiCuoiLuc ?? 0).toISOString(), JSON.stringify({ version, group })]
  const lenh = (dau ? dots.results : []).map(d => env.DB.prepare(`UPDATE chua_loi_dot
    SET trang_thai_day='da_tu_sua',dong_luc=?7,revision=revision+1,cap_nhat_luc=?7
    WHERE id=?8 AND sbd=?1 AND revision=?9 AND dong_luc IS NULL AND id IN(
      ${ROOTS} SELECT id FROM chua_loi_dot WHERE id=?8 AND sbd=?1 AND ${CAU_DOT} AND ${GUARD})`)
    .bind(...tham, nowMs, d.id, d.revision))
  const soDot = lenh.length
  for (const h of dau ? helps.results : []) lenh.push(env.DB.prepare(`UPDATE hoi_thay_can_giup
    SET trang_thai='da_xac_nhan',revision=revision+1,cap_nhat_luc=?7
    WHERE sbd=?1 AND qid=?8 AND revision=?9 AND trang_thai IN('can_thay','da_ho_tro') AND EXISTS(
      ${ROOTS} SELECT 1 WHERE ${GUARD}
        AND NOT EXISTS(SELECT 1 FROM chua_loi_dot WHERE sbd=?1 AND ${CAU_DOT} AND dong_luc IS NULL))`)
    .bind(...tham, nowMs, h.qid, h.revision))
  const soHelp = lenh.length - soDot
  // Ôn chung cũng khép được lịch kiểm đặc biệt. Chỉ dọn hạn của đúng bản nguồn hiện tại; lịch duy trì chung không đổi.
  lenh.push(env.DB.prepare(`UPDATE hoi_thay_kiem SET den_han=NULL,revision=revision+1
    WHERE sbd=?1 AND trang_thai='da_nop' AND den_han IS NOT NULL
      AND version_goc=json_extract(?6,'$.version') AND nhom_goc=json_extract(?6,'$.group')
      AND qid_goc IN(${ROOTS} SELECT qid FROM roots)
      AND EXISTS(${ROOTS} SELECT 1 WHERE ${GUARD}
        AND NOT EXISTS(SELECT 1 FROM chua_loi_dot WHERE sbd=?1 AND ${CAU_DOT} AND dong_luc IS NULL))`).bind(...tham))
  lenh.push(env.DB.prepare(`${ROOTS} SELECT CASE WHEN ${GUARD}
    AND NOT EXISTS(SELECT 1 FROM chua_loi_dot WHERE sbd=?1 AND ${CAU_DOT} AND dong_luc IS NULL)
    THEN 1 ELSE 0 END hop_le`).bind(...tham))
  const kq = await env.DB.batch<{ hop_le?: number }>(lenh)
  const soDotDong = kq.slice(0, soDot).reduce((s, r) => s + (r.meta.changes || 0), 0)
  const soYeuCauDong = kq.slice(soDot, soDot + soHelp).reduce((s, r) => s + (r.meta.changes || 0), 0)
  if (soDotDong || soYeuCauDong || kq.at(-2)?.meta.changes) emCoGhi(sbd)
  return { daXacNhan: Number(kq.at(-1)?.results[0]?.hop_le) === 1, soDotDong, soYeuCauDong }
}
