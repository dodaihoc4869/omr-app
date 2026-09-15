/**
 * THÁP 999 TẦNG · ĐỘ KHÓ THEO SAO · 120 CẤP.
 *
 * Thầy chốt 15-09: *"khó là những câu 2 sao... 2 sao khó nhất, xong đến 1 sao,
 * rồi 0 sao"* · *"nâng tầng tháp lên 999 tầng, diệt bot cũng lên 999 con bot"*
 * · *"độ khó phải rõ ràng từ cấp số 10, từ số 13 trở đi là phải lâu mới lên
 * được cấp"*.
 *
 * Bốn thứ tệp này khoá, đều là lỗi THẬT của bản cũ, đo được bằng số:
 *  1. Tầng cao phải rút câu SAO CAO HƠN — bản cũ mọi tầng rút chung một rổ.
 *  2. KHÔNG LẶP qua nhiều lượt leo — bản cũ xoá sổ mỗi lần bắt đầu leo.
 *  3. Tầng nào cũng tốn ~5 câu để hạ trùm — bản cũ từ tầng ~25 chỉ cần 1 câu.
 *  4. Sáu hệ trùm đều xuất hiện — bản cũ chỉ chạy bốn, thiếu Điện hoá và Hữu cơ.
 */
import { describe, it, expect } from 'vitest'
import {
  TANG_TOI_DA, SO_CAU_HA_TRUM, heTrumTang, mauTrumTang, satThuongTrum,
  tenTrumTang, saoMucTieuTheoTang, capTheoTang, congNenTheoCap, heSoTienHoa,
  laTangCanh,
} from '../src/game/than-thu-hoa-hoc/can-bang-thap'
import {
  rutCauChoTang, ghiLichSu, tronLichSu, vaLichSu, CAU_HINH_RUT,
  type CauUngVien, type DongLichSuThap,
} from '../src/game/than-thu-hoa-hoc/rut-cau-thap'
import { DS_HE } from '../src/game/than-thu-hoa-hoc/tuong-khac'
import { CAP_TOI_DA } from '../src/game/than-thu-hoa-hoc/hinh-thai'
import { bacTheoTang } from '../src/game/than-thu-hoa-hoc/kho-cau-hoi'
import { locTheoBac } from '../src/game/than-thu-hoa-hoc/cau-hoi-cua-em'

/** Ngẫu nhiên TẤT ĐỊNH — phép kiểm không được phụ thuộc `Math.random`. */
function ngauNhienGia(hat = 12345): () => number {
  let x = hat
  return () => { x = (x * 1103515245 + 12345) % 2147483648; return x / 2147483648 }
}

/** Kho giả: 120 câu, sao lệch hẳn về phía dễ — đúng cảnh kho thật của em. */
function khoGia(n = 120): CauUngVien[] {
  const ra: CauUngVien[] = []
  for (let i = 0; i < n; i++) {
    // 55% câu 0 sao, 30% câu 1 sao, 15% câu 2 sao.
    const sao = i % 20 < 11 ? 0 : i % 20 < 17 ? 1 : 2
    ra.push({ qid: `q${i}`, sao, chuyenDe: `cd${i % 7}`, tungSai: i % 3 === 0 })
  }
  return ra
}

/** Leo một lượt `soCau` câu ở tầng `tang`, trả về danh sách qid đã hỏi. */
function leoMotLuot(kho: CauUngVien[], tang: number, soCau: number, lichSu: DongLichSuThap[], hat: number) {
  const rnd = ngauNhienGia(hat)
  const daHoi: string[] = []
  const chuyenDe = new Set<string>()
  let so = lichSu
  let t = Date.now()
  for (let i = 0; i < soCau; i++) {
    const kq = rutCauChoTang({
      kho, tang, saoMucTieu: saoMucTieuTheoTang(tang),
      lichSu: so, daHoiLuotNay: daHoi, chuyenDeDaGap: chuyenDe, ngauNhien: rnd,
    })
    if (kq.cau === null) break
    daHoi.push(kq.cau.qid)
    chuyenDe.add(kq.cau.chuyenDe)
    so = ghiLichSu(so, kq.cau.qid, ++t)
  }
  return { daHoi, lichSu: so }
}

describe('Tầng càng cao câu càng khó', () => {
  it('sao trung bình tăng theo tầng, không nấc nào tụt', () => {
    const kho = khoGia()
    const moc = [1, 100, 250, 400, 550, 700, 850, 999]
    const bang: { tang: number; sao: number }[] = []
    for (const t of moc) {
      // 10 câu = đúng một lượt leo thật. Lấy 40 câu một tầng là bắt thuật
      // toán vét cạn cả rổ 2 sao rồi tụt xuống 1 sao — đo sai cái đang đo.
      const { daHoi } = leoMotLuot(kho, t, 10, [], 777)
      const sao = daHoi.reduce((s, q) => s + (kho.find((c) => c.qid === q)?.sao ?? 0), 0) / daHoi.length
      bang.push({ tang: t, sao })
    }
    for (let i = 1; i < bang.length; i++) {
      expect(bang[i]!.sao, `tầng ${bang[i]!.tang} so với ${bang[i - 1]!.tang}`)
        .toBeGreaterThanOrEqual(bang[i - 1]!.sao - 0.001)
    }
    // Đáy và đỉnh phải cách nhau rõ rệt, không phải nhích một tí.
    expect(bang[bang.length - 1]!.sao - bang[0]!.sao).toBeGreaterThan(1.2)
    // eslint-disable-next-line no-console
    console.log('  ' + bang.map((b) => `tầng ${b.tang}: ★${b.sao.toFixed(2)}`).join(' · '))
  })

  /**
   * ĐỐI CHỨNG VỚI CÁCH CŨ — chứng minh bản cũ thật sự phẳng, không phải tôi
   * nói suông. `locTheoBac` + `bacTheoTang` vẫn còn trong kho nên đo được.
   */
  it('cách cũ (lọc theo bậc mức độ) cho thang PHẲNG — đây là lỗi đang sửa', () => {
    const kho = khoGia()
    // Kho thật của em phần lớn CHƯA gắn mức độ ⇒ `bacTheoMucDo` trả 2 cho tất.
    const nhuCu = kho.map((c) => ({ ...c, bac: 2 as const }))
    const sao = (tang: number) => {
      const bac = bacTheoTang(tang)
      const loc = locTheoBac(nhuCu as never, bac) as unknown as CauUngVien[]
      return loc.reduce((t, c) => t + c.sao, 0) / loc.length
    }
    // Tầng 1 và tầng 999 rút từ ĐÚNG MỘT rổ ⇒ sao trung bình y hệt nhau.
    expect(sao(999)).toBeCloseTo(sao(1), 6)
    // eslint-disable-next-line no-console
    console.log(`  cách cũ: tầng 1 ★${sao(1).toFixed(2)} — tầng 999 ★${sao(999).toFixed(2)} (y hệt)`)
  })

  it('mục tiêu sao chạy đủ từ 0 tới 2 trên 999 tầng', () => {
    expect(saoMucTieuTheoTang(1)).toBeCloseTo(0, 3)
    expect(saoMucTieuTheoTang(TANG_TOI_DA)).toBeCloseTo(2, 3)
    expect(saoMucTieuTheoTang(500)).toBeGreaterThan(saoMucTieuTheoTang(499))
  })
})

describe('Không lặp câu', () => {
  it('ba lượt leo liên tiếp, 30 câu, KHÔNG câu nào lặp', () => {
    const kho = khoGia()
    let so: DongLichSuThap[] = []
    const tatCa: string[] = []
    for (let luot = 0; luot < 3; luot++) {
      const kq = leoMotLuot(kho, 300, 10, so, 100 + luot)
      tatCa.push(...kq.daHoi)
      so = kq.lichSu
    }
    expect(tatCa.length).toBe(30)
    expect(new Set(tatCa).size, 'có câu lặp giữa các lượt leo').toBe(30)
  })

  it('kho chỉ 5 câu thì vẫn leo được, và NÓI RA là đang lặp', () => {
    const kho = khoGia(5)
    const rnd = ngauNhienGia(9)
    const daHoi: string[] = []
    let noi: string[] = []
    for (let i = 0; i < 8; i++) {
      const kq = rutCauChoTang({
        kho, tang: 10, saoMucTieu: saoMucTieuTheoTang(10),
        lichSu: [], daHoiLuotNay: daHoi, chuyenDeDaGap: new Set(), ngauNhien: rnd,
      })
      expect(kq.cau).not.toBeNull()
      daHoi.push(kq.cau!.qid)
      noi = kq.daNoi
    }
    // Hỏi tới câu thứ sáu là hết kho ⇒ phải bật cờ "phải lặp", không im lặng.
    expect(noi).toContain('phaiLap')
  })

  it('sổ cắt còn 300 dòng, không phình vô hạn', () => {
    let so: DongLichSuThap[] = []
    for (let i = 0; i < 500; i++) so = ghiLichSu(so, `q${i}`, i + 1)
    expect(so.length).toBe(CAU_HINH_RUT.SO_DONG_GIU)
    expect(so[0]!.qid).toBe('q499')
  })

  it('trộn sổ hai máy: không bên nào đè bên nào', () => {
    const a: DongLichSuThap[] = [{ qid: 'x', lanCuoi: 100, soLanHoi: 3 }]
    const b: DongLichSuThap[] = [{ qid: 'x', lanCuoi: 50, soLanHoi: 7 }, { qid: 'y', lanCuoi: 90, soLanHoi: 1 }]
    const t = tronLichSu(a, b)
    const x = t.find((d) => d.qid === 'x')!
    expect(x.lanCuoi).toBe(100)
    expect(x.soLanHoi).toBe(7)
    expect(t.find((d) => d.qid === 'y')).toBeTruthy()
  })

  it('sổ rác từ máy chủ không làm vỡ', () => {
    expect(vaLichSu(null)).toEqual([])
    expect(vaLichSu('bậy')).toEqual([])
    expect(vaLichSu([{ qid: '' }, { qid: 'a', lanCuoi: 'x', soLanHoi: -5 }]))
      .toEqual([{ qid: 'a', lanCuoi: 0, soLanHoi: 1 }])
  })

  it('chuyên đề được rải đều, không dồn một chỗ', () => {
    const { daHoi } = leoMotLuot(khoGia(), 300, 10, [], 55)
    const kho = khoGia()
    const soChuyenDe = new Set(daHoi.map((q) => kho.find((c) => c.qid === q)!.chuyenDe)).size
    expect(soChuyenDe).toBeGreaterThanOrEqual(4)
  })
})

describe('Cân bằng 999 tầng', () => {
  it('TẦNG NÀO CŨNG TỐN ~5 CÂU — không phải tầng 25 trở đi là một câu', () => {
    const bang: { tang: number; cau: number }[] = []
    for (const t of [1, 25, 100, 250, 500, 750, 999]) {
      const cap = capTheoTang(t)
      const cong = congNenTheoCap(cap)
      const soCau = Math.ceil(mauTrumTang(t) / cong)
      bang.push({ tang: t, cau: soCau })
      expect(soCau, `tầng ${t}`).toBeGreaterThanOrEqual(4)
      expect(soCau, `tầng ${t}`).toBeLessThanOrEqual(SO_CAU_HA_TRUM + 4)
    }
    // eslint-disable-next-line no-console
    console.log('  ' + bang.map((b) => `tầng ${b.tang}: ${b.cau} câu`).join(' · '))
  })

  it('sai 5 câu là kiệt sức, ở mọi tầng', () => {
    for (const t of [1, 100, 500, 999]) {
      const mau = 4000
      const soDon = Math.ceil(mau / satThuongTrum(t, mau))
      expect(soDon, `tầng ${t}`).toBeGreaterThanOrEqual(4)
      expect(soDon, `tầng ${t}`).toBeLessThanOrEqual(7)
    }
  })

  it('hệ số tiến hoá không nổ tung ở cấp 120', () => {
    expect(heSoTienHoa(1)).toBeCloseTo(1, 3)
    expect(heSoTienHoa(CAP_TOI_DA)).toBeLessThan(6)
    for (let c = 2; c <= CAP_TOI_DA; c++) {
      expect(heSoTienHoa(c)).toBeGreaterThan(heSoTienHoa(c - 1))
    }
  })
})

describe('999 trùm', () => {
  it('SÁU hệ trùm đều xuất hiện — bản cũ thiếu Điện hoá và Hữu cơ', () => {
    const dem = new Map<string, number>()
    for (let t = 1; t <= TANG_TOI_DA; t++) {
      const h = heTrumTang(t)
      dem.set(h, (dem.get(h) ?? 0) + 1)
    }
    expect(dem.size).toBe(DS_HE.length)
    for (const h of DS_HE) expect(dem.get(h), `hệ ${h} không có trùm nào`).toBeGreaterThan(150)
  })

  it('tên trùm không phải một cái lặp 999 lần', () => {
    const ten = new Set<string>()
    for (let t = 1; t <= TANG_TOI_DA; t++) ten.add(tenTrumTang(t))
    // 12 bậc × 6 hệ, cộng các tầng canh mang nhãn riêng.
    expect(ten.size).toBeGreaterThanOrEqual(72)
  })

  it('cứ 50 tầng một tầng canh', () => {
    expect(laTangCanh(50)).toBe(true)
    expect(laTangCanh(51)).toBe(false)
    expect(mauTrumTang(50)).toBeGreaterThan(mauTrumTang(49))
  })

  it('tầng 999 ứng cấp 120 — thang tầng và thang cấp khớp nhau', () => {
    expect(capTheoTang(1)).toBe(1)
    expect(capTheoTang(TANG_TOI_DA)).toBe(CAP_TOI_DA)
  })
})
