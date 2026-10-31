// @vitest-environment node
// TẢI SẴN THEO LỚP LÚC MỞ APP (thầy 31/10: «Khi chọn đề thì tải luôn đề đáp án cho hs khối đó luôn», «Tải sẵn hết mọi thứ về tôi bấm bắt đầu phải tức thì
// ngay»; server `/hs/ca-tai-truoc` + de-truoc.ts, máy em src/lib/khoa-de-thi.ts):
//   · em có token, lớp có ca đang mở ⇒ gói đề + gói tờ đáp án ĐÃ KHOÁ, gắn MÃ ẨN — KHÔNG lộ mã ca / tên ca / đáp án; không token ⇒ từ chối; lớp khác ⇒ rỗng;
//   · `/vao-thi` (đã được vào) trả cùng mã ẩn + chìa đề; máy em ghép gói theo mã ẩn ⇒ mở ra ĐÚNG gói `/de`, và cất gói tờ đáp án như `/khoa-de`.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import worker from '../server/src/index'
import { gameToken } from '../server/src/game-v2-auth'
import { taoD1That } from './_d1-that'
import { datGoiCa, docGoiDe, truocVao } from '../src/lib/khoa-de-thi'
import { xoaDemDeTruoc } from '../server/src/de-truoc'

type Any = Record<string, any>
const H = 3_600_000
const iso = (gio: number) => new Date(Date.now() + gio * H).toISOString()
beforeEach(() => {
  const m = new Map<string, string>()
  vi.stubGlobal('localStorage', { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k), key: (i: number) => [...m.keys()][i] ?? null, get length() { return m.size } })
})
afterEach(() => { xoaDemDeTruoc(); datGoiCa([]); vi.unstubAllGlobals() })

function r2Gia() {
  const kho = new Map<string, { text: string; etag: string }>()
  let n = 0
  return {
    async get(key: string, tuyChon?: { onlyIf?: { etagDoesNotMatch?: string } }) {
      const v = kho.get(key)
      if (!v) return null
      if (tuyChon?.onlyIf?.etagDoesNotMatch === v.etag) return { key, etag: v.etag, httpEtag: `"${v.etag}"` }
      return { key, etag: v.etag, httpEtag: `"${v.etag}"`, body: new Response(v.text).body, arrayBuffer: async () => new TextEncoder().encode(v.text).buffer }
    },
    async put(key: string, value: string) { kho.set(key, { text: value, etag: `e${++n}` }); return {} },
    async delete(key: string) { kho.delete(key) },
  }
}
const BANK = { phanI: [{ id: 'q1', text: 'Câu 1', choices: ['a', 'b', 'c', 'd'] }], phanII: [], phanIII: [], soCau: { I: 1, II: 0, III: 0 } }
const KEY = { ...BANK, phanI: [{ ...BANK.phanI[0], correct: 'B', solution: 'LG1' }] }

async function dung() {
  const d = taoD1That()
  const r2 = r2Gia()
  const env = { ...d.env, DE: r2 } as unknown as Any
  for (const [sbd, lop] of [['E12', '12'], ['E11', '11']]) {
    d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES(?,?,?,'mk','x')").run(sbd, 'Em', lop)
    d.sql.prepare("INSERT INTO danh_sach(sbd,ho_ten,nam_sinh,lop,cap_nhat_luc) VALUES(?,?,?,?,'x')").run(sbd, 'Em', '2008', lop)
  }
  d.sql.prepare(`INSERT INTO ca (ma_ca, ten_ca, trang_thai, thoi_gian_phut, loai, cong_bo, nguong_lan, nguong_giay, bank_r2, so_cau_json, cap_nhat_luc, lop, bat_dau, het_han_vao, pham_vi, phong_cho, de_rieng, chi_nop_3_phut_cuoi, dong_bo_gio)
    VALUES ('C12','Tên bí mật C12','mo',45,'thi','ngay',3,30,'de/C12.json',?,?,'12',?,?,'tu_do',0,0,0,0)`).run(JSON.stringify({ I: 1, II: 0, III: 0 }), new Date().toISOString(), iso(-1), iso(2))
  await r2.put('de/C12.json', JSON.stringify(BANK))
  await r2.put('key/C12.json', JSON.stringify(KEY))
  return { d, env }
}
async function goi(env: Any, duong: string, than?: Any) {
  const r = await worker.fetch(new Request('https://x.test' + duong, than ? { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(than) } : {}), env as never)
  const txt = await r.text()
  return { j: JSON.parse(txt) as Any, txt }
}

describe('tải sẵn theo lớp lúc mở app — gói khoá, mã ẩn', () => {
  it('em đúng lớp nhận gói đề + đáp án đã khoá gắn mã ẩn, KHÔNG lộ mã ca / tên ca / đáp án; không token ⇒ từ chối; lớp khác ⇒ rỗng', async () => {
    const { d, env } = await dung()
    const t = await goi(env, '/hs/ca-tai-truoc', { token: await gameToken(d.env as never, 'E12') })
    expect(t.j.ok).toBe(true)
    expect(t.j.goi).toHaveLength(1)
    const g = t.j.goi[0]
    expect(g.id).toMatch(/^[A-Za-z0-9_-]{16}$/)
    expect(typeof g.de.goi).toBe('string')
    expect(typeof g.dapAn.goi).toBe('string')
    expect(t.txt).not.toMatch(/C12|Tên bí mật|Câu 1|correct|LG1/)
    expect((await goi(env, '/hs/ca-tai-truoc', { sbd: 'E12' })).j.ok).toBe(false)
    expect((await goi(env, '/hs/ca-tai-truoc', { token: await gameToken(d.env as never, 'E11') })).j.goi).toEqual([])
  })

  it('vào thi: mã ẩn khớp ⇒ máy em mở gói đề tải sẵn = ĐÚNG gói /de, và cất gói tờ đáp án của em (như /khoa-de)', async () => {
    const { d, env } = await dung()
    const g = (await goi(env, '/hs/ca-tai-truoc', { token: await gameToken(d.env as never, 'E12') })).j.goi[0]
    datGoiCa([{ ...g, luc: Date.now() }])
    vi.stubGlobal('fetch', (url: string, init?: RequestInit) => worker.fetch(new Request(url, init), env as never))
    const tr = await truocVao('https://x.test', 'C12', 'E12')
    expect(tr).toBeTypeOf('function')
    const vao = (await goi(env, '/vao-thi', { maCa: 'C12', sbd: 'E12', idThietBi: 'm1', hoTen: 'Em', namSinh: '2008' })).j
    expect(vao.ok).toBe(true)
    expect(vao.idCa).toBe(g.id)
    const bank = await tr!(vao)
    expect(bank).toEqual((await goi(env, '/de/C12')).j)
    expect(docGoiDe('C12', 'E12')).toMatchObject({ maCa: 'C12', phien: g.dapAn.phien, goi: g.dapAn.goi })
    // gõ sai mã ca (gói của ca khác) ⇒ không mở được bằng gói ấy (dữ liệu kèm gắn mã ca) ⇒ không ra đề sai
    const tr2 = await truocVao('https://x.test', 'KHAC', 'E12')
    expect(await tr2!({ khoaDeTruoc: vao.khoaDeTruoc, idCa: 'khong-khop' })).toBeUndefined()
  })
})
