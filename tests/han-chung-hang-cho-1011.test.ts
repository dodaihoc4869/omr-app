// @vitest-environment node
// HẠN CHUNG THEO HÀNG CHỜ + ĐỀ 28 SUẤT (thầy 10/11: «Tôi chỉ giao bài. Máy tự động tính toán một hạn tối ưu cho tất cả học sinh, có đầy đủ kế hoạch cho hết hạn
// chưa giao hoặc giao sớm hơn đảm bảo học sinh luôn được làm hết câu mới, ôn tập sửa lỗi … Dù thay đổi là gì thì mỗi ngày luôn là 28 câu»).
// Khoá: (1) số ngày Học mới theo phần 18 · 4 · 6; (2) hạn tính cả hàng chờ của từng em, phân vị 90 %, không sớm hơn hạn bài đang dở; (3) giao sớm ⇒ bài mới
// xếp sau, hạn dài ra, mỗi ngày vẫn 28 câu đúng 18/4/6, bài cũ làm trước; (4) hết hạn chưa giao bài mới ⇒ vẫn 28 câu (câu mới còn dở / câu sai / ôn).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { taoKhoOmni, themChienDich, lam } from './omni-3-ke-hoach-chung'
import { dongBoGoi7, lapGoi7 } from '../server/src/goi-bai-7'
import { hanChung, hanChungLop, docHangCho, ngayMoiTheoPhan, demTheoPhan, TRAN_HAN_HANG_CHO, type NangLucEm } from '../server/src/han-chung'
import { damBaoBangBaiDaDay, xoaDemPhamVi } from '../server/src/bai-da-day'
import { xoaDemChienDich } from '../server/src/srs2-d1'
import { xoaDemCaBaoVe } from '../server/src/game-v2-bank'
import { xoaMoiDem } from '../server/src/dem-chung'

const KHA: NangLucEm = { biet: 0.92, hieu: 0.8, van_dung: 0.6 }

describe('số ngày Học mới theo đề 28 suất', () => {
  it('phần dồn câu nhất quyết định (số câu thật 10/11)', () => {
    expect(ngayMoiTheoPhan({ I: 72, II: 16, III: 24 })).toBe(4) // bài 112 câu cân đối: như ⌈112 / 28⌉
    expect(ngayMoiTheoPhan({ I: 65, II: 25, III: 20 })).toBe(7) // Bài 10. Protein và enzyme: 25 câu Đúng/Sai ÷ 4 suất/ngày
    expect(ngayMoiTheoPhan({ I: 86, II: 26, III: 39 })).toBe(7) // Bài 9. Amino acid (P1)
    expect(ngayMoiTheoPhan({ I: 0, II: 0, III: 0 })).toBe(1)
    expect(demTheoPhan([{ phan: 'I' }, { phan: 'II' }, { phan: 'II', hopLe: false }, { phan: 'III' }, { phan: null }])).toEqual({ I: 2, II: 1, III: 1 })
  })
})

describe('hanChung — luật 10/11 (số câu theo phần + hàng chờ)', () => {
  const lop10 = Array.from({ length: 10 }, () => KHA)
  it('truyền SỐ ⇒ luật 09/11 nguyên vẹn; truyền theo phần ⇒ M theo phần', () => {
    expect(hanChung(110, lop10).M).toBe(4)
    const moi = hanChung({ I: 65, II: 25, III: 20 }, lop10)
    expect(moi.M).toBe(7)
    expect(moi.T).toBeGreaterThanOrEqual(moi.M + 2)
    expect(moi.T).toBeGreaterThan(hanChung(110, lop10).T)
  })
  it('hàng chờ (giao sớm khi bài cũ chưa xong) làm hạn dài ra đúng bằng số ngày phải làm thêm', () => {
    const bai = { I: 72, II: 16, III: 24 }
    const khong = hanChung(bai, lop10)
    const cho = lop10.map(() => ({ I: 36, II: 8, III: 12, goi: 1, han: '' })) // mỗi em còn 2 ngày câu mới của bài trước
    const co = hanChung(bai, lop10, cho)
    expect(co.M).toBe(khong.M) // M là của riêng bài này
    expect(co.T).toBeGreaterThanOrEqual(khong.T + 3) // + 2 ngày Học mới + 1 ngày Kiểm tra ôn tập của bài còn dở (ngày Sửa dự báo có thể thêm)
  })
  it('một hạn cho cả lớp = phân vị 90 %: 1/10 em tồn nhiều không kéo cả lớp, 2/10 thì kéo', () => {
    const bai = { I: 72, II: 16, III: 24 }, nang = { I: 180, II: 40, III: 60, goi: 2, han: '' }
    const goc = hanChung(bai, lop10).T
    const mot = hanChung(bai, lop10, lop10.map((_, i) => (i === 0 ? nang : null)))
    const hai = hanChung(bai, lop10, lop10.map((_, i) => (i < 2 ? nang : null)))
    expect(mot.T).toBe(goc)
    expect(mot.duKienXong).toBe(9)
    expect(hai.T).toBeGreaterThan(goc)
    expect(hai.duKienXong).toBe(10)
  })
  it('không sớm hơn hạn của bài đang dở; trần 42 ngày', () => {
    const bai = { I: 18, II: 4, III: 6 }
    expect(hanChung(bai, lop10, [], 15).T).toBe(15)
    expect(hanChung({ I: 1800, II: 400, III: 600 }, lop10).T).toBe(TRAN_HAN_HANG_CHO)
  })
})

describe('giao bài trên D1 giả — hàng chờ, giao sớm, hết hạn chưa giao', () => {
  const NOW = Date.parse('2026-11-11T02:00:00Z') // 09:00 Thứ Tư 11/11 giờ VN
  const NGAY_MS = 86_400_000
  beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(NOW) })
  afterEach(() => { vi.useRealTimers(); xoaDemPhamVi(); xoaDemChienDich(); xoaDemCaBaoVe(); xoaMoiDem() })
  async function kho() {
    const k = taoKhoOmni({ 'DH-B8': 127, 'DH-B9': 90 })
    await damBaoBangBaiDaDay(k.env)
    k.d.sql.exec(`INSERT INTO de_kho(ma_de,ten_de,so_cau,da_xoa,cap_nhat_luc) VALUES('DH-B8','Bài 8. Amine',127,0,'v1'),('DH-B9','Bài 9. Amino acid',90,0,'v1');
      INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('DH-B8','v1','x'),('DH-B9','v1','x');
      INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('goi_bai_7_v1','{"bat":true,"batDau":"2026-11-05"}','x')`)
    themChienDich(k.d, { id: 'hanh-trinh-v3-khoi-12', qids: [...k.qids('DH-B8'), ...k.qids('DH-B9')], maDe: ['DH-B8', 'DH-B9'], sbd: ['S1'], hanNop: '9999-12-31', taoLuc: '2026-10-01T00:00:00Z', theLuc: 24, huyetChien: false })
    const tick = (id: string, bai: string, ten: string, vt: number, luc: string) => k.d.sql.prepare('INSERT INTO bai_da_day(id,lop,khoa_bai,ten_bai,vi_tri,ma_to_json,tick_luc) VALUES(?,?,?,?,?,?,?)')
      .run(id, '12A1', bai, ten, vt, JSON.stringify([`DH-${bai}-TN`, `DH-${bai}-DS`, `DH-${bai}-TLN`]), luc)
    return { ...k, tick }
  }
  const goi = (k: Awaited<ReturnType<typeof kho>>) => k.d.sql.prepare('SELECT id,ten,bat_dau,han FROM goi_bai_7 ORDER BY bat_dau,id').all() as { id: string; ten: string; bat_dau: string; han: string }[]
  const phanCua = (k: Awaited<ReturnType<typeof kho>>, ids: readonly string[]) => {
    const p = new Map((k.d.sql.prepare("SELECT qid, json_extract(json,'$.phan') p FROM game_v2_question").all() as { qid: string; p: string }[]).map((r) => [r.qid, r.p]))
    return ['I', 'II', 'III'].map((x) => ids.filter((q) => p.get(q.replace(/~.*$/, '')) === x).length)
  }

  it('hàng chờ = câu mới CHƯA gặp theo phần của bài đã giao; em đã làm bớt thì hàng chờ ngắn đi', async () => {
    const k = await kho()
    k.tick('amine', 'B8', 'Bài 8. Amine', 8, '2026-11-09T11:00:00Z')
    await dongBoGoi7(k.env, NOW - NGAY_MS)
    const truoc = await docHangCho(k.env, ['S1', 'S2'], NOW)
    const tong = (h: (typeof truoc)[number]) => h!.I + h!.II + h!.III
    expect(tong(truoc[0])).toBe(127)
    expect(truoc[0]!.goi).toBe(1)
    const lap = await lapGoi7(k.env, 'S1', NOW)
    for (const v of lap!.plan.viec) await lam(k.env, 'S1', v.qid, NOW - 3_600_000, true, { cauVersion: 'v1' })
    const sau = await docHangCho(k.env, ['S1', 'S2'], NOW)
    expect(tong(sau[0])).toBe(127 - 28)
    expect(tong(sau[1])).toBe(127) // em khác không đổi
    expect([truoc[0]!.I - sau[0]!.I, truoc[0]!.II - sau[0]!.II, truoc[0]!.III - sau[0]!.III]).toEqual([18, 4, 6])
  })

  it('GIAO SỚM: bài 9 giao khi bài 8 còn dở ⇒ hạn bài 9 sau hạn bài 8 và dài hơn khi giao một mình; mỗi ngày vẫn 28 câu 18/4/6, bài 8 làm trước', async () => {
    const k = await kho()
    k.tick('amine', 'B8', 'Bài 8. Amine', 8, '2026-11-09T11:00:00Z')
    await dongBoGoi7(k.env, NOW - NGAY_MS)
    const motMinh = (await hanChungLop(k.env, [], demTheoPhan((k.d.sql.prepare("SELECT json_extract(json,'$.phan') phan FROM game_v2_question WHERE ma_de='DH-B9' AND COALESCE(json_extract(json,'$.tuLuan'),0)=0").all() as { phan: string }[])), NOW)).T
    k.tick('aa', 'B9', 'Bài 9. Amino acid', 9, '2026-11-11T01:00:00Z')
    await dongBoGoi7(k.env, NOW, 2, '', true)
    const g = goi(k)
    expect(g.map((x) => x.ten)).toEqual(['Bài 8. Amine', 'Bài 9. Amino acid'])
    expect(g[1]!.han > g[0]!.han).toBe(true)
    const ngayB9 = Math.round((Date.parse(g[1]!.han) - Date.parse(g[1]!.bat_dau)) / NGAY_MS) + 1
    expect(ngayB9).toBeGreaterThan(motMinh) // cả lớp còn nguyên bài 8 ⇒ bài 9 phải chờ
    xoaMoiDem()
    const lap = await lapGoi7(k.env, 'S1', NOW)
    expect(lap!.plan.viec).toHaveLength(28)
    expect(phanCua(k, lap!.plan.viec.map((v) => v.qid))).toEqual([18, 4, 6])
    expect(lap!.plan.viec.every((v) => v.qid.startsWith('DH-B8'))).toBe(true) // bài hạn gần trước
  })

  it('HẾT HẠN, CHƯA GIAO BÀI MỚI: em còn câu mới vẫn là ngày Học mới 28 câu; em đã hết câu mới vẫn đủ 28 câu ôn đúng 18/4/6', async () => {
    const k = await kho()
    k.tick('amine', 'B8', 'Bài 8. Amine', 8, '2026-11-09T11:00:00Z')
    await dongBoGoi7(k.env, NOW - NGAY_MS)
    const han = goi(k)[0]!.han
    const SAU = Date.parse(`${han}T02:00:00Z`) + 5 * NGAY_MS // 5 ngày sau hạn
    vi.setSystemTime(SAU)
    xoaMoiDem()
    // 11/11 (nợ câu áp cho mọi em từ 11/11): ca này kiểm CẤU TRÚC đề khi hết hạn, không kiểm nợ ⇒ cho S1 một sổ nợ sạch, đã chốt tới hôm qua (em không vắng ngày nào)
    k.d.sql.prepare("INSERT INTO goi_bai_7_no_em(sbd,no,lan,loai_json,den_ngay,luc) VALUES('S1',0,0,'{}',?,'x')").run(new Date(SAU - NGAY_MS + 7 * 3_600_000).toISOString().slice(0, 10))
    const conDo = await lapGoi7(k.env, 'S1', SAU)
    expect(conDo!.loaiNgay).toBe('moi')
    expect(conDo!.plan.viec).toHaveLength(28)
    expect(phanCua(k, conDo!.plan.viec.map((v) => v.qid))).toEqual([18, 4, 6])
    // S1 làm đúng hết 127 câu của bài từ nhiều ngày trước ⇒ không còn câu mới, không lỗi
    let i = 0
    for (const q of k.qids('DH-B8')) await lam(k.env, 'S1', q, SAU - (20 + (i++ % 5)) * NGAY_MS, true, { cauVersion: 'v1' })
    xoaMoiDem(); xoaDemChienDich()
    vi.setSystemTime(SAU + 60_000)
    const hetMoi = await lapGoi7(k.env, 'S1', SAU + 60_000)
    expect(hetMoi!.plan.viec.every((v) => v.vai === 'on')).toBe(true)
    expect(hetMoi!.plan.viec).toHaveLength(28)
    expect(phanCua(k, hetMoi!.plan.viec.map((v) => v.qid))).toEqual([18, 4, 6])
  })
})
