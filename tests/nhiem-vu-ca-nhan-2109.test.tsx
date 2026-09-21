// BTVN "NÂNG ĐỠ" trên BẢNG NHIỆM VỤ (học sinh + phụ huynh dùng chung bộ chuyển): lô ≡ chặng, "N câu của em".
// Hợp đồng docs/hop-dong-btvn-nang-do-2109.md mục 7: `chiTiet.caNhan:true`, `tongLo = soChang`, `chiSo` = chặng; chưa chốt: `chuaChot:true`.
import fs from 'node:fs'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { tuKeHoachNgay, type KeHoachNgayMayChu } from '../src/lib/nhiem-vu-adapter'
import TheLamNgay, { VachLo } from '../src/components/bang-nhiem-vu/TheLamNgay'
import { TheViec } from '../src/components/bang-nhiem-vu/DanhSachNhiemVu'

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
    expect(t.tieuDe).toBe('Bài tập về nhà · Chặng 2')
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

// ───────── thầy 21/09: tên thẻ, tổng số chặng, hạn bằng ngày giờ thật ─────────
describe('thẻ bài cá nhân hoá — tên "Bài tập về nhà · Chặng k", "trong K chặng", hạn thật', () => {
  const HAN_CHANG = new Date(2026, 8, 21, 23, 59).toISOString() // Thứ Hai 21/09 23:59
  const HAN_BAI = new Date(2026, 8, 24, 23, 59).toISOString() // Thứ Năm 24/09 23:59
  const TEN_TO = 'Bài tập: DH-12-C2-B6-TN'
  const cn = (chiSo: number, hanCung: string | null, hanBai?: string) => {
    const kh = keHoach([v({ id: `btvn_lo:B-CN:${chiSo}`, loai: 'btvn_lo', soCau: 8, hanCung, hanMem: null, chiTiet: { ma: 'B-CN', chiSo, tongLo: 7, treNhip: false, caNhan: true } })])
    const p = { dsBtvn: [{ maBtvn: 'B-CN', maCa: 'CA-CN', tenBtvn: TEN_TO, soCau: 52, ...(hanBai ? { hanNop: hanBai } : {}) }], dsMomGiao: [] }
    const d = tuKeHoachNgay(kh, NOW, p)
    return [...(d.lamNgay ? [d.lamNgay] : []), ...d.cacBac.flatMap((b) => b.viec)][0]
  }

  it('tên thẻ KHÔNG lấy mã tờ đề làm tên', () => {
    const t = cn(0, HAN_CHANG, HAN_BAI)
    expect(t.tieuDe).toBe('Bài tập về nhà · Chặng 1')
    expect(t.tieuDe).not.toContain('DH-12')
    expect(t.tieuDe).not.toContain('Bài tập:')
    expect(t.moSauKhiXong ?? '').not.toContain('DH-12')
  })

  it('ghi RÕ tổng số chặng', () => {
    expect(cn(0, HAN_CHANG, HAN_BAI).dongPhu![0]).toBe('Chặng 1 trong 7 chặng')
    expect(cn(3, HAN_CHANG, HAN_BAI).dongPhu![0]).toBe('Chặng 4 trong 7 chặng')
  })

  it('hạn chặng KHÁC hạn cả bài ⇒ hai dòng, đều bằng ngày giờ thật', () => {
    expect(cn(0, HAN_CHANG, HAN_BAI).dongPhu).toEqual(['Chặng 1 trong 7 chặng', 'Hạn chặng này: 23:59 Thứ Hai 21/09', 'Hạn nộp cả bài: 23:59 Thứ Năm 24/09', `Tờ đề: ${TEN_TO}`])
  })

  it('chưa có mốc riêng từng chặng (hạn chặng = hạn cả bài) ⇒ nói đúng thế, MỘT dòng', () => {
    expect(cn(0, HAN_BAI, HAN_BAI).dongPhu).toEqual(['Chặng 1 trong 7 chặng', 'Hạn chặng này: 23:59 Thứ Năm 24/09 · bằng hạn nộp cả bài', `Tờ đề: ${TEN_TO}`])
  })

  it('không biết hạn cả bài (danh sách BTVN chưa về) ⇒ chỉ nói hạn của chặng, không bịa hạn bài', () => {
    const d = cn(0, HAN_BAI).dongPhu!
    expect(d).toContain('Hạn chặng này: 23:59 Thứ Năm 24/09')
    expect(d.join('|')).not.toContain('cả bài')
  })

  it('không có hạn nào ⇒ không dòng hạn; mã tờ đề (nếu có) đứng CUỐI, chữ nhỏ', () => {
    const d = cn(0, null).dongPhu!
    expect(d).toEqual(['Chặng 1 trong 7 chặng', `Tờ đề: ${TEN_TO}`])
  })

  it('bài THƯỜNG không có dòng phụ, tên giữ nguyên "Lô"', () => {
    const t = viecDau(keHoach([v({ id: 'btvn_lo:B-THUONG:0', loai: 'btvn_lo', soCau: 6, hanCung: gio(40), hanMem: gio(20), chiTiet: { ma: 'B-THUONG', chiSo: 0, tongLo: 2, treNhip: false } })]))
    expect(t.dongPhu).toBeUndefined()
    expect(t.tieuDe).toBe('BTVN Amin: Lô 1/2')
  })

  it('thẻ "LÀM NGAY" của học sinh VÀ thẻ của phụ huynh đều vẽ đủ các dòng, tên truy cập không chứa mã tờ', () => {
    const t = cn(0, HAN_CHANG, HAN_BAI)
    for (const docChi of [false, true]) {
      const { unmount } = render(<TheLamNgay viec={t} docChi={docChi} onLam={() => {}} />)
      const sec = document.querySelector('[data-vung="lam-ngay"]')!
      expect(sec.querySelector('h2')!.textContent).toBe('Bài tập về nhà · Chặng 1')
      expect(sec.textContent).toContain('Chặng 1 trong 7 chặng')
      expect(sec.textContent).toContain('Hạn chặng này: 23:59 Thứ Hai 21/09')
      expect(sec.textContent).toContain('Hạn nộp cả bài: 23:59 Thứ Năm 24/09')
      expect(sec.getAttribute('aria-label')).not.toContain('DH-12')
      unmount()
    }
  })

  it('thẻ trong DANH SÁCH cũng có dòng phụ', () => {
    const t = cn(1, HAN_CHANG, HAN_BAI)
    render(<TheViec viec={t} nhanBac="BẮT BUỘC" docChi={false} onChon={() => {}} />)
    expect(document.body.textContent).toContain('Bài tập về nhà · Chặng 2')
    expect(document.body.textContent).toContain('Chặng 2 trong 7 chặng')
    expect(document.body.textContent).toContain('Hạn chặng này: 23:59 Thứ Hai 21/09')
  })
})
