// @vitest-environment node
// LUẬT THẦY 05/10 ("chặn chuẩn 100% không được rút nhầm kho khác khối"): kênh tự động chặn câu KHÔNG RÕ khối ⇒ câu trong kho giả ghi khối `lop` (đúng khối em).
// NGÀY BẮT ĐẦU CHIẾN DỊCH (thầy 28/09: "cho tôi thêm đặt thời gian bắt đầu chiến dịch nhé").
// Máy chủ chạy THẬT trên SQLite lược đồ thật (`_d1-that`). Bảng phụ `chien_dich_bat_dau` tạo lúc chạy (không ALTER `chien_dich`).
import { describe, expect, it } from 'vitest'
import { taoD1That } from './_d1-that'
import { gvChienDich } from '../server/src/srs2-gv'
import { gvSuaChienDich } from '../server/src/srs2-sua'
import { docChienDichCuaEm, layKeHoachHomNay, sanh2 } from '../server/src/srs2-d1'
import { chuTomTatSua } from '../src/lib/tom-tat-sua-chien-dich'
import type { Env } from '../server/src/kieu'

const T0 = Date.parse('2026-09-30T02:00:00Z') // 09:00 VN 30/09
const GIO = 3_600_000
const NGAY = 24 * GIO
const cau = (qid: string) => JSON.stringify({
  qid, maDe: 'DE1', lop: '12', version: 'v1', group: `g-${qid}`, phan: 'I', text: `Câu ${qid}`, choices: ['a', 'b', 'c', 'd'], ideas: [],
  hinhAnh: [], dang: 'D1', tenDang: 'Dạng 1', mucDo: 'NB', sao: 1, kienThuc: ['k'], correct: 'B', reviewed: true, solution: { chot: 'c' },
})

function dung() {
  const d = taoD1That()
  const env = d.env as unknown as Env
  d.sql.exec("INSERT INTO hoc_sinh(sbd,ho_ten,lop,cap_nhat_luc) VALUES('S1','An','12','x'),('S2','Bảo','12','x')")
  d.sql.exec(`INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('game_hoa_2','{"bat":true}','x')`)
  const st = d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)')
  for (let i = 1; i <= 6; i++) st.run('DE1', `Q${i}`, 'v1', `g-Q${i}`, 'D1', cau(`Q${i}`))
  let k = 0
  const lam = (sbd: string, qid: string, ms: number, dung = true) =>
    d.sql.prepare("INSERT INTO su_kien_hoc (khoa, sbd, qid, nguon, ma_nguon, lan, ket_qua, giay, luc, ngay_vn) VALUES (?,?,?,'game','G',1,?,30,?,?)")
      .run(`k${++k}`, sbd, qid, dung ? 1 : 0, new Date(ms).toISOString(), new Date(ms + 7 * GIO).toISOString().slice(0, 10))
  return { d, env, lam }
}
const tao = async (env: Env, du: Record<string, unknown> = {}, nowMs = T0) =>
  (await gvChienDich(env, { action: 'tao', ten: 'Luyện chương 1', sbd: ['S1', 'S2'], maDe: ['DE1'], hanNop: '2026-10-05', ...du }, nowMs)) as { ok: boolean; id: string; batDau?: string; error?: string }
const sucChua = async (env: Env, du: Record<string, unknown>) =>
  (await gvChienDich(env, { action: 'suc-chua', sbd: ['S1', 'S2'], maDe: ['DE1'], theLucNgay: 10, ...du }, T0)) as Record<string, unknown>

describe('giao chiến dịch bắt đầu ngày mai', () => {
  it('hôm nay em KHÔNG nhận câu (Sảnh báo "bắt đầu"), mai nhận; câu em làm trước ngày bắt đầu không tính', async () => {
    const { env, lam } = dung()
    const r = await tao(env, { batDau: '2026-10-01' })
    expect(r).toMatchObject({ ok: true, batDau: '2026-10-01' })
    expect((await docChienDichCuaEm(env, 'S1'))[0]).toMatchObject({ id: r.id, batDau: '2026-10-01', mocBatDau: '2026-09-30T17:00:00.000Z' })

    lam('S1', 'Q1', T0 + GIO) // làm ở nơi khác TRƯỚC ngày bắt đầu
    const homNay = await layKeHoachHomNay(env, 'S1', T0)
    expect(homNay.hs.chienDich).toBeNull()
    expect(homNay.kh.tong).toBe(0)
    const sanh = await sanh2(env, 'S2', T0 + 2 * GIO)
    expect(sanh.chienDich).toBeNull()
    expect(sanh.sapBatDau).toEqual({ id: r.id, ten: 'Luyện chương 1', batDau: '2026-10-01', hanNop: '2026-10-05' })
    expect(JSON.stringify(sanh)).not.toMatch(/Q\d/) // không lộ câu

    const mai = await layKeHoachHomNay(env, 'S1', T0 + NGAY)
    expect(mai.hs.chienDich?.id).toBe(r.id)
    expect(mai.kh.tong).toBeGreaterThan(0)
    expect(mai.hs.tt.get('Q1')!.laMoi).toBe(true) // lần làm trước mốc bắt đầu không tính
    expect(((await sanh2(env, 'S2', T0 + NGAY)) as { sapBatDau: unknown }).sapBatDau).toBeNull()
  })

  it('không đặt ngày bắt đầu ⇒ như cũ: bắt đầu = ngày tạo, không tạo dòng phụ, em nhận câu ngay', async () => {
    const { d, env } = dung()
    const r = await tao(env)
    expect(r).toMatchObject({ ok: true, batDau: '2026-09-30' })
    const cd = (await docChienDichCuaEm(env, 'S1'))[0]!
    expect(cd.batDau).toBe('2026-09-30')
    expect(cd.mocBatDau).toBe(cd.taoLuc)
    expect(d.sql.prepare("SELECT COUNT(*) AS n FROM sqlite_master WHERE name = 'chien_dich_bat_dau'").get()).toEqual({ n: 0 })
    expect((await layKeHoachHomNay(env, 'S1', T0)).kh.tong).toBeGreaterThan(0)
    // Gửi đúng hôm nay cũng như không gửi.
    expect(await tao(env, { batDau: '2026-09-30' })).toMatchObject({ ok: true, batDau: '2026-09-30' })
  })

  it('ngày bắt đầu trước hôm nay / sau hạn nộp ⇒ từ chối', async () => {
    const { env } = dung()
    // Lệnh `tao`/`suc-chua` ném lỗi như các lỗi đầu vào sẵn có (cổng `index.ts` trả `{ ok: false, error }`).
    await expect(tao(env, { batDau: '2026-09-29' })).rejects.toThrow('Ngày bắt đầu phải từ hôm nay trở đi.')
    await expect(tao(env, { batDau: '2026-10-06' })).rejects.toThrow('Ngày bắt đầu không được sau hạn nộp.')
    await expect(sucChua(env, { hanNop: '2026-10-05', batDau: '2026-10-06' })).rejects.toThrow('Ngày bắt đầu không được sau hạn nộp.')
  })
})

describe('D, sức chứa, đề xuất số lượt/ngày tính từ ngày bắt đầu', () => {
  it('hạn 02/10: không ngày bắt đầu D = 3; bắt đầu 02/10 ⇒ D = 1, sức chứa, trần Quá tải và đề xuất theo D = 1', async () => {
    const { env } = dung()
    const cu = await sucChua(env, { hanNop: '2026-10-02' })
    expect(cu).toMatchObject({ ok: true, D: 3, sucChua: 30, khoiLuongTrungVi: 12, theLucDeXuat: 10, soEmQuaTai: 0, batDau: '2026-09-30' })
    const moi = await sucChua(env, { hanNop: '2026-10-02', batDau: '2026-10-02' })
    expect(moi).toMatchObject({ ok: true, D: 1, sucChua: 10, khoiLuongTrungVi: 12, theLucDeXuat: 18, soEmQuaTai: 2, batDau: '2026-10-02' })
  })
})

describe('sửa ngày bắt đầu', () => {
  it('chưa bắt đầu ⇒ đổi được, tóm tắt "bắt đầu 01/10 → 02/10"; ngày mới sau hạn / trước hôm nay ⇒ từ chối', async () => {
    const { env } = dung()
    const { id } = await tao(env, { batDau: '2026-10-01' })
    const doc = (await gvSuaChienDich(env, { action: 'doc', id }, T0)) as { chienDich: Record<string, unknown> }
    expect(doc.chienDich).toMatchObject({ batDau: '2026-10-01', daBatDau: false })
    expect(await gvSuaChienDich(env, { action: 'xem-truoc', id, batDau: '2026-10-06' }, T0)).toMatchObject({ ok: false, error: 'Ngày bắt đầu không được sau hạn nộp.' })
    expect(await gvSuaChienDich(env, { action: 'xem-truoc', id, batDau: '2026-09-29' }, T0)).toMatchObject({ ok: false, error: 'Ngày bắt đầu phải từ hôm nay trở đi.' })
    // Rút hạn về trước ngày bắt đầu cũng bị chặn.
    expect(await gvSuaChienDich(env, { action: 'xem-truoc', id, hanNop: '2026-09-30' }, T0)).toMatchObject({ ok: false, error: 'Ngày bắt đầu không được sau hạn nộp.' })
    const r = await gvSuaChienDich(env, { action: 'luu', id, batDau: '2026-10-02' }, T0)
    expect(r).toMatchObject({ ok: true, tomTat: 'bắt đầu 01/10 → 02/10', batDauCu: '2026-10-01', batDau: '2026-10-02' })
    expect((await docChienDichCuaEm(env, 'S1'))[0]!.batDau).toBe('2026-10-02')
    expect((await layKeHoachHomNay(env, 'S1', T0 + NGAY)).kh.tong).toBe(0) // 01/10 vẫn chưa bắt đầu
    expect((await layKeHoachHomNay(env, 'S1', T0 + 2 * NGAY)).kh.tong).toBeGreaterThan(0)
  })

  it('đã bắt đầu ⇒ từ chối đổi ngày bắt đầu; thay đổi khác vẫn lưu được', async () => {
    const { env } = dung()
    const { id } = await tao(env)
    const doc = (await gvSuaChienDich(env, { action: 'doc', id }, T0)) as { chienDich: Record<string, unknown> }
    expect(doc.chienDich).toMatchObject({ batDau: '2026-09-30', daBatDau: true })
    expect(await gvSuaChienDich(env, { action: 'luu', id, batDau: '2026-10-02' }, T0)).toMatchObject({ ok: false, error: 'Chiến dịch đã bắt đầu — không đổi được ngày bắt đầu.' })
    // Chiến dịch bắt đầu 01/10 ⇒ tới 01/10 là đã bắt đầu.
    const { id: id2 } = await tao(env, { batDau: '2026-10-01' })
    expect(await gvSuaChienDich(env, { action: 'luu', id: id2, batDau: '2026-10-03' }, T0 + NGAY)).toMatchObject({ ok: false, error: 'Chiến dịch đã bắt đầu — không đổi được ngày bắt đầu.' })
    expect(await gvSuaChienDich(env, { action: 'luu', id: id2, batDau: '2026-10-01', hanNop: '2026-10-06' }, T0 + NGAY)).toMatchObject({ ok: true, tomTat: 'hạn 05/10 → 06/10' })
  })

  it('dời ngày bắt đầu muộn hơn ⇒ tự NÂNG số câu/ngày theo số ngày từ ngày bắt đầu MỚI tới hạn', async () => {
    const { env } = dung()
    const { id } = await tao(env, { batDau: '2026-10-01', theLucNgay: 10 })
    // 6 câu mới × 2 lượt = 12 lượt; bắt đầu 05/10 = hạn ⇒ 1 ngày ⇒ cần 12 câu/ngày (tính từ hôm nay sẽ là 6 ngày ⇒ không nâng).
    const r = await gvSuaChienDich(env, { action: 'xem-truoc', id, batDau: '2026-10-05' }, T0)
    expect(r).toMatchObject({ ok: true, theLucCu: 10, theLucNgay: 12, theLucCan: 12, tuNang: true, tomTat: 'bắt đầu 01/10 → 05/10, số câu/ngày 10 → 12' })
  })
})

describe('danh sách + bảng chiến dịch', () => {
  it('chưa tới ngày bắt đầu ⇒ `sapBatDau: true` kèm `batDau`; tới ngày thì hết', async () => {
    const { env } = dung()
    await tao(env, { batDau: '2026-10-01' })
    const ds = (await gvChienDich(env, { action: 'danh-sach', thongKe: true }, T0)) as { chienDich: Record<string, unknown>[] }
    expect(ds.chienDich[0]).toMatchObject({ batDau: '2026-10-01', sapBatDau: true })
    expect(ds.chienDich[0]!.thongKe).toBeTruthy()
    const mai = (await gvChienDich(env, { action: 'danh-sach' }, T0 + NGAY)) as { chienDich: Record<string, unknown>[] }
    expect(mai.chienDich[0]).toMatchObject({ sapBatDau: false })
  })
  it('nhịp lớp: ngày thứ / tổng ngày tính từ ngày bắt đầu', async () => {
    const { env } = dung()
    const { id } = await tao(env, { batDau: '2026-10-02' })
    const b = (await gvChienDich(env, { action: 'bang', id }, T0 + 3 * NGAY)) as { lop: { ngayThu: number; tongNgay: number } }
    expect(b.lop).toMatchObject({ ngayThu: 2, tongNgay: 4 })
  })
  it('tóm tắt sửa: "bắt đầu 30/09 → 01/10"', () => {
    expect(chuTomTatSua({ themDe: 0, themEm: 0, botEm: 0, hanCu: '2026-10-05', hanMoi: null, batDauCu: '2026-09-30', batDauMoi: '2026-10-01' })).toBe('bắt đầu 30/09 → 01/10')
    expect(chuTomTatSua({ themDe: 0, themEm: 0, botEm: 0, hanCu: '2026-10-05', hanMoi: null, batDauCu: '2026-09-30', batDauMoi: null })).toBe('')
  })
})
