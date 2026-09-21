// @vitest-environment node
// BẤT BIẾN KHỐI — MÁY CHỦ (Code 1, 21/09/2026; P0 thầy báo 20:28: học sinh khối 11 nhận câu khối 12 ở Đảo, "quét hết mọi chỗ rút sửa triệt để"; luật Boss: chỉ khối EM ĐANG HỌC hoặc THẤP hơn).
// Hàm dùng chung: src/lib/khoi-cau.ts (`cauHopKhoi`). Kho ở đây có CÙNG mã dạng "A.1" ở ba tờ khối 10 / 11 / 12 (đúng cái bẫy ngoài đời: tên dạng dùng chung nhiều khối) và tờ khối 12 LỚN NHẤT
// để nếu bộ lọc hở thì lượt rút gần như chắc chắn dính câu khối 12. SQLite thật (tests/_d1-that.ts), token thật.
// Mỗi kênh máy chủ một `it`; kênh nào CHƯA vá thì test ĐỎ (Code 3 vá rồi chạy lại). Bảng kiểm kê + tệp:dòng: xem tin gửi Code 3 / DIEU-PHOI.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { gameV2 } from '../server/src/game-v2'
import { gameToken } from '../server/src/game-v2-auth'
import { dungLaiHoSo } from '../server/src/ho-so-nam-kt'
import { ghiSuKien } from '../server/src/su-kien-hoc'
import { lapVaLuuKeHoach } from '../server/src/ke-hoach-ngay-d1'
import { cauKhacPhucGoi } from '../server/src/goi-cu'
import { luyenDe } from '../server/src/luyen-de'
import { taoD1That, type D1That } from './_d1-that'
import { khoiCuaCau, type Khoi } from '../src/lib/khoi-cau'

afterEach(() => vi.useRealTimers())
const gio = (s: string) => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date(`${s}+07:00`)) }
const NGAY = '2026-09-22'
const TO: Record<Khoi, string> = { 10: 'DH-10-C1-B1-TN', 11: 'DH-11-C1-B1-TN', 12: 'DH-12-C1-B1-TN' }
const SO_CAU: Record<Khoi, number> = { 10: 8, 11: 8, 12: 60 } // Phần I; khối 12 lớn nhất: bộ lọc hở ⇒ lượt rút dính khối 12
const SO_II: Record<Khoi, number> = { 10: 4, 11: 4, 12: 30 } // Phần II (câu chung của trùm Đoàn)
/** Mã câu THẬT: `<mã tờ>-<phần>-<số>` (vd `DH-12-C1-B1-TN-I-5`) — đúng cách kho đặt qid; khối đọc được từ chính mã. */
const qidI = (k: Khoi, i: number) => `${TO[k]}-I-${i}`
const qidII = (k: Khoi, i: number) => `${TO[k]}-II-${i}`
const cauJson = (qid: string, maDe: string, dang: string, phan: 'I' | 'II' = 'I') => ({ qid, maDe, version: 'v1', group: `g-${qid}`, phan, text: `Đề ${qid}`, choices: phan === 'I' ? ['A', 'B', 'C', 'D'] : [], ideas: phan === 'II' ? ['ý a', 'ý b', 'ý c', 'ý d'] : [], hinhAnh: [], dang, tenDang: `Dạng ${dang}`, mucDo: 'biet', sao: 1, kienThuc: ['K1'], correct: phan === 'II' ? 'DSDS' : 'B', solution: `LG-${qid}`, reviewed: true })

/** Kho: ba tờ (khối 10/11/12) CÙNG dạng A.1. Em S1 + bạn cùng lớp S2 (S2 được giao bài cá nhân hoá dạng A.1 của tờ khối `khoiEm` ⇒ lớp đã học A.1). `khoiEm` ⇒ `hoc_sinh.lop`. */
function dung(khoiEm: Khoi, o: { tenLop?: string; soII?: Record<Khoi, number> } = {}): D1That {
  const d = taoD1That()
  const them = d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)')
  for (const k of [10, 11, 12] as Khoi[]) {
    d.sql.prepare('INSERT INTO de_kho(ma_de,ten_de,lop,so_cau,r2_khoa,da_xoa,cap_nhat_luc) VALUES(?,?,?,?,?,0,?)').run(TO[k], TO[k], String(k), SO_CAU[k], `kho/${TO[k]}.json`, 'v1')
    d.sql.prepare("INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES(?,'v1','x')").run(TO[k])
    for (let i = 0; i < SO_CAU[k]; i++) them.run(TO[k], qidI(k, i), 'v1', `g-${qidI(k, i)}`, 'A.1', JSON.stringify(cauJson(qidI(k, i), TO[k], 'A.1')))
    for (let i = 0; i < (o.soII ?? SO_II)[k]; i++) them.run(TO[k], qidII(k, i), 'v1', `g-${qidII(k, i)}`, 'A.1', JSON.stringify(cauJson(qidII(k, i), TO[k], 'A.1', 'II')))
  }
  d.sql.prepare("INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('doan_ho_tong',?,'x')").run(JSON.stringify({ toanBo: true }))
  for (const [sbd, ten] of [['S1', 'Em Một'], ['S2', 'Em Hai']] as const) {
    d.sql.prepare('INSERT INTO hoc_sinh(sbd,ho_ten,mat_khau,lop,cap_nhat_luc) VALUES(?,?,?,?,?)').run(sbd, ten, 'mk', String(khoiEm), 'x')
    if (o.tenLop) d.sql.prepare('UPDATE hoc_sinh SET ten_lop = ? WHERE sbd = ?').run(o.tenLop, sbd)
  }
  d.sql.prepare('INSERT INTO game_v2_profile(sbd,revision,json,created_at) VALUES(?,0,?,?)').run('S1', JSON.stringify({ pet: 'dat_quy', choice: false, legacy: null, cap: 1, exp: 0, wallet: 0, earned: 0, tower: 1, mastery: [], arena: null, cutover: '2026-09-21T05:00:00.000Z', luatCap: 2 }), 'x')
  d.sql.prepare("INSERT INTO btvn(ma_btvn,ma_ca,ma_de,so_cau,giao_luc,han_nop,da_xoa,cap_nhat_luc,ca_nhan) VALUES('BT1','CA1',?,8,'2026-09-20T00:00:00.000Z','2099-01-01T00:00:00.000Z',0,'x',1)").run(TO[khoiEm])
  d.sql.prepare("INSERT INTO btvn_em(khoa,ma_btvn,sbd,ho_ten) VALUES('BT1|S2','BT1','S2','Em Hai')").run()
  d.sql.prepare("INSERT INTO btvn_cau(ma_btvn,qid,thu_tu,dang,muc_do,sao,phan,loi,ghim) VALUES('BT1',?,1,'A.1',0,0,'I',0,0)").run(qidI(khoiEm, 0))
  return d
}
const token = (d: D1That, sbd = 'S1') => gameToken(d.env, sbd)
const goi = async (d: D1That, lenh: string, b: Record<string, unknown> = {}) => gameV2(d.env, lenh, { token: await token(d), ...b }) as Promise<any>
/** Khối của câu theo MÃ TỜ của nó (qid dạng `DH-<khối>-…`) — đọc từ chính kho giả, không từ hàm cần thử. */
const khoiQid = (qid: string): Khoi => Number(/^DH-(\d+)-/.exec(qid)![1]) as Khoi
const khoiToi = (ds: string[]) => Math.max(...ds.map(khoiQid))

describe('ĐẢO — start (đường mới `startLuotMoi`): em khối 11 / 10 KHÔNG nhận câu tờ khối cao hơn dù CÙNG mã dạng', () => {
  for (const khoiEm of [11, 10] as Khoi[]) {
    it(`em khối ${khoiEm}: 6 câu của lượt đều thuộc tờ khối ≤ ${khoiEm}`, async () => {
      gio(`${NGAY}T10:00:00`)
      const d = dung(khoiEm)
      const r = await goi(d, 'start', { mode: 'adventure' })
      expect(r.ok).toBe(true)
      const qs = (r.questions as { qid: string }[]).map((x) => x.qid)
      expect(qs.length).toBeGreaterThan(0)
      expect(qs.filter((q) => khoiQid(q) > khoiEm), `câu khối cao: ${qs.join(',')}`).toEqual([])
    })
  }
  it('ĐỐI CHỨNG: em khối 12 vẫn nhận được câu của tờ khối 12 (bộ lọc không chặn nhầm khối em)', async () => {
    gio(`${NGAY}T10:00:00`)
    const d = dung(12)
    const r = await goi(d, 'start', { mode: 'adventure' })
    expect(r.ok).toBe(true)
    expect((r.questions as { qid: string }[]).length).toBe(6)
  })
  it('recommendations (gợi ý cho em): `source` (mã tờ) không thuộc khối cao hơn', async () => {
    gio(`${NGAY}T10:00:00`)
    const d = dung(11)
    const r = await goi(d, 'recommendations', {})
    expect(r.ok).toBe(true)
    const nguon = (r.suggestions as { source: string }[]).map((x) => x.source)
    expect(nguon.length).toBeGreaterThan(0)
    expect(nguon.filter((m) => (khoiCuaCau(m) ?? 0) > 11), `tờ khối cao: ${nguon.join(',')}`).toEqual([])
  })
  it('LƯỢT CHỜ đã rút TRƯỚC khi có luật (chưa trả lời câu nào, còn trong 2 giờ) mà có câu khối cao ⇒ KHÔNG trả lại — bỏ lượt, mở lượt mới đúng khối', async () => {
    gio(`${NGAY}T10:00:00`)
    const d = dung(11)
    const cu = { mode: 'adventure', created: Date.now(), questions: [0, 1, 2, 3, 4, 5].map((i) => ({ qid: qidI(12, i), maDe: TO[12], version: 'v1', group: `g-${qidI(12, i)}`, novel: true, role: 'moi' })) }
    d.sql.prepare('INSERT INTO game_v2_session(id,sbd,json,created_at) VALUES(?,?,?,?)').run('LUOT-CU', 'S1', JSON.stringify(cu), new Date().toISOString())
    const r = await goi(d, 'start', { mode: 'adventure' })
    expect(r.ok).toBe(true)
    const qs = (r.questions as { qid: string }[]).map((x) => x.qid)
    expect(khoiToi(qs), `trả lại lượt cũ: ${qs.join(',')}`).toBeLessThanOrEqual(11)
  })
})

describe('ĐẢO — start đường CŨ (cờ lùi game_luot_moi = tat), Linh Tâm, võ đài, sổ tay dùng CÙNG kho', () => {
  it('cờ lùi: em khối 11 có bằng chứng dạng A.1 ở tờ khối 11 — đường cũ vẫn KHÔNG rút câu tờ khối 12 cùng dạng', async () => {
    gio(`${NGAY}T10:00:00`)
    const d = dung(11)
    d.sql.prepare("INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('game_luot_moi','tat','x')").run()
    // bằng chứng từ HỒ SƠ (BTVN): em đã làm SAI 4 câu dạng A.1 ở tờ khối 11 — đường cũ có kho cho em (kho cũ bó theo dạng của bằng chứng, không theo khối)
    const luc = new Date(Date.now() - 3 * 86_400_000).toISOString()
    const ghi = await ghiSuKien(d.env, [1, 2, 3, 4].map((i) => ({ nguon: 'btvn' as const, maNguon: `M${i}`, sbd: 'S1', qid: qidI(11, i), lan: 1, ketQua: 0 as const, luc, maDang: 'A.1' })))
    expect(ghi.ok).toBe(true)
    await dungLaiHoSo(d.env, ['S1'], new Date().toISOString())
    const r = await goi(d, 'start', { mode: 'adventure' })
    const qs = ((r?.questions ?? []) as { qid: string }[]).map((x) => x.qid)
    expect(qs.length, 'đường cũ phải có câu để kiểm').toBeGreaterThan(0)
    expect(khoiToi(qs), `đường cũ trả: ${qs.join(',')}`).toBeLessThanOrEqual(11)
  })
})

describe('ĐOÀN HỘ TỐNG — câu cá nhân (`startDoanKhoLop`) cùng luật khối', () => {
  for (const khoiEm of [11, 10] as Khoi[]) {
    it(`em khối ${khoiEm} mở đoàn: 6 câu cá nhân đều thuộc tờ khối ≤ ${khoiEm}`, async () => {
      gio(`${NGAY}T10:00:00`)
      const d = dung(khoiEm)
      const mo = await goi(d, 'doan-mo')
      expect(mo.ok).toBe(true)
      const chang = d.sql.prepare('SELECT json FROM doan_chang WHERE ma = ?').get(mo.doan.ma) as { json: string }
      const nguoi = (JSON.parse(chang.json).nguoi as { sbd: string; cau: { qid: string }[] }[]).find((x) => x.sbd === 'S1')!
      const qs = nguoi.cau.map((c) => c.qid)
      expect(qs.length).toBeGreaterThan(0)
      expect(qs.filter((q) => khoiQid(q) > khoiEm), `câu khối cao: ${qs.join(',')}`).toEqual([])
    })
  }
})

describe('ĐOÀN HỘ TỐNG — câu CHUNG của trùm (Phần II, hiệp 4 và 8) cùng luật khối', () => {
  it('kho Phần II CHỈ có tờ khối 12 (tờ khối 10/11 không có): em khối 11 mở đoàn ⇒ trùm KHÔNG được lấy câu khối 12 (thà không có câu chung còn hơn câu khối cao)', async () => {
    gio(`${NGAY}T10:00:00`)
    const d = dung(11, { soII: { 10: 0, 11: 0, 12: 30 } })
    const mo = await goi(d, 'doan-mo')
    expect(mo.ok).toBe(true)
    const chang = JSON.parse((d.sql.prepare('SELECT json FROM doan_chang WHERE ma = ?').get(mo.doan.ma) as { json: string }).json)
    const qs = Object.values((chang.trum ?? {}) as Record<string, { qid: string } | null>).filter(Boolean).map((x) => x!.qid)
    expect(qs.filter((q) => khoiQid(q) > 11), `câu trùm khối cao: ${qs.join(',')}`).toEqual([])
  })
  it('đối chứng: em khối 12 cùng kho ⇒ có câu trùm (bộ lọc không chặn nhầm)', async () => {
    gio(`${NGAY}T10:00:00`)
    const d = dung(12, { soII: { 10: 0, 11: 0, 12: 30 } })
    const mo = await goi(d, 'doan-mo')
    const chang = JSON.parse((d.sql.prepare('SELECT json FROM doan_chang WHERE ma = ?').get(mo.doan.ma) as { json: string }).json)
    expect(Object.values((chang.trum ?? {}) as Record<string, unknown>).filter(Boolean).length).toBeGreaterThan(0)
  })
})

describe('KẾ HOẠCH NGÀY — hàng ôn lại (`on_lai`) chỉ nhận câu hợp khối, kể cả câu khối cao ĐÃ lọt vào sổ của em từ trước', () => {
  it('em khối 11 có hồ sơ: 3 câu sai (tờ khối 11) + 6 câu sai (tờ khối 12) tới hạn ôn ⇒ `on_lai` KHÔNG chứa câu khối 12', async () => {
    gio(`${NGAY}T10:00:00`)
    const d = dung(11)
    const luc = new Date(Date.now() - 4 * 86_400_000).toISOString()
    const sai = [...[1, 2, 3].map((i) => qidI(11, i)), ...[1, 2, 3, 4, 5, 6].map((i) => qidI(12, i))]
    const ghi = await ghiSuKien(d.env, sai.map((qid, i) => ({ nguon: 'btvn' as const, maNguon: `M${i}`, sbd: 'S1', qid, lan: 1, ketQua: 0 as const, luc, maDang: 'A.1' })))
    expect(ghi.ok).toBe(true)
    const kh = (await lapVaLuuKeHoach(d.env, ['S1'], Date.now(), { luu: false })).get('S1')!
    const viec = kh.viec.find((v) => v.loai === 'on_lai')
    expect(viec, 'phải có việc ôn lại (còn câu khối 11 tới hạn)').toBeTruthy()
    const qs = viec!.chiTiet.qid as string[]
    expect(qs.length).toBeGreaterThan(0)
    expect(qs.filter((q) => khoiQid(q) > 11), `ôn lại câu khối cao: ${qs.join(',')}`).toEqual([])
  })
})

describe('KHẮC PHỤC SAU CA (`cauKhacPhucGoi`, máy em gửi chuyên đề/dạng) — không rút tờ khối cao hơn', () => {
  it('cùng chuyên đề CD1 ở ba tờ (khối 10/11/12, tờ khối 12 nhiều câu nhất): em khối 11 nhận `thuTu` không có câu khối 12', async () => {
    gio(`${NGAY}T10:00:00`)
    const d = dung(11)
    for (const k of [10, 11, 12] as Khoi[]) {
      d.objects.set(`kho/${TO[k]}.json`, { ma_de: TO[k], cau: [] })
      for (let i = 0; i < SO_CAU[k]; i++) d.sql.prepare("INSERT INTO cau_hoi(qid,ma_de,chuyen_de,muc_do,phan,lop,co_loi_giai,cap_nhat_luc) VALUES(?,?,'CD1','biet','I',?,1,'x')").run(qidI(k, i), TO[k], String(k))
    }
    const r = await cauKhacPhucGoi(d.env, { sbd: 'S1', chuyenDe: ['CD1'], soCau: 20 })
    const ds = (r.thuTu as string[]) ?? []
    expect(ds.length, 'phải có câu để kiểm').toBeGreaterThan(0)
    expect(ds.filter((q) => khoiQid(q) > 11), `khắc phục rút khối cao: ${ds.join(',')}`).toEqual([])
  })
})

describe('LUYỆN ĐỀ 2026 (Bộ đề khối 12, cổng `daHocXong` do MÁY EM tự gửi) — em khối 11 / 10 KHÔNG được mở', () => {
  for (const khoiEm of [11, 10] as Khoi[]) {
    it(`em khối ${khoiEm} gửi daHocXong=true vẫn bị từ chối (máy chủ tự kiểm khối em, không tin cờ của máy)`, async () => {
      gio(`${NGAY}T10:00:00`)
      const d = dung(khoiEm)
      await expect(luyenDe(d.env, 'start', { token: await token(d), daHocXong: true })).rejects.toThrow(/khối 12|chỉ dành cho/)
    })
  }
})
