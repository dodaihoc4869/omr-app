/**
 * CỔNG GIAO THỨC — MÁY CHỦ LÀ TRỌNG TÀI.
 *
 * Phép kiểm quan trọng nhất ở đây ĐỌC CHÍNH MÃ NGUỒN: nếu ai đó thêm một
 * trường vị trí vào gói máy khách gửi lên, phép kiểm này đỏ. Đó là cách mọi
 * game nhiều người bị hack, và là thứ không bắt được bằng cách chạy thử.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  PHIEN_BAN_GIAO_THUC, tron, loBietDanh,
  type GoiPhim, type GoiVao,
} from '../src/game/giai-cuu-cong-chua/giao-thuc'

const G = resolve(__dirname, '../src/game/giai-cuu-cong-chua')
const doc = (f: string) => readFileSync(resolve(G, f), 'utf8')

/** Bỏ chú thích rồi mới soi — cổng phải soi MÃ, không soi lời văn. */
function chiMa(s: string): string {
  return s.replace(/\/\*[\s\S]*?\*\//g, '').split('\n').filter((d) => !d.trim().startsWith('//')).join('\n')
}

describe('máy khách CHỈ được gửi phím bấm', () => {
  const nguon = chiMa(doc('giao-thuc.ts'))

  it('GoiPhim không có một trường vị trí nào', () => {
    const i = nguon.indexOf('export interface GoiPhim')
    const j = nguon.indexOf('}', i)
    const than = nguon.slice(i, j)
    // so theo TÊN TRƯỜNG đứng đầu dòng, không so chuỗi con:
    // "nhay: boolean" có chứa "y:" nhưng nó là phím bấm, không phải toạ độ.
    const truong = [...than.matchAll(/^\s*(\w+)\s*:/gm)].map((m) => m[1])
    for (const cam of ['x', 'y', 'vx', 'vy', 'mang', 'diem', 'hoaChat', 'giet', 'dam']) {
      expect(truong.includes(cam), `GoiPhim có trường "${cam}" — máy khách không được gửi thứ này`).toBe(false)
    }
    expect(truong.sort()).toEqual(['loai', 'nhay', 'phai', 'stt', 'trai'])
    expect(than).toContain('trai')
    expect(than).toContain('phai')
    expect(than).toContain('nhay')
    expect(than).toContain('stt')
  })

  it('cả bốn gói LÊN cộng lại chỉ có đúng những trường được phép', () => {
    const i = nguon.indexOf('export type GoiLen')
    expect(i).toBeGreaterThan(0)
    const phanLen = nguon.slice(0, i)
    // không gói lên nào được mang toạ độ
    expect(/\n\s+x:\s*number/.test(phanLen)).toBe(false)
    expect(/\n\s+y:\s*number/.test(phanLen)).toBe(false)
  })

  it('máy chủ KHÔNG đọc trường lạ từ gói phím', () => {
    const p = chiMa(readFileSync(resolve(G, '../../../server-game/src/phong.ts'), 'utf8'))
    const i = p.indexOf("if (g.loai === 'phim')")
    const than = p.slice(i, p.indexOf('\n  }', i))
    // chỉ được đọc đúng bốn trường này từ g
    const docTu = [...than.matchAll(/\bg\.(\w+)/g)].map((m) => m[1])
    expect(new Set(docTu)).toEqual(new Set(['loai', 'stt', 'trai', 'phai', 'nhay']))
  })

  it('máy chủ không nhận gói đến muộn (chống phát lại)', () => {
    const p = chiMa(readFileSync(resolve(G, '../../../server-game/src/phong.ts'), 'utf8'))
    expect(p).toContain('g.stt <= k.sttCuoi')
  })
})

describe('máy chủ game không chạm được dữ liệu học sinh', () => {
  // bỏ dòng chú thích TOML: cổng phải soi CẤU HÌNH, không soi lời văn
  const w = readFileSync(resolve(G, '../../../server-game/wrangler.toml'), 'utf8')
    .split('\n').filter((d) => !d.trim().startsWith('#')).join('\n')

  it('không có D1, không có R2, không có secret', () => {
    expect(w).not.toContain('d1_databases')
    expect(w).not.toContain('r2_buckets')
    expect(w.toLowerCase()).not.toContain('ma_bi_mat')
  })

  it('là Worker RIÊNG, không phải máy chủ thi', () => {
    expect(w).toContain('name = "omr-game"')
    const wThi = readFileSync(resolve(G, '../../../server/wrangler.toml'), 'utf8')
      .split('\n').filter((d) => !d.trim().startsWith('#')).join('\n')
    expect(wThi).toContain('name = "omr"')
  })

  it('mã máy chủ game không nhắc tới bảng điểm hay số báo danh', () => {
    const p = chiMa(readFileSync(resolve(G, '../../../server-game/src/phong.ts'), 'utf8'))
    const x = chiMa(readFileSync(resolve(G, '../../../server-game/src/index.ts'), 'utf8'))
    for (const s of [p, x]) {
      expect(/\b(sbd|hoTen|BangDiem|soDienThoai)\b/i.test(s)).toBe(false)
    }
  })
})

describe('danh tính người chơi', () => {
  it('biệt danh bị lọc sạch, không quá 16 ký tự', () => {
    expect(loBietDanh('  Bảo <script>  ')).toBe('Bảo script')
    expect(loBietDanh('a')).toBe('Ẩn danh')
    expect(loBietDanh('x'.repeat(40)).length).toBe(16)
    expect(loBietDanh('Minh Anh 12')).toBe('Minh Anh 12')
  })

  it('gói vào phòng chỉ mang biệt danh và mã máy — không có gì khác', () => {
    const g: GoiVao = { loai: 'vao', bietDanh: 'Bảo', maMay: 'a'.repeat(32), phienBan: PHIEN_BAN_GIAO_THUC }
    expect(Object.keys(g).sort()).toEqual(['bietDanh', 'loai', 'maMay', 'phienBan'])
  })

  it('gói phím đúng hình dạng', () => {
    const g: GoiPhim = { loai: 'phim', trai: false, phai: true, nhay: false, stt: 1 }
    expect(Object.keys(g).sort()).toEqual(['loai', 'nhay', 'phai', 'stt', 'trai'])
  })
})

describe('gói ảnh', () => {
  it('làm tròn 1 chữ số để gói nhẹ', () => {
    expect(tron(123.456)).toBe(123.5)
    expect(tron(-0.04)).toBe(-0)
  })

  it('máy chủ có mang cảnh mở đầu xuống, để 12 máy chiếu cùng lúc', () => {
    const p = readFileSync(resolve(G, '../../../server-game/src/phong.ts'), 'utf8')
    expect(p).toContain('canhMoDau')
  })
})

describe('máy chủ không kéo theo mã máy khách', () => {
  it('phong.ts không nhập canvas, Web Audio hay localStorage', () => {
    const p = readFileSync(resolve(G, '../../../server-game/src/phong.ts'), 'utf8')
    for (const cam of ['nhan-vat', 've-van', 'am-thanh', 'dia-chi-may-chu', 'localStorage', 'document', 'window']) {
      expect(p.includes(cam), `phong.ts nhắc tới "${cam}"`).toBe(false)
    }
  })

  it('máy chủ dùng ĐÚNG bộ luật của máy khách, không viết lại', () => {
    const p = readFileSync(resolve(G, '../../../server-game/src/phong.ts'), 'utf8')
    expect(p).toContain("from '../../src/game/giai-cuu-cong-chua/van-choi'")
    // và không tự khai lại luật khắc chế
    expect(p.includes('khacChe:')).toBe(false)
    expect(p.includes('KET_TUA')).toBe(false)
  })
})
