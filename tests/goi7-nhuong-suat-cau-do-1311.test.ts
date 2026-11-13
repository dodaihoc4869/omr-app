// @vitest-environment node
// 13/11: soi ngày Sửa 11/11 — 5 em được giao 30 câu (câu dở của phiên chặng đầu + đề 28 lập lại không tính câu dở) ⇒ câu trả lời ngắn (xếp cuối) bị đẩy quá
// câu 28. Nay câu dở không có trong đề mới chiếm chỗ câu CÙNG Ô (rồi cùng phần) của đề mới ⇒ tổng vẫn 28, phần III giữ nguyên số suất.
import { describe, expect, it } from 'vitest'
import { nhuongSuatChoCauDo, deNhuongSuat7, NGAY_NHUONG_SUAT } from '../server/src/goi-bai-7-gop'
import { readFileSync } from 'node:fs'

const O: Record<string, string> = {}
const cau = (id: string, o: string) => { O[id] = o; return { qid: id } }
const oCua = (q: string) => O[q] ?? 'I|hieu'

describe('nhường suất cho câu dở', () => {
  // Đề mới 28 câu: 18 phần I · 4 phần II · 6 phần III (xếp phần I → III như O_28).
  const de = [
    ...Array.from({ length: 12 }, (_, i) => cau(`I-b${i}`, 'I|biet')), ...Array.from({ length: 4 }, (_, i) => cau(`I-h${i}`, 'I|hieu')), ...Array.from({ length: 2 }, (_, i) => cau(`I-v${i}`, 'I|van_dung')),
    ...Array.from({ length: 2 }, (_, i) => cau(`II-h${i}`, 'II|hieu')), ...Array.from({ length: 2 }, (_, i) => cau(`II-v${i}`, 'II|van_dung')),
    ...Array.from({ length: 3 }, (_, i) => cau(`III-h${i}`, 'III|hieu')), ...Array.from({ length: 3 }, (_, i) => cau(`III-v${i}`, 'III|van_dung')),
  ]
  it('mẫu 5 em 11/11: 2 câu dở (phần I, II) ngoài đề mới ⇒ đề bỏ 2 câu cùng ô cuối; 2 + 26 = 28 câu, vẫn 6 câu phần III', () => {
    const do_ = [cau('X-I', 'I|biet'), cau('X-II', 'II|hieu')]
    const moi = nhuongSuatChoCauDo(do_, de, oCua)
    expect(moi.length).toBe(26)
    const ngay = [...do_, ...moi]
    expect(ngay.length).toBe(28)
    expect(ngay.filter((x) => oCua(x.qid).startsWith('III')).length).toBe(6)
    expect(ngay.filter((x) => oCua(x.qid).startsWith('II|')).length).toBe(4)
    expect(moi.map((x) => x.qid)).not.toContain('I-b11') // câu cùng ô ưu tiên thấp nhất bị bỏ
    expect(moi.map((x) => x.qid)).not.toContain('II-h1')
  })
  it('câu dở đã có trong đề mới ⇒ không bỏ gì (khử trùng ở nơi ghép)', () => {
    expect(nhuongSuatChoCauDo([{ qid: 'I-b0' }, { qid: 'III-v2' }], de, oCua)).toEqual(de)
  })
  it('ô của câu dở không còn trong đề ⇒ lấy câu CÙNG PHẦN; không cùng phần ⇒ không bỏ (không lấn suất phần khác)', () => {
    const chiI = de.filter((x) => oCua(x.qid).startsWith('I|'))
    const moi = nhuongSuatChoCauDo([cau('Y', 'I|van_dung')], chiI.filter((x) => !x.qid.startsWith('I-v')), oCua)
    expect(moi.length).toBe(15)
    expect(nhuongSuatChoCauDo([cau('Z', 'III|hieu')], chiI, oCua)).toEqual(chiI)
  })
  it('không có câu dở ⇒ y nguyên; đầu vào không bị sửa', () => {
    const ban = [...de]
    expect(nhuongSuatChoCauDo([], de, oCua)).toEqual(de)
    nhuongSuatChoCauDo([cau('X', 'I|biet')], de, oCua)
    expect(de).toEqual(ban)
  })
  it('nối dây: cả gói cả ngày (xayGoiNgay7) lẫn lượt mở chặng đều nhường suất trước khi ghép đề 28', () => {
    const src = readFileSync('server/src/goi-bai-7.ts', 'utf8')
    expect(src.match(/deNhuongSuat7\(lap, cauGoi, viec, xepBai6\(lap\.plan\.viec/g)?.length).toBe(2)
  })
  it('áp từ đề NGÀY KẾ (14/11): trước mốc giữ nguyên đề; từ mốc nhường suất', () => {
    expect(NGAY_NHUONG_SUAT).toBe('2026-11-14')
    const lap = { hs: { meta: new Map(Object.entries(O).map(([k, o]) => [k, { phan: o.split('|')[0], mucDo: o.split('|')[1] === 'biet' ? 'NB' : o.split('|')[1] === 'van_dung' ? 'VD' : 'TH' }])) } }
    const do_ = [cau('X-I2', 'I|biet')]
    lap.hs.meta.set('X-I2', { phan: 'I', mucDo: 'NB' })
    const truoc = deNhuongSuat7(lap, new Map(), do_, de, Date.parse('2026-11-13T15:00:00Z')) // 22:00 VN 13/11
    expect(truoc).toEqual(de)
    const sau = deNhuongSuat7(lap, new Map(), do_, de, Date.parse('2026-11-13T17:30:00Z')) // 00:30 VN 14/11
    expect(sau.length).toBe(27)
  })
})
