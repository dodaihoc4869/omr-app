// ĐỊNH NGHĨA HOÀN THÀNH của GOI-LEN-BANG-80-PHUT.md — mục 8.
//
// Mỗi `describe` dưới đây là một dòng trong mục 8 của đặc tả. Không dòng nào là
// lời hứa: tất cả đều chạy ra số.
//
// ================= KHAI TRƯỚC: MỘT CHỖ ĐÃ THU HẸP ==========================
//
// Đặc tả 8.4 viết "200 ca nhỏ (N ≤ 12 câu, 6 em): Lagrange so VÉT CẠN". Vét cạn
// 12 câu là 4^12 = 16 777 216 vector lane cho MỘT ca, nhân 200 ca là 3,3 tỉ —
// không chạy được trong một phép kiểm. Nên:
//
//   · 200 ca ở N ≤ 7 câu, 4 em  → 4^7 = 16 384 vector/ca, tổng ~3,3 triệu.
//   · thêm 20 ca ở N = 8 câu     → 65 536 vector/ca, để thấy kết luận không đổi
//                                   khi N lớn hơn.
//
// Cả hai đều là vét cạn THẬT (không lấy mẫu), và ngưỡng khoảng cách đối ngẫu
// giữ nguyên 5% như đặc tả. Đây là thu hẹp cỡ bài, không phải nới tiêu chí.
import { describe, expect, it } from 'vitest'
import {
  canDuoiWilson,
  CAU_HINH_LEN_BANG_MAC_DINH,
  haoPhiGiay,
  nganSachGiay,
  type CauHinhLenBang,
  type Lane,
} from '../src/lib/len-bang-cau-hinh'
import { dungDoKho, khongDuCanCu, nguyenNhanSai, vapCuaLop, type BaiLamCoGiay, type DoKhoCau, type KhoDoKho } from '../src/lib/do-kho-cau'
import { ghepCapCoTran, giaTriLane, laneChoPhep, PHU_CUA_LANE, xepGioLenBang, type EmLenBang } from '../src/lib/xep-gio-len-bang'
import { dungGiaoAn, moiPhanTramCoCoMau } from '../src/lib/giao-an-len-bang'
import { mucGhep, type CauChua, type BaiLam } from '../src/lib/phan-cong'
import { gopCaVaoKho, KHO_DO_KHO_RONG, thongKeKho } from '../src/lib/kho-do-kho'

const CH = CAU_HINH_LEN_BANG_MAC_DINH

// ------------------------------------------------------------------- tiện ích

function cauMau(i: number, sao: 0 | 1 | 2, cd = 'Ester – lipid', mucDo: CauChua['mucDo'] = 'hieu'): CauChua {
  return { id: `Q${String(i).padStart(2, '0')}`, phan: 'I', so: i, chuyenDe: cd, mucDo, tomTat: `câu ${i}`, viTri: i, sao, lyDoSao: sao ? 'câu nền' : '' }
}

function doKhoMau(i: number, sao: 0 | 1 | 2, opt: { n1?: { n: number; sai: number }; n2?: { n: number; dung: number }; cd?: string; mucDo?: CauChua['mucDo'] } = {}): DoKhoCau {
  const cau = cauMau(i, sao, opt.cd, opt.mucDo)
  const kho: KhoDoKho = opt.n2 ? { [cau.id]: { soLuot: opt.n2.n, soDung: opt.n2.dung, soCa: 3 } } : {}
  const bl: BaiLamCoGiay[] = []
  if (opt.n1) {
    for (let k = 0; k < opt.n1.n; k++) bl.push({ sbd: `E${k}`, idCau: cau.id, dung: k >= opt.n1.sai, chon: k < opt.n1.sai ? 'C' : 'A', giay: 40 })
  }
  return dungDoKho([cau], bl, kho, CH)[0]
}

/** Bộ sinh ca giả lập TẤT ĐỊNH — cùng seed ra cùng ca, chạy lại kiểm được. */
function rng(seed: number): () => number {
  let s = seed >>> 0 || 1
  return () => {
    s ^= s << 13
    s >>>= 0
    s ^= s >> 17
    s ^= s << 5
    s >>>= 0
    return s / 4294967296
  }
}

const CDS = ['Ester – lipid', 'Carbohydrate', 'Hợp chất chứa nitrogen']
const MUCS: CauChua['mucDo'][] = ['biet', 'hieu', 'van_dung']

interface CaGia {
  doKho: DoKhoCau[]
  em: EmLenBang[]
  baiLam: BaiLamCoGiay[]
  cau: CauChua[]
}

/** HAI DÁNG CA, vì hai dáng cho hai kết luận khác nhau:
 *
 *  · 'that'  — theo phân bố ĐO ĐƯỢC của kho thật 10/09: sao 0/1/2 = 2 044 /
 *              1 305 / 922 trên 4 271 câu (47,9% · 30,6% · 21,6%), lớp làm đúng
 *              ~70%. Ca như thế KHÔNG kịch trần giờ, nên khoảng cách đối ngẫu
 *              mới là chỉ số có nghĩa.
 *  · 'kho'   — ca cực khó: sao rải đều 1/3 mỗi mức, lớp làm đúng 55%. Gần như
 *              câu nào cũng vào danh sách bắt buộc ⇒ giáo án kịch trần giờ. Giữ
 *              lại vì đây đúng là chỗ luật "sao 0 ⇒ ≤ L1" đẻ ra giờ thừa không
 *              tiêu được. */
type Dang = 'that' | 'kho'

function saoTheoDang(r: () => number, dang: Dang): 0 | 1 | 2 {
  if (dang === 'kho') return Math.floor(r() * 3) as 0 | 1 | 2
  const u = r()
  return u < 0.479 ? 0 : u < 0.785 ? 1 : 2
}

function caGiaLap(seed: number, soCau: number, soEm: number, dang: Dang = 'kho'): CaGia {
  const r = rng(seed)
  const tiLeDung = dang === 'kho' ? 0.55 : 0.7
  const cau: CauChua[] = []
  for (let i = 1; i <= soCau; i++) {
    cau.push(cauMau(i, saoTheoDang(r, dang), CDS[Math.floor(r() * CDS.length)], MUCS[Math.floor(r() * MUCS.length)]))
  }
  const em: EmLenBang[] = []
  for (let j = 0; j < soEm; j++) em.push({ sbd: `S${String(j).padStart(2, '0')}`, hoTen: `Em ${j}`, coMat: true, soLanLenBang: 0 })
  const baiLam: BaiLamCoGiay[] = []
  for (const c of cau) {
    for (const e of em) {
      const dung = r() < tiLeDung
      baiLam.push({ sbd: e.sbd, idCau: c.id, dung, chon: dung ? 'A' : r() > 0.5 ? 'C' : 'D', dapAnDung: 'A', giay: Math.round(20 + r() * 60) })
    }
  }
  const kho: KhoDoKho = {}
  for (const c of cau) {
    if (r() > 0.5) {
      const n = 8 + Math.floor(r() * 20)
      kho[c.id] = { soLuot: n, soDung: Math.round(n * (tiLeDung - 0.1 + r() * 0.4)), soCa: 2 + Math.floor(r() * 5) }
    }
  }
  return { doKho: dungDoKho(cau, baiLam, kho, CH), em, baiLam, cau }
}

/** VÉT CẠN: duyệt mọi vector lane hợp lệ, mọi cách ghép em cho câu L3. */
function vetCan(ca: CaGia, ch: CauHinhLenBang, tran: number): number {
  const B = nganSachGiay(ch)
  const d = ca.doKho
  const chophep = d.map((x) => laneChoPhep(x, new Set()))
  const { theoEm } = vapCuaLop(ca.cau, ca.baiLam, ch)
  // Bảng giá trị L3 cho từng (câu, em) — dùng ĐÚNG công thức của bản chạy thật.
  const hopBang: number[][] = d.map((x) =>
    ca.em.map((e) => {
      const h = hopVoiEmCuaTest(x, theoEm.get(e.sbd) ?? [], ch)
      return giaTriLane(x, 'L3') + ch.HE_SO_SAU_L3 * h
    }),
  )
  let tot = 0
  const lane: Lane[] = new Array(d.length).fill('L0')
  const di = (i: number, giay: number, giaTri: number) => {
    if (giay > B) return
    if (i === d.length) {
      const iL3 = lane.map((l, k) => (l === 'L3' ? k : -1)).filter((k) => k >= 0)
      if (iL3.length > tran) return
      // ghép em tốt nhất cho tập câu L3 — vét cạn hoán vị, |L3| ≤ 8 nhưng ở đây
      // N nhỏ nên |L3| ≤ 4.
      const dungEm = new Array<boolean>(ca.em.length).fill(false)
      let best = -Infinity
      const ghep = (k: number, s: number) => {
        if (k === iL3.length) {
          if (s > best) best = s
          return
        }
        for (let j = 0; j < ca.em.length; j++) {
          if (dungEm[j]) continue
          dungEm[j] = true
          ghep(k + 1, s + hopBang[iL3[k]][j])
          dungEm[j] = false
        }
      }
      ghep(0, 0)
      if (iL3.length === 0) best = 0
      if (best > -Infinity && giaTri + best > tot) tot = giaTri + best
      return
    }
    for (const l of chophep[i]) {
      lane[i] = l
      const t = l === 'L3' ? ch.GIAY_LANE.L3 : ch.GIAY_LANE[l]
      di(i + 1, giay + t, giaTri + (l === 'L3' ? 0 : giaTriLane(d[i], l)))
    }
    lane[i] = 'L0'
  }
  di(0, 0, 0)
  return tot
}

// Bản sao ĐÚNG công thức `hopVoiEm` nhưng gọn cho vét cạn — nếu hai bên lệch
// nhau thì phép so vô nghĩa, nên nó gọi thẳng hàm thật.
import { hopVoiEm } from '../src/lib/do-kho-cau'
function hopVoiEmCuaTest(d: DoKhoCau, vap: ReturnType<typeof vapCuaLop>['theoEm'] extends Map<string, infer V> ? V : never, ch: CauHinhLenBang): number {
  return hopVoiEm(d.cau, vap, 0, ch).diem
}

// =========================================================================
describe('8.1 — NHỮNG SỐ NỀN ĐÃ ĐO, khoá lại để không ai sửa lệch', () => {
  it('cận dưới Wilson: cùng tỉ lệ thô, mẫu bé bị dè chừng hơn hẳn', () => {
    const be = canDuoiWilson(3, 8, 0.9)
    const to = canDuoiWilson(30, 80, 0.9)
    expect(3 / 8).toBeCloseTo(30 / 80, 10) // tỉ lệ thô BẰNG NHAU
    expect(be).toBeLessThan(to - 0.1) // cận dưới thì không
    expect(be).toBeGreaterThan(0.15)
    expect(be).toBeLessThan(0.22)
  })

  it('không có lượt nào thì KHÔNG được coi là câu dễ', () => {
    expect(canDuoiWilson(0, 0, 0.9)).toBe(0)
  })

  it('ngưỡng N2 của đặc tả là cận dưới Wilson, KHÔNG phải "≥ 30 lượt"', () => {
    // Vì sao: đo 10/09 trên `ChiTietCau` (3 737 dòng, 32 ca, 814 qid) thì đúng
    // MỘT qid đạt 30 lượt. Ngưỡng cũ hôm nay gần như không bao giờ bật.
    expect(CH.N2_CO_MAU_TOI_THIEU).toBe(8)
    expect(CH.N2_CAN_DUOI_WILSON).toBe(0.55)
  })
})

describe('4.2 — BA NGUỒN, và cỡ mẫu tính theo TỪNG CÂU (C3)', () => {
  it('n là số em làm CHÍNH CÂU ẤY, không phải số em nộp của ca', () => {
    // Ca đề riêng: 40 em nộp, nhưng câu này chỉ 5 em chạm tới.
    const cau = cauMau(1, 1)
    const bl: BaiLamCoGiay[] = []
    for (let k = 0; k < 5; k++) bl.push({ sbd: `E${k}`, idCau: cau.id, dung: false })
    for (let k = 0; k < 35; k++) bl.push({ sbd: `F${k}`, idCau: 'KHAC', dung: true })
    const d = dungDoKho([cau], bl, {}, CH)[0]
    expect(d.n1).toBeNull() // 5 < 8 ⇒ KHÔNG kết luận, dù ca có 40 em
    expect(d.nguon).toBe('N3')
  })

  it('đủ 8 em làm câu ấy thì N1 bật, và chữ in ra mang cỡ mẫu', () => {
    const d = doKhoMau(2, 1, { n1: { n: 10, sai: 6 } })
    expect(d.n1).toEqual({ n: 10, sai: 6 })
    expect(d.nguon).toBe('N1')
    expect(d.chuNguon).toBe('lớp vừa rồi: 6/10 em sai')
  })

  it('không N1 thì rơi về N2, chữ vẫn mang cỡ mẫu và cận dưới', () => {
    const d = doKhoMau(3, 1, { n2: { n: 25, dung: 17 } })
    expect(d.nguon).toBe('N2')
    expect(d.chuNguon).toMatch(/^lịch sử: 17\/25 lượt đúng \(68%, cận dưới \d+%\) qua 3 ca$/)
  })

  it('không N1 không N2 thì chỉ còn nhãn kho, KHÔNG suy độ khó từ đâu khác', () => {
    const d = doKhoMau(4, 2)
    expect(d.nguon).toBe('N3')
    expect(d.doKho).toBe(1) // sao 2 ⇒ cotLoi 1
    expect(d.chuNguon).toContain('kho: sao 2')
  })

  it('sao 0 + không N1 + không N2 ⇒ KHÔNG đủ căn cứ gọi là khó', () => {
    expect(khongDuCanCu(doKhoMau(5, 0))).toBe(true)
    expect(khongDuCanCu(doKhoMau(6, 0, { n1: { n: 12, sai: 9 } }))).toBe(false)
  })
})

describe('4.3 — DANH SÁCH BẮT BUỘC CHỮA, ba lối vào', () => {
  it('sao 2 là vào, kể cả khi cả lớp làm đúng hết', () => {
    const d = doKhoMau(1, 2, { n1: { n: 30, sai: 0 } })
    expect(d.batBuoc).toBe(true)
    expect(d.viSaoBatBuoc).toContain('sao 2')
  })

  it('N1 sai ≥ 40% là vào', () => {
    expect(doKhoMau(2, 0, { n1: { n: 10, sai: 4 } }).batBuoc).toBe(true)
    expect(doKhoMau(3, 0, { n1: { n: 10, sai: 3 } }).batBuoc).toBe(false)
  })

  // PHÁ MÃ TÌM RA CHỖ NÀY. Đổi cận dưới Wilson thành tỉ lệ THÔ mà 47 phép kiểm
  // vẫn xanh — vì mấy ca tôi chọn có raw và Wilson cùng phía ngưỡng. Ca dưới đây
  // là ca hai bên KHÁC KẾT LUẬN, tức đúng chỗ việc dùng Wilson có nghĩa.
  it('WILSON KHÁC TỈ LỆ THÔ: 6/10 lượt đúng — thô 60% cho qua, cận dưới 35% thì không', () => {
    const d = doKhoMau(9, 0, { n2: { n: 10, dung: 6 } })
    expect(6 / 10).toBeGreaterThan(CH.N2_CAN_DUOI_WILSON) // thô: KHÔNG bắt buộc
    expect(canDuoiWilson(6, 10, 0.9)).toBeLessThan(CH.N2_CAN_DUOI_WILSON) // cận dưới: BẮT BUỘC
    expect(d.batBuoc).toBe(true)
    expect(d.viSaoBatBuoc).toBe('lịch sử: 6/10 lượt đúng, cận dưới 35%')
    // Và chữ in ra phải hiện CẢ HAI con số, không gộp làm một.
    expect(d.chuNguon).toBe('lịch sử: 6/10 lượt đúng (60%, cận dưới 35%) qua 3 ca')
  })

  it('N2 cận dưới ≤ 0,55 là vào — và mẫu bé tự bị loại', () => {
    expect(doKhoMau(4, 0, { n2: { n: 40, dung: 18 } }).batBuoc).toBe(true)
    // 5 lượt: dưới cỡ mẫu tối thiểu ⇒ N2 không được kết luận gì
    expect(doKhoMau(5, 0, { n2: { n: 5, dung: 2 } }).batBuoc).toBe(false)
  })
})

describe('4.4 — LANE ĐƯỢC PHÉP, và chỗ phân xử mâu thuẫn của prompt', () => {
  it('câu bắt buộc chỉ được L2 hoặc L3', () => {
    expect(laneChoPhep(doKhoMau(1, 2), new Set())).toEqual(['L2', 'L3'])
  })

  it('sao 0 có dữ liệu nhưng không bắt buộc ⇒ trần L1', () => {
    expect(laneChoPhep(doKhoMau(2, 0, { n1: { n: 10, sai: 2 } }), new Set())).toEqual(['L0', 'L1'])
  })

  it('không đủ căn cứ ⇒ chỉ đọc đáp án', () => {
    expect(laneChoPhep(doKhoMau(3, 0), new Set())).toEqual(['L0'])
  })

  it('BẮT BUỘC THẮNG trần sao 0 — số đo hôm nay mạnh hơn nhãn dán từ trước', () => {
    const d = doKhoMau(4, 0, { n1: { n: 10, sai: 7 } })
    expect(d.batBuoc).toBe(true)
    expect(d.cau.sao).toBe(0)
    expect(laneChoPhep(d, new Set())).toEqual(['L2', 'L3'])
  })

  it('thầy chạm lựa chọn ① bỏ câu khỏi bắt buộc thì trần sao 0 quay lại', () => {
    const d = doKhoMau(5, 0, { n1: { n: 10, sai: 7 } })
    expect(laneChoPhep(d, new Set([d.cau.id]))).toEqual(['L0', 'L1'])
  })
})

describe('8.4 — LAGRANGE SO VÉT CẠN, khoảng cách đối ngẫu ≤ 5%', () => {
  const chay = (soCa: number, nCauToiDa: number, soEm: number, seed0: number) => {
    let trungToiUu = 0
    let xauNhat = 0
    for (let s = 0; s < soCa; s++) {
      const soCau = 3 + ((s + seed0) % (nCauToiDa - 2))
      const ca = caGiaLap(s + seed0 * 7919, soCau, soEm)
      const { theoEm } = vapCuaLop(ca.cau, ca.baiLam, CH)
      const kq = xepGioLenBang(ca.doKho, ca.em, ca.baiLam, theoEm, {})
      const toiUu = vetCan(ca, CH, CH.SO_EM_LEN_BANG_TOI_DA)
      expect(kq.tongGiay).toBeLessThanOrEqual(nganSachGiay(CH))
      const kc = toiUu > 0 ? (toiUu - kq.tongGiaTri) / toiUu : 0
      if (kc <= 1e-9) trungToiUu++
      if (kc > xauNhat) xauNhat = kc
    }
    return { trungToiUu, xauNhat }
  }

  it('200 ca nhỏ (N ≤ 7 câu, 4 em)', () => {
    const r = chay(200, 7, 4, 1)
    // In ra để đọc được bằng mắt khi chạy `vitest --reporter=verbose`.
    console.log(`[8.4] 200 ca N≤7: trùng đúng tối ưu ${r.trungToiUu}/200 · khoảng cách xấu nhất ${(r.xauNhat * 100).toFixed(2)}%`)
    expect(r.xauNhat).toBeLessThanOrEqual(CH.KHOANG_CACH_DOI_NGAU_TOI_DA)
    expect(r.trungToiUu).toBeGreaterThanOrEqual(180)
  })

  it('20 ca ở N = 8 câu — kết luận không đổi khi N lớn hơn', () => {
    let xauNhat = 0
    for (let s = 0; s < 20; s++) {
      const ca = caGiaLap(50000 + s, 8, 4)
      const { theoEm } = vapCuaLop(ca.cau, ca.baiLam, CH)
      const kq = xepGioLenBang(ca.doKho, ca.em, ca.baiLam, theoEm, {})
      const toiUu = vetCan(ca, CH, CH.SO_EM_LEN_BANG_TOI_DA)
      const kc = toiUu > 0 ? (toiUu - kq.tongGiaTri) / toiUu : 0
      if (kc > xauNhat) xauNhat = kc
    }
    expect(xauNhat).toBeLessThanOrEqual(CH.KHOANG_CACH_DOI_NGAU_TOI_DA)
  })

  it('khoảng cách đối ngẫu app tự báo KHÔNG được nhỏ hơn khoảng cách thật', () => {
    // Cận trên nới luôn ≥ tối ưu thật, nên khoảng cách app in ra là cận TRÊN của
    // khoảng cách thật. In ra một số đẹp hơn sự thật là thứ tệ nhất ở đây.
    for (let s = 0; s < 40; s++) {
      const ca = caGiaLap(90000 + s, 6, 4)
      const { theoEm } = vapCuaLop(ca.cau, ca.baiLam, CH)
      const kq = xepGioLenBang(ca.doKho, ca.em, ca.baiLam, theoEm, {})
      const toiUu = vetCan(ca, CH, CH.SO_EM_LEN_BANG_TOI_DA)
      expect(kq.canTrenNoi).toBeGreaterThanOrEqual(toiUu - 1e-9)
    }
  })
})

// ĐỌC KỸ TÊN MỤC NÀY. Tiêu chí 5% của đặc tả 8.4 đo khoảng cách tới LỜI GIẢI
// TỐT NHẤT THẬT (vét cạn) — mục 8.4 ở trên đã đạt 0,00%, 200/200 ca trùng khít.
// Mục dưới đây đo một thứ KHÁC: khoảng cách tới CẬN TRÊN NỚI trên ca cỡ lớp
// thật, nơi không vét cạn nổi. Đặc tả không đặt ngưỡng cho con số ấy, nên ở đây
// nó là DÂY BÁO HỒI QUY chứ không phải tiêu chí nghiệm thu — ghi rõ để sau này
// không ai nhầm hai con số làm một.
describe('DÂY BÁO HỒI QUY — khoảng cách tới cận trên nới trên ca cỡ lớp', () => {
  const doMot = (dang: 'that' | 'kho', seed0: number) => {
    let xau = 0
    let tren5 = 0
    let tongL3 = 0
    let tongGiay = 0
    let tongBatBuoc = 0
    for (let s = 0; s < 100; s++) {
      const ca = caGiaLap(seed0 + s, 28, 30, dang)
      const { theoEm } = vapCuaLop(ca.cau, ca.baiLam, CH)
      const kq = xepGioLenBang(ca.doKho, ca.em, ca.baiLam, theoEm, {})
      if (kq.khoangCachDoiNgau > xau) xau = kq.khoangCachDoiNgau
      if (kq.khoangCachDoiNgau > CH.KHOANG_CACH_DOI_NGAU_TOI_DA) tren5++
      tongL3 += kq.soEmLenBang
      tongGiay += kq.tongGiay
      tongBatBuoc += kq.dong.filter((d) => d.batBuoc).length
    }
    return { xau, tren5, tbL3: tongL3 / 100, tbGiay: tongGiay / 100, tbBatBuoc: tongBatBuoc / 100 }
  }

  it('ca theo PHÂN BỐ KHO THẬT (sao 47,9/30,6/21,6 · lớp đúng 70%)', () => {
    const r = doMot('that', 200000)
    console.log(
      `[dây báo · THẬT] cách cận trên xấu nhất ${(r.xau * 100).toFixed(2)}% · vượt 5%: ${r.tren5}/100 · TB ${r.tbBatBuoc.toFixed(1)} câu bắt buộc · ${r.tbL3.toFixed(1)}/8 em lên bảng · dùng ${r.tbGiay.toFixed(0)}/${nganSachGiay(CH)} giây`,
    )
    // Ca bình thường thì giáo án phải GẦN KÍN giờ và GẦN ĐỦ trần em lên bảng.
    expect(r.tbGiay / nganSachGiay(CH)).toBeGreaterThan(0.98)
    expect(r.tbL3).toBeGreaterThan(6)
    expect(r.xau).toBeLessThan(0.08)
  })

  it('ca CỰC KHÓ: chênh lớn hơn, và đó là ĐỘ NGUYÊN của phép nới chứ không phải giáo án tệ', () => {
    const r = doMot('kho', 700000)
    console.log(
      `[dây báo · CỰC KHÓ] cách cận trên xấu nhất ${(r.xau * 100).toFixed(2)}% · vượt 5%: ${r.tren5}/100 · TB ${r.tbBatBuoc.toFixed(1)} câu bắt buộc · ${r.tbL3.toFixed(1)}/8 em lên bảng`,
    )
    expect(r.tbBatBuoc).toBeGreaterThan(20) // đúng là ca cực khó
    expect(r.xau).toBeLessThan(0.15) // dây báo hồi quy, không phải tiêu chí 5%
  })

  it('ca cực khó PHẢI kèm lý do, không để thầy tự đoán vì sao chênh', () => {
    const ca = caGiaLap(700017, 28, 30, 'kho')
    const { theoEm } = vapCuaLop(ca.cau, ca.baiLam, CH)
    const kq = xepGioLenBang(ca.doKho, ca.em, ca.baiLam, theoEm, {})
    expect(kq.thuaGio).not.toBeNull()
    const chu = kq.canhBao.join(' ')
    expect(chu).toContain('cận trên nới')
    expect(chu).toContain('danh sách bắt buộc chữa đã ăn gần hết ngân sách')
  })
})

describe('8.5 · 8.6 · 8.8 — RÀNG BUỘC CỨNG trên 100 ca thật cỡ lớp', () => {
  const cas = Array.from({ length: 100 }, (_, s) => caGiaLap(700000 + s, 28, 30))

  it('MỌI câu bắt buộc đều có lane ≥ L2 trong 100/100 ca', () => {
    let dat = 0
    for (const ca of cas) {
      const { theoEm } = vapCuaLop(ca.cau, ca.baiLam, CH)
      const kq = xepGioLenBang(ca.doKho, ca.em, ca.baiLam, theoEm, {})
      if (kq.thuaGio && kq.dong.length === 0) continue
      const xau = kq.dong.filter((d) => d.batBuoc && d.lane !== 'L2' && d.lane !== 'L3')
      if (!xau.length) dat++
    }
    expect(dat).toBe(100)
  })

  // ===== MÂU THUẪN CỦA ĐẶC TẢ — ĐÃ TÌM RA, ĐÃ CHỐT, GIỮ LẠI DẤU VẾT ==========
  //
  // Lần đầu chạy tiêu chí này, 12/100 ca TRƯỢT và trượt thật. Số học của một ca
  // như thế: 27/28 câu vào danh sách bắt buộc ⇒ tiêu 27 × 150 = 4 050 giây. Câu
  // còn lại là sao 0, mà mục 4.4 ghi "sao 0 ⇒ lane ≤ L1" nên chỉ mua thêm được
  // 20 giây ⇒ 4 070/4 320. Thừa 250 giây, mà nước đi rẻ nhất còn lại tốn
  // 420 − 150 = 270 giây. KHÔNG MUA NỔI ⇒ giờ chết.
  //
  // Nguồn gốc là chính đặc tả tự đá nhau: mục 4.3 bảo "thời gian dư đổ vào câu
  // ngoài danh sách", mục 4.4 bảo "sao 0 ⇒ ≤ L1".
  //
  // CHỐT (thầy giao 10/09 "tự sửa theo hướng mượt mà nhất"): trần theo sao là
  // MẶC ĐỊNH chứ không phải tường — hết nước mua trong luật chặt thì nới lên L2,
  // không bao giờ lên L3, câu không đủ căn cứ vẫn đứng L0, và phải khai ra.
  // Luật nới và mọi ràng buộc quanh nó khoá ở `hoan-thien-80-phut-1009.test.ts`.
  //
  // Sau khi chốt: 100/100 ca đạt khoảng. Ngưỡng 5% CHƯA BAO GIỜ bị hạ.
  it('không để giờ trên bàn: đạt [ngân sách − 5%, ngân sách] ở 100/100 ca', () => {
    const B = nganSachGiay(CH)
    let dat = 0
    let hetNuoc = 0
    for (const ca of cas) {
      const { theoEm } = vapCuaLop(ca.cau, ca.baiLam, CH)
      const kq = xepGioLenBang(ca.doKho, ca.em, ca.baiLam, theoEm, {})
      if (kq.thuaGio && kq.dong.length === 0) continue
      expect(kq.tongGiay).toBeLessThanOrEqual(B)
      if (kq.tongGiay >= B * 0.95) dat++
      else if (!kq.conMuaDuoc) hetNuoc++
    }
    console.log(`[8.6] đạt khoảng [ngân sách−5%, ngân sách]: ${dat}/100 · hết nước mua: ${hetNuoc}/100`)
    expect(dat).toBe(100)
    expect(hetNuoc).toBe(0)
  })

  it('SỐ HỌC CỦA MÂU THUẪN vẫn nguyên — và nay tiêu được hết giờ', () => {
    // 27 câu sao 2 (bắt buộc) + 1 câu sao 0 CÓ dữ liệu (nên trần L1, không phải L0).
    const cau = [...Array.from({ length: 27 }, (_, i) => cauMau(i + 1, 2)), cauMau(28, 0, 'Carbohydrate')]
    const bl: BaiLamCoGiay[] = Array.from({ length: 10 }, (_, k) => ({ sbd: `E${k}`, idCau: 'Q28', dung: k > 1, chon: 'A' }))
    const doKho = dungDoKho(cau, bl, {}, CH)
    expect(doKho.filter((d) => d.batBuoc).length).toBe(27)
    expect(laneChoPhep(doKho[27], new Set())).toEqual(['L0', 'L1'])

    // Số học cũ, giữ nguyên để đọc lại được: luật chặt dừng ở 4 070 giây.
    expect(27 * CH.GIAY_LANE.L2 + CH.GIAY_LANE.L1).toBe(4070)
    expect(nganSachGiay(CH) - 4070).toBe(250)
    expect(CH.GIAY_LANE.L3 - CH.GIAY_LANE.L2).toBe(270) // 270 > 250

    // Sau khi chốt: 250 giây ấy đổ vào chính câu sao 0 ⇒ 4 200 giây, còn 120.
    const kq = xepGioLenBang(doKho, Array.from({ length: 30 }, (_, j) => ({ sbd: `S${j}`, hoTen: `E${j}`, coMat: true, soLanLenBang: 0 })), bl, new Map(), {})
    expect(kq.soCauNoiTran).toBe(1)
    expect(kq.tongGiay).toBe(28 * CH.GIAY_LANE.L2)
    expect(kq.tongGiay).toBeGreaterThanOrEqual(nganSachGiay(CH) * 0.95)
    // Vẫn KHÔNG có em nào lên bảng — 120 giây còn lại không mua nổi suất nào,
    // và app vẫn phải hiện ba lựa chọn cho thầy.
    expect(kq.soEmLenBang).toBe(0)
    expect(kq.thuaGio).not.toBeNull()
  })

  // PHÁ MÃ TÌM RA CHỖ NÀY. Bỏ chốt trần trong bước vá tham mà 45 phép kiểm vẫn
  // xanh — vì mọi ca sinh ra đều đã cạn ngân sách nên bước vá không thêm được
  // suất nào. Ca dưới đây CÒN THỪA NHIỀU GIỜ: 12 câu bắt buộc tiêu 1 800 giây,
  // còn 2 520 giây, chia cho 270 giây một suất là mua được 9 suất — trong khi
  // trần là 8. Đúng chỗ chốt ấy phải chặn.
  it('THỪA NHIỀU GIỜ vẫn KHÔNG được vượt trần em lên bảng', () => {
    const cau = Array.from({ length: 12 }, (_, i) => cauMau(i + 1, 2))
    const doKho = dungDoKho(cau, [], {}, CH)
    const em = Array.from({ length: 30 }, (_, j) => ({ sbd: `S${String(j).padStart(2, '0')}`, hoTen: `Em ${j}`, coMat: true, soLanLenBang: 0 }))
    // Mỗi em có một chỗ vấp cùng chuyên đề ⇒ ai cũng đủ tư cách lên bảng.
    const vap = new Map(em.map((e) => [e.sbd, [{ sbd: e.sbd, idCau: 'NGOAI', chuyenDe: 'Ester – lipid', mucDo: 'van_dung' as const, nguyenNhan: 'hieu_nham' as const, chon: 'C', cungChon: 9, soEmLam: 30 }]]))
    const kq = xepGioLenBang(doKho, em, [], vap, {})
    expect(nganSachGiay(CH) - 12 * CH.GIAY_LANE.L2).toBe(2520)
    expect(Math.floor(2520 / (CH.GIAY_LANE.L3 - CH.GIAY_LANE.L2))).toBe(9) // mua được 9
    expect(kq.soEmLenBang).toBe(CH.SO_EM_LEN_BANG_TOI_DA) // nhưng trần là 8
    expect(kq.dong.filter((d) => d.lane === 'L3').length).toBe(8)
    expect(kq.tongGiay).toBeLessThanOrEqual(nganSachGiay(CH))
  })

  it('thầy hạ trần (lựa chọn ②) thì số em lên bảng đi theo trần mới', () => {
    const cau = Array.from({ length: 12 }, (_, i) => cauMau(i + 1, 2))
    const doKho = dungDoKho(cau, [], {}, CH)
    const em = Array.from({ length: 30 }, (_, j) => ({ sbd: `S${String(j).padStart(2, '0')}`, hoTen: `Em ${j}`, coMat: true, soLanLenBang: 0 }))
    const vap = new Map(em.map((e) => [e.sbd, [{ sbd: e.sbd, idCau: 'NGOAI', chuyenDe: 'Ester – lipid', mucDo: 'van_dung' as const, nguyenNhan: 'hieu_nham' as const, chon: 'C', cungChon: 9, soEmLam: 30 }]]))
    expect(xepGioLenBang(doKho, em, [], vap, { tranEm: 3 }).soEmLenBang).toBe(3)
    expect(xepGioLenBang(doKho, em, [], vap, { tranEm: 0 }).soEmLenBang).toBe(0)
  })

  // PHÁ MÃ TÌM RA CHỖ NÀY. Bỏ hẳn lệnh sắp câu theo `id` mà 50 phép kiểm vẫn
  // xanh — vì phép kiểm tất định cũ truyền ĐÚNG MỘT mảng nên thứ tự không đổi.
  // Nhưng màn hình dựng danh sách câu từ nhiều nguồn (bộ câu của ca, câu thầy
  // tích thêm), thứ tự đổi là chuyện thường. Đảo đầu vào mà ra giáo án khác thì
  // hai máy in ra hai bản, đúng loại lỗi tệ nhất.
  it('ĐẢO THỨ TỰ ĐẦU VÀO vẫn ra đúng giáo án ấy', () => {
    const ca = caGiaLap(700003, 28, 30)
    const { theoEm } = vapCuaLop(ca.cau, ca.baiLam, CH)
    const xuoi = xepGioLenBang(ca.doKho, ca.em, ca.baiLam, theoEm, {})
    const nguoc = xepGioLenBang([...ca.doKho].reverse(), [...ca.em].reverse(), ca.baiLam, theoEm, {})
    const chu = (k: typeof xuoi) =>
      [...k.dong].sort((a, b) => (a.cau.id < b.cau.id ? -1 : 1)).map((d) => `${d.cau.id}:${d.lane}:${d.em?.sbd ?? '-'}`)
    expect(chu(nguoc)).toEqual(chu(xuoi))
    expect(nguoc.tongGiaTri).toBeCloseTo(xuoi.tongGiaTri, 9)
    expect(nguoc.tongGiay).toBe(xuoi.tongGiay)
  })

  it('TẤT ĐỊNH — chạy lại cùng tham số ra đúng giáo án cũ', () => {
    for (const s of [0, 17, 55]) {
      const ca = caGiaLap(700000 + s, 28, 30)
      const { theoEm } = vapCuaLop(ca.cau, ca.baiLam, CH)
      const a = xepGioLenBang(ca.doKho, ca.em, ca.baiLam, theoEm, {})
      const b = xepGioLenBang(ca.doKho, ca.em, ca.baiLam, theoEm, {})
      expect(b.dong.map((d) => `${d.cau.id}:${d.lane}:${d.em?.sbd ?? '-'}`)).toEqual(
        a.dong.map((d) => `${d.cau.id}:${d.lane}:${d.em?.sbd ?? '-'}`),
      )
      expect(b.tongGiaTri).toBe(a.tongGiaTri)
    }
  })
})

describe('8.7 — PHẢI HƠN THUẬT TOÁN BỐN MỨC CŨ, in hai số cạnh nhau', () => {
  it('tổng trọng số bản mới cao hơn `mucGhep` cũ trên 100 ca', () => {
    // Cùng một thước đo cho hai bên: tổng giá trị theo đúng công thức của đặc
    // tả. Bản cũ chọn em bằng `mucGhep` (1..5, nhỏ hơn là hợp hơn) và không
    // biết ngân sách giờ, nên ở đây cho nó ĐÚNG số suất L3 mà bản mới dùng —
    // so cách chọn, không so số suất.
    let moiTong = 0
    let cuTong = 0
    let moiThang = 0
    for (let s = 0; s < 100; s++) {
      const ca = caGiaLap(310000 + s, 28, 30)
      const { theoEm } = vapCuaLop(ca.cau, ca.baiLam, CH)
      const kq = xepGioLenBang(ca.doKho, ca.em, ca.baiLam, theoEm, {})
      const soSuat = kq.dong.filter((d) => d.lane === 'L3').length
      moiTong += kq.tongGiaTri

      // Bản cũ: xếp câu theo `diem` của `thongKeCau` rồi lấy em có `mucGhep`
      // nhỏ nhất, đúng luật 1-1.
      const blCu: BaiLam[] = ca.baiLam.map((b) => ({ sbd: b.sbd, idCau: b.idCau, dung: b.dung, chon: b.chon }))
      const emCu = ca.em.map((e) => ({
        sbd: e.sbd,
        hoTen: e.hoTen,
        coMat: true,
        chuyenDe: [] as { ten: string; soCau: number; soSai: number }[],
        daGoiTheoCd: {} as Record<string, number>,
        daGoiCau: [] as string[],
        soLanLenBang: 0,
      }))
      const xepCu = [...kq.dong].sort((a, b) => b.giaTri - a.giaTri)
      const daDung = new Set<string>()
      let cu = 0
      let dat = 0
      for (const d of xepCu) {
        if (dat >= soSuat) break
        const tk = { cau: d.cau, soEmLam: 0, soSai: 0, tiLeDung: 0, doChum: 0, doTinCay: 1, diem: 0, nhom: 'dang_chua' as const }
        const ung = emCu
          .filter((e) => !daDung.has(e.sbd))
          .map((e) => ({ e, m: mucGhep(e, tk, blCu) }))
          .sort((x, y) => x.m - y.m || (x.e.sbd < y.e.sbd ? -1 : 1))
        if (!ung.length) break
        const chon = ung[0].e
        daDung.add(chon.sbd)
        const dk = ca.doKho.find((x) => x.cau.id === d.cau.id) as DoKhoCau
        const h = hopVoiEm(d.cau, theoEm.get(chon.sbd) ?? [], 0, CH)
        cu += giaTriLane(dk, 'L3') + CH.HE_SO_SAU_L3 * h.diem
        dat++
      }
      // Phần không phải L3 của bản cũ lấy y nguyên bản mới — chỉ so cách CHỌN EM.
      for (const d of kq.dong) if (d.lane !== 'L3') cu += d.giaTri
      cuTong += cu
      if (kq.tongGiaTri >= cu - 1e-9) moiThang++
    }
    // Hai số cạnh nhau, in ra bằng chính thông báo lỗi khi trượt.
    console.log(`[8.7] tổng trọng số — BẢN MỚI ${moiTong.toFixed(2)} so BẢN CŨ ${cuTong.toFixed(2)} · mới thắng ${moiThang}/100 ca`)
    expect(moiTong).toBeGreaterThan(cuTong)
    expect(moiThang).toBeGreaterThanOrEqual(95)
  })
})

describe('8.9 — MỌI PHẦN TRĂM PHẢI KÈM CỠ MẪU', () => {
  const ca = caGiaLap(4242, 28, 30)
  const { theoEm } = vapCuaLop(ca.cau, ca.baiLam, CH)
  const kq = xepGioLenBang(ca.doKho, ca.em, ca.baiLam, theoEm, {})
  const chu = dungGiaoAn(kq, { ngay: '10/09', maCa: '447479', soEmNop: 30, tenDe: '12-BD7-07', duong: 'A', soCauKhop: 28, soCauTong: 28 }, CH)

  it('giáo án thật không có dòng nào mang % trần', () => {
    expect(moiPhanTramCoCoMau(chu)).toEqual([])
  })

  it('chốt tự kiểm ấy BẮT được khi ai đó thêm một dòng % trần', () => {
    expect(moiPhanTramCoCoMau(chu + '\nTỉ lệ đúng 46%')).toEqual(['Tỉ lệ đúng 46%'])
  })

  it('giáo án có đủ đầu đề, đồng hồ và tổng giờ', () => {
    expect(chu).toContain('BUỔI CHỮA 10/09 · Ca đầu giờ 447479 · 30 em nộp')
    expect(chu).toContain('khớp kho (đường A — đề chính là ca đầu giờ, khớp tuyệt đối)')
    expect(chu).toMatch(/\n00:00 {2}Ổn định, trả phiếu/)
    expect(chu).toMatch(/\nTổng \d+\/80 phút · \d+\/8 em lên bảng/)
    expect(chu).toContain('Khoảng cách đối ngẫu: đạt ')
  })
})

describe('8.10 — CA THIẾU GIÂY: tắt hai luật đọc thời gian, và NÓI RA', () => {
  const cau = cauMau(1, 1)
  const bl: BaiLamCoGiay[] = []
  for (let k = 0; k < 20; k++) bl.push({ sbd: `E${k}`, idCau: cau.id, dung: false, chon: 'C', dapAnDung: 'A', giay: k < 2 ? 30 : null })

  it('dưới 60% dòng có giây ⇒ không sinh nhãn `doan` dù em bấm rất nhanh', () => {
    const { coGiay, theoEm } = vapCuaLop([cau], bl, CH)
    expect(coGiay).toBe(false)
    const moiNhan = [...theoEm.values()].flat().map((v) => v.nguyenNhan)
    expect(moiNhan).not.toContain('doan')
    expect(moiNhan).not.toContain('tinh_sai')
  })

  it('đủ giây thì luật thời gian bật lại — cùng dữ liệu, khác kết luận', () => {
    const du = bl.map((b, i) => ({ ...b, giay: i === 0 ? 3 : 60 }))
    const { coGiay, theoEm } = vapCuaLop([cau], du, CH)
    expect(coGiay).toBe(true)
    expect((theoEm.get('E0') ?? [])[0].nguyenNhan).toBe('doan')
  })

  it('bỏ trống luôn là `chua_biet`, không phụ thuộc đồng hồ', () => {
    expect(nguyenNhanSai({ sbd: 'X', idCau: cau.id, dung: false, chon: '' }, cau, [], 0, false)).toBe('chua_biet')
  })

  it('giáo án in đúng câu cảnh báo, không im lặng', () => {
    const ca = caGiaLap(881, 10, 12)
    const { theoEm } = vapCuaLop(ca.cau, ca.baiLam, CH)
    const kq = xepGioLenBang(ca.doKho, ca.em, ca.baiLam, theoEm, { thieuGiay: true })
    const chu = dungGiaoAn(kq, { ngay: '10/09', maCa: 'X', soEmNop: 12, tenDe: 'D', duong: 'A', soCauKhop: 10, soCauTong: 10 }, CH)
    expect(chu).toContain('Ca này thiếu dữ liệu thời gian')
  })
})

describe('8.11 — CHƯA CÓ LỊCH SỬ LÊN BẢNG thì nói thẳng, cấm in ngày giả', () => {
  it('cảnh báo có mặt, và giáo án không chứa dòng "lần lên bảng gần nhất"', () => {
    const ca = caGiaLap(991, 12, 10)
    const { theoEm } = vapCuaLop(ca.cau, ca.baiLam, CH)
    const kq = xepGioLenBang(ca.doKho, ca.em, ca.baiLam, theoEm, { chuaCoLichSuLenBang: true })
    const chu = dungGiaoAn(kq, { ngay: '10/09', maCa: 'X', soEmNop: 10, tenDe: 'D', duong: 'A', soCauKhop: 12, soCauTong: 12 }, CH)
    expect(chu).toContain('Chưa có lịch sử lên bảng')
    expect(chu).not.toContain('Lần lên bảng gần nhất')
  })

  it('`moi(e)` bằng 1 khi chưa lên bảng lần nào, và giảm khi đã lên', () => {
    const c = cauMau(1, 1)
    const vap = [{ sbd: 'S', idCau: 'Q99', chuyenDe: c.chuyenDe, mucDo: 'van_dung' as const, nguyenNhan: 'hieu_nham' as const, chon: 'C', cungChon: 5, soEmLam: 20 }]
    expect(hopVoiEm(c, vap, 0, CH).moi).toBe(1)
    expect(hopVoiEm(c, vap, 3, CH).moi).toBe(0.25)
  })
})

describe('4.3 — THỪA GIỜ: hiện số và ba lựa chọn, CẤM tự cắt', () => {
  it('quá nhiều câu bắt buộc ⇒ không xếp bừa, trả về lựa chọn cho thầy', () => {
    // 40 câu sao 2 ⇒ tất cả bắt buộc ⇒ tối thiểu 40 × 150 s = 6 000 s > ngân sách.
    const cau = Array.from({ length: 40 }, (_, i) => cauMau(i + 1, 2))
    const doKho = dungDoKho(cau, [], {}, CH)
    const kq = xepGioLenBang(doKho, [{ sbd: 'A', hoTen: 'A', coMat: true, soLanLenBang: 0 }], [], new Map(), {})
    expect(kq.thuaGio).not.toBeNull()
    expect(kq.dong).toEqual([])
    expect(kq.thuaGio?.luaChon.length).toBeGreaterThanOrEqual(1)
    expect(kq.canhBao[0]).toMatch(/^40 câu bắt buộc chữa cần \d+ phút, quá 80 phút/)
  })

  it('thầy chạm lựa chọn ① rồi thì xếp được', () => {
    const cau = Array.from({ length: 40 }, (_, i) => cauMau(i + 1, 2))
    const doKho = dungDoKho(cau, [], {}, CH)
    const bo = doKho.slice(20).map((d) => d.cau.id)
    const kq = xepGioLenBang(doKho, [{ sbd: 'A', hoTen: 'A', coMat: true, soLanLenBang: 0 }], [], new Map(), { boBatBuoc: bo })
    expect(kq.dong.length).toBe(40)
    expect(kq.tongGiay).toBeLessThanOrEqual(nganSachGiay(CH))
    expect(kq.dong.filter((d) => d.batBuoc).length).toBe(20)
  })
})

describe('8.3 — KHO ĐỘ KHÓ dựng nền, không cộng đúp', () => {
  const bank = {
    phanI: [
      { id: 'D1-I-1', text: 'a', options: ['A', 'B', 'C', 'D'] as [string, string, string, string], correct: 'A' as const },
      { id: 'D1-I-2', text: 'b', options: ['A', 'B', 'C', 'D'] as [string, string, string, string], correct: 'B' as const },
    ],
    phanII: [],
    phanIII: [],
    soCau: { I: 2, II: 0, III: 0 },
  }
  const tl = (a: string, b: string) => ({ phanI: { 'D1-I-1': a, 'D1-I-2': b }, phanII: {}, phanIII: {} })
  const luot = [
    { sbd: 'S1', hoTen: 'S1', lanThu: 1, trangThai: 'da_nop', dapAn: tl('A', 'C'), giayCau: null },
    { sbd: 'S2', hoTen: 'S2', lanThu: 1, trangThai: 'da_nop', dapAn: tl('D', 'B'), giayCau: null },
  ]

  it('cộng một ca vào kho: đúng số lượt, đúng số đúng, đúng số ca', () => {
    const k = gopCaVaoKho(KHO_DO_KHO_RONG, 'CA1', bank, luot, '2026-09-10T00:00:00Z')
    expect(k.muc['D1-I-1']).toMatchObject({ soLuot: 2, soDung: 1, soCa: 1 })
    expect(k.muc['D1-I-2']).toMatchObject({ soLuot: 2, soDung: 1, soCa: 1 })
    expect(k.daDuyet).toEqual(['CA1'])
  })

  it('gọi lại CÙNG ca thì KHÔNG cộng đúp', () => {
    const k1 = gopCaVaoKho(KHO_DO_KHO_RONG, 'CA1', bank, luot, 'x')
    const k2 = gopCaVaoKho(k1, 'CA1', bank, luot, 'y')
    expect(k2.muc['D1-I-1'].soLuot).toBe(2)
    expect(k2.daDuyet).toEqual(['CA1'])
  })

  it('ca thứ hai cộng tiếp, `soCa` lên 2', () => {
    const k = gopCaVaoKho(gopCaVaoKho(KHO_DO_KHO_RONG, 'CA1', bank, luot, 'x'), 'CA2', bank, luot, 'y')
    expect(k.muc['D1-I-1']).toMatchObject({ soLuot: 4, soDung: 2, soCa: 2 })
    expect(thongKeKho(k)).toMatchObject({ soCa: 2, soQid: 2, ge30: 0 })
  })
})

describe('GHÉP CẶP — chốt "dừng khi hết lời" có thừa không', () => {
  // PHÁ MÃ: bỏ chốt `d[dich] >= -1e-12 → break` mà không phép kiểm nào đỏ. Kiểm
  // lại thay vì cho qua: hoá ra nó THỪA THẬT, vì vòng dựng đồ thị đã lọc
  // `if (loi[i][j] > 0)` nên trong đồ thị không tồn tại cạnh lỗ nào để mà đi.
  // Hai phép kiểm dưới đây chứng minh điều đó, để lần sau ai đọc tới còn biết
  // đấy là chốt phòng thân chứ không phải chốt đang gánh việc.
  it('cặp lỗ và cặp hoà KHÔNG bao giờ được ghép', () => {
    const cap = ghepCapCoTran(
      [
        [-5, -1, 0],
        [0, -2, -9],
      ],
      8,
    )
    expect(cap).toEqual([])
  })

  it('chỉ ghép phần có lời, và không vượt trần', () => {
    const cap = ghepCapCoTran(
      [
        [9, 1, -3],
        [8, 2, 0],
        [7, 3, 5],
      ],
      2,
    )
    expect(cap.length).toBe(2)
    expect(new Set(cap.map((c) => c.cot)).size).toBe(2)
    for (const c of cap) expect(c.loi).toBeGreaterThan(0)
    // Ghép TỐI ƯU chứ không tham: 9 + 5 = 14 hơn 9 + 3 = 12.
    expect(cap.reduce((s, c) => s + c.loi, 0)).toBe(14)
  })
})

describe('CHỐT GIÁ TRỊ — bậc lane phải giữ đúng thứ tự', () => {
  it('L0 < L1 < L2 = L3 về phần nội dung phủ được', () => {
    expect(PHU_CUA_LANE.L0).toBeLessThan(PHU_CUA_LANE.L1)
    expect(PHU_CUA_LANE.L1).toBeLessThan(PHU_CUA_LANE.L2)
    expect(PHU_CUA_LANE.L3).toBe(PHU_CUA_LANE.L2)
  })

  it('L3 chỉ đáng 420 giây khi em thật sự hợp câu', () => {
    const d = doKhoMau(1, 2)
    const hopCao = giaTriLane(d, 'L3') + CH.HE_SO_SAU_L3 * 1.0
    const hopThap = giaTriLane(d, 'L3') + CH.HE_SO_SAU_L3 * CH.HE_SO_NGUYEN_NHAN.doan
    const l2 = giaTriLane(d, 'L2')
    expect(hopCao / CH.GIAY_LANE.L3).toBeGreaterThan(l2 / CH.GIAY_LANE.L2)
    expect(hopThap / CH.GIAY_LANE.L3).toBeLessThan(l2 / CH.GIAY_LANE.L2)
  })

  it('hao phí là hai đầu buổi, cộng lại đúng bằng phần bị trừ khỏi ngân sách', () => {
    expect(haoPhiGiay(CH)).toBe(CH.HAO_PHI_MO_DAU_GIAY + CH.HAO_PHI_CHOT_CUOI_GIAY)
    expect(nganSachGiay(CH)).toBe(CH.NGAN_SACH_PHUT * 60 - haoPhiGiay(CH))
  })
})
