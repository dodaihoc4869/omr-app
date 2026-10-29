// @vitest-environment node
// MÁY CHỦ KHÔNG CHẶN MỞ CHẶNG VÌ TỰ SỬA LỖI (thầy 29/10 20:15, ảnh em 12018: Lộ trình cho bấm BẮT ĐẦU chặng 1, «Tự sửa lỗi ✓ · Sửa 2 lỗi cũ 2/2», mà mở chặng báo «Em sửa xong lỗi hôm nay
// rồi mới mở chặng tiếp nhé» — «sửa luôn đi để học sinh còn làm, triệt để, không được phép có lỗi này nữa»). Ba lần liền (28/10 19:55 · 29/10 06:10 · 29/10 20:15) máy chủ chặn lệch một nhịp so với
// Lộ trình ⇒ em kẹt. Khoá «sửa xong mới tới chặng sau» CHỈ còn ở Lộ trình. Khoá: mã nguồn máy chủ không còn phát `TU_SUA_TRUOC` ở lệnh mở chặng / làm lại.
import fs from 'node:fs'
import { expect, it } from 'vitest'

it('game-v2.ts không còn đọc khoá Tự sửa lỗi lúc mở chặng và không trả TU_SUA_TRUOC', () => {
  const ma = fs.readFileSync('server/src/game-v2.ts', 'utf8')
  expect(ma).not.toMatch(/MA_TU_SUA_TRUOC|CHU_TU_SUA_TRUOC|LENH_KHOA_SUA|docConPhanKhoa|giu\.khoaSua/)
})
