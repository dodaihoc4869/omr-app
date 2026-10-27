// @vitest-environment node
// LỆNH ĐẶT LẠI BÌNH 27/10 (scripts/dat-lai-binh-2710.ts, chạy bằng workflow) — thử trên D1 thật (node:sqlite) qua lớp REST giả: cổng ca thi mở, cổng bản sống,
// đếm trước / sau, chỉ THÊM dòng nguồn tt-binh-reset-2710, tinh thể / nguyên tử không đổi, chạy lại không ghi đôi, bình mua sau mốc vẫn giữ.
import { execFileSync } from 'node:child_process'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { taoKhoOmni } from './omni-3-ke-hoach-chung'
import { SQL_CHUOI_BINH, docChuoiNgayBai } from '../server/src/chuoi-ngay-bai-d1'
import { xoaDemPhamVi } from '../server/src/bai-da-day'

const HEAD = execFileSync('git', ['rev-parse', 'HEAD']).toString().trim()
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.useRealTimers(); vi.resetModules(); xoaDemPhamVi() })

function kho() {
  const k = taoKhoOmni({}, 3)
  const sk = k.d.sql.prepare("INSERT INTO su_kien_hoc(khoa,sbd,qid,nguon,ma_nguon,lan,ket_qua,luc,ngay_vn,assistance) VALUES(?,?,?,'game','p',1,1,?,?,'none')")
  for (const sbd of ['S1', 'S2']) for (let n = 0; n < 16; n++) {
    const ngay = new Date(Date.parse('2026-10-12T00:00:00Z') + n * 86_400_000).toISOString().slice(0, 10)
    for (let i = 0; i < 6; i++) sk.run(`${sbd}|${ngay}|${i}`, sbd, `q${i}`, `${ngay}T03:00:00Z`, ngay)
  }
  for (const c of SQL_CHUOI_BINH) k.d.sql.exec(c)
  k.d.sql.exec("INSERT INTO vang_so(sbd,loai,so_vang,exp_tru,ma_mon,khoa_yeu_cau,luc) VALUES('S1','doi',300,0,NULL,'nap|1','2026-10-01T00:00:00Z'),('S1','mua',-50,0,'tt-binh','tt|2026-10-27|binh','2026-10-27T02:00:00Z')")
  return k
}
function gia(k: ReturnType<typeof kho>, the: string, caMo = 0) {
  const sql = k.d.sql
  vi.stubGlobal('fetch', async (url: string, o?: { body?: string }) => {
    const ok = (result: unknown) => new Response(JSON.stringify({ success: true, result }), { status: 200 })
    if (url.endsWith('/query')) {
      const { sql: q, params = [] } = JSON.parse(o!.body!) as { sql: string; params?: unknown[] }
      if (/so_ca_mo/.test(q)) return ok([{ success: true, results: [{ so_ca_mo: caMo, so_luot_dang_lam: 0 }] }])
      const st = sql.prepare(q)
      if (/^\s*(SELECT|WITH)/i.test(q)) return ok([{ success: true, results: st.all(...(params as never[])) }])
      const r = st.run(...(params as never[]))
      return ok([{ success: true, results: [], meta: { changes: Number(r.changes) } }])
    }
    if (url.endsWith('/deployments')) return ok({ deployments: [{ versions: [{ version_id: 'v1', percentage: 100 }] }] })
    if (url.includes('/versions/')) return ok({ annotations: { 'workers/tag': the } })
    throw new Error(`url lạ ${url}`)
  })
}
async function chay(env: Record<string, string>) {
  vi.stubEnv('CLOUDFLARE_API_TOKEN', 't'); vi.stubEnv('CLOUDFLARE_ACCOUNT_ID', 'a'); vi.stubEnv('MOC_LUAT', HEAD)
  for (const [k, v] of Object.entries(env)) vi.stubEnv(k, v)
  const log: string[] = []
  const spy = vi.spyOn(console, 'log').mockImplementation((x: unknown) => { log.push(String(x)) })
  const thoat = vi.spyOn(process, 'exit').mockImplementation((() => { throw new Error('exit') }) as never)
  try { await import('../scripts/dat-lai-binh-2710') } catch (e) { if ((e as Error).message !== 'exit') throw e } finally { spy.mockRestore(); thoat.mockRestore() }
  return log.map((x) => JSON.parse(x) as Record<string, unknown>)
}

describe('dat-lai-binh-2710', () => {
  it('đếm trước, đặt lại về 0, tinh thể / nguyên tử giữ nguyên; chạy lại không ghi thêm', async () => {
    vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(Date.parse('2026-10-27T09:00:00Z'))
    const k = kho()
    gia(k, HEAD)
    expect((await docChuoiNgayBai(k.env, 'S1', Date.now()))?.giuChuoi).toBe(2)
    const chiDem = await chay({ GHI: 'dem' })
    expect(chiDem.find((x) => x.buoc === 'truoc')).toMatchObject({ soEm: 2, tongBinh: 4 })
    expect((k.d.sql.prepare("SELECT COUNT(*) AS n FROM chuoi_binh_mua WHERE nguon='tt-binh-reset-2710'").get() as { n: number }).n).toBe(0)
    vi.resetModules()
    const ghi = await chay({ GHI: 'ghi' })
    const sau = ghi.find((x) => x.buoc === 'sau')!
    expect(sau).toMatchObject({ dongVuaGhi: 2, soEm: 0, tongBinh: 0 })
    expect(sau.tinhThe).toMatchObject({ truoc: 250, sauCungDong: 250, giuNguyen: true })
    expect((sau.nguyenTu as Record<string, unknown>).giuNguyen).toBe(true)
    expect(k.d.sql.prepare("SELECT sbd, so, nguon FROM chuoi_binh_mua WHERE nguon='tt-binh-reset-2710' ORDER BY sbd").all()).toEqual([
      { sbd: 'S1', so: -2, nguon: 'tt-binh-reset-2710' }, { sbd: 'S2', so: -2, nguon: 'tt-binh-reset-2710' }])
    expect((await docChuoiNgayBai(k.env, 'S1', Date.now() + 60_000))?.giuChuoi).toBe(0)
    expect((await docChuoiNgayBai(k.env, 'S1', Date.now() + 60_000))?.so).toBe(16)
    vi.resetModules()
    const lai = await chay({ GHI: 'ghi' })
    expect(lai.find((x) => x.buoc === 'truoc')).toMatchObject({ soEm: 0, dongDatLaiDaCo: 2 })
    expect(lai.find((x) => x.buoc === 'sau')).toMatchObject({ dongVuaGhi: 0 })
  })
  it('có ca thi mở ⇒ DỪNG, không ghi', async () => {
    const k = kho()
    gia(k, HEAD, 1)
    await expect(chay({ GHI: 'ghi' })).rejects.toThrow(/ca thi mở/)
    expect((k.d.sql.prepare('SELECT COUNT(*) AS n FROM chuoi_binh_mua').get() as { n: number }).n).toBe(0)
  })
  it('Worker sống chưa có luật mới ⇒ DỪNG, không ghi', async () => {
    const k = kho()
    const cu = execFileSync('git', ['rev-parse', 'HEAD~1']).toString().trim()
    gia(k, cu)
    await expect(chay({ GHI: 'ghi' })).rejects.toThrow(/CHƯA có luật bình mới/)
    expect((k.d.sql.prepare('SELECT COUNT(*) AS n FROM chuoi_binh_mua').get() as { n: number }).n).toBe(0)
  })
})
