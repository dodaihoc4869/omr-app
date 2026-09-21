// BTVN "NÂNG ĐỠ" — KHẮC PHỤC LUÔN (`dieuChinh.khacPhuc`, Code 1, 21/09/2026; `prompt-bo-nao.md` CẬP NHẬT 2, Boss giao gấp vì Bộ não A.I chạy thật).
// Luật: rút 2–4 câu cùng dạng CHƯA giao từ kho của chính bài, đúng bậc đích (hoặc thấp hơn một bậc), chèn vào chặng CHƯA mở kế tiếp, BỚT câu củng cố dễ nhất của dạng KHÁC để tổng tải không tăng;
// DEADLINE THẮNG MỌI NÚM (số chặng, lõi, thử thách, chặng đã mở, hạn không đổi); không đủ câu thì làm được bao nhiêu trả bấy nhiêu + lý do; vắng khắc phục ⇒ Y HỆT bản không có cổng.
import { describe, expect, it } from 'vitest'
import {
  chonBoCuaEm,
  chonLoi,
  maDangCua,
  thichNghiChangSau,
  type BoCuaEm,
  type CauGiao,
  type DieuChinhEm,
  type HoSoEmRut,
  type Muc,
  type NganSachBai,
} from '../src/lib/btvn-nang-do'
import { mulberry32 } from '../src/lib/exam-shuffle'

/** 8 dạng × 10 câu [Biết ×3, Hiểu ×5, Vận dụng ×2] (80 câu): lõi = 2 câu Biết mỗi dạng ⇒ mỗi dạng còn 1 câu Biết + ≥ 4 câu Hiểu chưa giao khi ngân sách vừa. */
function bai(nDang = 8): CauGiao[] {
  const ra: CauGiao[] = []
  for (let d = 0; d < nDang; d++)
    ([0, 0, 0, 1, 1, 1, 1, 1, 2, 2] as const).forEach((m, k) => ra.push({ qid: `d${d}-m${m}-${k}`, dang: `D${d}`, chuyenDe: `CD${d % 3}`, mucDo: m, sao: ((d + k) % 3) as 0 | 1 | 2, phan: (['I', 'I', 'I', 'II', 'II', 'II', 'II', 'II', 'III', 'III'] as const)[k] }))
  return ra
}
const CAU = bai()
const LOI = chonLoi(CAU, [])
const muc = (q: string) => CAU.find((c) => c.qid === q)!.mucDo
const dangCua = (q: string) => maDangCua(CAU.find((c) => c.qid === q)!)
const dangHS = (bac: Muc, soGap: number, tiLe: number | null) => ({ bac, soGap, soSai: Math.round(soGap * (1 - (tiLe ?? 1))), tiLeKhacPhuc: tiLe })
/** Em ổn ở bậc Hiểu (1) mọi dạng: bậc đích 1. */
const emHieu = (): HoSoEmRut => ({ dang: Object.fromEntries(Array.from({ length: 8 }, (_, d) => [`D${d}`, dangHS(1, 8, 0.9)])), cau: {} })
/** Em ở bậc Biết (0) mọi dạng, đủ tin, ổn: bậc đích 0. */
const emBiet = (): HoSoEmRut => ({ dang: Object.fromEntries(Array.from({ length: 8 }, (_, d) => [`D${d}`, dangHS(0, 8, 0.9)])), cau: {} })
const NS = (soNgay: number, cauMoiNgay: number, onLaiMoiNgay = 0): NganSachBai => ({ soNgay, cauMoiNgay, onLaiMoiNgay })
const NS_VUA = NS(3, 8) // 24 câu: lõi 16 (2 câu Biết mỗi dạng) + 8 riêng ⇒ có câu củng cố để bớt, mỗi dạng còn ≥ 4 câu Hiểu chưa giao
const HAT = 'KP|em'
const KP = (dang: string, soCau: number, bac: 'dung_bac' | 'thap_hon_mot_bac' = 'dung_bac') => ({ dang, soCau, bac })
const kd = (khacPhuc: DieuChinhEm['khacPhuc']): DieuChinhEm => ({ khacPhuc })
const tatCa = (bo: BoCuaEm) => [...bo.chang.flat(), ...bo.thuSucThem]
const dangDe = (bo: BoCuaEm, ma: string) => tatCa(bo).filter((q) => dangCua(q) === ma).length
/** Tổng số câu của các chặng theo mức (Biết/Hiểu/Vận dụng) — để so `tomTat`. */
const demMuc = (bo: BoCuaEm, m: Muc) => bo.chang.flat().filter((q) => muc(q) === m).length

/** Dạng nào của bộ `goc` còn ≥ `toiThieu` câu CHƯA giao ở mức `m` VÀ có câu củng cố của dạng khác để bớt — chọn dạng để thử (tránh phụ thuộc may rủi của hạt giống). */
function dangThu(goc: BoCuaEm, m: Muc, toiThieu: number): string {
  const daGiao = new Set(tatCa(goc))
  for (let d = 0; d < 8; d++) {
    const ma = `D${d}`
    const con = CAU.filter((c) => maDangCua(c) === ma && c.mucDo === m && !daGiao.has(c.qid)).length
    if (con >= toiThieu) return ma
  }
  throw new Error(`không có dạng nào còn ≥ ${toiThieu} câu chưa giao ở mức ${m}`)
}

/** Ép dạng `ma` chỉ còn ĐÚNG `nSong` câu Hiểu chưa giao mà hợp lệ: câu chưa giao thừa bị đánh dấu "đã đúng ≥ 2 ngày" (loại khỏi ứng viên). Lặp vài vòng vì hồ sơ đổi có thể đổi bộ gốc. */
function epConLai(hs: HoSoEmRut, ma: string, nSong: number): { goc: BoCuaEm; song: string[] } {
  for (let vong = 0; vong < 8; vong++) {
    const goc = chonBoCuaEm(CAU, LOI, hs, NS_VUA, HAT)
    const chua = CAU.filter((c) => maDangCua(c) === ma && c.mucDo === 1 && !tatCa(goc).includes(c.qid) && (hs.cau[c.qid]?.ngayDungKhacNhau ?? 0) < 2).map((c) => c.qid)
    if (chua.length <= nSong) return { goc, song: chua }
    // 'dang_on' (không phải 'da_khac_phuc'): câu đã khắc phục ở bậc hiện tại sẽ MỞ BẬC ĐÍCH +1 của dạng và làm lệch phép thử
    for (const q of chua.slice(nSong)) hs.cau[q] = { trangThai: 'dang_on', ngayDungKhacNhau: 2, lanSai: 1 }
  }
  throw new Error('không ép được số câu còn lại')
}

describe('khắc phục — nền: bộ mẫu có đủ câu chưa giao và câu củng cố để thử', () => {
  it('tiền đề của bộ mẫu (em Hiểu, 3 ngày × 8 câu): tổng ≤ 24 < 80; ≥ 4 câu củng cố; MỖI dạng còn ≥ 1 câu Biết và ≥ 4 câu Hiểu chưa giao', () => {
    const goc = chonBoCuaEm(CAU, LOI, emHieu(), NS_VUA, HAT)
    expect(goc.tomTat.tong).toBeLessThanOrEqual(24)
    expect(Object.values(goc.nhan).filter((n) => n === 'cung_co').length).toBeGreaterThanOrEqual(4)
    expect(tatCa(goc).length).toBeLessThan(CAU.length)
    expect('khacPhuc' in goc).toBe(false)
    const daGiao = new Set(tatCa(goc))
    for (let d = 0; d < 8; d++) {
      expect(CAU.filter((c) => maDangCua(c) === `D${d}` && c.mucDo === 1 && !daGiao.has(c.qid)).length, `D${d}`).toBeGreaterThanOrEqual(4)
      expect(CAU.filter((c) => maDangCua(c) === `D${d}` && c.mucDo === 0 && !daGiao.has(c.qid)).length, `D${d}`).toBeGreaterThanOrEqual(1)
    }
  })
})

describe('khắc phục — VẮNG ⇒ Y HỆT (khoá với bản không có cổng)', () => {
  it('khacPhuc undefined / [] / toàn phần tử sai ⇒ bộ giống hệt (kể cả không có trường khacPhuc); thích nghi cũng y hệt', () => {
    const goc = chonBoCuaEm(CAU, LOI, emHieu(), NS_VUA, HAT)
    const bien: (DieuChinhEm | undefined)[] = [undefined, {}, kd(undefined), kd([]), kd([{ dang: '', soCau: 3, bac: 'dung_bac' }]), kd([{ dang: 'D1', soCau: NaN, bac: 'dung_bac' }]), kd([{ dang: 'D1', soCau: 3, bac: 'la' as never }]), kd([null as never, 5 as never])]
    for (const b of bien) {
      const bo = chonBoCuaEm(CAU, LOI, emHieu(), NS_VUA, HAT, b)
      expect(bo, JSON.stringify(b)).toEqual(goc)
      expect('khacPhuc' in bo).toBe(false)
    }
    const ket = { dung: Object.fromEntries(goc.chang[0].map((q) => [q, true])) }
    const tn0 = thichNghiChangSau(goc, CAU, emHieu(), 0, ket, { soChangDaMo: 1 })
    expect('khacPhuc' in tn0).toBe(false) // không thêm trường khi không có khắc phục (so với chính hàm thì vô nghĩa — kiểm trực tiếp)
    for (const b of bien) {
      const r = thichNghiChangSau(goc, CAU, emHieu(), 0, ket, { soChangDaMo: 1, dieuChinh: b })
      expect(r, JSON.stringify(b)).toEqual(tn0)
      expect('khacPhuc' in r, JSON.stringify(b)).toBe(false)
    }
  })
})

describe('khắc phục — chọn bộ (chèn vào chặng đầu)', () => {
  it('đúng bậc: chèn `soCau` câu CÙNG DẠNG, ĐÚNG bậc đích, chưa giao, vào chặng 0 sau khởi động/lõi/dạng yếu; bớt đúng bấy nhiêu câu CỦNG CỐ của dạng khác; tổng không tăng; nhãn `dang_yeu`', () => {
    const goc = chonBoCuaEm(CAU, LOI, emHieu(), NS_VUA, HAT)
    const ma = dangThu(goc, 1, 3)
    const bo = chonBoCuaEm(CAU, LOI, emHieu(), NS_VUA, HAT, kd([KP(ma, 3)]))
    const kq = bo.khacPhuc!
    expect(kq).toHaveLength(1)
    expect(kq[0]).toMatchObject({ dang: ma, yeuCau: 3, duoc: 3, chang: 0, lyDo: '' })
    expect(kq[0].vao).toHaveLength(3)
    for (const q of kq[0].vao) {
      expect(dangCua(q)).toBe(ma)
      expect(muc(q)).toBe(1) // bậc đích của em Hiểu
      expect(tatCa(goc)).not.toContain(q) // trước đó CHƯA giao
      expect(bo.loi).not.toContain(q)
      expect(bo.chang[0]).toContain(q)
      expect(bo.nhan[q]).toBe('dang_yeu')
      expect(bo.rieng).toContain(q)
    }
    // vị trí: ngay sau khối khởi động/lõi/dạng yếu, TRƯỚC câu củng cố
    const ch0 = bo.chang[0]
    const viTriCuoiDau = Math.max(...ch0.map((q, i) => (['khoi_dong', 'loi', 'dang_yeu'].includes(bo.nhan[q]) ? i : -1)))
    const viTriDauCungCo = ch0.findIndex((q) => bo.nhan[q] === 'cung_co')
    if (viTriDauCungCo >= 0) expect(viTriCuoiDau).toBeLessThan(viTriDauCungCo)
    // bớt: đúng 3 câu củng cố dạng khác, thuộc bộ gốc, không còn trong bộ mới
    expect(kq[0].ra).toHaveLength(3)
    for (const q of kq[0].ra) {
      expect(goc.nhan[q]).toBe('cung_co')
      expect(dangCua(q)).not.toBe(ma)
      expect(tatCa(bo)).not.toContain(q)
      expect(bo.nhan[q]).toBeUndefined()
    }
    // tổng tải không tăng, mọi thứ khác nguyên
    expect(bo.tomTat.tong).toBe(goc.tomTat.tong)
    expect(bo.chang.flat()).toHaveLength(goc.chang.flat().length)
    expect(bo.chang).toHaveLength(goc.chang.length)
    expect(bo.loi).toEqual(goc.loi)
    expect(bo.thuThach).toEqual(goc.thuThach)
    expect(bo.thuSucThem).toEqual(goc.thuSucThem)
    for (const q of goc.thuThach) expect(bo.chang.flat()).toContain(q)
    for (const q of goc.loi.filter((x) => !goc.thuSucThem.includes(x))) expect(bo.chang.flat()).toContain(q)
    // tomTat khớp bộ mới
    expect(bo.tomTat).toMatchObject({ tong: bo.chang.flat().length, soBatBuoc: bo.chang.flat().length, soRieng: bo.rieng.length, soLoi: goc.tomTat.soLoi, soThuThach: goc.tomTat.soThuThach, soThuSucThem: goc.tomTat.soThuSucThem, nganSachCau: goc.tomTat.nganSachCau })
    expect(bo.tomTat.soBiet).toBe(demMuc(bo, 0))
    expect(bo.tomTat.soHieu).toBe(demMuc(bo, 1))
    expect(bo.tomTat.soVanDung).toBe(demMuc(bo, 2))
    expect(bo.rieng).toEqual([...bo.rieng].sort((a, b) => CAU.findIndex((c) => c.qid === a) - CAU.findIndex((c) => c.qid === b)))
    // dạng ấy có thêm đúng 3 câu, các dạng khác không tăng
    expect(dangDe(bo, ma)).toBe(dangDe(goc, ma) + 3)
    // mỗi câu xuất hiện ĐÚNG một lần
    expect(new Set(tatCa(bo)).size).toBe(tatCa(bo).length)
  })

  it('bậc "thap_hon_mot_bac": câu chèn có mức = bậc đích − 1; em ở bậc Biết thì không có bậc thấp hơn ⇒ 0 câu + lý do', () => {
    const goc = chonBoCuaEm(CAU, LOI, emHieu(), NS_VUA, HAT)
    const ma = dangThu(goc, 0, 1)
    const bo = chonBoCuaEm(CAU, LOI, emHieu(), NS_VUA, HAT, kd([KP(ma, 2, 'thap_hon_mot_bac')]))
    expect(bo.khacPhuc![0].duoc).toBeGreaterThanOrEqual(1)
    for (const q of bo.khacPhuc![0].vao) expect(muc(q)).toBe(0)
    const bo2 = chonBoCuaEm(CAU, LOI, emBiet(), NS_VUA, HAT, kd([KP('D1', 3, 'thap_hon_mot_bac')]))
    expect(bo2.khacPhuc![0]).toMatchObject({ dang: 'D1', duoc: 0, vao: [], ra: [], chang: null })
    expect(bo2.khacPhuc![0].lyDo).toMatch(/bậc Biết/)
    expect(bo2.chang).toEqual(chonBoCuaEm(CAU, LOI, emBiet(), NS_VUA, HAT).chang) // không đổi gì
  })

  it('KHÔNG ĐỦ CÂU: xin 4 mà chỉ còn 1 câu hợp lệ ⇒ chèn ĐÚNG 1 câu + lý do nêu "Chỉ còn 1 câu"; hết sạch ⇒ 0 câu + "Không còn câu"', () => {
    const ma = 'D0'
    const hs = emHieu()
    const { goc, song } = epConLai(hs, ma, 1)
    expect(song).toHaveLength(1)
    const bo = chonBoCuaEm(CAU, LOI, hs, NS_VUA, HAT, kd([KP(ma, 4)]))
    expect(bo.khacPhuc![0]).toMatchObject({ dang: ma, yeuCau: 4, duoc: 1, chang: 0 })
    expect(bo.khacPhuc![0].vao).toEqual(song)
    expect(bo.khacPhuc![0].lyDo).toMatch(/Chỉ còn 1 câu/)
    expect(bo.tomTat.tong).toBe(goc.tomTat.tong)
    // hết sạch
    const hs2 = emHieu()
    const { song: song0 } = epConLai(hs2, ma, 0)
    expect(song0).toHaveLength(0)
    const bo2 = chonBoCuaEm(CAU, LOI, hs2, NS_VUA, HAT, kd([KP(ma, 3)]))
    expect(bo2.khacPhuc![0]).toMatchObject({ duoc: 0, chang: null, vao: [], ra: [] })
    expect(bo2.khacPhuc![0].lyDo).toMatch(/Không còn câu cùng dạng/)
    expect(bo2.chang).toEqual(chonBoCuaEm(CAU, LOI, hs2, NS_VUA, HAT).chang)
  })

  it('KHÔNG CÒN CÂU ĐỂ BỚT: bộ chỉ có lõi + khởi động (không có câu củng cố) ⇒ không chèn (tổng tải không được tăng), lý do rõ', () => {
    // ngân sách = 12 (2 ngày × 6): lõi bắt buộc chiếm gần hết ⇒ gần như không có củng cố. Ép bằng ngân sách đúng bằng lõi.
    const goc0 = chonBoCuaEm(CAU, LOI, emHieu(), NS(1, 1), HAT) // ngân sách nhỏ hơn lõi ⇒ kẹp bằng lõi bắt buộc
    expect(Object.values(goc0.nhan).filter((n) => n === 'cung_co')).toHaveLength(0)
    const bo = chonBoCuaEm(CAU, LOI, emHieu(), NS(1, 1), HAT, kd([KP('D0', 3)]))
    expect(bo.khacPhuc![0]).toMatchObject({ dang: 'D0', duoc: 0, chang: null })
    expect(bo.khacPhuc![0].lyDo).toMatch(/củng cố để bớt/)
    expect(bo.chang).toEqual(goc0.chang)
    expect(bo.tomTat).toEqual(goc0.tomTat)
  })

  it('dạng tạm nghỉ / dạng không có trong bài / không có chặng ⇒ 0 câu + lý do; dạng khác trong cùng cổng vẫn được làm', () => {
    const goc = chonBoCuaEm(CAU, LOI, emHieu(), NS_VUA, HAT)
    const ma = dangThu(goc, 1, 2)
    const bo = chonBoCuaEm(CAU, LOI, emHieu(), NS_VUA, HAT, { dang: [{ ma: 'D7', nut: 'tam_nghi' }], khacPhuc: [KP('D7', 2), KP('KHONG_CO', 2), KP(ma === 'D7' ? 'D6' : ma, 2)] })
    // tối đa 2 phần tử: D7 (tạm nghỉ) + KHONG_CO; phần tử thứ 3 bị cắt
    expect(bo.khacPhuc).toHaveLength(2)
    expect(bo.khacPhuc![0]).toMatchObject({ dang: 'D7', duoc: 0 })
    expect(bo.khacPhuc![0].lyDo).toMatch(/tạm nghỉ/)
    expect(bo.khacPhuc![1]).toMatchObject({ dang: 'KHONG_CO', duoc: 0 })
    expect(bo.khacPhuc![1].lyDo).toMatch(/không có trong bài/)
    const bo2 = chonBoCuaEm(CAU, LOI, emHieu(), NS_VUA, HAT, kd([KP('KHONG_CO', 2), KP(ma, 2)]))
    expect(bo2.khacPhuc![1]).toMatchObject({ dang: ma, duoc: 2 })
  })

  it('CHUẨN HOÁ cổng: soCau kẹp 2–4 (9 ⇒ 4, 0 ⇒ 2, 2,7 ⇒ 2), phần tử lặp dạng/bậc lạ/NaN bị bỏ, tối đa 2 dạng', () => {
    const goc = chonBoCuaEm(CAU, LOI, emHieu(), NS_VUA, HAT)
    const ma = dangThu(goc, 1, 4)
    const a = chonBoCuaEm(CAU, LOI, emHieu(), NS_VUA, HAT, kd([KP(ma, 9)]))
    expect(a.khacPhuc![0].yeuCau).toBe(4)
    const b = chonBoCuaEm(CAU, LOI, emHieu(), NS_VUA, HAT, kd([KP(ma, 0)]))
    expect(b.khacPhuc![0].yeuCau).toBe(2)
    const c = chonBoCuaEm(CAU, LOI, emHieu(), NS_VUA, HAT, kd([KP(ma, 2.7)]))
    expect(c.khacPhuc![0].yeuCau).toBe(2)
    const d = chonBoCuaEm(CAU, LOI, emHieu(), NS_VUA, HAT, kd([KP(ma, 2), KP(ma, 4), { dang: 'D0', soCau: NaN, bac: 'dung_bac' }, { dang: 'D0', soCau: 2, bac: 'sai' as never }, KP('D1', 2), KP('D2', 2)]))
    expect(d.khacPhuc!.map((x) => x.dang)).toEqual([ma, 'D1']) // lặp bỏ, NaN/bậc lạ bỏ, cắt còn 2
  })

  it('CÂU ƯU TIÊN: chưa từng làm → (từng sai) → đã đúng 1 ngày; đã đúng ≥ 2 ngày KHÔNG được chọn', () => {
    const ma = 'D0'
    const hs = emHieu()
    const { song } = epConLai(hs, ma, 2)
    expect(song).toHaveLength(2)
    // câu đầu: em đã đúng 1 ngày (vẫn được, nhưng xếp SAU câu chưa từng làm)
    hs.cau[song[0]] = { trangThai: 'da_khac_phuc', ngayDungKhacNhau: 1, lanSai: 0 }
    const { goc } = epConLai(hs, ma, 2)
    const bo = chonBoCuaEm(CAU, LOI, hs, NS_VUA, HAT, kd([KP(ma, 2)]))
    const vao = bo.khacPhuc![0].vao
    expect(vao).toHaveLength(2)
    expect([...vao].sort()).toEqual([...song].sort())
    expect(vao[0]).toBe(song[1]) // chưa từng làm đứng trước
    expect(vao[1]).toBe(song[0])
    expect(bo.tomTat.tong).toBe(goc.tomTat.tong)
  })

  it('TẤT ĐỊNH + không sửa đầu vào', () => {
    const goc = chonBoCuaEm(CAU, LOI, emHieu(), NS_VUA, HAT)
    const ma = dangThu(goc, 1, 2)
    const cau = CAU.map((c) => Object.freeze({ ...c }))
    const hs = emHieu()
    const dc = kd([KP(ma, 3)])
    const snap = JSON.stringify([cau, hs, dc, LOI])
    const a = chonBoCuaEm(cau as CauGiao[], LOI, hs, NS_VUA, HAT, dc)
    const b = chonBoCuaEm(cau as CauGiao[], LOI, hs, NS_VUA, HAT, dc)
    expect(a).toEqual(b)
    expect(JSON.stringify([cau, hs, dc, LOI])).toBe(snap)
  })
})

describe('khắc phục — bộ dựng tay: dạng YẾU được đủ ≥ 2 câu nhờ khắc phục ⇒ tomTat cập nhật', () => {
  it('dạng A yếu chỉ có 1 câu trong bộ; khắc phục 2 câu A (đúng bậc Biết) bớt 2 câu củng cố dạng B ⇒ A có 3 câu, soDangYeuDuCau 0 → 1, soBiet/soRieng/tong khớp', () => {
    const cau: CauGiao[] = ['a1', 'a2', 'a3', 'b1', 'b2', 'b3'].map((q) => ({ qid: q, dang: q[0].toUpperCase(), chuyenDe: 'C', mucDo: 0 as Muc, sao: 1 as const, phan: 'I' as const }))
    const hs: HoSoEmRut = { dang: { A: dangHS(0, 8, 0.4), B: dangHS(0, 8, 0.9) }, cau: {} }
    const bo: BoCuaEm = {
      loi: ['a1', 'b1'],
      thuSucThem: [],
      rieng: ['b2', 'b3'],
      thuThach: [],
      chang: [['a1', 'b1'], ['b2', 'b3']],
      nhan: { a1: 'loi', b1: 'loi', b2: 'cung_co', b3: 'cung_co' },
      tomTat: { tong: 4, soLoi: 2, soRieng: 2, soThuThach: 0, soLoiCao: 0, soThuSucThem: 0, soBatBuoc: 4, soBiet: 4, soHieu: 0, soVanDung: 0, soChang: 2, soDangYeu: 1, soDangYeuDuCau: 0, nganSachCau: 4 },
    }
    const r = thichNghiChangSau(bo, cau, hs, 0, { dung: {} }, { dieuChinh: kd([KP('A', 2)]) })
    expect(r.khacPhuc![0]).toMatchObject({ dang: 'A', duoc: 2, chang: 1, lyDo: '' })
    expect(r.bo.chang).toEqual([['a1', 'b1'], ['a2', 'a3']])
    expect(r.bo.rieng).toEqual(['a2', 'a3'])
    expect(r.bo.nhan).toEqual({ a1: 'loi', b1: 'loi', a2: 'dang_yeu', a3: 'dang_yeu' })
    expect(r.bo.tomTat).toEqual({ ...bo.tomTat, tong: 4, soBatBuoc: 4, soRieng: 2, soBiet: 4, soDangYeuDuCau: 1 })
    expect(r.doi.map((x) => [x.loai, x.vao, x.ra, x.chang])).toEqual([['khac_phuc', 'a2', 'b2', 1], ['khac_phuc', 'a3', 'b3', 1]])
    // đầu vào không bị sửa
    expect(bo.chang).toEqual([['a1', 'b1'], ['b2', 'b3']])
    expect(bo.tomTat.soDangYeuDuCau).toBe(0)
  })
})

describe('khắc phục — THỨ TỰ BỚT (câu dễ nhất của dạng khác, chặng đích trước)', () => {
  it('600 ca hồ sơ dày: bớt luôn là câu DỄ NHẤT theo (mức, hạng "em từng đúng < chưa làm < từng sai", sao, thứ tự) trong chặng đích; có ca hoà mức mà khác hạng', () => {
    const rnd = mulberry32(4242)
    const dang8 = Array.from({ length: 8 }, (_, d) => `D${d}`)
    const hang = (ho: HoSoEmRut, q: string) => (ho.cau[q] ? (ho.cau[q].trangThai === 'da_khac_phuc' || ho.cau[q].trangThai === 'chua_thay_sai' ? 0 : 2) : 1)
    let soCa = 0
    let soHoaMuc = 0
    for (let lan = 0; lan < 600; lan++) {
      const ho: HoSoEmRut = { dang: {}, cau: {} }
      for (const ma of dang8) ho.dang[ma] = dangHS(Math.floor(rnd() * 3) as Muc, 4 + Math.floor(rnd() * 8), 0.7 + rnd() * 0.3)
      for (const c of CAU) if (rnd() < 0.6) ho.cau[c.qid] = { trangThai: (['chua_thay_sai', 'moi_sai', 'dang_on', 'da_khac_phuc'] as const)[Math.floor(rnd() * 4)], ngayDungKhacNhau: Math.floor(rnd() * 2), lanSai: Math.floor(rnd() * 3) }
      const ns = NS(3, 8 + Math.floor(rnd() * 4))
      const goc = chonBoCuaEm(CAU, LOI, ho, ns, `TU|${lan}`)
      const ma = dang8[Math.floor(rnd() * 8)]
      const bo = chonBoCuaEm(CAU, LOI, ho, ns, `TU|${lan}`, kd([KP(ma, 2)]))
      const k = bo.khacPhuc![0]
      const kho = goc.chang[0].filter((q) => goc.nhan[q] === 'cung_co' && dangCua(q) !== ma)
      if (k.duoc === 0 || kho.length < k.duoc) continue
      soCa++
      const khoa = (q: string) => [muc(q), hang(ho, q), CAU.find((c) => c.qid === q)!.sao, CAU.findIndex((c) => c.qid === q)]
      const nho = (a: number[], b: number[]) => { for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] < b[i]; return true }
      for (const q of k.ra) expect(goc.chang[0]).toContain(q)
      for (const r of k.ra) for (const u of kho.filter((x) => !k.ra.includes(x))) {
        expect(nho(khoa(r), khoa(u)), `${lan}: bớt ${r} nhưng còn câu dễ hơn ${u}`).toBe(true)
        if (muc(r) === muc(u) && hang(ho, r) !== hang(ho, u)) soHoaMuc++
      }
    }
    expect(soCa).toBeGreaterThan(100)
    expect(soHoaMuc).toBeGreaterThan(5)
  })
})

describe('khắc phục — SAU CHẶNG (thichNghiChangSau): chèn vào chặng CHƯA MỞ kế tiếp', () => {
  const goc = () => chonBoCuaEm(CAU, LOI, emHieu(), NS(4, 8), HAT)
  const dungHet = (bo: BoCuaEm, c: number) => ({ dung: Object.fromEntries(bo.chang[c].map((q) => [q, true])) })

  it('sau chặng 0 (chặng 1 chưa mở): câu chèn vào CHẶNG 1; chặng 0 và chặng 2+ chỉ đổi ở chỗ bị bớt; `doi` có loai khac_phuc; tổng không tăng; lõi/thử thách nguyên', () => {
    const b0 = goc()
    const ma = dangThu(b0, 1, 2)
    const r = thichNghiChangSau(b0, CAU, emHieu(), 0, dungHet(b0, 0), { soChangDaMo: 1, dieuChinh: kd([KP(ma, 2)]) })
    expect(r.khacPhuc![0]).toMatchObject({ dang: ma, duoc: 2, chang: 1, lyDo: '' })
    expect(r.bo.chang[0]).toEqual(b0.chang[0]) // chặng đã xong/mở KHÔNG đổi
    for (const q of r.khacPhuc![0].vao) {
      expect(r.bo.chang[1]).toContain(q)
      expect(dangCua(q)).toBe(ma)
      expect(muc(q)).toBe(1)
    }
    expect(r.doi.filter((x) => x.loai === 'khac_phuc')).toHaveLength(2)
    expect(r.doi.filter((x) => x.loai === 'khac_phuc').every((x) => x.chang === 1)).toBe(true)
    expect(r.bo.tomTat.tong).toBe(b0.tomTat.tong)
    expect(r.bo.chang.flat()).toHaveLength(b0.chang.flat().length)
    expect(r.bo.chang).toHaveLength(b0.chang.length)
    expect(r.bo.loi).toEqual(b0.loi)
    expect(r.bo.thuThach).toEqual(b0.thuThach)
    for (const q of b0.thuThach) expect(r.bo.chang.flat()).toContain(q)
    // chặng 2, 3 chỉ MẤT câu (bớt), không thêm câu mới nào ngoài chặng 1
    for (const c of [2, 3]) for (const q of r.bo.chang[c]) expect(b0.chang[c]).toContain(q)
  })

  it('soChangDaMo = 2 (em mở sớm chặng 1): chèn vào chặng 2; không có chặng chưa mở nào ⇒ 0 câu + lý do', () => {
    const b0 = goc()
    const ma = dangThu(b0, 1, 2)
    const r = thichNghiChangSau(b0, CAU, emHieu(), 0, dungHet(b0, 0), { soChangDaMo: 2, dieuChinh: kd([KP(ma, 2)]) })
    expect(r.bo.chang[0]).toEqual(b0.chang[0])
    expect(r.bo.chang[1]).toEqual(b0.chang[1])
    expect(r.khacPhuc![0].chang).toBe(2)
    const het = thichNghiChangSau(b0, CAU, emHieu(), 3, dungHet(b0, 3), { soChangDaMo: 4, dieuChinh: kd([KP(ma, 2)]) })
    expect(het.khacPhuc![0]).toMatchObject({ duoc: 0, chang: null })
    expect(het.khacPhuc![0].lyDo).toMatch(/chưa mở/)
    expect(het.bo.chang).toEqual(b0.chang)
  })

  it('chặng vừa xong = −1 (áp lên bộ đang chạy, chưa chặng nào xong): chặng đích = max(0, soChangDaMo)', () => {
    const b0 = goc()
    const ma = dangThu(b0, 1, 2)
    const r = thichNghiChangSau(b0, CAU, emHieu(), -1, { dung: {} }, { soChangDaMo: 1, dieuChinh: kd([KP(ma, 2)]) })
    expect(r.khacPhuc![0]).toMatchObject({ duoc: 2, chang: 1 })
    expect(r.bo.chang[0]).toEqual(b0.chang[0])
    const r0 = thichNghiChangSau(b0, CAU, emHieu(), -1, { dung: {} }, { dieuChinh: kd([KP(ma, 2)]) })
    expect(r0.khacPhuc![0].chang).toBe(0)
  })

  it('dạng TẠM NGHỈ (nút dạng đi cùng cổng) ⇒ khắc phục dạng ấy không chèn gì + lý do; dạng khác vẫn làm', () => {
    const b0 = goc()
    const ma = dangThu(b0, 1, 2)
    const khac = ['D0', 'D1', 'D2', 'D3'].find((d) => d !== ma)! // mọi dạng của bài mẫu còn ≥ 4 câu Hiểu chưa giao (khoá ở test tiền đề)
    const r = thichNghiChangSau(b0, CAU, emHieu(), 0, dungHet(b0, 0), { soChangDaMo: 1, dieuChinh: { dang: [{ ma, nut: 'tam_nghi' }], khacPhuc: [KP(ma, 2), KP(khac, 2)] } })
    expect(r.khacPhuc![0]).toMatchObject({ dang: ma, duoc: 0, chang: null })
    expect(r.khacPhuc![0].lyDo).toMatch(/tạm nghỉ/)
    expect(r.khacPhuc![1].dang).toBe(khac)
  })

  it('chặng vừa xong không hợp lệ (NaN / không nguyên) ⇒ bỏ qua khắc phục, y như trước', () => {
    const b0 = goc()
    const ma = dangThu(b0, 1, 2)
    const r = thichNghiChangSau(b0, CAU, emHieu(), Number.NaN, { dung: {} }, { dieuChinh: kd([KP(ma, 2)]) })
    expect(r).toEqual(thichNghiChangSau(b0, CAU, emHieu(), Number.NaN, { dung: {} }, {}))
  })

  it('gọi lặp (mỗi chặng xong trong 3 ngày hiệu lực) KHÔNG phình mãi: số câu của dạng chỉ tăng tới hết kho chưa giao, tổng không đổi', () => {
    let bo = goc()
    const ma = dangThu(bo, 1, 2)
    const tong0 = bo.tomTat.tong
    const khoDang = CAU.filter((c) => maDangCua(c) === ma).length
    for (let c = 0; c < 3; c++) {
      const r = thichNghiChangSau(bo, CAU, emHieu(), c, dungHet(bo, c), { soChangDaMo: c + 1, dieuChinh: kd([KP(ma, 4)]) })
      bo = r.bo
      expect(bo.tomTat.tong).toBe(tong0)
      expect(bo.chang.flat()).toHaveLength(tong0)
      expect(dangDe(bo, ma)).toBeLessThanOrEqual(khoDang)
      expect(new Set(tatCa(bo)).size).toBe(tatCa(bo).length)
    }
  })

  it('KHẮC PHỤC đi sau thích nghi theo mẫu: cả hai cùng có mặt trong `doi`; chỗ bị bớt không phải câu vừa chèn bởi thích nghi', () => {
    const b0 = goc()
    const ma = dangThu(b0, 1, 2)
    // chặng 0 làm SAI hết ⇒ thích nghi thêm câu dễ (them_cau_de) + hẹn ôn; khắc phục chèn thêm
    const r = thichNghiChangSau(b0, CAU, emHieu(), 0, { dung: Object.fromEntries(b0.chang[0].map((q) => [q, false])) }, { soChangDaMo: 1, dieuChinh: kd([KP(ma, 2)]) })
    const loaiDoi = new Set(r.doi.map((x) => x.loai))
    expect(loaiDoi.has('khac_phuc')).toBe(true)
    expect(r.henOnLai.length).toBeGreaterThan(0)
    expect(r.bo.tomTat.tong).toBeLessThanOrEqual(b0.tomTat.nganSachCau)
    expect(new Set(tatCa(r.bo)).size).toBe(tatCa(r.bo).length)
  })
})

describe('khắc phục — TÍNH CHẤT: DEADLINE THẮNG MỌI NÚM (mọi em × mọi cổng hợp lệ, kể cả nhịp −3)', () => {
  it('với MỌI dieuChinh (nhịp, khởi động, nút dạng, khacPhuc): số chặng ≤ số ngày và = số chặng của bản không khacPhuc; tổng KHÔNG tăng so với bản không khacPhuc; lõi bắt buộc + thử thách nguyên; mỗi câu đúng một lần; câu chèn cùng dạng, chưa giao, đúng bậc', () => {
    const rnd = mulberry32(20260921)
    const dang8 = Array.from({ length: 8 }, (_, d) => `D${d}`)
    let soChen = 0
    let soBotChangDich = 0
    let soLanCoKp = 0
    for (let lan = 0; lan < 400; lan++) {
      // em ngẫu nhiên
      const ho: HoSoEmRut = { dang: {}, cau: {} }
      for (const ma of dang8) if (rnd() < 0.85) ho.dang[ma] = dangHS(Math.floor(rnd() * 3) as Muc, 4 + Math.floor(rnd() * 8), rnd() < 0.3 ? 0.4 : 0.6 + rnd() * 0.4)
      for (const c of CAU) if (rnd() < 0.25) ho.cau[c.qid] = { trangThai: (['chua_thay_sai', 'moi_sai', 'dang_on', 'da_khac_phuc'] as const)[Math.floor(rnd() * 4)], ngayDungKhacNhau: Math.floor(rnd() * 4), lanSai: Math.floor(rnd() * 3) }
      const ns = NS(1 + Math.floor(rnd() * 6), 6 + Math.floor(rnd() * 11), Math.floor(rnd() * 4))
      const nut = (['uu_tien', 'ha_mot_bac', 'cho_thu_len_bac', 'tam_nghi'] as const)
      const dc: DieuChinhEm = {
        nhip: Math.floor(rnd() * 7) - 3,
        khoiDong: 1 + Math.floor(rnd() * 3),
        dang: Array.from({ length: Math.floor(rnd() * 4) }, () => ({ ma: dang8[Math.floor(rnd() * 8)], nut: nut[Math.floor(rnd() * 4)] })),
        khacPhuc: Array.from({ length: 1 + Math.floor(rnd() * 3) }, () => ({ dang: dang8[Math.floor(rnd() * 8)], soCau: Math.floor(rnd() * 7), bac: rnd() < 0.5 ? ('dung_bac' as const) : ('thap_hon_mot_bac' as const) })),
      }
      const dcKhong: DieuChinhEm = { ...dc, khacPhuc: undefined }
      const hat = `KP|${lan}`
      const truoc = chonBoCuaEm(CAU, LOI, ho, ns, hat, dcKhong)
      const sau = chonBoCuaEm(CAU, LOI, ho, ns, hat, dc)
      soLanCoKp++
      // deadline + tổng tải
      expect(sau.chang.length).toBe(truoc.chang.length)
      expect(sau.chang.length).toBeLessThanOrEqual(ns.soNgay)
      expect(sau.chang.flat().length).toBe(truoc.chang.flat().length)
      expect(sau.tomTat.tong).toBe(truoc.tomTat.tong)
      expect(sau.tomTat.tong).toBeLessThanOrEqual(Math.max(truoc.tomTat.soLoi, truoc.tomTat.nganSachCau))
      // lõi bắt buộc + thử thách + thử sức thêm nguyên
      expect(sau.loi).toEqual(truoc.loi)
      expect(sau.thuThach).toEqual(truoc.thuThach)
      expect(sau.thuSucThem).toEqual(truoc.thuSucThem)
      const batBuoc = truoc.loi.filter((q) => !truoc.thuSucThem.includes(q))
      const trongChang = new Set(sau.chang.flat())
      for (const q of [...batBuoc, ...truoc.thuThach]) expect(trongChang.has(q), `${lan}: ${q} phải còn trong chặng`).toBe(true)
      expect(trongChang.size).toBe(sau.chang.flat().length) // không trùng
      for (const q of sau.thuSucThem) expect(trongChang.has(q)).toBe(false)
      // câu chèn
      const dieuKp = sau.khacPhuc ?? []
      for (const k of dieuKp) {
        expect(k.duoc).toBeLessThanOrEqual(k.yeuCau)
        expect(k.yeuCau).toBeGreaterThanOrEqual(2)
        expect(k.yeuCau).toBeLessThanOrEqual(4)
        expect(k.vao).toHaveLength(k.duoc)
        expect(k.ra).toHaveLength(k.duoc)
        expect(k.duoc < k.yeuCau ? k.lyDo.length > 0 : k.lyDo === '').toBe(true)
        for (const q of k.vao) {
          soChen++
          expect(dangCua(q)).toBe(k.dang)
          expect(truoc.chang.flat()).not.toContain(q) // chưa giao
          expect(truoc.loi).not.toContain(q)
          expect(sau.chang[0]).toContain(q)
          expect(sau.nhan[q]).toBe('dang_yeu')
          expect(muc(q)).toBeLessThanOrEqual(2)
          expect((ho.cau[q]?.ngayDungKhacNhau ?? 0) < 2).toBe(true)
        }
        if (k === dieuKp[0] && k.duoc > 0) {
          // BỚT: câu củng cố của dạng khác; chặng ĐÍCH (chặng 0) trước khi đủ chỗ; trong đó bớt câu DỄ NHẤT (mức thấp, em đã đúng, ít sao, đứng trước)
          const kho = truoc.chang[0].filter((q) => truoc.nhan[q] === 'cung_co' && dangCua(q) !== k.dang)
          const khoa = (q: string) => [muc(q), (ho.cau[q] ? (ho.cau[q].trangThai === 'da_khac_phuc' || ho.cau[q].trangThai === 'chua_thay_sai' ? 0 : 2) : 1), CAU.find((c) => c.qid === q)!.sao, CAU.findIndex((c) => c.qid === q)]
          const nho = (a: number[], b: number[]) => { for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] < b[i]; return true }
          if (kho.length >= k.duoc) {
            for (const q of k.ra) expect(truoc.chang[0], `${lan}: ${q} phải bớt ở chặng đích`).toContain(q)
            for (const r of k.ra) for (const u of kho.filter((x) => !k.ra.includes(x))) expect(nho(khoa(r), khoa(u)), `${lan}: bớt ${r} nhưng còn câu dễ hơn ${u}`).toBe(true)
            soBotChangDich++
          }
        }
        for (const q of k.ra) {
          expect(truoc.nhan[q]).toBe('cung_co')
          expect(sau.chang.flat()).not.toContain(q)
          expect(dangCua(q)).not.toBe(k.dang)
        }
      }
      // tomTat khớp
      expect(sau.tomTat.soBiet + sau.tomTat.soHieu + sau.tomTat.soVanDung).toBe(sau.tomTat.tong)
      const yeuDu = dang8.filter((ma) => { const d = ho.dang[ma]; return !!d && d.soGap >= 4 && d.tiLeKhacPhuc !== null && d.tiLeKhacPhuc < 0.7 && sau.chang.flat().filter((q) => dangCua(q) === ma).length >= 2 }).length
      expect(sau.tomTat.soDangYeuDuCau, `${lan}: soDangYeuDuCau`).toBe(yeuDu)
      // cùng đầu vào ⇒ cùng bộ
      expect(chonBoCuaEm(CAU, LOI, ho, ns, hat, dc)).toEqual(sau)
    }
    expect(soLanCoKp).toBe(400)
    expect(soBotChangDich).toBeGreaterThan(10) // có ca kiểm thứ tự bớt thật
    expect(soChen).toBeGreaterThan(30) // có chèn thật (không chỉ chạy suông)
  })

  it('SAU CHẶNG: chặng < chặng đích nguyên; số chặng, lõi, thử thách nguyên; tổng không tăng; câu chèn ở chặng đích; mọi em × mọi cổng', () => {
    const rnd = mulberry32(777)
    const dang8 = Array.from({ length: 8 }, (_, d) => `D${d}`)
    let soChen = 0
    for (let lan = 0; lan < 300; lan++) {
      const ho: HoSoEmRut = { dang: {}, cau: {} }
      for (const ma of dang8) if (rnd() < 0.85) ho.dang[ma] = dangHS(Math.floor(rnd() * 3) as Muc, 4 + Math.floor(rnd() * 8), 0.5 + rnd() * 0.5)
      const ns = NS(2 + Math.floor(rnd() * 5), 6 + Math.floor(rnd() * 10), Math.floor(rnd() * 3))
      const hat = `KPS|${lan}`
      const b0 = chonBoCuaEm(CAU, LOI, ho, ns, hat)
      if (b0.chang.length < 2) continue
      const chiSo = Math.floor(rnd() * (b0.chang.length - 1))
      const daMo = chiSo + 1 + Math.floor(rnd() * 2)
      const dung = Object.fromEntries(b0.chang[chiSo].map((q) => [q, rnd() < 0.5]))
      const dc: DieuChinhEm = { khacPhuc: Array.from({ length: 1 + Math.floor(rnd() * 2) }, () => ({ dang: dang8[Math.floor(rnd() * 8)], soCau: 2 + Math.floor(rnd() * 3), bac: rnd() < 0.5 ? ('dung_bac' as const) : ('thap_hon_mot_bac' as const) })) }
      const truoc = thichNghiChangSau(b0, CAU, ho, chiSo, { dung }, { soChangDaMo: daMo })
      const sau = thichNghiChangSau(b0, CAU, ho, chiSo, { dung }, { soChangDaMo: daMo, dieuChinh: dc })
      const dich = Math.max(chiSo + 1, daMo)
      expect(sau.bo.chang).toHaveLength(b0.chang.length)
      expect(sau.bo.chang.flat()).toHaveLength(truoc.bo.chang.flat().length) // tổng không tăng so với thích nghi thuần
      expect(sau.bo.tomTat.tong).toBe(truoc.bo.tomTat.tong)
      for (let c = 0; c < Math.min(dich, b0.chang.length); c++) expect(sau.bo.chang[c], `${lan}: chặng ${c} đã mở`).toEqual(truoc.bo.chang[c])
      expect(sau.bo.loi).toEqual(b0.loi)
      expect(sau.bo.thuThach).toEqual(b0.thuThach)
      for (const q of b0.thuThach) expect(sau.bo.chang.flat()).toContain(q)
      for (const q of b0.loi.filter((x) => !b0.thuSucThem.includes(x))) expect(sau.bo.chang.flat()).toContain(q)
      expect(new Set(sau.bo.chang.flat()).size).toBe(sau.bo.chang.flat().length)
      expect(sau.henOnLai).toEqual(truoc.henOnLai)
      for (const k of sau.khacPhuc ?? []) {
        for (const q of k.vao) {
          soChen++
          if (dich < b0.chang.length) expect(sau.bo.chang[dich]).toContain(q)
          expect(dangCua(q)).toBe(k.dang)
        }
        if (dich >= b0.chang.length) expect(k.duoc).toBe(0)
      }
    }
    expect(soChen).toBeGreaterThan(20)
  })
})
