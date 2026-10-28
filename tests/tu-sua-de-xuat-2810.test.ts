// @vitest-environment node
// TỰ SỬA LỖI THEO ĐỀ XUẤT (thầy duyệt 28/10) — phần máy chủ:
//   (2) +2 nguyên tử khi câu RA KHỎI HÀNG ở màn sửa câu (exp_so loai 'tu_sua'), trần 12 câu / ngày, không khi «xong phần» / lặp mã gốc cùng ngày / đã đúng kênh khác;
//   (3) cron đêm đóng đợt CŨ hơn 14 ngày theo đúng luật tự làm, theo lô + con trỏ, chỉ 00:30–05:59 VN;
//   (4) việc hôm nay lưu trên máy chủ theo SBD + ngày VN: đọc CÙNG lô danh sách, ghi gộp (danh sách dài hơn thắng, «đã xong» hợp lại).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { taoD1That } from './_d1-that'
import { seedChua, Q } from './_chua-cau-sai-fixture'
import { danhSach, moDot } from '../server/src/chua-cau-sai'
import { gonNop } from '../server/src/chua-gon-lenh'
import { xoaDemCaBaoVe } from '../server/src/game-v2-bank'
import { xoaLuotDong } from '../server/src/chua-gon'
import { cronDongDotCu, KHOA_CON_TRO, trongKhungDem } from '../server/src/chua-gon-dem'
import { hsGhiViecNgay } from '../server/src/tu-sua-viec-ngay'
import { NT_TU_SUA_RA_HANG, NT_TU_SUA_TRAN_NGAY } from '../server/src/exp-cau-hinh'

const T = Date.parse('2026-10-07T03:00:00Z') // 10:00 VN 07/10
beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(T); xoaDemCaBaoVe(); xoaLuotDong() })
afterEach(() => { vi.useRealTimers(); xoaDemCaBaoVe() })

async function dung(exp = true) {
  const d = taoD1That()
  const token = await seedChua(d.env)
  if (exp) d.sql.prepare("INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('exp_moi',?,'x')").run(JSON.stringify({ tu: '2026-09-01T00:00:00.000Z', toanBo: true }))
  const dotId = (await (await moDot(d.env, { token, qid: Q })).json()).dotId as string
  return { ...d, token, dotId }
}
type D = Awaited<ReturnType<typeof dung>>
let n = 0
const nop = async (d: D, traLoi: string, ban = Q) => (await gonNop(d.env, { token: d.token, dotId: d.dotId, ban, traLoi, khoa: `k${++n}` })).json() as Promise<Record<string, any>>
const khoan = (d: D) => d.sql.prepare("SELECT khoa, exp, qid, ngay_vn, ghi_chu FROM exp_so WHERE loai='tu_sua'").all() as { khoa: string; exp: number; qid: string; ngay_vn: string; ghi_chu: string }[]

describe('(2) Thưởng sửa đúng câu cũ', () => {
  it('đúng lần 1 qua luật tự làm ⇒ +2 nguyên tử vào exp_so (khoá theo mã gốc + ngày), phản hồi có nguyenTu; bảng giải tuần cộng như khoản thường', async () => {
    const d = await dung()
    const j = await nop(d, '24')
    expect(j).toMatchObject({ ket: 'tu_sua', nguyenTu: NT_TU_SUA_RA_HANG })
    expect(khoan(d)).toEqual([{ khoa: `HS1|tu_sua|${Q}|2026-10-07`, exp: 2, qid: Q, ngay_vn: '2026-10-07', ghi_chu: 'Sửa đúng câu cũ: +2' }])
    const g = d.sql.prepare("SELECT nguyen_tu FROM giai_tuan WHERE em='HS1'").get() as { nguyen_tu: number } | undefined
    expect(g?.nguyen_tu).toBe(2)
  })
  it('«xong phần» (đúng sau gợi ý) ⇒ 0; sai ⇒ 0', async () => {
    const d = await dung()
    expect((await nop(d, '40')).ket).toBe('goi_y')
    const b = await nop(d, '24')
    expect(b.ket).toBe('xong_phan')
    expect(b.nguyenTu).toBeUndefined()
    expect(khoan(d)).toEqual([])
  })
  it('mã gốc đã ĐÚNG ở kênh khác hôm nay (luật lặp câu #525, cả song sinh) ⇒ vẫn ra khỏi hàng nhưng 0 nguyên tử', async () => {
    const d = await dung()
    d.sql.prepare("INSERT INTO su_kien_hoc(khoa,sbd,qid,nguon,ma_nguon,lan,ket_qua,luc,ngay_vn,assistance,visibility,purpose) VALUES('dung-nay','HS1',?,'game','G9',1,1,'2026-10-07T01:00:00.000Z','2026-10-07','none','released','maintenance')").run(`${Q}~ss0`)
    // đợt có thể đã đóng tự động khi đọc danh sách — ở đây gọi thẳng gon-nop (không qua danh sách)
    const j = await nop(d, '24')
    expect(j.ket).toBe('tu_sua')
    expect(j.nguyenTu).toBeUndefined()
    expect(khoan(d)).toEqual([])
  })
  it('EXP mới chưa bật cho em ⇒ không ghi khoản', async () => {
    const d = await dung(false)
    const j = await nop(d, '24')
    expect(j.ket).toBe('tu_sua')
    expect(khoan(d)).toEqual([])
  })
  it(`trần ${NT_TU_SUA_TRAN_NGAY} câu / ngày: đã có đủ khoản hôm nay ⇒ câu thứ 13 không cộng`, async () => {
    const d = await dung()
    const ins = d.sql.prepare("INSERT INTO exp_so(khoa,sbd,ngay_vn,loai,qid,ma_nguon,exp,luc,ghi_chu) VALUES(?,'HS1','2026-10-07','tu_sua',?,'x',2,'2026-10-07T02:00:00.000Z','x')")
    for (let i = 0; i < NT_TU_SUA_TRAN_NGAY; i++) ins.run(`HS1|tu_sua|Q${i}|2026-10-07`, `Q${i}`)
    const j = await nop(d, '24')
    expect(j.ket).toBe('tu_sua')
    expect(j.nguyenTu).toBeUndefined()
    expect(khoan(d)).toHaveLength(NT_TU_SUA_TRAN_NGAY)
  })
})

describe('(3) Cron đêm đóng đợt cũ hơn 14 ngày', () => {
  // Đợt sai 29/09 (8 ngày trước T); đẩy đồng hồ tới 20/10 ⇒ đợt cũ hơn 14 ngày.
  const DEM = Date.parse('2026-10-19T18:00:00Z') // 01:00 VN 20/10
  const lam = (d: D, qid: string, ketQua: 0 | 1, luc: string) => d.sql.prepare("INSERT INTO su_kien_hoc(khoa,sbd,qid,nguon,ma_nguon,lan,ket_qua,luc,ngay_vn,assistance,visibility,purpose) VALUES(?,'HS1',?,'game','G2',1,?,?,?,'none','released','repair')")
    .run(`l${++n}`, qid, ketQua, luc, luc.slice(0, 10))
  const tt = (d: D) => (d.sql.prepare('SELECT trang_thai_day, dong_luc FROM chua_loi_dot WHERE id=?').get(d.dotId) as { trang_thai_day: string; dong_luc: number | null })
  it('khung giờ: chỉ 00:30–05:59 VN', () => {
    expect(trongKhungDem(Date.parse('2026-10-19T17:29:00Z'))).toBe(false) // 00:29
    expect(trongKhungDem(Date.parse('2026-10-19T17:30:00Z'))).toBe(true) // 00:30
    expect(trongKhungDem(Date.parse('2026-10-19T22:59:00Z'))).toBe(true) // 05:59
    expect(trongKhungDem(Date.parse('2026-10-19T23:00:00Z'))).toBe(false) // 06:00
    expect(trongKhungDem(Date.parse('2026-10-20T12:00:00Z'))).toBe(false) // 19:00
  })
  it('đợt cũ có lượt đúng qua luật tự làm (ngày khác) ⇒ đóng; danh sách 14 ngày KHÔNG đóng được nó', async () => {
    const d = await dung()
    lam(d, Q, 1, '2026-10-01T02:00:00.000Z')
    vi.setSystemTime(DEM)
    await danhSach(d.env, { token: d.token })
    expect(tt(d).trang_thai_day).not.toBe('da_tu_sua')
    const r = await cronDongDotCu(d.env, DEM)
    expect(r).toMatchObject({ chay: true, xet: 1, dong: 1, het: true })
    expect(tt(d)).toEqual({ trang_thai_day: 'da_tu_sua', dong_luc: DEM })
    // không thưởng nguyên tử cho đợt đóng tự động
    expect(khoan(d)).toEqual([])
  })
  it('đợt cũ KHÔNG có lượt đúng hợp lệ (cùng ngày sai / có gợi ý) ⇒ giữ mở; ngoài khung giờ ⇒ không truy vấn', async () => {
    const d = await dung()
    lam(d, Q, 1, '2026-09-29T05:00:00.000Z') // cùng ngày sai, câu gốc
    vi.setSystemTime(DEM)
    expect(await cronDongDotCu(d.env, Date.parse('2026-10-20T12:00:00Z'))).toEqual({ chay: false, xet: 0, dong: 0, het: false })
    const r = await cronDongDotCu(d.env, DEM)
    expect(r).toMatchObject({ chay: true, xet: 1, dong: 0 })
    expect(tt(d).trang_thai_day).not.toBe('da_tu_sua')
  })
  it('con trỏ theo lô: lô 1 đợt ⇒ con trỏ tiến, hết bảng ⇒ về đầu', async () => {
    const d = await dung()
    vi.setSystemTime(DEM)
    const a = await cronDongDotCu(d.env, DEM, 1)
    expect(a).toMatchObject({ xet: 1, het: false })
    const tro = (d.sql.prepare('SELECT gia_tri FROM cau_hinh WHERE khoa=?').get(KHOA_CON_TRO) as { gia_tri: string }).gia_tri
    expect(tro).toBe(d.dotId)
    const b = await cronDongDotCu(d.env, DEM, 1)
    expect(b).toMatchObject({ xet: 0, het: true })
    expect((d.sql.prepare('SELECT gia_tri FROM cau_hinh WHERE khoa=?').get(KHOA_CON_TRO) as { gia_tri: string }).gia_tri).toBe('')
  })
})

describe('(4) Việc hôm nay trên máy chủ', () => {
  const muc = (k: number) => Array.from({ length: k }, (_, i) => ({ q: `Q${i}`, d: `D${i}`, t: 'can_chan_doan', l: 'goc' }))
  const ghi = (d: D, body: Record<string, unknown>) => hsGhiViecNgay(d.env, { token: d.token, ngay: '2026-10-07', ...body }).then((r) => r.json() as Promise<Record<string, any>>)
  const doc = async (d: D) => ((await (await danhSach(d.env, { token: d.token })).json()) as { viecNgay?: { n: string; m: { q: string }[]; x: string[]; them: number } }).viecNgay
  it('chưa có gì ⇒ danh sách không kèm viecNgay; ghi 12 câu ⇒ máy khác đọc đúng 12 câu ấy', async () => {
    const d = await dung()
    expect(await doc(d)).toBeUndefined()
    expect(await ghi(d, { m: muc(12), x: ['D0'], them: 0 })).toMatchObject({ ok: true })
    const v = await doc(d)
    expect(v?.n).toBe('2026-10-07')
    expect(v?.m.map((x) => x.q)).toEqual(muc(12).map((x) => x.q))
    expect(v?.x).toEqual(['D0'])
  })
  it('gộp: danh sách ngắn hơn KHÔNG ghi đè, dài hơn (thêm chặng) thắng; «đã xong» hợp lại; them lấy lớn nhất', async () => {
    const d = await dung()
    await ghi(d, { m: muc(12), x: ['D0'], them: 0 })
    await ghi(d, { m: muc(8), x: ['D3'], them: 0 })
    expect((await doc(d))?.m).toHaveLength(12)
    await ghi(d, { m: muc(16), x: ['D0', 'D5'], them: 1 })
    const v = await doc(d)
    expect(v?.m).toHaveLength(16)
    expect([...(v?.x ?? [])].sort()).toEqual(['D0', 'D3', 'D5'])
    expect(v?.them).toBe(1)
  })
  it('ngày khác ngày VN của máy chủ ⇒ bỏ qua, không ghi', async () => {
    const d = await dung()
    expect(await hsGhiViecNgay(d.env, { token: d.token, ngay: '2026-10-06', m: muc(12) }).then((r) => r.json())).toMatchObject({ ok: true, boQua: 'khac_ngay' })
    expect(await doc(d)).toBeUndefined()
  })
  it('28/10 «sửa phải xong mới hiện chặng sau»: máy em báo khoá + phần ngày còn câu ⇒ máy chủ từ chối mở chặng (TU_SUA_TRUOC); xong 12 câu ⇒ mở; «Sửa thêm» không khoá lại; chưa báo khoá ⇒ không chặn', async () => {
    const d = await dung()
    const { docConPhanKhoa } = await import('../server/src/tu-sua-viec-ngay')
    const { gameV2 } = await import('../server/src/game-v2')
    await ghi(d, { m: muc(12), x: ['D0'], them: 0 })
    const sbd = (await d.env.DB.prepare('SELECT sbd FROM tu_sua_viec_ngay').first<{ sbd: string }>())!.sbd
    expect(await docConPhanKhoa(d.env, sbd)).toBe(0) // chưa báo khoá ⇒ không chặn
    expect(await gameV2(d.env, 'hoc-tap-start', { token: d.token }).catch(() => ({}))).not.toMatchObject({ ma: 'TU_SUA_TRUOC' })
    await ghi(d, { m: muc(12), x: [], them: 0, khoa: true })
    expect(await docConPhanKhoa(d.env, sbd)).toBe(11)
    for (const lenh of ['hoc-tap-start', 'hoc-tap-lam-lai']) expect(await gameV2(d.env, lenh, { token: d.token })).toMatchObject({ ok: false, ma: 'TU_SUA_TRUOC', conSua: 11 })
    await ghi(d, { m: muc(12), x: muc(12).map((x) => x.d), them: 0 })
    expect(await docConPhanKhoa(d.env, sbd)).toBe(0)
    await ghi(d, { m: muc(16), x: [], them: 1 }) // «Sửa thêm 1 chặng»: 4 câu nối ở cuối
    expect(await docConPhanKhoa(d.env, sbd)).toBe(0)
    const sau = await gameV2(d.env, 'hoc-tap-start', { token: d.token }).catch((e: Error) => ({ loi: e.message }))
    expect((sau as Record<string, unknown>).ma).not.toBe('TU_SUA_TRUOC')
  })
  it('đợt em đã khép hôm nay ở màn sửa câu ⇒ có trong «đã xong» dù máy em chưa gửi', async () => {
    const d = await dung()
    await nop(d, '24')
    expect((await doc(d))?.x).toEqual([d.dotId])
  })
})
