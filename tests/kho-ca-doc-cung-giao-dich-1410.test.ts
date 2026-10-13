// Khoá và bank phải thuộc cùng một bản chụp khi tab khác đang thay kho ca.
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { TeacherExamSource } from '../src/data/examContent'

const kho = vi.hoisted(() => ({ rows: new Map<string, unknown>(), hong: false }))
vi.mock('idb', () => ({
  openDB: async () => ({
    transaction: () => {
      const snapshot = new Map(kho.rows)
      return {
        objectStore: () => ({
          getAllKeys: async () => {
            // Tab khác xoá ca sau khi đã lấy khoá. Bank trong giao dịch này
            // vẫn phải khớp khoá trước khi xoá, không ghép với bank ca khác.
            kho.rows.delete('111111')
            return [...snapshot.keys()]
          },
          getAll: async () => [...snapshot.values()],
        }),
        done: kho.hong ? Promise.reject(new Error('Giao dịch bị huỷ')) : Promise.resolve(),
      }
    },
  }),
}))
import { loadAllSessionTeacherBanks } from '../src/lib/exam-db'

const source = (maDe: string) => ({ maDe, phanI: [], phanII: [], phanIII: [] }) as TeacherExamSource
beforeEach(() => { kho.rows.clear(); kho.hong = false })

describe('đọc bank ca nguyên tử', () => {
  it('giữ đúng maCa → bank kể cả ca bị xoá ở tab khác; giữ cả bank rỗng', async () => {
    kho.rows.set('111111', [source('D1')])
    kho.rows.set('222222', [source('D2')])
    kho.rows.set('333333', [])
    expect(await loadAllSessionTeacherBanks()).toEqual([
      { maCa: '111111', sources: [source('D1')] },
      { maCa: '222222', sources: [source('D2')] },
      { maCa: '333333', sources: [] },
    ])
    expect(await loadAllSessionTeacherBanks()).toEqual([
      { maCa: '222222', sources: [source('D2')] },
      { maCa: '333333', sources: [] },
    ])
  })

  it('kho trống trả rỗng; giao dịch hỏng báo lỗi để không chấm bằng bank thiếu', async () => {
    expect(await loadAllSessionTeacherBanks()).toEqual([])
    kho.rows.set('111111', [source('D1')])
    kho.hong = true
    await expect(loadAllSessionTeacherBanks()).rejects.toThrow('Giao dịch bị huỷ')
    kho.hong = false
    kho.rows.set('111111', [source('D1-mới')])
    expect(await loadAllSessionTeacherBanks()).toEqual([{ maCa: '111111', sources: [source('D1-mới')] }])
  })
})
