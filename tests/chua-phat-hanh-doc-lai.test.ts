// @vitest-environment node
// Chạy nguyên CLI với phản hồi API tổng hợp; không gọi D1 production.
import { afterEach, describe, expect, it } from 'vitest'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
const dirs: string[] = [], SHA = 'a'.repeat(40)
afterEach(() => { for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true }) })
function chay(config = { bat: true, phamVi: 'tat_ca', dongBoTuLuyen: true }, receipt: Record<string, unknown> = { tuXong: true, giaoXong: true, release: SHA }, ca = {so_ca_mo:0,so_luot_dang_lam:0}, duyet = 0, den = '', now = '2026-10-09T10:35:00Z') {
  const dir = mkdtempSync(join(tmpdir(), 'chua-doc-lai-')); dirs.push(dir)
  const preload = join(dir, 'api.mjs')
  writeFileSync(preload, `
    const fixture=JSON.parse(process.env.CHUA_TEST_API);
    Date.now=()=>Date.parse(fixture.now);
    globalThis.fetch=async (url, options)=>{
      const sql=JSON.parse(options.body).sql;
      let rows;
      if(sql.includes('AS so_ca_mo'))rows=[fixture.ca];
      else if(sql.includes("julianday(bat_dau)="))rows=[{n:fixture.duyet}];
      else if(sql.includes('pragma_table_info'))rows=['assistance','purpose','visibility','raw_json'].map(name=>({name}));
      else if(sql.includes('FROM cau_hinh'))rows=[{khoa:'chua_cau_sai_v1',gia_tri:JSON.stringify(fixture.config)},{khoa:'chua_cau_sai_phat_hanh_0710',gia_tri:JSON.stringify(fixture.receipt)}];
      else if(sql.includes('COUNT(DISTINCT sbd)'))rows=[{soDot:5,soEm:2,soCau:3}];
      else throw Error('API ngoài fixture');
      return Response.json({success:true,result:[{success:true,results:rows}]});
    };
  `)
  return spawnSync(process.execPath, ['--import', preload, resolve('scripts/kiem-phat-hanh-chua.mjs'), '--enabled'], {
    encoding: 'utf8', env: { ...process.env, CLOUDFLARE_API_TOKEN: 'test', CLOUDFLARE_ACCOUNT_ID: 'test', CHUA_RELEASE_SHA: SHA, CHUA_CA_CHO_DUOC_DUYET_DEN:den, CHUA_TEST_API: JSON.stringify({ config, receipt, ca, duyet, now }) },
  })
}
describe('CLI đọc lại toàn trường sau đồng bộ', () => {
  it('không dùng lại quyền một lần sau ca: ca mở hoặc lượt đang làm luôn chặn', () => {
    const den='2026-10-09T10:45:00Z'
    expect(chay(undefined,undefined,{so_ca_mo:1,so_luot_dang_lam:0},1,den).status).not.toBe(0)
    expect(chay(undefined,undefined,{so_ca_mo:0,so_luot_dang_lam:1},0,den).status).not.toBe(0)
    expect(chay(undefined,undefined,{so_ca_mo:1,so_luot_dang_lam:1},1,den).status).not.toBe(0)
    expect(chay(undefined,undefined,{so_ca_mo:2,so_luot_dang_lam:0},1,den).status).not.toBe(0)
    expect(chay(undefined,undefined,{so_ca_mo:1,so_luot_dang_lam:0},0,den).status).not.toBe(0)
    expect(chay(undefined,undefined,{so_ca_mo:1,so_luot_dang_lam:0},1,den,'2026-10-09T10:45:00Z').status).not.toBe(0)
    expect(chay(undefined,undefined,{so_ca_mo:1,so_luot_dang_lam:0},1).status).not.toBe(0)
  })
  it('chỉ báo hoàn tất khi cờ và hai receipt đúng bản sống', () => {
    const r = chay()
    expect(r.status).toBe(0)
    expect(r.stdout).toContain('"tuCuHoanTat":true,"giaoCuHoanTat":true')
    expect(r.stdout).toContain('"soDot":5,"soEm":2,"soCau":3')
  })
  it('tiếp từ bản cũ dùng releaseHienTai, giữ release đầu', () => {
    expect(chay(undefined, { tuXong: true, giaoXong: true, release: 'b'.repeat(40), releaseHienTai: SHA }).status).toBe(0)
  })
  it.each([
    { bat: false, phamVi: 'tat_ca', dongBoTuLuyen: true },
    { bat: true, phamVi: 'pilot', dongBoTuLuyen: true },
    { bat: true, phamVi: 'tat_ca', dongBoTuLuyen: false },
  ])('không báo hoàn tất nếu cấu hình thay đổi %j', config => {
    const r = chay(config)
    expect(r.status).not.toBe(0)
    expect(r.stdout).not.toContain('"giaoCuHoanTat":true')
  })
  it.each([
    { tuXong: false, giaoXong: true, release: SHA },
    { tuXong: true, giaoXong: false, release: SHA },
    { tuXong: true, giaoXong: true, release: 'b'.repeat(40) },
    {},
  ])('không báo hoàn tất nếu receipt thiếu/sai %j', receipt => {
    const r = chay(undefined, receipt)
    expect(r.status).not.toBe(0)
    expect(r.stdout).not.toContain('"tuCuHoanTat":true')
  })
})
