// @vitest-environment node
// P05/T09 — NGÂN SÁCH NGÀY DÙNG CHUNG: lượt game chỉ lấy phần CÒN LẠI (02 §5.2 + 06 T09).
// Test gọi CODE SẢN PHẨM THẬT qua Worker THẬT (`goiWorker`) trên D1 THẬT, cờ `cau_hinh.ngan_sach_luot`.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import worker from '../server/src/index'
import { gameToken } from '../server/src/game-v2-auth'
import { uocLuongMotCau } from '../server/src/uoc-luong-thoi-gian'
import { docNganSachConLai, xoaDemNganSachLuot, KHOA_BAT_NGAN_SACH_LUOT } from '../server/src/ngan-sach-luot'
import { ghiSuKien } from '../server/src/su-kien-hoc'
import { goiWorker, taoD1That, type D1That } from './_d1-that'
import { daHocDang } from './_pham-vi-ca-nhan'

const T0 = Date.parse('2026-09-22T12:00:00+07:00')
const NGAY = '2026-09-22'
beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(T0); xoaDemNganSachLuot() })
afterEach(() => vi.useRealTimers())

/** Câu Phần I mức 'hieu' (base 105) — dạng A.1 để mở được phạm vi cho em. */
const cau = (qid: string) => ({
  qid, maDe: 'DE1', version: 'v1', group: `g-${qid}`, phan: 'I', text: `Đề ${qid}`,
  choices: ['A. a', 'B. b', 'C. c', 'D. d'], ideas: [], hinhAnh: [], dang: 'A.1', tenDang: 'Dạng A.1',
  mucDo: 'hieu', sao: 1, kienThuc: ['K1'], correct: 'B', solution: `LG-${qid}`, reviewed: true,
})

/** Kho 8 câu + em S1 đã học dạng A.1 + kế hoạch ngày 10 phút (600 giây). */
function dung(o: { phutNgay?: number; giayDaDung?: number } = {}) {
  const d = taoD1That()
  d.sql.prepare("INSERT INTO de_kho(ma_de,ten_de,lop,so_cau,r2_khoa,da_xoa,cap_nhat_luc) VALUES('DE1','DE1','12',8,'k',0,'v1')").run()
  d.sql.prepare("INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('DE1','v1','x')").run()
  const ins = d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)')
  for (let i = 0; i < 8; i++) { const q = cau(`Q${i}`); ins.run('DE1', q.qid, 'v1', q.group, q.dang, JSON.stringify(q)) }
  d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES('S1','Em Một','12','mk','x')").run()
  d.sql.prepare('INSERT INTO game_v2_profile(sbd,json,created_at) VALUES(?,?,?)').run('S1', JSON.stringify({
    pet: 'lua_phuong', choice: false, legacy: null, cap: 5, exp: 0, wallet: 0, earned: 0, tower: 1, mastery: [], arena: null, cutover: '2020-01-01T00:00:00.000Z',
  }), 'x')
  daHocDang(d, 'S1', 'A.1')
  d.sql.prepare("INSERT INTO ke_hoach_ngay(khoa,sbd,ngay,phien_ban,seed,ngan_sach_json,viec_json,canh_bao_json,cap_nhat_luc) VALUES(?,?,?,?,?,?,?,?,?)")
    .run(`S1|${NGAY}`, 'S1', NGAY, 2, 1, JSON.stringify({ mucTieuCau: 6, toiThieuCau: 4, phutNgay: o.phutNgay ?? 10, vanTocGiay: 90 }), '[]', '[]', 'x')
  return d
}
const batCo = (d: D1That, giaTri: string) =>
  d.sql.prepare("INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES(?,?,'x') ON CONFLICT(khoa) DO UPDATE SET gia_tri=excluded.gia_tri").run(KHOA_BAT_NGAN_SACH_LUOT, giaTri)
const startGame = (d: D1That) => goiWorker(worker, d.env, '/game-v2/start', { token: '', mode: 'adventure' }) as Promise<Record<string, unknown>>

describe('T09 — game chỉ dùng PHẦN NGÂN SÁCH CÒN LẠI của ngày (cờ riêng, mặc định TẮT)', () => {
  it('cờ TẮT (mặc định): đường cũ nguyên vẹn — lượt vẫn phát tới 6 câu như trước', async () => {
    const d = dung()
    const token = await gameToken(d.env, 'S1')
    const r = await goiWorker(worker, d.env, '/game-v2/start', { token, mode: 'adventure' }) as Record<string, unknown>
    expect(r.ok).toBe(true)
    expect((r.questions as unknown[]).length).toBeGreaterThan(2)
    expect(r.nganSach).toBeUndefined()
  })

  it('cờ BẬT: ngân sách 600 giây, mỗi câu ước lượng ~135 giây ⇒ lượt chỉ còn 4 câu (không nhét cho đủ 6)', async () => {
    const d = dung()
    batCo(d, 'bat')
    const token = await gameToken(d.env, 'S1')
    const r = await goiWorker(worker, d.env, '/game-v2/start', { token, mode: 'adventure' }) as Record<string, unknown>
    expect(r.ok).toBe(true)
    const uoc = uocLuongMotCau({ qid: 'x', part: 'I', difficulty: 1 }, { mau: [], nowMs: T0 })
    expect(uoc.taskSeconds).toBe(135) // 105 + 30
    expect((r.questions as unknown[]).length).toBe(Math.floor(600 / uoc.taskSeconds))
    expect((r.questions as unknown[]).length).toBe(4)
    expect(r.nganSach).toMatchObject({ conLaiGiay: 600, soCauBoQua: 2 })
  })

  it('đã dùng 500 giây hôm nay ⇒ chỉ còn 100 giây: KHÔNG phát câu nào (thay vì phát cho đủ lượt)', async () => {
    const d = dung()
    batCo(d, 'bat')
    await ghiSuKien(d.env, [
      { nguon: 'btvn', maNguon: 'M', sbd: 'S1', qid: 'QX1', lan: 1, ketQua: 1, giay: 300, luc: `${NGAY}T03:00:00.000Z` },
      { nguon: 'btvn', maNguon: 'M', sbd: 'S1', qid: 'QX2', lan: 1, ketQua: 1, giay: 200, luc: `${NGAY}T03:30:00.000Z` },
    ])
    const ns = await docNganSachConLai(d.env, 'S1', NGAY)
    expect(ns).toMatchObject({ nganSachGiay: 600, daDungGiay: 500, conLaiGiay: 100 })
    const token = await gameToken(d.env, 'S1')
    const r = await goiWorker(worker, d.env, '/game-v2/start', { token, mode: 'adventure' }) as Record<string, unknown>
    expect(r.ok).toBe(true)
    expect((r.questions as unknown[]).length).toBe(0)
    expect(r.lyDo).toBe('het_ngan_sach_ngay')
    expect(String(r.message)).toMatch(/thời gian học/)
  })

  it('chưa có kế hoạch ngày ⇒ KHÔNG bịa ngân sách (adapter trả `null`, đường cũ giữ nguyên)', async () => {
    const d = dung()
    batCo(d, 'bat')
    d.sql.exec("DELETE FROM ke_hoach_ngay")
    expect(await docNganSachConLai(d.env, 'S1', NGAY)).toBeNull()
    const token = await gameToken(d.env, 'S1')
    const r = await goiWorker(worker, d.env, '/game-v2/start', { token, mode: 'adventure' }) as Record<string, unknown>
    expect((r.questions as unknown[]).length).toBeGreaterThan(2)
  })
})
