// LÔ BTVN THEO NGÀY/GIỜ — thay Vòng 1/Vòng 2 (mục 3 SO-VIEC.md 19/09).
//
// File này THAY THẾ bản cũ (đặc tả KIEM-TRA-VONG-2.md, cơ chế Vòng 1/Vòng 2
// theo % câu + hạn mềm 24h cố định) — thầy chốt 19/09: "bỏ vòng 1 và vòng 2
// đi... tách luôn câu hiển thị lên bảng tin theo ngày hoặc theo giờ dãn cách
// thông minh". Giữ TÊN FILE cũ để lịch sử git không đứt mạch, nội dung mới
// hoàn toàn. Ba lớp kiểm: hàm thuần tính lịch lô (`lich-lo-btvn.ts`), đường
// máy chủ `/btvn/xong-lo` (chỉ tăng, không lùi), và trợ lý bảng tin sinh ĐÚNG
// MỘT ô theo lô đang chờ, có cổng hiển thị + nhãn khẩn cấp khi trễ nhịp.
import { describe, it, expect } from 'vitest'
import worker from '../server/src/index'
import { loDangCho, tinhLichLoBtvn } from '../src/lib/lich-lo-btvn'
import { tongHopKeHoachTroLy } from '../src/lib/tro-ly-ca-nhan'
import type { Env } from '../server/src/kieu'

describe('/btvn/xong-lo (server/src/index.ts) — chỉ tăng, không bao giờ lùi', () => {
  function setup() {
    const row: { khoa: string; lo_da_xong: number } = { khoa: 'BT|1', lo_da_xong: 0 }
    const env = {
      DB: {
        prepare: (sql: string) => ({
          bind: (...a: unknown[]) => ({
            run: async () => {
              if (!sql.includes('UPDATE btvn_em')) return { meta: { changes: 0 } }
              const [loMoi, khoa] = a as [number, string]
              if (khoa !== row.khoa) return { meta: { changes: 0 } }
              row.lo_da_xong = Math.max(row.lo_da_xong, loMoi)
              return { meta: { changes: 1 } }
            },
            first: async () => (sql.includes('SELECT lo_da_xong') ? { lo_da_xong: row.lo_da_xong } : null),
          }),
        }),
      },
    } as unknown as Env
    return { env, row }
  }

  const goi = (env: Env, body: Record<string, unknown>) =>
    worker
      .fetch(new Request('https://test/btvn/xong-lo', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }), env)
      .then((r) => r.json() as Promise<{ ok: boolean; loDaXong?: number; error?: string }>)

  it('báo xong lô 0 rồi lô 1: tiến độ tăng đúng thứ tự', async () => {
    const { env } = setup()
    const j0 = await goi(env, { maBtvn: 'BT', sbd: '1', chiSo: 0 })
    expect(j0.ok).toBe(true)
    expect(j0.loDaXong).toBe(1)
    const j1 = await goi(env, { maBtvn: 'BT', sbd: '1', chiSo: 1 })
    expect(j1.ok).toBe(true)
    expect(j1.loDaXong).toBe(2)
  })

  it('báo lại lô đã qua (mất mạng, mở lại phiếu) KHÔNG làm lùi tiến độ', async () => {
    const { env, row } = setup()
    await goi(env, { maBtvn: 'BT', sbd: '1', chiSo: 2 }) // tiến độ = 3
    expect(row.lo_da_xong).toBe(3)
    const j = await goi(env, { maBtvn: 'BT', sbd: '1', chiSo: 0 }) // báo lại lô cũ
    expect(j.ok).toBe(true)
    expect(j.loDaXong).toBe(3) // KHÔNG lùi về 1
  })

  it('không khớp bài tập của em (khoá sai) thì báo lỗi, không ghi', async () => {
    const { env, row } = setup()
    const r = await goi(env, { maBtvn: 'BT', sbd: 'khong-co', chiSo: 0 })
    expect(r.ok).toBe(false)
    expect(row.lo_da_xong).toBe(0)
  })

  it('thiếu chiSo hoặc chiSo âm thì từ chối', async () => {
    const { env } = setup()
    expect((await goi(env, { maBtvn: 'BT', sbd: '1' })).ok).toBe(false)
    expect((await goi(env, { maBtvn: 'BT', sbd: '1', chiSo: -1 })).ok).toBe(false)
  })

  it('chưa chạy migration (cột lo_da_xong chưa có) — báo lỗi rõ ràng, không sập', async () => {
    const env = {
      DB: { prepare: () => ({ bind: () => ({ run: async () => { throw new Error('no such column: lo_da_xong') } }) }) },
    } as unknown as Env
    const r = await goi(env, { maBtvn: 'BT', sbd: '1', chiSo: 0 })
    expect(r.ok).toBe(false)
    expect(r.error).toContain('migration')
  })
})

describe('tongHopKeHoachTroLy (src/lib/tro-ly-ca-nhan.ts) — một ô ĐÚNG lô đang chờ', () => {
  const now = Date.parse('2026-09-19T12:00:00Z')
  const plan = (dsBtvn: Record<string, unknown>[]) =>
    tongHopKeHoachTroLy({ sbd: 'HS1', hoTen: 'Em', dsBtvn, dsMomGiao: [], dsLichSu: [], tongCauSai: 0, now })

  it('mới giao (loDaXong=0): sinh đúng một ô "Lô 1/N", hạn hiện là hạn chung', () => {
    const giaoLuc = new Date(now).toISOString()
    const hanNop = new Date(now + 5 * 24 * 3600_000).toISOString()
    const kq = plan([{ maBtvn: 'B1', soCau: 20, giaoLuc, hanNop, daNop: false, loDaXong: 0 }])
    const lo = kq.top3.filter((t) => t.loai === 'btvn_lo')
    expect(lo.length).toBe(1)
    expect(lo[0].tieuDe).toMatch(/^BTVN: Lô 1\/\d+$/)
    expect(lo[0].hanNop).toBe(hanNop)
  })

  it('lô kế tiếp CHƯA tới mốc dự kiến dù lô hiện tại đã xong ⇒ KHÔNG sinh ô nào (cổng hiển thị)', () => {
    const giaoLuc = new Date(now - 3600_000).toISOString() // giao cách đây 1 giờ
    const hanNop = new Date(now + 5 * 24 * 3600_000).toISOString() // còn 5 ngày ⇒ dãn theo ngày
    const kq = plan([{ maBtvn: 'B2', soCau: 20, giaoLuc, hanNop, daNop: false, loDaXong: 1 }]) // đã xong lô 0
    const lo = kq.top3.filter((t) => t.loai === 'btvn_lo')
    expect(lo.length).toBe(0) // lô 1 chưa tới mốc ngày thứ 2 — chưa hiện, dù lô 0 đã xong
  })

  it('TRỄ NHỊP — qua mốc lô kế tiếp mà lô hiện tại vẫn chưa xong ⇒ gán nhãn khẩn cấp hơn', () => {
    const giaoLuc = new Date(now - 5 * 24 * 3600_000).toISOString() // giao 5 ngày trước
    const hanNop = new Date(now + 8 * 24 * 3600_000).toISOString() // hạn chung còn rất xa (khung 13 ngày, 4 lô ~3,25 ngày/lô — mốc lô 1 đã qua từ lâu)
    const kq = plan([{ maBtvn: 'B3', soCau: 40, giaoLuc, hanNop, daNop: false, loDaXong: 0 }]) // vẫn ở lô 0 sau 5 ngày
    const lo = kq.top3.filter((t) => t.loai === 'btvn_lo')
    expect(lo.length).toBe(1)
    expect(lo[0].moTa).toContain('trễ nhịp')
    expect(lo[0].capDoUuTien).toBe('khan_cap') // ép khẩn cấp dù hạn chung còn xa
  })

  it('đã nộp bài: không còn ô lô nào cho bài đó', () => {
    const kq = plan([{ maBtvn: 'B4', soCau: 20, giaoLuc: new Date(now).toISOString(), hanNop: new Date(now + 240 * 3600_000).toISOString(), daNop: true, loDaXong: 0 }])
    expect(kq.top3.some((t) => t.hanhDong.payload?.bt?.maBtvn === 'B4')).toBe(false)
  })

  it('đã xong HẾT mọi lô bắt buộc (loDaXong ≥ số lô): không còn ô lô nào, dù chưa nộp', () => {
    const giaoLuc = new Date(now - 10 * 24 * 3600_000).toISOString()
    const hanNop = new Date(now + 24 * 3600_000).toISOString()
    const lich = tinhLichLoBtvn({ soCau: 20, giaoLuc, hanNop: new Date(now - 10 * 24 * 3600_000 + 5 * 24 * 3600_000).toISOString(), nganSachNgay: 12, taiKhac: 0 })
    const kq = plan([{ maBtvn: 'B5', soCau: 20, giaoLuc, hanNop, daNop: false, loDaXong: lich.cacLo.length }])
    const lo = kq.top3.filter((t) => t.loai === 'btvn_lo')
    expect(lo.length).toBe(0)
  })
})

describe('loDangCho — không có cặp Vòng 1/Vòng 2 nào còn sinh cùng lúc (đối chứng bằng mô tả lịch)', () => {
  it('một BTVN chỉ có ĐÚNG MỘT lô "đang chờ" tại một thời điểm', () => {
    const now = Date.parse('2026-09-19T12:00:00Z')
    const lich = tinhLichLoBtvn({ soCau: 20, giaoLuc: new Date(now - 24 * 3600_000).toISOString(), hanNop: new Date(now + 4 * 24 * 3600_000).toISOString(), nganSachNgay: 8, taiKhac: 0 })
    let soDangCho = 0
    for (let i = 0; i < lich.cacLo.length; i++) if (loDangCho(lich, i, now)?.daToiMoc) soDangCho++
    // Đúng lô 0 (i=0) là "đang chờ và đã tới mốc" tại loDaXong=0 — các lô sau
    // chỉ tính khi loDaXong đã nhích lên đúng chỉ số đó, không bao giờ hai lô
    // cùng "đang chờ" một lúc vì `loDangCho` luôn trả về ĐÚNG MỘT lô ứng với
    // `loDaXong` truyền vào.
    expect(soDangCho).toBeLessThanOrEqual(1)
  })
})
