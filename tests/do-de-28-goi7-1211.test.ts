// 12/11 (thầy «làm luôn cả hai việc»): câu đo đề 28 của workflow theo-doi-de-28.yml — «1g» chỉ câu của đề Gói 7 em đã làm, «1d» đề máy đã giao,
// «3b» sửa đúng = câu lần trước sai, lần này đúng (mọi kênh). Test đọc THẲNG câu SQL trong tệp workflow (thay biến shell như bash), chạy trên SQLite với lược đồ thật.
import { it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { taoD1That } from './_d1-that'
const YML = readFileSync('.github/workflows/theo-doi-de-28.yml', 'utf8')
const bien = (ten: string) => { const m = new RegExp(`^\\s*${ten}="(.*)"$`, 'm').exec(YML); if (!m) throw new Error(ten); return m[1]!.replace(/\\\$/g, '$') }
const GOC = bien('GOC'), LAM = bien('LAM'), PHAN = bien('PHAN'), TU = bien('TU')
const cau = (ma: string) => { const m = new RegExp(`q "${ma} [^"]*" "([^"]*)"`).exec(YML); if (!m) throw new Error(ma); return m[1]! }
const Q = { Q1G: cau('1g'), Q1D: cau('1d'), Q3B: cau('3b') }
const sub = (s: string) => s.replace(/\$GOC/g, GOC).replace(/\$LAM/g, LAM).replace(/\$PHAN/g, PHAN).replace(/\$TU/g, TU).replace(/\\\$/g, '$')
it('đo đề 28: câu game ngoài đề làm TRƯỚC không làm hỏng 18/4/6 của đề Gói 7; đề đã giao đo theo thứ tự chặng; sửa đúng theo câu từng sai', () => {
  const d = taoD1That(), db = d.sql
  const ngay = new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10)
  const phan = (i: number) => (i < 18 ? 'I' : i < 22 ? 'II' : 'III')
  for (let i = 0; i < 40; i++) db.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,json) VALUES(?,?,?,?,?)').run('D', `Q${i}`, '1', '', JSON.stringify({ phan: phan(i) }))
  db.exec(`CREATE TABLE IF NOT EXISTS goi_bai_7_loai_ngay (sbd TEXT NOT NULL,ngay TEXT NOT NULL,loai TEXT NOT NULL,luc TEXT NOT NULL,PRIMARY KEY(sbd,ngay))`)
  db.prepare('INSERT INTO goi_bai_7_loai_ngay VALUES(?,?,?,?)').run('E1', ngay, 'moi', 'x')
  const c = new Date().toISOString()
  // E1: đề Gói 7 hai chặng, 28 câu đúng 18/4/6 (chặng 1: Q0..Q13, chặng 2: Q14..Q27); + 3 câu game ngoài (Q30..) làm TRƯỚC.
  db.prepare('INSERT INTO game_v2_session(id,sbd,json,created_at) VALUES(?,?,?,?)').run('S1', 'E1', JSON.stringify({ goi7: 1, questions: Array.from({ length: 14 }, (_, i) => ({ qid: `Q${i}` })) }), c)
  db.prepare('INSERT INTO game_v2_session(id,sbd,json,created_at) VALUES(?,?,?,?)').run('S2', 'E1', JSON.stringify({ goi7: 1, questions: Array.from({ length: 14 }, (_, i) => ({ qid: `Q${i + 14}~ss1` })) }), c.replace(/Z$/, '1Z'))
  db.prepare('INSERT INTO game_v2_session(id,sbd,json,created_at) VALUES(?,?,?,?)').run('S9', 'E1', JSON.stringify({ mode: 'adventure', questions: [{ qid: 'Q30' }] }), c)
  const sk = db.prepare(`INSERT INTO su_kien_hoc(khoa,sbd,qid,nguon,ma_nguon,ket_qua,luc,ngay_vn) VALUES(?,?,?,?,?,?,?,?)`)
  let k = 0
  for (let i = 30; i < 33; i++) sk.run(`k${k++}`, 'E1', `Q${i}`, 'game', 'S9', 1, `${ngay}T00:00:0${i - 30}Z`, ngay)
  for (let i = 0; i < 28; i++) sk.run(`k${k++}`, 'E1', i < 14 ? `Q${i}` : `Q${i}~ss1`, 'game', i < 14 ? 'S1' : 'S2', 1, `${ngay}T01:${String(i).padStart(2, '0')}:00Z`, ngay)
  // sửa đúng: E1 sai Q5 hôm trước rồi đúng hôm nay (đã có lượt đúng ở trên)
  sk.run(`k${k++}`, 'E1', 'Q5', 'game', 'S0', 0, `2026-11-01T00:00:00Z`, '2026-11-01')
  const g = db.prepare(sub(Q.Q1G!)).all() as Record<string, number>[]
  expect(g[0]).toMatchObject({ em_du_28: 1, dung_18_4_6: 1 })
  const dd = db.prepare(sub(Q.Q1D!)).all() as Record<string, number>[]
  expect(dd[0]).toMatchObject({ de_du_28: 1, de_dung_18_4_6: 1 })
  const b = (db.prepare(sub(Q.Q3B!)).all() as Record<string, unknown>[]).find((x) => x.ngay === ngay)
  expect(b).toMatchObject({ luot_sua_dung: 1, em_sua_dung: 1 })
})
