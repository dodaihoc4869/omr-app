// KHỐI "RÚT ĐỀ" TRONG BÁO CÁO CỦA EM VẪN XƯNG "CON" — thầy báo 09/09:
// "phần rút đề của học sinh bị nhầm báo cáo phụ huynh".
//
// Đợt vá 08/09 chỉ chữa dòng "việc cần làm" bằng `doiXungVeEm`. Nó không với
// tới khối này, vì `NutXemDeCuaCon` KHÔNG hề nhận `laCuaEm` — nó không biết ai
// đang đọc, nên năm chỗ chữ đều xưng kiểu gửi phụ huynh kể cả khi chính em mở
// báo cáo của mình:
//
//   · nhãn bìa đề dựng ra:  "Đề con vừa làm, kèm lời giải"
//   · chữ trên nút:         "Xem đề con vừa làm (N câu) kèm lời giải"
//   · dòng chú thích:       "…máy đã gán riêng cho con."
//   · tên khung xem:        "Đề con vừa làm"
//   · câu báo lỗi:          "Phụ huynh thử lại khi có mạng ổn định."
//
// Cộng thêm dòng chân trang: "Phụ huynh giữ trong máy…" — nói với em là sai vai.
//
// PHÉP KIỂM: DỰNG THẬT màn báo cáo với cùng một gói dữ liệu, hai vai khác nhau,
// rồi đọc chữ hiện ra. Soi chuỗi trong tệp không đủ — chính vì khối này "có đủ
// chữ đúng" trong tệp mà lỗi vẫn lọt: cái sai là nó không nhận được vai.
import { describe, expect, it, afterEach } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import PhieuScreen from '../src/screens/PhieuScreen'
import { BAN_PHIEU_DOC_DUOC, type PhieuDayDu } from '../src/lib/phieu-du-lieu'

afterEach(cleanup)

/** Gói phiếu tối thiểu nhưng CÓ `deCuaEm` — điều kiện để khối rút đề hiện ra. */
function goiPhieu(): PhieuDayDu {
  return {
    v: BAN_PHIEU_DOC_DUOC,
    hoTen: 'Bùi Hồng Hân',
    sbd: '12054',
    lop: '12',
    tenCa: '2009 - Lớp 2 - L1',
    maCa: '447479',
    ngay: '2026-09-08T12:09:17.983Z',
    diem: 7.88,
    diemPhan: { I: 3.38, II: 3, III: 1.5 },
    soCauSai: 3,
    tongSoCau: 12,
    hang: 10,
    siSo: 36,
    chuyenDeCa: [],
    chuyenDeTong: [],
    lichSu: [],
    diemLop: [],
    vieCanLam: '',
    thongKe: null,
    tinHieu: [],
    ducKet: [],
    cauSai: [],
    dai: [],
    deCuaEm: [
      { qid: 'q1', phan: 'I', soCau: 1, noiDung: 'Câu 1', luaChon: ['A', 'B', 'C', 'D'], dapAn: 'A', chuyenDe: 'Ester – lipid' },
    ],
  } as unknown as PhieuDayDu
}

describe('khối RÚT ĐỀ xưng hô theo đúng người đang đọc', () => {
  it('BÁO CÁO CỦA EM: nút và chú thích xưng "em", không còn chữ "con"', () => {
    render(<PhieuScreen duCoSan={goiPhieu()} laCuaEm />)
    expect(screen.getByText(/Xem đề em vừa làm \(1 câu\) kèm lời giải/)).toBeTruthy()
    expect(screen.getByText(/máy đã gán riêng cho/).textContent).toContain('cho em')
    expect(screen.queryByText(/Xem đề con vừa làm/)).toBeNull()
  })

  it('BÁO CÁO GỬI PHỤ HUYNH: giữ nguyên xưng "con" — không được chữa hỏng vế kia', () => {
    render(<PhieuScreen duCoSan={goiPhieu()} />)
    expect(screen.getByText(/Xem đề con vừa làm \(1 câu\) kèm lời giải/)).toBeTruthy()
    expect(screen.getByText(/máy đã gán riêng cho/).textContent).toContain('cho con')
    expect(screen.queryByText(/Xem đề em vừa làm/)).toBeNull()
  })

  it('CHÂN TRANG: bản của em không dặn "Phụ huynh giữ trong máy"', () => {
    const { container } = render(<PhieuScreen duCoSan={goiPhieu()} laCuaEm />)
    const chan = container.querySelector('.bc-chan')!.textContent || ''
    expect(chan).toContain('Em giữ trong máy')
    expect(chan).not.toContain('Phụ huynh giữ trong máy')
  })

  it('CHÂN TRANG: bản gửi phụ huynh vẫn dặn phụ huynh', () => {
    const { container } = render(<PhieuScreen duCoSan={goiPhieu()} />)
    const chan = container.querySelector('.bc-chan')!.textContent || ''
    expect(chan).toContain('Phụ huynh giữ trong máy')
  })

  it('KHÔNG SÓT CHỖ NÀO: cả trang bản của em không còn chữ xưng "con"', () => {
    const { container } = render(<PhieuScreen duCoSan={goiPhieu()} laCuaEm />)
    // Bỏ khối <style> ra trước: CSS nhúng thẳng trong trang và `textContent`
    // nuốt cả nó, nên quét nguyên container là quét cả mã màu — bản đầu của
    // phép kiểm này đỏ vì đúng lý do đó, không phải vì chữ hiện ra sai.
    const el = container.cloneNode(true) as HTMLElement
    el.querySelectorAll('style').forEach((s) => s.remove())
    const chu = el.textContent || ''
    // Chỉ bắt "con" đứng làm ĐẠI TỪ, không đụng "con số", "con đường".
    expect(chu).not.toMatch(/\b(cho|của|đề|Đề)\s+con\b/)
    expect(chu).not.toMatch(/\bcon\s+(vừa|đã|làm)\b/)
  })

  it('khối rút đề nhận được vai — không còn dựng mà bỏ trống tham số', () => {
    const fs = require('node:fs') as typeof import('node:fs')
    const path = require('node:path') as typeof import('node:path')
    const ma = fs.readFileSync(path.join(process.cwd(), 'src/screens/PhieuScreen.tsx'), 'utf8')
    expect(ma).toContain('<NutXemDeDaLam du={du} laCuaEm={laCuaEm} />')
    expect(ma).not.toContain('<NutXemDeCuaCon du={du} />')
  })
})
