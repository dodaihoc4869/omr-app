// @vitest-environment node
// OMNI 3 · LÀN B3 — ĐƯỜNG TRẢ LỜI (`answer`) trên D1 thật (node:sqlite, đủ migration): cờ tắt y hệt hôm nay; lướt; chắc-mà-sai; P dạng; Phần II từng ý;
// Trạm hồi phục (đúng 3 sai liền, một lần/chuyến, không Đoàn) + `hoa2-omni-tram-xong`; lệnh hoa2-omni-* khi cờ tắt; Đoàn chuyển msLam/tuTin.
// Lớp D1 OMNI (omni-d1.ts) là STUB của làn khác ⇒ TIÊM bằng vi.mock (test không phụ thuộc con số stub).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { taoD1That } from './_d1-that'
import { gameV2 } from '../server/src/game-v2'
import { gameToken } from '../server/src/game-v2-auth'
import { xoaDemCaBaoVe } from '../server/src/game-v2-bank'
import { gvChienDich } from '../server/src/srs2-gv'
import { danhDau } from '../server/src/game-v2-doan'
import { capNhatHoi } from '../server/src/omni-p-vkn'
import { chonViKyNangTram, chuoiSaiLienCuoi, docMsLam, ketQuaTungY, tuanVnCua } from '../server/src/omni-game'
import { CAC_KHUNG_GIO, THAM_SO_OMNI, type HoSoOmniEm, type QCau, type Vkn } from '../server/src/omni-kieu'
import { CHU_CHAC_MA_SAI, CHU_DUNG_CHUA_CHAC, CHU_LUOT, chuDungNhungCham, chuTram } from '../src/lib/omni-chu'
import type { Env } from '../server/src/kieu'

// ---------------------------------------------------------------- tiêm lớp D1 OMNI
const tiem = vi.hoisted(() => ({
  bat: false,
  kyVong: 90_000 as number,
  loiKyVong: false,
  p: {} as Record<string, number>,
  sEm: 0.08,
  q: new Map<string, { vkn: string[]; vknY?: string[][]; phan?: 'I' | 'II' | 'III' }>(),
  vkn: new Map<string, { ten: string; tenLoi?: string | null; nhanNen?: string | null }>(),
  doiThuTu: [] as string[],
}))
vi.mock('../server/src/omni-d1', async (goc) => {
  const that = await goc<typeof import('../server/src/omni-d1')>()
  return {
    ...that,
    omniBat: vi.fn(async () => tiem.bat),
    kyVongMsCau: vi.fn(async () => { if (tiem.loiKyVong) throw new Error('D1 hỏng'); return tiem.kyVong }),
    soLuotHomNay: vi.fn(async (env: Env, sbd: string, nowMs: number) => {
      const ngay = new Date(nowMs + 7 * 3_600_000).toISOString().slice(0, 10)
      const r = await env.DB.prepare("SELECT COUNT(*) AS n FROM su_kien_hoc WHERE sbd = ? AND ngay_vn = ? AND purpose = 'luot'").bind(sbd, ngay).first<{ n: number }>()
      return Number(r?.n) || 0
    }),
    hoSoOmniEm: vi.fn(async (_env: Env, sbd: string) => hoSo(sbd)),
    qCuaCau: vi.fn(async (_env: Env, qids: readonly string[]) => new Map(qids.map((q) => {
      const c = tiem.q.get(q)
      return [q, { qid: q, phan: c?.phan ?? 'I', maDang: 'D1', mucDo: null, vkn: c?.vkn ?? [`cau:${q}`], ...(c?.vknY ? { vknY: c.vknY } : {}), nguon: 'thay' } as QCau]
    }))),
    vknTheoId: vi.fn(async (_env: Env, ids: readonly string[]) => new Map(ids.map((id, i) => {
      const v = tiem.vkn.get(id)
      return [id, { id, maDang: 'D1', ten: v?.ten ?? id, tenLoi: v?.tenLoi ?? null, nhanNen: v?.nhanNen ?? null, thuTu: i } as Vkn]
    }))),
    nhatKyHomNay: vi.fn(async () => ['Hôm nay em đúng 3 câu Este.', 'Bước tính số mol tiến thêm.']),
  }
})
vi.mock('../server/src/srs2-d1', async (goc) => {
  const that = await goc<typeof import('../server/src/srs2-d1')>()
  return { ...that, doiThuTuMetGio: vi.fn(async (_e: Env, _s: string, _n: number, quyet: string) => { tiem.doiThuTu.push(quyet); return { ok: true, theLuc: { con: 3, tong: 10 }, dao: { con: 3 }, doan: { con: 0 } } }) }
})

function hoSo(sbd: string): HoSoOmniEm {
  const vkn = Object.fromEntries(Object.entries(tiem.p).map(([k, p]) => [k, { vkn: k, p, nTuLam: 4, nCau: 3, nNgay: 2, nTroiChay: 0, nCauLaDung: 0, diemSprt: 0, trangThai: 'chua_du' as const, ngayCuoi: '2026-10-01', dayLai: false }]))
  return { sbd, vkn, sEm: tiem.sEm, nVung: 0, nSaiVung: 0, tau: 0, nTau: 0, khungGio: Object.fromEntries(CAC_KHUNG_GIO.map((k) => [k, { n: 0, soY: 0 }])) as HoSoOmniEm['khungGio'], luotHomNay: 0, cursor: '', phienBan: 'test' }
}

// ---------------------------------------------------------------- dựng D1
const T0 = Date.parse('2026-10-05T09:00:00+07:00')
let bayGio = T0
const toi = (ms = 60_000) => { bayGio += ms; vi.setSystemTime(bayGio) }
beforeEach(() => {
  bayGio = T0; vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(T0); xoaDemCaBaoVe()
  Object.assign(tiem, { bat: false, kyVong: 90_000, loiKyVong: false, p: {}, sEm: 0.08, doiThuTu: [] })
  tiem.q.clear(); tiem.vkn.clear()
})
afterEach(() => { vi.useRealTimers(); xoaDemCaBaoVe() })

type Phan = 'I' | 'II' | 'III'
const CAU: { qid: string; phan: Phan; dang: string; mucDo: string; correct: string }[] = [
  ...[1, 2, 3, 4, 5, 6].map((i) => ({ qid: `Q${i}`, phan: 'I' as Phan, dang: 'D1', mucDo: 'TH', correct: 'B' })),
  { qid: 'Q7', phan: 'I', dang: 'D1', mucDo: 'NB', correct: 'C' },
  { qid: 'Q8', phan: 'II', dang: 'D1', mucDo: 'TH', correct: 'DSDS' },
  { qid: 'Q9', phan: 'I', dang: 'D2', mucDo: 'NB', correct: 'B' },
]
function cauJson(c: (typeof CAU)[number]) {
  return JSON.stringify({
    qid: c.qid, maDe: 'DH-B1', version: 'v1', group: `g-${c.qid}`, phan: c.phan, text: `Câu ${c.qid}`, choices: c.phan === 'I' ? ['a', 'b', 'c', 'd'] : [],
    ideas: c.phan === 'II' ? ['a', 'b', 'c', 'd'] : [], hinhAnh: [], dang: c.dang, tenDang: `Dạng ${c.dang}`, mucDo: c.mucDo, sao: 1, kienThuc: ['k'], correct: c.correct,
    reviewed: true, solution: { chot: `Cốt lõi ${c.qid}` },
  })
}
async function dung() {
  const d = taoD1That()
  const env = d.env as unknown as Env
  d.sql.exec("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES('S1','Nguyễn An','12A1','mk1','x')")
  d.sql.exec(`INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('game_hoa_2','{"bat":true,"lop":["12A1"]}','x')`)
  d.sql.exec(`INSERT INTO de_kho(ma_de,ten_de,so_cau,da_xoa,cap_nhat_luc) VALUES('DH-B1','Bài 1',${CAU.length},0,'v1')`)
  d.sql.exec("INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('DH-B1','v1','x')")
  const st = d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)')
  for (const c of CAU) st.run('DH-B1', c.qid, 'v1', `g-${c.qid}`, c.dang, cauJson(c))
  const token = await gameToken(env, 'S1')
  return { d, env, token }
}
function moPhien(d: Awaited<ReturnType<typeof dung>>['d'], id: string, qids: string[], them: Record<string, unknown> = {}) {
  d.sql.prepare('INSERT INTO game_v2_session(id,sbd,json,created_at) VALUES(?,?,?,?)').run(id, 'S1', JSON.stringify({
    mode: 'adventure', created: Date.now(), hoa2: 1, ...them,
    questions: qids.map((q) => ({ qid: q, maDe: 'DH-B1', version: 'v1', group: `g-${q}`, novel: true, role: 'moi' })),
  }), new Date().toISOString())
}
type KQ = Record<string, any>
const traLoi = (env: Env, token: string, session: string, qid: string, answer: string, them: Record<string, unknown> = {}) =>
  gameV2(env, 'answer', { token, session, qid, answer, ...them }) as Promise<KQ>
const dongSo = (d: Awaited<ReturnType<typeof dung>>['d'], qid: string, maNguon: string) =>
  d.sql.prepare('SELECT ket_qua, purpose, raw_json, subitem_json, assistance FROM su_kien_hoc WHERE sbd = ? AND qid = ? AND ma_nguon = ?').get('S1', qid, maNguon) as Record<string, unknown> | undefined
const mastery = (d: Awaited<ReturnType<typeof dung>>['d']) => {
  const r = d.sql.prepare('SELECT json FROM game_v2_profile WHERE sbd = ?').get('S1') as { json: string } | undefined
  return r ? (JSON.parse(String(r.json)) as { mastery: unknown[] }).mastery : [] // chưa có hồ sơ game = chưa có mastery nào
}
const LEGACY = ['ok', 'attempt', 'traLoi', 'correct', 'answer', 'solution', 'solutionImages', 'reward', 'stage', 'lyDoThuong', 'expCau', 'profile', 'revision']

// ---------------------------------------------------------------- hàm thuần
describe('OMNI 3 · B3 — hàm thuần', () => {
  it('msLam: số ≥ 0 làm tròn + kẹp trên 900 000; âm / không phải số ⇒ null', () => {
    expect(docMsLam(1234.6)).toBe(1235)
    expect(docMsLam(5_000_000)).toBe(THAM_SO_OMNI.MS_TOI_DA)
    expect(docMsLam('4200')).toBe(4200)
    for (const v of [-1, 'abc', null, undefined, NaN, Infinity, {}]) expect(docMsLam(v)).toBeNull()
  })
  it('kết quả từng ý Phần II; tuần vé = thứ Hai giờ VN', () => {
    expect(ketQuaTungY('DSSS', 'DSDS')).toEqual([1, 1, 0, 1])
    expect(ketQuaTungY('d-dS', 'DSDS')).toEqual([1, 0, 1, 1])
    expect(tuanVnCua(Date.parse('2026-10-05T00:30:00+07:00'))).toBe('2026-10-05') // thứ Hai
    expect(tuanVnCua(Date.parse('2026-10-11T23:59:00+07:00'))).toBe('2026-10-05') // Chủ nhật cùng tuần
    expect(tuanVnCua(Date.parse('2026-10-04T23:59:00+07:00'))).toBe('2026-09-28') // Chủ nhật tuần trước
  })
  it('chuỗi sai liền cuối: lướt không tính, không cắt; đúng / có hỗ trợ cắt chuỗi', () => {
    const l = (qid: string, dung = false, hoTro = false, luot = false) => ({ qid, dung, hoTro, luot })
    expect(chuoiSaiLienCuoi([l('a'), l('b', false, false, true), l('c'), l('d')])).toEqual(['a', 'c', 'd'])
    expect(chuoiSaiLienCuoi([l('a'), l('b', true), l('c'), l('d')])).toEqual(['c', 'd'])
    expect(chuoiSaiLienCuoi([l('a'), l('b', false, true), l('c')])).toEqual(['c'])
  })
  it('chỗ vướng của trạm: nen:* trong giao (P thấp nhất) > nen:* nhiều nhất > dang:* > mã khác', () => {
    const p: Record<string, number> = { 'nen:mol': 0.4, 'nen:pt': 0.2, 'dang:D1': 0.1, 'nen:x': 0.9 }
    const pc = (k: string) => p[k] ?? 0.3
    expect(chonViKyNangTram([['dang:D1', 'nen:mol', 'nen:pt'], ['dang:D1', 'nen:mol', 'nen:pt'], ['dang:D1', 'nen:pt', 'nen:mol']], pc)).toBe('nen:pt')
    expect(chonViKyNangTram([['dang:D1', 'nen:mol'], ['dang:D1', 'nen:mol', 'nen:x'], ['dang:D1', 'nen:x']], pc)).toBe('nen:mol') // hoà 2–2 ⇒ P thấp hơn
    expect(chonViKyNangTram([['dang:D1'], ['dang:D1'], ['dang:D1']], pc)).toBe('dang:D1')
    expect(chonViKyNangTram([['dang:D1'], ['dang:D2'], ['dang:D2']], pc)).toBe('dang:D2')
    expect(chonViKyNangTram([['D1#1', 'D1#2'], ['D1#2'], ['D1#2', 'D1#3']], pc)).toBe('D1#2')
    expect(chonViKyNangTram([[], [], []], pc)).toBeNull()
  })
})

// ---------------------------------------------------------------- cờ tắt
describe('OMNI 3 · B3 — cờ tắt ⇒ `answer` y hệt hôm nay', () => {
  it('cùng lượt, có / không có msLam + tuTin trong thân ⇒ phản hồi TỪNG BYTE như nhau, dòng sổ như nhau, không trường mới', async () => {
    const chay = async (them: Record<string, unknown>) => {
      bayGio = T0; vi.setSystemTime(T0)
      const { d, env, token } = await dung()
      moPhien(d, 'P1', ['Q1', 'Q8'])
      toi()
      const sai = await traLoi(env, token, 'P1', 'Q1', 'A', them)
      toi()
      const dung2 = await traLoi(env, token, 'P1', 'Q8', 'DSDS', them)
      const so = d.sql.prepare('SELECT khoa, ket_qua, purpose, raw_json, subitem_json, assistance, received_at FROM su_kien_hoc ORDER BY khoa').all()
      return { sai, dung2, so }
    }
    const goc = await chay({})
    const coTruong = await chay({ msLam: 900, tuTin: 'chua_chac' })
    expect(JSON.stringify(coTruong.sai)).toBe(JSON.stringify(goc.sai))
    expect(JSON.stringify(coTruong.dung2)).toBe(JSON.stringify(goc.dung2))
    expect(coTruong.so).toEqual(goc.so)
    for (const r of [goc.sai, goc.dung2]) {
      expect(['omni', 'luot', 've'].filter((k) => k in r)).toEqual([])
      expect(LEGACY.every((k) => k in r)).toBe(true)
    }
    expect(goc.so.map((x: any) => [x.purpose, x.raw_json, x.subitem_json])).toEqual([['maintenance', '{"chon":"A"}', null], ['maintenance', '{"chon":"DSDS"}', null]])
  })
  it('OMNI bật nhưng phiên không phải Hoá 2.0 / là Bi-a ⇒ không đụng; đọc OMNI lỗi ⇒ bỏ phần OMNI, lượt vẫn chấm', async () => {
    const { d, env, token } = await dung()
    tiem.bat = true
    moPhien(d, 'BIA', ['Q1'], { mode: 'bia', bia: 1 })
    toi()
    const bia = await traLoi(env, token, 'BIA', 'Q1', 'A', { msLam: 500 })
    expect(bia.ok).toBe(true)
    expect(bia.omni).toBeUndefined()
    expect(dongSo(d, 'Q1', 'BIA')).toMatchObject({ ket_qua: 0, purpose: 'maintenance', raw_json: '{"chon":"A"}' })
    tiem.loiKyVong = true
    moPhien(d, 'P2', ['Q2'])
    toi()
    const loi = await traLoi(env, token, 'P2', 'Q2', 'A', { msLam: 500 })
    expect(loi.ok).toBe(true)
    expect(loi.correct).toBe(false)
    expect(loi.omni).toBeUndefined()
    expect(dongSo(d, 'Q2', 'P2')).toMatchObject({ ket_qua: 0, purpose: 'maintenance', raw_json: '{"chon":"A"}' })
  })
  it('lệnh hoa2-omni-* khi OMNI tắt ⇒ { ok:false, error }', async () => {
    const { env, token } = await dung()
    await gameV2(env, 'choose', { token, pet: 'dat_quy' })
    for (const lenh of ['hoa2-omni-tram-xong', 'hoa2-omni-nhat-ky', 'hoa2-omni-doi-thu-tu', 'hoa2-omni-de-thu', 'hoa2-omni-de-thu-nop']) {
      const r = await gameV2(env, lenh, { token, session: 'x', quyet: 'de_mai', id: 'x' }) as KQ
      expect(r.ok, lenh).toBe(false)
      expect(typeof r.error, lenh).toBe('string')
    }
  })
})

// ---------------------------------------------------------------- lướt
describe('OMNI 3 · B3 — lướt (sai quá nhanh)', () => {
  it('3 lượt lướt đầu: sổ purpose luot + ket_qua NULL, không đổi mastery, kết quả luot:true; lượt 4 trong ngày ⇒ sai thường', async () => {
    const { d, env, token } = await dung()
    tiem.bat = true
    moPhien(d, 'P1', ['Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6'])
    const truoc = mastery(d)
    for (const q of ['Q1', 'Q2', 'Q3']) {
      toi()
      const r = await traLoi(env, token, 'P1', q, 'A', { msLam: 1500 })
      expect(r.ok).toBe(true)
      expect(r.correct).toBe(false)
      expect(r.luot).toBe(true)
      expect(r.omni).toMatchObject({ nhanTocDo: 'luot', msLam: 1500, msKyVong: 90_000, luot: true, chacMaSai: false, loiNhan: CHU_LUOT })
      expect(r.omni.tram).toBeUndefined()
      const so = dongSo(d, q, 'P1')!
      expect(so.ket_qua).toBeNull()
      expect(so.purpose).toBe('luot')
      expect(JSON.parse(String(so.raw_json))).toEqual({ chon: 'A', ms: 1500, tt: 'chac', td: 'luot' })
      expect(mastery(d)).toEqual(truoc)
    }
    toi()
    const thu4 = await traLoi(env, token, 'P1', 'Q4', 'A', { msLam: 1500 })
    expect(thu4.luot).toBeUndefined()
    expect(thu4.omni).toMatchObject({ nhanTocDo: 'luot', luot: false })
    expect(thu4.omni.loiNhan).not.toBe(CHU_LUOT)
    expect(dongSo(d, 'Q4', 'P1')).toMatchObject({ ket_qua: 0, purpose: 'maintenance' })
    expect(mastery(d)).not.toEqual(truoc) // sai thường ⇒ `advance` hẹn lại dạng như cũ
  })
  it('sai nhưng không nhanh ⇒ không lướt; đúng nhanh ⇒ trôi chảy (không lướt)', async () => {
    const { d, env, token } = await dung()
    tiem.bat = true
    moPhien(d, 'P1', ['Q1', 'Q2'])
    toi()
    const sai = await traLoi(env, token, 'P1', 'Q1', 'A', { msLam: 60_000 })
    expect(sai.omni).toMatchObject({ nhanTocDo: 'thuong', luot: false, loiNhan: null })
    expect(dongSo(d, 'Q1', 'P1')).toMatchObject({ ket_qua: 0, purpose: 'maintenance' })
    toi()
    const nhanh = await traLoi(env, token, 'P1', 'Q2', 'B', { msLam: 1500 })
    expect(nhanh.correct).toBe(true)
    expect(nhanh.omni).toMatchObject({ nhanTocDo: 'troi_chay', luot: false, loiNhan: null })
    expect(JSON.parse(String(dongSo(d, 'Q2', 'P1')!.raw_json))).toEqual({ chon: 'B', ms: 1500, tt: 'chac', td: 'troi_chay' })
  })
})

// ---------------------------------------------------------------- chắc-mà-sai · P dạng · lời nhắn · Phần II
describe('OMNI 3 · B3 — chắc-mà-sai, P dạng, lời nhắn, Phần II', () => {
  it('chắc-mà-sai CHỈ khi mọi vi kỹ năng của câu đã vững (P ≥ 0,9) và em chọn Chắc', async () => {
    const { d, env, token } = await dung()
    tiem.bat = true
    tiem.q.set('Q1', { vkn: ['dang:D1', 'nen:mol'] }); tiem.q.set('Q2', { vkn: ['dang:D1', 'nen:mol'] }); tiem.q.set('Q3', { vkn: ['dang:D1', 'nen:mol'] })
    tiem.p = { 'dang:D1': 0.95, 'nen:mol': 0.92 }
    moPhien(d, 'P1', ['Q1', 'Q2', 'Q3'])
    toi()
    const vung = await traLoi(env, token, 'P1', 'Q1', 'A', { msLam: 40_000 })
    expect(vung.omni).toMatchObject({ chacMaSai: true, luot: false, loiNhan: CHU_CHAC_MA_SAI })
    toi()
    const chuaChac = await traLoi(env, token, 'P1', 'Q2', 'A', { msLam: 40_000, tuTin: 'chua_chac' })
    expect(chuaChac.omni).toMatchObject({ chacMaSai: false, loiNhan: null })
    expect(JSON.parse(String(dongSo(d, 'Q2', 'P1')!.raw_json)).tt).toBe('chua_chac')
    tiem.p = { 'dang:D1': 0.95, 'nen:mol': 0.6 }
    toi()
    const chuaVung = await traLoi(env, token, 'P1', 'Q3', 'A', { msLam: 40_000 })
    expect(chuaVung.omni).toMatchObject({ chacMaSai: false, loiNhan: null })
  })
  it('`dang`: P trước = tích P vi kỹ năng; P sau = capNhatHoi trên bản sao (không ghi gì); cỡ mẫu sau lượt', async () => {
    const { d, env, token } = await dung()
    tiem.bat = true
    tiem.q.set('Q1', { vkn: ['dang:D1', 'nen:mol'] })
    tiem.p = { 'dang:D1': 0.7, 'nen:mol': 0.5 }
    tiem.sEm = 0.06
    moPhien(d, 'P1', ['Q1'])
    toi()
    const r = await traLoi(env, token, 'P1', 'Q1', 'B', { msLam: 50_000 })
    const sau = capNhatHoi({ 'dang:D1': 0.7, 'nen:mol': 0.5 }, ['dang:D1', 'nen:mol'], true, THAM_SO_OMNI.G.I, 0.06, THAM_SO_OMNI.T)
    expect(r.omni.dang).toEqual({ ma: 'D1', ten: 'Dạng D1', pTruoc: 0.7 * 0.5, pSau: sau['dang:D1']! * sau['nen:mol']!, nTuLam: 5, nNgay: 3 })
  })
  it('đúng nhưng chậm ⇒ chữ "Đúng nhưng chậm" với số của em; đúng + Chưa chắc ⇒ chữ chưa chắc', async () => {
    const { d, env, token } = await dung()
    tiem.bat = true
    moPhien(d, 'P1', ['Q1', 'Q2'])
    toi()
    const cham = await traLoi(env, token, 'P1', 'Q1', 'B', { msLam: 200_000 })
    expect(cham.omni).toMatchObject({ nhanTocDo: 'cham', loiNhan: chuDungNhungCham(200_000, 90_000) })
    toi()
    const chuaChac = await traLoi(env, token, 'P1', 'Q2', 'B', { msLam: 120_000, tuTin: 'chua_chac' })
    expect(chuaChac.omni).toMatchObject({ nhanTocDo: 'thuong', loiNhan: CHU_DUNG_CHUA_CHAC })
  })
  it('Phần II: sổ ghi kết quả từng ý (1/0 so với đáp án)', async () => {
    const { d, env, token } = await dung()
    tiem.bat = true
    tiem.kyVong = 210_000
    moPhien(d, 'P1', ['Q8'])
    toi()
    const r = await traLoi(env, token, 'P1', 'Q8', 'DSSS', { msLam: 100_000 })
    expect(r.correct).toBe(false)
    expect(JSON.parse(String(dongSo(d, 'Q8', 'P1')!.subitem_json))).toEqual([1, 1, 0, 1])
  })
  it('gọi lại câu đã chấm (mạng chập chờn) ⇒ trả đúng bản cũ kèm `omni`, không thêm dòng sổ', async () => {
    const { d, env, token } = await dung()
    tiem.bat = true
    moPhien(d, 'P1', ['Q1'])
    toi()
    const dau = await traLoi(env, token, 'P1', 'Q1', 'A', { msLam: 1500 })
    const lai = await traLoi(env, token, 'P1', 'Q1', 'C', { msLam: 1500 })
    expect(lai.replayed).toBe(true)
    expect(lai.omni).toEqual(dau.omni)
    expect(lai.luot).toBe(true)
    expect((d.sql.prepare("SELECT COUNT(*) AS n FROM su_kien_hoc WHERE qid = 'Q1'").get() as { n: number }).n).toBe(1)
  })
})

// ---------------------------------------------------------------- Trạm hồi phục
describe('OMNI 3 · B3 — Trạm hồi phục', () => {
  const datQ = () => {
    for (const q of ['Q1', 'Q2', 'Q3']) tiem.q.set(q, { vkn: ['dang:D1', 'nen:mol'] })
    for (const q of ['Q4', 'Q5', 'Q6', 'Q7']) tiem.q.set(q, { vkn: ['dang:D1'] })
    tiem.p = { 'dang:D1': 0.6, 'nen:mol': 0.3 }
    tiem.vkn.set('nen:mol', { ten: 'Tính số mol', tenLoi: 'đổi khối lượng ra số mol' })
  }
  it('đúng 3 câu sai liền ⇒ trạm theo nhãn nền chung (tên lỗi, câu nền có sẵn); một lần/chuyến; JSON phiên tram:1', async () => {
    const { d, env, token } = await dung()
    tiem.bat = true
    datQ()
    d.sql.exec("INSERT INTO cau_nen(id,nhan,muc,kieu,de,dap_an,cap_nhat_luc) VALUES('n1','mol',1,'so','Tính số mol của 4,4 gam CO2','0,1','x')")
    moPhien(d, 'P1', ['Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6'])
    const ds: KQ[] = []
    for (const q of ['Q1', 'Q2', 'Q3', 'Q4']) { toi(); ds.push(await traLoi(env, token, 'P1', q, 'A', { msLam: 40_000 })) }
    expect(ds[0]!.omni.tram).toBeUndefined()
    expect(ds[1]!.omni.tram).toBeUndefined()
    expect(ds[2]!.omni.tram).toEqual({ vkn: 'nen:mol', ten: 'Tính số mol', tenLoi: 'đổi khối lượng ra số mol', nhan: 'mol', coCauNen: true, chu: chuTram('đổi khối lượng ra số mol', true) })
    expect(ds[2]!.omni.tram.chu).not.toMatch(/vi kỹ năng/i)
    expect(ds[3]!.omni.tram).toBeUndefined() // tối đa một trạm/chuyến
    const phien = JSON.parse(String((d.sql.prepare("SELECT json FROM game_v2_session WHERE id = 'P1'").get() as { json: string }).json))
    expect(phien.tram).toBe(1)
    // sổ vẫn ghi thật mọi lượt (trạm không đụng dữ liệu học)
    expect((d.sql.prepare("SELECT COUNT(*) AS n FROM su_kien_hoc WHERE ma_nguon = 'P1' AND ket_qua = 0").get() as { n: number }).n).toBe(4)
  })
  it('lướt chen giữa không cắt chuỗi; câu đúng cắt chuỗi; không có câu nền ⇒ coCauNen false', async () => {
    const { d, env, token } = await dung()
    tiem.bat = true
    datQ()
    moPhien(d, 'P1', ['Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6'])
    toi(); await traLoi(env, token, 'P1', 'Q1', 'A', { msLam: 40_000 })
    toi(); await traLoi(env, token, 'P1', 'Q2', 'B', { msLam: 40_000 }) // đúng ⇒ cắt chuỗi
    toi(); await traLoi(env, token, 'P1', 'Q3', 'A', { msLam: 40_000 })
    toi(); const luot = await traLoi(env, token, 'P1', 'Q4', 'A', { msLam: 1000 })
    expect(luot.luot).toBe(true)
    toi(); const r5 = await traLoi(env, token, 'P1', 'Q5', 'A', { msLam: 40_000 })
    expect(r5.omni.tram).toBeUndefined() // Q3, (lướt Q4), Q5 = 2 câu sai
    toi(); const r6 = await traLoi(env, token, 'P1', 'Q6', 'A', { msLam: 40_000 })
    // giao vi kỹ năng của Q3, Q5, Q6 = {dang:D1}; nhãn nen:mol chỉ ở Q3 ⇒ vẫn là nen:* nhiều nhất ⇒ nen:mol
    expect(r6.omni.tram).toMatchObject({ vkn: 'nen:mol', nhan: 'mol', coCauNen: false, chu: chuTram('đổi khối lượng ra số mol', false) })
  })
  it('Đoàn (kể cả gọi nội bộ) và chuyến vé ⇒ không mở trạm', async () => {
    const { d, env, token } = await dung()
    tiem.bat = true
    datQ()
    moPhien(d, 'DOAN', ['Q1', 'Q2', 'Q3'], { doan: 1 })
    moPhien(d, 'VE', ['Q4', 'Q5', 'Q6'], { ve: 1 })
    let cuoi: KQ = {}
    for (const q of ['Q1', 'Q2', 'Q3']) { toi(); cuoi = await gameV2(env, 'answer', danhDau({ token, session: 'DOAN', qid: q, answer: 'A', msLam: 40_000 })) as KQ }
    expect(cuoi.ok).toBe(true)
    expect(cuoi.omni.tram).toBeUndefined()
    for (const q of ['Q4', 'Q5', 'Q6']) { toi(); cuoi = await traLoi(env, token, 'VE', q, 'A', { msLam: 40_000 }) }
    expect(cuoi.omni.tram).toBeUndefined()
    expect(cuoi.ve).toBe(true) // máy em không trừ Máu ở chuyến vé
    expect(dongSo(d, 'Q6', 'VE')).toMatchObject({ ket_qua: 0, purpose: 'probe' }) // sổ ghi thật
  })
  it('hoa2-omni-tram-xong: đổi ải KẾ TIẾP bằng câu cùng dạng thấp hơn một bậc; `answer` chấm được câu mới; gọi lại trả đúng câu đã đổi', async () => {
    const { d, env, token } = await dung()
    tiem.bat = true
    datQ()
    await gameV2(env, 'choose', { token, pet: 'dat_quy' })
    await gvChienDich(env, { action: 'tao', ten: 'Bài 1', lop: '12A1', maDe: ['DH-B1'], hanNop: '2026-10-12' }, T0 - 86_400_000)
    moPhien(d, 'P1', ['Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6'])
    const chuaTram = await gameV2(env, 'hoa2-omni-tram-xong', { token, session: 'P1' }) as KQ
    expect(chuaTram.ok).toBe(false)
    for (const q of ['Q1', 'Q2', 'Q3']) { toi(); await traLoi(env, token, 'P1', q, 'A', { msLam: 40_000 }) }
    toi()
    const r = await gameV2(env, 'hoa2-omni-tram-xong', { token, session: 'P1' }) as KQ
    expect(r.ok).toBe(true)
    expect(r.viTri).toBe(3)
    expect(r.cau.qid).toBe('Q7') // dạng D1, Nhận biết (Q4 là Thông hiểu)
    expect(r.cau.correct).toBeUndefined()
    expect(r.cau.solution).toBeUndefined()
    expect(r.cau.vai).toBe('moi')
    const phien = JSON.parse(String((d.sql.prepare("SELECT json FROM game_v2_session WHERE id = 'P1'").get() as { json: string }).json))
    expect(phien.questions.map((x: { qid: string }) => x.qid)).toEqual(['Q1', 'Q2', 'Q3', 'Q7', 'Q5', 'Q6'])
    const lai = await gameV2(env, 'hoa2-omni-tram-xong', { token, session: 'P1' }) as KQ
    expect(lai).toMatchObject({ ok: true, viTri: 3 })
    expect(lai.cau.qid).toBe('Q7')
    toi()
    const cham = await traLoi(env, token, 'P1', 'Q7', 'C', { msLam: 30_000 })
    expect(cham).toMatchObject({ ok: true, correct: true })
  })
})

// ---------------------------------------------------------------- lệnh phụ + Đoàn
describe('OMNI 3 · B3 — nhật ký, đổi thứ tự', () => {
  it('hoa2-omni-nhat-ky trả dòng của lớp D1; hoa2-omni-doi-thu-tu kiểm lựa chọn rồi gọi doiThuTuMetGio', async () => {
    const { env, token } = await dung()
    tiem.bat = true
    await gameV2(env, 'choose', { token, pet: 'dat_quy' })
    expect(await gameV2(env, 'hoa2-omni-nhat-ky', { token })).toEqual({ ok: true, dong: ['Hôm nay em đúng 3 câu Este.', 'Bước tính số mol tiến thêm.'] })
    const sai = await gameV2(env, 'hoa2-omni-doi-thu-tu', { token, quyet: 'bo_qua' }) as KQ
    expect(sai.ok).toBe(false)
    expect(await gameV2(env, 'hoa2-omni-doi-thu-tu', { token, quyet: 'de_mai' })).toMatchObject({ ok: true, theLuc: { con: 3, tong: 10 } })
    expect(tiem.doiThuTu).toEqual(['de_mai'])
  })
})
