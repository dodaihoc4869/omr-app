// @vitest-environment node
// 5 THƯỚC ĐO CHẤT LƯỢNG SỬA LỖI THEO LỚP (thầy 05/10, server/src/chat-luong-loi.ts): hàm thuần trên dữ liệu dựng tay — số đúng TÍNH TAY trong
// chú thích — + lệnh `/gv/chat-luong-loi` chạy qua Worker thật trên D1 thật (node:sqlite, lược đồ + migration thật), chỉ thầy, CHỈ ĐỌC.
import { afterEach, describe, expect, it, vi } from 'vitest'
import worker from '../server/src/index'
import { goiWorker, taoD1That } from './_d1-that'
import type { Env } from '../server/src/kieu'
import { cauHopKhoi } from '../src/lib/khoi-cau'
import { N_TOI_THIEU, chuanSoNgay, gocCua, tinhChatLuongLoi, trungVi, type DongSoCl } from '../server/src/chat-luong-loi'

let soKhoa = 0
/** Một dòng sổ: `gio` 1..9 là giờ UTC (cùng ngày VN với `ngay`). Mặc định: game, tự làm (assistance 'none'). */
const d = (sbd: string, qid: string, ngay: string, gio: number, ketQua: 0 | 1 | null, o: Partial<DongSoCl> = {}): DongSoCl => ({
  khoa: `k${String(++soKhoa).padStart(4, '0')}`, sbd, qid, nguon: 'game', ketQua, luc: `${ngay}T0${gio}:00:00.000Z`, ngayVn: ngay, assistance: 'none', purpose: null, ...o,
})

describe('hàm phụ', () => {
  it('câu gốc: bỏ #n (lượt lặp game), ~ssN với N bất kỳ (trần 4 bản) ⇒ câu gốc; cửa sổ lạ ⇒ 14 ngày; trung vị', () => {
    expect(gocCua('Q1~ss3#2')).toEqual({ goc: 'Q1', songSinh: true })
    expect(gocCua('Q1#4')).toEqual({ goc: 'Q1', songSinh: false })
    expect(gocCua('DH-12-C1-B1-I-4~ss0')).toEqual({ goc: 'DH-12-C1-B1-I-4', songSinh: true })
    expect([chuanSoNgay(undefined), chuanSoNgay('x'), chuanSoNgay(0), chuanSoNgay(7), chuanSoNgay(90), chuanSoNgay(91), chuanSoNgay(3.5)]).toEqual([14, 14, 14, 7, 90, 14, 14])
    expect([trungVi([]), trungVi([5]), trungVi([1, 3, 10]), trungVi([3, 10, 3, 5])]).toEqual([null, 5, 3, 4])
  })
})

describe('1 · làm lại câu đã sai: đúng ngay lượt làm lại đầu tiên', () => {
  it('định nghĩa lượt tự làm (hỗ trợ, đọc lời giải 12 giờ, lướt, bỏ trống) + song sinh ~ssN và câu thay thế tc = q tính là làm lại q', () => {
    const dong = [
      // Em A · Q1: sai 08/10; đúng CÙNG ngày (không phải lượt làm lại); 09/10 01:00 có hỗ trợ (bỏ); 09/10 05:00 — 1 giờ sau khi đọc lời giải
      // (loi_giai_hoi 04:00) ⇒ bỏ; 10/10 đúng ⇒ lượt làm lại #1 ĐÚNG.
      d('A', 'Q1', '2026-10-08', 1, 0), d('A', 'Q1', '2026-10-08', 2, 1),
      d('A', 'Q1', '2026-10-09', 1, 1, { assistance: 'assisted' }), d('A', 'Q1', '2026-10-09', 5, 1),
      d('A', 'Q1', '2026-10-10', 1, 1),
      // Em A · Q2: sai 08/10; 09/10 song sinh Q2~ss3 SAI ⇒ #2 sai (chờ lượt làm lại mới); 10/10 câu thay thế S9 (raw_json.tc = Q2) ĐÚNG ⇒ #3 đúng.
      d('A', 'Q2', '2026-10-08', 1, 0), d('A', 'Q2~ss3', '2026-10-09', 1, 0), d('A', 'S9', '2026-10-10', 1, 1, { tc: 'Q2' }),
      // Em B · Q3: lướt (không phải lượt) rồi sai 08/10; 09/10 dòng đọc lời giải 01:00 ⇒ lượt 02:00 bỏ; 10/10 đúng ⇒ #4 đúng.
      d('B', 'Q3', '2026-10-08', 1, null, { purpose: 'luot' }), d('B', 'Q3', '2026-10-08', 2, 0),
      d('B', 'Q3', '2026-10-09', 1, 0, { purpose: 'xem_loi_giai', assistance: 'assisted' }), d('B', 'Q3', '2026-10-09', 2, 1),
      d('B', 'Q3', '2026-10-10', 1, 1),
      // Em B · Q4: sai và làm lại TRƯỚC cửa sổ (01/10 → 02/10) ⇒ không tính.
      d('B', 'Q4', '2026-10-01', 1, 0), d('B', 'Q4', '2026-10-02', 1, 1),
      // Em B · Q5: bỏ trống ở ca thi = SAI; bỏ trống ở kênh khác = chưa làm (không phải lượt); 13/10 đúng ⇒ #5 đúng.
      d('B', 'Q5', '2026-10-11', 1, null, { nguon: 'thi' }), d('B', 'Q5', '2026-10-12', 1, null), d('B', 'Q5', '2026-10-13', 1, 1),
    ]
    const kq = tinhChatLuongLoi({ dong, homNay: '2026-10-20', docLoiGiai: new Map([['A|Q1', ['2026-10-09T04:00:00.000Z']]]) })
    expect([kq.tuNgay, kq.denNgay, kq.soNgay, kq.nToiThieu]).toEqual(['2026-10-07', '2026-10-20', 14, 10])
    // #1 đúng · #2 sai · #3 đúng · #4 đúng · #5 đúng ⇒ 4/5; n = 5 < 10 ⇒ chưa đủ dữ liệu.
    expect(kq.lamLaiDau).toEqual({ tiLe: 0.8, dat: 4, n: 5, du: false })
    expect(kq.soEmCoLuot).toBe(2)
  })

  it('n nhỏ ⇒ chưa đủ dữ liệu; đủ 10 mẫu ⇒ đủ; sổ rỗng ⇒ mọi số null, n = 0', () => {
    const mau = (soEm: number) => Array.from({ length: soEm }, (_, i) => [d(`E${i}`, 'Q', '2026-10-08', 1, 0), d(`E${i}`, 'Q', '2026-10-09', 1, i % 2 ? 1 : 0)]).flat()
    expect(tinhChatLuongLoi({ dong: mau(9), homNay: '2026-10-20' }).lamLaiDau).toEqual({ tiLe: 4 / 9, dat: 4, n: 9, du: false })
    expect(N_TOI_THIEU).toBe(10)
    expect(tinhChatLuongLoi({ dong: mau(10), homNay: '2026-10-20' }).lamLaiDau).toEqual({ tiLe: 0.5, dat: 5, n: 10, du: true })
    const rong = tinhChatLuongLoi({ dong: [], homNay: '2026-10-20' })
    expect(rong).toMatchObject({
      lamLaiDau: { tiLe: null, n: 0, du: false }, ngayToiDong: { trungVi: null, n: 0, du: false }, cauLaCungDang: { tiLe: null, n: 0 }, lapNguyenVan: { tiLe: null, n: 0 },
      boKhacKhoi: 0, soEmCoLuot: 0,
    })
    expect(rong.saiLaiDuyTri).toEqual([{ moc: 14, tiLe: null, dat: 0, n: 0, du: false }, { moc: 30, tiLe: null, dat: 0, n: 0, du: false }])
  })
})

describe('2 · sai lại ở mốc kiểm duy trì · 3 · trung vị số ngày tới khi đóng lỗi', () => {
  it('trung vị số ngày từ lần sai cuối tới ngày đóng (phatLaiLoi: 2 ngày đúng, cách ≥ 3 ngày, đúng một bản song sinh nếu câu có)', () => {
    const dong = [
      d('C', 'P2', '2026-10-07', 1, 0), d('C', 'P2', '2026-10-08', 1, 1), d('C', 'P2', '2026-10-10', 1, 1), // đóng 10/10: 3 ngày
      d('C', 'P3', '2026-10-02', 1, 0), d('C', 'P3', '2026-10-09', 1, 1), d('C', 'P3', '2026-10-12', 1, 1), // đóng 12/10: 10 ngày
      // 10/10 mới cách lần sai 2 ngày ⇒ chờ kiểm; đóng 11/10: 3 ngày.
      d('C', 'P4', '2026-10-08', 1, 0), d('C', 'P4', '2026-10-09', 1, 1), d('C', 'P4', '2026-10-10', 1, 1), d('C', 'P4', '2026-10-11', 1, 1),
      // P5 có song sinh ⇒ hai lượt câu gốc chưa đủ; song sinh đúng 13/10 ⇒ đóng: 5 ngày.
      d('D', 'P5', '2026-10-08', 1, 0), d('D', 'P5', '2026-10-09', 1, 1), d('D', 'P5', '2026-10-12', 1, 1), d('D', 'P5~ss0', '2026-10-13', 1, 1),
      // P1 đóng 03/10 — TRƯỚC cửa sổ ⇒ không vào trung vị.
      d('D', 'P1', '2026-09-30', 1, 0), d('D', 'P1', '2026-10-01', 1, 1), d('D', 'P1', '2026-10-03', 1, 1),
    ]
    const kq = tinhChatLuongLoi({ dong, homNay: '2026-10-20', coSongSinh: (q) => q === 'P5' })
    // [3, 10, 3, 5] ⇒ sắp [3, 3, 5, 10] ⇒ (3 + 5) / 2 = 4.
    expect(kq.ngayToiDong).toEqual({ trungVi: 4, n: 4, du: false })
  })

  it('lượt kiểm 14 / 30 ngày (luotKiemDuyTri từng mốc) chỉ tính lượt kiểm rơi vào cửa sổ; lượt có hỗ trợ không phải lượt kiểm', () => {
    const dong = [
      // K1: đóng 02/10; kiểm 14 ngày 16/10 (TRƯỚC cửa sổ 28/10–10/11 ⇒ không tính); kiểm 30 ngày 05/11 SAI (trong cửa sổ).
      d('E', 'K1', '2026-09-29', 1, 0), d('E', 'K1', '2026-09-30', 1, 1), d('E', 'K1', '2026-10-02', 1, 1), d('E', 'K1', '2026-10-16', 1, 1), d('E', 'K1', '2026-11-05', 1, 0),
      // K2: đóng 08/10; kiểm 14 ngày 30/10 ĐÚNG (trong cửa sổ).
      d('E', 'K2', '2026-10-05', 1, 0), d('E', 'K2', '2026-10-06', 1, 1), d('E', 'K2', '2026-10-08', 1, 1), d('E', 'K2', '2026-10-30', 1, 1),
      // K3: đóng 10/10; kiểm 14 ngày 25/10 SAI (trước cửa sổ) ⇒ mở lại; đóng lại 29/10 = 4 ngày sau lần sai cuối 25/10 (vào trung vị).
      d('E', 'K3', '2026-10-07', 1, 0), d('E', 'K3', '2026-10-08', 1, 1), d('E', 'K3', '2026-10-10', 1, 1), d('E', 'K3', '2026-10-25', 1, 0),
      d('E', 'K3', '2026-10-26', 1, 1), d('E', 'K3', '2026-10-29', 1, 1),
      // K4: đóng 13/10; 27/10 có hỗ trợ (không phải lượt kiểm); kiểm 14 ngày 28/10 SAI (trong cửa sổ).
      d('F', 'K4', '2026-10-10', 1, 0), d('F', 'K4', '2026-10-11', 1, 1), d('F', 'K4', '2026-10-13', 1, 1), d('F', 'K4', '2026-10-27', 1, 1, { assistance: 'assisted' }),
      d('F', 'K4', '2026-10-28', 1, 0),
    ]
    const kq = tinhChatLuongLoi({ dong, homNay: '2026-11-10' })
    expect(kq.tuNgay).toBe('2026-10-28')
    // Mốc 14: K2 đúng + K4 sai ⇒ 1/2. Mốc 30: K1 sai ⇒ 1/1.
    expect(kq.saiLaiDuyTri).toEqual([{ moc: 14, tiLe: 0.5, dat: 1, n: 2, du: false }, { moc: 30, tiLe: 1, dat: 1, n: 1, du: false }])
    expect(kq.ngayToiDong).toEqual({ trungVi: 4, n: 1, du: false })
    // Mốc theo tham số chung (vd. đã hiệu chỉnh): báo đúng mốc đó.
    // Mốc 20: K1 05/11 SAI (34 ngày; 16/10 mới 14 ngày) + K2 30/10 ĐÚNG (22 ngày); K3, K4 chưa có lượt cách ≥ 20 ngày ⇒ 1/2.
    expect(tinhChatLuongLoi({ dong, homNay: '2026-11-10', mocDuyTri: [20] }).saiLaiDuyTri).toEqual([{ moc: 20, tiLe: 0.5, dat: 1, n: 2, du: false }])
  })
})

describe('4 · câu lạ cùng dạng (định nghĩa OMNI)', () => {
  it('quan sát độc lập đầu ngày ở câu chưa từng gặp (kể cả trước 29/09), cùng dạng một câu đã sai trước đó', () => {
    const DANG: Record<string, string> = { Q10: 'D1', Q11: 'D1', Q1: 'D1', Q2: 'D1', Q3: 'D1', Q4: 'D1', Q5: 'D2', Q6: 'D1', Q7: 'D1', S1: 'D1', Q12: 'D1', Q13: 'D1' }
    const dong = [
      d('G', 'Q10', '2026-10-05', 1, 0), // lỗi đầu tiên của dạng D1 (trước cửa sổ) — chính nó chưa tính: dạng chưa có lỗi trước đó
      d('G', 'Q11', '2026-10-06', 1, 1), // câu lạ cùng dạng nhưng TRƯỚC cửa sổ
      d('G', 'Q1', '2026-10-08', 1, 0), // #1 SAI
      d('G', 'Q2', '2026-10-09', 1, 1), d('G', 'Q2', '2026-10-09', 2, 0), // #2 ĐÚNG; lượt thứ hai cùng ngày không phải quan sát
      d('G', 'Q3', '2026-10-10', 1, null, { purpose: 'luot' }), d('G', 'Q3', '2026-10-10', 2, 1), // lướt trước ⇒ đã gặp (dòng đầu ngày không phải tự làm)
      d('G', 'Q4', '2026-10-11', 1, 1), // đã gặp TRƯỚC 29/09
      d('G', 'Q5', '2026-10-12', 1, 1), // dạng D2 chưa có lỗi
      d('G', 'Q6', '2026-10-13', 1, 1, { assistance: 'assisted' }), // có hỗ trợ
      d('G', 'Q7', '2026-10-14', 1, 0), // #3 SAI
      d('G', 'Q8', '2026-10-14', 2, 1), // không rõ dạng
      d('G', 'S1', '2026-10-15', 1, 1, { tc: 'Q1' }), // câu thay thế chưa từng gặp, cùng dạng ⇒ #4 ĐÚNG
      d('G', 'Q2~ss1', '2026-10-16', 1, 1), // song sinh của câu đã gặp ⇒ không lạ
      d('G', 'Q12', '2026-10-17', 1, 0, { purpose: 'xem_loi_giai', assistance: 'assisted' }), d('G', 'Q12', '2026-10-17', 2, 1), // đọc lời giải trước ⇒ đã gặp
      d('G', 'Q13', '2026-10-18', 1, 1, { assistance: 'unknown' }), // OMNI: chỉ assistance 'none' là tự làm
    ]
    const kq = tinhChatLuongLoi({ dong, homNay: '2026-10-20', dangCua: (q) => DANG[q] ?? null, daGapTruoc: new Set(['G|Q4']) })
    expect(kq.cauLaCungDang).toEqual({ tiLe: 0.5, dat: 2, n: 4, du: false })
    // Kho không biết dạng ⇒ lùi cột ma_dang của sổ.
    const lui = [d('G', 'X1', '2026-10-08', 1, 0, { maDang: 'D9' }), d('G', 'X2', '2026-10-09', 1, 1, { maDang: 'D9' })]
    expect(tinhChatLuongLoi({ dong: lui, homNay: '2026-10-20', dangCua: () => null }).cauLaCungDang).toMatchObject({ dat: 1, n: 1 })
  })
})

describe('5 · lượt làm lại phải lặp nguyên văn', () => {
  it('trong cửa sổ lỗi (mở / chờ kiểm): nguyên văn = cùng qid gốc, không song sinh / thay thế / bản xáo; có cờ nv thì theo cờ', () => {
    const dong = [
      d('H', 'V1', '2026-10-08', 1, 0), // mở lỗi (chính lượt sai không phải làm lại)
      d('H', 'V1', '2026-10-08', 2, 1), // #1 nguyên văn (cùng ngày)
      d('H', 'V1~ss0', '2026-10-09', 1, 1), // #2 song sinh
      d('H', 'W2', '2026-10-10', 1, 0, { tc: 'V1' }), // #3 câu thay thế (sai ⇒ mở lại)
      d('H', 'V1', '2026-10-11', 1, 1, { xt: 1 }), // #4 bản xáo
      d('H', 'V1', '2026-10-12', 1, 1, { nv: 1, assistance: 'assisted' }), // #5 cờ nv = 1 (lượt có hỗ trợ vẫn là lượt làm lại) ⇒ nguyên văn
      d('H', 'V1', '2026-10-13', 1, 1, { nv: 0 }), // #6 cờ nv = 0 ⇒ không nguyên văn dù cùng qid
      d('H', 'V1', '2026-10-14', 1, 1), // #7 nguyên văn (chưa đóng: chưa đúng bản song sinh nào sau lần sai cuối)
      d('H', 'V1~ss1', '2026-10-15', 1, 1), // #8 song sinh ⇒ ĐÓNG lỗi (5 ngày sau lần sai cuối 10/10)
      d('H', 'V1', '2026-10-16', 1, 1), // đã đóng ⇒ ngoài cửa sổ lỗi
      d('H', 'V2', '2026-10-01', 1, 0), d('H', 'V2', '2026-10-02', 1, 1), // trước cửa sổ thời gian
    ]
    const kq = tinhChatLuongLoi({ dong, homNay: '2026-10-20', coSongSinh: (q) => q === 'V1' })
    // Nguyên văn: #1, #5, #7 ⇒ 3 / 8.
    expect(kq.lapNguyenVan).toEqual({ tiLe: 3 / 8, dat: 3, n: 8, du: false })
    expect(kq.ngayToiDong).toEqual({ trungVi: 5, n: 1, du: false })
  })
})

describe('khối của lớp (cauHopKhoi) + câu tự luận', () => {
  it('câu khác khối lọt vào sổ (kể cả câu thay thế khác khối) bị bỏ hẳn, đếm ở boKhacKhoi; câu tự luận bỏ', () => {
    const dong = [
      d('S1', 'DH-11-C1-B1-I-1', '2026-10-08', 1, 0), d('S1', 'DH-11-C1-B1-I-1', '2026-10-09', 1, 1), // làm lại đúng ⇒ tính
      d('S1', 'DH-12-C1-B1-I-1', '2026-10-08', 2, 0), d('S1', 'DH-12-C1-B1-I-1', '2026-10-09', 2, 0), // câu khối 12 trong sổ lớp 11 ⇒ bỏ
      d('S1', 'DH-12-C2-B1-I-5', '2026-10-10', 1, 1, { tc: 'DH-11-C1-B1-I-1' }), // câu thay thế khối 12 ⇒ bỏ
      d('S1', 'DH-11-TL-1', '2026-10-08', 3, 0), d('S1', 'DH-11-TL-1', '2026-10-09', 3, 0), // tự luận ⇒ bỏ
    ]
    const kq = tinhChatLuongLoi({ dong, homNay: '2026-10-20', hopKhoi: (q) => cauHopKhoi(11, { qid: q }), laTuLuan: (q) => q === 'DH-11-TL-1' })
    expect(kq.lamLaiDau).toEqual({ tiLe: 1, dat: 1, n: 1, du: false })
    expect(kq.lapNguyenVan).toEqual({ tiLe: 1, dat: 1, n: 1, du: false })
    expect(kq.boKhacKhoi).toBe(2)
  })
})

// ---------------------------------------------------------------- lệnh qua Worker thật
describe('máy chủ /gv/chat-luong-loi (Worker thật, D1 thật)', () => {
  afterEach(() => { vi.useRealTimers() })

  it('chỉ thầy; danh sách lớp + lớp mặc định; số của lớp chỉ tính câu đúng khối; cửa sổ soNgay; KHÔNG ghi gì', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-10-20T03:00:00Z')) // 10:00 Thứ Ba 20/10/2026 giờ VN
    const d1 = taoD1That()
    const env = d1.env as unknown as Env
    const hs = d1.sql.prepare('INSERT INTO hoc_sinh (sbd, ho_ten, lop, ten_lop, mat_khau, cap_nhat_luc) VALUES (?,?,?,?,?,?)')
    hs.run('S1', 'Trần An', '11', '11A1', 'mk', 'x')
    hs.run('S2', 'Lê Bình', '11', '11A1', 'mk', 'x')
    hs.run('T1', 'Phạm Chi', '12', '12 - Tinh Hoa', 'mk', 'x')
    const cau = (maDe: string, qid: string, dang: string, o: Record<string, unknown> = {}) =>
      d1.sql.prepare('INSERT INTO game_v2_question (ma_de, qid, version, content_group, dang, json) VALUES (?,?,?,?,?,?)')
        .run(maDe, qid, 'v1', `g-${qid}`, dang, JSON.stringify({ qid, maDe, phan: 'I', dang, mucDo: 'Thông hiểu', ...o }))
    cau('DH-11-C1-B1', 'DH-11-C1-B1-I-1', 'D1')
    cau('DH-11-C1-B1', 'DH-11-C1-B1-I-2', 'D1')
    cau('DH-11-C1-B1', 'DH-11-C1-B1-I-3', 'D1', { tuLuan: true })
    cau('DH-12-C1-B1', 'DH-12-C1-B1-I-1', 'D1')
    d1.sql.exec('CREATE TABLE IF NOT EXISTS loi_giai_hoi (sbd TEXT NOT NULL, qid TEXT NOT NULL, nguon TEXT, luc TEXT NOT NULL, co_ho_so INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (sbd, qid, luc))')
    d1.sql.prepare("INSERT INTO loi_giai_hoi (sbd, qid, nguon, luc) VALUES ('S2', 'DH-11-C1-B1-I-1', 'on_lai', '2026-10-11T02:00:00.000Z')").run()
    let n = 0
    const sk = (sbd: string, qid: string, luc: string, kq: 0 | 1 | null, o: { assistance?: string; visibility?: string } = {}) =>
      d1.sql.prepare('INSERT INTO su_kien_hoc (khoa, sbd, qid, nguon, ma_nguon, ket_qua, luc, ngay_vn, assistance, visibility) VALUES (?,?,?,?,?,?,?,?,?,?)')
        .run(`k${++n}`, sbd, qid, 'game', 'm', kq, luc, luc.slice(0, 10), o.assistance ?? 'none', o.visibility ?? null)
    const I1 = 'DH-11-C1-B1-I-1', I2 = 'DH-11-C1-B1-I-2', I3 = 'DH-11-C1-B1-I-3', K12 = 'DH-12-C1-B1-I-1'
    // S1: I1 sai 08/10 → đúng 09/10 (làm lại #1 đúng) → đúng 11/10 (đóng: 3 ngày). Câu khối 12 sai hai lần ⇒ bỏ. I2 lần đầu 12/10 đúng ⇒ câu lạ cùng dạng.
    sk('S1', I1, '2026-10-08T01:00:00.000Z', 0); sk('S1', I1, '2026-10-09T01:00:00.000Z', 1); sk('S1', I1, '2026-10-11T01:00:00.000Z', 1)
    sk('S1', K12, '2026-10-08T02:00:00.000Z', 0); sk('S1', K12, '2026-10-09T02:00:00.000Z', 0)
    sk('S1', I2, '2026-10-12T01:00:00.000Z', 1)
    sk('S1', I3, '2026-10-12T02:00:00.000Z', 0) // tự luận ⇒ bỏ
    // S2: I2 gặp từ 25/09 (trước 29/09 ⇒ không lạ); I1 sai 09/10; 10/10 có hỗ trợ; 11/10 03:00 sau đọc lời giải 02:00 (bỏ); 12/10 đúng ⇒ làm lại #2 đúng.
    // Dòng ca chưa công bố (che) ⇒ không đọc.
    sk('S2', I2, '2026-09-25T01:00:00.000Z', 1)
    sk('S2', I1, '2026-10-09T01:00:00.000Z', 0); sk('S2', I1, '2026-10-10T01:00:00.000Z', 1, { assistance: 'assisted' })
    sk('S2', I1, '2026-10-11T03:00:00.000Z', 1); sk('S2', I1, '2026-10-12T01:00:00.000Z', 1)
    sk('S2', I2, '2026-10-13T01:00:00.000Z', 1)
    sk('S2', I1, '2026-10-14T01:00:00.000Z', 0, { visibility: 'embargoed' })
    // T1 (lớp 12): câu khối 12 là câu ĐÚNG khối của lớp này ⇒ tính.
    sk('T1', K12, '2026-10-08T01:00:00.000Z', 0); sk('T1', K12, '2026-10-09T01:00:00.000Z', 1)

    expect((await goiWorker(worker, env, '/gv/chat-luong-loi', {})).ok).toBe(false) // không mã thầy
    const thayDoi = () => [Number((d1.sql.prepare('SELECT total_changes() AS n').get() as { n: number }).n), d1.dem('sqlite_master')]
    const truoc = thayDoi()

    const macDinh = await goiWorker(worker, env, '/gv/chat-luong-loi', {}, true)
    expect(macDinh).toMatchObject({ ok: true, homNay: '2026-10-20', soNgay: 14, nToiThieu: 10, chon: '12 - Tinh Hoa' })
    expect(macDinh.lop).toEqual([{ tenLop: '12 - Tinh Hoa', khoi: '12', soEm: 1 }, { tenLop: '11A1', khoi: '11', soEm: 2 }])
    expect(macDinh.ketQua).toMatchObject({ tenLop: '12 - Tinh Hoa', soEm: 1, lamLaiDau: { dat: 1, n: 1 }, boKhacKhoi: 0 })
    expect(typeof macDinh.soTruyVan).toBe('number')

    const r = await goiWorker(worker, env, '/gv/chat-luong-loi', { lop: '11A1' }, true)
    expect(r.chon).toBe('11A1')
    expect(r.ketQua).toEqual({
      tenLop: '11A1', khoi: '11', soEm: 2, tuNgay: '2026-10-07', denNgay: '2026-10-20', soNgay: 14, nToiThieu: 10,
      lamLaiDau: { tiLe: 1, dat: 2, n: 2, du: false }, // S1 09/10 + S2 12/10
      saiLaiDuyTri: [{ moc: 14, tiLe: null, dat: 0, n: 0, du: false }, { moc: 30, tiLe: null, dat: 0, n: 0, du: false }],
      ngayToiDong: { trungVi: 3, n: 1, du: false }, // S1 I1: sai 08/10 → đóng 11/10
      cauLaCungDang: { tiLe: 1, dat: 1, n: 1, du: false }, // S1 I2 12/10 (S2 I2 đã gặp 25/09)
      // Cửa sổ lỗi: S1 09/10, 11/10; S2 10/10 (có hỗ trợ), 11/10, 12/10 — đều câu gốc ⇒ 5/5 nguyên văn.
      lapNguyenVan: { tiLe: 1, dat: 5, n: 5, du: false },
      boKhacKhoi: 1, soEmCoLuot: 2,
    })
    // Cửa sổ 3 ngày (18/10–20/10): không còn lượt nào.
    const ngan = await goiWorker(worker, env, '/gv/chat-luong-loi', { lop: '11A1', soNgay: 3 }, true)
    expect(ngan.ketQua).toMatchObject({ tuNgay: '2026-10-18', soNgay: 3, lamLaiDau: { n: 0 }, lapNguyenVan: { n: 0 }, soEmCoLuot: 0 })
    // Lớp không có ⇒ lớp đầu danh sách, `chon` nói rõ.
    expect((await goiWorker(worker, env, '/gv/chat-luong-loi', { lop: 'Lớp lạ' }, true)).chon).toBe('12 - Tinh Hoa')
    expect(thayDoi()).toEqual(truoc) // chỉ đọc: không một dòng ghi, không tạo bảng
  })
})
