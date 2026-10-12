// @vitest-environment node
// ĐỢT 16 (12/10) — ĐỘ TIN CẬY CỦA HỒ SƠ THÁI ĐỘ (thầy: "Hồ sơ của hs … đo kĩ hơn nữa thái độ của học sinh chính xác hơn 90%").
// server/src/thai-do-tin-cay.ts + `tinhThaiDo` (bai-hang-ngay.ts) + `/hs|/ph/nhip-hoc` (nhip-hoc-em.ts). Khoá:
//   1. NHÃN KHÔNG ĐỔI: 400 mẫu ngẫu nhiên (tests/_mau-thai-do-dot16.ts) — chuỗi nhãn CHỤP TỪ BẢN GỐC (trước đợt 16, commit c7b438b2) phải trùng
//      từng ký tự; cộng các mẫu tay có nhãn ghi rõ. Luật kết luận và luật Lười (thầy đã duyệt) không bị đụng.
//   2. Độ tin cậy 0–99 có mặt đúng chỗ (tín hiệu đã đo, kết luận trừ "Chưa đủ dữ liệu"), không bao giờ 100.
//   3. Tăng theo cỡ mẫu khi tỉ lệ giữ nguyên; ≥ 90 với mẫu lớn rõ ràng; < 90 với mẫu nhỏ sát ngưỡng, kèm câu `canThem` đúng số.
import { describe, expect, it } from 'vitest'
import { ketLuanThaiDo, tinhThaiDo } from '../server/src/bai-hang-ngay'
import type { NhanThaiDo } from '../server/src/bai-hang-ngay-kieu'
import {
  betaChinhQuy, CACH_TINH_TIN_CAY, doTinCayTinHieu, NGUONG_CHAC, phanPhoiChuan, sangDoTinCay, tinCayKetLuan, tinCayNhanNgay, xacSuatNhanNgay,
  xacSuatVung, type SoLieuThaiDo,
} from '../server/src/thai-do-tin-cay'
import { lucVn, mauNgauNhien, mauTheoMa, SO_MAU, type MauThaiDo } from './_mau-thai-do-dot16'

/** Nhãn của 400 mẫu `mauNgauNhien(1 … 400)` tính bằng `tinhThaiDo` BẢN GỐC (trước đợt 16). C Chăm chỉ · D Chưa đều · L Lười · P Đối phó · X Chưa đủ dữ liệu. */
const NHAN_GOC =
  'PLPLCPXDDPLLDDLLLDDPDPXPCPLCLPPPDDXPDPDDPPPPXCLPPLLLDDCDLDDDDPLDLLPLPLLDPDLDLLXPLCLPPXXCPXLLLLDLPLCL' +
  'DPPPPPPPCDCDPPCPDDDPXPLPDDPLLCCLPDDDPDLLPPDCPXPCLDLLCPLDCLLLDCDCDLPDLPPXXPCPLDCDDPXPLDPDDPXLLLPLLPDL' +
  'DPLLDDDPCPPPDLCDDXDXDPCDXDCPPLLLLLPLDPDDDPPDDPXDPLCDDPDPLPPPLPPDDPLDPPPXPPLPPLDLXPDXPPDCXDDLPPPPDPDL' +
  'PDCLPLXPXLPLXDCLLLPLPLDLCPDPPDLLLPDDXCLPPPLDDXCDPCPDXLPLCLDLPCDLPPLLCPDLPLLPPPDPPPLCDCLCPDDLDLPPLDLD'
const KY: Record<NhanThaiDo, string> = { 'cham-chi': 'C', 'chua-deu': 'D', luoi: 'L', 'doi-pho': 'P', 'chua-du-du-lieu': 'X' }

/** 14 ngày đủ mức; `soLuot` lượt rải đều, `soNhanh` lượt đầu 3 giây (quá nhanh) trong đó `soNhanhDung` lượt đúng; chọn xoay A–D. */
function mauNhanh(soLuot: number, soNhanh: number, soNhanhDung: number): MauThaiDo {
  const m = mauTheoMa('d'.repeat(14))
  const luot = Array.from({ length: soLuot }, (_, i) => {
    const ngay = m.ngay[i % 14]!.ngay
    const nhanh = i < soNhanh
    return { luc: lucVn(ngay, 10, Math.floor(i / 14)), ngay, goc: `N${i}`, dung: nhanh ? i < soNhanhDung : true, giay: nhanh ? 3 : 40, loai: 'trac-nghiem' as const, chon: 'ABCD'[i % 4]! }
  })
  return { ...m, luot, cauDaLam: new Set(luot.map((l) => l.goc)) }
}

const soLieu = (x: Partial<SoLieuThaiDo>): SoLieuThaiDo => ({
  ngay: { du: 0, n: 0 }, nhanh: { nhanh: 0, coGiay: 0, dungNhanh: 0, nhanhCoKq: 0 }, don: { khuya: 0, tong: 0 }, goiY: { hoTro: 0, soCau: 0 },
  lap: { trongChuoi: 0, tong: 0 }, xuHuong: { ganDung: 0, gan: 0, truocDung: 0, truoc: 0 }, ...x,
})

describe('1 · nhãn KHÔNG đổi (luật thầy đã duyệt)', () => {
  it(`${SO_MAU} mẫu ngẫu nhiên: chuỗi nhãn trùng từng ký tự với bản gốc; mọi nhánh luật đều có mặt`, () => {
    const s = Array.from({ length: SO_MAU }, (_, i) => KY[tinhThaiDo(mauNgauNhien(i + 1)).ketLuan.nhan]).join('')
    expect(s).toBe(NHAN_GOC)
    for (const c of 'CDLPX') expect(NHAN_GOC).toContain(c)
  })

  it.each([
    ['d'.repeat(14), false, 'cham-chi'],
    ['ddddddddtdd', false, 'cham-chi'],
    ['ddkdddtdtdd', false, 'chua-deu'],
    ['dkkkdddddd', false, 'chua-deu'], // 3 ngày bỏ nhưng đủ 6 ngày liền gần nhất ⇒ thoát Lười
    ['dkktktdtkk', false, 'luoi'],
    ['kkkkkkdddddd', true, 'chua-deu'], // hôm nay đủ ⇒ chuỗi 6 ⇒ thoát
    ['dd', false, 'chua-du-du-lieu'],
  ] as const)('mẫu tay %s (hôm nay cuối: %s) ⇒ %s; ngoài hai trường mới, kết luận giữ đúng ba khoá cũ', (ma, homNay, nhan) => {
    const r = tinhThaiDo(mauTheoMa(ma, homNay))
    expect(r.ketLuan.nhan).toBe(nhan)
    const { doTinCay: _a, canThem: _b, ...goc } = r.ketLuan
    expect(Object.keys(goc).sort()).toEqual(['chu', 'lyDo', 'nhan'])
  })

  it('`ketLuanThaiDo` gọi thẳng (không số liệu) giữ y hợp đồng cũ: không trường mới', () => {
    const r = tinhThaiDo(mauTheoMa('d'.repeat(14)))
    const tron = r.tinHieu.map(({ doTinCay: _d, ...x }) => x)
    expect(ketLuanThaiDo(tron, 0, 14)).toEqual({ nhan: r.ketLuan.nhan, chu: r.ketLuan.chu, lyDo: r.ketLuan.lyDo })
  })

  it('quá nhanh mà đúng thấp ⇒ Đối phó (như cũ), chỉ thêm độ tin cậy', () => {
    expect(tinhThaiDo(mauNhanh(56, 40, 10)).ketLuan.nhan).toBe('doi-pho')
    expect(tinhThaiDo(mauNhanh(20, 6, 2)).ketLuan.nhan).toBe('doi-pho')
    expect(tinhThaiDo(mauNhanh(56, 4, 1)).ketLuan.nhan).toBe('cham-chi')
  })
})

describe('2 · độ tin cậy có mặt đúng chỗ, 0–99', () => {
  it('tín hiệu: có `doTinCay` khi đã đo, vắng khi "chưa đủ"; kết luận: có trừ "Chưa đủ dữ liệu"; `canThem` chỉ khi dưới 90', () => {
    let soTin = 0, soKl = 0
    for (let i = 1; i <= SO_MAU; i++) {
      const r = tinhThaiDo(mauNgauNhien(i))
      for (const t of r.tinHieu) {
        if (t.muc === 'chua-du') expect(t.doTinCay).toBeUndefined()
        else {
          expect(Number.isInteger(t.doTinCay)).toBe(true)
          expect(t.doTinCay!).toBeGreaterThanOrEqual(0)
          expect(t.doTinCay!).toBeLessThanOrEqual(99)
          soTin++
        }
      }
      const k = r.ketLuan
      if (k.nhan === 'chua-du-du-lieu') {
        expect(k.doTinCay).toBeUndefined()
        expect(k.canThem).toBeUndefined()
      } else {
        expect(k.doTinCay!).toBeGreaterThanOrEqual(0)
        expect(k.doTinCay!).toBeLessThanOrEqual(99)
        if (k.doTinCay! >= NGUONG_CHAC) expect(k.canThem).toBeUndefined()
        else expect(k.canThem).toMatch(/^(Cần thêm khoảng \d+ (ngày có số liệu|lượt làm câu)|Tỉ lệ ngày đủ mức|Các tỉ lệ đang sát ngưỡng)/)
        soKl++
      }
    }
    expect(soTin).toBeGreaterThan(1000)
    expect(soKl).toBeGreaterThan(300)
  })

  it('không bao giờ 100 (kể cả chắc chắn tuyệt đối theo sự việc); câu cách tính nói rõ phương pháp', () => {
    expect(sangDoTinCay(1)).toBe(99)
    expect(tinCayNhanNgay('luoi', { n: 10, du: 9, chuoiKhongLam: 3, chuoiDuGanNhat: 0 }).doTinCay).toBe(99) // 3 ngày liền không làm: sự việc
    expect(CACH_TINH_TIN_CAY).toMatch(/Beta/)
    expect(CACH_TINH_TIN_CAY).toMatch(/Jeffreys/)
    expect(CACH_TINH_TIN_CAY).toMatch(/90%/)
  })

  it('toán: I_x(a, b) khớp tổng nhị thức; Φ(1,645) ≈ 0,95', () => {
    const c = (n: number, k: number) => { let r = 1; for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i; return r }
    // I_x(k, n − k + 1) = P(Bin(n, x) ≥ k)
    for (const [x, kk, n] of [[0.7, 2, 4], [0.3, 5, 12], [0.85, 9, 10]] as const) {
      let s = 0
      for (let j = kk; j <= n; j++) s += c(n, j) * x ** j * (1 - x) ** (n - j)
      expect(betaChinhQuy(x, kk, n - kk + 1)).toBeCloseTo(s, 9)
    }
    expect(phanPhoiChuan(1.645)).toBeCloseTo(0.95, 3)
    expect(phanPhoiChuan(-1)).toBeCloseTo(0.1587, 3)
  })
})

describe('3 · tăng theo cỡ mẫu; ≥ 90 khi rõ ràng, < 90 khi mẫu nhỏ sát ngưỡng', () => {
  it('tỉ lệ giữ nguyên, số ngày tăng ⇒ độ tin cậy của nhãn không giảm (Chăm 100%, Chưa đều 60%, Lười 20%)', () => {
    for (const [nhan, ti] of [['cham-chi', 1], ['chua-deu', 0.6], ['luoi', 0.2]] as const) {
      let truoc = -1
      for (let n = 5; n <= 60; n += 5) {
        const d = tinCayNhanNgay(nhan, { n, du: Math.round(ti * n), chuoiKhongLam: 0, chuoiDuGanNhat: 0 }).doTinCay!
        expect(d, `${nhan} n=${n}`).toBeGreaterThanOrEqual(truoc)
        truoc = d
      }
      expect(truoc, nhan).toBeGreaterThanOrEqual(NGUONG_CHAC)
    }
  })

  it('tín hiệu: phóng to số liệu giữ tỉ lệ ⇒ xác suất vùng đã đo không giảm (mọi tín hiệu)', () => {
    const s = soLieu({
      ngay: { du: 6, n: 10 }, nhanh: { nhanh: 9, coGiay: 20, dungNhanh: 2, nhanhCoKq: 9 }, don: { khuya: 3, tong: 30 }, goiY: { hoTro: 7, soCau: 10 },
      lap: { trongChuoi: 6, tong: 40 }, xuHuong: { ganDung: 8, gan: 20, truocDung: 15, truoc: 20 },
    })
    const muc = { 'ngay-du-muc': 'chuY', 'qua-nhanh': 'xau', 'don-bai': 'tot', 'goi-y': 'xau', 'chon-lap': 'xau', 'xu-huong': 'xau' } as const
    for (const [ma, v] of Object.entries(muc) as [keyof typeof muc, (typeof muc)[keyof typeof muc]][]) {
      let truoc = -1
      for (let h = 1; h <= 30; h++) {
        const p = xacSuatVung(ma, s, h)[v]
        expect(p, `${ma} ×${h}`).toBeGreaterThanOrEqual(truoc - 1e-9)
        truoc = p
      }
      expect(truoc, ma).toBeGreaterThan(0.9)
    }
  })

  it('mẫu lớn rõ ràng ⇒ ≥ 90, không câu cần thêm', () => {
    expect(tinCayNhanNgay('cham-chi', { n: 14, du: 14, chuoiKhongLam: 0, chuoiDuGanNhat: 14 })).toEqual({ doTinCay: 99 })
    expect(tinCayNhanNgay('luoi', { n: 10, du: 1, chuoiKhongLam: 0, chuoiDuGanNhat: 0 }).doTinCay).toBeGreaterThanOrEqual(90)
    expect(tinCayNhanNgay('chua-deu', { n: 30, du: 18, chuoiKhongLam: 0, chuoiDuGanNhat: 0 }).doTinCay).toBeGreaterThanOrEqual(90)
    const r = tinhThaiDo(mauTheoMa('d'.repeat(14)))
    expect(r.ketLuan).toMatchObject({ nhan: 'cham-chi' })
    expect(r.ketLuan.doTinCay!).toBeGreaterThanOrEqual(90)
    expect(r.ketLuan.canThem).toBeUndefined()
    expect(r.tinHieu.find((t) => t.ma === 'ngay-du-muc')!.doTinCay!).toBeGreaterThanOrEqual(90)
    const nhanh = tinhThaiDo(mauNhanh(56, 40, 10))
    expect(nhanh.tinHieu.find((t) => t.ma === 'qua-nhanh')).toMatchObject({ muc: 'xau' })
    expect(nhanh.tinHieu.find((t) => t.ma === 'qua-nhanh')!.doTinCay!).toBeGreaterThanOrEqual(90)
    expect(nhanh.ketLuan.doTinCay!).toBeGreaterThanOrEqual(90)
    // 200 lượt, 2 lượt khuya ⇒ chắc chắn không dồn bài
    expect(doTinCayTinHieu('don-bai', 'tot', soLieu({ don: { khuya: 2, tong: 200 } }))!).toBeGreaterThanOrEqual(90)
  })

  it('mẫu nhỏ / sát ngưỡng ⇒ < 90 kèm câu cần thêm nói thật', () => {
    const ba = tinCayNhanNgay('cham-chi', { n: 3, du: 3, chuoiKhongLam: 0, chuoiDuGanNhat: 3 }) // 3/3 ngày: mới 3 ngày
    expect(ba.doTinCay!).toBeLessThan(90)
    expect(ba.canThem).toMatch(/^Cần thêm khoảng \d+ ngày có số liệu \(giữ nhịp như hiện nay\) để độ tin cậy đạt 90%\.$/)
    const sat = tinCayNhanNgay('luoi', { n: 10, du: 4, chuoiKhongLam: 0, chuoiDuGanNhat: 0 }) // đúng 40%
    expect(sat.doTinCay!).toBeLessThan(90)
    expect(sat.canThem).toMatch(/đang sát ngưỡng 40%/)
    expect(tinCayNhanNgay('cham-chi', { n: 11, du: 9, chuoiKhongLam: 0, chuoiDuGanNhat: 0 }).doTinCay!).toBeLessThan(90) // 82%
    const r = tinhThaiDo(mauTheoMa('ddddddddtdd'))
    expect(r.ketLuan.nhan).toBe('cham-chi')
    expect(r.ketLuan.doTinCay!).toBeLessThan(90)
    expect(r.ketLuan.canThem).toMatch(/^Cần thêm khoảng \d+ ngày/)
    const nho = tinhThaiDo(mauNhanh(20, 6, 2)) // 6/20 quá nhanh (đúng 30%), nhóm ấy đúng 2/6
    expect(nho.ketLuan.nhan).toBe('doi-pho')
    expect(nho.ketLuan.doTinCay!).toBeLessThan(90)
    expect(nho.ketLuan.canThem).toMatch(/^Cần thêm khoảng \d+ lượt làm câu|^Các tỉ lệ đang sát ngưỡng/)
  })

  it('số trong `canThem` đúng là nhỏ nhất: thêm k ngày (giữ tỉ lệ) đạt 90, thêm k − 1 thì chưa', () => {
    for (const [nhan, n, du] of [['cham-chi', 3, 3], ['cham-chi', 11, 10], ['luoi', 8, 2], ['chua-deu', 11, 7]] as const) {
      const d = { n, du, chuoiKhongLam: 0, chuoiDuGanNhat: 0 }
      const r = tinCayNhanNgay(nhan, d)
      const k = Number(/khoảng (\d+) ngày/.exec(r.canThem ?? '')?.[1])
      expect(k, `${nhan} ${du}/${n}`).toBeGreaterThan(0)
      const p = (them: number) => 100 * xacSuatNhanNgay(nhan, d, (n + them) / n)!
      expect(p(k)).toBeGreaterThanOrEqual(89.5)
      if (k > 1) expect(p(k - 1)).toBeLessThan(89.5)
    }
  })

  it('kết luận theo sự việc: thoát Lười (6 ngày liền) chắc chắn không Lười; 3 ngày liền không làm ⇒ Lười chắc chắn', () => {
    expect(xacSuatNhanNgay('luoi', { n: 11, du: 4, chuoiKhongLam: 0, chuoiDuGanNhat: 6 })).toBe(0)
    expect(xacSuatNhanNgay('luoi', { n: 11, du: 9, chuoiKhongLam: 3, chuoiDuGanNhat: 2 })).toBe(1)
    expect(xacSuatNhanNgay('cham-chi', { n: 11, du: 9, chuoiKhongLam: 3, chuoiDuGanNhat: 2 })).toBe(0)
    // Chưa đủ dữ liệu: giữ nguyên như cũ (không độ tin cậy)
    expect(tinCayKetLuan('chua-du-du-lieu', [], soLieu({}), 0, 0)).toEqual({})
  })
})

describe('Nhịp học (/hs, /ph): cùng phép với hồ sơ', () => {
  it('nhóm theo ngày ⇒ cùng độ tin cậy với nhãn tương ứng của luật kết luận (không dồn bài)', () => {
    const d = { n: 11, du: 7, chuoiKhongLam: 0, chuoiDuGanNhat: 2 }
    const s = soLieu({ ngay: { du: 7, n: 11 } })
    expect(tinCayKetLuan('chua-deu', [], s, 0, 2)).toEqual(tinCayNhanNgay('chua-deu', d))
  })
})
