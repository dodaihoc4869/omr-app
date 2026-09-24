// @vitest-environment node
// LÁT CẮT 1 — CHỐNG LẶP CÂU + CẤP PHÁT RETRY/CẠNH TRANH (thầy 24/09: chỉ 3 nhóm; nhóm 1 = chống lặp câu).
// CA TÍCH HỢP ĐƯỜNG THẬT: gọi ĐÚNG route của Worker (`/game-v2/start` = lượt Đảo + nguồn câu cá nhân của Đoàn, `/hs/thu-thach-hom-nay` = thử thách riêng)
// trên D1 THẬT (node:sqlite, nạp đủ schema + migration) với dữ liệu TỔNG HỢP. Ba điều bắt buộc kiểm:
//   1. RETRY (gọi lại yêu cầu cũ): KHÔNG phát bộ câu thứ hai; trả đúng bộ đã phát.
//   2. CẠNH TRANH (hai yêu cầu song song): CHỈ MỘT bộ câu được phát.
//   3. MỘT BỘ KHÔNG TRÙNG qid VÀ không trùng content_group (nhóm nội dung).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import worker from '../server/src/index'
import { gameToken } from '../server/src/game-v2-auth'
import { goiWorker, taoD1That, type D1That } from './_d1-that'
import { daHocDang } from './_pham-vi-ca-nhan'
import { ghiSuKien } from '../server/src/su-kien-hoc'

const T0 = Date.parse('2026-09-22T12:00:00+07:00')
beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(T0) })
afterEach(() => vi.useRealTimers())

const cau = (qid: string, dang: string, mucDo: 'biet' | 'hieu' | 'van_dung' = 'biet', phan: 'I' | 'II' = 'I') => ({
  qid, maDe: 'DE1', version: 'v1', group: `g-${qid}`, phan, text: `Đề ${qid}`, choices: phan === 'I' ? ['a', 'b', 'c', 'd'] : [], ideas: phan === 'II' ? ['ý a', 'ý b', 'ý c', 'ý d'] : [],
  hinhAnh: [], dang, tenDang: `Dạng ${dang}`, mucDo, sao: 1, kienThuc: ['K1'], correct: phan === 'II' ? 'DSDS' : 'B', solution: `LG-${qid}`, reviewed: true,
})

/** Trường tổng hợp: lớp 12, một em S1; kho DE1 = `soA` câu Phần I dạng A.1 + `soII` câu Phần II dạng A.1; em đã có bằng chứng học dạng A.1. */
function dung(o: { soA?: number; soII?: number; mucDo?: 'biet' | 'hieu' | 'van_dung' } = {}): D1That {
  const d = taoD1That()
  d.sql.prepare("INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('doan_ho_tong',?,'x')").run(JSON.stringify({ toanBo: true }))
  const ds = [
    ...Array.from({ length: o.soA ?? 30 }, (_, i) => cau(`A-${i}`, 'A.1', o.mucDo ?? 'biet')),
    ...Array.from({ length: o.soII ?? 2 }, (_, i) => cau(`A2-${i}`, 'A.1', o.mucDo ?? 'biet', 'II')),
  ]
  d.sql.prepare("INSERT INTO de_kho(ma_de,ten_de,lop,so_cau,r2_khoa,da_xoa,cap_nhat_luc) VALUES('DE1','DE1','12',?,'kho/DE1.json',0,'v1')").run(ds.length)
  d.sql.prepare("INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('DE1','v1','x')").run()
  const them = d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)')
  for (const q of ds) them.run('DE1', q.qid, q.version, q.group, q.dang, JSON.stringify(q))
  d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES('S1','Em Một','12','mk','x')").run()
  d.sql.prepare('INSERT INTO game_v2_profile(sbd,json,created_at) VALUES(?,?,?)')
    .run('S1', JSON.stringify({ pet: 'lua_phuong', choice: false, legacy: null, cap: 5, exp: 0, wallet: 0, earned: 0, tower: 1, mastery: [], arena: null, cutover: '2020-01-01T00:00:00.000Z' }), 'x')
  daHocDang(d, 'S1', 'A.1')
  return d
}

const token = (d: D1That) => gameToken(d.env, 'S1')
const batDau = async (d: D1That, t?: string) => (await goiWorker(worker, d.env, '/game-v2/start', { token: t ?? (await token(d)), mode: 'adventure' })) as Record<string, any>
const thuThach = async (d: D1That, t?: string) => (await goiWorker(worker, d.env, '/hs/thu-thach-hom-nay', { token: t ?? (await token(d)) })) as Record<string, any>

const demPhien = (d: D1That, sbd = 'S1') => (d.sql.prepare('SELECT COUNT(*) AS n FROM game_v2_session WHERE sbd = ?').get(sbd) as { n: number }).n
const qidCua = (r: Record<string, any>) => (r.questions as { qid: string; group?: string }[]).map((q) => q.qid)
const nhomCua = (r: Record<string, any>) => (r.questions as { qid: string; group?: string }[]).map((q) => q.group ?? `qid:${q.qid}`)


describe('LÁT 1 · /game-v2/start (lượt Đảo — nguồn câu cá nhân của Đoàn): KHÔNG phát trùng khi retry/cạnh tranh', () => {
  it('RETRY: gọi lại ngay trả ĐÚNG lượt đã mở (cùng id, cùng bộ câu), KHÔNG mở lượt/câu thứ hai', async () => {
    const d = dung()
    const t = await token(d)
    const a = await batDau(d, t)
    expect(a.ok).toBe(true)
    expect(qidCua(a).length).toBeGreaterThan(0)
    const b = await batDau(d, t)
    expect(b.ok).toBe(true)
    expect(b.id).toBe(a.id)
    expect(qidCua(b)).toEqual(qidCua(a))
    expect(demPhien(d)).toBe(1)
  })

  it('CẠNH TRANH: hai yêu cầu SONG SONG chỉ được phát MỘT lượt câu (không phát hai bộ)', async () => {
    const d = dung()
    const t = await token(d)
    const [a, b] = await Promise.all([batDau(d, t), batDau(d, t)])
    const coCau = [a, b].filter((r) => r.ok === true && (r.questions as unknown[]).length > 0)
    expect(coCau.length).toBeGreaterThan(0)
    // MỌI phản hồi có câu phải cùng MỘT phiên và cùng MỘT bộ câu — phát hai bộ khác nhau là phát trùng.
    expect(new Set(coCau.map((r) => String(r.id))).size).toBe(1)
    expect(new Set(coCau.map((r) => qidCua(r).join(','))).size).toBe(1)
    expect(demPhien(d)).toBe(1)
    const jsons = d.sql.prepare('SELECT json FROM game_v2_session WHERE sbd = ?').all('S1') as { json: string }[]
    expect(jsons).toHaveLength(1)
    const trongPhien = (JSON.parse(jsons[0]!.json).questions as { qid: string }[]).map((q) => q.qid)
    expect(new Set(trongPhien).size).toBe(trongPhien.length)
  })

  it('MỘT BỘ không trùng qid và không trùng content_group', async () => {
    const d = dung()
    const r = await batDau(d)
    const qid = qidCua(r)
    expect(qid.length).toBeGreaterThan(0)
    expect(new Set(qid).size).toBe(qid.length)
    const nhom = nhomCua(r)
    expect(new Set(nhom).size).toBe(nhom.length)
  })
})

describe('LÁT 1 · /hs/thu-thach-hom-nay (thử thách riêng): chốt MỘT lần/ngày cả khi retry/cạnh tranh', () => {
  const themDieuChinh = (d: D1That, dang: string[], soCau: number) =>
    d.sql.prepare("INSERT OR REPLACE INTO ai_dieu_chinh(sbd,ngay,json,ap_dung,het_han,huy,nop_luc,che_do) VALUES('S1',?,?,1,'2999-01-01',0,'x','that')")
      .run(new Date(T0).toISOString().slice(0, 10), JSON.stringify({ thuThach: { dang, soCau, bac: 'dung_bac' }, loiMoi: 'Hôm nay thử sức vài câu vừa sức nhé.' }))
  const truong = () => {
    const d = dung({ soA: 12, soII: 0, mucDo: 'hieu' })
    // Đủ căn cứ bậc hồ sơ 1 (như bộ câu bài tập về nhà): thiếu dòng này bậc đích = 0 ⇒ mức nhắm "biết" ⇒ không có câu nào để chốt.
    d.sql.prepare("INSERT OR REPLACE INTO nam_kt_dang(khoa,sbd,ma_dang,so_gap,so_sai,so_da_khac_phuc,so_moi_sai,so_chua_thay_sai,bac,cap_nhat_luc) VALUES('S1|A.1','S1','A.1',8,0,0,0,0,1,'x')").run()
    themDieuChinh(d, ['A.1'], 6)
    return d
  }

  it('RETRY: gọi lại trả ĐÚNG các câu đã chốt, chỉ MỘT dòng `thu_thach_rieng`', async () => {
    const d = truong()
    const t = await token(d)
    const a = await thuThach(d, t)
    expect(a.ok).toBe(true)
    expect(a.co).toBe(true)
    expect((a.cau as unknown[]).length).toBeGreaterThan(0)
    const b = await thuThach(d, t)
    expect((b.cau as { qid: string }[]).map((c) => c.qid)).toEqual((a.cau as { qid: string }[]).map((c) => c.qid))
    expect((d.sql.prepare('SELECT COUNT(*) AS n FROM thu_thach_rieng').get() as { n: number }).n).toBe(1)
  })

  it('CẠNH TRANH: hai yêu cầu SONG SONG ⇒ một dòng chốt, hai phản hồi cùng bộ câu', async () => {
    const d = truong()
    const t = await token(d)
    const [a, b] = await Promise.all([thuThach(d, t), thuThach(d, t)])
    expect((d.sql.prepare('SELECT COUNT(*) AS n FROM thu_thach_rieng').get() as { n: number }).n).toBe(1)
    const co = [a, b].filter((r) => r.co === true)
    expect(co.length).toBe(2)
    expect(new Set(co.map((r) => (r.cau as { qid: string }[]).map((c) => c.qid).join(','))).size).toBe(1)
    const hang = d.sql.prepare('SELECT qid_json FROM thu_thach_rieng').get() as { qid_json: string }
    const daChot = JSON.parse(hang.qid_json) as string[]
    expect(new Set(daChot).size).toBe(daChot.length)
    expect((co[0]!.cau as { qid: string }[]).map((c) => c.qid)).toEqual(daChot)
  })

  it('MỘT BỘ không trùng qid và không trùng content_group', async () => {
    const d = truong()
    const r = await thuThach(d)
    const qid = (r.cau as { qid: string }[]).map((c) => c.qid)
    expect(new Set(qid).size).toBe(qid.length)
    const nhom = qid.map((q) => (d.sql.prepare('SELECT content_group FROM game_v2_question WHERE qid = ?').get(q) as { content_group: string }).content_group)
    expect(new Set(nhom).size).toBe(nhom.length)
  })
})

describe('LÁT 1 · /parent-news/assign (bài hằng ngày của phụ huynh): giao MỘT lần/ngày khi retry/cạnh tranh', () => {
  const themHs = (d: D1That) => d.sql.prepare("INSERT OR IGNORE INTO hoc_sinh(sbd,ho_ten,lop,cap_nhat_luc) VALUES('S1','Em Một','12','x')").run()
  const cauKho = (qid: string, dang: string, mucDo = 'hieu') => ({
    qid, maDe: 'DE12', version: 'v', group: `g-${qid}`, phan: 'I', text: `Chọn phát biểu đúng về ${qid}.`,
    choices: ['A. a', 'B. b', 'C. c', 'D. d'], ideas: [], hinhAnh: [], dang, tenDang: `Tên ${dang}`, mucDo, sao: 1,
    kienThuc: ['k1'], correct: 'B', solution: 'Lời giải ngắn', reviewed: true,
  })
  /** Em S1 (lớp 12) có 3 câu SAI cách đây 3 ngày ở dạng ES.A.X ⇒ tới mốc ôn hôm nay (như fixture GĐ 5). */
  async function truong() {
    const d = taoD1That()
    themHs(d)
    const ds = ['T1', 'T2', 'T3'].map((q) => cauKho(q, 'ES.A.X'))
      .concat(['N1', 'N2', 'N3'].map((q) => cauKho(q, 'ES.A.X', 'biet')))
      .concat(['E1', 'E2', 'E3', 'E4'].map((q) => cauKho(q, 'ES.B.Y', 'biet')))
    d.sql.prepare("INSERT OR IGNORE INTO de_kho(ma_de,ten_de,lop,so_cau,r2_khoa,da_xoa,cap_nhat_luc) VALUES('DE12','DE12','12',?,'kho/DE12.json',0,'v1')").run(ds.length)
    d.sql.prepare("INSERT OR IGNORE INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('DE12','v1','x')").run()
    for (const c of ds) d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)').run('DE12', c.qid, 'v', c.group, c.dang, JSON.stringify(c))
    const luc = (gio: number) => new Date(Date.now() + gio * 3_600_000).toISOString()
    await ghiSuKien(d.env, (['T1', 'T2', 'T3'] as const).map((qid, i) => ({ nguon: 'btvn', maNguon: 'B1', sbd: 'S1', qid, lan: i + 1, ketQua: 0 as const, luc: luc(-72) })))
    return d
  }
  const assign = (d: D1That) => goiWorker(worker, d.env, '/parent-news/assign', { sbd: 'S1' }) as Promise<Record<string, any>>
  const demDaily = (d: D1That) => (d.sql.prepare("SELECT COUNT(*) AS n FROM mom_bai WHERE sbd='S1' AND id LIKE 'daily_%'").get() as { n: number }).n
  /** Số câu THẬT đã giao: đọc nội dung bài đã lưu (nguồn sự thật), không tin con số trong phản hồi. */
  async function soCauDaLuu(d: D1That, id: string): Promise<number> {
    const r = d.sql.prepare('SELECT bank_key FROM mom_bai WHERE sbd=? AND id=?').get('S1', id) as { bank_key: string }
    const o = await d.env.DE.get(r.bank_key)
    return ((await new Response(o!.body).json()) as unknown[]).length
  }



  it('RETRY: gọi lại trong ngày trả alreadySent đúng bài đã giao, chỉ MỘT bài `daily_`', async () => {
    const d = await truong()
    const a = await assign(d)
    expect(a.ok).toBe(true)
    expect(a.questionCount).toBeGreaterThan(0)
    const b = await assign(d)
    expect(b).toMatchObject({ ok: true, alreadySent: true, id: a.id })
    expect(demDaily(d)).toBe(1)
    expect(await soCauDaLuu(d, a.id)).toBe(a.questionCount)
  })

  it('CẠNH TRANH: hai yêu cầu SONG SONG ⇒ một bài `daily_`, và MỌI phản hồi báo ĐÚNG số câu đã lưu', async () => {
    // LƯU Ý GIỚI HẠN: D1 giả (node:sqlite) không có replica và `batch` lồng nhau bị SQLite từ chối
    // ("cannot start a transaction within a transaction") nên đường ghi kế hoạch có thể tự lui về an toàn.
    // Vì vậy ca này kiểm BẤT BIẾN trên ĐĨA (một bài, số câu đã lưu) chứ không thay thế ca chạy thật nhiều máy chủ.
    const d = await truong()
    const [a, b] = await Promise.all([assign(d), assign(d)])
    expect(demDaily(d)).toBe(1)
    const thanh = [a, b].filter((r) => r.ok === true && !r.alreadySent)
    expect(thanh.length).toBeGreaterThan(0)
    const id = String(d.sql.prepare("SELECT id FROM mom_bai WHERE sbd='S1' AND id LIKE 'daily_%'").get()!.id)
    const luu = await soCauDaLuu(d, id)
    // Phản hồi nào nói đã giao thì số câu phải bằng ĐÚNG bài đã lưu — báo thừa/thiếu là báo sai bộ đã phát.
    for (const r of thanh) expect(r.questionCount, JSON.stringify(r).slice(0, 200)).toBe(luu)
  })
})

