// TỜ MÁY CHIẾU CHIẾN DỊCH CÓ HAI NÚT ĐẠT / CHƯA ĐẠT — dùng LẠI cầu nối của Gọi lên bảng (`to-chieu-cau-noi.ts`) và CÙNG lệnh
// `ghiLenBang` (không lệnh máy chủ mới). Tin đến phải qua `kiemTinToChieu` (đúng khung, gốc, mã phiên, ô có trên tờ); chống ghi
// đôi theo khoá `sbd|qid`; kết quả hiện lại trên Buổi chữa ("Em 01: Đạt").
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, render, waitFor } from '@testing-library/react'
import { useImperativeHandle, forwardRef } from 'react'

const { ghiLenBang, toast } = vi.hoisted(() => ({ ghiLenBang: vi.fn(), toast: vi.fn() }))
vi.mock('../src/lib/goi-lenh-thay', () => ({ goiLenh: vi.fn() }))
vi.mock('../src/lib/exam-api', () => ({ ghiLenBang: (...a: unknown[]) => ghiLenBang(...a) }))
vi.mock('../src/lib/exam-db', () => ({
  loadExamSources: async () => [],
  loadScriptUrl: async () => 'https://may-chu.test',
  loadTeacherSecret: async () => 'bi-mat',
}))

import BuoiChua from '../src/components/chien-dich/BuoiChua'
import type { BuoiChuaMayChu, CauBuoiChua, EmTen } from '../src/components/chien-dich/api'
import { dungToChieu, type CauGoc, type OGhiToChieu } from '../src/components/chien-dich/to-chieu'
import { docKetQuaNho, useGhiToChieu } from '../src/components/chien-dich/ghi-to-chieu'
import { TIN_TO_CHIEU } from '../src/lib/to-chieu-cau-noi'
import { useAppStore } from '../src/store/appStore'

const goc = (stt: number, chuyenDe: string): CauGoc => ({
  phan: 'I',
  q: { id: `DE-A-I-${stt}`, text: `Câu ${stt}: ester nào sau đây`, choices: ['a', 'b', 'c', 'd'], correct: 'A', chuyenDe } as never,
})
const TRA = new Map<string, CauGoc>([
  ['DE-A-I-17', goc(17, 'Ester – Lipid')],
  ['DE-A-I-44', goc(44, '')],
])

beforeEach(() => {
  ghiLenBang.mockReset()
  toast.mockReset()
  useAppStore.setState({ showToast: toast } as never)
  localStorage.clear()
})
afterEach(cleanup)

describe('dựng tờ chiếu có nút', () => {
  it('có mã phiên ⇒ tờ có cầu nối; chỉ ô CÓ em + tra được chuyên đề mới có nút', async () => {
    const { html, o } = await dungToChieu(
      [
        { qid: 'DE-A-I-17', stt: 17, phan: 'I', mucDo: 'VD', sbd: '01', ten: 'Em 01', viSao: 'Giải mẫu' },
        { qid: 'DE-A-I-44', stt: 44, phan: 'I', mucDo: 'VD', sbd: '02', ten: 'Em 02', viSao: 'Giải mẫu' },
        { qid: 'DE-A-I-23', stt: 23, phan: 'I', mucDo: 'VD', sbd: '', ten: 'Cả lớp', viSao: 'x' },
      ],
      'Buổi chữa · Ester',
      TRA,
      'phien123',
    )
    expect(html).toContain('data-cau-noi="phien123"')
    expect(html).toContain('data-khoa="01|DE-A-I-17"')
    expect(html).not.toContain('data-khoa="02|DE-A-I-44"')
    expect(html).toContain('Chưa đạt')
    expect([...o.entries()]).toEqual([['01|DE-A-I-17', { sbd: '01', hoTen: 'Em 01', qid: 'DE-A-I-17', chuyenDe: 'Ester – Lipid' }]])
  })

  it('không mã phiên ⇒ tờ như cũ, không nút', async () => {
    const { html, o } = await dungToChieu([{ qid: 'DE-A-I-17', stt: 17, phan: 'I', mucDo: 'VD', sbd: '01', ten: 'Em 01', viSao: '' }], 'x', TRA)
    expect(html).not.toContain('data-cau-noi=')
    expect(html).not.toContain('class="mc-cham"')
    expect(o.size).toBe(0)
  })
})

type Tay = ReturnType<typeof useGhiToChieu>
const Khung = forwardRef<Tay, { id: string }>(function Khung({ id }, ref) {
  const h = useGhiToChieu(id)
  useImperativeHandle(ref, () => h, [h])
  return (
    <div className="lop-xem-phieu">
      <iframe title="tờ" />
      <output data-kq>{JSON.stringify(h.ketQua)}</output>
    </div>
  )
})

describe('nghe tờ chiếu và ghi bằng ghiLenBang', () => {
  const O: OGhiToChieu = { sbd: '01', hoTen: 'Em 01', qid: 'DE-A-I-17', chuyenDe: 'Ester – Lipid' }
  const dung = async () => {
    const tay: { current: Tay | null } = { current: null }
    const r = render(<Khung id="cd-1" ref={(x) => void (tay.current = x)} />)
    const khung = r.container.querySelector('iframe') as HTMLIFrameElement
    let ma = ''
    act(() => {
      ma = tay.current!.moPhien()
      tay.current!.ganO(ma, new Map([['01|DE-A-I-17', O]]))
    })
    const nhan: unknown[] = []
    khung.contentWindow!.addEventListener('message', (e) => nhan.push((e as MessageEvent).data))
    const gui = (data: Record<string, unknown>, nguon: Window | null = khung.contentWindow) =>
      act(() => {
        window.dispatchEvent(new MessageEvent('message', { data: { maPhien: ma, ...data }, origin: window.location.origin, source: nguon }))
      })
    return { r, ma, gui, nhan }
  }

  it('bấm Đạt trên tờ ⇒ ghiLenBang đúng em/câu/chuyên đề, trả da_ghi, nhớ kết quả; bấm lại không ghi đôi', async () => {
    ghiLenBang.mockResolvedValue(undefined)
    const { r, gui, nhan } = await dung()
    gui({ type: TIN_TO_CHIEU.SAN_SANG })
    await waitFor(() => expect(nhan.some((d) => (d as { type?: string }).type === TIN_TO_CHIEU.KET_NOI)).toBe(true))
    gui({ type: TIN_TO_CHIEU.CHAM, khoa: '01|DE-A-I-17', dat: true })
    await waitFor(() => expect(r.container.querySelector('[data-kq]')?.textContent).toBe('{"01|DE-A-I-17":"dat"}'))
    expect(ghiLenBang).toHaveBeenCalledTimes(1)
    expect(ghiLenBang).toHaveBeenCalledWith('https://may-chu.test', 'bi-mat', { sbd: '01', chuyenDe: 'Ester – Lipid', dat: true, qid: 'DE-A-I-17' })
    await waitFor(() => expect(nhan).toContainEqual(expect.objectContaining({ type: TIN_TO_CHIEU.PHAN_HOI, khoa: '01|DE-A-I-17', kq: 'da_ghi', dat: true })))
    expect(docKetQuaNho('cd-1')).toEqual({ '01|DE-A-I-17': 'dat' })
    gui({ type: TIN_TO_CHIEU.CHAM, khoa: '01|DE-A-I-17', dat: false })
    await new Promise((x) => setTimeout(x, 20))
    expect(ghiLenBang).toHaveBeenCalledTimes(1)
  })

  it('máy chủ lỗi ⇒ trả loi cho tờ, không nhớ kết quả; tin lạ (sai khung / sai mã phiên / ô không có) bị bỏ', async () => {
    ghiLenBang.mockRejectedValue(new Error('Mất mạng'))
    const { r, gui, nhan } = await dung()
    gui({ type: TIN_TO_CHIEU.SAN_SANG })
    gui({ type: TIN_TO_CHIEU.CHAM, khoa: '01|DE-A-I-17', dat: false }, window)
    gui({ type: TIN_TO_CHIEU.CHAM, khoa: '09|DE-A-I-17', dat: false })
    act(() => {
      window.dispatchEvent(new MessageEvent('message', { data: { maPhien: 'sai', type: TIN_TO_CHIEU.CHAM, khoa: '01|DE-A-I-17', dat: false }, origin: window.location.origin, source: r.container.querySelector('iframe')!.contentWindow }))
    })
    await new Promise((x) => setTimeout(x, 20))
    expect(ghiLenBang).not.toHaveBeenCalled()
    gui({ type: TIN_TO_CHIEU.CHAM, khoa: '01|DE-A-I-17', dat: false })
    await waitFor(() => expect(nhan).toContainEqual(expect.objectContaining({ type: TIN_TO_CHIEU.PHAN_HOI, kq: 'loi' })))
    expect(toast).toHaveBeenCalledWith('Mất mạng', 'error')
    expect(r.container.querySelector('[data-kq]')?.textContent).toBe('{}')
  })
})

describe('Buổi chữa hiện lại kết quả', () => {
  const E = (s: string): EmTen => ({ sbd: s, ten: `Em ${s}` })
  const cau = (stt: number, giaiMau: string, chua: string[]): CauBuoiChua => ({
    qid: `DE-A-I-${stt}`,
    stt,
    dang: `Dạng ${stt}`,
    phan: 'I',
    mucDo: 'VD',
    soChuaThanhThao: chua.length,
    soCanDayLai: 0,
    diemChua: chua.length,
    giaiMau: E(giaiMau),
    emSua: chua.map(E),
  })
  const DU: BuoiChuaMayChu = {
    chienDich: { id: 'cd-1', ten: 'Ester', hanNop: '2026-10-04', lop: '12A1' },
    hetHan: true,
    soEm: 3,
    lop: { coXat: 0.9, thanhThao: 0.5 },
    cau: [cau(17, '01', ['02']), cau(44, '03', ['02'])],
  }
  it('"Em 01: Đạt", "Em 03: Không đạt" ở đúng câu; câu chưa ghi không có nhãn', () => {
    const { container } = render(
      <BuoiChua
        du={DU}
        dsEm={['01', '02', '03'].map(E)}
        coMat={[]}
        canDayLai={[]}
        homNay="2026-10-05"
        tra={new Map()}
        ketQua={{ '01|DE-A-I-17': 'dat', '03|DE-A-I-44': 'khong_dat', '01|KHAC': 'dat' }}
        dangChieu={false}
        onChieu={vi.fn(async () => true)}
        onDoiCoMat={vi.fn()}
        onDaChua={vi.fn()}
      />,
    )
    const h17 = container.querySelector('[data-hang-chua="DE-A-I-17"]') as HTMLElement
    const h44 = container.querySelector('[data-hang-chua="DE-A-I-44"]') as HTMLElement
    expect([...h17.querySelectorAll('.cd-ket-qua')].map((x) => x.textContent)).toEqual(['Em 01: Đạt'])
    expect([...h44.querySelectorAll('.cd-ket-qua')].map((x) => x.textContent)).toEqual(['Em 03: Không đạt'])
    expect(h44.querySelector('.cd-ket-qua--khong')).toBeTruthy()
  })
})
