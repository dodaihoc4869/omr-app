// @vitest-environment node
// ÔN SỚM (thầy 23/10, em báo «Hôm nay còn 3 câu chờ thầy bổ sung» ở 27/30 — thầy chọn "cả hai"): kho bài hết câu xếp được ⇒ lấp phần mức còn thiếu bằng
// câu em ĐÃ làm (tầng cuối); hết cả ôn sớm ⇒ mức hôm nay hạ bằng số câu làm được (goi-bai-7.ts, khoá nguồn bên dưới).
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { chonGoi7, type CauGoi7 } from '../server/src/goi-bai-7-loi'

const cau = (qid: string): CauGoi7 => ({ qid, maDe: 'DH-B9', version: 'v1', group: qid, phan: 'I', kho: false, tinhToan: false } as unknown as CauGoi7)
const goc = (n: number) => {
  const ds = Array.from({ length: n }, (_, i) => cau(`m${i}`))
  return { cau: ds, daGap: new Set(ds.map((c) => c.qid)), daLamNgay: new Set<string>(), quotaCon: 0, sanSang: new Set([...ds.map((c) => c.qid), 'o1', 'o2', 'o3', 'o4']), chan: new Set<string>(), sua: [], on: [], chiTrongMuc: true }
}

describe('chonGoi7 — tầng ôn sớm', () => {
  it('câu mới đã gặp hết, không ôn đến lịch: còn 3 câu của mức ⇒ lấy đúng 3 câu ôn sớm theo thứ tự truyền vào, vai ôn', () => {
    const r = chonGoi7({ ...goc(27), mucTieuNgay: 3, onSom: ['o1', 'o2', 'o3', 'o4'] })
    expect(r.viec.map((v) => [v.qid, v.vai])).toEqual([['o1', 'on'], ['o2', 'on'], ['o3', 'on']])
  })
  it('ôn sớm chỉ là tầng CUỐI: còn câu mới thì câu mới đứng trước, ôn sớm chỉ lấp phần thiếu', () => {
    const g = goc(2)
    const r = chonGoi7({ ...g, daGap: new Set(['m0']), mucTieuNgay: 3, onSom: ['o1', 'o2'] })
    expect(r.viec.map((v) => v.qid)).toEqual(['m1', 'o1', 'o2'])
  })
  it('không vượt mức, bỏ câu đã làm hôm nay / bị chặn / chưa sẵn sàng; vắng onSom ⇒ như cũ (rỗng)', () => {
    const g = goc(5)
    expect(chonGoi7({ ...g, mucTieuNgay: 2, daLamNgay: new Set(['o1']), chan: new Set(['o2']), onSom: ['o1', 'o2', 'o3', 'x9', 'o4'] }).viec.map((v) => v.qid)).toEqual(['o3', 'o4'])
    expect(chonGoi7({ ...g, mucTieuNgay: 2 }).viec).toEqual([])
  })
})

describe('lapGoi7 — nối ôn sớm và hạ mức khi hết câu (khoá nguồn)', () => {
  const ma = readFileSync(new URL('../server/src/goi-bai-7.ts', import.meta.url), 'utf8')
  it('ôn sớm: câu đã làm, không câu mới, không câu chờ thầy dạy lại; đưa vào CÙNG vaoPlan (kế hoạch và dự phòng lúc phát cùng luật)', () => {
    expect(ma).toMatch(/!t\.laMoi && !t\.catTia/)
    expect(ma).toMatch(/vaoPlan\.onSom = hs\.cau\.filter/)
    expect(ma).toMatch(/!deKt\.has\(c\.qid\)/)
  })
  it('hạ mức chỉ khi còn thiếu, không có câu "vừa làm", đã làm > 0 và mức đã chốt; câu ghi chỉ hạ (muc>?)', () => {
    expect(ma).toMatch(/coThe < toiThieu && vaoPlan\.onSom && !vuaLam\.size && daLamNgay\.size > 0 && hs\.cau\.length >= daLamNgay\.size && muc7\.daChot/)
    expect(ma).toMatch(/UPDATE goi_bai_7_muc_ngay SET muc=\? WHERE sbd=\? AND ngay=\? AND muc>\?/)
  })
})
