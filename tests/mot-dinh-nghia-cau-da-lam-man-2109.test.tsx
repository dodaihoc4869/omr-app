// MỘT định nghĩa "câu đã làm hôm nay" — PHẦN MÀN (Code 2; Boss 21/09, đề bài prompt-mot-dinh-nghia-cau-da-lam-2109.md: thầy thấy thẻ Hôm nay "93 câu" cạnh ô Thi đua "78 câu" của cùng một em).
// Máy chủ (Code 3/4) gửi: học sinh `/hs/ke-hoach-ngay` + `/hs/on-lai/nop` → `tienBo.soCauHienThi`; phụ huynh `/ph/tat-ca-ve-con` → `tongQuan.soCau` (GỒM câu che) + `soDung` + `soCauCoKetQua` (mẫu số, chỉ câu không che).
// Màn: CHỈ hiện các số ấy; máy chủ cũ chưa có trường ⇒ rơi về số cũ (không vỡ); KHÔNG đổi luật đạt/chưa đạt.
// 27/10: màn `ph-moi/ManChinh`, khối `ph-moi/bang/TongQuan` + `Vong3` và lớp đọc `lib/thi-dua` đã gỡ khỏi src/ vì không màn nào dùng ⇒ các phép kiểm vẽ vòng / chữ giải vòng / so hôm qua bỏ theo.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import fs from 'node:fs'
import path from 'node:path'
import { tuKeHoachNgay, type KeHoachNgayMayChu } from '../src/lib/nhiem-vu-adapter'
import { soCauDaLamHienThi } from '../src/lib/so-cau-hien-thi'
import { docTatCaVeCon, mauSoTiLeDung } from '../src/lib/ph-moi/du-lieu'
import { PH_OK, NAY } from './_ph-moi/du-lieu-mau'
import { PH_APPLE } from './_ph-moi/du-lieu-mau-apple'

const doc = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8')
const nhan = <T,>(o: T): T => JSON.parse(JSON.stringify(o))

afterEach(() => {
  cleanup()
  localStorage.clear()
  sessionStorage.clear()
  vi.unstubAllGlobals()
})

// ───────────────────────────────────────────── học sinh
describe('soCauDaLamHienThi — hàm thuần', () => {
  it('có soCauHienThi ⇒ dùng nó (78), KHÔNG dùng daLamCau rộng hơn (93)', () => {
    expect(soCauDaLamHienThi({ daLamCau: 93, soCauHienThi: 78 })).toBe(78)
  })
  it('máy chủ cũ chưa có trường ⇒ rơi về daLamCau như trước', () => {
    expect(soCauDaLamHienThi({ daLamCau: 93 })).toBe(93)
    expect(soCauDaLamHienThi({ daLamCau: 93, soCauHienThi: undefined })).toBe(93)
    expect(soCauDaLamHienThi({ daLamCau: 93, soCauHienThi: null })).toBe(93)
  })
  it('máy chủ nói 0 là ĐÚNG (em chưa trả lời câu nào) ⇒ 0, không rơi về daLamCau', () => {
    expect(soCauDaLamHienThi({ daLamCau: 93, soCauHienThi: 0 })).toBe(0)
  })
  it('trường hỏng (âm, NaN, chữ, true, rỗng) ⇒ rơi về daLamCau; cả hai không dùng được ⇒ 0; không có tienBo ⇒ 0', () => {
    for (const hong of [-1, Number.NaN, Number.POSITIVE_INFINITY, 'abc', true, '', {}, []]) expect(soCauDaLamHienThi({ daLamCau: 93, soCauHienThi: hong }), String(hong)).toBe(93)
    expect(soCauDaLamHienThi({ daLamCau: -5, soCauHienThi: 'x' })).toBe(0)
    expect(soCauDaLamHienThi({})).toBe(0)
    expect(soCauDaLamHienThi(null)).toBe(0)
    expect(soCauDaLamHienThi(undefined)).toBe(0)
  })
  it('số lẻ ⇒ làm tròn xuống; chuỗi số vẫn nhận như số (đúng cách cũ Number(daLamCau))', () => {
    expect(soCauDaLamHienThi({ daLamCau: 93, soCauHienThi: 78.9 })).toBe(78)
    expect(soCauDaLamHienThi({ daLamCau: 93, soCauHienThi: '78' })).toBe(78)
    expect(soCauDaLamHienThi({ daLamCau: '93' })).toBe(93)
  })
})

const NOW = Date.parse('2026-09-21T19:00:00+07:00')
const viecMau = (o: object) => ({ thuTu: 1, batBuoc: false, khan: false, cong: null, hien: true, nhan: null, trangThai: 'cho', ghiChu: '', chiTiet: {}, hanCung: null, hanMem: null, nguon: 'x', ...o })
// Một việc TUỲ CHỌN (máy chủ mời làm thêm): có nó thì thẻ "Em đã xong việc hôm nay" mới dựng khi tienBo.dat = true.
const THU = viecMau({ id: 'than_thu:X', loai: 'than_thu', soCau: 6, nhan: 'tuy_chon', ghiChu: 'Luyện dạng còn yếu với thần thú', chiTiet: { dang: 'X' } })
const keHoach = (tienBo: Record<string, unknown>, mucTieu = 8): KeHoachNgayMayChu =>
  ({
    ok: true,
    ngay: '2026-09-21',
    nganSach: { mucTieuCau: mucTieu, toiThieuCau: 4, vanTocGiay: 60, vanTocNguon: 'do', ghiChuVanToc: '' },
    viec: [THU],
    canhBao: [],
    quaHan: [],
    tienBo,
    chuoiDat: 2,
    lanNghi: false,
    capNhatLuc: new Date(NOW - 60_000).toISOString(),
  }) as unknown as KeHoachNgayMayChu

describe('bộ chuyển kế hoạch ngày (thẻ Hôm nay, thẻ "xong việc hôm nay")', () => {
  it('daLamCau 93 (luật) + soCauHienThi 78 ⇒ tiến độ 78; ghi chú "Đã làm 78 câu"; KHÔNG chỗ nào nói 93', () => {
    const d = tuKeHoachNgay(keHoach({ daLamCau: 93, soCauHienThi: 78, lenBac: 3, dat: false, conThieu: 0 }), NOW)
    expect(d.tienDo.daLam).toBe(78)
    expect(d.tienDo.phanTram).toBe(100) // 78/8 chặn ở 100
    expect(d.tienDo.ghiChu).toMatch(/^Đã làm 78 câu, 3 câu lên bậc/)
    expect(JSON.stringify(d.tienDo)).not.toContain('93')
  })
  it('máy chủ cũ (không có soCauHienThi) ⇒ như trước: 93', () => {
    const d = tuKeHoachNgay(keHoach({ daLamCau: 93, lenBac: 3, dat: false, conThieu: 0 }), NOW)
    expect(d.tienDo.daLam).toBe(93)
    expect(d.tienDo.ghiChu).toMatch(/^Đã làm 93 câu/)
  })
  it('soCauHienThi 0 (em chưa trả lời câu nào, chỉ bỏ trống) ⇒ 0 câu, không 93', () => {
    const d = tuKeHoachNgay(keHoach({ daLamCau: 93, soCauHienThi: 0, dat: false, conThieu: 0 }), NOW)
    expect(d.tienDo.daLam).toBe(0)
    expect(d.tienDo.phanTram).toBe(0)
    expect(d.tienDo.ghiChu).toMatch(/^Đã làm 0 câu/)
  })
  it('phần trăm tính theo số HIỂN THỊ (mục tiêu 100: 78 câu ⇒ 78 %)', () => {
    const d = tuKeHoachNgay(keHoach({ daLamCau: 93, soCauHienThi: 78, dat: false, conThieu: 0 }, 100), NOW)
    expect(d.tienDo.daLam).toBe(78)
    expect(d.tienDo.phanTram).toBe(78)
  })
  it('thẻ "Em đã xong việc hôm nay" (daXongHomNay) đọc số hiển thị; LUẬT ĐẠT không đổi: đạt do tienBo.dat, không do số hiển thị', () => {
    const dat = tuKeHoachNgay(keHoach({ daLamCau: 93, soCauHienThi: 78, lenBac: 2, dat: true, conThieu: 0 }, 100), NOW)
    expect(dat.daXongHomNay).toEqual({ daLamCau: 78, lenBac: 2 }) // 78 < mục tiêu 100 mà vẫn "xong": luật do máy chủ nói
    const chua = tuKeHoachNgay(keHoach({ daLamCau: 93, soCauHienThi: 78, lenBac: 2, dat: false, conThieu: 0 }, 8), NOW)
    expect(chua.daXongHomNay).toBeNull() // 78 ≥ mục tiêu 8 mà máy chủ nói CHƯA đạt ⇒ vẫn chưa xong
  })
  it('conThieu (luật, của máy chủ) không bị số hiển thị làm lệch: câu "còn N câu là đạt" vẫn theo conThieu', () => {
    const d = tuKeHoachNgay(keHoach({ daLamCau: 1, soCauHienThi: 1, lenBac: 0, dat: false, conThieu: 3 }), NOW)
    expect(d.tienDo.ghiChu).toContain('còn 3 câu là đạt hôm nay')
  })
})

describe('khoá nguồn phía học sinh', () => {
  it('bộ chuyển và màn ôn câu đọc số hiển thị qua MỘT hàm; không còn đọc thẳng tienBo.daLamCau để nói "đã làm"', () => {
    const ad = doc('src/lib/nhiem-vu-adapter.ts')
    expect(ad).toMatch(/const daLam = soCauDaLamHienThi\(keHoach\.tienBo\)/)
    expect(ad).not.toMatch(/Number\(keHoach\.tienBo\.daLamCau\)/)
    const on = doc('src/components/bang-nhiem-vu/LamCauOn.tsx')
    expect(on).toMatch(/Hôm nay em đã ôn \{soCauDaLamHienThi\(tienBo\)\} câu/)
    expect(on).not.toMatch(/\{tienBo\.daLamCau\}/)
  })
  it('hàm dùng chung là THUẦN (không React, không mạng, không import)', () => {
    const src = doc('src/lib/so-cau-hien-thi.ts')
    expect(src).not.toMatch(/^import /m)
    expect(src).not.toMatch(/\bfetch\b|localStorage|window\.|document\./)
  })
})

// ───────────────────────────────────────────── phụ huynh
describe('đọc dữ liệu: soCauCoKetQua, soVoiHomQua không tỉ lệ, nhịp học ngày toàn câu che', () => {
  const doc0 = (sua: (r: any) => void) => {
    const r = nhan(PH_APPLE)
    sua(r)
    return docTatCaVeCon(r)!
  }
  it('soCauCoKetQua hợp lệ (≤ soCau) được giữ; vắng / hỏng / lớn hơn soCau ⇒ null (màn rơi về soCau)', () => {
    expect(doc0((r) => { r.homNay.tongQuan.soCauCoKetQua = 35 }).tongQuan!.soCauCoKetQua).toBe(35)
    expect(doc0((r) => { r.homNay.tongQuan.soCauCoKetQua = 38 }).tongQuan!.soCauCoKetQua).toBe(38)
    expect(doc0(() => {}).tongQuan!.soCauCoKetQua).toBeNull()
    for (const hong of [39, -1, 3.5, 'x', null]) expect(doc0((r) => { r.homNay.tongQuan.soCauCoKetQua = hong }).tongQuan!.soCauCoKetQua, String(hong)).toBeNull()
  })
  it('cả ngày chỉ có câu che: máy chủ gửi soCau mà KHÔNG soDung / soCauCoKetQua ⇒ soCau giữ, soDung + mẫu số null (không "0 đúng" giả)', () => {
    const pm = doc0((r) => { r.homNay.tongQuan.soCau = 6; delete r.homNay.tongQuan.soDung })
    expect(pm.tongQuan!.soCau).toBe(6)
    expect(pm.tongQuan!.soDung).toBeNull()
    expect(pm.tongQuan!.soCauCoKetQua).toBeNull()
  })
  it('soVoiHomQua: hôm qua toàn câu che (chỉ soCau) ⇒ GIỮ khối, tiLeDung null; có tiLeDung hỏng (1.5, âm) ⇒ bỏ khối như cũ; đủ ⇒ giữ mẫu số', () => {
    expect(doc0((r) => { r.homNay.tongQuan.soVoiHomQua = { soCau: 9 } }).tongQuan!.soVoiHomQua).toEqual({ soCau: 9, tiLeDung: null, soCauCoKetQua: null, phutHoc: null })
    expect(doc0((r) => { r.homNay.tongQuan.soVoiHomQua = { soCau: 9, tiLeDung: 1.5 } }).tongQuan!.soVoiHomQua).toBeNull()
    expect(doc0((r) => { r.homNay.tongQuan.soVoiHomQua = { soCau: 9, tiLeDung: -0.1 } }).tongQuan!.soVoiHomQua).toBeNull()
    expect(doc0((r) => { r.homNay.tongQuan.soVoiHomQua = { soCau: 9, soCauCoKetQua: 7, tiLeDung: 0.5, phutHoc: 12 } }).tongQuan!.soVoiHomQua).toEqual({ soCau: 9, tiLeDung: 0.5, soCauCoKetQua: 7, phutHoc: 12 })
    expect(doc0((r) => { r.homNay.tongQuan.soVoiHomQua = { soCau: 9, soCauCoKetQua: 10, tiLeDung: 0.5 } }).tongQuan!.soVoiHomQua!.soCauCoKetQua).toBeNull() // mẫu số > số câu: không tin
    expect(doc0((r) => { r.homNay.tongQuan.soVoiHomQua = { tiLeDung: 0.5 } }).tongQuan!.soVoiHomQua).toBeNull() // thiếu soCau
  })
  it('nhipHoc.ngay: ngày toàn câu che (có soCau, KHÔNG soCauDung) ⇒ giữ ngày, soCauDung null; soCauDung có mà hỏng / lớn hơn soCau ⇒ bỏ ngày như cũ', () => {
    const pm = doc0((r) => {
      r.nhipHoc.ngay = [
        { ngay: '2026-09-18', soCau: 6 },
        { ngay: '2026-09-19', soCau: 8, soCauDung: 7 },
        { ngay: '2026-09-20', soCau: 5, soCauDung: 9 },
        { ngay: '2026-09-21', soCau: 4, soCauDung: -1 },
      ]
    })
    expect(pm.nhipHoc!.ngay).toEqual([
      { ngay: '2026-09-18', soCau: 6, soCauDung: null },
      { ngay: '2026-09-19', soCau: 8, soCauDung: 7 },
    ])
  })
})

describe('mauSoTiLeDung — mẫu số của tỉ lệ đúng', () => {
  it('có soCauCoKetQua hợp lệ ⇒ dùng nó; vắng / hỏng ⇒ soCau; không có soCau ⇒ null', () => {
    expect(mauSoTiLeDung({ soCau: 38, soCauCoKetQua: 35 })).toBe(35)
    expect(mauSoTiLeDung({ soCau: 38, soCauCoKetQua: 0 })).toBe(0)
    expect(mauSoTiLeDung({ soCau: 38, soCauCoKetQua: 38 })).toBe(38)
    expect(mauSoTiLeDung({ soCau: 38 })).toBe(38)
    expect(mauSoTiLeDung({ soCau: 38, soCauCoKetQua: null })).toBe(38)
    for (const hong of [39, -1, 2.5, Number.NaN]) expect(mauSoTiLeDung({ soCau: 38, soCauCoKetQua: hong }), String(hong)).toBe(38)
    expect(mauSoTiLeDung({ soCau: null, soCauCoKetQua: 5 })).toBeNull()
  })
})

describe('THÂN THẬT của Worker 5bb39dd4 (SBD thử 12121212, 21/09 18:3x, chỉ đọc): 21 câu đã làm, 7 câu có kết quả, đúng 1', () => {
  // Chép nguyên khối tongQuan + ngày nhịp học máy chủ thật trả (câu che chiếm 14 trong 21): soDung/soCauCoKetQua chỉ trên câu KHÔNG che.
  const THAT = { soCau: 21, soDung: 1, soCauCoKetQua: 7, datNhiemVu: true, mucTieu: { cau: 8, phut: 6 }, soLanHoc: 7, lanDaiNhatPhut: 1, viecXong: 3, viecTong: 3, chuoiNgayHoc: 1 }
  const pmThat = () => {
    const r = nhan(PH_APPLE)
    r.homNay.tongQuan = nhan(THAT)
    r.nhipHoc = { ngay: [{ ngay: '2026-09-21', soCau: 21, soCauDung: 1, soCauCoKetQua: 7 }], gioThuongHoc: '19:00', trungBinhCauMoiNgay: 21, tongCau: 21 }
    return docTatCaVeCon(r)!
  }
  it('đọc đúng: soCau 21 (gồm che), soDung 1, mẫu số 7', () => {
    const t = pmThat().tongQuan!
    expect([t.soCau, t.soDung, t.soCauCoKetQua]).toEqual([21, 1, 7])
    expect(pmThat().nhipHoc!.ngay).toEqual([{ ngay: '2026-09-21', soCau: 21, soCauDung: 1 }])
  })
})
