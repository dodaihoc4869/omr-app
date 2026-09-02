import { describe, it, expect } from 'vitest'
import { chonDeCanTai } from '../src/lib/exam-sync'
import type { TeacherExamSource } from '../src/data/examContent'
import type { KhoDeItem } from '../src/lib/exam-api'

const item = (maDe: string, ngayNap: string): KhoDeItem => ({ maDe, ngayNap, nguon: '', soCau: 28, soNghi: 0, capNhatLuc: '' })
const local = (maDe: string, ngayNap?: string): TeacherExamSource => ({ maDe, phanI: [], phanII: [], phanIII: [], ngayNap })

describe('chonDeCanTai — chỉ tải đề mới hoặc đã đổi', () => {
  it('đề chưa có local -> mới; ngayNap khác -> cập nhật; giống -> bỏ qua', () => {
    const tren = [item('100', '2026-09-02'), item('101', '2026-09-01'), item('102', '2026-09-03')]
    const co = [local('101', '2026-09-01'), local('102', '2026-08-30')]
    const { moi, capNhat } = chonDeCanTai(tren, co)
    expect(moi.map((x) => x.maDe)).toEqual(['100'])
    expect(capNhat.map((x) => x.maDe)).toEqual(['102'])
  })
})
