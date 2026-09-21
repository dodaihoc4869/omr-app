// BỘ MÔ PHỎNG TỰ KIỂM BTVN NÂNG ĐỠ (`scripts/mo-phong-btvn.mjs`, Code 1, 21/09/2026): giữ cho công cụ KHÔNG mục theo lõi — đổi chữ ký của
// `btvn-nang-do.ts` / `btvn-nang-do-lich.ts` mà quên sửa công cụ thì test này đỏ. Chạy nhỏ (30 em, 1 bài) để nhanh; bản đầy đủ: `npm run mo-phong:btvn`.
import { describe, expect, it } from 'vitest'
import { spawnSync } from 'node:child_process'
import { join } from 'node:path'

const KICH_BAN = join(process.cwd(), 'scripts', 'mo-phong-btvn.mjs')
const chay = (...doi: string[]) => spawnSync(process.execPath, [KICH_BAN, ...doi], { encoding: 'utf8', timeout: 120_000 })
const NHO = ['--bai', '78x16', '--em', '30']

describe('scripts/mo-phong-btvn.mjs', () => {
  it('chạy được một lệnh, mọi phép kiểm xanh, thoát mã 0, in bảng + dấu vân tay', () => {
    const r = chay(...NHO)
    expect(r.status, r.stdout + r.stderr).toBe(0)
    expect(r.stdout).toContain('KẾT LUẬN: ĐẠT')
    expect(r.stdout).toMatch(/Dấu vân tay bộ \+ lịch: [0-9a-f]{10}/)
    expect(r.stdout).toContain('BÀI 78×')
    for (const cot of ['bắt buộc nhỏ·giữa·lớn', 'thử sức giữa·lớn', 'chỉ lõi', 'chặng lớn nhất', 'yếu thiếu']) expect(r.stdout).toContain(cot)
    expect(r.stdout).not.toContain('✗')
  })

  it('TẤT ĐỊNH: cùng tham số ⇒ cùng dấu vân tay; đổi seed ⇒ đổi dấu vân tay', () => {
    const vanTay = (...a: string[]) => /Dấu vân tay bộ \+ lịch: ([0-9a-f]{10})/.exec(chay(...a).stdout)?.[1]
    const a = vanTay(...NHO)
    expect(a).toBeTruthy()
    expect(vanTay(...NHO)).toBe(a)
    expect(vanTay(...NHO, '--seed', '7')).not.toBe(a)
  })

  it('--json: bảng có 2 hạn × 4 thời điểm mở, đủ 9 phép kiểm, 0 vi phạm', () => {
    const r = chay(...NHO, '--json')
    expect(r.status, r.stderr).toBe(0)
    const j = JSON.parse(r.stdout)
    expect(j.bang).toHaveLength(8)
    expect(Object.keys(j.loi)).toHaveLength(9)
    expect(Object.values(j.loi as Record<string, { n: number }>).every((x) => x.n === 0)).toBe(true)
    for (const dong of j.bang) {
      expect(dong.batBuoc[0]).toBeLessThanOrEqual(dong.batBuoc[1])
      expect(dong.batBuoc[1]).toBeLessThanOrEqual(dong.batBuoc[2])
      expect(dong.dai + dong.ngan).toBe(dong.em)
    }
  })

  it('tham số sai bị từ chối bằng lời, không chạy im lặng', () => {
    expect(chay('--bai', '10x20').status).not.toBe(0) // số dạng > số câu
    expect(chay('--han', '25').status).not.toBe(0)
    expect(chay('--giao', 'hôm nay').status).not.toBe(0)
  })
})
