// @vitest-environment node
// OMNI 3 · LÀN B2 — LỚP D1 (server/src/omni-d1.ts) trên D1 thật (node:sqlite, lược đồ đủ migration).
// Lõi thuần là làn khác (đang STUB) ⇒ test gắn LÕI GIẢ tất định (tests/omni-3-d1-gia.ts) để kiểm ĐƯỜNG ỐNG, không phụ thuộc con số của stub.
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DatabaseSync } from 'node:sqlite'
import { readFileSync } from 'node:fs'

vi.mock('../server/src/omni-p-vkn', async (goc) => {
  const m = await goc<typeof import('../server/src/omni-p-vkn')>()
  const g = await import('./omni-3-d1-gia')
  return { ...m, phatLaiEm: vi.fn((sbd: string, dv: import('../server/src/omni-p-vkn').DauVaoPhatLai) => { g.gia.goi.push({ sbd, dv }); return g.phatLaiGia(sbd, dv) }) }
})
vi.mock('../server/src/du-bao-diem', async (goc) => ({ ...(await goc<object>()), duBaoDiem: vi.fn((await import('./omni-3-d1-gia')).duBaoGia) }))
vi.mock('../server/src/omni-ke-hoach', async (goc) => ({ ...(await goc<object>()), dangDaVung: vi.fn((await import('./omni-3-d1-gia')).dangDaVungGia) }))
vi.mock('../server/src/omni-chung-chi', async (goc) => ({ ...(await goc<object>()), xetChungChi: vi.fn((await import('./omni-3-d1-gia')).xetChungChiGia) }))
vi.mock('../server/src/omni-met-gio', async (goc) => {
  const g = await import('./omni-3-d1-gia')
  return { ...(await goc<object>()), xetMetGio: vi.fn(() => g.gia.metGio) }
})
vi.mock('../server/src/omni-q', async (goc) => {
  const m = await goc<typeof import('../server/src/omni-q')>()
  const g = await import('./omni-3-d1-gia')
  return { ...m, goiYQ: vi.fn((...a: Parameters<typeof m.goiYQ>) => { g.gia.goiYQ.push({ cau: a[0], vknDang: a[1], danhMucNen: a[2] }); return m.goiYQ(...a) }) }
})
vi.mock('../server/src/omni-toc-do', async (goc) => {
  const m = await goc<typeof import('../server/src/omni-toc-do')>()
  const g = await import('./omni-3-d1-gia')
  return { ...m, betaTuMau: vi.fn((ms: readonly number[], ts?: Parameters<typeof m.betaTuMau>[1]) => { g.gia.beta.push([...ms]); return m.betaTuMau(ms, ts) }) }
})
vi.mock('../server/src/bai-da-day', async (goc) => {
  const g = await import('./omni-3-d1-gia')
  return { ...(await goc<object>()), lopCuaEm: vi.fn(async (_e: unknown, sbd: string) => g.gia.lop[sbd] ?? null), phamViCuaEm: vi.fn(async (_e: unknown, sbd: string) => g.gia.phamVi[sbd] ?? null) }
})

import { taoD1That, type D1That } from './_d1-that'
import { datLaiGia, gia, phatLaiGia } from './omni-3-d1-gia'
import {
  LENH_TAO_BANG_OMNI, capNhatChungChi, chayOmniDem, chiaTheoTiLe, damBaoBangOmni, docRawOmni, docSuKienOmni, docYTuSubitem, gopPrior, hieuChinhOmniTuan,
  hoSoOmniEm, hoSoOmniNhieuEm, khungTheoPhamVi, kyVongMsCau, nhatKyHomNay, omniBat, omniChoPh, omniChoSanh, qCuaCau, soLuotHomNay, thamSoTu, thuHaiCua,
  uocTTheoDang, vknTheoId, xoaDemOmni, KHOA_CON_TRO_DEM, docCoOmni, gioHocTu,
} from '../server/src/omni-d1'
import { gvOmni } from '../server/src/omni-gv'
import { phHoc2 } from '../server/src/ph-bao-cao-moi'
import { ghiSuKien, type SuKien } from '../server/src/su-kien-hoc'
import { msKyVong } from '../server/src/omni-toc-do'
import { PHIEN_BAN_OMNI, THAM_SO_OMNI, type HoSoOmniEm } from '../server/src/omni-kieu'
import { TEN_NEN } from '../server/src/thang-tu-go'
import type { Env } from '../server/src/kieu'

const T0 = Date.parse('2026-10-05T03:00:00Z') // 10:00 Thứ Hai 05/10/2026 giờ VN
const NGAY = 86_400_000
const LOP1 = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6']

function dung(tuy: { omni?: unknown; hoa2?: unknown } = {}): { d: D1That; env: Env } {
  const d = taoD1That()
  const st = d.sql.prepare('INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES(?,?,?,?,?)')
  LOP1.forEach((s, i) => st.run(s, `Em ${i + 1}`, '12A1', 'mk', 'x'))
  st.run('S9', 'Em chín', '12A2', 'mk', 'x')
  const co = d.sql.prepare('INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES(?,?,?)')
  if (tuy.hoa2 !== null) co.run('game_hoa_2', JSON.stringify(tuy.hoa2 ?? { bat: true }), 'x')
  if (tuy.omni !== null) co.run('omni', JSON.stringify(tuy.omni ?? { bat: true }), 'x')
  return { d, env: d.env as unknown as Env }
}
interface CauTuy { maDe?: string; phan?: 'I' | 'II' | 'III'; dang?: string | null; tenDang?: string; mucDo?: string; kienThuc?: string[]; text?: string; reviewed?: boolean; tuLuan?: boolean }
function themCau(d: D1That, qid: string, t: CauTuy = {}) {
  const phan = t.phan ?? 'I', dang = t.dang === undefined ? 'D1' : t.dang
  const json = { qid, maDe: t.maDe ?? 'DE1', version: 'v1', group: `g-${qid}`, phan, text: t.text ?? `Câu ${qid}`, choices: ['a', 'b', 'c', 'd'], ideas: phan === 'II' ? ['a', 'b', 'c', 'd'] : [],
    dang, tenDang: t.tenDang ?? (dang ? `Dạng ${dang}` : ''), mucDo: t.mucDo ?? 'Thông hiểu', kienThuc: t.kienThuc ?? [], correct: phan === 'II' ? 'DSDS' : phan === 'III' ? '12' : 'B',
    solution: { chot: 'LOI-GIAI-BI-MAT' }, reviewed: t.reviewed ?? true, ...(t.tuLuan ? { tuLuan: true } : {}), hinhAnh: [] }
  d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)').run(t.maDe ?? 'DE1', qid, 'v1', `g-${qid}`, dang, JSON.stringify(json))
}
const sk = (sbd: string, qid: string, ms: number, kq: 0 | 1 | null, t: Partial<SuKien> = {}): SuKien => ({
  nguon: 'game', maNguon: `p-${ms}-${qid}`, sbd, qid, lan: 1, ketQua: kq, luc: new Date(ms).toISOString(), receivedAt: ms, assistance: 'none', ...t,
})
const hsGia = (sbd: string, sua: Partial<HoSoOmniEm>) => (hs: HoSoOmniEm) => ({ ...hs, ...sua, sbd })

beforeEach(() => { datLaiGia(); vi.clearAllMocks() })

// ---------------------------------------------------------------- bảng
describe('damBaoBangOmni — bảng chỉ-thêm khớp migration-0510', () => {
  it('lược đồ dựng từ LENH_TAO_BANG_OMNI = lược đồ dựng từ tệp SQL (bảng, cột, khoá, chỉ mục)', () => {
    const chup = (sql: DatabaseSync) => {
      const bang = (sql.prepare("SELECT name, type FROM sqlite_master WHERE type IN ('table','index') AND name NOT LIKE 'sqlite_%' ORDER BY name").all() as { name: string; type: string }[])
      return bang.map((b) => ({ ...b, cot: b.type === 'table' ? sql.prepare(`SELECT name, type, "notnull", dflt_value, pk FROM pragma_table_info('${b.name}')`).all() : sql.prepare(`SELECT name FROM pragma_index_info('${b.name}')`).all() }))
    }
    const a = new DatabaseSync(':memory:'), b = new DatabaseSync(':memory:')
    a.exec(readFileSync('server/migration-0510-omni-3.sql', 'utf8'))
    for (const l of LENH_TAO_BANG_OMNI) b.exec(l)
    expect(JSON.stringify(chup(b))).toBe(JSON.stringify(chup(a)))
    expect(chup(a).length).toBeGreaterThanOrEqual(18)
  })
  it('chạy một lần mỗi isolate (một batch), gọi lại không lỗi', async () => {
    const { d, env } = dung()
    const truoc = d.soLenh.batch
    await damBaoBangOmni(env)
    await damBaoBangOmni(env)
    expect(d.soLenh.batch - truoc).toBe(1)
  })
})

// ---------------------------------------------------------------- công tắc
describe('omniBat — Hoá 2.0 áp cho em ∧ cờ omni theo lớp/SBD', () => {
  it('cờ omni vắng/tắt ⇒ false; Hoá 2.0 tắt ⇒ false dù omni bật', async () => {
    expect(await omniBat(dung({ omni: null }).env, 'S1')).toBe(false)
    expect(await omniBat(dung({ omni: { bat: false } }).env, 'S1')).toBe(false)
    expect(await omniBat(dung({ hoa2: { bat: false } }).env, 'S1')).toBe(false)
    expect(await omniBat(dung({ hoa2: null }).env, 'S1')).toBe(false)
  })
  it('bật cả trung tâm ⇒ mọi em; theo lớp ⇒ chỉ em lớp đó; theo SBD ⇒ chỉ em đó', async () => {
    const tat = dung()
    expect(await omniBat(tat.env, 'S1')).toBe(true)
    expect(await omniBat(tat.env, 'S9')).toBe(true)
    const lop = dung({ omni: { bat: true, lop: ['12A1'] } })
    expect(await omniBat(lop.env, 'S1')).toBe(true)
    expect(await omniBat(lop.env, 'S9')).toBe(false)
    expect(await omniBat(lop.env, 'S9', '12A1')).toBe(true) // lớp truyền vào thắng
    const sbd = dung({ omni: { bat: true, sbd: ['S9'] } })
    expect(await omniBat(sbd.env, 'S9')).toBe(true)
    expect(await omniBat(sbd.env, 'S1')).toBe(false)
  })
  it('lớp lấy từ lopCuaEm (tick bài) trước, lùi về hoc_sinh khi vắng', async () => {
    const { env } = dung({ omni: { bat: true, lop: ['12A1'] } })
    gia.lop.S1 = '12A2'
    expect(await omniBat(env, 'S1')).toBe(false)
    expect(await omniBat(env, 'S2')).toBe(true) // lopCuaEm null ⇒ hoc_sinh.lop = 12A1
  })
  it('lệnh thầy co-luu đổi cờ ⇒ isolate này thấy ngay (xoá đệm 15 s)', async () => {
    const { env } = dung({ omni: null })
    expect(await omniBat(env, 'S1')).toBe(false)
    expect(await gvOmni(env, { action: 'co-luu', co: { bat: true, lop: ['12A1'] } }, T0)).toMatchObject({ ok: true, co: { bat: true, lop: ['12A1'], sbd: [] } })
    expect(await omniBat(env, 'S1')).toBe(true)
    expect(await docCoOmni(env)).toEqual({ bat: true, lop: ['12A1'], sbd: [] })
    expect(await gvOmni(env, { action: 'co-doc' })).toEqual({ ok: true, co: { bat: true, lop: ['12A1'], sbd: [] } })
  })
})

// ---------------------------------------------------------------- đọc sổ
describe('đọc sổ ⇒ SuKienOmni', () => {
  it('y, ms, tt, td, qid gốc (song sinh), phần theo kho / đuôi mã; lướt GIỮ (lõi lọc), dòng ca chưa công bố BỎ', async () => {
    const { d, env } = dung()
    themCau(d, 'Q2', { phan: 'II', dang: 'D2' })
    themCau(d, 'Q1')
    await ghiSuKien(env, [
      sk('S1', 'Q2', T0 - 3_600_000, 1, { raw: { chon: 'DSDS', ms: 42_000, tt: 'chua_chac', td: 'troi_chay' }, subitem: [1, 0, 1, null] }),
      sk('S1', 'Q1~ss0', T0 - 3_000_000, 0, { raw: { chon: 'A', ms: 2_000, tt: 'chac', td: 'luot' } }),
      sk('S1', 'Q1', T0 - 2_000_000, null, { purpose: 'luot' }),
      sk('S1', 'Q1', T0 - 1_000_000, 1, { nguon: 'thi', maNguon: 'CA9', visibility: 'embargoed' }),
      sk('S1', 'DE9-III-2', T0 - 500_000, 1, { nguon: 'thi', maNguon: 'CA8', assistance: 'assisted' }),
    ])
    const ds = (await docSuKienOmni(env, ['S1'])).get('S1')!
    expect(ds.map((e) => e.qid)).toEqual(['Q2', 'Q1', 'Q1', 'DE9-III-2'])
    expect(ds[0]).toMatchObject({ phan: 'II', maDang: 'D2', y: [1, 0, 1, null], msLam: 42_000, tuTin: 'chua_chac', nhanTocDo: 'troi_chay', ketQua: 1, songSinh: false, contentGroup: 'g-Q2', ngayVn: '2026-10-05' })
    expect(ds[1]).toMatchObject({ songSinh: true, ketQua: 0, msLam: 2_000, tuTin: 'chac', nhanTocDo: 'luot', y: null, phan: 'I' })
    expect(ds[2]).toMatchObject({ purpose: 'luot', ketQua: null })
    expect(ds[3]).toMatchObject({ phan: 'III', assistance: 'assisted', maDang: null })
    expect(ds.every((e, i) => i === 0 || e.receivedAt >= ds[i - 1]!.receivedAt)).toBe(true)
    // lõi (giả) bỏ lướt khỏi quan sát nhưng đếm lượt lướt hôm nay
    const hs = await hoSoOmniEm(env, 'S1', T0)
    expect(hs.luotHomNay).toBe(1)
    expect(await soLuotHomNay(env, 'S1', T0)).toBe(1)
    expect(await soLuotHomNay(env, 'S1', T0 + NGAY)).toBe(0)
  })
  it('kết quả từng ý / raw lạ ⇒ null (không bịa)', () => {
    expect(docYTuSubitem('{"y":[1,1,0,0]}')).toEqual([1, 1, 0, 0])
    expect(docYTuSubitem([true, false, null, 1])).toEqual([1, 0, null, 1])
    expect(docYTuSubitem('[1,0]')).toBeNull()
    expect(docYTuSubitem('[1,"x",0,1]')).toBeNull()
    expect(docYTuSubitem('khong-phai-json')).toBeNull()
    expect(docYTuSubitem(null)).toBeNull()
    expect(docRawOmni('{"ms":900001,"tt":"x","td":"cham"}')).toEqual({ msLam: null, tuTin: null, nhanTocDo: 'cham' })
    expect(docRawOmni({ ms: '1500', tt: 'chac' })).toEqual({ msLam: 1500, tuTin: 'chac', nhanTocDo: null })
    expect(docRawOmni('hỏng')).toEqual({ msLam: null, tuTin: null, nhanTocDo: null })
  })
  it('mốc cắt (ảnh chụp đêm): chỉ dòng TIẾP NHẬN trước mốc; bài của câu theo phạm vi đã dạy', async () => {
    const { d, env } = dung()
    themCau(d, 'Q1', { maDe: 'DH-B6' })
    gia.phamVi.S1 = { lop: '12A1', maDe: new Set(['DH-B6']), baiTheoMaDe: new Map([['DH-B6', { khoaBai: 'B6', tenBai: 'Bài 6', viTri: 6 }]]), baiDaTick: [] }
    await ghiSuKien(env, [sk('S1', 'Q1', T0 - 2 * NGAY, 1), sk('S1', 'Q1', T0, 0)])
    const truoc = (await docSuKienOmni(env, ['S1'], { truocMs: T0 - NGAY })).get('S1')!
    expect(truoc).toHaveLength(1)
    expect(truoc[0]!.khoaBai).toBe('B6')
    await hoSoOmniEm(env, 'S1', T0)
    expect(gia.goi.at(-1)!.dv.baiCuaQid?.get('Q1')).toBe('B6')
  })
  it('D1 cũ thiếu cột CNH-1.0 ⇒ lùi câu SQL cũ, vẫn đọc được', async () => {
    const { d, env } = dung()
    d.sql.exec('DROP TABLE su_kien_hoc')
    d.sql.exec('CREATE TABLE su_kien_hoc (khoa TEXT PRIMARY KEY, sbd TEXT NOT NULL, qid TEXT NOT NULL, nguon TEXT NOT NULL, ma_nguon TEXT NOT NULL, lan INTEGER NOT NULL DEFAULT 1, ket_qua INTEGER, giay INTEGER, luc TEXT NOT NULL, ngay_vn TEXT NOT NULL, ma_dang TEXT, chuyen_de TEXT, muc_do TEXT)')
    d.sql.prepare("INSERT INTO su_kien_hoc VALUES ('k1','S1','Q1~ss1','game','p',1,1,NULL,?,?, 'D1', NULL, NULL)").run(new Date(T0).toISOString(), '2026-10-05')
    const ds = (await docSuKienOmni(env, ['S1'])).get('S1')!
    expect(ds).toHaveLength(1)
    expect(ds[0]).toMatchObject({ qid: 'Q1', songSinh: true, ketQua: 1, assistance: 'none', purpose: null, receivedAt: T0, maDang: 'D1' })
  })
})

// ---------------------------------------------------------------- ma trận Q
describe('qCuaCau — thầy > A.I gợi (omni_q goi_y) > goiYQ từ nhãn kho > mặc định; không thiếu khoá', () => {
  it('ưu tiên đúng và giữ khoá đã hỏi (kể cả song sinh, câu ngoài kho)', async () => {
    const { d, env } = dung()
    await damBaoBangOmni(env)
    for (const q of ['Q1', 'Q2', 'Q4']) themCau(d, q, { kienThuc: q === 'Q4' ? ['Cân bằng phương trình'] : [] })
    themCau(d, 'Q3', { phan: 'II', dang: 'D3' })
    const st = d.sql.prepare('INSERT INTO omni_q(qid,y,vkn_json,nguon,duyet_luc) VALUES(?,?,?,?,?)')
    st.run('Q1', -1, '["D1#1"]', 'thay', 'x')
    st.run('Q1', 0, '["D1#9"]', 'goi_y', null)
    st.run('Q2', -1, '["dang:D1","nen:can_bang_phuong_trinh"]', 'goi_y', null)
    for (let y = 0; y < 4; y++) st.run('Q3', y, JSON.stringify([`D3#${y}`]), 'thay', 'x')
    const q = await qCuaCau(env, ['Q1', 'Q2', 'Q3', 'Q4', 'Q2~ss1', 'NGOAI-KHO-III-1'])
    expect([...q.keys()]).toEqual(['Q1', 'Q2', 'Q3', 'Q4', 'Q2~ss1', 'NGOAI-KHO-III-1'])
    expect(q.get('Q1')).toMatchObject({ vkn: ['D1#1'], nguon: 'thay' })
    expect(q.get('Q1')!.vknY).toBeUndefined()
    expect(q.get('Q2')).toMatchObject({ vkn: ['dang:D1', 'nen:can_bang_phuong_trinh'], nguon: 'goi_y', maDang: 'D1' })
    expect(q.get('Q3')).toMatchObject({ phan: 'II', nguon: 'thay', vkn: ['D3#0', 'D3#1', 'D3#2', 'D3#3'], vknY: [['D3#0'], ['D3#1'], ['D3#2'], ['D3#3']] })
    expect(q.get('Q2~ss1')!.qid).toBe('Q2')
    expect(q.get('NGOAI-KHO-III-1')).toMatchObject({ qid: 'NGOAI-KHO-III-1', phan: 'III', nguon: 'mac_dinh' })
    for (const v of q.values()) expect(v.vkn.length).toBeGreaterThan(0)
    // câu chưa có dòng omni_q ⇒ goiYQ nhận nhãn kho của câu
    const goi = gia.goiYQ as { cau: { qid: string; kienThuc?: string[]; maDang: string | null }; danhMucNen: unknown }[]
    expect(goi.map((x) => x.cau.qid)).toEqual(['Q4'])
    expect(goi[0]!.cau).toMatchObject({ kienThuc: ['Cân bằng phương trình'], maDang: 'D1', phan: 'I' })
    expect(goi[0]!.danhMucNen).toBe(TEN_NEN) // nhãn nền ⇒ vi kỹ năng nen:<nhãn> theo danh mục TEN_NEN
  })
  it('thầy duyệt (q-duyet) ⇒ đệm Q bỏ ngay, câu chuyển sang nguồn thầy', async () => {
    const { d, env } = dung()
    themCau(d, 'Q4')
    expect((await qCuaCau(env, ['Q4'])).get('Q4')!.nguon).toBe('mac_dinh')
    expect(await gvOmni(env, { action: 'q-duyet', ds: [{ qid: 'Q4', vkn: ['dang:D1', 'nen:bao_toan_khoi_luong'] }] }, T0)).toMatchObject({ ok: true, daDuyet: 1 })
    expect((await qCuaCau(env, ['Q4'])).get('Q4')).toMatchObject({ nguon: 'thay', vkn: ['dang:D1', 'nen:bao_toan_khoi_luong'] })
  })
})

describe('vknTheoId — omni_vkn trước; dang:/nen: tổng hợp', () => {
  it('đủ khoá, tên dạng từ kho, tên nền từ TEN_NEN', async () => {
    const { d, env } = dung()
    await damBaoBangOmni(env)
    themCau(d, 'Q1', { tenDang: 'Este — gọi tên' })
    d.sql.prepare("INSERT INTO omni_vkn(id,ma_dang,ten,ten_loi,nhan_nen,thu_tu) VALUES('D1#1','D1','Đếm C','đếm sai C',NULL,1)").run()
    const v = await vknTheoId(env, ['D1#1', 'dang:D1', 'nen:can_bang_phuong_trinh', 'nen:la_lam', 'cd:ESTER', 'la'])
    expect(v.get('D1#1')).toMatchObject({ ten: 'Đếm C', tenLoi: 'đếm sai C', maDang: 'D1' })
    expect(v.get('dang:D1')).toMatchObject({ ten: 'Este — gọi tên', maDang: 'D1' })
    const ten = TEN_NEN.can_bang_phuong_trinh!
    expect(v.get('nen:can_bang_phuong_trinh')).toMatchObject({ ten, tenLoi: ten.toLocaleLowerCase('vi'), nhanNen: 'can_bang_phuong_trinh', maDang: '' })
    expect(v.get('nen:la_lam')).toMatchObject({ ten: 'la_lam', nhanNen: 'la_lam' })
    expect(v.get('cd:ESTER')!.ten).toBe('ESTER')
    expect(v.get('la')!.ten).toBe('la')
  })
})

// ---------------------------------------------------------------- hồ sơ (phát lại)
async function ghiLop(env: Env, d: D1That) {
  themCau(d, 'Q1'); themCau(d, 'Q2'); themCau(d, 'Q3', { dang: 'D2' })
  const ds: SuKien[] = []
  LOP1.forEach((s, i) => {
    for (let k = 0; k <= i; k++) ds.push(sk(s, 'Q1', T0 - (3 + k) * NGAY, k % 2 ? 0 : 1))
    ds.push(sk(s, 'Q3', T0 - 2 * NGAY + i, 1))
  })
  ds.push(sk('S1', 'Q2', T0 - 3_600_000, 1, { raw: { ms: 30_000 } })) // hôm nay
  await ghiSuKien(env, ds)
}
describe('hoSoOmniEm — phát lại sổ + Q + β + xác nhận + prior lớp', () => {
  it('đầu vào của phatLaiEm: sự kiện đã sắp, Q đủ khoá, β câu có thời lượng, xác nhận thầy, hôm nay', async () => {
    const { d, env } = dung()
    await ghiLop(env, d)
    await damBaoBangOmni(env)
    d.sql.prepare("INSERT INTO omni_beta_cau(qid,beta,n,cap_nhat_luc) VALUES('Q2',10.3,9,'x'),('Q1',9.9,9,'x')").run()
    await gvOmni(env, { action: 'xac-nhan', sbd: 'S1', maDang: 'D2', ket: 'vung' }, T0 - 1000)
    await hoSoOmniEm(env, 'S1', T0)
    const g = gia.goi.filter((x) => x.sbd === 'S1' && x.dv.p0 && x.dv.homNay === '2026-10-05').at(-1)!
    expect(g.dv.suKien.map((e) => e.qid)).toEqual(['Q1', 'Q3', 'Q2'])
    expect([...g.dv.q.keys()].sort()).toEqual(['Q1', 'Q2', 'Q3'])
    expect([...g.dv.beta!.entries()]).toEqual([['Q2', 10.3]]) // chỉ câu có thời lượng trong sổ của em
    expect(g.dv.xacNhan).toMatchObject([{ sbd: 'S1', maDang: 'D2', ket: 'vung' }])
  })
  it('prior lớp = trung bình P THÔ của ≥ 5 bạn cùng lớp đang bật OMNI (không tính chính em); lớp ít hơn ⇒ không prior', async () => {
    const { d, env } = dung()
    await ghiLop(env, d)
    const hs = await hoSoOmniEm(env, 'S1', T0)
    const p0 = gia.goi.find((x) => x.sbd === 'S1' && x.dv.p0 && x.dv.p0.size)!.dv.p0!
    // tự tính: hồ sơ thô (P0, sổ trước 00:00 hôm nay) của S2..S6
    const tho = new Map<string, Map<string, { p: number; n: number }>>()
    for (const g of gia.goi.filter((x) => x.sbd !== 'S1' && !x.dv.p0?.size)) {
      const h = phatLaiGia(g.sbd, g.dv)
      tho.set(g.sbd, new Map(Object.entries(h.vkn).map(([k, v]) => [k, { p: v.p, n: v.nTuLam }])))
    }
    expect([...tho.keys()].sort()).toEqual(['S2', 'S3', 'S4', 'S5', 'S6'])
    expect([...p0.entries()]).toEqual([...gopPrior(tho, 'S1')])
    expect(p0.get('dang:D1')).toBeGreaterThan(0)
    expect(hs.vkn['dang:D1']).toBeDefined()
    // lớp chỉ 1 em đang bật ⇒ không prior lớp
    const { d: d2, env: env2 } = dung({ omni: { bat: true, sbd: ['S1'] } })
    await ghiLop(env2, d2)
    datLaiGia()
    await hoSoOmniEm(env2, 'S1', T0)
    expect(gia.goi.every((x) => !x.dv.p0?.size)).toBe(true)
  })
  it('XOÁ bảng đệm rồi gọi lại ⇒ hồ sơ y hệt; ảnh chụp đêm dựng lại ra y hệt', async () => {
    const { d, env } = dung()
    await ghiLop(env, d)
    const A = await hoSoOmniNhieuEm(env, LOP1, T0)
    await chayOmniDem(env, T0)
    await chayOmniDem(env, T0)
    const anh = { em: d.chup('omni_em'), p: d.chup('omni_p_vkn'), beta: d.chup('omni_beta_cau') }
    expect(d.dem('omni_em')).toBe(LOP1.length + 1) // mọi em đang bật OMNI (S9 lớp khác cũng bật)
    xoaDemOmni()
    const B = await hoSoOmniNhieuEm(env, LOP1, T0) // prior đọc từ ảnh chụp
    expect(JSON.stringify([...B])).toBe(JSON.stringify([...A]))
    d.sql.exec('DELETE FROM omni_em; DELETE FROM omni_p_vkn; DELETE FROM omni_du_bao; DELETE FROM omni_beta_cau')
    xoaDemOmni()
    const C = await hoSoOmniNhieuEm(env, LOP1, T0) // không ảnh chụp ⇒ tính lại cùng mốc cắt
    expect(JSON.stringify([...C])).toBe(JSON.stringify([...A]))
    d.sql.exec(`DELETE FROM cau_hinh WHERE khoa = '${KHOA_CON_TRO_DEM}'`)
    while (!(await chayOmniDem(env, T0)).xong) { /* chạy tới xong */ }
    expect({ em: d.chup('omni_em'), p: d.chup('omni_p_vkn'), beta: d.chup('omni_beta_cau') }).toEqual(anh)
  })
  it('đệm 60 s theo số dòng sổ: gọi lại không đọc sổ; có dòng mới ⇒ phát lại', async () => {
    const { d, env } = dung()
    await ghiLop(env, d)
    await hoSoOmniEm(env, 'S1', T0)
    const n = gia.goi.length
    await hoSoOmniEm(env, 'S1', T0 + 1000)
    expect(gia.goi.length).toBe(n)
    await ghiSuKien(env, [sk('S1', 'Q3', T0 + 2000, 0)])
    const hs = await hoSoOmniEm(env, 'S1', T0 + 3000)
    expect(gia.goi.length).toBeGreaterThan(n)
    expect(hs.vkn['dang:D2']!.nTuLam).toBe(2)
  })
  it('đệm dòng sổ: câu trả lời mới chỉ đọc phần thêm (received_at ≥ mốc); dòng tới muộn mang mốc cũ ⇒ đọc lại cả sổ — kết quả = đọc mới hoàn toàn', async () => {
    const { d, env } = dung()
    await ghiLop(env, d)
    const sql: string[] = []
    const goc = env.DB.prepare.bind(env.DB)
    env.DB.prepare = ((q: string) => { sql.push(q); return goc(q) }) as typeof env.DB.prepare
    await hoSoOmniEm(env, 'S1', T0)
    await ghiSuKien(env, [sk('S1', 'Q3', T0 + 5_000, 0)])
    sql.length = 0
    const moi = await hoSoOmniEm(env, 'S1', T0 + 6_000)
    expect(sql.some((q) => q.includes('received_at >= ?'))).toBe(true)
    expect(sql.filter((q) => q.includes('FROM su_kien_hoc WHERE sbd IN') && !q.includes('received_at >= ?') && !q.includes('COUNT(*)')).length).toBe(0)
    xoaDemOmni()
    expect(JSON.stringify(await hoSoOmniEm(env, 'S1', T0 + 6_000))).toBe(JSON.stringify(moi))
    await ghiSuKien(env, [sk('S1', 'Q2', T0 - 5 * NGAY, 0)]) // tới muộn, mốc tiếp nhận cũ
    sql.length = 0
    const sau = await hoSoOmniEm(env, 'S1', T0 + 7_000)
    expect(sql.some((q) => q.includes('FROM su_kien_hoc WHERE sbd IN') && !q.includes('received_at >= ?') && !q.includes('COUNT(*)'))).toBe(true)
    xoaDemOmni()
    expect(JSON.stringify(await hoSoOmniEm(env, 'S1', T0 + 7_000))).toBe(JSON.stringify(sau))
    expect(sau.vkn['dang:D1']!.nTuLam).toBe(moi.vkn['dang:D1']!.nTuLam + 1)
  })
  it('lỗi đọc ⇒ hồ sơ rỗng (không ném)', async () => {
    const env = { DB: { prepare() { throw new Error('D1 hỏng') }, batch() { throw new Error('D1 hỏng') } } } as unknown as Env
    const hs = await hoSoOmniEm(env, 'S1', T0)
    expect(hs).toMatchObject({ sbd: 'S1', vkn: {}, nVung: 0 })
    expect(await omniBat(env, 'S1')).toBe(false)
    expect(await omniChoSanh(env, 'S1', T0, { tong: 0, con: 0, chienDichId: null })).toBeNull()
    expect(await chayOmniDem(env, T0)).toEqual({ soEm: 0, soBeta: 0, xong: false })
  })
  it('kyVongMsCau = msKyVong(β câu, τ em, phần, mức)', async () => {
    const { d, env } = dung()
    await ghiLop(env, d)
    await damBaoBangOmni(env)
    d.sql.prepare("INSERT INTO omni_beta_cau(qid,beta,n,cap_nhat_luc) VALUES('Q1',?,9,'x')").run(Math.log(60_000))
    const hs = await hoSoOmniEm(env, 'S1', T0)
    expect(await kyVongMsCau(env, 'S1', { qid: 'Q1~ss0', phan: 'I', mucDo: 'Thông hiểu' }, T0)).toBe(msKyVong(Math.log(60_000), hs.tau, 'I', 'Thông hiểu'))
    expect(await kyVongMsCau(env, 'S1', { qid: 'Q9', phan: 'III', mucDo: null }, T0)).toBe(msKyVong(null, hs.tau, 'III', null))
  })
})

// ---------------------------------------------------------------- nhật ký
describe('nhatKyHomNay — 2–5 dòng sự thật bằng số', () => {
  it('số câu/đúng, vi kỹ năng lên nhiều nhất, câu nền, đúng nhưng chậm; không làm gì ⇒ []', async () => {
    const { d, env } = dung()
    themCau(d, 'Q1'); themCau(d, 'Q2'); themCau(d, 'Q3', { dang: 'D2' })
    expect(await nhatKyHomNay(env, 'S1', T0)).toEqual([])
    await ghiSuKien(env, [
      sk('S1', 'Q1', T0 - 2 * NGAY, 0),
      sk('S1', 'Q1', T0 - 3_600_000, 1),
      sk('S1', 'Q2', T0 - 3_000_000, 1, { raw: { ms: 400_000, td: 'cham' } }),
      sk('S1', 'Q3', T0 - 2_000_000, 0),
      sk('S1', 'Q3', T0 - 1_000_000, 1), // lần làm lại cùng ngày không đổi "đúng"
      sk('S1', 'N1', T0 - 900_000, 1, { nguon: 'nen' }),
      sk('S1', 'Q2', T0 - 800_000, null, { purpose: 'luot' }),
    ])
    const dong = await nhatKyHomNay(env, 'S1', T0)
    expect(dong.length).toBeGreaterThanOrEqual(2)
    expect(dong.length).toBeLessThanOrEqual(5)
    expect(dong[0]).toBe('Hôm nay em làm 4 câu, đúng 3 câu.')
    expect(dong.some((x) => /^Dạng D1: \d,\d\d → \d,\d\d \(2 câu\)$/.test(x))).toBe(true)
    expect(dong).toContain('Câu nền làm đúng hôm nay: 1 câu.')
    expect(dong.some((x) => x.startsWith('Đúng nhưng chậm: 1 câu'))).toBe(true)
    expect(dong.join(' ')).not.toMatch(/yếu|kém|giỏi/i)
  })
})

// ---------------------------------------------------------------- Sảnh
async function chienDich(env: Env, ten: string, maDe: string[], hanNop: string, ms: number, lop = '12A1') {
  const r = await import('../server/src/srs2-gv').then((m) => m.gvChienDich(env, { action: 'tao', ten, lop, maDe, hanNop }, ms))
  expect(r.ok).toBe(true)
  return String(r.id ?? r.chienDichId ?? '')
}
describe('omniChoSanh — phần OMNI thêm vào hoa2-sanh', () => {
  it('cờ tắt ⇒ null', async () => {
    const { env } = dung({ omni: null })
    expect(await omniChoSanh(env, 'S1', T0, { tong: 10, con: 0, chienDichId: null })).toBeNull()
  })
  it('đủ trường SanhOmni: bài đang luyện (hạn gần trước), dạng vững, sơ ý, vé, đề thử, chế độ chờ', async () => {
    const { d, env } = dung()
    themCau(d, 'A1', { maDe: 'DEA' }); themCau(d, 'A2', { maDe: 'DEA', dang: 'D2' })
    themCau(d, 'B1', { maDe: 'DEB', dang: 'D3' })
    await chienDich(env, 'Bài 7', ['DEB'], '2026-10-20', T0 - 2 * NGAY)
    await chienDich(env, 'Bài 6', ['DEA'], '2026-10-12', T0 - 6 * NGAY)
    await damBaoBangOmni(env)
    d.sql.prepare("INSERT INTO omni_ve(sbd,tuan,da_dung,cap_nhat_luc) VALUES('S1','2026-10-05',1,'x')").run()
    gia.ghiDe.S1 = hsGia('S1', { nVung: 12, sEm: 0.05 })
    const r = (await omniChoSanh(env, 'S1', T0, { tong: 30, con: 5, chienDichId: null, onBaiCu: 4, cheDoCho: false }))!
    expect(Object.keys(r).sort()).toEqual(['baiDangLuyen', 'bat', 'chungChi', 'choBaiMoi', 'conDangDe8', 'dangVung', 'deThu', 'metGio', 'nhatKy', 'onBaiCu', 'sEm', 'sMucTieu', 've'].sort())
    expect(r.bat).toBe(true)
    expect(r.baiDangLuyen.map((b) => b.ten)).toEqual(['Bài 6', 'Bài 7'])
    expect(r.dangVung).toEqual({ a: 0, b: 2 })
    expect(r.conDangDe8).toBeNull() // chưa đủ quan sát
    expect(r.sEm).toBe(0.05)
    expect(r.sMucTieu).toBe(THAM_SO_OMNI.C_SO_Y)
    expect(r.ve).toEqual({ con: 1, tong: 2 })
    expect(r).toMatchObject({ choBaiMoi: false, onBaiCu: 4, metGio: null, nhatKy: null, chungChi: [] })
    expect(r.deThu).toEqual({ duoc: true, soCau: 14, phut: 25 }) // Bài 6 giao ngày 29/09 ⇒ hôm nay ngày 7
    d.sql.prepare("INSERT INTO omni_de_thu(id,sbd,qid_json,tao_luc,het_luc) VALUES('dt1','S1','[]',?,?)").run(new Date(T0 - 60_000).toISOString(), new Date(T0).toISOString())
    gia.ghiDe.S1 = hsGia('S1', { nVung: 3, sEm: 0.05 })
    xoaDemOmni()
    const r2 = (await omniChoSanh(env, 'S1', T0, { tong: 30, con: 5, chienDichId: null, cheDoCho: true }))!
    expect(r2.deThu.duoc).toBe(false)
    expect(r2.sEm).toBeNull() // < 10 lượt vững
    expect(r2.choBaiMoi).toBe(true)
  })
  it('dạng vững + còn N dạng để chạm 8 + hồ sơ mệt + nhật ký khi xong kế hoạch', async () => {
    const { d, env } = dung()
    themCau(d, 'A1', { maDe: 'DEA' }); themCau(d, 'A2', { maDe: 'DEA', dang: 'D2' })
    await chienDich(env, 'Bài 6', ['DEA'], '2026-10-12', T0 - 2 * NGAY)
    const ds: SuKien[] = []
    for (let k = 0; k < 12; k++) ds.push(sk('S1', 'A1', T0 - (k + 1) * NGAY + 60_000, 1))
    ds.push(sk('S1', 'A2', T0 - 3_600_000, 0))
    await ghiSuKien(env, ds)
    gia.metGio = { khung: '20_22', tiLe: 0.3, tiLeTot: 0.1, kichHoat: true }
    const r = (await omniChoSanh(env, 'S1', T0, { tong: 3, con: 0, chienDichId: null }))!
    expect(r.dangVung).toEqual({ a: 1, b: 2 })
    expect(r.conDangDe8).toBe(1)
    expect(r.metGio).toEqual({ khung: '20_22', tiLe: 0.3, tiLeTot: 0.1, coTheDoi: false })
    expect(r.nhatKy?.[0]).toBe('Hôm nay em làm 1 câu, đúng 0 câu.')
  })
})

// ---------------------------------------------------------------- phụ huynh
describe('omniChoPh + /ph/hoc-2', () => {
  it('cờ OMNI tắt ⇒ /ph/hoc-2 KHÔNG có khoá omni (y hệt trước)', async () => {
    const { d, env } = dung({ omni: null })
    themCau(d, 'A1', { maDe: 'DEA' })
    await chienDich(env, 'Bài 6', ['DEA'], '2026-10-12', T0 - 2 * NGAY)
    const r = await phHoc2(env, { sbd: 'S1' }, T0)
    expect(r.cheDo2).toBe(true)
    expect('omni' in r).toBe(false)
    expect(await omniChoPh(env, 'S1', T0)).toBeNull()
  })
  it('cờ bật ⇒ omni: PhOmni đủ trường; chưa hiệu chuẩn ⇒ khoảng cách null; cần thầy chữa = cắt tỉa + thẻ nút thắt chờ', async () => {
    const { d, env } = dung()
    themCau(d, 'A1', { maDe: 'DEA' }); themCau(d, 'A2', { maDe: 'DEA', dang: 'D2' })
    await chienDich(env, 'Bài 6', ['DEA'], '2026-10-12', T0 - 6 * NGAY)
    const ds: SuKien[] = []
    for (let k = 0; k < 4; k++) ds.push(sk('S1', 'A2', T0 - (5 - k) * NGAY + 10 * 3_600_000, 0)) // 20:00 VN ⇒ khung 20–22
    for (let k = 0; k < 8; k++) ds.push(sk('S1', 'A1', T0 - (5 - k % 5) * NGAY + 10 * 3_600_000 + k, 1))
    await ghiSuKien(env, ds)
    d.sql.prepare("INSERT INTO nut_that(id,sbd,qid,bam,buoc,gui_luc,ngay_vn,trang_thai,cap_nhat_luc) VALUES('n1','S1','A1','b',2,'x','2026-10-04','cho','x'),('n2','S1','A2','b',1,'x','2026-10-04','da_go','x')").run()
    const r = await phHoc2(env, { sbd: 'S1' }, T0)
    const o = r.omni as Record<string, unknown>
    expect(Object.keys(o).sort()).toEqual(['canThayChua', 'chungChi', 'dangCanVung', 'gioHoc', 'hieuChuan', 'khoangCach8', 'sEm'].sort())
    expect(o.khoangCach8).toBeNull()
    expect(o.hieuChuan).toEqual({ soCaChot: 0, du: false })
    expect(o.dangCanVung).toEqual(['Dạng D1', 'Dạng D2'].filter((x) => (o.dangCanVung as string[]).includes(x)))
    expect((o.dangCanVung as string[]).length).toBeGreaterThan(0)
    expect(o.sEm).toBeNull()
    expect(o.gioHoc).toBe('20:00–22:00')
    expect(o.canThayChua).toBe(2) // A2 cắt tỉa (sai 4 lần) + 1 thẻ nút thắt đang chờ
    expect(o.chungChi).toEqual([])
  })
  it('đủ 3 ca chốt, sai số ≤ 0,6 ⇒ hiệu chuẩn đủ, khoảng cách tới 8 bằng số', async () => {
    const { d, env } = dung()
    themCau(d, 'A1', { maDe: 'DEA' })
    await chienDich(env, 'Bài 6', ['DEA'], '2026-10-12', T0 - 6 * NGAY)
    const ds: SuKien[] = []
    for (let k = 0; k < 12; k++) ds.push(sk('S1', 'A1', T0 - (k + 1) * NGAY, 1))
    await ghiSuKien(env, ds)
    await damBaoBangOmni(env)
    for (const [i, ma] of ['CA1', 'CA2', 'CA3'].entries()) {
      d.sql.prepare('INSERT INTO ca(ma_ca,ten_ca,trang_thai,loai,cong_bo,cap_nhat_luc) VALUES(?,?,?,?,?,?)').run(ma, ma, 'dong', 'thi', 'ngay', 'x')
      d.sql.prepare("INSERT INTO luot(khoa,ma_ca,sbd,lan_thu,vao_luc,nop_luc,trang_thai,cap_nhat_luc,tong) VALUES(?,?,?,1,'x',?,'da_nop','x',?)").run(`${ma}|S2|1`, ma, 'S2', `2026-10-0${i + 1}T08:00:00.000Z`, 7 + i * 0.5)
      d.sql.prepare("INSERT INTO omni_du_bao(sbd,pham_vi,ky_vong,p8,sai_so,s_dung,so_bang_chung,luc) VALUES('S2',?,?,0.5,0.5,0.08,20,'x')").run(`ca_chot:${ma}`, 7.2 + i * 0.5)
    }
    const o = (await omniChoPh(env, 'S1', T0))!
    expect(o.hieuChuan).toEqual({ soCaChot: 3, du: true })
    expect(typeof o.khoangCach8).toBe('number')
  })
})

// ---------------------------------------------------------------- chứng chỉ
describe('capNhatChungChi — K∧C∧M (hồ sơ) + T (điểm ca chốt đã công bố) ⇒ chỉ-thêm', () => {
  it('đạt ⇒ một dòng (cap_luc = lúc nộp, điểm, mã ca); chạy lại không thêm; ca chưa công bố ⇒ chưa xét', async () => {
    const { d, env } = dung()
    themCau(d, 'A1', { maDe: 'DEA' })
    const id = await chienDich(env, 'Bài 6', ['DEA'], '2026-10-12', T0 - 6 * NGAY)
    for (const [ma, cb] of [['CC1', 'ngay'], ['CC2', 'khong']] as const) d.sql.prepare('INSERT INTO ca(ma_ca,ten_ca,trang_thai,loai,cong_bo,cap_nhat_luc) VALUES(?,?,?,?,?,?)').run(ma, ma, 'dong', 'thi', cb, 'x')
    const luot = (ma: string, s: string, tong: number, lan = 1, nop = '2026-10-04T09:00:00.000Z') =>
      d.sql.prepare("INSERT INTO luot(khoa,ma_ca,sbd,lan_thu,vao_luc,nop_luc,trang_thai,cap_nhat_luc,tong) VALUES(?,?,?,?,'x',?,'da_nop','x',?)").run(`${ma}|${s}|${lan}`, ma, s, lan, nop, tong)
    luot('CC1', 'S1', 8.5); luot('CC1', 'S1', 9.5, 2); luot('CC1', 'S2', 7); luot('CC2', 'S3', 9)
    expect(await gvOmni(env, { action: 'gan-ca-chot', chienDichId: id, maCa: 'CC1' }, T0)).toMatchObject({ ok: true, daGan: true })
    expect(await gvOmni(env, { action: 'gan-ca-chot', chienDichId: id, maCa: 'CC2' }, T0)).toMatchObject({ ok: true })
    expect(await capNhatChungChi(env, id, T0)).toMatchObject({ ok: true, daCap: 1 })
    const rows = d.sql.prepare('SELECT sbd, chien_dich_id, cap_luc, diem_ca_chot, ma_ca FROM omni_chung_chi').all()
    expect(rows).toEqual([{ sbd: 'S1', chien_dich_id: id, cap_luc: '2026-10-04T09:00:00.000Z', diem_ca_chot: 8.5, ma_ca: 'CC1' }])
    expect(await capNhatChungChi(env, id, T0 + 1000)).toMatchObject({ ok: true, daCap: 0 })
    const sanh = (await omniChoSanh(env, 'S1', T0, { tong: 1, con: 1, chienDichId: id }))!
    expect(sanh.chungChi).toEqual([{ ten: 'Bài 6', doTin: expect.any(Number), ngay: '2026-10-04' }])
    expect(await capNhatChungChi(env, 'KHONG-CO', T0)).toMatchObject({ ok: false })
  })
})

// ---------------------------------------------------------------- việc đêm
describe('chayOmniDem — β + ảnh chụp theo lô ≤ 40 em, idempotent theo ngày, không ném', () => {
  it('cờ tắt ⇒ xong ngay, không ghi bảng đệm', async () => {
    const { d, env } = dung({ omni: null })
    expect(await chayOmniDem(env, T0)).toEqual({ soEm: 0, soBeta: 0, xong: true })
    expect(d.dem("sqlite_master", "name = 'omni_em'")).toBe(1) // bảng có sẵn từ migration trong D1 giả
    expect(d.dem('omni_em')).toBe(0)
  })
  it('lô 40 em/lượt, con trỏ, xong thì lượt sau cùng ngày không làm gì; β đủ ≥ 8 mẫu đúng tự làm có thời lượng', async () => {
    const { d, env } = dung()
    themCau(d, 'Q1')
    const st = d.sql.prepare('INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES(?,?,?,?,?)')
    for (let i = 10; i < 49; i++) st.run(`T${i}`, `Em ${i}`, '12A3', 'mk', 'x')
    const ds: SuKien[] = []
    for (let i = 0; i < 9; i++) ds.push(sk(LOP1[i % 6]!, i < 6 ? 'Q1' : 'Q1~ss1', T0 - NGAY - i * 1000, 1, { raw: { ms: 20_000 + i * 1000 } }))
    ds.push(sk('S1', 'Q1', T0 - NGAY + 5000, 1, { raw: { ms: 99_000 }, assistance: 'assisted' })) // có hỗ trợ ⇒ không vào β
    ds.push(sk('S2', 'Q1', T0 - NGAY + 6000, 0, { raw: { ms: 1_000 } })) // sai ⇒ không vào β
    await ghiSuKien(env, ds)
    const r1 = await chayOmniDem(env, T0)
    expect(r1).toMatchObject({ soEm: 40, soBeta: 1, xong: false })
    expect(gia.beta).toEqual([[20_000, 21_000, 22_000, 23_000, 24_000, 25_000, 26_000, 27_000, 28_000]])
    expect(d.dem('omni_beta_cau')).toBe(1)
    const r2 = await chayOmniDem(env, T0 + 60_000) // lô cuối + chứng chỉ trong cùng lượt
    expect(r2).toEqual({ soEm: 6, soBeta: 0, xong: true })
    expect(d.dem('omni_em')).toBe(46)
    expect(d.dem('omni_em', `cap_nhat_luc = '2026-10-04T17:00:00.000Z'`)).toBe(46) // dấu = 00:00 VN ngày chụp
    expect(JSON.parse((d.sql.prepare(`SELECT gia_tri FROM cau_hinh WHERE khoa = '${KHOA_CON_TRO_DEM}'`).get() as { gia_tri: string }).gia_tri)).toMatchObject({ ngay: '2026-10-05', xong: true })
    expect(await chayOmniDem(env, T0 + 120_000)).toEqual({ soEm: 0, soBeta: 0, xong: true })
    expect(await chayOmniDem(env, T0 + 180_000)).toEqual({ soEm: 0, soBeta: 0, xong: true })
    // ngày mới ⇒ chạy lại từ đầu
    expect((await chayOmniDem(env, T0 + NGAY)).soEm).toBe(40)
  })
})

// ---------------------------------------------------------------- hiệu chỉnh tuần
describe('hieuChinhOmniTuan', () => {
  it('S0 gộp từ lượt vững trong ràng buộc, T theo dạng, ghi tham số + v2_hieu_chinh; một lần mỗi tuần', async () => {
    const { d, env } = dung()
    await damBaoBangOmni(env)
    const st = d.sql.prepare("INSERT INTO omni_em(sbd,n_vung,n_sai_vung,s_uoc,phien_ban,cap_nhat_luc) VALUES(?,?,?,0.08,?,'x')")
    LOP1.forEach((s) => st.run(s, 50, 3, PHIEN_BAN_OMNI))
    const r = await hieuChinhOmniTuan(env, T0)
    expect(r).toMatchObject({ ok: true, tuan: 'omni:2026-10-05', nVung: 300, nSaiVung: 18 })
    expect(r.S0 as number).toBeGreaterThan(0)
    expect(r.S0 as number).toBeLessThan(0.5)
    expect(r.S0).toBeCloseTo((18 + 0.08 * 50) / 350, 4)
    const ts = thamSoTu((d.sql.prepare("SELECT gia_tri FROM cau_hinh WHERE khoa = 'omni_tham_so'").get() as { gia_tri: string }).gia_tri)
    expect(ts.S0).toBeCloseTo(r.S0 as number, 6)
    expect(d.dem('v2_hieu_chinh', "tuan = 'omni:2026-10-05'")).toBe(1)
    expect(await hieuChinhOmniTuan(env, T0 + 3 * NGAY)).toMatchObject({ ok: true, boQua: 'da_chay' })
  })
  it('uocTTheoDang: tỉ lệ sai ⇒ đúng ở lượt kế, kẹp [T_MIN, T_MAX], dạng < 30 lượt sai không đề xuất', () => {
    const qs: { sbd: string; maDang: string; dung: boolean; thuTu: number }[] = []
    let t = 0
    for (let e = 0; e < 40; e++) { qs.push({ sbd: `E${e}`, maDang: 'D1', dung: false, thuTu: t++ }); qs.push({ sbd: `E${e}`, maDang: 'D1', dung: e % 4 === 0, thuTu: t++ }) }
    for (let e = 0; e < 5; e++) { qs.push({ sbd: `E${e}`, maDang: 'D2', dung: false, thuTu: t++ }); qs.push({ sbd: `E${e}`, maDang: 'D2', dung: true, thuTu: t++ }) }
    const r = uocTTheoDang(qs)
    expect(r.theoDang).toEqual({ D1: 0.25 })
    expect(r.chung).toBeNull() // 45 lượt sai < 100
    expect(uocTTheoDang(Array.from({ length: 200 }, (_, i) => ({ sbd: `E${i >> 1}`, maDang: 'D9', dung: i % 2 === 1, thuTu: i }))).theoDang.D9).toBe(THAM_SO_OMNI.T_MAX)
  })
})

// ---------------------------------------------------------------- hàm thuần
describe('hàm thuần', () => {
  it('thamSoTu: chỉ nhận S0 ∈ (0; 0,5) và T ∈ [T_MIN; T_MAX]', () => {
    expect(thamSoTu(null)).toBe(THAM_SO_OMNI)
    expect(thamSoTu('{"S0":0.6,"T":0.9}')).toBe(THAM_SO_OMNI)
    expect(thamSoTu({ S0: 0.06 })).toMatchObject({ S0: 0.06, T: THAM_SO_OMNI.T })
    expect(thamSoTu({ S0: 0.06, T: 0.2 })).toMatchObject({ S0: 0.06, T: 0.2, K_P_VKN: THAM_SO_OMNI.K_P_VKN })
  })
  it('chiaTheoTiLe + khungTheoPhamVi: tổng giữ nguyên, phần vắng chia cho phần có câu', () => {
    expect(chiaTheoTiLe(14, [18, 4, 6])).toEqual([9, 2, 3])
    expect(chiaTheoTiLe(5, [1, 1])).toEqual([3, 2])
    expect(chiaTheoTiLe(3, [0, 0])).toEqual([0, 0])
    expect(khungTheoPhamVi([{ phan: 'I' }, { phan: 'II' }, { phan: 'III' }])).toEqual({ I: 18, II: 4, III: 6 })
    expect(khungTheoPhamVi([{ phan: 'I' }, { phan: 'I' }, { phan: 'III' }])).toEqual({ I: 21, II: 0, III: 7 })
    expect(khungTheoPhamVi([{ phan: 'I' }])).toEqual({ I: 28, II: 0, III: 0 })
    expect(khungTheoPhamVi([])).toEqual({ I: 18, II: 4, III: 6 })
  })
  it('thuHaiCua + gioHocTu', () => {
    expect(thuHaiCua('2026-10-05')).toBe('2026-10-05')
    expect(thuHaiCua('2026-10-11')).toBe('2026-10-05')
    expect(thuHaiCua('2026-10-12')).toBe('2026-10-12')
    expect(gioHocTu({ khungGio: { truoc18: { n: 2, soY: 0 }, '18_20': { n: 0, soY: 0 }, '20_22': { n: 5, soY: 1 }, '22_24': { n: 5, soY: 0 }, sau24: { n: 0, soY: 0 } } })).toBe('20:00–22:00')
    expect(gioHocTu({ khungGio: { truoc18: { n: 0, soY: 0 }, '18_20': { n: 0, soY: 0 }, '20_22': { n: 0, soY: 0 }, '22_24': { n: 0, soY: 0 }, sau24: { n: 0, soY: 0 } } })).toBeNull()
  })
})
