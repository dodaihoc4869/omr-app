// KHO CỠ THẬT DÙNG CHUNG (tách từ tests/do-tai-nong-3010.test.ts, 31/10) — không phải tệp test.
// Dùng ở: tests/do-tai-nong-3010.test.ts (đo chi phí D1 từng lệnh nóng) và scripts/thu-tai-50k/sinh-kho.ts (dựng D1 thử tải `omr-thu`, dữ liệu GIẢ hoàn toàn).
// Mặc định (không truyền tuỳ chọn mới) sinh ĐÚNG dữ liệu như bản cũ trong test: cùng thứ tự gọi bộ ngẫu nhiên ⇒ cùng kết quả đo.
import { taoKhoOmni, type KhoOmni } from './omni-3-ke-hoach-chung'
import { SQL_BANG_HANH_TRINH } from '../server/src/hanh-trinh-hop-nhat'
import { SQL_SAN_SANG } from '../server/src/san-sang'

export interface TuyChonKhoLon {
  /** Mốc «bây giờ» (ms): lịch sử trải 60 ngày TRƯỚC mốc này. */
  now: number
  soDe?: number
  cauMoiDe?: number
  /** Số em CÓ lịch sử (S1–S3 + E4…). */
  soEm?: number
  skMoiEm?: number
  /** `soEmNang` em đầu tiên có `skNang` sự kiện (em «nặng»); mặc định 0 = như cũ. */
  soEmNang?: number
  skNang?: number
  /** Tổng số em trong `hoc_sinh` (em từ soEm+1 tới soEmTong KHÔNG có lịch sử — em mới). Mặc định = soEm. */
  soEmTong?: number
  /** Gọi sau mỗi `moiBao` em (in tiến độ khi dựng kho lớn). */
  baoTienDo?: (e: number) => void
}

/** SBD giả của em thứ e (1-based): S1–S3 là em của kho omni (có sẵn), còn lại E<e>. */
export const sbdThu = (e: number): string => (e <= 3 ? `S${e}` : `E${e}`)

export function napKhoLon(t: TuyChonKhoLon): { k: KhoOmni; qall: string[] } {
  const NOW = t.now
  const SO_DE = t.soDe ?? 120, CAU_MOI_DE = t.cauMoiDe ?? 25, SO_EM = t.soEm ?? 300, SK_MOI_EM = t.skMoiEm ?? 1500
  const SO_EM_NANG = t.soEmNang ?? 0, SK_NANG = t.skNang ?? SK_MOI_EM, SO_EM_TONG = Math.max(SO_EM, t.soEmTong ?? SO_EM)
  const so: Record<string, number> = { 'DH-B8': 24 }
  for (let i = 0; i < SO_DE; i++) so[`DH-X${i}`] = CAU_MOI_DE
  const k = taoKhoOmni(so, 3)
  for (const q of SQL_BANG_HANH_TRINH) k.d.sql.exec(q)
  for (const q of SQL_SAN_SANG) k.d.sql.exec(q)
  k.d.sql.exec('CREATE TABLE IF NOT EXISTS chien_dich_em (chien_dich_id TEXT NOT NULL, sbd TEXT NOT NULL, them_luc TEXT, bot_luc TEXT, PRIMARY KEY (chien_dich_id, sbd))')
  const sql = k.d.sql
  sql.exec(`UPDATE hoc_sinh SET lop='12', ten_lop=NULL, mat_khau='mk'`)
  const de = sql.prepare('INSERT OR IGNORE INTO de_kho(ma_de,ten_de,so_cau,da_xoa,cap_nhat_luc) VALUES(?,?,?,0,?)')
  const ix = sql.prepare('INSERT OR IGNORE INTO game_v2_index(ma_de,source_version,indexed_at) VALUES(?,?,?)')
  for (const maDe of Object.keys(so)) { de.run(maDe, maDe === 'DH-B8' ? 'Bài 8. Amine' : `Đề ${maDe}`, so[maDe]!, 'v1'); ix.run(maDe, 'v1', 'x') }
  sql.exec(`INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('goi_bai_7_v1','{"bat":true,"batDau":"2026-10-10"}','x')`)
  // Lịch sử cỡ thật: SO_EM em, mỗi em SK_MOI_EM sự kiện trải 60 ngày (game 60 % · chua_loi 20 % · thi 10 % · tu_luyen 10 %).
  const qall: string[] = []
  for (const maDe of Object.keys(so)) qall.push(...k.qids(maDe))
  const em = sql.prepare("INSERT OR IGNORE INTO hoc_sinh(sbd,ho_ten,lop,cap_nhat_luc,mat_khau) VALUES(?,?,'12','x','mk')")
  const sk = sql.prepare(`INSERT INTO su_kien_hoc(khoa,sbd,qid,nguon,ma_nguon,lan,ket_qua,giay,luc,ngay_vn,ma_dang,chuyen_de,muc_do,attempt_id,assistance,visibility,purpose,raw_json,received_at)
    VALUES(?,?,?,?,?,1,?,?,?,?,?,NULL,NULL,?,?,NULL,NULL,?,?)`)
  const at = sql.prepare('INSERT INTO game_v2_attempt(id,sbd,session,qid,content_group,json,created_at) VALUES(?,?,?,?,?,?,?)')
  let seed = 7
  const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648 }
  sql.exec('BEGIN')
  for (let e = 1; e <= SO_EM; e++) {
    const sbd = sbdThu(e)
    if (e > 3) em.run(sbd, `Em ${e}`)
    const soSk = e <= SO_EM_NANG ? SK_NANG : SK_MOI_EM
    for (let j = 0; j < soSk; j++) {
      const qid = qall[Math.floor(rnd() * qall.length)]!
      const t = NOW - Math.floor(rnd() * 60 * 86_400_000) - 86_400_000
      const luc = new Date(t).toISOString(), ngay = new Date(t + 7 * 3_600_000).toISOString().slice(0, 10)
      const r = rnd(), nguon = r < 0.6 ? 'game' : r < 0.8 ? 'chua_loi' : r < 0.9 ? 'thi' : 'tu_luyen'
      const id = `a-${sbd}-${j}`
      sk.run(`k-${sbd}-${j}`, sbd, qid, nguon, nguon === 'game' ? `ss-${sbd}-${j >> 3}` : `m-${j}`, rnd() < 0.7 ? 1 : 0, 20 + Math.floor(rnd() * 90), luc, ngay, `${qid.split('-').slice(0, 2).join('-')}.D${j % 3}`, id, 'tu_lam', JSON.stringify({ tc: 1, tt: 'x', ll: 0 }), t)
      if (nguon === 'game') at.run(id, sbd, `ss-${sbd}-${j >> 3}`, qid, `g-${qid}`, JSON.stringify({ traLoi: 'A', at: luc }), luc)
    }
    if (t.baoTienDo && e % 500 === 0) t.baoTienDo(e)
  }
  // Em mới (chưa có lịch sử): chỉ có dòng hồ sơ.
  for (let e = SO_EM + 1; e <= SO_EM_TONG; e++) em.run(sbdThu(e), `Em ${e}`)
  sql.exec('COMMIT')
  sql.prepare('INSERT INTO bai_da_day(id,lop,khoa_bai,ten_bai,vi_tri,ma_to_json,tick_luc) VALUES(?,?,?,?,?,?,?)')
    .run('amine', '12 - Lớp Thường', 'B8', 'Bài 8. Amine', 8, '["DH-B8"]', '2026-10-11T11:00:00Z')
  sql.exec('ANALYZE')
  return { k, qall }
}
