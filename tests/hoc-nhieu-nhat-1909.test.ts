// M5 — TỐI ƯU "HỌC NHIỀU NHẤT TRONG BUỔI" (21/09/2026, Code 1).
//
//   giá trị câu   v = tỉLệLớpSai × (1 + 0,5 × [dạng lớp yếu CHƯA được chữa trong buổi])   (bắt buộc là TẦNG, không phải "vô hạn")
//   chọn theo     MẬT ĐỘ v / (giây thêm thật) trong từng tầng đã chốt: bắt buộc → 2 sao → 1 sao → 0 sao
//   ràng buộc     còn dạng lớp yếu CHƯA có câu nào thì không chữa câu thứ hai của dạng đã phủ
//   ghép đôi thật hai câu bậc 1 liền nhau chia ĐỀU phần làm bài dài hơn; câu bậc ≥ 2 mang TRỌN T (M1 từng tính ½ — nợ đã sửa)
//   số đo         tổng giá trị · số dạng yếu được phủ · số em lên bảng · số câu dời buổi sau — không chữ "nắm chắc"
//
// Các bảng dưới đây tính TAY; đổi hằng số ở `HOC_NHIEU` (len-bang-cau-hinh.ts) là phải xem lại (có chủ ý).
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { HOC_NHIEU, CAU_HINH_LEN_BANG_MAC_DINH, nganSachGiay } from '../src/lib/len-bang-cau-hinh'
import { thoiGianCau, type NoiDungCau } from '../src/lib/thoi-gian-len-bang'
import { BTVN_RONG, emYeuDang, type HoSoEmDayDu, type NamKtCauEm } from '../src/lib/ho-so-lop'
import { bangChuBuoiChua, chuSoGiaTri, xepBuoiChua, type CauVaoXep } from '../src/lib/xep-buoi-chua'
import type { CauChua } from '../src/lib/phan-cong'
import type { BacBoCuc } from '../src/lib/bo-cuc-to-chieu'

const nd = (soTu: number, coHinh = false, soBuoc = 0): NoiDungCau => ({ soTu, coHinh, soBuoc })
const cauChua = (id: string, i: number, sao: 0 | 1 | 2, phan: 'I' | 'II' | 'III' = 'I'): CauChua => ({ id, phan, so: i, chuyenDe: 'Chuyên đề', mucDo: 'hieu', tomTat: '', viTri: i, sao, lyDoSao: '' })
/** Câu vào xếp; `sai` = tỉ lệ lớp SAI (tiLeDung = 1 − sai). Không `noiDung` ⇒ 300/180/120 như cũ. */
const vao = (id: string, i: number, sao: 0 | 1 | 2, sai: number, o: Partial<CauVaoXep> = {}): CauVaoXep => ({ cau: cauChua(id, i, sao), tiLeDung: 1 - sai, soEmLam: 20, batBuoc: false, ...o })

type Dang = { soGap: number; soDaKhacPhuc: number; soChuaThaySai: number }
const YEU: Dang = { soGap: 10, soDaKhacPhuc: 2, soChuaThaySai: 2 } // (2+2)/10 = 0,4 < 0,7 ⇒ yếu
const KHONG_YEU: Dang = { soGap: 10, soDaKhacPhuc: 5, soChuaThaySai: 4 } // 0,9 ≥ 0,7
/** Em có hồ sơ nắm kiến thức ở từng câu: `theoCau[qid] = [maDạng, số liệu dạng của em]`. */
const em = (i: number, theoCau: Record<string, [string, Dang | null]>, coMat = true): HoSoEmDayDu => ({
  sbd: `120${String(i).padStart(2, '0')}`,
  hoTen: `Em ${i}`,
  coMat,
  chuyenDe: [{ ten: 'Chuyên đề', soCau: 10, soSai: 4 }],
  cauSai: [],
  daLam: new Map(),
  lenBang: { soLan: 0, lanCuoi: '', qids: [] },
  btvn: { ...BTVN_RONG, theoCau: new Map() },
  namKt: new Map(Object.entries(theoCau).map(([q, [maDang, dang]]) => [q, { lanSai: 0, trangThai: 'chua_thay_sai', canDayLai: false, maDang, bac: null, dang } as NamKtCauEm])),
})
const lop = (n: number, theoCau: Record<string, [string, Dang | null]>) => Array.from({ length: n }, (_, i) => em(i + 1, theoCau))
const thuTuChon = (kq: ReturnType<typeof xepBuoiChua>) => kq.dong.filter((d) => d.tang === 'len_bang').map((d) => d.cau.id)

// Sáu em, hai dạng lớp yếu (A, B) và một dạng không yếu (C).
const THEO_CAU: Record<string, [string, Dang | null]> = {
  A1: ['A', YEU], A2: ['A', YEU], A3: ['A', YEU], B1: ['B', YEU], C1: ['C', KHONG_YEU], C2: ['C', KHONG_YEU], C3: ['C', KHONG_YEU],
}

describe('DẠNG LỚP YẾU — nâng định nghĩa `nam_kt_dang` từ em lên lớp', () => {
  it('em yếu dạng: ≥ 4 câu đã gặp và (khắc phục + chưa từng sai)/đã gặp < 0,7; chưa đủ căn cứ ⇒ null; đúng 0,7 ⇒ KHÔNG yếu', () => {
    const e = (d: Dang | null) => em(1, { Q: ['A', d] })
    expect(emYeuDang(e(YEU), 'Q')).toBe(true)
    expect(emYeuDang(e(KHONG_YEU), 'Q')).toBe(false)
    expect(emYeuDang(e({ soGap: 3, soDaKhacPhuc: 0, soChuaThaySai: 0 }), 'Q')).toBeNull() // dưới SO_CAU_DU_TIN_DANG
    expect(emYeuDang(e(null), 'Q')).toBeNull() // máy chủ không có số liệu dạng
    expect(emYeuDang(e({ soGap: 10, soDaKhacPhuc: 4, soChuaThaySai: 3 }), 'Q')).toBe(false) // đúng 0,7
    expect(emYeuDang(e({ soGap: 100, soDaKhacPhuc: 40, soChuaThaySai: 29 }), 'Q')).toBe(true) // 0,69
    expect(emYeuDang(em(1, {}), 'Q')).toBeNull() // em không có dòng nào cho câu
  })

  const ds = [vao('A1', 1, 1, 0.8), vao('B1', 2, 1, 0.4)]
  it('dạng LỚP yếu khi ≥ 3 em có mặt có số liệu VÀ ≥ nửa số em ấy yếu — ba hằng số nằm ở `HOC_NHIEU`', () => {
    expect(HOC_NHIEU).toEqual({ HE_SO_DANG_YEU: 0.5, DANG_YEU_LOP_TL_EM: 0.5, DANG_YEU_LOP_TOI_THIEU_EM: 3 })
    const soDang = (dsEm: HoSoEmDayDu[]) => xepBuoiChua(ds, dsEm).hocNhieu.soDangYeu
    const yeu = { A1: ['A', YEU], B1: ['B', YEU] } as Record<string, [string, Dang | null]>
    const ko = { A1: ['A', KHONG_YEU], B1: ['B', KHONG_YEU] } as Record<string, [string, Dang | null]>
    expect(soDang(lop(3, yeu))).toBe(2)
    expect(soDang(lop(2, yeu))).toBe(0) // chỉ 2 em có số liệu: chưa đủ để nói về LỚP
    expect(soDang([...lop(1, yeu), ...lop(2, ko).map((e, i) => ({ ...e, sbd: `130${i}` }))])).toBe(0) // 1/3 yếu
    expect(soDang([...lop(2, yeu), { ...em(9, ko), sbd: '13009' }])).toBe(2) // 2/3 yếu
    expect(soDang([...lop(2, yeu), ...lop(2, ko).map((e, i) => ({ ...e, sbd: `131${i}` }))])).toBe(2) // ĐÚNG một nửa (2/4) vẫn là dạng yếu của lớp
    expect(soDang([...lop(2, yeu), ...lop(3, ko).map((e, i) => ({ ...e, sbd: `132${i}` }))])).toBe(0) // 2/5 = 0,4 < nửa
    // em VẮNG không tính (hồ sơ máy thầy có cả em không đến)
    expect(soDang([...lop(2, yeu), em(7, yeu, false), em(8, yeu, false)])).toBe(0)
    // số liệu dạng chưa đủ tin (< 4 câu) không tính là em yếu cũng không tính là em không yếu
    const it_ = { A1: ['A', { soGap: 2, soDaKhacPhuc: 0, soChuaThaySai: 0 }], B1: ['B', null] } as Record<string, [string, Dang | null]>
    expect(soDang(lop(6, it_))).toBe(0)
  })

  it('MÁY CHỦ ĐỜI CŨ (không hồ sơ nắm kiến thức): không có dạng yếu nào, dòng tóm tắt im về dạng, buổi vẫn xếp', () => {
    const kq = xepBuoiChua(ds, lop(6, {}).map((e) => ({ ...e, namKt: undefined })))
    expect(kq.hocNhieu.soDangYeu).toBe(0)
    expect(kq.hocNhieu.tomTat).not.toContain('dạng lớp yếu')
    expect(thuTuChon(kq)).toEqual(['A1', 'B1']) // theo mật độ giá trị (sai 0,8 rồi 0,4), cùng giá 180 s
  })
})

describe('GIÁ TRỊ + RÀNG BUỘC PHỦ DẠNG', () => {
  const dsCau = [vao('A1', 1, 1, 0.8), vao('A2', 2, 1, 0.8), vao('A3', 3, 1, 0.7), vao('B1', 4, 1, 0.4)]

  it('còn dạng yếu CHƯA có câu nào thì KHÔNG chữa câu thứ hai của dạng đã phủ: A1, B1 rồi mới A2, A3 (không ràng buộc sẽ là A1, A2, A3, B1)', () => {
    const kq = xepBuoiChua(dsCau, lop(6, THEO_CAU))
    expect(thuTuChon(kq)).toEqual(['A1', 'B1', 'A2', 'A3'])
    expect(kq.hocNhieu.soDangYeu).toBe(2)
    expect(kq.hocNhieu.soDangYeuDaPhu).toBe(2)
    expect(kq.hocNhieu.dangYeuChuaPhu).toEqual([])
  })

  it('TỔNG GIÁ TRỊ: câu đầu của mỗi dạng yếu ×1,5, các câu sau ×1 — 1,2 + 0,6 + 0,8 + 0,7 = 3,3', () => {
    const kq = xepBuoiChua(dsCau, lop(6, THEO_CAU))
    expect(kq.hocNhieu.tongGiaTri).toBeCloseTo(0.8 * 1.5 + 0.4 * 1.5 + 0.8 + 0.7, 10)
    expect(chuSoGiaTri(kq.hocNhieu.tongGiaTri)).toBe('3,3')
    // không có dạng yếu: giá trị chỉ là tỉ lệ lớp sai
    const khong = xepBuoiChua(dsCau, lop(6, {}).map((e) => ({ ...e, namKt: undefined })))
    expect(khong.hocNhieu.tongGiaTri).toBeCloseTo(0.8 + 0.8 + 0.7 + 0.4, 10)
  })

  it('câu KHÔNG thuộc dạng yếu không được nhân ×1,5 (dạng C không yếu)', () => {
    const kq = xepBuoiChua([vao('C1', 1, 1, 0.5), vao('C2', 2, 1, 0.5)], lop(6, THEO_CAU))
    expect(kq.hocNhieu.soDangYeu).toBe(0)
    expect(kq.hocNhieu.tongGiaTri).toBeCloseTo(1.0, 10)
  })

  it('TẦNG ưu tiên giữ nguyên: câu bắt buộc 0 sao (giá trị thấp) vẫn đứng TRƯỚC câu 2 sao giá trị cao', () => {
    const ds = [vao('A1', 1, 2, 0.9), vao('A2', 2, 2, 0.9), vao('B1', 3, 0, 0.1, { batBuoc: true })]
    const kq = xepBuoiChua(ds, lop(6, THEO_CAU))
    expect(thuTuChon(kq)[0]).toBe('B1')
    expect(kq.batBuocChuaChua).toEqual([])
  })

  it('MẬT ĐỘ theo giây: cùng giá trị, câu NGẮN đứng trước câu DÀI dù câu dài nằm trước trong đề', () => {
    const ngan = nd(20, false, 2)
    const dai = nd(160, false, 6)
    const tNgan = thoiGianCau({ phan: 'I', sao: 1, noiDung: ngan, tiLeLopSai: 0.5 }).tong
    const tDai = thoiGianCau({ phan: 'I', sao: 1, noiDung: dai, tiLeLopSai: 0.5 }).tong
    expect(tNgan).toBeLessThan(tDai) // điều kiện đầu của phép thử
    const ds = [vao('D', 1, 1, 0.5, { noiDung: dai }), vao('N', 2, 1, 0.5, { noiDung: ngan })]
    expect(thuTuChon(xepBuoiChua(ds, lop(6, {}).map((e) => ({ ...e, namKt: undefined }))))).toEqual(['N', 'D'])
  })

  it('MẤT MẶT một dạng lớp yếu (hết em để gọi): nói TÊN dạng chưa phủ trong cảnh báo và trong số đo, không lặng lẽ bỏ', () => {
    // 3 em ⇒ 3 lượt; 4 dạng lớp yếu ⇒ một dạng phải nằm ngoài
    const ds = ['A', 'B', 'C', 'D'].map((d, i) => vao(`${d}1`, i + 1, 1, 0.9 - i * 0.1))
    const theo = Object.fromEntries(['A', 'B', 'C', 'D'].map((d) => [`${d}1`, [d, YEU]])) as Record<string, [string, Dang | null]>
    const kq = xepBuoiChua(ds, lop(3, theo))
    expect(kq.soEmLenBang).toBe(3)
    expect(kq.hocNhieu.soDangYeu).toBe(4)
    expect(kq.hocNhieu.soDangYeuDaPhu).toBe(3)
    expect(kq.hocNhieu.dangYeuChuaPhu).toEqual(['D'])
    expect(kq.hocNhieu.soCauDoiBuoiSau).toBe(1)
    expect(kq.canhBao.some((c) => c.includes('1 dạng lớp yếu chưa có câu nào được chữa') && c.includes('D'))).toBe(true)
  })
})

describe('GHÉP ĐÔI THẬT — chi phí đúng theo cách tờ chiếu ghép', () => {
  const noiDung = nd(60, false, 3)
  const t = thoiGianCau({ phan: 'I', sao: 1, noiDung, tiLeLopSai: 0.5 })
  const dsEm = lop(6, {}).map((e) => ({ ...e, namKt: undefined }))
  const cap = (bac?: BacBoCuc) => [vao('X', 1, 1, 0.5, { noiDung, bacUoc: bac }), vao('Y', 2, 1, 0.5, { noiDung, bacUoc: bac })]

  it('hai câu bậc 1 CÙNG dài: tổng = 2 × T_chữa + (T_đọc + T_làm) — phần làm bài chung một lần', () => {
    const kq = xepBuoiChua(cap(1), dsEm)
    expect(kq.dong.map((d) => d.tang)).toEqual(['len_bang', 'len_bang'])
    expect(kq.tongGiay).toBe(2 * t.chua + (t.doc + t.lam))
    expect(kq.dong[0].giay + kq.dong[1].giay).toBe(kq.tongGiay) // tổng các dòng = đúng thứ đã cộng vào ngân sách
  })

  it('hai câu bậc ≥ 2 (đứng MỘT MÌNH, 2/3 bảng): mỗi câu mang TRỌN T — không còn ½ như M1', () => {
    const kq = xepBuoiChua(cap(2), dsEm)
    expect(kq.dong.map((d) => d.giay)).toEqual([t.tong, t.tong])
    expect(kq.tongGiay).toBe(2 * t.tong)
    const ghep = xepBuoiChua(cap(1), dsEm)
    expect(ghep.tongGiay).toBeLessThan(kq.tongGiay) // ghép đôi rẻ hơn đứng riêng đúng phần làm bài
  })

  it('MỘT câu bậc 1 lẻ (không bạn ghép) cũng mang TRỌN T; ba câu bậc 1 = một cặp + một lẻ', () => {
    expect(xepBuoiChua([vao('X', 1, 1, 0.5, { noiDung, bacUoc: 1 })], dsEm).tongGiay).toBe(t.tong)
    const ba = xepBuoiChua([...cap(1), vao('Z', 3, 1, 0.5, { noiDung, bacUoc: 1 })], dsEm)
    expect(ba.tongGiay).toBe(2 * t.chua + (t.doc + t.lam) + t.tong)
  })

  it('câu thiếu văn bản (300/180/120) không ghép, không nhận ½', () => {
    const kq = xepBuoiChua([vao('X', 1, 1, 0.5, { bacUoc: 1 }), vao('Y', 2, 1, 0.5, { bacUoc: 1 })], dsEm)
    expect(kq.dong.map((d) => d.giay)).toEqual([180, 180])
  })

  it('ghép hai câu dài LỆCH: cặp chỉ trả phần làm bài của câu dài hơn một lần (mỗi em ½ của max)', () => {
    const dai = nd(140, false, 5)
    const td = thoiGianCau({ phan: 'I', sao: 1, noiDung: dai, tiLeLopSai: 0.5 })
    const kq = xepBuoiChua([vao('N', 1, 1, 0.5, { noiDung, bacUoc: 1 }), vao('D', 2, 1, 0.5, { noiDung: dai, bacUoc: 1 })], dsEm)
    const maxL = Math.max(t.doc + t.lam, td.doc + td.lam)
    expect(kq.tongGiay).toBe(t.chua + td.chua + maxL)
  })

  it('KHÔNG BAO GIỜ vượt ngân sách và mỗi em/câu một lần, kể cả khi trộn mọi bậc bố cục', () => {
    const bacs: BacBoCuc[] = [1, 2, 3, 1, 5, 1, 4]
    const ds = Array.from({ length: 36 }, (_, i) => vao(`Q${i + 1}`, i + 1, (i % 3) as 0 | 1 | 2, 0.2 + (i % 6) * 0.13, { noiDung: nd(30 + (i % 7) * 25, i % 4 === 0, 1 + (i % 5)), bacUoc: bacs[i % bacs.length] }))
    const kq = xepBuoiChua(ds, lop(30, {}).map((e) => ({ ...e, namKt: undefined })))
    expect(kq.tongGiay).toBeLessThanOrEqual(nganSachGiay(CAU_HINH_LEN_BANG_MAC_DINH))
    expect(kq.dong.reduce((n, d) => n + d.giay, 0)).toBe(kq.tongGiay)
    const len = kq.dong.filter((d) => d.tang === 'len_bang')
    expect(new Set(len.map((d) => d.em!.sbd)).size).toBe(len.length)
    expect(new Set(len.map((d) => d.cau.id)).size).toBe(len.length)
  })
})

describe('SÀN 20 EM còn giữ được với đề thật sau khi đổi mô hình chi phí', () => {
  // Cùng kịch bản với `thoi-gian-len-bang-1909` ("SÀN 20 EM GIỮ ĐƯỢC…"): chưa biết bậc bố cục ⇒ coi như ghép đôi được.
  it('30 em, 24/30/40/50 câu (Phần I/II/III đủ loại): ≥ 20 em, đạt sàn, tổng ≤ ngân sách — không tụt so với bản M1', () => {
    const lop30 = lop(30, {}).map((e) => ({ ...e, namKt: undefined }))
    const mk = (i: number): CauVaoXep => {
      const sao = ([2, 1, 0] as const)[i % 3]
      const phan = (['I', 'I', 'I', 'II', 'III'] as const)[i % 5]
      const soTu = phan === 'I' ? 30 + (i % 4) * 12 : phan === 'II' ? 80 + (i % 3) * 25 : 45
      return { cau: cauChua(`Q${i + 1}`, i + 1, sao, phan), tiLeDung: 0.7 - (i % 5) * 0.1, soEmLam: 25, batBuoc: false, noiDung: nd(soTu, i % 6 === 0, 2 + (i % 4)) }
    }
    for (const n of [24, 30, 40, 50]) {
      const kq = xepBuoiChua(Array.from({ length: n }, (_, i) => mk(i)), lop30)
      expect(kq.soEmLenBang, `${n} câu`).toBeGreaterThanOrEqual(20)
      expect(kq.datSan, `${n} câu`).toBe(true)
      expect(kq.tongGiay, `${n} câu`).toBeLessThanOrEqual(nganSachGiay(CAU_HINH_LEN_BANG_MAC_DINH))
    }
  })

  it('câu bậc ≥ 2 nhiều thì SÀN có thể trượt — và buổi NÓI THẬT lý do ngân sách chứ không lặng lẽ tính ½ để đẹp số', () => {
    const ds = Array.from({ length: 30 }, (_, i) => vao(`Q${i + 1}`, i + 1, (i % 3) as 0 | 1 | 2, 0.4, { noiDung: nd(120, false, 5), bacUoc: 3 }))
    const kq = xepBuoiChua(ds, lop(30, {}).map((e) => ({ ...e, namKt: undefined })))
    expect(kq.tongGiay).toBeLessThanOrEqual(nganSachGiay(CAU_HINH_LEN_BANG_MAC_DINH))
    if (!kq.datSan) expect(kq.thieu?.viSao).toContain('hết ngân sách')
  })
})

describe('SỐ ĐO cho thầy + tất định', () => {
  const dsCau = [vao('A1', 1, 1, 0.8), vao('A2', 2, 1, 0.8), vao('A3', 3, 1, 0.7), vao('B1', 4, 1, 0.4), vao('C1', 5, 1, 0.3), vao('C2', 6, 1, 0.2), vao('C3', 7, 1, 0.1)]

  it('dòng tóm tắt ghép ĐÚNG các số đo (giá trị · dạng phủ · em · câu dời) và không có chữ "nắm chắc"', () => {
    const kq = xepBuoiChua(dsCau, lop(6, THEO_CAU))
    expect(kq.soEmLenBang).toBe(6)
    expect(kq.hocNhieu.soCauDoiBuoiSau).toBe(1)
    expect(kq.hocNhieu.tomTat).toBe(`giá trị chữa ${chuSoGiaTri(kq.hocNhieu.tongGiaTri)} · phủ 2/2 dạng lớp yếu · 6 em lên bảng · 1 câu dời buổi sau`)
    expect(kq.hocNhieu.tomTat).not.toMatch(/nắm chắc/i)
    // bản in cho thầy mang cùng dòng
    expect(bangChuBuoiChua(kq)).toContain(kq.hocNhieu.tomTat)
  })

  it('CÙNG đầu vào ⇒ CÙNG kết quả (tất định), kể cả khi thứ tự em đảo', () => {
    const a = xepBuoiChua(dsCau, lop(6, THEO_CAU))
    const b = xepBuoiChua(dsCau, lop(6, THEO_CAU))
    expect(JSON.stringify(b)).toBe(JSON.stringify(a))
    expect(thuTuChon(xepBuoiChua(dsCau, [...lop(6, THEO_CAU)].reverse()))).toEqual(thuTuChon(a))
  })
})

describe('khoá nguồn — hằng số một nguồn, số đo hiện trên màn', () => {
  const engine = readFileSync('src/lib/xep-buoi-chua.ts', 'utf8')
  const man = readFileSync('src/screens/GoiLenBangScreen.tsx', 'utf8')
  it('Engine E lấy hệ số và ngưỡng dạng yếu từ `HOC_NHIEU`, không số 0,5 / 3 rời trong logic dạng yếu', () => {
    expect(engine).toContain('HOC_NHIEU.HE_SO_DANG_YEU')
    expect(engine).toContain('HOC_NHIEU.DANG_YEU_LOP_TL_EM')
    expect(engine).toContain('HOC_NHIEU.DANG_YEU_LOP_TOI_THIEU_EM')
    expect(engine).toContain('emYeuDang(')
    expect(engine).toContain("from './ho-so-lop'")
  })
  it('màn Gọi lên bảng hiện "giá trị chữa" và "phủ a/b dạng lớp yếu" từ `hocNhieu`', () => {
    expect(man).toContain('data-mot="gia-tri-buoi"')
    expect(man).toContain('data-mot="dang-yeu-phu"')
    expect(man).toContain('kqBuoi.hocNhieu.soDangYeu > 0')
    expect(man).toContain('const kq = xepBuoiChua(cauVaoXep, hoSo)') // dòng gọi Engine E mà test cũ khoá — không đổi
  })
})
