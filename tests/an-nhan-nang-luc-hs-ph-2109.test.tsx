// NHÃN XẾP LOẠI KHÔNG HIỆN Ở HỌC SINH / PHỤ HUYNH (chuẩn từ ngữ 21/09; Code 4 báo, Boss giao): thẻ tiến bộ dùng chung (`TheTienBo` → `BieuDoTienBoGoogle`) tự in `classify(điểm)` ("Yếu", "Khá"…)
// và "Hạng x/sĩ số" cạnh điểm. Ở HS/PH ta KHÔNG gắn nhãn năng lực / hạng — chỉ điểm và so với lần trước của chính em. Màn thầy giữ nguyên (mặc định hiện).
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render } from '@testing-library/react'
import fs from 'node:fs'
import path from 'node:path'
import BieuDoTienBoGoogle from '../src/components/BieuDoTienBoGoogle'
import TheTienBo from '../src/components/TheTienBo'
import { classify } from '../src/engine/score'
import type { HoSoEm } from '../src/lib/exam-api'

afterEach(cleanup)
const doc = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8')
const ca = (maCa: string, tong: number, ngay: string, hang: number | null): HoSoEm['ca'][number] =>
  ({ maCa, tenCa: `Ca ${maCa}`, lop: '', lanThu: 1, nopLuc: ngay, trangThai: 'da_nop', diemI: null, diemII: null, diemIII: null, tong, tongCau: 28, soCauDung: 10, soCauSai: 18, hang, siSo: hang ? 40 : null, phanTich: null }) as never
const CA: HoSoEm['ca'] = [ca('A', 2.5, '2026-09-10T02:00:00Z', 31), ca('B', 6.5, '2026-09-17T02:00:00Z', 9)]

describe('BieuDoTienBoGoogle — nhãn xếp loại + hạng', () => {
  it('MẶC ĐỊNH (màn thầy): còn in nhãn xếp loại cạnh điểm và "Hạng x/sĩ số" — không đổi hành vi cũ', () => {
    const { container } = render(<BieuDoTienBoGoogle ca={CA} />)
    const chu = container.textContent || ''
    expect(chu).toContain(classify(2.5))
    expect(chu).toContain(classify(6.5))
    const nut = container.querySelectorAll('svg circle, button')
    expect(nut.length).toBeGreaterThan(0)
  })

  it('HS/PH (`anNhanNangLuc`): KHÔNG nhãn xếp loại của bất kỳ ca nào, KHÔNG "Hạng"; số điểm vẫn còn', () => {
    const { container } = render(<BieuDoTienBoGoogle ca={CA} anNhanNangLuc />)
    const chu = container.textContent || ''
    expect(chu).not.toContain(classify(2.5))
    expect(chu).not.toContain(classify(6.5))
    expect(chu).not.toMatch(/Hạng \d+\/\d+/)
    expect(chu).toMatch(/2,5/)
    expect(chu).toMatch(/6,5/)
  })

  it('bấm chọn một ca (chi tiết ca): mặc định có nhãn + hạng; `anNhanNangLuc` thì không', () => {
    for (const an of [false, true]) {
      const { container, unmount } = render(<BieuDoTienBoGoogle ca={CA} anNhanNangLuc={an} />)
      for (const cham of container.querySelectorAll('circle')) fireEvent.click(cham)
      const chu = container.textContent || ''
      expect(/Hạng \d+\/\d+/.test(chu), `an=${an}`).toBe(!an)
      unmount()
    }
  })
})

describe('TheTienBo truyền cờ xuống; chỉ màn HS/PH bật', () => {
  it('TheTienBo có prop anNhanNangLuc và chuyển cho biểu đồ', () => {
    const t = doc('src/components/TheTienBo.tsx')
    expect(t).toContain('anNhanNangLuc = false')
    expect(t).toContain('anNhanNangLuc={anNhanNangLuc}')
  })
  it('modal báo cáo HỌC SINH và PHỤ HUYNH bật cờ; màn thầy (ExamMonitor, BaoCaoMotEm) KHÔNG bật', () => {
    expect(doc('src/components/BaoCaoCaThiHocSinhModal.tsx')).toMatch(/<TheTienBo [^>]*anNhanNangLuc \/>/)
    expect(doc('src/components/BaoCaoCaThiPhuHuynhModal.tsx')).toMatch(/<TheTienBo[\s\S]*?anNhanNangLuc\s*\/>/)
    expect(doc('src/components/xem-diem-gv/BaoCaoMotEm.tsx')).not.toContain('anNhanNangLuc')
    expect(doc('src/screens/ExamMonitorScreen.tsx')).not.toContain('anNhanNangLuc')
  })
  it('dùng thẻ thật: TheTienBo với cờ ⇒ không nhãn xếp loại', () => {
    const lichSu = [{ maCa: 'A', tenCa: 'Ca A', nopLuc: '2026-09-10T02:00:00Z', tong: 2.5, tongCau: 28 }, { maCa: 'B', tenCa: 'Ca B', nopLuc: '2026-09-17T02:00:00Z', tong: 6.5, tongCau: 28 }]
    const dangMo = { maCa: 'B', tenCa: 'Ca B', diem: 6.5 } as never
    const co = render(<TheTienBo lichSu={lichSu} dangMo={dangMo} anNhanNangLuc />)
    expect(co.container.textContent).not.toContain(classify(6.5))
    co.unmount()
    const khong = render(<TheTienBo lichSu={lichSu} dangMo={dangMo} />)
    expect(khong.container.textContent).toContain(classify(6.5))
  })
})
