// @vitest-environment jsdom
// TỰ SỬA LỖI — ĐÁP ÁN TRÊN MÁY + TẢI SẴN PHẦN HÔM NAY (thầy 31/10: «làm cả cho tự sửa lỗi … xong đẩy luôn»):
//   · gon-mo kèm `dm` (khoá riêng em + ngày, gắn đợt + bản) — mở ra ĐÚNG phần chấm của tem; khác đợt / khác bản ⇒ không mở; công tắc thầy tắt ⇒ không gắn;
//   · chấm tại máy (`ketSuaMay`) = dòng tạm của máy chủ (`dong1Sua`) trên mọi phần / lần / cờ, và = bản lưu (`gonNop`) ở ca thật (đúng lần 1; sai ⇒ lần 2 dựng tại máy);
//   · `gon-mo-ngay`: nhiều câu một lượt, mỗi câu như `mo-dot` kèm `gon` (có `dm`), không ghi lần làm; quyền như mo-dot;
//   · máy em: phần hôm nay giữ cả ngày, dùng một lần mỗi câu, qua ngày ⇒ bỏ; lần nộp mất mạng xếp hàng, gửi lại đúng thứ tự, mất mạng tiếp ⇒ giữ.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { goiWorker, taoD1That } from './_d1-that'
import worker from '../server/src/index'
import { seedChua, Q } from './_chua-cau-sai-fixture'
import { moDot } from '../server/src/chua-cau-sai'
import { gonMo, gonMoNgay, gonNop } from '../server/src/chua-gon-lenh'
import { dong1Sua, dmSua, SO_LAN_MOI_NGAY, type NiemSua } from '../server/src/chua-gon-niem'
import { xoaDemCaBaoVe } from '../server/src/game-v2-bank'
import { xoaMoiDem } from '../server/src/dem-chung'
import { xoaDemCauHinh } from '../server/src/cau-hinh-dem'
import { chamCauTuLuyen } from '../src/lib/tu-luyen'
import { dungSuaMay, goiChoLan, ketSuaMay, moDmSua, SO_LAN_SUA_MAY, type GoiSuaMay } from '../src/lib/sua-loi-may'
import type { Env } from '../server/src/kieu'
import type { PrivateQuestion } from '../src/game/than-thu-v2/core'

const api = vi.hoisted(() => ({ apiGonMoNgay: vi.fn(), apiGonNop: vi.fn(), apiMoDot: vi.fn() }))
vi.mock('../src/lib/chua-cau-sai-api', () => api)
import { coSuaChoGui, guiLaiSuaCho, layNapTruocCauSua, layNapTruocCauSuaNgay, napTruocSuaNgay, xepSuaChoGui, xoaNapTruocCauSua } from '../src/lib/nap-truoc-sua'

type Obj = Record<string, any>
const T = Date.parse('2026-10-07T03:00:00Z')

describe('máy chủ: gon-mo kèm `dm`, chấm tại máy = máy chủ', () => {
  beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(T); xoaMoiDem(); xoaDemCaBaoVe() })
  afterEach(() => { vi.useRealTimers(); xoaDemCaBaoVe() })
  async function dung() {
    const d = taoD1That()
    xoaDemCauHinh(d.env as unknown as Env)
    const token = await seedChua(d.env)
    const dotId = (await (await moDot(d.env, { token, qid: Q })).json()).dotId as string
    return { ...d, token, dotId }
  }
  type D = Awaited<ReturnType<typeof dung>>
  const mo = async (d: D): Promise<Obj> => (await (await gonMo(d.env, { token: d.token, dotId: d.dotId, qid: Q })).json()) as Obj
  let n = 0
  const nop = async (d: D, m: Obj, traLoi: string) => (await (await gonNop(d.env, { token: d.token, dotId: d.dotId, ban: m.ban, traLoi, khoa: `k${++n}`, qid: Q })).json()) as Obj
  const soKet = (a: Obj, b: Obj) => {
    for (const k of ['ket', 'dung', 'lan', 'lyDo', 'trangThai', 'goiY', 'ban', 'dotId']) expect(a[k], k).toEqual(b[k])
    if (b.chiTiet) { expect(a.ct.dapAn).toBe(b.chiTiet.dapAn); expect(JSON.stringify(a.ct.loiGiai)).toBe(JSON.stringify(b.chiTiet.loiGiai)) } else expect(a.ct).toBeUndefined()
  }

  it('`dm` mở đúng phần chấm; đề công khai vẫn không lộ đáp án; khác đợt / khác bản ⇒ không mở', async () => {
    const d = await dung()
    const m = await mo(d)
    expect(typeof m.dm).toBe('string')
    const { dm: _dm, ...conLai } = m
    expect(JSON.stringify(conLai)).not.toMatch(/"24"|bí mật lời giải/)
    expect(m.dm).not.toMatch(/bí mật|"24"/)
    const g = (await moDmSua(m.dm, d.dotId, m.ban))!
    expect(g).toMatchObject({ d: d.dotId, b: m.ban, p: 'III', c: '24', L: 1 })
    expect(await moDmSua(m.dm, 'dot-khac', m.ban)).toBeNull()
    expect(await moDmSua(m.dm, d.dotId, 'ban-khac')).toBeNull()
    expect(await moDmSua(m.dm.slice(0, -3) + 'AAA', d.dotId, m.ban)).toBeNull()
  })

  it('đúng lần 1: chấm tại máy = bản lưu của máy chủ', async () => {
    const d = await dung()
    const m = await mo(d)
    const g = (await moDmSua(m.dm, d.dotId, m.ban))!
    soKet(ketSuaMay(goiChoLan(g, m.lan)!, '24'), await nop(d, m, '24'))
  })

  it('sai lần 1 ⇒ gợi ý (không đáp án); lần 2 dựng tại máy = lần 2 của máy chủ', async () => {
    const d = await dung()
    const m = await mo(d)
    const g = (await moDmSua(m.dm, d.dotId, m.ban))!
    const t1 = ketSuaMay(g, '40')
    expect(t1.ct).toBeUndefined()
    soKet(t1, await nop(d, m, '40'))
    const g2 = goiChoLan(g, 2)!
    soKet(ketSuaMay(g2, '41'), await nop(d, m, '41'))
    expect(goiChoLan(g, 3)).toBeNull()
  })

  it('công tắc thầy `{"bat":false}` ⇒ gon-mo không gắn `dm` (câu vẫn mở như cũ)', async () => {
    const d = await dung()
    d.sql.prepare("INSERT INTO cau_hinh (khoa, gia_tri, cap_nhat_luc) VALUES ('dap_an_tren_may', '{\"bat\":false}', 'x')").run()
    xoaDemCauHinh(d.env as unknown as Env)
    const m = await mo(d)
    expect(m).toMatchObject({ ok: true, lan: 1 }) // (tem `sk` cần CompressionStream — môi trường jsdom không có; tests/chua-gon-niem-2910 canh tem)
    expect(m.dm).toBeUndefined()
  })

  it('gon-mo-ngay: mỗi câu như mo-dot + gon (kèm `dm`), câu lạ bỏ qua, không ghi lần làm', async () => {
    const d = await dung()
    const sbd = 'HS1'
    const r = (await (await gonMoNgay(d.env, { qids: [Q, 'KHONG-CO-CAU', Q] }, sbd)).json()) as Obj
    expect(r.ok).toBe(true)
    const cau = r.ds.find((x: Obj) => x.qid === Q)
    expect(cau).toMatchObject({ ok: true, dotId: d.dotId, gon: { ok: true, lan: 1, dotId: d.dotId } })
    expect(typeof cau.gon.dm).toBe('string')
    expect(r.ds.filter((x: Obj) => x.qid === Q)).toHaveLength(1)
    expect(r.ds.find((x: Obj) => x.qid === 'KHONG-CO-CAU')?.ok).not.toBe(true)
    const lan = d.sql.prepare('SELECT COUNT(*) AS n FROM chua_gon_lan').get() as { n: number }
    expect(lan.n).toBe(0)
    // nộp bằng bản đã tải sẵn ⇒ máy chủ nhận như mở thường
    expect((await nop(d, cau.gon, '24')).ok).toBe(true)
  })

  it('đường /hs/chua-cau-sai/gon-mo-ngay: kiểm quyền như mo-dot (thiếu đăng nhập ⇒ từ chối); có quyền ⇒ trả từng câu', async () => {
    const d = await dung()
    const j = await goiWorker(worker, d.env, '/hs/chua-cau-sai/gon-mo-ngay', { token: d.token, qids: [Q] }) as Obj
    expect(j.ok).toBe(true)
    expect(j.ds[0]).toMatchObject({ ok: true, qid: Q, gon: { ok: true } })
    const khong = await goiWorker(worker, d.env, '/hs/chua-cau-sai/gon-mo-ngay', { qids: [Q] }) as Obj
    expect(khong.ok).toBe(false)
  })
})

describe('luật chấm tại máy khớp tuyệt đối dòng tạm của máy chủ', () => {
  const env = { MA_BI_MAT: 'bi-mat-thu' } as unknown as Env
  it('SO_LAN khớp; dungSuaMay = chamCauTuLuyen; ketSuaMay = dong1Sua (bỏ tem lần 2) trên mọi phần / lần / cờ', async () => {
    expect(SO_LAN_SUA_MAY).toBe(SO_LAN_MOI_NGAY)
    const DE: Array<{ p: 'I' | 'II' | 'III'; c: string; tra: string[] }> = [
      { p: 'I', c: 'C', tra: ['C', 'c', ' C ', 'C.', 'C)', 'A', 'D', '', 'CC', 'E'] },
      { p: 'II', c: 'DSDS', tra: ['DSDS', 'dsds', 'ĐSĐS', 'đ,s,đ,s', 'DSDD', 'SSSS', 'DSD', '', 'D-DS'] },
      { p: 'III', c: '24', tra: ['24', '24,0', '24.00', ' 24 ', '2,4', '240', '23', '', 'abc', '24 g/mol'] },
      { p: 'III', c: '0,25', tra: ['0,25', '0.25', '.25', '0,250', '0,2', '1/4', '0.26'] },
    ]
    let so = 0
    for (const de of DE) for (const tra of de.tra) for (const L of [1, 2]) for (const tu of [0, 1] as const) for (const dg of [0, 1] as const) for (const gy of [undefined, 'Gợi ý bước 1']) {
      const g: GoiSuaMay = { d: 'D1', b: 'B1', p: de.p, c: de.c, L, tu, dg, ...(gy ? { gy } : {}), l: { buoc: ['x'] }, h: [{ src: 'a.png', viTri: 'sau_loi_giai' }] }
      expect(dungSuaMay(de.p, de.c, tra), `${de.p} «${tra}»`).toBe(chamCauTuLuyen(de.p, de.c, tra).dung)
      const nd = { v: 1, e: Date.now() + 60_000, ...g } as NiemSua
      const { sk2: _s, ...chu } = await dong1Sua(env, 'S1', nd, tra)
      expect(ketSuaMay(g, tra), `${de.p} «${tra}» L${L} tu${tu} dg${dg}`).toEqual(chu)
      so++
    }
    expect(so).toBeGreaterThan(300)
  })
  it('dmSua ⇒ moDmSua mở ra đúng phần chấm (cùng khuôn với tem)', async () => {
    const ban = { qid: 'B1', phan: 'II', correct: 'DSDS', solution: { buoc: ['y'] }, hinhAnh: [{ src: 'h.png', viTri: 'sau_loi_giai' }, { src: 'de.png', viTri: 'de' }] } as unknown as PrivateQuestion
    const dm = (await dmSua(env, 'S1', { dotId: 'D9', ban, lan: 1, tuSua: true, docGan: false, goiY: 'gy' }))!
    expect(await moDmSua(dm, 'D9', 'B1')).toEqual({ d: 'D9', b: 'B1', p: 'II', c: 'DSDS', L: 1, tu: 1, dg: 0, gy: 'gy', l: { buoc: ['y'] }, h: [{ src: 'h.png', viTri: 'sau_loi_giai' }] })
    expect(await dmSua({ MA_BI_MAT: '' } as unknown as Env, 'S1', { dotId: 'D9', ban, lan: 1, tuSua: true, docGan: false })).toBeUndefined()
  })
})

describe('máy em: phần hôm nay + lần nộp chờ gửi', () => {
  const MO = (q: string) => ({ ok: true, dotId: `D-${q}`, gon: { ok: true, dotId: `D-${q}`, lan: 1, ban: q, de: { qid: q, phan: 'I', text: 'x' }, dm: 'k.g' } })
  beforeEach(() => {
    vi.clearAllMocks(); localStorage.clear(); xoaNapTruocCauSua()
    localStorage.setItem('omr_student_portal_auth', JSON.stringify({ sbd: '10044', token: 't' }))
    api.apiGonMoNgay.mockImplementation(async (_t: string, qids: string[]) => qids.map((q) => ({ qid: q, kq: MO(q) })))
  })
  afterEach(() => { xoaNapTruocCauSua() })

  it('một lượt cho nhiều câu; mỗi câu dùng MỘT lần; còn sau khi mở lại app (cùng ngày); qua ngày ⇒ bỏ; câu vừa hỏi không hỏi lại', async () => {
    const t0 = Date.parse('2026-10-31T03:00:00Z')
    expect(await napTruocSuaNgay('t', ['A', 'B', 'C'], t0)).toBe(3)
    expect(api.apiGonMoNgay).toHaveBeenCalledTimes(1)
    expect(api.apiGonMoNgay).toHaveBeenCalledWith('t', ['A', 'B', 'C'])
    expect(layNapTruocCauSuaNgay('t', 'A', t0 + 3_600_000)).toMatchObject({ dotId: 'D-A' }) // quá hạn nạp-trước-một-câu nhưng phần hôm nay giữ cả ngày
    expect(layNapTruocCauSuaNgay('t', 'A', t0 + 3_600_000)).toBeNull()
    expect(await napTruocSuaNgay('t', ['A', 'B', 'C'], t0 + 1000)).toBe(0) // A vừa hỏi (2 phút), B C đã có
    expect(api.apiGonMoNgay).toHaveBeenCalledTimes(1)
    // mở lại app: bộ nhớ trống, bản trên máy còn
    xoaNapTruocCauSua.call(null); localStorage.setItem('omr_student_portal_auth', JSON.stringify({ sbd: '10044', token: 't' }))
    const giu = localStorage.getItem('omr_sua_ngay_10044')
    expect(giu).toContain('D-B')
    expect(await layNapTruocCauSua('t', 'B', t0 + 2 * 3_600_000)).toMatchObject({ dotId: 'D-B' })
    // qua ngày VN ⇒ không dùng
    expect(layNapTruocCauSuaNgay('t', 'C', Date.parse('2026-11-01T03:00:00Z'))).toBeNull()
  })

  it('tải NỐI TIẾP từng lượt 12 câu tới HẾT phần hôm nay (thầy 31/10 «Sao lại tải sẵn tối đa 12 câu thôi»); lượt lỗi ⇒ dừng', async () => {
    vi.useFakeTimers({ now: Date.parse('2026-10-31T03:00:00Z') })
    try {
      const ds = Array.from({ length: 30 }, (_, i) => `Q${i}`)
      expect(await napTruocSuaNgay('t', ds)).toBe(12)
      await vi.advanceTimersByTimeAsync(8_000)
      await vi.advanceTimersByTimeAsync(8_000)
      expect(api.apiGonMoNgay.mock.calls.map((c) => (c[1] as string[]).length)).toEqual([12, 12, 6])
      await vi.advanceTimersByTimeAsync(60_000)
      expect(api.apiGonMoNgay).toHaveBeenCalledTimes(3)
      for (const q of ds) expect(layNapTruocCauSuaNgay('t', q)).toMatchObject({ dotId: `D-${q}` })
      // lượt không về câu nào ⇒ không nối tiếp (không dội máy chủ)
      xoaNapTruocCauSua(); vi.clearAllMocks(); api.apiGonMoNgay.mockResolvedValue([])
      expect(await napTruocSuaNgay('t', ds.map((q) => `R${q}`))).toBe(0)
      await vi.advanceTimersByTimeAsync(60_000)
      expect(api.apiGonMoNgay).toHaveBeenCalledTimes(1)
    } finally { vi.useRealTimers() }
  })

  it('mất mạng ⇒ không hỏi; lỗi ⇒ thôi', async () => {
    const onl = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    expect(await napTruocSuaNgay('t', ['A'])).toBe(0)
    onl.mockRestore()
    api.apiGonMoNgay.mockRejectedValueOnce(new Error('x'))
    expect(await napTruocSuaNgay('t', ['B'])).toBe(0)
  })

  it('lần nộp chờ gửi: đúng thứ tự, trùng khoá ⇒ một; mất mạng giữa chừng ⇒ dừng, giữ phần còn lại; máy chủ từ chối hẳn ⇒ bỏ', async () => {
    xepSuaChoGui({ dotId: 'D1', ban: 'B', traLoi: '40', khoa: 'k1', qid: 'Q', luc: 1 })
    xepSuaChoGui({ dotId: 'D1', ban: 'B', traLoi: '24', khoa: 'k2', qid: 'Q', luc: 2 })
    xepSuaChoGui({ dotId: 'D1', ban: 'B', traLoi: '24', khoa: 'k2', qid: 'Q', luc: 3 })
    expect(coSuaChoGui()).toBe(true)
    api.apiGonNop.mockResolvedValueOnce({ ok: true, ket: 'goi_y', lan: 1 }).mockResolvedValueOnce({ ok: false })
    expect(await guiLaiSuaCho('t')).toBe(1)
    expect(api.apiGonNop.mock.calls.map((c) => c[4])).toEqual(['k1', 'k2'])
    expect(coSuaChoGui()).toBe(true) // k2 còn chờ
    api.apiGonNop.mockResolvedValueOnce({ ok: false, ma: 'HET_LUOT' })
    expect(await guiLaiSuaCho('t')).toBe(0)
    expect(coSuaChoGui()).toBe(false)
  })
})
