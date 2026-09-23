import { describe, expect, it, vi } from 'vitest'

const store = vi.hoisted(() => new Map<string, unknown>())
vi.mock('idb', () => ({ openDB: async () => ({
  get: async (_table: string, key: string) => store.get(key),
  put: async (_table: string, value: unknown, key: string) => { store.set(key, value) },
}) }))
vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://fallback.test' }))

import { loadScriptUrl, saveScriptUrl } from '../src/lib/exam-db'

describe('review cấu hình URL giáo viên trên máy mới', () => {
  it('địa chỉ vừa lưu ở Cài đặt phải đọc lại đúng địa chỉ ấy', async () => {
    await saveScriptUrl('https://teacher-selected.test')
    expect(store.get('scriptUrl')).toBe('https://teacher-selected.test')
    expect(await loadScriptUrl()).toBe('https://teacher-selected.test')
  })
})
