// XẾP BUỔI CHỮA THEO LUẬT MỚI (`src/lib/xep-buoi-chua-moi.ts`) — thay Engine E (thầy chốt 25/09).
//
// Bốn điều phải luôn đúng:
//   1. ÁNH XẠ: `CauVaoXep` (nguồn ca) → `CauVaoRui`: `soEmSai`/`soEmDung` suy từ `tiLeDung`; `loi` ← `batBuoc`.
//   2. THỨ TỰ "SAI NHIỀU" (KHÔNG theo sao): câu 0 sao mà nhiều em sai đứng TRƯỚC câu 2 sao ít em sai.
//   3. NGÂN SÁCH + SÀN 80 %: câu vượt ngân sách dồn về "chỉ đọc đáp án"; câu cả lớp sai chưa chữa kịp thì BÁO.
//   4. GÁN EM: mọi em CÓ MẶT ≥ 1 lượt, lượt thêm CÂN BẰNG; em VẮNG không được gọi; gọi 2 lần ra ĐÚNG một bảng.
import { describe, expect, it } from 'vitest'
import { cauRuiTuCauVaoXep, xepBuoiChuaMoi } from '../src/lib/xep-buoi-chua-moi'
import { BTVN_RONG, type HoSoEmDayDu } from '../src/lib/ho-so-lop'
import { CAU_HINH_LEN_BANG_MAC_DINH } from '../src/lib/len-bang-cau-hinh'
import type { CauVaoXep } from '../src/lib/xep-buoi-chua'

/** Một câu của ca: `tiLeDung` = tỉ lệ em làm ĐÚNG; `soEmLam` = số em làm. */
function cau(id: string, sao: 0 | 1 | 2, tiLeDung: number, soEmLam = 20, batBuoc = false): CauVaoXep {
  return {
    cau: { id, phan: 'I', so: Number(id.replace(/\D/g, '')) || 1, chuyenDe: 'Ester', mucDo: 'hieu', tomTat: '', viTri: 1, sao, lyDoSao: '' },
    tiLeDung,
    soEmLam,
    batBuoc,
  }
}

function em(i: number, coMat = true): HoSoEmDayDu {
  return {
    sbd: `120${String(i).padStart(2, '0')}`,
    hoTen: `Em ${i}`,
    coMat,
    chuyenDe: [],
    cauSai: [],
    daLam: new Map(),
    lenBang: { soLan: 0, lanCuoi: '', qids: [] },
    btvn: { ...BTVN_RONG, theoCau: new Map() },
  }
}
const LOP = (n: number) => Array.from({ length: n }, (_, i) => em(i + 1))

describe('ánh xạ câu ca → đầu vào luật mới', () => {
  it('soEmSai/soEmDung suy từ tiLeDung; câu bắt buộc đóng vai "cốt tủy"', () => {
    const r = cauRuiTuCauVaoXep(cau('Q1', 2, 0.45, 20, true))
    expect(r.soEmLam).toBe(20)
    expect(r.soEmDung).toBe(9)
    expect(r.soEmSai).toBe(11)
    expect(r.loi).toBe(true)
    expect(r.sao).toBe(2)
  })

  it('thiếu dữ liệu lớp (tiLeDung null) ⇒ không em nào sai, không bịa', () => {
    const r = cauRuiTuCauVaoXep({ ...cau('Q2', 0, 0.5, 0), tiLeDung: null })
    expect(r.soEmLam).toBe(0)
    expect(r.soEmSai).toBe(0)
  })
})

describe('thứ tự chọn câu theo LUẬT MỚI (sai nhiều, KHÔNG theo sao)', () => {
  it('câu 0 sao nhiều em sai đứng TRƯỚC câu 2 sao ít em sai', () => {
    // tiLeDung 0,5 ⇒ 10 em sai; tiLeDung 0,9 ⇒ 2 em sai.
    const kq = xepBuoiChuaMoi([cau('SAO2', 2, 0.9), cau('SAI10', 0, 0.5)], LOP(5))
    const lenBang = kq.dong.filter((d) => d.tang === 'len_bang').map((d) => d.cau.id)
    expect(lenBang[0]).toBe('SAI10') // Engine E cũ sẽ đưa SAO2 lên trước — luật mới thì ngược lại.
    expect(lenBang[1]).toBe('SAO2')
  })
})

describe('ngân sách + sàn 80 %', () => {
  it('câu vượt ngân sách dồn về "chỉ đọc đáp án"; còn lại là "bỏ qua"', () => {
    // Ngân sách 16 phút = 960 − 480 hao phí = 480 giây ⇒ đúng 4 câu 0 sao (120 giây) vào nhóm CHỮA.
    const ch = { ...CAU_HINH_LEN_BANG_MAC_DINH, NGAN_SACH_PHUT: 16 }
    const ds = ['a', 'b', 'c', 'd', 'e', 'f'].map((x, i) => cau(`Q${i}`, 0, 0.5))
    const kq = xepBuoiChuaMoi(ds, LOP(5), ch)
    expect(kq.dong.filter((d) => d.tang === 'len_bang').length).toBe(4)
    expect(kq.cauDocDapAn.length).toBe(1) // lọc ra = 5 (≤ 4/0,8) ⇒ 1 câu chỉ đọc đáp án
    expect(kq.datSan).toBe(true)
    expect(kq.thieu).toBeNull()
  })

  it('ngân sách quá hẹp (không câu nào vừa) ⇒ CHƯA đạt sàn + nói thiếu vì đâu', () => {
    const ch = { ...CAU_HINH_LEN_BANG_MAC_DINH, NGAN_SACH_PHUT: 8 } // 480 − 480 = 0 giây
    const kq = xepBuoiChuaMoi([cau('Q1', 2, 0.5)], LOP(5), ch)
    expect(kq.dong.filter((d) => d.tang === 'len_bang').length).toBe(0)
    expect(kq.datSan).toBe(false)
    expect(kq.thieu).not.toBeNull()
  })

  it('câu CẢ LỚP SAI không chữa kịp ⇒ BÁO cần thêm phút (không im lặng bỏ)', () => {
    const ch = { ...CAU_HINH_LEN_BANG_MAC_DINH, NGAN_SACH_PHUT: 16 }
    const ds = Array.from({ length: 10 }, (_, i) => cau(`Q${i}`, 0, 0.2)) // mọi câu đều 16 em sai
    const kq = xepBuoiChuaMoi(ds, LOP(5), ch)
    expect(kq.canhBao.join(' ')).toMatch(/câu cả lớp SAI chưa chữa được/)
    expect(kq.canhBao.join(' ')).toMatch(/cần thêm \d+ phút/)
  })
})

describe('gán em: mọi em ≥ 1 lượt, lượt thêm cân bằng, tất định', () => {
  it('5 em / 10 câu: mọi em có lượt, phát ĐỀU (mỗi em 2 lượt)', () => {
    const ds = Array.from({ length: 10 }, (_, i) => cau(`Q${i}`, 0, 0.5))
    const kq = xepBuoiChuaMoi(ds, LOP(5))
    const dem = new Map<string, number>()
    for (const d of kq.dong) if (d.tang === 'len_bang' && d.em) dem.set(d.em.sbd, (dem.get(d.em.sbd) ?? 0) + 1)
    expect(dem.size).toBe(5)
    expect([...dem.values()].every((n) => n === 2)).toBe(true)
    expect(kq.soEmLenBang).toBe(5)
    expect(kq.soEmToiThieu).toBe(5)
  })

  it('em VẮNG không được gọi lượt nào', () => {
    const kq = xepBuoiChuaMoi([cau('Q1', 0, 0.5), cau('Q2', 0, 0.5)], [em(1), em(2, false), em(3)])
    const duoc = new Set(kq.dong.filter((d) => d.tang === 'len_bang' && d.em).map((d) => d.em!.sbd))
    expect(duoc.has('12002')).toBe(false)
  })

  it('gọi hai lần ra ĐÚNG một bảng', () => {
    const ds = Array.from({ length: 8 }, (_, i) => cau(`Q${i}`, i % 3, 0.6))
    const a = xepBuoiChuaMoi(ds, LOP(6))
    const b = xepBuoiChuaMoi(ds, LOP(6))
    const chu = (k: typeof a) => k.dong.map((d) => `${d.tang}:${d.cau.id}:${d.em?.sbd ?? '-'}`).join('|')
    expect(chu(b)).toBe(chu(a))
  })

  it('giữ NGUYÊN câu gốc (CauChua) trong `dong` để tờ chiếu / lưu buổi dùng lại', () => {
    const kq = xepBuoiChuaMoi([cau('Q7', 1, 0.5)], LOP(3))
    const d0 = kq.dong.find((d) => d.tang === 'len_bang')!
    expect(d0.cau.id).toBe('Q7')
    expect(d0.cau.phan).toBe('I')
    expect(d0.em?.hoTen).toBeTruthy()
  })
})
