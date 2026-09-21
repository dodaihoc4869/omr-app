// @vitest-environment node
// DỰNG LẠI HỒ SƠ CHỈ GHI PHẦN ĐỔI (hạ tải D1, Boss 21/09): bản cũ xoá toàn bộ hồ sơ của em rồi chèn lại (~900 dòng ghi mỗi lượt nộp). Bản mới đọc, so từng dòng, chỉ INSERT OR REPLACE dòng mới/đổi và DELETE dòng biến mất.
// Kết quả cuối phải GIỐNG HỆT bản dựng đầy đủ; dòng y nguyên không bị đụng.
import { describe, expect, it } from 'vitest'
import { dungLaiHoSo } from '../server/src/ho-so-nam-kt'
import { ghiSuKien } from '../server/src/su-kien-hoc'
import { taoD1That, type D1That } from './_d1-that'

const N1 = '2026-09-22T01:00:00.000Z', N2 = '2026-09-22T02:00:00.000Z', N3 = '2026-09-22T03:00:00.000Z'
const luc = (h: number, d = 20) => `2026-09-${d}T${String(h).padStart(2, '0')}:00:00.000Z`
function truong(): D1That { const d = taoD1That(); for (const s of ['S1', 'S2']) d.sql.prepare("INSERT OR IGNORE INTO hoc_sinh(sbd,ho_ten,cap_nhat_luc) VALUES(?,?,'x')").run(s, s); return d }
let lan = 0
const sk = (sbd: string, qid: string, kq: 0 | 1, gio: number, dang = 'A.1', d = 20) => ({ nguon: 'on_lai' as const, maNguon: `m${d}`, sbd, qid, lan: ++lan, ketQua: kq, luc: luc(gio, d), maDang: dang, chuyenDe: 'CD1', giay: 30 })
const NOI_DUNG_CAU = 'SELECT khoa, sbd, qid, ma_dang, chuyen_de, lan_gap, lan_sai, lan_trong, dung_lien_tiep, ngay_dung_khac_nhau, ket_qua_cuoi, nguon_cuoi, luc_cuoi, moc_on_ke, trang_thai, can_day_lai, giay_tb FROM nam_kt_cau ORDER BY khoa'
const NOI_DUNG_DANG = 'SELECT khoa, sbd, ma_dang, so_gap, so_sai, so_da_khac_phuc, so_moi_sai, so_chua_thay_sai, bac, moc_on_ke, moc_moi_sai FROM nam_kt_dang ORDER BY khoa'
const chup = (d: D1That) => ({ cau: d.sql.prepare(NOI_DUNG_CAU).all(), dang: d.sql.prepare(NOI_DUNG_DANG).all() })
const lucCauDang = (d: D1That) => ({ cau: Object.fromEntries((d.sql.prepare('SELECT khoa, cap_nhat_luc FROM nam_kt_cau').all() as { khoa: string; cap_nhat_luc: string }[]).map((x) => [x.khoa, x.cap_nhat_luc])), dang: Object.fromEntries((d.sql.prepare('SELECT khoa, cap_nhat_luc FROM nam_kt_dang').all() as { khoa: string; cap_nhat_luc: string }[]).map((x) => [x.khoa, x.cap_nhat_luc])) })
function demGhi(d: D1That): { ghi: () => number; xoa: () => void } {
  let g = 0; const goc = d.env.DB.prepare.bind(d.env.DB)
  d.env.DB.prepare = ((q: string) => { if (/^\s*(INSERT|UPDATE|DELETE|REPLACE)/i.test(q)) g++; return goc(q) }) as typeof d.env.DB.prepare
  return { ghi: () => g, xoa: () => { g = 0 } }
}
const nhieuSk = () => [
  ...['Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6'].map((q, i) => sk('S1', q, (i % 2) as 0 | 1, 8 + i, i < 4 ? 'A.1' : 'B.2')),
  sk('S1', 'Q1', 1, 9, 'A.1', 21), sk('S1', 'Q2', 0, 10, 'A.1', 21), sk('S2', 'Q1', 0, 9), sk('S2', 'Q7', 1, 10, 'B.2'),
]

describe('dungLaiHoSo · chỉ ghi phần đổi', () => {
  it('lần đầu dựng đủ; dựng lại KHÔNG có gì đổi ⇒ KHÔNG câu ghi nào và không đổi cap_nhat_luc của dòng nào', async () => {
    const d = truong(); await ghiSuKien(d.env, nhieuSk())
    const r = await dungLaiHoSo(d.env, ['S1', 'S2'], N1)
    expect(r).toMatchObject({ soEm: 2, soCau: 8 }); expect(r.soDang).toBeGreaterThan(0)
    const truoc = chup(d), luc1 = lucCauDang(d); const c = demGhi(d)
    const r2 = await dungLaiHoSo(d.env, ['S1', 'S2'], N2)
    expect(r2).toEqual(r); expect(c.ghi()).toBe(0); expect(chup(d)).toEqual(truoc); expect(lucCauDang(d)).toEqual(luc1)
  })
  it('em nộp thêm MỘT câu: chỉ dòng của câu ấy và dòng dạng của nó được ghi; dòng khác giữ nguyên cap_nhat_luc; em khác không bị đụng', async () => {
    const d = truong(); await ghiSuKien(d.env, nhieuSk()); await dungLaiHoSo(d.env, ['S1', 'S2'], N1)
    const luc1 = lucCauDang(d)
    await ghiSuKien(d.env, [sk('S1', 'Q3', 1, 11, 'A.1', 22)])
    const c = demGhi(d); await dungLaiHoSo(d.env, ['S1'], N2)
    expect(c.ghi()).toBeLessThanOrEqual(2)                                       // MỘT lô câu + MỘT lô dạng (mỗi lô chỉ chứa dòng đổi)
    const luc2 = lucCauDang(d)
    expect(luc2.cau['S1|Q3']).toBe(N2); for (const k of Object.keys(luc1.cau)) if (k !== 'S1|Q3') expect(luc2.cau[k], k).toBe(luc1.cau[k])
    expect(luc2.dang['S1|A.1']).toBe(N2); expect(luc2.dang['S1|B.2']).toBe(luc1.dang['S1|B.2']); expect(luc2.dang['S2|A.1']).toBe(luc1.dang['S2|A.1'])
  })
  it('KẾT QUẢ CUỐI giống hệt bản dựng đầy đủ: dựng dần qua nhiều đợt sổ == dựng một lần từ đầu (mọi cột trừ cap_nhat_luc)', async () => {
    const dan = truong(), day = truong(); const tat = nhieuSk(); const them = [sk('S1', 'Q3', 1, 11, 'A.1', 22), sk('S1', 'Q8', 0, 12, 'B.2', 22), sk('S2', 'Q1', 1, 13, 'A.1', 22), sk('S1', 'Q4', 0, 14, 'A.1', 23)]
    await ghiSuKien(dan.env, tat); await dungLaiHoSo(dan.env, ['S1', 'S2'], N1)
    await ghiSuKien(dan.env, them.slice(0, 2)); await dungLaiHoSo(dan.env, ['S1', 'S2'], N2)
    await ghiSuKien(dan.env, them.slice(2)); await dungLaiHoSo(dan.env, ['S1', 'S2'], N3)
    await ghiSuKien(day.env, [...tat, ...them]); await dungLaiHoSo(day.env, ['S1', 'S2'], N3)
    expect(chup(dan)).toEqual(chup(day))
  })
  it('dòng biến mất khỏi sổ thì bị xoá khỏi hồ sơ; dạng không còn câu nào cũng bị xoá', async () => {
    const d = truong(); await ghiSuKien(d.env, nhieuSk()); await dungLaiHoSo(d.env, ['S1', 'S2'], N1)
    expect(d.sql.prepare("SELECT COUNT(*) n FROM nam_kt_cau WHERE khoa='S1|Q5'").get()).toEqual({ n: 1 })
    d.sql.prepare("DELETE FROM su_kien_hoc WHERE sbd='S1' AND qid IN ('Q5','Q6')").run()   // hai câu duy nhất của dạng B.2
    await dungLaiHoSo(d.env, ['S1'], N2)
    expect(d.sql.prepare("SELECT COUNT(*) n FROM nam_kt_cau WHERE sbd='S1' AND qid IN ('Q5','Q6')").get()).toEqual({ n: 0 })
    expect(d.sql.prepare("SELECT COUNT(*) n FROM nam_kt_dang WHERE khoa='S1|B.2'").get()).toEqual({ n: 0 })
    expect(d.sql.prepare("SELECT COUNT(*) n FROM nam_kt_cau WHERE sbd='S2'").get()).toEqual({ n: 2 })   // em khác nguyên vẹn
  })
  it('hồ sơ hỏng / lệch trong D1 (ai đó sửa tay) được SỬA lại đúng theo sổ; dòng thừa không thuộc sổ bị xoá', async () => {
    const d = truong(); await ghiSuKien(d.env, nhieuSk()); await dungLaiHoSo(d.env, ['S1', 'S2'], N1); const chuan = chup(d)
    d.sql.prepare("UPDATE nam_kt_cau SET lan_sai = 99, trang_thai = 'x' WHERE khoa = 'S1|Q2'").run()
    d.sql.prepare("INSERT INTO nam_kt_cau(khoa,sbd,qid,ma_dang,chuyen_de,lan_gap,lan_sai,lan_trong,dung_lien_tiep,ngay_dung_khac_nhau,ket_qua_cuoi,nguon_cuoi,luc_cuoi,moc_on_ke,trang_thai,can_day_lai,giay_tb,cap_nhat_luc) VALUES('S1|THUA','S1','THUA','A.1','',1,0,0,1,1,1,'x','2026-09-20T00:00:00.000Z',NULL,'da_nam',0,NULL,'x')").run()
    await dungLaiHoSo(d.env, ['S1'], N2); expect(chup(d)).toEqual(chuan)
  })
  it('danh sách rỗng ⇒ không truy vấn ghi, kết quả 0', async () => {
    const d = truong(); const c = demGhi(d)
    expect(await dungLaiHoSo(d.env, [], N1)).toEqual({ soEm: 0, soCau: 0, soDang: 0, cauKhongDang: 0 }); expect(c.ghi()).toBe(0)
  })
})
