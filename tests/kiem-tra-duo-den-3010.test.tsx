// MÀN KIỂM TRA KIỂU DUO 30/10 (đặc tả docs/dac-ta-kiem-tra-duo-3010.md): giám thị cạnh đề + đèn pha soi ô em vừa chạm + chữ mảnh.
// Khoá: hình học tia; đèn tự tắt; đèn KHÔNG đọc đáp án (mã nguồn không chạm trường đáp án / API); người coi theo phần; lời nhắc duy nhất ngắn, không bàn câu;
// khung ThiDuo có lớp giám thị + lớp đèn ẩn với trình đọc màn hình; tấm nộp có giám thị.
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { render } from '@testing-library/react'
import { hinhTia, taoDenSoi, MS_GIU_DEN } from '../src/components/kiem-tra-duo/den-soi'
import { GT_THEO_PHAN, LOI_SAP_HET_GIO } from '../src/components/kiem-tra-duo/GiamThiThi'
import ThiDuo from '../src/components/kiem-tra-duo/ThiDuo'

const soTrongTf = (tf: string) => (tf.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number)

describe('đèn pha — hình học tia (den-soi.hinhTia)', () => {
  it('ô nằm ngang bên phải ⇒ xoay 0°, dài đúng khoảng cách tới tâm ô', () => {
    const h = hinhTia({ x: 10, y: 100 }, { x: 300, y: 80, w: 200, h: 40 })
    const [tx, ty, deg, sx] = soTrongTf(h.tia)
    expect(tx).toBe(10); expect(ty).toBe(50); expect(deg).toBe(0)
    expect(sx).toBeCloseTo(3.9, 2) // tâm ô x = 400 ⇒ 390 px / 100
  })
  it('ô ngay dưới ⇒ xoay 90°; miệng tia kẹp 36–150 px', () => {
    const doc = hinhTia({ x: 100, y: 0 }, { x: 0, y: 300, w: 200, h: 60 })
    expect(soTrongTf(doc.tia)[2]).toBe(90)
    const rong = hinhTia({ x: 0, y: 0 }, { x: 0, y: 400, w: 1000, h: 60 })
    expect(soTrongTf(rong.tia)[4]).toBeLessThanOrEqual(1.5)
    const hep = hinhTia({ x: 0, y: 0 }, { x: 400, y: 0, w: 20, h: 10 })
    expect(soTrongTf(hep.tia)[4]).toBeGreaterThanOrEqual(0.36)
  })
  it('vũng sáng phủ ô + tràn 12 px mỗi bên', () => {
    const h = hinhTia({ x: 0, y: 0 }, { x: 100, y: 200, w: 300, h: 60 })
    const [x, y, sx, sy] = soTrongTf(h.vung)
    expect([x, y]).toEqual([88, 188]); expect(sx).toBeCloseTo(3.24, 2); expect(sy).toBeCloseTo(0.84, 2)
  })
})

describe('đèn pha — bật / tắt (taoDenSoi)', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })
  it('soi ⇒ lớp mang data-bat; tự tắt sau ~1,1 s không chạm; tắt ngay khi đổi câu', () => {
    const lop = document.createElement('div')
    const den = taoDenSoi(lop)
    expect(lop.querySelectorAll('i')).toHaveLength(3)
    den.soi({ x: 10, y: 10 }, { x: 100, y: 200, w: 300, h: 60 })
    expect(lop.hasAttribute('data-bat')).toBe(true)
    expect(den.dangSang()).toBe(true)
    vi.advanceTimersByTime(MS_GIU_DEN + 10)
    expect(den.dangSang()).toBe(false)
    vi.advanceTimersByTime(600)
    expect(lop.hasAttribute('data-bat')).toBe(false) // hết sáng ⇒ gỡ will-change (0 lớp GPU lúc nghỉ)
    den.soi({ x: 10, y: 10 }, { x: 100, y: 200, w: 300, h: 60 })
    den.tat(true)
    expect(lop.hasAttribute('data-bat')).toBe(false)
    den.huy()
    expect(lop.querySelectorAll('i')).toHaveLength(0)
  })
  it('ô không có kích thước (ẩn) ⇒ không bật', () => {
    const lop = document.createElement('div')
    const den = taoDenSoi(lop)
    den.soi({ x: 0, y: 0 }, { x: 0, y: 0, w: 0, h: 0 })
    expect(lop.hasAttribute('data-bat')).toBe(false)
  })
})

describe('giám thị ở màn kiểm tra — luật thi', () => {
  it('người coi theo phần: I Tí · II Cô Cốc · III Chú Tam', () => {
    expect(GT_THEO_PHAN).toEqual({ I: 'nb', II: 'th', III: 'vd' })
  })
  it('lời nhắc duy nhất: ≤ 42 kí tự, không bàn về câu / đáp án', () => {
    expect(LOI_SAP_HET_GIO.length).toBeLessThanOrEqual(42)
    expect(LOI_SAP_HET_GIO).not.toMatch(/đúng|sai|dễ|khó|đáp án/i)
  })
  it('đèn + giám thị KHÔNG đọc đáp án, không gọi máy chủ (khoá mã nguồn)', () => {
    for (const tep of ['src/components/kiem-tra-duo/den-soi.ts', 'src/components/kiem-tra-duo/GiamThiThi.tsx']) {
      const ma = readFileSync(tep, 'utf8').replace(/\/\/.*$/gm, '')
      expect(ma).not.toMatch(/\bcorrect\b|dapAn|keyBank|fetch\(|exam-api|answers/)
    }
  })
  it('chữ mảnh: đề, phương án, ý Đúng–Sai, ô số dùng độ đậm 500 ở màn thi', () => {
    const css = readFileSync('src/styles/trong-kiem-tra.css', 'utf8')
    expect(css).toMatch(/\.duo-kt-thi \.cau-de \{ font-weight: 500;/)
    expect(css).toMatch(/:is\(\.pa-hang, \.pa-ma, \.y-hang, \.y-ma\) \{ font-weight: 500; \}/)
    expect(css).toMatch(/:is\(\.bns-o, \.bns-phim button\) \{ font-weight: 500; \}/)
  })
})

describe('khung ThiDuo có giám thị + đèn', () => {
  it('lớp giám thị và lớp đèn nằm trong khối câu, ẩn với trình đọc màn hình; khối câu mang data-gt', () => {
    const { container } = render(
      <ThiDuo tenCa="Ca thử" dongHo="10:00" nhanDongHo="Thời gian còn lại" gap={false} daLam={0} tong={2} luu={{ nhan: 'đã lưu', tt: 'da' }}
        cauHien={1} onDenCau={() => {}} phan={['I', 'I']} moTaPhan={() => ''} moLuoi={false} onMoLuoi={() => {}} moNop={false} onMoNop={() => {}}
        chuaLam={[1, 2]} danhDau={[]} nhanNutNop="Nộp bài" camNopSom={false} onNop={() => {}} onThoat={() => {}} tatPhim={false}>
        <div id="cau-1" className="the-cau"><div /><div><div className="cau-de">Đề</div></div></div>
      </ThiDuo>,
    )
    const than = container.querySelector('.duo-kt-than')!
    expect(than.getAttribute('data-gt')).toBe('')
    expect(than.querySelector(':scope > .kt-gt[aria-hidden="true"]')).toBeTruthy()
    expect(than.querySelector(':scope > .kt-den[aria-hidden="true"]')?.querySelectorAll('i')).toHaveLength(3)
  })
})
