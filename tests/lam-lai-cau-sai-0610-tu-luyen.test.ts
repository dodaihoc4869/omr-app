// @vitest-environment node
// LÀM LẠI CÂU SAI BẰNG BẢN KHÁC · TU LUYỆN "SỬA CÂU SAI" (làn A', 06/10) — D1 THẬT (node:sqlite, đủ migration), mọi lệnh đi qua Worker thật (`/hs/tu-luyen/*`).
// Lệnh thầy 30/09: "lần luyện sau câu sẽ khác lần luyện trước … kho câu sai không đủ thì lấy lại trùng cũng được". Lệnh thầy 05/10: "thay vì lặp lại câu sai bạn hãy tìm cách để
// học sinh vẫn hoàn thành được câu sai đó nhưng không học thuộc đáp án được". Nay chế độ 1 GIỮ NGUYÊN thứ tự + số câu + nhãn; câu đang trong cửa sổ lỗi hiển thị BẢN KHÁC (thang của
// cau-anh-em.ts: song sinh → câu anh em ĐÚNG KHỐI → bản xáo); KHÔNG có bản khác ⇒ NGUYÊN VĂN (không lỗi, không rỗng). Tu luyện độc lập: không EXP, không sổ sự kiện.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import worker from '../server/src/index'
import { goiWorker, taoD1That, type D1That } from './_d1-that'
import { gameToken } from '../server/src/game-v2-auth'
import { xoaDemCaBaoVe } from '../server/src/game-v2-bank'
import { xoaDemCauHinh } from '../server/src/cau-hinh-dem'
import { xoaDemPhamVi } from '../server/src/bai-da-day'
import { xoaDemChienDich } from '../server/src/srs2-d1'
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

// Hai câu em sai hôm qua (Q3, Q5, cùng dạng D1) + anh em hợp lệ S1, S2 (tờ khối 11 khác, cùng dạng, cùng mức, KHÁC nhóm) + câu khác khối / không rõ khối.
const Q3: CauThu = { qid: 'Q3', maDe: TO_A, dang: 'D1', mucDo: 'TH', correct: 'B' }
const Q5: CauThu = { qid: 'Q5', maDe: TO_A, dang: 'D1', mucDo: 'TH', correct: 'C' }
const ANH_EM: CauThu[] = [
  { qid: 'S1', maDe: TO_B, dang: 'D1', mucDo: 'TH', correct: 'D' },
  { qid: 'S2', maDe: TO_B, dang: 'D1', mucDo: 'TH', correct: 'A' },
]
const KHAC_KHOI: CauThu[] = [
  { qid: 'L10', maDe: TO10, dang: 'D1', mucDo: 'TH', correct: 'A' },
  { qid: 'L12', maDe: TO12, dang: 'D1', mucDo: 'TH', correct: 'A' },
  { qid: 'LX', maDe: TOX, dang: 'D1', mucDo: 'TH', correct: 'A' },
]

/** Em S1 lớp 11A1 (khối 11); phạm vi đã dạy = mọi tờ của kho. KHÔNG bật OMNI / Hoá 2.0: Tu luyện độc lập. */
function dung(kho: CauThu[], tat = false): { d: D1That; env: Env } {
  const d = taoD1That()
  const env = d.env as unknown as Env
  d.sql.exec("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES('S1','Nguyễn An','11A1','mk1','x')")
  if (tat) d.sql.exec(`INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('lam_lai_khac','{"bat":false}','x')`)
  const to = [...new Set(kho.map((c) => c.maDe))]
  for (const m of to) {
    d.sql.prepare('INSERT INTO de_kho(ma_de,ten_de,lop,so_cau,da_xoa,cap_nhat_luc) VALUES(?,?,?,?,0,?)').run(m, `Tờ ${m}`, LOP_TO[m] ?? null, kho.filter((c) => c.maDe === m).length, 'v1')
    d.sql.prepare("INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES(?,'v1','x')").run(m)
  }
  const st = d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)')
  for (const c of kho) st.run(c.maDe, c.qid, 'v1', c.group ?? `g-${c.qid}`, c.dang, JSON.stringify(cauJson(c)))
  d.sql.prepare("INSERT INTO bai_da_day(id,lop,khoa_bai,ten_bai,vi_tri,ma_to_json,tick_luc) VALUES('T1','11A1','B1','Bài 1',1,?,'2026-10-01T00:00:00.000Z')").run(JSON.stringify(to))
  return { d, env }
}
function ghi(d: D1That, qid: string, kq: 0 | 1, ms: number, nguon = 'game') { // 'game': lần sai trong Đảo/Đoàn/Bi-a (nguồn câu sai của Tu luyện: ca đã công bố, game, Luyện đề đã nộp)
  d.sql.prepare('INSERT INTO su_kien_hoc(khoa,sbd,qid,nguon,ma_nguon,lan,ket_qua,luc,ngay_vn,assistance) VALUES(?,?,?,?,?,1,?,?,?,?)')
    .run(`${nguon}|S1|${qid}|${ms}`, 'S1', qid, nguon, `M-${ms}`, kq, new Date(ms).toISOString(), ngayVnCua(ms), 'none')
}
const em = async (env: Env, duong: string, b: Record<string, unknown> = {}) => goiWorker(worker, env, duong, { token: await gameToken(env, 'S1'), ...b })
interface CauCK { qid: string; phan: string; luaChon?: string[] | null; nhanLuyen?: string; saiGoc?: string } // khuôn CauCongKhai của Tu luyện (src/lib/tu-luyen.ts)
const luotRieng = (d: D1That, id: string) => JSON.parse((d.sql.prepare('SELECT de_rieng_json FROM tu_luyen_luot WHERE id = ?').get(id) as { de_rieng_json: string }).de_rieng_json) as Record<string, unknown>[]
const demSo = (d: D1That) => (d.sql.prepare('SELECT COUNT(*) AS n FROM su_kien_hoc').get() as { n: number }).n
function khongLoDapAn(r: unknown) {
  const s = JSON.stringify(r)
  for (const k of ['"correct"', '"solution"', '"answer"', '"dapAn"', '"tc"', '"xt"', '"nv"', '"hien"', '"bac"', '"loiGiai"', '"lyDo"']) expect(s, `phản hồi lộ ${k}`).not.toContain(k)
}
const dapAnHien = (c: CauThu, de: { luaChon?: string[] | null }): string => 'ABCD'[de.luaChon!.indexOf(PA(c.qid, c.correct))]!

beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); xoaDemCaBaoVe(); xoaDemChienDich(); xoaDemPhamVi() })
afterEach(() => vi.useRealTimers())

async function rut(kho: CauThu[], o: { soCau?: number; tat?: boolean; sai?: string[] } = {}) {
  const { d, env } = dung(kho, o.tat)
  if (o.tat) xoaDemCauHinh(env)
  for (const q of o.sai ?? ['Q3', 'Q5']) ghi(d, q, 0, luc('2026-10-05', '10:00'))
  vi.setSystemTime(luc('2026-10-06'))
  const r = await em(env, '/hs/tu-luyen/rut', { cheDo: 1, soCau: o.soCau ?? 2 })
  expect(r.ok, JSON.stringify(r).slice(0, 400)).toBe(true)
  return { d, env, r }
}

describe('Tu luyện · Sửa câu sai: câu LỖI ⇒ bản khác (đúng khối), thứ tự + số câu + nhãn giữ nguyên', () => {
  it('hai câu sai Q3, Q5 có câu anh em ⇒ lượt hiển thị S1, S2 (không câu gốc nguyên văn, không câu khác khối); nhãn giữ; phần riêng ghi tc; phản hồi không lộ đáp án', async () => {
    const { d, env, r } = await rut([Q3, Q5, ...ANH_EM, ...KHAC_KHOI])
    const cau = r.cau as CauCK[]
    expect(cau.length).toBe(2) // số câu giữ nguyên
    const idHienThi = cau.map((c) => c.qid)
    expect(idHienThi.sort()).toEqual(['Q3', 'Q5']) // mã câu trong lượt vẫn là câu GỐC (đơn vị tiến độ)
    for (const c of cau) {
      expect(c.nhanLuyen).toBe('Luyện lần đầu') // nhãn giữ như cũ
      expect(c.saiGoc).toMatch(/^Sai gốc: /)
      expect(c.luaChon, 'câu hiển thị KHÔNG phải nguyên văn của câu gốc').not.toEqual(['A', 'B', 'C', 'D'].map((k) => PA(c.qid, k)))
      // nội dung là của câu anh em (S1/S2), đề dẫn riêng của câu ấy — tìm theo chữ phương án
      expect(c.luaChon!.some((x) => /^S[12] — /.test(x)), JSON.stringify(c.luaChon)).toBe(true)
      expect(c.luaChon!.some((x) => /^(L10|L12|LX|Q3|Q5) — /.test(x))).toBe(false)
    }
    khongLoDapAn(r)
    const rieng = luotRieng(d, String(r.luotId))
    expect(rieng.map((x) => x.qid).sort()).toEqual(['Q3', 'Q5'])
    for (const x of rieng) {
      expect(['Q3', 'Q5']).toContain(String(x.tc))
      expect(x.tc).toBe(x.qid)
      expect(['S1', 'S2']).toContain(String(x.hien))
      expect(x.bac).toBe('anh_em')
      expect(x.khoSai).toBe(true) // vẫn là câu của kho câu sai ⇒ ôn cách quãng
    }
    expect(new Set(rieng.map((x) => x.hien)).size).toBe(2) // hai câu sai ⇒ hai bản khác nhau
    expect(demSo(d)).toBe(2) // chỉ hai dòng sổ sai ban đầu — Tu luyện không ghi sổ sự kiện
    void env
  })

  it('nộp bản khác: chấm theo ĐÁP ÁN CỦA CÂU HIỂN THỊ; ôn cách quãng đi theo câu gốc (đúng lần 1 ⇒ hẹn mai); không ghi sổ sự kiện', async () => {
    const { d, env, r } = await rut([Q3, Q5, ...ANH_EM, ...KHAC_KHOI])
    const cau = r.cau as CauCK[]
    const rieng = luotRieng(d, String(r.luotId))
    const traLoi: Record<string, string> = {}
    for (const c of cau) {
      const goc = ANH_EM.find((x) => x.qid === rieng.find((y) => y.qid === c.qid)!.hien)!
      traLoi[c.qid] = dapAnHien(goc, c)
    }
    const n = await em(env, '/hs/tu-luyen/nop', { luotId: r.luotId, traLoi })
    expect(n.ok, JSON.stringify(n).slice(0, 400)).toBe(true)
    expect(n.soDung).toBe(2)
    expect((n.cau as { qid: string; dung: boolean; khacPhuc?: string }[]).every((x) => x.dung && /hẹn gặp lại/.test(x.khacPhuc ?? ''))).toBe(true)
    // tiến độ theo câu GỐC
    const kp = d.sql.prepare('SELECT qid, so_dung_lien FROM tu_luyen_khac_phuc WHERE sbd = ? ORDER BY qid').all('S1') as { qid: string; so_dung_lien: number }[]
    expect(kp).toEqual([{ qid: 'Q3', so_dung_lien: 1 }, { qid: 'Q5', so_dung_lien: 1 }])
    const dong = d.sql.prepare('SELECT qid, dung FROM tu_luyen_cau WHERE sbd = ? ORDER BY qid').all('S1') as { qid: string; dung: number }[]
    expect(dong).toEqual([{ qid: 'Q3', dung: 1 }, { qid: 'Q5', dung: 1 }])
    expect(demSo(d)).toBe(2)
  })

  it('LUẬT KHỐI: chỉ còn ứng viên lớp 10 / lớp 12 / không rõ khối / cùng nhóm ⇒ KHÔNG BAO GIỜ lấy chúng — câu sai ra BẢN XÁO của chính nó; chấm đúng theo thứ tự đã xáo', async () => {
    const { d, env, r } = await rut([Q3, ...ANH_EM.map((c) => ({ ...c, group: 'g-Q3' })), ...KHAC_KHOI], { soCau: 1, sai: ['Q3'] })
    const cau = r.cau as CauCK[]
    expect(cau.map((c) => c.qid)).toEqual(['Q3'])
    const c = cau[0]!
    expect([...c.luaChon!].sort()).toEqual(['A', 'B', 'C', 'D'].map((k) => PA('Q3', k)).sort()) // vẫn là các phương án của Q3
    expect(c.luaChon).not.toEqual(['A', 'B', 'C', 'D'].map((k) => PA('Q3', k))) // nhưng đã đổi chỗ
    khongLoDapAn(r)
    const rieng = luotRieng(d, String(r.luotId))
    expect(rieng[0]).toMatchObject({ qid: 'Q3', tc: 'Q3', hien: 'Q3', bac: 'xao' })
    const chu = dapAnHien(Q3, c)
    expect(chu).not.toBe('B') // chữ cái em nhớ không còn đúng
    const n = await em(env, '/hs/tu-luyen/nop', { luotId: r.luotId, traLoi: { Q3: chu } })
    expect(n.soDung).toBe(1)
    const loSai = await em(env, '/hs/tu-luyen/xem-luot', { luotId: r.luotId })
    expect(loSai.ok).toBe(true)
  })

  it('tắt khoá lam_lai_khac ⇒ y hệt hôm nay: câu gốc nguyên văn, phần riêng không có tc / hien / bac', async () => {
    const { d, r } = await rut([Q3, Q5, ...ANH_EM, ...KHAC_KHOI], { tat: true })
    for (const c of r.cau as CauCK[]) expect(c.luaChon).toEqual(['A', 'B', 'C', 'D'].map((k) => PA(c.qid, k)))
    for (const x of luotRieng(d, String(r.luotId))) for (const k of ['tc', 'hien', 'bac']) expect(k in x, `phần riêng có khoá ${k}`).toBe(false)
  })

  it('KHÔNG có bản khác (câu không xáo được: lời giải nhắc thẳng chữ cái, không câu anh em) ⇒ NGUYÊN VĂN y như lệnh thầy 30/09; không lỗi, không rỗng; ghi bac = nguyen_van', async () => {
    const { d, env } = dung([Q3, ...KHAC_KHOI])
    d.sql.prepare("UPDATE game_v2_question SET json = json_set(json, '$.solution', json('{\"chot\":\"Chọn B vì bảo toàn khối lượng.\"}')) WHERE qid = 'Q3'").run()
    ghi(d, 'Q3', 0, luc('2026-10-05', '10:00'))
    vi.setSystemTime(luc('2026-10-06'))
    const r = await em(env, '/hs/tu-luyen/rut', { cheDo: 1, soCau: 1 })
    expect(r.ok, JSON.stringify(r).slice(0, 300)).toBe(true)
    const cau = r.cau as CauCK[]
    expect(cau.length).toBe(1)
    expect(cau[0]!.luaChon).toEqual(['A', 'B', 'C', 'D'].map((k) => PA('Q3', k)))
    expect(luotRieng(d, String(r.luotId))[0]).toMatchObject({ qid: 'Q3', tc: 'Q3', hien: 'Q3', bac: 'nguyen_van' })
    const n = await em(env, '/hs/tu-luyen/nop', { luotId: r.luotId, traLoi: { Q3: 'B' } })
    expect(n.soDung).toBe(1)
  })

  it('câu sai CHỈ có ở Tu luyện chế độ 2–4 (không nằm trong sổ srs2 ⇒ không trong cửa sổ lỗi) ⇒ như cũ: nguyên văn, phần riêng không có khoá làm lại', async () => {
    const { d, env } = dung([Q3, ...ANH_EM, ...KHAC_KHOI])
    d.sql.prepare("INSERT INTO tu_luyen_luot(id,sbd,che_do,tao_luc,nop_luc,trang_thai) VALUES('tl_cu000001','S1',2,?,?,'da_nop')").run(luc('2026-10-05', '10:00'), luc('2026-10-05', '10:30'))
    d.sql.prepare("INSERT INTO tu_luyen_cau(luot_id,sbd,che_do,qid,phan,dung,diem,tra_loi,nop_luc) VALUES('tl_cu000001','S1',2,'Q3','I',0,0,'A',?)").run(luc('2026-10-05', '10:30'))
    vi.setSystemTime(luc('2026-10-06'))
    const r = await em(env, '/hs/tu-luyen/rut', { cheDo: 1, soCau: 1 })
    expect(r.ok, JSON.stringify(r).slice(0, 300)).toBe(true)
    expect((r.cau as CauCK[]).map((c) => c.qid)).toEqual(['Q3'])
    expect((r.cau as CauCK[])[0]!.luaChon).toEqual(['A', 'B', 'C', 'D'].map((k) => PA('Q3', k)))
    for (const x of luotRieng(d, String(r.luotId))) for (const k of ['tc', 'hien', 'bac']) expect(k in x, `phần riêng có khoá ${k}`).toBe(false)
  })
})
