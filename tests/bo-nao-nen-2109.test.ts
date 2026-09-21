// BỘ NÃO — NÉN THẺ / HỒ SƠ (`src/lib/bo-nao-nen.ts`, Code 1, 21/09/2026). Đích của Boss: thẻ nhanh ≤ 1,2 KB · hồ sơ sâu ≤ 3 KB · thẻ vắng ≤ 0,4 KB (byte UTF-8). Chỉ đổi CÁCH VIẾT, không đổi số.
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { cat, gon, nenHoSo, nenThe, nenTheVang } from '../src/lib/bo-nao-nen'
import { tapSoCuaThe } from '../src/lib/bo-nao-khuon'

const bytes = (x: unknown) => Buffer.byteLength(JSON.stringify(x), 'utf8')
const MA = (i: number) => `ESTE.THUY_PHAN.${i}` // mã dạng thật ≈ 16 ký tự
const MA_DAI = (i: number) => `DON.CHAT.NITROGEN.HOP.CHAT.${i}` // 30 ký tự

/** Thẻ ĐẦY như đêm thực tế: 4 mã dạng, 3 dạng chú ý, 2 mốc, cờ, ca thi, đã có điều chỉnh hôm qua, 3 lời nhắn 160 ký tự tiếng Việt. `dai` = mã dạng 30 ký tự và 6 dạng (trường hợp xấu). */
function theDay(dai = false): Record<string, any> {
  const ma = dai ? MA_DAI : MA
  const loi = 'Hôm qua em đã làm đúng lại hai câu thuỷ phân ester từng sai. Mai mình xếp sẵn ba câu cùng dạng ở mức dễ hơn để em lấy lại đà nhé em.'.slice(0, 160)
  const so = dai ? 6 : 4
  return {
    ngay: '2026-09-22',
    maDang: Array.from({ length: so }, (_, i) => ma(i)),
    bacCuaMaDang: [1, 2, 0, 0, 1, 2].slice(0, so),
    hoatDong: { ngayCoBai7: 6, soNgayVang: 0, soNgayTuLucDau: 30 },
    cau: { lam7: 84, dung7: 60, sai7: 24, tiLe7: 0.71, lam3: 36, tiLe3: 0.67, lam4Truoc: 48, lamHomQua: 12, dungHomQua: 8 },
    xuHuong: 'on',
    giay: { trungVi7: 48, homQua: 44 },
    nguon: { btvn7: 56, btvn2: 16, onLai7: 28, game7: 0, khac7: 0 },
    chuoi: 3,
    datNgay7: 4,
    ngayNghi7: 1,
    btvn: { baiMo: 1, changXong: 2, tongChang: 5 },
    noOn: 12,
    exp: { tong: 1240, cap: 7 },
    ca: { diem: 6.5, ngayTruoc: 2 },
    dangChuY: [0, 1, 2].map((i) => ({ ma: ma(i), gap: 15 + i, sai: 3 + i, bac: (i % 3) as 0 | 1 | 2, tiLeKhacPhuc: 0.25 + i / 10, lam7: 5 + i, sai7: 3 + i })),
    co: ['sai_lap', 'vua_thi'],
    mocDangKhen: [{ loai: 'len_bac', dang: ma(1), tu: 0, den: 1 }, { loai: 'dung_lai', soCau: 2 }],
    luotSoiKyTuan: false,
    khiNaoVietPhuHuynh: ['moc_dang_khen', 'vua_thi'],
    loiNhanGanDay: [loi, loi, loi],
    homQuaDanhGia: null,
    homQuaDc: { lech: -2, khoiDong: 3, dang: [{ ma: ma(0), hanhDong: 'uu_tien' }], khacPhuc: [{ dang: ma(0), kieu: 'khac_phuc' }], co: 'tut_nhip', apDung: true },
  }
}
function hoSoDay(the: Record<string, any>): Record<string, any> {
  return {
    ...the,
    theoNgay: [1, 2, 3, 4, 5, 6, 7].map((n) => ({ ngayTruoc: n, lam: 10 + n, dung: 7 + (n % 3) })),
    dang: Array.from({ length: 10 }, (_, i) => ({ ma: MA(i), gap: 10 + i, sai: 2 + (i % 4), bac: (i % 3) as 0 | 1 | 2, tiLeKhacPhuc: 0.3 + (i % 5) / 10, lam7: 4 + i, sai7: i % 4, daKhacPhuc: i % 3, xuHuong: ['len', 'on', 'xuong', 'chua_du'][i % 4] })),
    cauSaiGanDay: Array.from({ length: 8 }, (_, i) => ({ dang: MA(i % 6), lanSai: 1 + (i % 3), trangThai: ['moi_sai', 'dang_on', 'da_khac_phuc'][i % 3], giay: 30 + i * 7 })),
  }
}

describe('kích thước (byte UTF-8) trên thẻ ĐẦY nhất', () => {
  it('THẺ NHANH điển hình ≤ 1,2 KB (trường hợp xấu — mã dạng 30 ký tự, 6 dạng — ≤ 1,5 KB)', () => {
    const the = theDay()
    expect(bytes(the)).toBeGreaterThan(1200) // trước khi nén: quá đích
    const n = nenThe(the)
    expect(bytes(n), JSON.stringify(n).length + ' ký tự').toBeLessThanOrEqual(1200)
    expect(bytes(nenThe(theDay(true)))).toBeLessThanOrEqual(1500)
  })
  it('HỒ SƠ SÂU (thẻ nén + phần thêm) ≤ 3 KB; phần thêm không lặp thẻ', () => {
    const the = theDay()
    const hs = hoSoDay(the)
    const them = nenHoSo(the, hs)!
    for (const k of Object.keys(theDay())) expect(Object.keys(them), `khoá ${k} của thẻ không được lặp trong hồ sơ`).not.toContain(k)
    const tong = bytes(nenThe(the)) + bytes(them)
    expect(tong, `thẻ ${bytes(nenThe(the))} + thêm ${bytes(them)}`).toBeLessThanOrEqual(3000)
    expect(bytes(hs) + bytes(the)).toBeGreaterThan(3000) // trước khi nén (thẻ + hồ sơ lặp thẻ) quá đích
    const daiThe = theDay(true)
    expect(bytes(nenThe(daiThe)) + bytes(nenHoSo(daiThe, hoSoDay(daiThe)))).toBeLessThanOrEqual(3600) // xấu nhất
  })
  it('THẺ VẮNG ≤ 0,4 KB', () => {
    const the = { ...theDay(), hoatDong: { ngayCoBai7: 0, soNgayVang: 6, soNgayTuLucDau: 30 } }
    const v = nenTheVang(the)
    expect(bytes(v), JSON.stringify(v)).toBeLessThanOrEqual(400)
    expect(bytes(nenTheVang({ ...theDay(true), hoatDong: { ngayCoBai7: 0, soNgayVang: 6, soNgayTuLucDau: 30 } }))).toBeLessThanOrEqual(450) // mã dạng dài
  })
})

describe('chỉ đổi cách viết: KHÔNG đổi số, KHÔNG bịa, không mất thứ AI cần', () => {
  it('mọi con số trong thẻ nén (và phần thêm của hồ sơ) đều là số có trong thẻ/hồ sơ đầy đủ; tập số của thẻ nén ⊆ tập số của thẻ đầy đủ', () => {
    const the = theDay()
    const hs = hoSoDay(the)
    const soDay = tapSoCuaThe(hs)
    for (const n of [...tapSoCuaThe(nenThe(the)), ...tapSoCuaThe(nenHoSo(the, hs))]) expect(soDay.has(n), n).toBe(true)
    for (const n of tapSoCuaThe(nenTheVang(the))) expect(tapSoCuaThe(the).has(n), `vắng ${n}`).toBe(true)
  })
  it('thẻ nén giữ mọi trường có nghĩa của thẻ đầy đủ (trừ ngày, false/null/rỗng); lời nhắn gần đây chỉ cắt', () => {
    const the = theDay()
    const n = nenThe(the) as Record<string, any>
    expect(n.ngay).toBeUndefined()
    expect(n.luotSoiKyTuan).toBeUndefined() // false ⇒ bỏ
    expect(n.homQuaDanhGia).toBeUndefined() // null ⇒ bỏ
    expect(n.maDang).toEqual(the.maDang)
    expect(n.bacCuaMaDang).toEqual(the.bacCuaMaDang) // mảng song song giữ cả số 0
    expect(n.hoatDong).toEqual(the.hoatDong) // số 0 KHÔNG bị bỏ (soNgayVang: 0 là thông tin)
    expect(n.cau).toEqual(the.cau)
    // dangChuY thành mảng [mã, đã gặp, đã sai, bậc, tỉ lệ khắc phục, làm 7, sai 7]; bậc Biết (0) vẫn ghi
    expect(n.dangChuY).toEqual(the.dangChuY.map((d: any) => [d.ma, d.gap, d.sai, d.bac, d.tiLeKhacPhuc, d.lam7, d.sai7]))
    expect(n.dangChuY[0][3]).toBe(0)
    expect(n.dangChuY[1][3]).toBe(1)
    expect(n.nguon).toEqual({ btvn7: 56, btvn2: 16, onLai7: 28 }) // khoá bằng 0 bỏ (vắng = 0)
    expect(n.homQuaDc).toEqual({ lech: -2, dang: the.homQuaDc.dang, khacPhuc: the.homQuaDc.khacPhuc })
    expect(n.loiNhanGanDay).toHaveLength(2)
    for (const l of n.loiNhanGanDay) expect(Array.from(l as string).length).toBeLessThanOrEqual(50)
    expect(n.loiNhanGanDay[0]).toBe(cat(the.loiNhanGanDay[0], 50))
    expect((n.loiNhanGanDay[0] as string).endsWith('…')).toBe(true)
  })
  it('phần thêm của hồ sơ: theoNgay và cauSaiGanDay thành mảng; dạng đã ở dangChuY chỉ ghi phần THÊM (dangThem); dạng khác ghi đủ (dangKhac); thứ tự và số lượng giữ nguyên', () => {
    const the = theDay()
    const hs = hoSoDay(the)
    const them = nenHoSo(the, hs)! as Record<string, any>
    expect(them.theoNgay).toEqual([[1, 11, 8], [2, 12, 9], [3, 13, 7], [4, 14, 8], [5, 15, 9], [6, 16, 7], [7, 17, 8]])
    expect(them.cauSaiGanDay).toHaveLength(8)
    expect(them.cauSaiGanDay[0]).toEqual([MA(0), 1, 'moi_sai', 30])
    expect(them.dang).toBeUndefined()
    expect(them.dangThem).toHaveLength(3) // ba dạng ở dangChuY
    expect(them.dangKhac).toHaveLength(7) // bảy dạng còn lại
    expect(them.dangThem.map((d: unknown[]) => d[0])).toEqual([MA(0), MA(1), MA(2)])
    expect(them.dangKhac.map((d: unknown[]) => d[0])).toEqual(Array.from({ length: 7 }, (_, i) => MA(i + 3)))
    expect(them.dangThem[0]).toEqual([MA(0), 0, 'len']) // daKhacPhuc 0, xuHuong 'len'
    expect(them.dangKhac[0]).toEqual([MA(3), 13, 5, 0, 0.6, 7, 3, 0, 'chua_du']) // dạng số 3 của hoSoDay: gap 13 · sai 5 · bậc 0 · khắc phục 0,6 · làm7 7 · sai7 3 · daKhacPhuc 0 · xuHuong chua_du
    for (const d of them.dangKhac) expect(d).toHaveLength(9)
  })
  it('thẻ vắng: đúng trường cần, hai dạng chú ý, MỘT lời nhắn; không có trường thừa', () => {
    const the = { ...theDay(), hoatDong: { ngayCoBai7: 0, soNgayVang: 6, soNgayTuLucDau: 30 } }
    const v = nenTheVang(the) as Record<string, any>
    expect(v.hoatDong.soNgayVang).toBe(6)
    expect(v.dangChuY).toHaveLength(1)
    expect(v.loiNhanGanDay).toHaveLength(1)
    expect(Array.from(v.loiNhanGanDay[0] as string).length).toBeLessThanOrEqual(40)
    expect(Object.keys(v).sort()).toEqual(['ca', 'cau', 'chuoi', 'co', 'dangChuY', 'hoatDong', 'khiNaoVietPhuHuynh', 'loiNhanGanDay'].sort())
    expect(v.maDang).toBeUndefined()
    expect(v.nguon).toBeUndefined()
  })
  it('gon: bỏ null/undefined/false/[]/{} ở mọi tầng, giữ số 0, chuỗi rỗng, phần tử mảng; không sửa đầu vào', () => {
    const vao = { a: null, b: undefined, c: false, d: [], e: {}, f: 0, g: '', h: [0, null, {}, { x: null, y: 1 }], i: { j: { k: null }, l: 2 }, m: true }
    const truoc = JSON.stringify(vao)
    expect(gon(vao)).toEqual({ f: 0, g: '', h: [0, null, {}, { y: 1 }], i: { l: 2 }, m: true })
    expect(JSON.stringify(vao)).toBe(truoc)
  })
  it('cat: giữ nguyên nếu vừa, cắt theo KÝ TỰ (không cắt giữa dấu tiếng Việt), thêm …', () => {
    expect(cat('ngắn', 10)).toBe('ngắn')
    expect(cat('Đúng lại hai câu thuỷ phân', 10)).toBe('Đúng lại …'.slice(0, 9) + '…')
    expect(Array.from(cat('ế'.repeat(100), 70)).length).toBe(70)
    expect(cat(null, 5)).toBe('')
  })
  it('đầu vào lạ không làm hỏng: không phải đối tượng ⇒ {} / null', () => {
    expect(nenThe(null)).toEqual({})
    expect(nenTheVang(undefined)).toEqual({})
    expect(nenHoSo({}, null)).toBeNull()
    expect(nenHoSo({ a: 1 }, { a: 1 })).toBeNull() // hồ sơ chỉ lặp thẻ ⇒ không có gì thêm
  })
  it('THUẦN: bo-nao-nen.ts không import, không đồng hồ, không ngẫu nhiên', () => {
    const ma = readFileSync('src/lib/bo-nao-nen.ts', 'utf8')
      .split('\n')
      .filter((l) => !l.trimStart().startsWith('//') && !l.trimStart().startsWith('*') && !l.trimStart().startsWith('/**'))
      .join('\n')
    expect(ma).not.toMatch(/^import /m)
    expect(ma).not.toMatch(/Date\.now|new Date|Math\.random|process\.|fetch\(/)
  })
})
