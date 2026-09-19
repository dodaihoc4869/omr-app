// @vitest-environment node
// GĐ 5 — KÊNH 4 (thần thú): bằng chứng từ hồ sơ, một đồng hồ ôn (moc_on_ke), chặn câu đã làm/đang giao hôm nay, nhiệm vụ tự sinh từ kế hoạch ngày.
import { describe, it, expect } from 'vitest'
import { gameV2 } from '../server/src/game-v2'
import { gameToken } from '../server/src/game-v2-auth'
import { protectedQuestions, readScope } from '../server/src/game-v2-bank'
import { dauNgayVn, masteryTheoHoSo, qidChanHomNay } from '../server/src/game-v2-ho-so'
import { dungLaiHoSo } from '../server/src/ho-so-nam-kt'
import { lapVaLuuKeHoach } from '../server/src/ke-hoach-ngay-d1'
import { NHIEM_VU_THAN_THU_MO_TOI_DA } from '../server/src/ho-so-cau-hinh'
import { ghiSuKien, ngayVn, type NguonSuKien } from '../server/src/su-kien-hoc'
import { taoD1That, type D1That } from './_d1-that'

const H = 3_600_000
const iso = (gio: number) => new Date(Date.now() + gio * H).toISOString()
const cauKho = (qid: string, dang: string | null, mucDo: string | null = 'biet', o: Record<string, unknown> = {}) => ({
  qid, maDe: 'x', version: 'v1', group: `g-${qid}`, phan: 'I', text: `Đề ${qid}`, choices: ['A', 'B', 'C', 'D'], ideas: [], hinhAnh: [], dang, tenDang: 'Dạng', mucDo, sao: 1,
  kienThuc: ['K1'], correct: 'B', solution: 'Giải', reviewed: true, ...o,
})
function themCau(d: D1That, cau: ReturnType<typeof cauKho>[]) {
  d.sql.prepare("INSERT OR IGNORE INTO de_kho(ma_de,ten_de,lop,so_cau,r2_khoa,da_xoa,cap_nhat_luc) VALUES('DE1','DE1','12',?,?,0,'v1')").run(cau.length, 'kho/DE1.json')
  d.sql.prepare("INSERT OR IGNORE INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('DE1','v1','x')").run()
  for (const c of cau) d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)').run('DE1', c.qid, c.version, c.group, c.dang, JSON.stringify({ ...c, maDe: 'DE1' }))
}
const themHs = (d: D1That, sbd: string) => d.sql.prepare("INSERT OR IGNORE INTO hoc_sinh(sbd,ho_ten,mat_khau,cap_nhat_luc) VALUES(?,'x','mk','x')").run(sbd)
type Ev = { sbd?: string; qid: string; nguon: NguonSuKien; gio: number; kq: 0 | 1; lan?: number; dang?: string | null }
async function ghi(d: D1That, ds: Ev[]) {
  const r = await ghiSuKien(d.env, ds.map((e, i) => ({ nguon: e.nguon, maNguon: `M${i}`, sbd: e.sbd ?? 'S1', qid: e.qid, lan: e.lan ?? 1, ketQua: e.kq, luc: iso(e.gio), maDang: e.dang === undefined ? 'ES.A.X' : e.dang })))
  expect(r.ok).toBe(true)
}
const dung = (d: D1That, sbd = 'S1') => dungLaiHoSo(d.env, [sbd], new Date().toISOString())

describe('K4.1 readScope: bằng chứng từ hồ sơ (nguồn ≠ thi, ≠ game)', () => {
  async function dungBoiCanh() {
    const d = taoD1That()
    themHs(d, 'S1'); themHs(d, 'S2')
    themCau(d, ['B1', 'M1', 'T1', 'G1', 'X1', 'Y1', 'K1'].map((q) => cauKho(q, 'ES.A.X')))
    await ghi(d, [
      { qid: 'B1', nguon: 'btvn', gio: -72, kq: 0 },
      { qid: 'M1', nguon: 'mom', gio: -50, kq: 0 },
      { qid: 'T1', nguon: 'thi', gio: -80, kq: 0 }, // CHỈ ca thi (có thể chưa công bố): không được lọt qua đường hồ sơ
      { qid: 'G1', nguon: 'game', gio: -30, kq: 0 }, // CHỈ game: game tự có attempts
      { qid: 'X1', nguon: 'thi', gio: -96, kq: 0 }, // sai ở thi rồi sửa đúng ở BTVN 3 ngày khác nhau → da_khac_phuc
      { qid: 'X1', nguon: 'btvn', gio: -72, kq: 1, lan: 1 }, { qid: 'X1', nguon: 'btvn', gio: -48, kq: 1, lan: 2 }, { qid: 'X1', nguon: 'btvn', gio: -24, kq: 1, lan: 3 },
      { sbd: 'S2', qid: 'Y1', nguon: 'btvn', gio: -72, kq: 0 }, // em khác
    ])
    await dung(d); await dung(d, 'S2')
    return d
  }

  it('câu sai ở BTVN/Mom thành bằng chứng "wrong"; câu chỉ thi hoặc chỉ game KHÔNG lọt; em khác không lọt', async () => {
    const d = await dungBoiCanh()
    const { evidence } = await readScope(d.env, 'S1')
    const theo = new Map(evidence.map((e) => [e.qid, e]))
    expect([...theo.keys()].sort()).toEqual(['B1', 'M1', 'X1'])
    expect(theo.get('B1')).toMatchObject({ wrong: true, ca: 'btvn', dang: 'ES.A.X' })
    expect(theo.get('M1')).toMatchObject({ wrong: true, ca: 'mom' })
    for (const q of ['T1', 'G1', 'Y1']) expect(theo.has(q)).toBe(false)
  })

  it('câu có ở cả thi và BTVN: HỒ SƠ quyết wrong (sai ở thi, đã sửa xong ở BTVN thì không còn "weak")', async () => {
    const d = await dungBoiCanh()
    const { evidence } = await readScope(d.env, 'S1')
    expect(evidence.find((e) => e.qid === 'X1')).toMatchObject({ wrong: false })
  })

  it('có bằng chứng thì game mở được câu cùng dạng (trước Kênh 4: không có gì để mở vì BTVN không phải bằng chứng)', async () => {
    const d = await dungBoiCanh()
    const { pool, evidence } = await readScope(d.env, 'S1')
    expect(evidence.length).toBeGreaterThan(0)
    expect(pool.map((q) => q.qid)).toEqual(expect.arrayContaining(['B1', 'M1', 'K1'])) // K1: cùng dạng ES.A.X, em chưa gặp
  })

  it('chưa có bảng hồ sơ / sổ (fixture cũ, migration chưa chạy): không ném lỗi, evidence như trước', async () => {
    const d = await dungBoiCanh()
    d.sql.exec('DROP TABLE nam_kt_cau')
    await expect(readScope(d.env, 'S1')).resolves.toMatchObject({ evidence: [] })
    d.sql.exec('DROP TABLE su_kien_hoc')
    await expect(readScope(d.env, 'S1')).resolves.toMatchObject({ evidence: [] })
  })
})

describe('K4.2 mốc ôn: MỘT đồng hồ = nam_kt_dang.moc_on_ke', () => {
  const mast = (key: string, due: number) => ({ key, stage: 1, first: 1, due, groups: ['g1'], repaired: false })
  async function dungHoSo() {
    const d = taoD1That()
    themHs(d, 'S1')
    themCau(d, [cauKho('A1', 'ES.A.X'), cauKho('B1', 'ES.B.Y'), cauKho('C1', 'ES.C.Z')])
    await ghi(d, [
      { qid: 'A1', nguon: 'btvn', gio: -72, kq: 0, dang: 'ES.A.X' }, // dạng A: câu sai chưa khắc phục → có moc_on_ke
      { qid: 'B1', nguon: 'btvn', gio: -72, kq: 0, dang: 'ES.B.Y' }, // dạng B: có mốc, game chưa có mastery cho nó
      { qid: 'C1', nguon: 'btvn', gio: -72, kq: 1, dang: 'ES.C.Z' }, // dạng C: chưa từng sai → moc_on_ke NULL
    ])
    await dung(d)
    return d
  }
  const moc = (d: D1That, dang: string) => (d.sql.prepare("SELECT moc_on_ke FROM nam_kt_dang WHERE sbd='S1' AND ma_dang=?").get(dang) as { moc_on_ke: string | null }).moc_on_ke

  it('due của dạng có mốc = 00:00 giờ VN của moc_on_ke; dạng chưa có mastery thì thêm dòng tổng hợp; dạng không có mốc giữ due của game', async () => {
    const d = await dungHoSo()
    expect(moc(d, 'ES.A.X')).toBeTruthy()
    expect(moc(d, 'ES.C.Z')).toBeNull()
    const vao = [mast('ES.A.X', 9_999_999_999_999), mast('ES.C.Z', 12345), mast('KHAC', 7)]
    const ra = await masteryTheoHoSo(d.env, 'S1', vao)
    const by = new Map(ra.map((m) => [m.key, m]))
    expect(by.get('ES.A.X')!.due).toBe(dauNgayVn(moc(d, 'ES.A.X')!))
    expect(by.get('ES.C.Z')!.due).toBe(12345) // không có mốc: giữ lịch của game
    expect(by.get('KHAC')!.due).toBe(7)
    expect(by.get('ES.B.Y')).toMatchObject({ key: 'ES.B.Y', stage: 0, first: 0, groups: [], repaired: false, due: dauNgayVn(moc(d, 'ES.B.Y')!) })
    expect(ra).toHaveLength(4)
  })

  it('KHÔNG sửa đầu vào: mảng, phần tử và groups đều nguyên; bản sao có groups riêng', async () => {
    const d = await dungHoSo()
    const vao = [mast('ES.A.X', 9_999_999_999_999)]
    const truoc = JSON.stringify(vao)
    const ra = await masteryTheoHoSo(d.env, 'S1', vao)
    expect(JSON.stringify(vao)).toBe(truoc)
    expect(ra[0]).not.toBe(vao[0])
    ra[0]!.groups.push('x')
    expect(vao[0]!.groups).toEqual(['g1'])
  })

  it('mốc "đã tới" ⇒ chooseSession coi là due; mốc tương lai thì chưa (đúng đơn vị NGÀY, giờ VN)', async () => {
    const d = await dungHoSo()
    const homNay = ngayVn(Date.now())
    const ra = await masteryTheoHoSo(d.env, 'S1', [])
    const a = ra.find((m) => m.key === 'ES.A.X')!
    // Câu sai 3 ngày trước ⇒ mốc ôn ≤ hôm nay ⇒ due ≤ giờ hiện tại.
    expect(a.due).toBeLessThanOrEqual(Date.now())
    expect(moc(d, 'ES.A.X')! <= homNay).toBe(true)
  })

  it('mã dạng thiếu (CD:…) bỏ qua; không có bảng hồ sơ → trả đúng mảng đầu vào', async () => {
    const d = await dungHoSo()
    d.sql.prepare("INSERT INTO nam_kt_dang(khoa,sbd,ma_dang,so_gap,so_sai,so_da_khac_phuc,so_moi_sai,so_chua_thay_sai,bac,moc_on_ke,moc_moi_sai,cap_nhat_luc) VALUES('S1|CD:x','S1','CD:x',1,1,0,1,0,1,'2020-01-01','2020-01-01','x')").run()
    expect((await masteryTheoHoSo(d.env, 'S1', [])).map((m) => m.key)).not.toContain('CD:x')
    d.sql.exec('DROP TABLE nam_kt_dang')
    const vao = [mast('ES.A.X', 5)]
    expect(await masteryTheoHoSo(d.env, 'S1', vao)).toBe(vao)
  })
})

describe('K4.4 câu game KHÔNG được ra: đã làm hôm nay ở nguồn khác, hoặc nằm trong bài Mom chưa nộp', () => {
  const themMom = (d: D1That, id: string, qids: string[] | null, taoGio: number, nop = false) =>
    d.sql.prepare('INSERT INTO mom_bai(sbd,id,title,created_at,question_count,bank_key,submitted_at,qid_json) VALUES(?,?,?,?,?,?,?,?)')
      .run('S1', id, 't', iso(taoGio), 3, 'k', nop ? iso(taoGio) : null, qids === null ? null : JSON.stringify(qids))

  it('sự kiện HÔM NAY ở mọi nguồn trừ game bị chặn; hôm qua và game thì không', async () => {
    const d = taoD1That()
    themHs(d, 'S1')
    await ghi(d, [
      { qid: 'NAY-BTVN', nguon: 'btvn', gio: -0.5, kq: 1 }, { qid: 'NAY-ONLAI', nguon: 'on_lai', gio: -0.4, kq: 0 }, { qid: 'NAY-GAME', nguon: 'game', gio: -0.3, kq: 1 },
      { qid: 'HOM-QUA', nguon: 'btvn', gio: -30, kq: 1 },
    ])
    expect([...(await qidChanHomNay(d.env, 'S1', Date.now()))].sort()).toEqual(['NAY-BTVN', 'NAY-ONLAI'])
  })

  it('qid của bài Mom CHƯA NỘP trong 3 ngày VN gần nhất bị chặn; bài đã nộp, bài tồn cũ, bài cũ không qid_json thì không', async () => {
    const d = taoD1That()
    themHs(d, 'S1')
    themMom(d, 'M-MOI', ['A', 'B'], -2)
    themMom(d, 'M-QUA', ['C'], -24 * 2 - 1)
    themMom(d, 'M-DA-NOP', ['D'], -2, true)
    themMom(d, 'M-TON-CU', ['E'], -24 * 6)
    themMom(d, 'M-CU', null, -2)
    expect([...(await qidChanHomNay(d.env, 'S1', Date.now()))].sort()).toEqual(['A', 'B', 'C'])
  })

  it('thiếu bảng/cột → tập rỗng, không ném lỗi', async () => {
    const d = taoD1That()
    d.sql.exec('DROP TABLE su_kien_hoc')
    d.sql.exec('ALTER TABLE mom_bai DROP COLUMN qid_json')
    expect((await qidChanHomNay(d.env, 'S1', Date.now())).size).toBe(0)
  })
})

describe('K4.3 nhiệm vụ thần thú tự sinh từ việc than_thu NHÃN bu của kế hoạch ngày', () => {
  const nhiemVu = (d: D1That) => d.sql.prepare("SELECT id, sbd, dang, created_at, completed_at FROM game_v2_task WHERE sbd='S1' ORDER BY id").all() as { id: string; dang: string; created_at: string; completed_at: string | null }[]
  /** 1 câu sai 3 ngày trước ở dạng ES.A.X, hôm nay chưa làm gì → thiếu → kế hoạch có on_lai + than_thu bu. */
  async function dungThieu() {
    const d = taoD1That()
    themHs(d, 'S1')
    await ghi(d, [{ qid: 'A1', nguon: 'btvn', gio: -72, kq: 0, dang: 'ES.A.X' }])
    return d
  }
  const lap = (d: D1That, now = Date.now(), luu = true) => lapVaLuuKeHoach(d.env, ['S1'], now, { luu })

  it('sinh đúng MỘT nhiệm vụ: id sbd|than_thu|ngày|dạng, mở (completed_at NULL); lập lại không nhân đôi', async () => {
    const d = await dungThieu()
    const kh = (await lap(d)).get('S1')!
    const bu = kh.viec.find((v) => v.loai === 'than_thu')
    expect(bu?.nhan).toBe('bu')
    expect(nhiemVu(d)).toHaveLength(1)
    expect(nhiemVu(d)[0]).toMatchObject({ id: `S1|than_thu|${kh.ngay}|ES.A.X`, dang: 'ES.A.X', completed_at: null })
    await lap(d); await lap(d)
    expect(nhiemVu(d)).toHaveLength(1)
  })

  it('KHÔNG sinh khi lập ở chế độ không lưu (luu:false), và khi em không thiếu (không có việc than_thu bu)', async () => {
    const d = await dungThieu()
    await lap(d, Date.now(), false)
    expect(nhiemVu(d)).toHaveLength(0)
    // Em đã làm đủ mức tối thiểu hôm nay: không việc bu.
    await ghi(d, ['P1', 'P2', 'P3', 'P4', 'P5'].map((q) => ({ qid: q, nguon: 'btvn' as const, gio: -0.1, kq: 1 as const })))
    const kh = (await lap(d)).get('S1')!
    expect(kh.viec.some((v) => v.loai === 'than_thu' && v.nhan === 'bu')).toBe(false)
    expect(nhiemVu(d)).toHaveLength(0)
  })

  it('đã có nhiệm vụ MỞ cùng dạng (phụ huynh nhắc) thì không sinh thêm', async () => {
    const d = await dungThieu()
    d.sql.prepare("INSERT INTO game_v2_task(id,sbd,dang,created_at) VALUES('ph-nhac','S1','ES.A.X',?)").run(iso(-5))
    await lap(d)
    expect(nhiemVu(d).map((x) => x.id)).toEqual(['ph-nhac'])
  })

  it(`đã đủ ${NHIEM_VU_THAN_THU_MO_TOI_DA} nhiệm vụ mở (khác dạng) thì không sinh thêm; hoàn thành một cái thì sinh lại được`, async () => {
    const d = await dungThieu()
    for (const [i, dang] of ['ZZ.A.X', 'ZZ.B.X', 'ZZ.C.X'].entries()) d.sql.prepare('INSERT INTO game_v2_task(id,sbd,dang,created_at) VALUES(?,?,?,?)').run(`t${i}`, 'S1', dang, iso(-5))
    await lap(d)
    expect(nhiemVu(d)).toHaveLength(NHIEM_VU_THAN_THU_MO_TOI_DA)
    d.sql.prepare("UPDATE game_v2_task SET completed_at = ? WHERE id = 't0'").run(iso(-1))
    // Kế hoạch ưu tiên nhiệm vụ mở có sẵn; nhiệm vụ tự sinh chỉ khi còn chỗ và dạng của việc bu chưa có nhiệm vụ mở.
    await lap(d)
    expect(nhiemVu(d).filter((x) => x.completed_at === null).length).toBeLessThanOrEqual(NHIEM_VU_THAN_THU_MO_TOI_DA)
  })

  it('nhiệm vụ hoàn thành rồi thì ngày sau sinh lại được (id có ngày); không đụng nhiệm vụ của em khác', async () => {
    const d = await dungThieu()
    themHs(d, 'S9')
    const kh = (await lap(d)).get('S1')!
    d.sql.prepare('UPDATE game_v2_task SET completed_at = ?').run(iso(-1))
    await lap(d, Date.now() + 24 * H)
    const moi = nhiemVu(d).filter((x) => x.completed_at === null)
    expect(moi).toHaveLength(1)
    expect(moi[0]!.id).not.toBe(`S1|than_thu|${kh.ngay}|ES.A.X`)
    expect(d.sql.prepare("SELECT COUNT(*) n FROM game_v2_task WHERE sbd='S9'").get()).toEqual({ n: 0 })
  })

  it('chưa có bảng game_v2_task (migration chưa chạy): kế hoạch vẫn ra, không ném lỗi', async () => {
    const d = await dungThieu()
    d.sql.exec('DROP TABLE game_v2_task')
    const kh = (await lap(d)).get('S1')!
    expect(kh.viec.length).toBeGreaterThan(0)
  })
})

describe('K4 tích hợp: gameV2 start trên D1 thật', () => {
  async function dungGame() {
    const d = taoD1That()
    themHs(d, 'S1')
    d.sql.exec('CREATE TABLE IF NOT EXISTS game_v2_settings (key TEXT PRIMARY KEY, json TEXT NOT NULL)')
    themCau(d, ['K1', 'K2', 'K3', 'K4'].map((q) => cauKho(q, 'ES.A.X')))
    // K1 sai ở BTVN 3 ngày trước (bằng chứng), K2 nằm trong bài Mom chưa nộp giao hôm nay, K3/K4 chưa gặp (cùng dạng, cùng kiến thức).
    await ghi(d, [{ qid: 'K1', nguon: 'btvn', gio: -72, kq: 0 }])
    d.sql.prepare('INSERT INTO mom_bai(sbd,id,title,created_at,question_count,bank_key,qid_json) VALUES(?,?,?,?,?,?,?)').run('S1', 'daily_x', 't', iso(-1), 1, 'k', JSON.stringify(['K2']))
    await dung(d)
    return d
  }
  const start = async (d: D1That) => gameV2(d.env, 'start', { token: await gameToken(d.env, 'S1') }) as Promise<{ ok: boolean; questions: { qid: string }[] }>

  it('game mở câu từ bằng chứng BTVN; câu đang nằm trong bài Mom chưa nộp KHÔNG ra; mọi câu ra đều thuộc dạng đúng', async () => {
    const d = await dungGame()
    const r = await start(d)
    expect(r.ok).toBe(true)
    const qid = r.questions.map((q) => q.qid)
    expect(qid.length).toBeGreaterThan(0)
    expect(qid).toContain('K1') // câu sai ở BTVN là "weak", game ưu tiên ôn
    expect(qid).not.toContain('K2') // đang giao ở Mom hôm nay
    for (const q of qid) expect(['K1', 'K3', 'K4']).toContain(q)
  })

  it('câu vừa làm HÔM NAY ở nguồn khác không ra; hồ sơ game đã lưu KHÔNG bị đổi bởi việc chọn câu (bản sao mastery)', async () => {
    const d = await dungGame()
    await ghi(d, [{ qid: 'K3', nguon: 'on_lai', gio: -0.2, kq: 1 }])
    const luu = { pet: 'hoa_long', choice: false, legacy: null, cap: 3, exp: 5, wallet: 0, earned: 0, tower: 1, arena: null, cutover: '2020-01-01T00:00:00.000Z',
      mastery: [{ key: 'ES.A.X', stage: 1, first: 1, due: 9_999_999_999_999, groups: ['g-old'], repaired: false }] }
    d.sql.prepare('INSERT INTO game_v2_profile(sbd,json,created_at) VALUES(?,?,?)').run('S1', JSON.stringify(luu), 'x')
    const r = await start(d)
    expect(r.questions.map((q) => q.qid)).not.toContain('K3')
    const sau = JSON.parse((d.sql.prepare("SELECT json FROM game_v2_profile WHERE sbd='S1'").get() as { json: string }).json)
    expect(sau.mastery).toEqual(luu.mastery) // due gốc 9_999_999_999_999 vẫn nguyên: chỉ bản sao được đổi
  })

  it('không có hồ sơ/sổ (fixture cũ): game chạy như trước, không lỗi', async () => {
    const d = await dungGame()
    d.sql.exec('DROP TABLE nam_kt_cau'); d.sql.exec('DROP TABLE nam_kt_dang'); d.sql.exec('DROP TABLE su_kien_hoc')
    const r = await start(d)
    expect(r.ok).toBe(true)
  })
})

describe('bộ nhớ đệm câu đang bảo vệ KHÔNG bị lệnh game ghi bẩn (Code 5 báo 19/09)', () => {
  it('protectedQuestions trả BẢN SAO: thêm vào kết quả không đổi các lần gọi sau (cả lần dựng mới lẫn lần trúng đệm)', async () => {
    const d = taoD1That()
    // Mã ca riêng cho từng lần chạy → vân tay đệm mới → lần gọi đầu là LẦN DỰNG MỚI, lần sau trúng đệm.
    d.sql.prepare("INSERT INTO ca(ma_ca,trang_thai,cap_nhat_luc) VALUES(?, 'mo', 'x')").run(`CA-DEM-${Date.now()}-${Math.random()}`)
    const moi = await protectedQuestions(d.env)
    moi.add('RO-RI-MOI')
    const trung = await protectedQuestions(d.env)
    expect(trung.has('RO-RI-MOI')).toBe(false)
    trung.add('RO-RI-TRUNG')
    expect((await protectedQuestions(d.env)).has('RO-RI-TRUNG')).toBe(false)
    expect(moi).not.toBe(trung)
  })

  it('câu em A làm hôm nay không làm em B mất câu khi hai em gọi start trong CÙNG tiến trình (trước sửa: B mất Q)', async () => {
    const d = taoD1That()
    themHs(d, 'S1'); themHs(d, 'S2')
    d.sql.exec('CREATE TABLE IF NOT EXISTS game_v2_settings (key TEXT PRIMARY KEY, json TEXT NOT NULL)')
    d.sql.prepare("INSERT INTO ca(ma_ca,trang_thai,cap_nhat_luc) VALUES(?, 'mo', 'x')").run(`CA-DEM2-${Date.now()}-${Math.random()}`)
    themCau(d, ['E1', 'Q1', 'Q2', 'Q3', 'Q4'].map((q) => cauKho(q, 'ES.A.X')))
    // Cả hai em cùng có bằng chứng dạng ES.A.X (E1 sai ở BTVN 3 ngày trước). CHỈ S1 làm Q1 hôm nay ở BTVN.
    await ghi(d, [
      { sbd: 'S1', qid: 'E1', nguon: 'btvn', gio: -72, kq: 0 }, { sbd: 'S2', qid: 'E1', nguon: 'btvn', gio: -72, kq: 0 },
      { sbd: 'S1', qid: 'Q1', nguon: 'btvn', gio: -0.5, kq: 1 },
    ])
    await dung(d, 'S1'); await dung(d, 'S2')
    const start = async (sbd: string) => ((await gameV2(d.env, 'start', { token: await gameToken(d.env, sbd) })) as { questions: { qid: string }[] }).questions.map((q) => q.qid)
    const s1 = await start('S1')
    expect(s1).not.toContain('Q1') // S1 vừa làm Q1 hôm nay: không ra ở game
    const s2 = await start('S2')
    expect(s2).toContain('Q1') // S2 chưa làm Q1: kho của S2 không được teo vì S1
    expect((await start('S1'))).not.toContain('Q1')
  })
})
