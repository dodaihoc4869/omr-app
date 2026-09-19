// @vitest-environment node
// EXP HỌC TẬP + MẢNH KHIÊN — TẦNG D1 (DE-XUAT-EXP-MANH-KHIEN-1909.md, Bước 2). Chạy trên SQLite THẬT (lược đồ thật + mọi migration).
import { describe, it, expect, vi } from 'vitest'
import worker from '../server/src/index'
import { capNhatExp, chotExpNgayQua, congVaoHoSoGame, docCauHinhExp, docExpHomNay, docThanhTichNgay, ghiTiepSuc, hsKeHoachNgayCoExp, mocExpCuaEm } from '../server/src/exp-d1'
import { congTongSoVaoHoSo, khienConLai, khienRenChuaDung } from '../server/src/exp-ho-so-game'
import { ghiSuKien, ngayVn } from '../server/src/su-kien-hoc'
import { dungLaiHoSo } from '../server/src/ho-so-nam-kt'
import { gameV2 } from '../server/src/game-v2'
import { nhanExp } from '../src/game/than-thu-hoa-hoc/kinh-nghiem'
import { goiWorker, taoD1That, type D1That } from './_d1-that'

vi.mock('../server/src/game-v2-auth', async (orig) => ({
  ...(await orig<typeof import('../server/src/game-v2-auth')>()),
  gameIdentity: async (_e: unknown, b: Record<string, unknown>) => {
    if (b.token !== 'token-S1') throw new Error('Phiên đăng nhập không hợp lệ.')
    return 'S1'
  },
}))

const H = 3_600_000
const D = 24 * H
const NOW = Date.parse('2026-09-20T05:00:00.000Z') // 12:00 VN, thứ Bảy 20/09/2026
const HOM_NAY = '2026-09-20'
const TU = '2026-09-01T00:00:00.000Z'
const iso = (ms: number) => new Date(ms).toISOString()

const hoSoGame = (o: Record<string, unknown> = {}) => ({ pet: 'dat_quy', choice: false, legacy: null, cap: 1, exp: 0, wallet: 0, earned: 0, tower: 1, mastery: [], arena: null, cutover: '2026-08-01T00:00:00.000Z', ...o })
const themHs = (d: D1That, sbd = 'S1') => d.sql.prepare("INSERT OR IGNORE INTO hoc_sinh(sbd,ho_ten,cap_nhat_luc) VALUES(?,'x','x')").run(sbd)
const themHoSoGame = (d: D1That, o: Record<string, unknown> = {}, sbd = 'S1') => d.sql.prepare('INSERT INTO game_v2_profile(sbd,revision,json,created_at) VALUES(?,0,?,?)').run(sbd, JSON.stringify(hoSoGame(o)), 'x')
const docHoSoGame = (d: D1That, sbd = 'S1') => JSON.parse((d.sql.prepare('SELECT json FROM game_v2_profile WHERE sbd=?').get(sbd) as { json: string }).json) as Record<string, any>
const bat = (d: D1That, o: Record<string, unknown> = { dsSbd: ['S1'] }) => d.sql.prepare("INSERT OR REPLACE INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('exp_moi',?,'x')").run(JSON.stringify({ tu: TU, ...o }))
const cauKho = (d: D1That, qid: string, phan: 'I' | 'II' | 'III', sao: number | null) =>
  d.sql.prepare('INSERT OR REPLACE INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)').run('DE1', qid, 'v', `g-${qid}`, 'AA.BB', JSON.stringify({ qid, phan, sao }))
type Nguon = 'thi' | 'btvn' | 'btvn_lo' | 'khac_phuc' | 'mom' | 'len_bang' | 'game' | 'luyen' | 'on_lai'
const sk = (qid: string, ketQua: 0 | 1 | null, luc: number, o: { nguon?: Nguon; maNguon?: string; lan?: number; sbd?: string } = {}) => ({
  // `lan` mặc định khác nhau theo giây để hai lần làm cùng một câu không đụng khoá idempotent của sổ.
  nguon: (o.nguon ?? 'btvn') as Nguon, maNguon: o.maNguon ?? 'B', sbd: o.sbd ?? 'S1', qid, lan: o.lan ?? Math.floor(luc / 1000), ketQua, luc: iso(luc),
})
const ghi = async (d: D1That, ds: ReturnType<typeof sk>[]) => expect((await ghiSuKien(d.env, ds)).ok).toBe(true)
const dongExp = (d: D1That, sbd = 'S1') => d.sql.prepare('SELECT * FROM exp_so WHERE sbd=? ORDER BY luc, khoa').all(sbd) as Record<string, any>[]
const dongManh = (d: D1That, sbd = 'S1') => d.sql.prepare('SELECT * FROM manh_khien_so WHERE sbd=? ORDER BY luc, khoa').all(sbd) as Record<string, any>[]
const tongExp = (d: D1That, sbd = 'S1') => dongExp(d, sbd).reduce((t, x) => t + Number(x.exp), 0)
const khoaExp = (d: D1That, sbd = 'S1') => dongExp(d, sbd).map((x) => String(x.khoa).slice(sbd.length + 1))
const expCua = (d: D1That, khoa: string, sbd = 'S1') => dongExp(d, sbd).find((x) => x.khoa === `${sbd}|${khoa}`)?.exp
const luuKeHoach = (d: D1That, o: { ngay?: string; mucTieu?: number; toiThieu?: number; viec?: unknown[]; soCauToiHan?: number; treNhip?: boolean; ketQua?: string | null; sbd?: string } = {}) => {
  const ngay = o.ngay ?? HOM_NAY
  const sbd = o.sbd ?? 'S1'
  d.sql.prepare(
    `INSERT OR REPLACE INTO ke_hoach_ngay(khoa,sbd,ngay,phien_ban,seed,ngan_sach_json,viec_json,canh_bao_json,ket_qua,la_ngay_nghi,so_su_kien,cap_nhat_luc) VALUES(?,?,?,1,1,?,?,'[]',?,0,0,'x')`,
  ).run(
    `${sbd}|${ngay}`, sbd, ngay, JSON.stringify({ mucTieuCau: o.mucTieu ?? 8, toiThieuCau: o.toiThieu ?? 4 }),
    JSON.stringify({ viec: o.viec ?? [], tienBo: { soCauToiHan: o.soCauToiHan ?? 0, treNhip: o.treNhip ?? false } }), o.ketQua ?? null,
  )
}
async function dung() {
  const d = taoD1That()
  themHs(d)
  themHoSoGame(d)
  bat(d)
  return d
}
const qid = (i: number, phan: 'I' | 'II' | 'III' = 'I') => `DE1-${phan}-${i}`

describe('cờ: KHÔNG có cấu hình = tắt, hành vi y như cũ', () => {
  it('không có dòng `exp_moi` → bat:false, không ghi sổ EXP, không đổi hồ sơ game', async () => {
    const d = taoD1That()
    themHs(d)
    themHoSoGame(d)
    await ghi(d, [sk(qid(1), 1, NOW)])
    const truoc = docHoSoGame(d)
    const r = await capNhatExp(d.env, 'S1', NOW)
    expect(r).toEqual({ bat: false, khoan: [], manh: [], daCong: null, datNgay: null })
    expect(d.dem('exp_so') + d.dem('manh_khien_so')).toBe(0)
    expect(docHoSoGame(d)).toEqual(truoc)
  })
  it('dsSbd chỉ bật đúng em trong danh sách; `tu` ở tương lai, JSON hỏng, toanBo:false không danh sách → tắt', async () => {
    const d = taoD1That()
    bat(d, { dsSbd: ['12121212'] })
    const cfg = await docCauHinhExp(d.env)
    expect(mocExpCuaEm(cfg, '12121212', NOW)).toBe(TU)
    expect(mocExpCuaEm(cfg, 'S9', NOW)).toBeNull()
    expect(mocExpCuaEm({ ...cfg, tu: iso(NOW + H) }, '12121212', NOW)).toBeNull()
    expect(mocExpCuaEm({ ...cfg, toanBo: true }, 'S9', NOW)).toBe(TU)
    d.sql.prepare("UPDATE cau_hinh SET gia_tri='{hỏng' WHERE khoa='exp_moi'").run()
    expect(mocExpCuaEm(await docCauHinhExp(d.env), '12121212', NOW)).toBeNull()
  })
  it('chưa chạy migration (thiếu bảng cau_hinh) → tắt, không ném lỗi', async () => {
    const d = taoD1That()
    d.sql.exec('DROP TABLE cau_hinh')
    expect((await capNhatExp(d.env, 'S1', NOW)).bat).toBe(false)
  })
})

describe('EXP câu đúng theo bảng phần × sao (mọi nguồn trừ game)', () => {
  it('bảng 9 ô qua D1: I [2,3,5] · II [3,5,8] · III [4,6,10]; sao thiếu → 0 sao', async () => {
    const d = await dung()
    const ds: [string, 'I' | 'II' | 'III', number | null, number][] = [
      ['a1', 'I', 0, 2], ['a2', 'I', 1, 3], ['a3', 'I', 2, 5], ['b1', 'II', 0, 3], ['b2', 'II', 1, 5], ['b3', 'II', 2, 8], ['c1', 'III', 0, 4], ['c2', 'III', 1, 6], ['c3', 'III', 2, 10], ['d1', 'II', null, 3],
    ]
    for (const [q, p, s] of ds) cauKho(d, q, p, s)
    await ghi(d, ds.map(([q], i) => sk(q, 1, NOW - i * 1000)))
    const r = await capNhatExp(d.env, 'S1', NOW)
    expect(r.bat).toBe(true)
    for (const [q, , , exp] of ds) expect(expCua(d, `cau|${q}|${HOM_NAY}`), q).toBe(exp)
    expect(tongExp(d)).toBe(2 + 3 + 5 + 3 + 5 + 8 + 4 + 6 + 10 + 3)
  })
  it('sai và bỏ trống = 0 EXP; nguồn game không nhận EXP câu; cùng qid hai lần một ngày = một khoản', async () => {
    const d = await dung()
    await ghi(d, [
      sk(qid(1), 0, NOW), sk(qid(2), null, NOW), sk(qid(3), 1, NOW, { nguon: 'game', maNguon: 'S' }),
      sk(qid(4), 1, NOW - 2000, { lan: 1 }), sk(qid(4), 1, NOW - 1000, { lan: 2 }),
    ])
    await capNhatExp(d.env, 'S1', NOW)
    expect(khoaExp(d)).toEqual([`cau|${qid(4)}|${HOM_NAY}`])
    expect(tongExp(d)).toBe(2)
  })
  it('trần MỀM: 2 × mục tiêu (mặc định 8 → 16 câu) tính đủ, câu sau nhận 25% (làm tròn lên, tối thiểu 1)', async () => {
    const d = await dung()
    await ghi(d, Array.from({ length: 18 }, (_, i) => sk(qid(i), 1, NOW - (20 - i) * 1000)))
    await capNhatExp(d.env, 'S1', NOW)
    expect(dongExp(d).filter((x) => x.loai === 'cau').map((x) => x.exp)).toEqual([...Array(16).fill(2), 1, 1])
  })
  it('mục tiêu ngày lấy từ kế hoạch ĐÃ LƯU: mục tiêu 10 → ngưỡng 20 câu', async () => {
    const d = await dung()
    luuKeHoach(d, { mucTieu: 10, toiThieu: 99 })
    await ghi(d, Array.from({ length: 21 }, (_, i) => sk(qid(i), 1, NOW - (30 - i) * 1000)))
    await capNhatExp(d.env, 'S1', NOW)
    const c = dongExp(d).filter((x) => x.loai === 'cau').map((x) => x.exp)
    expect(c.slice(0, 20).every((e) => e === 2)).toBe(true)
    expect(c[20]).toBe(1)
  })
})

describe('idempotent: gọi lại / gọi chồng nhau không cộng trùng', () => {
  it('gọi hai lần: sổ và hồ sơ game không đổi ở lần hai', async () => {
    const d = await dung()
    await ghi(d, Array.from({ length: 5 }, (_, i) => sk(qid(i), 1, NOW - i * 1000)))
    const a = await capNhatExp(d.env, 'S1', NOW)
    expect(a.khoan).toHaveLength(5)
    const sau1 = { so: d.chup('exp_so'), hs: docHoSoGame(d) }
    const b = await capNhatExp(d.env, 'S1', NOW)
    expect(b.khoan).toEqual([])
    expect(b.daCong).toEqual({ exp: 0, manh: 0, khienMoi: 0 })
    expect(d.chup('exp_so')).toBe(sau1.so)
    expect(docHoSoGame(d)).toEqual(sau1.hs)
  })
  it('hai ĐỢT sự kiện cách nhau: mỗi lần chỉ cộng phần MỚI (tổng hồ sơ = tổng sổ, không cộng lại đợt đầu)', async () => {
    const d = await dung()
    await ghi(d, [sk(qid(1), 1, NOW - 5000), sk(qid(2), 1, NOW - 4000)])
    expect((await capNhatExp(d.env, 'S1', NOW)).daCong).toEqual({ exp: 4, manh: 0, khienMoi: 0 })
    await ghi(d, [sk(qid(3), 1, NOW - 3000)])
    expect((await capNhatExp(d.env, 'S1', NOW)).daCong).toEqual({ exp: 2, manh: 0, khienMoi: 0 })
    expect(docHoSoGame(d).earned).toBe(6)
    expect(docHoSoGame(d).expMoi.daCong).toBe(tongExp(d))
  })
  it('ba lần gọi CHỒNG NHAU: tổng hồ sơ game = tổng sổ, mỗi khoản cộng đúng một lần', async () => {
    const d = await dung()
    await ghi(d, Array.from({ length: 6 }, (_, i) => sk(qid(i), 1, NOW - i * 1000)))
    await Promise.all([capNhatExp(d.env, 'S1', NOW), capNhatExp(d.env, 'S1', NOW), capNhatExp(d.env, 'S1', NOW)])
    const p = docHoSoGame(d)
    expect(d.dem('exp_so')).toBe(6)
    expect(p.expMoi.daCong).toBe(12)
    expect(p.earned).toBe(12)
    expect({ cap: p.cap, exp: p.exp }).toEqual({ cap: nhanExp({ capDo: 1, exp: 0 }, 12).capDo, exp: nhanExp({ capDo: 1, exp: 0 }, 12).exp })
  })
  it('EM CHƯA CÓ HỒ SƠ GAME: khoản nằm chờ trong sổ; có hồ sơ rồi thì cộng đủ, đúng một lần', async () => {
    const d = taoD1That()
    themHs(d)
    bat(d)
    await ghi(d, [sk(qid(1), 1, NOW), sk(qid(2), 1, NOW - 1000)])
    const a = await capNhatExp(d.env, 'S1', NOW)
    expect(a.daCong).toBeNull()
    expect(tongExp(d)).toBe(4)
    themHoSoGame(d)
    const b = await capNhatExp(d.env, 'S1', NOW)
    expect(b.khoan).toEqual([])
    expect(b.daCong).toEqual({ exp: 4, manh: 0, khienMoi: 0 })
    expect(docHoSoGame(d).earned).toBe(4)
    expect((await capNhatExp(d.env, 'S1', NOW)).daCong).toEqual({ exp: 0, manh: 0, khienMoi: 0 })
    expect(docHoSoGame(d).earned).toBe(4)
  })
  it('hồ sơ mùa game MỚI không nhận khoản của mùa cũ (luc < startedAt)', async () => {
    const d = await dung()
    await ghi(d, [sk(qid(1), 1, NOW - 3 * H), sk(qid(2), 1, NOW)])
    await capNhatExp(d.env, 'S1', NOW)
    // Sang mùa mới lúc NOW − 1 giờ: hồ sơ được tạo lại trắng.
    d.sql.exec(`CREATE TABLE IF NOT EXISTS game_v2_settings (key TEXT PRIMARY KEY, json TEXT NOT NULL)`)
    d.sql.prepare("INSERT OR REPLACE INTO game_v2_settings(key,json) VALUES('season',?)").run(JSON.stringify({ id: 's2', startedAt: iso(NOW - H) }))
    d.sql.prepare('UPDATE game_v2_profile SET json=? WHERE sbd=?').run(JSON.stringify(hoSoGame()), 'S1')
    const r = await congVaoHoSoGame(d.env, 'S1', iso(NOW - H))
    expect(r).toEqual({ exp: 2, manh: 0, khienMoi: 0 })
    expect(docHoSoGame(d).earned).toBe(2)
  })
})

describe('chuyển trạng thái hồ sơ: lên bậc, khắc phục, mọi nguồn', () => {
  it('LÊN BẬC chỉ khi đúng ở NGÀY KHÁC lần sai; sai và đúng cùng ngày thì không', async () => {
    const d = await dung()
    await ghi(d, [sk('A', 0, NOW - D), sk('A', 1, NOW), sk('B', 0, NOW - 2000), sk('B', 1, NOW - 1000, { lan: 2 })])
    await capNhatExp(d.env, 'S1', NOW)
    expect(khoaExp(d).filter((k) => k.startsWith('bac|'))).toEqual([`bac|A|${HOM_NAY}`])
    expect(expCua(d, `bac|A|${HOM_NAY}`)).toBe(6)
  })
  it('lên bậc tính cả khi lần đúng đến từ GAME (chuyển trạng thái áp cho mọi nguồn) nhưng câu game không nhận EXP câu', async () => {
    const d = await dung()
    await ghi(d, [sk('A', 0, NOW - D), sk('A', 1, NOW, { nguon: 'game', maNguon: 'S' })])
    await capNhatExp(d.env, 'S1', NOW)
    expect(khoaExp(d)).toEqual([`bac|A|${HOM_NAY}`])
  })
  it('KHẮC PHỤC +30 đúng MỘT lần mỗi vòng; tái phát rồi khắc phục lại → lần mới', async () => {
    const d = await dung()
    const ngay = (n: number) => NOW + n * D
    await ghi(d, [
      sk('A', 0, ngay(-12)), sk('A', 1, ngay(-11)), sk('A', 1, ngay(-10)), sk('A', 1, ngay(-9)),
      sk('A', 0, ngay(-6)), sk('A', 1, ngay(-5)), sk('A', 1, ngay(-4)), sk('A', 1, ngay(-3)),
    ])
    for (const n of [-12, -11, -10, -9, -9, -6, -5, -4, -3, -3]) await capNhatExp(d.env, 'S1', ngay(n))
    const kp = dongExp(d).filter((x) => x.loai === 'khac_phuc')
    expect(kp.map((x) => [x.khoa.slice(3), x.exp])).toEqual([['kp|A|1', 30], ['kp|A|2', 30]])
  })
  it('DẠNG RỜI danh sách yếu → +2 mảnh khiên, một lần cho mỗi số câu từng sai', async () => {
    const d = await dung()
    // 4 câu cùng dạng: 3 sai ở ngày cũ (dạng yếu: 1/4 chưa sai... < 0,7), rồi hôm nay em đúng lại cả 3 → đúng ≥ 0,7 sau khi khắc phục đủ mốc.
    const dang = (q: string) => ({ ...sk(q, 1, NOW), maDang: 'ZZ.YY' })
    void dang
    const ds = ['x1', 'x2', 'x3', 'x4']
    const ev = [
      ...ds.slice(0, 3).flatMap((q, i) => [sk(q, 0, NOW - 10 * D + i), sk(q, 1, NOW - 9 * D + i), sk(q, 1, NOW - 8 * D + i)]),
      sk('x4', 1, NOW - 10 * D + 5),
      ...ds.slice(0, 3).map((q, i) => sk(q, 1, NOW - i - 1000)),
    ]
    await ghi(d, ev)
    d.sql.prepare("UPDATE su_kien_hoc SET ma_dang='ZZ.YY' WHERE sbd='S1'").run()
    for (const n of [-10, -9, -8, 0]) await capNhatExp(d.env, 'S1', NOW + n * D)
    const m = dongManh(d).filter((x) => x.loai === 'dang')
    expect(m.length).toBe(1)
    expect(m[0].so).toBe(2)
  })
})

describe('thưởng theo việc: lô, nộp bài, mom, ca thi', () => {
  it('lô BTVN: đúng nhịp +10, trễ nhịp +4 (theo hạn mềm của kế hoạch đã lưu); lô toàn bỏ trống không có thưởng', async () => {
    const d = await dung()
    luuKeHoach(d, {
      viec: [
        { id: 'btvn_lo:B1:0', hanMem: iso(NOW + 5 * H) },
        { id: 'btvn_lo:B1:1', hanMem: iso(NOW - 5 * H) },
        { id: 'btvn_lo:B1:2', hanMem: iso(NOW + 5 * H) },
      ],
    })
    await ghi(d, [
      sk('q1', 1, NOW - 4000, { nguon: 'btvn_lo', maNguon: 'B1', lan: 0 }),
      sk('q2', 0, NOW - 3000, { nguon: 'btvn_lo', maNguon: 'B1', lan: 1 }),
      sk('q3', null, NOW - 2000, { nguon: 'btvn_lo', maNguon: 'B1', lan: 2 }),
    ])
    await capNhatExp(d.env, 'S1', NOW)
    expect(expCua(d, 'lo|B1|0')).toBe(10)
    expect(expCua(d, 'lo|B1|1')).toBe(4)
    expect(expCua(d, 'lo|B1|2')).toBeUndefined()
  })
  it('nộp cả bài BTVN: đúng hạn +15, quá hạn 0', async () => {
    const d = await dung()
    for (const [ma, han] of [['BT1', iso(NOW + H)], ['BT2', iso(NOW - H)]]) {
      d.sql.prepare("INSERT INTO btvn(ma_btvn,ma_ca,ma_de,so_cau,giao_luc,han_nop,da_xoa,cap_nhat_luc) VALUES(?,'C','D',3,?,?,0,'x')").run(ma, iso(NOW - 2 * D), han)
      d.sql.prepare('INSERT INTO btvn_em(khoa,ma_btvn,sbd,nop_luc) VALUES(?,?,?,?)').run(`${ma}|S1`, ma, 'S1', iso(NOW))
    }
    await capNhatExp(d.env, 'S1', NOW)
    expect(expCua(d, 'btvn|BT1')).toBe(15)
    expect(expCua(d, 'btvn|BT2')).toBeUndefined()
  })
  it('bài Mẹ giao xong +10 chỉ khi có câu đã trả lời; nộp trống không được thưởng', async () => {
    const d = await dung()
    for (const id of ['m1', 'm2']) d.sql.prepare("INSERT INTO mom_bai(sbd,id,title,created_at,question_count,bank_key,submitted_at) VALUES('S1',?,'t','x',2,'k',?)").run(id, iso(NOW))
    await ghi(d, [sk('q1', 1, NOW, { nguon: 'mom', maNguon: 'm1' }), sk('q2', null, NOW, { nguon: 'mom', maNguon: 'm2' })])
    await capNhatExp(d.env, 'S1', NOW)
    expect(expCua(d, 'mom|m1')).toBe(10)
    expect(expCua(d, 'mom|m2')).toBeUndefined()
  })
  it('ca thi: điểm × 3 khi ĐÃ công bố; chưa công bố thì KHÔNG có EXP nào (kể cả từng câu); công bố muộn thì trả đủ đúng một lần', async () => {
    const d = await dung()
    const ca = (ma: string, congBo: string) => d.sql.prepare("INSERT INTO ca(ma_ca,trang_thai,cong_bo,cap_nhat_luc) VALUES(?,'mo',?,'x')").run(ma, congBo)
    const luot = (ma: string, sbd: string, tt: string, nop: string | null, diem = 0) =>
      d.sql.prepare("INSERT INTO luot(khoa,ma_ca,sbd,lan_thu,vao_luc,nop_luc,trang_thai,diem_i,diem_ii,diem_iii,cap_nhat_luc) VALUES(?,?,?,1,'x',?,?,?,?,?,'x')").run(`${ma}|${sbd}|1`, ma, sbd, nop, tt, diem, 0, 0)
    ca('CA1', 'ngay')
    luot('CA1', 'S1', 'da_nop', iso(NOW - 1000), 7)
    ca('CA2', 'ca_lop_xong')
    luot('CA2', 'S1', 'da_nop', iso(NOW - D + 1000), 6)
    luot('CA2', 'S2', 'dang_lam', null)
    await ghi(d, [
      sk('t1', 1, NOW - 1000, { nguon: 'thi', maNguon: 'CA1', lan: 1 }),
      sk('t2', 1, NOW - D + 1000, { nguon: 'thi', maNguon: 'CA2', lan: 1 }),
    ])
    await capNhatExp(d.env, 'S1', NOW)
    expect(expCua(d, 'diem|CA1|1')).toBe(21)
    expect(expCua(d, `cau|t1|${HOM_NAY}`)).toBe(2)
    expect(khoaExp(d).some((k) => k.includes('CA2') || k.includes('|t2|'))).toBe(false)
    // Cả lớp xong CA2 → công bố; lần gọi sau trả điểm và câu của ngày nộp (hôm qua), một lần.
    d.sql.prepare("UPDATE luot SET trang_thai='da_nop', nop_luc=? WHERE ma_ca='CA2' AND sbd='S2'").run(iso(NOW))
    await capNhatExp(d.env, 'S1', NOW)
    expect(expCua(d, 'diem|CA2|1')).toBe(18)
    expect(expCua(d, 'cau|t2|2026-09-19')).toBe(2)
    const gc = (khoa: string) => dongExp(d).find((x) => x.khoa === `S1|${khoa}`)?.ghi_chu
    expect(gc('diem|CA2|1')).toMatch(/^Ca CA2 vừa công bố\. Điểm ca thi 6: \+18$/)
    expect(gc('cau|t2|2026-09-19')).toMatch(/\(ca CA2 vừa công bố\)$/)
    expect(gc('diem|CA1|1')).toBe('Điểm ca thi 7: +21')
    const truoc = d.chup('exp_so')
    await capNhatExp(d.env, 'S1', NOW)
    expect(d.chup('exp_so')).toBe(truoc)
  })
})

describe('ca thi CHƯA công bố: không rò rỉ đúng/sai qua EXP', () => {
  it('sự kiện thi hôm nay của ca chưa công bố không sinh EXP câu, lên bậc, khắc phục hay đạt ngày', async () => {
    const d = await dung()
    d.sql.prepare("INSERT INTO ca(ma_ca,trang_thai,cong_bo,cap_nhat_luc) VALUES('CA3','mo','ca_lop_xong','x')").run()
    for (const [sbd, tt, nop] of [['S1', 'da_nop', iso(NOW - 1000)], ['S2', 'dang_lam', null]] as const) {
      d.sql.prepare("INSERT INTO luot(khoa,ma_ca,sbd,lan_thu,vao_luc,nop_luc,trang_thai,diem_i,diem_ii,diem_iii,cap_nhat_luc) VALUES(?,?,?,1,'x',?,?,3,3,3,'x')").run(`CA3|${sbd}|1`, 'CA3', sbd, nop, tt)
    }
    // Còn câu tới hạn: nếu ca chưa công bố mà lên bậc bị đếm thì "đạt ngày" sẽ lộ câu thi đúng.
    luuKeHoach(d, { toiThieu: 1, soCauToiHan: 2 })
    await ghi(d, [sk('A', 0, NOW - D), sk('A', 1, NOW - 1000, { nguon: 'thi', maNguon: 'CA3', lan: 1 })])
    const r = await capNhatExp(d.env, 'S1', NOW)
    expect(r.khoan).toEqual([])
    expect(dongExp(d)).toEqual([])
    expect(docHoSoGame(d).earned).toBe(0)
  })
})

describe('chuyển tiếp: sự kiện cùng NGÀY phát hành nhưng TRƯỚC mốc chỉ là lịch sử', () => {
  it('khắc phục hoàn tất bởi lần đúng trước mốc → không +30; lên bậc bởi lần đúng trước mốc → không +6; sai trước mốc cùng ngày rồi đúng sau mốc → không lên bậc', async () => {
    const d = taoD1That()
    themHs(d)
    themHoSoGame(d)
    const tu = '2026-09-20T10:00:00+07:00' // = 03:00Z
    d.sql.prepare("INSERT OR REPLACE INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('exp_moi',?,'x')").run(JSON.stringify({ dsSbd: ['S1'], tu }))
    const truoc = Date.parse('2026-09-20T02:00:00Z') // 09:00 VN
    const sau = Date.parse('2026-09-20T04:00:00Z') // 11:00 VN
    await ghi(d, [
      sk('A', 0, NOW - 12 * D), sk('A', 1, NOW - 11 * D), sk('A', 1, NOW - 10 * D), sk('A', 1, truoc), // khắc phục xong LÚC 09:00, trước mốc
      sk('C', 0, truoc + 1000), sk('C', 1, sau - 1000), // sai 09:00 (trước mốc) rồi đúng sau mốc: cùng ngày → không lên bậc
      sk('A', 1, sau + 1000), // lần đúng thứ 4 của A, sau mốc: A đã khắc phục xong từ trước mốc nên không có chuyển trạng thái nào để thưởng
      sk('B', 1, sau),
    ])
    await capNhatExp(d.env, 'S1', NOW)
    expect(khoaExp(d).sort()).toEqual([`cau|A|${HOM_NAY}`, `cau|B|${HOM_NAY}`, `cau|C|${HOM_NAY}`].sort())
  })
})

describe('đạt nhiệm vụ ngày + chuỗi + mảnh khiên', () => {
  const lamBonCau = (d: D1That) => ghi(d, [1, 2, 3, 4].map((i) => sk(qid(i), 1, NOW - i * 1000)))
  it('đạt: đã làm ≥ tối thiểu, không trễ nhịp, không có câu tới hạn → +20 EXP, chuỗi 1 → +2, +1 mảnh', async () => {
    const d = await dung()
    luuKeHoach(d, { toiThieu: 4 })
    await lamBonCau(d)
    await capNhatExp(d.env, 'S1', NOW)
    expect(expCua(d, `dat|${HOM_NAY}`)).toBe(20)
    expect(expCua(d, `chuoi|${HOM_NAY}`)).toBe(2)
    expect(dongManh(d).map((x) => [x.khoa.slice(3), x.so])).toEqual([[`manh|dat|${HOM_NAY}`, 1]])
    expect(docHoSoGame(d).khienRen).toEqual({ manh: 1, daRen: 0 })
  })
  it('chuỗi 6 ngày trước đều đạt → hôm nay là ngày thứ 7: +14 EXP và +3 mảnh (bội của 7)', async () => {
    const d = await dung()
    luuKeHoach(d, { toiThieu: 4 })
    for (let i = 1; i <= 6; i++) luuKeHoach(d, { ngay: ngayVn(NOW - i * D), ketQua: 'dat' })
    await lamBonCau(d)
    await capNhatExp(d.env, 'S1', NOW)
    expect(expCua(d, `chuoi|${HOM_NAY}`)).toBe(14)
    expect(dongManh(d).map((x) => [x.khoa.slice(3), x.so]).sort()).toEqual([[`manh|chuoi7|${HOM_NAY}`, 3], [`manh|dat|${HOM_NAY}`, 1]])
  })
  it('KHÔNG đạt khi còn việc bắt buộc trễ nhịp, hoặc có câu tới hạn mà không lên bậc câu nào, hoặc chưa đủ số câu, hoặc chưa có kế hoạch ngày', async () => {
    const d = await dung()
    await lamBonCau(d) // chưa có kế hoạch ngày lưu
    await capNhatExp(d.env, 'S1', NOW)
    expect(khoaExp(d).some((k) => k.startsWith('dat|'))).toBe(false)
    luuKeHoach(d, { toiThieu: 4, treNhip: true })
    await capNhatExp(d.env, 'S1', NOW)
    expect(khoaExp(d).some((k) => k.startsWith('dat|'))).toBe(false)
    luuKeHoach(d, { toiThieu: 4, soCauToiHan: 2 })
    await capNhatExp(d.env, 'S1', NOW)
    expect(khoaExp(d).some((k) => k.startsWith('dat|'))).toBe(false)
    luuKeHoach(d, { toiThieu: 5 })
    await capNhatExp(d.env, 'S1', NOW)
    expect(khoaExp(d).some((k) => k.startsWith('dat|'))).toBe(false)
    luuKeHoach(d, { toiThieu: 4 })
    await capNhatExp(d.env, 'S1', NOW)
    expect(khoaExp(d)).toContain(`dat|${HOM_NAY}`)
  })
})

describe('mảnh khiên → khiên rèn (nối vào hồ sơ game)', () => {
  it('đủ 12 mảnh tự rèn 1 khiên, trừ 12; khiên còn dùng được tăng 1', () => {
    const p: any = hoSoGame({ cap: 10 })
    const truoc = khienConLai(p)
    const r = congTongSoVaoHoSo(p, 0, 13)
    expect(r).toEqual({ exp: 0, manh: 13, khienMoi: 1 })
    expect(p.khienRen).toEqual({ manh: 1, daRen: 1 })
    expect(khienConLai(p)).toBe(truoc + 1)
    expect(congTongSoVaoHoSo(p, 0, 13)).toEqual({ exp: 0, manh: 0, khienMoi: 0 })
  })
  it('đang giữ 5 khiên rèn CHƯA dùng thì không rèn thêm, mảnh kẹp ở 24', () => {
    const p: any = hoSoGame({ cap: 1, khienRen: { manh: 0, daRen: 5 } })
    expect(khienRenChuaDung(p)).toBe(5)
    congTongSoVaoHoSo(p, 0, 40)
    expect(p.khienRen).toEqual({ manh: 24, daRen: 5 })
    p.shields = { used: 2, activeUntil: 0 }
    expect(khienRenChuaDung(p)).toBeLessThanOrEqual(5)
  })
  it('khiên quà tiến hoá dùng TRƯỚC: khiên rèn chưa dùng = min(đã rèn, còn lại)', () => {
    const p: any = hoSoGame({ cap: 10, khienRen: { manh: 0, daRen: 2 }, shields: { used: 1, activeUntil: 0 } })
    expect(khienConLai(p)).toBe(2)
    expect(khienRenChuaDung(p)).toBe(2)
    p.shields.used = 3
    expect(khienConLai(p)).toBe(0)
    expect(khienRenChuaDung(p)).toBe(0)
  })
  it('lệnh `shield-use` của game v2 dùng được khiên rèn (còn lại = quà + rèn − đã dùng)', async () => {
    const d = await dung()
    d.sql.prepare('UPDATE game_v2_profile SET json=? WHERE sbd=?').run(JSON.stringify(hoSoGame({ cap: 5, khienRen: { manh: 0, daRen: 1 } })), 'S1')
    const r = await gameV2(d.env, 'shield-use', { token: 'token-S1', useId: 'khien-ren-0000001' })
    expect((r.profile as any).khienRen).toMatchObject({ daRen: 1, conLai: 0 })
    // Hết 10 giây bật khiên: còn lại = 0 (quà 0 + rèn 1 − đã dùng 1) → từ chối.
    const p = docHoSoGame(d)
    p.shields.activeUntil = 0
    d.sql.prepare('UPDATE game_v2_profile SET json=? WHERE sbd=?').run(JSON.stringify(p), 'S1')
    await expect(gameV2(d.env, 'shield-use', { token: 'token-S1', useId: 'khien-ren-0000002' })).rejects.toThrow('chưa có')
  })
})

describe('chuyển tiếp: không trả đôi trong NGÀY phát hành', () => {
  it('ngày phát hành bỏ qua qid đã có khoá cũ `practice:<qid>` / `exam:<ca>:<qid>`; ngày sau tính bình thường', async () => {
    const d = taoD1That()
    themHs(d)
    themHoSoGame(d, { academic: { seen: ['practice:Q1', 'exam:CA1:Q2'], sources: {}, days: {}, total: 4, lastGain: 0, at: 'x' } })
    d.sql.prepare("INSERT OR REPLACE INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('exp_moi',?,'x')").run(JSON.stringify({ dsSbd: ['S1'], tu: '2026-09-20T00:00:00+07:00' }))
    await ghi(d, [sk('Q1', 1, NOW), sk('Q2', 1, NOW - 1000), sk('Q3', 1, NOW - 2000)])
    await capNhatExp(d.env, 'S1', NOW)
    expect(khoaExp(d)).toEqual([`cau|Q3|${HOM_NAY}`])
    await ghi(d, [sk('Q1', 1, NOW + D)])
    await capNhatExp(d.env, 'S1', NOW + D)
    expect(khoaExp(d)).toContain('cau|Q1|2026-09-21')
  })
  it('KHÔNG tính lại quá khứ: sự kiện trước mốc `tu` không sinh khoản nào', async () => {
    const d = await dung()
    d.sql.prepare("UPDATE cau_hinh SET gia_tri=? WHERE khoa='exp_moi'").run(JSON.stringify({ dsSbd: ['S1'], tu: iso(NOW - H) }))
    await ghi(d, [sk(qid(1), 1, NOW - 3 * H), sk(qid(2), 1, NOW - 2 * H), sk(qid(3), 1, NOW - 10 * D), sk(qid(4), 1, NOW)])
    await capNhatExp(d.env, 'S1', NOW)
    expect(khoaExp(d)).toEqual([`cau|${qid(4)}|${HOM_NAY}`])
  })
})

describe('đường nộp và màn hình', () => {
  const cauOn = (d: D1That, q: string, phan: 'I' | 'II' | 'III', correct: string) => {
    d.sql.prepare("INSERT OR IGNORE INTO de_kho(ma_de,ten_de,lop,so_cau,r2_khoa,da_xoa,cap_nhat_luc) VALUES('DE1','DE1','12',1,'kho/DE1.json',0,'v1')").run()
    d.sql.prepare("INSERT OR IGNORE INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('DE1','v1','x')").run()
    const c = {
      qid: q, maDe: 'DE1', version: 'v', group: `g-${q}`, phan, text: 'Đề', choices: phan === 'I' ? ['A', 'B', 'C', 'D'] : [], ideas: phan === 'II' ? ['a', 'b', 'c', 'd'] : [],
      hinhAnh: [], dang: 'ES.A.X', tenDang: 'Dạng', mucDo: 'hieu', sao: 2, kienThuc: ['k1'], correct, solution: 'giải', reviewed: true,
    }
    d.sql.prepare('INSERT OR REPLACE INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)').run('DE1', q, 'v', c.group, c.dang, JSON.stringify(c))
  }
  it('/hs/on-lai/nop: cờ TẮT → 2 EXP/câu như cũ (không có expNhan); cờ BẬT → EXP mới theo bảng + expNhan', async () => {
    const tat = taoD1That()
    themHs(tat)
    themHoSoGame(tat)
    cauOn(tat, 'DE1-I-1', 'I', 'B')
    await ghiSuKien(tat.env, [{ nguon: 'btvn', maNguon: 'B', sbd: 'S1', qid: 'DE1-I-1', lan: 1, ketQua: 0, luc: iso(Date.now() - 3 * D) }])
    const r1 = await goiWorker(worker, tat.env, '/hs/on-lai/nop', { token: 'token-S1', traLoi: [{ qid: 'DE1-I-1', dapAn: 'B' }] })
    expect(r1.ok).toBe(true)
    expect(r1.exp).toBe(2)
    expect('expNhan' in r1).toBe(false)

    const moi = taoD1That()
    themHs(moi)
    themHoSoGame(moi)
    bat(moi)
    cauOn(moi, 'DE1-I-1', 'I', 'B')
    await ghiSuKien(moi.env, [{ nguon: 'btvn', maNguon: 'B', sbd: 'S1', qid: 'DE1-I-1', lan: 1, ketQua: 0, luc: iso(Date.now() - 3 * D) }])
    const r2 = await goiWorker(worker, moi.env, '/hs/on-lai/nop', { token: 'token-S1', traLoi: [{ qid: 'DE1-I-1', dapAn: 'B' }] })
    expect(r2.ok).toBe(true)
    // Câu I, 2 sao = 5; lên bậc +6.
    expect(r2.exp).toBe(11)
    expect(r2.expNhan.map((x: any) => x.loai).sort()).toEqual(['cau', 'len_bac'])
    expect(r2.expNhan.every((x: any) => typeof x.ghiChu === 'string' && /\d/.test(x.ghiChu))).toBe(true)
    expect(docHoSoGame(moi).earned).toBe(11)
    // Nộp lại cùng câu: không thêm EXP.
    const r3 = await goiWorker(worker, moi.env, '/hs/on-lai/nop', { token: 'token-S1', traLoi: [{ qid: 'DE1-I-1', dapAn: 'B' }] })
    expect(r3.exp).toBe(0)
    expect(docHoSoGame(moi).earned).toBe(11)
  })
  it('/hs/ke-hoach-ngay: cờ TẮT → phản hồi KHÔNG có `exp`; BẬT → `exp` (hôm nay, chi tiết, mảnh khiên) và không cộng hai lần khi gọi lại', async () => {
    const tat = taoD1That()
    themHs(tat)
    const a = await goiWorker(worker, tat.env, '/hs/ke-hoach-ngay', { sbd: 'S1' })
    expect(a.ok).toBe(true)
    expect('exp' in a || 'expNhan' in a).toBe(false)

    const d = await dung()
    await ghi(d, [sk(qid(1), 1, Date.now() - 1000), sk(qid(2), 1, Date.now() - 2000)])
    const r = await goiWorker(worker, d.env, '/hs/ke-hoach-ngay', { sbd: 'S1' })
    expect(r.ok).toBe(true)
    expect(r.exp.homNay).toBe(4)
    expect(r.exp.chiTietHomNay).toEqual([{ loai: 'cau', exp: 4, soKhoan: 2, ghiChu: '2 câu đúng: +4' }])
    expect(r.exp.manhKhien).toMatchObject({ manh: 0, moiKhien: 12, khienRen: 0 })
    expect(r.expNhan).toHaveLength(2)
    const r2 = await goiWorker(worker, d.env, '/hs/ke-hoach-ngay', { sbd: 'S1' })
    expect(r2.expNhan).toEqual([])
    expect(r2.exp.homNay).toBe(4)
    expect(docHoSoGame(d).earned).toBe(4)
  })
  it('SBD bịa vẫn bị từ chối, không sinh dòng nào trong sổ EXP', async () => {
    const d = await dung()
    const r = await goiWorker(worker, d.env, '/hs/ke-hoach-ngay', { sbd: 'KHONG-CO' })
    expect(r.ok).toBe(false)
    expect(d.dem('exp_so') + d.dem('manh_khien_so')).toBe(0)
  })
  it('docExpHomNay và hsKeHoachNgayCoExp không ném lỗi khi chưa chạy migration EXP', async () => {
    const d = await dung()
    d.sql.exec('DROP TABLE exp_so; DROP TABLE manh_khien_so')
    await ghi(d, [sk(qid(1), 1, NOW)])
    const r = await capNhatExp(d.env, 'S1', NOW)
    expect(r.bat).toBe(true)
    expect(r.khoan).toEqual([])
    expect((await docExpHomNay(d.env, 'S1', NOW)).homNay).toBe(0)
    expect((await hsKeHoachNgayCoExp(d.env, { sbd: 'S1' })).ok).toBe(true)
  })
})

describe('luật CŨ ngừng sinh khoản mới sau mốc (syncAcademic)', () => {
  it('em đã bật EXP mới: đồng bộ cũ không trả thêm EXP cho khoản sau mốc; em chưa bật vẫn nhận như cũ', async () => {
    const chay = async (batCo: boolean) => {
      const d = taoD1That()
      themHs(d)
      d.sql.prepare("INSERT OR IGNORE INTO de_kho(ma_de,ten_de,lop,so_cau,r2_khoa,da_xoa,cap_nhat_luc) VALUES('DE1','DE1','12',1,'kho/DE1.json',0,'v1')").run()
      d.sql.prepare("INSERT OR IGNORE INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('DE1','v1','x')").run()
      const c = { qid: 'DE1-I-1', maDe: 'DE1', version: 'v', group: 'g1', phan: 'I', text: 'Đề', choices: ['A', 'B', 'C', 'D'], ideas: [], hinhAnh: [], dang: 'ES.A.X', tenDang: 'Dạng', mucDo: 'hieu', sao: 1, kienThuc: ['k1'], correct: 'B', solution: 'g', reviewed: true }
      d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)').run('DE1', c.qid, 'v', c.group, c.dang, JSON.stringify(c))
      await ghiSuKien(d.env, [{ nguon: 'btvn', maNguon: 'B', sbd: 'S1', qid: 'DE1-I-1', lan: 1, ketQua: 0, luc: iso(Date.now() - 3 * D) }])
      await dungLaiHoSo(d.env, ['S1'], iso(Date.now()))
      await gameV2(d.env, 'profile', { token: 'token-S1' })
      const p = docHoSoGame(d)
      p.cutover = iso(Date.now() - 30 * D)
      d.sql.prepare('UPDATE game_v2_profile SET json=? WHERE sbd=?').run(JSON.stringify(p), 'S1')
      if (batCo) d.sql.prepare("INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('exp_moi',?,'x')").run(JSON.stringify({ dsSbd: ['S1'], tu: iso(Date.now() - D) }))
      const r = await gameV2(d.env, 'academic-sync', { token: 'token-S1', mom: [{ id: 'm1', at: iso(Date.now()), answers: { 'DE1-I-1': 'B' } }] })
      return r.gain
    }
    expect(await chay(false)).toBe(2)
    expect(await chay(true)).toBe(0)
  })
})

describe('ngày phát hành: chỉ việc SAU mốc mới làm nên "đạt ngày"', () => {
  it('em đã làm đủ TRƯỚC mốc thì không nhận +20 miễn phí; làm đủ SAU mốc thì nhận', async () => {
    const d = taoD1That()
    themHs(d)
    themHoSoGame(d)
    const tu = iso(NOW - H)
    d.sql.prepare("INSERT OR REPLACE INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('exp_moi',?,'x')").run(JSON.stringify({ dsSbd: ['S1'], tu }))
    luuKeHoach(d, { toiThieu: 4 })
    await ghi(d, [1, 2, 3, 4, 5].map((i) => sk(qid(i), 1, NOW - 3 * H - i * 1000)))
    const a = await capNhatExp(d.env, 'S1', NOW)
    expect(khoaExp(d)).toEqual([])
    expect(a.datNgay).toMatchObject({ dat: false, thieu: ['cau_toi_thieu'], daLam: 0, daTrao: false })
    await ghi(d, [10, 11, 12, 13].map((i) => sk(qid(i), 1, NOW - 30 * 60_000 - i * 1000)))
    const b = await capNhatExp(d.env, 'S1', NOW)
    expect(khoaExp(d)).toContain(`dat|${HOM_NAY}`)
    expect(b.datNgay).toMatchObject({ dat: true, thieu: [], daLam: 4, daTrao: true })
  })
})

describe('trạng thái đạt ngày cho giao diện: còn THIẾU gì', () => {
  const chay = async (kh: Parameters<typeof luuKeHoach>[1], soCau: number, lenBac = false) => {
    const d = await dung()
    luuKeHoach(d, kh)
    const ev = Array.from({ length: soCau }, (_, i) => sk(qid(i), 1, NOW - (soCau - i) * 1000))
    if (lenBac) ev.push(sk('OLD', 0, NOW - D), sk('OLD', 1, NOW - 500))
    await ghi(d, ev)
    return (await capNhatExp(d.env, 'S1', NOW)).datNgay
  }
  it('đủ mọi điều kiện → dat, thieu rỗng, đã trao', async () => {
    expect(await chay({ toiThieu: 4 }, 4)).toEqual({ dat: true, thieu: [], daLam: 4, toiThieu: 4, daTrao: true, laNghi: false })
  })
  it('thiếu từng điều kiện được gọi đúng tên; nhiều thiếu thì liệt kê đủ', async () => {
    expect((await chay({ toiThieu: 6 }, 4))!.thieu).toEqual(['cau_toi_thieu'])
    expect((await chay({ toiThieu: 4, treNhip: true }, 4))!.thieu).toEqual(['tre_nhip'])
    expect((await chay({ toiThieu: 4, soCauToiHan: 3 }, 4))!.thieu).toEqual(['chua_len_bac'])
    expect((await chay({ toiThieu: 4, soCauToiHan: 3 }, 4, true))!.thieu).toEqual([])
    expect((await chay({ toiThieu: 9, treNhip: true, soCauToiHan: 1 }, 2))!.thieu).toEqual(['cau_toi_thieu', 'tre_nhip', 'chua_len_bac'])
  })
  it('chưa có kế hoạch ngày đã lưu → null; ngày nghỉ → không đạt, không thiếu gì', async () => {
    const d = await dung()
    await ghi(d, [sk(qid(1), 1, NOW)])
    expect((await capNhatExp(d.env, 'S1', NOW)).datNgay).toBeNull()
    luuKeHoach(d)
    d.sql.prepare("UPDATE ke_hoach_ngay SET la_ngay_nghi=1 WHERE sbd='S1'").run()
    expect((await capNhatExp(d.env, 'S1', NOW)).datNgay).toMatchObject({ dat: false, thieu: [], laNghi: true })
  })
  it('/hs/ke-hoach-ngay trả exp.datNgay khi cờ bật', async () => {
    const d = await dung()
    const r = await goiWorker(worker, d.env, '/hs/ke-hoach-ngay', { sbd: 'S1' })
    expect(r.exp.datNgay).toMatchObject({ dat: false, thieu: expect.arrayContaining(['cau_toi_thieu']), daTrao: false })
  })
})

describe('tiếp sức đồng đội cho game (ghiTiepSuc)', () => {
  it('+3 EXP mỗi lần, tối đa 5 lần một ngày VN, sang ngày mới đếm lại; khoá `<sbd>|tiepsuc|<ngày>|<n>`', async () => {
    const d = await dung()
    const kq = []
    for (let i = 0; i < 7; i++) kq.push(await ghiTiepSuc(d.env, 'S1', NOW + i))
    expect(kq.map((x) => [x.exp, x.lanThu, x.conLai])).toEqual([[3, 1, 4], [3, 2, 3], [3, 3, 2], [3, 4, 1], [3, 5, 0], [0, 0, 0], [0, 0, 0]])
    expect(khoaExp(d)).toEqual([1, 2, 3, 4, 5].map((n) => `tiepsuc|${HOM_NAY}|${n}`))
    expect(docHoSoGame(d).earned).toBe(15)
    expect((await ghiTiepSuc(d.env, 'S1', NOW + D)).exp).toBe(3)
  })
  it('gọi lại cùng `idLuot` không cộng đôi', async () => {
    const d = await dung()
    expect((await ghiTiepSuc(d.env, 'S1', NOW, 'luot-1')).exp).toBe(3)
    const l = await ghiTiepSuc(d.env, 'S1', NOW + 1, 'luot-1')
    expect(l).toMatchObject({ exp: 0, daGhiTruoc: true, conLai: 4 })
    expect((await ghiTiepSuc(d.env, 'S1', NOW + 2, 'luot-2')).lanThu).toBe(2)
    expect(tongExp(d)).toBe(6)
  })
  it('năm lượt CHỒNG NHAU vẫn đúng 5 khoản, mỗi ô một lần', async () => {
    const d = await dung()
    const r = await Promise.all(Array.from({ length: 8 }, (_, i) => ghiTiepSuc(d.env, 'S1', NOW + i, `l${i}`)))
    expect(r.filter((x) => x.exp === 3)).toHaveLength(5)
    expect(new Set(khoaExp(d)).size).toBe(5)
    expect(docHoSoGame(d).earned).toBe(15)
  })
  it('cờ tắt → không ghi gì; không ném lỗi khi thiếu bảng', async () => {
    const t = taoD1That()
    themHs(t)
    themHoSoGame(t)
    expect(await ghiTiepSuc(t.env, 'S1', NOW)).toEqual({ bat: false, exp: 0, lanThu: 0, conLai: 0, daGhiTruoc: false })
    expect(t.dem('exp_so')).toBe(0)
    const d = await dung()
    d.sql.exec('DROP TABLE exp_so')
    expect((await ghiTiepSuc(d.env, 'S1', NOW)).exp).toBe(0)
  })
})

describe('hàm đọc-chỉ cho game phát vé (docThanhTichNgay)', () => {
  it('trả đúng khoá `dat|<ngày>` và các lô ĐÚNG NHỊP của ngày; lô trễ nhịp không tính; không ghi gì', async () => {
    const d = await dung()
    luuKeHoach(d, { toiThieu: 4, viec: [{ id: 'btvn_lo:B1:0', hanMem: iso(NOW + 5 * H) }, { id: 'btvn_lo:B1:1', hanMem: iso(NOW - 5 * H) }] })
    await ghi(d, [
      sk('q1', 1, NOW - 4000, { nguon: 'btvn_lo', maNguon: 'B1', lan: 0 }), sk('q2', 1, NOW - 3000, { nguon: 'btvn_lo', maNguon: 'B1', lan: 1 }),
      sk('q3', 1, NOW - 2000), sk('q4', 1, NOW - 1000),
    ])
    await capNhatExp(d.env, 'S1', NOW)
    const truoc = d.chup('exp_so')
    const r = await docThanhTichNgay(d.env, 'S1', NOW)
    expect(r).toEqual({ bat: true, ngay: HOM_NAY, datNgay: true, loDungNhip: [{ maBtvn: 'B1', chiSo: 0, khoa: 'lo|B1|0' }] })
    expect(d.chup('exp_so')).toBe(truoc)
    expect(await docThanhTichNgay(d.env, 'S1', NOW, '2026-09-19')).toMatchObject({ datNgay: false, loDungNhip: [] })
  })
  it('cờ tắt hoặc chưa có sổ → bat:false / rỗng, không ném lỗi', async () => {
    const t = taoD1That()
    expect(await docThanhTichNgay(t.env, 'S1', NOW)).toEqual({ bat: false, ngay: HOM_NAY, datNgay: false, loDungNhip: [] })
    const d = await dung()
    d.sql.exec('DROP TABLE exp_so')
    expect((await docThanhTichNgay(d.env, 'S1', NOW)).datNgay).toBe(false)
  })
})

describe('cron 00:01: chốt EXP của ngày vừa qua (chotExpNgayQua)', () => {
  const homQua = '2026-09-19'
  const NOW_CRON = Date.parse('2026-09-19T17:01:00.000Z') // 00:01 VN ngày 20/09
  it('em có ngày hôm qua chốt "dat" mà chưa có khoản dat|<ngày> thì được tính bù; em đã có rồi thì bỏ qua; em không nằm trong cờ thì không đụng', async () => {
    const d = await dung()
    themHs(d, 'S2')
    themHs(d, 'S3')
    themHoSoGame(d, {}, 'S2')
    // S1: làm 4 câu hôm qua bằng đường CHƯA gọi capNhatExp, kế hoạch hôm qua đã chốt "dat".
    luuKeHoach(d, { ngay: homQua, toiThieu: 4, ketQua: 'dat' })
    await ghi(d, [1, 2, 3, 4].map((i) => sk(qid(i), 1, Date.parse('2026-09-19T05:00:00Z') + i * 1000)))
    // S2 cũng đạt nhưng không nằm trong danh sách bật cờ.
    luuKeHoach(d, { ngay: homQua, toiThieu: 4, ketQua: 'dat', sbd: 'S2' })
    await ghi(d, [1, 2, 3, 4].map((i) => sk(qid(i), 1, Date.parse('2026-09-19T05:00:00Z') + i * 1000, { sbd: 'S2' })))
    const r = await chotExpNgayQua(d.env, NOW_CRON)
    expect(r).toEqual({ soEm: 1, daTinh: 1 })
    expect(khoaExp(d)).toContain(`dat|${homQua}`)
    expect(khoaExp(d, 'S2')).toEqual([])
    // Chạy lại: không còn em nào cần bù, sổ không đổi.
    const truoc = d.chup('exp_so')
    expect(await chotExpNgayQua(d.env, NOW_CRON)).toEqual({ soEm: 0, daTinh: 0 })
    expect(d.chup('exp_so')).toBe(truoc)
  })
  it('cờ tắt hoặc không có kế hoạch nào chốt → không làm gì', async () => {
    const t = taoD1That()
    expect(await chotExpNgayQua(t.env, NOW_CRON)).toEqual({ soEm: 0, daTinh: 0 })
    const d = await dung()
    expect(await chotExpNgayQua(d.env, NOW_CRON)).toEqual({ soEm: 0, daTinh: 0 })
  })
  it('toanBo: tối đa 40 em mỗi lượt', async () => {
    const d = taoD1That()
    bat(d, { toanBo: true, dsSbd: [] })
    for (let i = 0; i < 45; i++) {
      themHs(d, `E${i}`)
      luuKeHoach(d, { ngay: homQua, sbd: `E${i}`, ketQua: 'dat' })
    }
    expect((await chotExpNgayQua(d.env, NOW_CRON)).soEm).toBe(40)
  })
})
