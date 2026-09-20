// BTVN "NÂNG ĐỠ" trên BẢNG NHIỆM VỤ (học sinh + phụ huynh dùng chung bộ chuyển): lô ≡ chặng, "N câu của em".
// Hợp đồng docs/hop-dong-btvn-nang-do-2109.md mục 7: `chiTiet.caNhan:true`, `tongLo = soChang`, `chiSo` = chặng; chưa chốt: `chuaChot:true`.
import fs from 'node:fs'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { tuKeHoachNgay, type KeHoachNgayMayChu } from '../src/lib/nhiem-vu-adapter'
import { VachLo } from '../src/components/bang-nhiem-vu/TheLamNgay'

afterEach(() => cleanup())

const NOW = Date.parse('2026-09-21T09:00:00+07:00')
const gio = (h: number) => new Date(NOW + h * 3600_000).toISOString()
const v = (o: object) => ({ thuTu: 1, batBuoc: true, khan: false, cong: null, hien: true, nhan: null, trangThai: 'cho', ghiChu: '', chiTiet: {}, hanCung: null, hanMem: null, nguon: 'x', ...o })
const phu = { dsBtvn: [{ maBtvn: 'B-CN', maCa: 'CA-CN', tenBtvn: 'BTVN Ester – lipid', soCau: 52 }, { maBtvn: 'B-THUONG', maCa: 'CA-T', tenBtvn: 'BTVN Amin', soCau: 12 }], dsMomGiao: [] }
const keHoach = (viec: object[]): KeHoachNgayMayChu => ({
  ok: true,
  ngay: '2026-09-21',
  nganSach: { mucTieuCau: 12, toiThieuCau: 6, vanTocGiay: 80, vanTocNguon: 'do', ghiChuVanToc: '' },
  viec: viec as never,
  canhBao: [],
  quaHan: [],
  tienBo: { daLamCau: 0, lenBac: 0, tutBac: 0, dat: false, toiThieuCau: 6, conThieu: 6 },
  chuoiDat: 0,
  lanNghi: false,
  capNhatLuc: gio(-0.2),
})
const viecDau = (kh: KeHoachNgayMayChu) => {
  const d = tuKeHoachNgay(kh, NOW, phu)
  return [...(d.lamNgay ? [d.lamNgay] : []), ...d.cacBac.flatMap((b) => b.viec)][0]
}

describe('thẻ việc BTVN cá nhân hoá: chặng, không phải lô', () => {
  const ca = (ct: object, soCau = 8) => v({ id: 'btvn_lo:B-CN:1', loai: 'btvn_lo', soCau, hanCung: gio(30), hanMem: gio(20), chiTiet: { ma: 'B-CN', chiSo: 1, tongLo: 7, treNhip: false, caNhan: true, ...ct } })

  it('tiêu đề "Chặng 2/7", nút "Làm chặng 2", mô tả "8 câu của em", thanh tiến độ theo chặng', () => {
    const t = viecDau(keHoach([ca({})]))
    expect(t.tieuDe).toBe('BTVN Ester – lipid: Chặng 2/7')
    expect(t.hanhDong.nhanNut).toBe('Làm chặng 2')
    expect(t.hanhDong.loai).toBe('mo_btvn')
    expect(t.moTa).toContain('8 câu của em')
    expect(t.moTa).not.toMatch(/Lô/)
    expect(t.tienDoLo).toEqual({ hienTai: 2, tong: 7, laChang: true })
  })

  it('bộ câu CHƯA chốt: nói thật, không đưa một con số như thể là số câu của em', () => {
    const t = viecDau(keHoach([ca({ chuaChot: true }, 12)]))
    expect(t.moTa).toContain('Bộ câu của em chốt khi em mở bài')
    expect(t.moTa).not.toMatch(/\d+ câu của em/)
  })

  it('caNhan phải đúng `true` (chuỗi/1 không tính)', () => {
    for (const caNhan of ['true', 1, 'yes']) {
      const t = viecDau(keHoach([ca({ caNhan })]))
      expect(t.tieuDe).toContain('Lô 2/7')
      expect(t.hanhDong.nhanNut).toBe('Làm Lô 2')
      expect(t.tienDoLo).toEqual({ hienTai: 2, tong: 7 })
    }
  })

  it('bài THƯỜNG không đổi một chữ: Lô, Làm Lô N, "N câu", tienDoLo không có laChang', () => {
    const t = viecDau(keHoach([v({ id: 'btvn_lo:B-THUONG:0', loai: 'btvn_lo', soCau: 6, hanCung: gio(40), hanMem: gio(20), chiTiet: { ma: 'B-THUONG', chiSo: 0, tongLo: 2, treNhip: false } })]))
    expect(t.tieuDe).toBe('BTVN Amin: Lô 1/2')
    expect(t.hanhDong.nhanNut).toBe('Làm Lô 1')
    expect(t.moTa).toContain('6 câu')
    expect(t.moTa).not.toContain('của em')
    expect(t.tienDoLo).toEqual({ hienTai: 1, tong: 2 })
  })
})

describe('VachLo (thanh tiến độ)', () => {
  it('bài cá nhân hoá đọc "Chặng x trên y"; bài thường vẫn "Lô x trên y"', () => {
    const { unmount } = render(<VachLo tienDo={{ hienTai: 2, tong: 7, laChang: true }} />)
    expect(screen.getByRole('img', { name: 'Chặng 2 trên 7' })).toBeTruthy()
    unmount()
    render(<VachLo tienDo={{ hienTai: 1, tong: 3 }} />)
    expect(screen.getByRole('img', { name: 'Lô 1 trên 3' })).toBeTruthy()
  })
})

describe('hàng BTVN trong danh sách của em (hợp đồng mã nguồn)', () => {
  const ma = fs.readFileSync(path.join(process.cwd(), 'src/screens/StudentPortalScreen.tsx'), 'utf8')
  it('bài cá nhân hoá ghi "Câu của em" + số chặng; chưa chốt thì nói "chốt khi em mở bài"; bài thường vẫn "Số câu"', () => {
    expect(ma).toContain('Câu của em: <strong>{bt.soCauCuaEm}</strong>')
    expect(ma).toContain("typeof bt.soCauCuaEm === 'number'")
    expect(ma).toContain('Bộ câu của em chốt khi em mở bài')
    expect(ma).toContain('Số câu: <strong>{bt.soCau}</strong>')
  })
  it('nút làm lại: bài cá nhân hoá không hiện "Đã hết lượt làm lại" mà "Làm lại khi Thầy cho phép"', () => {
    expect(ma).toContain("bt.caNhan ? 'Làm lại khi Thầy cho phép' : 'Đã hết lượt làm lại'")
  })
})
