// MỐC TÍNH NỢ `tuNgay` của "Dồn về đích" (thầy lệnh 21/09 15:52: "những ngày trước trong thẻ về đích chỉ cho tính từ 12h trưa hôm nay, những ngày trước đó không tính"; Code 1).
// soNo bỏ món có ngày < tuNgay (cả ba loại), giữ món đúng ngày mốc; vắng / sai dạng ⇒ y hệt cũ. `trangThaiChangTheoMoc`: chặng có mốc gốc trước tuNgay mà chưa làm ⇒ 'hom_nay' (không nhãn nợ).
import { describe, expect, it } from 'vitest'
import { mulberry32 } from '../src/lib/exam-shuffle'
import { soNo, trangThaiChangTheoMoc, type BaiDangChay, type GoiGiaDinhChuaXong, type MonNo, type OnQuaLich } from '../src/lib/ve-dich'

const vn = (s: string) => Date.parse(`${s}:00+07:00`)
const MS_NGAY = 86_400_000
const dauNgay = (ms: number) => Math.floor((ms + 7 * 3600_000) / MS_NGAY) * MS_NGAY - 7 * 3600_000
const ngayVn = (ms: number) => new Date(ms + 7 * 3600_000).toISOString().slice(0, 10)

const NOW = vn('2026-09-23T09:00') // sáng 23/09: nợ của 19, 20, 21, 22
const bai: BaiDangChay = {
  maBtvn: 'B1', ten: 'Bài Este', hanNop: '2026-09-26T12:00:00+07:00',
  moLuc: ['2026-09-19T20:30:00+07:00', '2026-09-20T00:00:00+07:00', '2026-09-21T10:00:00+07:00', '2026-09-22T00:00:00+07:00', '2026-09-23T00:00:00+07:00', '2026-09-24T00:00:00+07:00'],
  daXong: 0, cauMoiChang: [10, 11, 12, 13, 14, 15], phutMoiChang: [15, 16, 18, 19, 21, 22],
}
const on: OnQuaLich[] = [{ ngay: '2026-09-20', soCau: 4 }, { ngay: '2026-09-21', soCau: 5 }, { ngay: '2026-09-22', soCau: 6 }]
const goi: GoiGiaDinhChuaXong[] = [{ ngay: '2026-09-19', soCau: 7, ten: 'Gói A', phut: 10 }, { ngay: '2026-09-21', soCau: 8, ten: 'Gói B', phut: 12 }]
const tong = (ds: readonly MonNo[]) => ({ cau: ds.reduce((s, m) => s + m.soCau, 0), phut: ds.reduce((s, m) => s + m.phut, 0) })

describe('soNo có tuNgay', () => {
  const cu = soNo({ now: NOW, baiDangChay: [bai], onQuaLich: on, goiGiaDinh: goi })
  it('món trước ngày mốc bị BỎ ở cả ba loại; món ĐÚNG ngày mốc được giữ; tổng câu / phút khớp phần còn lại', () => {
    const kq = soNo({ now: NOW, baiDangChay: [bai], onQuaLich: on, goiGiaDinh: goi, tuNgay: '2026-09-21' })
    expect(kq.every((m) => m.ngay >= '2026-09-21')).toBe(true)
    expect(kq.some((m) => m.ngay === '2026-09-21')).toBe(true) // ngày mốc còn
    expect(kq.map((m) => `${m.ngay}|${m.loai}|${m.chiSo ?? ''}|${m.soCau}`)).toEqual([
      '2026-09-21|chang_btvn|2|12', '2026-09-21|goi_gia_dinh||8', '2026-09-21|on_lai||5',
      '2026-09-22|chang_btvn|3|13', '2026-09-22|on_lai||6',
    ])
    // ngày 19, 20 (chặng 0, 1; gói A; ôn 20) đã bị bỏ
    expect(tong(kq)).toEqual({ cau: 12 + 8 + 5 + 13 + 6, phut: 18 + 12 + kq.find((m) => m.loai === 'on_lai' && m.ngay === '2026-09-21')!.phut + 19 + kq.find((m) => m.loai === 'on_lai' && m.ngay === '2026-09-22')!.phut })
    expect(cu.length).toBeGreaterThan(kq.length) // sổ cũ nhiều món hơn
  })
  it('vắng tuNgay / sai dạng ⇒ Y HỆT hành vi cũ; mốc rất cũ ⇒ giữ hết; mốc = hôm nay hoặc tương lai ⇒ rỗng (mọi món nợ đều trước hôm nay)', () => {
    for (const t of [undefined, '', 'hôm nay', '21/09/2026', '2026-9-21', '2026-09-21T05:00:00.000Z']) expect(soNo({ now: NOW, baiDangChay: [bai], onQuaLich: on, goiGiaDinh: goi, tuNgay: t as string | undefined }), String(t)).toEqual(cu)
    expect(soNo({ now: NOW, baiDangChay: [bai], onQuaLich: on, goiGiaDinh: goi, tuNgay: '2020-01-01' })).toEqual(cu)
    expect(soNo({ now: NOW, baiDangChay: [bai], onQuaLich: on, goiGiaDinh: goi, tuNgay: '2026-09-23' })).toEqual([])
    expect(soNo({ now: NOW, baiDangChay: [bai], onQuaLich: on, goiGiaDinh: goi, tuNgay: '2027-01-01' })).toEqual([])
  })
  it('thuần: không sửa đầu vào; gọi lại cho cùng kết quả', () => {
    const b = Object.freeze({ ...bai, moLuc: Object.freeze([...bai.moLuc]) }) as BaiDangChay
    const v = { now: NOW, baiDangChay: Object.freeze([b]), onQuaLich: Object.freeze(on.map((x) => Object.freeze(x))), goiGiaDinh: Object.freeze(goi.map((x) => Object.freeze(x))), tuNgay: '2026-09-21' }
    expect(soNo(v)).toEqual(soNo(v))
  })
  it('TÍNH CHẤT 2 000 ca: kết quả có tuNgay ≡ kết quả cũ LỌC theo ngay ≥ tuNgay (thứ tự giữ nguyên); mọi món ≥ tuNgay; tổng khớp', () => {
    const r = mulberry32(2109)
    for (let i = 0; i < 2000; i++) {
      const now = vn('2026-09-20T00:00') + Math.floor(r() * 12 * MS_NGAY)
      const soChang = 1 + Math.floor(r() * 6)
      const moLuc = Array.from({ length: soChang }, (_, k) => new Date(vn('2026-09-15T00:00') + Math.floor((k + r() * 1.5) * MS_NGAY)).toISOString())
      const b: BaiDangChay = { maBtvn: 'B', ten: 'B', hanNop: new Date(now + 5 * MS_NGAY).toISOString(), moLuc, daXong: Math.floor(r() * soChang), cauMoiChang: moLuc.map(() => 5 + Math.floor(r() * 20)), phutMoiChang: moLuc.map(() => 5 + Math.floor(r() * 30)) }
      const ngayNgau = () => ngayVn(vn('2026-09-15T12:00') + Math.floor(r() * 10 * MS_NGAY))
      const onN = Array.from({ length: Math.floor(r() * 4) }, () => ({ ngay: ngayNgau(), soCau: Math.floor(r() * 9) }))
      const goiN = Array.from({ length: Math.floor(r() * 3) }, () => ({ ngay: ngayNgau(), soCau: Math.floor(r() * 12) }))
      const tuNgay = ngayVn(vn('2026-09-15T12:00') + Math.floor(r() * 10 * MS_NGAY))
      const cuN = soNo({ now, baiDangChay: [b], onQuaLich: onN, goiGiaDinh: goiN })
      const moiN = soNo({ now, baiDangChay: [b], onQuaLich: onN, goiGiaDinh: goiN, tuNgay })
      const loc = cuN.filter((m) => m.ngay >= tuNgay)
      if (JSON.stringify(moiN) !== JSON.stringify(loc)) throw new Error(`#${i} lệch: ${JSON.stringify({ tuNgay, moiN, loc })}`)
      expect(tong(moiN)).toEqual(tong(loc))
    }
  })
})

describe('trangThaiChangTheoMoc', () => {
  const hom = vn('2026-09-23T00:00')
  const v = { dauHomNay: hom, dauMai: hom + MS_NGAY }
  it('không tuNgay = luật cũ: trước 00:00 hôm nay ⇒ no; hôm nay ⇒ hom_nay; sau ⇒ sap_toi; mốc hỏng ⇒ hom_nay', () => {
    expect(trangThaiChangTheoMoc(hom - 1, v)).toBe('no')
    expect(trangThaiChangTheoMoc(hom, v)).toBe('hom_nay')
    expect(trangThaiChangTheoMoc(hom + MS_NGAY - 1, v)).toBe('hom_nay')
    expect(trangThaiChangTheoMoc(hom + MS_NGAY, v)).toBe('sap_toi')
    expect(trangThaiChangTheoMoc(Number.NaN, v)).toBe('hom_nay')
    expect(trangThaiChangTheoMoc(Number.NaN, { ...v, tuNgay: '2026-09-21' })).toBe('hom_nay')
  })
  it('có tuNgay: mốc gốc TRƯỚC ngày mốc mà chưa làm ⇒ hom_nay (vẫn phải làm, không nhãn nợ); đúng ngày mốc ⇒ vẫn no; mở hôm nay / sắp tới không đổi', () => {
    const t = { ...v, tuNgay: '2026-09-21' }
    expect(trangThaiChangTheoMoc(vn('2026-09-19T20:30'), t)).toBe('hom_nay')
    expect(trangThaiChangTheoMoc(vn('2026-09-20T23:59'), t)).toBe('hom_nay')
    expect(trangThaiChangTheoMoc(vn('2026-09-21T00:00'), t)).toBe('no')
    expect(trangThaiChangTheoMoc(vn('2026-09-22T18:00'), t)).toBe('no')
    expect(trangThaiChangTheoMoc(vn('2026-09-23T08:00'), t)).toBe('hom_nay')
    expect(trangThaiChangTheoMoc(vn('2026-09-24T00:00'), t)).toBe('sap_toi')
    expect(trangThaiChangTheoMoc(vn('2026-09-19T20:30'), { ...v, tuNgay: 'sai dạng' })).toBe('no') // sai dạng ⇒ luật cũ
  })
  it('TÍNH CHẤT: không tuNgay ≡ phép tam phân cũ của ve-dich-d1; có tuNgay chỉ ĐỔI no ⇒ hom_nay, không đổi nhãn khác; nhất quán với soNo (món nào soNo giữ thì nhãn là no)', () => {
    const r = mulberry32(7)
    for (let i = 0; i < 3000; i++) {
      const now = vn('2026-09-22T00:00') + Math.floor(r() * 4 * MS_NGAY)
      const dauHomNay = dauNgay(now), dauMai = dauHomNay + MS_NGAY
      const mo = vn('2026-09-15T00:00') + Math.floor(r() * 12 * MS_NGAY)
      const cu = mo < dauHomNay ? 'no' : mo < dauMai ? 'hom_nay' : 'sap_toi'
      expect(trangThaiChangTheoMoc(mo, { dauHomNay, dauMai })).toBe(cu)
      const tuNgay = ngayVn(vn('2026-09-15T12:00') + Math.floor(r() * 12 * MS_NGAY))
      const moi = trangThaiChangTheoMoc(mo, { dauHomNay, dauMai, tuNgay })
      if (cu !== 'no') expect(moi).toBe(cu)
      else expect(moi).toBe(ngayVn(mo) < tuNgay ? 'hom_nay' : 'no')
      const b: BaiDangChay = { maBtvn: 'B', ten: 'B', hanNop: new Date(now + MS_NGAY).toISOString(), moLuc: [new Date(mo).toISOString()], daXong: 0, cauMoiChang: [10], phutMoiChang: [15] }
      expect(soNo({ now, baiDangChay: [b], tuNgay }).length === 1).toBe(moi === 'no')
    }
  })
})
