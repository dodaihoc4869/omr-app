// @vitest-environment node
// LUẬT THẦY 05/10 — danh sách OMNI của THẦY (chỉ có trên nhánh OMNI): "Cần thầy chữa" của Bảng bài (luật B) và câu LẠ máy tự thêm vào ca chốt (luật A theo khối lớp).
// Nguyên văn: "mục câu cần chữa của khối 11 khi chiếu lên bảng thì rất nhiều câu của lớp 10 bị chèn vào, bạn xem mọi chỗ chặn triệt để rút nhầm câu của kho khối khác"
//   · "rất nhiều cấu thuộc lớp 10 nhưng bị rút nhầm sang lớp 11, bạn phải chặn chuẩn 100% không được rút nhầm kho khác khối cho tôi nhé".
// D1 THẬT (node:sqlite); lõi OMNI giả tất định như tests/omni-3-gv.test.ts (tests/omni-3-d1-gia.ts).
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../server/src/omni-p-vkn', async (goc) => {
  const m = await goc<typeof import('../server/src/omni-p-vkn')>()
  const g = await import('./omni-3-d1-gia')
  return { ...m, phatLaiEm: vi.fn((sbd: string, dv: import('../server/src/omni-p-vkn').DauVaoPhatLai) => g.phatLaiGia(sbd, dv)) }
})
vi.mock('../server/src/du-bao-diem', async (goc) => ({ ...(await goc<object>()), duBaoDiem: vi.fn((await import('./omni-3-d1-gia')).duBaoGia) }))
vi.mock('../server/src/omni-ke-hoach', async (goc) => ({ ...(await goc<object>()), dangDaVung: vi.fn((await import('./omni-3-d1-gia')).dangDaVungGia) }))
vi.mock('../server/src/omni-chung-chi', async (goc) => ({ ...(await goc<object>()), xetChungChi: vi.fn((await import('./omni-3-d1-gia')).xetChungChiGia) }))
vi.mock('../server/src/bai-da-day', async (goc) => {
  const g = await import('./omni-3-d1-gia')
  return { ...(await goc<object>()), lopCuaEm: vi.fn(async (_e: unknown, sbd: string) => g.gia.lop[sbd] ?? null), phamViCuaEm: vi.fn(async (_e: unknown, sbd: string) => g.gia.phamVi[sbd] ?? null) }
})

import { taoD1That, type D1That } from './_d1-that'
import { datLaiGia } from './omni-3-d1-gia'
import { gvOmni } from '../server/src/omni-gv'
import { gvChienDich } from '../server/src/srs2-gv'
import { ghiSuKien, type SuKien } from '../server/src/su-kien-hoc'
import type { BangOmni } from '../server/src/omni-kieu'
import type { Env } from '../server/src/kieu'

const T0 = Date.parse('2026-10-05T03:00:00Z')
const NGAY = 86_400_000
const EM = ['S1', 'S2', 'S3']

function dung(lop: string): { d: D1That; env: Env } {
  const d = taoD1That()
  const st = d.sql.prepare('INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES(?,?,?,?,?)')
  EM.forEach((s, i) => st.run(s, `Em ${i + 1}`, lop, 'mk', 'x'))
  d.sql.exec(`INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('game_hoa_2','{"bat":true}','x'),('omni','{"bat":true}','x')`)
  return { d, env: d.env as unknown as Env }
}
interface CauTuy { maDe: string; phan?: 'I' | 'II' | 'III'; dang?: string; mucDo?: string; lop?: string; chuyenDe?: string }
function themCau(d: D1That, qid: string, t: CauTuy) {
  const phan = t.phan ?? 'I', dang = t.dang ?? 'D1'
  const json = { qid, maDe: t.maDe, ...(t.lop ? { lop: t.lop } : {}), ...(t.chuyenDe ? { chuyenDe: t.chuyenDe } : {}), version: 'v1', group: `g-${qid}`, phan, text: `Câu ${qid}`, choices: ['a', 'b', 'c', 'd'], ideas: phan === 'II' ? ['a', 'b', 'c', 'd'] : [],
    dang, tenDang: `Dạng ${dang}`, mucDo: t.mucDo ?? 'Thông hiểu', kienThuc: [], correct: phan === 'II' ? 'DSDS' : phan === 'III' ? '12' : 'B', solution: { chot: 'x' }, reviewed: true, hinhAnh: [] }
  d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)').run(t.maDe, qid, 'v1', `g-${qid}`, dang, JSON.stringify(json))
}
const sk = (sbd: string, qid: string, ms: number, kq: 0 | 1): SuKien => ({ nguon: 'game', maNguon: `p-${ms}-${qid}`, sbd, qid, lan: 1, ketQua: kq, luc: new Date(ms).toISOString(), receivedAt: ms, assistance: 'none' })
const laKhoi = (k: string) => (q: string) => q.startsWith(`DH-${k}-`)

beforeEach(() => { datLaiGia(); vi.clearAllMocks() })

describe('OMNI · Bảng bài "Cần thầy chữa" (luật B): lớp khối 11 chỉ thấy câu khối 11', () => {
  it('chiến dịch thầy giao lẫn tờ khối 10 / mâu thuẫn: câu SAI ≥ 4 lần của tờ khác khối KHÔNG lên "Cần thầy chữa"; câu khối 11 vẫn lên', async () => {
    const { d, env } = dung('11A1')
    for (const [ma, lop] of [['DH-11-K1', undefined], ['DH-10-K1', undefined], ['DH-12-K1', '11']] as const) for (const i of [1, 2]) themCau(d, `${ma}-I-${i}`, { maDe: ma, ...(lop ? { lop } : {}) })
    const r = await gvChienDich(env, { action: 'tao', ten: 'Bài lẫn khối', lop: '11A1', maDe: ['DH-11-K1', 'DH-10-K1', 'DH-12-K1'], hanNop: '2026-10-12' }, T0 - 6 * NGAY)
    expect(r.ok).toBe(true)
    // S3 sai 4 lần (4 ngày) MỌI câu ⇒ câu rời kế hoạch (cắt tỉa) — kể cả câu khối 10 và câu mâu thuẫn (DH-12-… ghi lop 11)
    const ds: SuKien[] = []
    for (const q of ['DH-11-K1-I-1', 'DH-10-K1-I-1', 'DH-12-K1-I-1']) for (let k = 2; k <= 5; k++) ds.push(sk('S3', q, T0 - k * NGAY + 3_600_000, 0))
    await ghiSuKien(env, ds)
    // nút thắt em gửi ở cả ba tờ
    d.sql.exec(`INSERT INTO nut_that(id,sbd,qid,bam,buoc,gui_luc,ngay_vn,trang_thai,cap_nhat_luc) VALUES
      ('n1','S1','DH-11-K1-I-2','b',2,'2026-10-04T10:00:00Z','2026-10-04','cho','x'),('n2','S2','DH-10-K1-I-2','b',2,'2026-10-04T11:00:00Z','2026-10-04','cho','x'),
      ('n3','S2','DH-12-K1-I-2','b',1,'2026-10-04T12:00:00Z','2026-10-04','cho','x')`)
    const b = (await gvOmni(env, { action: 'bang', chienDichId: String(r.id) }, T0)) as unknown as BangOmni
    const qids = b.canThayChua.flatMap((c) => c.qids ?? [])
    expect(qids).toContain('DH-11-K1-I-1') // cắt tỉa khối 11
    expect(qids).toContain('DH-11-K1-I-2') // nút thắt khối 11
    expect(qids.filter((q) => !laKhoi('11')(q))).toEqual([])
  })
})

describe('OMNI · ca chốt: câu LẠ máy tự thêm chỉ ĐÚNG khối lớp', () => {
  it('lớp 12A1: câu lạ chỉ từ tờ TU LUYỆN khối 12 — không tờ khối 10, không tờ không rõ khối, không câu mâu thuẫn khối', async () => {
    const { d, env } = dung('12A1')
    // Bẫy ngoài đời: chuyên đề TRÙNG TÊN giữa các khối (`CD1`) ⇒ câu mọi khối cùng "ô" (phần · chuyên đề · mức) với câu chiến dịch.
    for (let i = 0; i < 10; i++) themCau(d, `DH-12-C-I-${i}`, { maDe: 'DH-12-C', dang: 'CHUNG.A', chuyenDe: 'CD1' })
    for (let i = 0; i < 4; i++) themCau(d, `DH-12-C-II-${i}`, { maDe: 'DH-12-C', phan: 'II', dang: 'CHUNG.C', chuyenDe: 'CD1' })
    for (let i = 0; i < 6; i++) themCau(d, `DH-12-C-III-${i}`, { maDe: 'DH-12-C', phan: 'III', dang: 'CHUNG.D', mucDo: 'Vận dụng', chuyenDe: 'CD1' })
    const r = await gvChienDich(env, { action: 'tao', ten: 'Bài 6', lop: '12A1', maDe: ['DH-12-C'], hanNop: '2026-10-12' }, T0 - 6 * NGAY)
    expect(r.ok).toBe(true)
    // TU LUYỆN (mã không DH-): tờ khối 12 (đúng), khối 10, không rõ khối, và tờ mã khối 11 mà dạng thuộc chương ESTER (khối 12) ⇒ MÂU THUẪN
    for (const [ma, dau] of [['TL-12-X', 'CHUNG'], ['TL-10-X', 'CHUNG'], ['TL-LA-X', 'CHUNG'], ['TL-11-X', 'ESTER']] as const) {
      for (let i = 0; i < 12; i++) themCau(d, `${ma}-I-${i}`, { maDe: ma, dang: `${dau}.A`, chuyenDe: 'CD1' })
      for (let i = 0; i < 5; i++) themCau(d, `${ma}-II-${i}`, { maDe: ma, phan: 'II', dang: `${dau}.C`, chuyenDe: 'CD1' })
      for (let i = 0; i < 5; i++) themCau(d, `${ma}-III-${i}`, { maDe: ma, phan: 'III', dang: `${dau}.D`, mucDo: 'Vận dụng', chuyenDe: 'CD1' })
    }
    const k = await gvOmni(env, { action: 'ca-chot', chienDichId: String(r.id) }) as { ok: boolean; qidLa: string[]; qids: string[] }
    expect(k.ok).toBe(true)
    expect(k.qidLa.length).toBeGreaterThan(0)
    expect(k.qidLa.filter((q) => !q.startsWith('TL-12-X-'))).toEqual([])
    expect(k.qids.filter((q) => /^TL-(10|LA|11)-X-/.test(q))).toEqual([])
  })
})
