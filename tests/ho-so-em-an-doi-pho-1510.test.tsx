// @vitest-environment jsdom
// A4 (quét 15/10): tấm hồ sơ mở trong app HỌC SINH hiện chip "Có dấu hiệu đối phó" — nhãn chấm thái độ, chuẩn A1.7 không cho hiện với em.
// Luật: chế độ 'hoc-sinh' ẩn chip; thầy và phụ huynh giữ nguyên (phụ huynh đọc CHUNG bản dữ liệu của em nên KHÔNG lọc ở máy chủ).
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import { choTamXong, moGap } from './_ho-so-6-muc'
import type { KetQuaLichSuLamCau } from '../server/src/lich-su-lam-cau-kieu'
import { hoSoThaiDoGia } from '../scripts/chup-v2/gia/bai-hang-ngay'

vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may.test', quenDiaChiMayChu: () => {} }))
const { default: HoSoLamCauEm } = await import('../src/components/chien-dich/HoSoLamCauEm')

const TD = { ...hoSoThaiDoGia('11010'), nhomNhip: 'luoi' as const, coDoiPho: true, chuoiDuGanNhat: 2 }
const LS: KetQuaLichSuLamCau = {
  ok: true,
  em: { sbd: '11010', hoTen: TD.em.hoTen, lop: '12A1' },
  tong: { soLuot: 0, soDung: 0, soSai: 0, soBoTrong: 0, soCau: 0, soCauSai: 0, giayTb: 0, tongGiay: 0 },
  lan: [],
  cauSai: [],
  conNua: false,
  catBot: false,
}
const nguon = { hoSoThaiDo: async () => ({ ok: true as const, du: TD }), lichSu: async () => ({ ok: true as const, du: LS }) }

afterEach(cleanup)

async function chip(cheDo: 'hoc-sinh' | 'thay' | 'phu-huynh') {
  render(<HoSoLamCauEm em={{ sbd: '11010', ten: 'Em', khoi: null }} nguon={nguon as never} cheDo={cheDo} onDong={() => {}} />)
  const tam = await screen.findByRole('dialog')
  await choTamXong(tam)
  moGap(tam, /^(Nhịp học|Lịch làm bài)/) // 6 mức: đầu tấm Thái độ dời vào ngăn gập
  // 26/10 (thầy: nhãn / nhóm CHỈ thầy + phụ huynh xem): đầu khối của học sinh chỉ còn khoảng ngày + dải 14 ngày, không tên nhóm (#gvv2-tdo-nhan).
  await waitFor(() => expect(tam.querySelector(cheDo === 'hoc-sinh' ? '.gvv2-tdo-dau' : '#gvv2-tdo-nhan')).not.toBeNull())
  if (cheDo === 'hoc-sinh') {
    expect(tam.querySelector('#gvv2-tdo-nhan, .gvv2-tdo-ly-do, .hslc-thoat')).toBeNull()
    expect(tam.textContent).not.toMatch(/đối phó|lười|chưa đều|nhóm chăm/i)
  }
  return tam.querySelector('.gvv2-tdo-co-doi-pho')
}

describe('hồ sơ của em: chip "Có dấu hiệu đối phó"', () => {
  it('app học sinh: không hiện', async () => {
    expect(await chip('hoc-sinh')).toBeNull()
  })
  it('thầy và phụ huynh: vẫn hiện như cũ', async () => {
    expect((await chip('thay'))?.textContent).toBe('Có dấu hiệu đối phó')
    cleanup()
    expect((await chip('phu-huynh'))?.textContent).toBe('Có dấu hiệu đối phó')
  })
})
