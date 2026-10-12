// @vitest-environment node
// Thầy 12/10: "Cho hs bấm vào bảng lười chăm. Khi bấm vào hiển thị đủ hồ sơ như trong nhịp học nhé".
// Khoá chỗ NỐI ở cổng học sinh: thẻ "Hôm nay của em" (HocTapHomNay › TheHomNayEm, prop `onMoHoSo`) ⇒ tấm `HoSoCuaEmHs` (nạp lười) với token của em.
// Phần thẻ và phần tấm có test riêng (the-hom-nay-em…, ho-so-em-hs-ui-1210f) — ở đây chỉ chắc hai đầu đã được nối.
import { readFileSync } from 'node:fs'
import { expect, it } from 'vitest'

const src = readFileSync(new URL('../src/screens/StudentPortalScreen.tsx', import.meta.url), 'utf8')

it('cổng học sinh nạp lười tấm HoSoCuaEmHs (không nằm trong mảnh chính)', () => {
  expect(src).toMatch(/const HoSoCuaEmHs = lazy\(\(\) => import\('\.\.\/components\/hoc-tap\/HoSoCuaEmHs'\)\)/)
  expect(src).not.toMatch(/^import HoSoCuaEmHs/m)
})

it('thẻ Hôm nay nhận onMoHoSo; bấm ⇒ mở tấm với token của em, Đóng ⇒ tắt', () => {
  expect(src).toMatch(/onMoHoSo=\{\(\) => setMoHoSoEm\(true\)\}/)
  expect(src).toMatch(/\{moHoSoEm && auth\.token && tab === null && !manThi && <Suspense fallback=\{null\}><HoSoCuaEmHs token=\{auth\.token\}/)
  expect(src).toMatch(/onDong=\{\(\) => setMoHoSoEm\(false\)\}/)
})

// ĐỢT 16 (thầy: "chỗ các câu học sinh chưa chữa đc bấm vào phải nảy vào đúng chỗ tự sửa"): hộp câu chưa sửa trong hồ sơ ⇒ đóng hồ sơ, mở Tự chữa đúng câu.
it('hồ sơ ⇒ Tự chữa đúng câu: onChuaCau đóng hồ sơ, đặt câu cần chữa, sang màn Tự chữa', () => {
  expect(src).toMatch(/onChuaCau=\{\(qid\) => \{ setMoHoSoEm\(false\); setQidChua\(qid\); setTab\('tuchua'\) \}\}/)
  expect(src).toMatch(/<ManTuChua token=\{auth\.token\} qid=\{qidChua\}/)
})
