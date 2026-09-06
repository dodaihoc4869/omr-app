// GỠ ĐĂNG NHẬP BẰNG VÂN TAY — thầy chốt 06/09.
//
// Tính năng mở app bằng vân tay / khuôn mặt (WebAuthn PRF, MOBANGVANTAY.md) đã
// gỡ hẳn. Mật khẩu là đường vào duy nhất, đúng như trước khi có nó.
//
// File test này không kiểm "vân tay chạy đúng chưa" nữa — nó kiểm ĐÃ GỠ SẠCH,
// và quan trọng hơn: kiểm mật khẩu KHÔNG bị gỡ theo. Gỡ nhầm cả hai là thầy
// mất luôn đường vào app.
//
// CHÚ Ý TÊN TRÙNG: `src/components/VanTay.tsx` là VÂN TAY 4 GÓC in chìm lên màn
// làm bài (BAOMATCATHI mục 4.4) — một thứ hoàn toàn khác, KHÔNG được gỡ.
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const goc = resolve(__dirname, '..')
const doc = (f: string) => readFileSync(resolve(goc, f), 'utf8')
const co = (f: string) => existsSync(resolve(goc, f))

const MAN_LIEN_QUAN = ['src/App.tsx', 'src/screens/KhoaAppScreen.tsx', 'src/components/KhoiMatKhauApp.tsx', 'src/lib/exam-db.ts']

describe('đăng nhập bằng vân tay đã gỡ hẳn', () => {
  it('1. thư viện khoa-van-tay.ts không còn trên đĩa', () => {
    expect(co('src/lib/khoa-van-tay.ts')).toBe(false)
  })

  it('2. không màn nào còn import nó', () => {
    for (const f of MAN_LIEN_QUAN) expect(doc(f)).not.toContain('khoa-van-tay')
  })

  it('3. không còn lời gọi WebAuthn nào trong toàn bộ src', () => {
    // Đây là chỗ dễ sót nhất: gỡ giao diện mà quên gỡ lời gọi thì trình duyệt
    // vẫn bật hộp thoại sinh trắc lên giữa buổi dạy.
    for (const f of MAN_LIEN_QUAN) {
      const ma = doc(f)
      expect(ma).not.toContain('navigator.credentials')
      expect(ma).not.toContain('PublicKeyCredential')
    }
  })

  it('4. không hàm nào của bản ghi vân tay còn sống trong exam-db', () => {
    const db = doc('src/lib/exam-db.ts')
    expect(db).not.toContain('export async function loadKhoaVanTay')
    expect(db).not.toContain('export async function saveKhoaVanTay')
    expect(db).not.toContain('export async function goKhoaVanTay')
  })

  it('5. màn khoá app không còn trạng thái quét nào', () => {
    const man = doc('src/screens/KhoaAppScreen.tsx')
    expect(man).not.toContain('dang_quet')
    expect(man).not.toContain('quetVanTay')
    expect(man).not.toContain('banGhiVanTay')
  })

  it('6. màn Cài đặt không còn nút bật/gỡ vân tay', () => {
    const kh = doc('src/components/KhoiMatKhauApp.tsx')
    expect(kh).not.toContain('bamBatVanTay')
    expect(kh).not.toContain('bamGoVanTay')
    expect(kh).not.toContain('vaoBangVanTay')
  })

  // ------------------------------------------------------------------ MẬT KHẨU
  // Phần dưới mới là phần đáng lo: gỡ vân tay mà làm hỏng mật khẩu thì thầy
  // không vào được app nữa.

  it('7. MẬT KHẨU vẫn nguyên: đặt, mở, đổi, gỡ, quên đều còn', () => {
    const man = doc('src/screens/KhoaAppScreen.tsx')
    expect(man).toContain('datMatKhau')
    expect(man).toContain('moKhoa')
    expect(man).toContain('Mở app')
    // đường cứu khi quên mật khẩu — mã bí mật từ Apps Script
    expect(man).toContain('bamQuen')
    const kh = doc('src/components/KhoiMatKhauApp.tsx')
    expect(kh).toContain('doiMatKhau')
    expect(kh).toContain('goKhoaApp')
  })

  it('8. đổi mật khẩu LUÔN đòi mật khẩu hiện tại — nhánh miễn hỏi đã đi cùng vân tay', () => {
    const kh = doc('src/components/KhoiMatKhauApp.tsx')
    const dau = kh.indexOf('const bamDoi')
    const cuoi = kh.indexOf('const bamGo')
    expect(dau).toBeGreaterThan(0)
    expect(cuoi).toBeGreaterThan(dau)
    const than = kh.slice(dau, cuoi)
    expect(than).toContain('doiMatKhau(cu, moi, ghi)')
    expect(than).not.toContain('datMatKhau(')
  })

  it('9. đếm số lần nhập sai và thời gian chờ vẫn còn — đó là lớp chống dò', () => {
    // Soi TRONG THÂN `bamMo`, không soi cả file: `sauKhiSai` còn nằm ở dòng
    // import kể cả khi thân hàm đã thôi gọi nó, nên soi cả file là test giả.
    const man = doc('src/screens/KhoaAppScreen.tsx')
    const dau = man.indexOf('const bamMo = async () => {')
    const cuoi = man.indexOf('const bamQuen = async () => {')
    expect(dau).toBeGreaterThan(0)
    expect(cuoi).toBeGreaterThan(dau)
    const than = man.slice(dau, cuoi)
    expect(than).toContain('sauKhiSai(ghi)')
    expect(than).toContain('conChoGiay(sau)')
    expect(than).toContain('saveKhoaApp(sau)')
    // và chặn cứng khi đang trong thời gian chờ
    expect(than).toContain('if (choGiay > 0) return')
  })

  it('10. VÂN TAY 4 GÓC trên màn làm bài KHÔNG bị gỡ nhầm — tên trùng, việc khác', () => {
    expect(co('src/components/VanTay.tsx')).toBe(true)
    const vt = doc('src/components/VanTay.tsx')
    expect(vt).not.toContain('navigator.credentials')
  })
})
