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
