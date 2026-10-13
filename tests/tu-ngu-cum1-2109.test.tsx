// CHUẨN HOÁ TỪ NGỮ · CỤM 1 "Máu + thần thú" (Boss duyệt bảng docs/ra-soat-tu-ngu-2109-code2.md 21/09; thầy: "Mập Địch 100 là gì").
// Luật 1: con số nào cũng có nhãn + đơn vị. Luật 2: tên riêng (biệt danh thần thú) đi SAU danh từ chung. Sửa chữ CÓ CHỦ Ý — aria-label cũ GIỮ nguyên.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { tuKeHoachNgay, type DuLieuBangNhiemVu, type KeHoachNgayMayChu, type TrangThaiThanThu } from '../src/lib/nhiem-vu-adapter'
const doc = (p: string) => readFileSync(resolve(process.cwd(), p), 'utf8')
/** Bỏ chú thích `//` và `/* *​/` để chỉ soi chữ thật. */
const boChuThich = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')
const NOW = new Date(2026, 8, 21, 10, 0).getTime()
const THU: TrangThaiThanThu = { kieu: 'co', pet: 'lua_phuong', cap: 37, ten: 'Mập Địch' }
const keHoach = (): KeHoachNgayMayChu => ({
  ok: true, ngay: '2026-09-21', nganSach: { mucTieuCau: 12, toiThieuCau: 6, vanTocGiay: 80, vanTocNguon: 'do', ghiChuVanToc: '' },
  viec: [] as never, canhBao: [], quaHan: [], tienBo: { daLamCau: 3, lenBac: 0, tutBac: 0, dat: false, toiThieuCau: 6, conThieu: 3 }, chuoiDat: 0, lanNghi: false, capNhatLuc: new Date(NOW).toISOString(),
})

beforeEach(() => localStorage.clear())
afterEach(() => cleanup())

describe('Đầu Bảng nhiệm vụ: biệt danh đi sau "Thần thú của em/con"', () => {
})

describe('Vinh danh: biệt danh đứng sau "Thần thú"; phiếu không có "nắm chắc"', () => {
  it('html-phieu.ts không còn chữ "nắm chắc" (nộp ≠ nắm; bộ soi giao diện báo LỖI ở dòng 1566)', () => {
    expect(doc('src/lib/html-phieu.ts')).not.toMatch(/nắm chắc/i)
    expect(doc('src/lib/html-phieu.ts')).toContain('Kiến thức cốt lõi. Bắt buộc, em làm trước.')
  })
})
