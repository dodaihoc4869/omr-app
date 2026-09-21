// @vitest-environment node
// HẠ TẢI D1 (Boss 21/09 ~20:50, D1 nghẽn giờ cao điểm): (1) đệm TTL dùng chung có trần; (2) kho câu THEO DẠNG của readScope đệm 60 giây, khoá có phiên bản kho, KHÔNG lẫn giữa lớp / em, phần riêng của em vẫn đọc tươi;
// (3) xác thực token đệm 60 giây (đổi mật khẩu có hiệu lực ≤ 60 giây), token sai / hết hạn / sửa nội dung không bao giờ lọt.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DemTTL, xoaMoiDem } from '../server/src/dem-chung'
import { doDayDu, laTuLuanPool, readScope } from '../server/src/game-v2-bank'
import { laCauTuLuan } from '../src/lib/cau-tu-luan'
import { gameIdentity, gameToken } from '../server/src/game-v2-auth'
import { taoD1That, type D1That } from './_d1-that'

const T0 = Date.parse('2026-09-22T12:00:00+07:00')
beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(T0) })
afterEach(() => vi.useRealTimers())

describe('DemTTL', () => {
  it('còn hạn ⇒ trả; hết hạn ⇒ bỏ; đồng hồ lùi ⇒ không tin; xoa() xoá hết', () => {
    const c = new DemTTL<number>(1000, 10)
    c.ghi('a', 5000, 1); expect(c.doc('a', 5999)).toBe(1); expect(c.doc('a', 6000)).toBeUndefined(); expect(c.soKhoa).toBe(0)
    c.ghi('b', 5000, 2); expect(c.doc('b', 4000)).toBeUndefined()
    c.ghi('c', 5000, 3); c.xoa(); expect(c.doc('c', 5001)).toBeUndefined(); expect(c.tongCo).toBe(0)
  })
  it('trần số khoá: quá thì bỏ khoá CŨ NHẤT trước; đọc trúng đưa khoá lên "mới nhất"', () => {
    const c = new DemTTL<number>(60_000, 3)
    c.ghi('a', 1, 1); c.ghi('b', 1, 2); c.ghi('c', 1, 3)
    c.doc('a', 2)                                                     // a mới dùng ⇒ b thành cũ nhất
    c.ghi('d', 2, 4)
    expect(c.soKhoa).toBe(3); expect(c.doc('b', 3)).toBeUndefined(); expect(c.doc('a', 3)).toBe(1); expect(c.doc('c', 3)).toBe(3); expect(c.doc('d', 3)).toBe(4)
  })
  it('trần trọng lượng (ký tự): quá thì bỏ khoá cũ nhất; không bao giờ bỏ chính khoá vừa ghi', () => {
    const c = new DemTTL<string>(60_000, 100, 100)
    c.ghi('a', 1, 'x', 60); c.ghi('b', 1, 'y', 60)
    expect(c.doc('a', 2)).toBeUndefined(); expect(c.doc('b', 2)).toBe('y'); expect(c.tongCo).toBe(60)
    c.ghi('to', 3, 'z', 500)                                          // một khoá vượt trần một mình: vẫn giữ (khoá vừa ghi), khoá khác bị bỏ
    expect(c.doc('to', 4)).toBe('z'); expect(c.doc('b', 4)).toBeUndefined()
  })
  it('xoaMoiDem() xoá mọi đệm đã đăng ký', () => {
    const c = new DemTTL<number>(60_000, 10); c.ghi('a', 1, 1); xoaMoiDem(); expect(c.doc('a', 2)).toBeUndefined()
  })
})

const cau = (qid: string, dang: string, maDe: string, version = 'v1', text = `Đề ${qid}`) => ({
  qid, maDe, version, group: `g-${qid}`, phan: 'I', text, choices: ['a', 'b', 'c', 'd'], ideas: [], hinhAnh: [], dang, tenDang: `Dạng ${dang}`, mucDo: 'biet', sao: 1, kienThuc: ['K1'], correct: 'B', solution: 'LG', reviewed: true,
})
function kho(): D1That {
  const d = taoD1That()
  for (const sbd of ['S1', 'S2', 'S3']) d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES(?,?,'12','mk','x')").run(sbd, `Em ${sbd}`)
  taiDe(d, 'DE-A', 'A.1', 'v1', 3); taiDe(d, 'DE-B', 'B.2', 'v1', 3)
  return d
}
function taiDe(d: D1That, maDe: string, dang: string, version: string, n: number, hauTo = ''): void {
  d.sql.prepare("DELETE FROM game_v2_question WHERE ma_de=?").run(maDe); d.sql.prepare("DELETE FROM game_v2_index WHERE ma_de=?").run(maDe); d.sql.prepare("DELETE FROM de_kho WHERE ma_de=?").run(maDe)
  d.sql.prepare("INSERT INTO de_kho(ma_de,ten_de,lop,so_cau,r2_khoa,da_xoa,cap_nhat_luc) VALUES(?,?,'12',?,?,0,?)").run(maDe, maDe, n, `kho/${maDe}.json`, version)
  d.sql.prepare("INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES(?,?,'x')").run(maDe, version)
  const them = d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)')
  for (let i = 0; i < n; i++) { const q = cau(`${maDe}-${i}`, dang, maDe, version, `Đề ${maDe}-${i}${hauTo}`); them.run(maDe, q.qid, version, q.group, dang, JSON.stringify(q)) }
}
/** Ghi lại mọi câu SQL gửi tới D1 giả. */
function ghiLenh(d: D1That): string[] {
  const ra: string[] = []; const goc = d.env.DB.prepare.bind(d.env.DB)
  d.env.DB.prepare = ((q: string) => { ra.push(q); return goc(q) }) as typeof d.env.DB.prepare
  return ra
}
const laTruyVanKho = (q: string): boolean => /json_each\(\?\) j JOIN game_v2_question/.test(q) || /SELECT q\.dang,q\.ma_de,q\.qid FROM game_v2_question/.test(q)
const qids = (r: { pool: { qid: string }[] }): string[] => r.pool.map((q) => q.qid)

describe('readScope · đệm kho câu theo dạng', () => {
  it('lần hai trong 60 giây: KHÔNG truy vấn nạp câu nào (chỉ phần riêng của em + một truy vấn phiên bản kho); kết quả giống hệt lần một và giống bản không đệm', async () => {
    const d = kho(); const lenh = ghiLenh(d)
    const a = await readScope(d.env, 'S1', ['A.1', 'B.2'])
    expect(lenh.filter(laTruyVanKho).length).toBeGreaterThanOrEqual(2)                    // lần đầu: nạp khoá + json
    const truoc = lenh.length
    const b = await readScope(d.env, 'S1', ['A.1', 'B.2'])
    expect(lenh.slice(truoc).filter(laTruyVanKho)).toEqual([])
    expect(b).toEqual(a); expect(qids(a)).toEqual(['DE-A-0', 'DE-A-1', 'DE-A-2', 'DE-B-0', 'DE-B-1', 'DE-B-2'])
    xoaMoiDem(); expect(await readScope(d.env, 'S1', ['A.1', 'B.2'])).toEqual(a)         // bản không đệm cho đúng kết quả ấy
    expect(qids(await readScope(d.env, 'S1', ['B.2', 'A.1']))).toEqual(['DE-A-0', 'DE-A-1', 'DE-A-2', 'DE-B-0', 'DE-B-1', 'DE-B-2'])   // thứ tự đúng theo ma_de|qid dù dạng đưa vào ngược
  })
  it('hết 15 phút ⇒ nạp lại; còn 14 phút ⇒ vẫn đệm (đệm kho NHẸ sống lâu; đổi kho đã có phiên bản kho lo)', async () => {
    const d = kho(); const lenh = ghiLenh(d)
    await readScope(d.env, 'S1', ['A.1']); const n0 = lenh.filter(laTruyVanKho).length
    vi.setSystemTime(T0 + 14 * 60_000); await readScope(d.env, 'S1', ['A.1']); expect(lenh.filter(laTruyVanKho).length).toBe(n0)
    vi.setSystemTime(T0 + 15 * 60_000 + 1000); await readScope(d.env, 'S1', ['A.1']); expect(lenh.filter(laTruyVanKho).length).toBeGreaterThan(n0)
  })
  it('KHÔNG lẫn giữa lớp: em lớp A chỉ có dạng A.1, em lớp B chỉ có B.2, xen kẽ A-B-A vẫn đúng', async () => {
    const d = kho()
    const a1 = await readScope(d.env, 'S1', ['A.1']); const b1 = await readScope(d.env, 'S2', ['B.2']); const a2 = await readScope(d.env, 'S1', ['A.1'])
    expect(qids(a1)).toEqual(['DE-A-0', 'DE-A-1', 'DE-A-2']); expect(qids(b1)).toEqual(['DE-B-0', 'DE-B-1', 'DE-B-2']); expect(a2).toEqual(a1)
    expect((await readScope(d.env, 'S3', [])).pool).toEqual([])                          // em không có dạng nào ⇒ pool rỗng, không mượn của lớp khác
  })
  it('PHẦN RIÊNG của em đọc TƯƠI mỗi lượt: bằng chứng mới của S1 hiện ngay trong khi kho vẫn từ đệm; S2 không thấy bằng chứng của S1', async () => {
    const d = kho()
    const truoc = await readScope(d.env, 'S1', ['A.1']); expect(truoc.evidence).toEqual([])
    d.sql.prepare("INSERT INTO nam_kt_cau(khoa,sbd,qid,ma_dang,chuyen_de,lan_gap,lan_sai,lan_trong,dung_lien_tiep,ngay_dung_khac_nhau,ket_qua_cuoi,nguon_cuoi,luc_cuoi,moc_on_ke,trang_thai,can_day_lai,cap_nhat_luc) VALUES('k1','S1','DE-A-1','A.1','',1,1,0,0,0,0,'on_lai','2026-09-22T01:00:00.000Z',NULL,'moi_sai',0,'x')").run()
    d.sql.prepare("INSERT INTO su_kien_hoc (khoa, sbd, qid, nguon, ma_nguon, lan, ket_qua, giay, luc, ngay_vn, ma_dang) VALUES ('s1','S1','DE-A-1','on_lai','m',1,0,30,'2026-09-22T01:00:00.000Z','2026-09-22','A.1')").run()
    const sau = await readScope(d.env, 'S1', ['A.1'])
    expect(sau.evidence.map((e) => e.qid)).toEqual(['DE-A-1']); expect(sau.evidence[0]!.wrong).toBe(true)
    expect((await readScope(d.env, 'S2', ['A.1'])).evidence).toEqual([])
  })
  it('đổi phiên bản kho (tải đề mới / sửa đề / xoá đề): đệm cũ KHÔNG được dùng, không chờ hết 60 giây', async () => {
    const d = kho()
    expect((await doDayDu(d.env, (await readScope(d.env, 'S1', ['A.1'])).pool))[0]!.text).toBe('Đề DE-A-0')
    taiDe(d, 'DE-A', 'A.1', 'v2', 3, ' (đã sửa)')                                       // đề được sửa: cap_nhat_luc + chỉ mục đổi
    vi.setSystemTime(T0 + 1000)
    const p = await readScope(d.env, 'S1', ['A.1']); expect((await doDayDu(d.env, p.pool))[0]!.text).toBe('Đề DE-A-0 (đã sửa)'); expect(p.pool[0]!.version).toBe('v2')
    d.sql.prepare("UPDATE de_kho SET da_xoa=1 WHERE ma_de='DE-A'").run(); vi.setSystemTime(T0 + 2000)
    expect((await readScope(d.env, 'S1', ['A.1'])).pool).toEqual([])                     // xoá đề: biến mất ngay
    taiDe(d, 'DE-C', 'A.1', 'v1', 2); vi.setSystemTime(T0 + 3000)
    expect(qids(await readScope(d.env, 'S1', ['A.1']))).toEqual(['DE-C-0', 'DE-C-1'])   // thêm tờ mới: thấy ngay
  })
})

describe('gameIdentity · đệm xác thực token 60 giây', () => {
  const matKhau = (d: D1That) => { const ghi: string[] = []; const goc = d.env.DB.prepare.bind(d.env.DB); d.env.DB.prepare = ((q: string) => { if (/mat_khau/.test(q)) ghi.push(q); return goc(q) }) as typeof d.env.DB.prepare; return ghi }
  it('lần hai cùng token trong 60 giây: KHÔNG đọc mat_khau; token sai chữ ký / bị sửa nội dung luôn bị từ chối (không lọt qua đệm)', async () => {
    const d = kho(); const token = await gameToken(d.env, 'S1'); const dem = matKhau(d)
    expect(await gameIdentity(d.env, { token })).toBe('S1'); expect(dem).toHaveLength(1)
    expect(await gameIdentity(d.env, { token })).toBe('S1'); expect(dem).toHaveLength(1)
    const [payload, sig] = token.split('.'); const sua = btoa(JSON.stringify({ ...JSON.parse(atob(payload!)), sbd: 'S2' }))
    await expect(gameIdentity(d.env, { token: `${sua}.${sig}` })).rejects.toThrow(/không hợp lệ/)
    await expect(gameIdentity(d.env, { token: token + 'a' })).rejects.toThrow()
    await expect(gameIdentity(d.env, { token: '' })).rejects.toThrow()
    expect(await gameIdentity(d.env, { token: await gameToken(d.env, 'S2') })).toBe('S2') // token khác ⇒ em khác, không trả nhầm S1
  })
  it('đổi mật khẩu: còn dùng được tới 60 giây (đã chấp nhận), sau 60 giây bị từ chối', async () => {
    const d = kho(); const token = await gameToken(d.env, 'S1')
    expect(await gameIdentity(d.env, { token })).toBe('S1')
    d.sql.prepare("UPDATE hoc_sinh SET mat_khau='moi' WHERE sbd='S1'").run()
    vi.setSystemTime(T0 + 59_000); expect(await gameIdentity(d.env, { token })).toBe('S1')
    vi.setSystemTime(T0 + 61_000); await expect(gameIdentity(d.env, { token })).rejects.toThrow(/Mật khẩu đã đổi/)
  })
  it('token KHÔNG được vượt hạn của chính nó dù còn trong đệm (đệm mới 25 giây tuổi nhưng token đã hết hạn)', async () => {
    const d = kho(); const token = await gameToken(d.env, 'S1'); const exp = (JSON.parse(atob(token.split('.')[0]!)) as { exp: number }).exp
    vi.setSystemTime(exp - 20_000); expect(await gameIdentity(d.env, { token })).toBe('S1')     // hạn còn 20 giây: xác thực và đệm
    vi.setSystemTime(exp + 5_000); await expect(gameIdentity(d.env, { token })).rejects.toThrow(/hết hạn/)
  })
})

describe('pool NHẸ + nạp đầy đủ khi chọn (Code 1 đo: kho thật 60 triệu ký tự làm đệm json 16 triệu bị đẩy liên tục)', () => {
  it('bản nhẹ chỉ có siêu dữ liệu + cờ tuLuan tính sẵn, ĐÓNG BĂNG, không có text/choices/đáp án/lời giải; cờ tuLuan = laCauTuLuan của câu đầy đủ', async () => {
    const d = kho(); const p = (await readScope(d.env, 'S1', ['A.1'])).pool
    expect(p).toHaveLength(3)
    for (const q of p) {
      expect(q.nhe).toBe(true); expect(Object.isFrozen(q)).toBe(true); expect(q.tuLuan).toBe(false)
      for (const k of ['text', 'choices', 'ideas', 'correct', 'solution', 'hinhAnh']) expect(k in q, k).toBe(false)
      expect(q).toMatchObject({ maDe: 'DE-A', version: 'v1', dang: 'A.1', phan: 'I', reviewed: true, mucDo: 'biet' })
    }
    const day = await doDayDu(d.env, p)
    expect(day.map((q) => q.text)).toEqual(['Đề DE-A-0', 'Đề DE-A-1', 'Đề DE-A-2']); for (const q of day) { expect(q.correct).toBe('B'); expect(q.choices).toHaveLength(4); expect(laTuLuanPool(p[0]!)).toBe(laCauTuLuan(q)) }
  })
  it('cờ tuLuan bắt câu tự luận đúng như hàm gốc (Phần I thiếu phương án) — bản nhẹ KHÔNG được lọt qua bộ lọc', async () => {
    const d = kho()
    const hong = { ...cau('DE-A-9', 'A.1', 'DE-A'), choices: ['a'] }                // Phần I chỉ 1 phương án ⇒ tự luận
    d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)').run('DE-A', hong.qid, 'v1', hong.group, 'A.1', JSON.stringify(hong))
    const p = (await readScope(d.env, 'S1', ['A.1'])).pool; const h = p.find((q) => q.qid === 'DE-A-9')!
    expect(laCauTuLuan(hong)).toBe(true); expect(h.tuLuan).toBe(true); expect(laTuLuanPool(h)).toBe(true); expect(laTuLuanPool(p.find((q) => q.qid === 'DE-A-0')!)).toBe(false)
  })
  it('doDayDu: câu đầy đủ giữ nguyên; câu vừa bị rút khỏi kho ⇒ lỗi (em mở lượt mới), không trả bừa; thứ tự giữ nguyên', async () => {
    const d = kho(); const p = (await readScope(d.env, 'S1', ['A.1'])).pool
    const da = await doDayDu(d.env, [p[2]!, p[0]!]); expect(da.map((q) => q.qid)).toEqual(['DE-A-2', 'DE-A-0'])
    expect(await doDayDu(d.env, da)).toBe(da)                                                    // đã đầy đủ ⇒ không truy vấn, cùng mảng
    d.sql.prepare("DELETE FROM game_v2_question WHERE qid = 'DE-A-1'").run()
    await expect(doDayDu(d.env, [p[1]!])).rejects.toThrow(/sửa hoặc rút khỏi kho/)
  })
  it('doDayDu kiểm PHIÊN BẢN: câu trong bảng đã đổi phiên bản kể từ lúc bản nhẹ được đệm ⇒ lỗi (không trả câu khác phiên bản với câu em đã được phát)', async () => {
    const d = kho(); const p = (await readScope(d.env, 'S1', ['A.1'])).pool
    const [v1] = await doDayDu(d.env, [p[0]!]); expect(v1!.version).toBe('v1')
    d.sql.prepare("UPDATE game_v2_question SET version = 'v2', json = json_set(json, '$.version', 'v2') WHERE qid = 'DE-A-0'").run()
    await expect(doDayDu(d.env, [p[0]!])).rejects.toThrow(/sửa hoặc rút khỏi kho/)
  })
  it('câu ĐẦY ĐỦ của bằng chứng (em từng gặp) được ƯU TIÊN hơn bản nhẹ cùng qid trong pool', async () => {
    const d = kho()
    d.sql.prepare("INSERT INTO su_kien_hoc (khoa, sbd, qid, nguon, ma_nguon, lan, ket_qua, giay, luc, ngay_vn, ma_dang) VALUES ('s1','S1','DE-A-1','on_lai','m',1,0,30,'2026-09-22T01:00:00.000Z','2026-09-22','A.1')").run()
    d.sql.prepare("INSERT INTO nam_kt_cau(khoa,sbd,qid,ma_dang,chuyen_de,lan_gap,lan_sai,lan_trong,dung_lien_tiep,ngay_dung_khac_nhau,ket_qua_cuoi,nguon_cuoi,luc_cuoi,moc_on_ke,trang_thai,can_day_lai,cap_nhat_luc) VALUES('k1','S1','DE-A-1','A.1','',1,1,0,0,0,0,'on_lai','2026-09-22T01:00:00.000Z',NULL,'moi_sai',0,'x')").run()
    const p = (await readScope(d.env, 'S1', ['A.1'])).pool
    const q1 = p.find((q) => q.qid === 'DE-A-1')!; expect(q1.nhe).toBeUndefined(); expect(q1.text).toBe('Đề DE-A-1'); expect(q1.correct).toBe('B')
    expect(p.filter((q) => q.qid === 'DE-A-1')).toHaveLength(1); expect(p.map((q) => q.qid)).toEqual(['DE-A-1', 'DE-A-0', 'DE-A-2'])   // vị trí: câu bằng chứng đứng đầu như cũ
  })
  it('KHÔNG đẩy nhau: 300 dạng × 4 câu (kho lớn hơn trần cũ) đều nằm trong đệm — lượt hai của một em khác KHÔNG truy vấn nạp câu nào', async () => {
    const d = kho()
    for (let i = 0; i < 300; i++) taiDe(d, `DE-K${i}`, `K.${i}`, 'v1', 4)
    const dang = Array.from({ length: 300 }, (_, i) => `K.${i}`)
    const a = await readScope(d.env, 'S1', dang); expect(a.pool).toHaveLength(1200)
    const lenh = ghiLenh(d); const b = await readScope(d.env, 'S2', dang)
    expect(lenh.filter(laTruyVanKho)).toEqual([]); expect(b.pool.map((q) => q.qid)).toEqual(a.pool.map((q) => q.qid))
  })
})
