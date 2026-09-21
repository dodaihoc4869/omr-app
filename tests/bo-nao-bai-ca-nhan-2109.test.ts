// @vitest-environment node
// BỘ NÃO — thẻ `coBaiCaNhanDangChay` + `soCauConLaiCungDang` (Code 1, 21/09/2026; Boss: "để AI biết hứa được gì" với núm `khac_phuc`), chạy trên SQLite thật (tests/_d1-that.ts).
// Khoá: bài cá nhân hoá ĐANG CHẠY (đã chốt, chưa nộp/thu hồi/xoá, hạn chưa qua, còn chặng sau chặng đang làm); số câu CHƯA GIAO theo dạng × mức = kho − lõi − bộ của em;
// máy chủ lỗi truy vấn ⇒ coi như không có bài (an toàn).
import { afterEach, describe, expect, it, vi } from 'vitest'
import { docBaiCaNhan, boNaoHoSoNgay } from '../server/src/bo-nao'
import { BAY_GIO, dung, giao, maBtvn, mo, gio } from './_btvn-nang-do-mau'
import type { D1That } from './_d1-that'

afterEach(() => vi.useRealTimers())

const NGAY = '2026-09-22'

/** Kho chưa giao theo dạng × mức tính TAY từ D1 (độc lập với truy vấn của máy chủ) cho em `sbd`. */
function chuaGiaoTay(d: D1That, sbd: string): Record<string, [number, number, number]> {
  const kho = d.sql.prepare('SELECT qid, dang, chuyen_de, muc_do, loi FROM btvn_cau').all() as { qid: string; dang: string | null; chuyen_de: string; muc_do: number; loi: number }[]
  const cua = new Set((d.sql.prepare('SELECT qid FROM btvn_em_cau WHERE sbd = ?').all(sbd) as { qid: string }[]).map((r) => r.qid))
  const ra: Record<string, [number, number, number]> = {}
  for (const c of kho) {
    if (c.loi === 1 || cua.has(c.qid)) continue
    const ma = c.dang && c.dang.trim() ? c.dang : `CD:${c.chuyen_de}`
    ;(ra[ma] ??= [0, 0, 0])[Math.max(0, Math.min(2, c.muc_do))]++
  }
  return ra
}

async function dungBai(soEm = 2) {
  gio(BAY_GIO)
  const d = dung(soEm)
  expect((await giao(d)).ok).toBe(true)
  for (let i = 1; i <= soEm; i++) expect((await mo(d, `S${i}`)).ok).toBe(true)
  return d
}

describe('docBaiCaNhan — bài cá nhân hoá đang chạy', () => {
  it('em đã mở bài: dangChay = true (còn ≥ 2 chặng chưa xong) và chuaGiao khớp phép tính tay (kho − lõi − bộ) theo dạng × mức; không có em nào khác', async () => {
    const d = await dungBai(2)
    const kq = await docBaiCaNhan(d.env, ['S1', 'S2', 'S9'], NGAY)
    expect(kq.get('S1')!.dangChay).toBe(true)
    expect(kq.get('S1')!.chuaGiao).toEqual(chuaGiaoTay(d, 'S1'))
    expect(Object.keys(kq.get('S1')!.chuaGiao).length).toBeGreaterThan(0)
    expect(kq.get('S2')!.chuaGiao).toEqual(chuaGiaoTay(d, 'S2'))
    expect(kq.has('S9')).toBe(false)
    // tổng chưa giao + lõi ngoài bộ + bộ = kho: không câu nào bị đếm hai lần hay sót
    const tongChua = Object.values(kq.get('S1')!.chuaGiao).reduce((n, a) => n + a[0] + a[1] + a[2], 0)
    const trongBo = (d.sql.prepare('SELECT COUNT(*) AS n FROM btvn_em_cau WHERE sbd = ?').get('S1') as { n: number }).n
    const loiNgoaiBo = (d.sql.prepare("SELECT COUNT(*) AS n FROM btvn_cau k WHERE k.loi = 1 AND NOT EXISTS (SELECT 1 FROM btvn_em_cau c WHERE c.sbd = 'S1' AND c.qid = k.qid)").get() as { n: number }).n
    expect(tongChua + trongBo + loiNgoaiBo).toBe(24)
  })

  it('câu LÕI không nằm trong `btvn_em_cau` của em (ví dụ "thử sức thêm" bản 1.2 lưu riêng) vẫn KHÔNG được đếm là chưa giao', async () => {
    const d = await dungBai(1)
    const truoc = (await docBaiCaNhan(d.env, ['S1'], NGAY)).get('S1')!.chuaGiao
    d.sql.prepare("DELETE FROM btvn_em_cau WHERE sbd = 'S1' AND qid IN (SELECT qid FROM btvn_cau WHERE loi = 1 LIMIT 3)").run()
    const sau = (await docBaiCaNhan(d.env, ['S1'], NGAY)).get('S1')!.chuaGiao
    expect(sau).toEqual(truoc)
    expect(sau).toEqual(chuaGiaoTay(d, 'S1'))
  })

  it('chưa em nào mở bài (chưa chốt bộ) ⇒ không có em trong bản đồ', async () => {
    gio(BAY_GIO)
    const d = dung(1)
    await giao(d)
    expect((await docBaiCaNhan(d.env, ['S1'], NGAY)).size).toBe(0)
  })

  it('chỉ còn chặng cuối (so_chang − lo_da_xong = 1) ⇒ dangChay = false và không đếm câu chưa giao (khắc phục không còn chặng để chèn)', async () => {
    const d = await dungBai(1)
    d.sql.prepare('UPDATE btvn_em SET lo_da_xong = so_chang - 1').run()
    const kq = await docBaiCaNhan(d.env, ['S1'], NGAY)
    expect(kq.get('S1')).toEqual({ dangChay: false, chuaGiao: {} })
    d.sql.prepare('UPDATE btvn_em SET lo_da_xong = so_chang - 2').run()
    expect((await docBaiCaNhan(d.env, ['S1'], NGAY)).get('S1')!.dangChay).toBe(true) // còn đúng 2 chặng chưa xong ⇒ còn chặng sau chặng đang làm
  })

  it('đã nộp / thu hồi / bài đã xoá / hạn đã qua ⇒ không phải bài đang chạy; không đổi gì ⇒ vẫn đang chạy', async () => {
    const thu = async (sql: string | null, ngay = NGAY) => {
      const d = await dungBai(1)
      if (sql) d.sql.prepare(sql).run(maBtvn(d))
      return (await docBaiCaNhan(d.env, ['S1'], ngay)).has('S1')
    }
    expect(await thu("UPDATE btvn_em SET nop_luc = '2026-09-22T01:00:00.000Z' WHERE ma_btvn = ?")).toBe(false)
    expect(await thu('UPDATE btvn_em SET thu_hoi = 1 WHERE ma_btvn = ?')).toBe(false)
    expect(await thu('UPDATE btvn SET da_xoa = 1 WHERE ma_btvn = ?')).toBe(false)
    expect(await thu(null, '2026-10-15')).toBe(false) // hạn 29/09 đã qua so với ngày chạy 15/10
    expect(await thu(null)).toBe(true)
  })

  it('máy chủ lỗi truy vấn (thiếu bảng) ⇒ bản đồ RỖNG, không ném lỗi (an toàn: AI không được dùng khac_phuc)', async () => {
    const d = await dungBai(1)
    d.sql.exec('DROP TABLE btvn_em_cau')
    const kq = await docBaiCaNhan(d.env, ['S1'], NGAY)
    expect(kq.size).toBe(0)
  })
})

describe('thẻ ngày của em (POST /ai/ho-so-ngay)', () => {
  const themEm = (d: D1That, sbd: string) => {
    d.sql.exec(`INSERT OR REPLACE INTO hoc_sinh (sbd, ho_ten, lop, trang_thai, cap_nhat_luc) VALUES ('${sbd}', 'Em ${sbd}', '12A1', 'dang_hoc', '2026-09-01T00:00:00Z')`)
    d.sql.exec(`INSERT INTO su_kien_hoc (khoa, sbd, qid, nguon, ma_nguon, lan, ket_qua, giay, luc, ngay_vn) VALUES ('k-${sbd}', '${sbd}', 'DE1-I-1', 'btvn', 'm', 1, 1, 30, '2026-09-21T02:00:00.000Z', '2026-09-21')`)
    d.sql.exec(
      `INSERT INTO nam_kt_cau (khoa, sbd, qid, ma_dang, chuyen_de, lan_gap, lan_sai, lan_trong, dung_lien_tiep, ngay_dung_khac_nhau, ket_qua_cuoi, nguon_cuoi, luc_cuoi, moc_on_ke, trang_thai, can_day_lai, giay_tb, cap_nhat_luc)
       VALUES ('${sbd}|DE1-I-1', '${sbd}', 'DE1-I-1', 'DA-1', 'Este', 2, 1, 0, 0, 0, 0, 'btvn', '2026-09-21T02:00:00.000Z', '2026-09-22', 'moi_sai', 0, NULL, '2026-09-21T02:00:00.000Z')`,
    )
    d.sql.exec(`INSERT INTO nam_kt_dang (khoa, sbd, ma_dang, so_gap, so_sai, so_da_khac_phuc, so_moi_sai, so_chua_thay_sai, bac, moc_on_ke, moc_moi_sai, cap_nhat_luc) VALUES ('${sbd}|DA-1', '${sbd}', 'DA-1', 6, 1, 1, 0, 4, 1, NULL, NULL, '2026-09-21T00:00:00Z')`)
  }
  it('em có bài đang chạy: thẻ mang coBaiCaNhanDangChay = true và soCauConLaiCungDang chỉ cho dạng của thẻ, dạng [đúng bậc, thấp hơn một bậc]; em không có bài: coBaiCaNhanDangChay = false, không có bản đồ', async () => {
    const d = await dungBai(1)
    themEm(d, 'S1')
    themEm(d, 'S7') // không có bài
    const r = (await boNaoHoSoNgay(d.env, { ngay: NGAY, coTrang: 40 }, BAY_GIO.getTime())) as { ok: boolean; cacEm: { sbd: string; the?: Record<string, unknown> }[] }
    expect(r.ok).toBe(true)
    const the = (sbd: string) => r.cacEm.find((e) => e.sbd === sbd)!.the as Record<string, any>
    expect(the('S1').maDang).toContain('DA-1')
    expect(the('S1').coBaiCaNhanDangChay).toBe(true)
    const cl = the('S1').soCauConLaiCungDang as Record<string, [number, number]>
    for (const ma of Object.keys(cl)) expect(the('S1').maDang).toContain(ma) // chỉ dạng AI được nêu
    const tay = chuaGiaoTay(d, 'S1')['DA-1']
    const bac = the('S1').bacCuaMaDang[the('S1').maDang.indexOf('DA-1')] as 0 | 1 | 2
    expect(cl['DA-1']).toEqual([tay[bac], bac > 0 ? tay[bac - 1] : 0])
    expect(the('S7').coBaiCaNhanDangChay).toBe(false)
    expect(the('S7').soCauConLaiCungDang).toBeUndefined()
    // thẻ đã LƯU cũng có (bộ kiểm ở máy chủ đọc lại đúng thẻ này)
    const luu = JSON.parse((d.sql.prepare("SELECT the_json FROM ai_ho_so_ngay WHERE sbd = 'S1' AND ngay = ?").get(NGAY) as { the_json: string }).the_json)
    expect(luu.coBaiCaNhanDangChay).toBe(true)
  })
})
