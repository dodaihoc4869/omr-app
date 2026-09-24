// @vitest-environment node
import { doanAction } from '../server/src/game-v2-doan'
// LÁT CẮT 2 — GAME ĐOÀN (thầy 24/09: chỉ 3 nhóm; nhóm 2 = game Đoàn).
// CA ĐƯỜNG THẬT: `/game-v2/doan-mo` (mở chặng) trên D1 THẬT + dữ liệu TỔNG HỢP.
// Điều bắt buộc kiểm: RETRY và CẠNH TRANH chỉ được mở MỘT chặng và phát MỘT bộ câu cá nhân cho một em
// (phát hai chặng/hai bộ là phát trùng: em bị hỏi hai lần cùng nội dung, hạn/hiệp bị tính lệch).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import worker from '../server/src/index'
import { gameToken } from '../server/src/game-v2-auth'
import { goiWorker, taoD1That, serialiseD1, type D1That } from './_d1-that'
import { daHocDang } from './_pham-vi-ca-nhan'

const T0 = Date.parse('2026-09-22T12:00:00+07:00')
beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(T0) })
afterEach(() => vi.useRealTimers())

const cau = (qid: string, dang: string) => ({
  qid, maDe: 'DE1', version: 'v1', group: `g-${qid}`, phan: 'I', text: `Đề ${qid}`, choices: ['a', 'b', 'c', 'd'], ideas: [],
  hinhAnh: [], dang, tenDang: `Dạng ${dang}`, mucDo: 'biet', sao: 1, kienThuc: ['K1'], correct: 'B', solution: `LG-${qid}`, reviewed: true,
})

/** Lớp 12, em S1 (mật khẩu + hồ sơ game + bằng chứng học dạng A.1), Đoàn Hộ Tống mở cho cả trường. */
function dung(soA = 30): D1That {
  const d = taoD1That()
  d.sql.prepare("INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('doan_ho_tong',?,'x')").run(JSON.stringify({ toanBo: true }))
  const ds = Array.from({ length: soA }, (_, i) => cau(`A-${i}`, 'A.1'))
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
/** Mở chặng Đoàn qua ĐÚNG route (`cheDo: 'phong'` để không cần câu chung của trùm). */
const moDoan = async (d: D1That, t?: string) =>
  (await goiWorker(worker, d.env, '/game-v2/doan-mo', { token: t ?? (await token(d)), cheDo: 'phong' })) as Record<string, any>
const demChang = (d: D1That) => (d.sql.prepare('SELECT COUNT(*) AS n FROM doan_chang').get() as { n: number }).n
const demPhien = (d: D1That) => (d.sql.prepare("SELECT COUNT(*) AS n FROM game_v2_session WHERE sbd='S1'").get() as { n: number }).n
/** Phiên câu cá nhân của Đoàn = phiên đã đóng dấu `$.doan = 1`. */
const phienDoan = (d: D1That) => d.sql.prepare("SELECT id, json FROM game_v2_session WHERE sbd='S1' AND json_extract(json,'$.doan')=1").all() as { id: string; json: string }[]
const qidPhien = (x: { json: string }) => (JSON.parse(x.json).questions as { qid: string }[]).map((q) => q.qid)

describe('Boss: losing room claim preserves session used by winning room', () => {
 it.each([false, true])('shared session, existed before request=%s', async (existed) => {
  const d = dung(); serialiseD1(d.env)
  const qs = Array.from({length: 8}, (_, i) => cau(`A-${i}`, 'A.1'))
  const insertSession = () => d.sql.prepare('INSERT OR IGNORE INTO game_v2_session(id,sbd,json,created_at) VALUES(?,?,?,?)').run('shared', 'S1', JSON.stringify({mode:'adventure', created:T0, questions:qs}), new Date(T0).toISOString())
  if (existed) insertSession()
  let count = 0; let release!: () => void
  const barrier = new Promise<void>(resolve => { release = resolve })
  const start = async () => { if (++count === 2) release(); await barrier; insertSession(); return {ok:true, id:'shared', questions:qs} }
  const p = JSON.parse((d.sql.prepare("SELECT json FROM game_v2_profile WHERE sbd='S1'").get() as {json:string}).json)
  const [a,b] = await Promise.all([doanAction(d.env,'S1',p,'doan-mo',{cheDo:'phong'},start),doanAction(d.env,'S1',p,'doan-mo',{cheDo:'phong'},start)])
  expect(a.ok).toBe(true); expect(b.ok).toBe(true)
  expect(demChang(d)).toBe(1)
  const row = d.sql.prepare("SELECT json FROM game_v2_session WHERE id='shared'").get() as {json:string}|undefined
  expect(row).toBeDefined()
  expect(JSON.parse(row!.json).doan).toBe(1)
  const room = d.sql.prepare('SELECT json FROM doan_chang').get() as {json:string}
  expect(JSON.parse(room.json).nguoi[0].phien).toBe('shared')
 })
})
