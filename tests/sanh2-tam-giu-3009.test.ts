// @vitest-environment node
// 30/09: `sanh2` báo số câu CÒN LẠI đang tạm giữ vì ca kiểm tra (`tamGiu: { ca }`) — CHỈ số, không qid, không mã/tên ca.
// Trước đây `tamHoanCauKhoa` bỏ câu khỏi kế hoạch nhưng Sảnh không biết ⇒ "chưa có câu nào" / "24/24 câu kế hoạch" tưởng lỗi.
// D1 thật = node:sqlite (mẫu tests/dao-bao-nham-ca-2909.test.ts).
import { beforeEach, describe, expect, it } from 'vitest'
import { taoD1That } from './_d1-that'
import { gvChienDich } from '../server/src/srs2-gv'
import { layKeHoachHomNay, qidGoc, sanh2 } from '../server/src/srs2-d1'
import { xoaDemCaBaoVe } from '../server/src/game-v2-bank'
import { ghiSuKien, type SuKien } from '../server/src/su-kien-hoc'
import type { Env } from '../server/src/kieu'

const NGAY = 86_400_000

function cauJson(qid: string, phan: 'I' | 'II' | 'III', mucDo: string, dang: string, correct: string) {
  return JSON.stringify({
    qid, maDe: 'DE1', version: 'v1', group: `g-${qid}`, phan, text: `Câu ${qid}`, choices: phan === 'I' ? ['a', 'b', 'c', 'd'] : [], ideas: phan === 'II' ? ['a', 'b', 'c', 'd'] : [],
    hinhAnh: [], dang, tenDang: `Dạng ${dang}`, mucDo, sao: 1, kienThuc: ['k'], correct, reviewed: true, solution: { chot: `Cốt lõi ${qid}` },
  })
}
const dapAn = (i: number) => (i % 4 === 0 ? 'DSDS' : i % 5 === 0 ? '4' : 'B')

function fixture(soCau = 30) {
  const d = taoD1That()
  const env = d.env as unknown as Env
  d.sql.exec("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES('S1','Nguyễn An','12A1','mk1','x')")
  d.sql.exec(`INSERT INTO de_kho(ma_de,ten_de,so_cau,da_xoa,cap_nhat_luc) VALUES('DE1','Ester',${soCau},0,'v1')`)
  d.sql.exec("INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('DE1','v1','x')")
  const st = d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)')
  for (let i = 1; i <= soCau; i++) {
    const phan = i % 4 === 0 ? 'II' : i % 5 === 0 ? 'III' : 'I'
    st.run('DE1', `Q${i}`, 'v1', `g-Q${i}`, `D${i % 3}`, cauJson(`Q${i}`, phan, ['NB', 'TH', 'VD'][i % 3]!, `D${i % 3}`, dapAn(i)))
  }
  d.sql.exec(`INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('game_hoa_2','{"bat":true,"lop":["12A1"]}','x')`)
  return { d, env }
}
async function giao(env: Env) {
  const nay = Date.now()
  const r = await gvChienDich(env, { action: 'tao', ten: 'Ester – Lipid', lop: '12A1', maDe: ['DE1'], hanNop: new Date(nay + 5 * NGAY).toISOString().slice(0, 10) }, nay - 3 * NGAY)
  expect(r.ok).toBe(true)
}
const suKien = (qid: string, msLuc: number): SuKien => ({ nguon: 'game', maNguon: `phien-${qid}-${msLuc}`, sbd: 'S1', qid, lan: 1, ketQua: 1, luc: new Date(msLuc).toISOString() })
/** Ca ĐANG MỞ chứa đúng các câu `qids`. */
function caMo(d: ReturnType<typeof fixture>['d'], qids: string[], nay: number) {
  d.objects.set('de/CA-MO.json', { phanI: qids.map((id) => ({ id, text: id, choices: ['a', 'b', 'c', 'd'], correct: 'B' })), phanII: [], phanIII: [] })
  d.sql.prepare(`INSERT INTO ca(ma_ca,ten_ca,trang_thai,bat_dau,het_han_vao,thoi_gian_phut,loai,cong_bo,bank_r2,cap_nhat_luc) VALUES('CA-MO','Ca giữa kỳ','mo',?,?,45,'thi','ca_lop_xong','de/CA-MO.json',?)`)
    .run(new Date(nay - 60_000).toISOString(), new Date(nay + 30 * 60_000).toISOString(), new Date(nay).toISOString())
  xoaDemCaBaoVe()
}

beforeEach(() => xoaDemCaBaoVe())

describe('sanh2 trả tamGiu khi ca kiểm tra giữ câu còn lại', () => {
  it('không có ca ⇒ không có tamGiu', async () => {
    const { env } = fixture()
    await giao(env)
    const s = await sanh2(env, 'S1', Date.now())
    expect(s).not.toHaveProperty('tamGiu')
  })

  it('ca mở giữ MỌI câu còn lại ⇒ tamGiu.ca = số câu, thể lực 0, không lộ qid / mã / tên ca', async () => {
    const { d, env } = fixture()
    await giao(env)
    const nay = Date.now()
    const { kh } = await layKeHoachHomNay(env, 'S1', nay)
    const con = [...kh.conDao, ...kh.conDoan].map(qidGoc)
    expect(con.length).toBeGreaterThan(0)
    caMo(d, con, nay)
    const s = await sanh2(env, 'S1', nay)
    expect(s.tamGiu).toEqual({ ca: con.length })
    expect(s.theLuc).toMatchObject({ con: 0, tong: 0 })
    const tho = JSON.stringify(s.tamGiu)
    expect(tho).not.toContain('CA-MO')
    expect(tho).not.toContain('Ca giữa kỳ')
    for (const q of con) expect(tho).not.toContain(q)
  })

  it('em làm xong phần còn lại, ca giữ 4 câu ⇒ tamGiu.ca = 4; ca công bố ⇒ hết tamGiu', async () => {
    const { d, env } = fixture()
    await giao(env)
    const nay = Date.now()
    const { kh } = await layKeHoachHomNay(env, 'S1', nay)
    const ds = kh.conDao.map(qidGoc)
    const bon = ds.slice(-4)
    await ghiSuKien(env, ds.filter((q) => !bon.includes(q)).map((q) => suKien(q, nay)))
    caMo(d, bon, nay)
    const s = await sanh2(env, 'S1', nay)
    expect(s.tamGiu).toEqual({ ca: 4 })
    expect(s.theLuc).toMatchObject({ con: 0 })
    d.sql.exec("UPDATE ca SET trang_thai='dong', cong_bo='ngay'"); xoaDemCaBaoVe()
    const sau = await sanh2(env, 'S1', nay)
    expect(sau).not.toHaveProperty('tamGiu')
    expect(sau.theLuc).toMatchObject({ con: 4 })
  })
})
