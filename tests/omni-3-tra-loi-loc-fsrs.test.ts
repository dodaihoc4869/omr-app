// @vitest-environment node
// OMNI 3 · LÀN B3 — (1) LỌC LƯỚT ở mọi bộ đọc sổ đang bỏ 'xem_loi_giai': thêm dòng lướt (purpose 'luot', ket_qua NULL) KHÔNG đổi kết quả;
// không có dòng lướt ⇒ y cũ (bộ test cũ của từng mô-đun giữ xanh). (2) FSRS 4 mức: thiếu tự tin/nhãn tốc độ ⇒ Again/Good y hệt; có ⇒ Hard/Easy.
import { describe, expect, it } from 'vitest'
import { createEmptyCard, fsrs, Rating, type Card } from 'ts-fsrs'
import { taoD1That } from './_d1-that'
import { ghiSuKien, type SuKien } from '../server/src/su-kien-hoc'
import { docSuKienDoc, phatLaiSuKien, xoaBietCotHoTro, type SuKienDoc } from '../server/src/ho-so-nam-kt'
import { docSuKienNL, xoaBietCotChuanNL } from '../server/src/nang-luc-d1'
import { docQidSaiV2 } from '../server/src/hang-chua-loi'
import { gvCauSaiMoCoi } from '../server/src/cau-sai-mo-coi'
import { docCauDaDung } from '../server/src/cau-da-dung'
import { CAU_HINH_FSRS, hangFsrsTu, PHIEN_BAN_FSRS, taoLichOnFsrs } from '../server/src/lich-on-fsrs'
import { MUC_DICH_LUOT } from '../server/src/omni-kieu'
import type { Env } from '../server/src/kieu'

const NGAY = 86_400_000
const T = (ngay: string, gio = '09:00') => Date.parse(`${ngay}T${gio}:00+07:00`)
const sk = (qid: string, ngay: string, ketQua: 0 | 1 | null, them: Partial<SuKien> = {}): SuKien => ({
  nguon: 'game', maNguon: `phien-${qid}-${ngay}-${them.purpose ?? ''}`, sbd: 'S1', qid, lan: 1, ketQua, luc: new Date(T(ngay)).toISOString(), maDang: 'D1', mucDo: 'hieu',
  assistance: 'none', purpose: 'maintenance', receivedAt: T(ngay), raw: { chon: 'A' }, ...them,
})
const GOC: SuKien[] = [
  sk('Q1', '2026-09-30', 0), sk('Q1', '2026-10-01', 1), sk('Q2', '2026-10-01', 0), sk('Q3', '2026-10-02', 1, { nguon: 'luyen' }),
  sk('Q2', '2026-10-02', 0, { nguon: 'thi', maNguon: 'CA1' }),
]
/** Dòng lướt OMNI: câu cũ (lần CUỐI là lướt) và câu chỉ có lướt. */
const LUOT: SuKien[] = [
  sk('Q1', '2026-10-03', null, { purpose: MUC_DICH_LUOT, raw: { chon: 'B', ms: 900, tt: 'chac', td: 'luot' } }),
  sk('Q4', '2026-10-03', null, { purpose: MUC_DICH_LUOT, raw: { chon: 'C', ms: 700, tt: 'chac', td: 'luot' } }),
]
async function dung(ds: SuKien[]) {
  xoaBietCotHoTro(); xoaBietCotChuanNL()
  const d = taoD1That()
  const env = d.env as unknown as Env
  d.sql.exec("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES('S1','An','12A1','mk','x')")
  d.sql.exec("INSERT INTO de_kho(ma_de,ten_de,so_cau,da_xoa,cap_nhat_luc) VALUES('DE1','DE1',4,0,'v1')")
  d.sql.exec("INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('DE1','v1','x')")
  const st = d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)')
  for (const q of ['Q1', 'Q2', 'Q3', 'Q4']) st.run('DE1', q, 'v1', `g-${q}`, 'D1', JSON.stringify({ qid: q, maDe: 'DE1', version: 'v1', group: `g-${q}`, phan: 'I', text: q, choices: ['a', 'b', 'c', 'd'], ideas: [], hinhAnh: [], dang: 'D1', tenDang: 'D1', mucDo: 'hieu', sao: 1, kienThuc: ['k1'], correct: 'B', reviewed: true }))
  d.sql.exec("INSERT INTO ca(ma_ca,ten_ca,trang_thai,bat_dau,het_han_vao,thoi_gian_phut,loai,cong_bo,cap_nhat_luc) VALUES('CA1','Ca 1','dong','2026-10-02T01:00:00Z','2026-10-02T02:00:00Z',45,'thi','ngay','x')")
  const g = await ghiSuKien(env, ds)
  expect(g.ok).toBe(true)
  return { d, env }
}

describe('OMNI 3 · B3 — lọc lướt ở bộ đọc sổ', () => {
  it('dòng lướt có trong sổ (đúng hình dạng máy chủ ghi)', async () => {
    const { d } = await dung([...GOC, ...LUOT])
    expect(d.sql.prepare("SELECT COUNT(*) AS n FROM su_kien_hoc WHERE purpose = 'luot' AND ket_qua IS NULL").get()).toEqual({ n: 2 })
  })
  it('hồ sơ nắm kiến thức (docSuKienDoc + phatLaiSuKien) bỏ dòng lướt', async () => {
    const a = await dung(GOC), b = await dung([...GOC, ...LUOT])
    const da = await docSuKienDoc(a.env, ['S1']), db = await docSuKienDoc(b.env, ['S1'])
    expect(db).toEqual(da)
    expect(phatLaiSuKien(db)).toEqual(phatLaiSuKien(da))
  })
  it('năng lực (docSuKienNL) bỏ dòng lướt', async () => {
    const a = await dung(GOC), b = await dung([...GOC, ...LUOT])
    const ra = await docSuKienNL(a.env, 'S1'), rb = await docSuKienNL(b.env, 'S1')
    expect(rb).toEqual(ra)
    expect(ra.ds.length).toBe(GOC.length)
  })
  it('hàng chữa lỗi (docQidSaiV2), câu sai mồ côi, câu đã đúng: thêm dòng lướt không đổi kết quả', async () => {
    const a = await dung(GOC), b = await dung([...GOC, ...LUOT])
    expect(await docQidSaiV2(b.env, 'S1')).toEqual(await docQidSaiV2(a.env, 'S1'))
    // Q1: lần tự làm cuối là ĐÚNG (lướt sau đó không phải một lần làm) ⇒ không thành "câu sai bỏ trống"
    const ma = await gvCauSaiMoCoi(a.env, {}), mb = await gvCauSaiMoCoi(b.env, {})
    expect(mb).toEqual(ma)
    expect(await docCauDaDung(b.env, ['S1'])).toEqual(await docCauDaDung(a.env, ['S1']))
  })
})

describe('OMNI 3 · B3 — FSRS 4 mức', () => {
  it('hạng từ tự tin + nhãn tốc độ; thiếu cả hai ⇒ undefined (Again/Good như cũ)', () => {
    expect(hangFsrsTu(1, undefined, undefined)).toBeUndefined()
    expect(hangFsrsTu(0, undefined, null)).toBeUndefined()
    expect(hangFsrsTu(0, 'chac', 'troi_chay')).toBe('again')
    expect(hangFsrsTu(1, 'chua_chac', 'troi_chay')).toBe('hard')
    expect(hangFsrsTu(1, 'chac', 'thuong')).toBe('good')
    expect(hangFsrsTu(1, 'chac', 'cham')).toBe('good')
    expect(hangFsrsTu(1, 'chac', null)).toBe('good')
    expect(hangFsrsTu(1, 'chac', 'troi_chay')).toBe('easy')
    expect(hangFsrsTu(1, undefined, 'troi_chay')).toBe('easy')
    expect(PHIEN_BAN_FSRS).toBe('fsrs6-ts5.4.2-ret0.9-cfg1') // không đổi: sự kiện cũ cho đúng hạng cũ (lý do ở lich-on-fsrs.ts)
  })
  it('vắng hạng ⇒ card y hệt bản cũ (Again/Good thẳng từ ts-fsrs); Hard < Good < Easy; sai luôn Again', () => {
    const on = taoLichOnFsrs()
    const f = fsrs(CAU_HINH_FSRS)
    const l1 = T('2026-10-01'), l2 = T('2026-10-04')
    // tham chiếu bản cũ
    let card: Card = createEmptyCard<Card>(new Date(l1))
    card = f.next(card, new Date(l1), Rating.Good).card
    const goodRef = f.next(card, new Date(l2), Rating.Good).card
    const a1 = on(undefined, l1, 1)
    const vang = on(a1, l2, 1)
    expect(vang.card).toEqual(goodRef)
    expect(on(a1, l2, 1, { hang: undefined }).card).toEqual(goodRef)
    const hard = on(a1, l2, 1, { hang: 'hard' }), good = on(a1, l2, 1, { hang: 'good' }), easy = on(a1, l2, 1, { hang: 'easy' })
    expect(good.card).toEqual(goodRef)
    expect(hard.card.due.getTime()).toBeLessThan(good.card.due.getTime())
    expect(easy.card.due.getTime()).toBeGreaterThan(good.card.due.getTime())
    expect(on(a1, l2, 0, { hang: 'easy' }).card).toEqual(on(a1, l2, 0).card)
    // trong ngày: quan sát ĐẦU quyết định; đúng sau đó không đổi; sai sau đó ⇒ Again trên state đầu ngày (như cũ)
    expect(on(easy, l2 + 3_600_000, 1, { hang: 'hard' })).toBe(easy)
    const saiSau = on(easy, l2 + 3_600_000, 0)
    expect(saiSau.card).toEqual(f.next(card, new Date(l2), Rating.Again).card)
    expect(saiSau.daSai).toBe(true)
  })
  it('hồ sơ nắm kiến thức: sổ có tt/td ⇒ mốc ôn theo 4 mức; thiếu ⇒ y hệt; docSuKienDoc đọc tt/td từ raw', async () => {
    const goc = (them: Partial<SuKienDoc>[]): SuKienDoc[] => ['2026-10-01', '2026-10-04'].map((ngay, i) => ({
      khoa: `k${i}`, sbd: 'S1', qid: 'Q1', nguon: 'game', ketQua: 1, giay: null, luc: new Date(T(ngay)).toISOString(), ngayVn: ngay, maDang: 'D1', chuyenDe: '', assistance: 'none', ...them[i],
    }))
    const moc = (ds: SuKienDoc[]) => phatLaiSuKien(ds).cau[0]!.mocOnKe!
    const vang = moc(goc([{}, {}]))
    expect(moc(goc([{ tuTin: 'chac', nhanTocDo: 'thuong' }, { tuTin: 'chac', nhanTocDo: 'thuong' }]))).toBe(vang) // chắc + bình thường = Good
    expect(moc(goc([{}, { tuTin: 'chac', nhanTocDo: 'troi_chay' }])) > vang).toBe(true) // Easy xa hơn
    expect(moc(goc([{}, { tuTin: 'chua_chac', nhanTocDo: 'thuong' }])) < vang).toBe(true) // Hard gần hơn
    const { env } = await dung([
      sk('Q1', '2026-10-01', 1, { raw: { chon: 'B', ms: 30_000, tt: 'chua_chac', td: 'cham' } }),
      sk('Q2', '2026-10-01', 1),
    ])
    const ds = await docSuKienDoc(env, ['S1'])
    expect(ds.find((x) => x.qid === 'Q1')).toMatchObject({ tuTin: 'chua_chac', nhanTocDo: 'cham' })
    const q2 = ds.find((x) => x.qid === 'Q2')!
    expect('tuTin' in q2 || 'nhanTocDo' in q2).toBe(false)
    void NGAY
  })
})
