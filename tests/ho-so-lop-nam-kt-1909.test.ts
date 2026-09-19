// GỌI LÊN BẢNG ĐỌC HỒ SƠ NẮM KIẾN THỨC — GĐ 6, KÊNH 3 (DE-XUAT-CA-NHAN-HOA-1909.md mục 2).
//
// Phiên Code 1 (làn giáo viên), 19/09/2026, theo lệnh 0.Planer:
//   · `pSai = min(1, lan_sai/2)` từ hồ sơ THẬT (`ban_do_sai.so_lan_sai` không bao giờ > 1 nên bản cũ kẹt 0,5)
//   · "đã chữa" (×0,35) = `trang_thai = 'da_khac_phuc'`
//   · `pYeu` từ `nam_kt_dang` (tỉ lệ câu của DẠNG chưa khắc phục), chuyên đề chỉ còn là đường lùi
//   · CHẶN CỨNG: em `bac = 'biet'` ở dạng của câu thì KHÔNG nhận câu 2 sao
//   · câu `can_day_lai` → BẮT BUỘC lên bảng
//   · GIỮ: TRONG_SO cộng đúng 1,0 · SAI ở nhà > CHƯA LÀM > ĐÚNG · em chưa có dữ liệu vẫn có cơ hội ·
//     sàn 20 em/90 phút · không 2 em một câu · tất định.
//   · TƯƠNG THÍCH NGƯỢC: máy chủ đời cũ không trả `namKt` ⇒ mọi số y hệt trước hôm nay.
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  BTVN_RONG,
  DIEM_BTVN,
  NGUONG_DANG_YEU,
  SO_CAU_DU_TIN_DANG,
  TRONG_SO,
  canDayLaiCau,
  diemHopCau,
  gopHoSo,
  lyDoChanCau,
  type HoSoEmDayDu,
  type NamKtCauEm,
} from '../src/lib/ho-so-lop'
import { xepBuoiChua, type CauVaoXep } from '../src/lib/xep-buoi-chua'
import { CAU_HINH_LEN_BANG_MAC_DINH, nganSachGiay } from '../src/lib/len-bang-cau-hinh'
import type { CauChua } from '../src/lib/phan-cong'

const CD = ['Ester – lipid', 'Carbohydrate', 'Cân bằng hoá học', 'Nguyên tử']

function cauChua(i: number, sao: 0 | 1 | 2, cd = CD[i % CD.length]): CauChua {
  return { id: `Q${i}`, phan: 'I', so: i, chuyenDe: cd, mucDo: 'hieu', tomTat: '', viTri: i, sao, lyDoSao: '' }
}
function vaoXep(i: number, sao: 0 | 1 | 2, batBuoc = false): CauVaoXep {
  return { cau: cauChua(i, sao), tiLeDung: 0.5, soEmLam: 20, batBuoc }
}

/** Em KHÔNG có chuyên đề nào ⇒ `coSo = false`, không ZPD, không pYeu chuyên đề: chỉ còn các phần ta muốn đo. */
function emTrang(i: number, opt: Partial<HoSoEmDayDu> = {}): HoSoEmDayDu {
  return {
    sbd: `120${String(i).padStart(2, '0')}`,
    hoTen: `Em ${i}`,
    coMat: true,
    chuyenDe: [],
    cauSai: [],
    daLam: new Map(),
    lenBang: { soLan: 0, lanCuoi: '', qids: [] },
    btvn: { ...BTVN_RONG, theoCau: new Map() },
    ...opt,
  }
}

const nk = (o: Partial<NamKtCauEm> = {}): NamKtCauEm => ({
  lanSai: 0,
  trangThai: 'chua_thay_sai',
  canDayLai: false,
  maDang: 'ES-01',
  bac: 'hieu',
  dang: null,
  ...o,
})
const namKt = (qid: string, o: Partial<NamKtCauEm>) => new Map([[qid, nk(o)]])

/** Em đã LÀM câu ấy ở đâu đó (để `pChuaLam = 0`) và đã lên bảng nhiều (để `pIt = 0`) — cô lập từng thành phần. */
const daLamRoi = (qid: string) => new Map([[qid, 1]])
const lenNhieu = { soLan: 6, lanCuoi: '', qids: [] }

describe('TRONG_SO vẫn cộng đúng 1,0 (không thêm trọng số mới)', () => {
  it('tổng = 1', () => {
    const t = Object.values(TRONG_SO).reduce((a, b) => a + b, 0)
    expect(t).toBeCloseTo(1, 10)
  })
})

describe('Hằng số dạng yếu khớp máy chủ (một nguồn `server/src/ho-so-cau-hinh.ts`)', () => {
  const sv = readFileSync(join(process.cwd(), 'server/src/ho-so-cau-hinh.ts'), 'utf8')
  const so = (ten: string) => Number(new RegExp(`export const ${ten}\\s*=\\s*([0-9.]+)`).exec(sv)?.[1])
  it('SO_CAU_DU_TIN_DANG = SO_CAU_DU_TIN của máy chủ', () => expect(SO_CAU_DU_TIN_DANG).toBe(so('SO_CAU_DU_TIN')))
  it('NGUONG_DANG_YEU = NGUONG_DANG_YEU của máy chủ', () => expect(NGUONG_DANG_YEU).toBe(so('NGUONG_DANG_YEU')))
})

describe('TƯƠNG THÍCH NGƯỢC — máy chủ đời cũ không trả hồ sơ nắm', () => {
  it('không có `namKt` ⇒ điểm y công thức cũ (sai 1 lần chưa chữa = 0,5 × SAI_CHINH_CAU)', () => {
    const cau = cauChua(1, 0)
    const e = emTrang(1, { cauSai: [{ qid: 'Q1', chuyenDe: cau.chuyenDe, mucDo: 'hieu', soLanSai: 1, daChua: false, maCa: 'C1' }], daLam: daLamRoi('Q1') })
    // pIt = 1 (chưa lên bảng lần nào) → 0,08; các phần khác bằng 0.
    expect(diemHopCau(e, cau).diem).toBeCloseTo(TRONG_SO.SAI_CHINH_CAU * 0.5 + TRONG_SO.IT_LEN_BANG, 10)
  })

  it('`namKt` là Map RỖNG ⇒ y hệt không có `namKt`', () => {
    const cau = cauChua(1, 1)
    const co = emTrang(1, { chuyenDe: [{ ten: cau.chuyenDe, soCau: 10, soSai: 4 }], daLam: daLamRoi('Q1') })
    const rong = { ...co, namKt: new Map<string, NamKtCauEm>() }
    expect(diemHopCau(rong, cau)).toEqual(diemHopCau(co, cau))
    expect(lyDoChanCau(rong, cauChua(1, 2))).toBeNull()
    expect(canDayLaiCau(rong, 'Q1')).toBe(false)
  })

  it('xepBuoiChua: `namKt` rỗng cho ra CÙNG kết quả không có `namKt`', () => {
    const ds = [...Array.from({ length: 6 }, (_, i) => vaoXep(i + 1, 2)), ...Array.from({ length: 8 }, (_, i) => vaoXep(i + 10, 1)), ...Array.from({ length: 8 }, (_, i) => vaoXep(i + 30, 0))]
    const lop = Array.from({ length: 30 }, (_, i) => emTrang(i + 1, { chuyenDe: CD.map((t) => ({ ten: t, soCau: 10, soSai: 2 + (i % 5) })) }))
    const rong = lop.map((e) => ({ ...e, namKt: new Map<string, NamKtCauEm>() }))
    // So phần THUẬT TOÁN quyết định (em nào, câu nào, vì sao, bao lâu) — bản thân đối tượng em
    // khác nhau đúng một chỗ là chính `namKt`, nên không so cả đối tượng.
    const chieu = (r: ReturnType<typeof xepBuoiChua>) => ({
      ...r,
      dong: r.dong.map((d) => ({ tang: d.tang, cau: d.cau.id, giay: d.giay, sbd: d.em?.sbd ?? null, viSao: d.viSao, hop: d.hop })),
    })
    expect(chieu(xepBuoiChua(ds, rong))).toEqual(chieu(xepBuoiChua(ds, lop)))
  })
})

describe('pSai từ hồ sơ thật: min(1, lan_sai/2)', () => {
  const cau = cauChua(1, 0)
  const diemVoi = (o: Partial<NamKtCauEm>, legacy?: { soLanSai: number; daChua: boolean }) =>
    diemHopCau(
      emTrang(1, {
        namKt: namKt('Q1', o),
        daLam: daLamRoi('Q1'),
        lenBang: lenNhieu,
        cauSai: legacy ? [{ qid: 'Q1', chuyenDe: cau.chuyenDe, mucDo: 'hieu', soLanSai: legacy.soLanSai, daChua: legacy.daChua, maCa: 'C1' }] : [],
      }),
      cau,
    ).diem

  it('sai 1 lần → 0,5 · sai 2 lần → 1 · sai 5 lần vẫn 1 (trần)', () => {
    expect(diemVoi({ lanSai: 1, trangThai: 'moi_sai' })).toBeCloseTo(TRONG_SO.SAI_CHINH_CAU * 0.5, 10)
    expect(diemVoi({ lanSai: 2, trangThai: 'moi_sai' })).toBeCloseTo(TRONG_SO.SAI_CHINH_CAU, 10)
    expect(diemVoi({ lanSai: 5, trangThai: 'moi_sai' })).toBeCloseTo(TRONG_SO.SAI_CHINH_CAU, 10)
  })

  it('HẾT KẸT 0,5: bản đồ sai cũ vẫn ghi 1 lần nhưng hồ sơ nói 3 lần ⇒ tính 3 lần', () => {
    expect(diemVoi({ lanSai: 3, trangThai: 'moi_sai' }, { soLanSai: 1, daChua: false })).toBeCloseTo(TRONG_SO.SAI_CHINH_CAU, 10)
  })

  it('"đã chữa" = `da_khac_phuc` → nhân 0,35', () => {
    expect(diemVoi({ lanSai: 2, trangThai: 'da_khac_phuc' })).toBeCloseTo(TRONG_SO.SAI_CHINH_CAU * 0.35, 10)
    expect(diemVoi({ lanSai: 1, trangThai: 'da_khac_phuc' })).toBeCloseTo(TRONG_SO.SAI_CHINH_CAU * 0.5 * 0.35, 10)
  })

  it('`dang_on` và `moi_sai` CHƯA phải đã chữa ⇒ giữ nguyên sức nặng', () => {
    expect(diemVoi({ lanSai: 2, trangThai: 'dang_on' })).toBeCloseTo(TRONG_SO.SAI_CHINH_CAU, 10)
    expect(diemVoi({ lanSai: 2, trangThai: 'moi_sai' })).toBeCloseTo(TRONG_SO.SAI_CHINH_CAU, 10)
  })

  it('hồ sơ nói chưa từng sai thì KHÔNG cộng điểm sai, kể cả bản đồ sai cũ còn dấu vết', () => {
    expect(diemVoi({ lanSai: 0, trangThai: 'chua_thay_sai' }, { soLanSai: 1, daChua: false })).toBeCloseTo(0, 10)
  })

  it('hồ sơ chỉ mang bậc/dạng (em CHƯA gặp câu ấy, `trangThai = null`) ⇒ lùi về bản đồ sai cũ', () => {
    expect(diemVoi({ trangThai: null, lanSai: 0, bac: 'hieu' }, { soLanSai: 1, daChua: false })).toBeCloseTo(TRONG_SO.SAI_CHINH_CAU * 0.5, 10)
  })

  it('lý do in ra có số lần sai thật và chữ "đã khắc phục"', () => {
    const e = emTrang(1, { namKt: namKt('Q1', { lanSai: 3, trangThai: 'da_khac_phuc' }), daLam: daLamRoi('Q1') })
    expect(diemHopCau(e, cau).viSao).toMatch(/sai câu này 3 lần.*đã khắc phục/)
  })
})

describe('pYeu từ nam_kt_dang', () => {
  const cau = cauChua(1, 0)
  // Em có chuyên đề sai 50% NHƯNG chỉ dùng làm đường lùi.
  const chuyenDe = [{ ten: cau.chuyenDe, soCau: 10, soSai: 5 }]
  const dangOnly = (dang: NamKtCauEm['dang']) =>
    emTrang(1, { chuyenDe, namKt: namKt('Q1', { trangThai: null, dang }), daLam: daLamRoi('Q1'), lenBang: lenNhieu })

  it('đủ mẫu (≥ SO_CAU_DU_TIN_DANG câu) → pYeu = 1 − (đã khắc phục + chưa thấy sai)/số câu gặp', () => {
    const e = dangOnly({ soGap: 10, soDaKhacPhuc: 4, soChuaThaySai: 3 }) // còn 3/10 chưa khắc phục ⇒ 0,3
    // (chuyên đề sai 50% sẽ cho 0,5 — con số này phải KHÔNG xuất hiện.)
    // ZPD của sao 0 khi tl(chuyên đề) = 0,5 ≥ 0,4 → +0,08: đó là phần CHUYÊN ĐỀ, không đổi.
    expect(diemHopCau(e, cau).diem).toBeCloseTo(TRONG_SO.YEU_CHUYEN_DE * 0.3 + 0.08, 10)
  })

  it('dạng yếu nặng hơn chuyên đề thì điểm theo DẠNG, không theo chuyên đề', () => {
    const e = dangOnly({ soGap: 10, soDaKhacPhuc: 0, soChuaThaySai: 0 }) // 10/10 chưa khắc phục ⇒ 1
    expect(diemHopCau(e, cau).diem).toBeCloseTo(TRONG_SO.YEU_CHUYEN_DE * 1 + 0.08, 10)
  })

  it('mẫu mỏng (< SO_CAU_DU_TIN_DANG câu) → lùi về tỉ lệ sai chuyên đề', () => {
    const e = dangOnly({ soGap: SO_CAU_DU_TIN_DANG - 1, soDaKhacPhuc: 0, soChuaThaySai: 0 })
    expect(diemHopCau(e, cau).diem).toBeCloseTo(TRONG_SO.YEU_CHUYEN_DE * 0.5 + 0.08, 10)
  })

  it('không có dạng cũng không có chuyên đề ⇒ pYeu = 0 (em vẫn có cơ hội, điểm nền)', () => {
    const e = emTrang(1, { namKt: namKt('Q1', { trangThai: null, dang: null }), daLam: daLamRoi('Q1'), lenBang: lenNhieu })
    expect(diemHopCau(e, cau).diem).toBeCloseTo(0, 10)
    // Không có dạng, không có chuyên đề ⇒ không nói "yếu" — chỉ còn dòng "đã làm câu này".
    expect(diemHopCau(e, cau).viSao).not.toMatch(/yếu|sai câu này|dạy lại/)
    // Em chưa có dòng nào cả vẫn nhận điểm nền dương (chưa làm + chưa lên bảng) — có cơ hội.
    expect(diemHopCau(emTrang(2), cau).diem).toBeGreaterThan(0)
  })

  it('dạng yếu theo định nghĩa (< 70% đã ổn) thì lý do nêu mã dạng kèm số', () => {
    const e = dangOnly({ soGap: 10, soDaKhacPhuc: 1, soChuaThaySai: 2 })
    const t = diemHopCau(e, cau).viSao
    expect(t).toContain('yếu dạng ES-01')
    expect(t).toContain('7/10')
  })
})

describe('THỨ TỰ BẤT BIẾN: SAI ở nhà > CHƯA LÀM > ĐÚNG (không đổi khi có hồ sơ nắm)', () => {
  it('DIEM_BTVN vẫn sai 1 > chưa làm 0,8 > đúng 0', () => {
    expect(DIEM_BTVN.sai).toBeGreaterThan(DIEM_BTVN.chuaLam)
    expect(DIEM_BTVN.chuaLam).toBeGreaterThan(DIEM_BTVN.dung)
    expect(DIEM_BTVN.dung).toBe(0)
  })

  it('cùng hồ sơ nắm, em SAI ở nhà điểm cao hơn em CHƯA LÀM, cao hơn em ĐÚNG', () => {
    const cau = cauChua(1, 1)
    const dung = (kq: 'sai' | 'chuaLam' | 'dung') =>
      diemHopCau(
        emTrang(1, {
          namKt: namKt('Q1', { lanSai: 1, trangThai: 'moi_sai' }),
          btvn: { ...BTVN_RONG, theoCau: new Map([['Q1', kq]]) },
          daLam: daLamRoi('Q1'),
        }),
        cau,
      ).diem
    expect(dung('sai')).toBeGreaterThan(dung('chuaLam'))
    expect(dung('chuaLam')).toBeGreaterThan(dung('dung'))
  })
})

describe('CHẶN CỨNG: em bậc "biết" ở dạng ấy không nhận câu 2 sao', () => {
  it('lyDoChanCau: chỉ chặn khi câu 2 sao VÀ bậc = biet', () => {
    const e = (bac: NamKtCauEm['bac']) => emTrang(1, { namKt: namKt('Q1', { bac, maDang: 'ES-01' }) })
    expect(lyDoChanCau(e('biet'), cauChua(1, 2))).toMatch(/bậc "biết".*ES-01/)
    expect(lyDoChanCau(e('biet'), cauChua(1, 1))).toBeNull()
    expect(lyDoChanCau(e('biet'), cauChua(1, 0))).toBeNull()
    expect(lyDoChanCau(e('hieu'), cauChua(1, 2))).toBeNull()
    expect(lyDoChanCau(e('van_dung'), cauChua(1, 2))).toBeNull()
    expect(lyDoChanCau(e(null), cauChua(1, 2))).toBeNull() // chưa có dòng nam_kt_dang ⇒ không đoán
    expect(lyDoChanCau(emTrang(1), cauChua(1, 2))).toBeNull() // máy chủ cũ
  })

  it('diemHopCau báo `chan` để chỗ chọn em bỏ qua', () => {
    const e = emTrang(1, { namKt: namKt('Q1', { bac: 'biet' }) })
    expect(diemHopCau(e, cauChua(1, 2)).chan).toBeTruthy()
    expect(diemHopCau(e, cauChua(1, 1)).chan).toBeUndefined()
  })

  it('xepBuoiChua KHÔNG giao câu 2 sao cho em bậc biết, dù em ấy là em hợp nhất về mọi điểm', () => {
    const q = vaoXep(1, 2)
    // Em A: sai chính câu ấy 2 lần, chuyên đề yếu, chưa lên bảng — điểm cao nhất; nhưng bậc dạng = biết.
    const A = emTrang(1, {
      namKt: namKt('Q1', { lanSai: 2, trangThai: 'moi_sai', bac: 'biet' }),
      chuyenDe: [{ ten: q.cau.chuyenDe, soCau: 10, soSai: 9 }],
    })
    const B = emTrang(2, { namKt: namKt('Q1', { lanSai: 0, trangThai: 'chua_thay_sai', bac: 'hieu' }), lenBang: lenNhieu, daLam: daLamRoi('Q1') })
    const kq = xepBuoiChua([q], [A, B])
    const dong = kq.dong.find((d) => d.tang === 'len_bang' && d.cau.id === 'Q1')
    expect(dong?.em?.sbd).toBe(B.sbd)
  })

  it('MỌI em đều bậc biết ở câu 2 sao ⇒ câu rơi xuống ĐỌC ĐÁP ÁN, nói đúng lý do, không ném lỗi', () => {
    const q = vaoXep(1, 2)
    const lop = [1, 2, 3].map((i) => emTrang(i, { namKt: namKt('Q1', { bac: 'biet' }) }))
    const kq = xepBuoiChua([q], lop)
    expect(kq.dong.filter((d) => d.tang === 'len_bang')).toHaveLength(0)
    const doc = kq.dong.find((d) => d.tang === 'doc_dap_an')
    expect(doc?.viSao).toMatch(/bậc "biết"/)
    expect(kq.canhBao.join(' ')).toMatch(/bậc "biết"/)
  })

  it('SÀN 20 EM vẫn đạt khi một nửa lớp bị chặn câu 2 sao', () => {
    const ds = [
      ...Array.from({ length: 6 }, (_, i) => vaoXep(i + 1, 2)),
      ...Array.from({ length: 8 }, (_, i) => vaoXep(i + 10, 1)),
      ...Array.from({ length: 10 }, (_, i) => vaoXep(i + 30, 0)),
    ]
    const lop = Array.from({ length: 30 }, (_, i) => {
      const nkAll = new Map<string, NamKtCauEm>()
      // 15 em đầu: bậc biết ở MỌI câu.
      if (i < 15) for (const c of ds) nkAll.set(c.cau.id, nk({ bac: 'biet' }))
      return emTrang(i + 1, { namKt: nkAll })
    })
    const kq = xepBuoiChua(ds, lop)
    expect(kq.soEmLenBang).toBeGreaterThanOrEqual(20)
    expect(kq.datSan).toBe(true)
    expect(kq.tongGiay).toBeLessThanOrEqual(nganSachGiay(CAU_HINH_LEN_BANG_MAC_DINH))
    // Không em nào bị chặn mà vẫn nhận câu 2 sao.
    for (const d of kq.dong) {
      if (d.tang !== 'len_bang' || d.cau.sao !== 2) continue
      expect(lyDoChanCau(d.em!, d.cau)).toBeNull()
    }
    // Không 2 em một câu, không 1 em hai câu.
    const len = kq.dong.filter((d) => d.tang === 'len_bang')
    expect(new Set(len.map((d) => d.em!.sbd)).size).toBe(len.length)
    expect(new Set(len.map((d) => d.cau.id)).size).toBe(len.length)
  })

  it('câu 2 sao ĐỨNG ĐẦU không em nào nhận được: vòng "tới sàn" phải đi tiếp, sàn 20 em vẫn đạt', () => {
    // 18 câu 2 sao + 6 câu 1 sao + 6 câu 0 sao (đúng cỡ buổi 30 câu trong ghi chú của `xep-buoi-chua.ts`):
    // tham lam thuần tuý ăn 13 câu 2 sao là hết giờ ở 18 em. Sàn 20 chỉ giữ được nhờ vòng 2 có GIỮ CHỖ.
    // Nếu vòng 2 dừng ngay ở câu đầu (vì không ai nhận) thì vòng 3 tham lam và trượt sàn.
    const ds = [
      ...Array.from({ length: 18 }, (_, i) => vaoXep(i + 1, 2)),
      ...Array.from({ length: 6 }, (_, i) => vaoXep(i + 40, 1)),
      ...Array.from({ length: 6 }, (_, i) => vaoXep(i + 60, 0)),
    ]
    const lop = Array.from({ length: 30 }, (_, i) => emTrang(i + 1, { namKt: namKt('Q1', { bac: 'biet' }) }))
    const kq = xepBuoiChua(ds, lop)
    expect(kq.dong.some((d) => d.tang === 'len_bang' && d.cau.id === 'Q1')).toBe(false)
    expect(kq.soEmLenBang).toBeGreaterThanOrEqual(20)
    expect(kq.datSan).toBe(true)
  })

  it('bị chặn ở câu 2 sao, em vẫn lên bảng ở câu 1 sao / 0 sao (em nào cũng có cơ hội)', () => {
    const ds = [vaoXep(1, 2), vaoXep(2, 1), vaoXep(3, 0)]
    const lop = [1, 2, 3].map((i) => emTrang(i, { namKt: new Map(ds.map((c) => [c.cau.id, nk({ bac: 'biet' })] as const)) }))
    const kq = xepBuoiChua(ds, lop)
    expect(kq.soEmLenBang).toBe(2) // 2 câu (1 sao, 0 sao) nhận em; câu 2 sao đọc đáp án
  })
})

describe('CÂU CẦN DẠY LẠI → BẮT BUỘC lên bảng', () => {
  const cauDayLai = 'Q9'
  const cfg2 = { ...CAU_HINH_LEN_BANG_MAC_DINH, SO_EM_LEN_BANG_TOI_THIEU: 2, SO_EM_LEN_BANG_TOI_DA: 2 }

  it('canDayLaiCau đọc cờ từ hồ sơ', () => {
    expect(canDayLaiCau(emTrang(1, { namKt: namKt('Q9', { canDayLai: true }) }), 'Q9')).toBe(true)
    expect(canDayLaiCau(emTrang(1, { namKt: namKt('Q9', { canDayLai: false }) }), 'Q9')).toBe(false)
    expect(canDayLaiCau(emTrang(1), 'Q9')).toBe(false)
  })

  it('lý do in ra nói rõ "dạy lại" kèm số lần sai', () => {
    const e = emTrang(1, { namKt: namKt('Q9', { lanSai: 4, trangThai: 'moi_sai', canDayLai: true }), daLam: daLamRoi('Q9') })
    const d = diemHopCau(e, cauChua(9, 0))
    expect(d.dayLai).toBe(true)
    expect(d.viSao).toMatch(/dạy lại/)
    expect(d.viSao).toMatch(/4 lần/)
  })

  it('câu 0 sao thường xếp cuối, nhưng CÓ em cần dạy lại thì được gọi lên dù giờ chật', () => {
    // 3 câu 2 sao lấp đầy 2 chỗ nếu không có "dạy lại"; câu Q9 (0 sao) chỉ được đọc đáp án.
    const ds = [vaoXep(1, 2), vaoXep(2, 2), vaoXep(3, 2), vaoXep(9, 0)]
    const lop = [1, 2, 3, 4].map((i) => emTrang(i))
    const truoc = xepBuoiChua(ds, lop, { cauHinh: cfg2 })
    expect(truoc.dong.find((d) => d.tang === 'len_bang' && d.cau.id === cauDayLai)).toBeUndefined()

    const co = lop.map((e, i) => (i === 3 ? { ...e, namKt: namKt(cauDayLai, { lanSai: 4, trangThai: 'moi_sai', canDayLai: true }) } : e))
    const sau = xepBuoiChua(ds, co, { cauHinh: cfg2 })
    const dong = sau.dong.find((d) => d.tang === 'len_bang' && d.cau.id === cauDayLai)
    expect(dong).toBeTruthy()
    expect(dong?.em?.sbd).toBe(co[3].sbd) // em cần dạy lại là em đứng lên chữa câu ấy
  })

  it('CHỈ tính em CÓ MẶT: em vắng cần dạy lại không làm câu thành bắt buộc', () => {
    const ds = [vaoXep(1, 2), vaoXep(2, 2), vaoXep(3, 2), vaoXep(9, 0)]
    const lop = [1, 2, 3, 4].map((i) => emTrang(i))
    const co = lop.map((e, i) => (i === 3 ? { ...e, coMat: false, namKt: namKt(cauDayLai, { lanSai: 4, trangThai: 'moi_sai', canDayLai: true }) } : e))
    const kq = xepBuoiChua(ds, co, { cauHinh: cfg2 })
    expect(kq.dong.find((d) => d.tang === 'len_bang' && d.cau.id === cauDayLai)).toBeUndefined()
  })

  it('câu dạy lại nhưng em bị chặn (bậc biết, câu 2 sao) ⇒ em khác đứng lên; câu vẫn được chữa', () => {
    const q = vaoXep(9, 2)
    const A = emTrang(1, { namKt: namKt('Q9', { lanSai: 4, trangThai: 'moi_sai', canDayLai: true, bac: 'biet' }), daLam: daLamRoi('Q9') })
    const B = emTrang(2, { namKt: namKt('Q9', { trangThai: 'chua_thay_sai', bac: 'van_dung' }) })
    const kq = xepBuoiChua([q], [A, B])
    const dong = kq.dong.find((d) => d.tang === 'len_bang' && d.cau.id === 'Q9')
    expect(dong?.em?.sbd).toBe(B.sbd)
    expect(kq.batBuocChuaChua).toHaveLength(0)
  })

  it('bắt buộc mà không em nào nhận được thì ghi vào batBuocChuaChua và nói lý do (không lặng lẽ bỏ)', () => {
    const q = vaoXep(9, 2)
    const lop = [1, 2].map((i) => emTrang(i, { namKt: namKt('Q9', { bac: 'biet', canDayLai: i === 1, lanSai: 4, trangThai: 'moi_sai' }) }))
    const kq = xepBuoiChua([q], lop)
    expect(kq.batBuocChuaChua.map((c) => c.id)).toEqual(['Q9'])
    expect(kq.canhBao.join(' ')).toMatch(/bắt buộc/)
  })
})

describe('TẤT ĐỊNH', () => {
  it('cùng đầu vào ⇒ cùng kết quả hai lần liền', () => {
    const ds = [...Array.from({ length: 6 }, (_, i) => vaoXep(i + 1, 2)), ...Array.from({ length: 10 }, (_, i) => vaoXep(i + 10, 1))]
    const lop = Array.from({ length: 30 }, (_, i) =>
      emTrang(i + 1, {
        namKt: new Map(ds.map((c, j) => [c.cau.id, nk({ bac: (['biet', 'hieu', 'van_dung'] as const)[(i + j) % 3], lanSai: (i + j) % 4, trangThai: (i + j) % 4 ? 'moi_sai' : 'chua_thay_sai', canDayLai: (i * 7 + j) % 23 === 0 })] as const)),
      }),
    )
    expect(xepBuoiChua(ds, lop)).toEqual(xepBuoiChua(ds, lop))
  })
})

describe('gopHoSo đọc `namKt` của máy chủ', () => {
  const dsEm = [{ sbd: '12001', hoTen: 'An', coMat: true }, { sbd: '12002', hoTen: 'Bình', coMat: true }]
  const emRong = { chuyenDe: [], qidSai: [], qidDaLam: [], lenBang: { soLan: 0, lanCuoi: '', qids: [] } }

  it('máy chủ đời cũ: không có `namKt` ⇒ hồ sơ không có `namKt`', () => {
    const [a] = gopHoSo({ em: { '12001': emRong } }, dsEm)
    expect(a.namKt).toBeUndefined()
  })

  it('đọc đúng từng trường của hợp đồng', () => {
    const goi = {
      em: {
        '12001': {
          ...emRong,
          namKt: {
            Q1: { lanSai: 3, trangThai: 'moi_sai', canDayLai: true, maDang: 'ES-01', bac: 'biet', dang: { soGap: 6, soDaKhacPhuc: 1, soChuaThaySai: 2 } },
          },
        },
      },
    } as Parameters<typeof gopHoSo>[0]
    const [a, b] = gopHoSo(goi, dsEm)
    expect(a.namKt?.get('Q1')).toEqual({ lanSai: 3, trangThai: 'moi_sai', canDayLai: true, maDang: 'ES-01', bac: 'biet', dang: { soGap: 6, soDaKhacPhuc: 1, soChuaThaySai: 2 } })
    expect(b.namKt).toBeUndefined() // em không có trong gói
  })

  it('em có mặt trong gói nhưng chưa có dòng nào ⇒ Map rỗng (máy chủ mới, chưa có hồ sơ)', () => {
    const [a] = gopHoSo({ em: { '12001': { ...emRong, namKt: {} } } } as Parameters<typeof gopHoSo>[0], dsEm)
    expect(a.namKt).toBeInstanceOf(Map)
    expect(a.namKt?.size).toBe(0)
  })

  it('trường thiếu/sai kiểu thì rơi về giá trị AN TOÀN, không ném lỗi và không chặn nhầm', () => {
    const goi = {
      em: {
        '12001': {
          ...emRong,
          namKt: {
            Q1: { lanSai: 'x', trangThai: 'la_hoa', bac: 'thần_thánh' },
            Q2: null,
            Q3: { lanSai: -2, trangThai: 'moi_sai', canDayLai: 'true', dang: { soGap: 'nhiều' } },
          },
        },
      },
    } as unknown as Parameters<typeof gopHoSo>[0]
    const [a] = gopHoSo(goi, dsEm)
    expect(a.namKt?.get('Q1')).toEqual({ lanSai: 0, trangThai: null, canDayLai: false, maDang: null, bac: null, dang: null })
    expect(a.namKt?.has('Q2')).toBe(false)
    const q3 = a.namKt?.get('Q3')
    expect(q3?.lanSai).toBe(0)
    expect(q3?.canDayLai).toBe(false) // chỉ boolean thật mới tính
    expect(q3?.dang).toBeNull()
    expect(lyDoChanCau(a, cauChua(1, 2))).toBeNull() // bậc lạ không được chặn ai
  })
})
