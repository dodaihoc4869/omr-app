// HẠN MỀM VÒNG 2 CHO BTVN CHIA VÒNG (KIEM-TRA-VONG-2.md).
//
// Ba lớp kiểm: hàm thuần tính hạn (không đụng đồng hồ thật), đường máy chủ
// `/btvn/xong-vong` (idempotent — gọi lại không đổi mốc), và trợ lý bảng tin
// chỉ sinh MỘT ô theo trạng thái, không bao giờ cả Vòng 1 lẫn Vòng 2.
import { describe, it, expect } from 'vitest'
import worker from '../server/src/index'
import { tinhHanVong2 } from '../src/lib/han-bai-tap'
import { tongHopKeHoachTroLy } from '../src/lib/tro-ly-ca-nhan'
import type { Env } from '../server/src/kieu'

describe('tinhHanVong2 (src/lib/han-bai-tap.ts) — hạn mềm, không đụng Date.now()', () => {
  it('còn hơn 24 giờ tới hạn chung: hạn Vòng 2 = xong Vòng 1 + 24 giờ', () => {
    expect(tinhHanVong2('2026-09-18T12:00:00Z', '2026-09-20T12:00:00Z')).toBe('2026-09-19T12:00:00.000Z')
  })
  it('còn dưới 24 giờ tới hạn chung: hạn Vòng 2 không vượt hạn chung', () => {
    expect(tinhHanVong2('2026-09-19T20:00:00Z', '2026-09-20T12:00:00Z')).toBe('2026-09-20T12:00:00.000Z')
  })
  it('mốc xong Vòng 1 rỗng hoặc hỏng: trả nguyên hạn chung, không bịa', () => {
    expect(tinhHanVong2('', '2026-09-20T12:00:00Z')).toBe('2026-09-20T12:00:00Z')
    expect(tinhHanVong2('khong-hop-le', '2026-09-20T12:00:00Z')).toBe('2026-09-20T12:00:00Z')
  })
})

describe('/btvn/xong-vong (server/src/index.ts) — chỉ ghi mốc lần đầu', () => {
  function setup() {
    const row: { khoa: string; xong_vong1_luc: string | null } = { khoa: 'BT|1', xong_vong1_luc: null }
    const env = {
      DB: {
        prepare: (sql: string) => ({
          bind: (...a: unknown[]) => ({
            run: async () => {
              if (!sql.includes('UPDATE btvn_em')) return { meta: { changes: 0 } }
              const [luc, khoa] = a as [string, string]
              if (khoa !== row.khoa) return { meta: { changes: 0 } }
              // Mô phỏng đúng COALESCE(xong_vong1_luc, ?) của SQL thật.
              row.xong_vong1_luc = row.xong_vong1_luc ?? luc
              return { meta: { changes: 1 } }
            },
            first: async () => (sql.includes('SELECT xong_vong1_luc') ? { xong_vong1_luc: row.xong_vong1_luc } : null),
          }),
        }),
      },
    } as unknown as Env
    return { env, row }
  }

  it('gọi 2 lần cách nhau cho cùng maBtvn|sbd vẫn ra đúng một mốc', async () => {
    const { env } = setup()
    const goi = () =>
      worker
        .fetch(
          new Request('https://test/btvn/xong-vong', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ maBtvn: 'BT', sbd: '1', vong: 1 }),
          }),
          env,
        )
        .then((r) => r.json() as Promise<{ ok: boolean; xongVong1Luc?: string }>)

    const j1 = await goi()
    expect(j1.ok).toBe(true)
    expect(typeof j1.xongVong1Luc).toBe('string')

    await new Promise((r) => setTimeout(r, 5))
    const j2 = await goi()
    expect(j2.ok).toBe(true)
    expect(j2.xongVong1Luc).toBe(j1.xongVong1Luc)
  })

  it('không khớp bài tập của em (khoá sai) thì báo lỗi, không ghi mốc', async () => {
    const { env, row } = setup()
    const r = await worker.fetch(
      new Request('https://test/btvn/xong-vong', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ maBtvn: 'BT', sbd: 'khong-co', vong: 1 }),
      }),
      env,
    )
    expect((await r.json() as { ok: boolean }).ok).toBe(false)
    expect(row.xong_vong1_luc).toBeNull()
  })

  it('thiếu vong hoặc vong khác 1 thì từ chối', async () => {
    const { env } = setup()
    const r = await worker.fetch(
      new Request('https://test/btvn/xong-vong', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ maBtvn: 'BT', sbd: '1' }),
      }),
      env,
    )
    expect((await r.json() as { ok: boolean }).ok).toBe(false)
  })
})

describe('tongHopKeHoachTroLy (src/lib/tro-ly-ca-nhan.ts) — một ô theo đúng trạng thái Vòng', () => {
  const now = Date.parse('2026-09-19T12:00:00Z')
  const plan = (dsBtvn: Record<string, unknown>[]) =>
    tongHopKeHoachTroLy({ sbd: 'HS1', hoTen: 'Em', dsBtvn, dsMomGiao: [], dsLichSu: [], tongCauSai: 0, now })

  it('chưa xong Vòng 1: chỉ có ô Vòng 1, hạn là hạn chung (như trước khi có tính năng)', () => {
    const kq = plan([{ maBtvn: 'B1', soCau: 16, hanNop: new Date(now + 48 * 3600_000).toISOString(), daNop: false }])
    const v1 = kq.top3.filter((t) => t.loai === 'btvn_vong1')
    const v2 = kq.top3.filter((t) => t.loai === 'btvn_vong2')
    expect(v1.length).toBe(1)
    expect(v2.length).toBe(0)
    expect(v1[0].hanNop).toBe(new Date(now + 48 * 3600_000).toISOString())
  })

  it('đã xong Vòng 1, chưa nộp, chưa có hanVong2 từ máy chủ: tự tính bằng tinhHanVong2, chỉ có ô Vòng 2', () => {
    const xongVong1Luc = new Date(now - 3600_000).toISOString() // xong cách đây 1 giờ
    const hanNop = new Date(now + 240 * 3600_000).toISOString() // hạn chung còn rất xa
    const kq = plan([{ maBtvn: 'B2', soCau: 16, hanNop, daNop: false, xongVong1Luc }])
    const v1 = kq.top3.filter((t) => t.loai === 'btvn_vong1')
    const v2 = kq.top3.filter((t) => t.loai === 'btvn_vong2')
    expect(v1.length).toBe(0)
    expect(v2.length).toBe(1)
    expect(v2[0].hanNop).toBe(new Date(Date.parse(xongVong1Luc) + 24 * 3600_000).toISOString())
    expect(v2[0].hanhDong.payload?.vong).toBe(2)
    expect(v2[0].hanhDong.nhanNut).toBe('Làm Vòng 2')
  })

  it('máy chủ đã tính sẵn hanVong2: dùng thẳng, không tính lại', () => {
    const hanVong2 = new Date(now + 5 * 3600_000).toISOString()
    const kq = plan([
      {
        maBtvn: 'B3',
        soCau: 16,
        hanNop: new Date(now + 240 * 3600_000).toISOString(),
        daNop: false,
        xongVong1Luc: new Date(now - 3600_000).toISOString(),
        hanVong2,
      },
    ])
    const v2 = kq.top3.filter((t) => t.loai === 'btvn_vong2')
    expect(v2.length).toBe(1)
    expect(v2[0].hanNop).toBe(hanVong2)
  })

  it('đã nộp bài: không còn ô Vòng 1 lẫn Vòng 2 cho bài đó, dù đã từng xong Vòng 1', () => {
    const kq = plan([
      {
        maBtvn: 'B4',
        soCau: 16,
        hanNop: new Date(now + 240 * 3600_000).toISOString(),
        daNop: true,
        xongVong1Luc: new Date(now - 3600_000).toISOString(),
      },
    ])
    expect(kq.top3.some((t) => t.hanhDong.payload?.bt?.maBtvn === 'B4')).toBe(false)
  })

  it('quá mốc Vòng 2 nhưng chưa quá hạn chung: ô vẫn hiện, báo quá mốc, không tính là quá hạn thật', () => {
    const xongVong1Luc = new Date(now - 25 * 3600_000).toISOString() // xong cách đây 25 giờ -> mốc V2 đã qua 1 giờ
    const hanNop = new Date(now + 240 * 3600_000).toISOString() // hạn chung còn rất xa
    const kq = plan([{ maBtvn: 'B5', soCau: 16, hanNop, daNop: false, xongVong1Luc }])
    const v2 = kq.top3.filter((t) => t.loai === 'btvn_vong2')
    expect(v2.length).toBe(1)
    expect(v2[0].conLaiChu).toBe('Đã quá mốc Vòng 2')
    expect(v2[0].moTa).toContain('Đã quá mốc Vòng 2')
    expect(v2[0].moTa).toContain('vẫn nộp được trước')
    // Không bị coi là quá hạn cứng: máy chủ chặn theo hanNop cứng — hạn Vòng 2
    // ("Vòng 2" trong radar) không được đếm vào radarDeadline.quaHan.
    expect(kq.radarDeadline.quaHan).toBe(0)
  })
})
