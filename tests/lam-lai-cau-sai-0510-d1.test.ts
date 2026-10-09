// @vitest-environment node
// LÀM LẠI CÂU SAI BẰNG BẢN KHÁC (thầy 05/10) — nghiệm thu trên D1 THẬT (node:sqlite, đủ migration), mọi lệnh của em/thầy đi qua đúng đường
// Worker thật (`server/src/index.ts`). Đặc tả: DE-XUAT-LAM-LAI-CAU-SAI-0510.md mục 3 (7 tiêu chí); tệp thuần: lam-lai-cau-sai-0510-thuan.test.ts.
// Kho thử: tờ khối 11 (của em), tờ khối 10, tờ khối 12, tờ không rõ khối — CÙNG dạng, cùng mức, chưa gặp, nằm TRONG phạm vi đã dạy của lớp
// (một bài tick gồm cả bốn tờ) ⇒ chỉ có luật khối chặn được câu khác khối.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import worker from '../server/src/index'
import { goiWorker, taoD1That, type D1That } from './_d1-that'
import { gameToken } from '../server/src/game-v2-auth'
import { xoaDemCaBaoVe } from '../server/src/game-v2-bank'
import { xoaDemCauHinh } from '../server/src/cau-hinh-dem'
import { xoaDemPhamVi } from '../server/src/bai-da-day'
import { docHoSo2, docLanLam, xoaDemChienDich } from '../server/src/srs2-d1'
import { DEM_NGUOC_MS } from '../server/src/game-v2-doan'
import { damBaoBangBoTro } from '../server/src/cau-bo-tro'
import { damBaoBangLoiGiai } from '../server/src/loi-giai'
import { damBaoBangNutThat } from '../server/src/nut-that'
import { chayTuHoanThien } from '../server/src/tu-hoan-thien'
import { phatLaiLoi } from '../server/src/loi-hoc-luat'
import { sqlQidHoacTc } from '../server/src/lam-lai-so'
import { SQL_LA_LAN_LAM } from '../server/src/omni-kieu'
import type { Env } from '../server/src/kieu'

type Phan = 'I' | 'II' | 'III'
interface CauThu { qid: string; maDe: string; phan: Phan; dang: string; mucDo: string; correct: string; group?: string; solution?: unknown }
const TO11 = 'DH-11-B1', TO10 = 'DH-10-B1', TO12 = 'DH-12-B1', TOX = 'DH-B9'
const LOP_TO: Record<string, string | null> = { [TO11]: '11', [TO10]: '10', [TO12]: '12', [TOX]: null }
const PA = (qid: string, k: string) => `${qid} — giá trị ${'ABCD'.indexOf(k) + 1}`
const Y = (qid: string, i: number) => `${qid} — ý ${i + 1}`
const cauJson = (c: CauThu) => ({
  qid: c.qid, maDe: c.maDe, version: 'v1', group: c.group ?? `g-${c.qid}`, phan: c.phan, text: `Đề câu ${c.qid}`,
  choices: c.phan === 'I' ? ['A', 'B', 'C', 'D'].map((k) => PA(c.qid, k)) : [], ideas: c.phan === 'II' ? [0, 1, 2, 3].map((i) => Y(c.qid, i)) : [],
  hinhAnh: [], dang: c.dang, tenDang: `Dạng ${c.dang}`, mucDo: c.mucDo, sao: 1, kienThuc: ['K1'], correct: c.correct, reviewed: true,
  solution: c.solution ?? { chot: 'Bảo toàn khối lượng cho cả quá trình.' },
})
const ngayVnCua = (ms: number) => new Date(ms + 7 * 3_600_000).toISOString().slice(0, 10)
const luc = (ngay: string, gio = '08:00') => Date.parse(`${ngay}T${gio}:00+07:00`)

/** Em S1 lớp 11A1 (khối 11), Game Hóa 2.0 + Đoàn bật, phạm vi đã dạy = mọi tờ của kho, chiến dịch CD1 chứa các câu `cd`. */
function dung(kho: CauThu[], cd: string[]): { d: D1That; env: Env } {
  const d = taoD1That()
  const env = d.env as unknown as Env
  d.sql.exec("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES('S1','Nguyễn An','11A1','mk1','x')")
  d.sql.exec(`INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('game_hoa_2','{"bat":true,"lop":["11A1"]}','x'),('doan_ho_tong','{"toanBo":true}','x')`)
  d.sql.prepare('INSERT INTO game_v2_profile(sbd,json,created_at) VALUES(?,?,?)').run('S1', JSON.stringify({ pet: 'lua_phuong', choice: false, legacy: null, cap: 5, exp: 0, wallet: 0, earned: 0, tower: 1, mastery: [], arena: null, cutover: '2020-01-01T00:00:00.000Z' }), 'x')
  const to = [...new Set(kho.map((c) => c.maDe))]
  for (const m of to) {
    d.sql.prepare('INSERT INTO de_kho(ma_de,ten_de,lop,so_cau,da_xoa,cap_nhat_luc) VALUES(?,?,?,?,0,?)').run(m, `Tờ ${m}`, LOP_TO[m] ?? null, kho.filter((c) => c.maDe === m).length, 'v1')
    d.sql.prepare("INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES(?,'v1','x')").run(m)
  }
  const st = d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)')
  for (const c of kho) st.run(c.maDe, c.qid, 'v1', c.group ?? `g-${c.qid}`, c.dang, JSON.stringify(cauJson(c)))
  // Phạm vi đã dạy của lớp: MỘT bài tick gồm cả bốn tờ (câu khác khối nằm trong phạm vi ⇒ chỉ luật khối chặn được).
  d.sql.prepare("INSERT INTO bai_da_day(id,lop,khoa_bai,ten_bai,vi_tri,ma_to_json,tick_luc) VALUES('T1','11A1','B1','Bài 1',1,?,'2026-10-01T00:00:00.000Z')").run(JSON.stringify(to))
  d.sql.prepare("INSERT INTO chien_dich(id,ten,lop,sbd_json,ma_de_json,qid_json,han_nop,tao_luc) VALUES('CD1','Ôn chương 1','11A1','[\"S1\"]',?,?,'2026-10-30','2026-10-01T00:00:00.000Z')")
    .run(JSON.stringify([TO11]), JSON.stringify(cd))
  return { d, env }
}
/** Một lượt TỰ LÀM của S1 (sổ chuẩn). */
function ghi(d: D1That, qid: string, kq: 0 | 1, ms: number, nguon = 'luyen') {
  d.sql.prepare('INSERT INTO su_kien_hoc(khoa,sbd,qid,nguon,ma_nguon,lan,ket_qua,luc,ngay_vn,assistance) VALUES(?,?,?,?,?,1,?,?,?,?)')
    .run(`${nguon}|S1|${qid}|${ms}`, 'S1', qid, nguon, `M-${ms}`, kq, new Date(ms).toISOString(), ngayVnCua(ms), 'none')
}
const em = async (env: Env, duong: string, b: Record<string, unknown> = {}) => goiWorker(worker, env, duong, { token: await gameToken(env, 'S1'), ...b })
const thay = (env: Env, duong: string, b: Record<string, unknown>) => goiWorker(worker, env, duong, b, true)
const dao = (env: Env) => em(env, '/game-v2/start', { mode: 'adventure' })
const phien = (d: D1That, id: string) => JSON.parse((d.sql.prepare('SELECT json FROM game_v2_session WHERE id = ?').get(id) as { json: string }).json) as { questions: Record<string, unknown>[] }
const soCua = (d: D1That, qid: string) => d.sql.prepare("SELECT qid, ket_qua, ngay_vn, raw_json FROM su_kien_hoc WHERE sbd = 'S1' AND qid = ? AND nguon = 'game' ORDER BY luc").all(qid) as { qid: string; ket_qua: number; ngay_vn: string; raw_json: string | null }[]
/** Không khoá nào của đáp án / lời giải / khoá làm lại nội bộ trong phản hồi. */
function khongLoDapAn(r: unknown) {
  const s = JSON.stringify(r)
  for (const k of ['"correct"', '"solution"', '"answer"', '"dapAn"', '"tc"', '"xt"', '"nv"', '"traLoiGoc"']) expect(s, `phản hồi lộ ${k}`).not.toContain(k)
}
/** Phương án/mẫu Đ-S ĐÚNG theo thứ tự ĐANG HIỆN (bản xáo thì khác chữ gốc) — tìm bằng nội dung, như em đọc đề. */
function dapAnHien(c: CauThu, de: { choices?: string[]; ideas?: string[] }): string {
  if (c.phan === 'I') return 'ABCD'[de.choices!.indexOf(PA(c.qid, c.correct))]!
  if (c.phan === 'II') return de.ideas!.map((y) => c.correct[[0, 1, 2, 3].find((i) => Y(c.qid, i) === y)!]!).join('')
  return c.correct
}

// Kho chung: Q2 (Phần II, câu em sai) và các ứng viên anh em cùng dạng D2.
const Q2: CauThu = { qid: 'Q2', maDe: TO11, phan: 'II', dang: 'D2', mucDo: 'TH', correct: 'DSSD' }
const A2: CauThu = { qid: 'A2', maDe: TO11, phan: 'II', dang: 'D2', mucDo: 'TH', correct: 'SDDS' } // anh em cùng mức
const A2V: CauThu = { qid: 'A2V', maDe: TO11, phan: 'II', dang: 'D2', mucDo: 'VD', correct: 'DDSS' } // mức kề
const A2G: CauThu = { qid: 'A2G', maDe: TO11, phan: 'II', dang: 'D2', mucDo: 'TH', correct: 'DSSD', group: 'g-Q2' } // CÙNG nhóm nội dung với Q2 ⇒ loại
const A2P: CauThu = { qid: 'A2P', maDe: TO11, phan: 'I', dang: 'D2', mucDo: 'TH', correct: 'C' } // khác phần ⇒ loại
const KHAC_KHOI: CauThu[] = [
  { qid: 'L10', maDe: TO10, phan: 'II', dang: 'D2', mucDo: 'TH', correct: 'SSDD' },
  { qid: 'L12', maDe: TO12, phan: 'II', dang: 'D2', mucDo: 'TH', correct: 'SSDD' },
  { qid: 'LX', maDe: TOX, phan: 'II', dang: 'D2', mucDo: 'TH', correct: 'SSDD' },
]
const KHO2 = [Q2, A2, A2V, A2G, A2P, ...KHAC_KHOI]

beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); xoaDemCaBaoVe(); xoaDemChienDich(); xoaDemPhamVi() })
afterEach(() => vi.useRealTimers())

describe('tiêu chí 2 · Đảo: câu sai không có song sinh ⇒ CÂU ANH EM cùng dạng, cùng mức, khác nhóm, chưa gặp, ĐÚNG KHỐI', () => {
  it('lượt làm lại là A2 (vai ôn lại), phản hồi không lộ đáp án, Q2 nguyên văn không xuất hiện, phiên ghi tc = Q2, tất định theo (em, ngày, câu)', async () => {
    const { d, env } = dung(KHO2, ['Q2'])
    ghi(d, 'Q2', 0, luc('2026-10-05', '10:00'))
    vi.setSystemTime(luc('2026-10-06'))
    const r = await dao(env)
    expect(r.ok, JSON.stringify(r).slice(0, 300)).toBe(true)
    expect(r.questions.map((q: { qid: string }) => q.qid)).toEqual(['A2'])
    expect(r.questions[0]).toMatchObject({ vai: 'on_lai', phan: 'II', ideas: [0, 1, 2, 3].map((i) => Y('A2', i)) })
    khongLoDapAn(r)
    expect(JSON.stringify(r)).not.toContain('Q2')
    expect(phien(d, r.id).questions[0]).toMatchObject({ qid: 'A2', tc: 'Q2', role: 'on_lai' })
    // Chuyến đang chờ (chưa làm câu nào) ⇒ trả lại chính chuyến ấy, cùng câu anh em.
    const lai = await dao(env)
    expect(lai.id).toBe(r.id)
    expect(lai.questions.map((q: { qid: string }) => q.qid)).toEqual(['A2'])
    // Tất định: bỏ chuyến, chọn lại cùng ngày ⇒ vẫn A2.
    d.sql.exec('DELETE FROM game_v2_session')
    const moi = await dao(env)
    expect(moi.id).not.toBe(r.id)
    expect(moi.questions.map((q: { qid: string }) => q.qid)).toEqual(['A2'])
  })

  it('LUẬT KHỐI: em lớp 11 sai câu lớp 11, hết câu anh em khối 11 ⇒ KHÔNG BAO GIỜ lấy câu lớp 10 / lớp 12 / không rõ khối (rơi xuống bản xáo)', async () => {
    // Chỉ còn ứng viên khác khối (cùng dạng, cùng mức, chưa gặp, trong phạm vi) + ứng viên khối 11 bị loại vì cùng nhóm / khác phần.
    const { d, env } = dung([Q2, A2G, A2P, ...KHAC_KHOI], ['Q2'])
    ghi(d, 'Q2', 0, luc('2026-10-05', '10:00'))
    for (const ngay of ['2026-10-06', '2026-10-07', '2026-10-08']) {
      d.sql.exec('DELETE FROM game_v2_session')
      vi.setSystemTime(luc(ngay))
      const r = await dao(env)
      expect(r.ok, JSON.stringify(r).slice(0, 300)).toBe(true)
      const qids = r.questions.map((q: { qid: string }) => q.qid)
      for (const sai of ['L10', 'L12', 'LX', 'A2G', 'A2P']) expect(qids).not.toContain(sai)
      expect(qids).toEqual(['Q2']) // bản xáo của chính câu Q2 (bậc 3)
      expect(r.questions[0].ideas).not.toEqual([0, 1, 2, 3].map((i) => Y('Q2', i)))
      expect([...r.questions[0].ideas].sort()).toEqual([0, 1, 2, 3].map((i) => Y('Q2', i)).sort())
      khongLoDapAn(r)
    }
    // Đối chứng: thêm MỘT câu khối 11 đủ điều kiện ⇒ chính nó thành câu anh em (bộ chọn có ứng viên — câu khác khối bị loại chỉ vì khối).
    d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)').run(TO11, 'A2', 'v1', 'g-A2', 'D2', JSON.stringify(cauJson(A2)))
    d.sql.exec('DELETE FROM game_v2_session')
    vi.setSystemTime(luc('2026-10-09'))
    const r11 = await dao(env)
    expect(r11.questions.map((q: { qid: string }) => q.qid)).toEqual(['A2'])
  })

  it('tờ mang mã khối 11 nhưng cột lớp của tờ ghi 10 (mâu thuẫn) ⇒ không thành câu anh em', async () => {
    const { d, env } = dung([Q2, A2, { ...A2V, maDe: 'DH-11-B2' }], ['Q2'])
    d.sql.exec("UPDATE de_kho SET lop = '10' WHERE ma_de = 'DH-11-B2'")
    ghi(d, 'Q2', 0, luc('2026-10-05', '10:00'))
    ghi(d, 'A2', 1, luc('2026-10-05', '11:00')) // A2 đã gặp hôm qua ⇒ chỉ còn A2V (tờ mâu thuẫn khối)
    vi.setSystemTime(luc('2026-10-06'))
    const r = await dao(env)
    expect(r.questions.map((q: { qid: string }) => q.qid)).toEqual(['Q2'])
    expect(phien(d, r.id).questions[0]).toMatchObject({ qid: 'Q2', xt: expect.any(Array) })
  })
})

describe('tiêu chí 2 · chưa gặp trước; hết thì gặp lâu nhất > 14 ngày; câu thầy chặn trong game không thành câu anh em', () => {
  it('A2 gặp 16 ngày trước ⇒ vẫn là câu anh em khi không còn câu chưa gặp; gặp 5 ngày trước ⇒ không (rơi xuống bản xáo)', async () => {
    for (const [ngayGap, ky] of [['2026-09-20', ['A2']], ['2026-10-01', ['Q2']]] as const) {
      const { d, env } = dung([Q2, A2], ['Q2'])
      ghi(d, 'A2', 1, luc(ngayGap, '10:00'))
      ghi(d, 'Q2', 0, luc('2026-10-05', '10:00'))
      vi.setSystemTime(luc('2026-10-06'))
      const r = await dao(env)
      expect(r.questions.map((q: { qid: string }) => q.qid), `A2 gặp ${ngayGap}`).toEqual([...ky])
    }
  })
  it('chưa gặp xếp trước đã gặp lâu; câu thầy chặn trong game (game_v2_scope) bị bỏ ⇒ câu kế', async () => {
    const { d, env } = dung(KHO2, ['Q2'])
    ghi(d, 'Q2', 0, luc('2026-10-05', '10:00'))
    d.sql.prepare('INSERT INTO game_v2_scope(sbd,json,updated_at) VALUES(?,?,?)').run('S1', JSON.stringify({ enabled: true, types: [], blocked: ['A2'] }), 'x')
    vi.setSystemTime(luc('2026-10-06'))
    const r = await dao(env)
    expect(r.questions.map((q: { qid: string }) => q.qid)).toEqual(['A2V'])
  })
})

describe('tiêu chí 3 · làm đúng câu anh em ⇒ Q tiến y như lượt song sinh, đóng lỗi đúng luật; Câu đã làm / Bảng chiến dịch thấy Q đã sửa', () => {
  it('A2 đúng (06/10) + A2V đúng (08/10, cách lần sai ≥ 3 ngày) ⇒ Q2 đóng lỗi; lịch sử A2 vẫn là của A2', async () => {
    const { d, env } = dung(KHO2, ['Q2'])
    ghi(d, 'Q2', 0, luc('2026-10-05', '10:00'))
    // Ngày 1: câu anh em A2, em làm ĐÚNG.
    vi.setSystemTime(luc('2026-10-06'))
    const r1 = await dao(env)
    expect(r1.questions.map((q: { qid: string }) => q.qid)).toEqual(['A2'])
    const t1 = await em(env, '/game-v2/answer', { session: r1.id, qid: 'A2', answer: dapAnHien(A2, r1.questions[0]) })
    expect(t1.ok, JSON.stringify(t1).slice(0, 300)).toBe(true)
    expect(t1.correct).toBe(true)
    expect(soCua(d, 'A2').map((x) => ({ kq: x.ket_qua, tc: JSON.parse(x.raw_json ?? '{}').tc }))).toEqual([{ kq: 1, tc: 'Q2' }])
    const hs1 = await docHoSo2(env, 'S1', '2026-10-06')
    expect(hs1.loiV2?.get('Q2')).toMatchObject({ trangThai: 'cho_kiem', ngayDung: ['2026-10-06'], daDungSongSinh: true, denHan: '2026-10-08' })
    // Y HỆT một lượt song sinh đúng cùng giờ (phatLaiLoi thuần).
    const nhu = phatLaiLoi([
      { luc: new Date(luc('2026-10-05', '10:00')).toISOString(), ngayVn: '2026-10-05', ketQua: 0, coHoTro: false, songSinh: false, nguon: 'luyen' },
      { luc: soCuaLuc(d, 'A2', 0), ngayVn: '2026-10-06', ketQua: 1, coHoTro: false, songSinh: true, nguon: 'game' },
    ], [], false, '2026-10-06')
    expect(hs1.loiV2?.get('Q2')).toEqual(nhu)
    // Lịch sử của chính A2: một lần làm của A2 (không phải song sinh).
    expect((await docLanLam(env, 'S1', ['A2'])).map((x) => ({ qid: x.qid, dung: x.dung, songSinh: !!x.songSinh }))).toEqual([{ qid: 'A2', dung: true, songSinh: false }])
    // Hôm nay Q2 đã làm (qua câu anh em) ⇒ hết việc Đảo hôm nay.
    const het = await dao(env)
    expect(het.questions).toEqual([])
    // Ngày 3 (08/10): chờ kiểm tới hạn ⇒ câu anh em KHÁC (A2 vừa gặp 2 ngày trước) — A2V mức kề.
    vi.setSystemTime(luc('2026-10-08'))
    const r3 = await dao(env)
    expect(r3.questions.map((q: { qid: string }) => q.qid)).toEqual(['A2V'])
    khongLoDapAn(r3)
    const t3 = await em(env, '/game-v2/answer', { session: r3.id, qid: 'A2V', answer: dapAnHien(A2V, r3.questions[0]) })
    expect(t3.correct).toBe(true)
    const hs3 = await docHoSo2(env, 'S1', '2026-10-08')
    expect(hs3.loiV2?.get('Q2')).toMatchObject({ trangThai: 'dong', dongNgay: '2026-10-08', denHan: '2026-10-22' })
    expect(hs3.tt.get('Q2')).toMatchObject({ thanhThao: true })
    // Câu đã làm (app em): Q2 thành thạo.
    const cdl = await em(env, '/game-v2/hoa2-cau-da-lam')
    expect(cdl.ok, JSON.stringify(cdl).slice(0, 300)).toBe(true)
    expect(cdl.cau.find((c: { qid: string }) => c.qid === 'Q2')).toMatchObject({ trangThai: 'thanh_thao' })
    // Bảng chiến dịch (thầy): em S1 có 1 câu thành thạo.
    const bang = await thay(env, '/gv/chien-dich', { action: 'bang', id: 'CD1' })
    expect(bang.ok, JSON.stringify(bang).slice(0, 300)).toBe(true)
    expect(bang.em.find((x: { sbd: string }) => x.sbd === 'S1')).toMatchObject({ thanhThao: 1 })
  })
})

/** Mốc ISO của dòng sổ game thứ i của câu. */
function soCuaLuc(d: D1That, qid: string, i: number): string {
  return (d.sql.prepare("SELECT luc FROM su_kien_hoc WHERE sbd = 'S1' AND qid = ? AND nguon = 'game' ORDER BY luc").all(qid) as { luc: string }[])[i]!.luc
}

// ───────────────────────── Đoàn Hộ Tống (câu ôn Phần I/III) ─────────────────────────
/** Mở chặng Đoàn MỘT MÌNH qua Worker, chờ đếm ngược, xem câu riêng của hiệp 1. */
async function moDoan(env: Env) {
  const mo = await em(env, '/game-v2/doan-mo', {})
  expect(mo.ok, JSON.stringify(mo).slice(0, 400)).toBe(true)
  const ma = String(mo.doan.ma)
  vi.setSystemTime(Date.now() + DEM_NGUOC_MS + 500)
  const xem = await em(env, '/game-v2/doan-xem', { ma })
  expect(xem.ok, JSON.stringify(xem).slice(0, 400)).toBe(true)
  return { ma, xem, cau: xem.doan.cau as { qid: string; de: { qid: string; text: string; choices: string[]; ideas: string[] } } }
}
const nopDoan = (env: Env, ma: string, hiep: number, answer: string) => em(env, '/game-v2/doan-nop', { ma, hiep, answer, hanhDong: 'danh' })
const Q1: CauThu = { qid: 'Q1', maDe: TO11, phan: 'I', dang: 'D1', mucDo: 'TH', correct: 'B' }
const A1: CauThu = { qid: 'A1', maDe: TO11, phan: 'I', dang: 'D1', mucDo: 'TH', correct: 'C' }
const L10I: CauThu = { qid: 'L10I', maDe: TO10, phan: 'I', dang: 'D1', mucDo: 'TH', correct: 'A' }

describe('tiêu chí 2 + 4 · Đoàn: câu sai Phần I ⇒ câu anh em; không có ⇒ BẢN XÁO chấm đúng thứ tự đã xáo', () => {
  it('câu anh em A1 ở Đoàn (không lộ đáp án), nộp đúng ⇒ sổ ghi dưới A1 kèm tc = Q1', async () => {
    const { d, env } = dung([Q1, A1, L10I], ['Q1'])
    ghi(d, 'Q1', 0, luc('2026-10-05', '10:00'))
    vi.setSystemTime(luc('2026-10-06'))
    expect((await dao(env)).lyDo).toBe('khoa_cho_doan') // câu ôn Phần I nằm ở Đoàn
    const { ma, xem, cau } = await moDoan(env)
    expect(cau.qid).toBe('A1')
    expect(cau.de.choices).toEqual(['A', 'B', 'C', 'D'].map((k) => PA('A1', k)))
    khongLoDapAn(xem)
    expect(JSON.stringify(xem)).not.toContain('Q1')
    const nop = await nopDoan(env, ma, xem.doan.tran.hiep, dapAnHien(A1, cau.de))
    expect(nop.ok, JSON.stringify(nop).slice(0, 300)).toBe(true)
    expect(nop.ketQuaCau.correct).toBe(true)
    expect(soCua(d, 'A1').map((x) => ({ kq: x.ket_qua, tc: JSON.parse(x.raw_json ?? '{}').tc }))).toEqual([{ kq: 1, tc: 'Q1' }])
    expect(soCua(d, 'Q1')).toEqual([])
    expect((await docHoSo2(env, 'S1', '2026-10-06')).loiV2?.get('Q1')).toMatchObject({ trangThai: 'cho_kiem', daDungSongSinh: true })
  })

  it('không câu anh em (chỉ có câu khối 10) ⇒ Q1 BẢN XÁO: phương án đổi chỗ, chữ đáp án đổi; nộp theo thứ tự đã xáo ⇒ đúng; sổ ghi đáp án quy về khung gốc + xt', async () => {
    const { d, env } = dung([Q1, L10I], ['Q1'])
    ghi(d, 'Q1', 0, luc('2026-10-05', '10:00'))
    vi.setSystemTime(luc('2026-10-06'))
    const { ma, xem, cau } = await moDoan(env)
    expect(cau.qid).toBe('Q1')
    const goc = ['A', 'B', 'C', 'D'].map((k) => PA('Q1', k))
    expect(cau.de.choices).not.toEqual(goc)
    expect([...cau.de.choices].sort()).toEqual([...goc].sort())
    const chu = dapAnHien(Q1, cau.de)
    expect(chu).not.toBe('B') // chữ cái em nhớ ("B") không còn đúng
    khongLoDapAn(xem)
    const nop = await nopDoan(env, ma, xem.doan.tran.hiep, chu)
    expect(nop.ketQuaCau.correct).toBe(true)
    expect(nop.ketQuaCau.answer).toBe(chu) // sau khi nộp: đáp án theo đúng thứ tự em thấy
    const so = soCua(d, 'Q1')
    expect(so.length).toBe(1)
    expect(so[0]!.ket_qua).toBe(1)
    expect(JSON.parse(so[0]!.raw_json!)).toMatchObject({ chon: 'B', xt: 1 })
    const att = JSON.parse((d.sql.prepare("SELECT json FROM game_v2_attempt WHERE sbd = 'S1' AND qid = 'Q1'").get() as { json: string }).json)
    expect(att).toMatchObject({ traLoi: chu, traLoiGoc: 'B', correct: true })
  })
})

describe('tiêu chí 4 · Đảo Phần II bản xáo: ý đổi chỗ, MẪU Đ/S đổi, chấm đúng theo thứ tự đã xáo, sổ quy về khung gốc', () => {
  it('mẫu em nhớ (DSSD) không còn đúng; nộp theo thứ tự đã xáo ⇒ đúng; phát lại (resume) y hệt; sổ chon = DSSD + xt', async () => {
    const { d, env } = dung([Q2, ...KHAC_KHOI], ['Q2'])
    ghi(d, 'Q2', 0, luc('2026-10-05', '10:00'))
    vi.setSystemTime(luc('2026-10-06'))
    const r = await dao(env)
    expect(r.questions.map((q: { qid: string }) => q.qid)).toEqual(['Q2'])
    const de = r.questions[0] as { ideas: string[] }
    const mau = dapAnHien(Q2, de)
    expect(mau).not.toBe('DSSD')
    khongLoDapAn(r)
    const lai = await em(env, '/game-v2/resume', {})
    expect(lai.id).toBe(r.id)
    expect(lai.questions[0].ideas).toEqual(de.ideas)
    khongLoDapAn(lai)
    const t = await em(env, '/game-v2/answer', { session: r.id, qid: 'Q2', answer: mau })
    expect(t.ok, JSON.stringify(t).slice(0, 300)).toBe(true)
    expect(t.correct).toBe(true)
    expect(t.answer).toBe(mau) // sau khi nộp: đáp án theo đúng thứ tự em thấy
    expect(JSON.parse(soCua(d, 'Q2')[0]!.raw_json!)).toMatchObject({ chon: 'DSSD', xt: 1 })
    expect((await docHoSo2(env, 'S1', '2026-10-06')).loiV2?.get('Q2')).toMatchObject({ trangThai: 'cho_kiem', ngayDung: ['2026-10-06'], daDungSongSinh: false })
  })
})

describe('tiêu chí 1 · bậc 1 song sinh: 4 bản xoay đủ 4; lượt chờ kiểm sau khi đã đúng song sinh vẫn là song sinh (bản kế)', () => {
  const Q3: CauThu = { qid: 'Q3', maDe: TO11, phan: 'I', dang: 'D3', mucDo: 'TH', correct: 'B' }
  const SS = [0, 1, 2, 3].map((i) => ({ de: `Song sinh ${i}: tính m`, pa: { A: `${i}1`, B: `${i}2`, C: `${i}3`, D: `${i}4` }, dap_an: 'ABCD'[i]!, buoc: ['n = 0,1'], gia_tri_dung: `${i}` }))
  async function dungSS(soBan: number, cd = ['Q3']) {
    const r = dung([Q3], cd)
    await damBaoBangLoiGiai(r.env); await damBaoBangBoTro(r.env)
    r.d.sql.prepare("INSERT INTO loi_giai_cau(qid,bam,ma_de,dang,cap_nhat_luc) VALUES('Q3','BAM3',?,'tn','x')").run(TO11)
    r.d.sql.prepare("INSERT INTO cau_bo_tro(bam,qid_mau,song_sinh_json,cau_kiem_json,nhan_nen_json,buoc_json,cap_nhat_luc) VALUES('BAM3','Q3',?,'[]','[]','[]','x')").run(JSON.stringify(SS.slice(0, soBan)))
    return r
  }
  it('4 bản ⇒ xoay đủ 4 rồi quay vòng: ~ss0 → ~ss1 → ~ss2 → ~ss3 → ~ss0 (Đoàn, đề của chính bản song sinh, không lộ đáp án)', async () => {
    // Đúng / sai xen kẽ (≤ 3 lần sai — sai lần 4 thì srs2 "cần thầy dạy lại" bỏ câu khỏi kế hoạch, luật cũ giữ nguyên).
    // Lượt chờ kiểm (08/10, 11/10) sau khi đã đúng song sinh: luật 02/10 cho câu gốc nguyên văn — nay là bản song sinh KẾ.
    const { d, env } = await dungSS(4)
    ghi(d, 'Q3', 0, luc('2026-10-05', '10:00'))
    const thay: string[] = []
    for (const [ngay, dung] of [['2026-10-06', true], ['2026-10-08', false], ['2026-10-09', true], ['2026-10-11', false], ['2026-10-12', true]] as const) {
      vi.setSystemTime(luc(ngay))
      const { ma, xem, cau } = await moDoan(env)
      thay.push(cau.qid)
      const i = Number(cau.qid.split('~ss')[1])
      expect(cau.de.text).toBe(`Song sinh ${i}: tính m`)
      expect(cau.de.choices).toEqual(['A', 'B', 'C', 'D'].map((k) => SS[i]!.pa[k as 'A']))
      khongLoDapAn(xem)
      const chon = dung ? SS[i]!.dap_an : 'ABCD'[('ABCD'.indexOf(SS[i]!.dap_an) + 1) % 4]!
      expect((await nopDoan(env, ma, xem.doan.tran.hiep, chon)).ketQuaCau.correct).toBe(dung)
    }
    expect(thay).toEqual(['Q3~ss0', 'Q3~ss1', 'Q3~ss2', 'Q3~ss3', 'Q3~ss0'])
    expect(soCua(d, 'Q3')).toEqual([]) // câu gốc Q3 chưa lần nào ra nguyên văn trong cửa sổ lỗi
  })
  it('Đảo (em chỉ chơi Đảo ⇒ câu ôn Phần I vào Đảo): lượt làm lại là song sinh ~ss0, đề của song sinh, không lộ đáp án; Q3 nguyên văn không ra', async () => {
    const { d, env } = await dungSS(4)
    // Nhịp kênh: 7 ngày qua em chỉ mở chuyến Đảo (không Đoàn) ⇒ kế hoạch đưa câu ôn Phần I/III vào Đảo (ca-nhan-hoa-v2 onVaoDaoRieng).
    d.sql.prepare('INSERT INTO game_v2_session(id,sbd,json,created_at) VALUES(?,?,?,?)').run('CU1', 'S1', JSON.stringify({ mode: 'adventure', created: luc('2026-10-04'), hoa2: 1, questions: [] }), new Date(luc('2026-10-04')).toISOString())
    ghi(d, 'Q3', 0, luc('2026-10-05', '10:00'))
    vi.setSystemTime(luc('2026-10-06'))
    const r = await dao(env)
    expect(r.ok, JSON.stringify(r).slice(0, 300)).toBe(true)
    expect(r.questions.map((q: { qid: string }) => q.qid)).toEqual(['Q3~ss0'])
    expect(r.questions[0]).toMatchObject({ vai: 'on_lai', text: 'Song sinh 0: tính m', choices: ['01', '02', '03', '04'] })
    khongLoDapAn(r)
    const t = await em(env, '/game-v2/answer', { session: r.id, qid: 'Q3~ss0', answer: 'A' })
    expect(t.correct).toBe(true)
    expect(soCua(d, 'Q3~ss0').length).toBe(1)
  })
  it('đúng song sinh ~ss0 (06/10) ⇒ lượt chờ kiểm 08/10 là ~ss1, KHÔNG phải câu gốc nguyên văn; tắt khoá lam_lai_khac ⇒ câu gốc như hôm nay', async () => {
    for (const tat of [false, true]) {
      const { d, env } = await dungSS(2)
      if (tat) d.sql.exec(`INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('lam_lai_khac','{"bat":false}','x')`)
      xoaDemCauHinh(env)
      ghi(d, 'Q3', 0, luc('2026-10-05', '10:00'))
      vi.setSystemTime(luc('2026-10-06'))
      const n1 = await moDoan(env)
      expect(n1.cau.qid).toBe('Q3~ss0')
      expect((await nopDoan(env, n1.ma, n1.xem.doan.tran.hiep, 'A')).ketQuaCau.correct).toBe(true)
      vi.setSystemTime(luc('2026-10-08'))
      const n3 = await moDoan(env)
      expect(n3.cau.qid, tat ? 'khoá tắt' : 'khoá bật').toBe(tat ? 'Q3' : 'Q3~ss1')
      if (tat) expect(n3.cau.de.choices).toEqual(['A', 'B', 'C', 'D'].map((k) => PA('Q3', k))) // y hệt hôm nay: nguyên văn
    }
  })
})

describe('tiêu chí 5 · tắt khoá lam_lai_khac ⇒ y hệt hôm nay', () => {
  it('Đảo phát Q2 nguyên văn đúng thứ tự gốc, phiên và sổ không có khoá làm lại nào', async () => {
    const { d, env } = dung(KHO2, ['Q2'])
    d.sql.exec(`INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('lam_lai_khac','{"bat":false}','x')`)
    xoaDemCauHinh(env)
    ghi(d, 'Q2', 0, luc('2026-10-05', '10:00'))
    vi.setSystemTime(luc('2026-10-06'))
    const r = await dao(env)
    expect(r.questions.map((q: { qid: string }) => q.qid)).toEqual(['Q2'])
    expect(r.questions[0].ideas).toEqual([0, 1, 2, 3].map((i) => Y('Q2', i)))
    khongLoDapAn(r)
    const ref = phien(d, r.id).questions[0]!
    for (const k of ['tc', 'xt', 'nv']) expect(k in ref, `phiên có khoá ${k}`).toBe(false)
    const t = await em(env, '/game-v2/answer', { session: r.id, qid: 'Q2', answer: 'DSSD' })
    expect(t.correct).toBe(true)
    expect('traLoiGoc' in t).toBe(false)
    expect(JSON.parse(soCua(d, 'Q2')[0]!.raw_json!)).toEqual({ ht_cau_version:'v1', chon: 'DSSD' })
    // Bật lại (xoá dòng khoá) ⇒ câu anh em ngay ngày kế.
    d.sql.exec("DELETE FROM cau_hinh WHERE khoa = 'lam_lai_khac'")
    xoaDemCauHinh(env)
    ghi(d, 'Q2', 0, luc('2026-10-06', '20:00'))
    vi.setSystemTime(luc('2026-10-07'))
    expect((await dao(env)).questions.map((q: { qid: string }) => q.qid)).toEqual(['A2'])
  })
})

describe('Q nguyên văn KHÔNG xuất hiện trong cửa sổ lỗi khi còn bậc 1–3 · Phần III không bản khác ⇒ nguyên văn có đếm', () => {
  it('sai liên tiếp 4 ngày ở Đảo: mọi câu lỗi được phát đều là câu anh em hoặc bản xáo, không lượt nào nguyên văn', async () => {
    const { d, env } = dung(KHO2, ['Q2'])
    ghi(d, 'Q2', 0, luc('2026-10-05', '10:00'))
    const daPhat: Record<string, unknown>[] = []
    for (const ngay of ['2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09']) {
      vi.setSystemTime(luc(ngay))
      for (let luot = 0; luot < 3; luot++) {
        const r = await dao(env)
        if (!r.questions?.length) break
        khongLoDapAn(r)
        const refs = phien(d, r.id).questions
        for (const [i, q] of (r.questions as { qid: string; ideas: string[] }[]).entries()) {
          const ref = refs[i]!
          daPhat.push({ ngay, ...ref })
          // Cố tình SAI mọi câu ⇒ câu lỗi mở lại, câu anh em sai cũng thành lỗi của chính nó.
          const c = KHO2.find((x) => x.qid === q.qid)!
          const dung = dapAnHien(c, q)
          await em(env, '/game-v2/answer', { session: r.id, qid: q.qid, answer: dung.split('').map((x) => (x === 'D' ? 'S' : 'D')).join('') })
        }
      }
    }
    expect(daPhat.length).toBeGreaterThanOrEqual(4)
    for (const x of daPhat) {
      expect(x.nv, JSON.stringify(x)).toBeUndefined() // Phần II luôn còn bậc 2/3 ⇒ không lượt nguyên văn
      expect(!!x.tc || Array.isArray(x.xt), JSON.stringify(x)).toBe(true)
    }
    // Không một lượt nào phát Q2 đúng thứ tự gốc.
    expect(daPhat.filter((x) => x.qid === 'Q2' && !x.xt)).toEqual([])
  })

  it('Phần III không song sinh, không câu anh em ⇒ nguyên văn (bậc 4) mang nv = 1 trong phiên và sổ', async () => {
    const Q5: CauThu = { qid: 'Q5', maDe: TO11, phan: 'III', dang: 'D5', mucDo: 'TH', correct: '4,5' }
    const { d, env } = dung([Q5], ['Q5'])
    ghi(d, 'Q5', 0, luc('2026-10-05', '10:00'))
    vi.setSystemTime(luc('2026-10-06'))
    const { ma, xem, cau } = await moDoan(env)
    expect(cau.qid).toBe('Q5')
    khongLoDapAn(xem)
    const ref = (JSON.parse((d.sql.prepare("SELECT json FROM game_v2_session WHERE sbd = 'S1' ORDER BY created_at DESC LIMIT 1").get() as { json: string }).json) as { questions: Record<string, unknown>[] }).questions[0]!
    expect(ref).toMatchObject({ qid: 'Q5', nv: 1 })
    await nopDoan(env, ma, xem.doan.tran.hiep, '4,5')
    expect(JSON.parse(soCua(d, 'Q5')[0]!.raw_json!)).toMatchObject({ chon: '4,5', nv: 1 })
  })
})

describe('sổ "thay cho" (tc) đọc theo chỉ mục — không quét mọi dòng của em', () => {
  it('docLanLam / lanLamCaLop: nhánh qid đi chỉ mục (sbd, qid), nhánh tc đi idx_skh_em_tc (migration-lam-lai-0510.sql)', () => {
    const d = taoD1That()
    const ke = (sql: string, ...b: string[]) => (d.sql.prepare(`EXPLAIN QUERY PLAN ${sql}`).all(...b) as { detail: string }[]).map((x) => x.detail)
    for (const ds of [
      ke(sqlQidHoacTc('qid, ngay_vn, luc, ket_qua, assistance, visibility, nguon', 'sbd = ?1', `luc >= ?4 AND ${SQL_LA_LAN_LAM}`), 'S1', '["Q"]', '["Q"]', ''),
      ke(sqlQidHoacTc('sbd, qid, ngay_vn, luc, ket_qua, assistance, visibility, nguon', 'sbd IN (SELECT value FROM json_each(?1))'), '["S1"]', '["Q"]', '["Q"]'),
    ]) {
      const tim = ds.filter((x) => /su_kien_hoc/.test(x))
      expect(tim.length, JSON.stringify(ds)).toBe(2)
      expect(tim[0]).toMatch(/USING (COVERING )?INDEX idx_skh_em_qid\w* \(sbd=\? AND qid=\?\)/)
      expect(tim[1]).toMatch(/USING INDEX idx_skh_em_tc \(sbd=\? AND <expr>=\?\)/)
    }
  })
})

describe('tiêu chí 3 · Bàn gỡ nút thắt của thầy: em sửa bằng câu anh em ⇒ thẻ rời bàn; sai câu anh em sau lời gỡ ⇒ kèm riêng', () => {
  async function dungThe(trangThai: 'cho' | 'da_go') {
    const r = dung(KHO2, ['Q2'])
    await damBaoBangLoiGiai(r.env); await damBaoBangBoTro(r.env); await damBaoBangNutThat(r.env)
    r.d.sql.prepare("INSERT INTO loi_giai_cau(qid,bam,ma_de,dang,cap_nhat_luc) VALUES('Q2','BAMQ2',?,'ds','x')").run(TO11)
    r.d.sql.prepare("INSERT INTO cau_bo_tro(bam,qid_mau,song_sinh_json,cau_kiem_json,nhan_nen_json,buoc_json,cap_nhat_luc) VALUES('BAMQ2','Q2','[]','[]','[]','[\"Bước 1\"]','x')").run()
    if (trangThai === 'da_go') r.d.sql.prepare("INSERT INTO loi_go(id,bam,buoc,kieu,noi_dung,luc) VALUES('G1','BAMQ2',0,'ngan','Gỡ','2026-10-06T00:00:00.000Z')").run()
    r.d.sql.prepare('INSERT INTO nut_that(id,sbd,qid,bam,buoc,viet,bang_chung_json,gui_luc,ngay_vn,trang_thai,go_id,cap_nhat_luc) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)')
      .run('T1', 'S1', 'Q2', 'BAMQ2', 0, '', '{}', '2026-10-05T12:00:00.000Z', '2026-10-05', trangThai, trangThai === 'da_go' ? 'G1' : null, '2026-10-05T12:00:00.000Z')
    ghi(r.d, 'Q2', 0, luc('2026-10-05', '10:00'))
    return r
  }
  const ghiTc = (d: D1That, qid: string, kq: 0 | 1, ms: number) => d.sql.prepare('INSERT INTO su_kien_hoc(khoa,sbd,qid,nguon,ma_nguon,lan,ket_qua,luc,ngay_vn,assistance,raw_json) VALUES(?,?,?,?,?,1,?,?,?,?,?)')
    .run(`game|S1|${qid}|${ms}`, 'S1', qid, 'game', `P-${ms}`, kq, new Date(ms).toISOString(), ngayVnCua(ms), 'none', JSON.stringify({ chon: 'DSDS', tc: 'Q2' }))
  it('A2 đúng 06/10 + A2V đúng 08/10 (thay cho Q2) ⇒ lỗi Q2 đóng ⇒ thẻ "xong", thầy không phải chữa', async () => {
    const { d, env } = await dungThe('cho')
    ghiTc(d, 'A2', 1, luc('2026-10-06'))
    ghiTc(d, 'A2V', 1, luc('2026-10-08'))
    vi.setSystemTime(luc('2026-10-08', '12:00'))
    const r = await thay(env, '/gv/nut-that/ds', {})
    expect(r.ok, JSON.stringify(r).slice(0, 300)).toBe(true)
    expect((d.sql.prepare("SELECT trang_thai FROM nut_that WHERE id = 'T1'").get() as { trang_thai: string }).trang_thai).toBe('xong')
  })
  it('sau lời gỡ em sai câu anh em 2 lần (thay cho Q2) ⇒ thẻ "kèm riêng"', async () => {
    const { d, env } = await dungThe('da_go')
    ghiTc(d, 'A2', 0, luc('2026-10-06'))
    ghiTc(d, 'A2V', 0, luc('2026-10-07'))
    vi.setSystemTime(luc('2026-10-07', '12:00'))
    await thay(env, '/gv/nut-that/ds', {})
    expect((d.sql.prepare("SELECT trang_thai FROM nut_that WHERE id = 'T1'").get() as { trang_thai: string }).trang_thai).toBe('kem_rieng')
  })
})

describe('thang tự gỡ của em: lượt câu anh em sau khi đọc lời giải = "làm lại kín" (như song sinh)', () => {
  async function dungThang() {
    const r = dung(KHO2, ['Q2'])
    await damBaoBangLoiGiai(r.env); await damBaoBangBoTro(r.env); await damBaoBangNutThat(r.env)
    r.d.sql.prepare("INSERT INTO loi_giai_cau(qid,bam,ma_de,dang,cap_nhat_luc) VALUES('Q2','BAMQ2',?,'ds','x')").run(TO11)
    r.d.sql.prepare("INSERT INTO cau_bo_tro(bam,qid_mau,song_sinh_json,cau_kiem_json,nhan_nen_json,buoc_json,cap_nhat_luc) VALUES('BAMQ2','Q2','[]','[]','[]','[\"Bước 1\",\"Bước 2\"]','x')").run()
    ghi(r.d, 'Q2', 0, luc('2026-10-05', '08:00'))
    r.d.sql.prepare("INSERT INTO loi_giai_hoi(sbd,qid,nguon,luc,co_ho_so) VALUES('S1','Q2','on_lai',?,1)").run(new Date(luc('2026-10-05', '09:00')).toISOString())
    return r
  }
  const ghiTc = (d: D1That, qid: string, kq: 0 | 1, ms: number) => d.sql.prepare('INSERT INTO su_kien_hoc(khoa,sbd,qid,nguon,ma_nguon,lan,ket_qua,luc,ngay_vn,assistance,raw_json) VALUES(?,?,?,?,?,1,?,?,?,?,?)')
    .run(`game|S1|${qid}|${ms}`, 'S1', qid, 'game', `P-${ms}`, kq, new Date(ms).toISOString(), ngayVnCua(ms), 'none', JSON.stringify({ chon: 'DSDS', tc: 'Q2' }))
  const lamLai = async (env: Env) => ((await em(env, '/hs/thang-go', { qid: 'Q2' })).cong as { ma: string; dat: boolean; viec: string }[]).find((c) => c.ma === 'lam_lai')
  it('2 lượt câu anh em sau khi đọc (1 sai) ⇒ [3] đạt; cả 2 đúng ⇒ "chưa cần gửi thầy"', async () => {
    const { d, env } = await dungThang()
    vi.setSystemTime(luc('2026-10-07'))
    expect(await lamLai(env)).toMatchObject({ dat: false })
    ghiTc(d, 'A2', 0, luc('2026-10-06'))
    ghiTc(d, 'A2V', 1, luc('2026-10-06', '20:00'))
    expect(await lamLai(env)).toMatchObject({ dat: true })
    d.sql.exec("UPDATE su_kien_hoc SET ket_qua = 1 WHERE qid = 'A2'")
    expect(await lamLai(env)).toMatchObject({ dat: false, viec: 'Em đã làm đúng câu tương tự, chưa cần gửi thầy' })
  })
})

describe('tự hoàn thiện hằng tuần: lượt kiểm duy trì làm bằng câu anh em được đếm cho câu gốc', () => {
  it('Q2 đóng lỗi nhờ 2 câu anh em; kiểm duy trì (≥ 14 ngày) bằng câu anh em SAI ⇒ kiem 1, saiLai 1', async () => {
    const { d, env } = dung(KHO2, ['Q2'])
    const ghiTc = (qid: string, kq: 0 | 1, ms: number) => d.sql.prepare('INSERT INTO su_kien_hoc(khoa,sbd,qid,nguon,ma_nguon,lan,ket_qua,luc,ngay_vn,assistance,raw_json) VALUES(?,?,?,?,?,1,?,?,?,?,?)')
      .run(`game|S1|${qid}|${ms}`, 'S1', qid, 'game', `P-${ms}`, kq, new Date(ms).toISOString(), ngayVnCua(ms), 'none', JSON.stringify({ tc: 'Q2' }))
    ghi(d, 'Q2', 0, luc('2026-10-05', '10:00'))
    ghiTc('A2', 1, luc('2026-10-06'))
    ghiTc('A2V', 1, luc('2026-10-08'))
    ghiTc('A2G', 0, luc('2026-10-23'))
    const kq = await chayTuHoanThien(env, luc('2026-10-26'))
    expect(kq).toMatchObject({ chay: true, kiem: 1, saiLai: 1 })
  })
})

describe('OMNI bật: thang làm lại vẫn chạy; bản xáo Phần II ghi kết quả TỪNG Ý theo khung gốc', () => {
  it('Đảo: Q2 không ra nguyên văn; nộp bản xáo ⇒ answer có omni, sổ subitem theo thứ tự ý GỐC', async () => {
    const { d, env } = dung([Q2, ...KHAC_KHOI], ['Q2'])
    d.sql.exec(`INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('omni','{"bat":true,"lop":[],"sbd":[]}','x')`)
    xoaDemCauHinh(env)
    ghi(d, 'Q2', 0, luc('2026-10-05', '10:00'))
    vi.setSystemTime(luc('2026-10-06'))
    const r = await dao(env)
    expect(r.ok, JSON.stringify(r).slice(0, 300)).toBe(true)
    const i = (r.questions as { qid: string }[]).findIndex((q) => q.qid === 'Q2')
    expect(i).toBeGreaterThanOrEqual(0)
    const de = r.questions[i] as { ideas: string[] }
    expect(de.ideas).not.toEqual([0, 1, 2, 3].map((k) => Y('Q2', k)))
    khongLoDapAn(r)
    // Em đúng ý 1 và ý 4 của câu GỐC, sai ý 2, 3 (chọn ngược) — gửi theo thứ tự đang hiện.
    const gocChon = 'DDDD' // gốc DSSD ⇒ đúng ý 1, 4; sai ý 2, 3
    const hien = de.ideas.map((y) => gocChon[[0, 1, 2, 3].find((k) => Y('Q2', k) === y)!]!).join('')
    const t = await em(env, '/game-v2/answer', { session: r.id, qid: 'Q2', answer: hien, msLam: 60_000, tuTin: 'chac' })
    expect(t.ok, JSON.stringify(t).slice(0, 300)).toBe(true)
    expect(t.correct).toBe(false)
    expect('omni' in t).toBe(true)
    const so = d.sql.prepare("SELECT raw_json, subitem_json FROM su_kien_hoc WHERE sbd = 'S1' AND qid = 'Q2' AND nguon = 'game'").get() as { raw_json: string; subitem_json: string | null }
    expect(JSON.parse(so.raw_json)).toMatchObject({ chon: 'DDDD', xt: 1 })
    expect(JSON.parse(so.subitem_json ?? 'null')).toEqual([1, 0, 0, 1])
  })
})
