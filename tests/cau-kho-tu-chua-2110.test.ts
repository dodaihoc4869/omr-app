// CÂU KHÓ ở "Chữa câu khó & tính toán" (thầy chốt 21/10): Vận dụng (kho gộp VDC vào van_dung) HOẶC 2 sao cần chữa — đọc qua đúng đường nạp kho.
import { expect, it } from 'vitest'
import { chuanHoaMucDo, parseCanChua } from '../src/lib/exam-kho-de-import'
import { demTuChua, laCauKho, laCauKhoHoacTinh, xepThuTuChua, type CauTuChua } from '../src/lib/thay-tu-chua'

/** Câu như sau khi nạp kho: `muc_do` → `mucDo` qua chuanHoaMucDo, `can_chua` → `canChua` qua parseCanChua. */
const quaKho = (muc_do: unknown, can_chua?: unknown) => ({ mucDo: chuanHoaMucDo(muc_do), canChua: parseCanChua(can_chua) })
const sao = (n: 0 | 1 | 2) => ({ sao: n, dk: ['buoc'], ly_do: 'x', bay: null })

it('Vận dụng và VDC (mọi cách ghi trong kho) là câu khó; Nhận biết / Thông hiểu / thiếu mức độ thì không', () => {
  for (const m of ['van_dung', 'VD', 'VDC', 'Vận dụng', 'vận dụng cao']) expect(laCauKho(quaKho(m)), m).toBe(true)
  for (const m of ['biet', 'hieu', 'NB', 'TH', undefined, 'lạ']) expect(laCauKho(quaKho(m)), String(m)).toBe(false)
})

it('2 sao cần chữa là câu khó (đọc canChua.sao, không phải q.sao); 1 sao / 0 sao / không gắn sao thì không', () => {
  expect(laCauKho(quaKho('hieu', sao(2)))).toBe(true)
  expect(laCauKho(quaKho('hieu', sao(1)))).toBe(false)
  expect(laCauKho(quaKho('biet', sao(0)))).toBe(false)
  // dữ liệu đặt nhầm `sao` ở ngọn câu (hình dạng test cũ) KHÔNG được tính — kho thật không có trường này
  expect(laCauKho({ mucDo: 'hieu', sao: 2 } as never)).toBe(false)
  expect(laCauKho(null)).toBe(false)
})

it('xếp: câu khó vào nhóm ưu tiên đầu tờ cùng câu tính toán; công tắc lọc chỉ giữ câu khó hoặc tính toán; đếm câu khó', () => {
  const c = (i: number, x: Partial<CauTuChua>): CauTuChua => ({ khoa: `k${i}`, qid: `q${i}`, phan: 'I', so: i, maDe: 'D', thuTuDe: i, q: {} as CauTuChua['q'], tinhToan: false, kho: false, tuLuan: false, thieuNoiDung: false, ...x })
  const ds = [c(0, {}), c(1, { kho: true }), c(2, {}), c(3, { tinhToan: true }), c(4, { kho: laCauKho(quaKho('hieu', sao(2))) })]
  const xep = xepThuTuChua(ds, null, 'buoi')
  expect(new Set(xep.slice(0, 3).map((x) => x.qid))).toEqual(new Set(['q1', 'q3', 'q4']))
  expect(xep.slice(3).map((x) => x.qid)).toEqual(['q0', 'q2'])
  expect(ds.filter(laCauKhoHoacTinh).map((x) => x.qid)).toEqual(['q1', 'q3', 'q4'])
  expect(demTuChua(ds).kho).toBe(2)
})

it('22/10 (thầy báo đề Trả lời ngắn 40/40): câu ĐẾM lý thuyết Phần III không là "có tính toán"; câu Phần III có phép tính vẫn là', async () => {
  const { laCauTinhToan } = await import('../src/lib/thay-tu-chua')
  const III = (text: string) => laCauTinhToan({ phan: 'III', text })
  for (const t of ['Cho các phát biểu sau về ester. Có bao nhiêu phát biểu đúng?', 'Số đồng phân cấu tạo ứng với công thức C4H10O là bao nhiêu?', 'Trong các chất sau, có bao nhiêu chất làm mất màu nước bromine?', 'Thực hiện các thí nghiệm sau. Số thí nghiệm xảy ra phản ứng là'])
    expect(III(t), t).toBe(false)
  for (const t of ['Tổng hợp ammonia với hiệu suất 25%. Cần bao nhiêu lít N2 (đkc) để thu được 6,8 gam ammonia?', 'Cần bao nhiêu gam NaOH để trung hoà 0,2 mol HCl?', 'Tính pH của dung dịch HCl 0,01 M.', 'Đốt cháy hoàn toàn m gam ester X thu được 0,3 mol CO2. Giá trị của m là', 'Có bao nhiêu phát biểu đúng? (a) 0,1 mol glucose tạo 0,2 mol Ag.'])
    expect(III(t), t).toBe(true)
  // tự luận Phần III vẫn xét theo nội dung như cũ
  expect(laCauTinhToan({ phan: 'III', text: 'Giải thích vì sao ammonia tan nhiều trong nước.' }, true)).toBe(false)
})
