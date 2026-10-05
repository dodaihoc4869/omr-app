// @vitest-environment node
// OMNI 3 · HAI THƯ MỤC MỤC ĐÍCH CỦA KHO (server/src/kho-thu-muc.ts). Khoá:
//   (1) suy thư mục từ `nhom` y hệt cây kho của app thầy (laDeDayHoc): "12 · DẠY HỌC/…" ⇒ DAY_HOC, mọi thư mục khác/không có ⇒ TU_LUYEN, mã "DH-" ⇒ DAY_HOC;
//   (2) `/kho/thu-muc` upsert theo MÃ GỐC, ≤ 400 mã/lệnh, chỉ nhận 'DAY_HOC'|'TU_LUYEN';
//   (3) `thuMucCuaMaDe` nhận mã tách phần, thiếu dòng / chưa có bảng ⇒ luật lùi `thuMucTheoMa`;
//   (4) `ghiThuMucKhiDayDe` không bao giờ ném lỗi; (5) câu tạo bảng = đúng câu trong migration-0510-omni-3.sql.
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { taoD1That } from './_d1-that'
import type { Env } from '../server/src/kieu'
import { ghiThuMucKhiDayDe, gvKhoThuMuc, SQL_BANG_THU_MUC, thuMucCuaMaDe, thuMucTheoMa, thuMucTuNhom, TOI_DA_MA_MOI_LENH } from '../server/src/kho-thu-muc'
import { laDeDayHoc } from '../src/lib/day-hoc-len-bang'

const T0 = Date.parse('2026-10-05T09:00:00+07:00')
const thuMucBang = (d: ReturnType<typeof taoD1That>) =>
  Object.fromEntries((d.sql.prepare('SELECT ma_de, thu_muc FROM de_kho_thu_muc ORDER BY ma_de').all() as { ma_de: string; thu_muc: string }[]).map((x) => [x.ma_de, x.thu_muc]))

describe('suy thư mục từ nhom (thuần)', () => {
  it('DẠY HỌC ⇒ DAY_HOC; thư mục khác / không có thư mục / rỗng ⇒ TU_LUYEN; mã DH- luôn DAY_HOC', () => {
    expect(thuMucTuNhom('12-C1-B1', '12 · DẠY HỌC/C1 - Ester lipid')).toBe('DAY_HOC')
    expect(thuMucTuNhom('12-C1-B1', '12 · KIỂM TRA/C1 - Ester lipid')).toBe('TU_LUYEN')
    expect(thuMucTuNhom('12-C1-B1', '12 · C1 - Ester lipid')).toBe('TU_LUYEN')
    expect(thuMucTuNhom('DB-12-B1-D1', '12 · DẠNG BÀI/Bài 1. Ester')).toBe('TU_LUYEN')
    expect(thuMucTuNhom('12-C1-B1', null)).toBe('TU_LUYEN')
    expect(thuMucTuNhom('12-C1-B1', undefined)).toBe('TU_LUYEN')
    expect(thuMucTuNhom('DH-12-C1-B1', '12 · ĐỀ CŨ/C1')).toBe('DAY_HOC')
    expect(thuMucTuNhom('dh-12-c1-b1', '')).toBe('DAY_HOC')
    expect(thuMucTheoMa(' DH-12 ')).toBe('DAY_HOC')
    expect(thuMucTheoMa('12-DH')).toBe('TU_LUYEN')
  })
  it('khớp đúng luật cây kho app thầy (laDeDayHoc), kể cả chữ tổ hợp NFD và chữ thường', () => {
    const ds = ['12 · DẠY HỌC/C1 - Ester lipid', '12 · DẠY HỌC/C1'.normalize('NFD'), '11 · dạy học/C2 - Nitrogen', '10 · DẠY HỌC', '12 · TU LUYỆN/C1', 'DẠY HỌC/C3', '', '12 · /C1']
    for (const nhom of ds) expect(thuMucTuNhom('12-X', nhom), nhom).toBe(laDeDayHoc({ nhom }) ? 'DAY_HOC' : 'TU_LUYEN')
  })
})

describe('/kho/thu-muc (gvKhoThuMuc)', () => {
  it('upsert theo mã gốc (mã tách phần quy về gốc), bỏ thư mục lạ, trả daGhi', async () => {
    const d = taoD1That()
    const r = await gvKhoThuMuc(d.env as unknown as Env, {
      ds: [{ maDe: 'DH-12-C1-B1-TN', thuMuc: 'DAY_HOC' }, { maDe: 'DH-12-C1-B1-DS', thuMuc: 'DAY_HOC' }, { maDe: '12-ON-1', thuMuc: 'TU_LUYEN' }, { maDe: 'X', thuMuc: 'KHAC' }, { thuMuc: 'TU_LUYEN' }],
    }, T0)
    expect(r).toEqual({ ok: true, daGhi: 2, boQua: 2 })
    expect(thuMucBang(d)).toEqual({ 'DH-12-C1-B1': 'DAY_HOC', '12-ON-1': 'TU_LUYEN' })
  })
  it('ghi lại: đổi thư mục thì cập nhật; cùng thư mục thì giữ nguyên cap_nhat_luc', async () => {
    const d = taoD1That()
    const env = d.env as unknown as Env
    await gvKhoThuMuc(env, { ds: [{ maDe: 'A', thuMuc: 'TU_LUYEN' }, { maDe: 'B', thuMuc: 'TU_LUYEN' }] }, T0)
    await gvKhoThuMuc(env, { ds: [{ maDe: 'A', thuMuc: 'DAY_HOC' }, { maDe: 'B', thuMuc: 'TU_LUYEN' }] }, T0 + 86_400_000)
    const dong = Object.fromEntries((d.sql.prepare('SELECT ma_de, thu_muc, cap_nhat_luc FROM de_kho_thu_muc').all() as { ma_de: string; thu_muc: string; cap_nhat_luc: string }[]).map((x) => [x.ma_de, x]))
    expect(dong.A).toMatchObject({ thu_muc: 'DAY_HOC', cap_nhat_luc: new Date(T0 + 86_400_000).toISOString() })
    expect(dong.B).toMatchObject({ thu_muc: 'TU_LUYEN', cap_nhat_luc: new Date(T0).toISOString() })
  })
  it(`quá ${TOI_DA_MA_MOI_LENH} mã ⇒ từ chối cả lệnh, không ghi gì; thiếu ds ⇒ từ chối`, async () => {
    const d = taoD1That()
    const ds = Array.from({ length: TOI_DA_MA_MOI_LENH + 1 }, (_, i) => ({ maDe: `T${i}`, thuMuc: 'TU_LUYEN' }))
    const r = await gvKhoThuMuc(d.env as unknown as Env, { ds }, T0)
    expect(r.ok).toBe(false)
    expect(String(r.error)).toContain('400')
    expect(d.dem('de_kho_thu_muc')).toBe(0)
    expect((await gvKhoThuMuc(d.env as unknown as Env, {}, T0)).ok).toBe(false)
    expect((await gvKhoThuMuc(d.env as unknown as Env, { ds: ds.slice(0, TOI_DA_MA_MOI_LENH) }, T0))).toMatchObject({ ok: true, daGhi: TOI_DA_MA_MOI_LENH })
  })
  it('bảng chưa có (CI không chạy migration) ⇒ lệnh đầu tự tạo bảng', async () => {
    const d = taoD1That()
    d.sql.exec('DROP TABLE de_kho_thu_muc')
    const r = await gvKhoThuMuc(d.env as unknown as Env, { ds: [{ maDe: 'A', thuMuc: 'DAY_HOC' }] }, T0)
    expect(r).toMatchObject({ ok: true, daGhi: 1 })
    expect(thuMucBang(d)).toEqual({ A: 'DAY_HOC' })
  })
})

describe('thuMucCuaMaDe', () => {
  it('tra theo mã gốc cho cả mã tách phần; khoá Map = đúng chuỗi truyền vào; thiếu dòng ⇒ luật lùi (DH- là DẠY HỌC)', async () => {
    const d = taoD1That()
    const env = d.env as unknown as Env
    await gvKhoThuMuc(env, { ds: [{ maDe: '12-C1-B1', thuMuc: 'DAY_HOC' }, { maDe: 'DH-12-C9-B9', thuMuc: 'TU_LUYEN' }] }, T0)
    const m = await thuMucCuaMaDe(env, ['12-C1-B1-TN', '12-C1-B1', 'DH-12-C9-B9-DS', 'DH-12-C2-B4-TLN', '11-ON-2', ''])
    expect([...m]).toEqual([
      ['12-C1-B1-TN', 'DAY_HOC'], ['12-C1-B1', 'DAY_HOC'], // dòng bảng thắng luật lùi
      ['DH-12-C9-B9-DS', 'TU_LUYEN'], // thầy đặt TU LUYỆN cho tờ mã DH- ⇒ theo bảng
      ['DH-12-C2-B4-TLN', 'DAY_HOC'], ['11-ON-2', 'TU_LUYEN'], ['', 'TU_LUYEN'], // không có dòng ⇒ luật lùi
    ])
  })
  it('bảng chưa có / D1 lỗi ⇒ luật lùi, không ném', async () => {
    const d = taoD1That()
    d.sql.exec('DROP TABLE de_kho_thu_muc')
    expect([...(await thuMucCuaMaDe(d.env as unknown as Env, ['DH-1-TN', 'X']))]).toEqual([['DH-1-TN', 'DAY_HOC'], ['X', 'TU_LUYEN']])
    const hong = { DB: { prepare() { throw new Error('D1 sập') } } } as unknown as Env
    expect([...(await thuMucCuaMaDe(hong, ['DH-1', 'Y']))]).toEqual([['DH-1', 'DAY_HOC'], ['Y', 'TU_LUYEN']])
  })
})

describe('ghiThuMucKhiDayDe (gọi trong dayDeKho)', () => {
  it('suy từ nhom của tờ rồi ghi; đẩy lại tờ với nhom mới ⇒ cập nhật', async () => {
    const d = taoD1That()
    const env = d.env as unknown as Env
    await ghiThuMucKhiDayDe(env, '12-C1-B1', '12 · DẠY HỌC/C1 - Ester lipid', T0)
    await ghiThuMucKhiDayDe(env, '12-DE-KT-1', '12 · KIỂM TRA/C1', T0)
    await ghiThuMucKhiDayDe(env, 'DH-11-C2-B3', undefined, T0)
    await ghiThuMucKhiDayDe(env, 'DB-12-B1-D1', '12 · DẠNG BÀI/Bài 1. Ester', T0)
    expect(thuMucBang(d)).toEqual({ '12-C1-B1': 'DAY_HOC', '12-DE-KT-1': 'TU_LUYEN', 'DH-11-C2-B3': 'DAY_HOC', 'DB-12-B1-D1': 'TU_LUYEN' })
    await ghiThuMucKhiDayDe(env, '12-C1-B1', '12 · C1 - Ester lipid', T0 + 1000)
    expect(thuMucBang(d)['12-C1-B1']).toBe('TU_LUYEN')
  })
  it('không bao giờ ném lỗi (D1 hỏng, mã rỗng, nhom không phải chuỗi)', async () => {
    const hong = { DB: { prepare() { throw new Error('D1 sập') }, batch() { return Promise.reject(new Error('D1 sập')) } } } as unknown as Env
    await expect(ghiThuMucKhiDayDe(hong, '12-C1-B1', '12 · DẠY HỌC/C1')).resolves.toBeUndefined()
    const d = taoD1That()
    await expect(ghiThuMucKhiDayDe(d.env as unknown as Env, '', 'x')).resolves.toBeUndefined()
    await expect(ghiThuMucKhiDayDe(d.env as unknown as Env, 'Z', 42 as unknown as string)).resolves.toBeUndefined()
    expect(thuMucBang(d)).toEqual({ Z: 'TU_LUYEN' })
  })
})

describe('bảng tạo lúc chạy = bản SQL', () => {
  it('câu tạo de_kho_thu_muc có đúng trong migration-0510-omni-3.sql', () => {
    const sql = readFileSync('server/migration-0510-omni-3.sql', 'utf8').split('\n').filter((l) => !l.trim().startsWith('--')).join('\n')
    const cau = sql.split(';').map((x) => x.replace(/\s+/g, ' ').trim()).filter(Boolean)
    for (const s of SQL_BANG_THU_MUC) expect(cau).toContain(s.replace(/\s+/g, ' ').trim())
  })
})
