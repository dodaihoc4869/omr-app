// THẺ "ĐƯỜNG VỀ ĐÍCH" (Dồn về đích; thầy chốt mẫu 21/09: docs/ban-ve-don-ve-dich-2109/; Boss 2 sửa: nộp trễ, ảnh thú ở lời chào [đã có ở DauTrang]): đọc CHẶT `veDich` + `no`; bốn trạng thái + qua hạn; đồng hồ đếm ngược
// theo giờ LUÔN hiện khi có nợ; "Tối nay: …"; MỘT nút ⇒ việc chưa xong đầu tiên; khối "Còn lại từ các ngày trước"; gạch tên ngày vừa trả; thiếu `veDich` ⇒ không dựng; phụ huynh không thấy; không "lười"/game.
// 27/10: thẻ `bang-nhiem-vu/TheVeDich` (+ ve-dich.css) đã gỡ khỏi src/ vì không màn nào dùng ⇒ các phép vẽ thẻ và khoá nguồn của nó bỏ theo; lớp đọc ve-dich-hien-thi còn sống nên giữ.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import fs from 'node:fs'
import path from 'node:path'
import { conLaiToiHan, chuHanNop, docMonNo, docVeDich, khoaMonNo, laSauGioCuoi, nhanCoHan, nhomNoTheoNgay, ngayVuaTraXong, tenMonNo, thuCuaNgay, thuNgayNgan, type VeDichView } from '../src/lib/ve-dich-hien-thi'
import { dongGoiBanNho, tuKeHoachNgay, type KeHoachNgayMayChu } from '../src/lib/nhiem-vu-adapter'
afterEach(cleanup)
const doc = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8')
const nhan = <T,>(o: T): T => JSON.parse(JSON.stringify(o))
const NOW = Date.parse('2026-09-22T19:05:00+07:00') // Thứ Ba
const HAN = '2026-09-25T05:00:00Z' // 12:00 Thứ Sáu 25/09
const chang = (tt: string[], ngay: string[] = []) => tt.map((t, i) => ({ chiSo: i, trangThai: t, ngay: ngay[i] ?? '2026-09-22' }))
const BAI_MOT_NO = {
  maBtvn: 'B1', ten: 'Ester – Lipid', hanNop: HAN, gioConLai: 64.92, quaHan: false, kip: true,
  chang: chang(['xong', 'no', 'hom_nay', 'sap_toi', 'sap_toi'], ['2026-09-21', '2026-09-21', '2026-09-22', '2026-09-23', '2026-09-24']),
  toiNay: { soChang: 2, soCau: 24, phut: 36, batDauMuonNhat: '2026-09-22T21:30:00+07:00' },
}
const NO_MOT = { theoNgay: [{ ngay: '2026-09-21', loai: 'chang_btvn', ten: 'Ester – Lipid', soCau: 12, phut: 18, maBtvn: 'B1', chiSo: 1 }, { ngay: '2026-09-21', loai: 'on_lai', ten: '', soCau: 5, phut: 6 }], tongCau: 17, tongPhut: 24 }
const KH = (them: object = {}) => ({ veDich: [BAI_MOT_NO], no: NO_MOT, ...them })
const vd = (them: object = {}): VeDichView => docVeDich(KH(them))!

describe('docVeDich — đọc chặt', () => {
  it('thân đúng ⇒ bài + nợ theo ngày; vắng `veDich` ⇒ null; rỗng cả hai ⇒ null; không phải mảng ⇒ null', () => {
    const v = vd()
    expect(v.bai).toHaveLength(1)
    expect(v.bai[0]).toMatchObject({ maBtvn: 'B1', ten: 'Ester – Lipid', quaHan: false, kip: true })
    expect(v.bai[0]!.chang.map((c) => c.trangThai)).toEqual(['xong', 'no', 'hom_nay', 'sap_toi', 'sap_toi'])
    expect(v.bai[0]!.toiNay).toEqual({ soChang: 2, soCau: 24, phut: 36, batDauMuonNhat: '2026-09-22T21:30:00+07:00' })
    expect(v.no).toMatchObject({ tongCau: 17, tongPhut: 24 })
    for (const x of [null, undefined, {}, { no: NO_MOT }, { veDich: 'x' }, { veDich: null }, { veDich: [], no: { theoNgay: [] } }, { veDich: [{}], no: {} }]) expect(docVeDich(x as never), JSON.stringify(x)).toBeNull()
  })
  it('CÓ `veDich: []` nhưng còn nợ ôn ⇒ vẫn dựng (chỉ khối ngày trước); chặng sai dạng / trạng thái lạ / thiếu hạn bị bỏ; chặng sắp theo chỉ số; toiNay 0 chặng ⇒ null', () => {
    const v = docVeDich({ veDich: [], no: NO_MOT })!
    expect(v.bai).toEqual([])
    expect(v.no.theoNgay).toHaveLength(2)
    const b = nhan(BAI_MOT_NO)
    b.chang = [{ chiSo: 2, trangThai: 'hom_nay', ngay: '2026-09-22' }, { chiSo: 0, trangThai: 'xong', ngay: '2026-09-20' }, { chiSo: 1, trangThai: 'la', ngay: '' }, { chiSo: -1, trangThai: 'no' }, 'x']
    b.toiNay = { soChang: 0, soCau: 0, phut: 0, batDauMuonNhat: '2026-09-22T21:30:00+07:00' }
    const r = docVeDich({ veDich: [b, { ...BAI_MOT_NO, maBtvn: '' }, { ...BAI_MOT_NO, hanNop: 'rác' }], no: {} })!
    expect(r.bai).toHaveLength(1)
    expect(r.bai[0]!.chang.map((c) => c.chiSo)).toEqual([0, 2])
    expect(r.bai[0]!.toiNay).toBeNull()
  })
  it('món nợ: sai dạng bỏ; loại lạ bỏ; sắp theo ngày tăng dần; số câu/phút là số nguyên ≥ 0', () => {
    expect(docMonNo({ ngay: '2026-09-21', loai: 'on_lai', soCau: 5, phut: 6 })).toMatchObject({ soCau: 5, chiSo: null })
    for (const x of [null, {}, { ngay: '21/09', loai: 'on_lai', soCau: 5, phut: 6 }, { ngay: '2026-09-21', loai: 'la', soCau: 5, phut: 6 }, { ngay: '2026-09-21', loai: 'on_lai', soCau: -1, phut: 6 }, { ngay: '2026-09-21', loai: 'on_lai', soCau: 5.5, phut: 6 }]) expect(docMonNo(x), JSON.stringify(x)).toBeNull()
    const v = docVeDich({ veDich: [], no: { theoNgay: [{ ngay: '2026-09-22', loai: 'on_lai', soCau: 1, phut: 1 }, { ngay: '2026-09-20', loai: 'on_lai', soCau: 2, phut: 2 }] } })!
    expect(v.no.theoNgay.map((m) => m.ngay)).toEqual(['2026-09-20', '2026-09-22'])
  })
})

describe('chữ / giờ thuần', () => {
  it('conLaiToiHan: 64 giờ 55 phút; qua hạn ⇒ null; chuHanNop; nhanCoHan (Thứ Sáu / Ngày mai / Hôm nay)', () => {
    expect(conLaiToiHan(HAN, NOW)).toEqual({ gio: 64, phut: 55 })
    expect(conLaiToiHan(HAN, Date.parse(HAN))).toBeNull()
    expect(conLaiToiHan('rác', NOW)).toBeNull()
    expect(chuHanNop(HAN)).toBe('12:00 · Thứ Sáu 25/09/2026')
    expect(nhanCoHan(HAN, NOW)).toBe('Thứ Sáu')
    expect(nhanCoHan(HAN, Date.parse('2026-09-24T19:00:00+07:00'))).toBe('Ngày mai')
    expect(nhanCoHan(HAN, Date.parse('2026-09-25T08:00:00+07:00'))).toBe('Hôm nay')
    expect(thuCuaNgay('2026-09-21')).toBe('Thứ Hai')
    expect(thuNgayNgan('2026-09-21')).toBe('Thứ Hai 21/09')
  })
  it('6 giờ cuối mới được dùng màu cảnh báo mạnh', () => {
    expect(laSauGioCuoi(HAN, Date.parse('2026-09-25T06:30:00+07:00'))).toBe(true)
    expect(laSauGioCuoi(HAN, Date.parse('2026-09-25T05:59:00+07:00'))).toBe(false)
    expect(laSauGioCuoi(HAN, Date.parse('2026-09-25T13:00:00+07:00'))).toBe(false) // đã qua
  })
  it('nhomNoTheoNgay + tenMonNo: chặng "Chặng 2 · 12 câu", gói, ôn; khoá món; ngày vừa trả xong', () => {
    const v = vd()
    const n = nhomNoTheoNgay(v.no.theoNgay)
    expect(n).toHaveLength(1)
    expect(n[0]).toMatchObject({ ngay: '2026-09-21', phut: 24, soCau: 17 })
    expect(tenMonNo(v.no.theoNgay[0]!)).toEqual({ tren: 'Chặng 2 · 12 câu', duoi: 'Ester – Lipid · khoảng 18 phút' })
    expect(tenMonNo(v.no.theoNgay[1]!)).toEqual({ tren: '5 câu ôn lại đã quá lịch', duoi: 'khoảng 6 phút' })
    expect(tenMonNo({ ngay: '2026-09-21', loai: 'goi_gia_dinh', ten: '', soCau: 6, phut: 8, maBtvn: '', chiSo: null }).tren).toBe('Gói gia đình giao · 6 câu')
    expect(khoaMonNo(v.no.theoNgay[0]!)).not.toBe(khoaMonNo(v.no.theoNgay[1]!))
    const nay = vd({ no: { theoNgay: [] } })
    expect(ngayVuaTraXong(v, nay)).toBe('2026-09-21')
    expect(ngayVuaTraXong(null, nay)).toBeNull()
    expect(ngayVuaTraXong(v, v)).toBeNull()
    const mot = vd({ no: { theoNgay: [NO_MOT.theoNgay[1]] } })
    expect(ngayVuaTraXong(v, mot)).toBeNull() // ngày còn món ⇒ chưa xong ngày
  })
})

describe('Bảng nhiệm vụ — nối thẻ', () => {
  const NOW_B = NOW
  const keHoach = (them: object = {}): KeHoachNgayMayChu =>
    ({
      ok: true,
      nganSach: { mucTieuCau: 12, toiThieuCau: 6, vanTocGiay: 78, vanTocNguon: 'do', ghiChuVanToc: '' },
      viec: [{ id: 'btvn_lo:B1:1', loai: 'btvn_lo', thuTu: 1, batBuoc: true, khan: false, cong: null, hien: true, nhan: null, trangThai: 'cho', ghiChu: '', chiTiet: { ma: 'B1', chiSo: 1, tongLo: 5 }, hanCung: new Date(NOW_B + 3600_000).toISOString(), hanMem: null, soCau: 12 }] as any,
      canhBao: [],
      quaHan: [],
      tienBo: { daLamCau: 0, lenBac: 0, conThieu: 6 },
      chuoiDat: 2,
      lanNghi: false,
      capNhatLuc: new Date(NOW_B - 60_000).toISOString(),
      ...them,
    }) as KeHoachNgayMayChu
  const phu = { dsBtvn: [{ maBtvn: 'B1', maCa: 'CA-1', tenBtvn: 'Ester – Lipid', soCau: 12 }], dsMomGiao: [] as any[] }
  const dl = (them: object = {}) => ({ ...tuKeHoachNgay(keHoach(them), NOW_B, phu), thanThu: { kieu: 'chua_biet' } as const })

  it('adapter: veDich đọc chặt vào duLieu.veDich; máy chủ chưa trả ⇒ null; bản nhớ KHÔNG lưu veDich', () => {
    expect(dl(KH()).veDich!.bai[0]!.maBtvn).toBe('B1')
    expect(dl().veDich).toBeNull()
    expect(dl({ veDich: 'x' }).veDich).toBeNull()
    expect(dongGoiBanNho(dl(KH()), NOW_B)!.duLieu.veDich).toBeNull()
  })
})

describe('NỘP TRỄ ở máy em (Điều 4 = B): thẻ "Đã qua Hạn nộp" không còn chặn khi máy chủ cho nộp', () => {
  const NOW_T = Date.parse('2026-09-26T10:00:00+07:00')
  const keHoachTre = (veDich: unknown): KeHoachNgayMayChu =>
    ({
      ok: true,
      nganSach: { mucTieuCau: 12, toiThieuCau: 6, vanTocGiay: 78, vanTocNguon: 'do', ghiChuVanToc: '' },
      viec: [],
      canhBao: [],
      quaHan: [{ loai: 'btvn', ma: 'B1', hanNop: '2026-09-25T05:00:00Z', conLai: 24 }],
      tienBo: { daLamCau: 0, lenBac: 0, conThieu: 6 },
      chuoiDat: 0,
      lanNghi: false,
      capNhatLuc: new Date(NOW_T - 60_000).toISOString(),
      ...(veDich === undefined ? {} : { veDich, no: { theoNgay: [] } }),
    }) as KeHoachNgayMayChu
  const phu = { dsBtvn: [{ maBtvn: 'B1', maCa: 'CA-1', tenBtvn: 'Ester – Lipid', soCau: 12 }], dsMomGiao: [] as any[] }
  const baiTre = (chang_: string[], quaHan = true) => ({ ...nhan(BAI_MOT_NO), quaHan, chang: chang(chang_, ['2026-09-20', '2026-09-22', '2026-09-23'].slice(0, chang_.length)), toiNay: null })
  it('chặng còn lại 0 ⇒ câu "em vẫn làm và nộp được"; máy chủ CŨ (không veDich) hoặc bài KHÔNG quaHan hoặc mã khác ⇒ GIỮ chữ cũ "nhờ Thầy gia hạn" và không nút', () => {
    expect(tuKeHoachNgay(keHoachTre([baiTre(['xong', 'xong'])]), NOW_T, phu).quaHan[0]!.chu).toBe('Bài đã qua Hạn nộp · em vẫn làm và nộp được · sẽ ghi nộp trễ')
    for (const kh of [keHoachTre(undefined), keHoachTre([baiTre(['xong', 'hom_nay'], false)]), keHoachTre([{ ...baiTre(['xong', 'hom_nay']), maBtvn: 'B9' }])]) {
      const q = tuKeHoachNgay(kh, NOW_T, phu).quaHan[0]!
      expect(q.chu).toBe('Đã qua Hạn nộp — nhờ Thầy gia hạn')
      expect(q.hanhDong).toBeUndefined()
    }
  })
  it('máy em KHÔNG tự chặn theo hạn: nguồn nộp chặng chỉ dịch lời của MÁY CHỦ (qua_han ⇒ câu chung), không so hạn với giờ máy', () => {
    const s = doc('src/lib/btvn-nop-chang-em.ts')
    expect(s).toMatch(/if \(ket\.lyDo === 'qua_han'\) return 'Bài đã quá hạn nộp\.'/)
    expect(s).not.toMatch(/hanNop|Date\.now\(\)\s*[<>]/)
  })
})
