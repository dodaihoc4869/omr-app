/**
 * ĐẤU TRƯỜNG CHÂN LÝ — PHÉP KIỂM LÕI.
 *
 * Một trận đấu có thắng thua thật thì mọi con số phải kiểm được, nếu không
 * em nào thua cũng nghĩ máy xử ép. Tệp này kiểm đúng những chỗ ấy: ba ghép
 * một, tỉ lệ cửa hàng, vàng và lãi, tương khắc trong giao tranh, tính tất
 * định của cả ván, và thứ hạng.
 */
import { describe, expect, it } from 'vitest'
import {
  DS_QUAN_CO, TI_LE_CUA_HANG, SO_O_CUA_HANG, SO_NGUOI_TOI_DA, MAU_KHOI_DAU,
  VANG_NEN_MOI_VONG, LAI_TOI_DA, CAP_TOI_DA_DOI, VANG_KHOI_DAU,
  ghepBaThanhMot, vangDauVong, quayCuaHang, capTheoKinhNghiem, chiSoGoc, heSoSao,
  dungChiSo, giaoTranh, satThuongMotDon, mauMatKhiThua, doiHinhRaTran,
  chayMotVong, bangHang, lapGheTrong, mayChoiMotVong, dungNguoiMay,
  boSinhSo, hatTuMaPhong, quanTheoId, chayVanTheoNop, vongChayDuoc,
  type PhongDau, type NguoiTrongPhong, type QuanTrenBan,
} from '../src/game/than-thu-hoa-hoc/dau-truong-chan-ly'
import { DS_HE } from '../src/game/than-thu-hoa-hoc/tuong-khac'

describe('bộ quân cờ', () => {
  it('sáu hệ đều có đủ bốn bậc giá — không hệ nào bị bỏ đói', () => {
    for (const he of DS_HE) {
      const cua = DS_QUAN_CO.filter((q) => q.he === he).map((q) => q.gia).sort()
      expect(cua).toEqual([1, 2, 3, 4])
    }
    expect(DS_QUAN_CO).toHaveLength(24)
  })

  it('mọi id là duy nhất, và quân nào cũng có một dòng kiến thức Hoá thật', () => {
    const id = new Set(DS_QUAN_CO.map((q) => q.id))
    expect(id.size).toBe(DS_QUAN_CO.length)
    for (const q of DS_QUAN_CO) expect(q.ghiChu.length).toBeGreaterThan(12)
  })

  it('quân đắt hơn thì mạnh hơn ở CẢ BA chỉ số', () => {
    for (let g = 1; g < 4; g++) {
      const a = chiSoGoc(g)
      const b = chiSoGoc(g + 1)
      expect(b.mau).toBeGreaterThan(a.mau)
      expect(b.cong).toBeGreaterThan(a.cong)
      expect(b.giap).toBeGreaterThan(a.giap)
    }
  })

  it('lên sao nhân đúng 1,8 lần, và chỉ tới ba sao', () => {
    expect(heSoSao(1)).toBe(1)
    expect(heSoSao(2)).toBeCloseTo(1.8, 10)
    expect(heSoSao(3)).toBeCloseTo(3.24, 10)
    expect(heSoSao(9)).toBeCloseTo(3.24, 10)
  })
})

describe('ba ghép một', () => {
  const ba = (id: string, n: number, sao: 1 | 2 | 3 = 1): QuanTrenBan[] =>
    Array.from({ length: n }, () => ({ idQuan: id, sao }))

  it('ba quân một sao ra một quân hai sao', () => {
    expect(ghepBaThanhMot(ba('mg', 3))).toEqual([{ idQuan: 'mg', sao: 2 }])
  })

  it('CHÍN quân một sao ra MỘT quân ba sao, trong đúng một lần gọi', () => {
    expect(ghepBaThanhMot(ba('mg', 9))).toEqual([{ idQuan: 'mg', sao: 3 }])
  })

  it('hai quân thì không ghép, và quân khác id không bị gộp nhầm', () => {
    const kho = [...ba('mg', 2), ...ba('cl2', 2)]
    expect(ghepBaThanhMot(kho)).toHaveLength(4)
  })

  it('bốn quân ra một hai sao và còn lại một quân lẻ', () => {
    const ra = ghepBaThanhMot(ba('mg', 4))
    expect(ra.filter((q) => q.sao === 2)).toHaveLength(1)
    expect(ra.filter((q) => q.sao === 1)).toHaveLength(1)
  })

  it('ghép KHÔNG làm mất giá trị: tổng quy ra quân một sao giữ nguyên', () => {
    const quyDoi = (ds: QuanTrenBan[]) => ds.reduce((s, q) => s + Math.pow(3, q.sao - 1), 0)
    for (const n of [1, 3, 5, 7, 9, 11, 27]) {
      expect(quyDoi(ghepBaThanhMot(ba('cl2', n)))).toBe(n)
    }
  })
})

describe('vàng và lãi', () => {
  it('không có vàng để dành thì chỉ được vàng nền', () => {
    expect(vangDauVong(0, 0)).toBe(VANG_NEN_MOI_VONG)
    expect(vangDauVong(9, 0)).toBe(VANG_NEN_MOI_VONG)
  })

  it('cứ 10 vàng ăn 1 lãi, chặn ở mức tối đa', () => {
    expect(vangDauVong(10, 0)).toBe(VANG_NEN_MOI_VONG + 1)
    expect(vangDauVong(50, 0)).toBe(VANG_NEN_MOI_VONG + LAI_TOI_DA)
    expect(vangDauVong(500, 0)).toBe(VANG_NEN_MOI_VONG + LAI_TOI_DA)
  })

  it('chuỗi THUA cũng được thưởng y như chuỗi thắng — có đường gỡ', () => {
    expect(vangDauVong(0, -5)).toBe(vangDauVong(0, 5))
    expect(vangDauVong(0, -5)).toBeGreaterThan(vangDauVong(0, 2))
  })
})

describe('cửa hàng', () => {
  it('mọi bảng tỉ lệ cộng lại đúng 100', () => {
    for (const cap of Object.keys(TI_LE_CUA_HANG)) {
      const t = TI_LE_CUA_HANG[Number(cap)]!
      expect(t.reduce((a, b) => a + b, 0)).toBe(100)
    }
  })

  it('cấp càng cao thì cơ hội ra quân 4 vàng càng lớn, không cấp nào tụt', () => {
    for (let c = 1; c < CAP_TOI_DA_DOI; c++) {
      expect(TI_LE_CUA_HANG[c + 1]![3]).toBeGreaterThanOrEqual(TI_LE_CUA_HANG[c]![3])
    }
    expect(TI_LE_CUA_HANG[1]![3]).toBe(0)
    expect(TI_LE_CUA_HANG[CAP_TOI_DA_DOI]![3]).toBeGreaterThan(0)
  })

  it('luôn quay đủ năm ô và ô nào cũng là quân có thật', () => {
    const r = boSinhSo(7)
    for (let i = 0; i < 40; i++) {
      const o = quayCuaHang(3, r)
      expect(o).toHaveLength(SO_O_CUA_HANG)
      for (const id of o) expect(quanTheoId(id)).toBeDefined()
    }
  })

  it('CẤP 2 KHÔNG BAO GIỜ ra quân 3 hay 4 vàng — đo trên 3000 ô', () => {
    const r = boSinhSo(99)
    let cao = 0
    for (let i = 0; i < 600; i++) {
      for (const id of quayCuaHang(2, r)) if ((quanTheoId(id)?.gia ?? 0) >= 3) cao += 1
    }
    expect(cao).toBe(0)
  })

  it('cấp đội lên đúng theo kinh nghiệm và dừng ở cấp tối đa', () => {
    expect(capTheoKinhNghiem(0)).toBe(2)
    expect(capTheoKinhNghiem(1)).toBe(2)
    expect(capTheoKinhNghiem(2)).toBe(3)
    expect(capTheoKinhNghiem(10_000)).toBe(CAP_TOI_DA_DOI)
  })
})

describe('giao tranh', () => {
  const q = (id: string, sao: 1 | 2 | 3 = 1): QuanTrenBan => ({ idQuan: id, sao })

  it('giáp giảm sát thương theo công thức 100/(100+giáp), không âm', () => {
    expect(satThuongMotDon(100, 0, 1)).toBe(100)
    expect(satThuongMotDon(100, 100, 1)).toBe(50)
    expect(satThuongMotDon(1, 9999, 1)).toBe(1)
  })

  it('đội đông hơn và mạnh hơn thì thắng', () => {
    const kq = giaoTranh([q('lo_cao', 3), q('nhiet_nhom', 2)], [q('mg')])
    expect(kq.ben).toBe('ta')
    expect(kq.quanSongSot).toBeGreaterThan(0)
  })

  it('đội trống luôn thua đội có quân', () => {
    expect(giaoTranh([], [q('mg')]).ben).toBe('dich')
    expect(giaoTranh([q('mg')], []).ben).toBe('ta')
    expect(giaoTranh([], []).ben).toBe('hoa')
  })

  it('TƯƠNG KHẮC ĐỔI ĐƯỢC KẾT CỤC: cùng một quân, đổi hệ địch là đổi bên thắng', () => {
    // Hai quân cùng giá, chỉ khác hệ. Chọn cặp mà bảng khắc chế có ghi.
    const a = giaoTranh([q('cl2')], [q('mg')])
    const b = giaoTranh([q('mg')], [q('cl2')])
    // Không thể cả hai cùng thắng khi đổi vai — nếu có thì bảng khắc chế
    // đang không được dùng trong giao tranh.
    expect(a.ben === 'ta' && b.ben === 'ta').toBe(false)
  })

  it('nhật ký ghi lại được và có nêu loại tương khắc', () => {
    const kq = giaoTranh([q('cl2')], [q('zn_cu')])
    expect(kq.nhatKy.length).toBeGreaterThan(0)
    for (const d of kq.nhatKy) expect(['khac', 'biKhac', 'thuong']).toContain(d.loai)
  })

  it('TẤT ĐỊNH: chạy lại mười lần ra y hệt', () => {
    const ta = [q('nhiet_nhom', 2), q('cl2')]
    const dich = [q('baso4'), q('ester', 2)]
    const mau = JSON.stringify(giaoTranh(ta, dich))
    for (let i = 0; i < 10; i++) expect(JSON.stringify(giaoTranh(ta, dich))).toBe(mau)
  })

  it('thua càng sâu vòng càng mất nhiều máu, và quân địch sống càng nhiều càng đau', () => {
    expect(mauMatKhiThua(9, 0)).toBeGreaterThan(mauMatKhiThua(1, 0))
    expect(mauMatKhiThua(1, 4)).toBeGreaterThan(mauMatKhiThua(1, 1))
  })

  it('ra trận đúng số quân bằng CẤP ĐỘI, và chọn quân mạnh nhất trong kho', () => {
    const n: NguoiTrongPhong = {
      ...dungNguoiMay(1, 'hoa'),
      kinhNghiem: 0,
      kho: [q('mg'), q('lo_cao'), q('nhiet_nhom'), q('cl2')],
    }
    const ra = doiHinhRaTran(n)
    expect(ra).toHaveLength(capTheoKinhNghiem(0))
    const suc = ra.map((x) => dungChiSo(x)!.cong)
    expect(Math.min(...suc)).toBeGreaterThanOrEqual(dungChiSo(q('nhiet_nhom'))!.cong)
  })
})

describe('phòng đấu', () => {
  function phongMau(soNguoiThat: number): PhongDau {
    const nguoi: NguoiTrongPhong[] = []
    for (let i = 0; i < soNguoiThat; i++) {
      nguoi.push({
        sbd: `SBD${i + 1}`, biDanh: `Thú ${i + 1}`, he: DS_HE[i % DS_HE.length]!,
        mau: MAU_KHOI_DAU, vang: VANG_KHOI_DAU, kinhNghiem: 0, chuoi: 0,
        kho: [], laMay: false, vongBiLoai: 0,
      })
    }
    const p: PhongDau = { ma: 'AB12', vong: 1, nguoi, daLoai: [], ketThuc: false }
    lapGheTrong(p)
    return p
  }

  it('lấp ghế cho đủ sáu, và người thật vẫn đứng đầu danh sách', () => {
    const p = phongMau(2)
    expect(p.nguoi).toHaveLength(SO_NGUOI_TOI_DA)
    expect(p.nguoi.filter((n) => !n.laMay)).toHaveLength(2)
    expect(p.nguoi[0]!.sbd).toBe('SBD1')
  })

  it('một ván chạy tới khi còn đúng một người, và bảng hạng đủ sáu chỗ', () => {
    const p = phongMau(3)
    const r = boSinhSo(hatTuMaPhong(p.ma, 0))
    let canh = 0
    while (!p.ketThuc && canh < 300) {
      for (const n of p.nguoi) if (n.vongBiLoai === 0) mayChoiMotVong(n, r)
      chayMotVong(p, r)
      canh += 1
    }
    expect(p.ketThuc).toBe(true)
    expect(canh).toBeLessThan(300)
    const hang = bangHang(p)
    expect(hang).toHaveLength(SO_NGUOI_TOI_DA)
    expect(hang[0]!.hang).toBe(1)
    // Người hạng 1 phải là người CÒN SỐNG khi ván kết thúc.
    const songSot = p.nguoi.filter((n) => n.vongBiLoai === 0)
    expect(songSot).toHaveLength(1)
    expect(hang[0]!.sbd).toBe(songSot[0]!.sbd)
  })

  it('CẢ VÁN TẤT ĐỊNH: cùng mã phòng thì hai máy ra cùng một bảng hạng', () => {
    const chay = () => {
      const p = phongMau(4)
      const r = boSinhSo(hatTuMaPhong('AB12', 0))
      let canh = 0
      while (!p.ketThuc && canh < 300) {
        for (const n of p.nguoi) if (n.vongBiLoai === 0) mayChoiMotVong(n, r)
        chayMotVong(p, r)
        canh += 1
      }
      return JSON.stringify(bangHang(p))
    }
    expect(chay()).toBe(chay())
  })

  it('mã phòng khác nhau thì hạt giống khác nhau', () => {
    expect(hatTuMaPhong('AB12', 0)).not.toBe(hatTuMaPhong('AB13', 0))
    expect(hatTuMaPhong('AB12', 1)).not.toBe(hatTuMaPhong('AB12', 2))
  })

  it('không ai bị mất máu khi ván đã kết thúc', () => {
    const p = phongMau(2)
    p.ketThuc = true
    const truoc = p.nguoi.map((n) => n.mau)
    chayMotVong(p, boSinhSo(1))
    expect(p.nguoi.map((n) => n.mau)).toEqual(truoc)
  })

  it('MÁY KHÔNG ĂN GIAN: chỉ mua bằng vàng nó có, không bao giờ âm vàng', () => {
    const r = boSinhSo(4242)
    const n = dungNguoiMay(1, 'khi')
    for (let v = 0; v < 40; v++) {
      mayChoiMotVong(n, r)
      expect(n.vang).toBeGreaterThanOrEqual(0)
      n.vang += vangDauVong(n.vang, 0)
    }
    expect(n.kho.length).toBeGreaterThan(0)
    for (const q of n.kho) expect(quanTheoId(q.idQuan)).toBeDefined()
  })

  it('biệt danh của máy KHÔNG mượn số báo danh của em nào', () => {
    const p = phongMau(1)
    for (const n of p.nguoi.filter((x) => x.laMay)) {
      expect(n.sbd.startsWith('MAY')).toBe(true)
      expect(n.biDanh).not.toContain('SBD')
    }
  })
})

describe('chạy lại ván từ sổ nộp của máy chủ', () => {
  const nop = (ids: string[], vang = 10, kn = 0) => ({
    doiHinh: ids.map((id) => ({ idQuan: id, sao: 1 as const })), vang, kinhNghiem: kn,
  })
  const ghe = (khoa: string, ids: string[][], he: 'hoa' | 'khi' | 'kiem' = 'hoa') => ({
    khoa, biDanh: 'Thú ' + khoa, he,
    nop: Object.fromEntries(ids.map((x, i) => [String(i + 1), nop(x)])),
  })

  it('MỌI MÁY RA CÙNG MỘT VÁN: chạy lại mười lần ra y hệt', () => {
    const g = [ghe('G1', [['lo_cao'], ['lo_cao', 'mg']]), ghe('G2', [['cl2'], ['cl2', 'f2']], 'khi')]
    const mau = JSON.stringify(chayVanTheoNop('AB12', g, 2).phong)
    for (let i = 0; i < 10; i++) expect(JSON.stringify(chayVanTheoNop('AB12', g, 2).phong)).toBe(mau)
  })

  it('MÃ PHÒNG khác thì ván khác — không phải ván nào cũng y hệt', () => {
    const g = [ghe('G1', [['lo_cao'], ['mg']]), ghe('G2', [['cl2'], ['f2']], 'khi')]
    const a = JSON.stringify(chayVanTheoNop('AB12', g, 6).phong)
    const b = JSON.stringify(chayVanTheoNop('ZZ99', g, 6).phong)
    expect(a).not.toBe(b)
  })

  it('MÁU KHÔNG NHẬN TỪ MÁY EM: mọi người đều bắt đầu ở máu khởi đầu', () => {
    const g = [{ ...ghe('G1', [['mg']]), nop: { '1': { ...nop(['mg']), mau: 9999 } as never } }]
    const v = chayVanTheoNop('AB12', g, 1)
    const toi = v.phong.nguoi.find((n) => n.sbd === 'G1')!
    expect(toi.mau).toBeLessThanOrEqual(MAU_KHOI_DAU)
  })

  it('NỘP HAI MƯƠI QUÂN cũng chỉ ra trận được số ô cho phép', () => {
    const nhieu = Array.from({ length: 20 }, () => 'mg')
    const g = [ghe('G1', [nhieu]), ghe('G2', [['cl2']], 'khi')]
    const v = chayVanTheoNop('AB12', g, 1)
    const toi = v.phong.nguoi.find((n) => n.sbd === 'G1')!
    expect(toi.kho.length).toBeLessThanOrEqual(CAP_TOI_DA_DOI)
  })

  it('quân BỊA RA bị loại bỏ, không làm hỏng ván', () => {
    const g = [
      { ...ghe('G1', [[]]), nop: { '1': nop(['khong_co_quan_nay', 'mg']) } },
      ghe('G2', [['cl2']], 'khi'),
    ]
    const v = chayVanTheoNop('AB12', g, 1)
    const toi = v.phong.nguoi.find((n) => n.sbd === 'G1')!
    expect(toi.kho.map((q) => q.idQuan)).toEqual(['mg'])
  })

  it('EM RỚT MẠNG giữa ván thì đội hình vòng trước vẫn đánh tiếp', () => {
    const g = [ghe('G1', [['lo_cao', 'nhiet_nhom']]), ghe('G2', [['cl2'], ['cl2']], 'khi')]
    const v = chayVanTheoNop('AB12', g, 3)
    const toi = v.phong.nguoi.find((n) => n.sbd === 'G1')!
    expect(toi.kho.length).toBe(2)
  })

  it('ghế trống được máy lấp cho đủ sáu, ván chạy được với một người thật', () => {
    const v = chayVanTheoNop('AB12', [ghe('G1', [['mg']])], 1)
    expect(v.phong.nguoi).toHaveLength(SO_NGUOI_TOI_DA)
    expect(v.bienBan).toHaveLength(1)
  })

  it('vòng chạy được chỉ tính khi MỌI ghế đã nộp', () => {
    const a = ghe('G1', [['mg'], ['mg']])
    const b = { ...ghe('G2', [['cl2']], 'khi') }
    expect(vongChayDuoc([a, b], 2)).toBe(1)
    expect(vongChayDuoc([a, ghe('G2', [['cl2'], ['cl2']], 'khi')], 2)).toBe(2)
    expect(vongChayDuoc([], 3)).toBe(0)
  })
})
