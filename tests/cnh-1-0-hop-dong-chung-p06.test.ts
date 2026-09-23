// @vitest-environment node
// P06/T42 — KHÔNG SÓT ĐƯỜNG GỌI: mọi đường PHÁT CÂU trong worker phải hoặc đi hợp đồng chung
// (engine §7.1 / bộ điều phối ngày) hoặc là NGOẠI LỆ CÓ TÊN (thi/ca · giáo viên · kênh cũ).
// Test đối chiếu HAI CHIỀU với `server/src/index.ts` để danh sách không trôi khỏi mã.
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  CO_DUONG_PHAT_CAU, DUONG_PHAT_CAU, HOP_DONG, kiemMotDuong, laDuongPhatCau, traDuong,
} from '../server/src/hop-dong-chung'

const INDEX = readFileSync('server/src/index.ts', 'utf8')

/** Mọi `p === '<path>'` / `p.startsWith('<path>')` trong worker. */
function duongTrongWorker(): string[] {
  const ra = new Set<string>()
  for (const m of INDEX.matchAll(/p === '([^']+)'/g)) ra.add(m[1]!)
  for (const m of INDEX.matchAll(/p\.startsWith\('([^']+)'\)/g)) ra.add(m[1]!)
  return [...ra]
}

describe('P06/T42 — hợp đồng chung cho mọi đường phát câu', () => {
  it('mỗi đường khai trong danh sách PHẢI có thật trong `index.ts` (danh sách không trôi)', () => {
    const co = new Set(duongTrongWorker())
    for (const d of DUONG_PHAT_CAU) {
      const khop = [...co].some((p) => (d.tienTo ? p === d.path || p.startsWith(d.path) : p === d.path))
      expect(khop, `không thấy đường ${d.path}`).toBe(true)
    }
  })

  it('KHÔNG SÓT: mọi đường phát câu trong worker đều đã khai + ngoại lệ có TÊN', () => {
    const phatCau = duongTrongWorker().filter((p) => laDuongPhatCau(p))
    expect(phatCau.length).toBeGreaterThan(0)
    const sot: string[] = []
    for (const p of phatCau) {
      const k = kiemMotDuong(p)
      if (k.lyDo !== 'ok') sot.push(`${p} (${k.lyDo})`)
    }
    expect(sot).toEqual([])
  })

  it('đường đi ENGINE khai ĐỦ 6 phần hợp đồng; ngoại lệ phải nêu tên + phạm vi', () => {
    for (const d of DUONG_PHAT_CAU) {
      if (d.cach === 'engine') expect([...d.hopDong].sort()).toEqual([...HOP_DONG].sort())
      if (d.cach === 'ngoai_le') {
        expect(String(d.ngoaiLeTen ?? '').trim().length).toBeGreaterThan(0)
        expect(String(d.ghiChu ?? '').trim().length).toBeGreaterThan(0)
      }
    }
  })

  it('tra đường: khớp tiền tố đúng, KHÔNG nhận đường lạ (không tự cho là đã nối)', () => {
    expect(traDuong('/game-v2/start')?.cach).toBe('engine')
    expect(traDuong('/game-v2')?.cach).toBe('engine')
    expect(traDuong('/luyen-de/cham')?.cach).toBe('ngoai_le')
    expect(traDuong('/duong-la-hoac')).toBeUndefined()
    expect(kiemMotDuong('/duong-la-hoac').lyDo).toBe('chua_khai')
  })

  it('MỌI cờ ảnh hưởng đường phát câu đều được khai (T42: tắt AI vẫn học được)', () => {
    const co = Object.keys(CO_DUONG_PHAT_CAU).sort()
    expect(co).toEqual(['cau_snapshot', 'nang_luc_v1', 'ngan_sach_luot', 'pham_vi_hoc', 'quyen_toan_chuong_trinh'])
    // Cờ nào cũng phải có MÔ TẢ (nói rõ cờ làm gì ⇒ tắt là về hành vi cũ).
    for (const [k, v] of Object.entries(CO_DUONG_PHAT_CAU)) expect(String(v).length).toBeGreaterThan(10)
  })
})
