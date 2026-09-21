// @vitest-environment node
// ĐIỀU 10 — BẢNG GIÁ EXP HỌC TẬP ĐỔI THEO NGÀY VN (thầy lệnh 21/09/2026 13:47; prompt-than-thu-moi-ngay-2109.md): từ 22/09 đạt ngày 80 · lô đúng nhịp 20 · lô trễ 8 · nộp BTVN đúng hạn 30,
// thêm `dau_ngay` +10 (câu đúng đầu tiên trong ngày, MỌI nguồn kể cả game) và `tro_lai` +30 (ngày đầu học lại sau ≥ 3 ngày vắng, ≤ 1 lần/14 ngày, chưa từng học ⇒ không). Ngày < 22/09 giữ bảng cũ.
// Số dưới đây VIẾT THẲNG (không import hằng) để đổi hằng mà không sửa test là đỏ.
import { describe, expect, it } from 'vitest'
import { bangGiaExp } from '../server/src/exp-cau-hinh'
import { soNgayCach, tinhExp, type SuKienExp, type VaoTinhExp } from '../server/src/exp-hoc-tap'
import { capNhatExp, docThanhTichNgay } from '../server/src/exp-d1'
import { ghiSuKien } from '../server/src/su-kien-hoc'
import { taoD1That, type D1That } from './_d1-that'

const dongSK = (qid: string, ketQua: 0 | 1 | null, luc: string, o: Partial<SuKienExp> = {}): SuKienExp => ({ khoa: `k-${qid}-${luc}`, nguon: 'btvn', maNguon: 'B', qid, lan: 1, ketQua, luc, ...o })
const vao = (o: Partial<VaoTinhExp> = {}): VaoTinhExp => ({
  ngay: '2026-09-22', suKien: [], metaCau: {}, mucTieuCau: 8, lenBac: [], khacPhuc: [], loXong: [], baiBtvnNop: [], momXong: [], diemCa: [], datNgay: null, dangRoiYeu: [], daCoKhoa: new Set(), ...o,
})
const theoLoai = (r: ReturnType<typeof tinhExp>, loai: string) => r.khoan.filter((k) => k.loai === loai)

describe('bangGiaExp — ranh giới ngày 21/22 (số viết thẳng)', () => {
  it('trước 22/09 bảng cũ; từ 22/09 bảng mới', () => {
    expect(bangGiaExp('2026-09-21')).toEqual({ datNgay: 20, loDungNhip: 10, loTreNhip: 4, btvnDungHan: 15, dauNgay: 0, troLai: 0 })
    expect(bangGiaExp('2026-09-22')).toEqual({ datNgay: 80, loDungNhip: 20, loTreNhip: 8, btvnDungHan: 30, dauNgay: 10, troLai: 30 })
    expect(bangGiaExp('2026-01-01').datNgay).toBe(20)
    expect(bangGiaExp('2027-01-01').datNgay).toBe(80)
  })
  it('soNgayCach: cùng ngày 0, qua tháng, có dấu, chuỗi hỏng NaN', () => {
    expect(soNgayCach('2026-09-22', '2026-09-22')).toBe(0)
    expect(soNgayCach('2026-10-01', '2026-09-30')).toBe(1)
    expect(soNgayCach('2026-09-18', '2026-09-22')).toBe(-4)
    expect(soNgayCach('2026-09-22', '2026-09-09')).toBe(13)
    expect(Number.isNaN(soNgayCach('x', '2026-09-22'))).toBe(true)
  })
})

describe('thưởng theo việc đổi giá theo NGÀY của khoản', () => {
  const viec = (ngay: string) => tinhExp(vao({
    ngay,
    loXong: [{ maBtvn: 'B1', chiSo: 0, dungNhip: true, luc: `${ngay}T03:00:00.000Z` }, { maBtvn: 'B1', chiSo: 1, dungNhip: false, luc: `${ngay}T04:00:00.000Z` }],
    baiBtvnNop: [{ maBtvn: 'B1', dungHan: true, luc: `${ngay}T05:00:00.000Z` }],
    datNgay: { chuoi: 1, luc: `${ngay}T06:00:00.000Z` },
  }))
  it('21/09 (bảng cũ): đạt ngày 20, lô 10 / 4, nộp đúng hạn 15', () => {
    const r = viec('2026-09-21')
    expect(theoLoai(r, 'dat_ngay')[0]).toMatchObject({ exp: 20, ghiChu: 'Đạt nhiệm vụ ngày: +20' })
    expect(theoLoai(r, 'lo').map((k) => k.exp)).toEqual([10, 4])
    expect(theoLoai(r, 'btvn')[0]).toMatchObject({ exp: 15 })
    expect(theoLoai(r, 'chuoi')[0]).toMatchObject({ exp: 2 }) // chuỗi giữ nguyên
  })
  it('22/09 (bảng mới): đạt ngày 80, lô 20 / 8, nộp đúng hạn 30; chuỗi không đổi', () => {
    const r = viec('2026-09-22')
    expect(theoLoai(r, 'dat_ngay')[0]).toMatchObject({ exp: 80, ghiChu: 'Đạt nhiệm vụ ngày: +80' })
    expect(theoLoai(r, 'lo').map((k) => k.exp)).toEqual([20, 8])
    expect(theoLoai(r, 'btvn')[0]).toMatchObject({ exp: 30, ghiChu: 'Nộp cả bài BTVN đúng hạn: +30' })
    expect(theoLoai(r, 'chuoi')[0]).toMatchObject({ exp: 2 })
  })
  it('các khoản KHÔNG đổi giá (mom 10, lên bậc 6, khắc phục 30, lên bảng 15/5, ca × 3) vẫn thế ở 22/09', () => {
    const r = tinhExp(vao({
      lenBac: ['DE1-I-1'], suKien: [dongSK('DE1-I-1', 1, '2026-09-22T03:00:00.000Z'), dongSK('LB-1', 1, '2026-09-22T03:10:00.000Z', { nguon: 'len_bang' })],
      momXong: [{ id: 'M1', luc: '2026-09-22T03:20:00.000Z' }], khacPhuc: [{ qid: 'DE1-I-2', lan: 1, luc: '2026-09-22T03:30:00.000Z' }],
      diemCa: [{ maCa: 'C1', lanThu: 1, diem: 7, luc: '2026-09-22T03:40:00.000Z' }],
    }))
    expect(theoLoai(r, 'mom')[0]!.exp).toBe(10)
    expect(theoLoai(r, 'len_bac')[0]!.exp).toBe(6)
    expect(theoLoai(r, 'khac_phuc')[0]!.exp).toBe(30)
    expect(theoLoai(r, 'len_bang')[0]!.exp).toBe(15)
    expect(theoLoai(r, 'diem_ca')[0]!.exp).toBe(21)
  })
  it('mảnh khiên KHÔNG đổi: đạt ngày vẫn +1 mảnh ở cả hai bảng giá', () => {
    for (const ngay of ['2026-09-21', '2026-09-22']) expect(tinhExp(vao({ ngay, datNgay: { chuoi: 1, luc: `${ngay}T06:00:00.000Z` } })).manh.map((m) => [m.loai, m.so])).toEqual([['dat', 1]])
  })
})

describe('dau_ngay — câu ĐÚNG đầu tiên trong ngày, mọi nguồn kể cả game', () => {
  const t = (h: number) => `2026-09-22T0${h}:00:00.000Z`
  it('lấy câu đúng SỚM NHẤT (theo luc) của mọi nguồn, kể cả game và thi; một khoản mỗi ngày; sai/bỏ trống không tính', () => {
    const r = tinhExp(vao({ suKien: [dongSK('Q3', 1, t(5)), dongSK('Q1', 0, t(1), { nguon: 'game' }), dongSK('Q2', 1, t(2), { nguon: 'game', maNguon: 'GAME-1' }), dongSK('Q4', 1, t(4), { nguon: 'thi', maNguon: 'CA1' }), dongSK('Q5', null, t(3))] }))
    const k = theoLoai(r, 'dau_ngay')
    expect(k).toHaveLength(1)
    expect(k[0]).toMatchObject({ khoa: 'dau_ngay|2026-09-22', exp: 10, luc: t(2), maNguon: 'GAME-1', ghiChu: 'Câu đúng đầu tiên hôm nay +10 EXP' })
  })
  it('KHÔNG sinh khi mọi câu sai/bỏ trống, khi không có sự kiện, hoặc khi khoá đã có (idempotent)', () => {
    expect(theoLoai(tinhExp(vao({ suKien: [dongSK('Q1', 0, t(1)), dongSK('Q2', null, t(2))] })), 'dau_ngay')).toHaveLength(0)
    expect(theoLoai(tinhExp(vao()), 'dau_ngay')).toHaveLength(0)
    expect(theoLoai(tinhExp(vao({ suKien: [dongSK('Q1', 1, t(1))], daCoKhoa: new Set(['dau_ngay|2026-09-22']) })), 'dau_ngay')).toHaveLength(0)
  })
  it('bảng CŨ (ngày 21/09): không có khoản dau_ngay', () => {
    expect(theoLoai(tinhExp(vao({ ngay: '2026-09-21', suKien: [dongSK('Q1', 1, '2026-09-21T01:00:00.000Z')] })), 'dau_ngay')).toHaveLength(0)
  })
  it('khoản game KHÔNG thành EXP câu (chỉ dau_ngay): câu đúng duy nhất là của game ⇒ đúng 1 khoản, loại dau_ngay', () => {
    const r = tinhExp(vao({ suKien: [dongSK('G1', 1, t(3), { nguon: 'game' })] }))
    expect(r.khoan.map((k) => k.loai)).toEqual(['dau_ngay'])
  })
})

describe('tro_lai — mừng em trở lại', () => {
  const sk = [dongSK('Q1', 0, '2026-09-22T03:00:00.000Z')] // có sự kiện học, kể cả câu sai
  const tl = (o: Partial<VaoTinhExp>) => theoLoai(tinhExp(vao({ suKien: sk, ...o })), 'tro_lai')
  it('vắng đúng 3 ngày (trước đó 18/09, nay 22/09) ⇒ +30; khoá tro_lai|<ngày>, ghi chú, luc = sự kiện đầu ngày', () => {
    const k = tl({ ngayTruocGanNhat: '2026-09-18' })
    expect(k).toHaveLength(1)
    expect(k[0]).toMatchObject({ khoa: 'tro_lai|2026-09-22', exp: 30, luc: '2026-09-22T03:00:00.000Z', ghiChu: 'Mừng em trở lại +30 EXP' })
  })
  it('vắng chỉ 2 ngày (19/09 → 22/09), hôm qua, hoặc hôm nay đã có ⇒ không', () => {
    expect(tl({ ngayTruocGanNhat: '2026-09-19' })).toHaveLength(0)
    expect(tl({ ngayTruocGanNhat: '2026-09-21' })).toHaveLength(0)
    expect(tl({ ngayTruocGanNhat: '2026-09-22' })).toHaveLength(0)
  })
  it('em CHƯA TỪNG học (không ngày trước) ⇒ không; vắng trường ⇒ không', () => {
    expect(tl({ ngayTruocGanNhat: null })).toHaveLength(0)
    expect(tl({})).toHaveLength(0)
  })
  it('nhiều nhất 1 lần trong 14 ngày: lần trước cách 13 ngày ⇒ không, cách 14 ngày ⇒ có', () => {
    expect(tl({ ngayTruocGanNhat: '2026-09-15', troLaiGanNhat: '2026-09-09' })).toHaveLength(0)
    expect(tl({ ngayTruocGanNhat: '2026-09-15', troLaiGanNhat: '2026-09-08' })).toHaveLength(1)
    expect(tl({ ngayTruocGanNhat: '2026-09-15', troLaiGanNhat: null })).toHaveLength(1)
  })
  it('ngày đó KHÔNG có sự kiện nào ⇒ không; bảng cũ (21/09) dù vắng lâu ⇒ không; khoá đã có ⇒ không sinh lại', () => {
    expect(theoLoai(tinhExp(vao({ suKien: [], ngayTruocGanNhat: '2026-09-01' })), 'tro_lai')).toHaveLength(0)
    expect(theoLoai(tinhExp(vao({ ngay: '2026-09-21', suKien: [dongSK('Q1', 1, '2026-09-21T03:00:00.000Z')], ngayTruocGanNhat: '2026-09-01' })), 'tro_lai')).toHaveLength(0)
    expect(tl({ ngayTruocGanNhat: '2026-09-01', daCoKhoa: new Set(['tro_lai|2026-09-22']) })).toHaveLength(0)
  })
})

// ---- Tầng D1 -------------------------------------------------------------------------------------------------------------------------------------------------------
const TU = '2026-09-01T00:00:00.000Z'
const T = (s: string): number => Date.parse(`${s}+07:00`)
const hoSoGame = { pet: 'dat_quy', choice: false, legacy: null, cap: 1, exp: 0, wallet: 0, earned: 0, tower: 1, mastery: [], arena: null, cutover: '2026-08-01T00:00:00.000Z' }
function dung(): D1That {
  const d = taoD1That()
  d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,cap_nhat_luc) VALUES('S1','x','x')").run()
  d.sql.prepare('INSERT INTO game_v2_profile(sbd,revision,json,created_at) VALUES(?,0,?,?)').run('S1', JSON.stringify(hoSoGame), 'x')
  d.sql.prepare("INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('exp_moi',?,'x')").run(JSON.stringify({ tu: TU, dsSbd: ['S1'] }))
  return d
}
const sk1 = (qid: string, ketQua: 0 | 1, luc: number, nguon: 'game' | 'btvn' = 'game') => ({ nguon, maNguon: nguon === 'game' ? 'GM' : 'B', sbd: 'S1', qid, lan: Math.floor(luc / 1000), ketQua, luc: new Date(luc).toISOString() })
const ghi = async (d: D1That, ds: ReturnType<typeof sk1>[]) => expect((await ghiSuKien(d.env, ds)).ok).toBe(true)
const dongExp = (d: D1That) => d.sql.prepare("SELECT khoa, loai, exp, ngay_vn FROM exp_so WHERE sbd='S1' ORDER BY luc, khoa").all() as { khoa: string; loai: string; exp: number; ngay_vn: string }[]
const luuKeHoach = (d: D1That, ngay: string) => d.sql.prepare(
  `INSERT OR REPLACE INTO ke_hoach_ngay(khoa,sbd,ngay,phien_ban,seed,ngan_sach_json,viec_json,canh_bao_json,ket_qua,la_ngay_nghi,so_su_kien,cap_nhat_luc) VALUES(?,?,?,1,1,?,?,'[]',NULL,0,0,'x')`,
).run(`S1|${ngay}`, 'S1', ngay, JSON.stringify({ mucTieuCau: 8, toiThieuCau: 4 }), JSON.stringify({ viec: [], tienBo: { soCauToiHan: 0, treNhip: false } }))

describe('qua D1 (capNhatExp)', () => {
  it('đạt ngày: 21/09 nhận 20, 22/09 nhận 80 (cùng bộ sự kiện, cùng kế hoạch)', async () => {
    for (const [ngay, gio, mong] of [['2026-09-21', '2026-09-21T12:00:00', 20], ['2026-09-22', '2026-09-22T12:00:00', 80]] as const) {
      const d = dung()
      luuKeHoach(d, ngay)
      const now = T(gio)
      await ghi(d, [1, 2, 3, 4].map((k) => sk1(`DE1-I-${k}`, 1, now - k * 60_000, 'btvn')))
      await capNhatExp(d.env, 'S1', now)
      expect(dongExp(d).find((x) => x.loai === 'dat_ngay')).toMatchObject({ exp: mong, ngay_vn: ngay })
    }
  })

  it('quay lại sau 5 ngày vắng, câu đúng đầu tiên là câu GAME: +10 (dau_ngay) +30 (tro_lai); gọi lại không thêm; 7 ngày sau vắng lại KHÔNG có tro_lai (14 ngày) nhưng có dau_ngay; đủ 14 ngày thì lại có', async () => {
    const d = dung()
    await ghi(d, [sk1('DE1-I-1', 1, T('2026-09-22T09:00:00'), 'btvn')]) // lần học gần nhất trước đó
    const ngay1 = T('2026-09-28T12:00:00') // vắng 23..27 = 5 ngày
    await ghi(d, [sk1('G-1', 1, ngay1)])
    await capNhatExp(d.env, 'S1', ngay1)
    expect(dongExp(d).filter((x) => x.ngay_vn === '2026-09-28').map((x) => [x.loai, x.exp])).toEqual([['dau_ngay', 10], ['tro_lai', 30]]) // game không nhận EXP câu; hai khoản mới thôi
    await capNhatExp(d.env, 'S1', ngay1 + 60_000)
    expect(dongExp(d).filter((x) => x.ngay_vn === '2026-09-28')).toHaveLength(2)

    const ngay2 = T('2026-10-05T12:00:00') // vắng 29/09..04/10 = 6 ngày nhưng mới 7 ngày kể từ lần mừng trước
    await ghi(d, [sk1('G-2', 1, ngay2)])
    await capNhatExp(d.env, 'S1', ngay2)
    expect(dongExp(d).filter((x) => x.ngay_vn === '2026-10-05').map((x) => x.loai)).toEqual(['dau_ngay'])

    const ngay3 = T('2026-10-12T12:00:00') // 14 ngày sau lần mừng 28/09; vắng 06..11/10
    await ghi(d, [sk1('G-3', 1, ngay3)])
    await capNhatExp(d.env, 'S1', ngay3)
    expect(dongExp(d).filter((x) => x.ngay_vn === '2026-10-12').map((x) => x.loai).sort()).toEqual(['dau_ngay', 'tro_lai'])
  })

  it('em chưa từng học (ngày đầu tiên) ⇒ dau_ngay có, tro_lai KHÔNG', async () => {
    const d = dung()
    const now = T('2026-09-30T12:00:00')
    await ghi(d, [sk1('G-1', 1, now)])
    await capNhatExp(d.env, 'S1', now)
    expect(dongExp(d).map((x) => x.loai)).toEqual(['dau_ngay'])
  })

  it('docThanhTichNgay nhận ra lô ĐÚNG NHỊP = khoản `lo` cao hơn giá TRỄ NHỊP của ngày ấy (21/09: 10 > 4; 22/09: 20 > 8), trễ nhịp thì không', async () => {
    const d = dung()
    const them = (khoa: string, ngay: string, exp: number) => d.sql.prepare("INSERT INTO exp_so(khoa,sbd,ngay_vn,loai,qid,ma_nguon,exp,luc,ghi_chu) VALUES(?, 'S1', ?, 'lo', NULL, 'B1', ?, ?, 'x')").run(khoa, ngay, exp, `${ngay}T05:00:00.000Z`)
    them('S1|lo|B1|0', '2026-09-21', 10); them('S1|lo|B1|1', '2026-09-21', 4)
    them('S1|lo|B2|0', '2026-09-22', 20); them('S1|lo|B2|1', '2026-09-22', 8)
    const a = await docThanhTichNgay(d.env, 'S1', T('2026-09-21T12:00:00'))
    expect(a.loDungNhip.map((x) => x.khoa)).toEqual(['lo|B1|0'])
    const b = await docThanhTichNgay(d.env, 'S1', T('2026-09-22T12:00:00'))
    expect(b.loDungNhip.map((x) => x.khoa)).toEqual(['lo|B2|0'])
  })
})
