// LIVE THEO KHỐI — xếp hạng đội + ngôi sao buổi học cho màn vinh danh (thuần, không DOM).
import { DOI_BPU } from '../bpu/phong'
import type { NguoiLop } from './kieu'

/** Xếp hạng bốn đội theo kJ (cao trước; bằng nhau ⇒ cùng hạng). Chỉ tính đội có em. THUẦN. */
export function xepHangDoi(ds: readonly NguoiLop[], kj: readonly number[]): { doi: number; kj: number; soEm: number; hang: number }[] {
  const co = DOI_BPU.map((_, d) => ({ doi: d, kj: Math.round(kj[d] ?? 0), soEm: ds.filter((e) => e.doi === d).length })).filter((x) => x.soEm > 0)
  co.sort((a, b) => b.kj - a.kj || a.doi - b.doi)
  return co.map((x) => ({ ...x, hang: 1 + co.findIndex((y) => y.kj === x.kj) }))
}
/** Ba em nhiều kJ nhất buổi (bỏ em 0 kJ). THUẦN. */
export function saoBuoi(ds: readonly NguoiLop[]): NguoiLop[] {
  return ds.filter((e) => (e.kj ?? 0) > 0).sort((a, b) => (b.kj ?? 0) - (a.kj ?? 0) || a.ten.localeCompare(b.ten, 'vi')).slice(0, 3)
}
