// THẺ "ĐƯỜNG VỀ ĐÍCH" (Dồn về đích; thầy chốt mẫu 21/09: docs/ban-ve-don-ve-dich-2109/; Boss 2 sửa: nộp trễ, ảnh thú ở lời chào [đã có ở DauTrang]): đọc CHẶT `veDich` + `no`; bốn trạng thái + qua hạn; đồng hồ đếm ngược
// theo giờ LUÔN hiện khi có nợ; "Tối nay: …"; MỘT nút ⇒ việc chưa xong đầu tiên; khối "Còn lại từ các ngày trước"; gạch tên ngày vừa trả; thiếu `veDich` ⇒ không dựng; phụ huynh không thấy; không "lười"/game.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import fs from 'node:fs'
import path from 'node:path'
import TheVeDich from '../src/components/bang-nhiem-vu/TheVeDich'
import BangNhiemVu from '../src/components/bang-nhiem-vu/BangNhiemVu'
import { conLaiToiHan, chuHanNop, docMonNo, docVeDich, khoaMonNo, laSauGioCuoi, nhanCoHan, nhomNoTheoNgay, ngayVuaTraXong, tenMonNo, thuCuaNgay, thuNgayNgan, type VeDichView } from '../src/lib/ve-dich-hien-thi'
import { dongGoiBanNho, tuKeHoachNgay, type KeHoachNgayMayChu } from '../src/lib/nhiem-vu-adapter'

vi.mock('../src/game/than-thu-v2/Spirit2D', () => ({ default: () => null }))
afterEach(cleanup)
const doc = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8')
const nhan = <T,>(o: T): T => JSON.parse(JSON.stringify(o))
const NOW = Date.parse('2026-09-22T19:05:00+07:00') // Thứ Ba
const HAN = '2026-09-25T05:00:00Z' // 12:00 Thứ Sáu 25/09
const chang = (tt: string[], ngay: string[] = []) => tt.map((t, i) => ({ chiSo: i, trangThai: t, ngay: ngay[i] ?? '2026-09-22' }))
const BAI_MOT_NO = {
  maBtvn: 'B1', ten: 'Ester – Lipid', hanNop: HAN, gioConLai: 64.92, quaHan: false, kip: true,
  chang: chang(['xong', 'no', 'hom_nay', 'sap_toi', 'sap_toi'], ['2026-09-21', '2026-09-21', '2026-09-22', '2026-09-23', '2026-09-24']),
  toiNay: { soChang: 2, soCau: 24, phut: 36, batDauMuonNhat: '2026-09-22T21:30:00+07:00' },
}
const NO_MOT = { theoNgay: [{ ngay: '2026-09-21', loai: 'chang_btvn', ten: 'Ester – Lipid', soCau: 12, phut: 18, maBtvn: 'B1', chiSo: 1 }, { ngay: '2026-09-21', loai: 'on_lai', ten: '', soCau: 5, phut: 6 }], tongCau: 17, tongPhut: 24 }
const KH = (them: object = {}) => ({ veDich: [BAI_MOT_NO], no: NO_MOT, ...them })
const vd = (them: object = {}): VeDichView => docVeDich(KH(them))!
const ve = (v: VeDichView, p: Record<string, unknown> = {}) => render(<TheVeDich v={v} now={NOW} onLam={() => {}} {...(p as object)} />)

describe('docVeDich — đọc chặt', () => {
  it('thân đúng ⇒ bài + nợ theo ngày; vắng `veDich` ⇒ null; rỗng cả hai ⇒ null; không phải mảng ⇒ null', () => {
    const v = vd()
    expect(v.bai).toHaveLength(1)
    expect(v.bai[0]).toMatchObject({ maBtvn: 'B1', ten: 'Ester – Lipid', quaHan: false, kip: true })
    expect(v.bai[0]!.chang.map((c) => c.trangThai)).toEqual(['xong', 'no', 'hom_nay', 'sap_toi', 'sap_toi'])
    expect(v.bai[0]!.toiNay).toEqual({ soChang: 2, soCau: 24, phut: 36, batDauMuonNhat: '2026-09-22T21:30:00+07:00' })
    expect(v.no).toMatchObject({ tongCau: 17, tongPhut: 24 })
    for (const x of [null, undefined, {}, { no: NO_MOT }, { veDich: 'x' }, { veDich: null }, { veDich: [], no: { theoNgay: [] } }, { veDich: [{}], no: {} }]) expect(docVeDich(x as never), JSON.stringify(x)).toBeNull()
  })
  it('CÓ `veDich: []` nhưng còn nợ ôn ⇒ vẫn dựng (chỉ khối ngày trước); chặng sai dạng / trạng thái lạ / thiếu hạn bị bỏ; chặng sắp theo chỉ số; toiNay 0 chặng ⇒ null', () => {
    const v = docVeDich({ veDich: [], no: NO_MOT })!
    expect(v.bai).toEqual([])
    expect(v.no.theoNgay).toHaveLength(2)
    const b = nhan(BAI_MOT_NO)
    b.chang = [{ chiSo: 2, trangThai: 'hom_nay', ngay: '2026-09-22' }, { chiSo: 0, trangThai: 'xong', ngay: '2026-09-20' }, { chiSo: 1, trangThai: 'la', ngay: '' }, { chiSo: -1, trangThai: 'no' }, 'x']
    b.toiNay = { soChang: 0, soCau: 0, phut: 0, batDauMuonNhat: '2026-09-22T21:30:00+07:00' }
    const r = docVeDich({ veDich: [b, { ...BAI_MOT_NO, maBtvn: '' }, { ...BAI_MOT_NO, hanNop: 'rác' }], no: {} })!
    expect(r.bai).toHaveLength(1)
    expect(r.bai[0]!.chang.map((c) => c.chiSo)).toEqual([0, 2])
    expect(r.bai[0]!.toiNay).toBeNull()
  })
  it('món nợ: sai dạng bỏ; loại lạ bỏ; sắp theo ngày tăng dần; số câu/phút là số nguyên ≥ 0', () => {
    expect(docMonNo({ ngay: '2026-09-21', loai: 'on_lai', soCau: 5, phut: 6 })).toMatchObject({ soCau: 5, chiSo: null })
    for (const x of [null, {}, { ngay: '21/09', loai: 'on_lai', soCau: 5, phut: 6 }, { ngay: '2026-09-21', loai: 'la', soCau: 5, phut: 6 }, { ngay: '2026-09-21', loai: 'on_lai', soCau: -1, phut: 6 }, { ngay: '2026-09-21', loai: 'on_lai', soCau: 5.5, phut: 6 }]) expect(docMonNo(x), JSON.stringify(x)).toBeNull()
    const v = docVeDich({ veDich: [], no: { theoNgay: [{ ngay: '2026-09-22', loai: 'on_lai', soCau: 1, phut: 1 }, { ngay: '2026-09-20', loai: 'on_lai', soCau: 2, phut: 2 }] } })!
    expect(v.no.theoNgay.map((m) => m.ngay)).toEqual(['2026-09-20', '2026-09-22'])
  })
})

describe('chữ / giờ thuần', () => {
  it('conLaiToiHan: 64 giờ 55 phút; qua hạn ⇒ null; chuHanNop; nhanCoHan (Thứ Sáu / Ngày mai / Hôm nay)', () => {
    expect(conLaiToiHan(HAN, NOW)).toEqual({ gio: 64, phut: 55 })
    expect(conLaiToiHan(HAN, Date.parse(HAN))).toBeNull()
    expect(conLaiToiHan('rác', NOW)).toBeNull()
    expect(chuHanNop(HAN)).toBe('12:00 · Thứ Sáu 25/09/2026')
    expect(nhanCoHan(HAN, NOW)).toBe('Thứ Sáu')
    expect(nhanCoHan(HAN, Date.parse('2026-09-24T19:00:00+07:00'))).toBe('Ngày mai')
    expect(nhanCoHan(HAN, Date.parse('2026-09-25T08:00:00+07:00'))).toBe('Hôm nay')
    expect(thuCuaNgay('2026-09-21')).toBe('Thứ Hai')
    expect(thuNgayNgan('2026-09-21')).toBe('Thứ Hai 21/09')
  })
  it('6 giờ cuối mới được dùng màu cảnh báo mạnh', () => {
    expect(laSauGioCuoi(HAN, Date.parse('2026-09-25T06:30:00+07:00'))).toBe(true)
    expect(laSauGioCuoi(HAN, Date.parse('2026-09-25T05:59:00+07:00'))).toBe(false)
    expect(laSauGioCuoi(HAN, Date.parse('2026-09-25T13:00:00+07:00'))).toBe(false) // đã qua
  })
  it('nhomNoTheoNgay + tenMonNo: chặng "Chặng 2 · 12 câu", gói, ôn; khoá món; ngày vừa trả xong', () => {
    const v = vd()
    const n = nhomNoTheoNgay(v.no.theoNgay)
    expect(n).toHaveLength(1)
    expect(n[0]).toMatchObject({ ngay: '2026-09-21', phut: 24, soCau: 17 })
    expect(tenMonNo(v.no.theoNgay[0]!)).toEqual({ tren: 'Chặng 2 · 12 câu', duoi: 'Ester – Lipid · khoảng 18 phút' })
    expect(tenMonNo(v.no.theoNgay[1]!)).toEqual({ tren: '5 câu ôn lại đã quá lịch', duoi: 'khoảng 6 phút' })
    expect(tenMonNo({ ngay: '2026-09-21', loai: 'goi_gia_dinh', ten: '', soCau: 6, phut: 8, maBtvn: '', chiSo: null }).tren).toBe('Gói gia đình giao · 6 câu')
    expect(khoaMonNo(v.no.theoNgay[0]!)).not.toBe(khoaMonNo(v.no.theoNgay[1]!))
    const nay = vd({ no: { theoNgay: [] } })
    expect(ngayVuaTraXong(v, nay)).toBe('2026-09-21')
    expect(ngayVuaTraXong(null, nay)).toBeNull()
    expect(ngayVuaTraXong(v, v)).toBeNull()
    const mot = vd({ no: { theoNgay: [NO_MOT.theoNgay[1]] } })
    expect(ngayVuaTraXong(v, mot)).toBeNull() // ngày còn món ⇒ chưa xong ngày
  })
})

describe('TheVeDich — bốn trạng thái + qua hạn', () => {
  it('MẪU 1 · nợ một chặng: đồng hồ 64 giờ 55 phút, đường 5 chặng có nhãn (Đã xong · Thứ Hai · Hôm nay · Thứ Tư · Thứ Năm · cờ Thứ Sáu), "Tối nay: 2 chặng · 24 câu", nút "Làm chặng 2 ngay", khối ngày trước', () => {
    const onLam = vi.fn()
    const { container } = ve(vd(), { onLam, soViecConLai: 2 })
    const the = container.querySelector('[data-vung="duong-ve-dich"]') as HTMLElement
    expect(the.getAttribute('data-trang-thai')).toBe('no')
    expect(the.querySelector('h2')!.textContent).toBe('Ester – Lipid')
    expect(the.querySelector('.vd-dau__nhan')!.textContent).toBe('Đường về đích · Bài tập về nhà')
    const dh = the.querySelector('[role="timer"]')!
    expect(dh.getAttribute('aria-label')).toBe('Còn 64 giờ 55 phút tới Hạn nộp 12:00 · Thứ Sáu 25/09/2026')
    expect(dh.textContent).toContain('64')
    expect(dh.textContent).toContain('55')
    expect([...the.querySelectorAll('.vd-moc')].map((m) => m.getAttribute('aria-label'))).toEqual(['Chặng 1: đã xong', 'Chặng 2: còn lại từ Thứ Hai', 'Chặng 3: của hôm nay', 'Chặng 4: sắp tới, Thứ Tư', 'Chặng 5: sắp tới, Thứ Năm', 'Đích: Hạn nộp 12:00 Thứ Sáu'])
    expect([...the.querySelectorAll('.vd-moc__tt')].map((m) => m.textContent)).toEqual(['Đã xong', 'Thứ Hai', 'Hôm nay', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu'])
    const kh = the.querySelector('[data-vung="ke-hoach"]')!.textContent!
    expect(kh).toContain('Tối nay: 2 chặng · 24 câu')
    expect(kh).toContain('Khoảng 36 phút · bắt đầu muộn nhất 21:30')
    fireEvent.click(screen.getByRole('button', { name: /Làm chặng 2 ngay/ }))
    expect(onLam).toHaveBeenCalledTimes(1)
    expect(the.querySelector('.vd-hich')!.textContent).toContain('Xong 2 chặng tối nay là em về đúng nhịp')
    expect(the.querySelector('.vd-hich')!.textContent).toContain('Còn 2 việc nữa là hôm nay ĐẠT')
    const truoc = container.querySelector('[data-vung="ngay-truoc"]')!
    expect(truoc.textContent).toContain('Còn lại từ các ngày trước')
    expect(truoc.textContent).toContain('2 việc')
    expect(truoc.textContent).toContain('Thứ Hai 21/09')
    expect(truoc.textContent).toContain('khoảng 24 phút')
    expect(truoc.textContent).toContain('Chặng 2 · 12 câu')
    expect(truoc.textContent).toContain('5 câu ôn lại đã quá lịch')
  })

  it('MỘT nút chính trong thẻ (nút làm); mỗi món nợ là một đích chạm bấm được (onLam); mọi nút ≥ 48 px theo CSS', () => {
    const onLam = vi.fn()
    const { container } = ve(vd(), { onLam })
    expect(container.querySelectorAll('button.vd-nut')).toHaveLength(1)
    const mon = container.querySelectorAll('[data-vung="ngay-no"] button.vd-dong')
    expect(mon).toHaveLength(2)
    fireEvent.click(mon[0]!)
    expect(onLam).toHaveBeenCalledTimes(1)
    const css = doc('src/components/bang-nhiem-vu/ve-dich.css')
    expect(css).toMatch(/\.vd-nut \{[^}]*min-height: 5\dpx/)
    expect(css).toMatch(/\.vd-dong \{[^}]*min-height: [4-9]\dpx/)
  })

  it('MẪU 2 · nợ NHIỀU NGÀY: viền cảnh báo (vd-the--gap) + đồng hồ gấp; hai nhóm ngày; KHÔNG chữ "lười", không game, không emoji', () => {
    const b = nhan(BAI_MOT_NO)
    b.chang = chang(['xong', 'no', 'no', 'no', 'hom_nay'], ['2026-09-21', '2026-09-21', '2026-09-22', '2026-09-23', '2026-09-24'])
    const no = { theoNgay: [...NO_MOT.theoNgay, { ngay: '2026-09-22', loai: 'chang_btvn', ten: 'Ester – Lipid', soCau: 12, phut: 18, maBtvn: 'B1', chiSo: 2 }] }
    const { container } = ve(docVeDich({ veDich: [b], no })!)
    const the = container.querySelector('[data-vung="duong-ve-dich"]') as HTMLElement
    expect(the.getAttribute('data-trang-thai')).toBe('no-gap')
    expect(the.classList.contains('vd-the--gap')).toBe(true)
    expect(the.querySelector('.vd-dh')!.classList.contains('vd-dh--gap')).toBe(true)
    expect(container.querySelectorAll('[data-vung="ngay-no"]')).toHaveLength(2)
    expect(container.textContent).not.toMatch(/lười|thần thú|EXP|khiên|Đảo|Đoàn/i)
    expect(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(container.textContent || '')).toBe(false)
  })

  it('cú hích: không có chặng nợ (chỉ nợ ôn) ⇒ KHÔNG nói "Xong N chặng … đúng nhịp"; hết việc bắt buộc (0) ⇒ KHÔNG nói "Còn 0 việc"', () => {
    const b = nhan(BAI_MOT_NO)
    b.chang = chang(['xong', 'hom_nay', 'sap_toi'])
    const { container } = ve(docVeDich({ veDich: [b], no: { theoNgay: [NO_MOT.theoNgay[1]] } })!, { soViecConLai: 0 })
    expect(container.querySelector('[data-vung="duong-ve-dich"]')).toBeTruthy()
    expect(container.querySelector('.vd-hich')).toBeNull()
    expect(container.textContent).not.toMatch(/Còn 0 việc|Xong \d+ chặng tối nay/)
  })

  it('MỘT nợ, còn nhiều giờ ⇒ KHÔNG viền cảnh báo (không doạ trước 6 giờ cuối); 6 giờ cuối ⇒ viền', () => {
    expect(ve(vd()).container.querySelector('.vd-the--gap')).toBeNull()
    cleanup()
    const r = render(<TheVeDich v={vd()} now={Date.parse('2026-09-25T07:00:00+07:00')} onLam={() => {}} />)
    expect(r.container.querySelector('.vd-the--gap')).toBeTruthy()
  })

  it('MẪU 3 · ĐÚNG NHỊP: MỘT dòng xanh, không đồng hồ; chạm ⇒ mở cả đường; chạm lại ⇒ gọn', () => {
    const b = nhan(BAI_MOT_NO)
    b.chang = chang(['xong', 'xong', 'hom_nay', 'sap_toi', 'sap_toi'])
    const v = docVeDich({ veDich: [b], no: { theoNgay: [] } })!
    const { container } = ve(v)
    const the = container.querySelector('[data-vung="duong-ve-dich"]') as HTMLElement
    expect(the.getAttribute('data-trang-thai')).toBe('dung-nhip')
    expect(the.textContent).toContain('Em đang đúng nhịp')
    expect(the.textContent).toContain('hạn nộp 12:00 Thứ Sáu')
    expect(the.textContent).toContain('còn 2 ngày')
    expect(container.querySelector('[role="timer"]')).toBeNull()
    expect(container.querySelector('[data-vung="ngay-truoc"]')).toBeNull()
    expect(container.querySelector('.vd-duong')).toBeNull()
    const nut = screen.getByRole('button', { name: /Em đang đúng nhịp/ })
    expect(nut.getAttribute('aria-expanded')).toBe('false')
    fireEvent.click(nut)
    expect(nut.getAttribute('aria-expanded')).toBe('true')
    expect(container.querySelector('.vd-duong')).toBeTruthy()
    fireEvent.click(nut)
    expect(container.querySelector('.vd-duong')).toBeNull()
  })

  it('MẪU 4 · VỪA TRẢ NỢ: lời mừng "Em vừa trả xong phần của Thứ Hai." + ngày bị gạch (đã trả xong) + đường có "Vừa xong"; hoạt ảnh tắt khi giảm chuyển động', () => {
    const b = nhan(BAI_MOT_NO)
    b.chang = chang(['xong', 'xong', 'hom_nay', 'sap_toi', 'sap_toi'])
    const { container } = ve(docVeDich({ veDich: [b], no: { theoNgay: [] } })!, { ngayVuaTra: '2026-09-21' })
    expect(container.querySelector('[data-vung="vua-tra"]')!.textContent).toContain('Em vừa trả xong phần của Thứ Hai.')
    expect(container.querySelector('[data-vung="vua-tra"]')!.getAttribute('aria-live')).toBe('polite')
    expect(container.querySelector('[data-vung="ngay-da-tra"]')!.textContent).toContain('Thứ Hai 21/09')
    expect(container.querySelector('[data-vung="ngay-da-tra"]')!.textContent).toContain('đã trả xong')
    expect([...container.querySelectorAll('.vd-moc__tt')].map((m) => m.textContent)).toContain('Vừa xong')
    expect(doc('src/components/bang-nhiem-vu/ve-dich.css')).toMatch(/prefers-reduced-motion: reduce/)
  })

  it('QUÁ HẠN (Điều 4 B): "Bài đã qua Hạn nộp" + "Em vẫn cần làm nốt 2 chặng · sẽ ghi nộp trễ."; không đồng hồ; vẫn có nút làm; không "nhờ Thầy gia hạn"', () => {
    const b = nhan(BAI_MOT_NO)
    b.quaHan = true
    b.chang = chang(['xong', 'hom_nay', 'sap_toi'], ['2026-09-20', '2026-09-22', '2026-09-23'])
    const onLam = vi.fn()
    const { container } = render(<TheVeDich v={docVeDich({ veDich: [b], no: { theoNgay: [] } })!} now={Date.parse('2026-09-26T10:00:00+07:00')} onLam={onLam} />)
    const the = container.querySelector('[data-vung="duong-ve-dich"]') as HTMLElement
    expect(the.getAttribute('data-trang-thai')).toBe('qua-han')
    expect(the.querySelector('[data-vung="nop-tre"]')!.textContent).toBe('Bài đã qua Hạn nộpEm vẫn cần làm nốt 2 chặng · sẽ ghi nộp trễ.')
    expect(container.querySelector('[role="timer"]')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: /Làm chặng 2 ngay/ }))
    expect(onLam).toHaveBeenCalledTimes(1)
    expect(container.textContent).not.toMatch(/nhờ Thầy gia hạn|lười|muộn rồi/i)
    // Boss soát ảnh vd-tre: khung CAM (không xanh lá), cờ "Đã qua hạn" mờ, chặng chưa xong = "Còn nợ" (không "Hôm nay"/thứ)
    expect(the.querySelector('[data-vung="nop-tre"]')!.classList.contains('vd-mung--luu-y')).toBe(true)
    expect(the.querySelector('.vd-moc--dich')!.classList.contains('vd-moc--het')).toBe(true)
    expect([...the.querySelectorAll('.vd-moc__ten')].pop()!.textContent).toBe('Đã qua hạn')
    expect([...the.querySelectorAll('.vd-moc__tt')].map((m) => m.textContent)).toEqual(['Đã xong', 'Còn nợ', 'Còn nợ', ''])
    expect([...the.querySelectorAll('.vd-moc')].map((m) => m.getAttribute('aria-label'))).toEqual(['Chặng 1: đã xong', 'Chặng 2: còn nợ', 'Chặng 3: còn nợ', 'Đích: đã qua hạn nộp'])
    expect(container.textContent).not.toMatch(/Hôm nay|Thứ Sáu|Hạn nộp 12/)
    expect(doc('src/components/bang-nhiem-vu/ve-dich.css')).toMatch(/\.vd-mung--luu-y \{[^}]*canh-bao-nen/)
  })

  it('nhiều bài: bài KHẨN NHẤT (hạn sớm nhất) là thẻ đầy đủ; bài khác một dòng (tối đa 3); chỉ nợ ôn (không bài) ⇒ chỉ khối ngày trước', () => {
    const b2 = { ...nhan(BAI_MOT_NO), maBtvn: 'B2', ten: 'Ancol – Phenol', hanNop: '2026-09-23T05:00:00Z' }
    const { container } = ve(docVeDich({ veDich: [BAI_MOT_NO, b2], no: NO_MOT })!)
    expect(container.querySelector('h2#vd-t-B2')!.textContent).toBe('Ancol – Phenol')
    expect(container.querySelector('[data-vung="bai-khac"]')!.textContent).toContain('Ester – Lipid')
    cleanup()
    const c = ve(docVeDich({ veDich: [], no: NO_MOT })!)
    expect(c.container.querySelector('[data-vung="duong-ve-dich"]')).toBeNull()
    expect(c.container.querySelector('[data-vung="ngay-truoc"]')).toBeTruthy()
  })
})

describe('Bảng nhiệm vụ — nối thẻ', () => {
  const NOW_B = NOW
  const keHoach = (them: object = {}): KeHoachNgayMayChu =>
    ({
      ok: true,
      nganSach: { mucTieuCau: 12, toiThieuCau: 6, vanTocGiay: 78, vanTocNguon: 'do', ghiChuVanToc: '' },
      viec: [{ id: 'btvn_lo:B1:1', loai: 'btvn_lo', thuTu: 1, batBuoc: true, khan: false, cong: null, hien: true, nhan: null, trangThai: 'cho', ghiChu: '', chiTiet: { ma: 'B1', chiSo: 1, tongLo: 5 }, hanCung: new Date(NOW_B + 3600_000).toISOString(), hanMem: null, soCau: 12 }] as any,
      canhBao: [],
      quaHan: [],
      tienBo: { daLamCau: 0, lenBac: 0, conThieu: 6 },
      chuoiDat: 2,
      lanNghi: false,
      capNhatLuc: new Date(NOW_B - 60_000).toISOString(),
      ...them,
    }) as KeHoachNgayMayChu
  const phu = { dsBtvn: [{ maBtvn: 'B1', maCa: 'CA-1', tenBtvn: 'Ester – Lipid', soCau: 12 }], dsMomGiao: [] as any[] }
  const dl = (them: object = {}) => ({ ...tuKeHoachNgay(keHoach(them), NOW_B, phu), thanThu: { kieu: 'chua_biet' } as const })
  const bang = (d: any, vaiTro: 'hocsinh' | 'phuhuynh' = 'hocsinh', extra: Record<string, unknown> = {}) => render(<BangNhiemVu vaiTro={vaiTro} hoTen="Minh" now={NOW_B} duLieu={d} onHanhDong={() => {}} taiVinhDanh={async () => null} {...(extra as object)} />)

  it('adapter: veDich đọc chặt vào duLieu.veDich; máy chủ chưa trả ⇒ null; bản nhớ KHÔNG lưu veDich', () => {
    expect(dl(KH()).veDich!.bai[0]!.maBtvn).toBe('B1')
    expect(dl().veDich).toBeNull()
    expect(dl({ veDich: 'x' }).veDich).toBeNull()
    expect(dongGoiBanNho(dl(KH()), NOW_B)!.duLieu.veDich).toBeNull()
  })
  it('học sinh: thẻ nằm NGAY DƯỚI lời chào, TRÊN tiến độ; nút ⇒ onHanhDong với việc chưa xong đầu tiên; thiếu veDich ⇒ không thẻ; phụ huynh không thấy', () => {
    const onHanhDong = vi.fn()
    const { container } = bang(dl(KH()), 'hocsinh', { onHanhDong })
    const the = container.querySelector('[data-vung="ve-dich"]') as HTMLElement
    const tienDo = container.querySelector('[data-vung="tien-do"]') as HTMLElement
    expect(the).toBeTruthy()
    expect(the.compareDocumentPosition(tienDo) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /Làm chặng 2 ngay/ }))
    expect(onHanhDong).toHaveBeenCalledTimes(1)
    cleanup()
    expect(bang(dl()).container.querySelector('[data-vung="ve-dich"]')).toBeNull()
    cleanup()
    expect(bang(dl(KH()), 'phuhuynh').container.querySelector('[data-vung="ve-dich"]')).toBeNull()
  })
  it('hai lần nạp liên tiếp: nợ của Thứ Hai biến mất ⇒ dòng mừng "Em vừa trả xong phần của Thứ Hai." (rồi tự tắt sau 8 giây)', () => {
    vi.useFakeTimers()
    try {
      const a = dl(KH())
      const { container, rerender } = bang(a)
      expect(container.querySelector('[data-vung="vua-tra"]')).toBeNull()
      rerender(<BangNhiemVu vaiTro="hocsinh" hoTen="Minh" now={NOW_B} duLieu={dl(KH({ no: { theoNgay: [] } })) as any} onHanhDong={() => {}} taiVinhDanh={async () => null} />)
      expect(container.querySelector('[data-vung="vua-tra"]')!.textContent).toContain('Em vừa trả xong phần của Thứ Hai.')
      vi.advanceTimersByTime(8500)
      rerender(<BangNhiemVu vaiTro="hocsinh" hoTen="Minh" now={NOW_B} duLieu={dl(KH({ no: { theoNgay: [] } })) as any} onHanhDong={() => {}} taiVinhDanh={async () => null} />)
    } finally {
      vi.useRealTimers()
    }
  })
})

describe('khoá nguồn', () => {
  it('không màu thô / emoji / lookbehind / .at( / chữ game / "lười" trong tệp mới; thẻ chỉ nhận prop (không gọi mạng)', () => {
    for (const p of ['src/lib/ve-dich-hien-thi.ts', 'src/components/bang-nhiem-vu/TheVeDich.tsx']) {
      const s = doc(p).replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '')
      expect(s, p).not.toMatch(/#[0-9a-fA-F]{3,8}\b|\(\?<[=!]|\.at\(|randomUUID|fetch\(/)
      expect(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(s), p).toBe(false)
      expect(s, p).not.toMatch(/thần thú|khiên|Võ đài|lười/i)
    }
    expect(doc('src/components/bang-nhiem-vu/BangNhiemVu.tsx')).toMatch(/\{!laPh && duLieu\.veDich && !dangTai && \(/)
  })
})

describe('NỘP TRỄ ở máy em (Điều 4 = B): thẻ "Đã qua Hạn nộp" không còn chặn khi máy chủ cho nộp', () => {
  const NOW_T = Date.parse('2026-09-26T10:00:00+07:00')
  const keHoachTre = (veDich: unknown): KeHoachNgayMayChu =>
    ({
      ok: true,
      nganSach: { mucTieuCau: 12, toiThieuCau: 6, vanTocGiay: 78, vanTocNguon: 'do', ghiChuVanToc: '' },
      viec: [],
      canhBao: [],
      quaHan: [{ loai: 'btvn', ma: 'B1', hanNop: '2026-09-25T05:00:00Z', conLai: 24 }],
      tienBo: { daLamCau: 0, lenBac: 0, conThieu: 6 },
      chuoiDat: 0,
      lanNghi: false,
      capNhatLuc: new Date(NOW_T - 60_000).toISOString(),
      ...(veDich === undefined ? {} : { veDich, no: { theoNgay: [] } }),
    }) as KeHoachNgayMayChu
  const phu = { dsBtvn: [{ maBtvn: 'B1', maCa: 'CA-1', tenBtvn: 'Ester – Lipid', soCau: 12 }], dsMomGiao: [] as any[] }
  const baiTre = (chang_: string[], quaHan = true) => ({ ...nhan(BAI_MOT_NO), quaHan, chang: chang(chang_, ['2026-09-20', '2026-09-22', '2026-09-23'].slice(0, chang_.length)), toiNay: null })

  it('máy chủ có veDich báo quaHan ⇒ "Bài đã qua Hạn nộp · em vẫn cần làm nốt 2 chặng · sẽ ghi nộp trễ", BẤM ĐƯỢC (mo_btvn "Làm nốt bài"), không "nhờ Thầy gia hạn"', () => {
    const d = tuKeHoachNgay(keHoachTre([baiTre(['xong', 'hom_nay', 'sap_toi'])]), NOW_T, phu)
    expect(d.quaHan[0]).toMatchObject({ loai: 'btvn', chu: 'Bài đã qua Hạn nộp · em vẫn cần làm nốt 2 chặng · sẽ ghi nộp trễ' })
    expect(d.quaHan[0]!.hanhDong).toMatchObject({ loai: 'mo_btvn', nhanNut: 'Làm nốt bài' })
    expect(JSON.stringify(d.quaHan[0])).not.toMatch(/nhờ Thầy gia hạn/)
    const onHanhDong = vi.fn()
    render(<BangNhiemVu vaiTro="hocsinh" hoTen="Minh" now={NOW_T} duLieu={{ ...d, thanThu: { kieu: 'chua_biet' } } as any} onHanhDong={onHanhDong} taiVinhDanh={async () => null} />)
    const nut = screen.getAllByRole('button').find((b) => /Đã qua Hạn nộp|qua Hạn nộp/.test(b.getAttribute('aria-label') || ''))!
    expect(nut.getAttribute('aria-label')).toContain('sẽ ghi nộp trễ')
    fireEvent.click(nut)
    expect(onHanhDong).toHaveBeenCalledTimes(1)
    expect(onHanhDong.mock.calls[0]![0]).toMatchObject({ loai: 'mo_btvn' })
  })
  it('chặng còn lại 0 ⇒ câu "em vẫn làm và nộp được"; máy chủ CŨ (không veDich) hoặc bài KHÔNG quaHan hoặc mã khác ⇒ GIỮ chữ cũ "nhờ Thầy gia hạn" và không nút', () => {
    expect(tuKeHoachNgay(keHoachTre([baiTre(['xong', 'xong'])]), NOW_T, phu).quaHan[0]!.chu).toBe('Bài đã qua Hạn nộp · em vẫn làm và nộp được · sẽ ghi nộp trễ')
    for (const kh of [keHoachTre(undefined), keHoachTre([baiTre(['xong', 'hom_nay'], false)]), keHoachTre([{ ...baiTre(['xong', 'hom_nay']), maBtvn: 'B9' }])]) {
      const q = tuKeHoachNgay(kh, NOW_T, phu).quaHan[0]!
      expect(q.chu).toBe('Đã qua Hạn nộp — nhờ Thầy gia hạn')
      expect(q.hanhDong).toBeUndefined()
    }
  })
  it('máy em KHÔNG tự chặn theo hạn: nguồn nộp chặng chỉ dịch lời của MÁY CHỦ (qua_han ⇒ câu chung), không so hạn với giờ máy', () => {
    const s = doc('src/lib/btvn-nop-chang-em.ts')
    expect(s).toMatch(/if \(ket\.lyDo === 'qua_han'\) return 'Bài đã quá hạn nộp\.'/)
    expect(s).not.toMatch(/hanNop|Date\.now\(\)\s*[<>]/)
  })
})
