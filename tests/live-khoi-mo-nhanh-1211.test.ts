// MỞ PHÒNG CHỜ LIVE THEO KHỐI PHẢI TỨC THÌ (thầy 12/11: màn báo «Máy chủ trả lời chậm — thử lại sau ít phút», «mở quá chậm», «làm cho tức thì chỗ này đi»).
// Trước: đọc → dựng bảng → chèn buổi → đọc lại buổi → đọc điểm danh + danh sách CẢ TRƯỜNG → ghi lịch (5–6 đợt chờ D1 nối tiếp).
// Nay: MỘT đợt đọc song song rồi MỘT batch ghi (chèn buổi + ghi lịch). Test khoá đúng hai đợt đó bằng D1 giả đếm lệnh.
import { describe, expect, it } from 'vitest'
import { gvLiveKhoi } from '../server/src/live-khoi'

type Goi = { kieu: 'all' | 'run' | 'first' | 'batch'; sql: string[]; dot: number }
function d1Gia(hs: { sbd: string; lop: string }[]) {
  const goi: Goi[] = []
  let dot = 0, dangCho = 0
  // «đợt chờ» = nhóm lệnh phát đi trước khi lệnh nào trong nhóm trả về (song song ⇒ cùng đợt; nối tiếp ⇒ đợt mới)
  const ghi = <T,>(kieu: Goi['kieu'], sql: string[], tra: T): Promise<T> => {
    if (dangCho === 0) dot += 1
    dangCho += 1
    goi.push({ kieu, sql, dot })
    return new Promise((ok) => setTimeout(() => { dangCho -= 1; ok(tra) }, 1))
  }
  const lenh = (sql: string) => {
    const l = {
      sql,
      bind: () => l,
      all: () => ghi('all', [sql], { results: /FROM hoc_sinh/.test(sql) ? hs.map((h) => ({ sbd: h.sbd, lop: h.lop, ten_lop: '' })) : [] }),
      first: () => ghi('first', [sql], null),
      run: () => ghi('run', [sql], { success: true }),
    }
    return l
  }
  return { goi, DB: { prepare: lenh, batch: (ds: { sql: string }[]) => ghi('batch', ds.map((x) => x.sql), ds.map(() => ({ success: true }))), exec: (sql: string) => ghi('run', [sql], {}) } }
}

describe('/gv/bpu/khoi-mo — mở phòng chờ tức thì', () => {
  it('phòng mới: đúng HAI đợt chờ D1 — một đợt đọc song song, một batch ghi (chèn buổi + ghi lịch); không đọc lại buổi, không đọc điểm danh', async () => {
    const d = d1Gia([{ sbd: 'A1', lop: '12' }, { sbd: 'A2', lop: '12' }, { sbd: 'B1', lop: '11' }])
    const r = await gvLiveKhoi({ DB: d.DB } as never, '/gv/bpu/khoi-mo', { khoi: 12 }, Date.UTC(2026, 10, 12, 5, 0, 0))
    expect(r.ok).toBe(true)
    expect(typeof r.buoiId === 'string' && (r.buoiId as string).length > 0).toBe(true)
    expect((r.lich as { khoi: number; trangThai: string }).khoi).toBe(12)
    expect((r.lich as { khoi: number; trangThai: string }).trangThai).toBe('cho')
    expect(r.soEm).toEqual({ 10: 0, 11: 1, 12: 2 })
    // đợt cuối = MỘT batch gồm chèn buổi + ghi lịch
    const cuoi = d.goi[d.goi.length - 1]!
    expect(cuoi.kieu).toBe('batch')
    expect(cuoi.sql.some((s) => /INSERT INTO buoi_hoc/.test(s))).toBe(true)
    expect(cuoi.sql.some((s) => /INSERT INTO cau_hinh/.test(s))).toBe(true)
    // D1 giả chưa có bảng nên có thêm MỘT lượt dựng bảng (một lần mỗi isolate; D1 thật đã có bảng ⇒ không chạy). Bỏ lượt đó ra: còn đúng HAI đợt chờ.
    const that = d.goi.filter((g) => !g.sql.every((x) => /^\s*CREATE /.test(x)))
    expect(new Set(that.map((g) => g.dot)).size).toBe(2)
    expect(that.filter((g) => g.dot === that[that.length - 1]!.dot).length).toBe(1)
    // không còn các lượt đọc thừa của đường mở buổi cũ
    const moi = that.flatMap((g) => g.sql).join('\n')
    expect(moi).not.toMatch(/buoi_hoc_diem_danh/)
    expect(moi).not.toMatch(/SELECT[^\n]*FROM buoi_hoc WHERE id/)
  })
  it('mở lại đúng phòng đang mở (app hỏi lại sau khi máy chủ trả lời chậm): không chèn buổi thứ hai', async () => {
    const nay = Date.UTC(2026, 10, 12, 5, 0, 0)
    const d = d1Gia([{ sbd: 'A1', lop: '12' }])
    const lich = [{ id: 'lk1', khoi: 12, batDau: nay - 60_000, ten: '', trangThai: 'cho', buoiId: 'BH-cu', luc: nay - 60_000 }]
    const goc = d.DB.prepare
    d.DB.prepare = (sql: string) => { const l = goc(sql); if (/FROM cau_hinh/.test(sql)) { const tra = () => Promise.resolve({ gia_tri: JSON.stringify(lich) }); return { ...l, bind: () => ({ ...l, first: tra, all: () => Promise.resolve({ results: [{ gia_tri: JSON.stringify(lich) }] }) }), first: tra, all: () => Promise.resolve({ results: [{ gia_tri: JSON.stringify(lich) }] }) } as never } return l }
    const r = await gvLiveKhoi({ DB: d.DB } as never, '/gv/bpu/khoi-mo', { khoi: 12, id: 'lk1' }, nay)
    expect(r.ok).toBe(true)
    expect(r.buoiId).toBe('BH-cu')
    expect(d.goi.flatMap((g) => g.sql).some((s) => /INSERT INTO buoi_hoc/.test(s))).toBe(false)
  })
})
