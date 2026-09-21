// BỘ NÃO A.I trên BẢNG NHIỆM VỤ: adapter (hai nguồn cùng bộ khoá) + vị trí thẻ + không lẫn vai.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import BangNhiemVu from '../src/components/bang-nhiem-vu/BangNhiemVu'
import { dungBangNhiemVu, tuKeHoachNgay, tuKeHoachTroLy, type DuLieuBangNhiemVu, type KeHoachNgayMayChu, type TrangThaiThanThu } from '../src/lib/nhiem-vu-adapter'
import { tongHopKeHoachTroLy } from '../src/lib/tro-ly-ca-nhan'
import type { BoNaoPhuHuynh } from '../src/lib/bo-nao-hien-thi'

vi.mock('../src/game/than-thu-v2/Spirit2D', () => ({
  default: () => <div role="img" aria-label="Thần thú" />,
}))

const NOW = new Date(2026, 8, 21, 10, 0).getTime()
const THU: TrangThaiThanThu = { kieu: 'co', pet: 'lua_phuong', cap: 12, ten: 'Hoả Long' }
const LOI = 'Hôm nay em đúng lại 2 câu ester từng sai, tự sửa được mà không ai làm hộ.'
const HS_THO = { ngay: '2026-09-21', loi: LOI, gan: [{ ngay: '2026-09-21', loi: LOI }, { ngay: '2026-09-20', loi: 'Lời hôm qua.' }] }
const PH: BoNaoPhuHuynh = { ngay: '2026-09-21', loiNhan: 'Lời cho anh chị hôm nay.', thuTuan: 'Thư tuần.', tuanTu: '2026-09-14' }

const v = (o: object) => ({ thuTu: 1, batBuoc: true, khan: false, cong: null, hien: true, nhan: null, trangThai: 'cho', ghiChu: '', chiTiet: {}, hanCung: null, hanMem: null, nguon: 'x', ...o })
const keHoach = (them: object = {}): KeHoachNgayMayChu => ({
  ok: true,
  ngay: '2026-09-21',
  nganSach: { mucTieuCau: 12, toiThieuCau: 6, vanTocGiay: 80, vanTocNguon: 'do', ghiChuVanToc: '' },
  viec: [v({ id: 'on_lai:x', loai: 'on_lai', soCau: 3, chiTiet: { qid: ['a'] } })] as never,
  canhBao: [],
  quaHan: [],
  tienBo: { daLamCau: 3, lenBac: 0, tutBac: 0, dat: false, toiThieuCau: 6, conThieu: 3 },
  chuoiDat: 0,
  lanNghi: false,
  capNhatLuc: new Date(NOW).toISOString(),
  ...them,
})
const troLy = () => tongHopKeHoachTroLy({ sbd: 't', hoTen: 'Minh', dsBtvn: [], dsMomGiao: [], dsLichSu: [], tongCauSai: 0, now: NOW })
const conThu = (d: DuLieuBangNhiemVu): DuLieuBangNhiemVu => ({ ...d, thanThu: THU })

beforeEach(() => localStorage.clear())
afterEach(() => cleanup())

describe('adapter: lời nhắn Bộ não của HỌC SINH đi theo kế hoạch ngày', () => {
  it('nguồn máy chủ có `loiNhanHlv` ⇒ boNao.hs đầy đủ, phần phụ huynh KHÔNG đi qua đây', () => {
    const d = tuKeHoachNgay(keHoach({ loiNhanHlv: HS_THO, boNaoAi: { loiNhan: 'lọt vào?' } }), NOW)
    expect(d.boNao).not.toBeNull()
    expect(d.boNao!.hs!.loi).toBe(LOI)
    expect(d.boNao!.hs!.gan).toHaveLength(2)
    expect(d.boNao!.ph).toBeNull()
    expect(JSON.stringify(d.boNao)).not.toContain('lọt vào?')
  })

  it('máy chủ KHÔNG có khoá (chạy thử/không lời/bộ não tắt) ⇒ boNao null — bảng ra y như cũ', () => {
    for (const them of [{}, { loiNhanHlv: null }, { loiNhanHlv: '' }, { loiNhanHlv: { loi: '   ' } }, { loiNhanHlv: 5 }]) {
      expect(tuKeHoachNgay(keHoach(them), NOW).boNao).toBeNull()
    }
  })

  it('nguồn trợ lý cũng có khoá `boNao` (=== null) ⇒ hai nguồn cùng bộ khoá ở gốc', () => {
    const a = tuKeHoachTroLy(troLy())
    const b = tuKeHoachNgay(keHoach(), NOW)
    expect(a.boNao).toBeNull()
    expect(Object.keys(a).sort()).toEqual(Object.keys(b).sort())
  })
})

describe('bảng nhiệm vụ: vị trí và vai', () => {
  const ve = (vaiTro: 'hocsinh' | 'phuhuynh', duLieu: DuLieuBangNhiemVu, boNaoPh?: BoNaoPhuHuynh | null) =>
    render(<BangNhiemVu vaiTro={vaiTro} hoTen="Đỗ Minh" now={NOW} duLieu={duLieu} boNaoPh={boNaoPh} />)
  const dsVung = () => [...document.querySelectorAll('[data-vung]')].map((e) => e.getAttribute('data-vung'))

  it('học sinh: thẻ nằm NGAY SAU thẻ tiến độ và TRƯỚC thẻ LÀM NGAY (không đẩy nút chính ra khỏi màn)', () => {
    const d = { ...conThu(tuKeHoachNgay(keHoach({ loiNhanHlv: HS_THO }), NOW)) }
    ve('hocsinh', d)
    const vung = dsVung()
    expect(vung).toContain('bo-nao')
    expect(vung.indexOf('tien-do')).toBeGreaterThanOrEqual(0)
    expect(vung.indexOf('bo-nao')).toBe(vung.indexOf('tien-do') + 1)
    if (vung.includes('lam-ngay')) expect(vung.indexOf('bo-nao')).toBeLessThan(vung.indexOf('lam-ngay'))
    expect(document.querySelector('[data-vung="bo-nao"]')!.textContent).toContain(LOI)
  })

  it('không có lời ⇒ không có vùng bo-nao nào', () => {
    ve('hocsinh', conThu(tuKeHoachNgay(keHoach(), NOW)))
    expect(dsVung()).not.toContain('bo-nao')
  })

  it('học sinh KHÔNG thấy lời phụ huynh dù prop boNaoPh bị truyền nhầm', () => {
    ve('hocsinh', conThu(tuKeHoachNgay(keHoach(), NOW)), PH)
    expect(dsVung()).not.toContain('bo-nao')
    expect(document.body.textContent).not.toContain('Lời cho anh chị')
  })

  it('phụ huynh: thấy lời + thư tuần từ prop; KHÔNG thấy lời của em dù dữ liệu có loiNhanHlv', () => {
    ve('phuhuynh', conThu(tuKeHoachNgay(keHoach({ loiNhanHlv: HS_THO }), NOW)), PH)
    const the = document.querySelector('[data-vung="bo-nao"]')!
    expect(the.textContent).toContain('Lời cho anh chị hôm nay.')
    expect(the.textContent).toContain('Thư tuần này')
    expect(the.textContent).not.toContain(LOI)
  })

  it('phụ huynh không có boNaoPh ⇒ không thẻ (kể cả khi dữ liệu có lời của em)', () => {
    ve('phuhuynh', conThu(tuKeHoachNgay(keHoach({ loiNhanHlv: HS_THO }), NOW)), null)
    expect(dsVung()).not.toContain('bo-nao')
  })

  it('đang tải (skeleton) ⇒ không thẻ', () => {
    render(<BangNhiemVu vaiTro="hocsinh" hoTen="Đỗ Minh" now={NOW} duLieu={conThu(tuKeHoachNgay(keHoach({ loiNhanHlv: HS_THO }), NOW))} dangTai />)
    expect(dsVung()).not.toContain('bo-nao')
  })
})
