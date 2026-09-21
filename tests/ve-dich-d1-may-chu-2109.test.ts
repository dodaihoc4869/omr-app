// @vitest-environment node
// "DỒN VỀ ĐÍCH" — phần ĐỌC-CHỈ của máy chủ (server/src/ve-dich-d1.ts, Code 3, 21/09/2026) trên D1 GIẢ BẰNG SQLITE THẬT (`taoD1That`).
// Khoá: em đúng nhịp ⇒ nợ 0/0/0, mỗi bài một chặng/buổi · lỡ chặng ⇒ nợ đúng ngày, chặng có 'no' + 'hom_nay', tối nay 2 chặng · lỡ 3 ngày sát hạn ⇒ kip:false + canRutPhanLamThem:true (đủ giờ ⇒ kip:true) ·
// hạn đã qua ⇒ quaHan, gioConLai 0, vẫn liệt kê chặng nợ (đúng biên 14 ngày) · bài đã nộp/thu hồi/xoá/của em khác không hiện · bài không chia chặng · gói gia đình giao chưa xong (biên nửa đêm VN, bỏ bài hằng ngày, biên 14 ngày) ·
// câu ôn quá lịch (mốc < hôm nay, trạng thái, ≤ 3 ngày, tổng không mất) · khung giờ học thật vs mặc định (biên 19/20 lượt, biên 14 ngày) · giây/câu thật (biên 4/5 mẫu, biên 30 ngày) · ca kiểm tra chặn khoảng giờ
// (khối, đã xoá/đóng, loại, phạm vi, biên 7 ngày, ca đang diễn ra) · chỉ đọc đúng sbd · ≤ 7 truy vấn (5 dữ liệu + 1 mốc tính nợ + 1 lùi), không ghi, không đổi bảng nào · không chữ/khoá của game · thiếu bảng ⇒ giá trị an toàn, lỗi D1 khác vẫn ném.
import { describe, expect, it } from 'vitest'
import { hopPhamVi } from '../server/src/index'
import { chuGameTrong } from '../server/src/chu-game'
import type { Env } from '../server/src/kieu'
import {
  GIO_HOC_SOM_NHAT, GIO_KHUNG_BAT_DAU_MUON_NHAT, NGAY_LIET_KE_BAI_QUA_HAN, PHUT_CA_MAC_DINH, SO_GIO_KHUNG_HOC, SO_NGAY_CA_SAP_TOI, SO_NGAY_GOI_GIA_DINH, SO_NGAY_KHUNG_GIO, TOI_DA_BAI_DANG_CHAY,
  TOI_THIEU_LUOT_KHUNG_GIO, docVeDichCuaEm, gomOnQuaLich, khungGioTuLuotTheoGio, phamViHop,
} from '../server/src/ve-dich-d1'
import { taoD1That, type D1That } from './_d1-that'

const T = (s: string): number => Date.parse(`${s}+07:00`)
const vnIso = (s: string): string => new Date(T(s)).toISOString()
const KHONG_NO = { theoNgay: [], tongCau: 0, tongPhut: 0 }

// ------------------------------------------------------------------ dựng dữ liệu ------------------------------------------------------------------
function dung(): D1That {
  const d = taoD1That()
  d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,nam_sinh,lop,mat_khau,cap_nhat_luc) VALUES('S1','Nguyễn Thu Hà','2009','12','mk','x')").run()
  d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,nam_sinh,lop,mat_khau,cap_nhat_luc) VALUES('S2','Trần Bình','2009','12','mk','x')").run()
  // Sửa CÓ CHỦ Ý 21/09 (W3c, mốc tính nợ 12:00 trưa 21/09): các ca dưới đây kiểm luật nợ THUẦN, dữ liệu dựng từ cả ngày trước 21/09 ⇒ đặt mốc hiển thị về xa (2000-01-01) để chúng không bị mốc lọc;
  // hành vi theo mốc có test riêng ở tests/moc-no-2109.test.ts.
  d.sql.prepare("INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('hien_thi_tu','2000-01-01','x')").run()
  return d
}

interface OBtvn {
  sbd?: string
  ten?: string
  giao?: string
  han: string
  /** Có `chang` ⇒ bài cá nhân hoá đã chốt: số câu từng chặng (ghi vào `btvn_em_cau`). */
  chang?: number[]
  chot?: string
  loDaXong?: number
  nop?: string | null
  thuHoi?: 0 | 1
  xoa?: 0 | 1
  lich?: unknown
  soCau?: number
  caNhan?: 0 | 1
}
const themBtvn = (d: D1That, ma: string, o: OBtvn): void => {
  const sbd = o.sbd ?? 'S1'
  const caNhan = o.caNhan ?? (o.chang ? 1 : 0)
  const tong = o.chang ? o.chang.reduce((a, b) => a + b, 0) : o.soCau ?? 10
  d.sql.prepare("INSERT OR IGNORE INTO ca(ma_ca,ten_ca,trang_thai,loai,cap_nhat_luc) VALUES(?,?,?,?,?)").run(`CA-${ma}`, o.ten ?? `Bài ${ma}`, 'mo', 'baitap', 'x')
  d.sql.prepare('INSERT OR IGNORE INTO btvn(ma_btvn,ma_ca,ma_de,so_cau,giao_luc,han_nop,da_xoa,cap_nhat_luc,ca_nhan) VALUES(?,?,?,?,?,?,?,?,?)')
    .run(ma, `CA-${ma}`, 'DE', o.soCau ?? tong, o.giao ?? '2026-09-21T03:00:00.000Z', o.han, o.xoa ?? 0, 'x', caNhan)
  d.sql.prepare('INSERT INTO btvn_em(khoa,ma_btvn,sbd,ho_ten,nop_luc,so_cau,so_chang,so_cau_em,chot_luc,chang_mo_json,lo_da_xong,thu_hoi) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)')
    .run(`${ma}|${sbd}`, ma, sbd, 'Em', o.nop === undefined ? null : o.nop, tong, o.chang ? o.chang.length : null, o.chang ? tong : null, o.chang ? o.chot ?? vnIso('2026-09-21T20:30:00') : null, o.lich === undefined ? null : JSON.stringify(o.lich), o.loDaXong ?? 0, o.thuHoi ?? 0)
  ;(o.chang ?? []).forEach((n, k) => {
    for (let i = 0; i < n; i++) d.sql.prepare('INSERT INTO btvn_em_cau(khoa,ma_btvn,sbd,qid,chang,nhan,thu_tu) VALUES(?,?,?,?,?,?,?)').run(`${ma}|${sbd}|${ma}-${k}-${i}`, ma, sbd, `${ma}-${k}-${i}`, k, 'loi', i)
  })
}
const themMom = (d: D1That, id: string, o: { sbd?: string; luc: string; soCau?: number; nop?: string | null; ten?: string }): void => {
  d.sql.prepare("INSERT INTO mom_bai(sbd,id,title,created_at,question_count,bank_key,submitted_at,answers) VALUES(?,?,?,?,?,?,?,'{}')")
    .run(o.sbd ?? 'S1', id, o.ten ?? `Gia đình giao thêm · ${o.soCau ?? 6} câu`, o.luc, o.soCau ?? 6, 'k', o.nop ?? null)
}
let demCau = 0
const themOn = (d: D1That, o: { sbd?: string; moc: string | null; tt?: string; dayLai?: number }): void => {
  const q = `Q-${++demCau}`
  d.sql.prepare(
    `INSERT INTO nam_kt_cau(khoa,sbd,qid,ma_dang,chuyen_de,lan_gap,lan_sai,lan_trong,dung_lien_tiep,ngay_dung_khac_nhau,ket_qua_cuoi,nguon_cuoi,luc_cuoi,moc_on_ke,trang_thai,can_day_lai,giay_tb,cap_nhat_luc)
     VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
  ).run(`${o.sbd ?? 'S1'}|${q}`, o.sbd ?? 'S1', q, 'ES', 'Este', 1, 1, 0, 0, 0, 0, 'thi', 'x', o.moc, o.tt ?? 'moi_sai', o.dayLai ?? 0, null, 'x')
}
const themOnNhieu = (d: D1That, n: number, o: { sbd?: string; moc: string | null; tt?: string; dayLai?: number }): void => { for (let i = 0; i < n; i++) themOn(d, o) }
const themSk = (d: D1That, o: { sbd?: string; ngay: string; gio: string; giay?: number | null; nguon?: string }): void => {
  d.sql.prepare('INSERT INTO su_kien_hoc(khoa,sbd,qid,nguon,ma_nguon,lan,ket_qua,giay,luc,ngay_vn) VALUES(?,?,?,?,?,?,?,?,?,?)')
    .run(`k${++demCau}`, o.sbd ?? 'S1', `Q-${demCau}`, o.nguon ?? 'on_lai', 'm', 1, 1, o.giay === undefined ? null : o.giay, vnIso(`${o.ngay}T${o.gio}:00`), o.ngay)
}
interface OCa { ma: string; batDau: string; phut?: number | null; lop?: string | null; tt?: string; loai?: string; phamVi?: string | null; ds?: string | null }
const themCaThi = (d: D1That, o: OCa): void => {
  d.sql.prepare('INSERT INTO ca(ma_ca,ten_ca,trang_thai,loai,bat_dau,thoi_gian_phut,lop,pham_vi,danh_sach_chon_json,cap_nhat_luc) VALUES(?,?,?,?,?,?,?,?,?,?)')
    .run(o.ma, `Ca ${o.ma}`, o.tt ?? 'mo', o.loai ?? 'thi', vnIso(o.batDau), o.phut === undefined ? 45 : o.phut, o.lop === undefined ? '12' : o.lop, o.phamVi ?? null, o.ds ?? null, 'x')
}

/** Bọc D1: ghi lại mọi câu SQL + giá trị bind; `batch` bị cấm (đọc-chỉ). */
function theoDoi(d: D1That): { env: Env; log: { sql: string; bind: unknown[] }[] } {
  const log: { sql: string; bind: unknown[] }[] = []
  const env = {
    ...d.env,
    DB: {
      prepare: (q: string) => {
        const ban = { sql: q.replace(/\s+/g, ' ').trim(), bind: [] as unknown[] }
        log.push(ban)
        const st = d.env.DB.prepare(q)
        const bind = st.bind.bind(st)
        st.bind = (...a: unknown[]) => { ban.bind = a; return bind(...a) }
        return st
      },
      batch: async () => { throw new Error('phần đọc-chỉ không được dùng batch') },
    },
  } as unknown as Env
  return { env, log }
}
const chay = (d: D1That, sbd: string, now: number) => docVeDichCuaEm(d.env, sbd, now)

// ------------------------------------------------------------------ các bài mẫu ------------------------------------------------------------------
/** Chặng 0 mở lúc chốt 21/09 20:30, chặng k mở 00:00 ngày 21+k (lịch cũ `moLucChang`); hạn 25/09 12:00. */
const HAN_25 = vnIso('2026-09-25T12:00:00')
const bai3 = (d: D1That, loDaXong = 0): void => themBtvn(d, 'B1', { ten: 'Bài Este', chang: [12, 14, 13], han: HAN_25, loDaXong })
const bai5 = (d: D1That, loDaXong = 1): void => themBtvn(d, 'B2', { ten: 'Bài Amin', chang: [14, 14, 14, 14, 14], han: HAN_25, loDaXong })

// ================================================================== ĐÚNG NHỊP / LỠ / SÁT HẠN / QUÁ HẠN ==================================================================
describe('em đúng nhịp: nợ 0/0/0 (số 0 THẬT), mỗi bài một chặng mỗi buổi', () => {
  it('chưa làm chặng nào nhưng đúng ngày: chặng 0 hôm nay, các chặng sau sắp tới; mỗi buổi đúng 1 chặng', async () => {
    const d = dung(); bai3(d)
    const r = await chay(d, 'S1', T('2026-09-21T21:00:00'))
    expect(r.no).toEqual(KHONG_NO)
    expect(r.veDich).toHaveLength(1)
    const v = r.veDich[0]!
    expect(v).toMatchObject({ maBtvn: 'B1', ten: 'Bài Este', hanNop: HAN_25, gioConLai: 87, quaHan: false, kip: true, canRutPhanLamThem: false, daRutPhanLamThem: false })
    expect(v.chang).toEqual([{ chiSo: 0, trangThai: 'hom_nay', ngay: '2026-09-21' }, { chiSo: 1, trangThai: 'sap_toi', ngay: '2026-09-22' }, { chiSo: 2, trangThai: 'sap_toi', ngay: '2026-09-23' }])
    expect(v.toiNay).toEqual({ soChang: 1, soCau: 12, phut: 18, batDauMuonNhat: '2026-09-21T22:12:00+07:00' }) // 22:30 − 18 phút
    expect(v.cacBuoiSau.map((b) => [b.ngay, b.chang.length, b.soCau])).toEqual([['2026-09-22', 1, 14], ['2026-09-23', 1, 13]])
  })
  it('đã xong hai chặng đầu: còn một chặng hôm nay, không nợ', async () => {
    const d = dung(); bai3(d, 2)
    const r = await chay(d, 'S1', T('2026-09-23T09:00:00'))
    expect(r.no).toEqual(KHONG_NO)
    expect(r.veDich[0]!.chang.map((c) => c.trangThai)).toEqual(['xong', 'xong', 'hom_nay'])
    expect(r.veDich[0]!.toiNay).toMatchObject({ soChang: 1, soCau: 13, phut: 20 })
  })
  it('chặng chưa mở (mở 00:00 ngày mai) KHÔNG bị xếp vào tối nay: tối nay trống, buổi của chặng là ngày mai', async () => {
    const d = dung(); bai3(d, 2)
    const r = await chay(d, 'S1', T('2026-09-22T09:00:00')) // xong 2 chặng đầu; chặng 3 mở 00:00 ngày 23
    const v = r.veDich[0]!
    expect(v.chang.map((c) => c.trangThai)).toEqual(['xong', 'xong', 'sap_toi'])
    expect(v.toiNay).toBeNull()
    expect(v.cacBuoiSau.map((b) => [b.ngay, b.chang.map((c) => c.chiSo)])).toEqual([['2026-09-23', [2]]])
    expect(r.no).toEqual(KHONG_NO)
  })
  it('em không có bài nào / không có gì trong sổ ⇒ đúng dạng rỗng; sbd rỗng hoặc giờ hỏng cũng vậy', async () => {
    const d = dung(); bai3(d)
    expect(await chay(d, 'S2', T('2026-09-21T21:00:00'))).toEqual({ no: KHONG_NO, veDich: [] })
    expect(await chay(d, '', T('2026-09-21T21:00:00'))).toEqual({ no: KHONG_NO, veDich: [] })
    expect(await chay(d, 'S1', Number.NaN)).toEqual({ no: KHONG_NO, veDich: [] })
  })
})

describe('lỡ một chặng: nợ đúng ngày, chặng có "no" + "hom_nay", tối nay hai chặng', () => {
  it('chặng mở hôm qua chưa làm ⇒ đúng một món nợ gắn ngày hôm qua; tối nay 2 chặng (27 câu, 41 phút)', async () => {
    const d = dung(); bai3(d, 1)
    const r = await chay(d, 'S1', T('2026-09-23T09:00:00'))
    expect(r.no).toEqual({ theoNgay: [{ ngay: '2026-09-22', loai: 'chang_btvn', ten: 'Bài Este · chặng 2', soCau: 14, phut: 21, maBtvn: 'B1', chiSo: 1 }], tongCau: 14, tongPhut: 21 })
    const v = r.veDich[0]!
    expect(v.chang).toEqual([{ chiSo: 0, trangThai: 'xong', ngay: '2026-09-21' }, { chiSo: 1, trangThai: 'no', ngay: '2026-09-22' }, { chiSo: 2, trangThai: 'hom_nay', ngay: '2026-09-23' }])
    expect(v.toiNay).toEqual({ soChang: 2, soCau: 27, phut: 41, batDauMuonNhat: '2026-09-23T21:49:00+07:00' }) // 22:30 − 41 phút
    expect(v.kip).toBe(true)
  })
  it('biên nửa đêm VN: 23:59 ngày 22 chưa có nợ, 00:00 ngày 23 thì có (chặng mở đúng 00:00 ngày 22)', async () => {
    const d = dung(); bai3(d, 1)
    expect((await chay(d, 'S1', T('2026-09-22T23:59:00'))).no).toEqual(KHONG_NO)
    expect((await chay(d, 'S1', T('2026-09-23T00:00:00'))).no.theoNgay.map((m) => m.chiSo)).toEqual([1])
  })
  it('lỡ chặng nhưng lịch đã lưu theo GIỜ (hạn ngắn) được dùng, không phải lịch ngày: chặng mở tối nay là "hom_nay"', async () => {
    const d = dung()
    const lich = { cheDo: 'ngan', chang: [{ moLuc: '2026-09-23T13:00:00.000Z', dungNhipTruoc: '2026-09-23T16:59:00.000Z' }, { moLuc: '2026-09-23T14:20:00.000Z', dungNhipTruoc: '2026-09-23T16:59:00.000Z' }, { moLuc: '2026-09-23T15:40:00.000Z', dungNhipTruoc: '2026-09-23T16:59:00.000Z' }] }
    themBtvn(d, 'B5', { chang: [10, 10, 10], chot: '2026-09-23T13:00:00.000Z', lich, han: '2026-09-24T05:00:00.000Z', loDaXong: 1 })
    const r = await chay(d, 'S1', T('2026-09-23T21:00:00'))
    expect(r.veDich[0]!.chang.map((c) => c.trangThai)).toEqual(['xong', 'hom_nay', 'hom_nay']) // lịch ngày cũ sẽ cho 'sap_toi' (mở 00:00 ngày 24)
    expect(r.no).toEqual(KHONG_NO)
  })
  it('lịch đã lưu hỏng ⇒ dùng lịch cũ, không nổ', async () => {
    const d = dung()
    themBtvn(d, 'B1', { ten: 'Bài Este', chang: [12, 14, 13], han: HAN_25, loDaXong: 1 })
    d.sql.prepare("UPDATE btvn_em SET chang_mo_json = 'không phải json'").run()
    const r = await chay(d, 'S1', T('2026-09-23T09:00:00'))
    expect(r.veDich[0]!.chang.map((c) => c.trangThai)).toEqual(['xong', 'no', 'hom_nay'])
  })
})

describe('lỡ 3 ngày sát hạn: không kịp ⇒ kip:false + canRutPhanLamThem:true; đủ giờ ⇒ kip:true', () => {
  it('sáng ngày hạn (09:00, hạn 12:00), nợ 3 chặng ngày 22/23/24 + chặng hôm nay: 2 chặng/buổi không đủ ⇒ không kịp, phải rút phần làm thêm', async () => {
    const d = dung(); bai5(d)
    const r = await chay(d, 'S1', T('2026-09-25T09:00:00'))
    expect(r.no.theoNgay.map((m) => [m.ngay, m.chiSo])).toEqual([['2026-09-22', 1], ['2026-09-23', 2], ['2026-09-24', 3]])
    expect(r.no).toMatchObject({ tongCau: 42, tongPhut: 63 })
    const v = r.veDich[0]!
    expect(v.chang.map((c) => c.trangThai)).toEqual(['xong', 'no', 'no', 'no', 'hom_nay'])
    expect(v).toMatchObject({ gioConLai: 3, quaHan: false, kip: false, canRutPhanLamThem: true, daRutPhanLamThem: false })
    expect(v.toiNay).toMatchObject({ soChang: 2, soCau: 28 }) // chỉ xếp được 2 chặng nợ đầu; 2 chặng còn lại không có buổi nào trước hạn
    expect(v.cacBuoiSau).toEqual([])
  })
  it('cùng bài nhưng còn thêm một ngày (24/09 09:00): đủ giờ ⇒ kip:true, canRutPhanLamThem:false; nợ trước, buổi sau là sáng ngày hạn', async () => {
    const d = dung(); bai5(d)
    const r = await chay(d, 'S1', T('2026-09-24T09:00:00'))
    expect(r.no.theoNgay.map((m) => m.ngay)).toEqual(['2026-09-22', '2026-09-23'])
    const v = r.veDich[0]!
    expect(v).toMatchObject({ gioConLai: 27, kip: true, canRutPhanLamThem: false })
    expect(v.toiNay).toMatchObject({ soChang: 2, soCau: 28, phut: 42 })
    expect(v.cacBuoiSau.map((b) => [b.ngay, b.chang.map((c) => c.chiSo)])).toEqual([['2026-09-25', [3, 4]]])
    // mọi buổi xong trước hạn
    for (const b of [...v.cacBuoiSau, { batDauMuonNhat: v.toiNay!.batDauMuonNhat, phut: v.toiNay!.phut }]) expect(Date.parse(b.batDauMuonNhat) + b.phut * 60_000).toBeLessThanOrEqual(Date.parse(HAN_25))
  })
})

describe('hạn đã qua (Điều 4 B): quaHan, gioConLai 0, vẫn liệt kê chặng còn nợ', () => {
  it('quá hạn 22 giờ: mọi chặng chưa làm đều là nợ, không còn buổi nào', async () => {
    const d = dung(); bai5(d)
    const r = await chay(d, 'S1', T('2026-09-26T10:00:00'))
    expect(r.no.theoNgay.map((m) => [m.ngay, m.chiSo])).toEqual([['2026-09-22', 1], ['2026-09-23', 2], ['2026-09-24', 3], ['2026-09-25', 4]])
    expect(r.veDich[0]).toMatchObject({ maBtvn: 'B2', hanNop: HAN_25, gioConLai: 0, quaHan: true, toiNay: null, cacBuoiSau: [], kip: false, canRutPhanLamThem: true, daRutPhanLamThem: false })
    expect(r.veDich[0]!.chang.map((c) => c.trangThai)).toEqual(['xong', 'no', 'no', 'no', 'no'])
  })
  it('hạn đúng lúc này (không phải "còn 0 giờ"): coi là quá hạn', async () => {
    const d = dung(); bai3(d, 1)
    const r = await chay(d, 'S1', Date.parse(HAN_25))
    expect(r.veDich[0]).toMatchObject({ quaHan: true, gioConLai: 0 })
  })
  it(`chỉ liệt kê bài quá hạn tới ${NGAY_LIET_KE_BAI_QUA_HAN} ngày: hạn đúng mốc cắt thì KHÔNG hiện, chậm 1 giây thì hiện`, async () => {
    const d = dung()
    const now = T('2026-09-26T10:00:00') // 03:00:00Z; mốc cắt = 12/09 03:00:00Z
    themBtvn(d, 'CU', { chang: [5], han: '2026-09-12T03:00:00.000Z' })
    themBtvn(d, 'MOI', { chang: [5], han: '2026-09-12T03:00:01.000Z' })
    themBtvn(d, 'XA', { chang: [5], han: '2026-09-01T03:00:00.000Z' })
    expect((await chay(d, 'S1', now)).veDich.map((v) => v.maBtvn)).toEqual(['MOI'])
  })
})

// ================================================================== BÀI NÀO HIỆN ==================================================================
describe('bài nào hiện: chưa nộp, chưa thu hồi, chưa xoá, của đúng em', () => {
  it('bài đã nộp / thu hồi / xoá / của em khác KHÔNG hiện và không tạo nợ; nộp rỗng ("") vẫn là chưa nộp', async () => {
    const d = dung()
    const nghiem = (ma: string, o: Partial<OBtvn>) => themBtvn(d, ma, { chang: [10, 10, 10], chot: vnIso('2026-09-15T20:30:00'), han: vnIso('2026-09-30T12:00:00'), ...o }) // nếu lọt vào sẽ là nợ nặng
    nghiem('DANOP', { nop: '2026-09-20T10:00:00.000Z' })
    nghiem('THUHOI', { thuHoi: 1 })
    nghiem('DAXOA', { xoa: 1 })
    nghiem('CUA-S2', { sbd: 'S2' })
    nghiem('NOP-RONG', { nop: '' })
    bai3(d)
    const r = await chay(d, 'S1', T('2026-09-21T21:00:00'))
    expect(r.veDich.map((v) => v.maBtvn)).toEqual(['B1', 'NOP-RONG']) // theo hạn nộp tăng dần (25/09 rồi 30/09)
    expect(r.no.theoNgay.every((m) => m.maBtvn === 'NOP-RONG')).toBe(true)
    expect(r.no.theoNgay.length).toBeGreaterThan(0)
  })
  it('tối đa 20 bài, hạn sớm nhất trước', async () => {
    expect(TOI_DA_BAI_DANG_CHAY).toBe(20)
    const d = dung()
    for (let i = 0; i < 25; i++) themBtvn(d, `B${String(i).padStart(2, '0')}`, { chang: [5], han: vnIso(`2026-10-${String(1 + i).padStart(2, '0')}T12:00:00`) })
    const r = await chay(d, 'S1', T('2026-09-21T21:00:00'))
    expect(r.veDich).toHaveLength(20)
    expect(r.veDich[0]!.maBtvn).toBe('B00')
    expect(r.veDich[19]!.maBtvn).toBe('B19')
  })
  it('tên bài rất dài bị cắt còn 120 ký tự; tên rỗng ⇒ "Bài tập về nhà"; khoảng trắng thừa được gọn', async () => {
    const d = dung()
    themBtvn(d, 'DAI', { ten: `  ${'Bài rất dài '.repeat(30)}  `, chang: [5], han: vnIso('2026-09-27T12:00:00') })
    themBtvn(d, 'TRONG', { ten: '   ', chang: [5], han: vnIso('2026-09-28T12:00:00') })
    themBtvn(d, 'CACH', { ten: 'Bài   Este\n  nâng   cao', chang: [5], han: vnIso('2026-09-29T12:00:00') })
    const r = await chay(d, 'S1', T('2026-09-21T21:00:00'))
    expect(r.veDich.map((v) => v.ten.length)).toEqual([120, 'Bài tập về nhà'.length, 'Bài Este nâng cao'.length])
    expect(r.veDich[1]!.ten).toBe('Bài tập về nhà')
    expect(r.veDich[2]!.ten).toBe('Bài Este nâng cao')
  })
  it('bài không chia chặng (bài cũ): MỘT chặng, chưa có lịch ⇒ không nợ trước hạn; lo_da_xong của lô cũ không làm chặng "xong"', async () => {
    const d = dung()
    themBtvn(d, 'CU', { caNhan: 0, soCau: 20, giao: '2026-09-19T03:00:00.000Z', han: vnIso('2026-09-25T12:00:00'), loDaXong: 1 })
    const r = await chay(d, 'S1', T('2026-09-23T09:00:00'))
    expect(r.no).toEqual(KHONG_NO)
    expect(r.veDich[0]!.chang).toEqual([{ chiSo: 0, trangThai: 'hom_nay', ngay: '2026-09-23' }])
    expect(r.veDich[0]!.toiNay).toMatchObject({ soChang: 1, soCau: 20, phut: 30 })
  })
  it('bài cũ quá hạn từ ngày trước ⇒ MỘT món nợ gắn NGÀY HẠN (Điều 4 B); quá hạn cùng ngày thì chưa là nợ', async () => {
    const d = dung()
    themBtvn(d, 'CU', { caNhan: 0, soCau: 20, giao: '2026-09-19T03:00:00.000Z', han: vnIso('2026-09-22T12:00:00') })
    const r = await chay(d, 'S1', T('2026-09-23T09:00:00'))
    expect(r.no.theoNgay).toEqual([{ ngay: '2026-09-22', loai: 'chang_btvn', ten: 'Bài CU · chặng 1', soCau: 20, phut: 30, maBtvn: 'CU', chiSo: 0 }])
    expect(r.veDich[0]).toMatchObject({ quaHan: true, gioConLai: 0 })
    expect((await chay(d, 'S1', T('2026-09-22T15:00:00'))).no).toEqual(KHONG_NO)
  })
  it('bài cá nhân hoá đã chốt nhưng CHƯA có dòng bộ câu nào: một chặng, số câu = số câu của em (so_cau_em), không phải số câu cả bài', async () => {
    const d = dung()
    themBtvn(d, 'CHOT', { caNhan: 1, soCau: 80, han: vnIso('2026-09-24T12:00:00') })
    d.sql.prepare("UPDATE btvn_em SET so_cau_em = 25, so_chang = 3, chot_luc = ? WHERE ma_btvn = 'CHOT'").run(vnIso('2026-09-21T08:00:00'))
    const r = await chay(d, 'S1', T('2026-09-21T09:00:00'))
    expect(r.veDich[0]!.chang).toHaveLength(1)
    expect(r.veDich[0]!.toiNay).toMatchObject({ soChang: 1, soCau: 25, phut: 38 })
  })
  it('bộ câu có khe (chặng giữa không còn câu nào): vẫn đủ số chặng theo chỉ số lớn nhất, chặng khe có 0 câu', async () => {
    const d = dung()
    themBtvn(d, 'KHE', { chang: [10, 0, 10], han: vnIso('2026-09-27T12:00:00') })
    const r = await chay(d, 'S1', T('2026-09-21T21:00:00'))
    expect(r.veDich[0]!.chang.map((c) => c.chiSo)).toEqual([0, 1, 2])
  })
  it('hạn nộp hỏng (không đọc được): bỏ bài đó, không làm hỏng các bài khác và không sinh số NaN', async () => {
    const d = dung(); bai3(d)
    themBtvn(d, 'HONG', { chang: [10], han: 'khong-ro-han' })
    const r = await chay(d, 'S1', T('2026-09-21T21:00:00'))
    expect(r.veDich.map((v) => v.maBtvn)).toEqual(['B1'])
    expect(JSON.stringify(r)).not.toMatch(/null|NaN/)
  })
  it('bài cá nhân hoá em CHƯA mở (chưa chốt): số câu ước = min(số câu bài, số ngày còn lại × 16), không nợ', async () => {
    const d = dung()
    themBtvn(d, 'CHUA', { caNhan: 1, soCau: 80, han: vnIso('2026-09-24T12:00:00') }) // 21/09 09:00 → hạn 24/09 12:00 = 75 giờ ⇒ 4 ngày × 16 = 64
    const r = await chay(d, 'S1', T('2026-09-21T09:00:00'))
    expect(r.no).toEqual(KHONG_NO)
    expect(r.veDich[0]!.toiNay).toMatchObject({ soChang: 1, soCau: 64, phut: 96 })
  })
})

// ================================================================== GÓI GIA ĐÌNH · ÔN QUÁ LỊCH ==================================================================
describe('gói gia đình giao chưa xong của ngày trước thành nợ', () => {
  const NOW = T('2026-09-23T09:00:00')
  it('chỉ gói CHƯA nộp, KHÔNG phải bài hằng ngày, tạo ngày VN < hôm nay, trong 14 ngày; mỗi gói một món; biên nửa đêm VN đúng', async () => {
    const d = dung()
    themMom(d, 'giao_them_2026-09-22_1', { luc: '2026-09-22T05:00:00.000Z', soCau: 6 }) // 22/09 12:00 VN
    themMom(d, 'giao_them_2026-09-22_2', { luc: '2026-09-22T16:59:59.000Z', soCau: 4 }) // 22/09 23:59:59 VN — vẫn là ngày trước
    themMom(d, 'giao_them_2026-09-23_1', { luc: '2026-09-22T17:00:00.000Z', soCau: 9 }) // 00:00:00 ngày 23 VN = hôm nay ⇒ KHÔNG nợ
    themMom(d, 'daily_2026-09-22', { luc: '2026-09-22T05:00:00.000Z', soCau: 8 }) // bài hằng ngày ⇒ không dồn
    themMom(d, 'DA-NOP', { luc: '2026-09-22T05:00:00.000Z', soCau: 7, nop: '2026-09-22T12:00:00.000Z' })
    themMom(d, 'CUA-S2', { sbd: 'S2', luc: '2026-09-22T05:00:00.000Z', soCau: 5 })
    themMom(d, 'BIEN-TRONG', { luc: '2026-09-09T05:00:00.000Z', soCau: 3 }) // ngày 09/09 = hôm nay − 14 ⇒ còn tính
    themMom(d, 'BIEN-NGOAI', { luc: '2026-09-08T16:59:59.000Z', soCau: 11 }) // 08/09 23:59:59 VN ⇒ quá 14 ngày
    themMom(d, 'RONG', { luc: '2026-09-22T05:00:00.000Z', soCau: 0 })
    d.sql.prepare("UPDATE mom_bai SET submitted_at = '' WHERE id = 'giao_them_2026-09-22_2'").run() // nộp rỗng = chưa nộp
    const r = await chay(d, 'S1', NOW)
    expect(r.no.theoNgay.map((m) => [m.ngay, m.loai, m.soCau, m.phut])).toEqual([['2026-09-09', 'goi_gia_dinh', 3, 5], ['2026-09-22', 'goi_gia_dinh', 6, 9], ['2026-09-22', 'goi_gia_dinh', 4, 6]])
    expect(r.no.theoNgay[1]!.ten).toBe('Gia đình giao thêm · 6 câu')
    expect(r.no).toMatchObject({ tongCau: 13, tongPhut: 20 })
    expect(SO_NGAY_GOI_GIA_DINH).toBe(14)
  })
  it('nợ gói gia đình không tự sinh bài BTVN: veDich vẫn rỗng khi em không có bài', async () => {
    const d = dung()
    themMom(d, 'giao_them_2026-09-22_1', { luc: '2026-09-22T05:00:00.000Z', soCau: 6 })
    const r = await chay(d, 'S1', NOW)
    expect(r.veDich).toEqual([])
    expect(r.no.theoNgay).toHaveLength(1)
  })
})

describe('câu ôn quá lịch thành nợ, gom theo ngày mốc, tối đa 3 ngày, không mất câu nào', () => {
  it('chỉ câu từng sai còn đang ôn, mốc < hôm nay, chưa "cần dạy lại"; 5 ngày mốc ⇒ 3 dòng (ngày cũ dồn vào ngày cũ nhất trong ba)', async () => {
    const d = dung()
    themOnNhieu(d, 2, { moc: '2026-09-22' }); themOn(d, { moc: '2026-09-22', tt: 'dang_on' }) // 22/09: 3 câu
    themOnNhieu(d, 2, { moc: '2026-09-21', tt: 'da_khac_phuc' }) // 21/09: 2 câu
    themOnNhieu(d, 4, { moc: '2026-09-20' })
    themOnNhieu(d, 5, { moc: '2026-09-19' })
    themOnNhieu(d, 7, { moc: '2026-09-15' })
    // KHÔNG được tính:
    themOnNhieu(d, 9, { moc: '2026-09-23' }) // mốc = hôm nay (tới hạn hôm nay, chưa quá lịch)
    themOnNhieu(d, 4, { moc: '2026-09-24' })
    themOnNhieu(d, 2, { moc: '2026-09-22', dayLai: 1 })
    themOnNhieu(d, 2, { moc: '2026-09-22', tt: 'chua_thay_sai' })
    themOnNhieu(d, 2, { moc: null })
    themOnNhieu(d, 5, { sbd: 'S2', moc: '2026-09-22' })
    const r = await chay(d, 'S1', T('2026-09-23T09:00:00'))
    expect(r.no.theoNgay.map((m) => [m.ngay, m.loai, m.ten, m.soCau, m.phut])).toEqual([
      ['2026-09-20', 'on_lai', 'Ôn lại', 16, 24], // 4 + 5 + 7 dồn về ngày cũ nhất trong ba
      ['2026-09-21', 'on_lai', 'Ôn lại', 2, 3],
      ['2026-09-22', 'on_lai', 'Ôn lại', 3, 5],
    ])
    expect(r.no).toMatchObject({ tongCau: 21, tongPhut: 32 })
  })
  it('ít hơn 3 ngày mốc thì giữ nguyên từng ngày', async () => {
    const d = dung()
    themOnNhieu(d, 4, { moc: '2026-09-22' }); themOnNhieu(d, 1, { moc: '2026-09-18' })
    expect((await chay(d, 'S1', T('2026-09-23T09:00:00'))).no.theoNgay.map((m) => [m.ngay, m.soCau])).toEqual([['2026-09-18', 1], ['2026-09-22', 4]])
  })
  it('nợ nhiều loại cùng ngày: sắp theo ngày tăng, trong ngày chặng → gói → ôn; tổng cộng đủ', async () => {
    const d = dung(); bai3(d, 1)
    themMom(d, 'giao_them_2026-09-22_1', { luc: '2026-09-22T05:00:00.000Z', soCau: 6 })
    themOnNhieu(d, 5, { moc: '2026-09-22' })
    const r = await chay(d, 'S1', T('2026-09-23T09:00:00'))
    expect(r.no.theoNgay.map((m) => [m.ngay, m.loai])).toEqual([['2026-09-22', 'chang_btvn'], ['2026-09-22', 'goi_gia_dinh'], ['2026-09-22', 'on_lai']])
    expect(r.no.tongCau).toBe(14 + 6 + 5)
    expect(r.no.tongPhut).toBe(r.no.theoNgay.reduce((s, m) => s + m.phut, 0))
  })
})

describe('gomOnQuaLich (hàm thuần)', () => {
  it('giữ 3 ngày mới nhất, dồn phần cũ vào ngày cũ nhất trong ba, trả tăng dần, tổng không đổi; số lạ bị bỏ', () => {
    const r = gomOnQuaLich([{ ngay: '2026-09-10', soCau: 4 }, { ngay: '2026-09-20', soCau: 3 }, { ngay: '2026-09-18', soCau: 2 }, { ngay: '2026-09-19', soCau: 1 }, { ngay: '2026-09-01', soCau: 6 }, { ngay: '2026-09-21', soCau: 0 }, { ngay: 'hỏng', soCau: 9 }, { ngay: '2026-09-22', soCau: -2 }, { ngay: '2026-09-17', soCau: Number.NaN }])
    expect(r).toEqual([{ ngay: '2026-09-18', soCau: 2 + 4 + 6 }, { ngay: '2026-09-19', soCau: 1 }, { ngay: '2026-09-20', soCau: 3 }])
    expect(gomOnQuaLich([])).toEqual([])
    expect(gomOnQuaLich([{ ngay: '2026-09-20', soCau: 3 }, { ngay: '2026-09-19', soCau: 1 }, { ngay: '2026-09-18', soCau: 2 }])).toEqual([{ ngay: '2026-09-18', soCau: 2 }, { ngay: '2026-09-19', soCau: 1 }, { ngay: '2026-09-20', soCau: 3 }])
  })
})

// ================================================================== KHUNG GIỜ HỌC · GIÂY/CÂU ==================================================================
describe('khung giờ học thật của em (su_kien_hoc 14 ngày) so với mặc định 19:30–22:30', () => {
  const NOW = T('2026-09-22T08:00:00')
  /** Bài: chặng 1 (14 câu = 21 phút) mở hôm nay; hạn xa. Không nợ. */
  const baiTuNgay = (d: D1That) => themBtvn(d, 'B1', { ten: 'Bài Este', chang: [12, 14, 13], han: vnIso('2026-09-26T12:00:00'), loDaXong: 1 })
  /** n lượt học vào 16:10 / 17:10 (xen kẽ) trải trên các ngày 09/09 … 20/09. */
  const luotChieu = (d: D1That, n: number, sbd = 'S1') => {
    for (let i = 0; i < n; i++) themSk(d, { sbd, ngay: `2026-09-${String(9 + (i % 12)).padStart(2, '0')}`, gio: i % 2 === 0 ? '16:10' : '17:10' })
  }
  const toiNay = async (d: D1That) => (await chay(d, 'S1', NOW)).veDich[0]!.toiNay

  it('không có lượt nào ⇒ khung mặc định: bắt đầu muộn nhất = 22:30 − 21 phút', async () => {
    const d = dung(); baiTuNgay(d)
    expect((await toiNay(d))!.batDauMuonNhat).toBe('2026-09-22T22:09:00+07:00')
  })
  it('đủ 20 lượt học chiều (16–18 giờ) ⇒ khung 16:00–19:00: bắt đầu muộn nhất = 19:00 − 21 phút', async () => {
    const d = dung(); baiTuNgay(d); luotChieu(d, TOI_THIEU_LUOT_KHUNG_GIO)
    expect((await toiNay(d))!.batDauMuonNhat).toBe('2026-09-22T18:39:00+07:00')
  })
  it('19 lượt thì CHƯA đủ tin ⇒ vẫn khung mặc định (biên 19/20)', async () => {
    const d = dung(); baiTuNgay(d); luotChieu(d, TOI_THIEU_LUOT_KHUNG_GIO - 1)
    expect((await toiNay(d))!.batDauMuonNhat).toBe('2026-09-22T22:09:00+07:00')
  })
  it(`chỉ tính ${SO_NGAY_KHUNG_GIO} ngày gần nhất (hôm nay và ${SO_NGAY_KHUNG_GIO - 1} ngày trước): 30 lượt chiều của ngày thứ ${SO_NGAY_KHUNG_GIO + 1} KHÔNG đổi khung; 30 lượt của ngày thứ ${SO_NGAY_KHUNG_GIO} thì tính`, async () => {
    const d = dung(); baiTuNgay(d)
    for (let i = 0; i < 30; i++) themSk(d, { ngay: '2026-09-08', gio: '16:10' }) // hôm nay 22/09 − 14 ngày ⇒ ngoài cửa sổ [09/09, 22/09]
    expect((await toiNay(d))!.batDauMuonNhat).toBe('2026-09-22T22:09:00+07:00')
    const d2 = dung(); baiTuNgay(d2)
    for (let i = 0; i < 30; i++) themSk(d2, { ngay: '2026-09-09', gio: '16:10' }) // 09/09 còn trong cửa sổ
    expect((await toiNay(d2))!.batDauMuonNhat).toBe('2026-09-22T18:39:00+07:00')
  })
  it('lượt học của em khác không làm đổi khung của em này', async () => {
    const d = dung(); baiTuNgay(d); luotChieu(d, 40, 'S2')
    expect((await toiNay(d))!.batDauMuonNhat).toBe('2026-09-22T22:09:00+07:00')
  })
})

describe('khungGioTuLuotTheoGio (hàm thuần)', () => {
  const gio = (o: Record<number, number>): number[] => Array.from({ length: 24 }, (_, i) => o[i] ?? 0)
  it('biên 20 lượt: 19 ⇒ null, 20 ⇒ có khung', () => {
    expect(khungGioTuLuotTheoGio(gio({ 20: 19 }))).toBeNull()
    expect(khungGioTuLuotTheoGio(gio({ 20: 20 }))).not.toBeNull()
    expect(TOI_THIEU_LUOT_KHUNG_GIO).toBe(20)
  })
  it('cửa sổ 3 giờ nhiều lượt nhất; cuối kẹp 22:30; hoà thì ôm đúng giờ có nhiều lượt hơn, rồi sớm hơn', () => {
    expect(khungGioTuLuotTheoGio(gio({ 19: 10, 20: 10, 21: 10 }))).toEqual({ tu: '19:00', den: '22:00' })
    expect(khungGioTuLuotTheoGio(gio({ 21: 15, 22: 15 }))).toEqual({ tu: '20:00', den: '22:30' }) // (20,21,22) = 30 > (19,20,21) = 15
    expect(khungGioTuLuotTheoGio(gio({ 7: 10, 8: 10 }))).toEqual({ tu: '07:00', den: '10:00' })
    expect(khungGioTuLuotTheoGio(gio({ 16: 12, 17: 12 }))).toEqual({ tu: '16:00', den: '19:00' }) // hoà (15,16,17) = (16,17,18) = 24 ⇒ khung ôm giờ 16
    expect(khungGioTuLuotTheoGio(gio({ 9: 12, 12: 12 }))).toEqual({ tu: '09:00', den: '12:00' }) // (9,10,11) = 12, (10,11,12) = 12, (12,13,14) = 12: hoà ⇒ giờ mở đầu nhiều hơn ⇒ 09:00, không phải 10:00
  })
  it('lượt chỉ nằm ngoài 07:00–23:00 (đêm khuya / rạng sáng) ⇒ null (dùng khung mặc định); không bao giờ ra khung ngoài 07:00–22:30', () => {
    expect(khungGioTuLuotTheoGio(gio({ 5: 25 }))).toBeNull()
    expect(khungGioTuLuotTheoGio(gio({ 23: 30, 2: 5 }))).toBeNull()
    for (let h = 0; h < 24; h++) {
      const k = khungGioTuLuotTheoGio(gio({ [h]: 40 }))
      if (h < GIO_HOC_SOM_NHAT || h > GIO_KHUNG_BAT_DAU_MUON_NHAT + SO_GIO_KHUNG_HOC - 1) expect(k).toBeNull()
      else {
        expect(k!.tu >= '07:00' && k!.den <= '22:30').toBe(true)
        expect(Number(k!.tu.slice(0, 2))).toBeLessThanOrEqual(h)
        expect(Number(k!.tu.slice(0, 2)) + SO_GIO_KHUNG_HOC).toBeGreaterThan(h)
      }
    }
  })
})

describe('giây/câu thật của em quyết định số phút của chặng (cùng luật `tinhVanToc` của kế hoạch ngày)', () => {
  const NOW = T('2026-09-23T09:00:00')
  const dungBai = (d: D1That) => bai3(d, 1) // nợ chặng 2 (14 câu) + chặng hôm nay
  const phutNo = async (d: D1That) => (await chay(d, 'S1', NOW)).no.theoNgay[0]!.phut
  it('không đủ mẫu ⇒ 90 giây/câu (14 câu = 21 phút); đủ 5 mẫu 60 giây ⇒ 14 phút (biên 4/5)', async () => {
    const d = dung(); dungBai(d)
    for (let i = 0; i < 4; i++) themSk(d, { ngay: '2026-09-20', gio: '10:00', giay: 60, nguon: 'thi' })
    expect(await phutNo(d)).toBe(21)
    themSk(d, { ngay: '2026-09-20', gio: '10:00', giay: 60, nguon: 'thi' })
    expect(await phutNo(d)).toBe(14)
  })
  it('chỉ tính mẫu trong 30 ngày (đúng ngày thứ 30 còn tính, ngày thứ 31 thì không)', async () => {
    const d = dung(); dungBai(d)
    for (let i = 0; i < 4; i++) themSk(d, { ngay: '2026-08-24', gio: '10:00', giay: 60, nguon: 'thi' }) // 30 ngày trước ⇒ còn tính
    themSk(d, { ngay: '2026-08-23', gio: '10:00', giay: 60, nguon: 'thi' }) // 31 ngày trước ⇒ bỏ
    expect(await phutNo(d)).toBe(21) // mới 4 mẫu
    themSk(d, { ngay: '2026-08-24', gio: '10:00', giay: 60, nguon: 'thi' })
    expect(await phutNo(d)).toBe(14)
  })
  it('mẫu của em khác không tính', async () => {
    const d = dung(); dungBai(d)
    for (let i = 0; i < 9; i++) themSk(d, { sbd: 'S2', ngay: '2026-09-20', gio: '10:00', giay: 60, nguon: 'thi' })
    expect(await phutNo(d)).toBe(21)
  })
})

// ================================================================== CA KIỂM TRA SẮP TỚI ==================================================================
describe('ca kiểm tra sắp tới của lớp em chặn khoảng giờ đó trong kế hoạch', () => {
  const NOW = T('2026-09-22T08:00:00')
  const baiNhe = (d: D1That) => themBtvn(d, 'B1', { ten: 'Bài Este', chang: [12, 14, 13], han: vnIso('2026-09-26T12:00:00'), loDaXong: 1 }) // tối nay: chặng 14 câu = 21 phút
  const muon = async (d: D1That, now = NOW) => (await chay(d, 'S1', now)).veDich[0]!.toiNay?.batDauMuonNhat ?? null
  const KHONG_CHAN = '2026-09-22T22:09:00+07:00'
  it('ca 21:00–21:45: khoảng trống dài nhất là 19:30–21:00 ⇒ bắt đầu muộn nhất = 21:00 − 21 phút; ca của khối khác / rỗng lớp / không rõ thì theo luật khối', async () => {
    const d = dung(); baiNhe(d); themCaThi(d, { ma: 'CA1', batDau: '2026-09-22T21:00:00' })
    expect(await muon(d)).toBe('2026-09-22T20:39:00+07:00')
    const d2 = dung(); baiNhe(d2); themCaThi(d2, { ma: 'CA1', batDau: '2026-09-22T21:00:00', lop: null }) // ca cả trường
    expect(await muon(d2)).toBe('2026-09-22T20:39:00+07:00')
    const d3 = dung(); baiNhe(d3); themCaThi(d3, { ma: 'CA1', batDau: '2026-09-22T21:00:00', lop: '11' }) // khối khác
    expect(await muon(d3)).toBe(KHONG_CHAN)
  })
  it('ca đã xoá / đã đóng / bài tập (không phải ca thi) / thiếu giờ bắt đầu KHÔNG chặn', async () => {
    const d = dung(); baiNhe(d)
    themCaThi(d, { ma: 'XOA', batDau: '2026-09-22T21:00:00', tt: 'da_xoa' })
    themCaThi(d, { ma: 'DONG', batDau: '2026-09-22T21:00:00', tt: 'dong' })
    themCaThi(d, { ma: 'BT', batDau: '2026-09-22T21:00:00', loai: 'baitap' })
    d.sql.prepare("INSERT INTO ca(ma_ca,ten_ca,trang_thai,loai,cap_nhat_luc) VALUES('KHONG-GIO','x','mo','thi','x')").run()
    expect(await muon(d)).toBe(KHONG_CHAN)
  })
  it('ca không có thời gian làm bài ⇒ tính 45 phút (như cổng vào thi)', async () => {
    const d = dung(); baiNhe(d); themCaThi(d, { ma: 'CA1', batDau: '2026-09-22T21:00:00', phut: null })
    expect(PHUT_CA_MAC_DINH).toBe(45)
    expect(await muon(d)).toBe('2026-09-22T20:39:00+07:00') // như ca 45 phút
    const d2 = dung(); baiNhe(d2); themCaThi(d2, { ma: 'CA1', batDau: '2026-09-22T21:00:00', phut: 120 }) // 21:00–23:00 ⇒ trống còn 19:30–21:00
    expect(await muon(d2)).toBe('2026-09-22T20:39:00+07:00')
  })
  it('phạm vi ca: "chọn từng em" chỉ chặn em có tên; "theo khối" chỉ chặn đúng năm sinh', async () => {
    const chan = '2026-09-22T20:39:00+07:00'
    for (const [pv, ds, ky] of [['chon', '["S1","S2"]', chan], ['chon', '["S2"]', KHONG_CHAN], ['chon', '[]', chan], ['chon', null, chan], ['khoi', '"2009"', chan], ['khoi', '"2010"', KHONG_CHAN], ['khoi', null, chan], ['tu_do', '["S2"]', chan]] as const) {
      const d = dung(); baiNhe(d); themCaThi(d, { ma: 'CA1', batDau: '2026-09-22T21:00:00', phamVi: pv, ds })
      expect(await muon(d), `${pv} ${ds}`).toBe(ky)
    }
  })
  it('em chưa có hồ sơ tài khoản mà chỉ có trong danh sách lớp: lấy khối / năm sinh từ danh sách lớp; hồ sơ tài khoản thắng danh sách khi có cả hai; danh sách của em khác không lọt vào', async () => {
    const dsRow = (d: D1That, sbd: string, lop: string, nam: string) => d.sql.prepare("INSERT INTO danh_sach(sbd,ho_ten,nam_sinh,lop,cap_nhat_luc) VALUES(?,?,?,?,'x')").run(sbd, `Em ${sbd}`, nam, lop)
    const dungS3 = (ca: OCa) => {
      const d = dung()
      dsRow(d, 'S3', '11', '2011'); dsRow(d, 'S2', '12', '2009')
      themBtvn(d, 'B1', { sbd: 'S3', ten: 'Bài Este', chang: [12, 14, 13], han: vnIso('2026-09-26T12:00:00'), loDaXong: 1 })
      themCaThi(d, ca)
      return d
    }
    const muonS3 = async (d: D1That) => (await chay(d, 'S3', NOW)).veDich[0]!.toiNay?.batDauMuonNhat
    expect(await muonS3(dungS3({ ma: 'K11', batDau: '2026-09-22T21:00:00', lop: '11' }))).toBe('2026-09-22T20:39:00+07:00') // khối 11 lấy từ danh sách lớp
    expect(await muonS3(dungS3({ ma: 'K12', batDau: '2026-09-22T21:00:00', lop: '12' }))).toBe(KHONG_CHAN) // khối 12 là của S2, không phải S3
    expect(await muonS3(dungS3({ ma: 'N11', batDau: '2026-09-22T21:00:00', lop: null, phamVi: 'khoi', ds: '"2011"' }))).toBe('2026-09-22T20:39:00+07:00') // năm sinh từ danh sách lớp
    expect(await muonS3(dungS3({ ma: 'N09', batDau: '2026-09-22T21:00:00', lop: null, phamVi: 'khoi', ds: '"2009"' }))).toBe(KHONG_CHAN)
    // hồ sơ tài khoản (khối 12, sinh 2009) thắng danh sách lớp (khối 11, sinh 2011) khi có cả hai
    const d = dung(); baiNhe(d)
    dsRow(d, 'S1', '11', '2011')
    themCaThi(d, { ma: 'K12', batDau: '2026-09-22T21:00:00', lop: '12' })
    expect(await muon(d)).toBe('2026-09-22T20:39:00+07:00')
    const d2 = dung(); baiNhe(d2)
    dsRow(d2, 'S1', '11', '2011')
    themCaThi(d2, { ma: 'K11', batDau: '2026-09-22T21:00:00', lop: '11' })
    expect(await muon(d2)).toBe(KHONG_CHAN)
  })
  it('ca ĐANG diễn ra chặn phần còn lại của tối nay; ca đã kết thúc thì không', async () => {
    const now = T('2026-09-22T21:30:00')
    const d = dung(); baiNhe(d); themCaThi(d, { ma: 'DANG', batDau: '2026-09-22T21:00:00', phut: 90 }) // tới 22:30 ⇒ hết khung học tối nay
    expect(await muon(d, now)).toBeNull()
    const d2 = dung(); baiNhe(d2); themCaThi(d2, { ma: 'XONG', batDau: '2026-09-22T21:00:00', phut: 20 }) // tới 21:20 ⇒ đã xong
    expect(await muon(d2, now)).toBe(KHONG_CHAN)
  })
  it(`chỉ tính ca bắt đầu trong ${SO_NGAY_CA_SAP_TOI} ngày tới (đúng mốc còn tính, sau mốc thì bỏ)`, async () => {
    // 9 chặng mở mỗi ngày 22…30/09, hạn 02/10: mỗi tối một chặng; ca dài 15 giờ phủ kín khung tối ngày 29/09.
    const dung9 = (batDau: string) => {
      const d = dung()
      themBtvn(d, 'B9', { chang: [10, 10, 10, 10, 10, 10, 10, 10, 10], chot: vnIso('2026-09-22T00:00:00'), han: vnIso('2026-10-02T12:00:00') })
      themCaThi(d, { ma: 'XA', batDau, phut: 15 * 60 })
      return d
    }
    const buoi29 = async (d: D1That) => (await chay(d, 'S1', NOW)).veDich[0]!.cacBuoiSau.find((b) => b.ngay === '2026-09-29')
    expect(await buoi29(dung9('2026-09-29T07:30:00'))).toBeUndefined() // 07:30 < 08:00 (chưa tới 7 ngày sau) ⇒ chặn hết tối 29/09
    expect(await buoi29(dung9('2026-09-29T08:00:00'))).toBeUndefined() // đúng 7 ngày sau (08:00) vẫn còn tính
    expect((await buoi29(dung9('2026-09-29T08:30:00')))?.batDauMuonNhat).toBe('2026-09-29T22:15:00+07:00') // 08:30 > 08:00 ⇒ bỏ, tối 29 còn nguyên (15 phút cho 10 câu)
  })
})

describe('phamViHop khớp hopPhamVi của index.ts (cổng vào thi) trên nhiều đầu vào', () => {
  it('cùng kết quả cho mọi tổ hợp phạm vi / danh sách / năm sinh', () => {
    const pvs = [undefined, null, '', 'tu_do', 'sbd', 'khoi', 'chon', 'la']
    const dss = [undefined, null, '', ' ', '["S1"]', '["S2"]', '["S2","S1"]', '[]', 'hỏng', '"2009"', '"2010"', '2009', '"09"']
    const nams = [undefined, null, '', '2009', '2010', ' 2009 ']
    let dem = 0
    for (const pham_vi of pvs) for (const danh_sach_chon_json of dss) for (const nam of nams) {
      const ca = { pham_vi, danh_sach_chon_json }
      expect(phamViHop(ca, nam, 'S1'), JSON.stringify({ ca, nam })).toBe(hopPhamVi(ca, nam === undefined ? null : { nam_sinh: nam }, 'S1').ok)
      dem++
    }
    expect(dem).toBe(pvs.length * dss.length * nams.length)
  })
})

// ================================================================== CHỈ ĐỌC · ĐÚNG SBD · KHÔNG GAME · THIẾU BẢNG ==================================================================
/** Dựng em S1 đủ mọi nguồn + em S2 khác hẳn (dữ liệu của S2 mà lọt vào S1 sẽ làm sai số). */
function dungDay(): D1That {
  const d = dung()
  bai5(d)
  themBtvn(d, 'BS2', { sbd: 'S2', chang: [30, 30], han: vnIso('2026-09-25T12:00:00') })
  themMom(d, 'giao_them_2026-09-22_1', { luc: '2026-09-22T05:00:00.000Z', soCau: 6 })
  themMom(d, 'CUA-S2', { sbd: 'S2', luc: '2026-09-22T05:00:00.000Z', soCau: 40 })
  themOnNhieu(d, 5, { moc: '2026-09-22' }); themOnNhieu(d, 50, { sbd: 'S2', moc: '2026-09-22' })
  for (let i = 0; i < 24; i++) themSk(d, { ngay: `2026-09-${String(10 + (i % 12)).padStart(2, '0')}`, gio: i % 2 === 0 ? '16:10' : '17:10' })
  for (let i = 0; i < 40; i++) themSk(d, { sbd: 'S2', ngay: '2026-09-20', gio: '20:30', giay: 200, nguon: 'thi' })
  themCaThi(d, { ma: 'CA1', batDau: '2026-09-24T18:00:00' })
  return d
}
const NOW_DAY = T('2026-09-23T09:00:00')
const BANG = ['hoc_sinh', 'danh_sach', 'ca', 'btvn', 'btvn_em', 'btvn_em_cau', 'mom_bai', 'nam_kt_cau', 'nam_kt_dang', 'su_kien_hoc', 'ke_hoach_ngay', 'ph_truy_cap', 'student_notice']

describe('chỉ đọc đúng sbd: em khác không lọt vào', () => {
  it('kết quả của S1 và S2 độc lập; mọi truy vấn chỉ bind sbd của em được hỏi', async () => {
    const d = dungDay()
    const t1 = theoDoi(d)
    const r1 = await docVeDichCuaEm(t1.env, 'S1', NOW_DAY)
    expect(r1.veDich.map((v) => v.maBtvn)).toEqual(['B2'])
    // B2 (lo_da_xong 1): chặng 2 mở 22/09 ⇒ nợ 14 câu; chặng 3 mở 00:00 hôm nay ⇒ chưa nợ. Cộng gói gia đình 6 câu và 5 câu ôn — không có gì của S2 (30 + 30 + 40 + 50 câu).
    expect(r1.no.theoNgay.map((m) => [m.loai, m.soCau])).toEqual([['chang_btvn', 14], ['goi_gia_dinh', 6], ['on_lai', 5]])
    expect(r1.no.tongCau).toBe(25)
    const t2 = theoDoi(d)
    const r2 = await docVeDichCuaEm(t2.env, 'S2', NOW_DAY)
    expect(r2.veDich.map((v) => v.maBtvn)).toEqual(['BS2'])
    expect(r2.no.theoNgay.map((m) => [m.ngay, m.loai, m.soCau])).toEqual([['2026-09-21', 'chang_btvn', 30], ['2026-09-22', 'chang_btvn', 30], ['2026-09-22', 'goi_gia_dinh', 40], ['2026-09-22', 'on_lai', 50]])
    expect(r2.no.tongCau).toBe(150)
    for (const [t, sbd, khac] of [[t1, 'S1', 'S2'], [t2, 'S2', 'S1']] as const) {
      for (const q of t.log) {
        if (/FROM cau_hinh WHERE khoa IN \(\?, \?, \?\)/.test(q.sql)) continue // sửa CÓ CHỦ Ý 21/09 (W3c): truy vấn MỐC tính nợ là cấu hình CHUNG, không chứa dữ liệu của em nào
        const cacBind = q.bind.filter((x) => typeof x === 'string')
        expect(cacBind, q.sql).toContain(sbd)
        expect(cacBind, q.sql).not.toContain(khac)
      }
    }
  })
})

describe('chỉ đọc: ≤ 7 truy vấn, không ghi, không đổi bảng nào, không đụng bảng game', () => {
  it('đường thường: 6 truy vấn (5 dữ liệu + 1 mốc tính nợ); không câu ghi nào; mọi bảng nguyên vẹn; không dùng batch', async () => {
    const d = dungDay()
    const truoc = BANG.map((b) => d.chup(b))
    const t = theoDoi(d)
    const r = await docVeDichCuaEm(t.env, 'S1', NOW_DAY)
    expect(r.veDich.length).toBeGreaterThan(0) // chống test rỗng
    expect(t.log.length, t.log.map((q) => q.sql).join('\n')).toBeGreaterThanOrEqual(4)
    expect(t.log.length, t.log.map((q) => q.sql).join('\n')).toBeLessThanOrEqual(7)
    expect(t.log).toHaveLength(6)
    for (const q of t.log) {
      expect(q.sql, q.sql).not.toMatch(/\b(INSERT|UPDATE|DELETE|REPLACE|DROP|ALTER|CREATE|PRAGMA|VACUUM)\b/i)
      expect(q.sql, q.sql).toMatch(/^\s*(SELECT|WITH)\b/i)
      expect(q.sql, q.sql).not.toMatch(/exp_|manh_khien|khien|than_thu|game_v2|doan_ho|vo_dai|\bpet\b/i)
    }
    expect(BANG.map((b) => d.chup(b))).toEqual(truoc)
    expect(d.soLenh.batch).toBe(0)
  })
  it('thiếu bảng "nâng đỡ" (btvn_em_cau): lùi một truy vấn, tổng vẫn ≤ 7; bài đọc như một chặng', async () => {
    const d = dungDay()
    d.sql.exec('DROP TABLE btvn_em_cau')
    const t = theoDoi(d)
    const r = await docVeDichCuaEm(t.env, 'S1', NOW_DAY)
    expect(t.log.length).toBeLessThanOrEqual(7)
    expect(r.veDich[0]!.chang).toHaveLength(1) // không còn biết chia chặng ⇒ một chặng
    expect(r.no.theoNgay.some((m) => m.loai === 'goi_gia_dinh')).toBe(true) // các phần khác vẫn đủ
  })
})

describe('không một trường / chữ nào của game', () => {
  const KHOA_CAM = /than_?thu|thanThu|\bexp\b|khien|manh|doan|dao|vo_?dai|game|pet\b|hat_giong|thuSucThem/i
  const moi = (v: unknown, ra: { khoa: string[]; chu: string[] } = { khoa: [], chu: [] }) => {
    if (Array.isArray(v)) v.forEach((x) => moi(x, ra))
    else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) { ra.khoa.push(k); moi(x, ra) }
    else if (typeof v === 'string') ra.chu.push(v)
    return ra
  }
  it('mọi khoá và mọi chữ của kết quả sạch; tên bài / gói có chữ game bị thay bằng tên chung', async () => {
    const d = dungDay()
    themBtvn(d, 'B3', { ten: 'Bài nuôi thần thú và khiên EXP', chang: [8], han: vnIso('2026-09-27T12:00:00') })
    themMom(d, 'giao_them_2026-09-21_1', { luc: '2026-09-21T05:00:00.000Z', soCau: 5, ten: 'Gói game Đảo thần thú' })
    const r = await docVeDichCuaEm(d.env, 'S1', NOW_DAY)
    expect(r.veDich.find((v) => v.maBtvn === 'B3')!.ten).toBe('Bài tập về nhà')
    expect(r.no.theoNgay.find((m) => m.ngay === '2026-09-21' && m.loai === 'goi_gia_dinh')!.ten).toBe('Bài gia đình giao')
    const { khoa, chu } = moi(r)
    expect(khoa.filter((k) => KHOA_CAM.test(k)), khoa.join(',')).toEqual([])
    for (const c of chu) expect(chuGameTrong(c), c).toEqual([])
    expect(JSON.stringify(r)).not.toMatch(/thần\s*thú|khiên|\bEXP\b|game/i)
  })
  it('đúng tập khoá cấp trên (không phát minh trường): no{theoNgay,tongCau,tongPhut}; mỗi bài đúng 11 trường; toiNay đúng 4 trường; chang đúng 3 trường', async () => {
    const d = dungDay()
    const r = await docVeDichCuaEm(d.env, 'S1', NOW_DAY)
    expect(Object.keys(r).sort()).toEqual(['no', 'veDich'])
    expect(Object.keys(r.no).sort()).toEqual(['theoNgay', 'tongCau', 'tongPhut'])
    expect(Object.keys(r.veDich[0]!).sort()).toEqual(['cacBuoiSau', 'canRutPhanLamThem', 'chang', 'daRutPhanLamThem', 'gioConLai', 'hanNop', 'kip', 'maBtvn', 'quaHan', 'ten', 'toiNay'].sort())
    expect(Object.keys(r.veDich[0]!.toiNay!).sort()).toEqual(['batDauMuonNhat', 'phut', 'soCau', 'soChang'])
    expect(Object.keys(r.veDich[0]!.chang[0]!).sort()).toEqual(['chiSo', 'ngay', 'trangThai'])
  })
})

describe('thiếu bảng ⇒ giá trị an toàn của phần đó; lỗi D1 khác vẫn ném', () => {
  it('thiếu mom_bai, nam_kt_cau, su_kien_hoc: không nổ; chỉ mất đúng các phần ấy (nợ chặng còn nguyên, khung giờ mặc định, 90 giây/câu)', async () => {
    const d = dungDay()
    const truoc = await docVeDichCuaEm(d.env, 'S1', NOW_DAY)
    expect(truoc.veDich[0]!.toiNay!.batDauMuonNhat).toBe('2026-09-23T18:18:00+07:00') // khung chiều 16:00–19:00 (24 lượt) trừ 42 phút
    d.sql.exec('DROP TABLE mom_bai; DROP TABLE nam_kt_cau; DROP TABLE su_kien_hoc')
    const r = await docVeDichCuaEm(d.env, 'S1', NOW_DAY)
    expect(r.no.theoNgay.map((m) => m.loai)).toEqual(['chang_btvn'])
    expect(r.veDich[0]!.toiNay).toMatchObject({ soChang: 2, soCau: 28, phut: 42, batDauMuonNhat: '2026-09-23T21:48:00+07:00' }) // khung mặc định 22:30 − 42 phút
  })
  it('thiếu danh_sach (không đọc được lớp + ca): không có ca nào chặn giờ, bài vẫn đủ', async () => {
    const d = dung(); bai5(d)
    themCaThi(d, { ma: 'CA-TOI', batDau: '2026-09-23T20:00:00', phut: 150 }) // 20:00–22:30: khung 19:30–22:30 chỉ còn 30 phút ⇒ 1 chặng
    const truoc = await docVeDichCuaEm(d.env, 'S1', NOW_DAY)
    expect(truoc.veDich[0]!.toiNay!.soChang).toBe(1)
    d.sql.exec('DROP TABLE danh_sach')
    const sau = await docVeDichCuaEm(d.env, 'S1', NOW_DAY)
    expect(sau.veDich[0]!.toiNay!.soChang).toBe(2)
    expect(sau.no).toEqual(truoc.no)
  })
  it('lỗi D1 KHÔNG phải thiếu bảng thì ném ra (không nuốt lỗi thật)', async () => {
    const env = { DB: { prepare: () => ({ bind: () => ({ all: async () => { throw new Error('D1_ERROR: hết hạn mức') } }) }) } } as unknown as Env
    await expect(docVeDichCuaEm(env, 'S1', NOW_DAY)).rejects.toThrow(/hết hạn mức/)
  })
})
