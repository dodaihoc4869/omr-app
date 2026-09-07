// BỘ CÂU KHẮC PHỤC TRONG BÁO CÁO CỦA EM — phía máy em (thầy chốt 06/09).
//
// Máy chủ rút câu từ kho đề; phần này kiểm cái máy em làm với gói đó:
// dùng đúng câu của kho, bỏ hẳn câu vừa làm trong ca, và MẤT MẠNG thì vẫn còn
// bộ dự phòng lấy từ ngân hàng của chính ca chứ không ra màn trắng.
import { describe, expect, it } from 'vitest'
import type { TeacherExamSource } from '../src/data/examContent'
import type { ChiTietCauRow } from '../src/lib/exam-api'
import { SO_CAU_BAI_TAP_KEM, chuyenDeXinKho, dungPhieuMayEm, xepChuyenDeYeu } from '../src/lib/phieu-du-lieu'

const ESTER = 'Ester – lipid'
const CARB = 'Carbohydrate'

function cauI(maDe: string, so: number, chuyenDe: string) {
  return {
    id: `${maDe}-I-${so}`,
    text: `Câu ${so} của ${chuyenDe}`,
    choices: ['a', 'b', 'c', 'd'] as [string, string, string, string],
    correct: 'A' as const,
    chuyenDe,
    mucDo: 'hieu',
    loiGiai: { chot: 'Chốt thử.' },
  }
}

function nguon(maDe: string, so: number[], chuyenDe: string): TeacherExamSource {
  return { maDe, phanI: so.map((s) => cauI(maDe, s, chuyenDe)), phanII: [], phanIII: [] }
}

function hang(qid: string, chuyenDe: string, dung: boolean): ChiTietCauRow {
  return { phan: 'I', soCau: 1, qid, chuyenDe, mucDo: 'hieu', dapAnChon: 'A', dapAnDung: dung ? 'A' : 'B', dungSai: dung, giay: null }
}

const CA = nguon('CA-DE', [1, 2, 3], ESTER)
const ROWS: ChiTietCauRow[] = [hang('CA-DE-I-1', ESTER, false), hang('CA-DE-I-2', ESTER, false), hang('CA-DE-I-3', CARB, true)]

function dung(khoKhacPhuc?: TeacherExamSource[], thuTuKhacPhuc?: string[]) {
  return dungPhieuMayEm({
    hoTen: 'Em Thử',
    sbd: '100001',
    maCa: 'CA1',
    nopLuc: '2026-09-06T02:00:00Z',
    diem: 5,
    rows: ROWS,
    banks: [CA],
    ...(khoKhacPhuc ? { khoKhacPhuc } : {}),
    ...(thuTuKhacPhuc ? { thuTuKhacPhuc } : {}),
  })
}

describe('Xếp hạng chuyên đề yếu — một nơi tính, hai nơi dùng', () => {
  it('chỉ lấy chuyên đề CÓ CÂU SAI, sai nhiều đứng trước', () => {
    const rows = [hang('q1', ESTER, false), hang('q2', ESTER, true), hang('q3', CARB, false), hang('q4', 'Polymer', true)]
    expect(xepChuyenDeYeu(rows).map((x) => x.ten)).toEqual([CARB, ESTER])
  })

  it('làm đúng hết thì KHÔNG có chuyên đề yếu nào', () => {
    expect(xepChuyenDeYeu([hang('q1', ESTER, true)])).toEqual([])
  })

  it('câu không ghi chuyên đề thì bỏ qua, không dựng chuyên đề rỗng', () => {
    expect(xepChuyenDeYeu([hang('q1', '', false)])).toEqual([])
  })
})

describe('Bộ câu khắc phục lấy từ kho đề', () => {
  it('CÓ KHO thì dùng câu của kho, KHÔNG trộn câu của ca vào', () => {
    const kho = [nguon('KHO-A', [10, 11], ESTER), nguon('KHO-B', [10], ESTER)]
    const p = dung(kho)
    expect(p.baiTap?.map((c) => c.id)).toEqual(['KHO-A-I-10', 'KHO-A-I-11', 'KHO-B-I-10'])
  })

  it('BỎ HẲN câu em vừa làm trong ca, kể cả khi máy chủ lỡ gửi lại', () => {
    // Kho trả về nhầm một câu em vừa làm — máy em vẫn phải loại.
    //
    // Kho trong bộ thử này CHƯA GÁN MÃ DẠNG nào, tức cổng `rutDeChua` chưa vận
    // hành được, nên luật "đưa lại câu sai cho em làm lại" (thầy chốt 07/09)
    // không chạy ở đây và câu của ca vẫn bị loại sạch. Luật ấy đo ở
    // `rut-chua-v4.test.ts`, nơi kho có mã đúng như kho thật.
    const kho = [{ ...nguon('KHO-A', [10], ESTER), phanI: [cauI('KHO-A', 10, ESTER), cauI('CA-DE', 1, ESTER)] }]
    const ids = dung(kho).baiTap?.map((c) => c.id) ?? []
    expect(ids).toContain('KHO-A-I-10')
    expect(ids).not.toContain('CA-DE-I-1')
  })

  it('TRẦN 60 CÂU ở máy em, dù kho gửi nhiều hơn', () => {
    const nhieu = Array.from({ length: 80 }, (_, i) => i + 1)
    const p = dung([nguon('KHO-A', nhieu, ESTER)])
    expect(p.baiTap).toHaveLength(SO_CAU_BAI_TAP_KEM)
    expect(SO_CAU_BAI_TAP_KEM).toBe(60)
  })

  it('KHÔNG CÓ KHO (mất mạng) thì rơi về ngân hàng của ca, không ra màn trắng', () => {
    const p = dung()
    expect(p.baiTap?.length).toBeGreaterThan(0)
    expect(p.baiTap?.every((c) => c.id.startsWith('CA-DE-'))).toBe(true)
  })

  it('kho trả về RỖNG cũng rơi về ngân hàng của ca', () => {
    expect(dung([]).baiTap?.length).toBeGreaterThan(0)
  })

  it('XẾP LẠI theo thứ tự máy chủ gửi kèm (dễ lên khó), không theo thứ tự gói', () => {
    const kho = [nguon('KHO-A', [10, 11], ESTER), nguon('KHO-B', [10], ESTER)]
    const p = dung(kho, ['KHO-B-I-10', 'KHO-A-I-11', 'KHO-A-I-10'])
    expect(p.baiTap?.map((c) => c.id)).toEqual(['KHO-B-I-10', 'KHO-A-I-11', 'KHO-A-I-10'])
  })

  it('câu KHÔNG có trong danh sách thứ tự xuống cuối, KHÔNG bị vứt', () => {
    const kho = [nguon('KHO-A', [10, 11], ESTER)]
    const p = dung(kho, ['KHO-A-I-11'])
    expect(p.baiTap?.map((c) => c.id)).toEqual(['KHO-A-I-11', 'KHO-A-I-10'])
  })
})

describe('Chuyên đề gửi lên máy chủ', () => {
  it('chuyên đề MẤT ĐIỂM đứng trước, chuyên đề còn lại của ca nối vào sau', () => {
    // Không nối thì bài chỉ sai một chuyên đề sẽ không đủ 60 câu ngoài những
    // câu em vừa làm — đúng cảnh thanh kéo dừng ở 36.
    const rows = [hang('q1', ESTER, false), hang('q2', CARB, true), hang('q3', 'Polymer', true)]
    expect(chuyenDeXinKho(rows)).toEqual([ESTER, CARB, 'Polymer'])
  })

  it('không có chuyên đề nào bị sai thì vẫn gửi chuyên đề của ca', () => {
    const rows = [hang('q1', ESTER, true), hang('q2', CARB, true)]
    expect(chuyenDeXinKho(rows)).toEqual([ESTER, CARB])
  })

  it('không trùng tên chuyên đề, và bỏ câu không ghi chuyên đề', () => {
    const rows = [hang('q1', ESTER, false), hang('q2', ESTER, true), hang('q3', '', false)]
    expect(chuyenDeXinKho(rows)).toEqual([ESTER])
  })

  it('bộ dự phòng vẫn xếp chuyên đề em mất điểm lên trước', () => {
    const rows = [hang('CA-DE-I-1', CARB, false), hang('CA-DE-I-2', ESTER, true), hang('CA-DE-I-3', ESTER, true)]
    const ca: TeacherExamSource = {
      maDe: 'CA-DE',
      phanI: [cauI('CA-DE', 1, CARB), cauI('CA-DE', 2, ESTER), cauI('CA-DE', 3, ESTER)],
      phanII: [],
      phanIII: [],
    }
    const p = dungPhieuMayEm({ hoTen: 'x', sbd: '1', maCa: 'CA1', nopLuc: '2026-09-06T02:00:00Z', diem: 5, rows, banks: [ca] })
    expect(p.baiTap?.[0].chuyenDe).toBe(CARB)
  })
})
