/** CỔNG QUÁI · HOA KHỔNG LỒ · BA MỨC ĐỘ. */
import { describe, it, expect } from 'vitest'
import { CAU_HINH } from '../src/game/giai-cuu-cong-chua/cau-hinh'
import { BA_DO_KHO, layDoKho } from '../src/game/giai-cuu-cong-chua/do-kho'
import { VanChoi } from '../src/game/giai-cuu-cong-chua/van-choi'
import { sinhDao, coDat, boSinh } from '../src/game/giai-cuu-cong-chua/man-choi'
import { sinhQuai, sinhHoa, buocQuai, CAO_QUAI } from '../src/game/giai-cuu-cong-chua/quai-va-hoa'

describe('ba mức độ khó', () => {
  it('đúng ba mức, tên theo thang điểm của trung tâm', () => {
    expect(BA_DO_KHO.map((d) => d.ten)).toEqual(['Trượt đại học', 'Đỗ đại học', 'Thủ khoa toàn quốc'])
  })

  it('khó dần THẬT — mọi trục đều đi đúng chiều', () => {
    const [a, b, c] = BA_DO_KHO
    expect(a!.soQuai).toBeLessThan(b!.soQuai)
    expect(b!.soQuai).toBeLessThan(c!.soQuai)
    expect(a!.tocDoQuai).toBeLessThan(b!.tocDoQuai)
    expect(b!.tocDoQuai).toBeLessThan(c!.tocDoQuai)
    expect(a!.soHoa).toBeGreaterThan(b!.soHoa)      // càng khó càng ÍT hoa
    expect(b!.soHoa).toBeGreaterThan(c!.soHoa)
    expect(a!.botDoChinhXac).toBeLessThan(c!.botDoChinhXac)
    expect(a!.mauRong).toBeLessThan(c!.mauRong)
    expect(a!.giayHoRong).toBeGreaterThan(c!.giayHoRong)  // cửa sổ hở hẹp dần
  })

  it('ván nhận đúng độ khó: máu rồng và số quái khớp bảng', () => {
    for (const d of BA_DO_KHO) {
      const v = new VanChoi(77, 'Zn', false, 0, d.ma)
      expect(v.rong.mau, d.ten).toBe(d.mauRong)
      expect(v.quai.length, d.ten).toBeLessThanOrEqual(d.soQuai)
      expect(v.hoa.length, d.ten).toBeLessThanOrEqual(d.soHoa)
      expect(v.quai.length, d.ten).toBeGreaterThan(0)
    }
  })

  it('mức khó hơn thì thật sự có nhiều quái hơn trên cùng một đảo', () => {
    const de = new VanChoi(2024, 'Zn', false, 0, 'truot')
    const kho = new VanChoi(2024, 'Zn', false, 0, 'thuKhoa')
    expect(kho.quai.length).toBeGreaterThan(de.quai.length)
    expect(kho.hoa.length).toBeLessThan(de.hoa.length)
  })
})

describe('quái', () => {
  it('không con nào đi tuần ra ngoài vực — 200 đảo', () => {
    let ngoai = 0
    for (let h = 0; h < 200; h++) {
      const dao = sinhDao(h)
      const q = sinhQuai(dao, layDoKho('thuKhoa'), boSinh(h ^ 0x9a11))
      for (const c of q) {
        if (!coDat(dao, c.x1) || !coDat(dao, c.x2)) ngoai++
      }
    }
    expect(ngoai).toBe(0)
  })

  it('đi tuần rồi quay đầu, không trôi khỏi mốc', () => {
    const dao = sinhDao(9)
    const q = sinhQuai(dao, layDoKho('do'), boSinh(9 ^ 0x9a11))[0]!
    for (let i = 0; i < 3000; i++) buocQuai(q, dao, 1 / 60)
    expect(q.x).toBeGreaterThanOrEqual(q.x1 - 1)
    expect(q.x).toBeLessThanOrEqual(q.x2 + 1)
  })

  it('CHẠM QUÁI THÌ MẤT MỘT MẠNG', () => {
    const v = new VanChoi(5, 'Zn', false, 0, 'do')
    const toi = v.nguoiThat!
    const q = v.quai[0]!
    v.giay = 5; toi.batTuDen = 0
    toi.x = q.x; toi.y = q.y; toi.vy = 0        // đi thẳng vào sườn quái
    const truoc = toi.mang
    v.buoc(1 / 60)
    expect(toi.mang).toBe(truoc - 1)
    expect(q.song).toBe(true)                    // quái không việc gì
  })

  it('DẪM TRÚNG ĐỈNH ĐẦU QUÁI thì quái chết, mình không sao', () => {
    const v = new VanChoi(5, 'Zn', false, 0, 'do')
    const toi = v.nguoiThat!
    const q = v.quai[0]!
    v.giay = 5; toi.batTuDen = 0
    toi.x = q.x; toi.y = q.y + CAO_QUAI; toi.vy = -400
    const truoc = toi.mang
    v.buoc(1 / 60)
    expect(q.song).toBe(false)
    expect(toi.mang).toBe(truoc)
  })
})

describe('hoa khổng lồ', () => {
  it('ăn hoa thì khổng lồ ĐÚNG 10 giây', () => {
    expect(CAU_HINH.GIAY_KHONG_LO).toBe(10)
    const v = new VanChoi(11, 'Zn', false, 0, 'truot')
    const toi = v.nguoiThat!
    const h = v.hoa[0]!
    v.giay = 5
    toi.x = h.x; toi.y = h.y - 10; toi.vy = 0
    v.buoc(1 / 60)
    expect(h.conDo).toBe(false)
    expect(v.khongLo(toi)).toBe(true)
    expect(toi.khongLoDen - v.giay).toBeCloseTo(10, 1)
  })

  it('hết 10 giây thì thôi khổng lồ', () => {
    const v = new VanChoi(11, 'Zn', false, 0, 'truot')
    const toi = v.nguoiThat!
    v.giay = 5
    toi.khongLoDen = v.giay + 10
    expect(v.khongLo(toi)).toBe(true)
    v.giay = 15.1
    expect(v.khongLo(toi)).toBe(false)
  })

  it('KHỔNG LỒ CHẠM QUÁI ⇒ quái chết, mình không mất mạng', () => {
    const v = new VanChoi(5, 'Zn', false, 0, 'do')
    const toi = v.nguoiThat!
    const q = v.quai[0]!
    v.giay = 5; toi.batTuDen = 0; toi.khongLoDen = v.giay + 10
    toi.x = q.x; toi.y = q.y; toi.vy = 0
    const truoc = toi.mang
    v.buoc(1 / 60)
    expect(q.song).toBe(false)
    expect(toi.mang).toBe(truoc)
  })

  it('KHỔNG LỒ CHẠM NGƯỜI ⇒ người đó mất mạng, KHÔNG tra bảng hoá chất', () => {
    const v = new VanChoi(5, 'Zn', false, 0, 'do')
    const toi = v.nguoiThat!
    const ho = v.nguoi[1]!
    v.giay = 5
    toi.batTuDen = 0; ho.batTuDen = 0
    toi.khongLoDen = v.giay + 10
    // cố ý cho họ cầm chất KHẮC CHẾ mình: khổng lồ vẫn thắng
    toi.hoaChat = 'CuSO₄'; ho.hoaChat = 'Zn'
    toi.x = ho.x; toi.y = ho.y; toi.vy = 0
    const truocHo = ho.mang, truocToi = toi.mang
    v.buoc(1 / 60)
    expect(ho.mang).toBe(truocHo - 1)
    expect(toi.mang).toBe(truocToi)
  })

  it('hai người cùng khổng lồ thì không ai hất ai', () => {
    const v = new VanChoi(5, 'Zn', false, 0, 'do')
    const a = v.nguoiThat!, b = v.nguoi[1]!
    v.giay = 5
    a.batTuDen = 0; b.batTuDen = 0
    a.khongLoDen = v.giay + 10; b.khongLoDen = v.giay + 10
    a.x = b.x; a.y = b.y; a.vy = 0
    const ta = a.mang, tb = b.mang
    v.buoc(1 / 60)
    expect(a.mang).toBe(ta)
    expect(b.mang).toBe(tb)
  })

  it('mỗi bông hoa chỉ ăn được MỘT lần', () => {
    const v = new VanChoi(11, 'Zn', false, 0, 'truot')
    const toi = v.nguoiThat!
    const h = v.hoa[0]!
    v.giay = 5
    toi.x = h.x; toi.y = h.y - 10
    v.buoc(1 / 60)
    const lan1 = toi.khongLoDen
    v.giay = 30
    v.buoc(1 / 60)
    expect(toi.khongLoDen).toBe(lan1)   // không được nạp lại
    expect(v.khongLo(toi)).toBe(false)
  })
})

describe('ba mức chạy được cả ba, không treo', () => {
  it('mỗi mức 60 ván bot chạy trọn, có diễn biến', () => {
    for (const d of BA_DO_KHO) {
      let coMat = 0
      for (let i = 0; i < 60; i++) {
        const v = new VanChoi(30000 + i, null, false, -1, d.ma)
        v.chayHet(45)
        if (v.nguoi.some((n) => n.mang < CAU_HINH.SO_MANG)) coMat++
        // bot vẫn không bao giờ chạm công chúa, kể cả khi có quái
        expect(v.ket.botChamCongChua, d.ten).toBe(false)
      }
      expect(coMat, d.ten).toBeGreaterThan(0)
    }
  })
})

describe('cửa sổ hở của rồng theo độ khó', () => {
  it('không phải cấu hình chết — ván thật nhận đúng số giây', () => {
    for (const d of BA_DO_KHO) {
      const v = new VanChoi(77, 'Zn', false, 0, d.ma)
      expect(v.rong.giayHo, d.ten).toBe(d.giayHoRong)
    }
  })
})
