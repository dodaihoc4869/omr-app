// @vitest-environment node
// 06/10 (thầy: em khối 10 nhận câu "Đốt cháy chất hữu cơ X — Tìm công thức phân tử" của khối 11): câu NỀN (nen:sinh.<nhãn>.<số>) phải theo khối em.
import { describe, expect, it } from 'vitest'
import { KHOI_TOI_THIEU_NEN, TEN_NEN, nenHopKhoi } from '../server/src/thang-tu-go'
import { taoCauChanDoan, type DuLieuChanDoan } from '../server/src/chan-doan-buoc-sai'
import type { PrivateQuestion } from '../src/game/than-thu-v2/core'

describe('nhãn nền theo khối', () => {
  it('bảng khối chỉ chứa nhãn có thật', () => {
    for (const k of Object.keys(KHOI_TOI_THIEU_NEN)) expect(TEN_NEN[k], k).toBeTruthy()
  })
  it('nenHopKhoi: hữu cơ ≥ 11, điện hoá ≥ 12, nhãn chung từ 10; không rõ khối ⇒ chỉ nhãn khối 10', () => {
    expect(nenHopKhoi('cong_thuc_phan_tu', 10)).toBe(false)
    expect(nenHopKhoi('cong_thuc_phan_tu', 11)).toBe(true)
    expect(nenHopKhoi('the_dien_cuc_pin', 11)).toBe(false)
    expect(nenHopKhoi('the_dien_cuc_pin', 12)).toBe(true)
    expect(nenHopKhoi('doi_mol_khoi_luong', 10)).toBe(true)
    expect(nenHopKhoi('cong_thuc_phan_tu', null)).toBe(false)
    expect(nenHopKhoi('doi_mol_khoi_luong', null)).toBe(true)
  })
  it('chẩn đoán: câu lỗi khối 10 gắn nhãn công thức phân tử ⇒ rơi sang nhãn khối 10; khối 11 ⇒ được dùng', () => {
    const q = (maDe: string) => ({ qid: 'Q1', maDe, version: 'v1', group: 'g', phan: 'I', text: 't', choices: ['a', 'b', 'c', 'd'], ideas: [], hinhAnh: [], dang: 'D1', tenDang: 'D1', mucDo: 'TH', sao: 1, kienThuc: [], correct: 'B', reviewed: true, solution: { chot: 'x' } }) as unknown as PrivateQuestion
    const du: DuLieuChanDoan = { q: new Map([['Q1', { qid: 'Q1', phan: 'I', maDang: 'D1', mucDo: 'TH', vkn: ['dang:D1', 'nen:cong_thuc_phan_tu', 'nen:doi_mol_khoi_luong'], nguon: 'thay' }]]) as never, p: {}, khai: [], y: [], }
    const nhan = (k: string) => taoCauChanDoan(du, 'Q1', q(k), 'S1|Q1|d|chan_doan', new Set())?.khoa
    expect(nhan('DH-10-C1-B1')).toBe('nen:doi_mol_khoi_luong')
    expect(['nen:cong_thuc_phan_tu', 'nen:doi_mol_khoi_luong']).toContain(nhan('DH-11-C1-B1'))
    // Chỉ còn nhãn khối 11 trong vốn kiến thức nền: khối 10 không có câu nền nào để chèn
    const du2: DuLieuChanDoan = { ...du, q: new Map([['Q1', { qid: 'Q1', phan: 'I', maDang: 'D1', mucDo: 'TH', vkn: ['nen:cong_thuc_phan_tu'], nguon: 'thay' }]]) as never }
    expect(taoCauChanDoan(du2, 'Q1', q('DH-10-C1-B1'), 'S1|Q1|d|chan_doan', new Set())?.khoa ?? null).toBeNull()
    expect(taoCauChanDoan(du2, 'Q1', q('DH-11-C1-B1'), 'S1|Q1|d|chan_doan', new Set())?.khoa).toBe('nen:cong_thuc_phan_tu')
  })
})
