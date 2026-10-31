// @vitest-environment node
// GÓI TỰ SỬA LỖI HÔM NAY ĐÓNG SẴN (thầy 31/10 17:20: «hs mở app lên là mọi thứ sẵn rồi»; server/src/goi-sua-dem.ts, src/lib/nap-truoc-sua.ts `napGoiSuaDem`):
//   · cron đóng gói ĐÚNG danh sách lượt mở app đầu sẽ dựng (ghi `viecNgay` ⇒ máy em gộp ra cùng danh sách), mỗi câu như mở thật (`dm`, tem hạn dài), không ghi lần làm;
//   · lượt mở app: một lần đọc R2 + MỘT câu D1; câu đã nộp SAU lúc đóng gói ⇒ bỏ; chưa có gói ⇒ `co: false`;
//   · cron chọn em chưa có gói, đóng rồi thì thôi; máy em đổ cả gói vào kho phần hôm nay một lượt, đã có gói thì khỏi hỏi lại trong ngày.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { goiWorker, taoD1That } from './_d1-that'
import worker from '../server/src/index'
import { seedChua, Q } from './_chua-cau-sai-fixture'
import { danhSach, moDot } from '../server/src/chua-cau-sai'
import { cronGoiSuaDem, docGoiSua, dongGoiSuaEm, khoaGoiSua, toiDaGoiSua } from '../server/src/goi-sua-dem'
import { moNiemSua } from '../server/src/chua-gon-niem'
import { moDmSua } from '../src/lib/sua-loi-may'
import { xoaDemCaBaoVe } from '../server/src/game-v2-bank'
import { xoaMoiDem } from '../server/src/dem-chung'
import { xoaDemCauHinh } from '../server/src/cau-hinh-dem'
import { ngayVn } from '../server/src/su-kien-hoc'
import type { Env } from '../server/src/kieu'

const api = vi.hoisted(() => ({ apiGoiSuaNgay: vi.fn(), apiGonMoNgay: vi.fn(), apiGonNop: vi.fn(), apiMoDot: vi.fn() }))
vi.mock('../src/lib/chua-cau-sai-api', () => api)
import { layNapTruocCauSuaNgay, napGoiSuaDem, xoaNapTruocCauSua } from '../src/lib/nap-truoc-sua'
import { dungViecHomNay } from '../src/lib/tu-sua-viec-hom-nay'

type Obj = Record<string, any>
const T = Date.parse('2026-10-07T03:00:00Z') // 10:00 VN

function khoMay() {
  const m = new Map<string, string>()
  vi.stubGlobal('localStorage', { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k), key: (i: number) => [...m.keys()][i] ?? null, get length() { return m.size }, clear: () => m.clear() })
  return m
}

describe('máy chủ: đóng gói Tự sửa lỗi hôm nay', () => {
  beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(T); xoaMoiDem(); xoaDemCaBaoVe(); khoMay() })
  afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); xoaDemCaBaoVe() })
  async function dung() {
    const d = taoD1That()
    xoaDemCauHinh(d.env as unknown as Env)
    const token = await seedChua(d.env)
    const dotId = (await (await moDot(d.env, { token, qid: Q })).json()).dotId as string
    return { ...d, token, dotId }
  }

  it('danh sách gói = danh sách lượt mở app đầu sẽ dựng; mỗi câu như mở thật (`dm` mở được, tem hạn dài), không ghi lần làm', async () => {
    // Không có cron: máy em xin kế hoạch như hiện nay ⇒ danh sách A.
    const a = await dung()
    const kqA = (await (await danhSach(a.env, { token: a.token, ke: 1 })).json()) as Obj
    const dsA = dungViecHomNay({ trangThai: 'bat', ...kqA } as never, Date.now(), 'HS1').viec!.muc.map((x) => x.m.qid)
    expect(dsA.length).toBeGreaterThan(0)
    // Có cron (máy khác, cùng dữ liệu): gói đóng sẵn ⇒ máy em mở app ra CÙNG danh sách.
    const b = await dung()
    const so = await dongGoiSuaEm(b.env, 'HS1', Date.now())
    expect(so).toBe(dsA.length)
    const kqB = (await (await danhSach(b.env, { token: b.token, ke: 1 })).json()) as Obj
    expect(kqB.viecNgay?.m?.length).toBe(dsA.length)
    expect(dungViecHomNay({ trangThai: 'bat', ...kqB } as never, Date.now(), 'HS1').viec!.muc.map((x) => x.m.qid)).toEqual(dsA)
    // gói trên R2: đúng ngày, mỗi câu kèm `dm` mở được + tem hạn dài (máy chủ nhận tới tận chiều tối)
    const goi = JSON.parse(String(b.objects.get(khoaGoiSua(ngayVn(Date.now()), 'HS1')))) as Obj
    expect(goi).toMatchObject({ v: 1, n: ngayVn(Date.now()) })
    const cau = goi.ds.find((x: Obj) => x.qid === Q)
    expect(cau).toMatchObject({ ok: true, dotId: b.dotId, gon: { ok: true, lan: 1 } })
    expect(await moDmSua(cau.gon.dm, b.dotId, cau.gon.ban)).toMatchObject({ d: b.dotId, b: cau.gon.ban, c: '24' })
    expect(await moNiemSua(b.env, 'HS1', b.dotId, cau.gon.ban, cau.gon.sk, Date.now() + 10 * 3_600_000)).toMatchObject({ d: b.dotId, L: 1 })
    expect(JSON.stringify({ ...cau.gon, dm: '', sk: '' })).not.toMatch(/bí mật lời giải|"24"/)
    expect(b.dem('chua_gon_lan')).toBe(0)
  })

  it('mở app: MỘT câu D1 + một lần đọc R2; câu đã nộp sau lúc đóng gói ⇒ bỏ; chưa có gói ⇒ co: false; đường /hs/chua-cau-sai/goi-ngay kiểm quyền', async () => {
    const d = await dung()
    expect(await docGoiSua(d.env, 'HS1', Date.now())).toMatchObject({ ok: true, co: false, ds: [] })
    await dongGoiSuaEm(d.env, 'HS1', Date.now())
    const truoc = d.soLenh.prepare
    const g = await docGoiSua(d.env, 'HS1', Date.now())
    expect(d.soLenh.prepare - truoc).toBe(1)
    expect(g.co).toBe(true)
    expect(g.ds.map((x) => x.qid)).toContain(Q)
    const j = await goiWorker(worker, d.env, '/hs/chua-cau-sai/goi-ngay', { token: d.token }) as Obj
    expect(j).toMatchObject({ ok: true, co: true })
    expect(j.ds[0]).toMatchObject({ ok: true, qid: Q, gon: { ok: true } })
    expect((await goiWorker(worker, d.env, '/hs/chua-cau-sai/goi-ngay', {}) as Obj).ok).toBe(false)
    // em nộp câu ấy (máy khác) sau lúc đóng gói ⇒ gói của câu ấy cũ ⇒ bỏ
    vi.setSystemTime(T + 60_000)
    d.sql.prepare("INSERT INTO chua_gon_lan(khoa,dot_id,sbd,ngay_vn,lan,ban,tra_loi,dung,ket,luc) VALUES('k1',?,'HS1',?,1,?,'1',0,'{}',?)").run(d.dotId, ngayVn(Date.now()), Q, Date.now())
    expect((await docGoiSua(d.env, 'HS1', Date.now())).ds.map((x) => x.qid)).not.toContain(Q)
  })

  it('cron: chọn em chưa có gói, đóng rồi thì thôi; hạn mức theo giờ (tối chỉ 1 em mỗi 5 phút, 00:00–00:14 nghỉ)', async () => {
    const d = await dung()
    expect(await cronGoiSuaDem(d.env, Date.now(), 3)).toBe(1)
    expect(d.dem('sua_goi_ngay', "sbd='HS1' AND so>=1")).toBe(1)
    expect(await cronGoiSuaDem(d.env, Date.now(), 3)).toBe(0)
    const vn = (h: number, p: number) => Date.UTC(2026, 9, 7, h - 7 < 0 ? h + 17 : h - 7, p) - (h - 7 < 0 ? 86_400_000 : 0)
    expect(toiDaGoiSua(vn(0, 5))).toBe(0)
    expect(toiDaGoiSua(vn(2, 0))).toBe(6)
    expect(toiDaGoiSua(vn(20, 1))).toBe(0)
    expect(toiDaGoiSua(vn(20, 5))).toBe(1)
  })
})

describe('máy em: đổ gói đóng sẵn vào kho phần hôm nay một lượt', () => {
  const MO = (q: string) => ({ ok: true, dotId: `D-${q}`, gon: { ok: true, dotId: `D-${q}`, lan: 1, ban: q, de: { qid: q, phan: 'I', text: 'x' }, dm: 'k.g' } })
  beforeEach(() => {
    vi.useFakeTimers({ now: Date.parse('2026-10-31T03:00:00Z') })
    khoMay(); vi.clearAllMocks(); xoaNapTruocCauSua()
    localStorage.setItem('omr_student_portal_auth', JSON.stringify({ sbd: '10044', token: 't' }))
  })
  afterEach(() => { xoaNapTruocCauSua(); vi.useRealTimers(); vi.unstubAllGlobals() })

  it('có gói ⇒ cả phần vào kho, nhớ đã có gói (lần mở sau trong ngày khỏi hỏi); chưa có gói ⇒ không nhớ (lần sau hỏi lại); lệch ngày ⇒ bỏ', async () => {
    api.apiGoiSuaNgay.mockResolvedValueOnce({ co: false, n: '2026-10-31', ds: [] })
    expect(await napGoiSuaDem('t')).toBe(0)
    xoaNapTruocCauSua(); localStorage.setItem('omr_student_portal_auth', JSON.stringify({ sbd: '10044', token: 't' }))
    const ds = Array.from({ length: 30 }, (_, i) => `Q${i}`)
    api.apiGoiSuaNgay.mockResolvedValueOnce({ co: true, n: '2026-10-31', ds: ds.map((q) => ({ qid: q, kq: MO(q) })) })
    expect(await napGoiSuaDem('t')).toBe(30)
    expect(api.apiGoiSuaNgay).toHaveBeenCalledTimes(2)
    for (const q of ds) expect(layNapTruocCauSuaNgay('t', q)).toMatchObject({ dotId: `D-${q}` })
    xoaNapTruocCauSua(); localStorage.setItem('omr_student_portal_auth', JSON.stringify({ sbd: '10044', token: 't' }))
    expect(await napGoiSuaDem('t')).toBe(0)
    expect(api.apiGoiSuaNgay).toHaveBeenCalledTimes(2)
    // gói của ngày khác (máy chủ đóng trước nửa đêm) ⇒ không dùng
    localStorage.removeItem('omr_sua_goi_10044'); xoaNapTruocCauSua(); localStorage.setItem('omr_student_portal_auth', JSON.stringify({ sbd: '10044', token: 't' }))
    api.apiGoiSuaNgay.mockResolvedValueOnce({ co: true, n: '2026-10-30', ds: [{ qid: 'X', kq: MO('X') }] })
    expect(await napGoiSuaDem('t')).toBe(0)
    expect(layNapTruocCauSuaNgay('t', 'X')).toBeNull()
  })
})
