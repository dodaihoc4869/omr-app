// @vitest-environment node
// THẦY BÁO 30/09 (hai ảnh cùng một vùng):
//   (1) Sảnh "Bi-a Phản Ứng · còn 10/18 câu": vào bàn, CHƯA trả lời câu nào, thoát ra (app tải lại / đóng app / Về) ⇒ mất 8 câu (18 → 10).
//       Gốc: số "còn" trừ cả câu đang nằm trên bàn Bi-a còn mở của em (7 bi + Câu chốt = 8). Sửa: Sảnh chỉ trừ câu ĐÃ trả lời.
//   (2) "Bi a đang chơi thoát luôn": máy chủ đóng bàn Bi-a theo GIỜ TẠO (> 30 phút) khi em mở Đảo/Đoàn ⇒ ván dài đang chơi bị đóng.
//       Sửa: chỉ đóng bàn KHÔNG hoạt động quá 15 phút (hoạt động = trả lời câu, `bia-giu-ban` mỗi 3 phút của màn chơi, giờ tạo).
// D1 thật (node:sqlite, lược đồ đủ migration) — cùng bộ đồ nghề với tests/dao-bao-nham-ca-2909.test.ts.
import { beforeEach, describe, expect, it } from 'vitest'
import { taoD1That } from './_d1-that'
import { gvChienDich } from '../server/src/srs2-gv'
import { layKeHoachHomNay, qidGoc } from '../server/src/srs2-d1'
import { startDao2, HAN_GIU_BAN_BIA_MS } from '../server/src/srs2-game'
import { biaAction, biaChoSanh } from '../server/src/bi-a'
import { gameV2 } from '../server/src/game-v2'
import { gameToken } from '../server/src/game-v2-auth'
import { xoaDemCaBaoVe } from '../server/src/game-v2-bank'
import { ghiSuKien } from '../server/src/su-kien-hoc'
import type { Env } from '../server/src/kieu'

const NGAY = 86_400_000
function cauJson(qid: string, phan: 'I' | 'II' | 'III', mucDo: string, dang: string, correct: string) {
  return JSON.stringify({
    qid, maDe: 'DE1', version: 'v1', group: `g-${qid}`, phan, text: `Câu ${qid}`, choices: phan === 'I' ? ['a', 'b', 'c', 'd'] : [], ideas: phan === 'II' ? ['a', 'b', 'c', 'd'] : [],
    hinhAnh: [], dang, tenDang: `Dạng ${dang}`, mucDo, sao: 1, kienThuc: ['k'], correct, reviewed: true, solution: { chot: `Cốt lõi ${qid}` },
  })
}
const dapAn = (i: number) => (i % 4 === 0 ? 'DSDS' : i % 5 === 0 ? '4' : 'B')
function fixture(soCau = 45) {
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
  d.sql.exec(`INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('bi_a','{"bat":true,"lop":["12A1"]}','x')`)
  return { d, env }
}
async function giao(env: Env) {
  const nay = Date.now()
  const r = await gvChienDich(env, { action: 'tao', ten: 'Ester – Lipid', lop: '12A1', maDe: ['DE1'], hanNop: new Date(nay + 5 * NGAY).toISOString().slice(0, 10) }, nay - 3 * NGAY)
  expect(r.ok).toBe(true)
}
const tran = (s: Record<string, unknown>) => s.tran as { con: number; tong: number }
const trenBan = (b: Record<string, unknown>) => [...(b.bi as { qid: string }[]), b.chot as { qid: string }].filter(Boolean).map((q) => q.qid)
const qidsCua = (r: Record<string, unknown>) => ((r.questions as { qid: string }[]) ?? []).map((q) => q.qid)

beforeEach(() => xoaDemCaBaoVe())

describe('ẢNH THẦY 30/09: vào bàn, chưa trả lời câu nào, thoát ⇒ Sảnh vẫn đủ số câu', () => {
  it('X/X → vào bàn (8 câu lên bàn) → thoát không kết ván (app tải lại / đóng app) ⇒ Sảnh Bi-a và cửa Sảnh Bát Linh vẫn X/X (ảnh: 18 → 10)', async () => {
    const { env } = fixture()
    await giao(env)
    const nay = Date.now()
    const truoc = await biaAction(env, 'S1', 'bia-sanh', {}, nay)
    const X = tran(truoc).tong
    expect(X).toBeGreaterThan(8)
    expect(tran(truoc)).toMatchObject({ con: X, tong: X })
    const ban = await biaAction(env, 'S1', 'bia-xep-ban', { loai: 'ai', cheDo: 'don', soBi: 7 }, nay)
    expect(trenBan(ban)).toHaveLength(8)
    const sau = await biaAction(env, 'S1', 'bia-sanh', {}, nay + 60_000)
    expect(tran(sau)).toMatchObject({ con: X, tong: X }) // trước khi sửa: X − 8
    expect(await biaChoSanh(env, 'S1', nay + 60_000)).toMatchObject({ con: X, tong: X })
  })
  it('câu ĐÃ trả lời vẫn trừ; vào lại bàn nhận lại ĐÚNG các câu cũ theo thứ tự kế hoạch (không lách né câu khó)', async () => {
    const { env } = fixture()
    await giao(env)
    const nay = Date.now()
    const X = tran(await biaAction(env, 'S1', 'bia-sanh', {}, nay)).tong
    const ban1 = await biaAction(env, 'S1', 'bia-xep-ban', { loai: 'ai', cheDo: 'don', soBi: 7 }, nay)
    const q1 = trenBan(ban1)
    const token = await gameToken(env, 'S1')
    const daLam = (ban1.bi as { qid: string }[])[0]!.qid
    await gameV2(env, 'answer', { token, session: String(ban1.session), qid: daLam, answer: dapAn(Number(daLam.slice(1))), assisted: false })
    expect(tran(await biaAction(env, 'S1', 'bia-sanh', {}, nay + 60_000))).toMatchObject({ con: X - 1, tong: X })
    // thoát (không kết ván) rồi vào lại: 7 câu chưa trả lời của bàn cũ quay lại, Câu chốt vẫn là câu cũ, câu đã làm không lên lại
    const ban2 = await biaAction(env, 'S1', 'bia-xep-ban', { loai: 'ai', cheDo: 'don', soBi: 7 }, nay + 120_000)
    const q2 = trenBan(ban2)
    expect((ban2.chot as { qid: string }).qid).toBe((ban1.chot as { qid: string }).qid)
    expect(q2).not.toContain(daLam)
    for (const q of q1.filter((x) => x !== daLam)) expect(q2).toContain(q)
  })
})

describe('Máy chủ không đóng bàn đang có người chơi (hoạt động gần nhất, không theo giờ tạo)', () => {
  it('ván dài: bàn tạo 40 phút trước nhưng màn chơi vừa báo "còn ở bàn" ⇒ mở Đảo KHÔNG đóng bàn; bỏ bàn quá hạn thì mới nhả câu', async () => {
    const { d, env } = fixture(30)
    await giao(env)
    const nay = Date.now()
    const ban = await biaAction(env, 'S1', 'bia-xep-ban', { loai: 'ai', cheDo: 'don', soBi: 7 }, nay - 40 * 60_000)
    const giu = trenBan(ban).slice(0, 4)
    const { kh } = await layKeHoachHomNay(env, 'S1', nay)
    const khac = kh.conDao.map(qidGoc).filter((q) => !giu.includes(q))
    await ghiSuKien(env, khac.map((q) => ({ nguon: 'game', maNguon: `p-${q}`, sbd: 'S1', qid: q, lan: 1, ketQua: 1, luc: new Date(nay).toISOString() })))
    expect(await biaAction(env, 'S1', 'bia-giu-ban', { session: ban.session }, nay - 60_000)).toMatchObject({ ok: true, conMo: true })
    const dao = await startDao2(env, 'S1', nay)
    expect(dao.lyDo).toBe('cau_dang_o_bia') // trước khi sửa: bàn > 30 phút bị đóng ngay dù em đang chơi
    expect(d.dem('game_v2_session', `id='${ban.session}' AND json_extract(json,'$.dong')=1`)).toBe(0)
    // em bỏ bàn: không hoạt động quá hạn ⇒ nhả câu cho Đảo
    const sau = await startDao2(env, 'S1', nay + HAN_GIU_BAN_BIA_MS + 60_000)
    expect(qidsCua(sau).sort()).toEqual([...giu].sort())
    expect(d.dem('game_v2_session', `id='${ban.session}' AND json_extract(json,'$.dong')=1`)).toBe(1)
  })
  it('trả lời câu trên bàn cũng là hoạt động; bia-giu-ban vào phiên đã đóng / phiên người khác ⇒ conMo:false', async () => {
    const { env } = fixture(30)
    await giao(env)
    const nay = Date.now()
    const ban = await biaAction(env, 'S1', 'bia-xep-ban', { loai: 'ai', cheDo: 'don', soBi: 7 }, nay - 40 * 60_000)
    expect(await biaAction(env, 'S1', 'bia-giu-ban', { session: 'khong-co' }, nay)).toMatchObject({ conMo: false })
    await biaAction(env, 'S1', 'bia-ket-van', { van: ban.van, ketQua: { lyDo: 'bo', diem: [0, 0] }, ghe: [] }, nay)
    expect(await biaAction(env, 'S1', 'bia-giu-ban', { session: ban.session }, nay)).toMatchObject({ conMo: false })
  })
})
