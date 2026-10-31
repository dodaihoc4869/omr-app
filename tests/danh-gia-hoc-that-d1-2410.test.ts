// @vitest-environment node
// Xếp học sinh — phần D1 + lệnh (thầy 24/10: «Chốt build tất cả nhưng chưa đẩy»). Chạy trên D1 THẬT (SQLite, lược đồ repo).
// Ghim: mặc định CHẠY NGẦM (em/phụ huynh không thấy gì, không tự nhắc), bản chụp tuần, gán nhãn mù, ĐUỔI chỉ khi thầy xác nhận.
import { describe, expect, it } from 'vitest'
import worker from '../server/src/index'
import { goiWorker, taoD1That } from './_d1-that'
import type { Env } from '../server/src/kieu'
import { cronDanhGiaTuan, cuaSoTinh, docCheDo, KHOA_TINH_LAI, mocTuan, thuHaiCua, tinhLoEm } from '../server/src/danh-gia-hoc-that-d1'
import { PHIEN_LUAT } from '../server/src/danh-gia-hoc-that'

type D = ReturnType<typeof taoD1That>
const BAY_GIO = Date.parse('2026-10-25T19:30:00Z') // thứ Hai 26/10 02:30 giờ VN
let dem = 0
const em = (d: D, sbd: string) => d.sql.prepare('INSERT INTO hoc_sinh (sbd, ho_ten, lop, cap_nhat_luc) VALUES (?,?,?,?)').run(sbd, `Em ${sbd}`, '12', 'x')
const dong = (d: D, sbd: string, qid: string, kq: number, giay: number, ngay: string, raw: Record<string, unknown> = {}) => {
  const luc = `${ngay}T0${dem % 9}:${String(dem % 60).padStart(2, '0')}:00Z`
  d.sql.prepare(`INSERT INTO su_kien_hoc (khoa, sbd, qid, nguon, ma_nguon, lan, ket_qua, giay, luc, ngay_vn, raw_json) VALUES (?, ?, ?, 'game', 'P1', 1, ?, ?, ?, ?, ?)`)
    .run(`k${dem++}`, sbd, qid, kq, giay, luc, ngay, JSON.stringify({ doc: { t: 20, h: 0, p: 'I', dh: 1 }, ...raw }))
}
const NGAY = Array.from({ length: 14 }, (_, i) => new Date(Date.parse('2026-10-13T00:00:00Z') + i * 86400000).toISOString().slice(0, 10))

function duLieu() {
  const d = taoD1That()
  em(d, 'A1'); em(d, 'B1')
  // A1: làm thật — chậm, có nghĩ, đúng / sai bình thường, mỗi ngày.
  for (let i = 0; i < 42; i++) dong(d, 'A1', `Q${i}`, i % 3 ? 1 : 0, 40, NGAY[i % 14]!, { chon: 'ABCD'[i % 4] })
  // B1: bấm vội mà sai liên tục, cùng một đáp án.
  for (let i = 0; i < 42; i++) dong(d, 'B1', `R${i}`, i % 5 ? 0 : 1, 3, NGAY[2 * Math.floor(i / 6)]!, { chon: 'C' })
  return d
}

describe('xếp học sinh — D1', () => {
  it('thứ Hai của tuần', () => {
    expect(thuHaiCua('2026-10-26')).toBe('2026-10-26')
    expect(thuHaiCua('2026-11-02')).toBe('2026-11-02')
    expect(thuHaiCua('2026-10-30')).toBe('2026-10-26')
    expect(thuHaiCua('2026-11-01')).toBe('2026-10-26')
  })
  it('tính một lô: em làm thật ⇒ Học thật; em bấm vội mà sai, bấm lặp ⇒ Đối phó', async () => {
    const d = duLieu()
    const ds = await tinhLoEm(d.env as unknown as Env, ['A1', 'B1'], BAY_GIO)
    const a = ds.find((x) => x.sbd === 'A1')!, b = ds.find((x) => x.sbd === 'B1')!
    expect(a.bac.bac).toBe(1)
    expect(b.bac.bac).toBe(3)
    expect(b.kq.phat.map((p) => p.ma)).toEqual(expect.arrayContaining(['nhanMaSai', 'bamLap']))
  })
  it('mặc định CHẠY NGẦM: cron lưu bản chụp tuần nhưng KHÔNG tự nhắc em; em/phụ huynh không thấy gì', async () => {
    const d = duLieu()
    const env = d.env as unknown as Env
    expect(await docCheDo(env)).toBe('ngam')
    for (let i = 0; i < 5; i++) await cronDanhGiaTuan(env, BAY_GIO + i * 60_000)
    const chup = d.sql.prepare('SELECT sbd, bac FROM danh_gia_em_tuan ORDER BY sbd').all() as { sbd: string; bac: number }[]
    expect(chup).toEqual([{ sbd: 'A1', bac: 1 }, { sbd: 'B1', bac: 3 }])
    expect((d.sql.prepare('SELECT COUNT(*) AS n FROM can_thiep_em').get() as { n: number }).n).toBe(0)
    const lop = await goiWorker(worker, env, '/gv/danh-gia/lop', {}, true)
    expect(lop.cheDo).toBe('ngam')
    expect(lop.em.map((x: { sbd: string; tenBac: string }) => [x.sbd, x.tenBac])).toEqual(expect.arrayContaining([['A1', 'Học thật'], ['B1', 'Đối phó']]))
  })
  it('ngoài 01:00–06:00 giờ VN thứ Hai ⇒ cron không truy vấn gì', async () => {
    const d = duLieu()
    const r = await cronDanhGiaTuan(d.env as unknown as Env, Date.parse('2026-10-27T05:00:00Z'))
    expect(r).toMatchObject({ chay: false, lyDo: 'ngoai_gio' })
  })
  it('BẬT: em Đối phó tuần đầu ⇒ máy nhắc em (một lần mỗi tuần); em xem ⇒ ghi «đã xem»; nhãn công khai chỉ Học thật/Đối phó', async () => {
    const d = duLieu()
    const env = d.env as unknown as Env
    await goiWorker(worker, env, '/gv/danh-gia/che-do', { cheDo: 'bat' }, true)
    for (let i = 0; i < 6; i++) await cronDanhGiaTuan(env, BAY_GIO + i * 60_000)
    const ct = d.sql.prepare('SELECT sbd, loai FROM can_thiep_em').all()
    expect(ct).toEqual([{ sbd: 'B1', loai: 'nhac_em' }])
  })
  it('thầy ghi can thiệp; ĐUỔI chỉ vào nhật ký khi thầy bấm «Xác nhận cho nghỉ»; loại lạ bị từ chối; không có mã bí mật bị chặn', async () => {
    const d = duLieu()
    const env = d.env as unknown as Env
    expect((await goiWorker(worker, env, '/gv/danh-gia/can-thiep', { sbd: 'B1', loai: 'xoa_em' }, true)).ok).toBe(false)
    expect((await goiWorker(worker, env, '/gv/danh-gia/can-thiep', { sbd: 'B1', loai: 'xac_nhan_nghi' }, false)).ok).toBe(false)
    expect((await goiWorker(worker, env, '/gv/danh-gia/can-thiep', { sbd: 'B1', loai: 'xac_nhan_nghi', noiDung: 'Thầy đã gọi phụ huynh' }, true)).ok).toBe(true)
    const em1 = await goiWorker(worker, env, '/gv/danh-gia/em', { sbd: 'B1' }, true)
    expect(em1.canThiep[0]).toMatchObject({ loai: 'xac_nhan_nghi', taoBoi: 'thay' })
    expect(em1.hienTai.bac).toBe(3)
  })
  it('nhãn mù: gán / đọc; chưa đủ 30 em thì không so với máy (tránh thầy bị kéo theo)', async () => {
    const d = duLieu()
    const env = d.env as unknown as Env
    await goiWorker(worker, env, '/gv/danh-gia/nhan-mu', { sbd: 'A1', nhan: 'hoc_that' }, true)
    const r = await goiWorker(worker, env, '/gv/danh-gia/nhan-mu', { soSanh: true }, true)
    expect(r.nhan).toEqual([{ sbd: 'A1', nhan: 'hoc_that' }])
    expect(r.soSanh).toBeUndefined()
  })
})

// THẦY 31/10: «Trên lớp sao mà biết đc. Bỏ mục này đi tính toán lại toàn bộ chỉ số thật kĩ rồi đánh giá lại».
describe('xếp học sinh — soát lại 31/10 (bỏ vắng, chỉ điều app đo được, đánh giá lại)', () => {
  const kt = (d: D, sbd: string, ngay: string, trangThai: string, soCau: number, daTra: number) => {
    d.sql.exec("CREATE TABLE IF NOT EXISTS kiem_tra_ca_nhan (id TEXT PRIMARY KEY,sbd TEXT NOT NULL,lop TEXT NOT NULL,ngay TEXT NOT NULL,mo_luc INTEGER NOT NULL,han_luc INTEGER NOT NULL,trang_thai TEXT NOT NULL,json TEXT NOT NULL,tra_json TEXT NOT NULL DEFAULT '{}',revision INTEGER NOT NULL DEFAULT 0,nop_luc INTEGER,diem REAL,da_ghi INTEGER NOT NULL DEFAULT 0,cap_nhat_luc INTEGER NOT NULL,UNIQUE(sbd,ngay))")
    const cau = Array.from({ length: soCau }, (_, i) => ({ q: { qid: `K${i}` } }))
    const tra = Object.fromEntries(cau.slice(0, daTra).map((c) => [c.q.qid, 'A']))
    d.sql.prepare('INSERT INTO kiem_tra_ca_nhan (id, sbd, lop, ngay, mo_luc, han_luc, trang_thai, json, tra_json, diem, cap_nhat_luc) VALUES (?,?,?,?,0,0,?,?,?,?,0)')
      .run(`${sbd}|${ngay}`, sbd, '12', ngay, trangThai, JSON.stringify({ cau }), JSON.stringify(tra), trangThai === 'da_nop' ? 7 : null)
  }
  it('cửa sổ = 14 ngày TRỌN tới hôm qua: cron thứ Hai 01:00 không coi thứ Hai là «ngày không làm»; mốc tuần = thứ Hai 01:00', () => {
    expect(cuaSoTinh(BAY_GIO)).toMatchObject({ tu: '2026-10-12', cuoi: '2026-10-25', tuan: '2026-10-26' })
    expect(cuaSoTinh(mocTuan('2026-10-26'))).toMatchObject({ tu: '2026-10-12', cuoi: '2026-10-25', tuan: '2026-10-26' })
  })
  it('bỏ kiểm tra cá nhân = hết hạn mà trả lời < nửa số câu; làm gần hết mà chưa kịp nộp KHÔNG phải bỏ', async () => {
    const d = duLieu()
    for (const [i, n] of [[1, 9], [3, 10], [5, 8], [7, 9]] as const) kt(d, 'A1', NGAY[i]!, 'het_han', 10, n)
    for (const i of [1, 3, 5, 7]) kt(d, 'B1', NGAY[i]!, 'het_han', 10, 1)
    const ds = await tinhLoEm(d.env as unknown as Env, ['A1', 'B1'], BAY_GIO)
    const a = ds.find((x) => x.sbd === 'A1')!, b = ds.find((x) => x.sbd === 'B1')!
    expect(a.kq.soLieu.boKtcn).toBe(0)
    expect(a.kq.phat.find((p) => p.ma === 'boKtcn')).toBeUndefined()
    expect(b.kq.soLieu.boKtcn).toBe(1)
    expect(b.kq.phat.find((p) => p.ma === 'boKtcn')).toMatchObject({ xau: true })
  })
  it('luyện câu nền (luôn ghi «có hỗ trợ») và làm lại sau khi hỏi thầy KHÔNG tính «xem gợi ý trước khi tự làm»', async () => {
    const d = taoD1That()
    em(d, 'C1'); em(d, 'C2')
    const ghi = (sbd: string, i: number, nguon: string, maNguon: string, purpose: string | null) => d.sql.prepare(`INSERT INTO su_kien_hoc (khoa, sbd, qid, nguon, ma_nguon, lan, ket_qua, giay, luc, ngay_vn, assistance, purpose, raw_json) VALUES (?, ?, ?, ?, ?, 1, 1, 40, ?, ?, 'assisted', ?, ?)`)
      .run(`n${dem++}`, sbd, `${nguon === 'nen' ? 'nen:' : 'Q'}${i}`, nguon, maNguon, `${NGAY[i % 13]}T03:00:00Z`, NGAY[i % 13], purpose, JSON.stringify({ doc: { t: 20, h: 0, p: 'I', dh: 1 } }))
    for (let i = 0; i < 30; i++) ghi('C1', i, i % 2 ? 'nen' : 'chua_loi', i % 2 ? 'Q1' : `hoi_thay_kiem:${i}`, i % 2 ? 'luyen_nen' : 'repair')
    for (let i = 0; i < 30; i++) ghi('C2', i, 'game', 'P1', null)
    const ds = await tinhLoEm(d.env as unknown as Env, ['C1', 'C2'], BAY_GIO)
    expect(ds.find((x) => x.sbd === 'C1')!.kq.phat.find((p) => p.ma === 'goiY')).toBeUndefined()
    expect(ds.find((x) => x.sbd === 'C2')!.kq.phat.find((p) => p.ma === 'goiY')).toBeTruthy()
  })
  it('em ĐÃ NGHỈ không được xếp; ngày trước khi em vào app không tính «không làm»', async () => {
    const d = duLieu()
    em(d, 'N1'); d.sql.prepare("UPDATE hoc_sinh SET trang_thai = 'da_nghi' WHERE sbd = 'N1'").run()
    em(d, 'M1'); d.sql.prepare("UPDATE hoc_sinh SET tao_luc = '2026-10-22T10:00:00Z' WHERE sbd = 'M1'").run()
    for (const n of NGAY.slice(10, 13)) dong(d, 'M1', `M${n}`, 1, 40, n)
    const m = (await tinhLoEm(d.env as unknown as Env, ['M1'], BAY_GIO))[0]!
    expect(m.kq.soLieu.soNgayTinh).toBe(3)
    expect(m.kq.phat.find((p) => p.ma === 'khongLam')).toBeUndefined()
    const env = d.env as unknown as Env
    for (let i = 0; i < 6; i++) await cronDanhGiaTuan(env, BAY_GIO + i * 60_000)
    expect((d.sql.prepare("SELECT sbd FROM danh_gia_em_tuan ORDER BY sbd").all() as { sbd: string }[]).map((x) => x.sbd)).toEqual(['A1', 'B1', 'M1'])
  })
  it('đổi luật ⇒ cron đêm tự ĐÁNH GIÁ LẠI mọi tuần đã lưu (cũ → mới, đúng mốc thứ Hai tuần ấy), bỏ mục «vắng», KHÔNG gửi nhắc; xong thì chạy tuần như thường', async () => {
    const d = duLieu()
    const env = d.env as unknown as Env
    await goiWorker(worker, env, '/gv/danh-gia/che-do', { cheDo: 'bat' }, true)
    for (let i = 0; i < 6; i++) await cronDanhGiaTuan(env, BAY_GIO + i * 60_000)
    d.sql.exec('DELETE FROM can_thiep_em')
    // Bản chụp cũ (luật trước 31/10): A1 bị «vắng» kéo xuống Đối phó.
    d.sql.prepare(`UPDATE danh_gia_em_tuan SET diem = 55, bac_tuan = 3, bac = 3, phat_json = ?, co_do_nang_json = ? WHERE sbd = 'A1'`)
      .run(JSON.stringify([{ ma: 'vang', diem: 15, chu: 'vắng không phép 3/6 buổi', xau: true }]), JSON.stringify({ coTinh: false, gianLan: 0, boVaVang: true }))
    d.sql.prepare("INSERT INTO cau_hinh (khoa, gia_tri, cap_nhat_luc) VALUES (?, ?, 'x') ON CONFLICT(khoa) DO UPDATE SET gia_tri = excluded.gia_tri").run(KHOA_TINH_LAI, JSON.stringify({ luat: 'cu', xong: true }))
    const DEM_CN = Date.parse('2026-10-31T19:00:00Z') // Chủ nhật 01/11 02:00 giờ VN
    const lyDo: string[] = []
    for (let i = 0; i < 6; i++) lyDo.push(String((await cronDanhGiaTuan(env, DEM_CN + i * 60_000)).lyDo))
    expect(lyDo.slice(0, 4)).toEqual(['tinh_lai_bat_dau', 'tinh_lai_cau', 'tinh_lai', 'tinh_lai_xong'])
    expect(lyDo[4]).toBe('da_xong') // tuần 26/10 đã tính ⇒ cron tuần nghỉ tới thứ Hai
    const a = d.sql.prepare("SELECT tuan, bac, phat_json, co_do_nang_json FROM danh_gia_em_tuan WHERE sbd = 'A1'").get() as Record<string, string>
    expect(a.tuan).toBe('2026-10-26')
    expect(Number(a.bac)).toBe(1)
    expect(a.phat_json).not.toContain('vang')
    expect(JSON.parse(a.co_do_nang_json)).toMatchObject({ boHoc: false })
    expect(JSON.parse(a.co_do_nang_json).boVaVang).toBeUndefined()
    expect((d.sql.prepare('SELECT COUNT(*) AS n FROM can_thiep_em').get() as { n: number }).n).toBe(0)
    expect(JSON.parse((d.sql.prepare('SELECT gia_tri FROM cau_hinh WHERE khoa = ?').get(KHOA_TINH_LAI) as { gia_tri: string }).gia_tri)).toMatchObject({ luat: PHIEN_LUAT, xong: true })
  })
})
