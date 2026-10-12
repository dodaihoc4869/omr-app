// @vitest-environment jsdom
// KHẨN 12/10 21h30 — thầy (nguyên văn): "kiểm ra kĩ số câu phân, lúc chiều thì hiện 31 câu giờ lại hiện 2 chặng mà không bấm làm được".
// Ảnh: em Gói 7 (Bài 8. Amine) lúc 21h0x đúng "7 trên 32 câu · 25 câu tự làm"; lúc 21h3x "Còn 1 câu · Đã làm 7/8 · Xong 1/2 chặng", không tên bài,
// không thẻ "Bài học trong 7 ngày", nút "Học tiếp · 1 câu" mờ như bị khoá. Nguyên nhân phía app: `docTomTatGoi7` bỏ CẢ gói vì một trường phụ lệch ⇒
// `soHomNay` rơi về `theLuc.tong` (= đã làm + số việc xếp được = 8) làm M; Sảnh chưa về thì vẽ mức kế hoạch cũ (kẹp 8–16) với nút khoá.
// Kiểm: trường phụ lệch ⇒ vẫn nhận gói, M = 32, "Còn 25 câu" · cốt lõi hỏng ⇒ LỖI, không hiện 7/8 · kho thiếu (con = 1, thieuNgay = 24) ⇒ "Còn 25 câu",
// nút bấm được, có dòng câu chờ bổ sung · hết việc xếp được ⇒ nút khoá nói rõ "Hôm nay còn N câu chờ thầy bổ sung" · Sảnh chưa về ⇒ không vẽ số kế hoạch cũ.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import HocTapHomNay from '../src/components/hoc-tap/HocTapHomNay'
import { soHomNay } from '../src/components/hoc-tap/lam-bai'
import { docSanh, type KetQuaSanh } from '../src/components/hoa2/api'
import { docTomTatGoi7 } from '../src/lib/goi-bai-7'

afterEach(() => cleanup())

/** Đúng hình `tomTatGoi7` của máy chủ (cả trường thừa `mucTieuDiem`). */
const goiTho = (x: Record<string, unknown> = {}, g: Record<string, unknown> = {}): Record<string, unknown> => ({
  bat: true, ngay: '2026-10-12', toiThieu: 32, daLamHomNay: 7, tuLamCon: 25, tiepCanCon: 0, thieuPhu: 0, thieuNgay: 0, canHoTro: false, mucTieuDiem: 7,
  kienThucCu: { tong: 0, dat: 0, tyLe: null }, diemDaDo: [],
  goi: [{ id: 'g7:amine', ten: 'Bài 8. Amine', batDau: '2026-10-11', han: '2026-10-16', tong: 164, daGap: 15, con: 149, nguonDayDu: true, to: ['DH-B8-TN'], canBoSung: 0, quota: 32, gapHomNay: 7, quaHan: false, ...g }],
  ...x,
})
/** Trường phụ lệch cùng lúc: `to` có null/số/chuỗi rỗng · daGap > tong · con sai · diemDaDo lạ · kienThucCu thiếu · tuLamCon/thieuPhu lạ. */
const lech = goiTho(
  { kienThucCu: undefined, thieuPhu: null, tiepCanCon: 'x', diemDaDo: [null, { goiId: 'g7:amine', maDe: 'DH-B8-TN', diem: null, luc: '2026-10-12T13:00:00Z', cauMoi: 2, tong: 4 }, { goiId: 'g7:amine', maDe: 'DH-B8-TN', diem: 8.5, luc: '2026-10-12T13:00:00Z', cauMoi: 2, tong: 4 }] },
  { to: [null, 'DH-B8-TN', 12028, '', 'DH-B8-TN'], daGap: 170, con: -6 },
)
const nut = { onXemLai: vi.fn(), onChua: vi.fn(), onThi: vi.fn(), onTuLuyen: vi.fn(), onLichSu: vi.fn(), onBaiTap: vi.fn(), onGiaDinh: vi.fn(), onTaiLai: vi.fn(), onDangXuat: vi.fn() }
function ve(ketQua: KetQuaSanh | null, o: { onHoc?: () => void; dangTai?: boolean; loi?: string; tienDoCu?: { daLam: number; mucTieu: number } } = {}) {
  return render(<HocTapHomNay ten="Đỗ Đại Học" lop="12 - Lớp Thường" dangTai={o.dangTai ?? false} loi={o.loi ?? ''} coCa={false} onHoc={o.onHoc ?? vi.fn()} ketQua={ketQua} tienDoCu={o.tienDoCu} {...nut} />)
}
const the = () => screen.getByRole('region', { name: 'Hôm nay của em' })
const nutChinh = () => the().querySelector('.ht2-hn-nut') as HTMLButtonElement

describe('app đọc tóm tắt Gói 7: chỉ cốt lõi bắt buộc, trường phụ chuẩn hoá', () => {
  it('to có null · daGap > tong · diemDaDo lạ · kienThucCu thiếu ⇒ VẪN nhận gói; M = 32; "Còn 25 câu"; trường phụ đã chuẩn hoá', () => {
    const g = docTomTatGoi7(lech)!
    expect(g).toBeDefined()
    expect([g.toiThieu, g.daLamHomNay, g.tuLamCon, g.tiepCanCon, g.thieuPhu]).toEqual([32, 7, 25, 0, 0])
    expect(g.goi[0]!.to).toEqual(['DH-B8-TN'])
    // số gặp câu mâu thuẫn ⇒ kẹp + "chưa chốt tổng số câu", KHÔNG thành "đã gặp hết 164/164"
    expect([g.goi[0]!.tong, g.goi[0]!.daGap, g.goi[0]!.con, g.goi[0]!.nguonDayDu]).toEqual([164, 164, 0, false])
    expect(g.diemDaDo).toEqual([{ goiId: 'g7:amine', maDe: 'DH-B8-TN', diem: 8.5, luc: '2026-10-12T13:00:00Z', cauMoi: 2, tong: 4 }])
    expect(g.kienThucCu).toEqual({ tong: 0, dat: 0, tyLe: null })
    const kq = docSanh({ cheDo2: true, theLuc: { con: 25, tong: 32 }, goi7: lech })
    expect(soHomNay(kq)).toEqual({ daLam: 7, muc: 32, chang: 2, soChang: 6 })
    ve(kq)
    expect(the().querySelector('.ht2-hn-so')!.textContent).toBe('Còn 25 câu')
    expect(the().querySelector('.ht2-hn-da')!.textContent).toBe('Đã làm 7/32 câu hôm nay')
    expect(the().querySelector('.ht2-hn-chang')!.textContent).toMatch(/^Xong 1\/6 chặng/)
    expect(the().querySelector('.ht2-hn-bai')!.textContent).toBe('Bài 8. Amine · 25 câu tự làm · 0 câu học có hỗ trợ')
    expect(screen.getByRole('region', { name: 'Bài học trong 7 ngày' }).textContent).toMatch(/Chưa chốt tổng số câu/)
    expect(nutChinh().textContent).toBe('Học tiếp · 25 câu')
    expect(nutChinh().disabled).toBe(false)
  })

  it('gói không có id/ten bị bỏ riêng; còn ≥ 1 gói hợp lệ thì vẫn nhận; han sai ⇒ không in "Hạn"', () => {
    const g = docTomTatGoi7(goiTho({ goi: [null, { id: '', ten: 'X' }, { id: 'g7:amine', ten: 'Bài 8. Amine', tong: 10, daGap: 2, han: 'sai', to: 'DH' }] }))!
    expect(g.goi).toHaveLength(1)
    expect(g.goi[0]).toMatchObject({ id: 'g7:amine', tong: 10, daGap: 2, con: 8, han: '', to: [], quota: 0 })
    ve(docSanh({ cheDo2: true, theLuc: { con: 25, tong: 32 }, goi7: goiTho({ goi: g.goi }) }))
    expect(screen.getByRole('region', { name: 'Bài học trong 7 ngày' }).textContent).toContain('Gặp câu gốc: 2/10 câu')
    expect(screen.getByRole('region', { name: 'Bài học trong 7 ngày' }).textContent).not.toMatch(/Hạn/)
  })

  it('phản hồi đúng ⇒ giữ nguyên số (không đổi gì ngoài bỏ trường thừa)', () => {
    const tho = goiTho()
    const { mucTieuDiem: _bo, ...mongDoi } = tho
    expect(docTomTatGoi7(tho)).toEqual(mongDoi)
  })
})

describe('cốt lõi hỏng ⇒ LỖI, không hiện số kế hoạch "7/8"', () => {
  const hong: [string, Record<string, unknown>][] = [
    ['toiThieu = 0', goiTho({ toiThieu: 0 })],
    ['toiThieu null', goiTho({ toiThieu: null })],
    ['daLamHomNay âm', goiTho({ daLamHomNay: -1 })],
    ['ngay sai', goiTho({ ngay: '12/10' })],
    ['bat khác true', goiTho({ bat: 1 })],
    ['goi rỗng', goiTho({ goi: [] })],
    ['goi không có gói nào có id/ten', goiTho({ goi: [{ tong: 3 }] })],
  ]
  it.each(hong)('%s ⇒ docTomTatGoi7 undefined, docSanh null (Hôm nay hiện "Thử lại")', (_ten, g) => {
    expect(docTomTatGoi7(g)).toBeUndefined()
    expect(docSanh({ cheDo2: true, theLuc: { con: 1, tong: 8 }, goi7: g })).toBeNull()
  })

  it('màn Hôm nay khi Sảnh lỗi (không có số Sảnh): hiện lỗi + Thử lại, KHÔNG có "7/8" của kế hoạch cũ', () => {
    const thuLai = vi.fn()
    render(<HocTapHomNay ten="An" lop="12" dangTai={false} loi="Máy chủ trả dữ liệu Sảnh chưa đủ. Em thử lại sau ít phút." coCa={false} onHoc={vi.fn()} ketQua={null}
      tienDoCu={{ daLam: 7, mucTieu: 8 }} {...nut} onTaiLai={thuLai} />)
    expect(screen.getByRole('alert').textContent).toMatch(/Thử lại/)
    expect(the().textContent).not.toMatch(/7\/8|Còn 1 câu|chặng/)
    expect(the().querySelector('.ht2-hn-da')!.textContent).toBe('Số câu hôm nay sẽ hiện khi bài học tải xong.')
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }))
    expect(thuLai).toHaveBeenCalledOnce()
  })

  it('Sảnh đang tải lần đầu ⇒ khung xương, không vẽ mức kế hoạch cũ kèm nút mờ', () => {
    ve(null, { dangTai: true, tienDoCu: { daLam: 7, mucTieu: 8 } })
    expect(the().querySelector('.ht2-hn-xuong')).not.toBeNull()
    expect(the().textContent).not.toMatch(/7\/8|Còn 1 câu/)
    expect(soHomNay(null, { daLam: 7, mucTieu: 8 })).toBeNull()
    // chế độ cũ (Sảnh đã về, không phải 2.0) vẫn dùng kế hoạch cũ
    expect(soHomNay({ cheDo2: false }, { daLam: 7, mucTieu: 8 })).toEqual({ daLam: 7, muc: 8, chang: 2, soChang: 2 })
  })

  it('goi7 vắng (em không học gói) ⇒ Sảnh vẫn đọc như cũ', () => {
    expect(docSanh({ cheDo2: true, theLuc: { con: 3, tong: 8 } })).not.toBeNull()
    expect(docSanh({ cheDo2: true, theLuc: { con: 3, tong: 8 }, goi7: null })).not.toBeNull()
  })
})

describe('kho thiếu câu sẵn sàng: số theo M, nút vẫn bấm được phần đã xếp', () => {
  it('con = 1, thieuNgay = 24 ⇒ "Còn 25 câu" · dòng "24 câu chờ thầy bổ sung" · nút "Học tiếp · 1 câu sẵn sàng" BẤM ĐƯỢC', () => {
    const hoc = vi.fn()
    ve(docSanh({ cheDo2: true, theLuc: { con: 1, tong: 8 }, goi7: goiTho({ tuLamCon: 1, tiepCanCon: 0, thieuNgay: 24, canHoTro: true }) }), { onHoc: hoc })
    expect(the().querySelector('.ht2-hn-so')!.textContent).toBe('Còn 25 câu')
    expect(the().querySelector('.ht2-hn-da')!.textContent).toBe('Đã làm 7/32 câu hôm nay')
    expect(the().textContent).not.toMatch(/7\/8|Còn 1 câu|\/2 chặng/)
    expect(the().querySelector('.ht2-hn-bai')!.textContent).toBe('Bài 8. Amine · 1 câu tự làm · 0 câu học có hỗ trợ · 24 câu chờ thầy bổ sung')
    expect(nutChinh().textContent).toBe('Học tiếp · 1 câu sẵn sàng')
    expect(nutChinh().disabled).toBe(false)
    fireEvent.click(nutChinh())
    expect(hoc).toHaveBeenCalledOnce()
    expect(screen.getByRole('region', { name: 'Bài học trong 7 ngày' }).textContent).toContain('Còn thiếu 24 câu phù hợp so với mức ngày.')
  })

  it('hết hẳn việc xếp được (con = 0) mà chưa đủ mức ⇒ nút khoá nói rõ "Hôm nay còn 25 câu chờ thầy bổ sung"', () => {
    ve(docSanh({ cheDo2: true, theLuc: { con: 0, tong: 7 }, goi7: goiTho({ tuLamCon: 0, tiepCanCon: 0, thieuNgay: 25, canHoTro: true }) }))
    expect(the().querySelector('.ht2-hn-so')!.textContent).toBe('Còn 25 câu')
    expect(nutChinh().textContent).toBe('Hôm nay còn 25 câu chờ thầy bổ sung')
    expect(nutChinh().disabled).toBe(true)
  })

  it('đủ mức và hết việc ⇒ chữ cũ "Đã làm hết câu được giao"', () => {
    ve(docSanh({ cheDo2: true, theLuc: { con: 0, tong: 32 }, goi7: goiTho({ daLamHomNay: 32, tuLamCon: 0 }) }))
    expect(nutChinh().textContent).toBe('Đã làm hết câu được giao')
  })
})
