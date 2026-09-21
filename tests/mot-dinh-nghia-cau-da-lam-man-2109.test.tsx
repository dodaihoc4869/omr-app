// MỘT định nghĩa "câu đã làm hôm nay" — PHẦN MÀN (Code 2; Boss 21/09, đề bài prompt-mot-dinh-nghia-cau-da-lam-2109.md: thầy thấy thẻ Hôm nay "93 câu" cạnh ô Thi đua "78 câu" của cùng một em).
// Máy chủ (Code 3/4) gửi: học sinh `/hs/ke-hoach-ngay` + `/hs/on-lai/nop` → `tienBo.soCauHienThi`; phụ huynh `/ph/tat-ca-ve-con` → `tongQuan.soCau` (GỒM câu che) + `soDung` + `soCauCoKetQua` (mẫu số, chỉ câu không che).
// Màn: CHỈ hiện các số ấy; máy chủ cũ chưa có trường ⇒ rơi về số cũ (không vỡ); KHÔNG đổi luật đạt/chưa đạt.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import fs from 'node:fs'
import path from 'node:path'
import BangNhiemVu from '../src/components/bang-nhiem-vu/BangNhiemVu'
import ManChinh from '../src/components/ph-moi/ManChinh'
import { TongQuan, chuGiaiVong, soSanhHomQua } from '../src/components/ph-moi/bang/TongQuan'
import { cacVongVe } from '../src/components/ph-moi/bang/Vong3'
import { tuKeHoachNgay, type KeHoachNgayMayChu } from '../src/lib/nhiem-vu-adapter'
import { soCauDaLamHienThi } from '../src/lib/so-cau-hien-thi'
import { docThiDua } from '../src/lib/thi-dua'
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

const RAW_THI_DUA = (soCauEm: number) => ({
  ok: true,
  lop: '12A1',
  siSo: 42,
  daHoc: 27,
  top: [
    { ten: 'Khánh Linh', soCau: 91, chuoi: 12, thu: 'lua_phuong' },
    { ten: 'Minh Quân', soCau: 85, chuoi: 7, thu: 'lua_phuong' },
    { ten: 'Bảo Ngọc', soCau: 80, chuoi: 5, thu: 'lua_phuong' },
  ],
  cuaEm: { hang: 4, soCau: soCauEm, themDeVuot: null, nhomCuoi: false },
  capNhatLuc: '2026-09-21T11:00:00Z',
})

describe('CÙNG DỮ LIỆU ⇒ thẻ Hôm nay = ô Thi đua (thầy: "93 câu" so với "78 câu")', () => {
  const ve = (tienBo: Record<string, unknown>, soCauThiDua: number, vaiTro: 'hocsinh' | 'phuhuynh' = 'hocsinh') => {
    const thiDua = docThiDua(RAW_THI_DUA(soCauThiDua))!
    return render(<BangNhiemVu vaiTro={vaiTro} hoTen="Đỗ Minh" now={NOW} duLieu={tuKeHoachNgay(keHoach(tienBo), NOW)} thiDua={{ thiDua, vuot: null }} taiVinhDanh={async () => null} />).container
  }
  const soTheHomNay = (c: HTMLElement) => c.querySelector('.bnv-tien-do-so')!.textContent!.replace(/\s+/g, ' ').trim()
  const soOThiDuaCuaEm = (c: HTMLElement) => c.querySelector('[data-vung="thi-dua"] [data-vung="vi-tri-em"]')?.textContent ?? ''
  const soTrongChu = (t: string) => Number(/(\d+) câu/.exec(t)?.[1])

  it('máy chủ đã có soCauHienThi (= số ô Thi đua 78): thẻ Hôm nay "78/8 câu"; ô Thi đua cũng 78; không chỗ nào còn 93', () => {
    const c = ve({ daLamCau: 93, soCauHienThi: 78, lenBac: 3, dat: false, conThieu: 0 }, 78)
    expect(soTheHomNay(c)).toBe('Hôm nay: 78/8 câu')
    expect(c.querySelector('[data-vung="tien-do"]')!.textContent).not.toContain('93')
    expect(c.textContent).toContain('78')
    expect(c.textContent).not.toMatch(/\b93\b/)
    expect(soOThiDuaCuaEm(c)).toContain('đã làm 78 câu hôm nay')
    expect(Number(/(\d+)\/\d+ câu/.exec(soTheHomNay(c))![1])).toBe(soTrongChu(soOThiDuaCuaEm(c))) // HAI số bằng nhau
  })
  it('thẻ "Em đã xong việc hôm nay" và mọi chữ "Đã làm N câu" trên màn đều là 78', () => {
    const c = ve({ daLamCau: 93, soCauHienThi: 78, lenBac: 3, dat: true, conThieu: 0 }, 78)
    const mung = c.querySelector('.bnv-mung-chu')!
    expect(mung.textContent).toContain('Đã làm 78 câu, 3 câu lên bậc')
    const chu = [...c.textContent!.matchAll(/[Đđ]ã làm (\d+) câu/g)].map((m) => m[1])
    expect(chu.length).toBeGreaterThan(0)
    expect(new Set(chu)).toEqual(new Set(['78']))
  })
  it('phụ huynh xem cùng kế hoạch: "Con đã làm 78/8 câu" (cùng bộ chuyển ⇒ cùng số)', () => {
    const c = ve({ daLamCau: 93, soCauHienThi: 78, dat: false, conThieu: 0 }, 78, 'phuhuynh')
    expect(soTheHomNay(c)).toBe('Con đã làm 78/8 câu')
  })
  it('máy chủ cũ chưa có trường ⇒ thẻ vẫn dựng bằng daLamCau (không vỡ, không trống)', () => {
    const c = ve({ daLamCau: 93, lenBac: 3, dat: false, conThieu: 0 }, 78)
    expect(soTheHomNay(c)).toBe('Hôm nay: 93/8 câu')
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

const MUC = { soCau: 16, phutHoc: 45 }
describe('bảng phụ huynh — vòng 2 / chữ giải vòng: "đúng 30 trong 35 câu đã có kết quả"', () => {
  it('máy chủ gửi mẫu số 35 (3 câu che): số câu đã làm vẫn 38; tỉ lệ đúng 30/35 = 86 %; chữ "đã có kết quả"', () => {
    const dong = chuGiaiVong({ soCau: 38, soDung: 30, soCauCoKetQua: 35, phutHoc: 52, mucTieu: MUC })
    expect(dong[0]).toMatchObject({ mau: '1', so: '38', nhan: 'đã làm · vượt mục tiêu' })
    expect(dong[1]).toEqual({ mau: '2', so: '86', don: '%', nhan: 'đúng 30 trong 35 câu đã có kết quả' })
  })
  it('máy chủ cũ chưa gửi mẫu số ⇒ chữ và số như trước: 30/38 = 79 %', () => {
    const dong = chuGiaiVong({ soCau: 38, soDung: 30, phutHoc: 52, mucTieu: MUC })
    expect(dong[1]).toEqual({ mau: '2', so: '79', don: '%', nhan: 'đúng 30 trong 38 câu' })
    expect(chuGiaiVong({ soCau: 38, soDung: 30, soCauCoKetQua: null, phutHoc: 52, mucTieu: MUC })[1]!.nhan).toBe('đúng 30 trong 38 câu')
  })
  it('không có câu che (mẫu số = soCau): vẫn nói "đã có kết quả" vì máy chủ ĐÃ nói mẫu số', () => {
    expect(chuGiaiVong({ soCau: 38, soDung: 30, soCauCoKetQua: 38, phutHoc: 52, mucTieu: MUC })[1]!.nhan).toBe('đúng 30 trong 38 câu đã có kết quả')
  })
  it('cả ngày chỉ có câu che (mẫu số 0): số câu đã làm hiện, tỉ lệ đúng KHÔNG hiện số giả — "chưa có câu nào có kết quả"', () => {
    const dong = chuGiaiVong({ soCau: 6, soDung: null, soCauCoKetQua: 0, phutHoc: 20, mucTieu: MUC })
    expect(dong[0]).toMatchObject({ mau: '1', so: '6' })
    expect(dong[1]).toEqual({ mau: '2', so: '—', don: '', nhan: 'câu đúng · chưa có câu nào có kết quả' })
  })
  it('chưa làm câu nào (soCau 0) ⇒ giữ câu cũ "chưa có câu nào"; đúng > mẫu số (dữ liệu lệch) ⇒ chặn 100 %', () => {
    expect(chuGiaiVong({ soCau: 0, soDung: null, soCauCoKetQua: null, phutHoc: 0, mucTieu: MUC })[1]!.nhan).toBe('câu đúng · chưa có câu nào')
    const lech = chuGiaiVong({ soCau: 38, soDung: 40, soCauCoKetQua: 35, phutHoc: 52, mucTieu: MUC })
    expect(lech[1]).toMatchObject({ so: '100', nhan: 'đúng 35 trong 35 câu đã có kết quả' })
  })
  it('vòng vẽ: vòng 2 lấp theo mẫu số (30/35), toàn câu che ⇒ vòng 2 trống', () => {
    const v = cacVongVe({ soCau: 38, soDung: 30, soCauCoKetQua: 35, phutHoc: 52, mucTieu: MUC })
    const v2 = v.find((x) => x.mau === 2)!
    expect(v2.kq.ti).toBeCloseTo(30 / 35, 5)
    const cu = cacVongVe({ soCau: 38, soDung: 30, phutHoc: 52, mucTieu: MUC }).find((x) => x.mau === 2)!
    expect(cu.kq.ti).toBeCloseTo(30 / 38, 5)
    const che = cacVongVe({ soCau: 6, soDung: null, soCauCoKetQua: 0, phutHoc: 20, mucTieu: MUC }).find((x) => x.mau === 2)
    expect(che?.kq.ti).toBe(0)
  })
})

describe('bảng phụ huynh — thẻ Tổng quan dựng đủ (vòng + chữ giải) theo mẫu số', () => {
  const ve = (sua: (r: any) => void) => {
    const r = nhan(PH_APPLE)
    sua(r)
    return render(<TongQuan pm={docTatCaVeCon(r)!} now={NAY} />).container
  }
  const vong = (c: HTMLElement) => c.querySelector('[aria-label*="câu đúng"]')?.getAttribute('aria-label') ?? ''
  it('mẫu số 35 ⇒ nhãn vòng đọc "câu đúng 86 %" và dòng giải "đúng 30 trong 35 câu đã có kết quả"; số câu đã làm vẫn 38', () => {
    const c = ve((r) => { r.homNay.tongQuan.soCauCoKetQua = 35 })
    expect(vong(c)).toContain('câu đúng 86 %')
    expect(c.textContent).toContain('đúng 30 trong 35 câu đã có kết quả')
    expect(c.textContent).toContain('38')
  })
  it('máy chủ cũ ⇒ "câu đúng 79 %" và "đúng 30 trong 38 câu"', () => {
    const c = ve(() => {})
    expect(vong(c)).toContain('câu đúng 79 %')
    expect(c.textContent).toContain('đúng 30 trong 38 câu')
    expect(c.textContent).not.toContain('đã có kết quả')
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
  it('bảng: vòng 1 "21/8 câu · đã làm · vượt mục tiêu"; vòng 2 "14 %" và "đúng 1 trong 7 câu đã có kết quả" (không 5 % của 1/21)', () => {
    const dong = chuGiaiVong(pmThat().tongQuan!)
    expect(dong[0]).toMatchObject({ so: '21', don: '/8 câu', nhan: 'đã làm · vượt mục tiêu' })
    expect(dong[1]).toEqual({ mau: '2', so: '14', don: '%', nhan: 'đúng 1 trong 7 câu đã có kết quả' })
  })
})

describe('bảng phụ huynh — so với hôm qua theo mẫu số', () => {
  const t = { soCau: 38, soDung: 30, soCauCoKetQua: 35, phutHoc: 52 }
  it('tỉ lệ hôm nay 30/35 = 86 % so với hôm qua 76 % ⇒ "đúng hơn 10 %"', () => {
    const chip = soSanhHomQua({ ...t, soVoiHomQua: { soCau: 33, soCauCoKetQua: 33, tiLeDung: 0.76, phutHoc: 44 } }).map((c) => c.chu)
    expect(chip).toContain('nhiều hơn 5 câu')
    expect(chip).toContain('đúng hơn 10 %')
  })
  it('hôm qua toàn câu che (không tỉ lệ): chip số câu vẫn có, KHÔNG chip tỉ lệ', () => {
    const chip = soSanhHomQua({ ...t, soVoiHomQua: { soCau: 9, soCauCoKetQua: null, tiLeDung: null, phutHoc: null } }).map((c) => c.chu)
    expect(chip).toEqual(['nhiều hơn 29 câu'])
  })
  it('hôm nay toàn câu che (soDung null) ⇒ không chip tỉ lệ dù hôm qua có', () => {
    const chip = soSanhHomQua({ soCau: 6, soDung: null, soCauCoKetQua: 0, phutHoc: 20, soVoiHomQua: { soCau: 33, soCauCoKetQua: 33, tiLeDung: 0.76, phutHoc: 44 } }).map((c) => c.chu)
    expect(chip.some((c) => /đúng/.test(c))).toBe(false)
  })
})

describe('màn chính phụ huynh — ô "câu đúng %" theo mẫu số; ô "câu đã làm" là số đã làm (gồm câu che)', () => {
  const ve = (sua: (r: any) => void) => {
    const r = nhan(PH_OK)
    sua(r)
    const pm = docTatCaVeCon(r)!
    const v = { trangThai: 'ok' as const, pm, chuLoi: '', dangLamMoi: false, thuLai: vi.fn() }
    const giaoThem = { san: true, dangTai: false, conLai: 2, goiGanNhat: null, the: null, dangGui: false, giao: vi.fn() }
    return render(<ManChinh v={v} tenCon="Khôi" lop="12 - Tinh Hoa" sbd="12121212" now={NAY} canhBao={[]} onCanhBaoDaXem={() => {}} giaoThem={giaoThem as never} onMoBang={() => {}} onDoiSbd={() => {}} />).container
  }
  const ba = (c: HTMLElement) => [...c.querySelectorAll('.phm-ap-ba li')].map((l) => l.textContent)
  it('soCau 38, đúng 30, mẫu số 35 ⇒ "38 câu đã làm · 86 % câu đúng" (không 79 %)', () => {
    const c = ve((r) => { r.homNay.tongQuan.soCauCoKetQua = 35 })
    expect(ba(c)).toEqual(['38câu đã làm', '86%câu đúng', '52phút học'])
  })
  it('dữ liệu lệch (đúng 40 > mẫu số 35) ⇒ chặn 100 %, không ra 114 %', () => {
    const c = ve((r) => { r.homNay.tongQuan.soDung = 40; r.homNay.tongQuan.soCauCoKetQua = 35 })
    expect(ba(c)).toEqual(['38câu đã làm', '100%câu đúng', '52phút học'])
  })
  it('máy chủ cũ (không mẫu số) ⇒ như trước 79 %', () => {
    expect(ba(ve(() => {}))).toEqual(['38câu đã làm', '79%câu đúng', '52phút học'])
  })
  it('cả ngày chỉ có câu che (không soDung, không mẫu số) ⇒ ô "câu đã làm" hiện, KHÔNG ô "câu đúng"', () => {
    const c = ve((r) => { r.homNay.tongQuan.soCau = 6; delete r.homNay.tongQuan.soDung })
    expect(ba(c)).toEqual(['6câu đã làm', '52phút học'])
  })
})
