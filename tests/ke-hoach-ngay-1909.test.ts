// @vitest-environment node
// GĐ 2 — KẾ HOẠCH NGÀY (DE-XUAT-CA-NHAN-HOA-1909.md mục 1.3, nghiệm thu GĐ 2).
import { describe, it, expect } from 'vitest'
import worker from '../server/src/index'
import { gameToken } from '../server/src/game-v2-auth'
import { ghiSuKien } from '../server/src/su-kien-hoc'
import { docHoSoEm } from '../server/src/ho-so-nam-kt'
import { chayCaLop, chotNgayCu, hsKeHoachNgay, hsThoiGianHoc, lapVaLuuKeHoach } from '../server/src/ke-hoach-ngay-d1'
import { demChuoiDat, lapKeHoachNgay, tinhNganSach, tinhVanToc, type BtvnDauVao, type DauVaoKeHoach } from '../server/src/ke-hoach-ngay'
import { NGAN_SACH_SAN, NGAN_SACH_TRAN, PHIEN_BAN_KE_HOACH } from '../server/src/ho-so-cau-hinh'
import { goiWorker, taoD1That } from './_d1-that'

const NOW = Date.parse('2026-09-20T05:00:00.000Z') // 12:00 giờ VN, thứ Bảy 20/09
const H = 3_600_000
const iso = (gio: number) => new Date(NOW + gio * H).toISOString()
const dv = (o: Partial<DauVaoKeHoach> = {}): DauVaoKeHoach => ({
  sbd: 'S1', now: NOW, homNay: '2026-09-20', phutNgay: null, mauGiay: [], btvn: [], mom: [], cauToiHan: [], soCauChuaKhacPhuc: 0, dang: [],
  nhiemVuThanThu: [], caSapToi: [], lichSu: [], daLamHomNay: { soCau: 0, lenBac: 0, tutBac: 0 }, homNayLaNgayNghi: false, ...o,
})
/** Bài BTVN: giao cách hôm nay `giao` giờ (âm = đã giao), hạn sau `han` giờ. */
const bt = (ma: string, soCau: number, giao: number, han: number, lo = 0): BtvnDauVao => ({ ma, soCau, giaoLuc: iso(giao), hanNop: iso(han), loDaXong: lo, daNop: false })
const dangYeu = (maDang: string, o: Record<string, unknown> = {}) => ({ sbd: 'S1', maDang, soGap: 6, soSai: 5, soDaKhacPhuc: 1, soMoiSai: 3, soChuaThaySai: 0, bac: 1, mocOnKe: '2026-09-20', mocMoiSai: '2026-09-20', ...o })
const cauHan = (n: number) => Array.from({ length: n }, (_, i) => ({ qid: `Q${String(i).padStart(3, '0')}`, maDang: 'AA.BB', mocOnKe: '2026-09-19', lanSai: 1 + (i % 3) }))
const ids = (kh: ReturnType<typeof lapKeHoachNgay>) => kh.viec.map((v) => v.id)

describe('hàm thuần: tất định', () => {
  const day = dv({
    btvn: [bt('B2', 40, -24, 14 * 24), bt('B1', 30, -24, 48)], mom: [{ id: 'M1', soCau: 10, taoLuc: iso(-3), batDauLuc: iso(-0.5) }],
    cauToiHan: cauHan(20), dang: [dangYeu('D1'), dangYeu('D2', { soDaKhacPhuc: 0 })], mauGiay: [40, 50, 60, 70, 80, 90],
    lichSu: [{ ngay: '2026-09-19', ketQua: 'dat' }], caSapToi: [{ maCa: 'C1', tenCa: 'Ca thử', batDau: iso(30) }],
  })
  it('cùng đầu vào → cùng JSON, từng chữ (hai lần liên tiếp)', () => {
    expect(JSON.stringify(lapKeHoachNgay(day))).toBe(JSON.stringify(lapKeHoachNgay(day)))
  })
  it('không phụ thuộc thứ tự mảng đầu vào', () => {
    const dao = dv({ ...day, btvn: [...day.btvn].reverse(), cauToiHan: [...day.cauToiHan].reverse(), dang: [...day.dang].reverse(), mauGiay: [...day.mauGiay].reverse() })
    expect(JSON.stringify(lapKeHoachNgay(dao))).toBe(JSON.stringify(lapKeHoachNgay(day)))
  })
  it('không sửa đầu vào; có phiên bản và seed theo (sbd|ngày|phiên bản)', () => {
    const truoc = JSON.stringify(day)
    const kh = lapKeHoachNgay(day)
    expect(JSON.stringify(day)).toBe(truoc)
    expect(kh.phienBan).toBe(PHIEN_BAN_KE_HOACH)
    expect(lapKeHoachNgay(dv({ ...day, sbd: 'S2' })).seed).not.toBe(kh.seed)
  })
})

describe('EDF, tải khác và khả thi (nghiệm thu GĐ 2)', () => {
  // Em có 2 BTVN: hạn 2 ngày (30 câu) và hạn 14 ngày (42 câu), đều đã giao từ hôm qua.
  const hai = dv({ btvn: [bt('XA', 42, -24, 14 * 24), bt('GAN', 30, -24, 48)] })

  it('lô của bài hạn GẦN đứng trước bài hạn XA (dù khai báo ngược thứ tự)', () => {
    const kh = lapKeHoachNgay(hai)
    expect(ids(kh).filter((i) => i.startsWith('btvn_lo:')).map((i) => i.split(':')[1])).toEqual(['GAN', 'XA'])
    expect(kh.viec[0]!.thuTu).toBe(1)
    expect(kh.viec[1]!.cong).toBe(kh.viec[0]!.id)
  })

  it('bài hạn 14 ngày KHÔNG bóp lô hôm nay: phần câu/ngày nó đè lên bài khác < 1/7 số câu còn lại của nó', () => {
    const kh = lapKeHoachNgay(hai)
    const xa = kh.viec.find((v) => v.id.startsWith('btvn_lo:XA'))!.chiTiet as { taiMoiNgay: number; conLai: number; taiKhac: number }
    const gan = kh.viec.find((v) => v.id.startsWith('btvn_lo:GAN'))!.chiTiet as { taiMoiNgay: number; conLai: number; taiKhac: number }
    expect(xa.conLai).toBe(42)
    expect(xa.taiMoiNgay).toBe(Math.ceil(42 / 14)) // 3 câu/ngày
    expect(xa.taiMoiNgay).toBeLessThan(xa.conLai / 7)
    expect(gan.taiKhac).toBe(xa.taiMoiNgay) // tải khác của bài gần CHÍNH LÀ phần nhỏ đó, không phải cả 42 câu
    expect(gan.taiMoiNgay).toBe(Math.ceil(30 / 2)) // bài gần: 15 câu/ngày
  })

  it('kiểm khả thi: cần 15 câu/ngày (≤ trần 16) → khong_kip + đề xuất tăng tạm; KHÔNG cắt việc bắt buộc', () => {
    const kh = lapKeHoachNgay(dv({ btvn: [bt('GAN', 30, -24, 48)] }))
    const kb = kh.canhBao.find((c) => c.loai === 'khong_kip')!
    expect(kb).toMatchObject({ ma: 'GAN', conLai: 30, canMoiNgay: 15, deXuat: 'tang_tam' })
    expect(kh.viec.some((v) => v.id.startsWith('btvn_lo:GAN') && v.batBuoc)).toBe(true)
  })

  it('cần 60 câu/ngày → nói con số, đề xuất gia hạn, việc bắt buộc giữ nguyên + nhãn qua_tai', () => {
    const kh = lapKeHoachNgay(dv({ btvn: [bt('GAP', 60, -24, 24)] }))
    expect(kh.canhBao.find((c) => c.loai === 'khong_kip')).toMatchObject({ canMoiNgay: 60, deXuat: 'can_thay_gia_han' })
    const qt = kh.canhBao.find((c) => c.loai === 'qua_tai')!
    expect(qt.vuot).toBe(kh.tai.cung - kh.tai.nganSach)
    expect(kh.tai.cung).toBeGreaterThan(kh.tai.nganSach)
    expect(kh.tai.bu + kh.tai.tuyChon).toBe(0) // việc mềm bị cắt, việc cứng KHÔNG
    expect(kh.viec.filter((v) => v.batBuoc).length).toBeGreaterThan(0)
  })

  it('kịp hạn thì KHÔNG có cảnh báo khong_kip', () => {
    expect(lapKeHoachNgay(dv({ btvn: [bt('XA', 42, -24, 14 * 24)] })).canhBao.some((c) => c.loai === 'khong_kip')).toBe(false)
  })

  it('EDF cộng dồn: bài gần vừa đủ nhưng bài xa bị kẹt vì cộng dồn → cảnh báo đúng bài xa với số cộng dồn', () => {
    // 15 + 100 câu trong 5 ngày: bài gần 15/1 ngày ok (B≥…), bài xa cộng dồn 115 câu / 5 ngày = 23/ngày > trần.
    const kh = lapKeHoachNgay(dv({ btvn: [bt('GAN', 12, -24, 24), bt('XA', 100, -24, 5 * 24)] }))
    const kb = kh.canhBao.filter((c) => c.loai === 'khong_kip')
    expect(kb.some((c) => c.ma === 'XA' && c.conLai === 112 && c.canMoiNgay === 23 && c.deXuat === 'can_thay_gia_han')).toBe(true)
  })
})

describe('cổng hiển thị và nhãn khẩn', () => {
  it('việc bắt buộc sau chỉ HIỆN khi việc bắt buộc trước đã xong — trừ việc mang nhãn khẩn', () => {
    const kh = lapKeHoachNgay(dv({ btvn: [bt('B1', 20, -24, 120), bt('B2', 20, -24, 200)] }))
    const [a, b] = kh.viec.filter((v) => v.loai === 'btvn_lo')
    expect(a!.hien).toBe(true)
    expect(b!.hien).toBe(false)
    expect(b!.cong).toBe(a!.id)
  })
  it('hạn ≤ 24 giờ → khan_cap và luôn hiện, dù đứng sau; cổng không che hạn gần', () => {
    const kh = lapKeHoachNgay(dv({ btvn: [bt('GAN', 6, -24, 20), bt('XA', 20, -24, 200)] }))
    const g = kh.viec.find((v) => v.id.startsWith('btvn_lo:GAN'))!
    expect(g).toMatchObject({ khan: true, nhan: 'khan_cap', hien: true })
    expect(kh.viec[0]!.id).toBe(g.id) // EDF: hạn gần đứng đầu
    for (const v of kh.viec.filter((x) => x.khan)) expect(v.hien).toBe(true)
  })
  it('Mom đã bắt đầu: hạn cứng = bắt đầu + 120 phút, khẩn; Mom chưa bắt đầu không vào kế hoạch', () => {
    const kh = lapKeHoachNgay(dv({ mom: [{ id: 'M1', soCau: 8, taoLuc: iso(-5), batDauLuc: iso(-0.5) }, { id: 'M2', soCau: 8, taoLuc: iso(-5), batDauLuc: null }] }))
    const m = kh.viec.find((v) => v.id === 'mom:M1')!
    expect(m).toMatchObject({ batBuoc: true, khan: true, hanCung: iso(1.5) })
    expect(ids(kh)).not.toContain('mom:M2')
  })
  it('lô chưa tới mốc KHÔNG hiện như việc hôm nay mà nằm ở sapToi (xong sớm không mở sớm)', () => {
    // Bài 30 câu, khung 10 ngày: xong lô 0 rồi thì lô 1 chỉ mở ở mốc sau.
    const kh = lapKeHoachNgay(dv({ btvn: [bt('DAI', 30, -1, 10 * 24, 1)] }))
    expect(kh.sapToi).toHaveLength(1)
    expect(kh.sapToi[0]).toMatchObject({ ma: 'DAI', chiSo: 1 })
    expect(kh.viec.some((v) => v.id.startsWith('btvn_lo:DAI'))).toBe(false)
  })
  it('xong hết lô mà chưa nộp → việc nộp bài; quá hạn → liệt kê riêng, KHÔNG vào tải', () => {
    const kh = lapKeHoachNgay(dv({ btvn: [bt('XONG', 6, -48, 30, 99), bt('TRE', 12, -100, -5)] }))
    expect(ids(kh)).toContain('btvn_nop:XONG')
    expect(kh.quaHan).toEqual([{ loai: 'btvn', ma: 'TRE', hanNop: iso(-5), conLai: 12 }])
    expect(ids(kh).some((i) => i.includes('TRE'))).toBe(false)
  })
})

describe('bù khi thiếu ("tự phân thêm bài khi ngày thiếu") và việc mềm', () => {
  it('em KHÔNG có bài: có việc bù, tổng ≥ toiThieuCau, gắn nhãn bu, không việc bắt buộc, hiện ngay', () => {
    const kh = lapKeHoachNgay(dv({ cauToiHan: cauHan(20), dang: [dangYeu('D1')], soCauChuaKhacPhuc: 20 }))
    expect(kh.viec.every((v) => !v.batBuoc)).toBe(true)
    expect(kh.viec.length).toBeGreaterThan(0)
    expect(kh.viec[0]!.nhan).toBe('bu')
    expect(kh.tai.bu).toBeGreaterThanOrEqual(kh.nganSach.toiThieuCau)
    expect(kh.tai.bu).toBeLessThanOrEqual(kh.nganSach.mucTieuCau)
    expect(kh.viec.every((v) => v.hien)).toBe(true)
  })
  it('phần bù KHÔNG BAO GIỜ đẩy tổng vượt mục tiêu ngày, dù thần thú giao theo bội 6', () => {
    for (const n of [0, 1, 2, 3, 4, 5, 8, 20]) {
      for (const sai of [0, 12, 25]) {
        const kh = lapKeHoachNgay(dv({ cauToiHan: cauHan(n), dang: [dangYeu('D1')], soCauChuaKhacPhuc: sai }))
        expect(kh.tai.cung + kh.tai.bu).toBeLessThanOrEqual(kh.nganSach.mucTieuCau)
        if (n >= kh.nganSach.toiThieuCau) expect(kh.tai.bu).toBeGreaterThanOrEqual(kh.nganSach.toiThieuCau)
      }
    }
  })
  it('ôn tới hạn chiếm tối đa 40% mục tiêu; chọn theo mốc sớm rồi sai nhiều, tất định', () => {
    // Có nguồn thần thú lo phần còn lại → giữ đúng trần 40%. (Không có nguồn nào khác thì ôn được nới, xem test dưới.)
    const kh = lapKeHoachNgay(dv({ cauToiHan: cauHan(30), dang: [dangYeu('D1')] }))
    const on = kh.viec.find((v) => v.loai === 'on_lai')!
    expect(on.soCau).toBeLessThanOrEqual(Math.floor(0.4 * kh.nganSach.mucTieuCau))
    const qid = (on.chiTiet as { qid: string[] }).qid
    expect(qid).toHaveLength(on.soCau)
    // câu sai nhiều nhất (lanSai=3) được ưu tiên trong cùng mốc
    expect(cauHan(30).filter((c) => qid.includes(c.qid)).every((c) => c.lanSai >= 2)).toBe(true)
  })
  it('chữ hiển thị và danh sách câu KHỚP số câu thật của việc ôn (kể cả khi bị cắt xuống phần thiếu)', () => {
    for (const daLam of [0, 2, 3]) {
      const kh = lapKeHoachNgay(dv({ cauToiHan: cauHan(3), daLamHomNay: { soCau: daLam, lenBac: 0, tutBac: 0 } }))
      for (const v of kh.viec.filter((x) => x.loai === 'on_lai')) {
        expect((v.chiTiet as { qid: string[] }).qid).toHaveLength(v.soCau)
        expect(v.ghiChu).toContain(`Ôn ${v.soCau} câu`)
      }
    }
  })
  it('chỉ có câu ôn (không dạng yếu, không ca) mà thiếu tối thiểu → ôn được NỚI đúng phần thiếu, không quá ngân sách', () => {
    const kh = lapKeHoachNgay(dv({ cauToiHan: cauHan(30) }))
    expect(kh.tai.bu).toBe(kh.nganSach.toiThieuCau)
    expect(kh.viec.find((v) => v.loai === 'on_lai')!.soCau).toBe(kh.nganSach.toiThieuCau)
  })
  it('em còn nợ bài ít, chưa đủ tối thiểu → bù phần thiếu; đã làm đủ hôm nay → KHÔNG bù thêm', () => {
    const ap = lapKeHoachNgay(dv({ btvn: [bt('B', 3, -1, 200)], cauToiHan: cauHan(20), dang: [dangYeu('D1')] }))
    expect(ap.tai.bu).toBeGreaterThan(0)
    const du = lapKeHoachNgay(dv({ btvn: [bt('B', 3, -1, 200)], cauToiHan: cauHan(20), dang: [dangYeu('D1')], daLamHomNay: { soCau: 10, lenBac: 2, tutBac: 0 } }))
    expect(du.tai.bu).toBe(0)
    expect(du.tienBo.dat).toBe(true)
  })
  it('thần thú theo bội 6 và lấy DẠNG YẾU NHẤT; nhiệm vụ phụ huynh nhắc thì đi trước', () => {
    const kh = lapKeHoachNgay(dv({ dang: [dangYeu('D1', { soDaKhacPhuc: 2 }), dangYeu('D2', { soDaKhacPhuc: 0 })] }))
    const tt = kh.viec.find((v) => v.loai === 'than_thu')!
    expect(tt.soCau % 6).toBe(0)
    expect(tt.chiTiet).toEqual({ dang: 'D2' })
    const ph = lapKeHoachNgay(dv({ dang: [dangYeu('D2')], nhiemVuThanThu: [{ id: 't1', dang: 'D9' }] }))
    expect(ph.viec.find((v) => v.loai === 'than_thu')!.chiTiet).toEqual({ dang: 'D9' })
  })
  it('dạng rơi về chuyên đề (CD:) không dùng để giao thần thú', () => {
    expect(lapKeHoachNgay(dv({ dang: [dangYeu('CD:Este')] })).viec.some((v) => v.loai === 'than_thu')).toBe(false)
  })
  it('hồ sơ còn mỏng, chưa có gì để bù → NÓI RA (thieu_nguon_bu), không bịa việc', () => {
    const kh = lapKeHoachNgay(dv())
    expect(kh.viec).toEqual([])
    expect(kh.canhBao.find((c) => c.loai === 'thieu_nguon_bu')).toMatchObject({ can: kh.nganSach.toiThieuCau })
  })
  it('ôn thi là việc MỀM: ca trong 3 ngày thì có, xa hơn thì không', () => {
    const gan = lapKeHoachNgay(dv({ caSapToi: [{ maCa: 'C1', tenCa: 'Ca thử', batDau: iso(30) }] }))
    expect(gan.viec.find((v) => v.loai === 'on_thi')).toMatchObject({ soCau: 4, batBuoc: false, nguon: 'C1' })
    expect(lapKeHoachNgay(dv({ caSapToi: [{ maCa: 'C1', tenCa: 'x', batDau: iso(24 * 5) }] })).viec.some((v) => v.loai === 'on_thi')).toBe(false)
  })
})

describe('ngân sách ngày: tốc độ đo thật, phút học chỉ hạ, lịch sử 7 ngày', () => {
  it('thiếu mẫu giây → 90 giây/câu và NÓI RA số mẫu (2/5); đủ mẫu thì lấy trung vị đã kẹp', () => {
    const it2 = tinhVanToc([40, 60, 2, 5000]) // 2 và 5000 bị lọc [5,1200] → còn 2 mẫu
    expect(it2).toMatchObject({ giay: 90, nguon: 'mac_dinh', soMau: 2 })
    expect(it2.ghiChu).toContain('2/5')
    expect(tinhVanToc([50, 60, 70, 80, 100])).toMatchObject({ giay: 70, nguon: 'do', soMau: 5 })
    expect(tinhVanToc([10, 10, 10, 10, 10]).giay).toBe(45) // kẹp sàn 45
    expect(tinhVanToc([900, 900, 900, 900, 900]).giay).toBe(240) // kẹp trần 240
    const kh = lapKeHoachNgay(dv({ mauGiay: [40, 60] }))
    expect(kh.canhBao.find((c) => c.loai === 'chua_do_toc_do')).toMatchObject({ soMau: 2, can: 5 })
    expect(kh.nganSach).toMatchObject({ vanTocNguon: 'mac_dinh', vanTocGiay: 90 })
  })
  it('luôn nằm trong [8, 16]; phút/ngày CHỈ HẠ (mặc định 20 phút ở 90 s = 13 câu; 45 phút không nâng vượt mức gốc)', () => {
    const goc = tinhNganSach(dv({ phutNgay: 45 }), 0).mucTieuCau
    expect(tinhNganSach(dv({ phutNgay: null }), 0).mucTieuCau).toBeLessThanOrEqual(13)
    expect(tinhNganSach(dv({ phutNgay: 10 }), 0).mucTieuCau).toBe(NGAN_SACH_SAN) // 10 phút = 6 câu, sàn 8
    for (const p of [10, 15, 20, 30, 45]) {
      const b = tinhNganSach(dv({ phutNgay: p }), 0).mucTieuCau
      expect(b).toBeGreaterThanOrEqual(NGAN_SACH_SAN)
      expect(b).toBeLessThanOrEqual(Math.min(NGAN_SACH_TRAN, goc))
    }
  })
  it('7 ngày có ≥ 3 ngày không đạt → −2; 7/7 đạt và tốc độ < 75 s → +2 (trần 16); ngày nghỉ bị bỏ qua', () => {
    const ls = (kq: ('dat' | 'khong' | 'mot_phan' | null)[]) => kq.map((k, i) => ({ ngay: `2026-09-${String(19 - i).padStart(2, '0')}`, ketQua: k }))
    const nen = tinhNganSach(dv({ phutNgay: 45, mauGiay: [40, 40, 40, 40, 40] }), 0)
    const giam = tinhNganSach(dv({ phutNgay: 45, mauGiay: [40, 40, 40, 40, 40], lichSu: ls(['khong', 'dat', 'khong', null, 'khong', 'dat', 'dat']) }), 0)
    expect(giam.mucTieuCau).toBe(Math.max(NGAN_SACH_SAN, nen.mucTieuCau - 2))
    expect(giam.dieuChinh[0]).toMatchObject({ delta: -2 })
    const tang = tinhNganSach(dv({ phutNgay: 45, mauGiay: [40, 40, 40, 40, 40], lichSu: ls(['dat', 'dat', 'dat', 'dat', 'dat', 'dat', 'dat']) }), 0)
    expect(tang.mucTieuCau).toBe(Math.min(NGAN_SACH_TRAN, nen.mucTieuCau + 2))
    // Chỉ 2 ngày không đạt: không giảm.
    expect(tinhNganSach(dv({ phutNgay: 45, mauGiay: [40, 40, 40, 40, 40], lichSu: ls(['khong', 'dat', 'khong', 'dat']) }), 0).mucTieuCau).toBe(nen.mucTieuCau)
  })
  it('toiThieuCau = clamp(round(mụcTiêu/2), 4, 8)', () => {
    for (const p of [10, 20, 45]) {
      const n = tinhNganSach(dv({ phutNgay: p }), 0)
      expect(n.toiThieuCau).toBe(Math.max(4, Math.min(8, Math.round(n.mucTieuCau / 2))))
    }
  })
  it('số câu sai CHƯA KHẮC PHỤC làm đầu vào: hết sai thì hết "kẹt" giảm tải; nhiều bài chưa nộp thì giảm', () => {
    const it0 = tinhNganSach(dv({ phutNgay: 45, soCauChuaKhacPhuc: 0 }), 0).mucTieuCau
    expect(tinhNganSach(dv({ phutNgay: 45, soCauChuaKhacPhuc: 25 }), 0).mucTieuCau).toBeLessThanOrEqual(it0)
    // Hàm gốc `tinhNganSachNgay` (không đổi): ≥ 6 bài chưa nộp → 10 câu; ≥ 15 bài → 8 câu.
    expect(tinhNganSach(dv({ phutNgay: 45 }), 6).mucTieuCau).toBeLessThanOrEqual(10)
    expect(tinhNganSach(dv({ phutNgay: 45 }), 15).mucTieuCau).toBe(8)
  })
})

describe('tiến bộ trong ngày và chuỗi', () => {
  it('"đạt" cần đủ toiThieuCau câu ĐÃ LÀM (nộp ≠ nắm): chưa làm gì thì chưa đạt dù đã có việc', () => {
    const kh = lapKeHoachNgay(dv({ cauToiHan: cauHan(5) }))
    expect(kh.tienBo).toMatchObject({ dat: false, daLamCau: 0, conThieu: kh.nganSach.toiThieuCau })
  })
  it('chuỗi ngày đạt: ngày nghỉ (null) không đứt; ngày "một phần"/"không" đứt', () => {
    const d = (kq: ('dat' | 'khong' | 'mot_phan' | null)[]) => demChuoiDat(kq.map((k, i) => ({ ngay: `d${i}`, ketQua: k })))
    expect(d(['dat', 'dat', null, 'dat', 'khong', 'dat'])).toBe(3)
    expect(d(['mot_phan', 'dat'])).toBe(0)
    expect(d([null, null, 'dat'])).toBe(1)
    expect(d([])).toBe(0)
  })
})

// ===========================================================================
describe('D1 thật: /hs/ke-hoach-ngay, lưu, chốt ngày, cron', () => {
  const now = () => Date.now()
  const isoT = (gio: number) => new Date(Date.now() + gio * H).toISOString()

  function seedBtvn(d: ReturnType<typeof taoD1That>, sbd: string, ma: string, soCau: number, giaoGio: number, hanGio: number, lo = 0) {
    d.sql.prepare('INSERT INTO btvn(ma_btvn,ma_ca,ma_de,so_cau,giao_luc,han_nop,da_xoa,cap_nhat_luc) VALUES(?,?,?,?,?,?,0,?)').run(ma, 'CA', 'DE', soCau, isoT(giaoGio), isoT(hanGio), 'x')
    d.sql.prepare('INSERT INTO btvn_em(khoa,ma_btvn,sbd,lo_da_xong) VALUES(?,?,?,?)').run(`${ma}|${sbd}`, ma, sbd, lo)
  }

  it('em có 2 BTVN (hạn 2 ngày và 14 ngày): lô bài gần đứng trước; bài xa < 1/7 số câu còn lại/ngày', async () => {
    const d = taoD1That()
    seedBtvn(d, 'S1', 'XA', 42, -24, 14 * 24)
    seedBtvn(d, 'S1', 'GAN', 30, -24, 48)
    const kh = await goiWorker(worker, d.env, '/hs/ke-hoach-ngay', { sbd: 'S1' })
    expect(kh.ok).toBe(true)
    const lo = kh.viec.filter((v: { loai: string }) => v.loai === 'btvn_lo')
    expect(lo.map((v: { nguon: string }) => v.nguon)).toEqual(['GAN', 'XA'])
    const xa = lo[1].chiTiet
    expect(xa.taiMoiNgay).toBeLessThan(xa.conLai / 7)
    expect(kh.canhBao.some((c: { loai: string }) => c.loai === 'khong_kip')).toBe(true) // 30 câu trong 2 ngày > mục tiêu ngày
    expect(kh.nganSach.mucTieuCau).toBeGreaterThanOrEqual(8)
  })

  it('em KHÔNG có bài nhưng có hồ sơ: có việc bu đủ toiThieuCau (hồ sơ tự dựng từ sổ lúc lập kế hoạch)', async () => {
    const d = taoD1That()
    d.sql.exec(`INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES('D','Q1','v','g','AA.BB.CC','{}'),('D','Q2','v','g2','AA.BB.CC','{}')`)
    const luc = isoT(-30)
    await ghiSuKien(d.env, ['Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6'].map((q, i) => ({ nguon: 'btvn' as const, maNguon: 'B', sbd: 'S1', qid: q, lan: i + 1, ketQua: 0 as const, luc })))
    const kh = await goiWorker(worker, d.env, '/hs/ke-hoach-ngay', { sbd: 'S1' })
    expect(kh.viec.length).toBeGreaterThan(0)
    expect(kh.viec.every((v: { batBuoc: boolean }) => !v.batBuoc)).toBe(true)
    expect(kh.tai.bu).toBeGreaterThanOrEqual(kh.nganSach.toiThieuCau)
    expect((await docHoSoEm(d.env, 'S1')).cau).toHaveLength(6) // hồ sơ đã được dựng
  })

  it('lưu một dòng/em/ngày, lập lại thì CẬP NHẬT (không đẻ dòng); ngày đã chốt KHÔNG bị ghi đè', async () => {
    const d = taoD1That()
    seedBtvn(d, 'S1', 'GAN', 30, -24, 48)
    await hsKeHoachNgay(d.env, { sbd: 'S1' })
    await hsKeHoachNgay(d.env, { sbd: 'S1' })
    expect(d.dem('ke_hoach_ngay')).toBe(1)
    const r = d.sql.prepare('SELECT * FROM ke_hoach_ngay').get() as Record<string, unknown>
    expect(r).toMatchObject({ sbd: 'S1', phien_ban: PHIEN_BAN_KE_HOACH, ket_qua: null })
    expect(JSON.parse(String(r.viec_json)).viec.length).toBeGreaterThan(0)
    d.sql.exec("UPDATE ke_hoach_ngay SET ket_qua = 'dat', so_cau_da_lam = 99")
    seedBtvn(d, 'S1', 'B2', 10, -1, 100)
    await hsKeHoachNgay(d.env, { sbd: 'S1' })
    expect(d.sql.prepare('SELECT ket_qua, so_cau_da_lam FROM ke_hoach_ngay').get()).toMatchObject({ ket_qua: 'dat', so_cau_da_lam: 99 })
  })

  it('hồ sơ dựng lại khi sổ đổi: đúng thêm một lần ở ngày khác → hồ sơ cập nhật ở lần lập kế hoạch kế tiếp', async () => {
    const d = taoD1That()
    const k = (ketQua: 0 | 1, gio: number, lan: number) => ({ nguon: 'btvn' as const, maNguon: 'B', sbd: 'S1', qid: 'Q1', lan, ketQua, luc: isoT(gio) })
    await ghiSuKien(d.env, [k(0, -50, 1)])
    await hsKeHoachNgay(d.env, { sbd: 'S1' })
    expect((await docHoSoEm(d.env, 'S1')).cau[0]).toMatchObject({ trangThai: 'moi_sai', lanGap: 1 })
    await ghiSuKien(d.env, [k(1, -1, 2)])
    await hsKeHoachNgay(d.env, { sbd: 'S1' })
    expect((await docHoSoEm(d.env, 'S1')).cau[0]).toMatchObject({ trangThai: 'dang_on', lanGap: 2 })
  })

  it('chốt ngày: đủ câu + có câu lên bậc → dat; có làm ít → mot_phan; không làm → khong; ngày nghỉ KHÔNG chốt', async () => {
    const d = taoD1That()
    const homQua = '2026-09-19'
    const homNay = '2026-09-20'
    const nowMs = Date.parse('2026-09-20T05:00:00.000Z')
    const dongKh = (sbd: string, nghi = 0) => d.sql.prepare(
      'INSERT INTO ke_hoach_ngay(khoa,sbd,ngay,phien_ban,seed,ngan_sach_json,viec_json,canh_bao_json,la_ngay_nghi,cap_nhat_luc) VALUES(?,?,?,?,?,?,?,?,?,?)',
    ).run(`${sbd}|${homQua}`, sbd, homQua, 1, 1, JSON.stringify({ toiThieuCau: 4 }), JSON.stringify({ tienBo: { soCauToiHan: 3, treNhip: false } }), '[]', nghi, 'x')
    for (const s of ['A', 'B', 'C', 'D']) dongKh(s, s === 'D' ? 1 : 0)
    const sk = (sbd: string, qid: string, ketQua: 0 | 1, ngay: string, lan = 1) => ({ nguon: 'btvn' as const, maNguon: `B${ngay}`, sbd, qid, lan, ketQua, luc: `${ngay}T03:00:00.000Z` })
    await ghiSuKien(d.env, [
      // A: hôm trước sai Q1, hôm qua đúng lại Q1 (lên bậc) + 3 câu khác → 4 câu, có lên bậc ⇒ dat
      sk('A', 'Q1', 0, '2026-09-10'), sk('A', 'Q1', 1, homQua), sk('A', 'Q2', 1, homQua), sk('A', 'Q3', 1, homQua), sk('A', 'Q4', 1, homQua),
      // B: 1 câu ⇒ mot_phan
      sk('B', 'Q9', 1, homQua),
    ])
    const daChot = await chotNgayCu(d.env, ['A', 'B', 'C', 'D'], homNay, new Date(nowMs).toISOString())
    expect(daChot).toBe(3)
    const kq = Object.fromEntries((d.sql.prepare('SELECT sbd, ket_qua, so_cau_da_lam, so_cau_len_bac FROM ke_hoach_ngay').all() as Record<string, unknown>[]).map((x) => [x.sbd, x]))
    expect(kq.A).toMatchObject({ ket_qua: 'dat', so_cau_da_lam: 4, so_cau_len_bac: 1 })
    expect(kq.B).toMatchObject({ ket_qua: 'mot_phan', so_cau_da_lam: 1 })
    expect(kq.C).toMatchObject({ ket_qua: 'khong', so_cau_da_lam: 0 })
    expect(kq.D).toMatchObject({ ket_qua: null }) // ngày nghỉ: không chốt, không đứt chuỗi
    expect(await chotNgayCu(d.env, ['A', 'B', 'C', 'D'], homNay, 'x')).toBe(0) // chốt rồi không chốt lại
  })

  it('đủ số câu nhưng không có câu lên bậc trong khi có câu tới hạn → chỉ mot_phan (đạt phải có tiến bộ thật)', async () => {
    const d = taoD1That()
    d.sql.prepare('INSERT INTO ke_hoach_ngay(khoa,sbd,ngay,phien_ban,seed,ngan_sach_json,viec_json,canh_bao_json,cap_nhat_luc) VALUES(?,?,?,?,?,?,?,?,?)')
      .run('A|2026-09-19', 'A', '2026-09-19', 1, 1, JSON.stringify({ toiThieuCau: 2 }), JSON.stringify({ tienBo: { soCauToiHan: 5, treNhip: false } }), '[]', 'x')
    await ghiSuKien(d.env, ['Q1', 'Q2', 'Q3'].map((q) => ({ nguon: 'btvn' as const, maNguon: 'B', sbd: 'A', qid: q, lan: 1, ketQua: 1 as const, luc: '2026-09-19T03:00:00.000Z' })))
    await chotNgayCu(d.env, ['A'], '2026-09-20', 'x')
    expect(d.sql.prepare('SELECT ket_qua FROM ke_hoach_ngay').get()).toMatchObject({ ket_qua: 'mot_phan' })
  })

  it('chuỗi ngày tiến bộ đọc từ lịch sử đã chốt, ngày nghỉ của thầy (cau_hinh.ngay_nghi) không đứt', async () => {
    const d = taoD1That()
    const hom = new Date(now() + 7 * H)
    const ngay = (n: number) => new Date(hom.getTime() - n * 24 * H).toISOString().slice(0, 10)
    const them = (n: number, kq: string | null) => d.sql.prepare('INSERT INTO ke_hoach_ngay(khoa,sbd,ngay,phien_ban,seed,ngan_sach_json,viec_json,canh_bao_json,ket_qua,cap_nhat_luc) VALUES(?,?,?,?,?,?,?,?,?,?)')
      .run(`S1|${ngay(n)}`, 'S1', ngay(n), 1, 1, '{}', '{}', '[]', kq, 'x')
    them(1, 'dat'); them(3, 'dat'); them(4, 'khong') // ngày 2 chưa có dòng nhưng là ngày nghỉ
    d.sql.prepare("INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('ngay_nghi',?,?)").run(JSON.stringify([ngay(2)]), 'x')
    const kh = await goiWorker(worker, d.env, '/hs/ke-hoach-ngay', { sbd: 'S1' })
    expect(kh.chuoiDat).toBe(2)
  })

  it('em đặt phút/ngày (cần token, 10–45): kế hoạch phản ánh; token sai/không hợp lệ bị từ chối', async () => {
    const d = taoD1That()
    d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,mat_khau,cap_nhat_luc) VALUES('S1','Em','mk','x')").run()
    const token = await gameToken(d.env, 'S1')
    expect((await goiWorker(worker, d.env, '/hs/thoi-gian-hoc', { token, phut: 5 })).ok).toBe(false)
    expect((await goiWorker(worker, d.env, '/hs/thoi-gian-hoc', { token, phut: 46 })).ok).toBe(false)
    await expect(hsThoiGianHoc(d.env, { token: token + 'x', phut: 20 })).rejects.toThrow()
    expect((await goiWorker(worker, d.env, '/hs/thoi-gian-hoc', { token, phut: 10 })).ok).toBe(true)
    const kh = await goiWorker(worker, d.env, '/hs/ke-hoach-ngay', { token })
    expect(kh.nganSach).toMatchObject({ phutNgay: 10, phutNgayLaMacDinh: false, mucTieuCau: 8 })
    const mac = await goiWorker(worker, taoD1That().env, '/hs/ke-hoach-ngay', { sbd: 'S9' })
    expect(mac.nganSach).toMatchObject({ phutNgay: 20, phutNgayLaMacDinh: true })
  })

  it('cron cả lớp: lập kế hoạch cho mọi em (không khoá), chốt ngày cũ; ≤ 50 em/lô và số câu truy vấn KHÔNG tăng theo số em', async () => {
    const d = taoD1That()
    for (let i = 0; i < 120; i++) d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,trang_thai,cap_nhat_luc) VALUES(?,?,?,?)").run(`E${String(i).padStart(3, '0')}`, 'x', i === 7 ? 'khoa' : 'da_duyet', 'x')
    const truoc = d.soLenh.prepare
    const r = await chayCaLop(d.env, Date.now())
    expect(r).toMatchObject({ soEm: 119, soLo: 3, daLap: 119 }) // 119 = 120 − 1 em bị khoá
    expect(d.dem('ke_hoach_ngay')).toBe(119)
    // 3 lô × (~16 truy vấn) — không phải 119 × 16.
    expect(d.soLenh.prepare - truoc).toBeLessThan(3 * 25 + 5)
    // Lần thứ hai: cập nhật, không nhân đôi.
    await chayCaLop(d.env, Date.now())
    expect(d.dem('ke_hoach_ngay')).toBe(119)
  })

  it('cron 00:01 VN (scheduled): chạy kế hoạch cả lớp NGOÀI hai việc cũ (tin phụ huynh, vinh danh); cron phút vẫn chạy đường thông báo', async () => {
    const d = taoD1That()
    d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,trang_thai,cap_nhat_luc) VALUES('S1','x','da_duyet','x')").run()
    await worker.scheduled({ cron: '1 17 * * *' }, d.env)
    expect(d.dem('ke_hoach_ngay', "sbd='S1'")).toBe(1)
    const truoc = d.dem('ke_hoach_ngay')
    await worker.scheduled({ cron: '* * * * *' }, d.env) // cron thông báo KHÔNG động vào kế hoạch
    expect(d.dem('ke_hoach_ngay')).toBe(truoc)
  })

  it('đường thầy /ke-hoach/chay-ca-lop đòi mã bí mật; đường em công khai', async () => {
    const d = taoD1That()
    d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,trang_thai,cap_nhat_luc) VALUES('S1','x','da_duyet','x')").run()
    expect((await goiWorker(worker, d.env, '/ke-hoach/chay-ca-lop', {})).ok).toBe(false)
    expect(await goiWorker(worker, d.env, '/ke-hoach/chay-ca-lop', {}, true)).toMatchObject({ ok: true, soEm: 1, daLap: 1 })
    expect((await goiWorker(worker, d.env, '/hs/ke-hoach-ngay', {})).ok).toBe(false) // thiếu SBD
  })

  it('chưa chạy migration/thiếu bảng hồ sơ: vẫn trả kế hoạch (bảng thiếu coi như trống), không sập', async () => {
    const d = taoD1That()
    seedBtvn(d, 'S1', 'GAN', 30, -24, 48)
    d.sql.exec('DROP TABLE ke_hoach_ngay; DROP TABLE nam_kt_cau; DROP TABLE nam_kt_dang; DROP TABLE su_kien_hoc')
    const kh = await goiWorker(worker, d.env, '/hs/ke-hoach-ngay', { sbd: 'S1' })
    expect(kh.ok).toBe(true)
    expect(kh.viec.some((v: { loai: string }) => v.loai === 'btvn_lo')).toBe(true)
  })

  it('lập hai lần liên tiếp trên cùng dữ liệu → cùng kế hoạch (trừ giờ cập nhật)', async () => {
    const d = taoD1That()
    seedBtvn(d, 'S1', 'GAN', 30, -24, 48)
    seedBtvn(d, 'S1', 'XA', 42, -24, 14 * 24)
    const t = Date.now()
    const a = (await lapVaLuuKeHoach(d.env, ['S1'], t)).get('S1')!
    const b = (await lapVaLuuKeHoach(d.env, ['S1'], t)).get('S1')!
    expect(JSON.stringify(a)).toBe(JSON.stringify(b))
  })
})
