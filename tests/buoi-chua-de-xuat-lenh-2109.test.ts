// BUỔI CHỮA XẾP SẴN — phần nối máy (`src/lib/buoi-chua-de-xuat-lenh.ts`, Code 1, 21/09/2026): gọi lệnh không ném lỗi, kho câu dựng đúng quy ước mã máy chủ.
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { TeacherExamSource } from '../src/data/examContent'

const goiLenh = vi.fn()
vi.mock('../src/lib/goi-lenh-thay', () => ({ goiLenh: (...a: unknown[]) => goiLenh(...a) }))

import { khoTuNguon, layDeXuatBuoiChua } from '../src/lib/buoi-chua-de-xuat-lenh'

beforeEach(() => goiLenh.mockReset())

describe('layDeXuatBuoiChua — không ném lỗi, thẻ ẩn khi lệnh chưa có/lỗi', () => {
  it('thân đúng dạng ⇒ ok kèm đầu vào đã đọc; gửi đúng đường dẫn và tham số (ngay/lop chỉ khi có)', async () => {
    goiLenh.mockResolvedValue({ ok: true, du: { ok: true, ngay: '2026-09-22', soEmCoSo3Ngay: 24, dangCaLopYeu: [], cauSaiNhieu: [], dongBoNao: [] } })
    const r = await layDeXuatBuoiChua({ ngay: '2026-09-22', lop: '12A1' })
    expect(r).toMatchObject({ ok: true, du: { soEmCoSo: 24, ngay: '2026-09-22' } })
    expect(goiLenh.mock.calls[0][0]).toBe('/gv/buoi-chua-de-xuat')
    expect(goiLenh.mock.calls[0][1]).toEqual({ ngay: '2026-09-22', lop: '12A1' })
    await layDeXuatBuoiChua()
    expect(goiLenh.mock.calls[1][1]).toEqual({})
  })
  it('máy chủ chưa có lệnh / mất mạng / từ chối ⇒ trả NGUYÊN kết quả lỗi của goiLenh (màn ẩn thẻ, không ném)', async () => {
    for (const loai of ['chua_co_lenh', 'mang', 'cham', 'tu_choi', 'khong_doc_duoc']) {
      goiLenh.mockResolvedValueOnce({ ok: false, loai, chu: 'x' })
      expect(await layDeXuatBuoiChua()).toEqual({ ok: false, loai, chu: 'x' })
    }
  })
  it('thân không đúng dạng (ok:true nhưng không phải đối tượng hợp lệ) ⇒ khong_doc_duoc, không ném', async () => {
    goiLenh.mockResolvedValue({ ok: true, du: { ok: false } })
    expect(await layDeXuatBuoiChua()).toMatchObject({ ok: false, loai: 'khong_doc_duoc' })
  })
})

describe('khoTuNguon — kho câu trên máy thầy ⇒ CauKho theo quy ước mã máy chủ', () => {
  const nguon = (maDe: string, cau: Record<string, unknown>[]): TeacherExamSource => ({ maDe, phanI: cau, phanII: [], phanIII: [] } as unknown as TeacherExamSource)
  it('mã câu `<mã tờ gốc>-<phần>-<số>`; dạng và sao lấy từ câu (thiếu ⇒ null / 0); thứ tự kho giữ; mã trùng lấy câu đầu', () => {
    const kho = khoTuNguon([
      nguon('DH-12-C1-B2', [
        { id: 'DH-12-C1-B2-I-1', dang: { ma: 'ESTE.THUY_PHAN' }, canChua: { sao: 2 } },
        { id: 'DH-12-C1-B2-I-2' },
        { id: 'DH-12-C1-B2-I-1', dang: { ma: 'KHAC' }, canChua: { sao: 0 } }, // trùng mã
      ]),
    ])
    expect(kho.map((c) => c.qid)).toEqual(['DH-12-C1-B2-I-1', 'DH-12-C1-B2-I-2'])
    expect(kho[0]).toMatchObject({ phan: 'I', dang: 'ESTE.THUY_PHAN', sao: 2 })
    expect(kho[1]).toMatchObject({ dang: null, sao: 0 })
  })
  it('bỏ mục dạy học (-VD / -DT) và câu không dựng được mã (id riêng của tờ khác); không đoán', () => {
    const kho = khoTuNguon([nguon('X-VD', [{ id: 'X-VD-I-1' }]), nguon('Y', [{ id: 'TO-KHAC-I-5' }, { id: 'Y-I-3' }])])
    expect(kho.map((c) => c.qid)).toEqual(['Y-I-3'])
  })
  it('kho rỗng / thiếu phần ⇒ rỗng, không ném', () => {
    expect(khoTuNguon([])).toEqual([])
    expect(khoTuNguon([{ maDe: 'Z' } as unknown as TeacherExamSource])).toEqual([])
  })
})
