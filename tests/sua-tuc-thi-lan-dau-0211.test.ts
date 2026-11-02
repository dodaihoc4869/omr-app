// Thầy 02/11 khuya: «khi lần đầu bấm vào app chỗ đó thì nó load 1 tý, sau đó thoát ra bấm lại thì ko bị nữa, tôi muốn bạn sửa triệt để chỗ đó cẩn tải gì về
// sẵn tải luôn nhé. chỗ đó bấm vào phải tức thì» (ảnh: khung sửa câu trống — Suspense chờ mảnh khung Duo).
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const doc = (p: string) => fs.readFileSync(path.join(__dirname, '..', p), 'utf8')

describe('Tự sửa lỗi tức thì ngay lần bấm đầu', () => {
  it('mảnh ManTuChua vừa nạp (Hôm nay nạp ngay khi hiện) ⇒ lúc rảnh nạp luôn màn sửa câu + khung Duo', () => {
    const s = doc('src/components/hoc-tap/ManTuChua.tsx')
    expect(s).toMatch(/const napManSua = \(\): void => \{ void napManChua\(\)\.then\(\(m\) => m\.napKhungDuo\?\.\(\)\)/)
    expect(s).toMatch(/if \(ric\) ric\(napManSua, \{ timeout: 1500 \}\); else setTimeout\(napManSua, 300\)/)
  })
  it('mô-đun màn sửa đã về ⇒ vẽ thẳng, không qua khung chờ lazy', () => {
    const s = doc('src/components/hoc-tap/ManTuChua.tsx')
    expect(s).toMatch(/const \[ManChua_\] = useState\(\(\) => ManChuaDaNap \?\? ManChuaLuoi\)/)
    expect(s).toMatch(/<ManChua_\n/)
    expect(doc('src/components/chua-cau-sai/ChuaGon.tsx')).toMatch(/useState\(\(\) => khungDuoDaNap \?\? ChuaGonDuoLuoi\)/)
  })
  it('câu sửa đầu tiên mở sẵn sau 0,6 giây (không đợi 2,5 giây)', () => {
    expect(doc('src/components/hoc-tap/TrongHs.tsx')).toMatch(/setTimeout\(\(\) => mod\.napTruocCauSua\?\.\(token, tiepNap\), 600\)/)
  })
})
