// @vitest-environment node
// SỬA LỖI 12–36 CÂU/NGÀY (thầy 29/10) — phần máy chủ trên D1 thật (lược đồ thật): danh sách trả `ke` đúng lúc, việc hôm nay lưu mục tiêu `mt`,
// khoá chặng sau Sửa lỗi đếm theo mục tiêu, không lập lại sau khi đã lưu / em đã làm.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { taoD1That } from './_d1-that'
import { seedChua } from './_chua-cau-sai-fixture'
import { danhSach } from '../server/src/chua-cau-sai'
import { docConPhanKhoa, hsGhiViecNgay } from '../server/src/tu-sua-viec-ngay'
import { xoaDemCaBaoVe } from '../server/src/game-v2-bank'
import { xoaLuotDong } from '../server/src/chua-gon'

const T = Date.parse('2026-10-29T03:00:00Z') // 10:00 VN 29/10
const NGAY = '2026-10-29'
const NG = 86_400_000
beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(T); xoaDemCaBaoVe(); xoaLuotDong() })
afterEach(() => { vi.useRealTimers(); xoaDemCaBaoVe() })

type Ung = { q: string; d?: string; t: string; l: string }
interface Dot { dang?: string; muc?: string; tt?: string; lan?: number; sai?: number; den?: string; dong?: number }
async function dung(sodo: { moi: number; dang?: number; cho?: number; daSua?: number; daSuaTruoc?: number }) {
  const dB = taoD1That()
  const token = await seedChua(dB.env)
  dB.sql.exec('DELETE FROM chua_loi_dot') // bỏ đợt mẫu của fixture: mỗi ca tự dựng đúng số câu sai của nó
  const them = dB.sql.prepare(`INSERT INTO chua_loi_dot(id,sbd,qid_chuan,content_group,mo_luc,sai_cuoi_luc,dong_luc,trang_thai_day,lan_gap_lai,den_han,tao_luc,cap_nhat_luc)
    VALUES(?,'HS1',?,'g',?,?,?,?,?,?,?,?)`)
  const meta = dB.sql.prepare('INSERT INTO cau_meta(ma_de,qid,thu_tu,dang,muc_do,chuyen_de) VALUES(?,?,?,?,?,?)')
  let k = 0
  const dot = (o: Dot) => {
    const i = ++k
    const sai = o.sai ?? T - (2 + (i % 30)) * NG
    them.run(`D${i}`, `QX${i}`, sai, sai, o.dong ?? null, o.tt ?? 'can_chan_doan', o.lan ?? 0, o.den ?? '', sai, o.dong ?? sai)
    if (o.dang) meta.run('MD', `QX${i}`, i, o.dang, o.muc ?? 'TH', 'cd')
  }
  const MUC = ['NB', 'TH', 'VD', 'VDC']
  for (let i = 0; i < sodo.moi; i++) dot({ dang: `dang-${i % (sodo.dang ?? 30)}`, muc: MUC[i % 4] })
  for (let i = 0; i < (sodo.cho ?? 0); i++) dot({ dang: `dang-${i % 5}`, tt: 'cho_gap_lai_2', den: '2026-11-05', lan: 1 })
  for (let i = 0; i < (sodo.daSua ?? 0); i++) dot({ tt: 'da_tu_sua', dong: T - 3 * NG })
  for (let i = 0; i < (sodo.daSuaTruoc ?? 0); i++) dot({ tt: 'da_tu_sua', dong: T - 20 * NG })
  return { ...dB, token }
}
type D = Awaited<ReturnType<typeof dung>>
type KetQua = { ke?: { n: number; ung: Ung[] }; viecNgay?: { m: Ung[]; x: string[]; them: number; mt?: number }; dem: { can: number; cho: number } }
const doc = async (d: D, xin = true) => (await (await danhSach(d.env, { token: d.token, ...(xin ? { ke: 1 } : {}) })).json()) as KetQua
const ghi = (d: D, body: Record<string, unknown>) => hsGhiViecNgay(d.env, { token: d.token, ngay: NGAY, ...body }).then((r) => r.json() as Promise<Record<string, unknown>>)
const dangCua = (d: D, ds: Ung[]) => ds.map((u) => (d.sql.prepare('SELECT dang FROM cau_meta WHERE qid=?').get(u.q) as { dang: string }).dang)
const mucCua = (d: D, ds: Ung[]) => ds.map((u) => (d.sql.prepare('SELECT muc_do FROM cau_meta WHERE qid=?').get(u.q) as { muc_do: string }).muc_do)

describe('danh sách Tự sửa lỗi trả kế hoạch ngày', () => {
  it('300 câu sai, 30 dạng ⇒ 20 câu/ngày, 20 dạng khác nhau, mỗi mức 5 câu; chưa có viecNgay', async () => {
    const d = await dung({ moi: 300 })
    const j = await doc(d)
    expect(j.viecNgay).toBeUndefined()
    expect(j.ke?.n).toBe(20)
    expect(j.ke?.ung).toHaveLength(20)
    expect(new Set(dangCua(d, j.ke!.ung)).size).toBe(20)
    for (const m of ['NB', 'TH', 'VD', 'VDC']) expect(mucCua(d, j.ke!.ung).filter((x) => x === m)).toHaveLength(5)
    expect(new Set(j.ke!.ung.map((u) => u.d)).size).toBe(20)
    expect(j.ke!.ung.every((u) => u.l === 'goc')).toBe(true)
  })
  it('ít câu sai ⇒ tối thiểu 12; ít hơn 12 câu ⇒ đúng số có', async () => {
    const a = await doc(await dung({ moi: 40 }))
    expect(a.ke?.n).toBe(12)
    expect(a.ke?.ung).toHaveLength(12)
    const b = await doc(await dung({ moi: 5 }))
    expect(b.ke?.n).toBe(12)
    expect(b.ke?.ung).toHaveLength(5)
  })
  it('trần 36 câu/ngày dù tồn 700 câu', async () => {
    const j = await doc(await dung({ moi: 700 }))
    expect(j.ke?.n).toBe(36)
    expect(j.ke?.ung).toHaveLength(36)
  })
  it('câu chờ gặp lại tính vào số câu nhưng không được xếp vào hôm nay; câu đã sửa 11 ngày qua tính, câu sửa lâu hơn không', async () => {
    const co = await doc(await dung({ moi: 100, cho: 150, daSua: 100 })) // tổng 350 ⇒ ⌈350/15⌉ = 24
    expect(co.ke?.n).toBe(24)
    expect(co.ke?.ung.every((u) => u.t !== 'cho_gap_lai_2')).toBe(true)
    const khong = await doc(await dung({ moi: 100, cho: 150, daSuaTruoc: 100 })) // 250 ⇒ 17
    expect(khong.ke?.n).toBe(17)
  })
  it('em chưa có câu nào cần sửa ⇒ không có kế hoạch', async () => {
    const j = await doc(await dung({ moi: 0, daSua: 30 }))
    expect(j.ke).toBeUndefined()
  })
  it('lưu việc hôm nay kèm mục tiêu ⇒ lần mở sau đọc đúng mt, KHÔNG lập lại', async () => {
    const d = await dung({ moi: 300 })
    const ke = (await doc(d)).ke!
    expect(await ghi(d, { m: ke.ung, x: [], them: 0, mt: ke.n })).toMatchObject({ ok: true })
    const j = await doc(d)
    expect(j.viecNgay?.mt).toBe(20)
    expect(j.viecNgay?.m).toHaveLength(20)
    expect(j.ke).toBeUndefined()
  })
  it('danh sách 12 câu lập từ trước bản này, em chưa làm câu nào ⇒ bù cho đủ, giữ nguyên 12 câu cũ, không trùng', async () => {
    const d = await dung({ moi: 300 })
    const ke = (await doc(d)).ke!
    const cu = ke.ung.slice(0, 12)
    await ghi(d, { m: cu, x: [], them: 0 }) // máy cũ: không gửi mt
    const j = await doc(d)
    expect(j.viecNgay?.mt).toBeUndefined()
    expect(j.ke?.n).toBe(20)
    expect(j.ke?.ung).toHaveLength(8)
    expect(j.ke!.ung.some((u) => cu.some((c) => c.d === u.d))).toBe(false)
  })
  it('29/10 áp dụng NGAY HÔM NAY: em đã làm xong vài câu của danh sách 12 câu cũ ⇒ vẫn bù cho đủ N; đã thêm chặng ⇒ không bù', async () => {
    const d = await dung({ moi: 300 })
    const ke = (await doc(d)).ke!
    await ghi(d, { m: ke.ung.slice(0, 12), x: [ke.ung[0]!.d, ke.ung[1]!.d], them: 0 })
    const bu = (await doc(d)).ke
    expect(bu?.n).toBe(20)
    expect(bu?.ung).toHaveLength(8)
    expect(bu!.ung.some((u) => ke.ung.slice(0, 12).some((c) => c.d === u.d))).toBe(false)
    await ghi(d, { m: [...ke.ung.slice(0, 12), ...bu!.ung], x: [ke.ung[0]!.d], them: 0, mt: 20 })
    expect((await doc(d)).ke).toBeUndefined() // đã lập (mt = 20) ⇒ không bù lại
    const e = await dung({ moi: 300 })
    await ghi(e, { m: (await doc(e)).ke!.ung.slice(0, 16), x: [], them: 1 })
    expect((await doc(e)).ke).toBeUndefined()
  })
  it('trang sau của danh sách (có mốc `sau`) không lập kế hoạch', async () => {
    const d = await dung({ moi: 300 })
    const j = (await (await danhSach(d.env, { token: d.token })).json()) as { sau?: unknown }
    const t2 = (await (await danhSach(d.env, { token: d.token, ke: 1, sau: j.sau })).json()) as KetQua
    expect(t2.ke).toBeUndefined()
  })
  it('máy em KHÔNG xin (đã nhớ mục tiêu) ⇒ không có kế hoạch, danh sách vẫn MỘT lô D1 như trước; có xin ⇒ vẫn MỘT lô (câu đọc ứng viên đi cùng lô)', async () => {
    const d = await dung({ moi: 300 })
    d.soLenh.batch = 0
    expect((await doc(d, false)).ke).toBeUndefined()
    const khong = d.soLenh.batch
    d.soLenh.batch = 0
    expect((await doc(d, true)).ke?.n).toBe(20)
    expect(d.soLenh.batch).toBe(khong)
    expect(khong).toBe(1)
  })
  it('bảng siêu dữ liệu câu hỏng (lô có ứng viên lỗi) ⇒ danh sách VẪN đủ ds + dem + viecNgay, chỉ thiếu kế hoạch', async () => {
    const d = await dung({ moi: 30 })
    await ghi(d, { m: [{ q: 'QX1', d: 'D1', t: 'can_chan_doan', l: 'goc' }], x: ['D1'], them: 0 })
    d.sql.exec('DROP TABLE cau_meta')
    const j = await doc(d)
    expect(j.ke).toBeUndefined()
    expect(j.dem.can).toBe(30)
    expect(j.viecNgay?.x).toEqual(['D1'])
  })
})

describe('mục tiêu `mt` lưu theo ngày', () => {
  it('nhận 12…36 (12 = đã lập, dấu để máy em khỏi xin lại); chỉ tăng trong ngày; dưới 12 hoặc lạ ⇒ không ghi', async () => {
    const d = await dung({ moi: 300 })
    const m = [{ q: 'QX1', d: 'D1', t: 'can_chan_doan', l: 'goc' }]
    await ghi(d, { m, mt: 5 })
    await ghi(d, { m, mt: 'abc' })
    expect(d.sql.prepare('SELECT COUNT(*) AS n FROM tu_sua_muc_tieu_ngay').get()).toMatchObject({ n: 0 })
    await ghi(d, { m, mt: 12 })
    expect(d.sql.prepare('SELECT muc_tieu FROM tu_sua_muc_tieu_ngay').get()).toMatchObject({ muc_tieu: 12 })
    await ghi(d, { m, mt: 99 })
    expect(d.sql.prepare('SELECT muc_tieu FROM tu_sua_muc_tieu_ngay').get()).toMatchObject({ muc_tieu: 36 })
    await ghi(d, { m, mt: 20 })
    expect(d.sql.prepare('SELECT muc_tieu FROM tu_sua_muc_tieu_ngay').get()).toMatchObject({ muc_tieu: 36 })
  })
  it('bảng mục tiêu chưa áp ⇒ vẫn lưu được việc hôm nay (không làm hỏng bản lưu)', async () => {
    const d = await dung({ moi: 20 })
    d.sql.exec('DROP TABLE tu_sua_muc_tieu_ngay')
    const m = Array.from({ length: 14 }, (_, i) => ({ q: `Q${i}`, d: `D${i}`, t: 'can_chan_doan', l: 'goc' }))
    expect(await ghi(d, { m, x: [], them: 0, mt: 14 })).toMatchObject({ ok: true })
    expect(d.sql.prepare('SELECT COUNT(*) AS n FROM tu_sua_viec_ngay').get()).toMatchObject({ n: 1 })
  })
})

describe('khoá chặng sau Sửa lỗi đếm theo mục tiêu của ngày', () => {
  const muc = (k: number) => Array.from({ length: k }, (_, i) => ({ q: `Q${i}`, d: `D${i}`, t: 'can_chan_doan', l: 'goc' }))
  it('ngày 20 câu: khoá đếm cả 20 câu; xong 12 câu đầu vẫn còn 8; xong hết ⇒ 0', async () => {
    const d = await dung({ moi: 10 })
    await ghi(d, { m: muc(20), x: [], them: 0, mt: 20, khoa: true })
    expect(await docConPhanKhoa(d.env, 'HS1')).toBe(20)
    await ghi(d, { m: muc(20), x: muc(12).map((x) => x.d), them: 0 })
    expect(await docConPhanKhoa(d.env, 'HS1')).toBe(8)
    await ghi(d, { m: muc(20), x: muc(20).map((x) => x.d), them: 0 })
    expect(await docConPhanKhoa(d.env, 'HS1')).toBe(0)
  })
  it('máy cũ không gửi mt ⇒ khoá vẫn đếm 12 câu đầu như trước', async () => {
    const d = await dung({ moi: 10 })
    await ghi(d, { m: muc(20), x: [], them: 0, khoa: true })
    expect(await docConPhanKhoa(d.env, 'HS1')).toBe(12)
  })
  it('«Sửa thêm 1 chặng» nối 4 câu cuối ngày 20 câu ⇒ không làm khoá lại', async () => {
    const d = await dung({ moi: 10 })
    await ghi(d, { m: muc(20), x: [], them: 0, mt: 20, khoa: true })
    await ghi(d, { m: muc(24), x: muc(20).map((x) => x.d), them: 1, mt: 20 })
    expect(await docConPhanKhoa(d.env, 'HS1')).toBe(0)
  })
  it('bảng mục tiêu chưa áp ⇒ khoá đọc lại như cũ (12 câu), không tắt khoá', async () => {
    const d = await dung({ moi: 10 })
    await ghi(d, { m: muc(20), x: [], them: 0, khoa: true })
    d.sql.exec('DROP TABLE tu_sua_muc_tieu_ngay')
    expect(await docConPhanKhoa(d.env, 'HS1')).toBe(12)
  })
})
