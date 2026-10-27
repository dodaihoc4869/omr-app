// @vitest-environment node
// LỆNH ĐẶT TINH THỂ VỀ 50 (scripts/dat-lai-tinh-the-2710.mjs, chạy bằng workflow) — D1 thật (node:sqlite) qua lớp REST giả: chỉ THÊM dòng điều chỉnh,
// mọi em = 50 (kể cả em chưa có dòng nào / đang âm), đóng cược đang chạy không hoàn, thông báo một lần, bản sao số dư, cổng ca thi + bản sống, chạy lại không đôi.
import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { taoD1That } from './_d1-that'

const HEAD = execFileSync('git', ['rev-parse', 'HEAD']).toString().trim()
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.resetModules() })

function kho() {
  const d = taoD1That()
  const em = d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES(?,?,'12','mk','x')")
  for (const s of ['A', 'B', 'C', 'D']) em.run(s, `Em ${s}`)
  const v = d.sql.prepare("INSERT INTO vang_so(sbd,loai,so_vang,exp_tru,ma_mon,khoa_yeu_cau,luc) VALUES(?,?,?,0,?,?,'2026-10-20T00:00:00Z')")
  v.run('A', 'doi', 300, null, 'k1'); v.run('A', 'mua', -50, 'tt-cuoc', 'tt|cuoc|A|2026-10-25') // A: 250, đang cược
  v.run('B', 'doi', 20, null, 'k2') // B: 20
  v.run('C', 'doi', 50, null, 'k3') // C: đúng 50 ⇒ không dòng
  v.run('E', 'doi', 10, null, 'k4'); v.run('E', 'mua', -15, 'x', 'k5') // E: không hồ sơ, đang âm −5
  d.sql.prepare("INSERT INTO cuoc_chuoi(id,em,dat,tu_ngay,den_ngay,trang_thai,luc) VALUES('A|2026-10-25','A',50,'2026-10-25','2026-10-31','dang','x')").run()
  d.sql.prepare("INSERT INTO exp_so(sbd,exp,loai,khoa,ngay_vn,luc) VALUES('A',90,'cau','e1','2026-10-20','x')").run()
  return d
}
function gia(d: ReturnType<typeof kho>, the: string, caMo = 0) {
  vi.stubGlobal('fetch', async (url: string, o?: { body?: string }) => {
    const ok = (result: unknown) => new Response(JSON.stringify({ success: true, result }), { status: 200 })
    if (url.endsWith('/query')) {
      const { sql: q, params = [] } = JSON.parse(o!.body!) as { sql: string; params?: unknown[] }
      if (/so_ca_mo/.test(q)) return ok([{ success: true, results: [{ so_ca_mo: caMo, so_luot_dang_lam: 0 }] }])
      const st = d.sql.prepare(q)
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
  try { await import('../scripts/dat-lai-tinh-the-2710.mjs') } catch (e) { if ((e as Error).message !== 'exit') throw e } finally { spy.mockRestore(); thoat.mockRestore() }
  return log.map((x) => JSON.parse(x) as Record<string, unknown>)
}
const soDu = (d: ReturnType<typeof kho>) => Object.fromEntries((d.sql.prepare('SELECT sbd, SUM(so_vang) AS s FROM vang_so GROUP BY sbd ORDER BY sbd').all() as { sbd: string; s: number }[]).map((x) => [x.sbd, x.s]))

describe('dat-lai-tinh-the-2710', () => {
  it('đếm + bản sao (không ghi); rồi ghi: mọi em = 50, chỉ thêm dòng, cược đóng không hoàn, thông báo một lần; chạy lại không đôi', async () => {
    const d = kho()
    gia(d, HEAD)
    const thu = mkdtempSync(join(tmpdir(), 'tt-'))
    const dem = await chay({ GHI: 'dem', BAN_SAO: join(thu, 'dem.json') })
    expect(dem.find((x) => x.buoc === 'truoc')).toMatchObject({ soEm: 5, tongTinhThe: 250 + 20 + 50 - 5, soEmAm: 1, soEmKhac50: 4, cuocDang: 1 })
    expect(JSON.parse(readFileSync(join(thu, 'dem.json'), 'utf8')).soDu).toEqual([
      { sbd: 'A', so_du: 250 }, { sbd: 'B', so_du: 20 }, { sbd: 'C', so_du: 50 }, { sbd: 'D', so_du: 0 }, { sbd: 'E', so_du: -5 }])
    expect(soDu(d)).toEqual({ A: 250, B: 20, C: 50, E: -5 })
    const dongTruoc = (d.sql.prepare('SELECT id, sbd, so_vang, khoa_yeu_cau FROM vang_so ORDER BY id').all())
    vi.resetModules()
    const ghi = await chay({ GHI: 'ghi', BAN_SAO: join(thu, 'ghi.json') })
    const sau = ghi.find((x) => x.buoc === 'sau')!
    expect(sau).toMatchObject({ dongDieuChinh: 4, cuocDong: 1, thongBao: 4, dongSoCuGiuNguyen: true, nguyenTuGiu: true, binhGiu: true, kimCuongGiu: true, cuocDangSau: 0 })
    expect(sau.taiLucGhi).toEqual({ soEm: 5, tongTinhThe: 250, soEmKhac50: 0, dung50XSoEm: true })
    expect(sau.hienTai).toMatchObject({ soEmAm: 0, soEmKhac50: 0 })
    expect(soDu(d)).toEqual({ A: 50, B: 50, C: 50, D: 50, E: 50 })
    // Chỉ THÊM: dòng cũ y nguyên.
    expect(d.sql.prepare(`SELECT id, sbd, so_vang, khoa_yeu_cau FROM vang_so WHERE id <= ${(dongTruoc.at(-1) as { id: number }).id} ORDER BY id`).all()).toEqual(dongTruoc)
    expect(d.sql.prepare("SELECT sbd, loai, so_vang FROM vang_so WHERE khoa_yeu_cau = 'tt|reset-50-2710' ORDER BY sbd").all()).toEqual([
      { sbd: 'A', loai: 'mua', so_vang: -200 }, { sbd: 'B', loai: 'doi', so_vang: 30 }, { sbd: 'D', loai: 'doi', so_vang: 50 }, { sbd: 'E', loai: 'doi', so_vang: 55 }])
    // Cược đóng: không còn 'dang', không dòng hoàn / thắng.
    expect(d.sql.prepare("SELECT trang_thai FROM cuoc_chuoi WHERE em = 'A'").get()).toEqual({ trang_thai: 'thua' })
    expect((d.sql.prepare("SELECT COUNT(*) AS n FROM vang_so WHERE khoa_yeu_cau LIKE 'tt|cuoc|%|thang'").get() as { n: number }).n).toBe(0)
    const tb = d.sql.prepare("SELECT em, du_lieu FROM thong_bao_thuong WHERE loai = 'dat_lai_tt' ORDER BY em").all() as { em: string; du_lieu: string }[]
    expect(tb.map((x) => [x.em, JSON.parse(x.du_lieu)])).toEqual([['A', { conLai: 50, cuocHuy: true }], ['B', { conLai: 50, cuocHuy: false }], ['C', { conLai: 50, cuocHuy: false }], ['D', { conLai: 50, cuocHuy: false }]])
    // Chạy lại: không ghi thêm (khoá duy nhất), vẫn 50.
    vi.resetModules()
    const lai = await chay({ GHI: 'ghi', BAN_SAO: join(thu, 'lai.json') })
    expect(lai.find((x) => x.buoc === 'sau')).toMatchObject({ dongDieuChinh: 0, thongBao: 0 })
    expect(soDu(d)).toEqual({ A: 50, B: 50, C: 50, D: 50, E: 50 })
  })
  it('có ca thi mở ⇒ DỪNG, không ghi, không bản sao', async () => {
    const d = kho()
    gia(d, HEAD, 1)
    const thu = mkdtempSync(join(tmpdir(), 'tt-'))
    await expect(chay({ GHI: 'ghi', BAN_SAO: join(thu, 'x.json') })).rejects.toThrow(/ca thi mở/)
    expect(soDu(d)).toEqual({ A: 250, B: 20, C: 50, E: -5 })
    expect(existsSync(join(thu, 'x.json'))).toBe(false)
  })
  it('Worker sống chưa có commit ⇒ DỪNG, không ghi', async () => {
    const d = kho()
    gia(d, execFileSync('git', ['rev-parse', 'HEAD~1']).toString().trim())
    await expect(chay({ GHI: 'ghi', BAN_SAO: join(tmpdir(), 'y.json') })).rejects.toThrow(/CHƯA có commit/)
    expect(soDu(d)).toEqual({ A: 250, B: 20, C: 50, E: -5 })
  })
})
