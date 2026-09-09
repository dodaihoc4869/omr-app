// PHÂN TẦNG BLUEPRINT — mọi em cùng cấu trúc đề, hạ trùng bên trong từng ô.
//
// DE-RIENG-CHAN-TRAN-TRUNG.md: "Cấm hạ trùng bằng cách cho em này đề dễ hơn em
// kia." Tệp này khoá đúng điều đó, và khoá luôn tính tất định để chấm lại một
// ca cũ không bao giờ ra bộ khác.
import { describe, expect, it } from 'vitest'
import { chiaSuatChoO, dungOChoPhan, sinhBoTheoEm } from '../src/lib/de-rieng-blueprint'
import type { SoCauMoiPhan, TeacherExamSource } from '../src/data/examContent'

/** Kho giả: `soChuyenDe` chuyên đề × 3 mức độ × `moiO` câu, cho mỗi phần. */
function khoThu(moiO: number, soChuyenDe = 2): TeacherExamSource[] {
  const cd = Array.from({ length: soChuyenDe }, (_, i) => 'CD' + i)
  const md = ['biet', 'hieu', 'van_dung'] as const
  const mk = (phan: string) => {
    const ra: Record<string, unknown>[] = []
    for (const c of cd) for (const d of md) for (let i = 0; i < moiO; i++) ra.push({ id: `${phan}-${c}-${d}-${i}`, chuyenDe: c, mucDo: d })
    return ra
  }
  return [{ maDe: 'X', phanI: mk('I'), phanII: mk('II'), phanIII: mk('III') } as unknown as TeacherExamSource]
}

const SBD = (n: number) => Array.from({ length: n }, (_, i) => String(12000 + i))
const SO: SoCauMoiPhan = { I: 18, II: 4, III: 6 }

describe('CHIA SUẤT CHO Ô — tất định, không vượt cỡ kho', () => {
  it('chia hết thì chia đều', () => {
    expect(chiaSuatChoO([10, 10, 10], 9)).toEqual([3, 3, 3])
  })

  it('không chia hết thì lớn-dư-trước, tổng vẫn đúng', () => {
    const r = chiaSuatChoO([10, 5, 1], 8)
    expect(r.reduce((a, b) => a + b, 0)).toBe(8)
    expect(r[0]).toBeGreaterThanOrEqual(r[1])
  })

  it('KHÔNG Ô NÀO vượt cỡ kho của nó', () => {
    const cỡ = [2, 3, 50]
    const r = chiaSuatChoO(cỡ, 40)
    r.forEach((x, i) => expect(x).toBeLessThanOrEqual(cỡ[i]))
    expect(r.reduce((a, b) => a + b, 0)).toBe(40)
  })

  it('cần nhiều hơn cả kho thì lấy trọn kho, không nổ', () => {
    expect(chiaSuatChoO([2, 3], 99)).toEqual([2, 3])
  })

  it('TẤT ĐỊNH — gọi lại ra đúng bảng cũ', () => {
    const a = chiaSuatChoO([7, 11, 3, 5], 13)
    const b = chiaSuatChoO([7, 11, 3, 5], 13)
    expect(a).toEqual(b)
  })

  it('ca biên: kho rỗng · k = 0', () => {
    expect(chiaSuatChoO([], 5)).toEqual([])
    expect(chiaSuatChoO([5, 5], 0)).toEqual([0, 0])
  })
})

describe('DỰNG Ô — nhóm đúng theo chuyên đề × mức độ', () => {
  it('kho 2 chuyên đề × 3 mức độ ra đúng 6 ô', () => {
    const o = dungOChoPhan(khoThu(5)[0].phanI as unknown as { id: string; chuyenDe?: string; mucDo?: string }[], 'I', 18)
    expect(o.length).toBe(6)
    expect(o.reduce((n, x) => n + x.can, 0)).toBe(18)
  })

  it('câu THIẾU NHÃN gom vào ô "(chưa gán)" chứ không bị bỏ rơi', () => {
    const o = dungOChoPhan([{ id: 'a' }, { id: 'b', chuyenDe: 'CD0' }], 'I', 2)
    const khoa = o.map((x) => x.khoa)
    expect(khoa.some((k) => k.includes('(chưa gán)'))).toBe(true)
    expect(o.reduce((n, x) => n + x.ids.length, 0)).toBe(2)
  })
})

describe('MỌI EM CÙNG BLUEPRINT — cấm cho em này dễ hơn em kia', () => {
  const nguon = khoThu(40) // 2 CD × 3 MD × 40 = 240 câu mỗi phần
  const em = SBD(30)
  const kq = sinhBoTheoEm(nguon, em, SO, 'CA1')

  it('mọi em đúng số câu mỗi phần', () => {
    for (const s of em) {
      const bo = kq.boTheoEm[s]
      expect(bo.filter((x) => x.startsWith('I-')).length).toBe(18)
      expect(bo.filter((x) => x.startsWith('II-')).length).toBe(4)
      expect(bo.filter((x) => x.startsWith('III-')).length).toBe(6)
    }
  })

  it('mọi em đúng số câu mỗi CHUYÊN ĐỀ và mỗi MỨC ĐỘ', () => {
    const van = (s: string) => {
      const d = new Map<string, number>()
      for (const id of kq.boTheoEm[s]) {
        const [phan, cd, md] = id.split('-')
        d.set(`${phan}|${cd}|${md}`, (d.get(`${phan}|${cd}|${md}`) ?? 0) + 1)
      }
      return [...d.entries()].sort().map(([k, v]) => `${k}=${v}`).join(',')
    }
    const chuan = van(em[0])
    for (const s of em) expect(van(s)).toBe(chuan)
  })

  it('không em nào nhận trùng câu trong chính bộ của mình', () => {
    for (const s of em) expect(new Set(kq.boTheoEm[s]).size).toBe(kq.boTheoEm[s].length)
  })
})

describe('KHO ĐỦ LỚN ⇒ ĐỈNH TRÙNG BẰNG 0', () => {
  it('30 em, mỗi ô thừa chỗ', () => {
    // Mỗi phần I cần 18 câu × 30 em = 540; kho 2×3×100 = 600 câu.
    const kq = sinhBoTheoEm(khoThu(100), SBD(30), SO, 'CA-DU')
    expect(kq.dinhTrung).toBe(0)
    expect(kq.thieuDeVeKhong).toBe(0)
  })

  // ================= MỘT MÂU THUẪN THẬT TRONG ĐẶC TẢ =======================
  //
  // Đặc tả đòi HAI điều cùng lúc, và chúng chọi nhau:
  //   (a) "chạy thuật toán độc lập trong TỪNG Ô của blueprint";
  //   (b) "kho 200 câu, 30 em, 18 câu Phần I: đỉnh trùng ≤ 2".
  //
  // Con số (b) đo trên MỘT KHO LIỀN 200 câu (`dotrungcau.py` không hề phân
  // tầng). Phân tầng chẻ 200 câu thành 6 ô (2 chuyên đề × 3 mức độ), mỗi ô ~34
  // câu và mỗi em lấy 3 câu trong ô. Trong một ô: 30 em × 3 câu = 90 suất trên
  // 34 câu ⇒ SÀN LÝ THUYẾT của riêng ô đó đã là (3/34)·(90−34)/29 ≈ 0,17 và
  // đỉnh thực tế 1–2. Sáu ô cộng lại cho đỉnh phần I quanh 5.
  //
  // Không thuật toán nào phá được: phân tầng càng mịn thì sàn càng cao. Đây là
  // đánh đổi phải để THẦY chốt, không phải chỗ để tôi nới ngưỡng cho vừa số đo.
  //
  // Nên hai phép kiểm dưới đây đo HAI thứ khác nhau, và nói rõ cái nào là cái
  // nào — thay vì gộp lại rồi lấy con số dễ hơn.
  it('ĐÚNG ĐIỀU KIỆN ĐÃ ĐO: kho LIỀN 200 câu, 30 em, 18 câu ⇒ đỉnh ≤ 2', () => {
    // Một ô duy nhất = không phân tầng = đúng cách `dotrungcau.py` đo.
    const motO: TeacherExamSource[] = [
      {
        maDe: 'X',
        phanI: Array.from({ length: 200 }, (_, i) => ({ id: 'I-' + i, chuyenDe: 'CD', mucDo: 'hieu' })),
        phanII: [],
        phanIII: [],
      } as unknown as TeacherExamSource,
    ]
    const em = SBD(30)
    const kq = sinhBoTheoEm(motO, em, { I: 18, II: 0, III: 0 }, 'CA-LIEN')
    expect(kq.dinhTrung).toBeLessThanOrEqual(2)
  })

  it('PHÂN TẦNG LÀM SÀN CAO LÊN — đo và khai ra, không giấu', () => {
    const em = SBD(30)
    const kq = sinhBoTheoEm(khoThu(34), em, SO, 'CA-CHAT') // 204 câu phần I, 6 ô
    const dinhPhan = (tienTo: string) => {
      const tap = em.map((s) => new Set(kq.boTheoEm[s].filter((x) => x.startsWith(tienTo))))
      let d = 0
      for (let a = 0; a < tap.length; a++)
        for (let b = a + 1; b < tap.length; b++) {
          let g = 0
          for (const x of tap[a]) if (tap[b].has(x)) g++
          if (g > d) d = g
        }
      return d
    }
    // Cùng cỡ kho (204 ≈ 200) mà đỉnh phần I CAO HƠN hẳn ngưỡng 2 của kho liền.
    // Đây là cái giá của việc mọi em cùng blueprint.
    const dI = dinhPhan('I-')
    expect(dI).toBeGreaterThan(2)
    // Nhưng vẫn phải THẤP HƠN HẲN bộ bốc độc lập đang chạy (đo được 5,8).
    expect(dI).toBeLessThanOrEqual(5)
    expect(kq.thieuDeVeKhong).toBeGreaterThan(0)
    // Bất biến: đỉnh gộp không vượt tổng đỉnh ba phần.
    expect(kq.dinhTrung).toBeLessThanOrEqual(dinhPhan('I-') + dinhPhan('II-') + dinhPhan('III-'))
  })
})

describe('TẦN SUẤT VÀ TỐC ĐỘ', () => {
  it('lệch tần suất trong mọi ô ≤ 1', () => {
    expect(sinhBoTheoEm(khoThu(40), SBD(30), SO, 'CA2').lechTanSuat).toBeLessThanOrEqual(1)
  })

  it('60 em × 40 câu dưới 500 ms', () => {
    const kq = sinhBoTheoEm(khoThu(30), SBD(60), { I: 28, II: 4, III: 8 }, 'CA3')
    expect(kq.msChay).toBeLessThan(500)
  })
})

describe('TẤT ĐỊNH — chấm lại ca cũ không được ra bộ khác', () => {
  it('cùng ca, cùng kho, cùng danh sách ⇒ cùng bộ, từng em một', () => {
    const a = sinhBoTheoEm(khoThu(40), SBD(30), SO, 'CA-X')
    const b = sinhBoTheoEm(khoThu(40), SBD(30), SO, 'CA-X')
    expect(a.boTheoEm).toEqual(b.boTheoEm)
  })

  it('mã ca khác ⇒ bộ khác', () => {
    const a = sinhBoTheoEm(khoThu(40), SBD(30), SO, 'CA-X')
    const b = sinhBoTheoEm(khoThu(40), SBD(30), SO, 'CA-Y')
    expect(a.boTheoEm).not.toEqual(b.boTheoEm)
  })
})

describe('KHÔNG LẶNG LẼ SAI', () => {
  it('danh sách rỗng thì nói ra, không trả bộ rỗng im lặng', () => {
    const kq = sinhBoTheoEm(khoThu(10), [], SO, 'CA4')
    expect(kq.canhBao.length).toBeGreaterThan(0)
    expect(kq.boTheoEm).toEqual({})
  })

  it('kho phần nào nhỏ hơn số câu cần thì cảnh báo đúng phần đó', () => {
    const kq = sinhBoTheoEm(khoThu(1), SBD(5), SO, 'CA5') // 6 câu mỗi phần
    expect(kq.canhBao.join(' ')).toContain('Phần I')
    for (const s of SBD(5)) expect(kq.boTheoEm[s].filter((x) => x.startsWith('I-')).length).toBe(6)
  })

  it('SBD rỗng hoặc trùng không làm vỡ bảng', () => {
    const kq = sinhBoTheoEm(khoThu(10), ['12001', '', '  ', '12002'], SO, 'CA6')
    expect(Object.keys(kq.boTheoEm).sort()).toEqual(['12001', '12002'])
  })
})
