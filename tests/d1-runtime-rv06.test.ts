// RV06 — BẰNG CHỨNG TRÊN **RUNTIME D1 THẬT** (workerd qua `@cloudflare/vitest-pool-workers`), dữ liệu TỔNG HỢP.
//
// Khác `tests/_d1-that.ts` (Node SQLite trong bộ nhớ): bộ này chạy trong isolate workerd và dùng binding D1
// thật của runtime ⇒ kiểm được ĐỒNG THỜI ở tầng runtime (nhiều lời gọi async chồng nhau), CAS thật, đúng
// ngữ nghĩa D1. KHÔNG kết nối production, KHÔNG dùng dữ liệu thật, KHÔNG deploy.
//
// Chạy: `npm run test:d1` (config `vitest.config.d1.ts` + `wrangler.d1-test.toml`).
import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { docTheoNhom, giuCho, nhaCho } from '../server/src/giu-cho'
import type { Env } from '../server/src/kieu'

const ENV = env as unknown as Env
const DB = ENV.DB
const NGAY = '2026-09-23'
const T0 = Date.parse('2026-09-23T16:59:00Z') // 23:59 giờ VN ngày 23/09

/**
 * Tách một tệp SQL thành các CÂU LỆNH riêng (bỏ dòng chú thích `--`) — vì D1 `exec` xử lý theo dòng và từ chối
 * dòng chỉ có chú thích. Chạy từng câu bằng `batch` (một giao dịch) cho đúng ngữ nghĩa D1.
 */
function tachCau(sql: string): string[] {
  const sach = sql
    .replace(/\/\*[\s\S]*?\*\//g, '\n') // khối chú thích
    .split('\n')
    .filter((l) => !/^\s*--/.test(l)) // dòng chú thích
    .map((l) => l.replace(/\s--.*$/, '')) // chú thích cuối dòng
    .join('\n')
  return sach
    .split(/;\s*(?:\n|$)/)
    .map((s) => s.trim())
    .filter((s) => /[A-Za-z]/.test(s)) // bỏ mảnh rỗng/chỉ còn khoảng trắng
}

/** Nạp lược đồ + MỌI migration (SQL đọc ở phía Node trong `vitest.config.d1.ts` rồi truyền qua binding). */
async function napLuocDo(): Promise<void> {
  const ds = (env as unknown as { LUOC_DO_SQL: string[] }).LUOC_DO_SQL
  for (const sql of ds) {
    const cau = tachCau(sql)
    for (let i = 0; i < cau.length; i += 50) {
      await DB.batch(cau.slice(i, i + 50).map((c) => DB.prepare(c)))
    }
  }
  // LỆCH LƯỢC ĐỒ giữa repo và môi trường đang chạy (ghi nhận 19–21/09, xem `tests/_d1-that.ts`): vài cột có
  // trên môi trường thật nhưng không tệp migration nào tạo. Thêm nếu THIẾU (idempotent) để câu SQL của máy chủ
  // chạy được; đây là dữ liệu TỔNG HỢP, không phải migration production.
  const cotCa = new Set((await DB.prepare("SELECT name FROM pragma_table_info('ca')").all<{ name: string }>()).results.map((x) => x.name))
  for (const c of ['pham_vi', 'danh_sach_chon_json', 'mat_khau', 'de_rieng', 'pham_vi_hoi_lai']) {
    if (!cotCa.has(c)) await DB.prepare(`ALTER TABLE ca ADD COLUMN ${c} TEXT`).run()
  }
  const cotCauHoi = new Set((await DB.prepare("SELECT name FROM pragma_table_info('cau_hoi_em')").all<{ name: string }>()).results.map((x) => x.name))
  if (!cotCauHoi.has('da_xoa')) await DB.prepare('ALTER TABLE cau_hoi_em ADD COLUMN da_xoa INTEGER NOT NULL DEFAULT 0').run()
}

const xoaSach = async (): Promise<void> => {
  await DB.prepare('DELETE FROM giu_cho').run()
}

describe('RV06 — RUNTIME D1 THẬT (workerd), dữ liệu tổng hợp', () => {
  beforeAll(async () => {
    await napLuocDo()
  })

  it('8 lời gọi ĐỒNG THỜI cùng một đơn vị nội dung ⇒ ĐÚNG MỘT thắng, DB còn MỘT dòng', async () => {
    await xoaSach()
    const nhom = new Map([['Q1', 'CG1']])
    const ketQua = await Promise.all(
      Array.from({ length: 8 }, (_, i) =>
        giuCho(ENV, { sbd: 'S1', ngay: NGAY, taskId: `T${i}`, qids: ['Q1'], nowMs: T0, nhomTheoQid: nhom, hanTaskGiay: 7200 }),
      ),
    )
    const thang = ketQua.flatMap((r) => r.thang)
    expect(thang).toEqual(['Q1'])
    const dem = await DB.prepare("SELECT COUNT(*) AS n FROM giu_cho WHERE sbd='S1' AND content_group='CG1'").first<{ n: number }>()
    expect(Number(dem?.n)).toBe(1)
    // Bảy lượt thua phải được chỉ ĐÚNG nhiệm vụ đang giữ (để RESUME, không phát mới).
    const chuSoHuu = new Set(ketQua.filter((r) => r.thua.length).map((r) => r.dangMo.get('Q1')))
    expect(chuSoHuu.size).toBe(1)
    expect(ketQua.filter((r) => r.thua.length).every((r) => r.thua.length === 1)).toBe(true)
  })

  it('RV01-followup trên runtime D1: đơn vị đang phát giữ nguyên QUA NỬA ĐÊM VN', async () => {
    await xoaSach()
    const nhom = new Map([['Q1', 'GCROSS'], ['Q2', 'GCROSS']])
    const a = await giuCho(ENV, { sbd: 'S1', ngay: '2026-09-23', taskId: 'A', qids: ['Q1'], nowMs: T0, nhomTheoQid: nhom, hanTaskGiay: 24 * 3600 })
    expect(a.thang).toEqual(['Q1'])
    const b = await giuCho(ENV, { sbd: 'S1', ngay: '2026-09-24', taskId: 'B', qids: ['Q2'], nowMs: T0 + 120_000, nhomTheoQid: nhom, hanTaskGiay: 24 * 3600 })
    expect(b.thang).toEqual([])
    expect(b.dangMo.get('Q2')).toBe('A')
    const dem = await DB.prepare("SELECT COUNT(*) AS n FROM giu_cho WHERE sbd='S1' AND content_group='GCROSS'").first<{ n: number }>()
    expect(Number(dem?.n)).toBe(1)
  })

  it('RV02-followup trên runtime D1: chủ đổi giữa hai lượt ⇒ gia hạn KHÔNG báo thắng, không ghi đè chủ', async () => {
    await xoaSach()
    const nhom = new Map([['Q1', 'GCAS']])
    await giuCho(ENV, { sbd: 'S1', ngay: NGAY, taskId: 'A', qids: ['Q1'], nowMs: T0, nhomTheoQid: nhom, hanTaskGiay: 7200 })
    // "Thiết bị khác" tiếp quản hợp lệ sau khi nhiệm vụ A đã hết hạn.
    const sau = T0 + 8000_000
    const moi = await giuCho(ENV, { sbd: 'S1', ngay: NGAY, taskId: 'OWNER-MOI', qids: ['Q1'], nowMs: sau, nhomTheoQid: nhom, hanTaskGiay: 7200 })
    expect(moi.thang).toEqual(['Q1'])
    // A gọi lại (revision cũ) ⇒ KHÔNG báo thắng, KHÔNG ghi đè chủ mới, KHÔNG hồi sinh task đã hết hạn.
    const aLai = await giuCho(ENV, { sbd: 'S1', ngay: NGAY, taskId: 'A', qids: ['Q1'], nowMs: sau + 1000, nhomTheoQid: nhom, hanTaskGiay: 7200, revision: 1 })
    expect(aLai.thang).toEqual([])
    const row = await docTheoNhom(ENV, 'S1', 'GCAS')
    expect(row!.taskId).toBe('OWNER-MOI')
  })

  it('cùng chủ gọi lại ⇒ GIA HẠN (không sinh dòng mới) và `het_han_task` KHÔNG đổi', async () => {
    await xoaSach()
    const nhom = new Map([['Q1', 'CGIDEM']])
    await giuCho(ENV, { sbd: 'S1', ngay: NGAY, taskId: 'T', qids: ['Q1'], nowMs: T0, hanGiay: 60, hanTaskGiay: 7200, nhomTheoQid: nhom })
    const truoc = await DB.prepare("SELECT het_han_task, revision FROM giu_cho WHERE sbd='S1' AND content_group='CGIDEM'").first<{ het_han_task: number; revision: number }>()
    const lai = await giuCho(ENV, { sbd: 'S1', ngay: NGAY, taskId: 'T', qids: ['Q1'], nowMs: T0 + 30_000, hanGiay: 900, hanTaskGiay: 7200, nhomTheoQid: nhom, revision: Number(truoc!.revision) })
    expect(lai.thang).toEqual(['Q1'])
    const sau = await DB.prepare("SELECT het_han_task, lease_until FROM giu_cho WHERE sbd='S1' AND content_group='CGIDEM'").first<{ het_han_task: number; lease_until: number }>()
    expect(Number(sau!.het_han_task)).toBe(Number(truoc!.het_han_task)) // hạn nộp đã chốt KHÔNG bị kéo dài
    expect(Number(sau!.lease_until)).toBe(T0 + 30_000 + 900 * 1000)
  })

  it('nhả chỗ khi lượt kết thúc: chỉ nhả phần của CHÍNH task, xuyên ngày', async () => {
    await xoaSach()
    const nhom = new Map([['Q1', 'GA'], ['Q2', 'GB']])
    await giuCho(ENV, { sbd: 'S1', ngay: NGAY, taskId: 'T1', qids: ['Q1'], nowMs: T0, nhomTheoQid: nhom, hanTaskGiay: 7200 })
    await giuCho(ENV, { sbd: 'S1', ngay: '2026-09-24', taskId: 'T2', qids: ['Q2'], nowMs: T0 + 120_000, nhomTheoQid: nhom, hanTaskGiay: 7200 })
    expect(await nhaCho(ENV, 'S1', 'T1')).toBe(1) // nhả xuyên ngày, không lọc theo `ngay`
    const conLai = await DB.prepare("SELECT content_group FROM giu_cho WHERE sbd='S1'").all<{ content_group: string }>()
    expect((conLai.results ?? []).map((x) => x.content_group)).toEqual(['GB'])
  })
})
