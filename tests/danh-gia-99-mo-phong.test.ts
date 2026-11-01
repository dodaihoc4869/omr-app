// @vitest-environment node
// TỰ ĐO ĐỘ CHÍNH XÁC ĐÁNH GIÁ 4 BẢNG v2 (thầy 01/11: «tự đo tự làm tất tự tối ưu và phải đạt 99%»).
// Thước: học sinh MÔ PHỎNG có đáp án (tests/_mo-phong-hoc-sinh.ts — 14 kiểu, gồm các kiểu dễ bị xếp oan). Với mỗi bảng:
//   ĐỘ CHÍNH XÁC = số em app xếp vào bảng mà đúng kiểu / số em app xếp vào bảng — PHẢI ≥ 99% ở cả 4 bảng, trên 3 hạt ngẫu nhiên khác nhau.
//   ĐỘ PHỦ (kiểu «phải có» được xếp đúng) — in ra, chặn dưới để không «an toàn» bằng cách không xếp ai.
import { describe, expect, it } from 'vitest'
import { tinhBon } from '../server/src/bon-chi-so'
import { CAC_KIEU, NHAN, taoEm, taoRng, type Kieu } from './_mo-phong-hoc-sinh'
import type { MaBang } from '../src/lib/bon-bang-kieu'

const BANG: MaBang[] = ['ht', 'dp', 'ch', 'lu']
export function doMotHat(hat: number, moiKieu: number) {
  const r = taoRng(hat)
  const vao: Record<MaBang, { dung: number; sai: number }> = { ht: { dung: 0, sai: 0 }, dp: { dung: 0, sai: 0 }, ch: { dung: 0, sai: 0 }, lu: { dung: 0, sai: 0 } }
  const phu: Record<string, { co: number; can: number }> = {}
  const saiTheoKieu: Record<string, number> = {}
  let theoDoi = 0, tong = 0
  for (const k of CAC_KIEU) for (let i = 0; i < moiKieu; i++) {
    const kq = tinhBon(taoEm(k, r, `${k}${i}`))
    const v = kq.soLieu.vao!
    tong++
    if (kq.soLieu.theoDoi) theoDoi++
    for (const b of BANG) {
      if (!v[b]) continue
      if (NHAN[k].duoc.includes(b)) vao[b].dung++
      else { vao[b].sai++; saiTheoKieu[`${k}→${b}`] = (saiTheoKieu[`${k}→${b}`] ?? 0) + 1; if (process.env.MO_PHONG_CHI_TIET) console.log(k, '→', b, JSON.stringify(kq.soLieu.ho), JSON.stringify(kq.diem)) }
    }
    for (const b of NHAN[k].phai) { const key = `${k}:${b}`; phu[key] ??= { co: 0, can: 0 }; phu[key].can++; if (v[b]) phu[key].co++ }
  }
  return { vao, phu, saiTheoKieu, theoDoi, tong }
}
const pc = (d: number, n: number) => (n ? (100 * d) / n : 100)

describe('đánh giá 4 bảng v2 — tự đo trên học sinh mô phỏng có đáp án', () => {
  for (const hat of [101, 202, 303]) {
    it(`hạt ${hat}: độ chính xác ≥ 99% ở cả 4 bảng; độ phủ các kiểu rõ ràng đủ cao`, () => {
      const kq = doMotHat(hat, 70)
      const dong = BANG.map((b) => `${b}: ${kq.vao[b].dung}/${kq.vao[b].dung + kq.vao[b].sai} = ${pc(kq.vao[b].dung, kq.vao[b].dung + kq.vao[b].sai).toFixed(1)}%`)
      const phu = Object.entries(kq.phu).map(([k, x]) => `${k} ${pc(x.co, x.can).toFixed(0)}%`)
      console.log(`[hạt ${hat}] ${kq.tong} em · theo dõi ${kq.theoDoi} · ${dong.join(' · ')}\n  phủ: ${phu.join(' · ')}\n  sai: ${JSON.stringify(kq.saiTheoKieu)}`)
      for (const b of BANG) expect(pc(kq.vao[b].dung, kq.vao[b].dung + kq.vao[b].sai), `độ chính xác bảng ${b}`).toBeGreaterThanOrEqual(99)
      // độ phủ: kiểu rõ ràng phải được xếp phần lớn (không «an toàn» bằng cách bỏ trống bảng)
      const can = (k: Kieu, b: MaBang, toiThieu: number) => { const x = kq.phu[`${k}:${b}`]!; expect(pc(x.co, x.can), `phủ ${k}:${b}`).toBeGreaterThanOrEqual(toiThieu) }
      can('ht', 'ht', 70); can('dp_voi', 'dp', 80); can('dp_tra', 'dp', 80); can('dp_lap', 'dp', 80); can('luoi_han', 'lu', 90); can('ht', 'ch', 80)
    })
  }
})
