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

describe('xepTheoCauPhat — phương án / ý bị xáo khi phát', () => {
  it('Phần I: sắp lý do theo chữ phương án đã phát; lệch đáp án đang chấm ⇒ null', async () => {
    const { xepTheoCauPhat } = await import('../src/lib/loi-giai-kinh/kiem')
    const ban = { qid: 'q', phan: 'I', lyDo: [{ khoa: 'A', dung: true, chu: 'lý A' }, { khoa: 'B', dung: false, chu: 'lý B' }, { khoa: 'C', dung: false, chu: 'lý C' }, { khoa: 'D', dung: false, chu: 'lý D' }],
      _goc: { pa: { A: 'CnH2nO2', B: 'CnH2n-2O2', C: 'CnH2n+2O2', D: 'CnH2nO' } } }
    const x = xepTheoCauPhat(ban, { phan: 'I', choices: ['CnH2n-2O2', 'CnH2nO', 'CnH2nO2', 'CnH2n+2O2'], correct: 'C' })!
    expect(x.lyDo.map((l) => `${l.khoa}:${l.chu}:${l.dung}`)).toEqual(['A:lý B:false', 'B:lý D:false', 'C:lý A:true', 'D:lý C:false'])
    expect('_goc' in x).toBe(false)
    expect(xepTheoCauPhat(ban, { phan: 'I', choices: ['CnH2n-2O2', 'CnH2nO', 'CnH2nO2', 'CnH2n+2O2'], correct: 'A' })).toBeNull()
    expect(xepTheoCauPhat(ban, { phan: 'I', choices: ['khác', 'CnH2nO', 'CnH2nO2', 'CnH2n+2O2'], correct: 'C' })).toBeNull()
  })
  it('Phần III: kết quả bản phải khớp đáp án đang chấm', async () => {
    const { xepTheoCauPhat } = await import('../src/lib/loi-giai-kinh/kiem')
    expect(xepTheoCauPhat({ qid: 'q', lyDo: [], ketQua: '13,2' }, { phan: 'III', correct: '13,2' })).not.toBeNull()
    expect(xepTheoCauPhat({ qid: 'q', lyDo: [], ketQua: '13,2' }, { phan: 'III', correct: '17,6' })).toBeNull()
  })
})

describe('chữ thầy nói theo thuật ngữ SGK', () => {
  it('axit → acid, este → ester (giữ hoa đầu câu), không đụng chữ dài hơn', async () => {
    const { chuSgk, kiemBanKinh } = await import('../src/lib/loi-giai-kinh/kiem')
    expect(chuSgk('Xà phòng là muối của axit béo.')).toBe('Xà phòng là muối của acid béo.')
    expect(chuSgk('Este no, đơn chức; ancol bền.')).toBe('Ester no, đơn chức; alcohol bền.')
    expect(chuSgk('aminoaxit và amin')).toBe('aminoaxit và amine')
    const ban = { cotLoi: { chu: 'x', chip: [] }, phim: [{ chu: 'a' }, { chu: 'b' }, { chu: 'c' }], thanChu: [], thayNoi: 'Xà phòng là muối của acid béo', lyDo: [],
      hayNham: [{ nghi: 'a', dung: 'b' }], tuHoi: { hoi: 'h', tra: 't' }, theNho: [{ truoc: 'a', sau: 'b' }], phepTinh: [{ ten: 'x', bieuThuc: '1+1', ketQua: '2', laDapSo: true }] }
    const k = kiemBanKinh(ban, { phan: 'III', dapAn: '2', qid: 'q', nguon: { thanChu: [], thayNoi: ['Xà phòng là muối của axit béo.'], meo: [] } })
    expect(k.ket).toBe('dat')
    expect(k.ban!.thayNoi).toBe('Xà phòng là muối của acid béo.')
  })
})

describe('cảnh gọi tên danh-phap (thầy 03/11: công thức nhánh + mạch chính + liên kết + chức)', () => {
  const canh = { loai: 'danh-phap', soC: 6, chuc: { viTri: 1, ten: 'COOH' }, nhanh: [{ viTri: 2, ten: 'NH2' }, { viTri: 6, ten: 'NH2' }], pi: [],
    manh: [{ loai: 'nhanh', chu: '2,6-diamino', giai: 'Hai nhánh amino.' }, { loai: 'mach', chu: 'hex', giai: '6 C.' }, { loai: 'lien-ket', chu: 'an', giai: 'Đơn.' }, { loai: 'chuc', chu: 'oic acid', giai: 'COOH.' }],
    ten: '2,6-diaminohexanoic acid' }
  it('đúng khuôn, tên = ghép các mảnh ⇒ giữ cảnh', () => {
    const k = kiemBanKinh({ ...mauII(), canh }, ctxII)
    expect(k.ket).toBe('dat')
    expect(k.ban!.canh).toMatchObject({ loai: 'danh-phap', soC: 6, ten: '2,6-diaminohexanoic acid' })
  })
  it('tên không khớp các mảnh / vị trí ngoài mạch ⇒ bỏ cảnh (bản vẫn đạt)', () => {
    const k1 = kiemBanKinh({ ...mauII(), canh: { ...canh, ten: '2,6-diaminopentanoic acid' } }, ctxII)
    expect(k1.ban!.canh).toBeUndefined(); expect(k1.boKhoi).toContain('cảnh minh hoạ sai khuôn')
    const k2 = kiemBanKinh({ ...mauII(), canh: { ...canh, nhanh: [{ viTri: 9, ten: 'NH2' }] } }, ctxII)
    expect(k2.ban!.canh).toBeUndefined()
  })
  it('ester chỉ lắp mảnh (không mạch)', () => {
    const k = kiemBanKinh({ ...mauII(), canh: { loai: 'danh-phap', nhanh: [], pi: [], manh: [{ loai: 'goc-ancol', chu: 'ethyl', giai: 'Gốc R′.' }, { loai: 'goc-acid', chu: ' acetate', giai: 'Gốc RCOO.' }], ten: 'ethyl acetate' } }, ctxII)
    expect(k.ban!.canh).toMatchObject({ loai: 'danh-phap', ten: 'ethyl acetate' })
  })
})

describe('câu tự luận (thầy 03/11: giải luôn để chiếu lên bảng)', () => {
  const tl = () => ({ ...mauII(), lyDo: [], phepTinh: [{ ten: 'n acid', bieuThuc: '12/60', ketQua: '0,2' }, { ten: 'm ester', bieuThuc: '12/60*88*75/100', ketQua: '13,2', laDapSo: true }] })
  it('không cần lý do phương án; phép tính tính lại; có đáp số tham chiếu ⇒ phải khớp', () => {
    const k = kiemBanKinh(tl(), { phan: 'III', dapAn: '13,2', qid: 'q', nguon: NGUON, tuLuan: true })
    expect(k.ket).toBe('dat'); expect(k.ban!.tuLuan).toBe(true); expect(k.ban!.lyDo).toEqual([])
    expect(kiemBanKinh(tl(), { phan: 'III', dapAn: '17,6', qid: 'q', nguon: NGUON, tuLuan: true }).ket).toBe('lech')
  })
  it('không có đáp số tham chiếu ⇒ chỉ tính lại; phép tính sai ⇒ lech', () => {
    expect(kiemBanKinh(tl(), { phan: 'III', dapAn: '', qid: 'q', nguon: NGUON, tuLuan: true }).ket).toBe('dat')
    const sai = { ...tl(), phepTinh: [{ ten: 'x', bieuThuc: '12/60', ketQua: '0,3' }] }
    expect(kiemBanKinh(sai, { phan: 'III', dapAn: '', qid: 'q', nguon: NGUON, tuLuan: true }).ket).toBe('lech')
  })
})
