// M2 — ƯỚC LƯỢNG BẬC BỐ CỤC LÚC XẾP BUỔI, HIỆU CHỈNH BẰNG PHÉP ĐO CHROME THẬT (19/09/2026).
//
// `docs/anh-man-chieu-1909/do-bo-cuc-40-cau.json` là kết quả `scripts/do-bo-cuc-to-chieu.mjs` chạy trên Chrome thật:
// 40 câu mẫu (`tests/fixtures/cau-mau-to-chieu.ts`), mỗi câu ghép với một bạn cực ngắn, ở bốn khung hình. Ở đó:
//   bậc 1 = câu vừa NỬA BẢNG (ghép đôi được); ≥ 2 = phải chiếm 2/3 bảng trở lên.
// Ước lượng THUẦN (`uoc-luong-bo-cuc.ts`) phải bám các số ấy: sai lệch ≤ 1 bậc, KHÔNG BAO GIỜ ước thấp hơn thật
// (ước thấp = tưởng ghép đôi được mà không vừa ⇒ tờ phải tách đợt), và không bao giờ báo bậc 1 nhầm.
// Hai khung 1366×768 và 1600×900 KHÔNG dùng để chỉnh hằng số — chúng kiểm ước lượng ở khung lạ.
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { JSDOM } from 'jsdom'
import { CAU_MAU } from './fixtures/cau-mau-to-chieu'
import {
  KHUNG_UOC_MAC_DINH,
  choSanCo,
  dauVaoTuCau,
  dauVaoTuCauGoc,
  demDong,
  rongChuEm,
  uocLuongBacCau,
  uocLuongBacCauGoc,
} from '../src/lib/uoc-luong-bo-cuc'
import { taoHtmlMayChieu, type OBang } from '../src/lib/html-may-chieu'
import { xepBuoiChua, type CauVaoXep } from '../src/lib/xep-buoi-chua'
import { BTVN_RONG, type HoSoEmDayDu } from '../src/lib/ho-so-lop'
import { CAU_HINH_LEN_BANG_MAC_DINH } from '../src/lib/len-bang-cau-hinh'
import type { CauChua } from '../src/lib/phan-cong'

interface Do {
  taiLuc: string
  khung: Record<string, { rieng: { ten: string; bac: number; co: number; tran: boolean }[]; soDot: number; tran: string[]; coMin: number; coSan: number; khongVua: string[] }>
}
const DO: Do = JSON.parse(readFileSync('docs/anh-man-chieu-1909/do-bo-cuc-40-cau.json', 'utf8'))
const KHUNG_HIEU_CHINH = ['1280x720', '1920x1080']
const KHUNG_LA = ['1366x768', '1600x900']

describe('phép đo Chrome đã lưu — bản thân nó phải đạt', () => {
  it('có đủ bốn khung, mỗi khung đủ 40 câu', () => {
    expect(Object.keys(DO.khung).sort()).toEqual([...KHUNG_HIEU_CHINH, ...KHUNG_LA].sort())
    for (const v of Object.values(DO.khung)) expect(v.rieng).toHaveLength(CAU_MAU.length)
  })

  it('MỌI khung: 0 vùng đề tràn (không cuộn), không đợt nào "không vừa", cỡ chữ ≥ sàn quy đổi theo bề ngang', () => {
    for (const [k, v] of Object.entries(DO.khung)) {
      expect(v.tran, k).toEqual([])
      expect(v.khongVua, k).toEqual([])
      expect(v.coMin, k).toBeGreaterThanOrEqual(v.coSan)
      expect(v.rieng.every((r) => !r.tran), k).toBe(true)
    }
  })

  it('sàn cỡ chữ đúng đặc tả: 24 px ở 1920 px bề ngang, quy đổi theo bề ngang', () => {
    expect(DO.khung['1920x1080'].coSan).toBe(24)
    expect(DO.khung['1280x720'].coSan).toBe(16)
  })
})

describe('ước lượng bám phép đo thật', () => {
  const doKhung = (k: string) => {
    const [W, H] = k.split('x').map(Number)
    return DO.khung[k].rieng.map((r, i) => {
      const u = uocLuongBacCau(CAU_MAU[i].o.cau, { rong: W, cao: H })
      return { ten: r.ten, that: r.bac, uoc: u.bac, dl: u.bac - r.bac, coThat: r.co, coUoc: u.co }
    })
  }

  for (const k of [...KHUNG_HIEU_CHINH, ...KHUNG_LA]) {
    const la = KHUNG_LA.includes(k)
    describe(`${k}${la ? ' (khung LẠ, không dùng để chỉnh)' : ''}`, () => {
      const kq = doKhung(k)
      it('sai lệch ≤ 1 bậc ở MỌI câu', () => {
        expect(kq.filter((x) => Math.abs(x.dl) > 1).map((x) => `${x.ten}: thật ${x.that} ước ${x.uoc}`)).toEqual([])
      })

      it('KHÔNG BAO GIỜ ước thấp hơn bậc thật (tưởng vừa mà không vừa)', () => {
        expect(kq.filter((x) => x.dl < 0).map((x) => `${x.ten}: thật ${x.that} ước ${x.uoc}`)).toEqual([])
      })

      it('KHÔNG báo bậc 1 nhầm (ghép đôi một câu không vừa nửa bảng)', () => {
        expect(kq.filter((x) => x.uoc === 1 && x.that > 1).map((x) => x.ten)).toEqual([])
      })

      it('mất cơ hội ghép đôi (ước ≥ 2 mà thật là 1) ≤ 1 câu trên 40', () => {
        expect(kq.filter((x) => x.uoc > 1 && x.that === 1)).toHaveLength(k === '1920x1080' ? 1 : 0)
      })

      it('cỡ chữ ước lệch cỡ thật ≤ 3 px ở mọi câu', () => {
        expect(kq.filter((x) => Math.abs(x.coUoc - x.coThat) > 3).map((x) => `${x.ten}: thật ${x.coThat} ước ${x.coUoc}`)).toEqual([])
      })
    })
  }

  it('bảng phân loại mẫu: câu ngắn bậc 1; câu Phần I đề dài bậc 2; đề cực dài bậc 4 với chữ co (ở 1280×720)', () => {
    const b = Object.fromEntries(doKhung('1280x720').map((x) => [x.ten, x.uoc]))
    for (let i = 1; i <= 10; i++) expect(b[`I-ngắn-${i}`]).toBe(1)
    expect(b['I-đề-dài-70']).toBe(2)
    expect(b['cực-I-đề-160']).toBe(4)
    expect(b['III-bảng-lớn']).toBeGreaterThanOrEqual(3)
  })
})

describe('mô hình chữ khớp phông Times của Chrome', () => {
  it('độ rộng chữ khớp đo canvas của Chrome (ratio 1,002)', () => {
    const t = CAU_MAU.find((x) => x.ten === 'III-vừa')!.o.cau.text
    // đo ở Chrome: canvas 45 px Times New Roman = 4917 px; AFM 4905 px
    expect(rongChuEm(t) * 45).toBeGreaterThan(4917 * 0.985)
    expect(rongChuEm(t) * 45).toBeLessThan(4917 * 1.015)
  })

  it('số dòng khớp Chrome ở hai bề ngang (899 px → 6 dòng, 1214 px → 5 dòng, cỡ 45)', () => {
    const t = CAU_MAU.find((x) => x.ten === 'III-vừa')!.o.cau.text
    expect(demDong(t, 45, 899)).toBe(6)
    expect(demDong(t, 45, 1214)).toBe(5)
  })

  it('chữ Việt có dấu tính theo chữ gốc; chỉ số dưới nhỏ hơn', () => {
    expect(rongChuEm('ế')).toBeCloseTo(rongChuEm('e'), 6)
    expect(rongChuEm('đ')).toBeCloseTo(0.5, 6)
    expect(rongChuEm('H2O')).toBeLessThan(rongChuEm('H') + rongChuEm('O') + 0.5)
  })

  it('xuống dòng: từ dài hơn cả dòng bị bẻ; đoạn trống vẫn một dòng; xuống dòng cứng tách đoạn', () => {
    expect(demDong('a'.repeat(200), 30, 300)).toBeGreaterThan(5)
    expect(demDong('', 30, 300)).toBe(1)
    expect(demDong('một\nhai\nba', 30, 900)).toBe(3)
  })

  it('chỗ sẵn có của vùng đề khớp Chrome (bậc 2: 635×831 ở 1280×720, 995×1258 ở 1920×1080; bậc 5: 573 / 933)', () => {
    const a = choSanCo(2, { rong: 1280, cao: 720 })
    expect(Math.abs(a.cao - 635)).toBeLessThanOrEqual(1)
    expect(Math.abs(a.rong - 831)).toBeLessThanOrEqual(1)
    const b = choSanCo(2, { rong: 1920, cao: 1080 })
    expect(Math.abs(b.cao - 995)).toBeLessThanOrEqual(1)
    expect(Math.abs(b.rong - 1258)).toBeLessThanOrEqual(1)
    expect(Math.abs(choSanCo(5, { rong: 1280, cao: 720 }).cao - 573)).toBeLessThanOrEqual(1)
    expect(Math.abs(choSanCo(5, { rong: 1920, cao: 1080 }).cao - 933)).toBeLessThanOrEqual(1)
    // bậc 1 (đo: 260 / 506 / 292 ở 1280×720 / 1920×1080 / 1366×768 — thẻ tên 46 / 52 / 48)
    expect(Math.abs(choSanCo(1, { rong: 1280, cao: 720 }).cao - 260)).toBeLessThanOrEqual(3)
    expect(Math.abs(choSanCo(1, { rong: 1920, cao: 1080 }).cao - 506)).toBeLessThanOrEqual(3)
    expect(Math.abs(choSanCo(1, { rong: 1366, cao: 768 }).cao - 292)).toBeLessThanOrEqual(3)
  })
})

describe('câu GỐC trong gói đề cho cùng kết quả với CauLuyen', () => {
  it('Phần I / II / III, có hình, có bảng: cùng bậc', () => {
    const goc = (m: (typeof CAU_MAU)[number]) => {
      const c = m.o.cau
      const q: Record<string, unknown> = { text: c.text }
      if (c.phan === 'I') q.choices = c.luaChon
      if (c.phan === 'II') q.ideas = c.luaChon
      if (c.hinh) q.hinhAnh = c.hinh
      if (c.bang) q.table = c.bang
      if (c.anhThanCau) q.thanCauImg = c.anhThanCau
      return { phan: c.phan, q }
    }
    for (const k of KHUNG_HIEU_CHINH) {
      const [W, H] = k.split('x').map(Number)
      for (const m of CAU_MAU) {
        const g = goc(m)
        expect(uocLuongBacCauGoc(g.phan, g.q, { rong: W, cao: H }).bac, `${k} ${m.ten}`).toBe(uocLuongBacCau(m.o.cau, { rong: W, cao: H }).bac)
      }
    }
  })

  it('dữ liệu hỏng/thiếu không ném lỗi', () => {
    expect(() => dauVaoTuCauGoc('I', null)).not.toThrow()
    expect(() => dauVaoTuCauGoc('II', { text: 5, choices: 'x' })).not.toThrow()
    expect(uocLuongBacCauGoc('III', undefined).bac).toBe(1)
    expect(dauVaoTuCau(CAU_MAU[0].o.cau).phan).toBe('I')
  })

  it('khung mặc định là 1920×1080', () => {
    expect(KHUNG_UOC_MAC_DINH).toEqual({ rong: 1920, cao: 1080 })
  })

  it('hệ số cỡ chữ lớn hơn làm câu leo bậc cao hơn hoặc bằng (chữ to chiếm nhiều chỗ hơn)', () => {
    for (const m of CAU_MAU) {
      const a = uocLuongBacCau(m.o.cau, { rong: 1280, cao: 720 }, 1).bac
      const b = uocLuongBacCau(m.o.cau, { rong: 1280, cao: 720 }, 1.4).bac
      expect(b, m.ten).toBeGreaterThanOrEqual(a)
    }
  })
})

// ───────────────────── GHÉP ĐÔI CHỈ KHI CẢ HAI BẬC 1 ─────────────────────
const ob = (sbd: string, bacUoc?: 1 | 2 | 3 | 4 | 5, text = 'Câu ngắn'): OBang => ({
  sbd,
  hoTen: `Em ${sbd}`,
  qid: `Q-${sbd}`,
  soCau: 1,
  bacUoc,
  cau: { phan: 'I', id: `Q-${sbd}`, text, luaChon: ['A', 'B', 'C', 'D'], dapAn: 'A', buoc: [] } as unknown as OBang['cau'],
})
const cauTrang = (html: string) => {
  const doc = new JSDOM(html).window.document
  return [...doc.querySelectorAll('#mc-ray > .mc-dot:not(.mc-dot-da)')].map((d) => ({
    don: d.classList.contains('mc-dot-don'),
    em: [...d.querySelectorAll('.mc-nua:not(.mc-trong) .mc-ten')].map((t) => t.textContent),
  }))
}

describe('tờ chiếu chỉ ghép đôi hai câu cùng bậc 1', () => {
  it('câu bậc ≥ 2 đứng MỘT MÌNH (2/3 bảng) dù văn bản ngắn; hai câu bậc 1 ghép đôi', () => {
    const t = cauTrang(taoHtmlMayChieu([ob('A', 1), ob('B', 2), ob('C', 1), ob('D', 4)]))
    expect(t).toEqual([
      { don: false, em: ['Em A', 'Em C'] }, // A kéo C lên ghép đôi (bỏ qua B bậc 2)
      { don: true, em: ['Em B'] },
      { don: true, em: ['Em D'] },
    ])
  }, 60000)

  it('câu bậc 1 lẻ không có bạn ⇒ nửa bảng bỏ trống, không bịa em', () => {
    const t = cauTrang(taoHtmlMayChieu([ob('A', 1), ob('B', 3)]))
    expect(t).toEqual([{ don: false, em: ['Em A'] }, { don: true, em: ['Em B'] }])
    expect(taoHtmlMayChieu([ob('A', 1), ob('B', 3)])).toContain('Đợt này chỉ gọi một em')
  })

  it('tìm bạn ghép trong vài câu kế tiếp, không kéo từ quá xa', () => {
    const xa = [ob('A', 1), ...Array.from({ length: 8 }, (_, i) => ob(`L${i}`, 2)), ob('Z', 1)]
    const t = cauTrang(taoHtmlMayChieu(xa))
    expect(t[0]).toEqual({ don: false, em: ['Em A'] }) // Z ở xa quá cửa sổ ⇒ A đứng lẻ
    expect(t[t.length - 1]).toEqual({ don: false, em: ['Em Z'] })
    const gan = cauTrang(taoHtmlMayChieu([ob('A', 1), ob('L1', 2), ob('L2', 2), ob('Z', 1)]))
    expect(gan[0]).toEqual({ don: false, em: ['Em A', 'Em Z'] })
  })

  it('KHÔNG có bậc ước lượng ⇒ y hệt cách cũ (đoán `laCauDai`, ghép liền kề)', () => {
    const cu = cauTrang(taoHtmlMayChieu([ob('A'), ob('B'), ob('C'), ob('D')]))
    expect(cu).toEqual([{ don: false, em: ['Em A', 'Em B'] }, { don: false, em: ['Em C', 'Em D'] }])
    const dai = cauTrang(taoHtmlMayChieu([ob('A', undefined, 'dòng '.repeat(80)), ob('B'), ob('C')]))
    expect(dai[0]).toEqual({ don: true, em: ['Em A'] })
  })

  it('bậc thiếu ở MỘT SỐ câu ⇒ câu ấy lùi về đoán `laCauDai`, câu có bậc dùng bậc', () => {
    const t = cauTrang(taoHtmlMayChieu([ob('A', 1), ob('B'), ob('C', 2)]))
    expect(t[0]).toEqual({ don: false, em: ['Em A', 'Em B'] })
    expect(t[1]).toEqual({ don: true, em: ['Em C'] })
  })

  it('mọi em xuất hiện ĐÚNG MỘT LẦN, không mất, không thừa (kể cả sau khi kéo ghép)', () => {
    const ds = Array.from({ length: 23 }, (_, i) => ob(`E${i}`, ([1, 2, 1, 3, 1, 1, 5][i % 7]) as 1 | 2 | 3 | 5))
    const em = cauTrang(taoHtmlMayChieu(ds)).flatMap((d) => d.em)
    expect(em.sort()).toEqual(ds.map((o) => o.hoTen).sort())
  })
})

// ───────────────────── CẢNH BÁO Ở BUỔI CHỮA ─────────────────────
const CD = ['Ester – lipid', 'Carbohydrate', 'Cân bằng hoá học', 'Nguyên tử']
const cauChua = (i: number, sao: 0 | 1 | 2): CauChua => ({ id: `Q${i}`, phan: 'I', so: i, chuyenDe: CD[i % CD.length], mucDo: 'hieu', tomTat: '', viTri: i, sao, lyDoSao: '' })
const vao = (i: number, sao: 0 | 1 | 2, bacUoc?: 1 | 2 | 3 | 4 | 5): CauVaoXep => ({ cau: cauChua(i, sao), tiLeDung: 0.5, soEmLam: 20, batBuoc: false, ...(bacUoc ? { bacUoc } : {}) })
const em = (i: number): HoSoEmDayDu => ({ sbd: `120${String(i).padStart(2, '0')}`, hoTen: `Em ${i}`, coMat: true, chuyenDe: [], cauSai: [], daLam: new Map(), lenBang: { soLan: 0, lanCuoi: '', qids: [] }, btvn: { ...BTVN_RONG, theoCau: new Map() } })

describe('buổi chữa cảnh báo câu chiếm CẢ bảng (bậc 5)', () => {
  it('câu bậc 5 được gọi em lên bảng ⇒ nằm trong `cauChiemCaBang` và có dòng cảnh báo nêu số câu', () => {
    const ds = [vao(1, 2, 5), vao(2, 2, 1), vao(3, 1, 2)]
    const kq = xepBuoiChua(ds, [em(1), em(2), em(3)])
    expect(kq.cauChiemCaBang.map((c) => c.id)).toEqual(['Q1'])
    expect(kq.canhBao.join(' ')).toMatch(/1 câu dài tới mức chiếm cả bảng.*Phần I câu 1/)
  })

  it('không câu nào bậc 5 ⇒ không cảnh báo, mảng rỗng; thiếu `bacUoc` ⇒ không nói gì về bố cục', () => {
    const a = xepBuoiChua([vao(1, 2, 4), vao(2, 1, 1)], [em(1), em(2)])
    expect(a.cauChiemCaBang).toEqual([])
    expect(a.canhBao.join(' ')).not.toMatch(/chiếm cả bảng/)
    const b = xepBuoiChua([vao(1, 2), vao(2, 1)], [em(1), em(2)])
    expect(b.cauChiemCaBang).toEqual([])
  })

  it('câu bậc 5 nhưng KHÔNG được gọi em (hết giờ ⇒ chỉ đọc đáp án) thì không cảnh báo chiếm cả bảng', () => {
    const kq = xepBuoiChua([vao(1, 2, 5), vao(2, 1, 5)], [em(1), em(2)], { cauHinh: { ...CAU_HINH_LEN_BANG_MAC_DINH, NGAN_SACH_PHUT: 1 } })
    expect(kq.dong.filter((d) => d.tang === 'len_bang')).toHaveLength(0)
    expect(kq.cauChiemCaBang).toEqual([])
    expect(kq.canhBao.join(' ')).not.toMatch(/chiếm cả bảng/)
  })
})

describe('màn giáo viên nối ước lượng bậc vào Engine E và vào tờ chiếu (khoá nguồn)', () => {
  const nguon = readFileSync('src/screens/GoiLenBangScreen.tsx', 'utf8')

  it('`cauVaoXep` mang `bacUoc` ước từ chính văn bản câu gốc (để cảnh báo câu chiếm cả bảng)', () => {
    expect(nguon).toContain("import { uocLuongBacCau, uocLuongBacCauGoc } from '../lib/uoc-luong-bo-cuc'")
    expect(nguon).toContain('bacUoc: goc ? uocLuongBacCauGoc(goc.phan, goc.q).bac : undefined')
  })

  it('ô đưa sang tờ chiếu mang `bacUoc` (đợt đôi chỉ ghép hai câu cùng bậc 1) cho cả câu dạy học lẫn câu luyện', () => {
    expect(nguon).toContain('bacUoc: (day ? uocLuongBacCauGoc(day.phan, day.q) : uocLuongBacCau(cauHopLe)).bac')
  })
})
