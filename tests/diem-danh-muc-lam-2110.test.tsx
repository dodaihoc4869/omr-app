// THANH MỨC LÀM Ở BẢNG ĐIỂM DANH (thầy 20/10, bản vẽ 03 "Bảng điểm danh") — màn thầy, không lên bản chiếu. Kiểm:
//   · hỏi MỘT lệnh `/gv/muc-lam-lo` cho đúng các em đang hiện (6 dòng đầu), SAU 1,5 giây; mở "Xem cả N em" ⇒ chỉ hỏi thêm em mới; `/gv/nhip-hoc` vẫn đúng MỘT lệnh;
//   · dòng: thanh bốn đoạn + "Mức làm 1–2: x/y lượt" (≈ khi có lượt ước tính; "Chưa có số đo (N lượt)"; "Chưa có lượt 14 ngày qua"); nhãn đọc màn hình của nút có thêm câu mức;
//   · lỗi / máy chủ chưa có lệnh ⇒ dòng như cũ, KHÔNG tự hỏi lại, điểm danh không bị chặn; bản chiếu KHÔNG có thanh;
//   · phép thuần đọc chặt (`docMucLamEm`): tổng mức phải khớp số có đo, hỏng ⇒ bỏ em ấy.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'

const { goi } = vi.hoisted(() => ({ goi: vi.fn() }))
vi.mock('../src/lib/goi-lenh-thay', () => ({ goiLenh: (duong: string, body: Record<string, unknown>) => goi(duong, body) }))
vi.mock('../src/components/hop-thoai', () => ({ hoiXacNhan: async () => true }))
vi.mock('../src/components/chien-dich/HoSoLamCauEm', () => ({ default: () => <div role="dialog" aria-label="Hồ sơ làm bài" /> }))

import { BuocDiemDanh, useDiemDanhBuoi } from '../src/components/day-hoc/DiemDanhBuoi'
import { CHO_HOI_MUC_LAM_MS } from '../src/components/day-hoc/Buoc1DiemDanh'
import { chuMucLamEm, docMucLamEm } from '../src/lib/muc-lam-lo-api'
import type { TrangThaiBuoi } from '../src/lib/buoi-hoc-api'
import type { KetQuaNhipHoc } from '../src/lib/nhip-hoc-thay'

const NHIP: KetQuaNhipHoc = { ok: true, tu: '2026-10-01', den: '2026-10-12', homNay: '2026-10-12', ngay: ['2026-10-12'], lop: [], doiPhoDaTinh: { quaNhanh: true, chonLap: true }, canhBao: [], em: [] }
const BUOI = { id: 'BH-12', ten: 'Buổi học 12/10 · 12A1', lop: '12A1', moLuc: '2026-10-12T10:50:00Z', hetHan: '2026-10-13T10:50:00Z', dongLuc: null, dangMo: true }
const TEN = ['An', 'Bình', 'Cường', 'Dung', 'Em', 'Phúc', 'Giang', 'Hà']
const SBD = TEN.map((_, i) => `S${i + 1}`)
const luc = (phut: number) => `2026-10-12T10:${String(phut).padStart(2, '0')}:00Z`
// S1 → S8 điểm danh lần lượt: mới nhất trước ⇒ hàng "Vừa điểm danh" là S8, S7, S6, S5, S4, S3 (6 dòng), S2, S1 chỉ hiện khi bấm "Xem cả 8 em"
const TT: TrangThaiBuoi = {
  buoi: BUOI, ma: '482915', doiMaLuc: 1, siSo: 8,
  coMat: SBD.map((sbd, i) => ({ sbd, hoTen: `Em ${TEN[i]}`, luc: luc(50 + i), cach: 'ma' as const })),
  lopEm: SBD.map((sbd, i) => ({ sbd, hoTen: `Em ${TEN[i]}`, tenLop: '12A1' })),
}
const mucEm = (m: [number, number, number, number], chua = 0, uoc = 0) => ({ soDo: m[0] + m[1] + m[2] + m[3], chuaCoSoDo: chua, m, soUocTinh: uoc })
const MUC: Record<string, ReturnType<typeof mucEm>> = {
  S8: mucEm([6, 9, 30, 7], 3),       // 15/52 lượt
  S7: mucEm([2, 2, 10, 2], 0, 4),    // ≈ có lượt ước tính: 4/16
  S6: mucEm([0, 0, 0, 0], 40),       // chưa có số đo (40 lượt)
  S5: mucEm([0, 0, 0, 0], 0),        // không có lượt nào
  S4: mucEm([1, 0, 0, 0]),
  S3: mucEm([0, 5, 5, 0]),
  S2: mucEm([3, 3, 3, 3]),
  S1: mucEm([0, 0, 1, 0]),
}
let chet = false
function mayChu() {
  goi.mockImplementation(async (duong: string, b: Record<string, unknown>) => {
    if (duong === '/gv/lop') return { ok: true, du: { ok: true, lop: [{ tenLop: '12A1', khoi: '12', soEm: 8, sbd: [] }] } }
    if (duong === '/gv/nhip-hoc') return { ok: true, du: NHIP as unknown as Record<string, unknown> }
    if (duong === '/gv/buoi-hoc') return { ok: true, du: { ok: true, ...(b.action === 'dang-mo' ? { buoi: [BUOI] } : TT) } }
    if (duong === '/gv/muc-lam-lo') {
      if (chet) return { ok: false, loai: 'chua_co_lenh', chu: 'chưa có lệnh' }
      const em: Record<string, unknown> = {}
      for (const s of b.sbds as string[]) if (MUC[s]) em[s] = MUC[s]
      return { ok: true, du: { ok: true, tu: '2026-09-29', den: '2026-10-12', em } }
    }
    return { ok: false, loai: 'chua_co_lenh', chu: 'lệnh lạ' }
  })
}
const lenh = (duong: string) => goi.mock.calls.filter(([d]) => d === duong)

function Khung() {
  const dd = useDiemDanhBuoi()
  return <BuocDiemDanh dd={dd} soBuoc={1} idTieuDe="bd-b1" thanh />
}
const dongVua = () => within(screen.getByRole('list', { name: /Em vừa điểm danh/ })).getAllByRole('button')
const chuThanh = (b: HTMLElement) => b.querySelector('.dd1-ml-chu')?.textContent ?? ''

beforeEach(() => {
  goi.mockReset()
  chet = false
  mayChu()
})
afterEach(() => {
  cleanup()
})

describe('phép thuần đọc Mức làm theo lô', () => {
  it('đọc chặt: tổng bốn mức phải bằng số có đo; thiếu / sai kiểu / ≈ lớn hơn số có đo ⇒ null', () => {
    expect(docMucLamEm(mucEm([1, 2, 3, 4], 5, 2))).toEqual(mucEm([1, 2, 3, 4], 5, 2))
    expect(docMucLamEm({ ...mucEm([1, 2, 3, 4]), soDo: 11 })).toBeNull()
    expect(docMucLamEm({ ...mucEm([1, 2, 3, 4]), m: [1, 2, 3] })).toBeNull()
    expect(docMucLamEm({ ...mucEm([1, 2, 3, 4]), m: [1, 2, 3, '4'] })).toBeNull()
    expect(docMucLamEm({ ...mucEm([1, 2, 3, 4]), soUocTinh: 11 })).toBeNull()
    expect(docMucLamEm({ ...mucEm([1, 2, 3, 4]), chuaCoSoDo: -1 })).toBeNull()
    expect(docMucLamEm(null)).toBeNull()
  })
  it('câu một dòng: x = Mức 1–2, y = lượt có đo; chưa có số đo; không lượt nào', () => {
    expect(chuMucLamEm(mucEm([6, 9, 30, 7], 3))).toBe('Mức làm 1–2: 15/52 lượt')
    expect(chuMucLamEm(mucEm([2, 2, 10, 2], 0, 4))).toBe('Mức làm 1–2: 4/16 lượt (có lượt ≈ ước tính)')
    expect(chuMucLamEm(mucEm([0, 0, 0, 0], 40))).toBe('Chưa có số đo (40 lượt)')
    expect(chuMucLamEm(mucEm([0, 0, 0, 0]))).toBe('Chưa có lượt nào 14 ngày qua')
  })
})

describe('bảng điểm danh — thanh Mức làm', () => {
  it('hỏi MỘT lệnh sau khi danh sách đã vẽ (6 em hiện); mỗi dòng có thanh + chữ; nhãn nút có câu mức; Nhịp học vẫn MỘT lệnh', async () => {
    render(<Khung />)
    await screen.findByRole('list', { name: /Em vừa điểm danh/ })
    expect(lenh('/gv/muc-lam-lo')).toHaveLength(0) // chưa hỏi ngay — chờ danh sách ổn định
    await waitFor(() => expect(lenh('/gv/muc-lam-lo')).toHaveLength(1), { timeout: CHO_HOI_MUC_LAM_MS + 2500 })
    expect((lenh('/gv/muc-lam-lo')[0]![1] as { sbds: string[] }).sbds).toEqual(['S8', 'S7', 'S6', 'S5', 'S4', 'S3'])
    await waitFor(() => expect(dongVua().map(chuThanh)).toEqual([
      'Mức làm 1–2: 15/52 lượt3 lượt chưa có số đo',
      '≈ Mức làm 1–2: 4/16 lượt',
      'Chưa có số đo (40 lượt)',
      'Chưa có lượt 14 ngày qua',
      'Mức làm 1–2: 1/1 lượt',
      'Mức làm 1–2: 5/10 lượt',
    ]))
    const dong = dongVua()
    // thanh: chỉ đoạn có lượt, rộng theo số lượt, đúng thứ tự Mức 1 → 4
    expect([...dong[0]!.querySelectorAll('.dd1-ml-thanh i')].map((i) => [i.getAttribute('data-m'), (i as HTMLElement).style.flexGrow])).toEqual([['1', '6'], ['2', '9'], ['3', '30'], ['4', '7']])
    expect(dong[2]!.querySelectorAll('.dd1-ml-thanh i')).toHaveLength(0)
    expect(dong[1]!.querySelector('.dd1-ml-chu')?.getAttribute('title')).toContain('mức thật có thể thấp hơn')
    expect(dong[0]!.getAttribute('aria-label')).toMatch(/\. Mức làm 1–2: 15\/52 lượt$/)
    expect(dong[0]!.querySelector('.dd1-ml')?.getAttribute('aria-hidden')).toBe('true')
    expect(screen.getByText(/Thanh bên phải: số lượt làm 14 ngày theo Mức làm 1 → 4/)).toBeTruthy()
    expect(lenh('/gv/nhip-hoc')).toHaveLength(1)
  })

  it('mở "Xem cả 8 em" ⇒ chỉ hỏi thêm hai em MỚI (S2, S1), không hỏi lại sáu em đã có', async () => {
    render(<Khung />)
    await waitFor(() => expect(lenh('/gv/muc-lam-lo')).toHaveLength(1), { timeout: CHO_HOI_MUC_LAM_MS + 2500 })
    fireEvent.click(await screen.findByRole('button', { name: 'Xem cả 8 em có mặt ›' }))
    await waitFor(() => expect(lenh('/gv/muc-lam-lo')).toHaveLength(2), { timeout: CHO_HOI_MUC_LAM_MS + 2500 })
    expect((lenh('/gv/muc-lam-lo')[1]![1] as { sbds: string[] }).sbds).toEqual(['S2', 'S1'])
    await waitFor(() => expect(dongVua()).toHaveLength(8))
    await waitFor(() => expect(dongVua().map(chuThanh).slice(6)).toEqual(['Mức làm 1–2: 6/12 lượt', 'Mức làm 1–2: 0/1 lượt']))
  })

  it('máy chủ chưa có lệnh / lỗi ⇒ dòng như cũ (không thanh, không chú thích), điểm danh vẫn dùng được, KHÔNG tự hỏi lại', async () => {
    chet = true
    render(<Khung />)
    await waitFor(() => expect(lenh('/gv/muc-lam-lo')).toHaveLength(1), { timeout: CHO_HOI_MUC_LAM_MS + 2500 })
    await new Promise((ok) => setTimeout(ok, 300))
    expect(document.querySelectorAll('.dd1-ml')).toHaveLength(0)
    expect(screen.queryByText(/Thanh bên phải/)).toBeNull()
    expect(dongVua()).toHaveLength(6)
    fireEvent.click(dongVua()[0]!)
    expect(await screen.findByRole('dialog', { name: 'Hồ sơ làm bài' })).toBeTruthy() // bấm em vẫn mở hồ sơ
    await new Promise((ok) => setTimeout(ok, CHO_HOI_MUC_LAM_MS + 500))
    expect(lenh('/gv/muc-lam-lo')).toHaveLength(1)
  })

  it('bản chiếu điểm danh KHÔNG có thanh Mức làm (tên em kèm mức trước lớp là điều cần tránh)', async () => {
    render(<Khung />)
    await waitFor(() => expect(document.querySelectorAll('.dd1-ml').length).toBeGreaterThan(0), { timeout: CHO_HOI_MUC_LAM_MS + 2500 })
    fireEvent.click(screen.getByRole('button', { name: 'Chiếu điểm danh' }))
    const chieu = await screen.findByRole('dialog', { name: 'Bản chiếu điểm danh' })
    expect(chieu.querySelectorAll('.dd1-ml')).toHaveLength(0)
    expect(chieu.textContent).not.toMatch(/Mức làm/)
  })
})
