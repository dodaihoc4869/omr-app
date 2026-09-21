// DỰNG PHIẾU BÀI ca_nhan TỪ PHẢN HỒI /btvn/cua-em (host phía máy em). Hợp đồng: docs/hop-dong-btvn-nang-do-2109.md.
import { beforeEach, describe, expect, it } from 'vitest'
import { chonChangHienThi, dungPhieuBtvn } from '../src/lib/btvn-cho-em'
import { docBaiCaNhan, khoaLuotLam, luuKetQuaChang } from '../src/lib/btvn-ca-nhan-em'

const NGAY_MAI = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 1, 0, 0).toISOString()
const HOM_QUA = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() - 1, 0, 0).toISOString()
const HAN = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 7, 20, 0).toISOString()

/** Câu thô như máy chủ trả cho bài ca_nhan: KHÔNG có dap_an / loi_giai. */
const cau = (so: number, phan: 'I' | 'II' | 'III', extra: Record<string, unknown> = {}) => ({
  qid: `M-${phan}-${so}`,
  phan,
  so,
  de: `Đề câu ${so}`,
  ...(phan === 'I' ? { pa: { A: 'a', B: 'b', C: 'c', D: 'd' } } : {}),
  ...(phan === 'II' ? { y: { a: 'ý a', b: 'ý b', c: 'ý c', d: 'ý d' } } : {}),
  ...extra,
})
const C1 = cau(1, 'I')
const C2 = cau(2, 'II')
const C3 = cau(3, 'III')
const C4 = cau(4, 'I')
const C5 = cau(5, 'I')

const chang = (chiSo: number, soCau: number, daMo: boolean, daXong: boolean, moLuc = HOM_QUA) => ({ chiSo, soCau, moLuc, daMo, daXong })
const NHAN = { 'M-I-1': 'khoi_dong', 'M-II-2': 'loi', 'M-III-3': 'thu_thach', 'M-I-4': 'dang_yeu', 'M-I-5': 'loi_cao' }

/** Bài 5 câu, 2 chặng (3 + 2). Mặc định đang ở chặng 0, chặng 1 chưa mở. */
const phanHoi = (o: Record<string, unknown> = {}) => ({
  ok: true,
  caNhan: true,
  maBtvn: 'B1',
  hanNop: HAN,
  soCau: 5,
  soCauCuaEm: 5,
  soChang: 2,
  loDaXong: 0,
  changDangMo: 0,
  chang: [chang(0, 3, true, false), chang(1, 2, false, false, NGAY_MAI)],
  nhan: NHAN,
  de: { ma_de: 'M', khongDapAn: true, cau: [C1, C2, C3] },
  ...o,
})

const than = (html: string) => html.slice(html.indexOf('<body'), html.indexOf('<script type="application/json" id="du-nop">'))
const duNop = (html: string) => JSON.parse(/<script type="application\/json" id="du-nop">([\s\S]*?)<\/script>/.exec(html)![1].replace(/\\u003c/g, '<'))
const the = (html: string, qid: string) => new RegExp(`<article[^>]*data-qid="${qid}"[\\s\\S]*?</article>`).exec(than(html))![0]
const dung = (r: Record<string, unknown>) => dungPhieuBtvn(r as never, 'Riêng', '12121212')

beforeEach(() => localStorage.clear())

describe('bài ca_nhan chưa nộp chặng nào', () => {
  it('phiếu ca_nhan: KHÔNG đáp án, KHÔNG lời giải, có nhãn, có đầu bài, nút "Nộp chặng"', async () => {
    const html = await dung(phanHoi())
    const t = than(html)
    expect(html).toContain('<body class="co-lam ca-nhan">')
    expect(t).not.toContain('data-dung')
    expect(t).not.toContain('sa-answer')
    expect(t).not.toContain('sol-box')
    for (const c of duNop(html).cau) expect(Object.keys(c).sort()).toEqual(['id', 'phan'])
    expect(duNop(html).cau.map((c: { id: string }) => c.id)).toEqual(['M-I-1', 'M-II-2', 'M-III-3'])
    expect(duNop(html).caNhan).toEqual({ chiSo: 0, daCham: {} })
    expect(t).toContain('<b>5</b> câu')
    expect(t).toContain('<b>2</b> chặng')
    expect(t).toContain('Chặng 1/2 · Đã làm')
    expect(t).toContain('id="nut-nop">Nộp chặng</button>')
    expect(the(html, 'M-I-1')).toContain('data-nhan="khoi_dong"')
    expect(the(html, 'M-III-3')).toContain('sai không sao')
    expect(t).not.toContain('gcn-cho') // chặng đang mở, không phải chờ
  })

  it('máy em CHỈ nhận câu của chặng đã mở: câu chặng chưa mở không có trong phiếu', async () => {
    const html = await dung(phanHoi())
    expect(html).not.toContain('Đề câu 4')
    expect(html).not.toContain('Đề câu 5')
  })

  it('"Hiện tất cả" và các dấu vết lô/Vòng cũ KHÔNG còn', async () => {
    const t = than(await dung(phanHoi()))
    for (const chuoi of ['Hiện tất cả', 'thanh-phan-tang-btvn', 'Vòng 1', 'Mục tiêu hôm nay', 'dimmed-pacing-banner']) expect(t).not.toContain(chuoi)
  })

  it('bản nháp đang làm dở ở máy được nạp lại (chỉ câu của chặng)', async () => {
    localStorage.setItem('ddh.btvn.draft.B1.12121212', JSON.stringify({ 'M-I-1': 'C' }))
    const html = await dung(phanHoi())
    expect(duNop(html).banNhap).toEqual({ 'M-I-1': 'C' })
  })
})

describe('đã nộp một phần chặng 0 (kết quả máy chủ đã lưu ở máy)', () => {
  it('câu đã chấm hiện đáp án đúng + lời giải + Đúng/Sai; câu chưa chấm vẫn không có gì', async () => {
    luuKetQuaChang('B1', '12121212', 0, [
      { qid: 'M-I-1', dung: true, dapAnDung: 'B', loiGiai: { chot: 'Nhóm chức ester', buoc: ['Nhận diện nhóm chức'] }, anhLoiGiai: [] },
      { qid: 'M-III-3', dung: false, dapAnDung: '12,5', loiGiai: 'Áp dụng bảo toàn khối lượng.', anhLoiGiai: [] },
    ], { 'M-I-1': 'B', 'M-III-3': '9' })
    const html = await dung(phanHoi())
    const q1 = the(html, 'M-I-1')
    expect(q1).toMatch(/da-cham cau-dung/)
    expect(q1).toContain('data-dung="1"')
    expect(q1).toContain('Nhóm chức ester')
    expect(q1).toContain('<div class="lam-ket">Đúng</div>')
    const q3 = the(html, 'M-III-3')
    expect(q3).toMatch(/da-cham cau-sai/)
    expect(q3).toContain('Áp dụng bảo toàn khối lượng.')
    // câu chưa chấm: sạch
    const q2 = the(html, 'M-II-2')
    expect(q2).not.toContain('da-cham')
    expect(q2).not.toContain('data-dung')
    expect(duNop(html).caNhan.daCham).toEqual({ 'M-I-1': { dung: true, chon: 'B' }, 'M-III-3': { dung: false, chon: '9' } })
    // đáp án đúng KHÔNG nằm trong JSON dữ liệu của phiếu
    for (const c of duNop(html).cau) expect(c).not.toHaveProperty('dapAn')
    expect(than(html)).toContain('id="nut-nop">Nộp chặng</button>') // còn câu chưa làm
  })

  it('đáp án Phần II trả dạng ĐỐI TƯỢNG {a,b,c,d} vẫn dựng được', async () => {
    luuKetQuaChang('B1', '12121212', 0, [{ qid: 'M-II-2', dung: false, dapAnDung: { a: 'D', b: 'S', c: 'D', d: 'S' }, loiGiai: null, anhLoiGiai: [] }], { 'M-II-2': 'DDDD' })
    const html = await dung(phanHoi())
    expect(the(html, 'M-II-2')).toMatch(/da-cham cau-sai/)
    expect(the(html, 'M-II-2')).toContain('data-dung="1"')
  })

  it('xong cả chặng: nút tắt "Đã xong chặng"', async () => {
    luuKetQuaChang('B1', '12121212', 0, [
      { qid: 'M-I-1', dung: true, dapAnDung: 'A', loiGiai: null, anhLoiGiai: [] },
      { qid: 'M-II-2', dung: true, dapAnDung: 'DSDS', loiGiai: null, anhLoiGiai: [] },
      { qid: 'M-III-3', dung: true, dapAnDung: '3', loiGiai: null, anhLoiGiai: [] },
    ], { 'M-I-1': 'A', 'M-II-2': 'DSDS', 'M-III-3': '3' })
    const html = await dung(phanHoi())
    expect(than(html)).toContain('id="nut-nop" disabled>Đã xong chặng</button>')
  })
})

describe('chặng đã xong, chặng kế chưa tới ngày mở', () => {
  it('vẫn hiện chặng vừa xong (xem lại), kèm dòng "Chặng 2 mở ngày mai."', async () => {
    const r = phanHoi({ loDaXong: 1, changDangMo: 1, chang: [chang(0, 3, true, true), chang(1, 2, false, false, NGAY_MAI)] })
    luuKetQuaChang('B1', '12121212', 0, [
      { qid: 'M-I-1', dung: true, dapAnDung: 'A', loiGiai: 'lg1', anhLoiGiai: [] },
      { qid: 'M-II-2', dung: true, dapAnDung: 'DSDS', loiGiai: 'lg2', anhLoiGiai: [] },
      { qid: 'M-III-3', dung: true, dapAnDung: '3', loiGiai: 'lg3', anhLoiGiai: [] },
    ], { 'M-I-1': 'A', 'M-II-2': 'DSDS', 'M-III-3': '3' })
    const html = await dung(r)
    expect(than(html)).toContain('Chặng 2 mở ngày mai.')
    expect(than(html)).toContain('Chặng 1/2 · ')
    expect(duNop(html).caNhan.chiSo).toBe(0)
    expect(than(html)).toContain('disabled>Đã xong chặng</button>')
    expect(than(html)).toContain('aria-label="Chặng 1, đã xong"')
    expect(than(html)).toContain('<em>Mai</em>')
  })

  it('không có kết quả lưu ở máy (máy khác): câu hiện KHÔNG đáp án, em vẫn thấy chặng (không vỡ)', async () => {
    const r = phanHoi({ loDaXong: 1, changDangMo: 1, chang: [chang(0, 3, true, true), chang(1, 2, false, false, NGAY_MAI)] })
    const html = await dung(r)
    expect(than(html)).not.toContain('data-dung')
    expect(than(html)).toContain('Chặng 2 mở ngày mai.')
  })
})

describe('chặng 1 đã mở: chỉ hiện câu của chặng 1', () => {
  it('máy chủ gửi cả câu chặng 0 (đã mở) lẫn chặng 1; phiếu chỉ dựng chặng đang làm', async () => {
    const r = phanHoi({
      loDaXong: 1,
      changDangMo: 1,
      chang: [chang(0, 3, true, true), chang(1, 2, true, false)],
      de: { ma_de: 'M', khongDapAn: true, cau: [C1, C2, C3, C4, C5] },
    })
    const html = await dung(r)
    expect(duNop(html).cau.map((c: { id: string }) => c.id)).toEqual(['M-I-4', 'M-I-5'])
    expect(duNop(html).caNhan.chiSo).toBe(1)
    expect(than(html)).toContain('Chặng 2/2 · ')
    expect(the(html, 'M-I-5')).toContain('Câu cốt lõi hơi cao (sai không sao)')
    expect(the(html, 'M-I-5')).toContain('sai không sao')
    expect(html).not.toContain('Đề câu 1<')
  })
})

describe('đã xong hết các chặng', () => {
  it('hiện chặng cuối cùng đã xong + lời chúc, không có "Nộp chặng"', async () => {
    const r = phanHoi({
      loDaXong: 2,
      changDangMo: null,
      daNop: true,
      chang: [chang(0, 3, true, true), chang(1, 2, true, true)],
      de: { ma_de: 'M', khongDapAn: true, cau: [C1, C2, C3, C4, C5] },
    })
    luuKetQuaChang('B1', '12121212', 1, [
      { qid: 'M-I-4', dung: true, dapAnDung: 'A', loiGiai: null, anhLoiGiai: [] },
      { qid: 'M-I-5', dung: false, dapAnDung: 'B', loiGiai: null, anhLoiGiai: [] },
    ], { 'M-I-4': 'A', 'M-I-5': 'C' })
    const html = await dung(r)
    expect(than(html)).toContain('Em đã xong hết các chặng của bài này.')
    expect(than(html)).toContain('disabled>Đã xong chặng</button>')
    expect(duNop(html).caNhan.chiSo).toBe(1)
  })
})

describe('chọn chặng hiển thị', () => {
  const b = (o: Record<string, unknown>) => docBaiCaNhan(phanHoi(o))!
  it('chặng đang làm nếu đã mở', () => expect(chonChangHienThi(b({}))).toBe(0))
  it('chặng đang làm chưa mở ⇒ chặng đã xong gần nhất', () => {
    expect(chonChangHienThi(b({ changDangMo: 1, chang: [chang(0, 3, true, true), chang(1, 2, false, false)] }))).toBe(0)
  })
  it('đã xong hết ⇒ chặng cuối', () => {
    expect(chonChangHienThi(b({ changDangMo: null, chang: [chang(0, 3, true, true), chang(1, 2, true, true)] }))).toBe(1)
  })
  it('chưa xong chặng nào và chưa có chặng nào đang mở ⇒ chặng đầu đã mở; không có chặng mở ⇒ null', () => {
    expect(chonChangHienThi(b({ changDangMo: null, chang: [chang(0, 3, true, false)] }))).toBe(0)
    expect(chonChangHienThi(b({ changDangMo: null, chang: [chang(0, 3, false, false)] }))).toBeNull()
  })
})

describe('lỗi thấy được thay vì phiếu trắng', () => {
  it('không có chặng nào mở ⇒ ném lỗi có lời', async () => {
    await expect(dung(phanHoi({ changDangMo: null, chang: [chang(0, 3, false, false)] }))).rejects.toThrow('chưa có chặng nào mở')
  })
  it('chặng hiện tại không có câu trong de.cau ⇒ ném lỗi có lời', async () => {
    await expect(dung(phanHoi({ de: { ma_de: 'M', khongDapAn: true, cau: [] } }))).rejects.toThrow('chưa có câu nào')
  })
  it('gói câu hỏng (thiếu "de") ⇒ ném lỗi đọc gói, không phiếu trắng', async () => {
    await expect(dung(phanHoi({ de: { ma_de: 'M', khongDapAn: true, cau: [{ qid: 'M-I-1', phan: 'I', so: 1, pa: { A: 'a' } }, C2, C3] } }))).rejects.toThrow('Gói bài tập không đọc được')
  })
})

describe('bài THƯỜNG (không caNhan) vẫn ra phiếu cũ, có đáp án chấm tại chỗ', () => {
  it('caNhan vắng/false ⇒ nhánh cũ: chua-nop, đáp án trong #du-nop, không dấu vết ca-nhan', async () => {
    const goc = {
      ok: true,
      maBtvn: 'B9',
      hanNop: HAN,
      soCau: 1,
      de: { ma_de: 'M', cau: [{ qid: 'M-I-1', phan: 'I', so: 1, de: 'Đề thường', pa: { A: 'a', B: 'b', C: 'c', D: 'd' }, dap_an: 'C' }] },
    }
    for (const caNhan of [undefined, false]) {
      const html = await dung({ ...goc, ...(caNhan === undefined ? {} : { caNhan }) })
      expect(html).toContain('chua-nop')
      expect(html).not.toContain('ca-nhan')
      expect(html).not.toContain('gcn-')
      expect(duNop(html).cau[0].dapAn).toBe('C')
    }
  })
})

describe('thầy "Cho làm lại" (soLanLam tăng): lượt mới bắt đầu từ chặng 1, sạch nháp và kết quả cũ', () => {
  const luuCu = () => {
    luuKetQuaChang('B1', '12121212', 0, [
      { qid: 'M-I-1', dung: true, dapAnDung: 'A', loiGiai: { chot: 'Lời giải lượt cũ' }, anhLoiGiai: [] },
      { qid: 'M-II-2', dung: true, dapAnDung: 'DSDS', loiGiai: null, anhLoiGiai: [] },
      { qid: 'M-III-3', dung: true, dapAnDung: '3', loiGiai: null, anhLoiGiai: [] },
    ], { 'M-I-1': 'A', 'M-II-2': 'DSDS', 'M-III-3': '3' })
    localStorage.setItem('ddh.btvn.draft.B1.12121212', JSON.stringify({ 'M-I-1': 'A' }))
    localStorage.setItem('ddh.lam.B1.abc', JSON.stringify({ 'M-I-1': 'A' }))
  }

  it('lượt 1 → máy nhớ; máy chủ báo lượt 2 (đã nộp xong lượt 1) ⇒ phiếu SẠCH: không câu đã chấm, không nháp, chặng 1 để làm', async () => {
    luuCu()
    const lan1 = await dung(phanHoi({ soLanLam: 1, loDaXong: 1, changDangMo: 1, chang: [chang(0, 3, true, true), chang(1, 2, false, false, NGAY_MAI)] }))
    expect(than(lan1)).toContain('disabled>Đã xong chặng</button>') // lượt 1: đã xong chặng 0
    expect(localStorage.getItem(khoaLuotLam('B1', '12121212'))).toBe('1')
    // thầy cho làm lại: cùng bộ câu, chặng 0 mở lại, chưa xong gì
    const lan2 = await dung(phanHoi({ soLanLam: 2, daNop: false, loDaXong: 0, changDangMo: 0 }))
    expect(localStorage.getItem(khoaLuotLam('B1', '12121212'))).toBe('2')
    expect(duNop(lan2).caNhan).toEqual({ chiSo: 0, daCham: {} })
    expect(duNop(lan2).banNhap).toBeUndefined()
    expect(than(lan2)).not.toContain('da-cham')
    expect(than(lan2)).not.toContain('data-dung')
    expect(than(lan2)).not.toContain('Lời giải lượt cũ')
    expect(than(lan2)).toContain('id="nut-nop">Nộp chặng</button>')
    expect(than(lan2)).toContain('Chặng 1/2 · ')
    expect(localStorage.getItem('ddh.btvn.draft.B1.12121212')).toBeNull()
    expect(localStorage.getItem('ddh.lam.B1.abc')).toBeNull()
  })

  it('cùng lượt (2) mở lại ⇒ KHÔNG xoá: kết quả lượt 2 vẫn hiện', async () => {
    await dung(phanHoi({ soLanLam: 2 }))
    luuCu()
    const html = await dung(phanHoi({ soLanLam: 2 }))
    expect(than(html)).toMatch(/da-cham cau-dung/)
    expect(than(html)).toContain('Lời giải lượt cũ')
  })

  it('bài cá nhân hoá KHÔNG có soLanLam (máy chủ cũ) ⇒ như trước, không xoá gì', async () => {
    luuCu()
    const html = await dung(phanHoi())
    expect(than(html)).toMatch(/da-cham cau-dung/)
    expect(localStorage.getItem(khoaLuotLam('B1', '12121212'))).toBeNull()
  })
})
