// @vitest-environment node
// OMNI 3 · CHƯƠNG TRÌNH "CẨN THẬN" — đường TRẢ LỜI (`answer`) và lệnh ghi `hoa2-omni-buoc-sai` trên D1 thật (node:sqlite, đủ migration). LÀN B, đợt 2 sáng 06/10.
// `canThan` + thẻ "Em biết câu này. Sai vì bước nào?" CHỈ khi OMNI bật ∧ Sơ ý của em (hồ sơ TRƯỚC lượt) > 0,07 (đủ dữ liệu) ∧ — với thẻ — lượt này là CHẮC-MÀ-SAI.
// Lớp D1 OMNI (omni-d1.ts) tiêm bằng vi.mock như tests/omni-3-tra-loi.test.ts (hồ sơ, Q, tên vi kỹ năng tất định).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { taoD1That } from './_d1-that'
import { gameV2 } from '../server/src/game-v2'
import { gameToken } from '../server/src/game-v2-auth'
import { xoaDemCaBaoVe } from '../server/src/game-v2-bank'
import { CAC_KHUNG_GIO, type HoSoOmniEm, type QCau, type Vkn } from '../server/src/omni-kieu'
import { CHU_CHAC_MA_SAI } from '../src/lib/omni-chu'
import type { Env } from '../server/src/kieu'

const tiem = vi.hoisted(() => ({
  bat: false,
  p: {} as Record<string, number>,
  sEm: 0.08,
  nVung: 0,
  q: new Map<string, { vkn: string[]; vknY?: string[][]; phan?: 'I' | 'II' | 'III' }>(),
  vkn: new Map<string, { ten: string }>(),
  goiTen: 0,
}))
vi.mock('../server/src/omni-d1', async (goc) => {
  const that = await goc<typeof import('../server/src/omni-d1')>()
  return {
    ...that,
    omniBat: vi.fn(async () => tiem.bat),
    kyVongMsCau: vi.fn(async () => 90_000),
    soLuotHomNay: vi.fn(async () => 0),
    hoSoOmniEm: vi.fn(async (_env: Env, sbd: string) => hoSo(sbd)),
    qCuaCau: vi.fn(async (_env: Env, qids: readonly string[]) => new Map(qids.map((q) => {
      const c = tiem.q.get(q)
      return [q, { qid: q, phan: c?.phan ?? 'I', maDang: 'D1', mucDo: null, vkn: c?.vkn ?? [`cau:${q}`], ...(c?.vknY ? { vknY: c.vknY } : {}), nguon: 'thay' } as QCau]
    }))),
    vknTheoId: vi.fn(async (_env: Env, ids: readonly string[]) => { tiem.goiTen++; return new Map(ids.map((id, i) => [id, { id, maDang: 'D1', ten: tiem.vkn.get(id)?.ten ?? id, tenLoi: null, nhanNen: null, thuTu: i } as Vkn])) }),
  }
})
function hoSo(sbd: string): HoSoOmniEm {
  const vkn = Object.fromEntries(Object.entries(tiem.p).map(([k, p]) => [k, { vkn: k, p, nTuLam: 4, nCau: 3, nNgay: 2, nTroiChay: 0, nCauLaDung: 0, diemSprt: 0, trangThai: 'chua_du' as const, ngayCuoi: '2026-10-01', dayLai: false }]))
  return { sbd, vkn, sEm: tiem.sEm, nVung: tiem.nVung, nSaiVung: 0, tau: 0, nTau: 0, khungGio: Object.fromEntries(CAC_KHUNG_GIO.map((k) => [k, { n: 0, soY: 0 }])) as HoSoOmniEm['khungGio'], luotHomNay: 0, cursor: '', phienBan: 'test' }
}

const T0 = Date.parse('2026-10-06T09:00:00+07:00')
let bayGio = T0
const toi = (ms = 60_000) => { bayGio += ms; vi.setSystemTime(bayGio) }
beforeEach(() => {
  bayGio = T0; vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(T0); xoaDemCaBaoVe()
  Object.assign(tiem, { bat: false, p: {}, sEm: 0.08, nVung: 0, goiTen: 0 })
  tiem.q.clear(); tiem.vkn.clear()
})
afterEach(() => { vi.useRealTimers(); xoaDemCaBaoVe() })

type Phan = 'I' | 'II' | 'III'
const CAU: { qid: string; phan: Phan; correct: string }[] = [
  ...[1, 2, 3, 4].map((i) => ({ qid: `Q${i}`, phan: 'I' as Phan, correct: 'B' })),
  { qid: 'Q5', phan: 'III', correct: '12' },
]
const cauJson = (c: (typeof CAU)[number]) => JSON.stringify({
  qid: c.qid, maDe: 'DH-B1', lop: '12', version: 'v1', group: `g-${c.qid}`, phan: c.phan, text: `Câu ${c.qid}`, choices: c.phan === 'I' ? ['a', 'b', 'c', 'd'] : [],
  ideas: [], hinhAnh: [], dang: 'D1', tenDang: 'Dạng D1', mucDo: 'TH', sao: 1, kienThuc: ['k'], correct: c.correct, reviewed: true, solution: { chot: `Cốt lõi ${c.qid}` },
})
async function dung() {
  const d = taoD1That()
  const env = d.env as unknown as Env
  d.sql.exec("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES('S1','Nguyễn An','12A1','mk1','x')")
  d.sql.exec(`INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('game_hoa_2','{"bat":true,"lop":["12A1"]}','x')`)
  d.sql.exec(`INSERT INTO de_kho(ma_de,ten_de,so_cau,da_xoa,cap_nhat_luc) VALUES('DH-B1','Bài 1',${CAU.length},0,'v1')`)
  d.sql.exec("INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('DH-B1','v1','x')")
  const st = d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)')
  for (const c of CAU) st.run('DH-B1', c.qid, 'v1', `g-${c.qid}`, 'D1', cauJson(c))
  const token = await gameToken(env, 'S1')
  return { d, env, token }
}
function moPhien(d: Awaited<ReturnType<typeof dung>>['d'], id: string, qids: string[]) {
  d.sql.prepare('INSERT INTO game_v2_session(id,sbd,json,created_at) VALUES(?,?,?,?)').run(id, 'S1', JSON.stringify({
    mode: 'adventure', created: Date.now(), hoa2: 1,
    questions: qids.map((q) => ({ qid: q, maDe: 'DH-B1', version: 'v1', group: `g-${q}`, novel: true, role: 'moi' })),
  }), new Date().toISOString())
}
type KQ = Record<string, any>
const traLoi = (env: Env, token: string, session: string, qid: string, answer: string, them: Record<string, unknown> = {}) =>
  gameV2(env, 'answer', { token, session, qid, answer, ...them }) as Promise<KQ>

/** Em đã vững hai bước của Q1 (P ≥ 0,9) và có Sơ ý cao, đủ dữ liệu. */
function emSoYCao() {
  tiem.bat = true
  tiem.p = { 'dang:D1': 0.95, 'nen:mol': 0.92, 'nen:pt': 0.91 }
  tiem.sEm = 0.12
  tiem.nVung = 30
  tiem.q.set('Q1', { vkn: ['dang:D1', 'nen:mol', 'nen:pt'] })
  tiem.q.set('Q2', { vkn: ['dang:D1', 'nen:mol'] })
  tiem.q.set('Q5', { vkn: ['nen:pt', 'nen:mol'], phan: 'III' })
  tiem.vkn.set('dang:D1', { ten: 'Thuỷ phân ester' })
  tiem.vkn.set('nen:mol', { ten: 'Tính số mol' })
  tiem.vkn.set('nen:pt', { ten: 'Lập phương trình phản ứng' })
}

describe('answer — canThan + thẻ "Sai vì bước nào?"', () => {
  it('Sơ ý ≤ ngưỡng / chưa đủ dữ liệu ⇒ KHÔNG có canThan, KHÔNG có buocSai (dù chắc-mà-sai vẫn mở lời giải như hôm nay)', async () => {
    const { d, env, token } = await dung()
    emSoYCao()
    tiem.sEm = 0.05 // Sơ ý thấp
    moPhien(d, 'P1', ['Q1', 'Q2'])
    toi()
    const thap = await traLoi(env, token, 'P1', 'Q1', 'A', { msLam: 40_000 })
    expect(thap.omni).toMatchObject({ chacMaSai: true, loiNhan: CHU_CHAC_MA_SAI })
    expect('canThan' in thap.omni).toBe(false)
    expect('buocSai' in thap.omni).toBe(false)
    tiem.sEm = 0.3; tiem.nVung = 9 // chưa đủ dữ liệu (< 10 lượt vững)
    toi()
    const it = await traLoi(env, token, 'P1', 'Q2', 'A', { msLam: 40_000 })
    expect(it.omni.chacMaSai).toBe(true)
    expect('canThan' in it.omni).toBe(false)
    expect('buocSai' in it.omni).toBe(false)
    expect(tiem.goiTen).toBe(0) // không tra tên bước khi không canThan
  })

  it('OMNI tắt ⇒ không có `omni` nào (dù hồ sơ có Sơ ý cao)', async () => {
    const { d, env, token } = await dung()
    emSoYCao()
    tiem.bat = false
    moPhien(d, 'P1', ['Q1'])
    toi()
    const r = await traLoi(env, token, 'P1', 'Q1', 'A', { msLam: 40_000 })
    expect(r.omni).toBeUndefined()
    expect(tiem.goiTen).toBe(0)
  })

  it('canThan ∧ chắc-mà-sai ⇒ `canThan: true` + `buocSai.lua` = các bước của câu (tính toán trước, dạng sau; tên không mã nội bộ; ≤ 3); tra tên ĐÚNG MỘT lần', async () => {
    const { d, env, token } = await dung()
    emSoYCao()
    moPhien(d, 'P1', ['Q1'])
    toi()
    const r = await traLoi(env, token, 'P1', 'Q1', 'A', { msLam: 40_000 })
    expect(r.correct).toBe(false)
    expect(r.omni).toMatchObject({ chacMaSai: true, luot: false, loiNhan: CHU_CHAC_MA_SAI, canThan: true })
    expect(r.omni.buocSai).toEqual({ lua: [
      { ma: 'nen:mol', ten: 'Tính số mol' }, { ma: 'nen:pt', ten: 'Lập phương trình phản ứng' }, { ma: 'dang:D1', ten: 'Thuỷ phân ester' },
    ] })
    expect(tiem.goiTen).toBe(1)
    // đáp án đúng KHÔNG xuống máy em trong phần thẻ: chỉ mã + tên bước
    expect(JSON.stringify(r.omni.buocSai)).not.toMatch(/Cốt lõi|"B"/)
  })

  it('canThan nhưng KHÔNG chắc-mà-sai (đúng / chọn "Chưa chắc" / bước chưa vững) ⇒ chỉ `canThan: true`, không thẻ, không tra tên', async () => {
    const { d, env, token } = await dung()
    emSoYCao()
    moPhien(d, 'P1', ['Q1', 'Q2', 'Q3', 'Q5'])
    toi()
    const dung1 = await traLoi(env, token, 'P1', 'Q1', 'B', { msLam: 40_000 })
    expect(dung1.correct).toBe(true)
    expect(dung1.omni.canThan).toBe(true)
    expect('buocSai' in dung1.omni).toBe(false)
    toi()
    const chuaChac = await traLoi(env, token, 'P1', 'Q2', 'A', { msLam: 40_000, tuTin: 'chua_chac' })
    expect(chuaChac.omni).toMatchObject({ chacMaSai: false, canThan: true })
    expect('buocSai' in chuaChac.omni).toBe(false)
    tiem.p = { ...tiem.p, 'nen:mol': 0.5 } // một bước chưa vững ⇒ câu không "vững" ⇒ sai không phải chắc-mà-sai
    toi()
    const chuaVung = await traLoi(env, token, 'P1', 'Q3', 'A', { msLam: 40_000 })
    expect(chuaVung.omni).toMatchObject({ chacMaSai: false, canThan: true })
    expect('buocSai' in chuaVung.omni).toBe(false)
    expect(tiem.goiTen).toBe(0)
  })

  it('câu Phần III (điền số): chắc-mà-sai ⇒ cũng có thẻ (bước của câu)', async () => {
    const { d, env, token } = await dung()
    emSoYCao()
    moPhien(d, 'P1', ['Q5'])
    toi()
    const r = await traLoi(env, token, 'P1', 'Q5', '13', { msLam: 60_000 })
    expect(r.correct).toBe(false)
    expect(r.omni.buocSai.lua.map((x: { ma: string }) => x.ma)).toEqual(['nen:pt', 'nen:mol'])
  })

  it('lỗi tra tên bước ⇒ lượt vẫn chấm, vẫn `canThan: true`, không thẻ', async () => {
    const { d, env, token } = await dung()
    emSoYCao()
    const omni = await import('../server/src/omni-d1')
    vi.mocked(omni.vknTheoId).mockRejectedValueOnce(new Error('D1 lỗi'))
    moPhien(d, 'P1', ['Q1'])
    toi()
    const r = await traLoi(env, token, 'P1', 'Q1', 'A', { msLam: 40_000 })
    expect(r.ok).toBe(true)
    expect(r.correct).toBe(false)
    expect(r.omni).toMatchObject({ chacMaSai: true, canThan: true })
    expect('buocSai' in r.omni).toBe(false)
  })
})

describe('hoa2-omni-buoc-sai — em bấm một bước ⇒ ghi sổ riêng omni_buoc_sai, không chấm', () => {
  const dem = (d: Awaited<ReturnType<typeof dung>>['d']) => Number((d.sql.prepare('SELECT COUNT(*) AS n FROM omni_buoc_sai').get() as { n: number }).n)
  it('OMNI bật: ghi MỘT dòng (câu gốc, ngày VN, mã bước); sổ học không đổi; gọi lại giữ lựa chọn đầu', async () => {
    const { d, env, token } = await dung()
    await gameV2(env, 'choose', { token, pet: 'dat_quy' })
    emSoYCao()
    moPhien(d, 'P1', ['Q1'])
    toi()
    await traLoi(env, token, 'P1', 'Q1', 'A', { msLam: 40_000 })
    const soHoc = () => JSON.stringify(d.sql.prepare('SELECT khoa, ket_qua, raw_json FROM su_kien_hoc ORDER BY khoa').all())
    const truoc = soHoc()
    const r = await gameV2(env, 'hoa2-omni-buoc-sai', { token, qid: 'Q1', ma: 'nen:mol' }) as KQ
    expect(r).toMatchObject({ ok: true, daGhi: true })
    expect(d.sql.prepare('SELECT sbd, qid, ngay, ma_vkn FROM omni_buoc_sai').all()).toEqual([{ sbd: 'S1', qid: 'Q1', ngay: '2026-10-06', ma_vkn: 'nen:mol' }])
    expect(soHoc()).toBe(truoc) // KHÔNG chấm, KHÔNG ghi sổ học
    const lai = await gameV2(env, 'hoa2-omni-buoc-sai', { token, qid: 'Q1', ma: 'chua_ro' }) as KQ
    expect(lai).toMatchObject({ ok: true, daGhi: false })
    expect(dem(d)).toBe(1)
    expect((d.sql.prepare('SELECT ma_vkn FROM omni_buoc_sai').get() as { ma_vkn: string }).ma_vkn).toBe('nen:mol')
  })
  it('OMNI tắt ⇒ { ok:false, error }, không tạo bảng, không ghi gì', async () => {
    const { d, env, token } = await dung()
    await gameV2(env, 'choose', { token, pet: 'dat_quy' })
    tiem.bat = false
    const r = await gameV2(env, 'hoa2-omni-buoc-sai', { token, qid: 'Q1', ma: 'nen:mol' }) as KQ
    expect(r.ok).toBe(false)
    expect(typeof r.error).toBe('string')
    expect(d.sql.prepare("SELECT COUNT(*) AS n FROM sqlite_master WHERE name = 'omni_buoc_sai'").get()).toEqual({ n: 0 })
  })
})
