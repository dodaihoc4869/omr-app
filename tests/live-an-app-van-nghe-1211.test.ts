// @vitest-environment node
// Thầy 12/11 tối: «học sinh thoát app ẩn vẫn phải nghe thấy tiếng của thầy, giữ kết nối tới lúc kết thúc live».
// Luật cũ (đặc tả live bảng 4.7) «rời màn ⇒ tiếng ngừng» BỎ. Rời màn / ẩn app chỉ còn: tắt mic của em, thôi vẽ điểm đang viết, báo tên cho thầy.
import { readFileSync } from 'node:fs'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { giuTiengNen, ngheBiDung } from '../src/lib/live/giu-nen'

const em = readFileSync('src/lib/live/em.ts', 'utf8')
const doan = (tu: string, den: string) => { const i = em.indexOf(tu); expect(i, tu).toBeGreaterThan(-1); return em.slice(i, em.indexOf(den, i + tu.length)) }

describe('Live — em ẩn app vẫn nghe tiếng thầy', () => {
  afterEach(() => { vi.unstubAllGlobals() })

  it('tiếng thầy / tiếng bạn KHÔNG còn tắt theo cờ rời màn; ẩn app vẫn tính là đang nghe', () => {
    const tieng = doan('const capNhatTieng = ', '\n  }\n')
    expect(tieng).not.toContain('roiMan')
    expect(tieng).toContain('am.muted = wa || !tt.nghe;')
    expect(tieng).toContain('amBan.muted = wa || !tt.nghe\n')
    expect(doan('const dangNghe = ', '\n')).not.toContain('roiMan')
  })
  it('rời màn vẫn tắt mic của em và không cho bật mic; về lại phát lại tiếng', () => {
    expect(em).toContain('function datRoiMan(roi: boolean): void { roiMan = roi; if (roi) tatMic(); capNhatTieng(); baoOk(); if (!roi) { dem.xoa(); phatTieng(); soatMic() } }')
    expect(em).toContain("if (!live?.emDuocMoi || roiMan) return { ok: false, lyDo: 'chua-duoc-moi' }")
  })
  it('thẻ tiếng thầy tự phát lại khi bị hệ thống dừng giữa buổi; hết đường tiếng thì gỡ thẻ điều khiển', () => {
    expect(em).toContain('ngheBiDung(t, mt.hen, () => { if (am === t && t.srcObject && t.paused && !huyRoi && live?.bat && tt.nghe) phatTieng() })')
    expect(em.match(/am = am \?\? taoAm\(\)/g)?.length).toBe(2)
    expect(em).toContain('goNen = goNen ?? giuTiengNen(phatTieng)')
    expect(doan('function dongSfu(): void {', '\n  }\n')).toContain('goNen?.(); goNen = null')
  })
  it('giuTiengNen: khai «Thầy đang live», nút tạm dừng / phát ở màn khoá đều gọi phát lại (không dừng được tiếng); gỡ ⇒ trả sạch', () => {
    const xuLy: Record<string, (() => void) | null> = {}
    const ms = { metadata: null as unknown, playbackState: 'none', setActionHandler: (k: string, f: (() => void) | null) => { xuLy[k] = f } }
    vi.stubGlobal('navigator', { mediaSession: ms })
    vi.stubGlobal('MediaMetadata', class { constructor(public o: { title: string }) {} })
    const phat = vi.fn()
    const go = giuTiengNen(phat)
    expect((ms.metadata as { o: { title: string } }).o.title).toBe('Thầy đang live')
    expect(ms.playbackState).toBe('playing')
    xuLy.pause?.(); xuLy.play?.()
    expect(phat).toHaveBeenCalledTimes(2)
    go()
    expect(ms.metadata).toBeNull()
    expect(ms.playbackState).toBe('none')
    expect(xuLy.pause).toBeNull()
    expect(xuLy.play).toBeNull()
  })
  it('giuTiengNen: trình duyệt không có mediaSession ⇒ không lỗi', () => {
    vi.stubGlobal('navigator', {})
    expect(() => giuTiengNen(() => {})()).not.toThrow()
  })
  it('ngheBiDung: thẻ bị dừng ⇒ hẹn 800 ms rồi mới thử phát lại', () => {
    const nghe: Record<string, () => void> = {}, hen: Array<[() => void, number]> = []
    const thu = vi.fn()
    ngheBiDung({ addEventListener: (k: string, f: () => void) => { nghe[k] = f } } as unknown as HTMLAudioElement, (f, ms) => { hen.push([f, ms]) }, thu)
    nghe.pause()
    expect(thu).not.toHaveBeenCalled()
    expect(hen[0][1]).toBe(800)
    hen[0][0]()
    expect(thu).toHaveBeenCalledTimes(1)
  })
})
