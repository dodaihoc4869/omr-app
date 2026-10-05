// @vitest-environment node
// LÀM LẠI CÂU SAI BẰNG BẢN KHÁC · TRẠM HỒI PHỤC (làn A', 06/10) — D1 THẬT (node:sqlite, đủ migration), OMNI BẬT như bản sống, mọi lệnh đi qua Worker thật.
// Trạm hồi phục: 3 câu sai liền ⇒ em luyện câu nền ⇒ `hoa2-omni-tram-xong` ĐỔI ải kế tiếp bằng câu cùng dạng thấp hơn một bậc (omni-game.ts `timCauThapHon`).
// Trước 06/10 câu thay đó có thể là CÂU LỖI (em đang sai, chưa đóng lỗi) ra NGUYÊN VĂN. Nay qua THANG (cau-anh-em.ts `apLamLaiKhac`): song sinh bản kế → câu anh em
// ĐÚNG KHỐI → bản xáo → nguyên văn có đếm; câu thay QUA LẠI cổng khối chung `chanKhacKhoiEm`. Kho thử: câu cùng dạng, cùng mức, chưa gặp, trong phạm vi đã dạy ở
// tờ khối 11 (hợp lệ), khối 10, khối 12, tờ không rõ khối ⇒ chỉ luật khối chặn được câu khác khối.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import worker from '../server/src/index'
import { goiWorker, taoD1That, type D1That } from './_d1-that'
import { gameToken } from '../server/src/game-v2-auth'
import { xoaDemCaBaoVe } from '../server/src/game-v2-bank'
import { xoaDemCauHinh } from '../server/src/cau-hinh-dem'
import { xoaDemPhamVi } from '../server/src/bai-da-day'
import { LENH_TAO_BANG_TUY_CHON, xoaDemChienDich } from '../server/src/srs2-d1'
import { xoaDemOmni } from '../server/src/omni-d1'
import type { Env } from '../server/src/kieu'

interface CauThu { qid: string; maDe: string; dang: string; mucDo: string; correct: string; group?: string }
const TO_A = 'DH-11-B1', TO_B = 'DH-11-B2', TO10 = 'DH-10-B1', TO12 = 'DH-12-B1', TOX = 'DH-B9'
const LOP_TO: Record<string, string | null> = { [TO_A]: '11', [TO_B]: '11', [TO10]: '10', [TO12]: '12', [TOX]: null }
const PA = (qid: string, k: string) => `${qid} — giá trị ${'ABCD'.indexOf(k) + 1}`
const cauJson = (c: CauThu) => ({
  qid: c.qid, maDe: c.maDe, version: 'v1', group: c.group ?? `g-${c.qid}`, phan: 'I', text: `Đề câu ${c.qid}`,
  choices: ['A', 'B', 'C', 'D'].map((k) => PA(c.qid, k)), ideas: [], hinhAnh: [], dang: c.dang, tenDang: `Dạng ${c.dang}`, mucDo: c.mucDo, sao: 1, kienThuc: ['K1'], correct: c.correct,
  reviewed: true, solution: { chot: 'Bảo toàn khối lượng cho cả quá trình.' },
})
const ngayVnCua = (ms: number) => new Date(ms + 7 * 3_600_000).toISOString().slice(0, 10)
const luc = (ngay: string, gio = '08:00') => Date.parse(`${ngay}T${gio}:00+07:00`)

// Chuyến Đảo: Q1..Q6 (Q4 = Vận dụng: ải KẾ TIẾP bị thay sau Trạm; còn lại Thông hiểu). Q7 (Thông hiểu, cùng dạng = thấp hơn Q4 một bậc) là câu em SAI hôm qua ⇒ câu thay
// theo luật Trạm (mức sát dưới ải, ưu tiên khoảng cách bậc trước câu chưa gặp) là chính câu lỗi Q7. Anh em của Q7: S1 (Nhận biết, cách một bậc, KHÁC nhóm, khối 11, chưa gặp).
const CHUYEN = [1, 2, 3, 4, 5, 6].map((i): CauThu => ({ qid: `Q${i}`, maDe: TO_A, dang: 'D1', mucDo: i === 4 ? 'VD' : 'TH', correct: 'B' }))
const Q7: CauThu = { qid: 'Q7', maDe: TO_A, dang: 'D1', mucDo: 'TH', correct: 'C' }
// OMNI bật: kế hoạch ngày nhận cả "ôn bài cũ" (câu chưa gặp của tờ DẠY HỌC trong phạm vi, ≤ 20% thể lực) và câu trong kế hoạch KHÔNG thành câu anh em ⇒ đưa nhiều
// ứng viên (S1..S12) để còn câu ngoài kế hoạch cho thang.
const ANH_EM: CauThu[] = Array.from({ length: 12 }, (_, i): CauThu => ({ qid: `S${i + 1}`, maDe: TO_B, dang: 'D1', mucDo: 'NB', correct: 'ABCD'[(i + 2) % 4]! }))
const KHAC_KHOI: CauThu[] = [
  { qid: 'L10', maDe: TO10, dang: 'D1', mucDo: 'NB', correct: 'A' },
  { qid: 'L12', maDe: TO12, dang: 'D1', mucDo: 'NB', correct: 'A' },
  { qid: 'LX', maDe: TOX, dang: 'D1', mucDo: 'NB', correct: 'A' },
]

/** Em S1 lớp 11A1 (khối 11), Game Hóa 2.0 + OMNI BẬT, phạm vi đã dạy = mọi tờ của kho, chiến dịch CD1 (Q1..Q7). */
function dung(kho: CauThu[], tat = false): { d: D1That; env: Env } {
  const d = taoD1That()
  const env = d.env as unknown as Env
  d.sql.exec("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES('S1','Nguyễn An','11A1','mk1','x')")
  d.sql.exec(`INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('game_hoa_2','{"bat":true,"lop":["11A1"]}','x'),('omni','{"bat":true,"lop":[],"sbd":[]}','x')`)
  if (tat) d.sql.exec(`INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('lam_lai_khac','{"bat":false}','x')`)
  d.sql.prepare('INSERT INTO game_v2_profile(sbd,json,created_at) VALUES(?,?,?)').run('S1', JSON.stringify({ pet: 'lua_phuong', choice: false, legacy: null, cap: 5, exp: 0, wallet: 0, earned: 0, tower: 1, mastery: [], arena: null, cutover: '2020-01-01T00:00:00.000Z' }), 'x')
  const to = [...new Set(kho.map((c) => c.maDe))]
  for (const m of to) {
    d.sql.prepare('INSERT INTO de_kho(ma_de,ten_de,lop,so_cau,da_xoa,cap_nhat_luc) VALUES(?,?,?,?,0,?)').run(m, `Tờ ${m}`, LOP_TO[m] ?? null, kho.filter((c) => c.maDe === m).length, 'v1')
    d.sql.prepare("INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES(?,'v1','x')").run(m)
  }
  const st = d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)')
  for (const c of kho) st.run(c.maDe, c.qid, 'v1', c.group ?? `g-${c.qid}`, c.dang, JSON.stringify(cauJson(c)))
  d.sql.prepare("INSERT INTO bai_da_day(id,lop,khoa_bai,ten_bai,vi_tri,ma_to_json,tick_luc) VALUES('T1','11A1','B1','Bài 1',1,?,'2026-10-01T00:00:00.000Z')").run(JSON.stringify(to))
  d.sql.prepare("INSERT INTO chien_dich(id,ten,lop,sbd_json,ma_de_json,qid_json,han_nop,tao_luc) VALUES('CD1','Ôn chương 1','11A1','[\"S1\"]',?,?,'2026-10-30','2026-10-01T00:00:00.000Z')")
    .run(JSON.stringify([TO_A]), JSON.stringify([...CHUYEN, Q7].map((c) => c.qid)))
  d.sql.exec(LENH_TAO_BANG_TUY_CHON)
  d.sql.exec("INSERT INTO chien_dich_tuy_chon(id,rai_deu,cap_nhat_luc) VALUES('CD1',0,'x')")
  return { d, env }
}
function ghi(d: D1That, qid: string, kq: 0 | 1, ms: number, nguon = 'luyen') {
  d.sql.prepare('INSERT INTO su_kien_hoc(khoa,sbd,qid,nguon,ma_nguon,lan,ket_qua,luc,ngay_vn,assistance) VALUES(?,?,?,?,?,1,?,?,?,?)')
    .run(`${nguon}|S1|${qid}|${ms}`, 'S1', qid, nguon, `M-${ms}`, kq, new Date(ms).toISOString(), ngayVnCua(ms), 'none')
}
const em = async (env: Env, duong: string, b: Record<string, unknown> = {}) => goiWorker(worker, env, duong, { token: await gameToken(env, 'S1'), ...b })
const phien = (d: D1That, id: string) => JSON.parse((d.sql.prepare('SELECT json FROM game_v2_session WHERE id = ?').get(id) as { json: string }).json) as { questions: Record<string, unknown>[]; tram?: number }
const soCua = (d: D1That, qid: string) => d.sql.prepare("SELECT qid, ket_qua, raw_json FROM su_kien_hoc WHERE sbd = 'S1' AND qid = ? AND nguon = 'game' ORDER BY luc").all(qid) as { qid: string; ket_qua: number; raw_json: string | null }[]
function khongLoDapAn(r: unknown) {
  const s = JSON.stringify(r)
  for (const k of ['"correct"', '"solution"', '"answer"', '"dapAn"', '"tc"', '"xt"', '"nv"', '"traLoiGoc"']) expect(s, `phản hồi lộ ${k}`).not.toContain(k)
}
const dapAnHien = (c: CauThu, de: { choices: string[] }): string => 'ABCD'[de.choices.indexOf(PA(c.qid, c.correct))]!
/** Chuyến Đảo P1 (6 ải Q1..Q6) mở sẵn trong D1, như `start` đã phát. */
function moPhien(d: D1That) {
  d.sql.prepare('INSERT INTO game_v2_session(id,sbd,json,created_at) VALUES(?,?,?,?)').run('P1', 'S1', JSON.stringify({
    mode: 'adventure', created: Date.now(), hoa2: 1,
    questions: CHUYEN.map((c) => ({ qid: c.qid, maDe: c.maDe, version: 'v1', group: `g-${c.qid}`, novel: true, role: 'moi' })),
  }), new Date().toISOString())
}
/** 3 câu sai liền (Q1..Q3) với thời lượng em tự làm ⇒ mở Trạm; trả về kết quả câu thứ 3. */
async function saiBaCau(env: Env) {
  let r: Record<string, any> = {}
  for (const q of ['Q1', 'Q2', 'Q3']) { vi.setSystemTime(Date.now() + 60_000); r = await em(env, '/game-v2/answer', { session: 'P1', qid: q, answer: 'A', msLam: 40_000 }) }
  return r
}

beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); xoaDemCaBaoVe(); xoaDemChienDich(); xoaDemPhamVi(); xoaDemOmni() })
afterEach(() => vi.useRealTimers())

async function chuanBi(kho: CauThu[], tat = false) {
  const { d, env } = dung(kho, tat)
  if (tat) xoaDemCauHinh(env)
  ghi(d, 'Q7', 0, luc('2026-10-05', '10:00')) // Q7: câu LỖI mở (em sai hôm qua)
  vi.setSystemTime(luc('2026-10-06'))
  await em(env, '/game-v2/choose', { pet: 'dat_quy' })
  moPhien(d)
  const ba = await saiBaCau(env)
  expect(ba.ok, JSON.stringify(ba).slice(0, 300)).toBe(true)
  expect(ba.omni?.tram, 'OMNI bật + 3 sai liền ⇒ Trạm hồi phục').toBeTruthy()
  return { d, env }
}

describe('Trạm hồi phục · câu thay ải là câu LỖI ⇒ bản khác (câu anh em ĐÚNG KHỐI), không nguyên văn', () => {
  it('Q7 (câu lỗi) có câu anh em S1 ⇒ ải đổi là S1 (không phải Q7 nguyên văn); phiên ghi tc = Q7; chấm được; gọi lại trả đúng S1; sổ ghi tc; không lộ đáp án', async () => {
    const { d, env } = await chuanBi([...CHUYEN, Q7, ...ANH_EM, ...KHAC_KHOI])
    const r = await em(env, '/game-v2/hoa2-omni-tram-xong', { session: 'P1' })
    expect(r.ok, JSON.stringify(r).slice(0, 300)).toBe(true)
    const goc = ANH_EM.find((c) => c.qid === r.cau.qid)
    expect(goc, `câu thay phải là câu anh em, nhận ${r.cau.qid}`).toBeTruthy()
    expect(['L10', 'L12', 'LX']).not.toContain(r.cau.qid)
    khongLoDapAn(r)
    expect(JSON.stringify(r)).not.toContain('Q7')
    const ref = phien(d, 'P1').questions[r.viTri]!
    expect(ref).toMatchObject({ qid: r.cau.qid, tc: 'Q7' })
    const lai = await em(env, '/game-v2/hoa2-omni-tram-xong', { session: 'P1' })
    expect(lai).toMatchObject({ ok: true, viTri: r.viTri })
    expect(lai.cau.qid).toBe(r.cau.qid)
    vi.setSystemTime(Date.now() + 60_000)
    const t = await em(env, '/game-v2/answer', { session: 'P1', qid: r.cau.qid, answer: dapAnHien(goc!, r.cau), msLam: 30_000 })
    expect(t.ok, JSON.stringify(t).slice(0, 300)).toBe(true)
    expect(t.correct).toBe(true)
    expect(soCua(d, r.cau.qid).map((x) => ({ kq: x.ket_qua, tc: JSON.parse(x.raw_json ?? '{}').tc }))).toEqual([{ kq: 1, tc: 'Q7' }])
    expect(soCua(d, 'Q7')).toEqual([]) // câu lỗi Q7 chưa lần nào ra nguyên văn
  })

  it('LUẬT KHỐI: chỉ còn ứng viên lớp 10 / lớp 12 / không rõ khối / cùng nhóm ⇒ KHÔNG BAO GIỜ lấy chúng — Q7 ra BẢN XÁO (cùng thứ tự khi gọi lại), chấm đúng theo thứ tự đã xáo, sổ quy về khung gốc', async () => {
    const { d, env } = await chuanBi([...CHUYEN, Q7, ...ANH_EM.map((c) => ({ ...c, group: 'g-Q7' })), ...KHAC_KHOI])
    const r = await em(env, '/game-v2/hoa2-omni-tram-xong', { session: 'P1' })
    expect(r.ok, JSON.stringify(r).slice(0, 300)).toBe(true)
    expect(r.cau.qid).toBe('Q7') // bản xáo của chính câu lỗi
    expect(r.cau.choices).not.toEqual(['A', 'B', 'C', 'D'].map((k) => PA('Q7', k)))
    expect([...r.cau.choices].sort()).toEqual(['A', 'B', 'C', 'D'].map((k) => PA('Q7', k)).sort())
    khongLoDapAn(r)
    const ref = phien(d, 'P1').questions[r.viTri]!
    expect(ref).toMatchObject({ qid: 'Q7' })
    expect(Array.isArray(ref.xt)).toBe(true)
    const lai = await em(env, '/game-v2/hoa2-omni-tram-xong', { session: 'P1' })
    expect(lai.cau.choices).toEqual(r.cau.choices) // phát lại y hệt lúc phát
    const chu = dapAnHien(Q7, r.cau)
    expect(chu).not.toBe('C') // chữ cái em nhớ ("C") không còn đúng
    vi.setSystemTime(Date.now() + 60_000)
    const t = await em(env, '/game-v2/answer', { session: 'P1', qid: 'Q7', answer: chu, msLam: 30_000 })
    expect(t.correct).toBe(true)
    expect(JSON.parse(soCua(d, 'Q7')[0]!.raw_json!)).toMatchObject({ chon: 'C', xt: 1 })
  })

  it('tắt khoá lam_lai_khac ⇒ y hệt hôm nay: Q7 nguyên văn, phiên và sổ không có khoá làm lại nào', async () => {
    const { d, env } = await chuanBi([...CHUYEN, Q7, ...ANH_EM, ...KHAC_KHOI], true)
    const r = await em(env, '/game-v2/hoa2-omni-tram-xong', { session: 'P1' })
    expect(r.ok, JSON.stringify(r).slice(0, 300)).toBe(true)
    expect(r.cau.qid).toBe('Q7')
    expect(r.cau.choices).toEqual(['A', 'B', 'C', 'D'].map((k) => PA('Q7', k)))
    const ref = phien(d, 'P1').questions[r.viTri]!
    for (const k of ['tc', 'xt', 'nv']) expect(k in ref, `phiên có khoá ${k}`).toBe(false)
    vi.setSystemTime(Date.now() + 60_000)
    const t = await em(env, '/game-v2/answer', { session: 'P1', qid: 'Q7', answer: 'C', msLam: 30_000 })
    expect(t.correct).toBe(true)
    expect(JSON.parse(soCua(d, 'Q7')[0]!.raw_json!)).not.toHaveProperty('tc')
    expect(JSON.parse(soCua(d, 'Q7')[0]!.raw_json!)).not.toHaveProperty('xt')
  })

  it('câu thay KHÔNG phải câu lỗi (Q7 chưa từng sai) ⇒ y hệt hôm nay: Q7 nguyên văn, không khoá làm lại', async () => {
    const { d, env } = dung([...CHUYEN, Q7, ...ANH_EM, ...KHAC_KHOI])
    vi.setSystemTime(luc('2026-10-06'))
    await em(env, '/game-v2/choose', { pet: 'dat_quy' })
    moPhien(d)
    await saiBaCau(env)
    const r = await em(env, '/game-v2/hoa2-omni-tram-xong', { session: 'P1' })
    expect(r.ok, JSON.stringify(r).slice(0, 300)).toBe(true)
    expect(r.cau.qid).toBe('Q7')
    expect(r.cau.choices).toEqual(['A', 'B', 'C', 'D'].map((k) => PA('Q7', k)))
    const ref = phien(d, 'P1').questions[r.viTri]!
    for (const k of ['tc', 'xt', 'nv']) expect(k in ref, `phiên có khoá ${k}`).toBe(false)
  })
})
