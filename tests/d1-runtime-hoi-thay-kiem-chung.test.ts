// workerd/D1 cục bộ, dữ liệu tổng hợp: kiểm chứng giao dịch/đồng thời, không kết nối production.
import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import type { Env } from '../server/src/kieu'
import { seedChua, Q } from './_chua-cau-sai-fixture'
import { hsMoKiemHoiThay, hsNopKiemHoiThay } from '../server/src/hoi-thay-kiem-chung'

const E = { ...(env as unknown as Env), MA_BI_MAT: 'bi-mat-kiem-thu-cuc-bo' } as Env
let token = '', phienId = '', dapAn = '', requestId = ''
beforeAll(async () => {
  for (const sql of (env as unknown as { LUOC_DO_SQL: string[] }).LUOC_DO_SQL) {
    const ds = sql.replace(/\/\*[\s\S]*?\*\//g, '').split('\n').filter(l => !/^\s*--/.test(l))
      .map(l => l.replace(/\s--.*$/, '')).join('\n').split(/;\s*(?:\n|$)/).map(s => s.trim()).filter(Boolean)
    for (let i = 0; i < ds.length; i += 50) await E.DB.batch(ds.slice(i, i + 50).map(s => E.DB.prepare(s)))
  }
  const cot = new Set((await E.DB.prepare("SELECT name FROM pragma_table_info('ca')").all<{ name: string }>()).results.map(x => x.name))
  for (const c of ['pham_vi', 'danh_sach_chon_json', 'mat_khau', 'de_rieng', 'pham_vi_hoi_lai']) if (!cot.has(c)) await E.DB.prepare(`ALTER TABLE ca ADD COLUMN ${c} TEXT`).run()
  token = await seedChua(E)
})

describe('Hỏi thầy trên runtime workerd/D1', () => {
  it('8 mở đồng thời tạo đúng một session không đáp án', async () => {
    const rs = await Promise.all(Array.from({ length: 8 }, () => hsMoKiemHoiThay(E, { token, qid: Q })))
    expect(rs.every(r => r.ok)).toBe(true)
    expect(new Set(rs.map(r => r.phienId)).size).toBe(1)
    phienId = String(rs[0].phienId)
    expect(JSON.stringify(rs)).not.toMatch(/"(?:correct|solution|snapshot_json|dapAn|reviewed)"/)
    const row = await E.DB.prepare('SELECT snapshot_json FROM hoi_thay_kiem WHERE id=?').bind(phienId).first<{ snapshot_json: string }>()
    dapAn = JSON.parse(row!.snapshot_json).q.correct
    expect((await E.DB.prepare('SELECT COUNT(*) n FROM hoi_thay_kiem').first<{ n: number }>())!.n).toBe(1)
  })
  it('8 nộp cạnh tranh giữ một biên nhận và một sự kiện (cùng giao dịch D1)', async () => {
    const rs = await Promise.all(Array.from({ length: 8 }, (_, i) => hsNopKiemHoiThay(E, { token, phienId, attemptId: `runtime-ht-${i}`, traLoi: i === 0 ? dapAn : '999' })))
    expect(rs.filter(r => r.ok && !r.idempotent).length).toBe(1)
    expect((await E.DB.prepare("SELECT COUNT(*) n FROM hoi_thay_kiem WHERE trang_thai='da_nop'").first<{ n: number }>())!.n).toBe(1)
    expect((await E.DB.prepare("SELECT COUNT(*) n FROM su_kien_hoc WHERE nguon='chua_loi'").first<{ n: number }>())!.n).toBe(1)
    requestId = (await E.DB.prepare('SELECT attempt_id FROM hoi_thay_kiem WHERE id=?').bind(phienId).first<{ attempt_id: string }>())!.attempt_id
  })
  it('phát lại sau mất phản hồi trả nguyên receipt, không nhân đôi tiến độ', async () => {
    const row = await E.DB.prepare('SELECT tra_loi,response_json FROM hoi_thay_kiem WHERE id=?').bind(phienId).first<{ tra_loi: string; response_json: string }>()
    const r = await hsNopKiemHoiThay(E, { token, phienId, attemptId: requestId, traLoi: row!.tra_loi })
    expect(r).toEqual({ ...JSON.parse(row!.response_json), idempotent: true })
    expect((await E.DB.prepare("SELECT COUNT(*) n FROM su_kien_hoc WHERE nguon='chua_loi'").first<{ n: number }>())!.n).toBe(1)
  })
})
