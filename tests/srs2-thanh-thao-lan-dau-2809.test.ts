// @vitest-environment node
// LUẬT THẦY 05/10 ("chặn chuẩn 100% không được rút nhầm kho khác khối"): kênh tự động chặn câu KHÔNG RÕ khối ⇒ câu trong kho giả ghi khối `lop` (đúng khối em).
// THÀNH THẠO LẦN ĐẦU (thầy CHỐT 28/09/2026): đúng ngay lần đầu, không gợi ý ⇒ thành thạo luôn — CHỈ với câu khó đoán mò:
// Phần II (đúng cả 4 ý), Phần III, Phần I Nhận biết; trừ câu 2 sao. Còn lại (Phần I Thông hiểu/Vận dụng, câu 2 sao, câu có gợi ý,
// câu sai lần đầu): đúng 2 ngày khác nhau như cũ. Ước lượt: P1 (câu mới 2 lượt) — MỘT hàm `khoiLuongCan` cho mọi ô.
import { describe, expect, it } from 'vitest'
import {
  congNgay, henThanhThaoLanDau, khoiLuongCan, laCauKhoDoanMo, lapKeHoachNgay, phatLaiCau, soNgayConLai, HEN_DUY_TRI, THANH_THAO_LAN_DAU,
  type CauSrs, type LanLam, type TrangThaiCau, type TuyChonPhatLai,
} from '../server/src/srs2-loi'
import * as loi from '../server/src/srs2-loi'
import { isAnswerCorrect } from '../server/src/btvn-grading'
import { docHoSo2, docLoaiCau } from '../server/src/srs2-d1'
import { gvChienDich, theLucDeXuat, trangThaiLop } from '../server/src/srs2-gv'
import { gvSuaChienDich, theLucSauSua } from '../server/src/srs2-sua'
import { taoD1That } from './_d1-that'
import type { Env } from '../server/src/kieu'

const HAN = '2026-10-07'
const lam = (ngay: string, dung: boolean, gio = 10, coGoiY = false, qid = 'Q'): LanLam => ({ qid, ngay, luc: `${ngay}T${String(gio).padStart(2, '0')}:00:00Z`, dung, coGoiY })
const P2 = { phan: 'II' } as const
const P3 = { phan: 'III' } as const
const I_BIET = { phan: 'I', mucDo: 'NB' } as const
const I_HIEU = { phan: 'I', mucDo: 'TH' } as const
const I_VD = { phan: 'I', mucDo: 'Vận dụng' } as const
const dungLanDau = (loai: TuyChonPhatLai, coGoiY = false) => phatLaiCau('Q', [lam('2026-09-28', true, 10, coGoiY)], HAN, [], loai)

describe('cờ, hẹn, loại câu', () => {
  it('cờ bật (lùi về luật cũ: đổi một dòng THANH_THAO_LAN_DAU = false); nhánh P2 đã bỏ khỏi mã', () => {
    expect(THANH_THAO_LAN_DAU).toBe(true)
    for (const ten of ['uocLuotCauMoi', 'luotCauMoiTheoTiLe', 'uocKhoiLuong', 'PHUONG_AN_UOC_LUOT', 'tiLeDungLanDau']) expect(ten in loi).toBe(false)
  })
  it('hẹn của câu thành thạo lần đầu: sau hạn nộp và ≥ 30 ngày', () => {
    expect(henThanhThaoLanDau('2026-09-28', HAN)).toBe(congNgay('2026-09-28', HEN_DUY_TRI))
    expect(henThanhThaoLanDau('2026-09-01', '2026-12-31')).toBe('2027-01-01')
    expect(henThanhThaoLanDau('2026-09-28', null)).toBe('2026-10-28')
  })
  it('câu khó đoán mò: Phần II, Phần III, Phần I Nhận biết (mọi cách ghi); không 2 sao; thiếu phần ⇒ không', () => {
    for (const mucDo of ['NB', 'Nhận biết', 'biet']) expect(laCauKhoDoanMo({ phan: 'I', mucDo })).toBe(true)
    for (const mucDo of ['TH', 'Thông hiểu', 'hieu', 'VD', 'van_dung', 'VDC', null]) expect(laCauKhoDoanMo({ phan: 'I', mucDo })).toBe(false)
    expect([laCauKhoDoanMo(P2), laCauKhoDoanMo(P3), laCauKhoDoanMo({ ...P2, sao: 1 })]).toEqual([true, true, true])
    expect([laCauKhoDoanMo({ ...P2, sao: 2 }), laCauKhoDoanMo({ ...P3, sao: 2 }), laCauKhoDoanMo({ ...I_BIET, sao: 2 })]).toEqual([false, false, false])
    expect(laCauKhoDoanMo({})).toBe(false)
  })
})

describe('luật chốt', () => {
  it('Phần II đúng CẢ 4 Ý lần đầu ⇒ thành thạo ngay; đúng 3/4 ý là SAI ⇒ không', () => {
    const t = dungLanDau(P2)
    expect([t.laMoi, t.thanhThao, t.thanhThaoLanDau, t.cc]).toEqual([false, true, true, 2])
    expect(t.henOn! > HAN).toBe(true)
    // Sổ chỉ ghi `dung` khi đủ 4 ý (một luật chấm `isAnswerCorrect`).
    expect(isAnswerCorrect('DSDS', 'DSDS', 'II')).toBe(true)
    expect(isAnswerCorrect('DSDD', 'DSDS', 'II')).toBe(false)
    const ba = phatLaiCau('Q', [lam('2026-09-28', isAnswerCorrect('DSDD', 'DSDS', 'II'))], HAN, [], P2)
    expect([ba.thanhThao, ba.cc, ba.lanSai]).toEqual([false, 0, 1])
  })
  it('Phần III đúng lần đầu ⇒ thành thạo ngay', () => {
    expect([dungLanDau(P3).thanhThao, dungLanDau(P3).thanhThaoLanDau]).toEqual([true, true])
  })
  it('Phần I Nhận biết đúng lần đầu ⇒ thành thạo ngay', () => {
    expect([dungLanDau(I_BIET).thanhThao, dungLanDau(I_BIET).thanhThaoLanDau]).toEqual([true, true])
  })
  it('Phần I Thông hiểu / Vận dụng đúng lần đầu ⇒ CHƯA (cc = 1, hẹn +3); đúng thêm ngày khác ⇒ thành thạo', () => {
    for (const loai of [I_HIEU, I_VD]) {
      const t = dungLanDau(loai)
      expect([t.thanhThao, t.thanhThaoLanDau, t.cc, t.henOn]).toEqual([false, undefined, 1, '2026-10-01'])
      const hai = phatLaiCau('Q', [lam('2026-09-28', true), lam('2026-10-01', true)], HAN, [], loai)
      expect([hai.thanhThao, hai.thanhThaoLanDau, hai.cc]).toEqual([true, undefined, 2])
    }
  })
  it('câu 2 SAO (mọi phần) đúng lần đầu ⇒ chưa', () => {
    for (const loai of [P2, P3, I_BIET]) {
      const t = dungLanDau({ ...loai, sao: 2 })
      expect([t.thanhThao, t.thanhThaoLanDau, t.cc]).toEqual([false, undefined, 1])
    }
  })
  it('đúng lần đầu NHỜ GỢI Ý ⇒ chưa (kể cả Phần II/III/Nhận biết)', () => {
    for (const loai of [P2, P3, I_BIET]) {
      const t = dungLanDau(loai, true)
      expect([t.thanhThao, t.thanhThaoLanDau, t.cc, t.henOn]).toEqual([false, undefined, 1, '2026-10-01'])
    }
  })
  it('SAI lần đầu rồi đúng: 1 ngày chưa đủ, cùng ngày không cộng; đúng 2 ngày khác nhau ⇒ thành thạo', () => {
    for (const loai of [P2, P3, I_BIET, I_HIEU]) {
      expect(phatLaiCau('Q', [lam('2026-09-28', false), lam('2026-09-29', true)], HAN, [], loai).thanhThao).toBe(false)
      expect(phatLaiCau('Q', [lam('2026-09-28', false), lam('2026-09-29', true, 8), lam('2026-09-29', true, 20)], HAN, [], loai).thanhThao).toBe(false)
      const hai = phatLaiCau('Q', [lam('2026-09-28', false), lam('2026-09-29', true), lam('2026-10-02', true)], HAN, [], loai)
      expect([hai.thanhThao, hai.thanhThaoLanDau, hai.cc]).toEqual([true, undefined, 2])
    }
  })
  it('thành thạo lần đầu rồi làm lại SAI ⇒ mất thành thạo, vào vòng ôn ngày mai', () => {
    const t = phatLaiCau('Q', [lam('2026-09-28', true), lam('2026-10-01', false)], HAN, [], P2)
    expect([t.thanhThao, t.thanhThaoLanDau, t.cc, t.lanSai, t.henOn]).toEqual([false, undefined, 0, 1, '2026-10-02'])
  })
  it('thành thạo lần đầu làm đúng lại ⇒ vẫn không kéo vào ôn trong chiến dịch', () => {
    const t = phatLaiCau('Q', [lam('2026-09-28', true), lam('2026-09-30', true)], HAN, [], P3)
    expect([t.thanhThao, t.thanhThaoLanDau]).toEqual([true, true])
    expect(t.henOn! > HAN).toBe(true)
  })
  it('không biết loại câu (thiếu phần) ⇒ luật cũ', () => {
    expect(phatLaiCau('Q', [lam('2026-09-28', true)], HAN).thanhThao).toBe(false)
  })
})

describe('kế hoạch ngày + khối lượng', () => {
  const cs: CauSrs[] = [
    { qid: 'ii', phan: 'II', mucDo: 'TH', dang: 'D1' }, { qid: 'iii', phan: 'III', mucDo: 'VD', dang: 'D1' }, { qid: 'nb', phan: 'I', mucDo: 'NB', dang: 'D1' },
    { qid: 'th', phan: 'I', mucDo: 'TH', dang: 'D1' }, { qid: 'hai_sao', phan: 'II', mucDo: 'VDC', dang: 'D1' }, { qid: 'sai', phan: 'III', mucDo: 'VD', dang: 'D1' },
    { qid: 'goi_y', phan: 'I', mucDo: 'NB', dang: 'D1' }, { qid: 'moi', phan: 'II', mucDo: 'TH', dang: 'D1' },
  ]
  const sao: Record<string, number> = { hai_sao: 2 }
  const lan = cs.filter((c) => c.qid !== 'moi').map((c, i) => lam('2026-09-28', c.qid !== 'sai', 8 + i, c.qid === 'goi_y', c.qid))
  const tt = new Map<string, TrangThaiCau>(cs.map((c) => [c.qid, phatLaiCau(c.qid, lan, HAN, [], { phan: c.phan, mucDo: c.mucDo, sao: sao[c.qid] ?? 1 })]))

  it('suốt chiến dịch: câu thành thạo lần đầu KHÔNG bao giờ được xếp ôn; câu Thông hiểu, 2 sao, sai, gợi ý vẫn được xếp', () => {
    const daXep = new Set<string>()
    for (let n = congNgay('2026-09-28', 1); n <= HAN; n = congNgay(n, 1)) {
      const kh = lapKeHoachNgay(cs, tt, { homNay: n, hanNop: HAN })
      for (const q of [...kh.dao, ...kh.doan]) daXep.add(q)
    }
    for (const q of ['ii', 'iii', 'nb']) expect(daXep.has(q)).toBe(false)
    for (const q of ['th', 'hai_sao', 'sai', 'goi_y', 'moi']) expect(daXep.has(q)).toBe(true)
  })
  it('khối lượng (P1): thành thạo lần đầu 0, đúng-chưa-chín 1, sai 2, câu MỚI vẫn 2; Huyết Chiến dùng đúng số này', () => {
    // th 1 + hai_sao 1 + sai 2 + goi_y 1 + moi 2 = 7
    expect(khoiLuongCan(tt.values())).toBe(7)
    const kh = lapKeHoachNgay(cs, tt, { homNay: '2026-10-06', hanNop: HAN, tranNgay: 3 })
    expect(kh.khoiLuong).toBe(7)
    expect(kh.huyetChien).toBe(7 > 0.9 * soNgayConLai('2026-10-06', HAN) * 3)
  })
})

// ---------------------------------------------------------------- máy chủ thật (SQLite lược đồ thật): mọi ô ước lượt nhất quán
const T0 = Date.parse('2026-09-30T02:00:00Z') // 09:00 VN 30/09
const GIO = 3_600_000
const cauKho = (qid: string, ma: string, phan: 'I' | 'II' | 'III', mucDo: string, sao = 1) => JSON.stringify({
  qid, maDe: ma, lop: '12', version: 'v1', group: `g-${qid}`, phan, text: `Câu ${qid}`, choices: phan === 'I' ? ['a', 'b', 'c', 'd'] : [], ideas: phan === 'II' ? ['a', 'b', 'c', 'd'] : [],
  hinhAnh: [], dang: 'D1', tenDang: 'Dạng 1', mucDo, sao, kienThuc: ['k'], correct: phan === 'I' ? 'B' : phan === 'II' ? 'DSDS' : '4', reviewed: true, solution: { chot: 'c' },
})
function dung() {
  const d = taoD1That()
  const env = d.env as unknown as Env
  d.sql.exec("INSERT INTO hoc_sinh(sbd,ho_ten,lop,cap_nhat_luc) VALUES('S1','An','12','x'),('S2','Bảo','12','x')")
  d.sql.exec(`INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('game_hoa_2','{"bat":true}','x')`)
  const st = d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)')
  // DE1: Q1 I-NB, Q2 II, Q3 III, Q4 I-TH, Q5 I-NB 2 sao, Q6 I-NB. DE2: Q7, Q8 I-NB. Q5 ở DE2 là 1 sao (lấy sao lớn nhất = 2).
  for (const [q, p, m, s] of [['Q1', 'I', 'NB', 1], ['Q2', 'II', 'TH', 1], ['Q3', 'III', 'VD', 0], ['Q4', 'I', 'TH', 1], ['Q5', 'I', 'NB', 2], ['Q6', 'I', 'NB', 1]] as const) st.run('DE1', q, 'v1', `g-${q}`, 'D1', cauKho(q, 'DE1', p, m, s))
  st.run('DE2', 'Q5', 'v1', 'g-Q5', 'D1', cauKho('Q5', 'DE2', 'I', 'NB', 1))
  st.run('DE2', 'Q7', 'v1', 'g-Q7', 'D1', cauKho('Q7', 'DE2', 'I', 'NB'))
  st.run('DE2', 'Q8', 'v1', 'g-Q8', 'D1', cauKho('Q8', 'DE2', 'I', 'NB'))
  let k = 0
  const lamDb = (sbd: string, qid: string, ms: number, dung = true) =>
    d.sql.prepare("INSERT INTO su_kien_hoc (khoa, sbd, qid, nguon, ma_nguon, lan, ket_qua, giay, luc, ngay_vn) VALUES (?,?,?,'game','G',1,?,30,?,?)")
      .run(`k${++k}`, sbd, qid, dung ? 1 : 0, new Date(ms).toISOString(), new Date(ms + 7 * GIO).toISOString().slice(0, 10))
  return { d, env, lamDb }
}

describe('máy chủ: loại câu + các ô tự tính dùng CÙNG `khoiLuongCan`', () => {
  it('docLoaiCau: phần, mức độ, sao lớn nhất khi câu ở nhiều tờ', async () => {
    const { env } = dung()
    const l = await docLoaiCau(env, ['Q2', 'Q5'])
    expect(l.get('Q2')).toEqual({ sao: 1, phan: 'II', mucDo: 'TH' })
    expect(l.get('Q5')).toEqual({ sao: 2, phan: 'I', mucDo: 'NB' })
  })
  it('Giao chiến dịch: khối lượng = 2 × số câu mới; Tự tính = số nhỏ nhất ≤ 70% và không em nào quá tải; % và quá tải cùng số', async () => {
    const { env } = dung()
    const r = await gvChienDich(env, { action: 'suc-chua', sbd: ['S1', 'S2'], maDe: ['DE1'], hanNop: '2026-10-05', theLucNgay: 3 }, T0) as Record<string, number> & { tachGiua: { cauMoi: number; luotOn: number } }
    expect(r).toMatchObject({ soCau: 6, D: 6, khoiLuongTrungVi: 12, tachGiua: { cauMoi: 6, luotOn: 0 }, sucChua: 18, soEmQuaTai: 0 })
    expect(r.tiLe).toBeCloseTo(12 / 18)
    expect(r.theLucDeXuat).toBe(theLucDeXuat(12, 12, 6))
  })
  it('sau khi em làm: thầy (trangThaiLop), em (docHoSo2 + Huyết Chiến) và Sửa chiến dịch (tự nâng) ra CÙNG số lượt', async () => {
    const { env, lamDb } = dung()
    const id = ((await gvChienDich(env, { action: 'tao', ten: 'x', sbd: ['S1'], maDe: ['DE1'], hanNop: '2026-10-05', theLucNgay: 1 }, T0)) as { id: string }).id
    // S1 đúng Q1 (I-NB), Q2 (II), Q3 (III) ⇒ thành thạo lần đầu (0 lượt); Q4 (I-TH) đúng ⇒ 1; Q5 (2 sao) đúng ⇒ 1; Q6 sai ⇒ 2.
    for (const [q, dg] of [['Q1', true], ['Q2', true], ['Q3', true], ['Q4', true], ['Q5', true], ['Q6', false]] as const) lamDb('S1', q, T0 + GIO, dg)
    const nowMs = T0 + 2 * GIO
    const phia = await trangThaiLop(env, ['S1'], ['Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6'], '2026-10-05', new Date(T0).toISOString())
    const tt = phia.get('S1')!
    expect(['Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6'].map((q) => tt.get(q)!.thanhThao)).toEqual([true, true, true, false, false, false])
    expect(khoiLuongCan(tt.values())).toBe(4)
    const hs = await docHoSo2(env, 'S1', '2026-09-30')
    expect(khoiLuongCan(hs.ttChienDich)).toBe(4)
    expect(lapKeHoachNgay(hs.cau, hs.tt, { homNay: '2026-09-30', hanNop: '2026-10-05' }).khoiLuong).toBe(4)
    // Sửa: thêm DE2 (Q7, Q8 mới = 4 lượt) + rút hạn còn 2 ngày ⇒ (4 + 4) / 2 = 4 câu/ngày.
    const xem = await gvSuaChienDich(env, { action: 'xem-truoc', id, themMaDe: ['DE2'], hanNop: '2026-10-01' }, nowMs)
    expect(xem).toMatchObject({ ok: true, theLucCan: 4, theLucNgay: 4, tuNang: true })
    expect(theLucSauSua(1, 8, 2, true)).toEqual({ can: 4, sau: 4 })
  })
})
