import { DatabaseSync } from 'node:sqlite'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Env } from '../server/src/kieu'
import type { KetQuaDanhSachChua } from '../src/lib/chua-cau-sai-api'

const quyen = vi.hoisted(() => ({ sbd: 'EM-A', bat: true, ca: false }))
vi.mock('../server/src/game-v2-auth', () => ({ gameIdentity: async () => quyen.sbd }))
vi.mock('../server/src/chua-cau-sai-cau-hinh', () => ({ tinhNangBat: async () => quyen.bat }))
vi.mock('../server/src/ca-dang-mo', () => ({ coCaDangMo: async () => quyen.ca }))
vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may-thu' }))
import { danhSach } from '../server/src/chua-cau-sai'
import { apiDanhSachTuChua } from '../src/lib/chua-cau-sai-api'
import { docNhoTuSua, ngheTuSua, nhomMucChua, soCauCanSua, taiTuSuaLoi, xoaNhoTuSua } from '../src/lib/tu-sua-loi'

const NOW = Date.parse('2026-10-16T10:00:00.000Z')
function dbThu() {
  const sql = new DatabaseSync(':memory:')
  sql.exec(`CREATE TABLE chua_loi_dot(id TEXT PRIMARY KEY,sbd TEXT,qid_chuan TEXT,trang_thai_day TEXT,lan_gap_lai INTEGER,den_han TEXT,giao_luc INTEGER,dong_luc INTEGER,content_group TEXT DEFAULT '');
    CREATE INDEX idx_sbd ON chua_loi_dot(sbd,trang_thai_day,den_han);
    CREATE TABLE hoi_thay_kiem(id TEXT PRIMARY KEY,sbd TEXT,qid_goc TEXT,version_goc TEXT DEFAULT 'v1',nhom_goc TEXT DEFAULT 'G',trang_thai TEXT DEFAULT 'da_nop',het_han_luc INTEGER DEFAULT 0,phat_luc INTEGER DEFAULT 0,den_han INTEGER);
    CREATE INDEX htk_em_goc ON hoi_thay_kiem(sbd,qid_goc);
    CREATE TABLE game_v2_question(qid TEXT,ma_de TEXT,version TEXT,content_group TEXT,json TEXT);
    CREATE TABLE de_kho(ma_de TEXT,da_xoa INTEGER,cap_nhat_luc INTEGER);
    CREATE TABLE game_v2_index(ma_de TEXT,source_version INTEGER);`)
  let soLo = 0
  const prepare = (q: string) => {
    let args: (string | number | null)[] = []
    const s = { bind: (...a: (string | number | null)[]) => { args = a; return s }, all: async () => ({ results: sql.prepare(q).all(...args) }) }
    return s
  }
  const env = { DB: { prepare, batch: async (a: ReturnType<typeof prepare>[]) => { soLo++; return Promise.all(a.map((s) => s.all())) } } } as unknown as Env
  const them = (id: string, trangThai = 'can_thay', denHan = '', sbd = 'EM-A', giao = 100) => sql.prepare('INSERT INTO chua_loi_dot(id,sbd,qid_chuan,trang_thai_day,lan_gap_lai,den_han,giao_luc) VALUES(?,?,?,?,?,?,?)').run(id, sbd, `Q-${id}`, trangThai, 1, denHan, giao)
  return { sql, env, them, soLo: () => soLo }
}
beforeEach(() => { quyen.sbd = 'EM-A'; quyen.bat = true; quyen.ca = false })
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers(); xoaNhoTuSua() })

describe('Tự sửa lỗi · tổng thật và phân trang', () => {
  it('câu chưa có lỗi vẫn có lịch tự kiểm riêng: đúng em/nguồn hiện tại, không trùng đợt mở và không phát đáp án', async () => {
    vi.useFakeTimers(); vi.setSystemTime(NOW)
    const d = dbThu()
    d.sql.exec("INSERT INTO de_kho VALUES('DE',0,7); INSERT INTO game_v2_index VALUES('DE',7);")
    for (const qid of ['Q-MOI', 'Q-CHO', 'Q-DOT', 'Q-CU', 'Q-KHAC', 'Q-CHUA-DUYET']) {
      d.sql.prepare('INSERT INTO game_v2_question VALUES(?,?,?,?,?)').run(qid, 'DE', 'v1', 'G', JSON.stringify({ reviewed: qid !== 'Q-CHUA-DUYET', tenDang: 'Tính số mol', phan: 'III', correct: 'ĐÁP ÁN RIÊNG', solution: 'LỜI GIẢI RIÊNG' }))
    }
    const htk = (id: string, qid: string, trangThai = 'da_nop', den = NOW - 1, sbd = 'EM-A', version = 'v1', phat = NOW - 100) => d.sql.prepare('INSERT INTO hoi_thay_kiem(id,sbd,qid_goc,version_goc,trang_thai,het_han_luc,phat_luc,den_han) VALUES(?,?,?,?,?,?,?,?)').run(id, sbd, qid, version, trangThai, NOW + 99999, phat, den)
    htk('K1', 'Q-MOI'); htk('K1-CU', 'Q-MOI', 'da_nop', NOW - 2, 'EM-A', 'v1', NOW - 200)
    htk('K2', 'Q-CHO', 'da_nop', NOW + 86400000)
    htk('K3', 'Q-DOT', 'dang_lam'); htk('K4', 'Q-CU', 'dang_lam', NOW - 1, 'EM-A', 'v0')
    htk('K5', 'Q-KHAC', 'dang_lam', NOW - 1, 'EM-B'); htk('K6', 'Q-CHUA-DUYET', 'dang_lam')
    d.sql.prepare('INSERT INTO chua_loi_dot(id,sbd,qid_chuan,trang_thai_day,lan_gap_lai,den_han,giao_luc) VALUES(?,?,?,?,?,?,?)').run('DOT', 'EM-A', 'Q-DOT', 'can_thay', 1, '', 100)
    const j = await (await danhSach(d.env, {})).json() as { kiemLaiHoiThay: { qid: string; trangThai: string; denHan: string }[]; dem: { can: number } }
    expect(j.kiemLaiHoiThay.map(x => [x.qid, x.trangThai])).toEqual([['Q-MOI', 'den_han'], ['Q-CHO', 'cho_kiem_lai']])
    expect(j.kiemLaiHoiThay[1].denHan).toBe(new Date(NOW + 86400000).toISOString())
    expect(j.dem.can).toBe(1)
    expect(JSON.stringify(j.kiemLaiHoiThay)).not.toMatch(/ĐÁP ÁN|LỜI GIẢI|correct|solution|snapshot|answer/)
    expect(d.soLo()).toBe(1); d.sql.close()
  })
  it('đường kiểm lại Hỏi thầy chỉ có khi đúng em và câu đã có phiên kiểm, không thêm lượt đọc', async () => {
    const d = dbThu()
    for (let i = 1; i <= 4; i++) d.them(`D${i}`)
    d.sql.prepare('INSERT INTO hoi_thay_kiem(sbd,qid_goc) VALUES(?,?)').run('EM-A', 'Q-D1')
    d.sql.prepare('INSERT INTO hoi_thay_kiem(sbd,qid_goc) VALUES(?,?)').run('EM-B', 'Q-D3')
    d.sql.prepare('INSERT INTO hoi_thay_kiem(sbd,qid_goc) VALUES(?,?)').run('EM-A', 'Q-KHAC')
    const j = await (await danhSach(d.env, {})).json() as { ds: { dotId: string; kiemHoiThay: boolean }[] }
    expect(j.ds.map((x) => [x.dotId, x.kiemHoiThay])).toEqual([['D1', true], ['D2', false], ['D3', false], ['D4', false]])
    expect(d.soLo()).toBe(1); d.sql.close()
  })
  it('ca đang mở / chưa bật / không có phiên vẫn chặn trước khi đọc tổng hoặc danh sách', async () => {
    const d = dbThu(); d.them('D1')
    quyen.ca = true
    expect(await (await danhSach(d.env, {})).json()).toMatchObject({ ok: false, ma: 'DANG_KIEM_TRA' })
    quyen.ca = false; quyen.bat = false
    expect(await (await danhSach(d.env, {})).json()).toMatchObject({ ok: false, ma: 'FEATURE_TAT' })
    quyen.sbd = ''
    expect(await (await danhSach(d.env, {})).json()).toMatchObject({ ok: false, ma: 'CAN_DANG_NHAP' })
    expect(d.soLo()).toBe(0); d.sql.close()
  })
  it('em chưa có đợt lỗi nhận tổng số 0, không cần truy vấn lần nữa', async () => {
    const d = dbThu()
    expect(await (await danhSach(d.env, {})).json()).toEqual({ ok: true, ds: [], dem: { can: 0, cho: 0, xong: 0, tong: 0 }, kiemLaiHoiThay: [] })
    expect(d.soLo()).toBe(1); d.sql.close()
  })
  it('101+ mục: tổng can/cho/xong đúng ranh giới hạn, cô lập em; 1 batch/trang và keyset không lặp khi cùng giờ giao', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(NOW)
    const d = dbThu()
    for (let i = 0; i < 105; i++) d.them(`D${String(i).padStart(3, '0')}`)
    for (const [i, den] of ['2026-10-16T09:59:59.999Z', '2026-10-16T10:00:00.000Z', '2026-10-16T17:00:00+07:00', '2026-10-16T10:00:00.001Z', '', 'khong-phai-ngay'].entries()) d.them(`H${i}`, 'cho_gap_lai_2', den)
    d.them('X', 'da_tu_sua'); d.them('KHAC', 'can_thay', '', 'EM-B')
    // Constructor new Date() cũng được chốt để SQL và luật JS dùng cùng một mốc.
    vi.useFakeTimers(); vi.setSystemTime(NOW)
    const a = await (await danhSach(d.env, {})).json() as { ds: { dotId: string; trangThai: string; denHan: string }[]; dem: { can: number; cho: number; xong: number; tong: number }; sau: unknown }
    expect(a.ds).toHaveLength(100)
    expect(a.dem).toEqual({ can: 108, cho: 3, xong: 1, tong: 112 })
    expect(a.ds.slice(0, 3).every((x) => nhomMucChua(x, NOW) === 'can')).toBe(true)
    expect(d.soLo()).toBe(1)
    const b = await (await danhSach(d.env, { sau: a.sau })).json() as typeof a
    expect(b.ds).toHaveLength(12)
    expect(new Set([...a.ds, ...b.ds].map((x) => x.dotId)).size).toBe(112)
    expect([...a.ds, ...b.ds].some((x) => x.dotId === 'KHAC')).toBe(false)
    expect(b.dem).toEqual(a.dem)
    expect(b.sau).toBeUndefined()
    expect(d.soLo()).toBe(2)
    vi.useRealTimers(); d.sql.close()
  })

  it('API mới đọc metadata/cursor; client đếm tương thích payload cũ, trang tiếp chỉ 1 lệnh không gọi lại co', async () => {
    const sau = { hang: 1, giaoLuc: 100, dotId: 'D099', nay: new Date(NOW).toISOString() }
    const dem = { can: 135, cho: 4, xong: 6, tong: 145 }
    const urls: string[] = []
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      urls.push(String(input))
      return new Response(JSON.stringify(String(input).endsWith('/co') ? { ok: true } : { ok: true, ds: [{ dotId: 'D1', qid: 'Q1', trangThai: 'can_thay', kiemHoiThay: 1 }, { dotId: 'D2', qid: 'Q2', trangThai: 'can_thay', kiemHoiThay: false }], dem, sau, kiemLaiHoiThay: [{ qid: 'Q-NO-DOT', ten: 'Mol', phan: 'III', trangThai: 'den_han', correct: 'riêng', snapshot: 'riêng' }] }))
    }))
    const a = await apiDanhSachTuChua('token')
    expect(a).toMatchObject({ trangThai: 'bat', dem, sau })
    expect(a.trangThai === 'bat' ? a.ds.map((x) => x.kiemHoiThay) : []).toEqual([true, false])
    expect(a.trangThai === 'bat' ? a.kiemLaiHoiThay : []).toEqual([{ qid: 'Q-NO-DOT', ten: 'Mol', phan: 'III', trangThai: 'den_han' }])
    expect(soCauCanSua(a, NOW)).toBe(135)
    await apiDanhSachTuChua('token', sau)
    expect(urls.map((u) => u.split('/').pop())).toEqual(['co', 'danh-sach', 'danh-sach'])
    expect(soCauCanSua({ trangThai: 'bat', ds: [{ qid: 'Q1', trangThai: 'can_thay' }, { qid: 'Q2', trangThai: 'da_tu_sua' }] }, NOW)).toBe(1)
  })

  it('cache trang tiếp gộp dotId, giữ tổng full; người nghe không nhận riêng trang cuối; Hôm nay không tự tải hết', async () => {
    const sau = { hang: 1, giaoLuc: 100, dotId: 'D1', nay: new Date(NOW).toISOString() }
    const dem = { can: 135, cho: 0, xong: 0, tong: 135 }
    const kiemLaiHoiThay = [{ qid: 'Q-KL', ten: 'Kiểm lại số mol', phan: 'III', trangThai: 'den_han' }]
    let trang = 0
    const urls: string[] = []
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      urls.push(String(input))
      if (String(input).endsWith('/co')) return new Response('{"ok":true}')
      return new Response(JSON.stringify(++trang === 1 ? { ok: true, ds: [{ dotId: 'D1', qid: 'Q1', trangThai: 'can_thay' }], dem, sau, kiemLaiHoiThay } : { ok: true, ds: [{ dotId: 'D1', qid: 'Q1', trangThai: 'can_thay' }, { dotId: 'D2', qid: 'Q2', trangThai: 'can_thay' }], dem }))
    }))
    const nghe = vi.fn(), bo = ngheTuSua(nghe)
    const a = await taiTuSuaLoi('token')
    expect(urls).toHaveLength(2)
    expect(soCauCanSua(a, NOW)).toBe(135)
    const b = await taiTuSuaLoi('token', { sau })
    expect(b.trangThai === 'bat' ? b.ds.length : 0).toBe(2)
    expect(soCauCanSua(b, NOW)).toBe(135)
    expect(b.trangThai === 'bat' ? b.kiemLaiHoiThay : []).toEqual(kiemLaiHoiThay)
    expect(docNhoTuSua('token')).toEqual(b)
    const thongBao = nghe.mock.calls.at(-1)?.[1] as KetQuaDanhSachChua
    expect(thongBao.trangThai === 'bat' ? thongBao.ds.length : 0).toBe(2)
    expect(urls).toHaveLength(3)
    await taiTuSuaLoi('token')
    expect(urls).toHaveLength(3)
    bo()
  })
})
