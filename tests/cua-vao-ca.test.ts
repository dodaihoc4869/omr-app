// CỬA VÀO CA — HAI NÚT, KHÔNG PHẢI MỘT NÚT ĐỔI MẶT (thầy chốt 05/09).
//
// Trước đây màn coi thi có đúng một nút: đang mở thì hiện "KHOÁ CA", đã khoá
// thì hiện "MỞ CA LẠI". Nhìn một nút không biết ca đang ở trạng thái nào, phải
// đọc chữ trên nút rồi suy ngược — giữa giờ dễ bấm nhầm.
//
// Và nó chỉ nhìn `trangThai`, nên ca QUÁ GIỜ VÀO vẫn hiện "đang mở" trong khi
// em đến muộn bấm link thì bị máy chủ chặn.
import { describe, expect, it } from 'vitest'
import { cuaVaoCa } from '../src/lib/cua-vao-ca'
import maChiTietCa from '../src/screens/ExamMonitorScreen.tsx?raw'

const T = (s: string) => Date.parse(s)
const HAN = '2026-09-05T01:30:00Z'
const TRUOC_HAN = T('2026-09-05T01:00:00Z')
const SAU_HAN = T('2026-09-05T02:00:00Z')

describe('cuaVaoCa — ba trạng thái, không lẫn nhau', () => {
  it('ca mở, chưa tới hạn vào: ĐANG MỞ, khoá được, không có gì để mở thêm', () => {
    const c = cuaVaoCa({ trangThai: 'mo', hetHanVao: HAN }, TRUOC_HAN)
    expect(c).toMatchObject({ nhan: 'ĐANG MỞ', moCua: true, quaGioVao: false, daKhoa: false, khoaDuoc: true })
  })

  it('ca mở, KHÔNG giới hạn giờ vào: ĐANG MỞ và nút mở tắt hẳn', () => {
    const c = cuaVaoCa({ trangThai: 'mo' }, SAU_HAN)
    expect(c).toMatchObject({ nhan: 'ĐANG MỞ', moCua: true, moDuoc: false, khoaDuoc: true })
  })

  it('ca mở nhưng QUÁ GIỜ VÀO: cửa đóng, nói đúng lý do, MỞ CA có việc để làm', () => {
    const c = cuaVaoCa({ trangThai: 'mo', hetHanVao: HAN }, SAU_HAN)
    expect(c).toMatchObject({ nhan: 'ĐÃ QUÁ GIỜ VÀO', moCua: false, quaGioVao: true, daKhoa: false, moDuoc: true, khoaDuoc: true })
  })

  it('thầy bấm khoá: ĐÃ KHOÁ, mở được, không khoá thêm được', () => {
    const c = cuaVaoCa({ trangThai: 'dong' }, TRUOC_HAN)
    expect(c).toMatchObject({ nhan: 'ĐÃ KHOÁ', moCua: false, daKhoa: true, moDuoc: true, khoaDuoc: false })
  })

  it('vừa khoá vừa quá giờ: nhãn ưu tiên "ĐÃ KHOÁ" — đó là cái thầy tự làm', () => {
    const c = cuaVaoCa({ trangThai: 'dong', hetHanVao: HAN }, SAU_HAN)
    expect(c.nhan).toBe('ĐÃ KHOÁ')
    expect(c.moDuoc).toBe(true)
  })

  it('ca đã xoá: không mở lại bằng nút này, phải khôi phục ca trước', () => {
    const c = cuaVaoCa({ trangThai: 'da_xoa' }, TRUOC_HAN)
    expect(c).toMatchObject({ nhan: 'ĐÃ KHOÁ', moCua: false, moDuoc: false, khoaDuoc: false })
  })

  it('hạn vào là chuỗi rác thì coi như KHÔNG có hạn, không tự đoán', () => {
    const c = cuaVaoCa({ trangThai: 'mo', hetHanVao: 'chưa đặt' }, SAU_HAN)
    expect(c).toMatchObject({ nhan: 'ĐANG MỞ', quaGioVao: false })
  })

  it('không có ca thì đóng, cả hai nút đều tắt', () => {
    expect(cuaVaoCa(null, SAU_HAN)).toMatchObject({ moCua: false, moDuoc: false, khoaDuoc: false })
  })
})

describe('màn Chi tiết ca dựng đúng hai nút', () => {
  it('có nút MỞ CA và nút KHOÁ CA, mỗi nút một nhãn trợ năng riêng', () => {
    expect(maChiTietCa).toContain('aria-label="Mở ca cho em vào"')
    expect(maChiTietCa).toContain('aria-label="Khoá ca"')
    expect(maChiTietCa).toContain('MỞ CA')
    expect(maChiTietCa).toContain('KHOÁ CA')
  })

  it('bỏ hẳn nút "MỞ CA LẠI" một mặt của bản cũ', () => {
    expect(maChiTietCa).not.toContain('MỞ CA LẠI')
  })

  it('trạng thái cửa lấy từ cuaVaoCa, không tự so trangThai trong màn', () => {
    expect(maChiTietCa).toContain("import { cuaVaoCa } from '../lib/cua-vao-ca'")
    expect(maChiTietCa).toContain('cuaVaoCa(chiTiet?.ca ?? null, now)')
  })

  it('GỌI LÊN BẢNG đã gỡ khỏi màn coi thi — nó có màn riêng', () => {
    expect(maChiTietCa).not.toContain('KhoiGoiLenBang')
  })
})
