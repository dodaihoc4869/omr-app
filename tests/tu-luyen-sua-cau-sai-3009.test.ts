// @vitest-environment node
// TU LUYỆN · CHẾ ĐỘ 1 "SỬA CÂU SAI" — LUẬT MỚI (thầy lệnh 30/09, Boss chuyển): kho câu sai CỘNG DỒN từ 29/09 00:00 (+07) ở mọi ca kiểm tra
// (đã công bố) + chiến dịch làm trong game; khử trùng theo qid và nhóm nội dung; bỏ tự luận / câu đang bảo vệ / câu rút khỏi kho.
// Chọn: chưa luyện → ít lần → lâu nhất ⇒ lần sau khác lần trước; thiếu thì lặp; trộn dễ/khó xen kẽ. Nhãn "Luyện lại lần K" + "Sai gốc: …".
// Không lộ đáp án trước nộp, không EXP, không ghi sổ sự kiện. Chạy trên SQLite thật.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { taoD1That, type D1That } from './_d1-that'
import { dongBoCacTo, xoaDemCaBaoVe } from '../server/src/game-v2-bank'
import { tuLuyenNguon, tuLuyenNop, tuLuyenRut, tuLuyenXemTruoc } from '../server/src/tu-luyen'
import { chonCauSai, nhanLanLuyen, nhanSaiGoc, qidGoc, xenKeDeKho, MOC_CAU_SAI_ISO, type LanSai } from '../server/src/tu-luyen-cau-sai'

const T0 = Date.parse('2026-09-30T19:00:00+07:00')
beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(T0); xoaDemCaBaoVe() })
afterEach(() => { vi.useRealTimers(); xoaDemCaBaoVe() })

type Tho = Record<string, unknown>
const PA = { A: 'Phương án A', B: 'Phương án B', C: 'Phương án C', D: 'Phương án D' }
const DANG = { ma: 'ES.A.X', ten: 'Ester đơn chức' }
const cauI = (so: number, de: string, dapAn: string, o: Tho = {}): Tho => ({
  phan: 'I', so, de, pa: PA, dap_an: dapAn, dang: DANG, chuyen_de: 'CD1', muc_do: 'biet', loi_giai: { chot: `Chọn ${dapAn}.`, trang_thai: 'khop' }, ...o,
})
const MA = 'DH-12-C1-B1'
const MA2 = 'DH-12-C1-B2'
const KHO: Tho[] = [
  cauI(1, 'Câu một về ester.', 'B'),
  cauI(2, 'Câu hai về ester.', 'C'),
  cauI(3, 'Câu ba em làm đúng.', 'A'),
  cauI(4, 'Câu bốn sai trước mốc.', 'D'),
  cauI(5, 'Câu năm vận dụng.', 'A', { muc_do: 'van_dung' }),
  { phan: 'II', so: 1, de: 'Cho các phát biểu về chất béo:', y: { a: 'ý a', b: 'ý b', c: 'ý c', d: 'ý d' }, dap_an: 'DSDS', dang: DANG, chuyen_de: 'CD1', muc_do: 'hieu', loi_giai: { chot: 'Lời giải ý.', trang_thai: 'khop' } },
  { phan: 'III', so: 1, de: 'Tính khối lượng ester (gam).', dap_an: '8,8', dang: DANG, chuyen_de: 'CD1', muc_do: 'van_dung', loi_giai: { chot: 'Tính mol.', ket_qua: '8,8', trang_thai: 'khop' } },
  { phan: 'III', so: 2, de: 'Giải thích vì sao ester nhẹ hơn nước.', dap_an: 'vì khối lượng riêng nhỏ hơn nước nên nổi lên trên', dang: DANG, chuyen_de: 'CD1' }, // tự luận
]
// Tờ thứ hai chép NGUYÊN câu hai (cùng nhóm nội dung) ⇒ phải khử trùng thành một câu.
const KHO2: Tho[] = [cauI(1, 'Câu hai về ester.', 'C')]
const q = (ma: string, phan: string, so: number) => `${ma}-${phan}-${so}`

let n = 0
function suKien(d: D1That, o: { qid: string; nguon: 'thi' | 'game'; maNguon: string; ketQua: 0 | 1 | null; luc: string }) {
  const ngay = new Date(Date.parse(o.luc) + 7 * 3_600_000).toISOString().slice(0, 10)
  d.sql.prepare('INSERT INTO su_kien_hoc(khoa,sbd,qid,nguon,ma_nguon,lan,ket_qua,luc,ngay_vn) VALUES(?,?,?,?,?,1,?,?,?)')
    .run(`k${++n}`, 'HS1', o.qid, o.nguon, o.maNguon, o.ketQua, o.luc, ngay)
}

async function dung(): Promise<D1That> {
  const d = taoD1That()
  d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES('HS1','Em Một','12','x','x')").run()
  for (const [ma, cau] of [[MA, KHO], [MA2, KHO2]] as const) {
    d.sql.prepare("INSERT INTO de_kho(ma_de,ten_de,lop,so_cau,r2_khoa,da_xoa,cap_nhat_luc) VALUES(?,?,'12',?,?,0,'v1')").run(ma, ma, cau.length, `kho/${ma}.json`)
    d.objects.set(`kho/${ma}.json`, { ma_de: ma, cau: cau.map((c) => ({ ...c })) })
  }
  await dongBoCacTo(d.env, [MA, MA2])
  const ca = d.sql.prepare(`INSERT INTO ca(ma_ca,ten_ca,trang_thai,bat_dau,het_han_vao,thoi_gian_phut,loai,cong_bo,bank_r2,cap_nhat_luc) VALUES(?,?,?,?,?,45,'thi',?,'',?)`)
  ca.run('CA-1', 'Ca kiểm tra Ester', 'dong', '2026-09-29T01:00:00.000Z', '2026-09-29T02:00:00.000Z', 'ngay', 'x')
  ca.run('CA-2', 'Ca chưa công bố', 'dong', '2026-09-29T01:00:00.000Z', '2026-09-29T02:00:00.000Z', 'khong', 'x')
  const phien = d.sql.prepare('INSERT INTO game_v2_session(id,sbd,json,created_at) VALUES(?,?,?,?)')
  phien.run('G-DOAN', 'HS1', JSON.stringify({ doan: { tram: 3 }, questions: [] }), 'x')
  phien.run('G-BIA', 'HS1', JSON.stringify({ bia: 1, questions: [] }), 'x')
  phien.run('G-DAO', 'HS1', JSON.stringify({ mode: 'adventure', hoa2: 1, questions: [] }), 'x')
  d.sql.prepare("INSERT INTO chien_dich(id,ten,lop,sbd_json,ma_de_json,qid_json,han_nop,tao_luc) VALUES('CD1','Ôn ester','12',?,?,?,'2026-10-05','2026-09-28T00:00:00.000Z')")
    .run(JSON.stringify(['HS1']), JSON.stringify([MA]), JSON.stringify([q(MA, 'II', 1)]))
  // Ca kiểm tra đã công bố: câu 1 sai, câu 2 bỏ trống (tính là sai), câu 3 đúng.
  suKien(d, { qid: q(MA, 'I', 1), nguon: 'thi', maNguon: 'CA-1', ketQua: 0, luc: '2026-09-29T02:00:00.000Z' })
  suKien(d, { qid: q(MA, 'I', 2), nguon: 'thi', maNguon: 'CA-1', ketQua: null, luc: '2026-09-29T02:00:00.000Z' })
  suKien(d, { qid: q(MA, 'I', 3), nguon: 'thi', maNguon: 'CA-1', ketQua: 1, luc: '2026-09-29T02:00:00.000Z' })
  // Sai TRƯỚC mốc 29/09 ⇒ không lấy.
  suKien(d, { qid: q(MA, 'I', 4), nguon: 'thi', maNguon: 'CA-1', ketQua: 0, luc: '2026-09-28T10:00:00.000Z' })
  // Ca CHƯA công bố ⇒ không lấy.
  suKien(d, { qid: q(MA, 'III', 1), nguon: 'thi', maNguon: 'CA-2', ketQua: 0, luc: '2026-09-29T03:00:00.000Z' })
  // Chiến dịch trong game: Đoàn sai câu II-1 (thuộc chiến dịch "Ôn ester"); Bi-a sai lại câu 1; Đảo sai câu 5; bản chép câu 2 sai ở Đảo; tự luận sai ⇒ bỏ.
  suKien(d, { qid: q(MA, 'II', 1), nguon: 'game', maNguon: 'G-DOAN', ketQua: 0, luc: '2026-09-30T03:00:00.000Z' })
  suKien(d, { qid: q(MA, 'I', 1), nguon: 'game', maNguon: 'G-BIA', ketQua: 0, luc: '2026-09-30T04:00:00.000Z' })
  suKien(d, { qid: q(MA, 'I', 5), nguon: 'game', maNguon: 'G-DAO', ketQua: 0, luc: '2026-09-30T05:00:00.000Z' })
  suKien(d, { qid: q(MA2, 'I', 1), nguon: 'game', maNguon: 'G-DAO', ketQua: 0, luc: '2026-09-30T06:00:00.000Z' })
  suKien(d, { qid: q(MA, 'III', 2), nguon: 'game', maNguon: 'G-DAO', ketQua: 0, luc: '2026-09-30T06:00:00.000Z' })
  // Game: lần ĐÚNG không làm câu thành câu sai.
  suKien(d, { qid: q(MA, 'I', 3), nguon: 'game', maNguon: 'G-DAO', ketQua: 1, luc: '2026-09-30T07:00:00.000Z' })
  return d
}
const coDapAnTrongChu = (o: unknown) => /dap_?an|loiGiai|loi_giai|"chot"|ketQua|lyDo|chuaCho|viSaoSai|"correct"/i.test(JSON.stringify(o))
type Cau = { qid: string; phan: string; nhanLuyen?: string; saiGoc?: string }

describe('Chế độ 1 — nguồn câu sai từ 29/09 (ca kiểm tra + chiến dịch)', () => {
  it('mốc là 29/09/2026 00:00 giờ Việt Nam', () => {
    expect(new Date(MOC_CAU_SAI_ISO).getTime()).toBe(Date.parse('2026-09-29T00:00:00+07:00'))
  })
  it('gom đúng nguồn, khử trùng qid + nhóm nội dung, bỏ tự luận / trước mốc / ca chưa công bố / câu làm đúng', async () => {
    const d = await dung()
    const r = await tuLuyenNguon(d.env, 'HS1')
    // Câu 1 (ca + Bi-a), câu 2 (ca, + bản chép ở Đảo), II-1 (Đoàn), câu 5 (Đảo) ⇒ 4 câu; gốc ca: câu 1, câu 2 · gốc chiến dịch: II-1, câu 5.
    expect(r.khoCauSai).toEqual({ tong: 4, tuCa: 2, tuChienDich: 2, loi: '' })
    const x = await tuLuyenXemTruoc(d.env, 'HS1', { cheDo: 1 })
    expect(x.tongToiDa).toBe(4)
  })
  it('rút: đủ câu, không lộ đáp án, có nhãn lần luyện + sai gốc đúng chữ', async () => {
    const d = await dung()
    const r = await tuLuyenRut(d.env, 'HS1', { cheDo: 1, soCau: 4 })
    expect(r.ok).toBe(true)
    const cau = r.cau as Cau[]
    // Câu hai có hai bản (hai tờ, cùng nội dung) ⇒ MỘT câu, giữ bản có lần sai gần nhất (tờ 2).
    expect(cau.map((c) => c.qid).sort()).toEqual([q(MA, 'I', 1), q(MA, 'I', 5), q(MA, 'II', 1), q(MA2, 'I', 1)].sort())
    expect(coDapAnTrongChu(r)).toBe(false)
    const theo = Object.fromEntries(cau.map((c) => [qidGoc(c.qid), c]))
    expect(cau.every((c) => c.nhanLuyen === 'Luyện lần đầu')).toBe(true)
    expect(theo[q(MA, 'II', 1)]!.saiGoc).toBe('Sai gốc: Chiến dịch Ôn ester · Đoàn Hộ Tống · 30/09')
    expect(theo[q(MA, 'I', 5)]!.saiGoc).toBe('Sai gốc: Đảo thần thú · 30/09')
    expect(theo[q(MA, 'I', 1)]!.saiGoc).toBe('Sai gốc: Bi-a · 30/09 và 1 lần khác')
    expect(theo[q(MA2, 'I', 1)]!.saiGoc).toBe('Sai gốc: Đảo thần thú · 30/09 và 1 lần khác')
  })
  it('lần sau KHÁC lần trước khi kho đủ; nhãn "Luyện lại lần 2" cho câu đã luyện', async () => {
    const d = await dung()
    const r1 = await tuLuyenRut(d.env, 'HS1', { cheDo: 1, soCau: 2 })
    const lan1 = (r1.cau as Cau[]).map((c) => c.qid)
    await tuLuyenNop(d.env, 'HS1', { luotId: r1.luotId, traLoi: {} })
    const r2 = await tuLuyenRut(d.env, 'HS1', { cheDo: 1, soCau: 2 })
    const lan2 = (r2.cau as Cau[]).map((c) => c.qid)
    expect(lan2.some((x) => lan1.includes(x))).toBe(false)
    await tuLuyenNop(d.env, 'HS1', { luotId: r2.luotId, traLoi: {} })
    const r3 = await tuLuyenRut(d.env, 'HS1', { cheDo: 1, soCau: 4 })
    expect((r3.cau as Cau[]).every((c) => c.nhanLuyen === 'Luyện lại lần 2')).toBe(true)
  })
  it('xin nhiều hơn kho ⇒ lấy LẶP (mã riêng từng bản), chấm được từng bản; không ghi sổ sự kiện, không EXP', async () => {
    const d = await dung()
    const sk = d.dem('su_kien_hoc')
    const r = await tuLuyenRut(d.env, 'HS1', { cheDo: 1, soCau: 7 })
    const cau = r.cau as Cau[]
    expect(cau.length).toBe(7)
    expect(new Set(cau.map((c) => c.qid)).size).toBe(7)
    const dem = new Map<string, number>()
    for (const c of cau) dem.set(qidGoc(c.qid), (dem.get(qidGoc(c.qid)) ?? 0) + 1)
    expect(Math.max(...dem.values())).toBe(2)
    expect(cau.filter((c) => /~2$/.test(c.qid)).every((c) => c.nhanLuyen === 'Luyện lại lần 2')).toBe(true)
    const tl = Object.fromEntries(cau.map((c) => [c.qid, c.phan === 'II' ? 'DSDS' : 'B']))
    const kq = await tuLuyenNop(d.env, 'HS1', { luotId: r.luotId, traLoi: tl })
    expect(kq.ok).toBe(true)
    expect(kq.soCau).toBe(7)
    expect(d.dem('su_kien_hoc')).toBe(sk)
    const co = d.sql.prepare("SELECT COUNT(*) n FROM sqlite_master WHERE type='table' AND name='exp_so'").get() as { n: number }
    if (co.n) expect(d.dem('exp_so')).toBe(0)
  })
  it('xin quá 2 lần kho ⇒ kẹp ở 2 × kho', async () => {
    const d = await dung()
    const r = await tuLuyenRut(d.env, 'HS1', { cheDo: 1, soCau: 50 })
    expect((r.cau as Cau[]).length).toBe(8)
  })
})

describe('Chế độ 1 — hàm thuần', () => {
  const rndTu = (hat: number) => () => { hat = (hat * 16807) % 2147483647; return (hat - 1) / 2147483646 }
  it('xen kẽ dễ/khó: khó ≤ nửa lượt ⇒ không có hai câu khó liền nhau; thứ tự đổi theo lượt', () => {
    const ds = Array.from({ length: 10 }, (_, i) => ({ qid: `c${i}`, kho: i < 4 }))
    const cacThuTu = new Set<string>()
    for (let hat = 1; hat < 60; hat++) {
      const ra = xenKeDeKho(ds, rndTu(hat))
      expect(ra.length).toBe(10)
      for (let i = 1; i < ra.length; i++) expect(ra[i - 1]!.kho && ra[i]!.kho).toBe(false)
      cacThuTu.add(ra.map((c) => c.qid).join(','))
    }
    expect(cacThuTu.size).toBeGreaterThan(10)
  })
  it('ưu tiên chưa luyện → ít lần → lâu nhất; thiếu thì lặp, bản lặp không đứng liền bản trước', () => {
    const ds = [
      { qid: 'a', kho: false, soLanLuyen: 2, lanCuoi: 5 },
      { qid: 'b', kho: false, soLanLuyen: 0, lanCuoi: 0 },
      { qid: 'c', kho: true, soLanLuyen: 1, lanCuoi: 9 },
      { qid: 'd', kho: false, soLanLuyen: 1, lanCuoi: 3 },
    ]
    expect(chonCauSai(ds, 1, rndTu(3)).map((c) => c.qid)).toEqual(['b'])
    expect(chonCauSai(ds, 2, rndTu(3)).map((c) => c.qid).sort()).toEqual(['b', 'd'])
    for (let hat = 1; hat < 30; hat++) {
      const ra = chonCauSai(ds, 6, rndTu(hat))
      expect(ra.length).toBe(6)
      expect(ra.filter((c) => c.lap === 1).map((c) => c.qid).sort()).toEqual(['b', 'd'])
      for (let i = 1; i < ra.length; i++) expect(ra[i]!.qid).not.toBe(ra[i - 1]!.qid)
    }
  })
  it('nhãn: lần luyện và sai gốc', () => {
    expect(nhanLanLuyen(1)).toBe('Luyện lần đầu')
    expect(nhanLanLuyen(3)).toBe('Luyện lại lần 3')
    const l = (o: Partial<LanSai>): LanSai => ({ qid: 'x', loai: 'ca', tenCa: 'Ca Ester', tenChienDich: '', luc: '2026-09-29T02:00:00.000Z', ngay: '2026-09-29', ...o })
    expect(nhanSaiGoc([l({}), l({ luc: '2026-09-29T05:00:00.000Z' })])).toBe('Sai gốc: Ca Ester · 29/09')
    expect(nhanSaiGoc([l({}), l({ loai: 'doan', tenCa: '', tenChienDich: 'Ôn tập', luc: '2026-09-30T01:00:00.000Z', ngay: '2026-09-30' })]))
      .toBe('Sai gốc: Chiến dịch Ôn tập · Đoàn Hộ Tống · 30/09 và 1 lần khác')
    expect(nhanSaiGoc([])).toBe('')
  })
})
