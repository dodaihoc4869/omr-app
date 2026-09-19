// @vitest-environment node
// POST /hs/on-lai/nop — em NỘP bài làm câu "ôn lại": máy chủ chấm, ghi sổ nguon='on_lai', dựng lại hồ sơ, rồi MỚI trả đáp án.
import { describe, it, expect, vi } from 'vitest'
import worker from '../server/src/index'
import { docTraLoi } from '../server/src/on-lai-nop'
import { ghiSuKien, ngayVn } from '../server/src/su-kien-hoc'
import { goiWorker, taoD1That, type D1That } from './_d1-that'

vi.mock('../server/src/game-v2-auth', async (orig) => ({
  ...(await orig<typeof import('../server/src/game-v2-auth')>()),
  gameIdentity: async (_e: unknown, b: Record<string, unknown>) => {
    if (b.token !== 'token-S1') throw new Error('Phiên đăng nhập không hợp lệ.')
    return 'S1'
  },
}))

const H = 3_600_000
const LOI_GIAI = 'LOI-GIAI-BI-MAT-XYZ'
const cauKho = (qid: string, phan: string, correct: string, o: Record<string, unknown> = {}) => ({
  qid, maDe: 'x', version: 'v', group: `g-${qid}`, phan, text: `Câu ${qid}.`, choices: phan === 'I' ? ['A. a', 'B. b', 'C. c', 'D. d'] : [], ideas: phan === 'II' ? ['a', 'b', 'c', 'd'] : [],
  hinhAnh: [{ viTri: 'truoc_de', url: 't.png' }, { viTri: 'sau_loi_giai', url: 'ANH-LOI-GIAI.png' }], dang: 'ES.A.X', tenDang: 'Dạng', mucDo: 'hieu', sao: 1, kienThuc: ['k1'],
  correct, solution: LOI_GIAI, reviewed: true, ...o,
})
const I1 = 'DE1-I-1', II2 = 'DE1-II-2', III3 = 'DE1-III-3', CHUA_GAP = 'DE1-I-9'

function themCau(d: D1That, cau: ReturnType<typeof cauKho>[]) {
  d.sql.prepare("INSERT OR IGNORE INTO de_kho(ma_de,ten_de,lop,so_cau,r2_khoa,da_xoa,cap_nhat_luc) VALUES('DE1','DE1','12',?,?,0,'v1')").run(cau.length, 'kho/DE1.json')
  d.sql.prepare("INSERT OR IGNORE INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('DE1','v1','x')").run()
  for (const c of cau) d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)').run('DE1', c.qid, 'v', c.group, c.dang, JSON.stringify({ ...c, maDe: 'DE1' }))
}
const themHs = (d: D1That) => d.sql.prepare("INSERT OR IGNORE INTO hoc_sinh(sbd,ho_ten,cap_nhat_luc) VALUES('S1','x','x')").run()
/** Em S1 đã SAI 3 câu (I, II, III) cách đây 3 ngày ở BTVN → hồ sơ: moi_sai, tới mốc ôn. */
async function dung() {
  const d = taoD1That()
  themHs(d)
  themCau(d, [cauKho(I1, 'I', 'B'), cauKho(II2, 'II', 'DSDS'), cauKho(III3, 'III', '0,39'), cauKho(CHUA_GAP, 'I', 'C')])
  const luc = new Date(Date.now() - 72 * H).toISOString()
  const r = await ghiSuKien(d.env, [I1, II2, III3].map((q, i) => ({ nguon: 'btvn' as const, maNguon: 'B', sbd: 'S1', qid: q, lan: i + 1, ketQua: 0 as const, luc })))
  expect(r.ok).toBe(true)
  return d
}
const nop = (d: D1That, traLoi: unknown, token: string | null = 'token-S1', them: Record<string, unknown> = {}) =>
  goiWorker(worker, d.env, '/hs/on-lai/nop', { ...(token ? { token } : {}), traLoi, ...them })
const suKien = (d: D1That, qid: string) => d.sql.prepare("SELECT * FROM su_kien_hoc WHERE sbd='S1' AND nguon='on_lai' AND qid=?").all(qid) as Record<string, any>[]
// Bỏ `cap_nhat_luc` (giờ dựng lại hồ sơ, đổi mỗi lần): so NỘI DUNG hồ sơ, không so giờ dựng.
const hoSo = (d: D1That, qid: string) => {
  const r = d.sql.prepare("SELECT * FROM nam_kt_cau WHERE sbd='S1' AND qid=?").get(qid) as Record<string, any> | undefined
  if (r) delete r.cap_nhat_luc
  return r
}
const homNay = () => ngayVn(Date.now())

describe('xác thực: BẮT BUỘC token học sinh', () => {
  it('không token / token sai / chỉ có sbd → từ chối, không ghi gì, không lộ đáp án', async () => {
    const d = await dung()
    const truoc = d.chup('su_kien_hoc')
    for (const r of [await nop(d, [{ qid: I1, dapAn: 'B' }], null), await nop(d, [{ qid: I1, dapAn: 'B' }], 'token-sai'), await nop(d, [{ qid: I1, dapAn: 'B' }], null, { sbd: 'S1' })]) {
      expect(r.ok).not.toBe(true)
      expect(JSON.stringify(r)).not.toContain(LOI_GIAI)
      expect('ketQua' in r).toBe(false)
    }
    expect(d.chup('su_kien_hoc')).toBe(truoc)
  })
  it('có token thì SBD lấy từ chữ ký, sbd trong body bị bỏ qua (không nộp hộ em khác)', async () => {
    const d = await dung()
    d.sql.prepare("INSERT OR IGNORE INTO hoc_sinh(sbd,ho_ten,cap_nhat_luc) VALUES('S2','x','x')").run()
    const r = await nop(d, [{ qid: I1, dapAn: 'B' }], 'token-S1', { sbd: 'S2' })
    expect(r.ok).toBe(true)
    expect(suKien(d, I1)).toHaveLength(1)
    expect(d.sql.prepare("SELECT COUNT(*) n FROM su_kien_hoc WHERE sbd='S2'").get()).toEqual({ n: 0 })
  })
})

describe('chỉ nhận đúng tập câu mà /hs/cau-theo-qid trả cho em', () => {
  it('qid em chưa từng gặp (dù có trong kho) bị loại, KHÔNG ghi, KHÔNG lộ đáp án của nó', async () => {
    const d = await dung()
    const r = await nop(d, [{ qid: CHUA_GAP, dapAn: 'C' }, { qid: 'KHONG-TON-TAI', dapAn: 'A' }, { qid: I1, dapAn: 'B' }])
    expect(r.ok).toBe(true)
    expect((r.ketQua as { qid: string }[]).map((x) => x.qid)).toEqual([I1])
    expect(r.khongCo).toEqual([CHUA_GAP, 'KHONG-TON-TAI'])
    expect(suKien(d, CHUA_GAP)).toHaveLength(0)
    expect(suKien(d, 'KHONG-TON-TAI')).toHaveLength(0)
  })
  it('câu của đề thi CHƯA công bố bị loại dù em đã gặp', async () => {
    const d = await dung()
    d.sql.prepare("INSERT INTO ca(ma_ca,ten_ca,trang_thai,bat_dau,het_han_vao,thoi_gian_phut,loai,cong_bo,bank_r2,cap_nhat_luc) VALUES('CAP','Ca','mo',?,?,45,'thi','khong','key/CAP.json','x')")
      .run(new Date(Date.now() + 24 * H).toISOString(), new Date(Date.now() + 30 * H).toISOString())
    await d.env.DE.put('key/CAP.json', JSON.stringify({ phanI: [{ id: I1, text: 'x', choices: ['A. a', 'B. b', 'C. c', 'D. d'], correct: 'B', dang: { ma: 'ES.A.X' }, mucDo: 'hieu', kienThuc: ['k1'] }] }))
    const r = await nop(d, [{ qid: I1, dapAn: 'B' }, { qid: II2, dapAn: 'DSDS' }])
    expect((r.ketQua as { qid: string }[]).map((x) => x.qid)).toEqual([II2])
    expect(suKien(d, I1)).toHaveLength(0)
  })
  it('cùng tập với /hs/cau-theo-qid: cái nào xin được thì nộp được, cái nào không thì không', async () => {
    const d = await dung()
    const xin = [I1, II2, III3, CHUA_GAP, 'KHONG-TON-TAI']
    const lay = await goiWorker(worker, d.env, '/hs/cau-theo-qid', { token: 'token-S1', qid: xin })
    const dua = await nop(d, xin.map((qid) => ({ qid, dapAn: 'B' })))
    expect((dua.ketQua as { qid: string }[]).map((x) => x.qid)).toEqual((lay.cau as { qid: string }[]).map((x) => x.qid))
    expect(dua.khongCo).toEqual(lay.khongCo)
  })
})

describe('chấm tại máy chủ, ghi sổ, hồ sơ lên bậc', () => {
  it('ĐÚNG: ghi nguon on_lai / ma_nguon on_lai:<ngày VN> / ket_qua 1; hồ sơ moi_sai → dang_on, mốc ôn dời; tienBo.lenBac ≥ 1', async () => {
    const d = await dung()
    expect(hoSo(d, I1)).toBeUndefined() // chưa dựng hồ sơ trước lượt nộp
    const r = await nop(d, [{ qid: I1, dapAn: 'b', giay: 42 }])
    expect(r.ok).toBe(true)
    expect(r.ketQua[0]).toMatchObject({ qid: I1, dung: true, dapAnDung: 'B', loiGiai: LOI_GIAI })
    const dong = suKien(d, I1)
    expect(dong).toHaveLength(1)
    expect(dong[0]).toMatchObject({ nguon: 'on_lai', ma_nguon: `on_lai:${homNay()}`, ket_qua: 1, giay: 42, lan: 1, ma_dang: 'ES.A.X', ngay_vn: homNay() })
    expect(dong[0]!.khoa).toBe(`on_lai|on_lai:${homNay()}|S1|${I1}|1`)
    const h = hoSo(d, I1)!
    expect(h).toMatchObject({ trang_thai: 'dang_on', dung_lien_tiep: 1, lan_sai: 1 })
    expect(String(h.moc_on_ke) > homNay()).toBe(true) // mốc ôn dời tới ngày sau
    expect(r.tienBo.lenBac).toBeGreaterThanOrEqual(1)
    expect(r.tienBo.daLamCau).toBe(1)
  })

  it('SAI: ket_qua 0, hồ sơ về mốc 1 (mai ôn lại), tienBo không lên bậc; đáp án đúng chỉ ra SAU khi ghi', async () => {
    const d = await dung()
    const r = await nop(d, [{ qid: II2, dapAn: 'SSSS' }])
    expect(r.ketQua[0]).toMatchObject({ qid: II2, dung: false, dapAnDung: 'DSDS' })
    expect(suKien(d, II2)[0]).toMatchObject({ ket_qua: 0 })
    expect(hoSo(d, II2)).toMatchObject({ trang_thai: 'moi_sai', dung_lien_tiep: 0 })
    expect(r.tienBo.lenBac).toBe(0)
  })

  it('BỎ TRỐNG (rỗng, ----, khoảng trắng, thiếu dapAn): ket_qua NULL, dung null, KHÔNG cộng lan_sai', async () => {
    const d = await dung()
    const laiSaiTruoc = (await nop(d, [{ qid: III3, dapAn: '' }])).ok
    expect(laiSaiTruoc).toBe(true)
    const r = await nop(d, [{ qid: II2, dapAn: '----' }, { qid: I1 }])
    expect(r.ketQua.map((x: { dung: unknown }) => x.dung)).toEqual([null, null])
    for (const q of [II2, I1, III3]) expect(suKien(d, q)[0]!.ket_qua).toBeNull()
    for (const q of [I1, II2, III3]) expect(hoSo(d, q)!.lan_sai).toBe(1) // vẫn 1 lần sai từ BTVN, không thêm
    expect(hoSo(d, I1)!.lan_trong).toBe(1)
  })

  it('Phần II có dấu (ĐSĐS) và Phần III dấu phẩy/dấu chấm chấm đúng như luật chấm của sổ', async () => {
    const d = await dung()
    const r = await nop(d, [{ qid: II2, dapAn: 'ĐSĐS' }, { qid: III3, dapAn: '0.39' }])
    expect(r.ketQua.map((x: { dung: unknown }) => x.dung)).toEqual([true, true])
  })

  it('giây hợp lệ 5..1200 thì ghi (làm tròn); ngoài khoảng hoặc không phải số thì NULL', async () => {
    const d = await dung()
    d.sql.prepare("INSERT INTO su_kien_hoc(khoa,sbd,qid,nguon,ma_nguon,lan,ket_qua,luc,ngay_vn) VALUES('x|1','S1','Q-PHU','btvn','B',1,0,'2026-09-16T00:00:00Z','2026-09-16')").run()
    for (const [g, mong] of [[42.6, 43], [5, 5], [1200, 1200], [4, null], [1201, null], [0, null], [-3, null], ['abc', null], [NaN, null]] as const) {
      const d2 = await dung()
      await nop(d2, [{ qid: I1, dapAn: 'B', giay: g }])
      expect(suKien(d2, I1)[0]!.giay).toBe(mong)
    }
  })
})

describe('idempotent: nộp lại cùng câu cùng ngày giữ lần ĐẦU', () => {
  it('lần 1 sai, lần 2 (đã thấy lời giải) điền đúng → vẫn SAI, không thêm dòng, hồ sơ không đổi', async () => {
    const d = await dung()
    const a = await nop(d, [{ qid: I1, dapAn: 'A' }])
    expect(a.ketQua[0].dung).toBe(false)
    const hoSoTruoc = JSON.stringify(hoSo(d, I1))
    const soDong = d.dem('su_kien_hoc')
    const b = await nop(d, [{ qid: I1, dapAn: 'B' }])
    expect(b.ketQua[0]).toMatchObject({ qid: I1, dung: false }) // kết quả lần ĐẦU
    expect(d.dem('su_kien_hoc')).toBe(soDong)
    expect(suKien(d, I1)).toHaveLength(1)
    expect(suKien(d, I1)[0]!.ket_qua).toBe(0)
    expect(JSON.stringify(hoSo(d, I1))).toBe(hoSoTruoc)
  })
  it('lần 1 đúng, lần 2 điền sai → vẫn ĐÚNG; lần 1 bỏ trống, lần 2 điền → vẫn bỏ trống', async () => {
    const d = await dung()
    await nop(d, [{ qid: I1, dapAn: 'B' }, { qid: II2, dapAn: '' }])
    const r = await nop(d, [{ qid: I1, dapAn: 'C' }, { qid: II2, dapAn: 'DSDS' }])
    expect(r.ketQua.map((x: { dung: unknown }) => x.dung)).toEqual([true, null])
  })
  it('trong CÙNG một lượt, mục trùng qid: giữ mục đầu', async () => {
    const d = await dung()
    const r = await nop(d, [{ qid: I1, dapAn: 'A' }, { qid: I1, dapAn: 'B' }])
    expect(r.ketQua).toHaveLength(1)
    expect(r.ketQua[0].dung).toBe(false)
  })
})

describe('LUẬT ĐÁP ÁN: chỉ đi ra SAU khi ghi sổ thành công', () => {
  it('ghi sổ thất bại → ok:false và KHÔNG có đáp án/lời giải/ảnh lời giải nào trong phản hồi', async () => {
    const d = await dung()
    d.sql.exec("CREATE TRIGGER chan_on_lai BEFORE INSERT ON su_kien_hoc WHEN NEW.nguon = 'on_lai' BEGIN SELECT RAISE(ABORT, 'chan'); END")
    const r = await nop(d, [{ qid: I1, dapAn: 'B' }, { qid: II2, dapAn: 'DSDS' }])
    expect(r.ok).toBe(false)
    const chuoi = JSON.stringify(r)
    for (const bi of [LOI_GIAI, 'ANH-LOI-GIAI', 'dapAnDung', 'loiGiai', '"DSDS"', 'ketQua']) expect(chuoi).not.toContain(bi)
    expect(suKien(d, I1)).toHaveLength(0)
    // Gỡ chặn rồi nộp lại được (không kẹt trạng thái nửa vời).
    d.sql.exec('DROP TRIGGER chan_on_lai')
    expect((await nop(d, [{ qid: I1, dapAn: 'B' }])).ok).toBe(true)
  })
  it('TRƯỚC khi nộp: /hs/cau-theo-qid cho cùng các câu KHÔNG có đáp án hay lời giải', async () => {
    const d = await dung()
    const lay = JSON.stringify(await goiWorker(worker, d.env, '/hs/cau-theo-qid', { token: 'token-S1', qid: [I1, II2, III3] }))
    for (const bi of [LOI_GIAI, 'ANH-LOI-GIAI', 'dapAnDung', 'loiGiai', '"correct"', '"solution"']) expect(lay).not.toContain(bi)
  })
  it('đáp án ra đúng khoá whitelist: qid, dung, dapAnDung, loiGiai, anhLoiGiai', async () => {
    const d = await dung()
    const r = await nop(d, [{ qid: I1, dapAn: 'B' }])
    expect(Object.keys(r.ketQua[0]).sort()).toEqual(['anhLoiGiai', 'dapAnDung', 'dung', 'loiGiai', 'qid'])
    expect(r.ketQua[0].anhLoiGiai).toEqual([{ viTri: 'sau_loi_giai', url: 'ANH-LOI-GIAI.png' }])
  })
})

describe('kiểm đầu vào', () => {
  it('traLoi không phải mảng, quá 20 mục → ok:false; mục hỏng/không qid/quá dài bị bỏ; mảng rỗng → ok, không câu nào', async () => {
    const d = await dung()
    expect(await nop(d, 'I1')).toMatchObject({ ok: false })
    expect(await nop(d, undefined)).toMatchObject({ ok: false })
    expect(await nop(d, Array.from({ length: 21 }, (_, i) => ({ qid: `Q${i}`, dapAn: 'A' })))).toMatchObject({ ok: false })
    expect(await nop(d, [])).toMatchObject({ ok: true, ketQua: [] })
    const r = await nop(d, [null, 7, 'x', {}, { qid: 5 }, { qid: 'y'.repeat(500), dapAn: 'A' }, { qid: I1, dapAn: 'B' }])
    expect((r.ketQua as { qid: string }[]).map((x) => x.qid)).toEqual([I1])
  })
  it('docTraLoi: dapAn là mảng thì nối; số thì thành chữ; cắt 40 ký tự; giây làm tròn', () => {
    expect(docTraLoi([{ qid: 'a', dapAn: ['D', 'S', 'D', 'S'], giay: 9.4 }, { qid: 'b', dapAn: 3 }, { qid: 'c', dapAn: 'x'.repeat(100) }])).toEqual([
      { qid: 'a', dapAn: 'DSDS', giay: 9 }, { qid: 'b', dapAn: '3', giay: null }, { qid: 'c', dapAn: 'x'.repeat(40), giay: null },
    ])
  })
})

describe('EXP học tập qua đúng đường creditAcademic (practice:<qid>)', () => {
  const hoSoGame = (d: D1That, extra: Record<string, unknown> = {}) => {
    d.sql.exec('CREATE TABLE IF NOT EXISTS game_v2_settings (key TEXT PRIMARY KEY, json TEXT NOT NULL)')
    d.sql.prepare('INSERT INTO game_v2_profile(sbd,json,created_at) VALUES(?,?,?)').run('S1', JSON.stringify({
      pet: 'hoa_long', choice: false, legacy: null, cap: 1, exp: 0, wallet: 0, earned: 0, tower: 1, mastery: [], arena: null, cutover: '2020-01-01T00:00:00.000Z', ...extra,
    }), 'x')
  }
  const academic = (d: D1That) => (JSON.parse((d.sql.prepare("SELECT json FROM game_v2_profile WHERE sbd='S1'").get() as { json: string }).json) as { academic?: { days: Record<string, number>; seen: string[]; total: number }; earned: number })

  it('câu ĐÚNG lần đầu +2 EXP mỗi câu, khoá practice:<qid>; sai/bỏ trống không có; nộp lại không nhân đôi', async () => {
    const d = await dung()
    hoSoGame(d)
    const r = await nop(d, [{ qid: I1, dapAn: 'B' }, { qid: II2, dapAn: 'DSDS' }, { qid: III3, dapAn: '9' }])
    expect(r.exp).toBe(4)
    const a = academic(d)
    expect(a.academic!.seen.sort()).toEqual([`practice:${I1}`, `practice:${II2}`].sort())
    expect(a.academic!.days[homNay()]).toBe(4)
    expect(a.earned).toBe(4)
    expect((await nop(d, [{ qid: I1, dapAn: 'B' }, { qid: II2, dapAn: 'DSDS' }])).exp).toBe(0)
    expect(academic(d).academic!.total).toBe(4)
  })
  it('trần 100 EXP/ngày: đã 99 thì chỉ cộng thêm 1', async () => {
    const d = await dung()
    hoSoGame(d, { academic: { seen: [], sources: {}, days: { [homNay()]: 99 }, total: 99, lastGain: 0, at: '2026-01-01T00:00:00Z' } })
    const r = await nop(d, [{ qid: I1, dapAn: 'B' }, { qid: II2, dapAn: 'DSDS' }])
    expect(r.exp).toBe(1)
    expect(academic(d).academic!.days[homNay()]).toBe(100)
  })
  it('em CHƯA có hồ sơ game: KHÔNG tự tạo hồ sơ chỉ để cộng EXP, lượt nộp vẫn thành công', async () => {
    const d = await dung()
    const r = await nop(d, [{ qid: I1, dapAn: 'B' }])
    expect(r).toMatchObject({ ok: true, exp: 0 })
    expect(d.dem('game_v2_profile')).toBe(0)
  })
  it('lỗi ở bước EXP (thiếu bảng cài đặt game) không làm hỏng lượt nộp', async () => {
    const d = await dung()
    d.sql.prepare('INSERT INTO game_v2_profile(sbd,json,created_at) VALUES(?,?,?)').run('S1', JSON.stringify({ pet: 'hoa_long', choice: false, cap: 1, exp: 0, wallet: 0, earned: 0, tower: 1, mastery: [], arena: null, cutover: '2020-01-01T00:00:00Z' }), 'x')
    d.sql.exec('DROP TABLE IF EXISTS game_v2_settings')
    const r = await nop(d, [{ qid: I1, dapAn: 'B' }])
    expect(r.ok).toBe(true)
    expect(r.ketQua[0].dung).toBe(true)
    expect(suKien(d, I1)).toHaveLength(1)
  })
})

describe('bảng học tập của thầy không bị đụng', () => {
  it('chỉ ghi su_kien_hoc + hồ sơ (nam_kt_*) + EXP; không sửa ca, luot, chi_tiet_cau, ban_do_sai, tien_do_hs', async () => {
    const d = await dung()
    const bang = ['ca', 'luot', 'chi_tiet_cau', 'ban_do_sai', 'tien_do_hs', 'btvn', 'btvn_em', 'mom_bai']
    const truoc = bang.map((b) => d.chup(b))
    await nop(d, [{ qid: I1, dapAn: 'B' }, { qid: II2, dapAn: 'X' }])
    expect(bang.map((b) => d.chup(b))).toEqual(truoc)
  })
})
