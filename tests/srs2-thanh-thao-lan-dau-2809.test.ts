// @vitest-environment node
// THÀNH THẠO LẦN ĐẦU (thầy 28/09, bản xem trước): câu làm ĐÚNG ngay lần đầu, KHÔNG gợi ý, câu KHÔNG phải 2 sao ⇒ thành thạo
// luôn, không ôn lại trong chiến dịch. Câu sai lần đầu, câu 2 sao, câu đúng nhờ gợi ý: như cũ (đúng 2 ngày khác nhau).
import { describe, expect, it } from 'vitest'
import {
  congNgay, henThanhThaoLanDau, khoiLuongCan, lapKeHoachNgay, luotCauMoiTheoTiLe, phatLaiCau, HEN_DUY_TRI, THANH_THAO_LAN_DAU,
  type CauSrs, type LanLam, type TrangThaiCau,
} from '../server/src/srs2-loi'
import { docMetaCau, docSaoCau } from '../server/src/srs2-d1'
import { taoD1That } from './_d1-that'
import type { Env } from '../server/src/kieu'

const HAN = '2026-10-07'
const lam = (ngay: string, dung: boolean, gio = 10, coGoiY = false, qid = 'Q'): LanLam => ({ qid, ngay, luc: `${ngay}T${String(gio).padStart(2, '0')}:00:00Z`, dung, coGoiY })
const cau = (qid: string, phan: CauSrs['phan'] = 'I'): CauSrs => ({ qid, phan, mucDo: 'TH', dang: 'D1' })

describe('cờ và hẹn', () => {
  it('cờ bật (lùi về luật cũ: đổi một dòng THANH_THAO_LAN_DAU = false)', () => {
    expect(THANH_THAO_LAN_DAU).toBe(true)
  })
  it('hẹn của câu thành thạo lần đầu: sau hạn nộp và ≥ 30 ngày', () => {
    expect(henThanhThaoLanDau('2026-09-28', HAN)).toBe(congNgay('2026-09-28', HEN_DUY_TRI))
    expect(henThanhThaoLanDau('2026-09-01', '2026-12-31')).toBe('2027-01-01') // chiến dịch dài hơn 30 ngày ⇒ sau hạn
    expect(henThanhThaoLanDau('2026-09-28', null)).toBe('2026-10-28')
  })
})

describe('luật mới', () => {
  it('đúng lần đầu, không gợi ý, câu 0 sao hoặc 1 sao ⇒ THÀNH THẠO ngay, không hẹn ôn trong chiến dịch', () => {
    for (const sao of [undefined, 0, 1]) {
      const t = phatLaiCau('Q', [lam('2026-09-28', true)], HAN, [], sao === undefined ? undefined : { sao })
      expect([t.laMoi, t.thanhThao, t.thanhThaoLanDau, t.cc]).toEqual([false, true, true, 2])
      expect(t.henOn! > HAN).toBe(true)
    }
  })
  it('đúng lần đầu NHỜ GỢI Ý ⇒ chưa thành thạo (cc = 1, hẹn +3)', () => {
    const t = phatLaiCau('Q', [lam('2026-09-28', true, 10, true)], HAN)
    expect([t.thanhThao, t.thanhThaoLanDau, t.cc, t.henOn]).toEqual([false, undefined, 1, '2026-10-01'])
  })
  it('câu 2 SAO đúng lần đầu ⇒ chưa; đúng thêm ngày khác ⇒ thành thạo', () => {
    const t1 = phatLaiCau('Q', [lam('2026-09-28', true)], HAN, [], { sao: 2 })
    expect([t1.thanhThao, t1.cc, t1.henOn]).toEqual([false, 1, '2026-10-01'])
    const t2 = phatLaiCau('Q', [lam('2026-09-28', true), lam('2026-10-01', true)], HAN, [], { sao: 2 })
    expect([t2.thanhThao, t2.thanhThaoLanDau, t2.cc]).toEqual([true, undefined, 2])
  })
  it('SAI lần đầu ⇒ đúng 1 ngày chưa đủ; đúng 2 ngày khác nhau ⇒ thành thạo', () => {
    const mot = phatLaiCau('Q', [lam('2026-09-28', false), lam('2026-09-29', true)], HAN)
    expect([mot.thanhThao, mot.cc]).toEqual([false, 1])
    const cungNgay = phatLaiCau('Q', [lam('2026-09-28', false), lam('2026-09-29', true, 8), lam('2026-09-29', true, 20)], HAN)
    expect(cungNgay.thanhThao).toBe(false)
    const hai = phatLaiCau('Q', [lam('2026-09-28', false), lam('2026-09-29', true), lam('2026-10-02', true)], HAN)
    expect([hai.thanhThao, hai.thanhThaoLanDau, hai.cc]).toEqual([true, undefined, 2])
  })
  it('thành thạo lần đầu rồi làm lại SAI ⇒ mất thành thạo, vào vòng ôn ngày mai', () => {
    const t = phatLaiCau('Q', [lam('2026-09-28', true), lam('2026-10-01', false)], HAN)
    expect([t.thanhThao, t.thanhThaoLanDau, t.cc, t.lanSai, t.henOn]).toEqual([false, undefined, 0, 1, '2026-10-02'])
  })
  it('thành thạo lần đầu làm đúng lại (ví dụ gặp trong ca) ⇒ vẫn không kéo vào ôn trong chiến dịch', () => {
    const t = phatLaiCau('Q', [lam('2026-09-28', true), lam('2026-09-30', true)], HAN)
    expect([t.thanhThao, t.thanhThaoLanDau]).toEqual([true, true])
    expect(t.henOn! > HAN).toBe(true)
  })
  it('khối lượng còn cần: câu thành thạo lần đầu = 0 lượt; câu 2 sao đúng lần đầu còn 1', () => {
    const a = phatLaiCau('a', [lam('2026-09-28', true, 10, false, 'a')], HAN)
    const b = phatLaiCau('b', [lam('2026-09-28', true, 10, false, 'b')], HAN, [], { sao: 2 })
    expect(khoiLuongCan([a, b])).toBe(1)
  })
})

describe('kế hoạch ngày không xếp ôn câu thành thạo lần đầu', () => {
  it('suốt chiến dịch: câu đúng lần đầu không bao giờ vào kế hoạch; câu sai và câu 2 sao vẫn được xếp ôn', () => {
    const cs = [cau('de'), cau('de2', 'II'), cau('hai_sao'), cau('sai')]
    const lan = [lam('2026-09-28', true, 10, false, 'de'), lam('2026-09-28', true, 11, false, 'de2'), lam('2026-09-28', true, 12, false, 'hai_sao'), lam('2026-09-28', false, 13, false, 'sai')]
    const sao: Record<string, number> = { hai_sao: 2 }
    const tt = new Map<string, TrangThaiCau>(cs.map((c) => [c.qid, phatLaiCau(c.qid, lan, HAN, [], { sao: sao[c.qid] ?? 1 })]))
    const daXep = new Set<string>()
    for (let n = congNgay('2026-09-28', 1); n <= HAN; n = congNgay(n, 1)) {
      const kh = lapKeHoachNgay(cs, tt, { homNay: n, hanNop: HAN })
      for (const q of [...kh.dao, ...kh.doan]) daXep.add(q)
    }
    expect(daXep.has('de')).toBe(false)
    expect(daXep.has('de2')).toBe(false)
    expect(daXep.has('hai_sao')).toBe(true)
    expect(daXep.has('sai')).toBe(true)
  })
})

describe('ước khối lượng câu mới (Huyết Chiến) — P1 mặc định, P2 xem trước', () => {
  it('P1 (mặc định): câu mới 2 lượt, không đổi', () => {
    const cs = Array.from({ length: 180 }, (_, i) => cau(`H${i}`))
    const tt = new Map(cs.map((c) => [c.qid, phatLaiCau(c.qid, [], HAN)]))
    const kh = lapKeHoachNgay(cs, tt, { homNay: '2026-10-03', hanNop: HAN })
    expect([kh.khoiLuong, kh.huyetChien]).toEqual([360, true])
  })
  it('P2: 1 + (1 − p) theo tỉ lệ đúng lần đầu của em; câu 2 sao hoặc chưa đủ 20 câu mẫu ⇒ 2', () => {
    expect(luotCauMoiTheoTiLe(1, 16, 20)).toBeCloseTo(1.2)
    expect(luotCauMoiTheoTiLe(0, 5, 19)).toBe(2)
    expect(luotCauMoiTheoTiLe(2, 20, 20)).toBe(2)
    const cs = Array.from({ length: 180 }, (_, i) => cau(`H${i}`))
    const tt = new Map(cs.map((c) => [c.qid, phatLaiCau(c.qid, [], HAN)]))
    const kh = lapKeHoachNgay(cs, tt, { homNay: '2026-10-03', hanNop: HAN, luotCauMoi: () => luotCauMoiTheoTiLe(1, 16, 20) })
    expect(kh.khoiLuong).toBeCloseTo(216)
    expect(kh.huyetChien).toBe(true) // 216 > 0,9 × 5 × 40
  })
})

describe('máy chủ đọc số sao của câu từ kho game', () => {
  it('docMetaCau có `sao`; docSaoCau trả câu có sao > 0 (lớn nhất nếu câu ở nhiều tờ)', async () => {
    const d = taoD1That()
    const env = d.env as unknown as Env
    const st = d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)')
    const j = (qid: string, sao: number | null) => JSON.stringify({ qid, phan: 'I', mucDo: 'Vận dụng cao', tenDang: 'X', sao })
    st.run('DE1', 'Q1', 'v1', 'g1', 'X', j('Q1', 2))
    st.run('DE1', 'Q2', 'v1', 'g2', 'X', j('Q2', null))
    st.run('DE1', 'Q3', 'v1', 'g3', 'X', j('Q3', 1))
    st.run('DE2', 'Q3', 'v1', 'g3', 'X', j('Q3', 2))
    const meta = await docMetaCau(env, ['Q1', 'Q2'])
    expect([meta.get('Q1')!.sao, meta.get('Q2')!.sao]).toEqual([2, 0])
    const sao = await docSaoCau(env, ['Q1', 'Q2', 'Q3'])
    expect(Object.fromEntries(sao)).toEqual({ Q1: 2, Q3: 2 })
  })
})
