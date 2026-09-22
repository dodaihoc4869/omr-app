// @vitest-environment node
// MỘT ĐỊNH NGHĨA "câu đã làm hôm nay" (server/src/cau-da-lam.ts; đề bài prompt-mot-dinh-nghia-cau-da-lam-2109.md): DISTINCT qid, đã trả lời (ket_qua NOT NULL), mọi nguồn, luc ≥ MAX(mốc, 00:00 hôm nay VN).
// Khoá: hàm cận dưới, số theo em + cả lớp + bản thuần cho ra CÙNG con số trên một bộ dữ liệu có đủ các ca khó (câu trước mốc, bỏ trống, làm lại 3 lần, hôm qua, hai em cùng câu); `soCauDung` = qid có ≥ 1 lần đúng;
// `/hs/ke-hoach-ngay` thêm `tienBo.soCauHienThi` mà `daLamCau` (luật đạt ngày/EXP/khiên) KHÔNG đổi; kế hoạch vẫn dựng khi đọc lỗi; chỉ mục idx_skh_luc; không UNION. SQLite thật.
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { demCauKhacNhau, docCauDaLamHomNay, SQL_CAU_DA_LAM_CA_LOP, SQL_CAU_DA_LAM_THEO_EM, tuLucHomNay, tuLucTuNgay } from '../server/src/cau-da-lam'
import { lapVaLuuKeHoach, TONG_HOP_EM_NGAY } from '../server/src/ke-hoach-ngay-d1'
import { ghiSuKien } from '../server/src/su-kien-hoc'
import { giaiMocHienThi } from '../server/src/moc-no'
import { taoD1That, type D1That } from './_d1-that'

const VN = (s: string): number => Date.parse(`${s}+07:00`)
const NOW = VN('2026-09-22T15:00:00')
const MOC_ISO = '2026-09-22T05:00:00.000Z' // 12:00 VN hôm nay

/** S1: Q1 trước mốc · Q2 đúng · Q3 sai rồi đúng lại · Q4 sai 3 lần · Q5 bỏ trống · Q6 hôm qua ⇒ hôm nay có 3 câu khác nhau, 2 câu đúng. S2: chỉ có câu TRƯỚC mốc. S3: Q7 đúng rồi sai + Q2 (cùng câu S1) sai. Q2 của S1 đúng hai lần. */
async function dung(): Promise<D1That> {
  const d = taoD1That()
  d.sql.prepare("INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('hien_thi_tu',?,'x')").run(MOC_ISO)
  for (const s of ['S1', 'S2', 'S3']) d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES(?,?,'12','mk','x')").run(s, `Em ${s}`)
  const su = (sbd: string, qid: string, gio: string, ketQua: 0 | 1 | null, ngay = '2026-09-22', nguon: 'on_lai' | 'luyen' | 'btvn' = 'on_lai') =>
    ({ nguon, maNguon: 'm', sbd, qid, lan: 1, ketQua, luc: new Date(VN(`${ngay}T${gio}`)).toISOString() })
  await ghiSuKien(d.env, [
    su('S1', 'Q1', '10:00:00', 1),
    su('S1', 'Q2', '13:00:00', 1), su('S1', 'Q2', '13:50:00', 1, undefined, 'luyen'), // đúng HAI lần: vẫn một câu đúng
    su('S1', 'Q3', '13:10:00', 0), su('S1', 'Q3', '13:20:00', 1, undefined, 'luyen'),
    su('S1', 'Q4', '13:30:00', 0), su('S1', 'Q4', '13:31:00', 0, undefined, 'luyen'), su('S1', 'Q4', '13:32:00', 0, undefined, 'btvn'),
    su('S1', 'Q5', '13:40:00', null),
    su('S1', 'Q6', '20:00:00', 1, '2026-09-21'),
    su('S2', 'Q1', '10:00:00', 1),
    su('S3', 'Q7', '14:00:00', 1), su('S3', 'Q7', '14:10:00', 0, undefined, 'luyen'), su('S3', 'Q2', '14:05:00', 0), // Q7: đúng rồi sai ⇒ vẫn tính là câu CÓ lần đúng
  ])
  return d
}

describe('cận dưới "hôm nay"', () => {
  it('tuLucTuNgay: mốc cũ ⇒ 00:00 hôm nay (17:00Z hôm trước); mốc trong ngày ⇒ giữ mốc; mốc tương lai ⇒ giữ mốc; đúng biên', () => {
    expect(tuLucTuNgay('2026-09-12T05:00:00.000Z', '2026-09-22')).toBe('2026-09-21T17:00:00.000Z')
    expect(tuLucTuNgay(MOC_ISO, '2026-09-22')).toBe(MOC_ISO)
    expect(tuLucTuNgay('2026-09-23T05:00:00.000Z', '2026-09-22')).toBe('2026-09-23T05:00:00.000Z')
    expect(tuLucTuNgay('2026-09-21T17:00:00.000Z', '2026-09-22')).toBe('2026-09-21T17:00:00.000Z')
    expect(tuLucHomNay({ iso: '2026-09-12T05:00:00.000Z' }, NOW)).toBe('2026-09-21T17:00:00.000Z')
  })
})

describe('định nghĩa chuẩn trên MỘT bộ dữ liệu', () => {
  it('theo danh sách em: S1 = 3 câu (2 đúng): trước mốc / bỏ trống / hôm qua không tính, làm lại 3 lần chỉ một; S2 (chỉ câu trước mốc) vắng; S3 = 2 (1 đúng, cùng câu Q2 của S1 vẫn tính cho S3)', async () => {
    const d = await dung()
    const r = (await docCauDaLamHomNay(d.env, ['S1', 'S2', 'S3'], NOW))!
    expect([...r].sort()).toEqual([['S1', { soCau: 3, soCauDung: 2 }], ['S3', { soCau: 2, soCauDung: 1 }]])
    expect(r.has('S2')).toBe(false)
    expect((await docCauDaLamHomNay(d.env, [], NOW))!.size).toBe(0)
  })

  it('cả lớp (chỉ mục idx_skh_luc) + bản thuần trong bộ nhớ cho ĐÚNG cùng con số', async () => {
    const d = await dung()
    const lop = (await d.env.DB.prepare(SQL_CAU_DA_LAM_CA_LOP).bind(tuLucHomNay(giaiMocHienThi(MOC_ISO), NOW), '2026-09-22').all<Record<string, unknown>>()).results ?? []
    expect(lop.map((x) => [x.sbd, Number(x.so_cau), Number(x.so_dung)]).sort()).toEqual([['S1', 3, 2], ['S3', 2, 1]])
    const theoEm = (await d.env.DB.prepare(SQL_CAU_DA_LAM_THEO_EM).bind(JSON.stringify(['S1', 'S2', 'S3']), '2026-09-22', MOC_ISO).all<Record<string, unknown>>()).results ?? []
    expect(theoEm.map((x) => [x.sbd, Number(x.so_cau), Number(x.so_dung)]).sort()).toEqual([['S1', 3, 2], ['S3', 2, 1]])
    const tho = (d.sql.prepare("SELECT sbd, qid, ket_qua, luc FROM su_kien_hoc WHERE ngay_vn = '2026-09-22' AND luc >= ?").all(MOC_ISO) as { sbd: string; qid: string; ket_qua: number | null }[])
      .map((x) => ({ sbd: x.sbd, qid: x.qid, ketQua: (x.ket_qua === null ? null : x.ket_qua === 1 ? 1 : 0) as 0 | 1 | null }))
    expect([...demCauKhacNhau(tho)].sort()).toEqual([['S1', { soCau: 3, soCauDung: 2 }], ['S3', { soCau: 2, soCauDung: 1 }]])
  })

  it('tổng cả lớp = tổng từng em (không cộng theo dạng): qid mang HAI mã dạng trong cùng ngày vẫn chỉ tính MỘT câu', async () => {
    const d = await dung()
    d.sql.prepare("UPDATE su_kien_hoc SET ma_dang = 'D.A' WHERE sbd = 'S1' AND qid = 'Q3' AND nguon = 'on_lai'").run()
    d.sql.prepare("UPDATE su_kien_hoc SET ma_dang = 'D.B' WHERE sbd = 'S1' AND qid = 'Q3' AND nguon = 'luyen'").run()
    expect((d.sql.prepare("SELECT COUNT(DISTINCT ma_dang) AS n FROM su_kien_hoc WHERE sbd = 'S1' AND qid = 'Q3'").get() as { n: number }).n).toBe(2) // đúng tình huống đo được trên D1 thật
    expect((await docCauDaLamHomNay(d.env, ['S1'], NOW))!.get('S1')).toEqual({ soCau: 3, soCauDung: 2 })
  })

  it('đọc lỗi ⇒ null (nơi gọi bỏ khoá hiển thị, không bịa 0) và không ném', async () => {
    const d = await dung()
    const goc = d.env.DB.prepare.bind(d.env.DB)
    d.env.DB.prepare = ((q: string) => { if (q === SQL_CAU_DA_LAM_THEO_EM) throw new Error('hỏng'); return goc(q) }) as typeof d.env.DB.prepare
    expect(await docCauDaLamHomNay(d.env, ['S1'], NOW)).toBeNull()
  })
})

describe('/hs/ke-hoach-ngay: thêm soCauHienThi, giữ daLamCau (luật)', () => {
  it('S1: daLamCau = 5 (qid trong NGÀY kể cả trước mốc và bỏ trống — nuôi luật đạt ngày/EXP) còn soCauHienThi = 3; S2 = 0 (câu trước mốc); S3 = 2', async () => {
    const d = await dung()
    const kh = await lapVaLuuKeHoach(d.env, ['S1', 'S2', 'S3'], NOW)
    expect(kh.get('S1')!.tienBo).toMatchObject({ daLamCau: 5, soCauHienThi: 3 })
    expect(kh.get('S2')!.tienBo).toMatchObject({ daLamCau: 1, soCauHienThi: 0 })
    expect(kh.get('S3')!.tienBo).toMatchObject({ daLamCau: 2, soCauHienThi: 2 })
  })

  it('đọc tổng hợp (tiến bộ + hiển thị + giây) lỗi ⇒ kế hoạch VẪN dựng, về 0/vắng khoá thay vì ném lỗi (không bịa số)', async () => {
    // HẠ TẢI M3 (Boss 22/09): `/hs/ke-hoach-ngay` gộp tiến bộ hôm nay + hiển thị + giây vào MỘT truy vấn (TONG_HOP_EM_NGAY)
    // thay cho 3 truy vấn riêng trước đây (đọc "đếm tổng số dòng sổ + tiến bộ + hiển thị + giây MỘT truy vấn" — lệnh của
    // Boss). Đổi có chủ ý: trước đây lỗi CHỈ ở hiển thị (pHienThi) không đụng daLamCau (pRt là truy vấn khác); nay MỘT
    // truy vấn hỏng thì CẢ HAI về mặc định an toàn (0 / vắng khoá) — kế hoạch vẫn dựng, không ném lỗi ra ngoài.
    const d = await dung()
    const goc = d.env.DB.prepare.bind(d.env.DB)
    d.env.DB.prepare = ((q: string) => { if (q === TONG_HOP_EM_NGAY) throw new Error('hỏng'); return goc(q) }) as typeof d.env.DB.prepare
    const tb = (await lapVaLuuKeHoach(d.env, ['S1'], NOW)).get('S1')!.tienBo
    expect(tb.daLamCau).toBe(0)
    expect(tb).not.toHaveProperty('soCauHienThi')
  })

  it('làm thêm một câu mới ⇒ lần dựng sau tăng đúng 1 (không đệm cũ)', async () => {
    const d = await dung()
    expect((await lapVaLuuKeHoach(d.env, ['S1'], NOW)).get('S1')!.tienBo.soCauHienThi).toBe(3)
    await ghiSuKien(d.env, [{ nguon: 'luyen', maNguon: 'm', sbd: 'S1', qid: 'Q9', lan: 1, ketQua: 1, luc: new Date(VN('2026-09-22T14:30:00')).toISOString() }])
    expect((await lapVaLuuKeHoach(d.env, ['S1'], NOW)).get('S1')!.tienBo.soCauHienThi).toBe(4)
  })
})

describe('chi phí và ranh giới', () => {
  it('truy vấn cả lớp đi bằng chỉ mục idx_skh_luc; cả hai SQL không UNION (chốt 5 term của D1); đúng số tham số', async () => {
    const d = await dung()
    const kh = (d.sql.prepare(`EXPLAIN QUERY PLAN ${SQL_CAU_DA_LAM_CA_LOP}`).all(MOC_ISO, '2026-09-22') as { detail: string }[]).map((x) => x.detail).join(' | ')
    expect(kh).toMatch(/SEARCH .*idx_skh_luc \(luc>\?\)/)
    for (const q of [SQL_CAU_DA_LAM_CA_LOP, SQL_CAU_DA_LAM_THEO_EM]) expect(q).not.toMatch(/UNION/i)
    expect((SQL_CAU_DA_LAM_CA_LOP.match(/\?/g) ?? []).length).toBe(2)
    expect((SQL_CAU_DA_LAM_THEO_EM.match(/\?/g) ?? []).length).toBe(3)
  })

  it('on-lai-nop.ts cũng thêm soCauHienThi (chỉ-thêm) từ cùng hàm; TIEN_BO_NGAY (luật) không bị sửa', () => {
    const ma = readFileSync('server/src/on-lai-nop.ts', 'utf8')
    expect(ma).toMatch(/docCauDaLamHomNay\(env, \[sbd\], now\)/)
    expect(ma).toMatch(/tienBo\.soCauHienThi = /)
    expect(readFileSync('server/src/ke-hoach-ngay-d1.ts', 'utf8')).toMatch(/COUNT\(DISTINCT e\.qid\) AS da_lam,\n\s+COUNT\(DISTINCT CASE WHEN e\.ket_qua = 1 THEN e\.qid END\) AS dung,/)
  })
})
