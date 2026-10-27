// @vitest-environment node
// LUẬT TỐC ĐỘ 27/10 — mã chèn index.html (nap-truoc-man-em.ts) được NÉN lúc build (vite.config.ts, `minifySync` của Vite, đích safari14):
//   · hai hàm chèn bằng toString (chonMangNapTruoc, hoiSomSanh) sau khi nén cho CÙNG kết quả như bản gốc trên mọi đường dẫn mẫu;
//   · đoạn mã chèn có `gon` vẫn là JS hợp lệ, khung ngoài `var b=…;var nap=` giữ nguyên văn (kiem-toc-do-tai.mjs đọc bảng nạp bằng mẫu này);
//   · không có `gon` ⇒ y bản cũ (test khác gọi taoMaNapTruoc(bang) như trước).
import { describe, expect, it } from 'vitest'
import { minifySync } from 'vite'
import { chonMangNapTruoc, hoiSomSanh, taoMaNapTruoc } from '../src/lib/nap-truoc-man-em'

// Cùng cách nén với vite.config.ts (plugin nap-truoc-man-em).
const gon = (ham: string): string => {
  const r = minifySync('nap-truoc.js', `var __h=${ham}`, { compress: { target: ['es2020', 'safari14'] }, mangle: true })
  const m = /^var __h=([\s\S]*?);?\s*$/.exec(r.code)
  if (r.errors.length || !m) throw new Error('nén hỏng')
  return m[1]!
}

describe('nén mã chèn index.html', () => {
  it('chonMangNapTruoc nén: ngắn hơn hẳn, cùng kết quả trên mọi đường mẫu', () => {
    const goc = chonMangNapTruoc.toString()
    const nen = gon(goc)
    expect(nen.length).toBeLessThan(goc.length * 0.75)
    const f = new Function(`return (${nen})`)() as typeof chonMangNapTruoc
    const mau: [string, string][] = [
      ['/', ''], ['/gv', ''], ['/hs', ''], ['/hs/', ''], ['/HocSinh', ''], ['/ph', ''], ['/phu-huynh/', ''], ['/p', ''], ['/t/123456', ''], ['/d/1234', ''],
      ['/', '?vai=hs'], ['/', '?vai=phieu'], ['/', '?vai=gv'], ['/', '?vai=ph'], ['/', '?vai=diem'], ['/', '?examCode=123'], ['/hs/abcdefgh12', ''],
      ['/ph/abcdefgh12', ''], ['/hs%20', ''], ['/t/12', ''], ['/omr-app/hs', ''], ['/hs.', ''],
    ]
    for (const [d, q] of mau) expect(f(d, q)).toBe(chonMangNapTruoc(d, q))
  })

  it('hoiSomSanh nén vẫn là hàm hợp lệ; đoạn mã chèn có gon chạy được, khung bảng nạp giữ nguyên văn', () => {
    expect(typeof new Function(`return (${gon(hoiSomSanh.toString())})`)()).toBe('function')
    const bang = { thi: ['/assets/a.js'], hs: ['/assets/b.js'], ph: [], app: ['/assets/c.js'], hsVo: ['/assets/d.js'] }
    const ma = taoMaNapTruoc(bang, gon)
    expect(() => new Function(ma)).not.toThrow()
    expect(ma).toMatch(/var b=(\{.*?\});var (?:v|nap)=/s)
    expect(ma.length).toBeLessThan(taoMaNapTruoc(bang).length)
    expect(taoMaNapTruoc(bang)).toContain(chonMangNapTruoc.toString())
  })
})
