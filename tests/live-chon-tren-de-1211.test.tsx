// LIVE THEO KHỐI — CHỌN ĐÁP ÁN NGAY TRÊN ĐỀ + CON DẤU ĐÈ CẢ MÀN (thầy 12/11 chiều, bản vẽ docs/ban-ve-live-moi-1211/23–27 đã duyệt «ok chốt build đẩy vượt luôn»):
// «Bỏ thẻ chưa đạt ở dưới đi. Chữ không đạt và đạt cho triện đè luôn cả sang phần đề, hiệu ứng bấm Đạt không đạt cũng hiển thị lên máy thầy. Phần chọn đáp án
// cho hiện nút luôn lên đề để hs chọn cho tiện, bỏ đáp án ở bên bảng đen để hs kéo được đề to nhất có thể.»
// Hành vi thật thử trên trình duyệt: scripts/thu-live-1011/thu-gv-that-1211.mjs (4e, 4f, 4o2, 4r, 4r2, 7d, 7i).
import { readFileSync } from 'node:fs'
import { act, fireEvent, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { daiLuot } from '../src/components/live/DaiLuot'
import { DauDat, TamTra } from '../src/components/live/TamTra'

const doc = (p: string) => readFileSync(p, 'utf8')
const tra = { chon: 'D S ', dat: () => {}, phim: () => {} }
/** Dựng dải rồi chạm thanh xám cho dải hiện (mặc định dải thu về thanh xám). */
const moDai = (ui: Parameters<typeof render>[0]) => { const r = render(ui); fireEvent.click(r.container.querySelector('.lv-tra-nam')!); return r }
afterEach(() => { vi.useRealTimers() })

describe('dải chọn đáp án ngay trên đề', () => {
  it('Đúng–sai: bốn nhóm a–d, nút Đúng / Sai giữ lựa chọn, ghi «n/4 ý» và «x/y bạn đã gửi»; chưa đủ 4 ý thì chưa gửi được', () => {
    const { container } = moDai(<TamTra so={2} phan="II" tuLuan={false} tra={tra} dem="0/1" />)
    expect(container.querySelectorAll('.lv-tra-hang').length).toBe(4)
    expect(container.querySelector('.lv-tra-hang [data-v="D"]')?.getAttribute('aria-pressed')).toBe('true')
    expect(container.querySelector('.lv-tra-dau')?.textContent).toContain('2/4 ý')
    expect(container.querySelector('.lv-tra-dau small')?.textContent).toBe('0/1 bạn đã gửi')
    expect((container.querySelector('.lv-tra-gui') as HTMLButtonElement).disabled).toBe(true)
  })
  it('trắc nghiệm và trả lời ngắn: A B C D · ô số + 12 phím', () => {
    expect(moDai(<TamTra so={1} phan="I" tuLuan={false} tra={{ ...tra, chon: 'B' }} onGui={() => {}} />).container.querySelector('.lv-tra-gui')?.textContent).toBe('Gửi đáp án B')
    expect(moDai(<TamTra so={5} phan="III" tuLuan={false} tra={{ ...tra, chon: '6.72' }} onGui={() => {}} />).container.querySelectorAll('.lv-tra-phim .lv-tra-nut').length).toBe(12)
  })
  it('(thầy 12/11 tối, bản vẽ 28–30) thu về THANH XÁM: câu mới chỉ có thanh + dòng nhắc 5 giây; chạm ⇒ dải hiện; 6 giây không chạm ⇒ tự thu, lựa chọn dở có chấm nhắc; sang câu mới ⇒ thu lại + nhắc lại', () => {
    vi.useFakeTimers()
    const { container, rerender } = render(<TamTra so={2} phan="II" tuLuan={false} tra={{ ...tra, chon: '' }} />)
    const q = (s: string) => container.querySelector(s)
    expect(q('.lv-tra')).toBeNull()
    expect(q('.lv-tra-nhac')?.textContent).toBe('Chạm thanh xám để chọn đáp án')
    expect(q('.lv-tra-nam')?.hasAttribute('data-do')).toBe(false)
    act(() => { vi.advanceTimersByTime(5100) })
    expect(q('.lv-tra-nhac')).toBeNull()
    expect(q('.lv-tra-nam')).not.toBeNull()
    fireEvent.click(q('.lv-tra-nam')!)
    expect(q('.lv-tra')).not.toBeNull()
    act(() => { vi.advanceTimersByTime(5000) })
    expect(q('.lv-tra')).not.toBeNull() // chưa đủ 6 giây
    fireEvent.pointerDown(q('.lv-tra')!) // em chạm ⇒ đếm lại
    act(() => { vi.advanceTimersByTime(5000) })
    expect(q('.lv-tra')).not.toBeNull()
    rerender(<TamTra so={2} phan="II" tuLuan={false} tra={tra} />) // em vừa chọn thêm ⇒ đếm lại
    act(() => { vi.advanceTimersByTime(6100) })
    expect(q('.lv-tra')).toBeNull()
    expect(q('.lv-tra-nam')?.hasAttribute('data-do')).toBe(true) // còn lựa chọn dở
    expect(q('.lv-tra-nhac')).toBeNull()
    rerender(<TamTra so={3} phan="I" tuLuan={false} tra={{ ...tra, chon: '' }} />) // câu mới
    expect(q('.lv-tra')).toBeNull()
    expect(q('.lv-tra-nhac')).not.toBeNull()
  })
  it('dải nằm trong KHUNG GIẤY (không còn trong khung bảng); vùng đọc đề dừng trên dải; dải thấp trên điện thoại ngang', () => {
    const k = doc('src/components/live/KhungDocLap.tsx'), l = doc('src/components/live/LopLive.tsx'), css = doc('src/components/live/live-em.css')
    expect(l).toContain('coTra={!!bangTra} duoiGiay={bangTra} bangTrong={coNet ? null :')
    expect(k).toContain('{coDuoi ? <div ref={duoi} className={`${L}-duoi`} data-thap={bc && bc.h < 480 ? \'\' : undefined}>{p.duoiGiay}</div> : null}')
    expect(k).toContain("height: caoDuoi ? `calc(100% - ${caoDuoi}px)` : '100%'")
    expect(css).toContain('.lv-duoi { position: absolute; left: 0; right: 0; bottom: 0;')
    expect(css).not.toContain('.lv-bang .lv-tra')
  })
})

describe('con dấu Đạt / Không đạt và dải dưới', () => {
  it('con dấu vẽ ở gốc màn live (đè cả đề lẫn bảng), có tên em lên bảng', () => {
    const { container, rerender } = render(<DauDat khoa="3:S1" dat={null} ten="Nguyễn Thị Hà" />)
    expect(container.querySelector('.lv-dau-dat')).toBeNull()
    rerender(<DauDat khoa="3:S1" dat={false} ten="Nguyễn Thị Hà" />)
    const d = container.querySelector('.lv-dau-dat')!
    expect(d.firstChild?.textContent).toBe('KHÔNG ĐẠT')
    expect(d.querySelector('small')?.textContent).toBe('Nguyễn Thị Hà · lên bảng')
    const l = doc('src/components/live/LopLive.tsx'), css = doc('src/components/live/live-em.css')
    expect(l).toMatch(/\n {6}\{dauDat\}\n/) // ngay dưới gốc `.lv`, không nằm trong khung bảng
    expect(css).toContain('.lv .lv-dau-dat { position: absolute; left: 50%; top: 47%; z-index: 30;')
    expect(css).not.toContain('.lv-bang .lv-dau-dat')
  })
  it('dải dưới KHÔNG còn thẻ «Đạt / Chưa đạt» (kể cả khi màn Bình Phản Ứng vẫn truyền nhãn); đang chọn thì dải nhường dải chọn', () => {
    const goi = { sbd: 'S9', ten: 'Bạn', doi: 0, lyDo: [], emDoan: null, emTiep: 0, tiep: 0, dat: false }
    const mo = { pha: 'mo', so: 2, phan: 'II', tuLuan: false, emTra: { chon: 'DSSD' }, daGui: 1, coMat: 1, goi, ketQua: { dung: false, kj: 50 } }
    const { container } = render(<div>{daiLuot({ l: mo as never, sbd: 'S1', doi: 0, daGuiMay: false, ketQuaBang: <b className="the-ket-qua">Chưa đạt</b>, gui: () => true })}</div>)
    expect(container.querySelector('.the-ket-qua')).toBeNull()
    expect(container.textContent).toContain('Chưa đúng')
    expect(container.textContent).not.toMatch(/đạt/i)
    const lam = { pha: 'tra-loi', so: 2, phan: 'II', tuLuan: false, emTra: null, daGui: 0, coMat: 1, goi: null }
    expect(daiLuot({ l: lam as never, sbd: 'S1', doi: 0, daGuiMay: false, gui: () => true, conLam: true })).toBeNull()
  })
  it('máy thầy: mọi đường chấm trên tờ (dauKq) trong buổi live theo khối đều đóng dấu giữa màn chiếu 3 giây', () => {
    const khoi = doc('src/lib/live-khoi-to-chieu.ts')
    expect(khoi).toContain('lvDauKq(khoa, dat); if (lvKhoi()) lvDau(!!dat);')
    expect(khoi).toContain("e.textContent = dat ? 'ĐẠT' : 'KHÔNG ĐẠT';")
    expect(khoi).toContain('.mc-lv-dau{position:fixed;left:50%;top:47%;z-index:60;')
    expect(doc('src/lib/live-to-chieu.ts')).toContain('${CSS_LIVE_NOP}${CSS_LIVE_KHOI}')
  })
})
