// Thầy 02/11 tối: «Màn đăng nhập làm kính nhé, câu ngoài hôm nay tải sẵn hết. Tu luyện thôi ko phải gắn giám thị. Hiệu ứng kết thúc chặng sửa lỗi và
// kiểm tra ôn tập thay hiệu ứng mới nhé».
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import fs from 'node:fs'
import path from 'node:path'
import DangNhapHocSinh from '../src/screens/DangNhapHocSinh'

const doc = (p: string) => fs.readFileSync(path.join(__dirname, '..', p), 'utf8')
afterEach(() => { cleanup(); delete document.documentElement.dataset.trong })

const api = { dangNhap: (async () => ({ ok: false, error: '' })) as never, datMatKhau: (async () => ({ ok: false, error: '' })) as never }

describe('màn đăng nhập kính', () => {
  it('giao diện Trong / Kính: không dựng lời chào ẩn (thẻ <img> thần thú không còn tải ngầm)', () => {
    document.documentElement.dataset.trong = 'hs'
    const { container } = render(<DangNhapHocSinh api={api} onDangNhap={() => {}} logo={<span />} />)
    expect(container.querySelector('.bl-loi-chao')).toBeNull()
    expect(container.querySelector('img')).toBeNull()
    expect(container.querySelector('input#hs-sbd, input')).not.toBeNull()
  })
  it('kiểu kính: nền loang + thẻ bán trong + nút chàm; không làm mờ nền ở màn đầu tiên; màu cũ giữ nguyên ở khối trên', () => {
    const css = doc('src/styles/trong-hs-dang-nhap.css')
    expect(css).toMatch(/html\[data-trong='hs'\] \.bl-login\{[^}]*radial-gradient/)
    expect(css).toMatch(/\.bl-login__card\{[^}]*color-mix\(in oklab,var\(--tr-mat\) 66%,transparent\)/)
    expect(css).toMatch(/--tr-chinh-nut:var\(--k\)/)
    expect(css).not.toMatch(/backdrop-filter\s*:/)
    expect(css).toContain("[data-trong='hs'] .bl-login{background:var(--tr-nen)}")
    expect(css).not.toMatch(/#[0-9a-f]{3,8}\b/i)
  })
})

describe('hiệu ứng kết thúc chặng mới (bộ ăn mừng «chang»)', () => {
  it('Tự sửa lỗi: màn xong chặng bắn pháo giấy bộ chung quanh tiêu đề, nạp sẵn mảnh; hoa giấy cũ chỉ còn khi mảnh chưa nạp', () => {
    const s = doc('src/components/chua-cau-sai/ChuaGonDuo.tsx')
    expect(s).toMatch(/anMung\('chang', \{ goc: tieuXong\.current \}\)/)
    expect(s).toMatch(/<h1 ref=\{tieuXong\}>/)
    expect(s).toMatch(/napTruocAnMung\(\)/)
    expect(s).toMatch(/\{!anMungSanSang\(\) && <div className="duo-hoa"/)
  })
  it('Kiểm tra ôn tập: em tự nộp chặng / nộp bài ⇒ bắn; hết giờ tự chốt thì không', () => {
    const s = doc('src/components/hoc-tap/ManKiemTraCaNhan.tsx')
    expect(s).toMatch(/anMung\('chang',\{goc:/)
    expect(s).toMatch(/if\(conPhien\(lan\)\)\{ra\(\);if\(!auto\)setMung\(n=>n\+1\)\}/)
    expect(s).toMatch(/setKet\(await ketTu\(r\)\);ra\(\);setMung\(n=>n\+1\)/)
  })
})

describe('câu ngoài phần hôm nay tải sẵn', () => {
  it('mở «Tất cả câu cần sửa» ⇒ luôn có 12 câu kế tiếp tải sẵn (một lượt gon-mo-ngay), câu dùng xong thì câu sau vào thay', () => {
    const s = doc('src/components/hoc-tap/ManTuChua.tsx')
    expect(s).toMatch(/onToggle=\{n === 'can' \? \(e\) => setMoTatCa\(e\.currentTarget\.open\)/)
    expect(s).toMatch(/d\.nhom === 'can' && !d\.m\.kiemHoiThay && !coSuaNgay\(d\.m\.qid\)\)\.slice\(0, 12\)/)
    expect(s).toMatch(/napTruocSuaNgay\(token, ngoaiNgay\.split\('\|'\)\)/)
    // đã sửa đủ hôm nay ⇒ danh sách ẩn ⇒ không tải
    expect(s).toMatch(/const ngoaiNgay = moTatCa && !daDuHomNay/)
  })
})
