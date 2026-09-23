import { daHocDang } from './_pham-vi-ca-nhan'
// @vitest-environment node
// BẤT BIẾN KHỐI — BA KÊNH MÁY CHỦ PHỤ (Code 1, 21/09/2026; P0 thầy 20:28: khối 11 nhận câu khối 12; luật Boss: chỉ khối EM hoặc THẤP hơn). Bổ sung cho tests/khoi-cau-may-chu-2109.test.ts:
//   • THỬ THÁCH RIÊNG hôm nay (`server/src/thu-thach-rieng.ts:257`, `q.dang = ?` LIMIT 600 — không khối);
//   • BÀI HẰNG NGÀY của phụ huynh (`parent-news-nguon-cau.ts:143-150`, câu tới hạn nạp theo qid, không lọc khối; `d.lop = ` chỉ cho nhóm dạng/bù);
//   • PHỤ HUYNH GIAO THÊM (`ph-giao-them.ts:121-124`, câu đến lịch/sai chưa khắc phục nạp theo qid, không lọc khối).
// Kho: CÙNG dạng ở ba tờ DH-10/11/12 (tờ 12 lớn nhất); mã câu THẬT `<mã tờ>-I-<số>`. Kênh nào CHƯA vá ⇒ test ĐỎ. SQLite thật (tests/_d1-that.ts).
import { afterEach, describe, expect, it, vi } from 'vitest'
import worker from '../server/src/index'
import { parentPass } from '../server/src/game-v2-auth'
import { phGiaoThem } from '../server/src/ph-giao-them'
import { chonCauBaiHangNgay } from '../server/src/parent-news-nguon-cau'
import { lapVaLuuKeHoach } from '../server/src/ke-hoach-ngay-d1'
import { ngayVn } from '../server/src/su-kien-hoc'
import { goiWorker, taoD1That, type D1That } from './_d1-that'
import type { Khoi } from '../src/lib/khoi-cau'

vi.mock('../server/src/game-v2-auth', async (orig) => ({
  ...(await orig<typeof import('../server/src/game-v2-auth')>()),
  gameIdentity: async (_e: unknown, b: Record<string, unknown>) => {
    if (b.token === 'token-S1') return 'S1'
    throw new Error('Phiên đăng nhập không hợp lệ.')
  },
}))
afterEach(() => vi.useRealTimers())

const T = (s: string): number => Date.parse(`${s}+07:00`)
const NGAY = '2026-09-22'
const H = (gio: string): number => T(`${NGAY}T${gio}:00`)
const themNgay = (ngay: string, n: number): string => new Date(Date.parse(`${ngay}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10)
const TO: Record<Khoi, string> = { 10: 'DH-10-C1-B1-TN', 11: 'DH-11-C1-B1-TN', 12: 'DH-12-C1-B1-TN' }
const SO: Record<Khoi, number> = { 10: 10, 11: 10, 12: 60 } // tờ khối 12 lớn nhất: bộ lọc hở ⇒ dính khối 12
const qidI = (k: Khoi, i: number) => `${TO[k]}-I-${i}`
const khoiQid = (qid: string): number => Number(/^DH-(\d+)-/.exec(qid)![1])
const cauKho = (k: Khoi, i: number, dang: string, muc = 'hieu') => ({
  qid: qidI(k, i), maDe: TO[k], version: 'v', group: `g-${qidI(k, i)}`, phan: 'I', text: `Chọn phát biểu đúng về ${qidI(k, i)}.`, choices: ['A. a', 'B. b', 'C. c', 'D. d'], ideas: [], hinhAnh: [],
  dang, tenDang: `Tên ${dang}`, mucDo: muc, sao: 1, kienThuc: ['k'], correct: 'B', solution: 'LG-BI-MAT', reviewed: true,
})
/** Ba tờ khối 10/11/12, mỗi tờ `SO[k]` câu dạng `dang`; `de_kho.lop` = khối của tờ. */
function themKho(d: D1That, dang: string, muc = 'hieu') {
  for (const k of [10, 11, 12] as Khoi[]) {
    d.sql.prepare("INSERT OR IGNORE INTO de_kho(ma_de,ten_de,lop,so_cau,r2_khoa,da_xoa,cap_nhat_luc) VALUES(?,?,?,?,?,0,'v1')").run(TO[k], TO[k], String(k), SO[k], `kho/${TO[k]}.json`)
    d.sql.prepare("INSERT OR IGNORE INTO game_v2_index(ma_de,source_version,indexed_at) VALUES(?,'v1','x')").run(TO[k])
    for (let i = 0; i < SO[k]; i++) d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)').run(TO[k], qidI(k, i), 'v', `g-${qidI(k, i)}`, dang, JSON.stringify(cauKho(k, i, dang, muc)))
  }
}
const dangHs = (d: D1That, ma: string, o: { gap?: number; sai?: number; khac?: number; moi?: number; chua?: number; bac?: number } = {}) => {
  d.sql.prepare('INSERT OR REPLACE INTO nam_kt_dang(khoa,sbd,ma_dang,so_gap,so_sai,so_da_khac_phuc,so_moi_sai,so_chua_thay_sai,bac,cap_nhat_luc) VALUES(?,?,?,?,?,?,?,?,?,?)')
    .run(`S1|${ma}`, 'S1', ma, o.gap ?? 10, o.sai ?? 6, o.khac ?? 1, o.moi ?? 3, o.chua ?? 1, o.bac ?? 1, 'x')
  daHocDang(d, 'S1', ma)
}
const cauHs = (d: D1That, qid: string, dang: string, trangThai: string, moc: string | null, lanSai = 1) =>
  d.sql.prepare(`INSERT INTO nam_kt_cau (khoa, sbd, qid, ma_dang, chuyen_de, lan_gap, lan_sai, lan_trong, dung_lien_tiep, ngay_dung_khac_nhau, ket_qua_cuoi, nguon_cuoi, luc_cuoi, moc_on_ke, trang_thai, can_day_lai, giay_tb, cap_nhat_luc)
     VALUES (?, 'S1', ?, ?, 'CĐ', 2, ?, 0, 0, 0, 0, 'btvn', '2026-09-10T02:00:00.000Z', ?, ?, 0, NULL, 'x')`).run(`S1|${qid}`, qid, dang, lanSai, moc, trangThai)
const emKhoi = (d: D1That, khoi: Khoi) => d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES('S1','Em Một',?,'mk','x')").run(String(khoi))

describe('THỬ THÁCH RIÊNG hôm nay — câu chọn từ kho theo dạng, không khối', () => {
  const goi = (d: D1That, duong: string, b: Record<string, unknown> = {}) => goiWorker(worker, d.env, duong, { token: 'token-S1', ...b })
  it('em khối 11, thử thách dạng D1 (bộ não áp): câu của thử thách KHÔNG thuộc tờ khối 12', async () => {
    const d = taoD1That()
    emKhoi(d, 11)
    themKho(d, 'D1', 'hieu')
    dangHs(d, 'D1', { gap: 8, bac: 1 })
    d.sql.prepare("INSERT OR REPLACE INTO ai_dieu_chinh(sbd,ngay,json,ap_dung,het_han,huy,nop_luc,che_do) VALUES('S1',?,?,1,'2999-01-01',0,'x','that')")
      .run(ngayVn(Date.now()), JSON.stringify({ thuThach: { dang: ['D1'], soCau: 6, bac: 'dung_bac' }, loiMoi: 'Hôm nay thử 6 câu dạng D1, xong là đủ.' }))
    d.sql.prepare('INSERT OR REPLACE INTO game_v2_profile(sbd,revision,json,created_at) VALUES(?,1,?,?)').run('S1', JSON.stringify({ pet: 'lua_phuong', choice: false, cap: 6, exp: 50, nickname: 'x', mastery: [], cutover: '2026-09-21T05:00:00.000Z' }), 'x')
    const r = await goi(d, '/hs/thu-thach-hom-nay') as { co?: boolean; cau?: { qid: string }[] }
    expect(r.co, 'phải có thử thách để kiểm').toBe(true)
    const qs = (r.cau ?? []).map((c) => c.qid)
    expect(qs.length).toBeGreaterThan(0)
    expect(qs.filter((q) => khoiQid(q) > 11), `thử thách khối cao: ${qs.join(',')}`).toEqual([])
  })
})

describe('BÀI HẰNG NGÀY của phụ huynh (`chonCauBaiHangNgay`) — câu tới hạn nạp theo qid không lọc khối', () => {
  it('em khối 11 có 6 câu tờ khối 12 + 3 câu tờ khối 11 tới hạn ôn (khối 12 lọt vào sổ từ trước): bài chọn ra KHÔNG có câu khối 12', async () => {
    const d = taoD1That()
    emKhoi(d, 11)
    themKho(d, 'D1', 'hieu')
    dangHs(d, 'D1', { gap: 10, sai: 6, moi: 3, bac: 1 })
    const homQua = themNgay(NGAY, -1)
    for (let i = 1; i <= 6; i++) cauHs(d, qidI(12, i), 'D1', 'dang_on', homQua)
    for (let i = 1; i <= 3; i++) cauHs(d, qidI(11, i), 'D1', 'dang_on', homQua)
    const kq = await chonCauBaiHangNgay(d.env, 'S1', 9, H('19:00'))
    const qs = (kq.cau as { qid: string }[]).map((c) => c.qid)
    expect(qs.length, 'phải chọn được câu để kiểm').toBeGreaterThan(0)
    expect(qs.filter((q) => khoiQid(q) > 11), `bài hằng ngày khối cao: ${qs.join(',')}`).toEqual([])
  })
})

describe('PHỤ HUYNH GIAO THÊM (`phGiaoThem`) — câu đến lịch / sai chưa khắc phục nạp theo qid không lọc khối', () => {
  it('em khối 11: 8 câu tờ khối 12 đến lịch ôn + 5 câu tờ khối 11 đến lịch: gói giao thêm KHÔNG có câu khối 12', async () => {
    const d = taoD1That()
    emKhoi(d, 11)
    themKho(d, 'D1', 'hieu')
    d.sql.exec("INSERT INTO su_kien_hoc (khoa, sbd, qid, nguon, ma_nguon, lan, ket_qua, giay, luc, ngay_vn) VALUES ('k0','S1','HN-0','btvn','m',1,1,40,'2026-09-17T02:00:00.000Z','2026-09-17')")
    await lapVaLuuKeHoach(d.env, ['S1'], H('17:00'))
    d.sql.exec('DELETE FROM nam_kt_dang; DELETE FROM nam_kt_cau')
    dangHs(d, 'D1', { gap: 10, sai: 6, moi: 3, chua: 3, bac: 1 })
    const homQua = themNgay(NGAY, -1)
    for (let i = 1; i <= 8; i++) cauHs(d, qidI(12, i), 'D1', 'dang_on', homQua)
    for (let i = 1; i <= 5; i++) cauHs(d, qidI(11, i), 'D1', 'dang_on', homQua)
    const pass = await parentPass(d.env, 'S1')
    const r = await phGiaoThem(d.env, { pass }, H('19:00')) as { ok?: boolean; tuChoi?: unknown }
    expect(r.ok).toBe(true)
    const hang = d.sql.prepare("SELECT qid_json FROM ph_giao_them WHERE sbd = 'S1' ORDER BY luot").all() as { qid_json: string }[]
    const qs = hang.flatMap((h) => JSON.parse(h.qid_json) as string[])
    expect(qs.length, 'phải giao được câu để kiểm').toBeGreaterThan(0)
    expect(qs.filter((q) => khoiQid(q) > 11), `giao thêm khối cao: ${qs.join(',')}`).toEqual([])
  })
})
