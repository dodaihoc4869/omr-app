// Ô "THI ĐUA HÔM NAY" (8A, thầy chốt 21/09; Boss soát mẫu 4 sửa): đọc chặt thân máy chủ; MẶC ĐỊNH GỌN (một hàng bục thu nhỏ, ảnh THÚ THẬT, dòng vị trí, nút, thẻ cam nhóm cuối LUÔN hiện);
// bấm tiêu đề ⇒ bản đầy đủ (nhớ trong phiên); em 0 câu ⇒ KHÔNG in hạng; hai nút dẫn tới việc CHƯA XONG đầu tiên (hết việc ⇒ Đảo thần thú); "vừa vượt lên" suy từ hai lần nạp liên tiếp, giữ 2 phút,
// chỉ nói bạn trong bục; làm mới 60 giây; thiếu lệnh/dữ liệu ⇒ KHÔNG có ô (Pages đi trước Worker được); không nêu tên ai chưa học; không emoji.
// 27/10: ô thi đua (`bang-nhiem-vu/OThiDua`, `lib/thi-dua`, `lib/use-thi-dua`, `lib/thi-dua-api`) đã gỡ khỏi src/ vì không màn nào dùng ⇒
// các phép kiểm đọc / vẽ / nhịp của ô bỏ theo; chỉ giữ chốt hai màn sống KHÔNG nối lại ô này.
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const doc = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8')

describe('khoá mã nguồn', () => {
  it('ô chỉ nằm ở app học sinh: StudentPortalScreen truyền, ParentPortalScreen KHÔNG gọi lệnh thi đua', () => {
    expect(doc('src/screens/StudentPortalScreen.tsx')).not.toMatch(/useThiDua\(/)
    expect(doc('src/screens/StudentPortalScreen.tsx')).not.toMatch(/thiDua=\{thiDua\}/)
    expect(doc('src/screens/ParentPortalScreen.tsx')).not.toMatch(/thi-dua|ThiDua/)
  })
})
