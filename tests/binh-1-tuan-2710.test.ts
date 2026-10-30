// @vitest-environment node
// LUẬT BÌNH GIỮ CHUỖI 27/10 (thầy: «1 tuần kiếm được 1 bình thôi», «Bỏ phần thầy duyệt đi») — D1 thật (node:sqlite, lược đồ thật):
//   · giá 150, mỗi em MUA tối đa 1 bình / tuần VN (thứ Hai → Chủ nhật); lần 2 cùng tuần ⇒ từ chối mã 'da_mua_tuan', KHÔNG trừ tinh thể; tuần sau mua được;
//   · không còn tặng bình thứ Hai (thứ Hai trước 27/10 vẫn tính ⇒ bình / ngày đỡ đã qua không đổi);
//   · ngày vắng có phép từ 27/10 tính như ngày thường (ngày trước 27/10 giữ như cũ);
//   · đặt lại bình (dòng `chuoi_binh_mua` nguồn tt-binh-reset-2710): bình về 0, bình mua sau lúc đặt lại vẫn cộng; hai cách đọc (một em / nhiều em) cùng số.
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { taoD1That } from './_d1-that'
import { taoKhoOmni } from './omni-3-ke-hoach-chung'
import { gameToken } from '../server/src/game-v2-auth'
import type { Env } from '../server/src/kieu'
import { hsMuaBinh, hsThuong, LOI_DA_MUA_TUAN } from '../server/src/thuong-d1'
import { datCauNoiChuoi } from '../server/src/thuong-cau-noi-chuoi'
import { TT_BINH_GIU_CHUOI, tuanMuaBinh, thuHaiTt } from '../server/src/thuong-luat'
import { congBinh, docChuoiNgayBai, SQL_CHUOI_BINH } from '../server/src/chuoi-ngay-bai-d1'
import { NGUON_DAT_LAI_BINH } from '../server/src/chuoi-ngay-bai'
import { chuoiCuaEm, docNhatKyNhieuEm, kieuNgayCua, ngayCoHoc } from '../server/src/thuong-ngay-hoc'
import { buocChuoiDoi } from '../server/src/thuong-ban-be'
import { xoaDemPhamVi } from '../server/src/bai-da-day'
import { datNgayBaoTriChoTest } from '../server/src/ngay-bao-tri'
// Luật chuỗi dùng ngày mẫu cuối tháng 10: ghim lịch bảo trì như lúc viết test (chỉ 27/10) — 28/10 + 29/10 thêm vào lịch vận hành 30/10 (tests/ngay-bao-tri-2710.test.ts).
beforeAll(() => datNgayBaoTriChoTest(['2026-10-27']))
afterAll(() => datNgayBaoTriChoTest())

const VN = (s: string) => Date.parse(`${s}+07:00`)
afterEach(() => { vi.useRealTimers(); datCauNoiChuoi(null); xoaDemPhamVi() })

describe('tuần mua bình (giờ VN, thứ Hai → Chủ nhật)', () => {
  it('thứ Hai đầu tuần + khoảng khoá + ngày mua tiếp', () => {
    expect(TT_BINH_GIU_CHUOI).toBe(150)
    expect(thuHaiTt('2026-11-02')).toBe('2026-11-02'); expect(thuHaiTt('2026-11-08')).toBe('2026-11-02'); expect(thuHaiTt('2026-11-09')).toBe('2026-11-09')
    expect(tuanMuaBinh('2026-10-27')).toEqual({ tu: 'tt|2026-10-28|', toi: 'tt|2026-11-02|', muaTiepTu: '2026-11-02' }) // đếm từ lần đặt lại 28/10
    expect(tuanMuaBinh('2026-11-04')).toEqual({ tu: 'tt|2026-11-02|', toi: 'tt|2026-11-09|', muaTiepTu: '2026-11-09' })
  })
})

describe('mua bình — tối đa 1 bình / tuần (D1 thật)', () => {
  const chuoi = { so: 5, giuChuoi: 0, sucChua: 2, lich7: [] }
  async function dung() {
    const d = taoD1That()
    const env = d.env as unknown as Env
    d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES('S1','Em 1','12','mk','x')").run()
    const token = await gameToken(env, 'S1')
    const vang = (so: number, khoa = `nap|${Math.random()}`, maMon: string | null = null) =>
      d.sql.prepare("INSERT INTO vang_so(sbd,loai,so_vang,exp_tru,ma_mon,khoa_yeu_cau,luc) VALUES('S1',?,?,0,?,?,'2026-10-01T00:00:00Z')").run(so >= 0 ? 'doi' : 'mua', so, maMon, khoa)
    const du = () => (d.sql.prepare("SELECT COALESCE(SUM(so_vang),0) AS v FROM vang_so WHERE sbd='S1'").get() as { v: number }).v
    datCauNoiChuoi({ docChuoiNgay: async () => chuoi, congBinh: async () => true })
    return { d, env, token, vang, du }
  }
  beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(VN('2026-11-02T10:00:00')) })

  it('lần 1 OK; lần 2 cùng tuần (khác ngày, cả Chủ nhật 23:59) bị từ chối, KHÔNG trừ tinh thể; thứ Hai tuần sau mua được', async () => {
    const { env, token, vang, du } = await dung()
    vang(500)
    expect(await hsMuaBinh(env, { token }, VN('2026-11-02T10:00:00'))).toMatchObject({ ok: true, gia: 150, tinhThe: 350 })
    for (const luc of ['2026-11-02T20:00:00', '2026-11-04T09:00:00', '2026-11-08T23:59:00']) {
      expect(await hsMuaBinh(env, { token }, VN(luc))).toMatchObject({ ok: false, ma: 'da_mua_tuan', error: LOI_DA_MUA_TUAN, muaTiepTu: '2026-11-09', tinhThe: 350 })
    }
    expect(du()).toBe(350)
    expect(await hsMuaBinh(env, { token }, VN('2026-11-09T00:05:00'))).toMatchObject({ ok: true, tinhThe: 200 })
    expect(await hsMuaBinh(env, { token }, VN('2026-11-10T08:00:00'))).toMatchObject({ ok: false, ma: 'da_mua_tuan' })
    expect(du()).toBe(200)
  })

  it('tổng quan /hs/thuong báo đã mua tuần này (để màn xám nút + nói lý do)', async () => {
    const { env, token, vang } = await dung()
    vang(200)
    const t0 = VN('2026-11-03T10:00:00')
    expect((await hsThuong(env, { token }, undefined, t0)).binh).toEqual({ gia: 150, toiDaTuan: 1, daMuaTuan: false, muaTiepTu: '2026-11-09' })
    expect((await hsMuaBinh(env, { token }, t0)).ok).toBe(true)
    expect((await hsThuong(env, { token }, undefined, t0 + 3_600_000)).binh).toMatchObject({ daMuaTuan: true, nguon: 'mua', muaTiepTu: '2026-11-09' })
    expect((await hsThuong(env, { token }, undefined, VN('2026-11-09T07:00:00'))).binh).toMatchObject({ daMuaTuan: false })
  })

  it('bình mua giá cũ (khoá tt|<ngày>|binh, trước luật mới) không chặn tuần này; sổ cũ giữ nguyên', async () => {
    const { d, env, token, vang, du } = await dung()
    vang(300)
    vang(-50, 'tt|2026-10-27|binh', 'tt-binh')
    expect(await hsMuaBinh(env, { token }, VN('2026-10-27T18:00:00'))).toMatchObject({ ok: true, tinhThe: 100 })
    expect(du()).toBe(100)
    expect((d.sql.prepare("SELECT COUNT(*) AS n FROM vang_so WHERE sbd='S1' AND khoa_yeu_cau='tt|2026-10-27|binh' AND so_vang=-50").get() as { n: number }).n).toBe(1)
  })
})

describe('bình giữ chuỗi từ sổ (B3 thật, D1 thật)', () => {
  function kho() {
    const k = taoKhoOmni({}, 2)
    const sk = k.d.sql.prepare("INSERT INTO su_kien_hoc(khoa,sbd,qid,nguon,ma_nguon,lan,ket_qua,luc,ngay_vn,assistance) VALUES(?,?,?,'game','p',1,1,?,?,'none')")
    const hoc = (sbd: string, tu: string, soNgay: number, bo: string[] = []) => {
      for (let n = 0; n < soNgay; n++) {
        const ngay = new Date(Date.parse(`${tu}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10)
        if (bo.includes(ngay)) continue
        for (let i = 0; i < 6; i++) sk.run(`${sbd}|${ngay}|${i}`, sbd, `q${i}`, `${ngay}T03:00:00Z`, ngay)
      }
    }
    for (const c of SQL_CHUOI_BINH) k.d.sql.exec(c)
    const datLai = (sbd: string, so: number, luc: string) =>
      k.d.sql.prepare('INSERT INTO chuoi_binh_mua(id,sbd,so,nguon,luc) VALUES(?,?,?,?,?)').run(`${sbd}|${NGUON_DAT_LAI_BINH}`, sbd, -so, NGUON_DAT_LAI_BINH, luc)
    return { ...k, hoc, datLai }
  }
  const nhieuEm = async (env: Env, sbd: string, homNay: string) => chuoiCuaEm((await docNhatKyNhieuEm(env, [sbd], '2026-07-01', homNay)).get(sbd), homNay)

  it('bình đang có không đổi lúc phát hành (thứ Hai cũ + bình mua vẫn tính); từ 2/11 không còn tặng thứ Hai', async () => {
    const k = kho()
    k.hoc('S1', '2026-10-12', 16) // 12/10 → 27/10, thứ Hai 12, 19, 26 ⇒ đầy 2 bình
    const homNay = VN('2026-10-27T15:00:00')
    expect((await docChuoiNgayBai(k.env, 'S1', homNay))?.giuChuoi).toBe(2)
    expect((await nhieuEm(k.env, 'S1', '2026-10-27')).giuChuoi).toBe(2)
    // Em học tiếp tới 9/11, lỡ 30/10 và 5/11: hai bình cũ đỡ hai ngày ấy, thứ Hai 2/11 và 9/11 KHÔNG tặng thêm ⇒ còn 0.
    k.hoc('S1', '2026-10-28', 13, ['2026-10-30', '2026-11-05'])
    const r = await docChuoiNgayBai(k.env, 'S1', VN('2026-11-09T20:00:00'))
    expect(r?.giuChuoi).toBe(0); expect(r?.so).toBe(16 + 11)
  })

  it('đặt lại bình 27/10: về 0; bình mua TRƯỚC lúc đặt lại cùng ngày bị xoá theo, mua SAU vẫn cộng; một em = nhiều em', async () => {
    const k = kho()
    k.hoc('S1', '2026-10-12', 16); k.hoc('S2', '2026-10-12', 16)
    await congBinh(k.env, 'S2', 1, 'tinh_the', 'S2|truoc', VN('2026-10-27T09:00:00'))
    k.datLai('S1', 2, new Date(VN('2026-10-27T16:00:00')).toISOString())
    k.datLai('S2', 2, new Date(VN('2026-10-27T16:00:00')).toISOString())
    const t = VN('2026-10-27T17:00:00')
    expect((await docChuoiNgayBai(k.env, 'S1', t))?.giuChuoi).toBe(0)
    expect((await docChuoiNgayBai(k.env, 'S2', t))?.giuChuoi).toBe(0)
    await congBinh(k.env, 'S2', 1, 'tinh_the', 'S2|sau', VN('2026-10-27T18:00:00'))
    const t2 = VN('2026-10-27T19:00:00')
    expect((await docChuoiNgayBai(k.env, 'S2', t2))?.giuChuoi).toBe(1)
    expect((await nhieuEm(k.env, 'S2', '2026-10-27')).giuChuoi).toBe(1)
    expect((await nhieuEm(k.env, 'S1', '2026-10-27')).giuChuoi).toBe(0)
    // Chuỗi không đổi vì đặt lại.
    expect((await docChuoiNgayBai(k.env, 'S1', t))?.so).toBe(16)
  })

  it('hai lần đặt lại trên D1 (2710 rồi 2810, 00:01 VN): mua giữa hai lần về 0, mua cùng ngày trước mốc 2 về 0, mua sau mốc 2 giữ; một em = nhiều em', async () => {
    const k = kho()
    k.hoc('S1', '2026-10-12', 18); k.hoc('S2', '2026-10-12', 18)
    const datLai = (sbd: string, nguon: string, luc: string) => k.d.sql.prepare('INSERT INTO chuoi_binh_mua(id,sbd,so,nguon,luc) VALUES(?,?,?,?,?)').run(`${sbd}|${nguon}`, sbd, -1, nguon, luc)
    for (const s of ['S1', 'S2']) { datLai(s, 'tt-binh-reset-2710', '2026-10-27T09:14:02.876Z'); datLai(s, 'tt-binh-reset-2810', '2026-10-27T17:01:00.000Z') }
    await congBinh(k.env, 'S1', 1, 'tinh_the', 'S1|giua', VN('2026-10-27T18:00:00'))   // giữa hai lần
    await congBinh(k.env, 'S2', 1, 'tinh_the', 'S2|sau', VN('2026-10-28T08:00:00'))    // sau lần 2
    const t = VN('2026-10-28T20:00:00')
    expect((await docChuoiNgayBai(k.env, 'S1', t))?.giuChuoi).toBe(0)
    expect((await docChuoiNgayBai(k.env, 'S2', t))?.giuChuoi).toBe(1)
    expect((await nhieuEm(k.env, 'S1', '2026-10-28')).giuChuoi).toBe(0)
    expect((await nhieuEm(k.env, 'S2', '2026-10-28')).giuChuoi).toBe(1)
  })

  it('vắng có phép (dữ liệu điểm danh giữ nguyên): trước 27/10 vẫn giữ chuỗi; từ 27/10 không học + không bình ⇒ tắt, có bình ⇒ dùng bình; cược/thăng hoa không còn coi là ngày đỡ', async () => {
    const k = kho()
    const phep = (sbd: string, ngay: string) => {
      k.d.sql.prepare("INSERT OR IGNORE INTO buoi_hoc(id,ten,lop,bi_mat,mo_luc,het_han,cap_nhat_luc) VALUES(?,?,'12A1','x',?,?,'x')").run(`b-${ngay}`, `Buổi ${ngay}`, `${ngay}T11:00:00Z`, `${ngay}T13:00:00Z`)
      k.d.sql.prepare("INSERT INTO buoi_hoc_diem_danh(buoi_id,sbd,luc,cach,trang_thai,cap_nhat_luc) VALUES(?,?,?,'thay','co_phep','x')").run(`b-${ngay}`, sbd, `${ngay}T11:00:00Z`)
    }
    // Ngày cũ 14/10: có phép giữ chuỗi như trước.
    k.hoc('S1', '2026-10-12', 2); phep('S1', '2026-10-14'); k.hoc('S1', '2026-10-15', 1)
    const cu = await docChuoiNgayBai(k.env, 'S1', VN('2026-10-15T20:00:00'))
    expect(cu?.lich7.find((x) => x.ngay === '2026-10-14')?.kieu).toBe('phep'); expect(cu?.so).toBe(3)
    // S2 học 3–4/11, vắng có phép 5/11, học 6/11; không bình ⇒ 5/11 tắt.
    k.hoc('S2', '2026-11-03', 2); phep('S2', '2026-11-05'); k.hoc('S2', '2026-11-06', 1)
    const t = VN('2026-11-06T20:00:00')
    const khong = await docChuoiNgayBai(k.env, 'S2', t)
    expect(khong?.lich7.find((x) => x.ngay === '2026-11-05')?.kieu).toBe('tat'); expect(khong?.so).toBe(1)
    expect((await nhieuEm(k.env, 'S2', '2026-11-06')).so).toBe(1)
    // Lửa đôi «Học cùng bạn» dùng cùng kiểu ngày: vắng có phép từ 27/10 không còn đỡ ⇒ lửa đôi tắt.
    expect(await ngayCoHoc(k.env, 'S2', '2026-11-05', t)).toBe('tat')
    expect(buocChuoiDoi(4, 'hoc', 'tat')).toBe(0)
    expect(kieuNgayCua(undefined, '2026-11-20', '2026-12-30')).toBe('tat')
    expect(await ngayCoHoc(k.env, 'S1', '2026-10-14', t)).toBe('phep') // ngày cũ giữ như cũ
    await congBinh(k.env, 'S2', 1, 'tinh_the', 'S2|binh', VN('2026-11-03T09:00:00'))
    const co = await docChuoiNgayBai(k.env, 'S2', t)
    expect(co?.lich7.find((x) => x.ngay === '2026-11-05')?.kieu).toBe('binh'); expect(co?.so).toBe(3); expect(co?.giuChuoi).toBe(0)
    expect(await ngayCoHoc(k.env, 'S2', '2026-11-05', t)).toBe('binh')
    const { cauNoiChuoi } = await import('../server/src/thuong-cau-noi-chuoi')
    // Phép 5/11 của S2 không còn được đỡ; chỉ còn ngày bảo trì 27/10 (ngay-bao-tri.ts, mọi em).
    expect([...(await cauNoiChuoi().docNgayCoPhep(k.env, ['S1', 'S2'], '2026-10-01', '2026-11-30')).get('S2') ?? []]).toEqual(['2026-10-27'])
    expect([...(await cauNoiChuoi().docNgayCoPhep(k.env, ['S1', 'S2'], '2026-10-01', '2026-11-30')).get('S1') ?? []].sort()).toEqual(['2026-10-14', '2026-10-27'])
    // Dữ liệu điểm danh không bị đụng.
    expect((k.d.sql.prepare("SELECT COUNT(*) AS n FROM buoi_hoc_diem_danh WHERE trang_thai='co_phep'").get() as { n: number }).n).toBe(2)
  })
})
