// Bộ kiểm Lời giải Kính (thầy chốt 02/11): đủ khối chuẩn bản mẫu, khớp đáp án kho, không bịa lời thầy, chữ cấm.
import { describe, expect, it } from 'vitest'
import { kiemBanKinh, banKinhDungDuoc, chuanDoiChieu } from '../src/lib/loi-giai-kinh/kiem'

const NGUON = { thanChu: ['Tăng thu, giảm toả'], thayNoi: ['Có đúng ba yếu tố này thôi nhá: nhiệt độ, nồng độ và áp suất.'], meo: ['Tăng thu giảm tỏa.'] }
const mauII = () => ({
  cotLoi: { chu: 'Cân bằng chuyển dịch theo chiều **chống lại sự thay đổi đó**.', chip: [{ nhan: '3 yếu tố', chu: 'nhiệt độ · nồng độ · áp suất' }] },
  phim: [{ chu: 'ΔrH < 0 nên chiều thuận toả nhiệt.' }, { chu: 'Tăng nhiệt độ ⇒ chiều thu nhiệt.' }, { chu: 'Tăng áp suất ⇒ phía ít mol khí.' }],
  thanChu: ['Tăng thu, giảm toả', 'Câu tự bịa của máy'],
  thayNoi: 'Có đúng ba yếu tố này thôi nhá: nhiệt độ, nồng độ và áp suất',
  lyDo: [{ khoa: 'a', dung: false, chu: 'Sai.' }, { khoa: 'b', dung: true, chu: 'Đúng.' }, { khoa: 'c', dung: false, chu: 'Sai.' }, { khoa: 'd', dung: true, chu: 'Đúng.' }],
  hayNham: [{ nghi: 'ΔrH < 0 là thu nhiệt.', dung: 'ΔrH < 0 là toả nhiệt.' }],
  tuHoi: { hoi: 'H2 + I2 ⇌ 2HI tăng áp suất thì sao?', tra: 'Không chuyển dịch.' },
  theNho: [{ truoc: 'Tăng nhiệt độ chạy chiều nào?', sau: 'Chiều thu nhiệt.' }],
})
const ctxII = { phan: 'II' as const, dapAn: 'SDSD', qid: 'q1', nguon: NGUON }

describe('kiemBanKinh', () => {
  it('bản đủ khối, khớp đáp án ⇒ đạt; thần chú bịa bị bỏ, câu thầy nói khớp nguồn được giữ', () => {
    const k = kiemBanKinh(mauII(), ctxII)
    expect(k.ket).toBe('dat')
    expect(k.ban!.thanChu).toEqual(['Tăng thu, giảm toả'])
    expect(k.ban!.thayNoi).toBe(NGUON.thayNoi[0])
    expect(k.boKhoi).toContain('thần chú không có trong bảng của thầy')
  })
  it('câu thầy nói không có trong nguồn ⇒ bỏ khối, bản vẫn đạt', () => {
    const k = kiemBanKinh({ ...mauII(), thayNoi: 'Câu thầy chưa từng nói.' }, ctxII)
    expect(k.ket).toBe('dat')
    expect(k.ban!.thayNoi).toBeUndefined()
  })
  it('lý do lệch đáp án kho ⇒ lech', () => {
    expect(kiemBanKinh(mauII(), { ...ctxII, dapAn: 'DDSD' }).ket).toBe('lech')
  })
  it('thiếu thẻ nhớ / hay nhầm / tự hỏi ⇒ thieu', () => {
    expect(kiemBanKinh({ ...mauII(), theNho: [] }, ctxII).ket).toBe('thieu')
    expect(kiemBanKinh({ ...mauII(), hayNham: [] }, ctxII).ket).toBe('thieu')
    expect(kiemBanKinh({ ...mauII(), tuHoi: {} }, ctxII).ket).toBe('thieu')
  })
  it('chữ cấm: «», ẩn dụ tiền nhà, độ bất bão hoà', () => {
    expect(kiemBanKinh({ ...mauII(), cotLoi: { chu: '«No» là gốc.', chip: [] } }, ctxII).lyDo).toMatch(/«»/)
    expect(kiemBanKinh({ ...mauII(), cotLoi: { chu: 'Mỗi mol là một đồng tiền.', chip: [] } }, ctxII).ket).toBe('thieu')
    expect(kiemBanKinh({ ...mauII(), cotLoi: { chu: 'Độ bất bão hoà k = 1.', chip: [] } }, ctxII).ket).toBe('thieu')
  })
  it('so sánh «0,2 < 0,3 > …» không bị coi là thẻ HTML', () => {
    const k = kiemBanKinh({ ...mauII(), kiemLai: '0,2 < 0,3 và 17,6 > 13,2' }, ctxII)
    expect(k.ket).toBe('dat')
  })
  it('Phần III thiếu phép tính có nghĩa ⇒ thieu; có phép tính mà máy tính lại lệch ⇒ lech', () => {
    const iii = { ...mauII(), lyDo: [] }
    expect(kiemBanKinh(iii, { ...ctxII, phan: 'III', dapAn: '13,2' }).ket).toBe('thieu')
    const buoc = [{ ten: 'm', thuaSo: [{ so: '12', nghia: 'khối lượng acid' }, { so: '1/60', nghia: 'chia M ra số mol' }] }]
    expect(kiemBanKinh({ ...iii, buoc }, { ...ctxII, phan: 'III', dapAn: '13,2', kiemSo: () => ({ ok: false, lyDo: 'lệch' }) }).ket).toBe('lech')
    expect(kiemBanKinh({ ...iii, buoc }, { ...ctxII, phan: 'III', dapAn: '13,2', kiemSo: () => ({ ok: true }) }).ket).toBe('dat')
  })
  it('app: bản hỏng ⇒ null; bản đạt ⇒ dùng được', () => {
    expect(banKinhDungDuoc({ qid: 'q1', ...mauII() }, 'II', 'SDSD')).not.toBeNull()
    expect(banKinhDungDuoc({ qid: 'q1', ...mauII(), theNho: [] }, 'II', 'SDSD')).toBeNull()
  })
  it('chuanDoiChieu bỏ ngoặc, dấu chấm cuối, hoa thường', () => {
    expect(chuanDoiChieu('«Tăng thu giảm tỏa.»')).toBe('tăng thu giảm tỏa')
  })
})

describe('phép tính có tên (bài không xích được)', () => {
  it('tính lại từng biểu thức; Phần III đáp số khớp kho', async () => {
    const { kiemPhepTinh, khopLamTron, docSoViet } = await import('../src/lib/loi-giai-kinh/kiem')
    expect(docSoViet('13,2')).toBe(13.2)
    expect(docSoViet('1.000,5')).toBe(1000.5)
    expect(khopLamTron(13.2000001, '13,2')).toBe(true)
    expect(khopLamTron(23.4666, '23,47')).toBe(true)
    expect(khopLamTron(17.6, '13,2')).toBe(false)
    const ds = [{ ten: 'n acid', bieuThuc: '12/60', ketQua: '0,2' }, { ten: 'm ester', bieuThuc: '12/60*88*75/100', ketQua: '13,2', laDapSo: true }]
    expect(kiemPhepTinh(ds, 'III', '13,2')).toBeNull()
    expect(kiemPhepTinh(ds, 'III', '17,6')).toMatch(/lệch/)
    expect(kiemPhepTinh([{ ten: 'x', bieuThuc: '12/60', ketQua: '0,3' }], 'I', 'A')).toMatch(/tính lại/)
  })
})
