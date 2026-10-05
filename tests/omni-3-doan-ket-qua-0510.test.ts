// @vitest-environment node
// OMNI 3 (điều phối 05/10) — `doan-nop`: kết quả câu của Đoàn chuyển NGUYÊN phần `omni` của `answer` nội bộ ra máy em (dòng nhắn dưới kết quả:
// đúng nhưng chậm / chưa chắc / chắc mà sai / lướt). Vắng `omni` (công tắc tắt) ⇒ kết quả y hệt hôm nay, không có khoá `omni`.
import { describe, expect, it } from 'vitest'
import { ketQuaCau } from '../server/src/game-v2-doan'

const GOC = { correct: false, answer: 'B', solution: { chot: 'Cốt lõi' }, solutionImages: [], reward: 0, stage: 1, attempt: { assisted: false } }

describe('ketQuaCau (Đoàn) — phần OMNI', () => {
  it('có omni ⇒ chuyển nguyên; vắng omni ⇒ không khoá omni, các trường cũ y hệt', () => {
    const omni = { nhanTocDo: 'cham', msLam: 200_000, msKyVong: 90_000, luot: false, chacMaSai: false, loiNhan: 'Đúng nhưng chậm …' }
    const co = ketQuaCau({ ...GOC, omni })
    expect(co.omni).toEqual(omni)
    const khong = ketQuaCau(GOC)
    expect('omni' in khong).toBe(false)
    const { omni: _bo, ...conLai } = co as Record<string, unknown>
    void _bo
    expect(conLai).toEqual(khong)
  })
  it('omni không phải đối tượng ⇒ bỏ qua', () => {
    expect('omni' in ketQuaCau({ ...GOC, omni: 'x' })).toBe(false)
    expect('omni' in ketQuaCau({ ...GOC, omni: null })).toBe(false)
  })
})
