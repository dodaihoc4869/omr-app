// @vitest-environment jsdom
// KHOÁ NGUYÊN NHÂN GỐC lỗi thầy báo 12/10: "học sinh báo app học sinh không vuốt lên được" — phần KHUNG CHUNG của cổng học sinh
// (màn làm câu đã viết lại ở làn 12/10D; tệp này không đụng ManLamBaiTap / khối .ht2-lam-*).
// Đo bằng chạm thật (scripts/kiem-vuot-hs.mjs): màn con là lớp `fixed inset-0 overflow-y-auto` phủ lên trang Hôm nay VẪN cuộn được ⇒ câu ngắn
// (lớp phủ chưa tràn) vuốt 0 px trên màn, 511 px ở trang ẩn; câu dài cuộn hết thì 322–368 px trôi xuống trang ẩn. Thanh trên Hôm nay rộng 393px
// ⇒ Chrome điện thoại nới khung nhìn (390×844 → 393×851, 360×800 → 393×874): lớp phủ và thanh đáy dài quá mép dưới màn, nút "Nộp câu" ở máy
// 360px lọt ra ngoài màn. Các phép dưới đây giữ từng chốt sửa.
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import postcss, { type AtRule, type Rule } from 'postcss'
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, renderHook } from '@testing-library/react'
import { THUOC_TINH_KHOA_CUON, useKhoaCuonTrang } from '../src/lib/khoa-cuon-trang'

afterEach(() => { cleanup(); document.documentElement.removeAttribute(THUOC_TINH_KHOA_CUON); document.body.style.overflow = '' })
const doc = (p: string) => readFileSync(resolve(__dirname, '..', p), 'utf8')

/** Khai báo CUỐI (thứ tự trong tệp) của `thuocTinh` cho đúng bộ chọn; `dieuKien` rỗng ⇒ quy tắc ngoài @media, khác rỗng ⇒ trong @media chứa chuỗi đó. */
function giaTriCuoi(css: string, boChon: string, thuocTinh: string, dieuKien = ''): string | undefined {
  let v: string | undefined
  postcss.parse(css).walkRules((r: Rule) => {
    const m = r.parent?.type === 'atrule' ? (r.parent as AtRule).params.replace(/\s+/g, '') : ''
    if (dieuKien ? !m.includes(dieuKien) : m !== '') return
    if (!r.selectors.map((s) => s.replace(/\s+/g, ' ').trim()).includes(boChon)) return
    r.walkDecls(thuocTinh, (d) => { v = d.value.replace(/\s+/g, '') })
  })
  return v
}

describe('màn con mở ⇒ trang Hôm nay phía sau KHÔNG nhận cú vuốt', () => {
  it('useKhoaCuonTrang gắn/gỡ thuộc tính khoá trên <html> theo trạng thái màn con', () => {
    const { rerender, unmount } = renderHook(({ bat }) => useKhoaCuonTrang(bat), { initialProps: { bat: false } })
    expect(document.documentElement.hasAttribute(THUOC_TINH_KHOA_CUON)).toBe(false)
    rerender({ bat: true })
    expect(document.documentElement.hasAttribute(THUOC_TINH_KHOA_CUON)).toBe(true)
    rerender({ bat: false })
    expect(document.documentElement.hasAttribute(THUOC_TINH_KHOA_CUON)).toBe(false)
    rerender({ bat: true })
    unmount()
    expect(document.documentElement.hasAttribute(THUOC_TINH_KHOA_CUON)).toBe(false)
  })
  it('không giẫm khoá body.style của lớp phủ khác (PhongVaoThi/KhungChua lưu–khôi phục) dù đóng mở lệch thứ tự', () => {
    // Lớp phủ khác (kiểu PhongVaoThi) MỞ TRƯỚC: lưu '' rồi khoá body.style.
    const cu = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const khoa = renderHook(({ bat }) => useKhoaCuonTrang(bat), { initialProps: { bat: true } })
    expect(document.body.style.overflow).toBe('hidden') // khoá trang không ghi đè body.style của lớp kia
    // Lớp kia ĐÓNG TRƯỚC (khôi phục '') trong khi màn con vẫn mở ⇒ trang vẫn khoá nhờ thuộc tính riêng.
    document.body.style.overflow = cu
    expect(document.documentElement.hasAttribute(THUOC_TINH_KHOA_CUON)).toBe(true)
    // Màn con đóng ⇒ không còn sót khoá nào: trang Hôm nay cuộn lại được.
    khoa.rerender({ bat: false })
    expect(document.body.style.overflow).toBe('')
    expect(document.documentElement.hasAttribute(THUOC_TINH_KHOA_CUON)).toBe(false)
  })
  it('index.css: thuộc tính khoá ⇒ body overflow hidden (lan lên khung nhìn) + chặn kéo-làm-mới', () => {
    const css = doc('src/index.css')
    expect(giaTriCuoi(css, 'html[data-khoa-cuon] body', 'overflow')).toBe('hidden')
    expect(giaTriCuoi(css, 'html[data-khoa-cuon]', 'overscroll-behavior')).toBe('none')
  })
  it('cổng học sinh dùng khoá cho MỌI màn con và lớp phủ làm câu / Tự chữa / sheet cũ chặn cuộn dây chuyền', () => {
    const cong = doc('src/screens/StudentPortalScreen.tsx')
    expect(cong).toMatch(/useKhoaCuonTrang\(dangMoManCon\)/)
    expect(cong).toMatch(/const dangMoManCon =\s+tab !== null \|\| dangLamMom !== null \|\| manThi/)
    expect(cong).toMatch(/tab === 'hoctap'[^\n]*className="fixed inset-0 z-50 overflow-y-auto overscroll-contain"/)
    expect(cong).toMatch(/tab === 'tuchua'[^\n]*className="fixed inset-0 z-50 overflow-y-auto overscroll-contain"/)
    expect(cong).toMatch(/fixed inset-0 z-50 bg-slate-50 dark:bg-slate-950 overflow-y-auto overscroll-contain/)
    // các màn con dựng bằng khungManCon đã có sẵn chặn dây chuyền — giữ nguyên
    expect(cong).toMatch(/overscrollBehavior: 'contain'/)
  })
})

describe('thanh trên Hôm nay không tràn ngang ⇒ khung nhìn không bị nới, lớp fixed không lọt khỏi mép dưới', () => {
  const css = doc('src/components/hoc-tap/hoc-tap.css')
  it('máy ≤ 420px: nút Vào ca kiểm tra co/xuống dòng được, các nút biểu tượng giữ ≥ 44px', () => {
    expect(giaTriCuoi(css, '.ht2-thanh .ht2-nut-thi', 'min-width', 'max-width:420px')).toBe('0')
    expect(giaTriCuoi(css, '.ht2-thanh .ht2-nut-thi', 'white-space', 'max-width:420px')).toBe('normal')
    expect(giaTriCuoi(css, '.ht2-thanh .ht2-thanh-phai', 'min-width', 'max-width:420px')).toBe('0')
    expect(giaTriCuoi(css, '.ht2-thanh .ht2-thanh-phai>:not(.ht2-nut-thi)', 'flex-shrink', 'max-width:420px')).toBe('0')
    expect(giaTriCuoi(css, '.ht2-thanh .ht-nut-bieu-tuong', 'width', 'max-width:420px')).toBe('44px')
  })
  it('app Hôm nay cắt phần tràn ngang bằng clip (không tạo hộp cuộn lồng)', () => {
    expect(giaTriCuoi(css, '.ht-app.ht2', 'overflow-x')).toBe('clip')
  })
})

describe('Phòng chờ: bàn chơi không nuốt cú vuốt dọc', () => {
  it('Đấu Nguyên Tử (30/10): thẻ Sảnh đấu trong phòng chờ KHÔNG có vùng nuốt cú vuốt; chỉ màn trận (phủ kín khung nhìn) mới khoá chạm', () => {
    const css = doc('src/components/phong-cho/ban-nguyen-to.css')
    // Ảnh bìa ở sảnh là canvas thường (không touch-action: none) ⇒ vuốt dọc vẫn cuộn phòng chờ.
    expect(giaTriCuoi(css, '.di-bia canvas', 'touch-action')).toBeUndefined()
    // Cần điều khiển + sân chỉ nằm trong màn trận cố định (.di-man) — màn này không cuộn, có overscroll-behavior: contain.
    expect(giaTriCuoi(css, '.di-can', 'touch-action')).toBe('none')
    expect(giaTriCuoi(css, '.pc-room.di-man', 'position')).toBe('fixed')
    expect(giaTriCuoi(css, '.pc-room.di-man', 'overscroll-behavior')).toBe('contain')
  })
})
