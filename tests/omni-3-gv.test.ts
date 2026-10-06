// @vitest-environment node
// OMNI 3 · LÀN B2 — LỆNH THẦY `POST /gv/omni` (server/src/omni-gv.ts) trên D1 thật (node:sqlite). Lõi thuần đang STUB ⇒ gắn lõi giả tất định
// (tests/omni-3-d1-gia.ts) để kiểm đường ống: Bảng bài đủ trường + ba loại "Cần thầy chữa", xác nhận dạng, lô Q, ca chốt 50/50, gán ca chốt.
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../server/src/omni-p-vkn', async (goc) => {
  const m = await goc<typeof import('../server/src/omni-p-vkn')>()
  const g = await import('./omni-3-d1-gia')
  return { ...m, phatLaiEm: vi.fn((sbd: string, dv: import('../server/src/omni-p-vkn').DauVaoPhatLai) => { g.gia.goi.push({ sbd, dv }); return g.phatLaiGia(sbd, dv) }) }
})
vi.mock('../server/src/du-bao-diem', async (goc) => ({ ...(await goc<object>()), duBaoDiem: vi.fn((await import('./omni-3-d1-gia')).duBaoGia) }))
vi.mock('../server/src/omni-ke-hoach', async (goc) => ({ ...(await goc<object>()), dangDaVung: vi.fn((await import('./omni-3-d1-gia')).dangDaVungGia) }))
vi.mock('../server/src/omni-chung-chi', async (goc) => ({ ...(await goc<object>()), xetChungChi: vi.fn((await import('./omni-3-d1-gia')).xetChungChiGia) }))
vi.mock('../server/src/bai-da-day', async (goc) => {
  const g = await import('./omni-3-d1-gia')
  return { ...(await goc<object>()), lopCuaEm: vi.fn(async (_e: unknown, sbd: string) => g.gia.lop[sbd] ?? null), phamViCuaEm: vi.fn(async (_e: unknown, sbd: string) => g.gia.phamVi[sbd] ?? null) }
})

import { taoD1That, type D1That } from './_d1-that'
import { datLaiGia, gia } from './omni-3-d1-gia'
import { chonCauCaChot, gopTrangThai, gvOmni, kiemDongDuyet, nenYeuNhat, rutGonDe, vknCotDang, type UngCaChot } from '../server/src/omni-gv'
import { damBaoBangOmni, hoSoOmniEm, qCuaCau } from '../server/src/omni-d1'
import { pAnd } from '../server/src/omni-p-vkn'
import { gvChienDich } from '../server/src/srs2-gv'
import { ghiSuKien, type SuKien } from '../server/src/su-kien-hoc'
import type { BangOmni, HoSoOmniEm, QCau } from '../server/src/omni-kieu'
import type { Env } from '../server/src/kieu'

const T0 = Date.parse('2026-10-05T03:00:00Z') // 10:00 Thứ Hai 05/10/2026 giờ VN
const NGAY = 86_400_000
const LOP1 = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6']

function dung(): { d: D1That; env: Env } {
  const d = taoD1That()
  const st = d.sql.prepare('INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES(?,?,?,?,?)')
  LOP1.forEach((s, i) => st.run(s, `Em ${i + 1}`, '12A1', 'mk', 'x'))
  d.sql.exec(`INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('game_hoa_2','{"bat":true}','x'),('omni','{"bat":true}','x')`)
  return { d, env: d.env as unknown as Env }
}
interface CauTuy { maDe?: string; phan?: 'I' | 'II' | 'III'; dang?: string; tenDang?: string; mucDo?: string; text?: string; reviewed?: boolean; tuLuan?: boolean }
function themCau(d: D1That, qid: string, t: CauTuy = {}) {
  const phan = t.phan ?? 'I', dang = t.dang ?? 'D1'
  const json = { qid, maDe: t.maDe ?? 'DEA', version: 'v1', group: `g-${qid}`, phan, text: t.text ?? `Câu ${qid}`, choices: ['a', 'b', 'c', 'd'], ideas: phan === 'II' ? ['a', 'b', 'c', 'd'] : [],
    dang, tenDang: t.tenDang ?? `Dạng ${dang}`, mucDo: t.mucDo ?? 'Thông hiểu', kienThuc: [], correct: phan === 'II' ? 'DSDS' : phan === 'III' ? '12' : 'B',
    solution: { chot: 'LOI-GIAI-BI-MAT' }, reviewed: t.reviewed ?? true, ...(t.tuLuan ? { tuLuan: true } : {}), hinhAnh: [] }
  d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)').run(t.maDe ?? 'DEA', qid, 'v1', `g-${qid}`, dang, JSON.stringify(json))
}
const sk = (sbd: string, qid: string, ms: number, kq: 0 | 1 | null, t: Partial<SuKien> = {}): SuKien => ({
  nguon: 'game', maNguon: `p-${ms}-${qid}`, sbd, qid, lan: 1, ketQua: kq, luc: new Date(ms).toISOString(), receivedAt: ms, assistance: 'none', ...t,
})
async function taoCd(env: Env, ten: string, maDe: string[], tao = T0 - 6 * NGAY): Promise<string> {
  const r = await gvChienDich(env, { action: 'tao', ten, lop: '12A1', maDe, hanNop: '2026-10-12' }, tao)
  expect(r.ok).toBe(true)
  return String(r.id)
}

beforeEach(() => { datLaiGia(); vi.clearAllMocks() })

// ---------------------------------------------------------------- cài đặt
describe('cau-hinh-doc / cau-hinh-luu', () => {
  it('mặc định 18/4/6 và thể lực trống; lưu hợp lệ đọc lại đúng; sai ⇒ lỗi có chữ, không ghi', async () => {
    const { env } = dung()
    expect(await gvOmni(env, { action: 'cau-hinh-doc' })).toEqual({ ok: true, theLucLop: {}, maTran: { I: 18, II: 4, III: 6 }, macDinh: { theLuc: 40, maTran: { I: 18, II: 4, III: 6 } } })
    expect(await gvOmni(env, { action: 'cau-hinh-luu' }, T0)).toMatchObject({ ok: false })
    expect(await gvOmni(env, { action: 'cau-hinh-luu', theLucLop: { '12A1': 0 } }, T0)).toMatchObject({ ok: false })
    expect(await gvOmni(env, { action: 'cau-hinh-luu', theLucLop: { '12A1': 501 } }, T0)).toMatchObject({ ok: false })
    expect(await gvOmni(env, { action: 'cau-hinh-luu', maTran: { I: 18, II: -1, III: 6 } }, T0)).toMatchObject({ ok: false })
    expect(await gvOmni(env, { action: 'cau-hinh-luu', theLucLop: { '12A1': 45, '12A2': 30 }, maTran: { I: 16, II: 4, III: 8 } }, T0)).toEqual({ ok: true, theLucLop: { '12A1': 45, '12A2': 30 }, maTran: { I: 16, II: 4, III: 8 } })
    expect(await gvOmni(env, { action: 'cau-hinh-doc' })).toMatchObject({ theLucLop: { '12A1': 45, '12A2': 30 }, maTran: { I: 16, II: 4, III: 8 } })
    expect(await gvOmni(env, { action: 'khong-co' })).toMatchObject({ ok: false })
  })
})

// ---------------------------------------------------------------- Bảng bài
async function dungBang() {
  const { d, env } = dung()
  for (const q of ['A1', 'A2', 'A3']) themCau(d, q, { tenDang: 'Este — công thức' })
  themCau(d, 'A4', { dang: 'D2', tenDang: 'Este — thuỷ phân' }); themCau(d, 'A5', { dang: 'D2', tenDang: 'Este — thuỷ phân' }); themCau(d, 'A6', { dang: 'D2', phan: 'III', tenDang: 'Este — thuỷ phân' })
  const id = await taoCd(env, 'Bài 6 · Este', ['DEA'])
  await damBaoBangOmni(env)
  const q = d.sql.prepare("INSERT INTO omni_q(qid,y,vkn_json,nguon) VALUES(?,-1,?,'goi_y')")
  q.run('A1', '["dang:D1","nen:can_bang_phuong_trinh"]'); q.run('A2', '["dang:D1","nen:ti_le_mol_phuong_trinh"]'); q.run('A3', '["dang:D1"]')
  for (const x of ['A4', 'A5', 'A6']) q.run(x, '["dang:D2","nen:bao_toan_khoi_luong"]')
  const ds: SuKien[] = []
  ds.push(sk('S1', 'A2', T0 - 8 * NGAY, 0)) // sai từ trước, rồi 6 ngày đúng liền ⇒ S1 vững dạng D1 (một quan sát/câu/ngày)
  for (let k = 1; k <= 6; k++) ds.push(sk('S1', 'A1', T0 - k * NGAY + 3_600_000, 1))
  ds.push(sk('S2', 'A2', T0 - 2 * NGAY + 7_200_000, 0), sk('S2', 'A2', T0 - NGAY + 7_200_000, 1))
  for (let k = 2; k <= 5; k++) ds.push(sk('S3', 'A5', T0 - k * NGAY + 3_600_000, 0)) // 4 lần sai ⇒ rời kế hoạch
  await ghiSuKien(env, ds)
  d.sql.exec(`INSERT INTO nut_that(id,sbd,qid,bam,buoc,gui_luc,ngay_vn,trang_thai,cap_nhat_luc) VALUES
    ('n1','S1','A2','b',2,'2026-10-04T10:00:00Z','2026-10-04','cho','x'),('n2','S2','A2~ss0','b',2,'2026-10-04T11:00:00Z','2026-10-04','cho','x'),
    ('n3','S4','A3','b',1,'2026-10-04T12:00:00Z','2026-10-04','da_go','x'),('n4','S5','KHAC-1','b',1,'2026-10-04T12:00:00Z','2026-10-04','cho','x')`)
  gia.ghiDe.S2 = (hs: HoSoOmniEm) => ({ ...hs, nVung: 20, nSaiVung: 3, sEm: 0.15 })
  return { d, env, id }
}
describe('bang — BangOmni đủ trường', () => {
  it('học sinh + tên, dạng + tên, ô = P vi kỹ năng dang:<ma> (không nhân nen:*), sơ ý, khoảng cách tới 8, sẵn sàng, hiệu chuẩn', async () => {
    const { env, id } = await dungBang()
    const b = (await gvOmni(env, { action: 'bang', chienDichId: id }, T0)) as unknown as BangOmni
    expect(Object.keys(b).sort()).toEqual(['canThayChua', 'chienDich', 'dang', 'em', 'hieuChuan', 'khoangCach8', 'o', 'sEm', 'sanSang', 'ok'].sort())
    expect(b.chienDich).toEqual({ id, ten: 'Bài 6 · Este', hanNop: '2026-10-12', lop: '12A1' })
    expect(b.em).toEqual(LOP1.map((s, i) => ({ sbd: s, ten: `Em ${i + 1}` })))
    expect(b.dang).toEqual([{ ma: 'D1', ten: 'Este — công thức' }, { ma: 'D2', ten: 'Este — thuỷ phân' }])
    const hs1 = await hoSoOmniEm(env, 'S1', T0)
    expect(b.o.S1!.D1!.p).toBeCloseTo(pAnd(hs1, ['dang:D1']), 4)
    expect(b.o.S1!.D1!.p).not.toBeCloseTo(pAnd(hs1, ['dang:D1', 'nen:can_bang_phuong_trinh']), 3)
    expect(b.o.S1!.D1).toMatchObject({ n: hs1.vkn['dang:D1']!.nTuLam, trangThai: 'vung' })
    expect(b.o.S5!.D2).toMatchObject({ n: 0, trangThai: 'chua_du' })
    expect(b.sEm.S2).toBe(0.15)
    expect(b.sEm.S1).toBeNull() // < 10 lượt vững
    expect(typeof b.khoangCach8.S1).toBe('number') // ≥ 10 quan sát
    expect(b.khoangCach8.S5).toBeNull()
    expect(b.sanSang.S1).toBe(0.2)
    expect(b.sanSang.S5).toBeNull()
    expect(b.hieuChuan).toEqual({ soCaChot: 0, du: false })
  })
  it('Cần thầy chữa đủ BA loại, THỨ TỰ (thầy 06/10): câu rời kế hoạch lên ĐẦU, rồi nút thắt (gom theo câu, kèm nền yếu nhất), rồi sơ ý cao', async () => {
    const { env, id } = await dungBang()
    const b = (await gvOmni(env, { action: 'bang', chienDichId: id }, T0)) as unknown as BangOmni
    expect(b.canThayChua.map((c) => c.loai)).toEqual(['cat_tia', 'nut_that', 'so_y'])
    const [cat, nut, soY] = b.canThayChua
    expect(nut).toMatchObject({ loai: 'nut_that', tieuDe: 'Câu 2 · Este — công thức', soEm: 2, qids: ['A2'], sbd: ['S1', 'S2'], vkn: 'nen:ti_le_mol_phuong_trinh' })
    expect(nut!.phu).toContain('bước 2')
    expect(cat).toMatchObject({ loai: 'cat_tia', tieuDe: 'Câu 5 · Este — thuỷ phân', soEm: 1, qids: ['A5'], sbd: ['S3'] })
    expect(cat!.phu).toContain('4 lần')
    expect(soY).toMatchObject({ loai: 'so_y', soEm: 1, sbd: ['S2'], vkn: 'nen:ti_le_mol_phuong_trinh' })
    expect(soY!.tieuDe.startsWith('Em 2: sơ ý ')).toBe(true)
    expect(soY!.phu).toContain('20 lượt')
    expect(await gvOmni(env, { action: 'bang', chienDichId: 'KHONG-CO' }, T0)).toMatchObject({ ok: false })
  })
  it('xoá bảng đệm omni_* rồi gọi lại ⇒ Bảng bài y hệt (phát lại từ sổ)', async () => {
    const { d, env, id } = await dungBang()
    const a = await gvOmni(env, { action: 'bang', chienDichId: id }, T0)
    d.sql.exec('DELETE FROM omni_em; DELETE FROM omni_p_vkn; DELETE FROM omni_du_bao; DELETE FROM omni_beta_cau')
    const { xoaDemOmni } = await import('../server/src/omni-d1')
    xoaDemOmni()
    expect(await gvOmni(env, { action: 'bang', chienDichId: id }, T0)).toEqual(a)
  })
})
describe('hàm thuần của Bảng bài', () => {
  const q = (qid: string, maDang: string, vkn: string[]): QCau => ({ qid, phan: 'I', maDang, mucDo: null, vkn, nguon: 'goi_y' })
  it('vknCotDang: dang:<ma> khi có; không thì mọi vi kỹ năng của dạng', () => {
    expect(vknCotDang([q('a', 'D1', ['dang:D1', 'nen:x']), q('b', 'D1', ['nen:y'])], 'D1')).toEqual(['dang:D1'])
    expect(vknCotDang([q('a', 'D1', ['D1#2', 'D1#1'])], 'D1')).toEqual(['D1#1', 'D1#2'])
    expect(vknCotDang([], 'D9')).toEqual(['dang:D9'])
  })
  it('gopTrangThai + nenYeuNhat', () => {
    expect(gopTrangThai(['vung', 'vung'])).toBe('vung')
    expect(gopTrangThai(['vung', 'chua_vung', 'chua_du'])).toBe('chua_vung')
    expect(gopTrangThai(['vung', 'chua_du'])).toBe('chua_du')
    expect(gopTrangThai([])).toBe('chua_du')
    const v = (p: number, n = 3) => ({ vkn: '', p, nTuLam: n, nCau: n, nNgay: 1, nTroiChay: 0, nCauLaDung: 0, diemSprt: 0, trangThai: 'chua_du' as const, ngayCuoi: null, dayLai: false })
    expect(nenYeuNhat([{ vkn: { 'nen:a': v(0.6), 'nen:b': v(0.4), 'dang:D1': v(0.1) } }, { vkn: { 'nen:a': v(0.2), 'nen:b': v(0.5) } }], ['nen:a', 'nen:b', 'dang:D1'])).toEqual({ vkn: 'nen:a', p: 0.4 })
    expect(nenYeuNhat([{ vkn: { 'nen:a': v(0.6, 0) } }], ['nen:a'])).toBeNull()
  })
})

// ---------------------------------------------------------------- xác nhận dạng
describe('xac-nhan — thầy xác nhận dạng (chỉ-thêm, phát lại cùng sổ)', () => {
  it('sai tham số ⇒ lỗi; đúng ⇒ một dòng omni_xac_nhan và hồ sơ em đổi ngay', async () => {
    const { d, env } = dung()
    themCau(d, 'A1')
    expect(await gvOmni(env, { action: 'xac-nhan', sbd: 'S1', maDang: 'D1', ket: 'ok' }, T0)).toMatchObject({ ok: false })
    expect(await gvOmni(env, { action: 'xac-nhan', sbd: '', maDang: 'D1', ket: 'vung' }, T0)).toMatchObject({ ok: false })
    expect((await hoSoOmniEm(env, 'S1', T0)).vkn['dang:D1']).toBeUndefined()
    expect(await gvOmni(env, { action: 'xac-nhan', sbd: 'S1', maDang: 'D1', ket: 'vung', nguoi: 'Thầy' }, T0)).toEqual({ ok: true, luc: new Date(T0).toISOString() })
    expect(d.sql.prepare('SELECT sbd, ma_dang, ket, nguoi FROM omni_xac_nhan').all()).toEqual([{ sbd: 'S1', ma_dang: 'D1', ket: 'vung', nguoi: 'Thầy' }])
    expect((await hoSoOmniEm(env, 'S1', T0 + 1000)).vkn['dang:D1']).toMatchObject({ trangThai: 'vung' })
  })
})

// ---------------------------------------------------------------- ma trận Q
describe('q-lo / q-duyet — thầy XEM / sửa vi kỹ năng (không bắt buộc)', () => {
  it('q-lo: câu chưa có Q của thầy, đề rút gọn ≤ 160 ký tự, KHÔNG đáp án / lời giải, gợi ý + danh mục, phân trang', async () => {
    const { d, env } = dung()
    themCau(d, 'A1'); themCau(d, 'A2', { text: `<b>Đề dài</b> ${'x'.repeat(300)}` }); themCau(d, 'A3'); themCau(d, 'A4', { dang: 'D2' })
    themCau(d, 'A5', { phan: 'II', dang: 'D2' })
    const id = await taoCd(env, 'Bài 6', ['DEA'])
    await damBaoBangOmni(env)
    d.sql.exec(`INSERT INTO omni_q(qid,y,vkn_json,nguon) VALUES('A1',-1,'["dang:D1"]','thay'),('A3',-1,'["dang:D1","nen:bao_toan_khoi_luong"]','goi_y')`)
    d.sql.exec(`INSERT INTO omni_vkn(id,ma_dang,ten,thu_tu) VALUES('D1#1','D1','Đếm nguyên tử C',1)`)
    const r = await gvOmni(env, { action: 'q-lo', chienDichId: id })
    const cau = r.cau as { qid: string; stt: number; de: string; phan: string; maDang: string; tenDang: string; goiY: string[]; nguon: string }[]
    expect(r.ok).toBe(true)
    expect(cau.map((c) => c.qid)).toEqual(['A2', 'A3', 'A4', 'A5'])
    expect(cau[0]!.stt).toBe(2)
    expect(cau[0]!.de.length).toBeLessThanOrEqual(160)
    expect(cau[0]!.de.startsWith('Đề dài x')).toBe(true)
    expect(cau[0]!.de.endsWith('…')).toBe(true)
    expect(cau.find((c) => c.qid === 'A3')).toMatchObject({ goiY: ['dang:D1', 'nen:bao_toan_khoi_luong'], nguon: 'goi_y' })
    for (const c of cau) expect(c.goiY.length).toBeGreaterThan(0)
    const s = JSON.stringify(r)
    expect(s).not.toContain('LOI-GIAI-BI-MAT')
    expect(s).not.toContain('"correct"')
    expect(s).not.toContain('DSDS')
    const vkn = (r.vkn as { id: string; ten: string }[])
    expect(vkn.map((v) => v.id)).toEqual(expect.arrayContaining(['D1#1', 'dang:D1', 'dang:D2', 'nen:bao_toan_khoi_luong']))
    expect(r.conLai).toBe(0)
    const tiep = await gvOmni(env, { action: 'q-lo', chienDichId: id, sau: 'A3' })
    expect((tiep.cau as { qid: string }[]).map((c) => c.qid)).toEqual(['A4', 'A5'])
    const theoDang = await gvOmni(env, { action: 'q-lo', maDang: 'D2' })
    expect((theoDang.cau as { qid: string }[]).map((c) => c.qid)).toEqual(['A4', 'A5'])
    expect(await gvOmni(env, { action: 'q-lo' })).toMatchObject({ ok: false })
  })
  it('q-duyet: kiểm dòng (Đúng–sai đủ 4 ý), thay mọi dòng cũ của câu bằng nguồn thầy, thêm vi kỹ năng mới', async () => {
    const { d, env } = dung()
    themCau(d, 'A5', { phan: 'II', dang: 'D2' })
    await damBaoBangOmni(env)
    d.sql.exec(`INSERT INTO omni_q(qid,y,vkn_json,nguon) VALUES('A5',-1,'["dang:D2"]','goi_y'),('A5',2,'["nen:x"]','goi_y')`)
    expect(await gvOmni(env, { action: 'q-duyet', ds: [{ qid: 'A5', vkn: ['dang:D2'], vknY: [['a'], ['b'], ['c']] }] }, T0)).toMatchObject({ ok: false, error: expect.stringContaining('Dòng 1') })
    expect(await gvOmni(env, { action: 'q-duyet', ds: [] }, T0)).toMatchObject({ ok: false })
    expect(await gvOmni(env, { action: 'q-duyet', ds: [], vknMoi: [{ id: 'D2#1', maDang: '', ten: 'X' }] }, T0)).toMatchObject({ ok: false })
    const r = await gvOmni(env, {
      action: 'q-duyet',
      ds: [{ qid: 'A5~ss1', vkn: ['dang:D2', 'D2#1'], vknY: [['dang:D2'], ['D2#1'], ['dang:D2', 'D2#1'], ['dang:D2']] }],
      vknMoi: [{ id: 'D2#1', maDang: 'D2', ten: 'Viết phương trình thuỷ phân', tenLoi: 'sai sản phẩm', nhanNen: 'can_bang_phuong_trinh' }],
    }, T0)
    expect(r).toEqual({ ok: true, daDuyet: 1, vknMoi: 1 })
    expect(d.sql.prepare('SELECT y, vkn_json, nguon FROM omni_q WHERE qid = ? ORDER BY y').all('A5')).toEqual([
      { y: -1, vkn_json: '["dang:D2","D2#1"]', nguon: 'thay' }, { y: 0, vkn_json: '["dang:D2"]', nguon: 'thay' }, { y: 1, vkn_json: '["D2#1"]', nguon: 'thay' },
      { y: 2, vkn_json: '["dang:D2","D2#1"]', nguon: 'thay' }, { y: 3, vkn_json: '["dang:D2"]', nguon: 'thay' },
    ])
    expect(d.sql.prepare('SELECT id, ma_dang, ten, ten_loi, nhan_nen FROM omni_vkn').all()).toEqual([{ id: 'D2#1', ma_dang: 'D2', ten: 'Viết phương trình thuỷ phân', ten_loi: 'sai sản phẩm', nhan_nen: 'can_bang_phuong_trinh' }])
    expect((await qCuaCau(env, ['A5'])).get('A5')).toMatchObject({ nguon: 'thay', vknY: [['dang:D2'], ['D2#1'], ['dang:D2', 'D2#1'], ['dang:D2']] })
  })
  it('kiemDongDuyet + rutGonDe', () => {
    expect(kiemDongDuyet({ qid: 'Q~ss0', vkn: ['a', 'a', ' '] })).toEqual({ qid: 'Q', vkn: ['a'], vknY: null })
    expect(kiemDongDuyet({ qid: 'Q', vkn: [] })).toBeNull()
    expect(kiemDongDuyet({ qid: 'Q', vkn: ['a'], vknY: [['x'], [], ['y'], ['z']] })).toBeNull()
    expect(rutGonDe('a  <i>b</i>\n c')).toBe('a b c')
    expect(rutGonDe('x'.repeat(200))).toHaveLength(160)
  })
})

// ---------------------------------------------------------------- ca chốt
const u = (qid: string, phan: 'I' | 'II' | 'III', o: string, diem: number, thuTu: number): UngCaChot => ({ qid, phan, o, diem, thuTu })
describe('chonCauCaChot (thuần) — khung 18 + 4 + 6, ½ câu lạ cùng ô, bù khi thiếu', () => {
  it('đủ ứng viên ⇒ 28 câu: 14 câu chiến dịch nhiều em chưa thành thạo nhất + 14 câu lạ, đúng khung từng phần, từng ô', () => {
    const cd: UngCaChot[] = []
    for (let i = 0; i < 10; i++) cd.push(u(`IA${i}`, 'I', 'I|E|TH', i, i))
    for (let i = 0; i < 8; i++) cd.push(u(`IB${i}`, 'I', 'I|E|VD', 0, 10 + i))
    for (let i = 0; i < 4; i++) cd.push(u(`II${i}`, 'II', 'II|E|TH', 0, 20 + i))
    for (let i = 0; i < 6; i++) cd.push(u(`III${i}`, 'III', 'III|E|VD', 0, 30 + i))
    const la: UngCaChot[] = []
    for (const [o, p, n] of [['I|E|TH', 'I', 9], ['I|E|VD', 'I', 9], ['II|E|TH', 'II', 5], ['III|E|VD', 'III', 5], ['I|K|TH', 'I', 9]] as const) for (let i = 0; i < n; i++) la.push(u(`L-${o}-${i}`, p, o, 0, la.length))
    const r = chonCauCaChot(cd, la)
    expect(r.khung).toEqual({ I: 18, II: 4, III: 6 })
    expect(r).toMatchObject({ soLa: 14, soCu: 14 })
    expect(r.qids).toHaveLength(28)
    expect(new Set(r.qids).size).toBe(28)
    expect(r.qidCu.filter((q) => q.startsWith('IA'))).toEqual(['IA9', 'IA8', 'IA7', 'IA6', 'IA5']) // nhiều em chưa thành thạo nhất trước
    expect(r.qidLa.filter((q) => q.startsWith('L-I|E|TH'))).toHaveLength(5)
    expect(r.qidLa.filter((q) => q.startsWith('L-I|E|VD'))).toHaveLength(4)
    expect(r.qidLa.filter((q) => q.startsWith('L-II|'))).toHaveLength(2)
    expect(r.qidLa.filter((q) => q.startsWith('L-III|'))).toHaveLength(3)
    expect(r.qidLa.some((q) => q.includes('I|K|'))).toBe(false) // khác ô ⇒ không lấy
    expect(r.qids.slice(0, 18).every((q) => q.startsWith('I') || q.startsWith('L-I|'))).toBe(true) // xếp theo phần
  })
  it('thiếu câu lạ ⇒ bù câu chiến dịch (cùng ô), số thật; thiếu câu chiến dịch ⇒ bù câu lạ', () => {
    const cd = [u('a', 'I', 'O', 5, 0), u('b', 'I', 'O', 0, 1), u('c', 'I', 'O', 3, 2), u('d', 'I', 'O', 6, 3)]
    const la = Array.from({ length: 10 }, (_, i) => u(`l${i}`, 'I', 'O', 0, i))
    const r = chonCauCaChot(cd, la) // chỉ Phần I ⇒ khung I = 28, cần 14 lạ + 14 cũ nhưng chỉ có 10 lạ + 4 cũ
    expect(r.khung).toEqual({ I: 14, II: 0, III: 0 })
    expect(r).toMatchObject({ soLa: 10, soCu: 4 })
    expect(r.qidCu).toEqual(['d', 'a', 'c', 'b'])
    const r2 = chonCauCaChot(cd, la.slice(0, 2).concat(Array.from({ length: 30 }, (_, i) => u(`k${i}`, 'I', 'KHAC', 0, 100 + i))))
    expect(r2).toMatchObject({ soLa: 2, soCu: 4 })
  })
})
describe('ca-chot / gan-ca-chot — trên D1', () => {
  async function dungCaChot() {
    const { d, env } = dung()
    for (let i = 0; i < 10; i++) themCau(d, `C-I-${i}`, { maDe: 'DEC', dang: 'ESTER.A', mucDo: 'Thông hiểu' })
    for (let i = 0; i < 8; i++) themCau(d, `C-IB-${i}`, { maDe: 'DEC', dang: 'ESTER.B', mucDo: 'Vận dụng' })
    for (let i = 0; i < 4; i++) themCau(d, `C-II-${i}`, { maDe: 'DEC', phan: 'II', dang: 'ESTER.C', mucDo: 'Thông hiểu' })
    for (let i = 0; i < 6; i++) themCau(d, `C-III-${i}`, { maDe: 'DEC', phan: 'III', dang: 'ESTER.D', mucDo: 'Vận dụng' })
    const id = await taoCd(env, 'Bài 6', ['DEC'])
    // TU LUYỆN (mã không DH-): cùng ô · khác ô · khác chuyên đề; DẠY HỌC (DH-): không lấy; một câu lớp đã gặp: không lấy
    for (let i = 0; i < 12; i++) themCau(d, `TL-I-${i}`, { maDe: 'TL1', dang: i % 2 ? 'ESTER.A' : 'ESTER.X', mucDo: 'Thông hiểu' })
    for (let i = 0; i < 10; i++) themCau(d, `TL-IB-${i}`, { maDe: 'TL1', dang: 'ESTER.B', mucDo: 'Vận dụng' })
    for (let i = 0; i < 5; i++) themCau(d, `TL-II-${i}`, { maDe: 'TL1', phan: 'II', dang: 'ESTER.C', mucDo: 'Thông hiểu' })
    for (let i = 0; i < 5; i++) themCau(d, `TL-III-${i}`, { maDe: 'TL2', phan: 'III', dang: 'ESTER.D', mucDo: 'Vận dụng' })
    for (let i = 0; i < 5; i++) themCau(d, `TL-NB-${i}`, { maDe: 'TL1', dang: 'ESTER.A', mucDo: 'Nhận biết' })
    for (let i = 0; i < 5; i++) themCau(d, `TL-LP-${i}`, { maDe: 'TL1', dang: 'LIPID.A', mucDo: 'Thông hiểu' })
    for (let i = 0; i < 5; i++) themCau(d, `DH-I-${i}`, { maDe: 'DH-X', dang: 'ESTER.A', mucDo: 'Thông hiểu' })
    themCau(d, 'TL-TU-LUAN', { maDe: 'TL1', dang: 'ESTER.A', mucDo: 'Thông hiểu', tuLuan: true })
    await ghiSuKien(env, [sk('S4', 'TL-I-1~ss0', T0 - NGAY, 1)])
    return { d, env, id }
  }
  it('khung 18 + 4 + 6, 14 lạ (TU LUYỆN, cùng ô, chưa em nào gặp) + 14 câu chiến dịch', async () => {
    const { env, id } = await dungCaChot()
    const r = await gvOmni(env, { action: 'ca-chot', chienDichId: id })
    expect(r).toMatchObject({ ok: true, khung: { I: 18, II: 4, III: 6 }, soLa: 14, soCu: 14, phut: 50 })
    const qids = r.qids as string[], la = r.qidLa as string[], cu = r.qidCu as string[]
    expect(qids).toHaveLength(28)
    expect(la.every((q) => q.startsWith('TL-'))).toBe(true)
    expect(cu.every((q) => q.startsWith('C-'))).toBe(true)
    expect(la).not.toContain('TL-I-1')
    expect(la.some((q) => /^TL-(NB|LP)-|TU-LUAN/.test(q))).toBe(false)
    expect(la.filter((q) => q.startsWith('TL-III-'))).toHaveLength(3)
    expect(la.filter((q) => q.startsWith('TL-II-'))).toHaveLength(2)
  })
  it('thiếu câu lạ ở một phần ⇒ bù câu chiến dịch, báo soLa/soCu thật', async () => {
    const { d, env, id } = await dungCaChot()
    d.sql.exec("DELETE FROM game_v2_question WHERE qid LIKE 'TL-III-%'")
    const { xoaDemOmni } = await import('../server/src/omni-d1')
    xoaDemOmni()
    const r = await gvOmni(env, { action: 'ca-chot', chienDichId: id })
    expect(r).toMatchObject({ ok: true, khung: { I: 18, II: 4, III: 6 }, soLa: 11, soCu: 17 })
    expect((r.qidCu as string[]).filter((q) => q.startsWith('C-III-'))).toHaveLength(6)
    expect(await gvOmni(env, { action: 'ca-chot', chienDichId: 'KHONG-CO' })).toMatchObject({ ok: false })
  })
  it('gan-ca-chot: kiểm ca, ghi omni_ca_chot + dự báo từng em (ca_chot:<maCa>); gán lại không ghi đè', async () => {
    const { d, env, id } = await dungCaChot()
    expect(await gvOmni(env, { action: 'gan-ca-chot', chienDichId: id }, T0)).toMatchObject({ ok: false })
    expect(await gvOmni(env, { action: 'gan-ca-chot', chienDichId: id, maCa: 'CA-X' }, T0)).toMatchObject({ ok: false, error: 'Không tìm thấy ca kiểm tra.' })
    d.sql.prepare('INSERT INTO ca(ma_ca,ten_ca,trang_thai,loai,cong_bo,cap_nhat_luc) VALUES(?,?,?,?,?,?)').run('CA-X', 'Ca chốt', 'mo', 'thi', 'ngay', 'x')
    expect(await gvOmni(env, { action: 'gan-ca-chot', chienDichId: id, maCa: 'CA-X', qidLa: ['TL-I-0'] }, T0)).toEqual({ ok: true, daGan: true, soDuBao: 6 })
    expect(d.sql.prepare('SELECT chien_dich_id, ma_ca, qid_la_json FROM omni_ca_chot').all()).toEqual([{ chien_dich_id: id, ma_ca: 'CA-X', qid_la_json: '["TL-I-0"]' }])
    expect(d.dem('omni_du_bao', "pham_vi = 'ca_chot:CA-X'")).toBe(6)
    expect(await gvOmni(env, { action: 'gan-ca-chot', chienDichId: id, maCa: 'CA-X' }, T0 + NGAY)).toEqual({ ok: true, daGan: false, soDuBao: 0 })
  })
})
