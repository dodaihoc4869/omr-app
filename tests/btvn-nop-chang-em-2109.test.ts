// NỘP CHẶNG — bộ điều phối phía host. Không mạng thật: phụ thuộc được tiêm.
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { docKetQuaChangDaLuu, doiLuotLam, khoaLuotLam, type KetQuaChang } from '../src/lib/btvn-ca-nhan-em'
import { LOI_MAY_CHU_BAN, loiChoEm, nopChangCaNhan, type PhuThuocNopChang, type TinNopChang } from '../src/lib/btvn-nop-chang-em'

const TIN: TinNopChang = { ma: 'B1', sbd: '12121212', chiSo: 0, dapAn: { q1: 'B', q3: '12,5' } }
const KET_OK: KetQuaChang = {
  ok: true,
  ketQua: [
    { qid: 'q1', dung: true, dapAnDung: 'B', loiGiai: { chot: 'Vì…' }, anhLoiGiai: [] },
    { qid: 'q3', dung: false, dapAnDung: '12', loiGiai: null, anhLoiGiai: [] },
  ],
  chuaLam: [],
  chang: { chiSo: 0, soCau: 2, soDung: 1, xong: true },
}

function dep(o: Partial<PhuThuocNopChang> = {}) {
  const thuTu: string[] = []
  const d = {
    layCauHinh: vi.fn(async () => (thuTu.push('cauHinh'), { URL: 'https://may-chu.thu' } as never)),
    nopChang: vi.fn(async () => (thuTu.push('nopChang'), KET_OK)),
    cuaEm: vi.fn(async () => (thuTu.push('cuaEm'), { ok: true, maBtvn: 'B1' })),
    dungPhieu: vi.fn(async () => (thuTu.push('dungPhieu'), '<html>moi</html>')),
    ...o,
  }
  return { d: d as PhuThuocNopChang & typeof d, thuTu }
}

beforeEach(() => localStorage.clear())

describe('nộp chặng thành công', () => {
  it('nộp → lưu kết quả ở máy → tải lại bài → dựng phiếu mới, ĐÚNG thứ tự', async () => {
    const { d, thuTu } = dep()
    const kq = await nopChangCaNhan(TIN, 'Riêng', d)
    expect(kq).toEqual({ ok: true, ket: KET_OK, html: '<html>moi</html>' })
    expect(thuTu).toEqual(['cauHinh', 'nopChang', 'cuaEm', 'dungPhieu'])
    expect(d.nopChang.mock.calls[0][1]).toEqual({ ma: 'B1', maBtvn: 'B1', sbd: '12121212', chiSo: 0, dapAn: { q1: 'B', q3: '12,5' } })
    expect(d.cuaEm.mock.calls[0].slice(1)).toEqual(['Riêng', '12121212', 'B1'])
    const luu = docKetQuaChangDaLuu('B1', '12121212', 0)
    expect(luu.ketQua.map((k) => k.qid)).toEqual(['q1', 'q3'])
    expect(luu.dapAn).toEqual({ q1: 'B', q3: '12,5' })
  })

  it('bài ca_nhan tải lại có soChang ⇒ trả kèm để vẽ thanh chặng; bài không cá nhân hoá ⇒ vắng', async () => {
    const co = await nopChangCaNhan(TIN, 'R', dep({ cuaEm: vi.fn(async () => ({ ok: true, caNhan: true, soChang: 7, chang: [{ chiSo: 0, soCau: 2, moLuc: '', daMo: true, daXong: true }] })) }).d)
    expect(co.soChang).toBe(7)
    localStorage.clear()
    const khong = await nopChangCaNhan(TIN, 'R', dep().d)
    expect(khong).not.toHaveProperty('soChang')
  })

  it('thầy cho làm lại ĐÚNG lúc em đang nộp (soLanLam đổi khi tải lại): bỏ làm dở lượt cũ nhưng GIỮ kết quả lượt MỚI vừa chấm', async () => {
    doiLuotLam('B1', '12121212', 1)
    localStorage.setItem('ddh.btvn.draft.B1.12121212', '{"q9":"X"}')
    localStorage.setItem('ddh.btvn.ketqua.B1.12121212.0', JSON.stringify({ ketQua: [{ qid: 'cu', dung: true, dapAnDung: 'A', loiGiai: null, anhLoiGiai: [] }], dapAn: { cu: 'A' } }))
    const { d } = dep({ cuaEm: vi.fn(async () => ({ ok: true, caNhan: true, soChang: 2, soLanLam: 2 })) })
    const kq = await nopChangCaNhan(TIN, 'R', d)
    expect(kq.ok).toBe(true)
    expect(localStorage.getItem(khoaLuotLam('B1', '12121212'))).toBe('2')
    expect(localStorage.getItem('ddh.btvn.draft.B1.12121212')).toBeNull() // làm dở lượt cũ đã bỏ
    const luu = docKetQuaChangDaLuu('B1', '12121212', 0)
    expect(luu.ketQua.map((k) => k.qid)).toEqual(['q1', 'q3']) // kết quả lượt mới còn; câu 'cu' của lượt cũ đã mất
  })

  it('nộp lần hai cùng câu: kết quả lần đầu thắng (đáp án đầu khoá)', async () => {
    await nopChangCaNhan(TIN, 'R', dep().d)
    const lan2 = { ...KET_OK, ketQua: [{ qid: 'q1', dung: false, dapAnDung: 'B', loiGiai: null, anhLoiGiai: [] }] }
    await nopChangCaNhan({ ...TIN, dapAn: { q1: 'A' } }, 'R', dep({ nopChang: vi.fn(async () => lan2) }).d)
    const luu = docKetQuaChangDaLuu('B1', '12121212', 0)
    expect(luu.ketQua.find((k) => k.qid === 'q1')!.dung).toBe(true)
    expect(luu.dapAn.q1).toBe('B')
  })
})

describe('nộp chặng hỏng — không nuốt lỗi, không lưu nhầm', () => {
  it('chặng chưa mở ⇒ lời báo riêng, không lưu, không tải lại', async () => {
    const { d } = dep({ nopChang: vi.fn(async () => ({ ok: false, lyDo: 'chang_chua_mo', ketQua: [], chuaLam: [] })) })
    const kq = await nopChangCaNhan(TIN, 'R', d)
    expect(kq).toEqual({ ok: false, error: 'Chặng này chưa mở. Em quay lại đúng ngày nhé.' })
    expect(d.cuaEm).not.toHaveBeenCalled()
    expect(docKetQuaChangDaLuu('B1', '12121212', 0).ketQua).toEqual([])
  })

  it('mất mạng / hết giờ (máy chủ nghẽn — sự cố D1 21/09) ⇒ lời rõ "Máy chủ đang bận, bài của em vẫn ở máy. Bấm nộp lại sau 1 phút." + cờ ban (phiếu khoá nút 15 giây), không lưu', async () => {
    const { d } = dep({ nopChang: vi.fn(async () => ({ ok: false, error: 'Không nối được máy chủ', ketQua: [], chuaLam: [] })) })
    expect(await nopChangCaNhan(TIN, 'R', d)).toEqual({ ok: false, error: LOI_MAY_CHU_BAN, ban: true })
    expect(LOI_MAY_CHU_BAN).toBe('Máy chủ đang bận, bài của em vẫn ở máy. Bấm nộp lại sau 1 phút.')
    expect(docKetQuaChangDaLuu('B1', '12121212', 0).ketQua).toEqual([])
  })

  it('máy chủ TỪ CHỐI có lý do (quá hạn, chưa mở, lời lạ) ⇒ KHÔNG phải "bận": không cờ ban (nút không bị khoá)', async () => {
    for (const ket of [{ ok: false, lyDo: 'qua_han' }, { ok: false, lyDo: 'chang_chua_mo' }, { ok: false, error: 'Bài này đã bị thầy thu hồi.' }]) {
      const { d } = dep({ nopChang: vi.fn(async () => ({ ...ket, ketQua: [], chuaLam: [] })) as never })
      const kq = await nopChangCaNhan(TIN, 'R', d)
      expect(kq.ok).toBe(false)
      expect(kq.ban).toBeUndefined()
    }
  })

  it('máy chủ nhận nhưng KHÔNG chấm câu nào (đáp án chưa hợp lệ) ⇒ báo rõ, không lưu, không dựng lại', async () => {
    const { d } = dep({ nopChang: vi.fn(async () => ({ ok: true, ketQua: [], chuaLam: ['q1', 'q3'] })) })
    const kq = await nopChangCaNhan(TIN, 'R', d)
    expect(kq.ok).toBe(false)
    expect(kq.error).toContain('Chưa có câu nào được chấm')
    expect(d.cuaEm).not.toHaveBeenCalled()
    expect(docKetQuaChangDaLuu('B1', '12121212', 0).ketQua).toEqual([])
  })

  it('bất kỳ phụ thuộc nào ném lỗi ⇒ trả lỗi có lời, KHÔNG ném ra ngoài', async () => {
    expect(await nopChangCaNhan(TIN, 'R', dep({ layCauHinh: vi.fn(async () => { throw new Error('x') }) }).d)).toMatchObject({ ok: false, ban: true, error: expect.stringContaining('bài của em vẫn ở máy') })
    expect(await nopChangCaNhan(TIN, 'R', dep({ nopChang: vi.fn(async () => { throw new Error('x') }) }).d)).toMatchObject({ ok: false })
  })
})

describe('đã nộp nhưng không dựng lại được phiếu', () => {
  it('tải lại bài hỏng ⇒ vẫn ok (kết quả ĐÃ lưu), chỉ vắng html để host nạp lại danh sách', async () => {
    for (const cuaEm of [vi.fn(async () => { throw new Error('mạng') }), vi.fn(async () => ({ ok: false }))]) {
      localStorage.clear()
      const kq = await nopChangCaNhan(TIN, 'R', dep({ cuaEm }).d)
      expect(kq.ok).toBe(true)
      expect(kq.html).toBeUndefined()
      expect(kq.ket).toBe(KET_OK)
      expect(docKetQuaChangDaLuu('B1', '12121212', 0).ketQua).toHaveLength(2)
    }
  })

  it('dựng phiếu ném lỗi ⇒ vẫn ok, không html', async () => {
    const kq = await nopChangCaNhan(TIN, 'R', dep({ dungPhieu: vi.fn(async () => { throw new Error('gói hỏng') }) }).d)
    expect(kq).toEqual({ ok: true, ket: KET_OK })
  })
})

describe('gói nộp không hợp lệ ⇒ không chạm mạng', () => {
  it.each([
    ['dapAn rỗng', { ...TIN, dapAn: {} }],
    ['chiSo âm', { ...TIN, chiSo: -1 }],
    ['chiSo lẻ', { ...TIN, chiSo: 0.5 }],
    ['chiSo không phải số', { ...TIN, chiSo: Number('x') }],
    ['thiếu mã bài', { ...TIN, ma: '' }],
    ['đáp án không phải chuỗi', { ...TIN, dapAn: { q1: 5 as unknown as string } }],
    ['dapAn là mảng', { ...TIN, dapAn: ['B'] as unknown as Record<string, string> }],
  ])('%s', async (_ten, tin) => {
    const { d } = dep()
    const kq = await nopChangCaNhan(tin, 'R', d)
    expect(kq.ok).toBe(false)
    expect(d.layCauHinh).not.toHaveBeenCalled()
    expect(d.nopChang).not.toHaveBeenCalled()
  })
})

describe('loiChoEm', () => {
  it('chặng chưa mở / quá hạn / lời của máy chủ / mặc định', () => {
    expect(loiChoEm({ lyDo: 'chang_chua_mo' })).toContain('chưa mở')
    expect(loiChoEm({ lyDo: 'qua_han' })).toContain('quá hạn')
    expect(loiChoEm({ error: 'Lời riêng' })).toBe('Lời riêng')
    expect(loiChoEm({ error: '   ' })).toContain('thử lại nhé')
    expect(loiChoEm({})).toContain('thử lại nhé')
  })
})
