// @vitest-environment jsdom
// GIÁM THỊ HÌNH NGƯỜI v3 (thầy chốt 27/10 «Chốt thay đi»): đủ tư thế cho mọi trạng thái, tính cách theo mức, không màu thô, biến màu đủ, dọn sạch khi huỷ.
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { GT_DANG_SONG, THU_TU_NGUOI, taoGiamThi, tuThe } from '../src/components/giam-thi/giam-thi-nguoi'
import type { TrangThaiGT } from '../src/components/giam-thi/giam-thi-ve'

const TT: TrangThaiGT[] = ['yen', 'doc', 'cho', 'soi', 'dong-ho', 'nghi-ngo', 'nop', 'dung', 'sai', 'chua-tinh', 'combo', 'xong']
const css = readFileSync('src/components/giam-thi/giam-thi.css', 'utf8')
const khoi = (sel: string) => { const i = css.indexOf(sel + ' {'); expect(i, sel).toBeGreaterThan(-1); return css.slice(i, css.indexOf('}', i)) }
const bien = (s: string) => new Set([...s.matchAll(/--gn-([\w]+):/g)].map((m) => m[1]!))

describe('giám thị hình người', () => {
  it('mọi mức × trạng thái có tư thế, kể cả bị chọc và động tác vặt lúc đứng yên', () => {
    for (const m of THU_TU_NGUOI) {
      const s = tuThe(m)
      for (const t of [...TT, 'choc', 'phu-kinh', 'phu-lac', 'phu-ngap', 'phu-gai']) {
        const v = s[t]
        expect(v, `${m}.${t}`).toBeTruthy()
        expect((v!.seq?.length ?? 0) + (v!.loop?.length ?? 0) + (v!.base ? 1 : 0), `${m}.${t}`).toBeGreaterThan(0)
      }
    }
  })
  it('mức càng cao càng khó tính: mức 1 cười híp mắt nhảy lên; mức 4 không cười híp, gật gù + ngón cái + nháy mắt; sai thì ghi sổ', () => {
    expect(tuThe('nb').dung.base!.mat).toBe('cong')
    expect(tuThe('nb').dung.seq![0]!.d).toBeLessThanOrEqual(80) // lấy đà 80 ms
    const k = tuThe('vdc')
    expect(k.dung.base!.mat).not.toBe('cong')
    expect(k.dung.base!.hP).toBe('cai'); expect(k.dung.base!.ltT).toBe(1)
    expect(k.sai.base!.vs2).toBe(1) // cầm bút ghi sổ
    expect(tuThe('vdc').combo.base!.mat).not.toBe('cong') // «không tệ», vỗ tay chậm
  })
  it('không mã màu thô trong mã vẽ; mọi biến --gn-* dùng tới đều khai ở giam-thi.css cho đúng mức', () => {
    const src = readFileSync('src/components/giam-thi/giam-thi-nguoi.ts', 'utf8')
    expect(src.match(/#[0-9a-fA-F]{3,8}\b/g)).toBeNull()
    const chung = bien(khoi('.gtn'))
    for (const m of THU_TU_NGUOI) {
      const co = new Set([...chung, ...bien(khoi(`.gtn[data-muc='${m}']`))])
      const el = document.createElement('div')
      const g = taoGiamThi(el, { muc: m, tinh: true })
      for (const t of TT) g.datTrangThai(t)
      const dung = new Set<string>()
      for (const e of el.querySelectorAll<SVGElement>('*')) for (const v of [e.getAttribute('style') ?? '']) for (const x of v.matchAll(/var\(--gn-(\w+)\)/g)) dung.add(x[1]!)
      expect(dung.size, m).toBeGreaterThan(15)
      for (const k of dung) expect(co.has(k), `${m}: --gn-${k}`).toBe(true)
      g.huy()
    }
    expect(GT_DANG_SONG.size).toBe(0)
  })
  it('bản tĩnh xám mờ (Lộ trình) gắn lớp, huỷ thì dọn sạch', () => {
    const el = document.createElement('div')
    const g = taoGiamThi(el, { muc: 'th', tinh: true, xam: true, mo: true })
    expect(el.classList.contains('gt-xam') && el.classList.contains('gt-mo-nhat') && el.classList.contains('gt-tinh')).toBe(true)
    expect(el.querySelector('svg.gtn[data-muc="th"]')).toBeTruthy()
    g.huy()
    expect(el.innerHTML).toBe('')
  })
})
