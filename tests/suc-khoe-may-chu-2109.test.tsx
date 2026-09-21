// CHIP "Máy chủ: tốt / đang bận / nghẽn" — hợp đồng docs/hop-dong-suc-khoe-may-chu-2109.md (Code 3 ↔ Code 4). Ở đây: bộ đọc thuần + chip ở thanh trên Bảng tin sàn. Nhịp hỏi thật (10 s, tab ẩn, 404) ở tests/bang-tin-san-e-2109.test.tsx.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { CHU_MUC_MAY, docMucMay, laySucKhoeMay, mucCaoNhat, NHIP_SUC_KHOE_MS, SO_MAU_CHIP } from '../src/lib/suc-khoe-may-chu'
import { ThanhTren } from '../src/components/bang-tin-san/ThanhTren'

vi.mock('../src/lib/may-chu-moi', () => ({ layCauHinhMayChu: async () => ({ URL: 'https://may.test' }) }))
vi.mock('../src/lib/exam-db', () => ({ loadTeacherSecret: async () => 'mat-thu' }))
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})
const doc = (p: string) => readFileSync(resolve(__dirname, '..', p), 'utf8')

describe('bộ đọc sức khoẻ máy chủ', () => {
  it('docMucMay: chỉ nhận tot / ban / nghen; thiếu, lạ, sai kiểu ⇒ null (không bịa "tốt")', () => {
    expect(docMucMay({ ok: true, muc: 'tot' })).toBe('tot')
    expect(docMucMay({ muc: 'ban', heSo: 2 })).toBe('ban')
    expect(docMucMay({ muc: 'nghen' })).toBe('nghen')
    for (const x of [null, undefined, 'tot', [], {}, { muc: 'TOT' }, { muc: 'binh-thuong' }, { muc: 1 }, { ok: true }]) expect(docMucMay(x), JSON.stringify(x)).toBeNull()
  })
  it('mucCaoNhat: nghẽn > bận > tốt; rỗng ⇒ null', () => {
    expect(mucCaoNhat(['tot', 'tot', 'tot'])).toBe('tot')
    expect(mucCaoNhat(['tot', 'ban', 'tot'])).toBe('ban')
    expect(mucCaoNhat(['ban', 'nghen', 'tot'])).toBe('nghen')
    expect(mucCaoNhat([])).toBeNull()
  })
  it('hằng số theo hợp đồng: hỏi ≤ 1 lần / 10 giây, lấy MAX 3 lượt; chữ chip đúng mẫu Boss', () => {
    expect(NHIP_SUC_KHOE_MS).toBe(10_000)
    expect(SO_MAU_CHIP).toBe(3)
    expect(CHU_MUC_MAY).toEqual({ tot: 'Máy chủ: tốt', ban: 'Máy chủ: đang bận', nghen: 'Máy chủ: nghẽn' })
  })
  it('laySucKhoeMay: POST /gv/suc-khoe-may-chu với mã bí mật; thân đúng ⇒ mức; 404 ⇒ chưa có lệnh; thân sai dạng ⇒ khong_doc_duoc', async () => {
    const goi: { url: string; init?: RequestInit }[] = []
    let tra: { ok: boolean; status: number; body: unknown } = { ok: true, status: 200, body: { ok: true, muc: 'ban', heSo: 2, p50Ms: 300, p95Ms: 1800 } }
    vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
      goi.push({ url: String(url), init })
      return { ok: tra.ok, status: tra.status, json: async () => tra.body, headers: new Headers() }
    }))
    const a = await laySucKhoeMay()
    expect(a).toEqual({ ok: true, du: 'ban' })
    expect(new URL(goi[0]!.url).pathname).toBe('/gv/suc-khoe-may-chu')
    expect(goi[0]!.init?.method).toBe('POST')
    expect(JSON.stringify(goi[0]!.init?.headers)).toContain('mat-thu')
    tra = { ok: false, status: 404, body: { ok: false } }
    const b = await laySucKhoeMay()
    expect(b.ok).toBe(false)
    if (!b.ok) expect(b.loai).toBe('chua_co_lenh')
    tra = { ok: true, status: 200, body: { ok: true, muc: 'la-la' } }
    const c = await laySucKhoeMay()
    expect(c.ok).toBe(false)
    if (!c.ok) expect(c.loai).toBe('khong_doc_duoc')
  })
})

describe('chip trên thanh trên của Bảng tin sàn', () => {
  const ve = (sucKhoe?: 'tot' | 'ban' | 'nghen' | null) => render(<ThanhTren mocMs={Date.parse('2026-09-21T05:00:00Z')} nowMs={Date.parse('2026-09-21T08:28:36Z')} sucKhoe={sucKhoe} />)
  it('không truyền / null ⇒ KHÔNG có chip (chưa biết ⇒ không bịa)', () => {
    expect(ve().container.querySelector('[data-khoi="suc-khoe-may"]')).toBeNull()
    cleanup()
    expect(ve(null).container.querySelector('[data-khoi="suc-khoe-may"]')).toBeNull()
  })
  it('tốt / đang bận / nghẽn ⇒ chip role=status đúng chữ, đúng lớp màu và data-muc', () => {
    for (const [muc, chu] of [['tot', 'Máy chủ: tốt'], ['ban', 'Máy chủ: đang bận'], ['nghen', 'Máy chủ: nghẽn']] as const) {
      const { container, unmount } = ve(muc)
      const chip = container.querySelector('[data-khoi="suc-khoe-may"]')!
      expect(chip.textContent).toBe(chu)
      expect(chip.getAttribute('role')).toBe('status')
      expect(chip.getAttribute('data-muc')).toBe(muc)
      expect(chip.className).toContain(`bts-may-${muc}`)
      unmount()
    }
  })
  it('CSS dùng token (không hex), chữ ≥ 12 px, đủ ba mức', () => {
    const css = doc('src/components/bang-tin-san/bang-tin-san.css')
    for (const m of ['tot', 'ban', 'nghen']) expect(css).toContain(`.bts-may-${m} {`)
    const khoi = css.slice(css.indexOf('.bts-may {'))
    expect(khoi).toMatch(/font-size: 12px/)
    expect(khoi).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
  })
})
