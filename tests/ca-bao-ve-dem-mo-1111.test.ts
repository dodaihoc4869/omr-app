// 11/11 (hoá đơn Cloudflare — hàng đọc D1): caDangBaoVe không đếm lượt cho ca ĐÃ ĐÓNG. Test so với câu CŨ (đếm mọi ca) trên nhiều tổ hợp
// trạng thái × công bố × lượt × giờ: tập ca đang bảo vệ PHẢI y hệt (ca nào cũ bảo vệ thì mới cũng bảo vệ — không lộ đề).
import { describe, expect, it } from 'vitest'
import { taoD1That } from './_d1-that'
import { caDangBaoVe, MOC_KHOA_CA } from '../server/src/game-v2-bank'
import type { Env } from '../server/src/kieu'

const veCu = (q: string) => q.replace(/CASE WHEN ca\.trang_thai<>'dong' THEN (\(SELECT COUNT\(\*\)[\s\S]*?\)) ELSE 0 END/g, '$1')

describe('caDangBaoVe — không đếm lượt ca đã đóng, tập ca bảo vệ không đổi (11/11)', () => {
  it('đổi câu về bản cũ được (regex khớp đủ ba phép đếm)', () => {
    let q = ''
    const env = { DB: { prepare: (s: string) => { q = s; return { bind: () => ({ all: async () => ({ results: [] }) }) } } } } as unknown as Env
    return caDangBaoVe(env, Date.now()).then(() => {
      expect(q.match(/CASE WHEN/g)?.length).toBe(3)
      expect(veCu(q)).not.toMatch(/CASE WHEN/)
      expect(veCu(q).match(/SELECT COUNT\(\*\)/g)?.length).toBe(3)
    })
  })
  it('mọi tổ hợp trạng thái × công bố × lượt × giờ: tập ca bảo vệ y hệt câu cũ', async () => {
    const d = taoD1That()
    const now = Date.parse('2026-11-11T12:00:00Z'), iso = (ms: number) => new Date(ms).toISOString()
    const TT = ['mo', 'dong', 'da_xoa', 'la'], CB = ['khong', 'ngay', 'ca_lop_xong', null], LOAI = ['thi', 'baitap']
    const LUOT = [[], ['da_nop'], ['da_nop', 'dang_lam'], ['dang_lam_het'], ['khoa', 'da_nop']]
    const GIO = [{ bd: iso(now - 3 * 3600e3), het: iso(now - 2 * 3600e3), han: iso(now - 3600e3) }, { bd: iso(now + 3600e3), het: iso(now + 2 * 3600e3), han: iso(now + 3600e3) }, { bd: '', het: '', han: '' }]
    const themCa = d.sql.prepare(`INSERT INTO ca(ma_ca,trang_thai,cong_bo,loai,bat_dau,het_han_vao,han_nop,thoi_gian_phut,bank_r2,cap_nhat_luc) VALUES(?,?,?,?,?,?,?,?,?,?)`)
    const themLuot = d.sql.prepare(`INSERT INTO luot(khoa,ma_ca,sbd,lan_thu,vao_luc,trang_thai,het_gio_luc,cap_nhat_luc) VALUES(?,?,?,?,?,?,?,?)`)
    let n = 0
    for (const tt of TT) for (const cb of CB) for (const loai of LOAI) for (const [gi, g] of GIO.entries()) for (const [li, ls] of LUOT.entries()) {
      const ma = `c${n++}`
      themCa.run(ma, tt, cb, loai, g.bd, g.het, g.han, 30, `de/${ma}.json`, gi === 2 ? iso(now - 86400e3) : '2026-09-01T00:00:00.000Z')
      ls.forEach((t, i) => themLuot.run(`${ma}|E${i}|1`, ma, `E${i}`, 1, iso(now), t === 'dang_lam_het' ? 'dang_lam' : t, t === 'dang_lam_het' ? iso(now - 60e3) : t === 'dang_lam' ? iso(now + 600e3) : null, iso(now)))
      void li
    }
    const moi = (await caDangBaoVe(d.env, now)).map((x) => String(x.ma_ca)).sort()
    const goc = d.env.DB
    const envCu = { ...d.env, DB: { ...goc, prepare: (s: string) => goc.prepare(veCu(s)) } } as unknown as Env
    const cu = (await caDangBaoVe(envCu, now)).map((x) => String(x.ma_ca)).sort()
    expect(cu.length).toBeGreaterThan(10)
    expect(cu.length).toBeLessThan(n) // có cả ca bị lọc bỏ ⇒ phép so có nghĩa
    expect(moi).toEqual(cu)
    expect(MOC_KHOA_CA).toBe('2026-09-28T17:00:00.000Z')
  })
})
