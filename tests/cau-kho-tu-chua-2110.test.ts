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
