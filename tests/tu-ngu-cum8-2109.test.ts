// TỪ NGỮ · CỤM 8 (thầy lệnh 21/09: "Thay toàn bộ từ Máy bằng A.I Đỗ Đại Học"; luật ở docs/CHUAN-TU-NGU-VA-GIAO-DIEN.md bảng A2):
// khi "Máy" là CHỦ NGỮ làm việc tự động (gạch đáp án, soạn thẻ, gán bộ câu, chấm, rút chuyên đề) ⇒ "A.I Đỗ Đại Học". KHÔNG đổi "máy" chỉ THIẾT BỊ
// (máy chủ, máy này, máy em…). Chỗ mơ hồ (bạn máy trong Đoàn, khoá bài ở ca kiểm tra…) do Boss quyết — chưa đổi, không khoá ở đây.
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const doc = (t: string) => readFileSync(resolve(__dirname, '..', t), 'utf8')
const CAP: [string, string, string][] = [
  ['src/game/than-thu-v2/DoanTiepSuc.tsx', 'A.I Đỗ Đại Học gạch một đáp án sai', 'Máy gạch một đáp án sai'],
  ['src/game/than-thu-v2/DoanTiepSuc.tsx', 'Thẻ do A.I Đỗ Đại Học soạn từ lời giải', 'Thẻ do máy soạn từ lời giải'],
  ['src/screens/PhieuScreen.tsx', 'Đúng bộ câu A.I Đỗ Đại Học đã gán riêng cho', 'Đúng bộ câu máy đã gán riêng cho'],
  ['src/screens/StudentPortalScreen.tsx', 'để A.I Đỗ Đại Học chấm điểm ngay', 'để máy chấm điểm ngay'],
  ['src/components/KhoiBaiLuyen.tsx', 'A.I Đỗ Đại Học rút đúng chuyên đề em vừa mất điểm', 'Máy rút đúng chuyên đề em vừa mất điểm'],
  ['src/components/KhoiLuyenKhacPhuc.tsx', 'bấm nộp và A.I Đỗ Đại Học chấm', 'bấm nộp và máy chấm'],
  ['src/components/KhungLoiGiaiGame.tsx', 'A.I Đỗ Đại Học tự giải ra một đáp án', 'Máy tự giải ra một đáp án'],
]
describe('cụm 8 · "Máy" làm chủ ngữ tự động ⇒ "A.I Đỗ Đại Học"', () => {
  for (const [tep, moi, cu] of CAP) {
    it(`${tep}: có "${moi}", hết "${cu}"`, () => {
      const s = doc(tep)
      expect(s).toContain(moi)
      expect(s).not.toContain(cu)
    })
  }
})
