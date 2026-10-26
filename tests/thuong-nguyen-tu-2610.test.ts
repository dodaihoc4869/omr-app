// @vitest-environment node
// THƯỞNG PHẠT 26/10 — NGUYÊN TỬ (DAC-TA-THUONG-PHAT-2610.md §4.1, LUAT-THUONG-PHAT.md): bảng luật câu / bài, câu không được tính = 0, tự sửa = 0 (chặn
// «đúng đầu ngày», «lên bậc», «khắc phục»), kiểm tra / ca thi hoàn thành +30 cố định; lệnh `answer` trả `thuong` + `ketBai` trên D1 thật.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import worker from '../server/src/index'
import { ketBaiNguyenTu, nguyenTuCau, tinhExp, type SuKienExp, type VaoTinhExp } from '../server/src/exp-hoc-tap'
import { cauKhongDuocTinh } from '../server/src/thuong-luat'
import { tinhThuongTraLoi } from '../server/src/thuong-tra-loi'
import { taoKhoOmni, themChienDich } from './omni-3-ke-hoach-chung'
import { dongBoGoi7 } from '../server/src/goi-bai-7'
import { SQL_BANG_HANH_TRINH } from '../server/src/hanh-trinh-hop-nhat'
import { damBaoBangBaiDaDay, xoaDemPhamVi } from '../server/src/bai-da-day'
import { xoaDemChienDich, xoaDemMetaCau } from '../server/src/srs2-d1'
import { xoaDemCaBaoVe } from '../server/src/game-v2-bank'
import { xoaDemChanKhoi } from '../server/src/chan-khac-khoi'
import { gameToken } from '../server/src/game-v2-auth'
import type { Env } from '../server/src/kieu'

const NGAY = '2026-10-26'
const luc = (phut: number) => new Date(Date.parse(`${NGAY}T02:00:00.000Z`) + phut * 60_000).toISOString()
const sk = (qid: string, ketQua: 0 | 1 | null, o: Partial<SuKienExp> = {}, phut = 1): SuKienExp => ({ khoa: `${qid}|${phut}|${o.nguon ?? 'luyen'}`, nguon: 'luyen', maNguon: 'M', qid, lan: 1, ketQua, luc: luc(phut), ...o })
const vao = (o: Partial<VaoTinhExp> = {}): VaoTinhExp => ({
  ngay: NGAY, suKien: [], metaCau: {}, mucTieuCau: 10, lenBac: [], khacPhuc: [], dangRoiYeu: [], loXong: [], baiBtvnNop: [], momXong: [], diemCa: [],
  datNgay: null, daCoKhoa: new Set(), ngayTruocGanNhat: null, troLaiGanNhat: null, ...o,
} as VaoTinhExp)

describe('bảng luật câu (nguyenTuCau)', () => {
  it('đúng tự làm 10 · có hỗ trợ 5 (giữ chuỗi, không cộng) · sai nghiêm túc 2 (đứt chuỗi) · câu khó +5', () => {
    expect(nguyenTuCau({ dung: true, hoTro: false, khongTinh: false, cauKho: false, chuoiTruoc: 0 })).toMatchObject({ tinh: true, nguyenTu: 10, chuoiDung: 1 })
    expect(nguyenTuCau({ dung: true, hoTro: true, khongTinh: false, cauKho: true, chuoiTruoc: 4 })).toMatchObject({ nguyenTu: 5, chuoiDung: 4 })
    expect(nguyenTuCau({ dung: false, hoTro: false, khongTinh: false, cauKho: true, chuoiTruoc: 7 })).toMatchObject({ nguyenTu: 2, chuoiDung: 0, dong: [{ nhan: 'Làm nghiêm túc', so: 2 }] })
    expect(nguyenTuCau({ dung: true, hoTro: false, khongTinh: false, cauKho: true, chuoiTruoc: 0 }).nguyenTu).toBe(15)
  })
  it('chuỗi đúng ≥ 3: +2 mỗi câu; ≥ 5: +5 mỗi câu, nhãn «Phản ứng dây chuyền!»', () => {
    const c = (truoc: number) => nguyenTuCau({ dung: true, hoTro: false, khongTinh: false, cauKho: false, chuoiTruoc: truoc })
    expect(c(1).nguyenTu).toBe(10)
    expect(c(2)).toMatchObject({ nguyenTu: 12, chuoiDung: 3 })
    expect(c(3).dong).toContainEqual({ nhan: 'Chuỗi đúng 4', so: 2 })
    expect(c(4)).toMatchObject({ nguyenTu: 15, chuoiDung: 5 })
    expect(c(4).dong).toContainEqual({ nhan: 'Phản ứng dây chuyền!', so: 5 })
  })
  it('vòng Làm lại đúng = ĐÚNG 3 (không câu khó, không thưởng chuỗi), sai = 2', () => {
    expect(nguyenTuCau({ dung: true, hoTro: true, khongTinh: false, cauKho: true, chuoiTruoc: 6, lamLai: true })).toMatchObject({ nguyenTu: 3, dong: [{ nhan: 'Làm lại đúng', so: 3 }] })
  })
  it('câu KHÔNG được tính (Mức làm Bấm vội / treo máy) = 0, đứt chuỗi, chỉ `tinh: false` — không một chữ lười', () => {
    const r = nguyenTuCau({ dung: true, hoTro: false, khongTinh: true, cauKho: true, chuoiTruoc: 9 })
    expect(r).toEqual({ tinh: false, nguyenTu: 0, dong: [], chuoiDung: 0, cauKho: true })
  })
  it('Mức làm: sai nhanh hơn thời gian đọc = không được tính; ĐÚNG nhanh («Thuộc») vẫn tính; thiếu số đo không phạt', () => {
    const d = { giay: 2, soTu: 60, coHinh: false, phan: 'I', dh: 1 as const }
    expect(cauKhongDuocTinh(d, false)).toBe(true)
    expect(cauKhongDuocTinh(d, true)).toBe(false)
    expect(cauKhongDuocTinh({ ...d, giay: 90 }, false)).toBe(false)
    expect(cauKhongDuocTinh(null, false)).toBe(false)
    expect(cauKhongDuocTinh({ ...d, giay: null }, false)).toBe(false)
  })
})

describe('luật bài (ketBaiNguyenTu)', () => {
  const dung = (truoc: number, kho = false) => ({ dung: true, hoTro: false, thuong: nguyenTuCau({ dung: true, hoTro: false, khongTinh: false, cauKho: kho, chuoiTruoc: truoc }) })
  it('6/6 đúng tự làm ⇒ Hoàn hảo +20, tách câu đúng · câu khó · chuỗi đúng', () => {
    const k = ketBaiNguyenTu([dung(0), dung(1, true), dung(2), dung(3), dung(4), dung(5)], 240)
    expect(k.hoanHao).toBe(true)
    expect(k.dong).toEqual([{ nhan: 'Câu đúng', so: 60 }, { nhan: 'Câu khó', so: 5 }, { nhan: 'Chuỗi đúng', so: 2 + 2 + 5 + 5 }, { nhan: 'Hoàn hảo', so: 20 }])
    expect(k).toMatchObject({ soDung: 6, soCau: 6, chinhXac: 100, giay: 240, chuoiMax: 6, khoDung: 1 })
  })
  it('sai 1 câu ⇒ mất hoàn hảo; câu có hỗ trợ cũng mất hoàn hảo', () => {
    const sai = { dung: false, hoTro: false, thuong: nguyenTuCau({ dung: false, hoTro: false, khongTinh: false, cauKho: false, chuoiTruoc: 0 }) }
    expect(ketBaiNguyenTu([dung(0), dung(1), sai, dung(0), dung(1), dung(2)], 100).hoanHao).toBe(false)
    const ht = { dung: true, hoTro: true, thuong: nguyenTuCau({ dung: true, hoTro: true, khongTinh: false, cauKho: false, chuoiTruoc: 0 }) }
    expect(ketBaiNguyenTu([dung(0), dung(1), ht, dung(2), dung(3), dung(4)], 100).hoanHao).toBe(false)
  })
  it('tinhThuongTraLoi: câu cuối của phiên ⇒ ketBai; câu làm lại (lamLaiCuoi) = 3 dù máy chủ ép có hỗ trợ', () => {
    const qs = ['a', 'b', 'c'].map((qid) => ({ qid }))
    const r1 = tinhThuongTraLoi({ session: { questions: [...qs, { qid: 'x', lamLaiCuoi: true }], hocTap: 1, nt: [] }, qid: 'x', dung: true, hoTro: true, khongTinh: false, cau: {}, chuoiTruoc: 0, giay: 20, nowMs: 0 })
    expect(r1.thuong.nguyenTu).toBe(3)
    expect(r1.ketBai).toBeUndefined()
    const nt = r1.nt
    const r2 = tinhThuongTraLoi({ session: { questions: qs, hocTap: 1, nt: [...nt, { q: 'a', n: 10, d: 1, h: 0, t: 1, k: 0, c: 1, g: 30 }, { q: 'b', n: 10, d: 1, h: 0, t: 1, k: 0, c: 2, g: 30 }].filter((x) => x.q !== 'x') }, qid: 'c', dung: true, hoTro: false, khongTinh: false, cau: {}, chuoiTruoc: 2, giay: 30, nowMs: 0 })
    expect(r2.ketBai).toMatchObject({ hoanHao: true, soCau: 3, giay: 90 })
    expect(r2.thuongBai).toBe(20)
  })
})

describe('tinhExp: luật mới vào sổ EXP (sai +2, hỗ trợ +5, vội 0, tự sửa 0, thi +30)', () => {
  it('câu đúng KHÔNG được tính ⇒ không khoản; có hỗ trợ ⇒ +5; sai nghiêm túc ⇒ +2 một lần mỗi câu mỗi ngày; sai không được tính ⇒ 0', () => {
    const r = tinhExp(vao({ suKien: [sk('A', 1, { khongTinh: true }), sk('B', 1, { hoTro: true }), sk('C', 0, {}, 2), sk('C', 0, {}, 3), sk('D', 0, { khongTinh: true })] }))
    const k = Object.fromEntries(r.khoan.filter((x) => x.loai === 'cau' || x.loai === 'cau_sai').map((x) => [x.khoa, x.exp]))
    expect(k).toEqual({ [`cau|B|${NGAY}`]: 5, [`sai|C|${NGAY}`]: 2 })
    expect(r.khoan.find((x) => x.khoa === `cau|B|${NGAY}`)!.ghiChu.startsWith('Câu đúng có hỗ trợ')).toBe(true)
  })
  it('ca thi: không có khoản «sai» (thi có thưởng hoàn thành riêng) và +30 cố định không phụ thuộc điểm; kiểm tra cá nhân cũng +30', () => {
    const r = tinhExp(vao({ suKien: [sk('T', 0, { nguon: 'thi' })], diemCa: [{ maCa: 'C1', lanThu: 1, diem: 2.5, luc: luc(5) }, { maCa: 'ktcn:K1', lanThu: 1, diem: 0, luc: luc(6) }] }))
    expect(r.khoan.filter((x) => x.loai === 'cau_sai')).toEqual([])
    expect(r.khoan.filter((x) => x.loai === 'diem_ca').map((x) => [x.khoa, x.exp, x.ghiChu])).toEqual([
      ['diem|C1|1', 30, 'Hoàn thành ca thi: +30'], ['diem|ktcn:K1|1', 30, 'Hoàn thành kiểm tra cá nhân: +30'],
    ])
  })
  it('TỰ SỬA = 0 mọi đường: không mở «câu đúng đầu ngày», không «lên bậc», không «khắc phục» khi lần đúng đầu trong ngày là tự sửa', () => {
    const r = tinhExp(vao({
      suKien: [sk('Q', 1, { nguon: 'chua_loi' }, 1)],
      lenBac: ['Q'], khacPhuc: [{ qid: 'Q', lan: 1, luc: luc(2) }],
    }))
    expect(r.khoan.map((x) => x.loai)).toEqual([])
  })
  it('câu đúng đầu ngày vẫn mở bằng câu tự làm được tính (không phải câu vội)', () => {
    const r = tinhExp(vao({ suKien: [sk('V', 1, { khongTinh: true }, 1), sk('W', 1, {}, 2)] }))
    const dau = r.khoan.find((x) => x.loai === 'dau_ngay')
    if (dau) expect(dau.luc).toBe(luc(2))
  })
})

// --- Lệnh answer thật (Gói 7, D1 thật) ------------------------------------------------------------------
const NOW = Date.parse('2026-10-12T13:30:00Z')
beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(NOW) })
afterEach(() => { vi.useRealTimers(); xoaDemPhamVi(); xoaDemChienDich(); xoaDemCaBaoVe(); xoaDemChanKhoi(); xoaDemMetaCau() })

async function kho() {
  const k = taoKhoOmni({ 'DH-B8': 24 }, 3)
  for (const q of SQL_BANG_HANH_TRINH) k.d.sql.exec(q)
  await damBaoBangBaiDaDay(k.env)
  const b8 = k.qids('DH-B8')
  k.d.sql.exec(`UPDATE hoc_sinh SET lop='12', ten_lop=NULL, mat_khau='mk';
    INSERT INTO de_kho(ma_de,ten_de,so_cau,da_xoa,cap_nhat_luc) VALUES('DH-B8','Bài 8. Amine',24,0,'v1');
    INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('DH-B8','v1','x');
    INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('goi_bai_7_v1','{"bat":true,"batDau":"2026-10-10"}','x')`)
  k.d.sql.prepare('INSERT INTO bai_da_day(id,lop,khoa_bai,ten_bai,vi_tri,ma_to_json,tick_luc) VALUES(?,?,?,?,?,?,?)')
    .run('amine', '12 - Lớp Thường', 'B8', 'Bài 8. Amine', 8, '["DH-B8"]', '2026-10-11T11:00:00Z')
  themChienDich(k.d, { id: 'hanh-trinh-v3-khoi-12', qids: b8, maDe: ['DH-B8'], sbd: ['S1'], hanNop: '9999-12-31', taoLuc: '2026-10-01T00:00:00Z', theLuc: 24, huyetChien: false })
  await dongBoGoi7(k.env, NOW)
  return { ...k, token: await gameToken(k.env, 'S1') }
}
async function goi(env: Env, token: string, lenh: string, than: Record<string, unknown>) {
  const viec: Promise<unknown>[] = []
  const ctx = { waitUntil: (p: Promise<unknown>) => { viec.push(p) }, passThroughOnException() {} }
  const res = await worker.fetch(new Request(`https://test/game-v2/${lenh}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...than, token }) }), env, ctx as never)
  await Promise.allSettled(viec)
  return (await res.json()) as Record<string, unknown>
}
const dapAnDung = (phan: string) => (phan === 'I' ? 'B' : phan === 'II' ? 'DSDS' : '4')
const dapAnSai = (phan: string) => (phan === 'I' ? 'A' : phan === 'II' ? 'DSDD' : '7')
const LUOI = /vội|treo|đối phó|doi_pho|bam_voi|lười|ĐUỔI|muc_lam|mucLam/i

describe('lệnh answer của chặng Gói 7 (D1 thật)', () => {
  it('mỗi câu có `thuong`; câu cuối có `ketBai` (hoàn hảo +20, mục tiêu ngày); JSON phiên giữ nguyên tử từng câu; ghi một dòng bài xong', async () => {
    const k = await kho()
    const s = await goi(k.env, k.token, 'hoc-tap-start', {})
    expect(s.ok).toBe(true)
    const qs = s.questions as { qid: string; phan: string }[]
    expect(qs.length).toBeGreaterThan(0)
    let cuoi: Record<string, unknown> = {}
    for (let i = 0; i < qs.length; i++) {
      vi.setSystemTime(NOW + 60_000 * (i + 1))
      cuoi = await goi(k.env, k.token, 'answer', { session: s.id, qid: qs[i]!.qid, answer: dapAnDung(qs[i]!.phan), assisted: false, msLam: 40_000 })
      expect(cuoi.ok, JSON.stringify(cuoi).slice(0, 300)).toBe(true)
      const t = cuoi.thuong as { tinh: boolean; nguyenTu: number; chuoiDung: number }
      expect(t.tinh).toBe(true)
      expect(t.chuoiDung).toBe(i + 1)
      expect(t.nguyenTu).toBeGreaterThanOrEqual(10)
      if (i < qs.length - 1) expect(cuoi.ketBai).toBeUndefined()
    }
    const kb = cuoi.ketBai as { hoanHao: boolean; soCau: number; soDung: number; tong: number; mucTieu: { daXong: number; can: number }; dong: { nhan: string; so: number }[] }
    expect(kb.soCau).toBe(qs.length)
    expect(kb.soDung).toBe(qs.length)
    expect(kb.hoanHao).toBe(qs.length >= 3)
    expect(kb.mucTieu.daXong).toBe(1)
    expect(kb.mucTieu.can).toBeGreaterThanOrEqual(1)
    const dong = k.d.sql.prepare('SELECT so_cau, so_dung, hoan_hao FROM thuong_bai_xong WHERE em = ? AND phien = ?').get('S1', s.id as string) as Record<string, number>
    expect(dong).toMatchObject({ so_cau: qs.length, so_dung: qs.length })
    const nt = JSON.parse((k.d.sql.prepare('SELECT json FROM game_v2_session WHERE id = ?').get(s.id as string) as { json: string }).json).nt as unknown[]
    expect(nt.length).toBe(qs.length)
    // Nộp lại câu cuối (mất mạng) ⇒ trả đúng phần thưởng cũ, không ghi đôi.
    const lai = await goi(k.env, k.token, 'answer', { session: s.id, qid: qs[qs.length - 1]!.qid, answer: dapAnDung(qs[qs.length - 1]!.phan), assisted: false, msLam: 40_000 })
    expect(lai.replayed).toBe(true)
    expect((lai.thuong as { nguyenTu: number }).nguyenTu).toBe((cuoi.thuong as { nguyenTu: number }).nguyenTu)
    expect((k.d.sql.prepare('SELECT COUNT(*) AS n FROM thuong_bai_xong WHERE em = ?').get('S1') as { n: number }).n).toBe(1)
  })
  it('câu sai nhanh hơn thời gian đọc ⇒ `thuong.tinh: false`, nguyên tử 0; câu sai làm nghiêm túc ⇒ +2; phản hồi không có chữ lười', async () => {
    const k = await kho()
    const s = await goi(k.env, k.token, 'hoc-tap-start', {})
    const qs = s.questions as { qid: string; phan: string }[]
    const voi = await goi(k.env, k.token, 'answer', { session: s.id, qid: qs[0]!.qid, answer: dapAnSai(qs[0]!.phan), assisted: false, doGiay: { g: 1, t: 80, h: 0, p: qs[0]!.phan } })
    expect(voi.ok).toBe(true)
    expect(voi.thuong).toEqual({ tinh: false, nguyenTu: 0, dong: [], chuoiDung: 0, cauKho: expect.any(Boolean) })
    const ngTuc = await goi(k.env, k.token, 'answer', { session: s.id, qid: qs[1]!.qid, answer: dapAnSai(qs[1]!.phan), assisted: false, msLam: 60_000 })
    expect((ngTuc.thuong as { nguyenTu: number }).nguyenTu).toBe(2)
    expect(JSON.stringify(voi.thuong)).not.toMatch(LUOI)
  })
})
