// @vitest-environment node
// GĐ 6 phần máy chủ — docs/hop-dong-ho-so-len-bang-1909.md (Code 1): `hoSoLopLenBang` trả thêm `namKt`; `ghiLenBangMoi` ngừng cộng `tien_do_hs`.
import { describe, it, expect } from 'vitest'
import worker from '../server/src/index'
import { docDsQid, DAI_QID_LEN_BANG, TOI_DA_QID_LEN_BANG } from '../server/src/ho-so-len-bang'
import { dungLaiHoSo } from '../server/src/ho-so-nam-kt'
import { ghiSuKien } from '../server/src/su-kien-hoc'
import { goiWorker, taoD1That, type D1That } from './_d1-that'

const H = 3_600_000
const themHs = (d: D1That, ...ds: string[]) => ds.forEach((s) => d.sql.prepare("INSERT OR IGNORE INTO hoc_sinh(sbd,ho_ten,cap_nhat_luc) VALUES(?,'x','x')").run(s))
const goi = (d: D1That, b: Record<string, unknown>) => goiWorker(worker, d.env, '/goi', { action: 'hoSoLopLenBang', ...b }, true)

/** S1 sai Q-ES-01 ba lần (canDayLai) và gặp Q-ES-03 (dạng ES-02); Q-ES-02 cùng dạng ES-02 nhưng S1 CHƯA gặp; S2 chưa có gì. */
async function dung() {
  const d = taoD1That()
  themHs(d, 'S1', 'S2')
  d.sql.prepare("INSERT INTO de_kho(ma_de,ten_de,lop,so_cau,r2_khoa,da_xoa,cap_nhat_luc) VALUES('DE1','DE1','12',3,'kho/DE1.json',0,'v1')").run()
  d.sql.prepare("INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('DE1','v1','x')").run()
  for (const [q, dang] of [['Q-ES-01', 'ES-01'], ['Q-ES-02', 'ES-02'], ['Q-ES-03', 'ES-02']]) {
    d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)').run('DE1', q, 'v', `g-${q}`, dang, '{}')
  }
  const luc = (g: number) => new Date(Date.now() + g * H).toISOString()
  const r = await ghiSuKien(d.env, [
    ...[-96, -72, -48].map((g, i) => ({ nguon: 'btvn' as const, maNguon: `B${i}`, sbd: 'S1', qid: 'Q-ES-01', lan: 1, ketQua: 0 as const, luc: luc(g), maDang: 'ES-01' })),
    { nguon: 'btvn' as const, maNguon: 'B9', sbd: 'S1', qid: 'Q-ES-03', lan: 1, ketQua: 1 as const, luc: luc(-24), maDang: 'ES-02' },
  ])
  expect(r.ok).toBe(true)
  await dungLaiHoSo(d.env, ['S1', 'S2'], new Date().toISOString())
  return d
}
const hangDang = (d: D1That, ma: string) => d.sql.prepare("SELECT * FROM nam_kt_dang WHERE sbd='S1' AND ma_dang=?").get(ma) as Record<string, number>

describe('hoSoLopLenBang trả namKt theo hợp đồng', () => {
  it('(a) em có dòng câu + dòng dạng ⇒ đủ 6 trường đúng giá trị', async () => {
    const d = await dung()
    const r = await goi(d, { dsSbd: ['S1'], dsQid: ['Q-ES-01'] })
    expect(r.ok).toBe(true)
    const dang = hangDang(d, 'ES-01')
    expect(r.em.S1.namKt['Q-ES-01']).toEqual({
      lanSai: 3, trangThai: 'moi_sai', canDayLai: true, maDang: 'ES-01',
      bac: ['biet', 'hieu', 'van_dung'][dang.bac],
      dang: { soGap: dang.so_gap, soDaKhacPhuc: dang.so_da_khac_phuc, soChuaThaySai: dang.so_chua_thay_sai },
    })
    expect(r.em.S1.namKt['Q-ES-01'].bac).toBe('biet') // sai ba lần ⇒ hạ về "biết"
  })

  it('(b) câu em CHƯA gặp nhưng có dạng ⇒ trangThai null, lanSai 0, canDayLai false, maDang tra từ chỉ mục game, bậc của DẠNG', async () => {
    const d = await dung()
    const r = await goi(d, { dsSbd: ['S1'], dsQid: ['Q-ES-02'] })
    const dang = hangDang(d, 'ES-02')
    expect(r.em.S1.namKt['Q-ES-02']).toEqual({
      lanSai: 0, trangThai: null, canDayLai: false, maDang: 'ES-02',
      bac: ['biet', 'hieu', 'van_dung'][dang.bac],
      dang: { soGap: dang.so_gap, soDaKhacPhuc: dang.so_da_khac_phuc, soChuaThaySai: dang.so_chua_thay_sai },
    })
    // Cùng dạng ⇒ cùng bậc/dạng với câu em đã gặp ở dạng ấy.
    const cungDang = (await goi(d, { dsSbd: ['S1'], dsQid: ['Q-ES-03'] })).em.S1.namKt['Q-ES-03']
    expect(cungDang.bac).toBe(r.em.S1.namKt['Q-ES-02'].bac)
    expect(cungDang.dang).toEqual(r.em.S1.namKt['Q-ES-02'].dang)
    expect(cungDang.trangThai).toBe('chua_thay_sai')
  })

  it('(c) không có gì để nói ⇒ KHÔNG có khoá; em có mặt mà không có dòng nào ⇒ namKt {} (không bỏ khoá)', async () => {
    const d = await dung()
    const r = await goi(d, { dsSbd: ['S1', 'S2'], dsQid: ['Q-ES-01', 'Q-KHONG-CO'] })
    expect(Object.keys(r.em.S1.namKt)).toEqual(['Q-ES-01'])
    expect(r.em.S2.namKt).toEqual({})
    expect('Q-KHONG-CO' in r.em.S1.namKt).toBe(false)
  })

  it('(d) không có dsQid / mảng rỗng / không phải mảng ⇒ không có namKt ở bất kỳ em nào (đúng đời cũ)', async () => {
    const d = await dung()
    for (const b of [{}, { dsQid: [] }, { dsQid: 'Q-ES-01' }, { dsQid: [7, null, ''] }]) {
      const r = await goi(d, { dsSbd: ['S1', 'S2'], ...b })
      expect(r.ok).toBe(true)
      for (const s of ['S1', 'S2']) expect('namKt' in r.em[s]).toBe(false)
    }
  })

  it('(e) thiếu bảng nam_kt_* ⇒ ok:true, KHÔNG có namKt, các trường cũ vẫn trả', async () => {
    const d = await dung()
    d.sql.exec('DROP TABLE nam_kt_dang')
    let r = await goi(d, { dsSbd: ['S1'], dsQid: ['Q-ES-01'] })
    expect(r.ok).toBe(true)
    expect('namKt' in r.em.S1).toBe(false)
    expect(Object.keys(r.em.S1).sort()).toEqual(['btvn', 'chuyenDe', 'lenBang', 'qidDaLam', 'qidSai'])
    d.sql.exec('DROP TABLE nam_kt_cau')
    r = await goi(d, { dsSbd: ['S1'], dsQid: ['Q-ES-01'] })
    expect(r.ok).toBe(true)
    expect('namKt' in r.em.S1).toBe(false)
  })

  it('(f) MỌI trường cũ giữ nguyên tên và nghĩa: bỏ namKt thì phản hồi y hệt lúc không gửi dsQid', async () => {
    const d = await dung()
    const cu = await goi(d, { dsSbd: ['S1', 'S2'] })
    const moi = await goi(d, { dsSbd: ['S1', 'S2'], dsQid: ['Q-ES-01', 'Q-ES-02', 'Q-ES-03'] })
    for (const s of ['S1', 'S2']) delete moi.em[s].namKt
    // `serverNow` do route thêm mỗi lần gọi (giờ máy chủ, đổi theo mili giây) — không phải dữ liệu hồ sơ: bỏ khi so.
    delete moi.serverNow; delete cu.serverNow
    expect(JSON.stringify(moi)).toBe(JSON.stringify(cu))
  })

  it('(g) chỉ thêm ĐÚNG 3 truy vấn D1 (nam_kt_cau, game_v2_question, nam_kt_dang), bất kể số em và số câu', async () => {
    const d = await dung()
    const t0 = d.soLenh.prepare
    await goi(d, { dsSbd: ['S1', 'S2'] })
    const co = d.soLenh.prepare - t0
    const t1 = d.soLenh.prepare
    await goi(d, { dsSbd: ['S1', 'S2'], dsQid: Array.from({ length: 150 }, (_, i) => `Q-${i}`).concat(['Q-ES-01', 'Q-ES-02']) })
    expect(d.soLenh.prepare - t1 - co).toBe(3)
  })

  it('bậc 0/1/2 ⇒ biet/hieu/van_dung; mã dạng thiếu (CD:…) trả nguyên; trạng thái lạ ⇒ null (không phát minh giá trị)', async () => {
    const d = await dung()
    for (const [b, mong] of [[0, 'biet'], [1, 'hieu'], [2, 'van_dung']] as const) {
      d.sql.prepare("UPDATE nam_kt_dang SET bac = ? WHERE sbd='S1' AND ma_dang='ES-02'").run(b)
      expect((await goi(d, { dsSbd: ['S1'], dsQid: ['Q-ES-02'] })).em.S1.namKt['Q-ES-02'].bac).toBe(mong)
    }
    d.sql.prepare("INSERT INTO nam_kt_cau(khoa,sbd,qid,ma_dang,chuyen_de,lan_gap,lan_sai,lan_trong,dung_lien_tiep,ngay_dung_khac_nhau,nguon_cuoi,luc_cuoi,trang_thai,can_day_lai,cap_nhat_luc) VALUES('S1|Q-CD','S1','Q-CD','CD:Este','Este',1,1,0,0,0,'btvn','2026-09-16T00:00:00Z','tu_nghi_ra',0,'x')").run()
    const m = (await goi(d, { dsSbd: ['S1'], dsQid: ['Q-CD'] })).em.S1.namKt['Q-CD']
    expect(m).toMatchObject({ maDang: 'CD:Este', trangThai: null, bac: null, dang: null, lanSai: 1 })
  })

  it('docDsQid: chỉ chữ, bỏ rỗng/trùng/quá 80 ký tự, cắt ở 200', () => {
    expect(docDsQid(['a', ' a ', '', 'b', 7, null, 'x'.repeat(DAI_QID_LEN_BANG + 1), 'c'.repeat(DAI_QID_LEN_BANG)])).toEqual(['a', 'b', 'c'.repeat(DAI_QID_LEN_BANG)])
    expect(docDsQid(Array.from({ length: 500 }, (_, i) => `q${i}`))).toHaveLength(TOI_DA_QID_LEN_BANG)
    expect(docDsQid(undefined)).toEqual([])
    expect(docDsQid('q')).toEqual([])
  })

  it('cần mã bí mật của thầy: không secret ⇒ từ chối, không lộ hồ sơ', async () => {
    const d = await dung()
    const r = await goiWorker(worker, d.env, '/goi', { action: 'hoSoLopLenBang', dsSbd: ['S1'], dsQid: ['Q-ES-01'] }, false)
    expect(r.ok).not.toBe(true)
    expect(JSON.stringify(r)).not.toContain('namKt')
  })
})

describe('ghiLenBangMoi ngừng cộng thẳng tien_do_hs (thầy chốt 19/09, câu 11)', () => {
  const dem = (d: D1That, bang: string, dk = '1=1') => d.dem(bang, dk)
  it('một lượt gọi bảng ⇒ +1 len_bang, +1 su_kien_hoc nguon len_bang, +1 qid_da_lam, 0 thay đổi ở tien_do_hs; phản hồi vẫn { ok: true }', async () => {
    const d = taoD1That()
    themHs(d, 'S1')
    const truocTd = d.chup('tien_do_hs')
    const r = await goiWorker(worker, d.env, '/len-bang', { sbd: 'S1', chuyenDe: 'ES', qid: 'DE1-I-1', dat: true }, true)
    expect(r).toMatchObject({ ok: true })
    expect(dem(d, 'len_bang')).toBe(1)
    expect(dem(d, 'su_kien_hoc', "nguon='len_bang'")).toBe(1)
    expect(dem(d, 'qid_da_lam')).toBe(1)
    expect(d.chup('tien_do_hs')).toBe(truocTd)
    expect(dem(d, 'tien_do_hs')).toBe(0)
    await goiWorker(worker, d.env, '/len-bang', { sbd: 'S1', chuyenDe: 'ES', qid: 'DE1-I-2', dat: false }, true)
    expect(dem(d, 'len_bang')).toBe(2)
    expect(dem(d, 'tien_do_hs')).toBe(0)
  })
  it('không qid ⇒ vẫn ghi len_bang, KHÔNG ghi sổ, KHÔNG đụng tien_do_hs; đường action ghiLenBang qua /goi cũng vậy', async () => {
    const d = taoD1That()
    themHs(d, 'S1')
    await goiWorker(worker, d.env, '/len-bang', { sbd: 'S1', chuyenDe: 'ES', dat: true }, true)
    await goiWorker(worker, d.env, '/goi', { action: 'ghiLenBang', sbd: 'S1', chuyenDe: 'ES', qid: 'DE1-I-3', dat: true }, true)
    expect(dem(d, 'len_bang')).toBe(2)
    expect(dem(d, 'su_kien_hoc', "nguon='len_bang'")).toBe(1)
    expect(dem(d, 'tien_do_hs')).toBe(0)
  })
  it('chữa ĐÚNG câu đã sai vẫn đánh dấu da_chua ở ban_do_sai (không mất chức năng khác)', async () => {
    const d = taoD1That()
    themHs(d, 'S1')
    d.sql.prepare("INSERT INTO ban_do_sai(khoa,sbd,qid,chuyen_de,muc_do,so_lan_sai,da_chua,ma_ca,cap_nhat_luc) VALUES('S1|DE1-I-1','S1','DE1-I-1','ES','hieu',1,0,'CA','x')").run()
    await goiWorker(worker, d.env, '/len-bang', { sbd: 'S1', chuyenDe: 'ES', qid: 'DE1-I-1', dat: true }, true)
    expect(d.sql.prepare("SELECT da_chua FROM ban_do_sai WHERE sbd='S1' AND qid='DE1-I-1'").get()).toEqual({ da_chua: 1 })
    expect(dem(d, 'tien_do_hs')).toBe(0)
  })
})
