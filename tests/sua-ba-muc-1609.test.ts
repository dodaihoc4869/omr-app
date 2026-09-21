import { describe, it, expect, vi } from 'vitest'
import { JSDOM } from 'jsdom'
import { danhMucDangBai } from '../server/src/goi-cu'
import type { Env } from '../server/src/kieu'
import { taoHtmlMayChieu, type OBang } from '../src/lib/html-may-chieu'

describe('Danh mục đọc được cả hai đời nhãn', () => {
  it('lấy tên dạng cũ từ đúng gói, giữ mã và số câu, không đọc gói nhãn mới', async () => {
    const get = vi.fn(async () => ({ body: JSON.stringify({ nhom: '10 · DẠNG BÀI/Bài 1. Nguyên tử', nguon: 'Các loại hạt' }) }))
    const env = { DB: { prepare: () => ({ all: async () => ({ results: [
      { ma_de: 'DB-10-B1-D1', ten_de: '10 · DẠNG BÀI/Bài 1. Nguyên tử', so_cau: 25 },
      { ma_de: 'DB-12-B1-D1', ten_de: 'Dạng bài · 12 · Bài 1. Ester · Thủy phân', so_cau: 30 },
    ] }) }) }, DE: { get } } as unknown as Env
    const r = await danhMucDangBai(env)
    expect(r.ok).toBe(true)
    expect(r.tongDang).toBe(2)
    expect(get.mock.calls).toHaveLength(1)
    expect(JSON.stringify(r.lops)).toContain('Các loại hạt')
    expect(JSON.stringify(r.lops)).toContain('Thủy phân')
  })
})

// Từ M3 (64bfa4e) thẻ tên ẩn-tới-khi-bấm chỉ còn ở chế độ DẠY HỌC; chế độ thường gọi tên ngay khi vào đợt (giao-dien-to-chieu-1909).
it('chế độ dạy học: mở đề trước; từng mũi tên chỉ hiện đúng học sinh của nửa bảng đó', () => {
  const o = (name: string): OBang => ({ sbd: name, hoTen: name, soCau: 1,
    cau: { phan: 'I', id: name, text: 'Đề kiểm tra', luaChon: ['A','B','C','D'], dapAn: 'A', buoc: [] } as OBang['cau'],
    thanThu: { anh: '', ten: 'Thú ' + name, danhHieu: '', he: '', capDo: 1, hinhThai: '', tangThapCaoNhat: 0, soCauDaThanhTay: 0 },
  })
  const dom = new JSDOM(taoHtmlMayChieu([o('An'), o('Bình')], { dayHoc: true }), { runScripts: 'dangerously' })
  const doc = dom.window.document
  const heads = [...doc.querySelectorAll<HTMLElement>('header[id^="em-"]')]
  expect(heads.map(h => h.hidden)).toEqual([true, true])
  expect(doc.querySelector('.mc-than')?.textContent).toContain('Đề kiểm tra')
  doc.querySelector<HTMLButtonElement>('.mc-nut-hien-em')!.click()
  expect(heads.map(h => h.hidden)).toEqual([false, true])
  expect(heads[0].textContent).toContain('Thú An')
  expect(doc.querySelector<HTMLElement>('.mc-giai')!.hidden).toBe(true)
  dom.window.close()
})
