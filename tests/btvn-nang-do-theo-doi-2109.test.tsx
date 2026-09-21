// BTVN NÂNG ĐỠ — TAB THEO DÕI của thầy (hợp đồng docs/hop-dong-btvn-nang-do-2109.md mục 6): "chặng a/b", số câu của em, so lớp CHỈ trên lõi. Toàn SỐ ĐẾM, không xếp hạng.
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import fs from 'node:fs'
import path from 'node:path'
import HocSinhNhanBai from '../src/components/HocSinhNhanBai'
import type { DongTheoDoiBtvn } from '../src/lib/btvn-may-chu-moi'

afterEach(() => cleanup())

const em = (o: Record<string, unknown>) => ({ sbd: '001', hoTen: 'Lê Minh Đức', nopLuc: null, soDung: null, soCau: null, thuHoi: false, ...o })
const bai = (o: Partial<DongTheoDoiBtvn>, hs: Record<string, unknown>[]): DongTheoDoiBtvn =>
  ({ maBtvn: 'B1', maCa: 'C1', maDe: 'D1', soCau: 80, giaoLuc: '2026-09-21T01:00:00Z', hanNop: '2026-09-28T15:00:00Z', quaHan: false, tong: hs.length, daNop: 0, chuaNop: [], hocSinh: hs, ...o }) as unknown as DongTheoDoiBtvn
const dung = (b: DongTheoDoiBtvn) => render(<HocSinhNhanBai maTheoSbd={{}} bai={b} busy={false} onAction={() => {}} />)

describe('theo dõi bài NÂNG ĐỠ', () => {
  it('em đã mở bài: "Bộ của em: N câu · chặng a/b" + lõi đúng/lõi (so lớp CHỈ trên lõi) + câu thưởng chưa đúng; điểm "trên câu của em"', () => {
    const { container } = dung(
      bai({ caNhan: true, soLoi: 26 }, [em({ soCauCuaEm: 46, soChang: 7, loDaXong: 3, soCau: 46, soDung: 30, soDungLoi: 20, soCauLoi: 26, diemLoi: 7.69, soCauThuongSai: 2, nopLuc: '2026-09-23T03:00:00Z' })]),
    )
    const dong = container.querySelector('[data-khoi="nang-do"]') as HTMLElement
    expect(dong.textContent).toContain('Bộ của em: 46 câu · chặng 3/7')
    expect(dong.textContent).toContain('Câu cốt lõi: 20/26 (7.7/10)')
    expect(dong.textContent).toContain('Câu thưởng chưa đúng: 2 (không tính vào điểm)')
    expect(container.textContent).toContain('30/46 câu đúng (trên câu của em)')
    expect(container.textContent).not.toMatch(/xếp hạng|thứ hạng|top \d/i)
  })

  it('BẢN 1.2: em có câu thử sức thêm ⇒ "Bộ của em: bắt buộc N câu · thử sức thêm M câu (không bắt buộc) · chặng a/b"; máy chủ chưa trả / bằng 0 ⇒ chữ cũ', () => {
    const { container } = dung(bai({ caNhan: true, soLoi: 26 }, [em({ soCauCuaEm: 20, soChang: 4, loDaXong: 2, soThuSucThem: 9 })]))
    expect((container.querySelector('[data-khoi="nang-do"]') as HTMLElement).textContent).toBe('Bộ của em: bắt buộc 20 câu · thử sức thêm 9 câu (không bắt buộc) · chặng 2/4')
    cleanup()
    const c2 = dung(bai({ caNhan: true, soLoi: 26 }, [em({ soCauCuaEm: 20, soChang: 4, loDaXong: 2, soThuSucThem: 0 })])).container
    expect((c2.querySelector('[data-khoi="nang-do"]') as HTMLElement).textContent).toBe('Bộ của em: 20 câu · chặng 2/4')
  })

  it('em CHƯA mở bài: nói bộ câu chưa chốt — không bịa số câu/chặng', () => {
    const { container } = dung(bai({ caNhan: true, soLoi: 26 }, [em({ soCauCuaEm: null, soChang: null })]))
    const dong = container.querySelector('[data-khoi="nang-do"]') as HTMLElement
    expect(dong.textContent).toBe('Chưa mở bài — bộ câu chưa chốt')
  })

  it('bài CŨ (không caNhan): y như trước — không có khối nâng đỡ, không chữ "trên câu của em"', () => {
    const { container } = dung(bai({}, [em({ soCau: 80, soDung: 60, nopLuc: '2026-09-23T03:00:00Z', soCauCuaEm: 46, soChang: 7 })]))
    expect(container.querySelector('[data-khoi="nang-do"]')).toBeNull()
    expect(container.textContent).toContain('60/80 câu đúng (7.5/10)')
    expect(container.textContent).not.toContain('trên câu của em')
  })

  it('lõi chưa có mẫu (soCauLoi = 0/null) → không in dòng lõi', () => {
    const { container } = dung(bai({ caNhan: true }, [em({ soCauCuaEm: 40, soChang: 6, loDaXong: 0, soCauLoi: 0, soDungLoi: 0 })]))
    expect((container.querySelector('[data-khoi="nang-do"]') as HTMLElement).textContent).toBe('Bộ của em: 40 câu · chặng 0/6')
  })

  it('màn Giao bài: thẻ bài nâng đỡ có chip "Cá nhân hoá · lõi N câu" + "Điểm mỗi em tính trên số câu của em; so cả lớp CHỈ trên câu cốt lõi."', () => {
    const src = fs.readFileSync(path.join(process.cwd(), 'src/screens/PhanCongScreen.tsx'), 'utf8')
    expect(src).toContain('Cá nhân hoá · {t.soLoi ?? 0} câu cốt lõi')
    expect(src).toContain('Điểm mỗi em tính trên số câu của em; so cả lớp CHỈ trên câu cốt lõi.')
    expect(src).toContain("{t.caNhan ? ' trong bài' : ''}")
  })
})
