// NGHIỆM THU THUẬT TOÁN CHẶN TRẦN TRÙNG — DE-RIENG-CHAN-TRAN-TRUNG.md.
//
// Mỗi khối dưới đây ứng một dòng trong bảng "định nghĩa hoàn thành tự chứng
// minh" của đặc tả. Ngưỡng lấy nguyên từ đặc tả, KHÔNG nới cho vừa kết quả.
//
// Số nền của thuật toán CŨ (mỗi em bốc độc lập theo seed) đo bằng `dotrungcau.py`,
// tôi tự chạy lại chứ không chép: kho 200 đỉnh 5,8 · kho 300 đỉnh 4,7 · kho 600
// đỉnh 3,4. Ngưỡng mới phải thấp hơn hẳn mấy con số đó mới có nghĩa.
import { describe, expect, it } from 'vitest'
import { chiaVongTron, doTrung, haDinh, lechTanSuat, sinhBoMotO } from '../src/lib/de-rieng-tran-trung'
import { sanTrungTrungBinh, thieuBaoNhieuCauDeKhongTrung } from '../src/lib/de-rieng-cau-hinh'

const kho = (n: number) => Array.from({ length: n }, (_, i) => 'q' + i)

/** Bốc ĐỘC LẬP — đúng cách `pick()` đang chạy, để có số đối chứng. */
function bocDocLap(N: number, k: number, m: number, seed: number): Set<string>[] {
  const ids = kho(N)
  const ra: Set<string>[] = []
  let a = seed >>> 0
  const r = () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  for (let e = 0; e < m; e++) {
    const con = [...ids]
    for (let i = con.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1))
      ;[con[i], con[j]] = [con[j], con[i]]
    }
    ra.push(new Set(con.slice(0, k)))
  }
  return ra
}

describe('SÀN LÝ THUYẾT — biết khi nào phải nạp thêm đề, không phải sửa code', () => {
  it('kho đủ lớn thì sàn bằng 0', () => {
    expect(sanTrungTrungBinh(540, 18, 30)).toBe(0)
    expect(sanTrungTrungBinh(600, 18, 30)).toBe(0)
  })

  it('khớp số đã đo bằng dotrungcau.py', () => {
    expect(sanTrungTrungBinh(100, 18, 30)).toBeCloseTo(2.73, 2)
    expect(sanTrungTrungBinh(200, 18, 30)).toBeCloseTo(1.06, 2)
    expect(sanTrungTrungBinh(300, 18, 30)).toBeCloseTo(0.5, 2)
  })

  it('nói được còn thiếu bao nhiêu câu để trùng bằng 0', () => {
    expect(thieuBaoNhieuCauDeKhongTrung(200, 18, 30)).toBe(340)
    expect(thieuBaoNhieuCauDeKhongTrung(540, 18, 30)).toBe(0)
  })
})

describe('KHO ĐỦ LỚN ⇒ TRÙNG BẰNG 0 TUYỆT ĐỐI — tiêu chí đạt/trượt', () => {
  it('100 ca giả lập ngẫu nhiên, N ≥ m·k, KHÔNG MỘT NGOẠI LỆ', () => {
    let xau = 0
    for (let s = 0; s < 100; s++) {
      const m = 10 + (s % 21) // 10..30 em
      const k = 5 + (s % 14) // 5..18 câu
      const N = m * k + (s % 40) // luôn ≥ m·k
      const bo = sinhBoMotO(kho(N), k, m, s)
      for (const b of bo) expect(b.size).toBe(k)
      if (doTrung(bo).dinh !== 0) xau++
    }
    expect(xau).toBe(0)
  })

  it('vừa khít N = m·k thì các bộ rời nhau và phủ kín kho', () => {
    const m = 30
    const k = 18
    const bo = sinhBoMotO(kho(m * k), k, m, 7)
    expect(doTrung(bo).dinh).toBe(0)
    const tatCa = new Set<string>()
    for (const b of bo) for (const x of b) tatCa.add(x)
    expect(tatCa.size).toBe(m * k)
  })
})

describe('KHO KHÔNG ĐỦ — vẫn phải thấp hơn hẳn bộ đang chạy', () => {
  it('kho 200 · 30 em · 18 câu: đỉnh ≤ 2 (bộ hiện tại 5,8)', () => {
    for (let s = 0; s < 12; s++) {
      const bo = sinhBoMotO(kho(200), 18, 30, s)
      expect(doTrung(bo).dinh).toBeLessThanOrEqual(2)
    }
  })

  it('kho 300 · 30 em · 18 câu: đỉnh ≤ 1 (bộ hiện tại 4,7)', () => {
    for (let s = 0; s < 12; s++) {
      const bo = sinhBoMotO(kho(300), 18, 30, s)
      expect(doTrung(bo).dinh).toBeLessThanOrEqual(1)
    }
  })

  it('ĐỐI CHỨNG: cùng tham số, bốc độc lập đỉnh CAO HƠN HẲN', () => {
    let dinhMoi = 0
    let dinhCu = 0
    for (let s = 0; s < 12; s++) {
      dinhMoi += doTrung(sinhBoMotO(kho(200), 18, 30, s)).dinh
      dinhCu += doTrung(bocDocLap(200, 18, 30, s)).dinh
    }
    expect(dinhCu / 12).toBeGreaterThan(4)
    expect(dinhMoi / 12).toBeLessThanOrEqual(2)
  })
})

describe('TẦN SUẤT CÂN BẰNG — không câu nào 20 em gặp, câu nào không ai gặp', () => {
  it('pha 1 cho lệch tần suất ≤ 1', () => {
    for (const [N, k, m] of [
      [100, 18, 30],
      [200, 18, 30],
      [37, 5, 11],
    ] as const) {
      expect(lechTanSuat(chiaVongTron(kho(N), k, m, 3), kho(N))).toBeLessThanOrEqual(1)
    }
  })

  it('pha 2 KHÔNG ĐƯỢC PHÁ tần suất của pha 1', () => {
    for (const [N, k, m] of [
      [100, 18, 30],
      [200, 18, 30],
    ] as const) {
      expect(lechTanSuat(sinhBoMotO(kho(N), k, m, 5), kho(N))).toBeLessThanOrEqual(1)
    }
  })

  it('ĐỐI CHỨNG: bốc độc lập thì tần suất lệch nhiều', () => {
    expect(lechTanSuat(bocDocLap(100, 18, 30), kho(100))).toBeGreaterThan(1)
  })
})

describe('MỖI EM ĐÚNG SỐ CÂU, KHÔNG AI NHẬN HAI LẦN MỘT CÂU', () => {
  it('cỡ bộ đúng bằng k ở mọi cấu hình', () => {
    for (const [N, k, m] of [
      [200, 18, 30],
      [40, 18, 30],
      [18, 18, 30],
      [5, 18, 3],
    ] as const) {
      const bo = sinhBoMotO(kho(N), k, m, 1)
      for (const b of bo) expect(b.size).toBe(Math.min(k, N))
    }
  })

  it('kho NHỎ HƠN số câu cần: mọi em nhận trọn kho, không nổ, không lặp', () => {
    const bo = sinhBoMotO(kho(5), 18, 4, 2)
    for (const b of bo) expect(b.size).toBe(5)
    expect(doTrung(bo).dinh).toBe(5)
  })
})

describe('TẤT ĐỊNH — chấm lại phải ra đúng bộ cũ', () => {
  it('cùng seed cho cùng kết quả, từng em một', () => {
    const a = sinhBoMotO(kho(200), 18, 30, 42)
    const b = sinhBoMotO(kho(200), 18, 30, 42)
    for (let i = 0; i < a.length; i++) {
      expect([...a[i]].sort()).toEqual([...b[i]].sort())
    }
  })

  it('seed khác cho bộ khác — không phải hằng số nguỵ trang', () => {
    const a = sinhBoMotO(kho(200), 18, 30, 42)
    const b = sinhBoMotO(kho(200), 18, 30, 43)
    const khac = a.some((s, i) => [...s].sort().join() !== [...b[i]].sort().join())
    expect(khac).toBe(true)
  })
})

describe('CA BIÊN — không được nổ', () => {
  it('kho rỗng · 0 em · 0 câu', () => {
    expect(sinhBoMotO([], 18, 30, 1).every((s) => s.size === 0)).toBe(true)
    expect(sinhBoMotO(kho(10), 18, 0, 1)).toEqual([])
    expect(sinhBoMotO(kho(10), 0, 5, 1).every((s) => s.size === 0)).toBe(true)
  })

  it('một em thì không có cặp nào, đỉnh bằng 0', () => {
    const bo = sinhBoMotO(kho(50), 18, 1, 1)
    expect(bo[0].size).toBe(18)
    expect(doTrung(bo).dinh).toBe(0)
  })
})

describe('NGÂN SÁCH THỜI GIAN — thầy không đứng chờ giữa lúc mở ca', () => {
  it('60 em × 40 câu, kho 300: dưới 500 ms', () => {
    const t0 = performance.now()
    sinhBoMotO(kho(300), 40, 60, 9)
    expect(performance.now() - t0).toBeLessThan(500)
  })

  it('hết ngân sách thì DỪNG SỚM, vẫn trả bộ hợp lệ', () => {
    const pha1 = chiaVongTron(kho(60), 18, 30, 1)
    const ra = haDinh(pha1, 2, { VONG_DOI_CHO: 1000000, NGAN_SACH_MS: 1, LECH_TAN_SUAT_TOI_DA: 1 }, Date.now() - 10000)
    for (const b of ra) expect(b.size).toBe(18)
    expect(lechTanSuat(ra, kho(60))).toBeLessThanOrEqual(1)
  })
})

describe('BẤT BIẾN CỦA PHÉP ĐỔI CHỖ — chỗ này hỏng là chấm sai cả lớp', () => {
  /** Véc-tơ tần suất: mỗi câu được bao nhiêu em dùng. */
  const tanSuat = (bo: Set<string>[], ids: string[]) => {
    const d = new Map<string, number>(ids.map((i) => [i, 0]))
    for (const s of bo) for (const x of s) d.set(x, (d.get(x) ?? 0) + 1)
    return ids.map((i) => d.get(i) ?? 0)
  }

  it('PHA 2 KHÔNG ĐƯỢC ĐỔI ĐA TẬP CÂU CỦA CẢ LỚP', () => {
    // Đây là bất biến làm cho pha 2 an toàn: đổi CHỖ chứ không thay CÂU. Hỏng
    // bất biến này thì tần suất lệch, có câu 20 em gặp có câu không ai gặp —
    // vừa lộ đề vừa lãng phí kho.
    for (const [N, k, m] of [
      [100, 18, 30],
      [200, 18, 30],
      [60, 12, 25],
    ] as const) {
      const ids = kho(N)
      const truoc = chiaVongTron(ids, k, m, 11)
      const sau = haDinh(truoc, 12)
      expect(tanSuat(sau, ids)).toEqual(tanSuat(truoc, ids))
      // Và tổng số suất phát ra không đổi.
      expect(sau.reduce((n, s) => n + s.size, 0)).toBe(truoc.reduce((n, s) => n + s.size, 0))
    }
  })

  it('KHÔNG EM NÀO NHẬN HAI LẦN MỘT CÂU, ở 60 cấu hình ngẫu nhiên', () => {
    for (let s = 0; s < 60; s++) {
      const m = 2 + (s % 29)
      const k = 1 + (s % 20)
      const N = 5 + (s % 250)
      const bo = sinhBoMotO(kho(N), k, m, s)
      for (const b of bo) expect(b.size).toBe(Math.min(k, N))
    }
  })

  it('HAI CHỐT `c === a` VÀ `c === b` LÀ THỪA — chứng minh, không đoán', () => {
    // Đột biến "bỏ `c === a || c === b`" KHÔNG làm đỏ phép kiểm nào. Tôi kiểm
    // lại thay vì kết luận là phép kiểm yếu: hai nhánh đó đã bị hai chốt còn
    // lại chặn sẵn.
    //   c === a ⇒ `ung = { x ∈ bo[a] : x ∉ bo[a] }` RỖNG        ⇒ continue
    //   c === b ⇒ q ∈ bo[b] nên `bo[c].has(q)` ĐÚNG             ⇒ continue
    // Giữ lại vì nó nói rõ ý định và chặn sớm; ghi ở đây để người sau không
    // "dọn dẹp" nó rồi tưởng vô hại khi hai chốt kia đổi.
    const a = new Set(['x', 'y', 'z'])
    const ungKhiCLaA = [...a].filter((x) => !a.has(x))
    expect(ungKhiCLaA).toEqual([])
    const b = new Set(['y', 'w'])
    const q = 'y' // câu chung của a và b
    expect(b.has(q)).toBe(true)
  })
})
