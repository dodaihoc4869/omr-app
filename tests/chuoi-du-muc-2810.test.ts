// @vitest-environment node
// LUẬT CHUỖI + TRẦN BÌNH 28/10 (thầy 27/10: «Chuỗi phải làm xong chặng mới tính chuỗi… mỗi tuần học sinh chăm nhất cũng chỉ có 1 bình»):
//   · từ 28/10 ngày giữ chuỗi = ĐỦ MỨC HÔM NAY (câu Gói 7 ≥ mức đã chốt; chưa chốt mức ⇒ 1 chặng); tự sửa riêng không giữ; cứu = đủ mức + 2 chặng bù;
//   · trần 1 bình/tuần chung cho mua + quà mốc 30 ngày; /hs/thuong/mua-binh từ chối khi tuần đã nhận bình (kể cả quà);
//   · cược chuỗi chốt theo ngày giữ chuỗi mới; lửa đôi theo cùng định nghĩa. D1 thật.
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { taoD1That } from './_d1-that'
import { taoKhoOmni } from './omni-3-ke-hoach-chung'
import { gameToken } from '../server/src/game-v2-auth'
import type { Env } from '../server/src/kieu'
import { chuoiNgayCuaEm, ngayDatChuoi, CAU_MOT_BAI, NGAY_CHUOI_DU_MUC, type NhatKyChuoi } from '../server/src/chuoi-ngay-bai'
import { docChuoiNgayBai } from '../server/src/chuoi-ngay-bai-d1'
import { chuoiCuaEm, datNgay, docNhatKyNhieuEm } from '../server/src/thuong-ngay-hoc'
import { cauNoiChuoi, datCauNoiChuoi } from '../server/src/thuong-cau-noi-chuoi'
import { hsMuaBinh, LOI_DA_NHAN_TUAN } from '../server/src/thuong-d1'
import { xoaDemPhamVi } from '../server/src/bai-da-day'
import { datNgayBaoTriChoTest } from '../server/src/ngay-bao-tri'
// Luật chuỗi dùng ngày mẫu cuối tháng 10: ghim lịch bảo trì như lúc viết test (chỉ 27/10) — 28/10 + 29/10 thêm vào lịch vận hành 30/10 (tests/ngay-bao-tri-2710.test.ts).
beforeAll(() => datNgayBaoTriChoTest(['2026-10-27']))
afterAll(() => datNgayBaoTriChoTest())

afterEach(() => { datCauNoiChuoi(null); xoaDemPhamVi(); vi.useRealTimers() })
const VN = (s: string) => Date.parse(`${s}+07:00`)
const ngayTu = (dau: string, n: number) => Array.from({ length: n }, (_, i) => new Date(Date.parse(`${dau}T00:00:00Z`) + i * 86_400_000).toISOString().slice(0, 10))
const nk = (o: { c?: Record<string, number>; c7?: Record<string, number>; muc?: Record<string, number>; tuSua?: string[]; mua?: Record<string, number> }): NhatKyChuoi => ({
  soCau: new Map(Object.entries(o.c ?? o.c7 ?? {})), tuSua: new Set(o.tuSua ?? []), phep: new Set(), mua: new Map(Object.entries(o.mua ?? {})),
  soCau7: new Map(Object.entries(o.c7 ?? o.c ?? {})), muc: new Map(Object.entries(o.muc ?? {})),
})

describe('luật chuỗi «đủ mức hôm nay» (hàm thuần)', () => {
  it('mốc 28/10', () => { expect(NGAY_CHUOI_DU_MUC).toBe('2026-10-28') })
  it('xong 1 chặng nhưng chưa đủ mức 24 câu ⇒ KHÔNG giữ chuỗi; đủ 24 ⇒ giữ; chưa chốt mức ⇒ 1 chặng', () => {
    const n = nk({ c7: { '2026-10-28': 6, '2026-10-29': 24, '2026-10-30': 6 }, muc: { '2026-10-28': 24, '2026-10-29': 24 } })
    expect(ngayDatChuoi(n, '2026-10-28')).toBe(false)
    expect(ngayDatChuoi(n, '2026-10-29')).toBe(true)
    expect(ngayDatChuoi(n, '2026-10-30')).toBe(true) // không có mức chốt ⇒ đủ 1 chặng
    expect(ngayDatChuoi(nk({ c7: { '2026-10-31': 5 } }), '2026-10-31')).toBe(false)
  })
  it('câu ngoài tập Gói 7 (KTCN, lướt…) không tính mức: c = 30 nhưng c7 = 10 < 24 ⇒ không giữ', () => {
    expect(ngayDatChuoi(nk({ c: { '2026-10-29': 30 }, c7: { '2026-10-29': 10 }, muc: { '2026-10-29': 24 } }), '2026-10-29')).toBe(false)
  })
  it('tự sửa riêng không còn giữ chuỗi từ 28/10 (trước 28/10 vẫn giữ)', () => {
    expect(ngayDatChuoi(nk({ tuSua: ['2026-10-29'] }), '2026-10-29')).toBe(false)
    expect(ngayDatChuoi(nk({ tuSua: ['2026-10-20'] }), '2026-10-20')).toBe(true)
  })
  it('chuỗi qua mốc: ngày cũ theo luật cũ, ngày mới theo đủ mức; hôm nay chưa đủ ⇒ "cho" + báo cần/đã', () => {
    const c7 = { '2026-10-25': 6, '2026-10-26': 6, '2026-10-28': 24, '2026-10-29': 12 }
    const r = chuoiNgayCuaEm(nk({ c7, muc: { '2026-10-28': 24, '2026-10-29': 24 } }), '2026-10-29')
    expect(r.so).toBe(3) // 25, 26, (27 bảo trì giữ), 28
    expect(r.lich7.find((x) => x.ngay === '2026-10-29')!.kieu).toBe('cho')
    expect(r.homNay).toEqual({ can: 24, da: 12 })
  })
  it('cứu chuỗi luật mới: hôm sau đủ mức + 2 chặng bù (24 + 12 = 36 câu)', () => {
    const base = { '2026-10-28': 24, '2026-10-29': 24 }
    const muc = { '2026-10-28': 24, '2026-10-29': 24, '2026-10-30': 24, '2026-10-31': 24 }
    const chua = chuoiNgayCuaEm(nk({ c7: { ...base, '2026-10-31': 30 }, muc }), '2026-10-31')
    expect(chua.cuu).toMatchObject({ daLam: 1, can: 2, soCu: 2 })
    const du = chuoiNgayCuaEm(nk({ c7: { ...base, '2026-10-31': 36 }, muc }), '2026-10-31')
    expect(du.lich7.find((x) => x.ngay === '2026-10-30')!.kieu).toBe('cuu'); expect(du.so).toBe(3)
  })
})

describe('trần 1 bình/tuần cho mọi đường', () => {
  it('quà mốc 30 ngày rơi vào tuần đã mua bình ⇒ không tặng thêm; tuần chưa nhận ⇒ tặng và tính vào trần', () => {
    const ngay = ngayTu('2026-10-28', 30) // 28/10 → 26/11 đủ mức, mốc 30 rơi vào 26/11 (tuần 23/11)
    const c7 = Object.fromEntries(ngay.map((d) => [d, 6]))
    const coMua = chuoiNgayCuaEm(nk({ c7, mua: { '2026-11-23': 1 } }), '2026-11-26')
    expect(coMua.so).toBe(30); expect(coMua.giuChuoi).toBe(1); expect(coMua.binhTuanNay).toBe(1)
    const khongMua = chuoiNgayCuaEm(nk({ c7 }), '2026-11-26')
    expect(khongMua.giuChuoi).toBe(1); expect(khongMua.binhTuanNay).toBe(1)
  })
  it('đặt lại bình xoá số đã nhận của tuần (bình mua trước lần đặt lại không chặn tuần)', () => {
    const r = chuoiNgayCuaEm({ ...nk({ c7: { '2026-10-28': 6 }, mua: { '2026-10-27': 1 } }), datLai: new Set(['2026-10-28']) }, '2026-10-28')
    expect(r.binhTuanNay).toBe(0); expect(r.giuChuoi).toBe(0)
  })
  it('mua bình: tuần đã nhận quà mốc 30 ⇒ từ chối «da_mua_tuan», không trừ tinh thể', async () => {
    const d = taoD1That()
    const env = d.env as unknown as Env
    d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES('S1','Em 1','12','mk','x')").run()
    d.sql.prepare("INSERT INTO vang_so(sbd,loai,so_vang,exp_tru,khoa_yeu_cau,luc) VALUES('S1','doi',400,0,'nap','2026-10-01T00:00:00Z')").run()
    const token = await gameToken(env, 'S1')
    datCauNoiChuoi({ docChuoiNgay: async () => ({ so: 30, giuChuoi: 1, sucChua: 2, lich7: [], binhTuanNay: 1 }), congBinh: async () => true })
    expect(await hsMuaBinh(env, { token }, VN('2026-11-26T10:00:00'))).toMatchObject({ ok: false, ma: 'da_mua_tuan', error: LOI_DA_NHAN_TUAN, muaTiepTu: '2026-11-30' })
    expect((d.sql.prepare("SELECT SUM(so_vang) AS s FROM vang_so WHERE sbd='S1'").get() as { s: number }).s).toBe(400)
    // Tổng quan nói đúng nguồn: bình của tuần là QUÀ mốc 30 ngày (không phải mua).
    const { hsThuong } = await import('../server/src/thuong-d1')
    expect((await hsThuong(env, { token }, undefined, VN('2026-11-26T10:00:00'))).binh).toMatchObject({ daMuaTuan: true, nguon: 'qua' })
  })
})

describe('D1 thật: đọc mức + câu Gói 7, lửa đôi, cược', () => {
  function kho() {
    const k = taoKhoOmni({}, 2)
    const sk = k.d.sql.prepare("INSERT INTO su_kien_hoc(khoa,sbd,qid,nguon,ma_nguon,lan,ket_qua,luc,ngay_vn,assistance,purpose) VALUES(?,?,?,'game',?,1,1,?,?,'none',?)")
    const lam = (sbd: string, ngay: string, so: number, ma = 'p', purpose: string | null = null) => { for (let i = 0; i < so; i++) sk.run(`${sbd}|${ngay}|${ma}|${i}`, sbd, `${ma}q${i}`, ma, `${ngay}T03:00:00Z`, ngay, purpose) }
    const muc = (sbd: string, ngay: string, m: number) => k.d.sql.prepare('INSERT OR REPLACE INTO goi_bai_7_muc_ngay(sbd,ngay,tang,toi_thieu_tang,quota,muc,luc) VALUES(?,?,0,0,0,?,?)').run(sbd, ngay, m, 'x')
    return { ...k, lam, muc }
  }
  it('một em (B3) = nhiều em (lửa đôi): 6 câu khi mức 24 không giữ; câu KTCN không tính; đủ 24 thì giữ', async () => {
    const k = kho()
    k.lam('S1', '2026-10-28', 24); k.muc('S1', '2026-10-28', 24)
    k.lam('S1', '2026-10-29', 6); k.lam('S1', '2026-10-29', 20, 'ktcn:x'); k.muc('S1', '2026-10-29', 24)
    k.lam('S1', '2026-10-30', 24); k.muc('S1', '2026-10-30', 24)
    const t = VN('2026-10-30T20:00:00')
    const r = await docChuoiNgayBai(k.env, 'S1', t)
    expect(r?.lich7.find((x) => x.ngay === '2026-10-29')?.kieu).toBe('tat')
    expect(r?.so).toBe(1)
    const nkNhieu = (await docNhatKyNhieuEm(k.env, ['S1'], '2026-10-01', '2026-10-30')).get('S1')
    expect(chuoiCuaEm(nkNhieu, '2026-10-30').so).toBe(1)
    expect(datNgay(nkNhieu, '2026-10-28')).toBe(true); expect(datNgay(nkNhieu, '2026-10-29')).toBe(false)
  })
  it('cược: ngày giữ chuỗi mới (duMuc) — 6 câu khi mức 24 không tính; thăng hoa vẫn tính «có học»', async () => {
    const k = kho()
    k.lam('S1', '2026-10-28', 6); k.muc('S1', '2026-10-28', 24)
    k.lam('S2', '2026-10-28', 24); k.muc('S2', '2026-10-28', 24)
    const cuoc = await cauNoiChuoi().docNgayCoHoc(k.env, ['S1', 'S2'], '2026-10-28', '2026-10-28', true)
    expect(cuoc.get('S1')).toBeUndefined(); expect([...(cuoc.get('S2') ?? [])]).toEqual(['2026-10-28'])
    const thangHoa = await cauNoiChuoi().docNgayCoHoc(k.env, ['S1'], '2026-10-28', '2026-10-28')
    expect([...(thangHoa.get('S1') ?? [])]).toEqual(['2026-10-28'])
  })
  it('chưa có bảng mức / chưa chốt mức ⇒ 1 chặng (CAU_MOT_BAI)', async () => {
    const k = kho()
    k.lam('S1', '2026-10-28', CAU_MOT_BAI)
    expect((await docChuoiNgayBai(k.env, 'S1', VN('2026-10-28T20:00:00')))?.so).toBe(1)
  })
})
