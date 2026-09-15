/**
 * ĐỒNG BỘ PHẢI NÓI RA NÓ ĐANG LÀM GÌ.
 *
 * Thầy báo hai lần liền: *"điện thoại và máy tính chưa hiện thần thú giống
 * nhau"*, mà không ai biết hỏng ở khâu nào — vì `tinhTrangDongBo` được tính rồi
 * BỎ ĐÓ, không hiện ra màn nào. Phải soi thẳng cơ sở dữ liệu mới đoán được.
 *
 * Ba thứ tệp này khoá:
 *  1. Trạng thái đồng bộ HIỆN RA, và lý do hỏng in NGUYÊN VĂN.
 *  2. Có nút đồng bộ tay — không phải chờ đủ 2,5 giây rồi cầu may.
 *  3. Dựng → dọn → dựng lại (StrictMode) vẫn nuốt được bản máy chủ. Bản cũ tắt
 *     `conGanRef` lúc dọn mà không bật lại lúc gắn, nên từ lượt gắn thứ hai mọi
 *     kết quả mạng về đều bị vứt lặng lẽ.
 */
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { StrictMode } from 'react'
import { cleanup, render, screen, waitFor, fireEvent } from '@testing-library/react'
import ThanThuHoaHocGame from '../src/components/ThanThuHoaHocGame'
import { KHOA_LUU_THAN_THU } from '../src/game/than-thu-hoa-hoc/he-thong-pet'

beforeEach(() => {
  localStorage.clear()
  localStorage.setItem('omr_than_thu_khong_3d', '1')
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
})
afterEach(() => { cleanup(); vi.restoreAllMocks() })

const doc = () => JSON.parse(localStorage.getItem(KHOA_LUU_THAN_THU) ?? '{}')

function gan(p: {
  trongMay?: Record<string, unknown>
  docThu?: () => Promise<unknown>
  ghi?: (h: unknown) => Promise<unknown>
  nghiemNgat?: boolean
} = {}) {
  if (p.trongMay !== undefined) localStorage.setItem(KHOA_LUU_THAN_THU, JSON.stringify(p.trongMay))
  const man = (
    <ThanThuHoaHocGame
      dsLichSu={[]} dsBtvn={[]}
      docThanThuMayChu={p.docThu}
      ghiThanThuMayChu={p.ghi}
      onDong={() => {}} onChuyenSangKhacPhuc={() => {}}
      onChuyenSangBtvn={() => {}} onChuyenSangVaoThi={() => {}}
    />
  )
  return render(p.nghiemNgat === true ? <StrictMode>{man}</StrictMode> : man)
}

const CO_THU = { idThanhThuChon: 'hoa_long', capDo: 3, soExp: { caThi: 0 } }

describe('Thanh đồng bộ hiện ra màn', () => {
  it('nuốt xong bản máy chủ thì báo ĐÃ ĐỒNG BỘ', async () => {
    gan({
      trongMay: CO_THU,
      docThu: () => Promise.resolve({ idThanhThuChon: 'hoa_long', capDo: 7 }),
      ghi: () => Promise.resolve({ ok: true, daGhi: true }),
    })
    await waitFor(() => expect(screen.getByText(/Đã đồng bộ với máy chủ/)).toBeTruthy())
    await waitFor(() => expect(doc().capDo).toBe(7))
  })

  it('hỏng thì in LÝ DO NGUYÊN VĂN của máy chủ, không nuốt', async () => {
    gan({
      trongMay: CO_THU,
      docThu: () => Promise.reject(new Error('Chưa lấy được địa chỉ máy chủ')),
    })
    await waitFor(() => expect(screen.getByText('Chưa đồng bộ được')).toBeTruthy())
    expect(screen.getByText('Chưa lấy được địa chỉ máy chủ')).toBeTruthy()
  })

  it('màn không nối máy chủ thì nói thẳng, không giả vờ đã đồng bộ', async () => {
    gan({ trongMay: CO_THU })
    await waitFor(() =>
      expect(screen.getByText(/không nối máy chủ/)).toBeTruthy())
  })
})

describe('Nút Đồng bộ ngay', () => {
  it('bấm là kéo bản máy chủ về và đẩy ngược lên, không chờ 2,5 giây', async () => {
    const daGhi: unknown[] = []
    gan({
      trongMay: CO_THU,
      docThu: () => Promise.resolve({ idThanhThuChon: 'hoa_long', capDo: 9 }),
      ghi: (h) => { daGhi.push(h); return Promise.resolve({ ok: true, daGhi: true }) },
    })
    const nut = await screen.findByRole('button', { name: 'Đồng bộ ngay' })
    fireEvent.click(nut)
    await waitFor(() => expect(daGhi.length).toBeGreaterThan(0))
    await waitFor(() => expect(doc().capDo).toBe(9))
    expect((daGhi[daGhi.length - 1] as { capDo: number }).capDo).toBe(9)
  })

  it('máy chủ nhỉnh hơn thì nuốt lại lần nữa cho hai bên bằng nhau', async () => {
    gan({
      trongMay: { idThanhThuChon: 'hoa_long', capDo: 2, soExp: { caThi: 0 } },
      docThu: () => Promise.resolve(null),
      ghi: () => Promise.resolve({
        ok: true, daGhi: false, lyDo: 'may_chu_moi_hon',
        hoSo: { idThanhThuChon: 'hoa_long', capDo: 11 },
      }),
    })
    fireEvent.click(await screen.findByRole('button', { name: 'Đồng bộ ngay' }))
    await waitFor(() => expect(doc().capDo).toBe(11))
  })

  it('bấm mà hỏng thì hiện lý do, không treo ở "đang đồng bộ"', async () => {
    gan({
      trongMay: CO_THU,
      docThu: () => Promise.reject(new Error('máy chủ bận')),
      ghi: () => Promise.resolve({ ok: true, daGhi: true }),
    })
    fireEvent.click(await screen.findByRole('button', { name: 'Đồng bộ ngay' }))
    await waitFor(() => expect(screen.getByText('máy chủ bận')).toBeTruthy())
    expect(screen.getByRole('button', { name: 'Đồng bộ ngay' })).toBeTruthy()
  })
})

describe('Dựng lại vẫn đồng bộ được (StrictMode)', () => {
  it('lượt gắn thứ hai KHÔNG vứt kết quả máy chủ', async () => {
    gan({
      nghiemNgat: true,
      trongMay: { idThanhThuChon: 'hoa_long', capDo: 1, soExp: { caThi: 0 } },
      docThu: () => Promise.resolve({ idThanhThuChon: 'hoa_long', capDo: 8 }),
      ghi: () => Promise.resolve({ ok: true, daGhi: true }),
    })
    // Bản cũ: cờ `conGanRef` đã tắt ở lượt dọn của StrictMode và không bật lại,
    // nên `setHoSo` không bao giờ chạy và cấp đứng im ở 1.
    await waitFor(() => expect(doc().capDo).toBe(8))
    expect(screen.getAllByText(/Đã đồng bộ với máy chủ/).length).toBeGreaterThan(0)
  })
})

describe('Chưa chọn thú: KHÔNG bày nút chọn khi chưa hỏi xong máy chủ', () => {
  /**
   * Thầy bắt được qua ảnh chụp máy em 15-09: màn "Chọn thần thú đồng hành" hiện
   * ra NGAY, trước khi máy chủ kịp trả lời. Màn ấy ghi rõ "chọn một lần duy nhất
   * và không đổi được" — em bấm trong một hai giây chờ ấy là chốt nhầm con thứ
   * hai, trong khi con thật đang nằm ở máy kia.
   */
  const CHUA_CHON = { idThanhThuChon: '', capDo: 1, soExp: { caThi: 0 } }

  it('đang hỏi máy chủ thì hiện màn chờ, KHÔNG hiện nút chọn', async () => {
    let traLoi: (v: unknown) => void = () => {}
    gan({
      trongMay: CHUA_CHON,
      docThu: () => new Promise((r) => { traLoi = r }),
      ghi: () => Promise.resolve({ ok: true, daGhi: true }),
    })
    expect(screen.getByText(/Đang hỏi máy chủ xem em đã chọn thần thú chưa/)).toBeTruthy()
    expect(screen.queryByText('Chọn thần thú đồng hành của em')).toBeNull()

    // Máy chủ trả về con thú em đã nuôi ở máy khác ⇒ khỏi phải chọn lại.
    traLoi({ idThanhThuChon: 'moc_tinh', capDo: 5 })
    await waitFor(() => expect(doc().idThanhThuChon).toBe('moc_tinh'))
    expect(screen.queryByText('Chọn thần thú đồng hành của em')).toBeNull()
  })

  it('máy chủ trả về RỖNG thì mới bày nút chọn', async () => {
    gan({
      trongMay: CHUA_CHON,
      docThu: () => Promise.resolve(null),
      ghi: () => Promise.resolve({ ok: true, daGhi: true }),
    })
    await waitFor(() =>
      expect(screen.getByText('Chọn thần thú đồng hành của em')).toBeTruthy())
  })

  it('hỏi HỎNG thì vẫn bày nút chọn (không khoá em khi mất mạng) NHƯNG có cảnh báo', async () => {
    gan({
      trongMay: CHUA_CHON,
      docThu: () => Promise.reject(new Error('mất mạng')),
    })
    await waitFor(() =>
      expect(screen.getByText('Chọn thần thú đồng hành của em')).toBeTruthy())
    expect(screen.getByText(/Chưa hỏi được máy chủ/)).toBeTruthy()
    expect(screen.getByText('mất mạng')).toBeTruthy()
  })

  it('màn chọn cũng có nút Đồng bộ ngay để thử lại', async () => {
    gan({
      trongMay: CHUA_CHON,
      docThu: () => Promise.reject(new Error('máy chủ bận')),
      ghi: () => Promise.resolve({ ok: true, daGhi: true }),
    })
    const nut = await screen.findByRole('button', { name: 'Đồng bộ ngay' })
    expect(nut).toBeTruthy()
  })

  it('màn KHÔNG nối máy chủ thì bày nút chọn ngay, không bắt chờ', () => {
    gan({ trongMay: CHUA_CHON })
    expect(screen.getByText('Chọn thần thú đồng hành của em')).toBeTruthy()
  })
})
