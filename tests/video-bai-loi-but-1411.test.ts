// Video bài giảng dựng nét bằng bản chép bộ máy bút của live (public/video-bai/loi-but.js). Bản chép phải KHỚP nguồn src/lib/but-bang-loi.ts — lệch thì
// chạy lại: npx jiti scripts/video-bai-giang/xuat-loi-but.ts
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { JS_LOI_BUT } from '../src/lib/but-bang-loi'

describe('Video bài giảng — bộ máy bút giống live', () => {
  it('public/video-bai/loi-but.js đúng bằng JS_LOI_BUT', () => {
    const tep = readFileSync(resolve(__dirname, '../public/video-bai/loi-but.js'), 'utf8')
    expect(tep.slice(tep.indexOf('\n') + 1)).toBe(JS_LOI_BUT.trim() + '\n')
  })
  it('chạy được như trang thường: có LoiBut với khung / dungNet / vien', () => {
    const tep = readFileSync(resolve(__dirname, '../public/video-bai/loi-but.js'), 'utf8')
    const L = new Function(`${tep}\nreturn LoiBut`)() as { khung: (w: number, h: number) => unknown; dungNet: unknown; vien: unknown }
    expect(typeof L.dungNet).toBe('function')
    expect(typeof L.vien).toBe('function')
    expect(L.khung(1600, 920)).toMatchObject({ W: 1600, H: 920 })
  })
})
