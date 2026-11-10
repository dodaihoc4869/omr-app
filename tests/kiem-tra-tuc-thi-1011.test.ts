// @vitest-environment node
// «KIỂM TRA» TỨC THÌ (thầy 10/11 «app bấm kiểm tra không hiện tức thì, xem phần nào chưa tải, tải sẵn mọi thứ»): nút «Kiểm tra» ở thanh dưới mở màn vào ca
// (PhongVaoThi + VaoThiForm, mảnh khối phụ cong-hs-nap-luoi). Trước: mảnh này nạp CUỐI hàng nạp trước (sau cả màn thi ~100 KB) ⇒ em bấm sớm thì React treo màn
// chờ + giữ thêm 300 ms. Khoá: (1) mảnh khối phụ nạp ĐẦU hàng, song song các màn học, màn thi nạp sau; (2) bấm «Kiểm tra» ⇒ đợi mảnh (đã tải sẵn ⇒ vài ms)
// rồi mới mở tab ⇒ veNgayKhiCo vẽ thẳng, không qua Suspense.
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const src = readFileSync('src/screens/StudentPortalScreen.tsx', 'utf8')

describe('«Kiểm tra» ở thanh dưới hiện tức thì', () => {
  it('hàng nạp trước lúc rảnh: mảnh khối phụ đứng đầu, màn thi nạp SAU (không chặn mảnh vào ca)', () => {
    expect(src).toMatch(/Promise\.all\(\[napKhoiPhu\(\), napManLamBaiTap\(\), napManTuChua\(\), napManKiemTra\(\), napManCauDaLam\(\), napManTuLuyen\(\)\]\)\.then\(\(\) => boNapExam\(\)\)/)
    expect(src).not.toMatch(/then\(\(\) => boNapExam\(\)\)\.then\(\(\) => \{ if \(!huy\) return napKhoiPhu\(\) \}\)/)
  })
  it('bấm «Kiểm tra»: đợi mảnh khối phụ rồi mới mở tab vào ca (lỗi tải vẫn mở — màn báo lỗi như cũ)', () => {
    expect(src).toMatch(/onThi=\{\(\) => \{ void boNapExam\(\)\.catch\(\(\) => \{\}\); const f = \(\) => setTab\('vaothi'\); void napKhoiPhu\(\)\.then\(f, f\)/)
  })
  it('màn vào ca vẫn dùng veNgayKhiCo (mảnh đã có ⇒ vẽ thẳng, không React.lazy treo)', () => {
    expect(src).toMatch(/const PhongVaoThi = khoiPhu\('PhongVaoThi'\)/)
    expect(src).toMatch(/const VaoThiForm = khoiPhu\('VaoThiForm'\)/)
    expect(src).toMatch(/return veNgayKhiCo\(lazy\(bo\), bo\)/)
  })
})
