// @vitest-environment node
// "Luyện nâng cao / Thử sức ngay": cổng học tập chọn câu và nộp bài qua máy chủ, máy em không nạp kho đáp án.
// (27/10: bộ chọn câu thử thách tại máy `lib/thu-thach-chon-cau` đã gỡ vì không màn nào dùng — các phép kiểm hợp khối của nó bỏ theo.)
import { readFileSync as docHocTap } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('cổng học tập Thử sức ngay', () => {
  it('cổng học tập chọn và nộp qua máy chủ, không nạp kho đáp án tại máy',()=>{const c=docHocTap('src/components/hoc-tap/ManLamBaiTap.tsx','utf8');expect(c).toContain("goiHoa2('hoc-tap-start'");expect(c).toContain("goiHoa2('answer'");expect(c).not.toContain('loadExamSources');expect(c).toContain('localStorage.setItem(khoa, v)')})
})
