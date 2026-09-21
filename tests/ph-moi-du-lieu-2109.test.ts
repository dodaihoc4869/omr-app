// APP PHỤ HUYNH MỚI — lớp ĐỌC CHẶT hai lệnh máy chủ (src/lib/ph-moi/): khối sai dạng ⇒ VẮNG; câu bị CHE không bao giờ giữ đề/đáp án/đúng-sai/tên dạng/mã câu dù JSON lỡ có; ca chưa công bố không điểm;
// trần mảng; định dạng giờ VN không phụ thuộc múi giờ máy; nhãn tiếng Việt; hook nạp (60 s, giữ bản cũ khi lỗi). Không trường game.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { docChiTietCau, docTatCaVeCon } from '../src/lib/ph-moi/du-lieu'
import { chuCaiTen, chuThoiGian, gioVn, ngayChuoiNgan, ngayDayDuVn, soVn, thuNgayVn, thuTuChuoiNgay } from '../src/lib/ph-moi/dinh-dang'
import { taiChiTietCau, taiTatCaVeCon } from '../src/lib/ph-moi/api'
import { CHU_CHE, NHAN_NGUON, chuCongBoCa, tenMoc } from '../src/components/ph-moi/nhan'
import { PH_OK, PH_TRONG, CHI_TIET } from './_ph-moi/du-lieu-mau'

vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may.test' }))
const doc = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8')
const nhan = (o: unknown) => JSON.parse(JSON.stringify(o))

describe('docTatCaVeCon — đọc chặt', () => {
  it('thân đúng ⇒ dựng đủ chín khối; câu thường giữ đề + đáp án + mã câu; số đúng theo hợp đồng', () => {
    const pm = docTatCaVeCon(PH_OK)!
    expect(pm.hoTen).toBe('Nguyễn Minh Khôi')
    expect(pm.caGanNhat!.ketQua).toEqual({ tong: 7.5, soCau: 28, soCauDung: 21 })
    expect(pm.caGanNhat!.truoc).toEqual({ tong: 6.75, doi: 0.75 })
    expect(pm.caGanNhat!.phan.map((p) => p.ma)).toEqual(['I', 'II', 'III'])
    expect(pm.tongQuan).toMatchObject({ soCau: 38, soDung: 30, phutHoc: 52, datNhiemVu: true, chuoiNgayHoc: 6 })
    expect(pm.dongThoiGian).toHaveLength(5)
    expect(pm.cau).toHaveLength(38)
    const c = pm.cau![0]!
    expect(c.kieu).toBe('thuong')
    if (c.kieu === 'thuong') expect(c).toMatchObject({ nguon: 'on_lai', conChon: 'B', dapAn: 'B', coLoiGiai: true, qid: 'q-on_lai-0' })
    expect(pm.manhYeu!.lamTot).toHaveLength(3)
    expect(pm.manhYeu!.conVap).toHaveLength(2)
    expect(pm.baiTapVeNha!.dangChay[0]).toMatchObject({ ten: 'Ester – Lipid', changXong: 2, changTong: 5 })
    expect(pm.lichOn).toEqual({ homNay: 0, ngayMai: 7, daKhacPhuc14Ngay: 12, conSaiChuaKhacPhuc: 19 })
    expect(pm.doCham).toEqual({ hang: 9, siSo: 42 })
    expect(pm.giaoThemConLai).toBe(2)
    expect(pm.phuHuynhLamGi).toHaveLength(2)
  })

  it('không phải thân của lệnh này ⇒ null: ok≠true, thiếu tên con, không phải đối tượng', () => {
    for (const x of [null, undefined, 'x', [], {}, { ok: false, error: 'lỗi' }, { ok: true }, { ok: true, hoTen: '   ' }]) expect(docTatCaVeCon(x), JSON.stringify(x)).toBeNull()
  })

  it('con mới hoàn toàn: chỉ {ok, hoTen, giaoThem} ⇒ mọi khối null/rỗng (KHÔNG số 0 giả, KHÔNG mảng bịa)', () => {
    const pm = docTatCaVeCon(PH_TRONG)!
    for (const k of ['caGanNhat', 'tienBo', 'tongQuan', 'dongThoiGian', 'cau', 'nhipHoc', 'bacTheoDang', 'dangVap', 'vuaLenBac', 'manhYeu', 'baiTapVeNha', 'lichOn', 'loiBoNao', 'doCham'] as const) expect(pm[k], k).toBeNull()
    expect(pm.phuHuynhLamGi).toEqual([])
    expect(pm.giaoThemConLai).toBe(3)
  })

  it('CÂU BỊ CHE chỉ giữ {luc, nguon, che, giay}: đề, đáp án, đúng/sai, tên dạng, mã câu, lời giải BỊ BỎ dù JSON lỡ có', () => {
    const raw = nhan(PH_OK)
    raw.homNay.cau = [{ luc: PH_OK.homNay.cau[0].luc, nguon: 'btvn', che: 'chua_nop', giay: 44, deRutGon: 'ĐỀ LỘ', dapAn: 'C', conChon: 'A', dung: true, tenDang: 'DẠNG LỘ', qid: 'q-lo', coLoiGiai: true }]
    const c = docTatCaVeCon(raw)!.cau![0]!
    expect(c).toEqual({ kieu: 'che', luc: PH_OK.homNay.cau[0].luc, nguon: 'btvn', che: 'chua_nop', giay: 44 })
    expect(JSON.stringify(c)).not.toMatch(/ĐỀ LỘ|DẠNG LỘ|q-lo|"dapAn"|"dung"/)
    // che lạ ⇒ KHÔNG coi là câu thường có che (bỏ hẳn vì thiếu đề)
    raw.homNay.cau = [{ luc: PH_OK.homNay.cau[0].luc, nguon: 'btvn', che: 'gi_do', deRutGon: 'Đề', dapAn: 'A' }]
    expect(docTatCaVeCon(raw)!.cau![0]!.kieu).toBe('thuong')
  })

  it('MỐC bị che: không số câu / số đúng dù JSON lỡ có; ghiChu lạ bỏ; phút tối thiểu 1; sắp cũ→mới', () => {
    const raw = nhan(PH_OK)
    raw.homNay.dongThoiGian = [
      { batDau: PH_OK.homNay.dongThoiGian[1].batDau, nguon: 'btvn', ten: 'B', soCau: 12, soDung: 9, che: 'chua_nop', phut: 0, ghiChu: 'lạ' },
      { batDau: PH_OK.homNay.dongThoiGian[0].batDau, nguon: 'on_lai', soCau: 6, soDung: 5, phut: 7 },
    ]
    const d = docTatCaVeCon(raw)!.dongThoiGian!
    expect(d.map((m) => m.nguon)).toEqual(['on_lai', 'btvn'])
    expect(d[1]).toMatchObject({ soCau: null, soDung: null, che: 'chua_nop', phut: 1, ghiChu: '' })
    expect(d[0]).toMatchObject({ soCau: 6, soDung: 5 })
  })

  it('ca CHƯA công bố: không điểm / số câu / phần / so sánh dù JSON lỡ có; thiếu tên ca ⇒ "Ca <mã>"', () => {
    const raw = nhan(PH_OK)
    raw.caGanNhat = { maCa: 'CA-9', nopLuc: '2026-09-19T02:12:00Z', congBo: { congBo: 'khong', daCongBo: false, soEmDaNop: 1, soEmDaVao: 2 }, ketQua: { tong: 9.9, soCau: 28, soCauDung: 28 }, truoc: { tong: 1, doi: 8.9 }, phan: [{ ma: 'I', dung: 1, tong: 2, diem: 1 }] }
    const ca = docTatCaVeCon(raw)!.caGanNhat!
    expect(ca).toMatchObject({ tenCa: 'Ca CA-9', ketQua: null, truoc: null, phan: [] })
    expect(chuCongBoCa(ca)).toBe('Điểm và từng câu sẽ hiện khi Thầy công bố.')
    raw.caGanNhat.congBo = { congBo: 'ca_lop_xong', daCongBo: false, soEmDaNop: 27, soEmDaVao: 32 }
    expect(chuCongBoCa(docTatCaVeCon(raw)!.caGanNhat!)).toBe('Điểm hiện khi cả lớp nộp xong (27/32 em đã nộp).')
    raw.caGanNhat.congBo = { congBo: 'ca_lop_xong', daCongBo: false, soEmDaNop: 40, soEmDaVao: 32 } // số vô lý ⇒ không in "40/32"
    expect(chuCongBoCa(docTatCaVeCon(raw)!.caGanNhat!)).toBe('Điểm hiện khi cả lớp nộp xong.')
  })

  it('khối sai dạng ⇒ vắng: tổng quan toàn null, lichOn thiếu một số, doCham hạng > sĩ số, nhịp có ngày sai dạng, tỉ lệ đúng > 1', () => {
    const raw = nhan(PH_OK)
    raw.homNay.tongQuan = { soCau: 'x', soDung: -1, phutHoc: null }
    raw.lichOn = { homNay: 1, ngayMai: 2, daKhacPhuc14Ngay: 3 }
    raw.doCham = { hang: 50, siSo: 42 }
    raw.nhipHoc = { ngay: [{ ngay: '21/09', soCau: 5, soCauDung: 3 }, { ngay: '2026-09-21', soCau: 5, soCauDung: 9 }] }
    const pm = docTatCaVeCon(raw)!
    expect(pm.tongQuan).toBeNull()
    expect(pm.lichOn).toBeNull()
    expect(pm.doCham).toBeNull()
    expect(pm.nhipHoc).toBeNull()
    const r2 = nhan(PH_OK)
    r2.homNay.tongQuan.soVoiHomQua = { soCau: 10, tiLeDung: 1.5 }
    expect(docTatCaVeCon(r2)!.tongQuan!.soVoiHomQua).toBeNull()
  })

  it('viecXong / viecTong (vòng "N/M việc đã xong" của màn chính): chỉ khi máy chủ trả ĐỦ cả hai và hợp lý (tổng > 0, xong ≤ tổng); máy chủ chưa có ⇒ cả hai null (không bịa)', () => {
    const cho = (x: unknown, t: unknown) => {
      const r = nhan(PH_OK)
      r.homNay.tongQuan.viecXong = x
      r.homNay.tongQuan.viecTong = t
      const q = docTatCaVeCon(r)!.tongQuan!
      return [q.viecXong, q.viecTong]
    }
    expect(docTatCaVeCon(PH_OK)!.tongQuan).toMatchObject({ viecXong: null, viecTong: null })
    expect(cho(3, 4)).toEqual([3, 4])
    expect(cho(0, 4)).toEqual([0, 4])
    expect(cho(4, 4)).toEqual([4, 4])
    expect(cho(5, 4)).toEqual([null, null]) // xong > tổng: vô lý
    expect(cho(0, 0)).toEqual([null, null]) // tổng 0: không có việc để đếm
    expect(cho(2, undefined)).toEqual([null, null]) // thiếu một vế
    expect(cho('2', 4)).toEqual([null, null])
    expect(cho(-1, 4)).toEqual([null, null])
    expect(cho(1.5, 4)).toEqual([null, null])
    // khối tổng quan chỉ có vế việc vẫn được giữ (vòng vẽ được)
    const r = nhan(PH_OK)
    r.homNay.tongQuan = { viecXong: 1, viecTong: 3 }
    expect(docTatCaVeCon(r)!.tongQuan).toMatchObject({ viecXong: 1, viecTong: 3, soCau: null })
  })

  it('trần mảng theo hợp đồng: câu ≤ 120, bậc theo dạng ≤ 5, làm tốt ≤ 3; dạng có dung > tong bị bỏ', () => {
    const raw = nhan(PH_OK)
    raw.homNay.cau = Array.from({ length: 150 }, (_, i) => ({ luc: PH_OK.homNay.cau[0].luc, nguon: 'on_lai', deRutGon: `Đề ${i}`, dung: true }))
    raw.manhYeu.lamTot = Array.from({ length: 6 }, (_, i) => ({ tenDang: `D${i}`, dung: 1, tong: 2, bac: 'hieu' }))
    raw.manhYeu.conVap = [{ tenDang: 'Sai', dung: 5, tong: 2, bac: 'biet' }, { tenDang: 'Đúng dạng', dung: 1, tong: 3, bac: 'lạ' }]
    const pm = docTatCaVeCon(raw)!
    expect(pm.cau).toHaveLength(120)
    expect(pm.manhYeu!.lamTot).toHaveLength(3)
    expect(pm.manhYeu!.conVap).toEqual([{ tenDang: 'Đúng dạng', dung: 1, tong: 3, bac: null }])
  })

  it('KHÔNG trường nào của game đi qua (thần thú, EXP, khiên, đoàn) dù JSON lỡ có; kết quả không chứa chữ game', () => {
    const raw = nhan(PH_OK)
    Object.assign(raw, { thanThu: { ten: 'Bông' }, exp: 50, khien: 3, doan: {}, ongNghiem: 480 })
    raw.homNay.tongQuan.exp = 9
    const s = JSON.stringify(docTatCaVeCon(raw))
    expect(s).not.toMatch(/thanThu|Bông|"exp"|khien|doan|ongNghiem/i)
  })
})

describe('docChiTietCau', () => {
  it('ok ⇒ đề, phương án, đáp án, lời giải; ok:false ⇒ từ chối có LỜI THẬT + lý do che; thân lạ ⇒ null', () => {
    expect(docChiTietCau(CHI_TIET)).toMatchObject({ kieu: 'ok', dapAn: 'B', tenDang: 'Phản ứng ester hoá' })
    expect((docChiTietCau(CHI_TIET) as { phuongAn: string[] }).phuongAn).toHaveLength(4)
    expect(docChiTietCau({ ok: false, error: 'Ca này chưa công bố điểm nên chưa xem được lời giải.', che: 'chua_cong_bo' })).toEqual({ kieu: 'tu_choi', chu: 'Ca này chưa công bố điểm nên chưa xem được lời giải.', che: 'chua_cong_bo' })
    expect(docChiTietCau({ ok: false })).toMatchObject({ kieu: 'tu_choi', che: null })
    for (const x of [null, [], 'x', { ok: true }, { ok: true, de: 'Đề', dapAn: '' }, {}]) expect(docChiTietCau(x), JSON.stringify(x)).toBeNull()
  })
})

describe('định dạng — giờ VN (UTC+7) không phụ thuộc múi giờ máy', () => {
  it('gioVn / ngayDayDuVn / thuNgayVn từ ISO; ngày lẻ chuỗi; chữ số, thời gian, tên viết tắt', () => {
    expect(gioVn('2026-09-19T02:12:00Z')).toBe('09:12')
    expect(gioVn('2026-09-20T17:30:00Z')).toBe('00:30') // qua nửa đêm giờ VN
    expect(ngayDayDuVn('2026-09-19T02:12:00Z')).toBe('Thứ Bảy 19/09/2026')
    expect(ngayDayDuVn('2026-09-20T17:30:00Z')).toBe('Thứ Hai 21/09/2026')
    expect(thuNgayVn('2026-09-21T05:00:00Z')).toBe('Thứ Hai 21/09')
    expect(gioVn('rác')).toBe('')
    expect(ngayChuoiNgan('2026-09-08')).toBe('08/09')
    expect(ngayChuoiNgan('08/09')).toBe('')
    expect(thuTuChuoiNgay('2026-09-21')).toBe('Thứ Hai')
    expect(soVn(7.5)).toBe('7,5')
    expect(soVn(0.75)).toBe('0,75')
    expect(soVn(6)).toBe('6')
    expect(chuThoiGian(1930)).toBe('32 phút 10 giây')
    expect(chuThoiGian(45)).toBe('45 giây')
    expect(chuThoiGian(420)).toBe('7 phút')
    expect(chuCaiTen('Nguyễn Minh Khôi')).toBe('K')
    expect(chuCaiTen('  ')).toBe('')
  })
})

describe('nhãn tiếng Việt — không chữ game, câu che đúng lời', () => {
  it('mọi nguồn có nhãn; nguồn game hiện "Luyện dạng con còn vấp"; câu che có hai lời đúng chữ của đề', () => {
    expect(Object.keys(NHAN_NGUON)).toHaveLength(9)
    expect(NHAN_NGUON.luyen_dang_vap).toBe('Luyện dạng con còn vấp')
    expect(CHU_CHE.chua_nop).toBe('Con đã làm · kết quả hiện sau khi con nộp bài')
    expect(CHU_CHE.chua_cong_bo).toBe('Con đã làm · kết quả hiện sau khi Thầy công bố điểm')
    expect(JSON.stringify([NHAN_NGUON, CHU_CHE])).not.toMatch(/thần thú|EXP|khiên|Đoàn|Đảo|Võ đài|game/i)
    expect(tenMoc({ nguon: 'on_lai', ten: '', soCau: 6 })).toBe('Ôn lại 6 câu đến lịch')
    expect(tenMoc({ nguon: 'btvn', ten: 'Ester – Lipid', soCau: 12 })).toBe('Bài tập về nhà “Ester – Lipid”')
    expect(tenMoc({ nguon: 'gia_dinh_giao', ten: 'Gia đình giao thêm · 6 câu', soCau: null })).toBe('Gia đình giao thêm · 6 câu')
    expect(tenMoc({ nguon: 'khac_phuc', ten: '', soCau: 3 })).toBe('Khắc phục câu sai')
  })
})

describe('api — danh tính pass hoặc SBD; đọc thân JSON cả khi HTTP 500; không ném', () => {
  beforeEach(() => vi.stubGlobal('fetch', vi.fn()))
  afterEach(() => {
    localStorage.clear()
    vi.unstubAllGlobals()
  })
  it('SBD trần ⇒ {sbd}; có mã ⇒ {pass} (không sbd); URL đúng; qid đi kèm lệnh chi tiết', async () => {
    const goi: Array<{ u: string; b: unknown }> = []
    ;(fetch as any).mockImplementation(async (u: string, o: any) => (goi.push({ u, b: JSON.parse(o.body) }), { status: 200, json: async () => PH_OK }))
    expect((await taiTatCaVeCon(' 12121212 ')).kieu).toBe('ok')
    localStorage.setItem('omr_ph_pass', 'MA-PH')
    await taiTatCaVeCon('12121212')
    ;(fetch as any).mockImplementation(async (u: string, o: any) => (goi.push({ u, b: JSON.parse(o.body) }), { status: 200, json: async () => CHI_TIET }))
    expect((await taiChiTietCau('12121212', 'q-1')).kieu).toBe('ok')
    expect(goi.map((g) => [g.u.replace('https://may.test', ''), g.b])).toEqual([['/ph/tat-ca-ve-con', { sbd: '12121212' }], ['/ph/tat-ca-ve-con', { pass: 'MA-PH' }], ['/ph/chi-tiet-cau-ve-con', { pass: 'MA-PH', qid: 'q-1' }]])
  })
  it('HTTP 500 {ok:false,error} ⇒ hiện LỜI THẬT; 404 / thân hỏng ⇒ câu chung; mạng rớt ⇒ câu mạng; thiếu cả mã lẫn SBD ⇒ câu mạng; không ném', async () => {
    ;(fetch as any).mockResolvedValue({ status: 500, json: async () => ({ ok: false, error: 'Không tìm thấy số báo danh của con.' }) })
    expect(await taiTatCaVeCon('1')).toEqual({ kieu: 'loi', chu: 'Không tìm thấy số báo danh của con.' })
    ;(fetch as any).mockResolvedValue({ status: 404, json: async () => ({ ok: false, error: 'kỹ thuật' }) })
    expect((await taiTatCaVeCon('1')).kieu === 'loi' && ((await taiTatCaVeCon('1')) as { chu: string }).chu).toMatch(/Chưa xem được dữ liệu của con/)
    ;(fetch as any).mockResolvedValue({ status: 200, json: async () => { throw new Error('json') } })
    expect((await taiTatCaVeCon('1')).kieu).toBe('loi')
    ;(fetch as any).mockRejectedValue(new Error('offline'))
    expect(await taiTatCaVeCon('1')).toEqual({ kieu: 'loi', chu: 'Chưa kết nối được máy chủ. Anh/chị kiểm tra mạng rồi thử lại.' })
    expect((await taiTatCaVeCon('  ')).kieu).toBe('loi')
    expect((await taiChiTietCau('1', 'q')).kieu).toBe('loi')
  })
})

describe('khoá nguồn', () => {
  it('lớp ph-moi không chứa màu thô / emoji / lookbehind / .at( / chữ game; không gọi thần thú', () => {
    for (const p of ['src/lib/ph-moi/du-lieu.ts', 'src/lib/ph-moi/api.ts', 'src/lib/ph-moi/dinh-dang.ts', 'src/lib/ph-moi/use-tat-ca-ve-con.ts', 'src/components/ph-moi/nhan.ts', 'src/components/ph-moi/ManChinh.tsx', 'src/components/ph-moi/BangMoiThu.tsx', 'src/components/ph-moi/ThanhDay.tsx']) {
      const s = doc(p).replace(/\/\/.*$/gm, '')
      expect(s, p).not.toMatch(/#[0-9a-fA-F]{3,8}\b|\(\?<[=!]|\.at\(|randomUUID/)
      expect(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(s), p).toBe(false)
      expect(s, p).not.toMatch(/thần thú|khiên|Võ đài|Đảo thần thú|Spirit2D|game-v2|than-thu/i)
    }
  })
})
