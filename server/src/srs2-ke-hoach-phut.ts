// KẾ HOẠCH CHIẾN DỊCH THEO PHÚT — lớp nối giữa ngân sách ngày CNH-1.0 và SRS2/OMNI.
// Không thay bảng/kế hoạch cũ: nơi gọi truyền `nganSachPhut` vào lõi thuần; snapshot chỉ-thêm để giải thích/audit.
import { PHUT_NGAY_MAC_DINH } from './ho-so-cau-hinh'
import type { Env } from './kieu'
import { docMauTocDo, docNganSachConLai } from './ngan-sach-luot'
import { mucDoSo } from './omni-toc-do'
import { chayDdlMotLan } from './ddl-mot-lan'
import { bam, laNo, type CauSrs, type KeHoachNgay, type TrangThaiCau, type TuyChonKeHoach } from './srs2-loi'
import { uocLuongChuaLoi, uocLuongMotCau } from './uoc-luong-thoi-gian'

export const PHIEN_BAN_KE_HOACH_PHUT = 'srs2-minute-plan-v1.0'
export const KHOA_KE_HOACH_PHUT = 'chien_dich_phut_v1'
export const GIAY_MAC_DINH_KE_HOACH_PHUT = 120

/** `active`/`bat` hoặc JSON `{ "mode":"active" }`. Vắng/tắt ⇒ giữ nguyên đường cũ, là cổng rollback. */
export function docCoKeHoachPhut(v: unknown): boolean {
  const s = String(v ?? '').trim()
  if (s === 'active' || s === 'bat') return true
  try {
    const o = JSON.parse(s) as { mode?: unknown; bat?: unknown }
    return o.mode === 'active' || o.bat === true
  } catch { return false }
}

/**
 * Dự báo đầy đủ từng câu (giải + phản hồi; câu nợ cộng bài mẫu), dùng ngân sách CHUNG còn lại của ngày.
 * Chưa có `ke_hoach_ngay` ⇒ 20 phút mặc định; chưa đủ mẫu ⇒ bộ ước lượng dùng factor=1 và vẫn hữu hạn.
 */
export async function taoNganSachPhutChoChienDich(
  env: Env,
  sbd: string,
  ngay: string,
  nowMs: number,
  cau: readonly CauSrs[],
  trangThai: ReadonlyMap<string, TrangThaiCau>,
): Promise<NonNullable<TuyChonKeHoach['nganSachPhut']>> {
  const ns = await docNganSachConLai(env, sbd, ngay).catch(() => null)
  const mau = ns?.mau ?? await docMauTocDo(env, sbd, ngay).catch(() => [])
  const giayTheoQid: Record<string, number> = {}
  for (const c of cau) {
    const dv = { qid: c.qid, part: c.phan, difficulty: mucDoSo(c.mucDo) }
    const tt = trangThai.get(c.qid)
    const uoc = tt && laNo(tt)
      ? uocLuongChuaLoi(dv, { mau, nowMs, coBaiMau: true })
      : uocLuongMotCau(dv, { mau, nowMs })
    giayTheoQid[c.qid] = Math.max(1, Math.ceil(uoc.taskSeconds))
  }
  return {
    phienBan: PHIEN_BAN_KE_HOACH_PHUT,
    giayToiDa: ns ? Math.max(0, Math.floor(ns.conLaiGiay)) : PHUT_NGAY_MAC_DINH * 60,
    giayMacDinh: GIAY_MAC_DINH_KE_HOACH_PHUT,
    giayTheoQid,
  }
}

export const LENH_TAO_BANG_KE_HOACH_PHUT = `CREATE TABLE IF NOT EXISTS srs2_ke_hoach_phut (
  sbd TEXT NOT NULL, ngay TEXT NOT NULL, phien_ban TEXT NOT NULL, nguon_hash TEXT NOT NULL,
  chien_dich_json TEXT NOT NULL, ngan_sach_giay INTEGER NOT NULL, du_kien_giay INTEGER NOT NULL,
  hoan_cau INTEGER NOT NULL, qua_tai_giay INTEGER NOT NULL, muc_json TEXT NOT NULL,
  trang_thai TEXT NOT NULL, tao_luc TEXT NOT NULL, cap_nhat_luc TEXT NOT NULL,
  PRIMARY KEY (sbd, ngay)
)`

/** Snapshot không chứa đáp án; một dòng/em/ngày để màn giáo viên giải thích và rollback/đối chiếu. */
export async function ghiSnapshotKeHoachPhut(
  env: Env,
  sbd: string,
  ngay: string,
  chienDich: readonly string[],
  tc: TuyChonKeHoach,
  lap: Pick<KeHoachNgay, 'dao' | 'doan' | 'nganSachPhut'>,
  nowMs: number,
  trangThai = 'chot',
): Promise<void> {
  if (!tc.nganSachPhut || !lap.nganSachPhut) return
  await chayDdlMotLan(env, 'srs2_ke_hoach_phut', [LENH_TAO_BANG_KE_HOACH_PHUT])
  const qids = [...new Set([...lap.doan, ...lap.dao])]
  const muc = qids.map((qid, i) => ({ qid, thuTu: i + 1, giayDuKien: tc.nganSachPhut!.giayTheoQid[qid] ?? tc.nganSachPhut!.giayMacDinh }))
  const nguonHash = String(bam(`${tc.nganSachPhut.phienBan}|${[...chienDich].sort().join(',')}|${qids.join(',')}`))
  const luc = new Date(nowMs).toISOString()
  await env.DB.prepare(`INSERT INTO srs2_ke_hoach_phut
    (sbd, ngay, phien_ban, nguon_hash, chien_dich_json, ngan_sach_giay, du_kien_giay, hoan_cau, qua_tai_giay, muc_json, trang_thai, tao_luc, cap_nhat_luc)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
    ON CONFLICT(sbd, ngay) DO UPDATE SET phien_ban = excluded.phien_ban, nguon_hash = excluded.nguon_hash,
      chien_dich_json = excluded.chien_dich_json, ngan_sach_giay = excluded.ngan_sach_giay,
      du_kien_giay = excluded.du_kien_giay, hoan_cau = excluded.hoan_cau, qua_tai_giay = excluded.qua_tai_giay,
      muc_json = excluded.muc_json, trang_thai = excluded.trang_thai, cap_nhat_luc = excluded.cap_nhat_luc`)
    .bind(
      sbd, ngay, tc.nganSachPhut.phienBan, nguonHash, JSON.stringify([...chienDich]),
      lap.nganSachPhut.nganSachGiay, lap.nganSachPhut.duKienGiay, lap.nganSachPhut.hoanCau,
      lap.nganSachPhut.quaTaiGiay, JSON.stringify(muc), trangThai, luc, luc,
    ).run()
}
