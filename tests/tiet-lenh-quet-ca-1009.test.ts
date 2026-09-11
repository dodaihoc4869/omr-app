// TỐC ĐỘ QUÉT CẢ THƯ MỤC — đếm SỐ LỆNH MÁY CHỦ, không đếm cảm giác.
//
// Quét cả thư mục năm sinh (thầy chốt 10/09) làm số ca nhảy từ 3 lên tới 60.
// Bản đồ sai lấy theo lô nên rẻ; nhưng ĐƯỜNG LUI `docCaTruoc` thì mỗi ca một
// lệnh `chiTietCa`. Không chặn là chậm gấp 20 lần bản cũ.
//
// Luật: đi từ ca mới nhất, em nào đủ ca rồi thì thôi; mọi em đủ thì ngừng gọi
// đường lui. Phép kiểm này ĐẾM số lệnh thật.
import { beforeEach, describe, expect, it, vi } from 'vitest'

const danhSachCa = vi.fn()
const banDoSaiCa = vi.fn()
const danhSachEm = vi.fn()
const chiTietCa = vi.fn()

vi.mock('../src/lib/exam-api', async (goc) => ({
  ...(await goc<Record<string, unknown>>()),
  danhSachCa: (...a: unknown[]) => danhSachCa(...a),
  banDoSaiCa: (...a: unknown[]) => banDoSaiCa(...a),
  danhSachEm: (...a: unknown[]) => danhSachEm(...a),
  chiTietCa: (...a: unknown[]) => chiTietCa(...a),
}))

const { docCacCaTruoc } = await import('../src/lib/de-rieng-nguon')

const SBD = ['12001', '12002', '12003']
/** 60 ca cùng thư mục 2009, mới nhất trước. */
const CA = Array.from({ length: 60 }, (_, i) => ({
  maCa: `ca${String(i).padStart(2, '0')}`,
  tenCa: '2009 - Lớp 1 - L' + i,
  loai: 'thi',
  trangThai: 'dong',
  moLuc: new Date(2026, 8, 1, 0, 0, 60 - i).toISOString(),
}))

function banDoCho(ds: string[]) {
  const ra: Record<string, { sai: Record<string, string[]>; lam: Record<string, string[]> }> = {}
  for (const ma of ds) {
    ra[ma] = { lam: Object.fromEntries(SBD.map((s) => [s, ['q1', 'q2']])), sai: Object.fromEntries(SBD.map((s) => [s, ['q1']])) }
  }
  return ra
}

beforeEach(() => {
  danhSachCa.mockReset().mockResolvedValue(CA)
  danhSachEm.mockReset().mockResolvedValue(SBD.map((sbd) => ({ sbd, hoTen: 'x', namSinh: '2009', lop: '12' })))
  banDoSaiCa.mockReset()
  chiTietCa.mockReset()
})

describe('số lệnh máy chủ khi quét cả thư mục 60 ca', () => {
  it('bản đồ sai lấy theo LÔ 20 — 60 ca chỉ 3 lệnh, không phải 60', async () => {
    banDoSaiCa.mockImplementation(async (_u, _m, lo: string[]) => {
      expect(lo.length).toBeLessThanOrEqual(20)
      return banDoCho(lo)
    })
    await docCacCaTruoc('u', 'm', ['moi'], undefined, SBD)
    expect(banDoSaiCa).toHaveBeenCalledTimes(3)
  })

  it('mọi em đã đủ ca gần nhất ⇒ KHÔNG gọi đường lui lần nào', async () => {
    // Chỉ 2 ca đầu có bản đồ; 58 ca còn lại rỗng.
    banDoSaiCa.mockImplementation(async (_u, _m, lo: string[]) => {
      const co = lo.filter((m) => m === 'ca00' || m === 'ca01')
      const ra = banDoCho(co)
      for (const m of lo) if (!ra[m]) ra[m] = { lam: {}, sai: {} }
      return ra
    })
    const ra = await docCacCaTruoc('u', 'm', ['moi'], undefined, SBD)
    expect(chiTietCa).toHaveBeenCalledTimes(0)
    expect(ra.dsCa.map((c) => c.maCa)).toEqual(['ca00', 'ca01'])
    expect(ra.boQua.some((b) => /bỏ qua cho nhanh/.test(b.vi_sao))).toBe(true)
  })

  it('KHÔNG im lặng: số ca bỏ qua vì đã đủ được khai ra', async () => {
    banDoSaiCa.mockImplementation(async (_u, _m, lo: string[]) => {
      const ra = banDoCho(lo.filter((m) => m === 'ca00'))
      for (const m of lo) if (!ra[m]) ra[m] = { lam: {}, sai: {} }
      return ra
    })
    const ra = await docCacCaTruoc('u', 'm', ['moi'], undefined, SBD)
    const dong = ra.boQua.find((b) => /bỏ qua cho nhanh/.test(b.vi_sao))
    expect(dong?.maCa).toBe('+59 ca cũ hơn')
  })

  it('em chưa đủ thì VẪN quét tiếp — không cắt nhầm', async () => {
    // ca00 chỉ phủ 2 em; em 12003 chưa có ca nào ⇒ phải đi tiếp tới ca05.
    banDoSaiCa.mockImplementation(async (_u, _m, lo: string[]) => {
      const ra: Record<string, { sai: Record<string, string[]>; lam: Record<string, string[]> }> = {}
      for (const m of lo) {
        if (m === 'ca00') ra[m] = { lam: { '12001': ['q1'], '12002': ['q1'] }, sai: { '12001': ['q1'], '12002': ['q1'] } }
        else if (m === 'ca05') ra[m] = { lam: { '12003': ['q9'] }, sai: { '12003': ['q9'] } }
        else ra[m] = { lam: {}, sai: {} }
      }
      return ra
    })
    const ra = await docCacCaTruoc('u', 'm', ['moi'], undefined, SBD)
    expect(ra.dsCa.map((c) => c.maCa)).toEqual(['ca00', 'ca05'])
    expect(chiTietCa).toHaveBeenCalledTimes(0)
  })

  it('CHƯA em nào có bản đồ ⇒ đường lui PHẢI chạy, không được cắt sạch', async () => {
    // Lỗ hổng phép kiểm bắt được bằng phá mã 10/09: đặt `canMoiEm = 0` thì
    // `conThieuEm()` luôn sai ⇒ đường lui KHÔNG BAO GIỜ chạy, em không có bản
    // đồ thì im lặng mất sạch câu hỏi lại. Bốn phép kiểm trên không bắt được
    // vì ca nào cũng đã có bản đồ sẵn.
    banDoSaiCa.mockImplementation(async (_u, _m, lo: string[]) => Object.fromEntries(lo.map((m) => [m, { lam: {}, sai: {} }])))
    const ra = await docCacCaTruoc('u', 'm', ['moi'], undefined, SBD)
    // Đường lui ĐÃ THỬ từng ca: mỗi ca thất bại để lại một dòng `boQua` mang
    // ĐÚNG mã ca. Cắt sạch thì chỉ còn mỗi dòng "+N ca cũ hơn".
    const thuThat = ra.boQua.filter((b) => !b.maCa.startsWith('+'))
    expect(thuThat.length).toBe(CA.length)
    expect(thuThat[0].maCa).toBe('ca00')
    expect(ra.boQua.some((b) => /bỏ qua cho nhanh/.test(b.vi_sao))).toBe(false)
  })

  it('không truyền danh sách em ⇒ giữ nguyên luật cũ, quét hết, không tự cắt', async () => {
    banDoSaiCa.mockImplementation(async (_u, _m, lo: string[]) => banDoCho(lo))
    const ra = await docCacCaTruoc('u', 'm', ['moi'], undefined, [])
    expect(ra.dsCa.length).toBe(60)
  })
})
