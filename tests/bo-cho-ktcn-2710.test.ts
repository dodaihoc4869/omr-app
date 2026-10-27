// @vitest-environment node
import { readFileSync } from 'node:fs'
import { describe, expect, it, vi } from 'vitest'
import { quyetDinhChoKtcn, shaWorkerSong, tepDoiTu } from '../scripts/bo-cho-ktcn.mjs'
import { apSchemaHoiThay } from '../scripts/hoi-thay-van-hanh.mjs'

const lan = JSON.parse(readFileSync('scripts/lan-ktcn.json', 'utf8'))
const song = 'a'.repeat(40)

describe('27/10 thầy duyệt: không chờ chặng kiểm tra cá nhân nếu bản mới không đụng làn kiểm tra', () => {
  it('đổi tệp giao diện / máy chủ ngoài làn ⇒ không chờ, in số tệp', () => {
    const kq = quyetDinhChoKtcn({ song, doi: ['src/components/hoc-tap/ManLamBaiTap.tsx', 'src/styles/trong-hs.css', 'server/src/chuoi-ngay-bai.ts', 'server/src/thuong-giai-tuan.ts', 'scripts/ap-migration-hoi-thay.ts'], lan })
    expect(kq).toMatchObject({ cho: false, lyDo: 'Bỏ chờ KTCN: 5 tệp đổi, 0 tệp thuộc làn kiểm tra.' })
  })
  it('đổi tệp làn kiểm tra cá nhân / ca thi / phần chấm ⇒ chờ, nêu tên tệp', () => {
    for (const f of ['server/src/kiem-tra-ca-nhan.ts', 'server/src/goi-bai-7.ts', 'server/src/index.ts', 'server/src/goi-cu.ts', 'src/game/than-thu-v2/core.ts', 'src/lib/cham-so.ts']) {
      const kq = quyetDinhChoKtcn({ song, doi: ['src/App.tsx', f], lan })
      expect(kq.cho).toBe(true)
      expect(kq.lyDo).toContain(f)
      expect(kq.lyDo).not.toContain('src/App.tsx')
    }
  })
  it('đổi migration / schema / wrangler ⇒ chờ', () => {
    for (const f of ['server/src/hoi-thay-kiem-chung-schema.ts', 'server/migrations/0042_them.sql', 'scripts/ap-migration-thuong-2610.mjs', 'server/wrangler.toml', 'wrangler.toml']) {
      expect(quyetDinhChoKtcn({ song, doi: [f], lan }).cho).toBe(true)
    }
  })
  it('không rõ commit sống / không so được / thiếu danh sách làn ⇒ chờ', () => {
    for (const s of [null, undefined, '', 'abc', 'Z'.repeat(40)]) expect(quyetDinhChoKtcn({ song: s, doi: [], lan }).cho).toBe(true)
    expect(quyetDinhChoKtcn({ song, doi: null, lan }).cho).toBe(true)
    expect(quyetDinhChoKtcn({ song, doi: ['src/App.tsx'], lan: null }).cho).toBe(true)
    expect(quyetDinhChoKtcn({ song, doi: ['src/App.tsx'], lan: { tep: [], mauSchema: [] } }).cho).toBe(true)
  })
  it('đọc commit sống từ nhãn workers/tag bản 100%; lỗi / chia bản / nhãn hỏng ⇒ null', async () => {
    const tra = (o: unknown, ok = true) => ({ ok, json: async () => ({ success: ok, result: o }) })
    const mot = (versions: unknown[], tag: unknown) => vi.fn(async (url: string) => (url.endsWith('/deployments') ? tra({ deployments: [{ versions }] }) : tra({ annotations: { 'workers/tag': tag } })))
    expect(await shaWorkerSong({ token: 't', account: 'a', layVe: mot([{ version_id: 'v', percentage: 100 }], song) as never })).toBe(song)
    expect(await shaWorkerSong({ token: 't', account: 'a', layVe: mot([{ version_id: 'v', percentage: 60 }, { version_id: 'w', percentage: 40 }], song) as never })).toBeNull()
    expect(await shaWorkerSong({ token: 't', account: 'a', layVe: mot([{ version_id: 'v', percentage: 100 }], 'main') as never })).toBeNull()
    expect(await shaWorkerSong({ token: 't', account: 'a', layVe: vi.fn(async () => tra(null, false)) as never })).toBeNull()
    expect(await shaWorkerSong({ token: 't', account: 'a', layVe: vi.fn(async () => { throw new Error('mạng') }) as never })).toBeNull()
  })
  it('lấy tệp đổi bằng git; lấy commit về khi chưa có; git lỗi ⇒ null', () => {
    const git = vi.fn((a: string[]) => { if (a[0] === 'cat-file') throw new Error('chưa có'); return a[0] === 'diff' ? 'src/a.ts\nserver/src/b.ts\n' : '' })
    expect(tepDoiTu(song, { git })).toEqual(['src/a.ts', 'server/src/b.ts'])
    expect(git.mock.calls.map((c) => c[0][0])).toEqual(['cat-file', 'fetch', 'diff'])
    expect(tepDoiTu(song, { git: () => { throw new Error('x') } })).toBeNull()
    expect(tepDoiTu(null)).toBeNull()
  })
  it('bỏ chờ ⇒ không đếm chặng, vẫn áp DDL chỉ-thêm; không bỏ chờ ⇒ còn chặng thì dừng như cũ', async () => {
    const ddl = ['CREATE TABLE IF NOT EXISTS hoi_thay_kiem (id TEXT PRIMARY KEY)']
    const q = vi.fn(async (sql: string) => (String(sql).includes('kiem_tra_ca_nhan_chang') ? [{ n: 7 }] : []))
    expect(await apSchemaHoiThay(q, ddl, { boChoKtcn: true })).toMatchObject({ schemaHoiThay: true, boChoKtcn: true })
    expect(q.mock.calls.map((c) => c[0])).toEqual(ddl)
    await expect(apSchemaHoiThay(q, ddl, { boChoKtcn: false })).rejects.toThrow('dừng phát hành')
  })
})
