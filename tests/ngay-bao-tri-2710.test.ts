// @vitest-environment node
// NGÀY BẢO TRÌ 27/10 (thầy: «App đang bảo trì. Tối nay các em không phải làm. Ngày mai vào làm bình thường»): em không làm KHÔNG thiệt; em đã làm đủ vẫn tính.
import { describe, expect, it } from 'vitest'
import { taoD1That } from './_d1-that'
import type { Env } from '../server/src/kieu'
import { NGAY_BAO_TRI, laNgayBaoTri } from '../server/src/ngay-bao-tri'
import { chuoiNgayCuaEm, CAU_MOT_BAI, type NhatKyChuoi } from '../server/src/chuoi-ngay-bai'
import { demChuoiNgayHoc } from '../server/src/chuoi-ngay-hoc'
import { chotNgayCu, docCauHinhKeHoach, docNgayNghi, phanTichNgayNghi } from '../server/src/ke-hoach-ngay-d1'
import { soNgayVang } from '../server/src/khien-mat'
import { ngayDuocTinh } from '../server/src/nhip-hoc'
import { kieuNgayCua } from '../server/src/thuong-ngay-hoc'
import { cauNoiChuoi } from '../server/src/thuong-cau-noi-chuoi'
import { buocChuoiDoi } from '../server/src/thuong-ban-be'

const nk = (hoc: string[], mua: Record<string, number> = {}, cau = CAU_MOT_BAI): NhatKyChuoi =>
  ({ soCau: new Map(hoc.map((d) => [d, cau])), tuSua: new Set(), phep: new Set(), mua: new Map(Object.entries(mua)) })

describe('ngày bảo trì 27/10', () => {
  it('danh sách', () => {
    // 30/10: thêm 28/10 + 29/10 (thầy «khôi phục chuỗi cho học sinh bị mất hôm qua và hôm kia» — giờ cao điểm app lag).
    expect(NGAY_BAO_TRI).toEqual(['2026-10-27', '2026-10-28', '2026-10-29']); expect(laNgayBaoTri('2026-10-27')).toBe(true); expect(laNgayBaoTri('2026-10-29')).toBe(true); expect(laNgayBaoTri('2026-10-30')).toBe(false)
  })
  it('chuỗi B3: không làm 27/10 ⇒ giữ chuỗi, KHÔNG tiêu bình; làm đủ 27/10 ⇒ lửa +1 như thường', () => {
    const khong = chuoiNgayCuaEm(nk(['2026-10-24', '2026-10-25', '2026-10-26', '2026-10-28'], { '2026-10-24': 1 }), '2026-10-28')
    expect(khong.lich7.find((x) => x.ngay === '2026-10-27')!.kieu).toBe('phep')
    expect(khong.so).toBe(4); expect(khong.giuChuoi).toBe(1 + 1 /* thứ Hai 26/10 (luật cũ) */); expect(khong.binhVuaDo).toBeUndefined()
    const co = chuoiNgayCuaEm(nk(['2026-10-24', '2026-10-25', '2026-10-26', '2026-10-27', '2026-10-28']), '2026-10-28')
    expect(co.so).toBe(5); expect(co.lich7.find((x) => x.ngay === '2026-10-27')!.kieu).toBe('hoc')
    // Ngày khác vẫn theo luật: lỡ 31/10, không bình ⇒ tắt.
    const lo = chuoiNgayCuaEm(nk(['2026-10-26', '2026-10-30', '2026-11-01']), '2026-11-01')
    expect(lo.lich7.find((x) => x.ngay === '2026-10-31')!.kieu).not.toBe('phep')
  })
  it('lửa đôi + kiểu ngày cũ hơn 7 ngày: 27/10 là ngày được đỡ', () => {
    expect(kieuNgayCua(undefined, '2026-10-27', '2026-11-20')).toBe('phep')
    expect(buocChuoiDoi(5, 'hoc', 'phep')).toBe(5)
  })
  it('chuỗi cũ (≥ 1 câu): 27/10 không học thì bỏ qua, không cắt chuỗi', () => {
    expect(demChuoiNgayHoc(['2026-10-25', '2026-10-26', '2026-10-28'], '2026-10-28')).toBe(3)
    expect(demChuoiNgayHoc(['2026-10-25', '2026-10-26'], '2026-10-28')).toBe(2)
    expect(demChuoiNgayHoc(['2026-10-25', '2026-10-28'], '2026-10-28')).toBe(1) // 26/10 vẫn là ngày lỡ thật
  })
  it('ngày nghỉ (khiên, chuỗi ngày đạt EXP, kế hoạch) có 27/10; cấu hình thô (EXP cấp) KHÔNG thêm; khiên không tính 27/10 là vắng', async () => {
    const d = taoD1That()
    const env = d.env as unknown as Env
    expect(await docNgayNghi(env)).toEqual(new Set(['2026-10-27', '2026-10-28', '2026-10-29']))
    expect(phanTichNgayNghi('2026-09-02')).toEqual(new Set(['2026-09-02']))
    expect(soNgayVang('2026-10-27', '2026-10-20', new Set(['2026-10-26']), await docNgayNghi(env))).toBe(0)
    expect((await docCauHinhKeHoach(env)).ngayNghi.has('2026-10-27')).toBe(true)
  })
  it('nhịp học: 27/10 chưa đủ mức bị bỏ khỏi dải (không phải ngày thiếu); đủ mức thì giữ', () => {
    const ngay = [{ ngay: '2026-10-26', mucToiThieu: 12, daLam: 12 }, { ngay: '2026-10-27', mucToiThieu: 12, daLam: 3 }, { ngay: '2026-10-28', mucToiThieu: 12, daLam: 12 }]
    expect(ngayDuocTinh(ngay as never, '2026-10-01').map((x) => x.ngay)).toEqual(['2026-10-26', '2026-10-28'])
    ngay[1]!.daLam = 12
    expect(ngayDuocTinh(ngay as never, '2026-10-01').map((x) => x.ngay)).toEqual(['2026-10-26', '2026-10-27', '2026-10-28'])
  })
  it('thăng hoa / cược: mọi em được đỡ ngày 27/10 (cầu nối)', async () => {
    const d = taoD1That()
    const env = d.env as unknown as Env
    const m = await cauNoiChuoi().docNgayCoPhep(env, ['A', 'B'], '2026-10-26', '2026-10-27')
    expect([...(m.get('A') ?? [])]).toEqual(['2026-10-27']); expect([...(m.get('B') ?? [])]).toEqual(['2026-10-27'])
    expect((await cauNoiChuoi().docNgayCoPhep(env, ['A'], '2026-10-20', '2026-10-26')).get('A')).toBeUndefined()
  })
  it('chốt kế hoạch ngày 27/10: em chưa đạt ⇒ ngày nghỉ (không ghi «khong»); em đạt ⇒ «dat»; ngày khác chốt như thường', async () => {
    const d = taoD1That()
    const env = d.env as unknown as Env
    const kh = d.sql.prepare("INSERT INTO ke_hoach_ngay(khoa,sbd,ngay,phien_ban,seed,ngan_sach_json,viec_json,canh_bao_json,cap_nhat_luc) VALUES(?,?,?,1,1,?,'{}','[]','x')")
    const ns = JSON.stringify({ toiThieuCau: 4 })
    kh.run('A|2026-10-27', 'A', '2026-10-27', ns); kh.run('B|2026-10-27', 'B', '2026-10-27', ns); kh.run('A|2026-10-26', 'A', '2026-10-26', ns)
    const sk = d.sql.prepare("INSERT INTO su_kien_hoc(khoa,sbd,qid,nguon,ma_nguon,lan,ket_qua,luc,ngay_vn,assistance) VALUES(?,?,?,'game','p',1,1,?,?,'none')")
    for (let i = 0; i < 6; i++) sk.run(`B|${i}`, 'B', `q${i}`, '2026-10-27T03:00:00Z', '2026-10-27')
    await chotNgayCu(env, ['A', 'B'], '2026-10-28', '2026-10-27T17:05:00Z')
    const r = Object.fromEntries((d.sql.prepare('SELECT khoa, ket_qua, la_ngay_nghi FROM ke_hoach_ngay ORDER BY khoa').all() as { khoa: string; ket_qua: string | null; la_ngay_nghi: number }[]).map((x) => [x.khoa, [x.ket_qua, x.la_ngay_nghi]]))
    expect(r['A|2026-10-27']).toEqual([null, 1])
    expect(r['B|2026-10-27']![1]).toBe(0); expect(r['B|2026-10-27']![0]).not.toBeNull(); expect(r['B|2026-10-27']![0]).not.toBe('khong')
    expect(r['A|2026-10-26']).toEqual(['khong', 0])
  })
})

describe('30/10 — khôi phục chuỗi 27/10 + 28/10 + 29/10 (thầy «khôi phục chuỗi cho học sinh bị mất hôm qua và hôm kia» · «khôi phục cả ngày 27/10 nữa»)', () => {
  it('em đủ mức 26/10, không đủ 27–29/10, đủ 30/10 ⇒ chuỗi nối liền, KHÔNG tiêu bình; ba ngày vẽ «được đỡ»', () => {
    const n = { ...nk(['2026-10-25', '2026-10-26', '2026-10-30']), soCau7: new Map([['2026-10-28', 6], ['2026-10-29', 3], ['2026-10-30', 24]]), muc: new Map([['2026-10-28', 24], ['2026-10-29', 24], ['2026-10-30', 24]]) }
    const r = chuoiNgayCuaEm(n, '2026-10-30')
    for (const d of ['2026-10-27', '2026-10-28', '2026-10-29']) expect(r.lich7.find((x) => x.ngay === d)!.kieu).toBe('phep')
    expect(r.so).toBe(3); expect(r.binhVuaDo).toBeUndefined()
  })
  it('em ĐÃ đủ mức 28/10 ⇒ vẫn được lửa +1 như thường', () => {
    const n = { ...nk(['2026-10-26']), soCau7: new Map([['2026-10-28', 24]]), muc: new Map([['2026-10-28', 24]]) }
    const r = chuoiNgayCuaEm(n, '2026-10-28')
    expect(r.lich7.find((x) => x.ngay === '2026-10-28')!.kieu).toBe('hoc'); expect(r.so).toBe(2)
  })
})
