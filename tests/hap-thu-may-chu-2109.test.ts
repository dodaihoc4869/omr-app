// @vitest-environment node
// ĐỢT 1 "THẦN THÚ MỖI NGÀY" — MÁY CHỦ (thầy chốt 21/09 13:36; DE-XUAT-THAN-THU-MOI-NGAY-2109.md Điều 1, 2, 9): MỘT cổng hấp thụ `invest` (200 khi đạt nhiệm vụ ngày · 120 khi có học · 0 khi chưa học),
// EXP học tập vào ỐNG NGHIỆM, chuyển đổi hồ sơ lười + cron (CAS theo revision, tin một lần), trần 120 EXP/ngày cho EXP sinh trong game (một cửa ở `answer`).
// Chạy trên SQLite thật (tests/_d1-that.ts). Số viết thẳng, không import hằng luật.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { gameV2, loadProfile } from '../server/src/game-v2'
import { chuyenDoiLoCron, nhanExpGame } from '../server/src/game-v2-hap-thu'
import { congTongSoVaoHoSo } from '../server/src/exp-ho-so-game'
import { docExpHomNay } from '../server/src/exp-d1'
import { docHapThuChoEm } from '../server/src/game-v2-hap-thu'
import { chenhDinhGia, tongExpTheoDuongCu } from '../src/lib/hap-thu-ngay'
import { thanhExp } from '../src/game/than-thu-hoa-hoc/kinh-nghiem'
import { taoD1That, type D1That } from './_d1-that'

vi.mock('../server/src/game-v2-auth', async (orig) => ({
  ...(await orig<typeof import('../server/src/game-v2-auth')>()),
  gameIdentity: async (_e: unknown, b: Record<string, unknown>) => {
    if (b.token !== 'token-S1') throw new Error('Phiên đăng nhập không hợp lệ.')
    return 'S1'
  },
}))
afterEach(() => vi.useRealTimers())

const gio = (s: string) => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date(`${s}+07:00`)) }
const NGAY = '2026-09-22'
const hoSoMoi = (o: Record<string, unknown> = {}) => ({ pet: 'dat_quy', choice: false, legacy: null, cap: 1, exp: 0, wallet: 500, earned: 0, tower: 1, mastery: [], arena: null, cutover: '2026-09-21T05:00:00.000Z', luatCap: 3, ...o })
const themHoSo = (d: D1That, o: Record<string, unknown> = {}, sbd = 'S1') => d.sql.prepare('INSERT INTO game_v2_profile(sbd,revision,json,created_at) VALUES(?,0,?,?)').run(sbd, JSON.stringify(hoSoMoi(o)), 'x')
const docHoSo = (d: D1That, sbd = 'S1') => JSON.parse((d.sql.prepare('SELECT json FROM game_v2_profile WHERE sbd=?').get(sbd) as { json: string }).json) as Record<string, any>
const revision = (d: D1That, sbd = 'S1') => (d.sql.prepare('SELECT revision FROM game_v2_profile WHERE sbd=?').get(sbd) as { revision: number }).revision
const themExp = (d: D1That, loai: string, ngay = NGAY, sbd = 'S1') => d.sql.prepare("INSERT INTO exp_so(khoa,sbd,ngay_vn,loai,qid,ma_nguon,exp,luc,ghi_chu) VALUES(?,?,?,?,NULL,NULL,5,?,'x')").run(`${sbd}|${loai}|${ngay}|${Math.random()}`, sbd, ngay, loai, `${ngay}T03:00:00.000Z`)
const invest = (d: D1That) => gameV2(d.env, 'invest', { token: 'token-S1' })
/** Em làm `n` câu KHÁC NHAU trong ngày `ngay` (sổ sự kiện học, mọi nguồn; `ketQua` 1/0, null = chưa có kết quả). "Có học" = ≥ 4 câu khác nhau (Boss siết 21/09). */
const lamCau = (d: D1That, n: number, ngay = NGAY, o: { nguon?: string; ketQua?: 0 | 1 | null; tienTo?: string } = {}) => {
  for (let i = 0; i < n; i++) d.sql.prepare("INSERT INTO su_kien_hoc (khoa, sbd, qid, nguon, ma_nguon, lan, ket_qua, giay, luc, ngay_vn) VALUES (?, 'S1', ?, ?, 'x', 1, ?, 40, ?, ?)")
    .run(`${o.tienTo ?? 'k'}${ngay}-${i}`, `${o.tienTo ?? 'Q'}-${ngay}-${i}`, o.nguon ?? 'btvn', o.ketQua === undefined ? 1 : o.ketQua, `${ngay}T03:0${i % 10}:00.000Z`, ngay)
}

describe('cổng hấp thụ `invest`', () => {
  it('chưa học hôm nay ⇒ nạp 0, nói thật lý do, KHÔNG ghi (revision giữ nguyên, EXP nằm nguyên ở ống)', async () => {
    gio(`${NGAY}T10:00:00`)
    const d = taoD1That(); themHoSo(d)
    const r = await invest(d)
    expect(r).toMatchObject({ ok: true, daNap: 0, lyDo: 'chua_hoc', conTran: 0 })
    expect(docHoSo(d)).toMatchObject({ cap: 1, exp: 0, wallet: 500 }); expect(revision(d)).toBe(0)
    expect((r.profile as any).hapThuHomNay).toEqual({ da: 0, tran: 0, lyDo: 'chua_hoc', soCauHomNay: 0, canCau: 4 })
  })

  it('có học chưa đạt ⇒ trần 120; sau đó ĐẠT nhiệm vụ ngày ⇒ nạp tiếp tới 200; đủ rồi ⇒ 0 (lý do "no")', async () => {
    gio(`${NGAY}T10:00:00`)
    const d = taoD1That(); themHoSo(d)
    lamCau(d, 4)
    const a = await invest(d)
    expect(a).toMatchObject({ daNap: 120, lyDo: 'no', conTran: 0 })
    expect(docHoSo(d)).toMatchObject({ cap: 2, exp: 0, wallet: 380, hapThu: { ngay: NGAY, da: 120 } })
    themExp(d, 'dat_ngay')
    const b = await invest(d)
    expect(b).toMatchObject({ daNap: 80, lyDo: 'no', conTran: 0 })
    expect(docHoSo(d)).toMatchObject({ cap: 2, exp: 80, wallet: 300, hapThu: { ngay: NGAY, da: 200 } }) // thanh cấp 1 = 160 ⇒ 200 = 1 cấp + 40
    const c = await invest(d)
    expect(c).toMatchObject({ daNap: 0, lyDo: 'no' }); expect(docHoSo(d).wallet).toBe(300)
    expect((c.profile as any).hapThuHomNay).toEqual({ da: 200, tran: 200, lyDo: 'no', soCauHomNay: 4, canCau: 4 })
  })

  it('ống ít hơn trần ⇒ nạp hết ống, lý do "het_ong"; 4 câu GAME khác nhau (không có exp_so nào) cũng tính là có học', async () => {
    gio(`${NGAY}T10:00:00`)
    const d = taoD1That(); themHoSo(d, { wallet: 30 })
    lamCau(d, 4, NGAY, { nguon: 'game' })
    expect(await invest(d)).toMatchObject({ daNap: 30, lyDo: 'het_ong' })
    expect(docHoSo(d)).toMatchObject({ cap: 1, exp: 30, wallet: 0 })
  })

  it('đếm câu LỖI (thiếu bảng sổ) không kéo theo mất trần của em ĐÃ ĐẠT: đạt vẫn 200; chưa đạt thì trần 0 (an toàn)', async () => {
    gio(`${NGAY}T10:00:00`)
    const d = taoD1That(); themHoSo(d)
    themExp(d, 'dat_ngay')
    d.sql.exec('DROP TABLE su_kien_hoc')
    const a = await invest(d)
    expect(a).toMatchObject({ daNap: 200 }); expect((a.profile as any).hapThuHomNay).toMatchObject({ tran: 200, soCauHomNay: 0 })
    const e = taoD1That(); themHoSo(e); e.sql.exec('DROP TABLE su_kien_hoc')
    expect(await invest(e)).toMatchObject({ daNap: 0, lyDo: 'chua_hoc' })
  })

  it('SIẾT "CÓ HỌC" (Boss 21/09): 1–3 câu ⇒ CHƯA học (0, nói rõ đã làm mấy/cần mấy); câu chưa có kết quả và câu lặp không tính; đủ 4 câu KHÁC NHAU ⇒ 120; một dòng exp_so lẻ không còn đủ', async () => {
    gio(`${NGAY}T10:00:00`)
    const d = taoD1That(); themHoSo(d)
    themExp(d, 'cau'); themExp(d, 'len_bac') // trước đây chỉ cần 1 dòng exp_so là ăn 120
    lamCau(d, 3)
    lamCau(d, 2, NGAY, { ketQua: null, tienTo: 'N' }) // chưa có kết quả ⇒ không tính
    d.sql.prepare("INSERT INTO su_kien_hoc (khoa, sbd, qid, nguon, ma_nguon, lan, ket_qua, giay, luc, ngay_vn) VALUES ('lap', 'S1', 'Q-2026-09-22-0', 'game', 'y', 1, 0, 40, ?, ?)").run(`${NGAY}T04:00:00.000Z`, NGAY) // cùng qid câu đầu ⇒ vẫn 3 câu khác nhau
    lamCau(d, 4, '2026-09-21', { tienTo: 'H' }) // hôm qua không tính cho hôm nay
    const a = await invest(d)
    expect(a).toMatchObject({ daNap: 0, lyDo: 'chua_hoc' }); expect((a.profile as any).hapThuHomNay).toMatchObject({ tran: 0, soCauHomNay: 3, canCau: 4 })
    expect(docHoSo(d)).toMatchObject({ cap: 1, exp: 0, wallet: 500 })
    lamCau(d, 1, NGAY, { tienTo: 'Z' })
    expect(await invest(d)).toMatchObject({ daNap: 120 })
  })

  it('SANG NGÀY MỚI trần tính lại từ 0: hôm qua đạt không cho hôm nay ăn; hôm nay có học thì 120', async () => {
    gio(`${NGAY}T10:00:00`)
    const d = taoD1That(); themHoSo(d)
    themExp(d, 'dat_ngay')
    expect(await invest(d)).toMatchObject({ daNap: 200 })
    gio('2026-09-23T09:00:00')
    expect(await invest(d)).toMatchObject({ daNap: 0, lyDo: 'chua_hoc' }) // 23/09 chưa học gì
    lamCau(d, 4, '2026-09-23')
    expect(await invest(d)).toMatchObject({ daNap: 120 })
    expect(docHoSo(d).hapThu).toEqual({ ngay: '2026-09-23', da: 120 })
  })

  it('cấp 120 ⇒ lời cũ (giữ EXP trong kho); hồ sơ CHƯA chuyển đổi (luatCap ≠ 2) ⇒ bị chặn bằng lời, KHÔNG nạp theo luật cũ', async () => {
    gio(`${NGAY}T10:00:00`)
    const d = taoD1That(); themHoSo(d, { cap: 120 })
    await expect(invest(d)).rejects.toThrow('cấp 120')
    const e = taoD1That(); themHoSo(e); themExp(e, 'dat_ngay')
    // giả lập thua CAS mãi mãi: mỗi lần chuyển đổi bị tăng revision trước câu UPDATE ⇒ hồ sơ giữ nguyên chưa chuyển
    e.sql.prepare("UPDATE game_v2_profile SET json = json_remove(json, '$.luatCap')").run()
    const goc = e.env.DB.prepare.bind(e.env.DB)
    e.env.DB.prepare = ((q: string) => {
      if (/UPDATE game_v2_profile SET json = \?, revision = revision \+ 1 WHERE sbd = \? AND revision = \?/.test(q)) e.sql.prepare('UPDATE game_v2_profile SET revision = revision + 1').run()
      return goc(q)
    }) as never
    await expect(invest(e)).rejects.toThrow('đang được cập nhật')
    expect(docHoSo(e)).toMatchObject({ cap: 1, exp: 0, wallet: 500 })
  })
})

describe('EXP học tập vào ỐNG NGHIỆM (không nạp thẳng vào cấp)', () => {
  it('congTongSoVaoHoSo: phần chênh cộng vào `wallet` và `earned`; cap/exp KHÔNG đổi; gọi lại không cộng đôi', () => {
    const p: any = { cap: 3, exp: 40, wallet: 10, earned: 7, expMoi: { daCong: 5, manhDaTinh: 0 } }
    const ra = congTongSoVaoHoSo(p, 25, 0)
    expect(ra).toMatchObject({ exp: 20 })
    expect(p).toMatchObject({ cap: 3, exp: 40, wallet: 30, earned: 27 })
    expect(congTongSoVaoHoSo(p, 25, 0)).toMatchObject({ exp: 0 }); expect(p.wallet).toBe(30)
  })
  it('thiếu trường `wallet` ở hồ sơ cũ ⇒ coi là 0', () => {
    const p: any = { cap: 1, exp: 0, earned: 0 }
    congTongSoVaoHoSo(p, 12, 0)
    expect(p.wallet).toBe(12)
  })
})

describe('CHUYỂN ĐỔI hồ sơ đã chơi (Điều 2): lười khi mở + cron 40 hồ sơ/tick, CAS, tin MỘT lần', () => {
  const cu = (o: Record<string, unknown> = {}) => ({ luatCap: undefined, cap: 4, exp: 50, wallet: 100, mastery: [{ key: 'a', stage: 2 }, { key: 'b', stage: 1 }], ...o })
  const themEmCu = (d: D1That, sbd: string, o: Record<string, unknown> = {}) => {
    const ho = hoSoMoi(cu(o)); delete (ho as any).luatCap
    d.sql.prepare('INSERT INTO game_v2_profile(sbd,revision,json,created_at) VALUES(?,0,?,?)').run(sbd, JSON.stringify(ho), 'x')
  }
  const tin = (d: D1That) => d.sql.prepare("SELECT id, sbd, body FROM student_notice WHERE id LIKE 'luat-cap|%' ORDER BY id").all() as { id: string; sbd: string; body: string }[]

  it('mở hồ sơ ⇒ chuyển đổi: luatCap 3, giữ vết `truocSiet`, BẢO TOÀN tổng EXP (= tổng cũ − chênh nấc), không tăng cấp, thú ăn ≤ 200 × ngày có học, phần dư về ống; một tin cho em', async () => {
    gio(`${NGAY}T10:00:00`)
    const d = taoD1That(); themEmCu(d, 'S1')
    themExp(d, 'cau', '2026-09-21'); themExp(d, 'dat_ngay', '2026-09-21') // 1 ngày có học (21/09), đã đạt trước bảng giá mới
    const tongCu = tongExpTheoDuongCu(4, 50, 100), chenh = chenhDinhGia([{ stage: 2 }, { stage: 1 }])
    const { profile, revision: rev } = await loadProfile(d.env, 'S1')
    expect(rev).toBe(1); expect(profile.luatCap).toBe(3)
    const dc = docHoSo(d)
    const tongMoi = tongCu - chenh + 60 // bù 60 cho 1 ngày đạt trước 22/09
    expect(dc.cap).toBeLessThanOrEqual(4)
    let da = 0; for (let c = 1; c < dc.cap; c++) da += thanhExp(c); da += dc.exp
    expect(da + dc.wallet).toBe(tongMoi)
    expect(da).toBeLessThanOrEqual(200 * 1)
    expect(dc.truocSiet).toMatchObject({ cap: 4, exp: 50, wallet: 100, dinhGiaLai: { chenh } })
    expect(tin(d)).toHaveLength(1); expect(tin(d)[0]).toMatchObject({ id: 'luat-cap|S1', sbd: 'S1' })
    expect(tin(d)[0]!.body).toContain('mỗi ngày hấp thụ tối đa 200 EXP')
    // mở lần hai: không đổi gì, không thêm tin
    const r2 = await loadProfile(d.env, 'S1'); expect(r2.revision).toBe(1); expect(tin(d)).toHaveLength(1)
  })

  it('hồ sơ ĐÃ ở luật mới không bị đụng (không ghi, revision giữ)', async () => {
    gio(`${NGAY}T10:00:00`)
    const d = taoD1That(); themHoSo(d)
    const r = await loadProfile(d.env, 'S1'); expect(r.revision).toBe(0); expect(revision(d)).toBe(0)
  })

  it('hồ sơ MÙA MỚI (tạo trắng theo mùa) sinh sẵn luatCap 3, không cần chuyển đổi', async () => {
    gio(`${NGAY}T10:00:00`)
    const d = taoD1That()
    d.sql.exec("CREATE TABLE IF NOT EXISTS game_v2_settings (key TEXT PRIMARY KEY, json TEXT NOT NULL)")
    d.sql.prepare("INSERT INTO game_v2_settings(key,json) VALUES('season',?)").run(JSON.stringify({ id: 's2' }))
    const r = await loadProfile(d.env, 'S1')
    expect(r.profile).toMatchObject({ cap: 1, exp: 0, wallet: 0, luatCap: 3, season: 's2' })
  })

  it('CRON: ≤ toiDa hồ sơ mỗi lượt cho tới hết; thua CAS (em đang chơi) không bị đè; hết việc ⇒ cờ `chuyen_doi_cap_v3 = xong` và lượt sau không làm gì', async () => {
    gio(`${NGAY}T10:00:00`)
    const d = taoD1That()
    for (const s of ['E1', 'E2', 'E3', 'E4', 'E5']) themEmCu(d, s)
    themHoSo(d, {}, 'E6') // đã luật mới
    const t1 = await chuyenDoiLoCron(d.env, Date.now(), { toiDa: 2 })
    expect(t1).toMatchObject({ soDoc: 2, daDoi: 2, xong: false })
    expect(docHoSo(d, 'E1').luatCap).toBe(3); expect(docHoSo(d, 'E2').luatCap).toBe(3); expect(docHoSo(d, 'E3').luatCap).toBeUndefined()
    // E3 vừa được em khác mở chơi ⇒ revision đổi giữa lúc cron đọc và ghi: mô phỏng bằng tăng revision trước câu UPDATE của cron
    const goc = d.env.DB.prepare.bind(d.env.DB)
    let daPha = false
    d.env.DB.prepare = ((q: string) => {
      if (!daPha && /UPDATE game_v2_profile SET json = \?, revision = revision \+ 1 WHERE sbd = \? AND revision = \?/.test(q)) { daPha = true; d.sql.prepare("UPDATE game_v2_profile SET revision = revision + 1 WHERE sbd = 'E3'").run() }
      return goc(q)
    }) as never
    const t2 = await chuyenDoiLoCron(d.env, Date.now(), { toiDa: 2 })
    d.env.DB.prepare = goc as never
    expect(t2).toMatchObject({ soDoc: 2, daDoi: 1, thuaCas: 1, xong: false })
    expect(docHoSo(d, 'E3').luatCap).toBeUndefined(); expect(docHoSo(d, 'E4').luatCap).toBe(3)
    const t3 = await chuyenDoiLoCron(d.env, Date.now(), { toiDa: 40 })
    expect(t3).toMatchObject({ soDoc: 2, daDoi: 2, xong: false }) // E3 (làm lại) + E5
    const t4 = await chuyenDoiLoCron(d.env, Date.now(), { toiDa: 40 })
    expect(t4).toMatchObject({ soDoc: 0, daDoi: 0, xong: true })
    expect((d.sql.prepare("SELECT gia_tri FROM cau_hinh WHERE khoa='chuyen_doi_cap_v3'").get() as { gia_tri: string }).gia_tri).toBe('xong')
    const truoc = d.chup('game_v2_profile')
    expect(await chuyenDoiLoCron(d.env, Date.now())).toMatchObject({ soDoc: 0, xong: true }); expect(d.chup('game_v2_profile')).toBe(truoc)
    for (const s of ['E1', 'E2', 'E3', 'E4', 'E5']) expect(docHoSo(d, s).luatCap).toBe(3)
    expect(revision(d, 'E6')).toBe(0)
  })

  it('tin MỘT lần: em cấp 1 chưa có gì (không đổi cấp/EXP) không nhận tin; cron chạy lại không thêm tin', async () => {
    gio(`${NGAY}T10:00:00`)
    const d = taoD1That()
    themEmCu(d, 'T1', { cap: 1, exp: 0, wallet: 0, mastery: [] }); themEmCu(d, 'T2')
    await chuyenDoiLoCron(d.env, Date.now()); await chuyenDoiLoCron(d.env, Date.now())
    expect(tin(d).map((x) => x.sbd)).toEqual(['T2'])
  })
})

describe('ĐIỀU 9 — trần 120 EXP/ngày VN cho EXP sinh trong game (MỘT cửa)', () => {
  it('nhanExpGame: cộng dồn tới 120, quá trần ⇒ 0, sang ngày mới về 0; xin âm/NaN ⇒ 0', () => {
    const p: any = { expGame: undefined }
    expect(nhanExpGame(p, NGAY, 100)).toBe(100)
    expect(nhanExpGame(p, NGAY, 30)).toBe(20)
    expect(p.expGame).toMatchObject({ ngay: NGAY, da: 120 })
    expect(nhanExpGame(p, NGAY, 10)).toBe(0)
    expect(nhanExpGame(p, '2026-09-23', 50)).toBe(50)
    expect(p.expGame).toMatchObject({ ngay: '2026-09-23', da: 50 })
    expect(nhanExpGame(p, '2026-09-23', -5)).toBe(0)
    expect(nhanExpGame(p, '2026-09-23', Number.NaN)).toBe(0)
  })

  const cau = (i: number, dang: string) => ({ qid: `D-I-${i}`, maDe: 'D', version: 'v1', group: `g${i}`, phan: 'I', text: `Đề ${i}`, choices: ['A', 'B', 'C', 'D'], ideas: [], hinhAnh: [], dang, tenDang: `Dạng ${dang}`, mucDo: 'biet', sao: 1, kienThuc: ['K1'], correct: 'B', solution: { chot: 'Giải' }, reviewed: true })
  function dungTraLoi(daNhan: number): D1That {
    const d = taoD1That()
    d.sql.prepare("INSERT INTO de_kho(ma_de,ten_de,so_cau,da_xoa,cap_nhat_luc) VALUES('D','Tờ',3,0,'v1')").run()
    d.sql.prepare("INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('D','v1','x')").run()
    const q: [number, string][] = [[1, 'AA.01'], [2, 'AA.02'], [3, 'AA.03']]
    for (const [i, dang] of q) d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)').run('D', `D-I-${i}`, 'v1', `g${i}`, dang, JSON.stringify(cau(i, dang)))
    d.sql.prepare('INSERT INTO game_v2_session(id,sbd,json,created_at) VALUES(?,?,?,?)').run('S', 'S1', JSON.stringify({ mode: 'adventure', created: Date.now(), questions: q.map(([i]) => ({ qid: `D-I-${i}`, maDe: 'D', version: 'v1', group: `g${i}`, novel: true })) }), new Date().toISOString())
    themHoSo(d, { wallet: 0, expGame: { ngay: NGAY, da: daNhan } })
    return d
  }
  const tra = (d: D1That, i: number) => gameV2(d.env, 'answer', { token: 'token-S1', session: 'S', qid: `D-I-${i}`, answer: 'B' })

  it('đã nhận 115: nấc dạng 10 EXP chỉ vào 5 (trần 120); câu kế 0 EXP — nhưng `mastery`, sổ sự kiện học, bản ghi lượt vẫn đủ; phản hồi có `thuongGoc` và `expGameHomNay`', async () => {
    gio(`${NGAY}T10:00:00`)
    const d = dungTraLoi(115)
    const a = await tra(d, 1)
    expect(a).toMatchObject({ ok: true, reward: 5, thuongGoc: 10, correct: true })
    expect((a.profile as any).expGameHomNay).toEqual({ da: 120, tran: 120 })
    expect(docHoSo(d)).toMatchObject({ wallet: 5, earned: 5, expGame: { ngay: NGAY, da: 120 } })
    const b = await tra(d, 2)
    expect(b).toMatchObject({ reward: 0, thuongGoc: 10, correct: true })
    expect(docHoSo(d)).toMatchObject({ wallet: 5, earned: 5 })
    expect(docHoSo(d).mastery.map((m: any) => [m.key, m.stage])).toEqual([['AA.01', 1], ['AA.02', 1]]) // tiến bộ vẫn ghi đủ
    expect(d.dem('game_v2_attempt')).toBe(2)
    expect(d.sql.prepare("SELECT COUNT(*) n FROM su_kien_hoc WHERE nguon='game'").get()).toEqual({ n: 2 })
    expect((d.sql.prepare('SELECT amount FROM game_v2_reward ORDER BY id').all() as { amount: number }[]).map((x) => x.amount)).toEqual([5, 0]) // sổ thưởng ghi phần THẬT
  })

  it('chưa nhận gì: nấc 1 nhận đủ 10; không quá trần thì KHÔNG có `thuongGoc`; sang ngày mới trần 120 mới', async () => {
    gio(`${NGAY}T10:00:00`)
    const d = dungTraLoi(0)
    const a = await tra(d, 1)
    expect(a).toMatchObject({ reward: 10 }); expect(a).not.toHaveProperty('thuongGoc')
    expect(docHoSo(d)).toMatchObject({ wallet: 10, expGame: { ngay: NGAY, da: 10 } })
    const e = dungTraLoi(120) // hôm qua đã đủ: hôm nay là ngày mới
    gio('2026-09-23T10:00:00')
    e.sql.prepare("UPDATE game_v2_session SET json = json_set(json,'$.created', ?)").run(Date.now())
    expect(await tra(e, 1)).toMatchObject({ reward: 10 })
    expect(docHoSo(e).expGame).toMatchObject({ ngay: '2026-09-23', da: 10 })
  })
})

describe('hồ sơ hiển thị cho máy em (chỉ-thêm)', () => {
  it('`profile` trả hapThuHomNay {da, tran}, expGameHomNay {da, tran: 120}, ongNghiem; KHÔNG lộ truocSiet/legacy', async () => {
    gio(`${NGAY}T10:00:00`)
    const d = taoD1That(); themHoSo(d, { wallet: 77, truocSiet: { cap: 9 }, hapThu: { ngay: NGAY, da: 50 }, expGame: { ngay: NGAY, da: 30 } })
    lamCau(d, 4)
    const r = await gameV2(d.env, 'profile', { token: 'token-S1' }) as any
    expect(r.profile).toMatchObject({ ongNghiem: 77, hapThuHomNay: { da: 50, tran: 120, soCauHomNay: 4, canCau: 4 }, expGameHomNay: { da: 30, tran: 120 } })
    expect(r.profile).not.toHaveProperty('truocSiet'); expect(r.profile).not.toHaveProperty('legacy')
  })
  it('sang ngày mới: hapThuHomNay.da và expGameHomNay.da về 0', async () => {
    gio('2026-09-24T10:00:00')
    const d = taoD1That(); themHoSo(d, { hapThu: { ngay: NGAY, da: 200 }, expGame: { ngay: NGAY, da: 120 } })
    const r = await gameV2(d.env, 'profile', { token: 'token-S1' }) as any
    expect(r.profile.hapThuHomNay).toEqual({ da: 0, tran: 0, lyDo: null, soCauHomNay: 0, canCau: 4 }); expect(r.profile.expGameHomNay).toEqual({ da: 0, tran: 120 })
  })
})

describe('ba con số cho Bảng nhiệm vụ (khối `exp`): expConThieu · ongNghiem · hapThuConLaiHomNay', () => {
  it('expConThieu = thanh cấp − EXP đã hấp thụ (KHÔNG trừ ống); ongNghiem = ví; hapThuConLaiHomNay = trần hôm nay − đã ăn hôm nay', async () => {
    gio(`${NGAY}T10:00:00`)
    const d = taoD1That(); themHoSo(d, { cap: 2, exp: 80, wallet: 300, hapThu: { ngay: NGAY, da: 120 } })
    lamCau(d, 4)
    expect(await docHapThuChoEm(d.env, 'S1')).toEqual({ expConThieu: thanhExp(2) - 80, ongNghiem: 300, hapThuConLaiHomNay: 0 })
    themExp(d, 'dat_ngay')
    expect(await docHapThuChoEm(d.env, 'S1')).toMatchObject({ hapThuConLaiHomNay: 80 })
    const e = await docExpHomNay(d.env, 'S1', Date.now())
    expect(e).toMatchObject({ expConThieu: thanhExp(2) - 80, ongNghiem: 300, hapThuConLaiHomNay: 80 })
  })
  it('cấp 120 ⇒ expConThieu 0; chưa học hôm nay ⇒ hapThuConLaiHomNay 0', async () => {
    gio(`${NGAY}T10:00:00`)
    const d = taoD1That(); themHoSo(d, { cap: 120, exp: 0, wallet: 5 })
    expect(await docHapThuChoEm(d.env, 'S1')).toEqual({ expConThieu: 0, ongNghiem: 5, hapThuConLaiHomNay: 0 })
  })
  it('KHÔNG bịa số: chưa có hồ sơ game, chưa chọn thú, hoặc hồ sơ chưa chuyển sang luật mới ⇒ null (vắng trường trong phản hồi)', async () => {
    gio(`${NGAY}T10:00:00`)
    const d = taoD1That()
    expect(await docHapThuChoEm(d.env, 'S1')).toBeNull()
    themHoSo(d, { choice: true }); expect(await docHapThuChoEm(d.env, 'S1')).toBeNull()
    d.sql.prepare("UPDATE game_v2_profile SET json = json_set(json_remove(json, '$.luatCap'), '$.choice', 0)").run(); expect(await docHapThuChoEm(d.env, 'S1')).toBeNull()
    const e = await docExpHomNay(d.env, 'S1', Date.now()); expect(e).not.toHaveProperty('ongNghiem')
  })
})
