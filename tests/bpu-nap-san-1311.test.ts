// @vitest-environment node
// NẠP SẴN CÂU — CHUYỂN ĐỀ TỨC THÌ (thầy 13/11: «tốc độ chuyển đề trên máy học sinh bị chậm quá, làm cho tức thì đi nhé»). server/src/bpu-nap-san.ts.
// Khoá: tờ mở ⇒ phòng đọc D1 MỘT lần cho cả bài; sang câu ⇒ phòng mở lượt từ bộ nhớ với 0 lệnh D1; cổng an toàn: ảnh chụp quá 60 giây / có ca thi đang mở /
// câu bị giữ cho ca kiểm tra ⇒ KHÔNG đi đường nhanh (Worker đi đường cũ, kiểm đầy đủ); đáp án không ra máy em trước khi mở; phòng ngủ dậy vẫn còn câu đã nạp.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { taoD1That } from './_d1-that'
import { chu, datWebSocketPairGia, taoPhongGia } from './_live-phong-gia'
import { NAP_LAM_MOI_MS, NAP_TOI_DA, NAP_TUOI_MS, duocNhanh, locMaCau, type AnToanNap, type CauNap } from '../server/src/bpu-nap-san'
import { gvBpuLuot, gvBpuNap } from '../server/src/phong-binh-phan-ung'
import type { Env } from '../server/src/kieu'

const cauJson = (qid: string, text: string, correct: string, tuLuan = false) => JSON.stringify({
  qid, maDe: 'DE1', version: 'v1', group: 'g', phan: tuLuan ? 'III' : 'I', text, choices: tuLuan ? [] : ['a', 'b', 'c', 'd'], correct, ideas: [], hinhAnh: [],
  solution: 'Lời giải bí mật', dang: null, tenDang: 'Dạng', mucDo: 'hieu', sao: 1, kienThuc: [], ...(tuLuan ? { tuLuan: true, loai: 'tu_luan' } : {}),
})
function moiD1() {
  const d = taoD1That()
  d.sql.prepare("INSERT INTO de_kho(ma_de,ten_de,so_cau,da_xoa,cap_nhat_luc) VALUES('DE1','Tờ 1',3,0,'v1')").run()
  d.sql.prepare("INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('DE1','v1','x')").run()
  for (const [qid, text, dung] of [['Q1', 'Câu một: chất nào là amine bậc hai?', 'B'], ['Q2', 'Câu hai: phenol tác dụng với chất nào?', 'C']] as const)
    d.sql.prepare("INSERT INTO game_v2_question(ma_de,qid,version,content_group,json) VALUES('DE1',?,'v1',?,?)").run(qid, `nhom-${qid}`, cauJson(qid, text, dung))
  // ghi lại mọi lệnh D1 (prepare)
  let ds: string[] = []
  const goc = d.env.DB.prepare.bind(d.env.DB)
  const DB = new Proxy(d.env.DB, { get: (t, k) => (k === 'prepare' ? (sql: string) => { ds.push(sql); return goc(sql) } : (t as unknown as Record<string | symbol, unknown>)[k]) })
  return { d, DB, demD1: () => ds.length, lenh: () => ds, datLai: () => { ds = [] } }
}
function moCa(d: ReturnType<typeof taoD1That>, lop = '11A1') {
  const cot = d.sql.prepare("SELECT name, type, \"notnull\" AS nn, dflt_value AS md FROM pragma_table_info('ca')").all() as { name: string; type: string; nn: number; md: unknown }[]
  const can: Record<string, string | number> = { ma_ca: 'CA9', lop, trang_thai: 'mo', loai: 'thi' }
  const ds = cot.filter((c) => c.name in can || (c.nn && c.md == null))
  d.sql.prepare(`INSERT INTO ca (${ds.map((c) => c.name).join(', ')}) VALUES (${ds.map(() => '?').join(', ')})`).run(...ds.map((c) => can[c.name] ?? (/INT|REAL|NUM/i.test(c.type) ? 0 : '')))
}
datWebSocketPairGia()
afterEach(() => { vi.useRealTimers() })

describe('luật thuần', () => {
  it('locMaCau: bỏ rỗng, bỏ trùng, giữ thứ tự, tối đa NAP_TOI_DA', () => {
    expect(locMaCau(['Q1', '', 'Q2', 'Q1', 3, null])).toEqual(['Q1', 'Q2', '3'])
    expect(locMaCau(Array.from({ length: 200 }, (_, i) => `Q${i}`))).toHaveLength(NAP_TOI_DA)
    expect(locMaCau('Q1')).toEqual([])
  })
  it('duocNhanh: chưa nạp / ảnh chụp quá 60 giây / có ca thi mở / không đọc được phạm vi bảo vệ / câu bị giữ ⇒ không đi đường nhanh', () => {
    const an: AnToanNap = { coCaMo: false, kiemDuocBaoVe: true, luc: 1000 }, c = { qid: 'Q1', baoVe: false } as CauNap
    expect(duocNhanh(an, c, 1000 + NAP_TUOI_MS)).toBe('')
    expect(duocNhanh(null, c, 1000)).toBe('chua-nap')
    expect(duocNhanh(an, undefined, 1000)).toBe('chua-nap')
    expect(duocNhanh(an, c, 1001 + NAP_TUOI_MS)).toBe('cu')
    expect(duocNhanh({ ...an, coCaMo: true }, c, 1000)).toBe('ca-mo')
    expect(duocNhanh({ ...an, kiemDuocBaoVe: false }, c, 1000)).toBe('bao-ve')
    expect(duocNhanh(an, { ...c, baoVe: true }, 1000)).toBe('bao-ve')
  })
})

describe('phòng thật trên D1 thật', () => {
  it('nạp một lần cho cả bài; sang câu đường nhanh: 0 lệnh D1, máy em có đề ngay, KHÔNG có đáp án / lời giải trước khi mở', async () => {
    const m = moiD1(), ph = taoPhongGia(null, { DB: m.DB })
    await ph.khoi([{ sbd: 'S1' }, { sbd: 'S2' }])
    const em = await ph.noi('hs', 'S1')
    const n = await ph.post('/nap', { qids: ['Q1', 'Q2', 'QX'] })
    expect(n).toMatchObject({ ok: true, so: 2, coCaMo: false })
    m.datLai()
    const r = await ph.post('/luot-nhanh', { qid: 'Q2', hanGiay: 0 })
    expect(r).toMatchObject({ ok: true, nhanh: true, tuLuan: false })
    expect(m.demD1()).toBe(0)
    const ve = chu(em).filter((x) => x.t === 'em').at(-1) as Record<string, any>
    expect(ve.luot?.qid).toBeUndefined() // máy em không nhận mã câu trước khi mở đáp án (luật cũ của viewEm)
    expect(JSON.stringify(ve.luot?.cau)).toContain('phenol')
    const tho = JSON.stringify(ve)
    expect(tho).not.toContain('Lời giải bí mật')
    expect(ve.luot?.dung).toBeUndefined()
    // câu không có trong kho ⇒ phòng từ chối, Worker sẽ đi đường cũ (báo đúng lý do «không có trong kho»)
    expect(await ph.post('/luot-nhanh', { qid: 'QX', hanGiay: 0 })).toMatchObject({ ok: false, nhanh: false, vi: 'chua-nap' })
  })
  it('ảnh chụp quá 60 giây ⇒ từ chối và làm mới ngầm; làm mới xong lại đi nhanh. Tin trong phòng (nhịp giữ kết nối) làm mới tối đa 20 giây một lần', async () => {
    vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(1_000_000)
    const m = moiD1(), ph = taoPhongGia(null, { DB: m.DB })
    await ph.khoi([{ sbd: 'S1' }])
    const gv = await ph.noi('gv')
    await ph.post('/nap', { qids: ['Q1', 'Q2'] })
    vi.setSystemTime(1_000_000 + NAP_TUOI_MS + 1)
    expect(await ph.post('/luot-nhanh', { qid: 'Q1', hanGiay: 0 })).toMatchObject({ nhanh: false, vi: 'cu' })
    await ph.choNen()
    expect(await ph.post('/luot-nhanh', { qid: 'Q1', hanGiay: 0 })).toMatchObject({ ok: true, nhanh: true })
    // tin trong phòng trước 20 giây ⇒ không đọc D1; sau 20 giây ⇒ làm mới ngầm
    m.datLai()
    await ph.gui(gv, { t: 'ping' }); await ph.choNen()
    expect(m.demD1()).toBe(0)
    vi.setSystemTime(Date.now() + NAP_LAM_MOI_MS)
    await ph.gui(gv, { t: 'ping' }); await ph.choNen()
    expect(m.demD1()).toBeGreaterThan(0)
  })
  it('CỔNG CA THI: có ca thi mở (ở bất kỳ lớp nào) ⇒ lần làm mới kế tiếp chặn đường nhanh; Worker đi đường cũ', async () => {
    vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(2_000_000)
    const m = moiD1(), ph = taoPhongGia(null, { DB: m.DB })
    await ph.khoi([{ sbd: 'S1' }])
    const gv = await ph.noi('gv')
    await ph.post('/nap', { qids: ['Q1', 'Q2'] })
    moCa(m.d)
    vi.setSystemTime(Date.now() + NAP_LAM_MOI_MS)
    await ph.gui(gv, { t: 'ping' }); await ph.choNen()
    expect(await ph.post('/luot-nhanh', { qid: 'Q1', hanGiay: 0 })).toMatchObject({ ok: false, nhanh: false, vi: 'ca-mo' })
    // nạp lại khi đang có ca mở ⇒ ảnh chụp mang cờ ca mở ngay
    expect(await ph.post('/nap', { qids: ['Q1'] })).toMatchObject({ ok: true, coCaMo: true })
    expect(await ph.post('/luot-nhanh', { qid: 'Q1', hanGiay: 0 })).toMatchObject({ nhanh: false, vi: 'ca-mo' })
  })
  it('THẦY SỬA ĐÁP ÁN SAU KHI NẠP (tờ đổi phiên bản) ⇒ lần làm mới kế tiếp đọc lại câu; sang câu mở lượt bằng ĐÁP ÁN MỚI', async () => {
    vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(3_000_000)
    const m = moiD1(), ph = taoPhongGia(null, { DB: m.DB })
    await ph.khoi([{ sbd: 'S1' }])
    const gv = await ph.noi('gv')
    await ph.post('/nap', { qids: ['Q1', 'Q2'] })
    // sửa đáp án Q1 B ⇒ D như sua-dap-an-kho.ts: ghi gói mới, đặt cap_nhat_luc mới, dựng lại chỉ mục tờ
    m.d.sql.prepare("UPDATE game_v2_question SET json = ?, version = 'v2' WHERE qid = 'Q1'").run(cauJson('Q1', 'Câu một: chất nào là amine bậc hai?', 'D'))
    m.d.sql.prepare("UPDATE game_v2_question SET version = 'v2' WHERE qid = 'Q2'").run()
    m.d.sql.prepare("UPDATE de_kho SET cap_nhat_luc = 'v2' WHERE ma_de = 'DE1'").run()
    m.d.sql.prepare("UPDATE game_v2_index SET source_version = 'v2' WHERE ma_de = 'DE1'").run()
    vi.setSystemTime(Date.now() + NAP_LAM_MOI_MS)
    await ph.gui(gv, { t: 'ping' }); await ph.choNen()
    expect(await ph.post('/luot-nhanh', { qid: 'Q1', hanGiay: 0 })).toMatchObject({ ok: true, nhanh: true })
    expect((ph.kho.du.get('st') as { luot?: { dung?: string } }).luot?.dung).toBe('D')
  })
  it('tờ riêng mở sau tờ của bảng ⇒ GỘP: câu của cả hai tờ đều đi nhanh', async () => {
    const m = moiD1(), ph = taoPhongGia(null, { DB: m.DB })
    await ph.khoi([{ sbd: 'S1' }])
    await ph.post('/nap', { qids: ['Q1'] })
    expect(await ph.post('/nap', { qids: ['Q2'] })).toMatchObject({ ok: true, so: 2 })
    expect(await ph.post('/luot-nhanh', { qid: 'Q1', hanGiay: 0 })).toMatchObject({ nhanh: true })
    expect(await ph.post('/luot-nhanh', { qid: 'Q2', hanGiay: 0 })).toMatchObject({ nhanh: true })
  })
  it('phòng ngủ rồi thức lại (đối tượng mới, cùng kho) ⇒ câu đã nạp vẫn còn, sang câu vẫn đi nhanh', async () => {
    const m = moiD1(), ph = taoPhongGia(null, { DB: m.DB })
    await ph.khoi([{ sbd: 'S1' }])
    await ph.post('/nap', { qids: ['Q1', 'Q2'] })
    const ph2 = taoPhongGia({ kho: ph.kho, dsWs: ph.dsWs }, { DB: m.DB })
    m.datLai()
    expect(await ph2.post('/luot-nhanh', { qid: 'Q1', hanGiay: 0 })).toMatchObject({ ok: true, nhanh: true })
    expect(m.demD1()).toBe(0)
    // nạp tờ khác ⇒ GỘP, câu đã bị gỡ khỏi kho (không còn phục vụ được) thì rời bộ nạp
    m.d.sql.prepare("DELETE FROM game_v2_question WHERE qid = 'Q1'").run()
    await ph2.post('/nap', { qids: ['Q2'] })
    expect([...ph.kho.du.keys()].filter((k) => k.startsWith('nap:q:'))).toEqual(['nap:q:Q2'])
  })
})

describe('Worker: /gv/bpu/luot hỏi phòng đường nhanh trước', () => {
  const env = (phong: (duong: string) => Record<string, unknown>, DB?: unknown) => {
    const goi: string[] = []
    const e = { MA_BI_MAT: 'x', ...(DB ? { DB } : {}), PHONG_BPU: { idFromName: (t: string) => ({ toString: () => t }), get: () => ({ fetch: async (r: Request) => { const d = new URL(r.url).pathname; goi.push(d); return new Response(JSON.stringify(phong(d))) } }) } } as unknown as Env
    return { e, goi }
  }
  it('phòng mở được ngay ⇒ trả về, không đọc D1 trước khi trả lời (báo kênh đẩy chạy nền)', async () => {
    const m = moiD1(), nen: Promise<unknown>[] = []
    const { e, goi } = env((d) => (d === '/luot-nhanh' ? { ok: true, nhanh: true, so: 3, tuLuan: false, coMat: ['S1'] } : { ok: false }), m.DB)
    m.datLai()
    const r = await gvBpuLuot(e, { buoiId: 'b1', qid: 'Q1', hanGiay: 0 }, { waitUntil: (p: Promise<unknown>) => { nen.push(p) } } as never)
    expect(r).toMatchObject({ ok: true, so: 3, nhanh: true })
    expect(goi).toEqual(['/luot-nhanh'])
    // lệnh D1 duy nhất là lọc em đang làm bài cho kênh đẩy — chạy NỀN (waitUntil), không có lệnh câu / ca / lớp nào
    expect(m.lenh().every((q) => /trang_thai = 'dang_lam'/.test(q))).toBe(true)
    expect(nen).toHaveLength(1)
    await Promise.all(nen)
  })
  it('phòng từ chối ⇒ đi đường cũ đủ bước (đọc D1, gửi `/luot`)', async () => {
    const m = moiD1()
    m.d.sql.exec("CREATE TABLE IF NOT EXISTS buoi_hoc (id TEXT PRIMARY KEY, ten TEXT, lop TEXT, bi_mat TEXT, mo_luc TEXT, het_han TEXT, dong_luc TEXT, cap_nhat_luc TEXT)")
    const { e, goi } = env((d) => (d === '/luot-nhanh' ? { ok: false, nhanh: false, vi: 'chua-nap' } : { ok: true, so: 1, coMat: [] }), m.DB)
    const r = await gvBpuLuot(e, { buoiId: 'b1', qid: 'Q1', hanGiay: 0 })
    expect(goi).toEqual(['/luot-nhanh', '/luot'])
    expect(m.demD1()).toBeGreaterThan(0)
    expect(r.nhanh).toBeUndefined()
  })
  it('/gv/bpu/nap: chuyển danh sách mã câu (đã lọc) vào phòng', async () => {
    let than: unknown = null
    const e = { MA_BI_MAT: 'x', PHONG_BPU: { idFromName: (t: string) => ({ toString: () => t }), get: () => ({ fetch: async (r: Request) => { than = await r.json(); return new Response('{"ok":true,"so":2}') } }) } } as unknown as Env
    expect(await gvBpuNap(e, { buoiId: 'b1', qids: ['Q1', 'Q1', '', 'Q2'] })).toMatchObject({ ok: true, so: 2 })
    expect(than).toEqual({ qids: ['Q1', 'Q2'] })
    expect(await gvBpuNap(e, { buoiId: 'b1', qids: [] })).toMatchObject({ ok: false })
  })
})
