// RÀ SOÁT CHỈ ĐỌC "tờ chữa của chiến dịch" — phần THUẦN (`scripts/kiem-noi-dung-cau-lib.ts`, thầy 06/10). Khoá: chỉ ra SỐ ĐẾM (không mã chiến dịch / mã câu / chữ nào của đề),
// đếm câu khác khối theo MÃ CÂU đúng luật B (khác khối hoặc mã mâu thuẫn ⇒ khác; không đọc ra khối ⇒ giữ), đếm câu đổi được bằng ĐÚNG hàm `cauChoThay` của lệnh `noi-dung-cau`.
import { describe, expect, it } from 'vitest'
import { moiQid, tongHop, xepKhoiTheoMa, type DongCau } from '../scripts/kiem-noi-dung-cau-lib'

const mcq = (qid: string) => JSON.stringify({ qid, version: 'v', phan: 'I', text: 'ĐỀ-BÍ-MẬT', choices: ['a', 'b', 'c', 'd'], correct: 'A', solution: { chot: 'ĐÁP-ÁN-BÍ-MẬT' } })
const tf = (qid: string) => JSON.stringify({ qid, version: 'v', phan: 'II', text: 'x', ideas: ['a', 'b', 'c', 'd'], correct: 'DSDS' })
const hang = (...d: DongCau[]) => new Map(d.map((x) => [x.qid, x]))

describe('xepKhoiTheoMa — cùng luật B của cổng máy chủ, chỉ đọc mã câu', () => {
  it('đúng khối · khác khối · không đọc ra khối (giữ) · song sinh theo câu gốc', () => {
    expect(xepKhoiTheoMa('DH-11-C1-B1-I-1', 11)).toBe('dung')
    expect(xepKhoiTheoMa('DH-10-C1-B1-I-1', 11)).toBe('khac')
    expect(xepKhoiTheoMa('DH-12-C1-B1-I-1', 11)).toBe('khac')
    expect(xepKhoiTheoMa('LA-C1-B1-I-1', 11)).toBe('khong_ro')
    expect(xepKhoiTheoMa('DH-10-C1-B1-I-1~ss0', 11)).toBe('khac')
  })
})

describe('tongHop', () => {
  const chienDich = [
    { lop: '11 - Tinh Hoa', trang_thai: 'da_dong', qid_json: JSON.stringify(['DH-11-C1-B1-I-1', 'DH-10-C1-B1-I-2', 'LA-C1-B1-I-3', 'DH-11-C1-B1-II-1']) },
    { lop: '11', trang_thai: 'dang_chay', qid_json: JSON.stringify(['DH-11-C1-B1-I-1', 'DH-11-C1-B1-I-9']) },
    { lop: '12A1', trang_thai: 'dang_chay', qid_json: JSON.stringify(['DH-12-C2-B1-I-1']) },
    { lop: 'Lớp lạ', trang_thai: 'dang_chay', qid_json: JSON.stringify(['DH-10-C1-B1-I-2']) },
    { lop: '10', trang_thai: 'da_dong', qid_json: 'không phải JSON' },
  ]
  const dong = hang(
    { qid: 'DH-11-C1-B1-I-1', json: mcq('DH-11-C1-B1-I-1'), chuyen_de: 'Este' },
    { qid: 'DH-10-C1-B1-I-2', json: mcq('DH-10-C1-B1-I-2'), chuyen_de: '' },
    { qid: 'DH-11-C1-B1-II-1', json: tf('DH-11-C1-B1-II-1'), chuyen_de: 'Este' },
    { qid: 'DH-12-C2-B1-I-1', json: '{hỏng' },
    { qid: 'DH-11-C1-B1-I-9', json: JSON.stringify({ qid: 'DH-11-C1-B1-I-9', version: 'v', phan: 'III', text: 'Giải thích vì sao', correct: 'dài dòng nhiều chữ không phải số', tuLuan: true }), chuyen_de: 'Este' },
  )
  const r = tongHop(chienDich, dong)

  it('số chiến dịch theo trạng thái và theo khối lớp; câu khác khối đếm theo mã', () => {
    expect(r.soChienDich).toBe(5)
    expect(r.theoTrangThai).toEqual({ da_dong: 2, dang_chay: 3 })
    expect(r.theoKhoi['11']).toEqual({ chienDich: 2, tongQid: 6, khacKhoiTheoMa: 1, khongRoKhoiTheoMa: 1, chienDichCoCauKhacKhoi: 1 })
    expect(r.theoKhoi['12']).toEqual({ chienDich: 1, tongQid: 1, khacKhoiTheoMa: 0, khongRoKhoiTheoMa: 0, chienDichCoCauKhacKhoi: 0 })
    expect(r.theoKhoi['10']).toEqual({ chienDich: 1, tongQid: 0, khacKhoiTheoMa: 0, khongRoKhoiTheoMa: 0, chienDichCoCauKhacKhoi: 0 }) // qid_json hỏng ⇒ 0 câu, không ném lỗi
    expect(r.theoKhoi.khong_ro).toEqual({ chienDich: 1, tongQid: 1, khacKhoiTheoMa: 0, khongRoKhoiTheoMa: 0, chienDichCoCauKhacKhoi: 0 }) // lớp không đọc ra khối: không xét khối
  })
  it('đếm câu thật: có hàng · không có hàng · tự luận · hỏng · đổi được · đổi được kèm chuyên đề', () => {
    expect(moiQid(chienDich).sort()).toEqual(['DH-10-C1-B1-I-2', 'DH-11-C1-B1-I-1', 'DH-11-C1-B1-I-9', 'DH-11-C1-B1-II-1', 'DH-12-C2-B1-I-1', 'LA-C1-B1-I-3'])
    expect(r.noiDung).toEqual({ qidKhacNhau: 6, coHang: 5, khongCoHang: 1, tuLuan: 1, hong: 1, chuyenDuoc: 3, chuyenDuocCoChuyenDe: 2 })
  })
  it('KHÔNG lộ mã câu / mã chiến dịch / chữ của đề hay đáp án trong kết quả (repo công khai)', () => {
    const chu = JSON.stringify(r)
    for (const x of ['DH-', 'LA-', 'ĐỀ-BÍ-MẬT', 'ĐÁP-ÁN-BÍ-MẬT', 'Tinh Hoa', 'Este']) expect(chu.includes(x), x).toBe(false)
  })
  it('không chiến dịch nào ⇒ mọi số đếm bằng 0', () => {
    const z = tongHop([], new Map())
    expect(z.soChienDich).toBe(0)
    expect(z.noiDung).toEqual({ qidKhacNhau: 0, coHang: 0, khongCoHang: 0, tuLuan: 0, hong: 0, chuyenDuoc: 0, chuyenDuocCoChuyenDe: 0 })
  })
})
