// @vitest-environment node
// (2a) TRẠM HỒI PHỤC XẾP THEO BƯỚC EM TỰ KHAI (06/10, lệnh thầy "Làm chuẩn đoán bước sai") — D1 thật (node:sqlite, đủ migration), đường `answer` thật.
// Em đã tự khai bước sai (bảng `omni_buoc_sai`: thẻ Cẩn thận (c) / câu chẩn đoán làm sai) ⇒ Trạm chọn TÊN LỖI + nhãn câu nền theo bước khai NẾU bước ấy
// nằm trong vi kỹ năng của 3 câu sai (cửa sổ 14 ngày; nhiều dòng nhất → gần nhất → P thấp hơn). Không có khai khớp ⇒ y hệt cũ (P thấp nhất).
// Lớp D1 OMNI (omni-d1.ts) TIÊM bằng vi.mock như tests/omni-3-tra-loi.test.ts (P, ma trận Q, tên vi kỹ năng cố định).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { taoD1That } from './_d1-that'
import { gameV2 } from '../server/src/game-v2'
import { gameToken } from '../server/src/game-v2-auth'
import { xoaDemCaBaoVe } from '../server/src/game-v2-bank'
import { LENH_TAO_BANG_CAN_THAN } from '../server/src/omni-can-than'
import { CUA_SO_BUOC_SAI_NGAY, chonBuocTuKhai, dauCuaSoBuocSai, docBuocSaiGanDay } from '../server/src/omni-buoc-sai-uu-tien'
import { CAC_KHUNG_GIO, type HoSoOmniEm, type QCau, type Vkn } from '../server/src/omni-kieu'
import type { Env } from '../server/src/kieu'

const tiem = vi.hoisted(() => ({
  p: {} as Record<string, number>,
  q: new Map<string, string[]>(),
  vkn: new Map<string, { ten: string; tenLoi?: string | null }>(),
}))
vi.mock('../server/src/omni-d1', async (goc) => {
  const that = await goc<typeof import('../server/src/omni-d1')>()
  return {
    ...that,
    omniBat: vi.fn(async () => true),
    kyVongMsCau: vi.fn(async () => 90_000),
    soLuotHomNay: vi.fn(async () => 0),
    hoSoOmniEm: vi.fn(async (_env: Env, sbd: string) => hoSo(sbd)),
    qCuaCau: vi.fn(async (_env: Env, qids: readonly string[]) => new Map(qids.map((q) => [q, { qid: q, phan: 'I', maDang: 'D1', mucDo: null, vkn: tiem.q.get(q) ?? [`cau:${q}`], nguon: 'thay' } as QCau]))),
    vknTheoId: vi.fn(async (_env: Env, ids: readonly string[]) => new Map(ids.map((id, i) => {
      const v = tiem.vkn.get(id)
      return [id, { id, maDang: 'D1', ten: v?.ten ?? id, tenLoi: v?.tenLoi ?? null, nhanNen: null, thuTu: i } as Vkn]
    }))),
  }
})
function hoSo(sbd: string): HoSoOmniEm {
  const vkn = Object.fromEntries(Object.entries(tiem.p).map(([k, p]) => [k, { vkn: k, p, nTuLam: 4, nCau: 3, nNgay: 2, nTroiChay: 0, nCauLaDung: 0, diemSprt: 0, trangThai: 'chua_du' as const, ngayCuoi: '2026-10-01', dayLai: false }]))
  return { sbd, vkn, sEm: 0.05, nVung: 0, nSaiVung: 0, tau: 0, nTau: 0, khungGio: Object.fromEntries(CAC_KHUNG_GIO.map((k) => [k, { n: 0, soY: 0 }])) as HoSoOmniEm['khungGio'], luotHomNay: 0, cursor: '', phienBan: 'test' }
}

const T0 = Date.parse('2026-10-06T09:00:00+07:00')
let bayGio = T0
const toi = (ms = 60_000) => { bayGio += ms; vi.setSystemTime(bayGio) }
beforeEach(() => {
  bayGio = T0; vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(T0); xoaDemCaBaoVe()
  tiem.q.clear(); tiem.vkn.clear()
  for (const q of ['Q1', 'Q2', 'Q3']) tiem.q.set(q, ['dang:D1', 'nen:mol', 'nen:pt'])
  tiem.p = { 'dang:D1': 0.6, 'nen:mol': 0.3, 'nen:pt': 0.5 }
  tiem.vkn.set('nen:mol', { ten: 'Tính số mol', tenLoi: 'đổi khối lượng ra số mol' })
  tiem.vkn.set('nen:pt', { ten: 'Cân bằng phương trình', tenLoi: 'cân bằng phương trình' })
})
afterEach(() => { vi.useRealTimers(); xoaDemCaBaoVe() })

async function dung(coBang = true) {
  const d = taoD1That()
  const env = d.env as unknown as Env
  d.sql.exec("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES('S1','Nguyễn An','12A1','mk1','x')")
  d.sql.exec(`INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('game_hoa_2','{"bat":true,"lop":["12A1"]}','x')`)
  d.sql.exec("INSERT INTO de_kho(ma_de,ten_de,so_cau,da_xoa,cap_nhat_luc) VALUES('DH-B1','Bài 1',6,0,'v1')")
  d.sql.exec("INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('DH-B1','v1','x')")
  const st = d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)')
  for (let i = 1; i <= 6; i++) {
    const qid = `Q${i}`
    st.run('DH-B1', qid, 'v1', `g-${qid}`, 'D1', JSON.stringify({ qid, maDe: 'DH-B1', lop: '12', version: 'v1', group: `g-${qid}`, phan: 'I', text: `Câu ${qid}`, choices: ['a', 'b', 'c', 'd'], ideas: [], hinhAnh: [], dang: 'D1', tenDang: 'Dạng D1', mucDo: 'TH', sao: 1, kienThuc: ['k'], correct: 'B', reviewed: true, solution: { chot: 'x' } }))
  }
  if (coBang) for (const s of LENH_TAO_BANG_CAN_THAN) d.sql.exec(s)
  d.sql.prepare('INSERT INTO game_v2_session(id,sbd,json,created_at) VALUES(?,?,?,?)').run('P1', 'S1', JSON.stringify({
    mode: 'adventure', created: Date.now(), hoa2: 1, questions: [1, 2, 3, 4, 5, 6].map((i) => ({ qid: `Q${i}`, maDe: 'DH-B1', version: 'v1', group: `g-Q${i}`, novel: true, role: 'moi' })),
  }), new Date().toISOString())
  return { d, env, token: await gameToken(env, 'S1') }
}
const khai = (d: ReturnType<typeof taoD1That>, qid: string, ngay: string, ma: string, gio = '08:00') =>
  d.sql.prepare('INSERT INTO omni_buoc_sai(sbd,qid,ngay,ma_vkn,luc) VALUES(?,?,?,?,?)').run('S1', qid, ngay, ma, new Date(Date.parse(`${ngay}T${gio}:00+07:00`)).toISOString())
async function baCauSai(env: Env, token: string) {
  let r: Record<string, any> = {}
  for (const q of ['Q1', 'Q2', 'Q3']) { toi(); r = await gameV2(env, 'answer', { token, session: 'P1', qid: q, answer: 'A', msLam: 40_000 }) as Record<string, any> }
  return r
}

describe('(2a) chonBuocTuKhai — luật chọn bước em tự khai (thuần)', () => {
  const p = (m: Record<string, number>) => (k: string) => m[k] ?? 0.5
  const d = (maVkn: string, luc: string) => ({ maVkn, luc })
  it('nhiều dòng nhất thắng; hoà ⇒ dòng gần nhất; hoà nữa ⇒ P thấp hơn ⇒ mã', () => {
    expect(chonBuocTuKhai([d('nen:a', '2026-10-01'), d('nen:b', '2026-10-02'), d('nen:a', '2026-10-03')], ['nen:a', 'nen:b'], p({}))).toBe('nen:a')
    expect(chonBuocTuKhai([d('nen:a', '2026-10-01'), d('nen:b', '2026-10-05')], ['nen:a', 'nen:b'], p({}))).toBe('nen:b')
    expect(chonBuocTuKhai([d('nen:a', 'T'), d('nen:b', 'T')], ['nen:a', 'nen:b'], p({ 'nen:a': 0.7, 'nen:b': 0.2 }))).toBe('nen:b')
    expect(chonBuocTuKhai([d('nen:b', 'T'), d('nen:a', 'T')], ['nen:a', 'nen:b'], p({}))).toBe('nen:a')
  })
  it('bỏ "Em chưa rõ", mã rỗng, mã ngoài ứng viên; không còn gì ⇒ null', () => {
    expect(chonBuocTuKhai([d('chua_ro', 'T'), d('chua_ro', 'T2'), d('nen:x', 'T3'), d('', 'T4')], ['nen:a'], p({}))).toBeNull()
    expect(chonBuocTuKhai([], ['nen:a'], p({}))).toBeNull()
    expect(chonBuocTuKhai([d('nen:a', 'T')], [], p({}))).toBeNull()
    expect(chonBuocTuKhai([d('chua_ro', 'T'), d('chua_ro', 'T'), d('nen:a', 'T0')], ['nen:a', 'chua_ro'], p({}))).toBe('nen:a')
  })
  it('cửa sổ 14 ngày VN tính cả hôm nay', () => {
    expect(CUA_SO_BUOC_SAI_NGAY).toBe(14)
    expect(dauCuaSoBuocSai(T0)).toBe('2026-09-23')
  })
})

describe('(2a) Trạm hồi phục ưu tiên bước em tự khai', () => {
  it('không có khai ⇒ y hệt cũ: P thấp nhất trong giao (nen:mol)', async () => {
    const { env, token } = await dung()
    const r = await baCauSai(env, token)
    expect(r.ok, JSON.stringify(r).slice(0, 300)).toBe(true)
    expect(r.omni.tram).toMatchObject({ vkn: 'nen:mol', nhan: 'mol', tenLoi: 'đổi khối lượng ra số mol' })
  })
  it('em khai nen:pt (câu khác, trong cửa sổ) ⇒ tên lỗi + nhãn câu nền là nen:pt', async () => {
    const { d, env, token } = await dung()
    khai(d, 'Q9', '2026-10-04', 'nen:pt')
    const r = await baCauSai(env, token)
    expect(r.omni.tram).toMatchObject({ vkn: 'nen:pt', nhan: 'pt', tenLoi: 'cân bằng phương trình' })
    expect(r.omni.tram.chu).not.toMatch(/nen:|vi kỹ năng/i)
  })
  it('nhiều khai: bước khai nhiều nhất thắng (nen:mol 2 dòng > nen:pt 1 dòng mới hơn)', async () => {
    const { d, env, token } = await dung()
    khai(d, 'Q7', '2026-10-01', 'nen:mol'); khai(d, 'Q8', '2026-10-02', 'nen:mol'); khai(d, 'Q9', '2026-10-05', 'nen:pt')
    const r = await baCauSai(env, token)
    expect(r.omni.tram.vkn).toBe('nen:mol')
  })
  it('khai ngoài vi kỹ năng của 3 câu / "Em chưa rõ" / quá 14 ngày ⇒ bỏ qua (luật cũ)', async () => {
    const { d, env, token } = await dung()
    tiem.p['nen:pt'] = 0.2 // luật cũ: P thấp nhất ⇒ nen:pt
    khai(d, 'Q7', '2026-10-05', 'nen:khac')
    khai(d, 'Q8', '2026-10-05', 'chua_ro')
    khai(d, 'Q9', '2026-09-20', 'nen:mol') // 16 ngày trước
    const r = await baCauSai(env, token)
    expect(r.omni.tram.vkn).toBe('nen:pt')
    expect((await docBuocSaiGanDay(env, 'S1', Date.now())).map((x) => x.maVkn).sort()).toEqual(['chua_ro', 'nen:khac'])
  })
  it('bảng omni_buoc_sai chưa có (D1 mới) ⇒ Trạm vẫn mở theo luật cũ, không lỗi', async () => {
    const { env, token } = await dung(false)
    expect(await docBuocSaiGanDay(env, 'S1', Date.now())).toEqual([])
    const r = await baCauSai(env, token)
    expect(r.omni.tram).toMatchObject({ vkn: 'nen:mol', nhan: 'mol' })
  })
})
