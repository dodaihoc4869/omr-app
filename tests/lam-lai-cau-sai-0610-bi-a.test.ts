// @vitest-environment node
// LÀM LẠI CÂU SAI BẰNG BẢN KHÁC · BI-A (làn A', 06/10) — nghiệm thu trên D1 THẬT (node:sqlite, đủ migration), mọi lệnh đi qua đúng đường Worker thật.
// Đặc tả: DE-XUAT-LAM-LAI-CAU-SAI-0510.md (thang 4 bậc) + yêu cầu 06/10: câu LỖI quay lại trong Bi-a cũng qua thang (song sinh → câu anh em ĐÚNG KHỐI → bản xáo → nguyên văn),
// còn luật trần 40% / rải đều / Câu chốt của Bi-a giữ nguyên (chọn câu xong mới thay NỘI DUNG câu đã chiếm chỗ). Hàm thang ở cau-anh-em.ts (không viết lại).
// Kho thử: tờ khối 11 của chiến dịch (Q1..Q20), tờ khối 11 khác (anh em hợp lệ), tờ khối 10, khối 12, tờ KHÔNG rõ khối — CÙNG dạng, cùng mức, chưa gặp, nằm TRONG phạm vi
// đã dạy của lớp (một bài tick gồm cả năm tờ) ⇒ chỉ luật khối chặn được câu khác khối.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import worker from '../server/src/index'
import { goiWorker, taoD1That, type D1That } from './_d1-that'
import { gameToken } from '../server/src/game-v2-auth'
import { xoaDemCaBaoVe } from '../server/src/game-v2-bank'
import { xoaDemCauHinh } from '../server/src/cau-hinh-dem'
import { xoaDemPhamVi } from '../server/src/bai-da-day'
import { LENH_TAO_BANG_TUY_CHON, xoaDemChienDich } from '../server/src/srs2-d1'
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

// Chiến dịch: Q1..Q20 (Phần I, dạng D1, mức TH). Q3, Q5 là câu em sai hôm qua (câu LỖI). Anh em hợp lệ: S1, S2 (tờ B, khối 11, cùng dạng, cùng mức, KHÁC nhóm nội dung).
const Q = Array.from({ length: 20 }, (_, i): CauThu => ({ qid: `Q${i + 1}`, maDe: TO_A, dang: 'D1', mucDo: 'TH', correct: 'B' }))
const ANH_EM: CauThu[] = [
  { qid: 'S1', maDe: TO_B, dang: 'D1', mucDo: 'TH', correct: 'C' },
  { qid: 'S2', maDe: TO_B, dang: 'D1', mucDo: 'TH', correct: 'D' },
]
const KHAC_KHOI: CauThu[] = [
  { qid: 'L10', maDe: TO10, dang: 'D1', mucDo: 'TH', correct: 'A' },
  { qid: 'L12', maDe: TO12, dang: 'D1', mucDo: 'TH', correct: 'A' },
  { qid: 'LX', maDe: TOX, dang: 'D1', mucDo: 'TH', correct: 'A' },
]
const SAI = ['Q3', 'Q5']

/** Em S1 lớp 11A1 (khối 11), Game Hóa 2.0 + Bi-a bật, phạm vi đã dạy = mọi tờ của kho; chiến dịch CD1 (rải đều TẮT ⇒ kế hoạch đổ đầy thể lực) gồm Q1..Q20. */
function dung(kho: CauThu[]): { d: D1That; env: Env } {
  const d = taoD1That()
  const env = d.env as unknown as Env
  d.sql.exec("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES('S1','Nguyễn An','11A1','mk1','x')")
  d.sql.exec(`INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('game_hoa_2','{"bat":true,"lop":["11A1"]}','x'),('bi_a','{"bat":true}','x')`)
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
    .run(JSON.stringify([TO_A]), JSON.stringify(Q.map((c) => c.qid)))
  d.sql.exec(LENH_TAO_BANG_TUY_CHON)
  d.sql.exec("INSERT INTO chien_dich_tuy_chon(id,rai_deu,cap_nhat_luc) VALUES('CD1',0,'x')")
  return { d, env }
}
/** Một lượt TỰ LÀM của S1 (sổ chuẩn). */
function ghi(d: D1That, qid: string, kq: 0 | 1, ms: number, nguon = 'luyen') {
  d.sql.prepare('INSERT INTO su_kien_hoc(khoa,sbd,qid,nguon,ma_nguon,lan,ket_qua,luc,ngay_vn,assistance) VALUES(?,?,?,?,?,1,?,?,?,?)')
    .run(`${nguon}|S1|${qid}|${ms}`, 'S1', qid, nguon, `M-${ms}`, kq, new Date(ms).toISOString(), ngayVnCua(ms), 'none')
}
const em = async (env: Env, duong: string, b: Record<string, unknown> = {}) => goiWorker(worker, env, duong, { token: await gameToken(env, 'S1'), ...b })
const phien = (d: D1That, id: string) => JSON.parse((d.sql.prepare('SELECT json FROM game_v2_session WHERE id = ?').get(id) as { json: string }).json) as { questions: Record<string, unknown>[] }
const soCua = (d: D1That, qid: string) => d.sql.prepare("SELECT qid, ket_qua, ngay_vn, raw_json FROM su_kien_hoc WHERE sbd = 'S1' AND qid = ? AND nguon = 'game' ORDER BY luc").all(qid) as { qid: string; ket_qua: number; ngay_vn: string; raw_json: string | null }[]
/** Không khoá nào của đáp án / lời giải / khoá làm lại nội bộ trong phản hồi. */
function khongLoDapAn(r: unknown) {
  const s = JSON.stringify(r)
  for (const k of ['"correct"', '"solution"', '"answer"', '"dapAn"', '"tc"', '"xt"', '"nv"', '"traLoiGoc"']) expect(s, `phản hồi lộ ${k}`).not.toContain(k)
}
type CauBan = { qid: string; choices: string[] }
const trenBan = (b: { bi: CauBan[]; chot: CauBan | null }): CauBan[] => [...(b.chot ? [b.chot] : []), ...b.bi]
const dapAnHien = (c: CauThu, de: { choices: string[] }): string => 'ABCD'[de.choices.indexOf(PA(c.qid, c.correct))]!
const xepBan = (env: Env, b: Record<string, unknown> = {}) => em(env, '/game-v2/bia-xep-ban', { loai: 'ai', cheDo: 'don', soBi: 7, ...b })

beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); xoaDemCaBaoVe(); xoaDemChienDich(); xoaDemPhamVi() })
afterEach(() => vi.useRealTimers())

async function banMoi(kho: CauThu[], tuyChon: { soBi?: number; tat?: boolean } = {}) {
  const { d, env } = dung(kho)
  if (tuyChon.tat) { d.sql.exec(`INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('lam_lai_khac','{"bat":false}','x')`); xoaDemCauHinh(env) }
  for (const q of SAI) ghi(d, q, 0, luc('2026-10-05', '10:00'))
  vi.setSystemTime(luc('2026-10-06'))
  const ban = await xepBan(env, tuyChon.soBi ? { soBi: tuyChon.soBi } : {})
  expect(ban.ok, JSON.stringify(ban).slice(0, 400)).toBe(true)
  return { d, env, ban }
}

describe('Bi-a · câu LỖI lên bàn ⇒ bản khác (câu anh em ĐÚNG KHỐI), trần / Câu chốt giữ nguyên', () => {
  it('Câu chốt là câu lỗi Q3 ⇒ chốt là câu anh em (S1/S2), KHÔNG nguyên văn; phản hồi không lộ đáp án; phiên ghi tc; không câu khác khối nào lên bàn', async () => {
    const { d, env, ban } = await banMoi([...Q, ...ANH_EM, ...KHAC_KHOI])
    expect(ban.chot, 'Câu chốt ưu tiên câu ÔN đang sai (luật G1 giữ nguyên)').toBeTruthy()
    const qids = trenBan(ban).map((x) => x.qid)
    for (const sai of ['L10', 'L12', 'LX']) expect(qids, 'câu KHÁC KHỐI không bao giờ lên bàn').not.toContain(sai)
    for (const loi of SAI) expect(qids, `${loi} nguyên văn không lên bàn khi còn bậc 1–3`).not.toContain(loi)
    expect(['S1', 'S2']).toContain(ban.chot.qid)
    khongLoDapAn(ban)
    const refs = phien(d, ban.session).questions
    const refChot = refs.find((r) => r.qid === ban.chot.qid)!
    expect(refChot).toMatchObject({ role: 'trum' })
    expect(['Q3', 'Q5']).toContain(String(refChot.tc))
    // Mọi câu anh em trên bàn mang `tc` = câu lỗi nó thay; câu lỗi không có câu anh em (hết S) ⇒ bản xáo `xt`, không `nv`.
    for (const r of refs.filter((x) => SAI.includes(String(x.tc)) || SAI.includes(String(x.qid)))) {
      expect(r.nv).toBeUndefined()
      expect(!!r.tc || Array.isArray(r.xt), JSON.stringify(r)).toBe(true)
    }
    expect(JSON.stringify(refs)).not.toContain('"L10"')
  })

  it('trả lời câu anh em ⇒ sổ ghi dưới qid thật kèm tc = câu lỗi; câu lỗi tính vào TRẦN Bi-a (conOn giảm) và hết khỏi kế hoạch hôm nay', async () => {
    const { d, env, ban } = await banMoi([...Q, ...ANH_EM, ...KHAC_KHOI])
    const sanhTruoc = await em(env, '/game-v2/bia-sanh')
    expect(sanhTruoc.ok, JSON.stringify(sanhTruoc).slice(0, 300)).toBe(true)
    const chot = ban.chot as CauBan
    const goc = String(phien(d, ban.session).questions.find((r) => r.qid === chot.qid)!.tc)
    const cauThu = ANH_EM.find((c) => c.qid === chot.qid)!
    const t = await em(env, '/game-v2/answer', { session: ban.session, qid: chot.qid, answer: dapAnHien(cauThu, chot) })
    expect(t.ok, JSON.stringify(t).slice(0, 300)).toBe(true)
    expect(t.correct).toBe(true)
    expect(soCua(d, chot.qid).map((x) => ({ kq: x.ket_qua, tc: JSON.parse(x.raw_json ?? '{}').tc }))).toEqual([{ kq: 1, tc: goc }])
    expect(soCua(d, goc)).toEqual([]) // câu lỗi gốc chưa lần nào ra nguyên văn
    const sanhSau = await em(env, '/game-v2/bia-sanh')
    // Trần ÔN trước: 1 suất ôn; sau khi em trả lời câu anh em thay cho câu ôn ⇒ suất ôn đã dùng (nếu không đếm câu anh em: vẫn 1 ⇒ em chơi vượt trần).
    expect(sanhTruoc.tran.tranOn).toBe(sanhSau.tran.tranOn)
    expect(sanhSau.tran.conOn).toBe(0)
  })

  it('LUẬT KHỐI: chỉ còn ứng viên khác khối / cùng nhóm ⇒ KHÔNG BAO GIỜ lấy câu lớp 10 / lớp 12 / không rõ khối — câu lỗi ra BẢN XÁO, chấm đúng theo thứ tự đã xáo, sổ quy về khung gốc', async () => {
    // Q5 khác dạng (D9, không câu anh em nào); S1 cùng dạng với Q3 nhưng CÙNG nhóm nội dung ⇒ loại; còn lại chỉ có câu lớp 10 / 12 / không rõ khối ⇒ chỉ còn bản xáo.
    const kho = [...Q.map((c) => (c.qid === 'Q5' ? { ...c, dang: 'D9' } : c)), { qid: 'S1', maDe: TO_B, dang: 'D1', mucDo: 'TH', correct: 'C', group: 'g-Q3' }, ...KHAC_KHOI]
    const { d, env, ban } = await banMoi(kho)
    const qids = trenBan(ban).map((x) => x.qid)
    for (const sai of ['L10', 'L12', 'LX', 'S1']) expect(qids).not.toContain(sai)
    const chot = ban.chot as CauBan
    expect(SAI).toContain(chot.qid) // bản xáo của chính câu lỗi
    const goc = Q.find((c) => c.qid === chot.qid)!
    expect(chot.choices).not.toEqual(['A', 'B', 'C', 'D'].map((k) => PA(chot.qid, k)))
    expect([...chot.choices].sort()).toEqual(['A', 'B', 'C', 'D'].map((k) => PA(chot.qid, k)).sort())
    expect(Array.isArray(phien(d, ban.session).questions.find((r) => r.qid === chot.qid)!.xt)).toBe(true)
    khongLoDapAn(ban)
    const chu = dapAnHien(goc, chot)
    expect(chu).not.toBe('B') // chữ cái em nhớ không còn đúng
    const t = await em(env, '/game-v2/answer', { session: ban.session, qid: chot.qid, answer: chu })
    expect(t.correct).toBe(true)
    expect(JSON.parse(soCua(d, chot.qid)[0]!.raw_json!)).toMatchObject({ chon: 'B', xt: 1 })
  })

  it('tắt khoá lam_lai_khac ⇒ y hệt hôm nay: câu lỗi nguyên văn trên bàn, phiên và sổ không có khoá làm lại nào', async () => {
    const { d, env, ban } = await banMoi([...Q, ...ANH_EM, ...KHAC_KHOI], { tat: true })
    const chot = ban.chot as CauBan
    expect(SAI).toContain(chot.qid)
    expect(chot.choices).toEqual(['A', 'B', 'C', 'D'].map((k) => PA(chot.qid, k)))
    for (const r of phien(d, ban.session).questions) for (const k of ['tc', 'xt', 'nv']) expect(k in r, `phiên có khoá ${k}`).toBe(false)
    const t = await em(env, '/game-v2/answer', { session: ban.session, qid: chot.qid, answer: 'B' })
    expect(t.correct).toBe(true)
    expect(JSON.parse(soCua(d, chot.qid)[0]!.raw_json!)).toEqual({ chon: 'B' })
  })
})

describe('Bi-a · đổi câu (bia-doi-cau) và Trả lời câu hỏi (bia-tra-loi) cũng qua thang', () => {
  it('bàn nhỏ (3 bi): em sai một bi rồi đổi câu ⇒ câu thay lên bàn; câu thay là câu LỖI thì không nguyên văn; phản hồi không lộ đáp án', async () => {
    const { d, env, ban } = await banMoi([...Q, ...ANH_EM, ...KHAC_KHOI], { soBi: 3 })
    const bi = ban.bi as CauBan[]
    expect(bi.length).toBeGreaterThan(0)
    const cu = bi[0]!
    const sai = await em(env, '/game-v2/answer', { session: ban.session, qid: cu.qid, answer: 'A' })
    expect(sai.ok, JSON.stringify(sai).slice(0, 300)).toBe(true)
    const moi = await em(env, '/game-v2/bia-doi-cau', { session: ban.session, qidCu: cu.qid })
    expect(moi.ok, JSON.stringify(moi).slice(0, 300)).toBe(true)
    if (moi.trong) return // hết trần: không có câu thay (đúng luật cũ)
    khongLoDapAn(moi)
    const qm = moi.cau as CauBan
    for (const x of ['L10', 'L12', 'LX']) expect(qm.qid).not.toBe(x)
    const refs = phien(d, ban.session).questions
    const ref = refs.find((r) => r.qid === qm.qid && !trenBan(ban).some((b) => b.qid === qm.qid) ? true : r.qid === qm.qid && r !== refs[0])!
    expect(ref).toBeTruthy()
    // Câu thay là câu lỗi (Q3/Q5) hoặc thay cho câu lỗi ⇒ phải là bản khác (tc hoặc xt), không nguyên văn.
    if (SAI.includes(qm.qid)) expect(Array.isArray(ref.xt)).toBe(true)
  })

  it('Trả lời câu hỏi (không cần chơi): câu lỗi cũng ra bản khác, không nguyên văn', async () => {
    const { d, env } = dung([...Q, ...ANH_EM, ...KHAC_KHOI])
    for (const q of SAI) ghi(d, q, 0, luc('2026-10-05', '10:00'))
    vi.setSystemTime(luc('2026-10-06'))
    const r = await em(env, '/game-v2/bia-tra-loi', {})
    expect(r.ok, JSON.stringify(r).slice(0, 400)).toBe(true)
    const qids = (r.cau as CauBan[]).map((x) => x.qid)
    expect(qids.length).toBeGreaterThan(0)
    for (const x of ['L10', 'L12', 'LX']) expect(qids).not.toContain(x)
    for (const loi of SAI) expect(qids).not.toContain(loi)
    khongLoDapAn(r)
  })
})
